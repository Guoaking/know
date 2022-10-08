## 架构原理

### 优势

### kafka架构

问题?
重启: 负载高, 拉数据
replace: 负载高, 压力大
扩容: 时间long


## 存储结构

partition -> segment-> 一个文件-> segmentcheckpoint(元数据) state 是否健康
generation版本号 文件路径
start_msg_offset 0
end_msg_offset  99+1

start_msg_pos
end_msg_pos

## 生产消费流程

## bmq 优化

## hdfs abase容错