
### HyperLogLog hyperloglog.c hll


### hyperLoglog hyperloglog.c pf开头


引用计数 refcount
共享数据 OBJ_SHARED_INTEGERS
空转时间lru idletime


## 数据库实现相关

### 数据库
<!-- tabs:start -->

#### **db 说明**

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


#### **db struct**

```c
redis.h->redisDb, db.c

typedef struct redisDb {

    // 数据库键空间，保存着数据库中的所有键值对
    dict *dict;                 /* The keyspace for this DB */

    // 键的过期时间，字典的键为键，字典的值为过期事件 UNIX 时间戳
    dict *expires;              /* Timeout of keys with a timeout set */

    // 正处于阻塞状态的键
    dict *blocking_keys;        /* Keys with clients waiting for data (BLPOP) */

    // 可以解除阻塞的键
    dict *ready_keys;           /* Blocked keys that received a PUSH */

    // 正在被 WATCH 命令监视的键
    dict *watched_keys;         /* WATCHED keys for MULTI/EXEC CAS */

    struct evictionPoolEntry *eviction_pool;    /* Eviction pool of keys */

    // 数据库号码
    int id;                     /* Database ID */

    // 数据库的键的平均 TTL ，统计信息
    long long avg_ttl;          /* Average TTL, just for stats */

} redisDb;

struct redisServer {

    /* General */

    // 配置文件的绝对路径
    char *configfile;           /* Absolute config file path, or NULL */

    // serverCron() 每秒调用的次数
    int hz;                     /* serverCron() calls frequency in hertz */

    // 数据库
    redisDb *db;

    // 命令表（受到 rename 配置选项的作用）
    dict *commands;             /* Command table */
    // 命令表（无 rename 配置选项的作用）
    dict *orig_commands;        /* Command table before command renaming. */

    // 事件状态
    aeEventLoop *el;

    // 最近一次使用时钟
    unsigned lruclock:REDIS_LRU_BITS; /* Clock for LRU eviction */

    // 关闭服务器的标识
    int shutdown_asap;          /* SHUTDOWN needed ASAP */

    // 在执行 serverCron() 时进行渐进式 rehash
    int activerehashing;        /* Incremental rehash in serverCron() */

    // 是否设置了密码
    char *requirepass;          /* Pass for AUTH command, or NULL */

    // PID 文件
    char *pidfile;              /* PID file path */

    // 架构类型
    int arch_bits;              /* 32 or 64 depending on sizeof(long) */

    // serverCron() 函数的运行次数计数器
    int cronloops;              /* Number of times the cron function run */

    // 本服务器的 RUN ID
    char runid[REDIS_RUN_ID_SIZE+1];  /* ID always different at every exec. */

    // 服务器是否运行在 SENTINEL 模式
    int sentinel_mode;          /* True if this instance is a Sentinel. */


    /* Networking */

    // TCP 监听端口
    int port;                   /* TCP listening port */

    int tcp_backlog;            /* TCP listen() backlog */

    // 地址
    char *bindaddr[REDIS_BINDADDR_MAX]; /* Addresses we should bind to */
    // 地址数量
    int bindaddr_count;         /* Number of addresses in server.bindaddr[] */

    // UNIX 套接字
    char *unixsocket;           /* UNIX socket path */
    mode_t unixsocketperm;      /* UNIX socket permission */

    // 描述符
    int ipfd[REDIS_BINDADDR_MAX]; /* TCP socket file descriptors */
    // 描述符数量
    int ipfd_count;             /* Used slots in ipfd[] */

    // UNIX 套接字文件描述符
    int sofd;                   /* Unix socket file descriptor */

    int cfd[REDIS_BINDADDR_MAX];/* Cluster bus listening socket */
    int cfd_count;              /* Used slots in cfd[] */

    // 一个链表，保存了所有客户端状态结构
    list *clients;              /* List of active clients */
    // 链表，保存了所有待关闭的客户端
    list *clients_to_close;     /* Clients to close asynchronously */

    // 链表，保存了所有从服务器，以及所有监视器
    list *slaves, *monitors;    /* List of slaves and MONITORs */

    // 服务器的当前客户端，仅用于崩溃报告
    redisClient *current_client; /* Current client, only used on crash report */

    int clients_paused;         /* True if clients are currently paused */
    mstime_t clients_pause_end_time; /* Time when we undo clients_paused */

    // 网络错误
    char neterr[ANET_ERR_LEN];   /* Error buffer for anet.c */

    // MIGRATE 缓存
    dict *migrate_cached_sockets;/* MIGRATE cached sockets */


    /* RDB / AOF loading information */

    // 这个值为真时，表示服务器正在进行载入
    int loading;                /* We are loading data from disk if true */

    // 正在载入的数据的大小
    off_t loading_total_bytes;

    // 已载入数据的大小
    off_t loading_loaded_bytes;

    // 开始进行载入的时间
    time_t loading_start_time;
    off_t loading_process_events_interval_bytes;

    /* Fast pointers to often looked up command */
    // 常用命令的快捷连接
    struct redisCommand *delCommand, *multiCommand, *lpushCommand, *lpopCommand,
                        *rpopCommand;


    /* Fields used only for stats */

    // 服务器启动时间
    time_t stat_starttime;          /* Server start time */

    // 已处理命令的数量
    long long stat_numcommands;     /* Number of processed commands */

    // 服务器接到的连接请求数量
    long long stat_numconnections;  /* Number of connections received */

    // 已过期的键数量
    long long stat_expiredkeys;     /* Number of expired keys */

    // 因为回收内存而被释放的过期键的数量
    long long stat_evictedkeys;     /* Number of evicted keys (maxmemory) */

    // 成功查找键的次数
    long long stat_keyspace_hits;   /* Number of successful lookups of keys */

    // 查找键失败的次数
    long long stat_keyspace_misses; /* Number of failed lookups of keys */

    // 已使用内存峰值
    size_t stat_peak_memory;        /* Max used memory record */

    // 最后一次执行 fork() 时消耗的时间
    long long stat_fork_time;       /* Time needed to perform latest fork() */

    // 服务器因为客户端数量过多而拒绝客户端连接的次数
    long long stat_rejected_conn;   /* Clients rejected because of maxclients */

    // 执行 full sync 的次数
    long long stat_sync_full;       /* Number of full resyncs with slaves. */

    // PSYNC 成功执行的次数
    long long stat_sync_partial_ok; /* Number of accepted PSYNC requests. */

    // PSYNC 执行失败的次数
    long long stat_sync_partial_err;/* Number of unaccepted PSYNC requests. */


    /* slowlog */

    // 保存了所有慢查询日志的链表
    list *slowlog;                  /* SLOWLOG list of commands */

    // 下一条慢查询日志的 ID
    long long slowlog_entry_id;     /* SLOWLOG current entry ID */

    // 服务器配置 slowlog-log-slower-than 选项的值
    long long slowlog_log_slower_than; /* SLOWLOG time limit (to get logged) */

    // 服务器配置 slowlog-max-len 选项的值
    unsigned long slowlog_max_len;     /* SLOWLOG max number of items logged */
    size_t resident_set_size;       /* RSS sampled in serverCron(). */
    /* The following two are used to track instantaneous "load" in terms
     * of operations per second. */
    // 最后一次进行抽样的时间
    long long ops_sec_last_sample_time; /* Timestamp of last sample (in ms) */
    // 最后一次抽样时，服务器已执行命令的数量
    long long ops_sec_last_sample_ops;  /* numcommands in last sample */
    // 抽样结果
    long long ops_sec_samples[REDIS_OPS_SEC_SAMPLES];
    // 数组索引，用于保存抽样结果，并在需要时回绕到 0
    int ops_sec_idx;


    /* Configuration */

    // 日志可见性
    int verbosity;                  /* Loglevel in redis.conf */

    // 客户端最大空转时间
    int maxidletime;                /* Client timeout in seconds */

    // 是否开启 SO_KEEPALIVE 选项
    int tcpkeepalive;               /* Set SO_KEEPALIVE if non-zero. */
    int active_expire_enabled;      /* Can be disabled for testing purposes. */
    size_t client_max_querybuf_len; /* Limit for client query buffer length */
    int dbnum;                      /* Total number of configured DBs */
    int daemonize;                  /* True if running as a daemon */
    // 客户端输出缓冲区大小限制
    // 数组的元素有 REDIS_CLIENT_LIMIT_NUM_CLASSES 个
    // 每个代表一类客户端：普通、从服务器、pubsub，诸如此类
    clientBufferLimitsConfig client_obuf_limits[REDIS_CLIENT_LIMIT_NUM_CLASSES];


    /* AOF persistence */

    // AOF 状态（开启/关闭/可写）
    int aof_state;                  /* REDIS_AOF_(ON|OFF|WAIT_REWRITE) */

    // 所使用的 fsync 策略（每个写入/每秒/从不）
    int aof_fsync;                  /* Kind of fsync() policy */
    char *aof_filename;             /* Name of the AOF file */
    int aof_no_fsync_on_rewrite;    /* Don't fsync if a rewrite is in prog. */
    int aof_rewrite_perc;           /* Rewrite AOF if % growth is > M and... */
    off_t aof_rewrite_min_size;     /* the AOF file is at least N bytes. */

    // 最后一次执行 BGREWRITEAOF 时， AOF 文件的大小
    off_t aof_rewrite_base_size;    /* AOF size on latest startup or rewrite. */

    // AOF 文件的当前字节大小
    off_t aof_current_size;         /* AOF current size. */
    int aof_rewrite_scheduled;      /* Rewrite once BGSAVE terminates. */

    // 负责进行 AOF 重写的子进程 ID
    pid_t aof_child_pid;            /* PID if rewriting process */

    // AOF 重写缓存链表，链接着多个缓存块
    list *aof_rewrite_buf_blocks;   /* Hold changes during an AOF rewrite. */

    // AOF 缓冲区
    sds aof_buf;      /* AOF buffer, written before entering the event loop */

    // AOF 文件的描述符
    int aof_fd;       /* File descriptor of currently selected AOF file */

    // AOF 的当前目标数据库
    int aof_selected_db; /* Currently selected DB in AOF */

    // 推迟 write 操作的时间
    time_t aof_flush_postponed_start; /* UNIX time of postponed AOF flush */

    // 最后一直执行 fsync 的时间
    time_t aof_last_fsync;            /* UNIX time of last fsync() */
    time_t aof_rewrite_time_last;   /* Time used by last AOF rewrite run. */

    // AOF 重写的开始时间
    time_t aof_rewrite_time_start;  /* Current AOF rewrite start time. */

    // 最后一次执行 BGREWRITEAOF 的结果
    int aof_lastbgrewrite_status;   /* REDIS_OK or REDIS_ERR */

    // 记录 AOF 的 write 操作被推迟了多少次
    unsigned long aof_delayed_fsync;  /* delayed AOF fsync() counter */

    // 指示是否需要每写入一定量的数据，就主动执行一次 fsync()
    int aof_rewrite_incremental_fsync;/* fsync incrementally while rewriting? */
    int aof_last_write_status;      /* REDIS_OK or REDIS_ERR */
    int aof_last_write_errno;       /* Valid if aof_last_write_status is ERR */
    /* RDB persistence */

    // 自从上次 SAVE 执行以来，数据库被修改的次数
    long long dirty;                /* Changes to DB from the last save */

    // BGSAVE 执行前的数据库被修改次数
    long long dirty_before_bgsave;  /* Used to restore dirty on failed BGSAVE */

    // 负责执行 BGSAVE 的子进程的 ID
    // 没在执行 BGSAVE 时，设为 -1
    pid_t rdb_child_pid;            /* PID of RDB saving child */
    struct saveparam *saveparams;   /* Save points array for RDB */
    int saveparamslen;              /* Number of saving points */
    char *rdb_filename;             /* Name of RDB file */
    int rdb_compression;            /* Use compression in RDB? */
    int rdb_checksum;               /* Use RDB checksum? */

    // 最后一次完成 SAVE 的时间
    time_t lastsave;                /* Unix time of last successful save */

    // 最后一次尝试执行 BGSAVE 的时间
    time_t lastbgsave_try;          /* Unix time of last attempted bgsave */

    // 最近一次 BGSAVE 执行耗费的时间
    time_t rdb_save_time_last;      /* Time used by last RDB save run. */

    // 数据库最近一次开始执行 BGSAVE 的时间
    time_t rdb_save_time_start;     /* Current RDB save start time. */

    // 最后一次执行 SAVE 的状态
    int lastbgsave_status;          /* REDIS_OK or REDIS_ERR */
    int stop_writes_on_bgsave_err;  /* Don't allow writes if can't BGSAVE */


    /* Propagation of commands in AOF / replication */
    redisOpArray also_propagate;    /* Additional command to propagate. */


    /* Logging */
    char *logfile;                  /* Path of log file */
    int syslog_enabled;             /* Is syslog enabled? */
    char *syslog_ident;             /* Syslog ident */
    int syslog_facility;            /* Syslog facility */


    /* Replication (master) */
    int slaveseldb;                 /* Last SELECTed DB in replication output */
    // 全局复制偏移量（一个累计值）
    long long master_repl_offset;   /* Global replication offset */
    // 主服务器发送 PING 的频率
    int repl_ping_slave_period;     /* Master pings the slave every N seconds */

    // backlog 本身
    char *repl_backlog;             /* Replication backlog for partial syncs */
    // backlog 的长度
    long long repl_backlog_size;    /* Backlog circular buffer size */
    // backlog 中数据的长度
    long long repl_backlog_histlen; /* Backlog actual data length */
    // backlog 的当前索引
    long long repl_backlog_idx;     /* Backlog circular buffer current offset */
    // backlog 中可以被还原的第一个字节的偏移量
    long long repl_backlog_off;     /* Replication offset of first byte in the
                                       backlog buffer. */
    // backlog 的过期时间
    time_t repl_backlog_time_limit; /* Time without slaves after the backlog
                                       gets released. */

    // 距离上一次有从服务器的时间
    time_t repl_no_slaves_since;    /* We have no slaves since that time.
                                       Only valid if server.slaves len is 0. */

    // 是否开启最小数量从服务器写入功能
    int repl_min_slaves_to_write;   /* Min number of slaves to write. */
    // 定义最小数量从服务器的最大延迟值
    int repl_min_slaves_max_lag;    /* Max lag of <count> slaves to write. */
    // 延迟良好的从服务器的数量
    int repl_good_slaves_count;     /* Number of slaves with lag <= max_lag. */


    /* Replication (slave) */
    // 主服务器的验证密码
    char *masterauth;               /* AUTH with this password with master */
    // 主服务器的地址
    char *masterhost;               /* Hostname of master */
    // 主服务器的端口
    int masterport;                 /* Port of master */
    // 超时时间
    int repl_timeout;               /* Timeout after N seconds of master idle */
    // 主服务器所对应的客户端
    redisClient *master;     /* Client that is master for this slave */
    // 被缓存的主服务器，PSYNC 时使用
    redisClient *cached_master; /* Cached master to be reused for PSYNC. */
    int repl_syncio_timeout; /* Timeout for synchronous I/O calls */
    // 复制的状态（服务器是从服务器时使用）
    int repl_state;          /* Replication status if the instance is a slave */
    // RDB 文件的大小
    off_t repl_transfer_size; /* Size of RDB to read from master during sync. */
    // 已读 RDB 文件内容的字节数
    off_t repl_transfer_read; /* Amount of RDB read from master during sync. */
    // 最近一次执行 fsync 时的偏移量
    // 用于 sync_file_range 函数
    off_t repl_transfer_last_fsync_off; /* Offset when we fsync-ed last time. */
    // 主服务器的套接字
    int repl_transfer_s;     /* Slave -> Master SYNC socket */
    // 保存 RDB 文件的临时文件的描述符
    int repl_transfer_fd;    /* Slave -> Master SYNC temp file descriptor */
    // 保存 RDB 文件的临时文件名字
    char *repl_transfer_tmpfile; /* Slave-> master SYNC temp file name */
    // 最近一次读入 RDB 内容的时间
    time_t repl_transfer_lastio; /* Unix time of the latest read, for timeout */
    int repl_serve_stale_data; /* Serve stale data when link is down? */
    // 是否只读从服务器？
    int repl_slave_ro;          /* Slave is read only? */
    // 连接断开的时长
    time_t repl_down_since; /* Unix time at which link with master went down */
    // 是否要在 SYNC 之后关闭 NODELAY ？
    int repl_disable_tcp_nodelay;   /* Disable TCP_NODELAY after SYNC? */
    // 从服务器优先级
    int slave_priority;             /* Reported in INFO and used by Sentinel. */
    // 本服务器（从服务器）当前主服务器的 RUN ID
    char repl_master_runid[REDIS_RUN_ID_SIZE+1];  /* Master run id for PSYNC. */
    // 初始化偏移量
    long long repl_master_initial_offset;         /* Master PSYNC offset. */


    /* Replication script cache. */
    // 复制脚本缓存
    // 字典
    dict *repl_scriptcache_dict;        /* SHA1 all slaves are aware of. */
    // FIFO 队列
    list *repl_scriptcache_fifo;        /* First in, first out LRU eviction. */
    // 缓存的大小
    int repl_scriptcache_size;          /* Max number of elements. */

    /* Synchronous replication. */
    list *clients_waiting_acks;         /* Clients waiting in WAIT command. */
    int get_ack_from_slaves;            /* If true we send REPLCONF GETACK. */
    /* Limits */
    int maxclients;                 /* Max number of simultaneous clients */
    unsigned long long maxmemory;   /* Max number of memory bytes to use */
    int maxmemory_policy;           /* Policy for key eviction */
    int maxmemory_samples;          /* Pricision of random sampling */


    /* Blocked clients */
    unsigned int bpop_blocked_clients; /* Number of clients blocked by lists */
    list *unblocked_clients; /* list of clients to unblock before next loop */
    list *ready_keys;        /* List of readyList structures for BLPOP & co */


    /* Sort parameters - qsort_r() is only available under BSD so we
     * have to take this state global, in order to pass it to sortCompare() */
    int sort_desc;
    int sort_alpha;
    int sort_bypattern;
    int sort_store;


    /* Zip structure config, see redis.conf for more information  */
    size_t hash_max_ziplist_entries;
    size_t hash_max_ziplist_value;
    size_t list_max_ziplist_entries;
    size_t list_max_ziplist_value;
    size_t set_max_intset_entries;
    size_t zset_max_ziplist_entries;
    size_t zset_max_ziplist_value;
    size_t hll_sparse_max_bytes;
    time_t unixtime;        /* Unix time sampled every cron cycle. */
    long long mstime;       /* Like 'unixtime' but with milliseconds resolution. */


    /* Pubsub */
    // 字典，键为频道，值为链表
    // 链表中保存了所有订阅某个频道的客户端
    // 新客户端总是被添加到链表的表尾
    dict *pubsub_channels;  /* Map channels to list of subscribed clients */

    // 这个链表记录了客户端订阅的所有模式的名字
    list *pubsub_patterns;  /* A list of pubsub_patterns */

    int notify_keyspace_events; /* Events to propagate via Pub/Sub. This is an
                                   xor of REDIS_NOTIFY... flags. */


    /* Cluster */

    int cluster_enabled;      /* Is cluster enabled? */
    mstime_t cluster_node_timeout; /* Cluster node timeout. */
    char *cluster_configfile; /* Cluster auto-generated config file name. */
    struct clusterState *cluster;  /* State of the cluster */

    int cluster_migration_barrier; /* Cluster replicas migration barrier. */
    /* Scripting */

    // Lua 环境
    lua_State *lua; /* The Lua interpreter. We use just one for all clients */

    // 复制执行 Lua 脚本中的 Redis 命令的伪客户端
    redisClient *lua_client;   /* The "fake client" to query Redis from Lua */

    // 当前正在执行 EVAL 命令的客户端，如果没有就是 NULL
    redisClient *lua_caller;   /* The client running EVAL right now, or NULL */

    // 一个字典，值为 Lua 脚本，键为脚本的 SHA1 校验和
    dict *lua_scripts;         /* A dictionary of SHA1 -> Lua scripts */
    // Lua 脚本的执行时限
    mstime_t lua_time_limit;  /* Script timeout in milliseconds */
    // 脚本开始执行的时间
    mstime_t lua_time_start;  /* Start time of script, milliseconds time */

    // 脚本是否执行过写命令
    int lua_write_dirty;  /* True if a write command was called during the
                             execution of the current script. */

    // 脚本是否执行过带有随机性质的命令
    int lua_random_dirty; /* True if a random command was called during the
                             execution of the current script. */

    // 脚本是否超时
    int lua_timedout;     /* True if we reached the time limit for script
                             execution. */

    // 是否要杀死脚本
    int lua_kill;         /* Kill the script if true. */


    /* Assert & bug reporting */

    char *assert_failed;
    char *assert_file;
    int assert_line;
    int bug_report_start; /* True if bug report header was already logged. */
    int watchdog_period;  /* Software watchdog period in ms. 0 = off */
};



```

<!-- tabs:end -->



### 数据库通知实现


<!-- tabs:start -->

#### **notify 说明**
* notifyKeyspaceEvent
* keyspace
* keyevent


#### **notify struct**

```c
notify.c

```

<!-- tabs:end -->


### RDB rdb.c

<!-- tabs:start -->

#### **rdb 说明**

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


#### **rdb struct**

```c


```

<!-- tabs:end -->

### AOF aof.c


<!-- tabs:start -->

#### **aof 说明**

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


#### **aof struct**

```c


```

<!-- tabs:end -->


## 选读

### 发布订阅

<!-- tabs:start -->

#### **subscribe 说明**


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

#### **subscribe struct**

```c


```

<!-- tabs:end -->


### 事务实现

<!-- tabs:start -->

#### **trx 说明**

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


#### **trx struct**

```c


```

<!-- tabs:end -->



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



<!-- tabs:start -->

#### **copy 说明**

slaveof ip port

2.8 salveof
* sync 主生成rdb文件 缓冲区记录命令, 发给slave
* 传播, 主修改后, 给从发相同的命令 保持一致
* 断线恢复问题大:sync是全量的 低效 费资源

3.0 psync 替代sync
1. 完整同步 full resync
2. 部分同步 partial resync 处理断线重连问题
   1. 复制偏移量
   2. 复制积压缓冲区 固定长度的先进先出队列 偏移量在缓冲区就部分同步, 不在就完整同步
      1. repl-backlog-size 128mb sec(重连需要配平均时间)*write_size_per_second(每秒写命令数据量)
   3. 服务器运行id 确定唯一性, 如果从保存的主id不是现在连的主id, 说明连的不是之前的主, 做full resync



#### **copy  struct**

```c


```

<!-- tabs:end -->



### replication.c	复制功能的实现代码。
### sentinel.c	Redis Sentinel 的实现代码。

<!-- tabs:start -->

#### **sentinel 说明**

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



#### **sentienl struct**

```c


```

<!-- tabs:end -->


### cluster.c	Redis 集群的实现代码。


<!-- tabs:start -->

#### **cluster说明**

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


#### **cluster struct**

```c


```

<!-- tabs:end -->



### 文件事件


<!-- tabs:start -->

#### **event 说明**

* AE_READABLE
* AE_WRITEABLE
* 连接应答处理器 acceptTcpHandler
* 命令请求处理器 readQueryFromClient
* 命令回复处理器 sendReplyToClient


#### **event struct**

```c


```

<!-- tabs:end -->


### 时间事件



<!-- tabs:start -->

#### **time event 说明**

* 全局id, 到达时间when 时间处理器 timeProc
* 定时事件 AE_NOMORE
* 周期性事件 非AE_NOMORE
* 时间在文件事件后
*
* serverCron
*
* 时间事件的实际处理时间通常回避设定的到达时间晚一点


#### **time event struct**

```c


```

<!-- tabs:end -->


### 客户端


<!-- tabs:start -->

#### **client 说明**

* redisClient
* new Client
* 存在RedisServer->clients
* flags表示客户端角色
* 输入输出缓冲区
* 命令信息cmd args
* 时间记录
* 被动关闭客户端
* fd -1(伪客户端)


#### **client struct**

```c

/* With multiplexing we need to take per-client state.
 * Clients are taken in a liked list.
 *
 * 因为 I/O 复用的缘故，需要为每个客户端维持一个状态。
 *
 * 多个客户端状态被服务器用链表连接起来。
 */
typedef struct redisClient {

    // 套接字描述符
    int fd;

    // 当前正在使用的数据库
    redisDb *db;

    // 当前正在使用的数据库的 id （号码）
    int dictid;

    // 客户端的名字
    robj *name;             /* As set by CLIENT SETNAME */

    // 查询缓冲区
    sds querybuf;

    // 查询缓冲区长度峰值
    size_t querybuf_peak;   /* Recent (100ms or more) peak of querybuf size */

    // 参数数量
    int argc;

    // 参数对象数组
    robj **argv;

    // 记录被客户端执行的命令
    struct redisCommand *cmd, *lastcmd;

    // 请求的类型：内联命令还是多条命令
    int reqtype;

    // 剩余未读取的命令内容数量
    int multibulklen;       /* number of multi bulk arguments left to read */

    // 命令内容的长度
    long bulklen;           /* length of bulk argument in multi bulk request */

    // 回复链表
    list *reply;

    // 回复链表中对象的总大小
    unsigned long reply_bytes; /* Tot bytes of objects in reply list */

    // 已发送字节，处理 short write 用
    int sentlen;            /* Amount of bytes already sent in the current
                               buffer or object being sent. */

    // 创建客户端的时间
    time_t ctime;           /* Client creation time */

    // 客户端最后一次和服务器互动的时间
    time_t lastinteraction; /* time of the last interaction, used for timeout */

    // 客户端的输出缓冲区超过软性限制的时间
    time_t obuf_soft_limit_reached_time;

    // 客户端状态标志
    int flags;              /* REDIS_SLAVE | REDIS_MONITOR | REDIS_MULTI ... */

    // 当 server.requirepass 不为 NULL 时
    // 代表认证的状态
    // 0 代表未认证， 1 代表已认证
    int authenticated;      /* when requirepass is non-NULL */

    // 复制状态
    int replstate;          /* replication state if this is a slave */
    // 用于保存主服务器传来的 RDB 文件的文件描述符
    int repldbfd;           /* replication DB file descriptor */

    // 读取主服务器传来的 RDB 文件的偏移量
    off_t repldboff;        /* replication DB file offset */
    // 主服务器传来的 RDB 文件的大小
    off_t repldbsize;       /* replication DB file size */

    sds replpreamble;       /* replication DB preamble. */

    // 主服务器的复制偏移量
    long long reploff;      /* replication offset if this is our master */
    // 从服务器最后一次发送 REPLCONF ACK 时的偏移量
    long long repl_ack_off; /* replication ack offset, if this is a slave */
    // 从服务器最后一次发送 REPLCONF ACK 的时间
    long long repl_ack_time;/* replication ack time, if this is a slave */
    // 主服务器的 master run ID
    // 保存在客户端，用于执行部分重同步
    char replrunid[REDIS_RUN_ID_SIZE+1]; /* master run id if this is a master */
    // 从服务器的监听端口号
    int slave_listening_port; /* As configured with: SLAVECONF listening-port */

    // 事务状态
    multiState mstate;      /* MULTI/EXEC state */

    // 阻塞类型
    int btype;              /* Type of blocking op if REDIS_BLOCKED. */
    // 阻塞状态
    blockingState bpop;     /* blocking state */

    // 最后被写入的全局复制偏移量
    long long woff;         /* Last write global replication offset. */

    // 被监视的键
    list *watched_keys;     /* Keys WATCHED for MULTI/EXEC CAS */

    // 这个字典记录了客户端所有订阅的频道
    // 键为频道名字，值为 NULL
    // 也即是，一个频道的集合
    dict *pubsub_channels;  /* channels a client is interested in (SUBSCRIBE) */

    // 链表，包含多个 pubsubPattern 结构
    // 记录了所有订阅频道的客户端的信息
    // 新 pubsubPattern 结构总是被添加到表尾
    list *pubsub_patterns;  /* patterns a client is interested in (SUBSCRIBE) */
    sds peerid;             /* Cached peer ID. */

    /* Response buffer */
    // 回复偏移量
    int bufpos;
    // 回复缓冲区
    char buf[REDIS_REPLY_CHUNK_BYTES];

} redisClient;


```

<!-- tabs:end -->


### 服务端

#### 命令执行过程

<!-- tabs:start -->

#### **server 说明**


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


#### ** server struct**

```c


```

<!-- tabs:end -->


##### 初始化服务器


<!-- tabs:start -->

#### **init server 说明**

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



#### **init server struct**

```c


```

<!-- tabs:end -->



#### 慢查询日志

<!-- tabs:start -->

#### **slowlog 说明**

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


#### **slowlog struct**

```c


```

<!-- tabs:end -->



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


