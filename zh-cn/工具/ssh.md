# 生成密钥


* -t 选择加密算法
* -C name
* -f 生成的密钥文字
```bash
cd ~/.ssh && ssh-keygen -t rsa -N "" -f id_rsa -q
chmod 600 id_rsa.pub id_rsa
```


# 配置
```bash
Host *
    GSSAPIAuthentication yes
    GSSAPIDelegateCredentials no
    ServerAliveInterval 180

Host attp
    HostName
    User root
    IdentityFile ~/.ssh/attp410.pem
```


# 其他
```bash
-v
ssh -L 127.0.0.1:7777:ip:7777  boe
```



## 远程连接mysql

```bash
docker run -itd --name mysql-test -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql
update user set host = '%' where user = 'root'
select host,user,plugin,authentication_string from mysql.user;
FLUSH PRIVILEGES;
