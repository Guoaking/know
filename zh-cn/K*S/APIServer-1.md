# APIServer

> 代码块篇幅有限, 从完整代码中截取部分,也是为了去除干扰





>
>
>APIServer的总体启动流程分为这几个步骤:
>
>1. 资源注册
>2. 默认配置初始化
>3. 注册server chain组
>4. 启动服务



```go
func startStatefulSetController(ctx context.Context, controllerContext ControllerContext) (controller.Interface, bool, error) {
	go statefulset.NewStatefulSetController(
		controllerContext.InformerFactory.Core().V1().Pods(),
		controllerContext.InformerFactory.Apps().V1().StatefulSets(),
		controllerContext.InformerFactory.Core().V1().PersistentVolumeClaims(),
		controllerContext.InformerFactory.Apps().V1().ControllerRevisions(),

	).Run(ctx, int(controllerContext.ComponentConfig.StatefulSetController.ConcurrentStatefulSetSyncs))
	return nil, true, nil
}
```





`kubernetes/cmd/kube-apiserver/app/server.go`

>



 ```go
 func Run(completeOptions completedServerRunOptions, stopCh <-chan struct{}) error {
 	// To help debugging, immediately log version
 	klog.Infof("Version: %+v", version.Get())

 	//server chain组创建完成
 	server, err := CreateServerChain(completeOptions, stopCh)

 	//启动web服务环节
 	prepared, err := server.PrepareRun()

 	return prepared.Run(stopCh)
 }

 // --------------------------------------------------func 分割线-----------------------------------------------
 // CreateServerChain creates the apiservers connected via delegation.
 // CreateServerChain创建通过委托连接的apiserver。
 func CreateServerChain(completedOptions completedServerRunOptions, stopCh <-chan struct{}) (*aggregatorapiserver.APIAggregator, error) {

 	// 这
 	kubeAPIServerConfig, serviceResolver, pluginInitializer, err := CreateKubeAPIServerConfig(completedOptions)


 	// If additional API servers are added, they should be gated.

 	// 初始化APIExtensionsConfig  为CRD服务
 	apiExtensionsConfig, err := createAPIExtensionsConfig(*kubeAPIServerConfig.GenericConfig, kubeAPIServerConfig.ExtraConfig.VersionedInformers, pluginInitializer, completedOptions.ServerRunOptions, completedOptions.MasterCount,
 		serviceResolver, webhook.NewDefaultAuthenticationInfoResolverWrapper(kubeAPIServerConfig.ExtraConfig.ProxyTransport, kubeAPIServerConfig.GenericConfig.EgressSelector, kubeAPIServerConfig.GenericConfig.LoopbackClientConfig, kubeAPIServerConfig.GenericConfig.TracerProvider))


 	notFoundHandler := notfoundhandler.New(kubeAPIServerConfig.GenericConfig.Serializer, genericapifilters.NoMuxAndDiscoveryIncompleteKey)
 	// 初始化APIExtensionsServer  为CRD服务
 	apiExtensionsServer, err := createAPIExtensionsServer(apiExtensionsConfig, genericapiserver.NewEmptyDelegateWithCustomHandler(notFoundHandler))


 	//启动中,
 	// 创建kube APIServer (master APIServer)
 	kubeAPIServer, err := CreateKubeAPIServer(kubeAPIServerConfig, apiExtensionsServer.GenericAPIServer)


 	// aggregator comes last in the chain
 	// 创建AggregatorServer   group换成了apiregistration.k8s.io
 	aggregatorConfig, err := createAggregatorConfig(*kubeAPIServerConfig.GenericConfig, completedOptions.ServerRunOptions, kubeAPIServerConfig.ExtraConfig.VersionedInformers, serviceResolver, kubeAPIServerConfig.ExtraConfig.ProxyTransport, pluginInitializer)

 	aggregatorServer, err := createAggregatorServer(aggregatorConfig, kubeAPIServer.GenericAPIServer, apiExtensionsServer.Informers)


 	return aggregatorServer, nil
 }


 // --------------------------------------------------func 分割线-----------------------------------------------

 // CreateKubeAPIServerConfig creates all the resources for running the API server, but runs none of them
 // CreateKubeAPIServerConfig为运行API服务器创建了所有资源，但没有运行它们
 func CreateKubeAPIServerConfig(s completedServerRunOptions) (
 	*controlplane.Config,
 	aggregatorapiserver.ServiceResolver,
 	[]admission.PluginInitializer,
 	error,
 ) {
 	proxyTransport := CreateProxyTransport()

 	// APIServer因其模块众多，相应的配置参数也非常之多，分类一下：
 	//
 	//genericConfig 通用配置
 	//OpenAPI配置
 	//Storage (etcd)配置
 	//Authentication 认证配置
 	//Authorization 授权配置
 	genericConfig, versionedInformers, serviceResolver, pluginInitializers, admissionPostStartHook, storageFactory, err := buildGenericConfig(s.ServerRunOptions, proxyTransport)


 	capabilities.Initialize(capabilities.Capabilities{
 		AllowPrivileged: s.AllowPrivileged,
 		// TODO(vmarmol): Implement support for HostNetworkSources.
 		PrivilegedSources: capabilities.PrivilegedSources{
 			HostNetworkSources: []string{},
 			HostPIDSources:     []string{},
 			HostIPCSources:     []string{},
 		},
 		PerConnectionBandwidthLimitBytesPerSec: s.MaxConnectionBytesPerSec,
 	})

 	s.Metrics.Apply()
 	serviceaccount.RegisterMetrics()

 	config := &controlplane.Config{
 		GenericConfig: genericConfig,
 		ExtraConfig: controlplane.ExtraConfig{
 			APIResourceConfigSource: storageFactory.APIResourceConfigSource,
 			StorageFactory:          storageFactory,
 			EventTTL:                s.EventTTL,
 			KubeletClientConfig:     s.KubeletConfig,
 			EnableLogsSupport:       s.EnableLogsHandler,
 			ProxyTransport:          proxyTransport,

 			ServiceIPRange:          s.PrimaryServiceClusterIPRange,
 			APIServerServiceIP:      s.APIServerServiceIP,
 			SecondaryServiceIPRange: s.SecondaryServiceClusterIPRange,

 			APIServerServicePort: 443,

 			ServiceNodePortRange:      s.ServiceNodePortRange,
 			KubernetesServiceNodePort: s.KubernetesServiceNodePort,

 			EndpointReconcilerType: reconcilers.Type(s.EndpointReconcilerType),
 			MasterCount:            s.MasterCount,

 			ServiceAccountIssuer:        s.ServiceAccountIssuer,
 			ServiceAccountMaxExpiration: s.ServiceAccountTokenMaxExpiration,
 			ExtendExpiration:            s.Authentication.ServiceAccounts.ExtendExpiration,

 			VersionedInformers: versionedInformers,

 			IdentityLeaseDurationSeconds:      s.IdentityLeaseDurationSeconds,
 			IdentityLeaseRenewIntervalSeconds: s.IdentityLeaseRenewIntervalSeconds,
 		},
 	}

 	clientCAProvider, err := s.Authentication.ClientCert.GetClientCAContentProvider()

 	config.ExtraConfig.ClusterAuthenticationInfo.ClientCA = clientCAProvider

 	requestHeaderConfig, err := s.Authentication.RequestHeader.ToAuthenticationRequestHeaderConfig()

 	if requestHeaderConfig != nil {
 		config.ExtraConfig.ClusterAuthenticationInfo.RequestHeaderCA = requestHeaderConfig.CAContentProvider
 		config.ExtraConfig.ClusterAuthenticationInfo.RequestHeaderAllowedNames = requestHeaderConfig.AllowedClientNames
 		config.ExtraConfig.ClusterAuthenticationInfo.RequestHeaderExtraHeaderPrefixes = requestHeaderConfig.ExtraHeaderPrefixes
 		config.ExtraConfig.ClusterAuthenticationInfo.RequestHeaderGroupHeaders = requestHeaderConfig.GroupHeaders
 		config.ExtraConfig.ClusterAuthenticationInfo.RequestHeaderUsernameHeaders = requestHeaderConfig.UsernameHeaders
 	}

 	if err := config.GenericConfig.AddPostStartHook("start-kube-apiserver-admission-initializer", admissionPostStartHook);

 	if config.GenericConfig.EgressSelector != nil {
 		// Use the config.GenericConfig.EgressSelector lookup to find the dialer to connect to the kubelet
 		config.ExtraConfig.KubeletClientConfig.Lookup = config.GenericConfig.EgressSelector.Lookup

 		// Use the config.GenericConfig.EgressSelector lookup as the transport used by the "proxy" subresources.
 		networkContext := egressselector.Cluster.AsNetworkContext()
 		dialer, err := config.GenericConfig.EgressSelector.Lookup(networkContext)

 		c := proxyTransport.Clone()
 		c.DialContext = dialer
 		config.ExtraConfig.ProxyTransport = c
 	}

 	// Load the public keys.
 	var pubKeys []interface{}
 	for _, f := range s.Authentication.ServiceAccounts.KeyFiles {
 		keys, err := keyutil.PublicKeysFromFile(f)

 		pubKeys = append(pubKeys, keys...)
 	}
 	// Plumb the required metadata through ExtraConfig.
 	config.ExtraConfig.ServiceAccountIssuerURL = s.Authentication.ServiceAccounts.Issuers[0]
 	config.ExtraConfig.ServiceAccountJWKSURI = s.Authentication.ServiceAccounts.JWKSURI
 	config.ExtraConfig.ServiceAccountPublicKeys = pubKeys

 	return config, serviceResolver, pluginInitializers, nil
 }

 // --------------------------------------------------func 分割线-----------------------------------------------

 // BuildGenericConfig takes the master server options and produces the genericapiserver.Config associated with it
 // BuildGenericConfig接受主服务器选项并生成genericapiserver。与之关联的配置
 // APIServer因其模块众多，相应的配置参数也非常之多，分类一下：
 //
 //genericConfig 通用配置
 //OpenAPI配置
 //Storage (etcd)配置
 //Authentication 认证配置
 //Authorization 授权配置
 func buildGenericConfig(
 	s *options.ServerRunOptions,
 	proxyTransport *http.Transport,
 ) (
 	genericConfig *genericapiserver.Config,
 	versionedInformers clientgoinformers.SharedInformerFactory,
 	serviceResolver aggregatorapiserver.ServiceResolver,
 	pluginInitializers []admission.PluginInitializer,
 	admissionPostStartHook genericapiserver.PostStartHookFunc,
 	storageFactory *serverstorage.DefaultStorageFactory,
 	lastErr error,
 ) {

 	// 通用配置
 	genericConfig = genericapiserver.NewConfig(legacyscheme.Codecs)
 	// DefaultAPIResourceConfigSource() 用来启用, 禁用默认的GV 及其之下Resources
 	genericConfig.MergedResourceConfig = controlplane.DefaultAPIResourceConfigSource()

 	if lastErr = s.GenericServerRunOptions.ApplyTo(genericConfig);

 	if lastErr = s.SecureServing.ApplyTo(&genericConfig.SecureServing, &genericConfig.LoopbackClientConfig);
 	if lastErr = s.Features.ApplyTo(genericConfig);
 	if lastErr = s.APIEnablement.ApplyTo(genericConfig, controlplane.DefaultAPIResourceConfigSource(), legacyscheme.Scheme);
 	if lastErr = s.EgressSelector.ApplyTo(genericConfig);
 	if utilfeature.DefaultFeatureGate.Enabled(genericfeatures.APIServerTracing) {
 		if lastErr = s.Traces.ApplyTo(genericConfig.EgressSelector, genericConfig);
 	}
 	// wrap the definitions to revert any changes from disabled features
 	// OpenAPI 配置  DefaultOpenAPIConfig()
 	getOpenAPIDefinitions := openapi.GetOpenAPIDefinitionsWithoutDisabledFeatures(generatedopenapi.GetOpenAPIDefinitions)
 	genericConfig.OpenAPIConfig = genericapiserver.DefaultOpenAPIConfig(getOpenAPIDefinitions, openapinamer.NewDefinitionNamer(legacyscheme.Scheme, extensionsapiserver.Scheme, aggregatorscheme.Scheme))
 	genericConfig.OpenAPIConfig.Info.Title = "Kubernetes"
 	genericConfig.LongRunningFunc = filters.BasicLongRunningRequestCheck(
 		sets.NewString("watch", "proxy"),
 		sets.NewString("attach", "exec", "proxy", "log", "portforward"),
 	)

 	kubeVersion := version.Get()
 	genericConfig.Version = &kubeVersion

 	// Storage(etcd) 配置
 	// 实例化 etcd storage 对象, 定义etcd 地址, 认证, 存储路径, prefix等信息
 	storageFactoryConfig := kubeapiserver.NewStorageFactoryConfig()
 	storageFactoryConfig.APIResourceConfig = genericConfig.MergedResourceConfig
 	completedStorageFactoryConfig, err := storageFactoryConfig.Complete(s.Etcd)

 	storageFactory, lastErr = completedStorageFactoryConfig.New()

 	if genericConfig.EgressSelector != nil {
 		storageFactory.StorageConfig.Transport.EgressLookup = genericConfig.EgressSelector.Lookup
 	}
 	if utilfeature.DefaultFeatureGate.Enabled(genericfeatures.APIServerTracing) && genericConfig.TracerProvider != nil {
 		storageFactory.StorageConfig.Transport.TracerProvider = genericConfig.TracerProvider
 	}
 	if lastErr = s.Etcd.ApplyWithStorageFactoryTo(storageFactory, genericConfig);

 	// Use protobufs for self-communication.
 	// Since not every generic apiserver has to support protobufs, we
 	// cannot default to it in generic apiserver and need to explicitly
 	// set it in kube-apiserver.
 	genericConfig.LoopbackClientConfig.ContentConfig.ContentType = "application/vnd.kubernetes.protobuf"
 	// Disable compression for self-communication, since we are going to be
 	// on a fast local network
 	genericConfig.LoopbackClientConfig.DisableCompression = true

 	kubeClientConfig := genericConfig.LoopbackClientConfig
 	clientgoExternalClient, err := clientgoclientset.NewForConfig(kubeClientConfig)

 	versionedInformers = clientgoinformers.NewSharedInformerFactory(clientgoExternalClient, 10*time.Minute)

 	// Authentication.ApplyTo requires already applied OpenAPIConfig and EgressSelector if present
 	// Authentication 认证配置
 	// 会被实例化为一个Authenticator认证器, 被封装进http.Handler 函数来接受和处理客户端的认证请求
 	if lastErr = s.Authentication.ApplyTo(&genericConfig.Authentication, genericConfig.SecureServing, genericConfig.EgressSelector, genericConfig.OpenAPIConfig, clientgoExternalClient, versionedInformers);

 	// 授权配置
 	genericConfig.Authorization.Authorizer, genericConfig.RuleResolver, err = BuildAuthorizer(s, genericConfig.EgressSelector, versionedInformers)

 	if !sets.NewString(s.Authorization.Modes...).Has(modes.ModeRBAC) {
 		genericConfig.DisabledPostStartHooks.Insert(rbacrest.PostStartHookName)
 	}

 	lastErr = s.Audit.ApplyTo(genericConfig)

 	admissionConfig := &kubeapiserveradmission.Config{
 		ExternalInformers:    versionedInformers,
 		LoopbackClientConfig: genericConfig.LoopbackClientConfig,
 		CloudConfigFile:      s.CloudProvider.CloudConfigFile,
 	}
 	serviceResolver = buildServiceResolver(s.EnableAggregatorRouting, genericConfig.LoopbackClientConfig.Host, versionedInformers)
 	pluginInitializers, admissionPostStartHook, err = admissionConfig.New(proxyTransport, genericConfig.EgressSelector, serviceResolver, genericConfig.TracerProvider)


 	err = s.Admission.ApplyTo(
 		genericConfig,
 		versionedInformers,
 		kubeClientConfig,
 		utilfeature.DefaultFeatureGate,
 		pluginInitializers...)


 	if utilfeature.DefaultFeatureGate.Enabled(genericfeatures.APIPriorityAndFairness) && s.GenericServerRunOptions.EnablePriorityAndFairness {
 		genericConfig.FlowControl, lastErr = BuildPriorityAndFairness(s, clientgoExternalClient, versionedInformers)
 	}

 	return
 }



 // --------------------------------------------------func 分割线-----------------------------------------------

 // CreateKubeAPIServer creates and wires a workable kube-apiserver
 // 创建Kube APIServer (master apiserver)
 func CreateKubeAPIServer(kubeAPIServerConfig *controlplane.Config, delegateAPIServer genericapiserver.DelegationTarget) (*controlplane.Instance, error) {
 	// 创建Kube APIServer (master apiserver)
 	kubeAPIServer, err := kubeAPIServerConfig.Complete().New(delegateAPIServer)


 	return kubeAPIServer, nil
 }


 // --------------------------------------------------func 分割线-----------------------------------------------



 ```







`/Users/bytedance/GO/src/k8s.io/kubernetes/vendor/k8s.io/apiserver/pkg/server/config.go`



> genericConfig 通用配置

```go
// NewConfig returns a Config struct with the default values
// genericConfig 通用配置
func NewConfig(codecs serializer.CodecFactory) *Config {
	defaultHealthChecks := []healthz.HealthChecker{healthz.PingHealthz, healthz.LogHealthz}
	var id string
	if feature.DefaultFeatureGate.Enabled(features.APIServerIdentity) {
		id = "kube-apiserver-" + uuid.New().String()
	}
	lifecycleSignals := newLifecycleSignals()

	return &Config{
		Serializer:                  codecs,
		BuildHandlerChainFunc:       DefaultBuildHandlerChain,
		HandlerChainWaitGroup:       new(utilwaitgroup.SafeWaitGroup),
		LegacyAPIGroupPrefixes:      sets.NewString(DefaultLegacyAPIPrefix),
		DisabledPostStartHooks:      sets.NewString(),
		PostStartHooks:              map[string]PostStartHookConfigEntry{},
		HealthzChecks:               append([]healthz.HealthChecker{}, defaultHealthChecks...),
		ReadyzChecks:                append([]healthz.HealthChecker{}, defaultHealthChecks...),
		LivezChecks:                 append([]healthz.HealthChecker{}, defaultHealthChecks...),
		EnableIndex:                 true,
		EnableDiscovery:             true,
		EnableProfiling:             true,
		EnableMetrics:               true,
		MaxRequestsInFlight:         400,
		MaxMutatingRequestsInFlight: 200,
		RequestTimeout:              time.Duration(60) * time.Second,
		MinRequestTimeout:           1800,
		LivezGracePeriod:            time.Duration(0),
		ShutdownDelayDuration:       time.Duration(0),
		// 1.5MB is the default client request size in bytes
		// the etcd server should accept. See
		// https://github.com/etcd-io/etcd/blob/release-3.4/embed/config.go#L56.
		// A request body might be encoded in json, and is converted to
		// proto when persisted in etcd, so we allow 2x as the largest size
		// increase the "copy" operations in a json patch may cause.
		JSONPatchMaxCopyBytes: int64(3 * 1024 * 1024),
		// 1.5MB is the recommended client request size in byte
		// the etcd server should accept. See
		// https://github.com/etcd-io/etcd/blob/release-3.4/embed/config.go#L56.
		// A request body might be encoded in json, and is converted to
		// proto when persisted in etcd, so we allow 2x as the largest request
		// body size to be accepted and decoded in a write request.
		MaxRequestBodyBytes: int64(3 * 1024 * 1024),

		// Default to treating watch as a long-running operation
		// Generic API servers have no inherent long-running subresources
		LongRunningFunc:           genericfilters.BasicLongRunningRequestCheck(sets.NewString("watch"), sets.NewString()),
		lifecycleSignals:          lifecycleSignals,
		StorageObjectCountTracker: flowcontrolrequest.NewStorageObjectCountTracker(lifecycleSignals.ShutdownInitiated.Signaled()),

		APIServerID:           id,
		StorageVersionManager: storageversion.NewDefaultManager(),
	}
}


// OPENAPI 配置
func DefaultOpenAPIConfig(getDefinitions openapicommon.GetOpenAPIDefinitions, defNamer *apiopenapi.DefinitionNamer) *openapicommon.Config {
	return &openapicommon.Config{
		ProtocolList:   []string{"https"},
		IgnorePrefixes: []string{},
		Info: &spec.Info{
			InfoProps: spec.InfoProps{
				Title: "Generic API Server",
			},
		},
		DefaultResponse: &spec.Response{
			ResponseProps: spec.ResponseProps{
				Description: "Default Response.",
			},
		},
		GetOperationIDAndTags: apiopenapi.GetOperationIDAndTags,
		GetDefinitionName:     defNamer.GetDefinitionName,
		GetDefinitions:        getDefinitions,
	}
}
```





`kubernetes/pkg/kubeapiserver/options/authentication.go`



```
// ApplyTo requires already applied OpenAPIConfig and EgressSelector if present.
func (o *BuiltInAuthenticationOptions) ApplyTo(authInfo *genericapiserver.AuthenticationInfo, secureServing *genericapiserver.SecureServingInfo, egressSelector *egressselector.EgressSelector, openAPIConfig *openapicommon.Config, extclient kubernetes.Interface, versionedInformer informers.SharedInformerFactory) error {
	if o == nil {
		return nil
	}

	if openAPIConfig == nil {
		return errors.New("uninitialized OpenAPIConfig")
	}

	authenticatorConfig, err := o.ToAuthenticationConfig()
	if err != nil {
		return err
	}

	if authenticatorConfig.ClientCAContentProvider != nil {
		if err = authInfo.ApplyClientCert(authenticatorConfig.ClientCAContentProvider, secureServing); err != nil {
			return fmt.Errorf("unable to load client CA file: %v", err)
		}
	}
	if authenticatorConfig.RequestHeaderConfig != nil && authenticatorConfig.RequestHeaderConfig.CAContentProvider != nil {
		if err = authInfo.ApplyClientCert(authenticatorConfig.RequestHeaderConfig.CAContentProvider, secureServing); err != nil {
			return fmt.Errorf("unable to load client CA file: %v", err)
		}
	}

	authInfo.APIAudiences = o.APIAudiences
	if o.ServiceAccounts != nil && len(o.ServiceAccounts.Issuers) != 0 && len(o.APIAudiences) == 0 {
		authInfo.APIAudiences = authenticator.Audiences(o.ServiceAccounts.Issuers)
	}

	authenticatorConfig.ServiceAccountTokenGetter = serviceaccountcontroller.NewGetterFromClient(
		extclient,
		versionedInformer.Core().V1().Secrets().Lister(),
		versionedInformer.Core().V1().ServiceAccounts().Lister(),
		versionedInformer.Core().V1().Pods().Lister(),
	)

	authenticatorConfig.BootstrapTokenAuthenticator = bootstrap.NewTokenAuthenticator(
		versionedInformer.Core().V1().Secrets().Lister().Secrets(metav1.NamespaceSystem),
	)

	if egressSelector != nil {
		egressDialer, err := egressSelector.Lookup(egressselector.ControlPlane.AsNetworkContext())
		if err != nil {
			return err
		}
		authenticatorConfig.CustomDial = egressDialer
	}

	//APIServer支持如下的认证策略：
	//
	//X509 Client Certs
	//
	//Static Token File
	//
	//Bootstrap Tokens
	//
	//Service Account Tokens
	//
	//OpenID Connect Tokens(OIDC)
	//
	//Webhook Token Authentication
	//
	//Authenticating Proxy
	authInfo.Authenticator, openAPIConfig.SecurityDefinitions, err = authenticatorConfig.New()
	if err != nil {
		return err
	}

	return nil
}
```





`kubernetes/pkg/kubeapiserver/authenticator/config.go`



```go

// New returns an authenticator.Request or an error that supports the standard
// Kubernetes authentication mechanisms.
func (config Config) New() (authenticator.Request, *spec.SecurityDefinitions, error) {
	var authenticators []authenticator.Request
	var tokenAuthenticators []authenticator.Token
	securityDefinitions := spec.SecurityDefinitions{}

	// front-proxy, BasicAuth methods, local first, then remote
	// Add the front proxy authenticator if requested
	//RequestHeader
	if config.RequestHeaderConfig != nil {
		requestHeaderAuthenticator := headerrequest.NewDynamicVerifyOptionsSecure(
			config.RequestHeaderConfig.CAContentProvider.VerifyOptions,
			config.RequestHeaderConfig.AllowedClientNames,
			config.RequestHeaderConfig.UsernameHeaders,
			config.RequestHeaderConfig.GroupHeaders,
			config.RequestHeaderConfig.ExtraHeaderPrefixes,
		)
		authenticators = append(authenticators, authenticator.WrapAudienceAgnosticRequest(config.APIAudiences, requestHeaderAuthenticator))
	}

	// X509 methods
	if config.ClientCAContentProvider != nil {
		certAuth := x509.NewDynamic(config.ClientCAContentProvider.VerifyOptions, x509.CommonNameUserConversion)
		authenticators = append(authenticators, certAuth)
	}

	// Bearer token methods, local first, then remote
	if len(config.TokenAuthFile) > 0 {
		tokenAuth, err := newAuthenticatorFromTokenFile(config.TokenAuthFile)
		if err != nil {
			return nil, nil, err
		}
		tokenAuthenticators = append(tokenAuthenticators, authenticator.WrapAudienceAgnosticToken(config.APIAudiences, tokenAuth))
	}
	if len(config.ServiceAccountKeyFiles) > 0 {
		serviceAccountAuth, err := newLegacyServiceAccountAuthenticator(config.ServiceAccountKeyFiles, config.ServiceAccountLookup, config.APIAudiences, config.ServiceAccountTokenGetter)
		if err != nil {
			return nil, nil, err
		}
		tokenAuthenticators = append(tokenAuthenticators, serviceAccountAuth)
	}
	if len(config.ServiceAccountIssuers) > 0 {
		serviceAccountAuth, err := newServiceAccountAuthenticator(config.ServiceAccountIssuers, config.ServiceAccountKeyFiles, config.APIAudiences, config.ServiceAccountTokenGetter)
		if err != nil {
			return nil, nil, err
		}
		tokenAuthenticators = append(tokenAuthenticators, serviceAccountAuth)
	}
	if config.BootstrapToken {
		if config.BootstrapTokenAuthenticator != nil {
			// TODO: This can sometimes be nil because of
			tokenAuthenticators = append(tokenAuthenticators, authenticator.WrapAudienceAgnosticToken(config.APIAudiences, config.BootstrapTokenAuthenticator))
		}
	}
	// NOTE(ericchiang): Keep the OpenID Connect after
	//Service Accounts.
	// Because both plugins verify JWTs whichever comes first in the union experiences
	// cache misses for all requests using the other. While the service account plugin
	// simply returns an error, the OpenID Connect plugin may query the provider to
	// update the keys, causing performance hits.
	if len(config.OIDCIssuerURL) > 0 && len(config.OIDCClientID) > 0 {
		// TODO(enj): wire up the Notifier and ControllerRunner bits when OIDC supports CA reload
		var oidcCAContent oidc.CAContentProvider
		if len(config.OIDCCAFile) != 0 {
			var oidcCAErr error
			oidcCAContent, oidcCAErr = dynamiccertificates.NewDynamicCAContentFromFile("oidc-authenticator", config.OIDCCAFile)
			if oidcCAErr != nil {
				return nil, nil, oidcCAErr
			}
		}

		//OIDC
		oidcAuth, err := newAuthenticatorFromOIDCIssuerURL(oidc.Options{
			IssuerURL:            config.OIDCIssuerURL,
			ClientID:             config.OIDCClientID,
			CAContentProvider:    oidcCAContent,
			UsernameClaim:        config.OIDCUsernameClaim,
			UsernamePrefix:       config.OIDCUsernamePrefix,
			GroupsClaim:          config.OIDCGroupsClaim,
			GroupsPrefix:         config.OIDCGroupsPrefix,
			SupportedSigningAlgs: config.OIDCSigningAlgs,
			RequiredClaims:       config.OIDCRequiredClaims,
		})
		if err != nil {
			return nil, nil, err
		}
		tokenAuthenticators = append(tokenAuthenticators, authenticator.WrapAudienceAgnosticToken(config.APIAudiences, oidcAuth))
	}
	// webhook
	if len(config.WebhookTokenAuthnConfigFile) > 0 {
		webhookTokenAuth, err := newWebhookTokenAuthenticator(config)
		if err != nil {
			return nil, nil, err
		}

		tokenAuthenticators = append(tokenAuthenticators, webhookTokenAuth)
	}

	if len(tokenAuthenticators) > 0 {
		// Union the token authenticators
		tokenAuth := tokenunion.New(tokenAuthenticators...)
		// Optionally cache authentication results
		if config.TokenSuccessCacheTTL > 0 || config.TokenFailureCacheTTL > 0 {
			tokenAuth = tokencache.New(tokenAuth, true, config.TokenSuccessCacheTTL, config.TokenFailureCacheTTL)
		}
		authenticators = append(authenticators, bearertoken.New(tokenAuth), websocket.NewProtocolAuthenticator(tokenAuth))
		securityDefinitions["BearerToken"] = &spec.SecurityScheme{
			SecuritySchemeProps: spec.SecuritySchemeProps{
				Type:        "apiKey",
				Name:        "authorization",
				In:          "header",
				Description: "Bearer Token authentication",
			},
		}
	}

	// Anonymous
	if len(authenticators) == 0 {
		if config.Anonymous {
			return anonymous.NewAuthenticator(), &securityDefinitions, nil
		}
		return nil, &securityDefinitions, nil
	}

	// 集合所有的认证器
	authenticator := union.New(authenticators...)

	authenticator = group.NewAuthenticatedGroupAdder(authenticator)

	if config.Anonymous {
		// If the authenticator chain returns an error, return an error (don't consider a bad bearer token
		// or invalid username/password combination anonymous).
		authenticator = union.NewFailOnError(authenticator, anonymous.NewAuthenticator())
	}

	return authenticator, &securityDefinitions, nil
}
```

