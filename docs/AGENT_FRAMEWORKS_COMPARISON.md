# 三个自治 Agent 框架对比调研：duoduo · hermes-agent · pi

> 调研日期：2026-07-03。
> 调研目标：理解三个项目各自的设计思路与实现逻辑，比较优劣，为构建**充分运用贝叶斯第一性原理、可持续自我迭代、擅长 long-horizon 金融预测任务的 agent** 提供选型与融合架构依据。
> 版本对齐：本文关于 duoduo 机制的陈述（速览表的 duoduo 列、§1、§4 与 §5 的 duoduo 部分、§6 对 duoduo 机制的引用）对齐 `@openduo/duoduo` **v0.8.3**，已逐条对照本仓库的还原源码 `reconstruction/recon/daemon.recon.js` 与出厂分区提示词 `subconscious/` 核实。标"实测"的 duoduo 运行行为来自 [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md) 记录的早期版本部署，v0.8.3 未重新实测。hermes-agent 与 pi 的全部事实来自 2026-07-03 的调研（源码快照见附录），未随其上游更新，也未重新核实；横向对比（§4–§7）中涉及这两个项目的判断以该快照为准。
>
> 取证方式：duoduo 的事实来自本仓库对压缩运行时的还原源码（入门读 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)，逐机制证据见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)，部署与运维见 [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md)，下文分别简称 GUIDE、INTERNALS、ARCHITECTURE）。本文按符号名引用 duoduo 代码，写作 `真名 (短名)` 或 `代码片段`（`真名`），短名是 beautify 后 `daemon.pretty.js` 中的 mangled 名，两种写法都由构建中的验证工具核对。hermes-agent 与 pi 的事实来自克隆源码后由独立分析 agent 的系统阅读，关键论断带 `文件:行号` 证据。

---

## 0 结论

**三个项目对"agent 的哪一部分交给代码"给出不同答案：duoduo 把存储、调度、并发和边界检查交给代码，推理和记忆内容的修改交给模型，是三者中唯一同时具备事件日志、定时的后台自我维护、记忆整理流程和可回滚自我修改的运行时，但代码闭源；hermes-agent 把缓存、崩溃恢复和安全边界交给代码，模型只能修改 skills 与记忆；pi 只把 agent 循环、会话树和多模型接入做进核心，其余能力由扩展提供，没有调度和跨会话记忆。**

对目标 agent 而言，三个项目能提供的东西不同：duoduo 提供可参照的自治运行时设计，hermes-agent 提供长驻运行、崩溃恢复与学习闭环的开源实现，pi 提供可以直接复用的开源库。**目标 agent 最核心的贝叶斯层（预测记录簿、显式概率信念库、校准回路）三者都没有，必须自建**，融合路线见 §6。

### 三项目速览

| | **duoduo** | **hermes-agent** | **pi** |
|---|---|---|---|
| 出品方 | openduo | Nous Research | Earendil Works（Mario Zechner，libGDX 作者） |
| 定位 | "会自我编程"的长驻自治 agent **运行时** | 自我改进的长驻**个人 agent**，"活在你所在的地方" | 自我可扩展的**极简编码 harness**（库 + 终端产品） |
| 语言与形态 | Node.js daemon（npm 分发压缩后的 JavaScript；beautify 后的行数见 [`pipeline_report.json`](../reconstruction/maps/pipeline_report.json) 的 `bundles.daemon.prettyLines`） | Python 单体核心（约 62 万行非测试代码）+ TS 界面层（约 26 万行） | TypeScript monorepo，5 个包共约 10.9 万行源码 + 8.1 万行测试 |
| License | **Private，All rights reserved**（闭源） | MIT | MIT |
| 推理引擎 | 委派给 Claude Agent SDK、Codex、Grok 或 pi（配置字段 `runtime` 的四值枚举 `claude`/`codex`/`grok`/`pi`）；pi 引擎就是本文 §3 的 pi（npm 依赖 `@earendil-works/pi-coding-agent`，随 duoduo 一起安装），模型与 provider 由用户自己的 pi 配置决定 | 自建 API 层，30 家 provider、5 种 api_mode | 自建 pi-ai 层，9 种协议 × 35 个 provider × 1034 个模型 |
| 持久化方式 | **应用层事件日志（WAL）**，状态全部存为文件，不用数据库 | SQLite transcript 库（WAL 模式）+ 文件式记忆 | append-only JSONL **会话树**（可分支、可 fork，没有全局事件日志） |
| 后台自治 | 心跳（默认每 37 分钟一次）触发后台分区会话；没有消息时也会运行，活动指纹不变时跳过 | gateway 常驻 + cron 调度器 + 后台 review agent | **无**（没有调度器和守护进程；可经 RPC/SDK 由外部驱动） |
| 自我迭代面 | 提示词结构可自改（分区、轮转表 `playlist.md`、记忆板），git 回滚 | skills + memory 知识层（禁止自改代码与配置） | agent 可以给自己写扩展和 skill，`/reload` 立即生效（不会自主发起） |
| 跨会话记忆 | 记忆板 + 经 `[[slug]]` 链接的档案与规则节点 + 效果记录，由后台分区自动维护 | MEMORY.md/USER.md + FTS5 全历史检索，后台自动沉淀 | **无**（只有静态的 AGENTS.md，从不自动写入） |

---

## 1 duoduo：可从崩溃中恢复的长驻 agent 运行时

### 1.1 定位与设计原则

duoduo 是一个让大语言模型无人值守持续运行的程序；模型自身做不到的事（保存状态、调度、并发、边界检查）由运行时代码完成，需要判断的事交给模型。它是一个长驻的 agent 运行时，不是一次性的请求/响应包装器：状态保存在文件里，进程崩溃后从文件恢复。分工规则是：确定性的事交给代码，包括存储、排序、调度、并发、测量、校验；需要判断的事交给模型，包括推理、写作、决定记住什么、决定改什么。模型在配置里按引擎设置，换用其他模型只需改配置，不需要改运行时代码（INTERNALS 3.4）。

运行时以压缩后的 JavaScript 发布在 npm，GitHub 仓库不含源码，许可为 Private。上游 README 的说法是：agent 能直接读懂压缩后的代码，压缩不是混淆，只是为了省带宽、少占上下文窗口。本仓库已把它还原为可读、并经 AST 等价证明可以同样运行的源码（见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md)），因此下述机制都有源码级证据。

### 1.2 架构与核心机制

duoduo 是一个 daemon 进程，使用两个根目录：`~/aladuo` 是内核，存放 agent 的设定、提示词与记忆，由 git 管理，每个提交都是回滚点；`~/.aladuo` 是运行时数据（`var/`、`run/`）。控制面有三个入口：完整控制 JSON-RPC 走 unix socket（`~/.aladuo/run/daemon.sock`，文件权限 0600，所在目录必须归当前用户所有且权限为 0700，否则 daemon 拒绝启动）；`127.0.0.1:20233` 的 `/rpc` 只放行 6 个只读方法，同一端口的 `/dashboard` 返回包内的单文件页面 `dashboard.html`；带 bearer token 的远程完整控制监听只有在 `ALADUO_DAEMON_HOST`、`ALADUO_DAEMON_TOKEN`、`ALADUO_REMOTE_PORT` 三项同时设置时才开启（`resolveRemoteListenerConfig (jyt)`）。

**机制一：事件日志先追加、后执行（`atomicAppendEvent (on)`；网关入口 `appendBeforeExecuteGateway (Kle)`，confirmed）。** 每条入站事件先由 `appendEventToPartition (X9e)` 追加一行到 `var/events/YYYY-MM-DD.jsonl`，再追加一行 by_id 索引，之后才写邮箱指针、唤醒会话执行。这是两次写，不是原子事务：函数名里的 atomic 不表示两次写构成一个事务，进程在两次写之间退出时，事件在日志里有、索引里没有，按 id 读取时退回按日期扫描分区文件。索引只有 by_id 一个，没有按会话切分的索引。重启时，`rehydrateSessionState (dse)` 从会话目录与邮箱指针找回待处理的会话，会话再按事件 id 从日志读回正文；会话目录与邮箱指针本身不能从日志重建，消费进度文件只写不读（INTERNALS 5.5）。追加与写指针之间还有一个几次本地文件写入长度的窗口，进程在这里退出时事件留在日志里却没有指针，运行时不补。早期版本部署的实测：执行 `daemon restart` 后 `runtime_id` 不变，会话列表和事件日志里的事件都还在（ARCHITECTURE §7.4）。

**机制二：系统提示与每轮瞬时块分开装配（`buildSystemPromptForChannelConfig (Jh)`、`buildTransientUserBlocks (eke)`，confirmed）。** 稳定内容由 `renderPromptLayers (Nhe)` 按身份、渠道人格（种类与实例两层）、记忆板、运行上下文、任务书的顺序拼成六层，`buildSystemPromptForChannelConfig` 决定整段替换引擎自带的系统提示还是追加在它之后；这段文本不含时间戳，内容不变时 prompt cache 可以持续命中。每轮变化的状态（与上次交互的时间间隔、被打断那一轮的输入、job 回执、记忆板已更新的提醒等）由 `buildTransientUserBlocks` 生成每轮瞬时块，排在用户原文之前一起作为用户消息发送，不改变系统提示。四个引擎（Claude、Codex、Grok、pi）收到同一段系统提示文本，差别只在传入方式：Codex 外层多包一层 `<aladuo:system-context>`，其余三个按 `prompt_mode` 追加在引擎自带的系统提示之后或整体替换它。

**机制三：会话 actor、锁与并发池（INTERNALS 第 8 节，confirmed）。** 每个会话键在 `createSessionManager (Agt)` 的内存 Map 里至多对应一个 actor。会话键的前缀决定会话类别：`job:` 前缀的会话进 job 池；`meta:`、`system:`、`cadence:` 前缀的会话来源为 system，拿到的自操作工具更少；对外的会话 RPC 也按前缀拒绝越界操作。锁有三种：进程写锁 `acquireRuntimeWriterLock (p6)` 跨进程、跨重启，保证一个数据目录只有一个 daemon 写入；drain 租约文件 `run/locks/<会话键哈希>.json`（`acquireSessionDrainLock (gSe)`）保证同一会话同一时刻只有一个 drain 处理邮箱；进程内的异步互斥 `runWithSessionMutex (Vi)` 按会话键串行执行状态文件改动。并发池有两个，渠道池默认 10 个位置、job 池默认 6 个；actor 空闲时先释放池位，空闲超时（默认 1 小时）后，没有渠道附着的 actor 结束，有渠道附着的会话保留 actor、只关闭引擎进程。模型运行中到达的普通消息先尝试插话：Claude 渠道会话在下一次工具调用完成后把消息插入当前 turn，Codex、Grok、pi 经引擎自己的插话接口送入；插不进时才软抢占：Claude 渠道会话等引擎接纳当前 prompt 后立即中断，没有常驻连接的会话在模型输出文本时推迟到下一次 `tool_use` 开始、有工具在执行时推迟到在途工具调用全部返回（`requestBoundaryAwarePreempt (zS)`）；用户的 `/cancel` 立即中止当前一轮。

**机制四：前台会话与后台分区两条循环（`drainSessionMailbox (KSe)`、`createMetaSession (Wgt)`，confirmed，早期版本实测）。** 前台会话处理实时消息；后台分区（上游 subconscious）由心跳（cadence）触发，心跳默认每 37 分钟一次，可用 `ALADUO_CADENCE_INTERVAL_MS` 调整。每次心跳，后台分区调度器依次做四项检查：重入与停机；活动指纹，即 memory 下 fragments、entities、topics 三个目录的最新修改时间加最新一条外部事件的 id，与上一次心跳相同就跳过整次心跳（`hashActivityFingerprint (qgt)`）；每个分区的冷却与连续失败退避（`computePartitionBackoffUntil (b6)`）；前台活跃度，活跃会话不超过一个时才在同一次心跳里追加运行第二个分区。通过检查的分区以一个不保存历史的一次性会话运行。后台分区总纲（`subconscious/CLAUDE.md`）的说法是：每次心跳通常唤醒一个分区，系统空闲时调度器可以按配置的上限多唤醒几个，每个分区做完就结束，除了写进文件的内容，不记得上一次。代码里这个上限固定为每次心跳至多两个分区：`main` 构造后台分区调度器时不传这个参数，也没有对应的环境变量（`e.maxPartitionsPerIdleTick ?? 2`（`createMetaSession`））。分区的运行顺序由纯文本轮转表 `playlist.md` 决定，agent 自己可以改写它。

**机制五：记忆系统，代码测量、模型修改（INTERNALS 第 12 节，后台分区见第 11 节，confirmed）。** 一条记忆是否还在被使用，用图可达性度量：记忆板 `memory/CLAUDE.md`（上游 broadcast board）是唯一的根，沿 `[[slug]]` 链接走不到的节点是孤儿。daemon 只做两件事：只读检查（行数、行长、断链等测量，结果以任务单投给声明消费该信号的分区），以及默认关闭的遗忘 GC（`forgetMemoryEntry (_we)`：两个实验开关都打开，文件在 `memory/topics/` 下、不可达、没有其他文件引用、最后修改已满 48 小时，才用 `git rm` 删除，被删文件可以从 git 历史找回）。daemon 不修改任何记忆内容，内容的全部修改交给后台分区。

出厂四个分区的分工写在各自的提示词里：gradient-distiller 读事件日志、写证据碎片（fragment），此外只写自己的 `scan-gap.cursor`（任务单没读完时的续读进度，不是记忆证据），读完后删除自己收件箱里的这张任务单作为确认；pattern-tracker 是 `lesson-`、`groove-` 规则节点的唯一写者；intuition-weaver 是记忆板、效果记录（effectiveness）与实体档案的唯一写者；memory-committer 把记忆板、档案与规则节点的改动提交进 git，碎片与效果记录被 `.gitignore` 排除，不进 git。"事件 → 碎片 → 效果记录 → 修改记忆板"每一步都留下文件，提示词要求报告里的计数能从磁盘重新数出来（运行时不检查），用来防止模型编造统计数字。实体档案里的陈述带六种认知状态标签：`[observation]`、`[inference]`、`[instruction]`、`[conditional]`、`[hypothesis (unratified)]`、`[superseded]`。完整的循环是：经验写进事件日志，后台分区把它加工成碎片、效果记录和记忆板的修改，下一次会话经系统提示读到记忆板。

**机制六：后台分区可以修改自己的提示词结构，边界分代码检查与提示词约束两层。** 分区可以改自己的提示词、新建分区、调整轮转表、写记忆板；后台分区总纲禁止它们改事件日志数据、锁文件、收件箱目录（只能删除自己收件箱里已处理的任务单）、其他分区的 `CLAUDE.md`、任何分区的 `contract:` frontmatter，也不许自建 job。内核目录是 git 仓库，memory-committer 每次运行把允许范围内的改动合成至多一个提交，每个提交都是回滚点。这些边界里由代码强制的有三处：契约过滤（`enforceContractGate (iO)`，六种拒绝原因，决定运行时的任务单投给哪个分区）；分区工具白名单（`PARTITION_CORE_TOOLS (mB)` 的六个工具加 frontmatter `claude.tools` 追加的项，只在 Claude 引擎上生效：Codex 的内置工具无法禁用，靠沙箱限制可写目录，Grok 与 pi 的适配器不使用这份列表）；自操作工具层不给分区会话 ManageJob（`createAladuoMcpServer (Yg)`、`buildCodexDynamicTools (wA)`；pi 引擎例外，pi 上的分区会话能调用 ManageJob create）。其余边界只写在提示词里，由模型遵守；分区会话有 `Bash`，权限模式默认 `bypassPermissions`，能写操作系统用户有权限的任何路径。

分区之外，运行时整体由代码强制的检查还有：渠道与 job 会话的 Claude 工具白名单（`CLAUDE_CORE_TOOLS (Hh)` 的 15 个工具加 `claude.tools` 追加的项；`disallowedTools` 只用于排除 MCP 工具，`"disallowedTools no longer governs built-in tools"`（`createAgentSdkAdapter`））、控制面三个监听器的访问控制、进程写锁、会话 RPC 的前缀隔离、ManageJob 的创建条件、Notify 的拒投和遗忘 GC 的条件（完整清单见 GUIDE 5.1 与 INTERNALS 的"结论"一节）。逐项划清"哪些约束必须由运行时代码强制、哪些可以留在提示词里"，是这个设计里最值得借鉴的一点。

### 1.3 优势与局限

**优势**
1. **后台自我维护做进了运行时**：进程崩溃后从文件恢复（早期版本实测重启后会话与事件完好）；没有消息时心跳也会运行后台分区，活动指纹不变时跳过，不产生模型调用；每次 drain 和每次分区运行都记入用量账本 `var/usage`，后台开销按分区名分开记录。
2. **记忆整理流程的自动化程度最高**：从事件到记忆板的每一步都由后台分区自动执行，每一步都留下可以查看的文件（事件 → 碎片 → 效果记录 → 记忆板修改）。
3. **分工规则清楚**：确定性的事交给代码（可达性计算、只读检查、遗忘 GC），需要判断的事交给模型（记忆内容改写、碎片的走向判定），这条规则贯穿整个运行时。
4. **自我修改有回滚手段**：分区能修改提示词结构，改动由 memory-committer 提交进 git，任务单的投递由代码强制的契约过滤决定，在"允许演化"与"保持可控"之间取得平衡。
5. **系统提示与每轮瞬时块分开装配**是可以单独复用的设计：稳定内容留在系统提示里，让 prompt cache 持续命中；每轮变化的状态放进用户消息，模型仍能得知时间间隔、被打断等信息。

**局限**
1. **闭源且只发布压缩代码**：许可为 Private，不能 fork，也不能修改内核代码；自定义只能在提示词与分区层进行。审计依赖逆向（本仓库的还原源码解决了可读性问题，不改变许可）。
2. **单机单进程**：用内存 Map 与 Promise 编排，不能横向扩展；控制面按单用户设计（完整控制入口靠 unix socket 的文件权限隔离，远程完整控制访问只凭一个 bearer token，没有多用户与角色区分）；未捕获的同步异常使进程直接退出，靠外部的进程管理器重启。
3. **没有人对话时后台仍可能消耗 token**：在最近一个外部事件（如渠道消息）之后，只要 fragments、entities、topics 三个记忆目录里还有文件在变，每次心跳都可能运行分区；活动指纹只在这三个目录的最新修改时间与最新外部事件都不变时跳过整次心跳（心跳间隔可调）。
4. **引擎种类固定**：配置字段 `runtime` 只有 claude、codex、grok、pi 四个取值，新增一种引擎要等上游支持；模型与 provider 的选择不受这一限制，pi 引擎就是 §3 的 pi，可以使用用户在 pi 配置里接入的任一 provider。
5. **没有预测与校准基础设施**：效果记录的走向（STRENGTHENING/WEAKENING）与 `[hypothesis (unratified)]`→`[superseded]` 标签可以看作信念更新的初步形式，但没有显式概率，也没有打分规则。

---

## 2 hermes-agent：工程实现最完整的开源长驻个人 agent

### 2.1 定位与设计原则

hermes-agent 由 Nous Research 出品，MIT 协议，Python 单体（v0.18.0）。README 自称 "**The self-improving AI agent**"（`README.md:19`），并说明它是唯一内置学习闭环的 agent：从经验中创建 skills，在使用中改进它们，提醒自己沉淀知识，搜索自己的过往对话，跨会话积累对用户的画像。它要解决的问题是：主流 coding agent 只在终端开着时运行，Hermes 要做的是**长驻、跨平台（Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI/TUI/桌面/IDE）、跨会话积累知识、可以无人值守运行定时任务**的个人 agent。

两条原则写在开发者文档的最前面（`AGENTS.md:16-27`），作者说它们决定了几乎每一个设计决策：

1. **"Per-conversation prompt caching is sacred."** 会话中途改写历史上下文、更换工具集、重建 system prompt 都会使缓存失效、增加用户成本，所以一律不做（唯一例外是上下文压缩）。
2. **"The core is a narrow waist; capability lives at the edges."** 每个核心工具都随每次 API 调用发送，所以进入核心的门槛很高；能力扩展全部放在边缘（skills、插件、MCP）。配套的"Footprint Ladder"是一个六级决策框架：新能力从"扩展现有代码"到"核心工具（最后手段）"逐级选择改动最小的一级。

安全原则同样明确：**唯一能对抗有敌意的 LLM 的安全边界是操作系统**，进程内的审批检查和黑名单都只是启发式，容器才是边界（`SECURITY.md:58-65`）。

### 2.2 架构与核心机制

多个入口共用同一个 agent core：CLI 单进程、`hermes gateway` 长驻 daemon（一个进程内约 20 个平台 adapter + cron ticker 线程 + kanban dispatcher）、TUI（Node⇄Python 双进程 JSON-RPC）、Electron 桌面、IDE（ACP 协议）。主循环**完全同步**（`agent/conversation_loop.py:633`）：在迭代预算内反复执行"API 调用 → 工具派发 → 结果回填"，默认父 agent 90 次、子 agent 50 次迭代。

**机制一：缓存工程。** system prompt 分三层组装（`agent/system_prompt.py:113`）：stable（人格、行为指导、skills 索引）→ context（项目文件）→ volatile（MEMORY.md 快照、时间行，放在最后，不指望缓存命中）。有三个固定做法：每个会话只 build 一次并持久化，resume 时直接复用**字节级**相同的 prompt 字符串；时间戳刻意只精确到**日期**（注释说明精确到分钟会让 KV 缓存失效，模型需要精确时间就调用工具）；**skill 全文以 user 消息注入**，不放进 system prompt，所以加载 skill 完全不改变缓存前缀。

**机制二：三层相互独立的记忆。**

- 文件式策展记忆 `MEMORY.md`（agent 的自我笔记）+ `USER.md`（用户画像），采用**"冻结快照"一致性模型**：会话开始时注入，会话中的写入立即原子落盘，但不改 system prompt；写入立即持久化，读取延迟到下一次会话（`tools/memory_tool.py:11-15`）。
- SQLite 会话库：全部对话入库，**两个 FTS5 虚表**（含 CJK trigram）支持 BM25 全历史检索，被压缩归档的旧消息仍可搜到（`hermes_state.py:802-855`），这是"搜索自己的过去"的实现。
- 外部 memory provider 插件 ABC（honcho、mem0、supermemory 等 8 个）。

**机制三：学习闭环（核心功能，已实现）。** 每 N 个用户 turn（默认 10）触发 nudge，**在后台 fork 一个受限的 review agent**（工具白名单只有 memory 与 skill，在 daemon 线程内重放对话快照，不阻塞主会话），反思"这个会话学到了什么"；驱动它的 prompt 明确要求"多数会话至少产出一次 skill 更新"，并优先改进已有 skill 而不是新建（`agent/background_review.py:171-274`）。**Curator** 负责批量整理：确定性的 active→stale→archive 状态机（30/90 天）加可选的 LLM 合并，运行前做 tar.gz 快照以便回滚，只处理 agent 自建的 skill，**从不删除**（`agent/curator.py:291,1537`）。

**机制四：崩溃恢复的系统化措施。** API 调用构造之前就落盘（"early crash-resilience persist"，`run_agent.py:1755`）；SQLite WAL 加周期 checkpoint；重启 resume 前经 `replay_cleanup.py` 清理损坏的尾部（剥掉没有结果的 tool_calls，防止无限重启循环）；gateway 非正常退出时，120 秒内活跃的会话自动续跑；重启熔断器防止崩溃后反复重启。**注意：这是 transcript（事务日志）级的持久化，不是 duoduo 那种应用层事件日志**，后台委派的任务明确不能在进程重启后继续（`AGENTS.md:1011-1013`）。

**机制五：工具体系与安全分层。** 核心约 40 个工具，加上 check_fn 门控（探测失败时自动从 schema 中剔除，带 TTL 缓存）；完整的 MCP 客户端（三种传输、OAuth、恶意包预检）。两个有特色的工具：`delegate_task`（生成受限的子 agent，后台执行，摘要回注）与 **`execute_code` = Programmatic Tool Calling**：LLM 写 Python 脚本，子进程经 Unix socket 回调白名单内的工具，**中间结果不进上下文，只返回 stdout**（"zero-context-cost turns"）。安全方面：`rm -rf /` 级别的硬底线连 yolo 模式也不能绕过；审批分三档（manual/smart/off，smart 用辅助 LLM 评估风险）；六种终端后端（local/docker/ssh/singularity/modal/daytona），Docker 使用 cap-drop ALL；低信任子进程默认剥离 API key。

**机制六：多模型支持。** 30 家 provider 插件 × 5 种 api_mode transport；models.dev 元数据（4000 多个模型的价格、窗口、能力）；credential_pool 多凭据轮换加分级冷却；fallback_chain 跨 provider 故障转移；reasoning 参数先归一化，再翻译成各家的参数格式。**凭据轮换与跨 provider 故障转移是它在多后端支持上的特点。**

**机制七：自主运行。** cron 任务由自然语言 prompt 加调度表达式构成，支持前置数据采集脚本注入、任务链（`context_from`）、按任务覆盖模型与 skills、多平台投递；Chronos scale-to-zero（空闲时进程停止，由外部 webhook 唤醒）；kanban 多 agent 工作队列（SQLite 看板 + dispatcher 自动认领派发）；verification_stop 检查（改了代码却没有新的验证证据就想结束时，强制注入一次验证提示）。**自我修改代码的功能不存在，而且被刻意禁止**：文件工具直接拒绝编辑 config，`hermes update` 需要审批，agent 能修改的只有知识产物（skills 与 memory）。

### 2.3 工程成熟度

Python 总计 130 万行，其中**测试 69 万行、1923 个测试文件**；TS 约 26 万行。代码内的 PR 编号已到 #50372，PR 数量上万，迭代很快。测试规范成熟（hermetic CI、反对 change-detector 测试、依赖设上界并用 SHA 固定版本）。技术债有记录（`gateway/run.py` 是 2 万行的 god-file，官方列为征求贡献的项目）。

### 2.4 优势与局限

**优势**
1. 缓存工程直接降低成本，而这是大多数开源 agent 完全忽视的维度。
2. 学习闭环已经实现：nudge → 后台 review agent → curator 生命周期（带快照回滚）→ FTS 全历史检索，四个环节依次衔接，且不阻塞主对话。
3. 崩溃恢复措施覆盖了无人值守运行中的主要故障。
4. 安全模型分层，并明确说明进程内的检查不是安全边界；硬底线不可绕过。
5. MIT 开源，扩展规则明确（插件有五个接入面，"插件不许碰核心文件"），**可以 fork 和改造**。

**局限**
1. 单机单进程，没有分布式；状态在本地 SQLite。
2. 持久化是 transcript 级而不是事件日志级，没有"每个结论都能回放到当时输入"的审计语义；后台委派的任务不能在进程重启后继续。
3. 主循环完全同步，加上巨型文件（2 万行的 gateway），理解成本高。
4. **自我迭代被刻意限制在知识层**：只能改 skill 与 memory，不能改自身代码与配置。这在安全上是优点，对"可持续自我迭代"则是上限：agent 能积累更多知识，但不能改进自己的架构。
5. LLM 摘要压缩有信息损耗风险，靠 FTS 归档弥补，但需要 agent 主动想到去搜。

**与贝叶斯目标的距离**：全仓库没有任何贝叶斯、概率、校准、打分规则相关的基础设施（grep 证实）；与金融相关的只有 8 个 Excel 建模 skill（DCF/LBO/comps），是投行作业助手，不是预测系统。但它的**冻结快照记忆模型与"批式贝叶斯更新"的结构一致**（先验在会话内冻结、证据立即落盘、下一个周期更新先验），后台 review agent 的模式可以直接复用为**预测结算后的校准复盘 agent**。

---

## 3 pi：核心只含 agent 循环、会话树和多模型层，其余能力都是扩展

### 3.1 定位与设计原则

pi 由 Earendil Works 出品（作者 Mario Zechner，libGDX 作者），MIT 协议，TypeScript monorepo。它自称 "**minimal terminal coding harness**"，主张 "**Adapt pi to your workflows, not the other way around**"，不需要 fork 和修改 pi 的内部代码（`packages/coding-agent/README.md:15`）；README 首页称它为 "**self extensible coding agent**"。

README 里有一段设计声明（`packages/coding-agent/README.md:487-501`），逐条列出主流 coding agent 的标配中 pi 不内置的功能：

- **No MCP**：用"CLI 工具 + README"（Skills）替代，或自己写扩展加回来；
- **No sub-agents**：用 tmux 启动多个 pi 实例，或自己写扩展；
- **No permission popups**：在容器里运行，或用扩展自建确认流程；
- **No plan mode / No built-in todos**（"它们让模型困惑，用 TODO.md 文件"）/ **No background bash**（"用 tmux，完全可观测"）。

安全立场同样明确（`README.md:39`）：pi **不含内置权限系统**，边界整体交给容器或微虚拟机。与 Claude Code 的关系：完全独立实现（不基于 Claude Agent SDK），把 Claude 当作众多后端之一（经 Pro/Max OAuth 接入），同时兼容 Claude Code 的生态（自动读取 `CLAUDE.md`/`AGENTS.md`，可以挂载 `~/.claude/skills`）。**两者的根本差别在于权限与治理放在哪里：Claude Code 内建，pi 全部交给外部，换来一个约 5 万行、行为可预测的核心，缺少的功能由 agent 自己写扩展补上。**

### 3.2 架构与核心机制

五个包同步发版（lockstep），单进程模型（交互 TUI 进程就是全部），**没有守护进程**：

| 包 | 职责 | 规模 |
|---|---|---|
| `pi-ai` | 统一的多 provider LLM 层：9 种协议 × 35 个 provider × 1034 个模型、认证、流式、成本核算 | 约 35.4k 行 |
| `pi-agent-core` | 与 UI 无关的 agent 运行时：loop、工具执行、事件流、消息队列 | 约 8.1k 行 |
| `coding-agent` | 产品层：CLI、四种运行模式、会话树、压缩、7 个工具、扩展系统 | 约 51.5k 行 |
| `pi-tui` | 手写的终端 UI 框架（差分渲染），只有 2 个外部依赖 | 约 12.1k 行 |
| `orchestrator` | **实验性**的多实例监督器（没有测试，官方声明可能随时移除） | 约 2.0k 行 |

**机制一：两层 agent loop 与两个钩子（`packages/agent/src/agent-loop.ts:155-269`）。** 内循环是"流式产出 → 执行工具 → 回填"；外循环在 agent 本该停止时检查 follow-up 队列，有排队的消息就再运行一轮。两个钩子贯穿整个循环：`transformContext`（**每次 LLM 调用前可以重写整个上下文**）与 `prepareNextTurn`（轮与轮之间可以换 context、model、thinkingLevel，压缩和换模型都从这里接入）。另有 steering 与 follow-up 两个队列，支持在运行中调整方向。工具默认并行执行，任一工具声明 sequential 时整批改为串行。

**机制二：极短的系统提示，只给出文档路径（`core/system-prompt.ts:28-173`）。** 默认系统提示全文约 40 行：每个工具一行摘要、两条常驻 guideline，以及 **pi 自身文档在磁盘上的绝对路径**（"用户问到 pi 自己时才去读"）。知识放在文件系统里，不预先放进上下文：Skills 按 agentskills.io 标准**渐进披露**，启动时只注入 name 与 description，任务匹配时由 agent 自己 `read` 全文。

**机制三：append-only JSONL 会话树（`session-manager.ts`）。** 每个会话一个 JSONL 文件，**所有条目都带 `id`/`parentId`**；当前位置是 leaf 指针，`branch()` 只移动指针、不删除历史，`branchWithSummary()` 保留被放弃路径的摘要；`/tree` 在树内跳转，`/fork` 抽出新的会话文件。LLM 上下文由 leaf 回溯到 root 构建。**三者中只有 pi 把多假设分支推演做成了内建功能**，但粒度是会话而不是全局事件，而且**不存在跨会话记忆**（源码证实：没有 memory 工具，也没有自动记忆文件）。

**机制四：压缩（`core/compaction/compaction.ts`，891 行）。** token 超过窗口减去预留量时触发（默认保留最近 20K token）；切点只能落在消息边界，**不会切开 toolCall/toolResult**；由 LLM 生成结构化摘要并**迭代更新**（上一份摘要作为输入）；单轮超出预算时有 split-turn 特例；摘要的 details 结构化记录 `{readFiles, modifiedFiles}`。压缩同样是 append-only，旧条目不改写。扩展可以整体接管压缩策略。

**机制五：扩展系统（核心功能）。** TypeScript 模块经 jiti 在运行时加载，**不需要编译**；约 35 种事件覆盖整个流程：`registerTool`/`registerCommand`、`context` 事件（每次 LLM 调用前修改上下文）、`beforeToolCall`（可拦截）/`afterToolCall`（可改写结果）、`session_compact`（接管压缩）、自定义 provider、自定义 UI；**`/reload` 热重载**。官方的 80 个示例扩展就是那些没有放进核心的功能的参考实现：plan-mode、subagent、sandbox、permission-gate、git-checkpoint 等。`pi install <npm|git>` 安装包含 extensions、skills、prompts、themes 的共享包。

**机制六：pi-ai 多模型层（可以单独使用）。** 9 种线协议（anthropic-messages/openai-completions/responses/codex/google/vertex/bedrock/mistral 等）× 35 个 provider；模型目录从 models.dev 自动生成；OAuth 支持 Claude Pro/Max、ChatGPT Codex、Copilot；**中途换模型是设计目标**：逐条消息的转换器处理跨模型的 thinking 块降级、tool-call ID 重写、给没有结果的 toolCall 补结果等细节；流事件格式统一，约定错误编码在流里、绝不 throw；逐 token 核算成本。

**机制七：自我扩展闭环（已实现，但不会自主发起）。** 证据链：系统提示内嵌自身文档的路径 → `docs/skills.md:1` 写着 "**pi can create skills. Ask it to build one for your use case**" → agent 写好扩展放进 `.pi/extensions/` → `/reload` 立即生效。pi 仓库自身也在用这套机制（`.pi/` 下有 3 个扩展、5 个 prompt 模板，以及一个教 agent 给 pi 添加 provider 的 skill）。**但 pi 不会自主发起任何行为**：所有自我修改都发生在人（或外部驱动程序）发起的会话里，没有 duoduo 那样的心跳与后台分区。

### 3.3 工程成熟度

约 10.9 万行源码加 8.1 万行测试（**测试与源码之比约 0.74:1**，tui 包的测试比源码还多）。突出之处是 **faux provider**：一个注册进真实 provider registry 的进程内假 LLM，让整个 AgentSession 栈不联网、不需要密钥、确定性地运行，回归测试按 issue 编号归档。此外还有 `strict:true` 加 Biome 把警告当错误；供应链加固（精确锁定版本、`min-release-age=2` 防止同日投毒、CI 里 ignore-scripts）；coding-agent 文档 29 篇约 9600 行；依赖很少（coding-agent 只有 18 个运行时依赖，不用任何框架）。弱点是 orchestrator 没有测试。

### 3.4 优势与局限

**优势**
1. 精简的核心与覆盖全流程的扩展点相互配合：核心保持很小，扩展 API 覆盖整个流程，80 个官方示例证明了它的表达能力。
2. 多模型工程的细致程度少见：跨模型切换处理到 thinking 签名与 tool-call ID 这一级。
3. 会话是树、append-only、可审计：分支、回溯、被放弃路径的摘要都不丢失。
4. 测试体系让 agent 行为可以做回归测试（faux provider + 全栈确定性 CI），多数 agent 项目做不到。
5. 自我扩展闭环已经实现，作者用 pi 开发 pi。

**局限**
1. **没有权限系统**（官方承认）：不放进容器运行时，提示词注入可以直接使用用户的全部权限。
2. **没有跨会话记忆**：长期经验只能靠人手工维护 AGENTS.md。
3. **没有自主运行的基础**：没有调度、没有守护进程、没有内置子代理；orchestrator 是没有测试的实验性包。
4. token 核算粗糙（chars/4 启发式）；叙述式的摘要压缩对精确数值和概率不友好。
5. 单会话单 actor，并发靠多进程，进程之间没有共享状态的设施。

---

## 4 横向对比：十个维度

这张表不给三个项目打分，而是指出每个维度上哪个项目的做法最值得借鉴；加粗的单元格就是该维度上最值得借鉴的设计。

| 维度 | duoduo | hermes-agent | pi |
|---|---|---|---|
| **① 设计原则** | **确定性的事交给代码，需要判断的事交给模型**；代码强制的检查集中在少数几处（工具白名单、契约过滤、控制面分层、写锁、遗忘 GC 的条件、ManageJob 的创建条件、Notify 的拒投），分区自我修改的其余边界写在提示词里 | "缓存神圣 + 窄腰核心"：一切决策服从成本与稳定运行 | 精简核心 + 自我扩展：核心只留 loop、会话树、模型层，治理交给外部 |
| **② 持久化与崩溃恢复** | **应用层事件日志（WAL），先追加、后执行**；重启时从会话目录与邮箱指针找回待处理的工作，按 id 从日志读回正文；早期版本实测重启后会话与事件完好 | transcript 级：API 调用前落盘 + SQLite WAL + resume 前清理损坏尾部 + 重启熔断；恢复到"最后一次已提交的往返" | 会话粒度的 append-only JSONL；可恢复、可分支，但没有全局事件日志，也没有后台任务，所以不涉及后台任务的恢复 |
| **③ 上下文工程** | 系统提示与每轮瞬时块分开装配：稳定内容（身份、渠道人格、记忆板）进系统提示，每轮变化的状态（时间间隔、被打断的输入、job 回执）进用户消息前的瞬时块；记忆板上的 `[[slug]]` 链接不展开，模型需要时自己读档案 | **缓存工程最完整**：三层 prompt、日期级时间戳、skill 走 user 消息、resume 字节级复用 | 极短 prompt，只给文档路径；skills 渐进披露；`transformContext` 钩子可以整体重写上下文 |
| **④ 记忆与知识沉淀** | **闭环最完整**：事件日志 → 后台分区写碎片与效果记录 → 修改记忆板与档案（以记忆板为根的可达性作为是否被使用的度量）→ 下一次会话经系统提示读到；档案陈述带六种认知状态标签；提示词要求计数可以从磁盘重新数出 | 三层记忆（冻结快照文件 + FTS5 全历史 + provider 插件）；后台 review agent 自动沉淀 | 无（设计上不提供，靠扩展自建） |
| **⑤ 后台自治与长时程** | **心跳 + 后台分区 + 四个跳过条件**（重入与停机、活动指纹、冷却与退避、前台活跃度；活动指纹不变时整次心跳不运行分区，没有新证据就不调用模型）；每次分区运行是一个不保存历史的新会话 | cron（自然语言任务 + 前置脚本 + 任务链）+ kanban 队列 + Chronos scale-to-zero | 无；RPC/SDK 协议完备，可以由外部调度器驱动 |
| **⑥ 自我迭代** | **提示词与分区层自改 + git 回滚 + 代码强制的契约过滤与分区工具白名单**；三者中唯一允许 agent 修改自己的提示词结构（新建分区、改轮转表）的 | 知识层自改（skills/memory），curator 生命周期 + 快照回滚；禁止自改代码与配置 | 工具层自改（agent 写扩展 + `/reload` 立即生效），但需要人发起，也没有验证步骤 |
| **⑦ 多模型后端** | 配置字段 `runtime` 的四值枚举 claude/codex/grok/pi，引擎种类由上游固定；pi 引擎运行的就是本文 §3 的 pi，模型与 provider 随用户的 pi 配置 | 30 个 provider × 5 种 api_mode + credential_pool + fallback_chain | **9 种协议 × 35 个 provider × 1034 个模型 + 中途换模型**，且 pi-ai 可以单独复用 |
| **⑧ 工具与安全** | Claude 引擎的内置工具按白名单提供（渠道与 job 会话 15 个、分区 6 个，`claude.tools` 可追加）；Claude SDK 的 permissionMode 无条件默认 `bypassPermissions`（可由 `ALADUO_PERMISSION_MODE` 覆盖）；控制面：unix socket（0600）完整控制、TCP 只读 6 个方法、远程完整控制需要 bearer token | **分层最完整**：硬底线（yolo 也不能绕过）+ 审批三档 + 六种终端后端 + 凭据剥离 | 内置 7 个工具、没有权限系统（靠容器）；`beforeToolCall` 拦截机制现成，策略需要自建 |
| **⑨ 可观测性与成本** | **用量账本（按会话键记录每次 drain 的用量与成本）+ 单文件 dashboard + `spine.tail`**；后台分区的每次运行按分区名单独记账 | 实时 token 占用的八类分解；成本按 models.dev 价格核算 | 逐 token 成本核算内建于 pi-ai；会话可以导出为 HTML |
| **⑩ 开放性与工程成熟度** | 闭源（Private，All rights reserved）；本仓库的还原源码可读，但许可不授予修改与再分发的权利 | MIT；上万个 PR、69 万行测试，开发规范的文档化程度少见 | **MIT；测试与源码之比 0.74:1、faux provider 全栈回归、供应链加固** |

这张表可以归纳为三点：

1. **架构完整性：duoduo > hermes > pi。** 只有 duoduo 同时处理了"事件级可追溯、后台自治、记忆闭环、受控的自我修改"四件事，这四件正是 long-horizon 自治 agent 需要解决的主要问题。
2. **工程可用性：hermes ≥ pi > duoduo。** 两个 MIT 项目都能 fork；hermes 是完整应用（装上就能长驻运行），pi 是一组库（三层库 + 扩展点，需要自己组装）。
3. **与贝叶斯目标的距离：三者相同。** 预测记录簿、显式概率信念库、打分规则、校准回路，**三个项目都没有**（hermes 与 pi 经全仓库 grep 证实；duoduo 只有效果记录的走向判定，可以作为信念更新的起点）。这一层必须自建，区别只在建在哪个项目上最省力。

---

## 5 优劣总评：各自最值得记住的三件事

**duoduo：可以借鉴的是架构设计，代码不能直接使用。**
- 最强：先追加、后执行的事件日志（每次执行都能追溯到已落库的输入）；"代码测量、模型修改"的记忆整理流程；代码检查与提示词约束两层能力边界，自我修改以 git 提交作为回滚点。
- 最弱：闭源，不能 fork；单机单进程，控制面按单用户设计；引擎种类由上游固定。
- 用途：**架构参照**。它说明"运行时只做模型做不到的事、判断交给模型"这条路线在一个实际运行的系统里可行，而且每个子系统的取舍都值得逐条研究（INTERNALS 分 14 节给出这些取舍的代码证据）。

**hermes-agent：长驻运行与学习闭环可以直接借鉴的开源实现。**
- 最强：缓存工程（直接省钱）、系统化的崩溃恢复措施、已经实现的学习闭环（nudge → 后台 review → curator 回滚）。
- 最弱：transcript 级持久化缺少事件日志级的审计语义；自我迭代限制在知识层；巨型文件。
- 用途：**可以直接 fork 的底座候选，以及崩溃恢复与学习机制的参考实现**。它的插件面（memory provider ABC、自定义工具、cron、Footprint Ladder）正好可以用来外接贝叶斯层。

**pi：把 agent 拆成可以单独复用的库。**
- 最强：pi-ai 多模型层可以单独拿走使用；会话树可以直接用作多假设推演的结构；faux provider 让 agent 行为可以做回归测试。
- 最弱：没有记忆、没有自主运行、没有权限系统，这三项都要自建。
- 用途：**可复用的库与扩展点设计参考**。适合"自建 daemon，只复用 agent 循环与模型层"的路线。

---

## 6 面向目标 agent 的融合架构建议

### 6.1 四条必须由运行时强制的规则

金融预测 agent 的可靠性不来自更聪明的模型，而来自**信念管理的规则**。下面四条规则必须由**运行时代码强制**，不能只写在提示词里：duoduo 的经验是，提示词里的约束模型可以违反，关键的不变量必须由代码检查。

1. **预测先于结果落盘（append-only prediction ledger）。** 每条预测是一个不可变事件：`{标的, 命题, 概率, 时限, 依据事件引用, 当时信念版本}`；结果到期后另写一条 resolution 事件记录 outcome。校准指标（Brier / log score）从日志用纯函数重新计算，agent 无法事后修饰。这是 duoduo 事件日志"先追加、后执行"的直接移植：把 `channel.message` 换成 `prediction.made` / `prediction.resolved` 事件类型。
2. **先验显式化。** 信念库里每条主张都带数值概率和证据链，不允许模糊的自由文本表述。duoduo 实体档案的六种认知状态标签（`[hypothesis (unratified)]`→`[observation]`→`[superseded]`）可以直接作为信念的状态字段，缺的只是给每条主张加上 `p: 0.65, updated_at, evidence: [[...]]` frontmatter；把效果记录的走向（STRENGTHENING/WEAKENING）换成对数几率增量，就是贝叶斯更新。
3. **更新有可以重新计算的审计链。** duoduo 的"事件 → 碎片 → 效果记录 → 修改记忆板"流程与似然证据的收集流程结构相同：证据一侧从事件日志提取碎片（每条必须回指它所检验的那一行信念），按信念行累积效果走向，修改信念前必须先读这一行的走向记录。duoduo 把这条链分给两个平级的分区，读写分开：gradient-distiller 只产出碎片、不写记忆板，intuition-weaver 是记忆板与效果记录的唯一写者。这一分工只写在两个分区的提示词里，运行时不校验（INTERNALS 12.4），所以目标 agent 应当由代码强制"谁能改信念、改的时候必须引用哪份证据"。分工按**代码测量、模型判断**：似然证据的收集是确定性的，交给代码；从先验到后验的语义判断交给模型，但模型的每次更新都必须引用证据文件，以防止模型编造统计数字。
4. **校准回路定期强制运行。** 没有人盯着也要复盘：duoduo 的心跳加后台分区与 hermes 的后台 review agent 是同一思路的两种实现。预测结算后自动 fork 一个受限的复盘 agent，计算分桶校准曲线，把系统性偏差写回信念库（例如"宏观事件类预测过度自信 +0.12，已在先验中扣减"）。

### 6.2 数值层与语义层分工

概率计算（后验采样、蒙特卡洛、回测、组合优化）**不应该通过生成 token 完成**。hermes 的 `execute_code`（Programmatic Tool Calling：LLM 写脚本，中间结果不进上下文，只返回 stdout 里的结论）是合适的形式；pi 的做法是 bash 调 Python 加自写扩展工具。原则相同：**LLM 做判断，代码做计算**，这也从结构上避免了模型在生成文本时直接算错概率。

上下文压缩要防止数值失真：pi 与 hermes 的 LLM 叙述式摘要都会丢失精确数字。办法是用 pi 的 `session_compact` 扩展点（或自建的等价物）把摘要换成**结构化状态快照**（当前持仓假设、活跃信念及其概率、已证伪的假设、待验证的信号）加近期原文；信念的权威版本始终在信念库文件里，上下文只放快照。

### 6.3 两条落地路线

**路线 A：以 hermes 为底座，采用 duoduo 的架构做法（风险低，最快实现无人值守）。**
fork hermes-agent，不改核心，全部改动放在它预留的扩展面上（这符合它的 Footprint Ladder）：
- 贝叶斯层 = 自定义 memory provider（用结构化的 belief store 替代 MEMORY.md）+ 一组 prediction/resolution/calibrate 工具 + prediction ledger（独立的 append-only JSONL，采用 duoduo 事件日志的语义，不依赖 hermes 的 SQLite）；
- 长时程 = cron 任务链：`行情采集脚本（no_agent，零 LLM 成本）→ 预测任务 → context_from 链到收盘复盘任务`；按市场日历触发，而不是固定间隔；
- 自我迭代 = 后台 review agent 改写预测 skill，同时采用 curator 快照回滚与 verification_stop 两项检查；
- 直接获得：30 个后端的容错、崩溃恢复措施、审批安全层、多平台通知（例如把预测结果推送到 Telegram）。
- 代价：Python 巨型文件的理解成本；事件日志级的审计语义要靠自建 ledger 补足；自我迭代的深度限于知识层（对金融场景这**反而是优点**，你并不想让 agent 自己修改交易管道的代码）。

**路线 B：用 pi 的三层库自建 daemon（架构可控，TS 技术栈）。**
取 pi-ai（多模型）+ pi-agent-core（loop 与两个钩子）+ 会话树设计，不用它的交互产品形态，自建一个仿照 duoduo 的外层：
- daemon、心跳与事件日志全部参照 duoduo 的设计自己实现（本仓库的还原源码可以逐函数对照）；
- 信念注入走 `transformContext`/`prepareNextTurn` 两个钩子（对应 duoduo 把系统提示与每轮瞬时块分开装配的做法：稳定的信念库进系统提示，行情快照与时间间隔进每轮瞬时块）；
- 会话树用于**多假设的反事实推演**：做多、做空、观望各开一个分支推演，用 `branchWithSummary` 回到分叉点并保留各分支的结论，这是三个项目里唯一现成的"平行假设"结构，在金融场景价值很高；
- 回归测试采用 faux provider 模式：给定行情脚本，断言 agent 的推理链与预测输出；**agent 行为可以回归测试**在金融场景是硬性需求；
- 代价：调度、记忆、权限三项都要从零实现，实现无人值守所需的工作量比路线 A 大数倍。

**推荐：以路线 A 起步，引入路线 B 的两项（pi-ai 替换模型层可以放到后面，faux provider 式的回归测试立即采用）；duoduo 全程作为架构对照使用。** 理由是：目标里"可靠的预测"权重最高，可靠性来自规则（ledger、校准、复盘回路）而不是框架的新颖程度，hermes 让你把全部精力放在贝叶斯层本身；而"可持续自我迭代"在金融场景的合适形式正是 hermes 式的**知识层迭代 + 代码强制的检查**，不是 duoduo 式的提示词结构自改（后者留到第二期，配合 git 回滚与代码强制的契约过滤再启用）。

### 6.4 目标 agent 参考架构（融合三者）

```
                        ┌────────────────────────────────────────────┐
                        │       外部世界:行情源 / 新闻 / 经纪商 API   │
                        └───────────────┬────────────────────────────┘
                                        │ ①摄入通道(hermes platform adapter / no_agent cron 脚本)
                                        ▼
   ┌─────────────────────────  PREDICTION LEDGER(自建,duoduo WAL 语义)──────────────────┐
   │  append-before-execute:market.snapshot / prediction.made / prediction.resolved /      │
   │  belief.updated  ——全部不可变;Brier/log-score 从日志纯函数复算                        │
   └───────┬──────────────────────────────────────────────────────────────┬───────────────┘
           │ ②预测会话(市场日历驱动)                                      │ ④校准回路(cadence)
           ▼                                                              ▼
   ┌───────────────────────────┐                                  ┌──────────────────────────┐
   │ 前台认知(hermes AIAgent    │   ③数值层(execute_code 沙箱:    │ 后台复盘 agent(受限工具   │
   │ / pi loop+双钩子)          │   后验采样/回测/组合计算,        │ 白名单):算校准曲线、     │
   │ system 前缀 ← 信念库快照   │   结论 stdout 进上下文)          │ 检测系统性偏差、写回      │
   │ user 瞬时块 ← 行情/时间    │                                  │ 信念库与预测 skill        │
   └───────────┬───────────────┘                                  └──────────┬───────────────┘
               │ ⑤更新必须引用证据                                            │
               ▼                                                              │
   ┌──────────────────────────  BELIEF STORE(自建,duoduo 记忆系统结构)◄─────┘
   │  每主张:{p, updated_at, evidence[[...]], 模态标签 [hypothesis]/[observation]/[superseded]}
   │  代码测量(可达性/孤儿 GC/lint)· 模型判断(改写须读 effectiveness)· git 版本化=回滚点
   └──────────────────────────────────────────────────────────────────────────┘
```

### 6.5 金融特化清单（按优先级）

1. **prediction ledger + resolution job**（第一优先）：没有它，一切"预测能力"都无法度量。事件 schema 三种就够：`prediction.made`、`prediction.resolved`、`belief.updated`。
2. **按市场日历触发**：开盘前（信念快照与当日预测）、收盘后（结算与复盘）、周末（深度校准与 skill 整理）三个时点，替代 duoduo 固定间隔的心跳（默认 37 分钟）；保留 duoduo 活动指纹的做法：没有新数据时不运行。
3. **校准分区**：每周计算分桶校准曲线，检测过度自信与信心不足，按预测类别分解 Brier；结果写回信念库，修正先验。
4. **反事实分支推演**（pi 会话树）：重大决策前 fork 做多、做空两条推演分支，各自的结论并入决策依据并写入 ledger，事后可以审计"当时考虑过什么"。
5. **回归测试**（pi faux provider 模式）：重放历史行情并断言推理链，每次 skill 或提示词自我修改后必须通过才允许生效（补上 pi 自我扩展缺少的验证步骤；hermes 的 verification_stop 是现成参考）。
6. **凭据与执行隔离**（hermes 的安全模型）：行情读取与交易执行分为不同的信任级别；交易类工具走强制审批并设限额，永远不进 yolo 白名单。

---

## 7 结语

三个项目分别解决了长期自治 agent 的三类问题：**duoduo 解决的是长期运行中每一步都可追溯（事件日志、心跳与后台分区、记忆整理流程），hermes 解决的是长期运行的成本与安全（prompt cache、崩溃恢复、知识层迭代），pi 解决的是把 agent 拆成可组装、可测试的库（三层库、扩展点、行为回归测试）。** 三者都没有解决的是预测是否准确、以及系统能否知道自己准不准，也就是贝叶斯层：预测先于结果落盘、先验显式化、更新可以重新计算、校准定期强制运行。把这四条规则放进运行时代码，再按 §6 把三个项目各自可用的部分放进对应的层，就是目标 agent 的实现路径。

---

## 附录：证据与材料索引

- **duoduo**：[`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)（14 节：端到端路径、系统提示装配、引擎、自操作工具、事件日志、网关与控制面、Drain 与 turn 控制、会话 actor 与并发池、渠道适配器、job 调度、心跳与后台分区、记忆系统、指令指纹与改动生效、未证实与待实测；按符号名引用代码、不带行号，引用由构建核对；每条主张带 confirmed/未证实推测标注）、[`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md)（部署与运维，含运行中 daemon 的实测记录）、[`../reconstruction/`](../reconstruction/)（可运行的还原源码）。
- **hermes-agent**：`github.com/nousresearch/hermes-agent` @ v0.18.0（2026-07-02 快照）；本文的行号锚点如 `AGENTS.md:16-27`、`agent/conversation_loop.py:633`、`tools/memory_tool.py:11-15`、`agent/background_review.py:171-274`、`agent/curator.py:1537`、`tools/code_execution_tool.py:10-25` 等，均指该快照。
- **pi**：`github.com/earendil-works/pi` @ `21cb380`（2026-07-02）；行号锚点如 `packages/coding-agent/README.md:487-501`、`packages/agent/src/agent-loop.ts:155-269`、`session-manager.ts:1277-1315`、`core/compaction/compaction.ts:225-227`、`api/transform-messages.ts:64-220` 等，均指该提交。
- 局限声明：hermes 与 pi 的分析基于单日的源码快照与文档，没有做运行实测（duoduo 做过）；两个仓库均为浅克隆，提交活跃度依据代码内的证据（PR 编号、提交日期）推断。
