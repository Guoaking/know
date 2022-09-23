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


无限保存- > 磁盘满了

aof 不会超过maxmem一倍, 所有的数据在内存

qps 2w 单实例
整体多线程
单线程模型 网络IO 内存操作数据 单线程执行 内存淘汰 主从同步, 持久化, bio
瓶颈是在网络或者内存, 不在cpu
同步竞争问题,
充分利用硬件资源,

慢查询, 大key 问题核心 堵住吞吐
6.0 多线程 网络IO 多线程
数据处理还是单线程
多个socket 复用一个线程,
hash 冲突, 加链表 rehash


https://blog.huangz.me/diary/2014/how-to-read-redis-source-code.html#

## 数据结构

### 简单动态字符串 sds.c
新增了字符串长度记录
多余空间分配
* 常数复杂度获取len
* 杜绝缓冲区溢出
* 减少修改字符串长度时所需的内存存分配次数
* 二进制安全
* 兼容部分c字符串函数
* set key
* strlen

### 双端列表 adlist.c
* 无环
* 列表键, 发布订阅, 慢查询, 监视器

### 字典实现 dict.c
* dict->dictEntry[2], 另一个在渐进式rehash使用

### 跳跃表实现 redis.h-> zskiplist, zskiplistNode t_zset.c zsl
zset使用, 集群节点中用作内部数据结构

### HyperLogLog hyperloglog.c hll


## 内存编码数据结构实现

### 整数集合 intset.c
set add
ojbect encoding key
会做升级
* 灵活各种数据类型都能放
* 有需要时才升级节约内存
* 不支持降级


### 压缩列表 ziplist.c
hash list
节约内存
包含多个节点, 每个节点可以保存一个字节数组或者整数
可能引发连锁更新操作, 概率不高

## 数据类型实现

### 对象类型实现 object.c

### 字符串键实现 t_string.c

embstr 一次内存直接减rdsojbect sds
row  2次
int 存成str 可以append
44 embstr->row
H

### 列表键实现 t_list.c

ziplist和linkedlist
quicklist

### 散列建 t_hash.c

编码转换 ziplist->hashtable

### 集合键 t_set.c
intset hashtable
纯数字不超过512 就是intset

### 有序集合 t_zset.c 排除zsl的
ziplist skiplist
skiplist -> zet (zskiplist,dict)
ziplist 数量小于128&&所有元素成员长度小于64字节


### hyperLoglog hyperloglog.c pf开头


引用计数 refcount
共享数据 OBJ_SHARED_INTEGERS
空转时间lru idletime

## 数据库实现相关

### 数据库 redis.h->redisDb, db.c
redisServer -> redisDB -> dict
select
expires dict 都通过
定时删除  对内存友好 对cpu时间不友好
惰性删除  对内存不友好, 永远不会被访问, 内存泄露 db.c/expireIfNeeded->deleteExpiredKeyAndPropagate

定期删除  确定删除的时长和频率
old redis.c/activeExpireCycle
new expire.c/activeExpireCycle

rdb save时会排除过期key
load 主会排除过期key  从都加载

aof 显式记录过期del

### 数据库通知实现  notify.c

notifyKeyspaceEvent
keyspace
keyevent

### RDB rdb.c

### AOF aof.c

## 选读

### 发布订阅

### 事务实现

### SORT实现

### getbit setbit 二进制操作实现


## 客户端和服务器的相关

### 事务处理器实现 ae.c

### 单机Redis服务器实现 redis.c

### 其他

scripting.c	Lua 脚本功能的实现。
slowlog.c	慢查询功能的实现。
monitor.c	监视器功能的实现。

## 多机实现

### replication.c	复制功能的实现代码。
### sentinel.c	Redis Sentinel 的实现代码。
### cluster.c	Redis 集群的实现代码。