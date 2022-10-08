
## 组成
* 北桥(MCH): 与cpu, 内存和AGP视频接口, 存储控制器,有很高的传输速率,
* 南桥(ICH): PCI总线,IDE硬盘接口, USB端口,外设

1. I/O端口和寻址
* io控制使用中断控制, 中断向量表
  DMA(直接存储器访问, Direct Memory Access) 外部设备与系统内存之间进行批量数据传送,

物理内存
1. 640kb~1MB 共384kb (IO设备)
2. 4Gb处的最后64kb   (用于BOIS程序)
3. 其他的都是系统内存
4. BIOS主要用于开机执行系统各部分的自检,建立os需要使用的各种配置表, 中断向量表, 硬盘参数表,处理器和系统其余部分初始化到一个已知状态,提供硬件接口服务.

内存管理寄存器
1. GDTR: 全局描述符表寄存器
2. LDTR: 局部描述符表寄存器,
3. IDTR: 中断描述符表寄存器, 中断表的线性基地址,长度值
4. TR: 任务寄存器
5. PDBR: 控制寄存器, 页目录基地址寄存器, 含有页目录表物理内存基地址
6. cs: 代码段
7. ds: 数据段
8. ss, 堆栈段
9. GDT 全局描述符表 由处理器的内存管理硬件来引用, 映射变换到线性地址, 线性地址空间中的一个数据结构
10. LDT 局部描述表
11. IDT 中断描述符表,异常或中断向量分别与他们的处理过程联系起来
    1.  中断门描述符
    2.  陷阱门描述符
    3.  任务门描述符

地址变换: 减少确定地址变换需要的信息
分段机制: 隔绝代码, 数据和堆栈区,使用大小可变的块处理复杂系统的逻辑分区, 多段模型
把虚拟地址空间中的虚拟内存组织成一些长度可变称为段的内存块单元. 逻辑地址转换成线性地址

段选择符(段选择子): 段的16位标识符,指向段描述符表中的定义段的段描述符
    请求特权级RPL: 段保护信息
    表指示标志TI:
    索引
段描述符: 向处理器提供有关一个段的位置和大小信息以及访问控制的状态信息
    段基地址: 指定段在线性地址空间中的开始地址,基地址是线性地址, 对应与段中偏移0处
    段限长: 是虚拟地址空间中段内最大可用偏移位置, 定义了段的长度
    段属性: 指定段的特性. 是否可读,可写,可执行程序, 特权级等
分页机制: 虚拟内存,传统需求页 , 完成虚拟(逻辑)地址到物理地址转换的过程, 线性地址空间划分成页面
全局地址空间: 所有任务都具有相同虚拟地址空间的部分
局部地址空间: 每个任务唯一的虚拟地址空间


进程调度模块:进程对CPU资源的使用
内存管理: 所有进程能安全共享机器主内存区
文件系统: 支持对外部设备的驱动和存储
进程间通信: 支持多种进程间的信息交换方式
网络接口: 对多种网络通信标准的访问并支持许多网络硬件


程序(进程)的虚拟和逻辑地址: 由程序产生的有段选择符合段内偏移地址组成的地址,需要通过分段地址变换机制处理后对应到物理内存地址上,由GDT和LDT的地址空间组成
逻辑地址:
CPU的线性地址: 虚拟地址到物理地址变换之间的中间层,处理器可循值得内存空间中的地址.如果没有启用分页机制,线性地址直接就是物理地址
实例物理内存地址: 在CPU外部地址总线上的寻址物理内存的地址信号,是地址变换的最终结果地址
虚拟内存:
内存分段机制: CPU进行地址变换的主要目的是为了解决虚拟内存空间到物理内存空间的映射文昌塔
内存分页管理:


system head.s 为啥一开始在64kb处后来放在0kb处
boot启动时setup.s还需要boot的中断调用功能来获取有关机器配置的一些参数(显示卡模式, 硬盘参数表等)
在1KB处放的中断向量表,在使用完boot的中断向量表后才能擦除覆盖

内存管理单元(MMU,): 管理内存并把虚拟地址转换为物理地址的硬件


```c
struct page {
	unsigned long flags;		// 存放页的状态,是不是脏的,是不是被锁定在内存中等,每一位表示一种状态, 同事表示 32种状态 page-flags.h
	atomic_t _count;		// 存放页的引用计数 -1说明没引用,可以使用
	atomic_t _mapcount;	/* Count of ptes mapped in mms, */
	unsigned long private;		/* Mapping-private opaque data: */
	struct address_space *mapping;	/* If low bit clear, points to */
    pgoff_t index;		/* Our offset within mapping. */
	struct list_head lru;		/* Pageout list, eg. active_list */
	void *virtual;			//页的虚拟地址
};

struct zone{
    unsigned log watermark[NR_WMARK];  // 该区的最小值, 最低和最高水位值.内核使用水位为每个内存区设置合适的内存消耗基准
    spinlock_t lock;     // 自旋锁,防止zone被并发访问.保护结构, 不保护页
    const char  *name;      // NULL结束的字符串 表示zone的名字 DMA, Normal, HighMem
}

// 分配物理页,返回第一个页
gfp.h/static inline struct page *alloc_pages(gfp_t gfp_mask, unsigned int order)
// 对于4GB的物理内存 每个一个物理页分配这样一个结构体占用多少内存?
4GB*1024*1024/8KB(系统物理页8KB大小)*40B/1024/1024~20MB
```

区: 逻辑分组, 硬件限制,内核不能对所有页一视同仁
* ZONE_DMA 可以直接执行DMA操作
* ZONE_DMA32 只能被32位设备执行DMA操作
* ZONE_NORMAL 能正常映射的页
* ZONE_HIGHEM 高端内存,不能永久映射到内核地址空间
* include/linux/mmzone.h 还有2种不大重要的

gfp_mask 分配器标志
* 行为修饰符 内核应当如何分配所需的内存
* 区修饰符: 到底从这些区中的哪一区中进行分配, 优先是normal
* 类型:组合了行为和区,简化修饰符使用

slab分配器:通用数据结构缓存层 空闲链表
* 频繁使用的数据结构也会频繁分配和释放,应当缓存
* 高速缓存组,slab由一个或多个物流号连续的页最成

```c
struct slab {
	struct list_head list;       // 链表
	unsigned long colouroff;     //slab着色的偏移量
	void *s_mem;		// 在slab中的第一个对象
	unsigned int inuse;	// slab中已分配的对象数
	kmem_bufctl_t free; // 第一个空闲对象 如果有的话
	unsigned short nodeid;
};
```

inode: 磁盘索引节点在内存中的体现
进程地址空间: 用户空间中进程的内存


内存描述符: 表示进程的地址空间,每一个进程都有唯一的结构体,唯一的进程地址空间,每个进程使用的内存
虚拟地址的返回, 有时会超过实际物理内存大小


```c
struct mm_struct {
    struct vm_area_struct * mmap;        /* [内存区域]链表 包含完全相同的vm_area_struct */
    struct rb_root mm_rb;               /* [内存区域]红黑树 O(log n) 搜索指定元素*/
    struct vm_area_struct * mmap_cache;    /* 最近一次访问的[内存区域] */
    unsigned long (*get_unmapped_area) (struct file *filp,
                unsigned long addr, unsigned long len,
                unsigned long pgoff, unsigned long flags);  /* 获取指定区间内一个还未映射的地址，出错时返回错误码 */
    void (*unmap_area) (struct mm_struct *mm, unsigned long addr);  /* 取消地址 addr 的映射 */
    unsigned long mmap_base;        /* 地址空间中可以用来映射的首地址 */
    unsigned long task_size;        /* 进程的虚拟地址空间大小 */
    unsigned long cached_hole_size;     /* 如果不空的话，就是 free_area_cache 后最大的空洞 */
    unsigned long free_area_cache;        /* 地址空间的第一个空洞 */
    pgd_t * pgd;                        /* 页全局目录 */
    atomic_t mm_users;            /* 使用地址空间的用户数, 使用该地址的进程数目 */
    atomic_t mm_count;            /* 实际使用地址空间的计数，0 就被撤销 (users count as 1) */
    int map_count;                /* [内存区域]个数 */
    struct rw_semaphore mmap_sem;   /* 内存区域信号量 */
    spinlock_t page_table_lock;        /* 页表锁 */

    struct list_head mmlist;        /* 所有地址空间形成的链表 双向链表*/

    /* Special counters, in some configurations protected by the
     * page_table_lock, in other configurations by being atomic.
     */
    mm_counter_t _file_rss;
    mm_counter_t _anon_rss;

    unsigned long hiwater_rss;    /* High-watermark of RSS usage */
    unsigned long hiwater_vm;    /* High-water virtual memory usage */

    unsigned long total_vm, locked_vm, shared_vm, exec_vm;   // 全部页数目, 上锁页数目, 共享页数目, 使用中的页数目
    unsigned long stack_vm, reserved_vm, def_flags, nr_ptes;
    unsigned long start_code, end_code, start_data, end_data; /* 代码段，数据段的开始和结束地址 */
    unsigned long start_brk, brk, start_stack; /* 堆的首地址，尾地址，进程栈首地址 */
    unsigned long arg_start, arg_end, env_start, env_end; /* 命令行参数，环境变量首地址，尾地址 */

    unsigned long saved_auxv[AT_VECTOR_SIZE];  // 保存的auxv

    struct linux_binfmt *binfmt;

    cpumask_t cpu_vm_mask;        // 懒惰(lazy)TLB交换掩码

    mm_context_t context;       // 体系结构特殊数据

    unsigned int faultstamp;
    unsigned int token_priority;
    unsigned int last_interval;

    unsigned long flags; // 状态标志

    struct core_state *core_state; // 核心转储的支持
#ifdef CONFIG_AIO
    spinlock_t        ioctx_lock;     // AIO IO链表锁
    struct hlist_head    ioctx_list;   // AIO IO链表
#endif
#ifdef CONFIG_MM_OWNER
    struct task_struct *owner;
#endif

#ifdef CONFIG_PROC_FS
    /* store ref to file /proc/<pid>/exe symlink points to */
    struct file *exe_file;
    unsigned long num_exe_file_vmas;
#endif
#ifdef CONFIG_MMU_NOTIFIER
    struct mmu_notifier_mm *mmu_notifier_mm;
#endif
};

```

进程描述符:  任务(进程)数据结构

```c
struct task_struct {
	volatile long state;	// -1 任务运行状态,不可运行, 0 可以运行(就绪) >0 已停止
	void *stack;
	atomic_t usage;
	unsigned int flags;	/* per process flags, defined below */
	unsigned int ptrace;

	int lock_depth;		/* BKL lock depth */

#ifdef CONFIG_SMP
#ifdef __ARCH_WANT_UNLOCKED_CTXSW
	int oncpu;
#endif
#endif

	int prio, static_prio, normal_prio;
	unsigned int rt_priority;
	const struct sched_class *sched_class;
	struct sched_entity se;
	struct sched_rt_entity rt;

#ifdef CONFIG_PREEMPT_NOTIFIERS
	/* list of struct preempt_notifier: */
	struct hlist_head preempt_notifiers;
#endif

	/*
	 * fpu_counter contains the number of consecutive context switches
	 * that the FPU is used. If this is over a threshold, the lazy fpu
	 * saving becomes unlazy to save the trap. This is an unsigned char
	 * so that after 256 times the counter wraps and the behavior turns
	 * lazy again; this to deal with bursty apps that only use FPU for
	 * a short time
	 */
	unsigned char fpu_counter;
#ifdef CONFIG_BLK_DEV_IO_TRACE
	unsigned int btrace_seq;
#endif

	unsigned int policy;
	cpumask_t cpus_allowed;

#ifdef CONFIG_TREE_PREEMPT_RCU
	int rcu_read_lock_nesting;
	char rcu_read_unlock_special;
	struct rcu_node *rcu_blocked_node;
	struct list_head rcu_node_entry;
#endif /* #ifdef CONFIG_TREE_PREEMPT_RCU */

#if defined(CONFIG_SCHEDSTATS) || defined(CONFIG_TASK_DELAY_ACCT)
	struct sched_info sched_info;
#endif

	struct list_head tasks;
	struct plist_node pushable_tasks;

	struct mm_struct *mm, *active_mm;   // mm->当前进程的内存描述符,null 说明是内核线程, active-> 前一个进程的内存描述符
#if defined(SPLIT_RSS_COUNTING)
	struct task_rss_stat	rss_stat;
#endif
/* task state */
	int exit_state;
	int exit_code, exit_signal;
	int pdeath_signal;  /*  The signal sent when the parent dies  */
	/* ??? */
	unsigned int personality;
	unsigned did_exec:1;
	unsigned in_execve:1;	/* Tell the LSMs that the process is doing an
				 * execve */
	unsigned in_iowait:1;


	/* Revert to default priority/policy when forking */
	unsigned sched_reset_on_fork:1;

	pid_t pid;     // 进程标志号(进程号)
	pid_t tgid;

#ifdef CONFIG_CC_STACKPROTECTOR
	/* Canary value for the -fstack-protector gcc feature */
	unsigned long stack_canary;
#endif

	/*
	 * pointers to (original) parent process, youngest child, younger sibling,
	 * older sibling, respectively.  (p->father can be replaced with
	 * p->real_parent->pid)
	 */
	// 进程的父子关系引用
	struct task_struct *real_parent; /* real parent process */
	struct task_struct *parent; /* recipient of SIGCHLD, wait4() reports */
	/*
	 * children/sibling forms the list of my natural children
	 */
	struct list_head children;	/* list of my children */
	struct list_head sibling;	/* linkage in my parent's children list */
	struct task_struct *group_leader;	/* threadgroup leader */

	/*
	 * ptraced is the list of tasks this task is using ptrace on.
	 * This includes both natural children and PTRACE_ATTACH targets.
	 * p->ptrace_entry is p's link on the p->parent->ptraced list.
	 */
	struct list_head ptraced;
	struct list_head ptrace_entry;

	/*
	 * This is the tracer handle for the ptrace BTS extension.
	 * This field actually belongs to the ptracer task.
	 */
	struct bts_context *bts;

	/* PID/PID hash table linkage. */
	struct pid_link pids[PIDTYPE_MAX];
	struct list_head thread_group;

	struct completion *vfork_done;		/* for vfork() */
	int __user *set_child_tid;		/* CLONE_CHILD_SETTID */
	int __user *clear_child_tid;		/* CLONE_CHILD_CLEARTID */

	cputime_t utime, stime, utimescaled, stimescaled;
	cputime_t gtime;
#ifndef CONFIG_VIRT_CPU_ACCOUNTING
	cputime_t prev_utime, prev_stime;
#endif
	unsigned long nvcsw, nivcsw; /* context switch counts */
	struct timespec start_time; 		/* monotonic time */
	struct timespec real_start_time;	/* boot based time */
/* mm fault and swap info: this can arguably be seen as either mm-specific or thread-specific */
	unsigned long min_flt, maj_flt;

	struct task_cputime cputime_expires;
	struct list_head cpu_timers[3];

/* process credentials */
	const struct cred *real_cred;	/* objective and real subjective task
					 * credentials (COW) */
	const struct cred *cred;	/* effective (overridable) subjective task
					 * credentials (COW) */
	struct mutex cred_guard_mutex;	/* guard against foreign influences on
					 * credential calculations
					 * (notably. ptrace) */
	struct cred *replacement_session_keyring; /* for KEYCTL_SESSION_TO_PARENT */

	char comm[TASK_COMM_LEN]; /* executable name excluding path
				     - access with [gs]et_task_comm (which lock
				       it with task_lock())
				     - initialized normally by setup_new_exec */
/* file system info */
	int link_count, total_link_count;
#ifdef CONFIG_SYSVIPC
/* ipc stuff */
	struct sysv_sem sysvsem;
#endif
#ifdef CONFIG_DETECT_HUNG_TASK
/* hung task detection */
	unsigned long last_switch_count;
#endif
/* CPU-specific state of this task */
	struct thread_struct thread;
/* filesystem information */
	struct fs_struct *fs;             // 进程描述符的fs指向 包含文件系统和进程相关信息
/* open file information */
	struct files_struct *files;    // fd 管理该进程打开的所有文件的管理结构。
/* namespaces */
	struct nsproxy *nsproxy;             // namespaces
/* signal handlers */
	struct signal_struct *signal;
	struct sighand_struct *sighand;

	sigset_t blocked, real_blocked;
	sigset_t saved_sigmask;	/* restored if set_restore_sigmask() was used */
	struct sigpending pending;

	unsigned long sas_ss_sp;
	size_t sas_ss_size;
	int (*notifier)(void *priv);
	void *notifier_data;
	sigset_t *notifier_mask;
	struct audit_context *audit_context;
#ifdef CONFIG_AUDITSYSCALL
	uid_t loginuid;
	unsigned int sessionid;
#endif
	seccomp_t seccomp;

/* Thread group tracking */
   	u32 parent_exec_id;
   	u32 self_exec_id;
/* Protection of (de-)allocation: mm, files, fs, tty, keyrings, mems_allowed,
 * mempolicy */
	spinlock_t alloc_lock;

#ifdef CONFIG_GENERIC_HARDIRQS
	/* IRQ handler threads */
	struct irqaction *irqaction;
#endif

	/* Protection of the PI data structures: */
	raw_spinlock_t pi_lock;

#ifdef CONFIG_RT_MUTEXES
	/* PI waiters blocked on a rt_mutex held by this task */
	struct plist_head pi_waiters;
	/* Deadlock detection and priority inheritance handling */
	struct rt_mutex_waiter *pi_blocked_on;
#endif

#ifdef CONFIG_DEBUG_MUTEXES
	/* mutex deadlock detection */
	struct mutex_waiter *blocked_on;
#endif
#ifdef CONFIG_TRACE_IRQFLAGS
	unsigned int irq_events;
	unsigned long hardirq_enable_ip;
	unsigned long hardirq_disable_ip;
	unsigned int hardirq_enable_event;
	unsigned int hardirq_disable_event;
	int hardirqs_enabled;
	int hardirq_context;
	unsigned long softirq_disable_ip;
	unsigned long softirq_enable_ip;
	unsigned int softirq_disable_event;
	unsigned int softirq_enable_event;
	int softirqs_enabled;
	int softirq_context;
#endif
#ifdef CONFIG_LOCKDEP
# define MAX_LOCK_DEPTH 48UL
	u64 curr_chain_key;
	int lockdep_depth;
	unsigned int lockdep_recursion;
	struct held_lock held_locks[MAX_LOCK_DEPTH];
	gfp_t lockdep_reclaim_gfp;
#endif

/* journalling filesystem info */
	void *journal_info;

/* stacked block device info */
	struct bio_list *bio_list;

/* VM state */
	struct reclaim_state *reclaim_state;

	struct backing_dev_info *backing_dev_info;

	struct io_context *io_context;

	unsigned long ptrace_message;
	siginfo_t *last_siginfo; /* For ptrace use.  */
	struct task_io_accounting ioac;
#if defined(CONFIG_TASK_XACCT)
	u64 acct_rss_mem1;	/* accumulated rss usage */
	u64 acct_vm_mem1;	/* accumulated virtual memory usage */
	cputime_t acct_timexpd;	/* stime + utime since last update */
#endif
#ifdef CONFIG_CPUSETS
	nodemask_t mems_allowed;	/* Protected by alloc_lock */
	int cpuset_mem_spread_rotor;
#endif
#ifdef CONFIG_CGROUPS
	/* Control Group info protected by css_set_lock */
	struct css_set *cgroups;
	/* cg_list protected by css_set_lock and tsk->alloc_lock */
	struct list_head cg_list;
#endif
#ifdef CONFIG_FUTEX
	struct robust_list_head __user *robust_list;
#ifdef CONFIG_COMPAT
	struct compat_robust_list_head __user *compat_robust_list;
#endif
	struct list_head pi_state_list;
	struct futex_pi_state *pi_state_cache;
#endif
#ifdef CONFIG_PERF_EVENTS
	struct perf_event_context *perf_event_ctxp;
	struct mutex perf_event_mutex;
	struct list_head perf_event_list;
#endif
#ifdef CONFIG_NUMA
	struct mempolicy *mempolicy;	/* Protected by alloc_lock */
	short il_next;
#endif
	atomic_t fs_excl;	/* holding fs exclusive resources */
	struct rcu_head rcu;

	/*
	 * cache last used pipe for splice
	 */
	struct pipe_inode_info *splice_pipe;
#ifdef	CONFIG_TASK_DELAY_ACCT
	struct task_delay_info *delays;
#endif
#ifdef CONFIG_FAULT_INJECTION
	int make_it_fail;
#endif
	struct prop_local_single dirties;
#ifdef CONFIG_LATENCYTOP
	int latency_record_count;
	struct latency_record latency_record[LT_SAVECOUNT];
#endif
	/*
	 * time slack values; these are used to round up poll() and
	 * select() etc timeout values. These are in nanoseconds.
	 */
	unsigned long timer_slack_ns;
	unsigned long default_timer_slack_ns;

	struct list_head	*scm_work_list;
#ifdef CONFIG_FUNCTION_GRAPH_TRACER
	/* Index of current stored address in ret_stack */
	int curr_ret_stack;
	/* Stack of return addresses for return function tracing */
	struct ftrace_ret_stack	*ret_stack;
	/* time stamp for last schedule */
	unsigned long long ftrace_timestamp;
	/*
	 * Number of functions that haven't been traced
	 * because of depth overrun.
	 */
	atomic_t trace_overrun;
	/* Pause for the tracing */
	atomic_t tracing_graph_pause;
#endif
#ifdef CONFIG_TRACING
	/* state flags for use by tracers */
	unsigned long trace;
	/* bitmask of trace recursion */
	unsigned long trace_recursion;
#endif /* CONFIG_TRACING */
#ifdef CONFIG_CGROUP_MEM_RES_CTLR /* memcg uses this to do batch job */
	struct memcg_batch_info {
		int do_batch;	/* incremented when batch uncharge started */
		struct mem_cgroup *memcg; /* target memcg of uncharge */
		unsigned long bytes; 		/* uncharged usage */
		unsigned long memsw_bytes; /* uncharged mem+swap usage */
	} memcg_batch;
#endif
};
```

虚拟内存区域(VMA): 表示进程地址空间中的内存区域 进程能够访问, 其他地方报段错误
* 代码段(text section), 可执行文件代码的内存映射
* 数据段(ds), 可执行文件的已初始化全局标量的内存映射
* bss(block started by symbol)段的零页: 为初始化全局标量的内存映射
* 进程用户空间栈的零页内存映射
* 进程使用的C库或者动态链接库等共享库的代码段, 数据段和bss段的内存映射
* 任何内存映射文件
* 任何共享内存段
* 任何匿名内存映射, malloc()分配的内存

```c
struct vm_area_struct {
    struct mm_struct * vm_mm;    /* 指向和VMA 相关的 mm_struct 结构体 */
    unsigned long vm_start;        /* 内存区域首地址 最低地址 */
    unsigned long vm_end;        /* 内存区域尾地址 最高地址 vm_end-vm_start=内存区间的长度 */

    /* linked list of VM areas per task, sorted by address */
    struct vm_area_struct *vm_next, *vm_prev;  /* VMA链表 */

    pgprot_t vm_page_prot;        /* 访问控制权限 */
    unsigned long vm_flags;        /* 标志 标志了内存区域所包含的页面的行为和信息 linux/mm.h VM_* */

    struct rb_node vm_rb;       /* 树上的VMA节点 */

    /*
     * For areas with an address space and backing store,
     * linkage into the address_space->i_mmap prio tree, or
     * linkage to the list of like vmas hanging off its node, or
     * linkage of vma in the address_space->i_mmap_nonlinear list.
     */
    union {
        struct {
            struct list_head list;
            void *parent;    /* aligns with prio_tree_node parent */
            struct vm_area_struct *head;
        } vm_set;

        struct raw_prio_tree_node prio_tree_node;
    } shared;

    /*
     * A file's MAP_PRIVATE vma can be in both i_mmap tree and anon_vma
     * list, after a COW of one of the file pages.    A MAP_SHARED vma
     * can only be in the i_mmap tree.  An anonymous MAP_PRIVATE, stack
     * or brk vma (with NULL file) can only be in an anon_vma list.
     */
    struct list_head anon_vma_node;    /* anon_vma 项 */
    struct anon_vma *anon_vma;    // 匿名VMA对象

    /* Function pointers to deal with this struct. */
    const struct vm_operations_struct *vm_ops; // 指向与指定内存区域相关操作函数表, 针对特定的对象实例的特定方法

    /* Information about our backing store: */
    unsigned long vm_pgoff;       // 文件中的偏移量
    struct file * vm_file;        // 被映射的文件(如果存在)
    void * vm_private_data;       // 私有数据
    unsigned long vm_truncate_count;/* truncate_count or restart_addr */

#ifndef CONFIG_MMU
    struct vm_region *vm_region;    /* NOMMU mapping region */
#endif
#ifdef CONFIG_NUMA
    struct mempolicy *vm_policy;    /* NUMA policy for the VMA */
#endif
};
```


页表: 3级页表完成地址转换, 捷俊地址转换占用的存放空间
顶级页表(PGD)
二级页表(PMD)
页表(pte)页表项 指向物理页面


TLB(translate lookaside buffer): 翻译后缓冲器, 将虚拟地址映射到物理地址的硬件缓存


进程 (任务):处于执行期的程序,打开的文件,挂起的信号, 内核内部数据, 处理器状态, 线程等
任务队列: 存放进程的列表,是双向循环链表, 每一项是task_struct(进程描述符,32位约1.7KB)
线程(Thread): 进程中活动的对象, 独立的计数器, 进程栈, 进程寄存器, 内核调度对象, 特殊的进程
/proc/sys/kernel/pid_max 提高进程上限
```c
struct thread_info {
	struct task_struct	*task;		// 该进程实际的task指针 /* main task structure */
	struct exec_domain	*exec_domain;	/* execution domain */
	__u32			flags;		/* low level flags */
	__u32			status;		/* thread synchronous flags */
	__u32			cpu;		/* current CPU */
	int			preempt_count;	/* 0 => preemptable,
						   <0 => BUG */
	mm_segment_t		addr_limit;
	struct restart_block    restart_block;
	void __user		*sysenter_return;
#ifdef CONFIG_X86_32
	unsigned long           previous_esp;   /* ESP of the previous stack in
						   case of nested (IRQ) stacks
						*/
	__u8			supervisor_stack[0];
#endif
	int			uaccess_err;
};
```

sys_clone -> do_fork


虚拟文件系统(VFS):
超级块对象: super_operations: wirte_inode,sync_fs()
索引节点对象: inode, create(), link() 内核在操作文件或目录时需要的全部信息 代表一个文件, 设备或者管道这样的特殊文件
目录项对象: dentry, d_compare(), d_delete()
文件对象:file, read(), write()


目录项缓存(Dcache): 遍历元素解析成目录项对象, 费力
被使用的: 通过inode-> i_dentry 链接相关的索引节点
最近被使用的: 双向链表, 还有未被使用和负状态的目录对象, 头部插入, 尾部删除

页高速缓存和页回写
回写: 直接写到缓存中, 被写入的页面标记成脏, 加入脏页列表中.
由回写进程周期性将脏页链表中的页写回磁盘, 保持最终一致, 清理脏页标识
实现复杂

缓存回收策略:
1. 最近最少使用: LRU, 回收时间戳最老的页面
2. 双链策略: 活跃链表和非活跃链表

1. 空闲内存低于一个阈值: 需要释放内存
2. 脏页主流时间到达一个阈值: 确保不会无限期停留
3. 用户进程调用sync()和fsync()

```c
// 页缓存struct
struct address_space {
    struct inode        *host;        /* 拥有此 address_space 的inode对象 */
    struct radix_tree_root    page_tree;    /* 包含全部页面的 radix 树 */
    spinlock_t        tree_lock;    /* 保护 radix 树的自旋锁 */
    unsigned int        i_mmap_writable;/* VM_SHARED 计数 */
    struct prio_tree_root    i_mmap;        /* 私有映射链表的树 */
    struct list_head    i_mmap_nonlinear;/* VM_NONLINEAR 链表 */
    spinlock_t        i_mmap_lock;    /* 保护 i_map 的自旋锁 */
    unsigned int        truncate_count;    /* 截断计数 */
    unsigned long        nrpages;    /* 总页数 */
    pgoff_t            writeback_index;/* 回写的起始偏移 */
    const struct address_space_operations *a_ops;    /* address_space 的操作表 */
    unsigned long        flags;        /* gfp_mask 掩码与错误标识 */
    struct backing_dev_info *backing_dev_info; /* 预读信息 */
    spinlock_t        private_lock;    /* 私有 address_space 自旋锁 */
    struct list_head    private_list;    /* 私有 address_space 链表 */
    struct address_space    *assoc_mapping;    /* 缓冲 */
} __attribute__((aligned(sizeof(long))));

```

临界区: 访问和操作共享数据的代码段ds
竞争条件: 2个执行线程有可能处于同一个临界区中同时执行
同步: 避免并发和防止竞争条件













