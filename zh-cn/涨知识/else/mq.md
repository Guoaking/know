##



mx.kapocstd.statusfeishu.cn

## 整体架构
adminapi: 接口 rest接口
exporter: 主动拉
namesrv 无状态, 无主从, 无通信,
broker :存储消息, 主从复制, 上报给nameserver
defer: 自研 延时消息, 任意精度的延迟消息, 拓扑信息  存储, 投递,
proxy: 自研 代理, 收发消息, 和namesrv 交互
mgr:   控制面

不一样
消息写 最后文件去append, 只有这一个可写, 保证磁盘顺序写


高可用
