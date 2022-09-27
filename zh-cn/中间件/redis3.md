## cluster.c


<!-- tabs:start -->

#### **cluster说明**

[cluseter.c](https://github.com/redis/redis/blob/unstable/src/cluster.c)

* 配置 cluster-enabled 确定是stand alone还是cluster
* 重新分片 通过redis-trib
* 目标节点准备导入槽slot的键值对
* 源节点准备迁移槽slot的键值对
*
* ask 错误
* moved
* 多主?
* 每个节点会记录那些槽位指派给了自己,
* 检查槽是不是自己负责, 不然返回moved

* 水平拓展
  * 范围分片, 顺序写存在热点问题, 日志, 关系型需要表扫描,索引扫描
  * hash分片
  * 一致性哈希算法
    * 均衡性: 哈希的结构能够尽可能分布到所有节点中去
    * 单调性: 尽可能保护已经分配的内容不会被重新分派到新的节点
    * 分散性和负载: 尽可能避免重复
  * 虚拟hash槽 0~16383  slot = CRC16(key) & 16383。
    * 节点负责维护一部分槽和槽所映射的数据
    * 可以方便的添加或移除节点, 挪动hash槽
    * 解耦数据和节点之间的关系
    * clusterState -> clusterNode->slot
    * 16384: 消息心跳, 消息头 16384/8/1024/2kb 大了浪费带宽
      * 如果节点吗超过1000个会导致网络拥堵,
      * bitmap存自己的hash槽, 节点高的话压缩率很低
      * [啥是gossip协议](https://www.jianshu.com/p/37231c0455a9)
      * [动画演示](https://flopezluis.github.io/gossip-simulator/)

clusterCommand -> clusterStartHandshake- > createClusterNode
                                       - > clusterAddNode
redis-trib.tb -> create_cluster_cmd
main -> initServer
-> serverCron-> clusterCron -> clusterReadHandler -> clusterProcessPacket -> clusterRenameNode
-> clusterInit ->            clusterAcceptHandler ->
1. a为b创建一个clusterNode 添加到自己的clusterState.nodes里
2. a给b发送meet消息
3. b为创建,并保存到clusterState.nodes里
4. b为a返回pong a收到后改名
5. a给b发送ping
6. b返回a pong 握手完成
7. a通过gossip 广播给其他节点
8. 此时cluster处于下线(fail)状态 应为没有指派处理slots(cluster addslots)
9. clusterAddSlot() 遍历所有槽是否未指派, 遍历处理所有槽
10. 所有槽分片完毕 cluster_state=ok 上线状态

[img](../../static/img/redis/17-14.png)


set msg "happy new year"
1. setCommand -> setGenericCommand -> setKey -> dbAdd -> slotToKeyAdd -> keyHashSlot
2. setKey 计算不应该设置在当前node 返回redirected to slot 在哪里? getNodeByQuery
3. 服务端发消息在哪? repl -> cliSendCommand -> cliReadReply - > redirected
4. acceptCommonHandler -> createClient -> readQueryFromClient -> processInputBuffer -> processCommand

重新分片
1. 对目标节点发送`cluster setslot <slot> importing <source_id>`, 让目标节点准备好从源节点导入属于槽slot的键值对
2. 对源节点发送`cluster setslot <slot> migrating <target_id>`, 让源节点准备好将属于槽slot的键值对迁移到目标节点
3. 向源节点发送`cluster getkeysinslot <slot> <count>`, 获得最多count个属于slot的键值对的键名
4. 获得键名后向源节点发送一个`migrate <target_ip> <target_port> <key_name> 0 <timeout>` 将被选中的key原子的从源节点迁移到目标节点
5. 重复执行3, 4, 直到迁移完成
6. 向任意节点发送`cluster setslot <slot> node <target_id>`, 将槽slot指派给目标节点.,
7. 将指派信息发送给整个集群

ASK 错误
属于被迁移槽的一部分键值对保存在源节点力, 而另一部分键值对则保存在目标节点里
操作的key属于正在被迁移的槽时
1. 源节点找到就返回
2. 看看state.migrating_slots_to里有就返回ASK , 集群不打印ask错误
3. askingCommand
4. moved槽的负责权已经转向
5. ask是迁移过程中的临时措施

复制和故障转移
publish -> clusterSendPublish()


#### **cluster struct**

[cluseter.h](https://github.com/redis/redis/blob/unstable/src/cluster.h)
```c
// 一个节点的状态
struct clusterNode {

    // 创建节点的时间
    mstime_t ctime; /* Node object creation time. */

    // 节点的名字，由 40 个十六进制字符组成
    // 例如 68eef66df23420a5862208ef5b1a7005b806f2ff
    char name[REDIS_CLUSTER_NAMELEN]; /* Node name, hex string, sha1-size */

    // 节点标识
    // 使用各种不同的标识值记录节点的角色（比如主节点或者从节点），
    // 以及节点目前所处的状态（比如在线或者下线）。
    int flags;      /* REDIS_NODE_... */

    // 节点当前的配置纪元，用于实现故障转移
    uint64_t configEpoch; /* Last configEpoch observed for this node */

    // 由这个节点负责处理的槽
    // 一共有 REDIS_CLUSTER_SLOTS / 8 个字节长
    // 每个字节的每个位记录了一个槽的保存状态
    // 位的值为 1 表示槽正由本节点处理，值为 0 则表示槽并非本节点处理
    // 比如 slots[0] 的第一个位保存了槽 0 的保存情况
    // slots[0] 的第二个位保存了槽 1 的保存情况，以此类推
    unsigned char slots[REDIS_CLUSTER_SLOTS/8]; /* slots handled by this node */

    // 该节点负责处理的槽数量
    int numslots;   /* Number of slots handled by this node */

    // 如果本节点是主节点，那么用这个属性记录从节点的数量
    int numslaves;  /* Number of slave nodes, if this is a master */

    // 指针数组，指向各个从节点
    struct clusterNode **slaves; /* pointers to slave nodes */

    // 如果这是一个从节点，那么指向主节点
    struct clusterNode *slaveof; /* pointer to the master node */

    // 最后一次发送 PING 命令的时间
    mstime_t ping_sent;      /* Unix time we sent latest ping */

    // 最后一次接收 PONG 回复的时间戳
    mstime_t pong_received;  /* Unix time we received the pong */

    // 最后一次被设置为 FAIL 状态的时间
    mstime_t fail_time;      /* Unix time when FAIL flag was set */

    // 最后一次给某个从节点投票的时间
    mstime_t voted_time;     /* Last time we voted for a slave of this master */

    // 最后一次从这个节点接收到复制偏移量的时间
    mstime_t repl_offset_time;  /* Unix time we received offset for this node */

    // 这个节点的复制偏移量
    long long repl_offset;      /* Last known repl offset for this node. */

    // 节点的 IP 地址
    char ip[REDIS_IP_STR_LEN];  /* Latest known IP address of this node */

    // 节点的端口号
    int port;                   /* Latest known port of this node */

    // 保存连接节点所需的有关信息
    clusterLink *link;          /* TCP/IP link with this node */

    // 一个链表，记录了所有其他节点对该节点的下线报告
    list *fail_reports;         /* List of nodes signaling this as failing */

};
typedef struct clusterNode clusterNode;

// clusterLink 包含了与其他节点进行通信所需的全部信息
typedef struct clusterLink {

    // 连接的创建时间
    mstime_t ctime;             /* Link creation time */

    // TCP 套接字描述符
    int fd;                     /* TCP socket file descriptor */

    // 输出缓冲区，保存着等待发送给其他节点的消息（message）。
    sds sndbuf;                 /* Packet send buffer */

    // 输入缓冲区，保存着从其他节点接收到的消息。
    sds rcvbuf;                 /* Packet reception buffer */

    // 与这个连接相关联的节点，如果没有的话就为 NULL
    struct clusterNode *node;   /* Node related to this link if any, or NULL */

} clusterLink;

// 集群状态，每个节点都保存着一个这样的状态，记录了它们眼中的集群的样子。
// 另外，虽然这个结构主要用于记录集群的属性，但是为了节约资源，
// 有些与节点有关的属性，比如 slots_to_keys 、 failover_auth_count
// 也被放到了这个结构里面。
typedef struct clusterState {

    // 指向当前节点的指针
    clusterNode *myself;  /* This node */

    // 集群当前的配置纪元，用于实现故障转移
    uint64_t currentEpoch;

    // 集群当前的状态：是在线还是下线
    int state;            /* REDIS_CLUSTER_OK, REDIS_CLUSTER_FAIL, ... */

    // 集群中至少处理着一个槽的节点的数量。
    int size;             /* Num of master nodes with at least one slot */

    // 集群节点名单（包括 myself 节点）
    // 字典的键为节点的名字，字典的值为 clusterNode 结构
    dict *nodes;          /* Hash table of name -> clusterNode structures */

    // 节点黑名单，用于 CLUSTER FORGET 命令
    // 防止被 FORGET 的命令重新被添加到集群里面
    // （不过现在似乎没有在使用的样子，已废弃？还是尚未实现？）
    dict *nodes_black_list; /* Nodes we don't re-add for a few seconds. */

    // 记录要从当前节点迁移到目标节点的槽，以及迁移的目标节点
    // migrating_slots_to[i] = NULL 表示槽 i 未被迁移
    // migrating_slots_to[i] = clusterNode_A 表示槽 i 要从本节点迁移至节点 A
    clusterNode *migrating_slots_to[REDIS_CLUSTER_SLOTS];

    // 记录要从源节点迁移到本节点的槽，以及进行迁移的源节点
    // importing_slots_from[i] = NULL 表示槽 i 未进行导入
    // importing_slots_from[i] = clusterNode_A 表示正从节点 A 中导入槽 i
    clusterNode *importing_slots_from[REDIS_CLUSTER_SLOTS];

    // 负责处理各个槽的节点
    // 例如 slots[i] = clusterNode_A 表示槽 i 由节点 A 处理
    clusterNode *slots[REDIS_CLUSTER_SLOTS];

    // 跳跃表，表中以槽作为分值，键作为成员，对槽进行有序排序
    // 当需要对某些槽进行区间（range）操作时，这个跳跃表可以提供方便
    // 具体操作定义在 db.c 里面
    zskiplist *slots_to_keys;

    /* The following fields are used to take the slave state on elections. */
    // 以下这些域被用于进行故障转移选举

    // 上次执行选举或者下次执行选举的时间
    mstime_t failover_auth_time; /* Time of previous or next election. */

    // 节点获得的投票数量
    int failover_auth_count;    /* Number of votes received so far. */

    // 如果值为 1 ，表示本节点已经向其他节点发送了投票请求
    int failover_auth_sent;     /* True if we already asked for votes. */

    int failover_auth_rank;     /* This slave rank for current auth request. */

    uint64_t failover_auth_epoch; /* Epoch of the current election. */

    /* Manual failover state in common. */
    /* 共用的手动故障转移状态 */

    // 手动故障转移执行的时间限制
    mstime_t mf_end;            /* Manual failover time limit (ms unixtime).
                                   It is zero if there is no MF in progress. */
    /* Manual failover state of master. */
    /* 主服务器的手动故障转移状态 */
    clusterNode *mf_slave;      /* Slave performing the manual failover. */
    /* Manual failover state of slave. */
    /* 从服务器的手动故障转移状态 */
    long long mf_master_offset; /* Master offset the slave needs to start MF
                                   or zero if stil not received. */
    // 指示手动故障转移是否可以开始的标志值
    // 值为非 0 时表示各个主服务器可以开始投票
    int mf_can_start;           /* If non-zero signal that the manual failover
                                   can start requesting masters vote. */

    /* The followign fields are uesd by masters to take state on elections. */
    /* 以下这些域由主服务器使用，用于记录选举时的状态 */

    // 集群最后一次进行投票的纪元
    uint64_t lastVoteEpoch;     /* Epoch of the last vote granted. */

    // 在进入下个事件循环之前要做的事情，以各个 flag 来记录
    int todo_before_sleep; /* Things to do in clusterBeforeSleep(). */

    // 通过 cluster 连接发送的消息数量
    long long stats_bus_messages_sent;  /* Num of msg sent via cluster bus. */

    // 通过 cluster 接收到的消息数量
    long long stats_bus_messages_received; /* Num of msg rcvd via cluster bus.*/

} clusterState;

```

<!-- tabs:end -->

