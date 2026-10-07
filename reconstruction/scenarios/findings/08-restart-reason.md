# 08-restart-reason 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/08-restart-reason.sh`。输出：`.build/scenarios/08-restart-reason/`。没有调用模型：唤醒目标只用了不存在的会话键和一个 void 渠道会话。

**结论：** 每次启动，`main (kvt)` 都由 `claimDaemonRestartReason (iwe)` 读取并删除 `var/daemon-restart-reason.json`。删除不看时间戳、pid 或 boot id，格式错误的文件也被删除，而且不留日志。唤醒目标经 `deliverDaemonRestartWakes (avt)` → `deliverExternalSessionNotify (EIe)` 投递，结果写进日志。一个 2020 年的旧文件同样被认领，它的唤醒目标同样被尝试投递，这证实了 §14.2 第 5 项中"之后任何一次成功启动都会认领旧文件"这一半。

## 被测说法

- **R1（§6.4）**：新 daemon 读取文件一次并立即删除；下一次启动会认领当时存在的任何这个文件，除 daemon 日志外没有记录。
- **R2（§6.4）**：在解析 JSON 之前删除文件，格式错误的文件被静默销毁；原因去掉首尾空白，唤醒目标去掉空串，两者都为空时视同没有文件。
- **R3（§6.4）**：唤醒目标收到一条来源为 `daemon-restart` 的 `external.notify` 投递，带 `force`；结果只写日志。
- **R4（§14.2 第 5 项）**：一条残留的旧原因会被之后任何一次成功启动认领，其中的唤醒目标会被投递。
- **R5（§6.4）**：重启提示块经 `decideRestartHintInjection (awe)` 注入。

## 步骤

1. 第一次启动，没有原因文件；创建 void 渠道会话 `voidinst:room-8`。
2. 文件 A：`reason:"  scenario 08: config change  "`，`requested_by_agent:true`，`wake_targets:["nobody:does-not-exist","voidinst:room-8","   "]`，然后启动。
3. 文件 B：`requested_at:"2020-01-01…"`，另加 daemon 不读的 `pid`/`boot_id`/`started_at` 字段，文件 mtime 设为 2020 年，然后启动。
4. 文件 C：截断的 JSON。
5. 文件 D：`reason:"   "`，`wake_targets:["","  "]`。
6. 文件 E：`reason:""`，一个唤醒目标（CLI 的 `--wake` 不带 `-r` 时写的就是这种形式）。

## 证据

- **文件是否还在**：六次启动后文件都不在了。
- **第一次启动**：`claimDaemonRestartReason` → `daemonRestartReasonPath` → `setPendingRestartReason`，没有日志。
- **文件 A**：日志为 `[pid0] restart reason claimed { requested_at: '2026-10-07T16:06:16.000Z', requested_by_agent: true, wake_targets: [ 'nobody:does-not-exist', 'voidinst:room-8' ] }`。空白目标被去掉；日志里没有原因正文。接着依次是 `session-manager started`、`restart wake refused { target: 'nobody:does-not-exist', reason: 'not_found' }`、`restart wake delivered { target: 'voidinst:room-8', … }`，然后 job-scheduler 才启动。调用链：`claimDaemonRestartReason` → `setPendingRestartReason` → … → `deliverDaemonRestartWakes` → `renderRestartWakeMessage` → `deliverExternalSessionNotify` → `resolveSessionByKeyOrAlias` → `resolveIsolatedPlaneKind` → `deliverRouteEventToSession` → `isVoidRuntimeSession` → `resolveSessionChannelRuntime` → `writeVoidSessionOutboxRecord` → `persistOutboxRecord`。事件日志多了一条 `route.deliver`：source 为 `{kind:"route",name:"daemon-restart"}`，`source_session_key:"external:session.notify"`，`source_event_type:"external.notify"`。outbox 记录的正文为 `"The daemon was restarted, which may have cut off the turn you were running. The restart was requested at 2026-10-07T16:06:16.000Z. Reason given by the caller: scenario 08: config change Check whether the work you were doing completed before continuing."`，原因的首尾空白已被去掉。
- **文件 B（旧文件）**：`restart reason claimed { requested_at: '2020-01-01T00:00:00.000Z', requested_by_agent: false, wake_targets: [ 'nobody:stale-target' ] }`，随后 `restart wake refused … not_found`。
- **文件 C（格式错误）**：文件被删除，没有 claimed 日志，也没有报错日志。
- **文件 D（空白）**：文件被删除，没有 claimed 日志；trace 显示每个目标都被 trim 后过滤掉。
- **文件 E（空原因 + 唤醒目标）**：`restart reason claimed`，唤醒被投递，正文里没有"Reason given by the caller"那一句。
- `getPendingRestartReason`、`renderDaemonRestartHint`、`decideRestartHintInjection` 在本场景中从未被调用。

## 判定

| 编号 | 判定 | 理由 |
|---|---|---|
| R1 | confirmed，有修正 | 文件被删除，没有任何新旧检查。但当文件里有唤醒目标时，原因会经 `route.deliver` 事件进入事件日志；而 claimed 日志本身不含原因正文。 |
| R2 | confirmed | 文件 C、D 被删除且没有日志；原因被 trim，空目标被过滤。 |
| R3 | confirmed | 投递字段与文档一致；不存在的目标返回 `not_found`。 |
| R4 | 实测部分 confirmed | 2020 年的文件被认领，唤醒目标被尝试投递。launchd 失败那一半没有测。 |
| R5 | inconclusive | 需要渠道会话真正 drain 一轮（会调用模型）。 |

## 建议写入文档的句子

- **§6.4**：`claimDaemonRestartReason (iwe)` 不比较文件里的 requested_at、pid 或 boot id，也不看文件时间；实测中 requested_at 为 2020 年的文件同样被认领，其中的唤醒目标同样被投递。格式错误或原因与目标都为空白的文件被删除，daemon 不写任何日志。
- **§6.4（修正"没有记录"）**：认领时，`main (kvt)` 的日志只记录 requested_at、requested_by_agent 与 wake_targets，不记录原因正文。文件里有唤醒目标时，`deliverDaemonRestartWakes (avt)` 经 `deliverExternalSessionNotify (EIe)` 为每个目标追加一条 `route.deliver` 事件，正文由 `renderRestartWakeMessage (lwe)` 生成并含原因，因此原因会以这种形式进入事件日志。
- **§6.4**：原因为空、只有唤醒目标的文件也被认领，唤醒正文省略原因那一句。
- **§6.4**：唤醒目标是 void 渠道会话时，投递由 `writeVoidSessionOutboxRecord (wI)` 写成 outbox 记录，不写 mailbox 指针，也不唤醒会话。
- **§14.2 第 5 项**："之后任何一次成功启动都会认领旧文件"已由实测证实，只剩"launchd 托管的重启是否会留下这个文件"需要在 macOS 上验证。
