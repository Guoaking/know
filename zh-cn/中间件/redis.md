## 数据结构

### 简单动态字符串

<!-- tabs:start -->

#### **说明**

1. 需要一个可以随时被修改的字符串

* 常数复杂度获取len
* 杜绝缓冲区溢出
* 减少修改字符串长度时所需的内存存分配次数
* 二进制安全
* 兼容部分c字符串函数

#### **sdshdr**

```c
src/sds.h
struct sdshdr {
    // buf 中已占用空间的长度
    int len;

    // buf 中剩余可用空间的长度
    int free;

    // 数据空间
    char buf[];
};

```

<!-- tabs:end -->



### 双端列表

<!-- tabs:start -->

#### **双端列表 adlist.c**
* 无环
* 主要用在列表键, 发布订阅, 慢查询, 监视器

#### **adlist**

```c
/*
 * 双端链表节点
 */
typedef struct listNode {

    // 前置节点
    struct listNode *prev;

    // 后置节点
    struct listNode *next;

    // 节点的值
    void *value;

} listNode;

/*
 * 双端链表结构
 */
typedef struct list {

    // 表头节点
    listNode *head;

    // 表尾节点
    listNode *tail;

    // 节点值复制函数
    void *(*dup)(void *ptr);

    // 节点值释放函数
    void (*free)(void *ptr);

    // 节点值对比函数
    int (*match)(void *ptr, void *key);

    // 链表所包含的节点数量
    unsigned long len;

} list;

```


<!-- tabs:end -->



### 字典

<!-- tabs:start -->

#### **说明**

* dict->dictEntry[2], 另一个在渐进式rehash使用


#### **struct**

```c
dict.c
/*
 * 哈希表节点
 */
typedef struct dictEntry {

    // 键
    void *key;

    // 值
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
    } v;

    // 指向下个哈希表节点，形成链表
    struct dictEntry *next;

} dictEntry;


/*
 * 字典类型特定函数
 */
typedef struct dictType {

    // 计算哈希值的函数
    unsigned int (*hashFunction)(const void *key);

    // 复制键的函数
    void *(*keyDup)(void *privdata, const void *key);

    // 复制值的函数
    void *(*valDup)(void *privdata, const void *obj);

    // 对比键的函数
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);

    // 销毁键的函数
    void (*keyDestructor)(void *privdata, void *key);

    // 销毁值的函数
    void (*valDestructor)(void *privdata, void *obj);

} dictType;

/*
 * 哈希表
 *
 * 每个字典都使用两个哈希表，从而实现渐进式 rehash 。
 */
typedef struct dictht {

    // 哈希表数组
    dictEntry **table;

    // 哈希表大小
    unsigned long size;

    // 哈希表大小掩码，用于计算索引值
    // 总是等于 size - 1
    unsigned long sizemask;

    // 该哈希表已有节点的数量
    unsigned long used;

} dictht;

/*
 * 字典
 */
typedef struct dict {

    // 类型特定函数
    dictType *type;

    // 私有数据
    void *privdata;

    // 哈希表
    dictht ht[2];

    // rehash 索引
    // 当 rehash 不在进行时，值为 -1
    int rehashidx; /* rehashing not in progress if rehashidx == -1 */

    // 目前正在运行的安全迭代器的数量
    int iterators; /* number of iterators currently running */

} dict;


```

<!-- tabs:end -->


### 跳跃表实现

<!-- tabs:start -->

#### **说明**

zset使用, 集群节点中用作内部数据结构

#### **struct**

```c
redis.h

/*
 * 跳跃表节点
 */
typedef struct zskiplistNode {

    // 成员对象
    robj *obj;

    // 分值
    double score;

    // 后退指针
    struct zskiplistNode *backward;

    // 层
    struct zskiplistLevel {

        // 前进指针
        struct zskiplistNode *forward;

        // 跨度
        unsigned int span;

    } level[];

} zskiplistNode;

/*
 * 跳跃表
 */
typedef struct zskiplist {

    // 表头节点和表尾节点
    struct zskiplistNode *header, *tail;

    // 表中节点的数量
    unsigned long length;

    // 表中层数最大的节点的层数
    int level;

} zskiplist;

```

<!-- tabs:end -->


## 内存编码数据结构实现



### 整数集合

<!-- tabs:start -->

#### **说明**

* set add
* ojbect encoding key
* 会做类型升级 不支持降级
* * 灵活各种数据类型都能放
* 有需要时才升级节约内存


#### **struct**

```c
intset.h intset.c
typedef struct intset {

    // 编码方式
    uint32_t encoding;

    // 集合包含的元素数量
    uint32_t length;

    // 保存元素的数组
    int8_t contents[];

} intset;

```

<!-- tabs:end -->

### 压缩列表

<!-- tabs:start -->

#### **说明**

为了解压内存, 包含多个节点, 每个节点可以保存一个字节数组或者整数, 可能引发连锁更新操作, 概率不高
* hash
* list
*
#### **struct**

```c

ziplist.c

/*
 * 保存 ziplist 节点信息的结构
 */
typedef struct zlentry {

    // prevrawlen ：前置节点的长度
    // prevrawlensize ：编码 prevrawlen 所需的字节大小
    unsigned int prevrawlensize, prevrawlen;

    // len ：当前节点值的长度
    // lensize ：编码 len 所需的字节大小
    unsigned int lensize, len;

    // 当前节点 header 的大小
    // 等于 prevrawlensize + lensize
    unsigned int headersize;

    // 当前节点值所使用的编码类型
    unsigned char encoding;

    // 指向当前节点的指针
    unsigned char *p;

} zlentry;

```

<!-- tabs:end -->


## 对象

### redisobject

<!-- tabs:start -->

#### **说明**

类型| 编码| 对象
--|--|--
REDIS_STRING| 	REDIS_ENCODING_INT	|使用整数值实现的字符串对象。
REDIS_STRING| 	REDIS_ENCODING_EMBSTR	|使用 embstr 编码的简单动态字符串实现的字符串对象。
REDIS_STRING| 	REDIS_ENCODING_RAW	|使用简单动态字符串实现的字符串对象。
REDIS_LIST	| REDIS_ENCODING_ZIPLIST	|使用压缩列表实现的列表对象。
REDIS_LIST	| REDIS_ENCODING_LINKEDLIST	|使用双端链表实现的列表对象。
REDIS_HASH	| REDIS_ENCODING_ZIPLIST	|使用压缩列表实现的哈希对象。
REDIS_HASH	| REDIS_ENCODING_HT	|使用字典实现的哈希对象。
REDIS_SET	| REDIS_ENCODING_INTSET	|使用整数集合实现的集合对象。
REDIS_SET	| REDIS_ENCODING_HT	|使用字典实现的集合对象。
REDIS_ZSET	| REDIS_ENCODING_ZIPLIST	|使用压缩列表实现的有序集合对象。
REDIS_ZSET	| REDIS_ENCODING_SKIPLIST	|使用跳跃表和字典实现的有序集合对象。


#### **struct**

```c
redis.h
/*
 * Redis 对象
 */
#define REDIS_LRU_BITS 24
#define REDIS_LRU_CLOCK_MAX ((1<<REDIS_LRU_BITS)-1) /* Max value of obj->lru */
#define REDIS_LRU_CLOCK_RESOLUTION 1000 /* LRU clock resolution in ms */
typedef struct redisObject {

    // 类型
    unsigned type:4;

    // 编码
    unsigned encoding:4;  // 指定底层数据结构

    // 对象最后一次被访问的时间
    unsigned lru:REDIS_LRU_BITS; /* lru time (relative to server.lruclock) */

    // 引用计数
    int refcount;

    // 指向实际值的指针
    void *ptr;

} robj;


// 对象类型
#define REDIS_STRING 0
#define REDIS_LIST 1
#define REDIS_SET 2
#define REDIS_ZSET 3
#define REDIS_HASH 4


// 对象编码
#define REDIS_ENCODING_RAW 0     /* Raw representation */
#define REDIS_ENCODING_INT 1     /* Encoded as integer */
#define REDIS_ENCODING_HT 2      /* Encoded as hash table */
#define REDIS_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define REDIS_ENCODING_LINKEDLIST 4 /* Encoded as regular linked list */
#define REDIS_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define REDIS_ENCODING_INTSET 6  /* Encoded as intset */
#define REDIS_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define REDIS_ENCODING_EMBSTR 8  /* Embedded sds string encoding */


```

<!-- tabs:end -->

### 字符串键实现


<!-- tabs:start -->

#### **说明**

* 编码 ENCODING_INT|RAW
* embstr 一次内存直接减rdsojbect sds
* row  2次
* int 存成str 可以append
* 44字节 再往后类型会变 embstr->row


#### **struct**

```c
t_string.c

```

<!-- tabs:end -->


### 列表键实现
<!-- tabs:start -->

#### **说明**

ziplist和linkedlist
quicklist?

#### **struct**

```c

t_list.c

```

<!-- tabs:end -->



### 散列键
<!-- tabs:start -->

#### **说明**
编码转换 ziplist->hashtable

#### **struct**

```c
t_hash.c

```

<!-- tabs:end -->


### 集合键
<!-- tabs:start -->

#### **说明**
intset hashtable
纯数字不超过512 就是intset

#### **struct**

```c
t_set.c

```

<!-- tabs:end -->



### 有序集合
<!-- tabs:start -->

#### **说明**

* skiplist -> zset (zskiplist,dict)
* ziplist 数量小于128&&所有元素成员长度小于64字节

#### **struct**

```c

t_zset.c 排除zsl的

```

<!-- tabs:end -->



