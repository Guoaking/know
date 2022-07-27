## nginx


历史背景:
数据量快速增长, 支持多核性能
apache 进程切换的代价太高

}]}
优点
 高并发,高性能 32 64 千万
可拓展性能
高可靠性  持续不间断的稳定运行
热部署   不停止服务的情况下升级nginx
BSD许可证: 开源免费, 定制需求改源代码, 支持商业需求

使用场景
	静态资源 : 本地文件系统提供服务
	反向代理 缓存加速, 负载均衡
	api服务  直接访问数据库  业务处理

组成:
	二进制执行文件: 核心, 官方, 拓展模块
	nginx.conf: 控制nginx的行为
	access.log 访问日志
	error.log 错误日志


进程结构
不是多线程, 保证高可用, 多线程地址空间, 容易崩
master 监控, 热部署
worker 工作 占用一个cpu核数一致,
cache manger loader 缓存 管理载入,
进程通信使用 共享内存


反向代理 openresty


upstream -> 上游服务 ->
proxy_set_header X-read_IP

同一个url 对不同的用户展示的 内容不一样

nginx 作为反向代理


SSL 安全协议 网景公司 Secure Sockets  Layer
TLS Transport Layer   Security
表示层-> 握手, 交换密钥-> 告警-> 记录
验证身份-> 达成安全套件共识-> 传递密钥 -> 加密通讯

ca 机构 颁发证书 ->  拿证书 -> 浏览器验证 公钥证书是否有效

crl 过期服务器, -> ocsp 响应程序 查询

域名验证 dv -> 组织验证 ov -> 扩展验证 ev


多进程, 不是多线程 -> 保证高可用 -> 线程共享地址空间  -> 引发地址空间段错误,会让线程全挂掉

事件驱动模型, 一个work占用一个CPU 配置进程数量, 理解为什么是这样  进程架构, 命令是在向master发送信号

kill -SIGHUP [pid]

<!-- tabs:start -->


#### **master**

 * 监控worker进程
   * CHLD
 * 管理worker进程
 * 接受信号
   * TERM,INT
   * QUIT  优雅
   * HUP
   * USR1
   * USR2  kill使用 热部署使用
   * WINCH

#### **worker**

* 接收信号
   * TERM,INT
   * QUIT
   * USR1
   * WINCH


#### 命令行
* reload: HUP
* reopen: USR1
* stop: TERM
* quit: QUIT


<!-- tabs:end ->