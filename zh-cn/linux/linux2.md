## nameSpace and cgroup

一个进程可以使用它运行的物理机器上的所有资源，从而使其他进程缺乏资源。为了限制这一点，Linux 有一个叫做 cgroups 的特性。
进程可以像命名空间一样在 cgroup 中运行，但 cgroup 限制了进程可以使用的资源。
这些资源包括 CPU、RAM、块 I/O、网络 I/O 等。CPU 通常受限于毫核（内核的 1000 分之一），内存受限于 RAM 字节。进程本身可以正常运行，但它只能使用 cgroup 允许的 CPU，如果超过 cgroup 上设置的内存限制，则会出现内存不足错误。


容器

轻量级的vm, 普通进程,
unshare --fork --pid --mount-proc bash
nsenter
 cgcreate -a bork -g memory:mycoolgroup
 cgexec  -g memory:mycoolgroup bash

unshare --pid --uts --ipc --mount -f chroot rootfs /bin/sh

[What even is a container: namespaces and cgroups](https://jvns.ca/blog/2016/10/10/what-even-is-a-container/)

// 判断支持的ns
ls -l /proc/$$/ns
sysctl --all | grep namespace
cat /proc/sys/user/max_user_namespaces


unshare --user --pid --map-root-user --mount-proc --fork bash

docker run -d --name pause -p 8080:80 gcr.io/google_containers/pause-amd64:3.0 --ipc=shareable

docker run -d --name nginxv4 -v `pwd`/nginx.conf:/etc/nginx/nginx.conf --net=container:pause --ipc=container:pause --pid=container:pause nginx


iptables/conntrack
dmesg | grep -i conntrack
sysctl -a | grep net.nf_conntrack_max


```c
/*
Copyright 2016 The Kubernetes Authors.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

static void sigdown(int signo) {
  psignal(signo, "Shutting down, got signal");
  exit(0);
}

static void sigreap(int signo) {
  while (waitpid(-1, NULL, WNOHANG) > 0);
}

int main() {
  if (getpid() != 1)
    /* Not an error because pause sees use outside of infra containers. */
    fprintf(stderr, "Warning: pause should be the first process\n");

  if (sigaction(SIGINT, &(struct sigaction){.sa_handler = sigdown}, NULL) < 0)
    return 1;
  if (sigaction(SIGTERM, &(struct sigaction){.sa_handler = sigdown}, NULL) < 0)
    return 2;
  if (sigaction(SIGCHLD, &(struct sigaction){.sa_handler = sigreap,
                                             .sa_flags = SA_NOCLDSTOP},
                NULL) < 0)
    return 3;

  for (;;)
    pause();
  fprintf(stderr, "Error: infinite loop terminated\n");
  return 42;
}

```


ns  创建神奇世界
pid
net
...

cgroup

限制
mem
cpu
系统调用
硬:
软:


[暂停容器](https://www.ianlewis.org/en/almighty-pause-container)

./toscli   -bucket=tos-cn-v-bc5cf5 -accessKey 6S9ASF6HH20G1M9TMWF8 get 3a82d966b0fd439fa266fe6ac73adfdf
go test str_test.go -bench="Concat$"  -benchmem .


https://sf1-lark-tos.kaqa.statusfeishu.cn/ng-static-resource/ccm/static_resource/scm_upload/pivot-table-onborading-zh.mp4
https://sf1-lark-tos.kadelivery1.statusfeishu.cn/ng-static-resource/ccm/static_resource/scm_upload/pivot-table-onborading-zh.mp4
https://sf1-lark-tos.kadev-cicd.statusfeishu.cn/ng-static-resource/ccm/static_resource/scm_upload/pivot-table-onborading-zh.mp4
