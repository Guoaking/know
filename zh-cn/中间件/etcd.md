## etcd

##
去中心化, redis无法实现强一直性, 对比zookeeprer 分布式kv存储系统, raft算法
* 简单
* 安全  grpc v3
* 快速
* 可靠   go,raft保证分布式的正确性

分布式 cap etcd cp (a)可用性让步

一致性协议 c的细化 复制状态机
共识模块

leader 管理日志, 决定是什么时候安全的应用到那个状态机中,

* leader 选举 强领导人 从他来,流量其他地方
  * 分票 再来一轮 随机timeout
  * follower candidate leader
  * term 逻辑时钟, 不依赖时间
  * 状态
    * currentTerm
    * votedFor
    * log
    * commitIndex
    * lastApplied
    * nextIndex[]
    * matchIndex[]
* 日志复制
* safety安全性

强领导人
paxos zk在用
raft  etcd




支持ssl加密




