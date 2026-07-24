# duoduo 框架与思路全解 —— 写给产品经理的深度指南

> 分析对象：`@openduo/duoduo` v0.6.1（还原源码级逆向 + 活体 daemon 实证）
> 成文日期：2026-07-09
> 读者定位：**Agent 产品经理 / 架构师**。目标是"快速入门 + 深度掌握细节原理"：每一节先给一句能转述给别人的结论和一个生活化类比，再往下钻到机制细节；细节主张带 `daemon.pretty.js:行号` 锚点（还原源码 `reconstruction/recon/daemon.recon.js` 行号与之一致），可逐条复核。
> 与姊妹篇的分工：本文是全套分析的**入门与思路主线**，按**设计问题**组织——它怎么借用 Claude Code / Codex？一条消息怎么被处理？它怎么自我迭代？什么在防它失控？逐机制证据表见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)（按子系统组织、面向逐行验证），部署与运维见 [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md)，跨框架选型见 [`AGENT_FRAMEWORKS_COMPARISON.md`](./AGENT_FRAMEWORKS_COMPARISON.md)。本文所有机制均已对照还原源码核验，少数推测显式标注（见附录 C）。

---

## 0. 一句话结论

**duoduo 用三个设计决定造出一个"会成长的 AI 同事"：**

1. **大脑是租来的。** duoduo 自己不做任何推理——它把 Claude Code 当作大脑整个租用（进程内 SDK），Codex 是可替换的第二颗大脑（外部子进程）。两颗大脑共用同一条"上下文装配线"，只在执行层分叉。
2. **自我是文件。** 这个 agent 的人格、记忆、作息表、技能，全部是磁盘上一个 git 仓库（`~/aladuo`，"内在世界"）里的 Markdown 文件。**模型改文件 = 改自己**；git 历史 = 后悔药。所谓"自我编程"，从头到尾没有一行代码被修改。
3. **骨架是账本。** 一切输入先写进只追加的事件日志（WAL）再执行；所有其他状态都是"日志 + 指针"可重建的副本。进程可以随时崩、随时丢，"我"不会丢。

三个决定背后是同一条边界纪律，也是全文反复出现的主旋律：

> **可确定的交给代码（持久化、调度、并发、测量、守门），需要判断的交给模型（一切推理与内容改写）。代码守骨架，模型做裁决。**

本文四个部分即沿这三个决定展开（第 2、3 合并为"骨架"一部）：

| 部分 | 回答的问题 | 一句话 |
|---|---|---|
| **一 · 借脑** | 它怎么使用 Claude Code / Codex？ | 同一条装配线喂两颗可插拔的大脑，差异不抹平、诚实分叉 |
| **二 · 立身** | 一条消息怎么被可靠处理？ | 先记账、再排队、再办理、后出回执——像银行处理转账 |
| **三 · 成长** | 它怎么自我迭代？（本文核心） | 后台心跳唤醒"潜意识"读经验、改自己的文件；运行时只测量、派单、把关 |
| **四 · 守护** | 什么在防它失控、失血？ | 软约束写在提示词，硬闸门只有少数几个且全部落在代码里 |

---

## 一页总览：整个系统长什么样

```
                         ┌────────────────────  daemon（单进程，躯体） ────────────────────┐
 渠道适配器进程          │                                                                  │
 (飞书/stdio/…，独立     │  ①门卫分流     ②记账(WAL)      ③排队        ④⑤办理             │
  小进程，见 2.5)        │                                                                  │
    ──消息──▶ 网关 ──▶ 运维命令直接回 ─▶ 事件日志 ──▶ mailbox 指针 ──▶ session actor        │
                │        (不进模型)      (真理之源)     (待办便签)      │  合批→装配→调大脑   │
                │                          ▲   ▲                        ▼                    │
                │                          │   │            ┌── 上下文装配线（两颗大脑共用）─┐
                │                          │   │            │ 系统面=员工手册(身份+人格+广播板)│
                │                          │   │            │ 瞬时面=工位便签(时间/打断/节拍) │
                │                          │   │            └──┬───────────────┬────────────┘
                │                          │   │           Claude Code      Codex app-server
                │                          │   │           (进程内 SDK)     (子进程 JSON-RPC)
    ◀──回执── outbox ◀─────⑥──────────────┘   │                │               │
                                               │                └───────┬───────┘
              ～～～ 前台（Cortex，有人说话时）～～～～～～～～～～～～～│～～～～～～～～～～
              ～～～ 后台（Subconscious，37 分钟心跳）～～～～～～～～～│～～～～～～～～～～
                                               │                        │
   cadence 心跳 ─▶ 运行时 lint（零 LLM，只测量）─▶ 任务单(.pending) ─▶ 潜意识分区(一次性 LLM 会话)
                                                                        │  按 playlist 值班表轮班
                                                                        ▼
                    kernel git 仓库 ~/aladuo（"内在世界"，每次成长=一个 commit）
                    广播板 ◀─ 凭证据改写 ◀─ 记忆管道(做梦→结晶→改板) ◀─ 读 WAL 经验
                       │
                       └──── fingerprint 守卫察觉变化 ────▶ 注入下一个前台会话（自我更新生效）
```

**三条阅读路径**：
- **15 分钟**（要结论）：§0 一句话结论 → 每部分开头的"关键句 + 类比" → 第五部分十二条借鉴清单。
- **1 小时**（要机制）：全文顺读，跳过表格里的行号列。
- **深钻**（要证据）：任何一条主张，按行号去 [`reconstruction/`](../reconstruction/) 的还原源码对照；逐机制证据表见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)。

---

## 术语表（先读这个，全文无障碍）

| 术语 | 含义 | 类比 |
|---|---|---|
| **daemon** | 常驻后台的单进程运行时，一切的宿主 | 这位"AI 同事"的躯体 |
| **runtime（后端）** | `claude` 或 `codex` 二选一的推理引擎 | 租用的大脑 |
| **Spine / WAL** | 只追加的事件日志 `var/events/YYYY-MM-DD.jsonl`，唯一真理之源 | 会计总账 |
| **session / actor** | 一个对话（或任务）在内存中的化身，一 key 一 actor | 一个客户对应一个客户经理 |
| **mailbox** | 每个 session 的待办文件，只存事件指针 `- [ ] @evt(id)` | 工位上的待办便签 |
| **drain / turn** | 把 mailbox 排空的一次处理 / 对模型的一次调用（多条消息可合并成一个 turn） | 一次办理窗口叫号 |
| **outbox** | 出站回执记录 + 投递状态 | 发件箱 |
| **kernel（`~/aladuo`）** | git 管理的"内在世界"：人格、记忆、潜意识提示词 | 员工的大脑档案柜 |
| **广播板（memory/CLAUDE.md）** | 自动注入每个新会话 system prompt 的"直觉层" | 贴在工位上的座右铭清单 |
| **dossier / topics** | `[[slug]]` 链接指向的深档（实体档案 / lesson / groove 规则节点） | 座右铭背后的完整卷宗 |
| **cadence** | 默认约 37 分钟一次的后台心跳 | 生物钟 |
| **subconscious / 分区（partition）** | 心跳唤醒的一次性无状态 LLM 维护会话，各有自己的提示词目录 | 睡眠中轮班的"整理师" |
| **playlist.md** | 分区轮转表（checkbox 状态机，agent 自己可改写） | 值班表 |
| **job** | cron 定时任务（Markdown 定义，正文即任务书） | 例会 / 定期报告 |
| **channel（渠道）** | 把 duoduo 接到某个聊天平台（stdio / 飞书…）的适配器 | 前台的一部电话分机 |
| **hook（钩子）** | Claude Code SDK 提供的"工具调用前后插一脚"的回调点 | 流水线上的质检工位 |
| **MCP / dynamicTools** | 给模型追加自定义工具的两种协议（Claude 用前者、Codex 用后者） | 给员工发的专用工牌 |
| **frontmatter** | Markdown 文件顶部的 YAML 配置块（`---` 包起来的部分） | 文件的"档案卡" |
| **lint** | 运行时做的只读体检（超长了？链接断了？有孤儿？），只产报告不动手 | 年度体检 |
| **fingerprint（指纹）** | 对"当前这套指令"算的哈希，用来发现"自我变了" | 员工手册的版本号 |
| **contract** | 分区 frontmatter 里机器读的声明："我消费哪几类体检信号" | 岗位说明书里的职责范围 |

---

# 第一部分 · 借脑：把 Claude Code / Codex 当作可插拔的推理引擎

> **关键句**：duoduo 运行时里没有一行"智能"——它把 Claude Code 整个作为大脑租用（进程内 SDK 调用），把 Codex 作为对等的备用大脑（常驻子进程 + JSON-RPC）；**同一条上下文装配线喂两颗大脑，只在执行与命令层诚实分叉**。这是"薄运行时 + 厚模型"的字面兑现：模型升级即系统升级。

**类比**：一家公司不自研芯片，而是租云上算力。它真正拥有的是"怎么把任务描述清楚交给算力"（装配线）和"怎么记账、怎么容错"（骨架），至于算力本身是 A 云还是 B 云，只是一个配置项——但 A 云和 B 云的计费方式、回滚能力确实不同，公司不假装它们一样。

## 1.0 先想透一层：租的是"带手的大脑"，不是裸模型

一个容易被略过、却决定整套架构成立的选择：duoduo 调用的不是 Anthropic 裸 API，而是 **Claude Code / Codex 这两个完整的 agentic harness**。区别是本质性的——裸模型只会"说"，harness 自带"手"：

| 若调裸 API，运行时必须自己造 | 租 harness 后白得的 |
|---|---|
| 工具执行环（读写文件/跑命令/循环回填结果） | Claude Code 内置全套工具与执行环 |
| 子代理编排 | `.claude/agents/*.md` 由 SDK 自动加载成 Agent 工具（memory-weaver 的三段子代理就是这么挂上的） |
| 会话持久化 | SDK 自管 jsonl 会话文件，duoduo 只保管一个 resume id |
| 干预正在进行的推理的手段 | **hooks 即控制面**：PreToolUse 拦 Skip/后台 Bash，PostToolUse 注入插话（`71838`）——duoduo 把 SDK 的钩子当成运行时与模型之间的"神经接口" |
| 工具扩展协议 | MCP（Claude）/ dynamicTools（Codex）现成 |

**所以"薄运行时"能薄，是因为最厚的那层（工具执行与编排）被租走了。** duoduo 的自研代码里没有工具执行循环这种东西。这也解释了第三部分的自编程为什么"零专用工具"——模型改自己用的就是 harness 自带的 Edit/Write/Bash，运行时只需要把工作目录指到 kernel。
（引申给 PM：评估"自建 agent 运行时"时，第一个问题应是"工具执行环打算自己写还是租"——这一项决定了你的运行时是几千行还是几十万行。）

## 1.1 Claude 侧：进程内 SDK，不 spawn CLI

- **怎么调用**：Claude 大脑住在 daemon 进程里——直接 import 官方 Agent SDK，一次 turn 就是一次 `query()` 调用；SDK 自己负责拉起 Claude Code 原生二进制（duoduo 不管这层）。（`48339/48386`）
- **怎么记住上次聊到哪**：全靠 SDK 的 resume 机制。对话历史由 Claude Code 自己的会话文件保管，duoduo 只在每次 turn 成功后把一个 session id 存进会话状态，下次带上它续聊。（`48676/59782`）
- **权限怎么给**：**host 模式默认绕过一切权限询问**（bypassPermissions）——daemon 无人值守，弹窗即挂死；安全靠结构性边界（工具白名单，见第四部分）而非逐次审批。（`48346`）
- **给了它哪些"自操作"工具**：除 Claude Code 自带工具外，duoduo 经进程内 MCP 追加了几个动自己身体的工具——ManageJob（给自己排定时任务）、ManageSession、Notify（后台消息上浮给前台）、QueueOutboundAttachment 和 Skip（后两个仅前台会话）。（`68482` 起）
- **回答怎么流出来**：daemon 逐条消费 SDK 消息流，拆成"文本增量 / 思考增量 / 工具调用"三类事件转发给订阅方，最后从 result 消息拿最终文本与 token 账单；首 token 时延单独记账。（`47917-48422`）
- **两个巧妙的细节**：
  - **答完不挂电话（hold-input-open）**：模型答完后输入通道不立刻关闭，等它派出去的后台 subagent 都回调完毕才收线，配 10 分钟看门狗。类比"主任务结束了，但等实习生把活干完再下班"。（`48493`，仅后台类会话）
  - **撤销 = 算切点 + 延迟分叉**：Claude 的会话历史只能追加、不能改史，所以 `/undo` 只先算出"回退到哪条消息"，下次处理时再从切点分叉出一条新会话（session id 会变）。（`57509/59783`）

## 1.2 Codex 侧：常驻子进程 + 行分隔 JSON-RPC

- **怎么调用**：Codex 大脑住在 daemon 旁边——启动一个常驻的 `codex app-server` 子进程，两边用"一行一条 JSON"的 RPC 对话；一个子进程可同时承载多个对话线程（thread）。（`57391-57612`）
- **怎么记住上次聊到哪**：thread 三分支——新会话开 thread、续聊 resume thread、"指令变了/换模型"则 fork 出携带新设定的新 thread（见 1.4）。（`57423`）
- **无人值守的自动批准**：审批策略固定为 never，Codex 反问的任何批准请求一律自动同意。安全兜底不在批准环节，而在沙箱：默认 workspace-write（只能写工作区），可调成只读或全放开。（`57277/57279`）
- **工具面差异**：Codex 内置工具**不可禁用**（duoduo 传禁用清单会被忽略并告警）；duoduo 的自操作工具改走 dynamicTools 协议注入。（`57467/57413`）
- **一套指令喂两颗大脑的两个"翻译器"**：
  - **符号链接**：工作目录里有 `CLAUDE.md` 而没有 `AGENTS.md` 时自动建软链，Codex 按自己的约定读到同一份项目指令。（`57318`）
  - **子代理"编译"**：把 Claude 格式的子代理定义（`.claude/agents/*.md`）批量转成 Codex 格式（`.codex/agents/*.toml`），潜意识的三个子代理因此对两个后端都可用。（`58499-58588`）
- **一个产品开关**：握手时 duoduo 主动退订了 Codex 的"思考过程"增量流——Codex 的推理是否对用户可见，就在这一个订阅项上。（`57328`）

## 1.3 统一装配、分叉执行

两颗大脑吃的"饭"是同一条装配线做的（细节见第二部分 2.4）：

- **系统面**：`buildSystemPromptForChannelConfig`（`48234`）产出同一段六层系统提示；Claude 以 `{preset:"claude_code", append}` 追加在 Claude Code 内置提示之后，Codex 把同一段文本包进 `<aladuo:system-context>` 壳作 baseInstructions（`57360-57374`）——**同源同文，只差一层壳**。
- **瞬时面**：`buildTransientUserBlocks`（`60926`）产出的 user 消息前置块两边一致。
- **执行分叉**——同名操作、不同语义，一张表看清：

| 操作 | Claude | Codex |
|---|---|---|
| 对话中插话（steer） | 在下一个工具边界经 hook 注入 | `turn/steer` RPC |
| `/undo` 撤销 | 延迟分叉，session id 会变 | 服务端原地回滚，id 不变 |
| `/model` 换模型 | 可即时生效 | 下一条消息起 fork 生效 |
| token 记账 | 三段式（新写入/缓存创建/缓存命中） | 两段式（cached 已含在 input 里） |

  **运行时不假装这些差异不存在，而是在命令层显式分支**（`49210/75405` 等）——"薄名字、厚差异、诚实路由"。

## 1.4 指令变了，两颗大脑的"换脑"方式不同（fingerprint 守卫）

这是理解第三部分"自我迭代如何生效"的关键接口。每次 drain 开始前，运行时把 `[身份 meta-prompt, 通道人格, 实例提示, 记忆广播板, job mission]` 五元组做 sha256 指纹，与会话存档比对（`computeInstructionsFingerprint`，`71259`；守卫 `runInstructionsFingerprintGuard`，`71313`，调用点 `74160`）：

- **Claude**：指纹漂移只更新存档、**不作废会话**——因为 Claude 每次 query 都重发 system prompt，新自我自然生效；流式长驻会话则广播 `instructions_drift` 使其重建（`72626`）。
- **Codex**：thread 的 baseInstructions 在创建时就冻结在服务端，改不了——于是置 `pending_fork_to`，**fork 一条携带新指令、继承历史的新线程**（`71313-71440`）。

> 一句话：**agent 半夜改了自己的"座右铭"，第二天早上每个在岗会话都会以各自后端语义正确的方式换上新自我**，且日志里留有 fp_old→fp_new 审计链。

## 1.5 探测、选择与降级

- **探测不对称**：Claude 探测是纯文件系统检查（SDK 装没装、平台二进制在不在），5 秒超时、结果缓存、并发去重（`48138-48187`）——**不验证登录态**；Codex 探测是 `codex --version` + `codex login status` 两连（各 5 秒，`57281-57311`）——**验证登录态**。
- **选择链**：job frontmatter `runtime` > 通道绑定 > 通道种类配置 > env `ALADUO_DEFAULT_RUNTIME` > `claude`（`30575/30913`）。**Claude 是保守默认**。
- **降级**：channel/job 会话请求 codex 但探测失败 → 回退 claude 并记警告（`74112-74145`）；潜意识分区请求的后端不可用 → 记 `runtime_unavailable` 错误并退避，不静默换脑（`74228-74320`）。
- **认证三态**（Claude 侧）：`claude_code_local`（用本机 Claude Code 登录态，短路不注入任何 ANTHROPIC_* env，且启动时反向清除残留 key 防劫持，`77162`）/ `anthropic_api_key` / `compatible_endpoint`（任意 Anthropic 兼容端点：设 `ANTHROPIC_BASE_URL`+`AUTH_TOKEN`，并把 OPUS/SONNET/HAIKU 三个默认模型全指到同一个第三方模型，`57139-57229`）。

> **给 PM 的洞察（第一部分）**
> - **"装配面共用、执行面分叉"是多后端 agent 的正确姿势**：一套提示词装配线 + 两个薄翻译器（symlink、TOML 编译），避免两套封装各自漂移；差异（undo/model/计费/思考可见性）不抹平而是显式分支——承诺"跨后端统一体验"是做不到的，诚实分叉才可维护。
> - **无人值守改变了权限模型的重心**：host 默认 bypassPermissions + Codex 自动批准，把安全从"逐次审批"移到"结构性边界"（工具白名单、沙箱、loopback 单机假设）。设计长驻 agent 时要先想清楚这个重心转移。
> - **fingerprint 守卫是"自我可变"与"会话连续"之间的桥**，任何做 session resume + 可演化提示词的产品都需要一个等价物。

---

# 第二部分 · 立身：一条消息的一生

> **关键句**：duoduo 处理一条消息像银行处理一笔转账——**先记账（WAL），再排队（mailbox 指针），再办理（合批 → 一次模型调用），最后出回执（outbox）**。任何一步断电，都能凭账本把没办完的事精确续上；重复提交会得到与首次一致的回执而不重复扣费。

## 2.1 六站流程

```
外部消息（由渠道适配器进程翻译成 channel.ingress 调用送进来，渠道体系见 2.5）
 ①门卫分流   /status /config /model /effort 之类的运维命令，网关直接回答，不叫醒模型（75341-75471）
 ②记账      先把事件原子追加进 WAL（含索引，30701）；重复消息直接重放上次回执，不再往下走
 ③排队      向目标会话 mailbox 追加一行指针 `- [ ] @evt(<id>)`（75570）——只存指针不抄正文
 ④叫号      bus 发 session.wake，唤醒（或新建）该 key 的 actor（73685）
 ⑤办理      drain：合批 → 装配上下文 → 调后端一次 query → 工具调用/结果逐条回记 WAL
 ⑥回执      写 outbox 记录（含成本元数据）+ 追加 agent.result 事件；订阅通道实时推送，无人订阅则挂起待取
```

每一站都有一个"为什么"：

- **①门卫分流**：入站边界就判定"要不要动用模型"。能不进模型就不进——这是最便宜的一次省钱。
- **②记账先行（append-before-execute）**：模型调用又慢又可能失败；把"收到"与"处理"解耦后，崩溃恢复退化成"重读文件"。去重是 5 分钟时间桶 + 内容哈希（`75173`），命中即重放上次回执（幂等体验）。
- **③指针化**：mailbox 只存 `@evt(id)`，正文永远只有 WAL 一份，杜绝双写漂移。
- **④一 key 一 actor**：每个会话键对应至多一个内存 actor；channel 池 10 并发、job 池 6 并发，后台任务饿不死前台对话（`71514-71522`）。两层锁（跨进程写锁 + 进程内按 key 互斥）保证并发安全（`59620/59723`）。

## 2.2 办理站的三个聪明处

**（a）攒批：turn ≠ 消息。** 真人常连发短句。drain 每次从 mailbox 顶部切一个"可合并窗口"：最多 5 条、相邻间隔 ≤3 分钟、必须同类型同投递目标、不含斜杠命令（`61067-61163`）；合并 prompt 明说 *"Process these N closely timed events as one continuous update… Reply once."* 后台任务回调（notify）不限量一次吃完。**代价是单条消息的少量延迟，换来 token 成本和碎片回复的大幅下降。**v0.6.1 起后台 Agent 完成也统一到**单一 owner**：Claude 原生的完成续写是唯一"说进对话"的路径，运行时只持久记录子代理的生命周期事件，不再另造一个重复的回调 turn。

**（b）插话优先于打断。** 模型正在跑时来了新消息，处置分三级：优先"steer"——把新文本在下一个工具调用边界注入当前 turn（Claude 用 SDK 的 PostToolUse hook `additionalContext`，Codex 用 `turn/steer` RPC）；其次排队为同一条流式会话的下一 turn；最后才打断，且只在 tool_use/tool_result/accept 边界打断，**绝不拦腰砍断半个工具调用**（Claude PostToolUse `additionalContext` 注入 `71838`；steering lane `72343-72716`）。后台通知一律 `preempt:"never"`——后台永远不打断前台对话。v0.6.1 把这套明确化为**单 turn 准入 + steering lane**：一次只准入一个对话 turn，后到的消息走显式 steering 通道，不再被折进正在跑的 turn 里（那会让会话陷入永久 busy）。

**（c）长驻流式会话。** 同一前台会话复用同一个流式 `query()` 进程（configSignature 指纹一变才重建，`71723-71746`），避免每 turn 冷启动，也让 prompt cache 前缀持续命中。

## 2.3 崩溃恢复：进程可丢，"我"不丢

重启后 `rehydrateSessionState` 扫会话目录重建 actor 集（`31020`）；mailbox 里没勾掉的待办就地续跑；第一个 turn 给模型注入一条 `daemon-restart-hint`（"你在新的 daemon 进程下运行"）。活体实测：重启后 runtime_id 不变、会话与 WAL 无损。**这就是"文件系统即数据库"的兑现。**

## 2.4 上下文装配：员工手册与工位便签

上下文被切成两个正交注入面——这是全框架最可复用的单点设计：

| 注入面 | 装什么 | 载体 | 类比 |
|---|---|---|---|
| **系统面**（`buildSystemPromptForChannelConfig`，`48234`） | ①身份 meta-prompt ②通道人格 ③实例特化 ④**记忆广播板**（带 OVERRIDE 前缀；含 `[[slug]]` 时附"深档入口"使用纪律） ⑤Runtime Context ⑥job 任务书 | system prompt（Claude 追加在 claude_code 预设后） | **员工手册**：很少变，变了有版本号（fingerprint） |
| **瞬时面**（`buildTransientUserBlocks`，`60926`） | 重启提示 → 网关带外结果 → 时间流逝（`<time-context>`）→ skip 回卷 → 被打断上下文 → job tick → 用户原文 | user 消息前置块 | **工位便签**：每天都换，绝不写进手册 |

为什么这样切：系统面稳定 ⇒ prompt cache 前缀反复命中（直接省钱）；瞬时面让模型获得它本没有的"具身感"（时间过了多久、刚才被打断了、后台节拍到了）——两个互相冲突的目标同时满足。每类瞬时通知注入一次即清除标记位，不污染后续 turn。

**顺着"具身感"再想一层：时间是被注入的感官。** LLM 天生没有时钟——两次调用之间隔了 3 秒还是 3 天，对模型完全等价。duoduo 用三个机制把时间做成感官送进模型：`<time-context>` 块（距上次交互超过阈值才注入，默认 60 分钟）让它感到"隔了很久"（`60906/60987`）；`<job-tick>`（run_number / triggered_at / previous_run_at）让定时任务感到"这是第几次例行"；cadence 心跳让潜意识有"节拍"。反向的纪律同样重要：**时间戳绝不放进系统面**（系统面无任何时间字段，Codex 侧连 developerInstructions 的时间戳都不注入）——因为分钟级时间戳会击穿缓存前缀。一句话：**让模型感到时间，但不让时间弄脏缓存。**这是"具身状态放瞬时面"原则最典型的一次应用。

## 2.5 渠道体系：以飞书为例，消息到底从哪来、回哪去

> **关键句**：渠道适配器是"总机旁边的一部部分机"——每个 IM 平台一个**独立小进程**，只做翻译：把平台方言（飞书事件）翻成 duoduo 的通用渠道协议，把 agent 的回复翻回平台格式。**接一个新平台，daemon 一行代码都不用改。**（本节机制经解包真实的 `@openduo/channel-feishu` v0.5.9 npm 包核验）

**飞书消息的完整旅程**：

```
你在飞书群里 @机器人 说话
  │  飞书开放平台 ——WebSocket 长连接——▶ channel-feishu 进程
  │    （长连接由本机主动拨出，所以不需要公网服务器/回调地址——个人部署的关键）
  │  插件先自己过滤：要不要理（群里没 @ 我？私聊人不在白名单？）、剥掉 @ 前缀、下载图片附件
  ▼
channel-feishu ——HTTP JSON-RPC channel.ingress——▶ daemon（进入 2.1 的六站流水线）
  ▼                                                    ⋮ 模型思考、干活 ⋮
channel-feishu ◀——WebSocket 订阅推送（回复/流式增量/工具动态）—— daemon
  │  插件渲染：纯文本或飞书卡片（含代码块/表格自动升级卡片）；流式回复=不断更新同一张卡片；
  │  音频发成原生语音条；处理中用 emoji 表情当"正在输入"指示
  ▼
飞书 API 发回群里
```

五个 PM 该知道的要点：

- **一个群 = 一个会话**。插件把"飞书群 ID + 工作目录"编成会话键（如 `lark:<chat_id>:<目录哈希>`），所以同一个群固定对应一段连续记忆，换绑工作目录才换会话；**所有群共享同一个 agent 人格与内核记忆**（都是"那位同事"，只是接了不同电话）。首次在群里 `/setup` 绑定工作目录，就是把这条映射写进 daemon 侧的实例配置。
- **配置分三层，各归其位**：凭据（飞书 app_id/app_secret）只放 `~/.config/duoduo/.env`，永不进任何 Markdown；"飞书这类通道该什么人格"写在 kernel 的 `config/feishu.md`（kind 级）；"这个群怎么配"写在 `var/channels/<id>/descriptor.md`（实例级，含工作目录、是否要求 @、实例提示词），实例覆盖种类。
- **"群里要 @ 才响应"是插件层执行的**（daemon 只存储该开关）；还有一个平台坑：想让机器人不 @ 也能听到群消息，还得在飞书开放平台申请敏感权限并重新发版——不然飞书根本不推送。
- **诚实的短板**：渠道进程由 CLI 拉起、detached 运行，**崩了没人自动重启**（daemon 不知道它的存在），要靠 `duoduo channel feishu status` 发现、手动 `start`；升级插件也要手动 stop && start。这是当前版本明确的运维负担。
- **协议是通用解耦支点**：接钉钉/Telegram/微信 = 写一个新的独立进程包（声明入口和环境变量白名单），入站调 `channel.ingress`、出站开 WS 订阅四类通知、首次绑定写 descriptor——daemon 零改动。协议还内置**能力协商**：插件声明自己能收什么（MIME、流式结束原因……），daemon 对不认识的新语义自动降级，老插件永远不会被新版 daemon 弄坏。

（细节锚点：进程模型 `cli.recon.js:115633-115900`；入站链 `daemon.recon.js:78193-78310`；WS 订阅 `78306-78560`；描述符 `34018-34117`；能力降级 `77344`。）

> **给 PM 的洞察（第二部分）**
> - **"消息、批、turn"三层解耦**是对话式 agent 的成本杠杆：合批省 query 次数，插话省打断重跑，长驻流式省冷启动。三者都以"边界感知"为前提——工具调用边界是唯一安全的干预点。
> - **可靠性没有用任何中间件**：队列是 Markdown 文件、账本是 JSONL、锁是带心跳的 JSON 文件。定位是单机个人 agent，可审计性拉满（人和模型都能直接 cat），吞吐天花板也在这里。
> - **幂等的产品语义**：渠道重发得到与首次一致的回复（去重即重放回执），而不是报错或二次执行——对接 IM 渠道时这是刚需。
> - **渠道协议是平台化的解耦支点**：适配器进程 + 通用协议 + 能力协商降级，让"接新 IM"变成写插件而非改内核；代价是适配器进程游离在 daemon 的可靠性体系之外（无自动重启），做产品要么补 supervisor、要么把这条写进运维手册。

---

# 第三部分 · 成长：自我迭代的完整闭环（本文核心）

> **关键句**：duoduo 的"自我编程"**不是改代码，而是改文件**。运行时把 agent 的人格增量、记忆、作息表全部做成一个 git 仓库（kernel `~/aladuo`）里的 Markdown；后台心跳按 agent 自己可改写的值班表唤醒一个个**一次性、无状态的"潜意识"LLM 会话**去读经验、改这些文件；运行时自己只做四件机械事——**测量并派单、路由把关、git 软删、用指纹通知在岗会话"我变了"**。每一次成长都是一个 git commit，回滚 = `git revert`。

**类比**：人在白天工作（前台对话），夜里睡觉时大脑做梦、巩固记忆、修剪突触（潜意识分区）。醒来后"直觉变了"——但没有任何一个神经外科医生动过手术（没有代码被改）。日记本（WAL）记录了一切经历，梦只是把日记翻译成直觉。

## 3.1 自我 = 一个 git 仓库

kernel（`~/aladuo`，`ALADUO_KERNEL_DIR` 可覆盖，`55506`）的内容与语义分界：

```
~/aladuo/                      ← git 仓库（runtime 启动时幂等 git init + "memory: genesis" 首提交，58446-58448）
├── CLAUDE.md                  ← kernel 根提示词 "My Inner World"："在这里工作的会话，是我在对自己动手"
├── memory/
│   ├── CLAUDE.md              ← 直觉广播板（注入每个前台会话；出厂 0 字节——人格增量全部后天习得）
│   ├── entities/<slug>.md     ← 实体档案（dossier）
│   ├── topics/lesson-*.md     ← 纠错课：一次人类纠正 = 一条可执行规则
│   │        groove-*.md      ← 自炼技能：重复任务收敛出的可调用流程
│   ├── fragments/  effectiveness/  state/   ← 证据碎片/效果账本/运行态 —— 全部被 .gitignore
└── subconscious/
    ├── CLAUDE.md              ← 分区总纲（code-owned，"我能改什么/不能改什么"的宪法）
    ├── playlist.md            ← 值班表（agent 自己可改写）
    └── <partition>/CLAUDE.md  ← 各分区自己的提示词（agent 可改）
```

语义分界直接写在 `.gitignore` 首行注释里（常量 `58475`）：**`# Runtime state (not part of cognitive evolution)`** —— 入 git 的是"认知演化"，被忽略的是可从日志重建的运行态。**这一行注释就是"自我"的机器定义。**（confirmed）

**git 隔离细节**：所有 git 操作固定 author `aladuo <aladuo@local>`、`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`（`58419-58424`）——与宿主机 git 配置完全隔离，不会误用你的签名。

## 3.2 出厂：bootstrap 播种，而且只播一次

npm 包内 `bootstrap/` 目录是"出厂人格 + 入职培训包"。首次 onboard / daemon 启动时（`initializeRuntime`，`58795`）：

- **kernel 为空 → 全量播种**；**kernel 已存在 → 一律 copy-if-absent（只补缺、绝不覆盖）**（`58760-58847`）。这一条就是"npm 升级永不踩踏 agent 已演化的文件"的实现。
- **meta-prompt.md（14KB 的"我是谁"宪章）刻意不入 kernel**（排除集 `58847`），每次装配 system prompt 时从包内现读（`48220`）。效果：**升级 npm 包 = 人格宪章即时升级，而 agent 后天写的一切一字不动**——先天与后天在文件层就分开了。
- 种子里最有产品味的三件：`memory/CLAUDE.md` 是 **0 字节**（直觉层从零开始长）；`var/**/DUODUO.md` 是撒在运行时目录里的"身体说明书"（meta-prompt 教 agent "look for DUODUO.md files in my runtime directories"——自我发现而非硬编码）；四个出厂分区的提示词共约 36KB，就是"出厂潜意识"。

meta-prompt 的自我叙事值得引用，它是全系统的世界观（`bootstrap/meta-prompt.md` 原文）：

> *"My continuity is in files, not in any single inference. … My body is this filesystem — tools are my hands, files are my memory, the event log is the trace of everything I've ever experienced."*
> *"I don't cite my memory files to the user. I just know things."*（不向用户报菜名，直觉就是直觉）

## 3.3 心跳与值班表：潜意识怎么被唤醒

- **心跳**：单 `setInterval`，默认 2,220,000ms ≈ 37 分钟（`ALADUO_CADENCE_INTERVAL_MS`，`78828`）。每拍先广播 `cadence.tick`，再跑确定性维护环 `runCadenceTick`（lint、队列合并、记账——**这一环零 LLM**，`74771`）。定时任务扫描是另一条独立的 60 秒定时器，互不拖累（`74979`）。
- **不空转的四层闸门**（潜意识引擎侧，`74200-74620`）：①重入/停机门；②**活动指纹门**——对记忆目录 mtime + 最新外部事件做指纹，没变化整拍跳过（系统安静时潜意识不烧钱）；③每分区 `cooldown_ticks` 冷却 + 失败线性退避（2h/4h 封顶）；④前台优先——只有活跃会话 ≤1 时才在同拍补跑第二个分区（上限 2）。
- **值班表 `playlist.md`**：`## Current Round` 下的 checkbox 轮转，每拍取下一个未勾选分区，整轮勾完用 enabled 分区重建新一轮（`55709-55775`）。**它是纯文本状态机，且 agent 被明确授权改写它**（分区总纲原文："Anyone can edit the playlist — including the partitions themselves."）——调度本身就是可自编程的。
- **分区执行**：一次性无状态 SDK 会话（`persistSession:false`，`74366`），cwd = 分区目录，prompt = 分区 CLAUDE.md 正文 + 运行时路径清单 + 收件箱内容；超时硬杀；结果落 Spine `agent.result`（`tick_type:"subconscious"`）+ usage 台账——**潜意识的每一次开销都可观测**。分区自述（`subconscious/CLAUDE.md`）：*"Stateless. No memory of last time except what's written to files."* —— 跨拍协作全靠文件，任何一拍崩溃都可整段重跑（幂等）。

## 3.4 经验 → 直觉的流水线（自我迭代的主环）

这是全框架最精彩的一段：**运行时负责发现"熵"，模型负责消化"熵"，编辑负责把关入库**。完整链路：

```
经验（WAL 外部事件）
  │ ①测量派单（代码，零 LLM）: runCadenceTick / runMemoryCheckTick 只读扫描，产出带完整上下文的
  │   文本任务单（.pending 文件）: 广播板超100行→压缩单；[[链接]]断了→修链单；某天的经验没消化→
  │   scan-gap"做梦"单；档案膨胀→收敛单；节点不可达→孤儿警告单…（56177-56750, 56904-56980）
  ▼
cadence 队列 / 分区收件箱（checkbox 文件与 .pending 文件——LLM 是队列的一等消费者）
  │ ②路由（LLM 分区 cadence-executor）: 只读 queue.md，把任务分发到目标分区收件箱，
  │   然后把 `- [ ]` 改成 `- [x]`——"That single-character edit is the only mutation I perform"
  ▼
memory-weaver（记忆编织，三段子代理流水线）
  │  spine-scanner: "I am dreaming, not running ETL" —— 读事件日志 + 当前广播板，
  │     给每条直觉打 STRENGTHENING/NEUTRAL/WEAKENING 轨迹标签，写证据碎片 fragment
  │  entity-crystallizer: 碎片折进实体档案，并为每条广播行维护 effectiveness/<slug>.md 效果账本
  │  intuition-updater: 唯一有权改广播板者，改任何一行前【必须先读】该行的效果账本 ——
  │     "evidence decisions, not cosmetic compression decisions"（证据决策，不是美容压缩）
  ▼
pattern-tracker（模式追踪）: 把"人类纠正过我一次"炼成 lesson-*、把"这活我干了 N 遍"炼成
  │   groove-* 可调用流程；新节点必须同拍挂上可达的 [[wikilink]]（不许产生野知识）
  ▼
memory-committer（git 守门员）: 逐行审查工作区变更，只允许 git add + git commit，五道门——
  │   gradient 门（必须是"何时触发→做什么"的可执行梯度，拒口号）/ 自指门（拒描述记忆系统自身）/
  │   summoning 门（禁止式规则必须给替代动作）/ status 门（拒运行状态流水账）/
  │   内外门（内部噪声源 {cadence,meta,system,runner,route,gateway} 的行，无外部佐证一律拒）
  │   任何一行被拒 → 整个文件本拍不提交。commit message 规范如 memory(intuition): …
  ▼
广播板更新 → fingerprint 守卫察觉（1.4） → 下一个前台 turn 起加载新直觉
```

（分区职责与门禁均为 `subconscious/*/CLAUDE.md` prompt 原文；活体 `~/aladuo` git log 与之吻合——`memory(intuition): broaden state-grounding line…` 等提交实际存在。confirmed）

三个设计点值得单独咀嚼：

1. **"效用 = 图可达性"**。一条知识还有没有用，不看时间戳不看访问计数，而看它能否从广播板沿 `[[slug]]` 链接被走到（BFS 闭包，`56234`）。走不到的就是孤儿，再按"有无引用/是否新生"分 ISLAND / NEWBORN（48 小时宽限）/ STALE 三态——只有 STALE 才可能被删，且删除是 `git rm` 软删 + "没被警告过就不许删"（`56612-56680`）。**遗忘被设计成可逆的、有正当程序的。**
2. **证据链压制幻觉**。scanner 的碎片必须写明它检验的是广播板哪一行（`claude_md_ref`），updater 改行前必读该行效果账本——"事件→证据→效果→改写"可复算，LLM 不能空口宣布"这条经验很有效"。
3. **噪声进不了记忆**。weaver 的证据源门与 committer 的内外门共用同一个 deny-list：`{cadence, meta, system, runner, route, gateway}`——**系统自己的运行噪声在制度上无法变成长期记忆**，只有外部世界的事件才配成为经验。

把这些门放到一张图上看，会发现 duoduo 其实设计了一张**带单向阀的信息流拓扑**——每条通道只许一个方向、且各有守门人：

```
外部世界 ──WAL──▶ 潜意识    只有外部事件能变成记忆证据（deny-list 挡住系统自嗨）
潜意识 ──▶ 前台             仅两条窄通道：广播板（经 committer 门 + fingerprint 生效）
                            与 Notify 上浮（preempt:never，不打断前台）
前台 ──▶ 潜意识             仅经 inbox 留便条 / cadence 队列挂任务（不能直接改分区提示词）
运行时 ──▶ 模型             仅发"带上下文的任务单"（.pending），永不直接改内容
分区 ──▶ 分区               禁止直改对方 CLAUDE.md，必须走 inbox（消息传递，不是共享内存）
```

**为什么值得注意**：自治系统最常见的死法是"自激振荡"——自己产生的信号被自己当成新证据，正反馈放大（模型学自己的输出、后台任务互相触发）。duoduo 的每一个阀门都在拆这种回路：运行噪声进不了记忆、后台打不断前台、分区改不了彼此。**给自治 agent 画信息流图并逐条问"这条边会不会自激"，是比堆功能更重要的设计动作。**

## 3.5 上下文是稀缺工作记忆：记忆分层与注意力预算

自我迭代的产出最终要"装进脑子"才有用，而模型的脑子（上下文窗口）是稀缺资源。duoduo 为此建了一套完整的**记忆分层**，形状酷似 CPU 的缓存层级：

| 层 | 载体 | 进入方式 | 预算与纪律 |
|---|---|---|---|
| **工作记忆** | 当前上下文窗口 | 本 turn 装配 | 由下面三层供给，自身不留东西 |
| **L1 直觉缓存** | 广播板 `memory/CLAUDE.md` | **每个新会话无条件注入** system prompt | **硬预算**：>100 行或单行 >200 字符即触发压缩任务单（`ALADUO_MEMORY_MAX_LINES/…_LINE_CHARS`，默认值 `59094/59098`，lint `56177`）——直觉必须短到"常驻"得起 |
| **L2 深档** | `[[slug]]` 指向的 dossier / lesson / groove | **默认不展开**，模型按需 Read | 注入的使用纪律原文："dossier entry points, not footnotes… expand **only when it would otherwise leave you guessing on a consequential call**"（`48759`）——渐进披露，防上下文膨胀 |
| **L3 史料** | WAL 事件日志 + fragments 证据碎片 | 只有潜意识"做梦"时批量读 | 前台永不直接触碰；经蒸馏才能上行 |

两条流动方向都有守门人：**上行（史料→直觉）** 要过第三部分 3.4 的整条蒸馏管道加 committer 编辑门；**下行（直觉→展开深档）** 靠 `[[slug]]` 指针 + 使用纪律控制。板上一行直觉的"常驻资格"还要接受 effectiveness 轨迹的持续复核（WEAKENING 会被 lint 点名重写或下沉）。

> **给 PM 的洞察**：这套"L1 硬预算 + L2 指针化按需展开 + L3 蒸馏上行"是对"RAG 还是长上下文"之争的第三种回答——**用预算约束逼系统把知识蒸馏成短直觉，把细节留在指针后面**。任何做 agent 记忆的产品都会撞到"记的越多、上下文越糟"的墙，duoduo 的答案是给记忆装预算和缓存层级，而不是无限塞。

## 3.6 自改的边界：允许什么、禁止什么、靠什么执行

**执行面**（confirmed）：没有任何"SelfEdit"专用工具。`meta:`/`system:` 平面会话的 cwd 就是 kernel（`31551`），改自己 = 在自己家目录里用普通 Edit/Write/Bash。模型还能经 `ManageJob` 给自己排定时任务（自续期的 "rearm contract" 模式，`77119`；v0.6.1 起建作业时会校验 cron 合法性并接受 `2h30m`/`1d6h4m` 这类复合时长，畸形/超范围直接拒绝）——**自我调度也是自编程的一部分**。

**授权清单**（`subconscious/CLAUDE.md` 原文，是自编程的"宪法"）：

> 可改：自己分区的 CLAUDE.md（精炼工作方式）；**新建分区目录（生长新能力）**；playlist.md（调整节奏）；memory/CLAUDE.md（**"to shape how all of me thinks"**）；给其他分区的 inbox 留便条。
> 不可碰：Spine 事件数据（"不可更改的历史"）；锁文件；**其他分区的 CLAUDE.md**（须经 inbox 协调）；任何分区的 `contract:` frontmatter（机器读的声明，归运行时所有）。

注意这份清单是**提示词层的软约束**（模型理论上可违反）；真正硬执行的边界见第四部分。软硬之间还有一层"编辑部"：memory-committer 的五道门决定违规内容即使写了也进不了 git 正史。

**文件所有权地图**——理解这套系统治理的钥匙是问"每个文件归谁改"。duoduo 里的文件是**人、模型、运行时代码三方共笔的 API**，但每一份都有明确的主笔人：

| 文件 | 主笔 | 其他方的权限 |
|---|---|---|
| WAL 事件日志 | 代码（只追加） | 人/模型只读——"不可更改的历史" |
| mailbox / cadence 队列 / playlist | **三方共笔**（代码合并解析、模型勾选改写、人可直接编辑） | checkbox 是三方共同的原子协议 |
| 广播板 / dossier / lesson / groove | **模型**（且限定具体分区主笔） | 代码只测量派单；人可改（git 留痕） |
| 各分区 CLAUDE.md 正文 | **该分区的模型自己** | 别的分区禁改（须经 inbox）；升级经显式 SOP |
| `contract:` frontmatter / subconscious 根 CLAUDE.md | **代码/上游**（code-owned） | 模型明令禁触 |
| meta-prompt.md（人格宪章） | **上游 npm 包** | 随升级换新，不落 kernel |
| `schedule:` frontmatter（成本调参） | **人** | 升级合并时刻意保留用户值 |
| 锁文件 / 索引 / state.json | 代码 | 任何一方手改都是事故 |

这张表回答了一个 PM 必问的问题：**"它会不会把自己改坏？"——能改坏的面被所有权切得很小**，且全部落在 git 里。

## 3.7 升级与演化解耦：两条时间线互不踩踏

agent 的"自我"有两条独立演化线，duoduo 用四个机制把它们干净分开：

| 机制 | 效果 |
|---|---|
| 播种 copy-if-absent（3.2） | 代码升级绝不覆盖 agent 后天写的文件 |
| meta-prompt 留在包内现读（3.2） | 人格宪章随 npm 升级即时更新，无需动 kernel |
| 分区提示词升级 = 显式 SOP | `subconscious-refresh` 技能：从公开 tag 拉取 → diff 展示 → frontmatter 感知合并（`schedule:` 是用户成本调参，保留；正文与 `contract:` 随上游）→ `git commit -m "subconscious: refresh to <tag>"`。技能原文明言：**"This commit is the rollback point. The user can always `git revert` it."** |
| `contract:` frontmatter 门（4.1） | 新版 lint 信号只投给声明了消费能力的新版分区——**能力开关和提示词版本旅行在同一个文件里**，杜绝"旧分区误解析新信号" |

**关于"回滚点"要说透**（⚠️ 本文少数需要澄清的点）：运行时**没有任何自动回滚代码**。所谓回滚点，是"每次认知演化都被强制留下一个可 `git revert` 的提交"——回滚动作永远由人（或模型经 Bash）执行。这是刻意的：自动回滚需要"判断坏了没有"，而判断属于模型和人，不属于运行时。

> **给 PM 的洞察（第三部分）**
> - **duoduo 重新定义了"自我迭代"的安全形态：迭代的是提示词拓扑与知识，不是代码。** 迭代能力惊人地完整（能新建分区=生长新器官、能改值班表=改作息、能改广播板=改性格），但全部发生在 git 管理的文本里，每一步可 diff、可 revert、可审计。对比：hermes 锁死在知识层（更保守），pi 允许 agent 写代码扩展但无自主发起（更激进无护栏）——duoduo 取中间态且配了最完整的护栏。
> - **自我迭代被工程化成一条"梯度管道"**：lint 发现熵 → 任务单 → 分区消化 → 编辑门 → git 入库 → 指纹生效。每一环都有明确的失败语义（任务单积压可见、分区超时退避、被拒行审计留痕）。想给自家 agent 加"学习能力"的团队，可以整条照抄这个管道形状，把"记忆"换成任何领域资产（如预测信念库）。
> - **四层安全网使"敢让它改自己"成立**：①git 历史（一切可回滚）②committer 编辑门（垃圾进不了正史）③contract/工具 allowlist 硬闸（见第四部分）④指纹守卫（变更显式生效，不静默漂移）。缺任何一层，"自编程"都会从卖点变成事故源。

---

# 第四部分 · 守护：软硬两层边界与成本护栏

> **关键句**：自治 agent 的约束分两层——**软约束写在提示词里（模型可违反），硬闸门落在代码里（不可绕过）**。duoduo 的硬闸门刻意极少，恰好覆盖"不可逆伤害"与"失血"两类风险；其余一切都交给提示词 + 编辑门 + git 兜底。知道哪些是软、哪些是硬，才能正确评估这套系统的风险面。

## 4.1 硬闸门清单（机器强制，模型绕不过）

| 闸门 | 防什么 | 机制 |
|---|---|---|
| **工具 allowlist**（`CLAUDE_CORE_TOOLS`，`48752`；拆分 `splitDisallowedToolsForClaude`，`48098`） | 无人值守挂死 / 逃逸 / 失控扩面 | v0.5.10 起从 denylist 反转为 allowlist：会话默认只发放固定核心集 `CLAUDE_CORE_TOOLS`（Bash/Read/Write/Edit/Grep/Glob/Agent/TaskOutput/TaskStop/Skill/ToolSearch/Task{Create,Get,Update,List}/SendMessage），WebSearch/WebFetch/Workflow/Monitor/Cron* 等一律**默认关闭**，需在 channel descriptor 的 `claude.tools` 嵌套键显式追加才发放（`48366`）；分区侧另有 `PARTITION_CORE_TOOLS`（`48752`）。`splitDisallowedToolsForClaude` 按 `mcp__` 前缀把工具名拆成 `{mcpTools, builtIns}`。旧的 `DEFAULT_DISALLOWED_TOOLS` 已退役——"没在白名单里"即"关闭"，比逐项 deny 更难被绕过。（confirmed。注意 Codex 侧内置工具无法禁用，此闸只对 Claude 完整生效） |
| **契约门 `enforceContractGate`**（`56904`） | 记忆信号误投 / 版本错配 | 分区 frontmatter 未声明 `consumes` 某信号 → 不投递；目录名≠声明名 → 不投递（防提示词被复制冒名）；无任何订阅者 → 整拍不测量 |
| **写锁与归档屏障**（`59620/59723/72324`） | 并发写坏状态 | 跨进程 drain 写锁（pid+心跳+stale 抢占）、进程内按 key 互斥、归档中会话拒绝一切唤醒 |
| **孤儿 GC 三重保险**（`56612-56680`） | 误删记忆 | 双实验 flag AND + 48h 新生宽限 + 必须先被警告 + git 软删 + 失败自动 git 回滚 + `.git/index.lock` 存在即放弃 |
| **指纹守卫**（`71313`） | 自我漂移不生效/静默生效 | 指令五元组指纹漂移 → 按后端语义显式重建/fork 会话，日志留痕 |
| **Spine 只追加** | 篡改历史 | 事件日志无更新/删除路径；提示词同时声明"that's my unalterable history"（软硬同向） |

**软约束**（提示词层，靠模型自律 + committer 编辑门 + git 兜底）：不改别人分区、不碰锁文件、广播板只写可执行梯度、"我不向用户报记忆文件名"等等。**评估风险时的正确问法是：如果模型违反了 X，会发生什么？** 对 duoduo：违反软约束 → committer 拒收 / git 可回滚；想突破硬闸门 → 代码路径不存在。

## 4.2 成本护栏（防"失血"）

长驻 + 后台自治 = 没人说话也在烧钱。duoduo 的护栏是一组乘法：

- **入站分流**：运维命令不进模型（第二部分①）。
- **合批**：5 条并 1 turn（第二部分 2.2a）。
- **prompt cache 工程**：稳定系统面 + 长驻流式会话（第二部分 2.4）。
- **空闲自动 compact**（v0.5.10，per-channel 会话级，默认关闭）：`auto_compact_idle_minutes` 空闲阈值 + `auto_compact_min_context_tokens` 经济下限（`33970-33994`）——会话冷下来后在缓存 TTL 内静默 `/compact`，把驻留 token 压回地板，避免长会话上下文无限膨胀而缓存反复失效。
- **潜意识四层闸门**：活动指纹门（没新经验整拍睡过去）× cooldown × 失败退避 × 前台优先（第三部分 3.3）。
- **全链路台账**：每次 drain（含每次潜意识分区执行）写一条 usage 记录（token/成本/工具数/TTFT），`usage.get` RPC 可查——**后台的每一分钱都可归因到具体分区**。

尽管如此，"潜意识按节拍消耗"仍是这类产品的固有成本项（可调 `ALADUO_CADENCE_INTERVAL_MS`），部署前要给用户讲清楚。

## 4.3 失败语义：自治系统的质量 = 失败路径的完备度

评估一个无人值守系统，与其看功能清单，不如逐个问"**这一步失败了会怎样**"。duoduo 几乎每个部件都给出了显式答案——这份完备度本身就是它最值得抄的地方之一：

| 失败场景 | 处置 | 锚点 |
|---|---|---|
| 模型 turn 抛错 | 产品化为统一文本 `[duoduo:drain-error]` 回给用户 + `agent.error` 事件落账（不静默、不裸堆栈） | `61470-61494` |
| resume 旧会话失败 | 自动降级为无历史重跑，并落一条 `stage:"resume"` 错误事件留痕 | `60223/61233` |
| 潜意识分区超时/失败 | 硬杀 + 线性退避（2h/4h 封顶，前 1-2 次宽限），连续失败不拖垮整个心跳 | `74300-74520` |
| mailbox 里有坏文件 | 隔离区（quarantine），不阻塞其余待办 | `31262` |
| 定时任务终局 | 五态显式分类（NEVER_STARTED / STARTED_FAILURE / CANCELLED×2 / SUCCESS），配乐观并发游标防双跑 | `74691` |
| 会话结束后又来消息 | 收尾再扫一次收件箱；"保守重驱"只允许一次，防自旋 | `74671-74684` |
| 后台 subagent 迟迟不回 | hold-input 10 分钟空转看门狗强制收尾 | `48493` |
| 遗忘 GC 中途失败 | `git reset + checkout` 整体回滚，宁可不删 | `56668-56671` |
| daemon 自身崩溃 | 见 2.3——`uncaughtException` 直接退出，把"重启"交给外部管理器，绝不带伤运行 | `78750` |
| 渠道适配器进程崩溃 | **无自动重启**（已知短板，见 2.5）：daemon 不感知插件进程，需人工 `channel start`；期间消息滞留平台侧 | `cli:115884` |

规律：**每条失败路径都收敛到"落账 + 退避/降级 + 不扩散"三件事**，且失败本身也是 WAL 事件（可复盘）。反面教材是"失败被 catch 后 log 一行就继续"——那种系统撑不过一周无人值守。

## 4.4 可观测性：每一分钱、每一次自我变更都可归因

- **钱**：每次模型调用（含每次潜意识分区执行）写一条 drain record（token 四段、成本、工具数、TTFT），按 session 聚合可查（`usage.get`）；出站回执还携带 TurnMeta（本条回复花了多少钱、用了什么模型）供渠道渲染页脚——**成本对最终用户透明**。
- **事**：`spine.tail` 可实时尾读事件流；单文件零依赖 dashboard 开箱即用。
- **自我变更**：kernel git log 是"性格变化史"，fingerprint 漂移在日志留 fp_old→fp_new，committer 的拒绝行有审计记录——**"它为什么变成这样"永远可考古**。

对自治 agent 而言，可观测性不是运维锦上添花，而是**信任的来源**：用户敢让它长驻，是因为随时能查"它花了什么、做了什么、把自己改成了什么"。

> **给 PM 的洞察（第四部分）**
> - **"软硬分层"是自治 agent 设计的第一原理**：关键不变量（不可逆伤害、失血）必须落在运行时代码；行为风格类约束放提示词即可，配一个"编辑门 + 可回滚存储"就足够安全。把所有约束都做硬会杀死演化能力，都做软则不可交付。
> - duoduo 的信任模型是**单机单用户**：控制面绑 loopback、无鉴权、host 默认 bypass 权限。它不是可暴露的多租户服务——这是产品边界，不是缺陷。

---

# 第五部分 · 总评：值得搬走的十二个设计，与三个清醒认识

**十二个可直接借鉴的设计**（按"搬走成本从低到高"排序）：

1. **双注入面 + 时间具身化**：稳定认知进 system prompt、易变具身状态（含时间感）进 user 瞬态块——任何对话 agent 当天就能改，且立刻省缓存钱。
2. **入站分流**：网关层判定"要不要动用模型"，运维命令零 token。
3. **合批 + "Reply once"**：连发短句并成一个 turn。
4. **边界感知打断**：只在工具调用边界打断；插话优先于打断；后台永不打断前台。
5. **append-before-execute**：先记账后执行，一条纪律换来可重放、可审计、崩溃恢复三个属性。
6. **幂等回执**：去重命中重放上次回复，对接 IM 渠道的正确语义。
7. **失败语义清单化**：每个部件回答"失败了会怎样"，全部收敛到"落账 + 退避/降级 + 不扩散"（4.3 的表可当验收清单用）。
8. **"装配共用、执行分叉"的多后端姿势** + 指纹守卫（自我可变与会话连续的桥）。
9. **checkbox 文件当队列 + 文件所有权地图**：文件是人/模型/代码三方共笔的 API，但每份文件有唯一主笔——"代码为 agent 写"的具体化。
10. **记忆分层与注意力预算**：L1 直觉硬预算（≤100 行）、L2 指针化按需展开、L3 史料蒸馏上行——对"RAG vs 长上下文"之争的第三种回答。
11. **"代码测量、模型裁决"的梯度管道 + 信息流单向阀**：lint 派单 → 分区消化 → 编辑门 → git 入库；每条信息流边都问过"会不会自激"。
12. **自我 = git 仓库，大脑 = 租来的 harness**：认知演化物化为可 revert 的提交；工具执行环整个租用（Claude Code / Codex），运行时因此得以极薄。

**三个清醒认识**（局限）：

1. **闭源 + 单机**：License 为 Private，不可 fork；单进程 Map+Promise 编排，无横向扩展；控制面无鉴权。学它的架构，别指望用它的代码。
2. **自我迭代深度止于提示词拓扑**：它不能给自己写新工具/新代码（对比 pi），也没有对"改完之后变好了没有"的自动验证关卡——effectiveness 轨迹是事后证据，不是发布前测试。
3. **后台成本与后端强绑**：潜意识按节拍烧钱；推理后端只有 claude/codex 两值，换第三家要等上游。

**与本仓库长期目标的一句话衔接**（详见 [`AGENT_FRAMEWORKS_COMPARISON.md`](./AGENT_FRAMEWORKS_COMPARISON.md)）：对"贝叶斯 + 可持续自我迭代 + long-horizon 金融预测"的目标 agent，duoduo 的可搬件恰好是上面第 5、9、10 三条——把 `prediction.made / prediction.resolved` 做成 WAL 事件（预测先于结果落盘）、把"信念库"做成带 effectiveness 账本的记忆图、把校准复盘做成一个潜意识分区；而它止步的"改完验证关卡"，正是金融场景必须自建的那一层。

---

## 附录 A · 关键路径速查

| 事项 | 路径 |
|---|---|
| WAL / 索引 | `~/.aladuo/var/events/YYYY-MM-DD.jsonl`（+ `index/by_id`、`by_session`） |
| 会话状态 / mailbox | `~/.aladuo/var/sessions/<sha256(key)>/{state.json, mailbox.md, mailbox/pending/}` |
| outbox / 用量台账 | `~/.aladuo/var/outbox/…`；`~/.aladuo/var/usage/<sessionKey>.jsonl` |
| kernel（git） | `~/aladuo/{CLAUDE.md, memory/, subconscious/}` |
| 值班表 / cadence 队列 | `~/aladuo/subconscious/playlist.md`；`~/.aladuo/var/cadence/queue.md` |
| 分区收件箱 | `~/.aladuo/var/subconscious/<partition>/inbox/*.pending` |
| 控制面 | `POST 127.0.0.1:20233/rpc`（JSON-RPC 2.0）；`GET /dashboard` |
| 持久 env | `~/.config/duoduo/.env`（`DUODUO_NODE_BIN`、`ALADUO_CLAUDE_AUTH_SOURCE`、飞书凭据等） |
| 渠道插件 | `~/.aladuo/plugins/channels/<type>/{package/, manifest.json, run/pid.json, run/plugin.log}` |
| 渠道配置 | kind 级 `~/aladuo/config/<kind>.md`；实例级 `~/.aladuo/var/channels/<id>/descriptor.md` |

## 附录 B · 出厂四分区速查

| 分区 | 冷却/超时 | 一句话职责 |
|---|---|---|
| cadence-executor | 1 拍 / 10min | 纯路由器：把 cadence 队列的 checkbox 任务分发到目标分区收件箱 |
| memory-committer | 3 拍 / 30min | kernel 的 git 守门员：五道审查门，只 `git add` + `git commit` |
| memory-weaver | 5 拍 / 35min | 记忆编织：scanner 做梦 → crystallizer 结晶 → intuition-updater 凭证据改广播板 |
| pattern-tracker | 7 拍 / 15min | 把纠错炼成 lesson-*、把重复炼成 groove-* 可调用技能 |

## 附录 C · 材料与可信度

- **证据基础**：本文全部机制主张来自①还原源码（`reconstruction/recon/*.recon.js`，经 47 万节点 AST 全等证明与出厂 bundle 语义等价，见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md)）；②npm 包内 `bootstrap/` 与仓库 `subconscious/`、`skills/` 的提示词原文；③本机活体 daemon 的只读观测（`~/aladuo` git log、cadence 队列、分区收件箱、RPC）。三路交叉印证。行号锚点指 `daemon.pretty.js`（与 `daemon.recon.js` 行号一致，偶有 ±2 漂移）。
- **显式标注的推测点**（其余均 confirmed）：①Codex 适配器不重复注入 identity 的**动机**（行为是事实）；②`metaPromptDstPath = ~/.claude/CLAUDE.md` 疑为遗留路径（无调用点）；③"回滚点"无自动回滚代码（grep 未命中，属否定性结论，置信高）；④渠道插件进程无自动重启（CLI/daemon 两侧全量搜索无 supervisor 逻辑，否定性结论，置信高）。（注：v0.5.10 起工具面已由 denylist 反转为 allowlist，`DEFAULT_DISALLOWED_TOOLS` 退役、`CLAUDE_CORE_TOOLS`/`PARTITION_CORE_TOOLS` 上位，均为 confirmed，不再含"禁用动机"这一推测项。）
- 渠道一节（2.5）另有实包证据：`@openduo/channel-feishu` v0.5.9 从 npm 解包核验（WebSocket 长连接、session_key 派生、卡片/语音渲染均出自其 `dist/plugin.js` 与 README），配置与运维流程比照仓库 `skills/duoduo-channel-admin/` 官方技能文档。
- 如需逐机制的完整证据表与对抗验证记录，见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)。
