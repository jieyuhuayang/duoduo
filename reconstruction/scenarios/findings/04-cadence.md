# 04-cadence 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/04-cadence.sh`。输出：`.build/scenarios/04-cadence/`（`report.md`、`boot.log`、`kernel-diff.txt`、`status-*.json`、`task-sheets/`、`events/`）。运行没有调用模型：daemon 设了 `ALADUO_DEFAULT_RUNTIME=pi` 而没有配置 pi 模型，所以每个被选中的分区都在启动任何进程之前被拒绝，记为 `runtime_unavailable`，事件日志里记成 `agent.error`。

**结论：** §11.1、§11.2、§12.2 关于心跳的陈述全部复现。

## 测试的陈述

- §11.1：定时器回调的第一句是 `h.emit("cadence.tick")`，随后 `runCadenceTick (Cbt)` 按固定顺序执行四步确定性维护。
- §11.2：活动指纹不变时，整次心跳不运行分区；重启后的第一次心跳总能通过。
- §12.2：`runMemoryCheckTick (jft)` 只读 memory 目录，任务单写进 `var/subconscious/<分区名>/inbox/`。

## 步骤

1. 用 `ALADUO_CADENCE_INTERVAL_MS=4000`、`ALADUO_EXP_MEMORY_CHECK=1`（变量名在 `resolveCadenceIntervalMs (FSe)` 和 `resolveMemoryCheckFlags (WH)` 里确认过）和 debug 日志级别启动 daemon。
2. 对内核 memory/ 和 subconscious/ 做快照。
3. 等三次心跳，靠轮询 status.json 的 `last_tick` 判断。
4. 在第一次心跳前、第一次后、第三次后各调一次 `system.status`。
5. 再做一次快照并 diff。

## 观测与判定

- **四步顺序：confirmed。** trace 中定时器回调先同步调用两个订阅者 `createOutboxDeliveryManager>c` 和 `createMetaSession>k`，然后才进入 `runCadenceTick`。四步按 seq 依次是 `runMemoryCheckTick`、`sweepTombstonedSessionRecords ($bt)`、`createSpineEvent (en)` 加 `atomicAppendEvent (tn)`（写 `system.cadence_tick`，来源 `{kind:"system",name:"cadence"}`，payload `{}`）、`advanceConsumerWatermark (Bu)` 加 `updateRegistryStatus (Vu)`。三次维护分别用了 14、6、5 ms，没有调用任何引擎适配器。
- **记忆检查只读：confirmed，但证据较弱。** memory/ 下所有文件的哈希都没变，因为这次 memory 目录几乎是空的。kernel diff 里唯一的变化是 `subconscious/playlist.md`，它由分区调度器的 `markPlaylistItemExecuted (IO)` 改写，并且一直没有提交。
- **任务单：** 记忆检查只投递了 `intuition-weaver/inbox/activation-report.md.pending`，同时写了快照文件 `.memory-signals.json`。第二、三次心跳把它记为 `withheld … reason: 'already-pending'`。第一次心跳的 activation report 写着 "(no event partitions on disk)"，因为记忆检查跑在第一条心跳事件写入之前。
- **指纹门：confirmed。** 判定在 `createMetaSession (Pbt)` 里做。`hashActivityFingerprint (Ebt)` 三次收到的输入完全相同，都是 `"<mtime>:<mtime>:<mtime>:"`，第四段外部事件 id 为空。第一次心跳（重启后）通过检查，之后调用了 `loadSubconsciousPartitions`、`rebuildPlaylistRound`，再对 gradient-distiller 和 intuition-weaver 各走一遍拒绝路径（`createMetaSession>j`）。第二、三次心跳只记一条 DEBUG 日志 "[meta-session] activity gate: skipping tick (fingerprint unchanged)" 就返回。
- **第二次心跳的不同之处：** 调度器停在指纹门；记忆检查没有投递新任务单；`reconcileMemorySignalInboxes` 什么都没撤回；gap-lint 多调用了一次 `readGapLintDayEvents`，因为事件日志文件这时已经存在。
- **`system.status`：** 第一次心跳前 `cadence.last_tick` 是 `null`。之后它等于最近一条 `system.cadence_tick` 事件的 `ts`，`interval_ms` 是 4000。`health.meta_session` 从 `starting` 变成 `ok`。

## 文档里没有写的新事实

- 调度器在做指纹检查之前，每次心跳都会记一条 INFO 级的 "[meta-session] starting tick"。所以这行日志不代表有分区运行，要看 "tick completed" 那一行。
- 第一个分区被拒绝之后，同一次心跳仍然会选第二个分区。
- 调度器运行之后，`playlist.md` 一直作为未提交修改留在内核工作区。

## 建议写入文档的句子

- **§11.2：** `createMetaSession (Pbt)` 在指纹检查之前就记 INFO 级的 "starting tick"，指纹不变时只再记一条 DEBUG 日志后返回；心跳事件与分区的 `agent.error` 都不改变指纹。
