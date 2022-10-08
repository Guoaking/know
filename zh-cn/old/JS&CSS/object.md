## object 原型 实现继承

### proxy  控制对象和函数 数组
``` 
const hd = {name:"后"}
const proxy = new Proxy(hd,{
    //对象 and属性
    get(obj,property){
        console.log()
    }
});
console.log(proxy.name)
```
### 原型
```
//没有原型
let ßa = Object.create(null,{})
proptype new 对象产生实例的时候使用. 函数属性
__proto__是对象的    
// 设置父级原型
}Object.setPrototypeOf(hd,parent)
OUser.prototype.constructor
// instanceof 原型链检测
// o是否为a的原型链一份子
Object.isPrototypeOf(a)
// in 攀升 检测对象和原型链
//  只会读取自己的属性
hasOwnProperty("name")
```
1. 借用原型链
   1. call() 一个参数
   2. apply()  多个参数
   3. dom借用sssArray()原型方法.
      1. Array.prototype.filter.call(btns,item=>{})
2. 设置原型
   1. Object.ceate()
   2. hd.__proto__
   3. Object.setPrototypeOf()
   4. Object.getPrototypeOf()
3. __proto__sssss
   1. 把原型设置为null

### 继承
1. 改变构造函数的继承不叫原型
2. 继承是原型的继承
   1. user.prototype.proto = userp.prototype
   2. userd.prototype = Object.create(User.protptype)
3. 继承对新增对象的影响.
4. 继承对constructor属性的影响
   1. admin.prototype.constructor = Admin
   2. Object.feineProperty(Admin.prototype,"constructor",{value:Admin,enumerable:false});

### 模块
1. exprot{titile}
2. import{title} form "./1.js" type="module"
3. 延迟解析与严格模式
   1. 预解析.
   2. 严格模式
4. console.log()
   
## Class
### 基本
1. 声明
   1. class User{ constructor(){}} 