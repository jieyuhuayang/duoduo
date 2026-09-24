# duoduo 运行时内部机制（v0.8.3 证据文档）

> **对齐版本**：`@openduo/duoduo` v0.8.3（npm 运行时）。
> **证据来源**：还原源码 [`reconstruction/recon/daemon.recon.js`](../reconstruction/recon/daemon.recon.js) 及其符号索引；同一版本 npm 包内的 `bootstrap/` 提示词与仓库里的 `subconscious/`、`skills/`；少数注明之处来自运行中 daemon 的观测。取证方法与置信标注见"证据约定"。
> **姊妹文档**：[`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md) 是写给产品经理的入门，节的顺序与本文一致，它的附录 C 把每一节对应到本文的证据节；[`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md) 讲部署与运维；[`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md) 讲压缩 bundle 如何还原成可证明等价的源码；还原产物、符号索引与改名表在 [`../reconstruction/`](../reconstruction/)。

## 结论

**duoduo 是一个让大语言模型无人值守持续运行的程序；模型自身做不到的事（保存状态、调度、并发、边界检查）由运行时代码完成，需要判断的事交给模型。本文是写给工程师的证据文档：每个子系统一节，每条机制主张都按名字指出实现它的代码，并标 `confirmed` 或 `未证实推测`。**

下表按本文的节顺序列出每个子系统里代码负责什么、交给模型什么；最后一列是 GUIDE 里讲同一机制的节。

| 子系统 | 代码负责什么 | 交给模型什么 | 本文节 | GUIDE 节 |
|---|---|---|---|---|
| 端到端路径 | 把一条外部消息依次封装成事件、追加进事件日志、写邮箱指针、唤醒会话、装配上下文、调用引擎，并把执行过程记回日志 | 这一轮的推理、工具调用与回复 | 1 | 0.2、2.1、2.5 |
| 系统提示装配 | 按固定顺序拼接六层文本，展开记忆板的 `@include`，每轮生成瞬时块；四个引擎拿到同一段文本 | 读这些文本并据此行动；记忆板的正文由后台分区里的模型写 | 2 | 1.3、2.4 |
| 引擎 | 四值枚举与默认值；先绑定引擎再探测，不可用或与历史所属引擎不符时拒绝执行；同名命令按引擎实现；权限、工具白名单与认证 | 工具执行循环本身（读写文件、运行命令）由引擎内的模型驱动 | 3 | 1.2、1.4、1.5、1.7、5.1、5.3 |
| 自操作工具 | 注册六个工具，按会话来源分配，校验参数，执行投递、拒投与 Skip 的收尾 | 何时创建 job、通知谁、给自己预约哪一轮、是否跳过这一轮 | 4 | 1.6 |
| 事件日志 | 追加 WAL 行与 by_id 索引，按幂等键去重，按 id 读回，重启后按邮箱指针恢复待处理的会话 | 无 | 5 | 2.1、2.5、5.4 |
| 网关与控制面 | 三个监听器的访问控制，入站分流与网关命令，出站拉取、订阅与能力协商，重启原因文件 | 路由到会话的消息如何回复 | 6 | 2.1、2.5、5.1 |
| Drain 与 turn 控制 | 切窗口与合并，单 turn 准入与插话，三个抢占边界，失败收敛为一条回复加一条 `agent.error` | 合并后一次 turn 的回复，以及插话进来的消息如何接续 | 7 | 1.1、2.2、2.3、5.2、5.3、5.4 |
| 会话 actor、锁与并发池 | 一个会话键至多一个 actor，进程写锁与按会话键的异步互斥，两个并发池，空闲回收，前缀隔离与收尾再校验 | 无 | 8 | 2.2、2.3、5.1、5.3 |
| 渠道适配器 | 适配器进程由 CLI 安装与启动；协议方法；飞书的会话键派生、准入、@ 过滤、进度卡与表情回应 | 无 | 9 | 2.6 |
| job 调度 | 60 秒扫描，创建校验，认领与六种结束状态的结算，结果投递给 owner | 执行任务书，以及 owner 收到失败通知后如何处置 | 10 | 3.1 |
| 心跳与后台分区 | 心跳定时器与确定性维护，跳过条件，轮转表，一次性分区会话，三处代码强制的检查，出厂初始化与分区退休 | 每个分区会话里的判断和文件修改 | 11 | 3.2、3.3、4.2、4.8、5.1、5.2、5.3 |
| 记忆系统 | 以记忆板为根的可达性计算，只读检查与任务单投递，默认关闭的遗忘 GC | 碎片、效果记录、记忆板与档案的全部改写 | 12 | 4.1、4.3、4.4、4.5、4.7、5.1 |
| 指令指纹与改动生效 | 每次 drain 前算指纹与记忆板哈希，按引擎决定重建流式进程、fork 线程或沿用 | 无 | 13 | 4.6 |

表中两列的分界就是全文反复用到的分工规则：确定性的事交给代码：存储、排序、调度、并发、测量、校验。需要判断的事交给模型：推理、写作、决定记住什么、决定改什么。按这条规则，代码强制的检查集中在几处：3.7（权限与工具白名单）、4.2 与 4.3（ManageJob 的创建条件与 Notify 的拒投）、6.1（监听器的访问控制）、8.2 与 8.5（进程写锁与会话 RPC 的前缀隔离）、11.4（契约过滤、分区工具白名单与分区会话没有 ManageJob）、12.3（遗忘 GC 的条件）；后台分区可以改什么、不能碰什么的其余边界只写在提示词里，由模型遵守（11.4）。第 14 节列出仍需实测的开放项。

## 证据约定

本文的证据来自三处，置信只分两档，引用只有两种写法，流水线的计数不在正文里重复。

**证据来源。**

1. **还原源码。** 运行时以压缩 JavaScript 发布。[`reconstruction/`](../reconstruction/) 把 daemon bundle 还原成可读源码 `reconstruction/recon/daemon.recon.js`，它与发布的 bundle 在改名映射下 AST 全等，证明方法见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md)。真名来自 esbuild 的 `__export` 表，或是登记在 `reconstruction/maps/inferred_daemon.json` 里的推断名；短名是美化后的 bundle（`daemon.pretty.js`、`cli.pretty.js`）里的 mangled 名，文中代码片段按这个拼写写；cli bundle 里的符号写作 `cli:真名`。`pi-worker.js` 与 `feishu-gateway.js` 不在流水线覆盖范围内，没有真名，它们的字符串字面量以普通引号写出，并注明"pi-worker.js 字面量"或"feishu-gateway.js 字面量"。npm 依赖 `@openduo/protocol` 以 TypeScript 源码发布，引用时写出源文件名。
2. **提示词原文。** 包内 `bootstrap/` 下的身份提示、种类配置与出厂分区，仓库里的 `subconscious/`、`skills/`，以及上游 `CHANGELOG.md`。CHANGELOG 与代码不一致时以代码为准。
3. **运行中 daemon 的观测。** 只在注明之处使用。例如在隔离的 `HOME` 下分别启动发布的 daemon 与还原源码，只读 TCP 端口对 `system.status` 返回结果、对 `session.list` 返回 `-32601`，两者输出相同。

**置信标注。**

- `confirmed`：对照代码或提示词原文确认过，主张的核心由可检查的引用或提示词原文直接支撑。只能在没有真名的函数里读到的细节，在括注或证据表的置信栏里单独注明。`confirmed（静态阅读）` 表示代码路径已读通、没有运行。随包的第三方库（例如 MCP SDK）不在命名范围内，从中读到的行为也标 `confirmed（静态阅读）` 并写明库名。
- `未证实推测`：同时写明缺什么证据。常见的有三种：支撑主张核心的代码只在没有真名的函数里，已在 pretty bundle 读到，但构建检查核对不到；行为取决于 bundle 之外的程序（Claude Code、Agent SDK、Codex、Grok CLI、pi SDK）；需要在运行中的实例上观测。第 14 节汇总这三种里仍待验证的项。
- 否定性证据：一个"没有某种机制"的结论，写成 bundle 中的零命中或某函数体内没有某项读取，例如 bundle 中 `by_session` 零命中。

**引用写法。** 只有两种，都由构建检查：

- `` `真名 (短名)` ``：指出一个符号，例如 `atomicAppendEvent (on)`；`verify_citations.mjs` 检查真名存在、短名正确。
- `` `代码片段`（`真名`） ``：表示这句代码就是证据，例如 `stage: "runtime_mismatch"`（`drainSessionMailbox`）；`check_bare_anchors.mjs` 检查片段里有辨识度的字面量或标识符、以及片段调用的每个短名，都落在该符号当前的声明范围内。

本文不写行号。两种写法与文档维护规则的完整说明见 [`README.md` 末尾的维护约定](./README.md)。每节正文只放一两处关键引用，其余引用放在该节末尾的证据表里，表头为"机制主张 / 代码证据 / 置信"。

**计数。** 流水线的数字（恢复了多少真名、多少处改名、AST 节点数）以 [`reconstruction/maps/pipeline_report.json`](../reconstruction/maps/pipeline_report.json) 为准，正文不重复。运行时自身的参数（默认值、上限、超时）在正文写出数值并给出代码证据。短名与真名的完整对照见附录 A。

## 1 端到端路径

一条外部消息先封装成事件、追加进事件日志、写邮箱指针、唤醒会话；会话按指针读正文、装配上下文、调用引擎，把工具调用和结果写回日志；心跳触发的后台分区再把经验写回记忆板，下一次装配时读入。这条路径可以分成五段，每段由一节展开：入站与分流（第 6 节）、落库（第 5 节）、会话执行（第 2、3、7、8 节）、出站（第 6.3 节）、后台加工（第 11、12 节）。本节只给出全貌和每一步的代码位置，机制细节以对应各节为准。

### 1.1 路径图

图中是一条经 `channel.ingress` 进入、被路由到会话的普通消息；网关命令在第 ⑤ 步分出，不进入第 ⑦ 步以后的会话执行。

```
渠道适配器 ── channel.ingress ──▶ daemon 控制面（unix socket 或远程监听）
  │
  ① 检查：WebSocket 调用是否带来源种类与渠道 id、会话是否在归档、工作目录是否存在
  ② 识别斜杠命令与注入提示，决定路由目标：gateway 或 session
  ③ 封装事件（补 id 与时间戳）；带幂等键时查去重表，重复则返回原事件已有的出站文字，不再往下走
  ④ 写入站快照 → 追加事件日志（WAL 行，再 by_id 索引行）→ 推进 gateway 消费进度 → 更新 status.json
  ⑤ 按路由目标分支
       gateway ─▶ 网关直接执行命令：写出站记录、追加 agent.result，不唤醒会话
       session ─▶ 向该会话收件箱写指针 "- [ ] @evt(<事件 id>)"
  ⑥ 调用方发出 session.wake（抢占方式由消息文字决定）
  │
  ⑦ 会话管理器找到或创建该会话的 actor，开始 drain：
       合并收件箱到邮箱 → 取邮箱顶部的可合并窗口 → 按指针读事件正文
  ⑧ 装配：系统提示（六层，含记忆板）+ 每轮瞬时块 → 按 runtime 调用引擎
  ⑨ 执行中：每次工具调用与结果追加为 agent.tool_use / agent.tool_result
     结束时：写出站记录 → 追加 agent.result → 更新会话状态 → 标记邮箱条目完成
  ⑩ 出站：session.output 总线事件 → 推给 WebSocket 订阅者；或由渠道经 channel.pull 拉取
  │
后台：心跳计时器 → cadence.tick
       → 确定性维护（记忆检查等）→ 追加 system.cadence_tick
       → 后台分区会话读取事件日志 → intuition-weaver 改写记忆板
       → 下一次前台装配读入记忆板（回到 ⑧）
```

### 1.2 各步骤的代码位置

下表每一行给出实现该步骤的函数，以及一句能直接在函数体内找到的代码（confirmed）。

| 步骤 | 真名 | 代码片段 |
|---|---|---|
| ① 入站检查 | `createDaemon (Lyt)` | `k0e("channel.ingress", k, D)`（`createDaemon`）；`code: -32011`（`createDaemon`）；`code: -32010`（`createDaemon`） |
| ② 识别命令、决定路由 | `ingestChannelMessage (Gle)`；`parseInjectionPromptCommand (dU)`；`resolveRoutingTarget (jXe)` | `s = jXe(t, i, r)`（`ingestChannelMessage`）；`if (n) return n.args ? "session" : "gateway"`（`resolveRoutingTarget`） |
| ③ 封装与去重 | `appendBeforeExecuteGateway (Kle)`；`createSpineEvent (rn)`；`computeDedupKey (wse)`；`spineEventDedupStore (mR)` | `o = wse(r)`（`appendBeforeExecuteGateway`）；`deduplicated: !0`（`appendBeforeExecuteGateway`） |
| ④ 快照与追加 | `writeIngressSnapshot (VXe)`；`atomicAppendEvent (on)`；`advanceConsumerWatermark (Nu)`；`updateRegistryStatus (Du)` | `r.payload && (r.payload.raw_path = s)`（`appendBeforeExecuteGateway`）；`await Nu(e, "gateway", r.id, new Date(r.ts))`（`appendBeforeExecuteGateway`） |
| ⑤ 路由分支 | `readRoutingTarget (qle)`；`replyToGatewayCommandEvent (LXe)`；`enqueueSessionInboxLine (Xs)` | `"[gateway] gateway-targeted event (no enqueue)"`（`appendBeforeExecuteGateway`）；`a = await Xs(e, t.sessionKey, f)`（`appendBeforeExecuteGateway`） |
| ⑥ 唤醒 | `createDaemon (Lyt)`；`resolvePreemptFromCommandText (kJ)` | `W.routing.enqueued && l.emit("session.wake", {`（`createDaemon`）；`preempt: kJ(k.text)`（`createDaemon`） |
| ⑦ actor 与 drain | `createSessionManager (Agt)`；`drainSessionMailbox (KSe)`；`mergeInboxIntoMailbox (fR)`；`listMailboxPendingItems (lb)`；`batchDrainItems (EH)`；`readEventById (Md)` | `de = await KSe(t, P, {`（`createSessionManager`）；`"mailbox_merge_ms"`（`drainSessionMailbox`）；`"event_read_ms"`（`drainSessionMailbox`） |
| ⑧ 装配与调用引擎 | `prepareDrainTurnContext (SH)`；`buildTransientUserBlocks (eke)`；`buildSystemPromptForChannelConfig (Jh)`；`renderPromptLayers (Nhe)`；`collectInstructionsInputs (XEe)`；`createAgentSdkAdapter (Ef)`；`createCodexAppServerAdapter (yw)`；`createGrokAcpAdapter (vw)`；`resolvePiWorkerCommand (eS)` | `R = Jh(h, t, ZSe(n.jobContext), n.memoryBoard, n.runtime)`（`prepareDrainTurnContext`）；`workerCommand: eS()`（`createSessionManager`） |
| ⑨ 执行记录与收尾 | `drainSessionMailbox (KSe)`；`patchSessionRuntimeState (et)` | `n.onExecutionEvent, Y.event.id`（`drainSessionMailbox`）；`"outbox_emit_ms"`（`drainSessionMailbox`）；`last_event_id: Y.event.id`（`drainSessionMailbox`） |
| ⑩ 出站 | `createOutboxDeliveryManager (Qgt)`；`createSessionSubscriptionRegistry (l6)`；`readOutboxRecordsPastCursor (Pw)` | `n.on("session.output", l)`（`createOutboxDeliveryManager`）；`W = V.includes("final")`（`createDaemon`） |
| 后台：心跳与维护 | `main (Fyt)`；`runCadenceTick (Zgt)` | `h.emit("cadence.tick")`（`main`）；`type: "system.cadence_tick"`（`runCadenceTick`） |
| 后台：分区会话与记忆板 | `createMetaSession (Wgt)`；`transcludeBroadcastBoard (WEe)`；`collectInstructionsInputs (XEe)` | `n.on("cadence.tick", x)`（`createMetaSession`）；`(await WEe(e.memoryBroadcastPath)).rendered.trim()`（`collectInstructionsInputs`） |

三点需要单独说明。第一，唤醒会话的是入站处理函数在指针写入之后发出的 `session.wake`，`appendBeforeExecuteGateway (Kle)` 发出的 `spine.event` 总线事件在 bundle 中没有订阅者（confirmed，第 6.2 节）。第二，第 ⑨ 步写 `agent.tool_use`、`agent.tool_result` 和 `agent.result` 的是 `drainSessionMailbox (KSe)` 调用的两个辅助函数，它们没有真名，表中引用的是调用点；这两个函数内部的写法见第 5.2 节，其中只能由调用点支撑的部分在那里标为未证实推测。第三，后台分区改写记忆板由分区提示词规定，代码只负责按心跳调度分区会话和在前台装配时读入记忆板：`subconscious/intuition-weaver/CLAUDE.md` 写明它是 `memory/CLAUDE.md` 的唯一写入者（confirmed，提示词原文；分区调度见第 11 节，记忆板的分工见第 12.4 节）。

## 2 系统提示装配

`renderPromptLayers (Nhe)` 每一轮按固定顺序把六层文本拼成一段，`buildSystemPromptForChannelConfig (Jh)` 只决定这段文本是否包成 Claude Code 预设；Claude、Codex、Grok、pi 四个引擎拿到的是同一段文本，区别只在传入格式、`prompt_mode` 是否起作用和文本何时送达引擎；每轮变化的信息不进系统提示，主要由 `buildTransientUserBlocks (eke)` 作为文本块排在用户原文之前。六层里没有任何随时间变化的内容，所以只要身份、渠道提示、记忆板和任务书不变，同一会话连续几轮的系统提示逐字相同，这是引擎侧 prompt cache 命中同一前缀的前提。本节对应 GUIDE 1.3 与 2.4；这段文本变化后在各引擎上何时生效，由第 13 节的指令指纹决定。

### 2.1 六层拼接与 prompt_mode

`renderPromptLayers (Nhe)` 按身份、种类、实例、记忆板、运行上下文、任务书的顺序拼接非空层，层与层之间用一个空行连接，`prompt_mode` 只决定是否把结果包成 Claude Code 预设；这段文本在每一轮 turn 开始前重算（confirmed）。`drainSessionMailbox (KSe)` 处理合并窗口时经 `prepareDrainTurnContext (SH)` 调用 `buildSystemPromptForChannelConfig (Jh)`，逐条处理时在 `drainSessionMailbox (KSe)` 内直接调用它，两处传入的参数相同（effective config、会话键、job 上下文、记忆板、引擎名）。会话管理器的插话路径（7.4）也调用 `prepareDrainTurnContext (SH)`，但只取用其中合并后的用户文本、附件、批次事件 id 和"这一批是否只含通知"的标志，算出的系统提示与瞬时块都不使用（confirmed）。

| 顺序 | 层 | 内容 | 出现条件 |
|---|---|---|---|
| 1 | 身份 | 身份提示 `meta-prompt.md` 的全文 | `resolveMetaPromptText (Xv)` 读到非空文件 |
| 2 | 种类 | 渠道种类描述的 `channel_prompt`（effective config 的 `kind_prompt`） | 非空 |
| 3 | 实例 | 渠道实例描述的 `channel_prompt`（effective config 的 `instance_prompt`） | 非空 |
| 4 | 记忆板 | `memory/CLAUDE.md` 展开 `@include` 后的文本，外加固定包装（2.2） | 展开后非空 |
| 5 | 运行上下文 | `## Runtime Context` 标题、一句说明，以及会话键、渠道种类，传入引擎名时再加一行 `- runtime:` | 有会话键 |
| 6 | 任务书 | `## Job Mission` 块（任务书正文、Job ID、调度规则，以及可选的验收标准） | job 会话 |

身份层只从环境变量定位文件。`resolveMetaPromptText (Xv)` 先读 `ALADUO_META_PROMPT_PATH` 指向的文件，再读 `ALADUO_BOOTSTRAP_DIR` 下的 `meta-prompt.md`，返回第一个去掉首尾空白后非空的内容；两个变量都没有设置时返回空，身份层缺省。daemon 在 `resolveRuntimePaths (Yut)` 里按包位置推出的 bootstrap 目录和 `metaPromptSrcPath` 字段不参与这次查找，daemon 代码里也没有给这两个变量赋值的语句（confirmed）。变量可以来自启动 daemon 的进程环境，也可以写在 `~/.config/duoduo/.env`：daemon 启动时 `loadHostDotEnv (Yct)` 从 `hostDotEnvPath (Ku)` 指向的这个文件补上进程环境里未设置或值为空串的键（confirmed）。部署后的 daemon 实际带着哪个变量运行，本文没有实测，列入第 14 节。包内 `bootstrap/meta-prompt.md` 为 14301 字节、287 行（confirmed）。

第 5 层只写会话键、渠道种类（缺省写 `unknown`）和引擎名，不含时间戳；六层的拼接函数体内也没有读取当前时间的调用。时间流逝、job 触发时间这类每轮不同的信息全部放进 2.3 的每轮瞬时块（confirmed）。

第 6 层由 `renderJobMissionBlock (Ahe)` 生成，分两种写法（confirmed）。无状态 job（`stateless`）的文本告诉模型它运行在一个全新上下文里，上文没有历史，跨次运行需要的状态必须写进文件；有状态 job 的文本告诉模型上文每一轮都是同一任务书的一次过去执行，应当当作参考而不是对话。job frontmatter 带 `acceptance` 时，`renderJobMissionBlock (Ahe)` 用它生成一段文本追加在任务书之后（confirmed）。这段文本是一段说明加 `<acceptance>` 块，说明要求模型结束前逐条核对这些条件，写明哪些没能满足，并把条件没有要求的工作视为范围之外（未证实推测：生成它的函数无真名，文字已在 pretty bundle 读到，缺可检查的引用）。job 的定义与调度见第 10 节。

`prompt_mode` 只有两个合法取值 `append` 与 `override`，由 `normalizePromptMode (wb)` 校验。取值顺序是实例描述、种类描述、默认 `append`（`buildEffectiveChannelConfig (cbe)`），job 会话再由 job frontmatter 覆盖（`applyJobSdkConfigOverride (KV)`，见 3.5）。`buildSystemPromptForChannelConfig (Jh)` 拿到六层文本后：`override` 时原样返回字符串；`append` 时返回 `{ type: "preset", preset: "claude_code", append: 文本 }`，文本为空则返回空值（confirmed）。这个包装只对 Claude 有直接意义，其余三个引擎各自再解释一次，见 2.4。

### 2.2 记忆板包装与 @include 展开

记忆板进入第 4 层之前经过两步处理：运行时自己展开其中的 `@include` 引用，再在文本前后加上固定的包装语。两步都在引擎适配器之前完成，所以四个引擎收到的记忆板文本相同（confirmed）。

展开在每次 drain 开始时进行。`collectInstructionsInputs (XEe)` 对 `~/aladuo/memory/CLAUDE.md` 调用 `transcludeBroadcastBoard (WEe)`，后者以一个空的已访问集合调用递归函数 `resolveBoardIncludes (JEe)`，再由 `renderTranscludedFiles (hgt)` 把每个文件渲染成一段以 `Contents of <路径> (project instructions, checked into the codebase):` 开头的文本（confirmed）。递归规则如下：

- 引用语法是行首或空白之后的 `@路径`（confirmed）。
- 包括记忆板本身在内最多展开 5 层：记忆板为第 0 层，到第 5 层时不再读取（confirmed）。
- 扩展名不在白名单（106 种文本类扩展名）里的文件被跳过，没有扩展名的文件不受这条限制（confirmed）。
- 去环检查只比较当前引用路径经 `normalizeIncludePathKey (qEe)` 规范化后的形式（`path.resolve`，在 win32 上再转小写）；`realpathOrSelf (ygt)` 求得的真实路径在展开这个文件时才加入已访问集合。因此一个文件如果先经符号链接展开过，之后按真实路径被引用时跳过；反过来先按真实路径展开、后经符号链接引用，或经两个不同的符号链接引用，同一文件会再展开一次。循环引用在同一路径第二次出现时截断，并受深度上限约束（confirmed）。
- 文件的 frontmatter 与 HTML 注释不进入展开后的文本；代码块和行内代码里的 `@` 不算引用；路径中 `#` 之后的部分被去掉，`\ ` 表示空格；相对路径以引用它的文件的真实路径所在目录为基准，`~/` 展开为用户主目录（`resolveBoardIncludes (JEe)` 把真实路径交给解析函数这一步 confirmed；其余几条未证实推测：已在 pretty bundle 中读到，但实现它们的解析函数没有真名，缺可检查的引用）。

这套规则与 Claude Code 展开 `CLAUDE.md` 中 `@import` 的规则相近，文件头的写法也与 Claude Code 注入 `CLAUDE.md` 时相同；运行时自己展开的效果是 Codex、Grok、pi 这些不按 Claude Code 规则读 `CLAUDE.md` 的引擎也拿到展开后的全文。与 Claude Code 行为的对照不在 duoduo 代码内，属于未证实推测。

包装语是 `initAgentSdkAdapterModule (wo)` 里定义的两个字符串常量和一个正则。展开后的记忆板非空时，`renderPromptLayers (Nhe)` 先在前面加一句前导语：下面是代码库与用户的指令，它们覆盖默认行为，必须按原文执行。若文本中出现 `[[...]]` 形式的链接，再在末尾追加一段规则：板上的 `[[slug]]` 链接是档案入口而不是脚注；当某一行的触发条件在当前任务中成立、而行内摘要不足以安全地判断或行动时，先读链接指向的档案再下结论，多数轮次只看摘要即可（confirmed）。记忆板的写入方与档案的组织见第 12 节。

记忆板为空时第 4 层整层缺省。包内 `bootstrap/memory/CLAUDE.md` 是 0 字节文件，新装的实例因此没有第 4 层，直到后台分区第一次写入记忆板（confirmed）。

Claude 会话另有一条可能重复加载记忆板的途径，运行时在默认情况下把它关掉。drain 把记忆目录作为 `additionalDirectories` 交给 Claude Code。`createAgentSdkAdapter (Ef)` 在附加目录非空、且调用方没有明确关闭时，把环境变量 `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` 设为 `"1"`，让 Claude Code 从附加目录自动读取 `CLAUDE.md`；调用方传入 `false` 时删除这个变量。`resolveAdditionalDirClaudeMdAutoload (OSe)` 在引擎为 Claude、记忆板非空、且附加目录全部就是记忆目录时返回 `false`，于是记忆板只经第 4 层进入一次。渠道描述或 job 另外配置了其他附加目录时，这个函数返回空值，自动加载重新打开，对包括记忆目录在内的全部附加目录生效（confirmed；这种情况下的后果见 3.5）。

### 2.3 每轮瞬时块

每轮变化的信息主要由 `buildTransientUserBlocks (eke)` 生成带 `tag` 的文本块，按固定顺序排在用户原文之前，一起作为用户消息发给引擎；每类块只在它的注入条件成立的那一轮出现，需要跨轮送达的几类由本小节末尾的写回保证只送达一次（confirmed）。九类块加用户原文的顺序如下：

| 顺序 | tag | 内容 | 注入条件 | 详见 |
|---|---|---|---|---|
| 1 | `daemon-restart-hint` | 当前运行在一个新的 daemon 进程里（附启动时间），有重启原因时附上原因 | 渠道会话，且上次见到的 daemon 启动时间与当前不同 | 6.4 |
| 2 | `smart-compact-notice` | 最近一次上下文压缩的结果（上下文 token 数的前后变化等）；空闲压缩和 turn 中由 SDK 触发的压缩都会留下记录 | effective config 配置了空闲自动压缩（`auto_compact_idle_minutes` > 0），且压缩之后还没有处理过新事件 | 8.4 |
| 3 | `gateway-notice` | 包在 `<system-reminder>` 里的说明：某个网关命令已在模型之外执行，视为已生效，不要重复；末尾注明与当前任务无关时不必回应 | 有待送达的网关命令结果 | 6.2 |
| 4 | `time-context` | 上次交互时间、当前时间，以及两者相隔约多久 | 渠道会话的用户消息，距上次事件不短于阈值，且这次 drain 中还没有注入过 | 本节 |
| 5 | `skip-rewind` | 上一轮用 Skip 跳过、产出未送达的说明 | 有待送达的 Skip 记录，且这一批包含用户消息 | 4.5 |
| 6 | `interrupted-context` | 被打断那一轮的输入文本 | 有待送达的打断记录 | 7.7 |
| 7 | `job-receipts` | 已完成 job 的回执 | 这个会话是 owner，且有未送达回执 | 10.3 |
| 8 | `job-tick` | 第几次运行、触发时间、上次运行时间（首次运行时注明）、cron | 逐条处理一条 `job.spawn` 事件的那一轮 | 10.2 |
| 9 | `board-updated` | 记忆板已变，需要新版时去读给出的路径 | 渠道会话，且记忆板哈希与会话上次见到的不同 | 13.2 |
| 10 | `user-input` | 用户原文（合并窗口时为合并后的文本；job 按调度触发的那一轮是固定句 `Execute your mission for this tick.`） | 总是 | 7.2 |

表中各块的顺序、tag 与注入条件都由 `buildTransientUserBlocks (eke)` 和 drain 代码确认（confirmed）。其中 `smart-compact-notice`、`time-context`、`job-tick`、`board-updated` 四类块的正文由没有真名的渲染函数生成：它们携带哪些字段可以在已命名的调用方确认（见证据表），正文的具体措辞只在 pretty bundle 中读到，缺可检查的引用，属未证实推测；`smart-compact-notice` 注入条件的后半句（压缩之后没有处理过新事件）也由一个无真名的函数判断，同样属未证实推测。

时间块的阈值来自 effective config 的 `time_gap_minutes`，缺省 60 分钟，设为 0 或负数时关闭；`computeTimeGapContext (QSe)` 只在渠道会话、这一批里有用户消息、会话有上次事件时间、且这次 drain 中还没有注入过时间块时构造时间差对象，并把阈值一并交给渲染函数（confirmed）；渲染函数在时间差小于阈值时不输出文本（未证实推测：渲染函数无真名，缺可检查的引用）。重启提示的判定由 `decideRestartHintInjection (Bbe)` 完成，非渠道会话直接判为不适用，所以 job、分区、system 会话收不到这个块（confirmed）。`job-tick` 只由 `drainSessionMailbox (KSe)` 的逐条处理路径传入，合并窗口路径 `prepareDrainTurnContext (SH)` 不传这一项（confirmed）；同一条路径在构造了 `job-tick` 时把用户原文换成上表中的固定句（confirmed）。

用户输入去掉前导空白后以 `/` 开头时，`buildTransientUserBlocks (eke)` 跳过全部注入，只发原文；这时所有 `…Injected` 标志都为假，待送达的内容留到下一轮（confirmed）。

表中各块之外，还有一段文字会出现在用户消息开头：上一轮被中断时记下的中断标记。它不经过 `buildTransientUserBlocks (eke)`，由两处加入（confirmed）。Claude 渠道会话的常驻连接因 `/cancel` 被拆除时，`teardownStreamingSession (Zf)` 记下标记，会话管理器在下一个 turn 的第一条消息前加上它（7.5）；Codex 与 Grok 的适配器在一次调用因用户取消或抢占而中止时记下标记，下一次调用时把它作为第一个文本块放在 prompt 前。用户取消时的标记说明请求被用户中断；抢占时只在有工具调用尚未返回时才加标记，说明这次工具调用是为了送达后面的消息而被结束的，需要时重新执行（标记文字定义在一个无真名的模块初始化器里，已在 pretty bundle 读到，缺可检查的引用，属未证实推测）。

"只注入一次"由两类写回实现（confirmed）。重启提示和记忆板提示在块放进这一轮用户消息之后、调用引擎之前，就把当前的 daemon 启动时间或记忆板哈希写进会话状态，作为"已见过"的水位，所以这一轮的引擎调用即使失败，这两条提示也不会重发。网关结果、打断记录、Skip 记录这三类待送达字段在引擎调用返回之后才从会话状态中清除：调用正常返回，或以 `isAgentSdkTurnInterruptedError (Gv)` 判定的中断错误结束时清除，其他错误时保留，下一轮再注入。两种水位第一次建立时都只记录、不注入，所以新会话不会收到这两条提示：重启提示一侧 confirmed；记忆板提示一侧的判定函数无真名，已在 pretty bundle 读到它的 `first-seen` 分支，缺可检查的引用，属未证实推测。

### 2.4 四个引擎用同一段文本

四个引擎的适配器接收的都是 2.1 那段六层文本，它们只做格式转换；文本是否在每轮都送达引擎，取决于该引擎的会话或进程何时建立。下表列出四者的差别（confirmed；Claude 行"统一关闭 SDK 的系统提示快照"和 pi 行"`prompt_mode` 的作用"两格依赖 daemon 侧无真名的函数，属未证实推测，见下文说明）。

| 引擎 | 适配器把文本放在哪里 | `prompt_mode` 的作用 | 文本何时送达引擎 |
|---|---|---|---|
| Claude | Agent SDK 的 `systemPrompt` 选项；`append` 时为 `claude_code` 预设加追加文本，`override` 时为字符串；统一关闭 SDK 的系统提示快照 | `override` 时不使用 Claude Code 内置系统提示 | 渠道会话：常驻流式进程启动时；其他会话：每次调用 |
| Codex | app-server 的 `baseInstructions`，外层包 `<aladuo:system-context>`，文本放在 `## Runner System Prompt` 标题下 | 无作用，两种形式取出同一段文本 | 新建线程（`thread/start`）或 fork 线程（`thread/fork`）时；续接线程（`thread/resume`）时不发送 |
| Grok | ACP 会话请求的 `_meta`；`override` 时为 `systemPromptOverride`，`append` 时为 `rules` | 两种都有效 | `append`：只在 `session/new`；`override`：新建、载入会话时都带，文本变化后下一次调用前重新 `session/load` |
| pi | pi-worker 初始化帧的 `system_prompt` 字段，带 `override` 或 `append` 模式 | 两种都有效 | worker 进程启动时一次 |

**Claude。** `createAgentSdkAdapter (Ef)` 把 `systemPrompt` 交给 SDK 之前先经过一个规范化函数（confirmed）。这个函数给对象形式加上 `snapshot: false`，把字符串或字符串数组改写成 `type: "custom"` 并同样关闭快照（未证实推测：函数无真名，已在 pretty bundle 读到，缺可检查的引用）。随包 Agent SDK 的类型文档说明，快照默认开启：会话第一次请求时的系统提示被记录下来，之后的请求与 `resume` 一律沿用记录，直到下一次压缩；关闭后每次请求都用当前传入的文本。同一段文档注明，这项记录功能仍在逐步开放，在尚未启用的账户上以及目前在 Bedrock、Vertex、Foundry 上，`snapshot` 被接受但不起作用（SDK 类型文档原文，confirmed）。因此在记录功能生效的环境里，关闭快照是第 13 节"续接原会话、换上新指令"能够生效的前提；在未生效的环境里，每次请求本来就用当前文本。Claude 渠道会话使用常驻流式进程，文本在 `createClaudeStreamingSessionFactory (s0e)` 启动进程时传入；判断能否复用这个进程的配置签名 `computeStreamingConfigSignature (fJ)` 不包含系统提示，所以进程存活期间新算出的文本不会送达，直到进程被重建（7.4、13.2）。其他 Claude 会话每次调用发起一次 `query()`，每次都带当前文本（confirmed）。调用方不传 `systemPrompt` 时，适配器改用环境变量和身份提示：设置了 `SYSTEM_PROMPT` 时以它为主体、后接身份提示与 `APPEND_SYSTEM_PROMPT`，整体替换 Claude Code 内置提示；没有设置时把身份提示与 `APPEND_SYSTEM_PROMPT` 追加在 `claude_code` 预设之后；三者都为空时不设 `systemPrompt`，由 SDK 使用自己的缺省（confirmed）。drain 路径总带第 5 层，文本不会为空，不走这条路径；分区会话在 Grok 以外的引擎上不传系统提示，其中 Claude 分区走这条路径（11.3）。

**Codex。** `extractSystemPromptAppend (Uye)` 对字符串取其本身、对预设对象取 `append`，所以 `prompt_mode` 不改变 Codex 收到的内容。`buildBaseInstructions (qye)` 把它包成 `<aladuo:system-context>` 块，块首声明"以下由 duoduo 运行时注入，不属于项目代码库"。这个函数还有 `## Identity`、`## Channel Configuration` 和记忆板三个分支，但会话管理器与分区会话构造 Codex 适配器时都只传配置、不传第二个参数，这三个分支在运行中不会触发，身份、渠道提示和记忆板只经由 `## Runner System Prompt` 这一处进入，不会出现两份（confirmed）。同理，`buildDeveloperInstructions (Bye)` 不生成带 `- timestamp:` 的会话上下文段，只在有 duoduo 动态工具时生成一个只含 `<duoduo-reminder>` 的 `<aladuo:runtime-directives>` 块，提醒模型这些工具属于当前工具列表、可用性以当轮调用结果为准（confirmed）。`baseInstructions` 只随 `thread/start` 与 `thread/fork` 发送；续接时如果发现线程运行的模型与要求的不同，适配器改发 `thread/fork`，这时也带上当前文本；fork 请求失败（不是被中止）时改发 `thread/start`（confirmed）。构造 Codex 适配器之前，会话管理器调用 `ensureAgentsMdSymlink (IV)`：会话工作目录有 `CLAUDE.md` 而没有 `AGENTS.md` 时建立 `AGENTS.md → CLAUDE.md` 符号链接（confirmed）。Claude 会话以 `settingSources: ["user", "project"]` 运行，Claude Code 会读取工作目录的 `CLAUDE.md`；Codex 按自己的约定读取 `AGENTS.md`，符号链接让两者读到同一个文件（Codex 侧的约定属于未证实推测）。

**Grok。** `createGrokAcpAdapter (vw)` 每次调用时先记下这一轮的文本：字符串记为 `override`，预设对象记为 `append`。`override` 的文本作为 `systemPromptOverride` 同时出现在 `session/new` 和 `session/load` 的 `_meta` 里，而且当记录的文本与上次应用过的不同时，适配器在调用前对现有会话再发一次 `session/load` 把新文本带上；`append` 的文本作为 `rules` 只在 `session/new` 时发送（confirmed）。续接已有会话时 Grok 是否保留建会话时的 `rules`，取决于 Grok CLI 的实现，未证实推测。分区会话在 Grok 上单独调用 `buildSystemPromptForChannelConfig (Jh)`，见 11.3。

**pi。** 系统提示只在 pi worker 进程启动时生效一次（confirmed，依据是 pi-worker 一侧）。pi-worker 只处理第一个 "init" 帧，之后的 "init" 帧记一条 "duplicate init ignored" 后忽略，而它读取 "system_prompt" 的地方只在初始化处理里；`override` 模式时用这段文本替换 pi 的默认系统提示，并从 pi 默认系统提示里截取 "Available tools:" 到 "Pi documentation" 之间的工具说明段追加在后面；`append` 模式时经 "appendSystemPromptOverride" 把文本追加在 pi 默认系统提示之后（以上均为 pi-worker.js 字面量，confirmed）。daemon 侧的 pi 适配器把字符串记为 `override`、预设对象记为 `append`，只在 worker 进程尚未启动时写进初始化帧；会话管理器的默认 pi 适配器工厂和其中的模式转换函数都没有真名，这一步不给代码引用，属于未证实推测，`prompt_mode` 在 pi 上的作用因此也属未证实推测。pi-worker 创建会话时传入 "noContextFiles: !0"，按字段名理解是不加载工作目录里的上下文文件，其确切含义取决于 pi 框架，未证实推测。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 六层按身份、种类、实例、记忆板、运行上下文、任务书的顺序拼接，空层丢弃 | `[o, s, a, l, u, c].filter(Boolean)`（`renderPromptLayers`） | confirmed |
| 种类层与实例层取 effective config 的两个字段，二者分别来自种类描述与实例描述的 `channel_prompt` | `e?.kind_prompt?.trim()`（`renderPromptLayers`）；`e?.instance_prompt?.trim()`（`renderPromptLayers`）；`s = i?.channel_prompt?.trim() \|\| void 0`（`buildEffectiveChannelConfig`） | confirmed |
| 运行上下文只含会话键、渠道种类与引擎名 | `## Runtime Context`（`renderPromptLayers`）；`channel_kind: ${e?.channel_kind??"unknown"}`（`renderPromptLayers`） | confirmed |
| 系统提示每轮重算，合并批与逐条两条路径都调用同一函数 | `R = Jh(h, t, ZSe(n.jobContext), n.memoryBoard, n.runtime)`（`prepareDrainTurnContext`）；`let mi = Jh(tt, t, ZSe(n.jobContext), n.memoryBoard, n.runtime)`（`drainSessionMailbox`） | confirmed |
| 插话路径只取用合并后的用户文本、附件、批次事件 id 与只含通知的标志 | `mt = vn.coalescedPromptText.trim()`（`createSessionManager`）；`!vn.isNotifyOnly && !w.liveTurnNotifyOnly`（`createSessionManager`）；`let wr = vn.batchEventIds.filter(mi => !w.inflightEventIds.has(mi))`（`createSessionManager`）；`await yt(mt, Xe, vn.attachments)`（`createSessionManager`） | confirmed |
| 身份层只从两个环境变量定位文件，取第一个非空 | `Zv(process.env.ALADUO_META_PROMPT_PATH)`（`resolveMetaPromptText`）；`"meta-prompt.md"`（`resolveMetaPromptText`） | confirmed |
| 按包位置推出的 bootstrap 目录不参与身份提示查找 | `metaPromptSrcPath: j`（`resolveRuntimePaths`） | confirmed（否定性证据：该字段在 daemon 中没有读取方；daemon 中也没有给 `ALADUO_BOOTSTRAP_DIR` 或 `ALADUO_META_PROMPT_PATH` 赋值的语句） |
| `~/.config/duoduo/.env` 只补上进程环境中未设置或值为空串的键 | `Ewe.join(t, ".config", "duoduo", ".env")`（`hostDotEnvPath`）；`Object.entries(r))(e[o] === void 0 \|\| e[o] === "") && (e[o] = s, i++)`（`loadHostDotEnv`） | confirmed |
| 任务书分无状态与有状态两种写法，由 `acceptance` 生成的文本可选追加 | `c = n ? Ahe(n, n.stateless === !0) : void 0`（`renderPromptLayers`）；`"FRESH context"`（`renderJobMissionBlock`）；`let n = xrt(e.acceptance)`（`renderJobMissionBlock`）；`"</mission>", ...n ? ["", n] : []`（`renderJobMissionBlock`） | confirmed（验收说明的措辞与 `<acceptance>` 块在无真名的函数里，属未证实推测） |
| `override` 返回字符串，`append` 包成 Claude Code 预设 | `e?.prompt_mode === "override"`（`buildSystemPromptForChannelConfig`）；`preset: "claude_code"`（`buildSystemPromptForChannelConfig`） | confirmed |
| `prompt_mode` 取值顺序为实例、种类、默认 append，job frontmatter 可覆盖，只接受两个值 | `prompt_mode: o?.prompt_mode ?? i?.prompt_mode ?? "append"`（`buildEffectiveChannelConfig`）；`prompt_mode: t.prompt_mode ?? e.prompt_mode`（`applyJobSdkConfigOverride`）；`e === "append" \|\| e === "override"`（`normalizePromptMode`） | confirmed |
| 记忆板每次 drain 重新读取并展开 | `(await WEe(e.memoryBroadcastPath)).rendered.trim()`（`collectInstructionsInputs`）；`await JEe(ha.resolve(e), new Set)`（`transcludeBroadcastBoard`） | confirmed |
| `@include` 的语法、深度上限（根为第 0 层，共 5 层）、扩展名白名单与文件头格式 | `UEe = /(?:^\|\s)@((?:[^\s\\]\|\\ )+)/g`（`initBoardTransclusionModule`）；`fgt = 5`（`initBoardTransclusionModule`）；`if (n >= fgt) return []`（`resolveBoardIncludes`）；`if (s && !pgt.has(s)) return []`（`resolveBoardIncludes`）；`mgt = " (project instructions, checked into the codebase)"`（`initBoardTransclusionModule`）；`Contents of ${t.path}${mgt}`（`renderTranscludedFiles`） | confirmed |
| 去环按引用路径检查，真实路径在展开时才补入已访问集合 | `if (t.has(o)) return []`（`resolveBoardIncludes`）；`t.add(o), t.add(qEe(a))`（`resolveBoardIncludes`）；`process.platform === "win32" ? t.toLowerCase() : t`（`normalizeIncludePathKey`）；`BEe.realpath(e)`（`realpathOrSelf`） | confirmed |
| 解析函数拿到的是被引用文件的真实路径 | `let a = await ygt(i)`（`resolveBoardIncludes`）；`} = bgt(u, a)`（`resolveBoardIncludes`） | confirmed（解析函数内部的相对路径、`#` 片段、frontmatter、注释与代码块规则无真名，属未证实推测） |
| 记忆板加前导语，含 `[[...]]` 时再加档案规则 | `vrt.test(d)`（`renderPromptLayers`）；`IMPORTANT: These instructions OVERRIDE any default behavior`（`initAgentSdkAdapterModule`）；`dossier entry points, not footnotes`（`initAgentSdkAdapterModule`）；`vrt = /\[\[[^\]]+\]\]/`（`initAgentSdkAdapterModule`） | confirmed |
| 记忆板为空时第 4 层缺省 | `r && r.content.trim().length > 0`（`renderPromptLayers`）；`memoryBoard: pi.memoryBoard ? {`（`createSessionManager`） | confirmed |
| 记忆目录作为附加目录交给 Claude；附加目录只有记忆目录且记忆板已注入时关闭附加目录 `CLAUDE.md` 自动加载，否则打开 | `additionalDirectories: [t.memoryDir]`（`createSessionManager`）；`n.some(s => $Se(s) !== i) ? void 0 : !1`（`resolveAdditionalDirClaudeMdAutoload`）；`s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1"`（`createAgentSdkAdapter`）；`delete s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`（`createAgentSdkAdapter`） | confirmed |
| 九类瞬时块与用户原文的顺序 | `tag: "daemon-restart-hint"`（`buildTransientUserBlocks`）；`tag: "smart-compact-notice"`（`buildTransientUserBlocks`）；`tag: "gateway-notice"`（`buildTransientUserBlocks`）；`tag: "time-context"`（`buildTransientUserBlocks`）；`tag: "skip-rewind"`（`buildTransientUserBlocks`）；`tag: "interrupted-context"`（`buildTransientUserBlocks`）；`tag: "job-receipts"`（`buildTransientUserBlocks`）；`tag: "job-tick"`（`buildTransientUserBlocks`）；`tag: "board-updated"`（`buildTransientUserBlocks`）；`tag: "user-input"`（`buildTransientUserBlocks`） | confirmed |
| 网关结果块的说明文字与末尾的免回应说明 | `"This action was executed by a gateway command outside the model context."`（`buildTransientUserBlocks`）；`IMPORTANT: this context may or may not be relevant to your tasks.`（`buildTransientUserBlocks`） | confirmed |
| 以 `/` 开头的输入跳过全部注入 | `e.trimStart().startsWith("/")`（`buildTransientUserBlocks`） | confirmed |
| 时间块阈值缺省 60 分钟、非正数关闭，只用于渠道会话的用户消息，时间差对象带上次与当前时间和阈值 | `Ydt = 60`（`initMailboxDrainRunnerModule`）；`(e.timeGapMinutes ?? Ydt) * 60 * 1e3`（`computeTimeGapContext`）；`if (!(e.consumed \|\| t <= 0)`（`computeTimeGapContext`）；`!e.isChannelSession \|\| !e.isUserMessage`（`computeTimeGapContext`）；`currentEventAt: e.currentEventAt ?? new Date().toISOString()`（`computeTimeGapContext`）；`timeGapMinutes: h?.time_gap_minutes`（`prepareDrainTurnContext`） | confirmed（阈值比较与块正文在无真名的渲染函数里，属未证实推测） |
| 压缩提示只在配置了空闲自动压缩时注入；turn 中由 SDK 触发的压缩也写压缩记录 | `(h?.auto_compact_idle_minutes ?? 0) > 0 ? o.compactNotice : void 0`（`prepareDrainTurnContext`）；`(tt?.auto_compact_idle_minutes ?? 0) > 0 && !ee && G ? G : void 0`（`drainSessionMailbox`）；`"[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack"`（`drainSessionMailbox`）；`mt.last_compact_at = dr, mt.compact_stats = wr`（`drainSessionMailbox`） | confirmed（"压缩之后没有新事件"的判断与块正文在无真名的函数里，属未证实推测） |
| `job-tick` 只在逐条处理 `job.spawn` 事件时传入，带运行序号、触发时间、上次运行时间与 cron | `Y.event.type === "job.spawn" && n.jobContext`（`drainSessionMailbox`）；`jobTick: Nn`（`drainSessionMailbox`）；`previous_run_at: typeof ou == "string" ? ou : null`（`drainSessionMailbox`）；`cron: n.jobContext.cron`（`drainSessionMailbox`） | confirmed（否定性证据：`prepareDrainTurnContext` 传给 `buildTransientUserBlocks` 的对象里没有 `jobTick`；块正文在无真名的函数里，属未证实推测） |
| job 按调度触发的那一轮，用户原文换成固定句 | `tft = "Execute your mission for this tick."`（`initMailboxDrainRunnerModule`）；`Nn && (yt = tft)`（`drainSessionMailbox`） | confirmed |
| 重启提示只给渠道会话，新会话与没有水位的旧会话只记录不注入 | `stage: "out-of-scope"`（`decideRestartHintInjection`）；`stage: "new-session"`（`decideRestartHintInjection`）；`stage: "grandfather"`（`decideRestartHintInjection`）；`You're running under a new daemon process`（`renderDaemonRestartHint`） | confirmed |
| 记忆板提示只给渠道会话，按哈希水位判断，块中带记忆板路径 | `at = to(t) === "channel" ? n.boardHash : void 0`（`drainSessionMailbox`）；`lastSeenBoardHash: z?.last_seen_board_hash`（`drainSessionMailbox`）；`boardPath: n.memoryBoard.path`（`drainSessionMailbox`） | confirmed（首次见到只记录不注入的分支在无真名的判定函数里，属未证实推测） |
| 两种水位在调用引擎之前写入；三类待送达字段在调用返回之后清除 | `!Gt && de.injectionResult.boardUpdatedInjected && (Gt = !0, Oe && await et(e, t, {`（`drainSessionMailbox`）；`last_seen_board_hash: Oe`（`drainSessionMailbox`）；`de.gatewayNoticeInjected && !P && (await ift(e, t), P = !0)`（`drainSessionMailbox`）；`if (await $n(tt), Nn.skipped)`（`drainSessionMailbox`） | confirmed |
| 中断标记不经过瞬时块：Claude 常驻连接因 `/cancel` 拆除后由会话管理器加入，Codex 与 Grok 由适配器加入 | `await Zf(P, "cancel-interrupt", "user-cancel")`（`createSessionManager`）；`Egt(e, n)`（`teardownStreamingSession`）；`H = i0e(w, P)`（`createSessionManager`）；`be && Ee.unshift({`（`createCodexAppServerAdapter`）；`Gt && we.unshift({`（`createGrokAcpAdapter`）；`e === "user-cancel" \|\| e === "preempt" ? e : void 0`（`normalizeTurnAbortReason`） | confirmed（标记文字在无真名的模块初始化器里，属未证实推测） |
| Claude：系统提示经规范化后交给 SDK，两条 query 路径共用同一组装逻辑 | `r.systemPrompt = Prt(r.systemPrompt)`（`createAgentSdkAdapter`）；`createStreamingQuery(t)`（`createAgentSdkAdapter`） | confirmed（规范化函数本身无真名，其中的 `snapshot: false` 属未证实推测） |
| Claude 流式进程在启动时接收系统提示，复用判断的签名不含系统提示 | `systemPrompt: l.systemPrompt`（`createClaudeStreamingSessionFactory`）；`u.streamingState.configSignature === p`（`createClaudeStreamingSessionFactory`）；`autoloadAdditionalDirectoryClaudeMd: e.autoloadAdditionalDirectoryClaudeMd`（`computeStreamingConfigSignature`） | confirmed |
| Claude 只有渠道会话走流式适配器 | `w.origin !== "channel" \|\| !s.createStreamingQuery ? s`（`createSessionManager`） | confirmed |
| 未传系统提示时改用环境变量与身份提示，三者都为空时不设 | `Zv(process.env.APPEND_SYSTEM_PROMPT)`（`createAgentSdkAdapter`）；`f = [Xv(), l].filter(p => !!p)`（`createAgentSdkAdapter`）；`f && (r.systemPrompt = {`（`createAgentSdkAdapter`） | confirmed |
| Codex 对两种形式取出同一段文本并包进 `<aladuo:system-context>` | `e.append?.trim() \|\| void 0`（`extractSystemPromptAppend`）；`"<aladuo:system-context>"`（`buildBaseInstructions`）；`## Runner System Prompt`（`buildBaseInstructions`）；`g = qye(t ?? {}, h)`（`createCodexAppServerAdapter`） | confirmed |
| Codex 适配器构造时不传指令参数，身份等分支与时间戳不触发；动态工具提醒包在 `<aladuo:runtime-directives>` 里 | `w.adapter = f({`（`createSessionManager`）；`- timestamp:`（`buildDeveloperInstructions`）；`"<duoduo-reminder>"`（`buildDeveloperInstructions`）；`"<aladuo:runtime-directives>"`（`buildDeveloperInstructions`） | confirmed |
| Codex 只在新建与 fork 线程时发送 baseInstructions；模型不符时改 fork，fork 失败时改新建 | `f.forkFrom ? (S = "thread/fork", D = x(f.forkFrom))`（`createCodexAppServerAdapter`）；`g && (H.baseInstructions = g)`（`createCodexAppServerAdapter`）；`g && (L.baseInstructions = g)`（`createCodexAppServerAdapter`）；`"[codex-adapter] resumed thread runs a different model; forking"`（`createCodexAppServerAdapter`）；`"[codex-adapter] thread/fork failed, falling back to thread/start"`（`createCodexAppServerAdapter`） | confirmed |
| Codex 会话工作目录建立 `AGENTS.md → CLAUDE.md` 符号链接 | `n.symlink("CLAUDE.md", o)`（`ensureAgentsMdSymlink`）；`Ve && await IV(Ve).catch(() => {}), w.adapter = f({`（`createSessionManager`） | confirmed |
| Claude 会话读取用户级与项目级设置 | `settingSources: ["user", "project"]`（`buildSessionInfoFromState`） | confirmed |
| Grok：`override` 作为 `systemPromptOverride` 并在文本变化后重新载入，`append` 作为 `rules` 只随新建会话发送 | `G.systemPromptOverride = F.layers`（`createGrokAcpAdapter`）；`L === "new" && F.layers.length > 0 && (G.rules = F.layers)`（`createGrokAcpAdapter`）；`F?.mode !== "override" \|\| k === F.layers`（`createGrokAcpAdapter`） | confirmed |
| pi：系统提示只随第一个初始化帧生效，按两种模式使用 | `g = e.piAdapterFactory ?? TO`（`createSessionManager`） | pi-worker 侧 confirmed（pi-worker.js 字面量 "init"、"duplicate init ignored"、"system_prompt"、"appendSystemPromptOverride"、"Available tools:"、"Pi documentation"）；daemon 侧默认适配器工厂与模式转换函数无真名，未证实推测 |

## 3 引擎

引擎（配置字段 `runtime`）有 `claude`、`codex`、`grok`、`pi` 四个取值；会话先按配置把引擎绑定到 actor 上，再探测它是否可用，引擎不可用、或与会话历史所属的引擎不一致时，这一 turn 直接拒绝执行，没有任何路径会改用另一个引擎。四个引擎读同一段系统提示（2.4），拿到同一组自操作工具（各引擎的注册差异见 4.1），但进程形态、可用性探测、同名命令的实现、权限与思考输出各不相同，代码在这些地方按 `runtime` 分支处理。3.1 到 3.3 讲引擎如何被选中和拒绝，3.4 与 3.5 讲选中之后模型、推理力度和 SDK 配置如何确定，3.6 与 3.7 讲四个引擎在命令、权限和认证上的差异。本节对应 GUIDE 1.2、1.4、1.5、1.7。

### 3.1 四值枚举与默认值

引擎的合法取值只在一处定义：`L0 = ["claude", "codex", "grok", "pi"]`（`initChannelProtocolModule`），配置键校验、分区 frontmatter 解析和 `channel.spawn` 都经两个成员判定函数引用这个数组（confirmed）。宿主默认值由 `resolveDefaultRuntime (Co)` 计算：读取 `ALADUO_DEFAULT_RUNTIME`，去掉首尾空白并转成小写，属于枚举才采用，否则一律回到 `"claude"`（confirmed）。

每类会话按自己的顺序取值，取到的值写在 actor 的 `runtime` 字段上（confirmed）。下表的来源标签只写进 actor 启动时的告警日志（探测失败时，以及 job 在 codex 上设置了 `prompt_mode` 时）。drain 拒绝执行时写进 `agent.error` 负载的 `runtime_source` 另有算法：它只看 actor 的 `runtime` 是否有值，而会话 actor 的 `runtime` 总有值，所以这个字段在会话 actor 上恒为 `explicit`（confirmed，静态阅读）。

| 会话 | 取值顺序 | 来源标签 |
|---|---|---|
| 渠道会话（状态里记有来源渠道） | 渠道实例描述符的 `runtime` → 渠道种类配置的 `runtime` → 宿主默认值 | `explicit`、`inherited`、`default` |
| job 会话 | job 文件 frontmatter 的 `runtime` → 宿主默认值 | `explicit`、`default` |
| 后台分区会话 | 分区 `CLAUDE.md` frontmatter 的 `runtime`（不在枚举内时告警并忽略）→ 宿主默认值 | `explicit`、`default` |
| 其他会话（system 来源、没有来源渠道的渠道会话） | 创建 actor 时传入的值，缺省为 `"claude"` | 无 |

job 的引擎在创建时就写进文件。ManageJob 的 create 动作按"参数 → 调用方会话的引擎 → 宿主默认值"解析出一个值写进 frontmatter（4.2），JSON-RPC `job.create` 直接写入宿主默认值（10.1）；因此之后修改 `ALADUO_DEFAULT_RUNTIME` 不影响已有 job（confirmed）。

### 3.2 进程模型与可用性探测

四个引擎是四种进程形态，可用性探测的方式与时机也不同：Claude 只在 daemon 启动时探测一次，Codex 与 Grok 在启动时探测一次供列表显示、在每次创建 actor 时再探测一次，pi 不探测（confirmed）。

| 引擎 | 进程形态 | 与 daemon 的通信 | 可用性探测 |
|---|---|---|---|
| claude | daemon 在自身进程内调用 Agent SDK 的 `query()`；SDK 执行随 npm 可选依赖安装的 Claude Code 原生二进制 | SDK 的函数调用与回调 | 检查平台是否受支持、原生二进制是否存在（设置了 `CLAUDE_CODE_EXECUTABLE` 时跳过这两项）；5 秒超时 |
| codex | 常驻的 `codex app-server` 子进程，以 `detached` 方式启动 | stdin/stdout 上的 JSON-RPC | 依次运行 `codex --version` 与 `codex login status`，后者输出须含 `logged in`；各 5 秒超时 |
| grok | 常驻的 `grok agent --always-approve --no-leader stdio` 子进程 | ACP，外加 `_x.ai/` 前缀的扩展方法 | 只运行 `grok --version`，5 秒超时；未登录要到第一次 ACP `authenticate` 才暴露 |
| pi | 包内的 `pi-worker.js`，用 daemon 自己的 Node 可执行文件（`process.execPath`）运行 | 每行一个 JSON 帧（`encodePiWorkerFrame (IH)`），帧类型有 init、run、steer、compact 等 | 无；模型在构造 worker 时绑定 |

Claude 一栏里 daemon 自己不启动 Claude 进程。启动探测只校验原生二进制存在；设置了 `CLAUDE_CODE_EXECUTABLE` 时整个校验直接返回（`if (Zv(process.env.CLAUDE_CODE_EXECUTABLE)) return;`（`verifyClaudeCodeRuntimeAvailable`）），该路径交给 SDK 使用（confirmed）。SDK 如何运行这个二进制不在本 bundle 内（未证实推测，缺 SDK 源码）。

探测结果有两条互不相干的用途（confirmed）。第一条是列表：`main (Fyt)` 在启动时并行运行三个探测并打印 `[pid0] available runtimes at boot`，pi 恒为可用；结果写进进程级缓存，此后读它的有两类地方：一是 ManageJob 的参数说明，包括 runtime 可选列表，以及只在 Codex 可用时才出现的几句关于 codex 的说明；二是 `channel.describe` 返回的 `available_runtimes`。缓存只在启动时写入，所以这两个列表和这些说明反映的是 daemon 启动那一刻的状态。两个列表还有一处差别：三个探测都失败时，ManageJob 的列表仍放入 claude，`channel.describe` 的列表只剩 pi。第二条是执行：会话管理器把 Codex 与 Grok 的探测函数各包一层 `memoizeAvailabilityProbeUntilOk (u0e)`，成功的结果保留到 daemon 退出，失败的结果立即丢弃，下一次创建 actor 时重新运行 CLI 探测。Claude 没有第二条路径：启动探测的结果无论成败都缓存到 daemon 退出，执行时读出的就是这个结果，所以 Claude 不可用时的提示要求修复后重启 daemon。此外，ManageJob 创建 codex 或 grok 的 job 时会当场再运行一次对应 CLI 的探测（4.2）。

"runtime"这个词在控制面上还指另一样东西：RPC `system.runtime.info` 返回的是 daemon 实例的身份，包括版本、`runtime_id`、运行模式（`runtime_mode: "host",`（`createDaemon`））以及运行、工作、kernel 三个目录，其中不列出可用引擎；可用引擎只能从 `channel.describe` 的 `available_runtimes` 读到（confirmed）。

pi 没有探测函数。`resolvePiWorkerCommand (eS)` 在 daemon bundle 同目录找到 `pi-worker.js` 就用 `process.execPath` 运行它，找不到时退回开发环境的 tsx 加 `pi/worker.ts`（confirmed）。daemon 在 init 帧里把 pi agent 目录下的 `auth.json`、`models.json` 路径和模型 id 交给 worker；worker 要求模型 id 形如 `provider/modelId`（pi-worker.js 字面量 "model must be provider/modelId"），在 pi 自己的模型目录里解析不到就以 init_error 结束（pi-worker.js 字面量 "model not resolvable"）。凭据和可用模型因此完全由 pi agent 目录决定，与其余三个引擎的登录状态无关（confirmed）。

### 3.3 先绑定再探测：runtime_unavailable 与 runtime_mismatch

会话 actor 在 drain 循环开始前按 3.1 的顺序把引擎写到 actor 上，然后才探测；探测失败只记下原因，`runtime` 保持不变。到 drain 处理邮箱时，有原因就以 `runtime_unavailable` 拒绝；会话历史所属的引擎与当前引擎不同，就以 `runtime_mismatch` 拒绝。两种拒绝都结束 actor，下一条消息重新绑定、重新探测（confirmed）。

绑定在 `createSessionManager (Agt)` 的 actor 启动段里完成（confirmed）。job 分支和渠道分支都先把 3.1 解析出的引擎写到 actor 的 `runtime` 字段，然后才调用探测函数；探测函数只对 codex 与 grok 运行 CLI 探测，claude 与 pi 在这里不探测。探测失败时，原因存进一个局部变量，日志写一条"job 或渠道请求了某引擎但它不可用"的告警（`but it is unavailable`（`createSessionManager`）），actor 的 `runtime` 不改。pi 的对应检查发生在构造 worker 之前：会话既没有存下的 pi 模型、job frontmatter 和配置层也没有给出模型时，原因被设为 "pi binds its model when the worker is built, and this session has none."。这一段代码里没有改用 claude 的分支；选中 codex、grok 或 pi 却没有构造出适配器的 actor，一旦被调用就直接报错，错误文字写明拒绝回落到 Claude（证据见本节证据表）。

拒绝发生在 `drainSessionMailbox (KSe)` 的第五步（7.1），两项检查只在本次确有待处理事件时进行（confirmed）：

1. **引擎不可用。** 原因取 actor 传来的值；引擎是 claude 时取启动探测的结果。有原因就以 `stage: "runtime_unavailable"`（`drainSessionMailbox`）拒绝，提示由 `renderRuntimeUnavailableGuidance (Cft)` 按引擎生成：codex、grok 要求安装 CLI 并登录后重发消息；pi 说明模型 id 的写法，并写明 "Nothing to install: the pi runtime ships inside duoduo."；claude 要求重装 Agent SDK 的原生二进制后重启 daemon。
2. **历史所属引擎不符。** 引擎每次返回会话 id 时（stateless job 除外），drain 都把当时的引擎与会话 id 一起写进 `state.json`（字段 `sdk_session_runtime` 与 `sdk_session_id`），`/clear` 把两者一起清空。之后每次 drain，若会话有引擎侧会话 id、记录的引擎与当前引擎不同、且不是 stateless job，就以 `stage: "runtime_mismatch"`（`drainSessionMailbox`）拒绝。提示由 `renderRuntimeMismatchGuidance ($ft)` 生成，写明 "Session histories cannot move between runtimes, so choose one:"。每个会话都得到"把引擎改回原来的值后重发消息"这一选项；"换到新引擎"这一选项按会话类型不同，渠道会话被告知先 `/clear` 再重发，job 会话被告知由 job 的 owner 决定是否让 job 在新引擎上开一个新会话。提示还要求换引擎之前先让一个子代理找到仍留在磁盘上的旧会话历史并做摘要。stateless job 每次运行都从新会话开始，所以不做这项检查。

拒绝的说明如何送达取决于会话类型（confirmed）。渠道会话把说明作为普通回复写给每个待处理事件，并把这些邮箱项标记完成，drain 返回拒绝阶段；会话管理器的循环据此打印 `"[session-manager] runtime refusal, ending actor"`（`createSessionManager`）并结束 actor，用户需要在修复后重发消息。

其他会话（job 与 system 来源）把说明交给 `handleDrainError (Xw)`，生成 `agent.error` 事件（7.7），随后 drain 抛出错误；这个错误落到会话管理器循环外层的 catch，日志写 `error in drain loop for`（`createSessionManager`），会话状态记下 `last_error`，actor 同样在这里结束，job 按"引擎未开始"的失败结算（10.3）（confirmed）。

两类会话都在下一条消息到达时创建新 actor，重新走一遍绑定和探测：Codex 与 Grok 的失败结果没有被保留，装好 CLI 并登录后下一条消息即可运行；Claude 的探测结果在启动时固定，需要重启 daemon（confirmed）。

改引擎的配置入口也检查历史归属。`channel.spawn` 更新渠道实例描述符时若 `runtime` 变了，`upsertChannelSpawnDescriptor (Ayt)` 先检查这个渠道下是否有会话持有另一个引擎的历史，有就拒绝修改并列出这些会话，要求逐个 `/clear` 之后再改；`session.config` 设置 `runtime` 时调用同一个检查（该 RPC 的处理函数尚无真名）（confirmed）。

后台分区不经过 actor，但遵守同一条规则：`createMetaSession (Wgt)` 在执行分区前探测 codex 与 grok（claude 读启动时的缓存结果），不可用就追加一条 `outcome: "runtime_unavailable"` 的 `agent.error` 事件，跳过本次执行并按失败计入退避（11.2），同样不改用其他引擎（confirmed）。pi 分区没有配置模型时走同一个分支，错误文字要求在分区 frontmatter 写 `model: provider/modelId` 或设置全局的 `pi.model`（confirmed）。

`/model` 与 `/effort` 需要知道会话用哪个引擎，它们用 `createModelCommandResolvers (e0e)` 返回的解析函数，不做探测（confirmed）：有 actor 且其引擎为 codex、grok 或 pi 时取它（`if (a?.runtime === "codex") return "codex";`（`createModelCommandResolvers`））；其余情况，包括绑定为 claude 的 actor，按来源渠道的实例描述符、渠道种类配置、宿主默认值推出。因此一个仍绑定 claude 的 actor，在渠道配置改成别的引擎之后，`/model` 按新配置的引擎解释（confirmed，静态阅读）。这个结果只决定命令按哪个引擎的语义执行（3.6），不改变 actor 的绑定。

### 3.4 模型与推理力度的分层默认值

模型与推理力度各有四个按引擎分开的配置键，在"全局 → 渠道种类 → 渠道实例"三层里逐键合并；每个 turn 再把这个配置值与 job frontmatter 的值、会话自己用 `/model`、`/effort` 存下的值比较，而两者的优先顺序相反：模型上 job 的值优先，推理力度上会话的值优先（confirmed）。Claude 另有一组按模型 id 配置的上下文 profile，决定这个模型的上下文窗口上限和它走哪个端点。

配置键是 `claude.model`、`codex.model`、`grok.model`、`pi.model` 与对应的四个 `.effort`，登记在 `CHANNEL_CONFIG_KEY_TYPES (t6)`。`validateConfigValue (kut)` 对两类键的校验宽严不同：模型 id 只要求去掉首尾空白后非空且不含空白，未列出的 id 也接受，写错的 id 到真正运行那一轮才报错；推理力度必须是 `low`、`medium`、`high`、`xhigh`、`max` 之一，否则立即拒绝并在错误信息里列出这五个值（confirmed）。键按引擎分开命名，所以一个渠道换了引擎之后，不会把原引擎的模型 id 带给新引擎（confirmed）。

三层合并由 `buildEffectiveChannelConfig (cbe)` 完成：它把 global、kind、instance 三层依次交给模型与推理力度各自的合并函数，两者都只是 `foldConfigLayersByKey (z$)` 的包装，按键覆盖、后面的层胜出，所以在种类层设 `codex.model` 不影响全局层的 `claude.model`。读取函数的返回值带着决定它的层名（confirmed）。

每个 turn 的最终取值由两个解析函数给出，模型与推理力度的优先顺序相反：模型先取 `let t = e.jobModel ?? e.sessionModel`（`resolveTurnModelWithLayer`），推理力度先取 `let t = e.sessionEffort ?? e.jobEffort`（`resolveTurnEffortWithLayer`）；取到显式值时 `configLayer` 为空，否则落到配置层并记下层名，`/model` 与 `/effort` 不带参数时据此说明当前值来自哪一层（confirmed）。

上游技能文档 `skills/duoduo-runtime-admin/references/model-defaults.md` 把会话自己的 `/model` 列为模型的最高优先级，代码中模型是 job frontmatter 优先，以代码为准。这个差异在实践中很少出现：`/model`、`/effort` 命令与 `session.model`、`session.effort` RPC 都只接受渠道会话，两个 RPC 的处理函数 `readOrSetSessionModel (xyt)` 与 `readOrSetSessionEffort (Eyt)` 对其他会话都返回 `forbidden_kind`，job 会话通常没有会话级的值（confirmed）。pi 另有一条取值路径：它在构造 worker 时自行确定模型，顺序是会话存下的 pi 模型、job frontmatter、配置层，job 会话的配置层按种类 `job` 读取（3.5）（confirmed）。

请求的模型与实际服务的模型分开记录。drain 记录里的 `modelOrigin`、`effortOrigin` 记下配置取自哪一层；`extractServedModelFromUsage (MSe)` 从用量数据里取出实际服务这一轮的模型，写进 `state.json` 的 `last_served_model`（`mt.last_served_model = Xe`（`drainSessionMailbox`））。两者可以不同，例如 Codex 线程在 fork 之前保持它启动时的模型（3.6），或者兼容网关换了模型（confirmed）。

`claude.model_profiles`（合并后的字段名 `claudeModelProfiles`）给单个模型 id 指定它自己的上下文窗口上限，并可以另外指定它自己的端点和认证令牌；下文把一个模型 id 的这组设置称为它的上下文 profile（confirmed）。profile 只作用于 claude 引擎，与模型配置键一样在全局、种类、实例三层逐键合并，同一个模型 id 以更具体的层为准，job frontmatter 还能再覆盖一次（3.5）。每次运行前，`classifyModelContextRequirement (lH)` 把请求的模型 id 与合并后的目录比对：以 `claude-` 开头的 id 按 Claude 原生模型处理，不查目录；目录里有这个 id（带 `[1m]` 后缀的先去掉后缀再查）时得到 `profiled-external` 类别，带上窗口上限、端点和认证信息；都不命中时按未登记模型处理，窗口上限取宿主环境变量 `CLAUDE_CODE_MAX_CONTEXT_TOKENS`（设置了的话）。`profiled-external` 的要求由 `buildClaudeSettingsEnvOverrides (lut)` 转成 `CLAUDE_CODE_MAX_CONTEXT_TOKENS`、`ANTHROPIC_BASE_URL` 与认证令牌变量，连同 `claude.model_aliases` 给子代理 tier 别名（opus、sonnet、haiku、fable）指定的模型，写进一个交给 SDK 的 settings 文件；文件以 0600 权限写入，写文件的函数尚无真名（confirmed）。

`/model` 在 claude 会话上要先确定新模型的上下文 profile（confirmed）。profile 无法解析（例如配置里的条目写错）时拒绝切换并返回 `reason: "profile_error"`（`createSessionManager`），回复要求修正对应层的 `claude.model_profiles` 条目；新模型需要换用另一套上下文 profile 时，模型先存下，常驻的流式会话在下一 turn 之前重建（3.6）。

后台分区和 job 创建各有自己的规则。分区的模型取 frontmatter 的 `model`，没有时只读全局层（`ae = S.model ?? Ie.runtimeModels?.[W]?.model`（`createMetaSession`）），不经过种类层和实例层（confirmed）。ManageJob 创建 job 时要求显式给出模型，不从宿主默认值继承（4.2）。推理力度设为 `max` 而 Claude 模型不支持时，SDK 按 `high` 执行，`/effort max` 的回复会写明这一点（confirmed）。

### 3.5 job 的 SDK 配置叠加

job 每一轮的 SDK 配置分三步得到：先按锚点事件解析出渠道有效配置，再用 `applyJobSdkConfigOverride (KV)` 叠上 job 文件 frontmatter 里的键，最后由 `buildTurnSdkRunConfig (GSe)` 与会话管理器给出的基线取并集。叠加函数对不同的键用四种合并方式；包内的 `bootstrap/config/job.md` 自称是所有 job 会话的种类层，但除了 pi 的模型与推理力度默认值，运行时并不读它（confirmed）。

`applyJobSdkConfigOverride (KV)` 的合并方式如下（confirmed）：

| 键 | 合并方式 |
|---|---|
| `prompt_mode`、`allowedTools`、`disallowedTools`、`additionalDirectories`、`piExtensions`、`piSkills` | job 有值就整体替换 |
| `claude.tools`（字段名 `claudeTools`） | 并集，`mergeClaudeToolLists (rbe)` |
| `claudeModelProfiles`、`claudeModelAliases` | 按键覆盖，同名项以 job 为准，覆盖进来的 profile 标记 `source: "instance"`（profile 用 `overlayConfigEntriesByKey (GV)`） |
| `claudeModelProfileIssues`、`claudeModelAliasIssues`、`piConfigIssues` | 追加（pi 用 `appendPiConfigIssues (lbe)`） |

叠加之后，`buildTurnSdkRunConfig (GSe)` 把 `allowedTools`、`disallowedTools`、工具面和 `additionalDirectories` 四个列表与会话管理器给出的基线取并集。基线是自操作工具的自动批准列表（4.1）、Claude 的核心工具集和记忆目录（工具集见 3.7），所以 job 只能增加、不能去掉这些项。同一个工具同时出现在 `allowedTools` 与 `disallowedTools` 里时，它被从后者删掉（`s = i?.filter(l => !o.has(l))`（`buildTurnSdkRunConfig`）），不报任何提示（confirmed）。`allowedTools` 只影响自动批准，给 Claude 增加内建工具只能用 `claude.tools`（3.7）。

种类层取决于锚点事件的来源，而不是会话是 job。`prepareDrainTurnContext (SH)` 用锚点事件解析有效配置后再叠加 job 的键；按调度规则触发的运行，锚点是 job 扫描器（10.2）写入的 `job.spawn` 事件，来源的种类为 `cadence`，因此种类层读的是 `kernel/config/cadence.md`（包内不带这个文件）；由 Notify 等投递唤醒的运行，来源是 `route`（confirmed）。`bootstrap/config/job.md` 的注释写着 "This is the KIND layer for every job session on this host"，ManageJob 对 `extra_tools` 的说明也写着与 `kernel/config/job.md` 取并集，但代码里只有构造 pi worker 时用 `channel_kind: "job"`（`createSessionManager`）读取种类 `job` 的配置，而且只取 `pi.model` 与 `pi.effort`。`job.md` 里的 `allowedTools`、`claude.tools`、`prompt_mode` 和正文对 Claude、Codex、Grok 的 job 都不生效（confirmed，静态阅读，未实测）。

job 文件在每次 drain 迭代时重新读取（第一次用启动时读到的快照，之后 `vr ? Ht = await a.getJob(w.jobId)`（`createSessionManager`）），所以修改一个正在运行的 job 文件，下一轮即生效（confirmed）。

这一层还有四个不报错的边界（confirmed，第四条的后果为未证实推测）：

- 不合法的 `prompt_mode` 被丢弃：`normalizePromptMode (wb)` 只接受 `append` 与 `override`，`parseJobFileFrontmatter (Nye)` 只在取值合法时写回，写错的 job 按预设模式运行。
- 不合法的 `effort` 被忽略，只打一条 `[JobManager] ignoring invalid job effort` 日志。
- 在 codex 引擎上 `prompt_mode` 不起作用。ManageJob 创建时直接拒绝（4.2）；手工编辑的 job 文件只在运行时打一条 `job sets prompt_mode but resolves to the codex runtime; the setting is inert`（`createSessionManager`）警告。
- 给 job 设置 `additionalDirectories` 会重新打开附加目录 `CLAUDE.md` 的自动加载（判定规则见 2.2）：job 加入记忆目录以外的任何目录后，自动加载对包括记忆目录在内的所有附加目录生效，而记忆目录的 `CLAUDE.md` 就是已作为系统提示第 4 层注入的记忆板。Claude Code 是否因此把记忆板再加载一遍，未实测（第 14 节）。

JSON-RPC `job.create` 不接受这些键，SDK 配置只能经 ManageJob 或手工编辑 job 文件设置（10.1）。

### 3.6 同名命令的实现差异

`/model`、`/effort`、`/compact` 在四个引擎上各自实现，同名命令的生效时机不同：Claude 尽量在常驻会话上即时生效，Codex 先存下、下一条消息 fork 线程时生效，Grok 通过 ACP 即时设置，pi 先存下、下一 turn 重建 worker 时生效；`/compact` 只有 Claude 渠道会话交给 SDK 原生处理，其余引擎调用适配器的 `compact()`（confirmed）。

| 命令 | claude | codex | grok | pi |
|---|---|---|---|---|
| `/model <id>` | 常驻会话存在、且新模型不需要换用另一套上下文 profile（3.4）时，调用 SDK 的 `setModel` 即时生效；需要换用时存为 `stored_pending_rebuild`，下一 turn 之前重建常驻连接；profile 无法解析时拒绝；其余情况存下，下一 turn 生效 | 存下并置 `pending_model_fork`，下一次 drain 从当前线程 fork | 已有 ACP 会话时调用 `session/set_model` 即时生效，否则存下 | 校验 `provider/modelId` 格式后存下；worker 的构造参数变了，下一 turn 重建 worker |
| `/effort <level>` | 即时应用或下一条消息生效；`max` 在不支持的模型上按 `high` 执行 | 下一条消息生效 | 应用到当前 ACP 会话 | 存下，下一 turn 重建 worker 时生效 |
| `/compact` | 渠道会话：作为输入交给 SDK 的原生压缩命令，会调用模型；非渠道会话：回复 `/compact is only available in interactive sessions.` | `thread/compact/start` | ACP 扩展方法 `_x.ai/compact_conversation`；会话尚未开始时返回提示 | worker 的 compact 帧 |

这些分支分布在三处（confirmed）。`/model` 的写入在会话管理器的 `setSessionModel` 方法里，四个分支各自把 `model_runtime` 写成对应的引擎名；回复文字在 `executeGatewayCommand (BXe)` 里按引擎给出，例如 Codex 会话回复 "Codex session — a switch takes effect from the next message."。`/compact` 在 drain 里分流：`if (ou === "/compact" && (n.runtime === "claude" || n.runtime === void 0))`（`drainSessionMailbox`）只拦下 Claude，渠道会话放行给 SDK，非渠道会话回复不可用；其余引擎进入 history-control 命令的处理函数（见下文），调用适配器的 `compact()`，成功时回复 `History compacted (runtime: …)`。

Codex 的延迟生效靠两个状态字段完成（confirmed）。每次 drain 开始，`clearModelOverrideOnRuntimeFlip (Rft)` 先检查存下的模型是不是为另一个引擎设的，是就清掉，避免把一个引擎的模型 id 交给另一个引擎；接着对非 stateless 的 Codex 会话，`resolvePendingModelFork (Ift)` 把 `pending_fork_to` 设为当前线程 id。Codex 适配器据此在 `thread/fork`、`thread/resume`、`thread/start` 三种请求中选一种，fork 失败时退回 `thread/start`。

history-control 类命令只有 `/compact` 一个：`runHistoryControlCommand (xft)` 只识别它，其他命令得到 `Unrecognized history-control command` 回复（confirmed）。运行时不提供撤销命令。命令在网关的分流见 6.2。

### 3.7 权限、工具白名单与认证

四个引擎在无人值守时都不向人请求权限，但各自用不同的机制达到这一点：Claude 默认 `bypassPermissions`，Codex 固定 `approvalPolicy: "never"` 并按沙箱级别限制写入范围，Grok 以 `--always-approve` 启动，pi 的 worker 没有权限参数；内建工具面只有 Claude 由 duoduo 按白名单指定，Codex 的内建工具无法关闭（confirmed）。

| 引擎 | 权限 | 内建工具面 | duoduo 自操作工具的挂载方式 | 思考输出 |
|---|---|---|---|---|
| claude | `permissionMode` 取运行配置值，否则 `ALADUO_PERMISSION_MODE`，否则 `bypassPermissions` | 显式白名单：`CLAUDE_CORE_TOOLS (Hh)` 的 15 个工具加 `claude.tools` 追加项；`disallowedTools` 只对 MCP 工具生效 | 进程内 MCP 服务器 `aladuo`，工具名为 `mcp__aladuo__<名称>` | 按会话推理力度交给 SDK |
| codex | `approvalPolicy: "never"`；沙箱级别由 `ALADUO_CODEX_SANDBOX` 决定 | Codex 自带，无法关闭；`disallowedTools` 被忽略并告警 | `dynamicTools` 挂在名为 `aladuo` 的命名空间下，并把该命名空间设为 direct-only | 握手时退订三类推理增量通知 |
| grok | 以 `--always-approve` 启动 | Grok 自带；agent profile 禁用它自己的 `scheduler_create`、`scheduler_list`、`scheduler_delete`、`monitor`、`workflow`、`update_goal` | 同一个 MCP 服务器，经 ACP 会话参数挂载 | 推理力度经 ACP 设置并校验是否生效 |
| pi | worker 的 init 帧不含权限参数 | pi 自带；worker 按 init 帧里的排除列表去掉工具，排除列表由运行配置的 `disallowedTools` 得来 | worker 内注册的自定义工具，其中四个经 daemon RPC 回调执行（4.1） | 以 `thinking_level` 交给 worker |

Claude 的权限回退是无条件的（confirmed）。Claude 适配器取 `let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`createAgentSdkAdapter`），而会话的运行配置只从基线复制 `permissionMode`，会话管理器给出的基线不含这个键，所以实际取值就是环境变量或 `bypassPermissions`，与运行模式无关。`system.config` 报告里的 `permission_mode` 在环境变量未设置时显示默认值 `"default"`（`buildSdkConfigReport (uyt)`），与实际使用的 `bypassPermissions` 不一致，排查权限问题时以适配器的取值为准（confirmed，静态阅读）。

Claude 的内建工具面是显式白名单（confirmed）。渠道与 job 会话把 `CLAUDE_CORE_TOOLS (Hh)` 的 15 个工具（Bash、Read、Write、Edit、Grep、Glob、Agent、TaskStop、Skill、ToolSearch、TaskCreate、TaskGet、TaskUpdate、TaskList、SendMessage）作为 `tools` 传给 SDK，渠道或 job 配置的 `claude.tools` 只能追加；后台分区用另一组 6 个工具，见 11.4。`allowedTools` 只决定自动批准，其中不在工具面上的内建工具会触发一条告警；`disallowedTools` 被拆成两部分，只有 `mcp__` 开头的项传给 SDK，内建工具名被忽略并告警（`allowlist-only via claude.tools`（`createAgentSdkAdapter`））。

Codex 的沙箱级别来自环境变量（confirmed；映射函数尚无真名）。适配器用一个映射函数把运行配置的 `permissionMode` 与构造时的沙箱参数合成沙箱级别，会话的运行配置不带 `permissionMode`，映射函数此时取构造参数；会话管理器构造 Codex 适配器时传入 `sandbox: ag()`（`createSessionManager`），即 `resolveCodexSandbox (ag)` 读出的 `ALADUO_CODEX_SANDBOX`：`read-only`、`danger-full-access`，其余值和未设置都是 `workspace-write`。

duoduo 的工具在 Codex 上以 `dynamicTools` 挂在命名空间 `aladuo` 下（`ALADUO_TOOL_NAMESPACE (u$)`），线程参数同时带上 `features.code_mode.direct_only_tool_namespaces`（`buildCodexDirectOnlyToolConfig (kV)`），使这些工具保持为模型可直接调用的工具（confirmed；"不设置时会被 Codex 的代码执行层包装"这一动机来自上游说明，未证实推测）。

Codex 适配器在握手时退订 `item/reasoning/summaryTextDelta`、`item/reasoning/summaryPartAdded`、`item/reasoning/textDelta` 三类推理增量通知（confirmed）。适配器仍保留处理这些通知的分支；Codex 是否因此不再发送推理文本，取决于 Codex 自己的实现，本包内看不到（未证实推测）。

Grok 的 agent profile 禁用的六个工具是 Grok 自己的调度与编排工具（`GROK_DISALLOWED_TOOLS (Xye)`，经 `GROK_AGENT_PROFILE (Qye)` 传入）（confirmed）；禁用它们是为了避免与 duoduo 的 job 调度重叠，这一动机属于未证实推测。

pi 的内建工具由 pi SDK 提供。worker 创建 pi 会话时以 init 帧里的 exclude_tools 作为排除列表、noContextFiles 为 true 关闭 pi 自己的上下文文件加载（pi-worker.js 字面量）（confirmed）。daemon 侧把运行配置的 `disallowedTools` 去重后填进这个排除列表；worker 构造之后排除列表再变化，只打一条告警，要等 worker 重建才生效；运行配置里 Claude 的内建工具面在 pi 上被忽略并告警（未证实推测：静态阅读所见，这几处位于尚无真名的 pi adapter 工厂，没有可检查的引用）。

认证按引擎分开，只有 Claude 由 duoduo 管理凭据来源（confirmed）：

- **Claude。** 来源取 `ALADUO_CLAUDE_AUTH_SOURCE`，其次是 `ALADUO_AUTH_SOURCE`（`readClaudeAuthSourceEnv (Q6)`），合法值为 `claude_code_local`、`anthropic_api_key`、`compatible_endpoint`。凭据以 `ANTHROPIC_*` 环境变量的形式写进宿主的 `.env`，daemon 启动时加载它们，引擎进程继承 daemon 的环境（7.3）。`anthropic_api_key` 使用 `ANTHROPIC_API_KEY`；`compatible_endpoint` 是 Anthropic 兼容端点，使用 `ANTHROPIC_BASE_URL` 与 `ANTHROPIC_AUTH_TOKEN`。来源为 `claude_code_local` 时，daemon 启动时删除 `HOST_MODEL_ENV_KEYS (K6)` 列出的全部变量，引擎使用本机 Claude Code 的登录状态，`system.config` 报告也不再列出这些变量。按模型 id 配置的端点与令牌见 3.4 的上下文 profile。
- **Codex 与 Grok。** 使用各自 CLI 的登录状态（`codex login`、`grok login`），可用性探测只检查 Codex 是否已登录（3.2）。
- **pi。** 使用 pi agent 目录下的 `auth.json` 与 `models.json`（3.2）。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 引擎取值只在一处定义，成员判定引用它 | `L0 = ["claude", "codex", "grok", "pi"]`（`initChannelProtocolModule`）；`isRuntimeKind (F0)`；`isSupportedRuntime (Aa)` | confirmed |
| 宿主默认值来自 `ALADUO_DEFAULT_RUNTIME`，不合法回到 claude | `return n.length === 0 ? "claude" : Aa(n) ? n : "claude"`（`resolveDefaultRuntime`） | confirmed |
| 渠道会话按实例、种类、默认取值并记来源标签 | `"inherited" : "default"`（`createSessionManager`） | confirmed |
| job 会话按 frontmatter、默认取值 | `? "explicit" : "default"`（`createSessionManager`） | confirmed |
| 来源标签只进告警日志；拒绝负载里的 runtime_source 另算，在 actor 上恒为 explicit | `but it is unavailable`（`createSessionManager`）；`runtime_source: n.runtime ? "explicit" : "default"`（`drainSessionMailbox`） | confirmed（静态阅读） |
| 分区 frontmatter 的 runtime 按四值校验，非法值回到默认 | `has invalid runtime frontmatter; falling back to global default`（`parsePartitionDefinition`） | confirmed |
| 其他会话缺省为 claude | `runtime: P?.runtime ?? K?.runtime ?? "claude"`（`createSessionManager`） | confirmed |
| ManageJob 建 job 时解析并写入 runtime | `let o = e.runtime ?? t.callerRuntime ?? Co()`（`runManageJobTool`） | confirmed |
| Claude 由 daemon 进程内调用 SDK，校验原生二进制；设了可执行文件路径就跳过校验 | `khe({`（`createAgentSdkAdapter`）；`[agent-sdk] native Claude Code binary for`（`verifyClaudeCodeRuntimeAvailable`）；`if (Zv(process.env.CLAUDE_CODE_EXECUTABLE)) return;`（`verifyClaudeCodeRuntimeAvailable`）；`r.pathToClaudeCodeExecutable = a`（`createAgentSdkAdapter`） | confirmed（SDK 内部的进程启动未证实） |
| Claude 探测 5 秒超时，结果缓存到退出，执行时读缓存 | `Rhe = 5e3`（`initAgentSdkAdapterModule`）；`probeClaudeAvailability ($he)`；`dc?.ok === !1 ? dc.reason : void 0`（`claudeUnavailableReason`）；`then restart the daemon.`（`renderRuntimeUnavailableGuidance`） | confirmed |
| Codex 是常驻 app-server 子进程，探测两步 | `this.proc = Est(this.binary, ["app-server"]`（`initCodexAppServerModule`）；`"logged in"`（`checkCodexAvailability`） | confirmed |
| Grok 是常驻 ACP 子进程，探测只有 `--version` | `"--always-approve"`（`createGrokAcpAdapter`）；`timeout: qst`（`checkGrokAvailability`）；`qst = 5e3`（`initGrokAcpRuntimeModule`） | confirmed |
| pi 运行包内 worker，无探测 | `"pi-worker.js"`（`resolvePiWorkerCommand`）；`command: process.execPath`（`resolvePiWorkerCommand`）；`encodePiWorkerFrame (IH)` | confirmed |
| 启动时探测并打印结果，pi 恒可用 | `"[pid0] available runtimes at boot"`（`main`） | confirmed |
| 两个列表与 ManageJob 的参数说明读启动缓存；ManageJob 列表在全部失败时仍放入 claude，channel.describe 不补 | `isClaudeAvailable (gB)`；`isCodexAvailable (Nf)`；`isGrokAvailable (OV)`；`e.length === 0 && e.push("claude"), e.push("pi")`（`listSelectableJobRuntimes`）；`u() && l.push("grok"), l.push("pi")`（`describeChannelInstance`）；`Combining it with runtime:'codex' is rejected`（`renderJobPromptModeDescription`） | confirmed |
| system.runtime.info 返回实例身份，不含引擎列表 | `runtime_mode: "host",`（`createDaemon`）；`S.method === "system.runtime.info"`（`createDaemon`） | confirmed |
| 创建 actor 时重新探测 codex、grok，失败不保留 | `p = u0e(d), m = e.grokAvailability ?? kc`（`createSessionManager`）；`checkCodexAvailability (Sc)`；`checkGrokAvailability (kc)`；`memoizeAvailabilityProbeUntilOk (u0e)` | confirmed |
| 先写 runtime 再探测，探测只针对 codex、grok | `v = w => w === "codex" ? p() : w === "grok" ? y() : void 0`（`createSessionManager`）；`but it is unavailable`（`createSessionManager`） | confirmed |
| 没有回落到 Claude 的分支 | `refusing to fall through to Claude`（`createSessionManager`） | confirmed |
| pi 没有模型时记为不可用原因 | `pi binds its model when the worker is built, and this session has none.`（`createSessionManager`） | confirmed |
| drain 以 runtime_unavailable 拒绝，claude 读启动探测结果 | `stage: "runtime_unavailable"`（`drainSessionMailbox`）；`n.runtime === "claude" ? Yv() : void 0`（`drainSessionMailbox`） | confirmed |
| 不可用提示按引擎生成 | `"- Nothing to install: the pi runtime ships inside duoduo."`（`renderRuntimeUnavailableGuidance`） | confirmed |
| 每次拿到会话 id 都记下所属引擎，/clear 清空，不符即以 runtime_mismatch 拒绝 | `mt.sdk_session_runtime = Ht`（`drainSessionMailbox`）；`sdk_session_runtime: null`（`createSessionManager`）；`stage: "runtime_mismatch"`（`drainSessionMailbox`） | confirmed |
| 不符提示对所有会话给出"改回去"，换引擎的做法按会话类型不同，并要求先摘要旧历史 | `"Session histories cannot move between runtimes, so choose one:"`（`renderRuntimeMismatchGuidance`）；`- Keep this session: set the runtime back to`（`renderRuntimeMismatchGuidance`）；`this job's owner decides whether the job starts a new session on`（`renderRuntimeMismatchGuidance`）；`If you switch, recover the prior work first`（`renderRuntimeMismatchGuidance`） | confirmed |
| 渠道会话把拒绝说明写成回复并返回拒绝阶段，其他会话走 handleDrainError 后抛错 | `if (to(t) === "channel") {`（`drainSessionMailbox`）；`refusedStage: Y`（`drainSessionMailbox`）；`handleDrainError (Xw)` | confirmed |
| 渠道会话的拒绝阶段结束 actor；其他会话的错误在外层 catch 结束 actor | `"[session-manager] runtime refusal, ending actor"`（`createSessionManager`）；`error in drain loop for`（`createSessionManager`） | confirmed |
| channel.spawn 改 runtime 前检查历史归属 | `let p = await N0e(e, t, i, s)`（`upsertChannelSpawnDescriptor`） | confirmed（检查函数与 session.config 处理函数尚无真名） |
| 分区引擎不可用或 pi 分区没有模型时写 agent.error 并跳过 | `outcome: "runtime_unavailable"`（`createMetaSession`）；`pi partition has no model: set`（`createMetaSession`） | confirmed |
| `/model` 的引擎解析不探测，只沿用 codex、grok、pi 的 actor 绑定 | `if (a?.runtime === "codex") return "codex";`（`createModelCommandResolvers`）；`if (a?.runtime === "pi") return "pi"`（`createModelCommandResolvers`） | confirmed |
| 模型与力度按引擎分键，校验一宽一严 | `"claude.effort": "effort_level"`（`CHANNEL_CONFIG_KEY_TYPES`）；`!/\s/.test(r)`（`validateConfigValue`）；`qi.includes(e)`（`isEffortLevel`） | confirmed（五个取值定义在尚无真名的模块初始化器里） |
| 三层逐键合并，后层胜出，读取时带层名 | `source: "kind"`（`buildEffectiveChannelConfig`）；`mergeRuntimeModelLayers (sbe)`；`mergeRuntimeEffortLayers (abe)`；`foldConfigLayersByKey (z$)`；`readRuntimeModelSetting (Mw)`；`readRuntimeEffortSetting (jw)` | confirmed |
| 模型 job 优先，力度会话优先 | `let t = e.jobModel ?? e.sessionModel`（`resolveTurnModelWithLayer`）；`let t = e.sessionEffort ?? e.jobEffort`（`resolveTurnEffortWithLayer`） | confirmed |
| 会话级模型与推理力度只能在渠道会话上设置 | `reason: "forbidden_kind"`（`readOrSetSessionModel`）；`reason: "forbidden_kind"`（`readOrSetSessionEffort`） | confirmed |
| pi worker 的模型取值顺序 | `Ve?.model_runtime === "pi" ? Ve.model : void 0`（`createSessionManager`） | confirmed |
| 记录请求来源与实际服务的模型 | `modelOrigin: cr.configLayer`（`drainSessionMailbox`）；`mt.last_served_model = Xe`（`drainSessionMailbox`）；`extractServedModelFromUsage (MSe)` | confirmed |
| 上下文 profile 三层逐键合并 | `profiles: o?.claudeModelProfiles`（`buildEffectiveChannelConfig`） | confirmed |
| 模型 id 按原生、已登记、未登记分类 | `kind: "native-claude"`（`classifyModelContextRequirement`）；`kind: "profiled-external"`（`buildProfiledExternalRequirement`） | confirmed |
| 已登记模型的窗口、端点、令牌与 tier 别名写进 SDK settings | `n?.kind === "profiled-external" && (t[sut] = String(n.requiredMaxContextTokens)`（`buildClaudeSettingsEnvOverrides`）；`sut = "CLAUDE_CODE_MAX_CONTEXT_TOKENS", aut = "ANTHROPIC_BASE_URL"`（`initMaterializedClaudeSettingsModule`）；`anthropic_auth_token: "ANTHROPIC_AUTH_TOKEN"`（`initMaterializedClaudeSettingsModule`）；`opus: "ANTHROPIC_DEFAULT_OPUS_MODEL"`（`initMaterializedClaudeSettingsModule`） | confirmed（写 settings 文件的函数尚无真名） |
| profile 无法解析时 /model 被拒 | `reason: "profile_error"`（`createSessionManager`）；`Fix the offending claude.model_profiles entry (global = kernel/config/runtime.md`（`executeGatewayCommand`） | confirmed |
| 分区模型只读 frontmatter 与全局层 | `ae = S.model ?? Ie.runtimeModels?.[W]?.model`（`createMetaSession`） | confirmed |
| Claude 不支持 max 时按 high 执行 | `On a model without max support the Claude SDK runs it as high.`（`executeGatewayCommand`） | confirmed |
| job 叠加的四种合并方式 | `prompt_mode: t.prompt_mode ?? e.prompt_mode`（`applyJobSdkConfigOverride`）；`claudeTools: rbe(e.claudeTools, t.claudeTools)`（`applyJobSdkConfigOverride`）；`source: "instance"`（`applyJobSdkConfigOverride`）；`piConfigIssues: lbe(e.piConfigIssues, t.piConfigIssues)`（`applyJobSdkConfigOverride`） | confirmed |
| 与基线取并集，同时出现在两表的工具算允许 | `s = i?.filter(l => !o.has(l))`（`buildTurnSdkRunConfig`） | confirmed |
| 叠加以锚点事件的有效配置为底 | `h = KV(await Eo(s, "effective_config_ms", async () => YV(e, u.event)), n.jobContext?.sdkConfig)`（`prepareDrainTurnContext`） | confirmed |
| 定时运行的锚点事件来源为 cadence | `kind: "cadence"`（`scanAndSpawnDueJobs`） | confirmed |
| 只有 pi 读种类 job 的配置 | `channel_kind: "job"`（`createSessionManager`） | confirmed（静态阅读，未实测） |
| job 文件每次迭代重读 | `vr ? Ht = await a.getJob(w.jobId)`（`createSessionManager`） | confirmed |
| 不合法的 prompt_mode 与 effort 被忽略 | `o && (s.prompt_mode = o)`（`parseJobFileFrontmatter`）；`"[JobManager] ignoring invalid job effort"`（`parseJobFileFrontmatter`） | confirmed |
| codex 上的 prompt_mode 只告警 | `"[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert"`（`createSessionManager`） | confirmed |
| 附加目录会重新打开 CLAUDE.md 自动加载 | `return n.some(s => $Se(s) !== i) ? void 0 : !1`（`resolveAdditionalDirClaudeMdAutoload`）；`CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1"`（`createAgentSdkAdapter`） | confirmed（记忆板是否被重复加载未实测） |
| `/model` 的回复与写入按引擎分支 | `"Codex session — a switch takes effect from the next message."`（`executeGatewayCommand`）；`"Model stored; the Claude runtime will rebuild before the next turn because the context profile changed."`（`executeGatewayCommand`）；`pending_model_fork: !0`（`createSessionManager`）；`"provider/modelId"`（`createSessionManager`） | confirmed |
| `/effort` 的生效时机按引擎分支 | `"Grok session — a switch applies to the live session."`（`executeGatewayCommand`）；`"Pi session — a switch is stored and the worker rebuilds with it on the next turn."`（`executeGatewayCommand`） | confirmed |
| `/compact` 只拦 Claude，其余引擎调用适配器 | `/compact is only available in interactive sessions.`（`drainSessionMailbox`）；`"thread/compact/start"`（`createCodexAppServerAdapter`）；`GROK_ACP_COMPACT (n_e)`；`Unrecognized history-control command`（`runHistoryControlCommand`）；`History compacted (runtime:`（`runHistoryControlCommand`） | confirmed |
| Codex 的模型切换靠 fork 生效 | `"[runner] cleared session model override on runtime flip"`（`clearModelOverrideOnRuntimeFlip`）；`"[runner] resolved pending_model_fork at codex drain start"`（`resolvePendingModelFork`）；`"[codex-adapter] thread/fork failed, falling back to thread/start"`（`createCodexAppServerAdapter`） | confirmed |
| Claude 权限无条件回退到 bypassPermissions | `let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`createAgentSdkAdapter`）；`permissionMode: e.permissionMode`（`buildTurnSdkRunConfig`） | confirmed |
| 配置报告显示的权限默认值与实际不同 | `permission_mode: qn("ALADUO_PERMISSION_MODE", "default")`（`buildSdkConfigReport`） | confirmed（静态阅读） |
| Claude 内建工具面为显式白名单，disallowedTools 只管 MCP | `"TaskStop", "Skill", "ToolSearch"`（`CLAUDE_CORE_TOOLS`）；`allowlist-only via claude.tools`（`createAgentSdkAdapter`）；`splitDisallowedToolsForClaude (Phe)` | confirmed |
| Codex 不请求批准，沙箱级别来自环境变量 | `approvalPolicy: "never"`（`createCodexAppServerAdapter`）；`sandbox: ag()`（`createSessionManager`）；`v = Nst(f.permissionMode, n.sandbox)`（`createCodexAppServerAdapter`）；`e === "danger-full-access" ? "danger-full-access" : e === "read-only" ? "read-only" : "workspace-write"`（`resolveCodexSandbox`） | confirmed（映射函数尚无真名） |
| Codex 内建工具不可关闭 | `"[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled"`（`createCodexAppServerAdapter`） | confirmed |
| duoduo 工具在 Codex 上挂在 aladuo 命名空间 | `type: "namespace"`（`createCodexAppServerAdapter`）；`u$ = "aladuo", Pst = "features.code_mode.direct_only_tool_namespaces"`（`initCodexAppServerModule`） | confirmed |
| Codex 推理增量通知被退订 | `"item/reasoning/summaryPartAdded", "item/reasoning/textDelta"`（`createCodexAppServerAdapter`） | confirmed（退订请求）；Codex 是否因此不发推理文本为未证实推测 |
| Grok 自带的调度与编排工具被禁用 | `Xye = ["scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal"]`（`initGrokAcpRuntimeModule`）；`agentProfile: Qye`（`createGrokAcpAdapter`） | confirmed（禁用动机未证实） |
| Claude 认证来源三值，claude_code_local 启动时清除 ANTHROPIC 变量 | `let t = e.ALADUO_CLAUDE_AUTH_SOURCE ?? e.ALADUO_AUTH_SOURCE`（`readClaudeAuthSourceEnv`）；`isClaudeAuthSource (Xct)`；`Q6(process.env) === "claude_code_local" && u(process.env)`（`main`）；`"ANTHROPIC_BASE_URL"`（`HOST_MODEL_ENV_KEYS`） | confirmed |
| 凭据写入宿主 .env，兼容端点使用 ANTHROPIC_BASE_URL | `o = Zct(e)`（`writeHostModelEnvConfig`）；`t.baseUrl && (e.ANTHROPIC_BASE_URL = t.baseUrl)`（`applyHostModelEnvVars`） | confirmed |
| Codex 与 Grok 依赖各自 CLI 的登录 | `"Codex CLI is installed but not authenticated. Run 'codex login' to sign in."`（`checkCodexAvailability`）；`Install it and run 'grok login'.`（`checkGrokAvailability`） | confirmed |
| pi 使用 pi agent 目录的凭据文件 | `authPath: Uc.join(pn, "auth.json")`（`createSessionManager`） | confirmed |

## 4 自操作工具

duoduo 在引擎自带的工具之外给模型追加六个自操作工具：ManageJob（创建和查看 job）、RemindDuoduo（给自己预约一次以后的 turn）、ViewSessions（查看会话）、Notify（向另一个会话投递通知）、QueueOutboundAttachment（把文件排进这一轮的出站附件）和 Skip（这一轮不向用户输出）。哪些会话拿到哪些工具由会话来源决定：渠道会话六个都有，job 会话没有 QueueOutboundAttachment 与 Skip，system 来源的会话和后台分区只有 ViewSessions 与 Notify，pi 引擎上这两类会话另外多一个 ManageJob。工具体由 daemon 执行，输入在代码里检查：ManageJob 只接受 create、list、read 三个动作且 `action` 必填；Notify 在目标渠道会话有未读输出、并且超过阈值（默认 1 小时）没有消费者取走时拒绝投递；Skip 在 Claude 上由 PreToolUse hook 结束这一轮，在 pi 上由 worker 自己中止这一轮，在 Codex 与 Grok 上不中断这一轮，但无论哪个引擎，drain 都丢弃这一轮的输出（confirmed）。4.1 讲分配规则和各引擎的注册差异，4.2 到 4.5 逐个讲工具的检查规则。本节对应 GUIDE 1.6。

### 4.1 六个工具与按会话来源的分配

工具体（tool body）在 Claude、Codex、Grok 上共用：Claude 与 Grok 经进程内 MCP 服务器 `aladuo` 调用，Codex 经 app-server 的 dynamic tools 调用。pi 在 worker 进程里注册自己的工具定义，其中四个经 daemon 的 RPC 回调同一组工具体，另外两个在 worker 内应答、由 daemon 在工具结束时补做处理（confirmed）。除挂载方式外，四个引擎的注册规则和参数 schema 也不同，见下文。

| 工具 | 作用 | pi worker 的调用路径 |
|---|---|---|
| ManageJob | 创建、列出、读取 job（4.2） | 回调 `job.manage` |
| RemindDuoduo | 渠道会话：到时给本会话投递一次提醒；job 会话：给本 job 再排一次运行（4.4） | 回调 `wake.set` |
| ViewSessions | 只读地列出全部会话或查看一个会话（4.4） | 回调 `session.manage` |
| Notify | 把一段通知写进另一个会话的邮箱并唤醒它（4.3） | 回调 `notify.send` |
| QueueOutboundAttachment | 把一个文件排进这一轮结束时发出的附件（4.5） | worker 内应答，daemon 在工具结束时校验并入队 |
| Skip | 这一轮不向用户输出任何内容（4.5） | worker 内停止这一轮，daemon 在工具结束时记录 |

分配规则由会话来源决定（confirmed）。会话管理器在每次 drain 开始时由 actor 的 `origin` 算出工具上下文：`let Y = w.origin === "job" ? "job" : w.origin === "system" ? "system" : "foreground"`（`createSessionManager`），渠道会话对应 foreground。后台分区不经过会话管理器，`createMetaSession (Wgt)` 直接以 `meta` 上下文构造工具；pi 分区改用 `system`，因为 pi worker 只识别 foreground、job、system 三种上下文，其他值会被当作 foreground（pi-worker.js 静态阅读）。system 来源指会话键以 `system:`、`meta:` 或 `cadence:` 开头、经会话管理器唤醒的 actor（未证实推测：从会话键前缀推断来源的函数已在 pretty bundle 读到，但没有真名，缺可检查的引用；另见 8.1）。

| 会话 | 工具上下文 | ManageJob | RemindDuoduo | ViewSessions | Notify | QueueOutboundAttachment | Skip |
|---|---|---|---|---|---|---|---|
| 渠道会话 | foreground | 有 | 有 | 有 | 有 | 有 | 有 |
| job 会话 | job | 有（job 版描述，create 只对 keepalive job 开放） | 有（job 版，只接受 `when`） | 有 | 有（可省略目标，默认发给 owner） | 无 | 无 |
| system 来源的会话 | system | 无；pi 上有 | 无 | 有 | 有 | 无 | 无 |
| 后台分区 | meta（pi 分区为 system） | 无；pi 上有 | 无 | 有 | 有 | 无 | 无 |

Claude、Grok、Codex 的注册代码按同一条规则分配（confirmed）：`createAladuoMcpServer (Yg)` 在上下文为 meta 或 system 时跳过 ManageJob 与 RemindDuoduo，只在 foreground 时注册 QueueOutboundAttachment 与 Skip；`buildCodexDynamicTools (wA)` 用同样的判断。Claude 会话的自动批准列表也按 origin 分档：system 来源不含 ManageJob 与 RemindDuoduo，渠道会话再追加 QueueOutboundAttachment 与 Skip。这份列表就是 3.5 所说的基线，job frontmatter 里的 `allowedTools` 只能在它之上增加。

pi 的注册规则与其余三个引擎不同（confirmed，静态阅读，未实测）。pi-worker.js 注册 ManageJob 与 ViewSessions 时不看工具上下文，只在上下文为 "system" 时不注册 RemindDuoduo，只在 "foreground" 时注册 QueueOutboundAttachment 与 Skip；daemon 处理 `job.manage` 回调时只校验 worker 口令，不校验上下文。因此 pi 上的后台分区和 system 来源的会话能调用 ManageJob create，创建出的 job 以该会话为 owner；Claude、Codex、Grok 上这两类会话看不到这个工具。包内的 `bootstrap/pi-runtime.md` 写的是 pi 会话拿到五个工具（没有列出 RemindDuoduo）、后台分区没有 ManageJob，两点都与 pi-worker.js 的注册代码不符，以代码为准。分区可用工具的完整规则见 11.4。

pi 的回调经 daemon 的控制面进入同一组工具体。worker 从环境变量拿到 socket 路径和按会话签发的口令，口令绑定会话键、job 的调度规则和工具上下文；带口令的调用只能使用上表的四个方法，这四个方法也只接受带口令的调用（口令检查见 6.1）。daemon 以口令绑定的会话身份执行，ManageJob 的调用方引擎固定记为 `callerRuntime: "pi"`（`createDaemon`）。

工具描述按上下文变化，参数 schema 按引擎变化（confirmed，下文标注未证实推测的几处除外）。在 job 会话里，ManageJob 换一份描述（参数不变），RemindDuoduo 换一份描述和参数；Notify 的描述按 job、meta、foreground、system 四种上下文各有一份，job 会话里的 `target_session_key` 是可选参数。Claude 与 Grok 的 MCP 服务器直接以 zod 定义注册参数 schema，枚举、必填与默认值在调用前的参数校验中生效（4.2），每个 MCP 工具还带 `"anthropic/alwaysLoad": !0`（`createAladuoMcpServer`）标记，按字面意思是要求 Claude Code 始终加载这些工具定义，Claude Code 实际如何处理这个标记未验证（未证实推测）。Codex 的 dynamic tools 用一个尚无真名的转换函数生成 schema，它把每个参数都声明为 `type: "string"`，保留必填列表，但不保留枚举和默认值（未证实推测：转换函数已读到，但没有真名，缺可检查的引用）；ManageJob 的布尔参数 `stateless` 和数组参数 `allowedTools` 在 Codex 上能否按原类型传到工具体，未实测（未证实推测）。pi 用 zod 自带的转换生成 JSON schema（pi-worker.js 静态阅读），pi SDK 是否在执行工具前按 schema 校验参数，本包内看不到（未证实推测）。Codex 上工具挂在 `aladuo` 命名空间下的方式见 3.7。

### 4.2 ManageJob

ManageJob 只有 create、list、read 三个动作，`action` 必填（confirmed）。在 Claude 与 Grok 上，参数 schema 把 `action` 定义为不可省略的三值枚举（`action: ft.enum(["create", "list", "read"])`（`initManageJobToolModule`）），随包的 MCP SDK 在调用工具体之前按 schema 校验参数，缺少 `action` 或取值不在枚举内时直接返回 "Input validation error: Invalid arguments for tool ManageJob"，工具体不运行（confirmed，静态阅读；校验代码属于随包的 MCP SDK，不是 duoduo 自己的模块，没有真名可引用）。所以这两个引擎上的模型看不到工具体里的错误文字；把结束、打断 job 引向 shell 的说明写在 `action` 参数的描述里（`Stopping a job and re-arming one are not actions here`（`initManageJobToolModule`）），描述写明 `duoduo job archive <id>` 与 `duoduo job interrupt <id>` 是 shell 命令，job 想再运行一次自己时调用 RemindDuoduo（confirmed）。

工具体自己的动作检查只在不强制枚举的路径上起作用（confirmed，静态阅读）。Codex 的 dynamic tools schema 把 `action` 列为必填，但只声明为字符串（4.1，这一点属未证实推测），所以 archive、reschedule 这类取值能到达工具体：缺少 `action` 时报 "action is required: create | list | read"，archive 得到一段说明文字，指向 `duoduo job archive` 与 `duoduo job interrupt`；reschedule 得到的说明指向 RemindDuoduo 和 `duoduo job reschedule`；其他取值得到 `Unknown action` 错误（`throw i === "archive" ? new Error(kat) : i === "reschedule" ? new Error(xat)`（`runManageJobTool`））。结束、打断、改期属于运维动作（10.4）。Codex 是否在调用前按必填列表拦下缺少 `action` 的调用，取决于 Codex 的实现，未验证；pi 上是否会走到工具体的这些检查，取决于 pi SDK 是否校验参数（4.1），同样未验证（未证实推测）。

create 做三类检查，任何一项不满足都不写文件（confirmed）。

第一类是调用方能否创建。渠道会话可以创建；job 会话里只有调度规则为 keepalive 的 job 可以创建，而且不能再创建 keepalive job。两段拒绝文字说明了原因：非 keepalive 的 job 是执行者，想要新 job 时应当用 Notify 告诉 owner、由 owner 决定，想再运行一次应当调用 RemindDuoduo；keepalive 的会话不会自己结束，允许它创建 keepalive 会让常驻会话数量没有上限。system 来源的会话与后台分区在 Claude、Codex、Grok 上没有这个工具（4.1）。

第二类是必填字段与取值。id、cron、instruction 必填；`model` 必填，不从宿主默认值继承，拒绝文字给出的理由是宿主默认模型可能是最贵的那个，继承它等于在无意中做了一个花费决定；`acceptance`（验收标准）必填，要求写成可以检查的条件。模型 id 不能含空白，引擎为 pi 时必须是 `provider/modelId` 形式；`effort` 必须是 3.4 所列五个值之一；`stateless` 不能与 keepalive 同时使用；`prompt_mode` 不能与 codex 引擎同时使用。调度规则能否解析、`cwd_rel` 目录是否存在并包含 `CLAUDE.md`，由 job 管理器在写文件时检查（10.1）。

第三类是引擎。create 按"参数、调用方会话的引擎、宿主默认值"的顺序解析引擎（`let o = e.runtime ?? t.callerRuntime ?? Co()`（`runManageJobTool`））。Claude 与 Grok 的 MCP schema 给 `runtime` 设了默认值，调用方的引擎在可选列表里就取它，否则取列表第一项（`buildJobRuntimeSchemaField (f_e)`），MCP 校验时这个默认值被填进参数；可选列表来自 daemon 启动时的探测缓存（3.2）。Codex 的 schema 不带默认值，参数缺省时取调用方引擎 codex；pi 的 schema 列出全部四个值、默认值为 pi（pi-worker.js 静态阅读），不读 daemon 的探测缓存。解析结果为 codex 或 grok 时，create 当场再运行一次对应 CLI 的探测，不可用就拒绝创建；claude 与 pi 在这里不探测。job 创建时可用、运行时不可用的情况由 3.3 的 `runtime_unavailable` 处理。

创建成功后，工具体把调用方会话写为 owner（`owner_session: t.sessionKey`（`runManageJobTool`）），发出总线事件 `job.created`，job 调度器收到后立即扫描一次（10.2）。返回文字附带一段投递说明：失败会唤醒 owner，成功要等 owner 下一次有 turn 时才送达，需要即时送达就在任务书里要求 job 调用 Notify（10.3）。job 可以携带的 SDK 配置键（`prompt_mode`、`allowedTools`、`disallowedTools`、`additionalDirectories`、`extra_tools`）及其合并方式见 3.5，其中 `extra_tools` 写进文件时改名为 `claude.tools`。

list 返回全部活动 job 和尚未触发的 RemindDuoduo 提醒记录（类型为 wake），每个 job 带调度规则、引擎、模型、推理力度、owner、定义文件与状态文件路径、用量账本路径、上次运行时间与结果。read 依次查找提醒记录、活动 job 和已归档 job：活动 job 的定义文件无法解析时返回 invalid 及原因，已归档的 job 以 `[ARCHIVED]` 开头，并说明重建会从新的调度状态和新会话开始（confirmed）。

### 4.3 Notify 与拒投规则

Notify 把 `notify_content` 作为一条 `route.deliver` 事件追加进事件日志、在目标会话邮箱写入指针，再以抢占级别 `preempt: never` 唤醒目标，所以不会打断目标正在执行的 turn（confirmed）。Notify 工具体与投递函数里的拒绝条件分三类：调用本身不合格（内容为空、通知链深度达到 5、目标是调用方自己、目标无法解析、job 会话省略目标而找不到它的 job 定义或 job 没有记录 `owner_session`）；目标会话已归档或正在归档；目标是没有读者的渠道会话（第二类、第三类与目标解析 confirmed；第一类中其余的检查位于没有真名的 Notify 工具体和 job owner 解析函数，代码已读到但缺可检查的引用，属未证实推测）。第一类是一般的输入校验，第三类是按"有没有人会读到"做的判断，只作用于渠道会话。此外工具体在调用上下文缺失（没有运行时总线、没有当前会话键）时也报错，这两种情况不由模型的参数决定。

目标由 `target_session_key` 指定。job 会话可以省略它，此时发给 job 文件里的 `owner_session`；其他会话必须指定。显式目标的解析顺序是：已持久化的会话键原样匹配（`if (n in r) return n; let o = await j_e(e, i)`（`resolveNotifyTargetSessionKey`））；否则按显示名别名匹配，唯一命中即用；多个会话同名时报错并按最近活动时间列出这些会话，要求用完整会话键重试；都不命中时报错，列出与目标编辑距离不超过 3 的会话键（`z_e = 3`（`initNotifyToolModule`））、其他前台会话，以及"后台会话收到通知不会让用户看到"的提示（confirmed）。解析出的目标（包括默认的 owner）等于调用方自己的会话键时，调用直接报错（未证实推测：检查位于没有真名的 Notify 工具体，代码已读到但缺可检查的引用）。

在 job 会话和渠道会话里，Notify 另有两个可选参数 `correlation_id` 与 `reply_to`：发起请求的一方给出一个标签，回复的一方原样回填；目标会话收到的 `<session-notify>` 块把两者渲染成属性（`"notify_correlation_id"`（`renderMailboxEventPrompt`）），使双方能在各自的历史里把请求与回复对上（渲染 confirmed；这两个参数只在 job 与渠道会话提供，这一点位于没有真名的 Notify schema 构造函数，属未证实推测）。

通知链深度用来阻止会话之间互相通知形成循环（上限常量与深度来源 confirmed；达到上限即报错的比较位于没有真名的 Notify 工具体，属未证实推测）。drain 取本批事件里最大的 `notify_depth`，经批次回调交给会话管理器；Notify 写出的事件深度等于构造工具集时拿到的深度加一，达到上限 5 就报错。深度在构造工具集时按值复制，而多数路径并不为每一批重建工具集，所以深度只在部分路径上逐跳累加：

- Claude 一次性调用（job 与 system 会话）每次运行都重建 MCP 服务器，深度随每一批更新。
- Claude 常驻流式会话只在创建或重建流式查询时构造 MCP 服务器（`E = l.mcpServersFactory ? l.mcpServersFactory() : l.mcpServers`（`createClaudeStreamingSessionFactory`）），复用查询时新构造的服务器被丢弃，深度停在查询创建那一批的值。
- Grok 只在 ACP 会话第一次运行时构造 MCP 服务器（`!e.mcpServerFactory || p || (m = e.mcpServerFactory(), p = new PV, await m.instance.connect(p))`（`createGrokAcpAdapter`）），之后深度不再更新。
- Codex 在构造适配器时就把深度写进 dynamic tools（`notifyDepth: Et,`（`createSessionManager`）），此时本批的深度尚未设置，所以恒为 0。
- pi 的 `notify.send` 回调不传深度，工具体按 0 计算。

因此这条循环保护只在 Claude 一次性调用上逐跳生效，在其余路径上只在新建的流式查询、Grok 会话或 Codex 适配器的第一个 turn 上反映当时的深度；对真实循环的实际效果未实测（未证实推测）。

投递由 `deliverRouteEventToSession (Ps)` 完成（confirmed）。目标正在归档或已归档时返回 `session_archiving` 或 `session_archived`，不写事件；否则追加 `route.deliver` 事件、写邮箱指针并发出唤醒，事件类型为 notify 时抢占级别固定为 `never`。返回文字由 `renderNotifyDeliveryReport (V_e)` 生成，逐个目标写明成功、拒绝或出错；只要有一个目标没投成，整个调用以错误形式返回。

"没有读者"的判断由 `evaluateNotifyConsumerRefusal (P$)` 做，只对渠道会话生效，job、system、meta 目标不受影响（confirmed）。判断用的是目标会话的投递游标：渠道适配器每取走一批输出就推进自己的游标（6.3），函数取推进得最远的那个消费者，数出它之后还有几条未读输出，并取最近一次游标推进的时间；从来没有消费者时，全部输出都算未读，时间从最早一条未读输出算起。未读输出多于 0 条、且距那个时间超过阈值小时数时，判为没有读者。阈值读环境变量 `ALADUO_NOTIFY_UNCONSUMED_HOURS`，未设置或不是数字时取默认值 1 小时（`BV = "ALADUO_NOTIFY_UNCONSUMED_HOURS", R$ = 1`（`initNotifyConsumerStalenessModule`））；设为 0 或负数关闭这项检查。只要没有未读输出，无论多久没有消费者都照常投递。当前阈值显示在 `system.config` 报告的 `notify_unconsumed_hours` 字段。

判为没有读者时，事件仍追加进事件日志，但只写日志、不写邮箱指针、不唤醒，负载里带 `notify_refused_reason`；工具返回的错误文字由 `renderNotifyRefusalMessage (C$)` 生成，写明已等待多久、积压几条，声明 "Nothing was delivered. This call will not be retried."，再列出同一时限内有消费者取过输出的其他渠道会话（`listSessionsWithRecentConsumer (Wat)`，按最近取走时间排序），建议必要时改投给其中一个，并在正文开头说明这条消息原本发给谁；一个这样的会话都没有时，文字要求不要重发（confirmed）。

从 shell 投递的通知走另一条路径（confirmed）。RPC `session.notify`（CLI `duoduo session notify`）由 `deliverExternalSessionNotify (A0e)` 处理：目标按会话键或别名解析，只接受渠道会话和 job 会话（8.5）；同样做"没有读者"的检查，参数 `force` 为真时跳过（`if (!r.force) {`（`deliverExternalSessionNotify`）），被拒时返回 `no_consumer`；投递的事件类型是 `external.notify`，抢占级别同样是 `never`。

Notify 还影响 job 的结果投递：job 会话在一次运行中调用过 Notify，这次运行成功时就不再自动给 owner 投递成功回执，理由是已经有人被告知（10.3）（confirmed）。

工具端解析目标时，会话键原样匹配发生在任何 orphan 过滤之前，orphan 过滤只影响别名匹配和候选列表。因此向一个 job 已归档或已重建、但会话目录仍在的 job 会话键发 Notify，会照常写入它的邮箱并唤醒它；按代码路径，这个 actor 只记一条 `"[session-manager] job-origin actor has no matching active job"`（`createSessionManager`）警告后继续 drain，是否会在没有任务书的情况下调用模型，未实测（未证实推测）。

### 4.4 RemindDuoduo 与 ViewSessions

RemindDuoduo 让一个会话给自己预约以后的一次 turn，在渠道会话和 job 会话上语义不同：渠道会话写一条一次性的提醒记录，到时把 `context` 投递回本会话；job 会话不写新记录，而是给本 job 再排一次运行（confirmed）。

在渠道会话里，工具要求 `when` 与 `context` 两个参数，描述要求把 `context` 写给一个"什么都不记得的自己"：为什么要回来、第一步做什么、证据在哪里、谁在等、这一轮来晚了怎么办。工具体调用 job 管理器写一条类型为 wake 的记录，owner 固定为调用方会话（`"A wake record needs an owner session — the caller is always the target."`（`initJobManagerModule`）），所以只能提醒自己，不能指定别的会话。到期后由 job 扫描器（10.2）把记录作为一条 self-wake 事件投递给 owner，抢占级别为 `never`，不打断正在执行的 turn；记录随即归档，所以只触发一次。模型收到的是一个 `<self-wake>` 块，写明这不是用户消息、也不代表工作已经完成，要求模型评估现有证据后继续工作、回复用户或调用 Skip（`renderMailboxEventPrompt (RO)`）。ManageJob list 会列出待触发的提醒，`duoduo job archive <id>` 可在触发前取消（10.4）。shell 侧对应的 RPC 是 `session.wake`，它创建同样的记录，只接受渠道会话和 job 会话（8.5）。

在 job 会话里，工具只接受 `when`，把本 job 状态文件的 `run_at` 改成这个时间，调度规则不变：周期 job 在原有节奏之外多运行一次，一次性 job 因此不会在本次运行结束时自动归档；第二次调用覆盖前一次的时间（confirmed）。两种用法对 `when` 的要求相同：接受 `@in <时长>` 或带显式时区的 ISO 时间，不带时区的时间和不晚于当前时刻的时间都被拒绝，因为一个已经过去的 `run_at` 会在 job 收尾时被当作已消费，一次性 job 的循环会就此结束而没有任何提示（confirmed；解析函数尚无真名，拒绝理由见工具描述）。

ViewSessions 是只读工具，描述写明它不创建、恢复或修改任何东西（confirmed）。不带参数时，它列出全部活动会话，分为 Foreground（渠道会话）和 Background（job、meta、system 等其余类别）两组，每行标出类别、别名、调用方自己的 `(you)`，以及 job 已归档或重建、不会再运行的 orphan 会话；已归档的会话不列出。带 `session_key` 时，它返回这个会话的类别、状态、引擎侧会话 id、工作目录、workspace，以及 `meta.md`、`state.json`、ingress 快照、job 目录和 channels 目录的路径；会话已归档时只说明归档位置，并提示不要把它当作活动会话。Notify 的目标、job 与附件需要的 `session_key` 都从这个列表里取，Notify 与 QueueOutboundAttachment 的参数说明也指向它。

### 4.5 Skip 与 QueueOutboundAttachment

Skip 与 QueueOutboundAttachment 只注册给渠道会话，两者处理的都是送给用户的输出（confirmed）。Skip 让这一轮不向用户输出：四个引擎结束这一轮的方式不同，drain 得知"这一轮已被跳过"的途径有三种（Claude 靠 hook 设的标记，pi 靠适配器自己报告，Codex 与 Grok 靠会话状态里的 Skip 记录），但判定之后的处理相同，都是丢弃这一轮的输出，并在下一个用户消息 turn 里告诉模型上一轮被跳过（confirmed，pi 适配器自报一项除外，见下文）。

| 引擎 | 模型看到的描述 | 调用 Skip 之后这一轮如何结束 | drain 如何得知这一轮被跳过 |
|---|---|---|---|
| claude | 原版："Calling Skip immediately ends this turn." | PreToolUse hook 返回 `continue: false` 与 `stopReason`，SDK 结束这一轮 | 常驻流式会话：hook 在当前 turn 上记 `skipCalled`，结果带 `skipped`；一次性调用的规则见下文 |
| codex | 把上面那句换成 "After you call Skip, nothing further you produce this turn will be delivered." | 不中断；工具结果要求模型立即停止，模型自己结束这一轮 | 工具体写入的 Skip 记录不早于这一轮开始时刻 |
| grok | 原版 | 不中断；适配器只记录观察到 Skip，ACP `session/cancel` 只在中止或出错时发送 | 同 codex |
| pi | 原版（pi-worker.js 字面量） | worker 内的 Skip 工具清空队列并中止这一轮（pi-worker.js 字面量 "[pi-worker] skip local stop failed:"） | 适配器自报 skipped；daemon 另写 Skip 记录供 skip-rewind 使用 |

工具说明写明 `In a turn you decide to skip, make Skip your FIRST action.`（`initSkipToolModule`），并提醒在 Skip 之前流出的文字仍可能到达用户（confirmed）。已经渲染出去的内容能否撤回，取决于渠道适配器是否处理 `stream_end` 的 `skipped` 原因（见本节后文）。

Claude 的 hook 注册在两处：常驻流式会话的 hooks 对象（`createClaudeStreamingSessionFactory (s0e)`）和一次性调用的 SDK 选项，matcher 都是 Skip 的完整工具名 `mcp__aladuo__Skip`（confirmed）。hook 对每次 Skip 调用都返回 `stopReason: "The agent intentionally ended this turn silently by calling Skip."`（`createClaudeStreamingSessionFactory`）；只有主代理的调用（hook 输入不带 `agent_id`）才把当前 turn 标记为 `skipCalled`，所以子代理调用 Skip 不会让父 turn 的输出被丢弃。被标记的 turn 不再接收插话：PostToolUse hook 对它直接返回空结果，插话回调也不把新消息暂存到它上面，新消息改为下一个 turn 处理（7.4）。SDK 在 hook 返回 `continue: false` 之后是否还执行 Skip 的工具体，由 SDK 决定；如果不执行，Claude 会话就不会写入 Skip 记录，下一轮也就没有 `<skip-rewind>` 块（未证实推测，见第 14 节）。

一次性调用的适配器用三个标记记录 Skip，规则与常驻流式会话不同（confirmed，静态阅读）。主代理调用 Skip 时，适配器同时记下"本次运行调用过 Skip"和"当前 turn 已跳过"；后者在每个 `result` 消息处清除（`z.type === "result" && (d = !1)`（`createAgentSdkAdapter`）），标记存在期间这个 turn 的流式输出和 result 文字都不收集；另有一个标记记下"有 turn 产出了 result 文字"。运行结束时，只有调用过 Skip、且没有任何一个 turn 产出 result 文字，整次运行才报告为跳过（`skipped: Ie || void 0`（`createAgentSdkAdapter`）），所以同一次运行里后面的 turn（例如后台子代理完成之后的那一轮）照常送达。按当前的装配，Skip 只注册给渠道会话，而 Claude 渠道会话总是使用常驻流式会话，这段一次性调用的逻辑没有注册了 Skip 的调用方。

Skip 记录由工具体写入（confirmed）。`runSkipTool (cC)` 要求 `reason` 非空，把 `{reason, skipped_at}` 写进会话 `state.json` 的 `pending_skip_rewind`，返回 "Skipped. End your turn now — no further text, no further tool calls."；pi 的 Skip 在 worker 内执行，由 `handlePiToolEndObservation (Eke)` 在工具结束时写同一个字段。这条记录有两个用途：Codex 与 Grok 靠它判断这一轮被跳过，下一个用户消息 turn 靠它生成 skip-rewind 块。

drain 收到引擎结果后按三种途径判定：`Yw(n) || r.skipped || await uft(e, t, r.turnStartedAt) && (r.skipped = !0)`（`markTurnSkippedFromSkipRecord`）。引擎是 claude 时直接返回，沿用 hook 给出的结果；结果已经带 `skipped` 时也直接返回；只有两者都不成立时，才检查 Skip 记录的时间是否不早于这一轮开始时刻，是就把这一轮标记为跳过（confirmed）。pi 走第二条途径：适配器看到 Skip 的 tool_end 帧就记下观察到 Skip，worker 中止这一轮后，适配器把运行结果标为 `skipped`，daemon 写的 Skip 记录只供下一轮的 skip-rewind 块使用（未证实推测：静态阅读所见，所在的 pi adapter 工厂尚无真名，没有可检查的引用）。Codex 与 Grok 走第三条途径，它们在 Skip 之后仍可能继续产出文字，Codex 的描述因此改成"之后的产出不会送达"；Grok 用的是 Claude 原版描述，但它的适配器并不中断这一轮，这句描述在 Grok 上与实际行为不一致（confirmed，静态阅读）。插话回调在 adapter 报告当前 turn 已观察到 Skip、或 Skip 记录晚于这一轮开始时，不向这个 turn 插话，改为重新 drain（7.4）。

这一轮被标记为跳过之后，处理结果对四个引擎相同（confirmed）。drain 不写出站记录，这一轮涉及的事件照常标记为已处理；会话发给订阅者的 `session.stream_end` 带 `reason: "skipped"`，按协议的类型注释，渠道适配器据此撤回已经流式渲染的部分内容。没有在 `accept_stream_end_reasons` 里声明 `skipped` 的适配器收到的是 `interrupted`（`let b = m === "interrupted" || v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`createSessionSubscriptionRegistry`），见 6.3）。下一轮是用户消息时，每轮瞬时块里加入 `<skip-rewind>` 块，写明跳过的时间、理由、距今多久，以及"上一轮的产出没有送达"（`renderSkipRewindBlock (Kdt)`，块的注入与清除见 2.3）。

QueueOutboundAttachment 把一个文件排进本会话的待发附件，在这一轮结束时随输出一起发给渠道（confirmed）。工具接受 `path`、可选的 `mime` 和可选的 `session_key`：`path` 可以是绝对路径或相对于会话工作目录的路径，必须指向一个普通文件；`mime` 省略时按扩展名从一张固定表推断，表里没有的扩展名记为 `application/octet-stream`；`session_key` 省略时为当前会话。工具按渠道适配器声明的出站能力检查文件：适配器在 `channel.pull` 时声明 `accept_mime` 与 `max_bytes`，由 `recordChannelCapabilityDeclaration (pyt)` 按渠道种类和消费者记进会话状态（6.3）；没有声明任何 MIME、MIME 不匹配或文件超过大小上限时返回错误，描述要求模型把渠道的限制告诉用户并提供替代办法（例如直接贴出文本内容）。通过检查的文件追加进 `state.json` 的 `pending_outbound_attachments`，同一路径与 MIME 的旧项被替换。drain 在引擎调用结束后由 `runDrainQueryAndCollectOutboundAttachments (HSe)` 读出这些待发项，与引擎结果自带的附件合并，然后清空字段；引擎调用抛错时同样清空（confirmed）。`session_key` 指向另一个会话时，文件进入那个会话的待发列表，在那个会话下一次 turn 结束时发出（confirmed，静态阅读；送达时机未实测）。

pi 上这个工具的检查时机与其他引擎不同（confirmed，静态阅读）。worker 内的工具只检查 `path` 非空，就向模型返回 "Outbound attachment accepted."（pi-worker.js 字面量），说明文件会在这一轮结束时按渠道能力校验并发送；真正的校验和入队由 `handlePiToolEndObservation (Eke)` 在工具结束时完成，校验不通过只记一条 `"[pi] QueueOutboundAttachment refused at the daemon observation point"`（`handlePiToolEndObservation`）警告。因此 pi 上的模型可能已经告诉用户"文件已发送"，而文件实际被拒绝。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 六个工具的名称与 MCP 全名 | `ww = "ManageJob", a_e = "mcp__aladuo__ManageJob"`（`initManageJobToolModule`）；`Ew = "RemindDuoduo", __e = "mcp__aladuo__RemindDuoduo"`（`initRemindDuoduoToolModule`）；`kw = "ViewSessions", y_e = "mcp__aladuo__ViewSessions"`（`initViewSessionsToolModule`）；`Ow = "Notify", H_e = "mcp__aladuo__Notify"`（`initNotifyToolModule`）；`qf = "QueueOutboundAttachment", Ske = "mcp__aladuo__QueueOutboundAttachment"`（`initQueueOutboundAttachmentModule`）；`ws = "Skip", cc = "mcp__aladuo__Skip"`（`initSkipToolModule`） | confirmed |
| Claude 与 Grok 经进程内 MCP 服务器调用工具体 | `name: "aladuo"`（`createAladuoMcpServer`）；`type: "sdk"`（`createAladuoMcpServer`）；`mcpServerFactory: () => Yg(t, {`（`createSessionManager`） | confirmed |
| Codex 经 dynamic tools 调用同一组工具体 | `dynamicTools: wA({`（`createSessionManager`）；`let a = await cg(s, { paths: e.paths,`（`buildCodexDynamicTools`） | confirmed |
| 工具上下文由 origin 决定 | `let Y = w.origin === "job" ? "job" : w.origin === "system" ? "system" : "foreground"`（`createSessionManager`）；`session_context_kind: Y`（`createSessionManager`） | confirmed |
| 后台分区用 meta 上下文，pi 分区用 system | `sessionContextKind: "meta"`（`createMetaSession`）；`session_context_kind: "system"`（`createMetaSession`） | confirmed |
| system 来源对应 system、meta、cadence 前缀 | `"[session-manager] wake starting actor with inferred origin"`（`createSessionManager`）；`classifySessionPlane (Oft)` | 未证实推测（前缀到来源的映射位于没有真名的函数，代码已读到但缺可检查的引用；第一个引用只证明会话管理器按推断出的来源启动 actor；`classifySessionPlane` 判定的是 plane 而不是来源，只因它归类同一组前缀而列出） |
| meta 与 system 上下文没有 ManageJob、RemindDuoduo | `t.sessionContextKind === "meta"`（`createAladuoMcpServer`）；`e.sessionContextKind === "meta"`（`buildCodexDynamicTools`） | confirmed |
| QueueOutboundAttachment 与 Skip 只注册给 foreground | `t.sessionContextKind === "foreground" && (n.registerTool(qf, {`（`createAladuoMcpServer`）；`e.sessionContextKind === "foreground" && (t.push({`（`buildCodexDynamicTools`） | confirmed |
| 自动批准列表按 origin 分档 | `let me = [...w.origin === "system" ? [] : [a_e, __e], y_e, H_e];`（`createSessionManager`）；`w.origin === "channel" && (me.push(Ske), me.push(cc));`（`createSessionManager`） | confirmed |
| pi 的四个回调方法只接受带口令的调用，ManageJob 以 pi 为调用方引擎 | `requires a pi worker token`（`createDaemon`）；`S.method === "notify.send"`（`createDaemon`）；`callerRuntime: "pi"`（`createDaemon`） | confirmed |
| pi 分区与 system 会话可调用 ManageJob，daemon 不校验上下文 | `session_context_kind: "system"`（`createMetaSession`）；`let k = await cg(S.params, {`（`createDaemon`） | confirmed（pi-worker.js 静态阅读：注册 ManageJob 与 ViewSessions 的分支没有上下文判断；与包内 `bootstrap/pi-runtime.md` 的说法不符；未实测） |
| MCP 工具带 alwaysLoad 标记 | `"anthropic/alwaysLoad": !0`（`createAladuoMcpServer`） | confirmed（Claude Code 对它的处理未证实） |
| job 会话用另一份 ManageJob 描述 | `description: i ? f$() : d$()`（`createAladuoMcpServer`） | confirmed |
| Codex 的 schema 由一个转换函数生成，参数一律声明为字符串 | `inputSchema: Xg(o),`（`buildCodexDynamicTools`） | confirmed（schema 由转换函数生成）；参数一律为字符串、只保留必填列表为未证实推测（转换函数没有真名） |
| action 在 schema 里是不可省略的三值枚举，MCP 路径上由 SDK 校验 | `action: ft.enum(["create", "list", "read"])`（`initManageJobToolModule`）；`inputSchema: i ? m$(t.callerRuntime) : p$(t.callerRuntime),`（`createAladuoMcpServer`） | confirmed（MCP SDK 在调用前校验参数这一步属于随包的第三方代码，静态阅读，无真名可引用） |
| action 描述把结束、打断 job 引向 shell | `Stopping a job and re-arming one are not actions here`（`initManageJobToolModule`） | confirmed |
| 工具体自己的动作检查：缺少 action、archive、reschedule、其他取值 | `if (r == null) throw new Error(`（`runManageJobTool`）；`throw i === "archive" ? new Error(kat) : i === "reschedule" ? new Error(xat)`（`runManageJobTool`）；`"ManageJob has no 'reschedule' action."`（`initManageJobToolModule`） | confirmed（只在不强制枚举的路径上可达；Codex 与 pi 是否在调用前校验未证实） |
| 只有 keepalive job 能在 job 会话里创建，且不能创建 keepalive | `if (t.callerJobCron !== "keepalive") throw new Error(wat);`（`runManageJobTool`）；`"ManageJob(create) is not available to this job. Creating jobs belongs to a"`（`initManageJobToolModule`）；`"A keepalive job may create jobs, but not another keepalive job."`（`initManageJobToolModule`） | confirmed |
| id、cron、instruction、model、acceptance 必填，model 不继承宿主默认值 | `"Missing required arguments for 'create' action (id, cron, instruction)"`（`runManageJobTool`）；`"model is required on create — name the model this job should run on."`（`initManageJobToolModule`）；`"Creation stops here rather than falling back to a host default. That pause"`（`initManageJobToolModule`）；`"acceptance is required on create — write down how this job is judged done."`（`initManageJobToolModule`） | confirmed |
| model、effort、stateless、prompt_mode 的取值检查 | `if (o === "pi" && !UR(s))`（`runManageJobTool`）；`if (a !== void 0 && !Ei(a))`（`runManageJobTool`）；`if (e.stateless === !0 && e.cron === "keepalive") throw new Error(NV);`（`runManageJobTool`）；`if (l !== void 0 && o === "codex") throw new Error(eat);`（`runManageJobTool`） | confirmed |
| 引擎的解析顺序与 schema 默认值 | `let o = e.runtime ?? t.callerRuntime ?? Co()`（`runManageJobTool`）；`n = e && t.includes(e) ? e : t[0];`（`buildJobRuntimeSchemaField`）；`listSelectableJobRuntimes (hat)` | confirmed |
| codex、grok 在创建时再探测 | `if (o === "codex") { let p = await Sc();`（`runManageJobTool`）；`if (o === "grok") { let p = await kc();`（`runManageJobTool`） | confirmed |
| 创建后记 owner、触发一次扫描 | `owner_session: t.sessionKey`（`runManageJobTool`）；`t.bus?.emit("job.created", {`（`runManageJobTool`）；`r.on("job.created", c)`（`createJobScheduler`） | confirmed |
| 返回文字附带投递说明，extra_tools 改名 | `Delivery: a success waits in your inbox for your next turn`（`initManageJobToolModule`）；`claudeTools: e.extra_tools`（`runManageJobTool`） | confirmed |
| list 含提醒记录，read 能读已归档 job | `(await n.listWakeRecords()).map(a => ({`（`runManageJobTool`）；`is archived — it is no longer scheduled.`（`runManageJobTool`） | confirmed |
| Notify 写 route.deliver 事件、写指针、以 never 唤醒 | `type: "route.deliver"`（`deliverRouteEventToSession`）；`c === "job.fail" ? "never" : "allow"`（`deliverRouteEventToSession`）；`"[route] delivered to target inbox"`（`deliverRouteEventToSession`） | confirmed |
| 归档中或已归档的目标不投递 | `error: "session_archiving"`（`deliverRouteEventToSession`）；`error: "session_archived"`（`deliverRouteEventToSession`） | confirmed |
| 内容为空、目标是自己、job 没有 owner 时报错 | `let a = await gg(s, { paths: e, bus: t.bus, sessionKey: t.sessionKey,`（`createAladuoMcpServer`） | 未证实推测（这些检查位于没有真名的 Notify 工具体与 job owner 解析函数，代码已读到但缺可检查的引用；所列引用只是 Notify 工具体在具名函数里的调用点） |
| 目标解析：原样匹配、别名、歧义与未命中时列候选 | `if (n in r) return n; let o = await j_e(e, i)`（`resolveNotifyTargetSessionKey`）；`"target_session_key is required in this session."`（`resolveNotifyTargetSessionKey`）；`"Retry with the full session_key of the one you mean (most recent activity first):"`（`resolveNotifyTargetSessionKey`）；`"The target must be a persisted session key or a session display-name alias (prefer active foreground sessions)."`（`resolveNotifyTargetSessionKey`） | confirmed |
| 未命中时的候选会话键按编辑距离不超过 3 选出 | `z_e = 3`（`initNotifyToolModule`） | confirmed（常量在具名初始化器里；比较位于尚无真名的函数） |
| job 会话省略目标时发给 owner | `"A Notify with no target reaches the owner."`（`initManageJobToolModule`） | confirmed（工具说明原文；执行这一默认的代码位于尚无真名的 Notify 工具体与 job owner 解析函数，引用待命名） |
| correlation_id 与 reply_to 渲染成 session-notify 的属性 | `"notify_correlation_id"`（`renderMailboxEventPrompt`）；`"notify_reply_to"`（`renderMailboxEventPrompt`） | confirmed（渲染）；参数只在 job 与渠道会话提供为未证实推测（schema 构造函数没有真名） |
| 通知链深度上限 5，深度来自本批事件 | `M_e = 5`（`initNotifyToolModule`）；`fn = typeof un?.notify_depth == "number" ? un.notify_depth : 0`（`drainSessionMailbox`）；`if (Et = Ve.maxNotifyDepth, Ve.eventIds)`（`createSessionManager`） | confirmed（常量与深度来源）；比较本身在没有真名的工具体内，属未证实推测 |
| 深度在构造工具集时按值复制，多数路径不逐批更新 | `notifyDepth: t.notifyDepth,`（`createAladuoMcpServer`）；`E = l.mcpServersFactory ? l.mcpServersFactory() : l.mcpServers`（`createClaudeStreamingSessionFactory`）；`notifyDepth: Et,`（`createSessionManager`） | confirmed（静态阅读）；对真实循环的效果为未证实推测 |
| 投递报告逐个目标写结果 | `i === r.length ? "Notify delivered." : "Notify partially delivered."`（`renderNotifyDeliveryReport`） | confirmed（有目标未投成时以错误返回，这一判断在尚无真名的工具体内） |
| 没有读者的判断只对渠道会话生效 | `if (lr(t) !== "channel") return {`（`evaluateNotifyConsumerRefusal`） | confirmed |
| 判据：有未读输出且超过阈值无人取走 | `unconsumed: e.records_past_cursor > 0 && o !== void 0 && o > t * qat`（`classifyConsumerStaleness`）；`let r = e.last_cursor_advance_at ?? e.oldest_waiting_created_at`（`classifyConsumerStaleness`） | confirmed |
| 阈值默认 1 小时，0 或负数关闭 | `BV = "ALADUO_NOTIFY_UNCONSUMED_HOURS", R$ = 1`（`initNotifyConsumerStalenessModule`）；`qat = 36e5`（`initNotifyConsumerStalenessModule`）；`return Number.isFinite(n) ? n : R$`（`resolveNotifyUnconsumedHours`）；`return t <= 0 ? {`（`classifyConsumerStaleness`） | confirmed（上游 CHANGELOG 把默认值写成"未设置即关闭"，与代码不一致，以代码为准） |
| 阈值显示在配置报告里 | `notify_unconsumed_hours: qn(BV, R$)`（`buildSystemConfigReport`） | confirmed |
| 被拒的通知只写日志，并返回有读者的候选会话 | `"[route] wal-only route event (no mailbox, no wake)"`（`deliverRouteEventToSession`）；`notify_refused_reason: p`（`deliverExternalSessionNotify`）；`"Nothing was delivered. This call will not be retried."`（`renderNotifyRefusalMessage`）；`for (let a of o.listByKind("channel")) {`（`listSessionsWithRecentConsumer`） | confirmed |
| shell 路径可用 force 跳过检查，事件类型为 external.notify | `if (!r.force) {`（`deliverExternalSessionNotify`）；`reason: "no_consumer"`（`deliverExternalSessionNotify`）；`eventType: "external.notify"`（`deliverExternalSessionNotify`）；`let i = r.target.trim(), o = Kf(n, i);`（`deliverExternalSessionNotify`） | confirmed |
| job 调用 Notify 后不再自动投递成功回执 | `suppresses that run's automatic success delivery`（`initManageJobToolModule`）；`w.agentNotifiedThisDrain = !0`（`createSessionManager`）；`e.sessionManager?.markAgentNotified(A.session_key)`（`createDaemon`） | confirmed |
| orphan job 会话收到通知后继续 drain | `"[session-manager] job-origin actor has no matching active job"`（`createSessionManager`） | 未证实推测（是否调用模型未实测） |
| RemindDuoduo 只能提醒自己，一次性，不打断当前 turn | `Schedule one future turn of this session when your current work needs a later check`（`initRemindDuoduoToolModule`）；`without interrupting a turn already in progress`（`initRemindDuoduoToolModule`）；`"A wake record needs an owner session — the caller is always the target."`（`initJobManagerModule`） | confirmed |
| 提醒记录由 job 扫描器投递为 self-wake，投递后归档 | `a = await Ggt(e, r, o, n?.bus);`（`scanAndSpawnDueJobs`）；`let a = await r(i); return await this.archiveJobHoldingLock(t)`（`initJobManagerModule`）；`"A follow-up you scheduled is due. This is NOT a direct user message, and it does"`（`renderMailboxEventPrompt`）；`"- If no user-visible response is needed, call Skip."`（`renderMailboxEventPrompt`） | confirmed |
| job 会话里的 RemindDuoduo 改本 job 的 run_at，一次性 job 因此不归档 | `Give this job one more run at`（`initRemindDuoduoToolModule`）；`async rescheduleJob(t, n, r = new Date) {`（`initJobManagerModule`）；`async archiveJobIfNotRearmed(t) {`（`initJobManagerModule`） | confirmed |
| when 要求带时区、不接受已过去的时间 | `timestamp with an explicit timezone`（`initRemindDuoduoToolModule`）；`A time at or before now is rejected`（`initRemindDuoduoToolModule`） | confirmed（解析函数尚无真名） |
| shell 侧创建提醒 | `scheduleSessionWakeRecord (Syt)` | confirmed |
| ViewSessions 只读，列表标出 orphan | `This tool never creates, restores or modifies anything.`（`initViewSessionsToolModule`）；`e.orphan && t.push("orphan — job archived or recreated, will not run")`（`formatViewSessionsListLine`） | confirmed |
| Skip 的说明要求它是第一个动作，并警告之前流出的文字仍会送达 | `In a turn you decide to skip, make Skip your FIRST action.`（`initSkipToolModule`）；`text streamed before Skip can still reach the user.`（`initSkipToolModule`） | confirmed |
| Claude 由 PreToolUse hook 结束 Skip 的一轮，子代理不标记父 turn | `matcher: cc`（`createClaudeStreamingSessionFactory`）；`stopReason: "The agent intentionally ended this turn silently by calling Skip."`（`createClaudeStreamingSessionFactory`）；`let ne = J?.agent_id !== void 0`（`createClaudeStreamingSessionFactory`）；`"[claude-sdk] Skip detected via PreToolUse hook (non-streaming)"`（`createAgentSdkAdapter`） | confirmed（SDK 是否仍执行工具体未证实） |
| 一次性调用的跳过标记在每个 result 处清除，只有没有 turn 产出文字时整次运行才算跳过 | `z.type === "result" && (d = !1)`（`createAgentSdkAdapter`）；`structured: Ie ? void 0 : i`（`createAgentSdkAdapter`） | confirmed（静态阅读） |
| Claude 渠道会话使用常驻流式会话，其他会话使用一次性调用 | `!s.createStreamingQuery ? s : (w.streamingAdapter`（`createSessionManager`） | confirmed（静态阅读；判断条件的前半是 origin 是否为 channel） |
| 已 Skip 的 Claude turn 不接收插话 | `if (R.currentTurn?.skipCalled === !0) return {};`（`createClaudeStreamingSessionFactory`）；`!ji.skipCalled`（`createSessionManager`） | confirmed |
| Codex 与 Grok 只观察 Skip，不中断这一轮 | `l = f => (f === ws && u && (u.skipObserved = !0), u?.turnId)`（`createCodexAppServerAdapter`）；`Jst(ee) && (R = !0)`（`createGrokAcpAdapter`） | confirmed（静态阅读） |
| Codex 的 Skip 描述替换了一句 | `whe = cB.replace("Calling Skip immediately ends this turn.", "After you call Skip, nothing further you produce this turn will be delivered.")`（`initSkipToolModule`）；`description: whe`（`buildCodexDynamicTools`）；`description: cB`（`createAladuoMcpServer`） | confirmed |
| Skip 工具体写 Skip 记录，pi 由 daemon 在工具结束时写 | `pending_skip_rewind: {`（`runSkipTool`）；`"Skipped. End your turn now — no further text, no further tool calls."`（`runSkipTool`）；`if (n.tool_name === ws) {`（`handlePiToolEndObservation`）；`onToolEnd: dr => Eke(t, P, dr)`（`createSessionManager`） | confirmed |
| drain 按 claude、结果自报、Skip 记录时间三种途径判定跳过 | `await FSe(e, t, n.runtime, Nn)`（`drainSessionMailbox`）；`markTurnSkippedFromSkipRecord (FSe)` | confirmed（pi 适配器自报 skipped 这一步位于尚无真名的 pi adapter 工厂，为未证实推测） |
| 已观察到 Skip 的非 Claude turn 不接收插话 | `if (w.adapter?.activeTurnSkipObserved?.() === !0) dr = !0;`（`createSessionManager`） | confirmed |
| 跳过的一轮不写出站记录、事件照常标记完成，stream_end 原因为 skipped | `"[runner] Skip called — suppressing outbox"`（`drainSessionMailbox`）；`await ue(mt, "skip-turn")`（`drainSessionMailbox`）；`reason: me.skipped ? "skipped" : "interrupted"`（`createSessionManager`） | confirmed |
| 未声明 skipped 的适配器收到 interrupted | `v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`createSessionSubscriptionRegistry`） | confirmed |
| 下一个用户消息 turn 注入 skip-rewind 块 | `let g = t.isUserMessage !== !1 ? Kdt(t.skipRewind) : void 0;`（`buildTransientUserBlocks`）；`renderSkipRewindBlock (Kdt)` | confirmed |
| 附件按渠道声明的能力检查，失败时告诉用户限制 | `If the tool fails (unsupported MIME type or file too large)`（`initQueueOutboundAttachmentModule`）；`outbound: n.outbound`（`recordChannelCapabilityDeclaration`） | confirmed（检查代码位于尚无真名的工具体） |
| MIME 按扩展名推断，未知扩展名为 octet-stream | `wke = "application/octet-stream"`（`initQueueOutboundAttachmentModule`）；`".png": "image/png"`（`initQueueOutboundAttachmentModule`） | confirmed |
| 待发附件在引擎调用结束后读出、合并、清空 | `let r = (await ct(e, t))?.pending_outbound_attachments;`（`readPendingOutboundAttachments`）；`s = await Mft(e, t, i.attachments)`（`runDrainQueryAndCollectOutboundAttachments`）；`return await xO(e, t), { sdkResult: i, outboundAttachments: a }`（`runDrainQueryAndCollectOutboundAttachments`） | confirmed |
| pi 上附件先应答、后校验，校验失败只记警告 | `"[pi] QueueOutboundAttachment refused at the daemon observation point"`（`handlePiToolEndObservation`） | confirmed（静态阅读） |

## 5 事件日志

事件日志（上游 Spine，WAL）是按 UTC 日期分区的 JSONL 文件：每条事件先追加一行 WAL、再追加一行 by_id 索引（两次写，不是原子事务），需要会话处理的事件之后才写邮箱指针；去重只认渠道提供的幂等键；by_id 是只在 daemon 启动时按保留期裁剪的近期索引，查不到时按日期倒序扫描分区文件；重启时运行时从会话目录和邮箱指针重建待处理的会话集合，消费进度文件只写不读，崩溃后能自动恢复的是已经写下邮箱指针的工作。下面五个小节依次回答：怎么写、写了哪些类型、重复怎么处理、怎么按 id 读回、重启后靠什么接着处理。

### 5.1 追加：WAL 行 + by_id 索引两次写

一条事件落库由 `atomicAppendEvent (on)` 完成，它恒定执行两次追加：先把事件写成分区文件 `var/events/YYYY-MM-DD.jsonl` 的一行（日期取事件时间戳的 UTC 日期），再把 `{event_id, partition, byte_offset, byte_len}` 追加进 `var/events/index/by_id.jsonl`（confirmed）。事件对象由 `createSpineEvent (rn)` 生成：在调用方给出的 `type`、`source`、`session_key`、`payload`（以及可选的 `dedup`、`routing_hint`）之上补一个随机生成的 `id` 和 ISO 格式的 `ts`（confirmed）。

索引记录的区间正好是写入的那一行（confirmed）。`appendEventToPartition (X9e)` 以追加模式打开分区文件，取写入前的文件长度作为 `byte_offset`，取实际写入的字节数作为 `byte_len`。同一分区的追加按文件路径串成一条 promise 链，成功和失败都接续下一次写，偏移计算因此在一个进程内没有竞争；跨进程写同一分区没有任何保护，一个数据目录只有一个 daemon 写入由第 8.2 节的进程写锁保证（confirmed）。

两次写之间不构成事务。进程若在 WAL 行写完、索引行写入前退出，这条事件在分区文件里存在但索引里没有；按 id 读取会退到分区扫描（5.4），`advanceConsumerWatermark (Nu)` 查不到索引时直接返回 `false`、不写消费进度（confirmed）。索引只有 `by_id` 一个：bundle 中没有 `by_session` 字面量，也没有任何代码拼出按会话切分的索引路径；按会话检索靠邮箱里的 `- [ ] @evt(<id>)` 指针（confirmed）。内存中的索引 Map 只有在已经装载过时才随追加同步更新，未装载时下次查询会整文件装载，其中已包含新行（confirmed）。

写完事件后还写邮箱指针、让某个会话去处理的入口有三个，都遵守"先追加、后写指针"（confirmed）：

- 网关摄入 `appendBeforeExecuteGateway (Kle)`，写 `channel.message` 与 `channel.command`。顺序是：封装事件 → 查询并登记去重键（5.3）→ 把原始请求体写到 `var/ingress/<会话哈希>/<事件 id>.json` 并把路径记进 `payload.raw_path` → 追加 WAL 与索引 → 推进 `gateway` 消费进度 → 更新 `status.json` → 按路由目标写邮箱指针，或由网关直接执行命令（第 6.2 节）。
- 会话间投递 `deliverRouteEventToSession (Ps)`，写 `route.deliver`，承载 Notify、job 结果、自我唤醒、外部通知等。目标会话正在归档或已归档时，它在追加之前就拒绝；追加之后有三种收尾：`walOnly` 只留日志、不写指针也不唤醒；`enqueueWithoutWake` 写指针但不唤醒，job 成功回执用这种方式等 owner 的下一轮；默认写指针并发出 `session.wake`，其中 `notify`、`job.complete`、`job.fail` 三种来源默认不抢占当前 turn。
- 到期 job 扫描器 `scanAndSpawnDueJobs (yJ)`，写来源为 `cadence`/`job-scanner` 的 `job.spawn`。它先把认领时间写进 job 状态文件，再追加事件，然后向 job 会话的收件箱写一条在 `@evt(<id>)` 之后另带 `job:<jobId>` 的指针，最后直接派生 job 会话，不经过 `session.wake`（第 10.2 节）。这条 `job.spawn` 是这次运行的触发事件。

其余写入方只追加、不写指针，没有会话会因为它们被唤醒（confirmed，写入方见 5.2）：agent 的输出、错误与工具调用（`agent.*`），job 结算（`job.complete`、`job.fail`），会话管理器启动 job 会话时和 `job.create` RPC 写的 `job.spawn`，心跳（`system.cadence_tick`），配置变更（`config.changed`）和渠道挂接（`channel.attached`）。job 结果送到 owner 会话走的是另一条 `route.deliver`（第 10.3 节）。

### 5.2 落库事件类型

经 `createSpineEvent (rn)` 封装、再经 `atomicAppendEvent (on)` 写入的事件类型一共 13 种。其中 11 种的类型字面量位于已命名函数内（confirmed，见证据表）；`agent.tool_use` 与 `agent.tool_result` 的字面量位于两个没有真名的记录函数里，证据表只能引用调用点（未证实推测）：

| 类型 | 写入方 | 何时写 |
|---|---|---|
| `channel.message` | `ingestChannelMessage (Gle)` 经 `appendBeforeExecuteGateway (Kle)` | 渠道经 `channel.ingress` 送入一条消息 |
| `channel.command` | `ingestChannelCommand ($b)` 经 `appendBeforeExecuteGateway (Kle)` | `channel.command` RPC、`session.compact` RPC、空闲压缩扫描器发出 `/compact` |
| `channel.attached` | `createSessionManager (Agt)` | 一个渠道实例挂接到渠道会话 |
| `route.deliver` | `deliverRouteEventToSession (Ps)` | 会话间投递；原始来源写在 `payload.source_event_type` |
| `agent.result` | 会话 drain 的输出函数（没有真名）；`replyToGatewayCommandEvent (LXe)`；`createMetaSession (Wgt)` | 一轮结束时每个投递目标一条；网关命令回复；后台分区一次成功运行 |
| `agent.error` | `drainSessionMailbox (KSe)`；`handleDrainError (Xw)`；`createMetaSession (Wgt)` | drain 或分区运行失败 |
| `agent.tool_use` | 会话 drain 与后台分区各自的执行事件记录函数（都没有真名） | 引擎报告一次工具调用；drain 路径跳过标为 ephemeral 的调用，后台分区全部记录 |
| `agent.tool_result` | 同上 | 引擎报告一次工具结果 |
| `job.spawn` | `scanAndSpawnDueJobs (yJ)`；`createSessionManager (Agt)`；`createDaemon (Lyt)` | 扫描器触发到期 job（只有这一条带邮箱指针）；会话管理器启动 job 会话；`job.create` RPC 创建 job |
| `job.complete` | `createJobSessionFinalizer (SEe)` | job 运行成功结算 |
| `job.fail` | `createJobSessionFinalizer (SEe)` | job 运行失败结算 |
| `system.cadence_tick` | `runCadenceTick (Zgt)` | 每次心跳的确定性维护完成后 |
| `config.changed` | `appendConfigChangedEvent (ty)` | `session.config` RPC 修改了全局、种类或实例配置 |

后台分区的产出复用 `agent.result`，以 `source.kind = "meta"`、`source.name = "subconscious:<分区名>"` 和 `payload.tick_type = "subconscious"` 区分（confirmed）。drain 路径上写 `agent.result` 的输出函数和两个执行事件记录函数没有真名，证据表引用的是它们在 `drainSessionMailbox (KSe)`、`createMetaSession (Wgt)` 中的调用点；调用点证明这些函数被调用，"drain 路径跳过 ephemeral 工具调用、分区全部记录"是静态阅读函数体得到的，没有可由构建检查的引用（未证实推测）。

有三类名字看起来像事件类型，但不进事件日志：总线事件（`spine.event`、`session.wake`、`session.output`、`session.stream`、`session.execution`、`session.stream_end`、`cadence.tick`、`job.spawned`、`job.completed`、`job.failed`、`job.created`、`session.streaming_invalidated`、`shutdown`）只在进程内传递；RPC 方法名（附录 B.2）是控制面的调用入口；`notify`、`self-wake`、`external.notify` 等是 `route.deliver` 的 `payload.source_event_type` 取值，不是独立类型（confirmed）。各落库类型的 `source.kind` 与是否写邮箱指针见附录 B.1。

### 5.3 去重

去重不看内容，只看渠道随消息带来的幂等键：键的形式是 `<source.kind>:<dedup.source_id>`，没有 `dedup.source_id` 时 `computeDedupKey (wse)` 返回 `null`，整段去重被跳过（confirmed）。`dedup.source_id` 来自 `channel.ingress` 或 `channel.command` 参数里的 `idempotency_key`（confirmed）。因此同一段文字不带幂等键重复发送永远不会被判重；带键时没有时间窗口，同一个键在这个数据目录上只被接纳一次；键的前缀是来源种类而不是具体渠道实例，同一种类的两个实例若给出相同的幂等键会被判为重复（confirmed，由键的构成直接推出）。

去重表是 `var/registry/dedup.jsonl` 一个文件，由 `loadRegistryDedupStore (MXe)` 按路径缓存为唯一实例，首次使用时逐行装载进内存 Map；无法解析或缺 `key` 的行被跳过并汇总成一条警告日志，不会让整次装载失败（confirmed）。`spineEventDedupStore (mR)` 没有淘汰分支：新键写入内存 Map 并追加一行，运行期间只增不减；只有读文件出错导致装载失败时，它清空内存 Map，这次摄入以错误结束，下一次访问重新装载（confirmed）。长期运行下文件与 Map 的增长速度和内存占用没有实测。

新键在查询的同时就被登记，时间早于 WAL 追加。命中重复时，`appendBeforeExecuteGateway (Kle)` 用去重记录里的事件 id 和时间戳读回原事件，再由 `findOutboxRecordByEventId (qm)` 找以原事件为回复对象的出站记录，返回 `deduplicated: true`、`enqueued: false` 和该记录的文字，不追加新事件、不写指针（confirmed）。这段文字不一定是网关回复：网关命令得到网关的回复；已被会话回答的消息得到 agent 的回复，同一轮合并处理的每条消息都登记到这一轮的主出站记录；还没有回答的消息得到空值。`channel.ingress` 与 `channel.command` 把它放在返回值的 `gateway_response` 字段（第 6.2 节）（confirmed）。如果原事件读不到（例如进程在登记去重键之后、追加 WAL 之前退出），这个分支不返回，消息按新消息继续处理，所以"登记了键却没写日志"不会让重发的消息丢失（confirmed）。反过来的窗口见 5.5：事件已经追加、指针没来得及写时，重发的消息会被当作重复消息应答。

### 5.4 按 id 读取、索引保留期与回退扫描

按 id 读取先查索引、再按偏移读，都失败时只有调用方给出时间上界 `notAfter` 才跨分区扫描（confirmed）。`readEventById (Md)` 依次执行四步：

1. 查索引：在内存 Map 里查事件 id；首次访问时整文件流式装载 `by_id.jsonl`，丢弃偏移为负、非整数或长度为零的条目，装载出错按未命中处理并记警告（`lookupEventIdIndexEntry (nb)`）。
2. 按偏移读并核对 id：索引命中时从 `byte_offset` 读 `byte_len` 字节，解析出的事件 id 与要找的一致就返回（`readEventAtIndexedOffset (e5e)`）。
3. 同分区顺序扫描：读出的内容为空或 id 不符时，在索引所记的分区文件里逐行查找（`findEventInPartitionFile (ise)`）。
4. 跨分区倒序扫描：前三步没有结果时，调用方给了 `notAfter` 就取日期不晚于 `notAfter` 所在 UTC 日的全部分区，按日期从新到旧逐个顺序扫描；没有 `notAfter` 直接返回 `null`（`scanPartitionsForEventId (t5e)`）。

bundle 内按 id 读事件的调用方都会给出 `notAfter`（confirmed）。drain 的调用点写的是"邮箱条目带 `created_at` 时才传 `notAfter`"，而邮箱条目的每个写入点都会写这个字段：邮箱指针在写入时以 `.pending` 文件名记下写入时刻，`mergeInboxIntoMailbox (fR)` 把它转存为条目的 `created_at`，文件名解析失败时取合并时刻。去重重放传入的是去重记录里的事件时间戳。指针写入时刻不早于事件时间戳，所以扫描范围一定覆盖事件所在的分区。扫描之后仍读不到的指针，drain 记一条 `[runner] mailbox event unresolved` 日志并跳过这一条（confirmed）。

by_id 索引有保留期，只在 daemon 启动时裁剪（confirmed）。`main (Fyt)` 在取得进程写锁、初始化运行目录之后调用裁剪，并在日志里记下 `kept`、`dropped`、`cutoff` 三个数；裁剪出错时释放写锁并中止启动；两次启动之间索引只增不减。裁剪规则是：保留 `partition` 不早于"当前 UTC 日期减 N 天"的索引行，无法解析的行一并丢弃，只在有行被丢弃时重写索引文件；N 取环境变量 `ALADUO_SPINE_INDEX_RETENTION_DAYS`，默认 7，非正整数时记警告并用 7。这条规则是静态阅读得到的，实现它的读取函数、裁剪函数和事件日志模块初始化器都没有真名，没有可由构建检查的引用（未证实推测）。

超出保留期的事件仍然读得到（confirmed）。daemon 不删除任何 WAL 分区文件，事件目录在 bundle 中只有创建、追加和读取操作，所以索引裁掉的事件仍能经第 4 步的回退扫描读到，代价是扫描一个或多个分区文件。`readEventById (Md)` 在索引未命中且没有 `notAfter` 时确实返回 `null`，但运行时自己的调用方都给出 `notAfter`，只要分区文件还在，事件就读得到。

另外两个读取入口不按 id 查索引（confirmed）。`spine.tail` RPC 由 `readSpineTail (rve)` 实现：`limit` 默认 200、限制在 1 到 500 之间；`readPartitionTail (nve)` 从当日（UTC）分区的末尾按块倒着读，收满即停，返回最新的若干条；给了 `after_id` 时先经内存索引（不触发装载）定位游标行，定位不到就在倒读中遇到该 id 时停止；当日既没找到游标也没收满时，只再读前一日分区一次，找到游标才拼接结果。因此不带 `after_id` 的调用只看当日分区，UTC 零点刚过时返回的事件很少；游标之后的事件多于 `limit` 条时返回的是最新的那一批并置 `has_more`。它在只读 TCP 端口放行的方法集合里（第 6.1 节；集合内容的置信见那里）。`duoduo spine cat` 与 `duoduo spine show` 是 CLI 命令，在 CLI 进程内按本机路径直接读取事件目录下的分区文件，不经过 daemon（未证实推测：静态阅读 CLI 代码所得，读取分区的函数没有真名）。

### 5.5 消费进度与重建

事件日志按时间保存每条事件的正文，但不是运行时的全部数据（confirmed）：工具结果只记录适配器给出的 `summary` 字段，Codex 对命令执行只记退出码；回复的附件与每轮统计 `turn_meta` 写在出站记录里（6.3）；完整的原始请求体在 `var/ingress`；每次 drain 的用量与成本在 `var/usage`（字段见第 7 节的关键数据结构）；对话历史由引擎自己保存，daemon 只保存会话 id 并在下一次调用时续接（第 7.3 节）。重启后决定"接着处理什么"的是会话目录与邮箱指针，它们不能从事件日志重建；消费进度文件只写不读；另有一个恢复窗口没有被覆盖。下面分别说明。

消费进度文件只写不读（confirmed）。`advanceConsumerWatermark (Nu)` 经 by_id 反查事件的分区与偏移，把 `{updated_at, partition, byte_offset, last_event_id}` 写到 `run/queue_offsets/<消费者>.json`；消费者只有三个：`gateway` 在网关摄入每条事件后、路由之前推进；`jobs` 在每次心跳追加 `system.cadence_tick` 后推进（名字是 jobs，挂的却是心跳事件）；`meta_session` 在后台分区的跳过、完成、非成功结算和出错事件后推进。daemon、CLI 与其余 bundle 中都没有读取这些文件的代码，重启恢复不依赖它们，它们只能用来人工观察。`var/registry/status.json` 由 `updateRegistryStatus (Du)` 合并更新：网关摄入写 `health.gateway = "ok"` 与当日分区路径，心跳写 `cadence.last_tick`；网关命令 `/status` 与 `system.status` RPC 读取它（confirmed）。

重启后接着处理的依据是邮箱指针（confirmed）。会话管理器启动时调用 `rehydrateSessionState (dse)`：它遍历 `var/sessions/` 下的会话目录，只收集收件箱里仍有 `.pending` 文件、或邮箱里仍有待处理条目的会话；会话键优先取 `state.json` 的 `session_key`，缺失时把 `var/registry/sessions/` 下的文件名解码后用 `hashSessionKey (Oo)` 求哈希、与目录名比对找回，并写回 `state.json`。随后会话管理器逐个唤醒这些会话（抢占方式为 `never`），跳过正在归档的会话和工作目录不存在的会话。

重新 drain 时不会为已经回复过的事件再跑一轮（confirmed）。邮箱条目在一轮输出写完之后才标记完成；再次 drain 时，某条目的事件若已经有出站记录（`findOutboxRecordByEventId (qm)` 能查到），就直接计为已处理。合并处理的一轮只有一条主出站记录，但同一轮的其他事件也登记到这条记录上，所以整批都不会重跑。于是"回复已写出、标记完成之前退出"不会产生重复回复；"回复写出之前退出"会让这一轮在重启后重新执行（第 7 节）。

未覆盖的窗口在追加与写指针之间（confirmed，静态分析）。5.1 的三个入口都是先追加、后写指针，进程在两者之间退出时，事件留在日志里但没有指针，运行时没有任何把"缺指针的事件"补入邮箱的步骤。三个入口的后果不同：网关摄入的消息已经登记了去重键，渠道带同一幂等键重发时会被当作重复消息应答（5.3），这条消息不会被处理；会话间投递的 `route.deliver` 不会到达目标会话；到期 job 扫描器在追加之前已经写下认领时间，重启后这次运行被视为已调度，周期调度的 job 等到下一个到期时刻，一次性调度只在上次结果为 unknown 或 failure 时按第 10.2 节的重试规则重新派生。这个窗口的长度是几次本地文件写入。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 分区按事件时间的 UTC 日期命名 | `e.toISOString().slice(0,10)`（`formatEventPartitionName`）；`let n = await X9e(e, t)`（`atomicAppendEvent`） | confirmed |
| 事件对象补 id 与 ISO 时间戳 | `id: K9e()`（`createSpineEvent`）；`ts: t.toISOString()`（`createSpineEvent`） | confirmed |
| 单条追加恒定两次写：WAL 行后接索引行，无事务 | `return await Q9e(e, {`（`atomicAppendEvent`）；`"by_id.jsonl"`（`resolveEventIdIndexPath`） | confirmed |
| 偏移取写前文件长度，长度取实际写入字节数 | `(await s.stat()).size`（`appendEventToPartition`）；`(await s.write(o)).bytesWritten`（`appendEventToPartition`） | confirmed |
| 同一分区的追加按 promise 链串行 | `(nse.get(e) ?? Promise.resolve()).then(t, t)`（`enqueuePartitionAppend`） | confirmed |
| 内存索引只在已装载时同步更新 | `i.map.set(t.event_id, t)`（`appendEventIdIndexEntry`） | confirmed |
| 只有 by_id 一个索引 | `"by_id.jsonl"`（`resolveEventIdIndexPath`） | confirmed；bundle 中 `by_session` 零命中 |
| 网关摄入：先快照、再追加、再推进进度与 status、最后写指针 | `r.payload && (r.payload.raw_path = s)`（`appendBeforeExecuteGateway`）；`await Nu(e, "gateway", r.id, new Date(r.ts))`（`appendBeforeExecuteGateway`）；`a = await Xs(e, t.sessionKey, f)`（`appendBeforeExecuteGateway`） | confirmed |
| 会话间投递先追加再写指针，归档目标在追加前拒绝，三种收尾 | `error: "session_archived"`（`deliverRouteEventToSession`）；`"[route] wal-only route event (no mailbox, no wake)"`（`deliverRouteEventToSession`）；`"[route] enqueued without wake (waits for the owner's next turn)"`（`deliverRouteEventToSession`）；`"never" : "allow"`（`deliverRouteEventToSession`） | confirmed |
| 扫描器先认领、再追加 job.spawn、再写带 job id 的指针、最后派生 job 会话 | `last_scheduled_at: o.toISOString()`（`scanAndSpawnDueJobs`）；`name: "job-scanner"`（`scanAndSpawnDueJobs`）；`@evt(${h.id}) job:${u.id}`（`scanAndSpawnDueJobs`）；`await Xs(e, p, g), t.spawnJobSession(u.id, p)`（`scanAndSpawnDueJobs`） | confirmed |
| 会话管理器与 job.create 写的 job.spawn 只追加、不写指针 | `"[session-manager] error recording job spawn"`（`createSessionManager`）；`S.method === "job.create"`（`createDaemon`） | confirmed；这两处在 `createSpineEvent` 之后只调用追加函数，bundle 中写邮箱指针的调用点只有三个入口和插话回退时的重新入队 |
| 13 种落库类型：渠道三种 | `eventType: "channel.message"`（`ingestChannelMessage`）；`eventType: "channel.command"`（`ingestChannelCommand`）；`type: "channel.attached"`（`createSessionManager`） | confirmed |
| 13 种落库类型：投递、心跳、配置 | `type: "route.deliver"`（`deliverRouteEventToSession`）；`type: "system.cadence_tick"`（`runCadenceTick`）；`type: "config.changed"`（`appendConfigChangedEvent`） | confirmed |
| 13 种落库类型：job 三种 | `type: "job.spawn"`（`scanAndSpawnDueJobs`）；`type: "job.spawn"`（`createSessionManager`）；`type: "job.spawn"`（`createDaemon`）；`type: "job.complete"`（`createJobSessionFinalizer`）；`type: "job.fail"`（`createJobSessionFinalizer`） | confirmed |
| 13 种落库类型：agent.result 与 agent.error | `type: "agent.result"`（`replyToGatewayCommandEvent`）；`type: "agent.result"`（`createMetaSession`）；`type: "agent.error"`（`handleDrainError`）；`type: "agent.error"`（`drainSessionMailbox`） | confirmed |
| 13 种落库类型：agent.tool_use 与 agent.tool_result；drain 路径的 agent.result | `n.onExecutionEvent, Y.event.id`（`drainSessionMailbox`）；`"[meta-session] failed to persist execution event"`（`createMetaSession`）；`"outbox_emit_ms"`（`drainSessionMailbox`） | confirmed（调用点）；写入这些类型的三个函数没有真名，类型字面量与"drain 跳过 ephemeral、分区全部记录"是静态阅读函数体所得：未证实推测 |
| 后台分区产出复用 agent.result | `tick_type: "subconscious"`（`createMetaSession`） | confirmed |
| 去重键只有一种形式，无键不去重 | `let t = e.dedup?.source_id`（`computeDedupKey`）；`e.source?.kind??"unknown"`（`computeDedupKey`）；`dedupSourceId: k.idempotency_key`（`createDaemon`） | confirmed |
| 去重表单文件、逐行容错装载、无淘汰；装载失败时清空 Map 待重装 | `"dedup.jsonl"`（`loadRegistryDedupStore`）；`skipped ${t} unreadable line(s)`（`spineEventDedupStore`）；`this.entries.set(t.key, t)`（`spineEventDedupStore`）；`await $u(this.cache, () => this.load(), () => this.entries.clear())`（`spineEventDedupStore`） | confirmed |
| 命中重复即返回原事件出站记录的文字、不追加不入队；原事件读不到时按新消息处理 | `notAfter: f.existing.ts`（`appendBeforeExecuteGateway`）；`gatewayResponse: m?.payload.text`（`appendBeforeExecuteGateway`）；`deduplicated: !0`（`appendBeforeExecuteGateway`） | confirmed |
| 出站记录按"回复对象事件"建索引；网关回复与 drain 回复都登记，合并批次的其他事件也登记到主记录 | `in_reply_to_event_id: t.id`（`replyToGatewayCommandEvent`）；`for (let Rt of pt.slice(0, -1)) Rt.item.eventId && await eU(e, Rt.item.eventId, Xe.primaryRecord)`（`drainSessionMailbox`）；`let r = (await cXe(e)).get(t)`（`findOutboxRecordByEventId`） | confirmed |
| 重放文字经 gateway_response 返回给渠道 | `gateway_response: W.gatewayResponse`（`createDaemon`） | confirmed |
| 按 id 读：索引 → 偏移读 → 同分区扫描 → 有 notAfter 才跨分区扫描 | `return n ? t5e(e, t, n) : null`（`readEventById`）；`await i.read(o, 0, t.byte_len, t.byte_offset)`（`readEventAtIndexedOffset`）；`return ise(r, n)`（`readEventAtIndexedOffset`） | confirmed |
| 回退扫描取不晚于 notAfter 日期的分区、从新到旧 | `a <= i).sort().reverse()`（`scanPartitionsForEventId`） | confirmed |
| 装载索引时丢弃非法条目；装载失败按未命中处理 | `r5e(o) && t.map.set(o.event_id, o)`（`loadEventIdIndex`）；`e.byte_offset >= 0`（`isUsableEventIndexEntry`）；`as an index miss`（`lookupEventIdIndexEntry`） | confirmed |
| 邮箱读取以指针写入时刻作 notAfter；仍读不到则跳过 | `created_at: p5e(s) ?? new Date().toISOString()`（`mergeInboxIntoMailbox`）；`createdAt: a.created_at ?? void 0`（`listMailboxPendingItems`）；`notAfter: de.createdAt`（`drainSessionMailbox`）；`mailbox event unresolved`（`drainSessionMailbox`） | confirmed |
| 索引只在启动时裁剪，在写锁之后，出错时释放写锁并中止启动 | `let j = await sse(d, {`（`main`）；`spine by-id index retention`（`main`）；`Runtime lock already held by pid=`（`main`） | confirmed；"出错时释放写锁并中止启动"是对 `main` 中包住裁剪调用的 try/catch 的静态阅读 |
| 裁剪规则：按分区日期保留，默认 7 天，由 ALADUO_SPINE_INDEX_RETENTION_DAYS 改 | — | 未证实推测：静态阅读所得，读取天数的函数、裁剪函数和事件日志模块初始化器都没有真名，`main` 中的调用点 `retentionDays: ose()` 不含默认值与变量名 |
| daemon 不删除 WAL 分区文件 | `o = await oR.readdir(e.eventsDir)`（`scanPartitionsForEventId`） | confirmed；静态阅读 bundle 中 `eventsDir` 的全部使用点，只有创建目录、追加与读取 |
| spine.tail 只读当日分区倒序、带游标时至多再读前一日 | `Math.min(Math.max(t?.limit ?? 200, 1), 500)`（`readSpineTail`）；`s.setUTCDate(s.getUTCDate() - 1)`（`readSpineTail`）；`for await (let p of Jut(o, u ?? 0, s, a))`（`readPartitionTail`）；`load: !1`（`resolveTailCursorEndOffset`） | confirmed |
| spine CLI 在本机直接读分区文件 | `case "cat":`（`cli:runSpineCommand`） | 未证实推测：`cli:runSpineCommand` 只做子命令分派，读取分区的函数没有真名 |
| 事件日志之外的数据：工具结果摘要、附件与 turn_meta、原始请求体、用量、对话历史 | `summary: gC(P)`（`createAgentSdkAdapter`）；`toolName: "Bash", isError: e.exitCode !== 0`（`mapItemCompletedToExecEvent`）；`turnMeta: b()`（`drainSessionMailbox`）；`rawPayload: t.rawPayload ??`（`writeIngressSnapshot`）；`CXe.join(e.usageDir`（`drainRecordPath`）；`t.sessionId && (r.resume = t.sessionId)`（`createAgentSdkAdapter`）；`"thread/resume"`（`createCodexAppServerAdapter`） | confirmed |
| 三个消费进度文件只写不读 | `last_event_id: n`（`advanceConsumerWatermark`）；`e.runQueueOffsetsDir`（`resolveConsumerOffsetPath`）；`await Nu(e, "jobs", n.id, new Date(n.ts))`（`runCadenceTick`）；`await Nu(t, "meta_session", qe.id, new Date(qe.ts))`（`createMetaSession`） | confirmed；全部 bundle 中无读取 `queue_offsets` 的代码 |
| status.json 由摄入与心跳合并更新，由 `/status` 读取 | `gateway: "ok"`（`appendBeforeExecuteGateway`）；`last_tick: n.ts`（`runCadenceTick`）；`"ALADUO Status"`（`executeGatewayCommand`） | confirmed |
| 重启后只唤醒仍有待处理指针的会话，并自愈缺失的会话键 | `!await c5e(i)`（`rehydrateSessionState`）；`d.session_key = l`（`rehydrateSessionState`）；`let w = await dse(t)`（`createSessionManager`）；`"[session-manager] skip hydrating session being archived"`（`createSessionManager`）；`"[session-manager] skip hydrating session with unavailable workspace"`（`createSessionManager`） | confirmed |
| 已有出站记录的事件在重新 drain 时不会再次执行 | `"outbox_lookup_ms", async () => qm(e, me)`（`drainSessionMailbox`） | confirmed |
| 追加与写指针之间退出的事件不会被补入邮箱；扫描器的认领早于追加；一次性调度的重试条件 | `a = await Xs(e, t.sessionKey, f)`（`appendBeforeExecuteGateway`）；`"[route] mailbox enqueued"`（`deliverRouteEventToSession`）；`"[cadence] skip due job: claim state write failed, retrying next scan"`（`scanAndSpawnDueJobs`）；`u.state.last_result === "failure") && (l = null)`（`scanAndSpawnDueJobs`） | confirmed；静态分析，bundle 中没有按 WAL 补写邮箱指针的代码 |

## 6 网关与控制面

daemon 的控制面是 JSON-RPC 2.0，三个监听器共用一套路由：本机 TCP 端口只放行只读方法，unix socket 拥有全部权限，远程监听只有在 `ALADUO_DAEMON_HOST`、`ALADUO_DAEMON_TOKEN`、`ALADUO_REMOTE_PORT` 三项齐全时才打开；入站消息写入事件日志后按命令类型决定是否进入会话邮箱，其中只有 `/compact` 属于 history-control，`/loop` 是网关展开的注入提示；出站记录由渠道经 `channel.pull` 拉取或经 WebSocket 订阅推送；重启原因由 CLI 在重启前写进一个文件、由下一个 daemon 启动时认领，不经过事件日志。下面四个小节依次讲监听器、入站、出站和重启原因文件。

### 6.1 三个监听器共用一套路由

三个监听器挂的是同一份路由和同一个分发函数，区别只在三个参数：是否检查 Host 头、是否只读、是否要求口令（confirmed）。`createDaemon (Lyt)` 创建本机 TCP 与 unix socket 两个 fastify 实例，远程实例按需创建；每个实例都注册 `/healthz`、`/dashboard`、`/readyz`、`/rpc` 和 `/ws`，`/rpc` 与 `/ws` 调用同一个按方法名逐个比较的分发函数，它识别 33 个方法（附录 B.2），其余方法返回 `-32601 Method not found`（confirmed）。因此审计权限只需要看两件事：方法在分发链里做什么，以及请求从哪个监听器进来。

| 监听器 | 地址 | 访问控制 | `/rpc` | `/ws` |
|---|---|---|---|---|
| 本机 TCP | 固定绑定 `127.0.0.1`，端口取 `ALADUO_PORT`、其次 `PORT`，默认 20233 | `/rpc` 与 `/ws` 请求的 Host 头（以及出现时的 Origin 头）必须是 `127.0.0.1`、`localhost` 或 `::1`，否则 403 | 只放行一个只读方法集合，其余方法以 HTTP 200 返回 `-32601`，消息为 "Method not available on read-only endpoint"；集合里是 `system.status`、`usage.get`、`job.list`、`spine.tail`、`system.runtime.info`、`system.config` 六个方法（方法名的置信见证据表） | 返回 426 `upgrade_required`，响应体给出 socket 路径 |
| unix socket | 默认 `<runDir>/daemon.sock`，可由 `ALADUO_DAEMON_SOCKET` 覆盖（须为绝对路径，且不超过 unix socket 的 104 字节上限） | 启动时要求 socket 所在目录属于当前用户且权限为 0700，监听后把 socket 文件改为 0600；访问控制就是文件系统权限 | 全部方法 | 可用 |
| 远程 | `ALADUO_DAEMON_HOST`:`ALADUO_REMOTE_PORT` | 对 `/rpc` 与 `/ws` 校验 `Authorization: Bearer <token>`：两边各算 SHA-256 后用 `timingSafeEqual` 比较，缺失或不符时 401 | 全部方法 | 可用 |

远程监听的开启条件由 `resolveRemoteListenerConfig (jyt)` 决定：三项环境变量都设置时才开启，主机是否为回环地址不影响这一点；主机设为非回环地址却没给口令时 daemon 拒绝启动；非回环主机给了口令却没给端口时同样拒绝启动；端口必须是 1 到 65535 的整数且不能与只读端口相同（confirmed）。口令检查只挂在 `/rpc` 与 `/ws` 上，远程监听上的 `/healthz`、`/dashboard`、`/readyz` 不需要口令（confirmed）。运行目录 `run/` 由 `initializeRuntime (Rdt)` 设为 0700，默认 socket 路径因此满足目录检查（confirmed）。

口令由 `duoduo daemon token new` 生成，daemon 缺口令时的报错文字也指向这个命令（confirmed）。这个命令生成 32 字节随机数的十六进制串，把 `ALADUO_DAEMON_TOKEN=<口令>` 写进 `~/.config/duoduo/.env`；已有口令时它拒绝轮换，除非加 `--force`，因为已连接的远程网关仍持有旧口令（未证实推测：静态阅读 CLI 代码所得，实现它的 CLI 函数没有真名）。daemon 启动时只把 `.env` 中进程环境尚未设置的键装进环境（`for (let [o, s] of Object.entries(r))(e[o] === void 0 || e[o] === "") && (e[o] = s, i++)`（`loadHostDotEnv`）），随后从进程环境读取口令，所以 `.env` 里的新口令要在 daemon 重启后才生效（confirmed）。

三个端点不经过分发函数，所有监听器都注册：`/healthz` 固定返回 `{status: "ok"}`；`/readyz` 调用 `probeEventsAppendable (Yle)` 以追加模式打开当日事件分区再关闭，失败时返回 503 `not_ready`，所以它检查的是事件日志能否写入，而不是进程是否存活；`/dashboard` 返回 bootstrap 目录下的 `dashboard.html`（confirmed）。

请求格式错误与方法错误的返回形式因传输而不同：`/rpc` 的请求体不满足 `isJsonRpcRequest (eb)`（`jsonrpc` 为 `"2.0"` 且 `method` 为字符串）时返回 HTTP 400；WebSocket 上解析失败返回 `-32700`，格式不对返回 `-32600`；参数校验失败 `-32602`；处理函数抛出未分类异常 `-32603`（confirmed）。`system.shutdown` 先返回响应，再让进程向自己发送 SIGTERM；它不在只读放行集合里，只能经 unix socket 或远程监听调用（confirmed）。

分发函数还识别 pi 引擎的回调。pi worker 经 `ALADUO_WORKER_RPC_URL` 拿到 socket 路径、经 `ALADUO_WORKER_RPC_TOKEN` 拿到按会话签发的口令；参数里带 `worker_token` 的调用先核对口令（无效时返回 `-32001`），再只放行 `notify.send`、`job.manage`、`session.manage`、`wake.set` 四个方法（其余返回 `-32601`）；这四个方法反过来也要求带有效的 `worker_token`（缺失时返回 `-32001`），并以口令绑定的会话身份执行（confirmed；四个方法对应的自操作工具见第 4.1 节）。分发链里没有 `document.get` 方法，任何监听器上调用它都返回 `-32601`（confirmed）。

### 6.2 入站分流

渠道消息经 `channel.ingress` 进入，先过三项检查，再由路由规则决定是否需要模型（confirmed）。三项检查按顺序是 WebSocket 身份参数、归档状态、工作目录：目标会话正在归档时返回 `-32011`，工作目录不可用时返回 `-32010` 并附带指引文字；经 HTTP 调用且未给 `source_kind` 时，来源种类记为 `rpc`；`channel.command` 做同样三项检查（confirmed）。另外两项检查的细则在两个没有真名的函数里，是静态阅读所得（未证实推测）：经 WebSocket 调用时必须给出业务渠道种类 `source_kind`（不能是 `rpc` 或 `ws`）和稳定的 `channel_id`，否则返回 `-32602`；工作目录依次取参数 `cwd_abs`（已标为 deprecated，使用时记警告）、渠道配置的 `new_session_workspace`（不存在时尝试创建，失败则继续往下）、会话已绑定的目录、daemon 的工作目录（`ALADUO_WORK_DIR`，缺省为进程当前目录），其中参数给出的目录或会话已绑定的目录不存在时返回 `-32010`。

两个方法成功时都返回 `{event_id, gateway_response, outbox_id}`：`gateway_response` 与 `outbox_id` 只在网关直接回复或去重命中时有值，去重命中时 `gateway_response` 是重放的文字（5.3）；`channel.ingress` 对业务渠道另带 `kind_config`（9.3）（confirmed）。

`ingestChannelMessage (Gle)` 先识别注入提示和网关命令，再由 `resolveRoutingTarget (jXe)` 决定路由目标，之后交给网关摄入函数写入事件日志（第 5.1 节）（confirmed）。网关命令先规范化别名（`/reset` 视同 `/clear`，`#debug` 视同 `/debug`）再按用途归类；注入提示在注入提示表里查找，表中只有 `loop` 一项（confirmed）。`channel.message` 的路由规则如下：

| 输入 | 路由目标 | 处理 |
|---|---|---|
| `/status`、`/config`、`/debug`（或 `#debug`）、`/cancel`、`/clear`（或 `/reset`）、`/stats`、`/task`、`/model`、`/effort` | gateway | 网关直接执行并回复，不唤醒会话、不调用模型 |
| `/compact` | session | 归类为 history-control，指针写入会话邮箱，由 drain 按引擎处理：Claude 渠道会话交给 SDK 原生压缩，会调用模型；各引擎的差异见 3.6 |
| `/loop <文字>` | session | 网关把 loop 注入提示正文与用户文字拼成消息正文，原命令记在 `payload.raw_command` |
| `/loop`（无参数） | gateway | 网关回复该注入提示的用法文字 |
| 其他文字，包括网关不认识的斜杠输入 | session | 原样写入会话邮箱 |

网关目标的消息仍然先写入事件日志，然后由 `replyToGatewayCommandEvent (LXe)` 调用 `executeGatewayCommand (BXe)` 执行：结果写成一条出站记录、追加一条 `source.kind = "gateway"` 的 `agent.result` 事件，并发出 `session.output` 总线事件把回复推给订阅者；需要让会话知道的结果（例如 `/clear` 之后的"会话已重置"）写进会话状态的 `pending_gateway_notice`，在该会话下一轮作为每轮瞬时块出现（confirmed；瞬时块见第 2.3 节）。

`channel.command` RPC 的规则与 `channel.message` 不同：`ingestChannelCommand ($b)` 只把 history-control（即 `/compact`）和带参数的注入提示送进会话，其余一律交给网关；网关不认识的命令得到 "Unsupported command" 回复和支持的命令列表（confirmed）。`session.compact` RPC 与空闲压缩扫描器 `createIdleCompactSweeper (Xbe)` 都经这条路径发出 `/compact`（confirmed）。

网关摄入函数还有第三个分支：路由目标为 `meta` 时把指针写进 `meta:subconscious` 邮箱。入站的两个摄入函数的调用方都不传入路由目标，所以没有入站消息走这个分支（confirmed）。

会话由调用方唤醒，而不是由写入函数唤醒（confirmed）。在路由结果 `routing.enqueued` 为真时发出 `session.wake` 的调用方有四个：`channel.ingress` 与 `channel.command` 的处理函数，抢占方式由 `resolvePreemptFromCommandText (kJ)` 按消息文字决定（第 7.5 节）；`enqueueSessionCompactCommand (Ryt)`，抢占方式按 `/compact` 的文字决定；空闲压缩扫描器，抢占方式为 `never`。网关摄入函数另外发出的 `spine.event` 总线事件在 bundle 中没有订阅者（confirmed）。

### 6.3 出站：拉取、订阅与能力协商

每一条回复都先写成出站记录，再经两种方式之一送到渠道：HTTP 上的 `channel.pull` 按游标拉取，WebSocket 上的 `channel.pull` 打开订阅并回放积压；两者读积压用的是同一个读取函数（confirmed）。

出站记录存放在 `var/outbox/<渠道种类>/<obx_ id>.json`，id 由 `generateOutboxRecordId (sXe)` 生成；同目录下维护按回复对象事件与按记录 id 的两个索引、每个会话一份的 replay 日志、已送达 id 列表 `.sent_ids` 和待投递队列 `.pending_queue.jsonl`（confirmed）。会话 drain 与网关命令都先写出站记录，再追加 `agent.result`（第 5.2 节）。

一条出站记录的字段由 npm 依赖 `@openduo/protocol` 的 `OutboxRecord` 与 `TurnMeta` 类型定义（src/outbox.ts，confirmed）：

| 字段 | 内容 |
|---|---|
| `id`、`created_at`、`channel_kind`、`session_key` | 记录 id、创建时间、目标渠道种类与目标会话 |
| `in_reply_to_event_id` | 这条回复所回答的事件；按它建的索引供去重重放（5.3）和重新 drain 时的跳过判断（5.5）查找 |
| `routing` | `policy`（`reply_to_origin`、`reply_override`、`fanout`）、来源事件与来源会话、`fanout_index` 与 `fanout_total` |
| `payload` | `text`、`attachments`（路径与 MIME）、自由结构的 `data`、`rendering_hints` |
| `stream` | 可选的流标识、序号与是否最后一段 |
| `status`、`attempts`、`last_attempt_at`、`last_error` | 投递状态（`pending`、`sent`、`failed`）与重试记录 |

drain 在一轮结束时为每个投递目标写一条记录：第一个目标的 `policy` 是 `reply_to_origin`，邮箱条目指定了另一个回复会话时是 `reply_override`，其余目标是 `fanout`；只有目标是渠道会话时，`payload.data` 里才带 `turn_meta`（未证实推测：静态阅读所得，写这些记录的函数没有真名）。`turn_meta` 是这一轮的统计，由 `drainSessionMailbox (KSe)` 计算：`elapsed_ms`（从 drain 开始到写出站记录）、`total_input_tokens`、`output_tokens`、`cache_hit_rate`、`total_cost_usd`、`model`、`context_used_tokens` 和 `protocol`（`anthropic`、`codex`、`grok`、`pi`）（confirmed）。按协议的类型注释，渠道适配器用这些字段渲染回复卡片的页脚，Codex 不报告成本。

daemon 内的推送由 `createOutboxDeliveryManager (Qgt)` 负责：它监听 `session.output` 总线事件，按会话串行投递给该会话的 WebSocket 订阅者；会话没有订阅者时记录保持原状态；推送失败时把记录标为 `failed` 并把尝试次数加一；仍为 `pending` 的记录和尝试少于 5 次的 `failed` 记录在每次心跳（`cadence.tick`）和 daemon 启动时重试（confirmed）。`job` 与 `meta` 会话的记录不需要渠道，直接标为已送达（未证实推测：判定函数没有真名）。

`channel.pull` 的行为取决于传输（confirmed）：

| | HTTP（`/rpc`） | WebSocket（`/ws`） |
|---|---|---|
| 返回内容 | `records`、`next_cursor`、`idle`；只有 `return_mask` 含 `final` 时才读记录，否则 `records` 为空 | `{opened: true, …}`，结果里没有记录 |
| 读取范围 | 消费者游标（或参数 `cursor`）之后的记录，条数取参数 `limit`，默认取 `ALADUO_PULL_LIMIT`，再默认 50 | 打开订阅后，若 `return_mask` 含 `final`，回放游标之后的积压，条数上限取 `ALADUO_SUBSCRIBE_REPLAY_LIMIT`，默认 0 表示不设上限 |
| 游标推进 | 读取不推进，由渠道调用 `channel.ack` 提交 | 每送出一条就推进游标、把记录标为 `sent` 并写入 `.sent_ids` |
| 其他 | — | 一条连接同时只订阅一个会话，再次调用会先取消上一个订阅；回放期间用一个集合去掉"实时推送"与"回放"之间的重复；回放完成后才发送 RPC 响应 |

订阅注册表 `createSessionSubscriptionRegistry (l6)` 按每个订阅者的 `return_mask` 分发四种通知：`final` 对应 `session.output`，`stream` 对应 `session.stream`，`tool` 对应 `session.execution`，`stream_end` 对应 `session.stream_end`；`normalizeReturnMask (bJ)` 只接受这四个值，空或全部非法时回退为 `["final", "stream"]`；向某个订阅者发送抛错时，它被移出注册表（confirmed）。

能力协商让渠道适配器只收到自己认识的内容（confirmed）。适配器在 WebSocket 上调用 `channel.pull` 时，把参数里的 `channel_capabilities` 交给 `recordChannelCapabilityDeclaration (pyt)`，按渠道种类和消费者 id 分开记进会话状态。未声明 `accept_mime`、或文件不满足 `accept_mime` 与 `max_bytes` 的附件，由附件工具直接拒绝，不会发出（第 4.5 节；pi 上的拒绝发生在工具结束之后）。`accept_stream_end_reasons` 决定 `session.stream_end` 的 `reason`：daemon 发出的取值有 `interrupted` 和 `skipped`（agent 调用了 Skip），订阅者没有声明认识 `skipped` 时，它被改写为 `interrupted` 再发送。按 `@openduo/protocol` 的类型注释，`skipped` 要求渠道撤回已渲染的部分内容，`interrupted` 要求保留，所以未声明认识 `skipped` 的适配器会保留被 Skip 的那一轮已经渲染的内容（confirmed，协议注释与代码一致）。

`channel.ack` 提交渠道的投递游标：会话正在归档时返回 `-32002`；游标对应的记录按会话键前缀里的渠道种类查找，查不到时在该会话的全部记录里查找，仍然查不到返回 `-32602 Invalid cursor`；记录的 by_id 索引缺失时先从 replay 日志补建（confirmed）。消息与通知的字段类型定义在 `@openduo/protocol` 中，这个包以 TypeScript 源码形式发布、没有依赖项。

### 6.4 重启原因文件

`<varDir>/daemon-restart-reason.json` 是 CLI 交给下一个 daemon 的一次性文件：新 daemon 启动时读取一次并立即删除，文件里的原因经每轮瞬时块与强制通知两条路送到会话（confirmed）。它不经过事件日志，因为它必须在新 daemon 存在之前写好，而事件日志的写入者是 daemon 自己；代价是它没有事件 id、没有索引、没有过期时间、也不记录由哪个 daemon 认领，下一次启动的 daemon 会认领当时存在的任何这个文件，除 daemon 日志外没有记录（confirmed）。

daemon 认可的文件内容是 `{reason, requested_at, requested_by_agent, wake_targets}`：`reason` 为字符串，`requested_by_agent` 只有值为 `true` 时才算真，`wake_targets` 是会话键或别名的列表（confirmed）。

写入方是两个 CLI 命令，都经同一个重启函数写文件。下面的描述是静态阅读 CLI 代码所得；除注明 confirmed 的参数解析与提示文字外，共用的重启函数、写入与清理文件的函数、升级命令本身和升级后的唤醒投递函数都没有真名，没有可由构建检查的引用（未证实推测）。

- `duoduo daemon restart -r "<原因>" [--wake <会话或别名>]`。`cli:parseRestartArgs (bXe)` 解析 `-r`/`--reason` 和可重复的 `--wake`；从 daemon 派生的 agent 会话内部调用而不给原因时，`cli:reasonlessRestartRefusal (DXe)` 拒绝执行（confirmed）。CLI 在停止旧 daemon 之前写文件，内容是 `{reason, requested_at, requested_by_agent}`，给了 `--wake` 时再加 `wake_targets`，此时即使没给 `-r` 也会写文件（`reason` 为空串）。CLI 按三种结果提示用户：已重启时说明唤醒会在 daemon 启动后投递，没有重启时说明 `--wake` 被丢弃，健康检查超时时说明 `--wake` 仍会在 daemon 启动完成后投递（confirmed）。
- `duoduo upgrade [版本] [--wake <会话或别名>]`。`cli:parseUpgradeArgs (wXe)` 解析版本与可重复的 `--wake`，版本缺省为 `latest`（confirmed）。安装新版本后，只有 daemon 在运行（macOS 上 launchd 服务已加载，或健康检查通过）时，CLI 才经同一个重启函数重启并写原因文件，原因固定为 `upgraded @openduo/duoduo to <实际安装的版本>`，不带 `wake_targets`；daemon 没在运行时不重启、也不写文件。这次重启夹在渠道插件升级的中间：CLI 先安装有新版本的渠道插件并停下其中正在运行的，再重启 daemon，最后重新启动这些渠道（渠道部分 confirmed，见 `cli:runUpgradeChannelPhase (xXe)`）。`--wake` 不经过这个文件：升级流程结束后，无论 daemon 是否重启，CLI 都直接经 `session.notify` RPC 逐个投递，带 `force` 与 `daemon-restart` 来源，正文写的是命令行请求的版本（例如 `latest`），不是实际安装的版本号。

文件的清理只发生在 CLI 自己拉起 daemon 的路径上（未证实推测，理由同上）。重启没有发生（停止之后健康检查仍然通过，说明旧 daemon 还在运行）或启动失败时，CLI 在文件的 `requested_at` 仍是自己写入的值时删除它，下一次启动因此不会认领这条原因；macOS 上由 launchd 托管时，CLI 只触发重启并轮询健康检查，超时也不删除文件，新 daemon 启动完成后照常认领。`cli:restartWakeReport (NXe)` 的提示与这一行为一致：没有重启时说 `--wake` 被丢弃，健康检查超时时说 `--wake` 仍会投递（confirmed）。

读取方是新 daemon 的 `main (Fyt)`（confirmed）。`claimDaemonRestartReason (zbe)` 读取文件后，在解析 JSON 之前就删除它，所以格式错误的文件被静默销毁；解析后原因去掉首尾空白、唤醒目标去掉空串，两者都为空时视同没有文件。认领结果存入模块级变量，只在原因非空时对外提供。

认领到的原因首先进入渠道会话跨越重启后的第一轮（confirmed）。`decideRestartHintInjection (Bbe)` 只在判定为 `cross-restart` 时注入 `daemon-restart-hint` 每轮瞬时块：非渠道会话判为 `out-of-scope`，从未处理过事件的会话判为 `new-session`，没有记录过 daemon 启动时刻的会话判为 `grandfather`，同一个 daemon 内判为 `same-daemon`。块的正文说明会话已在新的 daemon 进程下运行，有原因时追加原因和请求时刻（第 2.3 节）。因此 job、后台分区等非渠道会话收不到这个块。

唤醒目标另外收到一条强制通知（confirmed）。`main (Fyt)` 在监听器和会话管理器启动之后，由 `deliverDaemonRestartWakes (kyt)` 对每个唤醒目标投递一条来源为 `daemon-restart`、正文含原因的 `external.notify` 会话间投递，以 `force` 跳过"无读者拒投"检查（第 4.3 节）；目标只能是渠道会话或 job 会话，其余种类以 `forbidden_kind` 拒绝；结果只写日志。CLI 拒绝无原因重启时的提示说原因会到达重启后被唤醒的每个会话，而 daemon 代码只把它交给跨越重启的渠道会话和 `--wake` 指定的目标。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 三个监听器共用一个路由安装函数，只在三个参数上不同 | `readOnly: !0`（`createDaemon`）；`hostGuard: !1`（`createDaemon`）；`bearerToken: D.token`（`createDaemon`） | confirmed |
| 分发函数逐个比较方法名，未匹配返回 -32601 | `S.method === "system.shutdown"`（`createDaemon`）；`message: "Method not found"`（`createDaemon`） | confirmed；bundle 中 `document.get` 零命中 |
| 本机 TCP 固定绑定回环地址，端口默认 20233 | `host: "127.0.0.1"`（`createDaemon`）；`Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233)`（`main`） | confirmed |
| 本机 TCP 检查 Host 与 Origin 头 | `new Set(["127.0.0.1", "localhost", "::1"])`（`createDaemon`）；`"Host header not allowed"`（`createDaemon`）；`"Origin not allowed"`（`createDaemon`）；`403, "Forbidden"`（`createDaemon`） | confirmed |
| 本机 TCP 只放行一个只读方法集合，其余以 HTTP 200 返回 -32601 | `if ($ && !ryt.has(k.method))`（`createDaemon`）；`"Method not available on read-only endpoint"`（`createDaemon`）；`"[daemon] rejected write method on read-only port"`（`createDaemon`） | confirmed |
| 只读集合的六个方法名 | — | 未证实推测：静态阅读所得，集合是没有真名的模块级常量，`createDaemon` 中的调用点只引用集合、不含方法名 |
| 本机 TCP 的 /ws 返回 426 并指向 socket | `error: "upgrade_required"`（`createDaemon`）；`socket_path: u.daemonSocketPath`（`createDaemon`） | confirmed |
| socket 路径、长度上限、目录 0700 与文件 0600 | `J = e.daemonSocketPath ?? t.ALADUO_DAEMON_SOCKET ?? vt.join(l, "daemon.sock")`（`resolveRuntimePaths`）；`104-byte unix-socket limit`（`createDaemon`）；`daemon socket directory must be owned by this user and mode 0700`（`createDaemon`）；`await Ms.chmod(x, 384)`（`createDaemon`）；`await tr.chmod(e.runDir, 448)`（`initializeRuntime`） | confirmed |
| 远程监听需三项环境变量齐全，非回环主机缺口令或缺端口时拒绝启动 | `enabled: !1`（`resolveRemoteListenerConfig`）；`remote exposure requires an explicit ALADUO_REMOTE_PORT`（`resolveRemoteListenerConfig`）；`must differ from the read-only port`（`resolveRemoteListenerConfig`）；`u = o && !Myt(n)`（`resolveRemoteListenerConfig`） | confirmed |
| 远程口令以 SHA-256 加 timingSafeEqual 比较，只检查 /rpc 与 /ws，失败返回 401 | `createHash("sha256")`（`createDaemon`）；`qS.timingSafeEqual(ce, A)`（`createDaemon`）；`"[daemon] rejected request: missing/invalid bearer"`（`createDaemon`）；`401, "Unauthorized"`（`createDaemon`） | confirmed |
| 口令由 duoduo daemon token new 生成 | `Generate a remote-access bearer token`（`cli:printHelp`）；`remote exposure requires ALADUO_DAEMON_TOKEN; run`（`resolveRemoteListenerConfig`） | confirmed |
| token new 把口令写进 .env，已有口令时须 --force 才轮换 | — | 未证实推测：静态阅读所得，生成口令与写 `.env` 的 CLI 函数没有真名 |
| daemon 启动时只补装 .env 中未设置的键，再从进程环境读口令 | `env var(s) from ~/.config/duoduo/.env`（`main`）；`let D = jyt(process.env, S)`（`createDaemon`） | confirmed |
| 三个不经分发函数的端点；/readyz 检查事件分区能否追加 | `S.get("/healthz", async () => Xle())`（`createDaemon`）；`"dashboard.html"`（`createDaemon`）；`status: "not_ready"`（`createDaemon`）；`r = ef.join(e.eventsDir, n)`（`probeEventsAppendable`） | confirmed |
| 请求格式与方法错误的返回形式 | `error: "Invalid JSON-RPC request"`（`createDaemon`）；`message: "Parse error"`（`createDaemon`）；`message: "Invalid Request"`（`createDaemon`）；`code: -32603`（`createDaemon`）；`t.jsonrpc === "2.0" && typeof t.method == "string"`（`isJsonRpcRequest`） | confirmed |
| system.shutdown 先响应再向自身发 SIGTERM | `C.__triggerShutdown = !0`（`createDaemon`）；`setImmediate(() => process.kill(process.pid, "SIGTERM"))`（`createDaemon`） | confirmed |
| pi worker 回调先核对口令、只放行四个方法，且这四个方法要求 worker 口令 | `"invalid pi worker token"`（`createDaemon`）；`Method not available to pi worker callers`（`createDaemon`）；`requires a pi worker token`（`createDaemon`）；`[vC]: t.daemonSocketPath`（`createSessionManager`） | confirmed |
| channel.ingress 与 channel.command 的检查顺序、错误码与来源种类缺省值 | `k0e("channel.ingress", k, D)`（`createDaemon`）；`k0e("channel.command", k, D)`（`createDaemon`）；`code: -32011`（`createDaemon`）；`code: -32010`（`createDaemon`）；`k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc")`（`createDaemon`） | confirmed |
| WebSocket 身份参数的细则与工作目录的解析顺序 | `o = e.workDir ?? t.ALADUO_WORK_DIR ?? process.cwd()`（`resolveRuntimePaths`） | 未证实推测：静态阅读所得，校验函数与工作目录解析函数没有真名；引用只证明最后一级的缺省值 |
| 两个方法的返回值与 kind_config | `gateway_response: W.gatewayResponse`（`createDaemon`）；`outbox_id: W.gatewayOutboxId`（`createDaemon`）；`Lw(N) ? V.effectiveConfig?.kind_config : void 0`（`createDaemon`） | confirmed |
| 路由规则：注入提示按有无参数分流，history-control 进会话，其他网关命令留在网关 | `if (n) return n.args ? "session" : "gateway"`（`resolveRoutingTarget`）；`=== "history-control" ? "session"`（`resolveRoutingTarget`）；`if (e.name === "/compact") return "history-control"`（`classifyGatewayCommandIntent`） | confirmed |
| 网关命令集合与别名 | `if (e === "/effort") return "/effort"`（`canonicalizeGatewayCommand`）；`"/reset"`（`canonicalizeGatewayCommand`）；`"#debug"`（`canonicalizeGatewayCommand`） | confirmed |
| 注入提示表只有 loop，带参数时展开正文 | `Object.prototype.hasOwnProperty.call(LR, e)`（`lookupInjectionPrompt`）；`a = s === "session" ? Zle(r, t.text) : void 0`（`ingestChannelMessage`）；`if (t.name === "injection-usage") return {`（`executeGatewayCommand`） | confirmed |
| 网关命令写出站记录与 agent.result，通知写入会话状态 | `let f = await LXe(e, r, n?.bus, n?.gatewayCommands)`（`appendBeforeExecuteGateway`）；`pending_gateway_notice: {`（`replyToGatewayCommandEvent`）；`n.emit("session.output", {`（`replyToGatewayCommandEvent`） | confirmed |
| channel.command 只把 /compact 与带参数注入提示送进会话，未知命令回复 Unsupported | `"session" : "gateway"`（`ingestChannelCommand`）；`Unsupported command`（`executeGatewayCommand`） | confirmed |
| session.compact 与空闲压缩经 channel.command 路径发出 /compact；drain 时按引擎处理 | `command: "/compact"`（`enqueueSessionCompactCommand`）；`command: "/compact"`（`createIdleCompactSweeper`）；`if (ou === "/compact" && (n.runtime === "claude"`（`drainSessionMailbox`）；`/compact is only available in interactive sessions`（`drainSessionMailbox`）；`if (!t.compact) return`（`runHistoryControlCommand`） | confirmed |
| meta 分支存在但没有调用方使用 | `let f = "meta:subconscious"`（`appendBeforeExecuteGateway`） | confirmed；`ingestChannelMessage` 与 `ingestChannelCommand` 的全部调用方都不传路由目标 |
| 唤醒由四个调用方在入队后发出；spine.event 无订阅者 | `W.routing.enqueued && l.emit("session.wake", {`（`createDaemon`）；`preempt: kJ(k.text)`（`createDaemon`）；`preempt: kJ("/compact")`（`enqueueSessionCompactCommand`）；`preempt: "never"`（`createIdleCompactSweeper`）；`n.bus.emit("spine.event", r)`（`appendBeforeExecuteGateway`） | confirmed；bundle 中没有 `on("spine.event"` |
| 出站记录目录与索引文件 | `generateOutboxRecordId (sXe)`；`"by_event.jsonl"`（`resolveOutboxByEventIndexPath`）；`".sent_ids"`（`resolveOutboxSentIdsPath`）；`".pending_queue.jsonl"`（`resolveOutboxPendingQueuePath`）；`"replay"`（`resolveOutboxReplayDir`） | confirmed |
| 出站记录字段、三种 routing policy、TurnMeta 字段 | — | confirmed：`@openduo/protocol` 的 src/outbox.ts（TypeScript 依赖文件，不在流水线覆盖内） |
| turn_meta 由 drain 计算 | `elapsed_ms: Date.now() - a`（`drainSessionMailbox`）；`turnMeta: b()`（`drainSessionMailbox`） | confirmed |
| 各 policy 的取用条件；turn_meta 只附给渠道会话 | `"outbox_emit_ms"`（`drainSessionMailbox`） | 未证实推测：静态阅读所得，写出站记录的输出函数没有真名，此处只引用调用点 |
| daemon 内推送：按会话串行，无订阅者时不动，失败标 failed，少于 5 次的在心跳与启动时重试 | `maxAttempts: i = 5`（`createOutboxDeliveryManager`）；`if (r.getSubscribers(h.session_key).length === 0) return !1`（`createOutboxDeliveryManager`）；`error: "delivery failed"`（`createOutboxDeliveryManager`）；`attempts: t.attempts + 1`（`recordOutboxDeliveryAttempt`）；`n.on("cadence.tick", c)`（`createOutboxDeliveryManager`）；`"[pid0] outbox initial flush error"`（`main`） | confirmed |
| job 与 meta 会话的记录直接标为已送达 | `if (Xgt(h)) {`（`createOutboxDeliveryManager`） | 未证实推测：判定函数没有真名，调用点不含判定条件 |
| HTTP 拉取：只在含 final 时读记录，默认 50 条，不推进游标 | `W = V.includes("final")`（`createDaemon`）；`Number(process.env.ALADUO_PULL_LIMIT ?? 50)`（`createDaemon`）；`idle: ce.length === 0`（`createDaemon`） | confirmed |
| WebSocket 拉取：打开订阅（每条连接一个）、回放积压、送出即推进游标 | `opened: !0`（`createDaemon`）；`"[daemon] ws pull stream opened"`（`createDaemon`）；`Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0)`（`createDaemon`）；`onDelivered: async H => {`（`createDaemon`）；`method: "session.output"`（`replayOutboxBacklogToSubscriber`）；`a = typeof o == "number" && o > 0 ? o : 1 / 0`（`readOutboxRecordsPastCursor`） | confirmed |
| 订阅按 return_mask 分发四种通知，默认 final 与 stream | `i = ["final", "stream"]`（`createSessionSubscriptionRegistry`）；`method: "session.execution"`（`createSessionSubscriptionRegistry`）；`return t.length === 0 ? ["final", "stream"] : t`（`normalizeReturnMask`） | confirmed |
| 能力声明写入会话状态；未声明的 stream_end 原因改写为 interrupted | `channel_capabilities: {`（`recordChannelCapabilityDeclaration`）；`acceptStreamEndReasons: U.channel_capabilities?.outbound?.accept_stream_end_reasons`（`createDaemon`）；`v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`createSessionSubscriptionRegistry`）；`reason: me.skipped ? "skipped" : "interrupted"`（`createSessionManager`） | confirmed |
| channel.ack 的归档检查、游标校验与索引补建 | `code: -32002`（`createDaemon`）；`message: "Invalid cursor"`（`createDaemon`）；`await jR(u, k.session_key)`（`createDaemon`） | confirmed |
| 重启原因文件路径 | `"daemon-restart-reason.json"`（`daemonRestartReasonPath`） | confirmed |
| daemon 认可的文件字段 | `requested_by_agent: r.requested_by_agent === !0`（`claimDaemonRestartReason`）；`wake_targets: o.length > 0 ? o : void 0`（`claimDaemonRestartReason`）；`typeof r.reason == "string" ? r.reason.trim() : ""`（`claimDaemonRestartReason`） | confirmed |
| CLI 解析 -r 与 --wake，agent 会话内无原因时拒绝 | `t.wake.push(o.trim())`（`cli:parseRestartArgs`）；`refusing to restart the daemon without --reason`（`cli:reasonlessRestartRefusal`） | confirmed |
| CLI 按三种结果提示唤醒去向 | `delivered by the daemon once it is up`（`cli:restartWakeReport`）；`so --wake was dropped`（`cli:restartWakeReport`）；`but --wake is durable`（`cli:restartWakeReport`） | confirmed |
| upgrade 的版本缺省为 latest，--wake 可重复 | `version: "latest"`（`cli:parseUpgradeArgs`）；`try: duoduo upgrade --wake my_journal`（`cli:parseUpgradeArgs`） | confirmed |
| upgrade 在渠道插件停下之后、重新启动之前调用 daemon 重启 | `stopped for upgrade`（`cli:runUpgradeChannelPhase`）；`left stopped (was not running before the upgrade)`（`cli:runUpgradeChannelPhase`） | confirmed（渠道部分）；传入的重启闭包在没有真名的升级命令函数里 |
| CLI 写文件、清理文件、upgrade 只在 daemon 运行时重启并写固定原因、--wake 经 session.notify 投递 | — | 未证实推测：静态阅读所得，共用的重启函数、写入与清理文件的函数、升级命令函数和升级后的唤醒投递函数都没有真名 |
| session.notify RPC 把调用方给的 force 与 source 原样交给投递函数 | `C.result = await A0e(u, l, d, k)`（`createDaemon`） | confirmed |
| daemon 启动时认领一次：先删除再解析，空内容视同无文件 | `await Fbe.rm(t, {`（`claimDaemonRestartReason`）；`return i.length === 0 && o.length === 0 ? null : {`（`claimDaemonRestartReason`）；`let m = await zbe(d)`（`main`）；`"[pid0] restart reason claimed"`（`main`） | confirmed |
| 认领结果存入模块级变量，只有非空原因才对外提供 | `Ube(m), m && te("[pid0] restart reason claimed", {`（`main`）；`return q$ && q$.reason.length > 0 ? q$ : void 0`（`getPendingRestartReason`） | confirmed |
| 重启提示块只给跨越重启的渠道会话 | `stage: "out-of-scope"`（`decideRestartHintInjection`）；`stage: "cross-restart"`（`decideRestartHintInjection`）；`Restart reason, given by the caller`（`renderDaemonRestartHint`）；`text: Vbe(t.daemonRestartHint.startedAt, qbe())`（`buildTransientUserBlocks`） | confirmed |
| 唤醒目标在启动后强制投递，结果只写日志 | `m?.wake_targets?.length && await kyt(d, h, p, m)`（`main`）；`source: "daemon-restart"`（`deliverDaemonRestartWakes`）；`force: !0`（`deliverDaemonRestartWakes`）；`if (!r.force) {`（`deliverExternalSessionNotify`）；`eventType: "external.notify"`（`deliverExternalSessionNotify`）；`reason: "forbidden_kind"`（`deliverExternalSessionNotify`）；`resolveIsolatedPlaneKind (O0e)` | confirmed |

## 7 Drain 与 turn 控制

一次 drain 只处理会话邮箱顶部的一个窗口：窗口内的事件满足可合并谓词时合成一次引擎调用，否则逐条调用；渠道会话的 Claude 常驻流式连接一次只接纳一个 turn，turn 进行中到达的消息暂存起来，在下一次工具调用完成后由 PostToolUse hook 插入当前 turn；推迟的抢占只在三个边界执行；非渠道的 Claude 会话在它启动的后台子代理全部结束前不关闭输入流；执行失败统一转成一条用户可见的回复和一条 `agent.error` 事件。7.1 与 7.2 讲邮箱如何被切成引擎调用，7.3 与 7.4 讲一次调用如何交给引擎执行，7.5 到 7.7 讲调用中途的打断、延续与失败。本节只讲 drain 与 turn 的控制流程；actor 的创建、锁与并发池见第 8 节，Skip 工具的语义见 4.5，每轮瞬时块的内容见 2.3。

### 7.1 循环与单批处理器

drain 分成两层：循环是 `createSessionManager (Agt)` 内一个没有导出名的局部函数，单批处理器是 `drainSessionMailbox (KSe)`；循环每次迭代调用单批处理器一次，单批处理器每次只从邮箱顶部切出一个窗口，窗口外的事件留给下一次迭代（confirmed）。因此多条消息会被分成若干个 turn 处理，这是循环反复调用的结果，而不是一次调用内部拆成多批。循环在 actor 启动时开始运行，actor 结束或会话管理器停止时退出（证据见本节证据表）。

循环的每次迭代按固定顺序做五件事（confirmed）：

1. 对 Codex 以外的引擎，先检查引擎是否正忙：常驻流式连接上有正在执行的 turn、有 Claude CLI 自己发起的 turn（见 7.6），或者插话回调正在执行时，循环停在 `waitForWakeOrIdleTimeout (hJ)` 上等待，日志为 `"[session-manager] drain parked: CLI busy gate"`（`createSessionManager`）。
2. 应用挂起的 `/clear`，读取 job 快照（第 10 节），做指令指纹检查（第 13 节）。
3. 把 actor 置为 active，生成本次可用的工具列表（第 4 节）和插话回调（7.4），按需构造 Codex、Grok、pi 的 adapter（第 3 节）。
4. 调用一次 `drainSessionMailbox (KSe)`。
5. 处理返回值：把出站记录发到总线；引擎被拒绝（`runtime_unavailable` 或 `runtime_mismatch`，见 3.3）时结束 actor；本次没有处理任何事件时，job 与 system 会话结束，渠道会话转入空闲（8.4）；处理了事件就立即进入下一次迭代。

单批处理器的一次执行分七步（confirmed），每一步的耗时由 `runTimedDrainPhase (Eo)` 记入 drain 记录的 `perf` 字段（见"关键数据结构"）：

1. 取得本会话的 drain 租约文件（8.2），取不到就直接返回。
2. 把 inbox 目录合并进邮箱（`mergeInboxIntoMailbox (fR)`），列出待处理项，清理没有事件 id 的孤项，再重写 `mailbox.md`。
3. 用 `batchDrainItems (EH)` 切出窗口（7.2），同时收集 job 完成回执（10.3）。
4. 逐项解析窗口：循环传入的排除集合里的事件（7.4）记为跳过；出站队列里已经有针对该事件的回复时，直接记为已处理、不再调用模型（`findOutboxRecordByEventId (qm)`）；按 id 读不到正文的事件记为跳过。
5. 检查工作目录、引擎可用性和历史所属引擎（3.3）。
6. 调用引擎：可合并时，上下文准备（`prepareDrainTurnContext (SH)`）与引擎调用（`runDrainQueryAndCollectOutboundAttachments (HSe)`）各执行一次；否则逐个事件各执行一次。
7. 写回复、更新 `state.json`、把处理过的邮箱项标记为完成、追加一条 drain 记录（`appendDrainRecord (Qd)`），最后释放租约。

### 7.2 合并窗口与可合并谓词

窗口的切分与是否合并是两个独立的判断：`batchDrainItems (EH)` 决定这一次处理哪些事件，`isMergeableDrainBatch (cft)` 决定这些事件用一次调用还是逐条调用（confirmed）。

窗口从邮箱顶部顺序读取待处理项，job 完成回执不进入窗口（它们作为每轮瞬时块送达，见 10.3），第一项决定窗口的类别（confirmed）。类别由 `classifyDrainBatchClass (USe)` 给出，共三类：带 `task_id` 的 notify 投递是后台任务通知 `"worker-notify"`，`channel.message` 事件是用户消息 `"regular:human"`，其余事件是 `"regular:system"`。之后遇到三种情况之一就停止：条数达到上限，默认 5 条，后台任务通知窗口不设上限；下一项的类别与窗口不同；相邻两项的时间戳相差超过 180 秒。第三条比较的是相邻两项，而不是窗口首尾，所以间隔都在 180 秒内的一串消息可以组成跨度更长的窗口；某一项没有可解析的时间戳时，窗口剩余部分不再做时间检查。

两个默认值定义在 drain 模块的初始化器里（`vH = 5, wH = 180 * 1e3`（`initMailboxDrainRunnerModule`））；单批处理器只在调用方没有传入 `batchSize`、`mergeWindowMs` 时使用它们，会话管理器调用时不传这两个选项，插话回调也直接使用同一对常量，所以实际生效的总是这两个默认值（confirmed）。

窗口切好之后，只有两类窗口能进入合并键比较（confirmed）：一类是全部为用户消息、且没有空消息或以 `/` 开头的消息（由 `isMergeableChannelMessageBatch (dft)` 检查，因此斜杠命令总是单独处理），另一类是全部为后台任务通知；少于两个事件或类别混合的窗口一律不合并。进入比较后，窗口内每个事件的合并键必须相同。合并键由 `computeDrainCoalesceKey (pft)` 拼成三段：回复的主目标会话、回复的扇出目标列表、来源渠道标识；来源渠道标识对 route 事件取 `payload.channel_descriptor_id`，否则取 `source.channel_id`，rpc 或 ws 来源缺少 channel_id 时记为 `<legacy>`，其他来源缺少时取来源类型名。所以同一个目标会话只是合并的必要条件：扇出目标或来源渠道不同的事件仍然逐条调用。

合并成立时，`prepareDrainTurnContext (SH)` 把窗口里的所有事件拼成一段 prompt，每轮瞬时块只生成一次，系统提示与 SDK 配置取自窗口最后一个事件（称为锚点事件）所在渠道的配置；回复只写一次，挂在锚点事件上，窗口里其余事件关联到同一条回复记录（confirmed）。拼接文本由一个没有真名的函数生成：开头说明这 N 个时间相近的事件作为一次连续更新处理、只回复一次，然后按从旧到新列出每个事件的 `@evt(id)`、类型、时间和正文（未证实推测：代码已读到，但所在函数没有真名，无法给出可检查的引用）。遥测事件 `sdk_start` 用 `coalesced: pt.length > 1`（`drainSessionMailbox`）标出这是否是一次合并调用。合并不成立时，每个事件各自生成瞬时块、各自解析渠道配置、各自调用一次引擎；`/compact` 这类 history-control 命令也在这条逐条路径上处理（3.6）。

### 7.3 SDK 适配层

会话用哪个 adapter 由 `createSessionManager (Agt)` 内一个三分支的局部函数决定；Claude 的 adapter `createAgentSdkAdapter (Ef)` 把 duoduo 的运行配置转换成 Claude Agent SDK `query()` 的参数，并提供一次性的 `run()` 与常驻的 `createStreamingQuery()` 两种调用方式（confirmed）。

三个分支依次是（confirmed）：会话的 `runtime` 不是 `claude` 时，使用 actor 上唯一的 `adapter` 字段（Codex、Grok、pi 共用这一分支，adapter 的构造见第 3 节），adapter 未构造时返回一个 `run()` 调用即抛错的对象，错误信息写明 `refusing to fall through to Claude`（`createSessionManager`），不会改用 Claude；`runtime` 是 `claude` 但会话来源不是渠道（job 与 system 会话），或 SDK 不支持流式时，每个 turn 调用一次一次性的 `run()`；Claude 渠道会话则惰性创建一个 `streamingAdapter`，它的 `run()` 把 turn 放进常驻连接的队列（7.4）。

Claude adapter 内部有一个把运行配置转换成 SDK options 的构建函数，一次性调用与常驻调用共用它，两种调用最终都调用从 `@anthropic-ai/claude-agent-sdk` 导入的 `query` 函数；差别只在常驻调用总是打开 `includePartialMessages`，一次性调用只在需要流式输出文本时打开（confirmed，`includePartialMessages: !0`（`createAgentSdkAdapter`））。options 的完整字段列在本节末尾的"关键数据结构"里；其中 `systemPrompt` 的取值规则见第 2 节，`permissionMode`、`tools`、`disallowedTools` 见 3.7，`model` 与 `effort` 见 3.4。

构建函数还决定引擎子进程的环境：它复制 daemon 自身的全部环境变量，只删去 `CLAUDECODE`，按是否自动加载附加目录的 `CLAUDE.md` 设置或删除 `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`，并在设置了 `CLAUDE_CODE_EXECUTABLE` 时把它作为 Claude Code 可执行文件的路径（confirmed，`delete s.CLAUDECODE`（`createAgentSdkAdapter`））。一次性 `run()` 在 abort 信号触发后等待 `ALADUO_ABORT_CLOSE_TIMEOUT_MS`（默认 10 秒）再强制关闭 query，它另外注册一个 Skip 的 PreToolUse hook（4.5）。

adapter 之外还有一层调用包装，由 `runDrainQueryAndCollectOutboundAttachments (HSe)` 调用：带 resume 的调用失败时，包装层去掉 resume 再调用一次，并在结果上标记 `usedFallback` 与 `resumeError`；abort、turn 中断、prompt 未被接纳这三类错误不重试，直接抛出（未证实推测：代码已读到，但包装函数没有真名，无法给出可检查的引用）。drain 收到带这个标记的结果时只追加一条 `agent.error`（7.7，confirmed）。

### 7.4 常驻流式会话：单 turn 准入与插话

渠道会话的 Claude 引擎在多个 turn 之间复用同一个 SDK 流式 query：query 的输入是一个由队列驱动的 async generator，一次只放行一个 turn；turn 进行中到达的消息不另开 turn，而是暂存为 `pendingSteer`，在下一次工具调用完成后由 PostToolUse hook 作为附加上下文插入当前 turn；没有机会插入时，消息退回 inbox，成为下一个 turn（confirmed）。这套机制在 `createClaudeStreamingSessionFactory (s0e)` 与 `createSessionManager (Agt)` 中实现。

复用有明确的条件，不满足就重建（confirmed）。工厂返回的 `ensureStreamingSession` 只在四个条件同时成立时复用现有连接：连接未关闭；未被标记重建；配置签名相同；已有 turn 被接纳，或者 resume 的会话 id 没变。配置签名由 `computeStreamingConfigSignature (fJ)` 计算，是 cwd、settingSources、persistSession、permissionMode、allowedTools、disallowedTools、tools、additionalDirectories、autoloadAdditionalDirectoryClaudeMd 这九项，加上两个计算键的 JSON 串：`claudeDelivery` 记录上下文窗口的投递档位，`impliedModel` 只在上下文需求记录了模型来源（`modelOrigin`）时记录模型名、否则为 null。推理力度不在签名里：复用现有连接时，如果本次请求的力度与连接上次应用的不同，就通过 query 的 `applyFlagSettings` 直接改到现有连接上，不重建连接（`effortLevel: d`（`createClaudeStreamingSessionFactory`））。

不能复用时，工厂先写一条 `[kv-cache] respawn:` 审计日志说明原因（签名不同时附带由 `diffStreamingConfigSignature ($A)` 算出的差异列表），再用 `teardownStreamingSession (Zf)` 关闭旧连接、创建新连接，`streamingGeneration` 加一（confirmed）。连接被标记重建的来源有五个：指令漂移（第 13 节）；压缩后记忆板哈希变化；模型切换被 SDK 拒绝，来自 `/model` 命令或建连时的模型核对；turn 在 prompt 被接纳前出错或被中止；流式循环意外退出。各来源的代码见证据表。

单 turn 准入由输入 generator 执行（confirmed）。generator 每次从队列（`initAbortableAsyncQueueModule (r0e)` 定义的队列类）取出一个 turn，如果另一个 turn 仍是当前 turn，就用 `AgentSdkPromptNotAcceptedAbortError (Rr)` 拒绝新 turn，否则把它设为 `currentTurn` 并逐块输出它的 prompt。turn 的 `accepted` 在 SDK 发出 `system/init` 时置真，它只表示 prompt 已被 SDK 接纳。正常情况下 7.1 的忙检查已经阻止第二个 drain turn 入队，这里的拒绝处理竞争情况；被拒绝的事件留在邮箱里等下一次 drain（7.7）。

插话从唤醒开始，分四步完成（confirmed）：

1. **唤醒。**actor 没有停在等待上（没有 `wakeResolver`；停在等待上时唤醒只结束等待，见 8.4），唤醒的抢占档位为 `allow`，actor 上有已被接纳的 Claude turn（或非 Claude 引擎报告有活动 turn），插话回调存在且没有正在执行时，唤醒函数不打断 turn：它先设置 `pendingWake` 与 `admissionInProgress`，再运行插话回调，回调结束后调用 `wakeResolver`（`"[session-manager] wake: admitting to live streaming session"`（`createSessionManager`））。
2. **切窗口。**插话回调自己合并 inbox、列出待处理项，用 7.2 的同一对常量切一个窗口；窗口里已在 actor 的 `inflightEventIds` 集合中的事件（正在运行的 drain 已经取走）和已有回复的事件不再认领，其余事件由 `prepareDrainTurnContext (SH)` 生成合并后的文本。
3. **暂存。**对 Claude 会话，只有六个条件同时成立时才暂存：当前 turn 已被接纳；当前 turn 没有调用过 Skip；新消息不带附件；这批事件里至少有一条用户消息；当前 turn 不是只由没有用户消息的事件启动的；文本非空。已有同一 turn 下未结算的 `pendingSteer` 时，把文本和事件 id 追加进去；actor 上还没有 `pendingSteer` 时新建一个；两种情况都把认领的事件 id 加入 `inflightEventIds`。条件不成立，或者已有的 `pendingSteer` 已结算、属于另一个 turn 时，回调不暂存，这批消息由下一次 drain 作为新 turn 处理：唤醒函数在运行回调之前已经设置了 `pendingWake`，回调自己也会调用 `wakeResolver`。常驻连接已经关闭时，回调直接返回（`if (!Mi || Mi.closed) return;`（`createSessionManager`））。
4. **注入。**常驻 query 的 PostToolUse hook（matcher 为 `*`）在每次工具调用完成后检查 `pendingSteer`：当前 turn 已调用 Skip，或者 CLI 自己发起的 turn 已调用 Skip 时，直接返回空结果；否则取走 `pendingSteer`、标记已结算、把对应邮箱项标记完成、释放认领的 id，并以 `hookSpecificOutput.additionalContext` 返回暂存的文本（`"[session-manager] steer hook: injected interjection mid-turn"`（`createClaudeStreamingSessionFactory`））。

`inflightEventIds` 在插话与 drain 之间双向使用（confirmed）。drain 切出窗口后，通过 `onBatchContext` 回调把窗口的事件 id 加入这个集合，插话回调因此不会认领正在处理的事件（上面第 2 步）。反过来，循环每次调用单批处理器时把集合当时的快照作为排除集合传入（`excludeEventIds: o0e(w)`（`createSessionManager`）），单批处理器跳过其中的事件；这个快照在调用开始时只取一次，所以已经在运行的 drain 看不到之后才被插话认领的事件。每次 drain 结束时，循环清空这个集合，只有插话回调仍在执行时保留（`w.admissionInProgress || w.inflightEventIds.clear()`（`createSessionManager`）），因此下一次 drain 实际排除的是 drain 结束时仍在进行的插话所认领的事件。

暂存的消息如果等不到下一次工具调用，就退回邮箱成为新 turn，不会丢失（confirmed）。退回分两种情况：

- turn 结束时没有再调用工具：流式循环在把 result 交给 drain 之前调用 `pendingSteer` 自带的 `enqueueAsNewTurn`，它把原始邮箱行重新写入 inbox（`"[session-manager] steer fallback requeued to inbox (turn ended undelivered)"`（`createSessionManager`））。
- 流式 query 本身结束：流式循环先把连接标记为关闭，然后在收尾代码里直接把原始邮箱行写回 inbox（`"[session-manager] steer fallback requeued to inbox (stream closed)"`（`createClaudeStreamingSessionFactory`））。

两条路径都把原邮箱项标记完成、释放认领、设置 `pendingWake`。

Codex、Grok 与 pi 不走 `pendingSteer`，插话回调直接调用 adapter 的 `steerActiveTurn`，由各引擎的原生接口把文本插入正在执行的 turn（confirmed）：Codex 发送带 `expectedTurnId` 的 `turn/steer` 请求，Grok 调用 ACP 扩展方法 `interject`，pi 向 worker 发送 "steer" 帧并等待 "steer_result" 回复（pi-worker.js 字面量）。前提与 Claude 相近：活动 turn 已经调用过 Skip（读不到会话状态时按已调用处理）、这批事件里没有用户消息、当前 turn 只由没有用户消息的事件启动、文本为空，这四种情况都不插话，并记一条日志（`"[session-manager] admission callback: codex steer not attempted, redraining"`（`createSessionManager`））。与 Claude 不同的是，附件随插话一起交给 adapter。插话成功就把邮箱项标记完成；失败或不满足前提时，这批消息由下一次 drain 作为新 turn 处理。

### 7.5 抢占边界

抢占请求来自唤醒时携带的抢占档位；`requestBoundaryAwarePreempt (zS)` 根据会话当前的状态决定立即中断还是推迟，推迟的中断只在三个边界执行：prompt 被 SDK 接纳时、下一次 `tool_use` 开始时、在途的工具调用全部返回时（confirmed）。

外部消息的抢占档位由 `resolvePreemptFromCommandText (kJ)` 按文本决定：不以 `/` 开头的普通消息为 `allow`，首词为 `/cancel` 的为 `force`，其他斜杠命令为 `never`；`channel.ingress` 与 `channel.command` 在消息入邮箱后以这个档位发出唤醒（confirmed）。从其他会话路由过来的事件，调用方没有指定档位时，notify、`job.complete`、`job.fail` 三类为 `never`，其余为 `allow`（`"job.fail" ? "never" : "allow"`（`deliverRouteEventToSession`））。daemon 内部发起的唤醒，例如启动时的恢复、收尾再校验（8.5）和空闲压缩（8.4），都使用 `never`。

唤醒函数对正在运行的 actor 按档位处理（confirmed）：`allow` 先尝试插话（7.4），插话不可用时改为软抢占；`force` 请求立即抢占；`never` 只记下 `pendingWake`。只有 actor 处于 active 且有 abort 控制器时才发出抢占请求（`zS(L, "soft", H, "preempt")`（`createSessionManager`））；三种档位最后都设置 `pendingWake`，保证当前 drain 结束后立即再处理一次邮箱。`requestBoundaryAwarePreempt (zS)` 的判断分两类会话：

| 会话状态 | 条件 | 结果 |
|---|---|---|
| 有常驻 Claude query | 当前 turn 尚未被接纳 | 推迟到 SDK 接纳 prompt（`defer_accept`） |
| 有常驻 Claude query | 其他情况 | 立即调用 `query.interrupt()` |
| 无常驻 query | 没有 abort 控制器或已中止 | 不做任何事（`noop`） |
| 无常驻 query | 软抢占且模型正在输出文本 | 推迟到下一次 tool_use 开始（`defer_tool_use`） |
| 无常驻 query | 软抢占且有在途工具调用 | 推迟到在途工具调用全部返回（`defer_tool_result`） |
| 无常驻 query | 其他情况，包括立即抢占 | 立即中止 abort 控制器 |

这个函数还接受一个由调用方指定边界的参数，唤醒函数也会把唤醒事件里的 `preemptBoundary` 传给它，但 daemon 中发出 `session.wake` 的五处代码都不带这个字段，所以按指定边界推迟的分支目前不会被走到（confirmed）。有常驻 query 时，判断不看抢占档位本身，所以一个 `allow` 消息在插话不可用而当前 turn 已被接纳时（例如上一次插话回调还没结束），会立即中断当前 turn（confirmed，依据是 query 分支不读取档位参数）。

推迟的抢占只记下 `pendingPreempt`、边界和原因，由后续事件执行（confirmed）。`tool_use` 到达且边界为 tool_use 时，或者 `tool_result` 到达、边界为 tool_result 且在途工具调用已经清空时，执行事件回调调用 `triggerDeferredPreempt (mJ)`：有常驻 query 时中断 query，否则以记下的原因中止 abort 控制器。accept 边界由流式循环在收到 `system/init` 时执行，它直接调用 `interruptActorQuery (jA)`。

用户的 `/cancel` 是网关直接执行的命令（6.2），网关调用会话管理器的 `interruptSession`，它按会话有没有常驻连接分两种处理（confirmed）。Claude 渠道会话有常驻连接时，`/cancel` 不经过上表，整条连接被拆除（`await Zf(P, "cancel-interrupt", "user-cancel")`（`createSessionManager`））；其他会话以 `immediate` 调用 `requestBoundaryAwarePreempt (zS)`，立即中止 abort 控制器，即上表最后一行；会话没有正在运行的调用时，`interruptSession` 直接返回 `idle`。

拆除连接时，`teardownStreamingSession (Zf)` 在 actor 上记下一段中断说明（confirmed），常驻连接的 `run()` 在下一个 turn 入队前用一个包装函数处理 prompt（证据见证据表）。包装函数把这段说明加在下一个 turn 第一条消息的前面，用户取消与"为投递新消息而结束 turn 时有工具调用未完成"两种情况的说明文字不同（未证实推测：代码已读到，但生成与插入说明的函数没有真名，无法给出可检查的引用）。Codex 与 Grok 的适配器在一次调用因用户取消或抢占而中止时，也在下一次调用的 prompt 前加中断标记（2.3）。被中断的 turn 如何收尾见 7.7。

### 7.6 后台会话保持输入通道

Claude 的后台子代理可能在主 turn 返回结果之后才结束，它结束后的续写仍要经过同一个 Claude CLI 进程；duoduo 对两类会话分别处理：非渠道会话的一次性 `run()` 在收到结果后继续保持输入流，直到它跟踪的后台任务全部结束；渠道会话的常驻连接本来不关闭，后台任务完成时由 Claude CLI 自己发起一个 turn，duoduo 把这个 turn 的结果直接写进出站队列（confirmed）。

非渠道会话由 drain 传入的开关控制，只对 Claude 引擎、非渠道来源的会话打开（`holdInputOpenForBackgroundAgents: w.runtime === "claude" && w.origin !== "channel"`（`createSessionManager`））（confirmed）。开关打开时，Claude adapter 把 prompt 换成一个 generator，它输出 prompt 之后等待一个释放信号。adapter 从 SDK 的 `task_started` 消息里登记后台任务 id，只登记子代理任务和非 `local_bash` 类型的任务，收到对应的 `task_notification` 时移除。释放需要两个条件同时成立：已经收到 result，且登记的任务集合为空（`D && S.size === 0`（`createAgentSdkAdapter`））。为防止无限等待，收到 result 之后如果 SDK 持续没有新消息超过 `ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS`（默认 600000 毫秒，即 10 分钟），看门狗强制释放并写一条警告；警告文字说明，这时仍在运行的后台任务续写时发起的进程内 MCP 调用可能失败。

渠道会话的处理分三部分（confirmed）。第一，SDK 的 `task_notification` 系统消息以 `completion_owner: "claude-cli"` 写入事件日志，并且只写日志、不进邮箱、不唤醒会话（`"[route] wal-only route event (no mailbox, no wake)"`（`deliverRouteEventToSession`））。第二，CLI 在没有 drain turn 的情况下自己开始一个 turn 时，流式循环把它记为 `cliTurnTentative`；这个 turn 的 result 带有 task-notification 来源时，duoduo 把结果文本连同待发附件直接写入出站队列，追加一条 `origin: "cli-turn"` 的 drain 记录，并唤醒会话（`"[completion-owner] settled CLI completion turn"`（`createClaudeStreamingSessionFactory`））。如果某个 drain turn 恰好被并入了这个 CLI turn，这个 drain turn 以"prompt 未被接纳"错误作废（7.7 表第二行），它的事件留在邮箱重新 drain。第三，Grok 引擎也有对应的处理：Grok 在 drain 之外产生的 turn 由 adapter 回调写入出站队列（失败日志见证据表）。

### 7.7 失败收敛

引擎调用抛出的错误分四类收尾：turn 被中断、prompt 未被接纳、其余 abort 类错误各有固定的邮箱处理方式，其他错误一律交给 `handleDrainError (Xw)`，它给用户写一条 `[duoduo:drain-error]` 回复、向事件日志追加一条 `agent.error`；随后 `drainSessionMailbox (KSe)` 重新抛出原错误，由 drain 循环写入 `state.json` 的 `last_error` 并结束 actor（confirmed）。合并路径和逐条路径各有一组相同的判断，按下表顺序匹配：

| 错误 | 判定函数 | 邮箱项 | 其他处理 |
|---|---|---|---|
| `AgentSdkTurnInterruptedError (Fr)`：turn 被中断（已被接纳，或者未被接纳但有挂起的 `/clear`） | `isAgentSdkTurnInterruptedError (Gv)` | 标记为已处理 | drain 以 cancelled 返回 |
| `AgentSdkPromptNotAcceptedAbortError (Rr)`：prompt 未被接纳 | `isAgentSdkPromptNotAcceptedAbortError (Kv)` | 不标记，留在邮箱 | 下一次 drain 重试 |
| 其他 abort 类错误 | `isAbortLikeError (Wh)` | 标记为已处理 | 被打断的 prompt 写入 `state.json` 的 `pending_interrupted_context`，下一个 turn 作为每轮瞬时块注入（2.3） |
| 其余错误 | — | 不标记。错误回复挂在锚点事件上，下一次 drain 按"已有回复"把锚点事件记为已处理（7.1）；合并路径上窗口里的其他事件没有回复记录，逐条路径上出错事件之后的事件还没有执行，它们在下一次 drain 中重新送给引擎；例外是 turn 期间发生过插话时，这些事件可能已被插话回调标记完成，不再重送（8.2） | `handleDrainError (Xw)`，阶段为 `sdk_turn` |

引擎调用正常返回、但 abort 信号已经触发时，按第三行处理（confirmed）。被打断的 prompt 在 `pending_interrupted_context` 里去重后保存，多条之间用分隔标记隔开；会话上有待处理的 Skip 回退记录时不保存（`await oft(e, t, rft(de, me ? be : void 0))`（`drainSessionMailbox`））。第四行的错误会使 actor 结束，留在邮箱里的事件要等下一次唤醒（新消息到达，或 daemon 重启后的恢复）才会再被 drain，因为 8.5 的收尾再校验只比较 inbox，不看邮箱（confirmed，`if (!p.has(h)) return "fresh";`（`createJobSessionFinalizer`））。

`handleDrainError (Xw)` 在调用方没有提供回复文本时，以"[duoduo:drain-error] agent turn failed at <阶段名>"开头，接着是错误信息（超过 4000 字符时截断）和 `renderDrainErrorRuntimeHint (Eft)` 生成的排查建议；回复挂在锚点事件上，来源为空闲压缩的事件例外，只写事件日志（confirmed）。随后它追加一条 `agent.error` 事件，载荷含阶段与错误信息；这两次写入各自失败时只记日志。

除 `sdk_turn` 外，交给它的阶段还有非渠道会话的 `workspace_unavailable`、`runtime_unavailable`、`runtime_mismatch`，这三种由调用方提供各自的说明文字作为回复（confirmed）。渠道会话遇到这三种情况时不经过它：说明文字作为普通回复写出，事件标记为已处理，drain 返回拒绝阶段（3.3）；其中来源为空闲压缩的事件仍交给它，只写事件日志（`refusedStage: Y`（`drainSessionMailbox`））。另一个阶段是 `context_profile`：drain 在调用引擎之前，先由一个没有真名的函数解析 Claude 的模型上下文配置，即配置层里的 `claude.model_profiles` 条目（3.4），解析结果作为调用参数传给引擎（confirmed，调用点见证据表）。解析失败时，这个函数以阶段 `context_profile` 和一段指出出错配置层的说明文字调用 `handleDrainError (Xw)`，turn 不会开始（未证实推测：阶段名与说明文字位于这个无名函数内，无法给出可检查的引用）。

错误抛回 drain 循环后，循环把 `last_error`（含 `message` 与 `at`）写入 `state.json` 并结束 actor；之后任何一次成功处理了事件的 drain 会清除这个字段（confirmed，`last_error: {`（`createSessionManager`））。去掉 resume 重试（7.3）成功时，drain 不给用户写回复，只追加一条阶段为 `stage: "resume"`（`drainSessionMailbox`）的 `agent.error` 事件（confirmed）。

`renderDrainErrorRuntimeHint (Eft)` 的建议分两组（confirmed）。错误信息表明引擎进程退出或无法启动时，按引擎给出不同的处理：Codex 与 Grok 提示检查对应 CLI 的安装与登录后重启 daemon，pi 与 Claude 提示重装 duoduo，因为 pi 内嵌在包里、Claude Code 的原生二进制随 SDK 的可选依赖安装。其他错误被视为来自模型端点：Codex、Grok、pi 三个分支说明错误原文来自对应后端，并指出 `.env` 里的思考相关开关只对 Claude 有效；Claude 分支建议第三方兼容端点在 `~/.config/duoduo/.env` 设置 `DISABLE_ADAPTIVE`、`DISABLE_THINKING`、`DISABLE_INTERLEAVED_THINKING`、`MAX_THINKING_TOKENS`。会话处于 `/model` 覆盖状态时，端点错误的建议前另加一段，说明被拒绝的可能是这个模型 id，可以用 `/model reset` 恢复引擎默认值。daemon 中除这段提示文字外没有读取这四个变量的代码；它们能到达 Claude Code 子进程，是因为 adapter 把 daemon 的全部环境变量传给了子进程（7.3）；Claude Code 是否按它们关闭思考输出不在 bundle 内，属未证实推测。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| drain 循环是 `createSessionManager` 内的局部函数，actor 启动时开始，actor 结束或管理器停止时退出 | `G.drainPromise = M(G)`（`createSessionManager`）；`for (; w.status !== "ended" && ce;)`（`createSessionManager`） | confirmed |
| 每次迭代调用一次单批处理器 | `de = await KSe(t, P, {`（`createSessionManager`）；`drainSessionMailbox (KSe)` | confirmed |
| Codex 以外的引擎在 CLI 忙或插话进行中时暂停 drain | `"[session-manager] drain parked: CLI busy gate"`（`createSessionManager`）；`waitForWakeOrIdleTimeout (hJ)` | confirmed |
| 引擎拒绝时 actor 结束；无事可做时 job/system 会话结束 | `"[session-manager] runtime refusal, ending actor"`（`createSessionManager`）；`"[session-manager] job/system session drain complete, exiting"`（`createSessionManager`） | confirmed |
| 单批处理器依次合并 inbox、解析、清理孤项、重写邮箱文件，再切窗口 | `mergeInboxIntoMailbox (fR)`；`listMailboxPendingItems (lb)`；`orphan_cleanup=`（`drainSessionMailbox`）；`renderSessionMailboxFile (pR)`；`batchDrainItems (EH)` | confirmed |
| 排除集合里的事件跳过；已有回复的事件直接记为已处理，不再调用模型 | `if (n.excludeEventIds?.has(me)) {`（`drainSessionMailbox`）；`"outbox_lookup_ms"`（`drainSessionMailbox`）；`findOutboxRecordByEventId (qm)` | confirmed |
| 各阶段耗时记入 perf | `runTimedDrainPhase (Eo)`；`"mailbox_merge_ms"`（`drainSessionMailbox`） | confirmed |
| 窗口默认 5 条、相邻间隔 180 秒，调用方不传时生效 | `vH = 5, wH = 180 * 1e3`（`initMailboxDrainRunnerModule`）；`n.batchSize ?? vH`（`drainSessionMailbox`）；`n.mergeWindowMs ?? wH`（`drainSessionMailbox`） | confirmed |
| 窗口停止条件：条数、类别变化、相邻时间差；后台任务通知窗口不限条数；job 回执不进窗口；时间戳缺失后不再做时间检查 | `u = () => fft(a) ? Number.POSITIVE_INFINITY : n.fallbackBatchSize`（`batchDrainItems`）；`if (USe(c) !== a) break;`（`batchDrainItems`）；`if (Math.abs(f - o) > n.mergeWindowMs) break;`（`batchDrainItems`）；`if (c && oke(c) !== null) continue;`（`batchDrainItems`）；`s = !1, i.push(l);`（`batchDrainItems`） | confirmed |
| 三个窗口类别 | `return e ? rke(e) ? "worker-notify" : EO(e) ? lft : bH : bH`（`classifyDrainBatchClass`）；`lft = "regular:human", bH = "regular:system"`（`initMailboxDrainRunnerModule`）；`isWorkerTaskNotifyDelivery (rke)` | confirmed |
| 只有全为用户消息或全为后台任务通知的窗口进入合并键比较；用户消息不得为空或以斜杠开头；合并键全同 | `e.length < 2 ? !1`（`isMergeableDrainBatch`）；`e.every(i => rke(i.event)) ? nke(e, t) : !1`（`isMergeableDrainBatch`）；`r.startsWith("/")`（`isMergeableChannelMessageBatch`）；`return n.size === 1`（`hasUniformDrainCoalesceKey`） | confirmed |
| 合并键含主目标、扇出目标与来源渠道 | `primaryTargetSessionKey: r`（`computeDrainCoalesceKey`）；`payload?.channel_descriptor_id`（`resolveEventSourceChannelId`）；`"<legacy>"`（`resolveEventSourceChannelId`） | confirmed |
| 合并时一次上下文准备、一次调用；锚点是窗口最后一个事件，其余事件关联到同一条回复 | `if (cft(pt, t)) {`（`drainSessionMailbox`）；`let u = r[r.length - 1]`（`prepareDrainTurnContext`）；`pt.slice(0, -1)`（`drainSessionMailbox`）；`coalesced: pt.length > 1`（`drainSessionMailbox`） | confirmed |
| 合并 prompt 的文字格式（事件数、"只回复一次"、逐条 `@evt`） | `b = yft(r)`（`prepareDrainTurnContext`） | 未证实推测（引用的只是调用点；生成文字的函数没有真名） |
| 非 Claude 引擎的 adapter 缺失时抛错，不改用 Claude | `refusing to fall through to Claude`（`createSessionManager`） | confirmed |
| Claude adapter 两种调用方式都调用 SDK 的 query，常驻方式总是打开部分消息流 | `query: khe({`（`createAgentSdkAdapter`）；`includePartialMessages: !0`（`createAgentSdkAdapter`） | confirmed |
| 引擎子进程继承 daemon 的环境变量，可执行文件路径可由环境变量指定 | `delete s.CLAUDECODE`（`createAgentSdkAdapter`）；`r.pathToClaudeCodeExecutable = a`（`createAgentSdkAdapter`） | confirmed |
| 一次性调用在 abort 后等待默认 10 秒再强制关闭 | `pB(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4)`（`createAgentSdkAdapter`）；`parsePositiveMsEnv (pB)` | confirmed |
| 引擎调用经过一层包装函数 | `let i = await jft(e, t, n, r)`（`runDrainQueryAndCollectOutboundAttachments`） | confirmed |
| 包装函数在 resume 调用失败时去掉 resume 重试一次，abort、中断、未接纳三类错误除外，结果带 usedFallback 与 resumeError | `let i = await jft(e, t, n, r)`（`runDrainQueryAndCollectOutboundAttachments`） | 未证实推测（重试与排除逻辑位于没有真名的包装函数内） |
| drain 对 usedFallback 结果只追加 agent.error | `if (Nn.usedFallback && Nn.resumeError) {`（`drainSessionMailbox`）；`stage: "resume"`（`drainSessionMailbox`） | confirmed |
| 常驻连接按配置签名复用，签名含九个字段与两个计算键 | `u.streamingState.configSignature === p`（`createClaudeStreamingSessionFactory`）；`u.streamingState.initialSessionId === m`（`createClaudeStreamingSessionFactory`）；`computeStreamingConfigSignature (fJ)`；`[KEe]: r`（`computeStreamingConfigSignature`）；`CA = "claudeDelivery", KEe = "impliedModel"`（`initInstructionsFingerprintModule`） | confirmed |
| 连接被标记重建的五个来源 | `reason: "instructions-drift"`（`createSessionManager`）；`reason: "board-refresh(B4)"`（`createSessionManager`）；`reason: "live-command"`（`createSessionManager`）；`reason: "spawn-reconcile"`（`createClaudeStreamingSessionFactory`）；`new Fr("SDK turn cancelled before prompt acceptance")`（`createClaudeStreamingSessionFactory`）；`"[kv-cache] streaming loop exited unexpectedly (closed)"`（`createClaudeStreamingSessionFactory`） | confirmed |
| 推理力度不在签名里，复用连接时直接应用到现有连接 | `effortLevel: d`（`createClaudeStreamingSessionFactory`）；`"[session-manager] failed to apply drain effort to the live session"`（`createClaudeStreamingSessionFactory`） | confirmed |
| 不能复用时写审计日志并重建连接 | `"[kv-cache] respawn: signature-mismatch"`（`createClaudeStreamingSessionFactory`）；`"[kv-cache] respawn: resume-sessionid-change"`（`createClaudeStreamingSessionFactory`）；`diffStreamingConfigSignature ($A)`；`teardownStreamingSession (Zf)` | confirmed |
| 槽位被占时拒绝新 turn；accepted 在 init 时置真 | `J.reject(new Rr("Streaming slot occupied — prompt not yielded; retry after the occupant settles"))`（`createClaudeStreamingSessionFactory`）；`R.hasAcceptedTurn = !0, M.accepted = !0`（`createClaudeStreamingSessionFactory`）；`AgentSdkPromptNotAcceptedAbortError (Rr)` | confirmed |
| actor 停在等待上时唤醒只结束等待；否则 `allow` 唤醒在有活动 turn 时先设置 pendingWake，再运行插话回调，结束后调用 wakeResolver | `"[session-manager] wake delivered to idle actor"`（`createSessionManager`）；`L.pendingWake = !0, L.admissionInProgress = !0;`（`createSessionManager`）；`"[session-manager] wake: admitting to live streaming session"`（`createSessionManager`）；`w.admissionCallback = async () => {`（`createSessionManager`） | confirmed |
| 插话回调用同一对常量切窗口，跳过在途与已有回复的事件 | `fallbackBatchSize: vH`（`createSessionManager`）；`if (w.inflightEventIds.has(yt.eventId)) {`（`createSessionManager`） | confirmed |
| Claude 插话的六个前提与暂存、追加；只向同一 turn 下未结算的 pendingSteer 追加 | `!!ji && ji.accepted && !ji.skipCalled && !js && !vn.isNotifyOnly && !w.liveTurnNotifyOnly && Zo.length > 0`（`createSessionManager`）；`isNotifyOnly: g && !y`（`prepareDrainTurnContext`）；`if (yt && !yt.settled && yt.spawningTurn === ji) {`（`createSessionManager`）；`"[session-manager] admission callback: parked claude steer"`（`createSessionManager`）；`"[session-manager] admission callback: appended claude steer"`（`createSessionManager`） | confirmed |
| 不暂存时回调调用 wakeResolver | `w.pendingWake = !0, w.wakeResolver?.()`（`createSessionManager`） | confirmed |
| inflightEventIds 双向排除：drain 窗口加入集合，快照作为排除集合，drain 结束时清空（插话进行中除外） | `excludeEventIds: o0e(w)`（`createSessionManager`）；`for (let pn of Ve.eventIds) w.inflightEventIds.add(pn)`（`createSessionManager`）；`w.inflightEventIds.clear()`（`createSessionManager`）；`snapshotInflightEventIds (o0e)` | confirmed |
| 插话在 PostToolUse hook 注入；当前 turn 或 CLI 自发 turn 已 Skip 时不注入 | `"[session-manager] steer hook: injected interjection mid-turn"`（`createClaudeStreamingSessionFactory`）；`additionalContext: J.join`（`createClaudeStreamingSessionFactory`）；`if (R.currentTurn?.skipCalled === !0) return {};`（`createClaudeStreamingSessionFactory`）；`if (R.cliTurnTentative?.skipObserved === !0) return {};`（`createClaudeStreamingSessionFactory`） | confirmed |
| 没能注入的插话退回 inbox：turn 结束走 enqueueAsNewTurn，流结束在收尾代码里直接写回 | `"[session-manager] steer fallback requeued to inbox (turn ended undelivered)"`（`createSessionManager`）；`R.closed = !0, R.needsRecreation = !0`（`createClaudeStreamingSessionFactory`）；`u.pendingSteer && (await V(), u.wakeResolver?.())`（`createClaudeStreamingSessionFactory`）；`"[session-manager] steer fallback requeued to inbox (stream closed)"`（`createClaudeStreamingSessionFactory`） | confirmed |
| 非 Claude 引擎经各自原生接口插话，失败时改为新 turn | `let yt = w.adapter?.steerActiveTurn`（`createSessionManager`）；`r.request("turn/steer"`（`createCodexAppServerAdapter`）；`bw("interject")`（`createGrokAcpAdapter`）；`"[session-manager] admission callback: codex steer fell back to redrain"`（`createSessionManager`） | confirmed（pi 的 "steer" 与 "steer_result" 依据 pi-worker.js 字面量） |
| 非 Claude 插话的前提：未 Skip、有用户消息、turn 不是只由通知启动、文本非空 | `"[session-manager] admission callback: codex steer not attempted, redraining"`（`createSessionManager`）；`notifyOnlyBatch: vn.isNotifyOnly`（`createSessionManager`）；`emptyText: mt.length === 0`（`createSessionManager`）；`"[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)"`（`createSessionManager`） | confirmed |
| 抢占档位由消息文本决定，入站时随唤醒发出 | `"/cancel" ? "force" : "never"`（`resolvePreemptFromCommandText`）；`preempt: kJ(k.text)`（`createDaemon`）；`preempt: kJ(k.command)`（`createDaemon`） | confirmed |
| 唤醒按档位选择软抢占、立即抢占或只排队 | `zS(L, "soft", H, "preempt")`（`createSessionManager`）；`zS(L, "immediate", H, "preempt")`（`createSessionManager`）；`"[session-manager] wake: preempt disabled, queueing only"`（`createSessionManager`） | confirmed |
| 抢占判断表 | `requestBoundaryAwarePreempt (zS)`；`"defer_accept"`（`requestBoundaryAwarePreempt`）；`"noop"`（`requestBoundaryAwarePreempt`）；`t === "soft" && e.isStreaming`（`requestBoundaryAwarePreempt`） | confirmed |
| 路由事件的默认抢占档位 | `"job.fail" ? "never" : "allow"`（`deliverRouteEventToSession`） | confirmed |
| 唤醒函数转发 preemptBoundary，但没有发送方携带它 | `H = P?.preemptBoundary`（`createSessionManager`） | confirmed（bundle 中发出 `session.wake` 的五处调用都不含 `preemptBoundary` 字段） |
| 推迟的抢占在 tool_use、tool_result 清空、init 三处执行 | `w.pendingPreemptBoundary === "tool_result" && w.activeToolCalls.size === 0`（`createSessionManager`）；`u.pendingPreemptBoundary === "accept"`（`createClaudeStreamingSessionFactory`）；`triggerDeferredPreempt (mJ)` | confirmed |
| 执行时有 query 就 interrupt，否则中止控制器 | `e.query?.interrupt()`（`interruptActorQuery`）；`e.currentAbortController?.abort(t)`（`triggerDeferredPreempt`） | confirmed |
| `/cancel`：有常驻连接时拆除整条连接，否则以 immediate 抢占 | `await Zf(P, "cancel-interrupt", "user-cancel")`（`createSessionManager`）；`zS(P, "immediate", void 0, "user-cancel")`（`createSessionManager`）；`"[session-manager] interrupt: stopping streaming session"`（`createSessionManager`） | confirmed |
| 拆除时记下中断说明；常驻连接的 run() 用包装函数处理下一个 turn 的 prompt | `Egt(e, n)`（`teardownStreamingSession`）；`H = i0e(w, P)`（`createSessionManager`） | confirmed |
| 说明加在下一个 turn 第一条消息前，文字按取消与未完成工具调用两种情况区分 | `H = i0e(w, P)`（`createSessionManager`） | 未证实推测（记录与插入说明的函数没有真名） |
| 非渠道 Claude 会话保持输入流，直到收到结果且登记的后台任务清空 | `holdInputOpenForBackgroundAgents: w.runtime === "claude" && w.origin !== "channel"`（`createSessionManager`）；`prompt: x ? J() : t.prompt`（`createAgentSdkAdapter`）；`D && S.size === 0`（`createAgentSdkAdapter`） | confirmed |
| 不登记 local_bash 后台任务；静默 10 分钟强制释放 | `X !== "local_bash"`（`createAgentSdkAdapter`）；`pB(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5)`（`createAgentSdkAdapter`）；`hold-input idle watchdog fired`（`createAgentSdkAdapter`） | confirmed |
| 渠道会话的后台任务通知只写日志 | `completion_owner: "claude-cli"`（`createClaudeStreamingSessionFactory`）；`"[session-manager] task_notification recorded WAL-only"`（`createClaudeStreamingSessionFactory`）；`"[route] wal-only route event (no mailbox, no wake)"`（`deliverRouteEventToSession`） | confirmed |
| CLI 自发 turn 的结果直接写出站队列；被并入的 drain turn 作废重试 | `J.origin?.kind === "task-notification"`（`createClaudeStreamingSessionFactory`）；`"[completion-owner] settled CLI completion turn"`（`createClaudeStreamingSessionFactory`）；`origin: "cli-turn"`（`createClaudeStreamingSessionFactory`）；`"Task-completion turn folded with mailbox drain; retrying the drain"`（`createClaudeStreamingSessionFactory`） | confirmed |
| Grok 在 drain 之外产生的 turn 写入出站队列 | `"[session-manager] grok detached-turn outbox write failed"`（`createSessionManager`） | confirmed |
| Fr 的三个来源：已接纳后中断、接纳前中止且有挂起的 /clear、执行中流式 query 结束 | `M.accepted ? M.reject(new Fr)`（`createClaudeStreamingSessionFactory`）；`new Fr("SDK turn cancelled before prompt acceptance")`（`createClaudeStreamingSessionFactory`）；`new Fr("Streaming SDK query ended during execution")`（`createClaudeStreamingSessionFactory`） | confirmed |
| 三类中断错误的邮箱处理 | `isAgentSdkTurnInterruptedError (Gv)`；`isAgentSdkPromptNotAcceptedAbortError (Kv)`；`isAbortLikeError (Wh)`；`Xf.consumed = !1, qe = !0`（`drainSessionMailbox`） | confirmed |
| 被打断的 prompt 去重后保存，供下一个 turn 注入；有待处理的 Skip 回退时不保存 | `!(await ct(e, t))?.pending_skip_rewind`（`drainSessionMailbox`）；`await oft(e, t, rft(de, me ? be : void 0))`（`drainSessionMailbox`）；`<interrupted-entry-sep />`（`initMailboxDrainRunnerModule`） | confirmed |
| 其余错误转成用户回复与 agent.error 事件，随后单批处理器重新抛出原错误，由循环捕获 | `stage: "sdk_turn"`（`drainSessionMailbox`）；`[session-manager] error in drain loop for`（`createSessionManager`）；`[duoduo:drain-error] agent turn failed at ${n.stage}`（`handleDrainError`）；`type: "agent.error"`（`handleDrainError`）；`r.length > 4e3 ? r.slice(0, 4e3)`（`handleDrainError`） | confirmed（`handleDrainError` 函数体内没有 throw；抛出的是单批处理器在它返回后重新抛出的原错误） |
| 错误回复只挂在锚点事件上，窗口里其他事件没有回复记录 | `item: n.anchor.item`（`handleDrainError`）；`anchor: me`（`drainSessionMailbox`） | confirmed |
| actor 结束后的收尾再校验只比较 inbox | `if (!p.has(h)) return "fresh";`（`createJobSessionFinalizer`） | confirmed |
| 调用方可以提供自己的回复文本；渠道会话的拒绝阶段写普通回复并返回拒绝阶段，空闲压缩来源除外 | `o = n.userText ??`（`handleDrainError`）；`refusedStage: Y`（`drainSessionMailbox`）；`fn.event.source?.name === "idle-compact"`（`drainSessionMailbox`） | confirmed |
| 空闲压缩触发的错误只写日志 | `"[runner] idle-compact drain error — spine only, no channel record"`（`handleDrainError`） | confirmed |
| drain 在调用引擎之前解析模型上下文配置，结果作为调用参数 | `Ro = await jSe(e, t, {`（`drainSessionMailbox`）；`claudeContextRequirement: Ro.requirement`（`drainSessionMailbox`） | confirmed |
| 解析失败以 context_profile 阶段交给 handleDrainError，turn 不开始 | `Ro = await jSe(e, t, {`（`drainSessionMailbox`） | 未证实推测（阶段名与说明文字位于没有真名的函数内） |
| 错误抛回循环后写 last_error 并结束 actor；成功处理事件后清除 | `last_error: {`（`createSessionManager`）；`await ea(t, P, "last_error")`（`createSessionManager`） | confirmed |
| 排查建议分进程退出与端点错误两组，按引擎分支 | `n.includes("process exited with code")`（`renderDrainErrorRuntimeHint`）；`The DISABLE_THINKING/DISABLE_ADAPTIVE knobs`（`renderDrainErrorRuntimeHint`）；`"For third-party compatible endpoints"`（`renderDrainErrorRuntimeHint`）；`puts the session back on the runtime default`（`renderDrainErrorRuntimeHint`） | confirmed |
| 思考相关环境变量只出现在提示文字里，Claude Code 是否使用它们 | `renderDrainErrorRuntimeHint (Eft)`；`delete s.CLAUDECODE`（`createAgentSdkAdapter`） | 未证实推测（daemon 内没有读取这些变量的代码；Claude Code 的行为不在 bundle 内） |
| actor 字面量 | `activeToolCalls: new Map`（`createSessionManager`）；`consecutiveConservativeRedrive: K?.consecutiveConservativeRedrive ?? !1`（`createSessionManager`） | confirmed |
| drain 记录的路径与字段 | `CXe.join(e.usageDir`（`drainRecordPath`）；`suspected_in_process_break: R ? !0 : void 0`（`drainSessionMailbox`）；`Mle = .5`（`IN_PROCESS_BREAK_HIT_RATIO_FLOOR`）；`detectInProcessBreak (aU)` | confirmed |
| 工具计数来自包装执行事件的回调 | `me.type === "tool_use" ? l += 1`（`drainSessionMailbox`） | confirmed |
| usage.get 汇总 | `e.total_drains += 1`（`accumulateDrainRecordIntoSummary`） | confirmed |
| Skip hook 在当前 turn 或 CLI 自发 turn 上记下 Skip | `R.cliTurnTentative.skipObserved = !0`（`createClaudeStreamingSessionFactory`） | confirmed |

### 关键数据结构

以下字段名均已对照代码逐项核对（confirmed）。

- **session actor**（`createSessionManager (Agt)` 创建 actor 时的对象字面量）。标识与生命周期：`sessionKey`、`actorRunId`、`status`（`active`/`idle`/`ended`）、`origin`（`channel`/`job`/`system`）、`jobId`、`jobStateless`、`runtime`、`holdsPoolSlot`、`attachedChannels`（Set）、`idleSince`、`spawnedAt`、`lastActivityAt`、`lastTurnCompletedAt`、`lastCliTurnSettledAt`、`consecutiveConservativeRedrive`（布尔）。引擎连接：`sdkSessionId`、`sdkSessionIdVerified`、`query`、`streamAbortController`、`streamingState`、`streamingAdapter`、`streamingGeneration`、`adapter`（Codex、Grok、pi 共用）、`adapterFacts`。drain 与唤醒：`drainPromise`、`wakeResolver`、`pendingWake`、`currentAbortController`、`pendingClear`、`inflightEventIds`（Set）、`admissionInProgress`、`admissionCallback`、`pendingSteer`、`liveTurnNotifyOnly`、`agentNotifiedThisDrain`。抢占：`isStreaming`、`activeToolCalls`（Map，值为 `{toolName, startedAtMs}`）、`pendingPreempt`、`pendingPreemptBoundary`（`accept`/`tool_use`/`tool_result`）、`pendingPreemptReason`。运行中另会写入 `spawnBoardHash`、`lastTranscriptPath`、`pendingInterruptMarker`。
- **streamingState**（`createClaudeStreamingSessionFactory (s0e)`）：`queue`、`abortController`、`configSignature`、`initialSessionId`、`hasAcceptedTurn`、`needsRecreation`、`closed`、`currentTurn`、`loopPromise`、`cliTurnTentative`（`{skipObserved, compromised}` 或 null）、`spawnMaxContextToken`、`spawnDeliveryToken`、`liveModel`、`lastAppliedEffort`；收到 result 后另记 `lastModelUsage`、`lastTotalCostUsd`。
- **常驻连接的 turn 项**（`streamingAdapter.run()` 入队的对象）：`input`、`resolve`、`reject`、`accepted`、`sessionId`、`text`、`structured`、`usage`、`streamedText`、`turnStreamedText`、`toolUseMap`、`toolBlockIndexMap`、`skipCalled`。
- **pendingSteer**（插话回调创建）：`steerText`、`eventIds`、`claimedEventIds`、`enqueueAsNewTurn`、`spawningTurn`、`requeueLines`、`requeueEventIds`、`processedEventIds`、`settled`。
- **drain 记录**（`appendDrainRecord (Qd)` 追加到 `var/usage/<会话键>.jsonl`，文件名中的 `/` 与 `\` 换成 `_`）：`id`、`session_key`、`sdk_session_id`、`drain_started_at`、`drain_duration_ms`、`sdk_duration_ms`、`events_processed`、`events_skipped`、`tool_calls`、`tool_errors`、`output_chars`、`cancelled`、`usage`（`input_tokens`、`output_tokens`、`cache_creation_input_tokens`、`cache_read_input_tokens`、`total_cost_usd`、`protocol`、`model`、`context_used_tokens`）、`perf`（各阶段的 `*_ms`，以及 `sdk_ttft_ms_total`、`sdk_ttft_samples`）、`compact`、`suspected_in_process_break`。`suspected_in_process_break` 在本次 drain 期间常驻连接没有重建、而缓存读取占缓存输入的比例低于 0.5 时为真（阈值常量为 `IN_PROCESS_BREAK_HIT_RATIO_FLOOR (Mle)`，判定函数见证据表）。常驻连接上 CLI 自发的 turn 另记一条 `origin: "cli-turn"`、事件数为零的记录。`usage.get` 的汇总逐条累加这些记录（证据见证据表）。
- **SDK options**（Claude adapter 的内部构建函数）：`resume`、`abortController`、`cwd`、`settingSources`、`persistSession`、`outputFormat`、`model`、`effort`、`permissionMode`、`systemPrompt`、`allowedTools`、`tools`、`disallowedTools`、`mcpServers`、`additionalDirectories`、`env`、`settings`、`pathToClaudeCodeExecutable`、`hooks`、`includePartialMessages`；设置 `ALADUO_SDK_DEBUG` 时另加 `debug` 与 `stderr`。
- **常驻 query 的内建 hooks**（同一个对象字面量，位于 `createClaudeStreamingSessionFactory (s0e)`）：PreToolUse、matcher 为 `*`，只对主代理把 `transcript_path` 写入 `state.json`；PreToolUse、matcher 为 Skip 工具名，结束当前 turn，并在当前 turn 或 CLI 自发的 turn 上记下 Skip（4.5）；PostToolUse、matcher 为 `*`，注入 `pendingSteer`（7.4），当前 turn 或 CLI 自发的 turn 已调用 Skip 时不注入。一次性 `run()` 只注册 Skip 的 PreToolUse hook。

## 8 会话 actor、锁与并发池

每个会话键在会话管理器的内存里至多对应一个 actor；进程写锁保证一个数据目录只有一个 daemon 在写，按会话键的异步互斥保证同一会话的状态文件改动串行执行；渠道与 job 两个并发池分别限流；空闲的 actor 先释放池位，超时后再回收引擎进程；对外的会话 RPC 按会话键前缀拒绝越界操作，actor 结束时再检查一次 inbox，避免漏掉结束前到达的消息。这些机制都在 `createSessionManager (Agt)` 与少数几个锁函数里实现，全部运行在同一个 daemon 进程内。8.1 讲会话键、会话目录与 actor 的对应关系，8.2 讲锁，8.3 与 8.4 讲池与生命周期，8.5 讲隔离与收尾检查；turn 内的插话与抢占见第 7 节。

### 8.1 会话键与 actor

会话键是一个字符串，运行时从它的前缀推出会话的类别和平面，不另设会话注册表；每个会话键在会话管理器的一个内存 Map 里至多有一个 actor 记录（confirmed）。会话键由产生会话的一方生成：渠道适配器（第 9 节）、job 管理器（`job:` 前缀，第 10 节）、stdio 客户端，以及 daemon 自己，后台分区的会话默认使用 `"meta:subconscious"`（`createMetaSession`）；会话管理器除前缀外不解析它。stdio 客户端的会话键形如 `stdio:<名字>:<工作目录 realpath 的 SHA-256 前 12 位>`（未证实推测：代码已读到，但 cli bundle 中构造它的函数没有真名）。前缀规则里还有 `cadence:` 与 `system:`，daemon 与 cli bundle 中都没有生成这两种会话键的代码。

会话的磁盘目录是 `var/sessions/<会话键的 sha256>/`（`resolveSessionDir (Jn)`），归档后移到 `var/sessions-archive/` 下的同名目录；归档目录存在而活动目录不存在时，`isSessionArchived (Ks)` 判定会话已归档（confirmed）。目录里的文件如下（confirmed，证据见证据表）：

| 路径 | 内容 | 写入方 |
|---|---|---|
| `inbox/*.pending` | 每个文件一行邮箱指针（如 `- [ ] @evt(<事件 id>)`），文件名记下写入时刻 | `enqueueSessionInboxLine (Xs)` |
| `inbox/quarantine/` | 读不了的 inbox 文件移到这里 | `mergeInboxIntoMailbox (fR)` |
| `mailbox/pending/*.item.json` | 合并后的邮箱项：指针行、事件 id、回复目标会话、`created_at`；标记完成时删除 | `mergeInboxIntoMailbox (fR)` |
| `mailbox/notes.jsonl` | drain 追加的处理说明（如处理数、跳过数、孤项清理数） | 单批处理器 |
| `mailbox.md` | 邮箱的可读视图：待处理行与最近的处理说明 | `renderSessionMailboxFile (pR)` |
| `meta.md` | 会话描述：会话键、显示名、类别、owner 会话 | `ensureSessionDescriptorAndStateFiles (OR)` 等 |
| `state.json` | 运行状态 | `patchSessionRuntimeState (et)` 等 |

`state.json` 的字段按用途分为七组（confirmed，只列第 7、8 节用到的字段）：位置与权限（`session_key`、`cwd`、`plane`、`permission_profile`、`source_channel_id`）；处理进度（`last_event_id`、`last_event_at`）；引擎绑定（`sdk_session_id`、`sdk_session_runtime`、`pending_fork_to`，以及会话级的 `model`、`effort` 覆盖）；上下文测量（`context_used_tokens`、`last_served_model`、`last_compact_at`、`compact_stats`）；下一个 turn 要注入的挂起内容（`pending_gateway_notice`、`pending_interrupted_context`、`pending_skip_rewind`）；指令指纹（`instructions_fingerprint`、`mission_fingerprint`、`board_layer_hash` 等，第 13 节）；其他（`last_error`、`transcript_path`、`last_seen_daemon_started_at`、`last_seen_board_hash`）。会话索引另从 `compact_stats` 派生出 `compact_measured_floor`，供 8.4 的空闲压缩使用。

按前缀分类的函数不止一个；下表是有真名的三个，它们对 `cadence:` 与 `subconscious:` 两个前缀的归类并不一致（confirmed）：

| 前缀 | `classifySessionKeyKind (lr)` | `classifySessionKeyOrUnknown (to)` | `classifySessionPlane (Oft)` |
|---|---|---|---|
| `job:` | job | job | work |
| `meta:` | meta | meta | system |
| `cadence:` | meta | system | system |
| `system:` | system | system | system |
| `subconscious:` | subconscious | channel | work |
| 其他含冒号的键 | channel | channel | work |
| 不含冒号的键 | channel | unknown | work |

三个函数服务不同的调用点（confirmed）。第一列的函数用于对外 RPC 的隔离检查和用户可见会话的筛选（8.5）；第二列的函数用于 drain 内只对渠道会话生效的处理，例如引擎被拒时把说明作为普通回复写出（3.3）；第三列的函数在 `state.json` 没有记录平面时提供默认值，网关侧另有一个规则相同的函数。并发池的归属由另一个函数决定（8.3）。

actor 记录按会话键存放，每次启动 actor 时生成一个新对象替换旧记录，`actorRunId` 单调递增，并从旧记录继承 SDK 会话 id、常驻连接的代数、渠道附着集合、来源、job id、引擎和 adapter（confirmed，`"[session-manager] actor start"`（`createSessionManager`））。唤醒启动 actor 时，唤醒函数按前缀推断来源：`job:` 为 job，`meta:`、`cadence:`、`system:` 为 system；推断不出时沿用旧记录的来源，没有旧记录则为 channel（`"[session-manager] wake starting actor with inferred origin"`（`createSessionManager`））。前缀到来源的映射在一个没有真名的函数里，代码已读到但缺可检查的引用，这一映射属未证实推测。

actor 启动时调用 `ensureSessionDescriptorAndStateFiles (OR)`，它只在 `meta.md` 与 `state.json` 不存在时创建它们，已存在的文件不改写（confirmed，证据见证据表）。所以 `meta.md` 里的类别只在第一次创建时写入一次：由 actor 启动创建时，类别由 actor 的来源推出，来源为 job 或 system 时取来源，否则 `meta:` 前缀取 meta，其余为 channel；由 job 创建先写入时，类别为 job；显示名取自此前唤醒事件携带的显示名（`channel.ingress` 发出的唤醒带有这个字段），没有时为空。之后的 actor 启动不会更新它，显示名只能经 `session.set_alias` RPC 由 `updateSessionDisplayName (ole)` 修改。会话类别因此有两个来源：前缀分类，以及 `meta.md` 里第一次写入的类别。

Map 里还可能有两种不运行 drain 的占位记录（confirmed）。渠道附着到一个还没有 actor 的会话键时，`attachChannel` 创建一条 `actorRunId` 为 0、状态为 idle 的记录，只用来保存附着集合；job 池已满时启动 job 会话，也会先放一条占位记录并把会话键排进 job 池的队列（8.3）。`getActorView` 不返回占位记录；`listActors` 只在会话键排在某个池的队列里时才列出占位记录（`K.actorRunId <= 0 && !F(K.sessionKey)`（`createSessionManager`））。

daemon 启动时哪些会话被重新唤醒、依据是什么，见 5.5。

### 8.2 进程写锁与按键异步互斥

duoduo 用三种作用范围不同的锁：进程写锁跨进程、跨重启，保证一个数据目录只有一个 daemon 写入；drain 租约文件按会话，保证同一会话同一时刻只有一个 drain 处理邮箱；进程内的异步互斥按会话键，保证同一会话的状态文件改动串行执行（confirmed）。另有一个按会话键的归档标记，在归档期间阻止写入 inbox 与会话状态文件、阻止唤醒。

进程写锁是 `run/locks/daemon-writer.json`（`resolveRuntimeWriterLockPath (d6)`），内容为 `runtime_dir`、`pid`、`boot_id`、`started_at`、`last_heartbeat_at`（confirmed）。`acquireRuntimeWriterLock (p6)` 先写一个临时文件，再用硬链接把它链到锁文件路径，链接成功即取得锁；锁文件已存在时读出内容，判断为过期或读不出时覆盖，否则取锁失败。

过期由 `isRuntimeWriterLockStale (Vut)` 判断，满足任一条件即过期（confirmed）：心跳时间无法解析或距今超过 TTL（默认 120 秒）；记录里有 `boot_id` 且与本机当前值不同，即机器重启过；记录的 pid 已不存在（向该 pid 发送信号 0 探测）。`boot_id` 由 `computeHostBootId (But)` 计算：主机名加上 Linux 的 `/proc/sys/kernel/random/boot_id`，或 macOS 的 `sysctl kern.boottime`，两者都读不到时用开机时间折算的分钟数，结果在进程内缓存。

daemon 的入口函数在启动早期、初始化运行时目录之前取锁，取不到就以 `Runtime lock already held by pid=`（`main`）开头的错误退出（confirmed）。之后 daemon 每隔 `ALADUO_RUNTIME_LOCK_HEARTBEAT_MS`（默认 30 秒，最小 1 秒）刷新一次心跳，只在锁文件里的 pid 是自己时才写入（`C0e("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3)`（`createDaemon`））。

drain 租约文件是 `run/locks/<会话键的 sha256>.json`，由 `drainSessionMailbox (KSe)` 在每次执行开始时取得、结束时删除（confirmed）。取不到时 drain 直接返回，结果里 `lockAcquired` 为假；执行期间每隔 `ALADUO_SESSION_HEARTBEAT_MS`（默认 30 秒）刷新心跳。在同一个 daemon 内，一个会话键只有一个 actor、一个 drain 循环，正常运行时租约总能取到；它具体防范哪种并发，代码里没有说明，属未证实推测。

异步互斥是 `runWithSessionMutex (Vi)`：模块级的 Map 以会话键为键、以该键最后一个排队任务的 Promise 为值，新任务先把自己设为队尾，等前一个任务结束再执行，结束后如果自己仍是队尾就删除这个键（confirmed）。它只在一个进程内有效，不涉及文件。代码中共有 10 处调用，覆盖四类写入：inbox 追加；`meta.md` 与 `state.json` 的全部写入函数（创建、改显示名、修补、改写、清除字段）；投递游标；两个归档函数，以及 daemon 刷新会话索引（逐处列表见证据表）。

邮箱目录的操作不在互斥范围内：合并 inbox、重写 `mailbox.md` 和标记完成都不调用它（confirmed，依据是上述 10 处之外没有互斥调用）。7.4 的插话回调在 drain 进行中也会合并 inbox、标记完成，它与正在运行的 drain 之间只靠 `inflightEventIds` 避免重复认领事件，没有互斥（confirmed）。

这种交错在静态阅读中能看到一个具体后果。插话回调把正在运行的 drain 已经取走的事件当作已处理，随插话一起标记完成；窗口里只有这类事件时立即标记（`cr.length > 0 && await Ao(t, P, cr)`（`createSessionManager`））。drain 成功时这没有影响，因为 drain 结束时也会标记它们；drain 以 7.7 表第四行的错误结束时，这些事件的邮箱项已经删除，锚点以外的事件不会再送给引擎；已经注入这个 turn 的插话消息同样已标记完成，也不会重送（未证实推测：依据静态阅读，没有实测）。两路文件操作交错时是否还会造成邮箱项的重复，代码里没有说明，同属未证实推测。

归档标记是模块级的一个会话键集合，由加入、清除、查询三个函数维护（confirmed，函数名见证据表）。它的作用范围如下：`assertSessionNotArchiving (zl)` 在标记存在时抛出 `SessionArchivingError`，inbox 追加与 `meta.md`、`state.json` 的写入函数都先做这项断言；会话管理器在归档期间不接受唤醒、出队时跳过这个会话；会话间路由投递以 `session_archiving` 拒绝；job 扫描器跳过到期的 job；8.5 的会话 RPC 返回 `archiving`。邮箱合并与标记完成、出站队列写入、事件日志追加这几个底层写入函数本身不检查这个标记。

归档只在会话没有待处理工作时发生（confirmed）。`archiveSessionAndArtifacts (Ybe)` 在按键互斥内再检查一次 inbox 与邮箱：有待处理项时返回 `pending_work`，读不出时返回 `unreadable`，两种情况都不移动任何文件；检查通过后把会话目录、原始请求快照目录、出站 replay 日志、该会话的出站记录和它绑定的渠道目录（如有）分别移到各自的归档目录。`session.archive` 的处理函数在调用它之前还拒绝有未结束 actor、有排队唤醒、inbox 或邮箱非空的会话，并在整个过程中持有归档标记；结束时清除标记，没有归档成功且会话仍有待处理项时，以 `never` 档位重新唤醒这个会话（未证实推测：代码已读到，但处理函数没有真名，只能引用 `createDaemon (Lyt)` 里对它的调用点）。

### 8.3 两个并发池与生命周期

会话管理器有两个并发池：渠道池默认 10 个位置，job 池默认 6 个；来源为 job 或会话键以 `job:` 开头的会话进 job 池，其余会话进渠道池；池满时唤醒进入该池的队列，有池位释放时从队首取出（confirmed）。两个上限在 `createSessionManager (Agt)` 中定义，`main (Fyt)` 从 `ALADUO_SESSION_MAX_CONCURRENT_CHANNEL`（缺省时读 `ALADUO_SESSION_MAX_CONCURRENT`）与 `ALADUO_SESSION_MAX_CONCURRENT_JOB` 读入实际值，`system.config` 报告同一组值。

每个池对象记录名字、活动数、上限和唤醒队列；选池时，job 会话得到名为 "job" 的池对象，其余会话得到名为 "channel" 的池对象（confirmed，`name: "job"`（`createSessionManager`））。选池依据 `classifySessionPoolKind (vEe)`，它只区分 job 与其他，所以来源为 system 的会话（`meta:`、`cadence:`、`system:`）与渠道会话共用渠道池。

后台分区的会话不经过这两个池，由 `createMetaSession (Wgt)` 直接调用引擎（confirmed）。它读取池的计数两次：一次决定同一次心跳里是否追加运行分区，条件是两个池的活动数之和不超过 1（`r.activeCount() <= 1`（`createMetaSession`），见 11.2）；另一次把总数和两个池各自的活动数写进分区提示词的运行上下文（见 11.3）。

actor 有 active、idle、ended 三个状态，转换如下（confirmed）。唤醒一个没有运行中 actor 的会话时，池有空位就启动 actor 并占用一个池位，池满就把会话键加入该池的队列（`"[session-manager] wake queued"`（`createSessionManager`））。actor 处理完邮箱后，渠道会话转为 idle 并释放池位（8.4），job 与 system 会话直接结束；引擎被拒绝（3.3）、drain 抛出错误（7.7）、idle 超时且没有渠道附着、会话管理器停止，也都使 actor 结束。结束时依次拆除常驻连接、关闭引擎 adapter、归还池位；job 会话还要交给 job 的收尾函数结算（10.3），然后状态置为 ended，做 8.5 的收尾检查，最后触发一次出队。

池位释放后，出队函数从该池队首取出第一个不在归档中的会话键（confirmed）。如果这个会话有一个 idle、未占池位、drain 循环仍在的 actor，就直接唤醒它，不新建（`"[session-manager] resuming idle actor from dequeue"`（`createSessionManager`））；如果此时池又满了，就把会话键放回队首；否则启动 actor，job 会话带上原来的 job id，其他会话按前缀推断来源（8.1）。job 会话另由 `spawnJobSession` 启动：会话正在归档或已有未结束的 actor 时不重复启动，job 池满时排队并放一条占位记录，否则启动 actor 并向事件日志追加一条 `job.spawn` 事件（第 10 节）。

会话管理器停止时，先把所有 actor 标为 ended、中止它们的常驻连接和 abort 控制器、关闭 adapter，再等待仍在运行的 drain 循环，最多等 30 秒，超时则记录被放弃的会话后继续；随后清空 Map、两个池和队列（confirmed）。所有 actor 都在同一个 daemon 进程里：未处理的 Promise 拒绝只记日志，进程继续运行；未捕获的异常被视为状态可能已损坏，进程以退出码 1 退出（confirmed，`"[pid0] uncaught exception (likely corrupted state, exiting for clean restart)"`（`main`））。

### 8.4 空闲回收

渠道会话处理完邮箱后进入 idle：先释放池位，再在"被唤醒"与"超时"之间等待；超时后，没有渠道附着的 actor 结束，有渠道附着的 actor 留在内存里，但拆除常驻连接、关闭引擎子进程，下一条消息到达时再重新建立（confirmed）。

转入 idle 前，drain 循环两次检查 `pendingWake`，有新的唤醒就立即再处理一次邮箱，不进入 idle（confirmed）。进入 idle 后，actor 归还池位并触发一次出队，然后在 `waitForWakeOrIdleTimeout (hJ)` 上等待：这个函数把一个 resolver 放进 actor 的 `wakeResolver` 字段，同时启动一个定时器，两者先到者决定结果，并清理另一方。唤醒函数发现 actor 有 `wakeResolver` 时只调用它，不做别的，所以 `wakeResolver` 是等待（idle 等待与 7.1 的忙检查等待）与唤醒之间唯一的通知途径。超时时长默认 3600000 毫秒即 1 小时，`main` 从 `ALADUO_SESSION_IDLE_MS` 读入（`idleTimeoutMs: i = 36e5`（`createSessionManager`））。被唤醒的 actor 需要重新占用池位：池满时把会话键放回队首并继续等待，否则占位后回到 drain 循环。

超时后的处理取决于有没有渠道附着（confirmed）。附着来自渠道适配器对会话输出的订阅（第 9 节与 6.3），会话管理器用 `attachedChannels` 集合记录。有附着时，actor 用 `teardownStreamingSession (Zf)` 拆除 Claude 的常驻连接，用 `shutdownActorRuntimeAdapter (LA)` 关闭 Codex、Grok 或 pi 的 adapter，然后继续等待；下一次被唤醒时，drain 循环按需重新构造 adapter，常驻连接也在第一次调用时重新创建（7.4）。没有附着时，actor 离开等待，按 8.3 的顺序结束；之后再被唤醒会启动一个新的 actor 记录。上游 CHANGELOG 对这项回收给出的理由是：长期保持连接的渠道会让它接触过的每个会话都一直保留引擎子进程，而这时模型端的 prompt cache 早已过期，回收的代价只是长时间沉默后第一次回复稍慢。

空闲会话还有一个独立的机制：空闲压缩（confirmed）。`createIdleCompactSweeper (Xbe)` 定期扫描会话索引里的渠道会话，每次扫描触发的次数有上限；一个会话同时满足以下条件才会被压缩：

1. 会话键按前缀分类为 channel；会话管理器内存里有它的 actor 记录（占位记录不算，daemon 重启后还没有启动过 actor 的会话也不在此列）；常驻连接上没有已被接纳、正在执行的 turn。
2. 从未压缩过，或者上次压缩之后有过新事件（`last_compact_at` 早于 `last_event_at`）。
3. 会话不在归档中，会话的有效配置里引擎不是 Codex。
4. 有效配置设置了 `auto_compact_idle_minutes` 与 `auto_compact_min_context_tokens`（默认都不设置，即不启用）；闲置时长达到前者，闲置时长从最后一个事件与 actor 最后一次活动中较晚的一个算起；上下文用量达到后者。
5. 后者高于会话索引记录的上次压缩后的上下文用量下限（`compact_measured_floor`）；阈值不高于这个下限时，压缩后仍会超过阈值，扫描器跳过这个会话并记一条日志（`"[idle-compact] fuse: threshold ≤ measured floor, skipping"`（`createIdleCompactSweeper`））。

满足条件时，扫描器先在 `state.json` 写入 `last_compact_at`，再提交一条来源名为 `idle-compact` 的 `/compact` 命令，并以 `never` 档位唤醒会话（confirmed）。它不释放池位，也不回收进程；`/compact` 在各引擎上的处理见 3.6。

### 8.5 前缀隔离与收尾再校验

这里有两项检查：对外的会话 RPC 按目标会话键的前缀拒绝越界操作；actor 结束时把 inbox 与 drain 开始时的快照比较，发现期间新到的消息就重新唤醒，避免这些消息无人处理（confirmed）。

会话 RPC 的前缀检查如下表（confirmed）。通知与定时唤醒只接受渠道会话和 job 会话，判定函数 `resolveIsolatedPlaneKind (O0e)` 对这两类返回 null，对其余类别返回类别名；模型、推理力度与压缩只接受渠道会话，并拒绝正在归档的会话。

| RPC 方法 | 处理函数 | 接受的类别 | 拒绝原因 |
|---|---|---|---|
| `session.notify` | `deliverExternalSessionNotify (A0e)` | channel、job | `forbidden_kind` |
| `session.wake`（创建定时唤醒记录，见 4.4） | `scheduleSessionWakeRecord (Syt)` | channel、job | `forbidden_kind` |
| `session.model` | `readOrSetSessionModel (xyt)` | channel | `forbidden_kind`；归档中为 `archiving` |
| `session.effort` | `readOrSetSessionEffort (Eyt)` | channel | 同上 |
| `session.compact` | `enqueueSessionCompactCommand (Ryt)` | channel | 同上 |

同一套类别也决定哪些会话出现在用户可见的会话列表里：`isUserVisibleSessionKey (DV)` 只放行 channel 与 job，会话索引列出用户可见会话时用它筛选（confirmed）。这些检查只看前缀字符串，因此修改一个会话键的前缀就等于修改它能被哪些 RPC 操作。Notify 按会话有无读者拒投的第二条规则见 4.3。

收尾再校验处理的是 actor 结束前后到达的消息（confirmed）。drain 循环开始时，actor 记下 inbox 里待处理文件名的快照；读取失败时快照为空，之后到达的所有文件都算新到。actor 结束时，如果会话管理器仍在运行、会话目录仍在、会话不在归档中，`createJobSessionFinalizer (SEe)` 提供的比较函数把当前 inbox 与快照比较，返回三种结果之一：有快照里没有的文件名为 `fresh`，读取失败为 `conservative`，否则为 `none`。它只比较 inbox，不看邮箱。`fresh` 时以 `never` 档位重新唤醒会话（`"[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path"`（`createSessionManager`））。

`conservative`，以及最后一次 drain 合并 inbox 时遇到暂时性读取失败的情况，最多只重新唤醒一次（confirmed）。布尔字段 `consecutiveConservativeRedrive` 记录这次机会是否已经用掉，它随 actor 记录继承；已用掉时只记日志，等外部唤醒（`"[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake"`（`createSessionManager`））；结果为 `fresh` 或 `none` 时这个字段清零。这样一次读取失败最多引起一次重试，不会让会话反复自我唤醒。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 会话键的生成方：daemon 为后台分区使用固定的 meta 键 | `"meta:subconscious"`（`createMetaSession`）；`let f = "meta:subconscious"`（`appendBeforeExecuteGateway`） | confirmed（daemon 与 cli bundle 中没有生成 `cadence:`、`system:` 会话键的字面量） |
| 会话目录与归档目录按会话键的 sha256 命名，归档判定看两个目录是否存在 | `Hr.join(e.sessionsDir, Oo(t))`（`resolveSessionDir`）；`createHash("sha256")`（`hashSessionKey`）；`"sessions-archive"`（`resolveSessionsArchiveRoot`）；`resolveArchivedSessionDir (km)`；`isSessionArchived (Ks)` | confirmed |
| 会话目录内的文件布局 | `.item.json`（`mergeInboxIntoMailbox`）；`"quarantine"`（`mergeInboxIntoMailbox`）；`"# Session Mailbox"`（`renderSessionMailboxFile`）；`"## Notes"`（`renderSessionMailboxFile`）；`"# Session Descriptor"`（`ensureSessionDescriptorAndStateFiles`）；`Hr.join(i, "state.json")`（`rehydrateSessionState`） | confirmed（`inbox`、`mailbox/pending`、`notes.jsonl` 等路径由没有真名的路径函数拼出，这里引用的是使用它们的已命名函数） |
| 标记完成即删除对应的 `.item.json` 文件 | `"[runner] eager markDone failed (will retry at drain end)"`（`drainSessionMailbox`） | 未证实推测（删除文件的函数没有真名，引用的只是调用方） |
| state.json 的字段 | `last_event_id: me.event.id`（`drainSessionMailbox`）；`mt.last_served_model = Xe`（`drainSessionMailbox`）；`transcript_path: fe`（`createClaudeStreamingSessionFactory`）；`last_seen_board_hash: Je.writeLastSeenAtEntry`（`drainSessionMailbox`）；`instructions_nonboard_fingerprint: Bn?.instructions_nonboard_fingerprint`（`createSessionManager`） | confirmed |
| 会话索引从 compact_stats 派生压缩下限 | `compact_measured_floor: t.compact_stats?.post_total`（`buildSessionIndexEntry`） | confirmed |
| 三个有真名的前缀分类函数的规则 | `e.startsWith("subconscious:") ? "subconscious"`（`classifySessionKeyKind`）；`e.includes(":") ? "channel" : "unknown"`（`classifySessionKeyOrUnknown`）；`e.startsWith("cadence:") ? "system" : "work"`（`classifySessionPlane`） | confirmed（bundle 里另有多个没有真名的同类函数） |
| 平面在 state.json 缺失时由前缀给出默认值；网关侧有同规则的函数 | `let r = n?.plane ?? Oft(t)`（`buildSessionInfoFromState`）；`classifySessionPlaneByKey (hyt)` | confirmed |
| 每次启动 actor 生成新记录，actorRunId 递增 | `actorRunId: L`（`createSessionManager`）；`"[session-manager] actor start"`（`createSessionManager`） | confirmed |
| 缺少来源时按前缀推断 | `"[session-manager] wake starting actor with inferred origin"`（`createSessionManager`） | confirmed（按推断出的来源启动 actor）；前缀到来源的映射为未证实推测（映射函数没有真名） |
| meta.md 与 state.json 只在不存在时创建，已存在不改写 | `await ja.access(s)`（`ensureSessionDescriptorAndStateFiles`）；`kind: t.kind ?? "custom"`（`ensureSessionDescriptorAndStateFiles`） | confirmed |
| meta.md 的类别：actor 启动时由来源推出，job 创建时为 job；显示名取自唤醒 | `kind: G.origin === "job" ? "job" : G.origin === "system" ? "system" : w.startsWith("meta:") ? "meta" : "channel"`（`createSessionManager`）；`kind: "job"`（`initJobManagerModule`）；`displayName: k.display_name`（`createDaemon`）；`S.method === "session.set_alias"`（`createDaemon`） | confirmed |
| 占位记录不出现在 getActorView 中；listActors 只列出排队中的占位记录 | `P.actorRunId <= 0 ? null`（`createSessionManager`）；`K.actorRunId <= 0 && !F(K.sessionKey)`（`createSessionManager`）；`"[session-manager] channel attached"`（`createSessionManager`） | confirmed |
| 进程写锁的路径与硬链接取锁 | `Uut.join(e.runLocksDir, "daemon-writer.json")`（`resolveRuntimeWriterLockPath`）；`await Uw.link(a, n), u = !0`（`acquireRuntimeWriterLock`）；`i = t.ttlMs ?? 12e4`（`acquireRuntimeWriterLock`） | confirmed |
| 锁过期的三个条件 | `t.getTime() - r > n`（`isRuntimeWriterLockStale`）；`e.boot_id && e.boot_id !== eve()`（`isRuntimeWriterLockStale`）；`process.kill(e, 0)`（`isProcessAliveByPid`）；`isProcessAliveByPid (qut)` | confirmed |
| boot_id 的计算来源与缓存 | `"/proc/sys/kernel/random/boot_id"`（`computeHostBootId`）；`"kern.boottime"`（`computeHostBootId`）；`getCachedHostBootId (eve)` | confirmed |
| main 先取锁，daemon 定期刷新心跳 | `Runtime lock already held by pid=`（`main`）；`runtimeLockAlreadyHeld: !0`（`main`）；`C0e("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3)`（`createDaemon`）；`readEnvIntegerOrFallback (C0e)`；`tve(u).catch(() => {})`（`createDaemon`） | confirmed |
| drain 租约文件的获取、心跳与释放 | `if (!(await gSe(e, r)).acquired) return {`（`drainSessionMailbox`）；`let o = n.lockHeartbeatIntervalMs ?? 3e4`（`drainSessionMailbox`）；`clearInterval(s), await _Se(e, r)`（`drainSessionMailbox`）；`lockHeartbeatIntervalMs: o`（`createSessionManager`）；`heartbeatIntervalMs: Number(process.env.ALADUO_SESSION_HEARTBEAT_MS ?? 3e4)`（`main`） | confirmed |
| drain 租约防范的并发场景 | `lockAcquired: !1`（`drainSessionMailbox`） | 未证实推测（代码没有说明单 daemon 内何时会取不到租约） |
| 按会话键的异步互斥；队尾 Map 与归档标记集合是同一个模块初始化器里的模块级变量 | `ub = new Set, uR = new Map`（`initSessionLockAndArchivingModule`）；`i = uR.get(e) ?? Promise.resolve()`（`runWithSessionMutex`）；`uR.get(e) === r && uR.delete(e)`（`runWithSessionMutex`） | confirmed |
| 互斥的 10 处调用 | `enqueueSessionInboxLine (Xs)`；`ensureSessionDescriptorAndStateFiles (OR)`；`updateSessionDisplayName (ole)`；`patchSessionRuntimeState (et)`；`mutateSessionRuntimeState (Kd)`；`clearSessionRuntimeStateField (ea)`；`updateDeliveryCursorFile (v_e)`；`archiveSessionDirUnlessAlreadyArchiving (Kbe)`；`archiveSessionAndArtifacts (Ybe)`；`createDaemon (Lyt)` | confirmed |
| 插话回调在 drain 进行中合并 inbox、标记完成，不经过互斥 | `"[session-manager] admission callback error"`（`createSessionManager`）；`mergeInboxIntoMailbox (fR)`；`renderSessionMailboxFile (pR)` | confirmed |
| 插话回调把在途事件当作已处理并标记完成 | `if (w.inflightEventIds.has(yt.eventId)) {`（`createSessionManager`）；`cr.length > 0 && await Ao(t, P, cr)`（`createSessionManager`）；`processedEventIds: [...cr]`（`createSessionManager`） | confirmed |
| 这种交错使出错的 drain 窗口里锚点以外的事件不再重送；是否还有其他重复或丢失 | `w.admissionCallback = async () => {`（`createSessionManager`） | 未证实推测（静态阅读的推论，没有实测，也没有代码说明为何安全） |
| 归档标记与归档错误 | `return ub.has(e) ? !1 : (ub.add(e), !0)`（`tryMarkSessionArchiving`）；`this.name = "SessionArchivingError"`（`initSessionLockAndArchivingModule`）；`assertSessionNotArchiving (zl)`；`clearSessionArchiving (cR)`；`isSessionArchiving (or)` | confirmed |
| 归档标记的作用范围：inbox 与状态文件写入、唤醒与出队、路由投递、job 扫描 | `enqueueSessionInboxLine (Xs)`；`zl(t.session_key)`（`ensureSessionDescriptorAndStateFiles`）；`"[session-manager] wake suppressed, session is being archived"`（`createSessionManager`）；`"[session-manager] dequeue skipped archiving sessions"`（`createSessionManager`）；`"[route] delivery refused: session is being archived"`（`deliverRouteEventToSession`）；`"[cadence] skip due job: session is being archived"`（`scanAndSpawnDueJobs`） | confirmed（`assertSessionNotArchiving` 只在 inbox 追加与 `meta.md`、`state.json` 的写入函数里调用） |
| 归档前在互斥内复查待处理工作，通过后移动各类目录 | `reason: a.state === "unreadable" ? "unreadable" : "pending_work"`（`archiveSessionAndArtifacts`）；`"ingress-archive"`（`archiveSessionAndArtifacts`）；`"outbox-archive"`（`archiveSessionAndArtifacts`）；`"channels-archive"`（`archiveSessionAndArtifacts`） | confirmed |
| session.archive 的前置拒绝与拒绝后的重新唤醒 | `C.result = await byt(u, e.sessionManager, d, k)`（`createDaemon`） | 未证实推测（处理函数没有真名，引用的只是调用点） |
| 两个池的默认上限与环境变量 | `let S = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10`（`createSessionManager`）；`D = e.maxConcurrentJob ?? 6`（`createSessionManager`）；`maxConcurrentJob: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_JOB ?? 6)`（`main`）；`max_concurrent_channel: qn("ALADUO_SESSION_MAX_CONCURRENT_CHANNEL"`（`buildSystemConfigReport`）；`buildSystemConfigReport (lyt)` | confirmed |
| 两个池对象分别名为 channel 与 job；只有 job 来源或 job 前缀进 job 池 | `name: "channel"`（`createSessionManager`）；`name: "job"`（`createSessionManager`）；`return vEe(w, P) === "job" ? C : $`（`createSessionManager`）；`e.startsWith("job:") ? "job" : "channel"`（`classifySessionPoolKind`） | confirmed |
| 后台分区会话不占池位；元会话读两次池计数：追加分区的条件与提示词运行上下文 | `return $.activeCount + C.activeCount`（`createSessionManager`）；`r.activeCount() <= 1`（`createMetaSession`）；`N = await Vgt(t, r)`（`createMetaSession`）；`t.activeJobCount()`（`renderPartitionRuntimeContext`） | confirmed |
| 启动 actor 占池位，池满排队 | `ee.activeCount++, G.holdsPoolSlot = !0`（`createSessionManager`）；`"[session-manager] wake queued"`（`createSessionManager`） | confirmed |
| 出队跳过归档会话、原地唤醒 idle actor、池满放回队首 | `"[session-manager] dequeue skipped archiving sessions"`（`createSessionManager`）；`"[session-manager] resuming idle actor from dequeue"`（`createSessionManager`）；`"[session-manager] dequeue deferred: pool re-filled"`（`createSessionManager`） | confirmed |
| job/system 会话无事可做即结束；job 不重复启动 | `"[session-manager] job/system session drain complete, exiting"`（`createSessionManager`）；`"[session-manager] skip duplicate job spawn"`（`createSessionManager`） | confirmed |
| 停止时最多等待运行中的 drain 30 秒 | `"[session-manager] shutdown abandoned running drains after the fallback"`（`createSessionManager`） | confirmed |
| 进程级异常策略 | `"[pid0] unhandled promise rejection (contained, daemon survives)"`（`main`）；`"[pid0] uncaught exception (likely corrupted state, exiting for clean restart)"`（`main`）；`process.exit(1)`（`main`） | confirmed |
| idle 时释放池位，等待唤醒或超时 | `"[session-manager] released pool slot (idle)"`（`createSessionManager`）；`e.wakeResolver = () => {`（`waitForWakeOrIdleTimeout`）；`"[session-manager] wake delivered to idle actor"`（`createSessionManager`） | confirmed |
| idle 超时默认 1 小时 | `idleTimeoutMs: i = 36e5`（`createSessionManager`）；`idleTimeoutMs: Number(process.env.ALADUO_SESSION_IDLE_MS ?? 36e5)`（`main`） | confirmed |
| 被唤醒的 idle actor 重新占池位，池满回到队首 | `"[session-manager] woken idle actor re-queued (pool full)"`（`createSessionManager`）；`"[session-manager] re-acquired pool slot (woken)"`（`createSessionManager`） | confirmed |
| 超时且有附着：拆除常驻连接、关闭 adapter，继续等待 | `"[session-manager] idle timeout with attachments, reclaiming runtime processes"`（`createSessionManager`）；`r.abortController.abort(n)`（`teardownStreamingSession`）；`e.adapter = null, e.adapterFacts = void 0`（`shutdownActorRuntimeAdapter`） | confirmed |
| 超时且无附着：actor 结束 | `"[session-manager] idle timeout, no attachments, exiting"`（`createSessionManager`） | confirmed |
| 空闲压缩的前提：渠道会话、内存中有 actor 记录且不在 turn 中、上次压缩后有新事件 | `b.midTurn`（`createIdleCompactSweeper`）；`m(y.last_compact_at, y.last_event_at)`（`createIdleCompactSweeper`）；`midTurn: P.streamingState?.currentTurn?.accepted === !0`（`createSessionManager`）；`for (let I of r.listByKind("channel"))`（`createIdleCompactSweeper`） | confirmed |
| 空闲压缩的前提：不在归档、非 Codex、两项阈值、压缩下限；每次扫描有触发上限 | `"[idle-compact] skip: archiving"`（`createIdleCompactSweeper`）；`I.runtime === "codex"`（`createIdleCompactSweeper`）；`let E = I.auto_compact_idle_minutes`（`createIdleCompactSweeper`）；`"[idle-compact] fuse: threshold ≤ measured floor, skipping"`（`createIdleCompactSweeper`）；`"[idle-compact] per-sweep fire cap reached"`（`createIdleCompactSweeper`） | confirmed |
| 空闲压缩先写 last_compact_at，再提交 /compact 并以 never 唤醒 | `last_compact_at: new Date().toISOString()`（`createIdleCompactSweeper`）；`sourceName: "idle-compact"`（`createIdleCompactSweeper`） | confirmed |
| 通知与定时唤醒只接受 channel 与 job | `t === "job" ? null : t`（`resolveIsolatedPlaneKind`）；`let s = O0e(o.session_key)`（`deliverExternalSessionNotify`）；`let o = O0e(i.session_key)`（`scheduleSessionWakeRecord`）；`Only channel and job sessions can be woken`（`scheduleSessionWakeRecord`） | confirmed |
| 模型、力度与压缩 RPC 只接受渠道会话，归档中返回 archiving | `return o !== "channel" ? {`（`readOrSetSessionModel`）；`return o !== "channel" ? {`（`readOrSetSessionEffort`）；`if (a !== "channel") return {`（`enqueueSessionCompactCommand`）；`reason: "archiving"`（`readOrSetSessionModel`） | confirmed |
| 用户可见列表只含 channel 与 job | `lr(e) === "job"`（`isUserVisibleSessionKey`）；`for (let n of e.values()) DV(n.session_key) && t.push(n);`（`createMapBackedSessionIndex`） | confirmed |
| 收尾时比较 inbox 快照，新到消息触发重新唤醒 | `"[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)"`（`createSessionManager`）；`if (!p.has(h)) return "fresh";`（`createJobSessionFinalizer`）；`"[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path"`（`createSessionManager`） | confirmed |
| 读取失败最多重新唤醒一次 | `"[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)"`（`createJobSessionFinalizer`）；`consecutiveConservativeRedrive: K?.consecutiveConservativeRedrive ?? !1`（`createSessionManager`）；`ve = de.mergeTransientFailure === !0`（`createSessionManager`）；`"[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake"`（`createSessionManager`） | confirmed |

## 9 渠道适配器

渠道适配器是一个与 daemon 分开运行的进程，只负责在某个聊天平台和 daemon 之间转换格式：它经 JSON-RPC 方法 `channel.ingress` 把平台消息送入 daemon，经 WebSocket 上的 `channel.pull` 订阅取回输出并逐条 `channel.ack`。飞书适配器的会话键派生、准入策略、@ 过滤、进度卡、表情回应与语音发送都在适配器包内实现；daemon 只读取并原样转交其中两个开关：实例描述符里的 `require_mention`（经 `channel.describe`），以及种类或实例配置 `feishu:` 块里的 `process_card`（随 `channel.ingress` 的返回值 kind_config）。渠道行为配置来自三个 Markdown 文件，按全局、种类、实例的顺序合并，其中全局层只承载模型选择类的键；凭据与准入策略不在这三层里，而是适配器进程的环境变量，其中有五个变量不在已发布插件包的环境变量白名单里，经 CLI 启动时不生效（9.3）。适配器进程由 CLI 启动，崩溃后没有任何代码会重启它。

### 9.1 进程模型与协议

适配器进程的生命周期完全由 CLI 管理，daemon 不参与：CLI 以脱离终端的方式派生它并只记录 pid，进程退出后没有自动重启。飞书适配器实际调用的 daemon 方法是启动握手与 doctor 自检用的 `system.runtime.info`，以及 describe、spawn、ingress、file.upload、file.download、pull、ack 七个 `channel.*` 方法；它的客户端还实现了 `channel.command`，但没有调用点，以 "/" 开头的命令也经 `channel.ingress` 送入。daemon 推给它的是 `session.output`、`session.stream`、`session.execution`、`session.stream_end` 四种通知。`@openduo/protocol` 源码 `channel.ts` 的 `ChannelRpcMethods` 类型另外还列出五个 `session.*` 与三个 `job.*` 方法，飞书适配器没有使用（confirmed）。

安装与启动都在 CLI 里完成。`duoduo channel install <包名>` 从 npm 取包；参数以 "."、"/"、"~" 开头或以 ".tgz" 结尾时被视为本地路径（`cli:isInstallTargetFilePath (hXe)`），本地路径必须写成 `--from-path <tgz>`，否则拒绝安装。包被解压到插件根目录（默认 `<runtimeDir>/plugins/channels`）下的 `<type>/package.installing`，确认清单声明的入口脚本存在后，旧的 `package` 目录暂时改名为 `package.retired`，新目录改名为 `package`，再删掉旧目录；随后写出 `manifest.json`，并把包内 `config/` 目录下的文件复制到内核配置目录 `<kernel>/config/`，已存在的文件不覆盖。包必须在 `package.json` 的 `aladuo.channel` 字段里声明 type 与 bin，可选声明 envAllowlist、args 与 healthCheck。`duoduo channel <type> start` 先把 `~/.config/duoduo/.env` 读进 CLI 自身的环境（只补未设置或为空的键），再用 `process.execPath` 以 detached 方式派生入口脚本并调用 unref，stdout 与 stderr 追加到 `<type>/run/plugin.log`，pid 写进 `<type>/run/pid.json`。子进程只继承少量基础变量（PATH、HOME、LANG 等）、CLI 设置的 daemon 连接变量（默认是指向 unix socket 的 `ALADUO_DAEMON_SOCKET`，外加 `ALADUO_CHANNEL_LAUNCHER=duoduo-cli`）和清单 envAllowlist 列出的键；`status` 只检查 `pid.json` 里的进程是否存活，`stop` 先发 SIGTERM，1.5 秒后仍存活再发 SIGKILL。除本地路径判断外，本段描述的 CLI 行为已逐条在 cli.pretty.js 中读到，但所在函数都没有真名，构建检查无法核对，按证据约定标为未证实推测（见证据表）。

适配器崩溃后不会被重启，这是一条否定性结论（confirmed）：CLI 派生子进程后不挂任何退出监听，daemon bundle 中没有插件目录或 pid 文件的引用，发现与恢复只能靠 `duoduo channel <type> status` 和手动 `start`。唯一会重新启动适配器的代码路径是 `duoduo upgrade`：`cli:runUpgradeChannelPhase (xXe)` 只处理 npm 上有更新版本的适配器，先安装新版本，再停止其中升级前正在运行的那些，daemon 重启之后重新启动它们；升级前没有运行的保持停止，已是最新版本的适配器不被触碰，daemon 重启造成的断线由适配器自己重连。daemon 看不到适配器进程，只看到它建立的连接与订阅；适配器不在线期间，发往该会话的输出留在 outbox 中，等它重新订阅时回放（6.3）。

协议方法按用途分为五组，daemon 侧的处理细节分别由第 5、6 节负责：

| 方法 | 适配器用途 | daemon 侧要点 |
|---|---|---|
| `channel.describe` | 查询一个渠道实例是否已配置 | 返回 configured、session_exists、可用引擎列表（pi 恒在列）、种类默认值；已配置时附描述符摘要（工作目录、引擎、display_name、bound_by、require_mention） |
| `channel.spawn` | `/setup` 绑定时创建或更新实例描述符 | 写 `var/channels/<channel_id>/descriptor.md`；首次调用必须给出 runtime 和绝对路径 cwd_abs，目录不存在时创建 |
| `channel.ingress`、`channel.command` | 送入一条用户消息；`channel.command` 送入一条斜杠命令（飞书适配器不用它） | 守卫与参数规则见下文；写入事件日志后的分流见 6.2，去重见 5.3 |
| `channel.file.upload`、`channel.file.download` | 上传入站附件、取回出站附件 | 文件存取，不经会话邮箱 |
| `channel.pull`、`channel.ack` | 在 WebSocket 上打开输出订阅（HTTP 上则一次性拉取）；提交投递游标 | 见 6.3 |

`channel.ingress` 的参数是 session_key、text、attachments、idempotency_key、cwd_abs、source_kind、channel_id 与 display_name；daemon 侧的检查顺序、错误码与返回值见 6.2。其中两点决定适配器的写法。第一，经 WebSocket 调用时必须带业务渠道名 source_kind（不能是传输名 rpc 或 ws）和 channel_id，否则返回参数错误（未证实推测：校验函数已读到，但没有真名，缺可检查的引用）；经 HTTP 调用而省略 source_kind 时，daemon 把来源记为 rpc（confirmed，`N = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc")`（`createDaemon`））。第二，source_kind 是业务渠道名时，返回值附带该渠道合并后的 `<kind>:` 配置块 kind_config；daemon 不解读这个块，只负责转交，飞书适配器据此决定进度卡模式（9.2）（confirmed）。

输出方向上，一条 WebSocket 连接同时只承载一个会话的订阅：在同一连接上再发一次 `channel.pull`，daemon 先退订旧会话再订阅新会话（6.3）。飞书适配器因此为每个会话键各开一条 WebSocket 连接，连接建立后立即发 `channel.pull`：consumer_id 为 "feishu-gw"，return_mask 取 final、stream、stream_end、tool 四类，声明 accept_mime 为 "*/*"、accept_stream_end_reasons 为 interrupted 与 skipped；每收到一条 session.output，先发 `channel.ack` 再渲染。与会话相关的调用（ingress、文件上传与下载，以及客户端实现的 command）也经这条连接发出，所以 daemon 对它们执行上文的 WebSocket 参数检查。启动握手、`channel.describe` 与 `channel.spawn` 经 HTTP `/rpc` 发出，默认走 unix socket，配置了远程 ALADUO_DAEMON_URL 时走 TCP 并附带 bearer token。握手调用带 source_kind "feishu" 的 `system.runtime.info`，daemon 据此返回飞书种类配置的 new_session_workspace，适配器取它作为默认工作目录，没有时取 daemon 的 work_dir；9.2 第 5 步的自动配置用的就是这个目录（以上均为 feishu-gateway.js 字面量与调用结构，confirmed）。能力声明由 daemon 记入会话状态，它如何影响附件检查与结束原因的改写见 6.3。连接断开后，飞书适配器按 2、5、10、30、60 秒的间隔重连；进程重启后按消息缓存目录里保存的会话列表（"watched-sessions.json"）重新订阅，由 daemon 回放消费游标之后的积压。

### 9.2 飞书适配器

飞书适配器把飞书的事件模型映射到上述协议，所有与平台有关的判断都在适配器进程内完成：一个飞书会话（一个群，或私聊中的一个用户）加一个工作目录对应一个 daemon 会话键；准入策略、@ 过滤和 `/setup` 在消息到达 daemon 之前执行；处理进度以表情回应和可选的进度卡呈现。本节依据 `@openduo/duoduo` 包内的 `dist/release/feishu-gateway.js`，它不在重建流水线覆盖范围内，没有真名，字面量以普通引号给出并注明出处。cli 与 daemon bundle 都不引用这个文件名，实际运行的是 `duoduo channel install` 装入的 `@openduo/channel-feishu` 包；两者是否为同一构建，本文没有核对（未证实推测）。

一条飞书消息进入 daemon 之前依次经过以下步骤（均为 confirmed，证据见本节证据表）：

1. **接收与本地去重。** 适配器用飞书 SDK 的长连接客户端（"WSClient"）接收 "im.message.receive_v1" 事件，连接由本机发起，不需要公网回调地址；同一 message_id 在适配器本地去重后只处理一次。
2. **准入策略。** 私聊按 FEISHU_DM_POLICY 判断：open 全部放行，allowlist 只放行 FEISHU_ALLOW_FROM 中的 open_id，pairing 的处理结果与 open 相同、全部放行，适配器里没有配对流程。群聊按 FEISHU_GROUP_POLICY 判断：open 放行，disabled 全部拒绝，allowlist 要求群在 FEISHU_ALLOW_GROUPS 中或发送者在 FEISHU_ALLOW_FROM 中。两项默认都是 open，写成其他值时回落到默认值。被拒绝时适配器回复"抱歉，您没有权限与此机器人对话。如需访问，请联系管理员。"，消息不进入 daemon。
3. **会话键。** 群聊的会话键是 "lark:<chat_id>:<工作目录哈希>"，私聊是 "lark:<chat_id>:<用户 open_id>:<工作目录哈希>"，哈希取工作目录 realpath 的 SHA-256 前 12 个十六进制字符。渠道实例 id 是 "feishu-<chat_id>"，所以每个群或私聊都是一个独立的渠道实例，有自己的描述符。实例描述符记录的工作目录与适配器缓存的不一致时，适配器按新目录重新派生会话键；因为工作目录参与会话键，同一个群换了工作目录就对应一个新的 daemon 会话。
4. **@ 过滤。** 群聊是否要求 @ 机器人，先取 daemon 实例描述符中的 require_mention（经 `channel.describe` 读取，缓存 60 秒），取不到时用 FEISHU_REQUIRE_MENTION，默认要求。机器人自己的 open_id 先取 FEISHU_BOT_OPEN_ID，没有时经飞书 API 查询；都取不到时，适配器跳过 @ 检查。要求 @ 而消息没有 @ 机器人时，这条消息不进入 daemon；若 FEISHU_GROUP_CONTEXT_REMINDER 开启（默认开启），且消息去掉对机器人的 @ 后不以 "/" 开头，适配器把它记入本地的群上下文：附件当即经 `channel.file.upload` 存进 daemon，本地只记录文本、发送者与 daemon 返回的文件路径。下一条 @ 机器人的消息送入 daemon 时，前面附上一个 "<feishu-channel-additional-context>" 块，列出这期间的背景消息。飞书平台只有在应用申请了"获取群组中所有消息"敏感权限后才推送未 @ 的群消息，这是 `/setup` 卡片上的提示原文。
5. **`/setup` 与未配置拦截。** `/setup` 由适配器自己处理：用 `channel.describe` 查询实例状态，发一张选择项目目录、引擎和是否要求 @ 的卡片，确认后调用 `channel.spawn` 写实例描述符；首次绑定时把操作者记为 bound_by，重新绑定保留原记录。群里第一次绑定任何成员都可以执行；绑定之后只有 bound_by 记录的那个人能再执行，描述符里没有 bound_by 字段的群改由 FEISHU_GROUP_CMD_USERS 名单决定，名单为空时拒绝。实例尚未配置时，普通消息被拦下，适配器向这个会话发一张设置卡片，这条消息不进入 daemon；例外是私聊中机器人所有者发来的消息，适配器直接用启动握手得到的默认工作目录（9.1）、require_mention=false 和种类默认引擎（不在可用列表中时取第一个可用引擎）自动完成 `channel.spawn`，然后照常送入。所有者取 FEISHU_BOT_OWNER，缺省取 FEISHU_ALLOW_FROM 的第一项；经 CLI 启动时 FEISHU_BOT_OWNER 传不进适配器（9.3），所以实际上就是 FEISHU_ALLOW_FROM 的第一项。所有者为空时，任何人的私聊都按这条例外处理，自动 spawn 也不写 bound_by。`channel.describe` 调用失败时不拦截。
6. **送入 daemon。** 正文由适配器改写后送入：每个 @（包括对机器人的 @）都替换为 "@<显示名>"；回复消息前加 "[回复: <父消息文本>] "，取不到父消息时加 "[回复消息] "；群聊消息再在最前面加上 "<发送者名>: "。群聊中去掉机器人 @ 后以 "/" 开头的消息例外，只送入去掉 @ 的命令文本，不加任何前缀，由 daemon 的入站分流按命令处理（6.2）。附件（包括被回复消息的附件）先从飞书下载，再经 `channel.file.upload` 存进 daemon；适配器给这条用户消息加上第一阶段的表情回应，然后调用 `channel.ingress`：idempotency_key 取飞书 message_id，source_kind 为 "feishu"，channel_id 为 "feishu-<chat_id>"，并附带 cwd_abs。daemon 对带 cwd_abs 的请求记一条弃用警告，然后以它作为该会话的工作目录（`cwdAbs: k.cwd_abs`（`createDaemon`））。

输出的渲染同样在适配器内完成。session.output 记录按 FEISHU_RENDER_MODE（auto、raw、card，默认 auto）选择纯文本或卡片，auto 时发卡片；记录的 rendering_hints 指定 card 时总是发卡片。流式输出（FEISHU_STREAMING_CARD，默认开启）是不断更新同一张卡片。出站附件经 `channel.file.download` 取回后按类型发送：图片发为图片消息；扩展名为 ogg 或 opus、或 MIME 含 ogg 或 opus 的文件以 opus 类型上传、以飞书原生语音消息（msg_type 为 "audio"）发出；MIME 含 mp4 或 video 的文件发为 media 消息；其余发为文件消息。

进度卡由种类或实例配置里 `feishu:` 块的 `process_card` 控制。适配器从每次 `channel.ingress` 返回的 kind_config 中读取它，取值无法识别时记一条警告并按 off 处理（"unusable feishu.process_card value; the turn runs with the card off"）：

| `feishu.process_card` | 适配器行为 |
|---|---|
| off（默认，含未设置） | 不显示进度卡 |
| replace | 处理中显示一张卡片，列出正在调用的工具；这一轮有工具调用时，答案在同一张卡片上原地替换进度，不发第二条消息 |
| keep | 有工具调用时，进度卡标记为"已完成"后保留，答案另发一条消息 |

表情回应有两个方向。适配器在用户那条消息上加进度表情：送入 daemon 时加"收到"（"Get"）。进度卡关闭时，之后随 daemon 推来的执行事件切换：思考片段或工具结果对应"思考"（"THINKING"），工具调用对应"调用工具"（"OnIt"），流式文本开始对应"开始输出"（"Typing"），距上一次切换不足 300 毫秒的变化被跳过；进度卡开启时，执行事件与流式事件交给进度卡处理，表情只在卡片出现时切到"思考"并保持，进度改由卡片呈现。两种情况下回复结束后表情都被撤掉。反方向上，用户对消息加的表情在 FEISHU_REACTION_NOTIFICATIONS 不为 off 时被转成一条合成文本消息 "[reacted with <emoji> to message <message_id>]"，走同一条入站流程；默认值 own 只转发对机器人自己消息的回应，机器人用于表示进度的四个表情、应用自身和机器人自己加的表情都被忽略。

### 9.3 配置分层

渠道配置分在两处，互不重叠：daemon 读取并合并的三层 Markdown 决定会话如何运行（提示词、引擎、模型、工具），其中 `<kind>:` 块由 daemon 原样转交适配器（例如进度卡开关）；适配器进程读取的环境变量决定它连接哪个 daemon、放行谁、怎样渲染。

| 层 | 文件 | 承载的键 | 合并规则 |
|---|---|---|---|
| 全局 | `<kernel>/config/runtime.md` | 只读取模型选择类键：`claude.model_profiles`、`claude.model_aliases`、`<runtime>.model`、`<runtime>.effort` | 最低层 |
| 种类 | `<kernel>/config/<kind>.md`，如 `feishu.md` | frontmatter 中的行为键（prompt_mode、new_session_workspace、runtime、time_gap_minutes、auto_compact 两项、stream、工具列表等）、模型选择类键与 `<kind>:` 块；正文为种类提示词 | 被实例层逐键覆盖 |
| 实例 | `<runtimeDir>/var/channels/<channel_id>/descriptor.md` | 与种类层相同的键，另有 channel_id、display_name、bound_by、require_mention；正文为实例提示词 | 最高层 |

合并由 `buildEffectiveChannelConfig (cbe)` 完成，三层并不对每个键都生效。行为键只在种类与实例两层之间取值，实例层有则用实例层，否则用种类层，prompt_mode 两层都没有时为 append（`prompt_mode: o?.prompt_mode ?? i?.prompt_mode ?? "append"`（`buildEffectiveChannelConfig`））；claude.tools 取两层的并集；`<kind>:` 块按键合并、实例层优先；种类提示词与实例提示词合并为一段。只有模型选择类键在全局、种类、实例三层逐键合并，越靠后的层优先（它们与会话级 `/model`、`/effort` 的优先级见 3.4）。require_mention 只从实例描述符读取，不进入有效配置，daemon 不据它做任何判断，只经 `channel.describe` 交给适配器。`runtime` 是保留名，`channel.spawn` 拒绝名为 runtime 的渠道种类，否则它的种类文件就是全局文件。种类文件有两个来源：daemon 初始化时从包内 `bootstrap/config/` 复制出厂文件（覆盖规则见 11.5），以及 `duoduo channel install` 复制插件包自带的 `config/` 文件，后者只补缺失、不覆盖。

适配器进程读取的主要环境变量如下（feishu-gateway.js 字面量，默认值取自适配器的默认配置对象）。最后一列说明经 `duoduo channel feishu start` 启动时变量能否到达适配器，依据是 npm registry 上 `@openduo/channel-feishu` 发布清单的 envAllowlist（`npm view @openduo/channel-feishu aladuo`，核对时 latest 为 0.8.2）：

| 变量 | 取值与默认 | 作用 | 经 CLI 启动时传入 |
|---|---|---|---|
| FEISHU_APP_ID、FEISHU_APP_SECRET | 必填，缺失时进程启动失败 | 飞书应用凭据 | 是 |
| FEISHU_DM_POLICY | open（默认）、allowlist、pairing（行为与 open 相同） | 私聊准入 | 是 |
| FEISHU_GROUP_POLICY | open（默认）、allowlist、disabled | 群聊准入 | 是 |
| FEISHU_ALLOW_FROM、FEISHU_ALLOW_GROUPS | 逗号分隔的 open_id、chat_id 列表 | allowlist 策略的名单 | 是 |
| FEISHU_REQUIRE_MENTION | 默认 true | 群聊是否要求 @；实例描述符的 require_mention 优先 | 是 |
| FEISHU_GROUP_CONTEXT_REMINDER | 默认 true | 未 @ 的群消息作为背景附在下一条 @ 消息前 | 是 |
| FEISHU_RENDER_MODE、FEISHU_TEXT_CHUNK_LIMIT | auto（默认）、raw、card；单条文本上限默认 4000 字符 | 回复格式与分段 | 是 |
| FEISHU_BOT_OPEN_ID | 缺省经飞书 API 查询 | 机器人自己的 open_id，用于 @ 检查 | 是 |
| FEISHU_STREAMING_CARD | 默认 true | 流式回复更新同一张卡片 | 否，恒为 true |
| FEISHU_REACTION_NOTIFICATIONS | off、own（默认）、all | 用户表情回应是否转成消息 | 否，恒为 own |
| FEISHU_BOT_OWNER | open_id，缺省取 FEISHU_ALLOW_FROM 第一项 | 私聊中可自动完成配置的所有者 | 否，恒取 FEISHU_ALLOW_FROM 第一项 |
| FEISHU_GROUP_CMD_USERS | 逗号分隔的 open_id，默认为空 | 没有 bound_by 的群能否重新执行 `/setup` | 否，恒为空 |
| ALADUO_DAEMON_SOCKET、ALADUO_DAEMON_URL、ALADUO_DAEMON_TOKEN | 默认连接 `<home>/.aladuo/run/daemon.sock` | daemon 连接；URL 指向本机只读 TCP 端口时自动改用 unix socket，远程 TCP 附带 bearer token | 不从环境复制，由 CLI 按自己解析出的 daemon 地址设置 |

另有 FEISHU_DOMAIN、FEISHU_LOG_LEVEL、FEISHU_MESSAGE_CACHE_DIR（默认 `~/.cache/feishu-channel`）三个运行参数（经 CLI 启动时传入），界面语言 FEISHU_LOCALE（不在清单里，经 CLI 启动时恒为 zh-CN），以及以 FEISHU_CS_ 开头、服务于多实例绑定模式（`/bind` 命令）的一组变量，本文没有分析后者。枚举型变量写成未列出的值时回落到默认值。

这些变量由 CLI 在启动适配器时从 `~/.config/duoduo/.env` 与 CLI 进程环境取得，但只有插件清单 envAllowlist 列出的键会传给子进程（9.1）。已发布的清单不含 FEISHU_BOT_OWNER、FEISHU_GROUP_CMD_USERS、FEISHU_STREAMING_CARD、FEISHU_REACTION_NOTIFICATIONS、FEISHU_LOCALE，所以经 CLI 启动时这五个变量无论写在 `.env` 还是 shell 里都到不了适配器，适配器取默认值：所有者退回 FEISHU_ALLOW_FROM 的第一项（它也为空时任何人的私聊都会触发自动配置），群命令名单为空（没有 bound_by 的群因此永远不能再执行 `/setup`），流式卡片开启，表情转发为 own，语言为 zh-CN。只有不经 CLI、自行提供环境变量启动适配器时它们才生效；这种启动方式下适配器不读 `.env`，只记一条警告（"standalone host launch detected; ~/.config/duoduo/.env is not auto-loaded"，feishu-gateway.js 字面量）。清单内容经 npm registry 核对，适配器读取这五个变量是 feishu-gateway.js 字面量（confirmed）；CLI 只复制清单内键的过滤逻辑在无真名的 CLI 函数里，结论整体按未证实推测标注（见证据表）。凭据不应写进 Markdown：种类文件的 `<kind>:` 块会随每次 ingress 原样返回给适配器，出厂的 `feishu.md` 注释也写明了这一点。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| `duoduo channel install` 把以 "."、"/"、"~" 开头或以 ".tgz" 结尾的参数视为本地路径 | `e.startsWith(".") \|\| e.startsWith("/") \|\| e.startsWith("~") \|\| e.endsWith(".tgz")`（`cli:isInstallTargetFilePath`） | confirmed |
| 本地路径必须带 `--from-path`；安装先解压到 `package.installing`、确认入口存在后换入；清单必须声明 type 与 bin；适配器由 CLI 以 detached 方式派生，pid 写入 `run/pid.json`，输出追加到 `run/plugin.log`；子进程环境只含基础变量、CLI 设置的 daemon 连接变量与清单 envAllowlist；`.env` 只补未设置或为空的键；stop 先 SIGTERM、1.5 秒后 SIGKILL | — | 未证实推测：已在 cli.pretty.js 中读到字面量 "Refusing to install from a local path without --from-path"、"package.installing"、"package.retired"、"Invalid plugin package: aladuo.channel.type/bin is required"、"ALADUO_CHANNEL_LAUNCHER"、"pid.json"、"plugin.log"，但 CLI 的渠道插件管理函数没有真名，构建检查无法核对 |
| 适配器崩溃后没有自动重启；升级先装新版本，只重启升级前在运行的适配器 | `if (a.wasRunning) try {`（`cli:runUpgradeChannelPhase`）；`if (!a.wasRunning) {`（`cli:runUpgradeChannelPhase`） | confirmed（否定性证据：cli bundle 中调用插件 start 的只有 `channel <type> start` 子命令与升级流程的回调，start 派生后调用 unref、不挂退出监听；daemon bundle 中 "pid.json" 与 "plugins" 字面量零命中） |
| 适配器不在线时输出留在 outbox，重新订阅时回放 | `r.getSubscribers(h.session_key).length === 0`（`createOutboxDeliveryManager`）；`"[daemon] replayed outbox backlog"`（`createDaemon`） | confirmed |
| daemon 侧协议方法：describe、spawn、ingress、command、file.upload、file.download、pull、ack；带 source_kind 的握手返回该种类的 new_session_workspace | `S.method === "channel.describe"`（`createDaemon`）；`channel_defaults: V`（`createDaemon`）；`describeChannelInstance (_yt)`；`upsertChannelSpawnDescriptor (Ayt)`；`ingestChannelMessage (Gle)`；`ingestChannelCommand ($b)` | confirmed |
| 飞书适配器调用 `system.runtime.info` 与七个 `channel.*` 方法；`channel.command` 只在客户端里实现、没有调用点；`ChannelRpcMethods` 另列的 session.* 与 job.* 方法它不使用 | "system.runtime.info"、"channel.pull"、"channel.ack"、"channel.command"（feishu-gateway.js 字面量） | confirmed（feishu-gateway.js 中 `.ingress(` 只有一个调用点，没有 `.command(` 调用；session.* 与 job.* 方法名零命中；协议类型见 `@openduo/protocol` 源码 `channel.ts`） |
| 经 WebSocket 的 ingress 与 command 必须带业务 source_kind 与 channel_id；HTTP 上缺省记为 rpc | `k0e("channel.ingress", k, D)`（`createDaemon`）；`k0e("channel.command", k, D)`（`createDaemon`）；`N = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc")`（`createDaemon`） | confirmed（HTTP 上缺省记为 rpc，以及校验函数的调用点）；WebSocket 上的两项要求为未证实推测（校验函数没有真名；按已读到的代码，它只在带 wsSubscriberId 时检查，缺 source_kind 即抛错，所以 ws 分支取不到） |
| ingress 对业务渠道返回合并后的 `<kind>:` 块，daemon 不解读 | `Lw(N) ? V.effectiveConfig?.kind_config : void 0`（`createDaemon`）；`...o?.kind_config`（`buildEffectiveChannelConfig`） | confirmed（`@openduo/protocol` 源码注释写明该块对 daemon 不透明；daemon bundle 中 "process_card" 零命中） |
| 带 cwd_abs 的 ingress 以它为会话工作目录 | `cwdAbs: k.cwd_abs`（`createDaemon`） | confirmed（弃用警告所在的函数没有真名） |
| 一条 WebSocket 连接同时只承载一个会话订阅 | `N && h.unsubscribe(k)`（`createDaemon`）；`"[daemon] ws pull stream opened"`（`createDaemon`） | confirmed |
| WebSocket 上的 pull 记录能力声明 | `if (D?.wsSubscriberId) return await pyt({`（`createDaemon`）；`declared_by: r`（`recordChannelCapabilityDeclaration`） | confirmed |
| describe 返回 require_mention 与可用引擎，pi 恒在列 | `require_mention: m.require_mention`（`describeChannelInstance`）；`l.push("pi")`（`describeChannelInstance`） | confirmed |
| spawn 首次必须给出 runtime 与绝对路径 cwd_abs | `"runtime is required on first-time channel.spawn (no prior descriptor to inherit from)."`（`upsertChannelSpawnDescriptor`）；`"cwd_abs is required on first-time channel.spawn (no prior descriptor to inherit from)."`（`upsertChannelSpawnDescriptor`） | confirmed |
| `runtime` 是保留的种类名 | `r.toLowerCase() === Jr`（`upsertChannelSpawnDescriptor`） | confirmed（出厂 `runtime.md` 正文同样写明） |
| 飞书适配器启动时握手并取得默认工作目录；每会话一条 WebSocket，pull 声明四类 return_mask 与能力，先 ack 再渲染，会话调用走这条连接；握手、describe 与 spawn 走 HTTP `/rpc`，默认 unix socket、远程 URL 时 TCP 加 bearer token；按 2/5/10/30/60 秒重连 | "daemon handshake: resolved workspace"、"feishu-gw"、"accept_stream_end_reasons"、"ws://localhost/ws"、"WebSocket is not open for session"、"ws disconnected; scheduling reconnect"、"watched-sessions.json"、"daemon rpc response aborted"、"Bearer "（feishu-gateway.js 字面量） | confirmed |
| 飞书会话键与渠道实例 id 的派生 | "lark:"、"feishu-"、"sha256"（feishu-gateway.js 字面量） | confirmed |
| 私聊与群聊准入策略；pairing 与 open 结果相同 | "User not in DM allowlist"、"Group messaging disabled"、"Neither group nor user in allowlist"（feishu-gateway.js 字面量） | confirmed |
| require_mention 优先取描述符（缓存 60 秒），否则取环境变量；取不到机器人 open_id 时不做 @ 检查；未 @ 的非命令消息记为群上下文，附件当即上传到 daemon | "channel.describe failed; falling back to env requireMention"、"failed to resolve bot open_id; mention enforcement disabled"、"bot open_id unavailable; skipping mention enforcement"、"group message without bot mention, skipping"、"<feishu-channel-additional-context"、"download+upload failed"（feishu-gateway.js 字面量） | confirmed |
| 送入 daemon 的正文：@ 替换为显示名，回复消息加父消息前缀，群聊加发送者前缀，群聊命令只送去掉机器人 @ 的命令文本 | "[回复: "、"[回复消息] "、"includeSenderPrefix"、"reply message detected"（feishu-gateway.js 字面量） | confirmed |
| `/setup` 的群内重复执行权限；只在首次绑定时写 bound_by；未配置实例发设置卡片并丢弃消息，所有者私聊用握手得到的默认目录自动 spawn，所有者为空时不写 bound_by | "/setup can only be run by the user who originally bound this group."、"You are not on the FEISHU_GROUP_CMD_USERS allowlist; /setup is not available to you."、"pre-spawn describeChannel failed; aborting to protect bound_by"、"message intercepted by setup gate (channel unconfigured)"、"failed to deliver setup card"、"owner DM auto-spawn succeeded"、"zeroConfig"（feishu-gateway.js 字面量） | confirmed |
| 进度卡三种取值，无法识别按 off | "unusable feishu.process_card value; the turn runs with the card off"、"任务已完成"（feishu-gateway.js 字面量） | confirmed |
| 进度表情四个阶段、不足 300 毫秒的切换被跳过；进度卡开启时执行事件交给卡片、表情只切到思考；用户表情转为合成消息 | "Get"、"THINKING"、"OnIt"、"Typing"、"skipping typing indicator emoji"、"peekProcessCardMode"、"[reacted with"（feishu-gateway.js 字面量） | confirmed |
| 出站附件按类型发送：ogg 或 opus 为原生语音，mp4 或 video 为 media | "opus"、"audio"、"media"、"[语音]"（feishu-gateway.js 字面量） | confirmed |
| 适配器默认经 unix socket 连接 daemon，只读端口 URL 自动改用 socket；不经 CLI 启动时不读 `.env` | "daemon URL targets the local read-only TCP port; using the unix socket instead"、"standalone host launch detected; ~/.config/duoduo/.env is not auto-loaded"（feishu-gateway.js 字面量） | confirmed |
| 适配器读取 FEISHU_BOT_OWNER、FEISHU_GROUP_CMD_USERS、FEISHU_STREAMING_CARD、FEISHU_REACTION_NOTIFICATIONS、FEISHU_LOCALE，但已发布清单不含它们，经 CLI 启动时取默认值 | "FEISHU_BOT_OWNER"、"FEISHU_GROUP_CMD_USERS"、"FEISHU_STREAMING_CARD"、"FEISHU_REACTION_NOTIFICATIONS"、"FEISHU_LOCALE"（feishu-gateway.js 字面量） | 未证实推测：适配器读取这五个变量已由字面量确认；清单内容经 `npm view @openduo/channel-feishu aladuo` 核对（本机已安装的插件清单同样缺这五项）；CLI 只复制清单内键的逻辑已在 cli.pretty.js 中读到，但所在函数没有真名，构建检查无法核对 |
| 全局层只承载模型选择类键，行为键在种类与实例两层取值，claude.tools 取并集 | `models: r?.runtimeModels`（`buildEffectiveChannelConfig`）；`profiles: r?.claudeModelProfiles`（`buildEffectiveChannelConfig`）；`prompt_mode: o?.prompt_mode ?? i?.prompt_mode ?? "append"`（`buildEffectiveChannelConfig`）；`claudeTools: rbe(i?.claudeTools, o?.claudeTools)`（`buildEffectiveChannelConfig`） | confirmed |
| 种类文件在内核 `config/` 下，实例描述符在 `var/channels/` 下 | `a = vt.join(i, "config")`（`resolveRuntimePaths`）；`y = vt.join(u, "channels")`（`resolveRuntimePaths`） | confirmed |
| require_mention 由描述符解析，不进入有效配置 | `typeof e.require_mention == "boolean" ? e.require_mention : void 0`（`parseChannelConfigFields`） | confirmed（`buildEffectiveChannelConfig (cbe)` 的返回对象中没有该键） |

## 10 job 调度

job 由一个独立于心跳的 60 秒扫描器调度，调度规则在创建时校验；扫描器先写认领时间再派生 job 会话，一次运行在该会话的 actor 退出时按六种结束状态之一结算：失败写 job.fail 事件并唤醒 owner，成功写 job.complete 事件、只进 owner 邮箱，作为回执随 owner 的下一轮送达；once 与 @in 结算后自动归档。归档、打断和由运维发起的改期是 CLI `duoduo job` 的三个动词，分别经 `job.archive`、`job.interrupt`、`job.reschedule` 三个 RPC 方法执行；ManageJob 工具没有这三个动作，job 要让自己再运行一次只能调用 RemindDuoduo。

### 10.1 定义与创建校验

一个 job 由两个文件组成：`<runtimeDir>/var/jobs/active/<id>.md` 是创建时写定的定义（frontmatter 加任务书正文），同名的 `<id>.state.json` 是运行时维护的调度状态；创建时校验 id、调度规则和工作目录，任何一项不合格都拒绝创建，不会留下一个要到运行时才出错的 job。

定义文件由 `renderJobFileMarkdown (Sst)` 按固定顺序写出：type（恒为 "job"）、cron（调度规则）、created_at、owner_session、cwd_rel、runtime、model、effort、acceptance，stateless 只在为 true 时写，prompt_mode 只在为 override 时写，最后是 allowedTools、disallowedTools、additionalDirectories 三个列表和 `claude: { tools }`。正文是任务书，每次运行都作为系统提示的 Job Mission 层注入（2.1）；SDK 配置类字段如何叠加进会话配置见 3.5。状态文件初始只有 last_run_at 为 null、last_result 为 "unknown"、run_count 为 0，之后由扫描器和结算写入 last_scheduled_at（认领时间）、last_run_started_at（引擎接受第一轮的时间）、last_run_at、last_result、last_error、run_count，以及改期设定的额外触发时间 run_at。RemindDuoduo 的提醒记录也放在这个目录，frontmatter 的 type 为 "wake"，列 job 时被跳过（4.4）。某个 job 文件解析失败时只有它不被调度，其余 job 照常加载（`the other jobs still load`（`initJobManagerModule`））。

调度规则有五种写法，全部按 UTC 计算：

| 调度规则 | 首次到期 | 此后 | 结算后自动归档 |
|---|---|---|---|
| `once` | 创建后的第一次扫描 | 不再到期，除非改期 | 是 |
| `@in <时长>` | 创建时间加时长之后的第一次扫描 | 不再到期，除非改期 | 是 |
| `keepalive` | 创建后的第一次扫描 | 休眠，只由通知或改期唤醒（10.3） | 否，需显式归档 |
| `@every <时长>` | 创建后的第一次扫描 | 上一次认领时间加时长 | 否 |
| 标准 cron 表达式 | 创建时间之后的第一个日历边界 | 上一次认领时间之后的下一个边界 | 否 |

下文的"一次性调度"指 once、@in、keepalive 三种：扫描器的重试规则（10.2）和投递负载里的调度类型 one-shot 都按这三种判断（未证实推测：判定谓词已读到，但没有真名，缺可检查的引用）；结算后自动归档只适用于 once 与 @in（confirmed，见证据表）。无论哪种规则，状态文件里的 run_at 一旦到达，job 就到期一次，这是改期的实现方式（10.4）；对还没被认领过的 `once` 与 `@in`，一个尚未到达的 run_at 同时推迟它的首次运行（未证实推测：这条规则在没有真名的到期判断函数里）。

创建校验在 job 管理器的 createJob 里完成，所有创建途径都经过它。id 必须非空，且不能含路径分隔符或控制字符，因为它原样用作文件名；同一 id 已有活跃 job 时拒绝创建，已归档的 id 可以再次使用。调度规则必须非空并通过 `validateJobScheduleExpression (Rye)`：`once` 与 `keepalive` 直接接受；`@in` 与 `@every` 后面的时长由 `parseScheduleDurationMs (dw)` 解析，支持 s、m、h、d、w 五种单位的复合写法（如 `1d6h4m`），有多余字符即判为格式错误，再由 `assertScheduleDurationRepresentable (gV)` 拒绝超出可表示时间范围的值；其余一律按 UTC 的 cron 表达式解析，解析失败即拒绝。指定 cwd_rel 时，它必须是工作区根目录下已存在、且含 `CLAUDE.md` 的目录；省略时 job 在运行时管理的私有工作目录中运行，该目录跨运行保留。同 id 旧 job 残留的状态文件会被隔离，新 job 从全新状态开始。最后 createJob 为 job 会话写好会话描述（kind 为 job，记录 owner_session）。

创建有两个入口，行为不同。ManageJob 工具的 create 动作（把调用者会话记为 owner，要求 model 与 acceptance，并限制哪些会话能创建，见 4.2）在写完文件后发出总线事件 job.created，扫描器随即扫描一次，已到期的 job 立刻启动。JSON-RPC 方法 `job.create` 只接受 id、cron、instruction、owner_session 与 cwd_rel（`isJobCreateParams (J0)`），runtime 填宿主默认引擎，不检查 model 与 acceptance，只追加一条来源为 job 的 job.spawn 审计事件而不派生会话，也不发 job.created，所以要等下一次定时扫描才被调度；CLI 没有创建 job 的动词。`/loop` 不直接创建 job，而是把用户的一句话展开成要求模型调用 ManageJob 的提示（6.2）。

job 会话的会话键由 job id、调度规则和 cwd_rel 三项派生（`cwdRel: n.cwd_rel`（`initJobManagerModule`）），形如 `job:<id 的可读形式>.<哈希>`（包内 `bootstrap/var/jobs/DUODUO.md` 原文）；派生函数本身没有真名。由此可知，手工修改 job 文件里的 cron 或 cwd_rel 会让下一次运行落到一个新的会话键上，之前的会话历史不会带过去；只改 owner_session 不影响会话键。

### 10.2 60 秒扫描器

job 由 `createJobScheduler (Ygt)` 创建的扫描器调度，它与心跳（第 11 节）是两个互不相干的定时器：间隔固定为 60 秒（`Kgt = 6e4`（`initJobSchedulerModule`）），main 构造它时不传间隔参数，也没有环境变量可改；daemon 启动时先扫一次，ManageJob 创建 job 时再立即扫一次，上一次扫描还没结束时新的一次直接跳过。

每次扫描由 `scanAndSpawnDueJobs (yJ)` 对每个活跃 job 依次执行：

1. **判断是否到期**，规则见 10.1 的表。
2. **失败退避。** 上一次结果为 failure、且认领时间距今不足 5 分钟的 job 跳过（`backoffMs: 3e5`（`scanAndSpawnDueJobs`））。
3. **避免并发与冲突。** job 会话正在归档时跳过；该会话已有未结束的 actor（上一次运行还在进行）时跳过，同一个 job 不会并发运行两次。
4. **认领。** 把当前时间写进状态文件的 last_scheduled_at；写入失败则跳过，留给下一次扫描。
5. **派生。** 向事件日志追加一条 job.spawn 事件，来源 kind 为 "cadence"、name 为 "job-scanner"，payload 带 run_number、triggered_at 与 previous_run_at，供 2.3 的 job-tick 瞬时块使用；在 job 会话邮箱追加指向它的指针行，然后调用会话管理器的 spawnJobSession。job 会话占用 job 并发池（8.3）。

对一次性调度（once、@in、keepalive），扫描器还有一条重试规则：认领之后引擎没有真正开始（状态文件没有 last_run_started_at，或它早于认领时间），且结果为 unknown 或 failure 时，扫描器把这个 job 当作从未调度过，下一次扫描再次判为到期；结果为 failure 的仍受 5 分钟退避约束。10.3 表中没有真正开始就结束的三种状态靠这条规则得到重试。周期调度没有这条规则，下一次到期按上一次认领时间计算。

每次扫描在检查 job 之前，先处理到期的提醒记录：把记录里的上下文作为 self-wake 事件投递给它的 owner 会话，然后归档这条记录，投递返回失败时同样归档，投递过程抛出异常时记录留到下一次扫描（`return await this.archiveJobHoldingLock(t), a.success ? {`（`initJobManagerModule`），细节见 4.4）。

job 会话的 actor 在一次 drain 没有处理任何条目时立即退出，不像渠道会话那样进入空闲等待（8.4）。因此一次"运行"就是一个 actor 从派生到邮箱清空的全过程，运行期间到达的通知在同一次运行内处理。引擎接受第一轮时，actor 把 last_run_started_at 写进状态文件，轮次被拒绝时再撤回；10.3 用这个时间区分运行"开始过"还是"没开始"。

### 10.3 结束状态与结果投递

job 会话的 actor 退出时，`createJobSessionFinalizer (SEe)` 按是否出错、是否被中止、引擎是否开始过、处理了几条条目，把这次运行归入六种结束状态之一；每种状态决定写入什么状态、追加哪个事件、是否通知 owner，以及 once 或 @in job 是否归档。

| 结束状态 | 判定 | 状态文件 | 事件与投递 | once 与 @in |
|---|---|---|---|---|
| STARTED_SUCCESS | 无错误、未中止，引擎开始过或处理过条目 | last_result 为 success，run_count 加一，写 last_run_at，消费 run_at | 追加 job.complete；投递给 owner 但不唤醒；本次运行成功调用过 Notify 时不投递 | 未改期则归档 |
| STARTED_FAILURE | 出错，引擎开始过 | failure 与 last_error，消费 run_at | 追加 job.fail；投递并唤醒 owner | 未改期则归档 |
| NEVER_STARTED_FAILURE | 出错，引擎没开始（例如引擎不可用，3.3） | failure 与 last_error，保留 run_at | 追加 job.fail；投递并唤醒 owner | 保留，5 分钟后重试 |
| CANCELLED_POST_ACK | 被中止，引擎开始过 | failure，last_error 为 "cancelled"，消费 run_at | 只有这次中止导致 once 或 @in job 被归档时，才追加 job.fail 并通知 owner | 未改期则归档 |
| CANCELLED_PRE_ACK | 被中止，引擎没开始 | 不写 | 不投递 | 保留，下一次扫描重试 |
| ZERO_FED | 无错误、未中止，引擎没开始且没处理任何条目 | failure，last_error 为 "zero-fed run — no items merged"，保留 run_at | 不投递 | 保留，5 分钟后重试 |

中止的来源包括 `duoduo job interrupt`（10.4）和 daemon 重启；包内文档把"已经开始、被 daemon 重启中止、job 本身仍保留"列为最常见的不投递情形，因为扫描器会再次运行它，通知 owner 只会多出一条无需处理的消息（`bootstrap/var/jobs/DUODUO.md` 原文；ManageJob 的工具说明也写明被重启切断、之后还会再运行的一次不通知 owner）。

结果只投递给 owner，没有别的配置项。owner 取自 job 文件的 owner_session，而且用的是这次运行开始时的快照，所以运行期间修改 job 文件不会改变这次运行的收件人。没有 owner_session、owner 不是可投递的会话、或者 owner 已归档或正在归档时，结果不投递，只写日志。投递经 `deliverRouteEventToSession (Ps)` 完成：追加一条 route.deliver 事件并在 owner 邮箱写入指针；job.fail 随后发出唤醒，抢占模式为 never，不打断 owner 正在进行的轮次；job.complete 带 enqueueWithoutWake 标记，只进邮箱不唤醒（`enqueueWithoutWake: m === "job.complete"`（`createJobSessionFinalizer`））。成功投递的负载带结果摘要（前 200 个字符）、结果正文（前 2000 个字符）和调度类型（one-shot 或 periodic）。job 在本次运行中成功调用过 Notify 时，系统不再投递 job.complete，因为已经有人收到了结果；Notify 被拒绝的运行照常投递。

成功回执不会自己驱动 owner 的一轮。owner 下一次因为别的原因 drain 时，`batchDrainItems (EH)` 挑选驱动这一轮的条目，跳过所有 job.complete 投递；`collectJobCompletionReceipts (gft)` 再从全部待处理条目里把它们收集起来，按 job_id 分组渲染：同一个 job 只有一条回执时给出结果正文，有多条时合并为一条摘要，说明成功了几次，并给出在事件日志里检索各次结果的 grep 命令。渲染出的文本作为 job-receipts 瞬时块放进这一轮的用户消息（2.3），这些条目随这一轮一起标记完成。给渠道会话的回执写明它是信息、不是指令、不要求回复，并说明它随 owner 因其他原因进行的这一轮一起送达，并没有唤醒 owner；给后台会话的回执则要求不产生用户可见输出。插话路径同样经 `batchDrainItems (EH)` 挑选条目，所以回执不会作为插话进入正在进行的轮次，而是留在邮箱里等下一次 drain。失败通知是普通的邮箱条目，会驱动 owner 的一轮，提示词按 owner 的会话类型和 job 的调度类型给出不同的处置要求：渠道会话收到一次性调度的 job 失败时，先被要求检查工作目录里是否已有部分成果，再决定怎样告诉用户；收到周期 job 失败时，被告知暂时性失败可以用 Skip 保持沉默，以及怎样用 `duoduo job archive` 停掉它。owner 不是渠道或未知类型的会话时（例如 keepalive job 派出的子 job 失败），提示词要求它决定是创建替代 job 重试、把错误并入自己的结果，还是不带目标调用 Notify 请求人工判断。

认领时间同时起游标的作用：结算写状态时带上本次运行认领时记下的 last_scheduled_at，如果状态文件里的值已经变了（扫描器又认领了新的一次），这次结算什么都不写。job 在运行中被归档时，定义文件已不在 active 目录，结算冻结状态、不再自动归档，但结果仍照常投递给 owner。run_at 只在它不晚于认领时间时才被消费，所以运行期间用 RemindDuoduo 或 `duoduo job reschedule` 设下的新触发时间会保留下来；once 或 @in job 结算时如果 run_at 仍在，就跳过自动归档，等待那次触发。

keepalive job 首次运行之后不会再被扫描器判为到期，也不会自动归档；它的会话，包括引擎侧的会话历史，保留下来（ManageJob 拒绝创建 stateless 的 keepalive），之后由三种方式唤醒：其他会话调用 Notify 发来的通知，外部命令 `duoduo session notify`（`deliverExternalSessionNotify (A0e)` 投递一条 external.notify 事件，抢占模式为 never），以及它自己调用 RemindDuoduo 或运维执行 `duoduo job reschedule` 设定的 run_at。skills/duoduo-pipeline 描述的零模型成本监控就建立在这一点上：系统定时器定期运行一个普通脚本去查询数据源，只在出现新数据时调用 `duoduo session notify` 唤醒一个 keepalive job，空闲期间不调用模型。keepalive 是唯一能创建新 job 的 job 类型，但不能再创建 keepalive（4.2）。

### 10.4 CLI 处置

结束和打断一个 job 是运维动作，只能在 shell 里通过 `duoduo job`（`cli:runJobSubcommand (nJe)`）执行，改期也可以由运维在这里发起；ManageJob 工具没有这些动作，它只接受 create、list、read，`action` 参数的说明把结束、打断 job 引向这些 shell 命令，并说明 job 要再运行一次自己时调用 RemindDuoduo（4.2、4.4）。五个动词各对应一个 RPC 方法，都接受 `--json` 输出原始结果：

| 动词 | RPC 方法 | 行为 |
|---|---|---|
| `list [--json]` | `job.list` | 列出活跃 job 和提醒记录；该方法也在只读 TCP 端口放行（6.1） |
| `read <id> [--json]` | `job.get` | 返回定义、任务书与状态；提醒记录和已归档的 job 也能读到；活跃文件无法解析与找不到时返回不同的错误码 |
| `archive <id>` | `job.archive` | 把 `.md` 与 `.state.json` 移到 `var/jobs/archive/`，并归档 job 会话目录，不删除任何文件；正在进行的运行继续到结束，之后不再调度；对尚未触发的提醒记录同样有效，用于取消它 |
| `interrupt <id> -r "<理由>"` | `job.interrupt` | 理由必填，CLI 与 RPC 两处都检查；-r 只对 interrupt 合法，其他动词带 -r 时 CLI 直接报错；先把理由写成该 job 会话的待送网关通知，再请求中止正在进行的运行；当时没有运行在进行时清除这条通知 |
| `reschedule <id> <时间>` | `job.reschedule` | 设定一次额外触发（写 run_at），时间为 `@in <时长>` 或带时区的未来 ISO 8601 时间；调度类别不变；已归档的 job 拒绝改期 |

打断不是直接结束进程。会话管理器对常驻流式会话拆除这条流，对其他运行以 immediate 档位调用 `requestBoundaryAwarePreempt (zS)`，立即中止当前的 abort 控制器（7.5）；不响应中止信号的工具不会被强杀，运行中脱离引擎的后台工作也不受影响。被中止的运行按 10.3 结算：引擎已接受轮次时通常是 CANCELLED_POST_ACK，还没接受时是 CANCELLED_PRE_ACK，由扫描器重试。理由作为 gateway-notice 瞬时块出现在该 job 会话的下一次运行里（2.3），被打断的会话由此知道上一次为什么被切断。`job.interrupt` 同时查活跃与已归档的 job，所以先 archive 再 interrupt 可以停掉一个 job 并结束它正在进行的那次运行。CLI 打印的回执 `cli:renderInterruptReceipt (jge)` 逐条说明了这些结局。

除 `job.list` 外，这几个方法都会修改状态或读取完整定义，只在完整控制面上提供，即 unix socket 和可选的远程监听（6.1）。另有一个 `job.manage` 方法不是给 CLI 用的：它只接受携带 pi worker token 的请求，内部调用与 ManageJob 工具相同的 `runManageJobTool (cg)`，是 pi 引擎的 worker 进程执行 ManageJob 的回调通道（pi 的进程模型见 3.2）。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 定义文件 frontmatter 的字段与顺序，SDK 列表与 `claude.tools` 最后写出 | `for (let r of ["allowedTools", "disallowedTools", "additionalDirectories"])`（`renderJobFileMarkdown`）；`n.push("claude:"), n.push("  tools:")`（`renderJobFileMarkdown`） | confirmed |
| 状态文件初始值；活跃与归档两个目录 | `last_result: "unknown"`（`initJobManagerModule`）；`Of.join(this.paths.varDir, "jobs", "archive")`（`initJobManagerModule`） | confirmed |
| 提醒记录与 job 共用目录，type 为 wake | `'type: "wake"'`（`initJobManagerModule`） | confirmed |
| 调度规则在创建时校验：空规则、复合时长、可表示范围、UTC cron | `Rye(i)`（`initJobManagerModule`）；`"schedule must not be empty"`（`validateJobScheduleExpression`）；`tz: "UTC"`（`validateJobScheduleExpression`）；`/(\d+)([smhdw])/g`（`parseScheduleDurationMs`）；`assertScheduleDurationRepresentable (gV)` | confirmed |
| 五种调度规则的首次到期、此后到期与自动归档 | `A new 'once', 'keepalive', '@every', or elapsed '@in' job is due on`（`initManageJobToolModule`）；`a standard cron job waits for its first calendar boundary`（`initManageJobToolModule`）；`'once' — run once on next scheduler cycle, then auto-archive (session is archived with it)`（`initManageJobToolModule`）；`'keepalive' — run once on next scheduler cycle, then stay dormant.`（`initManageJobToolModule`）；`Never auto-archives`（`initManageJobToolModule`）；`let l = u.state.last_scheduled_at ?? u.state.last_run_at`（`scanAndSpawnDueJobs`） | confirmed（五种规则的文字来自 ManageJob 工具说明；`@every` 与 cron 以上一次认领时间为基准，由调用点传入的参数确认，规则体在没有真名的到期判断函数内，代码已读到） |
| 到期判断含 run_at：run_at 到达即到期一次；还没被认领过的 once 与 @in 在 run_at 之前不到期 | `!Iye(u.frontmatter.cron, l, o, u.frontmatter.created_at, u.state.run_at ?? null)`（`scanAndSpawnDueJobs`）；`Set ONE extra fire at <when>`（`cli:jobHelp`） | confirmed（到期判断收到 run_at 与认领时间）；"未被认领过的 once 与 @in 等待 run_at" 为未证实推测（这条规则在没有真名的到期判断函数体内，代码已读到，构建检查覆盖不到） |
| cwd_rel 必须存在且含 CLAUDE.md；省略时用跨运行保留的私有目录 | `let o = await Oye(this.paths, t, n.cwd_rel)`（`initJobManagerModule`）；`the directory MUST already exist and MUST contain a CLAUDE.md context file`（`initManageJobToolModule`）；`If omitted, the job runs in a private, runtime-managed workspace that persists across runs`（`initManageJobToolModule`） | confirmed（规则文字来自 ManageJob 工具说明，片段证明 createJob 调用校验；校验函数本身没有真名，其两条报错已在 pretty bundle 中读到） |
| ManageJob 创建后发 job.created，扫描器立即扫描 | `t.bus?.emit("job.created", {`（`runManageJobTool`）；`r.on("job.created", c)`（`createJobScheduler`） | confirmed |
| RPC job.create 只收五个参数，runtime 取宿主默认，写审计用 job.spawn，不发 job.created | `isJobCreateParams (J0)`；`runtime: Co()`（`createDaemon`）；`type: "job.spawn",`（`createDaemon`） | confirmed |
| 会话键由 id、调度规则、cwd_rel 派生 | `buildSessionKey(t, n)`（`initJobManagerModule`）；`cwdRel: n.cwd_rel`（`initJobManagerModule`） | confirmed（派生函数本身没有真名；形式见包内 `DUODUO.md`） |
| 扫描间隔 60 秒，无环境变量；启动即扫；重入跳过 | `Kgt = 6e4`（`initJobSchedulerModule`）；`e.intervalMs ?? Kgt`（`createJobScheduler`）；`createJobScheduler: s`（`main`）；`let k = s({ paths: d, sessionManager: $, bus: h });`（`main`）；`a = l(), o = setInterval(() => {`（`createJobScheduler`）；`"[job-scheduler] scan skipped: previous scan still running"`（`createJobScheduler`） | confirmed（否定性证据：`createJobScheduler` 只读参数 intervalMs，`main` 构造它时不传，两处都不读环境变量） |
| 失败退避 5 分钟；归档中与运行中跳过 | `backoffMs: 3e5`（`scanAndSpawnDueJobs`）；`"[cadence] skip due job: session is being archived"`（`scanAndSpawnDueJobs`）；`"[cadence] skip due job: already running"`（`scanAndSpawnDueJobs`） | confirmed |
| 先认领再派生；job.spawn 事件来源与 tick 负载 | `last_scheduled_at: o.toISOString()`（`scanAndSpawnDueJobs`）；`"[cadence] skip due job: claim state write failed, retrying next scan"`（`scanAndSpawnDueJobs`）；`name: "job-scanner"`（`scanAndSpawnDueJobs`）；`run_number: (u.state.run_count ?? 0) + 1`（`scanAndSpawnDueJobs`）；`t.spawnJobSession(u.id, p)`（`scanAndSpawnDueJobs`） | confirmed |
| 一次性调度认领后未开始的运行被重新判为到期；一次性调度指 once、@in、keepalive，投递负载据此写 one-shot 或 periodic | `r$(u.frontmatter.cron) && u.state.last_scheduled_at && f`（`scanAndSpawnDueJobs`）；`u.state.last_run_started_at ? new Date(u.state.last_run_started_at).getTime() : Number.NaN`（`scanAndSpawnDueJobs`）；`schedule_type: AS(x)`（`createJobSessionFinalizer`） | confirmed（重试条件与 schedule_type 字段）；"一次性调度指 once、@in、keepalive" 为未证实推测（判定谓词与 one-shot/periodic 的映射在没有真名的小函数里，代码已读到：前者为 once、以 "@in " 开头或 keepalive） |
| 扫描先投递到期提醒，再检查 job；投递后归档提醒记录 | `a = await Ggt(e, r, o, n?.bus)`（`scanAndSpawnDueJobs`）；`wakesFired: a.length`（`scanAndSpawnDueJobs`）；`return await this.archiveJobHoldingLock(t), a.success ? {`（`initJobManagerModule`）；`outcome: "undeliverable",`（`initJobManagerModule`） | confirmed（片段证明调用发生在遍历 job 之前、记录在投递后归档；把记录作为 self-wake 投递的函数本身没有真名，代码已读到） |
| job actor 在邮箱清空时退出；引擎接受第一轮时记录 last_run_started_at | `"[session-manager] job/system session drain complete, exiting"`（`createSessionManager`）；`"[session-manager] last_run_started_at stamp failed (best-effort)"`（`createSessionManager`） | confirmed |
| 六种结束状态的判定 | `!f.runStarted && f.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"`（`createJobSessionFinalizer`）；`last_error: "cancelled"`（`createJobSessionFinalizer`）；`last_error: "zero-fed run — no items merged"`（`createJobSessionFinalizer`）；`"[session-manager] job failed (never started, spawn-class) — job preserved"`（`createJobSessionFinalizer`） | confirmed |
| once 与 @in 结算后自动归档，改期或运行中归档时跳过；keepalive 与周期调度不自动归档 | `if (!_Ee(h)) return !1`（`createJobSessionFinalizer`）；`"[session-manager] auto-archived one-shot job"`（`createJobSessionFinalizer`）；`"[session-manager] skip auto-archive: job re-armed via reschedule"`（`createJobSessionFinalizer`）；`"[session-manager] skip auto-archive: job already gone (archived mid-run)"`（`createJobSessionFinalizer`） | confirmed |
| 被中止的 once 或 @in job 归档时才通知 owner；被重启切断、之后还会再运行的一次不通知 | `"[session-manager] job run cancelled after turn ack — archived, owner notified"`（`createJobSessionFinalizer`）；`A failed run wakes you; a run cut off by a restart that will run again does not.`（`initManageJobToolModule`） | confirmed（归档判断的谓词没有真名，代码已读到：只对 once 与以 "@in " 开头的规则为真） |
| owner 取自运行开始时的快照；无 owner 不投递 | `let R = p.jobSnapshot`（`createJobSessionFinalizer`）；`"[session-manager] job outcome undeliverable: no owner_session"`（`createJobSessionFinalizer`） | confirmed |
| 失败唤醒 owner，成功只入邮箱；两者都不抢占 owner 当前轮次；owner 已归档则拒收 | `woke: m === "job.fail"`（`createJobSessionFinalizer`）；`"[route] enqueued without wake (waits for the owner's next turn)"`（`deliverRouteEventToSession`）；`"job.fail" ? "never" : "allow"`（`deliverRouteEventToSession`）；`error: "session_archived"`（`deliverRouteEventToSession`） | confirmed |
| 成功负载截断长度；成功调用过 Notify 时不投递成功回执，Notify 返回错误时不算 | `result_summary: I?.slice(0, 200)`（`createJobSessionFinalizer`）；`result_text: I?.slice(0, 2e3)`（`createJobSessionFinalizer`）；`"[session-manager] skipping system job.complete delivery: agent called Notify"`（`createJobSessionFinalizer`）；`a.startsWith("Error:")`（`createAladuoMcpServer`）；`t.onNotifyCalled?.()`（`createAladuoMcpServer`）；`e.sessionManager?.markAgentNotified(A.session_key)`（`createDaemon`） | confirmed |
| 回执不驱动轮次，随 owner 下一轮作为 job-receipts 瞬时块送达，插话路径同样跳过它；同一 job 多条合并 | `if (c && oke(c) !== null) continue`（`batchDrainItems`）；`w.admissionCallback = async () => {`（`createSessionManager`）；`tt = await EH(t, Ve, { fallbackBatchSize: vH,`（`createSessionManager`）；`l.length === 1 ? l[0].prompt : hft(e, t, u, l)`（`collectJobCompletionReceipts`）；`jobReceipts: C ? void 0 : $?.text`（`drainSessionMailbox`）；`tag: "job-receipts"`（`buildTransientUserBlocks`） | confirmed（插话准入回调里紧接着调用 `batchDrainItems (EH)` 挑选条目；多条合并的渲染函数没有真名，其 grep 提示已在 pretty bundle 中读到） |
| 回执对渠道会话声明"不是指令、不要求回复" | `"It did not wake you: it is riding a turn you are having for another reason,"`（`renderJobCompleteReceiptGuidance`） | confirmed |
| 失败通知按 owner 的会话类型与调度类型给出处置要求 | `l = en(o, "schedule_type") ?? ""`（`renderMailboxEventPrompt`）；`p = Zdt(c, l, s)`（`renderMailboxEventPrompt`） | confirmed（c 是 owner 的会话类型，l 是 schedule_type；指引文本所在函数没有真名，其四个分支已在 pretty bundle 中读到） |
| 认领游标：状态已被新认领覆盖时结算不写 | `"expectedClaimCursor" in r`（`initJobManagerModule`） | confirmed |
| keepalive 可被外部通知唤醒，且不抢占 | `eventType: "external.notify"`（`deliverExternalSessionNotify`）；`preempt: "never"`（`deliverExternalSessionNotify`） | confirmed |
| keepalive 可创建 job，但不能创建 keepalive；keepalive 不能是 stateless | `"A keepalive job may create jobs, but not another keepalive job."`（`initManageJobToolModule`）；`e.stateless === !0 && e.cron === "keepalive"`（`runManageJobTool`） | confirmed |
| ManageJob 没有 archive 与 reschedule 动作；参数说明与工具体的拒绝文字都指向 shell 命令与 RemindDuoduo（工具体的拒绝只在不强制枚举的路径上可达，见 4.2） | `Stopping a job and re-arming one are not actions here`（`initManageJobToolModule`）；`"ManageJob has no 'archive' action. Ending a job is an operator verb now, and"`（`initManageJobToolModule`）；`"ManageJob has no 'reschedule' action."`（`initManageJobToolModule`）；`"To give a job one more run, call RemindDuoduo: from inside the job it takes"`（`initManageJobToolModule`） | confirmed |
| CLI 五个动词对应五个 RPC 方法 | `cli:runJobSubcommand (nJe)`；`cli:parseJobCli (Kge)`；`await wT("job.reschedule", {`（`cli:runJobSubcommand`） | confirmed |
| interrupt 的理由必填（CLI 与 RPC），经网关通知送达下一次运行；-r 只对 interrupt 合法 | `'error: duoduo job interrupt requires -r "<reason>"'`（`cli:parseJobCli`）；`takes no -r/--reason`（`cli:parseJobCli`）；`"job.interrupt requires a non-empty 'reason' — it is what the interrupted session is told."`（`createDaemon`）；`command_name: "interrupt"`（`createDaemon`） | confirmed |
| interrupt 同时查活跃与已归档 job；流式会话拆流，其他运行立即中止 | `let V = await c.getJob(k.id) ?? await c.getArchivedJob(k.id)`（`createDaemon`）；`"[session-manager] interrupt: stopping streaming session"`（`createSessionManager`）；`zS(P, "immediate", void 0, "user-cancel")`（`createSessionManager`） | confirmed |
| archive 只移动文件、会话一并归档，进行中的运行跑完 | `"Nothing is deleted: an archived job's files move to var/jobs/archive/."`（`cli:jobHelp`）；`"                          runs to its end; the job's session is archived with it."`（`cli:jobHelp`）；`async archiveJobHoldingLock(t)`（`initJobManagerModule`） | confirmed |
| job.get 先查提醒记录，再对活跃、无法解析、已归档、找不到分别处理 | `let N = await c.getWakeRecord(k.id).catch(() => null)`（`createDaemon`）；`code: vm.INVALID_ACTIVE`（`createDaemon`）；`archived: !0`（`createDaemon`）；`code: vm.NOT_FOUND`（`createDaemon`） | confirmed（错误码定义见 `@openduo/protocol` 源码 `job.ts` 的 `JOB_GET_ERROR`） |
| job.manage 只接受 pi worker token | `S.method === "job.manage"`（`createDaemon`）；`requires a pi worker token`（`createDaemon`） | confirmed |

## 11 心跳与后台分区

心跳是 daemon 主进程里的一个定时器，每次触发先在进程内总线上广播 `cadence.tick`，再运行一轮不调用模型的确定性维护；后台分区引擎订阅这条广播，只有活动指纹有变化、轮转表里有不在冷却或退避中的分区时才运行一个分区，第一次选择选中了分区、且活跃会话不超过一个时才在同一次心跳里再运行一个，每次运行都是一个不保存历史的一次性会话。代码强制的检查有三处：契约过滤、分区工具白名单（只在 Claude 引擎上生效）、自操作工具层不给分区会话提供 ManageJob；其余自我修改的边界只写在提示词里。daemon 启动时，内核已有内容就只补缺失的出厂文件，退休名单里的分区只把调度开关关掉一次。下面五个小节依次展开这五点。记忆检查产出什么任务单见第 12 节，job 的 60 秒扫描器见第 10 节。

### 11.1 心跳与确定性维护

心跳是 daemon 主进程里一个默认每 37 分钟触发一次的定时器：每次触发先广播 `cadence.tick`，上一轮维护已结束时再运行四步不调用模型的维护。定时器由 `main (Fyt)` 创建，周期取自环境变量 `ALADUO_CADENCE_INTERVAL_MS`，按整数解析：未设置时是 2,220,000 毫秒（37 分钟）；设置的值不是整数或小于 1000 时，记一条告警并使用默认值（confirmed）。定时器回调的第一句是 `h.emit("cadence.tick")`（`main`），之后才检查主进程自己的重入标志：上一轮维护还没结束时，只记一条 "cadence tick skipped" 日志就返回。广播发生在重入检查之前，所以维护耗时变长时，订阅者仍然每次心跳都收到广播（confirmed）。

总线上订阅 `cadence.tick` 的有两处：后台分区引擎 `createMetaSession (Wgt)`，以及出站投递管理器 `createOutboxDeliveryManager (Qgt)`，后者在每次心跳重投一次积压的出站记录（第 6.3 节）。job 的调度由另一个独立的 60 秒定时器负责，不挂在心跳上（第 10 节）。

维护由 `runCadenceTick (Zgt)` 按固定顺序执行，四步都是确定性代码，没有一步调用模型（confirmed）：

1. 记忆检查 `runMemoryCheckTick (qct)`，内容见第 12.2、12.3 节；
2. `sweepTombstonedSessionRecords (Jgt)` 清理已归档会话的残留：删除这些会话里状态不是 pending 的出站记录，以及它们的出站重放日志；这一步抛错只记告警，不中断心跳；
3. 构造一条 `system.cadence_tick` 事件（来源 `{kind: "system", name: "cadence"}`，payload 为空对象），经 `atomicAppendEvent (on)` 写入事件日志；
4. 把名为 `jobs` 的消费进度推进到这条事件（`advanceConsumerWatermark (Nu)`），并用 `updateRegistryStatus (Du)` 把事件时间写进 daemon 状态文件的 `cadence.last_tick`。

心跳的状态经控制面方法 `system.status` 对外报告：`cadence` 一项给出 `last_tick` 与 `interval_ms`，`subconscious` 一项列出轮转表当前一轮每个分区是否已勾选，`memory_check` 一项给出两个记忆检查开关和每个分区的契约状态（`buildMemoryCheckStatus (J6)`，第 12.2 节）（confirmed）。其中 `interval_ms` 是对同一环境变量做 `parseInt`、失败时取默认值得到的，没有 1000 的下限，也不拒绝小数：变量设成 500 时，定时器按默认的 37 分钟运行，`system.status` 却报告 500（confirmed）。

### 11.2 跳过条件

后台分区引擎在每次心跳里依次做四项检查，任何一项不通过就少运行或不运行分区。四项检查都不调用模型，所以既没有外部活动、记忆目录也没有变化时，后台不产生模型调用开销。下表列出四项检查的作用范围和状态存放位置，表后逐项说明判据。

| 检查 | 不通过时的结果 | 判据 | 状态存放 |
|---|---|---|---|
| 重入与停机 | 整次心跳不运行分区 | 引擎仍在处理上一次心跳，或已收到停止请求 | 进程内存 |
| 活动指纹 | 整次心跳不运行分区 | 四个分量拼接后的哈希与上一次心跳相同 | 进程内存 |
| 冷却与退避 | 跳过这个分区，继续看轮转表里的下一个 | 距该分区上次运行的心跳数小于 `cooldown_ticks`，或 `backoff_until` 还没到 | 冷却计数在进程内存；退避时间在分区状态文件 |
| 前台活跃度 | 不在同一次心跳里追加运行分区 | 活跃会话超过一个 | 会话管理器的实时计数 |

**重入与停机。**`createMetaSession (Wgt)` 用自己的 processing 与 stopRequested 两个标志判断，任一为真就记 "[meta-session] skipping tick" 并返回。这两个标志与 `main` 里维护用的重入标志互相独立（confirmed）。

**活动指纹。**指纹有四个分量：memory 下 fragments、entities、topics 三个目录里最新的修改时间（递归取目录和文件 mtime 的最大值），以及 `readLatestExternalEventId (Bgt)` 在最新一天的事件日志文件里从后往前找到的第一条外部事件的 id。"外部"指事件的 `source.kind` 不属于 `cadence`、`meta`、`system`、`runner`、`route`、`gateway` 这六个内部来源，所以渠道消息、job 事件（来源 `job`）和配置变更事件（来源 `rpc`）都算外部活动。四个分量以冒号拼接，由 `hashActivityFingerprint (qgt)` 取 sha256 的前 16 个十六进制字符；与上一次心跳的值相同就跳过整次心跳（confirmed）。

由这四个分量可以直接推出四点，都已对照代码确认。第一，记忆板文件 `memory/CLAUDE.md` 不在这三个目录里，只改记忆板不改变指纹。第二，收件箱和轮转表也不在指纹里：运行时新投递的任务单本身不会让下一次心跳通过这项检查，它要等到下一条外部事件、下一次记忆目录写入或 daemon 重启。第三，上一次的指纹只存在进程内存，daemon 重启后的第一次心跳总能通过；一次心跳出错时指纹被清空，下一次也能通过。第四，心跳计数在指纹检查之前加一，被指纹跳过的心跳也计入冷却。

**冷却与退避。**选择函数按轮转表顺序看每个未勾选的分区：分区已被删除或 `schedule.enabled` 为假时，返回它以便勾掉并继续；`backoff_until` 未到时跳过；否则比较心跳计数：该分区上次运行时的心跳计数为空，或当前心跳计数与它的差不小于 `cooldown_ticks` 时才选中。上次运行时的心跳计数只记在进程内存里，所以重启后所有分区都不在冷却中（confirmed）。一个分区在冷却中不妨碍轮转表里排在它后面的分区先运行。

退避时间由 `computePartitionBackoffUntil (b6)` 在每次运行后计算，单位是心跳周期（`main` 把周期传给引擎）：

- 成功或 `invalid_output`：不退避；
- 超时：连续失败次数不超过 2 时不退避，否则推迟 `min(次数 × 周期, 2 小时)`；
- 报错：连续失败次数不超过 1 时不退避，否则推迟 `min(2 × 次数 × 周期, 4 小时)`。

连续失败次数把超时、报错和 `invalid_output` 合在一起累计，成功时清零；所以 `invalid_output` 本身不推迟下次运行，但会让之后的超时或报错更早进入退避。按默认周期计算，第三次连续超时推迟约 111 分钟，第二次连续报错推迟约 148 分钟（confirmed）。每个分区的状态文件是 `~/.aladuo/var/meta/partitions/<分区名>.json`，字段为 `last_started_at`、`last_finished_at`、`last_result`、`consecutive_failures`、`backoff_until`，由 `readPartitionRunState (jf)` 与 `writePartitionRunState (y6)` 读写，重启后仍然有效（confirmed）。

**前台活跃度。**第一个分区的运行不看前台是否忙。只有第一次选择选中了一个分区（包括因引擎不可用而记为报错、实际没有运行的情况）、`maxPartitionsPerIdleTick` 大于 1、且会话管理器报告的活跃会话不超过一个时，引擎才在同一次心跳里继续选下一个分区，最多到 `maxPartitionsPerIdleTick` 个；`main` 没有传这个参数，默认值是 2（confirmed）。追加运行的分区使用同一个心跳计数。会话管理器的活跃数是渠道池与 job 池活动数之和，分区会话本身不占这两个池（第 8.3 节）。

### 11.3 分区会话与轮转表

一个分区就是内核 `subconscious/` 下的一个目录，一次分区运行是一个不保存历史的一次性引擎会话，运行顺序由纯文本文件 `subconscious/playlist.md` 决定。

**分区的定义。**`loadSubconsciousPartitions (Bw)` 把 `subconscious/` 下每个含 `CLAUDE.md` 的子目录当作一个分区，名为 `inbox` 的目录除外，结果按名字排序。`parsePartitionDefinition (Xut)` 读 frontmatter：`schedule` 的三个字段缺省时取 `enabled: true`、`cooldown_ticks: 1`、`max_duration_ms: 60000`（常量在 `initSubconsciousPlaylistModule`）；`runtime` 必须是四个引擎名之一，其他值记一条日志后改用全局默认引擎；此外还读 `claude.tools`、`prompt_mode`（只在 Grok 分区生成系统提示时使用，见下文第 4 步）、`model`、`effort`，`model` 与 `effort` 不合法时记日志并忽略；frontmatter 之后的正文就是分区提示词。frontmatter 解析失败的分区不被加载（confirmed）。出厂的四个分区都在 frontmatter 里覆盖了调度默认值，都没有写 `runtime`，所以运行在全局默认引擎上：

| 分区 | cooldown_ticks | max_duration_ms | contract.consumes |
|---|---|---|---|
| gradient-distiller | 5 | 2100000（35 分钟） | scan-gap.v2 |
| intuition-weaver | 5 | 2100000（35 分钟） | fold-gap.v1、entity-converge.v1、merge.v1、orphan-islands.v1、orphan-newborn.v1、claude-compress.v1、claude-lint.v1、claude-flatten.v1、activation-report.v1 |
| pattern-tracker | 7 | 900000（15 分钟） | node-converge.v1、revise.v1、orphan-newborn.v1 |
| memory-committer | 3 | 1800000（30 分钟） | 无 `contract:` |

**轮转表。**`parsePlaylistCurrentRound (Qut)` 只解析 `## Current Round` 一节，`- [ ] <分区名>` 表示未运行，`- [x] <分区名>` 表示已运行，遇到下一个 `## ` 标题就停。每次分区运行结束（包括因引擎不可用而没有运行），`markPlaylistItemExecuted (H$)` 把该分区的第一个未勾选行勾上，并在 `## History` 下插入一行 `- <ISO 时间> executed=<分区名>`。当前一轮全部勾完、为空或文件不存在时，引擎用所有 `schedule.enabled` 为真的分区按名字顺序重建一轮；没有启用的分区时记一条 "all partitions are disabled, meta-session will idle" 并且不运行（confirmed）。选中的分区若已被删除或停用，引擎把它勾掉后接着选下一个；如果勾掉之后未勾选的数量没有减少，就记 "stale playlist item did not advance" 并结束这次选择，避免死循环。轮转表是普通文本文件，后台分区总纲写明任何人包括分区自己都可以编辑它（提示词原文，`subconscious/CLAUDE.md`）。

**一次分区运行。**`createMetaSession (Wgt)` 的执行函数按以下顺序工作（confirmed，另注的除外）：

1. 选引擎：frontmatter 的 `runtime`，缺省时用 `resolveDefaultRuntime (Co)`；模型与推理力度先取 frontmatter 的 `model`、`effort`，缺省时只取全局层 `config/runtime.md` 里该引擎的设置，不经过渠道种类层和实例层（`S.model ?? Ie.runtimeModels?.[W]?.model`（`createMetaSession`）；分层规则见第 3.4 节，全局层文件见第 9.3 节）。
2. 检查引擎可用：Claude 的可用性探测结果为不可用（`claudeUnavailableReason (Yv)` 给出原因）、Codex 或 Grok 的探测失败、pi 没有配置模型时，写一条 `agent.error`（`stage: "partition_execution"`，`outcome: "runtime_unavailable"`），勾掉轮转表项，按"报错"累计失败并计算退避，不改用其他引擎（第 3.3 节）。
3. 拼提示词：分区正文、一段 `### Partition`（名字、工作目录、收件箱路径、引擎）、`renderPartitionRuntimeContext (Vgt)` 生成的运行上下文（当前时间、活跃会话数、内核与运行时数据的绝对路径，以及一行 `Spine CLI: <cli 入口> spine` 调用前缀），收件箱非空时再加任务单列表（见下文"收件箱"）。这段文本作为用户消息发给引擎，不经过第 2 节的六层系统提示装配。
4. 定系统提示，按引擎不同：Grok 分区另用 `channel_kind: "meta"` 与分区的 `prompt_mode`（缺省 append）调一次 `buildSystemPromptForChannelConfig (Jh)`；Claude 分区不传系统提示，由 `createAgentSdkAdapter (Ef)` 按 2.4 所述的环境变量规则补上，身份提示与两个环境变量都为空时不设系统提示，由 SDK 用自己的缺省（身份提示的定位方式见 2.1）；Codex 分区的适配器创建时只带沙箱、临时会话和动态工具三项参数，不带会话配置，所以没有 base instructions，developer instructions 只有一段列出动态工具名的提醒；pi 分区的系统提示未核对。
5. 调用引擎：工作目录是分区目录，`persistSession: !1`（不保存会话历史）。运行参数里的 `settingSources`（user 与 project）、`additionalDirectories`（只有 memory 目录）、关闭其中 `CLAUDE.md` 的自动加载、`holdInputOpenForBackgroundAgents: !0`（含义见第 7.6 节）这四项只由 Claude 适配器读取：Claude 分区因此只拿到记忆板的路径，需要时自己读；Codex 与 Grok 适配器不读这四项，记忆目录也不会作为额外目录交给它们。工具面见 11.4。自操作工具在 Claude 分区经名为 aladuo 的 MCP 服务器提供，在 Grok 分区经适配器的 `mcpServerFactory` 提供，在 Codex 分区是 `buildCodexDynamicTools (wA)` 生成的 aladuo 命名空间动态工具；这三种引擎的会话来源都是 `meta`，pi 分区传给 pi 进程的会话上下文是 `session_context_kind: "system"`，两种来源拿到的工具见第 4 节。
6. 限时：`Math.max(1, S.schedule.max_duration_ms)`（`createMetaSession`）毫秒后中止本次调用（AbortController），结果记为 `timeout`，此后的工具事件不再写入事件日志，流也不再转发；调用若在超时后以错误结束，只记一条 "late sdk completion after timeout" 日志，若正常返回则结果被丢弃。
7. 判定结果：四个取值 `success`、`invalid_output`、`timeout`、`error`。输出去掉首尾空白后为空时按 `(no output)` 处理，gradient-distiller 与 intuition-weaver 两个分区的空输出判为 `invalid_output`（`detectEmptyRequiredPartitionOutput (zgt)`；这两个分区名定义在没有真名的模块初始化器里，名单本身属未证实推测）。
8. 记录：每个工具调用和工具结果各写一条 `agent.tool_use`、`agent.tool_result` 事件，来源 `{kind: "meta", name: "subconscious:<分区名>"}`；成功时写一条 `agent.result`（`tick_type: "subconscious"`，含分区名和引擎），其他结果写一条 `agent.error`（`stage: "partition_execution"`，含 `outcome` 和输出的前 400 个字符），并把名为 `meta_session` 的消费进度推进到这条事件；另用 `appendDrainRecord (Qd)` 写一条用量记录，会话键是 `meta:subconscious:<分区名>`，所以后台每次运行的开销都记在具体分区名下，并可经控制面方法 `usage.get` 按这个会话键查询；最后更新分区状态文件（11.2）。

引擎的整体状态写在 daemon 状态文件的 `health.meta_session` 字段，并经 `system.status` 的 `health` 一项对外报告：启动订阅时和每次心跳通过指纹检查后写 `starting`，一次心跳正常结束写 `ok`，心跳内抛出异常时写 `down`，同时清空指纹并追加一条 `stage: "tick"` 的 `agent.error`（confirmed）。

后台分区总纲 `subconscious/CLAUDE.md` 不在上面拼出的文本里。Claude 分区以分区目录为工作目录并启用 project 设置来源，Claude Code 按自身规则从工作目录向上加载各级 `CLAUDE.md`，总纲应当经这条路径进入会话，分区自己的 `CLAUDE.md` 也可能因此被再加载一次（未证实推测：加载规则属于 Claude Code，不在 bundle 内，未在运行中的实例上核对；Codex、Grok、pi 分区是否读到总纲同样未核对）。出厂分区的工具面里没有 `Agent`，按第 7.6 节的登记规则，默认安装下 Claude 分区会话不产生需要等待的后台任务，第 5 步的 `holdInputOpenForBackgroundAgents` 实际不改变行为（未证实推测：由两处代码推出，未实测）。

**收件箱。**运行时投递任务单的目录是 `~/.aladuo/var/subconscious/<分区名>/inbox/`（`partitionInboxDirFromVar (Rc)`）。运行时只读取其中不以点开头的 `.pending` 与 `.json` 文件，按修改时间从旧到新排列，逐个把文件名和内容列进提示词；提示词要求分区处理完一项就删除对应文件作为确认（`renderPartitionInboxSection (Hgt)`）。内核里的 `subconscious/inbox/` 是出厂时带的空目录：分区发现时被排除，被内核 `.gitignore` 忽略，运行时从不往里投递。运行时目录下的 `var/cadence/` 在初始化时创建，但 bundle 中没有代码读写它（confirmed）。

### 11.4 契约过滤与分区工具白名单

后台分区能收到哪些运行时任务单、能调用哪些引擎内置工具、能否经自操作工具创建 job，这三件事由代码判定；分区可以改什么、不能碰什么，其余边界都写在后台分区总纲里，只靠模型遵守。

**契约过滤。**契约是分区 `CLAUDE.md` frontmatter 里的 `contract:` 段，声明分区名和它消费的信号类型。`readPartitionContract (Jw)` 同步读取并返回五种状态之一：`partition-absent`（目录或文件不存在）、`parse-fail`（文件读不出、YAML 解析失败、`contract` 不是映射、`partition` 不是字符串或 `consumes` 不是字符串数组）、`no-contract`、`self-id-mismatch`（`contract.partition` 与目录名不同）、`valid`；`consumes` 里没有写版本后缀的项被补成 `.v1`，同时读出 `schedule.enabled`（缺省为真）。`enforceContractGate (iO)` 用这个结果裁决一条信号能否投递：返回 `null` 表示放行，否则返回六个拒绝原因之一，即 `partition-absent`、`self-id-mismatch`、`partition-disabled`、`kind-not-consumed`、`no-contract`、`parse-fail`；最后两个在第三个参数 flagFallback 为真时放行，这个参数就是 `ALADUO_EXP_MEMORY_CHECK` 开关（confirmed）。同一次记忆检查里每个分区的契约只解析一次，结果按分区缓存。

契约过滤只管运行时自己产出的记忆信号，用在四处：逐条投递任务单、清理不再可投递的旧任务单、判断整次记忆检查是否值得运行、判断孤儿节点能否被遗忘（confirmed，四个调用点见证据表）；这四处的行为见第 12.2、12.3 节。它不限制分区会话读写哪些文件。同一个契约状态还被分区退休用来确认目录是官方分区（11.5）。

**分区工具白名单。**分区会话的内置工具面是 `PARTITION_CORE_TOOLS (mB)` 的六个工具 `Bash`、`Read`、`Write`、`Edit`、`Grep`、`Glob`，加上 frontmatter `claude.tools` 显式追加的项，去重后作为运行参数 `tools` 传给引擎适配器。Claude 适配器 `createAgentSdkAdapter (Ef)` 把它原样设为 SDK 的内置工具面，不在列表里的内置工具在会话里不存在：Claude 引擎的核心工具表有十五个工具，分区工具面少了其中的 `Agent`、`TaskStop`、`Skill`、`ToolSearch`、`SendMessage` 与四个 Task 工具，`WebFetch`、`WebSearch` 也不在内（confirmed；渠道与 job 会话的工具面见第 3.7 节）。这道白名单只在 Claude 引擎上起作用：Codex 与 Grok 的适配器都不读取 `tools` 字段，Codex 的内置工具不能被禁用，Grok 适配器只使用自己固定的代理配置和其中的禁用表（confirmed，否定性证据：两个适配器函数体内没有对运行参数 `tools` 的读取）；pi 适配器收到 `tools` 时只记一条日志并忽略（未证实推测：代码位于尚无真名的 pi 适配器工厂内，无法按名引用）。各引擎权限面的完整对比见第 3.7 节。

**自操作工具层不给 ManageJob。**Claude 与 Grok 分区经 `createAladuoMcpServer (Yg)`、Codex 分区经 `buildCodexDynamicTools (wA)` 拿到自操作工具，这两个函数都不给来源为 `meta` 或 `system` 的会话提供 ManageJob，所以分区会话不能经自操作工具创建 job（confirmed）。这不等于分区无法创建 job：控制面的 `job.create` 方法在 unix socket 上可用（第 6.1 节），分区会话有 `Bash`，以 daemon 的同一操作系统用户运行，技术上可以调用它（未证实推测：未实测分区会话调用控制面）。

**提示词里的边界。**后台分区总纲（`subconscious/CLAUDE.md`，出厂文件，提示词原文）允许分区修改自己的 `CLAUDE.md`、新建分区目录、修改 `playlist.md` 和记忆板；禁止触碰事件日志数据、锁文件、收件箱目录（唯一允许的操作是删除自己收件箱里已处理的任务单）、job 调度（反复出现的需求写进最终报告，不建 job）、其他分区的 `CLAUDE.md`（跨分区的需求写进最终报告），以及任何分区的 `contract:` frontmatter。同一份总纲的 Large File Guard 规定：事件日志分区文件只能用 shell `grep -l` 定位是哪一天，内容必须经 `duoduo spine` 的 `cat` 或 `show` 子命令读取，不许用 `Read`、`Grep` 工具打开 `.jsonl`，也不许在 shell 里分页读原始文件。这些规定里，只有"不建 job"在自操作工具层有上一段的代码对应，其余都没有代码检查。分区会话没有指定权限模式，Claude 适配器缺省使用 `bypassPermissions`（可用 `ALADUO_PERMISSION_MODE` 改），会话里有 `Bash`、`Write`、`Edit`，就能写操作系统用户有权限的任何路径（confirmed，否定性证据：运行时不校验分区会话的写入路径）；Codex 会话的沙箱设置见第 3.7 节。

### 11.5 出厂初始化、.gitignore 与分区退休

daemon 每次启动都由 `initializeRuntime (Rdt)` 做一遍初始化，重复执行结果相同：内核目录为空时复制全部出厂文件，内核已有内容时只补缺失文件，不覆盖已存在的文件；另外三处每次启动都会执行：覆盖刷新 `DUODUO.md`，给内核 `.gitignore` 补上缺失的模板条目（没有缺失时不写），对退休名单中仍启用的分区关闭调度（每个分区至多一次）。

**初始化顺序。**初始化函数依次：把旧格式的会话注册目录 `var/registry/sessions/` 补写进各会话状态文件后归档（`archiveLegacyRegistrySessionsDir (iSe)`）；创建运行时目录（包括 `var/cadence/`），把 `run/` 目录权限设为 0700；迁移旧格式的 job 会话键；从出厂目录复制文件到内核；把出厂目录 `var/` 下（含顶层和各级子目录）的每个 `DUODUO.md` 复制到 `~/.aladuo/var/` 的对应位置（每次覆盖；刷新函数没有真名，这一点属未证实推测）；创建 memory 与 subconscious 的各级目录、分区状态目录和内核的 `.claude/` 目录；轮转表与记忆板不存在时分别写入空模板和空文件；退休分区；确保内核是 git 仓库并同步 `.gitignore`；为每个分区编译 Codex 子代理定义；最后在 daemon 状态文件不存在时写入初始状态（confirmed，顺序见 `await Edt(e, t), await xdt(e)`（`initializeRuntime`）所在的调用链）。复制、刷新、git 三步的函数体尚无真名，本节只能引用它们在 `initializeRuntime` 里的调用点。

**只补缺失。**出厂目录默认是 npm 包内的 `bootstrap/`，可用 `ALADUO_BOOTSTRAP_DIR` 改；内核目录与出厂目录是同一路径时不复制。复制时跳过 `var/` 目录以及 `meta-prompt.md`、`dashboard.html` 两个文件：面板页面每次从出厂目录读取，身份提示按第 2 节的规则经环境变量定位，两者都不进内核。内核目录为空时整棵复制；内核已有内容时递归复制，目标文件已存在就跳过。因此 npm 升级不会覆盖内核里已有的分区提示词、记忆板或配置，上游对分区提示词的修改需要人工执行 `skills/duoduo-runtime-admin` 技能里的 subconscious-refresh 流程才能进入内核（只补缺失、升级不覆盖内核已有文件 confirmed：上游技能 `skills/duoduo-runtime-admin/SKILL.md` 原文写明 install merges missing files only；复制函数本身没有真名，其中的排除名单、同一路径时不复制、空内核整棵复制，以及只有 `NODE_ENV=development` 时 memory、config 以外的目录和顶层文件被覆盖复制，都是在 pretty bundle 读到的，属未证实推测）。

**.gitignore。**内核目录不是某个 git 仓库的顶层时，初始化执行 `git init`，写入 `.gitignore` 模板，`git add .` 后以 "memory: genesis" 为说明提交第一个 commit；已经是仓库时，把模板中非注释、非空的行里 `.gitignore` 还没有的逐行追加到末尾，不删除、不改动已有的行，没有要追加的行时不写文件。模板的条目是 `memory/state/`、`memory/fragments/`、`memory/effectiveness/`、`subconscious/inbox/`、`.claude/`、`*.tmp`、`CLAUDE.local.md`、`config/runtime.md`，第一行注释是 "# Runtime state (not part of cognitive evolution)"，`config/runtime.md` 前另有一行注释说明模型配置可能含有凭据形态的值（调用点 confirmed：`await Uwe(e.kernelDir)`（`initializeRuntime`）；git 初始化函数与存放模板的模块初始化器没有真名，模板条目、genesis 提交与逐行追加的规则是在 pretty bundle 读到的，属未证实推测）。

**Codex 子代理定义。**`generatePartitionCodexAgents (gdt)` 把分区目录下 `.claude/agents/*.md` 编译成 `.codex/agents/<名字>.toml`：内容不变时跳过，源文件已不存在时删除对应的 `.toml`。出厂的四个分区目录只含 `CLAUDE.md`，默认安装下这一步不产生文件（confirmed）。

**分区退休。**`initPartitionRetirementModule (Kwe)` 的常量列出两个出厂目录中没有的分区名，用于关闭旧安装里残留的同名分区：`memory-weaver`（要求仍持有有效契约）与 `cadence-executor`（要求仍没有契约）。名单上的每一条都交给 `retirePartitionOnce (fdt)`，它依次检查（confirmed）：

1. 目录不存在，跳过；
2. frontmatter 读不出，记告警并跳过（`unreadable`）；
3. 契约状态与上面的要求不符，判定这个同名目录已被用户改作他用，不做任何修改（`not-self-identified`）；
4. `~/.aladuo/var/meta/partitions/<分区名>.retired` 标记已存在，跳过；若用户事后又把它启用，只记一条说明"退休只执行一次"的日志；
5. `schedule.enabled` 不是 `true`，跳过，也不写标记。

全部通过后写入标记文件（内容是包版本和退休时间），再把该分区 `CLAUDE.md` 的 `schedule.enabled` 改为 `false`，正文保持不变。退休不删除分区目录，也不动 git 历史；手工把 `enabled` 改回 `true` 后运行时不会再改第二次。退休的 `memory-weaver` 仍在记忆信号的候选分区列表里，但没有任何检查步以它为目标；退休后它的契约状态带着 `enabled: false`，在判断整次记忆检查是否值得运行时也不算消费者（第 12.2 节）。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 心跳周期默认 2,220,000 毫秒，环境变量可改，非整数或小于 1000 时告警并用默认值 | `C0e("ALADUO_CADENCE_INTERVAL_MS", 222e4, 1e3)`（`main`）；`"[pid0] invalid env integer, using fallback"`（`readEnvIntegerOrFallback`） | confirmed |
| 定时器回调先广播 `cadence.tick`，再检查维护的重入标志 | `h.emit("cadence.tick"), W`（`main`）；`"[pid0] cadence tick skipped: still processing previous tick"`（`main`） | confirmed |
| `cadence.tick` 有两个订阅者：后台分区引擎与出站投递管理器 | `n.on("cadence.tick", x)`（`createMetaSession`）；`n.on("cadence.tick", c)`（`createOutboxDeliveryManager`） | confirmed |
| 维护四步：记忆检查、清理已归档会话残留、写 `system.cadence_tick`、推进 `jobs` 消费进度并写 `last_tick` | `await t(e, Date.now())`（`runCadenceTick`）；`"[cadence] tombstoned-session housekeeping sweep failed (non-fatal)"`（`runCadenceTick`）；`type: "system.cadence_tick"`（`runCadenceTick`）；`await Nu(e, "jobs", n.id, new Date(n.ts))`（`runCadenceTick`）；`last_tick: n.ts`（`runCadenceTick`） | confirmed |
| 清理只删已归档会话中非 pending 的出站记录与重放日志 | `s.status !== "pending" && Ks(e, s.session_key)`（`sweepTombstonedSessionRecords`） | confirmed |
| `system.status` 报告心跳、轮转表当前一轮与记忆检查状态；报告的周期不经下限校验 | `last_tick: k?.cadence?.last_tick ?? null`（`createDaemon`）；`done: ue.done`（`createDaemon`）；`memory_check: J6(u)`（`createDaemon`）；`parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) \|\| 222e4`（`createDaemon`） | confirmed |
| 引擎自带重入与停机检查，独立于 `main` 的标志 | `"[meta-session] skipping tick"`（`createMetaSession`） | confirmed |
| 活动指纹由三个记忆目录的最新 mtime 与最新外部事件 id 组成，不含记忆板、收件箱与轮转表，不变则跳过整次心跳 | `Promise.all([FA(t.memoryFragmentsDir), FA(t.memoryEntitiesDir), FA(t.memoryTopicsDir), Bgt(t)])`（`createMetaSession`）；`"[meta-session] activity gate: skipping tick (fingerprint unchanged)"`（`createMetaSession`） | confirmed |
| 外部事件指来源不属六个内部来源的事件，只查最新一天的日志文件 | `eO = new Set(["cadence", "meta", "system", "runner", "route", "gateway"])`（`initGapSpanModule`）；`o && !eO.has(o) && typeof i.id == "string"`（`readLatestExternalEventId`） | confirmed |
| 指纹取 sha256 前 16 个十六进制字符，出错时清空 | `digest("hex").slice(0, 16)`（`hashActivityFingerprint`）；`Le("[meta-session] tick error:", S), y = null`（`createMetaSession`） | confirmed |
| 冷却按进程内的心跳计数判断，退避中的分区被跳过 | `isPartitionBackedOff (_6)`；`Math.max(0, k.schedule.cooldown_ticks)`（`createMetaSession`） | confirmed |
| 退避：成功与 invalid_output 不退避；超时第三次起、报错第二次起按心跳周期线性推迟，上限 2 小时和 4 小时 | `computePartitionBackoffUntil (b6)`；`if (t <= 2) return null`（`computePartitionBackoffUntil`）；`Math.min(t * 2 * i, ilt)`（`computePartitionBackoffUntil`）；`rlt = 72e5, ilt = 144e5, bg = 222e4`（`initPartitionRunStateModule`） | confirmed |
| 连续失败次数合计所有非成功结果，成功清零；引擎把心跳周期传给退避计算 | `De = A === "success" ? 0 : Je.consecutive_failures + 1`（`createMetaSession`）；`f = e.cadenceIntervalMs ?? bg`（`createMetaSession`） | confirmed |
| 分区状态文件放在运行时目录 `var/meta/partitions/`，五个字段 | `vt.join(N, "partitions")`（`resolveRuntimePaths`）；`consecutive_failures: 0`（`initPartitionRunStateModule`）；`writePartitionRunState (y6)` | confirmed |
| 同一次心跳追加运行分区的条件：第一次选择选中了分区（引擎不可用时也返回分区名）、活跃会话不超过一个、默认最多两个 | `r.activeCount() <= 1`（`createMetaSession`）；`d = e.maxPartitionsPerIdleTick ?? 2`（`createMetaSession`）；`"[meta-session] partition skipped: requested runtime unavailable"`（`createMetaSession`） | confirmed |
| 分区是 `subconscious/` 下含 `CLAUDE.md` 的目录，`inbox` 除外，按名字排序 | `i.isDirectory() && !g6.has(i.name)`（`loadSubconsciousPartitions`）；`g6 = new Set(["inbox"])`（`initSubconsciousPlaylistModule`） | confirmed |
| frontmatter 的 schedule 默认值与可读字段；非法 runtime 回到全局默认引擎，非法 model、effort 被忽略 | `max_duration_ms: 6e4`（`initSubconsciousPlaylistModule`）；`has invalid runtime frontmatter; falling back to global default`（`parsePartitionDefinition`）；`has invalid effort frontmatter; ignoring it`（`parsePartitionDefinition`）；`isSupportedRuntime (Aa)` | confirmed |
| 出厂四个分区的调度参数与 consumes，均未指定 runtime | — | confirmed（提示词原文：`subconscious/gradient-distiller/CLAUDE.md` 等四个文件的 frontmatter，与包内 `bootstrap/subconscious/` 逐字节一致） |
| 轮转表只解析 `## Current Round`，运行后勾选并写 History，整轮完成后用启用的分区重建 | `rebuildPlaylistRound (ave)`；`i.trim() === "## Current Round"`（`parsePlaylistCurrentRound`）；`executed=${t}`（`markPlaylistItemExecuted`）；`"[playlist] all partitions are disabled, meta-session will idle"`（`rebuildPlaylistRound`） | confirmed |
| 停用或已删除的轮转表项被勾掉后继续选择，勾不掉时停止 | `"[meta-session] stale playlist item did not advance"`（`createMetaSession`） | confirmed |
| 引擎选择与模型、力度的回退顺序：frontmatter 优先，其次只读全局层 | `resolveDefaultRuntime (Co)`；`requestedRuntime: V ?? null`（`createMetaSession`）；`M = S.effort ?? Ie.runtimeEfforts?.[W]?.effort`（`createMetaSession`） | confirmed |
| 引擎不可用时写 `runtime_unavailable` 错误、按报错退避，不换引擎 | `if (W === "claude" && !i && ue) return await j(ue)`（`createMetaSession`）；`outcome: "runtime_unavailable"`（`createMetaSession`）；`pi partition has no model`（`createMetaSession`） | confirmed |
| 提示词由正文、`### Partition` 块、运行上下文和收件箱四段组成，作为用户消息发送 | `### Partition`（`createMetaSession`）；`prompt: W === "pi" ? P : _C(P)`（`createMetaSession`） | confirmed |
| 系统提示按引擎分：Grok 另生成并使用 `prompt_mode`；Claude 不传、由适配器按环境变量补预设与身份提示；Codex 适配器不带会话配置，developer instructions 只是列出动态工具名的提醒 | `prompt_mode: S.prompt_mode ?? "append"`（`createMetaSession`）；`preset: "claude_code"`（`createAgentSdkAdapter`）；`a = e.codexAdapterFactory ?? (() => yw({`（`createMetaSession`）；`y && (H.developerInstructions = y)`（`createCodexAppServerAdapter`）；`"<duoduo-reminder>"`（`buildDeveloperInstructions`） | confirmed（pi 分区的系统提示未核对） |
| 运行上下文列出时间、活跃会话数、各类绝对路径与 Spine CLI 前缀 | `Spine CLI: ${e.cliEntryPath} spine`（`renderPartitionRuntimeContext`）；`"### Key Paths"`（`renderPartitionRuntimeContext`） | confirmed |
| 分区会话不保存历史；设置来源、额外目录、关闭额外目录 `CLAUDE.md` 自动加载与保持输入通道四项只由 Claude 适配器读取；pi 分区的会话上下文为 system | `persistSession: !1`（`createMetaSession`）；`settingSources: ["user", "project"]`（`createMetaSession`）；`additionalDirectories: [t.memoryDir]`（`createMetaSession`）；`t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories)`（`createAgentSdkAdapter`）；`CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`（`createAgentSdkAdapter`）；`session_context_kind: "system"`（`createMetaSession`） | confirmed（否定性证据：`createCodexAppServerAdapter` 与 `createGrokAcpAdapter` 体内没有 `settingSources`、`additionalDirectories`、`autoloadAdditionalDirectoryClaudeMd`、`holdInputOpenForBackgroundAgents`） |
| 自操作工具的提供方式按引擎分：Claude 经 `mcpServers`，Grok 经 `mcpServerFactory`，Codex 经 aladuo 命名空间的动态工具 | `mcpServerFactory: () => Yg(t, {`（`createMetaSession`）；`dynamicTools: wA({`（`createMetaSession`）；`u$ = "aladuo"`（`ALADUO_TOOL_NAMESPACE`） | confirmed |
| 超时中止，此后不再写工具事件；迟到的错误只记日志，迟到的正常结果被丢弃 | `ee = Math.max(1, S.schedule.max_duration_ms)`（`createMetaSession`）；`U \|\| (Cn.type === "tool_use"`（`createMetaSession`）；`"[meta-session] late sdk completion after timeout"`（`createMetaSession`） | confirmed |
| 两个分区的空输出判为 invalid_output | `"(no output)"`（`detectEmptyRequiredPartitionOutput`）；`A = zgt(S.name, ke) ? "invalid_output" : "success"`（`createMetaSession`） | confirmed（空输出按分区判定为 invalid_output）；分区集合是 gradient-distiller 与 intuition-weaver 为未证实推测（定义在没有真名的模块初始化器里） |
| 工具调用、结果与最终结果写入事件日志并推进 `meta_session` 消费进度，用量记录按 `meta:subconscious:<分区名>` 记账，可经 `usage.get` 按会话键查询 | `Ugt(t, o, S.name, Cn)`（`createMetaSession`）；`tick_type: "subconscious"`（`createMetaSession`）；`output_preview: F?.text?.slice(0, 400)`（`createMetaSession`）；`Nu(t, "meta_session", qe.id`（`createMetaSession`）；`${o}:${S.name}`（`createMetaSession`）；`S.method === "usage.get"`（`createDaemon`）；`readDrainRecords (Vm)` | confirmed |
| 引擎在状态文件里记录 starting、ok、down，经 `system.status` 报告；心跳异常时写 `stage: "tick"` 错误 | `meta_session: "starting"`（`createMetaSession`）；`meta_session: "down"`（`createMetaSession`）；`stage: "tick"`（`createMetaSession`）；`meta_session: k?.health?.meta_session ?? "down"`（`createDaemon`） | confirmed |
| 后台分区总纲经 Claude Code 的 `CLAUDE.md` 加载进入 Claude 分区会话 | — | 未证实推测（加载规则在 Claude Code 内，bundle 只传 `settingSources`；未在运行中的实例上核对） |
| 运行时收件箱位于 `var/subconscious/<分区名>/inbox/`，任务单从旧到新列出，处理完删除即确认 | `"subconscious", t, "inbox"`（`partitionInboxDirFromVar`）；`"Messages addressed to this partition, oldest first. After processing each item, delete the corresponding file from this inbox directory to ack it."`（`renderPartitionInboxSection`） | confirmed |
| `var/cadence/` 只在初始化时创建 | `e.cadenceDir`（`initializeRuntime`） | confirmed（否定性证据：bundle 中 `cadenceDir` 只出现在路径解析与这一处创建） |
| 契约解析的五种状态，未写版本的 consumes 补 `.v1` | `state: "self-id-mismatch"`（`readPartitionContract`）；`normalizeSignalKindVersion (hve)`；`/\.v\d+$/.test(t)`（`normalizeSignalKindVersion`） | confirmed |
| 契约过滤的六个拒绝原因，无契约与解析失败在 flagFallback 为真时放行 | `return t.consumes.has(e) ? null : "kind-not-consumed"`（`enforceContractGate`）；`return n ? null : "no-contract"`（`enforceContractGate`） | confirmed |
| 同一次检查内按分区缓存契约 | `getCachedPartitionContract (nO)`；`e.contracts.set(t, n)`（`getCachedPartitionContract`） | confirmed |
| 契约过滤的四个调用点：投递、收件箱清理、是否运行检查、能否遗忘 | `let s = iO(r.kind, nO(t, r.partition), t.flagFallback)`（`postMemorySignalsToInboxes`）；`iO(o.kind, nO(n, o.partition), n.flagFallback) !== null`（`reconcileMemorySignalInboxes`）；`t.some(i => iO(i, r, e.flagFallback) === null)`（`hasAnyMemorySignalConsumer`）；`iO(Un.ORPHAN_NEWBORN, nO(e, t), e.flagFallback) === null`（`isOrphanWarningDeliverable`） | confirmed |
| 分区工具面是六个核心工具加 `claude.tools`，Claude 适配器把它设为 SDK 内置工具面；Claude 核心工具表有十五项 | `mB = ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]`（`initAgentSdkAdapterModule`）；`[...new Set([...mB, ...S.claudeTools ?? []])]`（`createMetaSession`）；`[claude-sdk] built-in tool surface`（`createAgentSdkAdapter`）；`CLAUDE_CORE_TOOLS (Hh)` | confirmed |
| 白名单只在 Claude 上生效：Codex 内置工具不能禁用；Grok 使用固定的代理配置 | `"[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled"`（`createCodexAppServerAdapter`）；`agentProfile: Qye`（`createGrokAcpAdapter`）；`GROK_DISALLOWED_TOOLS (Xye)` | confirmed（否定性证据：`createCodexAppServerAdapter (yw)` 与 `createGrokAcpAdapter (vw)` 体内没有对运行参数 `tools` 的读取） |
| 分区会话的自操作工具里没有 ManageJob（MCP 服务器与 Codex 动态工具两条路径）；控制面另有 `job.create` | `t.sessionContextKind === "meta" \|\| t.sessionContextKind === "system"`（`createAladuoMcpServer`）；`i = e.sessionContextKind === "meta" \|\| e.sessionContextKind === "system"`（`buildCodexDynamicTools`）；`S.method === "job.create"`（`createDaemon`） | confirmed（分区会话经 socket 调用 `job.create` 为未证实推测） |
| 分区会话缺省以 bypassPermissions 运行 | `t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`createAgentSdkAdapter`） | confirmed（`createMetaSession` 的运行参数里没有 `permissionMode`） |
| 初始化先归档旧会话注册目录，再按固定顺序复制出厂文件、刷新 DUODUO.md、写模板、退休、同步 git 与编译 Codex 子代理；面板页面从出厂目录读取 | `archived legacy var/registry/sessions/`（`archiveLegacyRegistrySessionsDir`）；`oo.join(u.bootstrapDir, "dashboard.html")`（`createDaemon`）；`await Edt(e, t), await xdt(e)`（`initializeRuntime`）；`await dz(e.subconsciousPlaylistPath, vdt), await dz(e.memoryBroadcastPath, wdt), await Gwe(e), await Uwe(e.kernelDir), await Idt(e)`（`initializeRuntime`） | confirmed（调用顺序与面板页面路径）；复制、刷新、git 三个函数与存放 `meta-prompt.md`、`dashboard.html` 排除名单的模块初始化器没有真名，它们的行为为未证实推测，其中"只补缺失"另有上游技能原文支撑 |
| Codex 子代理编译：内容不变跳过，源文件删除时删除生成物 | `la.join(e, ".codex", "agents")`（`generatePartitionCodexAgents`）；`t.removeStale !== !1`（`generatePartitionCodexAgents`） | confirmed |
| 退休名单两条，各带自我识别要求；标记文件扩展名 `.retired` | `name: "memory-weaver"`（`initPartitionRetirementModule`）；`selfId: "contract-absent"`（`initPartitionRetirementModule`）；`ddt = ".retired"`（`initPartitionRetirementModule`） | confirmed |
| 退休逐项检查，只改 `schedule.enabled` 一次，不删目录 | `retireListedPartitions (Gwe)`；`i("not-self-identified")`（`retirePartitionOnce`）；`(the retirement runs once)`（`retirePartitionOnce`）；`return i("not-enabled")`（`retirePartitionOnce`）；`enabled: !1`（`retirePartitionOnce`） | confirmed |
| 分区可改与禁止触碰的范围、大文件读取规则只写在提示词里 | — | confirmed（提示词原文：`subconscious/CLAUDE.md` 的 What I Can Change About Myself 与 Large File Guard 两节） |

## 12 记忆系统

运行时以记忆板 `memory/CLAUDE.md` 为根，沿 `[[slug]]` 链接计算可达性，把 topics 下到达不了的节点判为孤儿。每次心跳的只读检查测量记忆目录，每类信号至多发一张任务单（孤儿新生节点每个一张），只投给契约放行的分区（check 开关打开时，没有契约的分区也放行，见 11.4）。运行时唯一删除记忆文件的动作是默认关闭的遗忘 GC，它用 git rm 删除，只删已提交过且没有本地修改的文件，所以被删的文件都能从 git 历史恢复；默认布局下它自己的提交会失败，删除停在暂存区（12.3）。记忆内容本身由后台分区里的模型修改，出厂分工是 gradient-distiller 写证据碎片，intuition-weaver 改记忆板、效果记录和实体档案。前三点由代码实现，第四点主要由提示词规定，本节依次给出证据。记忆板哈希与指令指纹见第 13 节，心跳如何调用记忆检查见第 11.1 节。

### 12.1 以记忆板为根的可达性

"一条记忆还有没有用"在代码里被表示成一个图可达性问题：从记忆板出发沿 `[[slug]]` 链接能到达的 topics 节点算在用，到达不了的算孤儿。是否可达只由链接决定，不看时间戳和访问次数，也不需要理解内容，所以运行时可以在不调用模型的情况下每次心跳重新计算；修改时间只用来给孤儿区分状态。

**目录。**`resolveMemoryDirs (Ai)` 定义的记忆目录只有五项：memory 根目录、记忆板文件 `CLAUDE.md`、`entities/`（实体档案）、`topics/`（规则节点与主题档案，lesson-、groove- 前缀的是规则节点）、`effectiveness/`（每行记忆的效果记录）。`fragments/`（证据碎片）和 `state/` 由 `resolveRuntimePaths (Yut)` 另外定义，不属于这张图（confirmed）。其中 `state/` 只在初始化时创建，bundle 中没有代码读写它（confirmed，否定性证据：`memoryStateDir` 只出现在路径解析与初始化两处）。

**链接。**`scanWikiLinkOccurrences (Lf)` 是手写的扫描器：遇到 `[[` 后找第一个 `]`，只有紧跟着第二个 `]` 时才算一个链接，空 slug 丢弃；`resolveMemoryLinkTargets (Ff)` 去重并排序（confirmed）。

**可达集。**`walkReachableMemory (Pc)` 以记忆板上的链接为种子做广度优先搜索，直到不再有新 slug；含斜杠、反斜杠、NUL 或等于 `.`、`..` 的 slug 被丢弃。每个 slug 的正文由 `createMemorySlugReader (Tc)` 读出：`topics/<slug>.md` 与 `entities/<slug>.md` 两个文件，只有其中至少一个存在时才追加 `effectiveness/<slug>.md`。所以效果记录里的链接能延伸可达集，但单独一个效果记录不能让它的 slug 成为有正文的节点（confirmed）。

**孤儿与三种状态。**`computeOrphanTopicNodes (Dct)` 只把 `topics/` 下的文件当作候选：在可达集里的保留，其余每个记下修改时间、入度和引用者清单；入度统计 entities 与 topics 文件里指向它的链接（不计自链接，也不计记忆板），引用者清单按字符串匹配列出正文里含有 `[[<slug>]]` 的记忆板与 entities、topics 文件（不含它自己），供 ISLAND 任务单使用（12.2）。memory 目录或记忆板文件不存在时直接返回"缺失"，不产生任何孤儿状态；实体档案从不成为孤儿候选（confirmed）。随后每个孤儿被分成三种状态，判定顺序是 `o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE"`（`detectOrphanMemory`）：

| 状态 | 条件 | 含义 |
|---|---|---|
| ISLAND | 入度至少为 1 | 被别的档案引用，但记忆板到达不了 |
| NEWBORN | 入度为 0，且距修改时间不足 48 小时 | 刚写出来、可能还没来得及接进记忆板 |
| STALE | 入度为 0，且至少 48 小时未修改，或修改时间读不到 | 旧而且没有任何引用 |

48 小时是 `newbornHours` 缺省时的值，常量与小时换算都在 `initOrphanMemoryModule (wwe)`（confirmed）。

### 12.2 只读检查与任务单

`runMemoryCheckTick (qct)` 每次心跳运行一次，它只读 memory 目录，不修改其中任何文件（12.3 的遗忘 GC 除外）；它的产出是写进运行时收件箱 `~/.aladuo/var/subconscious/<分区名>/inbox/` 的 `.pending` 任务单，交给分区会话里的模型处理。任务单正文写明触发条件和要求的动作，多数点名具体的行、文件或事件区间；fold-gap 例外，它不点名任何一行，由 intuition-weaver 自己找过期的行（12.4）。

**开关与前置判断。**`resolveMemoryCheckFlags (W6)` 读两个实验开关：`ALADUO_EXP_MEMORY_CHECK` 为 check，`ALADUO_EXP_MEMORY_FORGET` 只有在 check 也打开时才生效；只设了后者时每次心跳记一条错误日志说明遗忘已被禁用（confirmed）。check 开关不是记忆检查的总开关，它只作为契约过滤的 flagFallback，决定没有契约或契约解析失败的分区能否收到信号（第 11.4 节）。检查开始前，`hasAnyMemorySignalConsumer (jve)` 对候选分区列表（pattern-tracker、gradient-distiller、intuition-weaver、memory-weaver）逐个问契约过滤"十二类信号里有没有任何一类放行"；一个都没有并且遗忘也关着时，整次检查直接返回（confirmed）。所有检查步的目标分区都写死为 pattern-tracker、gradient-distiller、intuition-weaver 三者之一，memory-committer 和已退休的 memory-weaver 不是任何任务单的目标；候选列表只决定两件事：上面这项判断问哪些分区，以及收件箱清理为哪些收件箱维护快照（confirmed）。出厂的三个信号消费分区都带有效契约，所以默认安装下两个开关都关着，检查仍然每次心跳运行并投递任务单，关掉的只是遗忘 GC。两个开关的当前值和每个分区的契约状态经 `system.status` 报告（第 11.1 节）。

**执行顺序。**检查按固定顺序运行各子步，每一步都包在 `runMemoryCheckSubStep (H6)` 的 try/catch 里，一步失败不影响其余各步；外层 `runReadAuditedMemoryCheckStep (ua)` 另外统计这一步有没有遇到读不出（不是"不存在"）的路径。顺序是：`orphan-states` 先算出孤儿状态；契约过滤至少放行一类信号时，再依次运行 board-lint、entity-lint、node-lint、gap-lint、fold-lint、broadcast-budget、broadcast-lint、broadcast-flatten、activation-lint、orphan-newborn-island；这些步全部成功、没有读不出的路径、并且孤儿状态算出来了，才运行最后的 `inbox-sync`；activation-lint 算出的比值非空时写成一条名为 `memory_activation_loss` 的指标记录，追加到运行时目录 `var/telemetry/` 下按日期命名的 jsonl 文件，环境变量 `ALADUO_TELEMETRY_ENABLED` 设为关闭时不写（写入位置与开关为未证实推测：写入函数已读到，但尚无真名，只能引用调用点）；遗忘开关打开时最后运行 `orphan-forget`（12.3）（confirmed）。

**信号类型与目标分区。**十二类信号的名字登记在 `initMemorySignalKindsModule (Vo)` 里，除 `scan-gap.v2` 外都是 `.v1`。目标分区在每个检查的代码里写死，只有 orphan-newborn 由 `routeContractDecision (q6)` 按 slug 前缀二选一（confirmed）：

| 检查步 | 触发条件 | 信号 | 任务单文件名 | 目标分区 |
|---|---|---|---|---|
| board-lint | 记忆板链接到的 topics 节点有效果记录、类型是行为类、仍是 `# Pattern:` 旧格式；变弱且已裁定删除的不发 | revise.v1 | `<slug>.md.pending` | pattern-tracker |
| board-lint | 记忆板链接到的 slug 同时存在于 entities 与 topics，有效果记录且不是领域类 | merge.v1 | `merge-<slug>.md.pending` | intuition-weaver |
| entity-lint | 实体档案缺少 What it is now、Relationship、Open variables 三个小节中的任何一个；按体积与日期戳数量排序 | entity-converge.v1 | `entity-converge-<slug>.md.pending` | intuition-weaver |
| node-lint | lesson-、groove- 节点含 Condition、Procedure 以外的小节（groove 另允许 References），或超过 200 行；记忆板到达不了的另标 WASTED-COMPUTE | node-converge.v1 | `<类型>-<slug>.md.pending` | pattern-tracker |
| gap-lint | 事件日志里还有没交出去的外部事件时间段（见下文） | scan-gap.v2 | `scan-gap.md.pending` | gradient-distiller |
| fold-lint | fragments 下最新文件比 intuition-weaver 上次运行结束的时间新 | fold-gap.v1 | `fold-gap.md.pending` | intuition-weaver |
| broadcast-budget | 记忆板非空行超过 100，或某一行的有效字符超过 200（空白不计，每个 `[[…]]` 按一个字符计）；两个上限可用 `ALADUO_MEMORY_MAX_LINES`、`ALADUO_MEMORY_MAX_LINE_CHARS` 改 | claude-compress.v1 | `claude-compress.md.pending` | intuition-weaver |
| broadcast-lint | 记忆板上某个 `[[slug]]` 在 entities 与 topics 下都没有文件 | claude-lint.v1 | `claude-lint.md.pending` | intuition-weaver |
| broadcast-flatten | 记忆板里有 markdown 标题行（代码围栏内的不算） | claude-flatten.v1 | `claude-flatten.md.pending` | intuition-weaver |
| activation-lint | 记忆板文件存在（每次心跳都生成） | activation-report.v1 | `activation-report.md.pending` | intuition-weaver |
| orphan-newborn-island | 每个 NEWBORN 孤儿各一张 | orphan-newborn.v1 | `orphan-newborn-<slug>.md.pending` | lesson-、groove- 前缀的给 pattern-tracker，其余给 intuition-weaver |
| orphan-newborn-island | 存在 ISLAND 孤儿 | orphan-islands.v1 | `orphan-islands.md.pending` | intuition-weaver |

ISLAND 任务单的正文由 `renderOrphanIslandsBody (jct)` 生成，逐个列出 slug、年龄、入度、activation 窗口内被前台读到的次数（activation-lint 这一步有结果时才有这一列）和引用者清单（12.1），要求分区逐个决定把节点接回记忆板可达的范围，还是确认它已无用并清理引用（confirmed）。

board-lint、entity-lint、node-lint 用常量 `B6 = 1`（`initMemoryCheckTickModule`）作为每类上限，按各自的排序只取最差的一条；其余各类的任务单文件名固定，每类每次心跳至多一张；只有 orphan-newborn 每个节点一张（confirmed）。entity-lint 的日期戳计数只匹配 2026 年的日期写法，其他年份的日期不参与排序（未证实推测：计数函数已读到，但没有真名，无法按名引用）。

activation report 统计一段时间内前台工具调用读到了哪些 entities、topics 文件：它给出记忆板每一行指向的文件被读过几次、在窗口开始前就存在却一次都没被读过的文件数，以及被读过却不在可达集里的文件（最多列 10 个）；前台对记忆目录的写入单独计数，不算作"被读过"（confirmed）。窗口从今天往前逐日读取事件日志，直到累计 30 个含 `channel.message` 事件的日子为止，窗口内没有消息的日子同样计入；"前台工具调用"指来源为 `runner` 的 `agent.tool_use` 事件，"读到"指调用参数里出现该文件的绝对路径（未证实推测：这段计日与匹配逻辑已读到，但位于尚无真名的函数里，本文只能引用它的调用者与常量）。

board-lint 的"已裁定删除"来自效果记录里的判定词，解析函数只在 `updater guidance:` 小节下找 PRESERVE、KEEP、REMOVE、REWRITE、SHARPEN、DROP；而 intuition-weaver 提示词给出的效果记录模板用的小节名是 `Board guidance:`。按出厂模板写出的效果记录，判定词解析结果为空，"变弱且已裁定删除的不发"这条排除不会生效，变弱的旧格式节点仍会收到 revise 任务单（未证实推测：两处文本都已读到，排除条件本身见证据表，但解析函数与它的调用者都没有真名，无法按名引用，也未在运行中的实例上观测到这一后果）。

**scan-gap 的交付方式。**gap-lint 与其他检查不同，它把事件日志切成时间段，每段只交出一次（confirmed，另注的除外）：

1. gradient-distiller 的收件箱里已有 `scan-gap.md.pending` 时什么都不做，所以同一时间最多一张 scan-gap 任务单。
2. 已交出的时间段记在运行时目录的 `var/memory/gap-handed-days.txt`，每行是一整天或 `日期[起,止]` 形式的区间（毫秒精度，UTC）。文件第一次创建时，`memory/fragments/` 下已有的日期目录被当作整天已交出（未证实推测：文件名与读写函数没有真名，只能引用调用点）。
3. `runGapLint (Glt)` 先看今天：今天还没交完、且今天的最新一条外部 `channel.message` 已经过去至少一个心跳周期时，交出从上次交到的位置到这条消息之间的区间。否则从昨天往前找最近一个还有未交区间的日子，交出它最后一段未交区间。
4. 区间里含外部事件的小时由 `mergeContiguousHourRanges (Bve)` 合并成连续的小时段；区间里没有外部事件时不发任务单，但仍把区间记为已交出。任务单真的写进收件箱后同样记为已交出；被契约过滤拒绝时不记，下次心跳重算。
5. 任务单正文由 `renderScanGapSignalBody (Jlt)` 生成：区间、小时段、日志文件路径，以及一段要求按事件逐条判断、写完删除任务单作为确认、没写出碎片也要确认的说明，与 gradient-distiller 提示词里的规定对应（12.4）。

这里的"外部事件"与活动指纹用的是同一个判定：来源不属于 `initGapSpanModule (P6)` 里列出的六个内部来源（第 11.2 节）。

**投递与清理。**`postMemorySignalsToInboxes (rO)` 逐条先过契约过滤（第 11.4 节），被拒的记入 withheld 并附原因；放行的用 `flag: "wx"` 写文件，同名文件已存在时不覆盖，记为 `already-pending`。所以分区没处理掉的任务单不会被重复投递，也不会被新内容覆盖；分区确认删除后，条件仍然成立时下一次心跳会再投一张（confirmed）。daemon 自己的调用从不带 `force` 参数，所以契约过滤与同名检查在自动投递时总是生效。`reconcileMemorySignalInboxes (Mve)` 在每个候选分区的收件箱里维护一份快照文件 `.memory-signals.json`，记录运行时投递过、现在仍可投递的任务单文件名；上一份快照里有、而这次检查已不再产出或契约已不再接收的任务单文件被删除。快照只管运行时投递的文件，`scan-gap.md.pending` 与分区自己放进收件箱的文件都不受影响（confirmed）。由此，只要清理这一步正常运行，收件箱里由运行时投递的任务单就与最近一次检查的选择结果一致：某条节点不再是最差的一条时，它的旧任务单会被撤回，换成新的最差节点（confirmed，由快照更新规则推出）。

### 12.3 遗忘 GC

运行时唯一会删除记忆文件的地方是孤儿遗忘，它受三项条件限制：两个实验开关同时打开，只删 STALE 孤儿，且只删"能收到孤儿新生警告"的节点；删除用 git rm 执行，只删已提交过且没有本地修改的文件，所以被删的文件都能从 git 历史恢复（confirmed）。默认布局下遗忘自己的提交会失败，删除停在暂存区，心跳日志也不报告这次遗忘（未证实推测，见下文"执行"）。

**条件。**`orphan-forget` 只在 forget 开关生效时运行，也就是 `ALADUO_EXP_MEMORY_FORGET` 与 `ALADUO_EXP_MEMORY_CHECK` 都打开；两者缺省都是关闭。它遍历这次心跳算出的孤儿状态：非 STALE 的原样传下去（遗忘函数会再过滤掉），STALE 的要看 `isOrphanWarningDeliverable (Lve)`，即按 slug 前缀选出的目标分区（lesson-、groove- 给 pattern-tracker，其余给 intuition-weaver）此刻能否通过契约过滤收到 `orphan-newborn.v1`；收不到的记入 `sparedUnwarnable`，不删除（confirmed）。遗忘运行时 check 开关必然打开，契约过滤的 flagFallback 为真，所以目标分区没有契约或契约解析失败时也算能收到警告；只有分区不存在、自我标识不符、已停用、或有效契约未声明 `orphan-newborn.v1` 时，节点才记入 `sparedUnwarnable`（confirmed）。

代码只检查目标分区现在能否收到警告，并不记录某个节点是否真的收到过 NEWBORN 警告（confirmed，否定性证据：没有任何按节点记录已警告状态的文件或字段）。因此一个 topics 文件只要修改时间早于 48 小时、入度为 0、不在可达集里，并且已经被提交进内核的 git 仓库、没有本地修改，遗忘开关打开后的第一次心跳就会把它从工作区删除，不论它此前是否以 NEWBORN 状态出现过。例如带着原有时间戳复制进来、随后被 memory-committer 提交的文件就属于这种情况（memory-committer 提交 `memory/topics/**` 下的新文件，提示词原文）。

**执行。**`forgetMemoryEntry (_we)` 以内核的 memory 目录为工作目录，只取 STALE 项，路径写成相对 memory 目录的 `topics/<slug>.md`；所在 git 仓库存在 `.git/index.lock` 时放弃这次遗忘；否则依次执行下面三条命令，commit 失败时再对同一组路径执行 `git reset --quiet` 与 `git checkout`（confirmed）：

```
git rm --ignore-unmatch -- <文件>
git diff --cached --name-only --diff-filter=D -- <文件>
git -c user.name=aladuo -c user.email=aladuo@local commit -m <说明> -- <第二条命令输出的路径>
```

`git rm` 只删除已在索引里的文件，`--ignore-unmatch` 让未跟踪的路径什么都不做，所以从未提交过的 STALE 文件不会被删除；批次中任一文件与最近一次提交的内容不一致（有未提交或已暂存的修改）时，`git rm` 整体失败，函数返回空列表，这次什么都不删。提交说明由 `formatForgetCommitMessage (Uct)` 生成，单个文件时是 "forget: <slug>, stale orphan never linked"（confirmed）。

提交这一步在默认布局下不会成功（未证实推测：按 git 的默认路径规则推出，并在本地 git 2.50 的临时仓库上复现，未在运行中的 daemon 上观测）。`git diff --name-only` 输出相对仓库根的路径，后两条命令却按工作目录解析路径。初始化时内核目录本身被建成 git 仓库的顶层（11.5），memory 是它的子目录，所以第二条命令输出的是 `memory/topics/<slug>.md`，commit 在 memory 目录下把它解析成不存在的路径，报 pathspec 不匹配而失败；回滚用的 `git checkout` 同样失败，`git reset` 对不匹配的路径不做任何事。结果是文件已从工作区和索引删除，删除停在暂存区，函数返回空列表，心跳日志不报告这次遗忘，也不会出现 "forget: …" 提交。暂存的删除会被之后任何一次不带路径参数的提交带进历史；出厂分区里做提交的是 memory-committer，它的提交范围包含 `memory/topics/**`（提示词原文），它是否在某次唤醒中带上这项删除，取决于会话当时的操作。被删文件此前已提交过，仍能从 git 历史恢复。

**手动入口。**CLI 另有 `duoduo memory reclaim` 子命令（`case "reclaim"`（`cli:runMemoryCommand`）），对孤儿执行同样的处理：NEWBORN 发警告、ISLAND 发说明、STALE 用 git 删除。它要求显式的 `--tag`，不要求遗忘开关（check 开关仍作为契约过滤的 flagFallback），`--force` 同时跳过契约过滤和"能否收到警告"的检查；它删除 STALE 节点用的是 cli bundle 里与 `forgetMemoryEntry` 逐行相同的一段代码，所以有同样的路径问题（未证实推测：已读到 cli bundle 中的处理函数，但它们没有真名，无法按名引用）。

### 12.4 两个分区分工改写

记忆内容的全部修改都发生在后台分区会话里，由模型完成。出厂分工把"从事件里判断每行记忆是否起了作用"和"据此修改记忆"分给两个分区：gradient-distiller 读事件日志、只写证据碎片；intuition-weaver 读碎片，是记忆板、效果记录和实体档案的唯一写者。另两个出厂分区里，pattern-tracker 是 `topics/lesson-*.md`、`topics/groove-*.md` 规则节点的唯一写者，memory-committer 只执行 `git add` 与 `git commit`，不评判内容（提示词原文，confirmed）。

这套分工写在各分区的 `CLAUDE.md` 里，代码与它对接的地方有五处：分区 frontmatter 里的 `contract.consumes`，代码据它决定投递（第 11.4 节）；12.2 表中写死在代码里的目标分区；scan-gap 任务单正文与 gradient-distiller 提示词的对应；fold-gap 用 intuition-weaver 的上次结束时间判断有没有新碎片（`readIntuitionWeaverLastFinishedMs (awe)`）；这两个分区输出为空时记为 `invalid_output`（第 11.3 节）。代码不校验碎片的格式，也不拒绝任何写入；对记忆板和效果记录，它只做 12.2 列出的测量（行数、行长、标题行、断链、效果记录里的走向与判定词），测量结果以任务单交给模型处理。

**gradient-distiller：从事件到碎片。**它只消费 `scan-gap.v2`，收件箱里没有这张任务单时不读任何日志，只报告一行 `NO_NEW_GRADIENT`。收到任务单后，它从任务单的 `interval:` 行复制 `<日期>[t1,t2]`，执行 `<Spine CLI> cat --interval '<日期>[t1,t2]' --kind external` 读取这个区间（`ts` 大于 t1、不超过 t2）里的外部来源事件，以输出末尾的 `END spine` 结束标记证明读完；它不许用 `Read` 或 `Grep` 打开 `.jsonl` 文件。`--kind external` 排除的六个内部来源与代码里的集合相同。在接受的事件里，人发来的 `channel.message` 及其引出的任务优先判断，周期性的、不带行为反馈的后台事件（例行 job 生命周期、附件事件）略过（提示词原文 `subconscious/gradient-distiller/CLAUDE.md`，confirmed）。

判断方式是先读一遍记忆板并保留在上下文里，再逐条外部事件对照记忆板的每一行：这一行在事件里被触发并起了作用（STRENGTHENING）、该起作用而没起或被纠正（WEAKENING）、没有相关上下文（NEUTRAL），或事件里有值得记住的信号但记忆板没有对应的行（NEW_SIGNAL，此时 `claude_md_ref: none`）。需要写时，先用 `spine show` 取回事件的 id、时间、来源、会话键和类型，再写一个碎片文件到 `memory/fragments/<事件日期>/`，frontmatter 必须带 `claude_md_ref` 或 `source_line`，另有 `source_line_hash`、`trajectory`、`activation`；WEAKENING 在证据清楚时可加 `root_cause`（`recall-miss` 或 `direction-wrong`）。同一事件、同一信号类型、同一行、同一走向的碎片已存在时不再写（提示词原文，confirmed）。

续读与确认有固定顺序。时间预算用完时，它把区间和最后一条判断完的事件 id 写进自己分区目录下的 `scan-gap.cursor`，保留任务单，下次用 `--after` 续读；cursor 与任务单的区间不一致时丢弃 cursor 从头读。读完整个区间后先删 cursor、再删任务单作为确认，没有写出任何碎片也要确认，报告 `NO_NEW_GRADIENT`；CLI 失败、看不到结束标记或外部事件数为零时保留任务单，报告 `SPINE_INTERVAL_MISMATCH`（提示词原文，confirmed）。

**intuition-weaver：从碎片到记忆板。**它消费另外九类信号：fold-gap、entity-converge、merge、orphan-islands、orphan-newborn、claude-compress、claude-lint、claude-flatten、activation-report。提示词把它的目标定为调整记忆板，使记忆板对以后行为的影响尽量大；合法动作只有新增、改写、调序、移出记忆板、修指针五种，约束是行数预算、语域、只认外部来源的证据、以及用户明确给出的数值规定。四类工作的规则如下（提示词原文 `subconscious/intuition-weaver/CLAUDE.md`，confirmed）：

- **fold。**fold-gap 任务单不点名任何一行，它自己找过期的行：某行被一个比它的效果记录更新的碎片引用，或被引用但还没有效果记录。它按从新到旧处理，对每一行枚举磁盘上所有相关碎片，整份重写 `memory/effectiveness/<slug>.md`：当前行文、`Trajectory`、按三种走向统计的碎片数、代表性样本和对记忆板的建议；`claude_md_ref: none` 的碎片汇总到 `memory/effectiveness/new-signals.md`。提示词说没处理完的行会随下一张 fold-gap 回来，因为引用它的碎片还在磁盘上；代码的实际条件与此不同，见本小节末段。
- **改记忆板。**每一处改动都要有行级证据：这一行的效果记录、任务单附带的走向证据，或"双来源冷"——activation report 测得这行指针背后的文件在整个窗口内没人读过，并且没有更新的碎片引用这一行。没有证据就不改，只在报告里写明缺口。STRENGTHENING 的行保留，NEUTRAL 默认保留，WEAKENING 的行按证据改写方向或移出；双来源冷的行默认移出，同时删除它的效果记录。只有两类纯形式修复不需要走向证据：删除标题行，以及把一行里重复其指向档案的内容下沉回档案。新增一行需要 `new-signals.md` 里的候选在不同碎片中重复出现，或有用户明确的长期指令。
- **实体档案。**整份重写 `memory/entities/<slug>.md`，只填有碎片支持的小节（What it is now、Relationship / stance、Open variables，被监测的实体另有 Trend），陈述带认知状态标签（`[observation]`、`[inference]`、`[instruction]` 等六种）；会话读档案时如何对待这些标签写在身份提示 `meta-prompt.md` 里。
- **确认。**activation report 每次读到就删除；其他任务单在处理到终态（`UPDATED:`、`NO-OP:`、`NO_NEW_GRADIENT:`、`BOOTSTRAPPED:`）后删除，`PARTIAL_UPDATE:` 与不明确、失败的任务单留在收件箱里；任务单只读和删，从不编辑。

fold-gap 的重发条件由代码决定，与 intuition-weaver 提示词的说法不同。代码只在碎片目录里最新文件的修改时间晚于 intuition-weaver 上次结束时间时才发 fold-gap，而上次结束时间在任何结果（包括超时和报错）后都会更新，所以没处理完的行要等下一个新碎片落盘才会再次触发 fold-gap，碎片留在磁盘上本身不触发；代码写进任务单正文的说法（没处理完的行由下一个落到它上面的碎片再次触发）与此相符。intuition-weaver 跑完一次后若没有更新的碎片，它没删除的 fold-gap 任务单（例如以 `PARTIAL_UPDATE:` 结束的）会在下一次记忆检查中被收件箱清理撤回（前提是这次检查的收件箱清理一步正常运行，见 12.2），因为它已不在这次的选择结果里（confirmed，由 `runFoldGapLint (uwe)` 与 `reconcileMemorySignalInboxes (Mve)` 推出）。

两个分区的提示词都要求报告里的计数能从磁盘重新数出来，涉及已有文件时写成"N new + M prior = 总数"的形式；运行时不检查这一点（提示词原文，confirmed）。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 记忆目录只有五项，fragments 与 state 另行定义；state 只在初始化时创建 | `effectivenessDir: Z$.join(e, "effectiveness")`（`resolveMemoryDirs`）；`S = vt.join(E, "fragments")`（`resolveRuntimePaths`）；`D = vt.join(E, "state")`（`resolveRuntimePaths`）；`await $e(e.memoryStateDir)`（`initializeRuntime`） | confirmed（否定性证据：bundle 中 `memoryStateDir` 只出现在这两个函数里） |
| 链接扫描遇第一个 `]` 为止，必须紧跟第二个 `]` | `e[o] === "]" && e[o + 1] === "]"`（`scanWikiLinkOccurrences`）；`resolveMemoryLinkTargets (Ff)` | confirmed |
| 可达集从记忆板链接出发广度优先搜索到不动点 | `r = Ff(e).filter(x6)`（`walkReachableMemory`） | confirmed |
| 效果记录只在 topics 或 entities 文件存在时才并入 slug 正文 | `i.length > 0`（`createMemorySlugReader`）；`e.effectivenessDir`（`createMemorySlugReader`） | confirmed |
| 孤儿候选只来自 topics；记忆板缺失时不产生状态 | `for (let l of Ka(n.topicsDir))`（`computeOrphanTopicNodes`）；`!Ic(n.boardPath)`（`computeOrphanTopicNodes`） | confirmed |
| 入度只统计 entities 与 topics 里的链接，不计自链接 | `computeMemoryLinkIndegree (Lct)`；`for (let n of [e.entitiesDir, e.topicsDir])`（`computeMemoryLinkIndegree`）；`o.slug !== r`（`computeMemoryLinkIndegree`） | confirmed |
| 引用者清单按 `[[slug]]` 字符串匹配记忆板与 entities、topics 文件，不含自身 | `listMemorySlugReferrers (Fct)`；`i.includes(n) && r.push("CLAUDE.md")`（`listMemorySlugReferrers`）；`[t.entitiesDir, "entities"]`（`listMemorySlugReferrers`）；`referencedBy: Fct(l, n)`（`computeOrphanTopicNodes`） | confirmed |
| 孤儿三态的判定顺序与 48 小时阈值 | `detectOrphanMemory (gwe)`；`a = o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE"`（`detectOrphanMemory`）；`hwe = 3600 * 1e3, lO = 48`（`initOrphanMemoryModule`） | confirmed |
| forget 依赖 check；只设 forget 时报错并禁用遗忘 | `t = V6("ALADUO_EXP_MEMORY_FORGET") && e`（`resolveMemoryCheckFlags`）；`FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE)`（`runMemoryCheckTick`） | confirmed |
| check 开关只作为契约过滤的 flagFallback | `flagFallback: n`（`runMemoryCheckTick`）；`return n ? null : "parse-fail"`（`enforceContractGate`） | confirmed |
| 没有任何分区接收任何信号且遗忘关闭时整次检查直接返回 | `a = Bct(() => jve(s))`（`runMemoryCheckTick`）；`t.some(i => iO(i, r, e.flagFallback) === null)`（`hasAnyMemorySignalConsumer`） | confirmed |
| 候选分区列表含已退休的 memory-weaver，不含 memory-committer；它只用于判断是否运行检查与维护收件箱快照 | `C6 = ["pattern-tracker", "gradient-distiller", "intuition-weaver", "memory-weaver"]`（`initMemorySignalDeliveryModule`）；`hasAnyMemorySignalConsumer (jve)`；`for (let o of C6) i.set(o, new Set)`（`reconcileMemorySignalInboxes`） | confirmed（否定性证据：候选列表常量只在这两个函数里被读取） |
| 任务单的目标分区在各检查步里写死，只有 pattern-tracker、gradient-distiller、intuition-weaver 三个 | `partition: "pattern-tracker"`（`runBoardLint`）；`partition: "intuition-weaver"`（`buildOrphanIslandsSignal`）；`Cc.join(Rc(r.varDir, "gradient-distiller"), Hve)`（`deliverScanGapSignal`）；`return e.rel.startsWith("topics/") && (e.slug.startsWith("lesson-") \|\| e.slug.startsWith("groove-")) ? "pattern-tracker" : "intuition-weaver"`（`routeContractDecision`） | confirmed（其余检查步的目标见下面各行） |
| 任务单正文多数点名行、文件或区间，fold-gap 不点名 | `"[fold-gap]"`（`renderFoldGapBody`）；`This signal names no line, no slug and no count`（`renderFoldGapBody`） | confirmed |
| 开关与契约状态经 `system.status` 报告 | `check_enabled: t.check`（`buildMemoryCheckStatus`）；`memory_check: J6(u)`（`createDaemon`） | confirmed |
| 各子步隔离执行；读不出的路径抑制收件箱清理 | `check tick sub-step failed`（`runMemoryCheckSubStep`）；`results are degraded, inbox sweep suppressed this tick`（`runReadAuditedMemoryCheckStep`）；`m && H6("inbox-sync"`（`runMemoryCheckTick`） | confirmed |
| 子步顺序与 activation 指标记录；指标写入 `var/telemetry` | `ua("orphan-states"`（`runMemoryCheckTick`）；`ua("orphan-newborn-island"`（`runMemoryCheckTick`）；`"memory_activation_loss"`（`runMemoryCheckTick`）；`b = vt.join(u, "telemetry")`（`resolveRuntimePaths`） | confirmed（写入函数与 `ALADUO_TELEMETRY_ENABLED` 开关为未证实推测：写入函数尚无真名） |
| 十二类信号，只有 scan-gap 是 v2 | `SCAN_GAP: "scan-gap.v2"`（`initMemorySignalKindsModule`）；`ACTIVATION_REPORT: "activation-report.v1"`（`initMemorySignalKindsModule`） | confirmed |
| board-lint 只看记忆板链接到的 topics 节点；revise 给 pattern-tracker、merge 给 intuition-weaver | `collectBoardLintReport (yve)`；`runBoardLint (ylt)`；`Ic(l) && o.push(glt(u, i, r, l))`（`collectBoardLintReport`）；`partition: "pattern-tracker"`（`runBoardLint`）；`merge-${s.slug}.md.pending`（`runBoardLint`） | confirmed |
| revise 的过滤条件：有效果记录、行为类、旧格式，排除变弱且判定为 REMOVE 或 DROP 的节点 | `s.trajectory !== "NO-EFF" && s.cls === "behavioral" && s.fmt === "legacy"`（`runBoardLint`）；`s.trajectory === "WEAKENING" && (s.verdict === "REMOVE" \|\| s.verdict === "DROP")`（`runBoardLint`） | confirmed |
| 效果记录判定词只在 `updater guidance:` 小节下解析，与 intuition-weaver 模板的 `Board guidance:` 不一致 | — | 未证实推测（解析函数与调用者都没有真名；模板见 `subconscious/intuition-weaver/CLAUDE.md` 的 Effectiveness Files 一节） |
| entity-lint 的三个收敛小节、排序分数与目标分区 | `runEntityLint (Sve)`；`wve = ["What it is now", "Relationship", "Open variables"]`（`initEntityLintModule`）；`m = d * 1e3 + p`（`runEntityLint`）；`entity-converge-${l.slug}.md.pending`（`runEntityLint`） | confirmed（日期戳只认 2026 年写法为未证实推测：计数函数没有真名） |
| node-lint 允许的小节、行数上限与 WASTED-COMPUTE 标注 | `runNodeLint (xve)`；`t === "groove" && e === "References"`（`isAllowedNodeSection`）；`if (p.length === 0 && m <= E6) continue`（`runNodeLint`）；`escalated: WASTED-COMPUTE`（`renderNodeConvergeSignalBody`） | confirmed（行数上限 200 定义在尚无真名的模块初始化器里） |
| board、entity、node 三类的每类上限为 1 | `B6 = 1`（`initMemoryCheckTickModule`）；`d(xve(u, B6).selected)`（`runMemoryCheckTick`） | confirmed |
| fold-lint：最新碎片比 intuition-weaver 上次结束时间新才发 | `runFoldGapLint (uwe)`；`findNewestFragmentMtimeMs (yct)`；`kind: Un.FOLD_GAP`（`runFoldGapLint`）；`last_finished_at === null ? NaN`（`readIntuitionWeaverLastFinishedMs`）；`swe = "intuition-weaver"`（`initFoldGapLintModule`） | confirmed |
| fold-gap 只在有新碎片时重发；上次结束时间在任何结果后更新；不再选中的旧 fold-gap 被收件箱清理撤回 | `runFoldGapLint (uwe)`；`referenceMs: t`（`runFoldGapLint`）；`last_finished_at: Oe.toISOString()`（`createMetaSession`）；`last_finished_at: Ut.toISOString()`（`createMetaSession`）；`Ya.rmSync(c, {`（`reconcileMemorySignalInboxes`） | confirmed |
| broadcast-budget 的两个上限、字符计法与目标分区 | `runBroadcastBudgetLint (Qve)`；`Klt = 100, Ylt = 200`（`initBroadcastBudgetLintModule`）；`tct = "·"`（`initBroadcastBudgetLintModule`）；`"ALADUO_MEMORY_MAX_LINE_CHARS"`（`runBroadcastBudgetLint`）；`Qlt = "intuition-weaver"`（`initBroadcastBudgetLintModule`） | confirmed |
| broadcast-lint 检查链接能否解析到 entities 或 topics 文件 | `runBroadcastLinkLint (cwe)`；`extractBoardSlugLinks (Sct)`；`pendingFilename: "claude-lint.md.pending"`（`runBroadcastLinkLint`）；`vct = "intuition-weaver"`（`initBroadcastLinkLintModule`） | confirmed |
| broadcast-flatten 找围栏外的标题行 | `runBroadcastFlattenLint (fwe)`；`findBoardHeadingLines (Oct)`；`pendingFilename: "claude-flatten.md.pending"`（`runBroadcastFlattenLint`）；`Pct = "intuition-weaver"`（`initBroadcastFlattenLintModule`） | confirmed |
| activation report：30 个交互日窗口，热孤儿最多列 10 个，前台写入工具单独计数 | `runActivationLint (rwe)`；`renderActivationReportBody (gct)`；`L6 = 30, nwe = 10`（`initActivationLintModule`）；`windowDays: L6`（`runActivationLint`）；`"NotebookEdit"`（`initActivationLintModule`） | confirmed（窗口的计日与路径匹配逻辑为未证实推测：函数尚无真名） |
| orphan-newborn 按前缀二选一分区，islands 固定给 intuition-weaver，正文逐个列出节点与引用者 | `buildOrphanNewbornSignals (ywe)`；`filterOrphanIslands (bwe)`；`e.slug.startsWith("lesson-")`（`routeContractDecision`）；`partition: q6(n)`（`buildOrphanNewbornSignals`）；`pendingFilename: "orphan-islands.md.pending"`（`buildOrphanIslandsSignal`）；`touches = foreground reads of the node in the activation window`（`renderOrphanIslandsBody`）；`"[orphan-islands]"`（`renderOrphanIslandsBody`） | confirmed |
| scan-gap 同一时间只有一张 | `deliverScanGapSignal (Zve)`；`Cc.join(Rc(r.varDir, "gradient-distiller"), Hve)`（`deliverScanGapSignal`）；`pending: !0`（`deliverScanGapSignal`） | confirmed |
| 今天的区间要等最新人类消息过去至少一个心跳周期才交出，否则往前找最近的未交区间 | `resolveCadenceIntervalMs (kwe)`；`f >= 0 && n - (s + f) >= r`（`runGapLint`）；`cadenceIntervalMs: kwe()`（`runMemoryCheckTick`）；`for (let d = i.dates.length - 1; d >= 0; d -= 1)`（`runGapLint`） | confirmed |
| 只有外部来源的 `channel.message` 算交互；外部判定用六个内部来源的集合 | `readGapLintDayEvents (Uve)`；`interaction: i.type === Flt`（`readGapLintDayEvents`）；`eO.has(s)`（`readGapLintDayEvents`） | confirmed（比较对象的值 `channel.message` 定义在尚无真名的模块初始化器里） |
| 区间交出后记入已交清单；无外部事件的区间不发任务单但照样记入；被拒时不记 | `c && zve(r.varDir, u.span)`（`deliverScanGapSignal`）；`d && zve(r.varDir, u.span)`（`deliverScanGapSignal`）；`c = l.posted.length > 0`（`deliverScanGapSignal`） | confirmed（清单文件名 `gap-handed-days.txt`、首次创建时的播种规则为未证实推测：读写函数尚无真名） |
| 小时段合并与任务单正文 | `mergeContiguousHourRanges (Bve)`；`buildScanGapSignal (Zlt)`；`dream over this bounded interval`（`renderScanGapSignalBody`）；`a dream that writes no fragments still acks`（`renderScanGapSignalBody`） | confirmed |
| 投递先过契约过滤，同名文件存在时不覆盖 | `let s = iO(r.kind, nO(t, r.partition), t.flagFallback)`（`postMemorySignalsToInboxes`）；`flag: "wx"`（`postMemorySignalsToInboxes`）；`reason: "already-pending"`（`postMemorySignalsToInboxes`） | confirmed |
| 收件箱快照清理只管运行时投递的文件，排除 scan-gap；不再选中的旧任务单被撤回 | `Dlt = ".memory-signals.json", Mlt = "scan-gap.md.pending"`（`initMemorySignalDeliveryModule`）；`r.removed.push(c)`（`reconcileMemorySignalInboxes`） | confirmed |
| 遗忘只在 forget 开关生效时运行，不可警告的 STALE 节点跳过；此时 flagFallback 必然为真，无契约与解析失败的分区也算可警告 | `r && H6("orphan-forget"`（`runMemoryCheckTick`）；`o.sparedUnwarnable.push(v.rel)`（`runMemoryCheckTick`）；`iO(Un.ORPHAN_NEWBORN, nO(e, t), e.flagFallback) === null`（`isOrphanWarningDeliverable`）；`flagFallback: n`（`runMemoryCheckTick`）；`t = V6("ALADUO_EXP_MEMORY_FORGET") && e`（`resolveMemoryCheckFlags`）；`return n ? null : "no-contract"`（`enforceContractGate`） | confirmed |
| 遗忘的命令序列：以 memory 目录为工作目录执行 git rm、git diff、带路径的 commit，失败时 reset 与 checkout；index.lock 存在时放弃；未跟踪的文件不被删除 | `e.filter(a => a.state === "STALE")`（`forgetMemoryEntry`）；`o = Zw.join(t, "memory")`（`forgetMemoryEntry`）；`".git", "index.lock"`（`forgetMemoryEntry`）；`"rm", "--ignore-unmatch", "--", ...i`（`forgetMemoryEntry`）；`"--diff-filter=D"`（`forgetMemoryEntry`）；`"user.name=aladuo"`（`forgetMemoryEntry`）；`"reset", "--quiet"`（`forgetMemoryEntry`） | confirmed |
| 默认布局下遗忘的 commit 与回滚因路径基准不同而失败，删除停在暂存区；批次中有本地修改时 git rm 整体失败 | `"--name-only"`（`forgetMemoryEntry`）；`cwd: o`（`forgetMemoryEntry`）；`await Uwe(e.kernelDir)`（`initializeRuntime`） | 未证实推测（按 git 默认路径规则推出，并在本地 git 2.50 的临时仓库上复现：diff 输出 `memory/topics/x.md`，commit 与 checkout 报 pathspec 不匹配，状态保持 `D  topics/x.md`；对有本地修改的文件 git rm 报 has local modifications；未在运行中的 daemon 上观测） |
| 遗忘提交说明 | `stale orphan never linked`（`formatForgetCommitMessage`） | confirmed |
| CLI 手动回收入口 | `case "reclaim"`（`cli:runMemoryCommand`） | confirmed（入口存在）；其行为细节与同样的路径问题为未证实推测（处理函数与删除函数尚无真名；删除函数与 `forgetMemoryEntry` 去掉标识符后逐行相同） |
| 四个出厂分区的写权限分工 | — | confirmed（提示词原文：四个分区的 `CLAUDE.md` 开头各自声明唯一写者或只做 git add 与 git commit） |
| 两个分区空输出判为 invalid_output | `"(no output)"`（`detectEmptyRequiredPartitionOutput`） | confirmed（空输出判定）；分区集合为未证实推测（定义在没有真名的模块初始化器里） |
| gradient-distiller 的读取方式、来源过滤、判断标签、碎片格式、续读与确认顺序 | — | confirmed（提示词原文 `subconscious/gradient-distiller/CLAUDE.md` 的 Gap-Driven Dreaming、Source Gate、Trajectory Labels、Fragment Format、Deduplication 各节） |
| intuition-weaver 的写权限、fold 流程、改行证据要求、实体档案格式与确认规则 | — | confirmed（提示词原文 `subconscious/intuition-weaver/CLAUDE.md` 的 Fold、Broadcast Decisions、Entity Dossiers、Terminal Results And Ack 各节） |
| 认知状态标签的读取规则在身份提示里 | — | confirmed（包内 `bootstrap/meta-prompt.md` 列出六种标签及"新的观察覆盖档案里的 observation 与 inference"规则） |

## 13 指令指纹与改动生效

每次 drain 开始前，运行时对身份提示、种类提示、实例提示、记忆板、任务书与验收标准算一个 sha256 指纹，另外单独算记忆板哈希和"去掉记忆板后的指纹"，再与会话状态里存的值比较，据此决定已经建立的引擎会话要不要换上新指令。只有记忆板变化时，Claude 的常驻流式进程不重建、Codex 渠道会话沿用原线程，模型通过 2.3 的 `board-updated` 瞬时块得知记忆板已变；记忆板以外的指令变化时，Claude 标记流式进程重建并续接原会话，Codex fork 一条携带新指令的线程；Grok 与 pi 只更新存档的指纹，新文本何时到达引擎由各自适配器决定（2.4）。系统提示每轮重算，但 Claude 常驻流式进程和 Codex 线程只在建立时接收它，指纹比较的结果决定这两者何时换上新文本（2.4）。本节对应 GUIDE 4.6。

### 13.1 指纹覆盖范围

指纹覆盖身份、种类提示、实例提示、记忆板、任务书与验收标准；`prompt_mode`、运行上下文、Job ID 与调度规则不在其中（confirmed）。指纹的输入由 `collectInstructionsInputs (XEe)` 收集，比较由 `runInstructionsFingerprintGuard (OA)` 完成；两者在会话 actor 的 drain 循环中每次 drain 之前各调用一次，记忆板因此每次都重新读取并展开；job 文件在 actor 启动时读取一次，第一次 drain 用这份快照，之后每次 drain 前重新读取（confirmed）。输入按会话来源不同：

| 输入 | 取自 | 哪些会话有 |
|---|---|---|
| `identity` | `resolveMetaPromptText (Xv)` 读到的身份提示（2.1） | 全部 |
| `kindPrompt`、`instancePrompt` | 会话状态中 `source_channel_id` 指向的渠道描述，经 `buildEffectiveChannelConfig (cbe)` 合并后的种类提示与实例提示 | 渠道会话 |
| `memoryBoard` | `transcludeBroadcastBoard (WEe)` 展开后的记忆板全文（不含 2.2 的包装语） | 全部，记忆板为空时为空串 |
| `mission`、`missionAcceptance` | 当次读取的 job 文件正文与 frontmatter 的 `acceptance` | job 会话 |

运行时由这些输入算出三个值，都存进会话状态：

- `computeInstructionsFingerprint (LS)`：把身份、种类、实例、记忆板、任务书五个字符串（缺省为空串）按顺序放进一个 JSON 数组，验收标准非空时追加为第六项，取 sha256，存为 `instructions_fingerprint`。
- `computeBoardLayerHash (lJ)`：只对记忆板文本取 sha256，存为 `board_layer_hash`。
- `computeNonBoardInstructionsFingerprint (cJ)`：把记忆板置空后调用 `computeInstructionsFingerprint (LS)`，存为 `instructions_nonboard_fingerprint`。

全量指纹变了、记忆板哈希也变了、去掉记忆板后的指纹却没变，就判定为"只有记忆板变化"（`boardOnlyDrift`）；存档里还没有后两个值时不做这个判定，按记忆板以外的变化处理（confirmed）。

指纹之外的系统提示内容变化不会触发 13.2 的处理。`prompt_mode`、第 5 层运行上下文（会话键、渠道种类、引擎名）、任务书块里的 `Job ID` 与 `Schedule:` 行、无状态标志都不在输入里（confirmed）。非渠道会话按锚点事件来源读到的种类层与实例层也不在输入里：系统提示按锚点事件解析 effective config，job 按调度规则触发时种类层取自 `cadence` 种类描述（3.5），而 `collectInstructionsInputs (XEe)` 只为渠道会话收集种类提示与实例提示（confirmed）。由此有三个后果，都由上面的代码直接推出：只改 job 的 cron 时，系统提示文本变了而指纹不变，Codex 的有状态 job 线程继续使用带旧 `Schedule:` 行的指令，模型仍能从每次运行的 `job-tick` 块读到当前 cron；修改 job 锚点来源对应的种类描述时，Codex 的有状态 job 线程同样继续使用旧的种类层；只改渠道的 `prompt_mode` 时，Claude 渠道会话的常驻流式进程不重建，新的包装形式要等进程下一次启动才生效。工具、权限、工作目录这类会话配置不属于指令指纹，Claude 流式进程另用配置签名 `computeStreamingConfigSignature (fJ)` 判断是否重建，见 7.4。

### 13.2 三种漂移的处理

比较结果分为三种需要处理的情况：会话状态的格式版本过低、只有记忆板变化、记忆板以外的指令变化；指纹完全相同时只补写存档里缺少的两个哈希字段（confirmed）。三种情况在四个引擎上的处理如下表，表中"续接"指下一次调用带上会话状态里的 `sdk_session_id` 恢复原会话。

| 情况 | Claude | Codex | Grok、pi |
|---|---|---|---|
| 会话状态版本低于 `SESSION_SCHEMA_VERSION (Qg)`（值为 2），包括还没有版本号的新会话 | 清空 `sdk_session_id`、`sdk_session_runtime`、`pending_fork_to`，写入新指纹与版本号；下一次调用新开引擎会话 | 同左 | 同左 |
| 只有记忆板变化 | 不重建：常驻流式进程保留启动时的系统提示，直到进程重启，或某次 drain 发生上下文压缩后被标记重建；非流式会话下一次调用本来就带当前文本 | 渠道会话跳过 fork、续接原线程；非渠道会话按下一行处理 | 只更新存档指纹 |
| 记忆板以外的指令变化 | 发出 `session.streaming_invalidated`：丢弃流式适配器并标记重建；下一个 turn 重新启动流式进程，续接原会话并带上新系统提示 | 有线程 id 时记下 `pending_fork_to`，下一次 drain 以 `thread/fork` 带新 `baseInstructions` 开出新线程；没有线程 id 时清空会话，新开线程 | 只更新存档指纹 |

**状态版本过低。** `runInstructionsFingerprintGuard (OA)` 把存档里缺失的 `schema_version` 当作 0；它小于 `SESSION_SCHEMA_VERSION (Qg)` 时，清空三个会话字段并写入全部指纹与版本号，返回 `clearedSdkSessionId` 为真，会话管理器随即丢掉内存里的会话 id，下一次调用不再续接旧的引擎会话（confirmed）。会话状态的 `schema_version` 只在这里写入，所以每个新会话的第一次 drain 都经过这一分支，初始指纹也是这时写进存档的；对新会话来说清空的字段本来就是空的。这一情况与指令内容无关，四个引擎处理相同。

**只有记忆板变化，Claude。** 会话管理器收到 `boardOnlyDrift` 后只写一条日志，说明保留流式前缀、不拆除会话；没有存活的流式进程时日志改为"没有可保留的前缀"（confirmed）。常驻流式进程因此继续使用启动时拿到的系统提示，其中的记忆板仍是旧版，系统提示前缀不变。模型从 2.3 的 `board-updated` 块得知记忆板已变，需要时自己去读文件；这个块只给渠道会话，按会话状态里的记忆板哈希水位判断是否注入，所以每次记忆板变化只提示一次（confirmed）。新版记忆板在流式进程下一次启动时进入系统提示，例如空闲回收之后（8.4）、配置签名变化之后（7.4），或记忆板以外的指令变化之后。另有一个专门的时机：流式进程启动时记下当时的记忆板哈希；某次 drain 中发生了上下文压缩、而记下的哈希与当前记忆板哈希不同时，会话管理器把流式进程标记为重建，下一个 turn 以新记忆板启动（confirmed）。压缩之后上下文本来就要重新建立，选在这时换上新记忆板不会额外破坏 prompt cache 前缀，这是对设计意图的推断，未证实推测。Claude 的非渠道会话每次调用发起一次 `query()`，下一次调用就用上新文本，不需要额外处理（2.4）。

**只有记忆板变化，Codex。** 渠道会话上，`runInstructionsFingerprintGuard (OA)` 只写入新指纹，记一条"跳过 fork"的日志，不请求 fork；续接线程的 `thread/resume` 请求不带 `baseInstructions`（2.4），线程继续使用建立时的指令（confirmed；Codex app-server 在续接时保留原指令属于未证实推测）。模型同样通过 `board-updated` 块得知变化。非渠道会话（例如 job 会话）不走这个分支，按下一种情况 fork（confirmed）。

**记忆板以外的指令变化，Claude。** 会话管理器发出 `session.streaming_invalidated`，原因为 `instructions_drift`。事件处理函数把该 actor 的流式适配器置空，并把存活流式进程的 `needsRecreation` 置为真；下一个 turn 里 `createClaudeStreamingSessionFactory (s0e)` 的复用条件因此不成立，先拆除旧进程，再以会话状态中的同一个会话 id 启动新进程，新进程收到当前算出的系统提示（confirmed）。对话历史因为续接原会话而保留。新指令能在续接的会话上生效，依赖 2.4 所述的"关闭 SDK 系统提示快照"：在系统提示记录功能生效的环境里，不关闭快照时 SDK 会一直沿用会话第一次请求时记录的系统提示（2.4，SDK 类型文档原文）；运行时确实关闭了快照这一步，因规范化函数无真名而属未证实推测。非渠道 Claude 会话同样每次调用带当前文本，不受这个事件影响。

**记忆板以外的指令变化，Codex。** 会话已有线程 id 时，`runInstructionsFingerprintGuard (OA)` 把它写进 `pending_fork_to`；下一次 drain 由 `buildSessionInfoFromState (Ig)` 读出，`prepareDrainTurnContext (SH)` 只在引擎为 Codex、且不是无状态 job 时把它作为 `forkFrom` 交给适配器，适配器发出 `thread/fork` 并附上新的 `baseInstructions`；这一轮成功后清除 `pending_fork_to`，把新线程 id 存为 `sdk_session_id`（confirmed）。fork 出的线程继承父线程的对话历史，这是 Codex app-server 的行为，未证实推测。fork 请求失败（不是被中止）时，适配器记一条日志后改发 `thread/start`，新开一个线程（confirmed）。会话还没有线程 id 时，改为清空会话字段，下一次调用以 `thread/start` 新开线程（confirmed）。引擎不是 Codex、或会话是无状态 job 时，drain 开始时直接丢弃遗留的 `pending_fork_to`（confirmed）。

**Grok 与 pi。** 对这两个引擎，`runInstructionsFingerprintGuard (OA)` 在两种变化下都只写入新指纹并记一条"指令已更新"日志，不清空会话、不发事件（confirmed）。新文本何时到达引擎由适配器决定：Grok 的 `override` 文本在下一次调用前重新载入会话，`append` 文本只在新建会话时发送；pi 的系统提示只在 worker 进程启动时生效，要等 worker 重启（例如空闲回收，8.4）才换上新文本（confirmed，依据是 pi-worker 只读取第一个初始化帧里的系统提示；daemon 侧何时写入这一字段属未证实推测，见 2.4）。

**无状态 job。** 无状态 job 每次运行都不续接、也不 fork（`prepareDrainTurnContext (SH)` 对它不取会话 id 和 `forkFrom`），每次运行都是一个带当前系统提示的新会话，不需要上述处理（confirmed）。

指令变化的各条日志都带 `fp_old` 与 `fp_new` 两个字段，记录前后两个指纹；状态版本过低的日志只带 `fp_new`（confirmed）。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 每次 drain 前先收集输入、再比较指纹 | `} = await XEe(t, P, w, Ht), Bn = await ct(t, P), Di = await OA(t, P, pi, w.runtime, {`（`createSessionManager`） | confirmed |
| job 文件在 actor 启动时读取，之后每次 drain 前重新读取 | `let It = await a.getJob(w.jobId)`（`createSessionManager`）；`Ht = await a.getJob(w.jobId).catch(() => null)`（`createSessionManager`） | confirmed |
| 输入：身份来自身份提示，记忆板来自展开后的全文 | `let i = Xv() ?? void 0`（`collectInstructionsInputs`）；`(await WEe(e.memoryBroadcastPath)).rendered.trim() \|\| void 0`（`collectInstructionsInputs`） | confirmed |
| 输入：种类与实例提示只取自渠道会话的来源渠道描述 | `n.origin === "channel"`（`collectInstructionsInputs`）；`source_channel_id`（`collectInstructionsInputs`）；`s = p?.kind_prompt?.trim() \|\| void 0, a = p?.instance_prompt?.trim() \|\| void 0`（`collectInstructionsInputs`） | confirmed |
| 输入：任务书与验收标准只取自 job 会话 | `n.origin === "job" && n.jobId && r && (u = r.content, l = r.frontmatter.acceptance?.trim())`（`collectInstructionsInputs`） | confirmed |
| 全量指纹为五项字符串（验收标准非空时六项）的 sha256 | `let t = [e.identity ?? "", e.kindPrompt ?? "", e.instancePrompt ?? "", e.memoryBoard ?? "", e.mission ?? ""]`（`computeInstructionsFingerprint`）；`e.missionAcceptance && t.push(e.missionAcceptance)`（`computeInstructionsFingerprint`） | confirmed（否定性证据：数组里没有 `prompt_mode`、会话键、引擎名、cron） |
| 记忆板哈希只对记忆板文本取 sha256 | `JSON.stringify([e ?? ""])`（`computeBoardLayerHash`） | confirmed |
| 去掉记忆板后的指纹复用全量指纹函数 | `memoryBoard: void 0`（`computeNonBoardInstructionsFingerprint`） | confirmed |
| 只有记忆板变化的判定条件 | `i.board_layer_hash !== c && i.instructions_nonboard_fingerprint === d`（`runInstructionsFingerprintGuard`） | confirmed |
| 缺失的版本号按 0 处理，版本过低时清空会话字段并写入指纹 | `u = i.schema_version ?? 0`（`runInstructionsFingerprintGuard`）；`Qg = 2`（`SESSION_SCHEMA_VERSION`）；`schema_version: Qg`（`runInstructionsFingerprintGuard`）；`sdk_session_runtime: null`（`runInstructionsFingerprintGuard`）；`[session-upgrade] v${u} → v${Qg} rebuild`（`runInstructionsFingerprintGuard`）；`Di.clearedSdkSessionId && (w.sdkSessionId = void 0)`（`createSessionManager`） | confirmed（否定性证据：会话状态的 `schema_version` 在 daemon 中没有其他写入处） |
| 指纹不变时只补写缺少的哈希字段 | `(i.board_layer_hash === void 0 \|\| i.instructions_nonboard_fingerprint === void 0) && await et(e, t, {`（`runInstructionsFingerprintGuard`） | confirmed |
| Claude：只有记忆板变化时只记日志，不拆除流式进程 | `board-only drift — pinning streaming prefix (no teardown)`（`createSessionManager`）；`board-only drift — no live streaming prefix (nothing to pin)`（`createSessionManager`） | confirmed |
| Claude：流式进程启动时记下记忆板哈希，压缩后哈希不同则标记重建 | `u.spawnBoardHash = l.boardHash`（`createClaudeStreamingSessionFactory`）；`boardHash: pi.memoryBoard ? Di.boardLayerHash : void 0`（`createSessionManager`）；`de.compacted && w.runtime === "claude"`（`createSessionManager`）；`w.spawnBoardHash !== me`（`createSessionManager`）；`reason: "board-refresh(B4)"`（`createSessionManager`） | confirmed |
| Claude：其他指令变化时发出失效事件 | `Di.gate2Fired && w.runtime === "claude"`（`createSessionManager`）；`reason: "instructions_drift"`（`createSessionManager`） | confirmed |
| 失效事件处理：丢弃流式适配器、标记重建 | `K.streamingAdapter = null`（`createSessionManager`）；`K.streamingState.needsRecreation = !0`（`createSessionManager`）；`reason: "instructions-drift"`（`createSessionManager`） | confirmed |
| 标记重建后下一个 turn 以同一会话 id 重启流式进程并带当前系统提示 | `!u.streamingState.needsRecreation && u.streamingState.configSignature === p`（`createClaudeStreamingSessionFactory`）；`respawn: recreation-requested (already audited at source)`（`createClaudeStreamingSessionFactory`）；`sessionId: D`（`createClaudeStreamingSessionFactory`）；`systemPrompt: l.systemPrompt`（`createClaudeStreamingSessionFactory`） | confirmed |
| `board-updated` 只给渠道会话，按哈希水位注入一次 | `at = to(t) === "channel" ? n.boardHash : void 0`（`drainSessionMailbox`）；`last_seen_board_hash: Oe`（`drainSessionMailbox`）；`tag: "board-updated"`（`buildTransientUserBlocks`） | confirmed |
| Codex：渠道会话只有记忆板变化时跳过 fork | `f && to(t) === "channel"`（`runInstructionsFingerprintGuard`）；`[instructions-fingerprint] codex board-only drift — fork skipped`（`runInstructionsFingerprintGuard`） | confirmed |
| Codex：其他情况有线程 id 时请求 fork，没有时清空会话 | `pending_fork_to: m`（`runInstructionsFingerprintGuard`）；`[instructions-fingerprint] codex thread fork`（`runInstructionsFingerprintGuard`）；`[instructions-fingerprint] codex thread reset (no parent to fork)`（`runInstructionsFingerprintGuard`） | confirmed |
| Codex：`pending_fork_to` 只对非无状态的 Codex 会话生效，成功后清除 | `forkFrom: n?.pending_fork_to`（`buildSessionInfoFromState`）；`c = n.resume === !1 \|\| n.runtime !== "codex" \|\| l ? void 0 : i.forkFrom`（`prepareDrainTurnContext`）；`U.forkFrom && (n.runtime !== "codex" \|\| X) && (U.forkFrom = void 0`（`drainSessionMailbox`）；`Et && (mt.pending_fork_to = null)`（`drainSessionMailbox`） | confirmed |
| Codex：fork 时附带新的 baseInstructions，续接时不带；fork 失败时新开线程 | `f.forkFrom ? (S = "thread/fork", D = x(f.forkFrom))`（`createCodexAppServerAdapter`）；`g && (L.baseInstructions = g)`（`createCodexAppServerAdapter`）；`"[codex-adapter] thread/fork failed, falling back to thread/start"`（`createCodexAppServerAdapter`） | confirmed |
| Grok 与 pi：只更新存档指纹 | `[instructions-fingerprint] ${r} instructions updated`（`runInstructionsFingerprintGuard`） | confirmed |
| 无状态 job 不续接、不 fork | `d = n.resume === !1 \|\| c \|\| l ? void 0 : i.sessionId`（`prepareDrainTurnContext`） | confirmed |
| 指令变化的日志记录前后两个指纹，版本升级的日志只记新指纹 | `fp_old: a ?? null`（`runInstructionsFingerprintGuard`）；`fp_new: s`（`runInstructionsFingerprintGuard`） | confirmed |
| 系统提示的种类层与实例层按锚点事件解析，非渠道会话的这两层不进指纹 | `h = KV(await Eo(s, "effective_config_ms", async () => YV(e, u.event)), n.jobContext?.sdkConfig)`（`prepareDrainTurnContext`）；`n.origin === "channel"`（`collectInstructionsInputs`） | confirmed |

## 14 未证实与待实测

下面的开放项都已在代码或提示词里读到相应路径，但结论取决于 duoduo bundle 之外的程序，或需要在运行中的实例上观测，或是由静态阅读推出、尚未复现的后果；正文中对应的主张或标为未证实推测，或注明没有实测。本节按这三类汇总，每项写明要验证什么、怎样验证、正文在哪一节。另有一批未证实推测只是因为实现它的函数没有真名，放在 14.4 说明。

### 14.1 取决于引擎或 SDK 实现的行为

这一类的共同点是 duoduo 把请求交给了引擎，引擎怎样处理不在 bundle 里，只能在装有对应引擎的实例上试验。

1. **Skip 之后 Agent SDK 是否仍执行工具体（4.5）。** PreToolUse hook 返回 `continue: false` 之后，SDK 若不再执行 Skip 的工具体，Claude 会话就不会写入 Skip 记录，下一轮也没有 `<skip-rewind>` 块。验证方法：在 Claude 渠道会话里让模型调用 Skip，检查会话 `state.json` 是否出现 `pending_skip_rewind`。
2. **Claude Code 对三项设置的处理。** job 配置了记忆目录以外的 `additionalDirectories` 时，附加目录 `CLAUDE.md` 的自动加载被重新打开，记忆板是否因此在系统提示第 4 层之外再加载一次（2.2、3.5）；自操作工具带的 `"anthropic/alwaysLoad"` 标记起什么作用（4.1）；排查建议里的 `DISABLE_THINKING` 等四个环境变量是否被 Claude Code 读取（7.7）。
3. **后台分区总纲如何进入分区会话（11.3）。** Claude 分区以分区目录为工作目录、启用 project 设置来源，`subconscious/CLAUDE.md` 是否经 Claude Code 的上级目录加载进入会话，分区自己的 `CLAUDE.md` 是否因此加载两次；Codex、Grok、pi 分区是否读到总纲。
4. **Codex app-server 的行为。** dynamic tools 把参数都声明为字符串时，ManageJob 的布尔参数 `stateless` 与数组参数 `allowedTools` 能否按原类型到达工具体，缺少 `action` 的调用是否在调用前被必填列表拦下（4.1、4.2）；握手时退订推理增量通知之后，Codex 是否不再发送推理文本（3.7）；`thread/resume` 是否保留建线程时的 `baseInstructions`，`thread/fork` 是否继承父线程的对话历史（13.2）；Codex 是否按约定读取工作目录的 `AGENTS.md`（2.4）。
5. **Grok CLI 续接会话时是否保留 `rules`（2.4）。** `append` 模式的系统提示只随 `session/new` 发送，续接后是否仍然生效取决于 Grok CLI。
6. **pi SDK 的两项行为。** 是否在执行工具前按 zod 转换出的 JSON schema 校验参数，这决定 ManageJob 工具体里的动作检查在 pi 上能否走到（4.1、4.2）；pi-worker 创建会话时传入的 "noContextFiles" 的确切含义（2.4）。

### 14.2 需要在运行中的实例上观测的项

这一类的代码路径已经清楚，缺的是部署环境里的实际取值或长期运行的数据。

1. **部署后的 daemon 有没有身份层（2.1）。** 身份提示只从 `ALADUO_META_PROMPT_PATH` 或 `ALADUO_BOOTSTRAP_DIR` 定位，daemon 与 CLI 代码都不给这两个变量赋值，所以没有在 shell、launchd 环境或 `~/.config/duoduo/.env` 里设置它们的部署，系统提示没有身份层。验证方法：对只读 TCP 端口调用 `system.config`，看 `paths.bootstrap_dir` 与 `paths.meta_prompt_path` 的 `source` 是否为 `env`（`bootstrap_dir: qn("ALADUO_BOOTSTRAP_DIR", e.bootstrapDir)`（`buildSystemConfigReport`）；未设置时这个字段报告的是按包位置推出的默认目录，身份提示查找并不使用它）。上游技能 `skills/duoduo-runtime-admin/references/subconscious-refresh.md` 写的是身份提示在运行时从 npm 包的 `bootstrap/` 目录读取，与代码不符，以代码为准。
2. **去重表的增长（5.3）。** `var/registry/dedup.jsonl` 与内存中的去重 Map 没有淘汰，长期运行下文件的增长速度和 daemon 常驻数周后的内存占用没有测量。
3. **记忆系统在真实记忆上的运行（12）。** 第 12 节关于可达性、任务单投递、遗忘 GC 和两个分区改写的结论都来自代码与提示词原文，没有在记忆目录有真实内容、两个实验开关打开的实例上观测过。
4. **控制面方法的实际返回（附录 B.2）。** 33 个方法来自分发链代码；在运行中的 daemon 上实际调用过的只有经只读 TCP 端口的 `system.status`（返回结果）与 `session.list`（返回 `-32601`），以及经 unix socket 的 `session.list`。
5. **launchd 托管时残留的重启原因文件（6.4）。** macOS 上由 launchd 托管的重启，CLI 在健康检查超时后不删除原因文件；如果新 daemon 一直没有启动成功，之后任何一次成功启动的 daemon 都会认领这条旧原因并投递其中的唤醒目标。验证方法：让 launchd 托管的 daemon 在重启后启动失败，再手动启动，观察重启提示与唤醒投递。
6. **飞书适配器的两个产物是否为同一构建（9.2）。** 第 9.2 节依据包内的 `dist/release/feishu-gateway.js`，实际运行的是 `duoduo channel install` 装入的 `@openduo/channel-feishu`；两者的差异没有对比。

### 14.3 由静态阅读推出、尚未复现的后果

这一类是按代码路径推出的具体后果，其中几项是缺陷，需要构造场景复现。

1. **插话与 drain 失败叠加时事件不重送（7.7、8.2）。** 插话回调把正在运行的 drain 已经取走的事件当作已处理并标记完成；这个 drain 若以 7.7 表第四行的错误结束，窗口里锚点以外的事件和已经注入的插话消息都已从邮箱删除，不会再送给引擎。复现步骤：让两条用户消息合并为一个窗口，在 turn 进行中再发第三条，然后让引擎端点报错，检查这三条消息是否得到重试。
2. **遗忘 GC 在默认布局下的提交（12.3）。** `forgetMemoryEntry (_we)` 以内核的 memory 目录为工作目录，而 `git diff --name-only` 输出相对仓库根的路径，于是带路径的 commit 与回滚用的 checkout 都因路径不匹配失败，删除停在暂存区，不出现 "forget:" 提交。这已在本地临时仓库上复现，需要在两个实验开关都打开的 daemon 上确认，并观察 memory-committer 之后是否把暂存的删除提交进去；CLI 的 `duoduo memory reclaim` 使用同一段代码。同一批里只要有一个 STALE 文件有本地修改，`git rm` 就整体失败，这次心跳什么也不删。
3. **效果记录判定词的小节名不一致（12.2）。** 解析函数只在 `updater guidance:` 小节下找判定词，intuition-weaver 提示词给出的模板用的是 `Board guidance:`，所以"变弱且已裁定删除的节点不发 revise 任务单"这条排除可能从不生效。
4. **entity-lint 的日期戳计数只匹配 2026 年（12.2）。** 其他年份的日期不参与实体档案的排序。
5. **通知链深度按值复制的实际效果（4.3）。** 深度只在 Claude 一次性调用上逐跳累加，在常驻流式会话、Grok 与 Codex 上停在构造工具集时的值，pi 上恒为 0；这条循环保护对真实的互相通知循环能拦下多少，没有测过。
6. **orphan job 会话收到 Notify 之后（4.3）。** 向 job 已归档或已重建、但会话目录仍在的 job 会话键发 Notify 会照常投递；这个 actor 是否会在没有任务书的情况下调用模型，没有测过。
7. **分区会话能否经 unix socket 创建 job（11.4）。** 自操作工具不给分区会话提供 ManageJob，但分区会话有 Bash，以 daemon 的同一操作系统用户运行，技术上可以调用控制面的 `job.create`。
8. **分区会话保持输入通道的开关是否起作用（11.3）。** 出厂分区的工具面里没有 `Agent`，按 7.6 的登记规则，默认安装下 Claude 分区会话不产生需要等待的后台任务，`holdInputOpenForBackgroundAgents` 实际不改变行为。
9. **附件排进另一个会话时的送达时机（4.5）。** QueueOutboundAttachment 的 `session_key` 指向另一个会话时，文件进入那个会话的待发列表，应在那个会话下一次 turn 结束时发出。

### 14.4 只因函数没有真名而标为未证实推测的项

正文里还有一批未证实推测，代码已在 pretty bundle 读到，缺的只是一个构建检查能核对的引用，因为实现它们的函数或存放常量的模块初始化器没有真名。给这些函数在 `reconstruction/maps/inferred_daemon.json` 登记推断名之后（cli bundle 目前还没有推断名映射），对应主张可以改成按名引用并标 confirmed。表中有几项由代码推出的后果另在 14.3 列为待复现的项，这里只列代码本身。按节列出如下：

| 节 | 只因函数没有真名而未证实的主张 |
|---|---|
| 2 | 验收说明的文字（2.1）；`@include` 解析中相对路径、`#` 片段、frontmatter、注释与代码块的规则（2.2）；四类瞬时块的正文、时间块的阈值比较、压缩提示与记忆板提示的首次判定、中断标记的文字（2.3）；Claude 系统提示关闭快照的规范化、daemon 侧 pi 适配器的模式转换（2.4） |
| 3 | pi 适配器按排除列表去掉工具、忽略 Claude 的内建工具面（3.7） |
| 4 | 从会话键前缀推断来源、Codex dynamic tools 的字符串 schema（4.1）；Notify 工具体里的内容、深度与自身检查，job owner 的解析，两个关联参数的提供范围（4.3）；pi 适配器自报 skipped（4.5） |
| 5 | drain 路径写 `agent.result`、`agent.tool_use`、`agent.tool_result` 的函数（5.2）；by_id 索引保留期的读取与裁剪，`duoduo spine` 的本地读取（5.4） |
| 6 | 只读端口放行的六个方法名、`duoduo daemon token new` 的写入与轮换规则（6.1）；WebSocket 身份参数与工作目录的解析顺序（6.2）；routing policy 与 `turn_meta` 的附加条件、job 与 meta 记录直接标为已送达（6.3）；CLI 写入与清理重启原因文件、`duoduo upgrade` 的重启与 `--wake` 投递（6.4） |
| 7 | 合并 prompt 的文字（7.2）；去掉 resume 的重试包装（7.3）；中断说明的插入（7.5）；上下文 profile 解析失败时的 `context_profile` 阶段（7.7） |
| 8 | stdio 会话键的构造、从前缀推断来源、标记完成即删除邮箱项文件（8.1）；`session.archive` 处理函数的前置拒绝与重新唤醒（8.2） |
| 9 | CLI 的渠道插件安装、启动、环境变量传递与停止（9.1、9.3）；WebSocket 身份参数（9.1） |
| 10 | 一次性调度的判定，尚未认领的 once 与 @in 等待 run_at（10.1） |
| 11 | 必须有输出的两个分区的名单（11.3）；pi 适配器忽略 `tools`（11.4）；出厂文件的复制、`DUODUO.md` 的刷新与 `.gitignore` 模板（11.5） |
| 12 | activation 窗口的计日与路径匹配、效果记录判定词的解析、entity-lint 的日期戳计数、gap 已交清单的文件名与首次播种、指标记录的写入（12.2）；`duoduo memory reclaim` 的处理与删除函数（12.3） |

## 附录 A 短名与真名

本文 `真名 (短名)` 引用里的真名来自 esbuild 的 `__export` 表或登记过的推断名，短名是对齐版本的美化 bundle 里的 mangled 名；esbuild 每次构建都重新 mangle，所以短名只对本文对齐的版本有效，跨版本请以真名为准。完整对照表按子系统列在 [`reconstruction/maps/RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)（cli 见 [`RENAME_TABLE_cli.md`](../reconstruction/maps/RENAME_TABLE_cli.md)），可读源码按子系统拆在 [`reconstruction/first-party/`](../reconstruction/first-party/)。

## 附录 B 事件类型与 RPC 方法全集

本附录列出三份名单，用来区分三类容易混淆的名字：写进事件日志的事件类型、控制面的 RPC 方法、只读 TCP 端口放行的方法。进程内总线事件（例如 `session.wake`、`cadence.tick`）与 `route.deliver` 的来源类型（例如 `notify`、`self-wake`）都不是落库事件类型，见 5.2。

### B.1 落库事件

经 `createSpineEvent (rn)` 封装、再经 `atomicAppendEvent (on)` 写入事件日志的类型一共 13 种；bundle 中这两个函数的调用点一一对应，没有绕过封装直接追加的写入。各类型的写入方与写入时机见 5.2；下表补充每种事件的 `source.kind`，第 11.2 节的活动指纹与 gap-lint 按它区分内部与外部事件（`cadence`、`meta`、`system`、`runner`、`route`、`gateway` 为内部来源）。

| 类型 | `source.kind` | 写邮箱指针 | 正文 |
|---|---|---|---|
| `channel.message` | 渠道给出的 `source_kind`；经 HTTP 调用且未给时为 `rpc` | 路由目标为 session 时写 | 5.1、6.2 |
| `channel.command` | 同上；`session.compact` RPC 发出的为 `rpc`，空闲压缩扫描器发出的为会话索引里记录的渠道种类 | 只有 `/compact` 与带参数的注入提示写 | 6.2、8.4 |
| `channel.attached` | 由会话键推出的渠道种类 | 否 | 5.2 |
| `route.deliver` | `route` | 默认写；`walOnly` 时不写 | 4.3、5.1、10.3 |
| `agent.result` | drain 为 `runner`，网关命令回复为 `gateway`，后台分区为 `meta` | 否 | 5.2、6.2、11.3 |
| `agent.error` | drain 与 `handleDrainError (Xw)` 为 `runner`，后台分区为 `meta` | 否 | 7.7、11.3 |
| `agent.tool_use`、`agent.tool_result` | drain 为 `runner`，后台分区为 `meta` | 否 | 5.2、11.3 |
| `job.spawn` | 扫描器为 `cadence`；会话管理器与 `job.create` 为 `job` | 只有扫描器写的这一条带指针 | 5.1、10.2 |
| `job.complete`、`job.fail` | `job` | 否（结果另经 `route.deliver` 投递给 owner） | 10.3 |
| `system.cadence_tick` | `system` | 否 | 11.1 |
| `config.changed` | `rpc` | 否 | 5.2 |

按这张表与 11.2 的判定可以直接推出：job 的生命周期事件、渠道挂接、配置变更，以及 `session.compact` 与空闲压缩发出的 `/compact`，都算外部活动，都会改变 11.2 的活动指纹。

### B.2 控制面 RPC 方法

`createDaemon (Lyt)` 的分发函数按方法名逐个比较，识别下面 33 个方法，其余方法返回 `-32601`；三个监听器共用这一个分发函数（6.1）。表中按用途分组，"处理"一栏给出有真名的处理函数，没有真名的写"内联"或注明。

| 分组 | 方法 | 处理 | 正文 |
|---|---|---|---|
| system | `system.shutdown` | 内联：先响应，再向自身发 SIGTERM | 6.1 |
| system | `system.runtime.info` | 内联：返回实例身份；带 `source_kind` 时附该种类的 `new_session_workspace` | 3.2、9.1 |
| system | `system.status` | 内联：健康状态、心跳、会话、轮转表与记忆检查状态 | 11.1、12.2 |
| system | `system.config` | `buildSystemConfigReport (lyt)` | 3.7、4.3、8.3 |
| channel | `channel.describe` | `describeChannelInstance (_yt)` | 9.1 |
| channel | `channel.spawn` | `upsertChannelSpawnDescriptor (Ayt)` | 3.3、9.1 |
| channel | `channel.ingress` | `ingestChannelMessage (Gle)` | 6.2 |
| channel | `channel.command` | `ingestChannelCommand ($b)` | 6.2 |
| channel | `channel.file.upload`、`channel.file.download` | 内联 | 9.1 |
| channel | `channel.pull` | 内联；能力声明由 `recordChannelCapabilityDeclaration (pyt)` 记录，积压由 `readOutboxRecordsPastCursor (Pw)` 读取 | 6.3 |
| channel | `channel.ack` | 内联；by_id 索引缺失时由 `backfillOutboxByIdIndexFromReplay (jR)` 补建 | 6.3 |
| session | `session.list` | 处理函数没有真名 | 8.1 |
| session | `session.archive` | 处理函数没有真名，移动文件的是 `archiveSessionAndArtifacts (Ybe)` | 8.2 |
| session | `session.set_alias` | 处理函数没有真名，写显示名的是 `updateSessionDisplayName (ole)` | 8.1 |
| session | `session.notify` | `deliverExternalSessionNotify (A0e)` | 4.3、8.5 |
| session | `session.wake` | `scheduleSessionWakeRecord (Syt)` | 4.4、8.5 |
| session | `session.model` | `readOrSetSessionModel (xyt)` | 3.4、8.5 |
| session | `session.effort` | `readOrSetSessionEffort (Eyt)` | 3.4、8.5 |
| session | `session.compact` | `enqueueSessionCompactCommand (Ryt)` | 6.2、8.5 |
| session | `session.config` | 处理函数没有真名，改配置后由 `appendConfigChangedEvent (ty)` 追加 `config.changed` | 3.3、5.2 |
| job | `job.create` | 内联，参数由 `isJobCreateParams (J0)` 校验 | 10.1 |
| job | `job.get`、`job.list`、`job.archive`、`job.reschedule`、`job.interrupt` | 内联 | 10.4 |
| pi worker 回调 | `job.manage` | `runManageJobTool (cg)` | 4.1、6.1 |
| pi worker 回调 | `session.manage`、`notify.send`、`wake.set` | ViewSessions、Notify、RemindDuoduo 的工具体（都没有真名） | 4.1、6.1 |
| 其他 | `usage.get` | 内联；读取 `readDrainRecords (Vm)`、`readGlobalUsageTotals (lU)`、`readAllSessionSummaries (uU)` | 7（关键数据结构）、11.3 |
| 其他 | `spine.tail` | `readSpineTail (rve)` | 5.4 |

四个 pi worker 回调方法只接受带有效 worker 口令的调用，带口令的调用也只能使用这四个方法（6.1）。其余方法在 unix socket 与远程监听上都可用，本机 TCP 端口只放行 B.3 的六个。

### B.3 只读 TCP 端口放行的方法

本机 TCP 端口（默认 20233）只放行六个只读方法：`system.status`、`usage.get`、`job.list`、`spine.tail`、`system.runtime.info`、`system.config`；其他方法以 HTTP 200 返回 `-32601`，消息为 "Method not available on read-only endpoint"（6.1）。这个集合是一个没有真名的模块级常量，方法名是在 pretty bundle 读到的，属未证实推测；集合的存在与拒绝逻辑由 `createDaemon (Lyt)` 里的调用点确认，运行中的 daemon 上对 `system.status` 放行、对 `session.list` 拒绝也已观测到（证据约定）。

### 证据表

| 机制主张 | 代码证据 | 置信 |
|---|---|---|
| 落库事件的 13 种类型与写入方 | `createSpineEvent (rn)`；`atomicAppendEvent (on)`；逐类引用见 5.2 的证据表 | confirmed（bundle 中 `createSpineEvent` 的 23 处调用与 `atomicAppendEvent` 的 23 处调用一一对应） |
| 渠道消息与命令的来源种类取自调用方 | `kind: t.sourceKind,`（`appendBeforeExecuteGateway`）；`N = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc")`（`createDaemon`） | confirmed |
| 渠道挂接的来源种类是会话键推出的渠道种类 | `name: "session-manager"`（`createSessionManager`）；`channel_kind: L,`（`createSessionManager`） | confirmed |
| 会话间投递的来源种类缺省为 route，调用方都不另给 | `kind: s ?? "route"`（`deliverRouteEventToSession`）；`sourceKind: "route",`（`deliverExternalSessionNotify`） | confirmed（其余调用方不传 `sourceKind`；Notify 工具体传 `route`，它没有真名） |
| drain、网关与后台分区的来源种类 | `kind: "runner",`（`handleDrainError`）；`kind: "runner",`（`drainSessionMailbox`）；`kind: "gateway",`（`replyToGatewayCommandEvent`）；`kind: "meta",`（`createMetaSession`） | confirmed（drain 路径写 `agent.result`、`agent.tool_use`、`agent.tool_result` 的函数没有真名，它们的 `runner` 为未证实推测） |
| job、心跳与配置变更的来源种类 | `kind: "job",`（`createJobSessionFinalizer`）；`name: "job-scanner"`（`scanAndSpawnDueJobs`）；`name: "cadence"`（`runCadenceTick`）；`name: "session.config"`（`appendConfigChangedEvent`） | confirmed |
| 两条 `/compact` 路径的来源种类 | `sourceKind: "rpc",`（`enqueueSessionCompactCommand`）；`let D = I.channel_kind,`（`createIdleCompactSweeper`） | confirmed |
| 分发函数识别 33 个方法，未匹配的返回 -32601 | `S.method === "system.shutdown"`（`createDaemon`）；`S.method === "spine.tail"`（`createDaemon`）；`message: "Method not found"`（`createDaemon`） | confirmed（`createDaemon` 中 `S.method === "…"` 的比较共 33 个互不相同的方法名） |
| 有真名的处理函数 | `C.result = await A0e(u, l, d, k)`（`createDaemon`）；`C.result = await xyt(d, F, k)`（`createDaemon`）；`C.result = await Ayt(u, d, k)`（`createDaemon`）；`C.result = await lyt(u)`（`createDaemon`） | confirmed（无真名的处理函数调用哪些具名函数，是在 pretty bundle 读到的） |
| pi worker 回调方法与口令 | `requires a pi worker token`（`createDaemon`）；`Method not available to pi worker callers`（`createDaemon`） | confirmed |
| 只读端口的放行集合与拒绝 | `if ($ && !ryt.has(k.method))`（`createDaemon`）；`"Method not available on read-only endpoint"`（`createDaemon`） | confirmed（集合存在与拒绝逻辑）；六个方法名为未证实推测（集合是没有真名的模块级常量） |
