## 函数

###  全局
1. 箭头
2. 作用域提升
3. 立即执行
4. arguments
5. 回调
6. this
   ```
   当前对象的引用
   window 全局对象
   常量改变 this  
   箭头 指向 上下文  function()指向window
   handleEvent:function(event) event.target
7. call 与 apply
    ```
    call val = ,,,
    function User(name){this.name = name }
    let hdcms = {url:"hdcms.com"}
    User.call(hdcms,开源系统)  //立即执行
    this = hdcms.name :"开源系统"
    -----------------------
    传递参数不同
    apply  val = []
    继承
    
8. bind
    ```
    不是立刻执行
    重新赋值一份
    调用时||绑定时
    ```
let fun = function(){}
{window.js2 = (f1,f2}
function avg(year = 1){
    year = year || 1
} 

### 闭包
1. 环境作用域
2. 函数生命周期
3. 伪作用域
4. 闭包的问题
5. 闭包内存泄露
### 对象
1. 严格中的解构 let
2. 解构简写 
3. 默认值配置项
   ```
   function(options={}){
       let {width=200,height=100} = options
   }
4. 解构做函数参数
5. 属性监测  hasOwnproperty("length"),  "str" in arr
6. 对象合并 Object.assign(obj1,obj2){}，....
7. 对象方法
    ```
    Object.keys()
    Object.values()
    for in || for of
    Object.assign()
    JSON.stringify(arr,null,2)
    Object.getOwnProPertyDescriptor(user,"name")
    Onject.defineProperty(user,"name",{
        value:"",
        wirtable:false; 
    })

### 

获得active-》 获得meta__text -> 移除
----