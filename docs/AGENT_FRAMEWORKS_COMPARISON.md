# 三个自治 Agent 框架对比调研:duoduo · hermes-agent · pi

> 调研日期:2026-07-03  
> 调研目标:深度理解三个项目各自的思路框架与逻辑,对比优劣,为构建**充分运用贝叶斯第一性原理、可持续自我迭代、擅长 Long-Horizon 金融预测任务的 agent** 提供选型与融合架构依据。  
> 取证方式:duoduo — 本仓库对 v0.6.2 minified 运行时的还原源码级逆向(入门读 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md),逐机制证据见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)、[`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md),全部机制主张带 `file:line` 且经活体 daemon 印证);hermes-agent 与 pi — 克隆源码后由独立分析 agent 系统性深读,关键论断带 `文件:行号` 证据。

---

## 0. 一句话结论

**三个项目回答的是同一个问题的三个不同层面:"agent 的哪一部分应该交给代码?"** duoduo 的答案是"代码守骨架(持久化/生命周期/调度/并发),模型做一切裁决"——它是概念架构最完整的**自治运行时**,但闭源不可 fork;hermes-agent 的答案是"代码守成本与生存(缓存/崩溃恢复/安全边界),模型积累知识"——它是工程化最扎实的**开源长驻个人 agent**,学习闭环真实可用,但自我迭代深度被刻意锁死;pi 的答案是"代码只守认知执行的最小内核(agent loop + 会话树 + 多模型层),其余一切——包括 agent 给自己写新工具——都是扩展"——它是 harness 工程学最干净的**可组装库**,但自主性与记忆完全留白。

**三者恰好构成一个互补三角:duoduo 给"自治架构蓝本",hermes 给"生存与学习闭环的工程参考",pi 给"可直接复用的开源构件"。而目标 agent 最核心的贝叶斯层(预测记录簿、显式概率信念库、校准回路)三者都没有,必须自建**——融合路线见 §6。

### 三项目速览

| | **duoduo** | **hermes-agent** | **pi** |
|---|---|---|---|
| 出品方 | openduo(个人/小团队) | Nous Research | Earendil Works(Mario Zechner,libGDX 作者) |
| 一句话定位 | "会自我编程"的长驻自治 agent **运行时** | 自我改进的长驻**个人 agent**,"活在你所在的地方" | 自我可扩展的**极简编码 harness**(库 + 终端产品) |
| 语言/形态 | Node.js daemon(npm 分发 minified JS,约 7.9 万行 beautified) | Python 单体核心(~62 万行非测试)+ TS 界面层(~26 万行) | TypeScript monorepo,5 包共约 10.9 万行源码 + 8.1 万行测试 |
| License | **Private, All rights reserved**(闭源,"openduo 不开源"是自嘲梗) | MIT | MIT |
| 推理引擎 | 委派 Claude Code SDK / Codex / Grok(三值枚举后端,v0.7.1 起) | 自建 API 层,30 家 provider、5 种 api_mode | 自建 pi-ai 层,9 协议 × 35 provider × 1034 模型 |
| 持久化哲学 | **应用层事件溯源 WAL**,文件系统即数据库 | SQLite transcript 库(WAL 模式)+ 文件式记忆 | append-only JSONL **会话树**(可分支/fork,无全局事件日志) |
| 后台自治 | 37min cadence 心跳 + 潜意识分区(无人也自转) | gateway 常驻 + cron 调度器 + 后台 review agent | **无**(无调度器无守护进程;RPC/SDK 可被外部驱动) |
| 自我迭代面 | 提示词拓扑可自改(分区/playlist/广播板),git 回滚 | skills + memory 知识层(代码/配置自改被禁止) | agent 可给自己写扩展/skill,`/reload` 热生效(无自主发起) |
| 跨会话记忆 | 广播板 + 知识图 + effectiveness 轨迹,潜意识自动维护 | MEMORY.md/USER.md + FTS5 全历史检索,后台自动沉淀 | **无**(仅静态 AGENTS.md,从不自动写) |

---

## 1. duoduo:把智能做成"可崩溃恢复的进程"

### 1.1 定位与设计哲学

duoduo 是一个**长驻自治 agent 运行时**:它把智能做成可持久、可崩溃恢复的进程,而不是一次性请求/响应包装器。核心哲学是一条清晰的边界纪律——**薄运行时 + 基础模型**:运行时只拥有"模型无法可靠拥有的东西"(持久化、生命周期、调度、并发边界),一切推理、内容改写、语义裁决诚实地委派给模型。模型升级即系统升级,无需改代码。

一个激进的产品立场:运行时以 minified JS 发布在 npm,GitHub 仓库不含源码(License: Private)。作者的说法是"代码是写给 agent 读的,压缩只是省带宽"。本仓库已把它还原为可读且经 AST 等价证明可同样运行的源码(见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md)),因此下述机制均有源码级证据。

### 1.2 架构与核心机制

单 daemon 单进程,两个根目录:`~/aladuo`(内核/"内在世界",git 管理,自编程回滚点)与 `~/.aladuo`(运行时数据 `var/`、`run/`)。控制面是 loopback JSON-RPC(`:20233/rpc`)+ 零依赖单文件 dashboard。

**机制一:事件溯源 WAL,append-before-execute(`daemon.pretty.js:31573/31109`,confirmed)。** 每条入站事件先原子写入 `var/events/YYYY-MM-DD.jsonl`(WAL 行 + by_id 索引 + 有 session_key 才写 by_session 索引),**然后**才入队/执行。所有其他状态(会话、去重表、消费进度)都是可从"日志 + 指针"重建的派生视图,零数据库。实测 `daemon restart` 后 runtime_id 不变、会话与 WAL 从文件完整重建——**进程可丢弃,状态在文件里**。

**机制二:双注入面上下文工程(`WT`@57186 / `Sde`@61156,confirmed)。** 稳定认知(身份/通道人格/记忆广播板)由 `buildSystemPromptForChannelConfig` 六层一次装进 system prompt 前缀,吃满 prompt cache;易变具身状态(时间流逝、被打断、job tick)由 `buildTransientUserBlocks` 每 turn 瞬态塞进 user 消息,不污染缓存前缀。Claude 与 Codex 共用同一装配器,Codex 只多一层 `<aladuo:system-context>` 壳。

**机制三:session actor 会话编排(§3 of internals doc,confirmed)。** 一个外部身份扩成多内部会话:一 key 一 actor(内存 Map),session_key 前缀纯函数派生平面与权限(`stdio:`/`job:`/`meta:` 前缀即能力边界);两层锁(跨重启进程写锁 + 按 key 异步互斥);双有界池(channel=10 / job=6),idle 主动让槽、前台附着钉活。抢占是**边界感知**的:能续喂就活流注入(steering),要打断也只在 tool_use/tool_result/accept 边界,绝不硬 kill 半个工具调用。

**机制四:双环认知——Cortex + Subconscious(`daemon.pretty.js:78916/78020`,confirmed,活体实测)。** 前台响应实时消息;后台潜意识挂在 37 分钟 cadence 心跳上,经三重节流门(重入门、**内存指纹活动门**——记忆没变就整拍跳过、每分区 cooldown + 线性退避)唤起**无状态一次性 LLM 分区会话**做自我维护:"每 tick 唤醒潜意识的一块,做完就回去睡——除了写进文件的,不记得上次。"调度表 `playlist.md` 是 agent 自己可改写的纯文本状态机。

**机制五:记忆系统——"代码测量、模型裁决"(§7 of internals doc,confirmed)。** 记忆效用被物化为**图可达性**:广播板 `memory/CLAUDE.md` 是唯一根,沿 `[[slug]]` wiki-link 闭包触达不到的节点即孤儿。daemon 侧只做只读 lint 测量与带 48h 宽限 + 双 flag + git 软删的孤儿 GC,**永不改内容**;一切改写交给 memory-weaver 三段流水线(spine-scanner → entity-crystallizer → intuition-updater),证据链"事件→fragment→effectiveness→改板"可复算,专门压制 LLM 编造统计的幻觉。dossier 中每条主张带六种**认识论模态标签**:`[observation]` / `[inference]` / `[instruction]` / `[conditional]` / `[hypothesis (unratified)]` / `[superseded]`。闭环:经验→事件日志→潜意识加工→广播板→下一次会话经 system prompt 自动注入。

**机制六:自编程认知拓扑 + 双层能力边界。** 分区可以改自己的提示词、新建分区、调整 playlist、写全局广播板;禁改 spine 数据、锁文件、他人分区、`contract:` frontmatter。内核 git 管理,每次自改前提交即回滚点。关键设计:**软边界写在提示词(模型可违反),机器真正强制的只有两处**——契约门 `enforceContractGate`(6 种拒因)与 `disallowedTools`。这条"哪些不变量必须落在运行时强制"的划分纪律,是自治 agent 设计的教科书样本。

### 1.3 优势与局限

**优势**
1. **唯一真正为无人值守长期运行设计的架构**:崩溃可重放(WAL rehydrate 实测无损)、后台自治(心跳 + 活动门"没有新证据不空转")、成本可观测(usage 账本 + drain record)。
2. **记忆自治闭环工程化最完整**:从事件到直觉层的全链路自动化,且每一步可审计("事件→证据→效果→改写"可复算链)。
3. **边界纪律清晰**:"代码守骨架、模型做裁决"贯穿八个子系统,可确定的交给代码(可达性 BFS、lint、GC),语义判断交给模型(内容改写、任务分发)。
4. **自我迭代有真实落地且有安全网**:提示词拓扑自改 + git 回滚点 + 契约硬边界,在"可演化"与"可控"间取得平衡。
5. **上下文工程的双注入面**是可复用的单点设计:缓存友好与具身感知两个冲突目标同时满足。

**局限**
1. **闭源 + minified**:License 为 Private,不可 fork、不可改内核代码;自定义只能在提示词/分区层。审计依赖逆向(本仓库已解决)。
2. **单机单进程**:Map + Promise 编排,无横向扩展;控制面无鉴权(押注 loopback 单用户);`uncaughtException` 直接退出靠外部重启。
3. **后台持续烧 token**:潜意识即使无人对话也按 cadence 消耗(可调间隔,活动门可缓解)。
4. **后端强绑**:claude/codex/grok 三值枚举(v0.7.1 新增 grok),换推理后端仍需等上游支持。
5. **无任何预测/校准基础设施**:effectiveness 轨迹(STRENGTHENING/WEAKENING)与 `[hypothesis]`→`[superseded]` 模态标签是信念更新的雏形,但无显式概率、无打分规则。

---

## 2. hermes-agent:开源界工程化最扎实的长驻个人 agent

### 2.1 定位与设计哲学

Nous Research 出品,MIT 协议,Python 单体(v0.18.0)。README 自我定位:"**The self-improving AI agent**……唯一内置学习闭环的 agent——从经验创建 skills、使用中改进它们、自我提醒沉淀知识、搜索自己的过往对话、跨会话构建对用户不断加深的画像"(`README.md:19`)。它要解决的问题:主流 coding agent 是"开着终端才活着"的工具,Hermes 要做**长驻、跨平台(Telegram/Discord/Slack/WhatsApp/Signal/Email/CLI/TUI/桌面/IDE)、跨会话积累知识、可无人值守跑定时任务**的个人 agent。

两条纲领写在开发者文档最顶端(`AGENTS.md:16-27`),作者称其"塑造几乎每一个设计决策":

1. **"Per-conversation prompt caching is sacred."** 任何会话中途改写历史上下文、换工具集、重建 system prompt 的行为都会击穿缓存、放大用户成本——一律不做(唯一例外是上下文压缩)。
2. **"The core is a narrow waist; capability lives at the edges."** 每个核心工具都随每次 API 调用发送,所以进核心的门槛极高;能力扩张全部发生在边缘(skills/插件/MCP)。配套"Footprint Ladder"六级决策框架:新能力从"扩展现有代码"到"核心工具(最后手段)"逐级选最小足迹。

安全哲学同样鲜明:**"唯一对抗对抗性 LLM 的安全边界是操作系统"**——进程内的审批门/黑名单都只是启发式,容器才是边界(`SECURITY.md:58-65`)。

### 2.2 架构与核心机制

多入口共享同一 agent core:CLI 单进程、`hermes gateway` 长驻 daemon(单进程内约 20 个平台 adapter + cron ticker 线程 + kanban dispatcher)、TUI(Node⇄Python 双进程 JSON-RPC)、Electron 桌面、IDE(ACP 协议)。主循环**完全同步**(`agent/conversation_loop.py:633`):迭代预算内反复"API 调用→工具派发→结果回填",默认父 90 / 子 50 次迭代。

**机制一:缓存工程做到极致。** system prompt 三层组装(`agent/system_prompt.py:113`):stable(人格/行为指导/skills 索引)→ context(项目文件)→ volatile(MEMORY.md 快照/时间行,放最后、永不指望缓存)。三个硬机制:每会话只 build 一次并持久化,resume 直接复用**字节级**相同的 prompt 字符串;时间戳刻意只精确到**日期**(注释明言分钟级会杀死 KV 缓存,模型要精确时间就调工具);**skill 全文以 user 消息注入**而非 system prompt——加载 skill 完全不碰缓存前缀。

**机制二:三层正交记忆。**
(a) 文件式策展记忆 `MEMORY.md`(agent 自我笔记)+ `USER.md`(用户画像),采用**"冻结快照"一致性模型**:会话开始时注入,会话中写入立即原子落盘但不改 system prompt——写持久、读延迟到下次会话(`tools/memory_tool.py:11-15`)。
(b) SQLite 会话库:全部对话入库,**双 FTS5 虚表**(含 CJK trigram)支持 BM25 全历史检索,被压缩归档的旧消息仍可搜到(`hermes_state.py:802-855`)——"搜索自己的过去"的实现。
(c) 外部 memory provider 插件 ABC(honcho/mem0/supermemory 等 8 个)。

**机制三:学习闭环(核心卖点,机制真实)。** 每 N 个用户 turn(默认 10)触发 nudge → **后台 fork 一个受限 review agent**(工具白名单仅 memory/skill,daemon 线程内重放对话快照,不阻塞主会话)反思"这个会话学到什么",驱动 prompt 明确要求"多数会话至少产出一次 skill 更新",且优先改进已有 skill 而非新建(`agent/background_review.py:171-274`);**Curator** 做规模化整理:确定性 active→stale→archive 状态机(30/90 天)+ 可选 LLM 合并,运行前 tar.gz 快照可回滚,只碰 agent 自建 skill、**从不删除**(`agent/curator.py:291,1537`)。

**机制四:崩溃韧性系统化。** API 调用构造前就落盘("early crash-resilience persist",`run_agent.py:1755`);SQLite WAL + 周期 checkpoint;重启 resume 前经 `replay_cleanup.py` 净化坏尾(剥掉悬空 tool_calls,防无限重启循环);gateway 非干净退出时 120 秒内活跃会话自动续跑;重启熔断器防 crash-respawn 风暴。**注意:这是 transcript(事务日志)级持久化,不是 duoduo 那种应用层事件溯源**——后台委派任务明确不能挺过进程重启(`AGENTS.md:1011-1013`)。

**机制五:工具体系与安全分层。** 核心窄腰约 40 个工具 + check_fn 门控(探测失败自动从 schema 剔除,带 TTL 缓存);完整 MCP 客户端(三传输/OAuth/恶意包预检)。两个特色工具:`delegate_task`(spawn 受限子 agent,后台执行,摘要回注)与 **`execute_code` = Programmatic Tool Calling**——LLM 写 Python 脚本,子进程经 Unix socket 回调白名单工具,**中间结果永不进上下文、只有 stdout 返回**("zero-context-cost turns")。安全:`rm -rf /` 级硬底线连 yolo 都不可绕过;审批三档(manual/smart/off,smart 用辅助 LLM 评估风险);六种终端后端(local/docker/ssh/singularity/modal/daytona),Docker cap-drop ALL;低信任子进程默认剥离 API key。

**机制六:多模型基建。** 30 家 provider 插件 × 5 种 api_mode transport;models.dev 元数据(4000+ 模型价格/窗口/能力);credential_pool 多凭据轮换 + 分级冷却;fallback_chain 跨 provider 故障转移;reasoning 参数归一化后翻译到各家方言。**这是三者中多后端支持最深的**。

**机制七:自主性。** cron 任务 = 自然语言 prompt + 调度表达式,支持前置数据采集脚本注入、任务链(`context_from`)、按任务覆盖模型/skills、多平台投递;Chronos scale-to-zero(空闲进程停止,外部 webhook 唤醒);kanban 多 agent 工作队列(SQLite 板 + dispatcher 自动认领派发);verification_stop 护栏("改了代码没有新鲜验证证据就想收尾"时强制注入验证 nudge)。**自我修改代码?不存在且被刻意禁止**:文件工具直接拒绝编辑 config,`hermes update` 需审批——进化被约束在知识产物(skills + memory)层。

### 2.3 工程成熟度

Python 总计 130 万行,其中**测试 69 万行 / 1923 个测试文件**;TS 约 26 万行。代码内 PR 编号已达 #50372,万级 PR 量、极高迭代速度。测试纪律成熟(hermetic CI、反对 change-detector 测试、依赖上界+SHA 钉死)。技术债自知(`gateway/run.py` 2 万行 god-file,官方列为求贡献项)。

### 2.4 优势与局限

**优势**
1. 缓存工程直接转化为成本优势,是大多数开源 agent 完全忽视的维度。
2. 学习闭环真实实现:nudge → 后台 review agent → curator 生命周期(带快照回滚)→ FTS 全历史检索,四环相扣且不阻塞主对话。
3. 崩溃韧性形成完整无人值守生存链。
4. 安全模型诚实且分层,硬底线不可绕过。
5. MIT 开源 + 扩展纪律严明(插件五面,"插件不许碰核心文件"),**可 fork 可改造**。

**局限**
1. 单机单进程,无分布式;状态在本地 SQLite。
2. 持久化是 transcript 级而非事件溯源,无"每个结论可回放到当时输入"的审计语义;后台委派不能跨进程重启存活。
3. 主循环完全同步 + 巨型文件(2 万行 gateway),理解成本高。
4. **自我迭代上限被刻意锁死**:只能改 skill/memory,不能改自身代码与配置——安全上是优点,对"可持续自我迭代"的深度是硬上限:它只会知识上更多,不会架构上更强。
5. LLM 摘要压缩有信息损耗风险,靠 FTS 归档补偿但需 agent 主动想起去搜。

**与贝叶斯目标的距离**:全仓无任何贝叶斯/概率/校准/打分规则基础设施(grep 证实);金融相关仅 8 个 Excel 建模 skill(DCF/LBO/comps),是投行作业助手不是预测系统。但其**冻结快照记忆模型天然是"批式贝叶斯更新"的工程形态**(先验会话内冻结、证据立即落盘、下周期更新先验),后台 review agent 模式可直接复用为**预测结算后的校准复盘 agent**。

---

## 3. pi:harness 工程学最干净的样本——核心只有三件事,其余皆扩展

### 3.1 定位与设计哲学

Earendil Works 出品(作者 Mario Zechner,libGDX 作者),MIT,TypeScript monorepo。自我定位:"**minimal terminal coding harness**……**Adapt pi to your workflows, not the other way around**, without having to fork and modify pi internals"(`packages/coding-agent/README.md:15`)。README 首页称之为 "**self extensible coding agent**"。

设计宣言是全项目最浓缩的一段"减法哲学"(`packages/coding-agent/README.md:487-501`),逐条拒绝主流 coding agent 的标配:

- **No MCP**——用 "CLI 工具 + README"(Skills)替代,或自己写扩展加回来;
- **No sub-agents**——用 tmux spawn pi 实例,或自己写扩展;
- **No permission popups**——"跑在容器里,或用扩展自建确认流";
- **No plan mode / No built-in todos**("它们让模型困惑,用 TODO.md 文件")/ **No background bash**("用 tmux,完全可观测")。

安全立场同样激进且诚实(`README.md:39`):"pi **不含内置权限系统**"——边界整体外包给容器/微虚拟机。与 Claude Code 的关系:完全独立实现(不基于 Claude Agent SDK),把 Claude 当作众多后端之一(Pro/Max OAuth 接入),同时主动兼容其生态(自动读 `CLAUDE.md`/`AGENTS.md`,可挂载 `~/.claude/skills`)。**差异的本质是治理哲学:Claude Code 把治理内建,pi 把治理全部外推,换取一个约 5 万行、行为完全可预测的核心 + "缺什么让 agent 自己写扩展"的路径。**

### 3.2 架构与核心机制

Monorepo 五包 lockstep 发版,单进程模型(交互 TUI 进程即一切),**无守护进程**:

| 包 | 职责 | 规模 |
|---|---|---|
| `pi-ai` | 统一多提供商 LLM 层:9 协议 × 35 provider × 1034 模型、认证、流式、成本核算 | ~35.4k 行 |
| `pi-agent-core` | 与 UI 无关的 agent 运行时:loop、工具执行、事件流、消息队列 | ~8.1k 行 |
| `coding-agent` | 产品层:CLI、四种运行模式、会话树、压缩、7 个工具、扩展系统 | ~51.5k 行 |
| `pi-tui` | 手写终端 UI 框架(差分渲染),仅 2 个外部依赖 | ~12.1k 行 |
| `orchestrator` | **实验性**多实例监督器(0 测试,官方声明可能随时移除) | ~2.0k 行 |

**机制一:双层 agent loop + 双钩子(`packages/agent/src/agent-loop.ts:155-269`)。** 内循环"流式产出→执行工具→回填";外循环在 agent 本该停止时轮询 follow-up 队列,有排队消息则再起一轮。两个改写切口贯穿始终:`transformContext`(**每次 LLM 调用前可重写整个上下文**)与 `prepareNextTurn`(轮间可换 context/model/thinkingLevel——压缩与换模型都从这里切入)。另有 steering/follow-up 双队列支持"边跑边转向"。工具默认并行执行,任一工具声明 sequential 则整批转串行。

**机制二:极短 system prompt + "指路"哲学(`core/system-prompt.ts:28-173`)。** 默认系统提示词全文约 40 行:工具一行摘要 + 两条常驻 guideline + **pi 自身文档的磁盘绝对路径**("用户问 pi 自己时才去读")。知识放进文件系统而非灌进上下文:Skills 按 agentskills.io 标准**渐进披露**——启动只注入 name+description,匹配任务时 agent 自己 `read` 全文。

**机制三:append-only JSONL 会话树(`session-manager.ts`)。** 每会话一个 JSONL 文件,**全部条目带 `id`/`parentId`**;当前位置是 leaf 指针,`branch()` 只移指针不删历史,`branchWithSummary()` 保留被放弃路径的摘要;`/tree` 树内跳转、`/fork` 抽出新会话文件。LLM 上下文由 leaf→root 回溯构建。**这是三者中唯一把"多假设分支推演"做成一等公民的设计**,但粒度是会话而非全局事件,且**跨会话记忆不存在**(经源码证实:无 memory 工具、无自动记忆文件)。

**机制四:压缩(`core/compaction/compaction.ts`,891 行)。** 触发于 token 超过窗口减预留(默认保留最近 20K token);切点只允许落在消息边界、**绝不切开 toolCall/toolResult**;LLM 生成结构化摘要且**迭代更新**(上一份摘要作为输入);单轮超预算有 split-turn 特例;摘要 details 结构化追踪 `{readFiles, modifiedFiles}`。压缩 append-only,旧条目永不改写。扩展可整体接管压缩策略。

**机制五:扩展系统(核心卖点)。** TypeScript 模块经 jiti 运行时加载**无需编译**;约 35 种事件覆盖全链路:`registerTool`/`registerCommand`、`context` 事件(每次 LLM 调用前改上下文)、`beforeToolCall`(可拦截)/`afterToolCall`(可改写结果)、`session_compact`(接管压缩)、自定义 provider、自定义 UI;**`/reload` 热重载**。官方 80 个示例扩展等于"被拒入核功能"的参考实现:plan-mode、subagent、sandbox、permission-gate、git-checkpoint 等。`pi install <npm|git>` 安装含 extensions/skills/prompts/themes 的共享包。

**机制六:pi-ai 多模型层(可独立使用)。** 9 种线协议(anthropic-messages/openai-completions/responses/codex/google/vertex/bedrock/mistral 等)× 35 provider;模型目录从 models.dev 自动生成;OAuth 支持 Claude Pro/Max、ChatGPT Codex、Copilot;**中途换模型是设计目标**:逐消息转换器处理异模型 thinking 块降级、tool-call ID 重写、孤儿 toolCall 补结果等脏细节;统一流事件、"错误编码在流内绝不 throw"契约;逐 token 成本核算。

**机制七:自我扩展闭环(已打通,但不自主)。** 证据链:系统提示词内嵌自身 docs 路径 → `docs/skills.md:1` "**pi can create skills. Ask it to build one for your use case**" → agent 写扩展放入 `.pi/extensions/` → `/reload` 立即生效。仓库自身就吃自己狗粮(`.pi/` 下有 3 个扩展、5 个 prompt 模板、教 agent 给 pi 加 provider 的 skill)。**但 pi 不会自主发起任何行为**——所有自我修改都发生在人(或外部驱动程序)发起的会话内,没有 duoduo 那种心跳/后台认知循环。

### 3.3 工程成熟度

约 10.9 万行源码 + 8.1 万行测试(**测试:源码 ≈ 0.74:1**,tui 包测试比源码还多)。亮点:**faux provider**——注册进真实 provider registry 的进程内假 LLM,让整个 AgentSession 栈无网络无密钥确定性运行,回归测试按 issue 编号归档;`strict:true` + Biome error-on-warnings;供应链硬化(精确锁版、`min-release-age=2` 防同日投毒、CI ignore-scripts);coding-agent 文档 29 篇约 9600 行;依赖极简(coding-agent 仅 18 个运行时依赖,无任何框架)。弱点:orchestrator 零测试。

### 3.4 优势与局限

**优势**
1. "减法哲学 + 万能扩展点"架构自洽:核心不可协商地小,但扩展 API 覆盖全链路,80 个官方示例证明表达力。
2. 多模型工程深度业内少见:跨模型 handoff 处理到 thinking 签名/tool-call ID 级别,不是"能换就换"。
3. 会话即树、append-only、可审计:分支/回溯/摘要放弃路径全部无损。
4. 测试体系让 agent 行为可回归(faux provider + 全栈确定性 CI)——多数 agent 项目做不到。
5. 自我扩展闭环真实打通,作者用 pi 开发 pi。

**局限**
1. **零权限系统**(官方承认):不容器化时提示词注入直达用户全部权限。
2. **无跨会话记忆**:长期经验只能靠人手工维护 AGENTS.md。
3. **无自主性基座**:无调度、无守护进程、无内置子代理;orchestrator 是零测试实验品。
4. token 核算粗糙(chars/4 启发式);叙事摘要压缩对精确数值/概率不友好。
5. 单会话单 actor,并发靠多进程,进程间无共享状态设施。

---

## 4. 横向对比:十个维度

先给读法:**这张表不是"谁分高"的评分卡,而是"每个维度上谁的答案最值得抄"的索引。** 加粗单元格 = 该维度上最值得借鉴的设计。

| 维度 | duoduo | hermes-agent | pi |
|---|---|---|---|
| **① 设计哲学** | **"代码守骨架、模型做裁决"**——机器强制的边界收敛到极少数硬闸门(契约门/disallowedTools),其余全交模型 | "缓存神圣 + 窄腰核心"——一切决策服从成本与生存 | "减法 + 自我扩展"——核心只留 loop/会话树/模型层,治理外包 |
| **② 持久化与崩溃恢复** | **应用层事件溯源 WAL,append-before-execute**;一切状态是"日志+指针"可重建的派生视图;重启实测无损 | transcript 级:API 调用前落盘 + SQLite WAL + resume 坏尾净化 + 重启熔断;恢复到"最后一次已提交往返" | 会话粒度 append-only JSONL;可恢复可分支,但无全局事件日志、后台任务不存在故无恢复问题 |
| **③ 上下文工程** | 双注入面:稳定认知进 system 前缀、易变具身状态进 user 瞬态块;`[[slug]]` 指针默认不展开 | **缓存工程最极致**:三层 prompt、日期级时间戳、skill 走 user 消息、resume 字节级复用 | 极短 prompt + 文件系统"指路";skills 渐进披露;`transformContext` 钩子可整体重写 |
| **④ 记忆与知识沉淀** | **闭环最完整**:事件→潜意识加工→知识图(可达性=效用)→广播板→自动注入;六种认识论模态标签;证据链可复算 | 三层记忆(冻结快照文件 + FTS5 全历史 + provider 插件);后台 review agent 自动沉淀 | 无(设计上留白,靠扩展自建) |
| **⑤ 后台自治/长时程** | **心跳 + 潜意识分区 + 三重节流门**("没有新证据不空转");无状态分区每 tick 冷启动 | cron(自然语言任务 + 前置脚本 + 任务链)+ kanban 队列 + Chronos scale-to-zero | 无;RPC/SDK 协议完备,可被外部调度器驱动 |
| **⑥ 自我迭代** | **拓扑层自改 + git 回滚 + 契约硬边界**——三者中唯一敢让 agent 改自己认知结构的 | 知识层自改(skills/memory),curator 生命周期 + 快照回滚;代码/配置自改被禁止 | 工具层自改(agent 写扩展 + `/reload` 热生效),但需人发起、无验证关卡 |
| **⑦ 多模型后端** | claude/codex/grok 三值枚举(诚实但封闭,v0.7.1 起三值) | 30 provider × 5 api_mode + credential_pool + fallback_chain | **9 协议 × 35 provider × 1034 模型 + 中途换模型**,且 pi-ai 可独立复用 |
| **⑧ 工具与安全** | 权限走 permissionMode 透传 SDK;host 默认 bypass;控制面无鉴权(loopback 假设) | **分层最完整**:硬底线(yolo 不可绕)+ 审批三档 + 六种终端后端 + 凭据剥离 | 内置 7 工具、零权限系统(靠容器);`beforeToolCall` 拦截机制现成、策略自建 |
| **⑨ 可观测性与成本** | **usage 账本 + drain record + 单文件 dashboard + spine.tail**;潜意识开销可见 | 实时 token 占用八类分解;成本随 models.dev 价格核算 | 逐 token 成本核算内建于 pi-ai;会话可导出 HTML |
| **⑩ 开放性与工程成熟度** | 闭源(Private);单人节奏;逆向可读但法律受限 | MIT;万级 PR、69 万行测试、纪律文档化程度罕见 | **MIT;测试:源码 0.74:1、faux provider 全栈回归、供应链硬化** |

三句话总结这张表:

1. **架构完整性:duoduo > hermes > pi。** 只有 duoduo 同时解决了"事件级可信、后台自治、记忆闭环、受控自迭代"四件事——这正是 long-horizon 自治 agent 的完整问题列表。
2. **工程可用性:hermes ≥ pi > duoduo。** 两个 MIT 项目都能 fork;hermes 是"整机"(装上就能长驻),pi 是"构件"(三层库 + 扩展点,自己攒)。
3. **与贝叶斯目标的距离:三者等距。** 预测记录簿、显式概率信念库、打分规则、校准回路——**三个项目都没有**(hermes 与 pi 经全仓 grep 证实,duoduo 只有 effectiveness 轨迹雏形)。这层必须自建,区别只在"建在谁身上最省力"。

---

## 5. 优劣总评:各自最值得记住的三件事

**duoduo——学它的架构,别指望用它的代码。**
- 最强:append-before-execute 事件溯源(可信之源)、"代码测量/模型裁决"的记忆自治闭环、软硬双层能力边界(自迭代的安全网)。
- 最弱:闭源不可 fork;单机无鉴权;后端封闭。
- 角色定位:**架构蓝本**。它证明了"薄运行时 + 模型裁决"路线在真实系统里成立,且每个子系统的取舍都值得逐条研读(本仓库 `AGENT_INTERNALS_ANALYSIS.md` 已把八个子系统的取舍全部解出)。

**hermes-agent——工程化"长驻 + 学习"的抄作业对象。**
- 最强:缓存工程(直接省钱)、崩溃韧性生存链、真实可用的学习闭环(nudge→后台 review→curator 回滚)。
- 最弱:transcript 级持久化缺事件溯源审计语义;自迭代深度锁死在知识层;巨型文件。
- 角色定位:**整机底座候选 + 生存/学习机制参考**。其插件面(memory provider ABC、自定义工具、cron、Footprint Ladder)恰好为"外挂贝叶斯层"预留了正确的接缝。

**pi——把 agent 拆成可复用构件的最佳示范。**
- 最强:pi-ai 多模型层可单独拿走;会话树 = 天然多假设推演结构;faux provider 让 agent 行为可回归测试。
- 最弱:无记忆、无自主、无权限——三大留白全靠自建。
- 角色定位:**构件库 + 扩展点设计参考**。适合"自建 daemon、只借认知执行器"的路线。

---

## 6. 面向目标 agent 的融合架构建议

### 6.1 先立纪律:贝叶斯第一性原理的四条工程化铁律

金融预测 agent 的可靠性不来自更聪明的模型,而来自**信念管理的纪律**。四条铁律必须由**运行时强制**,不能写在提示词里(duoduo 的"软硬边界"教训:提示词约束模型可违反,关键不变量必须落在代码):

1. **预测先于结果落盘(append-only prediction ledger)。** 每条预测 = 一个不可变事件:`{标的, 命题, 概率, 时限, 依据事件引用, 当时信念版本}`;结果到期后另一条 resolution 事件记录 outcome。校准指标(Brier / log score)从日志**纯函数复算**,agent 无法事后修饰。——这正是 duoduo WAL append-before-execute 的直接移植:把 `channel.message` 换成 `prediction.made` / `prediction.resolved` 事件类型。
2. **先验显式化。** 信念库中每条主张带数值概率 + 证据链,不允许自由文本模糊表述。duoduo 的 dossier + 六模态标签(`[hypothesis]`→`[observation]`→`[superseded]`)是现成的认识论骨架,缺的只是给每条主张加 `p: 0.65, updated_at, evidence: [[...]]` frontmatter;其 effectiveness 轨迹(STRENGTHENING/WEAKENING)换成对数几率增量即是贝叶斯更新。
3. **更新有可复算的审计链。** duoduo memory-weaver 的"事件→fragment→effectiveness→改板"流水线就是似然证据管道的形状:scanner 从事件日志提取证据(必须引用它所检验的信念行)、crystallizer 按信念行累积效果轨迹、updater 改信念前必读该行轨迹。**代码测量、模型裁决**:似然的证据收集可确定(代码),先验→后验的语义判断交模型,但模型的每次更新都必须引用证据文件——压制"LLM 编造统计"的幻觉。
4. **校准回路定期强制运行。** 无人盯着也要复盘:duoduo 的 cadence 潜意识 + hermes 的后台 review agent 是同一个思想的两种实现——预测结算后自动 fork 一个受限复盘 agent,计算分桶校准曲线,把系统性偏差写回信念库(例如"宏观事件类预测过度自信 +0.12,已在先验中扣减")。

### 6.2 数值层与语义层分工

概率计算(后验采样、蒙特卡洛、回测、组合优化)**不该走 token**。hermes 的 `execute_code`(Programmatic Tool Calling:LLM 写脚本,中间结果永不进上下文,只有 stdout 结论返回)是正确形态;pi 的方案是 bash→Python + 自写扩展工具。原则同一条:**LLM 做判断,代码做计算**——这也是防止模型"心算概率"出错的结构性手段。

上下文压缩要防"数值失真":pi/hermes 的 LLM 叙事摘要都会丢精确数字。方案是用 pi 的 `session_compact` 扩展点(或自建等价物)换成**结构化状态快照**(当前持仓假设 / 活跃信念及其概率 / 已证伪假设 / 待验证信号)+ 近期原文——信念的权威版本永远在信念库文件里,上下文只放快照。

### 6.3 两条落地路线

**路线 A:hermes 整机底座 + duoduo 架构思想(求稳、最快到达无人值守)。**
fork hermes-agent,不改核心,全部落在它预留的扩展面上(恰好符合其 Footprint Ladder):
- 贝叶斯层 = 自定义 memory provider(结构化 belief store 替代 MEMORY.md)+ 一组 prediction/resolution/calibrate 工具 + prediction ledger(独立 append-only JSONL,借 duoduo WAL 语义,不依赖 hermes 的 SQLite);
- 长时程 = cron 任务链:`行情采集脚本(no_agent,零 LLM 成本)→ 预测任务 → context_from 链到收盘复盘任务`;市场日历驱动而非固定间隔;
- 自迭代 = 后台 review agent 改写预测 skill,curator 快照回滚 + verification_stop 双护栏照搬;
- 直接白得:30 后端容错、崩溃生存链、审批安全层、多平台通知(预测结果推送 Telegram)。
- 代价:Python 巨型文件的理解成本;事件溯源审计语义要靠自建 ledger 补足;自迭代深度受限于知识层(对金融场景这**反而是优点**——你并不想让 agent 自改交易管道代码)。

**路线 B:pi 三层库自建 daemon(求架构可控、TS 栈)。**
取 pi-ai(多模型)+ pi-agent-core(loop/双钩子)+ 会话树设计,弃其交互产品形态,自建一个 duoduo 形状的外层:
- daemon + 心跳 + WAL 全部按 duoduo 蓝本自写(本仓库还原源码是逐行参考);
- 信念注入走 `transformContext`/`prepareNextTurn` 双钩子(等价于 duoduo 双注入面:稳定信念库进 system 前缀,行情快照/时间流逝进每轮瞬态块);
- 会话树用于**多假设反事实推演**:做多/做空/观望各开一个分支推演,`branchWithSummary` 回到分叉点保留各分支结论——这是三个项目里唯一现成的"平行假设"结构,金融场景价值极高;
- 回归测试照搬 faux provider 模式:给定行情脚本,断言 agent 推理链与预测输出——**agent 行为可回归**在金融场景是硬需求;
- 代价:调度、记忆、权限三大件从零建,到达无人值守的路径比路线 A 长数倍。

**推荐:以路线 A 起步,把路线 B 的两件构件(pi-ai 换模型层可后置、faux-provider 式回归测试立刻抄)嫁接进来;duoduo 全程作为架构对照表使用。** 理由:目标里"可靠的预测"权重最高,可靠性来自纪律(ledger/校准/复盘回路)而非框架新颖度,hermes 让你把全部精力花在贝叶斯层本身;而"可持续自我迭代"在金融场景的正确形态恰是 hermes 式的**知识层迭代 + 硬护栏**,不是 duoduo 式的拓扑自改(后者留作二期,配 git 回滚 + 契约门再开)。

### 6.4 目标 agent 参考架构(融合三者)

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
   │ user 瞬态块 ← 行情/时间    │                                  │ 信念库与预测 skill        │
   └───────────┬───────────────┘                                  └──────────┬───────────────┘
               │ ⑤更新必须引用证据                                            │
               ▼                                                              │
   ┌──────────────────────────  BELIEF STORE(自建,duoduo 记忆系统形状)◄─────┘
   │  每主张:{p, updated_at, evidence[[...]], 模态标签 [hypothesis]/[observation]/[superseded]}
   │  代码测量(可达性/孤儿 GC/lint)· 模型裁决(改写须读 effectiveness)· git 版本化=回滚点
   └──────────────────────────────────────────────────────────────────────────┘
```

### 6.5 金融特化清单(按优先级)

1. **prediction ledger + resolution job**(第一优先):没有它,一切"预测能力"都不可度量。事件 schema 三种足矣:`prediction.made`、`prediction.resolved`、`belief.updated`。
2. **市场日历 cadence**:开盘前(信念快照+当日预测)、收盘后(结算+复盘)、周末(深度校准+skill 整理)三档节拍,替代 duoduo 的固定 37min;duoduo 的活动门思想保留——无新数据不空转。
3. **校准分区**:每周计算分桶校准曲线、过度自信/不足检测、按预测类别分解 Brier;产出写回信念库先验修正。
4. **反事实分支推演**(pi 会话树):重大决策前 fork 多空两条推演分支,各自结论并入决策依据并落 ledger——事后可审计"当时考虑过什么"。
5. **回归测试**(pi faux provider 模式):历史行情重放 + 断言推理链,每次 skill/提示词自迭代后必须通过才允许生效(补上 pi 自我扩展缺失的验证关卡;hermes verification_stop 是现成参考)。
6. **凭据与执行隔离**(hermes 安全模型):行情读取与交易执行分离为不同信任级;交易类工具走硬审批 + 限额,永不进 yolo 白名单。

---

## 7. 结语

三个项目合起来,恰好把"long-horizon 自治 agent"这道题的三层解齐了:**duoduo 解了"如何可信地活很久"(事件溯源 + 后台自治 + 记忆闭环),hermes 解了"如何便宜且安全地活很久"(缓存 + 生存链 + 知识迭代),pi 解了"如何把这一切做成可组装、可测试的构件"(三层库 + 扩展点 + 行为回归)。** 而"如何预测得准且知道自己准不准"——贝叶斯层——是留给我们自己的那一层:预测先于结果落盘、先验显式化、更新可复算、校准强制运行。四条铁律落在运行时里,三个项目的遗产各归其位,目标 agent 的路径就清晰了。

---

## 附录:证据与材料索引

- **duoduo**:[`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)(八大子系统,全部 `daemon.pretty.js:行号` 锚点 + confirmed/未证实标注,经还原源码复核)、[`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md)(部署级,活体实测)、[`../reconstruction/`](../reconstruction/)(可运行还原源码)。
- **hermes-agent**:`github.com/nousresearch/hermes-agent` @ v0.18.0(2026-07-02 快照);本文行号锚点如 `AGENTS.md:16-27`、`agent/conversation_loop.py:633`、`tools/memory_tool.py:11-15`、`agent/background_review.py:171-274`、`agent/curator.py:1537`、`tools/code_execution_tool.py:10-25` 等,均指该快照。
- **pi**:`github.com/earendil-works/pi` @ `21cb380`(2026-07-02);行号锚点如 `packages/coding-agent/README.md:487-501`、`packages/agent/src/agent-loop.ts:155-269`、`session-manager.ts:1277-1315`、`core/compaction/compaction.ts:225-227`、`api/transform-messages.ts:64-220` 等,均指该提交。
- 局限声明:hermes 与 pi 的分析基于单日源码快照 + 文档,未做活体部署实测(duoduo 做过);两仓库均为浅克隆,提交活跃度依据代码内证据(PR 编号、提交日期)推断。
