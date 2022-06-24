##  css

### 选择器

1. 属性选择器
   1. h1[title^="]
   2. ^=  启始
   3. $=  结束
   4. ~=  有这这个单词,
   5. |=  val 开始 -连接
   6. *=  只要有,不是完整词
2. 伪类选择器
   1. link
   2. hover
   3. active
   4. focus  outline:none
   5. v
   6. target\  点击后
   7. root
   8. empty
   9. not(:nth-child(2))
   10. disabled
   11. enabled
   12. chcked+label
   13. required
   14. optional
   15. valid 验证有效
   16. invalid  验证无效
3. child  type
   1. last-child
   2. first-child
   3. first-of-type
   4. />=  >:
   5. last-of-type
   6. only-child
   7. only-of-type
   8. >:nth-child()  
      1. n:所有|| 2n even 偶数|| 2n-1奇数 odd|| -n+2 前两个 ß
   9.  nth-of-type()
   10. nth-last-child  
4.  对文本伪类操作
    1.  p:: first_line 第一行
    2.  after 
    3.  before
    4.  first-letter 第一个字

###  权重
* #100
* class 类属性值
  * .10   谁后出现用谁ß
* *0000
*  行内样式 1000
*  强制  !important
*  标签 body 1
#### 继承权重
* 继承没有权重NULL<0000 到child
  
### less  sass  预处理器. 

### 弹性盒模型
1. flex 块级元素
2. inline-flex   行级块
3. 元素方向
   1. >  盒子里flex-direction: row-reverse  column 上下,column-reverse
4. 溢出处理
   1. > flex-wrap: warp|| warp-reverse  溢出折行
   2. > flex-flow: row warp-reverse
5. 主轴和交叉轴
   1. > 主轴: justify-content: flex-start|| flex-end|| center|| space_between || space-around || space-evenly
   2. > 交叉轴: align-items: flex-start||flex-end||center|| stretch 拉撑  有宽高无效
   3. > 溢出多行交叉轴: align-content: flex-start|| flex-end || center|| space-between|| space-around  成倍||  space-enenly 
6. 对单个弹性元素
   1. 先找到div
   2. align-self: flex-start|| center|| stretch|| flex-end
   3. flex-grow: 1 平均1
   4. flex-shrink 1  缩小比例  0 不变,(200/)
   5. 主轴基准尺寸:flex-basis:100px    min-ba-w
   6. flex : 1 2 100px
   7. order:1   排序  越大越靠后
7. 对文本节点


### 基本效果

1. 二维移动
   1. transfrom: translateX|Y(10px) || translate（-50%）   {{正负|| 100% }}
2. 中心  参考点 3d
      1. transfrom-origin ： left top 100px 缩放中心点
3. 过渡
   1. transition: 1s
4. 居中
   1. 1.1
5. z轴
   1. transform： perspective(100px  透视)，rotateY(45deg)  旋转 translateZ()z轴 不能%
6. 3D
   1. transform：translate3d(0,0,0)
7. 缩放xyz
   1. scale(1) 1倍
   2. scale3d 外部的盒子
   3. transfrom-origin ： left top  缩放中心点
8. 旋转
   1. rotate3d
   2. 行元素不转，块元素
9. 倾斜
   3. skewX(45deg) 
10. 透视
    1.  单独 perspective（900px） 透视的力度 距离
    2. 整体父级 perspective: 900px  影响子元素 不影响父级。
    3. transform-style: preserve-3d   z轴参与的需要呈现3d效果
11. 背面不可见
    1.  backface-visiblity:hidden
    2.  给父元素需要加3d设置


### 过渡效果
1. transition: all|broder-radius liner 2s 0s,  
2. transition-duration:2s ,2s ,2s  有的有有的没有
3. transition-property: background   @ 定制需要过渡的属性。
4. <p style="color : red">我是你爸爸</p>
5. transition-timing-function  运行轨迹 
   1. ease 默认 开始稍慢 结束更慢
   2. liner   线性
   3. ease-in  开始慢后面快
   4. ease-out 开始快后边慢
   5. ease-in-out  开始慢中间快结束慢
   6. steps(3,start)  step-end step-start}  帧动画
6. transition-delay：1s   鼠标移出取消 延迟过渡

### 帧动画
```
@keyframes name{
   属性重叠，谁在后边谁的优先级高。
   /*不配置start end 帧的话 自动配置*/
   25% {

   }
   50% {

   }

   25%，75%{}    //公共属性
}

body {
   animation-name:name
   animation-duration:2s
   animation-fill-mode: forwards  || backwards 没动的时候使用起始值  //填充模式
   // backwards  :等待的时候应用第一帧       forwards：结束完毕，定到结束帧   both  兼顾1，3.
   animation-delay:4s   延时
   animation-iteration-count:2||1c infinite 无限     //动画执行的次数
   animation-direction:nomarl ||reverse  || alternate || alternate-reverse  平滑处理
   animation-play-state:paused  暂停|| running 运动
   animation: name duration ?delay backwards 
}

```
### 其他
* background-clip :content-box  不包括padding
* box-shadow: 55px 55px 0 currentColor; 表示获取color的颜色
* this.classList.toggle("hide")  切换类
https://mubu.com/colla/2GHhOkgaWk9