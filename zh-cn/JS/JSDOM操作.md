$$JSDOM$$

//延迟
```javascript
<script src="" defer>
//div对象压属性
Object.assign(hd,{
    color:'red',
    change(){
        this.style.color = this.color
        this.innerHTML = 'hd'
    },
    onclick(){
        this.change()
    }
})

function all(el){
    const item = []
    ;[...el.childNodes].map((node)=>{
        if(node.nodeType ==1){
            items.push(node,...all(node))
        }
    })
}
```

### dom对象是普通对象。 
1. 节点是{}
2. 节点的类型
3. 把元素变成数组 使用[...el.childNodes].map((node)=>){}
