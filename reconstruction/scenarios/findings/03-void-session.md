# 03-void-session 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/03-void-session.sh`。输出：`.build/scenarios/03-void-session/`（`report.md`、`rpc.jsonl`、`boot.log`、`events/`、`outbox/`、`pull-A.json`、`pull-B.json`）。

**结论：** 文档关于 void 会话的 daemon 侧主张全部 confirmed。入站消息和 Notify 都先追加 WAL 行和 by_id 行，然后只写一条出站记录。daemon 不写邮箱指针，不唤醒会话，也不 drain。会话命令、`session.wake`、`session.compact` 和 `/model` 都以文档写的拒绝文字结束。§14.2 第 7 项只解决了 daemon 侧，适配器怎样呈现这些记录仍然 inconclusive。

## 步骤

- 渠道 A 由 `channel.spawn` 创建，参数为 `voidinst` / `void-inst-1`，`runtime: void` 写在实例层。
- 渠道 B 在启动前手写两个文件：`$ISO/aladuo/config/voidkind.md`，内容为 `runtime: void`；实例描述符 `var/channels/void-kind-1/descriptor.md`，不写 `runtime`。
- 向 A 依次发送：`channel.ingress`（普通消息、`/compact`、`/loop check the build`、`/model`、`/status`）；`channel.command`（`/compact`）；`session.notify`，带 `in_reply_to: "mail-42"`；`session.wake`、`session.compact`、`session.model`、`session.effort`。
- 然后执行 HTTP `channel.pull`，接着 `channel.ack`，再 pull 一次。

## 证据与判定

| 主张 | 判定 | 证据 |
|---|---|---|
| §3.1 实例层和种类层的 void 都生效 | confirmed | B 只有种类层的 void，但走了 void 分支。`channel.describe` 对 B 返回 `kind_defaults:{"runtime":"void"}`。 |
| §6.2、§1.2、§5.1：追加日志、不写指针、写出站记录、不唤醒 | confirmed | 调用顺序为 `appendBeforeExecuteGateway, createSpineEvent, loadRegistryDedupStore, computeDedupKey, writeIngressSnapshot, atomicAppendEvent, appendEventToPartition, advanceConsumerWatermark, isVoidRuntimeSession, resolveSessionChannelRuntime, writeVoidSessionOutboxRecord, persistOutboxRecord`。整个运行中 `enqueueSessionInboxLine` 和 `drainSessionMailbox` 都是 0 次，`grep @evt(` 结果为空，会话目录里没有 inbox 文件。日志为 `[gateway] void-session event (outbox, no enqueue)`。 |
| §5.1 两次写 | confirmed | 10 个 WAL 行对应 10 个 by_id 行，偏移首尾相接（0/454、454/454、908/477…）。 |
| §6.2 会话命令不执行 | confirmed | `/compact`（ingress 和 channel.command 两条路径）返回 `"This session never runs a model (runtime void). /compact was not run."`。`/loop` 得到同一句式。 |
| §6.2 `/model` 只回复拒绝文字 | confirmed | 走网关分支：`replyToGatewayCommandEvent → executeGatewayCommand → getSessionModelView`，回复 `"…(runtime void). It has no model or effort to show or set."`。`/status` 照常执行。 |
| §3.1、§8.5：wake 和 compact 以 `void_session` 拒绝 | confirmed | 两者都返回 `{"ok":false,"reason":"void_session",…}`，错误文字以 `This session never runs a model (runtime void).` 开头。之后什么都没有写。 |
| §4.3 Notify 到 void 会话变成出站记录 | confirmed | 调用顺序为 `deliverExternalSessionNotify, evaluateNotifyConsumerRefusal, deliverRouteEventToSession, atomicAppendEvent, isVoidRuntimeSession, writeVoidSessionOutboxRecord`。日志为 `[route] delivered to void session outbox (no mailbox, no wake)`。记录的 `payload.data` 包含 `notify_in_reply_to:"mail-42"`、`notify_source_kind:"external"` 和 `source_session_key:"external:session.notify"`。 |
| §14.2 第 7 项 | daemon 侧 confirmed，适配器侧 inconclusive | pull 返回 7 条记录（`pull-A.json`），ack 之后再 pull 为 0 条且 `idle:true`。适配器怎样呈现记录，以及谁读取 `notify_in_reply_to`，需要真实的插件才能观察。 |

## 文档没有写到的行为（均 confirmed）

1. **void 出站记录没有 `in_reply_to_event_id` 和 `routing` 字段。** 因此它们不进 `outbox/index/by_event.jsonl`。这个索引里只有两条网关回复（`/model`、`/status`）。适配器只能从 `payload.data.event_id` 把一条 void 记录对到它的入站事件。
2. **`channel.ingress` 的 `display_name` 对 void 会话不生效。** 它只随 `session.wake` 总线事件传递，void 分支不发这个事件。另外 `session.list` 中 void 会话的 `last_event_at` 一直为 `null`。
3. **被拒绝的 `/loop <文字>` 仍把展开后的完整注入提示正文写进 WAL。** 本次 `payload.text` 为 19402 字符。
4. **启动前写入的种类文件会保留。** 内核目录非空时，`copyBootstrapIntoKernel` 走 `copyDirTreeMissingOnly`，所以这个文件在第一次启动后逐字节不变。

## 建议写入文档的句子

- **6.2：** 实测中，发给 void 会话的普通消息、`/compact` 和 `/loop <文字>` 只经过 `atomicAppendEvent (tn)` 与 `writeVoidSessionOutboxRecord (wI)`；`enqueueSessionInboxLine (ta)` 与 `drainSessionMailbox (zxe)` 都没有被调用；`/model` 由 `executeGatewayCommand (Fet)` 回复拒绝文字。
- **6.3：** void 出站记录由 `writeVoidSessionOutboxRecord (wI)` 构造，不带 `in_reply_to_event_id` 与 `routing`，入站事件 id 只记在 `payload.data.event_id`。`persistOutboxRecord (Va)` 只为带 `in_reply_to_event_id` 的记录写 by_event 索引，所以 `findOutboxRecordByEventId (lh)` 查不到 void 记录。
- **3.1：** 只在 `<kernel>/config/<kind>.md` 写 `runtime: void`、实例描述符不写 runtime 的渠道，其会话同样是 void 会话（`resolveLayeredChannelRuntime (Ua)`）。
- **4.3：** `session.notify` 的 `in_reply_to` 经 `deliverExternalSessionNotify (EIe)` 进入 void 目标出站记录的 `payload.data.notify_in_reply_to`；读取它的一方仍未证实。
- **14.2 第 7 项：** 缩小为"适配器怎样呈现 void 记录，以及谁读取 `notify_in_reply_to`"。
