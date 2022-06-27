# 123

> An awesome project.

## 记录知识点
### css
### js
### vue
### 这些就够了 不要贪多

我是表头| 我也是啊| 我的也是
--|--|--
我是第一行| 我是第二个| 我是第三个
| 我是第四个|<img width=200; > <font color=red >aa</font>|3


```javascript
function a(){

}()
```

> 我擦
$$  居中  $$
---
**弟弟**

~~我死了~~
<font color=DarkTurquoise >aa</font>

$\color{red}{red}$

$\color{#4285f4}{G}\color{#ea4335}{o}\color{#fbbc05}{o}\color{#4285f4}{g}\color{#34a853}{l}\color{#ea4335}{e}$

<table><tr><td bgcolor=#7FFFD4>这里的背景色是：Aquamarine，  十六进制颜色值：#7FFFD4， rgb(127, 255, 212)</td></tr></table>

撤销：<kbd>Ctrl/Command</kbd> + <kbd>Z</kbd>

`toc`



~~删除文本~~



[百度](https://www.baidu.com)

![Alt](url)


- [ ] 计划任务

- [x] 完成任务

| 第一列       | 第二列         | 第三列        |
|:-----------:| -------------:|:-------------|
| 第一列文本居中 | 第二列文本居右  | 第三列文本居左 |

Markdown将文本转换为 HTML。

*[HTML] :   超文本标记语言

一个具有注脚的文本。[^1]

注释[^2]





```pdf
static/pdf/nginx.pdf
```


https://gbodigital.github.io/docsify-gifcontrol/#/

![](../static/gif/test.gif "-gifcontrol-disabled;")




[^1]: 123123
[^2]: 注脚的解释





<!-- tabs:start -->

#### **Java**

```java
    /**
     * 快排
     * 通过一趟排序将要排序的数据分割成独立的两部分，其中一部分的所有数据都比另外一部分的所有数据都要小，
     * 然后再按此方法对这两部分数据分别进行快速排序，整个排序过程可以递归进行，以此达到整个数据变成有序序列。
     *  二叉树 前序遍历 递归
     * @param array
     */
    private void quickSort(int[] array){
        int len;
        if(array == null || (len = array.length) == 0 || len == 1) {
            return ;
        }
        sort(array, 0, len - 1);
    }


    /**
     * 快排核心算法，递归实现
     * @param array
     * @param left
     * @param right
     */
    public static void sort(int[] array, int left, int right) {
        //1. 终止
        if(left>right) return;

        //处理
        // 找基数
        int base = array[left];
        int i = left, j = right;

        //遍历
        while (i != j) {
            //从右边到坐  找比base小的值
            while(i<j && array[j]>=base){
                j--;
            }
            // 找的是比base大的值
            while(i<j&& array[i]<=base){
                i++;
            }

            //做大小交换
            if(i<j){
                int tmp = array[j];
                array[j] = array[i];
                array[i] = tmp;
            }
        }

        //base交换
        array[left] = array[i];
        array[i] = base;


        //递归
        sort(array,left,i-1);
        sort(array,i+1,right);
    }

```

#### **Go**

```go
func quickSort2(ints []int)  {

	if(len(ints)<2){
		return
	}

	base := ints[0]
	left, right := 0,len(ints)-1

	for left != right  {
		for ; left<right && ints[right]>=base ; right-- {

		}
		ints[left] = ints[right]

		for ; left< right && ints[left]<=base ; left ++ {

		}
		ints[right]	 = ints[left]

	}

	ints[left]  = base


	quickSort2(ints[:left])
	quickSort2(ints[left+1:])
}
```

#### **:smile:**

Ciao!

#### **😀**

123

#### **Badge <span class="tab-badge">666!</span>**

777

<!-- tabs:end -->