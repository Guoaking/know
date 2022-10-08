# javascript 记录

## 疑问

## 基本
#### 字符串
#### symbol  唯一
```
//永远不会重复的str
let s = Symbol("123")|| Symbol.for("123")  //全局一个
s.description

 ```

##### 方法 set 

1. Array.from("set")
 [..set] 
 array = [...new Set(array)]
2. 遍历
    ```
    set.forEach || for of 
3. 并 交 差
   ```
   let a = new Set([1,2,3])
   let b = new Set([3,4,2])
   new Set([...a,...b])       //并集

   差
   new Set([...a].filter(function(item){
      return !b.has(item);    || return b.has(item) //交
   }))

4. WeakSet()   // 不能迭代,不重复&&引用类型 ,弱引用

#### 方法 map   好多类型键   
   ```JavaScript
   let map = new Map()
   map.set()
   let boolean = map.delete()
   map.has()
   map.keys()
   map.values()
   map.entries()
   for of ,forEach
   //map类型转换
   ...map||[...map]
   [...map.keys()]
   [...map.values()]
   // 操作dom
   ```

2. WeakMap //  键只能是对象



#### 方法 数组基本操作
##### 操作

1. 类型检测与转换
   ```
   Array.isArray()  //判断是否为数组
   let hd = [1,2,3].join("-")    //转为string 
   Array.from(str,function)  ||str.split(",")         //dom元素 有length属性的转为数组  对象有length


   
2. 展开and push
   ```
   [...arr,...hd]  || arr.push(hd)
   //dom 展开
    [...div]    dom边div
    Array.prototype.map.call(div,function(item){})

   
   ```
3. 解构  数组|对象|字符串 批量赋值给...
   ```
   必须有声明 let
   let arr = ["",2]
   //函数 get return []   name 不写 ,占位 获得year   能得到[str,array] 可写默认值
   let [name,year||...year = 2010 ] = get() 
   // [..."str"]  直接拆成数组 相当于split?
   // 函数返回值是数组 直接赋值？
   ```
4. 追加
   ```
   //
   arr[arr.length] = str
   [...arr,arr2]
   let length = array.push("","","")
   let length = push (...arr)
   // 前面追加
   let length= arr.unshift("str","str2")
   // 填充  5个0   [1,3) 下标
   Array(5).fill(0)  || [1,2,3,4].fill("str",1,3)
   arr.concat(arr2)


5. 移除
   ```
   // 返回 后面移除的值
   let val = array.pop()
   //前面弹出 移除的值
   let val = array.shift()
6. 截取
   ```
   //下标1,2 质检的值 不改变  从哪开始截，截到哪块  什么都没有写，截所有，1个参数从开始到最后
   arr.slice(1,2)   
   // 从0开始截 2个 改变原数组 添加str //移除//替换//中间夹 1,0 "str"
   arr.splice(0,2,"str")  替换
   arr.splice(1,0,"str")  追加
7. 清空
   ```
   arr =[]
   arr.length = 0   //彻底
   arr.splice (0,arr.length)
   while(arr.pop()){}
8. 查找
   ```
   arr.indexof(val,startpos)
   arr.lastIndexof(val,-startpos)
   //不适合引用类型
   let boolean = arr.includes(val)
   //遍历数组 |object 有一个就返回值 适合引用类型
   arr.find(function(item){})
   //返回下标
   arr.findIndex(function(item){})
9.  排序
   ```
   // a.val-b.val 从小到大.
   arr.sort(function(a,b){return a-b })
   ```」
11. ##### 方法 数组一堆遍历
    ```JavaScript
    for of?  value 是每一个值  引用类型改变原数组
     
    for in?  key  是每一索引 同of
    // 都有值  可以操作dom节点 
    arr.forEach(function(item,index,arr){return this || window},{})
    item.addEventListener("click",function(){
        this.classList.toggle("类名样式切换")
    })
    let keys = arr.keys()
    keys.next()  index 是否迭代完成
    let values = arr.values()   值
    let values = arr.entries()
    values.next()   keys+values
    // data统一判断  成绩是否全部及格
    let status = arr.every(function(value,index,arr){item.score >=60})
    // data统一判断  成绩是否有一个及格 return false 全部判断 
    let status = arr.some(function(value,index,arr){item.score >=60})
    //值类型 赋值一份,引用 改原来的
    let status = arr.map(function(value,index,arr){item.score >=60})
    Object.assign 浅拷贝
    //pre 上一次返回的val 第一次可init  做统计 最大值 去重 (arr.includes(str)===false) arr.push(str)  arr.find
    let status = arr.reduce(function(pre,value,index,arr){item.score >=60},初始值0)
    
12. 过滤
    ```
    // true 要 false 不要
    arr.filter(function(value,index,arr){item.score >=60})
     

##### 注意小点
- 表格打印数组 console.table()
- const  允许内容改变,地址不能改变
- Array.of(6)  单个元素6
- [].toString  ||   [].join("")   ||  String([])   转字符串
- str.split(",") || Array.from(str,function(item){
}(##)) ||  字符转数组
#### 日期
` const date = new Date() `
```
// 当前时间戳
Date.now()
// 
const date = new Date("")
date.getMonth(+1).get
// 查看脚本执行时间
console.time("for") 
console.timeEnd("for")
// 数组  ...展开语法
```

1. 类型转换  时间戳转-iso
    ```
    new Date(timestamp)
    ```
2. iso->
   ```
   const date = new Date("21312312-23")
   Number(date)
   date.valueOf()
   date.getTime()
   ```
3. 一个工具函数.
    ```
    function dateFormat(date,format="YYYY-MM-DD HH:mm:ss"){

    const config={
        YYYY: date.getFullYear(),
        MM: date.getMonth(),
        DD:date.getDate(),
        HH: date.getHours(),
        mm: date.getMinutes(),
        ss: date.getSeconds()
    };
    for (const key in config) {
        format = format.replace(key,config[key])
    }

    return format
    }
    ```
4. 第三方库 Moment.js
## 其他
## 高级