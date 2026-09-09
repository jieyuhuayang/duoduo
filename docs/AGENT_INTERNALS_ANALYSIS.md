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

1. **静态代码 + 调用链追踪**：用 esbuild 反混淆 + js-beautify 把 `dist/release/{daemon,cli,stdio}.js` 展开为可读代码（基准 v0.6.2；daemon 79052 行，约 7.9 万行）。字符串字面量（事件名/RPC 方法/env/日志）在 minify 后完整保留，是证据锚；关键机制**沿真实函数调用链追踪**（跟进被调用的下游函数确认控制流真的这样串联），而非仅凭单个字符串推断。
2. **可读提示词**：`bootstrap/` 下 `meta-prompt.md`（agent 身份/记忆纪律的"宪法"）、`config/*.md`、`subconscious/**` 定义 agent 认知，本身人类可读。
3. **活体运行时调用链**：本机运行的 daemon，用 `duoduo` CLI + `/rpc`（`spine.tail` 事件序列 / `usage.get` drain record / `daemon status`）印证动态行为——动态证据优先于静态推断。
4. **还原源码交叉复核（本轮新增）**：运行时已被还原为可读、且经证明可同样运行的源码（见 [`../reconstruction/`](../reconstruction/)）。关键点：esbuild 的 `__export` 助手**逐字保留了真实导出符号名**（daemon v0.8.0 恢复 733 个），因此本文引用的短名 `eh`/`Yt`/`Xt`/`act`… 绝大多数能对上**权威原名**（`buildSystemPromptForChannelConfig`/`createSpineEvent`/`atomicAppendEvent`/`createSessionManager`…）。本轮用这些真名源码逐节复核了各机制主张，纠正处见 §9。**短名↔真名全表**见 [`../reconstruction/maps/RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)，可读源码按子系统分文件在 [`../reconstruction/first-party/`](../reconstruction/first-party/)（一等公民共 133 个 = 103 个 `__export` 权威名 + 30 个 RE-inferred）。

**符号命名约定**：下文机制名尽量以「真名 (短名)」形式给出，如 `buildSystemPromptForChannelConfig (eh)`。真名来自 `__export` 者为权威；少数内部辅助函数的真名系逆向推断，在 `RENAME_TABLE.md` 标 *inferred*，即便名字有偏差也不影响行号与逻辑结论。

**可信度纪律**：8 个子系统各由独立 agent 逆向，再由对抗验证器沿调用链逐条证伪，最后用还原源码复核；每条机制主张标注 `file:line` / 字面量 / RPC / CLI 供复核，置信分 `confirmed` / `未证实推测`。所有行号指反混淆后的 `daemon.pretty.js`（除非另注 `cli`/`stdio`）。凡未证实的推断均显式标注。


---
## §0 端到端：一个消息如何穿过整个 agent 大脑

**这张图就是"一句话结论"的时间展开**：它把四条论点——先落日志再执行（Part III）、稳定认知进 system·易变状态进 user（Part I）、会话被 actor 持有并驱动（Part II）、经验回流成直觉层（Part IV）——拍成一条从入站到产出的时间线。行尾的 `[→Part]` 是通往各部分的导航锚点。

```
外部输入 (channel.message)                                    [→Part III §5 Gateway 入站边界]
   │
   ▼  ① 封装为不可变事件  createSpineEvent (Yt)  → id=evt_<uuid>, ts=ISO   [31924，调用点 81121]  [→§4]
   │
   ▼  ② 去重前置  computeDedupKey (qre) 算 key                  [80811]        [→§4]
   │      命中重复 → 取回既有事件 + 重放上次 gateway 回执 → deduplicated:true，不 append
   │
   ▼  ③ APPEND-BEFORE-EXECUTE：atomicAppendEvent (Xt) 原子写 WAL 分区  [31966，调用点 81196]  [→Part III §4 铁律]
   │      var/events/YYYY-MM-DD.jsonl (UTC)，记 byte_offset/byte_len
   │      → 无条件写 by_id 索引（唯一索引；不存在 by_session 索引）
   │
   ▼  ④ advanceConsumerWatermark (hl) 推进 gateway 消费者 watermark  [32773，调用点 81196]
   │      run/queue_offsets/gateway.json  (经 by_id 反查偏移)
   │
   ▼  ⑤ gl() 更新 status.json（与 ③④ 同一行提交）                 [32834，调用点 81196]
   │
   ▼  ⑥ 按 routing_hint.target 入队（appendBeforeExecuteGateway/hae）  [81119]  [→Part III §5 分流]
   │      分流决策 aae                                                            [80980]
   │      gateway → 同步处理不入队
   │      meta    → 写 meta:subconscious mailbox 指针                [81221]     [→Part IV §6]
   │      session → 向 session_key mailbox append '- [ ] @evt(<id>)'   [81231]
   │
   ▼  ⑦ bus.emit('spine.event', r) → session.wake                [81241]     [→Part II §3 actor 唤醒]
   │
   ▼  ⑧ runner 读 mailbox 的 @evt 指针 → readEventByIdSeek (qGe) 经 by_id seek WAL 取正文  [32001]
   │
   ▼  ⑨ 装配上下文（两个正交注入面）                                          [→Part I §1 认知装配]
   │      system-prompt 面：renderPromptLayers (Lde) 6 层叠装，buildSystemPromptForChannelConfig (eh) 包壳
   │                        （身份→通道→实例→广播板→Runtime Context→job）  [49967/49994]
   │      user-message 面：buildTransientUserBlocks (K_e) 瞬态块
   │                        （restart-hint/time/skip/gateway/job-receipts/job-tick→user-input）  [65787]
   │
   ▼  ⑩ drain 合批 (drainSessionMailbox/W_e → batchDrainItems/HB) → createAgentSdkAdapter (Gd) → SDK query()
   │                                                          [64516/65926/50087]  [→Part I §2 Turn/Drain]
   │      （单 turn 准入——一次只准入一个 turn，后到消息走 steering lane 显式注入
   │        当前 turn，不再折进正跑的 turn 里导致会话永久 busy；createCodexAppServerAdapter (ev) @56730
   │        / pendingSteer，createSessionManager (act) @77628）
   │                                                  （后端 claude/codex/grok/pi 路由 [→Part II §8]）
   │
   ▼  ⑪ agent 产出 → append agent.tool_use / tool_result / result 回 WAL
   │      更新 session state.json：last_event_id / last_event_at / sdk_session_id   [65090/65425]
   │
   ▼  ⑫ 经验沉淀：日志 → 潜意识 cadence tick(≈37min) → 分区流水线（v0.8.0 起 memory-weaver 已拆为 gradient-distiller+intuition-weaver，见 §6 更新块）   [→Part IV §6§7]
          → 回写 memory/CLAUDE.md 广播板 → 下一次前台会话经 transcludeBroadcastBoard (Uwe) 再注入  [76223]
```

**闭环**：经验 → 事件日志 → 潜意识加工 → 广播板 → 系统提示 → 新的经验。这正是关键句 4（后台自治）与关键句 1（认知装配）合起来的闭环——后台把经验压成直觉层，前台每个新会话经 `eh` 自动加载。


---

# 第一部分 · 前台交互：上下文装配 + 单一长驻会话的受控执行

> **关键句**：一次前台交互 = 可确定的上下文装配（§1）+ 单一长驻会话的受控执行（§2）。运行时决定拼什么、何时发一次 query、如何合并与 steering，模型只在这段上下文上推理。


---
## §1 认知装配

**认知装配的本质是一次正交切分：把 agent 上下文拆成"稳定认知"与"易变具身状态"两个注入面——稳定的（身份/人格/直觉广播板）由 `eh` 一次装进 system-prompt 前缀以吃满 prompt caching，易变的（时间流逝/中断/job tick/带外动作）由 `K_e` 每 turn 瞬态塞进 user 消息；且 Claude 与 Codex 共用 `eh` 这一套装配器（Codex 只多套一层 `<aladuo:system-context>` 壳），并非两套并行封装。**

这套切分之所以值得单独成节，是因为它同时优化了两个互相冲突的目标：既要让前缀足够稳定以命中 prompt cache，又要让 agent 感知到它本无的具身信号（时间、被打断、后台节拍）。运行时把这两类内容路由到两个物理位置，从根上避免了"易变状态污染缓存前缀"。下面四个论点自上而下展开：稳定面怎么装（论点一）、易变面怎么装（论点二）、两条后端为何同源（论点三）、以及不走 JE 的两条旁路（论点四）。

| 注入面 | 频率 | 装载内容 | 载体 | 缓存友好性 |
|---|---|---|---|---|
| **System-prompt 面** | 每会话/每 turn 重算 | 身份、通道人格、实例特化、直觉广播板、运行上下文、job mission | `eh` 输出的前缀 | 前缀稳定，利于 prompt caching |
| **User-message 面** | 每 turn 瞬态 | 流逝时间、被打断、job tick、smart-compact 提示、广播板更新、gateway 侧信道结果 | `K_e` 输出的 text blocks | 每 turn 变，不入前缀 |

---

### 论点一：稳定认知由 `eh` 六层一次装进 system-prompt 前缀

**所以呢**：agent 的"我是谁 / 我这个通道该有什么人格 / 我此刻记住了哪些跨会话启发式"这类稳定信息，全部在一处（`eh`）按固定层序拼成一个前缀。层序固定 + 内容稳定，才能让同一 agent 的连续 turn 反复命中同一缓存前缀。

**六层装配顺序**（confirmed）。v0.7.1 起实际拼接六层的是 `renderPromptLayers (Lde)`（`daemon.pretty.js:49967-49992`），按固定顺序 `[o,s,a,u,l,c].filter(Boolean).join("\n\n")` 拼接（单处 `join`，`49989`）；`buildSystemPromptForChannelConfig (eh)`（`49994-50003`）只是调用 `Lde` 拿到拼好的文本后决定 `prompt_mode==="override"` 时原样返回、还是包成 `{type:"preset",preset:"claude_code",append:s}`——**六层拼接与 override/append 包壳是两个函数**（v0.6.2 时代是同一个函数内的两个分支，详见 Part II §8 论点④的重构记录）。两者签名同为五参 `(e,t,n,r,i)`：`e`=effective config、`t`=session_key、`n`=jobContext、`r`=memoryBoard、`i`=runtime：

| 层 | 变量 | 来源 | 位置 | 说明 |
|---|---|---|---|---|
| 1 身份 | `o` | `jb()` 读 `ALADUO_META_PROMPT_PATH` 或 `ALADUO_BOOTSTRAP_DIR/meta-prompt.md` | `49968`（`jb` 定义 `49943`） | 不变 identity；活体 meta-prompt.md=14126 bytes |
| 2 通道 | `s` | `e.kind_prompt` | `49969` | 通道级人格 |
| 3 实例 | `a` | `e.instance_prompt` | `49970` | 实例特化（覆盖类型级） |
| 4 广播板 | `u` | `r.content`（memoryBoard），仅当 `r && r.content.trim().length>0` | `49978-49987` | 直觉层，见下 |
| 5 运行上下文 | `l` | `## Runtime Context`（注入 `session_key`/`channel_kind`，第五参 `i` 非空时再加一行 `- runtime:`），仅当 `t` 存在 | `49971-49976` | 相对稳定，**不含时间戳** |
| 6 任务 | `c` | `jde(n, n.stateless===!0)` 生成 `## Job Mission`，仅当有 jobContext | `49988`（`jde` 定义 `49960`） | stateless 变体额外强调"上文无历史，靠文件持久化"（`49962`） |

- 第 4 层的 `if(r && r.content.trim().length>0)`（`49978`）是布尔短路：`r` 为 undefined（无 memoryBoard）时不解引用、不抛错（confirmed）。
- `jb()`（`49943`）依次探 `ALADUO_META_PROMPT_PATH`、`ALADUO_BOOTSTRAP_DIR/meta-prompt.md`，取首个非空 trim（confirmed）。

**prompt_mode 分叉**（confirmed）。v0.7.1 起这条分叉从 `eh`（buildSystemPromptForChannelConfig）内部搬到了它调用 `Lde`（renderPromptLayers）**之后**：`eh`（`daemon.pretty.js:49994-50003`）先拿 `Lde` 拼好的六层文本 `o`（`49995`），`e?.prompt_mode==="override"` → 返回纯字符串 `o||""`（`49996`），整体替换 Claude Code 预设；默认 `append` → `s=o.trim()||void 0`（`49997`），非空则返回 `{type:"preset", preset:"claude_code", append:s}`（`49998-50002`），为空返回 `undefined`（即无 append）——**装配（六层拼接）与包壳（prompt_mode 分叉）现在是两个函数，不是一个函数内的两个分支**（详见 Part II §8 论点④）。

**数据源**（confirmed）。调用链 `UB`（`64429`）在 `64462` 调 `eh(h, t, H_e(n.jobContext), n.memoryBoard, n.runtime)`——第三参经 `H_e`（`64382`）把 jobContext 投影成 `{content, jobId, cron, stateless, acceptance}`。**Claude 的 kind/instance/prompt_mode/time_gap 全部来自 `h`（effective_config：`64437` 经 `po(s,"effective_config_ms",…c4)` 取得并缓存，再由 `applyJobSdkConfigOverride (u4)` 叠上 job frontmatter 覆盖），不是来自 `uot`**（`uot` 的用途见论点四）。此外 `eh` 被调两次：批处理/admission 路径 `64462` 与 live streaming 路径 `65272`，同一装配复用于两种进场方式。

**广播板包装：OVERRIDE 前缀 + dossier 纪律**（confirmed）。第 4 层的 memoryBoard 整段被常量包装（`kue`/`S9e` 定义于 `49746`，使用于 `49774-49231`）：

```js
u = jWe.test(d)
  ? `${Hoe}\n\n${d}\n\n${DWe}`   // 含 [[slug]]
  : `${Hoe}\n\n${d}`;            // 不含
// jWe = /\[\[[^\]]+\]\]/                                   （48759）
// Hoe = "…IMPORTANT: These instructions OVERRIDE any default behavior…you MUST follow them exactly"  （48759）
// DWe = "The `[[slug]]` links…are dossier entry points, not footnotes…"  （48759）
```

即广播板整段以 OVERRIDE 前缀 `Hoe` 包装；含 wiki-link 时追加 dossier 纪律 `DWe`（"[[slug]] 是深档入口，触发时先读再行动"）。**注意：此 `Hoe` 包装对 Claude 与 Codex 同源同文**——因为 Codex 复用的正是 `eh` 的整段输出（详见论点三）。

**广播板来源：`@include` transclusion**（confirmed）。`transcludeBroadcastBoard (Uwe)`（`76223`）→ `qwe`(`76238`)递归解析 `memory/CLAUDE.md`：用 `@path` 前缀语法（正则 `Mwe=/(?:^|\s)@((?:[^\s\\]|\\ )+)/g`，`76368`）提取 include，按深度上限 `qut=5`（`76239` `if(n>=qut)return[]`）递归内联，扩展名白名单 `But`（实测 106 个扩展名，`76368`）。每个被 transclude 的文件头是 `Contents of ${path} (project instructions, checked into the codebase):`（渲染器 `Vut:76231` + 后缀常量 `Hut:76368`），非裸冒号。

- **去环细节**（confirmed）：visited 集主检的是 `t.has(s)`（`74579`），其中 `s=Eme(i)` 是 resolve+win32 小写后的路径（`Eme` 定义 `74617`），**不是 realpath**；realpath 由 `Jut`(`76272`)另行求得后在 `76246` 以 `t.add(o), t.add(jwe(a))` 额外加入 visited 兜住软链别名。即"resolve 主检 + realpath 补检"。

**活体冷启动印证**（confirmed）。本机 `~/aladuo/memory/CLAUDE.md` 为 0 字节 → `$e.memoryBoard` 为空 → `76698` 不构造 memoryBoard（`$e.memoryBoard ? {path,content} : void 0`）→ `eh` 不注入第 4 层。这印证机制本身：广播板初始为空，由潜意识逐步写入 durable heuristics 后才在下一次会话被注入——**渐进式冷启动，而非硬编码知识**。

---

### 论点二：易变具身状态由 `buildTransientUserBlocks (K_e)` 每 turn 瞬态塞进 user 消息

**所以呢**：时间流逝、被打断、job 节拍、job 完成回执、带外动作结果这些"每 turn 都可能变"的信号，若进 system prompt 会不断击穿缓存前缀。运行时把它们做成带 tag 的 text block，前置到用户输入之前、进 **user 消息而非 system prompt**，既让 agent 感知具身状态，又不污染缓存前缀。

**块顺序**（confirmed，v0.8.1 复核，行号已更新）。`buildTransientUserBlocks (K_e)`（`65787`）返回 `{blocks[], ...*Injected 标志}`，push 顺序逐条对上：

```
daemon-restart-hint        （push 65817；tag 65820）
  → smart-compact-notice    （65821；空闲自动 compact 后提示，tag 65824）
  → gateway-notice          （65828；包 <system-reminder>，尾附
                              "this context may or may not be relevant…
                               should not respond unless highly relevant" 65834）
  → time-context            （65841；<time-context last_interaction=… current_time=…>）
  → skip-rewind             （65847；仅 isUserMessage!==false 时）
  → interrupted-context     （65853；包 <interrupted-context>）
  → job-receipts             （65859；**v0.8.1 新增**，见下）
  → job-tick                （65863；run_number/triggered_at）
  → board-updated           （65867；广播板刚被潜意识写过的提示）
  → user-input              （65871）
```

**首块 `daemon-restart-hint` 携带重启原因，且只到 channel 会话**（confirmed）。文本由 `renderDaemonRestartHint (Che)`（`62689`）拼成：底句 `[system] You're running under a new daemon process (started <ts>).`，若本次启动认领到了重启原因则追加 ` Restart reason, given by the caller: <reason> (requested <ts>).`。原因来自 `getPendingRestartReason (Ihe)`（`50822`）——一个模块级全局，由 boot 期一次性认领写入（见 §4 论点一末尾的"跨进程旁路"）。**是否注入由 `Phe`(`59964`)门控，非 `channel` 类会话直接判 `out-of-scope`**：`job:` / `meta:` / `cadence:` / `subconscious:` / `system:` 会话永远拿不到这个块，因此"重启原因会到达每个被唤醒的会话"这个直觉是错的。另有 `new-session`（无 `lastEventAt`）与 `grandfather`（无水位）两个阶段只写水位不注入。

**v0.8.1 新增：job 完成回执改走 `job-receipts` 瞬态块，不再唤醒独立 turn（confirmed）。** CHANGELOG 原话："A finished job's completion receipt now arrives as context on the owner's next turn instead of waking a turn of its own"，代码证据链完整：批量组装器 `batchDrainItems (HB)`（`65926`）在挑选"驱动本轮的 mailbox 条目"时，对每条候选先 `tbe(c)`（`66013`）探测——`tbe` 内部先经 `ebe(e)`（`66007`：`e.type==="route.deliver" && payload.source_event_type==="job.complete"` 才返回内层 payload）取出 job 完成投递的内层 payload，再 `dn(t,"job_id")` 取 `job_id`；只要 `tbe(c)!==null`（即这条 mailbox 条目是一次 job 完成投递）就 `continue` 跳过（`65940`）——**job.complete 投递被排除在"本轮驱动条目"之外，不会单独催生一个 turn**。与 `HB` 平行的 `Jot`（`66062`）在同一次 `drainSessionMailbox (W_e)` 调用里对**全部**待处理 mailbox 条目（不止 `HB` 选中的那一批）重新扫一遍，专挑 `tbe(u)` 非空的条目按 `job_id` 分组、渲染成回执文本（单条直接用 `gC` 生成的 prompt、多条经 `Wot` 合并成"as one continuous update"），返回 `{text, eventIds}`；这份 `.text` 经 `W_e` 内 `jobReceipts: C?void 0:$?.text`（`64920`）传给 `UB`，最终作为 `K_e` 调用参数 `jobReceipts: o.jobReceipts`（`64456`）落进上面的 `job-receipts` 瞬态块（tag `"job-receipts"`，`65862`）——**随本轮"真正驱动 turn 的那条事件"一起，作为上下文顺带交付，而不是自己单独催生一次 drain/turn**。这些 job.complete 条目并未被静默丢弃：`Jot` 返回的 `eventIds` 会被 `W_e` 的 `pe()` 收进 `x`（`64686-64687`）随本轮一起 `markDone`（mailbox `.pending` 文件照常被 ack）。mid-turn steering 路径（admission callback 调用的另一条 `UB(t,E,{...})`，`78237`）**不传 `jobReceipts` 字段**，故该机制只在 `W_e` 主批处理路径生效。

**`jobReceiptsInjected` 标志并入既有的注入追踪字段**：`K_e` 返回对象的 `*Injected` 标志集合（`gatewayNoticeInjected`/`interruptedContextInjected`/`skipRewindInjected`/`timeGapInjected`/`jobTickInjected`/`daemonRestartHintInjected`/`compactNoticeInjected`/`boardUpdatedInjected`，初始化于 `65789-65797`）v0.8.1 新增了 `jobReceiptsInjected`（`65794` 初始化 `!1`，`65859-65862` 命中时置 `c=!0`，随返回对象带出 `65882`），语义与其余标志一致——都是"这次调用是否真的往 blocks 里塞了这个 tag"的布尔回执，供调用方按需做消费后收尾（同一 `*Injected` 家族里 `gatewayNoticeInjected`/`interruptedContextInjected`/`skipRewindInjected` 三个在 `W_e` 内被用来门控 `pending_gateway_notice` 等 pending 字段的清空，`64908`）。`jobReceiptsInjected` 本身走的是另一条收尾路径：真正标记回执已消费的是 `Jot` 返回的 `eventIds` 经 `pe()` 并入 `x` 后随本轮一起 `markDone`（`64686-64687`），`jobReceiptsInjected` 只是把"job-receipts 块这次是否真的被塞进 blocks"这一布尔态并入既有的标志集合，不是新机制。

**slash 命令短路**（confirmed）。若用户输入 `e.trimStart().startsWith("/")`（`65799`），跳过全部注入只发 user-input 原文——命令式输入不该被时间/中断噪声污染。

**time-gap 阈值的读取位置**（confirmed）。time-gap 阈值来自 effective config 的 `time_gap_minutes`，但**不在 `K_e` 内读取**：`Z_e`（`65750`）先算 `t=(e.timeGapMinutes ?? Tot)*60*1e3`（`Tot=60` 分钟，`66752`）构造出 timeGap 对象，`UB` 内 `w=Z_e({...})`（`64440`）算好后经 `timeGap:w`（`64455`）传入 `K_e`（`64450`），`K_e` 只消费 `t.timeGap`。

**`/effort` 是运行时旋钮、不属任一注入面**（v0.6.0 引入，具体透传行号本轮未重新核对）。`/effort` 网关命令设置每会话推理力度，落到 run-config 的 `effort` 字段直接透传给 SDK。它既不进 `eh` 的 system-prompt 前缀、也不进 `K_e` 的瞬态 user 块——是与两个注入面正交的模型推理参数（类同 model 选择），故不影响缓存前缀。

---

### 论点三：Claude 与 Codex 共用 `eh`，Codex 只多一层 `<aladuo:system-context>` 壳

**所以呢**：Codex 的系统提示就是 `eh` 那一整串（含 identity/kind/instance/广播板/`Hoe`/runtime/job），二者差异只剩最外层那层壳。乍看代码里存在"两套并行封装器"（`Vpe`/`Wpe`），容易据此推出"双重 `Contents of` 头嵌套""Codex developerInstructions 携带时间戳"两种缓存破坏——但沿真实调用链核验，**这两处漂移在 v0.6.1 运行时都不发生**（那对封装器是不可达死代码，见下）。

**为何 `Vpe`/`Wpe` 的封装分支不可达**（confirmed，静态调用链）：
- `Vpe`（`56685`）/`Wpe`（`56703`）全仓仅在 `56803`/`56804`（`ev` 的 run 内）被调用，用的是闭包 `t`（`ev(e,t)` 的第 2 参 = instructions）。
- 但两处 `ev` 构造都**只传一个 config 参、不传 instructions**：会话管理器路径 `78377` `_.adapter=p({sandbox,ephemeral:!1,model,dynamicTools})`（`p = e.codexAdapterFactory ?? ev`，`77643`）、潜意识路径 `79804` 同样 `ev({sandbox,ephemeral:!0,dynamicTools})`。故运行时 `t===undefined`。
- 于是 `Vpe(t??{},f)` = `Vpe({},f)`：`e.identity/kindPrompt/instancePrompt/memoryBoard` 全 undefined，`56687/56691/56695` 三个分支全不触发——`Contents of …(intuition layer…)` 措辞（`56695`）是**当前路径不可达的死代码**；但第二参 `f` 非空时 `## Runner System Prompt` 分支（`56697`）照常触发，这正是 Codex 拿到 `eh` 文本的通道。`Wpe({}, dynamicTools 名字数组)`：`e.sessionKey/channelKind/runtimeDirectives` 全空 → `## Session Context` 不生成，故 `- timestamp:`（`56707`）**不注入**；但只要第二参非空，`<duoduo-reminder>` 分支（`56712`）仍会产出一个只含该提醒的 `<aladuo:runtime-directives>` 块（`56713`）——即"developerInstructions 完全不产生"只在无 dynamicTools 时成立。

**Codex 实际拿到什么**（confirmed）。`f=Hpe(c.systemPrompt)`（调用点 `56802`）= 把 `eh` 的 preset `{append}` 抽成字符串。`extractSystemPromptAppend (Hpe)`（`56681`）正是 `eh`→Codex 的桥，让 Codex 复用 `eh` 输出这条链闭合。所以 Codex 的 baseInstructions = `<aladuo:system-context>… ## Runner System Prompt\n\n{eh 整段}…</aladuo:system-context>`（`## Runner System Prompt` 分支 `56697`，`<aladuo:system-context>` 壳 `56699`）。

| | Claude | Codex |
|---|---|---|
| 稳定认知来源 | `eh` 输出 | **同一份 `eh` 输出**（经 `Hpe` 抽字符串） |
| system 载体 | `{type:"preset", preset:"claude_code", append}` | `baseInstructions`，内嵌 `## Runner System Prompt` + JE 整段 |
| 外层壳 | 无（纯拼接） | `<aladuo:system-context>` |
| 广播板 / `Hoe` | 有 | **有（同源同文）** |
| 时间戳 | 仅在 user 面（`K_e` time-context） | **无**（`Wpe` 返回 undefined，反而缓存友好） |

**结论**：Codex 的 identity/kind/instance/广播板/`Hoe`/runtime/job 与 Claude 完全同源同文，二者差异只剩最外层 `<aladuo:system-context>` 这层壳。且 Codex 系统提示没有时间戳、比 Claude 更缓存友好。

**适配器选择**（confirmed）。内层选择器 `X(y)`（`76061`）决定路径：codex→`y.codexAdapter`（走上述 `ev`），channel-claude→streaming 包装，其余→裸 `Gd`。

**SDK 适配器兜底**（confirmed）。`Gd`（`createAgentSdkAdapter`，`50087`）仅当 `t.systemPrompt===void 0`（`50096` else 分支）走兜底：`l=SYSTEM_PROMPT`（`50097`）、`u=APPEND_SYSTEM_PROMPT`（`50098`）、`p=[jb(), u].filter(...).join(...).trim()`（`50099-50101`）；`l&&p`→拼接（`50102`）、`l`→整体替换（`50104`）、`p`→append preset（`50104-50108`）。即便未设 `APPEND_SYSTEM_PROMPT`，只要 `jb()` 非空 `p` 就非空并 append meta-prompt（`jb()` 返回 undefined 且未设 `APPEND_SYSTEM_PROMPT` 则 `p` 空、无 append）。permissionMode（`50095`）= `t.permissionMode ?? ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（v0.6.1 无条件兜底到 `bypassPermissions`，不再区分 host）。**注意这是降级分支**：正常 drain 里 `systemPrompt` 由 `eh` 提供，此兜底不进，仅在"上游没给 systemPrompt"时生效。

---

### 论点四：不走 `eh` 的两条旁路——潜意识分区注入与指纹漂移信号

**所以呢**：`eh` 装配的是前台会话的稳定认知。系统还有两处独立于 `eh` 的上下文机制：潜意识分区会话用另一套注入器（它没有前台对话历史，需要绝对路径 + 收件箱），以及 `uot` 产出的 instructions 指纹（它不进任何提示词，只驱动 resumed session 失效）。厘清这两条旁路，才能解释"为何 `uot` 要重算 identity/kind/instance 却不用于提示词"。

**潜意识分区注入**（confirmed）。partition（`meta:subconscious`）不走 `eh`：
- `_ct`（`79782`）：`## Runtime Context` + Timestamp + Sessions + `### Key Paths`（含 `memoryBroadcastPath` 等全绝对路径）。
- `bct`（`79789`）：`## Inbox` + "After processing each item, delete the corresponding file … to ack it."——每条 `.pending` 文件，处理后删文件 ack。
- 另有 **Session Mailbox 旁路** `BE`(`32620`)：`["# Session Mailbox","","## Inbox",""]`（`32621`）写盘供 agent 主动 Read，不进 system prompt——属"working notes"层。

**`uot` 的真正用途：instructions 指纹 / 漂移失效**（confirmed）。`Jwe`(`76573`)确实存在——它与 `runInstructionsFingerprintGuard (SO)` **同在 `78150` 调用，且 `Jwe` 的输出被喂入 `SO` 指纹守卫**（而非"被 `SO` 调用"）。但它**不进任一路的实际提示词**（Claude 用 `jb()`+effective_config，Codex 用 `eh` 输出）。它的实际用途有二：
1. 产出 `memoryBoard`（`76577` `transcludeBroadcastBoard (Uwe)…rendered.trim()`）供 `eh` 两路复用——经 `78528-78531` 打包成 `{path, content}` 进 drain 配置的 `memoryBoard`；
2. 在 `78150` 喂给 `runInstructionsFingerprintGuard (SO)`（守卫定义在 `76428`）算 instructions 指纹做漂移检测——指纹 = `computeInstructionsFingerprint (bw)`（定义 `76374`）= `sha256(JSON.stringify([identity??"", kindPrompt??"", instancePrompt??"", memoryBoard??"", mission??""]))`（每元素带 `?? ""` 兜底），**另有一个条件第六元素**：`e.missionAcceptance` 非空时 push 进同一数组（`76375`）——即 job 的 acceptance 文本也是漂移信号面的一部分。

**board 层与指令层解耦**（confirmed，v0.6）。`SO` 除全量指纹外，另算 board 层哈希 `I6(n.memoryBoard)`（`76433`；`computeBoardLayerHash` 定义 `76379`）与非 board 指纹 `P6(n)`（`76434`；`computeNonBoardInstructionsFingerprint` 定义 `76383`，把 `memoryBoard` 置 undefined 后复用 `bw`）。当且仅当 board 层变而非 board 指纹不变时判 `boardOnlyDrift`（`76435`：`board_layer_hash !== c && instructions_nonboard_fingerprint === d`）——此时 gate2 触发但 **不再拆会话，只 pin streaming 前缀**（`78160` `"board-only drift — pinning streaming prefix (no teardown)"`，无活跃 streaming 时退化成 `78163` 的 `"nothing to pin"`）；仅真正的非 board 指令漂移才在 `78160` 的 `gate2Fired && runtime==="claude"` 守卫下发 `session.streaming_invalidated`（reason `"instructions_drift"`，`78166-78168`）。即"广播板刷新不再白白击穿正在跑的 streaming 前缀，只有身份/人格/mission 真变了才失效"。

即 `uot` 的 identity/kindPrompt/instancePrompt 只进指纹、不进提示词——它是驱动 resumed session 失效的独立信号面。此外 `I_e`(`64376`)/ `autoloadAdditionalDirectoryClaudeMd`（`65003`/`65305`，env 旗标在 `tu:48400`）门控 memoryBoard 与 additionalDirectories 的 CLAUDE.md 自动加载，是广播板之外第二条"文件即上下文"注入。

---

> **给 Agent PM 的洞察**
> - **双注入面是本框架最可复用的单点设计**：稳定认知放 system prompt（每会话装一次、利于缓存前缀命中），易变运行时状态放 user 消息瞬态注入。既保护缓存前缀，又让 agent 感知"时间流逝""被中断"等它本无的具身信号。这正是本节领起结论的核心——两个注入面的正交切分。
> - **"共用装配器 + 薄外壳"胜过"两套并行封装"**：核验推翻了原以为的"Claude/Codex 各写一套装配器"。真相是两路共用 `eh`，Codex 只多套一层 `<aladuo:system-context>` 壳（`Hpe` 桥接）。多模型后端 agent 应把"装配面共用、执行面才分叉"作为纪律，避免各写一遍导致措辞漂移（本次核验中原以为的"双 `Contents of` 头""Codex 时间戳"两处漂移，实为不可达死代码，根本不发生）。装配同、执行异——执行/命令面的后端分叉见 §8。
> - **广播板 = 潜意识→意识的单一通道**：后台把跨会话 durable 启发式压成"一行一指针"的直觉层，前台每个新会话经 `eh` 第 4 层自动加载。`[[slug]]` 指针 + `DWe` 纪律实现"默认不展开、触发才读 dossier"，控制上下文膨胀。全新安装板为空即无注入——渐进式冷启动。
> - **`override` vs `append` 是干净的能力边界开关**：默认 append 复用 Claude Code 内置提示（工具/安全/格式），override 让通道完全自定义人格。三层 prompt（identity/kind/instance）+ override = "共享内核 + 通道特化 + 实例特化"清晰叠加。
> - **指纹与提示词解耦**：`uot` 重算 identity/kind/instance 却只喂指纹、不喂提示词，用漂移信号（`instructions_drift`）独立驱动 resumed session 失效——把"内容是否变了"的检测与"内容如何装配"彻底分离。v0.6 更把 board 层与指令层拆开（`boardOnlyDrift`），广播板刷新只 pin 前缀、不再拆会话，值得任何做 session resume 的运行时借鉴。
> - **gateway-notice 机制**：把模型上下文外执行的带外动作，作为 `<system-reminder>` 告知"已生效、勿重复"，解决了"带外副作用与模型认知不同步"的经典问题，任何有旁路控制面的 agent 都该借鉴。

---

### 论点五：job 的 SDK 配置只有两层，因为它的 kind 层从不加载

**所以呢**：通道会话的配置是"内置默认 → kind 层 `kernel/config/<kind>.md` → 实例层 descriptor"三级叠加。job 会话看起来也是三级——`bootstrap/config/job.md` 随包发布、自称"This is the KIND layer for every job session on this host"、`ManageConfig(kind="job")` 也写得进去——但**运行时没有任何路径会读它**。job 实际只有"内置默认 + job frontmatter"两级。

**叠加实现**（confirmed）。job frontmatter 可携带 5 个 SDK 键（`prompt_mode` / `allowedTools` / `disallowedTools` / `additionalDirectories` / `claude: {tools}`），由 `applyJobSdkConfigOverride (u4)`（`daemon.pretty.js:50525-50541`）叠到 effective config 上：

```js
!e || !t ? e : { ...e,
  prompt_mode:           t.prompt_mode           ?? e.prompt_mode,
  allowedTools:          t.allowedTools          ?? e.allowedTools,
  disallowedTools:       t.disallowedTools       ?? e.disallowedTools,
  additionalDirectories: t.additionalDirectories ?? e.additionalDirectories,
  claudeTools: mergeClaudeToolLists(e.claudeTools, t.claudeTools),
  claudeModelProfiles:      EU(e.claudeModelProfiles, t.claudeModelProfiles, n=>({...n, source:"instance"})),
  claudeModelProfileIssues: /* append */ ...,
  claudeModelAliases:       EU(e.claudeModelAliases, t.claudeModelAliases, ...) }
```

**前四个键是整体替换，只有 `claude.tools` 是并集**——`job.md` 自己的注释只写了后者是 union，没说前四个是 replace。两条 drain 入口都包了它（批量/admission `62788`、长驻流式 `61069`），且 job 快照**每 turn 从磁盘重读**（`76408`），所以改一个在跑的 job 文件下一 turn 即生效。

**v0.7.1 新增第六类叠加键：per-model 上下文窗口与 endpoint 路由。** `claudeModelProfiles` 走 `EU(e,t,n)`（`daemon.pretty.js:50502-50509`）——一个**按 key 逐条覆盖**的浅合并：`t` 里每个 key 覆盖 `e` 里的同名 entry（并打上 `source:"instance"` 标记），`e` 独有的 key 原样保留；不是整表替换。同一模式复用于 `claudeModelProfileIssues`（append）与 `claudeModelAliases`（逐 key 覆盖）。这组 profile 最终在 `classifyModelContextRequirement (z2)`（`61919-61939`）里查表命中后，经 `j9e`（`49774-49783`）落到 SDK 设置文件的 `CLAUDE_CODE_MAX_CONTEXT_TOKENS`/`ANTHROPIC_BASE_URL` 环境变量覆盖——即"job/channel frontmatter 可以给单个模型 id 指定独立的上下文窗口上限和第三方 endpoint"，且合并语义是"实例层逐条覆盖全局层，而非整表替换"，与 `claudeTools` 的并集语义、`prompt_mode` 等键的整体替换语义都不同——**这一个 `applyJobSdkConfigOverride` 函数里，五种键分别用了并集/整体替换/逐条覆盖三种不同的合并策略**，读代码前不能假设统一规则（confirmed，逐行核对）。

**v0.8.0 新增第七类叠加键：pi 运行时与 Claude 共用同一个 job-config 叠加口（confirmed，逐行核对）。** `applyJobSdkConfigOverride (u4)` 在 v0.8.0 里新增了 `piExtensions: t.piExtensions ?? e.piExtensions`、`piSkills: t.piSkills ?? e.piSkills`（均为整体替换）、`piConfigIssues: Qpe(e.piConfigIssues, t.piConfigIssues)`（`Qpe(e,t)=!t||t.length===0?e:[...e??[],...t]`，append 语义，与 `claudeModelProfileIssues` 同款）三个键（`daemon.pretty.js:59635-59637`）。即 pi 作为第四个 runtime 后端并不单独另开一套 job 覆盖通道，而是复用 Claude 那一份 `applyJobSdkConfigOverride`——job/channel frontmatter 能像给 Claude 指定 `claude.tools`/`claudeModelProfiles` 一样，给 pi 指定它自己的 extensions/skills 列表并把配置校验问题整体 append 记录下来。这与 skills 文档新增的 `pi-runtime.md`（"pi as the fourth runtime"）互证：pi 复用的不只是外层的 kind/instance/job 三层调度骨架，连"实例层如何叠加进 effective config"这条最细的缝都与 Claude 共用同一份实现，不是并排另写一套。

**kind 层为何失效**（confirmed）。kind 描述符按 `event.source.kind` 选，再读 `<kernelDir>/config/<kind>.md`。而 job 的 drain 锚点事件来自 cadence 扫描器（`source.kind="cadence"`，`78227`）或 notify 唤醒（`"route"`，`81286`），**永远不是 `"job"`**。一个无需插桩的观测症状：每个 job 的 system prompt 里 `## Runtime Context` 渲染出的是 `channel_kind: cadence`（`49770` 读同一个对象的 `channel_kind`）。

**这一层的边界**（confirmed，均为容易踩的反直觉点）：

- `allowedTools` 只自动批准权限、**不能扩面**——它与决定工具面的 `tools` 来自互不相交的两个源（`62835`），SDK 选项构造处还会显式检出并告警（`49346`–`48934`）。真正加内建工具的是 `claude.tools`（工具参数里叫 `extra_tools`，`72094`，handler 改名成 `claudeTools`，`71928`）。
- 四个列表键对 daemon 自带基线是**并集**（`62835`–`62849`），所以 job 无法移除 `ManageJob`/`ManageSession`/`Notify` 的自动批准，也无法去掉 memory 目录。
- 同一个 MCP 工具同时写进 `allowedTools` 和 `disallowedTools`，静默判为 ALLOWED（`62252`），无提示。
- 非法 `prompt_mode` 值被静默丢弃而非拒绝（`34775` 返回 undefined，`56335` 仅在有值时回填）——打错字的 job 会安静地带着 preset 跑。
- **给 job 设 `additionalDirectories` 会反向打开 additional-directory 的 CLAUDE.md 自动加载**：抑制逻辑 `khe`（`62774`–`62778`）只在列表恰等于 `[memoryDir]` 时返回 `false`；job 一旦自己加一个目录，`CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`（`48947`）对整个列表生效，**包括 memory 目录**——而 memory 目录的 `CLAUDE.md` 正是已作为 system-prompt 第 4 层注入的广播板（`49772`–`48820`）。防重复注入的守卫被这条路径绕开。
- `prompt_mode` 是 claude-only：建作业时 `ManageJob` handler 对 `runtime === "codex"` 硬拒（`71905`，文案 `69389`）；运行期另有软警告 `[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert`（`76328`–`76335`）。但**硬拒对最需要它的场景是空转的**：序列化时 `runtime === "claude"` 就不写进文件（`56889`），而 `ManageJob` 工具的 zod runtime 枚举 v0.7.1 起**按当前可用运行时动态构造**（`stt()`：claude/codex/grok 逐一探测 push、pi 无条件追加，`daemon.pretty.js:58489-58492`）、默认取 `t[0]` 或本会话已有 runtime（`hme` 内 `58500`）——单 Claude 主机上 `t[0]` 仍是 `"claude"`，但 `ALADUO_DEFAULT_RUNTIME=codex` 且 codex 可用的主机上，zod 默认值也会变成 `"codex"`。所以在这类主机上建一个带 `prompt_mode` 的 job 根本不触发硬拒，只在跑起来时拿到那条日志。
- JSON-RPC 的 `job.create` **没有**这 5 个键（`83261`–`79350` 只透传 `{cron, notify, owner_session, cwd_rel}`），SDK 配置只能经 `ManageJob` 工具或手改文件设置。

---
## §2 Turn/Drain 循环与 SDK

Turn/Drain 把离散用户消息重写为"带合并窗口的邮箱批 + 单一长驻流式 SDK 会话"：一次 drain 只在可合并谓词允许的**前导窗口**上发一次 query，靠 **单 turn 准入门控、PostToolUse additionalContext 注入、三态抢占边界、hold-stdin** 四条控制线，在不重开对话的前提下实现 turn 合并、mid-turn steering、后台 subagent 续跑与优雅抢占。下面四个论点自上而下拆解这句话：先是"离散消息如何被循环切成批"，再是"一个批如何变成一次 SDK query"，然后是"长驻会话上四条控制线如何不重开对话地续接后到消息"，最后是"失败如何收敛"。

### 论点一：循环层是 `Se`，不是 `drainSessionMailbox (W_e)`——一次 drain 只吃"一个前导可合并窗口"

**所以呢**：理解"多条消息为什么被分多次 turn 消费"的关键，是把"循环"与"单批处理器"分层。`drainSessionMailbox (W_e)` 不是 drain 循环，它是每次迭代被调用一次的**单批处理器**；真正的循环是 `Se`（内部函数，无导出名）。`HB` 即 `batchDrainItems`（切合并窗口）。一次 `W_e` 只从 mailbox 顶部切出**一个**可合并窗口（单 batch），窗口边界外的事件留给 `Se` 的下一次迭代——所以"离散消息 → 若干 turn"是靠循环反复调用、而非一次合并成多批实现的。

- **drain 循环本体 = `Se`（`daemon:72660`），再抽循环 `for (; y.status !== "ended" && E;)`（`daemon:72756`）**。`ee.drainPromise` 在 `daemon:72485`/`76267` 被赋值为 `Se(ee)`（或 `preStart().then(()=>Se(ee))`）；状态字面量里的 `drainPromise: null`（`75461`）只是字段声明，不是"进入循环"。`W_e` 在循环体内每次迭代调用一次（调用点 `daemon:73035`）。
- **`W_e`（`daemon:59735`）单批骨架**：`mailbox_merge`（`vk`，`62996`）→ `mailbox_parse`（`Wg`，`63007`）→ `mailbox_render`（`Kx`，`63028`）→ `eq(...)` 切窗口。选项键在 tfe 侧读作 `n.batchSize ?? Z5e`、`n.mergeWindowMs ?? W5e`（`60455`/`60456`，默认 `Z5e=5`、`W5e=180000ms`），传入 `HB` 时命名为 `fallbackBatchSize`/`mergeWindowMs`（`60459`-`60462`）。
- **`HB`（`daemon:61190`）只返回单一 batch**：顺序累积 items 到数组 `i`，遇 `i.length >= fallbackBatchSize`（notify 批则 `Infinity`）/ notify-homogeneity 变化 / `Math.abs(p - s) > mergeWindowMs` / 不同目标 就 `break`，剩余事件留给下一次 `Se` 迭代（`64482`-`63833`）。随后 tfe 把该单一 batch 解析成事件列表 `ee`，再用可合并门 `R8e(ee, t)`（`60739`）决定走向：合并成立 → **`lB` 一次（`63315`）+ `Qde` 一次（`63362`）**发一次 query；否则逐事件 `for (let V of ee)` 各自 `Qde`——"每个可合并批发一次 query"成立，但"一次 eq = 若干 batch"不成立。
- **真正的合并门是可合并谓词，比 mergeWindowMs 更决定性**：`R8e`/`I8e`/`ofe`/`GU`/`P8e`（`daemon:61241`-`64517`）——`R8e`：`e.length < 2` 不合并；全 `channel.message` 批走 `I8e`（要求无 `/` 斜杠命令）再 `ofe`，全 notify 批（`GU`）走 `ofe`；`ofe` 要求同一 `primaryTargetSessionKey`（`set.size===1`）。telemetry `sdk_start` 携带 `coalesced: ee.length>1`（`63356`）。

### 论点二：SDK 适配层把 duoduo run-config 诚实翻译成一次 `query()`

**所以呢**：一个 batch 变成一次 SDK 调用，中间隔着一层把内部 run-config 翻成 SDK options 的适配器 `createAgentSdkAdapter (Gd)`。这一层的分支（systemPrompt / permissionMode / thinking）直接决定"发出去的 prompt 长什么样、缓存能不能吃满",错一个分支就打偏。

- **query 本体**：从 `@anthropic-ai/claude-agent-sdk` 导入（`daemon:48110`/`62734`）。两种执行通道：非流式 `run`(`50146`)与流式 `createStreamingQuery`（`50378`，`includePartialMessages:!0`）。
- **`permissionMode` 优先级（v0.6 已改为无条件兜底）**：`t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`daemon:48366`）。v0.5.8 曾把兜底做成"仅 host 模式才 `bypassPermissions`（`Ho(process.env)==="host"`）、否则 `void 0`"；v0.6.1 去掉了 host 条件判定，**最终兜底无条件落到 `bypassPermissions`**。
- **`systemPrompt` 分支**：**仅当未设 `SYSTEM_PROMPT` 且存在 append 内容时**才用 `{type:"preset", preset:"claude_code", append:p}`（三元在 `49878`-`49890`，preset 字面量 `49888`）；一旦 `SYSTEM_PROMPT` 有值，用裸字符串（`u` 或 `u\n\np`），不走 preset。append 组装 `p = [resolveMetaPromptText(), c].filter().join`（`49880`），即 `resolveMetaPromptText() (w_)`（duoduo 基座提示，导出于 `49048`）拼 `APPEND_SYSTEM_PROMPT`。
- **工具集（v0.5.10 已由 denylist 改为 allowlist）**：`allowedTools`/`mcpServers`/`additionalDirectories` 透传；`tools` 取 `[...new Set(t.tools)]` 作为**显式内建工具面**（`49894`）。`disallowedTools` 经 `splitDisallowedToolsForClaude (Ade)`（`49624`）拆成 `{mcpTools, builtIns}`，**只保留 `mcpTools` 作为 disallowedTools，builtIns 被忽略并告警**（"allowlist-only via claude.tools"，`49885`）；`allowedTools` 里不在工具面上的项由 `$de`(`49819`)挑出并告警。旧的 `DEFAULT_DISALLOWED_TOOLS` denylist 已退役。
- **thinking 开关**：`includePartialMessages` 触发时只置 `r.includePartialMessages=!0`（`daemon:48402`）；v0.5.8 里"强制 `maxThinkingTokens=0`"的分支已移除——适配器不再改写 thinking 预算（`maxThinkingTokens` 在 daemon 内仅剩错误提示串里出现，见论点四）。
- **适配器选择 `X(y)`（`daemon:72457`）**：codex + codexAdapter → codexAdapter；`origin!=="channel"` 或无 `createStreamingQuery` → 一次性适配器 `o`；否则惰性长驻 `streamingAdapter`（经 `Oe(y,T)` 创建）。

### 论点三：长驻流式会话上，单 turn 准入 + steering lane 不重开对话地续接后到消息

**所以呢**：这是本节最独特处。同一 session 复用同一个长驻 `query()` 进程，输入由队列驱动的 async generator 逐块喂入；于是"合并、steer、抢占、后台续跑"全部被实现为对这条长驻输入流的操控，而非新开对话。**v0.6.1 的关键变化：流式槽一次只准入一个对话 turn，后到消息不再折进正在跑的 turn，而是走显式 steering lane（`pendingSteer`）**——这修掉了旧版"后到消息折进 accepted turn 导致会话可能永久 busy"的隐患。四条控制线各管一件事：

**(a) sessionId 粘连 + 配置指纹重建——复用的边界。** 复用现有 `streamingState` 的条件（`Oe` 内，`daemon:71905`）：`streamingState && !closed && !needsRecreation && configSignature===j && (hasAcceptedTurn || initialSessionId===N)`。指纹经 `Q(y)`（`75310`）= `JSON.stringify({cwd, settingSources, persistSession, permissionMode, allowedTools, disallowedTools, tools, additionalDirectories, autoloadAdditionalDirectoryClaudeMd})`（v0.6.1 新增 `tools` 键，随 allowlist 化）。**配置指纹变化就重建**：复用失败 → `await W(y)`（`74547`）关旧 query + abort + await loopPromise → 重新 `createStreamingQuery`。输入生成器 `xi()`（`75505`）由队列类 `cP`（`73960`，`items/waiters/enqueue/dequeue/drain`）驱动；turn 项在 `76074` 入列（含 `accepted/streamedText/turnStreamedText/toolUseMap/toolBlockIndexMap/skipCalled/interruptRequested`）。

**(b) 单 turn 准入门控——一次只喂一个 turn，后到者走 steering。** 生成器 `xi()` 每次 `dequeue` 出一个 turn 项前先看 `Ne.currentTurn`：**若槽已被占（`currentTurn !== null && currentTurn !== ue`），新 turn 直接 `reject`（`daemon:71954`，"Streaming slot occupied — prompt not yielded"）**，不再像 v0.5.8 那样把新入列 prompt 灌进正在跑的 turn。占槽成功才 `currentTurn = ue`、`accepted = !1`，随后 `for await (let me of ue.input.prompt) yield me`（`74693`）。turn 的 `accepted` 在其 SDK `init` 事件到达时置真（`daemon:72294`：`hasAcceptedTurn=!0, Q.accepted=!0`）——**accepted 只标记"该 turn 的 prompt 已被 SDK 接纳"，不再作为"是否折入新 prompt"的开关**。所以合并已发生的 turn、以及未及入槽的后到消息，都改由 (c) 的 steering 通道处理，`streamingState` 里旧的 `orphanExecuting` 也换成了 `cliTurnTentative`（+ `loopPromise`）。

**(c) mid-turn steering——park 在 admission callback，消费在 PostToolUse hook。** 入队/park 的**决策发生在 admission callback（`daemon:72827`）**，它是与 `W_e` 并行的第二条 SDK 入口：在已有 live streaming turn 时被调用，自己调 `UB`（`78237`）生成 `coalescedPromptText`，再按 runtime 分叉——claude 走"park/append `pendingSteer`"。park 判据 `!!ko && ko.accepted && !ko.skipCalled && !ht && !Sr.isNotifyOnly && Tn.length>0`（`76568`，`ko = Dn.currentTurn`；**v0.6.2 新增 `!skipCalled` 项**，已决定沉默的 turn 不再吸收新入站消息，落空后走 `y.pendingWake=!0, y.wakeResolver?.()`（`76634`）当新 turn 重新 drain）：已有 `pendingSteer` 且 `spawningTurn===ko` 则追加（`72947`，打印 "appended claude steer"），否则新 park（打印 "parked claude steer"，`76626`），`pendingSteer` 字段在 `75869`（`steerText/eventIds/claimedEventIds/enqueueAsNewTurn/spawningTurn/requeueLines/requeueEventIds/processedEventIds/settled`，v0.6.1 新增 `spawningTurn`）。**注入（消费）发生在 PostToolUse hook（matcher `"*"`，`75548`-`72788`）**：检查 `pendingSteer` → `settled` + `markDone` → 以 `hookSpecificOutput.additionalContext = ue.join("\n\n")`（`75594`）返回给 SDK。**v0.5.8 里独立的 `pendingNotifySteer`（把后台 Agent 完成回调冒泡进当前 turn）已在 v0.6.1 移除**：后台 Agent 完成改由 Claude CLI 原生续写单独负责（completion-owner `"claude-cli"`），duoduo 只把 `task_notification` 记成 WAL-only 生命周期事件，不再制造重复回调 turn。

**(d) 三态抢占边界——`G()` 置标志、`L(y)` 才扳机。** `pendingPreemptBoundary` 为三态 `"accept" | "tool_use" | "tool_result"` + hard/soft 两档强度。设值函数 `G(y,T,j)`（`daemon:71818`）：query 在时——tool_result 且有活跃工具则置 `tool_result`（`75324`）、未 accept 则置 `accept`/`defer_accept`（`74568`）、否则立即 `C(y)`；非流式路径另有 tool_use 与 `soft` 软抢占分支（`75328`）。**但 `G()` 只置 pending 标志；真正的 abort 由执行事件闭包 `L(y)`（`daemon:71813`：query 在则 `C(y)` interrupt、否则 `abortController.abort()`）消费**——`onExecutionEvent` 里 tool_use 到达时 `activeToolUseIds.add` + 若 `boundary==="tool_use"` 则清标志并 `L(y)`；tool_result 时 `delete` + 若 `boundary==="tool_result" && size===0` 则 `L(y)`（`76770`/`76770`）；accept 边界则在 `init` 处由 `C(y)` 兑现（`75908`）。二者分离正是"deferred preempt 何时兑现"的答案。Codex 路径改走 `turn/steer` RPC（`59965`），失败回退（`59971` "falling back to new turn"，`76544` "codex turn/steer landed"，`76551` "codex steer fell back to redrain"）。

**(e) hold-stdin——后台 subagent 续跑。** drain 传 `holdInputOpenForBackgroundAgents = runtime==="claude" && origin!=="channel"`（`daemon:73042`，tfe 侧 `60795` 透传）。非流式 `run` 中 `E = holdInput...`（`50007`），prompt 换成生成器 `Oe()`（`50034`：`for await ... yield A; await C`）：yield 完 prompt 后 `await C` 让 stdin 不关，后台 subagent 完成回调（in-process MCP）仍可送达。`C` 的 resolve 走 `Q()`（`49057`：`$ && R.size===0 && P()`）——**需同时满足 `$`（已收到 result，`277` 行置 `$=!0`）与 `R.size===0`**（`R` 增删来自 SDK system 事件 `task_started`/`task_notification`），非仅"后台 task 跑完"。idle 看门狗 `L = Az(ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5)`（默认 10min，`50015`），触发打印 "hold-input idle watchdog fired"（`50028`）；另有 abort-close 看门狗 `g = Az(ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4)`（`49457`）。

> **Skip 语义在 v0.6.2 从"中断"降为"hook 裁决"**（confirmed）。v0.6.1 里 hook 只记标志，真正结束 turn 的是随后在 `tool_result` 边界调用的 SDK `query.interrupt()`（流式带调试标签 `"anchor-turn skip"`，非流式打 `[claude-sdk] Skip called — interrupting turn (non-streaming)`）——这次中断顺手拆掉了本 turn 内启动的全部后台 task。v0.6.2 让两条路径的 PreToolUse hook 直接**返回** `{continue:!1, stopReason:"The agent intentionally ended this turn silently by calling Skip."}`（流式 `75479`-`75564`，非流式 `49948`），interrupt 调用与 `interruptRequested` 字段整条删除；`query.interrupt()` 只剩会话级用途（真实用户打断 / 会话回收，`75217`）。**后台 worker 能活下来不是因为新增了保护，而是因为杀死它们的那个动作没有了。**
>
> 同时新增 `agent_id` 子代理护栏（`75560` / `49948`）：`hookInput.agent_id !== void 0` 即认定来自子代理，不再去标记父 turn 的 `skipCalled`——v0.6.1 里子代理调 Skip 会让父 turn 以 `text:undefined, skipped:true` 收尾并抑制 outbox。非流式适配器另把单一粘滞标志拆成三个（`d` 当前 turn、`p` 本 run 曾 skip、`f` 本 run 有产出，`49936`-`49938`），且 `d` 在每个 `result` 处复位（`49596`），因此"首个 turn 被 skip"不再抹掉同一次 run 的后续结果与流式文本。
>
> drain 侧未变：codex 补 `ut.skipped=!0`（`63483`），`if (ut.skipped) L=!0` 抑制 outbox（`63483`/`63822`）。**Skip 工具本身的名称、描述与输入 schema 跨版本逐字节相同**（`48838`）——包括那句"Calling Skip immediately ends this turn"和对 `<skip-rewind>` 的承诺；模型侧契约没动，动的只是运行时的执行方式。由此产生一个开放风险，见 §9。

### 论点四：失败面收敛成一条用户可见文本 + 一个 spine 事件

**所以呢**：SDK turn 抛错不会静默丢失或裸露堆栈，而是被产品化成统一格式，既能回给用户又能进事件日志（可被后续 drain 与 usage 复算）。v0.6.0 起 **drain 错误即时上浮**——`handleDrainError` 在 catch 处直接 `throw`，不再滞留到下一 tick。

- **drain-error（`daemon:60268`-`60858` 抛出、`64861` 处理）**：tfe 的 try/catch 中取消类错误 `isAgentSdkTurnInterruptedError (Nb)`（`63395`）/`isAgentSdkPromptNotAcceptedAbortError (Db)`（`63414`）/第三类判定 `X2`（`65255`，与 db/fb 并列的 `X2(C)||bb(C)||vb(C)` 判定式）走 cancelled 收尾；其余 `throw await gm(..., {stage:"sdk_turn"})`（`60855`/`60858`，逐事件路径另有 `61179`/`61182`）。`$v`（`66356`）生成用户文本 `` `[duoduo:drain-error] agent turn failed at ${n.stage}` ``（`64864`，后接 `T8e(r, n.hintContext)` 诊断），并向 spine 追加 `type:"agent.error"`（`64912`-`64895`）。
- **执行事件桥接**：包装器 `xi`（`daemon:60127`）统计 tool_use/tool_result 计数、捕获 `compact_boundary`，喂 drain record 的 `tool_calls`/`tool_errors` 与 `session.compact`，也是 spine `agent.*` 事件的上游。**活体印证**：`spine.tail` 可见 `agent.tool_use`/`agent.tool_result` 从 SDK 适配器路径流出，印证 `YU/Qde` → onExecutionEvent → session.execution/spine 的桥接。
- **开关**：`DISABLE_ADAPTIVE`/`DISABLE_THINKING`/`DISABLE_INTERLEAVED_THINKING`/`MAX_THINKING_TOKENS` 现只出现在诊断提示串 `F8e`（`64180`-`62175`，含"第三方 endpoint 关 thinking"与"这些旋钮是 Claude-only"两段话术）；daemon 内无读取这些 env 的分支，故 duoduo 自身不消费——但底层 claude 二进制是否透传消费属**未证实推测**。

### 证据表

| 机制主张 | 证据（字面量/代码片段） | 位置 | 置信 |
|---|---|---|---|
| drain 循环本体是 `Se`，`W_e` 是循环体内单批处理器 | `ee.drainPromise = Se(ee)`；`for (; y.status !== "ended" && E;)`；`tfe(...)` 调用点 | daemon:72658 / 72756 / 73035 | confirmed |
| 一次 `W_e` 经 `HB` 只切出一个前导可合并窗口（单 batch），余留给下次迭代 | `HB` 顺序累积，遇 batchSize/notify 变化/mergeWindowMs/不同目标 `break`，`return {items:i, events:r}` | daemon:59735 / 61067-61102 | confirmed |
| 合并谓词（同目标、无斜杠命令、notify-homogeneous）是合并的真正边界 | `R8e`（`length<2` 拒）/`I8e`（`startsWith("/")` 拒）/`ofe`（`size===1`）/`GU`/`P8e`；门 `R8e(ee,t)` | daemon:61241-61272 / 60152 | confirmed |
| SDK 调用即 `@anthropic-ai/claude-agent-sdk` 的 `query` | 从 `@anthropic-ai/claude-agent-sdk` 导入 | daemon:48110 | confirmed |
| permissionMode 优先级，v0.6 无条件兜底 bypass | `t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（host 条件已移除） | daemon:48366 | confirmed |
| systemPrompt 仅当未设 SYSTEM_PROMPT 且有 append 才用 preset；否则裸字符串 | `if (t.systemPrompt!==void 0)...else{}`；`{type:"preset",preset:"claude_code",append:p}`；`p=[resolveMetaPromptText(),c].filter().join` | daemon:48367 / 48349 / 48357 | confirmed |
| 工具面已 denylist→allowlist：`tools` 显式面 + `splitDisallowedToolsForClaude` 只留 mcpTools | `tools=[...new Set(t.tools)]`；`{mcpTools,builtIns}=Goe(...)`；builtIns 忽略并告警 | daemon:48383 / 48096 / 48374 | confirmed |
| includePartialMessages 只置流式旗标，不再改 thinking 预算 | `n?.includePartialMessages && (r.includePartialMessages=!0)`（无 `maxThinkingTokens=0`） | daemon:48402 | confirmed |
| 适配器选择 `X(y)` | codex→codexAdapter；非 channel/无 streaming→一次性 `o`；否则长驻 streamingAdapter（`Oe`） | daemon:72457 | confirmed |
| streamingAdapter sessionId 粘连复用条件 + 指纹重建 | `streamingState && !closed && !needsRecreation && configSignature===j && (hasAcceptedTurn||initialSessionId===N)`；`Q(y)` 指纹含 `tools`；重建走 `W(y)` | daemon:71905 / 71654 / 71671 | confirmed |
| 长驻流式输入靠队列驱动 generator | `async function* xi(){ ... for await (let me of ue.input.prompt) yield me }`；队列类 `Xh`；turn 入列 | daemon:71940 / 71135 / 72293 | confirmed |
| **单 turn 准入**：槽已占则 reject 后到 turn，不折进正在跑的 turn；accepted 只标记 SDK 接纳 | `if (ye!==null && ye!==ue) ue.reject(new Ui("Streaming slot occupied ..."))`；`init` 处 `hasAcceptedTurn=!0, B.accepted=!0` | daemon:71954 / 72118 | confirmed |
| steering 决策在 admission callback（park），消费在 PostToolUse hook（注入） | `UB` 生成 coalescedPromptText；park 判据 `!!ko&&ko.accepted&&!ko.skipCalled&&!ht&&!Sr.isNotifyOnly&&Tn.length>0`；"parked claude steer"；`additionalContext=ue.join("\n\n")` | daemon:72827 / 72941 / 72999 / 72006-72026 | confirmed |
| notify-steer 路径已移除，后台 Agent 完成单一 owner | 无 `pendingNotifySteer`；`completion_owner:"claude-cli"`；`task_notification` recorded WAL-only | daemon:71883 / 71704 | confirmed |
| 抢占三态 accept/tool_use/tool_result + hard/soft；`G()` 置标志、`L(y)` 扳机 abort | `G(y,T,j)` 三分支；`"defer_accept"`/`"defer_tool_use"`/`"defer_tool_result"`；`L(y)` 消费 `activeToolUseIds.add/delete` | daemon:71818-71645 / 72691 | confirmed |
| Codex 走 turn/steer RPC，失败回退 redrain | `r.request("turn/steer",...)`；"falling back to new turn"；"codex steer fell back to redrain" | daemon:57981 / 57869 / 72746 | confirmed |
| hold-stdin：`await C`，resolve 需 `$ && R.size===0`，含 idle 看门狗 | `holdInputOpenForBackgroundAgents`；`Oe(){...yield A; await C}`；`Q()=$ && R.size===0 && P()`；`L=Az(...,6e5)`；"hold-input idle watchdog fired" | daemon:73042 / 48499 / 48486 / 48480 / 48493 | confirmed |
| Skip 以 PreToolUse hook 返回 `{continue:!1, stopReason}` 结束 turn，不再 interrupt（v0.6.2） | `stopReason:"The agent intentionally ended this turn silently by calling Skip."`；`agent_id` 子代理护栏 | daemon:71990-71998 / 48437 | confirmed |
| Skip 联动跳过 SDK 结果并抑制 outbox | `Ne.currentTurn.skipCalled=!0`；drain 侧 `ut.skipped=!0`；`if(ut.skipped) L=!0` | daemon:72170 / 60304 / 60623 | confirmed |
| 已 Skip 的 turn 既不消费也不吸收 steer（v0.6.2 新增，上游未声明） | PostToolUse 顶部 `skipCalled → return {}`；admission park 判据新增 `!Bs.skipCalled` | daemon:72004-72005 / 72941 | confirmed |
| drain-error 冒泡为文本回复 + spine 事件（v0.6.0 即时上浮） | `[duoduo:drain-error] agent turn failed at ${n.stage}`；`type:"agent.error"`；throw at `stage:"sdk_turn"` | daemon:61593 / 61500 / 60148 | confirmed |
| 执行事件包装器 `xi` 统计工具计数 + compact_boundary，喂 drain record/spine | tool_use/tool_result 计数、`compact_boundary` 捕获 | daemon:60127 | confirmed |
| drain record 结构与 `usage.get` 聚合字段一致 | `total_drains/total_tool_calls/.../perf{...sdk_ttft_ms}`（例 memory-committer `total_drains=2`） | daemon:59774 + 活体 usage.get | confirmed（静态+活体） |
| DISABLE_*/MAX_THINKING_TOKENS 仅存在于错误提示，非 duoduo 消费 | 全在 `F8e` 提示串（含"Claude-only"话术）；daemon 无读取分支 | daemon:61588 | 未证实推测（透传消费未直接证实） |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **session actor 状态**（`daemon:72598`）：`status, currentAbortController, query, streamAbortController, drainPromise, wakeResolver, pendingWake, isStreaming, activeToolUseIds(Set), pendingPreempt, pendingPreemptBoundary, pendingClear, inflightEventIds(Set), admissionInProgress, pendingSteer, admissionCallback, streamingState, streamingAdapter, streamingGeneration, notifyCalledDuringDrain, runtime, codexAdapter, consecutiveConservativeRedrive`（另有 `idleSince/spawnedAt/lastActivityAt/lastTurnCompletedAt/lastCliTurnSettledAt` 等）。v0.6.1 相较 v0.5.8 已无独立 `pendingNotifySteer` 字段。
- **streamingState**（`74641`）：`queue, abortController, configSignature, initialSessionId, hasAcceptedTurn, needsRecreation, closed, currentTurn, loopPromise, cliTurnTentative`（v0.5.8 的 `orphanExecuting` 换成 `cliTurnTentative` + 新增 `loopPromise`）。
- **turn/queue 项**（`76074`-`73238`）：`input, resolve, reject, accepted, sessionId, text, structured, usage, streamedText, turnStreamedText, toolUseMap, toolBlockIndexMap, skipCalled`。（v0.6.2 随 Skip 改为 hook 裁决，移除了 `interruptRequested`。）
- **pendingSteer**（`76583`）：`steerText, eventIds, claimedEventIds, enqueueAsNewTurn, spawningTurn, requeueLines, requeueEventIds, processedEventIds, settled`。
- **drain record**（追加到 drainRecordPath，`60361`；活体经 `usage.get` 按 session 聚合印证）：`yd, session_key, sdk_session_id, drain_started_at, drain_duration_ms, sdk_duration_ms, events_processed, events_skipped, tool_calls, tool_errors, output_chars, cancelled, usage{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens,total_cost_usd,protocol,model,context_used_tokens}, perf{mailbox_merge_ms,...,sdk_ttft_ms_total,sdk_ttft_samples}, compact, suspected_in_process_break`。
- **SDK options**（`createAgentSdkAdapter` 内层构建器 `e(t,n)`，`49874` 起）：`resume, abortController, cwd, settingSources, persistSession, outputFormat, model, effort, permissionMode, systemPrompt, allowedTools, tools, disallowedTools, mcpServers, additionalDirectories, env, pathToClaudeCodeExecutable, hooks, includePartialMessages`。
- **内建 hooks**：流式 hooks 块在 `75383`。PreToolUse matcher `"*"` 记 `transcript_path`（`75549`-`72746`，同样用 `agent_id === void 0` 判定是否主 agent）；matcher `g_`（`mcp__aladuo__Skip`）的 Skip hook 带 `agent_id` 子代理护栏并**返回** `{continue:!1, stopReason:…}`（`75479`-`72756`）。PostToolUse matcher `"*"` 做 steer 注入（`75548`-`72788`），v0.6.2 在其顶部新增两个提前返回：`currentTurn?.skipCalled === !0` 或 `cliTurnTentative?.skipObserved === !0` 时直接 `return {}`（`72762`-`72005`），即**已 Skip 的 turn 不再消费 `pendingSteer`**——v0.6.1 会把 park 中的插话 markDone 并注入一个即将被丢弃的 turn，插话就此消失。（v0.5.8 里"PreToolUse matcher `Bash` 拦截 `run_in_background`"的 hook 自 v0.6.1 已不存在。）

### 给 Agent PM 的洞察

> 1. **"turn ≠ 消息"是这套设计的中心一步，且分层要看清。** 循环层 `Se` 反复调用单批处理器 `W_e`，每次只吃一个"可合并谓词允许的前导窗口"（同目标、无斜杠命令、mergeWindow 内）。这天然做了输入去抖/合并、降低 query 次数与 cache miss，代价是单条消息延迟受窗口影响。PM 要把"消息""batch""turn"三层解耦：一次 drain 迭代 = 一个 batch = 一次（可合并批）query，多条消息可能跨多次迭代分成多个 turn。
>
> 2. **v0.6.1 改成"单 turn 准入 + steering lane"——后到消息不再折进正在跑的 turn。** 流式槽一次只准入一个对话 turn（`75519` 槽占则 reject），后到消息由 admission callback 决策、park 成 `pendingSteer`，再由 SDK 的 PostToolUse `additionalContext`（`74833`）在工具边界注入正在跑的 turn。这既保住工具执行原子性又实现"边跑边追加",还消除了旧版"折入 accepted turn 致会话永久 busy"的隐患。这是把 agent-sdk 的 hook 能力当控制面用的巧思，可直接借鉴。
>
> 3. **长驻 streamingQuery + configSignature 粘连是延迟/成本优化的核心，但抢占是"置标志/扳机"两段式。** 同会话同配置复用一个 query 进程避免冷启动与重放；指纹（cwd/permissionMode/allowedTools/**tools** 等）一变就 `W(y)` 强制重建。抢占用 `G()` 置三态边界标志、执行事件闭包 `L(y)` 在对应工具边界才真正 abort——deferred preempt 的兑现时机取决于 `activeToolUseIds` 何时清空。PM 应尽量稳定单会话工具集/权限。
>
> 4. **背景 subagent 靠"hold stdin + `$ && R.size===0` 双条件 + idle 看门狗"续跑，且完成语义已收敛为单一 owner。** stdin 保活的释放需**同时**满足"已收到 result"与"追踪的后台 task 全部完成"，非仅后者；超过默认 10 分钟静默会 force-release，牺牲 in-process MCP 回调。v0.6.1 把"后台 Agent 完成说进对话"的权限收敛给 Claude CLI 原生续写（completion-owner），duoduo 只记 WAL 生命周期事件、不再制造重复回调 turn——长任务应走独立 job 而非 background Agent。
>
> 5. **失败面产品化收敛，且 v0.6.0 起即时上浮。** drain-error 统一为 `[duoduo:drain-error]` 文本 + `agent.error` spine 事件（可被 usage/后续 drain 复算），并内置"关 thinking"诊断话术；错误在 catch 处直接 `throw`，不再滞留到下一 tick。注意 `DISABLE_*`/`MAX_THINKING_TOKENS` 在 daemon 内仅出现在 `F8e` 错误提示串（且被标注为 Claude-only），是否真正透传消费属未证实推测——对多模型/第三方 endpoint，thinking 线协议不兼容是头号坑，值得产品层预置开关与提示。


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

- **key 格式与派生**：`session_key = <scope>:<name>:<hash(workspaceAbsPath)>`，由 `dte`（`stdio.pretty.js:46109`）拼装：`` `${t}:${n}:${ute(a)}` ``，其中 `a=Af(e.workspaceAbsPath)`（`46112`）、`ute` 为 hash（`46096`，`sha256(...).slice(0,12)`）、`n=aq(e.readableName)` 归一化名段，`gB` 注入 `scope:"stdio"`（`46116`）。活体 `system.status` 返回 `stdio:default:28d3ca682f86` 逐段印证。**confirmed**。
- **前缀 → plane / kind**：kind 由 `Os(e)`（`daemon.pretty.js:50684`）前缀分类（`meta:/cadence:→meta`、`subconscious:→subconscious`、`system:→system`、`job:→job`，否则 `channel`）；plane 由 `B5e(e)`（`64331`：`system:/meta:/cadence:→system`，否则 `work`）。**confirmed**。
- **一 key 一 actor**：注册表 `let g = new Map`（`74507`），`Nt(y,T)`（`75444`）负责生成 actor，`actorRunId: M=++R` 单调自增（`75447`），`g.set(y,ee)`（`76246`）。活体 `system.status` 只有单一 actor（status=`idle`），印证"至多一个"。**confirmed**。
- **kind 的第二真值来源**：`Nt` 内 `jk(t, {...})` 把 `display_name/kind` upsert 进 meta.md（`76250`），此处 `kind` 从 **origin** 二次派生（`origin==="job"?"job":origin==="system"?"system":startsWith("meta:")?"meta":"channel"`，`76253`）——与 `Os` 的前缀派生**并存**，是 kind 的另一条真值来源。**confirmed**。

---

### 论点 2 · 两层锁分工：进程写锁保运维健壮性，`hi` 异步互斥保数据一致性

**所以呢**："lease lock"在代码里其实是**两把互不相干的锁**，各解决一个问题，绝不能混谈：一把跨重启防"同目录多 daemon 写者"（运维），一把按 key 串行防"同会话并发写状态"（数据）。

- **进程级 runtime 写锁**——保证同一 runtime_dir 只有一个 daemon 写者。锁文件 `run/locks/daemon-writer.json`（路径由 `iU`，`81411`），记 `{runtime_dir, pid, boot_id, started_at, last_heartbeat_at}`。`start()` 内 `b=await Pce(n); if(!b.acquired) throw \`Runtime lock already held by pid=${...}\``（`78706-78707`）；心跳 `setInterval(()=>Uie…$ce(n),v)`、`v=Mme("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS",3e4,1e3)`（`78717-78719`）。夺锁前 `HWe`→`w7e`（`80616-80618`，旧名 `J9e`）判 stale，逐字符为：
  ```
  Number.isNaN(r) || t.getTime()-r > n || (e.boot_id && e.boot_id !== Ice()) || !O9e(e.pid)
  ```
  （`81448`）即心跳超 TTL（`ttlMs??12e4`=120s，`zue` 内 `81461`）、**`boot_id` 存在且不符**（重启；`e.boot_id &&` 是空值守卫，boot_id 缺失时不据此判 stale）、或 `O9e`=`process.kill(pid,0)`（`80585`）探测进程已死，则视为可抢占。`boot_id` 取 `/proc/sys/kernel/random/boot_id` + macOS `sysctl kern.boottime` + uptime 兜底（`tWe`→`Z9e`，`81425`；当前值 getter `Mue`，`81442`）。活体 `system.config`：`heartbeat_ms=30000`、`runtime_lock_heartbeat_ms=30000`。**confirmed**。
- **会话级异步互斥 `Mi(session_key, fn)`**（`32325`）——`LE: Map<key, 尾Promise>`（声明 `32355`），把该 key 的所有状态变更闭包串成链：`i=LE.get(e)??Promise.resolve()` → `LE.set(e,r)` → `await i` → finally `n(); LE.get(e)===r&&LE.delete(e)`（逐字符匹配）。state.json/meta 写、mailbox merge、outbox cursor 全按 key 串行。调用点已全验（全仓 10 处调用）：`32463`（`$s` mailbox 追加，`_u(t)`+锁串接）、`35399/35432/35482/35518/35554`（session state/meta 写）、`60015/60034`（归档流程 `Mhe`/`jhe`）、`82711`（`zhe` delivery-cursor，含 `[delivery-cursor] skip cursor write: session archived (tombstoned)`）、`84538`（daemon 主体 `fdt`）。配合"一 key 一 actor"形成双保险。**confirmed**。

---

### 论点 3 · 池与生命周期：双有界可让出池 + active/idle/ended，让槽回收而前台钉活

**所以呢**：并发用"双有界池 + 可让出的池槽"而非固定线程——channel/job 分池，后台批处理饿不死前台；执行槽（占用 vs 让出）与会话存活（actor 是否回收）被**解耦**：idle 主动让槽却仍可被前台附着钉住不死，容量因而在会话间自由流动。

- **双有界池 channel=10 / job=6**：池对象 `h`(channel)@`75196`、`_`(job)@`75196`，各持 `{name, activeCount, maxConcurrent, wakeQueue}`；`f=e.maxConcurrentChannel??e.maxConcurrent??10`、`m=e.maxConcurrentJob??6`（`75194-75195`）；`b(y,T)` 按 origin 选池（`74451`）。actor 创建时抢槽 `ke=b(y,ee.origin); ke.activeCount++, ee.holdsPoolSlot=!0`（`76247-76248`）；超限入队 `ee.wakeQueue.push(y)`（`Ue` 内 `76183`）。活体 `system.config`：`max_concurrent_channel=10, max_concurrent_job=6`（`81705-81706`）。**confirmed**。
- **三态 active → idle → ended**：idle 分支 `76114`、`y.status="ended"`（`77009/77011`）均已亲见。**confirmed**。
- **idle 让槽 + `Ht`→`st`(idle_ms) 等待 + 前台钉活**：drain 空转后 `released pool slot (idle)`（`_e.activeCount--, y.holdsPoolSlot=!1`，`76878`），进 `st(y,i)`（`77044`）等待——`y.wakeResolver=()=>{M(),j(!0)}` 与 `setTimeout(()=>{M(),j(!1)},T)` **竞争**（`76275-77054`，`M()` 为共用清理）。超时且无附着→`idle timeout, no attachments, exiting`（`76926`）退 ended；**有附着则继续等**→`idle timeout but has attachments, continuing wait`（`74001`），前台通道把 actor 钉住不回收；被唤醒→重抢槽（pool-full→`wakeQueue.unshift`，否则 `activeCount++`，`75676-76805`）。`idle_ms` 源：`idleTimeoutMs:i=36e5`（`75102`）、config `ALADUO_SESSION_IDLE_MS`（`80852`）、注入 `83808`。活体 `idle_ms=3600000`，stdio 会话正处 idle。**confirmed**。
- **dequeue 原地复用 `w()`**：出队唤醒时若目标是"idle 且无池槽且有 drainPromise"的 actor，走 `pendingWake+wakeResolver` **原地唤醒**而非新建 `Nt()`，随后 `return`；池重满则 `unshift` 回队首（`dequeue deferred: pool re-filled`，`75247`）；否则回落 `Nt(I, $2(I)??…)`。`function w(y)` 定义在 **`75120`**、原地复用体（`resuming idle actor from dequeue`）在 **`74479-74985`**。**confirmed**。
- **重启 actor 的 origin 从何而来（"重抢槽"闭环的落池决策）**：`w()` 与 `Ue()` 回落新建时 `Nt(I, $2(I))`——`c2(y)`→`$2(y)`（定义 `74830`，调用 `75175`（w）/`75435`（Ue））负责推断被出队/唤醒 actor 应落 channel 还是 job 池，是"重抢槽"闭环里决定池归属的关键。**confirmed（机制），origin 推断细节为静态阅读**。
- **续写决策的指纹守卫解耦 board 层**（v0.6.1 新增）：指令指纹 `bw`（`computeInstructionsFingerprint`，`74842`）覆盖 `[identity,kindPrompt,instancePrompt,memoryBoard,mission]`；新增 `P6`（`computeNonBoardInstructionsFingerprint`，`74851`）= `GI({...e, memoryBoard: void 0})`，**排除 board 层**——board 内容变动不再触发指令指纹判定"指令已变"，把易变的广播 board 与稳定的指令层解耦（board 层单独由 `I6`/`computeBoardLayerHash`@`74847` 哈希）。**confirmed**。

---

### 论点 4 · 唤醒 / 抢占 / 隔离：单 turn 准入 + 显式 steering 通道，硬前缀隔离，收尾再校验

**所以呢**：有状态 agent 的"打断 / 续写"不是硬 kill，也不再把后到消息折进正在跑的 turn 里——v0.6.1 改成**一次只准入一个对话 turn**（single-turn admission），后到的输入走一条**显式 steering 通道**（`pendingSteer` 会话状态）：能就地插话就 mid-turn 注入，不能就 park/requeue 回 inbox 由下一个 turn 处理；要真打断也只在工具调用边界。同时用前缀白名单挡住越权唤醒，用一次性布尔上限防收尾自旋。这几点合起来保证"续写不损坏状态、后到不导致会话永久 busy、隔离不被绕过、结束不空转"。

- **唤醒与抢占 `Ne`→`Ue`/`N`→`G`**：`Ue(y,T)`（`76096`）默认 `j=T?.preempt??"allow"`（`75351`）；归档会话 wake 被抑制（`fr(y)`→`wake suppressed, session is being archived`，`76103`）；idle actor 直接 `M.wakeResolver()`（`76118`）。`G(y,T,j)`（`75322`）在 `tool_use/tool_result/accept` 边界延迟中断，`T==="soft"` 分支存在，返回 `defer_*/immediate/noop`；`force→G(M,"immediate",N)`（`76138-76139`）、`allow→G(M,"soft",N)`（`75396-76155`）。**confirmed**。
- **preempt 档位映射 `_2`→`JB`**（`81755`）：`!t||!t.startsWith("/")?"allow":t.split(/\s+/,1)[0]?.toLowerCase()==="/cancel"?"force":"never"`（`81757`，逐字符匹配）——普通消息→`allow`、首词 `/cancel`→`force`、其它斜杠命令→`never`。`allow` 在内部派生为 `soft` 模式（非外部档位）。ingress 处 `emit("session.wake",{...,preempt:z2(g.text)})`（`83127`）即以此映射注入 preempt。**confirmed**。
- **单 turn 准入 + steering lane = idle 之外的第二条低延迟续接**：`Ue` 内仅当 `j==="allow"&&(ct||Ne)&&M.admissionCallback&&!M.admissionInProgress` 时（`ct`=Claude 当前 turn 已 accepted、`Ne`=Codex 有 activeTurn）把新批次交给 **admission callback** 处理（`admitting to live streaming session`，`76830-75202`），无需打断亦无需 idle 重启；`admissionInProgress` 双端 finally 复位防并发注入（`76131/76131`）。admission callback（`73652-76626`）走**显式 steering 通道**：Claude 侧把新批**追加进当前 turn 的 steer 文本**（`appended claude steer`，`73704`）或 park 为 `pendingSteer`（`parked claude steer`，`76626`）；Codex 侧调 `codexAdapter.steerActiveTurn`→`turn/steer`（`codex turn/steer landed`，`76544`），失败则回退 redrain。`pendingSteer` 在 turn 循环里被消费：命中则 `injected interjection mid-turn`（`75449-75589`），或流已关闭则 requeue 回 inbox（`75574-75739`）。**一次只准入一个对话 turn**，后到输入不再折进跑动中的 turn 导致会话永久 busy。**confirmed（准入判据/steering 路径），mid-turn 注入时序为静态阅读**。
- **`wakeResolver` 单槽不变量（并发同步点）**：同一 `wakeResolver` 字段被 `st`(idle 等待) **设置**（`76275`）、被 `Ue`/`w`(唤醒/出队) **消费并置 null**（见 `75239` 的 `wakeResolver(),wakeResolver=null`、`76118` 的 `M.wakeResolver(),M.wakeResolver=null`），是 idle↔wake 竞争的**唯一同步点**，构成一条并发不变量。**confirmed**。
- **Plane/kind 硬隔离**：`session.notify`（`82207`）内联 `o=Os→Yi(s.session_key); if(o!=="channel"&&o!=="job") return {ok:!1,reason:"forbidden_kind",…}`（`82208-82214`）——拒绝把外部通知投给 subconscious/system/meta 平面；`session.compact`（`82282`）更严 `a=Yi(...); if(a!=="channel")…`（`82283`），且 `if(fr(...)) reason:"archiving"`（`82290-82292`）。白名单谓词 `F1`→`Vz`（`e=>Os→Yi(e)==="channel"||Yi(e)==="job"`，`50688`）存在但供 `listUserVisible`，notify/compact 用内联 `Yi` 判断。**confirmed**。
- **归档态统一短路 `ol()`→`ro()`**：`ro(e,t)=XQ($f(e,t))&&!XQ(Pr(e,t))`（`32026`，归档目录存在且活动目录不存在）——tombstone 判定贯穿 delivery-cursor（`81126`）、compact、drain 收尾，是归档态对所有写路径的统一短路机制。归档安全在 v0.6.0 加固：`archive` 前先证明无 in-flight 工作、忽略 channel 占位 actor，归档标记（`fr`/`yk`/`_k` 对 `Hg` Set 的增删查）被当作真实"即将消失"信号，抑制一切 wake/ingress。归档错误 `ZD`→`Of` `extends Error {kind="session_archiving"}`（`32194-31703`），`_c`→`Ac` 抛之（`32188-32189`）。**confirmed**。
- **收尾再校验 `He`→`A` + 一次性重驱**：`A(y,T)`（`77107`）actor end 后重扫 inbox，返回 `fresh/conservative/none`；`fresh`→重新 wake（`preempt:"never"`，`77006`）；`conservative`(瞬时读失败) 受 `consecutiveConservativeRedrive` 约束——该字段**确为布尔**：初始 `??!1`（`76244`），已 true 则 `conservative re-drive suppressed (cap spent)`（`77017`），首次则 `=!0`+`re-entering wake path once`（`77013`）——即只重驱一次防自旋（`77012-77028`）。**confirmed**。
- **后台 Agent 完成单一 owner**（v0.6.1）：job origin actor 收尾时经 `Ce(y,{runStarted,cancelled,processedCount,claimCursor,error,resultText})` **只持久记录生命周期事件**再置 `status="ended"`（`76997-76835`）；对话侧则由 Claude 原生完成续写作为唯一"说进对话"的路径，duoduo 不再另造重复回调 turn。**confirmed（收尾记录路径），"唯一 owner"表述为综合推断**。

---

### 论点 5 · idle 回收不再只让池槽，v0.7.1 起连运行时子进程一起拆（idle-reclaim）

**所以呢**：论点 3 讲的"idle 让池槽、`attachedChannels` 钉活"解决的是**并发容量**问题——idle actor 不占执行槽，但只要还有前台通道附着，它在内存里就**继续活着**，等着被唤醒续写。v0.7.1 在此之上新增了一层独立的资源回收：即使因为前台附着而不能整体退场，一个 idle 到超时的 actor 也会**主动杀掉它持有的运行时子进程**（Codex app-server / Grok ACP 子进程；Claude 侧没有子进程，等价动作是中止 in-process streaming query），下一条消息到达时再冷启动一个新的。这解决的是一个此前无上界的问题：一个保持长连接的 channel gateway（这是常态，不是异常）会让它触碰过的**每一个** session 都无限期地占着一个子进程，而这个子进程早就没有价值了——模型侧的 prompt cache 早已过期，唯一的回收成本只是"沉默很久后第一条回复慢一点"。

- **触发条件**：`createSessionManager (act)`（`daemon.pretty.js:75097`）接受 `idleTimeoutMs=36e5`（默认 1 小时）选项，真实值来自 daemon 启动时 `process.env.ALADUO_SESSION_IDLE_MS ?? 36e5`。drain 循环里一旦一个 turn 跑完且暂无更多工作，actor 置 `status="idle"`（`daemon.pretty.js:76865`）并进入等待循环，每轮竞速 `await Q(g,i)`（一个 `setTimeout(idleTimeoutMs)` 对抗被唤醒提前 resolve）；超时且仍处于 idle（`g.status!=="idle"` 判定于 `76132`），触发回收（confirmed，逐行核对）。
- **按 backend 拆分的具体动作**：`g.attachedChannels.size>0`（有前台附着，不能整体退场）时，日志打一条 `"idle timeout with attachments, reclaiming runtime processes"`（`daemon.pretty.js:76895`），随后**先中止 streaming query**（`await Fe(g)`，`76901`——这一步对 Claude 是唯一动作，因为它没有子进程）；接着若 `g.codexAdapter` 存在则置空并异步 `Ot.shutdown()`（`76903-76910`）；若 `g.grokAdapter` 存在则同样置空并异步 `shutdown()`（`76154-76919`）——两个 backend 分支并列、互不排斥（理论上一个 actor 同时挂着 codex 和 grok adapter 也会都被清）。若 `g.attachedChannels.size===0`（无前台附着），actor 不进入这条回收分支，直接整体退场（`status="ended"`），日志改打 `"idle timeout, no attachments, exiting"`（`daemon.pretty.js:76925`）（confirmed，逐行核对）。
- **冷重生**：actor 记录留在内存 Map 里但已清空运行时字段；下一次唤醒时，唤醒逻辑发现这是个"已结束/无存活 drainPromise"的记录，走的是与全新 actor 一样的创建路径（`query`/`streamingState`/`codexAdapter`/`grokAdapter` 全部重新按需构建）——这是一次真正的冷初始化，不是"假装还活着"（confirmed，机制存在）。
- **v0.7.1 changelog 提到的三处配套修复**：①"reclaiming the Grok adapter on timeout"——即上述 Grok 分支本身，与已有的 Codex 分支对称新增；②"guarding the exit-path audit on a process that is actually alive"——Codex 适配器 `shutdown()` 里"子进程已退出则跳过信号"的守卫，防止对一个其实还活着的进程误判成"已退出无需处理"（或反之）；③"covering the cold respawn"——上一条讲的冷重生路径本身的正确性修复。三处均为**机制存在 confirmed**，具体对应哪一行历史 bug 属**未证实推测**（无 v0.7.0 前的代码可比对）。

---

### 证据表

| 机制主张 | 证据(字面量/片段) | 位置 | 置信 |
|---|---|---|---|
| 进程级 runtime 写锁 + pid/boot_id/心跳/TTL 抢占 | `daemon-writer.json`；`Runtime lock already held by pid=${...}`；`w7e`: `Number.isNaN(r) \|\| t.getTime()-r>n \|\| (e.boot_id && e.boot_id!==Nme()) \|\| !O9e(e.pid)`；`O9e`=`process.kill(e,0)`；TTL `ttlMs??12e4` | daemon `81411`(eU)/`80585`(O9e)/`81425`(C9e)/`81442`(Nme)/`80616-81448`(J9e)/`81461`(Pce TTL)；抢锁 `78885-78886`；心跳 `83727-83729` | confirmed |
| 会话级异步互斥（串行化状态变更） | `hi(e,t){ i=gk.get(e)??Promise.resolve(); gk.set(e,r); await i; try{return await t()} finally{n(); gk.get(e)===r&&gk.delete(e)} }` | daemon `31671`（调用点 `32293/35131/35164/35260/35298/35334/50401/50420/81126`） | confirmed |
| 一 session_key 一 actor + 单调 actorRunId + active/idle/ended | `let g = new Map`（`74507`）；`Nt()` 生成、`actorRunId: M=++R`；`status:"active"→"idle"→"ended"` | daemon `75444-75447/76114/77009` | confirmed |
| 双有界池：channel=10 / job=6，超限入 wakeQueue | `h`@`75196`/`_`@`75196` `{name,activeCount,maxConcurrent,wakeQueue}`；`f=…??10`、`m=…??6`；`ee.wakeQueue.push(y)` | daemon `75194-75196`；`76183`；RPC `system.config`→`max_concurrent_channel:10, max_concurrent_job:6`（`81705-81706`） | confirmed |
| idle 释放池槽 + `st`(idle_ms) 等待，前台附着钉住 actor | `released pool slot (idle)`；`st(y,T){ wakeResolver=j(!0) vs setTimeout(j(!1),T) }`；`idle timeout but has attachments, continuing wait` | daemon `76878/77044/74001`；重抢槽 `75676-76805`；`idle_ms:3600000` RPC | confirmed |
| dequeue 原地复用 idle actor | `w(y){ …if(N.status==="idle"&&!N.holdsPoolSlot&&N.drainPromise){ pendingWake=!0; wakeResolver(); "resuming idle actor from dequeue"; return } …回落 Nt(I,$2(I)) }` | daemon `75120-74999` | confirmed |
| 唤醒/抢占：Ue 归档抑制 + idle resolve + 单 turn 准入/steering；G 边界延迟 | `Ue`：`fr→wake suppressed`；`allow&&(ct\|\|Ne)&&admissionCallback&&!admissionInProgress`（admitting）；`G`：`tool_use/tool_result/accept` 边界，`force→immediate`/`allow→soft` | daemon `76096/76103/76118/76830`（steering `73652-76626`）；`75322/76138/75396` | confirmed |
| 单 turn 准入 + steering lane（后到走显式通道） | `admitting to live streaming session`；`appended claude steer`/`parked claude steer`；`codex turn/steer landed`；`injected interjection mid-turn`；`pendingSteer` 会话状态 | daemon `76830-75202`；`76544/73704/76626`；`75449-75589`；字段 `76233` | confirmed |
| preempt 档位映射 `JB` | `!t\|\|!t.startsWith("/")?"allow":首词==="/cancel"?"force":"never"`；`Ue` 默认 `j=T?.preempt??"allow"`；ingress `preempt:z2(g.text)` | daemon `81757`；`75351`；`83127` | confirmed |
| Plane/kind 隔离：notify 拒非 channel/job，compact 仅 channel | `o=Yi(s.session_key); if(o!=="channel"&&o!=="job") reason:"forbidden_kind"`；`compact`：`if(a!=="channel")` + `if(fr)reason:"archiving"` | daemon `82207-82214`；`82282-82292`；`Yi`@`50684`；`Vz`@`50688` | confirmed |
| Notify 目标解析：工具端与 CLI 端是**两套实现** | 工具端 `XQe` 三段式（精确 key→别名→歧义列候选）；CLI/RPC 走 `H2`（仅精确 key + 唯一别名，无 orphan 过滤） | daemon `71879`（工具端）/ `82170`（RPC 端） | confirmed |
| session_key 格式 `<scope>:<name>:<hash(workspaceAbsPath)>` | `dte: \`${t}:${n}:${ute(a)}\``（`a=Af(e.workspaceAbsPath)`）；`TU({scope:"stdio",...})`；活体 `stdio:default:28d3ca682f86` | stdio `46109/46112/46096/46116`；`session list` RPC | confirmed |
| 会话目录 = sessionsDir/sha256(key)，含 inbox/mailbox/state.json；归档 tombstone | `Pr=join(sessionsDir,Gi(t))`；`Gi=sha256(e).digest(hex)`；`ro()=XQ($f)&&!XQ(Pr)`；`inbox/mailbox.md/mailbox/pending/notes.jsonl/meta.md/state.json` | daemon `32010`(Gi)/`32014`(Pr)/`32022`($f)/`32026`(ro)；mailbox 标题 `32449` | confirmed |
| rehydrate 扫描 + state.json 字段 | `MX`→`nX(e)` 扫 `e.sessionsDir` 后 `stat().isDirectory()&&R2e` 读取；`_ae` 字段集 | daemon `32093`（nX）/`32072`（R2e，`qqe`）；`50705`（mae，旧 `hae`） | confirmed |
| ingress→wake；outbox replay；delivery-cursor 跳归档 | `channel.ingress`→`routing.enqueued && emit("session.wake",{...,preempt:z2(text)})`；`replayed outbox backlog`；`Kz` 用 `ro()` 跳归档写游标 | daemon `82133/83127`；`83629`；`81126` | confirmed |

### 关键数据结构 / 事件 / 文件格式（真实字面量）

- **Actor 对象**（内存态，`76206-76244`）：`sessionKey, actorRunId(=++R@72425), sdkSessionId, sdkSessionIdVerified, status, currentAbortController, query, streamAbortController, streamingState, streamingAdapter, streamingGeneration, drainPromise, wakeResolver(单槽 resolver，st 设置/Ue·w 消费置 null), pendingWake, isStreaming, activeToolUseIds:Set, pendingPreempt, pendingPreemptBoundary("tool_use"/"tool_result"/"accept"，由 G() @71639 设置), pendingClear, attachedChannels:Set, inflightEventIds:Set, admissionInProgress, pendingSteer(steering lane 会话状态，null/{steerText,eventIds,claimedEventIds,settled,…}，@72453), admissionCallback, idleSince, spawnedAt, runtime("claude"/"codex"/"grok"), codexAdapter, grokAdapter(v0.7.1 新增), origin("channel"/"job"/"system"), jobId, jobStateless, consecutiveConservativeRedrive(布尔，初始 ??!1 @72463)`。v0.7.1 起 idle 超时（`idleTimeoutMs`，默认 36e5ms）会把 `codexAdapter`/`grokAdapter` 置空并异步 shutdown，`query`/`streamingState` 同步置空——见论点 5。
- **池对象**（`h`@`75196` / `_`@`75196`）：`{name:"channel"|"job", activeCount, maxConcurrent, wakeQueue:[]}`（注册表 Map 为 `g`@`74507`，与 job 池 `_` 分属两个符号）。
- **runtime 锁文件** `run/locks/daemon-writer.json`：`{runtime_dir, pid, boot_id, started_at, last_heartbeat_at}`（`boot_id` 取 `/proc/sys/kernel/random/boot_id` + macOS `sysctl kern.boottime`/uptime 兜底，`tWe`→`Z9e`@`81425`；当前值 getter `Mue`@`81442`）。
- **会话磁盘布局** `var/sessions/<sha256(key)>/`：`state.json`、`meta.md`、`mailbox.md`（渲染标题 `["# Session Mailbox","","## Inbox",""]`，`32449`）、`mailbox/pending/`、`mailbox/notes.jsonl`、`inbox/`。归档态迁到 `var/sessions-archive/<sha256(key)>/`（`vf`→`$f`@`32022`；`ol()`→`ro()` 判归档 tombstone `32026`），归档进行中由 `Ni`/`JS`/`GS`（`fr`/`yk`/`_k`，对 `Tg`→`Hg` Set 增删查）抑制一切 wake/ingress，错误 `kind="session_archiving"`（`31703`）。
  - *注（confirmed）*：错误类的 RE 命名 `SessionArchivingError` 现由代码直证——minified 类符号为 `Of`（旧 `ZD`），其构造器显式 `this.name = "SessionArchivingError"` 并置 `kind="session_archiving"`（`32194-32198`）。
- **state.json 字段**（`hae`→`_ae`@`50705`）：`session_key, cwd, plane, permission_profile, created_at, last_event_id, last_event_at, last_seen_daemon_started_at, source_channel_id, last_error`，v0.6 起新增 auto-compact 计量字段 `context_used_tokens, last_compact_at, compact_measured_floor(=compact_stats.post_total), compact_measured_at`；`display_name/kind/owner_session` 来自 meta（由 `gk`→`jk`@`76250` upsert，kind 在此从 origin 二次派生）。
- **preempt 值来源** `_2`→`q6`(`83320`)：无斜杠命令→`"allow"`、首词 `/cancel`→`"force"`、其它斜杠命令→`"never"`；`Ue` 默认 `j=T?.preempt??"allow"`（`75351`）。内部 `G(actor,"soft"|"immediate",boundary)` 的 `soft` 是由 `allow` 派生的内部模式名，非外部档位。
- **相关事件/RPC**：入口 `channel.ingress`/`session.notify`/`session.wake`（`emit("session.wake",{sessionKey,displayName,preempt})`）；隔离判定返回 `reason:"forbidden_kind"`/`"archiving"`/`"ambiguous"`/`"not_found"`。

### 给 Agent PM 的洞察

> 1. **"外部单身份、内部多会话" = session_key 命名空间 + 一 key 一 actor + 前缀即平面**。路由/隔离/权限全部从 `session_key` 前缀（`stdio:`/`job:`/`meta:`/`subconscious:`/`system:`）纯函数派生（`Os`→`Yi`/`r8e`→`C8e`），无需额外注册表（呼应本节论点 1）。代价是"平面"是约定式字符串契约——`session.notify` 靠前缀白名单挡住 work→system/subconscious 的越权唤醒（只放行 channel/job），这是可借鉴的**轻量能力边界**，但也意味着改前缀即改权限，需谨慎治理。

> 2. **并发用"双有界池 + 可让出的池槽"而非固定线程**。channel(10)/job(6) 分池避免后台批处理饿死前台交互；idle actor **主动释放池槽**（`76878`）再挂起等待，dequeue 时对 idle-with-drainPromise 的 actor **原地唤醒复用**（`75120-74999`），让容量在会话间流动。可借鉴：把"占用执行槽"与"会话存活"解耦——idle 不占槽，但 `attachedChannels` 能把 actor 钉活，兼顾资源回收与前台低延迟续接（呼应论点 3）。

> 3. **抢占是"单 turn 准入 + 边界感知"的而非硬 kill**。外部 preempt 枚举为 **`allow`/`force`/`never`** 三档（`JB` 由用户命令映射）；v0.6.1 起一次只准入一个对话 turn，`allow` 档优先走 admission callback 的**显式 steering 通道**（Claude 追加 steer 文本 / Codex `turn/steer`，不打断、后到消息或就地插话或 park 回 inbox），退而求其次才在 `tool_use/tool_result/accept` 边界以 `soft` 模式延迟中断（`G`），避免在半个工具调用中截断导致状态损坏；`force` 走 `immediate`。这既防"半个工具调用被截断"，又防"后到消息折进跑动 turn 导致会话永久 busy"，是有状态 agent 做"打断/续写"的关键取舍（呼应论点 4），值得任何流式 agent 产品照搬。

> 4. **两层锁分工清晰**：进程级 runtime 锁（跨重启、pid+boot_id 探活）解决"同目录多 daemon"；会话级 `hi` 异步互斥解决"同会话并发写状态"。前者是运维健壮性，后者是数据一致性——不要用一把锁混着做（呼应论点 2）。

> 5. **能力边界**：actor 之上没有真正的分布式/多进程调度，全在单 daemon 单进程内用 Map+Promise 编排，`wakeResolver` 单槽是 idle↔wake 竞争的唯一同步点；`unhandledRejection` 被吞、`uncaughtException` 直接 `process.exit(1)` 靠外部重启恢复（`83760-83763`）。适合"单机常驻个人 agent"，若要横向扩展会话，需要把内存 `Map g`/池/`hi` 换成外部化的租约与队列。


---
## §8 Claude/Codex/Grok/pi 四运行时抽象与路由

> **v0.8.0 更新（confirmed，代码证据）：枚举从三值扩到四值，`pi` 加入且是唯一"内嵌、无需外部 CLI"的后端。** 全仓唯一权威枚举字面量已变为 `["claude", "codex", "grok", "pi"]`（`daemon.pretty.js:31599`，取代 v0.7.1 时的 `Ex=["claude","codex","grok"]`）。`pi` 与另外三者有一处本质不同：`available_runtimes` 探测里 claude/codex/grok 都要探测成功才 push，**`pi` 无条件 push，不做可用性门控**（`daemon.pretty.js:58491`：`e.push("pi")` 在三个条件 push 之后无条件执行）——错误文案直说原因："The pi runtime is embedded in duoduo — there is no separate CLI to probe"（`66342`附近），pi 自己的进程是 duoduo 包内自带的 `pi-worker.js`（`dist/release/pi-worker.js`，本轮**未**逆向，不在 daemon/cli/stdio 三宿主的既有还原范围内），而不是像 `codex`/`grok` 那样要求用户另装并登录一个外部 CLI。pi 的模型 id 走自己的 `provider/modelId` canonical 校验（`58544`），凭据来自用户 pi agent 目录的 `models.json`/`auth.json`（`66354`附近的报错文案），与 Claude/Codex/Grok 各自的账号体系完全独立。`prompt_mode` 语义上 pi 与 claude/grok 同组、codex 例外（"consumed by the claude, grok, and pi runtimes; on codex it is a no-op"，`58136`）。job-config 叠加口复用同一个 `applyJobSdkConfigOverride`（见 §1 论点五 v0.8.0 更新块的 `piExtensions`/`piSkills`/`piConfigIssues`）。下文论点①②、证据表与 PM 洞察 1/3 已按四值枚举逐行改写并重新锚定到 v0.8.0（选择链两处 + actor spawn 分支 + 专属报错文案，均 confirmed）；论点③④（命令层分叉、装配器复用）pi 是否同样落在既有描述里**本轮未逐行核对**（未证实推测；job-config 叠加口这一条例外，已确认复用）。

**领起结论：`runtime` 是一个 `claude`/`codex`/`grok`/`pi` 四值字符串枚举（v0.7.1 新增 grok；v0.8.0 新增 pi，且 pi 是三个非 Claude 后端里唯一内嵌于 duoduo 自身、无需安装、无可用性探针的），却仍是一层"薄名字、厚差异"的抽象——duoduo 不抹平进程内 SDK（claude）、常驻 JSON-RPC 子进程（codex app-server）、常驻 ACP 子进程（grok agent CLI）、内嵌 worker 子进程（pi）四种进程模型的差异，而是在选择链（显式声明 > channel/job frontmatter > `ALADUO_DEFAULT_RUNTIME` > `claude`）与命令层按 `runtime` 分支*诚实路由*，靠共享的 prompt 装配器与 protocol 分桶会计跨后端复用同一套指令与溯源。** 下面四个论点自上而下展开这句：①名字很薄（四值枚举、单一权威源 + 诚实的选择链）；②差异很厚（四种不对称的执行形态与探测机制——**codex 不可用时静默降级到 claude，grok 不可用时绝不降级、直接报错，pi 干脆没有探测这一步**，三种互不相同的失败模式并存）；③命令层不假装对等（undo/model/compact 逐 runtime 分叉，grok 走独立的 ACP rewind 机制——**v0.8.0 更新：grok 的 ACP rewind 机制本身已被移除，见 §2**）；④骨架靠复用而非抹平（共享装配器 + 分桶 + 认证短路 + 工具命名空间钉顶，但权限/thinking 面故意不对等）。

---

### 论点①　名字很薄：四值枚举、单一权威源 + 诚实的选择链，"显式意图 > 自动兜底"

**所以呢**：runtime 的合法取值现在有四个，选择逻辑仍不玩魔法——它把"用户/actor 明确要 codex/grok/pi"当作不可降级的意图直接放行，只对"从 channel/job frontmatter 派生出来的 codex"才做可用性门控；而**派生出来的 grok、pi 同样不门控**（见论点②的不对称发现）。这是一条刻意的产品价值排序（尊重显式意图，宁可晚炸也不静默降级）。

- **枚举扩到四值，且 v0.7.1 把"三处独立词法作用域常量"重构成了单一权威源**：v0.6.2 时代文档记载的三处独立副本（`s2e`/`aHe`/`lhe`）在 v0.7.1 已不再存在——全文件只有唯一一处字面量数组，v0.8.0 中为 `eE = ["claude", "codex", "grok", "pi"]`（`daemon.pretty.js:31599`；v0.7.1 时为 `Ex`/`31582`，升级只重命名了短标识符、结构未变）。默认值解析函数（v0.7.1 时名为 `Xl`）逻辑不变：`ALADUO_DEFAULT_RUNTIME` 非字符串 → `"claude"`；trim/lowercase 后空串 → `"claude"`；成员判定通过才用用户值，否则 `"claude"`（confirmed，结构化 grep 验证全文件仅此一处四值数组字面量）。**pi 没有 `ALADUO_PI_ENABLED` 或等价开关**——它随 duoduo 自身的 npm 依赖内嵌安装，`skills/duoduo-runtime-admin/references/pi-runtime.md` 称其"没有可用性探针，守护进程永远把 pi 报告为可用"，与下面 boot 探测代码的行为一致（confirmed）。
- **选择链 A——`createSessionManager` 内部通用解析器 `i(a,l)`（`daemon.pretty.js:76685-76698`）**：`if (l?.runtime === "grok") return "grok"`（**`76686`，显式声明 grok 直接返回，不做可用性门控**）→ `if (l?.runtime === "codex") return "codex"`（**`76687`，codex 同样直返不门控**）→ `if (l?.runtime === "pi") return "pi"`（**`76688`，v0.8.0 新增，pi 与 grok 同组**）→ 有 `source_channel_id` 则回溯 channel descriptor/kind 配置取 frontmatter `d`，最后 `d ??= ao(), d === "grok" ? "grok" : d === "pi" ? "pi" : d === "codex" && (await n()).ok ? "codex" : "claude"`（`76697`）——**frontmatter 派生的 grok、pi 都不经过 `(await n()).ok` 门控，只有 codex 才检查**（confirmed，逐行核对）。
- **选择链 B——潜意识 partition（分区执行闭包 `I`，`daemon.pretty.js:79907`）**：`q = S.runtime`（partition frontmatter）→ `J = q ?? _o()`（`79910-79911`）。若不可用则跳过该 partition 并发 `agent.error{outcome:"runtime_unavailable", runtime:J, runtime_source: H ? "explicit" : "default"}`——这条与选择链 A 的失败前移相反，partition 路径*会*显式发不可用事件（confirmed）。
- **"runtime"一词在本运行时被重载两义，须消歧**：`system.runtime.info` RPC 返回的是*守护进程实例身份*——`{version, runtime_id, runtime_mode:"host"（固定）, runtime_dir, work_dir, kernel_dir}`，**不含 `available_runtimes`、与模型后端无关**。本节所讲的 `runtime` 始终指*模型后端*；读者勿把 `runtime.info` 误当成后端探测入口（confirmed）。

### 论点②　差异很厚：四种不对称的执行形态，且失败模式本身也三分

**所以呢**：同一个字符串背后是四种根本不同的进程模型（进程内 SDK / 常驻 JSON-RPC 子进程 / 常驻 ACP 子进程 / 内嵌 worker 子进程），claude/codex/grok 的探测都带结果缓存 + in-flight promise 去重、都留了测试注入缝——这是"探测可注入、选择可单测"的三份对称实现。但**这份对称在"不可用时怎么办"上被打破成三种模式**：codex 不可用会静默降级到 claude 并打日志；grok 不可用**绝不降级**，actor 仍以 `runtime="grok"` 创建，不可用原因被记录、留到 drain 时才作为硬错误抛给用户；pi **干脆没有探测这一步**——它总是被无条件视为可用，失败被完全推迟到会话发消息时的模型解析阶段（一个不同的错误族："this pi session has no model yet"，而非"runtime unavailable"）。这是三种截然不同的"永远可用 vs. 可能不可用"产品设计，而不是同一模式的三份实现。

- **claude = 进程内 SDK，无子进程**：模块顶层静态 `import { query as Tde } from "@anthropic-ai/claude-agent-sdk"`（`daemon.pretty.js:49815-49817`）。可用性同步验证器 `Mde`（`49913`）：`CLAUDE_CODE_EXECUTABLE` 设了就放行（`49914`）；否则平台白名单 6 种、unsupported 抛错（`49918-49919`）；原生二进制 `s.resolve("${u}/claude")` 兜底（`49932`）（confirmed）。
- **真正的探测引擎 `probeClaudeAvailability`，5s 超时**：`Promise.race([...,setTimeout(...)])`。**双重去重**：结果缓存 + in-flight promise，派生读取 `isClaudeAvailable`/`claudeUnavailableReason`（confirmed）。测试注入缝 `__setClaudeVerifierForTest` 可替换验证器并清缓存（confirmed）。
- **codex = 外部 CLI + 常驻 app-server 子进程**：探测 `checkCodexAvailability (Xu)` 两步各 5s——`execFile(e,["--version"],{timeout:5e3})` 后 `codex login status` 断言输出含 "logged in"（confirmed）。运行时适配器 `createCodexAppServerAdapter (ev)`（`daemon.pretty.js:59434-59983`）内 `this.proc = spawn(this.binary, ["app-server"], {cwd, stdio:["pipe","pipe","pipe"], env:{...process.env,...this.env}, detached:!0})`，走换行分隔 JSON-RPC（confirmed）。缓存/测试注入：`isCodexAvailable`/`primeCodexAvailability`/`__setCodexAvailabilityForTests` 三件套，与 claude 侧对称（confirmed）。
- **grok = 外部 CLI + 常驻 ACP 子进程，探测方式与 codex 不同**：`checkGrokAvailability (Qu)`（`daemon.pretty.js:60500-59953`）同样两步各 5s，但 `grok --version` 之后走 `grok models`（不是专门的 login-status 子命令）、扫描其 stdout+stderr 是否包含 "logged in" 来判断是否已认证（confirmed）。适配器 `createGrokAcpAdapter (Sv)`（`daemon.pretty.js:60689-60978` 一带）是一个闭包工厂而非 class（区别于 codex 的 class 适配器），`spawn(t="grok", ["agent","--always-approve","--no-leader","stdio"], {cwd,env,stdio:["pipe","pipe","pipe"]})`——**没有 `detached:!0`**，这点也与 codex 不同（confirmed）。协议走标准 ACP（`initialize`/`authenticate`/`session/new`/`session/load`/`session/set_model`/`session/prompt`/`session/cancel`）加一组 `_x.ai/...` 供应商扩展方法（`GROK_ACP_EXT_PREFIX="_x.ai"`，`grokAcpExtMethod (rv)` 拼装，`daemon.pretty.js:59955-59958`），mid-turn steering 用扩展方法 `_x.ai/interject`。缓存/测试注入 `isGrokAvailable`/`primeGrokAvailability`/`__setGrokAvailabilityForTests` 三件套齐全（confirmed）。
- **pi = 内嵌 worker 子进程，是三个非 Claude 后端里唯一"随 duoduo 一起装好"的**：`protocol: "pi"`、`args: [hB(e, "pi", "worker.ts")]`（`daemon.pretty.js:66818/66846` 一带）——spawn 的是 duoduo 自带的 pi coding-agent SDK 里的 worker 脚本，不是像 codex/grok 那样 shell 出用户 PATH 上的外部 CLI，所以**没有对应的 `checkPiAvailability`**（全文件搜索确认不存在）。它没有 claude 式的进程内 SDK 调用，也没有 codex/grok 式的探测-缓存三件套，是第四种、更简单的执行形态：直接假定可用，把"能不能用"完全下放给消息发送时的 provider/模型解析（confirmed，结构化 grep 验证不存在 pi 专属可用性探针）。
- **失败模式三分：codex 静默降级，grok 绝不降级，pi 无从谈论"降级"**——actor spawn 时（`createSessionManager` 内部未导出的 spawn 逻辑，`daemon.pretty.js:78069-78093` 一带）对 job/channel 两种 origin 都是同一套模式：`Ie==="codex"` 分支里 `(await m()).ok ? _.runtime="codex" : (_.runtime="claude", 打印"...falling back to claude"警告)`（`78074-77305`）；`Ie==="grok"` 分支里**先无条件 `_.runtime="grok"`**，再 `(await v()).ok || (Hs=reason, 打印"...grok is unavailable"警告，不改 runtime)`（`78082-77314`）；而 `Ie==="pi"` 分支只有一行 `_.runtime="pi"`（`78091`）——**没有 await、没有 ok 判断、没有警告日志**，比 grok 分支还要少一步。也即 codex 不可用时用户拿到的是一个**换了后端**的会话（可能默默发生），grok 不可用时用户拿到的是一个**注定失败**的会话（直到 drain 阶段 `drainSessionMailbox` 读到未清空的不可用原因才抛错：`Agent runtime 'grok' is unavailable. ... Install the grok CLI, run 'grok login', then send the message again.`，`daemon.pretty.js:66478` 一带），而 pi 的会话从不会因"运行时不可用"失败——它唯一会晚发作的失败源是"没有模型指针"：`This pi session has no model yet. Request was not executed. ... Nothing to install: the pi runtime ships inside duoduo.`（`daemon.pretty.js:66479` 一带，与前两者共用同一个错误组装函数，但分支内容完全是另一套叙事）。这印证了 v0.7.1 changelog 对 grok 的字面承诺，也说明 v0.8.0 给 pi 选的是第三条路——不是"检测后报错"，也不是"检测后降级"，而是"压根不检测，把判断权交给下一层"（confirmed，三处分支逐行核对；显式声明与 frontmatter 派生两条选择链上 pi 与 grok 同样不门控，见论点① `76688`/`76697`）。
- **`available_runtimes` 由三探针 + 一次无条件 push 拼装**：会话探针遍历 `isClaudeAvailable()/isCodexAvailable()/isGrokAvailable()` 依次 push，随后**无条件** `e.push("pi")`（`daemon.pretty.js:58491`，confirmed：`aq()&&e.push("claude"), Hd()&&e.push("codex"), x2()&&e.push("grok"), e.length===0&&e.push("claude"), e.push("pi")`——pi 不经过任何门控函数，是数组里唯一一个无条件追加的成员；v0.7.1 时的 boot 日志活体印证 `available runtimes at boot { claude: true, codex: false, grok: false, grokReason: "..." }` 对前三者仍成立）。

### 论点③　命令层不假装对等：undo/model/compact 按 `runtime === "claude"` 诚实分叉，grok 走独立的 ACP rewind

**所以呢**：这是本子系统最关键的状态机分叉。因为 Claude 会话是 append-only jsonl（只能"算 cutoff → 下次 drain 才 fork 新 session"），而 Codex app-server 原生支持同步 `thread/rollback`，同名命令在"何时生效、session 是否连续"上根本不同。Grok 又是第三种形态——ACP 协议原生没有"rollback"，duoduo 自己在其上叠了一层"rewind"语义。PM 若设计撤销/回滚体验，不能承诺跨后端统一。

> **v0.8.0 更新（confirmed，代码证据）：`/undo` 整条命令与 Grok 的 rewind 机制已从 daemon 里整体移除。** 全仓检索 `cutoff_message_uuid`/`pending_undo`/`thread/rollback`/`GROK_ACP_REWIND_*` 均为零命中；history-control 命令层的新版本（`tst`，`daemon.pretty.js:66238`）现在只识别 `/compact` 一种命令，其余（含 `/undo`）一律落到 `` ✗ Unrecognized history-control command: ${r}. `` 的兜底分支。下面两条 `/undo`/Grok-rewind 的机制描述保留作为 **v0.7.1 及更早的历史基线**，其引用的行号/短名均未随 v0.8.0 重新核对，不代表当前行为。

- **（v0.7.1 及更早基线）Grok /undo——供应商扩展方法拼出的"倒带"**：`GROK_ACP_REWIND_POINTS`/`GROK_ACP_REWIND_EXECUTE`（`_x.ai/rewind/points`/`_x.ai/rewind/execute`）两个扩展方法配合 `parseGrokRewindPoints (wme)`（`daemon.pretty.js:59967-60568`，解析响应体里的 `rewindPoints`/`rewind_points` 数组）与 `pickGrokRewindPromptIndex (vme)`（`59960-60552`，从去重排序后的 `promptIndex` 集合里数第 N 个往回取）——即 duoduo 自己去查一个"可回退点"列表，再选一个目标点执行 rewind，语义上更接近 Codex 的同步 rollback（有明确的目标点、同 session 内生效）而非 Claude 的延迟 fork（未见 grok 侧有 `sessionIdChanged`/cutoff 类字段，confirmed 机制存在，具体 UX 文案未逐行核对，标注 未证实推测）。

- **（v0.7.1 及更早基线）`/undo`——Claude 延迟成 fork、Codex 同步 rollback**：Claude adapter `undo()` 只扫 jsonl 算 `cutoff_message_uuid`，返回 `{kind:"succeeded", runtime:"claude", sessionIdChanged:!0, cutoff_message_uuid:f}`（`49705-49734`），不真正改历史；命令层 `qet`（v0.7.1 行号 64052，该命令 v0.8.0 已移除，见上方更新块）写 `pending_undo:{from, upToMessageUuid, requested_at}`（`64749-64755`），回 `↩️ Undo queued (...)`（`64761`）；真正的 `V5e(he.from,{upToMessageId})`（forkSession，`63062`）推迟到 drain 头部执行，守卫 `X.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)`（`60482`），失败则保留 `pending_undo` 并中止 drain（`63080-60390`）。Codex adapter `undo()` 直发 `thread/rollback{threadId, numTurns}`（`59303`）、同步生效、`sessionIdChanged:!1`（`58480`）；drain 头部 else 分支 `X.pendingUndo && n.runtime !== "claude" → (X.pendingUndo=void 0, Ii(...,"pending_undo"))`（`63101`）清掉 codex 会话遗留的 pending（confirmed，逐行核对，均为 v0.7.1 基线）。
- **`/model`——Claude 试图即时、Codex 只能延迟 fork**：`setSessionModel` 内 `if (await p(y,T) === "codex")` → 写 `dt(...model_runtime: T!==null?"codex":null, pending_model_fork:!0, applied:"stored")`（`77860-77137`）；claude 路径 `ee="stored"; setModel 成功→ee="live"`，写 `model_runtime:"claude", pending_model_fork:null, applied:ee`（`77571-77934`）。codex 回执 `Codex session — a switch takes effect from the next message.`（`76781`）。runtime flip 时经 `!(i ? i!==s : s==="codex")` 守卫清空 `model/model_runtime/pending_model_fork`（`64946-64946`）（confirmed）。
- **codex 侧 fork 时序的落地（与 claude `V5e` 对称的另一半）**：codex thread 生命周期三分支（`59597`）——`forkFrom → "thread/fork"`、`sessionId → "thread/resume"`、else → `"thread/start"`；`q8e`（`64954`，日志 `resolved pending_model_fork at codex drain start` 于 `64969`）在 drain 起点把 `forkFrom` 设为当前 sessionId，才让 codex 的 model 切换在下一条消息 fork 生效（confirmed）。
- **`/compact`——门控只锁 claude，实际抵达回执的是 codex**：外层守卫 `V.event.routing_hint?.intent === "history-control"`（`63575`）；内层 `if (kr === "/compact" && (n.runtime === "claude" || n.runtime === void 0))`（`63600`）→ `oa(t)==="channel" ? Wt=!0 :（发 "only available in interactive sessions" + continue）`（`60990-63603`）。`oa(e)`（`64037`）把 `job:→"job"`、`meta:→"meta"`、`system:|cadence:→"system"`、含 `:` → `"channel"`，否则 unknown。**codex 根本不进这个拦截块**（守卫限 claude/void），落到命令层 `tst`(`66238`)→ `r.compact()` → `📦 History compacted (runtime: ${o.runtime})`（`66253`）。所以：claude channel 走 `Wt=true` 透传 SDK 原生（不产该串），claude 非 channel 被拦，唯 codex compact 抵达 `66253`（confirmed，codex 路由链已补全）。

### 论点④　骨架靠复用而非抹平：一套指令 + 一套溯源跨后端，但权限/thinking 面故意不对等

**所以呢**：duoduo 不为每个后端各维护一份指令与会计口径，而是靠共享的 prompt 装配器 + symlink + protocol 分桶让指令与 token 溯源跨后端归位；但它*不*把权限模型与工具/thinking 可见性也抹平——codex 有沙箱枚举与 reasoning 退订开关，claude 侧工具面则从 v0.5.10 起由 denylist 翻转为 allowlist，两后端的安全/可观测面是诚实的不对等。

- **v0.7.1 起六层 system-prompt 装配被拆成独立的可复用函数 `renderPromptLayers (Lde)`**（`daemon.pretty.js:49967-49992`）：`buildSystemPromptForChannelConfig (eh)`（`49994-50003`）现在只是等 `Lde(e,t,n,r,i)` 拼好六层文本之后再按 `prompt_mode==="override"` 决定原样返回还是包成 `{type:"preset",preset:"claude_code",append:s}`——**装配逻辑与"包不包 Claude Code 预设壳"被拆成两步**，为 grok/codex 复用同一套装配文本而不复用 Claude 专属的 preset 包壳结构铺路（§1 已确认 codex 复用同一段文本、只多套 `<aladuo:system-context>` 壳；grok 的握手同样传入 `systemPrompt` 字段，可合理推断复用同一函数，confirmed 重构存在，grok 调用点未逐行标注故整体标 confirmed/复用意图 未证实推测）。
- **`ALADUO_TOOL_NAMESPACE="aladuo"`（v0.7.1 新增，`daemon.pretty.js:60267`）钉住 duoduo 自有工具在模型可见工具列表的顶层位置**：Codex 侧把 duoduo 的工具作为 `dynamicTools:[{type:"namespace", name:"aladuo", ...}]` 挂载，并设 `config:{"features.code_mode.direct_only_tool_namespaces":["aladuo"]}`（`daemon.pretty.js:59555-59002`）——防止 duoduo 的工具被 Codex 的 code-execution shim 折叠进模型看不见的间接调用层，是 v0.7.1 changelog "Codex tools stay where the model can see them" 的落地机制（confirmed）。

- **同一套指令**：codex 会话启动 `OU(e)`（`59347`）若工作目录有 `CLAUDE.md` 而无 `AGENTS.md`，自动 `await n.symlink("CLAUDE.md","AGENTS.md")`（日志 `[codex] created AGENTS.md symlink`，`59352`）——让一套 system 指令喂两个后端（confirmed）。
- **同一套溯源，两套口径**：usage 按 protocol 分桶（`35585`）——`anthropic → cache.anthropic.{drains,cache_read_tokens,cache_create_tokens,fresh_input_tokens}`；`codex → cache.codex.{drains,input_tokens,cached_tokens}`；其余 `unsupported_drains++`。Anthropic 有 cache_creation、Codex 只有 cached，口径不同但都落回同一 drain record（confirmed）。
- **认证来源三态 + `claude_code_local` 短路**（仅 host 模式）：`Iit(e)`（`83163`）三值枚举 `claude_code_local|anthropic_api_key|compatible_endpoint`；env 读取 `_B`(`83167`)取 `ALADUO_CLAUDE_AUTH_SOURCE ?? ALADUO_AUTH_SOURCE`，经 `Iit` 校验非法值→void 0。分派体 `t === "claude_code_local" → return e`（`81690`，提前返回不注入 ANTHROPIC_*）；否则 `for (n of xet){ let r=cr(n,null); r.source!=="unset" && (e[Eet(n)]=r) }`（`81691-81694`）注入覆盖。活体 `duoduo daemon config` → `claude_auth_source: claude_code_local (env)`，与短路路径一致（confirmed，含活体印证）。
- **claude 工具面 v0.5.10 起由 denylist 翻转为 allowlist**：旧的 `DEFAULT_DISALLOWED_TOOLS` 黑名单已**移除**，改为固定核心集 `CLAUDE_CORE_TOOLS`（`Fp`，`49745`：`["Bash","Read","Write","Edit","Grep","Glob","Agent","TaskOutput","TaskStop","Skill","ToolSearch","TaskCreate","TaskGet","TaskUpdate","TaskList","SendMessage"]`）+ channel descriptor 的 `claude.tools` 嵌套键按需追加可选工具；`splitDisallowedToolsForClaude`（`Ade`，`49626`）按 `mcp__` 前缀把工具名拆成 `{mcpTools, builtIns}`（confirmed）。
- **duoduo 向 codex 叠加自有工具，但 codex 内置工具不可禁用**：`disallowedTools` 被显式忽略并告警 `[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled`（`59510`）；另一面握手中 `experimentalApi: !!n.dynamicTools?.length`（**两处 initialize 站点** `58075` 与 `58115`）门控，随后 `for (m of n.dynamicTools) f.set(m.name, m.handler); r.setToolHandlers(f)`（`59459-58081`，第二站点 `58121`）（confirmed）。
- **权限与 thinking 面故意不对等**：codex 沙箱经 `lm()`/`ALADUO_CODEX_SANDBOX`（`59306`）映射 `read-only | workspace-write(默认) | danger-full-access`，握手固定 `approvalPolicy:"never"`（`58139`/`58155`/`58163`）；`optOutNotificationMethods`（`58076`/`58116`）显式退订 codex 的 reasoning 增量流（`item/reasoning/*Delta`），直接决定 codex thinking 是否回传前端。claude 侧无对应沙箱枚举与退订开关——这是"两后端权限/推理可见性不对等"的开关点。v0.6.0 起 `/effort` 让每会话独立设定推理力度（levels `Vk = ["low","medium","high","xhigh"]`，`79503`；网关命令处理 `80148`，经 `getSessionEffort`/`setSessionEffort`；`reasoningEffort` 随 run-config 下达），而 v0.5.10 修复了流式 Claude turn 误将 thinking 强制关闭的 bug——claude 侧 thinking 现按会话推理力度如实回传（confirmed）。

---

### 证据表

| 机制主张 | 证据（字面量/代码片段） | 位置 | 置信 |
|---|---|---|---|
| runtime 枚举扩到 claude/codex/grok/pi，三处独立常量早已合并为单一权威源 | `eE = ["claude","codex","grok","pi"]`（全文件唯一一处四值字面量；v0.7.1 时为 `Ex`/三值） | daemon.pretty.js:31599 | confirmed |
| pi 无独立可用性探针 | 结构化 grep：`isClaudeAvailable`/`isCodexAvailable`/`isGrokAvailable` 各有 `checkXAvailability`+缓存+测试注入三件套，pi 没有同名对应物；worker 由 `args:[hB(e,"pi","worker.ts")]` 内嵌 spawn | daemon.pretty.js:66818-66846 一带 + 全文件 grep | confirmed |
| 默认 runtime 由 ALADUO_DEFAULT_RUNTIME 决定，回退 claude | `_o(e=process.env)`；`ha(n) ? n : "claude"`（`ha`→`bE`→枚举数组 `_E=["claude","codex","grok","pi"]`，`31599`） | daemon.pretty.js:31656-31661 | confirmed |
| claude=进程内 SDK（顶层静态 import，无子进程） | `import { query as Tde } from "@anthropic-ai/claude-agent-sdk"` | daemon.pretty.js:49815-49817 | confirmed |
| claude 可用性=CLAUDE_CODE_EXECUTABLE 短路 → 平台白名单 → 原生二进制 resolve | `if (...(process.env.CLAUDE_CODE_EXECUTABLE)) return;`；平台断言；resolve for 循环兜底 | daemon.pretty.js §论点② | confirmed |
| 探测引擎 probeClaudeAvailability：5s 超时 + 结果缓存 + in-flight 去重 | `Promise.race([...,setTimeout(...)])`；结果缓存变量 + in-flight promise 双去重 | daemon.pretty.js §论点② | confirmed |
| claude 探测可注入（__setClaudeVerifierForTest 清缓存） | 替换验证器 + 清结果缓存/in-flight promise | daemon.pretty.js §论点② | confirmed |
| codex=外部 CLI，探测 --version + login status（各 5s） | `execFile(e,["--version"],{timeout:5e3})`；`(i+s).toLowerCase().includes("logged in")` | daemon.pretty.js §论点② | confirmed |
| codex 运行时=spawn app-server 常驻子进程 | `createCodexAppServerAdapter (ev)`：`this.proc = spawn(this.binary,["app-server"],{...detached:!0})` | daemon.pretty.js:59434-59983 | confirmed |
| codex 探测缓存 + __setCodexAvailabilityForTests | `isCodexAvailable`/`primeCodexAvailability`/`__setCodexAvailabilityForTests` 三件套 | daemon.pretty.js §论点② | confirmed |
| grok=外部 CLI + 常驻 ACP 子进程，探测走 --version + `grok models`（无专用 login-status） | `checkGrokAvailability (Qu)`：`grok --version` 后 `grok models`，扫 stdout+stderr 含 "logged in" | daemon.pretty.js:60500-59953 | confirmed |
| grok 适配器是闭包工厂（非 class），spawn 不带 detached | `createGrokAcpAdapter (Sv)`：`spawn("grok",["agent","--always-approve","--no-leader","stdio"],{...})`（无 `detached:!0`） | daemon.pretty.js:60689-60978 一带 | confirmed |
| grok 走标准 ACP + `_x.ai/...` 供应商扩展方法命名空间 | `grokAcpExtMethod (rv)`：`` `${GROK_ACP_EXT_PREFIX}/${name}` ``；mid-turn steering=`_x.ai/interject` | daemon.pretty.js:59955-59958 | confirmed |
| **不对称发现：codex 不可用静默降级 claude，grok 不可用绝不降级、留到 drain 硬报错，pi 从不检测、无从降级** | codex 分支 `ok?_.runtime="codex":(_.runtime="claude",警告)`；grok 分支`先 _.runtime="grok"`，`ok\|\|(记录 reason,不改 runtime)`；pi 分支仅 `_.runtime="pi"`，无 await/无判断/无警告 | daemon.pretty.js:78074-78091（job origin，channel 版对称） | confirmed |
| pi 专属的晚发作失败是"没有模型指针"，不是"运行时不可用" | `This pi session has no model yet. Request was not executed. ... Nothing to install: the pi runtime ships inside duoduo.` | daemon.pretty.js:66479 | confirmed |
| grok 不可用的硬报错文案在 drain 阶段抛出，定制到具体 runtime | `` `Agent runtime '${sn}' is unavailable. ... Install the grok CLI, run 'grok login'...` `` | daemon.pretty.js:63235-63245 | confirmed |
| available_runtimes 由三探针 + 一次无条件 push 拼装（pi 不经门控） | `aq()&&e.push("claude"), Hd()&&e.push("codex"), x2()&&e.push("grok"), e.length===0&&e.push("claude"), e.push("pi")`；v0.7.1 boot 日志活体 `{claude:true,codex:false,grok:false,grokReason:"..."}` | daemon.pretty.js:58491；隔离环境实机启动（v0.7.1 轮） | confirmed |
| 选择链 A：显式 codex/grok/pi 均直返(不门控)，派生 codex 才门控、派生 grok/pi 不门控 | `i(a,l)`：`l?.runtime==="grok"→"grok"`；`==="codex"→"codex"`；`==="pi"→"pi"`；派生 `d==="grok"?"grok":d==="pi"?"pi":d==="codex"&&(await n()).ok?"codex":"claude"` | daemon.pretty.js:76685-76698 | confirmed |
| 选择链 B：partition frontmatter ?? `_o()`；不可用发 runtime_unavailable | `q = S.runtime, J = q ?? _o()`；`outcome:"runtime_unavailable", runtime_source: q?"explicit":"default"` | daemon.pretty.js:79907-79935 | confirmed |
| renderPromptLayers 从 buildSystemPromptForChannelConfig 中拆出为独立可复用函数（v0.7.1） | `Lde(e,t,n,r,i)` 拼六层文本；`eh(e,t,n,r,i){ o=Lde(...); prompt_mode==="override"?o\|\|"":{preset:"claude_code",append:s} }` | daemon.pretty.js:49967-50003 | confirmed（拆分本身），复用意图未证实推测 |
| ALADUO_TOOL_NAMESPACE 钉住 duoduo 工具在 Codex 侧不被折叠进 code-execution shim（v0.7.1） | `dynamicTools:[{type:"namespace",name:"aladuo"}]`；`config:{"features.code_mode.direct_only_tool_namespaces":["aladuo"]}` | daemon.pretty.js:60267, 59555-59002 | confirmed |
| runtime.info 暴露 daemon 身份而非模型后端（消歧，host-only） | `{version, runtime_id, runtime_mode:"host", runtime_dir, work_dir, kernel_dir}`，无 available_runtimes | daemon.pretty.js:83040, 79018-79024（活体印证） | confirmed |
| Claude /undo 延迟成 fork（下次 drain，守卫含 runtime===void 0） | `↩️ Undo queued (...)`；`X.pendingUndo && (n.runtime==="claude"\|\|n.runtime===void 0)`；`V5e(he.from,{upToMessageId})` | daemon.pretty.js:48764-48772, 64749-64761, 60482-60390 | confirmed |
| Codex /undo 同步 rollback、session 不变、清遗留 pending_undo | `r.request("thread/rollback",{threadId,numTurns})`；`sessionIdChanged:!1`；else 分支清 pending_undo | daemon.pretty.js:59303-58480, 63101 | confirmed |
| Codex /model 只能 stored + pending_model_fork；flip 清覆盖 | `model_runtime:...codex, pending_model_fork:!0, applied:"stored"`；`a switch takes effect from the next message.` | daemon.pretty.js:77860-77934, 76781, 64946-64946 | confirmed |
| codex fork 时序：thread 生命周期三分支 + drain 起点 resolve | `forkFrom→thread/fork \| sessionId→thread/resume \| else→thread/start`；`q8e` resolved pending_model_fork | daemon.pretty.js:59597, 64954-64969 | confirmed |
| /compact：外层 history-control 守卫 + claude channel 放行、codex 抵达回执 | `intent==="history-control"`；`kr==="/compact" && (runtime==="claude"\|\|void 0)`；`oa(t)==="channel"?Wt=!0`；`📦 History compacted` | daemon.pretty.js:63575, 63600-63603, 61301, 64727 | confirmed |
| 认证来源三态枚举 + claude_code_local 短路 | `XKe`；`ALADUO_CLAUDE_AUTH_SOURCE ?? ALADUO_AUTH_SOURCE`；`t==="claude_code_local") return e` | daemon.pretty.js:81593, 80750-80751, 81690-81694 | confirmed（含活体） |
| claude 工具面 denylist→allowlist（CLAUDE_CORE_TOOLS + claude.tools） | `Fp = ["Bash","Read",...,"SendMessage"]`；`Ade` 按 `mcp__` 前缀拆 `{mcpTools, builtIns}` | daemon.pretty.js:49745, 49626 | confirmed |
| Codex 内置工具不可禁用/disallowedTools 被忽略 | `[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled` | daemon.pretty.js:59510 | confirmed |
| duoduo 向 codex 叠加 dynamicTools（两处 handshake 站点） | `experimentalApi: !!n.dynamicTools?.length`（57413/57453）；`r.setToolHandlers(f)` | daemon.pretty.js:58075, 59459-58121 | confirmed |
| codex 会话自动 symlink CLAUDE.md → AGENTS.md | `[codex] created AGENTS.md symlink` | daemon.pretty.js:59347-59352 | confirmed |
| usage 按 protocol 分桶（anthropic vs codex） | `cache.anthropic.{...cache_read/create...}` vs `cache.codex.{...input/cached...}`，其余 `unsupported_drains` | daemon.pretty.js:35585 | confirmed |
| codex 沙箱枚举 + no-approval + reasoning 退订（与 claude 不对等） | `ALADUO_CODEX_SANDBOX`→`read-only\|workspace-write\|danger-full-access`；`approvalPolicy:"never"`；`optOutNotificationMethods` | daemon.pretty.js:59306, 58139, 58076/58116 | confirmed |
| /effort 每会话推理力度（v0.6.0，thinking 面新增开关） | `Vk = ["low","medium","high","xhigh"]`；`/effort` 网关处理；`reasoningEffort` 下达 run-config | daemon.pretty.js:79503, 80148, 60131 | confirmed |
| container 模式移除（host-only）；仅类型守卫留向后兼容 | `YE`：`e.runtime_mode !== "container" && e.runtime_mode !== "host"`（唯一 container 残留，非活路径） | daemon.pretty.js:31472 | confirmed |
| Job frontmatter runtime schema 按可用运行时**动态**构造枚举（v0.7.1 前是静态 claude/codex），v0.8.0 起 pi 无条件追加 | `stt(){ e=[]; Lq()&&e.push("claude"); of()&&e.push("codex"); t4()&&e.push("grok"); e.length===0&&e.push("claude"); e.push("pi"); return e }`（`58489-58492`），经 `hme`（`58498`）喂进 `_t.enum(t)` zod 枚举、默认取 `t[0]` 或本会话 runtime（`58500-58502`） | daemon.pretty.js:58489-58502 | confirmed |
| partition frontmatter runtime 校验改走共享枚举成员判定 `ha`（v0.8.0 起四值），非法回退全局默认 | `ha(a) ? l=a : a!==void 0 && (告警"...invalid runtime frontmatter; falling back to global default")`，在分区 frontmatter 解析器 `Int` 内 | daemon.pretty.js:60357/60369-60371 | confirmed |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **探针返回**（RPC 会话探针 `Qet`）：`{ configured, session_exists, available_runtimes:["claude"|"codex"], descriptor:{cwd, runtime, display_name, bound_by, require_mention}, kind_defaults:{cwd, runtime} }`；`descriptor.runtime` 经 `Det()` 归一化后上报，非原样透传（`daemon.pretty.js:81949-81102`）。
- **daemon 身份**（RPC `system.runtime.info`，与后端无关）：`{version, runtime_id, runtime_mode:"host"（固定，container 已移除）, runtime_dir, work_dir, kernel_dir}`（`daemon.pretty.js:83040, 79018-79024`，活体实测）。
- **state.json 运行时相关字段**：`sdk_session_id`、`pending_undo:{from, upToMessageUuid, requested_at}`、`pending_fork_to`（drain 起点写入 `forkFrom`）、`model`、`model_runtime:"claude"|"codex"`、`pending_model_fork:boolean`（`daemon.pretty.js:64749-64755, 77860-77137, 64946-64946, 64954`）。
- **partition CLAUDE.md frontmatter**：`runtime: claude|codex`（非法值告警并回退全局默认，`daemon.pretty.js:56350`）；同一 frontmatter 还含 `schedule.{enabled,cooldown_ticks,max_duration_ms}`。
- **undo/compact 结果**：codex `{kind:"succeeded"|"noop"|"failed", runtime:"codex", newSessionId, sessionIdChanged, droppedTurns, triggered_at}`（`59303-58480`）；claude 版多 `cutoff_message_uuid`（`49705-49734`）。
- **usage 按 protocol 分桶**：`cache.anthropic.{drains,cache_read_tokens,cache_create_tokens,fresh_input_tokens}` vs `cache.codex.{drains,input_tokens,cached_tokens}`，其余归 `unsupported_drains`（`daemon.pretty.js:35585`）。
- **codex app-server 握手**：`initialize{clientInfo:{title:"duoduo-runtime",name:"duoduo",version:"0.1.0"}, capabilities:{experimentalApi:!!n.dynamicTools?.length, optOutNotificationMethods:["item/reasoning/summaryTextDelta",...]}}` → `notify("initialized")` → thread 生命周期三分支（fork/resume/start）；沙箱经 `ALADUO_CODEX_SANDBOX`（`fh`，`56602`）映射 `read-only|workspace-write|danger-full-access`，`approvalPolicy:"never"`（握手 `clientInfo` 见 `56745-56750`/`56786`，`approvalPolicy` 三处 `56816`/`56839`/`56849`）。

### 给 Agent PM 的洞察

> 1. **"对等抽象"是薄名字、厚差异，且这层诚实是刻意的。** runtime 是一个四值字符串（v0.7.1 起含 grok，v0.8.0 起含 pi），但 claude 是进程内 SDK（append-only jsonl）、codex 是常驻子进程 + JSON-RPC、grok 是常驻子进程 + ACP、pi 是内嵌 worker 子进程，导致同名操作（undo/model/compact/token 会计）在时序和语义上分叉。抽象层不强行抹平，而是在命令层按 `runtime` 分支显式处理——对可维护性是诚实取舍，但意味着每加一个 runtime，history-control 类命令都要补分支。v0.7.1 把"三处独立词法作用域常量"这一具体债务还清了：现在只有一处权威枚举定义，v0.8.0 加第四个值时也只需改这一处。这正是领起结论"薄名字、厚差异、诚实路由"的落点。

> 2. **undo 的"延迟 fork vs 同步 rollback vs ACP rewind"是能力边界的直接投影。** Claude 会话 append-only，撤销只能"算 cutoff → 下次 drain fork 新 session"，必然延迟且换 session id；Codex 原生 `thread/rollback` 可原地同步撤销；Grok 没有原生 rollback，duoduo 自己在 ACP 供应商扩展方法上叠了一层"查可回退点列表 + 选点执行"的 rewind 语义。设计撤销/回滚体验须预期三个后端在"何时生效、session 是否连续、由谁定义回退粒度"上根本不同，不能承诺统一体验。

> 3. **显式声明的 runtime 不做可用性门控，是刻意的失败前移——但 codex、grok、pi 对"门控缺失"的后果处理三种都不同。** 显式或 channel/job frontmatter 派生的 grok、pi 都从不检查可用性就直接把 actor 的 `runtime` 设成对应值；codex 走同样的"显式不门控"路径，但 frontmatter *派生*出来的 codex 会被 `(await n()).ok` 门控，且不可用时静默降级回 claude。codex 有"降级安全网"，grok 和 pi 都没有——但两者没有安全网的原因并不相同：grok 侧是刻意选择"宁可让用户在下一步撞见清晰报错，也不要静默换后端"（代价是 actor 可能带着一个已知不可用的 runtime 存活到 drain 阶段才报错）；pi 侧则根本没有"不可用"这个状态需要报——它作为内嵌依赖被设计成永远可用，唯一会失败的是下游的模型解析，属于另一条完全独立的错误路径。三个非 Claude 后端在"降级"这件事上没有共享的设计原则，各自为政。

> 4. **一套指令喂三个后端，靠共享装配器 + symlink + protocol 分桶复用溯源。** v0.7.1 把六层 system-prompt 拼装拆成独立的 `renderPromptLayers`，供 `buildSystemPromptForChannelConfig` 包壳复用——多后端框架若想避免"每个后端各维护一份指令/一套溯源"，这是低成本落地范式：拆分"生成内容"与"决定怎么包壳"两步，新后端只需实现自己的包壳逻辑。codex 启动自动 symlink CLAUDE.md→AGENTS.md，token 会计按 protocol 分桶归位——装配面共用、执行/命令面分叉，本节只讲执行异，装配同见 §1。

> 5. **认证来源用 `claude_code_local` 短路，把"本地已登录的 Claude Code"当默认路径**，避免误注入第三方 endpoint env；`compatible_endpoint` 显式承担 wire-format 风险。把"官方本地登录 / 官方 API key / 兼容第三方端点"三态显式建模，比一个布尔"是否自建 endpoint"更能精准分派行为与错误提示。

> 6. **可借鉴的三段式解耦：探测可注入、选择可单测、adapter 可替换——三个后端都遵守同一份契约。** 可用性探测三侧对称留缝（`__setClaudeVerifierForTest`/`__setCodexAvailabilityForTests`/`__setGrokAvailabilityForTests`），均带结果缓存 + in-flight promise 双重去重，故 `available_runtimes` 不会阻塞或重复拉起验证器；新增 grok 时这份契约完全没被打破，唯一打破对称的是"不可用时怎么办"这一层产品决策（见洞察 3）——多后端 agent 框架值得照搬"探测契约统一、降级策略可以不统一"这个分层。

> 7. **权限与工具/thinking 可见性故意不对等，PM/安全视角须显式区分，且新后端会带来新的不对等面。** codex 有沙箱枚举 + 固定 `approvalPolicy:"never"` + reasoning 流退订开关，claude 侧无对应物；claude 侧工具面是 denylist 翻成的 allowlist；v0.7.1 新增的 `ALADUO_TOOL_NAMESPACE` 只解决了"codex 工具可见性"这一个具体问题（防止被 code-execution shim 折叠），并不代表三后端的工具/权限模型已经拉平。跨后端不要假设"同样的安全边界、工具白名单与推理可观测性"，每加一个后端都要重新核对这份清单。

---

# 第三部分 · 可信之源：先落日志，再执行 / 入队

> **关键句**：可信来自一条铁律。Spine 的 append-before-execute 把所有状态变成可从日志


---
## §4 Spine / WAL / 事件溯源

**Spine 是 duoduo 唯一的真理之源：一个纯文件 JSONL 预写日志，以「事件先原子 append 再写 mailbox 指针」的 append-before-execute 契约，把所有会话状态、去重、消费进度都变成崩溃后可从「日志 + 指针」精确重建的派生视图——零数据库，顺序靠单进程 promise 链，去重是尽力而为的近似幂等。**

一切都从这条日志派生：会话状态、去重表、消费进度、status，都不是权威数据，而是可丢弃、可从 `var/events/YYYY-MM-DD.jsonl`（按 UTC 日期分区，`mk(e)` 用 `toISOString().slice(0,10)` 切日，`daemon.pretty.js:31729`）加索引重放出来的物化视图。下面四个论点分别回答：**写怎么保证不丢（写路径）、重复怎么处理（去重）、崩溃后怎么读回来（读路径与恢复）、外部怎么观测（读接口与事件全集）**。

### 论点一 · 写路径：先落 WAL、再写指针，且每条事件是「WAL 行 + by_id 索引」的两写原子单元

**所以呢**：因为持久化严格早于任何副作用，崩溃后未处理的工作永远能从「mailbox 里的 `- [ ] @evt(yd)` 指针 + WAL 行」精确恢复；而单条 append 其实是两次协同写入，`hl`/`qGe` 等下游读路径都隐式依赖索引已落盘，构成 `append → 索引 → watermark` 的固定依赖链。

**append-before-execute 的时序在代码里真的这样串联（confirmed）。** 沿网关摄入主函数 `hae`(`81119`) 的真实控制流：`Yt` 封装事件(`81121`)→`Xt(e,r)` 把不可变事件 append 进 Spine(`81196`)→`hl` 推进 watermark(`81196`，同行)→**之后**才在路由分支写 mailbox 指针（meta 分支 `81221`，session 分支 `81231`）。路由分叉由 `aae`(`80980`) 决策：`routing_hint.target ∈ {gateway, meta, session}` 决定指针写到 `meta:subconscious` 还是具体 session_key。

**存在第二条同构摄入源 `route.deliver`（会话间路由投递，confirmed）。** 会话→会话的路由投递走 `ec` 全链(`58883-59008`)：`Yt({type:"route.deliver"…})` 构造事件(`58923`)→先 `Xt(e,h)` append(`58938`)，后 `$s(e,l,\`- [ ] @evt(${h.id})\`)` 写指针(`58958`)，且入口带 `Qn(l)` 归档中(`58898`)/`Cs(e,l)` 已归档(`58910`)两道短路；`walOnly` 为真时在 append 之后、写指针之前整条短路（`58945`，日志 `[route] wal-only route event (no mailbox, no wake)`）。它与 `hae` 是「先 append 后写指针」的同一契约，是 §4 应认清的第二类摄入源。

**单条 append = 恒定两写原子单元，且只有 `by_id` 一个索引（confirmed）。** `atomicAppendEvent (Xt)`(`31966`) 只做两件事：先 `atomicWriteFileSync (FGe)`(`31931`) 写 WAL 行拿回 `{partition, byteOffset, byteLength}`，再**无条件**调 `zGe`(`31957`) 把 `{event_id, partition, byte_offset, byte_len}` 追加进 `by_id.jsonl`（路径由 `ME` 拼成 `<eventsIndexDir>/by_id.jsonl`，`31955`），并同步更新该文件对应的内存 Map（`i.map.set(t.event_id, t)`）。**不存在按 session 切分的第二索引**：`by_session` 在整个 bundle 里零字面量出现，也没有任何模板拼接出这个路径，无论事件带不带 `session_key` 走的都是同一条两写路径（会话维度的检索靠 mailbox 里的 `- [ ] @evt(<id>)` 指针，而不是靠索引文件）。磁盘 append 与内存 Map 的同步更新是同一个函数内的两步——`advanceConsumerWatermark (hl)` 反查偏移、`readEventByIdSeek (qGe)` 随机读都**强依赖 by_id 已写入**，这就是 `append → 索引 → watermark` 的隐式依赖链。

**字节区间与全序（confirmed）。** `atomicWriteFileSync (FGe)`(`31931`) 执行 `NE.open(i,"a")`(`31938`)→`stat().size` 取 **byte_offset**(`31940`，stat 早于 write)→`write().bytesWritten` 取 **byte_len**(`31941`)→`close`(`31949`)，故 `[offset, offset+len)` 恰为该事件行字节区间。全序由 per-file promise 链保证（应用层互斥，非 fsync/DB 事务）：`MGe`(`31911`) `.then(t,t)` 两回调相同，成功失败都续链，同一分区 append 顺序与偏移计算无竞态。**架构假设**：单 daemon 单进程写；跨进程并发写同一分区无保护。

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| 网关摄入先 append 后写指针 | `hae`：`Xt`(81196)→`hl`(81196)→分支写 `- [ ] @evt(yd)`(81221/81231) | daemon 81119-81251 | confirmed |
| route.deliver 同构（含 walOnly 短路） | `ec`：`Xt`(58938，日志 "[route] route event appended")；`walOnly` 时短路进 "[route] wal-only route event (no mailbox, no wake)"(58945) | daemon 58883-58990 一带 | confirmed |
| 路由分叉由 `aae` 决策 | `routing_hint.target ∈ {gateway,meta,session}` | daemon 80980 | confirmed |
| 单 append = WAL+by_id **恒定两写**，无 by_session 第二索引 | `Xt`→`FGe`(31931)；`zGe`(31957 定义/31968 调用) 无条件；全 bundle 无 `by_session` 字面量 | daemon 31931/31966 | confirmed |
| byte_offset=写前 stat().size，byte_len=bytesWritten | open→stat→write→close | daemon 30666-30684 | confirmed |
| 全序=per-file promise 链 | `W6e` `.then(t,t)` | daemon 30646 | confirmed |
| UTC 日切分区 | `mk(e)` `toISOString().slice(0,10)` | daemon 30656 | confirmed |

### 论点二 · 去重：时间桶 + 内容哈希的近似幂等，命中即幂等重放而非静默丢弃

**所以呢**：去重是「尽力而为」而非严格幂等——它给重复输入回放上一次的网关回执（对渠道体验友好），但内存表满即整表清空会短时丢失去重能力，对副作用敏感的场景不能把它当幂等键。

**三档 key：`channel.command` 仅在无 source_id 时免疫去重（confirmed）。** `bX()`(`79328`，默认窗口 `t=5` min) 按优先级产 key，`<source.kind>` 为前缀。关键点：`channel.command→null` 的判断在 **source_id 档之后**——`79699` 无条件从 `t.dedupSourceId` 写 `dedup.source_id`（不区分 eventType），故带 `dedup.source_id` 的 command 仍会在优先级 1 命中去重。准确表述是「**无 source_id 的 channel.command 永不去重**」。

| 优先级 | 条件 | key 形态 | 行号 |
|---|---|---|---|
| 1 | 有 `dedup.source_id` | `<kind>:<source_id>` | 75176 |
| —（在 1 之后判定）| `type==='channel.command'` 且无 source_id | `null`（不去重）| 75177 |
| 2 | 有 `dedup.hash` | `<kind>:hash:<hash>:<bucket>` | 75178-75180 |
| 3 | 有 `payload.text` | `<kind>:text:<sha256>:<bucket>` | 75182-75185 |

时间桶 `bucket = floor(getTime()/(t*60000))` = `floor(epoch_ms/300000)`（`_X`, `79345`）。活体印证 key 形态 `stdio:text:<sha256>:5942938`，bucket `5942938×300000ms ≈ 2026-07-01T04:50:00Z`，与其 `ts=04:51:51` 同桶。

> **唯一一条有意不走 WAL 的跨进程状态**（confirmed）。`<varDir>/daemon-restart-reason.json` 是个例外：CLI 在停掉旧 daemon **之前**原子写入 `{reason, requested_at, requested_by_agent}`，新 daemon 的 `main()` 在 `claimDaemonRestartReason (Rhe)`（`50794`）里读一次、**在 JSON.parse 之前就无条件删除**、存进模块级全局（`50818`/`50822`），再由 `daemon-restart-hint` 瞬态块带给 channel 会话（见 §1 论点二）。它没有事件 ID、没有 `by_id` 索引、没有 TTL、没有 daemon 身份标识——任何一次启动都会认领当时躺在那里的文件，畸形文件被销毁且无日志。破例的理由成立：**它必须在 daemon 存在之前就写好**，而 WAL 的写入者是 daemon 自己。代价是这条通道不可重放、不可审计。

**命中即幂等重放（confirmed）。** `hae` 重复分支(`81166`)：`p.duplicate && p.existing?.event_id` → `md(e, p.existing.event_id, {notAfter})`(`81167`) 取回原事件 → `cm(e, f.id)`(`81171`) 反查该事件上次生成的 gateway outbox 记录 → 返回 `{deduplicated:true, gatewayResponse:m?.payload.text, gatewayOutboxId:m?.id, routing.enqueued:false}`（`81178-81181`）。`cm`(`35936`) 按 event_id 反查 outbox：内部先经索引加载器 `G9e`(`35985`) 取 `Map<event_id,…>`，命中后再经 `Sa` 读出具体 outbox 记录。**不重写 mailbox、`enqueued:false`** 均确认——把完整网关回执重放给渠道，这是「去重即幂等重放」的产品语义。

**满即整表 clear（confirmed，真实近似幂等风险）。** 去重存储 `HE`(`80764`)：`maxEntries = n.maxEntries ?? 1e4`(`80769`)，`record()` 中 `entries.size >= maxEntries && entries.clear()`(`80793`)——**满即整表清空（非 LRU）**。磁盘日志经 `v5e`(`80974`) = `registryDir/dedup.jsonl`(`80975`) 仍增长但 clear 后不再 load，故短时间内旧 key 去重能力真的会丢失；`by_id` 不参与 dedup 判定。活体确认路径 `/home/linewalker/.aladuo/var/registry/dedup.jsonl`。

### 论点三 · 读路径与恢复：索引随机读 + 消费者 watermark + rehydrate，把「日志 + 指针」还原成活会话

**所以呢**：正因为写侧同时落了索引，读侧才能 O(1) 随机读、消费者才能续跑、进程重启才能从文件重建活会话集——这是「派生视图可重建」这条塔尖结论的兑现方式。

**索引与随机读（confirmed，v0.8.1 复核结论有更正）。** 全仓检索 `by_session` 字面量已零命中（新旧两版 `eventsIndexDir` 下都只挂了一个索引文件），**"两个 append-only 索引"这一旧描述不成立**：只有单个 `by_id.jsonl` `{event_id, partition, byte_offset, byte_len}`（`atomicAppendEvent (Xt)` 写入侧 `zGe`(`31957`)，字段体见调用点 `31968-31973`）懒加载入内存 Map 并随 append 增量更新，支撑随机读 `read(o,0,t.byte_len,t.byte_offset)`(`readEventById` 随机读实现 `UGe`，`31990`，经 `md`(`31975`) 对外暴露)。首次访问由 `yJe`→`BGe`(`32028`)/`_Je`→`HGe`(`32037`) 整文件流式 load 进 Map，之后随 append 增量更新——**这正是「随机读 O(1)」的前提**。索引缺失/未命中时回退整文件顺扫，回退函数已重新定位为 `readEventByIdSeek (qGe)`(`32001`)，由 `md` 在索引查无结果时调用（机制 confirmed）。指针化的价值：mailbox 只存 `@evt(yd)` 不存正文，避免正文双写与漂移。

**消费者 watermark（confirmed）。** `advanceConsumerWatermark (hl)`(`32773`) 先 `sL(e,n)`(`32774`，定义 `32018`) 经 by_id 反查偏移，再经 `hZe`(`32770`) 写 `mZe`(`32767`) 拼出的 `run/queue_offsets/<consumer>.json`，字段 `{updated_at, partition, byte_offset, last_event_id}`（活体 `jobs.json` 逐字段吻合）。全部 `hl()` 调用点仅 6 处，对应三个消费者：

| consumer | 触发点 | 语义 | 置信 |
|---|---|---|---|
| `gateway` | 81196 | **网关摄入管线(`hae`)的高水位，对每一条经 `hae` 摄入的事件在路由前无条件推进**，覆盖全部摄入事件；非「仅 gateway-targeted 同步不入队」| confirmed |
| `jobs` | 80466 | **由每次 cadence 扫 due-job 的 `system.cadence_tick` 事件推进**（该调用点紧随 `Xt` 落库同一条 cadence_tick 事件，并在同一表达式里把 `cadence.last_tick` 写进 status，`80466-80472`）；非「由 `job.spawn/complete/fail` 推进」| confirmed |
| `meta_session` | 79937/80188/80212/80311 | 由潜意识/meta partition 事件推进（分别对应 runtime-unavailable skip、partition completed、non-success settle、以及 meta 会话自身的一条） | confirmed |

  - jobs 的决定性活体证据：`jobs.json` 的 `last_event_id=evt_7e3d…` 在 events 文件里正是 `{"type":"system.cadence_tick",…count:0}`。job 到期扫描本身就是 cadence 循环的一环，故 jobs watermark 挂在 cadence tick 上。
  - gateway 的活体证据：`gateway.json` 的 `last_event_id` 指向一条 `channel.message`（普通摄入事件，非 gateway-targeted 专有）。

**持久化分层（confirmed）。** 消费者进度放**易失 `run/`**（`runQueueOffsetsDir`, `V2e` `32592`；重启可从 WAL 重建），会话游标/state 放**持久 `var/`**（`sessionsDir`；会话身份必须跨重启）。活体 `run/queue_offsets/{gateway,jobs,meta_session}.json` 三消费者齐全——这是「运行时进度 vs 实体身份」的干净范式。

**rehydrate（confirmed，一处未证实）。** `nX()`(`32093`) readdir `sessionsDir` → 逐个读 `<hash>/state.json` 的 `session_key`(`32107`) 重建活跃会话集。自愈写回：缺 `session_key` 时遍历 `registrySessionsDir`(`32113`)、`decodeURIComponent`(`32116`)、`Gi(c)===目录名`(`32117`) 反解，**写回 state.json 在 `32119-32123`**。resume 失败 append `agent.error{stage:'resume'}`(`61271`, `source.kind='runner'`) 留痕。state.json 的 `schema_version:2` 本轮未在调用链独立复核——**标未证实推测**。

### 论点四 · 读接口与事件全集：spine.tail 尾读 + 十一类落库事件

**所以呢**：外部只能通过 `spine.tail` 观测这条日志，且并非所有 RPC/bus 事件都会落库——只有经 `Yt`+`Xt` 构造的才是 Spine 权威事件，这条边界决定了「真理之源」到底包含什么。

**spine.tail 尾读（confirmed，活体已验证）。** `Ace()`(`81519`)：`limit = clamp(t?.limit ?? 200, 1, 500)`(`80690`)。无 `after_id` → 尾取 N 条 + `has_more = h>0`(`80695-80700`)；有 `after_id` → 当日 `findIndex` 游标之后(`81532`)，未命中则 `setUTCDate(-1)` 回退前一日分区拼接 `[...prev.slice(f+1), ...a]`(`81546-80720`)。活体 `spine.tail limit:3` 现返回 `agent.tool_use/agent.tool_result`（`source.kind=meta`, `name=subconscious:memory-committer`, `session_key=meta:subconscious`）——**此为取样示例，返回何种事件取决于探测时点**（原文「3×system.cadence_tick」同理只是彼时取样）。

**事件类型全集（含 `route.deliver`）。** 经 `Yt` 封装并 `Xt` 落库的合法 Spine 事件：

```
channel.message / channel.command / channel.attached
agent.result / agent.error / agent.tool_use / agent.tool_result
job.spawn / job.complete / job.fail
system.cadence_tick
route.deliver                                 ← 会话→会话路由投递，tn(49150)
```

`GROUND_TRUTH` 中的 `channel.ack/ingress/pull/spawn/describe`、`session.*`、`job.completed/spawned` 等**未见** `Yt`+`Xt` 构造点，属 RPC/bus 而非 Spine 落库，原文正确地未纳入。潜意识产出**复用** `agent.result`：`source.kind=meta`, `name=subconscious:<partition>`(`75371`), `payload.tick_type='subconscious'`(`78569`)，活体亦印证。

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| spine.tail limit clamp [1,500] 默认 200 | `Bue` `clamp(...??200,1,500)` | daemon 77105 | confirmed |
| after_id 未命中回退前一日 | `setUTCDate(-1)` + 拼接 | daemon 77128-77135 | confirmed |
| 落库事件含 route.deliver | `Yt`(58923)+`Xt`(58938) | daemon 58883-59008 | confirmed |
| 潜意识复用 agent.result | `tick_type:'subconscious'` | daemon 74435/74440 | confirmed |

> **给 Agent PM 的洞察**
> - **真理之源 = 纯文件 JSONL WAL，零数据库依赖**：所有派生态（会话状态/去重/消费进度/status）都可从「日志 + 指针」重建，极简、天然可审计、git-friendly——这正是本节塔尖结论的运营含义。
> - **append-before-execute 是可靠性契约的基石，且有两条摄入源**：网关摄入（`hae`）与会话间路由（`route.deliver`）都遵守「先原子 append、再写 `- [ ] @evt(yd)` 指针」；崩溃后从「mailbox 指针 + WAL」精确恢复未处理工作，mailbox 只存指针不存正文。
> - **单条 append 是恒定两写原子单元**：WAL 行 + by_id（无条件；不存在按 session 切分的第二索引），下游 watermark 反查与随机读强依赖索引已落盘；要横向扩展写侧，必须同时打破「单进程 promise 链保序」与「索引同步」两个假设。
> - **去重是尽力而为、命中即幂等重放**：5 min 时间桶 + 内容哈希，无 `source_id` 的 `channel.command` 永不去重；命中回放上次网关回执（`deduplicated:true`, `enqueued:false`），但内存 Map 满即整表 clear 会短暂丢失去重能力——对重复副作用敏感的场景，产品侧需知这不是幂等键。
> - **watermark 语义要看清挂点**：`jobs` 游标挂在 `system.cadence_tick`（因 due-job 扫描是 cadence 一环），`gateway` 是整条摄入管线的高水位而非「目标同步」标记——误读会导致对「谁消费到哪」的错误运维假设。
> - **持久化分层（run/ 可重建 vs var/ 必须留存）** 是区分「运行时进度」与「实体身份」的干净范式；UTC 日切分区同时是潜意识 scan-gap「做梦」的工作单元，日志分区即时间盒。


---
## §5 Gateway 边界 / RPC / 通道协议

**Gateway 是 daemon 的控制面：它把所有外部输入收敛为 if/else 分发的 JSON-RPC，入站即按斜杠命令 / intent 分流（gateway 内联短路 / session 唤醒 / meta 潜意识），并以「先落 spine 日志 → 再追加 Markdown 邮箱 → 最后 emit `session.wake`」的 WAL-before-enqueue 时序保证崩溃可重放，对外用零依赖 protocol 契约同时支持 HTTP 拉（drain）与 WS 推（订阅 + backlog 回放）两种通道形态——它是整个 agent「输入可靠化与是否动用模型」的边界闸门。v0.7.0 起控制面从「单 loopback 端口、无鉴权」拆成「TCP 只读 + unix socket 全权 + 可选 token 网关」三层监听器共享同一套路由逻辑，鉴权模型也从「本机单用户假设」的隐式信任变成「文件系统权限（socket）/ 方法白名单（TCP）/ bearer token（可选远程）」的显式三层，详见 ARCHITECTURE §10.2。**

下面四个论点自上而下支撑这句结论：控制面的**形态**（三监听器共享路由 + if/else 分发）→ 入站的**分流闸门**（能不进模型就不进）→ 可靠性的**时序契约**（WAL-before-enqueue）→ 对外的**双通道数据面 + 契约包**。

---

### 论点 1 · 三监听器、一套共享路由：if/else 分发链未变，鉴权模型从隐式变显式

**所以呢**：v0.7.0 之前，整个 daemon 对外只有一个可确定的物理边界——一个绑在 `127.0.0.1` 的端口、一条巨型 if/else 链，安全边界完全押在「本机单用户」假设上。v0.7.0 把这个边界拆成三层监听器（详见 ARCHITECTURE §10.2 的 TCP 只读 / unix socket 全权 / 可选 token 远程），但**没有把 if/else 分发链拆成三份**——三个监听器全部由同一个路由构造闭包 `I(app,{hostGuard,readOnly,bearerToken})`（`daemon.pretty.js:83430-83664`）挂载路由，只是分别传入不同的 `{hostGuard,readOnly,bearerToken}` 参数（三次调用见 `daemon.pretty.js:83665-83723`）。这让"审计一条 if/else 链"的心智模型继续成立，只是现在要多问一句"这条链挂在哪个监听器、`readOnly` 是否为真"。

- **`readOnly` 参数是新的核心分支点。** 只读模式下 `/ws` 直接 426（引导去 socket）、`/rpc` 只放行 `system.status/usage.get/job.list/spine.tail/system.runtime.info/system.config` 六个方法（其余 `-32601`，HTTP 200，非连接层拒绝）；`/healthz`/`/dashboard`/`/readyz` 三个端点不受 `readOnly` 影响，任何监听器都注册（`daemon.pretty.js:82514-83487`）。三次调用分别是：`I(t,{hostGuard:!0,readOnly:!0})` 挂常驻 loopback TCP（`83665-83667`）、`I(n,{hostGuard:!1,readOnly:!1})` 挂 unix socket（`83668-83671`）、可选 `I(r,{hostGuard:!1,readOnly:!1,bearerToken:w.token})` 挂 opt-in 远程监听器（`83714-83723`）。
  - **`readyz` 语义要点**：探针实为「能否 append 到 events 日志文件」（打开当日 events jsonl 追加句柄再关闭），未就绪回 `503 not_ready`——它探的是 spine 写入能力，而非泛化的「服务活着」（confirmed，具体探针函数行号需结合 §5 论点 3 的 `hae` 一带核对，未逐字重新定位，标注**未证实推测**具体行号，机制本身 confirmed）。
  - **20234 / save-api 仍不存在**：本轮 grep `20234|save-api|save_api` 三 bundle 皆空（confirmed，静态复核，未重新活体探测非默认端口）。

- **RPC「注册表」在共享路由闭包 `I()` 内部仍是一条 if/else 链，不是 Map。** 方法白名单判定、方法分发、`-32601 Method not found` 兜底，全部在同一个函数体内逐个 `h.method` 字符串比较——**这条链本身没有因为三监听器化而拆分或复制**，只是外面多包了一层 `readOnly` 早退分支。方法覆盖面（system.\*/session.\*/channel.\*/job.\*/usage.get/spine.tail）与 v0.6.2 时代一致，未见新增/删除顶层方法族（除去只读白名单本身是新增概念）。

- **请求体守卫 `isJsonRpcRequest`（protocol 导出）**：`{jsonrpc:"2.0", method: string}` 校验，未过直接 `400`（HTTP 传输）或 `-32600 Invalid Request`（WS 传输）——两条传输的失败形态不同，这一层机制未变。入参校验用 protocol 导出的 `isXxxParams` 守卫，失败抛 `-32602`；未捕获异常统一 `-32603 Internal error`。

- **`system.shutdown` 能直接自杀，且在三个监听器上都可达（只要不是只读白名单挡住的那个）。** `__triggerShutdown → setImmediate(()=>process.kill(process.pid,"SIGTERM"))` 在共享路由链内只有一处实现；因为它不在只读白名单（`system.status/usage.get/job.list/spine.tail/system.runtime.info/system.config`）里，**只读 TCP 监听器上调用它会被 `-32601` 挡下**——这是 v0.7.0 之后"能自杀"这条能力被收窄到 unix socket / token 网关的一个具体例证，值得单独记一笔：控制面拆分不是把每个方法都重新分类过一遍，而是"只读白名单之外全部收紧"的一刀切策略。

---

### 论点 2 · 入站即分流闸门：斜杠命令 / intent 决定「要不要动用模型」

**所以呢**：这是本节最值得抄的一条。routing target 三态（`gateway` / `meta` / `session`）在**入站边界**就决定一条消息要不要真正唤醒一个 agent。`/status /config /model /effort /debug` 这类命令在网关层被内联短路、根本不进模型；只有带内容的消息才唤醒 session。对话式 agent 想省 token，这就是「入站即分流、能不进模型就不进」的实现样板。

- **真正的 target 决策在入口 wrapper `mae`，不在 `hae` 内。** handler 收到 channel.message 后先由 `mae`(`81066`) 做**斜杠命令解析**再调 `hae`——`mae` 里解析出命令/意图后喂 `w5e`(`81060`)裁 target：带参内容 → `session`，`status/config/debug` 类 intent 或纯命令 → `gateway`（内联短路、不进模型），`history-control` 类（`/compact /clear /undo`）→ `session`（`81064`）。这一层命令预处理是「洞察 #5」的真实机制所在。网关命令清单常量 `lae`(`80990`)已含 `/effort`（每会话推理力度开关）与 `/model` 等。
- **`aae` 只是读取器，不是决策器。** `aae`(`80980`)仅 `return routing_hint.target ∈ {gateway,meta,session} ? … : "session"`——它读回 `mae`/`w5e` 已写进 `routing_hint` 的结果。`hae` 内 `d = aae(r)`（**落点 `81208`**）据此分三路。
- **三路的落地形态**：`gateway` → `hae` 内联分支应答（`79759`），返回 responseText/outboxId 并 log `[gateway] gateway-targeted event (no enqueue)`，**完全不入队、不唤醒**；`meta` → 写 mailbox key `"meta:subconscious"`（`79771`）；`session` → 写 `t.sessionKey` 的 mailbox（`79781`）。
- **channel.ingress 的入站守卫**：`fr(g.session_key)` 命中归档中 → `-32011`（`82136-79165`）；workspace 不可用 → `-32010, message:k.guidance`（`78389-79180`）。`source_kind` 缺省按传输层推断 `g.source_kind ?? (_?.wsSubscriberId ? "ws" : "rpc")`（`79168`）。

---

### 论点 3 · WAL-before-enqueue：先落盘、后入队、最后唤醒，崩溃可重放

**所以呢**：可靠性不靠队列中间件，而靠一条铁律——事件先原子 append 进 spine 日志，才追加进 mailbox，才 emit 唤醒。任何一步崩溃都能从「spine log + mailbox 指针」精确复原。代价是「队列」就是纯 Markdown 文件，吞吐/并发靠文件锁与内存索引兜底。

- **精确落点在 `hae`（gateway 入站规范化，`81119-81251`）。** 顺序：`Yt()` 构造 spine 事件（`81121`）→ 幂等去重 `checkAndRecordDetailed`（`81161`，去重键由 `qre` 算于 `81159`、去重存储由 `v5e` 取于 `81158`；命中则复用既有事件、`enqueued:!1`，经 `md` 取回原事件、`cm` 反查既有 outbox 回填 `gatewayResponse/gatewayOutboxId` 原样返回，即「去重即重放上次回执」，`81166-81181`）→ `I5e` 把原始 payload 持久化进 `varIngressDir/<sessionHash>/<eventId>.json` 并回填 `raw_path`（`81185`/`81196`）→ **`await Xt(e, r)` 把事件 append 进 spine 事件日志（这是 WAL，`81196`）** → `hl` 推进 gateway 消费水位（同行 `81196`，紧随其后 `gl` 更新 health/event_log 状态）→ `d = aae(r)` 决定 routing target（`81208`）→ 只有 session/meta 目标才 `$s(…,"- [ ] @evt(<yd>)")` 追加进 mailbox（enqueue，meta `81221` / session `81231`；gateway 目标走 `81209` 的内联应答分支不入队）→ 最后 `n?.bus && n.bus.emit("spine.event", r)`（`81241`，**emit 受 `n?.bus` 守卫：未注入 bus 时不广播**）。
- **`session.wake` 不在 `hae` 内**，而由**调用方**在 `routing.enqueued` 为真时 emit：channel.ingress（`83127`）、channel.command（`83171`）、gateway 触发的 `/compact` 调用方（session.compact `82305`、idle-compact `80877`）。即「先事件落盘 → 后入队 → 最后由调用方唤醒」。
- **channel.ack 是双路径游标提交**（`83227-79346`）：按 `:` 前缀 channel 反查 `Go`/`rne` 走一路；否则直接 `Ts` 查记录、必要时 `Bk` 重建后经 `Nae`/`Xz` 提交投递游标——含 `-32602 Invalid cursor` 游标校验分支与 `-32002` 归档中守卫（`fr(g.session_key)`）。它不只是「置 sent」，而是带校验与归档态的游标推进。

---

### 论点 4 · 对外双通道数据面 + 零依赖契约包：HTTP 拉（drain）vs WS 推（订阅 + backlog 回放）

**所以呢**：同一个 `channel.pull` 方法对简单适配器（只 poll HTTP）和富客户端（订阅长连流）各取所需，而两端共享同一个随包发布的编译期契约，杜绝手抄漂移——这是想做 Agent 平台化的解耦支点。**关键更正**：RPC 才是 drain，WS 根本不 drain。

- **RPC 形态 = drain，且门控于 `return_mask` 含 `"final"`。** `E = k.includes("final")`（`83199`）；`R = E ? await Kz({… limit: g.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50) …}) : []`（`79299/83218`），返回 `records / next_cursor(R[last].yd) / idle(R.length===0)`（`79302-78511`）。不含 `final` 则 records 恒为空。
- **WS 形态 = 打开持久订阅 +（含 `final`）回放 backlog，records 不在 RPC result 里返回。** WS 上下文里 channel.pull **直接短路、根本不 drain**：`if(_?.wsSubscriberId) return await Oet({…}), v.result={opened:!0, …}, v`（`79282-79294`）——不调 `eF`、result 里无 records。真正的排空在 WS 外层 message handler：`I.result && !I.error` 后 `c.subscribe`（`83581`）打开订阅，再由 `Dae`（decl `81369`）以 `session.output` 通知形式回放 outbox backlog（`79643`）。**`eF` drain 仅 RPC 路径独有**。
- **replay 窗口去重**：`ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0`（`83611`），期间用 `g = new Set` 抑制重复（`suppressed duplicate output during replay window`，`83588`）；`onDelivered` 推进游标 `Qz`、`Rl` 标 sent、`Xf` 写 `.sent_ids`（`83622-79649`）。WS 送信器 `k(R, $=!0)`（`78740-79560`）正常推 `session.output` 时若 `$` 且有 consumerId 则 `Qz` 推进投递游标；replay 期用 `k(Nt,!1)` 关闭该副作用、改由 `onDelivered` 推进——这是「replay 不重复推进游标」的关键。
- **订阅注册表 `x4`(`82537`)做 sessionKey→订阅者扇出。** `Map<sessionKey,Set<yd>>` + `Map<yd,subscriber>`，按每订阅者 `returnMask`（默认 `["final","stream"]`，`82542`）过滤：`final`→`session.output`（`82550`）、`stream`→`session.stream`（`82577`）、`tool`→`session.execution`（`82604`）、`stream_end`→`session.stream_end`（`82634`）；发送异常自动摘除订阅者。`returnMask` 值域校验器是 `L6`（`83308`：`final|stream|stream_end|tool`，空回退 `["final","stream"]`）。
- **stream_end reason 能力降级契约**：`zU` 内 `m==="interrupted" || v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`81048`），与 WS 订阅透传 `acceptStreamEndReasons`（`78800`）一致——daemon 按消费者声明的能力把不认识的 reason 降级为 `"interrupted"`，老插件优雅退化。
- **零依赖契约包 `@openduo/protocol@0.6.0`**（`"dependencies":{}`、`"main":"src/index.ts"`，源码 `.ts` 随包发布，位于 `@openduo/duoduo/node_modules/@openduo/protocol/src/`）：`rpc.ts` 信封与守卫、`channel.ts` 全部 params + 校验器 + `outboxToOutbound`、`outbox.ts` `OutboxRecord`/`TurnMeta`、`notifications.ts` 4 种下推、`channel-binding.ts` `ChannelType`。通道插件以 npm tarball 安装（`cli.pretty.js`：`mkdtemp aladuo-channel-plugin-`、`tar -xzf`、`package.installing` 标记）。
- **outbox 落盘**：id `obx_${randomUUID()}`（`35607`），路径 `join(outboxDir, t, `${n}.json`)`（`35611`）；双索引 `by_event.jsonl`（`35756`）/`by_id.jsonl`（`35854`）+ `.sent_ids`（`35760`）+ `replay/`（`35835`）+ `.pending_queue.jsonl`（`36175`）。

---

### 证据表

| 机制主张 | 证据（字面量/片段） | 位置 | 置信 |
|---|---|---|---|
| 三监听器（TCP只读/socket全权/可选token远程）共享同一路由构造闭包，非各自独立注册 | `I(app,{hostGuard,readOnly,bearerToken})` 挂 healthz/readyz/dashboard/rpc/ws；三次调用见下 | daemon.pretty.js:83430-83664（构造）, 82711-82769（三次调用） | confirmed |
| readyz 探针 Ane = 能否 append events 日志，否则 503 not_ready | `await Ane(n) ? {status:"ok"} : _.code(503).send({status:"not_ready"})` | daemon:75780/78072-78075 | confirmed |
| 只读 TCP 端口默认 20233、host 恒 127.0.0.1；unix socket 默认 `<runDir>/daemon.sock` mode 0600 | `Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233)`；socket 路径 `e.daemonSocketPath ?? t.ALADUO_DAEMON_SOCKET ?? join(u,"daemon.sock")`，父目录须 0700、socket chmod 0600 | daemon.pretty.js:57415-57416（socket 路径）, 82743-82757（权限校验+chmod）, 82867-82868（TCP 监听） | confirmed（含活体） |
| RPC 是 if/else 链而非 Map；链含 system./session./job./usage./spine./channel.* 全套 handler；仅未匹配 →-32601 | `async function m(h,_)` 起 78078；`system.runtime.info`/`session.*`/`job.*`/`usage.get`/`spine.tail`/`channel.file.upload`；链尾 `-32601` + 活体 `bogus.method→-32601` | daemon:78257/78146/78165/78285/78367/78428/78512/78521-78522 | confirmed |
| 请求体守卫 S_ = isJsonRpcRequest；/rpc 未过 400，WS 未过 -32600 | `S_`：`t.jsonrpc==="2.0" && typeof t.method=="string"`；活体 `{"method":"x"}→400` | daemon:76148-75973 / 78538 / 78593-78599 | confirmed |
| WAL：事件先 append 再入队 | `await tn(e,r)`（append 事件日志，75724）在 `Ho(…,"- [ ] @evt(…)")` 入队之前 | daemon:75724 / 75571/75581 | confirmed |
| routing target 决策在 `mae`→`w5e`（斜杠命令/intent），`aae` 仅读取器 | `w5e`：intent status/config/debug 或纯命令 →gateway、history-control →session；`aae` return target∈{…}?…:"session" | daemon:81060 / 80980 | confirmed |
| `hae` 内 `aae` 落点 + spine.event emit | `d=aae(r)`（81208）；`bus.emit("spine.event",r)`（81241） | daemon:81208 / 81241 | confirmed |
| session.wake 由调用方按 routing.enqueued 触发（非 Dne 内） | `X.routing.enqueued && emit("session.wake"…)` | daemon:77941 / 78233 / 78277 | confirmed |
| gateway 目标事件内联应答、不入队 | `[gateway] gateway-targeted event (no enqueue)`；meta 写 `"meta:subconscious"` | daemon:75738-75569 | confirmed |
| protocol 零依赖契约包，源码随包发布（嵌套路径） | `"dependencies":{}`、`"main":"src/index.ts"`；`ChannelRpcMethods = describe｜spawn｜ingress｜command｜pull｜ack` | @openduo/duoduo/node_modules/@openduo/protocol@0.6.0/src/{channel,rpc}.ts | confirmed |
| channel.ingress：archiving 守卫 -32011、workspace 守卫 -32010 | `code:-32011`（`fr(g.session_key)`）；`code:-32010,message:k.guidance` | daemon:78375-78212 | confirmed |
| source_kind 缺省按传输层推断 | `g.source_kind ?? (_?.wsSubscriberId?"ws":"rpc")` | daemon:78379 | confirmed |
| channel.pull RPC = drain，门控 return_mask 含 "final" | `E=k.includes("final")`；`R=E?await Kz({… limit… ??50}):[]`；返回 records/next_cursor/idle | daemon:78484/78320/78324/78327-78332 | confirmed |
| channel.pull WS = 打开持久订阅 + backlog 回放，不 drain、records 不在 result | `if(_?.wsSubscriberId) return await Oet(…), v.result={opened:!0,…}`（无 records）；外层 `c.subscribe`；`Dae` 回放 backlog | daemon:78486-78319 / 78619 / 78659 | confirmed |
| channel.pull replay 窗口去重 + 游标推进 | `ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0`；`suppressed duplicate output during replay window`；`onDelivered`→Jz/Rl/Yf | daemon:78828 / 78626 / 78660-78665 | confirmed |
| channel.ack 双路径提交 + -32602 invalid cursor / -32002 归档 | `:` 前缀反查 `Go`/`rne` 一路；`Ts`+`Bk`+`Nae`/`Xz` 一路；游标校验 -32602、归档 -32002 | daemon:78512-78366 | confirmed |
| outbox 落盘 `<kind>/<yd>.json`，id=obx_<uuid> | `obx_${randomUUID()}`（34179）；`join(outboxDir,t,`${n}.json`)`（34183） | daemon:34199 / 34183 | confirmed |
| outbox 双索引 by_event/by_id + .sent_ids + replay + pending_queue | `by_event.jsonl`, `by_id.jsonl`, `.sent_ids`, `replay/`, `.pending_queue.jsonl` | daemon:34348/34332/34407/34426 / 34747 | confirmed |
| 订阅按 returnMask 扇出三类通知 + 异常摘除 | `session.output`(76562)/`session.stream`(76589)/`session.execution`(76614)/`stream_end`(76637)；默认 `["final","stream"]` | daemon:76728-76638 | confirmed |
| returnMask 校验值域 | `q2`：`"final"|"stream"|"stream_end"|"tool"`；空则回退 `["final","stream"]` | daemon:77481 / Vz 默认 76554 | confirmed |
| stream_end reason 降级契约（代码侧落点） | `m==="interrupted"||v.acceptStreamEndReasons?.includes(m)?m:"interrupted"`；WS 透传 `acceptStreamEndReasons` | daemon:76817 / 78621 / protocol channel.ts | confirmed |
| system.shutdown 自杀 | `/rpc` 与 WS 均 `__triggerShutdown` → `setImmediate(()=>process.kill(process.pid,"SIGTERM"))` | daemon:78721-78543 / 78683-78684 | confirmed |
| 20234 save-api 不存在于本 build | grep `20234\|save-api\|save_api` 三文件皆空；活体 `curl :20234 → 000 无响应` | — | confirmed（活体+静态） |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **JSON-RPC 信封**（`rpc.ts`）：请求 `{jsonrpc:"2.0", yd?, method, params?}`；响应 `{jsonrpc:"2.0", yd, result? | error:{code,message,data?}}`。错误码：`-32700` parse、`-32600` invalid request（WS 守卫失败落此，非 400）、`-32601` method not found、`-32602` invalid params / invalid cursor、`-32603` internal；业务码 `-32010`（workspace 不可用）、`-32011`（**channel.ingress** 归档守卫，`82136`）、`-32002`（**channel.ack** 归档守卫，`83227-79346`；语义同为归档中，挂在不同方法）。

- **RPC 方法清单**（daemon if/else 链 `m(h,_)` 实际分发的全集，非仅 channel.\*）：
  - `system.shutdown`（`83037`，链首，触发自身 SIGTERM）、`system.runtime.info`（`83040`）、`system.status`（`83353`）、`system.config`（`83403`）
  - `session.archive / list / set_alias / notify / compact`（`83059-83075`）
  - `job.create / get / list`（`83261-83309`）
  - `usage.get`（`83322`）、`spine.tail`（`83406`）
  - `channel.describe / spawn / ingress / command / pull / ack`（`ChannelRpcMethods` 联合类型），外加 `channel.file.upload / download`（`83179/83187`）
  - **其余（真正未匹配的方法）落链尾 → `-32601 Method not found`**
  - `outboxToOutbound`（`channel.ts`）为出站记录→通道 outbound 的投影函数（非 RPC 方法，随契约包导出）
  - 注意：`session.wake / spine.event / cadence.tick` 是**总线事件**不是 RPC；`session.output / stream / execution / stream_end` 是**服务端→客户端通知**（`notifications.ts`），仅在 WS 上单向下推

- **`OutboxRecord`**（`outbox.ts`，磁盘 `outboxDir/<channel_kind>/<yd>.json`）：`yd, idempotency_key, created_at, channel_kind, session_key, in_reply_to_event_id?, routing:{policy:"reply_to_origin"|"reply_override"|"fanout", origin_event_id, origin_session_key, origin_channel_kind, fanout_index, fanout_total}, payload:{text?, attachments[], data?, rendering_hints:{format:"markdown"|"text"|"card", mentions[]}}, stream:{stream_id, seq, is_final}, status:"pending"|"sent"|"failed", attempts, last_attempt_at, last_error`。

- **`TurnMeta`**（`outbox.ts`，投影到 `payload.data.turn_meta`，供通道渲染卡片页脚）：`elapsed_ms, total_input_tokens, output_tokens, cache_hit_rate, total_cost_usd, model, context_used_tokens, protocol:"anthropic"|"codex"`。

- **索引/游标文件**（同 outboxDir）：`index/by_event.jsonl`（event_id→记录，用于 in_reply_to 反查，内存缓存 `xa`）、`index/by_id.jsonl`、`.sent_ids`（已投递集合，内存缓存 `z1`）、`replay/<session_key>.jsonl`、`.pending_queue.jsonl`。

- **channel.ingress params**：`{session_key, display_name?, text?, idempotency_key?, cwd_abs?, attachments[], source_kind?, channel_id?}`；返回 `{event_id, gateway_response, outbox_id}`。`source_kind` 缺省按传输层推断 `wsSubscriberId?"ws":"rpc"`（`79168`）。

- **channel.pull params**：`{session_key, consumer_id, cursor?, limit?, wait_ms?, return_mask:("final"|"stream"|"stream_end"|"tool")[], channel_capabilities:{outbound:{accept_mime[], max_bytes?, accept_stream_end_reasons?[]}}}`。返回形态因传输而异：RPC 回 `{records, next_cursor, idle}`（含 `final` 时）；WS 回 `{opened:true, session_key, consumer_id, cursor, return_mask}`（records 走订阅推送，不在 result 内）。

- **服务端下推通知**（`notifications.ts`）：`session.output{session_key,record}`、`session.stream{session_key,chunk,is_sidechain?}`、`session.execution{session_key,event:(tool_use|thought_chunk|tool_result|tool_input_delta)}`、`session.stream_end{session_key,reason:"interrupted"|"skipped"}`。

- **邮箱入队标记**（enqueue 的物理形式）：向 mailbox 文件追加一行 `- [ ] @evt(<event_id>)`；meta 目标写入 mailbox key `meta:subconscious`。

### 给 Agent PM 的洞察

> 1. **入站即分流，是「输入闸门」而非「消息队列」——这才是本节的塔尖。** routing target 三态（gateway/meta/session）在 `Nne`→`AGe` 阶段就据斜杠命令 / intent 判定，`/status /config` 类命令直接内联回执、不入队不唤醒，等于在网关层做一次廉价的「是否需要动用模型」短路。对话式 agent 若想省 token，可借鉴这种「入站即分流、能不进模型就不进」的分层——它把「代码守骨架、模型做裁决」的边界物化在了控制面第一跳。

> 2. **WAL-before-enqueue 是可靠性核心，但入队媒介是 Markdown 邮箱文件而非队列中间件。** 事件先 append 进 spine 日志（`Xt`）再往 mailbox 追加 `- [ ] @evt(yd)`，崩溃可重放；幂等命中时「去重即重放上次回执」（回填 `gatewayResponse/gatewayOutboxId`），语义完整。代价是「队列」就是纯文件，吞吐/并发靠文件锁与内存索引缓存（`ga/z1`）兜底——适合个人级自治 agent，规模化到多租户高并发时这层会成瓶颈。

> 3. **「契约包 + 拉/推双形态」是通道生态的解耦支点，但拉/推语义并不对称。** RPC 是 drain（`eF` 排空，门控 `final`），WS 是订阅 + backlog 回放（`opened:true` 短路，records 走推送）——同一个 `channel.pull` 让「简单适配器只 poll、富客户端订阅流」各取所需，且共享随包发布的零依赖 `.ts` 契约避免手抄漂移。设计通道协议时，务必写清「同一方法在不同传输上返回形态不同」，否则极易误以为 WS 也 drain。

> 4. **能力协商做了向后兼容的「降级而非报错」。** `accept_stream_end_reasons`/`accept_mime` 让 daemon 按消费者声明的能力下调输出（不认识的 stream_end reason 降级为 `interrupted`，`81048`），新语义对老消费者优雅退化。做长期演进的 agent 协议时，这种「生产者按消费者能力下调输出」比版本号更抗腐蚀。

> 5. **控制面刻意极简、无鉴权、绑定 loopback。** 单端口、if/else 分派、默认 `127.0.0.1`、`/rpc` 无 token 校验——安全边界完全押在「本机单用户」假设上；`system.shutdown` 甚至能直接 `SIGTERM` 自身。作为产品能力边界要清楚：这是单机自治 runtime，不是可暴露的多租户服务。

（相关文件：`daemon.pretty.js:79031-79684`（fastify/RPC/WS）、`78724-78864`（Ene/JHe/One/fy 分流）、`78864-78993`（Dne WAL 入站）、`82305/83127/83171`（session.wake 触发点）、`35607-35858 / 36175`（outbox 落盘与索引）、`80959-81048`（订阅扇出/降级）；`@openduo/duoduo/node_modules/@openduo/protocol/src/{rpc,channel,outbox,notifications,channel-binding}.ts`。）


---

# 第四部分 · 后台自治：靠心跳自我维护而绝不越权

> **关键句**：无人对话时，运行时靠心跳自我维护。潜意识引擎经活动门节流后唤起无状态一次性 LLM 分区会话做维护（§6），记忆系统只做只读测量与软删 GC、一切内容改写交回模型（§7）；机器真正强制的只剩契约门。心跳先转，才有分区加工经验（v0.8.0 起由 gradient-distiller/intuition-weaver 取代 memory-weaver，见 §6 更新块）——收束回 §0 的闭环。


---
## §6 Cadence 心跳 / Subconscious 引擎

**潜意识引擎是 duoduo 的"自主神经系统"：一条 37 分钟心跳，经内存指纹活动门节流后，按用户可改写的 playlist 轮流唤起一批无状态一次性 LLM 分区会话做自我维护；全部跨拍状态落在文件，而机器真正强制的边界只剩契约门 `GP` 与分区工具 allowlist（`PARTITION_CORE_TOOLS`）两处。** 这句话统辖本节四个论点：心跳的**节拍与解耦**、潜意识引擎的**三重节流门**、分区的**无状态执行与两级路由**、以及**唯二的机器强制边界**。以下每个论点先给结论，再落 file:line 证据（行号大多仍对齐 beautified v0.6.1——本节自 v0.6.1 起未逐行重新核对，v0.7.1/v0.8.0 两次跨版本 delta 均只体现在下面的更新块里，其余具体行号按最新版本已漂移，标**未证实推测**）。

> **v0.8.0 更新（confirmed，磁盘 + 代码双证）——分区集合改组，cadence-executor 与 memory-weaver 均已下线：**
> `subconscious/` 目录现只有 **4 个分区**：`gradient-distiller`（cooldown 5, timeout 2100000ms=35min，`contract.consumes:[scan-gap.v2]`）、`intuition-weaver`（cooldown 5, timeout 2100000ms=35min，`contract.consumes:[fold-gap.v1, entity-converge.v1, merge.v1, orphan-islands.v1, orphan-newborn.v1, claude-compress.v1, claude-lint.v1, claude-flatten.v1, activation-report.v1]`）、`pattern-tracker`（cooldown 7, timeout 900000ms=15min，`contract.consumes:[node-converge.v1, revise.v1, orphan-newborn.v1]`，不变）、`memory-committer`（cooldown 3, timeout 1800000ms=30min，无 `contract:`，不变）。旧的 `memory-weaver`（cooldown5/timeout35min）与 `cadence-executor`（cooldown1/timeout10min）目录连同其 `.claude/agents/{entity-crystallizer,intuition-updater,spine-scanner}.md` 子 agent 已被整体删除。`gradient-distiller`+`intuition-weaver` 二者 cooldown/timeout 数值与旧 `memory-weaver` 完全相同——是**一分为二**而非新增：`memory-weaver` 原先"扫描证据+改板"两件事，现按 `scan-gap.v2` vs 其余 8 种 kind 拆给两个更窄职责的分区。`orphan-newborn.v1` 同时被 `intuition-weaver` 与 `pattern-tracker` 两家声明消费——对应代码里 `routeContractDecision (aB)` 按 lesson-/groove- 前缀二选一投递，两分区都要能接才行得通。**下文 §6/§7 提到"memory-weaver"之处，除非另注，均指这次拆分前的 v0.7.1 及更早行为**；本轮未逐条回填每处提及为新分区名。
> **cadence 队列机制被整体移除（confirmed，代码证据）：** v0.7.1 的 `enqueueCadenceItem`/`markCadenceItemsDone`/`mergeCadenceInbox`/`parseCadenceQueue` 四个导出在 v0.8.0 daemon 里已不存在（`reconstruction/maps/rename_daemon.json` 新旧对比 + 全仓字符串检索均为零命中），`runCadenceTick` 新增导出 `resolveCadenceIntervalMs` 替代原先内联的 env 解析。**这意味着下面论点 1/3 里"`mergeCadenceInbox`确定性入队 + `cadence-executor`分区LLM出队分发"的两级路由已经连同 `cadence-executor` 一起消失**——`## Runtime Context` 注入模板里 "Cadence inbox:"/"Cadence queue:" 两行路径也被删掉，换成新增的 "Spine CLI: `<cliEntryPath> spine`" 一行（`daemon.pretty.js:79785`，与 `subconscious/CLAUDE.md`"Large File Guard"一节要求经 Spine CLI 读大分区文件的说明互证）。具体新的 tick 内部调用顺序未逐行重新核对（未证实推测），但"经 cadence 队列文件二次路由进分区收件箱"这条机制本身已确认不再成立。



---

### 论点 1 · 一条心跳、两级解耦：emit 广播不被维护环阻塞，60s cron 是另一条独立定时器

**所以呢：** duoduo 把"系统自我维护"、"任务调度"、"自主思考"分到不同节拍/不同门，慢的 LLM 会话拖不垮维护与定时作业。它们不是"一个心跳两个环"，而是**两条互不相干的定时器**，且潜意识总线在心跳回调里被最先广播、绕过维护环重入门。

- **37min 心跳**：`let q=kSe("ALADUO_CADENCE_INTERVAL_MS",222e4,1e3)`（`daemon.pretty.js:85551`；`kSe` 定义 `83192`），env 可覆盖、带 `1e3` 最小 clamp（低于 clamp 或非整数则告警回退默认值）；活体 `duoduo daemon config` → `interval_ms: 37min (2,220,000ms) (default)`。单个 `setInterval`（`85556`）回调体第一个表达式就是 `h.emit("cadence.tick")`（`85557`），**在同一行 `if(…, J){…skipped…;return}` 重入门之前**；随后 `J=!0`（`85561`）、`o(d).then(...).finally(()=>J=!1)`（`85563-85570`）才跑维护环（`o`=`runCadenceTick (Sct)`，定义 `80443`）。故潜意识总线不受维护环 `K` 阻塞。（confirmed）
- **60s job-scheduler 是另一条定时器**：pid0 里 `C=o({paths,sessionManager})`（`79803`）、`C.start()`（`79807`）单独启动（默认间隔 `met=6e4`=60s，`79151`），到期 cron 扫描 `scanAndSpawnDueJobs (M6)`（`78956`）。与 37min 心跳完全解耦，不属维护环。（confirmed）
- **v0.6.1 调度作业建时校验 + 复合时长**：建作业在 `createJob` 内先过校验器 `xue`（`56581`，调用点 `55829`）——空调度、非法 cron（交 `CronExpressionParser.parse`，`56068`）、畸形时长均在**建作业时**抛错拒绝，而非跑时静默失败。时长由复合解析器 `Kb`(`55859`)按 `/(\d+)([smhdw])/g` 逐段累加，故 `@in 2h30m` / `@every 1d6h4m` 合法，残串不覆盖整串即 `Invalid duration format`（`55866`）；`L2`(`55870`)再挡"超出可表示时间范围"的超范围延迟。（confirmed。注：ajv 的 `compositeRule` 是无关 vendor 噪声，不在此路径）
- **维护环 `runCadenceTick (Sct)`（`78923`）顺序**：`await pm(e),await hm(e)`（`78919`）→ `runMemoryCheckTick`（`78923`）→ `sweepTombstonedSessionRecords`（`78928`，try/catch 非致命）→ `mergeCadenceInbox (Z_e)`（`78934`）→ `parseCadenceQueue (G_e)`（`78147`）→ 构造 `type:"system.cadence_tick"`（字面量在 `78937`，`payload.count` 在 `78948`）→ `atomicAppendEvent (Xt)` 持久化 + `advanceConsumerWatermark (hl)` + `Ca(...cadence:{last_tick:r.ts})`（`78158`）。（confirmed）
- **`pm/hm` 是 broadcast lint，`Z_e` 才是队列合并**：`sye`(`62371`)读 `memoryBoardPath` 并检测未解析 wiki 链（`Yrt=/\[\[([^\]\n]+)\]\]/g`，`62396`），断链时选中一条 `CLAUDE_LINT` 任务、`pendingFilename:"claude-lint.md.pending"`、目标分区 `intuition-weaver`（`Krt`，`62396`）；`mergeCadenceInbox (Z_e)`（`78875`）读 `cadenceInboxDir` 的 `.pending`、`fet(r,i)` 合并进 `cadenceQueuePath`（`78901`）、`78904` unlink 已并文件、返回 `i.length`。（confirmed，`Z_e` 相关行号本轮未重新核对）
- **（v0.5.10，channel 会话侧的空闲节流）channel 空闲自动 compact**：channel 会话配置新增 `auto_compact_idle_minutes` / `auto_compact_min_context_tokens`（解析于 `Mk`，`35050`；字段落位 `35060`/`35061`）——空闲超阈值且上下文 token 超阈值时自动压缩会话历史。默认关闭、按会话配置，属 channel 会话生命周期而非潜意识分区，但同属"定时 + 阈值门控省成本"家族。（confirmed）

---

### 论点 2 · 潜意识引擎靠总线事件驱动，三重门把固定节拍变成事件驱动的自适应节奏

**所以呢：** 引擎自身没有定时器，只挂在心跳总线上；三重门（重入/停机、内存指纹活动门、cooldown/backoff）联合实现"没有新证据就不空转"——把固定 37min 节拍变成随记忆变更自适应的节奏。

- **总线挂载、非自持定时器**：`createMetaSession (vct)`（`78315`）内 `n.on("cadence.tick",x)`（`78745`），日志 `"[meta-session] started, listening for cadence ticks"`（`78755`）。`x`（`78731`）是去重包装：记在途 promise `p`，若 `l||d` 直接 `g()` 不追踪。（confirmed）
- **门一 · 重入 + 停机**：`74524 if(l||d){...skipping tick...;return}`——`l`=processing、`d`=stopRequested，**独立于维护环 `K` 的第二套门**。（confirmed）
- **门二 · 内存指纹活动门**：`75470` 处 `let[k,E,R,$,I]=await Promise.all([KI(memoryFragmentsDir),KI(memoryEntitiesDir),KI(memoryTopicsDir),net(t),ret(t)]),P=[...].join(":"),C=eet(P)`；`74535 if(m!==null&&C===m){...activity gate: skipping tick (fingerprint unchanged)...}` 整跳。（confirmed）
- **门三 · cooldown / backoff（round-robin 选择器 `w`, `75446`）**：逐项 `74512 done→skip`；`74514 !C||!enabled→return P`（交由 `b` 用 `xI` 勾掉推进）；`74516 backoff(A2)→continue`；cooldown 判定在 `78661-78672`：`G=Math.max(0,C.schedule.cooldown_ticks),K=_.get(P.name); if(K===void 0||R-K>=G) return P`（`_`=分区→上次 tick 序号 Map，`75164`）。失败退避 `L4`（`60594-60605`）是**线性、非指数**：`success/invalid_output→null`（`60595`）；timeout `60598 if(t<=2)return null` 后 `min(t*i,Ant)`（`60599`）；error `60602 if(t<=1)return null` 后 `min(t*2*i,Nnt)`（`60603`）；常量 `Ant=72e5(2h)/Nnt=144e5(4h)/bh=222e4`（`60617`）。`j4`(`60590`)读 `backoff_until` 判定退避中；`b` 选取后再读一遍全分区 state，用 `zB` 过滤出本拍 `backedOff`（`77577`）。（confirmed）
- **选取 + 空闲补跑**：`74548 K=await b(L,G,h)`；`74549-74550 if(K?.name&&u>1&&(!r||r.activeCount()<=1)) for(W=1;W<u&&await b(...);W++)`，`u=maxPartitionsPerIdleTick??2`（`75164`）。（confirmed）
- **同拍二次 broadcast lint（易漏节点）**：除维护环 `Iet:74949` 外，`g` 里在分区选取**之前**又跑一遍 `await pm(t),await hm(t)`（`78689`）。（confirmed）

---

### 论点 3 · 分区是无状态一次性 LLM 会话；playlist 是可自改写的纯文本状态机，且存在"确定性入队 + LLM 出队"两级路由

**所以呢：** 调度不硬编码 cron，而是 agent 自己能改写的 `playlist.md` checkbox 轮次 + 分区 frontmatter；每分区是一次性 SDK 会话，"除了写进文件的都不记得"，跨 tick 协作全靠 inbox 与共享 `memory/`。

- **playlist 状态机**：分区加载器 `kv`(`60333`)、解析器 `Pnt`(`60416`)只解析 `## Current Round`，`- [x]`=done、`- [ ]`=未做，遇下一 `## ` 停。`DP`(`60435`)把 `- [ ] <name>`→`- [x]`、造 `- <ISO> executed=<name>`、splice 进 `## History`。整轮全勾时 `rge`(`60453`)用 `n=t.filter(s=>s.schedule.enabled)` 重建 round（confirmed；日志文案与 idle 判据本轮未重新逐行核对）。
- **分区执行闭包 `I(S,D,$)`（`createMetaSession (vct)` 内，`79907`）**：无状态一次性 SDK 会话 `persistSession:!1`（`80063`）；提示词 `_ = S.promptContent + Ae（"### Partition" 块，80014）+ D（`_ct` 产出的 ## Runtime Context，每 tick 在 80275 算一次后传入）+ Q（`bct` 产出的 ## Inbox，80013）`（拼接见 `80019-80028`）；超时 `se=Math.max(1,S.schedule.max_duration_ms)`（`80044`）、`De=setTimeout(...)`（`80091`）、`j=await Promise.race([ze,ft])`（`80100`）。结果四分类由 `mct(S.name, iSe(j?.text))`（`80107-80108`，`mct` 定义 `79692`）判定——其中 `invalid_output` 是"跑成功但产物不合格"的唯一判定点。成功落 `agent.result tick_type:"subconscious"`（`80182`），失败落 `agent.error stage:"partition_execution"`（`80203`；runtime 不可用那条另走 `79929`）；并写一条 `appendDrainRecord (Od)` usage drain record（`80157`，`session_key: meta:subconscious:<partition>`）——这正是 `usage.get` 能显现潜意识开销的动态节点。runtime 由 frontmatter 选：`q=S.runtime, J=q ?? _o()`（`79910-79911`，frontmatter 解析在 `Int`，`60357`）。（confirmed）
- **上下文注入**：`_ct`(`79782`)建 `## Runtime Context` + `### Key Paths`（kernel/memory/entities/topics/fragments/registry/events/jobs/subconscious 目录清单）；`bct`(`79789`)建 `## Inbox`（每条 pending 消息列 `- ${file}: ${message}`，处理后删文件 ack）。（confirmed）
- **两级路由（易漏节点）**：`mergeCadenceInbox (Z_e)`（`78875`）只做**确定性**的 `.pending`→`queue.md` 合并；真正把 `queue.md` 的 checkbox 任务**路由进各分区 directed inbox** 的是 `cadence-executor` 这个 **LLM 分区**（其 `CLAUDE.md` 自述 dispatcher 角色："route checkbox tasks from the shared cadence queue into the directed inbox"）。即 `Z_e`（确定性入队）+ cadence-executor（LLM 出队分发）两级。（confirmed，磁盘实证）
- **原"未证实推测"已解开**：`cadence-executor: enabled (cooldown 1, timeout 10min)` 在代码里搜不到，因为它是**用户数据里的分区名，不是代码**——磁盘实证 `subconscious/cadence-executor/CLAUDE.md` frontmatter `schedule:{enabled:true,cooldown_ticks:1,max_duration_ms:600000}`；`daemon config` 的 `[Subconscious]` 段就是逐分区渲染各自 frontmatter schedule（经 `z9e:55657` 解析）。10min≠默认 60s 只是该分区**覆盖了 `rU` 默认（`rU={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`, `57705-57708`）**。四分区 `cadence-executor/memory-committer/memory-weaver/pattern-tracker` 的 cooldown 1/3/5/7、timeout 10/30/35/15min 均为 per-partition frontmatter 覆盖。（原"未证实/待查"→ confirmed：per-partition frontmatter 覆盖。**v0.8.0 更新**：`cadence-executor` 已删除、`memory-weaver` 已拆成 `gradient-distiller`+`intuition-weaver`，现四分区是 `gradient-distiller/intuition-weaver/pattern-tracker/memory-committer`，cooldown 5/5/7/3、timeout 35/35/15/30min，见 §6 开头更新块）

---

### 论点 4 · 机器真正强制的边界只有两处：契约门 `enforceContractGate (GP)` 与分区工具 allowlist（`PARTITION_CORE_TOOLS`）；memory lint 全程只读、契约门控

**所以呢：** 自治 agent 的"自我修改"必须区分"提示词约束"（软、模型可违反）与"运行时强制"（硬、不可绕过）。软边界写在提示词；机器强制的关键不变量只落在契约门与工具白名单两处，memory lint 只做只读测量。

- **契约门 `GP`（`61486`）= 6 拒因 + null 放行**：`partition-absent`（`58815`）/ `self-yd-mismatch`（`58816`）/ `partition-disabled`（`58817`）/ switch `valid→consumes.has(e)?null:"kind-not-consumed"`（`58820`）/ `no-contract→n?null:"no-contract"`（`58822`）/ `parse-fail→n?null:"parse-fail"`（`58824`）——第三参 `n`(flagFallback) 可放行后两者。（契约状态由 `hU:56860` 读分区 CLAUDE.md 的 `contract:` frontmatter 产出）（confirmed）
- **`GP` 是双重角色门（易漏节点）**：不仅逐项裁决投递，还能**整拍短路** lint——`runMemoryCheckTick (_it)`（`62716`）里 `62736 a=bit(()=>Age(s)); 62737 if(!a&&!r) return o`，`Age`(`61560`)内部对所有契约调 `GP`，若无任何契约 consume 任何 kind（且未开 forget），整个 memory-check tick 直接空返。（confirmed）
- **lint 全程只读、每类每 tick 至多一条、契约门控**：受 `dB`（`62686`）读的 `ALADUO_EXP_MEMORY_CHECK`(check) 与 `ALADUO_EXP_MEMORY_FORGET&&check`(forget，依赖前者) 开关。子步（经 `nd` try/catch 包装，`57702`）：`57001 orphan-states`（无条件）；check 门内 `57006 board-lint / 57008 entity-lint / 57010 node-lint / 57012 gap-lint / 57014 orphan-newborn-island`；forget 门内 `57019 orphan-forget`。投递经 `IP`（`58220`，调用点 `58966`）→ posted/withheld，投递前按 `aB`（`62649`）按内存节点路径路由到分区名（`rel.startsWith("topics/")&&(slug lesson-/groove-)?"pattern-tracker":"memory-weaver"`，`orphan-forget` 分支 `57027 hle(o,hU(p))`）。活体 `daemon status`：`memory_check: check=off forget=off (posting governed by partition contracts below)` + 4 条 contract。（confirmed）
- **自编程硬边界 = 分区工具 allowlist（v0.5.10 denylist→allowlist）**：v0.5.8 的 `DEFAULT_DISALLOWED_TOOLS` denylist 已退役，分区会话改由**白名单**界定能力：`PARTITION_CORE_TOOLS (Nz)=["Bash","Read","Write","Edit","Grep","Glob","Agent"]`（`49745`）→ `H=[...new Set([...Nz,...k.claudeTools??[]])]`（`78481`）→ SDK `run({...,tools:H})`（`78501`）。分区只能用这 7 个核心工具 + frontmatter `claude.tools` 显式追加项；`EnterPlanMode`/`ExitPlanMode`/`WebFetch`/`WebSearch`/`EnterWorktree` 等因不在白名单而天然禁用，无需 denylist。（confirmed）
- **`system.cadence_tick` 是 Spine 事件、非 RPC（动态印证）**：活体 `spine.tail` 复现 `system.cadence_tick` 事件流，紧随 `agent.tool_use/tool_result(memory-weaver)` → `agent.result tick_type=subconscious partition=memory-weaver` → `pattern-tracker`，动态印证 round-robin 顺序执行分区、每分区落 `agent.result`。（confirmed，动态）

---

### 证据表

| 机制主张 | 证据（字面量 / 代码片段） | 位置 | 置信 |
|---|---|---|---|
| 心跳周期 `kSe("...",222e4,1e3)`，env 可覆盖、带 1e3 clamp | `interval_ms: 37min (2,220,000ms) (default)` | `daemon.pretty.js:85551`（`kSe` 定义 `83192`）；`duoduo daemon config` | confirmed |
| 单 `setInterval` 同拍先 emit `cadence.tick` 再跑维护环，emit 在重入门 `K` 之前 | `f.emit("cadence.tick"); if(...,K){...return}; K=!0; s(d)...finally(()=>K=!1)` | `daemon.pretty.js:83856-79652` | confirmed |
| cron 扫描 `scanAndSpawnDueJobs (M6)` 属独立 60s job-scheduler（默认 `met=6e4`），非维护环 | `C=o({...}); C.start()`；`M6` 到期扫描 | `daemon.pretty.js:79803/79807`、`78956`、`79151` | confirmed |
| 建作业校验 + 复合时长：非法 cron/畸形时长/超范围延迟建时拒绝 | `xue` 建时校验（`CronExpressionParser.parse`）；`Pb` 复合时长；`Bq` 超范围挡 | `daemon.pretty.js:56581/56862`、`56562/56045`、`56049` | confirmed |
| 维护环 `Sct` 顺序：pm/hm→memcheck→sweep→the→nhe→构造 system.cadence_tick→落 last_tick | `await pm(e),await hm(e)`…`type:"system.cadence_tick"`…`Ca(...cadence:{last_tick})` | `daemon.pretty.js:78919/78923/78928/78934/78147/78937/78948/78158` | confirmed |
| `pm/hm`=memory broadcast lint（非队列合并）；队列合并是 `Z_e` | `uh` 断链 `enqueuedLintTask:!0`；`Z_e` `Pet` 合并 `.pending`→`cadenceQueuePath` | `daemon.pretty.js:62388/62581`、`78875/78901/78904` | confirmed |
| 潜意识环靠总线事件、非自持定时器 | `n.on("cadence.tick", x)`；`"[meta-session] started, listening for cadence ticks"` | `daemon.pretty.js:78745/78755` | confirmed |
| 门一 重入/停机：`l`(processing)/`d`(stopRequested) 独立于维护环 K | `if(l||d){...skipping tick...;return}` | `daemon.pretty.js:78673` | confirmed |
| 门二 活动门：内存指纹不变则整跳 | `C=eet([KI(...),KI(...),KI(...),net,ret].join(":"))`;`if(m!==null&&C===m){...activity gate...}` | `daemon.pretty.js:75470/78679-78487` | confirmed |
| 门三 cooldown：`R-K>=G` 才选中 | `G=Math.max(0,cooldown_ticks),K=_.get(name); if(K===void 0||R-K>=G) return P` | `daemon.pretty.js:78661-78672` | confirmed |
| 失败退避线性、2h/4h 封顶、前 1–2 次宽限 | timeout `t<=2` 免、`min(t*i,72e5)`；error `t<=1` 免、`min(t*2*i,144e5)`；success/invalid→null | `daemon.pretty.js:78149-78155`、`78166` | confirmed |
| `b` 用 `zB` 读 `backoff_until` 过滤本拍 backedOff | `zB` 判退避；`backedOff` 报告 | `daemon.pretty.js:78139`、`77577` | confirmed |
| 空闲补跑：maxPartitionsPerIdleTick 默认 2、仅活跃会话≤1 | `u=maxPartitionsPerIdleTick??2`;`if(K?.name&&u>1&&(!r||r.activeCount()<=1)) for(...)` | `daemon.pretty.js:75164`、`77907-77908` | confirmed |
| playlist 状态机：解析/勾选/History/整轮重建 | `I7e` 只解析 `## Current Round`；`xI` `- [x]`+`executed=`；`Kfe` filter enabled 重建 | `daemon.pretty.js:57584`、`57613/57615/57076-57077`、`57621/57623/57120`、`77554` | confirmed |
| 分区无状态、超时=max_duration_ms、四分类由 `xct` 判 | `persistSession:!1`;`Ae=Math.max(1,max_duration_ms)`;`Promise.race`;`QXe(name,Wme(text))` | `daemon.pretty.js:78494/78527/78529/78527/78542-78543` | confirmed |
| 成功/失败落 Spine + usage drain record | `agent.result tick_type:"subconscious"`;`agent.error stage:"partition_execution"`;`Od` drain `cancelled:I==="timeout"` | `daemon.pretty.js:78569/77804/78544` | confirmed |
| 上下文注入 iet(路径清单)/set(inbox) | `## Runtime Context`+`### Key Paths`；`## Inbox`(memory-weaver Stage1/2) | `daemon.pretty.js:78298/78691`、`78305/78309` | confirmed |
| 两级路由：`Z_e` 确定性入队 + cadence-executor LLM 出队分发 | `Z_e` `.pending`→`queue.md`；cadence-executor CLAUDE.md 自述 dispatcher | `daemon.pretty.js:78875`；`subconscious/cadence-executor/CLAUDE.md` | confirmed |
| cadence-executor 等四分区 = 用户数据分区，schedule 覆盖 rU 默认 | frontmatter `schedule:{enabled:true,cooldown_ticks:1,max_duration_ms:600000}`；`rU={...,cooldown_ticks:1,max_duration_ms:6e4}` | `subconscious/*/CLAUDE.md`；`daemon.pretty.js:57534/57705-57708`；`duoduo daemon config` | confirmed |
| 契约门 `GP`：6 拒因 + null 放行，双重角色（逐项 + 整拍短路） | `kind-not-consumed`/`partition-absent`/`self-yd-mismatch`/`partition-disabled`/`no-contract`/`parse-fail`；`if(!a&&!r) return s` | `daemon.pretty.js:58258-58824`、`58767`、`58886`、`57654-57655` | confirmed |
| memory lint 只读、每类≤1条、受 check/forget 门；路由 `aB` | `orphan-states`/`board`/`entity`/`node`/`gap`/`orphan-newborn-island`/`orphan-forget`；`aB` 路由分区 | `daemon.pretty.js:58916/57095/57123/57128-58995`、`58646/57658` | confirmed |
| 自编程硬边界：分区工具 allowlist（denylist 退役） | `Nz=["Bash","Read","Write","Edit","Grep","Glob","Agent"]`；`tools:H` | `daemon.pretty.js:49745`、`78481/78501` | confirmed |
| channel 空闲自动 compact（v0.5.10，channel 会话侧）：默认关闭、按会话配置 | `auto_compact_idle_minutes` / `auto_compact_min_context_tokens` 解析 | `daemon.pretty.js:35050/35060/35061` | confirmed |
| `system.cadence_tick` 是 Spine 事件而非 RPC 方法 | `type:"system.cadence_tick", source:{kind:"system",name:"cadence"}, payload:{count}`；`spine.tail` 复现 | `daemon.pretty.js:78937`；活体 `spine.tail` | confirmed（动态） |

### 关键数据结构 / 事件 / 文件格式（真实字面量）

- **`playlist.md`**：`# Subconscious Playlist` / `## Current Round`（`- [ ] <name>` / `- [x] <name>`）/ `## History`（`- <ISO> executed=<name>`）。`I7e` 只解析 `## Current Round` 段。
- **分区 frontmatter**：`schedule:{enabled:bool, cooldown_ticks:int, max_duration_ms:int}`（默认 `rU={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`，per-partition 可覆盖，如 cadence-executor 覆盖为 600000）；可选 `runtime: claude|codex`；可选 `claude.tools`（追加进分区工具白名单）；`contract:{partition:string, consumes:string[]}`。
- **分区状态文件**（read `Ab`, `78112`；write `j2`, `78142`）：`{last_started_at,last_finished_at,last_result,consecutive_failures,backoff_until}`，`last_result ∈ success|timeout|invalid_output|error`。
- **定向 inbox**：`var/subconscious/<partition>/inbox/*.pending` 与 `*.json`（目录经 `partitionInboxDir (Sv)`, `57468`；由 `Jue` 列举）；pending body 为一行队列行、换行结尾。
- **cadence 队列**：`var/cadence/queue.md`（checkbox 任务行），`.pending` 暂存文件在 tick 内由 `Z_e` 确定性合并入队，再由 cadence-executor LLM 分区出队分发到各 directed inbox。
- **Spine 事件**：`system.cadence_tick`（source `{kind:"system",name:"cadence"}`，payload `{count}`）、`agent.result`（`tick_type:"subconscious", partition, runtime`）、`agent.error`（`stage:"partition_execution", outcome`）、`job.spawn`。
- **usage drain record**（`Od`, `78544`）：`session_key: meta:subconscious:<partition>`，含 `tool_calls/tool_errors/usage/cancelled(=I==="timeout")`——`usage.get` 可见。
- **contract 门 `GP` 裁决集**：`null`（放行）/ `kind-not-consumed` / `partition-absent` / `self-yd-mismatch` / `partition-disabled` / `no-contract` / `parse-fail`。

### 给 Agent PM 的洞察

> **1. 两条定时器 + 独立门是清晰的关注点分离，别误读成"一个心跳两个环"。** 确定性维护（memory lint + 墓碑清扫 + 队列合并，幂等、跑在 37min 心跳上，重入门 `K`）与到期 cron 调度（`M6`，独立 60s job-scheduler，自己的定时器与门）各自独立；LLM 分区执行（非确定性）再复用心跳但用独立 `l`/`d` 门与 `K` 解耦。呼应本节结论：慢的 LLM 会话拖不垮维护与定时作业。

> **2. playlist 是可被 agent 自己改写的纯文本状态机，调度分"确定性入队 + LLM 出队"两级。** 调度不是硬编码 cron，而是 `playlist.md` checkbox 轮次 + 分区 frontmatter；`Z_e` 只做确定性 `.pending`→`queue.md` 合并，真正的任务分发交给 cadence-executor 这个 LLM 分区。代价是依赖文件锁/单进程串行保证一致性。

> **3. 能力边界"软 + 硬"双层，机器真正强制的只有契约门 `GP` 与分区工具 allowlist。** 软边界写在提示词（禁改 spine/lock/其他分区 CLAUDE.md，模型可违反）；硬边界一是分区工具 allowlist（`PARTITION_CORE_TOOLS`，只放行 7 个核心工具 + frontmatter `claude.tools`，v0.5.10 起以白名单取代旧 denylist，PlanMode/WebFetch/WebSearch/EnterWorktree 因不在白名单天然禁用），二是 `GP` 契约门——它既逐项裁决 lint 产物能否进某分区 inbox（6 种拒因），又能在无契约 consume 时整拍短路掉 memory-check。关键不变量必须落在运行时强制、而非提示词。

> **4. 多重"不空转"节流把固定节拍变成事件驱动的自适应节奏。** 活动门（内存指纹未变即跳过）、`cooldown_ticks`（每分区最小间隔）、失败**线性**退避（`z2`，2h/4h 封顶且前 1–2 次宽限）、`maxPartitionsPerIdleTick`（空闲多跑但有上限、仅活跃会话≤1 补跑）。可复用的省成本模式：定时轮询 + 变更指纹门控 + 每任务冷却 + 失败退避。

> **5. 无状态分区 + 文件即记忆，开销在 usage drain record 里可观测。** 每分区一次性 SDK 会话，"除了写进文件的都不记得"；跨 tick 协作全靠 inbox `.pending` 与共享 `memory/`，每次执行写一条 `session_key: meta:subconscious:<partition>` 的 drain record，`usage.get` 可显现潜意识开销。代价是每 tick 冷启动的上下文重建，靠 `_ct` 注入路径 + `bct` inbox 摘要弥补。


---
## §7 记忆系统

**记忆系统把"某条知识还有没有用"物化为 board→`[[link]]` 图可达性 + effectiveness 轨迹证据：daemon 侧只做只读、每类每 tick 至多一条、契约门控的 lint 测量，与带 48h 宽限 + 双 flag + git 软删的孤儿 GC，绝不改内容；一切改写交给分区自己的 tick 上按"事件→fragment→effectiveness→改板"可复算链完成（v0.7.1 及更早由 memory-weaver 一个分区完成，v0.8.0 起拆给 gradient-distiller+intuition-weaver 两个分区，见 §7.D 更新块）——即"代码测量、模型裁决"的记忆自治架构。**

这条结论把本节拆成四个 MECE 论点：**(A)** 效用被物化成一张 markdown 知识图，可达性 = 效用；**(B)** daemon 侧全部动作是只读、每类每 tick 单条、契约门控的测量，永不改内容；**(C)** 唯一的破坏性动作（孤儿 GC）被 48h 宽限 + 双 flag + git 软删三重封住；**(D)** 内容改写整段委派给 memory-weaver 三段流水线。下面逐点先说"所以呢"，再给证据。

---

### A. 效用被物化为图可达性 —— board 是唯一"根"，`[[link]]` 闭包决定谁还活着

**所以呢**：记忆系统不靠时间戳或访问计数判断一条知识是否"还有用"，而是把它翻译成一个纯几何问题——从广播板 `CLAUDE.md` 出发，沿 `[[slug]]` wiki-link 做可达性闭包，触达不到的 topics 节点就是 orphan。这让"效用"成为可确定、可复算的图属性，daemon 无需理解语义即可测量。

**A1 · 目录结构就是这张图的物理布局。** `dc(e)`（`57714`–`57721`）恰好返回 **5 个字段**：`memoryDir`（根目录）+ `boardPath`（`CLAUDE.md` 文件，即广播板 / 唯一"根"）+ 3 个子目录 `entitiesDir` / `topicsDir` / `effectivenessDir`。

```
memoryDir/
  CLAUDE.md          ← boardPath：广播板 / 直觉层（可达性的唯一"根"）
  entities/          ← 实体档案
  topics/            ← 节点：lesson-* / groove-*
  effectiveness/     ← 每条 board 行一份效果轨迹（附属证据层）
  fragments/<date>/  ← scanner 证据；★ 不在 dc 内，由 gap-lint/scanner 独立引用
  state/meta-memory-state.json  ← ★ 也不在 dc 内，属另一路径（meta-memory）
```

> 口径：`Ti` 的组成 = memoryDir + boardPath（文件）+ 3 个子目录（entities/topics/effectiveness）；`fragments/` 与 `state/meta-memory-state.json` **都不在 `Ti` 内**。

**A2 · 可达性 BFS 把"效用"算成不动点。** 种子来自 `td(e).filter(uU)`，其中 `cf` 用手写解析器 `uf`(`60636`)扫 board 上全部 `[[...]]`——遇第一个 `]` 即止（内联扫描循环，`60644`）。`um(e,t)` 从种子 BFS 到不动点，reader `ic` 读每个 slug 的 `topics/<slug>.md` + `entities/<slug>.md`（该三个符号本轮未重新逐行定位新行号）。**不在可达集内的 topics 节点 = orphan**，这是整个 lint/orphan 体系的核心几何。

**A3 · effectiveness 是附属证据层，不能独立支撑可达性。** `ic` 仅当 topics/entities 至少一存在（`i.length>0`，`58117`）才追加读 `effectiveness/<slug>.md`（`58118`–`58119`）。即：孤立的 effectiveness 文件不阻止其 slug 成为 orphan——effectiveness 是轨迹证据，不是节点本体。这处"非对称守卫"由 `58117` 逐字印证。

**A4 · board 层现在有独立哈希，与指令层解耦——从缓存层坐实"board 是唯一根"。** v0.6.1 新增 `computeBoardLayerHash`（`I6`，`74847`）单独对 board 文本做 sha256（`JSON.stringify([e ?? ""])`），而指令指纹 `computeNonBoardInstructionsFingerprint`（`P6`，`74851`）在计算前显式把 `memoryBoard` 置空（`memoryBoard: void 0`）后复用全量指纹 `bw`（`76374`）。即 board 层与 identity/kind/instance/mission 指令层各走一条独立哈希：board 变动只失效 board 缓存、不牵动指令层，反之亦然。这从提示缓存的层次上印证 A 节几何——board 是与指令层正交、独立成层的可达性唯一"根"。confirmed。

---

### B. daemon 侧只做只读测量：每类每 tick 至多一条、契约门控，永不改内容

**所以呢**：整个 `runMemoryCheckTick` 是一台"体检仪"而非"手术刀"。它把五类 lint 的最差单条结果打包成 `.pending` 证据文件投递给潜意识分区收件箱，自己绝不 touch 任何知识内容。三个约束——每类单条节流、契约门控、只读——共同保证测量廉价、可审计、无副作用。

**B1 · 主循环逐 lint `try/catch` 隔离，且投递执行器是 `JP` 而非门控函数。** `_it`（`62716`=`runMemoryCheckTick`，导出于 `62677`）逐个子 lint try/catch 隔离，单个子 lint 崩溃不中断其余。真正的**投递执行器是 `JP`（`61433`）**：它 `mkdirSync(inbox)` → 写 `pendingFilename` → 分类 posted/withheld/errors，`already-pending`（`61460`/`61475`）与 `--force`（`61464`）逻辑都在这里；`_it` 的闭包把每个 lint 的 selected 结果喂给 `JP`（调用点 `62743`）。门控函数 `GP` 只是 `JP` 内部的 gate 判定（`GP` 声明 `61486`），不是投递本身。

**B2 · 五类 lint，kind 全部 `.v1`。** 五个调用点（`57669`–`58989`）：

| lint | 调用点→本体 | 产出信号 | 判据要点 |
|---|---|---|---|
| **board-lint** | `qce(u,yU)` `57669`→`58005`（逻辑 `Rit` `58069`） | REVISE / SINK / MERGE | 见 B3 |
| **entity-lint** | `rle` `57671`→`58177`（`gKe`） | `entity-converge.v1` | entity 缺收敛四段 `Zce=["What it is now","Relationship","Open variables","Trend"]`（`58223`）；打分 `kb*1e3+dated`（`58193`） |
| **node-lint** | `sle` `57673`→`58254`（`wKe` `58242`） | `node-converge.v1` | 见 B3 |
| **gap-lint** | `ule(e.eventsDir,u)` `58985`→`58409` | `scan-gap.v1` | 见 B3 |
| **orphan** | `ile(l)`+`ale(ole(l),t)` `58988`–`58989` | `orphan-newborn.v1` / `orphan-islands.v1` | NEWBORN→warn，ISLAND→weaver note（见 C） |

kind 值全部带 `.v1`（`ai` 表 `57854`–`57728`）。

**B3 · 各 lint 判据细则**：

- **board-lint（`Rit`，`daemon.pretty.js:60975`）——v0.8.0 起只剩两类信号，SINK 已被移除（confirmed）。** REVISE 过滤 = `trajectory!=='NO-EFF' && cls==='behavioral' && fmt==='legacy' && !(WEAKENING && (REMOVE||DROP))`，partition **硬编码 `'pattern-tracker'`**（`60983`，不经 `aB`）；`MERGE`(`60990`)过滤 = `trajectory!=='NO-EFF' && dual && cls!=='domain'`，partition **硬编码 `'intuition-weaver'`**（`60991`，v0.7.1 时是 `'memory-weaver'`——旧的 memory-weaver 分区已被 gradient-distiller/intuition-weaver 取代，见 §6 迁移记录）。v0.7.1 的第三类信号 `SINK` 在 v0.8.0 的 `Rit` 里已找不到任何踪迹（`"SINK:"`/`Nn.SINK` 全仓检索为零命中）——**REVISE/MERGE 两类判据都保留了 `trajectory!=='NO-EFF'` 前置，唯独 SINK 这条判据连同其常量一起被删除**，不是行号漂移，是真删除（confirmed）。trajectory（STRENGTHENING/NEUTRAL/WEAKENING）与 verdict（PRESERVE/KEEP/REMOVE/REWRITE/SHARPEN/DROP）仍从 effectiveness 文件解析，判据本体未重新逐行核对（未证实推测）。
- **node-lint**：v0.7.1 时代的判据（`escalated=!reachable` 打 `WASTED-COMPUTE`；`References` 仅 groove 合法）本轮未重新逐行核对，具体新行号未重新定位（未证实推测，机制大概率未变——`nd`/`_it` 外壳与契约门控均未受 v0.8.0 delta 触及）。
- **gap-lint（`Ert`，`daemon.pretty.js:61819`）——v0.8.0 整体重写为"限定区间 dream"，不再是整日粒度（confirmed）。** v0.7.1 的 `sme` 按"整日 count/hours"判定有没有证据、返回 `{gapDate, bands, selected}`；v0.8.0 的 `Wtt(e,t,n,r)` 改成算精确到毫秒的 **span**（`{date, startMs, endMs}`）：先看"今天"存量事件的 `msOfDay` 是否已越过上次水位 `l`（`Ftt(a)`取得）且冷却时间 `n-(s+p)>=r` 已过，够格才收今天；不够格则从更早的日期文件里逆序找最近一个仍有未读事件的日子。命中后仍复用同一个"排序→合并连续小时"函数生成 hour band（该函数已更名/结构不变，`daemon.pretty.js:61767`），但**投递对象变了**：`kind` 从 `scan-gap.v1` 升到 `Nn.SCAN_GAP="scan-gap.v2"`（`60769`），partition 从 `'memory-weaver'` 改成 **`'gradient-distiller'`**（`61795`），pending body 措辞从"Stage 1 scanner evidence pass"式的分阶段提示改成**"dream over this bounded interval"**——逐条评判每个外部事件、按 gradient 优先级判断值不值得写 fragment，写不写都要删文件 ack（`61787` 附近的完整措辞）。这与 subconscious 侧 `gradient-distiller`/`intuition-weaver` 取代 `memory-weaver`/`cadence-executor` 是同一次重构的两面。**动态印证（值为时点快照，v0.7.1 时测得）**：机制大改后未重新用活体 daemon 复核，新的 `"gap"` JSON 形状大概率也变了（未证实推测）。

**B4 · 每类每 tick 至多一条（`yU=1`）。** `yU=1`（`58494`）是每类 lint 的默认 limit：`Que`/`rle`/`sle` 都 `slice(0,n)` 只取**最差 1 条**（help 的 `--limit=N default 1`）。即每 tick 每类最多投一个 worst-first 信号——这是"测量廉价"的核心节流。

**B5 · 契约门控 `GP`：只有声明 `consumes` 的分区才收到对应信号。** `GP`(`61486`)分支：partition-absent / self-id-mismatch / `!enabled` → withheld；contract valid → `consumes.has(kind) ? 放行 : 'kind-not-consumed'`；no-contract / parse-fail → 回退 flagFallback（= check flag）。契约解析本体 `c2`（旧名 `gU`，本轮未重新定位新行号）返回 5 态（partition-absent / parse-fail / no-contract / self-id-mismatch / valid），`dge`(`60756`)把 consumes 名规范化补 `.v1`；`WP`(`61427`)把每分区契约缓存进 `e.contracts` Map，同 tick 内 `GP`/`$pe`/`Ape` 复用同一份，避免反复解析 frontmatter。

**B6 · 前置短路：没有下游读者就不测量（v0.8.1 复核：候选分区集已扩大）。** `Age`(`61560`)在跑任何 lint 前遍历所有 `Object.values(Mn)`（全部 lint kind）× `Z4`（`61577`，现为 `['pattern-tracker','gradient-distiller','intuition-weaver','memory-weaver']`——**已从 v0.7.1 时代的两分区扩到四分区**，与 §B7/`aB` 处"MERGE→intuition-weaver、SCAN_GAP→gradient-distiller"的路由改动一致），任一 kind 过闸即测量（`GP(i,r,e.flagFallback)===null`）；`_it` 内 `if(!a && !r) return o`（`62737`）——"有没有订阅者"是是否测量的前置门。

> 注意 `aB`(`62649`)并非通用"路由"：它**仅两处调用**——orphan-newborn 分区路由（`57991`）和 forget 警告门 `Nge`(`61569`)。**各 lint 信号的 partition 是每类硬编码的，并不走 `aB`**：v0.8.0 里 REVISE/NODE_CONVERGE 仍→`pattern-tracker`；MERGE 已确认改→`intuition-weaver`（`60991`）；SCAN_GAP 已确认改→`gradient-distiller`（`61795`）；SINK 判据已整条移除（见 B3）；ENTITY_CONVERGE/ORPHAN_ISLANDS 的硬编码目标本轮未重新逐行核对，v0.7.1 时是 `memory-weaver`，该分区已不存在于 `subconscious/` 目录，其信号大概率也已改投 `intuition-weaver` 或 `gradient-distiller`（未证实推测，行号需重新定位）。`aB` 只决定 lesson-/groove- 孤儿告警投给哪个分区。

---

### C. 唯一的破坏性动作被三重封住：48h 宽限 + 双 flag + git 软删

**所以呢**：daemon 唯一会删文件的地方是孤儿 GC，而它被设计成"几乎不可能误删"——先把孤儿分成三态给足宽限，再要求两个实验 flag 同开，最后即使删也只是 git 软删（历史可恢复），且"没被警告过就不许删"。对自治 agent 的记忆安全，"遗忘 = 可逆软删除"是关键设计。

**C1 · Orphan 三态状态机（`fye` `57965`）给 STALE 之前留足宽限。** `fye` 套壳 `AKe`（`58456`，真正算 orphans/indeg/mtime），状态判定（`57977`–`57978`）：

```
age = mtimeMs>0 ? (refTimestampMs - mtimeMs)/nle : +∞     (nle = 3600*1e3, 56765)
indeg >= 1                → ISLAND    （被别的档案引用，但 board 不可达）
else age < r              → NEWBORN   （r = newbornHours ?? _R，_R=48h：太新，给宽限）
else                      → STALE     （旧且孤立：可删）
```

`indeg` 来源 `jKe`（定义在 **`58618`**，调用点 `58469`）。`AKe` 同时对每个 orphan 现算 `indeg=SKe.get` 与 `referencedBy=kKe`（`58629`，列出具体引用文件），ISLAND note 正文（`DKe` `58047`）就靠 `referencedBy` 生成"referenced-by"清单。**注意优先级**：`mtimeMs<=0 → 直接 STALE` 仅当 `indeg=0` 时成立；`indeg>=1` 时无论 age 都判 ISLAND（`57978`）。

**C2 · 破坏性遗忘（`mye` `57997`）只对 STALE，且双 flag AND。** `dB`（`58916`–`58366`）：`forget = ALADUO_EXP_MEMORY_FORGET && check`（双 flag AND）；`58944` 警告文案逐字："FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE)"。`mye` 仅对 STALE（`58538`）。

**C3 · git 软删 + 失败回滚 + 锁保护。** `.git/index.lock` 存在则 `return []`（`58543`）；否则：

```
git rm --ignore-unmatch -- <files>                                   (56652)
git diff --cached --name-only --diff-filter=D -- <files>             (56657，含 --name-only)
git -c user.name=aladuo -c user.email=aladuo@local commit -m <msg> -- <files>   (56664)
失败 → git reset --quiet -- <files>  +  git checkout -- <files>       (56668–56674)
```

> 注意 commit 命令语义：`-c` 是 **git 顶层 config 开关（位于子命令 `commit` 之前）**，非 `commit -c`（后者 = 复用某提交的 message）。`yit`(`62661`)生成 commit message，confirmed。

**C4 · "不可警告即不可遗忘"。** forget 前 `hle(o,hU(p))`（`59003`）：STALE 节点若其目标分区**不消费 orphan-newborn 信号**则 `sparedUnwarnable`——连警告都收不到就永远不能被静默删。

**C5 · 活体 help 印证**：`duoduo memory reclaim`——"Never deletes"、`NEWBORN→warn, ISLAND→weaver note, STALE→git rm`、`--tag MANDATORY`、DESTRUCTIVE/manual/git history backup，全部 confirmed。

---

### D. 内容改写整段委派给分区自己的 tick（v0.8.0 起由两个分区分工，取代原 memory-weaver 单分区三段流水线）

> **v0.8.0 更新（confirmed，磁盘实证 `subconscious/{gradient-distiller,intuition-weaver}/CLAUDE.md`）**：原 `memory-weaver` 一个分区内部"spine-scanner（证据）→ entity-crystallizer/intuition-updater（改板）"两阶段、三个 `.claude/agents/*.md` 子 agent 的流水线，v0.8.0 起拆成**两个独立分区**，职责边界与 contract 完全对齐 §6 更新块列出的 consumes 表：
> - **`gradient-distiller`**（只读证据侧）：消费 `scan-gap.v2` 信号，经 `<Spine CLI> cat --interval '<date>[t1,t2]' --kind external` 读取该闭区间的外部事件，逐条判断是否有 gradient（对 `memory/CLAUDE.md` 现有某行构成 STRENGTHENING/WEAKENING/NEW_SIGNAL 证据），有则写一条 fragment 到 `memory/fragments/`（须带 `claude_md_ref` 或 `source_line`），无则跳过；只写 fragment 与自己的 `scan-gap.cursor` 续跑指针，不碰 board。这正是代码侧 `gap-lint`(`Ert`) pending body 里"dream over this bounded interval...judge each external event per event...write a fragment if it carries gradient"那段措辞的落地方（confirmed，代码-提示词双向印证）。
> - **`intuition-weaver`**（唯一改板写手）：`memory/CLAUDE.md`、`memory/effectiveness/`、`memory/entities/` 三者的**唯一写者**；消费 `fold-gap.v1`（折叠 gradient-distiller 产出的 fragment 证据）/`entity-converge.v1`/`merge.v1`/`orphan-islands.v1`/`orphan-newborn.v1`/`claude-compress.v1`/`claude-lint.v1`/`claude-flatten.v1`/`activation-report.v1` 九种信号，用"text gradient"同一套语言判断每条 fragment/信号该 add/rewrite/reorder/retire/re-wire 哪一行，读 fragment 时校验 `claude_md_ref`/`source_line`(+`source_line_hash`) 与 trajectory/activation 字段。
> 两者合起来仍是旧 memory-weaver 的"证据生成"与"内容改写"两件事，只是从"一个分区内部两阶段"变成"两个分区各管一段，中间靠 `fold-gap.v1` 信号交接"——不再有 `entity-crystallizer`/`intuition-updater`/`spine-scanner` 这三个 `.claude/agents/*.md` 子 agent（已随目录一并删除）。**下面 D1–D3 描述的是 v0.7.1 及更早的单分区三段流水线，作为该机制的历史基线保留，未逐条改写为新架构**（未证实推测：新架构下 fragment/effectiveness 文件的具体字段形状是否与下文完全一致，本轮未逐行核对新分区 CLAUDE.md 全文）。

**所以呢**（v0.7.1 及更早基线）：daemon 只测量、只投信号；任何对知识内容的实际改写都发生在 memory-weaver 分区自己的 tick 上，走一条"事件→fragment→effectiveness→改板"的可复算证据链，从而把 LLM 编造统计的幻觉压在可审计的证据之下。

**D1 · 三段流水线，证据路径与内容路径强耦合**（读磁盘原文 `prompts/subconscious/memory-weaver/CLAUDE.md`，v0.7.1 及更早基线，v0.8.0 已拆分见上）：

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

**D1a · v0.7.1：crystallization 信号按实体逐条派发，不再是一次性"整个语料库"任务。** entity-lint（`daemon.pretty.js:58177`）为 `memory/entities/` 下**每一个**实体各发一条独立的 `ENTITY_CONVERGE` 信号，文件名 `entity-converge-${slug}.md.pending`（`daemon.pretty.js:58208`），信号体只引用这一个实体自己的 dossier 文件（`memory/entities/${slug}.md`）与 `[[${slug}]]`——即"一个信号、一个实体、一份 dossier"，而不是把所有待收敛实体打包成一条任务丢给 crystallizer 自己去发现范围。这条信号同样经过 §B 的契约门 `GP`（`daemon.pretty.js:58258`）才能进 inbox，粒度上与其它 lint 信号一致。`entity-crystallizer.md` 的 subagent 提示词相应新增了一段"Claim Scope"纪律：dossier 正文每句话必须是关于*这个实体*的事实，"语料库级否定"（例如"事件日志从未记录过 X"）除非这一遍真的跑过对应查询并引用查询与结果，否则禁止写——这份提示词纪律与信号本身的实体级粒度是同一个"不许模糊到语料库层面"意图的两半（confirmed：信号派发机制逐行核对；提示词纪律为读取当前文件内容确认存在，无法与 v0.6.2 旧文案逐字比对，标注**未证实推测**是否为本轮新增措辞）。

**D1b · v0.7.1：partition inbox 有了显式的"快照对账"语义，防止信号被静默漏处理或重复处理。** 新增的 inbox-sync 子步骤（`daemon.pretty.js:58845-58326`，从 `runMemoryCheckTick` 内经 `58991` 调用）在每个 memory-check tick 结束时：对 `pattern-tracker`/`memory-weaver` 两个受追踪分区，重新跑一遍契约门 `GP` 算出"这一 tick 的 lint 产物里，哪些 pending 文件现在仍然可投递"，与"这一 tick 实际新写入的文件"取并集，跟持久化在 `<inboxDir>/.memory-signals.json` 里的**上一次快照**做差集比对——不在新集合里的旧快照项，其磁盘上的 `.pending` 文件被物理删除（视为"分区契约已不再消费它，不该继续占着 inbox"），然后把新集合写回快照文件。这正是 changelog "partition inboxes now have defined snapshot semantics" 的字面机制：inbox 不再是"只增不减、靠 agent 自己 ack 删除"的松散目录，而是每 tick 都对账一次的显式状态（confirmed，逐行核对）。

**D2 · 每 tick 节流与终止语义。** frontmatter `cooldown_ticks:5, max_duration_ms:2100000`（`4`–`5` 行）；Stage1 每 tick 跑一次 scanner 证据 pass、Stage2 至多处理一条 directed inbox 项（`39`–`43`、`98`–`137` 行）；终止 token `UPDATED / NO-OP / NO_NEW_GRADIENT / BOOTSTRAPPED`（`220`–`223`），**仅终止后才删 inbox ack**，`PARTIAL_UPDATE` 留盘（`225`–`229`）；gradient 优先级 **真人 `channel.message` > 周期后台事件**（`90`–`96`）。

**D3 · consumes 与 §B 路由自洽。** `consumes` 声明 6 kind：entity-converge / sink / merge / orphan-islands / orphan-newborn / scan-gap（`8`–`14` 行）——**memory-weaver 不 consume `revise.v1` / `node-converge.v1`**（那两类归 pattern-tracker，正好对上 B3/B5 的硬编码路由）。

**D4 · 模态标签体系（`meta-prompt.md` `162`–`194`）。** dossier 内每条主张标注 epistemic shape，六标签逐字命中（`164`–`175` 行）：`[observation]` / `[inference]` / `[instruction]` / `[conditional: <event>]` / `[hypothesis (unratified)]` / `[superseded YYYY-MM-DD: <new>]`。覆盖规则（`183`–`185` 行）："Present observation overrides any dossier's `[observation]` or `[inference]`；对 `[instruction]`，当前观察决定其条件是否仍成立。" board 是"已加载的直觉层"，深读 dossier 才应用其模态标签。

---

### 证据表

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| `Ti` 定义 5 字段：memoryDir + boardPath + entities/topics/effectiveness | `return {memoryDir, boardPath, entitiesDir, topicsDir, effectivenessDir}` | daemon `57714`–`57721` | confirmed |
| fragments/ 与 state/meta-memory-state.json 均不在 dc 内 | dc 无此二字段 | daemon `57714`–`57721` | confirmed |
| board 种子 `td.filter(uU)`；`$b` 遇首个 `]` 即止 | 手写 `[[..]]` 扫描器 | daemon `57753` / `57728`（`57736`） | confirmed |
| BFS `oc` 到不动点；`ic` 仅 topics/entities 存在才读 effectiveness | `i.length>0` 守卫 | daemon `58126`(`58130`–`58140`) / `58111`(`58117`) | confirmed |
| board 层独立哈希 `I6`，指令指纹 `P6` 排除 memoryBoard（与 `bw` 全量指纹解耦） | `JSON.stringify([e??""])` / `memoryBoard: void 0` | daemon `74847` / `74851`（`74842`） | confirmed |
| orphan 三态优先级 indeg≥1→ISLAND / age<r→NEWBORN / else STALE | `57977`–`57978`，`_R=48`、`nle=3600*1e3` | daemon `57965`/`58456`(`58118`) | confirmed |
| indeg 源 `jKe` | 定义 `58618`、调用点 `58469` | daemon `58618` | confirmed |
| mtimeMs≤0→STALE 仅当 indeg=0；indeg≥1 恒 ISLAND | 判定优先级 | daemon `57978` | confirmed |
| 主循环 `_it`=runMemoryCheckTick，五 lint 逐个 `nd` try/catch | 导出 `58907` | daemon `57095`(`57702`) | confirmed |
| 投递执行器是 `JP`；already-pending/--force 在其内 | mkdir+write+分类 | daemon `61433`(`61464`/`61460`/`61475`) | confirmed |
| board-lint REVISE/SINK/MERGE 均含 `trajectory!=='NO-EFF'`；partition 硬编码 pattern-tracker | `Rit` | daemon `58069`(`58077`/`58081`/`58089`) | confirmed |
| node-lint References 仅 groove 合法；escalated→WASTED-COMPUTE | `bKe`/`wKe` | daemon `58227`–`58228`/`58242`(`58249`/`58281`) | confirmed |
| gap-lint 黑名单过滤内部 kind | `X7e = new Set([...])`；`nXe` 按 source.kind 过滤计数 | daemon `58409`(`58442`/`58418`) | confirmed |
| gap 活体值 = 2026-07-01 bands=[[4,4]]（时点快照，机制 confirmed） | `memory check --dry-run --json` | 活体 RPC | confirmed（值随日期漂移） |
| `yU=1`：每类每 tick 至多一条 worst-first | `slice(0,n)`，help `--limit default 1` | daemon `58494` | confirmed |
| 契约门 `GP` 5 态；`NI` 每 tick 缓存契约 | `c2`/`npe` 规范化补 .v1 | daemon `58258`/`58123`/`58767`/`57848` | confirmed |
| 前置短路 `$pe`：无订阅者不测量 | `if(!a&&!r) return` | daemon `58328`(`57057`/`57655`) | confirmed |
| `aB` 仅两处调用（orphan-newborn 路由 + hle 警告门），非通用路由 | `57991` / `59003` | daemon `58646` | confirmed |
| forget = 双 flag AND，仅 STALE | `dB` | daemon `58916`–`58366`/`57997`(`58538`/`58944`) | confirmed |
| git 软删：rm→diff(--name-only)→`-c ...` 顶层 config commit→失败回滚 | index.lock 保护 | daemon `58547`/`58552`/`58559`/`58563`–`58569`(`58543`) | confirmed |
| 不可警告即不可遗忘 `sparedUnwarnable` | `hle(o,hU(p))` | daemon `59003` | confirmed |
| weaver frontmatter cooldown_ticks:5 / max_duration_ms:2100000 / consumes 6 kind（无 revise/node-converge） | 磁盘 prompt 原文 | memory-weaver/CLAUDE.md `4`–`14` | confirmed |
| fragment 必含 claude_md_ref\|source_line + trajectory + activation | 磁盘 prompt 原文 | 同上 `68`–`69`/`178`–`179` | confirmed |
| 终止 token 四值，PARTIAL_UPDATE 留盘；真人 channel.message 优先 | 磁盘 prompt 原文 | 同上 `220`–`223`/`225`–`229`/`90`–`96` | confirmed |
| 六模态标签 + 覆盖规则 | meta-prompt.md | `162`–`194`（`164`–`175`/`183`–`185`） | confirmed |

---

> **给 Agent PM 的洞察**（呼应本节领起结论"代码测量、模型裁决"）
> - **测量与执行彻底分离，是本节的塔尖。** daemon 的 lint 永不改内容（help："Never deletes"），只产出带明确 action 的 `.pending` 证据包，投给有认知能力的子 agent 去收敛。这把确定性检测与 LLM 判断解耦，避免规则引擎硬改记忆——正是"代码测量、模型裁决"。
> - **可达性即效用。** 不被 board 闭包触达的节点没有前景影响；孤儿再分 ISLAND / NEWBORN(48h 宽限) / STALE，是带宽限期的软 GC，避免误删刚生成还没接线的知识。
> - **破坏性遗忘 = 可逆软删除。** 双 flag AND、必须先经 NEWBORN 警告、只 git rm（历史可恢复）、目标分区不消费警告即拒删（`sparedUnwarnable`）。对自治 agent 的记忆安全，"遗忘=可逆"是关键设计。
> - **每类每 tick 单条（`yU=1`）+ 前置短路（`$pe`）+ 契约缓存（`NI`）= 廉价测量三件套。** 测量被压到 worst-first 一条、无订阅者不空跑、契约每 tick 只解析一次——测量便宜，才敢每 37 分钟心跳都做。
> - **证据链可审计。** scanner fragment 必须命名它测试的 board 行（`claude_md_ref`），crystallizer 按行产 effectiveness，updater 改行前必读该行 effectiveness——"事件→证据→效果→改写"可复算链，压制 LLM 编造统计的幻觉。
> - **分区契约门控 = 按需订阅的去中心化路由。** 只有 frontmatter `consumes` 声明某 kind 的分区才收到对应 `.pending`（memory-weaver 不消费 revise/node-converge，正好归 pattern-tracker）；新增分区无需改核心。


---
## 9. 未证实 / 需实测的开放项（明确标注）

以下为验证过程中标注的开放问题或环境限制，**不作为已确立结论**：

1. **活体记忆为空态**：本机为近乎全新实例——广播板 `memory/CLAUDE.md` 为 0 字节、`effectiveness/` 未创建、`meta-memory-state.json = {}`。因此 orphan 三态状态机、board census、weaver 三段流水线的**运行时行为未在有真实记忆的节点上直接观测**；相关结论基于代码路径 + 字面量 + CLI help，非典型运行态数据。（注：cadence 心跳与 4/4 潜意识分区已实测跑完一轮，见 §6。）
2. **dedup 内存 Map 整表 clear 后的去重丢失窗口**：机制确认（去重存储类 `Yx` 的 `record` 在 `entries.size >= maxEntries(1e4)` 时先 `clear()` 再写入，`daemon.pretty.js:79312`），但**丢失窗口的实际时长/影响未实测**。
3. **`DISABLE_ADAPTIVE / DISABLE_THINKING / MAX_THINKING_TOKENS` 的消费方（未证实推测）**：这些 env 在 daemon 中仅出现在 Codex/端点错误提示串里（`daemon.pretty.js:62175`）。v0.6.1 的提示文案已**显式标注它们是 "Claude-only" 的 `~/.config/duoduo/.env` 开关**，据此推断 duoduo 自身不消费、只是透传给底层 Claude Code 二进制/SDK 的建议开关；SDK 侧的实际消费仍未直接验证。
4. **部分 RPC 方法的活体探测**：控制面方法全集从 `/rpc` 分派链提取（附录 B），其中 `spine.tail` / `usage.get` / `system.status` 已活体验证返回，其余 handler 存在性以分派链代码为准。
5. **v0.6.2 起：Skip 的 hook 裁决是否仍会执行工具体？** Skip 改为 PreToolUse hook 返回 `{continue:!1, stopReason}`（`daemon.pretty.js:75479`）后，`mcp__aladuo__Skip` 的工具体是否仍被 SDK 执行，完全由 SDK 决定、duoduo 无兜底。而 `pending_skip_rewind` 在全 bundle 里**只有工具体一个写入者**（`daemon.pretty.js:48820`）。若不执行，Claude 路径丢的**仅是 `<skip-rewind>` 块**（读 `60530`、渲染 `63572`-`64218`）——seal-on-skip 门（`72893`-`73668`）整个在 `runtime === "codex"` 分支内，本就不适用于 Claude；Claude 侧等价门是 admission 的 `!skipCalled`（`76568`），由 hook 自身置位。codex 亦不止靠状态探测，另有工具调用观察器（`59443` → `57974` → `73659`）。**需实测。**
6. **v0.6.2 起：Notify 对 orphan job 的直传是否真会报送达？** 工具端解析器的精确 key 快路径在任何 orphan 检查之前返回（`daemon.pretty.js:71890`），而 `duoduo session notify` 走的是另一个未加 orphan 过滤的解析器（`82170`）。两条路径是否都会对已归档 job 报 `Notify delivered.`，**需实测。**

> 复核状态：全文已于 2026-07-29 对齐到 **v0.6.2**，行号锚点与短名经结构指纹迁移后逐条复核（迁移工具见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md) 论点四）。上一轮 v0.6.1 复核（2026-07-24）的 8 节机制主张在本版仍全部 **CONFIRMED**；本轮结论性变化只有三处：§1 论点五（job 的 kind 层从不加载）、§2 Skip 由 interrupt 改为 hook 裁决、§4 论点一记入唯一一条有意绕过 WAL 的跨进程通道。
>
> **2026-09-05 v0.8.0 部分复核（本轮）**：全文短名/行号已用结构指纹（`fingerprint_match.mjs`）+ 逐条人工核验的方式机械迁移到 v0.8.0（`check_doc_anchors.mjs` 61/61 条形式化引用通过），但**不是**逐机制的重新验证——§6/§7 相当一部分行号自 v0.6.1 起就未做过这类全面复核，本轮同样没有补齐。本轮**新增确认**的结论性变化：pi 作为第四运行时与 Claude 共用同一个 `applyJobSdkConfigOverride` job-config 叠加口（§1 论点五）；daemon 重启新增强制 `--reason` + 可选 `--wake <session>` 的跨会话唤醒投递，`duoduo spine cat/show` 成为潜意识分区读取 Spine 事件的新入口，替代旧有的 cadence 队列文件路径（§6 更新块）；`memory-weaver`/`cadence-executor` 两分区被 `gradient-distiller`（只读证据）+`intuition-weaver`（唯一改板写手）取代，`SCAN_GAP` 升级到 `scan-gap.v2` 且 gap-lint 从整日粒度改成精确到毫秒的区间（§7.B/§7.D 更新块）；board-lint 的 `SINK` 判据整条移除；`/undo` 命令与 Grok 的 rewind 扩展方法均已从代码中完全删除（§2）；Spine WAL 的去重键计算简化为只认 `dedup.source_id`，原先的 hash/text 内容摘要回退路径已不存在（`computeDedupKey`，未在正文展开，见 `reconstruction/first-party/01-spine-wal/computeDedupKey.js`）。以上均为 confirmed（代码 + 磁盘证据交叉印证）；本轮未触及的其余机制主张按原有置信标注保持不变。


---
## 附录 A：复核索引（关键 file:line 速查）

**A.0 短名 ↔ 真名速查**（从还原源码的 `__export` 恢复；*inferred* 标注见 [`RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)，可读源码在 [`first-party/`](../reconstruction/first-party/)）：

**§1 认知装配**：`eh`=buildSystemPromptForChannelConfig、`jb`=resolveMetaPromptText、`jde`=renderJobMissionBlock、`Hpe`=extractSystemPromptAppend、`K_e`=buildTransientUserBlocks、`Uwe`=transcludeBroadcastBoard
**§2 Turn/Drain**：`Gd`=createAgentSdkAdapter、`HB`=batchDrainItems、`$v`=handleDrainError、`Od`=appendDrainRecord、`Cd`=summarizeDrainRecords、`Bpe`=computeCodexTurnUsage
**§3 Session**：`act`=createSessionManager、`vct`=createMetaSession、`Ore`=rehydrateSessionState、`W_e`=drainSessionMailbox、`bw`=computeInstructionsFingerprint、`SO`=runInstructionsFingerprintGuard、`wct`=sweepTombstonedSessionRecords（`spawnSessionActor`/`wakeSessionActor` 在模块作用域内，短名未定位）
**§4 Spine**：`Yt`=createSpineEvent、`Xt`=atomicAppendEvent、`FGe`=atomicWriteFileSync、`qGe`=readEventByIdSeek、`hl`=advanceConsumerWatermark、`qre`=computeDedupKey
**§5 Gateway**：`hae`=appendBeforeExecuteGateway
**§6 Cadence**：`Sct`=runCadenceTick、`Cot`=enqueueCadenceItem、`Z_e`=mergeCadenceInbox、`G_e`=parseCadenceQueue、`Oot`=markCadenceItemsDone、`M6`=scanAndSpawnDueJobs、`xct`=createJobScheduler、`Rct`=createOutboxDeliveryManager
**§7 记忆**：`Ti`=resolveMemoryDirs、`oc`=walkReachableMemory、`ic`=collectMemoryLinks、`cf`=resolveMemoryLinkTargets、`fye`=detectOrphanMemory、`Rit`=runBoardLint、`Ert`=runGapLint、`GP`=enforceContractGate、`aB`=routeContractDecision、`mye`=forgetMemoryEntry、`_it`=runMemoryCheckTick
**§8 运行时抽象**：`ev`=createCodexAppServerAdapter、`Vpe`=buildBaseInstructions、`Wpe`=buildDeveloperInstructions、`Xu`=checkCodexAvailability、`fh`=resolveCodexSandbox、`K2`=ensureAgentsMdSymlink、`Tnt`=resolveRuntimePaths、`not`=initializeRuntime

**A.1 机制 → file:line**

| 机制 | 位置 |
|---|---|
| system prompt 6 层装配 | `daemon.pretty.js:48801-48829` (JE) |
| prompt_mode 分叉 | `48276` (override) / `48825` (append) |
| meta-prompt 解析 | `49745-49735` (w_) |
| 广播板包装 Hoe/DWe/jWe | 在 JE 内 `49772-49231`，常量定义 `49746` |
| 广播板 transclusion | `74560-73844` (Bme/xXe/$me)，wXe(maxDepth=5) `74705` |
| per-turn 瞬态注入 | `63657-64379` (sfe) |
| Codex 装配 | 复用 `eh` 输出，经 `Hpe` 桥接抽字符串 `59385`；`Vpe`/`Wpe`（`59389-59297`）在当前路径为不可达死代码（构造 `ev` 未传 instructions），详见 §1 论点三 |
| 潜意识分区注入 | `78298-77354` (iet/set) |
| 事件封装/原子写 | `31924` (`Yt`=createSpineEvent)/`31911` (`MGe` 串行 mutex)/`31931` (`FGe`=atomicWriteFileSync)/`31966` (`Xt`=atomicAppendEvent) |
| append-before-execute | `81119` (`hae`)，实际 append `Xt` @`81196`，紧随 watermark `hl`（同行 `81196`） |
| 去重 bX / checkAndRecordDetailed | `79328-76123`，dedup 存储类 Sk `79282`（clear 于 `79312`），dup 分支 `79710-79729` |
| 随机读 ml / by_id | `31806-31331`，by_id 索引 u1 `31332` |
| watermark Ca | `32597` |
| rehydrate nX | `32093-32132` |
| spine.tail | `81519` (Ace 尾读取)，RPC 分派 `83406` |
| 记忆根 dc | `57714`（memoryDir + boardPath(CLAUDE.md) + entities/topics/effectiveness） |
| 可达性 um/am/td | `58126`/`58111`/`57753` |
| orphan 三态 ple | `57965`（nle=3600e3, _R=48） |
| lint 主循环 $Ke | `57095`，短路 `!a&&!r` `57661` |
| 投递门控 vU | `58258`，路由 hU `58646` |
| 遗忘 hle | `57997-58572`，index.lock 守卫 `58543`，双 flag 守卫 `57637` |
| cadence 间隔（运行时常量） | `85551` `kSe("ALADUO_CADENCE_INTERVAL_MS",222e4,1e3)`；`81524` 仅为 status 展示串 `"2220000"` |
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

**控制面 / RPC 方法**（`/rpc` JSON-RPC 分派链，从 handler `if (h.method === "…")` 直接读出，`daemon.pretty.js:83037-83406`——即实际注册可调用的方法，区别于上面更宽的事件 type 全集）：
```
system.shutdown system.runtime.info system.status system.config 
channel.describe channel.spawn channel.ingress channel.command 
channel.file.upload channel.file.download channel.pull channel.ack 
session.archive session.list session.set_alias session.notify session.compact session.config 
job.create job.get job.list usage.get spine.tail 
```

> 无 container 相关控制面方法（v0.6.0 起 container 模式退役，`container` 在 daemon 仅剩 `31473` 一处向后兼容类型守卫）。`/effort` 等斜杠命令不是独立 RPC 方法，经 `channel.command` 入站处理（`Tne @75341`，`/effort` 分支 `79553/78800/80148`）；每会话推理力度落到 run-config 字段 `"effort"`（`49876`）/ `reasoningEffort`（`60131`）。
>
> 活体已验证返回：`spine.tail`、`usage.get`、`system.status`。其余以分派链代码为准（见 §9 第 4 条）。


---
## 附录 C：本文的逆向方法论（可复现）

作者不发布源码，只发布 minified 包。本文的分析链路如下，供后来者复现：

1. **反混淆**：`dist/release/{daemon,cli,stdio}.js`（esbuild 打包）→ js-beautify 展开为 `*.pretty.js`（daemon 7.9 万行 / cli 12.8 万行 / stdio 4.7 万行）。变量名已被 mangle（`eh`/`Gd`/`K_e`…，且 esbuild 每次构建都会重新 mangle——短名跨版本不稳定），但**字符串字面量、事件名、RPC 方法、env 名、日志前缀、路径片段全部保留**——它们是逆向的锚点，也是跨版本重锚定的依据。
2. **地标索引**：对反混淆代码 grep 关键概念（spine/drain/lease/cadence/partition…）建立「概念→行号」索引，避免通读（大部分体积是打包进来的 react/ink/zod/fastify/claude-sdk）。
3. **提示词层直读**：`bootstrap/` 下 `meta-prompt.md`（agent 身份/记忆纪律的"宪法"）、`config/*.md`、`subconscious/**` 人类可读，直接构成认知层证据。
4. **活体探测**：运行 daemon，用 `duoduo daemon status|config`、`duoduo session list`、`/rpc`（`spine.tail`/`usage.get`/`system.status`）观测真实行为与数据结构。
5. **多 agent 对抗验证**：8 个子系统各由独立分析 agent 逆向，再由**对抗验证 agent**逐条证伪（逆向 minified 代码极易产生"看似合理实则错误"的主张，默认怀疑）；主循环另行提取事件类型/RPC 全集作地面真值交叉校验（附录 B）。

**一句话结论**：duoduo 的"智能是持久的、非一次性的"这一主张，在代码层由三件事共同兑现——**append-before-execute 的 WAL（状态可信可恢复）+ 双注入面的提示词装配（稳定认知与易变状态分离）+ cadence 驱动的潜意识回写广播板（经验跨会话沉淀）**。运行时刻意做薄，把推理全交给模型；它守住的是模型守不住的持久化、生命周期、调度与并发边界。
