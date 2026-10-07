# 09-spine-redaction 实测结论

**结论**：`spine.cat` 的 `redact: "external"` 在运行中的 daemon 上的行为与 §6.1 的描述一致。渠道会话里的 `channel.message`、`agent.result`、`external.record` 原样保留；`route.deliver` 只在来源事件类型是 `external.notify` 或目标是 void 会话时原样保留，否则只剩事件头；`channel.command`、`config.changed` 只剩事件头 `{id, ts, type, source:{kind}, session_key}`；没有会话键的 `job.spawn` 被丢弃。§6.1 里"原样保留的类型集合……属未证实推测"一句，其中三个类型现在有运行证据。§5.1 的两次写也得到确认：13 条事件对应 13 行 WAL 和 13 行 by_id 索引，每条索引的 `byte_offset`/`byte_len` 都恰好切出同 id 的 WAL 行。

本场景还发现一处文档没有写到、对外部读者有影响的行为：只读 TCP 端口放行的 `spine.tail` 返回完整的原始事件，不做任何脱敏。脱敏只存在于 `spine.cat`，而 `spine.cat` 只能经 unix socket 调用。所以本机任何能连 127.0.0.1 的进程，都能经 `spine.tail` 读到 `redact: "external"` 隐去的全部内容，包括 notify 正文、`external.record` 的 payload 和入站快照路径。另有两个次要现象：`spine.cat` 的 `show` 遇到被脱敏丢弃的事件时返回 `-32603 Internal error`，而不是 `-32602`；`spine.record` 不可能写出非渠道会话键的事件。

脚本：`reconstruction/scenarios/09-spine-redaction.sh`。运行证据：`redaction_table.txt`（每条事件在 show 明文与 show 脱敏下的对照）、`show_pairs.jsonl`（两次 show 的原始响应）、`cat_plain.json`、`cat_redacted.json`、`cat_plain_count.json`、`cat_redacted_count.json`、`tail_tcp.json`、`events/`（WAL 与 `index/by_id.jsonl`）、`wal_check.txt`、`append_tree.txt`、`dedup.jsonl`、`outbox/`、`sessions/`、`report.md`、`rpc.jsonl`、`boot.log`。

## 1 被检验的主张

- **A（§6.1）**："参数 `redact: "external"` 时先用 `listVoidChannelSessions (nde)` 找出全部 void 渠道会话，再给每条事件套上脱敏函数 `redactSpineEventForExternal (Npt)`。脱敏函数对 `body.mail` 事件一律原样保留，其余事件不属于渠道会话时丢弃；渠道会话的 `channel.message`、`agent.result`、`body.experience`、`external.record` 原样保留，`route.deliver` 只在来源事件类型是 `external.notify` 或目标是 void 会话时原样保留，工具调用与工具结果只保留工具名和是否出错，其余事件只保留 id、时间、类型、来源种类和会话键（`stripSpineEventToEnvelope (Ske)`）。……原样保留的类型集合……仍是静态阅读所得（未证实推测）。"
- **B（§6.1、附录 B.1）**：`spine.record` "追加一条 `external.record` 事件，会话键为 `<source>:<conversation>`，只写事件日志，不写邮箱指针、不唤醒任何会话；`source` 是 duoduo 自己的内部来源名……或是保留给会话键的前缀……时……以 `reserved_source` 拒绝，什么都不写；给出 `dedup_key` 时……重复的调用返回第一次的 `event_id` 与 `ts` 并带 `duplicate: true`"。
- **C（§5.1）**："一条事件落库由 `atomicAppendEvent (tn)` 完成，它恒定执行两次追加：先把事件写成分区文件 `var/events/YYYY-MM-DD.jsonl` 的一行……再把 `{event_id, partition, byte_offset, byte_len}` 追加进 `var/events/index/by_id.jsonl`"。
- **D（§5 开头）**："去重只认调用方提供的幂等键，渠道消息、`spine.record` 与 `session.notify` 共用一个去重表"。
- **E（附录 B.3、§6.1 表格）**：本机 TCP 端口是"只读"端口，放行 `spine.tail`。文档没有说明 `spine.tail` 是否脱敏。本场景把它作为待查项。

## 2 步骤

所有写操作都经 unix socket 执行，任何一步都不调用模型。

1. 启动隔离 daemon（TCP 端口 20309，`ALADUO_WORK_DIR=<HOME>/work`）。
2. 用 `channel.spawn` 建两个渠道会话。`scen:void-1` 属于 runtime 为 `void` 的渠道 `voidch`。`scen:pi-1` 属于 runtime 为 `pi` 的渠道 `pich`；隔离 HOME 里没有配置 pi 模型，所以它的 drain 在启动引擎之前就被拒绝。
3. 写事件：
   - 向 void 会话 `channel.ingress` 一条消息，正文含 `SECRET-INGRESS`，幂等键为 `ing-1`。
   - 向 void 会话发 `channel.command` `/status`。
   - 用 `spine.record` 写 `source:"myapp"`；再带 `dedup_key:"d1"` 写两次。
   - 用 `spine.record` 试 `cadence`、`system`、`job`、`subconscious` 四个保留来源，再试含 `:` 的 conversation。
   - 发四条 `session.notify`：外部 → void、`caller_session=scen:pi-1` → void、`caller_session=scen:void-1` → pi、外部 → pi。
   - 对 void 会话执行 `session.config set`。
   - `job.create` 一个远期 job，然后 `job.archive`。
4. 等 3 秒，让 pi 会话的 drain 结束。
5. 在 socket 上读回：先读整天的 `spine.cat {unfiltered, json}`，明文与 `redact:"external"` 各一次；再读两种 `count_only`；然后对 WAL 里的每个 id 调用 `spine.cat {show:<id>, date}`，明文与脱敏各一次。
6. 在 TCP 上调用 `spine.cat`（带 `redact`）和 `spine.tail {limit:100}`。
7. 保存 WAL、索引、去重表、outbox、sessions。用脚本内的 node 校验每条索引的偏移是否切出同 id 的 WAL 行，并从 trace 里取出一次 `atomicAppendEvent` 之下的调用顺序。

## 3 观测到的证据

### 3.1 逐事件的脱敏结果（`redaction_table.txt`）

下表是 WAL 中 13 条事件在 `spine.cat show` 明文与脱敏下的对照。"source_event_type"一列取自 `payload.source_event_type`。

| 类型 | 会话键 | source.kind | source_event_type | 脱敏结果 |
|---|---|---|---|---|
| `channel.message` | `scen:void-1` | `rpc` | — | 原样保留 |
| `channel.command` | `scen:void-1` | `rpc` | — | 只剩事件头 |
| `agent.result`（网关 `/status` 回复） | `scen:void-1` | `gateway` | — | 原样保留 |
| `external.record` | `myapp:c1` | `myapp` | — | 原样保留 |
| `external.record`（带 dedup_key） | `myapp:c1` | `myapp` | — | 原样保留 |
| `route.deliver`（外部 notify → void） | `scen:void-1` | `route` | `external.notify` | 原样保留 |
| `route.deliver`（pi-1 → void） | `scen:void-1` | `route` | `notify` | 原样保留（目标是 void 会话） |
| `route.deliver`（void-1 → pi） | `scen:pi-1` | `route` | `notify` | 只剩事件头 |
| `agent.result`（pi 拒绝） | `scen:pi-1` | `runner` | — | 原样保留 |
| `route.deliver`（外部 notify → pi） | `scen:pi-1` | `route` | `external.notify` | 原样保留 |
| `agent.result`（pi 拒绝） | `scen:pi-1` | `runner` | — | 原样保留 |
| `config.changed` | `scen:void-1` | `rpc` | — | 只剩事件头 |
| `job.spawn` | 无 | `job` | — | 丢弃 |

"只剩事件头"的实际内容如下，五个字段与 `stripSpineEventToEnvelope (Ske)` 的函数体一致，`source.name` 与 `source.channel_id` 都被去掉：

```json
{"id":"evt_8da442bc-…","ts":"2026-10-07T16:07:05.396Z","type":"channel.command","source":{"kind":"rpc"},"session_key":"scen:void-1"}
```

被丢弃的 `job.spawn` 在脱敏 show 下返回：

```json
{"code":-32603,"message":"Internal error","data":"Error: Event evt_e4a9d6e1-… not found in 2026-10-07."}
```

脱敏 show 这一节的调用树依次出现 `runSpineCatRpc (xke)`、`listVoidChannelSessions (nde)`、`redactSpineEventForExternal (Npt)`、`shouldKeepRouteDeliverEvent (Apt)`、`stripSpineEventToEnvelope (Ske)`。整天读取的计数也一致：明文 `raw_events=13 · sessions=4 · source_kinds=job,myapp,rpc`，脱敏 `raw_events=12 · sessions=3 · source_kinds=myapp,rpc`，差的正是那条 `job.spawn`。

### 3.2 只读 TCP 端口上的读取

TCP 上的 `spine.cat`（带 `redact:"external"`）返回 `-32601 Method not available on read-only endpoint`。TCP 上的 `spine.tail {limit:100}` 返回全部 13 条原始事件，字段与 WAL 行相同。在 `tail_tcp.json` 中能找到全部七个标记串：`SECRET-DEDUP SECRET-INGRESS SECRET-NOTIFY-EXT-PI SECRET-NOTIFY-EXT-VOID SECRET-NOTIFY-PI-TO-VOID SECRET-NOTIFY-VOID-TO-PI SECRET-RECORD`。其中 `SECRET-NOTIFY-VOID-TO-PI` 在脱敏输出里只剩事件头。例如 TCP `spine.tail` 返回的这条 `route.deliver`：

```json
{"type":"route.deliver","source":{"kind":"route","name":"notify-tool"},"session_key":"scen:pi-1","payload":{"route_id":"session-notify-…","source_session_key":"scen:void-1","source_event_type":"notify","payload":{"notify_content":"SECRET-NOTIFY-VOID-TO-PI","text":"SECRET-NOTIFY-VOID-TO-PI","notify_source_kind":"channel","notify_source_session_key":"scen:void-1"}},"id":"evt_3a3539e9-…","ts":"…"}
```

TCP 上的 `spine.tail` 调用树只有 `isSpineTailParams (OR)`、`readSpineTail (wwe)`、`readPartitionTail (vwe)` 与分块读取函数，没有经过任何脱敏函数。

`cat_plain.json` 与 `cat_redacted.json` 中都只出现 `SECRET-INGRESS`。`spine.cat --json` 的行是渲染后的行（`{ts,type,session_key,id,text}`），`route.deliver` 和 `external.record` 的行在明文模式下也没有正文。所以字段级的对照要用 `show`，不能用 `--json` 行。

### 3.3 spine.record

- `myapp`/`c1` 写出 `external.record`，会话键为 `myapp:c1`，`source.kind` 为 `myapp`。
- 同一 `dedup_key` 的第二次调用返回第一次的 `event_id` 与 `ts`，并带 `"duplicate":true`；WAL 中只有一条，payload 是第一次的 `SECRET-DEDUP`。
- `cadence`、`system` 返回 `reserved_source`，消息为 "is one of duoduo's internal sources"。
- `job`、`subconscious` 返回 `reserved_source`，消息为 "it begins duoduo's session keys"。
- `conversation:"a:b"` 返回 `-32602`，消息为 `conversation "a:b" has a space or ':'`。

这几个结果合起来说明 `spine.record` 写不出非渠道会话键。`classifySessionKeyKind (_n)` 只把 `meta:`、`cadence:`、`subconscious:`、`system:`、`job:` 开头的键归为非渠道。这五个前缀对应的来源名全部在两张保留名单里，所以会话键 `<source>:<conversation>` 总被归为 `channel`，`external.record` 在脱敏时总是原样保留。本场景要求的"非渠道会话键事件"因此改用 `job.create` 写出的 `job.spawn` 检验，它没有会话键，覆盖的是 `e.session_key === void 0` 一支；带 `job:`、`system:` 等前缀会话键的事件，没有模型就无法产生，这一支没有测到。

### 3.4 两次写与去重表

`wal_check.txt` 的内容：

```text
partitions=2026-10-07.jsonl wal_lines=13 index_lines=13 index_keys=event_id,partition,byte_offset,byte_len
index entries resolving to a WAL line with the same id: 13, mismatched: 0
```

`append_tree.txt` 记录 `record myapp` 一步里 `atomicAppendEvent (tn)` 之下的调用顺序：先进入 `appendEventToPartition (W8e)`，经 `enqueuePartitionAppend (B8e)` 写分区文件；之后进入 `appendEventIdIndexEntry (J8e)`，写入 `{"event_id":"evt_ccbe21c9-…","partition":"2026-10-07.jsonl","byte_offset":1375,…}`。trace 把第二个调用嵌在第一个调用下面，这是异步调用的父子归属误差。`atomicAppendEvent` 的函数体是先 `await appendEventToPartition(e, t)`、再 `await appendEventIdIndexEntry(e, {...})`，与调用顺序一致。

`dedup.jsonl` 有两行，渠道入站与 `spine.record` 写在同一个文件里：

```text
{"key":"rpc:ing-1","ts":"…","event_id":"evt_c30ba46d-…"}
{"key":"myapp:c1:d1","ts":"…","event_id":"evt_53cd959a-…"}
```

本场景的 `session.notify` 没有带 `idempotency_key`，所以第三类键没有出现。

### 3.5 旁证

void 会话的入站消息与发往 void 会话的 notify，调用树里都有 `writeVoidSessionOutboxRecord (wI)`，没有邮箱写入函数；发往 pi 会话的 notify 响应带 `mailbox_path`。pi 会话没有配置模型，它的 drain 写出 `agent.result`（`source.kind:"runner"`），正文为 "This pi session has no model yet. Request was not executed."，写出的事件类型不是 `agent.error`。

## 4 判定

| 主张 | 判定 | 理由 |
|---|---|---|
| A：`channel.message`、`agent.result`、`external.record` 原样保留 | confirmed | show 明文与脱敏完全相同 |
| A：`body.experience`、`body.mail` 原样保留 | inconclusive | 没有模型时无法写出这两类事件 |
| A：`route.deliver` 的两个保留条件 | confirmed | `external.notify` 到非 void 会话保留；`notify` 到 void 会话保留；`notify` 到非 void 会话只剩事件头 |
| A：工具事件只保留工具名与是否出错 | inconclusive | 没有模型时不产生 `agent.tool_use`、`agent.tool_result` |
| A：其余渠道会话事件只剩事件头 | confirmed | `channel.command`、`config.changed` 只剩 `{id,ts,type,source:{kind},session_key}` |
| A：不属于渠道会话的事件丢弃 | 部分 confirmed | 没有会话键的 `job.spawn` 被丢弃；带非渠道前缀会话键的事件没有产生 |
| A：原样保留集合"未证实推测" | 可改为部分 confirmed | 集合中三个成员有运行证据，另两个没有 |
| B：`external.record`、会话键、保留来源、dedup | confirmed | 见 3.3；补充：`spine.record` 写不出非渠道会话键 |
| C：两次写，索引四个字段指向 WAL 行 | confirmed | 13/13 条匹配，调用顺序为先 WAL 后索引 |
| D：渠道消息与 `spine.record` 共用去重表 | confirmed（`session.notify` 部分未测） | 两类键都在 `var/registry/dedup.jsonl` |
| E：只读 TCP 端口不泄露事件正文 | refuted（文档未断言，但"只读"容易被读成"可以对外"） | `spine.tail` 在 TCP 上返回全部原始事件，不脱敏 |

## 5 建议的文档句子

- §6.1 脱敏一段末尾，把"原样保留的类型集合……仍是静态阅读所得（未证实推测）"改为："运行中的 daemon 上，渠道会话里的 `channel.message`、`agent.result`、`external.record` 经 `redactSpineEventForExternal (Npt)` 原样返回；`route.deliver` 在来源事件类型为 `external.notify` 或目标为 void 会话时原样返回，否则与 `channel.command`、`config.changed` 一样只剩 `stripSpineEventToEnvelope (Ske)` 给出的 `{id, ts, type, source:{kind}, session_key}`；没有会话键的 `job.spawn` 被丢弃（confirmed，场景 09-spine-redaction）。`body.experience`、`body.mail` 与工具事件需要模型才能产生，仍是静态阅读所得（未证实推测）。"
- §6.1 只读 TCP 端口一处补一句："只读端口不脱敏：它放行的 `spine.tail` 由 `readSpineTail (wwe)` 直接返回事件日志中的原始事件，包括 notify 正文、`external.record` 的 payload 与入站快照路径；`redact: "external"` 只在 `spine.cat` 上有效，而 `spine.cat` 只能经 unix socket 或远程监听调用。所以本机任何能连到 `127.0.0.1` 的进程都能读到脱敏要隐去的内容（confirmed，场景 09-spine-redaction）。"
- §6.1 `spine.record` 一句后补："由于 `classifySessionKeyKind (_n)` 认作非渠道的五个会话键前缀全在 `initProtocolSystemModule (oU)` 的两张保留名单里，`spine.record` 写出的会话键总被归为渠道会话，`external.record` 在 `redact: "external"` 下总是原样返回（confirmed）。"
- §5.4 或附录 B.2 `spine.cat` 一行补："`show` 指定的事件不存在、或被 `redact: "external"` 丢弃时，RPC 返回 `-32603 Internal error`，`data` 为 "Event <id> not found in <date>."，而不是参数错误 `-32602`（confirmed，场景 09-spine-redaction）。"
- §5.1 证据表"单条追加恒定两次写"一行的置信可补运行证据："运行中的 daemon 上 13 条事件对应 13 行 WAL 与 13 行 by_id 索引，每条索引的 `byte_offset`/`byte_len` 都切出同 id 的 WAL 行；调用顺序为 `appendEventToPartition (W8e)` 后 `appendEventIdIndexEntry (J8e)`（场景 09-spine-redaction）。"
- §5 开头"共用一个去重表"后可补："运行中的 daemon 上，渠道入站的键为 `<source_kind>:<idempotency_key>`（如 `rpc:ing-1`），`spine.record` 的键为 `<source>:<conversation>:<dedup_key>`（如 `myapp:c1:d1`），两者写在同一个 `var/registry/dedup.jsonl` 里（confirmed）。"
