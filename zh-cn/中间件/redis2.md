
### HyperLogLog hyperloglog.c hll




## 数据类型实现


### 字符串键实现 t_string.c


<!-- tabs:start -->

#### **说明**

* 编码 ENCODING_INT|RAW
* embstr 一次内存直接减rdsojbect sds
* row  2次
* int 存成str 可以append
* 44字节 再往后类型会变 embstr->row


#### **struct**

```c


```

<!-- tabs:end -->


### 列表键实现 t_list.c

ziplist和linkedlist
quicklist?

<!-- tabs:start -->

#### **说明**
#### **struct**

```c

```

<!-- tabs:end -->



### 散列键 t_hash.c

编码转换 ziplist->hashtable

<!-- tabs:start -->

#### **说明**
#### **struct**

```c

```

<!-- tabs:end -->


### 集合键 t_set.c
intset hashtable
纯数字不超过512 就是intset

<!-- tabs:start -->

#### **说明**
#### **struct**

```c

```

<!-- tabs:end -->



### 有序集合 t_zset.c 排除zsl的

* skiplist -> zset (zskiplist,dict)
* ziplist 数量小于128&&所有元素成员长度小于64字节


<!-- tabs:start -->

#### **说明**
#### **struct**

```c

```

<!-- tabs:end -->




### 对象类型实现 object.c


### hyperLoglog hyperloglog.c pf开头


引用计数 refcount
共享数据 OBJ_SHARED_INTEGERS
空转时间lru idletime


## 数据库实现相关

### 数据库 redis.h->redisDb, db.c

* redisServer -> redisDB -> dict
* select 选择数据库
* expires dict 都通过
* dirty  距离上一次save后的修改次数
* 定时删除  对内存友好 对cpu时间不友好
* 惰性删除  对内存不友好, 永远不会被访问, 内存泄露 db.c/expireIfNeeded->deleteExpiredKeyAndPropagate
* 定期删除  确定删除的时长和频率
* old redis.c/activeExpireCycle
* new expire.c/activeExpireCycle

* rdb save时会排除过期key
* load 主会排除过期key  从都加载

* aof 显式记录过期del

<!-- tabs:start -->

#### **说明**
#### **struct**

```c

```

<!-- tabs:end -->



### 数据库通知实现  notify.c

* notifyKeyspaceEvent
* keyspace
* keyevent

<!-- tabs:start -->

#### **说明**
#### **struct**

```c

```

<!-- tabs:end -->


### RDB rdb.c

* save 阻塞服务器进程
* bgsave 派生子进程
* autosave
*
* rdb.c/rdbSave
* rdb.c/rdbLoad
*
* REDIS db_version databases EOF check_sum
* SELECTDB,db_number, key_value_pairs
* EXPIRETIME ms TYPE(value类型) key value

### AOF aof.c

* 保存执行的写命令来记录
* reidsServer.aof_buf
* aof.c/flushAppendOnlyFile
* appendfsync defualt(everysec) . no 最快 aways最慢
*
* 创建伪客户端载入
* 体积浪费 重写bgreweiteaof
* 不需要读取就文件, 直接分析数据库
*
* 重写aof会生成新的aof文件, 数据一致被原来的更小
* bgrewriteaofCommand aof.c/rewriteAppendOnlyFileBackground


## 选读

### 发布订阅

* 订阅频道pubsub_channels
* subscribe
* subscribeCommand -> pubsubSubscribeChannel
*
*
* unsubscribe
* unsubscribeCommand-> pubsubUnsubscribeChannel
*
* 订阅模式 pubsub_patterns
* psubscribe
* punsubscribe
*
* publist
*
* pubsub channels
* pubsub numsub
* pubsub numpat

### 事务实现

* 事务多个命令请求打包,一次性,按顺序执行
*
* 事务开始 multiCommand()
* 命令入队 processCommand()- > queueMultiCommand ->
* 事务执行 execCommand()
*
* 原子(Atomicity)
* 没有回滚机制 太复杂不符合简单高效的设计主旨
* 错误都是编程错误产生,不开发
*
* 一致性(Consistency)
*
* 数据是一致的
*
*
* 隔离性(ISolation)
* 单线程执行事务
*
* 耐久性(Duability)
* 持久化 aof -> appendfsync-> always
*
* 先进先出顺序
* watch REDIS_DIRTY_CAS 不安全


### Lua

EVAL


### SORT实现

### getbit setbit 二进制操作实现


## 客户端和服务器的相关

### 事务处理器实现 ae.c

### 单机Redis服务器实现 redis.c

### 其他

* scripting.c	Lua 脚本功能的实现。
* slowlog.c	慢查询功能的实现。
* monitor.c	监视器功能的实现。

## 多机实现

slaveof ip port

### 2.8 salveof
* sync 主生成rdb文件 缓冲区记录命令, 发给slave
* 传播, 主修改后, 给从发相同的命令 保持一致
* 断线恢复问题大:sync是全量的 低效 费资源

### 3.0 psync 替代sync
1. 完整同步 full resync
2. 部分同步 partial resync 处理断线重连问题
   1. 复制偏移量
   2. 复制积压缓冲区 固定长度的先进先出队列 偏移量在缓冲区就部分同步, 不在就完整同步
      1. repl-backlog-size 128mb sec(重连需要配平均时间)*write_size_per_second(每秒写命令数据量)
   3. 服务器运行id 确定唯一性, 如果从保存的主id不是现在连的主id, 说明连的不是之前的主, 做full resync


### replication.c	复制功能的实现代码。
### sentinel.c	Redis Sentinel 的实现代码。
初始化
1. 初始化服务器
   1. 不使用数据库方面的命令, 事务命令, 持久化命令
   2. 使用复制命令, 发布订阅命令, 文件时间处理器, 时间事件处理器
2. 将普通的redis服务器使用代码替换成sentinel专用代码, 载入自己的命令, 替换默认配置
3. 初始化sentinel状态
4. 根据给定的配置文件, 初始化sentinel的监视的主主服务器列表sentinelState->masters->key name value - > sentinelRedisInstance
5. 创建连向主服务器的网络连接

* 方法和原理
*
* down-after-milliseconds 对 当前master和监视master的从,sentinel
* 多个配置下线时长不同, 有的认为下线, 有的则不是
* SRI_S_DOWN 主观下线
* SRI_O_DOWN 客观下线
*
* is-master-by-addr 询问其他sentinel < - down_state, leader_runid, leader_epoch
*
* 选举领头sentinel raft
* 需要进行故障转移
1. 从里选一个从作为主 salveof no one 转主
   1. 正常未下线,最近通信,优先级高
   2. 复制偏移量最大
   3. runid 最小
2. 其他从改为复制新主 salveof ip port, 槽指派给新主
3. 旧主重新上线会成为新主


### cluster.c	Redis 集群的实现代码。
* node
* 重新分片 通过redis-trib
* 目标节点准备导入槽slot的键值对
* 源节点准备迁移槽slot的键值对
*
* ask 错误
* moved
* 多主?
* 每个节点会记录那些槽位指派给了自己,
* 检查槽是不是自己负责, 不然返回moved



### 文件事件
* AE_READABLE
* AE_WRITEABLE
* 连接应答处理器 acceptTcpHandler
* 命令请求处理器 readQueryFromClient
* 命令回复处理器 sendReplyToClient

### 时间事件

* 全局id, 到达时间when 时间处理器 timeProc
* 定时事件 AE_NOMORE
* 周期性事件 非AE_NOMORE
* 时间在文件事件后
*
* serverCron
*
* 时间事件的实际处理时间通常回避设定的到达时间晚一点

### 客户端

* redisClient
* new Client
* 存在RedisServer->clients
* flags表示客户端角色
* 输入输出缓冲区
* 命令信息cmd args
* 时间记录
* 被动关闭客户端
* fd -1(伪客户端)

### 服务端

#### 命令执行过程

1. 客户端转换命令成协议格式,发送给服务器
2. 服务端命令请求处理器执行
    * 读取到客户端状态的输入缓冲区
    * 分析请求, 保存到arg
3. 找到执行实现函数, 得到回复
    * 调用命令执行器
      * argv[0] 找有没有指定的命令
      * 找到命令的实现函数
      * 校验是否有实现函数, 参数个数是否正确,身份验证,检查服务器内存.....
      * 调用实现函数
      * 后续工作,慢查询, aof, 更新时间, 更新计数器
4. 命令返回给客户端
#### serverCron
* 默认100ms执行一次 管理服务器的资源, 保持服务器自身的良好运转
* 获取时间需要做系统调用, 所以redisServer中的unixtime和msttime作为当前时间的缓存,精度不高
* clientCron() databasesCron() aofCron()
* 处理服务器接受的SIGTREM信号,

##### 初始化服务器
1. 初始化一般属性 initServerConfig()
2. 载入配置 loadServerConfig()
3. 初始化数据结构 initServer()
  创建共享对象
  信号处理器
  打开服务器监听端口
  为serverCron创建时间事件
  打开aof文件
  初始化i/o
redisAsciiArt()
4. 还原数据库状态 loadDataFromDisk()
5. 执行事件loop

#### 慢查询日志

* slowlog 链表  slowlogEntery结构
* 新的在表头
*
* slowlog-log-slower-than
* slowlog-max-len
*
* slowlog get
*
* slowlogCommand
* slowlogPushEntryIfNeeded
* slowlogCreateEntry

#### 监视器

redisServer.monitors


## 资料

* [公众号redis](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzI0NTE4NDg0NA==&action=getalbum&album_id=1725600385232322562&scene=173&from_msgid=2247483875&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
* [公众号redis2](https://mp.weixin.qq.com/s?__biz=MzI0NTE4NDg0NA==&mid=2247483875&idx=1&sn=e913d929de18781246616fb704aad892&chksm=e95321c0de24a8d6ce7bdc4fb782a41a5a33cd9794db7ead88de79458c330d0b19fe7fc6bcd1&scene=178&cur_album_id=1725600385232322562#rd)
* [bookredis设计与实现](http://redisbook.com/)
* [如何阅读redis源码](https://blog.huangz.me/diary/2014/how-to-read-redis-source-code.html)
* [redis官网](https://redis.io/docs/about/)



## else

redis前增加Twemproxy: 可以做多语言支持,多机房流量调度, 减小集群扩缩容的感知,热key检测等
Twemproxy是一个支持redis和memcached的轻量代理,主要特性有维护cache server的连接池, pipline指令,zero copy, key sharding等
数据分片方式根据配置文件中的hash(哈希函数, md5,crc16)和distribution决定
distribution默认支持有三种:
* katama: 一致性hash算法, 构造hash_ring, 根据hash值顺时针选择server
* modula: key hash值取模, 选择对应的srver
* random: 随机选择一个server


* 无限保存- > 磁盘满了
*
* aof 不会超过maxmem一倍, 所有的数据在内存
*
* qps 2w 单实例
* 整体多线程
* 单线程模型 网络IO 内存操作数据 单线程执行 内存淘汰 主从同步, 持久化, bio
* 瓶颈是在网络或者内存, 不在cpu
* 同步竞争问题,
* 充分利用硬件资源,
*
* 慢查询, 大key 问题核心 堵住吞吐
* 6.0 多线程 网络IO 多线程
* 数据处理还是单线程
* 多个socket 复用一个线程,
* hash 冲突, 加链表 rehash


https://blog.huangz.me/diary/2014/how-to-read-redis-source-code.html#


