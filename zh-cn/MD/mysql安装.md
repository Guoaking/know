## mysql





### 安装

生成data文件和密码

```sql
mysqld --defaults-file=D:\123\my.ini --initialize --console
```



安装服务

```sql
mysqld install mysql8 --defaults-file=D:\my.ini
```

移除服务

```sql
mysqld remove mysql8
```

修改默认密码

 ```sql
alter user 'root'@'localhost' identified with mysql_native_password by '123456'
 ```



启动和停止服务

```sh
net start mysql
net stop mysql
```

忘记密码

```sql
net stop mysql
mysqld --console --skip-grant-tables --shared-memory
use mysql
update user set authentication_String='' where user='root'
flush privileges
alter user 'root'@'localhost' identified by '123456'
```



host改为%

```sql
update user set host = '%' where uesr = 'root';
flush privileges;
```



### 添加外键

> 有级联更新的效果



```sql
create table stu(
	class_id int defalut null;
    constraint stu2_class
    foreign key(class_id)
    references class(id)
    on delete cascade [no action | set null]
)
alter table stu add constraint stu_class foreign key (class_id) on delete cascade;
alter table stu drop foreign key stu_class;

```



### 存储过程循环

> 遍历  随机数

### 设置 sql_mode

```sql

set  @@sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

select @@sql_mode;
```







### 日期处理



日期的处理

```sql
	set date_sql = " and YEARWEEK(DATE_FORMAT(jp2.createtime,'%Y-%m-%d')) = YEARWEEK(NOW())-1 ";
elseif i_date_mode = 'month' then
	set date_sql = " and PERIOD_DIFF(DATE_FORMAT(NOW(),'%Y%m'),DATE_FORMAT(jp2.createtime,'%Y%m')) =1 ";
elseif i_date_mode = 'quarter' then
	set date_sql = " and QUARTER(jp2.createtime) = QUARTER(DATE_SUB(NOW(),INTERVAL 1 QUARTER)) ";
elseif i_date_mode = 'year' then
	set date_sql = " and YEAR(jp2.createtime)=YEAR(DATE_SUB(NOW(),INTERVAL 1 year)) ";
```