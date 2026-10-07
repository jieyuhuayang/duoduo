# 06-forget-gc 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/06-forget-gc.sh`。输出：`.build/scenarios/06-forget-gc/`（`report.md`、`boot.log`、`git-state.txt`、`git-commands-{A,B,C}.txt`、`manual-replay.txt`、`manual-replay-B.txt`）。

**结论：** §14.3 第 2 条的遗忘 GC 缺陷在 daemon 上真实存在：带路径的 commit 与回滚用的 checkout 都因 pathspec 不匹配失败，删除停在暂存区，没有 "forget:" 提交，心跳日志也不报告。

## 测试的陈述

- §14.3.2："`git diff --name-only` 输出相对仓库根的路径，于是带路径的 commit 与回滚用的 checkout 都因路径不匹配失败，删除停在暂存区，不出现 "forget:" 提交"。
- §12.3：只要批次里有一个文件有本地修改，`git rm` 就整体失败；从未提交过的 STALE 文件不会被删除。

## 步骤

四次启动共用同一个隔离 HOME：

1. **启动 1：** 初始化内核，生成 genesis 提交。
2. **阶段 A：** 建 `memory/topics/stale-orphan.md`，用回拨 3 天的 author 和 committer 日期提交，再用 `touch -d` 把 mtime 也设到 3 天前。然后打开 CHECK 和 FORGET，以 4 秒周期运行。代码判断年龄只看 `statSync().mtimeMs`（`computeOrphanTopicNodes ($ft)`），不看 git 日期。
3. **阶段 B：** `reset --hard` 恢复工作区，再加入第二个孤儿 `stale-edited.md`，它带一处未提交的修改。
4. **阶段 C：** 只留一个从未提交过的 STALE 文件。

`forgetMemoryEntry` 用的是 `spawnSync`，函数 trace 看不到这些 git 命令，所以用 `GIT_TRACE2_EVENT` 记下 daemon 每条 git 命令的 argv 和退出码。另外在一份内核副本上，以 `LC_ALL=C` 按同样的 cwd 和 argv 重放，拿到 git 的 stderr。

## 阶段 A 观测

- trace 链路是 `routeContractDecision (qH)` 返回 intuition-weaver，`isOrphanWarningDeliverable (eSe)` 加 `enforceContractGate("orphan-newborn.v1", valid)` 放行，然后调用 `forgetMemoryEntry (NSe)`，参数是 1 个 STALE 项（ageHours 72.0）。之后还调用了 `resolveGitToplevelSync (Cft)` 和 `formatForgetCommitMessage (Mft)`。
- daemon 实际执行的 git 命令：

```
exit=0 git rm --ignore-unmatch -- topics/stale-orphan.md
exit=0 git diff --cached --name-only --diff-filter=D -- topics/stale-orphan.md
exit=1 git -c user.name=aladuo … commit -m forget: stale-orphan, stale orphan never linked -- memory/topics/stale-orphan.md
exit=0 git reset --quiet -- memory/topics/stale-orphan.md
exit=1 git checkout -- memory/topics/stale-orphan.md
```

- 重放得到的 stderr：`error: pathspec 'memory/topics/stale-orphan.md' did not match any file(s) known to git`，commit 和 checkout 都报这条。
- 结果：文件已从工作区删除，`git status` 显示 `D  memory/topics/stale-orphan.md`（已暂存）；`git log` 里没有 "forget:" 提交；日志里的 `[memory] check tick` 写的是 `forgotten: []`，没有任何错误日志。

## 阶段 B、C 观测

- **阶段 B：** 两次心跳都执行了 `git rm --ignore-unmatch -- topics/stale-edited.md topics/stale-orphan.md`，都以 exit=1 结束。重放显示 `error: the following file has local modifications: memory/topics/stale-edited.md`。两个文件都还在，索引没有变化，日志照样只写 `forgotten: []`。这个失败每次心跳都会重复，而且不留任何日志。
- **阶段 C：** `git rm` 以 exit=0 结束，`git diff --cached` 输出为空，函数在 commit 之前就返回，那个未跟踪文件保留了下来。

## 判定

- §14.3.2 的缺陷：**confirmed（真实存在）。** commit 失败，删除停在暂存区，没有 "forget:" 提交，心跳日志也不报告这次遗忘。`git reset` 对不匹配的路径确实什么都不做。
- 批次整体失败：**confirmed。**
- 未提交过的文件不删：**confirmed。**
- 尚未测试：`.git/index.lock` 那条退出路径，以及 memory-committer 之后会不会把这项暂存的删除提交进去（这一步需要模型）。

## 新发现

阶段 A 的第二次心跳里，`readNewestMtimeRecursive (CN)` 读到的 topics 目录 mtime 变了，因为文件被删除了。于是指纹变化，调度器又运行了 memory-committer 和 pattern-tracker（这次也是被拒绝）。遗忘的删除本身会让下一次心跳通过指纹门。

## 建议写入文档的句子

- **§12.3：** 在两个开关都打开的 daemon 上，`forgetMemoryEntry (NSe)` 的 `git rm` 与 `git diff --cached` 成功，带路径的 commit 和回滚用的 checkout 都因 pathspec 不匹配以 exit=1 结束，`git reset` 以 exit=0 结束；删除停在暂存区，`git log` 里没有 "forget:" 提交，`[memory] check tick` 日志写 `forgotten: []`。§12.3 里的"未证实推测"和 §14.3 第 2 条中已经确认的部分都可以改成 confirmed。
