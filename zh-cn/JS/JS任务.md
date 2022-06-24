## 任务

### Promise 微任务 优先级高
```javascript
promise.resolve()
new Preomise(resolve,reject)=>{
    reslove("成功通知")
    reject（"失败通知"）
}.then(value=>{
    console.log(成功)
},reason=>{
    console.log(失败)
}.then(value=>{
    console.log(成功)
},reason=>{
    console.log(失败)
})
/*api
带有then 方法
reslove 成功  做缓存？
reject 失败  改变状态
all 批量处理promise 获取数据
allSettled  成功拒绝都接收 
race 谁快取谁
*/ 





微任务  优先级高  promise
宏任务
定时器也要排队。  宏任务 时间短优先级高
```
#### 方法 Preomse的setTimeout
```javascript
function timeout(delay = 1000){
    return new Promise(reslove=>setTimeout(resolve,delay))
}
timeout(2000).then(()=>{
    console.log("111")
    return timeout(2000)
}).then(value=>{
    console.log("222")
})
```

}


### 异步
* js是单线程的。


### ajax

### async与await
```javascript
//async 等于new Promise
//await  类似 then
// 延迟函数
async function sleep(delay=2000){
    let name = await "str";
    return await new Promist(resolve=>{
        setTimeout(()=>{
            resolve()
        },delay)
    })
}

async function show(){
    for(const user of ['1','2']){
        await sleep();
        console.log(user)
    }
}
show();

// await 加载进度条
