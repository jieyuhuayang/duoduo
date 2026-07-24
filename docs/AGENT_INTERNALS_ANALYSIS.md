# duoduo Agent 内部框架与运行逻辑
## 一句话结论

**duoduo 是一个"薄运行时 + 基础模型"的自治 agent：运行时只握模型握不住的那部分可确定骨架——以文件事件日志为唯一真理之源的持久化、一 key 一 actor 的生命周期与并发、以及"是否动用模型 / 改不改内容"的边界闸门——把一切推理与裁决诚实地委派给模型。正是这条"代码守骨架、模型做裁决"的边界，让它在单进程内同时做到低延迟前台、崩溃可重放、后台自治。**

这句话贯穿全文八个子系统。它可以拆成四条并列的支撑论点（本文的四个部分）：

| 部分 | 关键句（运行时在哪一面守骨架） | 子系统 |
|------|------------------------------|--------|
| **一 · 前台交互** | **一次前台交互 = 可确定的上下文装配 + 单一长驻会话的受控执行。** 运行时决定"拼什么上下文、何时发一次 query、如何合并/steering/抢占"，模型只在这段上下文上推理。 | §1 认知装配 · §2 Turn/Drain |
| **二 · 会话编排** | **会话是被编排与路由的有状态对象。** 用"一 key 一 actor + 两层锁 + 双有界可让出池"把一外部身份扩成多内部会话，并在 claude/codex 两值枚举上把每个会话诚实路由到对应后端。 | §3 Session Actor · §8 运行时抽象 |
| **三 · 可信之源** | **可信来自一条铁律：先落日志，再执行 / 入队。** Spine 的 append-before-execute 把所有状态变成可从"日志 + 指针"精确重建的派生视图；Gateway 的 WAL-before-enqueue 把入站边界做成"既可重放、又决定是否动用模型"的闸门。 | §4 Spine · §5 Gateway |
| **四 · 后台自治** | **无人对话时，运行时靠心跳自我维护而绝不越权。** 潜意识引擎经活动门节流后唤起无状态一次性 LLM 分区会话做维护，记忆系统只做只读测量与软删 GC，一切内容改写交回模型；机器真正强制的只剩契约门。 | §6 Subconscious · §7 记忆系统 |

> 阅读建议：先读 **§0 端到端流程**（把四条论点拍成一条时间线），再按 Part I→IV 顺序读。每节都是"结论先行"——开头一句是该子系统的领起结论，其后才是代码/运行时证据。
> **定位**：本文是**逐机制证据文档**（工程师复核用）。若你想先建立全貌或以产品视角理解设计思路（自我迭代、双大脑、渠道打通），请先读姊妹篇 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)——它按设计问题组织、结论与类比先行，与本文互为详略；部署视角见 [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md)。

---
## 材料与方法

duoduo 故意以 minified JS 发布（作者立场："代码是给 agent 读的，压缩只为省带宽"）。本文用四种方法交叉取证并经对抗验证，逆向其真实实现：

1. **静态代码 + 调用链追踪**：用 esbuild 反混淆 + js-beautify 把 `dist/release/{daemon,cli,stdio}.js` 展开为可读代码（基准 v0.6.1；daemon 78868 行，约 7.9 万行）。字符串字面量（事件名/RPC 方法/env/日志）在 minify 后完整保留，是证据锚；关键机制**沿真实函数调用链追踪**（跟进被调用的下游函数确认控制流真的这样串联），而非仅凭单个字符串推断。
2. **可读提示词**：`bootstrap/` 下 `meta-prompt.md`（agent 身份/记忆纪律的"宪法"）、`config/*.md`、`subconscious/**` 定义 agent 认知，本身人类可读。
3. **活体运行时调用链**：本机运行的 daemon，用 `duoduo` CLI + `/rpc`（`spine.tail` 事件序列 / `usage.get` drain record / `daemon status`）印证动态行为——动态证据优先于静态推断。
4. **还原源码交叉复核（本轮新增）**：运行时已被还原为可读、且经证明可同样运行的源码（见 [`../reconstruction/`](../reconstruction/)）。关键点：esbuild 的 `__export` 助手**逐字保留了真实导出符号名**（daemon 恢复 702 个），因此本文引用的短名 `ZE`/`nn`/`rn`/`HXe`… 绝大多数能对上**权威原名**（`buildSystemPromptForChannelConfig`/`createSpineEvent`/`atomicAppendEvent`/`createSessionManager`…）。本轮用这些真名源码逐节复核了各机制主张，纠正处见 §9。**短名↔真名全表**见 [`../reconstruction/maps/RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)，可读源码按子系统分文件在 [`../reconstruction/first-party/`](../reconstruction/first-party/)（一等公民共 105 个 = 82 个 `__export` 权威名 + 23 个 RE-inferred）。

**符号命名约定**：下文机制名尽量以「真名 (短名)」形式给出，如 `buildSystemPromptForChannelConfig (ZE)`。真名来自 `__export` 者为权威；少数内部辅助函数的真名系逆向推断，在 `RENAME_TABLE.md` 标 *inferred*，即便名字有偏差也不影响行号与逻辑结论。

**可信度纪律**：8 个子系统各由独立 agent 逆向，再由对抗验证器沿调用链逐条证伪，最后用还原源码复核；每条机制主张标注 `file:line` / 字面量 / RPC / CLI 供复核，置信分 `confirmed` / `未证实推测`。所有行号指反混淆后的 `daemon.pretty.js`（除非另注 `cli`/`stdio`）。凡未证实的推断均显式标注。


---
## §0 端到端：一个消息如何穿过整个 agent 大脑

**这张图就是"一句话结论"的时间展开**：它把四条论点——先落日志再执行（Part III）、稳定认知进 system·易变状态进 user（Part I）、会话被 actor 持有并驱动（Part II）、经验回流成直觉层（Part IV）——拍成一条从入站到产出的时间线。行尾的 `[→Part]` 是通往各部分的导航锚点。

```
外部输入 (channel.message)                                    [→Part III §5 Gateway 入站边界]
   │
   ▼  ① 封装为不可变事件  createSpineEvent (nn)  → id=evt_<uuid>, ts=ISO   [30662/30663]  [→§4]
   │
   ▼  ② 去重前置  computeDedupKey (hX) 算 key                  [75173]        [→§4]
   │      命中重复 → 取回既有事件 + 重放上次 gateway 回执 → deduplicated:true，不 append
   │
   ▼  ③ APPEND-BEFORE-EXECUTE：atomicAppendEvent (rn) 原子写 WAL 分区  [30701/75546]  [→Part III §4 铁律]
   │      var/events/YYYY-MM-DD.jsonl (UTC)，记 byte_offset/byte_len
   │      → 写 by_id 索引 →（仅当事件有 session_key）写 by_session 索引
   │
   ▼  ④ advanceConsumerWatermark (Oa) 推进 gateway 消费者 watermark  [31524]
   │      run/queue_offsets/gateway.json  (经 by_id 反查偏移)
   │
   ▼  ⑤ Ca() 更新 status.json                                  [31585]
   │
   ▼  ⑥ 按 routing_hint.target 入队                           [75558]        [→Part III §5 分流]
   │      gateway → 同步处理不入队
   │      meta    → 写 meta:subconscious mailbox 指针                        [→Part IV §6]
   │      session → 向 session_key mailbox append '- [ ] @evt(<id>)'   [75580]
   │
   ▼  ⑦ bus.emit('spine.event', r) → session.wake                [75591]     [→Part II §3 actor 唤醒]
   │
   ▼  ⑧ runner 读 mailbox 的 @evt 指针 → ml() 经 by_id seek WAL 取正文  [30733]
   │
   ▼  ⑨ 装配上下文（两个正交注入面）                                          [→Part I §1 认知装配]
   │      system-prompt 面：ZE() 6 层叠装（身份→通道→实例→广播板→Runtime Context→job）  [48234]
   │      user-message 面：Gde() 瞬态块（time/skip/gateway/interrupted/job-tick→user-input）  [60926]
   │
   ▼  ⑩ drain 合批 → createAgentSdkAdapter → SDK query()      [59612/48339]  [→Part I §2 Turn/Drain]
   │      （v0.6.1：单 turn 准入——一次只准入一个 turn，后到消息走 steering lane 显式注入
   │        当前 turn，不再折进正跑的 turn 里导致会话永久 busy；V_ @57391 / pendingSteer HXe @71491）
   │                                                          （后端 claude/codex 路由 [→Part II §8]）
   │
   ▼  ⑪ agent 产出 → append agent.tool_use / tool_result / result 回 WAL
   │      更新 session state.json：last_event_id / last_event_at / sdk_session_id   [60573]
   │
   ▼  ⑫ 经验沉淀：日志 → 潜意识 cadence tick(≈37min) → memory-weaver 三段流水线   [→Part IV §6§7]
          → 回写 memory/CLAUDE.md 广播板 → 下一次前台会话经 ZE 再注入
```

**闭环**：经验 → 事件日志 → 潜意识加工 → 广播板 → 系统提示 → 新的经验。这正是关键句 4（后台自治）与关键句 1（认知装配）合起来的闭环——后台把经验压成直觉层，前台每个新会话经 `ZE` 自动加载。


---

# 第一部分 · 前台交互：上下文装配 + 单一长驻会话的受控执行

> **关键句**：一次前台交互 = 可确定的上下文装配（§1）+ 单一长驻会话的受控执行（§2）。运行时决定拼什么、何时发一次 query、如何合并与 steering，模型只在这段上下文上推理。


---
## §1 认知装配

**认知装配的本质是一次正交切分：把 agent 上下文拆成"稳定认知"与"易变具身状态"两个注入面——稳定的（身份/人格/直觉广播板）由 `ZE` 一次装进 system-prompt 前缀以吃满 prompt caching，易变的（时间流逝/中断/job tick/带外动作）由 `Gde` 每 turn 瞬态塞进 user 消息；且 Claude 与 Codex 共用 `ZE` 这一套装配器（Codex 只多套一层 `<aladuo:system-context>` 壳），并非两套并行封装。**

这套切分之所以值得单独成节，是因为它同时优化了两个互相冲突的目标：既要让前缀足够稳定以命中 prompt cache，又要让 agent 感知到它本无的具身信号（时间、被打断、后台节拍）。运行时把这两类内容路由到两个物理位置，从根上避免了"易变状态污染缓存前缀"。下面四个论点自上而下展开：稳定面怎么装（论点一）、易变面怎么装（论点二）、两条后端为何同源（论点三）、以及不走 ZE 的两条旁路（论点四）。

| 注入面 | 频率 | 装载内容 | 载体 | 缓存友好性 |
|---|---|---|---|---|
| **System-prompt 面** | 每会话/每 turn 重算 | 身份、通道人格、实例特化、直觉广播板、运行上下文、job mission | `ZE` 输出的前缀 | 前缀稳定，利于 prompt caching |
| **User-message 面** | 每 turn 瞬态 | 流逝时间、被打断、job tick、smart-compact 提示、广播板更新、gateway 侧信道结果 | `Gde` 输出的 text blocks | 每 turn 变，不入前缀 |

---

### 论点一：稳定认知由 `ZE` 六层一次装进 system-prompt 前缀

**所以呢**：agent 的"我是谁 / 我这个通道该有什么人格 / 我此刻记住了哪些跨会话启发式"这类稳定信息，全部在一处（`ZE`）按固定层序拼成一个前缀。层序固定 + 内容稳定，才能让同一 agent 的连续 turn 反复命中同一缓存前缀。

**六层装配顺序**（confirmed）。`ZE(e,t,n,r)`（导出 `buildSystemPromptForChannelConfig`，`daemon.pretty.js:48234`）按固定顺序 `[i,s,o,u,a,c].filter(Boolean).join("\n\n")` 拼接，两处 `join` 分别在 `48255`（override 分支）与 `48258`（append 分支）：

| 层 | 变量 | 来源 | 位置 | 说明 |
|---|---|---|---|---|
| 1 身份 | `i` | `w_()` 读 `ALADUO_META_PROMPT_PATH` 或 `ALADUO_BOOTSTRAP_DIR/meta-prompt.md` | `48235`（`w_` 定义 `48217`） | 不变 identity；活体 meta-prompt.md=14126 bytes |
| 2 通道 | `s` | `e.kind_prompt` | `48236` | 通道级人格 |
| 3 实例 | `o` | `e.instance_prompt` | `48237` | 实例特化（覆盖类型级） |
| 4 广播板 | `u` | `r.content`（memoryBoard），仅当 `r && r.content.trim().length>0` | `48244` | 直觉层，见下 |
| 5 运行上下文 | `a` | `## Runtime Context`（仅注入 `session_key`/`channel_kind`），仅当 `t` 存在 | `48238` | 相对稳定，**不含时间戳** |
| 6 任务 | `c` | `Xoe(n)` 生成 `## Job Mission`，仅当有 jobContext | `48254`（`Xoe` 定义 `48228`） | stateless 变体额外强调"上文无历史，靠文件持久化"（`48229`） |

- 第 4 层的 `if(r && r.content.trim().length>0)`（`48244`）是布尔短路：`r` 为 undefined（无 memoryBoard）时不解引用、不抛错（confirmed）。
- `w_()`（`48217`）依次探 `ALADUO_META_PROMPT_PATH`、`ALADUO_BOOTSTRAP_DIR/meta-prompt.md`，取首个非空 trim（confirmed）。

**prompt_mode 分叉**（confirmed）。`48255`：`override` → 返回纯字符串 `||""`，整体替换 Claude Code 预设；默认 `append`（`48261`）→ 返回 `{type:"preset", preset:"claude_code", append:l}`，`l` 为空（`48260` `.trim()||void 0`）则返回 `undefined`（即无 append）。

**数据源**（confirmed）。调用链 `WU`（`59541`）在 `59572` 调 `ZE(_, t, {content,jobId,cron,stateless}, n.memoryBoard)`。**Claude 的 kind/instance/prompt_mode/time_gap 全部来自 `_`（effective_config，`59550` 经 `Hi("effective_config_ms", …Mz)` 取得并缓存），不是来自 `UXe`**（`UXe` 的用途见论点四）。此外 `ZE` 被调两次：批处理/admission 路径 `59572` 与 live streaming 路径 `60418`，同一装配复用于两种进场方式。

**广播板包装：OVERRIDE 前缀 + dossier 纪律**（confirmed）。第 4 层的 memoryBoard 整段被常量包装（`48246–48252`）：

```js
u = jWe.test(d)
  ? `${Hoe}\n\n${d}\n\n${DWe}`   // 含 [[slug]]
  : `${Hoe}\n\n${d}`;            // 不含
// jWe = /\[\[[^\]]+\]\]/                                   （48759）
// Hoe = "…IMPORTANT: These instructions OVERRIDE any default behavior…you MUST follow them exactly"  （48759）
// DWe = "The `[[slug]]` links…are dossier entry points, not footnotes…"  （48759）
```

即广播板整段以 OVERRIDE 前缀 `Hoe` 包装；含 wiki-link 时追加 dossier 纪律 `DWe`（"[[slug]] 是深档入口，触发时先读再行动"）。**注意：此 `Hoe` 包装对 Claude 与 Codex 同源同文**——因为 Codex 复用的正是 `ZE` 的整段输出（详见论点三）。

**广播板来源：`@include` transclusion**（confirmed）。`Pme(memoryBroadcastPath)`（`70978`）→ `$me`（`70993`）递归解析 `memory/CLAUDE.md`：用 `@path` 前缀语法（正则 `xme=/(?:^|\s)@((?:[^\s\\]|\\ )+)/g`，`71122`）提取 include，按深度上限 `wXe=5`（`70994` `if(n>=wXe)return[]`）递归内联，扩展名白名单 `SXe`（实测 106 个扩展名，`71122`）。每个被 transclude 的文件头是 `Contents of ${path} (project instructions, checked into the codebase):`（渲染器 `xXe:70986` + 后缀常量 `kXe:71122`），非裸冒号。

- **去环细节**（confirmed）：visited 集主检的是 `t.has(s)`（`70997`），其中 `s=Eme(i)` 是 resolve+win32 小写后的路径（`Eme` 定义 `71035`），**不是 realpath**；realpath 由 `TXe`（`71027`）另行求得后在 `71001` 以 `t.add(s), t.add(Eme(a))` 额外加入 visited 兜住软链别名。即"resolve 主检 + realpath 补检"。

**活体冷启动印证**（confirmed）。本机 `~/aladuo/memory/CLAUDE.md` 为 0 字节 → `$e.memoryBoard` 为空 → `72868` 不构造 memoryBoard（`$e.memoryBoard ? {path,content} : void 0`）→ `ZE` 不注入第 4 层。这印证机制本身：广播板初始为空，由潜意识逐步写入 durable heuristics 后才在下一次会话被注入——**渐进式冷启动，而非硬编码知识**。

---

### 论点二：易变具身状态由 `buildTransientUserBlocks (Gde)` 每 turn 瞬态塞进 user 消息

**所以呢**：时间流逝、被打断、job 节拍、带外动作结果这些"每 turn 都可能变"的信号，若进 system prompt 会不断击穿缓存前缀。运行时把它们做成带 tag 的 text block，前置到用户输入之前、进 **user 消息而非 system prompt**，既让 agent 感知具身状态，又不污染缓存前缀。

**块顺序**（confirmed）。`Gde(e,t,n)`（`60926`）返回 `blocks[]`，push 顺序逐条对上：

```
daemon-restart-hint        （60960；tag 60963）
  → smart-compact-notice    （60964；v0.6 新增：空闲自动 compact 后提示，tag 60967）
  → gateway-notice          （60968；包 <system-reminder>，尾附
                              "this context may or may not be relevant…
                               should not respond unless highly relevant" 60977）
  → time-context            （60983；<time-context last_interaction=… current_time=…>）
  → skip-rewind             （60989；仅 isUserMessage!==false 时）
  → interrupted-context     （60995）
  → job-tick                （61002；run_number/triggered_at）
  → board-updated           （61006；v0.6 新增：广播板刚被潜意识写过的提示）
  → user-input              （61010）
```

**slash 命令短路**（confirmed）。若用户输入 `e.trimStart().startsWith("/")`（`60942`），跳过全部注入只发 user-input 原文——命令式输入不该被时间/中断噪声污染。

**time-gap 阈值的读取位置**（confirmed）。time-gap 阈值来自 effective config 的 `time_gap_minutes`，但**不在 `Gde` 内读取**：`WU:59553` 先算 `g=(_?.time_gap_minutes ?? Wde)*60*1e3`（`Wde=60` 分钟，定义在 `61839`）构造出 timeGap 对象（`x` @59554）再传入 `Gde`，`Gde` 只消费 `t.timeGap`。

**`/effort` 是运行时旋钮、不属任一注入面**（confirmed，v0.6.0）。`/effort` 网关命令设置每会话推理力度，落到 run-config 的 `effort` 字段——`tc:48345` `"effort" in t && t.effort && (r.effort=t.effort)` 直接透传给 Claude SDK，经 drain 装配随 sdkRunConfig 下发（`60075`/`60439` `effort:X.effort`、`57650` `effort:w`）。它既不进 `ZE` 的 system-prompt 前缀、也不进 `Gde` 的瞬态 user 块——是与两个注入面正交的模型推理参数（类同 model 选择），故不影响缓存前缀。

---

### 论点三：Claude 与 Codex 共用 `ZE`，Codex 只多一层 `<aladuo:system-context>` 壳

**所以呢**：Codex 的系统提示就是 `ZE` 那一整串（含 identity/kind/instance/广播板/`Hoe`/runtime/job），二者差异只剩最外层那层壳。乍看代码里存在"两套并行封装器"（`Ale`/`Nle`），容易据此推出"双重 `Contents of` 头嵌套""Codex developerInstructions 携带时间戳"两种缓存破坏——但沿真实调用链核验，**这两处漂移在 v0.6.1 运行时都不发生**（那对封装器是不可达死代码，见下）。

**为何 `Ale`/`Nle` 的封装分支不可达**（confirmed，静态调用链）：
- `Ale`/`Nle` 全仓仅在 `57464/57465`（`V_.run` 内）被调用，用的是闭包 `t`（`V_(e,t)` 的第 2 参 = instructions）。
- 但两处 `V_` 构造都**只传一个 config 参、不传 instructions**：`72838` `y.codexAdapter=u({sandbox,ephemeral,model,dynamicTools})`（`u=V_`）、潜意识路径 `74219` 同样 `V_({sandbox,ephemeral,dynamicTools})`。故运行时 `t===undefined`。
- 于是 `Ale(t??{},f)` = `Ale({},f)`：`e.identity/kindPrompt/instancePrompt/memoryBoard` 全 undefined，`57362/57366/57370` 三个分支全不触发——`Contents of …(intuition layer…)` 措辞（`57370`）是**当前路径不可达的死代码**。`Nle({})`：`e.sessionKey/channelKind/runtimeDirectives` 全空 → `t.length===0` → 返回 undefined，`developerInstructions` 根本不产生，`- timestamp:`（`57382`）**不注入**。

**Codex 实际拿到什么**（confirmed）。`f=Cle(l.systemPrompt)`（`57463`；`Cle` 定义 `57356`）= 把 `ZE` 的 preset `{append}` 抽成字符串。`Cle`（`57356`）正是 `ZE`→Codex 的桥，让 Codex 复用 `ZE` 输出这条链闭合。所以 Codex 的 baseInstructions = `<aladuo:system-context>… ## Runner System Prompt\n\n{ZE 整段}…</aladuo:system-context>`（`## Runner System Prompt` 分支 `57372`，`<aladuo:system-context>` 壳 `57374`）。

| | Claude | Codex |
|---|---|---|
| 稳定认知来源 | `ZE` 输出 | **同一份 `ZE` 输出**（经 `Cle` 抽字符串） |
| system 载体 | `{type:"preset", preset:"claude_code", append}` | `baseInstructions`，内嵌 `## Runner System Prompt` + ZE 整段 |
| 外层壳 | 无（纯拼接） | `<aladuo:system-context>` |
| 广播板 / `Hoe` | 有 | **有（同源同文）** |
| 时间戳 | 仅在 user 面（`Gde` time-context） | **无**（`Nle` 返回 undefined，反而缓存友好） |

**结论**：Codex 的 identity/kind/instance/广播板/`Hoe`/runtime/job 与 Claude 完全同源同文，二者差异只剩最外层 `<aladuo:system-context>` 这层壳。且 Codex 系统提示没有时间戳、比 Claude 更缓存友好。

**适配器选择**（confirmed）。内层选择器 `X(y)`（`72284`）决定路径：codex→`y.codexAdapter`（走上述 `V_`），channel-claude→streaming 包装，其余→裸 `tc`。

**SDK 适配器兜底**（confirmed）。`tc`（`createAgentSdkAdapter`，`48339`）仅当 `t.systemPrompt===void 0`（`48348` else 分支）走兜底：`u=SYSTEM_PROMPT`（`48349`）、`c=APPEND_SYSTEM_PROMPT`（`48350`）、`p=[w_(), c].filter(...).join(...).trim()`（`48351`）；`u&&p`→拼接（`48354`）、`u`→整体替换（`48356`）、`p`→append preset（`48356–48360`）。即便未设 `APPEND_SYSTEM_PROMPT`，只要 `w_()` 非空 `p` 就非空并 append meta-prompt（`w_()` 返回 undefined 且未设 `APPEND_SYSTEM_PROMPT` 则 `p` 空、无 append）。permissionMode（`48346`）= `t.permissionMode ?? ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（v0.6.1 无条件兜底到 `bypassPermissions`，不再区分 host）。**注意这是降级分支**：正常 drain 里 `systemPrompt` 由 `ZE` 提供，此兜底不进，仅在"上游没给 systemPrompt"时生效。

---

### 论点四：不走 `ZE` 的两条旁路——潜意识分区注入与指纹漂移信号

**所以呢**：`ZE` 装配的是前台会话的稳定认知。系统还有两处独立于 `ZE` 的上下文机制：潜意识分区会话用另一套注入器（它没有前台对话历史，需要绝对路径 + 收件箱），以及 `UXe` 产出的 instructions 指纹（它不进任何提示词，只驱动 resumed session 失效）。厘清这两条旁路，才能解释"为何 `UXe` 要重算 identity/kind/instance 却不用于提示词"。

**潜意识分区注入**（confirmed）。partition（`meta:subconscious`）不走 `ZE`：
- `iet`（`74197`）：`## Runtime Context` + Timestamp + Sessions + `### Key Paths`（含 `memoryBroadcastPath` 等全绝对路径，`74200`）。
- `set`（`74204`）：`## Inbox` + "After processing each item, delete the corresponding file … to ack it."（`74208`）——每条 `.pending` 文件，处理后删文件 ack。
- 另有 **Session Mailbox 旁路** `wk`（`31375`）：`["# Session Mailbox","","## Inbox",""]`（`31376`）写盘供 agent 主动 Read，不进 system prompt——属"working notes"层。

**`UXe` 的真正用途：instructions 指纹 / 漂移失效**（confirmed）。`UXe`（`71448`）确实存在——它与 `runInstructionsFingerprintGuard (O2)` **同在 `72608` 调用，且 UXe 的输出被喂入 O2 指纹守卫**（而非"被 O2 调用"）。但它**不进任一路的实际提示词**（Claude 用 `w_()`+effective_config，Codex 用 `ZE` 输出）。它的实际用途有二：
1. 产出 `memoryBoard`（`71452` `transcludeBroadcastBoard (Pme)…rendered.trim()`）供 `ZE` 两路复用——经 `72868` 打包成 `{path, content}` 进 drain 配置的 `memoryBoard`；
2. 在 `72608` 喂给 `runInstructionsFingerprintGuard (O2)`（守卫定义在 `71313`）算 instructions 指纹做漂移检测——指纹 = `computeInstructionsFingerprint (GI)`（定义 `71259`）= `sha256(JSON.stringify([identity??"", kindPrompt??"", instancePrompt??"", memoryBoard??"", mission??""]))`（每元素带 `?? ""` 兜底）。

**board 层与指令层解耦**（confirmed，v0.6）。`O2` 除全量指纹外，另算 board 层哈希 `zme(n.memoryBoard)`（`71318`；`computeBoardLayerHash` 定义 `71264`）与非 board 指纹 `Fme(n)`（`71319`；`computeNonBoardInstructionsFingerprint` 定义 `71268`，把 `memoryBoard` 置 undefined 后复用 `GI`）。当且仅当 board 层变而非 board 指纹不变时判 `boardOnlyDrift`（`71320`）——此时 gate2 触发但 **不再拆会话，只 pin streaming 前缀**（`72618` `"board-only drift — pinning streaming prefix (no teardown)"`）；仅真正的非 board 指令漂移才在 `72624`（`gate2Fired && runtime==="claude"`）发 `session.streaming_invalidated`（reason `"instructions_drift"`，`72626`）。即"广播板刷新不再白白击穿正在跑的 streaming 前缀，只有身份/人格/mission 真变了才失效"。

即 `UXe` 的 identity/kindPrompt/instancePrompt 只进指纹、不进提示词——它是驱动 resumed session 失效的独立信号面。此外 `Nde`（`59536`）/ `autoloadAdditionalDirectoryClaudeMd`（`60087`/`60451`，env 旗标在 `tc:48380`）门控 memoryBoard 与 additionalDirectories 的 CLAUDE.md 自动加载，是广播板之外第二条"文件即上下文"注入。

---

> **给 Agent PM 的洞察**
> - **双注入面是本框架最可复用的单点设计**：稳定认知放 system prompt（每会话装一次、利于缓存前缀命中），易变运行时状态放 user 消息瞬态注入。既保护缓存前缀，又让 agent 感知"时间流逝""被中断"等它本无的具身信号。这正是本节领起结论的核心——两个注入面的正交切分。
> - **"共用装配器 + 薄外壳"胜过"两套并行封装"**：核验推翻了原以为的"Claude/Codex 各写一套装配器"。真相是两路共用 `ZE`，Codex 只多套一层 `<aladuo:system-context>` 壳（`Cle` 桥接）。多模型后端 agent 应把"装配面共用、执行面才分叉"作为纪律，避免各写一遍导致措辞漂移（本次核验中原以为的"双 `Contents of` 头""Codex 时间戳"两处漂移，实为不可达死代码，根本不发生）。装配同、执行异——执行/命令面的后端分叉见 §8。
> - **广播板 = 潜意识→意识的单一通道**：后台把跨会话 durable 启发式压成"一行一指针"的直觉层，前台每个新会话经 `ZE` 第 4 层自动加载。`[[slug]]` 指针 + `DWe` 纪律实现"默认不展开、触发才读 dossier"，控制上下文膨胀。全新安装板为空即无注入——渐进式冷启动。
> - **`override` vs `append` 是干净的能力边界开关**：默认 append 复用 Claude Code 内置提示（工具/安全/格式），override 让通道完全自定义人格。三层 prompt（identity/kind/instance）+ override = "共享内核 + 通道特化 + 实例特化"清晰叠加。
> - **指纹与提示词解耦**：`UXe` 重算 identity/kind/instance 却只喂指纹、不喂提示词，用漂移信号（`instructions_drift`）独立驱动 resumed session 失效——把"内容是否变了"的检测与"内容如何装配"彻底分离。v0.6 更把 board 层与指令层拆开（`boardOnlyDrift`），广播板刷新只 pin 前缀、不再拆会话，值得任何做 session resume 的运行时借鉴。
> - **gateway-notice 机制**：把模型上下文外执行的带外动作，作为 `<system-reminder>` 告知"已生效、勿重复"，解决了"带外副作用与模型认知不同步"的经典问题，任何有旁路控制面的 agent 都该借鉴。


---
## §2 Turn/Drain 循环与 SDK

Turn/Drain 把离散用户消息重写为"带合并窗口的邮箱批 + 单一长驻流式 SDK 会话"：一次 drain 只在可合并谓词允许的**前导窗口**上发一次 query，靠 **单 turn 准入门控、PostToolUse additionalContext 注入、三态抢占边界、hold-stdin** 四条控制线，在不重开对话的前提下实现 turn 合并、mid-turn steering、后台 subagent 续跑与优雅抢占。下面四个论点自上而下拆解这句话：先是"离散消息如何被循环切成批"，再是"一个批如何变成一次 SDK query"，然后是"长驻会话上四条控制线如何不重开对话地续接后到消息"，最后是"失败如何收敛"。

### 论点一：循环层是 `Se`，不是 `drainSessionMailbox (Vde)`——一次 drain 只吃"一个前导可合并窗口"

**所以呢**：理解"多条消息为什么被分多次 turn 消费"的关键，是把"循环"与"单批处理器"分层。`drainSessionMailbox (Vde)` 不是 drain 循环，它是每次迭代被调用一次的**单批处理器**；真正的循环是 `Se`（内部函数，无导出名）。`KU` 即 `batchDrainItems`（切合并窗口）。一次 `Vde` 只从 mailbox 顶部切出**一个**可合并窗口（单 batch），窗口边界外的事件留给 `Se` 的下一次迭代——所以"离散消息 → 若干 turn"是靠循环反复调用、而非一次合并成多批实现的。

- **drain 循环本体 = `Se`（`daemon:72488`），再抽循环 `for (; y.status !== "ended" && E;)`（`daemon:72579`）**。`ee.drainPromise` 在 `daemon:72485`/`72486` 被赋值为 `Se(ee)`（或 `preStart().then(()=>Se(ee))`）；状态字面量里的 `drainPromise: null`（`72438`）只是字段声明，不是"进入循环"。`Vde` 在循环体内每次迭代调用一次（调用点 `daemon:72857`）。
- **`Vde`（`daemon:59612`）单批骨架**：`mailbox_merge`（`vk`，`59712`）→ `mailbox_parse`（`Vg`，`59723`）→ `mailbox_render`（`wk`，`59744`）→ `KU(...)` 切窗口。选项键在 Vde 侧读作 `n.batchSize ?? Z5e`、`n.mergeWindowMs ?? W5e`（`59745`/`59746`，默认 `Z5e=5`、`W5e=180000ms`），传入 `KU` 时命名为 `fallbackBatchSize`/`mergeWindowMs`（`59749`-`59752`）。
- **`KU`（`daemon:61067`）只返回单一 batch**：顺序累积 items 到数组 `i`，遇 `i.length >= fallbackBatchSize`（notify 批则 `Infinity`）/ notify-homogeneity 变化 / `Math.abs(p - s) > mergeWindowMs` / 不同目标 就 `break`，剩余事件留给下一次 `Se` 迭代（`61078`-`61102`）。随后 Vde 把该单一 batch 解析成事件列表 `ee`，再用可合并门 `p8e(ee, t)`（`60029`）决定走向：合并成立 → **`WU` 一次（`60030`）+ `qde` 一次（`60064`）**发一次 query；否则逐事件 `for (let V of ee)` 各自 `qde`——"每个可合并批发一次 query"成立，但"一次 KU = 若干 batch"不成立。
- **真正的合并门是可合并谓词，比 mergeWindowMs 更决定性**：`p8e`/`m8e`/`Kde`/`VU`/`h8e`（`daemon:61118`-`61144`）——`p8e`：`e.length < 2` 不合并；全 `channel.message` 批走 `m8e`（要求无 `/` 斜杠命令）再 `Kde`，全 notify 批（`VU`）走 `Kde`；`Kde` 要求同一 `primaryTargetSessionKey`（`set.size===1`）。telemetry `sdk_start` 携带 `coalesced: ee.length>1`（`60058`）。

### 论点二：SDK 适配层把 duoduo run-config 诚实翻译成一次 `query()`

**所以呢**：一个 batch 变成一次 SDK 调用，中间隔着一层把内部 run-config 翻成 SDK options 的适配器 `createAgentSdkAdapter (tc)`。这一层的分支（systemPrompt / permissionMode / thinking）直接决定"发出去的 prompt 长什么样、缓存能不能吃满",错一个分支就打偏。

- **query 本体**：从 `@anthropic-ai/claude-agent-sdk` 导入（`daemon:48091`/`59497`）。两种执行通道：非流式 `run`（`48398`）与流式 `createStreamingQuery`（`48627`-`48632`，`includePartialMessages:!0`）。
- **`permissionMode` 优先级（v0.6 已改为无条件兜底）**：`t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`daemon:48346`）。v0.5.8 曾把兜底做成"仅 host 模式才 `bypassPermissions`（`Ho(process.env)==="host"`）、否则 `void 0`"；v0.6.1 去掉了 host 条件判定，**最终兜底无条件落到 `bypassPermissions`**。
- **`systemPrompt` 分支**：**仅当未设 `SYSTEM_PROMPT` 且存在 append 内容时**才用 `{type:"preset", preset:"claude_code", append:p}`（三元在 `48347`-`48359`，preset 字面量 `48357`）；一旦 `SYSTEM_PROMPT` 有值，用裸字符串（`u` 或 `u\n\np`），不走 preset。append 组装 `p = [resolveMetaPromptText(), c].filter().join`（`48349`），即 `resolveMetaPromptText() (w_)`（duoduo 基座提示，导出于 `48067`）拼 `APPEND_SYSTEM_PROMPT`。
- **工具集（v0.5.10 已由 denylist 改为 allowlist）**：`allowedTools`/`mcpServers`/`additionalDirectories` 透传；`tools` 取 `[...new Set(t.tools)]` 作为**显式内建工具面**（`48363`）。`disallowedTools` 经 `splitDisallowedToolsForClaude (Goe)`（`48096`）拆成 `{mcpTools, builtIns}`，**只保留 `mcpTools` 作为 disallowedTools，builtIns 被忽略并告警**（"allowlist-only via claude.tools"，`48374`）；`allowedTools` 里不在工具面上的项由 `Joe`（`48093`）挑出并告警。旧的 `DEFAULT_DISALLOWED_TOOLS` denylist 已退役。
- **thinking 开关**：`includePartialMessages` 触发时只置 `r.includePartialMessages=!0`（`daemon:48382`）；v0.5.8 里"强制 `maxThinkingTokens=0`"的分支已移除——适配器不再改写 thinking 预算（`maxThinkingTokens` 在 daemon 内仅剩错误提示串里出现，见论点四）。
- **适配器选择 `X(y)`（`daemon:72284`）**：codex + codexAdapter → codexAdapter；`origin!=="channel"` 或无 `createStreamingQuery` → 一次性适配器 `o`；否则惰性长驻 `streamingAdapter`（经 `Oe(y,T)` 创建）。

### 论点三：长驻流式会话上，单 turn 准入 + steering lane 不重开对话地续接后到消息

**所以呢**：这是本节最独特处。同一 session 复用同一个长驻 `query()` 进程，输入由队列驱动的 async generator 逐块喂入；于是"合并、steer、抢占、后台续跑"全部被实现为对这条长驻输入流的操控，而非新开对话。**v0.6.1 的关键变化：流式槽一次只准入一个对话 turn，后到消息不再折进正在跑的 turn，而是走显式 steering lane（`pendingSteer`）**——这修掉了旧版"后到消息折进 accepted turn 导致会话可能永久 busy"的隐患。四条控制线各管一件事：

**(a) sessionId 粘连 + 配置指纹重建——复用的边界。** 复用现有 `streamingState` 的条件（`Oe` 内，`daemon:71723`）：`streamingState && !closed && !needsRecreation && configSignature===j && (hasAcceptedTurn || initialSessionId===N)`。指纹经 `Q(y)`（`71654`）= `JSON.stringify({cwd, settingSources, persistSession, permissionMode, allowedTools, disallowedTools, tools, additionalDirectories, autoloadAdditionalDirectoryClaudeMd})`（v0.6.1 新增 `tools` 键，随 allowlist 化）。**配置指纹变化就重建**：复用失败 → `await W(y)`（`71671`）关旧 query + abort + await loopPromise → 重新 `createStreamingQuery`。输入生成器 `xi()`（`71758`）由队列类 `WI`（`71135`，`items/waiters/enqueue/dequeue/drain`）驱动；turn 项在 `72293` 入列（含 `accepted/streamedText/turnStreamedText/toolUseMap/toolBlockIndexMap/skipCalled/interruptRequested`）。

**(b) 单 turn 准入门控——一次只喂一个 turn，后到者走 steering。** 生成器 `xi()` 每次 `dequeue` 出一个 turn 项前先看 `Ne.currentTurn`：**若槽已被占（`currentTurn !== null && currentTurn !== ue`），新 turn 直接 `reject`（`daemon:71772`，"Streaming slot occupied — prompt not yielded"）**，不再像 v0.5.8 那样把新入列 prompt 灌进正在跑的 turn。占槽成功才 `currentTurn = ue`、`accepted = !1`，随后 `for await (let me of ue.input.prompt) yield me`（`71778`）。turn 的 `accepted` 在其 SDK `init` 事件到达时置真（`daemon:72118`：`hasAcceptedTurn=!0, B.accepted=!0`）——**accepted 只标记"该 turn 的 prompt 已被 SDK 接纳"，不再作为"是否折入新 prompt"的开关**。所以合并已发生的 turn、以及未及入槽的后到消息，都改由 (c) 的 steering 通道处理，`streamingState` 里旧的 `orphanExecuting` 也换成了 `cliTurnTentative`（+ `loopPromise`）。

**(c) mid-turn steering——park 在 admission callback，消费在 PostToolUse hook。** 入队/park 的**决策发生在 admission callback（`daemon:72649`）**，它是与 `Vde` 并行的第二条 SDK 入口：在已有 live streaming turn 时被调用，自己调 `WU`（`72686`）生成 `coalescedPromptText`，再按 runtime 分叉——claude 走"park/append `pendingSteer`"。park 判据 `!!ko && ko.accepted && !ht && !Sr.isNotifyOnly && Tn.length>0`（`72763`，`ko = Dn.currentTurn`）：已有 `pendingSteer` 且 `spawningTurn===ko` 则追加（`72768`，打印 "appended claude steer"），否则新 park（打印 "parked claude steer"，`72821`），`pendingSteer` 字段在 `72778`（`steerText/eventIds/claimedEventIds/enqueueAsNewTurn/spawningTurn/requeueLines/requeueEventIds/processedEventIds/settled`，v0.6.1 新增 `spawningTurn`）。**注入（消费）发生在 PostToolUse hook（matcher `"*"`，`71815`-`71845`）**：检查 `pendingSteer` → `settled` + `markDone` → 以 `hookSpecificOutput.additionalContext = ue.join("\n\n")`（`71835`-`71840`）返回给 SDK。**v0.5.8 里独立的 `pendingNotifySteer`（把后台 Agent 完成回调冒泡进当前 turn）已在 v0.6.1 移除**：后台 Agent 完成改由 Claude CLI 原生续写单独负责（completion-owner `"claude-cli"`），duoduo 只把 `task_notification` 记成 WAL-only 生命周期事件，不再制造重复回调 turn。

**(d) 三态抢占边界——`G()` 置标志、`L(y)` 才扳机。** `pendingPreemptBoundary` 为三态 `"accept" | "tool_use" | "tool_result"` + hard/soft 两档强度。设值函数 `G(y,T,j)`（`daemon:71636`）：query 在时——tool_result 且有活跃工具则置 `tool_result`（`71641`）、未 accept 则置 `accept`/`defer_accept`（`71643`）、否则立即 `C(y)`；非流式路径另有 tool_use 与 `soft` 软抢占分支（`71645`）。**但 `G()` 只置 pending 标志；真正的 abort 由执行事件闭包 `L(y)`（`daemon:71631`：query 在则 `C(y)` interrupt、否则 `abortController.abort()`）消费**——`onExecutionEvent` 里 tool_use 到达时 `activeToolUseIds.add` + 若 `boundary==="tool_use"` 则清标志并 `L(y)`；tool_result 时 `delete` + 若 `boundary==="tool_result" && size===0` 则 `L(y)`（`72691`/`72940`）；accept 边界则在 `init` 处由 `C(y)` 兑现（`72128`）。二者分离正是"deferred preempt 何时兑现"的答案。Codex 路径改走 `turn/steer` RPC（`57859`），失败回退（`57869` "falling back to new turn"，`72739` "codex turn/steer landed"，`72746` "codex steer fell back to redrain"）。

**(e) hold-stdin——后台 subagent 续跑。** drain 传 `holdInputOpenForBackgroundAgents = runtime==="claude" && origin!=="channel"`（`daemon:72863`，Vde 侧 `60085` 透传）。非流式 `run` 中 `E = holdInput...`（`48472`），prompt 换成生成器 `Oe()`（`48499`：`for await ... yield A; await C`）：yield 完 prompt 后 `await C` 让 stdin 不关，后台 subagent 完成回调（in-process MCP）仍可送达。`C` 的 resolve 走 `Q()`（`48486`：`$ && R.size===0 && P()`）——**需同时满足 `$`（已收到 result，`277` 行置 `$=!0`）与 `R.size===0`**（`R` 增删来自 SDK system 事件 `task_started`/`task_notification`），非仅"后台 task 跑完"。idle 看门狗 `L = Az(ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5)`（默认 10min，`48480`），触发打印 "hold-input idle watchdog fired"（`48493`）；另有 abort-close 看门狗 `g = Az(ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4)`（`48469`）。

> Skip 语义横跨该长驻会话：非流式 `run` 的 `h_`（`mcp__aladuo__Skip`）PreToolUse hook 置 `d=!0`（`48413`），流式路径 `h_` matcher 置 `Ne.currentTurn.skipCalled=!0`（`71811`），drain 侧 codex 补 `ut.skipped=!0`（`60158`），`if (ut.skipped) L=!0` 抑制 outbox（`60181`/`60500`）。

### 论点四：失败面收敛成一条用户可见文本 + 一个 spine 事件

**所以呢**：SDK turn 抛错不会静默丢失或裸露堆栈，而是被产品化成统一格式，既能回给用户又能进事件日志（可被后续 drain 与 usage 复算）。v0.6.0 起 **drain 错误即时上浮**——`handleDrainError` 在 catch 处直接 `throw`，不再滞留到下一 tick。

- **drain-error（`daemon:60145`-`60148` 抛出、`61467` 处理）**：Vde 的 try/catch 中取消类错误 `isAgentSdkTurnInterruptedError (__)`（`60093`）/`isAgentSdkPromptNotAcceptedAbortError (b_)`（`60112`）/`ZU`（`60127`）走 cancelled 收尾；其余 `throw await gm(..., {stage:"sdk_turn"})`（`60145`/`60148`，逐事件路径另有 `60469`/`60472`）。`gm`（`61467`）生成用户文本 `` `[duoduo:drain-error] agent turn failed at ${n.stage}` ``（`61470`，后接 `T8e(r, n.hintContext)` 诊断），并向 spine 追加 `type:"agent.error"`（`61500`-`61501`）。
- **执行事件桥接**：包装器 `xi`（`daemon:60004`）统计 tool_use/tool_result 计数、捕获 `compact_boundary`，喂 drain record 的 `tool_calls`/`tool_errors` 与 `session.compact`，也是 spine `agent.*` 事件的上游。**活体印证**：`spine.tail` 可见 `agent.tool_use`/`agent.tool_result` 从 SDK 适配器路径流出，印证 `WU/qde` → onExecutionEvent → session.execution/spine 的桥接。
- **开关**：`DISABLE_ADAPTIVE`/`DISABLE_THINKING`/`DISABLE_INTERLEAVED_THINKING`/`MAX_THINKING_TOKENS` 现只出现在诊断提示串 `T8e`（`61449`-`61465`，含"第三方 endpoint 关 thinking"与"这些旋钮是 Claude-only"两段话术）；daemon 内无读取这些 env 的分支，故 duoduo 自身不消费——但底层 claude 二进制是否透传消费属**未证实推测**。

### 证据表

| 机制主张 | 证据（字面量/代码片段） | 位置 | 置信 |
|---|---|---|---|
| drain 循环本体是 `Se`，`Vde` 是循环体内单批处理器 | `ee.drainPromise = Se(ee)`；`for (; y.status !== "ended" && E;)`；`Vde(...)` 调用点 | daemon:72486 / 72579 / 72857 | confirmed |
| 一次 `Vde` 经 `KU` 只切出一个前导可合并窗口（单 batch），余留给下次迭代 | `KU` 顺序累积，遇 batchSize/notify 变化/mergeWindowMs/不同目标 `break`，`return {items:i, events:r}` | daemon:59612 / 61067-61102 | confirmed |
| 合并谓词（同目标、无斜杠命令、notify-homogeneous）是合并的真正边界 | `p8e`（`length<2` 拒）/`m8e`（`startsWith("/")` 拒）/`Kde`（`size===1`）/`VU`/`h8e`；门 `p8e(ee,t)` | daemon:61118-61144 / 60029 | confirmed |
| SDK 调用即 `@anthropic-ai/claude-agent-sdk` 的 `query` | 从 `@anthropic-ai/claude-agent-sdk` 导入 | daemon:48091 | confirmed |
| permissionMode 优先级，v0.6 无条件兜底 bypass | `t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（host 条件已移除） | daemon:48346 | confirmed |
| systemPrompt 仅当未设 SYSTEM_PROMPT 且有 append 才用 preset；否则裸字符串 | `if (t.systemPrompt!==void 0)...else{}`；`{type:"preset",preset:"claude_code",append:p}`；`p=[resolveMetaPromptText(),c].filter().join` | daemon:48347 / 48349 / 48357 | confirmed |
| 工具面已 denylist→allowlist：`tools` 显式面 + `splitDisallowedToolsForClaude` 只留 mcpTools | `tools=[...new Set(t.tools)]`；`{mcpTools,builtIns}=Goe(...)`；builtIns 忽略并告警 | daemon:48363 / 48096 / 48374 | confirmed |
| includePartialMessages 只置流式旗标，不再改 thinking 预算 | `n?.includePartialMessages && (r.includePartialMessages=!0)`（无 `maxThinkingTokens=0`） | daemon:48382 | confirmed |
| 适配器选择 `X(y)` | codex→codexAdapter；非 channel/无 streaming→一次性 `o`；否则长驻 streamingAdapter（`Oe`） | daemon:72284 | confirmed |
| streamingAdapter sessionId 粘连复用条件 + 指纹重建 | `streamingState && !closed && !needsRecreation && configSignature===j && (hasAcceptedTurn||initialSessionId===N)`；`Q(y)` 指纹含 `tools`；重建走 `W(y)` | daemon:71723 / 71654 / 71671 | confirmed |
| 长驻流式输入靠队列驱动 generator | `async function* xi(){ ... for await (let me of ue.input.prompt) yield me }`；队列类 `WI`；turn 入列 | daemon:71758 / 71135 / 72293 | confirmed |
| **单 turn 准入**：槽已占则 reject 后到 turn，不折进正在跑的 turn；accepted 只标记 SDK 接纳 | `if (ye!==null && ye!==ue) ue.reject(new Ui("Streaming slot occupied ..."))`；`init` 处 `hasAcceptedTurn=!0, B.accepted=!0` | daemon:71772 / 72118 | confirmed |
| steering 决策在 admission callback（park），消费在 PostToolUse hook（注入） | `WU` 生成 coalescedPromptText；park 判据 `!!ko&&ko.accepted&&!ht&&!Sr.isNotifyOnly&&Tn.length>0`；"parked claude steer"；`additionalContext=ue.join("\n\n")` | daemon:72686 / 72763 / 72821 / 71835-71840 | confirmed |
| notify-steer 路径已移除，后台 Agent 完成单一 owner | 无 `pendingNotifySteer`；`completion_owner:"claude-cli"`；`task_notification` recorded WAL-only | daemon:71701 / 71704 | confirmed |
| 抢占三态 accept/tool_use/tool_result + hard/soft；`G()` 置标志、`L(y)` 扳机 abort | `G(y,T,j)` 三分支；`"defer_accept"`/`"defer_tool_use"`/`"defer_tool_result"`；`L(y)` 消费 `activeToolUseIds.add/delete` | daemon:71636-71645 / 72691 | confirmed |
| Codex 走 turn/steer RPC，失败回退 redrain | `r.request("turn/steer",...)`；"falling back to new turn"；"codex steer fell back to redrain" | daemon:57859 / 57869 / 72746 | confirmed |
| hold-stdin：`await C`，resolve 需 `$ && R.size===0`，含 idle 看门狗 | `holdInputOpenForBackgroundAgents`；`Oe(){...yield A; await C}`；`Q()=$ && R.size===0 && P()`；`L=Az(...,6e5)`；"hold-input idle watchdog fired" | daemon:72863 / 48499 / 48486 / 48480 / 48493 | confirmed |
| Skip 联动跳过 SDK 结果并抑制 outbox | `Ne.currentTurn.skipCalled=!0`；drain 侧 `ut.skipped=!0`；`if(ut.skipped) L=!0` | daemon:71811 / 60158 / 60181 | confirmed |
| drain-error 冒泡为文本回复 + spine 事件（v0.6.0 即时上浮） | `[duoduo:drain-error] agent turn failed at ${n.stage}`；`type:"agent.error"`；throw at `stage:"sdk_turn"` | daemon:61470 / 61500 / 60148 | confirmed |
| 执行事件包装器 `xi` 统计工具计数 + compact_boundary，喂 drain record/spine | tool_use/tool_result 计数、`compact_boundary` 捕获 | daemon:60004 | confirmed |
| drain record 结构与 `usage.get` 聚合字段一致 | `total_drains/total_tool_calls/.../perf{...sdk_ttft_ms}`（例 memory-committer `total_drains=2`） | daemon:59651 + 活体 usage.get | confirmed（静态+活体） |
| DISABLE_*/MAX_THINKING_TOKENS 仅存在于错误提示，非 duoduo 消费 | 全在 `T8e` 提示串（含"Claude-only"话术）；daemon 无读取分支 | daemon:61465 | 未证实推测（透传消费未直接证实） |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **session actor 状态**（`daemon:72426`）：`status, currentAbortController, query, streamAbortController, drainPromise, wakeResolver, pendingWake, isStreaming, activeToolUseIds(Set), pendingPreempt, pendingPreemptBoundary, pendingClear, inflightEventIds(Set), admissionInProgress, pendingSteer, admissionCallback, streamingState, streamingAdapter, streamingGeneration, notifyCalledDuringDrain, runtime, codexAdapter, consecutiveConservativeRedrive`（另有 `idleSince/spawnedAt/lastActivityAt/lastTurnCompletedAt/lastCliTurnSettledAt` 等）。v0.6.1 相较 v0.5.8 已无独立 `pendingNotifySteer` 字段。
- **streamingState**（`71744`）：`queue, abortController, configSignature, initialSessionId, hasAcceptedTurn, needsRecreation, closed, currentTurn, loopPromise, cliTurnTentative`（v0.5.8 的 `orphanExecuting` 换成 `cliTurnTentative` + 新增 `loopPromise`）。
- **turn/queue 项**（`72293`）：`input, resolve, reject, accepted, sessionId, text, structured, usage, streamedText, turnStreamedText, toolUseMap, toolBlockIndexMap, skipCalled, interruptRequested`。
- **pendingSteer**（`72778`）：`steerText, eventIds, claimedEventIds, enqueueAsNewTurn, spawningTurn, requeueLines, requeueEventIds, processedEventIds, settled`。
- **drain record**（追加到 drainRecordPath，`59651`；活体经 `usage.get` 按 session 聚合印证）：`id, session_key, sdk_session_id, drain_started_at, drain_duration_ms, sdk_duration_ms, events_processed, events_skipped, tool_calls, tool_errors, output_chars, cancelled, usage{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens,total_cost_usd,protocol,model,context_used_tokens}, perf{mailbox_merge_ms,...,sdk_ttft_ms_total,sdk_ttft_samples}, compact, suspected_in_process_break`。
- **SDK options**（`createAgentSdkAdapter` 内层构建器 `e(t,n)`，`48343` 起）：`resume, abortController, cwd, settingSources, persistSession, outputFormat, model, effort, permissionMode, systemPrompt, allowedTools, tools, disallowedTools, mcpServers, additionalDirectories, env, pathToClaudeCodeExecutable, hooks, includePartialMessages`。
- **内建 hooks**：流式 `Oe`（`71781`）挂 PreToolUse matcher `"*"`（记 `transcript_path`）+ matcher `h_`（检测 Skip，置 `currentTurn.skipCalled`，`71811`）；PostToolUse matcher `"*"` 做 steer 注入（`71815`-`71845`）。（v0.5.8 里"PreToolUse matcher `Bash` 拦截 `run_in_background`"的 hook 在 v0.6.1 已不存在。）

### 给 Agent PM 的洞察

> 1. **"turn ≠ 消息"是这套设计的中心一步，且分层要看清。** 循环层 `Se` 反复调用单批处理器 `Vde`，每次只吃一个"可合并谓词允许的前导窗口"（同目标、无斜杠命令、mergeWindow 内）。这天然做了输入去抖/合并、降低 query 次数与 cache miss，代价是单条消息延迟受窗口影响。PM 要把"消息""batch""turn"三层解耦：一次 drain 迭代 = 一个 batch = 一次（可合并批）query，多条消息可能跨多次迭代分成多个 turn。
>
> 2. **v0.6.1 改成"单 turn 准入 + steering lane"——后到消息不再折进正在跑的 turn。** 流式槽一次只准入一个对话 turn（`71772` 槽占则 reject），后到消息由 admission callback 决策、park 成 `pendingSteer`，再由 SDK 的 PostToolUse `additionalContext`（`71835`）在工具边界注入正在跑的 turn。这既保住工具执行原子性又实现"边跑边追加",还消除了旧版"折入 accepted turn 致会话永久 busy"的隐患。这是把 agent-sdk 的 hook 能力当控制面用的巧思，可直接借鉴。
>
> 3. **长驻 streamingQuery + configSignature 粘连是延迟/成本优化的核心，但抢占是"置标志/扳机"两段式。** 同会话同配置复用一个 query 进程避免冷启动与重放；指纹（cwd/permissionMode/allowedTools/**tools** 等）一变就 `W(y)` 强制重建。抢占用 `G()` 置三态边界标志、执行事件闭包 `L(y)` 在对应工具边界才真正 abort——deferred preempt 的兑现时机取决于 `activeToolUseIds` 何时清空。PM 应尽量稳定单会话工具集/权限。
>
> 4. **背景 subagent 靠"hold stdin + `$ && R.size===0` 双条件 + idle 看门狗"续跑，且完成语义已收敛为单一 owner。** stdin 保活的释放需**同时**满足"已收到 result"与"追踪的后台 task 全部完成"，非仅后者；超过默认 10 分钟静默会 force-release，牺牲 in-process MCP 回调。v0.6.1 把"后台 Agent 完成说进对话"的权限收敛给 Claude CLI 原生续写（completion-owner），duoduo 只记 WAL 生命周期事件、不再制造重复回调 turn——长任务应走独立 job 而非 background Agent。
>
> 5. **失败面产品化收敛，且 v0.6.0 起即时上浮。** drain-error 统一为 `[duoduo:drain-error]` 文本 + `agent.error` spine 事件（可被 usage/后续 drain 复算），并内置"关 thinking"诊断话术；错误在 catch 处直接 `throw`，不再滞留到下一 tick。注意 `DISABLE_*`/`MAX_THINKING_TOKENS` 在 daemon 内仅出现在 `T8e` 错误提示串（且被标注为 Claude-only），是否真正透传消费属未证实推测——对多模型/第三方 endpoint，thinking 线协议不兼容是头号坑，值得产品层预置开关与提示。


---


---

# 第二部分 · 会话编排：有状态对象的隔离、调度与后端路由

> **关键句**：会话是被编排与路由的有状态对象。运行时用一 key 一 actor + 两层锁 + 双有界可让出池把一外部身份扩成多内部会话（§3），并在 claude/codex 两值枚举上把每个会话诚实路由到对应后端（§8）——先讲被谁持有/调度，再讲被谁执行。


---
## §3 Session Actor / 生命周期 / 并发

**Session 是一个有状态 actor 运行时：session_key 前缀纯函数派生平面与权限、一 key 一 actor 的内存 Map 编排、两层锁（跨重启 pid/boot_id 进程写锁 + 按 key 串行的 `hi` 异步互斥）、双有界可让出池（channel 10 / job 6，idle 主动让槽而 `attachedChannels` 钉活），在单 daemon 单进程内把"一外部身份 → 多内部会话"做成了低延迟前台、可抢占续写、又能回收资源的运行时。** 下面四条论点自上而下拆解这句结论：命名如何即编排、两层锁如何分工、池与生命周期如何让出与回收、唤醒/抢占/隔离如何在不损坏状态的前提下续写。

---

### 论点 1 · 命名即编排：前缀纯函数派生一切，一 key 一 actor 内存编排

**所以呢**：duoduo 不需要独立的会话注册表 / 权限表——`session_key` 这个字符串**本身**就编码了平面、kind、权限与后端归属，路由与隔离全部从前缀纯函数派生；而每个 key 在内存里对应至多一个 actor，编排就是一张 `Map`。这把"一外部身份 → 多内部会话"降维成"命名空间 + 纯函数 + Map"，无外部状态。

- **key 格式与派生**：`session_key = <scope>:<name>:<hash(workspaceAbsPath)>`，由 `dte`（`stdio.pretty.js:46109`）拼装：`` `${t}:${n}:${ute(a)}` ``，其中 `a=Af(e.workspaceAbsPath)`（`46112`）、`ute` 为 hash（`46096`，`sha256(...).slice(0,12)`）、`n=SU(e.readableName)` 归一化名段，`TU` 注入 `scope:"stdio"`（`46116`）。活体 `system.status` 返回 `stdio:default:28d3ca682f86` 逐段印证。**confirmed**。
- **前缀 → plane / kind**：kind 由 `Os(e)`（`daemon.pretty.js:48917`）前缀分类（`meta:/cadence:→meta`、`subconscious:→subconscious`、`system:→system`、`job:→job`，否则 `channel`）；plane 由 `B5e(e)`（`61594`：`system:/meta:/cadence:→system`，否则 `work`）。**confirmed**。
- **一 key 一 actor**：注册表 `let g = new Map`（`71582`），`Nt(y,T)`（`72422`）负责生成 actor，`actorRunId: M=++R` 单调自增（`72425`），`g.set(y,ee)`（`72465`）。活体 `system.status` 只有单一 actor（status=`idle`），印证"至多一个"。**confirmed**。
- **kind 的第二真值来源**：`Nt` 内 `jk(t, {...})` 把 `display_name/kind` upsert 进 meta.md（`72469`），此处 `kind` 从 **origin** 二次派生（`origin==="job"?"job":origin==="system"?"system":startsWith("meta:")?"meta":"channel"`，`72472`）——与 `Os` 的前缀派生**并存**，是 kind 的另一条真值来源。**confirmed**。

---

### 论点 2 · 两层锁分工：进程写锁保运维健壮性，`hi` 异步互斥保数据一致性

**所以呢**："lease lock"在代码里其实是**两把互不相干的锁**，各解决一个问题，绝不能混谈：一把跨重启防"同目录多 daemon 写者"（运维），一把按 key 串行防"同会话并发写状态"（数据）。

- **进程级 runtime 写锁**——保证同一 runtime_dir 只有一个 daemon 写者。锁文件 `run/locks/daemon-writer.json`（路径由 `eU`，`76996`），记 `{runtime_dir, pid, boot_id, started_at, last_heartbeat_at}`。`start()` 内 `b=await Pce(n); if(!b.acquired) throw \`Runtime lock already held by pid=${...}\``（`78706-78707`）；心跳 `setInterval(()=>Uie…$ce(n),v)`、`v=yhe("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS",3e4,1e3)`（`78717-78719`）。夺锁前 `HWe`→`A9e`（`77031`）判 stale，逐字符为：
  ```
  Number.isNaN(r) || t.getTime()-r > n || (e.boot_id && e.boot_id !== Ice()) || !O9e(e.pid)
  ```
  （`77033`）即心跳超 TTL（`ttlMs??12e4`=120s，`Pce` 内 `77046`）、**`boot_id` 存在且不符**（重启；`e.boot_id &&` 是空值守卫，boot_id 缺失时不据此判 stale）、或 `O9e`=`process.kill(pid,0)`（`77000`）探测进程已死，则视为可抢占。`boot_id` 取 `/proc/sys/kernel/random/boot_id` + macOS `sysctl kern.boottime` + uptime 兜底（`BWe`→`C9e`，`77010`；当前值 getter `Ice`，`77027`）。活体 `system.config`：`heartbeat_ms=30000`、`runtime_lock_heartbeat_ms=30000`。**confirmed**。
- **会话级异步互斥 `hi(session_key, fn)`**（`31090`）——`gk: Map<key, 尾Promise>`，把该 key 的所有状态变更闭包串成链：`i=gk.get(e)??Promise.resolve()` → `gk.set(e,r)` → `await i` → finally `n(); gk.get(e)===r&&gk.delete(e)`（逐字符匹配）。state.json/meta 写、mailbox merge、outbox cursor 全按 key 串行。调用点已全验：`31220`（`Au(t),hi(t,…)`——`_c`+锁串接）、`33676/33709/33759/33795/33831`（state/mailbox 写）、`49149/49168`（compact 门）、`76716`（`V1`→`Zz` delivery-cursor，`[delivery-cursor] skip cursor write: session archived`）。配合"一 key 一 actor"形成双保险。**confirmed**。

---

### 论点 3 · 池与生命周期：双有界可让出池 + active/idle/ended，让槽回收而前台钉活

**所以呢**：并发用"双有界池 + 可让出的池槽"而非固定线程——channel/job 分池，后台批处理饿不死前台；执行槽（占用 vs 让出）与会话存活（actor 是否回收）被**解耦**：idle 主动让槽却仍可被前台附着钉住不死，容量因而在会话间自由流动。

- **双有界池 channel=10 / job=6**：池对象 `h`(channel)@`71513`、`_`(job)@`71519`，各持 `{name, activeCount, maxConcurrent, wakeQueue}`；`f=e.maxConcurrentChannel??e.maxConcurrent??10`、`m=e.maxConcurrentJob??6`（`71511-71512`）；`b(y,T)` 按 origin 选池（`71526`）。actor 创建时抢槽 `ke=b(y,ee.origin); ke.activeCount++, ee.holdsPoolSlot=!0`（`72466-72467`）；超限入队 `ee.wakeQueue.push(y)`（`Ue` 内 `72403`）。活体 `system.config`：`max_concurrent_channel=10, max_concurrent_job=6`（`77264-77265`）。**confirmed**。
- **三态 active → idle → ended**：idle 分支 `73042`、`y.status="ended"`（`73133/73135`）均已亲见。**confirmed**。
- **idle 让槽 + `Ht`→`st`(idle_ms) 等待 + 前台钉活**：drain 空转后 `released pool slot (idle)`（`_e.activeCount--, y.holdsPoolSlot=!1`，`73048`），进 `st(y,i)`（`73167`）等待——`y.wakeResolver=()=>{M(),j(!0)}` 与 `setTimeout(()=>{M(),j(!1)},T)` **竞争**（`73173-73177`，`M()` 为共用清理）。超时且无附着→`idle timeout, no attachments, exiting`（`73075`）退 ended；**有附着则继续等**→`idle timeout but has attachments, continuing wait`（`73065`），前台通道把 actor 钉住不回收；被唤醒→重抢槽（pool-full→`wakeQueue.unshift`，否则 `activeCount++`，`73085-73099`）。`idle_ms` 源：`idleTimeoutMs:i=36e5`（`71496`）、config `ALADUO_SESSION_IDLE_MS`（`77266`）、注入 `78783`。活体 `idle_ms=3600000`，stdio 会话正处 idle。**confirmed**。
- **dequeue 原地复用 `w()`**：出队唤醒时若目标是"idle 且无池槽且有 drainPromise"的 actor，走 `pendingWake+wakeResolver` **原地唤醒**而非新建 `Nt()`，随后 `return`；池重满则 `unshift` 回队首（`dequeue deferred: pool re-filled`，`71564`）；否则回落 `Nt(I, $2(I)??…)`。`function w(y)` 定义在 **`71534`**、原地复用体（`resuming idle actor from dequeue`）在 **`71554-71561`**。**confirmed**。
- **重启 actor 的 origin 从何而来（"重抢槽"闭环的落池决策）**：`w()` 与 `Ue()` 回落新建时 `Nt(I, $2(I))`——`c2(y)`→`$2(y)`（定义 `71247`，调用 `71578`（w）/`72413`（Ue））负责推断被出队/唤醒 actor 应落 channel 还是 job 池，是"重抢槽"闭环里决定池归属的关键。**confirmed（机制），origin 推断细节为静态阅读**。
- **续写决策的指纹守卫解耦 board 层**（v0.6.1 新增）：指令指纹 `GI`（`computeInstructionsFingerprint`，`71259`）覆盖 `[identity,kindPrompt,instancePrompt,memoryBoard,mission]`；新增 `Fme`（`computeNonBoardInstructionsFingerprint`，`71268`）= `GI({...e, memoryBoard: void 0})`，**排除 board 层**——board 内容变动不再触发指令指纹判定"指令已变"，把易变的广播 board 与稳定的指令层解耦（board 层单独由 `zme`/`computeBoardLayerHash`@`71264` 哈希）。**confirmed**。

---

### 论点 4 · 唤醒 / 抢占 / 隔离：单 turn 准入 + 显式 steering 通道，硬前缀隔离，收尾再校验

**所以呢**：有状态 agent 的"打断 / 续写"不是硬 kill，也不再把后到消息折进正在跑的 turn 里——v0.6.1 改成**一次只准入一个对话 turn**（single-turn admission），后到的输入走一条**显式 steering 通道**（`pendingSteer` 会话状态）：能就地插话就 mid-turn 注入，不能就 park/requeue 回 inbox 由下一个 turn 处理；要真打断也只在工具调用边界。同时用前缀白名单挡住越权唤醒，用一次性布尔上限防收尾自旋。这几点合起来保证"续写不损坏状态、后到不导致会话永久 busy、隔离不被绕过、结束不空转"。

- **唤醒与抢占 `Ne`→`Ue`/`D`→`G`**：`Ue(y,T)`（`72316`）默认 `j=T?.preempt??"allow"`（`72329`）；归档会话 wake 被抑制（`fr(y)`→`wake suppressed, session is being archived`，`72323`）；idle actor 直接 `M.wakeResolver()`（`72338`）。`G(y,T,j)`（`71639`）在 `tool_use/tool_result/accept` 边界延迟中断，`T==="soft"` 分支存在，返回 `defer_*/immediate/noop`；`force→G(M,"immediate",N)`（`72358-72359`）、`allow→G(M,"soft",N)`（`72374-72375`）。**confirmed**。
- **preempt 档位映射 `_2`→`z2`**（`77314`）：`!t||!t.startsWith("/")?"allow":t.split(/\s+/,1)[0]?.toLowerCase()==="/cancel"?"force":"never"`（`77316`，逐字符匹配）——普通消息→`allow`、首词 `/cancel`→`force`、其它斜杠命令→`never`。`allow` 在内部派生为 `soft` 模式（非外部档位）。ingress 处 `emit("session.wake",{...,preempt:z2(g.text)})`（`78233`）即以此映射注入 preempt。**confirmed**。
- **单 turn 准入 + steering lane = idle 之外的第二条低延迟续接**：`Ue` 内仅当 `j==="allow"&&(ct||Ne)&&M.admissionCallback&&!M.admissionInProgress` 时（`ct`=Claude 当前 turn 已 accepted、`Ne`=Codex 有 activeTurn）把新批次交给 **admission callback** 处理（`admitting to live streaming session`，`72344-72356`），无需打断亦无需 idle 重启；`admissionInProgress` 双端 finally 复位防并发注入（`72351/72353`）。admission callback（`72716-72821`）走**显式 steering 通道**：Claude 侧把新批**追加进当前 turn 的 steer 文本**（`appended claude steer`，`72768`）或 park 为 `pendingSteer`（`parked claude steer`，`72821`）；Codex 侧调 `codexAdapter.steerActiveTurn`→`turn/steer`（`codex turn/steer landed`，`72739`），失败则回退 redrain。`pendingSteer` 在 turn 循环里被消费：命中则 `injected interjection mid-turn`（`71818-71833`），或流已关闭则 requeue 回 inbox（`71926-71966`）。**一次只准入一个对话 turn**，后到输入不再折进跑动中的 turn 导致会话永久 busy。**confirmed（准入判据/steering 路径），mid-turn 注入时序为静态阅读**。
- **`wakeResolver` 单槽不变量（并发同步点）**：同一 `wakeResolver` 字段被 `st`(idle 等待) **设置**（`73173`）、被 `Ue`/`w`(唤醒/出队) **消费并置 null**（见 `71556` 的 `wakeResolver(),wakeResolver=null`、`72338` 的 `M.wakeResolver(),M.wakeResolver=null`），是 idle↔wake 竞争的**唯一同步点**，构成一条并发不变量。**confirmed**。
- **Plane/kind 硬隔离**：`session.notify`（`77683`）内联 `o=Os→Yi(s.session_key); if(o!=="channel"&&o!=="job") return {ok:!1,reason:"forbidden_kind",…}`（`77684-77690`）——拒绝把外部通知投给 subconscious/system/meta 平面；`session.compact`（`77739`）更严 `a=Yi(...); if(a!=="channel")…`（`77740`），且 `if(fr(...)) reason:"archiving"`（`77747-77749`）。白名单谓词 `F1`→`qz`（`e=>Os→Yi(e)==="channel"||Yi(e)==="job"`，`48921`）存在但供 `listUserVisible`，notify/compact 用内联 `Yi` 判断。**confirmed**。
- **归档态统一短路 `ol()`→`ro()`**：`ro(e,t)=XQ($f(e,t))&&!XQ(Pr(e,t))`（`30953`，归档目录存在且活动目录不存在）——tombstone 判定贯穿 delivery-cursor（`76716`）、compact、drain 收尾，是归档态对所有写路径的统一短路机制。归档安全在 v0.6.0 加固：`archive` 前先证明无 in-flight 工作、忽略 channel 占位 actor，归档标记（`fr`/`yk`/`_k` 对 `Hg` Set 的增删查）被当作真实"即将消失"信号，抑制一切 wake/ingress。归档错误 `ZD`→`Of` `extends Error {kind="session_archiving"}`（`31121-31122`），`_c`→`Au` 抛之（`31115-31116`）。**confirmed**。
- **收尾再校验 `Ze`→`A` + 一次性重驱**：`A(y,T)`（`73183`）actor end 后重扫 inbox，返回 `fresh/conservative/none`；`fresh`→重新 wake（`preempt:"never"`，`73141`）；`conservative`(瞬时读失败) 受 `consecutiveConservativeRedrive` 约束——该字段**确为布尔**：初始 `??!1`（`72463`），已 true 则 `conservative re-drive suppressed (cap spent)`（`73143`），首次则 `=!0`+`re-entering wake path once`（`73146`）——即只重驱一次防自旋（`73136-73151`）。**confirmed**。
- **后台 Agent 完成单一 owner**（v0.6.1）：job origin actor 收尾时经 `Ce(y,{runStarted,cancelled,processedCount,claimCursor,error,resultText})` **只持久记录生命周期事件**再置 `status="ended"`（`73121-73134`）；对话侧则由 Claude 原生完成续写作为唯一"说进对话"的路径，duoduo 不再另造重复回调 turn。**confirmed（收尾记录路径），"唯一 owner"表述为综合推断**。

---

### 证据表

| 机制主张 | 证据(字面量/片段) | 位置 | 置信 |
|---|---|---|---|
| 进程级 runtime 写锁 + pid/boot_id/心跳/TTL 抢占 | `daemon-writer.json`；`Runtime lock already held by pid=${...}`；`A9e`: `Number.isNaN(r) \|\| t.getTime()-r>n \|\| (e.boot_id && e.boot_id!==Ice()) \|\| !O9e(e.pid)`；`O9e`=`process.kill(e,0)`；TTL `ttlMs??12e4` | daemon `76996`(eU)/`77000`(O9e)/`77010`(C9e)/`77027`(Ice)/`77031-77033`(A9e)/`77046`(Pce TTL)；抢锁 `78706-78707`；心跳 `78717-78719` | confirmed |
| 会话级异步互斥（串行化状态变更） | `hi(e,t){ i=gk.get(e)??Promise.resolve(); gk.set(e,r); await i; try{return await t()} finally{n(); gk.get(e)===r&&gk.delete(e)} }` | daemon `31090`（调用点 `31220/33676/33709/33759/33795/33831/49149/49168/76716`） | confirmed |
| 一 session_key 一 actor + 单调 actorRunId + active/idle/ended | `let g = new Map`（`71582`）；`Nt()` 生成、`actorRunId: M=++R`；`status:"active"→"idle"→"ended"` | daemon `72422-72425/73042/73133` | confirmed |
| 双有界池：channel=10 / job=6，超限入 wakeQueue | `h`@`71513`/`_`@`71519` `{name,activeCount,maxConcurrent,wakeQueue}`；`f=…??10`、`m=…??6`；`ee.wakeQueue.push(y)` | daemon `71511-71519`；`72403`；RPC `system.config`→`max_concurrent_channel:10, max_concurrent_job:6`（`77264-77265`） | confirmed |
| idle 释放池槽 + `st`(idle_ms) 等待，前台附着钉住 actor | `released pool slot (idle)`；`st(y,T){ wakeResolver=j(!0) vs setTimeout(j(!1),T) }`；`idle timeout but has attachments, continuing wait` | daemon `73048/73167/73065`；重抢槽 `73085-73099`；`idle_ms:3600000` RPC | confirmed |
| dequeue 原地复用 idle actor | `w(y){ …if(N.status==="idle"&&!N.holdsPoolSlot&&N.drainPromise){ pendingWake=!0; wakeResolver(); "resuming idle actor from dequeue"; return } …回落 Nt(I,$2(I)) }` | daemon `71534-71581` | confirmed |
| 唤醒/抢占：Ue 归档抑制 + idle resolve + 单 turn 准入/steering；G 边界延迟 | `Ue`：`fr→wake suppressed`；`allow&&(ct\|\|Ne)&&admissionCallback&&!admissionInProgress`（admitting）；`G`：`tool_use/tool_result/accept` 边界，`force→immediate`/`allow→soft` | daemon `72316/72323/72338/72344`（steering `72716-72821`）；`71639/72358/72374` | confirmed |
| 单 turn 准入 + steering lane（后到走显式通道） | `admitting to live streaming session`；`appended claude steer`/`parked claude steer`；`codex turn/steer landed`；`injected interjection mid-turn`；`pendingSteer` 会话状态 | daemon `72344-72356`；`72739/72768/72821`；`71818-71833`；字段 `72453` | confirmed |
| preempt 档位映射 `z2` | `!t\|\|!t.startsWith("/")?"allow":首词==="/cancel"?"force":"never"`；`Ue` 默认 `j=T?.preempt??"allow"`；ingress `preempt:z2(g.text)` | daemon `77316`；`72329`；`78233` | confirmed |
| Plane/kind 隔离：notify 拒非 channel/job，compact 仅 channel | `o=Yi(s.session_key); if(o!=="channel"&&o!=="job") reason:"forbidden_kind"`；`compact`：`if(a!=="channel")` + `if(fr)reason:"archiving"` | daemon `77683-77690`；`77739-77749`；`Yi`@`48917`；`qz`@`48921` | confirmed |
| session_key 格式 `<scope>:<name>:<hash(workspaceAbsPath)>` | `dte: \`${t}:${n}:${ute(a)}\``（`a=Af(e.workspaceAbsPath)`）；`TU({scope:"stdio",...})`；活体 `stdio:default:28d3ca682f86` | stdio `46109/46112/46096/46116`；`session list` RPC | confirmed |
| 会话目录 = sessionsDir/sha256(key)，含 inbox/mailbox/state.json；归档 tombstone | `Pr=join(sessionsDir,Gi(t))`；`Gi=sha256(e).digest(hex)`；`ro()=XQ($f)&&!XQ(Pr)`；`inbox/mailbox.md/mailbox/pending/notes.jsonl/meta.md/state.json` | daemon `30937`(Gi)/`30941`(Pr)/`30949`($f)/`30953`(ro)；mailbox 标题 `31376` | confirmed |
| rehydrate 扫描 + state.json 字段 | `MX`→`nX(e)` 扫 `e.sessionsDir` 后 `stat().isDirectory()&&R2e` 读取；`mae` 字段集 | daemon `31020`（nX）/`30999`（R2e，`qqe`）；`48938`（mae，旧 `Cne`） | confirmed |
| ingress→wake；outbox replay；delivery-cursor 跳归档 | `channel.ingress`→`routing.enqueued && emit("session.wake",{...,preempt:z2(text)})`；`replayed outbox backlog`；`Zz` 用 `ro()` 跳归档写游标 | daemon `78193/78233`；`78667`；`76716` | confirmed |

### 关键数据结构 / 事件 / 文件格式（真实字面量）

- **Actor 对象**（内存态，`72426-72463`）：`sessionKey, actorRunId(=++R@72425), sdkSessionId, sdkSessionIdVerified, status, currentAbortController, query, streamAbortController, streamingState, streamingAdapter, streamingGeneration, drainPromise, wakeResolver(单槽 resolver，st 设置/Ue·w 消费置 null), pendingWake, isStreaming, activeToolUseIds:Set, pendingPreempt, pendingPreemptBoundary("tool_use"/"tool_result"/"accept"，由 G() @71639 设置), pendingClear, attachedChannels:Set, inflightEventIds:Set, admissionInProgress, pendingSteer(steering lane 会话状态，null/{steerText,eventIds,claimedEventIds,settled,…}，@72453), admissionCallback, idleSince, spawnedAt, runtime("claude"/"codex"), codexAdapter, origin("channel"/"job"/"system"), jobId, jobStateless, consecutiveConservativeRedrive(布尔，初始 ??!1 @72463)`。
- **池对象**（`h`@`71513` / `_`@`71519`）：`{name:"channel"|"job", activeCount, maxConcurrent, wakeQueue:[]}`（注册表 Map 为 `g`@`71582`，与 job 池 `_` 分属两个符号）。
- **runtime 锁文件** `run/locks/daemon-writer.json`：`{runtime_dir, pid, boot_id, started_at, last_heartbeat_at}`（`boot_id` 取 `/proc/sys/kernel/random/boot_id` + macOS `sysctl kern.boottime`/uptime 兜底，`BWe`→`C9e`@`77010`；当前值 getter `Ice`@`77027`）。
- **会话磁盘布局** `var/sessions/<sha256(key)>/`：`state.json`、`meta.md`、`mailbox.md`（渲染标题 `["# Session Mailbox","","## Inbox",""]`，`31376`）、`mailbox/pending/`、`mailbox/notes.jsonl`、`inbox/`。归档态迁到 `var/sessions-archive/<sha256(key)>/`（`vf`→`$f`@`30949`；`ol()`→`ro()` 判归档 tombstone `30953`），归档进行中由 `Ni`/`JS`/`GS`（`fr`/`yk`/`_k`，对 `Tg`→`Hg` Set 增删查）抑制一切 wake/ingress，错误 `kind="session_archiving"`（`31122`）。
  - *注（confirmed）*：错误类的 RE 命名 `SessionArchivingError` 现由代码直证——minified 类符号为 `Of`（旧 `ZD`），其构造器显式 `this.name = "SessionArchivingError"` 并置 `kind="session_archiving"`（`31121-31125`）。
- **state.json 字段**（`Cne`→`mae`@`48938`）：`session_key, cwd, plane, permission_profile, created_at, last_event_id, last_event_at, last_seen_daemon_started_at, source_channel_id, last_error`，v0.6 起新增 auto-compact 计量字段 `context_used_tokens, last_compact_at, compact_measured_floor(=compact_stats.post_total), compact_measured_at`；`display_name/kind/owner_session` 来自 meta（由 `gk`→`jk`@`72469` upsert，kind 在此从 origin 二次派生）。
- **preempt 值来源** `_2`→`z2`（`77316`）：无斜杠命令→`"allow"`、首词 `/cancel`→`"force"`、其它斜杠命令→`"never"`；`Ue` 默认 `j=T?.preempt??"allow"`（`72329`）。内部 `G(actor,"soft"|"immediate",boundary)` 的 `soft` 是由 `allow` 派生的内部模式名，非外部档位。
- **相关事件/RPC**：入口 `channel.ingress`/`session.notify`/`session.wake`（`emit("session.wake",{sessionKey,displayName,preempt})`）；隔离判定返回 `reason:"forbidden_kind"`/`"archiving"`/`"ambiguous"`/`"not_found"`。

### 给 Agent PM 的洞察

> 1. **"外部单身份、内部多会话" = session_key 命名空间 + 一 key 一 actor + 前缀即平面**。路由/隔离/权限全部从 `session_key` 前缀（`stdio:`/`job:`/`meta:`/`subconscious:`/`system:`）纯函数派生（`Os`→`Yi`/`B5e`→`C8e`），无需额外注册表（呼应本节论点 1）。代价是"平面"是约定式字符串契约——`session.notify` 靠前缀白名单挡住 work→system/subconscious 的越权唤醒（只放行 channel/job），这是可借鉴的**轻量能力边界**，但也意味着改前缀即改权限，需谨慎治理。

> 2. **并发用"双有界池 + 可让出的池槽"而非固定线程**。channel(10)/job(6) 分池避免后台批处理饿死前台交互；idle actor **主动释放池槽**（`73048`）再挂起等待，dequeue 时对 idle-with-drainPromise 的 actor **原地唤醒复用**（`71534-71581`），让容量在会话间流动。可借鉴：把"占用执行槽"与"会话存活"解耦——idle 不占槽，但 `attachedChannels` 能把 actor 钉活，兼顾资源回收与前台低延迟续接（呼应论点 3）。

> 3. **抢占是"单 turn 准入 + 边界感知"的而非硬 kill**。外部 preempt 枚举为 **`allow`/`force`/`never`** 三档（`z2` 由用户命令映射）；v0.6.1 起一次只准入一个对话 turn，`allow` 档优先走 admission callback 的**显式 steering 通道**（Claude 追加 steer 文本 / Codex `turn/steer`，不打断、后到消息或就地插话或 park 回 inbox），退而求其次才在 `tool_use/tool_result/accept` 边界以 `soft` 模式延迟中断（`G`），避免在半个工具调用中截断导致状态损坏；`force` 走 `immediate`。这既防"半个工具调用被截断"，又防"后到消息折进跑动 turn 导致会话永久 busy"，是有状态 agent 做"打断/续写"的关键取舍（呼应论点 4），值得任何流式 agent 产品照搬。

> 4. **两层锁分工清晰**：进程级 runtime 锁（跨重启、pid+boot_id 探活）解决"同目录多 daemon"；会话级 `hi` 异步互斥解决"同会话并发写状态"。前者是运维健壮性，后者是数据一致性——不要用一把锁混着做（呼应论点 2）。

> 5. **能力边界**：actor 之上没有真正的分布式/多进程调度，全在单 daemon 单进程内用 Map+Promise 编排，`wakeResolver` 单槽是 idle↔wake 竞争的唯一同步点；`unhandledRejection` 被吞、`uncaughtException` 直接 `process.exit(1)` 靠外部重启恢复（`78748-78751`）。适合"单机常驻个人 agent"，若要横向扩展会话，需要把内存 `Map g`/池/`hi` 换成外部化的租约与队列。


---
## §8 Claude/Codex 对等运行时抽象与路由

**领起结论：`runtime` 只是一个 `claude`/`codex` 两值字符串枚举，却是一层"薄名字、厚差异"的抽象——duoduo 不抹平 SDK（进程内 append-only jsonl）与 app-server（常驻 JSON-RPC 子进程）的差异，而是在选择链（显式声明 > channel frontmatter > `ALADUO_DEFAULT_RUNTIME` > `claude`）与命令层用 `runtime === "claude"` 分支*诚实路由*，靠 `CLAUDE.md → AGENTS.md` symlink 与 protocol 分桶会计跨后端复用同一套指令与溯源。** 下面四个论点自上而下展开这句：①名字很薄（两值枚举 + 诚实的选择链）；②差异很厚（两种不对称的执行形态与探测机制）；③命令层不假装对等（undo/model/compact 逐 runtime 分叉）；④骨架靠复用而非抹平（symlink + 分桶 + 认证短路，但权限/thinking 面故意不对等）。

---

### 论点①　名字很薄：两值枚举 + 诚实的选择链，"显式意图 > 自动兜底"

**所以呢**：runtime 的合法取值只有两个，选择逻辑不玩魔法——它把"用户/actor 明确要 codex"当作不可降级的意图直接放行，只对"从 channel frontmatter 派生出来的 codex"才做可用性门控。这是一条刻意的产品价值排序（尊重显式意图，宁可晚炸也不静默降级）。

- **枚举只有两值，且是三处独立词法作用域的常量、非笔误**：`s2e = ["claude","codex"]`（`daemon.pretty.js:30582`，`lk` init 块内）、并行副本 `aHe = ["claude","codex"]`（`33990`，`sy` init 块），以及第三处模块级 `var lhe = ["claude","codex"]`（`77460`，供 `Det`/`jet` 使用）。默认值解析 `Ou(e=process.env)`（`30574`）：`ALADUO_DEFAULT_RUNTIME` 非字符串 → `"claude"`；trim/lowercase 后空串 → `"claude"`；`s2e.includes(n) ? n : "claude"`（confirmed）。核心断言（枚举仅两值）不变。
- **选择链 A——channel/Job 会话（函数 `p`，`daemon.pretty.js:71502-71510`）**：`if (T?.runtime === "codex") return "codex"`（**`71503`，显式声明 codex 直接返回，不做可用性门控**）→ 无 `source_channel_id` 则 `T?.runtime ?? "claude"`（`71505`）→ 否则回溯 `ji(t,N).channel_kind → ea()` 取 frontmatter，`(M?.runtime ?? ke?.runtime) === "codex" && (await l()).ok ? "codex" : T?.runtime ?? "claude"`（`71509`）。可用性探测经记忆化 `l = () => (c || (c = a()), c)`，其中 `a = e.codexAvailability ?? hc`（`71498`，即依赖注入点）（confirmed，直接读取核对）。
- **选择链 B——潜意识 partition（函数 `v`，`daemon.pretty.js:74265`）**：`G = k.runtime`（partition frontmatter，`74270`）→ `K = G ?? Ou()`（`74271`）。若 `K` 不可用则跳过该 partition 并发 `agent.error{outcome:"runtime_unavailable", runtime:K, runtime_source: G ? "explicit" : "default"}`（`74283-74291`）——注意这条与选择链 A 的失败前移相反，partition 路径*会*显式发不可用事件（confirmed）。
- **"runtime"一词在本运行时被重载两义，须消歧**：`system.runtime.info` RPC（`daemon.pretty.js:78146`）返回的是*守护进程实例身份*——`{version, runtime_id, runtime_mode:"host"（固定）, runtime_dir, work_dir, kernel_dir}`（响应体 `78051-78057`，活体实测确认），**不含 `available_runtimes`、与模型后端无关**。注意 v0.6.0 移除 container 模式后 `runtime_mode` 响应恒为 `"host"`；仅类型守卫 `KE`（`75984`，校验入口 `78148`）仍容忍历史 `runtime_mode:"container"` 状态做向后兼容，非活路径。本节所讲的 `runtime` 始终指*模型后端*；读者勿把 `runtime.info` 误当成后端探测入口（confirmed，含活体印证）。

### 论点②　差异很厚：两种不对称的执行形态，各带可注入、可去重的探测引擎

**所以呢**：同一个字符串背后是两种根本不同的进程模型。理解"`available_runtimes` 会不会阻塞或重复探测"，必须看到探测被结果缓存 + in-flight promise 双重去重，且两侧都留了测试注入缝——这正是"探测可注入、选择可单测"论断的完整两半。

- **claude = 进程内 SDK，无子进程**：模块顶层静态 `import { query as Boe } from "@anthropic-ai/claude-agent-sdk"`（`daemon.pretty.js:48090`）。可用性同步验证器 `Qoe()`（`48187`）：`CLAUDE_CODE_EXECUTABLE` 设了就放行（`48188`）；否则平台白名单 6 种、unsupported 抛错（`48193`）；原生二进制 `o.resolve("${c}/claude")` 在其后的 for 循环 `48203-48206`（confirmed）。
- **真正的探测引擎是 `Yoe()`（probeClaudeAvailability，`48138`），5s 超时套在这里而非 `Qoe`**：`Promise.race([Dz()包裹, setTimeout(Zoe)])`（`48141-48160`，`Zoe = 5e3` 精确在 `48768`）。**双重去重**：结果缓存 `ec`（读 `48139`、写 `return ec = r, r` 于 `48161`）+ in-flight promise `Vl`（并发探测复用同一 promise，`48140`）。派生读取 `isClaudeAvailable(jz)= ec?.ok===!0`（`48168`）、`claudeUnavailableReason(v_)= ec?.ok===!1 ? ec.reason`（`48172`）（confirmed，直接读取核对）。
- **claude 侧测试注入缝 `Dz`**：`Dz = Koe = () => Qoe()`（`48768`），验证器经 `__setClaudeVerifierForTest`（`FWe`，`48183`：`Dz=e, ec=void 0, Vl=void 0`）可替换并清缓存——与 codex 侧的注入缝对称（confirmed）。
- **codex = 外部 CLI + 常驻 app-server 子进程**：探测 `hc(e="codex")`（`57281`）两步各 5s——`execFile(e,["--version"],{timeout:5e3})` 后 `codex login status` 断言 `(i+s).toLowerCase().includes("logged in")`（`57304`）。运行时适配器类 `bR`（`58174`）的 `start()` 内 `this.proc = FKe(this.binary, ["app-server"], {cwd, stdio:["pipe","pipe","pipe"], env:{...process.env,...this.env}, detached:!0})`（`58191`），走换行分隔 JSON-RPC（confirmed）。
- **codex 侧缓存是另一对变量 `PU`/`$U`**：`isCodexAvailable(H_)= PU===!0`（`57261`），写点在 `BKe`（primeCodexAvailability，`PU=t.ok, $U=t.ok?void 0:t.reason`，`57268`）与 `HKe`（`PU=e, $U=void 0`，`57273`）。测试注入 `__setCodexAvailabilityForTests: () => HKe` 导出在 `57233`，`HKe` 定义在 `57273`（confirmed）。
- **`available_runtimes` 由两探针拼装**：会话探针 `jet`（`77468`）`o() && u.push("claude"), a() && u.push("codex")`（`77477`），`descriptor.runtime` 经 `Det`（`77462`）归一化上报 `Det(f.runtime ?? l?.runtime)`（`77507`），非原样透传（confirmed）。

### 论点③　命令层不假装对等：undo/model/compact 按 `runtime === "claude"` 诚实分叉

**所以呢**：这是本子系统最关键的状态机分叉。因为 Claude 会话是 append-only jsonl（只能"算 cutoff → 下次 drain 才 fork 新 session"），而 Codex app-server 原生支持同步 `thread/rollback`，同名命令在"何时生效、session 是否连续"上根本不同。PM 若设计撤销/回滚体验，不能承诺跨后端统一。

- **`/undo`——Claude 延迟成 fork、Codex 同步 rollback**：Claude adapter `undo()` 只扫 jsonl 算 `cutoff_message_uuid`，返回 `{kind:"succeeded", runtime:"claude", sessionIdChanged:!0, cutoff_message_uuid:f}`（`48741-48747`），不真正改历史；命令层 `E8e`（`61321`）写 `pending_undo:{from, upToMessageUuid, requested_at}`（`61361-61367`），回 `↩️ Undo queued (...)`（`61373`）；真正的 `V5e(he.from,{upToMessageId})`（forkSession，`59778`）推迟到 drain 头部执行，守卫 `X.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)`（`59772`），失败则保留 `pending_undo` 并中止 drain（`59796-59803`）。Codex adapter `undo()` 直发 `thread/rollback{threadId, numTurns}`（`57811`）、同步生效、`sessionIdChanged:!1`（`57818`）；drain 头部 else 分支 `X.pendingUndo && n.runtime !== "claude" → (X.pendingUndo=void 0, oo(...,"pending_undo"))`（`59817`）清掉 codex 会话遗留的 pending（confirmed，逐行核对）。
- **`/model`——Claude 试图即时、Codex 只能延迟 fork**：`setSessionModel` 内 `if (await p(y,T) === "codex")` → 写 `dt(...model_runtime: T!==null?"codex":null, pending_model_fork:!0, applied:"stored")`（`73837-73846`）；claude 路径 `ee="stored"; setModel 成功→ee="live"`，写 `model_runtime:"claude", pending_model_fork:null, applied:ee`（`73862-73867`）。codex 回执 `Codex session — a switch takes effect from the next message.`（`75845`）。runtime flip 时经 `!(i ? i!==s : s==="codex")` 守卫清空 `model/model_runtime/pending_model_fork`（`61529-61531`）（confirmed）。
- **codex 侧 fork 时序的落地（与 claude `V5e` 对称的另一半）**：codex thread 生命周期三分支（`57509`）——`forkFrom → "thread/fork"`、`sessionId → "thread/resume"`、else → `"thread/start"`；`I8e`（`61540`，日志 `resolved pending_model_fork at codex drain start` 于 `61555`）在 drain 起点把 `forkFrom` 设为当前 sessionId，才让 codex 的 model 切换在下一条消息 fork 生效（confirmed）。
- **`/compact`——门控只锁 claude，实际抵达回执的是 codex**：外层守卫 `V.event.routing_hint?.intent === "history-control"`（`60273`）；内层 `if (kr === "/compact" && (n.runtime === "claude" || n.runtime === void 0))`（`60279`）→ `oa(t)==="channel" ? Wt=!0 :（发 "only available in interactive sessions" + continue）`（`60280-60302`）。`oa(e)`（`60714`）把 `job:→"job"`、`meta:→"meta"`、`system:|cadence:→"system"`、含 `:` → `"channel"`，否则 unknown。**codex 根本不进这个拦截块**（守卫限 claude/void），落到命令层 `E8e`（`61321`）→ `r.compact()` → `📦 History compacted (runtime: ${u.runtime})`（`61339`）。所以：claude channel 走 `Wt=true` 透传 SDK 原生（不产该串），claude 非 channel 被拦，唯 codex compact 抵达 `61339`（confirmed，codex 路由链已补全）。

### 论点④　骨架靠复用而非抹平：一套指令 + 一套溯源跨后端，但权限/thinking 面故意不对等

**所以呢**：duoduo 不为每个后端各维护一份指令与会计口径，而是靠 symlink 复用同一 system 指令、靠 protocol 分桶让 token 溯源跨后端归位；但它*不*把权限模型与工具/thinking 可见性也抹平——codex 有沙箱枚举与 reasoning 退订开关，claude 侧工具面则从 v0.5.10 起由 denylist 翻转为 allowlist，两后端的安全/可观测面是诚实的不对等。

- **同一套指令**：codex 会话启动 `OU(e)`（`57318`）若工作目录有 `CLAUDE.md` 而无 `AGENTS.md`，自动 `await n.symlink("CLAUDE.md","AGENTS.md")`（日志 `[codex] created AGENTS.md symlink`，`57323`）——让一套 system 指令喂两个后端（confirmed）。
- **同一套溯源，两套口径**：usage 按 protocol 分桶（`35020`）——`anthropic → cache.anthropic.{drains,cache_read_tokens,cache_create_tokens,fresh_input_tokens}`；`codex → cache.codex.{drains,input_tokens,cached_tokens}`；其余 `unsupported_drains++`。Anthropic 有 cache_creation、Codex 只有 cached，口径不同但都落回同一 drain record（confirmed）。
- **认证来源三态 + `claude_code_local` 短路**（仅 host 模式）：`zKe(e)`（`77161`）三值枚举 `claude_code_local|anthropic_api_key|compatible_endpoint`；env 读取 `IU`（`77165`）取 `ALADUO_CLAUDE_AUTH_SOURCE ?? ALADUO_AUTH_SOURCE`（`77166`，非法值→void 0）。分派体 `t === "claude_code_local" → return e`（`77249`，提前返回不注入 ANTHROPIC_*）；否则 `for (n of xet){ let r=cr(n,null); r.source!=="unset" && (e[Eet(n)]=r) }`（`77250-77253`）注入覆盖。活体 `duoduo daemon config` → `claude_auth_source: claude_code_local (env)`，与短路路径一致（confirmed，含活体印证）。
- **claude 工具面 v0.5.10 起由 denylist 翻转为 allowlist**：旧的 `DEFAULT_DISALLOWED_TOOLS` 黑名单已**移除**，改为固定核心集 `CLAUDE_CORE_TOOLS`（`Fp`，`48758`：`["Bash","Read","Write","Edit","Grep","Glob","Agent","TaskOutput","TaskStop","Skill","ToolSearch","TaskCreate","TaskGet","TaskUpdate","TaskList","SendMessage"]`）+ channel descriptor 的 `claude.tools` 嵌套键按需追加可选工具；`splitDisallowedToolsForClaude`（`Goe`，`48098`）按 `mcp__` 前缀把工具名拆成 `{mcpTools, builtIns}`（confirmed）。
- **duoduo 向 codex 叠加自有工具，但 codex 内置工具不可禁用**：`disallowedTools` 被显式忽略并告警 `[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled`（`57467`）；另一面握手中 `experimentalApi: !!n.dynamicTools?.length`（**两处 initialize 站点** `57413` 与 `57453`）门控，随后 `for (m of n.dynamicTools) f.set(m.name, m.handler); r.setToolHandlers(f)`（`57416-57419`，第二站点 `57459`）（confirmed）。
- **权限与 thinking 面故意不对等**：codex 沙箱经 `lm()`/`ALADUO_CODEX_SANDBOX`（`57277`）映射 `read-only | workspace-write(默认) | danger-full-access`，握手固定 `approvalPolicy:"never"`（`57477`/`57493`/`57501`）；`optOutNotificationMethods`（`57414`/`57454`）显式退订 codex 的 reasoning 增量流（`item/reasoning/*Delta`），直接决定 codex thinking 是否回传前端。claude 侧无对应沙箱枚举与退订开关——这是"两后端权限/推理可见性不对等"的开关点。v0.6.0 起 `/effort` 让每会话独立设定推理力度（levels `Vk = ["low","medium","high","xhigh"]`，`75311`；网关命令处理 `75869`，经 `getSessionEffort`/`setSessionEffort`；`reasoningEffort` 随 run-config 下达），而 v0.5.10 修复了流式 Claude turn 误将 thinking 强制关闭的 bug——claude 侧 thinking 现按会话推理力度如实回传（confirmed）。

---

### 证据表

| 机制主张 | 证据（字面量/代码片段） | 位置 | 置信 |
|---|---|---|---|
| runtime 枚举只有 claude/codex（三处独立常量） | `s2e = ["claude","codex"]`；并行副本 `aHe`、`lhe` | daemon.pretty.js:30582, 33990, 77460 | confirmed |
| 默认 runtime 由 ALADUO_DEFAULT_RUNTIME 决定，回退 claude | `Ou(e=process.env)`；`s2e.includes(n) ? n : "claude"` | daemon.pretty.js:30574-30580 | confirmed |
| claude=进程内 SDK（顶层静态 import，无子进程） | `import { query as Boe } from "@anthropic-ai/claude-agent-sdk"` | daemon.pretty.js:48090 | confirmed |
| claude 可用性=CLAUDE_CODE_EXECUTABLE 短路 → 平台白名单 → 原生二进制 resolve | `if (y_(process.env.CLAUDE_CODE_EXECUTABLE)) return;`；平台断言；`o.resolve("${c}/claude")` for 循环 | daemon.pretty.js:48188, 48193, 48203-48206 | confirmed |
| 探测引擎 Yoe()：5s 超时 + ec 结果缓存 + Vl in-flight 去重 | `if (ec) return ec; if (Vl) return Vl;`；`Promise.race([...,setTimeout(Zoe)])`；`return ec = r, r`；`Zoe=5e3` | daemon.pretty.js:48138-48162, 48768 | confirmed |
| claude 探测可注入（__setClaudeVerifierForTest 清缓存） | `Dz = Koe = () => Qoe()`；`FWe`：`Dz=e, ec=void 0, Vl=void 0` | daemon.pretty.js:48768, 48183 | confirmed |
| codex=外部 CLI，探测 --version + login status（各 5s） | `r(e,["--version"],{timeout:5e3})`；`(i+s).toLowerCase().includes("logged in")` | daemon.pretty.js:57281-57304 | confirmed |
| codex 运行时=spawn app-server 常驻子进程 | `this.proc = FKe(this.binary,["app-server"],{...detached:!0})`（类 `bR`） | daemon.pretty.js:58174, 58191 | confirmed |
| codex 探测缓存 PU/$U + __setCodexAvailabilityForTests | `isCodexAvailable = PU===!0`；`BKe`：`PU=t.ok, $U=...`；export `() => HKe` | daemon.pretty.js:57261, 57268, 57233, 57273 | confirmed |
| available_runtimes 由两探针拼装，descriptor.runtime 经 Det 归一化 | `o() && u.push("claude"), a() && u.push("codex")`；`Det(f.runtime ?? l?.runtime)` | daemon.pretty.js:77468, 77477, 77507 | confirmed |
| 选择链 A：显式 codex 直返(不门控)，channel 派生 codex 才门控 | `if (T?.runtime === "codex") return "codex"`（直返 71503）；`...==="codex" && (await l()).ok ? "codex" : ...` | daemon.pretty.js:71502-71510 | confirmed |
| 选择链 B：partition frontmatter ?? Ou()；不可用发 runtime_unavailable | `G = k.runtime, K = G ?? Ou()`；`outcome:"runtime_unavailable", runtime_source: G?"explicit":"default"` | daemon.pretty.js:74265-74271, 74283-74291 | confirmed |
| runtime.info 暴露 daemon 身份而非模型后端（消歧，host-only） | `{version, runtime_id, runtime_mode:"host", runtime_dir, work_dir, kernel_dir}`，无 available_runtimes | daemon.pretty.js:78146, 78051-78057（活体印证） | confirmed |
| Claude /undo 延迟成 fork（下次 drain，守卫含 runtime===void 0） | `↩️ Undo queued (...)`；`X.pendingUndo && (n.runtime==="claude"\|\|n.runtime===void 0)`；`V5e(he.from,{upToMessageId})` | daemon.pretty.js:48741-48747, 61361-61373, 59772-59803 | confirmed |
| Codex /undo 同步 rollback、session 不变、清遗留 pending_undo | `r.request("thread/rollback",{threadId,numTurns})`；`sessionIdChanged:!1`；else 分支清 pending_undo | daemon.pretty.js:57811-57818, 59817 | confirmed |
| Codex /model 只能 stored + pending_model_fork；flip 清覆盖 | `model_runtime:...codex, pending_model_fork:!0, applied:"stored"`；`a switch takes effect from the next message.` | daemon.pretty.js:73837-73867, 75845, 61529-61531 | confirmed |
| codex fork 时序：thread 生命周期三分支 + drain 起点 resolve | `forkFrom→thread/fork \| sessionId→thread/resume \| else→thread/start`；`I8e` resolved pending_model_fork | daemon.pretty.js:57509, 61540-61555 | confirmed |
| /compact：外层 history-control 守卫 + claude channel 放行、codex 抵达回执 | `intent==="history-control"`；`kr==="/compact" && (runtime==="claude"\|\|void 0)`；`oa(t)==="channel"?Wt=!0`；`📦 History compacted` | daemon.pretty.js:60273, 60279-60302, 60714, 61339 | confirmed |
| 认证来源三态枚举 + claude_code_local 短路 | `zKe`；`ALADUO_CLAUDE_AUTH_SOURCE ?? ALADUO_AUTH_SOURCE`；`t==="claude_code_local") return e` | daemon.pretty.js:77161, 77165-77166, 77249-77253 | confirmed（含活体） |
| claude 工具面 denylist→allowlist（CLAUDE_CORE_TOOLS + claude.tools） | `Fp = ["Bash","Read",...,"SendMessage"]`；`Goe` 按 `mcp__` 前缀拆 `{mcpTools, builtIns}` | daemon.pretty.js:48758, 48098 | confirmed |
| Codex 内置工具不可禁用/disallowedTools 被忽略 | `[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled` | daemon.pretty.js:57467 | confirmed |
| duoduo 向 codex 叠加 dynamicTools（两处 handshake 站点） | `experimentalApi: !!n.dynamicTools?.length`（57413/57453）；`r.setToolHandlers(f)` | daemon.pretty.js:57413, 57416-57459 | confirmed |
| codex 会话自动 symlink CLAUDE.md → AGENTS.md | `[codex] created AGENTS.md symlink` | daemon.pretty.js:57318-57323 | confirmed |
| usage 按 protocol 分桶（anthropic vs codex） | `cache.anthropic.{...cache_read/create...}` vs `cache.codex.{...input/cached...}`，其余 `unsupported_drains` | daemon.pretty.js:35020 | confirmed |
| codex 沙箱枚举 + no-approval + reasoning 退订（与 claude 不对等） | `ALADUO_CODEX_SANDBOX`→`read-only\|workspace-write\|danger-full-access`；`approvalPolicy:"never"`；`optOutNotificationMethods` | daemon.pretty.js:57277, 57477, 57414/57454 | confirmed |
| /effort 每会话推理力度（v0.6.0，thinking 面新增开关） | `Vk = ["low","medium","high","xhigh"]`；`/effort` 网关处理；`reasoningEffort` 下达 run-config | daemon.pretty.js:75311, 75869, 58029 | confirmed |
| container 模式移除（host-only）；仅类型守卫留向后兼容 | `KE`：`e.runtime_mode !== "container" && e.runtime_mode !== "host"`（唯一 container 残留，非活路径） | daemon.pretty.js:75984 | confirmed |
| Job frontmatter runtime 语义（默认 claude，显式才用 codex） | `.default(e[0])`；`'claude' (default) uses Claude Code; 'codex' uses Codex (GPT)...` | daemon.pretty.js:68350 | confirmed |
| partition frontmatter runtime 校验（非法回退全局默认） | `a==="claude"\|\|a==="codex" ? u=a : a!==void 0 && Pe("[playlist] ...invalid runtime frontmatter...")` | daemon.pretty.js:55669 | confirmed |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **探针返回**（RPC 会话探针 `jet`）：`{ configured, session_exists, available_runtimes:["claude"|"codex"], descriptor:{cwd, runtime, display_name, bound_by, require_mention}, kind_defaults:{cwd, runtime} }`；`descriptor.runtime` 经 `Det()` 归一化后上报，非原样透传（`daemon.pretty.js:77468-77513`）。
- **daemon 身份**（RPC `system.runtime.info`，与后端无关）：`{version, runtime_id, runtime_mode:"host"（固定，container 已移除）, runtime_dir, work_dir, kernel_dir}`（`daemon.pretty.js:78146, 78051-78057`，活体实测）。
- **state.json 运行时相关字段**：`sdk_session_id`、`pending_undo:{from, upToMessageUuid, requested_at}`、`pending_fork_to`（drain 起点写入 `forkFrom`）、`model`、`model_runtime:"claude"|"codex"`、`pending_model_fork:boolean`（`daemon.pretty.js:61361-61367, 73837-73846, 61529-61531, 61540`）。
- **partition CLAUDE.md frontmatter**：`runtime: claude|codex`（非法值告警并回退全局默认，`daemon.pretty.js:55669`）；同一 frontmatter 还含 `schedule.{enabled,cooldown_ticks,max_duration_ms}`。
- **undo/compact 结果**：codex `{kind:"succeeded"|"noop"|"failed", runtime:"codex", newSessionId, sessionIdChanged, droppedTurns, triggered_at}`（`57811-57818`）；claude 版多 `cutoff_message_uuid`（`48741-48747`）。
- **usage 按 protocol 分桶**：`cache.anthropic.{drains,cache_read_tokens,cache_create_tokens,fresh_input_tokens}` vs `cache.codex.{drains,input_tokens,cached_tokens}`，其余归 `unsupported_drains`（`daemon.pretty.js:35020`）。
- **codex app-server 握手**：`initialize{clientInfo:{title:"duoduo-runtime",name:"duoduo",version:"0.1.0"}, capabilities:{experimentalApi:!!n.dynamicTools?.length, optOutNotificationMethods:["item/reasoning/summaryTextDelta",...]}}` → `notify("initialized")` → thread 生命周期三分支（fork/resume/start）；沙箱经 `ALADUO_CODEX_SANDBOX`（`lm`）映射 `read-only|workspace-write|danger-full-access`，`approvalPolicy:"never"`（`daemon.pretty.js:57406-57459, 57477`）。

### 给 Agent PM 的洞察

> 1. **"对等抽象"是薄名字、厚差异，且这层诚实是刻意的。** runtime 只是一个两值字符串，但 claude 是进程内 SDK（append-only jsonl）、codex 是常驻子进程 + JSON-RPC，导致同名操作（undo/model/compact/token 会计）在时序和语义上分叉。抽象层不强行抹平，而是在命令层用 `runtime === "claude"` 分支显式处理——对可维护性是诚实取舍，但意味着每加一个 runtime，history-control 类命令都要补分支。这正是领起结论"薄名字、厚差异、诚实路由"的落点。

> 2. **undo 的"延迟 fork vs 同步 rollback"是能力边界的直接投影。** Claude 会话 append-only，撤销只能"算 cutoff → 下次 drain fork 新 session"，必然延迟且换 session id（`sessionIdChanged:true`）；Codex 原生 `thread/rollback` 可原地同步撤销（`sessionIdChanged:false`）。设计撤销/回滚体验须预期不同后端在"何时生效、session 是否连续"上根本不同，不能承诺统一体验。

> 3. **显式声明的 runtime 不做可用性门控，是刻意的失败前移。** `T.runtime==="codex"` 直接返回（`71503`）不检查登录，而 channel 派生的 codex 才门控 `(await l()).ok`。好处是"用户/actor 明确要 codex 就不静默降级到 claude"，代价是未登录会在 drain 时才炸（partition 路径则显式发 `runtime_unavailable`）。这是"尊重显式意图 > 自动兜底"的产品价值排序。

> 4. **一套指令喂两个后端，靠 CLAUDE.md → AGENTS.md symlink + protocol 分桶复用溯源。** codex 启动自动 symlink（`OU`，`57318`），token 会计按 protocol 分桶归位（`35020`）——多后端框架若想避免"每个后端各维护一份指令/一套溯源"，这是低成本落地范式。§1 已确证 Claude/Codex *共用 `ZE` 装配器*（codex 只多套 `<aladuo:system-context>` 壳）：即"装配面共用、执行/命令面分叉"——本节只讲执行异，装配同见 §1。

> 5. **认证来源用 `claude_code_local` 短路，把"本地已登录的 Claude Code"当默认路径**，避免误注入第三方 endpoint env；`compatible_endpoint` 显式承担 wire-format 风险。把"官方本地登录 / 官方 API key / 兼容第三方端点"三态显式建模，比一个布尔"是否自建 endpoint"更能精准分派行为与错误提示。

> 6. **可借鉴的三段式解耦：探测可注入、选择可单测、adapter 可替换。** 可用性探测两侧对称留缝——claude `__setClaudeVerifierForTest`（`48183`，清 `ec`/`Vl` 缓存）、codex `__setCodexAvailabilityForTests`（`57233`）；运行时选择（`p`/`v`）与 adapter 经 `codexAvailability`/`codexAdapterFactory` 依赖注入（`71498`）。探测被 `ec` 结果缓存 + `Vl` in-flight promise 双重去重（`48138-48162`），故 `available_runtimes` 不会阻塞或重复拉起验证器——多后端 agent 框架值得照搬。

> 7. **权限与工具/thinking 可见性故意不对等，PM/安全视角须显式区分。** codex 有沙箱枚举（`ALADUO_CODEX_SANDBOX`，默认 workspace-write）+ 固定 `approvalPolicy:"never"` + reasoning 流退订开关（`optOutNotificationMethods`），claude 侧无对应物；反过来 claude 侧 v0.5.10 把工具面从 denylist 翻成 allowlist（`CLAUDE_CORE_TOOLS` + channel `claude.tools`），并新增 v0.6.0 的 `/effort` 每会话推理力度。跨后端不要假设"同样的安全边界、工具白名单与推理可观测性"。

---

# 第三部分 · 可信之源：先落日志，再执行 / 入队

> **关键句**：可信来自一条铁律。Spine 的 append-before-execute 把所有状态变成可从日志


---
## §4 Spine / WAL / 事件溯源

**Spine 是 duoduo 唯一的真理之源：一个纯文件 JSONL 预写日志，以「事件先原子 append 再写 mailbox 指针」的 append-before-execute 契约，把所有会话状态、去重、消费进度都变成崩溃后可从「日志 + 指针」精确重建的派生视图——零数据库，顺序靠单进程 promise 链，去重是尽力而为的近似幂等。**

一切都从这条日志派生：会话状态、去重表、消费进度、status，都不是权威数据，而是可丢弃、可从 `var/events/YYYY-MM-DD.jsonl`（按 UTC 日期分区，`mk(e)` 用 `toISOString().slice(0,10)` 切日，`daemon.pretty.js:30656`）加索引重放出来的物化视图。下面四个论点分别回答：**写怎么保证不丢（写路径）、重复怎么处理（去重）、崩溃后怎么读回来（读路径与恢复）、外部怎么观测（读接口与事件全集）**。

### 论点一 · 写路径：先落 WAL、再写指针，且每条事件是「WAL 行 + by_id 索引 +（有 session_key 才）by_session 索引」的原子单元

**所以呢**：因为持久化严格早于任何副作用，崩溃后未处理的工作永远能从「mailbox 里的 `- [ ] @evt(id)` 指针 + WAL 行」精确恢复；而单条 append 其实是三次协同写入，`Oa`/`ml` 等下游读路径都隐式依赖索引已落盘，构成 `append → 索引 → watermark` 的固定依赖链。

**append-before-execute 的时序在代码里真的这样串联（confirmed）。** 沿网关摄入主函数 `Cne`(`75471`) 的真实控制流：`nn` 封装事件(`75473`)→`rn(e,r)` 把不可变事件 append 进 Spine(`75546`)→`Oa`/`Ca` 推进 watermark 与 status→**之后**才在路由分支写 mailbox 指针（meta 分支 `Ho(...)` `75571`，session 分支 `75581`）。路由分叉由 `Ene`(`75331`) 决策：`routing_hint.target ∈ {gateway, meta, session}` 决定指针写到 `meta:subconscious` 还是具体 session_key。

**存在第二条同构摄入源 `route.deliver`（会话间路由投递，confirmed）。** 会话→会话的路由投递走 `route.deliver` 全链(`49030-49099`)：先 `rn(e,m)` append(`49073`)，后 `Ho(e,u,\`- [ ] @evt(${m.id})\`)` 写指针(`49093`)，且入口带 `ro()` archived 检查短路。它与 `Cne` 是「先 append 后写指针」的同一契约，是 §4 应认清的第二类摄入源。

**单条 append = 两写或三写原子单元（confirmed；by_session 有条件）。** `atomicAppendEvent (rn)`(`30701`) 内部先 `atomicWriteFileSync (d2e)`(`30666`) 写 WAL 行，再**无条件**写 `by_id` 索引（`f2e`，`30692` 定义/`30703` 调用），最后**仅当事件带 `session_key`** 才写 `by_session` 索引（`t.session_key && GQ(...)`，`GQ` `30721` 定义/`30708` 调用，含 `session_key`+`ts`）。因此无 session_key 的事件（如 `system.cadence_tick`）是「WAL + by_id」两写；带 session_key 的会话事件才是三写。三者对应磁盘 append 与内存 Map 的同步更新——`advanceConsumerWatermark (Oa)` 反查偏移、`readEventByIdSeek (ml)` 随机读都**强依赖 by_id 已写入**，这就是 `append → 索引 → watermark` 的隐式依赖链。

**字节区间与全序（confirmed）。** `d2e()` 执行 `fk.open(i,"a")`(`30673`)→`stat().size` 取 **byte_offset**(`30675`，stat 早于 write)→`write().bytesWritten` 取 **byte_len**(`30676`)→`close`(`30684`)，故 `[offset, offset+len)` 恰为该事件行字节区间。全序由 per-file promise 链保证（应用层互斥，非 fsync/DB 事务）：`c2e`(`30646`) `.then(t,t)` 两回调相同，成功失败都续链，同一分区 append 顺序与偏移计算无竞态。**架构假设**：单 daemon 单进程写；跨进程并发写同一分区无保护。

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| 网关摄入先 append 后写指针 | `Cne`：`rn`(75546)→`Oa/Ca`→分支写 `- [ ] @evt(id)`(75571/75581) | daemon 75471-75600 | confirmed |
| route.deliver 同构（含 archived 短路） | `rn`(49073)→`Ho(...@evt)`(49093)，`ro()` 短路 | daemon 49030-49099 | confirmed |
| 路由分叉由 Ene 决策 | `routing_hint.target ∈ {gateway,meta,session}` | daemon 75331 | confirmed |
| 单 append = WAL+by_id（无条件）+by_session（**仅当 session_key**）| `rn`→`d2e`；`f2e`(30703) 无条件 / `t.session_key && GQ`(30708) | daemon 30692/30721 | confirmed |
| byte_offset=写前 stat().size，byte_len=bytesWritten | open→stat→write→close | daemon 30666-30684 | confirmed |
| 全序=per-file promise 链 | `c2e` `.then(t,t)` | daemon 30646 | confirmed |
| UTC 日切分区 | `mk(e)` `toISOString().slice(0,10)` | daemon 30656 | confirmed |

### 论点二 · 去重：时间桶 + 内容哈希的近似幂等，命中即幂等重放而非静默丢弃

**所以呢**：去重是「尽力而为」而非严格幂等——它给重复输入回放上一次的网关回执（对渠道体验友好），但内存表满即整表清空会短时丢失去重能力，对副作用敏感的场景不能把它当幂等键。

**三档 key：`channel.command` 仅在无 source_id 时免疫去重（confirmed）。** `hX()`(`75173`，默认窗口 `t=5` min) 按优先级产 key，`<source.kind>` 为前缀。关键点：`channel.command→null` 的判断在 **source_id 档之后**——`75501` 无条件从 `t.dedupSourceId` 写 `dedup.source_id`（不区分 eventType），故带 `dedup.source_id` 的 command 仍会在优先级 1 命中去重。准确表述是「**无 source_id 的 channel.command 永不去重**」。

| 优先级 | 条件 | key 形态 | 行号 |
|---|---|---|---|
| 1 | 有 `dedup.source_id` | `<kind>:<source_id>` | 75176 |
| —（在 1 之后判定）| `type==='channel.command'` 且无 source_id | `null`（不去重）| 75177 |
| 2 | 有 `dedup.hash` | `<kind>:hash:<hash>:<bucket>` | 75178-75180 |
| 3 | 有 `payload.text` | `<kind>:text:<sha256>:<bucket>` | 75182-75185 |

时间桶 `bucket = floor(getTime()/(t*60000))` = `floor(epoch_ms/300000)`（`mX`, `75190`）。活体印证 key 形态 `stdio:text:<sha256>:5942938`，bucket `5942938×300000ms ≈ 2026-07-01T04:50:00Z`，与其 `ts=04:51:51` 同桶。

**命中即幂等重放（confirmed）。** `Cne` 重复分支(`75518`)：`p.duplicate && p.existing?.event_id` → `ml(e, p.existing.event_id)`(`75519`) 取回原事件 → `Kf(e, f.id)`(`75521`) 反查该事件上次生成的 gateway outbox 记录 → 返回 `{deduplicated:true, gatewayResponse:m?.payload.text, gatewayOutboxId:m?.id, routing.enqueued:false}`。`Kf`(`34289`) 按 event_id 反查 outbox（`xHe` 索引→`Jo`，回退 `Gf.find` `in_reply_to_event_id`）。**不重写 mailbox、`enqueued:false`** 均确认——把完整网关回执重放给渠道，这是「去重即幂等重放」的产品语义。

**满即整表 clear（confirmed，真实近似幂等风险）。** 去重存储 `Sk`(`75126`)：`maxEntries = n.maxEntries ?? 1e4`(`75131`)，`record()` 中 `entries.size >= maxEntries && entries.clear()`(`75155`)——**满即整表清空（非 LRU）**。磁盘日志经 `WHe`(`75325`) = `registryDir/dedup.jsonl`(`75326`) 仍增长但 clear 后不再 load，故短时间内旧 key 去重能力真的会丢失；`by_id` 不参与 dedup 判定。活体确认路径 `/home/linewalker/.aladuo/var/registry/dedup.jsonl`。

### 论点三 · 读路径与恢复：索引随机读 + 消费者 watermark + rehydrate，把「日志 + 指针」还原成活会话

**所以呢**：正因为写侧同时落了索引，读侧才能 O(1) 随机读、消费者才能续跑、进程重启才能从文件重建活会话集——这是「派生视图可重建」这条塔尖结论的兑现方式。

**索引与随机读（confirmed）。** 两个 append-only 索引懒加载入内存 Map 并随 append 增量更新：`by_id.jsonl` `{event_id, partition, byte_offset, byte_len}`(`30704-30707`) 支撑 `ml()` 随机读 `read(o,0,n.byte_len,n.byte_offset)`(`30742`)；`by_session.jsonl` 追加 `session_key`+`ts`(`30709-30714`)，同 key 累积成 list。首次访问由 `h2e`(`30756`)/`g2e`(`30766`) 整文件流式 load 进 Map，之后随 append 增量更新——**这正是「随机读 O(1)」的前提**。解析失败回退整文件顺扫 `_2e`(`30807`，调用点 `30750`)。指针化的价值：mailbox 只存 `@evt(id)` 不存正文，避免正文双写与漂移。

**消费者 watermark（confirmed）。** `Oa()`(`31524`) 先 `u1(e,n)`(`31525`) 经 by_id 反查偏移，再 `Z2e` 写 `run/queue_offsets/<consumer>.json`，字段 `{updated_at, partition, byte_offset, last_event_id}`（活体 `jobs.json` 逐字段吻合）。全部 `Oa()` 调用点仅 6 处，对应三个消费者：

| consumer | 触发点 | 语义 | 置信 |
|---|---|---|---|
| `gateway` | 75546 | **网关摄入管线(`Cne`)的高水位，对每一条经 `Cne` 摄入的事件在路由前无条件推进**，覆盖全部摄入事件；非「仅 gateway-targeted 同步不入队」| confirmed |
| `jobs` | 74799 | **由每次 cadence 扫 due-job 的 `system.cadence_tick` 事件推进**（`74799` 位于 cadence_tick 主体 `nhe`/job 扫描 `74754-74799` 内，事件类型 `system.cadence_tick` `74790`）；非「由 `job.spawn/complete/fail` 推进」| confirmed |
| `meta_session` | 74295/74446/74470/74583 | 由潜意识/meta partition 事件推进 | confirmed |

  - jobs 的决定性活体证据：`jobs.json` 的 `last_event_id=evt_7e3d…` 在 events 文件里正是 `{"type":"system.cadence_tick",…count:0}`。job 到期扫描本身就是 cadence 循环的一环，故 jobs watermark 挂在 cadence tick 上。
  - gateway 的活体证据：`gateway.json` 的 `last_event_id` 指向一条 `channel.message`（普通摄入事件，非 gateway-targeted 专有）。

**持久化分层（confirmed）。** 消费者进度放**易失 `run/`**（`runQueueOffsetsDir`, `V2e` `31519`；重启可从 WAL 重建），会话游标/state 放**持久 `var/`**（`sessionsDir`；会话身份必须跨重启）。活体 `run/queue_offsets/{gateway,jobs,meta_session}.json` 三消费者齐全——这是「运行时进度 vs 实体身份」的干净范式。

**rehydrate（confirmed，一处未证实）。** `nX()`(`31020`) readdir `sessionsDir` → 逐个读 `<hash>/state.json` 的 `session_key`(`31034`) 重建活跃会话集。自愈写回：缺 `session_key` 时遍历 `registrySessionsDir`(`31040`)、`decodeURIComponent`(`31043`)、`Gi(c)===目录名`(`31044`) 反解，**写回 state.json 在 `31046-31050`**。resume 失败 append `agent.error{stage:'resume'}`(`60561`, `source.kind='runner'`) 留痕。state.json 的 `schema_version:2` 本轮未在调用链独立复核——**标未证实推测**。

### 论点四 · 读接口与事件全集：spine.tail 尾读 + 十一类落库事件

**所以呢**：外部只能通过 `spine.tail` 观测这条日志，且并非所有 RPC/bus 事件都会落库——只有经 `nn`+`rn` 构造的才是 Spine 权威事件，这条边界决定了「真理之源」到底包含什么。

**spine.tail 尾读（confirmed，活体已验证）。** `Ace()`(`77104`)：`limit = clamp(t?.limit ?? 200, 1, 500)`(`77105`)。无 `after_id` → 尾取 N 条 + `has_more = h>0`(`77110-77115`)；有 `after_id` → 当日 `findIndex` 游标之后(`77117`)，未命中则 `setUTCDate(-1)` 回退前一日分区拼接 `[...prev.slice(f+1), ...a]`(`77128-77135`)。活体 `spine.tail limit:3` 现返回 `agent.tool_use/agent.tool_result`（`source.kind=meta`, `name=subconscious:memory-committer`, `session_key=meta:subconscious`）——**此为取样示例，返回何种事件取决于探测时点**（原文「3×system.cadence_tick」同理只是彼时取样）。

**事件类型全集（含 `route.deliver`）。** 经 `nn` 封装并 `rn` 落库的合法 Spine 事件：

```
channel.message / channel.command / channel.attached
agent.result / agent.error / agent.tool_use / agent.tool_result
job.spawn / job.complete / job.fail
system.cadence_tick
route.deliver                                 ← 会话→会话路由投递，rn(49073)
```

`GROUND_TRUTH` 中的 `channel.ack/ingress/pull/spawn/describe`、`session.*`、`job.completed/spawned` 等**未见** `nn`+`rn` 构造点，属 RPC/bus 而非 Spine 落库，原文正确地未纳入。潜意识产出**复用** `agent.result`：`source.kind=meta`, `name=subconscious:<partition>`(`74435`), `payload.tick_type='subconscious'`(`74440`)，活体亦印证。

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| spine.tail limit clamp [1,500] 默认 200 | `Ace` `clamp(...??200,1,500)` | daemon 77105 | confirmed |
| after_id 未命中回退前一日 | `setUTCDate(-1)` + 拼接 | daemon 77128-77135 | confirmed |
| 落库事件含 route.deliver | `nn`+`rn(49073)` | daemon 49058/49073 | confirmed |
| 潜意识复用 agent.result | `tick_type:'subconscious'` | daemon 74435/74440 | confirmed |

> **给 Agent PM 的洞察**
> - **真理之源 = 纯文件 JSONL WAL，零数据库依赖**：所有派生态（会话状态/去重/消费进度/status）都可从「日志 + 指针」重建，极简、天然可审计、git-friendly——这正是本节塔尖结论的运营含义。
> - **append-before-execute 是可靠性契约的基石，且有两条摄入源**：网关摄入（`Cne`）与会话间路由（`route.deliver`）都遵守「先原子 append、再写 `- [ ] @evt(id)` 指针」；崩溃后从「mailbox 指针 + WAL」精确恢复未处理工作，mailbox 只存指针不存正文。
> - **单条 append 是两写或三写原子单元**：WAL 行 + by_id（无条件）+ by_session（仅当带 session_key），下游 watermark 反查与随机读强依赖索引已落盘；要横向扩展写侧，必须同时打破「单进程 promise 链保序」与「索引同步」两个假设。
> - **去重是尽力而为、命中即幂等重放**：5 min 时间桶 + 内容哈希，无 `source_id` 的 `channel.command` 永不去重；命中回放上次网关回执（`deduplicated:true`, `enqueued:false`），但内存 Map 满即整表 clear 会短暂丢失去重能力——对重复副作用敏感的场景，产品侧需知这不是幂等键。
> - **watermark 语义要看清挂点**：`jobs` 游标挂在 `system.cadence_tick`（因 due-job 扫描是 cadence 一环），`gateway` 是整条摄入管线的高水位而非「目标同步」标记——误读会导致对「谁消费到哪」的错误运维假设。
> - **持久化分层（run/ 可重建 vs var/ 必须留存）** 是区分「运行时进度」与「实体身份」的干净范式；UTC 日切分区同时是潜意识 scan-gap「做梦」的工作单元，日志分区即时间盒。


---
## §5 Gateway 边界 / RPC / 通道协议

**Gateway 是 daemon 唯一的 loopback 单端口控制面：它把所有外部输入收敛为 if/else 分发的 JSON-RPC，入站即按斜杠命令 / intent 分流（gateway 内联短路 / session 唤醒 / meta 潜意识），并以「先落 spine 日志 → 再追加 Markdown 邮箱 → 最后 emit `session.wake`」的 WAL-before-enqueue 时序保证崩溃可重放，对外用零依赖 protocol 契约同时支持 HTTP 拉（drain）与 WS 推（订阅 + backlog 回放）两种通道形态——它是整个 agent「输入可靠化与是否动用模型」的边界闸门。**

下面四个论点自上而下支撑这句结论：控制面的**形态**（单端口 if/else）→ 入站的**分流闸门**（能不进模型就不进）→ 可靠性的**时序契约**（WAL-before-enqueue）→ 对外的**双通道数据面 + 契约包**。

---

### 论点 1 · 单端口 loopback 控制面：一个 fastify 实例 + 一条 if/else 分发链

**所以呢**：整个 daemon 对外只有一个可确定的物理边界——一个绑在 `127.0.0.1` 的端口、一条巨型 if/else 链。没有服务发现、没有鉴权、没有路由表抽象，安全边界完全押在「本机单用户」假设上。这让控制面极易审计，也划死了它的产品边界：这是单机自治 runtime，不是可暴露的多租户服务。

- **一个 fastify 实例，只注册 5 个 HTTP 入口。** `GET /healthz`（`Nne()` 返回 `{status:"ok"}`，decl `75612`、注册 `78064`）、`GET /readyz`（就绪探针 `Ane`，decl `75602`、注册 `78072`）、`GET /dashboard`（把 `bootstrapDir/dashboard.html` 作为静态文件读出，读不到 catch 回 404，非在线渲染，`78064-78071`）、`POST /rpc`（`78536`）、`GET /ws`（fastify-websocket，包在 `t.register(async function(h){…})` 内以 `h.get("/ws",{websocket:!0})` 注册，`78543-78545`）。监听 `ALADUO_PORT ?? PORT ?? 20233`、host `ALADUO_DAEMON_HOST ?? "127.0.0.1"`（`78796-78797`）。活体 `:20233/healthz → {"status":"ok"}`。
  - **`readyz` 语义要点**：`Ane`（`75602`）实为「能否 append 到 events 日志文件」的探针（`(await VHe.open(eventsDir/<day>.jsonl,"a")).close()`），未就绪回 `503 not_ready`（`78075`）——它探的是 spine 写入能力，而非泛化的「服务活着」。
  - **20234 / save-api 不存在于本 build**：三份代码 grep `20234|save-api|save_api` 皆空、活体 `curl :20234` 无 HTTP 响应（升格为**已证实**，非推测）。

- **RPC「注册表」实为一条巨型 if/else 链，不是 Map。** 所有方法在同一个 `async function m(h, _)`（起于 `78078`）内按 `h.method` 字符串逐个分派，`_` 携带 WS 上下文（`wsSubscriberId`）。链上分发的**远不止 channel.\* 方法**，而是全套 handler：`system.shutdown`（`78143`，链首）、`system.runtime.info`（`78146`）、`session.archive/list/set_alias/notify/compact`（`78165-78181`）、`channel.file.upload/download`（`78285/78293`，活体 `channel.file.upload → -32602` 证明 handler 存在）、`channel.ingress/command/pull/ack`（`78193/78242/78300/78333`）、`job.create/get/list`（`78367/78391/78415`）、`usage.get`（`78428`）、`system.status`（`78459`）、`system.config`（`78509`）、`spine.tail`（`78512`）。**只有真正未匹配的方法才落链尾 `-32601 Method not found`**（`78521-78522`；活体 `bogus.method → {"code":-32601}` 复现）。

- **请求体守卫 `S_` = protocol 的 `isJsonRpcRequest`。** `S_`（`75970-75973`）：`t.jsonrpc==="2.0" && typeof t.method==="string"`（另含 object 判空）。`POST /rpc` 未过守卫直接 `400`（`78538`）。**WS 侧同用 `S_`，但未过回的是 JSON-RPC `-32600 Invalid Request`（`78593-78599`），不是 HTTP 400**——两条传输的失败形态不同。入参校验用 protocol 导出的 `isXxxParams` 守卫（如 channel.pull 的 `Up`），失败抛 `vn("Invalid params")` → `-32602`；未捕获异常统一 `-32603 Internal error`。

- **`system.shutdown` 能直接自杀。** `/rpc`（`78542-78543`）与 WS（`78683-78684`）均 `__triggerShutdown → setImmediate(()=>process.kill(process.pid,"SIGTERM"))`。控制面自带「关掉我自己」的能力，进一步印证其单机信任模型。

---

### 论点 2 · 入站即分流闸门：斜杠命令 / intent 决定「要不要动用模型」

**所以呢**：这是本节最值得抄的一条。routing target 三态（`gateway` / `meta` / `session`）在**入站边界**就决定一条消息要不要真正唤醒一个 agent。`/status /config /model /effort /debug` 这类命令在网关层被内联短路、根本不进模型；只有带内容的消息才唤醒 session。对话式 agent 想省 token，这就是「入站即分流、能不进模型就不进」的实现样板。

- **真正的 target 决策在入口 wrapper `One` → `JHe`，不在 `Cne` 内。** handler 收到 channel.ingress/command 后，先由 `One`（message，`75418`）/ `fy`（command，`75443`）做**斜杠命令解析**再调 `Cne`——`One` 里 `ej(t.text)` 判斜杠命令、`Wk` 取命令名、`tj` 判 intent，再喂 `JHe`（`75412`）裁 target：带参内容 → `session`，`status/config/debug` 类 intent 或纯命令 → `gateway`（内联短路、不进模型），`history-control` 类（`/compact /clear /undo`）→ `session`。这一层命令预处理是「洞察 #5」的真实机制所在。网关命令清单常量 `Tne`（`75341`）已含 v0.6.0 新增的 `/effort`（每会话推理力度开关，intent 归类为 `config`→gateway，`75407`，内联处理落 `GHe@75869`）与 `/model`；v0.6.0 移除 `container` 模式后 `/cd` 已从 daemon 完全消失、`navigate` intent 随之退役。
- **`Ene` 只是读取器，不是决策器。** `Ene`（`75331`）仅 `return routing_hint.target ∈ {gateway,meta,session} ? … : "session"`——它读回 `JHe` 已写进 `routing_hint` 的结果。`Cne` 内 `d = Ene(r)`（**落点 `75558`**）据此分三路。
- **三路的落地形态**：`gateway` → `GHe`（`75560`）内联应答，返回 responseText/outboxId 并 log `[gateway] gateway-targeted event (no enqueue)`，**完全不入队、不唤醒**；`meta` → 写 mailbox key `"meta:subconscious"`（`75569`）；`session` → 写 `t.sessionKey` 的 mailbox（`75581`）。
- **channel.ingress 的入站守卫**：`fr(g.session_key)` 命中归档中 → `-32011`（`78196-78197`）；workspace 不可用 → `-32010, message:k.guidance`（`78210-78212`）。`source_kind` 缺省按传输层推断 `g.source_kind ?? (_?.wsSubscriberId ? "ws" : "rpc")`（`78200`）。

---

### 论点 3 · WAL-before-enqueue：先落盘、后入队、最后唤醒，崩溃可重放

**所以呢**：可靠性不靠队列中间件，而靠一条铁律——事件先原子 append 进 spine 日志，才追加进 mailbox，才 emit 唤醒。任何一步崩溃都能从「spine log + mailbox 指针」精确复原。代价是「队列」就是纯 Markdown 文件，吞吐/并发靠文件锁与内存索引兜底。

- **精确落点在 `Cne`（gateway 入站规范化，`75471`）。** 顺序：`nn()` 构造 spine 事件（`75473`）→ 幂等去重 `checkAndRecordDetailed`（`75513`；命中则复用既有事件、`enqueued:!1`，经 `Kf` 反查既有 outbox 回填 `gatewayResponse/gatewayOutboxId` 原样返回，即「去重即重放上次回执」，`75519-75533`）→ `QHe` 把原始 payload 持久化为 `raw_path`（`75535`）→ **`await rn(e, r)` 把事件 append 进 spine 事件日志（这是 WAL，`75546`）** → `Oa` 推进 gateway 消费水位（`75546`）→ `d = Ene(r)` 决定 routing target（`75558`）→ 只有 session/meta 目标才 `Ho(…,"- [ ] @evt(<id>)")` 追加进 mailbox（enqueue，`75581/75571`）→ 最后 `n?.bus && n.bus.emit("spine.event", r)`（`75591`，**emit 受 `n?.bus` 守卫：未注入 bus 时不广播**）。
- **`session.wake` 不在 `Cne` 内**，而由**调用方**在 `routing.enqueued` 为真时 emit：channel.ingress（`78233`）、channel.command（`78277`）、gateway 触发的 `/compact` 调用方（session.compact `77762`、idle-compact `76467`）。即「先事件落盘 → 后入队 → 最后由调用方唤醒」。
- **channel.ack 是双路径游标提交**（`78333-78366`）：按 `:` 前缀 channel 反查 `Jo`/`ene` 走一路；否则直接 `Ts` 查记录、必要时 `qk` 重建后经 `Eae`/`Gz` 提交投递游标——含 `-32602 Invalid cursor` 游标校验分支与 `-32002` 归档中守卫（`fr(g.session_key)`）。它不只是「置 sent」，而是带校验与归档态的游标推进。

---

### 论点 4 · 对外双通道数据面 + 零依赖契约包：HTTP 拉（drain）vs WS 推（订阅 + backlog 回放）

**所以呢**：同一个 `channel.pull` 方法对简单适配器（只 poll HTTP）和富客户端（订阅长连流）各取所需，而两端共享同一个随包发布的编译期契约，杜绝手抄漂移——这是想做 Agent 平台化的解耦支点。**关键更正**：RPC 才是 drain，WS 根本不 drain。

- **RPC 形态 = drain，且门控于 `return_mask` 含 `"final"`。** `E = k.includes("final")`（`78305`）；`R = E ? await Kz({… limit: g.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50) …}) : []`（`78320/78324`），返回 `records / next_cursor(R[last].id) / idle(R.length===0)`（`78327-78332`）。不含 `final` 则 records 恒为空。
- **WS 形态 = 打开持久订阅 +（含 `final`）回放 backlog，records 不在 RPC result 里返回。** WS 上下文里 channel.pull **直接短路、根本不 drain**：`if(_?.wsSubscriberId) return await Oet({…}), v.result={opened:!0, …}, v`（`78307-78319`）——不调 `Kz`、result 里无 records。真正的排空在 WS 外层 message handler：`I.result && !I.error` 后 `c.subscribe`（`78619`）打开订阅，再由 `Tae`（decl `76955`）以 `session.output` 通知形式回放 outbox backlog（`78659`）。**`Kz` drain 仅 RPC 路径独有**。
- **replay 窗口去重**：`ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0`（`78649`），期间用 `g = new Set` 抑制重复（`suppressed duplicate output during replay window`，`78626`）；`onDelivered` 推进游标 `Jz`、`Rl` 标 sent、`Yf` 写 `.sent_ids`（`78660-78665`）。WS 送信器 `k(R, $=!0)`（`78561-78576`）正常推 `session.output` 时若 `$` 且有 consumerId 则 `Jz` 推进投递游标；replay 期用 `k(Nt,!1)` 关闭该副作用、改由 `onDelivered` 推进——这是「replay 不重复推进游标」的关键。
- **订阅注册表 `Vz`（`76549`）做 sessionKey→订阅者扇出。** `Map<sessionKey,Set<id>>` + `Map<id,subscriber>`，按每订阅者 `returnMask`（默认 `["final","stream"]`，`76554`）过滤：`final`→`session.output`（`76562`）、`stream`→`session.stream`（`76589`）、`tool`→`session.execution`（`76614`）、`stream_end`（`76637`）；发送异常自动摘除订阅者。`returnMask` 值域校验器是 `M2`（`77302`：`final|stream|stream_end|tool`，空回退 `["final","stream"]`），默认掩码常量在 `Vz@76554`。
- **stream_end reason 能力降级契约**：`Vz` 内 `m==="interrupted" || v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`76638`），与 WS 订阅透传 `acceptStreamEndReasons`（`78621`）一致——daemon 按消费者声明的能力把不认识的 reason 降级为 `"interrupted"`，老插件优雅退化。
- **零依赖契约包 `@openduo/protocol@0.6.0`**（`"dependencies":{}`、`"main":"src/index.ts"`，源码 `.ts` 随包发布，位于 `@openduo/duoduo/node_modules/@openduo/protocol/src/`）：`rpc.ts` 信封与守卫、`channel.ts` 全部 params + 校验器 + `outboxToOutbound`、`outbox.ts` `OutboxRecord`/`TurnMeta`、`notifications.ts` 4 种下推、`channel-binding.ts` `ChannelType`。通道插件以 npm tarball 安装（`cli.pretty.js`：`mkdtemp aladuo-channel-plugin-`、`tar -xzf`、`package.installing` 标记）。
- **outbox 落盘**：id `obx_${randomUUID()}`（`34179`），路径 `join(outboxDir, t, `${n}.json`)`（`34183`）；双索引 `by_event.jsonl`（`34328`）/`by_id.jsonl`（`34426`）+ `.sent_ids`（`34332`）+ `replay/`（`34407`）+ `.pending_queue.jsonl`（`34747`）。

---

### 证据表

| 机制主张 | 证据（字面量/片段） | 位置 | 置信 |
|---|---|---|---|
| fastify 单端口网关，注册 healthz/readyz/dashboard/rpc/ws | `t.get("/healthz"…Nne())`, `t.get("/dashboard"…)`, `t.get("/readyz"…Ane)`, `/rpc`, `h.get("/ws",{websocket:!0}…)` | daemon:78064-78075/78536/78543 | confirmed |
| readyz 探针 Ane = 能否 append events 日志，否则 503 not_ready | `await Ane(n) ? {status:"ok"} : _.code(503).send({status:"not_ready"})` | daemon:75602/78072-78075 | confirmed |
| 端口默认 20233、host 127.0.0.1 | `Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233)`；`ALADUO_DAEMON_HOST ?? "127.0.0.1"` | daemon:78796-78797 | confirmed |
| RPC 是 if/else 链而非 Map；链含 system./session./job./usage./spine./channel.* 全套 handler；仅未匹配 →-32601 | `async function m(h,_)` 起 78078；`system.runtime.info`/`session.*`/`job.*`/`usage.get`/`spine.tail`/`channel.file.upload`；链尾 `-32601` + 活体 `bogus.method→-32601` | daemon:78078/78146/78165/78285/78367/78428/78512/78521-78522 | confirmed |
| 请求体守卫 S_ = isJsonRpcRequest；/rpc 未过 400，WS 未过 -32600 | `S_`：`t.jsonrpc==="2.0" && typeof t.method=="string"`；活体 `{"method":"x"}→400` | daemon:75970-75973 / 78538 / 78593-78599 | confirmed |
| WAL：事件先 append 再入队 | `await rn(e,r)`（append 事件日志，75546）在 `Ho(…,"- [ ] @evt(…)")` 入队之前 | daemon:75546 / 75571/75581 | confirmed |
| routing target 决策在 One→JHe（斜杠命令/intent），Ene 仅读取器 | `JHe`：intent status/config/debug 或纯命令 →gateway、history-control →session；`Ene` return target∈{…}?…:"session" | daemon:75412 / 75331 | confirmed |
| Cne 内 Ene 落点 + spine.event emit | `d=Ene(r)`（75558）；`bus.emit("spine.event",r)`（75591） | daemon:75558 / 75591 | confirmed |
| session.wake 由调用方按 routing.enqueued 触发（非 Cne 内） | `X.routing.enqueued && emit("session.wake"…)` | daemon:77762 / 78233 / 78277 | confirmed |
| gateway 目标事件内联应答、不入队 | `[gateway] gateway-targeted event (no enqueue)`；meta 写 `"meta:subconscious"` | daemon:75560-75569 | confirmed |
| protocol 零依赖契约包，源码随包发布（嵌套路径） | `"dependencies":{}`、`"main":"src/index.ts"`；`ChannelRpcMethods = describe｜spawn｜ingress｜command｜pull｜ack` | @openduo/duoduo/node_modules/@openduo/protocol@0.6.0/src/{channel,rpc}.ts | confirmed |
| channel.ingress：archiving 守卫 -32011、workspace 守卫 -32010 | `code:-32011`（`fr(g.session_key)`）；`code:-32010,message:k.guidance` | daemon:78196-78212 | confirmed |
| source_kind 缺省按传输层推断 | `g.source_kind ?? (_?.wsSubscriberId?"ws":"rpc")` | daemon:78200 | confirmed |
| channel.pull RPC = drain，门控 return_mask 含 "final" | `E=k.includes("final")`；`R=E?await Kz({… limit… ??50}):[]`；返回 records/next_cursor/idle | daemon:78305/78320/78324/78327-78332 | confirmed |
| channel.pull WS = 打开持久订阅 + backlog 回放，不 drain、records 不在 result | `if(_?.wsSubscriberId) return await Oet(…), v.result={opened:!0,…}`（无 records）；外层 `c.subscribe`；`Tae` 回放 backlog | daemon:78307-78319 / 78619 / 78659 | confirmed |
| channel.pull replay 窗口去重 + 游标推进 | `ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0`；`suppressed duplicate output during replay window`；`onDelivered`→Jz/Rl/Yf | daemon:78649 / 78626 / 78660-78665 | confirmed |
| channel.ack 双路径提交 + -32602 invalid cursor / -32002 归档 | `:` 前缀反查 `Jo`/`ene` 一路；`Ts`+`qk`+`Eae`/`Gz` 一路；游标校验 -32602、归档 -32002 | daemon:78333-78366 | confirmed |
| outbox 落盘 `<kind>/<id>.json`，id=obx_<uuid> | `obx_${randomUUID()}`（34179）；`join(outboxDir,t,`${n}.json`)`（34183） | daemon:34179 / 34183 | confirmed |
| outbox 双索引 by_event/by_id + .sent_ids + replay + pending_queue | `by_event.jsonl`, `by_id.jsonl`, `.sent_ids`, `replay/`, `.pending_queue.jsonl` | daemon:34328/34332/34407/34426 / 34747 | confirmed |
| 订阅按 returnMask 扇出三类通知 + 异常摘除 | `session.output`(76562)/`session.stream`(76589)/`session.execution`(76614)/`stream_end`(76637)；默认 `["final","stream"]` | daemon:76549-76638 | confirmed |
| returnMask 校验值域 | `M2`：`"final"|"stream"|"stream_end"|"tool"`；空则回退 `["final","stream"]` | daemon:77302 / Vz 默认 76554 | confirmed |
| stream_end reason 降级契约（代码侧落点） | `m==="interrupted"||v.acceptStreamEndReasons?.includes(m)?m:"interrupted"`；WS 透传 `acceptStreamEndReasons` | daemon:76638 / 78621 / protocol channel.ts | confirmed |
| system.shutdown 自杀 | `/rpc` 与 WS 均 `__triggerShutdown` → `setImmediate(()=>process.kill(process.pid,"SIGTERM"))` | daemon:78542-78543 / 78683-78684 | confirmed |
| 20234 save-api 不存在于本 build | grep `20234\|save-api\|save_api` 三文件皆空；活体 `curl :20234 → 000 无响应` | — | confirmed（活体+静态） |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **JSON-RPC 信封**（`rpc.ts`）：请求 `{jsonrpc:"2.0", id?, method, params?}`；响应 `{jsonrpc:"2.0", id, result? | error:{code,message,data?}}`。错误码：`-32700` parse、`-32600` invalid request（WS 守卫失败落此，非 400）、`-32601` method not found、`-32602` invalid params / invalid cursor、`-32603` internal；业务码 `-32010`（workspace 不可用）、`-32011`（**channel.ingress** 归档守卫，`78196`）、`-32002`（**channel.ack** 归档守卫，`78333-78366`；语义同为归档中，挂在不同方法）。

- **RPC 方法清单**（daemon if/else 链 `m(h,_)` 实际分发的全集，非仅 channel.\*）：
  - `system.shutdown`（`78143`，链首，触发自身 SIGTERM）、`system.runtime.info`（`78146`）、`system.status`（`78459`）、`system.config`（`78509`）
  - `session.archive / list / set_alias / notify / compact`（`78165-78181`）
  - `job.create / get / list`（`78367-78415`）
  - `usage.get`（`78428`）、`spine.tail`（`78512`）
  - `channel.describe / spawn / ingress / command / pull / ack`（`ChannelRpcMethods` 联合类型），外加 `channel.file.upload / download`（`78285/78293`）
  - **其余（真正未匹配的方法）落链尾 → `-32601 Method not found`**
  - `outboxToOutbound`（`channel.ts`）为出站记录→通道 outbound 的投影函数（非 RPC 方法，随契约包导出）
  - 注意：`session.wake / spine.event / cadence.tick` 是**总线事件**不是 RPC；`session.output / stream / execution / stream_end` 是**服务端→客户端通知**（`notifications.ts`），仅在 WS 上单向下推

- **`OutboxRecord`**（`outbox.ts`，磁盘 `outboxDir/<channel_kind>/<id>.json`）：`id, idempotency_key, created_at, channel_kind, session_key, in_reply_to_event_id?, routing:{policy:"reply_to_origin"|"reply_override"|"fanout", origin_event_id, origin_session_key, origin_channel_kind, fanout_index, fanout_total}, payload:{text?, attachments[], data?, rendering_hints:{format:"markdown"|"text"|"card", mentions[]}}, stream:{stream_id, seq, is_final}, status:"pending"|"sent"|"failed", attempts, last_attempt_at, last_error`。

- **`TurnMeta`**（`outbox.ts`，投影到 `payload.data.turn_meta`，供通道渲染卡片页脚）：`elapsed_ms, total_input_tokens, output_tokens, cache_hit_rate, total_cost_usd, model, context_used_tokens, protocol:"anthropic"|"codex"`。

- **索引/游标文件**（同 outboxDir）：`index/by_event.jsonl`（event_id→记录，用于 in_reply_to 反查，内存缓存 `M1`）、`index/by_id.jsonl`、`.sent_ids`（已投递集合，内存缓存 `z1`）、`replay/<session_key>.jsonl`、`.pending_queue.jsonl`。

- **channel.ingress params**：`{session_key, display_name?, text?, idempotency_key?, cwd_abs?, attachments[], source_kind?, channel_id?}`；返回 `{event_id, gateway_response, outbox_id}`。`source_kind` 缺省按传输层推断 `wsSubscriberId?"ws":"rpc"`（`78200`）。

- **channel.pull params**：`{session_key, consumer_id, cursor?, limit?, wait_ms?, return_mask:("final"|"stream"|"stream_end"|"tool")[], channel_capabilities:{outbound:{accept_mime[], max_bytes?, accept_stream_end_reasons?[]}}}`。返回形态因传输而异：RPC 回 `{records, next_cursor, idle}`（含 `final` 时）；WS 回 `{opened:true, session_key, consumer_id, cursor, return_mask}`（records 走订阅推送，不在 result 内）。

- **服务端下推通知**（`notifications.ts`）：`session.output{session_key,record}`、`session.stream{session_key,chunk,is_sidechain?}`、`session.execution{session_key,event:(tool_use|thought_chunk|tool_result|tool_input_delta)}`、`session.stream_end{session_key,reason:"interrupted"|"skipped"}`。

- **邮箱入队标记**（enqueue 的物理形式）：向 mailbox 文件追加一行 `- [ ] @evt(<event_id>)`；meta 目标写入 mailbox key `meta:subconscious`。

### 给 Agent PM 的洞察

> 1. **入站即分流，是「输入闸门」而非「消息队列」——这才是本节的塔尖。** routing target 三态（gateway/meta/session）在 `One`→`JHe` 阶段就据斜杠命令 / intent 判定，`/status /config` 类命令直接内联回执、不入队不唤醒，等于在网关层做一次廉价的「是否需要动用模型」短路。对话式 agent 若想省 token，可借鉴这种「入站即分流、能不进模型就不进」的分层——它把「代码守骨架、模型做裁决」的边界物化在了控制面第一跳。

> 2. **WAL-before-enqueue 是可靠性核心，但入队媒介是 Markdown 邮箱文件而非队列中间件。** 事件先 append 进 spine 日志（`rn`）再往 mailbox 追加 `- [ ] @evt(id)`，崩溃可重放；幂等命中时「去重即重放上次回执」（回填 `gatewayResponse/gatewayOutboxId`），语义完整。代价是「队列」就是纯文件，吞吐/并发靠文件锁与内存索引缓存（`M1/z1`）兜底——适合个人级自治 agent，规模化到多租户高并发时这层会成瓶颈。

> 3. **「契约包 + 拉/推双形态」是通道生态的解耦支点，但拉/推语义并不对称。** RPC 是 drain（`Kz` 排空，门控 `final`），WS 是订阅 + backlog 回放（`opened:true` 短路，records 走推送）——同一个 `channel.pull` 让「简单适配器只 poll、富客户端订阅流」各取所需，且共享随包发布的零依赖 `.ts` 契约避免手抄漂移。设计通道协议时，务必写清「同一方法在不同传输上返回形态不同」，否则极易误以为 WS 也 drain。

> 4. **能力协商做了向后兼容的「降级而非报错」。** `accept_stream_end_reasons`/`accept_mime` 让 daemon 按消费者声明的能力下调输出（不认识的 stream_end reason 降级为 `interrupted`，`76638`），新语义对老消费者优雅退化。做长期演进的 agent 协议时，这种「生产者按消费者能力下调输出」比版本号更抗腐蚀。

> 5. **控制面刻意极简、无鉴权、绑定 loopback。** 单端口、if/else 分派、默认 `127.0.0.1`、`/rpc` 无 token 校验——安全边界完全押在「本机单用户」假设上；`system.shutdown` 甚至能直接 `SIGTERM` 自身。作为产品能力边界要清楚：这是单机自治 runtime，不是可暴露的多租户服务。

（相关文件：`daemon.pretty.js:78064-78700`（fastify/RPC/WS）、`75331-75471`（Ene/JHe/One/fy 分流）、`75471-75600`（Cne WAL 入站）、`77762/78233/78277`（session.wake 触发点）、`34179-34430 / 34747`（outbox 落盘与索引）、`76549-76638`（订阅扇出/降级）；`@openduo/duoduo/node_modules/@openduo/protocol/src/{rpc,channel,outbox,notifications,channel-binding}.ts`。）


---

# 第四部分 · 后台自治：靠心跳自我维护而绝不越权

> **关键句**：无人对话时，运行时靠心跳自我维护。潜意识引擎经活动门节流后唤起无状态一次性 LLM 分区会话做维护（§6），记忆系统只做只读测量与软删 GC、一切内容改写交回模型（§7）；机器真正强制的只剩契约门。心跳先转，才有 memory-weaver 加工经验——收束回 §0 的闭环。


---
## §6 Cadence 心跳 / Subconscious 引擎

**潜意识引擎是 duoduo 的"自主神经系统"：一条 37 分钟心跳，经内存指纹活动门节流后，按用户可改写的 playlist 轮流唤起一批无状态一次性 LLM 分区会话做自我维护；全部跨拍状态落在文件，而机器真正强制的边界只剩契约门 `gU` 与分区工具 allowlist（`PARTITION_CORE_TOOLS`）两处。** 这句话统辖本节四个论点：心跳的**节拍与解耦**、潜意识引擎的**三重节流门**、分区的**无状态执行与两级路由**、以及**唯二的机器强制边界**。以下每个论点先给结论，再落 file:line 证据（行号已对齐 beautified v0.6.1，均随活体 daemon 印证）。

---

### 论点 1 · 一条心跳、两级解耦：emit 广播不被维护环阻塞，60s cron 是另一条独立定时器

**所以呢：** duoduo 把"系统自我维护"、"任务调度"、"自主思考"分到不同节拍/不同门，慢的 LLM 会话拖不垮维护与定时作业。它们不是"一个心跳两个环"，而是**两条互不相干的定时器**，且潜意识总线在心跳回调里被最先广播、绕过维护环重入门。

- **37min 心跳**：`let G=yhe("ALADUO_CADENCE_INTERVAL_MS",222e4,1e3)`（`daemon.pretty.js:78826`），env 可覆盖、带 `1e3` 最小 clamp；活体 `duoduo daemon config` → `interval_ms: 37min (2,220,000ms) (default)`。单个 `setInterval` 回调体第一个表达式就是 `f.emit("cadence.tick")`（`78832`），**在 `if(...,K){...skipped...;return}` 重入门之前**；随后 `K=!0; s(d).then(...).finally(()=>K=!1)` 才跑维护环（`s`=runCadenceTick，调用点 `78838`）。故潜意识总线不受维护环 `K` 阻塞。（confirmed）
- **60s job-scheduler 是另一条定时器**：pid0 里 `C=o({paths,sessionManager})`（`78814`）、`C.start()`（`78818`）单独启动（默认间隔 `met=6e4`=60s，`75003`），到期 cron 扫描 `scanAndSpawnDueJobs (j2)`（`74809`）。与 37min 心跳完全解耦，不属维护环。（confirmed）
- **v0.6.1 调度作业建时校验 + 复合时长**：建作业在 `createJob` 内先过校验器 `hce`（`54795`，调用点 `55153`）——空调度、非法 cron（交 `CronExpressionParser.parse`，`54806`）、畸形时长均在**建作业时**抛错拒绝，而非跑时静默失败。时长由复合解析器 `L_`（`54776`）按 `/(\d+)([smhdw])/g` 逐段累加，故 `@in 2h30m` / `@every 1d6h4m` 合法，残串不覆盖整串即 `Invalid duration format`（`54783`）；`WF`（`54787`）再挡"超出可表示时间范围"的超范围延迟。（confirmed。注：ajv 的 `compositeRule` 是无关 vendor 噪声，不在此路径）
- **维护环 `runCadenceTick (det)`（`74771`）顺序**：`await pm(e),await hm(e)`（`74772`）→ `runMemoryCheckTick`（`74776`）→ `sweepTombstonedSessionRecords`（`74781`，try/catch 非致命）→ `mergeCadenceInbox (the)`（`74787`）→ `parseCadenceQueue (nhe)`（`74788`）→ 构造 `type:"system.cadence_tick"`（字面量在 `74790`，`payload.count` 在 `74796`）→ `atomicAppendEvent (rn)` 持久化 + `advanceConsumerWatermark (Oa)` + `Ca(...cadence:{last_tick:r.ts})`（`74799`）。（confirmed）
- **`pm/hm` 是 broadcast lint，`the` 才是队列合并**：`pm`（`59151`）`stat(memoryBroadcastPath)`、`hm`（`59324`）`readFile` → 检测未解析 wiki 链，断链时 `enqueuedLintTask:!0`、日志 `"[memory] CLAUDE.md has unresolved wiki links; queued lint task"`（`59344`）；`mergeCadenceInbox (the)`（`74722`）读 `cadenceInboxDir` 的 `.pending`、`fet(r,i)` 合并进 `cadenceQueuePath`（`74747`）、`74751` unlink 已并文件、返回 `i.length`。（confirmed）
- **（v0.5.10，channel 会话侧的空闲节流）channel 空闲自动 compact**：channel 会话配置新增 `auto_compact_idle_minutes` / `auto_compact_min_context_tokens`（解析于 `Lk`，`33970`；字段落位 `33980`/`33981`）——空闲超阈值且上下文 token 超阈值时自动压缩会话历史。默认关闭、按会话配置，属 channel 会话生命周期而非潜意识分区，但同属"定时 + 阈值门控省成本"家族。（confirmed）

---

### 论点 2 · 潜意识引擎靠总线事件驱动，三重门把固定节拍变成事件驱动的自适应节奏

**所以呢：** 引擎自身没有定时器，只挂在心跳总线上；三重门（重入/停机、内存指纹活动门、cooldown/backoff）联合实现"没有新证据就不空转"——把固定 37min 节拍变成随记忆变更自适应的节奏。

- **总线挂载、非自持定时器**：`createMetaSession (oet)`（`74214`）内 `n.on("cadence.tick",x)`（`74601`），日志 `"[meta-session] started, listening for cadence ticks"`（`74607`）。`x`（`74587`）是去重包装：记在途 promise `p`，若 `l||d` 直接 `g()` 不追踪。（confirmed）
- **门一 · 重入 + 停机**：`74524 if(l||d){...skipping tick...;return}`——`l`=processing、`d`=stopRequested，**独立于维护环 `K` 的第二套门**。（confirmed）
- **门二 · 内存指纹活动门**：`74534` 处 `let[k,E,R,$,I]=await Promise.all([KI(memoryFragmentsDir),KI(memoryEntitiesDir),KI(memoryTopicsDir),net(t),ret(t)]),P=[...].join(":"),C=eet(P)`；`74535 if(m!==null&&C===m){...activity gate: skipping tick (fingerprint unchanged)...}` 整跳。（confirmed）
- **门三 · cooldown / backoff（round-robin 选择器 `w`, `74510`）**：逐项 `74512 done→skip`；`74514 !C||!enabled→return P`（交由 `b` 用 `cR` 勾掉推进）；`74516 backoff(A2)→continue`；cooldown 判定在 `74517-74519`：`G=Math.max(0,C.schedule.cooldown_ticks),K=_.get(P.name); if(K===void 0||R-K>=G) return P`（`_`=分区→上次 tick 序号 Map，`74228`）。失败退避 `D2`（`74048-74058`）是**线性、非指数**：`success/invalid_output→null`（`74049`）；timeout `74052 if(t<=2)return null` 后 `min(t*i,JXe)`（`74053`）；error `74056 if(t<=1)return null` 后 `min(t*2*i,GXe)`（`74057`）；常量 `JXe=72e5(2h)/GXe=144e5(4h)/N2=222e4`（`74071`）。`A2`（`74044`）读 `backoff_until` 判定退避中；`b` 选取后再读一遍全分区 state，用 `A2` 过滤出本拍 `backedOff`（`74258`）。（confirmed）
- **选取 + 空闲补跑**：`74548 K=await b(L,G,h)`；`74549-74550 if(K?.name&&u>1&&(!r||r.activeCount()<=1)) for(W=1;W<u&&await b(...);W++)`，`u=maxPartitionsPerIdleTick??2`（`74228`）。（confirmed）
- **同拍二次 broadcast lint（易漏节点）**：除维护环 `det:74772` 外，`g` 里在分区选取**之前**又跑一遍 `await pm(t),await hm(t)`（`74545`）。（confirmed）

---

### 论点 3 · 分区是无状态一次性 LLM 会话；playlist 是可自改写的纯文本状态机，且存在"确定性入队 + LLM 出队"两级路由

**所以呢：** 调度不硬编码 cron，而是 agent 自己能改写的 `playlist.md` checkbox 轮次 + 分区 frontmatter；每分区是一次性 SDK 会话，"除了写进文件的都不记得"，跨 tick 协作全靠 inbox 与共享 `memory/`。

- **playlist 状态机**：分区加载器 `z_`（`55606`）、解析器 `F9e`（`55706`）只解析 `## Current Round`，`- [x]`=done、`- [ ]`=未做，遇下一 `## ` 停。`cR`（`55725`）把 `- [ ] <name>`→`- [x]`（`55735`）、造 `- <ISO> executed=<name>`（`55737`）、splice 进 `## History`（`55738-55739`）。整轮全勾时 `jce`（`55743`）用 `n=t.filter(o=>o.schedule.enabled)`（`55745`，按 name 排序 `55649`）重建 round，日志 `"[playlist] rebuilt round" {count,names}`（`55782`）；`b` 内 `74235 if(await jce(t)===0) return null` 进 idle。（confirmed）
- **分区执行 `v`（`74265`）**：无状态一次性 SDK 会话 `persistSession:!1`（`74366`）；提示词 `74343 A = 正文 + "### Partition"(ze 74338) + E(iet 上下文, 调用点 74547) + st(set inbox, 74337)`；超时 `Ae=Math.max(1,k.schedule.max_duration_ms)`（`74392`）、`74395 setTimeout(()=>M(Ke),Ae)`、`74398 P=await Promise.race([Ce,en])`。结果四分类由 `QXe(k.name,Wme(P?.text))`（`74410-74411`）判定——其中 `invalid_output` 是"跑成功但产物不合格"的唯一判定点。成功落 `agent.result tick_type:"subconscious"`（`74440`），失败落 `agent.error stage:"partition_execution"`（`74461`）；并写一条 `Pl` usage drain record（`74415`，`session_key: meta:subconscious:<partition>`，`cancelled:I==="timeout"`）——这正是 `usage.get` 能显现潜意识开销的动态节点。runtime 由 frontmatter claude/codex 选（`z9e 55657` 解析、`v` 内 `74269-74270` 选取）。（confirmed）
- **上下文注入**：`iet`（`74197`）建 `## Runtime Context` + `### Key Paths`（kernel/memory/entities/topics/fragments/registry/events/jobs/cadence inbox·queue/subconscious 目录清单）；`set`（`74204`）建 `## Inbox`（含 memory-weaver 专属 Stage1/Stage2 提示，`74208`）。（confirmed）
- **两级路由（易漏节点）**：`mergeCadenceInbox (the)`（`74722`）只做**确定性**的 `.pending`→`queue.md` 合并；真正把 `queue.md` 的 checkbox 任务**路由进各分区 directed inbox** 的是 `cadence-executor` 这个 **LLM 分区**（其 `CLAUDE.md` 自述 dispatcher 角色："route checkbox tasks from the shared cadence queue into the directed inbox"）。即 `the`（确定性入队）+ cadence-executor（LLM 出队分发）两级。（confirmed，磁盘实证）
- **原"未证实推测"已解开**：`cadence-executor: enabled (cooldown 1, timeout 10min)` 在代码里搜不到，因为它是**用户数据里的分区名，不是代码**——磁盘实证 `subconscious/cadence-executor/CLAUDE.md` frontmatter `schedule:{enabled:true,cooldown_ticks:1,max_duration_ms:600000}`；`daemon config` 的 `[Subconscious]` 段就是逐分区渲染各自 frontmatter schedule（经 `z9e:55657` 解析）。10min≠默认 60s 只是该分区**覆盖了 `rU` 默认（`rU={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`, `55826-55829`）**。四分区 `cadence-executor/memory-committer/memory-weaver/pattern-tracker` 的 cooldown 1/3/5/7、timeout 10/30/35/15min 均为 per-partition frontmatter 覆盖。（原"未证实/待查"→ confirmed：per-partition frontmatter 覆盖）

---

### 论点 4 · 机器真正强制的边界只有两处：契约门 `enforceContractGate (gU)` 与分区工具 allowlist（`PARTITION_CORE_TOOLS`）；memory lint 全程只读、契约门控

**所以呢：** 自治 agent 的"自我修改"必须区分"提示词约束"（软、模型可违反）与"运行时强制"（硬、不可绕过）。软边界写在提示词；机器强制的关键不变量只落在契约门与工具白名单两处，memory lint 只做只读测量。

- **契约门 `gU`（`56904`）= 6 拒因 + null 放行**：`partition-absent`（`56905`）/ `self-id-mismatch`（`56906`）/ `partition-disabled`（`56907`）/ switch `valid→consumes.has(e)?null:"kind-not-consumed"`（`56910`）/ `no-contract→n?null:"no-contract"`（`56912`）/ `parse-fail→n?null:"parse-fail"`（`56914`）——第三参 `n`(flagFallback) 可放行后两者。（契约状态由 `hU:56860` 读分区 CLAUDE.md 的 `contract:` frontmatter 产出）（confirmed）
- **`gU` 是双重角色门（易漏节点）**：不仅逐项裁决投递，还能**整拍短路** lint——`runMemoryCheckTick ($Ke)`（`56973`）里 `56992 a=OKe(()=>mle(o)); 56993 if(!a&&!r) return s`，`mle`（`56920`）内部对所有契约调 `gU`，若无任何契约 consume 任何 kind（且未开 forget），整个 memory-check tick 直接空返。（confirmed）
- **lint 全程只读、每类每 tick 至多一条、契约门控**：受 `bU`（`56950`）读的 `ALADUO_EXP_MEMORY_CHECK`(check) 与 `ALADUO_EXP_MEMORY_FORGET&&check`(forget，依赖前者) 开关。子步（经 `nd` try/catch 包装，`57040`）：`57001 orphan-states`（无条件）；check 门内 `57006 board-lint / 57008 entity-lint / 57010 node-lint / 57012 gap-lint / 57014 orphan-newborn-island`；forget 门内 `57019 orphan-forget`。投递经 `ple`（`56996`）→ posted/withheld，投递前按 `dU`（`56747`）按内存节点路径路由到分区名（`rel.startsWith("topics/")&&(slug lesson-/groove-)?"pattern-tracker":"memory-weaver"`，`orphan-forget` 分支 `57027 hle(o,dU(p))`）。活体 `daemon status`：`memory_check: check=off forget=off (posting governed by partition contracts below)` + 4 条 contract。（confirmed）
- **自编程硬边界 = 分区工具 allowlist（v0.5.10 denylist→allowlist）**：v0.5.8 的 `DEFAULT_DISALLOWED_TOOLS` denylist 已退役，分区会话改由**白名单**界定能力：`PARTITION_CORE_TOOLS (Nz)=["Bash","Read","Write","Edit","Grep","Glob","Agent"]`（`48758`）→ `H=[...new Set([...Nz,...k.claudeTools??[]])]`（`74357`）→ SDK `run({...,tools:H})`（`74373`）。分区只能用这 7 个核心工具 + frontmatter `claude.tools` 显式追加项；`EnterPlanMode`/`ExitPlanMode`/`WebFetch`/`WebSearch`/`EnterWorktree` 等因不在白名单而天然禁用，无需 denylist。（confirmed）
- **`system.cadence_tick` 是 Spine 事件、非 RPC（动态印证）**：活体 `spine.tail` 复现 `system.cadence_tick` 事件流，紧随 `agent.tool_use/tool_result(memory-weaver)` → `agent.result tick_type=subconscious partition=memory-weaver` → `pattern-tracker`，动态印证 round-robin 顺序执行分区、每分区落 `agent.result`。（confirmed，动态）

---

### 证据表

| 机制主张 | 证据（字面量 / 代码片段） | 位置 | 置信 |
|---|---|---|---|
| 心跳周期 `yhe("...",222e4,1e3)`，env 可覆盖、带 1e3 clamp | `interval_ms: 37min (2,220,000ms) (default)` | `daemon.pretty.js:78826`；`duoduo daemon config` | confirmed |
| 单 `setInterval` 同拍先 emit `cadence.tick` 再跑维护环，emit 在重入门 `K` 之前 | `f.emit("cadence.tick"); if(...,K){...return}; K=!0; s(d)...finally(()=>K=!1)` | `daemon.pretty.js:78832-78847` | confirmed |
| cron 扫描 `scanAndSpawnDueJobs (j2)` 属独立 60s job-scheduler（默认 `met=6e4`），非维护环 | `C=o({...}); C.start()`；`j2` 到期扫描 | `daemon.pretty.js:78814/78818`、`74809`、`75003` | confirmed |
| 建作业校验 + 复合时长：非法 cron/畸形时长/超范围延迟建时拒绝 | `hce` 建时校验（`CronExpressionParser.parse`）；`L_` 复合时长；`WF` 超范围挡 | `daemon.pretty.js:54795/55153`、`54776/54783`、`54787` | confirmed |
| 维护环 `det` 顺序：pm/hm→memcheck→sweep→the→nhe→构造 system.cadence_tick→落 last_tick | `await pm(e),await hm(e)`…`type:"system.cadence_tick"`…`Ca(...cadence:{last_tick})` | `daemon.pretty.js:74772/74776/74781/74787/74788/74790/74796/74799` | confirmed |
| `pm/hm`=memory broadcast lint（非队列合并）；队列合并是 `the` | `hm` 断链 `enqueuedLintTask:!0`；`the` `fet` 合并 `.pending`→`cadenceQueuePath` | `daemon.pretty.js:59151/59344`、`74722/74747/74751` | confirmed |
| 潜意识环靠总线事件、非自持定时器 | `n.on("cadence.tick", x)`；`"[meta-session] started, listening for cadence ticks"` | `daemon.pretty.js:74601/74607` | confirmed |
| 门一 重入/停机：`l`(processing)/`d`(stopRequested) 独立于维护环 K | `if(l||d){...skipping tick...;return}` | `daemon.pretty.js:74524` | confirmed |
| 门二 活动门：内存指纹不变则整跳 | `C=eet([KI(...),KI(...),KI(...),net,ret].join(":"))`;`if(m!==null&&C===m){...activity gate...}` | `daemon.pretty.js:74534/74535-74538` | confirmed |
| 门三 cooldown：`R-K>=G` 才选中 | `G=Math.max(0,cooldown_ticks),K=_.get(name); if(K===void 0||R-K>=G) return P` | `daemon.pretty.js:74517-74519` | confirmed |
| 失败退避线性、2h/4h 封顶、前 1–2 次宽限 | timeout `t<=2` 免、`min(t*i,72e5)`；error `t<=1` 免、`min(t*2*i,144e5)`；success/invalid→null | `daemon.pretty.js:74048-74058`、`74071` | confirmed |
| `b` 用 `A2` 读 `backoff_until` 过滤本拍 backedOff | `A2` 判退避；`backedOff` 报告 | `daemon.pretty.js:74044`、`74258` | confirmed |
| 空闲补跑：maxPartitionsPerIdleTick 默认 2、仅活跃会话≤1 | `u=maxPartitionsPerIdleTick??2`;`if(K?.name&&u>1&&(!r||r.activeCount()<=1)) for(...)` | `daemon.pretty.js:74228`、`74549-74550` | confirmed |
| playlist 状态机：解析/勾选/History/整轮重建 | `F9e` 只解析 `## Current Round`；`cR` `- [x]`+`executed=`；`jce` filter enabled 重建 | `daemon.pretty.js:55706`、`55735/55737/55738-55739`、`55743/55745/55782`、`74235` | confirmed |
| 分区无状态、超时=max_duration_ms、四分类由 `QXe` 判 | `persistSession:!1`;`Ae=Math.max(1,max_duration_ms)`;`Promise.race`;`QXe(name,Wme(text))` | `daemon.pretty.js:74366/74392/74395/74398/74410-74411` | confirmed |
| 成功/失败落 Spine + usage drain record | `agent.result tick_type:"subconscious"`;`agent.error stage:"partition_execution"`;`Pl` drain `cancelled:I==="timeout"` | `daemon.pretty.js:74440/74461/74415` | confirmed |
| 上下文注入 iet(路径清单)/set(inbox) | `## Runtime Context`+`### Key Paths`；`## Inbox`(memory-weaver Stage1/2) | `daemon.pretty.js:74197/74547`、`74204/74208` | confirmed |
| 两级路由：`the` 确定性入队 + cadence-executor LLM 出队分发 | `the` `.pending`→`queue.md`；cadence-executor CLAUDE.md 自述 dispatcher | `daemon.pretty.js:74722`；`subconscious/cadence-executor/CLAUDE.md` | confirmed |
| cadence-executor 等四分区 = 用户数据分区，schedule 覆盖 rU 默认 | frontmatter `schedule:{enabled:true,cooldown_ticks:1,max_duration_ms:600000}`；`rU={...,cooldown_ticks:1,max_duration_ms:6e4}` | `subconscious/*/CLAUDE.md`；`daemon.pretty.js:55657/55826-55829`；`duoduo daemon config` | confirmed |
| 契约门 `gU`：6 拒因 + null 放行，双重角色（逐项 + 整拍短路） | `kind-not-consumed`/`partition-absent`/`self-id-mismatch`/`partition-disabled`/`no-contract`/`parse-fail`；`if(!a&&!r) return s` | `daemon.pretty.js:56904-56914`、`56860`、`56920`、`56992-56993` | confirmed |
| memory lint 只读、每类≤1条、受 check/forget 门；路由 `dU` | `orphan-states`/`board`/`entity`/`node`/`gap`/`orphan-newborn-island`/`orphan-forget`；`dU` 路由分区 | `daemon.pretty.js:56950/56973/57001/57006-57019`、`56747/56996` | confirmed |
| 自编程硬边界：分区工具 allowlist（denylist 退役） | `Nz=["Bash","Read","Write","Edit","Grep","Glob","Agent"]`；`tools:H` | `daemon.pretty.js:48758`、`74357/74373` | confirmed |
| channel 空闲自动 compact（v0.5.10，channel 会话侧）：默认关闭、按会话配置 | `auto_compact_idle_minutes` / `auto_compact_min_context_tokens` 解析 | `daemon.pretty.js:33970/33980/33981` | confirmed |
| `system.cadence_tick` 是 Spine 事件而非 RPC 方法 | `type:"system.cadence_tick", source:{kind:"system",name:"cadence"}, payload:{count}`；`spine.tail` 复现 | `daemon.pretty.js:74790`；活体 `spine.tail` | confirmed（动态） |

### 关键数据结构 / 事件 / 文件格式（真实字面量）

- **`playlist.md`**：`# Subconscious Playlist` / `## Current Round`（`- [ ] <name>` / `- [x] <name>`）/ `## History`（`- <ISO> executed=<name>`）。`F9e` 只解析 `## Current Round` 段。
- **分区 frontmatter**：`schedule:{enabled:bool, cooldown_ticks:int, max_duration_ms:int}`（默认 `rU={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`，per-partition 可覆盖，如 cadence-executor 覆盖为 600000）；可选 `runtime: claude|codex`；可选 `claude.tools`（追加进分区工具白名单）；`contract:{partition:string, consumes:string[]}`。
- **分区状态文件**（read `Ab`, `74017`；write `C2`, `74040`）：`{last_started_at,last_finished_at,last_result,consecutive_failures,backoff_until}`，`last_result ∈ success|timeout|invalid_output|error`。
- **定向 inbox**：`var/subconscious/<partition>/inbox/*.pending` 与 `*.json`（目录经 `partitionInboxDir (ed)`, `55591`；由 `Lce` 列举）；pending body 为一行队列行、换行结尾。
- **cadence 队列**：`var/cadence/queue.md`（checkbox 任务行），`.pending` 暂存文件在 tick 内由 `the` 确定性合并入队，再由 cadence-executor LLM 分区出队分发到各 directed inbox。
- **Spine 事件**：`system.cadence_tick`（source `{kind:"system",name:"cadence"}`，payload `{count}`）、`agent.result`（`tick_type:"subconscious", partition, runtime`）、`agent.error`（`stage:"partition_execution", outcome`）、`job.spawn`。
- **usage drain record**（`Pl`, `74415`）：`session_key: meta:subconscious:<partition>`，含 `tool_calls/tool_errors/usage/cancelled(=I==="timeout")`——`usage.get` 可见。
- **contract 门 `gU` 裁决集**：`null`（放行）/ `kind-not-consumed` / `partition-absent` / `self-id-mismatch` / `partition-disabled` / `no-contract` / `parse-fail`。

### 给 Agent PM 的洞察

> **1. 两条定时器 + 独立门是清晰的关注点分离，别误读成"一个心跳两个环"。** 确定性维护（memory lint + 墓碑清扫 + 队列合并，幂等、跑在 37min 心跳上，重入门 `K`）与到期 cron 调度（`j2`，独立 60s job-scheduler，自己的定时器与门）各自独立；LLM 分区执行（非确定性）再复用心跳但用独立 `l`/`d` 门与 `K` 解耦。呼应本节结论：慢的 LLM 会话拖不垮维护与定时作业。

> **2. playlist 是可被 agent 自己改写的纯文本状态机，调度分"确定性入队 + LLM 出队"两级。** 调度不是硬编码 cron，而是 `playlist.md` checkbox 轮次 + 分区 frontmatter；`the` 只做确定性 `.pending`→`queue.md` 合并，真正的任务分发交给 cadence-executor 这个 LLM 分区。代价是依赖文件锁/单进程串行保证一致性。

> **3. 能力边界"软 + 硬"双层，机器真正强制的只有契约门 `gU` 与分区工具 allowlist。** 软边界写在提示词（禁改 spine/lock/其他分区 CLAUDE.md，模型可违反）；硬边界一是分区工具 allowlist（`PARTITION_CORE_TOOLS`，只放行 7 个核心工具 + frontmatter `claude.tools`，v0.5.10 起以白名单取代旧 denylist，PlanMode/WebFetch/WebSearch/EnterWorktree 因不在白名单天然禁用），二是 `gU` 契约门——它既逐项裁决 lint 产物能否进某分区 inbox（6 种拒因），又能在无契约 consume 时整拍短路掉 memory-check。关键不变量必须落在运行时强制、而非提示词。

> **4. 多重"不空转"节流把固定节拍变成事件驱动的自适应节奏。** 活动门（内存指纹未变即跳过）、`cooldown_ticks`（每分区最小间隔）、失败**线性**退避（`D2`，2h/4h 封顶且前 1–2 次宽限）、`maxPartitionsPerIdleTick`（空闲多跑但有上限、仅活跃会话≤1 补跑）。可复用的省成本模式：定时轮询 + 变更指纹门控 + 每任务冷却 + 失败退避。

> **5. 无状态分区 + 文件即记忆，开销在 usage drain record 里可观测。** 每分区一次性 SDK 会话，"除了写进文件的都不记得"；跨 tick 协作全靠 inbox `.pending` 与共享 `memory/`，每次执行写一条 `session_key: meta:subconscious:<partition>` 的 drain record，`usage.get` 可显现潜意识开销。代价是每 tick 冷启动的上下文重建，靠 `iet` 注入路径 + `set` inbox 摘要弥补。


---
## §7 记忆系统

**记忆系统把"某条知识还有没有用"物化为 board→`[[link]]` 图可达性 + effectiveness 轨迹证据：daemon 侧只做只读、每类每 tick 至多一条、契约门控的 lint 测量，与带 48h 宽限 + 双 flag + git 软删的孤儿 GC，绝不改内容；一切改写交给 memory-weaver 三段流水线在自己的 tick 上按"事件→fragment→effectiveness→改板"可复算链完成——即"代码测量、模型裁决"的记忆自治架构。**

这条结论把本节拆成四个 MECE 论点：**(A)** 效用被物化成一张 markdown 知识图，可达性 = 效用；**(B)** daemon 侧全部动作是只读、每类每 tick 单条、契约门控的测量，永不改内容；**(C)** 唯一的破坏性动作（孤儿 GC）被 48h 宽限 + 双 flag + git 软删三重封住；**(D)** 内容改写整段委派给 memory-weaver 三段流水线。下面逐点先说"所以呢"，再给证据。

---

### A. 效用被物化为图可达性 —— board 是唯一"根"，`[[link]]` 闭包决定谁还活着

**所以呢**：记忆系统不靠时间戳或访问计数判断一条知识是否"还有用"，而是把它翻译成一个纯几何问题——从广播板 `CLAUDE.md` 出发，沿 `[[slug]]` wiki-link 做可达性闭包，触达不到的 topics 节点就是 orphan。这让"效用"成为可确定、可复算的图属性，daemon 无需理解语义即可测量。

**A1 · 目录结构就是这张图的物理布局。** `dc(e)`（`55835`–`55842`）恰好返回 **5 个字段**：`memoryDir`（根目录）+ `boardPath`（`CLAUDE.md` 文件，即广播板 / 唯一"根"）+ 3 个子目录 `entitiesDir` / `topicsDir` / `effectivenessDir`。

```
memoryDir/
  CLAUDE.md          ← boardPath：广播板 / 直觉层（可达性的唯一"根"）
  entities/          ← 实体档案
  topics/            ← 节点：lesson-* / groove-*
  effectiveness/     ← 每条 board 行一份效果轨迹（附属证据层）
  fragments/<date>/  ← scanner 证据；★ 不在 dc 内，由 gap-lint/scanner 独立引用
  state/meta-memory-state.json  ← ★ 也不在 dc 内，属另一路径（meta-memory）
```

> 口径：`dc` 的组成 = memoryDir + boardPath（文件）+ 3 个子目录（entities/topics/effectiveness）；`fragments/` 与 `state/meta-memory-state.json` **都不在 `dc` 内**。

**A2 · 可达性 BFS 把"效用"算成不动点。** 种子来自 `td(e).filter(uU)`（`56236`），其中 `td`（`55874`）用手写解析器 `F_`（`55849`）扫 board 上全部 `[[...]]`——`F_` 遇第一个 `]` 即止（`55857`）。`um(e,t)`（`56234`）从种子 BFS 到不动点（`56238`–`56248`），reader `am`（`56219`）读每个 slug 的 `topics/<slug>.md` + `entities/<slug>.md`。**不在可达集内的 topics 节点 = orphan**，这是整个 lint/orphan 体系的核心几何。

**A3 · effectiveness 是附属证据层，不能独立支撑可达性。** `am` 仅当 topics/entities 至少一存在（`i.length>0`，`56225`）才追加读 `effectiveness/<slug>.md`（`56226`–`56227`）。即：孤立的 effectiveness 文件不阻止其 slug 成为 orphan——effectiveness 是轨迹证据，不是节点本体。这处"非对称守卫"由 `56225` 逐字印证。

**A4 · board 层现在有独立哈希，与指令层解耦——从缓存层坐实"board 是唯一根"。** v0.6.1 新增 `computeBoardLayerHash`（`zme`，`71264`）单独对 board 文本做 sha256（`JSON.stringify([e ?? ""])`），而指令指纹 `computeNonBoardInstructionsFingerprint`（`Fme`，`71268`）在计算前显式把 `memoryBoard` 置空（`memoryBoard: void 0`）后复用全量指纹 `GI`（`71259`）。即 board 层与 identity/kind/instance/mission 指令层各走一条独立哈希：board 变动只失效 board 缓存、不牵动指令层，反之亦然。这从提示缓存的层次上印证 A 节几何——board 是与指令层正交、独立成层的可达性唯一"根"。confirmed。

---

### B. daemon 侧只做只读测量：每类每 tick 至多一条、契约门控，永不改内容

**所以呢**：整个 `runMemoryCheckTick` 是一台"体检仪"而非"手术刀"。它把五类 lint 的最差单条结果打包成 `.pending` 证据文件投递给潜意识分区收件箱，自己绝不 touch 任何知识内容。三个约束——每类单条节流、契约门控、只读——共同保证测量廉价、可审计、无副作用。

**B1 · 主循环逐 lint `try/catch` 隔离，且投递执行器是 `ple` 而非门控函数。** `$Ke`（`56973`=`runMemoryCheckTick`，导出于 `56938`）逐个用 `nd(...)` 包裹（`57040` try/catch），单个子 lint 崩溃不中断其余。真正的**投递执行器是 `ple`（`56866`）**：它 `mkdirSync(inbox)` → 写 `pendingFilename` → 分类 posted/withheld/errors（`56876`–`56900`），`already-pending`（`56893`）与 `--force`（`56873`）逻辑都在这里；`$Ke` 的闭包 `c`（`56995`）把每个 lint 的 selected 结果喂给 `ple`。门控函数 `gU` 只是 `ple` 内部的 gate 判定，不是投递本身。

**B2 · 五类 lint，kind 全部 `.v1`。** 五个调用点（`57007`–`57017`）：

| lint | 调用点→本体 | 产出信号 | 判据要点 |
|---|---|---|---|
| **board-lint** | `qce(u,yU)` `57007`→`56113`（逻辑 `eKe` `56177`） | REVISE / SINK / MERGE | 见 B3 |
| **entity-lint** | `Wce` `57009`→`56285`（`nKe`） | `entity-converge.v1` | entity 缺收敛四段 `Zce=["What it is now","Relationship","Open variables","Trend"]`（`56331`）；打分 `kb*1e3+dated`（`56301`） |
| **node-lint** | `Gce` `57011`→`56362`（`aKe` `56350`） | `node-converge.v1` | 见 B3 |
| **gap-lint** | `Xce(e.eventsDir,u)` `57013`→`56517` | `scan-gap.v1` | 见 B3 |
| **orphan** | `ile(l)`+`ale(ole(l),t)` `57016`–`57017` | `orphan-newborn.v1` / `orphan-islands.v1` | NEWBORN→warn，ISLAND→weaver note（见 C） |

kind 值全部带 `.v1`（`ai` 表 `55962`–`55971`）。

**B3 · 各 lint 判据细则**：

- **board-lint（`eKe` `56177`）**：REVISE 过滤 = `trajectory!=='NO-EFF' && cls==='behavioral' && fmt==='legacy' && !(WEAKENING && (REMOVE||DROP))`，partition **硬编码 `'pattern-tracker'`**（`56185`，不经 `dU`）。`SINK`（`56189`）与 `MERGE`（`56197`）**也含 `trajectory!=='NO-EFF'` 前置**。trajectory（STRENGTHENING/NEUTRAL/WEAKENING via `q9e`）与 verdict（PRESERVE/KEEP/REMOVE/REWRITE/SHARPEN/DROP via `H9e`）从 effectiveness 文件解析。
- **node-lint（`aKe` `56350`）**：`escalated=!reachable`（`Gce` `56389`），escalated 时打 `WASTED-COMPUTE`（`56357`）。合法 section 由 `sKe`（`56335`–`56336`）判——`Condition`/`Procedure` 恒合法，`References` **仅 groove 合法**（lesson 用 References 也算非法 section）。
- **gap-lint（`Xce` `56517`）**：黑名单 `lKe`（`56549`）过滤内部 source kind，只把外部事件当证据。链路：`fKe`（`56431`）列 `var/events/<date>.jsonl` → `pKe`（`56446`）列已有 `fragments/<date>/` → `mKe`（`56460`）按 `o.source?.kind` 过滤黑名单计数（`56482`）→ `hKe`（`56492`）合小时 band。同一黑名单 `tet` 在 **`74637`** 复用（`74160` 调用）——"外部 vs 内部事件"是代码库稳定的领域概念。**动态印证（值为时点快照）**：机制 confirmed；2026-07-01 活体 `duoduo memory check --dry-run --json` 为 `"gap":{"date":"2026-07-01","bands":[[4,4]]}`（具体值随日期漂移）。

**B4 · 每类每 tick 至多一条（`yU=1`）。** `yU=1`（`57065`）是每类 lint 的默认 limit：`eKe`/`Wce`/`Gce` 都 `slice(0,n)` 只取**最差 1 条**（help 的 `--limit=N default 1`）。即每 tick 每类最多投一个 worst-first 信号——这是"测量廉价"的核心节流。

**B5 · 契约门控 `gU`：只有声明 `consumes` 的分区才收到对应信号。** `gU`（`56904`）分支：partition-absent / self-id-mismatch / `!enabled` → withheld；contract valid → `consumes.has(kind) ? 放行 : 'kind-not-consumed'`；no-contract / parse-fail → 回退 flagFallback（= check flag）。契约解析本体 `fU`（`56770`）返回 5 态（partition-absent / parse-fail / no-contract / self-id-mismatch / valid），`Fce`（`55956`）把 consumes 名规范化补 `.v1`；`hU`（`56860`）把每分区契约缓存进 `e.contracts` Map，同 tick 内 `gU`/`mle`/`hle` 复用同一份，避免反复解析 frontmatter。

**B6 · 前置短路：没有下游读者就不测量。** `mle`（`56918`）在跑任何 lint 前遍历所有 `ai` × `IKe=['pattern-tracker','memory-weaver']`（`56935`），任一 kind 过闸即测量；`if(!a && !r) return`（`56993`）——"有没有订阅者"是是否测量的前置门。

> 注意 `dU`（`56747`）并非通用"路由"：它**仅两处调用**——orphan-newborn 分区路由（`56638`）和 forget 警告门 `hle`（`57027`）。**各 lint 信号的 partition 是每类硬编码的**（REVISE/NODE_CONVERGE→pattern-tracker；SINK/MERGE/ENTITY_CONVERGE/SCAN_GAP/ORPHAN_ISLANDS→memory-weaver），并不走 `dU`。`dU` 只决定 lesson-/groove- 孤儿告警投给哪个分区。

---

### C. 唯一的破坏性动作被三重封住：48h 宽限 + 双 flag + git 软删

**所以呢**：daemon 唯一会删文件的地方是孤儿 GC，而它被设计成"几乎不可能误删"——先把孤儿分成三态给足宽限，再要求两个实验 flag 同开，最后即使删也只是 git 软删（历史可恢复），且"没被警告过就不许删"。对自治 agent 的记忆安全，"遗忘 = 可逆软删除"是关键设计。

**C1 · Orphan 三态状态机（`rle` `56612`）给 STALE 之前留足宽限。** `rle` 套壳 `bKe`（`56563`，真正算 orphans/indeg/mtime），状态判定（`56624`–`56625`）：

```
age = mtimeMs>0 ? (refTimestampMs - mtimeMs)/nle : +∞     (nle = 3600*1e3, 56765)
indeg >= 1                → ISLAND    （被别的档案引用，但 board 不可达）
else age < r              → NEWBORN   （r = newbornHours ?? _R，_R=48h：太新，给宽限）
else                      → STALE     （旧且孤立：可删）
```

`indeg` 来源 `SKe`（定义在 **`56719`**，调用点 `56576`）。`bKe` 同时对每个 orphan 现算 `indeg=SKe.get` 与 `referencedBy=kKe`（`56730`，列出具体引用文件），ISLAND note 正文（`wKe` `56694`）就靠 `referencedBy` 生成"referenced-by"清单。**注意优先级**：`mtimeMs<=0 → 直接 STALE` 仅当 `indeg=0` 时成立；`indeg>=1` 时无论 age 都判 ISLAND（`56625`）。

**C2 · 破坏性遗忘（`sle` `56644`）只对 STALE，且双 flag AND。** `bU`（`56950`–`56956`）：`forget = ALADUO_EXP_MEMORY_FORGET && check`（双 flag AND）；`56978` 警告文案逐字："FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE)"。`sle` 仅对 STALE（`56645`）。

**C3 · git 软删 + 失败回滚 + 锁保护。** `.git/index.lock` 存在则 `return []`（`56650`）；否则：

```
git rm --ignore-unmatch -- <files>                                   (56652)
git diff --cached --name-only --diff-filter=D -- <files>             (56657，含 --name-only)
git -c user.name=aladuo -c user.email=aladuo@local commit -m <msg> -- <files>   (56664)
失败 → git reset --quiet -- <files>  +  git checkout -- <files>       (56668–56674)
```

> 注意 commit 命令语义：`-c` 是 **git 顶层 config 开关（位于子命令 `commit` 之前）**，非 `commit -c`（后者 = 复用某提交的 message）。`EKe`（`56757`）生成 commit message，confirmed。

**C4 · "不可警告即不可遗忘"。** forget 前 `hle(o,dU(p))`（`57027`）：STALE 节点若其目标分区**不消费 orphan-newborn 信号**则 `sparedUnwarnable`——连警告都收不到就永远不能被静默删。

**C5 · 活体 help 印证**：`duoduo memory reclaim`——"Never deletes"、`NEWBORN→warn, ISLAND→weaver note, STALE→git rm`、`--tag MANDATORY`、DESTRUCTIVE/manual/git history backup，全部 confirmed。

---

### D. 内容改写整段委派给 memory-weaver 三段流水线

**所以呢**：daemon 只测量、只投信号；任何对知识内容的实际改写都发生在 memory-weaver 分区自己的 tick 上，走一条"事件→fragment→effectiveness→改板"的可复算证据链，从而把 LLM 编造统计的幻觉压在可审计的证据之下。

**D1 · 三段流水线，证据路径与内容路径强耦合**（读磁盘原文 `prompts/subconscious/memory-weaver/CLAUDE.md`）：

```
spine-scanner       读 event JSONL + 当前 board → 写 fragment
                    fragment frontmatter 必含 claude_md_ref | source_line
                    + trajectory(STRENGTHENING/NEUTRAL/WEAKENING) + activation   (68–69, 178–179 行)
        │
        ▼
entity-crystallizer 把 fragment 折进 entity dossier，为每条 board 行写 effectiveness/<slug>.md
        │
        ▼
intuition-updater   编辑某 board 行前【必须先读】该行的 effectiveness 文件 → keep/rewrite/remove/add
```

三 subagent 职责（`66`–`81` 行）confirmed。

**D2 · 每 tick 节流与终止语义。** frontmatter `cooldown_ticks:5, max_duration_ms:2100000`（`4`–`5` 行）；Stage1 每 tick 跑一次 scanner 证据 pass、Stage2 至多处理一条 directed inbox 项（`39`–`43`、`98`–`137` 行）；终止 token `UPDATED / NO-OP / NO_NEW_GRADIENT / BOOTSTRAPPED`（`220`–`223`），**仅终止后才删 inbox ack**，`PARTIAL_UPDATE` 留盘（`225`–`229`）；gradient 优先级 **真人 `channel.message` > 周期后台事件**（`90`–`96`）。

**D3 · consumes 与 §B 路由自洽。** `consumes` 声明 6 kind：entity-converge / sink / merge / orphan-islands / orphan-newborn / scan-gap（`8`–`14` 行）——**memory-weaver 不 consume `revise.v1` / `node-converge.v1`**（那两类归 pattern-tracker，正好对上 B3/B5 的硬编码路由）。

**D4 · 模态标签体系（`meta-prompt.md` `162`–`194`）。** dossier 内每条主张标注 epistemic shape，六标签逐字命中（`164`–`175` 行）：`[observation]` / `[inference]` / `[instruction]` / `[conditional: <event>]` / `[hypothesis (unratified)]` / `[superseded YYYY-MM-DD: <new>]`。覆盖规则（`183`–`185` 行）："Present observation overrides any dossier's `[observation]` or `[inference]`；对 `[instruction]`，当前观察决定其条件是否仍成立。" board 是"已加载的直觉层"，深读 dossier 才应用其模态标签。

---

### 证据表

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| `dc` 定义 5 字段：memoryDir + boardPath + entities/topics/effectiveness | `return {memoryDir, boardPath, entitiesDir, topicsDir, effectivenessDir}` | daemon `55835`–`55842` | confirmed |
| fragments/ 与 state/meta-memory-state.json 均不在 dc 内 | dc 无此二字段 | daemon `55835`–`55842` | confirmed |
| board 种子 `td.filter(uU)`；`F_` 遇首个 `]` 即止 | 手写 `[[..]]` 扫描器 | daemon `55874` / `55849`（`55857`） | confirmed |
| BFS `um` 到不动点；`am` 仅 topics/entities 存在才读 effectiveness | `i.length>0` 守卫 | daemon `56234`(`56238`–`56248`) / `56219`(`56225`) | confirmed |
| board 层独立哈希 `zme`，指令指纹 `Fme` 排除 memoryBoard（与 `GI` 全量指纹解耦） | `JSON.stringify([e??""])` / `memoryBoard: void 0` | daemon `71264` / `71268`（`71259`） | confirmed |
| orphan 三态优先级 indeg≥1→ISLAND / age<r→NEWBORN / else STALE | `56624`–`56625`，`_R=48`、`nle=3600*1e3` | daemon `56612`/`56563`(`56765`) | confirmed |
| indeg 源 `SKe` | 定义 `56719`、调用点 `56576` | daemon `56719` | confirmed |
| mtimeMs≤0→STALE 仅当 indeg=0；indeg≥1 恒 ISLAND | 判定优先级 | daemon `56625` | confirmed |
| 主循环 `$Ke`=runMemoryCheckTick，五 lint 逐个 `nd` try/catch | 导出 `56938` | daemon `56973`(`57040`) | confirmed |
| 投递执行器是 `ple`；already-pending/--force 在其内 | mkdir+write+分类 | daemon `56866`(`56873`/`56893`/`56876`–`56900`) | confirmed |
| board-lint REVISE/SINK/MERGE 均含 `trajectory!=='NO-EFF'`；partition 硬编码 pattern-tracker | `eKe` | daemon `56177`(`56185`/`56189`/`56197`) | confirmed |
| node-lint References 仅 groove 合法；escalated→WASTED-COMPUTE | `sKe`/`aKe` | daemon `56335`–`56336`/`56350`(`56357`/`56389`) | confirmed |
| gap-lint 黑名单过滤内部 kind；`tet` 在 74637 复用 | `lKe`/`mKe` | daemon `56517`(`56549`/`56482`) / `74637` | confirmed |
| gap 活体值 = 2026-07-01 bands=[[4,4]]（时点快照，机制 confirmed） | `memory check --dry-run --json` | 活体 RPC | confirmed（值随日期漂移） |
| `yU=1`：每类每 tick 至多一条 worst-first | `slice(0,n)`，help `--limit default 1` | daemon `57065` | confirmed |
| 契约门 `gU` 5 态；`hU` 每 tick 缓存契约 | `fU`/`Fce` 规范化补 .v1 | daemon `56904`/`56770`/`56860`/`55956` | confirmed |
| 前置短路 `mle`：无订阅者不测量 | `if(!a&&!r) return` | daemon `56918`(`56935`/`56993`) | confirmed |
| `dU` 仅两处调用（orphan-newborn 路由 + hle 警告门），非通用路由 | `56638` / `57027` | daemon `56747` | confirmed |
| forget = 双 flag AND，仅 STALE | `bU` | daemon `56950`–`56956`/`56644`(`56645`/`56978`) | confirmed |
| git 软删：rm→diff(--name-only)→`-c ...` 顶层 config commit→失败回滚 | index.lock 保护 | daemon `56652`/`56657`/`56664`/`56668`–`56674`(`56650`) | confirmed |
| 不可警告即不可遗忘 `sparedUnwarnable` | `hle(o,dU(p))` | daemon `57027` | confirmed |
| weaver frontmatter cooldown_ticks:5 / max_duration_ms:2100000 / consumes 6 kind（无 revise/node-converge） | 磁盘 prompt 原文 | memory-weaver/CLAUDE.md `4`–`14` | confirmed |
| fragment 必含 claude_md_ref\|source_line + trajectory + activation | 磁盘 prompt 原文 | 同上 `68`–`69`/`178`–`179` | confirmed |
| 终止 token 四值，PARTIAL_UPDATE 留盘；真人 channel.message 优先 | 磁盘 prompt 原文 | 同上 `220`–`223`/`225`–`229`/`90`–`96` | confirmed |
| 六模态标签 + 覆盖规则 | meta-prompt.md | `162`–`194`（`164`–`175`/`183`–`185`） | confirmed |

---

> **给 Agent PM 的洞察**（呼应本节领起结论"代码测量、模型裁决"）
> - **测量与执行彻底分离，是本节的塔尖。** daemon 的 lint 永不改内容（help："Never deletes"），只产出带明确 action 的 `.pending` 证据包，投给有认知能力的子 agent 去收敛。这把确定性检测与 LLM 判断解耦，避免规则引擎硬改记忆——正是"代码测量、模型裁决"。
> - **可达性即效用。** 不被 board 闭包触达的节点没有前景影响；孤儿再分 ISLAND / NEWBORN(48h 宽限) / STALE，是带宽限期的软 GC，避免误删刚生成还没接线的知识。
> - **破坏性遗忘 = 可逆软删除。** 双 flag AND、必须先经 NEWBORN 警告、只 git rm（历史可恢复）、目标分区不消费警告即拒删（`sparedUnwarnable`）。对自治 agent 的记忆安全，"遗忘=可逆"是关键设计。
> - **每类每 tick 单条（`yU=1`）+ 前置短路（`mle`）+ 契约缓存（`hU`）= 廉价测量三件套。** 测量被压到 worst-first 一条、无订阅者不空跑、契约每 tick 只解析一次——测量便宜，才敢每 37 分钟心跳都做。
> - **证据链可审计。** scanner fragment 必须命名它测试的 board 行（`claude_md_ref`），crystallizer 按行产 effectiveness，updater 改行前必读该行 effectiveness——"事件→证据→效果→改写"可复算链，压制 LLM 编造统计的幻觉。
> - **分区契约门控 = 按需订阅的去中心化路由。** 只有 frontmatter `consumes` 声明某 kind 的分区才收到对应 `.pending`（memory-weaver 不消费 revise/node-converge，正好归 pattern-tracker）；新增分区无需改核心。


---
## 9. 未证实 / 需实测的开放项（明确标注）

以下为验证过程中标注的开放问题或环境限制，**不作为已确立结论**：

1. **活体记忆为空态**：本机为近乎全新实例——广播板 `memory/CLAUDE.md` 为 0 字节、`effectiveness/` 未创建、`meta-memory-state.json = {}`。因此 orphan 三态状态机、board census、weaver 三段流水线的**运行时行为未在有真实记忆的节点上直接观测**；相关结论基于代码路径 + 字面量 + CLI help，非典型运行态数据。（注：cadence 心跳与 4/4 潜意识分区已实测跑完一轮，见 §6。）
2. **dedup 内存 Map 整表 clear 后的去重丢失窗口**：机制确认（去重存储类 `Sk` 的 `record` 在 `entries.size >= maxEntries(1e4)` 时先 `clear()` 再写入，`daemon.pretty.js:75157`），但**丢失窗口的实际时长/影响未实测**。
3. **`DISABLE_ADAPTIVE / DISABLE_THINKING / MAX_THINKING_TOKENS` 的消费方（未证实推测）**：这些 env 在 daemon 中仅出现在 Codex/端点错误提示串里（`daemon.pretty.js:61465`）。v0.6.1 的提示文案已**显式标注它们是 "Claude-only" 的 `~/.config/duoduo/.env` 开关**，据此推断 duoduo 自身不消费、只是透传给底层 Claude Code 二进制/SDK 的建议开关；SDK 侧的实际消费仍未直接验证。
4. **部分 RPC 方法的活体探测**：控制面方法全集从 `/rpc` 分派链提取（附录 B），其中 `spine.tail` / `usage.get` / `system.status` 已活体验证返回，其余 handler 存在性以分派链代码为准。

> 复核状态：全文已于 2026-07-24 对齐到 **v0.6.1**，用整体重生成并证明 AST 全等的还原源码（真名 + 可读源）逐节复核，8 节机制主张全部 **CONFIRMED**（详见还原源码 [`reconstruction/first-party/`](../reconstruction/first-party/) 与真名表 [`RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)）。


---
## 附录 A：复核索引（关键 file:line 速查）

**A.0 短名 ↔ 真名速查**（从还原源码的 `__export` 恢复；*inferred* 标注见 [`RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)，可读源码在 [`first-party/`](../reconstruction/first-party/)）：

**§1 认知装配**：`ZE`=buildSystemPromptForChannelConfig、`w_`=resolveMetaPromptText、`Xoe`=renderJobMissionBlock、`Cle`=extractSystemPromptAppend、`Gde`=buildTransientUserBlocks、`Pme`=transcludeBroadcastBoard
**§2 Turn/Drain**：`tc`=createAgentSdkAdapter、`KU`=batchDrainItems、`gm`=handleDrainError、`Pl`=appendDrainRecord、`Il`=summarizeDrainRecords、`Ole`=computeCodexTurnUsage
**§3 Session**：`HXe`=createSessionManager、`oet`=createMetaSession、`nX`=rehydrateSessionState、`Vde`=drainSessionMailbox、`GI`=computeInstructionsFingerprint、`O2`=runInstructionsFingerprintGuard、`aet`=sweepTombstonedSessionRecords（`spawnSessionActor`/`wakeSessionActor` 在模块作用域内，短名未定位）
**§4 Spine**：`nn`=createSpineEvent、`rn`=atomicAppendEvent、`d2e`=atomicWriteFileSync、`ml`=readEventByIdSeek、`Oa`=advanceConsumerWatermark、`hX`=computeDedupKey
**§5 Gateway**：`Cne`=appendBeforeExecuteGateway
**§6 Cadence**：`det`=runCadenceTick、`uet`=enqueueCadenceItem、`the`=mergeCadenceInbox、`nhe`=parseCadenceQueue、`cet`=markCadenceItemsDone、`j2`=scanAndSpawnDueJobs、`het`=createJobScheduler、`yet`=createOutboxDeliveryManager
**§7 记忆**：`dc`=resolveMemoryDirs、`um`=walkReachableMemory、`am`=collectMemoryLinks、`td`=resolveMemoryLinkTargets、`rle`=detectOrphanMemory、`eKe`=runBoardLint、`Xce`=runGapLint、`gU`=enforceContractGate、`dU`=routeContractDecision、`sle`=forgetMemoryEntry、`$Ke`=runMemoryCheckTick
**§8 运行时抽象**：`V_`=createCodexAppServerAdapter、`Ale`=buildBaseInstructions、`Nle`=buildDeveloperInstructions、`hc`=checkCodexAvailability、`lm`=resolveCodexSandbox、`OU`=ensureAgentsMdSymlink、`M9e`=resolveRuntimePaths、`m5e`=initializeRuntime

**A.1 机制 → file:line**

| 机制 | 位置 |
|---|---|
| system prompt 6 层装配 | `daemon.pretty.js:48234-48262` (ZE) |
| prompt_mode 分叉 | `48256` (override) / `48258` (append) |
| meta-prompt 解析 | `48217-48227` (w_) |
| 广播板包装 Hoe/DWe/jWe | 在 ZE 内 `48244-48250`，常量定义 `48759` |
| 广播板 transclusion | `70978-71020` (Pme/xXe/$me)，wXe(maxDepth=5) `71122` |
| per-turn 瞬态注入 | `60926-61027` (Gde) |
| Codex 装配 | 复用 `ZE` 输出，经 `Cle` 桥接抽字符串 `57356`；`Ale`/`Nle`（`57360-57390`）在当前路径为不可达死代码（构造 `V_` 未传 instructions），详见 §1 论点三 |
| 潜意识分区注入 | `74197-74213` (iet/set) |
| 事件封装/原子写 | `30659` (nn=createSpineEvent)/`30646` (c2e 串行 mutex)/`30666` (d2e=atomicWriteFileSync)/`30703` (rn=atomicAppendEvent) |
| append-before-execute | `75471` (Cne)，实际 append `rn` @`75546`，紧随 watermark `Oa` |
| 去重 hX / checkAndRecordDetailed | `75173-75187`，dedup 存储类 Sk `75127`（clear 于 `75157`），dup 分支 `75512-75531` |
| 随机读 ml / by_id | `30733-30750`，by_id 索引 u1 `30751` |
| watermark Oa | `31524` |
| rehydrate nX | `31020-31059` |
| spine.tail | `77104` (Ace 尾读取)，RPC 分派 `78512` |
| 记忆根 dc | `55835`（memoryDir + boardPath(CLAUDE.md) + entities/topics/effectiveness） |
| 可达性 um/am/td | `56234`/`56219`/`55874` |
| orphan 三态 rle | `56612`（nle=3600e3, _R=48） |
| lint 主循环 $Ke | `56973`，短路 `!a&&!r` `56999` |
| 投递门控 gU | `56904`，路由 dU `56747` |
| 遗忘 sle | `56644-56676`，index.lock 守卫 `56650`，双 flag 守卫 `56975` |
| cadence 间隔（运行时常量） | `78826` `yhe("ALADUO_CADENCE_INTERVAL_MS",222e4,1e3)`；`75832` 仅为 status 展示串 `"2220000"` |
| 模态标签 | `meta-prompt.md:162-194` |

---
## 附录 B：地面真值 —— Spine 事件类型 与 控制面 RPC 方法全集

> 由主循环直接从 `daemon.pretty.js` 提取（minify 不改字面量），用于交叉校验各子系统结论、防止逆向幻觉。

**Spine 事件类型**（经事件封装并落 WAL 的合法 type，从事件 type 字面量提取）：
```
agent.error agent.result agent.tool_result agent.tool_use cadence.tick channel.ack 
channel.attached channel.command channel.describe channel.ingress channel.message 
channel.pull channel.spawn external.notify job.complete job.completed job.create job.fail 
job.failed job.get job.list job.spawn job.spawned route.deliver session.archive 
session.compact session.config session.execution session.list session.notify session.output 
session.set_alias session.stream session.stream_end session.streaming_invalidated 
session.wake spine.event spine.sock spine.tail system.cadence_tick system.config 
system.runtime.info system.shutdown system.status usage.get 
```

**控制面 / RPC 方法**（`/rpc` JSON-RPC 分派链，从 handler `if (h.method === "…")` 直接读出，`daemon.pretty.js:78143-78512`——即实际注册可调用的方法，区别于上面更宽的事件 type 全集）：
```
system.shutdown system.runtime.info system.status system.config 
channel.describe channel.spawn channel.ingress channel.command 
channel.file.upload channel.file.download channel.pull channel.ack 
session.archive session.list session.set_alias session.notify session.compact session.config 
job.create job.get job.list usage.get spine.tail 
```

> 无 container 相关控制面方法（v0.6.0 起 container 模式退役，`container` 在 daemon 仅剩 `75985` 一处向后兼容类型守卫）。`/effort` 等斜杠命令不是独立 RPC 方法，经 `channel.command` 入站处理（`Tne @75341`，`/effort` 分支 `75355/75407/75869`）；每会话推理力度落到 run-config 字段 `"effort"`（`48345`）/ `reasoningEffort`（`58029`）。
>
> 活体已验证返回：`spine.tail`、`usage.get`、`system.status`。其余以分派链代码为准（见 §9 第 4 条）。


---
## 附录 C：本文的逆向方法论（可复现）

作者不发布源码，只发布 minified 包。本文的分析链路如下，供后来者复现：

1. **反混淆**：`dist/release/{daemon,cli,stdio}.js`（esbuild 打包）→ js-beautify 展开为 `*.pretty.js`（daemon 7.9 万行 / cli 12.8 万行 / stdio 4.7 万行）。变量名已被 mangle（`ZE`/`tc`/`Gde`…，且 esbuild 每次构建都会重新 mangle——短名跨版本不稳定），但**字符串字面量、事件名、RPC 方法、env 名、日志前缀、路径片段全部保留**——它们是逆向的锚点，也是跨版本重锚定的依据。
2. **地标索引**：对反混淆代码 grep 关键概念（spine/drain/lease/cadence/partition…）建立「概念→行号」索引，避免通读（大部分体积是打包进来的 react/ink/zod/fastify/claude-sdk）。
3. **提示词层直读**：`bootstrap/` 下 `meta-prompt.md`（agent 身份/记忆纪律的"宪法"）、`config/*.md`、`subconscious/**` 人类可读，直接构成认知层证据。
4. **活体探测**：运行 daemon，用 `duoduo daemon status|config`、`duoduo session list`、`/rpc`（`spine.tail`/`usage.get`/`system.status`）观测真实行为与数据结构。
5. **多 agent 对抗验证**：8 个子系统各由独立分析 agent 逆向，再由**对抗验证 agent**逐条证伪（逆向 minified 代码极易产生"看似合理实则错误"的主张，默认怀疑）；主循环另行提取事件类型/RPC 全集作地面真值交叉校验（附录 B）。

**一句话结论**：duoduo 的"智能是持久的、非一次性的"这一主张，在代码层由三件事共同兑现——**append-before-execute 的 WAL（状态可信可恢复）+ 双注入面的提示词装配（稳定认知与易变状态分离）+ cadence 驱动的潜意识回写广播板（经验跨会话沉淀）**。运行时刻意做薄，把推理全交给模型；它守住的是模型守不住的持久化、生命周期、调度与并发边界。
