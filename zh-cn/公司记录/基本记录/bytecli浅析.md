### bytecli工具浅析

> 工具主要基于python语言,以及[saltStack](https://docs.saltstack.cn/genindex.html)集群管理框架 , [click](https://click-docs-zh-cn.readthedocs.io/zh/latest/)命令行工具框架 



### 基本框

* database  sqlite3数据库 数据文件在database/根目录下 bytecloud.db文件

  * handler  处理动作(增删改查)
  * modles 模块 实体  (grains)
  * initialize.py 和sqlite3 数据库建立链接工作

* utils 工具py

  * excute_handler.py  检查校验动作  (check_dependence, )
    * Sed_cmd (sed_cmd = "grep -r '%s' %s | awk -F ':' '{print $1}' | while read file; do sed -i 's/%s/%s/g' $file;done" % (old, sed_path, old, new))
    * apply  (state.apply)

* Services  具体模块

  * **smart**

    smart.py

    ```python
    @click.command(help=const.TIPS_36)
    @click.option('-app', '--application', type=click.STRING, required=True, help=const.TIPS_6)
    @click.option('-h', '--hosts', type=click.STRING, required=False, help=const.TIPS_4)
    @click.option('-f', '--force', is_flag=True, help=const.TIPS_24)
    
    // install 比 deploy 少了 start 动作
    def deploy(application, hosts, force):
        1. 前置检查
        check_dependence(application):
        2. 执行部署
        service_deploy(hosts, application)
    ```

    1. 前置检查

    ```python
        // 有没有表数据  可能有 no such tables  grains
        grains = eval(query_first('grains').grains)
        for key in grains.keys():
            apps.extend(grains[key]['bytecloud_app'])
    
        apps = list(set(apps))
    		
        // 检查前置依赖   state.apply
        d_path = '/srv/salt/%s/dependence.yaml' % package
        r_dep, _ = apply([], dep, 'status', get_local_client)
    ```

    2. 执行部署

    ```python
    		// action(for里) 和 app 都会做替换 -> pre-check ->  pre_check
        application = application.replace('-', '_')
        app_obj = BaseApplication(application)
        
        // 循环动作处理
        for action in actions: 
            // 反射拿到函数名 然后执行
    				app_act = getattr(app_obj, action)
            result, _ = app_act(hosts=hosts, func=get_local_client)
            
            //结果
            if result:
                utils.common.fail->click.secho(%s: %s success' % (application, action), fg='green')
            else:
              	utils.common.fail->click.secho('%s: %s failed' % (application, action), fg='red')
    
    ```

    apply 方法 重点

    ```python
    def apply(hosts, application, action, func):
        # 执行 bytecli smart status -app pre-check 为例
        # hosts = null, application = pre-check , action= status , fun = get_local_client
        
    		# 检查是否可用 not result (不可用直接返回false)
        result, hosts = checkAvailable(hosts, application, func)
    
    
    
        
        # sed_cmd 近似 grep -r 'pre-check_ips' /srv/salt/pre-check | awk -F ':' '{print $1}' | 
        # 	while read file; do sed -i 's/pre-check_ips/pre-check_ips/g' $file;done
        # r = os.system(sed_cmd)
        
        sedO2N(application, package, action)
        
        
        # '%s.%s' % (package, action)   ===>   pre-check.status
        # "pillar={'app-name': '%s'}" % application  ===> pillar={'app-name': 'pre-check'}
        # 实际执行的cmd 近似 salt '*' state.apply pre-check.status  "pillar={'app-name': 'pre-check'}" 'queue=True' tgt_type='list'
        apply_ret = func().cmd(hosts, "state.apply", arg=['%s.%s' % (package, action), "pillar={'app-name': '%s'}" % application, 'queue=True'], tgt_type='list')
        
        # 近似sedO2N
        sedN2O(application, package, action)
        
        
    
        # 循环查看app_ret结果里每一台涉及的minion['changes']['retcode'] !=0 为异常状态
        for r in apply_ret[host].values():
          print(r)
          if r['changes'].get('retcode') and r['changes']['retcode'] != 0 and r['changes']['stderr']:
            step_stdout.append('[%s] Step Error: %s' % (host, r['changes']['stderr']))
            result = False
    
    
          
         
    ```

    

    

