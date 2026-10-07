# 02-rpc-catalog 实测结论

**结论**：分发函数识别的 36 个方法在运行中的重构 daemon 上逐个调用过，附录 B.2、B.3 的主张全部得到运行证据。本机 TCP 端口恰好放行 `system.status`、`usage.get`、`job.list`、`spine.tail`、`system.runtime.info`、`system.config` 六个方法；其余 30 个方法和未知方法名都以 HTTP 200、`-32601` "Method not available on read-only endpoint" 拒绝，B.3 里"六个方法名为未证实推测"一句可以改为 confirmed。§14.2 第 4 项列出的 `memory.read`、`spine.cat`、`spine.record` 三个方法已在 unix socket 上调用，返回与 6.1 的描述一致，这一项可以从 §14 删除。另有三处文档没有写到的行为：四个 pi worker 回调方法在 socket 上先检查口令，返回 `-32001`，而不是参数错误；`job.interrupt` 找不到 job 时返回 `-32011`；`dashboard` 不是 RPC 方法，只是 TCP 上的 HTTP 路由。

脚本：`reconstruction/scenarios/02-rpc-catalog.sh`。运行证据：`report.md`（每个 mark 一节调用树）、`rpc.jsonl`（116 条请求与响应）、`boot.log`、`http_routes.txt`、`tcp_reject_http_status.txt`、`after_shutdown.txt`、`events/`、`registry/`、`jobs/`。

## 1 被检验的主张

本节列出被检验的四条主张。

- **A（附录 B.2）**："`createDaemon (Svt)` 的分发函数按方法名逐个比较，识别下面 36 个方法，其余方法返回 `-32601`……处理函数抛出的参数错误返回 `-32602`"。
- **B（附录 B.3）**："本机 TCP 端口（默认 20233）只放行六个只读方法：`system.status`、`usage.get`、`job.list`、`spine.tail`、`system.runtime.info`、`system.config`；其他方法以 HTTP 200 返回 `-32601`，消息为 "Method not available on read-only endpoint"……六个方法名为未证实推测"。
- **C（§14.2 第 4 项）**："`memory.read`、`spine.cat`、`spine.record` 没有在运行中的 daemon 上调用过"。
- **D（§6.1、B.2 中三个外部方法的行为）**：`memory.read` "路径先按字面、再按 realpath 检查必须在记忆目录内，越界、不存在与目录都以 `-32602` 拒绝"；`spine.record` "`source` 是内部来源名或会话键前缀时……以 `reserved_source` 拒绝"；`spine.cat` "接受 `duoduo spine cat`/`show` 的过滤参数……返回渲染后的文本"。

## 2 步骤

脚本按下面的顺序执行。

1. 用 harness 在隔离 HOME 里启动插桩后的重构 daemon，TCP 端口 20302。另设 `ALADUO_WORK_DIR=<HOME>/work`：`channel.file.upload` 把文件存到工作目录的 `inbox/` 下，工作目录默认是 daemon 的当前目录，也就是 scratch 安装目录。
2. 阶段 A：对 36 个方法加上 `dashboard`、`no.such.method` 两个名字，各用 `{}` 参数在 TCP 上调用一次、在 socket 上调用一次。`system.shutdown` 的 socket 调用留到最后。
3. 阶段 B：在 socket 上用最小合法参数再调用一次。所用会话属于一个 runtime 为 `void` 的渠道（`channel.spawn` 建立 `scen:void-1`），所以任何调用都不会唤醒引擎。job 用 `cron: "0 0 1 1 *"` 创建，改期到 2099 年，最后归档。
4. 阶段 C：对 `spine.cat`、`memory.read`、`spine.record` 用合法参数在 TCP 上再调用一次；记录一次 TCP 拒绝的 HTTP 状态码；GET `/healthz`、`/readyz`、`/dashboard`。
5. 阶段 D：在 socket 上调用 `system.shutdown`，检查 daemon 进程是否退出。

## 3 观测到的证据

### 3.1 逐方法结果（附录 B.2 的实测列）

下表的"TCP `{}`"与"socket `{}`"两列是阶段 A 的结果，"socket 合法参数"一列是阶段 B 的结果；"处理函数"一栏是该方法在调用树里出现的函数，按首次进入的顺序列出，省略了分发函数的匿名闭包与日志函数。`内联` 表示处理逻辑写在分发函数里，调用树只显示它调用的函数。

| 方法 | TCP `{}` | socket `{}` | socket 合法参数 | 处理函数（trace） |
|---|---|---|---|---|
| `system.shutdown` | `-32601` | result `{ok:true}`，随后 daemon 退出 | — | 内联；之后 `main (kvt)` 的停机闭包依次停掉 job 调度器、会话管理器、出站投递、`createDaemon` 与写锁（`releaseRuntimeWriterLock (EO)`） |
| `system.runtime.info` | result | result | result（带 `source_kind` 时多 `channel_defaults`） | `isRuntimeInfoParams (rR)`、`isSystemRuntimeInfo (nR)`；带 `source_kind` 时再走 `resolveEffectiveChannelConfig` |
| `system.status` | result | result | — | `isSystemStatusParams ($R)`、`readRegistryStatusFile (Mb)`、`readPlaylistRound` |
| `system.config` | result | result | — | `isSystemConfigParams (CR)`、`buildSystemConfigReport (Jbt)`、`loadSubconsciousPartitions` |
| `channel.describe` | `-32601` | `-32602` | result | `describeChannelInstance (tvt)` |
| `channel.spawn` | `-32601` | `-32602` | result `{ok:true}` | `upsertChannelSpawnDescriptor (yvt)`、`ensureSessionDescriptorAndStateFiles` |
| `channel.ingress` | `-32601` | `-32602` | result `{event_id}` | `resolveIngressWorkspace (hIe)`、`bindSessionSourceChannel (pIe)`、`ingestChannelMessage (gde)`、`appendBeforeExecuteGateway (yde)`、`atomicAppendEvent (tn)`、`isVoidRuntimeSession (Gu)`、`writeVoidSessionOutboxRecord (wI)` |
| `channel.command` | `-32601` | `-32602` | result（`gateway_response` 为 `/status` 文本） | `bindSessionSourceChannel (pIe)`、`ingestChannelCommand (rv)`、`replyToGatewayCommandEvent (Net)` |
| `channel.file.upload` | `-32601` | `-32602` | result `{path,mime,name}` | 处理函数没有真名，调用树为空 |
| `channel.file.download` | `-32601` | `-32602` | result `{content_base64:"aGVsbG8K"}` | `isChannelFileDownloadParams (bR)`，其余没有真名 |
| `channel.pull` | `-32601` | `-32602` | result（含 ingress 写出的那条出站记录） | `readOutboxRecordsPastCursor (Yw)` |
| `channel.ack` | `-32601` | `-32602` | `-32602 Invalid cursor`（故意给错的游标） | `readOutboxRecord` |
| `session.list` | `-32601` | result `[]` | result（`deliverable:true`） | `listSessionIndexSummaries (oO)`、`filterDeliverableSessions (Olt)`、`evaluateNotifyConsumerRefusal (Ng)` |
| `session.archive` | `-32601` | `-32602` | result `{archived:true}` | `archiveSessionIfQuiescent (nvt)`、`archiveSessionAndArtifacts (hwe)` |
| `session.set_alias` | `-32601` | `-32602` | result | `setSessionAliasAndReindex (rvt)`、`updateSessionDisplayName (wce)` |
| `session.notify` | `-32601` | `-32602` | result `{ok:true,event_id}` | `deliverExternalSessionNotify (EIe)`、`evaluateNotifyConsumerRefusal (Ng)`、`deliverRouteEventToSession (As)`、`writeVoidSessionOutboxRecord (wI)` |
| `session.wake` | `-32601` | `-32602` | result `{ok:false,reason:"void_session"}` | `scheduleSessionWakeRecord (ovt)`、`isVoidRuntimeSession (Gu)` |
| `session.model` | `-32601` | `-32602` | result（`runtime:"void"` 与拒绝说明） | `readOrSetSessionModel (uvt)` |
| `session.effort` | `-32601` | `-32602` | result（同上） | `readOrSetSessionEffort (lvt)` |
| `session.compact` | `-32601` | `-32602` | result `{ok:false,reason:"void_session"}` | `enqueueSessionCompactCommand (cvt)`、`isVoidRuntimeSession (Gu)` |
| `session.config` | `-32601` | `-32602` | result（`verb:"get"`） | `applySessionConfigVerb (fvt)` |
| `job.create` | `-32601` | `-32602` | result `{id,cron}` | 内联：`validateJobScheduleExpression (J_e)`、`buildJobSessionKey`、`renderJobFileMarkdown`、`createSpineEvent (en)`、`atomicAppendEvent (tn)` |
| `job.get` | `-32601` | `-32602` | result | 内联：`parseJobFileFrontmatter`、`redactJobModelProfileTokens` |
| `job.list` | result `{jobs:[]}` | result | — | 内联：`isJobListParams (RR)` |
| `job.archive` | `-32601` | `-32602` | result `{archived:true}` | 内联：`moveSessionDirToArchive (Ob)` |
| `job.reschedule` | `-32601` | `-32602` | result `{run_at:"2099-01-01T00:00:00.000Z"}` | 内联：`parseJobRearmTime (Lw)` |
| `job.interrupt` | `-32601` | `-32602` | `-32011 Job 'no-such-job' not found` | 内联 |
| `job.manage` | `-32601` | `-32001 job.manage requires a pi worker token` | — | 内联口令检查，未进入工具体 |
| `session.manage` | `-32601` | `-32001` | — | 同上 |
| `notify.send` | `-32601` | `-32001` | — | 同上 |
| `wake.set` | `-32601` | `-32001` | — | 同上 |
| `usage.get` | result `{sessions:{}}` | result | result（`mode:"totals"`） | `readAllSessionSummaries (dq)`；`mode:"totals"` 时 `readGlobalUsageTotals (fq)` |
| `spine.tail` | result | result | result | `isSpineTailParams (OR)`、`readSpineTail (wwe)`、`readPartitionTail (vwe)` |
| `spine.cat` | `-32601` | `-32602`（"unfiltered day read…"） | result `{text}` | `runSpineCatRpc (xke)`、`describeSpineCatProblem (rU)`；渲染函数没有真名 |
| `spine.record` | `-32601` | `-32602`（Missing key "source"） | result `{ok:true,event_id,ts,duplicate:false}`；`source:"runner"` 时 `{ok:false,reason:"reserved_source"}` | `recordExternalSpineEvent (Eke)`、`describeSpineRecordProblem (iU)`、`checkReservedRecordSource (Dpt)`、`createSpineEvent (en)`、`computeDedupKey (GR)`、`atomicAppendEvent (tn)` |
| `memory.read` | `-32601` | `-32602`（Missing key "path"） | 见 3.3 | `readMemoryFileForRpc (QSe)`、`describeMemoryReadProblem (nU)` |
| `dashboard`（不是方法） | `-32601` | `-32601 Method not found` | — | 无 |
| `no.such.method` | `-32601` | `-32601 Method not found` | — | 无 |

### 3.2 只读 TCP 端口

在 TCP 上，阶段 A 的 38 个名字里只有六个返回 result：`system.runtime.info`、`system.status`、`system.config`、`job.list`、`usage.get`、`spine.tail`。其余 30 个方法和两个未知名字都返回同一条错误：

```json
{"jsonrpc":"2.0","id":29366,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}
```

阶段 C 用合法参数在 TCP 上调用 `spine.cat`、`memory.read`、`spine.record`，结果仍是这条错误，说明拒绝发生在参数检查之前。被拒绝的调用在调用树里只有 `isJsonRpcRequest` 与 `logWarnMessage (Z)` 两个函数，`boot.log` 里对应一行 `[daemon] rejected write method on read-only port { method: 'spine.cat', … }`。`tcp_reject_http_status.txt` 记录拒绝时的 HTTP 状态码为 `200`。TCP 上的未知方法名得到的是只读拒绝消息，不是 "Method not found"：放行集合的检查在分发之前。三个 HTTP 路由的结果是 `/healthz` 200 `{"status":"ok"}`、`/readyz` 200 `{"status":"ok"}`（调用树里有 `probeEventsAppendable (_de)`）、`/dashboard` 200 `text/html`。

### 3.3 三个外部方法

`memory.read` 在 socket 上的五次调用结果如下。

```text
{"path":"CLAUDE.md"}     -> {"path":"CLAUDE.md","text":""}
{"path":"scen-note.md"}  -> {"path":"scen-note.md","text":"scenario note\n"}
{"path":"../config"}     -> -32602 "\"../config\" is outside duoduo's memory"
{"path":"missing.md"}    -> -32602 "No file memory/missing.md"
{"path":"link-out"}      -> -32602 "\"link-out\" is outside duoduo's memory"   (memory/link-out 是指向 /etc/hostname 的符号链接)
```

符号链接一例的字面路径在记忆目录内，被拒绝的原因只能是 realpath 检查。目录一例没有测。

`spine.record` 的合法调用返回 `{"ok":true,"event_id":"evt_2883073e-…","ts":"…","duplicate":false}`，`source:"runner"` 返回 `{"ok":false,"reason":"reserved_source","message":"\"runner\" is one of duoduo's internal sources (cadence, meta, system, runner, route, gateway), which duoduo never learns from. Nothing was recorded. …"}`。`spine.cat` 不带过滤参数时以 `-32602` 拒绝，消息是 "error: unfiltered day read; add a session/type/kind/time filter or pass --unfiltered"；带 `unfiltered:true, count_only:true` 时返回 `{text}`，内容是 `duoduo spine cat` 的表头与 `END spine` 结尾行。

### 3.4 system.shutdown

socket 上的 `system.shutdown` 返回 `{"ok":true}`，daemon 进程随后退出（`after_shutdown.txt` 为 `exited`）。TCP 上的同一调用以 `-32601` 拒绝。

## 4 判定

| 主张 | 判定 | 理由 |
|---|---|---|
| A：36 个方法、未知名返回 `-32601`、参数错误返回 `-32602` | confirmed | 36 个方法在 socket 上都有非 "Method not found" 的响应；`dashboard`、`no.such.method` 得到 `-32601 Method not found`；有参数检查的方法用 `{}` 调用时都返回 `-32602` |
| B：TCP 只放行六个方法，其余以 HTTP 200、`-32601` 拒绝 | confirmed | 恰好六个返回 result，名单与 B.3 相同；拒绝的 HTTP 状态码为 200，消息与文档一致 |
| C：三个方法从未在运行中的 daemon 上调用 | 已解决（不再成立） | 本场景在 socket 上调用了三个方法，并在 TCP 上确认它们被拒绝 |
| D：memory.read 的字面路径检查与 realpath 检查、`-32602` | confirmed（目录一例未测） | `../config` 与符号链接两例都返回 "is outside duoduo's memory"，缺失文件返回 "No file …" |
| D：spine.record 拒绝内部来源名 | confirmed | `runner` 返回 `reserved_source`，没有写事件；会话键前缀的拒绝见 09 场景 |
| D：spine.cat 返回渲染后的文本 | confirmed | 返回 `{text}`；不带过滤时以 `-32602` 拒绝 |
| 附加：pi worker 回调方法在没有口令时返回 `-32001` | confirmed（文档写了"只接受带有效 worker 口令的调用"，没有写错误码） | 四个方法都返回 `-32001 <method> requires a pi worker token` |

## 5 建议的文档句子

- 附录 B.3 末句改为："运行中的 daemon 上，经 TCP 调用全部 36 个方法与未知方法名，只有这六个返回结果，其余都以 HTTP 200 返回 `-32601` "Method not available on read-only endpoint"，合法参数也一样，所以放行检查发生在参数检查之前（confirmed，场景 02-rpc-catalog；集合本身仍是没有真名的模块级常量，拒绝逻辑见 `createDaemon (Svt)`）。"
- §14.2 第 4 项删除，或改为："36 个方法都已在运行中的 daemon 上调用过（场景 02-rpc-catalog）：经 unix socket 的调用到达 B.2 所列的处理函数，经只读 TCP 端口的调用除六个放行方法外都返回 `-32601`。"
- 附录 B.2 表后补一句："没有 pi worker 口令时，`job.manage`、`session.manage`、`notify.send`、`wake.set` 在 unix socket 上返回 `-32001`（"<method> requires a pi worker token"），不进入工具体；`job.interrupt` 找不到 job 时返回 `-32011`（confirmed，场景 02-rpc-catalog）。"
- 6.1 `memory.read` 一句后补："运行中的 daemon 上，指向记忆目录外的符号链接以 "is outside duoduo's memory" 拒绝，与 `../` 越界的拒绝消息相同，说明 `readMemoryFileForRpc (QSe)` 的 realpath 检查生效（confirmed）。"
- 6.1 `system.shutdown` 一句可补："`system.shutdown` 先返回 `{ok:true}`，随后由 `main (kvt)` 的停机流程依次停止 job 调度器、会话管理器、出站投递与监听器并释放写锁（confirmed，场景 02-rpc-catalog）。"
