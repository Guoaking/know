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

建立3握手, nginx怎么收到读事件->

内核获取等待处理的事件-> epoll

epoll
高并发链接中, 每次处理的活跃链接占比小

eventpoll data
遍历链表里只有活跃的链接

读取http消息

用户态代码完成链接切换


底层 阻塞非阻塞 切换进程
调用方式 : 同步异步 ->

模块
- core
  - events
    - epoll
    - event_core
  - http
    - upstream
    - http_core_module
    - 响应过滤
    - 请求处理
  - mail
    - core_module
  - stream
    - core_module
  - core
  - errlog
  - thread_pool
  - openssl
- conf

keepalive 多个http请求通过复用tcp链接,

连接池
work_connection 占用内存 (232byte+96byte)*2

内存池

共享内存 -> 切分slot
小对象,避免碎片, 避免重复初始化


listen [port]
listen [ip]:80
listen [] default


read req Headers ->决定使用哪个server块

那个location 生效
是否要限速
验证auth
生成响应 -> upstream servcies
返回过滤 gzip images
记录acess

post_read
server_revrite
 重定向, 简单返回
 重写url  break  premanent: 301,永久 redirect:302 临时  rewitelog
 if 逻辑判断 表达式~大小写敏感, ~*大小写不敏感
    文件 -f
    目录 -d
    软连 -e
    可执行 -x
find_config
  最长匹配 < 正则匹配 ^~禁止正则
Rewrite


Post_rewite

preaccess
  限制客户端并发 limit_conn 资源服务器
  限制一个连接上每秒处理的请求数, leakybucket算法(蓄水池, 水库) limit_req在conn之前

access   satisfy
  内网 access
  auth basic
  auth request
post_access
preconent
  try_files 反向代理实用
  mirror 流量拷贝, 多个环境处理用户流量
content
  static
  root  映射为文件 返回静态资源
  alias alias不会拼接location
  index autoindex
  concat 访问多个小文件合并到一次http返回
响应过滤
  header 过滤
  body 过滤
  copy_filter 复制包体内容
  postpone_filter 处理子请求
  header_filter 构造响应头
  write_filter 发送响应
  sub_filter
  addition 响应前后修改内容
  referer invalid_referers(1不让), referer_hash_bucket_size, referer_hash_max_size
  secure_link (url 加密,hash前的url,)

log
  log_format

变量
  http请求相关
    args_value,query_string,is_args(?:""),content_length,content_type
    uri,request_uri,scheme,request_method,remote_user,request_length
    request_body_file,request_body(反向代理的时候), request
    host(请求行, host头, 匹配上的server_name)
    binary_remote_addr(二进制), remote_addr,conneetion_request,proxy_protocol_addr
    request_time,



Rewrite 模块

301: http1.0 永久重定向
302: 临时重定向, 禁止被缓存

http1.1
303: 临时 允许改变方法, 禁止被缓存
307: 临时, 不允许改变方法, 禁止被缓存
308: 永久, 不允许改变方法


## 反向代理和负载均衡

负载均衡:
  akf拓展立方体
    x:水平扩展, 轻松容易
    y:功能拆分, 更改代码 , 重构, 解决数据量的上升
    z:用户功能, cdn, 固定用户, 到固定集群

反向代理:
  4: udp-> udp, tcp-> tcp
  7: 应用层, 有业务信息, memecached, cgi, uwsig, grpc, http, websocket

缓存:
  时间缓存:缓存在nginx机器上, 直接返回内容
  空间缓存:预取内容

### http 7层反向代理
反向代理
  proxy_pass 会替换url
  接收客户端包,

### upsteam 4层 与上游交付
  加权round-robin, weight,无法保证一类请求, 某一台服务处理, x: 水平扩展
  对上游使用keepalive, 提升吞吐量, 降低时延
  z: hash算法, 某一类, 某一台服务处理,
    一致性hash 环, 避免扩容或者宕机后,路由发生大规模变化, 缓存大规模失效

  接收上游响应
    proxy_buffer_size cookie太长, proxy_read_timeout proxy_limit_rate, proxy_store
  转发响应
    proxy_ignore_headers X-Accel-Limit_Rate  proxy_hide_header proxy_pass_Header
  上游返回失败
    proxy_next_upstream
双向认证
  proxy_ssl_certificate, proxy_ssl_verify

缓存
  nginx缓存, 浏览器缓存

