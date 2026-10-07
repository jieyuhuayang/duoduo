# 05-dedup 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/05-dedup.sh`。输出：`.build/scenarios/05-dedup/`（`report.md`、`rpc.jsonl`、`counts.tsv`、`dedup.jsonl`）。

**结论：** 去重表每个不同的键只写一行 `{key, ts, event_id}`。重复尝试不加行，也不加 WAL 事件，所以去重表随不同键的数量增长，而不随尝试次数增长（§14.2 第 2 项的"按键增长"已 confirmed；长期内存占用仍未测）。此外有三处与文档不符或文档没写：

- 网关重复时，RPC 结果里没有 `deduplicated` 标志。对 void 会话，重放的 `gateway_response` 为空，即使第一次有回复也是如此。
- 键的命名空间只有来源种类，与方法无关：`channel.command` 会被同键的 `channel.message` 吞掉。
- `spine.record` 可以与网关键碰撞。

## 步骤与观测

| 步骤 | 响应 | dedup 行数 / WAL 事件数 |
|---|---|---|
| 1.1–1.5：ingress 键 `msg-1` 发送 5 次 | 5 次都是 `{"event_id":"evt_2a2c…"}`，同一个 id，没有任何标志 | 1 / 1 |
| 2：同键、不同文字 | 同一个 event_id | 1 / 1 |
| 3：同种类的另一实例 B，同键 | 返回 A 的 event_id；B 的消息不进 WAL，也没有出站记录 | 1 / 1 |
| 4：`channel.command` `/status`，同键 | 返回 A 那条消息的 event_id；`/status` 没有执行 | 1 / 1 |
| 5.1–5.2：`/status` 键 `cmd-1` 发送两次 | 两次都返回同样的 `gateway_response` 和 `outbox_id` | 2 / 3 |
| 5b.1–5b.2：对 void 会话发 `/compact`，键 `cmp-1`，两次 | 第一次带拒绝文字和 `outbox_id`；第二次只有 `event_id` | 3 / 4 |
| 6.1–6.3：`session.notify` 键 `n-1` 两次，再换一条消息 | 先 `duplicate:false`，再 `duplicate:true` 且 `route_id` 相同，最后 `idempotency_conflict` | 4 / 5 |
| 7.1–7.3：`spine.record` ext-a 两次，再 ext-b 同 conversation 同 dedup_key | 先 `duplicate:false`，再 `duplicate:true`；ext-b 为 `duplicate:false` | 6 / 7 |
| 7.4：先 ingress 键 `conv-x:k-9`，再 `spine.record` source=`voidinst`、conversation=`conv-x`、dedup_key=`k-9` | spine.record 返回 `duplicate:true` 和那条 **channel.message** 的 event_id，什么都没有写 | 7 / 8 |
| 7.5：不带 dedup_key 的 spine.record 两次 | 两条新事件 | 7 / 10 |

去重表的实际内容是 7 行，键为 `voidinst:msg-1`、`voidinst:cmd-1`、`voidinst:cmp-1`、`session.notify:"n-1"`、`ext-a:conv-1:r-1`、`ext-b:conv-1:r-1`、`voidinst:conv-x:k-9`。

## 调用顺序（trace）

- **首次 ingress：** `spineEventDedupStore#checkAndRecordDetailed → #record → writeIngressSnapshot → atomicAppendEvent`。键在 WAL 追加之前登记。
- **重复 ingress：** `#checkAndRecordDetailed → readEventById → readEventAtIndexedOffset → findOutboxRecordByEventId → loadOutboxByEventIndex`。在 void 会话上，最后一步因为 `by_event.jsonl` 不存在而以 ENOENT 失败，没有 `atomicAppendEvent`。重复请求时 `resolveIngressWorkspace` 和 `bindSessionSourceChannel` 仍然先运行，每次都会重写 `state.json`。
- **notify 首次：** `#get → deliverRouteEventToSession → atomicAppendEvent → writeVoidSessionOutboxRecord → deliverExternalSessionNotify>c → #record`。先投递，后登记。
- **notify 重复：** `#get → readEventById → replayIdempotentSessionNotify`。

## 判定

- **§5.3 键形式 `<source.kind>:<id>`，与内容无关，没有时间窗口：** confirmed。
- **§5.3 同种类的两个实例碰撞：** confirmed。B 的消息被静默丢弃，B 收到的是 A 的 event_id。
- **§5.3"返回 `deduplicated: true`、`enqueued: false` 和该记录的文字"：** 部分 refuted。这个标志只存在于内部返回值，`channel.ingress` 和 `channel.command` 的 RPC 结果里没有。调用方看到的就是同一个 event_id，与第一次的结果形状相同。对 void 会话，`gateway_response` 在重放时为空，即使第一次带有拒绝文字（5b），原因是 void 记录不在 by_event 索引里。
- **§5.3 session.notify：** confirmed。先只读查询，投递之后才登记；重复返回 `duplicate:true` 和相同的 `route_id`；换消息返回 `idempotency_conflict`。
- **§5.3 spine.record "按来源分开，不同来源互不影响"：** 对不同来源 confirmed。但文档没有写到：当 spine.record 的 `source` 等于某个渠道种类，且该渠道的 idempotency_key 恰为 `<conversation>:<dedup_key>` 时，两者在同一个键空间里碰撞（7.4）。保留来源名单不包含渠道种类，所以这种碰撞是可能的。
- **§14.2 第 2 项：** "每个键一行，不随尝试次数增长" confirmed；数周后的内存占用 inconclusive。

## 建议写入文档的句子

- **5.3：** 实测中，同一个幂等键重发 5 次只在 `var/registry/dedup.jsonl` 留下一行 `{key, ts, event_id}`、在 WAL 留下一条事件；重复请求经 `spineEventDedupStore (JR)` 命中后由 `readEventById (Oo)` 读回原事件，不调用 `atomicAppendEvent (tn)`。去重表随不同键的数量增长，不随尝试次数增长。
- **5.3 / 6.2：** `channel.ingress` 与 `channel.command` 的 RPC 结果不带去重标志，重复请求得到与第一次相同的 `event_id`；`gateway_response` 只在原事件有带 `in_reply_to_event_id` 的出站记录时才重放，void 会话的记录没有这个字段，所以重放为空（`appendBeforeExecuteGateway (yde)`、`findOutboxRecordByEventId (lh)`）。
- **5.3：** 键不区分方法，也不区分渠道实例：`channel.command` 与同一来源种类、同一幂等键的 `channel.message` 碰撞，命令不执行。
- **5.3：** `recordExternalSpineEvent (Eke)` 的键 `<source>:<conversation>:<dedup_key>` 与网关键 `<source.kind>:<idempotency_key>` 共用一个键空间；`source` 等于渠道种类、且该渠道的 idempotency_key 为 `<conversation>:<dedup_key>` 时，spine.record 返回那条渠道消息的 id 和 `duplicate: true`，什么都不写。
- **14.2 第 2 项：** 缩小为长期运行下的内存占用。
