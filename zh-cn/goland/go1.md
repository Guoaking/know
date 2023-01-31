Go 语言编译器的中间代码具有静态单赋值（Static Single Assignment、SSA）的特性，我们会在后面介绍该中间代码的该特性，在这里我们只需要知道这是一种中间代码的表示方式。
go build -gcflags -S main.go 变成汇编语言, 使用汇编工具分析
GOSSAFUNC=main go build main.go  获取汇编指令的优化过程
GOOS=linux GOARCH=amd64 go tool compile -S hello.go  转成汇编
                        go tool compile -S -N -l main.go

编译概念
* 抽象语法树(Abstract Syntax Tree, AST): 源代码的一种抽象表示, [抽象语法树](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
  * 一个节点是源代码中的一个元素, 一个子树代表一个语法元素
  * 抹去了字符-空格.分号括号等元素
* [静态单赋值](https://en.wikipedia.org/wiki/Static_single_assignment_form)(Static Single Assignment SSA):对代码进行优化
* 指令集:
  * 复杂指令集:通过增加指令的类型减少需要执行的指令数 每条指令的字节长度不相等, x86, 指令范围从1-15字节不等, 计算机必须额外对指令进行判断, 需要额外的性能
  * 精简指令集:使用更少的指令类型完成目标的计算任务, 指令使用标准长度, arm使用4个字节作为指令的固定长度,省略了判断指令的性能损失 二八原则
* 编译器前端: 词法分析, 语法分析, 类型检查,|| 中间代码生成
* 编译器后端: 目标代码生成优化, 翻译成二进制机器码
* go
  * 词法,语法分析: 解析源文件, 字符串转换成token序列,按编程语言定义好的语法,将每一个go的源代码文件归纳成一个[SourceFile](https://golang.org/ref/spec#Source_file_organization)结构, 词法分析返回一个不包含空格, 换行等字符的token序列, 语法分析把token序列转换成有意义的结构体, 即语法树
* 静态类型检查: 对源代码的分析来确定运行程序类的安全的过程, 编译期发现错误
* 动态类型检查: 运行时确定程序类型安全的过程, 运行时进行动态派发, 向下转型, 反射, 等, 提供更多的操作空间


## slice

* 编译期 cmd/compile/internal/types.NewSlice
* 运行时 reflect.SliceHeader结构体
* ssa.exprCheckPtr 对slice cap len index的访问
* ssa.append 对slice进行append
* runtime.growslice() append 扩容
* runtime.slice.slicecopy()

slice append 加不进去,返回一个new slice
直接设置能设置进去?

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

## map

* 改来改去还是他自己
* 哈希函数: 映射要均匀
* 冲突解决:
  * 开放寻址法: 核心思想: 依次探测和比较数组中的元素以判断目标键值对是否存在于哈希表.  底层数据结构是数组, idx := hash(key) % array.len
    * 如果冲突就写入到下一个索引不为空的位置
    * 装载因子: 是数组中元素的数量和数组大小的比值 越高, 性能越差
  * 拉链法: 数组加链表,红黑树,
    * 装载因子: 元素数量/桶数量 不超过1

```
// A header for a Go map.
type hmap struct {
	// Note: the format of the hmap is also encoded in cmd/compile/internal/reflectdata/reflect.go.
	// Make sure this stays in sync with the compiler's definition.
	count     int // # live cells == size of map.  Must be first (used by len() builtin)
	flags     uint8
	B         uint8  // log_2 of # of buckets (can hold up to loadFactor * 2^B items)
	noverflow uint16 // approximate number of overflow buckets; see incrnoverflow for details
	hash0     uint32 // hash seed

	buckets    unsafe.Pointer // array of 2^B Buckets. may be nil if count==0.
	oldbuckets unsafe.Pointer // previous bucket array of half the size, non-nil only when growing
	nevacuate  uintptr        // progress counter for evacuation (buckets less than this have been evacuated)

	extra *mapextra // optional fields
}
```

### 流程

* 初始化hash cmd.compile.internal.walk.complit.maplit
  * 少于25 转成字面量
* 类型检查期间转换成 runtime.makemap
* 扩容因子 13/2, 将桶数量翻倍 内存泄露使用sameSizeGrow机制, 整理hash内存, 每个桶只能操作8个, 超过就放到溢出桶
* 编译期间 cmd.compile.internal.walk.walkExpr -> walkExpr1 -> 转化  -> runtime.func
* 扩容时操作, 会触发分流
* delete在编译期间, 经过类型检查和中间代码生成,转换成runtime.func

### 词法分析
* cmd.compile.internal.syntax.scnner.next()
* syntax.syntax.Parse, fileOrNil, next


### interface

* runtime.runtime2.iface defalut
* runitme.runitme2.eface interface{}


###  1223
* gc.Main ->compileFunctions() -> Compile() -> buildssa() 开放编码优化信息

