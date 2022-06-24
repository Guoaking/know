## 初步

> 代码块篇幅有限, 从完整代码中截取部分,也是为了去除干扰

## Scheduler

- `cmd/kube-scheduler/scheduler.go`: 这里的main()函数即是scheduler的入口，它会读取指定的命令行参数，初始化调度器框架，开始工作
- `pkg/scheduler/scheduler.go`: 调度器框架的整体代码，框架本身所有的运行、调度逻辑全部在这里
- `pkg/scheduler/core/generic_scheduler.go`: 上面是框架本身的所有调度逻辑，包括算法，而这一层，是调度器实际工作时使用的算法，默认情况下，并不是所有列举出的算法都在被实际使用，参考位于文件中的`Schedule()`函数
- 调度算法一共由Predicates和priorities这两部分组成，Predicates(断言)是用来过滤node的一系列策略集合，Priorities是用来优选node的一系列策略集合。默认情况下，kubernetes提供内建predicates/priorities策略，代码集中于`pkg/scheduler/algorithm/predicates/predicates.go` 和 `pkg/scheduler/algorithm/priorities`内.
- 默认调度策略是通过defaultPredicates() 和 defaultPriorities()这两个函数定义的，源码在 `pkg/scheduler/algorithmprovider/defaults/defaults.go`，我们可以通过命令行flag --policy-config-file CONFIG_FILE 来修改默认的调度策略。除此之外，也可以在`pkg/scheduler/algorithm/predicates/predicates.go` `pkg/scheduler/algorithm/priorities`源码中添加自定义的predicate和prioritie策略，然后注册到`defaultPredicates()`/`defaultPriorities()`中来实现自定义调度策略。



## Controller

### 多实例选举



`cmd/kube-controller-manager/controller-manager.go` -> `app.NewControllerManagerCommand()`

`cmd/kube-controller-manager/app/controllermanager.go` ->

```go
if err := Run(c.Complete(), wait.NeverStop);

func Run(c *config.CompletedConfig, stopCh <-chan struct{}) error {
	//主从选举从这里
  go leaderElectAndRun()
}


func leaderElectAndRun(c *config.CompletedConfig, lockIdentity...){
  leaderelection.RunOrDie(context.TODO(), leaderelection.LeaderElectionConfig{})
}

func RunOrDie(ctx context.Context, lec LeaderElectionConfig) {
  // 开始进入选举
	le.Run(ctx)
}

func (le *LeaderElector) Run(ctx context.Context) {
  //1.  acquire竞选函数 执行失败直接返回
	if !le.acquire(ctx) {
		return // ctx signalled done
	}

  //2.  竞选成功另起一个线程, 执行上面run工作函数, controller工作循环
	go le.config.Callbacks.OnStartedLeading(ctx)

  //3.  刷新leader状态函数
	le.renew(ctx)
}

//1.  acquire竞选函数 执行失败直接返回
func (le *LeaderElector) acquire(ctx context.Context) bool {
  // 进入循环申请leader的状态, JitterUntil是一个定时循环功能的函数
  wait.JitterUntil(func() {
		//申请或者刷新leader函数
		succeeded = le.tryAcquireOrRenew(ctx)
		// 选举成功后，执行cancel()从定时循环函数中跳出来，返回成功结果
		cancel()
	})
}

func (le *LeaderElector) tryAcquireOrRenew(ctx context.Context) bool {
  // 1. 获取当前的leader的竞选记录，如果当前还没有leader记录，则创建
	oldLeaderElectionRecord, oldLeaderElectionRawRecord, err := le.config.Lock.Get(ctx)
  // ------------------------------------start-------------------------------------------
  	// /k8s.io/client-go/tools/leaderelection/resourcelock/leaselock.go
  	func (ll *LeaseLock) Get(ctx context.Context) (*LeaderElectionRecord, []byte, error) {

      //1. 获取lease对象
      ll.lease, err = ll.Client.Leases(ll.LeaseMeta.Namespace).Get(ctx, ll.LeaseMeta.Name, metav1.GetOptions{})

      //2.将lease转换成LeaderElectionRecord 记录返回
      record := LeaseSpecToLeaderElectionRecord(&ll.lease.Spec)
    }
    //LeaderElectionRecord  结构体定义
    type LeaderElectionRecord struct {
      //leader 持有标识
      HolderIdentity       string      `json:"holderIdentity"`
      //选举间隔
      LeaseDurationSeconds int         `json:"leaseDurationSeconds"`
      //选举成为leader的时间
      AcquireTime          metav1.Time `json:"acquireTime"`
      //续任时间
      RenewTime            metav1.Time `json:"renewTime"`
      //leader位置转接次数
      LeaderTransitions    int         `json:"leaderTransitions"`
    }
  // -------------------------------------end------------------------------------------


  // 2. 对比观察记录里的leader与当前实际的leader
	if !bytes.Equal(le.observedRawRecord, oldLeaderElectionRawRecord) {
		//如果参选者的上一次观察记录中的leader，不是当前leader，则修改记录，以当前leader为准
		le.setObservedRecord(oldLeaderElectionRecord)
	}
  if len(oldLeaderElectionRecord.HolderIdentity) > 0 &&
		//如果参选者不是当前的leader，且当前leader的任期尚未结束，则返回false，参选者选举失败
		le.observedTime.Add(le.config.LeaseDuration).After(now.Time)
	}

  // 3。我们将尝试更新。leaderElectionRecord被设置为默认值 在这里。让我们在更新之前更正它。
	if le.IsLeader() {
		// 如果参选者是leader本身, 则修改记录里的当选时间变为他此前的当选时间, 而不是本次时间, 本更次数维持不变
		leaderElectionRecord.AcquireTime = oldLeaderElectionRecord.AcquireTime
		leaderElectionRecord.LeaderTransitions = oldLeaderElectionRecord.LeaderTransitions
	} else {
		// 如果参选者不是leader(说明当前leader在任期内已经结束, 但并未续约) , 则当前参选者变更成为新的leader
		leaderElectionRecord.LeaderTransitions = oldLeaderElectionRecord.LeaderTransitions + 1
	}

  	// 更新leader信息，更新leader锁，返回true选举过程顺利完成
	if err = le.config.Lock.Update(ctx, leaderElectionRecord); err != nil {
		klog.Errorf("Failed to update lock: %v", err)
		return false
	}

	le.setObservedRecord(&leaderElectionRecord)
	return true
}

//3.  刷新leader状态函数  刷新选举状态func
func (le *LeaderElector) renew(ctx context.Context) {
  wait.Until(func() {
		// 间隔刷新leader状态, 成功则续约, 不成功则释放
		err := wait.PollImmediateUntil(le.config.RetryPeriod, func() (bool, error) {
			return le.tryAcquireOrRenew(timeoutCtx), nil
		}, timeoutCtx.Done())
	})
}




```



组件选举大致可以概括为以下流程：

- 初始时，各实例均为LeaderElector，最先开始选举的，成为leader，成为工作实例。同时它会维护一份信息(leader lock)供各个LeaderElector探测，包括状态信息、健康监控接口等。
- 其余LeaderElector，进入热备状态，监控leader的运行状态，异常时会再次参与选举
- leader在运行中会间隔持续刷新自身的leader状态。



### Deployment Controller

`kubernetes/cmd/kube-controller-manager/controller-manager.go` 入口

`command := app.NewControllerManagerCommand()`



> Run()-> worker() -> processNextWorkItem()-> syncHandler()-> syncDeployment()
>
> run里有worker的循环, 默认worker的数量, 每隔一秒循环执行 dc.workder函数
>
> processNextWorkItem () 从队列取出来对象 -> 滚动更新增删改查都在 syncDeployment()
>
> syncDeployment() -> sync()-> scale()
>
> ​                  rolloutRolling()-> reconcileNewReplicaSet()
>
> ​                                    reconcileOldReplicaSets() -> NewRSNewReplicas()
>
> #### 总结
>
> 滚动更新过程中主要是通过调用`reconcileNewReplicaSet`函数对 newRS 扩容，调用 `reconcileOldReplicaSets`函数 对 oldRSs缩容，
>
> 按照 `maxSurge` 和 `maxUnavailable` 的约束，计时器间隔1s反复执行、收敛、修正，最终达到期望状态，完成更新。
>
>
>
> Deployment的回滚、扩(缩)容、暂停、更新等操作，主要是通过修改rs来完成的。其中，rs的版本控制、replicas数量控制是其最核心也是难以理解的地方，但是只要记住99%的时间里deployment对应的活跃的rs只有一个，只有更新时才会出现2个rs，极少数情况下(短时间重复更新)才会出现2个以上的rs，对于上面源码的理解就会容易许多。
>
> 另外，从上面这么多步骤的拆解也可以发现，deployment的更新实际基本不涉及对pod的直接操作，因此，本章后续的章节会分析一下replicaSet controller是怎么和pod进行管理交互的。
>
>

#### 1.startDeploymentControl

> NewControllerManagerCommand()-> Run() -> NewControllerInitializers() -> startDeploymentController()

```go

NewControllerManagerCommand()-> Run() -> NewControllerInitializers() -> startDeploymentController()



func NewControllerManagerCommand() *cobra.Command {
 	Run: func(cmd *cobra.Command, args []string) {
    if err := Run(c.Complete(), wait.NeverStop);
	}
}

func Run(c *config.CompletedConfig, stopCh <-chan struct{}) error {
	// 主从选举从这里开始 此方法里
	go leaderElectAndRun(leaderelection.LeaderCallbacks{
		  //选举成功后 , 主要工作节点开始运行run 函数
			OnStartedLeading: func(ctx context.Context) {

        ## NewControllerInitializers 是重点 controller会对不同的资源
				initializersFunc := NewControllerInitializers

				run(ctx, startSATokenController, initializersFunc)
			}
		})
}

// --------------------------------------------------func 分割线-----------------------------------------------
func NewControllerInitializers(loopMode ControllerLoopMode) map[string]InitFunc {
	controllers := map[string]InitFunc{}
	controllers["endpoint"] = startEndpointController
	controllers["replicationcontroller"] = startReplicationController
	controllers["namespace"] = startNamespaceController
	controllers["daemonset"] = startDaemonSetController
	controllers["job"] = startJobController
	controllers["replicaset"] = startReplicaSetController
	controllers["statefulset"] = startStatefulSetController
	controllers["cronjob"] = startCronJobController

  //deployment重点 -> startDeploymentController
  controllers["deployment"] = startDeploymentController

  //.... 几十个

	return controllers
}
```



`kubernetes/cmd/kube-controller-manager/app/apps.go`

> startDeploymentController()->Run()

```go
func startDeploymentController(ctx context.Context, controllerContext ControllerContext) (controller.Interface, bool, error) {
	dc, err := deployment.NewDeploymentController(
		//deployment主要关注这3个资源: Deployment/ReplicaSet/Pod，deployment通过replicaSet来管理Pod
		//这3个函数会返回相应资源的informer
		controllerContext.InformerFactory.Apps().V1().Deployments(),
		controllerContext.InformerFactory.Apps().V1().ReplicaSets(),
		controllerContext.InformerFactory.Core().V1().Pods()
	)

	//deployment controller 运行函数  int-> 是worker的数量，默认值是5个
	go dc.Run(ctx, int(controllerContext.ComponentConfig.DeploymentController.ConcurrentDeploymentSyncs))
	return nil, true, nil
}
```





#### 2.worker分析



`kubernetes/pkg/controller/deployment/deployment_controller.go`

> Run()-> worker() -> processNextWorkItem()-> syncHandler()-> syncDeployment()



``` go
func (dc *DeploymentController) Run(ctx context.Context, workers int) {
	//判断各个informer的缓存是否已经同步完毕
	//用来检测各个informer是否本地缓存已经同步完毕的函数，返回值是bool类型
	//informer为了加速和减轻apiserver的负担，设计了local storage缓存，因此这里做了一步缓存是否已同步的检测。
	if !cache.WaitForNamedCacheSync("deployment", ctx.Done(), dc.dListerSynced, dc.rsListerSynced, dc.podListerSynced) {
		return
	}

	// 启动多个worker开始工作
	for i := 0; i < workers; i++ {
		//默认是5个worker，每个worker，调用wait.Until()方法，每间隔1s，循环执行dc.worker函数，
		//运行deployment controller的工作逻辑。

		//UntilWithContext() -> BackoffUntil() 和 多实例选举的时候runordie-> run -> acquire竞选函数使用的一样
		go wait.UntilWithContext(ctx, dc.worker, time.Second)
	}

	<-ctx.Done()
}

// --------------------------------------------------func 分割线-----------------------------------------------
//是循环里调用的函数 会反复执行 , worker函数就是不断地调用processNextWorkItem函数，
//processNextWorkItem函数是从work queue中获取待处理的对象(第二篇中informer图解中的第7-第8步)，
//如果存在，那么执行相应后续的增删改查逻辑，如果不存在，那么就退出。
func (dc *DeploymentController) worker(ctx context.Context) {
	//processNextWorkItem函数是从work queue中获取待处理的对象(第二篇中informer图解中的第7-第8步)，
	//如果存在，那么执行相应后续的增删改查逻辑，如果不存在，那么就退出。
	for dc.processNextWorkItem(ctx) {
	}
}

// --------------------------------------------------func 分割线-----------------------------------------------
//processNextWorkItem函数是从work queue中获取待处理的对象，
//如果存在，那么执行相应后续的增删改查逻辑，如果不存在，那么就退出。
func (dc *DeploymentController) processNextWorkItem(ctx context.Context) bool {
	//从队列头部取出对象
	key, quit := dc.queue.Get()

  // 处理对象  -> 实际是 syncDeployment()
  //所有的增删改(滚动更新)查操作，全部都在这个函数内部处理。
	err := dc.syncHandler(ctx, key.(string))
}

// --------------------------------------------------func 分割线-----------------------------------------------
//队列头部取出对象
func (q *Type) Get() (item interface{}, shutdown bool) {
	// 取出队列的队首
	item = q.queue[0]

	// 对象加入正在处理中map?
	q.processing.insert(item)
	//dirty map 去除对象 (dirty 中是等待处理的对象)
	q.dirty.delete(item)
}

// --------------------------------------------------func 分割线-----------------------------------------------
type DeploymentController struct {
	// 声明
	syncHandler func(ctx context.Context, dKey string) error
}


func NewDeploymentController(dInformer appsinformers.DeploymentInformer, rsInformer appsinformers.ReplicaSetInformer, podInformer coreinformers.PodInformer, client clientset.Interface) (*DeploymentController, error) {
	// 赋值
	dc.syncHandler = dc.syncDeployment
}

// --------------------------------------------------func 分割线-----------------------------------------------
//这个函数不能与同一个键并发调用。 就是processNextWorkItem()-> syncHandler()的动作
//大宝贝: 所有的增删改(滚动更新)查操作，全部都在这个函数内部处理。
func (dc *DeploymentController) syncDeployment(ctx context.Context, key string) error {


	deployment, err := dc.dLister.Deployments(namespace).Get(name)


	everything := metav1.LabelSelector{}
	if reflect.DeepEqual(d.Spec.Selector, &everything) {
		// deployment 必须包含selector 标签
		dc.eventRecorder.Eventf(d, v1.EventTypeWarning, "SelectingAll", "This deployment is selecting all pods. A non-empty selector is required.")
	}

	// 获得deployment所控制的replicaSet
	rsList, err := dc.getReplicaSetsForDeployment(ctx, d)

	//列出所有由该部署拥有的pod，按其ReplicaSet分组。
	//当前使用的podMap是:
	// *检查一个Pod是否被正确标记为Pod -template-hash标签。
	// *检查没有旧的pod运行在重建部署的中间。

	//获取所有pod,map结构, 按replicaSet分组, key是rs
	// 检查deployment在重建过程中是否还存在旧版本(未更新)的pod
	podMap, err := dc.getPodMapForDeployment(d, rsList)

	// 当暂停/恢复时，将部署条件更新为未知条件
	// 部署。通过这种方式，我们可以确保在用户访问时不会超时
	// 使用设置的progressdeadlinesseconds恢复部署。

	// 检查deployment是否为pause暂停状态, pause状态则调用sync方法同步deployment
	if err = dc.checkPausedConditions(ctx, d);

	if d.Spec.Paused {
		return dc.sync(ctx, d, rsList)
	}

	//回滚是不可重入的，以防底层的副本集被一个新的修订版本更新，所以我们应该确保我们不会继续更新副本集，直到我们
	//确保部署已经在后续队列中清理了它的回滚规范。

	//判断本次deployment事件是否是一个回滚事件
	// 一旦底层的rs更新到了一个新的版本, 就无法自动执行回滚了, 因此, 直到下一次队列中再次出现此deployment且不为rollback状态时,
	// 才能放心触发更新rs,所以这里再进行一次判断,如果deployment带有回滚标记,那么先执行rs的回滚
	if getRollbackTo(d) != nil {
		return dc.rollback(ctx, d, rsList)
	}


	//判断本次deployment事件是否是一个scale事件, 是则调用sync方法同步deployment
	scalingEvent, err := dc.isScalingEvent(ctx, d, rsList)

	if scalingEvent {
		return dc.sync(ctx, d, rsList)
	}

	//更新deployment 视Deployment.Spec.Strategy指定的策略类型来执行相应的更新操作
	//1. 如果是rolloutRecreate类型 则一次性杀死pod再重建
	//2. 如果是rolloutRolling类型, 则滚动更新pod
	switch d.Spec.Strategy.Type {
	case apps.RecreateDeploymentStrategyType:
		return dc.rolloutRecreate(ctx, d, rsList, podMap)
	case apps.RollingUpdateDeploymentStrategyType:
		// 滚动更新
		//滚动更新过程中主要是通过调用reconcileNewReplicaSet函数对 newRS 扩容，
		//调用 reconcileOldReplicaSets函数 对 oldRSs缩容，按照 maxSurge 和 maxUnavailable 的约束，
		//计时器间隔1s反复执行、收敛、修正，最终达到期望状态，完成更新。
		return dc.rolloutRolling(ctx, d, rsList)
	}
}

```





#### 3.扩缩容

`kubernetes/pkg/controller/deployment/sync.go`



> syncDeployment() -> sync()-> scale()

```go
// sync负责协调伸缩事件或暂停时的部署。
func (dc *DeploymentController) sync(ctx context.Context, d *apps.Deployment, rsList []*apps.ReplicaSet) error {
	//newRs: 模板hash与当前Deployment hash值相同的rs
	//oldRSs: 所有的历史版本的rs
	//整个扩容的过程涉及所有rs的操作，可能很容易混淆，但其实只要记住在99%的情况下，
	//deployment只有一个活跃状态的rs，即newRS，大部分操作都是针对这个newRS做的，那么上面的过程就容易理解很多了。

	newRS, oldRSs, err := dc.getAllReplicaSetsAndSyncRevision(ctx, d, rsList, false)

	//如果我们在尝试扩展时出错，部署将被重新排队，因此我们可以中止这个重新同步
	//对比最新的rs和之前的rs, 如果需要scale缩扩容 ,则执行scale()
	if err := dc.scale(ctx, d, newRS, oldRSs);

	//当部署暂停且没有回滚时，清理部署。
	// pause状态, 且不处于回滚状态deployment, 进行清理(根据指定的保存历史版本数上限, 清除超出限制的历史版本)
	if d.Spec.Paused && getRollbackTo(d) == nil {
		if err := dc.cleanupDeployment(ctx, oldRSs, d); err != nil {
			return err
		}
	}

	// 同步deployment状态
  //主要用来更新deployment的status字段的内容，例如版本、副本数、可用副本数、更新副本数等等。
	return dc.syncDeploymentStatus(ctx, allRSs, newRS, d)
}



// --------------------------------------------------func 分割线-----------------------------------------------
func (dc *DeploymentController) scale(ctx context.Context, deployment *apps.Deployment, newRS *apps.ReplicaSet, oldRSs []*apps.ReplicaSet) error {
	//如果只有一个活动副本集，那么我们应该将其扩展到部署的全部计数。如果没有活动的副本集，那么我们应该扩大最新的副本集。
	//如果此时只有一个活跃的rs, 如果不止,那么就找出revision最新的rs返回
	if activeOrLatest := deploymentutil.FindActiveOrLatest(newRS, oldRSs);


	//如果新的副本集是饱和的，旧的副本集应该完全缩小。这种情况处理在饱和的新副本集期间采用副本集。
	//如果新的rs的已经收敛到了deployment期望的状态, 则旧的rs需要被完全sacle down 缩容删除掉
	if deploymentutil.IsSaturated(deployment, newRS) {
		for _, old := range controller.FilterActiveReplicaSets(oldRSs) {
			if _, _, err := dc.scaleReplicaSetAndRecordEvent(ctx, old, 0, deployment);
		}
		return nil
	}


	//旧的副本集有pod，新的副本集没有饱和。
	//我们需要按比例缩放所有副本集(新的和旧的)，以防滚动部署。

	//在滚动更新的过程中, 需要控制旧的rs与新的rs缩控制的模板pod的数量的总和, 多出的pod数量不能超过MaxSurge数,
	//因此滚动更新的过程中,旧的rs和新的rs控制的pod数量必然是一个此消彼长的过程
	if deploymentutil.IsRollingUpdate(deployment) {
		//从总副本数中添加或删除的额外副本数。这些副本应该按比例分布到活动副本集。
		//可以增加或者删除的pod数量, 结果正数则代表可以继续新增pod, 负数代表需要删除pod
		deploymentReplicasToAdd := allowedSize - allRSsReplicas


		//额外的副本应该按比例分布在活动的副本集中，大小从大到小的副本集。
		//当我们尝试缩放相同大小的复制集时，缩放方向会导致发生什么。
		//在这种情况下，当伸缩时，我们应该首先伸缩更新的复制集，当伸缩时，我们应该首先伸缩旧的复制集。
		var scalingOperation string
		switch {
		case deploymentReplicasToAdd > 0:
			// 如果是扩容, 把所有的rs按时间从新到旧排序
			sort.Sort(controller.ReplicaSetsBySizeNewer(allRSs))

		case deploymentReplicasToAdd < 0:
			// 缩容 所有的rs按从旧到新排序
			sort.Sort(controller.ReplicaSetsBySizeOlder(allRSs))
		}


		//迭代所有活动副本集并估计每个副本集的比例。
		//遍历每一个rs,用map保存此rs应该达到的pod的数量,(等于当前数量+ 需要scale的数量)
		deploymentReplicasAdded := int32(0)
		nameToSize := make(map[string]int32)
		for i := range allRSs {

			//估计比例，如果我们有副本添加，否则简单地填充nameToSize与每个副本集的当前大小。
			if deploymentReplicasToAdd != 0 {
				// 计算当前rs需要scale的数量
				proportion := deploymentutil.GetProportion(rs, *deployment, deploymentReplicasToAdd, deploymentReplicasAdded)
				//总pod数量=当前数量+scale数量
				nameToSize[rs.Name] = *(rs.Spec.Replicas) + proportion
				deploymentReplicasAdded += proportion

			} else {
				nameToSize[rs.Name] = *(rs.Spec.Replicas)
			}
		}


		for i := range allRSs {
			// 如果还有各rs加起来都未消化的pod , 则交给上面排序后的第一个rs(最新或者最旧的rs)
			if i == 0 && deploymentReplicasToAdd != 0 {
				leftover := deploymentReplicasToAdd - deploymentReplicasAdded
				nameToSize[rs.Name] = nameToSize[rs.Name] + leftover
			}

			// 把这个rs scale到它应该达到的数量
			if _, _, err := dc.scaleReplicaSet(ctx, rs, nameToSize[rs.Name], deployment, scalingOperation);
		}
	}
}

```







#### 4.滚动更新

`kubernetes/pkg/controller/deployment/rolling.go`



> syncDeployment() -> rolloutRolling()-> reconcileNewReplicaSet()
>
> ​                                    reconcileOldReplicaSets()
>
>



```go

// rolloutRolling 实现a new replica set的滚动逻辑。
func (dc *DeploymentController) rolloutRolling(ctx context.Context, d *apps.Deployment, rsList []*apps.ReplicaSet) error {
	// 获取新的rs,如果没有新的rs则创建新的rs
	newRS, oldRSs, err := dc.getAllReplicaSetsAndSyncRevision(ctx, d, rsList, true)

	// 对比判断newRs是否需要扩容(新rs管理的pod是否已经达到目标数量)
	scaledUp, err := dc.reconcileNewReplicaSet(ctx, allRSs, newRS, d)

	// 扩容完毕则更新deployment的status
	if scaledUp {
		return dc.syncRolloutStatus(ctx, allRSs, newRS, d)
	}

	//对比判断oldRss是否需要缩容(旧rs管理的pod是否已经全部终结)
	scaledDown, err := dc.reconcileOldReplicaSets(ctx, allRSs, controller.FilterActiveReplicaSets(oldRSs), newRS, d)

	// 更新状态
	if scaledDown {
		//  主要用于更新deployment的status字段和其中的condition字段。
		return dc.syncRolloutStatus(ctx, allRSs, newRS, d)
	}

	//deployment进入complete状态, 根据revision历史版本数限制,清除旧的rs
	if deploymentutil.DeploymentComplete(d, &d.Status) {
		if err := dc.cleanupDeployment(ctx, oldRSs, d);
	}

  //主要用于更新deployment的status字段和其中的condition字段。
  //kubernetes/pkg/controller/deployment/progress.go
	return dc.syncRolloutStatus(ctx, allRSs, newRS, d)
}


// --------------------------------------------------func 分割线-----------------------------------------------
// 是否应该扩容bool
func (dc *DeploymentController) reconcileNewReplicaSet(ctx context.Context, allRSs []*apps.ReplicaSet, newRS *apps.ReplicaSet, deployment *apps.Deployment) (bool, error) {
	// == 说明无需扩容
	if *(newRS.Spec.Replicas) == *(deployment.Spec.Replicas) {}

	if *(newRS.Spec.Replicas) > *(deployment.Spec.Replicas) {
		//则说明newRS需要缩容，返回值scaled此时值应当是false
		scaled, _, err := dc.scaleReplicaSetAndRecordEvent(ctx, newRS, *(deployment.Spec.Replicas), deployment)
		return scaled, err
	}
	//则使用NewRSNewReplicas方法计算newRS此时应用拥有的pod副本的数量
	newReplicasCount, err := deploymentutil.NewRSNewReplicas(deployment, allRSs, newRS)

	//返回值scaled此时值应当是true
	scaled, _, err := dc.scaleReplicaSetAndRecordEvent(ctx, newRS, newReplicasCount, deployment)
	return scaled, err
}

// --------------------------------------------------func 分割线-----------------------------------------------
//是否应该缩容oldRSs的bool值
func (dc *DeploymentController) reconcileOldReplicaSets(ctx context.Context, allRSs []*apps.ReplicaSet, oldRSs []*apps.ReplicaSet, newRS *apps.ReplicaSet, deployment *apps.Deployment) (bool, error) {
	oldPodsCount := deploymentutil.GetReplicaCountForReplicaSets(oldRSs)

	//已经缩容完毕, 直接返回
	if oldPodsCount == 0 {}

	//当前所有的pod的数量(当前值)
	allPodsCount := deploymentutil.GetReplicaCountForReplicaSets(allRSs)

	// deployment 指定的最大不可用的副本数(最大不可用值)
	maxUnavailable := deploymentutil.MaxUnavailable(*deployment)

	//Available指的是就绪探针结果为true的副本，若默认未指定就绪探针，则pod running之后自动视就绪为true
	//最小可用副本数(至少可用数)
	minAvailable := *(deployment.Spec.Replicas) - maxUnavailable

	//newRs不可用数
	newRSUnavailablePodCount := *(newRS.Spec.Replicas) - newRS.Status.AvailableReplicas

	//最大可缩容数 = 总数 - 最小可用数 - newRS不可用数(为了保证最小可用数，因此此时newRS的不可用副本不能参与这个计算)
	maxScaledDown := allPodsCount - minAvailable - newRSUnavailablePodCount
	if maxScaledDown <= 0 { return false, nil }

	//oldRS里不健康的副本，无论如何都是需要清除的
	oldRSs, cleanupCount, err := dc.cleanupUnhealthyReplicas(ctx, oldRSs, deployment, maxScaledDown)

	// 还要对比最大可缩容数和deployment指定的最大同时不可用副本数，这两者之间的最小值，才是可缩容数量
	allRSs = append(oldRSs, newRS)
	scaledDownCount, err := dc.scaleDownOldReplicaSetsForRollingUpdate(ctx, allRSs, oldRSs, deployment)

	//oldRS里不健康的副本，无论如何都是需要清除的
	totalScaledDown := cleanupCount + scaledDownCount
	//判断缩容数是否大于0
	return totalScaledDown > 0, nil
}

```







`kubernetes/pkg/controller/deployment/util/deployment_util.go`



> reconcileNewReplicaSet() -> NewRSNewReplicas()

```go
//计算newRS此时应该有的副本数量的函数
func NewRSNewReplicas(deployment *apps.Deployment, allRSs []*apps.ReplicaSet, newRS *apps.ReplicaSet) (int32, error) {
	switch deployment.Spec.Strategy.Type {

	// 滚动更新时
	case apps.RollingUpdateDeploymentStrategyType:
		// Check if we can scale up.
		maxSurge, err := intstrutil.GetScaledValueFromIntOrPercent(deployment.Spec.Strategy.RollingUpdate.MaxSurge, int(*(deployment.Spec.Replicas)), true)
		if err != nil {
			return 0, err
		}
		// Find the total number of pods
		// 当前的副本数(当前值) = 所有版本的rs管理的pod数量的总和
		currentPodCount := GetReplicaCountForReplicaSets(allRSs)
		// 最多允许同时存在的副本数(最大值) = 指定副本数 + maxSurge的副本数(整数或者比例计算)
		maxTotalPods := *(deployment.Spec.Replicas) + int32(maxSurge)

		//如果当前值比最大值还大，那么说明不能再扩容了，直接返回最新的newRS.Spec.Replicas
		if currentPodCount >= maxTotalPods {
			// Cannot scale up.
			return *(newRS.Spec.Replicas), nil
		}
		// Scale up.
		//否则，可扩容值 = 最大值 - 当前值
		scaleUpCount := maxTotalPods - currentPodCount
		// Do not exceed the number of desired replicas.
		// 但每一个版本的rs管理的副本数量，不能超过deployment所指定的副本数量，
		//只有新旧版本的rs加起来的副本数可以突破到maxSurge的上限。因此，这里的可扩容值要取这两个值之间的最小值。
		scaleUpCount = int32(integer.IntMin(int(scaleUpCount), int(*(deployment.Spec.Replicas)-*(newRS.Spec.Replicas))))
		return *(newRS.Spec.Replicas) + scaleUpCount, nil
	case apps.RecreateDeploymentStrategyType:
		// 非滚动更新时，newRS的应用副本数 = deployment.Spec.Replicas,无弹性
		return *(deployment.Spec.Replicas), nil
	default:
		return 0, fmt.Errorf("deployment type %v isn't supported", deployment.Spec.Strategy.Type)
	}
}
```



### ReplicaSet Controller



> syncReplicaSet是RS逻辑的核心
>
>
>
> SatisfiedExpectations : 使用expectations机制来判断这个rs是否满足期望状态。
>
> manageReplicas: 副本pod新增、删除操作
>
> ​	slowStartBatch: 是实际操控管理pod副本数量的函数
>
>
>
> 1.通过**SatisfiedExpectations** 函数，发现expectations期望状态本地缓存中不存在此rs key，因此返回true，需要sync
>
> 2.通过**manageReplicas** 管理pod，新增或删除
>
> 3.判断pod副本数是多了还是少了，多则要删，少则要增
>
> 4.增删之前创建expectations对象并设置add / del值
>
> 5.**slowStartBatch** 新增 / 并发删除 pod
>
> 6.更新expection
>
> expections缓存机制，在运行的pod副本数在向声明指定的副本数收敛之时，很好地避免了频繁的informer数据查询，以及可能随之而来的数据更新不及时的问题，这个机制设计巧妙贯穿整个rsc工作过程，也是不太易于理解之处。
>
>
>
> syncReplicaSet()-> SatisfiedExpectations()
>
> ​                  manageReplicas() -> slowStartBatch()



#### 1.核心



`kubernetes/cmd/kube-controller-manager/app/apps.go`  入口

```go
func startReplicaSetController(ctx context.Context, controllerContext ControllerContext) (controller.Interface, bool, error) {
	go replicaset.NewReplicaSetController(
		// 关注 -> Replicas / pods
		controllerContext.InformerFactory.Apps().V1().ReplicaSets(),
		controllerContext.InformerFactory.Core().V1().Pods(),

    // worker 默认5个
	).Run(ctx, int(controllerContext.ComponentConfig.ReplicaSetController.ConcurrentRSSyncs))

}
```



`kubernetes/pkg/controller/replicaset/replica_set.go`

> 此处省略了部分Run()-> worker() -> processNextWorkItem() -> syncHandler()==syncReplicaSet() 的中间部分 因为和deployment类似
>
>
>
> syncReplicaSet()-> SatisfiedExpectations()
>
> ​                  manageReplicas() -> slowStartBatch()

```go
func (rsc *ReplicaSetController) Run(ctx context.Context, workers int) {
	// 判断各个informer的缓存是否已经同步完毕的func
	if !cache.WaitForNamedCacheSync(rsc.Kind, ctx.Done(), rsc.podListerSynced, rsc.rsListerSynced) {
		return
	}

	//开启5个worker，每个worker间隔1s运行一次rsc.worker函数，来检查并收敛rs的状态
	for i := 0; i < workers; i++ {
		go wait.UntilWithContext(ctx, rsc.worker, time.Second)
	}

}


// syncReplicaSet将同步ReplicaSet与给定的键，如果它已经满足了它的期望，
//这意味着它不期望看到任何更多的pods创建或删除。这个函数不应该与相同的键同时调用。
func (rsc *ReplicaSetController) syncReplicaSet(ctx context.Context, key string) error {
	// key 的字符串格式: ${NAMESPACE}/${NAME}
	namespace, name, err := cache.SplitMetaNamespaceKey(key)

	// 获得rs对象
	rs, err := rsc.rsLister.ReplicaSets(namespace).Get(name)

	// 判断rs是否实现所声明的期望状态, 这里SatisfiedExpectations是使用Expectation机制来判断这个rs神抽满足期望状态
  //#############################
	rsNeedsSync := rsc.expectations.SatisfiedExpectations(key)
	selector, err := metav1.LabelSelectorAsSelector(rs.Spec.Selector)

	//列出所有的pods，包括不再匹配rs的选择器，但有陈旧的控制器ref。
	//取出所有的pod,labels.Everything 取到的是空Selector, 即不使用label selector, 取全部pod
	allPods, err := rsc.podLister.Pods(rs.Namespace).List(labels.Everything())

	//去除 inactive状态的pod
	filteredPods := controller.FilterActivePods(allPods)

	//注意:filteredpod指向缓存中的对象-如果你需要修改它们，你需要首先复制它。
	//根据rs和selector来选择受此rs版本管理的pod
	filteredPods, err = rsc.claimPods(ctx, rs, selector, filteredPods)

	//如果rs未达到期望状态,则对副本进行管理, 以使rs满足声明的期望状态
	if rsNeedsSync && rs.DeletionTimestamp == nil {
		//manageReplicas (后续的新增, 删除)
    //#####################
		manageReplicasErr = rsc.manageReplicas(ctx, filteredPods, rs)
	}
	rs = rs.DeepCopy()
	newStatus := calculateStatus(rs, filteredPods, manageReplicasErr)

	// 总是在pods出现或死亡时更新状态。
	// 只要有对应pod更新, 则需要更新rs的status字段
	updatedRS, err := updateReplicaSetStatus(rsc.kubeClient.AppsV1().ReplicaSets(rs.Namespace), rs, newStatus)

	//在MinReadySeconds之后重新同步ReplicaSet，作为防止时钟偏移的最后一道防线。
	// 当指定了MinReadySeconds时, 即使pod 已经是ready状态了, 但是也不会视为Available, 需要等待MinReadySeconds后再来刷新rs状态.
	// 因此AddAfter方法,异步等待MinReadySeconds后, 把该rs重新压入worker queue中
	if manageReplicasErr == nil && updatedRS.Spec.MinReadySeconds > 0 &&
		updatedRS.Status.ReadyReplicas == *(updatedRS.Spec.Replicas) &&
		updatedRS.Status.AvailableReplicas != *(updatedRS.Spec.Replicas) {
		rsc.queue.AddAfter(key, time.Duration(updatedRS.Spec.MinReadySeconds)*time.Second)
	}
}


// --------------------------------------------------func 分割线-----------------------------------------------
// manageReplicas检查并更新给定ReplicaSet的副本。不修改<filteredpods>当创建/删除pod时，它将重新请求副本集，以防出现错误。
//实际操控管理pod副本数量
func (rsc *ReplicaSetController) manageReplicas(ctx context.Context, filteredPods []*v1.Pod, rs *apps.ReplicaSet) error {
	//rs当前管理的pod数量与rs声明指定pod的数量的差量
	diff := len(filteredPods) - int(*(rs.Spec.Replicas))
	rsKey, err := controller.KeyFunc(rs)

	// 当rs当前管理的pod数量 小于rs声明指定的pod数量时, 说明应该继续增加pod
	if diff < 0 {
		//每次新增数量以突发增加数量burstReplicas为上限
		if diff > rsc.burstReplicas {
			diff = rsc.burstReplicas
		}

		//是我们需要等待一个创建的结果来记录pod的UID，这将需要锁定*跨*创建，这将成为性能瓶颈。我们应该预先为pod生成UID，并通过ExpectCreations存储它。
		// 创建ExpectCreations 期望
		rsc.expectations.ExpectCreations(rsKey, diff)

		//批量处理pod创建。批处理大小从SlowStartInitialBatchSize开始，并在每次成功的迭代中翻倍，以一种“慢启动”。
		//这个处理尝试启动大量的pod可能都失败与相同的错误。
		//例如，一个配额很低的项目，如果试图创建大量的pod，就会被阻止在其中一个pod失败后，
		//向API服务发送带有pod创建请求的垃圾邮件。这也很方便地防止了这些故障可能产生的事件垃圾信息。

		//指数级批量启动pod, 其中SlowStartInitialBatchSize=1(defualt)  作为底数
    //#########################
		successfulCreations, err := slowStartBatch(diff, controller.SlowStartInitialBatchSize, func() error {
			// 创建单个pod func
			err := rsc.podControl.CreatePods(ctx, rs.Namespace, &rs.Spec.Template, rs, metav1.NewControllerRef(rs, rsc.GroupVersionKind))
			return err
		})

		// 当rs当前管理的pod数量大于rs声明指定的数量时, 说明应该减少pod  down
	} else if diff > 0 {
		//选择要删除哪些pod，最好是在启动的早期阶段。
		//获取即将要删除的pod
		podsToDelete := getPodsToDelete(filteredPods, relatedPods, diff)

		//快照我们期望看到的pods的uid (ns/name)，所以我们知道记录他们的期望准确一次，无论是当我们看到它作为一个删除时间戳的更新，还是作为一个删除。
		//注意，如果pod/rs上的标签发生变化，导致pod变成孤立的，即使其他pod被删除，rs也只会在期望过期后才会醒来。

		// 修改rs的期望状态, 在期望中剔除将要删除的pod
		rsc.expectations.ExpectDeletions(rsKey, getPodKeys(podsToDelete))

		//并发删除目标pod
		for _, pod := range podsToDelete {
			go func(targetPod *v1.Pod) {
				if err := rsc.podControl.DeletePod(ctx, rs.Namespace, targetPod.Name, rs);
			}(pod)
		}

	}
}

// --------------------------------------------------func 分割线-----------------------------------------------

func slowStartBatch(count int, initialBatchSize int, fn func() error) (int, error) {
	//剩余要执行的数量
	remaining := count
	//累计成功执行的数量
	successes := 0
	//batchSize 每次批量执行的数量   //从1 和剩余数量remaining 取最小值, 每次执行成功以后, batchSize*2 指数级扩充
	for batchSize := integer.IntMin(remaining, initialBatchSize); batchSize > 0; batchSize = integer.IntMin(2*batchSize, remaining) {
		//出错时候,结束
		if len(errCh) > 0 {
			return successes, <-errCh
		}
		remaining -= batchSize
	}
	return successes, nil
}


```



#### 2.expectations机制判断rs状态



`kubernetes/pkg/controller/controller_utils.go`

> syncReplicaSet()-> SatisfiedExpectations()

```go

func (r *ControllerExpectations) SatisfiedExpectations(controllerKey string) bool {
	// 此key存在Expectation期望状态
	if exp, exists, err := r.GetExpectations(controllerKey); exists {
		if exp.Fulfilled() {
			// 期望状态达成或者过期 需要sync
			return true
		} else if exp.isExpired() {
			return true
		} else {
			// 存在期望状态但是未达成, 则无需sync. 因为后面的handler在处理资源增删的时候会来新建和修改Expectation
			// 说明当前正在接近期望状态中, 所以本次无需sync
			return false
		}
	} else if err != nil {
		//不存在Expectations(新增的资源对象), 或者获取Expectation出错, 则视为需要执行sync
	} else {}

	return true
}
```



## Todo 从register.go 到 defaults.go

`kubernetes/pkg/controller/replicaset/config/v1alpha1/defaults.go`

```go
func RecommendedDefaultReplicaSetControllerConfiguration(obj *kubectrlmgrconfigv1alpha1.ReplicaSetControllerConfiguration) {
	if obj.ConcurrentRSSyncs == 0 {
		obj.ConcurrentRSSyncs = 5
	}
}

```

