# StatefulSet

> 代码块篇幅有限, 从完整代码中截取部分,也是为了去除干扰





>
>
>创建: 有序, pod副本有序串行的新建
>
>更新:
>
>删除: 可以指定级联模式参数**--cascade=true** : 删除sts会同时删除他所管理的所有pod, false可能有孤儿pod
>
>
>
>Run()-> Worker() -> processNextWorkItem() -> sync()
>
>​          孤儿Revisions修正
>
>sync() -> adoptOrphanRevisions()
>
>​          所有应当被sts管理的pod(包括孤儿pod)就在这里过滤完毕 ->  筛选pod -> 收养/释放孤儿pod
>
>​          getPodsForStatefulSet()  -> ClaimPods() -> ClaimObject()
>
>进行更新sts及更新pod的操作
>
>sts 的sync，进行更新sts及更新pod的操作
>
>获得当前的revision, 已经更新后最新的revision
>
>对pod进行操作
>
>​          syncStatefulSet() - > UpdateStatefulSet() -> performUpdate() -> updateStatefulSet()
>
>
>
>**updateStatefulSet函数总结**
>
>1. 每个循环的周期中，最多操作一个pod
>2. 根据sts.spec.replicas对比现有pod的序号，对pod进行划分，一部分划为合法(保留/重建)，一部分划为非法(删除)
>3. 对pods进行划分，一部分划入current(old) set阵营，另一部分划入update(new) set阵营
>4. 更新过程中，无论是删减、还是新建，都保持pod数量固定，有序地递增、递减
>5. 最终保证所有的pod都归属于update revision
>
>## 总结
>
>statefulset 在设计上与 deployment 有许多不同的地方，例如：
>
>- deployment通过rs管理pod，sts通过controllerRevision管理pod；
>- deployment curd是无序的，sts强保证有序curd
>- sts需要检查存储的匹配
>
>在了解sts管理操作pod方式的基础上来看代码，会有许多的帮助。

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





`kubernetes/pkg/controller/statefulset/stateful_set.go`

> Run()-> Worker() -> processNextWorkItem() -> sync()
>
> sync() -> adoptOrphanRevisions()
>
> ​          getPodsForStatefulSet()
>
> ​          syncStatefulSet()







```go
func (ssc *StatefulSetController) Run(ctx context.Context, workers int) {
	for i := 0; i < workers; i++ {
		go wait.UntilWithContext(ctx, ssc.worker, time.Second)
	}
}


func (ssc *StatefulSetController) sync(ctx context.Context, key string) error {
	// key的样例: default/tests,做切割 拿到namespace和name
	namespace, name, err := cache.SplitMetaNamespaceKey(key)

	//获取到sts对象
	set, err := ssc.setLister.StatefulSets(namespace).Get(name)

	//labelSelector
	selector, err := metav1.LabelSelectorAsSelector(set.Spec.Selector)

	// 孤儿Revisions修正
	// 出现孤儿ControllerRevisions的原因，很有可能是sts在此期间进行了反复的更新，更新时间差之中产生了脏数据.
  // ###########
	if err := ssc.adoptOrphanRevisions(ctx, set);

	// 获取到sts 管理的pod   所有应当被sts管理的pod(包括孤儿pod)就在这里过滤完毕
  // ##############
	pods, err := ssc.getPodsForStatefulSet(ctx, set, selector)

	//sts 的sync，进行更新sts及更新pod的操作
  // ########
	return ssc.syncStatefulSet(ctx, set, pods)
}


// --------------------------------------------------func 分割线-----------------------------------------------
// 孤儿Revisions修正
func (ssc *StatefulSetController) adoptOrphanRevisions(ctx context.Context, set *apps.StatefulSet) error {
	// 通过sts指定的revision相关字段找到对应的revisions
	revisions, err := ssc.control.ListRevisions(set)

	for i := range revisions {
		//通过revision指定的controller来源,来找sts.
		//如果绑定的sts为空,那么说明ControllerRevisions是孤儿状态,需要回收
		if metav1.GetControllerOf(revisions[i]) == nil {
			orphanRevisions = append(orphanRevisions, revisions[i])
		}
	}
	if len(orphanRevisions) > 0 {
		//很有可能是sts在此期间进行了反复的更新，因此重新获取一次最新的sts
		// sts(old) 若与fresh sts uid不同，则说明期间sts可能经历了删除重建，本次逻辑的流程打破，抛错返回
		canAdoptErr := ssc.canAdoptFunc(ctx, set)(ctx)

		// 为这些controller sts指定为null的revision, 若leable匹配加上ownerReferences sts执行, 若label不匹配则gc
		return ssc.control.AdoptOrphanRevisions(set, orphanRevisions)
	}
}


// --------------------------------------------------func 分割线-----------------------------------------------
// 获取到sts 管理的pod
func (ssc *StatefulSetController) getPodsForStatefulSet(ctx context.Context, set *apps.StatefulSet, selector labels.Selector) ([]*v1.Pod, error) {
	// 列出所有的pods，包括不再匹配选择器的pods，但有一个ControllerRef指向这个StatefulSet。
	pods, err := ssc.podLister.Pods(set.Namespace).List(labels.Everything())

	// filter函数的作用是判断指定的pod和sts是否有所属关系,
	//对pod的名称做re字符串切割, 最后一个"-" 之前的之前的字符串是parent, 之后的数字是序号索引,
	//判断parent与sts name是否一致,一致true 表示属于sts
	filter := func(pod *v1.Pod) bool {
		return isMemberOf(set, pod)
	}

	cm := controller.NewPodControllerRefManager(ssc.podControl, set, selector, controllerKind, ssc.canAdoptFunc(ctx, set))

	//执行筛选
	return cm.ClaimPods(ctx, pods, filter)
}

//进行更新sts及更新pod的操作
func (ssc *StatefulSetController) syncStatefulSet(ctx context.Context, set *apps.StatefulSet, pods []*v1.Pod) error {
	//sts 的sync，进行更新sts及更新pod的操作
	status, err = ssc.control.UpdateStatefulSet(ctx, set, pods)
}
```





`kubernetes/pkg/controller/controller_ref_manager.go`

> getPodsForStatefulSet() -> ClaimPods()

```go
// 筛选pod
func (m *PodControllerRefManager) ClaimPods(ctx context.Context, pods []*v1.Pod, filters ...func(*v1.Pod) bool) ([]*v1.Pod, error) {
	match := func(obj metav1.Object) bool {
		pod := obj.(*v1.Pod)
		//首先检查选择器，这样过滤器只在潜在匹配的Pods上运行。

		//先根据标签匹配pod, 仅当标签匹配通过后, 再匹配下一步(sts调用则是按照上面说的取pod name 字符串切割后与sts name对比)
		if !m.Selector.Matches(labels.Set(pod.Labels)) {
			return false
		}
	}

	adopt := func(ctx context.Context, obj metav1.Object) error {
		//收养pod(添加关联关系), 为pod.metadata patch ownerReferences字段
		return m.AdoptPod(ctx, obj.(*v1.Pod))
	}

	release := func(ctx context.Context, obj metav1.Object) error {
		//释放pod关联关系, pod.metadata delete ownerReferences
		return m.ReleasePod(ctx, obj.(*v1.Pod))
	}

	for _, pod := range pods {
		//判断单个pod是否匹配, 收养/释放孤儿pod的函数ClaimObject
    // ##########
		ok, err := m.ClaimObject(ctx, pod, match, adopt, release)
	}
	return claimed, utilerrors.NewAggregate(errlist)
}
```





`kubernetes/pkg/controller/controller_ref_manager.go`

> ClaimPods() -> ClaimObject()

```go
// 收养/释放孤儿pod
func (m *BaseControllerRefManager) ClaimObject(ctx context.Context, obj metav1.Object, match func(metav1.Object) bool, adopt, release func(context.Context, metav1.Object) error) (bool, error) {
	//获取到pod.metadate中的 ownerReferences字段
	controllerRef := metav1.GetControllerOfNoCopy(obj)

	//如果pod存在ownerReferences,则直接进入判断是否match
	if controllerRef != nil {
		//匹配返回true
		if match(obj) { return true, nil }

		//属于我们，但选择器不匹配。
		//尝试释放，除非我们被删除。
		if m.Controller.GetDeletionTimestamp() != nil { return false, nil }

		//不匹配则pod释放关联字段, 返回false
		if err := release(ctx, obj);

		// Successfully released.
		return false, nil
	}


	// 孤儿pod,则需要根据情况判断是否收养/释放
	// 已删除的sts或match规则不匹配返回false
	if m.Controller.GetDeletionTimestamp() != nil || !match(obj) {
		// Ignore if we're being deleted or selector doesn't match.
		return false, nil
	}

	// Selector matches. Try to adopt.
	if err := adopt(ctx, obj);
	// Successfully adopted.
	//收养成功返回true
	return true, nil
}
```





`kubernetes/pkg/controller/statefulset/stateful_set_control.go`

> syncStatefulSet()- > UpdateStatefulSet() -> performUpdate() -> updateStatefulSet()

```go
//sts 的sync，进行更新sts及更新pod的操作
func (ssc *defaultStatefulSetControl) UpdateStatefulSet(ctx context.Context, set *apps.StatefulSet, pods []*v1.Pod) (*apps.StatefulSetStatus, error) {
  //当在performUpdate中创建一个新的修订时，set被修改。现在复制一份以避免突变错误。
	set = set.DeepCopy()

	//取出sts所有的revision并排序
	revisions, err := ssc.ListRevisions(set)

	history.SortControllerRevisions(revisions)

	//获得当前的revision, 已经更新后最新的revision
	currentRevision, updateRevision, status, err := ssc.performUpdate(ctx, set, pods, revisions)

	// 对set的revision history进行维护
	return status, ssc.truncateHistory(set, pods, revisions, currentRevision, updateRevision)
}


// --------------------------------------------------func 分割线-----------------------------------------------
//获得当前的revision, 已经更新后最新的revision
func (ssc *defaultStatefulSetControl) performUpdate(
	ctx context.Context, set *apps.StatefulSet, pods []*v1.Pod, revisions []*apps.ControllerRevision) (*apps.ControllerRevision, *apps.ControllerRevision, *apps.StatefulSetStatus, error) {

	//获得当前的revision, 已经更新后最新的revision
	currentRevision, updateRevision, collisionCount, err := ssc.getStatefulSetRevisions(set, revisions)

	// ###################### 对pod进行操作
	currentStatus, err = ssc.updateStatefulSet(ctx, set, currentRevision, updateRevision, collisionCount, pods)

	// update the set's status
	// 操作完成修改sts.status
	err = ssc.updateStatefulSetStatus(ctx, set, currentStatus)

	return currentRevision, updateRevision, currentStatus, nil
}



// --------------------------------------------------func 分割线-----------------------------------------------
func (ssc *defaultStatefulSetControl) updateStatefulSet(
	ctx context.Context,
	set *apps.StatefulSet,
	currentRevision *apps.ControllerRevision,
	updateRevision *apps.ControllerRevision,
	collisionCount int32,
	pods []*v1.Pod) (*apps.StatefulSetStatus, error) {

	//获取到当前sts currentset, 然后获取到需要新到的sts updateSet
	//1. 滚动更新时: 在未指定partition时,使当前sts的管理的pod缩减为0, updateSet的ready pod数 = spec.replicas
	//2. 滚动更新时: 在未指定partition后, 大于等于partition的pod全部归于updateSet, 小于partition值得pod还是归属原currentSet
	//3. OnDelete更新时, do nothing
	// get the current and update revisions of the set.
	currentSet, err := ApplyRevision(set, currentRevision)

	updateSet, err := ApplyRevision(set, updateRevision)


  //在返回状态中设置生成和修订
	// 重新计算sts的status
	status := apps.StatefulSetStatus{}
	status.ObservedGeneration = set.Generation
	status.CurrentRevision = currentRevision.Name
	status.UpdateRevision = updateRevision.Name
	status.CollisionCount = new(int32)
	*status.CollisionCount = collisionCount

	replicaCount := int(*set.Spec.Replicas)

	// replicas是合法副本, 将满足 0<= pod 序号< sts.spec.replicas 的pod, 放到这个slice里来,
	// 这里面的pod都是要保证ready的
	replicas := make([]*v1.Pod, replicaCount)

	// condemned是非法副本, 将满足 pod序号>= sts.spec.replicas的pod, 放到这个slice里来, 这些pod是要删除(缩容)的
	condemned := make([]*v1.Pod, 0, len(pods))
	unhealthy := 0
	var firstUnhealthyPod *v1.Pod


  // 首先，我们将pods分成两个列表valid replicas 和condemned Pods
	for i := range pods {
		status.Replicas++

    // 计算运行和就绪的副本的数量
		if isRunningAndReady(pods[i]) {
			status.ReadyReplicas++

      // 计算运行的和可用的副本的数量
			if utilfeature.DefaultFeatureGate.Enabled(features.StatefulSetMinReadySeconds) {
				if isRunningAndAvailable(pods[i], set.Spec.MinReadySeconds) {
					status.AvailableReplicas++
				}
			} else {
				// If the featuregate is not enabled, all the ready replicas should be considered as available replicas
        // 如果 featuregate 未启用，则应将所有就绪副本视为可用副本
				status.AvailableReplicas = status.ReadyReplicas
			}
		}

    // 计算当前和更新副本的数量
		// 通过pod的controller-revision-hash label ,判断pod属于currentSet还是UpdateSet,分别记数
		if isCreated(pods[i]) && !isTerminating(pods[i]) {
			if getPodRevision(pods[i]) == currentRevision.Name {
				status.CurrentReplicas++
			}
			if getPodRevision(pods[i]) == updateRevision.Name {
				status.UpdatedReplicas++
			}
		}

		if ord := getOrdinal(pods[i]); 0 <= ord && ord < replicaCount {
      // 如果pod的序号在当前副本数量范围内，则将其插入到其序号的间接位置
			// 将满足0<= pod序号 < sts.spec.replicas 的pod, 放到replicas这个slice里来
			replicas[ord] = pods[i]
		} else if ord >= replicaCount {
			// 将满足pod需要>= sts.spec.replicasde pod, 放到condemened这个slice里来, 这些pod需要删除
			condemned = append(condemned, pods[i])
		}
	}


	// replicas slice之中如果索引位置为空,则需要填充相应的pod
	// 根据cuurentSet.replicas/UpdateSet.replicas/partition 这3个来判断pod是基于current revision还是基于update revision创建
	for ord := 0; ord < replicaCount; ord++ {
		if replicas[ord] == nil {
			replicas[ord] = newVersionedStatefulSetPod(
				currentSet,
				updateSet,
				currentRevision.Name,
				updateRevision.Name, ord)
		}
	}


	// 对需要删除的非法pod按照序号从大到小的顺序排序
	sort.Sort(ascendingOrdinal(condemned))

	// 如果有不健康的pod, 也需要删除, 但还是遵循串行的原则, 有限删除非法pod中序号最大的, 再到合法副本中的序号最小的
	for i := range replicas {
		if !isHealthy(replicas[i]) {
			unhealthy++
			if firstUnhealthyPod == nil {
				firstUnhealthyPod = replicas[i]
			}
		}
	}

	for i := range condemned {
		if !isHealthy(condemned[i]) {
			unhealthy++
			if firstUnhealthyPod == nil {
				firstUnhealthyPod = condemned[i]
			}
		}
	}

	if unhealthy > 0 {
		klog.V(4).Infof("StatefulSet %s/%s has %d unhealthy Pods starting with %s")
	}


  // 如果StatefulSet正在被删除，除了更新状态外，不做任何事情。
	if set.DeletionTimestamp != nil {
		return &status, nil
	}

	monotonic := !allowsBurst(set)

	// 根据pod的序号, 对他们一次进行检查并操作
	for i := range replicas {

		// 错误状态的pod删除重建
		if isFailed(replicas[i]) {
			ssc.recorder.Eventf(set, v1.EventTypeWarning, "RecreatingFailedPod",
				"StatefulSet %s/%s is recreating failed Pod %s")
			if err := ssc.podControl.DeleteStatefulPod(set, replicas[i]); err != nil {
				return &status, err
			}
			if getPodRevision(replicas[i]) == currentRevision.Name {
				status.CurrentReplicas--
			}
			if getPodRevision(replicas[i]) == updateRevision.Name {
				status.UpdatedReplicas--
			}
			status.Replicas--
			replicas[i] = newVersionedStatefulSetPod(
				currentSet,
				updateSet,
				currentRevision.Name,
				updateRevision.Name,
				i)
		}

		// pod线没有被创建(可能是上面刚填充的) 就创建pod
		if !isCreated(replicas[i]) {
			if utilfeature.DefaultFeatureGate.Enabled(features.StatefulSetAutoDeletePVC) {
				if isStale, err := ssc.podControl.PodClaimIsStale(set, replicas[i]);
        else if isStale {
					return &status, err
				}
			}
			if err := ssc.podControl.CreateStatefulPod(ctx, set, replicas[i]);

			status.Replicas++
			if getPodRevision(replicas[i]) == currentRevision.Name {
				status.CurrentReplicas++
			}
			if getPodRevision(replicas[i]) == updateRevision.Name {
				status.UpdatedReplicas++
			}

			// 如果不允许burst, 直接返回
			if monotonic {
				return &status, nil
			}

      // pod创建，这轮没有更多的工作可能
			continue
		}

    // 如果我们发现一个Pod当前正在终止，我们必须等待直到优雅的删除完成，然后我们继续前进。
		// 如果不允许burst, 对于终结中的pod不采取任何逻辑, 等待他终结完毕后下一轮再操作
		if isTerminating(replicas[i]) && monotonic {
			klog.V(4).Infof(
				"StatefulSet %s/%s is waiting for Pod %s to Terminate")
			return &status, nil
		}

    // 如果我们有一个Pod已经创建但没有运行和准备好，我们不能取得进展。
    // 我们必须确保每个Pod的所有，当我们创建它的时候，它的所有前辈，相对于它的序数，都是Running和Ready。
		// 如果是正在创建中的pod(还未达到ready)状态, 同样不采取任何操作, 因为需要保证创建操作依次有序
		if !isRunningAndReady(replicas[i]) && monotonic {
			klog.V(4).Infof(
				"StatefulSet %s/%s is waiting for Pod %s to be Running and Ready")
			return &status, nil
		}

    //如果我们有一个已创建但不可用的Pod，我们不能取得进展。
		//我们必须确保每个Pod的所有，当我们创建它时，它的所有前身，相对于它的序数，是可用的。

		// isRunningAndReady block as only Available pods should be brought down.
		if utilfeature.DefaultFeatureGate.Enabled(features.StatefulSetMinReadySeconds) && !isRunningAndAvailable(replicas[i], set.Spec.MinReadySeconds) && monotonic {
			klog.V(4).Infof(
				"StatefulSet %s/%s is waiting for Pod %s to be Available" )
			return &status, nil
		}

    // 强制StatefulSet不变量
		retentionMatch := true
		if utilfeature.DefaultFeatureGate.Enabled(features.StatefulSetAutoDeletePVC) {
			var err error
			retentionMatch, err = ssc.podControl.ClaimsMatchRetentionPolicy(updateSet, replicas[i])

      // 如果pod还没有完全更新，则会出现错误，因此返回被视为匹配。
			if err != nil {
				retentionMatch = true
			}
		}

		// 如果此pod与sts已经匹配(ready) ,且存储满足sts pod 的要求, n那么这个pod就是合格的pod continue
		if identityMatches(set, replicas[i]) && storageMatches(set, replicas[i]) && retentionMatch {
			continue
		}

    //做一个深层拷贝，这样我们就不会改变共享缓存
		//确保pod与sts的标签关联, 以及为pod准备好他需要的pvc
		replica := replicas[i].DeepCopy()
		if err := ssc.podControl.UpdateStatefulPod(updateSet, replica); err != nil {
			return &status, err
		}
	}

	if utilfeature.DefaultFeatureGate.Enabled(features.StatefulSetAutoDeletePVC) {
		for i := range condemned {
			if matchPolicy, err := ssc.podControl.ClaimsMatchRetentionPolicy(updateSet, condemned[i]);
      else if !matchPolicy {
				if err := ssc.podControl.UpdatePodClaimForRetentionPolicy(updateSet, condemned[i]);
			}
		}
	}

  //在这一点上，所有当前的副本正在运行，就绪和可用，我们可以考虑终止。
  //我们将等待所有的前身是运行和就绪之前，试图删除。
  //我们将在[len(Pods)，set.Spec.Replicas)上以单调递减的顺序终止Pods。
  //注意，我们不复活Pods在这个间隔。还请注意，伸缩将优先于更新。

	//上面的合法副本得以保证之后, 下面要开始按pod序号从大到小的顺序,删除非法pod了
	for target := len(condemned) - 1; target >= 0; target-- {
		// 终结中的pod不在处理, 直接返回, 等待下一轮检查
		if isTerminating(condemned[target]) {
			klog.V(4).Infof(
				"StatefulSet %s/%s is waiting for Pod %s to Terminate prior to scale down")

      // 如果我们处于单调模式，就会阻塞
			if monotonic {
				return &status, nil
			}
			continue
		}


		//如果此非法pod不是ready状态, 且不允许burst, 且他不是优先级第一的非健康pod, 不做任何操作.
		//换言之,即使是删除非 健康的pod,也要按照序号从大到小的顺序执行
		if !isRunningAndReady(condemned[target]) && monotonic && condemned[target] != firstUnhealthyPod {
			klog.V(4).Infof(
				"StatefulSet %s/%s is waiting for Pod %s to be Running and Ready prior to scale down")
			return &status, nil
		}

    // 如果我们处于单调模式，而被谴责的目标不是第一个不健康的pod，阻止。

    // isRunningAndReady 块只有可用的pod应该被带下来。
		if utilfeature.DefaultFeatureGate.Enabled(features.StatefulSetMinReadySeconds) && !isRunningAndAvailable(condemned[target], set.Spec.MinReadySeconds) && monotonic && condemned[target] != firstUnhealthyPod {
			klog.V(4).Infof(
				"StatefulSet %s/%s is waiting for Pod %s to be Available prior to scale down")
		}

		//开始删除此pod,更新status
		klog.V(2).Infof("StatefulSet %s/%s terminating Pod %s for scale down")

		if err := ssc.podControl.DeleteStatefulPod(set, condemned[target]); err != nil {
			return &status, err
		}
		if getPodRevision(condemned[target]) == currentRevision.Name {
			status.CurrentReplicas--
		}
		if getPodRevision(condemned[target]) == updateRevision.Name {
			status.UpdatedReplicas--
		}
		if monotonic {
			return &status, nil
		}
	}

  // 对于OnDelete策略，我们进行了短路。当手动删除pods时，pod将被更新。
	// OnDelete更新模式下, 不自动删除pod, 需要手动删除pod来触发更新
	if set.Spec.UpdateStrategy.Type == apps.OnDeleteStatefulSetStrategyType {
		return &status, nil
	}


  // 基于该策略，我们计算了破坏性更新的目标序列的最小序数。
	// now 要开始对replicas里合法的pod进行检查了
	updateMin := 0
	if set.Spec.UpdateStrategy.RollingUpdate != nil {
		updateMin = int(*set.Spec.UpdateStrategy.RollingUpdate.Partition)
	}

  // 我们用与更新版本不匹配的最大序数终止Pod。
	// 按pod的需要倒序检查
	for target := len(replicas) - 1; target >= updateMin; target-- {
		// 如果pod的revision不符合updatRevision, 那么删除此pod重建
		if getPodRevision(replicas[target]) != updateRevision.Name && !isTerminating(replicas[target]) {

			err := ssc.podControl.DeleteStatefulPod(set, replicas[target])
			status.CurrentReplicas--
			return &status, err
		}

		// 合法pod更新过程中, 还未到达ready状态的pod, 等待它
		if !isHealthy(replicas[target]) {return &status, nil}

	}
	return &status, nil
}
```