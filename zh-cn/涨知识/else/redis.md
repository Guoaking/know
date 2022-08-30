## 资料

* [公众号redis](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzI0NTE4NDg0NA==&action=getalbum&album_id=1725600385232322562&scene=173&from_msgid=2247483875&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
* [公众号redis2](https://mp.weixin.qq.com/s?__biz=MzI0NTE4NDg0NA==&mid=2247483875&idx=1&sn=e913d929de18781246616fb704aad892&chksm=e95321c0de24a8d6ce7bdc4fb782a41a5a33cd9794db7ead88de79458c330d0b19fe7fc6bcd1&scene=178&cur_album_id=1725600385232322562#rd)
* [bookredis设计与实现](http://redisbook.com/)
* [如何阅读redis源码](https://blog.huangz.me/diary/2014/how-to-read-redis-source-code.html)
* [redis官网](https://redis.io/docs/about/)



##

redis前增加Twemproxy: 可以做多语言支持,多机房流量调度, 减小集群扩缩容的感知,热key检测等
Twemproxy是一个支持redis和memcached的轻量代理,主要特性有维护cache server的连接池, pipline指令,zero copy, key sharding等
数据分片方式根据配置文件中的hash(哈希函数, md5,crc16)和distribution决定
distribution默认支持有三种:
* katama: 一致性hash算法, 构造hash_ring, 根据hash值顺时针选择server
* modula: key hash值取模, 选择对应的srver
* random: 随机选择一个server


无限保存- > 磁盘满了

aof 不会超过maxmem一倍, 所有的数据在内存