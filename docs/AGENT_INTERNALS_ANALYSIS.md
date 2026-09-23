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
> **定位**：本文是**逐机制证据文档**（工程师复核用）。若你想先建立全貌或以产品视角理解设计思路（自我迭代、四个推理引擎、渠道打通），请先读姊妹篇 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)——它按设计问题组织、结论先行、不写行号（其附录 C 把每一节映射到本文的对应小节），与本文互为详略；部署视角见 [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md)。

---
## 材料与方法

duoduo 故意以 minified JS 发布（作者立场："代码是给 agent 读的，压缩只为省带宽"）。本文用四种方法交叉取证并经对抗验证，逆向其真实实现：

1. **静态代码 + 调用链追踪**：用 esbuild 反混淆 + js-beautify 把 `dist/release/{daemon,cli,stdio}.js` 展开为可读代码（基准 v0.6.2；daemon 79052 行，约 7.9 万行）。字符串字面量（事件名/RPC 方法/env/日志）在 minify 后完整保留，是证据锚；关键机制**沿真实函数调用链追踪**（跟进被调用的下游函数确认控制流真的这样串联），而非仅凭单个字符串推断。
2. **可读提示词**：`bootstrap/` 下 `meta-prompt.md`（agent 身份/记忆纪律的"宪法"）、`config/*.md`、`subconscious/**` 定义 agent 认知，本身人类可读。
3. **活体运行时调用链**：本机运行的 daemon，用 `duoduo` CLI + `/rpc`（`spine.tail` 事件序列 / `usage.get` drain record / `daemon status`）印证动态行为——动态证据优先于静态推断。
4. **还原源码交叉复核（本轮新增）**：运行时已被还原为可读、且经证明可同样运行的源码（见 [`../reconstruction/`](../reconstruction/)）。关键点：esbuild 的 `__export` 助手**逐字保留了真实导出符号名**（daemon v0.8.0 恢复 733 个），因此本文引用的短名 `Wh`/`on`/`sn`/`Tgt`… 绝大多数能对上**权威原名**（`buildSystemPromptForChannelConfig`/`createSpineEvent`/`atomicAppendEvent`/`createSessionManager`…）。本轮用这些真名源码逐节复核了各机制主张，纠正处见 §9。**短名↔真名全表**见 [`../reconstruction/maps/RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)，可读源码按子系统分文件在 [`../reconstruction/first-party/`](../reconstruction/first-party/)；一等公民的准确计数见 [`../reconstruction/maps/pipeline_report.json`](../reconstruction/maps/pipeline_report.json)（该文件由流水线生成，不手工维护）。

**符号命名约定**：下文机制名尽量以「真名 (短名)」形式给出，如 `buildSystemPromptForChannelConfig (Wh)`。真名来自 `__export` 者为权威；少数内部辅助函数的真名系逆向推断，在 `RENAME_TABLE.md` 标 *inferred*，即便名字有偏差也不影响行号与逻辑结论。**新增引用请一律用这个形式**：它由 `verify_citations.mjs` 按符号身份核对，符号消失或短名对不上会让构建失败，而行号漂移可用 `--fix` 机械重生成。没有真名的地方写成 `短名`（行号）或 `代码片段`（行号），前者要求短名出现在该行或包住该行，后者要求片段里的字面量或标识符出现在该行；不属于这三种形式的裸行号没有可交叉验证的冗余，构建会拒收（`reconstruction/tools/anchor_forms.mjs`）。

**可信度纪律**：8 个子系统各由独立 agent 逆向，再由对抗验证器沿调用链逐条证伪，最后用还原源码复核；每条机制主张标注 `file:line` / 字面量 / RPC / CLI 供复核，置信分 `confirmed` / `未证实推测`。所有行号指反混淆后的 `daemon.pretty.js`（除非另注 `cli`/`stdio`）。凡未证实的推断均显式标注。


---
## §0 端到端：一个消息如何穿过整个 agent 大脑

**这张图就是"一句话结论"的时间展开**：它把四条论点——先落日志再执行（Part III）、稳定认知进 system·易变状态进 user（Part I）、会话被 actor 持有并驱动（Part II）、经验回流成直觉层（Part IV）——拍成一条从入站到产出的时间线。行尾的 `[→Part]` 是通往各部分的导航锚点。

```
外部输入 (channel.message)                                    [→Part III §5 Gateway 入站边界]
   │
   ▼  ① 封装为不可变事件  createSpineEvent (on)  → id=evt_<uuid>, ts=ISO   [32001，调用点 87196]  [→§4]
   │
   ▼  ② 去重前置  computeDedupKey (vse) 算 key                  [86887，调用点 87234]        [→§4]
   │      命中重复 → 取回既有事件 + 重放上次 gateway 回执 → deduplicated:true，不 append
   │
   ▼  ③ APPEND-BEFORE-EXECUTE：atomicAppendEvent (sn) 追加写 WAL 分区 + by_id 索引  [32043，调用点 87271]  [→Part III §4 铁律]
   │      var/events/YYYY-MM-DD.jsonl (UTC)，记 byte_offset/byte_len
   │      → 无条件写 by_id 索引（唯一索引；不存在 by_session 索引）
   │
   ▼  ④ advanceConsumerWatermark (Nu) 推进 gateway 消费者 watermark  [32858，调用点 87271]
   │      run/queue_offsets/gateway.json  (经 by_id 反查偏移)
   │
   ▼  ⑤ gl() 更新 status.json（与 ③④ 同一行提交）                 [32834，调用点 81196]
   │
   ▼  ⑥ 按 routing_hint.target 入队（appendBeforeExecuteGateway/Gle）  [87194]  [→Part III §5 分流]
   │      分流决策 aae                                                            [80980]
   │      gateway → 同步处理不入队
   │      meta    → 写 meta:subconscious mailbox 指针                [81221]     [→Part IV §6]
   │      session → 向 session_key mailbox append '- [ ] @evt(<id>)'   [81231]
   │
   ▼  ⑦ bus.emit('spine.event', r) → session.wake                [81241]     [→Part II §3 actor 唤醒]
   │
   ▼  ⑧ runner 读 mailbox 的 @evt 指针 → readEventById (Md) 查 by_id 索引按字节偏移读 WAL 取正文  [32052]
   │
   ▼  ⑨ 装配上下文（两个正交注入面）                                          [→Part I §1 认知装配]
   │      system-prompt 面：renderPromptLayers (Ahe) 6 层叠装，buildSystemPromptForChannelConfig (Wh) 包壳
   │                        （身份→通道→实例→广播板→Runtime Context→job）  [49967/49994]
   │      user-message 面：buildTransientUserBlocks (QSe) 瞬态块
   │                        （restart-hint/time/skip/gateway/job-receipts/job-tick→user-input）  [65787]
   │
   ▼  ⑩ drain 合批 (drainSessionMailbox/GSe → batchDrainItems/xH) → createAgentSdkAdapter (Ef) → SDK query()
   │                                                          [64516/65926/50087]  [→Part I §2 Turn/Drain]
   │      （单 turn 准入——一次只准入一个 turn，后到消息走 steering lane 显式注入
   │        当前 turn，不再折进正跑的 turn 里导致会话永久 busy；createCodexAppServerAdapter (yw) @61974
   │        / pendingSteer，createSessionManager (Tgt) @83621）
   │                                                  （后端 claude/codex/grok/pi 路由 [→Part II §8]）
   │
   ▼  ⑪ agent 产出 → append agent.tool_use / tool_result / result 回 WAL
   │      更新 session state.json：last_event_id / last_event_at / sdk_session_id   [65090/65425]
   │
   ▼  ⑫ 经验沉淀：日志 → 潜意识 cadence tick(≈37min) → 分区流水线（v0.8.0 起 memory-weaver 已拆为 gradient-distiller+intuition-weaver，见 §6 更新块）   [→Part IV §6§7]
          → 回写 memory/CLAUDE.md 广播板 → 下一次前台会话经 transcludeBroadcastBoard (HEe) 再注入  [82179]
```

**闭环**：经验 → 事件日志 → 潜意识加工 → 广播板 → 系统提示 → 新的经验。这正是关键句 4（后台自治）与关键句 1（认知装配）合起来的闭环——后台把经验压成直觉层，前台每个新会话经 `Wh` 自动加载。


---

# 第一部分 · 前台交互：上下文装配 + 单一长驻会话的受控执行

> **关键句**：一次前台交互 = 可确定的上下文装配（§1）+ 单一长驻会话的受控执行（§2）。运行时决定拼什么、何时发一次 query、如何合并与 steering，模型只在这段上下文上推理。


---
## §1 认知装配

**认知装配的本质是一次正交切分：把 agent 上下文拆成"稳定认知"与"易变具身状态"两个注入面——稳定的（身份/人格/直觉广播板）由 `Wh` 一次装进 system-prompt 前缀以吃满 prompt caching，易变的（时间流逝/中断/job tick/带外动作）由 `QSe` 每 turn 瞬态塞进 user 消息；且 Claude 与 Codex 共用 `Wh` 这一套装配器（Codex 只多套一层 `<aladuo:system-context>` 壳），并非两套并行封装。**

这套切分之所以值得单独成节，是因为它同时优化了两个互相冲突的目标：既要让前缀足够稳定以命中 prompt cache，又要让 agent 感知到它本无的具身信号（时间、被打断、后台节拍）。运行时把这两类内容路由到两个物理位置，从根上避免了"易变状态污染缓存前缀"。下面四个论点自上而下展开：稳定面怎么装（论点一）、易变面怎么装（论点二）、两条后端为何同源（论点三）、以及不走 JE 的两条旁路（论点四）。

| 注入面 | 频率 | 装载内容 | 载体 | 缓存友好性 |
|---|---|---|---|---|
| **System-prompt 面** | 每会话/每 turn 重算 | 身份、通道人格、实例特化、直觉广播板、运行上下文、job mission | `Wh` 输出的前缀 | 前缀稳定，利于 prompt caching |
| **User-message 面** | 每 turn 瞬态 | 流逝时间、被打断、job tick、smart-compact 提示、广播板更新、gateway 侧信道结果 | `QSe` 输出的 text blocks | 每 turn 变，不入前缀 |

---

### 论点一：稳定认知由 `Wh` 六层一次装进 system-prompt 前缀

**所以呢**：agent 的"我是谁 / 我这个通道该有什么人格 / 我此刻记住了哪些跨会话启发式"这类稳定信息，全部在一处（`Wh`）按固定层序拼成一个前缀。层序固定 + 内容稳定，才能让同一 agent 的连续 turn 反复命中同一缓存前缀。

**六层装配顺序**（confirmed）。v0.7.1 起实际拼接六层的是 `renderPromptLayers (Ahe)`（`daemon.pretty.js:55093-55118`），按固定顺序 `[o,s,a,l,u,c].filter(Boolean).join("\n\n")` 拼接（单处 `join`（`55115`））；`buildSystemPromptForChannelConfig (Wh)`（`55120-55129`）只是调用 `Ahe` 拿到拼好的文本后决定 `prompt_mode==="override"` 时原样返回、还是包成 `{type:"preset",preset:"claude_code",append:s}`——**六层拼接与 override/append 包壳是两个函数**（v0.6.2 时代是同一个函数内的两个分支，详见 Part II §8 论点④的重构记录）。两者签名同为五参 `(e,t,n,r,i)`：`e`=effective config、`t`=session_key、`n`=jobContext、`r`=memoryBoard、`i`=runtime：

| 层 | 变量 | 来源 | 位置 | 说明 |
|---|---|---|---|---|
| 1 身份 | `o` | `jb()` 读 `ALADUO_META_PROMPT_PATH` 或 `ALADUO_BOOTSTRAP_DIR/meta-prompt.md` | `Xv`（`55094`），定义 `resolveMetaPromptText (Xv)`（`55069`） | 不变 identity；活体 meta-prompt.md=14126 bytes |
| 2 通道 | `s` | `e.kind_prompt` | `kind_prompt`（`55095`） | 通道级人格 |
| 3 实例 | `a` | `e.instance_prompt` | `instance_prompt`（`55096`） | 实例特化（覆盖类型级） |
| 4 广播板 | `l` | `r.content`（memoryBoard），仅当 `r && r.content.trim().length>0` | `r.content.trim()`（`55104-55113`） | 直觉层，见下 |
| 5 运行上下文 | `u` | `## Runtime Context`（注入 `session_key`/`channel_kind`，第五参 `i` 非空时再加一行 `- runtime:`），仅当 `t` 存在 | `## Runtime Context`（`55097-55102`） | 相对稳定，**不含时间戳** |
| 6 任务 | `c` | `jde(n, n.stateless===!0)` 生成 `## Job Mission`，仅当有 jobContext | `Ohe`（`55114`），定义 `renderJobMissionBlock (Ohe)`（`55086`） | stateless 变体额外强调"上文无历史，靠文件持久化"（`"FRESH context"`（`55088`）） |

- 第 4 层的 `if(r && r.content.trim().length>0)`（`55104`）是布尔短路：`r` 为 undefined（无 memoryBoard）时不解引用、不抛错（confirmed）。
- `resolveMetaPromptText (Xv)`（`55069`）依次探 `ALADUO_META_PROMPT_PATH`、`ALADUO_BOOTSTRAP_DIR/meta-prompt.md`，取首个非空 trim（confirmed）。

**prompt_mode 分叉**（confirmed）。v0.7.1 起这条分叉从 `Wh`（buildSystemPromptForChannelConfig）内部搬到了它调用 `Ahe`（renderPromptLayers）**之后**：`Wh`（`daemon.pretty.js:55120-55129`）先拿 `Ahe` 拼好的六层文本 `o`（`55121`），`e?.prompt_mode==="override"`（`55122`）→ 返回纯字符串 `o||""`，整体替换 Claude Code 预设；默认 `append` → `s=o.trim()||void 0`（`55123`），非空则返回 `{type:"preset", preset:"claude_code", append:s}`（`55124-55128`），为空返回 `undefined`（即无 append）——**装配（六层拼接）与包壳（prompt_mode 分叉）现在是两个函数，不是一个函数内的两个分支**（详见 Part II §8 论点④）。

**数据源**（confirmed）。调用链 `wH`（`70287`）调 `Wh(h, t, JSe(n.jobContext), n.memoryBoard, n.runtime)`（`70320`）——第三参经 `JSe`（`70240`）把 jobContext 投影成 `{content, jobId, cron, stateless, acceptance}`。**Claude 的 kind/instance/prompt_mode/time_gap 全部来自 `h`（effective_config：经 `xo(s,"effective_config_ms",…KV)`（`70295`）取得并缓存，再由 `applyJobSdkConfigOverride (GV)` 叠上 job frontmatter 覆盖），不是来自 `uot`**（`uot` 的用途见论点四）。此外 `Wh` 被调两次：批处理/admission 路径 `Wh`（`70320`）与 live streaming 路径 `Wh`（`71136`），同一装配复用于两种进场方式。

**广播板包装：OVERRIDE 前缀 + dossier 纪律**（confirmed）。第 4 层的 memoryBoard 整段被常量包装（`khe`/`hrt`/`grt`（`55523`）定义，使用于 `grt.test(d)`（`55106-55112`））：

```js
l = grt.test(d)
  ? `${khe}\n\n${d}\n\n${hrt}`   // 含 [[slug]]
  : `${khe}\n\n${d}`;            // 不含
// grt = /\[\[[^\]]+\]\]/                                   （55523）
// khe = "…IMPORTANT: These instructions OVERRIDE any default behavior…you MUST follow them exactly"  （55523）
// hrt = "The `[[slug]]` links…are dossier entry points, not footnotes…"  （55523）
```

即广播板整段以 OVERRIDE 前缀 `khe` 包装；含 wiki-link 时追加 dossier 纪律 `hrt`（"[[slug]] 是深档入口，触发时先读再行动"）。**注意：此 `khe` 包装对 Claude 与 Codex 同源同文**——因为 Codex 复用的正是 `Wh` 的整段输出（详见论点三）。

**广播板来源：`@include` transclusion**（confirmed）。`transcludeBroadcastBoard (HEe)`（`82179`）→ `WEe`(`82194`)递归解析 `memory/CLAUDE.md`：用 `@path` 前缀语法（正则 `zEe=/(?:^|\s)@((?:[^\s\\]|\\ )+)/g`（`82324`））提取 include，按深度上限 `agt=5`（`82324`；`if(n>=agt)return[]`（`82195`））递归内联，扩展名白名单 `ugt`（`82324`，实测 106 个扩展名）。每个被 transclude 的文件头是 `Contents of ${path} (project instructions, checked into the codebase):`（渲染器 `cgt`（`82187`）+ 后缀常量 `lgt`（`82324`）），非裸冒号。

- **去环细节**（confirmed）：visited 集主检的是 `t.has(o)`（`82198`），其中 `o=UEe(i)` 是 resolve+win32 小写后的路径（定义 `UEe`（`82236`）），**不是 realpath**；realpath 由 `fgt`(`82228`)另行求得后以 `t.add(o), t.add(UEe(a))`（`82202`）额外加入 visited 兜住软链别名。即"resolve 主检 + realpath 补检"。

**活体冷启动印证**（confirmed）。本机 `~/aladuo/memory/CLAUDE.md` 为 0 字节 → `He.memoryBoard` 为空 → 不构造 memoryBoard（`memoryBoard: He.memoryBoard ? {path,content} : void 0`（`84523-84526`））→ `Wh` 不注入第 4 层。这印证机制本身：广播板初始为空，由潜意识逐步写入 durable heuristics 后才在下一次会话被注入——**渐进式冷启动，而非硬编码知识**。

---

### 论点二：易变具身状态由 `buildTransientUserBlocks (QSe)` 每 turn 瞬态塞进 user 消息

**所以呢**：时间流逝、被打断、job 节拍、job 完成回执、带外动作结果这些"每 turn 都可能变"的信号，若进 system prompt 会不断击穿缓存前缀。运行时把它们做成带 tag 的 text block，前置到用户输入之前、进 **user 消息而非 system prompt**，既让 agent 感知具身状态，又不污染缓存前缀。

**块顺序**（confirmed，v0.8.1 复核，行号已更新）。`buildTransientUserBlocks (QSe)`（`71662`）返回 `{blocks[], ...*Injected 标志}`，push 顺序逐条对上：

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

**首块 `daemon-restart-hint` 携带重启原因，且只到 channel 会话**（confirmed）。文本由 `renderDaemonRestartHint (Bbe)`（`65853`）拼成：底句 `[system] You're running under a new daemon process (started <ts>).`，若本次启动认领到了重启原因则追加 ` Restart reason, given by the caller: <reason> (requested <ts>).`。原因来自 `getPendingRestartReason (Ube)`（`65816`）——一个模块级全局，由 boot 期一次性认领写入（见 §4 论点一末尾的"跨进程旁路"）。**是否注入由 `qbe`(`65824`)门控，非 `channel` 类会话直接判 `out-of-scope`**：`job:` / `meta:` / `cadence:` / `subconscious:` / `system:` 会话永远拿不到这个块，因此"重启原因会到达每个被唤醒的会话"这个直觉是错的。另有 `new-session`（无 `lastEventAt`）与 `grandfather`（无水位）两个阶段只写水位不注入。

**v0.8.1 新增：job 完成回执改走 `job-receipts` 瞬态块，不再唤醒独立 turn（confirmed）。** CHANGELOG 原话："A finished job's completion receipt now arrives as context on the owner's next turn instead of waking a turn of its own"，代码证据链完整：批量组装器 `batchDrainItems (xH)`（`71801`）在挑选"驱动本轮的 mailbox 条目"时，对每条候选先 `ike(c)`（`71888`）探测——`ike` 内部先经 `rke(e)`（`71882`：`e.type==="route.deliver" && payload.source_event_type==="job.complete"` 才返回内层 payload）取出 job 完成投递的内层 payload，再 `dn(t,"job_id")` 取 `job_id`；只要 `ike(c)!==null`（即这条 mailbox 条目是一次 job 完成投递）就 `continue` 跳过（`if (c && ike(c) !== null) continue`（`71815`））——**job.complete 投递被排除在"本轮驱动条目"之外，不会单独催生一个 turn**。与 `xH` 平行的 `fft`（`71937`）在同一次 `drainSessionMailbox (GSe)` 调用里对**全部**待处理 mailbox 条目（不止 `xH` 选中的那一批）重新扫一遍，专挑 `ike(l)` 非空的条目按 `job_id` 分组、渲染成回执文本（单条直接用 `RO` 生成的 prompt、多条经 `dft` 合并成"as one continuous update"），返回 `{text, eventIds}`；这份 `.text` 经 `GSe` 内 `jobReceipts: C?void 0:A?.text`（`70780`）传给 `wH`，最终作为 `QSe` 调用参数 `jobReceipts: o.jobReceipts`（`70314`）落进上面的 `job-receipts` 瞬态块（`tag: "job-receipts"`（`71737`））——**随本轮"真正驱动 turn 的那条事件"一起，作为上下文顺带交付，而不是自己单独催生一次 drain/turn**。这些 job.complete 条目并未被静默丢弃：`fft` 返回的 `eventIds` 会被 `GSe` 的 `pe()` 收进 `x`（`64686-70545`）随本轮一起 `markDone`（mailbox `.pending` 文件照常被 ack）。mid-turn steering 路径（admission callback 里的另一处 `wH`（`84232`）调用）**不传 `jobReceipts` 字段**，故该机制只在 `GSe` 主批处理路径生效。

**`jobReceiptsInjected` 标志并入既有的注入追踪字段**：`QSe` 返回对象的 `*Injected` 标志集合（`gatewayNoticeInjected`/`interruptedContextInjected`/`skipRewindInjected`/`timeGapInjected`/`jobTickInjected`/`daemonRestartHintInjected`/`compactNoticeInjected`/`boardUpdatedInjected`，初始化见 `…Injected: !1`（`71664-71672`））v0.8.1 新增了 `jobReceiptsInjected`（`71669` 初始化 `!1`，命中 `t.jobReceipts`（`71734-71738`）时置 `c=!0`，随返回对象 `jobReceiptsInjected: c`（`71757`）带出），语义与其余标志一致——都是"这次调用是否真的往 blocks 里塞了这个 tag"的布尔回执，供调用方按需做消费后收尾（同一 `*Injected` 家族里 `gatewayNoticeInjected`/`interruptedContextInjected`/`skipRewindInjected` 三个在 `GSe` 内被用来门控 `pending_gateway_notice` 等 pending 字段的清空，`ve.gatewayNoticeInjected && !w`（`70768`））。`jobReceiptsInjected` 本身走的是另一条收尾路径：真正标记回执已消费的是 `fft` 返回的 `eventIds` 经 `pe()` 并入 `x` 后随本轮一起 `markDone`（`64686-70545`），`jobReceiptsInjected` 只是把"job-receipts 块这次是否真的被塞进 blocks"这一布尔态并入既有的标志集合，不是新机制。

**slash 命令短路**（confirmed）。若用户输入 `e.trimStart().startsWith("/")`（`71674`），跳过全部注入只发 user-input 原文——命令式输入不该被时间/中断噪声污染。

**time-gap 阈值的读取位置**（confirmed）。time-gap 阈值来自 effective config 的 `time_gap_minutes`，但**不在 `QSe` 内读取**：`XSe`（`71625`）先算 `t=(e.timeGapMinutes ?? Jdt)*60*1e3`（`Jdt=60`（`72627`）分钟）构造出 timeGap 对象，`wH` 内 `v=XSe({...})`（`70298`）算好后经 `timeGap:v`（`70313`）传入 `QSe`（`70308`），`QSe` 只消费 `t.timeGap`。

**`/effort` 是运行时旋钮、不属任一注入面**（v0.6.0 引入，具体透传行号本轮未重新核对）。`/effort` 网关命令设置每会话推理力度，落到 run-config 的 `effort` 字段直接透传给 SDK。它既不进 `Wh` 的 system-prompt 前缀、也不进 `QSe` 的瞬态 user 块——是与两个注入面正交的模型推理参数（类同 model 选择），故不影响缓存前缀。

---

### 论点三：Claude 与 Codex 共用 `Wh`，Codex 只多一层 `<aladuo:system-context>` 壳

**所以呢**：Codex 的系统提示就是 `Wh` 那一整串（含 identity/kind/instance/广播板/`Hoe`/runtime/job），二者差异只剩最外层那层壳。乍看代码里存在"两套并行封装器"（`Uye`/`qye`），容易据此推出"双重 `Contents of` 头嵌套""Codex developerInstructions 携带时间戳"两种缓存破坏——但沿真实调用链核验，**这两处漂移在 v0.6.1 运行时都不发生**（那对封装器是不可达死代码，见下）。

**为何 `Uye`/`qye` 的封装分支不可达**（confirmed，静态调用链）：
- `Uye`（`61929`）/`qye`（`61947`）全仓仅在 `Uye(t ?? {}, h)`（`62052`）/`qye(t ?? {}, …)`（`62053`）（`yw` 的 run 内）被调用，用的是闭包 `t`（`yw(e,t)` 的第 2 参 = instructions）。
- 但两处 `yw` 构造都**只传一个 config 参、不传 instructions**：会话管理器路径 `w.adapter=f({sandbox,ephemeral:!1,model,dynamicTools})`（`84372`）（`f = e.codexAdapterFactory ?? yw`（`83636`））、潜意识路径同样 `yw({sandbox,ephemeral:!0,dynamicTools})`（`85804-85807`）。故运行时 `t===undefined`。
- 于是 `Vpe(t??{},f)` = `Vpe({},f)`：`e.identity/kindPrompt/instancePrompt/memoryBoard` 全 undefined，`## Identity`（`61931`）/`## Channel Configuration`（`61935`）/`Contents of`（`61939`）三个分支全不触发——`Contents of …(intuition layer…)`（`61939`）措辞是**当前路径不可达的死代码**；但第二参 `f` 非空时 `## Runner System Prompt`（`61941`）分支照常触发，这正是 Codex 拿到 `Wh` 文本的通道。`Wpe({}, dynamicTools 名字数组)`：`e.sessionKey/channelKind/runtimeDirectives` 全空 → `## Session Context` 不生成，故 `- timestamp:`（`61951`）**不注入**；但只要第二参非空，`<duoduo-reminder>`（`61956`）分支仍会产出一个只含该提醒的 `<aladuo:runtime-directives>`（`61957`）块——即"developerInstructions 完全不产生"只在无 dynamicTools 时成立。

**Codex 实际拿到什么**（confirmed）。`h=zye(f.systemPrompt)`（`62051`，调用点）= 把 `Wh` 的 preset `{append}` 抽成字符串。`extractSystemPromptAppend (zye)`（`61925`）正是 `Wh`→Codex 的桥，让 Codex 复用 `Wh` 输出这条链闭合。所以 Codex 的 baseInstructions = `<aladuo:system-context>… ## Runner System Prompt\n\n{eh 整段}…</aladuo:system-context>`（分支 `## Runner System Prompt`（`61941`），壳 `<aladuo:system-context>`（`61943`））。

| | Claude | Codex |
|---|---|---|
| 稳定认知来源 | `Wh` 输出 | **同一份 `Wh` 输出**（经 `zye` 抽字符串） |
| system 载体 | `{type:"preset", preset:"claude_code", append}` | `baseInstructions`，内嵌 `## Runner System Prompt` + JE 整段 |
| 外层壳 | 无（纯拼接） | `<aladuo:system-context>` |
| 广播板 / `Hoe` | 有 | **有（同源同文）** |
| 时间戳 | 仅在 user 面（`QSe` time-context） | **无**（`qye` 返回 undefined，反而缓存友好） |

**结论**：Codex 的 identity/kind/instance/广播板/`Hoe`/runtime/job 与 Claude 完全同源同文，二者差异只剩最外层 `<aladuo:system-context>` 这层壳。且 Codex 系统提示没有时间戳、比 Claude 更缓存友好。

**适配器选择**（confirmed）。内层选择器 `$e(w)`（`83790`）决定路径：runtime 不是 `claude`（即 codex/grok/pi）→ 用 actor 上唯一的 `w.adapter` 字段，三种后端都往这一个字段里填（codex 在 drain 中由 `w.adapter = f({`（`84372`）惰性构造，走上述 `yw`）；该字段为空时返回一个 `run` 直接抛错的替身（`refusing to fall through to Claude`（`83793`）），即失败关闭、不回落到 Claude。runtime 是 `claude` 时，channel 会话走 streaming 包装，其余走裸 `Ef`。

**SDK 适配器兜底**（confirmed）。`createAgentSdkAdapter (Ef)`（`55213`）仅当 `t.systemPrompt===void 0`（`55221-55222`，else 分支）走兜底：`u = Zv(process.env.SYSTEM_PROMPT)`（`55223`）、`l = Zv(process.env.APPEND_SYSTEM_PROMPT)`（`55224`）、`f = [Xv(), l].filter(...).join(...).trim()`（`55225-55227`）；`u && f`→拼接赋给 `r.systemPrompt`（`55228`）、`u`→整体替换 `r.systemPrompt`（`55230`）、`f`→append `"preset"`（`55230-55234`）。即便未设 `APPEND_SYSTEM_PROMPT`，只要 `resolveMetaPromptText (Xv)` 非空 `f` 就非空并 append meta-prompt（`Xv()` 返回 undefined 且未设 `APPEND_SYSTEM_PROMPT` 则 `f` 空、无 append）。permissionMode = `t.permissionMode ?? ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`55220`；v0.6.1 无条件兜底到 `bypassPermissions`，不再区分 host）。**注意这是降级分支**：正常 drain 里 `systemPrompt` 由 `Wh` 提供，此兜底不进，仅在"上游没给 systemPrompt"时生效。

---

### 论点四：不走 `Wh` 的两条旁路——潜意识分区注入与指纹漂移信号

**所以呢**：`Wh` 装配的是前台会话的稳定认知。系统还有两处独立于 `Wh` 的上下文机制：潜意识分区会话用另一套注入器（它没有前台对话历史，需要绝对路径 + 收件箱），以及 `uot` 产出的 instructions 指纹（它不进任何提示词，只驱动 resumed session 失效）。厘清这两条旁路，才能解释"为何 `uot` 要重算 identity/kind/instance 却不用于提示词"。

**潜意识分区注入**（confirmed）。partition（`meta:subconscious`）不走 `Wh`：
- `Fgt`（`85782`）：`## Runtime Context` + Timestamp + Sessions + `### Key Paths`（含 `memoryBroadcastPath` 等全绝对路径）。
- `zgt`（`85789`）：`## Inbox` + "After processing each item, delete the corresponding file … to ack it."——每条 `.pending` 文件，处理后删文件 ack。
- 另有 **Session Mailbox 旁路** `pR`(`32705`)：`["# Session Mailbox","","## Inbox",""]`（`32706`）写盘供 agent 主动 Read，不进 system prompt——属"working notes"层。

**`YEe` 的真正用途：instructions 指纹 / 漂移失效**（confirmed）。`YEe`(`82529`)确实存在——它与 `runInstructionsFingerprintGuard (OA)` **同在一行被调用（`YEe`/`OA`（`84145`）），且 `YEe` 的输出被喂入 `OA` 指纹守卫**（而非"被 `OA` 调用"）。但它**不进任一路的实际提示词**（Claude 用 `jb()`+effective_config，Codex 用 `Wh` 输出）。它的实际用途有二：
1. 产出 `memoryBoard`（`(await HEe(e.memoryBroadcastPath)).rendered.trim()`（`82533`））供 `Wh` 两路复用——经 `memoryBoard: He.memoryBoard ? {…}`（`84523-84526`）打包成 `{path, content}` 进 drain 配置的 `memoryBoard`；
2. 在调用点 `OA`（`84145`）喂给 `runInstructionsFingerprintGuard (OA)`（`82384`）算 instructions 指纹做漂移检测——指纹 = `computeInstructionsFingerprint (LS)`（`82330`）= `sha256(JSON.stringify([identity??"", kindPrompt??"", instancePrompt??"", memoryBoard??"", mission??""]))`（每元素带 `?? ""` 兜底），**另有一个条件第六元素**：`e.missionAcceptance` 非空时 push 进同一数组（`t.push(e.missionAcceptance)`（`82332`））——即 job 的 acceptance 文本也是漂移信号面的一部分。

**board 层与指令层解耦**（confirmed，v0.6）。`OA` 除全量指纹外，另算 board 层哈希 `uJ(n.memoryBoard)`（`82389`；定义 `computeBoardLayerHash (uJ)`（`82335`））与非 board 指纹 `lJ(n)`（`82390`；定义 `computeNonBoardInstructionsFingerprint (lJ)`（`82339`），把 `memoryBoard` 置 undefined 后复用 `LS`）。当且仅当 board 层变而非 board 指纹不变时判 `boardOnlyDrift`（`board_layer_hash !== c && instructions_nonboard_fingerprint === d`（`82391`））——此时 gate2 触发但 **不再拆会话，只 pin streaming 前缀**（`"board-only drift — pinning streaming prefix (no teardown)"`（`84155`），无活跃 streaming 时退化成 `"nothing to pin"`（`84158`））；仅真正的非 board 指令漂移才在 `gate2Fired && runtime==="claude"`（`84155`）守卫下发 `session.streaming_invalidated`（`reason: "instructions_drift"`（`84161-84163`））。即"广播板刷新不再白白击穿正在跑的 streaming 前缀，只有身份/人格/mission 真变了才失效"。

即 `uot` 的 identity/kindPrompt/instancePrompt 只进指纹、不进提示词——它是驱动 resumed session 失效的独立信号面。此外 `$Se`(`70234`)/ `autoloadAdditionalDirectoryClaudeMd`（`70867`/`71172`，env 旗标 `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`（`55254`））门控 memoryBoard 与 additionalDirectories 的 CLAUDE.md 自动加载，是广播板之外第二条"文件即上下文"注入。

---

> **给 Agent PM 的洞察**
> - **双注入面是本框架最可复用的单点设计**：稳定认知放 system prompt（每会话装一次、利于缓存前缀命中），易变运行时状态放 user 消息瞬态注入。既保护缓存前缀，又让 agent 感知"时间流逝""被中断"等它本无的具身信号。这正是本节领起结论的核心——两个注入面的正交切分。
> - **"共用装配器 + 薄外壳"胜过"两套并行封装"**：核验推翻了原以为的"Claude/Codex 各写一套装配器"。真相是两路共用 `Wh`，Codex 只多套一层 `<aladuo:system-context>` 壳（`zye` 桥接）。多模型后端 agent 应把"装配面共用、执行面才分叉"作为纪律，避免各写一遍导致措辞漂移（本次核验中原以为的"双 `Contents of` 头""Codex 时间戳"两处漂移，实为不可达死代码，根本不发生）。装配同、执行异——执行/命令面的后端分叉见 §8。
> - **广播板 = 潜意识→意识的单一通道**：后台把跨会话 durable 启发式压成"一行一指针"的直觉层，前台每个新会话经 `Wh` 第 4 层自动加载。`[[slug]]` 指针 + `DWe` 纪律实现"默认不展开、触发才读 dossier"，控制上下文膨胀。全新安装板为空即无注入——渐进式冷启动。
> - **`override` vs `append` 是干净的能力边界开关**：默认 append 复用 Claude Code 内置提示（工具/安全/格式），override 让通道完全自定义人格。三层 prompt（identity/kind/instance）+ override = "共享内核 + 通道特化 + 实例特化"清晰叠加。
> - **指纹与提示词解耦**：`uot` 重算 identity/kind/instance 却只喂指纹、不喂提示词，用漂移信号（`instructions_drift`）独立驱动 resumed session 失效——把"内容是否变了"的检测与"内容如何装配"彻底分离。v0.6 更把 board 层与指令层拆开（`boardOnlyDrift`），广播板刷新只 pin 前缀、不再拆会话，值得任何做 session resume 的运行时借鉴。
> - **gateway-notice 机制**：把模型上下文外执行的带外动作，作为 `<system-reminder>` 告知"已生效、勿重复"，解决了"带外副作用与模型认知不同步"的经典问题，任何有旁路控制面的 agent 都该借鉴。

---

### 论点五：job 的 SDK 配置只有两层，因为它的 kind 层从不加载

**所以呢**：通道会话的配置是"内置默认 → kind 层 `kernel/config/<kind>.md` → 实例层 descriptor"三级叠加。job 会话看起来也是三级——`bootstrap/config/job.md` 随包发布、自称"This is the KIND layer for every job session on this host"、`ManageConfig(kind="job")` 也写得进去——但**运行时没有任何路径会读它**。job 实际只有"内置默认 + job frontmatter"两级。

**叠加实现**（confirmed）。job frontmatter 可携带 5 个 SDK 键（`prompt_mode` / `allowedTools` / `disallowedTools` / `additionalDirectories` / `claude: {tools}`），由 `applyJobSdkConfigOverride (GV)`（`daemon.pretty.js:65585-65604`）叠到 effective config 上：

```js
!e || !t ? e : { ...e,
  prompt_mode:           t.prompt_mode           ?? e.prompt_mode,
  allowedTools:          t.allowedTools          ?? e.allowedTools,
  disallowedTools:       t.disallowedTools       ?? e.disallowedTools,
  additionalDirectories: t.additionalDirectories ?? e.additionalDirectories,
  claudeTools: mergeClaudeToolLists(e.claudeTools, t.claudeTools),
  claudeModelProfiles:      l4(e.claudeModelProfiles, t.claudeModelProfiles, n=>({...n, source:"instance"})),
  claudeModelProfileIssues: /* append */ ...,
  claudeModelAliases:       l4(e.claudeModelAliases, t.claudeModelAliases, ...) }
```

**前四个键是整体替换，只有 `claude.tools` 是并集**——`job.md` 自己的注释只写了后者是 union，没说前四个是 replace。两条 drain 入口都包了它（批量/admission `GV`（`70295`）、长驻流式 `GV`（`71056`）），且 job 快照**每 turn 从磁盘重读**（`a.getJob(w.jobId)`（`84141`）），所以改一个在跑的 job 文件下一 turn 即生效。

**v0.7.1 新增第六类叠加键：per-model 上下文窗口与 endpoint 路由。** `claudeModelProfiles` 走 `ZV`（`daemon.pretty.js:65562-65569`，参数 `(e,t,n)`）——一个**按 key 逐条覆盖**的浅合并：`t` 里每个 key 覆盖 `e` 里的同名 entry（并打上 `source:"instance"` 标记），`e` 独有的 key 原样保留；不是整表替换。同一模式复用于 `claudeModelProfileIssues`（append）与 `claudeModelAliases`（逐 key 覆盖）。这组 profile 最终在 `classifyModelContextRequirement (uH)`（`69703-69723`）里查表命中后（`Object.hasOwn(mergedCatalog, model)` 命中即经 `sSe`（`69673`）产出 `kind:"profiled-external"`），经 `out`（`65356-65365`，覆盖点 `requiredMaxContextTokens`（`65359`））落到 SDK 设置文件的 `CLAUDE_CODE_MAX_CONTEXT_TOKENS`/`ANTHROPIC_BASE_URL` 环境变量覆盖——即"job/channel frontmatter 可以给单个模型 id 指定独立的上下文窗口上限和第三方 endpoint"，且合并语义是"实例层逐条覆盖全局层，而非整表替换"，与 `claudeTools` 的并集语义、`prompt_mode` 等键的整体替换语义都不同——**这一个 `applyJobSdkConfigOverride` 函数里，五种键分别用了并集/整体替换/逐条覆盖三种不同的合并策略**，读代码前不能假设统一规则（confirmed，逐行核对）。

**v0.8.0 新增第七类叠加键：pi 运行时与 Claude 共用同一个 job-config 叠加口（confirmed，逐行核对）。** `applyJobSdkConfigOverride (GV)` 在 v0.8.0 里新增了 `piExtensions: t.piExtensions ?? e.piExtensions`、`piSkills: t.piSkills ?? e.piSkills`（均为整体替换）、`piConfigIssues: ube(e.piConfigIssues, t.piConfigIssues)`（`ube`（`65606`）`=(e,t)=>!t||t.length===0?e:[...e??[],...t]`，append 语义，与 `claudeModelProfileIssues` 同款）三个键（`piExtensions`/`piSkills`/`piConfigIssues`（`daemon.pretty.js:65600-65602`））。即 pi 作为第四个 runtime 后端并不单独另开一套 job 覆盖通道，而是复用 Claude 那一份 `applyJobSdkConfigOverride`——job/channel frontmatter 能像给 Claude 指定 `claude.tools`/`claudeModelProfiles` 一样，给 pi 指定它自己的 extensions/skills 列表并把配置校验问题整体 append 记录下来。这与 skills 文档新增的 `pi-runtime.md`（"pi as the fourth runtime"）互证：pi 复用的不只是外层的 kind/instance/job 三层调度骨架，连"实例层如何叠加进 effective config"这条最细的缝都与 Claude 共用同一份实现，不是并排另写一套。

**v0.8.1 新增第八类叠加键：`<runtime>.model` / `<runtime>.effort` 把"用哪个模型、想多久"从底层 CLI 手里收归 duoduo（confirmed，逐行核对）。** 这是 v0.8.1 的头号特性，落点是配置键类型注册表 `e6`（`87899`）里的 8 个 runtime 键，键体 `"claude.model"`…`"grok.effort"`（`87911-87918`）：`claude.model`/`codex.model`/`pi.model`/`grok.model` 声明为 `model_id` 类型，`claude.effort`/`codex.effort`/`pi.effort`/`grok.effort` 声明为 `effort_level` 类型。**按 runtime 分命名空间是刻意的**——一个改了 runtime 却继承着默认值的通道，绝不能把 GPT 的 id 带进 Claude。

**三层叠加复用既有的 per-key 折叠器，instance 胜（confirmed）。** `lbe`（`65610`）在装配 effective config 时，把 `runtimeModels` 交给 `obe`（`65488`）、`runtimeEfforts` 交给 `sbe`（`65498`），两者传入的都是**定序三元数组** `[{source:"global"}, {source:"kind"}, {source:"instance"}]`（`65676-65684` / `65686-65693`）。二者都只是 `z$`（`65459`）的薄包装——`z$` 顺序遍历各层、对每个 key 逐条覆盖（`n[i] = t(o, r.source)`），故**后面的层赢，且合并是 per-key 的**：在 kind 层设 `codex.model` 不会动到 global 层的 `claude.model`。取值侧是两个一行函数 `Mw`（`65508`）= `config?.runtimeModels?.[runtime]` 与 `jw`（`65512`）= `config?.runtimeEfforts?.[runtime]`，返回 `{model|effort, source}`——`source` 就是"这个值由哪一层决定"，即 `/model` 现在能报出层名的原始出处。

**校验一松一紧，是两种不同的产品判断（confirmed）。** `model_id`（`87985`）只要求 trim 后非空且不含空白（`!/\s/.test(r)`）——model id 是开放宇宙，拒绝未列出的 id 会挡死宿主能触达的任何兼容 endpoint，所以放行，错的 id 留到下一轮真正跑时报错。`effort_level`（`87995`）则严格比对 `Ni = ["low","medium","high","xhigh"]`（`31538`）四值，不中就在命令处直接拒绝并把四个值列进错误信息——四词词表是封闭的，写错必是笔误，而一个静默生效的错误档位会在每一轮被拒却没有任何东西指认是哪行配置导致的。

**⚠️ model 与 effort 的优先级并不同构——上游自己的文档写反了（confirmed，逐行核对）。** 两个解析器就差一行：`OSe`（`70250`）取 `e.jobModel ?? e.sessionModel`，`ASe`（`70263`）取 `e.sessionEffort ?? e.jobEffort`。**顺序是相反的**：模型上 job frontmatter 压过会话自己的 `/model`，力度上会话自己的 `/effort` 压过 job frontmatter。优先级确实在解析器内部裁决、而非调用方预先解析好——同一处调用点（`Bn = OSe({…}), cr = ASe({…})`（`70795-70807`））把两组入参都按未解析的原样传入：`jobModel: n.jobContext?.model` 配 `sessionModel: U.model`，`jobEffort: n.jobContext?.effort` 配 `sessionEffort: U.effort`。因为差异只在 `jobContext` 存在时显形，普通通道会话观察不到它，**只有 job 会话会撞上**。两者都在取不到显式值时才落到配置层（`Mw`/`jw`），并把 `configLayer` 置为该层名；显式值命中时 `configLayer` 为 `undefined`——这正是"`/model` 只在配置层决定时才报层名、存了 `/model` 就直接打印"的实现。而上游 skill 文档 `skills/duoduo-runtime-admin/references/model-defaults.md` 宣称 effort 与 model "the same shape"，并把"会话自己的 `/model`"列为最高优先级——**对 effort 成立，对 model 不成立**。以运行时为准。

**"该跑什么"与"实际跑了什么"是两条独立记录（confirmed）。** 解析结果经 `modelOrigin`/`effortOrigin` 落进 drain 记录（批处理路径 `modelOrigin: Bn.configLayer`（`70812`）/`effortOrigin: cr.configLayer`（`70858`），live streaming 路径 `modelOrigin: it.configLayer`（`71075`）/`effortOrigin: bn.configLayer`（`71163`），均在 `drainSessionMailbox (GSe)`(`70374`) 内）；而真正服务了这一轮的模型由 `DSe`（`70279`）从 usage 里抽出、写成 `last_served_model`（`70959`、`71297`），再经 `createSessionManager (Tgt)`(`83621`) 投影成 `lastServedModel`（`85218`）对外可见。**两者可以合法地不一致**——Codex 上一条已开始的会话会保持它启动时的模型直到 fork，所以新设的默认值要到下次 fork 才显形。这条"记录实际服务的模型、而非被请求的模型"的设计，正是 CHANGELOG 所说"a gateway quietly substituting a model is visible instead of invisible"的落地。

**kind 层为何失效**（confirmed）。kind 描述符按 `event.source.kind` 选，再读 `<kernelDir>/config/<kind>.md`。而 job 的 drain 锚点事件来自 cadence 扫描器（`kind: "cadence"`（`86533`））或 notify 唤醒（`kind: s ?? "route"`（`64401`）），**永远不是 `"job"`**。一个无需插桩的观测症状：每个 job 的 system prompt 里 `## Runtime Context` 渲染出的是 `channel_kind: cadence`（`55101` 读同一个对象的 `channel_kind`）。

**这一层的边界**（confirmed，均为容易踩的反直觉点）：

- `allowedTools` 只自动批准权限、**不能扩面**——它与决定工具面的 `tools` 来自互不相交的两个源（`t?.allowedTools` 与 `t?.claudeTools`（`70341-70345`）），SDK 选项构造处还会显式检出并告警（`Ihe`(`54945`) 挑出 `allowedTools` 里不在工具面上的项，`createAgentSdkAdapter (Ef)`(`55239-55240`) 处打 warn）。真正加内建工具的是 `claude.tools`（工具参数里叫 `extra_tools`（`63764`），handler 改名成 `claudeTools: r.extra_tools`（`63851`））。
- 四个列表键对 daemon 自带基线是**并集**，所以 job 无法移除 daemon 自带 aladuo 工具的自动批准，也无法去掉 memory 目录。基线本身按 origin 分档（`w.origin === "system" ? [] : [s_e, y_e]`（`84183`），confirmed）：`ViewSessions`(`g_e`) 与 `Notify`(`V_e`) **任何 origin 都有**；`ManageJob`(`s_e`) 与 `RemindDuoduo`(`y_e`) 对 `origin==="system"` 不给，其余给；`origin==="channel"` 再追加 `QueueOutboundAttachment`(`wke`（`73317`）) 与 `Skip`(`cc`（`54716`）)。
- **v0.8.2 工具面三处改名与缩权（confirmed）**：`Wake` → `RemindDuoduo`（`Ew`/`y_e`（`64335`）），`ManageSession` → `ViewSessions`（`kw`/`g_e`（`64286`））；**`ManageJob` 的 action 枚举收缩为 `create|list|read`（`64022`）**，`archive`/`interrupt`/`reschedule` 三个动作被移出工具面、下放到 shell（详见 §8 CLI 侧 `duoduo job`）。缩权不是静默的：daemon 内置了两段专门的拒绝文案，`yat`(`64069`) 解释"创建作业属于前台会话或 keepalive 作业，你是执行者不是调度者，要再跑一次请用 RemindDuoduo"，`vat`(`64072`) 直接说 `ManageJob has no 'reschedule' action.` 并给出两条替代路径。改名对 Codex 会话不是立刻生效——工具名随会话进程的工具表下发，需 `/reset` 后才看到新名（未证实推测：该结论出自上游 changelog，bundle 内未见对应分支）。
- 同一个 MCP 工具同时写进 `allowedTools` 和 `disallowedTools`，静默判为 ALLOWED（`i?.filter(l => !o.has(l))`（`70344`）），无提示。
- 非法 `prompt_mode` 值被静默丢弃而非拒绝（`wb`（`35036`）返回 undefined，`o && (s.prompt_mode = o)`（`61245`）仅在有值时回填）——打错字的 job 会安静地带着 preset 跑。
- **给 job 设 `additionalDirectories` 会反向打开 additional-directory 的 CLAUDE.md 自动加载**：抑制逻辑 `$Se`（`70234-70238`）只在「runtime 为 `claude` + 广播板正文非空 + `additionalDirectories` 每一项都规范化到 `memoryDir`」三条同时成立时才返回 `false`；job 一旦自己加一个目录，`some(...)` 分支返回 `undefined`，`CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`（`55254`）对整个列表生效，**包括 memory 目录**——而 memory 目录的 `CLAUDE.md` 正是已作为 system-prompt 第 4 层注入的广播板（`renderPromptLayers (Ahe)`(`55104-55113`) 把它装配成局部变量 `l`，函数末尾 `[o, s, a, l, u, c]` 的层序即「基座提示 / kind_prompt / instance_prompt / **广播板** / Runtime Context / Job Mission」；板正文外还套一层与 Claude Code 同款的 "Codebase and user instructions are shown below…" 前言 `khe`(`55523`)）。防重复注入的守卫被这条路径绕开。
- `prompt_mode` 在 codex 上无效（claude/grok/pi 均消费它）：建作业时 `ManageJob` handler 对 `runtime === "codex"` 硬拒（`lg`(`63829`)，文案 `Kst`(`63959`)）；运行期另有软警告 `[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert`（`84064`）。硬拒判的是**解析后的** runtime：`let s = r.runtime ?? t.callerRuntime ?? Co()`（`63819`），而 `r.runtime` 在 zod 层已带默认值——`ManageJob` 的 runtime 枚举 v0.7.1 起**按当前可用运行时动态构造**（`dat`（`daemon.pretty.js:63768-63771`）：claude/codex/grok 逐一探测 push、pi 无条件追加），默认取本会话已有 runtime、否则取 `t[0]`（`d_e`（`63779`））。所以即便调用方省略 runtime、默认值落到 `"codex"`，`s === "codex"`（`63829`）照样拒绝。`createJob` 也总拿到解析后的 `runtime: s`（`63842`），序列化时 `e.runtime && n.push`（`61259`）只要非空就写出 `runtime:` 行，经 `ManageJob` 建出的 job 文件因此总带显式 runtime（confirmed）。软警告覆盖的是绕过该工具的路径：手改 job 文件、在 frontmatter 里写 `prompt_mode`，且 runtime 显式为 codex 或缺省并由宿主默认值解析成 codex（`He = Pn ?? Co()`（`84062`））。
- JSON-RPC 的 `job.create` **没有**这 5 个键：参数校验 `J0`(`31671`) 只认 `{id, cron, instruction, owner_session?, cwd_rel?}`，处理器 `Ayt`(`90863-90868`) 也只把 `{cron, owner_session, cwd_rel, runtime}` 交给 `createJob`（`runtime` 不来自入参，是 `Co`(`31733`) 读宿主默认值补上的）。SDK 配置只能经 `ManageJob` 工具或手改文件设置。

---
## §2 Turn/Drain 循环与 SDK

Turn/Drain 把离散用户消息重写为"带合并窗口的邮箱批 + 单一长驻流式 SDK 会话"：一次 drain 只在可合并谓词允许的**前导窗口**上发一次 query，靠 **单 turn 准入门控、PostToolUse additionalContext 注入、三态抢占边界、hold-stdin** 四条控制线，在不重开对话的前提下实现 turn 合并、mid-turn steering、后台 subagent 续跑与优雅抢占。下面四个论点自上而下拆解这句话：先是"离散消息如何被循环切成批"，再是"一个批如何变成一次 SDK query"，然后是"长驻会话上四条控制线如何不重开对话地续接后到消息"，最后是"失败如何收敛"。

### 论点一：循环层是 `U`，不是 `drainSessionMailbox (GSe)`——一次 drain 只吃"一个前导可合并窗口"

**所以呢**：理解"多条消息为什么被分多次 turn 消费"的关键，是把"循环"与"单批处理器"分层。`drainSessionMailbox (GSe)` 不是 drain 循环，它是每次迭代被调用一次的**单批处理器**；真正的循环是 `U`（`createSessionManager (Tgt)` 内的局部函数，无导出名）。`xH` 即 `batchDrainItems`（切合并窗口）。一次 `GSe` 只从 mailbox 顶部切出**一个**可合并窗口（单 batch），窗口边界外的事件留给 `U` 的下一次迭代——所以"离散消息 → 若干 turn"是靠循环反复调用、而非一次合并成多批实现的。

- **drain 循环本体 = `U`，即 `createSessionManager (Tgt)`（`84000`）内的局部函数，再抽循环 `for (; w.status !== "ended" && J;)`（`84116`）**。`drainPromise` 被赋值为 `U(K)`（或先跑 preStart 的 `.then(() => U(K))`）：`K.drainPromise = U(K)`（`83997`/`83998`）；状态字面量里的 `drainPromise: null`（`83947`）只是字段声明，不是"进入循环"。`GSe` 在循环体内每次迭代调用一次（调用点 `GSe`（`84510`））。
- **`drainSessionMailbox (GSe)`（`70374`）单批骨架**：`mailbox_merge`：`fR`（`70474`）→ `mailbox_parse`：`lb`（`70485`）→ `mailbox_render`：`pR`（`70506`）→ `xH`（`70510`）切窗口。选项键在 `GSe` 内读作 `n.batchSize ?? bH`（`70507`）、`n.mergeWindowMs ?? vH`（`70508`），默认 5 与 180000ms（`bH = 5, vH = 180 * 1e3`，声明见 `vH`（`72621`）），传入 `xH` 时命名为 `fallbackBatchSize`/`mergeWindowMs`（`70511-70512`）。
- **`batchDrainItems (xH)`(`71801-71837`) 只返回单一 batch**：顺序累积 items 到数组 `i`，遇 `i.length >= u()`（`71813`）（`u` 对 notify 批返回 `Number.POSITIVE_INFINITY`，否则返回 `n.fallbackBatchSize`（`71811`））/ notify-homogeneity 变化 `zSe(c) !== a`（`71820`）/ `Math.abs(f - o) > n.mergeWindowMs`（`71830`）三者之一就 `break`，剩余事件留给下一次 `U` 迭代。**"不同目标"不是 `xH` 的 break 条件**，它由下一条讲的可合并谓词裁决。随后 `GSe` 把该单一 batch 解析成事件列表 `yt`，再用可合并门 `sft(yt, t)`（`70770`）决定走向：合并成立 → **`wH`（`70771`）一次 + `VSe`（`70843`）一次**发一次 query；否则 `for (let ae of yt)` 逐事件遍历 `yt`（`70991`）各自 `VSe`（`71148`）——"每个可合并批发一次 query"成立，但"一次 `xH` = 若干 batch"不成立。
- **真正的合并门是可合并谓词，比 mergeWindowMs 更决定性**：`sft`（`71856`）/`aft`（`71860`）/`tke`（`71868`）/`nke`（`71874`）/`lft`（`71903`）——`sft`：`e.length < 2` 不合并；全 `channel.message` 批走 `aft`（要求无 `/` 斜杠命令）再 `tke`，全 notify 批（`nke`）走 `tke`；`tke` 对批内每项求一个 `lft` 键，所有键相同（`n.size === 1`（`71871`））才合并。键由三段拼成 `${r}|${i.join(",")}|${cft(t)}`（`71908`）：主目标会话 `primaryTargetSessionKey`、fanout 目标列表、来源通道标识（`cft`（`71911`）：route 事件取 `payload.channel_descriptor_id`（`71913`），否则取 `source.channel_id`，rpc/ws 缺 channel_id 时记 `<legacy>`）。所以同一主目标只是合并的必要条件，不是充分条件：fanout 集合或来源通道不同的事件照样逐个发 query（confirmed）。telemetry `sdk_start` 携带 `coalesced: yt.length > 1`（`70830`）。

### 论点二：SDK 适配层把 duoduo run-config 诚实翻译成一次 `query()`

**所以呢**：一个 batch 变成一次 SDK 调用，中间隔着一层把内部 run-config 翻成 SDK options 的适配器 `createAgentSdkAdapter (Ef)`。这一层的分支（systemPrompt / permissionMode / thinking）直接决定"发出去的 prompt 长什么样、缓存能不能吃满",错一个分支就打偏。

- **query 本体**：从 `"@anthropic-ai/claude-agent-sdk"`（`54943`）导入。两种执行通道：非流式 `run`(`55272`)与流式 `createStreamingQuery`（`55504`，`includePartialMessages:!0`）。
- **`permissionMode` 优先级（v0.6 已改为无条件兜底）**：`t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`55220`）。v0.5.8 曾把兜底做成"仅 host 模式才 `bypassPermissions`（`Ho(process.env)==="host"`）、否则 `void 0`"；v0.6.1 去掉了 host 条件判定，**最终兜底无条件落到 `bypassPermissions`**。
- **`systemPrompt` 分支**（confirmed，v0.8.1 复核）：**仅当未设 `SYSTEM_PROMPT` 且存在 append 内容时**才用 `{type:"preset", preset:"claude_code", append:f}`（三元 `u && f ? r.systemPrompt`（`55228-55234`），preset 字面量 `preset: "claude_code"`（`55232`））；一旦 `SYSTEM_PROMPT` 有值就走裸字符串——两者都有取 `SYSTEM_PROMPT + "\n\n" + append`，只有 `SYSTEM_PROMPT` 则原样，都不走 preset。append 组装 `f = [Xv(), l].filter(p => !!p).join`（`55225`），即 `resolveMetaPromptText (Xv)`（`55069`，duoduo 基座提示，依次尝试 `ALADUO_META_PROMPT_PATH` 与 `<ALADUO_BOOTSTRAP_DIR>/meta-prompt.md`）拼 `APPEND_SYSTEM_PROMPT`。
- **工具集（v0.5.10 已由 denylist 改为 allowlist）**：`allowedTools`/`mcpServers`/`additionalDirectories` 透传；`tools` 取 `[...new Set(t.tools)]`（`55237`）作为**显式内建工具面**。`disallowedTools` 经 `splitDisallowedToolsForClaude (The)`（`54950`）拆成 `{mcpTools, builtIns}`，**只保留 `mcpTools` 作为 disallowedTools，builtIns 被忽略并告警**（告警 `disallowedTools no longer governs built-in tools (allowlist-only via claude.tools)`（`55248`））；`allowedTools` 里不在工具面上的项由 `Ihe`(`54945`)挑出并告警。旧的 `DEFAULT_DISALLOWED_TOOLS` denylist 已退役。
- **thinking 开关**：`includePartialMessages` 触发时只置 `n?.includePartialMessages && (r.includePartialMessages = !0)`（`55256`）；v0.5.8 里"强制 `maxThinkingTokens=0`"的分支已移除——适配器不再改写 thinking 预算（`maxThinkingTokens` 在 daemon 内仅剩错误提示串里出现，见论点四）。
- **适配器选择 `$e(w)`，即 `createSessionManager (Tgt)`（`83790`）内的局部函数**：runtime 不是 `claude` → 取 actor 的单一 `w.adapter` 字段（codex/grok/pi 共用），未构造时返回一个 `run` 抛 `${w.runtime} runtime selected but its adapter was not built` 的替身，失败关闭而不回落 Claude；runtime 是 `claude` 且 `origin!=="channel"` 或无 `createStreamingQuery` → 一次性适配器 `s`；否则惰性长驻 `streamingAdapter`（经 `x(w, P)` 创建）。

### 论点三：长驻流式会话上，单 turn 准入 + steering lane 不重开对话地续接后到消息

**所以呢**：这是本节最独特处。同一 session 复用同一个长驻 `query()` 进程，输入由队列驱动的 async generator 逐块喂入；于是"合并、steer、抢占、后台续跑"全部被实现为对这条长驻输入流的操控，而非新开对话。**v0.6.1 的关键变化：流式槽一次只准入一个对话 turn，后到消息不再折进正在跑的 turn，而是走显式 steering lane（`pendingSteer`）**——这修掉了旧版"后到消息折进 accepted turn 导致会话可能永久 busy"的隐患。四条控制线各管一件事：

**(a) sessionId 粘连 + 配置指纹重建——复用的边界。** 复用现有 `streamingState` 的条件（`o0e`（`82892`）内的装配局部函数 `a`，条件在 `configSignature`（`82968`））：`streamingState && !closed && !needsRecreation && configSignature===p && (hasAcceptedTurn || initialSessionId===m)`。指纹经 `dJ`（`82581-82597`）= `JSON.stringify({cwd, settingSources, persistSession, permissionMode, allowedTools, disallowedTools, tools, additionalDirectories, autoloadAdditionalDirectoryClaudeMd, [CA]:模型上下文档位, [GEe]:显式来源模型})`（v0.6.1 新增 `tools` 键随 allowlist 化；v0.8 末尾再追加这两个计算键名 `[CA]: t, [GEe]: r`（`82594-82595`），其中 `GEe` 仅在 `claudeContextRequirement.modelOrigin !== undefined` 时取到模型名、否则为 `null`）。**配置指纹变化就重建**：复用失败先按 `configSignature!==p` / `needsRecreation` / resume-sessionid-change 三分支打 `[kv-cache] respawn:`（`82972-82988`）审计日志，再 await `Zf`（`82990`）关旧 query + abort + await loopPromise → 重新 `createStreamingQuery`。输入生成器（`o0e`（`83024`）内的 `async function* S`）由队列类 `MA`（`82736`，`items/waiters/enqueue/dequeue/drain`）驱动；turn 项由 `createSessionManager (Tgt)`（`83804`）入列（含 `accepted/streamedText/turnStreamedText/toolUseMap/toolBlockIndexMap/skipCalled`；v0.7.1 及更早基线里的 `interruptRequested` 字段在 v0.8.1 已不存在）。

**(b) 单 turn 准入门控——一次只喂一个 turn，后到者走 steering。** 生成器 `S()`（`async function*`，在 streaming 适配器工厂 `o0e`（`82892`）内）每次 `dequeue` 出一个 turn 项 `J` 后先看 `R.currentTurn`：**若槽已被占（`let ee = R.currentTurn`（`83033`）非空且 `ee !== J`），新 turn 直接 `reject`（`"Streaming slot occupied — prompt not yielded; retry after the occupant settles"`（`83038`））**，不再像 v0.5.8 那样把新入列 prompt 灌进正在跑的 turn。占槽成功才 `R.currentTurn = J`、`J.accepted = !1`，随后 `for await (let le of J.input.prompt) yield le`（`83041`）。turn 的 `accepted` 在其 SDK `init` 事件到达时置真（`R.hasAcceptedTurn = !0, N.accepted = !0`（`83415`））——**accepted 只标记"该 turn 的 prompt 已被 SDK 接纳"，不再作为"是否折入新 prompt"的开关**。所以合并已发生的 turn、以及未及入槽的后到消息，都改由 (c) 的 steering 通道处理，`streamingState` 里旧的 `orphanExecuting` 也换成了 `cliTurnTentative`（+ `loopPromise`）。

**(c) mid-turn steering——park 在 admission callback，消费在 PostToolUse hook。** 入队/park 的**决策发生在 admission callback（`w.admissionCallback = async () =>`（`84188`））**，它是与 `GSe` 并行的第二条 SDK 入口：在已有 live streaming turn 时被调用，自己调 `wH`（`84232`）生成 `coalescedPromptText`，再按 runtime 分叉——claude 走"park/append `pendingSteer`"。park 判据 `!!nn && nn.accepted && !nn.skipCalled && !iu && !Cn.isNotifyOnly && !w.liveTurnNotifyOnly && Wt.length > 0`（`84297`，`nn = io.currentTurn`；**v0.6.2 新增 `!skipCalled` 项**，已决定沉默的 turn 不再吸收新入站消息，落空后走 `w.pendingWake = !0, w.wakeResolver?.()`（`84363`）当新 turn 重新 drain）：已有 `pendingSteer` 且 `spawningTurn===ko` 则追加（打印 `"[session-manager] admission callback: appended claude steer"`（`84303`）），否则新 park（打印 `"[session-manager] admission callback: parked claude steer"`（`84355`）），`pendingSteer` 字段在 `let Gt = { steerText: Wt, … }`（`84313-84354`）（`steerText/eventIds/claimedEventIds/enqueueAsNewTurn/spawningTurn/requeueLines/requeueEventIds/processedEventIds/settled`，v0.6.1 新增 `spawningTurn`）。**注入（消费）发生在 PostToolUse hook（matcher `"*"`，`o0e`(`83088-83120`)）**：检查 `pendingSteer` → `settled` + `markDone` → 以 `hookSpecificOutput.additionalContext = X.join("\n\n")`（`83114`）返回给 SDK。**v0.5.8 里独立的 `pendingNotifySteer`（把后台 Agent 完成回调冒泡进当前 turn）已在 v0.6.1 移除**：后台 Agent 完成改由 Claude CLI 原生续写单独负责（completion-owner `"claude-cli"`），duoduo 只把 `task_notification` 记成 WAL-only 生命周期事件，不再制造重复回调 turn。

**(d) 三态抢占边界——`G()` 置标志、`L(y)` 才扳机。** `pendingPreemptBoundary` 为三态 `"accept" | "tool_use" | "tool_result"` + hard/soft 两档强度。设值函数 `G(y,T,j)`（现为顶层 `zS`（`82830`））：query 在时——tool_result 且有活跃工具则置 `pendingPreemptBoundary = "tool_result"`（`82832`）、未 accept 则置 `accept`/`"defer_accept"`（`82834`）、否则立即 `C(y)`；非流式路径另有 tool_use 与 `soft` 软抢占分支（`t === "soft"`（`82836`））。**但 `G()` 只置 pending 标志；真正的 abort 由执行事件闭包 `L(y)`（现为顶层 `pJ`（`82821`）：query 在则 `C(y)` interrupt、否则 `abortController.abort()`）消费**——`onExecutionEvent` 里 tool_use 到达时 `activeToolCalls.set` + 若 `boundary==="tool_use"` 则清标志并 `L(y)`；tool_result 时 `delete` + 若 `boundary==="tool_result" && size===0` 则 `L(y)`（`w.activeToolCalls.size === 0`（`84599`））；accept 边界则在 `init` 处由 `C(y)` 兑现（`u.pendingPreemptBoundary === "accept"`（`83425`））。二者分离正是"deferred preempt 何时兑现"的答案。Codex 路径改走 `turn/steer` RPC（`r.request("turn/steer"`（`62417`）），失败回退（`"[codex] turn/steer failed — falling back to new turn"`（`62423`），`"[session-manager] admission callback: codex turn/steer landed"`（`84268`），`"[session-manager] admission callback: codex steer fell back to redrain"`（`84275`））。

**(e) hold-stdin——后台 subagent 续跑。** drain 传 `holdInputOpenForBackgroundAgents = runtime==="claude" && origin!=="channel"`（`w.runtime === "claude" && w.origin !== "channel"`（`84521`），`GSe`（`70720`）透传）。非流式 `run` 中 `x = t.holdInputOpenForBackgroundAgents === !0`（`55350`），prompt 换成 `Ef`（`55377`）内的生成器 `J()`（`for await ... yield U; await $`）：yield 完 prompt 后 `await $` 让 stdin 不关，后台 subagent 完成回调（in-process MCP）仍可送达。`$` 的 resolve（`C`）走 `A || D && S.size === 0 && (A = !0, L(), C())`（`55364`）——**需同时满足 `D`（已收到 result，`U.type === "result" && (D = !0, B())`（`55486`）置位）与 `S.size===0`**（`S` 增删来自 SDK system 事件 `task_started`/`task_notification`），非仅"后台 task 跑完"。idle 看门狗 `j = fB(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5)`（`55358`），默认 10min，触发打印 `hold-input idle watchdog fired`（`55371`）；另有 abort-close 看门狗 `I = fB(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4)`（`55347`）。

> **Skip 语义在 v0.6.2 从"中断"降为"hook 裁决"**（confirmed）。v0.6.1 里 hook 只记标志，真正结束 turn 的是随后在 `tool_result` 边界调用的 SDK `query.interrupt()`（流式带调试标签 `"anchor-turn skip"`，非流式打 `[claude-sdk] Skip called — interrupting turn (non-streaming)`）——这次中断顺手拆掉了本 turn 内启动的全部后台 task。v0.6.2 让两条路径的 PreToolUse hook 直接**返回** `{continue:!1, stopReason:"The agent intentionally ended this turn silently by calling Skip."}`（流式 `o0e`（`83079-83086`），非流式 `Ef`（`55289-55294`）），interrupt 调用与 `interruptRequested` 字段整条删除；`query.interrupt()` 只剩会话级用途（真实用户打断 / 会话回收，`e.query?.interrupt()`（`82818`））。**后台 worker 能活下来不是因为新增了保护，而是因为杀死它们的那个动作没有了。**
>
> 同时新增 `agent_id` 子代理护栏（`J?.agent_id !== void 0`（`83080`） / `q?.agent_id !== void 0`（`55291`））：`hookInput.agent_id !== void 0` 即认定来自子代理，不再去标记父 turn 的 `skipCalled`——v0.6.1 里子代理调 Skip 会让父 turn 以 `text:undefined, skipped:true` 收尾并抑制 outbox。非流式适配器另把单一粘滞标志拆成三个（`d` 当前 turn、`f` 本 run 曾 skip、`p` 本 run 有产出，`Ef`（`55279-55281`）），且 `d` 在每个 `result` 处复位（`U.type === "result" && (d = !1)`（`55486`）），因此"首个 turn 被 skip"不再抹掉同一次 run 的后续结果与流式文本。
>
> drain 侧未变：codex 补 `r.skipped = !0`（`71792`），`nn.skipped && (Ro.skipped = !0, B = !0)`（`70895`）/`Nr.skipped && (Yf.skipped = !0, B = !0)`（`71202`）后以 `"[runner] Skip called — suppressing outbox"`（`71222`）抑制 outbox。**经 MCP 注册的 Skip 工具（claude 与 grok 共用的 `Kg`（`79900`），`description: lB`（`79972`））名称、描述与输入 schema 跨版本逐字节相同**（`cc = "mcp__aladuo__Skip"`（`54716`））——包括那句"Calling Skip immediately ends this turn"和对 `<skip-rewind>` 的承诺。Codex 看到的是另一份描述：codex dynamic tools `wA`（`80047`）注册 Skip 时用 `description: vhe`（`80128`），而 `vhe = lB.replace("Calling Skip immediately ends this turn.", "After you call Skip, nothing further you produce this turn will be delivered.")`（`54717`），即只把"立即结束本 turn"这一句换成"调用后本 turn 的后续产出不再投递"，其余文字与输入 schema `lC` 相同（confirmed）。所以"逐字节相同"只对 claude/grok 一侧成立；两侧的模型契约除这一句外没动，动的是运行时的执行方式。由此产生一个开放风险，见 §9。

### 论点四：失败面收敛成一条用户可见文本 + 一个 spine 事件

**所以呢**：SDK turn 抛错不会静默丢失或裸露堆栈，而是被产品化成统一格式，既能回给用户又能进事件日志（可被后续 drain 与 usage 复算）。v0.6.0 起 **drain 错误即时上浮**——`handleDrainError` 在 catch 处直接 `throw`，不再滞留到下一 tick。

- **drain-error（`drainSessionMailbox (GSe)`（`70374-71351`）抛出、`handleDrainError (Xw)`（`72231-72286`）处理）**：`GSe` 的两处 SDK `try/catch` 里，取消类错误由 `isAgentSdkTurnInterruptedError (Gv)`（`54960`）→ `isAgentSdkPromptNotAcceptedAbortError (Kv)`（`54964`）→ `isAbortLikeError (Hh)`（`54968`）三个**顺序 `if`**（批处理/admission 路径判定点 `Gv`（`70872`）/`Kv`（`70877`）/`Hh`（`70878`），逐事件流式路径 `Gv`（`71177`）/`Kv`（`71181`）/`Hh`（`71185`））分别走 cancelled 收尾；其余落到 `throw await Xw(..., {stage:"sdk_turn"})`（`70882-70885`），逐事件路径另有 `stage: "sdk_turn"`（`71189-71192`）。`handleDrainError (Xw)` 生成用户文本 `[duoduo:drain-error] agent turn failed at ${n.stage}`（`72234`），后接 `wft(r, n.hintContext)`（`72238`）诊断，并向 spine 追加 `type:"agent.error"`（`72264-72278`）。
- **执行事件桥接**：包装器 `He`（`GSe`（`70745`）内，计数于 `_e.type === "tool_use" ? l += 1`（`70759`））统计 tool_use/tool_result 计数、捕获 `compact_boundary`，喂 drain record 的 `tool_calls`/`tool_errors` 与 `session.compact`，也是 spine `agent.*` 事件的上游。**活体印证**：`spine.tail` 可见 `agent.tool_use`/`agent.tool_result` 从 SDK 适配器路径流出，印证 `YU/Qde` → onExecutionEvent → session.execution/spine 的桥接。
- **开关**：`DISABLE_ADAPTIVE`/`DISABLE_THINKING`/`DISABLE_INTERLEAVED_THINKING`/`MAX_THINKING_TOKENS` 现只出现在诊断提示串构造器 `wft`（`72204-72230`），四条运行时话术都落在同一行 `return r ? o + "The error above came from the Codex backend…`（`72229`）（codex/grok/pi 三支各说一遍"这些旋钮是 Claude-only"，兜底支说"第三方 endpoint 关 thinking"）；daemon 内无读取这些 env 的分支，故 duoduo 自身不消费——但底层 claude 二进制是否透传消费属**未证实推测**。

### 证据表

| 机制主张 | 证据（字面量/代码片段） | 位置 | 置信 |
|---|---|---|---|
| drain 循环本体是 `createSessionManager (Tgt)` 内的局部函数 `U`，`drainSessionMailbox (GSe)` 是循环体内单批处理器 | `K.drainPromise = U(K)`；`for (; w.status !== "ended" && J;)`；循环体内 `Ze = await GSe(t, P, {` 调用点 | `K.drainPromise = U(K)`（`83998`）；`for (; w.status !== "ended" && J;)`（`84116`）；`drainSessionMailbox (GSe)`（`84510`） | confirmed |
| 一次 `drainSessionMailbox (GSe)` 经 `batchDrainItems (xH)` 只切出一个前导可合并窗口（单 batch），余留给下次迭代 | `xH` 顺序累积，遇 batchSize（`i.length >= u()`）/ notify 同质性变化（`zSe(c) !== a`）/ `mergeWindowMs` 三者之一 `break`，`return { items: i, events: r }`；"不同目标"不是 `xH` 的 break 条件，由合并谓词裁决 | `batchDrainItems (xH)`（`70510`）；`batchDrainItems (xH)`（`71801-71837`）；`if (i.length >= u()) break;`（`71813`）；`if (zSe(c) !== a) break;`（`71820`）；`Math.abs(f - o) > n.mergeWindowMs`（`71830`） | confirmed |
| 合并谓词（同目标、无斜杠命令、notify-homogeneous）是合并的真正边界 | `sft`（`length < 2` 拒；全 channel.message 走 `aft`，全 notify 走 `tke`）/`aft`（`r.startsWith("/")` 拒）/`tke`（`lft` 目标键 `n.size === 1`）/`nke`（notify 判定）/`lft`（`primaryTargetSessionKey\|fanoutTargets\|…` 键）；门 `sft(yt, t)` | `sft`（`71856`）、`aft`（`71860`）、`tke`（`71868`）、`nke`（`71874`）、`lft`（`71903`）；`if (sft(yt, t))`（`70770`） | confirmed |
| SDK 调用即 `@anthropic-ai/claude-agent-sdk` 的 `query` | `import { query as She } from "@anthropic-ai/claude-agent-sdk"` | `query as She`（`54942`）；`"@anthropic-ai/claude-agent-sdk"`（`54943`） | confirmed |
| permissionMode 优先级，v0.6 无条件兜底 bypass | `t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（host 条件已移除） | `t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions"`（`55220`） | confirmed |
| systemPrompt：调用方显式值优先；否则仅当未设 SYSTEM_PROMPT 且有 append 才用 preset，其余走裸字符串 | `if (… t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt; else {…}`；`u && f ? … : u ? … : f && (r.systemPrompt = {type:"preset", preset:"claude_code", append:f})`；`f = [Xv(), l].filter(…).join` | `t.systemPrompt !== void 0`（`55221`）；`preset: "claude_code"`（`55232`）；`resolveMetaPromptText (Xv)`（`55225`） | confirmed |
| 工具面已 denylist→allowlist：`tools` 显式面 + `splitDisallowedToolsForClaude` 只留 mcpTools | `let u = [...new Set(t.tools)]`；`{mcpTools: u, builtIns: l} = The(t.disallowedTools)`；builtIns 忽略并告警，`u.length > 0 && (r.disallowedTools = u)` | `let u = [...new Set(t.tools)]`（`55237`）；`splitDisallowedToolsForClaude (The)`（`54950`）；`disallowedTools no longer governs built-in tools`（`55248`） | confirmed |
| includePartialMessages 只置流式旗标，不再改 thinking 预算 | `n?.includePartialMessages && (r.includePartialMessages = !0)`（无 `maxThinkingTokens=0`） | `n?.includePartialMessages && (r.includePartialMessages = !0)`（`55256`） | confirmed |
| 适配器选择 `$e(w)` | `w.runtime !== "claude"` → `w.adapter`（未构造则返回 `run` 即抛错的替身 "refusing to fall through to Claude"，失败关闭）；`w.origin !== "channel" \|\| !s.createStreamingQuery` → 一次性 `s`；否则惰性长驻 `w.streamingAdapter`（经 `x(w, P)` 建） | `$e`（`83790`）；`createSessionManager (Tgt)`（`83790-83821`） | confirmed |
| streamingAdapter sessionId 粘连复用条件 + 指纹重建 | `streamingState && !closed && !needsRecreation && configSignature === p && (hasAcceptedTurn \|\| initialSessionId === m)`；`p = dJ(l, f)` 指纹含 `tools` 与 `[CA]`/`[GEe]`；不符先打 `[kv-cache] respawn:` 再 `await Zf(u, g)` 重建 | `configSignature === p`（`82968`）；`dJ`（`82581-82597`）；`diffStreamingConfigSignature ($A)`（`82973`）；`"[kv-cache] respawn: signature-mismatch"`（`82974`）；`Zf`（`82990`） | confirmed |
| 长驻流式输入靠队列驱动 generator | `o0e` 内 `async function* S(){ … for await (let le of J.input.prompt) yield le }`；队列类 `MA`（`items/waiters/enqueue/…`）；turn 由 `z.queue.enqueue({…})` 入列 | `for await (let le of J.input.prompt) yield le`（`83041`）；`MA`（`82736`）；`createSessionManager (Tgt)`（`83804`） | confirmed |
| **单 turn 准入**：槽已占则 reject 后到 turn，不折进正在跑的 turn；accepted 只标记 SDK 接纳 | `if (ee !== null && ee !== J) … J.reject(new Ir("Streaming slot occupied …"))`（`ee = R.currentTurn`）；`init` 处 `R.hasAcceptedTurn = !0, N.accepted = !0` | `J.reject(new Ir("Streaming slot occupied — prompt not yielded; retry after the occupant settles"))`（`83038`）；`R.hasAcceptedTurn = !0, N.accepted = !0`（`83415`） | confirmed |
| steering 决策在 admission callback（park），消费在 PostToolUse hook（注入） | `wH` 生成 coalescedPromptText；park 判据 `!!nn && nn.accepted && !nn.skipCalled && !iu && !Cn.isNotifyOnly && !w.liveTurnNotifyOnly && Wt.length > 0`；"parked claude steer"；`additionalContext: J.join("\n\n")` | `w.admissionCallback = async () =>`（`84188`）；`wH`（`84232`）；`!!nn && nn.accepted && !nn.skipCalled`（`84297`）；`"[session-manager] admission callback: parked claude steer"`（`84355`）；`additionalContext: J.join`（`83114`） | confirmed |
| notify-steer 路径已移除，后台 Agent 完成单一 owner | `pendingNotifySteer` 在 daemon 中零命中；`completion_owner: "claude-cli"`；`task_notification` recorded WAL-only | `completion_owner: "claude-cli"`（`82919`）；`"[session-manager] task_notification recorded WAL-only"`（`82922`） | confirmed |
| 抢占三态 accept/tool_use/tool_result + hard/soft；`zS()` 置标志、`pJ()` 扳机 abort | `zS(e, t, n, r)` 返回 `"defer_tool_result"`/`"defer_accept"`/`"defer_tool_use"`/`"immediate"`，`t === "soft"` 软抢占分支；`pJ` 在 `onExecutionEvent` 的 `activeToolCalls.set/delete` 边界消费，accept 边界在 `init` 处兑现 | `zS`（`82830`）；`"defer_tool_result"`（`82832`）；`"defer_accept"`（`82834`）；`"defer_tool_use"`（`82836`）；`pJ`（`82821`）；`w.activeToolCalls.set`（`84596`）；`w.activeToolCalls.size === 0`（`84599`）；`u.pendingPreemptBoundary === "accept"`（`83425`） | confirmed |
| Codex 走 turn/steer RPC，失败回退 redrain | `r.request("turn/steer",...)`；"falling back to new turn"；"codex steer fell back to redrain" | `r.request("turn/steer"`（`62417`）；`"[codex] turn/steer failed — falling back to new turn"`（`62423`）；`"[session-manager] admission callback: codex steer fell back to redrain"`（`84275`） | confirmed |
| hold-stdin：`await $`，resolve 需 `D && S.size === 0`，含 idle 看门狗 | `holdInputOpenForBackgroundAgents`；`async function* J(){ … yield U; await $ }` 作为 prompt；`B = () => { A \|\| D && S.size === 0 && (A = !0, L(), C()) }`；`j = fB(…, 6e5)`；"hold-input idle watchdog fired" | `holdInputOpenForBackgroundAgents: w.runtime === "claude" && w.origin !== "channel"`（`84521`）；`prompt: x ? J() : t.prompt`（`55383`）；`A \|\| D && S.size === 0 && (A = !0, L(), C())`（`55364`）；`parsePositiveMsEnv (fB)`（`55358`）；`hold-input idle watchdog fired`（`55371`） | confirmed |
| Skip 以 PreToolUse hook 返回 `{continue:!1, stopReason}` 结束 turn，不再 interrupt（v0.6.2） | `stopReason:"The agent intentionally ended this turn silently by calling Skip."`；`agent_id` 子代理护栏 | `"The agent intentionally ended this turn silently by calling Skip."`（`83084`/`55293`）；`J?.agent_id !== void 0`（`83080`）；`q?.agent_id !== void 0`（`55291`） | confirmed |
| Skip 联动跳过 SDK 结果并抑制 outbox | hook 内 `le.skipCalled = !0`；drain 侧 `nn.skipped && (Ro.skipped = !0, B = !0)` / `Nr.skipped && (Yf.skipped = !0, B = !0)`；"[runner] Skip called — suppressing outbox" | `le.skipCalled = !0`（`83082`）；`nn.skipped && (Ro.skipped = !0, B = !0)`（`70895`）；`Nr.skipped && (Yf.skipped = !0, B = !0)`（`71202`）；`"[runner] Skip called — suppressing outbox"`（`71222`） | confirmed |
| 已 Skip 的 turn 既不消费也不吸收 steer（v0.6.2 新增，上游未声明） | PostToolUse 顶部 `R.currentTurn?.skipCalled === !0 → return {}`；admission park 判据含 `!nn.skipCalled` | `if (R.currentTurn?.skipCalled === !0) return {};`（`83092`）；`!nn.skipCalled`（`84297`） | confirmed |
| drain-error 冒泡为文本回复 + spine 事件（v0.6.0 即时上浮） | `[duoduo:drain-error] agent turn failed at ${n.stage}`；`type: "agent.error"`；`throw await Xw(…, {stage: "sdk_turn"})` | `[duoduo:drain-error] agent turn failed at ${n.stage}`（`72234`）；`type: "agent.error"`（`72265`）；`handleDrainError (Xw)`（`70882`）；`stage: "sdk_turn"`（`70885`/`71192`） | confirmed |
| 执行事件包装器 `He` 统计工具计数 + compact_boundary，喂 drain record/spine | `_e.type === "tool_use" ? l += 1 : … _e.isError && (c += 1)`；`_e.subtype === "compact_boundary"` 捕获 | `He`（`70745`）；`_e.type === "tool_use" ? l += 1`（`70759`）；`_e.subtype === "compact_boundary"`（`70750`） | confirmed |
| drain record 结构与 `usage.get` 聚合字段一致 | `GSe` 写 `{tool_calls, tool_errors, usage, perf, compact, …}`；聚合 `total_drains/total_tool_calls/…/perf.total_sdk_ttft_ms`（例 memory-committer `total_drains=2`） | `appendDrainRecord (Qd)`（`70413`）；`e.total_drains += 1`（`36834`）；`e.perf.total_sdk_ttft_ms`（`36842`）；`S.method === "usage.get"`（`91005`）+ 活体 usage.get | confirmed（静态+活体） |
| DISABLE_*/MAX_THINKING_TOKENS 仅存在于错误提示，非 duoduo 消费 | 全在 `wft` 提示串（含 "Claude-only and have no effect here" 话术）；daemon 内 `process.env.DISABLE_*` 零命中 | `wft`（`72204-72230`）；`DISABLE_ADAPTIVE=1 DISABLE_THINKING=1 DISABLE_INTERLEAVED_THINKING=1 MAX_THINKING_TOKENS=0`（`72229`） | 未证实推测（透传消费未直接证实） |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **session actor 状态**（`status: "active"`（`83940`））：`status, currentAbortController, query, streamAbortController, drainPromise, wakeResolver, pendingWake, liveTurnNotifyOnly, isStreaming, activeToolCalls(Map), pendingPreempt, pendingPreemptBoundary, pendingPreemptReason, pendingClear, holdsPoolSlot, inflightEventIds(Set), admissionInProgress, pendingSteer, admissionCallback, streamingState, streamingAdapter, streamingGeneration, agentNotifiedThisDrain, runtime, adapter, adapterFacts, consecutiveConservativeRedrive`（另有 `idleSince/spawnedAt/lastActivityAt/lastTurnCompletedAt/lastCliTurnSettledAt` 等）。v0.8.2 的三处变化：进行中的工具调用从 `Set` 换成 `activeToolCalls: new Map`（`83952`）；本 drain 是否调过 Notify 的标志叫 `agentNotifiedThisDrain: !1`（`83971`）；codex/grok/pi 三个非 claude 后端共用单一的 `adapter: z?.adapter ?? null`（`83973`）加构造指纹 `adapterFacts: z?.adapterFacts`（`83974`），不再按后端各设一个字段。无独立 `pendingNotifySteer` 字段。
- **streamingState**（`R = { queue: _, … }`（`83005-83020`））：`queue, abortController, configSignature, initialSessionId, hasAcceptedTurn, needsRecreation, closed, currentTurn, loopPromise, cliTurnTentative, spawnMaxContextToken, spawnDeliveryToken, liveModel, lastAppliedEffort`——后四个依次记录本条长驻流创建时解析出的 context 上限 token、delivery token、`liveModel`（创建时取 `l.model`）与最近一次应用的 effort（`spawnMaxContextToken: y`（`83016`）起）。
- **turn/queue 项**（入列点 `createSessionManager (Tgt)`(`83805-83817`)）：`input, resolve, reject, accepted, sessionId, text, structured, usage, streamedText, turnStreamedText, toolUseMap, toolBlockIndexMap, skipCalled`。（v0.6.2 随 Skip 改为 hook 裁决，移除了 `interruptRequested`。）
- **pendingSteer**（`let Gt = { steerText: Wt, … }`（`84313-84354`））：`steerText, eventIds, claimedEventIds, enqueueAsNewTurn, spawningTurn, requeueLines, requeueEventIds, processedEventIds, settled`。
- **drain record**（`appendDrainRecord (Qd)`（`36748`）追加到 `drainRecordPath (za)`（`36745`）；活体经 `usage.get` 按 session 聚合印证）：`id, session_key, sdk_session_id, drain_started_at, drain_duration_ms, sdk_duration_ms, events_processed, events_skipped, tool_calls, tool_errors, output_chars, cancelled, usage{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens,total_cost_usd,protocol,model,context_used_tokens}, perf{mailbox_merge_ms,...,sdk_ttft_ms_total,sdk_ttft_samples}, compact, suspected_in_process_break`。
- **SDK options**（`createAgentSdkAdapter (Ef)`（`55214`）的内层构建器 `e(t,n)`）：`resume, abortController, cwd, settingSources, persistSession, outputFormat, model, effort, permissionMode, systemPrompt, allowedTools, tools, disallowedTools, mcpServers, additionalDirectories, env, pathToClaudeCodeExecutable, hooks, includePartialMessages`。
- **内建 hooks**：三个 hook 同属一个字面量块，整块在 `o0e`(`83067-83121`)——即长驻流式 query 的 options 里，不是散落各处。PreToolUse matcher `"*"` 记 `transcript_path`（`o0e`(`83069-83076`)，同样用 `agent_id === void 0` 判定是否主 agent）；matcher 为 `cc`(`54716`)（即 `mcp__aladuo__Skip`）的 Skip hook 带 `agent_id` 子代理护栏并**返回** `{continue:!1, stopReason:…}`（`o0e`(`83078-83086`)）。PostToolUse matcher `"*"` 做 steer 注入（`o0e`(`83088-83120`)），v0.6.2 在其顶部新增两个提前返回：`currentTurn?.skipCalled === !0` 或 `cliTurnTentative?.skipObserved === !0` 时直接 `return {}`（`o0e`(`83092-83093`)），即**已 Skip 的 turn 不再消费 `pendingSteer`**——v0.6.1 会把 park 中的插话 markDone 并注入一个即将被丢弃的 turn，插话就此消失。（v0.5.8 里"PreToolUse matcher `Bash` 拦截 `run_in_background`"的 hook 自 v0.6.1 已不存在。）

### 给 Agent PM 的洞察

> 1. **"turn ≠ 消息"是这套设计的中心一步，且分层要看清。** 循环层 `Se` 反复调用单批处理器 `GSe`，每次只吃一个"可合并谓词允许的前导窗口"（同目标、无斜杠命令、mergeWindow 内）。这天然做了输入去抖/合并、降低 query 次数与 cache miss，代价是单条消息延迟受窗口影响。PM 要把"消息""batch""turn"三层解耦：一次 drain 迭代 = 一个 batch = 一次（可合并批）query，多条消息可能跨多次迭代分成多个 turn。
>
> 2. **v0.6.1 改成"单 turn 准入 + steering lane"——后到消息不再折进正在跑的 turn。** 流式槽一次只准入一个对话 turn（槽占则 reject：`"Streaming slot occupied — prompt not yielded; retry after the occupant settles"`（`83038`）），后到消息由 admission callback 决策、park 成 `pendingSteer`，再由 SDK 的 PostToolUse `additionalContext`（`83114`）在工具边界注入正在跑的 turn。这既保住工具执行原子性又实现"边跑边追加",还消除了旧版"折入 accepted turn 致会话永久 busy"的隐患。这是把 agent-sdk 的 hook 能力当控制面用的巧思，可直接借鉴。
>
> 3. **长驻 streamingQuery + configSignature 粘连是延迟/成本优化的核心，但抢占是"置标志/扳机"两段式。** 同会话同配置复用一个 query 进程避免冷启动与重放；指纹（cwd/permissionMode/allowedTools/**tools** 等）一变就 `W(y)` 强制重建。抢占用 `G()` 置三态边界标志、执行事件闭包 `L(y)` 在对应工具边界才真正 abort——deferred preempt 的兑现时机取决于 `activeToolCalls` 何时清空。PM 应尽量稳定单会话工具集/权限。
>
> 4. **背景 subagent 靠"hold stdin + `$ && R.size===0` 双条件 + idle 看门狗"续跑，且完成语义已收敛为单一 owner。** stdin 保活的释放需**同时**满足"已收到 result"与"追踪的后台 task 全部完成"，非仅后者；超过默认 10 分钟静默会 force-release，牺牲 in-process MCP 回调。v0.6.1 把"后台 Agent 完成说进对话"的权限收敛给 Claude CLI 原生续写（completion-owner），duoduo 只记 WAL 生命周期事件、不再制造重复回调 turn——长任务应走独立 job 而非 background Agent。
>
> 5. **失败面产品化收敛，且 v0.6.0 起即时上浮。** drain-error 统一为 `[duoduo:drain-error]` 文本 + `agent.error` spine 事件（可被 usage/后续 drain 复算），并内置"关 thinking"诊断话术；错误在 catch 处直接 `throw`，不再滞留到下一 tick。注意 `DISABLE_*`/`MAX_THINKING_TOKENS` 在 daemon 内仅出现在 `wft` 错误提示串（且被标注为 Claude-only），是否真正透传消费属未证实推测——对多模型/第三方 endpoint，thinking 线协议不兼容是头号坑，值得产品层预置开关与提示。


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

- **key 格式与派生**：`session_key = <scope>:<name>:<hash(workspaceAbsPath)>`，由 `yUe` 拼装：`` `${t}:${n}:${IUe(r)}` ``，其中 `r=j1(e.workspaceAbsPath)`、`IUe` 为 hash（`sha256(...).slice(0,12)`）、`n=Eie(e.readableName)` 归一化名段，`fie` 注入 `scope:"stdio"`。活体 `system.status` 返回 `stdio:default:28d3ca682f86` 逐段印证。**confirmed**。
- **前缀 → plane / kind**：kind 由 `lr`（`64076`）前缀分类（`meta:/cadence:→meta`、`subconscious:→subconscious`、`system:→system`、`job:→job`，否则 `channel`）；plane 由 `Ift(e)`（`72359-72360`：`system:/meta:/cadence:→system`，否则 `work`）。**confirmed**。
- **一 key 一 actor**：注册表 `let B = new Map`（`83745`），`N`（`83931`）负责生成 actor，`actorRunId: V=++ee`（`83934-83937`）单调自增，`B.set(w, K)`（`83977`）。活体 `system.status` 只有单一 actor（status=`idle`），印证"至多一个"。**confirmed**。
- **kind 的第二真值来源**：actor 新建函数 `N`（`83931`，在 `createSessionManager (Tgt)` 内）调 `OR(t, {...})`（声明 `OR`@`35474`）把 `display_name/kind` upsert 进 meta.md（调用点 `OR`@`83981`），此处 `kind` 从 **origin** 二次派生（`origin==="job"?"job":origin==="system"?"system":startsWith("meta:")?"meta":"channel"`（`83984`））——与 `qr` 的前缀派生**并存**，是 kind 的另一条真值来源。**confirmed**。

---

### 论点 2 · 两层锁分工：进程写锁保运维健壮性，`hi` 异步互斥保数据一致性

**所以呢**："lease lock"在代码里其实是**两把互不相干的锁**，各解决一个问题，绝不能混谈：一把跨重启防"同目录多 daemon 写者"（运维），一把按 key 串行防"同会话并发写状态"（数据）。

- **进程级 runtime 写锁**——保证同一 runtime_dir 只有一个 daemon 写者。锁文件 `run/locks/daemon-writer.json`（路径由 `c6`@`88807`），记 `{runtime_dir, pid, boot_id, started_at, last_heartbeat_at}`。`start()` 内 `$=await f6(u); if(!$.acquired) throw new Error(…Runtime lock already held by pid=${...}…)`（`91394-91395`）；心跳 `setInterval(()=>eve(u)…,C)`、`C=T0e("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS",3e4,1e3)`（`91439-91442`）。夺锁前 `zut`@`88842` 判 stale，逐字符为：
  ```
  Number.isNaN(r) || t.getTime() - r > n || e.boot_id && e.boot_id !== Qbe() || !Lut(e.pid)
  ```
  （`zut`@`88844`）即心跳超 TTL（`ttlMs??12e4`（`88857`）=120s，`f6` 内）、**`boot_id` 存在且不符**（重启；`e.boot_id &&` 是空值守卫，boot_id 缺失时不据此判 stale）、或 `Lut`=`process.kill(e, 0)`（`88814`）探测进程已死，则视为可抢占。`boot_id` 取 `/proc/sys/kernel/random/boot_id` + macOS `sysctl kern.boottime` + uptime 兜底（`Fut`@`88821`；当前值 getter `Qbe`@`88838`）。活体 `system.config`：`heartbeat_ms=30000`、`runtime_lock_heartbeat_ms=30000`。**confirmed**。
- **会话级异步互斥 `Bi(session_key, fn)`**（`Bi`@`32410`）——`uR: Map<key, 尾Promise>`（声明 `uR`@`32440`），把该 key 的所有状态变更闭包串成链：`i=uR.get(e)??Promise.resolve()` → `uR.set(e,r)` → `await i` → finally `n(); uR.get(e)===r&&uR.delete(e)`（逐字符匹配）。state.json/meta 写、mailbox merge、outbox cursor 全按 key 串行。调用点已全验（全仓 10 处调用）：`Xs`@`32548`（mailbox 追加，`zl(t)`+锁串接）、`OR` 内 `Bi`（`35484`，meta upsert）、`ile` 内 `Bi`（`35517`，display_name 改写）、`rt`/`Kd`/`No` 内 `Bi`（`35567`）、`Bi`（`35603`）、`Bi`（`35639`）（runtime-state patch/mutate/字段清除，锁内先 `Ks` 判 tombstone）、归档流程 `Gbe` 内 `Bi`（`65875`）与 `Kbe` 内 `Bi`（`65894`）、`b_e`@`64500`（delivery-cursor，含 `[delivery-cursor] skip cursor write: session archived (tombstoned)`）、`createDaemon (Ayt)`（`90461`，daemon 主体内 sessionIndex 刷新）。配合"一 key 一 actor"形成双保险。**confirmed**。

---

### 论点 3 · 池与生命周期：双有界可让出池 + active/idle/ended，让槽回收而前台钉活

**所以呢**：并发用"双有界池 + 可让出的池槽"而非固定线程——channel/job 分池，后台批处理饿不死前台；执行槽（占用 vs 让出）与会话存活（actor 是否回收）被**解耦**：idle 主动让槽却仍可被前台附着钉住不死，容量因而在会话间自由流动。

- **双有界池 channel=10 / job=6**：池对象 `C`(channel)、`$`(job)，各持 `{name, activeCount, maxConcurrent, wakeQueue}`（`83676-83687`）；`D=e.maxConcurrentChannel??e.maxConcurrent??10`、`A=e.maxConcurrentJob??6`（`83674-83675`）；`j`（`83689`）按 origin 选池。actor 创建时抢槽 `fe=j(w,K.origin); fe.activeCount++, K.holdsPoolSlot=!0`（`83978-83979`）；超限入队 `K.wakeQueue.push(w)`（`83912`，`se` 内）。活体 `system.config`：`max_concurrent_channel=10, max_concurrent_job=6`（`89133-89134`）。**confirmed**。
- **三态 active → idle → ended**：idle 分支 `w.status = "idle"`（`84709`）、`w.status = "ended"`（`84818`/`84820`）均已亲见。**confirmed**。
- **idle 让槽 + `Ht`→`st`→`mJ`(idle_ms) 等待 + 前台钉活**：drain 空转后 `released pool slot (idle)`（`pt.activeCount--, w.holdsPoolSlot = !1`（`84722`）），进 `mJ`（`84741`）等待——`e.wakeResolver=()=>{i(),n(!0)}` 与 `setTimeout(()=>{i(),n(!1)},t)`（`82865-82869`）**竞争**（`i()` 为共用清理）。超时且无附着→`idle timeout, no attachments, exiting`（`84764`）退 ended；**有附着则继续等**→`idle timeout with attachments, reclaiming runtime processes`（`84746`，拆运行时子进程后 `continue` 继续等，见论点 5），前台通道把 actor 钉住不回收；被唤醒→重抢槽（pool-full→`wakeQueue.unshift`，否则 `activeCount++`（`84774-84789`））。`idle_ms` 源：`idleTimeoutMs:i=36e5`（`83626`）、config `ALADUO_SESSION_IDLE_MS`（`89135`）、注入 `idleTimeoutMs: Number(process.env.ALADUO_SESSION_IDLE_MS ?? 36e5)`（`91529`）。活体 `idle_ms=3600000`，stdio 会话正处 idle。**confirmed**。
- **dequeue 原地复用 `L()`**：出队唤醒时若目标是"idle 且无池槽且有 drainPromise"的 actor，走 `pendingWake+wakeResolver` **原地唤醒**而非新建 `N()`，随后 `return`；池重满则 `unshift` 回队首（`dequeue deferred: pool re-filled`（`83727`））；否则回落 `N(z, ZW(z)??…)`。出队函数 `L`（`83697`）、原地复用体 `resuming idle actor from dequeue`（`83718-83725`）。**confirmed**。
- **重启 actor 的 origin 从何而来（"重抢槽"闭环的落池决策）**：出队函数 `L`（`83697`）与唤醒函数 `se`（`83825`）回落新建时都先算 `ZW(key)`，推断出 origin 就走 `N(key, origin)`，否则 `N(key)`——`ZW`（`80229`，两处调用点：`L` 内 `ZW`@`83741`、`se` 内 `ZW`@`83922`）按 `job:`/`meta:`/`cadence:`/`system:` 前缀推断被出队/唤醒 actor 应落 channel 还是 job 池，是"重抢槽"闭环里决定池归属的关键；真正的选池谓词是 `j`（`83689`）里的 `bEe(key,origin)==="job"?jobPool:channelPool`（定义 `bEe`@`80241`）。**confirmed（机制），origin 推断细节为静态阅读**。
- **续写决策的指纹守卫解耦 board 层**（v0.6.1 新增）：指令指纹 `computeInstructionsFingerprint (LS)`（`82330`）覆盖 `[identity,kindPrompt,instancePrompt,memoryBoard,mission]`（有 `missionAcceptance` 时再追加这一项）；新增 `computeNonBoardInstructionsFingerprint (lJ)`（`82339`）= `LS({...e, memoryBoard: void 0})`，**排除 board 层**——board 内容变动不再触发指令指纹判定"指令已变"，把易变的广播 board 与稳定的指令层解耦（board 层单独由 `computeBoardLayerHash (uJ)`（`82335`）哈希）。**confirmed**。

---

### 论点 4 · 唤醒 / 抢占 / 隔离：单 turn 准入 + 显式 steering 通道，硬前缀隔离，收尾再校验

**所以呢**：有状态 agent 的"打断 / 续写"不是硬 kill，也不再把后到消息折进正在跑的 turn 里——v0.6.1 改成**一次只准入一个对话 turn**（single-turn admission），后到的输入走一条**显式 steering 通道**（`pendingSteer` 会话状态）：能就地插话就 mid-turn 注入，不能就 park/requeue 回 inbox 由下一个 turn 处理；要真打断也只在工具调用边界。同时用前缀白名单挡住越权唤醒，用一次性布尔上限防收尾自旋。这几点合起来保证"续写不损坏状态、后到不导致会话永久 busy、隔离不被绕过、结束不空转"。

- **唤醒与抢占 `Ne`→`Ue`/`N`→`G`（现为 `se`→`zS`）**：`se`（`83825`）默认 `z=P?.preempt??"allow"`（`83838`）；归档会话 wake 被抑制（`or(w)`→`wake suppressed, session is being archived`（`83832-83833`））；idle actor 直接 `V.wakeResolver()`（`83847`）。`zS`（`82830`）在 `tool_use/tool_result/accept` 边界延迟中断，`t==="soft"` 分支存在，返回 `defer_*/immediate/noop`；`force→zS(V,"immediate",F,"preempt")`（`83867-83868`）、`allow→zS(V,"soft",F,"preempt")`（`83883-83884`）。**confirmed**。
- **preempt 档位映射 `_2`→`JB`→`SJ`**（`SJ`@`89187`）：`!t||!t.startsWith("/")?"allow":t.split(/\s+/,1)[0]?.toLowerCase()==="/cancel"?"force":"never"`（`89189`，逐字符匹配）——普通消息→`allow`、首词 `/cancel`→`force`、其它斜杠命令→`never`。`allow` 在内部派生为 `soft` 模式（非外部档位）。ingress 处 `emit("session.wake",{...,preempt:SJ(k.text)})`（`90720-90723`）即以此映射注入 preempt。**confirmed**。
- **单 turn 准入 + steering lane = idle 之外的第二条低延迟续接**：`Ue` 内仅当 `j==="allow"&&(ct||Ne)&&M.admissionCallback&&!M.admissionInProgress` 时（`ct`=Claude 当前 turn 已 accepted、`Ne`=Codex 有 activeTurn）把新批次交给 **admission callback** 处理（`admitting to live streaming session`（`83856`）），无需打断亦无需 idle 重启；`admissionInProgress` 双端 finally 复位防并发注入（`admissionInProgress = !1`（`83860`/`83862`））。admission callback `w.admissionCallback`（`84188-84370`）走**显式 steering 通道**：Claude 侧把新批**追加进当前 turn 的 steer 文本**（`appended claude steer`（`84303`））或 park 为 `pendingSteer`（`parked claude steer`（`84355`））；非 claude 后端（codex/grok/pi 同一分支）调 actor 单一 adapter 的 steer 入口 `let et = w.adapter?.steerActiveTurn`（`84246`），codex 上即 `turn/steer`（日志仍写作 `codex turn/steer landed`（`84268`）），失败则回退 redrain。`pendingSteer` 在 turn 循环里被消费：命中则 `injected interjection mid-turn`（`83106`），或流已关闭则 requeue 回 inbox（`steer fallback requeued to inbox (stream closed)`（`83247`））。**一次只准入一个对话 turn**，后到输入不再折进跑动中的 turn 导致会话永久 busy。**confirmed（准入判据/steering 路径），mid-turn 注入时序为静态阅读**。
- **`wakeResolver` 单槽不变量（并发同步点）**：同一 `wakeResolver` 字段被 `mJ`(idle 等待) **设置**（`e.wakeResolver=()=>{…}`（`82865`））、被 `se`/`L`(唤醒/出队) **消费并置 null**（见 `F.wakeResolver(),F.wakeResolver=null`（`83719`）、`V.wakeResolver(),V.wakeResolver=null`（`83847`）），是 idle↔wake 竞争的**唯一同步点**，构成一条并发不变量。**confirmed**。
- **Plane/kind 硬隔离**：`session.notify` 处理器 `$0e`（`89571`）经谓词 `C0e`（`89513`，`t=lr(e); return t==="channel"||t==="job"?null:t`）判定：`s=C0e(o.session_key); if(s) return {ok:!1,reason:"forbidden_kind",…}`（`89584-89591`）——拒绝把外部通知投给 subconscious/system/meta 平面；`session.compact` 处理器 `wyt`（`89743`）更严 `a=lr(...); if(a!=="channel")…`（`89756-89763`），且 `if(or(...)) reason:"archiving"`（`89764-89769`）。白名单谓词 `NV`（`64080`，`e=>lr(e)==="channel"||lr(e)==="job"`）供 `listUserVisible`（`64134`）；notify 与 `session.wake` 处理器 `yyt`（`89517`）共用 `C0e`，compact 用内联 `lr` 判断。**confirmed**。
- **v0.8.2 新增第二道投递闸门：没人读的 channel 会话拒收 notify（confirmed）**。上一条是按 kind 拒，这条是按**有没有消费者**拒——机制上是 duoduo 第一次承认"投递成功"和"有人看见"不是一回事。`evaluateNotifyConsumerRefusal (P$)`（`64870-64892`）只对 `channel` kind 生效（首行 `lr(t)!=="channel"`（`64871`）直接放行，job/system/subconscious 不受影响）；判据由 `classifyConsumerStaleness (O_e)`（`64843-64854`）给出：`records_past_cursor > 0 && age_ms > 阈值小时数 × 36e5`（`64851`），即**既有积压未读、又超过时限没人取过**，两条同时成立才算"没人读"。阈值来自 `resolveNotifyUnconsumedHours (BV)`（`64856-64861`）读 `ALADUO_NOTIFY_UNCONSUMED_HOURS`，**默认值是 1（小时），不是"未设置即关闭"**——关闭靠把它显式设成 `<= 0`，那是 `O_e` 里唯一的短路分支（`t<=0` 直接 `unconsumed:!1`（`64847-64848`））。拒绝时不是一句空话：`listSessionsWithRecentConsumer (qat)`（`64893-64911`）扫出**同一时限内确实有人取过输出**的其他 channel 会话，`renderNotifyRefusalMessage (C$)`（`64919-64934`）把它们连同"已等待多久、积压几条"一起写进拒绝文案（`for (let c of n) … consumer took output`（`64927-64930`）起），并明确 `Nothing was delivered. This call will not be retried.`；候选为空时文案改口为"没有任何地方会有人看见，别重发"（`No session has had a consumer`（`64924`））。CLI 侧 `duoduo session notify` 的 `--force` 绕过该闸门，`duoduo daemon status` 另出一个 `notify_unconsumed_hours`（`89146`）块把当前阈值暴露出来。
- **归档态统一短路 `Ks()`**：`Ks(e,t)=ase(Sm(e,t))&&!ase(Jn(e,t))`（`32273-32274`，归档目录存在且活动目录不存在）——tombstone 判定贯穿 delivery-cursor（`Ks`（`64501`））、compact、drain 收尾，是归档态对所有写路径的统一短路机制。归档安全在 v0.6.0 加固：`archive` 前先证明无 in-flight 工作、忽略 channel 占位 actor，归档标记（`or`(`32431`)/`lR`(`32423`)/`cR`(`32427`) 对 `ub` Set 的查/增/删）被当作真实"即将消失"信号，抑制一切 wake/ingress。归档错误 `km` `extends Error {kind="session_archiving"}`（`32441-32442`），`zl`(`32435`) 抛之（`km`@`32436`）。**confirmed**。
- **收尾再校验 `He`→`A` + 一次性重驱**：`sessionInboxFreshNameVerdict`（`80595`）actor end 后重扫 inbox，返回 `"fresh"/"conservative"/"none"`（`80275-80279`）；`fresh`→重新 wake（`preempt:"never"`（`84826-84827`））；`conservative`(瞬时读失败) 受 `consecutiveConservativeRedrive` 约束——该字段**确为布尔**：初始 `consecutiveConservativeRedrive ?? !1`（`83975`），已 true 则 `conservative re-drive suppressed (cap spent)`（`84828`），首次则 `=!0`+`re-entering wake path once`（`84831`）——即只重驱一次防自旋（`consecutiveConservativeRedrive`（`84821-84836`））。**confirmed**。
- **后台 Agent 完成单一 owner**（v0.6.1）：job origin actor 收尾时经 `c(w,{runStarted,cancelled,processedCount,claimCursor,error,resultText,jobSnapshot})`（`84808-84816`）**只持久记录生命周期事件**再置 `status="ended"`（`84818`）；对话侧则由 Claude 原生完成续写作为唯一"说进对话"的路径，duoduo 不再另造重复回调 turn。**confirmed（收尾记录路径），"唯一 owner"表述为综合推断**。

---

### 论点 5 · idle 回收不再只让池槽，v0.7.1 起连运行时子进程一起拆（idle-reclaim）

**所以呢**：论点 3 讲的"idle 让池槽、`attachedChannels` 钉活"解决的是**并发容量**问题——idle actor 不占执行槽，但只要还有前台通道附着，它在内存里就**继续活着**，等着被唤醒续写。v0.7.1 在此之上新增了一层独立的资源回收：即使因为前台附着而不能整体退场，一个 idle 到超时的 actor 也会**主动杀掉它持有的运行时子进程**（Codex app-server / Grok ACP 子进程；Claude 侧没有子进程，等价动作是中止 in-process streaming query），下一条消息到达时再冷启动一个新的。这解决的是一个此前无上界的问题：一个保持长连接的 channel gateway（这是常态，不是异常）会让它触碰过的**每一个** session 都无限期地占着一个子进程，而这个子进程早就没有价值了——模型侧的 prompt cache 早已过期，唯一的回收成本只是"沉默很久后第一条回复慢一点"。

- **触发条件**：`createSessionManager (Tgt)`（`daemon.pretty.js:83621`）接受 `idleTimeoutMs=36e5`（默认 1 小时）选项（`idleTimeoutMs: i = 36e5`（`83626`）处解构），真实值来自 daemon 启动时 `process.env.ALADUO_SESSION_IDLE_MS ?? 36e5`（`91529`）。drain 循环里一旦一个 turn 跑完且暂无更多工作，actor 置 `status="idle"`（`daemon.pretty.js:84709`）并进入等待循环，每轮竞速 `await mJ(w,i)`（`mJ`（`82859`）——一个 `setTimeout(idleTimeoutMs)` 对抗被唤醒提前 resolve）；超时且仍处于 idle（`w.status!=="idle"`（`84741`）判定），触发回收（confirmed，逐行核对）。
- **回收动作**：`w.attachedChannels.size > 0`（有前台附着，不能整体退场）时，日志打一条 `"idle timeout with attachments, reclaiming runtime processes"`（`daemon.pretty.js:84746`），随后**先中止 streaming query**，再回收非 claude 后端：`await Zf(w), LA(w)`（`84754`）。`Zf` 这一步对 Claude 是唯一动作，因为它没有常驻子进程；`LA`（`82873`）读 actor 上唯一的 `adapter` 字段，存在则置 `adapter = null, adapterFacts = void 0` 并异步 `shutdown()`，codex/grok/pi 走的是同一个分支，不再按后端分字段处理。若 `g.attachedChannels.size===0`（无前台附着），actor 不进入这条回收分支，直接整体退场（`status="ended"`），日志改打 `"idle timeout, no attachments, exiting"`（`daemon.pretty.js:84764`）（confirmed，逐行核对）。
- **冷重生**：actor 记录留在内存 Map 里但已清空运行时字段；下一次唤醒时，唤醒逻辑发现这是个"已结束/无存活 drainPromise"的记录，走的是与全新 actor 一样的创建路径（`query`/`streamingState`/`adapter` 全部重新按需构建）——这是一次真正的冷初始化，不是"假装还活着"（confirmed，机制存在）。
- **v0.7.1 changelog 提到的三处配套修复**：①"reclaiming the Grok adapter on timeout"——即上述 Grok 分支本身，与已有的 Codex 分支对称新增；②"guarding the exit-path audit on a process that is actually alive"——Codex 适配器 `shutdown()` 里"子进程已退出则跳过信号"的守卫，防止对一个其实还活着的进程误判成"已退出无需处理"（或反之）；③"covering the cold respawn"——上一条讲的冷重生路径本身的正确性修复。三处均为**机制存在 confirmed**，具体对应哪一行历史 bug 属**未证实推测**（无 v0.7.0 前的代码可比对）。

---

### 证据表

| 机制主张 | 证据(字面量/片段) | 位置 | 置信 |
|---|---|---|---|
| 进程级 runtime 写锁 + pid/boot_id/心跳/TTL 抢占 | `daemon-writer.json`；`Runtime lock already held by pid=${...}`；`knt`: `Number.isNaN(r) \|\| t.getTime()-r>n \|\| (e.boot_id && e.boot_id!==Zhe()) \|\| !wnt(e.pid)`；`wnt`=`process.kill(e,0)`；TTL `ttlMs??12e4` | daemon `88807`(c6)/`88811`(Lut)/`88821`(Fut)/`88838`(Qbe)/`88842-88845`(zut)/`88857`(f6) TTL；抢锁 `f6`（`91394`）；心跳 `ALADUO_RUNTIME_LOCK_HEARTBEAT_MS`（`91439-91442`） | confirmed |
| 会话级异步互斥（串行化状态变更） | `Bi(e,t){ i=uR.get(e)??Promise.resolve(); uR.set(e,r); await i; try{return await t()} finally{n(); uR.get(e)===r&&uR.delete(e)} }` | `Bi`（`32410`）；调用点 `Bi`（`32548`）、`Bi`（`35484`）、`Bi`（`35517`）、`Bi`（`35567`）、`Bi`（`35603`）、`Bi`（`35639`）、`Bi`（`64500`）、`Bi`（`65875`）、`Bi`（`65894`）、`Bi`（`90461`） | confirmed |
| 一 session_key 一 actor + 单调 actorRunId + active/idle/ended | `let B = new Map`（`83745`）；`N()` 生成、`actorRunId: V=++ee`；`status:"active"→"idle"→"ended"` | daemon `actorRunId`（`83931-83937`）/`w.status = "idle"`（`84709`）/`w.status = "ended"`（`84818`） | confirmed |
| 双有界池：channel=10 / job=6，超限入 wakeQueue | `C`/`$` `{name,activeCount,maxConcurrent,wakeQueue}`（`83676-83687`）；`D=…??10`、`A=…??6`；`K.wakeQueue.push(w)` | daemon `maxConcurrentJob`（`83674-83687`）；`wakeQueue.push`（`83912`）；RPC `system.config`→`max_concurrent_channel:10, max_concurrent_job:6`（`89133-89134`） | confirmed |
| idle 释放池槽 + `mJ`(idle_ms) 等待，前台附着钉住 actor | `released pool slot (idle)`；`mJ(e,t){ wakeResolver=n(!0) vs setTimeout(n(!1),t) }`；`idle timeout with attachments, reclaiming runtime processes`（其后 `continue`） | daemon `released pool slot`（`84722`）/`mJ`（`82859-82871`）/`idle timeout with attachments`（`84746`）；重抢槽 `re-acquired pool slot`（`84774-84789`）；`idle_ms:3600000` RPC | confirmed |
| dequeue 原地复用 idle actor | `L(w){ …if(F.status==="idle"&&!F.holdsPoolSlot&&F.drainPromise){ pendingWake=!0; wakeResolver(); "resuming idle actor from dequeue"; return } …回落 N(z,ZW(z)) }` | daemon `resuming idle actor from dequeue`（`83697-83744`） | confirmed |
| 唤醒/抢占：se 归档抑制 + idle resolve + 单 turn 准入/steering；zS 边界延迟 | `se`：`or→wake suppressed`；`allow&&(oe\|\|xe)&&admissionCallback&&!admissionInProgress`（admitting）；`zS`：`tool_use/tool_result/accept` 边界，`force→immediate`/`allow→soft` | daemon `se`（`83825`）（steering `admissionCallback`（`84188-84370`））；`zS`（`82830-82837`）/`"immediate"`（`83868`）/`"soft"`（`83884`） | confirmed |
| 单 turn 准入 + steering lane（后到走显式通道） | `admitting to live streaming session`；`appended claude steer`/`parked claude steer`；`codex turn/steer landed`；`injected interjection mid-turn`；`pendingSteer` 会话状态 | daemon `admitting to live streaming session`（`83856`）；`codex turn/steer landed`（`84268`）/`appended claude steer`（`84303`）/`parked claude steer`（`84355`）；`injected interjection mid-turn`（`83106`）；字段 `Tgt`(`83964`) | confirmed |
| preempt 档位映射 `JB`→`SJ` | `!t\|\|!t.startsWith("/")?"allow":首词==="/cancel"?"force":"never"`；`se` 默认 `z=P?.preempt??"allow"`；ingress `preempt:SJ(k.text)` | daemon `SJ`（`89187-89190`）；`preempt??"allow"`（`83838`）；`preempt: SJ(k.text)`（`90723`） | confirmed |
| Plane/kind 隔离：notify 拒非 channel/job，compact 仅 channel | `s=C0e(o.session_key); if(s) reason:"forbidden_kind"`（`C0e` 在 `lr(e)` 为 channel/job 时返回 null）；`compact`：`if(a!=="channel")` + `if(or)reason:"archiving"` | daemon `$0e`（`89571-89591`）、`C0e`（`89513-89516`）；`wyt`（`89743-89769`）；`lr`@`64076`；`NV`@`64080` | confirmed |
| v0.8.2 notify 消费者闸门：仅 channel，积压+超时双条件，默认 1h，`<=0` 关闭 | `evaluateNotifyConsumerRefusal (P$)` 首行 `lr(t)!=="channel"` 放行；`classifyConsumerStaleness (O_e)`：`t<=0?{unconsumed:!1}:{unconsumed: e.records_past_cursor>0 && o!==void 0 && o>t*Lat}`；`resolveNotifyUnconsumedHours (BV)` 默认 `R$=1`、`Lat=36e5` | `evaluateNotifyConsumerRefusal (P$)`（`64870`）、`classifyConsumerStaleness (O_e)`（`64843`）、`resolveNotifyUnconsumedHours (BV)`（`64856`）、`Lat = 36e5, qV = "ALADUO_NOTIFY_UNCONSUMED_HOURS", R$ = 1`（`64868`） | confirmed |
| 拒绝文案给出"还有谁有人读"，而非单纯报错 | `listSessionsWithRecentConsumer (qat)` 按同一时限筛其他 channel 会话并按 age 排序；`renderNotifyRefusalMessage (C$)`：`Nothing was delivered. This call will not be retried.` | `listSessionsWithRecentConsumer (qat)`（`64893`）、`renderNotifyRefusalMessage (C$)`（`64919`）、`"Nothing was delivered. This call will not be retried."`（`64923`） | confirmed |
| Notify 目标解析：工具端与 CLI 端是**两套实现** | 工具端 `Qat` 三段式（精确 key→别名→歧义列候选）；CLI/RPC 走 `Kf`（仅精确 key + 唯一别名，无 orphan 过滤） | daemon `Qat`（`65182-65213`，工具端）/ `Kf`（`89488-89511`，RPC 端） | confirmed |
| session_key 格式 `<scope>:<name>:<hash(workspaceAbsPath)>` | cli 侧拼装：`${t}:${n}:${KKe(r)}`（`cli.pretty.js:73844`），`r = vT(e.workspaceAbsPath)`（`cli.pretty.js:73843`，realpath 归一），`KKe` = `createHash("sha256").update(e).digest("hex").slice(0, 12)`（`cli.pretty.js:73828`）；`Ege` 注入 `scope: "stdio"`（`cli.pretty.js:73849`）；活体 `stdio:default:28d3ca682f86` | cli `$Ke`（拼装）/`Ege`（stdio 入口）；`session list` RPC | confirmed |
| 会话目录 = sessionsDir/sha256(key)，含 inbox/mailbox/state.json；归档 tombstone | `Xn=join(sessionsDir,vo(t))`；`vo=sha256(e).digest(hex)`；`Cs()=Ire(Vp)&&!Ire(Xn)`；`inbox/mailbox.md/mailbox/pending/notes.jsonl/meta.md/state.json` | daemon `32257`(Oo)/`32261`(Jn)/`32269`(Sm)/`32273`(Ks)；mailbox 标题 `# Session Mailbox`（`32706`） | confirmed |
| rehydrate 扫描 + state.json 字段 | `rehydrateSessionState (cse)` 扫 `e.sessionsDir` 后 `stat().isDirectory()&&KGe` 读取；`khe` 字段集 | daemon `rehydrateSessionState (cse)`（`32340`）/`32319`（s5e）；`64097`（p_e） | confirmed |
| ingress→wake；outbox replay；delivery-cursor 跳归档 | `channel.ingress`→`routing.enqueued && emit("session.wake",{...,preempt:SJ(k.text)})`；`replayed outbox backlog`；`b_e` 用 `Ks()` 跳归档写游标 | daemon `routing.enqueued`（`90720-90723`）；`replayed outbox backlog`（`91326`）；`b_e`（`64498-64507`） | confirmed |

### 关键数据结构 / 事件 / 文件格式（真实字面量）

- **Actor 对象**（内存态，`K = {sessionKey, actorRunId, …}`（`83935-83976`））：`sessionKey, actorRunId, sdkSessionId, sdkSessionIdVerified, status, currentAbortController, query, streamAbortController, streamingState, streamingAdapter, streamingGeneration, drainPromise, wakeResolver(单槽 resolver), pendingWake, liveTurnNotifyOnly, isStreaming, activeToolCalls:Map, pendingPreempt, pendingPreemptBoundary("tool_use"/"tool_result"/"accept"), pendingPreemptReason, pendingClear, attachedChannels:Set, origin("channel"/"job"/"system"), jobId, jobStateless, holdsPoolSlot, inflightEventIds:Set, admissionInProgress, pendingSteer(steering lane 会话状态，null/{steerText,eventIds,claimedEventIds,settled,…}), admissionCallback, idleSince, spawnedAt, lastActivityAt, lastTurnCompletedAt, lastCliTurnSettledAt, agentNotifiedThisDrain, runtime("claude"/"codex"/"grok"/"pi"), adapter, adapterFacts, consecutiveConservativeRedrive(布尔，初始 ??!1)`。`actorRunId` 取自自增计数 `V = ++ee`（`actorRunId: V`（`83937`））；`pendingPreemptBoundary` 由抢占请求函数 `zS`（`82830`）按当前是否在流式输出、是否有进行中的工具调用设成三值之一。非 claude 后端只有一个 `adapter` 字段（`adapter: z?.adapter ?? null`（`83973`）），idle 超时（`idleTimeoutMs`，默认 36e5ms）经 `LA`（`82873`）把它和 `adapterFacts` 置空并异步 shutdown，`query`/`streamingState` 同步置空——见论点 5。
- **池对象**（`C` / `$`）：`{name:"channel"|"job", activeCount, maxConcurrent, wakeQueue:[]}`（`83676-83687`）（注册表 Map 为 `let B = new Map`（`83745`），与 job 池 `$` 分属两个符号）。
- **runtime 锁文件** `run/locks/daemon-writer.json`：`{runtime_dir, pid, boot_id, started_at, last_heartbeat_at}`（`boot_id` 取 `/proc/sys/kernel/random/boot_id` + macOS `sysctl kern.boottime`/uptime 兜底，`Fut`@`88821`；当前值 getter `Qbe`@`88838`）。
- **会话磁盘布局** `var/sessions/<sha256(key)>/`：`state.json`、`meta.md`、`mailbox.md`（渲染标题 `["# Session Mailbox","","## Inbox",""]`（`32706`））、`mailbox/pending/`、`mailbox/notes.jsonl`、`inbox/`。归档态迁到 `var/sessions-archive/<sha256(key)>/`（`Sm`@`32269`，归档根 `i5e`@`32265`；`Ks`（`32273`）判归档 tombstone），归档进行中由 `or`(`32431`)/`lR`(`32423`)/`cR`(`32427`)（对 `ub` Set 的查/增/删）抑制一切 wake/ingress，错误 `kind="session_archiving"`（`32442`）。
  - *注（confirmed）*：错误类的 RE 命名 `SessionArchivingError` 现由代码直证——minified 类符号为 `km`（旧 `Of`/`ZD`），其构造器显式 `this.name = "SessionArchivingError"` 并置 `kind="session_archiving"`（`32441-32445`）。
- **state.json 字段**（投影函数 `p_e`@`64097`）：`session_key, cwd, plane, permission_profile, created_at, last_event_id, last_event_at, last_seen_daemon_started_at, source_channel_id, last_error`，v0.6 起新增 auto-compact 计量字段 `context_used_tokens, last_compact_at, compact_measured_floor(=compact_stats.post_total), compact_measured_at`，v0.8 起再加 `last_served_model, model`；`display_name/kind/owner_session` 来自 meta（由 `OR`@`35474` upsert，调用点 `OR`@`83981`，kind 在此从 origin 二次派生）。
- **preempt 值来源** `SJ`(`89187`)（调用点 `SJ`（`89781`/`90723`/`90772`））：无斜杠命令→`"allow"`、首词 `/cancel`→`"force"`、其它斜杠命令→`"never"`；`se` 默认 `z=P?.preempt??"allow"`（`83838`）。内部 `G(actor,"soft"|"immediate",boundary)` 的 `soft` 是由 `allow` 派生的内部模式名，非外部档位。
- **相关事件/RPC**：入口 `channel.ingress`/`session.notify`/`session.wake`（`emit("session.wake",{sessionKey,displayName,preempt})`）；隔离判定返回 `reason:"forbidden_kind"`/`"archiving"`/`"ambiguous"`/`"not_found"`。

### 给 Agent PM 的洞察

> 1. **"外部单身份、内部多会话" = session_key 命名空间 + 一 key 一 actor + 前缀即平面**。路由/隔离/权限全部从 `session_key` 前缀（`stdio:`/`job:`/`meta:`/`subconscious:`/`system:`）纯函数派生（`lr`@`64076`），无需额外注册表（呼应本节论点 1）。代价是"平面"是约定式字符串契约——`session.notify` 靠前缀白名单挡住 work→system/subconscious 的越权唤醒（只放行 channel/job），这是可借鉴的**轻量能力边界**，但也意味着改前缀即改权限，需谨慎治理。

> 2. **并发用"双有界池 + 可让出的池槽"而非固定线程**。channel(10)/job(6) 分池避免后台批处理饿死前台交互；idle actor **主动释放池槽**（`released pool slot (idle)`（`84722`））再挂起等待，dequeue 时对 idle-with-drainPromise 的 actor **原地唤醒复用**（`resuming idle actor from dequeue`（`83718-83725`）），让容量在会话间流动。可借鉴：把"占用执行槽"与"会话存活"解耦——idle 不占槽，但 `attachedChannels` 能把 actor 钉活，兼顾资源回收与前台低延迟续接（呼应论点 3）。

> 3. **抢占是"单 turn 准入 + 边界感知"的而非硬 kill**。外部 preempt 枚举为 **`allow`/`force`/`never`** 三档（`JB` 由用户命令映射）；v0.6.1 起一次只准入一个对话 turn，`allow` 档优先走 admission callback 的**显式 steering 通道**（Claude 追加 steer 文本 / Codex `turn/steer`，不打断、后到消息或就地插话或 park 回 inbox），退而求其次才在 `tool_use/tool_result/accept` 边界以 `soft` 模式延迟中断（`G`），避免在半个工具调用中截断导致状态损坏；`force` 走 `immediate`。这既防"半个工具调用被截断"，又防"后到消息折进跑动 turn 导致会话永久 busy"，是有状态 agent 做"打断/续写"的关键取舍（呼应论点 4），值得任何流式 agent 产品照搬。

> 4. **两层锁分工清晰**：进程级 runtime 锁（跨重启、pid+boot_id 探活）解决"同目录多 daemon"；会话级 `hi` 异步互斥解决"同会话并发写状态"。前者是运维健壮性，后者是数据一致性——不要用一把锁混着做（呼应论点 2）。

> 5. **能力边界**：actor 之上没有真正的分布式/多进程调度，全在单 daemon 单进程内用 Map+Promise 编排，`wakeResolver` 单槽是 idle↔wake 竞争的唯一同步点；`unhandledRejection` 被吞、`uncaughtException` 直接 `process.exit(1)`（`91472-91476`）靠外部重启恢复。适合"单机常驻个人 agent"，若要横向扩展会话，需要把内存 `Map g`/池/`hi` 换成外部化的租约与队列。


---
## §8 Claude/Codex/Grok/pi 四运行时抽象与路由

> **v0.8.0 更新（confirmed，代码证据）：枚举从三值扩到四值，`pi` 加入且是唯一"内嵌、无需外部 CLI"的后端。** 全仓唯一权威枚举字面量已变为 `["claude", "codex", "grok", "pi"]`（`daemon.pretty.js:31664`，取代 v0.7.1 时的 `Ex=["claude","codex","grok"]`）。`pi` 与另外三者有一处本质不同：`available_runtimes` 探测里 claude/codex/grok 都要探测成功才 push，**`pi` 无条件 push，不做可用性门控**（`e.push("pi")`（`63770`）在三个条件 push 之后无条件执行）——错误文案直说原因：`The pi runtime is embedded in duoduo — there is no separate CLI to probe`（`72217`），pi 自己的进程是 duoduo 包内自带的 `pi-worker.js`（`dist/release/pi-worker.js`，本轮**未**逆向，不在 daemon/cli/stdio 三宿主的既有还原范围内），而不是像 `codex`/`grok` 那样要求用户另装并登录一个外部 CLI。pi 的模型 id 走自己的 canonical 校验 `provider/modelId`（`63823`），凭据来自用户 pi agent 目录的 `models.json`/`auth.json`（`72229`附近的报错文案），与 Claude/Codex/Grok 各自的账号体系完全独立。`prompt_mode` 语义上 pi 与 claude/grok 同组、codex 例外（`consumed by the claude, grok, and pi runtimes; on codex it is a no-op`（`63959`））。job-config 叠加口复用同一个 `applyJobSdkConfigOverride`（见 §1 论点五 v0.8.0 更新块的 `piExtensions`/`piSkills`/`piConfigIssues`）。下文论点①②、证据表与 PM 洞察 1/3 已按四值枚举逐行改写并重新锚定到 v0.8.0（选择链两处 + actor spawn 分支 + 专属报错文案，均 confirmed）；论点③④（命令层分叉、装配器复用）pi 是否同样落在既有描述里**本轮未逐行核对**（未证实推测；job-config 叠加口这一条例外，已确认复用）。

**领起结论：`runtime` 是一个 `claude`/`codex`/`grok`/`pi` 四值字符串枚举（v0.7.1 新增 grok；v0.8.0 新增 pi，且 pi 是三个非 Claude 后端里唯一内嵌于 duoduo 自身、无需安装、无可用性探针的），却仍是一层"薄名字、厚差异"的抽象——duoduo 不抹平进程内 SDK（claude）、常驻 JSON-RPC 子进程（codex app-server）、常驻 ACP 子进程（grok agent CLI）、内嵌 worker 子进程（pi）四种进程模型的差异，而是在选择链（显式声明 > channel/job frontmatter > `ALADUO_DEFAULT_RUNTIME` > `claude`）与命令层按 `runtime` 分支*诚实路由*，靠共享的 prompt 装配器与 protocol 分桶会计跨后端复用同一套指令与溯源。** 下面四个论点自上而下展开这句：①名字很薄（四值枚举、单一权威源 + 诚实的选择链）；②差异很厚（四种不对称的执行形态与探测机制——**codex 不可用时静默降级到 claude，grok 不可用时绝不降级、直接报错，pi 干脆没有探测这一步**，三种互不相同的失败模式并存）；③命令层不假装对等（undo/model/compact 逐 runtime 分叉，grok 走独立的 ACP rewind 机制——**v0.8.0 更新：grok 的 ACP rewind 机制本身已被移除，见 §2**）；④骨架靠复用而非抹平（共享装配器 + 分桶 + 认证短路 + 工具命名空间钉顶，但权限/thinking 面故意不对等）。

---

### 论点①　名字很薄：四值枚举、单一权威源 + 诚实的选择链，"显式意图 > 自动兜底"

**所以呢**：runtime 的合法取值现在有四个，选择逻辑仍不玩魔法——它把"用户/actor 明确要 codex/grok/pi"当作不可降级的意图直接放行，只对"从 channel/job frontmatter 派生出来的 codex"才做可用性门控；而**派生出来的 grok、pi 同样不门控**（见论点②的不对称发现）。这是一条刻意的产品价值排序（尊重显式意图，宁可晚炸也不静默降级）。

- **枚举扩到四值，且 v0.7.1 把"三处独立词法作用域常量"重构成了单一权威源**：v0.6.2 时代文档记载的三处独立副本（`s2e`/`aHe`/`lhe`）在 v0.7.1 已不再存在——全文件只有唯一一处字面量数组，v0.8.0 中为 `L0 = ["claude", "codex", "grok", "pi"]`（`daemon.pretty.js:31664`；v0.7.1 时为 `Ex`，升级只重命名了短标识符、结构未变）。默认值解析函数（v0.7.1 时名为 `Xl`）逻辑不变：`ALADUO_DEFAULT_RUNTIME` 非字符串 → `"claude"`；trim/lowercase 后空串 → `"claude"`；成员判定通过才用用户值，否则 `"claude"`（confirmed，结构化 grep 验证全文件仅此一处四值数组字面量）。**pi 没有 `ALADUO_PI_ENABLED` 或等价开关**——它随 duoduo 自身的 npm 依赖内嵌安装，`skills/duoduo-runtime-admin/references/pi-runtime.md` 称其"没有可用性探针，守护进程永远把 pi 报告为可用"，与下面 boot 探测代码的行为一致（confirmed）。
- **选择链 A——`createSessionManager` 内部通用解析器 `i(a,l)`（`QEe`（`82641-82654`）内）**：`if (l?.runtime === "grok") return "grok"`（`82642`，**显式声明 grok 直接返回，不做可用性门控**）→ `if (l?.runtime === "codex") return "codex"`（`82643`，**codex 同样直返不门控**）→ `if (l?.runtime === "pi") return "pi"`（`82644`，**v0.8.0 新增，pi 与 grok 同组**）→ 有 `source_channel_id` 则回溯 channel descriptor/kind 配置取 frontmatter `d`，最后 `d ??= ao(), d === "grok" ? "grok" : d === "pi" ? "pi" : d === "codex" && (await n()).ok ? "codex" : "claude"`（`82653`）——**frontmatter 派生的 grok、pi 都不经过 `(await n()).ok` 门控，只有 codex 才检查**（confirmed，逐行核对）。
- **选择链 B——潜意识 partition（分区执行闭包 `I`，位于 `createMetaSession (Ugt)`（`85907`））**：`B = S.runtime`（`85911`，partition frontmatter）→ `G = B ?? Co()`（全局默认 `Co`（`85912`））。若不可用则跳过该 partition 并发 `agent.error{outcome:"runtime_unavailable", runtime:G, runtime_source: B ? "explicit" : "default"}`——这条与选择链 A 的失败前移相反，partition 路径*会*显式发不可用事件（confirmed）。
- **"runtime"一词在本运行时被重载两义，须消歧**：`system.runtime.info` RPC 返回的是*守护进程实例身份*——`{version, runtime_id, runtime_mode:"host"（固定）, runtime_dir, work_dir, kernel_dir}`，**不含 `available_runtimes`、与模型后端无关**。本节所讲的 `runtime` 始终指*模型后端*；读者勿把 `runtime.info` 误当成后端探测入口（confirmed）。

### 论点②　差异很厚：四种不对称的执行形态，且失败模式本身也三分

**所以呢**：同一个字符串背后是四种根本不同的进程模型（进程内 SDK / 常驻 JSON-RPC 子进程 / 常驻 ACP 子进程 / 内嵌 worker 子进程），claude/codex/grok 的探测都带结果缓存 + in-flight promise 去重、都留了测试注入缝——这是"探测可注入、选择可单测"的三份对称实现。但**这份对称在"不可用时怎么办"上被打破成三种模式**：codex 不可用会静默降级到 claude 并打日志；grok 不可用**绝不降级**，actor 仍以 `runtime="grok"` 创建，不可用原因被记录、留到 drain 时才作为硬错误抛给用户；pi **干脆没有探测这一步**——它总是被无条件视为可用，失败被完全推迟到会话发消息时的模型解析阶段（一个不同的错误族："this pi session has no model yet"，而非"runtime unavailable"）。这是三种截然不同的"永远可用 vs. 可能不可用"产品设计，而不是同一模式的三份实现。

- **claude = 进程内 SDK，无子进程**：模块顶层静态 `import { query as She } from "@anthropic-ai/claude-agent-sdk"`（`54941-54943`）。可用性同步验证器 `$he`（`55039`）：`CLAUDE_CODE_EXECUTABLE`（`55040`）设了就放行；否则平台白名单 6 种、抛错 `unsupported platform`（`55044-55045`）；原生二进制兜底 `s.resolve("${l}/claude")`（`55058`）（confirmed）。
- **真正的探测引擎 `probeClaudeAvailability`，5s 超时**：`Promise.race([...,setTimeout(...)])`。**双重去重**：结果缓存 + in-flight promise，派生读取 `isClaudeAvailable`/`claudeUnavailableReason`（confirmed）。测试注入缝 `__setClaudeVerifierForTest` 可替换验证器并清缓存（confirmed）。
- **codex = 外部 CLI + 常驻 app-server 子进程**：探测 `checkCodexAvailability (Sc)`（`daemon.pretty.js:61850-61886`）两步各 5s——`execFile(e,["--version"],{timeout:5e3})`（`61857`）后 `codex login status`（`61870`）断言输出含 `"logged in"`（`61873`）（confirmed）。运行时适配器 `createCodexAppServerAdapter (yw)`（`daemon.pretty.js:61974-62434`）本身是闭包工厂，真正的子进程壳是它 new 出来的 `a$`（`62735`）类：`this.proc = spawn(this.binary, ["app-server"], {cwd, stdio:["pipe","pipe","pipe"], env:{...process.env,...this.env}, detached:!0})`（`62751-62758`），走换行分隔 JSON-RPC（confirmed）。缓存/测试注入：`isCodexAvailable`/`primeCodexAvailability`/`__setCodexAvailabilityForTests` 三件套，与 claude 侧对称（confirmed）。
- **grok = 外部 CLI + 常驻 ACP 子进程，探测方式与 codex 不同**：`checkGrokAvailability (kc)`（`daemon.pretty.js:62973-62992`）到 v0.8.1 只剩**一步**——`execFile(e,["--version"],{timeout:Lst})`（`62980`，`Lst = 5e3`（`63683`））成功即判 `{ok:!0}`，**不做任何登录态断言**，失败文案把登录责任推给用户（`Install it and run 'grok login'.`（`62986`））；对比 codex 的两步探测，grok 的"已安装但未登录"只能在首个 turn 的 ACP `authenticate` 阶段才暴露（confirmed）。（v0.7.1 及更早基线里这里是两步：`grok --version` 之后再跑 `grok models` 扫 stdout+stderr 是否含 "logged in"；该第二步已被移除，当前 bundle 中 "logged in" 只剩 codex 一处命中。）适配器 `createGrokAcpAdapter (vw)`（`daemon.pretty.js:63118-63675`）是一个闭包工厂而非 class（区别于 codex 的 class 适配器），`spawn(t="grok", ["agent","--always-approve","--no-leader","stdio"], {cwd,env,stdio:["pipe","pipe","pipe"]})`（`63401-63405`）——**没有 `detached:!0`**，这点也与 codex 不同（confirmed）。协议走标准 ACP（`initialize`/`authenticate`/`session/new`/`session/load`/`session/set_model`/`session/prompt`/`session/cancel`）加一组 `_x.ai/...` 供应商扩展方法（`GROK_ACP_EXT_PREFIX="_x.ai"`（`63688`）；`grokAcpExtMethod (bw)`（`daemon.pretty.js:62994-62997`）拼装），mid-turn steering 用扩展方法 `_x.ai/interject`。缓存/测试注入 `isGrokAvailable`/`primeGrokAvailability`/`__setGrokAvailabilityForTests` 三件套齐全（confirmed）。
- **pi = 内嵌 worker 子进程，是三个非 Claude 后端里唯一"随 duoduo 一起装好"的**：worker 入口由 `eS`（`72713`）解析：`IH(e, "pi-worker.js")`（`72715`）存在则以 `process.execPath` 运行，否则回退 `args: [IH(e, "pi", "worker.ts")]`（`72721`），三处 actor 创建点都传 `workerCommand: eS()`（`84487`/`84996`/`85844`）——spawn 的是 duoduo 自带的 pi coding-agent SDK 里的 worker 脚本，不是像 codex/grok 那样 shell 出用户 PATH 上的外部 CLI，所以**没有对应的 `checkPiAvailability`**（全文件搜索确认不存在）。它没有 claude 式的进程内 SDK 调用，也没有 codex/grok 式的探测-缓存三件套，是第四种、更简单的执行形态：直接假定可用，把"能不能用"完全下放给消息发送时的 provider/模型解析（confirmed，结构化 grep 验证不存在 pi 专属可用性探针）。
- **失败模式三分：codex 静默降级，grok 绝不降级，pi 无从谈论"降级"**——actor spawn 时（`createSessionManager (Tgt)`（`84064-84088`）内部未导出的 spawn 逻辑一带）对 job/channel 两种 origin 都是同一套模式：`He==="codex"` 分支里 `$r=await m(); $r.ok ? w.runtime="codex" : (w.runtime="claude", 打印"...falling back to claude"警告)`（`84070-84071`）；`He==="grok"` 分支里**先无条件 `w.runtime="grok"`**，再 `$r=await b(); $r.ok || (br=$r.reason, 打印"...grok is unavailable"警告，不改 runtime)`（`84079-84080`）；而 `He==="pi"` 分支只有一行 `w.runtime="pi"`（`84086`）——**没有 await、没有 ok 判断、没有警告日志**，比 grok 分支还要少一步。也即 codex 不可用时用户拿到的是一个**换了后端**的会话（可能默默发生），grok 不可用时用户拿到的是一个**注定失败**的会话（直到 drain 阶段 `drainSessionMailbox` 读到未清空的不可用原因才抛错：`Agent runtime 'grok' is unavailable. ... Install the grok CLI, run 'grok login', then send the message again.`（`72353`）），而 pi 的会话从不会因"运行时不可用"失败——它唯一会晚发作的失败源是"没有模型指针"：`This pi session has no model yet. Request was not executed. ... Nothing to install: the pi runtime ships inside duoduo.`（`daemon.pretty.js:72354` 一带，与前两者共用同一个错误组装函数，但分支内容完全是另一套叙事）。这印证了 v0.7.1 changelog 对 grok 的字面承诺，也说明 v0.8.0 给 pi 选的是第三条路——不是"检测后报错"，也不是"检测后降级"，而是"压根不检测，把判断权交给下一层"（confirmed，三处分支逐行核对；显式声明与 frontmatter 派生两条选择链上 pi 与 grok 同样不门控，见论点①中两处 `"pi"`（`82644`/`82653`））。
- **`available_runtimes` 由三探针 + 一次无条件 push 拼装**：会话探针遍历 `isClaudeAvailable()/isCodexAvailable()/isGrokAvailable()` 依次 push，随后**无条件** `e.push("pi")`（`daemon.pretty.js:63770`，confirmed：`aq()&&e.push("claude"), Hd()&&e.push("codex"), x2()&&e.push("grok"), e.length===0&&e.push("claude"), e.push("pi")`——pi 不经过任何门控函数，是数组里唯一一个无条件追加的成员；v0.7.1 时的 boot 日志活体印证 `available runtimes at boot { claude: true, codex: false, grok: false, grokReason: "..." }` 对前三者仍成立）。

### 论点③　命令层不假装对等：undo/model/compact 按 `runtime === "claude"` 诚实分叉，grok 走独立的 ACP rewind

**所以呢**：这是本子系统最关键的状态机分叉。因为 Claude 会话是 append-only jsonl（只能"算 cutoff → 下次 drain 才 fork 新 session"），而 Codex app-server 原生支持同步 `thread/rollback`，同名命令在"何时生效、session 是否连续"上根本不同。Grok 又是第三种形态——ACP 协议原生没有"rollback"，duoduo 自己在其上叠了一层"rewind"语义。PM 若设计撤销/回滚体验，不能承诺跨后端统一。

> **v0.8.0 更新（confirmed，代码证据）：`/undo` 整条命令与 Grok 的 rewind 机制已从 daemon 里整体移除。** 全仓检索 `cutoff_message_uuid`/`pending_undo`/`thread/rollback`/`GROK_ACP_REWIND_*` 均为零命中；history-control 命令层的新版本（`vft`（`72113`））现在只识别 `/compact` 一种命令，其余（含 `/undo`）一律落到 `` ✗ Unrecognized history-control command: ${r}. `` 的兜底分支。下面两条 `/undo`/Grok-rewind 的机制描述保留作为 **v0.7.1 及更早的历史基线**，其引用的行号/短名均未随 v0.8.0 重新核对，不代表当前行为。

- **（v0.7.1 及更早基线）Grok /undo——供应商扩展方法拼出的"倒带"**：`GROK_ACP_REWIND_POINTS`/`GROK_ACP_REWIND_EXECUTE`（`_x.ai/rewind/points`/`_x.ai/rewind/execute`）两个扩展方法配合 `parseGrokRewindPoints`（v0.7.1 短名 `wme`，解析响应体里的 `rewindPoints`/`rewind_points` 数组）与 `pickGrokRewindPromptIndex`（v0.7.1 短名 `vme`，从去重排序后的 `promptIndex` 集合里数第 N 个往回取；两者连同 `GROK_ACP_REWIND_*` 常量在 v0.8.1 bundle 里已零命中，故不再给行号）——即 duoduo 自己去查一个"可回退点"列表，再选一个目标点执行 rewind，语义上更接近 Codex 的同步 rollback（有明确的目标点、同 session 内生效）而非 Claude 的延迟 fork（未见 grok 侧有 `sessionIdChanged`/cutoff 类字段，confirmed 机制存在，具体 UX 文案未逐行核对，标注 未证实推测）。

- **（v0.7.1 及更早基线）`/undo`——Claude 延迟成 fork、Codex 同步 rollback**：Claude adapter `undo()` 只扫 jsonl 算 `cutoff_message_uuid`，返回 `{kind:"succeeded", runtime:"claude", sessionIdChanged:!0, cutoff_message_uuid:f}`，不真正改历史；命令层 `qet`（v0.7.1 行号 64052，该命令 v0.8.0 已移除，见上方更新块）写 `pending_undo:{from, upToMessageUuid, requested_at}`，回 `↩️ Undo queued (...)`；真正的 `V5e(he.from,{upToMessageId})`（forkSession）推迟到 drain 头部执行，守卫 `X.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)`，失败则保留 `pending_undo` 并中止 drain。Codex adapter `undo()` 直发 `thread/rollback{threadId, numTurns}`、同步生效、`sessionIdChanged:!1`；drain 头部 else 分支 `X.pendingUndo && n.runtime !== "claude" → (X.pendingUndo=void 0, Ii(...,"pending_undo"))`清掉 codex 会话遗留的 pending（confirmed，逐行核对，均为 v0.7.1 基线）。
- **`/model`——Claude 试图即时、Codex 只能延迟 fork**：`setSessionModel` 内 `if (V === "codex")`（`V = await I(w, F)`）→ 写 `rt(...model_runtime: P!==null?"codex":null, pending_model_fork:!0)` 并返回 `applied:"stored"`（`85333-85345`）；claude 路径 `Re="stored"; setModel 成功→Re="live"`，写 `model_runtime:"claude", pending_model_fork:null, applied:Re`（`85370-85401`）。codex 回执 `Codex session — a switch takes effect from the next message.`（`87631`/`87703`）。runtime flip 时经 `!(i ? i!==o : o==="codex" || o==="pi")` 守卫清空 `model/model_runtime/pending_model_fork`（`72293-72296`）（confirmed）。
- **codex 侧 fork 时序的落地（与 claude `V5e` 对称的另一半）**：codex thread 生命周期三分支（`createCodexAppServerAdapter (yw)`（`62106`）内）——`forkFrom → "thread/fork"`、`sessionId → "thread/resume"`、else → `"thread/start"`（fork 失败另有 `thread/fork failed, falling back to thread/start`（`62112`）回退）；`kft`（`72304-72324`，日志 `resolved pending_model_fork at codex drain start`（`72319`））在 drain 起点把 `forkFrom` 设为当前 sessionId，才让 codex 的 model 切换在下一条消息 fork 生效（confirmed）。
- **`/compact`——门控只锁 claude，实际抵达回执的是 codex**：外层守卫 `ae.event.routing_hint?.intent === "history-control"`（`70994`）；内层 `if (ou === "/compact" && (n.runtime === "claude" || n.runtime === void 0))`（`71011`）→ `Eo(t)==="channel" ? Ze=!0 :（发 "only available in interactive sessions" + continue）`（`71012-71014`）。`Eo`（`71438`）把 `job:→"job"`、`meta:→"meta"`、`system:|cadence:→"system"`、含 `:` → `"channel"`，否则 unknown。**codex 根本不进这个拦截块**（守卫限 claude/void），落到命令层 `vft`(`72113`)→ `r.compact()` → `📦 History compacted (runtime: ${o.runtime})`（`72128`）。所以：claude channel 走 `Ze=true` 透传 SDK 原生（不产该串），claude 非 channel 被拦，唯 codex compact 抵达 `vft`（`72128`）的回执（confirmed，codex 路由链已补全）。

### 论点④　骨架靠复用而非抹平：一套指令 + 一套溯源跨后端，但权限/thinking 面故意不对等

**所以呢**：duoduo 不为每个后端各维护一份指令与会计口径，而是靠共享的 prompt 装配器 + symlink + protocol 分桶让指令与 token 溯源跨后端归位；但它*不*把权限模型与工具/thinking 可见性也抹平——codex 有沙箱枚举与 reasoning 退订开关，claude 侧工具面则从 v0.5.10 起由 denylist 翻转为 allowlist，两后端的安全/可观测面是诚实的不对等。

- **v0.7.1 起六层 system-prompt 装配被拆成独立的可复用函数 `renderPromptLayers (Ahe)`（`daemon.pretty.js:55093-55118`）**：`buildSystemPromptForChannelConfig (Wh)`（`55120-55129`）现在只是等 `Lde(e,t,n,r,i)` 拼好六层文本之后再按 `prompt_mode==="override"` 决定原样返回还是包成 `{type:"preset",preset:"claude_code",append:s}`——**装配逻辑与"包不包 Claude Code 预设壳"被拆成两步**，为 grok/codex 复用同一套装配文本而不复用 Claude 专属的 preset 包壳结构铺路（§1 已确认 codex 复用同一段文本、只多套 `<aladuo:system-context>` 壳；grok 的握手同样传入 `systemPrompt` 字段，可合理推断复用同一函数，confirmed 重构存在，grok 调用点未逐行标注故整体标 confirmed/复用意图 未证实推测）。
- **`ALADUO_TOOL_NAMESPACE="aladuo"`（`62725`，v0.7.1 新增）钉住 duoduo 自有工具在模型可见工具列表的顶层位置**：Codex 侧把 duoduo 的工具作为 `dynamicTools:[{type:"namespace", name:"aladuo", ...}]` 挂载，并设 `config:{"features.code_mode.direct_only_tool_namespaces":["aladuo"]}`（`62082`/`62725`）——防止 duoduo 的工具被 Codex 的 code-execution shim 折叠进模型看不见的间接调用层，是 v0.7.1 changelog "Codex tools stay where the model can see them" 的落地机制（confirmed）。

- **同一套指令**：codex 会话启动 `RV`（`61887`）若工作目录有 `CLAUDE.md` 而无 `AGENTS.md`，自动 `await n.symlink("CLAUDE.md","AGENTS.md")`（日志 `[codex] created AGENTS.md symlink`（`61892`））——让一套 system 指令喂两个后端（confirmed）。
- **同一套溯源，两套口径**：usage 按 `t.usage.protocol`（`36839`）分桶——`anthropic → cache.anthropic.{drains,cache_read_tokens,cache_create_tokens,fresh_input_tokens}`；`codex → cache.codex.{drains,input_tokens,cached_tokens}`；其余 `unsupported_drains++`。Anthropic 有 cache_creation、Codex 只有 cached，口径不同但都落回同一 drain record（confirmed）。
- **认证来源三态 + `claude_code_local` 短路**（仅 host 模式）：`Zct(e)`（`89029`）三值枚举 `claude_code_local|anthropic_api_key|compatible_endpoint`；env 读取 `X6`(`89033`)取 `ALADUO_CLAUDE_AUTH_SOURCE ?? ALADUO_AUTH_SOURCE`，经 `Zct` 校验非法值→void 0。分派体 `t === "claude_code_local" → return e`（`89118`，提前返回不注入 ANTHROPIC_*）；否则 `for (n of tyt){ let r=qn(n,null); r.source!=="unset" && (e[nyt(n)]=r) }`（`89119-89122`）注入覆盖。活体 `duoduo daemon config` → `claude_auth_source: claude_code_local (env)`，与短路路径一致（confirmed，含活体印证）。
- **claude 工具面 v0.5.10 起由 denylist 翻转为 allowlist**：旧的 `DEFAULT_DISALLOWED_TOOLS` 黑名单已**移除**，改为固定核心集 `CLAUDE_CORE_TOOLS (Vh)`（`55516-55534`）+ channel descriptor 的 `claude.tools` 嵌套键按需追加可选工具；`splitDisallowedToolsForClaude (The)`（`54950-54958`）按 `mcp__` 前缀把工具名拆成 `{mcpTools, builtIns}`（confirmed）。
- **v0.8.2：核心集从 16 个缩到 15 个，`TaskOutput` 整个消失（confirmed）**。字面量现为 `["Bash","Read","Write","Edit","Grep","Glob","Agent","TaskStop","Skill","ToolSearch","TaskCreate","TaskGet","TaskUpdate","TaskList","SendMessage"]`（`55522`）。这不是 duoduo 的裁剪决定，而是上游 Agent SDK（0.3.266 → 0.3.278）撤掉了那个"轮询后台 agent 输出"的内置工具；`TaskOutput` 在整个 v0.8.2 daemon bundle 里 0 次出现，v0.8.1 里则出现 1 次（即该字面量本身）。后台 agent 改为完成时上报，而这正是 duoduo 一直在用的机制，所以调用面无需适配。
- **duoduo 向 codex 叠加自有工具，但 codex 内置工具不可禁用**：`disallowedTools` 被显式忽略并告警 `[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled`（`62055`）；另一面握手中 `experimentalApi: !!n.dynamicTools?.length`（`62001`/`62041`，**两处 initialize 站点**）门控，随后 `for (g of n.dynamicTools) h.set(g.name, g.handler); r.setToolHandlers(h)`（`62006-62007`/`62046-62047`，两个站点各一处）（confirmed）。
- **权限与 thinking 面故意不对等**：codex 沙箱经 `sg()`/`ALADUO_CODEX_SANDBOX`（`61847`）映射 `read-only | workspace-write(默认) | danger-full-access`，握手固定 `approvalPolicy:"never"`（`62065`/`62088`/`62098`）；`optOutNotificationMethods`（`62002`/`62042`）显式退订 codex 的 reasoning 增量流（`item/reasoning/*Delta`），直接决定 codex thinking 是否回传前端。claude 侧无对应沙箱枚举与退订开关——这是"两后端权限/推理可见性不对等"的开关点。v0.6.0 起 `/effort` 让每会话独立设定推理力度（levels `Ui = ["low","medium","high","xhigh"]`（`31538`）；网关命令处理 `"/effort"`（`87680`），经 `getSessionEffort`/`setSessionEffort`；`reasoningEffort` 随 run-config 下达），而 v0.5.10 修复了流式 Claude turn 误将 thinking 强制关闭的 bug——claude 侧 thinking 现按会话推理力度如实回传（confirmed）。

---

### 证据表

| 机制主张 | 证据（字面量/代码片段） | 位置 | 置信 |
|---|---|---|---|
| runtime 枚举扩到 claude/codex/grok/pi，三处独立常量早已合并为单一权威源 | `L0 = ["claude", "codex", "grok", "pi"]`（全文件唯一一处四值字面量；v0.7.1 时为 `Ex`/三值）；成员判定 `F0` 即 `L0.includes(e)` | `L0`（`31664`）；`F0`（`31611`） | confirmed |
| pi 无独立可用性探针 | claude/codex/grok 各有 `probeClaudeAvailability`/`checkCodexAvailability`/`checkGrokAvailability` + 结果缓存 + 测试注入，pi 没有对应物（`PiAvailab` 忽略大小写全文件 0 命中）；worker 入口由 `eS` 解析：`pi-worker.js` 存在则以 `process.execPath` 运行，否则回退 `tsx` + `IH(e, "pi", "worker.ts")`，内嵌 spawn | `eS`（`72713`）；`IH(e, "pi", "worker.ts")`（`72721`）；`workerCommand: eS()`（`84487`/`84996`/`85844`）+ 全文件 grep | confirmed |
| 默认 runtime 由 ALADUO_DEFAULT_RUNTIME 决定，回退 claude | `Co(e = process.env)`：非字符串或 trim 后空串 → `"claude"`；`Aa(n) ? n : "claude"`（`Aa` → `F0` → 枚举数组 `L0`） | `Co`（`31733-31738`）；`Aa`（`31729`）；`L0`（`31664`） | confirmed |
| claude=进程内 SDK（顶层静态 import，无子进程） | `import { query as She } from "@anthropic-ai/claude-agent-sdk"` | `She`（`54942`） | confirmed |
| claude 可用性=CLAUDE_CODE_EXECUTABLE 短路 → 平台白名单 → 原生二进制 resolve | `$he`：`if (Zv(process.env.CLAUDE_CODE_EXECUTABLE)) return;`；6 种平台白名单外抛 `unsupported platform`；`for (let l of a) try { u = s.resolve(...) }` 兜底 | `$he`（`55039`）；`Zv(process.env.CLAUDE_CODE_EXECUTABLE)`（`55040`）；`unsupported platform`（`55045`）；`u = s.resolve`（`55058`） | confirmed |
| 探测引擎 probeClaudeAvailability：5s 超时 + 结果缓存 + in-flight 去重 | `Promise.race([t, n])`，超时 `Ehe = 5e3`；结果缓存 `dc` + in-flight promise `xf` 双去重，`isClaudeAvailable (hB)` 读 `dc?.ok` | `probeClaudeAvailability (Che)`（`54990-55018`）；`Ehe = 5e3`（`55532`）；`isClaudeAvailable (hB)`（`55020-55022`） | confirmed |
| claude 探测可注入（__setClaudeVerifierForTest 清缓存） | `mB = e, dc = void 0, xf = void 0`：替换验证器 + 清结果缓存/in-flight promise | `__setClaudeVerifierForTest (brt)`（`55035-55037`） | confirmed |
| codex=外部 CLI，探测 --version + login status（各 5s） | `r(e, ["--version"], {timeout: 5e3})`（`r` = promisify(execFile)）；`r(e, ["login", "status"], {timeout: 5e3})` 后 `(i + o).toLowerCase().includes("logged in")` | `checkCodexAvailability (Sc)`（`61850-61886`）；`"--version"`（`61857`）；`"login", "status"`（`61870`）；`"logged in"`（`61873`） | confirmed |
| codex 运行时=spawn app-server 常驻子进程 | `createCodexAppServerAdapter (yw)` 工厂内 `new a$(n.codexBinary, ...)` 实例化子进程类 `a$`：`this.proc = wst(this.binary, ["app-server"], {..., detached: !0})`（`wst` 即 `node:child_process` 的 `spawn`） | `createCodexAppServerAdapter (yw)`（`61974-62434`）；`new a$(`（`61993`/`62033`）；`a$`（`62735`）；`"app-server"`（`62751`）；`detached: !0`（`62758`） | confirmed |
| codex 探测缓存 + __setCodexAvailabilityForTests | `isCodexAvailable`/`primeCodexAvailability`/`__setCodexAvailabilityForTests` 三件套，共用缓存变量 `xV`/`EV` | `isCodexAvailable (Nf)`（`61830-61832`）；`primeCodexAvailability (Ist)`（`61837-61840`）；`__setCodexAvailabilityForTests (Tst)`（`61842-61844`） | confirmed |
| grok=外部 CLI + 常驻 ACP 子进程，v0.8.1 起探测只剩 `grok --version` 一步、不校验登录态 | `checkGrokAvailability (kc)`：`r(e, ["--version"], {timeout: Lst})` 成功即 `{ok: !0}`，失败文案 `Install it and run 'grok login'.`（v0.7.1 基线的 `grok models` + "logged in" 第二步已移除，"logged in" 现只剩 codex 一处） | `checkGrokAvailability (kc)`（`62973-62992`）；`timeout: Lst`（`62981`）；`Lst = 5e3`（`63683`）；`grok login`（`62986`） | confirmed |
| grok 适配器是闭包工厂（非 class），spawn 不带 detached | `createGrokAcpAdapter (vw)`：`t = e.grokBinary ?? "grok"`；`Ast(t, ["agent", "--always-approve", "--no-leader", "stdio"], {cwd, env, stdio})`（`Ast` 即 `spawn`；整个工厂体内无 `class`、无 `detached` 选项） | `createGrokAcpAdapter (vw)`（`63118-63675`）；`e.grokBinary`（`63119`）；`"--always-approve"`（`63401-63405`） | confirmed |
| grok 走标准 ACP + `_x.ai/...` 供应商扩展方法命名空间 | `grokAcpExtMethod (bw)`：`` `${Qye}/${t}` ``（`GROK_ACP_EXT_PREFIX (Qye)` = `"_x.ai"`）；mid-turn steering=`bw("interject")` | `grokAcpExtMethod (bw)`（`62994-62997`）；`GROK_ACP_EXT_PREFIX (Qye)`（`63688`）；`bw("interject")`（`63562`） | confirmed |
| **不对称发现：codex 不可用静默降级 claude，grok 不可用绝不降级、留到 drain 硬报错，pi 从不检测、无从降级** | codex 分支 `$r.ok ? w.runtime = "codex" : (w.runtime = "claude", 警告)`；grok 分支先 `w.runtime = "grok"`，再 `$r.ok \|\| (br = $r.reason, 警告)`、不改 runtime；pi 分支仅 `w.runtime = "pi"`，无 await/无判断/无警告 | job origin：`createSessionManager (Tgt)`（`84071`）、`w.runtime = "grok"`（`84078`）、`br = $r.reason`（`84080`）、`He === "pi"`（`84086`）；channel origin 对称：`_e.ok ? w.runtime = "codex"`（`84098`）、`ln === "pi"`（`84113`） | confirmed |
| pi 专属的晚发作失败是"没有模型指针"，不是"运行时不可用" | `This pi session has no model yet. Request was not executed. ... Nothing to install: the pi runtime ships inside duoduo.`（与 grok/claude 同在错误文案函数 `Rft` 的按 runtime 分支里） | `This pi session has no model yet`（`72354`）；`Rft`（`72352`） | confirmed |
| grok 不可用的硬报错文案在 drain 阶段抛出，定制到具体 runtime | `Rft(e, t)` 按 `t` 分支：`"Agent runtime 'grok' is unavailable. Request was not executed."` + `` Install the grok CLI, run `grok login`, then send the message again. ``；drain 中 `n.runtimeUnavailableReason` 非空时 `guidance: Rft(Pn, vr)`，`outcome: "runtime_unavailable"` | `Rft`（`72352-72356`）；`drainSessionMailbox (GSe)`（`70734-70743`） | confirmed |
| available_runtimes 由三探针 + 一次无条件 push 拼装（pi 不经门控） | `hB() && e.push("claude"), Nf() && e.push("codex"), $V() && e.push("grok"), e.length === 0 && e.push("claude"), e.push("pi")`；boot 日志 `available runtimes at boot` 里 `pi: !0` 为常量；v0.7.1 轮活体 `{claude:true,codex:false,grok:false,grokReason:"..."}` | `dat`（`63768-63771`）；`main (Nyt)`（`91520`）；隔离环境实机启动（v0.7.1 轮） | confirmed |
| 选择链 A：显式 codex/grok/pi 均直返(不门控)，派生 codex 才门控、派生 grok/pi 不门控 | `i(a, u)`：`u?.runtime === "grok"` → `"grok"`；`=== "codex"` → `"codex"`；`=== "pi"` → `"pi"`；派生 `d ??= Co(), d === "grok" ? "grok" : d === "pi" ? "pi" : d === "codex" && (await n()).ok ? "codex" : "claude"` | `QEe`（`82641-82654`）；`u?.runtime === "grok"`（`82642`）；`u?.runtime === "pi"`（`82644`）；`d ??= Co()`（`82653`） | confirmed |
| 选择链 B：partition frontmatter ?? `Co()`；不可用发 runtime_unavailable | `B = S.runtime, G = B ?? Co()`；`outcome: "runtime_unavailable", runtime_source: B ? "explicit" : "default"` | `createMetaSession (Ugt)`（`85911-85912`）；`"runtime_unavailable"`（`85931`）；`runtime_source`（`85933`） | confirmed |
| renderPromptLayers 从 buildSystemPromptForChannelConfig 中拆出为独立函数（v0.7.1） | `Ahe(e, t, n, r, i)` 拼六层文本；`Wh(e, t, n, r, i){ o = Ahe(...); prompt_mode === "override" ? o \|\| "" : {type: "preset", preset: "claude_code", append: s} }`；`Ahe` 唯一调用者是 `Wh`，drain 准备处以 `Wh(h, t, JSe(n.jobContext), n.memoryBoard, n.runtime)` 带 runtime 调用 | `renderPromptLayers (Ahe)`（`55093-55118`）；`buildSystemPromptForChannelConfig (Wh)`（`55120-55129`）；`Wh(h, t, JSe(n.jobContext), n.memoryBoard, n.runtime)`（`70320`） | confirmed（拆分本身），拆分是否为跨后端复用而设 未证实推测 |
| ALADUO_TOOL_NAMESPACE 钉住 duoduo 工具在 Codex 侧不被折叠进 code-execution shim（v0.7.1） | `u$ = "aladuo", Est = "features.code_mode.direct_only_tool_namespaces"`（`62725`）；thread 参数挂 `dynamicTools = [{ type: "namespace", name: u$, ... }]`（`62073`），start/resume/fork 三个构造器都挂 `config = SV()`（`62082`/`62092`/`62103`），`SV`（`61824`）返回 `{[Est]: [u$]}` | `ALADUO_TOOL_NAMESPACE (u$)`（`62725`）；`createCodexAppServerAdapter (yw)`（`62073`） | confirmed |
| runtime.info 暴露 daemon 身份而非模型后端（消歧，host-only） | `createDaemon (Ayt)` 构造 `{version, runtime_id, runtime_mode: "host", runtime_dir, work_dir, kernel_dir}`（`90470-90476`），`S.method === "system.runtime.info"`（`90575`）分支原样返回（带 `source_kind` 时追加 `channel_defaults`），无 available_runtimes；该方法在只读 TCP 白名单 `Xgt`（`89041`）内 | `createDaemon (Ayt)`（`90575`）；活体印证 | confirmed |
| `/undo`（Claude 延迟 fork 版）已于 v0.8.0 从 daemon 移除 | v0.8.2 bundle 中 `undo`（不分大小写）、`pending_undo`、`pendingUndo`、`Undo queued`、`upToMessageId` 均 0 次出现；history-control 处理器 `vft`（`72113`）只认 `/compact`，其余回 `Unrecognized history-control command`（`72132`） | 全文件 grep；`vft`（`72113`） | confirmed |
| Codex `/undo`（同步 `thread/rollback`）随 `/undo` 一并移除 | `thread/rollback`、`numTurns`、`sessionIdChanged` 在 v0.8.2 bundle 中均 0 次出现；codex adapter 只剩三种 thread 请求 `S = "thread/fork" ... S = "thread/resume" ... S = "thread/start"`（`62106`） | 全文件 grep；`createCodexAppServerAdapter (yw)`（`62106`） | confirmed |
| Codex /model 只能 stored + pending_model_fork；runtime flip 清覆盖 | `setSessionModel` codex 分支写 `model_runtime: P !== null ? "codex" : null, pending_model_fork: !0`、返回 `applied: "stored"`（`85333-85345`）；回执 `Codex session — a switch takes effect from the next message.`（`87631`/`87703`）；drain 起点 `Sft`（`72287`）遇 `model_runtime` 与活动 runtime 不符即清 model/model_runtime/pending_model_fork（`cleared session model override on runtime flip`（`72297`）） | `createSessionManager (Tgt)`（`85333`）；`Sft`（`72287`） | confirmed |
| codex fork 时序：thread 生命周期三分支 + drain 起点 resolve | `forkFrom→thread/fork \| sessionId→thread/resume \| else→thread/start`（`62106`）；`thread/fork failed, falling back to thread/start`（`62112`）；`resumed thread runs a different model; forking`（`62123`）；`kft`（`72304`）在 codex drain 起点写 `pending_fork_to` 并置 `forkFrom`，日志 `resolved pending_model_fork at codex drain start`（`72319`） | `createCodexAppServerAdapter (yw)`（`62106`）；`kft`（`72304`） | confirmed |
| /compact：外层 history-control 守卫 + claude 仅 channel 放行、其余 runtime 走 adapter `compact()` 回执 | `routing_hint?.intent === "history-control"`（`70994`）；`ou === "/compact" && (n.runtime === "claude" \|\| n.runtime === void 0)`（`71011`）；`Eo(t) === "channel"`（`71012`）放行，非 channel 回 `/compact is only available in interactive sessions`（`71014`）；codex 等经 `vft`（`71030`）回 `History compacted (runtime: ${o.runtime})`（`72128`） | `drainSessionMailbox (GSe)`（`70994`）；`vft`（`72113`） | confirmed |
| 认证来源三态枚举 + claude_code_local 短路 | `Zct`（`89030`）：`claude_code_local \| anthropic_api_key \| compatible_endpoint`；`X6`（`89034`）读 `ALADUO_CLAUDE_AUTH_SOURCE ?? ALADUO_AUTH_SOURCE`；boot 时 `X6(process.env) === "claude_code_local" && u(process.env)`（`91478`）以 `clearHostModelEnvVars (K6)`（`68835`）清掉宿主模型 env；`system.config` 视图 `t === "claude_code_local") return e`（`89118`）不再列 ANTHROPIC_* | `main (Nyt)`（`91478`）；`ryt`（`89107`） | confirmed（含活体） |
| claude 工具面 denylist→allowlist（CLAUDE_CORE_TOOLS + claude.tools） | `CLAUDE_CORE_TOOLS (Vh)` = `["Bash","Read",...,"SendMessage"]`（`55522`）；`splitDisallowedToolsForClaude (The)` 按 `r.startsWith("mcp__")`（`54953`）拆成 `{mcpTools, builtIns}`；`disallowedTools no longer governs built-in tools (allowlist-only via claude.tools)`（`55248`） | `CLAUDE_CORE_TOOLS (Vh)`（`55516`）；`splitDisallowedToolsForClaude (The)`（`54950`） | confirmed |
| v0.8.2 核心集 16→15，`TaskOutput` 随上游 SDK 撤销而消失 | 字面量 `CLAUDE_CORE_TOOLS (Vh)`（`55522`）不再含 `TaskOutput`；该串在 v0.8.2 bundle 中 0 次出现（v0.8.1 为 1 次） | `CLAUDE_CORE_TOOLS (Vh)`（`55522`）；全文件 grep | confirmed |
| Codex 内置工具不可禁用/disallowedTools 被忽略 | `[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled`（`62055`） | `createCodexAppServerAdapter (yw)`（`62055`） | confirmed |
| duoduo 向 codex 叠加 dynamicTools（两处 handshake 站点） | `experimentalApi: !!n.dynamicTools?.length`（`62001`/`62041`）；`r.setToolHandlers(h)`（`62007`）、`r.setToolHandlers(z)`（`62047`） | `createCodexAppServerAdapter (yw)`（`62001-62047`） | confirmed |
| codex 会话自动 symlink CLAUDE.md → AGENTS.md（仅当 CLAUDE.md 存在且 AGENTS.md 不存在） | `n.symlink("CLAUDE.md", o)`；`[codex] created AGENTS.md symlink`（`61892`） | `ensureAgentsMdSymlink (RV)`（`61887-61895`） | confirmed |
| usage 按 protocol 分桶（anthropic / codex / grok / pi） | 按 `t.usage.protocol`（`36839`）分派到 `cache.anthropic.{cache_read,cache_create,fresh_input}`、`cache.codex.{input,cached}`、`cache.grok.{input,cached,cache_create}`、`cache.pi.{cache_read,cache_create,fresh_input}`，其余计入 `e.cache.unsupported_drains += 1`（`36840`） | `jle`（`36833`） | confirmed |
| codex 沙箱枚举 + no-approval + reasoning 退订（与 claude 不对等） | `ALADUO_CODEX_SANDBOX`→`read-only\|workspace-write(默认)\|danger-full-access`（`resolveCodexSandbox (sg)`（`61847-61848`））；`approvalPolicy: "never"`（`62065`/`62088`/`62098`）；`optOutNotificationMethods`（`62002`/`62042`）退订 `item/reasoning/*` 增量 | `resolveCodexSandbox (sg)`（`61846`）；`createCodexAppServerAdapter (yw)`（`62002`） | confirmed |
| /effort 每会话推理力度（v0.6.0，thinking 面新增开关） | `Ui = ["low", "medium", "high", "xhigh"]`（`31538`）；网关 `t.name === "/effort"`（`87680`）经 `r.getSessionEffort(n, i)`（`87693`）、`r.setSessionEffort(n, a)`（`87735`）；drain 以 `effort: q.effort`（`70714`）下达 run-config，codex 侧落为 `turn/start` 的 `effort: I`（`62273`） | `createSessionManager (Tgt)`（`85427`）；`drainSessionMailbox (GSe)`（`70714`） | confirmed |
| container 模式移除（host-only）；仅类型守卫留向后兼容 | `I0`：`e.runtime_mode !== "container" && e.runtime_mode !== "host"`（`31542`），全文件唯一的 `"container"` 字面量，非活路径；`createDaemon (Ayt)` 固定 `runtime_mode: "host"`（`90473`） | `I0`（`31541`） | confirmed |
| Job frontmatter runtime schema 按可用运行时**动态**构造枚举（v0.7.1 前是静态 claude/codex），v0.8.0 起 pi 无条件追加 | `dat(){ e=[]; hB()&&e.push("claude"); Nf()&&e.push("codex"); $V()&&e.push("grok"); e.length===0&&e.push("claude"); e.push("pi"); return e }`（`63768-63770`，`hB`/`Nf`/`$V` 即 `isClaudeAvailable`/`isCodexAvailable`/`isGrokAvailable`），经 `d_e`（`63777`）喂进 `_t.enum(t)` zod 枚举、默认值 `n = e && t.includes(e) ? e : t[0]`（`63779`）即本会话 runtime 或 `t[0]` | `dat`（`63768`）；`d_e`（`63777-63781`） | confirmed |
| partition frontmatter runtime 校验改走共享枚举成员判定 `Aa`（v0.8.0 起四值），非法回退全局默认 | `Aa(a) ? u = a : a !== void 0 && Ee(... invalid runtime frontmatter; falling back to global default)`（`66229`），在分区 frontmatter 解析器 `Zut`（`66217`）内；`Aa`（`31729`）→ `F0`（`31611`）→ `L0.includes(e)`，`L0 = ["claude", "codex", "grok", "pi"]`（`31664`） | `Zut`（`66229`） | confirmed |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **探针返回**（RPC 会话探针 `pyt`）：`{ configured, session_exists, available_runtimes:("claude"|"codex"|"grok"|"pi")[], descriptor:{cwd, runtime, display_name, bound_by, require_mention}, kind_defaults:{cwd, runtime} }`；`available_runtimes` 按探测结果构造：claude/codex/grok 各自可用才加入，`pi` 无条件追加（`u() && l.push("grok"), l.push("pi")`（`89353`））；`descriptor.runtime` 经 `fyt()` 归一化后上报，非原样透传（`runtime: fyt(m.runtime ?? d?.runtime)`（`89385`））。
- **daemon 身份**（RPC `system.runtime.info`，与后端无关）：`{version, runtime_id, runtime_mode:"host"（固定，container 已移除）, runtime_dir, work_dir, kernel_dir}`（`createDaemon (Ayt)`（`90470-90476`）构造、`S.method === "system.runtime.info"`（`90575`）返回，活体实测）。
- **state.json 运行时相关字段**：`sdk_session_id`、`pending_fork_to`（codex 会话下一次 drain 从哪个 SDK session fork，`forkFrom: n?.pending_fork_to`（`72333`），在 `Rg`（`72326`）内读取；非 codex 或 stateless 时在 drain 起点清掉，`"pending_fork_to"`（`70565`））、`model`、`model_runtime:"claude"|"codex"|"grok"|"pi"`（写入 model override 时的 runtime，由 `setSessionModel` 的四个 runtime 分支写入，`createSessionManager (Tgt)`（`85289-85386`））、`pending_model_fork:boolean`（drain 起点读 `snapshotModelRuntime: U?.model_runtime`（`70567`）与 `U?.pending_model_fork`（`70570`），交给 `kft`（`72304`）处理，runtime 翻转时清掉 override）。
- **partition CLAUDE.md frontmatter**：`runtime: claude|codex|grok|pi`（四值全部接受：`Aa`（`31729`）查的是共享枚举 `L0 = ["claude", "codex", "grok", "pi"]`（`31664`）；非法值告警并回退全局默认，`invalid runtime frontmatter; falling back to global default`（`66229`））；同一 frontmatter 还含 `schedule.{enabled,cooldown_ticks,max_duration_ms}`。
- **compact 结果**（codex）：`{kind:"succeeded"|"noop"|"failed", runtime:"codex", …, triggered_at}`（codex app-server 的 `thread/compact/start`（`62380`）路径）。`/undo` 已在 v0.8.0 移除，v0.8.2 daemon bundle 中不再有 undo 的命令、结果结构或 `pending_undo` 状态字段（confirmed：v0.7.1 bundle 含 `"/undo"` 与 `pending_undo`，v0.8.0 起零命中）。
- **usage 按 protocol 分桶**：`cache.anthropic.{drains,cache_read_tokens,cache_create_tokens,fresh_input_tokens}` vs `cache.codex.{drains,input_tokens,cached_tokens}`，其余归 `unsupported_drains`（`36840`）。
- **codex app-server 握手**：`initialize{clientInfo:{title:"duoduo-runtime",name:"duoduo",version:"0.1.0"}, capabilities:{experimentalApi:!!n.dynamicTools?.length, optOutNotificationMethods:["item/reasoning/summaryTextDelta",...]}}` → `notify("initialized")` → thread 生命周期三分支（fork/resume/start）；沙箱经 `ALADUO_CODEX_SANDBOX`（`resolveCodexSandbox (sg)`（`61846`））映射 `read-only|workspace-write|danger-full-access`，`approvalPolicy:"never"`（握手 `clientInfo`（`61995`/`62035`），`approvalPolicy`（`62065`/`62088`/`62098`）三处）。

### 给 Agent PM 的洞察

> 1. **"对等抽象"是薄名字、厚差异，且这层诚实是刻意的。** runtime 是一个四值字符串（v0.7.1 起含 grok，v0.8.0 起含 pi），但 claude 是进程内 SDK（append-only jsonl）、codex 是常驻子进程 + JSON-RPC、grok 是常驻子进程 + ACP、pi 是内嵌 worker 子进程，导致同名操作（undo/model/compact/token 会计）在时序和语义上分叉。抽象层不强行抹平，而是在命令层按 `runtime` 分支显式处理——对可维护性是诚实取舍，但意味着每加一个 runtime，history-control 类命令都要补分支。v0.7.1 把"三处独立词法作用域常量"这一具体债务还清了：现在只有一处权威枚举定义，v0.8.0 加第四个值时也只需改这一处。这正是领起结论"薄名字、厚差异、诚实路由"的落点。

> 2. **v0.8.0 起运行时不再提供任何撤销命令。** `/undo` 与 Grok 的 ACP rewind 已整体移除（见论点③）。在 v0.7.1 及更早，三个后端的撤销语义本就不同：Claude 会话 append-only，只能"算 cutoff → 下次 drain fork 新 session"，必然延迟且换 session id；Codex 用原生 `thread/rollback` 原地同步撤销；Grok 靠 duoduo 在 ACP 供应商扩展方法上叠的"查可回退点 + 选点执行"。设计撤销/回滚体验不能依赖运行时提供撤销。

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

**Spine 是 duoduo 唯一的真理之源：一个纯文件 JSONL 预写日志，以「事件先原子 append 再写 mailbox 指针」的 append-before-execute 契约，把所有会话状态、去重、消费进度都变成崩溃后可从「日志 + 指针」精确重建的派生视图——零数据库，顺序靠单进程 promise 链，去重只对渠道显式给出的幂等键生效。**

一切都从这条日志派生：会话状态、去重表、消费进度、status，都不是权威数据，而是可丢弃、可从 `var/events/YYYY-MM-DD.jsonl`（按 UTC 日期分区，`wm(e)` 用 `toISOString().slice(0,10)`（`31998`）切日）加索引重放出来的物化视图。下面四个论点分别回答：**写怎么保证不丢（写路径）、重复怎么处理（去重）、崩溃后怎么读回来（读路径与恢复）、外部怎么观测（读接口与事件全集）**。

### 论点一 · 写路径：先落 WAL、再写指针，且每条事件是「WAL 行 + by_id 索引」的两写原子单元

**所以呢**：因为持久化严格早于任何副作用，崩溃后未处理的工作永远能从「mailbox 里的 `- [ ] @evt(id)` 指针 + WAL 行」精确恢复；而单条 append 其实是两次协同写入，`Nu`/`Y9e` 等下游读路径都隐式依赖索引已落盘，构成 `append → 索引 → watermark` 的固定依赖链。

**append-before-execute 的时序在代码里真的这样串联（confirmed）。** 沿网关摄入主函数 `Gle`(`87194`) 的真实控制流：`on`(`87196`) 封装事件→`sn(e,r)` 即 `atomicAppendEvent (sn)`(`87271`) 把不可变事件 append 进 Spine→`advanceConsumerWatermark (Nu)`(`87271`，同行) 推进 watermark→**之后**才在路由分支写 mailbox 指针（`"mailbox_enqueued"`（`87296`/`87306`），前者 meta 分支、后者 session 分支）。路由分叉由 `Ule`(`87055`) 决策：`routing_hint.target ∈ {gateway, meta, session}` 决定指针写到 `meta:subconscious` 还是具体 session_key。

**存在第二条同构摄入源 `route.deliver`（会话间路由投递，confirmed）。** 会话→会话的路由投递走 `Ps`(`64358-64484`) 全链：`on({type:"route.deliver"…})`(`64398-64399`) 构造事件→先 `atomicAppendEvent (sn)`(`64413`) append，后 `Xs`(`64433`) 写 `- [ ] @evt(${h.id})` 指针，且入口带 `or`(`64373`) 归档中 / `Ks`(`64385`) 已归档两道短路；`walOnly` 为真时在 append 之后、写指针之前整条短路（日志 `[route] wal-only route event (no mailbox, no wake)`（`64420`））。它与 `Gle` 是「先 append 后写指针」的同一契约，是 §4 应认清的第二类摄入源。

**单条 append = 恒定两次写入（WAL 行 + `by_id` 索引行，两次写之间不构成原子事务），且只有 `by_id` 一个索引（confirmed）。** `atomicAppendEvent (sn)`(`32043`) 只做两件事：先 `appendEventToPartition (Z9e)`(`32008`) 追加 WAL 行拿回 `{partition, byteOffset, byteLength}`，再**无条件**调 `G9e`(`32034`) 把 `{event_id, partition, byte_offset, byte_len}` 追加进 `by_id.jsonl`（路径由 `tb` 拼成 `<eventsIndexDir>/by_id.jsonl`（`32032`）），并同步更新该文件对应的内存 Map（`i.map.set(t.event_id, t)`）。**不存在按 session 切分的第二索引**：`by_session` 在整个 bundle 里零字面量出现，也没有任何模板拼接出这个路径，无论事件带不带 `session_key` 走的都是同一条两写路径（会话维度的检索靠 mailbox 里的 `- [ ] @evt(<id>)` 指针，而不是靠索引文件）。磁盘 append 与内存 Map 的同步更新是同一个函数内的两步——`advanceConsumerWatermark (Nu)` 反查偏移、`readEventByIdSeek (Y9e)` 随机读都**强依赖 by_id 已写入**，这就是 `append → 索引 → watermark` 的隐式依赖链。

**字节区间与全序（confirmed）。** `appendEventToPartition (Z9e)`(`32008`) 执行 `oR.open(i,"a")`(`32015`)→`stat().size`(`32017`，stat 早于 write) 取 **byte_offset**→`write().bytesWritten`(`32018`) 取 **byte_len**→`close`(`32026`)，故 `[offset, offset+len)` 恰为该事件行字节区间。全序由 per-file promise 链保证（应用层互斥，非 fsync/DB 事务）：`H9e`(`31988`) `.then(t,t)` 两回调相同，成功失败都续链，同一分区 append 顺序与偏移计算无竞态。**架构假设**：单 daemon 单进程写；跨进程并发写同一分区无保护。

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| 网关摄入先 append 后写指针 | `Gle`：`atomicAppendEvent (sn)`(87271)→`advanceConsumerWatermark (Nu)`(87271)→分支写 `- [ ] @evt(id)`(87296/87306) | daemon 87194-87326 | confirmed |
| route.deliver 同构（含 walOnly 短路） | `Ps`：`atomicAppendEvent (sn)`(64413，日志 "[route] route event appended")；`walOnly` 时短路进 "[route] wal-only route event (no mailbox, no wake)"(64420) | daemon 64358-64484 | confirmed |
| 路由分叉由 `aae` 决策 | `routing_hint.target ∈ {gateway,meta,session}` | daemon 80980 | confirmed |
| 单 append = WAL+by_id **恒定两写**，无 by_session 第二索引 | `sn`→`appendEventToPartition (Z9e)`(32044)；`G9e`(32034 定义/32045 调用) 无条件；全 bundle 无 `by_session` 字面量 | daemon 32008/32034/32043 | confirmed |
| byte_offset=写前 stat().size，byte_len=bytesWritten | open→stat→write→close | daemon 30666-30684 | confirmed |
| 全序=per-file promise 链 | `W6e` `.then(t,t)` | daemon 30646 | confirmed |
| UTC 日切分区 | `mk(e)` `toISOString().slice(0,10)` | daemon 30656 | confirmed |

### 论点二 · 去重：只认渠道给的幂等键，命中即幂等重放而非静默丢弃

**所以呢**：去重不看消息内容，只看渠道随消息带来的幂等键：带了键，同一个键在这台 daemon 上只会被接纳一次，重复提交回放上一次的网关回执（对渠道体验友好）；没带键，就完全不去重。键没有时间窗、不过期，表随 `dedup.jsonl` 持久化，daemon 重启后重读恢复，所以在键这一层它是精确的；但它只覆盖带键的输入，对副作用敏感的场景要确认渠道确实发送了幂等键。

**key 只有一档：`<source.kind>:<dedup.source_id>`（confirmed）。** `computeDedupKey (vse)`（`86887-86890`）的全部逻辑是：取 `t = e.dedup?.source_id`，有值则返回 `` `${e.source?.kind??"unknown"}:${t}` ``，否则返回 `null`（前缀取自 `e.source?.kind??"unknown"`（`86889`））。`dedup.source_id` 由网关摄入 `Gle` 从 `t.dedupSourceId`（`87224-87225`）写入，RPC 摄入把参数里的 `idempotency_key` 传成它（`dedupSourceId: k.idempotency_key`（`90706`/`90760`））。调用点 `o = vse(r)`（`87234`）拿到 `null` 时，紧随其后的 `if (o)` 让整段去重被跳过。由此三点：没有内容哈希、没有时间桶，同一段文字不带幂等键重复发送永远不会被判重；`channel.command` 没有特殊分支，带键就去重、不带键就不去重，与普通消息一致；key 前缀是来源种类 `source.kind` 而不是具体 channel，同一种类的两个渠道若用了相同的幂等键会被判为重复（由 key 形态推出）。按内容哈希 + 5 分钟时间桶去重的旧逻辑在 v0.8.0 移除（v0.7.1 bundle 仍有 `:text:` key，v0.8.0 起只剩上面这一档）。

> **唯一一条有意不走 WAL 的跨进程状态**（confirmed）。`<varDir>/daemon-restart-reason.json` 是个例外：CLI 在停掉旧 daemon **之前**原子写入 `{reason, requested_at, requested_by_agent}`（v0.8 起还可带 `wake_targets`（`65800`）），新 daemon 的 `main()` 在 `claimDaemonRestartReason (Fbe)`（`65786`）里读一次、**在 JSON.parse 之前就无条件删除**（`Lbe.rm(t, {force: !0})`（`65794`））、经 setter `zbe`（`65812`）存进模块级全局 `q$`（`65819`），再由 `daemon-restart-hint` 瞬态块带给 channel 会话（见 §1 论点二）。它没有事件 ID、没有 `by_id` 索引、没有 TTL、没有 daemon 身份标识——任何一次启动都会认领当时躺在那里的文件，畸形文件被销毁且无日志。破例的理由成立：**它必须在 daemon 存在之前就写好**，而 WAL 的写入者是 daemon 自己。代价是这条通道不可重放、不可审计。

**命中即幂等重放（confirmed）。** `Gle` 重复分支：`f.duplicate && f.existing?.event_id`(`87241`) → `Md(e, f.existing.event_id, {notAfter})`(`87242`) 取回原事件 → `Um`(`87246`) 以 `Um(e, p.id)` 反查该事件上次生成的 gateway outbox 记录 → 返回 `{deduplicated:true, gatewayResponse:m?.payload.text, gatewayOutboxId:m?.id, routing.enqueued:false}`（`87253-87256`）。`Um`(`36021`) 按 event_id 反查 outbox：内部先经索引加载器 `sXe`(`36070`) 取 `Map<event_id,…>`，命中后再经 `La` 读出具体 outbox 记录。**不重写 mailbox、`enqueued:false`** 均确认——把完整网关回执重放给渠道，这是「去重即幂等重放」的产品语义。

**v0.8.2 起不再有容量上限，"满即整表 clear"已整体移除（confirmed）。** 去重存储类 `mR`(`86827`)，磁盘日志经 `OXe`(`87049`) = `registryDir/dedup.jsonl`(`87050`)，**全 daemon 只有这一个文件**（不按天分区，`zle`(`87052`) Map 以路径为键缓存实例）。`record()`(`86868`) 现在无条件 `this.entries.set(t.key, t)` 后追加一行，**没有任何淘汰分支**；`maxEntries` 这个标识符在 v0.8.2 全仓 0 次命中（v0.8.1 为 3 次）。代价与收益都随之翻转：进程生命周期内的去重从"近似"变成**精确**（旧 key 不再被一次 clear 抹掉），但内存 Map 从此随 `dedup.jsonl` 单调增长，没有上界；`by_id` 仍不参与 dedup 判定。

**同一次改动里，装载从"一行坏字节毁掉整次读"变成逐行跳过（confirmed）。** v0.8.1 的 `load()` 把整个文件读成字符串、`split("\n")` 后对每行裸 `JSON.parse(r)`——**没有 try/catch**，所以一条被截断的行（崩溃或并发追加留下的半行）会把异常抛出 `load()`，整个去重表装载失败。v0.8.2 改为流式逐行读 `S5e(this.filePath)`（`86840`），每行单独 `try{JSON.parse}catch{t++;continue}`（`86844-86847`），再加一道字段校验 `typeof i?.key!=="string"||!i.key`（`86850`），最后把跳过的行数汇总成一条 `[spine] dedup store ${this.filePath}: skipped ${t} unreadable line(s)`（`86860`）。**坏行被记账后跳过，而不是静默吞掉，也不再拖垮整次读**——这与上面取消容量上限是配套的：既然表不再定期清空、文件只增不减，单行损坏的期望次数就随时间上升，容忍它才有意义。

### 论点三 · 读路径与恢复：索引随机读 + 消费者 watermark + rehydrate，把「日志 + 指针」还原成活会话

**所以呢**：正因为写侧同时落了索引，读侧才能 O(1) 随机读、消费者才能续跑、进程重启才能从文件重建活会话集——这是「派生视图可重建」这条塔尖结论的兑现方式。

**索引与随机读（confirmed，v0.8.1 复核结论有更正）。** 全仓检索 `by_session` 字面量已零命中（新旧两版 `eventsIndexDir` 下都只挂了一个索引文件），**"两个 append-only 索引"这一旧描述不成立**：只有单个 `by_id.jsonl` `{event_id, partition, byte_offset, byte_len}`（路径 `tb`(`32031`)，写入侧 `G9e`(`32034`)，字段体见 `atomicAppendEvent (sn)`（`32046-32050`）内的 `G9e` 调用点）懒加载入内存 Map 并随 append 增量更新，支撑随机读 `read(o,0,t.byte_len,t.byte_offset)`（随机读实现 `K9e`(`32060`)，读在 `i.read`(`32067`)，经派发器 `readEventById (Md)`(`32052`) 对外暴露）。首次访问由 `e5e`(`32122`) 整文件流式 load 进 Map（缓存槽 `X9e`(`32109`)），之后随 append 增量更新——**这正是「随机读 O(1)」的前提**。两级回退（机制 confirmed）：索引命中但按偏移读不出该事件时，`K9e` 在同一分区文件内顺序扫描（`rse`（`32076`）调用点）；索引未命中且调用方给出 `notAfter` 时，`readEventById (Md)` 退到 `scanPartitionsForEventId (Y9e)`(`32078`)，按日期倒序逐个分区顺序扫描，没有 `notAfter` 则直接返回 `null`。

**v0.8.2：索引条目先过合法性闸门，再进 Map（confirmed）。** 新增纯函数 `isUsableEventIndexEntry (Q9e)`（`32119-32121`）：`e?.event_id ? Number.isSafeInteger(e.byte_offset) && e.byte_offset >= 0 && Number.isSafeInteger(e.byte_len) && e.byte_len > 0 : !1`。`e5e` 在流式装载时逐行 `Q9e(o) && t.map.set(o.event_id, o)`（`32130`），**不合法的条目被丢弃而不是入表**。这条守卫的意义在读侧：`K9e` 拿到条目就直接 `read(fd, 0, byte_len, byte_offset)`，一个负数、非整数或越界的 `byte_offset` 过去会变成一次越界随机读（读出错位字节再 JSON 解析失败，或更糟——静默返回错误事件）；现在它在装载阶段就被挡下，落到 `Y9e` 顺扫兜底。v0.8.1 全仓无 `byte_offset >= 0` 字面量，v0.8.2 有且仅有此一处。指针化的价值：mailbox 只存 `@evt(id)` 不存正文，避免正文双写与漂移。

**消费者 watermark（confirmed）。** `advanceConsumerWatermark (Nu)`(`32858`) 先 `nb`(`32859`/`32095`，前为调用 `nb(e,n)`、后为定义) 经 by_id 反查偏移，再经 `I5e`(`32855`) 写 `R5e`(`32852`) 拼出的 `run/queue_offsets/<consumer>.json`，字段 `{updated_at, partition, byte_offset, last_event_id}`（活体 `jobs.json` 逐字段吻合）。全部 `hl()` 调用点仅 6 处，对应三个消费者：

| consumer | 触发点 | 语义 | 置信 |
|---|---|---|---|
| `gateway` | 81196 | **网关摄入管线(`Gle`)的高水位，对每一条经 `Gle` 摄入的事件在路由前无条件推进**，覆盖全部摄入事件；非「仅 gateway-targeted 同步不入队」| confirmed |
| `jobs` | 80466 | **由每次 cadence 扫 due-job 的 `system.cadence_tick` 事件推进**（该调用点紧随 `sn` 落库同一条 cadence_tick 事件，并在同一表达式里把 `cadence.last_tick`（`86466-86472`）写进 status）；非「由 `job.spawn/complete/fail` 推进」| confirmed |
| `meta_session` | 79937/80188/80212/80311 | 由潜意识/meta partition 事件推进（分别对应 runtime-unavailable skip、partition completed、non-success settle、以及 meta 会话自身的一条） | confirmed |

  - jobs 的决定性活体证据：`jobs.json` 的 `last_event_id=evt_7e3d…` 在 events 文件里正是 `{"type":"system.cadence_tick",…count:0}`。job 到期扫描本身就是 cadence 循环的一环，故 jobs watermark 挂在 cadence tick 上。
  - gateway 的活体证据：`gateway.json` 的 `last_event_id` 指向一条 `channel.message`（普通摄入事件，非 gateway-targeted 专有）。

**持久化分层（confirmed）。** 消费者进度放**易失 `run/`**（`runQueueOffsetsDir`（`32853`/`66168`）；重启可从 WAL 重建），会话游标/state 放**持久 `var/`**（`sessionsDir`；会话身份必须跨重启）。活体 `run/queue_offsets/{gateway,jobs,meta_session}.json` 三消费者齐全——这是「运行时进度 vs 实体身份」的干净范式。

**rehydrate（confirmed，一处未证实）。** `cse`(`32340`) readdir `sessionsDir` → 逐个读 `<hash>/state.json` 的 `session_key`(`32354`) 重建活跃会话集。自愈写回：缺 `session_key` 时遍历 `registrySessionsDir`(`32360`)、`decodeURIComponent`(`32363`)、`Oo`(`32364`) 算出的哈希等于目录名即反解成功，**写回 state.json 在 `d.session_key = l`(`32368-32370`)**。resume 失败 append `agent.error{stage:'resume'}`(`70942`/`71280`, `source.kind='runner'`) 留痕。state.json 的 `schema_version:2` 本轮未在调用链独立复核——**标未证实推测**。

### 论点四 · 读接口与事件全集：spine.tail 尾读 + 十一类落库事件

**所以呢**：外部只能通过 `spine.tail` 观测这条日志，且并非所有 RPC/bus 事件都会落库——只有经 `on`+`sn` 构造的才是 Spine 权威事件，这条边界决定了「真理之源」到底包含什么。

**spine.tail 尾读（confirmed，活体已验证）。** `nve`(`88999`)：`limit = Math.min(Math.max(t?.limit ?? 200, 1), 500)`(`89000`)。读取器 `tve`（`88960`）不把分区读进内存再找下标，而是经 `But`（`88933`）从文件末尾按 `blksize` 块**倒着逐行**读（`for await (let p of But(o, u ?? 0, s, a))`（`88968`）），边读边收集，最后 `reverse()` 成正序返回。无 `after_id` → 读到 `c.length > n` 即停，返回最新 N 条，`has_more: c.length > n || …`（`88986`）。有 `after_id` → 先由 `Vut`（`88945`）经 by_id 索引定位游标事件，偏移合法且该行 id 吻合时，把游标行末作为倒读的下界；否则倒读途中遇到 id 等于游标的那一行（`h?.id === r`，在 `tve`（`88978`）内）即停。因为是从末尾倒读，当日分区上收满 `n` 条也会停（`c.length > n && (l || !i)`（`88982`）），所以游标之后的事件多于 N 条时返回的是**最新的** N 条并置 `has_more`，不是紧跟游标的 N 条。当日既没找到游标也没收满时，`s.setUTCDate(s.getUTCDate() - 1)`（`89008`）回退前一日分区，以剩余额度继续倒读直到找到游标，找到才拼接 `[...a.events, ...o.events]`（`89011`），找不到只返回当日结果。活体 `spine.tail limit:3` 现返回 `agent.tool_use/agent.tool_result`（`source.kind=meta`, `name=subconscious:memory-committer`, `session_key=meta:subconscious`）——**此为取样示例，返回何种事件取决于探测时点**（原文「3×system.cadence_tick」同理只是彼时取样）。

**事件类型全集（含 `route.deliver`）。** 经 `on` 封装并 `sn` 落库的合法 Spine 事件：

```
channel.message / channel.command / channel.attached
agent.result / agent.error / agent.tool_use / agent.tool_result
job.spawn / job.complete / job.fail
system.cadence_tick
route.deliver                                 ← 会话→会话路由投递，tn(49150)
```

`GROUND_TRUTH` 中的 `channel.ack/ingress/pull/spawn/describe`、`session.*`、`job.completed/spawned` 等**未见** `on`+`sn` 构造点，属 RPC/bus 而非 Spine 落库，原文正确地未纳入。潜意识产出**复用** `agent.result`：`source.kind=meta`, `name=subconscious:<partition>`(`86177`), `payload.tick_type='subconscious'`(`86182`)，活体亦印证。

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| spine.tail limit clamp [1,500] 默认 200 | `Bue` `clamp(...??200,1,500)` | daemon 77105 | confirmed |
| after_id 未命中回退前一日 | `setUTCDate(-1)` + 拼接 | daemon 77128-77135 | confirmed |
| 落库事件含 route.deliver | `createSpineEvent (on)`(64398)+`atomicAppendEvent (sn)`(64413) | daemon 64358-64484 | confirmed |
| 潜意识复用 agent.result | `tick_type:'subconscious'` | daemon 74435/74440 | confirmed |

> **给 Agent PM 的洞察**
> - **真理之源 = 纯文件 JSONL WAL，零数据库依赖**：所有派生态（会话状态/去重/消费进度/status）都可从「日志 + 指针」重建，极简、天然可审计、git-friendly——这正是本节塔尖结论的运营含义。
> - **append-before-execute 是可靠性契约的基石，且有两条摄入源**：网关摄入（`Gle`）与会话间路由（`route.deliver`）都遵守「先原子 append、再写 `- [ ] @evt(id)` 指针」；崩溃后从「mailbox 指针 + WAL」精确恢复未处理工作，mailbox 只存指针不存正文。
> - **单条 append 是恒定两写原子单元**：WAL 行 + by_id（无条件；不存在按 session 切分的第二索引），下游 watermark 反查与随机读强依赖索引已落盘；要横向扩展写侧，必须同时打破「单进程 promise 链保序」与「索引同步」两个假设。
> - **去重只认渠道给的幂等键、命中即幂等重放**：key 只有 `<source.kind>:<dedup.source_id>` 一档，不带幂等键的输入（无论普通消息还是 `channel.command`）一律不去重；键不过期、随 `dedup.jsonl` 持久化并在重启后恢复，v0.8.2 起也不再有容量上限与整表 clear；命中回放上次网关回执（`deduplicated:true`, `enqueued:false`）。对重复副作用敏感的场景，产品侧要确认渠道确实发送了幂等键。
> - **watermark 语义要看清挂点**：`jobs` 游标挂在 `system.cadence_tick`（因 due-job 扫描是 cadence 一环），`gateway` 是整条摄入管线的高水位而非「目标同步」标记——误读会导致对「谁消费到哪」的错误运维假设。
> - **持久化分层（run/ 可重建 vs var/ 必须留存）** 是区分「运行时进度」与「实体身份」的干净范式；UTC 日切分区同时是潜意识 scan-gap「做梦」的工作单元，日志分区即时间盒。


---
## §5 Gateway 边界 / RPC / 通道协议

**Gateway 是 daemon 的控制面：它把所有外部输入收敛为 if/else 分发的 JSON-RPC，入站即按斜杠命令 / intent 分流（gateway 内联短路 / session 唤醒 / meta 潜意识），并以「先落 spine 日志 → 再追加 Markdown 邮箱 → 最后 emit `session.wake`」的 WAL-before-enqueue 时序保证崩溃可重放，对外用零依赖 protocol 契约同时支持 HTTP 拉（drain）与 WS 推（订阅 + backlog 回放）两种通道形态——它是整个 agent「输入可靠化与是否动用模型」的边界闸门。v0.7.0 起控制面从「单 loopback 端口、无鉴权」拆成「TCP 只读 + unix socket 全权 + 可选 token 网关」三层监听器共享同一套路由逻辑，鉴权模型也从「本机单用户假设」的隐式信任变成「文件系统权限（socket）/ 方法白名单（TCP）/ bearer token（可选远程）」的显式三层，详见 ARCHITECTURE §10.2。**

下面四个论点自上而下支撑这句结论：控制面的**形态**（三监听器共享路由 + if/else 分发）→ 入站的**分流闸门**（能不进模型就不进）→ 可靠性的**时序契约**（WAL-before-enqueue）→ 对外的**双通道数据面 + 契约包**。

---

### 论点 1 · 三监听器、一套共享路由：if/else 分发链未变，鉴权模型从隐式变显式

**所以呢**：v0.7.0 之前，整个 daemon 对外只有一个可确定的物理边界——一个绑在 `127.0.0.1` 的端口、一条巨型 if/else 链，安全边界完全押在「本机单用户」假设上。v0.7.0 把这个边界拆成三层监听器（详见 ARCHITECTURE §10.2 的 TCP 只读 / unix socket 全权 / 可选 token 远程），但**没有把 if/else 分发链拆成三份**——三个监听器全部由同一个路由构造闭包 `R(app,{hostGuard,readOnly,bearerToken})`（`daemon.pretty.js:91131-91374`）挂载路由，只是分别传入不同的 `{hostGuard,readOnly,bearerToken}` 参数（三次调用见 `hostGuard`（`daemon.pretty.js:91375-91381`/`91428-91432`））。这让"审计一条 if/else 链"的心智模型继续成立，只是现在要多问一句"这条链挂在哪个监听器、`readOnly` 是否为真"。

- **`readOnly` 参数是新的核心分支点。** 只读模式下 `/ws` 直接 426（引导去 socket）、`/rpc` 只放行 `system.status/usage.get/job.list/spine.tail/system.runtime.info/system.config` 六个方法（白名单 `Xgt`（`89041`）；其余 `-32601`，HTTP 200，非连接层拒绝）；`/healthz`/`/dashboard`/`/readyz` 三个端点不受 `readOnly` 影响，任何监听器都注册（`S.get("/healthz"|"/dashboard"|"/readyz")`（`daemon.pretty.js:91176-91184`））。三次调用分别是：`R(t,{hostGuard:!0,readOnly:!0})`（`91375-91377`）挂常驻 loopback TCP、`R(n,{hostGuard:!1,readOnly:!1})`（`91378-91380`）挂 unix socket、可选 `R(r,{hostGuard:!1,readOnly:!1,bearerToken:D.token})`（`91428-91431`）挂 opt-in 远程监听器。
  - **`readyz` 语义要点**：探针实为「能否 append 到 events 日志文件」（打开当日 events jsonl 追加句柄再关闭），未就绪回 `503 not_ready`——它探的是 spine 写入能力，而非泛化的「服务活着」（confirmed，具体探针函数行号需结合 §5 论点 3 的 `Gle` 一带核对，未逐字重新定位，标注**未证实推测**具体行号，机制本身 confirmed）。
  - **20234 / save-api 仍不存在**：本轮 grep `20234|save-api|save_api` 三 bundle 皆空（confirmed，静态复核，未重新活体探测非默认端口）。

- **RPC「注册表」在共享路由闭包 `I()` 内部仍是一条 if/else 链，不是 Map。** 方法白名单判定、方法分发、`-32601 Method not found` 兜底，全部在同一个函数体内逐个 `h.method` 字符串比较——**这条链本身没有因为三监听器化而拆分或复制**，只是外面多包了一层 `readOnly` 早退分支。方法覆盖面（system.\*/session.\*/channel.\*/job.\*/usage.get/spine.tail）与 v0.6.2 时代一致，未见新增/删除顶层方法族（除去只读白名单本身是新增概念）。

- **请求体守卫 `isJsonRpcRequest`（protocol 导出）**：`{jsonrpc:"2.0", method: string}` 校验，未过直接 `400`（HTTP 传输）或 `-32600 Invalid Request`（WS 传输）——两条传输的失败形态不同，这一层机制未变。入参校验用 protocol 导出的 `isXxxParams` 守卫，失败抛 `-32602`；未捕获异常统一 `-32603 Internal error`。

- **`system.shutdown` 能直接自杀，且在三个监听器上都可达（只要不是只读白名单挡住的那个）。** `__triggerShutdown → setImmediate(()=>process.kill(process.pid,"SIGTERM"))` 在共享路由链内只有一处实现；因为它不在只读白名单（`system.status/usage.get/job.list/spine.tail/system.runtime.info/system.config`）里，**只读 TCP 监听器上调用它会被 `-32601` 挡下**——这是 v0.7.0 之后"能自杀"这条能力被收窄到 unix socket / token 网关的一个具体例证，值得单独记一笔：控制面拆分不是把每个方法都重新分类过一遍，而是"只读白名单之外全部收紧"的一刀切策略。

---

### 论点 2 · 入站即分流闸门：斜杠命令 / intent 决定「要不要动用模型」

**所以呢**：这是本节最值得抄的一条。routing target 三态（`gateway` / `meta` / `session`）在**入站边界**就决定一条消息要不要真正唤醒一个 agent。`/status /config /model /effort /debug` 这类命令在网关层被内联短路、根本不进模型；只有带内容的消息才唤醒 session。对话式 agent 想省 token，这就是「入站即分流、能不进模型就不进」的实现样板。

- **真正的 target 决策在入口 wrapper `Zle`，不在 `Gle` 内。** handler 收到 channel.message 后先由 `Zle`(`87141`) 做**斜杠命令解析**再调 `Gle`——`Zle` 里解析出命令/意图后喂 `AXe`(`87135`)裁 target：带参内容 → `session`，`status/config/debug` 类 intent 或纯命令 → `gateway`（内联短路、不进模型），`history-control` 类（`/compact /clear /undo`）→ `session`（`87139`）。这一层命令预处理是「洞察 #5」的真实机制所在。网关命令清单常量 `qle`(`87065`)已含 `/effort`（每会话推理力度开关）与 `/model` 等。
- **`Ule` 只是读取器，不是决策器。** `Ule`(`87055`)仅 `return routing_hint.target ∈ {gateway,meta,session} ? … : "session"`——它读回 `Zle`/`AXe` 已写进 `routing_hint` 的结果。`Gle` 内 `d = Ule(r)`（`87283`）是**落点**，据此分三路。
- **三路的落地形态**：`gateway` → `Gle` 内联分支应答（`d === "gateway"`（`87284`）），返回 responseText/outboxId 并 log `[gateway] gateway-targeted event (no enqueue)`，**完全不入队、不唤醒**；`meta` → 写 mailbox key `"meta:subconscious"`（`87294`）；`session` → 写 `t.sessionKey` 的 mailbox（`Xs(e, t.sessionKey, f)`（`87306`））。
- **channel.ingress 的入站守卫**：`or(k.session_key)` 命中归档中 → `code: -32011`（`90683-90684`）；workspace 不可用 → `-32010, message:B.guidance`（`90696-90697`）。`source_kind` 缺省按传输层推断 `k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc")`（`90687`）。

---

### 论点 3 · WAL-before-enqueue：先落盘、后入队、最后唤醒，崩溃可重放

**所以呢**：可靠性不靠队列中间件，而靠一条铁律——事件先原子 append 进 spine 日志，才追加进 mailbox，才 emit 唤醒。任何一步崩溃都能从「spine log + mailbox 指针」精确复原。代价是「队列」就是纯 Markdown 文件，吞吐/并发靠文件锁与内存索引兜底。

- **精确落点在 `appendBeforeExecuteGateway (Gle)`（`87194-87326`，gateway 入站规范化）。** 顺序：`createSpineEvent (on)`（`87196`）构造 spine 事件→ 幂等去重 `checkAndRecordDetailed`（`87236`，去重键由 `computeDedupKey (vse)`（`87234`）算出、去重存储由 `OXe`（`87233`）取得；命中则复用既有事件、`enqueued:!1`，经 `readEventById (Md)` 取回原事件、`Um` 反查既有 outbox 回填 `gatewayResponse/gatewayOutboxId`（`87241-87256`）原样返回，即「去重即重放上次回执」）→ `zXe`（`87260`）把原始 payload 持久化进 `varIngressDir/<sessionHash>/<eventId>.json` 并回填 `raw_path`（`87271`）→ **`atomicAppendEvent (sn)`（`87271`）把事件 append 进 spine 事件日志（这是 WAL）** → `advanceConsumerWatermark (Nu)`（`87271`，同行）推进 gateway 消费水位（紧随其后 `Du` 更新 health/event_log 状态）→ `d = Ule(r)`（`87283`）决定 routing target→ 只有 session/meta 目标才经 `Xs`（`87296`/`87306`，分别为 meta / session）把 `- [ ] @evt(<id>)` 追加进 mailbox（enqueue；gateway 目标走 `d === "gateway"`（`87284`）的内联应答分支不入队）→ 最后 `n?.bus && n.bus.emit("spine.event", r)`（`87316`，**emit 受 `n?.bus` 守卫：未注入 bus 时不广播**）。
- **`session.wake` 不在 `Gle` 内**，而由**调用方**在 `routing.enqueued` 为真时 emit：channel.ingress（`Ayt`(`90720`)）、channel.command（`Ayt`(`90770`)）、gateway 触发的 `/compact` 调用方（session.compact `wyt`(`89779`)、idle-compact `Ybe`(`88533`)）。即「先事件落盘 → 后入队 → 最后由调用方唤醒」。
- **channel.ack 是双路径游标提交**（`"channel.ack"`（`90826-90859`））：按 `:` 前缀 channel 反查 `Go`/`rne` 走一路；否则直接 `Ts` 查记录、必要时 `Bk` 重建后经 `Nae`/`Xz` 提交投递游标——含 `-32602 Invalid cursor` 游标校验分支与 `-32002` 归档中守卫（`fr(g.session_key)`）。它不只是「置 sent」，而是带校验与归档态的游标推进。

---

### 论点 4 · 对外双通道数据面 + 零依赖契约包：HTTP 拉（drain）vs WS 推（订阅 + backlog 回放）

**所以呢**：同一个 `channel.pull` 方法对简单适配器（只 poll HTTP）和富客户端（订阅长连流）各取所需，而两端共享同一个随包发布的编译期契约，杜绝手抄漂移——这是想做 Agent 平台化的解耦支点。**关键更正**：RPC 才是 drain，WS 根本不 drain。

- **RPC 形态 = drain，且门控于 `return_mask` 含 `"final"`。** `G = B.includes("final")`（`90798`）；`ce = G ? await Pw({… limit: k.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50) …}) : []`（`90811-90817`），返回 `records / next_cursor(ce[last].id) / idle(ce.length===0)`（`90822-90824`）。不含 `final` 则 records 恒为空。
- **WS 形态 = 打开持久订阅 +（含 `final`）回放 backlog，records 不在 RPC result 里返回。** WS 上下文里 channel.pull **直接短路、根本不 drain**：`if(D?.wsSubscriberId) return await uyt({…}), C.result={opened:!0, …}, C`（`90799-90810`）——handler 本身不读 outbox、result 里无 records。真正的排空在 WS 外层 message handler：`ue.result && !ue.error` 后 `h.subscribe`（`91288`）打开订阅，再由 `E_e`（`64732`/`91311`）以 `"session.output"`（`64750`）通知形式回放 outbox backlog。**两条路径读 backlog 用的是同一个读取器 `Pw`（`64674`）**：RPC 路径是上一条的 `await Pw({`（`90811`），WS 回放是 `E_e` 内的 `u = await Pw({`（`64741`）。`Pw` 从消费者游标（或 `cursorOverride`）之后按偏移读出 outbox 记录，本身不推进游标；两条路径的区别只在交付方式——RPC 把记录放进 result、读取时不推进游标，WS 把每条作为 `session.output` 通知推出去并由 `onDelivered` 推进游标（confirmed）。
- **replay 窗口去重**：`ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0`（`91308`），期间用 `G = new Set`（`91288`）抑制重复（送信器内命中 `G.has(ue)`（`91220`）即不发送）；`onDelivered`（`91318-91323`）推进游标 `FV`、`Xd` 标 sent、`qm` 写 `.sent_ids`。WS 送信器 `ce`（`91218`，签名 `(le, M = !0)`）正常推 `session.output` 时若 `M` 且有 consumerId 则 `FV` 推进投递游标；replay 期用 `ce(z, !1)` 关闭该副作用、改由 `onDelivered` 推进——这是「replay 不重复推进游标」的关键。
- **订阅注册表 `u6`(`88615`)做 sessionKey→订阅者扇出。** `Map<sessionKey,Set<id>>` + `Map<id,subscriber>`，按每订阅者 `returnMask`（默认 `["final","stream"]`（`88620`））过滤：`final`→`session.output`（`88628`）、`stream`→`session.stream`（`88655`）、`tool`→`session.execution`（`88682`）、`stream_end`→`session.stream_end`（`88712`）；发送异常自动摘除订阅者。`returnMask` 值域校验器是 `_J`（`89175`：`final|stream|stream_end|tool`，空回退 `["final","stream"]`）。
- **stream_end reason 能力降级契约**：`u6` 内 `m==="interrupted" || v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`88709`），与 WS 订阅透传 `acceptStreamEndReasons`（`91292`）一致——daemon 按消费者声明的能力把不认识的 reason 降级为 `"interrupted"`，老插件优雅退化。
- **零依赖契约包 `@openduo/protocol@0.6.0`**（`"dependencies":{}`、`"main":"src/index.ts"`，源码 `.ts` 随包发布，位于 `@openduo/duoduo/node_modules/@openduo/protocol/src/`）：`rpc.ts` 信封与守卫、`channel.ts` 全部 params + 校验器 + `outboxToOutbound`、`outbox.ts` `OutboxRecord`/`TurnMeta`、`notifications.ts` 4 种下推、`channel-binding.ts` `ChannelType`。通道插件以 npm tarball 安装（`cli.pretty.js`：`mkdtemp aladuo-channel-plugin-`、`tar -xzf`、`package.installing` 标记）。
- **outbox 落盘**：id `obx_${randomUUID()}`（`35911`），路径 `Lr.join(e.outboxDir, t, …)`（`35915`）；双索引 `by_event.jsonl`（`36054`）/`by_id.jsonl`（`36143`）+ `.sent_ids`（`36058`）+ `replay/`（`36124`）+ `.pending_queue.jsonl`（`36456`）。

---

### 证据表

| 机制主张 | 证据（字面量/片段） | 位置 | 置信 |
|---|---|---|---|
| 三监听器（TCP只读/socket全权/可选token远程）共享同一路由构造闭包，非各自独立注册 | `R(app,{hostGuard,readOnly,bearerToken})` 挂 healthz/readyz/dashboard/rpc/ws；三次调用见下 | 构造 `let R = (S, { hostGuard: D, readOnly: A, bearerToken })`（`91131-91374`，在 `createDaemon (Ayt)`（`91131`）内）；调用 `R(t, { hostGuard: !0, readOnly: !0 })`（`91375-91377`）、`R(n, { hostGuard: !1, readOnly: !1 })`（`91378-91380`）、`bearerToken: D.token`（`91431`） | confirmed |
| readyz 探针 `Kle` = 能否 append events 日志，否则 503 not_ready | `await Kle(u) ? {status:"ok"} : j.code(503).send({status:"not_ready"})`；`Kle` 以 `"a"` 打开当日 `eventsDir` 文件再关闭 | `S.get("/readyz", async ($, j) => await Kle(u)`（`91184`）、`status: "not_ready"`（`91187`）；`Kle`（`87327`） | confirmed |
| 只读 TCP 端口默认 20233、host 恒 127.0.0.1；unix socket 默认 `<runDir>/daemon.sock` mode 0600 | `Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233)`；socket 路径 `e.daemonSocketPath ?? t.ALADUO_DAEMON_SOCKET ?? join(u,"daemon.sock")`，父目录须 0700、socket chmod 0600 | socket 路径 `J = e.daemonSocketPath ?? t.ALADUO_DAEMON_SOCKET ?? kt.join(l, "daemon.sock")`（`66128`）；父目录 0700 校验 `"daemon socket directory must be owned by this user and mode 0700"`（`91411`）；`Ms.chmod(x, 384)`（`91423`）；TCP 监听 `host: "127.0.0.1"`（`91425`）、`Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233)`（`91543`） | confirmed（含活体） |
| RPC 是 if/else 链而非 Map；链含 system./session./job./usage./spine./channel.* 全套 handler；仅未匹配 →-32601 | 分发函数 `E(S, D)` 起于 `createDaemon (Ayt)`（`90486`）；`system.runtime.info`/`session.*`/`job.*`/`usage.get`/`spine.tail`/`channel.file.upload`；链尾 `-32601` + 活体 `bogus.method→-32601` | 链首 `S.method === "system.shutdown"`（`90572`）；`S.method === "system.runtime.info"`（`90575`）、`S.method === "session.list"`（`90598`）、`S.method === "channel.file.upload"`（`90778`）、`S.method === "job.list"`（`90918`）、`S.method === "usage.get"`（`91005`）、`S.method === "spine.tail"`（`91107`）；链尾 `message: "Method not found"`（`91117`） | confirmed |
| 请求体守卫 `eb`（protocol `isJsonRpcRequest`）；/rpc 未过 400，WS 未过 -32600 | `eb`：`t.jsonrpc==="2.0" && typeof t.method=="string"`；活体 `{"method":"x"}→400` | `eb`（`31516`）；/rpc `"[daemon] invalid JSON-RPC request"`（`91190`）；WS `message: "Invalid Request"`（`91268`） | confirmed |
| WAL：事件先 append 再入队 | `appendBeforeExecuteGateway (Gle)` 内 `await sn(e, r)`（append 事件日志）在 `Xs(…, "- [ ] @evt(…)")` 入队之前 | `atomicAppendEvent (sn)`（`87271`）；meta 路径 `Xs`（`87296`）、session 路径 `Xs`（`87306`） | confirmed |
| routing target 决策在 `Zle`→`AXe`（斜杠命令/intent），`Ule` 仅读取器 | `AXe`：带参命令→session、history-control→session、intent status/config/debug 或纯命令→gateway；`Ule`：`t==="gateway"\|\|t==="meta"\|\|t==="session"?t:"session"` | `AXe`（`87135`）、`Zle`（`87141`）、`Ule`（`87055`） | confirmed |
| `Gle` 内 `Ule` 落点 + spine.event emit | `d = Ule(r)`；`n?.bus && n.bus.emit("spine.event", r)`（受 `n?.bus` 守卫） | `d = Ule(r)`（`87283`）；`n.bus.emit("spine.event", r)`（`87316`） | confirmed |
| session.wake 由调用方按 routing.enqueued 触发（非 Gle 内） | `G.routing.enqueued && l.emit("session.wake", …)`；Gle 体内无 `session.wake` | channel.ingress `createDaemon (Ayt)`（`90720`）、channel.command `createDaemon (Ayt)`（`90770`）、session.compact `wyt`（`89779`）、idle-compact `Ybe`（`88533`） | confirmed |
| gateway 目标事件内联应答、不入队 | `d === "gateway"` 分支调 `NXe` 取 responseText/outboxId，log `[gateway] gateway-targeted event (no enqueue)`；meta 写 `"meta:subconscious"` | `let f = await NXe(e, r, n?.bus, n?.gatewayCommands)`（`87285`）；`"[gateway] gateway-targeted event (no enqueue)"`（`87286`）；`let f = "meta:subconscious"`（`87294`） | confirmed |
| protocol 零依赖契约包，源码随包发布（嵌套路径） | `"dependencies":{}`、`"main":"src/index.ts"`；`ChannelRpcMethods = describe｜spawn｜ingress｜command｜pull｜ack` | @openduo/duoduo/node_modules/@openduo/protocol@0.6.0/src/{channel,rpc}.ts | confirmed |
| channel.ingress：archiving 守卫 -32011、workspace 守卫 -32010 | `or(k.session_key)`（`90683`）命中 → `code: -32011`（`90684`）；`S0e` workspace 校验未过 → `code: -32010, message: B.guidance`（`90696-90697`）；`"channel.command"`（`90735`）同构 | `"channel.ingress"`（`90680-90734`） | confirmed |
| source_kind 缺省按传输层推断 | `k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc")`（`90687`）；channel.command 同式 `source_kind`（`90742`） | `"channel.ingress"`（`90680`）/ `"channel.command"`（`90735`） | confirmed |
| channel.pull RPC = drain，门控 return_mask 含 "final" | `G = B.includes("final")`（`90798`）；`let ce = G ? await Pw({`（`90811`），`limit: k.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50)`（`90815`）；返回 `records: ce`（`90822`）/ `next_cursor`（`90823`）/ `idle: ce.length === 0`（`90824`） | `"channel.pull"`（`90793-90825`） | confirmed |
| channel.pull WS = 打开持久订阅 + backlog 回放，不 drain、records 不在 result | `if (D?.wsSubscriberId) return await uyt({…}), C.result = {opened: !0, …}`（`90799-90810`），不调 `Pw`、无 records；外层 `h.subscribe({`（`91288`）打开订阅；`E_e`（`91311`）经 `Pw` 读 backlog，以 `"session.output"`（`64750`）通知回放 | `"channel.pull"`（`90793`）；`E_e`（`64732`） | confirmed |
| channel.pull replay 窗口去重 + 游标推进 | `Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0)`（`91308`）；replay 期 `G = new Set`（`91288`），送信器 `G.has(ue)`（`91220`）命中即静默跳过；`onDelivered: async z => {…}`（`91318-91323`）依次 `FV` 推进游标、`Xd` 标 sent、`qm` 写 `.sent_ids` | `E_e`（`91311`）；送信器 `ce`（`91218`） | confirmed |
| channel.ack 双路径提交 + -32602 invalid cursor / -32002 归档 | `code: -32002`（`90830`）归档守卫；`session_key` 的 `:` 前缀作 channel kind，`La(u, ce, B)`（`90838`）直读记录文件；未命中或 session 不符 → `ple(u, k.session_key, B)`（`90839`）查记录、`zV` 提交，查不到回 `"Invalid cursor"`（`90847`）/-32602；命中 → `ea`（`90850`）查 by_id 索引、缺则 `jR(u, k.session_key)`（`90852`）重建，再 `k_e(u, k.session_key, L, ee)`（`90854`）或 `zV` 提交 | `"channel.ack"`（`90826-90859`） | confirmed |
| outbox 落盘 `<kind>/<id>.json`，id=obx_<uuid> | `obx_${eXe.randomUUID()}`（`35911`）；`Lr.join(e.outboxDir, t, …)`（`35915`） | `nXe`（`35910`）/ `Tb`（`35914`） | confirmed |
| outbox 双索引 by_event/by_id + .sent_ids + replay + pending_queue | `"index", "by_event.jsonl"`（`36054`）、`"index", "by_id.jsonl"`（`36143`）、`".sent_ids"`（`36058`）、`"replay"`（`36124`）、`".pending_queue.jsonl"`（`36456`） | `eU`（`36053`）/ `tU`（`36142`）/ `mle`（`36057`）/ `MR`（`36123`）/ `Jl`（`36455`） | confirmed |
| 订阅按 returnMask 扇出四类通知 + 异常摘除 | `"session.output"`（`88628`）/ `"session.stream"`（`88655`）/ `"session.execution"`（`88682`）/ `"session.stream_end"`（`88712`）；默认 `i = ["final", "stream"]`（`88620`）；`send` 抛错即摘除订阅者 `v.send(h), g += 1 } catch { d(y)`（`88638-88640`） | `u6`（`88615`） | confirmed |
| returnMask 校验值域 | `_J`：`n === "final" \|\| n === "stream" \|\| n === "stream_end" \|\| n === "tool"`（`89178`）；空或全非法则回退 `["final", "stream"]`（`89176`/`89179`） | `_J`（`89175`）；订阅侧默认 `u6`（`88620`） | confirmed |
| stream_end reason 降级契约（代码侧落点） | `m === "interrupted" \|\| v.acceptStreamEndReasons?.includes(m) ? m : "interrupted"`（`88709`）；WS 透传 `acceptStreamEndReasons: q.channel_capabilities?.outbound?.accept_stream_end_reasons`（`91292`） | `u6`（`88709`）/ protocol channel.ts | confirmed |
| system.shutdown 自杀 | 链首 `S.method === "system.shutdown"`（`90572`）置 `C.__triggerShutdown = !0`（`90574`）；`/rpc` 与 WS 送出响应后均 `setImmediate(() => process.kill(process.pid, "SIGTERM"))`（`91206`/`91343`）；只读 TCP 上 `Xgt.has(k.method)`（`91193`）不含它，回 -32601 | `"system.shutdown"`（`90572-90574`）；`__triggerShutdown`（`91205`）/ `__triggerShutdown`（`91342`） | confirmed |
| 20234 save-api 不存在于本 build | grep `20234\|save-api\|save_api` 三文件皆空；活体 `curl :20234 → 000 无响应` | — | confirmed（活体+静态） |

### 关键数据结构 / 事件 / 文件格式（真实字段名）

- **JSON-RPC 信封**（`rpc.ts`）：请求 `{jsonrpc:"2.0", id?, method, params?}`；响应 `{jsonrpc:"2.0", id, result? | error:{code,message,data?}}`。错误码：`-32700` parse、`-32600` invalid request（WS 守卫失败落此，非 400）、`-32601` method not found、`-32602` invalid params / invalid cursor、`-32603` internal；业务码 `-32010`（workspace 不可用）、`-32011`（**channel.ingress** 归档守卫，`or(k.session_key)`（`90683`））、`-32002`（**channel.ack** 归档守卫，`or(k.session_key)`（`90829`）；语义同为归档中，挂在不同方法）。

- **RPC 方法清单**（daemon if/else 链 `m(h,_)` 实际分发的全集，非仅 channel.\*）：
  - `system.shutdown`（`90572`，链首，触发自身 SIGTERM）、`system.runtime.info`（`90575`）、`system.status`（`91036`）、`system.config`（`91104`）
  - `session.archive / list / set_alias / notify / wake`（`"session.archive"`（`90594`）起），`session.model`（`90660`）、`session.effort`（`90664`）、`session.compact`（`90668`）、`session.config`（`90672`）
  - `job.manage / session.manage / notify.send / wake.set` 共用一个分支（`"job.manage"`（`90613`）），内部再按方法名分派
  - `job.create`（`90860`）、`job.get`（`90884`）、`job.list`（`90918`）、`job.archive`（`90941`）、`job.reschedule`（`90958`）、`job.interrupt`（`90971`）
  - `usage.get`（`91005`）、`spine.tail`（`91107`）
  - `channel.describe / spawn / ingress / command / pull / ack`（`ChannelRpcMethods` 联合类型），外加 `"channel.file.upload"`（`90778`）/ `"channel.file.download"`（`90786`）
  - **其余（真正未匹配的方法）落链尾 → `-32601 Method not found`**
  - `outboxToOutbound`（`channel.ts`）为出站记录→通道 outbound 的投影函数（非 RPC 方法，随契约包导出）
  - 注意：`session.wake` 既是 RPC 方法（`"session.wake"`（`90610`））也是总线事件名；`spine.event / cadence.tick` 只是**总线事件**不是 RPC；`session.output / stream / execution / stream_end` 是**服务端→客户端通知**（`notifications.ts`），仅在 WS 上单向下推

- **`OutboxRecord`**（`outbox.ts`，磁盘 `outboxDir/<channel_kind>/<id>.json`）：`id, idempotency_key, created_at, channel_kind, session_key, in_reply_to_event_id?, routing:{policy:"reply_to_origin"|"reply_override"|"fanout", origin_event_id, origin_session_key, origin_channel_kind, fanout_index, fanout_total}, payload:{text?, attachments[], data?, rendering_hints:{format:"markdown"|"text"|"card", mentions[]}}, stream:{stream_id, seq, is_final}, status:"pending"|"sent"|"failed", attempts, last_attempt_at, last_error`。

- **`TurnMeta`**（`outbox.ts`，投影到 `payload.data.turn_meta`，供通道渲染卡片页脚）：`elapsed_ms, total_input_tokens, output_tokens, cache_hit_rate, total_cost_usd, model, context_used_tokens, protocol`。`protocol` 随后端四分：`"anthropic"`（claude，`s?"anthropic":void 0`（`54893`））、`"codex"`、`"grok"`、`"pi"`，四个字面量在 v0.8.2 daemon bundle 中各出现一次（confirmed）。
- **v0.8.2：grok 终于上报上下文占用，页脚不再少报（confirmed）。** `mapGrokUsageToDrainUsage (Vst)`（`63059-63081`）新增 `context_used_tokens: s`（`63077`），取值来自 `s = o !== void 0 && o > 0 ? o : void 0`，其中 `o = ag(t.totalTokens)`（`63064`）——**读的是 `_meta.totalTokens`，即 `_meta.usage` 的同级兄弟字段**，而不是 `usage` 里的分项之和；ACP 侧给出的是该会话"上一次调用后的累计总量"，正是上下文占用应有的口径。v0.8.1 的同一映射函数返回对象里**根本没有 `context_used_tokens` 这个键**，所以 grok 会话的页脚一直缺这一项。`>0` 的守卫保证"没上报"与"上报了 0"不被混为一谈。

- **索引/游标文件**（同 outboxDir）：`index/by_event.jsonl`（event_id→记录，用于 in_reply_to 反查，内存缓存 `za`）、`index/by_id.jsonl`、`.sent_ids`（已投递集合，内存缓存 `z1`）、`replay/<session_key>.jsonl`、`.pending_queue.jsonl`。

- **channel.ingress params**：`{session_key, display_name?, text?, idempotency_key?, cwd_abs?, attachments[], source_kind?, channel_id?}`；返回 `{event_id, gateway_response, outbox_id}`。`source_kind` 缺省按传输层推断 `wsSubscriberId?"ws":"rpc"`（`90687`）。

- **channel.pull params**：`{session_key, consumer_id, cursor?, limit?, wait_ms?, return_mask:("final"|"stream"|"stream_end"|"tool")[], channel_capabilities:{outbound:{accept_mime[], max_bytes?, accept_stream_end_reasons?[]}}}`。返回形态因传输而异：RPC 回 `{records, next_cursor, idle}`（含 `final` 时）；WS 回 `{opened:true, session_key, consumer_id, cursor, return_mask}`（records 走订阅推送，不在 result 内）。

- **服务端下推通知**（`notifications.ts`）：`session.output{session_key,record}`、`session.stream{session_key,chunk,is_sidechain?}`、`session.execution{session_key,event:(tool_use|thought_chunk|tool_result|tool_input_delta)}`、`session.stream_end{session_key,reason:"interrupted"|"skipped"}`。

- **邮箱入队标记**（enqueue 的物理形式）：向 mailbox 文件追加一行 `- [ ] @evt(<event_id>)`；meta 目标写入 mailbox key `meta:subconscious`。

### 给 Agent PM 的洞察

> 1. **入站即分流，是「输入闸门」而非「消息队列」——这才是本节的塔尖。** routing target 三态（gateway/meta/session）在 `Nne`→`AGe` 阶段就据斜杠命令 / intent 判定，`/status /config` 类命令直接内联回执、不入队不唤醒，等于在网关层做一次廉价的「是否需要动用模型」短路。对话式 agent 若想省 token，可借鉴这种「入站即分流、能不进模型就不进」的分层——它把「代码守骨架、模型做裁决」的边界物化在了控制面第一跳。

> 2. **WAL-before-enqueue 是可靠性核心，但入队媒介是 Markdown 邮箱文件而非队列中间件。** 事件先 append 进 spine 日志（`sn`）再往 mailbox 追加 `- [ ] @evt(id)`，崩溃可重放；幂等命中时「去重即重放上次回执」（回填 `gatewayResponse/gatewayOutboxId`），语义完整。代价是「队列」就是纯文件，吞吐/并发靠文件锁与内存索引缓存（`ga/z1`）兜底——适合个人级自治 agent，规模化到多租户高并发时这层会成瓶颈。

> 3. **「契约包 + 拉/推双形态」是通道生态的解耦支点，但拉/推语义并不对称。** RPC 是按游标拉取（`Pw` 读出游标之后的 outbox 记录放进 result，门控 `final`），WS 是订阅 + backlog 回放（`opened:true` 短路，同样经 `Pw` 读出、records 走推送）——同一个 `channel.pull` 让「简单适配器只 poll、富客户端订阅流」各取所需，且共享随包发布的零依赖 `.ts` 契约避免手抄漂移。设计通道协议时，务必写清「同一方法在不同传输上返回形态不同」，否则极易误以为 WS 也 drain。

> 4. **能力协商做了向后兼容的「降级而非报错」。** `accept_stream_end_reasons`/`accept_mime` 让 daemon 按消费者声明的能力下调输出（不认识的 stream_end reason 降级为 `interrupted`（`88709`）），新语义对老消费者优雅退化。做长期演进的 agent 协议时，这种「生产者按消费者能力下调输出」比版本号更抗腐蚀。

> 5. **控制面刻意极简、无鉴权、绑定 loopback。** 单端口、if/else 分派、默认 `127.0.0.1`、`/rpc` 无 token 校验——安全边界完全押在「本机单用户」假设上；`system.shutdown` 甚至能直接 `SIGTERM` 自身。作为产品能力边界要清楚：这是单机自治 runtime，不是可暴露的多租户服务。

（相关文件：`createDaemon (Ayt)`（`daemon.pretty.js:90421-91450`，fastify/RPC/WS）、`AXe/Zle`（`87135-87165`，入站 routing 分流）、`appendBeforeExecuteGateway (Gle)`（`87194-87326`，WAL 入站）、`"session.wake"`（`88533`/`89779`/`90720`/`90770`，session.wake 触发点）、`outboxDir`（`35911-36143`/`36456`，outbox 落盘与索引）、`u6`（`88615-88784`，订阅扇出/降级）；`@openduo/duoduo/node_modules/@openduo/protocol/src/{rpc,channel,outbox,notifications,channel-binding}.ts`。）


---

# 第四部分 · 后台自治：靠心跳自我维护而绝不越权

> **关键句**：无人对话时，运行时靠心跳自我维护。潜意识引擎经活动门节流后唤起无状态一次性 LLM 分区会话做维护（§6），记忆系统只做只读测量与软删 GC、一切内容改写交回模型（§7）；机器真正强制的只剩契约门。心跳先转，才有分区加工经验（v0.8.0 起由 gradient-distiller/intuition-weaver 取代 memory-weaver，见 §6 更新块）——收束回 §0 的闭环。


---
## §6 Cadence 心跳 / Subconscious 引擎

**潜意识引擎是 duoduo 的"自主神经系统"：一条 37 分钟心跳，经内存指纹活动门节流后，按用户可改写的 playlist 轮流唤起一批无状态一次性 LLM 分区会话做自我维护；全部跨拍状态落在文件，而机器真正强制的边界只剩契约门 `iO` 与分区工具 allowlist（`PARTITION_CORE_TOOLS`）两处。** 这句话统辖本节四个论点：心跳的**节拍与解耦**、潜意识引擎的**三重节流门**、分区的**无状态执行与两级路由**、以及**唯二的机器强制边界**。以下每个论点先给结论，再落 file:line 证据（行号大多仍对齐 beautified v0.6.1——本节自 v0.6.1 起未逐行重新核对，v0.7.1/v0.8.0 两次跨版本 delta 均只体现在下面的更新块里，其余具体行号按最新版本已漂移，标**未证实推测**）。

> **v0.8.0 更新（confirmed，磁盘 + 代码双证）——分区集合改组，cadence-executor 与 memory-weaver 均已下线：**
> `subconscious/` 目录现只有 **4 个分区**：`gradient-distiller`（cooldown 5, timeout 2100000ms=35min，`contract.consumes:[scan-gap.v2]`）、`intuition-weaver`（cooldown 5, timeout 2100000ms=35min，`contract.consumes:[fold-gap.v1, entity-converge.v1, merge.v1, orphan-islands.v1, orphan-newborn.v1, claude-compress.v1, claude-lint.v1, claude-flatten.v1, activation-report.v1]`）、`pattern-tracker`（cooldown 7, timeout 900000ms=15min，`contract.consumes:[node-converge.v1, revise.v1, orphan-newborn.v1]`，不变）、`memory-committer`（cooldown 3, timeout 1800000ms=30min，无 `contract:`，不变）。旧的 `memory-weaver`（cooldown5/timeout35min）与 `cadence-executor`（cooldown1/timeout10min）目录连同其 `.claude/agents/{entity-crystallizer,intuition-updater,spine-scanner}.md` 子 agent 已被整体删除。`gradient-distiller`+`intuition-weaver` 二者 cooldown/timeout 数值与旧 `memory-weaver` 完全相同——是**一分为二**而非新增：`memory-weaver` 原先"扫描证据+改板"两件事，现按 `scan-gap.v2` vs 其余 8 种 kind 拆给两个更窄职责的分区。`orphan-newborn.v1` 同时被 `intuition-weaver` 与 `pattern-tracker` 两家声明消费——对应代码里 `routeContractDecision (U6)` 按 lesson-/groove- 前缀二选一投递，两分区都要能接才行得通。**下文 §6/§7 提到"memory-weaver"之处，除非另注，均指这次拆分前的 v0.7.1 及更早行为**；本轮未逐条回填每处提及为新分区名。
> **cadence 队列机制被整体移除（confirmed，代码证据）：** v0.7.1 的 `enqueueCadenceItem`/`markCadenceItemsDone`/`mergeCadenceInbox`/`parseCadenceQueue` 四个导出在 v0.8.0 daemon 里已不存在（`reconstruction/maps/rename_daemon.json` 新旧对比 + 全仓字符串检索均为零命中），`runCadenceTick` 新增导出 `resolveCadenceIntervalMs` 替代原先内联的 env 解析。**这意味着下面论点 1/3 里"`mergeCadenceInbox`确定性入队 + `cadence-executor`分区LLM出队分发"的两级路由已经连同 `cadence-executor` 一起消失**——`## Runtime Context` 注入模板里 "Cadence inbox:"/"Cadence queue:" 两行路径也被删掉，换成新增的 "Spine CLI: `<cliEntryPath> spine`" 一行（`Spine CLI: ${e.cliEntryPath} spine`（`daemon.pretty.js:85785`），与 `subconscious/CLAUDE.md`"Large File Guard"一节要求经 Spine CLI 读大分区文件的说明互证）。具体新的 tick 内部调用顺序未逐行重新核对（未证实推测），但"经 cadence 队列文件二次路由进分区收件箱"这条机制本身已确认不再成立。



---

### 论点 1 · 一条心跳、两级解耦：emit 广播不被维护环阻塞，60s cron 是另一条独立定时器

**所以呢：** duoduo 把"系统自我维护"、"任务调度"、"自主思考"分到不同节拍/不同门，慢的 LLM 会话拖不垮维护与定时作业。它们不是"一个心跳两个环"，而是**两条互不相干的定时器**，且潜意识总线在心跳回调里被最先广播、绕过维护环重入门。

- **37min 心跳**：`let B=T0e("ALADUO_CADENCE_INTERVAL_MS",222e4,1e3)`（`daemon.pretty.js:91575`；定义 `T0e`（`89058`）），env 可覆盖、带 `1e3` 最小 clamp（低于 clamp 或非整数则告警回退默认值）；活体 `duoduo daemon config` → `interval_ms: 37min (2,220,000ms) (default)`。单个 `setInterval`（`91580`）回调体第一个表达式就是 `h.emit("cadence.tick")`（`91581`），**在同一行 `if(…, G){…skipped…;return}` 重入门之前**；随后 `G=!0`、`o(d).then(...).finally(()=>G=!1)`（`91585-91594`）才跑维护环（`o`=`runCadenceTick (Bgt)`（`86443`））。故潜意识总线不受维护环 `K` 阻塞。（confirmed）
- **60s job-scheduler 是另一条定时器**：pid0 里 `k=s({paths,sessionManager,bus})`（`91562-91566`）、`k.start()`（`91567`）单独启动（工厂 `createJobScheduler (Wgt)`（`86635`），默认间隔 `Hgt=6e4`（`86695`）=60s），到期 cron 扫描 `scanAndSpawnDueJobs (gJ)`（`86474`），调用点 `gJ`（`86649`）。除定时器外它还挂 `bus.on("job.created")`（`86671`）立即扫一次。与 37min 心跳完全解耦，不属维护环。（confirmed）
- **v0.6.1 调度作业建时校验 + 复合时长**：建作业在 `createJob` 内先过校验器 `Eye`(`61008`)（调用点 `Eye(i)`（`61366`））——空调度、非法 cron（交 `CronExpressionParser.parse`，`Eye`(`61019`)）、畸形时长均在**建作业时**抛错拒绝，而非跑时静默失败。时长由复合解析器 `dw`(`60989`)按 `/(\d+)([smhdw])/g` 逐段累加，故 `@in 2h30m` / `@every 1d6h4m` 合法，残串不覆盖整串即 `Invalid duration format`（`60996`）；`hV`(`61000`)再挡"超出可表示时间范围"的超范围延迟。（confirmed。注：ajv 的 `compositeRule` 是无关 vendor 噪声，不在此路径）
- **维护环 `runCadenceTick (Bgt)`（`86443-86473`）到 v0.8.1 只剩四步**：`runMemoryCheckTick`（动态 import，调用点 `await t(e, Date.now())`（`86447`））→ `sweepTombstonedSessionRecords`（`86450-86452`，try/catch 非致命）→ 构造 `type:"system.cadence_tick"`（`86459`，**`payload` 恒为空对象**：`payload: {}`（`86464`））→ `atomicAppendEvent (sn)` 持久化 + `advanceConsumerWatermark (Nu)` + `Du(…cadence:{last_tick:n.ts})` 三件事串在同一行（`await sn(e, n), await Nu(e, "jobs", …)`（`86466`）；落点 `last_tick: n.ts`（`86470`）；`Du`（`32919`）是 daemon state 文件的读-改-写）。（confirmed）
- **broadcast lint 已下沉进 `runMemoryCheckTick`，cadence 队列合并整条机制在 v0.8.0 被删除**：v0.7.1 及更早基线里，维护环开头先跑两个 broadcast lint、末尾再跑 `mergeCadenceInbox`/`parseCadenceQueue` 把 inbox 的 `.pending` 并进 `queue.md`；v0.8.1 里这两条都不在 `runCadenceTick` 内了——lint 变成 `runMemoryCheckTick (Lct)`（`68576-68690`）里 `aa("broadcast-lint", () => d(lwe(u).selected))`（`68634-68635`）一格，而 `cadenceInboxDir` / `cadenceQueuePath` / `queue.md` 三个字面量在当前 bundle **零命中**，队列合并已无实现，因此这里不再给它们行号（v0.7.1 基线的短名 `Z_e`/`G_e` 在 v0.8.1 已被复用为无关函数，不可再当锚点）。lint 判定本身仍在：`lwe`(`68231`) 读 `boardPath`（即 `<memoryDir>/CLAUDE.md`，`Di`(`66482`) 的 `boardPath`（`66485`））并检测未解析 wiki 链（`yct=/\[\[([^\]\n]+)\]\]/g`（`68256`）），断链时选中一条 `CLAUDE_LINT` 任务、`pendingFilename:"claude-lint.md.pending"`（`68247`）、目标分区 `intuition-weaver`（`68256`，常量 `gct`）。（confirmed）
- **（v0.5.10，channel 会话侧的空闲节流）channel 空闲自动 compact**：channel 会话配置新增 `auto_compact_idle_minutes` / `auto_compact_min_context_tokens`（解析于 `CR`（`35388`）；字段落位 `auto_compact_idle_minutes: n, auto_compact_min_context_tokens: r`（`35398`/`35399`））——空闲超阈值且上下文 token 超阈值时自动压缩会话历史。默认关闭、按会话配置，属 channel 会话生命周期而非潜意识分区，但同属"定时 + 阈值门控省成本"家族。（confirmed）

---

### 论点 2 · 潜意识引擎靠总线事件驱动，三重门把固定节拍变成事件驱动的自适应节奏

**所以呢：** 引擎自身没有定时器，只挂在心跳总线上；三重门（重入/停机、内存指纹活动门、cooldown/backoff）联合实现"没有新证据就不空转"——把固定 37min 节拍变成随记忆变更自适应的节奏。

- **总线挂载、非自持定时器**：`createMetaSession (Ugt)`（`85799`）内 `n.on("cadence.tick",x)`（`86329`），日志 `"[meta-session] started, listening for cadence ticks"`（`86335`）；`stop()` 里对称 `n.off`（`86338`）。`x`（`86315`）是去重包装：记在途 promise `h`，若 `p||m` 直接 `R()` 不追踪。（confirmed）
- **门一 · 重入 + 停机**：`if(p||m){…"[meta-session] skipping tick"…;return}`（`86252-86257`）——`p`=processing、`m`=stopRequested，**独立于维护环重入标志 `G`（`91579`）的第二套门**。（confirmed）
- **门二 · 内存指纹活动门**：`let[S,D,A,C]=await Promise.all([FA(memoryFragmentsDir),FA(memoryEntitiesDir),FA(memoryTopicsDir),Lgt(t)]),$=[…].join(":"),j=jgt($)`（`86262`）；`if(y!==null&&j===y){…"activity gate: skipping tick (fingerprint unchanged)"…}`（`86263-86264`）整跳。指纹分量在 v0.8.1 是 **4 项**（三个记忆目录 + `Lgt`），v0.7.1 基线为 5 项。（confirmed）
- **门三 · cooldown / backoff（round-robin 选择器 `_`（`85871`））**：逐项判定收在纯函数 `E`（`86238-86250`）：已勾选 `if (j.done) continue`（`86240`）；分区缺失或停用 `if (!k || !k.schedule.enabled) return j`（`86242`）（交由 `_` 用 `H$`（`85885`）勾掉推进）；退避中 `y6`（`86244`）→continue；cooldown 判定：`B=Math.max(0,k.schedule.cooldown_ticks),G=b.get(j.name); if(G===void 0||A-G>=B) return j`（`86245-86247`）（`b`=分区→上次 tick 序号 Map，`b = new Map`（`85870`））。失败退避 `_6`（`66454-66465`）是**线性、非指数**：`success/invalid_output→null`（`66455`）；timeout `if (t <= 2) return null; let s = Math.min(t * i, Qut)`（`66458-66459`）；error `if (t <= 1) return null; let o = Math.min(t * 2 * i, elt)`（`66462-66463`）；常量 `Qut=72e5(2h)/elt=144e5(4h)/_g=222e4`（`66477`）。`y6`(`66450`)读 `backoff_until` 判定退避中；`_` 选取后再读一遍全分区 state，用 `y6` 过滤出本拍 `backedOff`（`85900-85903`）。（confirmed）
- **选取 + 空闲补跑**：`L = await Fgt(t, r), B = await _(k, L, v)`（`86275-86276`）；`if(B?.name&&d>1&&(!r||r.activeCount()<=1)) for(ce=1;ce<d&&await _(k,L,v);ce++)`（`86277-86278`），`d=maxPartitionsPerIdleTick??2`（`85870`）。（confirmed）
- **同拍二次 broadcast lint 在 v0.8.0 消失（v0.7.1 及更早基线）**：v0.7.1 基线里，潜意识 tick 会在分区选取**之前**把维护环的两个 broadcast lint 再跑一遍；v0.8.1 的 tick 体 `R`（`86251-86315`）从指纹门直接进 `b` 选取，全 bundle 中 `lwe` 只剩 `runMemoryCheckTick` 内 `lwe(u)`（`68635`）一处调用，该"同拍二次 lint"已不存在，故不再给它行号。（confirmed）

---

### 论点 3 · 分区是无状态一次性 LLM 会话；playlist 是可自改写的纯文本状态机（v0.7.1 另有"确定性入队 + LLM 出队"两级路由，v0.8.0 起该层已整体移除）

**所以呢：** 调度不硬编码 cron，而是 agent 自己能改写的 `playlist.md` checkbox 轮次 + 分区 frontmatter；每分区是一次性 SDK 会话，"除了写进文件的都不记得"，跨 tick 协作全靠 inbox 与共享 `memory/`。

- **playlist 状态机**：分区加载器 `Bw`(`66193`)、解析器 `Gut`(`66276`)只解析 `## Current Round`，`- [x]`=done、`- [ ]`=未做，遇下一 `## ` 停。`H$`(`66295`)把 `- [ ] <name>`→`- [x]`、造 `- <ISO> executed=<name>`、splice 进 `## History`。整轮全勾时 `sve`(`66313`)用 `n=t.filter(s=>s.schedule.enabled)` 重建 round（confirmed；日志文案与 idle 判据本轮未重新逐行核对）。
- **分区执行闭包 `I(S,D,A)`（`createMetaSession (Ugt)`（`85907`）内）**：无状态一次性 SDK 会话 `persistSession:!1`（`86063`）；提示词 `w = S.promptContent + Be + D + ye`（`86020-86028`），其中 `Be`（`86014`）是 "### Partition" 块、`D` 是 `Fgt`（`86275`，每 tick 算一次后传入）产出的 ## Runtime Context、`ye` 是 `zgt`（`86013`）产出的 ## Inbox；超时 `K = Math.max(1, S.schedule.max_duration_ms)`（`86044`）、`xe = setTimeout(`（`86091`）、`j = await Promise.race([Fe, yt])`（`86100`）。结果四分类由 `Dgt(S.name, we)`（`86107-86108`，`we = l0e(j?.text)`；定义 `Dgt`（`85692`））判定——其中 `invalid_output` 是"跑成功但产物不合格"的唯一判定点。成功落 `agent.result tick_type:"subconscious"`（`86182`），失败落 `agent.error stage:"partition_execution"`（`86203`；runtime 不可用那条另走 `"runtime_unavailable"`（`85929-85931`））；并经 `appendDrainRecord (Qd)`（`86157`）写一条 usage drain record（`session_key: meta:subconscious:<partition>`）——这正是 `usage.get` 能显现潜意识开销的动态节点。runtime 由 frontmatter 选：`B=S.runtime, G=B ?? Co()`（`85911-85912`，frontmatter 解析在 `Zut`（`66217`））。（confirmed）
- **上下文注入**：`Fgt`(`85782`)建 `## Runtime Context` + `### Key Paths`（kernel/memory/entities/topics/fragments/registry/events/jobs/subconscious 目录清单）；`zgt`(`85789`)建 `## Inbox`（每条 pending 消息列 `- ${file}: ${message}`，处理后删文件 ack）。（confirmed）
- **两级路由（易漏节点；⚠️ 以下为 v0.7.1 基线，v0.8.0 起整层已不存在——四个 cadence 队列导出与 `queue.md` 字面量在当前 bundle 均零命中，测量侧改为直接写分区收件箱，见本节开头 v0.8.0 更新块）**：`mergeCadenceInbox`（v0.7.1 短名 `Z_e`）只做**确定性**的 `.pending`→`queue.md` 合并；真正把 `queue.md` 的 checkbox 任务**路由进各分区 directed inbox** 的是 `cadence-executor` 这个 **LLM 分区**（其 `CLAUDE.md` 自述 dispatcher 角色："route checkbox tasks from the shared cadence queue into the directed inbox"）。即 `Z_e`（确定性入队）+ cadence-executor（LLM 出队分发）两级。（confirmed，磁盘实证）
- **原"未证实推测"已解开（同为 v0.7.1 基线取证；该分区已退休，出厂脚手架不再包含其目录）**：`cadence-executor: enabled (cooldown 1, timeout 10min)` 在代码里搜不到，因为它是**用户数据里的分区名，不是代码**——磁盘实证 `subconscious/cadence-executor/CLAUDE.md` frontmatter `schedule:{enabled:true,cooldown_ticks:1,max_duration_ms:600000}`；`daemon config` 的 `[Subconscious]` 段就是逐分区渲染各自 frontmatter schedule（经 `Zut`（`66217`）解析）。10min≠默认 60s 只是该分区**覆盖了 `m6` 默认（`m6={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`（`66409-66412`））**。四分区 `cadence-executor/memory-committer/memory-weaver/pattern-tracker` 的 cooldown 1/3/5/7、timeout 10/30/35/15min 均为 per-partition frontmatter 覆盖。（原"未证实/待查"→ confirmed：per-partition frontmatter 覆盖。**v0.8.0 更新**：`cadence-executor` 已删除、`memory-weaver` 已拆成 `gradient-distiller`+`intuition-weaver`，现四分区是 `gradient-distiller/intuition-weaver/pattern-tracker/memory-committer`，cooldown 5/5/7/3、timeout 35/35/15/30min，见 §6 开头更新块）

---

### 论点 4 · 机器真正强制的边界只有两处：契约门 `enforceContractGate (iO)` 与分区工具 allowlist（`PARTITION_CORE_TOOLS`）；memory lint 全程只读、契约门控

**所以呢：** 自治 agent 的"自我修改"必须区分"提示词约束"（软、模型可违反）与"运行时强制"（硬、不可绕过）。软边界写在提示词；机器强制的关键不变量只落在契约门与工具白名单两处，memory lint 只做只读测量。

- **契约门 `iO`（`67346`）= 6 拒因 + null 放行**：`partition-absent`（`67347`）/ `self-id-mismatch`（`67348`）/ `partition-disabled`（`67349`）/ switch `valid→consumes.has(e)?null:"kind-not-consumed"`（`67352`）/ `no-contract→n?null:"no-contract"`（`67354`）/ `parse-fail→n?null:"parse-fail"`（`67356`）——第三参 `n`(flagFallback) 可放行后两者。（契约状态由分区 CLAUDE.md 的 `contract:` frontmatter 解析产出，见 §B5）（confirmed）
- **`iO` 是双重角色门（易漏节点）**：不仅逐项裁决投递，还能**整拍短路** lint——`runMemoryCheckTick (Lct)`（`68576`）里 `a = Fct(() => Mve(s)); if (!a && !r) return o`（`68596-68597`），`Mve`(`67420`)对 `P6` 所列分区 × 全部 kind 逐一调 `enforceContractGate (iO)`（`67424`），若无任何契约 consume 任何 kind（且未开 forget），整个 memory-check tick 直接空返。（confirmed）
- **lint 全程只读、契约门控、单类限量**：受 `resolveMemoryCheckFlags (H6)`（`68546`）读的 `ALADUO_EXP_MEMORY_CHECK`(check) 与 `ALADUO_EXP_MEMORY_FORGET&&check`(forget，依赖前者) 开关；board/entity/node 等 lint 以上限 `q6`（`68732`）=1 每 tick 至多选一条，orphan-newborn 按节点各出一条。子步由 `runMemoryCheckTick (Lct)`（`68576-68690`）按名字逐个调用，外层 `aa`（`68700`）在内层 `V6`（`68692`）的 try/catch 之外再统计本步读不到的路径数（有则整拍抑制 inbox sweep）：`"orphan-states"`（`68608`）（过整拍短路后无条件，只算孤儿节点状态、不投递）；`if (a)` 门内（`a` 即上条 `Mve` 结果）依次 `"board-lint"`（`68618`）、`"entity-lint"`（`68620`）、`"node-lint"`（`68622`）、`"gap-lint"`（`68624`）、`"fold-lint"`（`68630`）、`"broadcast-budget"`（`68632`）、`"broadcast-lint"`（`68634`）、`"broadcast-flatten"`（`68636`）、`"activation-lint"`（`68639`）、`"orphan-newborn-island"`（`68644`），全部成功才跑 `"inbox-sync"`（`68649`）；forget 门内 `"orphan-forget"`（`68670`）。投递经 `rO`（`67293-67344`；check tick 调用点 `rO`（`68603`））→ posted/withheld（withheld 三因：契约门 `iO` 拒、`already-pending` 存在、写入撞 `EEXIST`），orphan-newborn 任务由 `routeContractDecision (U6)`（`68509`）按内存节点路径路由到分区名（`rel.startsWith("topics/")&&(slug lesson-/groove-)?"pattern-tracker":"intuition-weaver"`，生成点 `partition: U6(n)`（`68398`））；`orphan-forget` 只遗忘归属分区契约接收 orphan-newborn 的 STALE 节点 `jve(s, U6(v))`（`68678`），其余记入 `sparedUnwarnable`。活体 `daemon status`：`memory_check: check=off forget=off (posting governed by partition contracts below)` + 4 条 contract。（confirmed）
- **自编程硬边界 = 分区工具 allowlist（v0.5.10 denylist→allowlist）**：v0.5.8 的 `DEFAULT_DISALLOWED_TOOLS` denylist 已退役，分区会话改由**白名单**界定能力：`PARTITION_CORE_TOOLS (pB)=["Bash","Read","Write","Edit","Grep","Glob"]`（`55522`）→ `z=[...new Set([...pB,...S.claudeTools??[]])]`（`86035`）→ SDK `run({...,tools:z})`（`86070`）。分区只能用这 6 个核心工具 + frontmatter `claude.tools` 显式追加项；`EnterPlanMode`/`ExitPlanMode`/`WebFetch`/`WebSearch`/`EnterWorktree` 等因不在白名单而天然禁用，无需 denylist。（confirmed）
- **`system.cadence_tick` 是 Spine 事件、非 RPC（动态印证）**：活体 `spine.tail` 复现 `system.cadence_tick` 事件流，紧随 `agent.tool_use/tool_result(memory-weaver)` → `agent.result tick_type=subconscious partition=memory-weaver` → `pattern-tracker`，动态印证 round-robin 顺序执行分区、每分区落 `agent.result`。（confirmed，动态）

---

### 证据表

| 机制主张 | 证据（字面量 / 代码片段） | 位置 | 置信 |
|---|---|---|---|
| 心跳周期 `T0e("...",222e4,1e3)`，env 可覆盖、带 1e3 clamp | `interval_ms: 37min (2,220,000ms) (default)` | `"ALADUO_CADENCE_INTERVAL_MS"`（`daemon.pretty.js:91575`）；`T0e`（`89058`，定义）；`duoduo daemon config` | confirmed |
| 单 `setInterval` 同拍先 emit `cadence.tick` 再跑维护环，emit 在重入门 `G` 之前 | `h.emit("cadence.tick"); if(...,G){...return}; G=!0; o(d)...finally(()=>G=!1)` | `setInterval`（`daemon.pretty.js:91580-91596`） | confirmed |
| cron 扫描 `scanAndSpawnDueJobs (gJ)` 属独立 60s job-scheduler（默认 `Hgt=6e4`），非维护环 | `k=s({...}); k.start()`；`createJobScheduler (Wgt)` 内 `gJ` 到期扫描 | `k.start()`（`daemon.pretty.js:91562-91567`）、`createJobScheduler (Wgt)`（`86635`）、`gJ`（`86649`）、`Hgt`（`86695`） | confirmed |
| 建作业校验 + 复合时长：非法 cron/畸形时长/超范围延迟建时拒绝 | `Eye` 建时校验（`CronExpressionParser.parse`）；`dw` 复合时长；`hV` 超范围挡 | `Eye`（`daemon.pretty.js:61008`/`61366`）、`dw`（`60989-60998`）、`hV`（`61000`） | confirmed |
| 维护环 `Bgt` 顺序（v0.8.1 起只剩四步）：memcheck→sweep→构造 system.cadence_tick（`payload` 空）→落 last_tick | `await t(e,Date.now())`…`type:"system.cadence_tick"`…`Du(...cadence:{last_tick:n.ts})` | `runCadenceTick (Bgt)`（`86443-86473`），分步 `await t(e, Date.now())`（`86447`）、`sweepTombstonedSessionRecords: r`（`86450`）、`"system.cadence_tick"`（`86459`）、`payload: {}`（`86464`）、`await sn(e, n), await Nu(e, "jobs"`（`86466`）、`last_tick: n.ts`（`86470`） | confirmed |
| broadcast lint 已下沉进 `runMemoryCheckTick`；cadence 队列合并（`mergeCadenceInbox`/`parseCadenceQueue`/`queue.md`）在 v0.8.0 整条移除 | `aa("broadcast-lint",()=>d(lwe(u).selected))`；`cadenceInboxDir`/`cadenceQueuePath`/`queue.md` 在 v0.8.1 bundle 零命中 | `runMemoryCheckTick (Lct)`（`daemon.pretty.js:68576-68690`）、`"broadcast-lint"`（`68634`）、`lwe`（`68231`/`68635`）、`"claude-lint.md.pending"`（`68247`）、`yct`（`68256`） | confirmed |
| 潜意识环靠总线事件、非自持定时器 | `n.on("cadence.tick", x)`；`"[meta-session] started, listening for cadence ticks"` | `createMetaSession (Ugt)`（`85799-86347`）内 `n.on("cadence.tick", x)`（`86329`）、`"[meta-session] started, listening for cadence ticks"`（`86335`） | confirmed |
| 门一 重入/停机：`p`(processing)/`m`(stopRequested) 独立于维护环 `G` | `if(p||m){...skipping tick...;return}` | `"[meta-session] skipping tick"`（`daemon.pretty.js:86252-86257`） | confirmed |
| 门二 活动门：内存指纹（三个记忆目录 + `Lgt`，共 4 项）不变则整跳 | `let[S,D,A,C]=await Promise.all([FA(...),FA(...),FA(...),Lgt(t)]),$=[S,D,A,C].join(":"),j=jgt($)`;`if(y!==null&&j===y){...activity gate...}` | `j = jgt($)`（`86262`）、`"[meta-session] activity gate: skipping tick (fingerprint unchanged)"`（`86264`） | confirmed |
| 门三 cooldown：`A-G>=B` 才选中 | `B=Math.max(0,cooldown_ticks),G=b.get(name); if(G===void 0||A-G>=B) return j` | `cooldown_ticks`（`daemon.pretty.js:86245-86247`） | confirmed |
| 失败退避线性、2h/4h 封顶、前 1–2 次宽限 | timeout `t<=2` 免、`min(t*i,72e5)`；error `t<=1` 免、`min(t*2*i,144e5)`；success/invalid→null | `_6`（`daemon.pretty.js:66454-66465`）、`Qut = 72e5, elt = 144e5`（`66477`） | confirmed |
| `_` 用 `y6` 读 `backoff_until` 过滤本拍 backedOff | `y6` 判退避；`backedOff` 报告 | `y6`（`daemon.pretty.js:66450`/`85900`）、`backedOff`（`85903`） | confirmed |
| 空闲补跑：maxPartitionsPerIdleTick 默认 2、仅活跃会话≤1 | `d=maxPartitionsPerIdleTick??2`;`if(B?.name&&d>1&&(!r||r.activeCount()<=1)) for(...)` | `maxPartitionsPerIdleTick`（`daemon.pretty.js:85870`）、`activeCount`（`86277`） | confirmed |
| playlist 状态机：解析/勾选/History/整轮重建 | `Gut` 只解析 `## Current Round`；`H$` `- [x]`+`executed=`；`sve` filter enabled 重建 | `Gut`（`daemon.pretty.js:66276-66294`）、`H$`（`66295-66312`）、`sve`（`66313-66356`） | confirmed |
| 分区无状态、超时=max_duration_ms、四分类 success/invalid_output/timeout/error（`Dgt` 判 invalid_output） | `persistSession:!1`;`K=Math.max(1,max_duration_ms)`;`Promise.race`;`$ = Dgt(S.name, l0e(text)) ? "invalid_output" : "success"` | `persistSession: !1`（`86063`）、`K = Math.max(1, S.schedule.max_duration_ms)`（`86044`）、`j = await Promise.race([Fe, yt])`（`86100`）、`$ = "timeout"`（`86102`）、`$ = Dgt(S.name, we)`（`86108`）；`Dgt`（`85692`，定义） | confirmed |
| 成功/失败落 Spine + usage drain record | `agent.result tick_type:"subconscious"`;`agent.error stage:"partition_execution"`;`Qd` drain `cancelled:$==="timeout"` | `tick_type: "subconscious"`（`86182`）、`stage: "partition_execution"`（`86203`）、`appendDrainRecord (Qd)`（`86157`）、`cancelled: $ === "timeout"`（`86169`） | confirmed |
| 上下文注入 `Fgt`(路径清单)/`zgt`(inbox) | `## Runtime Context`+`### Key Paths`；`## Inbox`（每条 `- ${file}: ${message}`，处理后删文件 ack） | `Fgt`（`85782`）、`"### Key Paths"`（`85785`）、`zgt`（`85789`）、`## Inbox`（`85792`）；调用点 `zgt`（`86013`）、`Fgt`（`86275`） | confirmed |
| 两级路由：确定性入队 + cadence-executor LLM 出队分发（**v0.7.1 基线；v0.8.0 起整层移除**） | 当时 `mergeCadenceInbox` 做 `.pending`→`queue.md`；cadence-executor CLAUDE.md 自述 dispatcher | 当前 bundle 已无对应导出与 `queue.md` 字面量，出厂脚手架亦无该分区目录 | confirmed（含移除） |
| 出厂四分区 = 用户数据分区，各自 frontmatter 覆盖代码里的 schedule 默认 | 如 `pattern-tracker` 的 `schedule:{enabled:true,cooldown_ticks:7,max_duration_ms:900000}`；代码默认 `m6={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`（60s） | `subconscious/*/CLAUDE.md`；`m6`(`66409`)；`duoduo daemon config` | confirmed |
| 契约门 `iO`：6 拒因 + null 放行，双重角色（逐项 + 整拍短路） | `kind-not-consumed`/`partition-absent`/`self-id-mismatch`/`partition-disabled`/`no-contract`/`parse-fail`；`if(!a&&!r) return o` | `enforceContractGate (iO)`（`daemon.pretty.js:67346-67358`）、`67420`（Mve）、`a = Fct(() => Mve(s)); if(!a&&!r) return o`（`68596-68597`，整拍短路） | confirmed |
| memory lint 只读、单类限量、受契约门与 check/forget 门；orphan-newborn 路由 `U6` | `orphan-states`/`board-lint`/`entity-lint`/`node-lint`/`gap-lint`/`fold-lint`/`broadcast-*`/`activation-lint`/`orphan-newborn-island`/`orphan-forget`；`U6` 路由分区 | `runMemoryCheckTick (Lct)`（`68576-68690`）、`"orphan-states"`（`68608`）、`"board-lint"`（`68618`）、`"orphan-newborn-island"`（`68644`）、`"orphan-forget"`（`68670`）、上限 `q6`（`68732`）；`routeContractDecision (U6)`（`68509`）、`partition: U6(n)`（`68398`） | confirmed |
| 自编程硬边界：分区工具 allowlist（denylist 退役） | `pB = ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]`（无 `Agent`）；`tools: z` | `PARTITION_CORE_TOOLS (pB)`（`daemon.pretty.js:55522`）、`[...pB, ...S.claudeTools]`（`86035`）、`tools: z`（`86070`） | confirmed |
| channel 空闲自动 compact（v0.5.10，channel 会话侧）：默认关闭、按会话配置 | `auto_compact_idle_minutes` / `auto_compact_min_context_tokens` 解析；未配置时 `?? 0` 即关闭 | `CR`（`35388`）、`auto_compact_idle_minutes: n`（`35398`）、`auto_compact_min_context_tokens: r`（`35399`）、`(h?.auto_compact_idle_minutes ?? 0) > 0`（`70307`） | confirmed |
| `system.cadence_tick` 是 Spine 事件而非 RPC 方法 | `type:"system.cadence_tick", source:{kind:"system",name:"cadence"}, payload:{}`（`payload: {}`（`86464`））；`spine.tail` 复现 | `"system.cadence_tick"`（`daemon.pretty.js:86459`）；活体 `spine.tail` | confirmed（动态） |

### 关键数据结构 / 事件 / 文件格式（真实字面量）

- **`playlist.md`**：`# Subconscious Playlist` / `## Current Round`（`- [ ] <name>` / `- [x] <name>`）/ `## History`（`- <ISO> executed=<name>`）。`I7e` 只解析 `## Current Round` 段。
- **分区 frontmatter**：`schedule:{enabled:bool, cooldown_ticks:int, max_duration_ms:int}`（默认 `m6`(`66409`)`={enabled:!0,cooldown_ticks:1,max_duration_ms:6e4}`，per-partition 可覆盖，如 `pattern-tracker` 覆盖为 900000）；可选 `runtime: claude|codex`；可选 `claude.tools`（追加进分区工具白名单）；`contract:{partition:string, consumes:string[]}`。
- **分区状态文件**（read `jf`（`66423`）；write `g6`（`66446`））：`{last_started_at,last_finished_at,last_result,consecutive_failures,backoff_until}`，`last_result ∈ success|timeout|invalid_output|error`。
- **定向 inbox**：`var/subconscious/<partition>/inbox/*.pending` 与 `*.json`（目录经 `partitionInboxDir (qw)`（`66178`）；由 `ave` 列举）；pending body 为一行队列行、换行结尾。
- **cadence 队列（v0.7.1 基线，v0.8.0 起已移除）**：`var/cadence/queue.md`（checkbox 任务行），`.pending` 暂存文件在 tick 内确定性合并入队，再由 cadence-executor LLM 分区出队分发到各 directed inbox。v0.8.0 起测量侧直接写分区收件箱，`queue.md` 这一中转层不复存在。
- **Spine 事件**：`system.cadence_tick`（source `{kind:"system",name:"cadence"}`，payload 为空对象 `{}`）、`agent.result`（`tick_type:"subconscious", partition, runtime`）、`agent.error`（`stage:"partition_execution", outcome`）、`job.spawn`。
- **usage drain record**（`appendDrainRecord (Qd)`（`86157`））：`session_key: meta:subconscious:<partition>`，含 `tool_calls/tool_errors/usage/cancelled(=$==="timeout")`——`usage.get` 可见。
- **contract 门 `iO` 裁决集**：`null`（放行）/ `kind-not-consumed` / `partition-absent` / `self-id-mismatch` / `partition-disabled` / `no-contract` / `parse-fail`。

### 给 Agent PM 的洞察

> **1. 两条定时器 + 独立门是清晰的关注点分离，别误读成"一个心跳两个环"。** 确定性维护（memory lint + 墓碑清扫 + 队列合并，幂等、跑在 37min 心跳上，重入门 `K`）与到期 cron 调度（`gJ`，独立 60s job-scheduler，自己的定时器与门）各自独立；LLM 分区执行（非确定性）再复用心跳但用独立 `l`/`d` 门与 `K` 解耦。呼应本节结论：慢的 LLM 会话拖不垮维护与定时作业。

> **2. playlist 是可被 agent 自己改写的纯文本状态机。** 调度不是硬编码 cron，而是 `playlist.md` checkbox 轮次 + 分区 frontmatter。代价是依赖文件锁/单进程串行保证一致性。**v0.7.1 曾在此之上另有"确定性入队 + LLM 出队"两级路由**（`mergeCadenceInbox` 合并 `.pending`→`queue.md`，再由 cadence-executor 这个 LLM 分区分发），**v0.8.0 起整层移除**：四个 cadence 队列导出与 `queue.md` 字面量在当前 bundle 均零命中，测量侧直接写目标分区收件箱——少一次 LLM 往返，也少一个"分发分区自己不转就全线阻塞"的单点。

> **3. 能力边界"软 + 硬"双层，机器真正强制的只有契约门 `iO` 与分区工具 allowlist。** 软边界写在提示词（禁改 spine/lock/其他分区 CLAUDE.md，模型可违反）；硬边界一是分区工具 allowlist（`PARTITION_CORE_TOOLS`，只放行 7 个核心工具 + frontmatter `claude.tools`，v0.5.10 起以白名单取代旧 denylist，PlanMode/WebFetch/WebSearch/EnterWorktree 因不在白名单天然禁用），二是 `iO` 契约门——它既逐项裁决 lint 产物能否进某分区 inbox（6 种拒因），又能在无契约 consume 时整拍短路掉 memory-check。关键不变量必须落在运行时强制、而非提示词。

> **4. 多重"不空转"节流把固定节拍变成事件驱动的自适应节奏。** 活动门（内存指纹未变即跳过）、`cooldown_ticks`（每分区最小间隔）、失败**线性**退避（`z2`，2h/4h 封顶且前 1–2 次宽限）、`maxPartitionsPerIdleTick`（空闲多跑但有上限、仅活跃会话≤1 补跑）。可复用的省成本模式：定时轮询 + 变更指纹门控 + 每任务冷却 + 失败退避。

> **5. 无状态分区 + 文件即记忆，开销在 usage drain record 里可观测。** 每分区一次性 SDK 会话，"除了写进文件的都不记得"；跨 tick 协作全靠 inbox `.pending` 与共享 `memory/`，每次执行写一条 `session_key: meta:subconscious:<partition>` 的 drain record，`usage.get` 可显现潜意识开销。代价是每 tick 冷启动的上下文重建，靠 `_ct` 注入路径 + `bct` inbox 摘要弥补。


---
## §7 记忆系统

**记忆系统把"某条知识还有没有用"物化为 board→`[[link]]` 图可达性 + effectiveness 轨迹证据：daemon 侧只做只读、每类每 tick 至多一条、契约门控的 lint 测量，与带 48h 宽限 + 双 flag + git 软删的孤儿 GC，绝不改内容；一切改写交给分区自己的 tick 上按"事件→fragment→effectiveness→改板"可复算链完成（v0.7.1 及更早由 memory-weaver 一个分区完成，v0.8.0 起拆给 gradient-distiller+intuition-weaver 两个分区，见 §7.D 更新块）——即"代码测量、模型裁决"的记忆自治架构。**

这条结论把本节拆成四个 MECE 论点：**(A)** 效用被物化成一张 markdown 知识图，可达性 = 效用；**(B)** daemon 侧全部动作是只读、每类每 tick 单条、契约门控的测量，永不改内容；**(C)** 唯一的破坏性动作（孤儿 GC）被 48h 宽限 + 双 flag + git 软删三重封住；**(D)** 内容改写整段委派给 memory-weaver 三段流水线。下面逐点先说"所以呢"，再给证据。

---

### A. 效用被物化为图可达性 —— board 是唯一"根"，`[[link]]` 闭包决定谁还活着

**所以呢**：记忆系统不靠时间戳或访问计数判断一条知识是否"还有用"，而是把它翻译成一个纯几何问题——从广播板 `CLAUDE.md` 出发，沿 `[[slug]]` wiki-link 做可达性闭包，触达不到的 topics 节点就是 orphan。这让"效用"成为可确定、可复算的图属性，daemon 无需理解语义即可测量。

**A1 · 目录结构就是这张图的物理布局。** `resolveMemoryDirs (Di)`（`66482-66490`）恰好返回 **5 个字段**：`memoryDir`（根目录）+ `boardPath`（`CLAUDE.md` 文件，即广播板 / 唯一"根"）+ 3 个子目录 `entitiesDir` / `topicsDir` / `effectivenessDir`。

```
memoryDir/
  CLAUDE.md          ← boardPath：广播板 / 直觉层（可达性的唯一"根"）
  entities/          ← 实体档案
  topics/            ← 节点：lesson-* / groove-*
  effectiveness/     ← 每条 board 行一份效果轨迹（附属证据层）
  fragments/<date>/  ← scanner 证据；★ 不在 dc 内，由 gap-lint/scanner 独立引用
  state/meta-memory-state.json  ← ★ 也不在 dc 内，属另一路径（meta-memory）
```

> 口径：`Di` 的组成 = memoryDir + boardPath（文件）+ 3 个子目录（entities/topics/effectiveness）；`fragments/` 与 `state/meta-memory-state.json` **都不在 `Di` 内**。

**A2 · 可达性 BFS 把"效用"算成不动点。** 种子来自 `td(e).filter(uU)`，其中 `Ff` 用手写解析器 `Lf`(`66496`)扫 board 上全部 `[[...]]`——遇第一个 `]` 即止（内联扫描循环，`Lf`（`66504`））。`um(e,t)` 从种子 BFS 到不动点，reader `Tc` 读每个 slug 的 `topics/<slug>.md` + `entities/<slug>.md`（该三个符号本轮未重新逐行定位新行号）。**不在可达集内的 topics 节点 = orphan**，这是整个 lint/orphan 体系的核心几何。

**A3 · effectiveness 是附属证据层，不能独立支撑可达性。** `Tc` 仅当 topics/entities 至少一存在（`i.length > 0`（`66875`））才追加读 `effectiveness/<slug>.md`（`e.effectivenessDir`（`66876`））。即：孤立的 effectiveness 文件不阻止其 slug 成为 orphan——effectiveness 是轨迹证据，不是节点本体。这处"非对称守卫"由 `createMemorySlugReader (Tc)`（`66875`）逐字印证。

**A4 · board 层现在有独立哈希，与指令层解耦——从缓存层坐实"board 是唯一根"。** v0.6.1 新增 `computeBoardLayerHash (uJ)`（`82335`）单独对 board 文本做 sha256（`JSON.stringify([e ?? ""])`），而指令指纹 `computeNonBoardInstructionsFingerprint (lJ)`（`82339`）在计算前显式把 `memoryBoard` 置空（`memoryBoard: void 0`）后复用全量指纹 `LS`（`82330`）。即 board 层与 identity/kind/instance/mission 指令层各走一条独立哈希：board 变动只失效 board 缓存、不牵动指令层，反之亦然。这从提示缓存的层次上印证 A 节几何——board 是与指令层正交、独立成层的可达性唯一"根"。confirmed。

---

### B. daemon 侧只做只读测量：每类每 tick 至多一条、契约门控，永不改内容

**所以呢**：整个 `runMemoryCheckTick` 是一台"体检仪"而非"手术刀"。它把 check 门内十个检查的结果打包成 `.pending` 证据文件投递给潜意识分区收件箱，自己绝不 touch 任何知识内容。三个约束——每类单条节流、契约门控、只读——共同保证测量廉价、可审计、无副作用。

**B1 · 主循环逐 lint `try/catch` 隔离，且投递执行器是 `rO` 而非门控函数。** `Lct`（`68576`=`runMemoryCheckTick`，导出于 `runMemoryCheckTick: () => Lct`（`68537`））逐个子 lint try/catch 隔离，单个子 lint 崩溃不中断其余。真正的**投递执行器是 `rO`（`67293`）**：它 `mkdirSync(inbox)` → 写 `pendingFilename` → 分类 posted/withheld/errors，`already-pending`（`67320`/`67335`）与 `--force`（`67324`）逻辑都在这里；`Lct` 的闭包 `d` 把每个 lint 的 selected 结果喂给 `rO`（调用点 `rO`（`68603`））。门控函数 `iO` 只是 `rO` 内部的 gate 判定（`iO` 声明于 `iO`（`67346`）），不是投递本身。

**B2 · check 门内十个检查，kind 除 `scan-gap.v2` 外全部 `.v1`。** 十个调用点都在 `runMemoryCheckTick (Lct)`（`68618-68647`）内，按下表顺序执行；目标分区都写死在各自本体里，只有 orphan-newborn 经 `U6` 选分区：

| lint（`aa` 步名） | 调用点→本体 | 产出信号 kind | 目标分区 |
|---|---|---|---|
| **board-lint** | `gve(u, q6)`（`68619`）→`gve`（`66771`）（逻辑 `plt`（`66835`）） | `revise.v1` / `merge.v1`（判据见 B3） | REVISE→pattern-tracker，MERGE→intuition-weaver |
| **entity-lint** | `wve(u, q6)`（`68621`）→`wve`（`66935`） | `entity-converge.v1` | intuition-weaver。判据：entity 缺收敛三段 `vve = ["What it is now", "Relationship", "Open variables"]`（`66981`）；打分 `kb*1e3+dated`（`66951-66956`） |
| **node-lint** | `kve(u, q6)`（`68623`）→`kve`（`67012`） | `node-converge.v1` | pattern-tracker（判据见 B3） |
| **gap-lint** | `Jve(e.eventsDir, u, t, s, …)`（`68625`）→`Jve`（`67715`） | `scan-gap.v2` | gradient-distiller（见 B3） |
| **fold-lint** | `d(awe(u, y).selected)`（`68631`） | `fold-gap.v1`（`"fold-gap.md.pending"`） | intuition-weaver（`owe = "intuition-weaver"`（`68190`）） |
| **broadcast-budget** | `d(Xve(u).selected)`（`68633`） | `claude-compress.v1` | intuition-weaver（`Glt = "intuition-weaver"`（`67876`）） |
| **broadcast-lint** | `d(lwe(u).selected)`（`68635`） | `claude-lint.v1` | intuition-weaver（`gct = "intuition-weaver"`（`68256`）） |
| **broadcast-flatten** | `d(dwe(u).selected)`（`68637`） | `claude-flatten.v1` | intuition-weaver（`Ect = "intuition-weaver"`（`68309`）） |
| **activation-lint** | `v = nwe(e.eventsDir, u, t)`（`68640`） | `activation-report.v1`；指标另记为 `"memory_activation_loss"`（`68656`） | intuition-weaver（`rct = "intuition-weaver"`（`68122`）） |
| **orphan-newborn-island** | `d(gwe(f, _));`（`68646`）+`bwe(_we(f), t, …)`（`68647`） | `orphan-newborn.v1` / `orphan-islands.v1` | NEWBORN→`U6` 选择，ISLAND→intuition-weaver（见 C） |

另有两步不产出候选：check 门外无条件先跑的 `orphan-states`（为最后一行和 forget 准备孤儿节点状态），以及 forget 门内的 `orphan-forget`（见 C）。

kind 值全部带显式版本后缀，注册表是十二键的 `Un`(`66620-66636`)。**其中唯一已升版的是 `SCAN_GAP = "scan-gap.v2"`（`Un`(`66629`)）**，随 v0.8.0 的 gap-lint 重写而来（见 B3），其余十一个仍是 `.v1`，每个 kind 恰好对应上表一个检查（orphan 一行产出两个）。版本号在分区侧也是显式的：分区 frontmatter 的 `consumes:` 在解析时逐项过 `mve`(`66616`)（调用点 `mve`（`67242`）），只有**没写**版本号的项才被补成 `.v1`——所以 `subconscious/gradient-distiller/CLAUDE.md` 里必须、也确实写着 `scan-gap.v2`（confirmed，静态+上游脚手架互证）。

**B3 · 各 lint 判据细则**：

- **board-lint（`plt`（`66835`））——v0.8.0 起只剩两类信号，SINK 已被移除（confirmed）。** REVISE 过滤 = `trajectory!=='NO-EFF' && cls==='behavioral' && fmt==='legacy' && !(WEAKENING && (REMOVE||DROP))`，partition **硬编码 `"pattern-tracker"`（`66843`）**（不经 `U6`）；`MERGE`(`66850`)过滤 = `trajectory!=='NO-EFF' && dual && cls!=='domain'`，partition **硬编码 `"intuition-weaver"`（`66851`）**（v0.7.1 时是 `'memory-weaver'`——旧的 memory-weaver 分区已被 gradient-distiller/intuition-weaver 取代，见 §6 迁移记录）。v0.7.1 的第三类信号 `SINK` 在 v0.8.0 的 `plt` 里已找不到任何踪迹（`"SINK:"`/`Nn.SINK` 全仓检索为零命中）——**REVISE/MERGE 两类判据都保留了 `trajectory!=='NO-EFF'` 前置，唯独 SINK 这条判据连同其常量一起被删除**，不是行号漂移，是真删除（confirmed）。trajectory（STRENGTHENING/NEUTRAL/WEAKENING）与 verdict（PRESERVE/KEEP/REMOVE/REWRITE/SHARPEN/DROP）仍从 effectiveness 文件解析，判据本体未重新逐行核对（未证实推测）。
- **node-lint**：v0.7.1 时代的判据（`escalated=!reachable` 打 `WASTED-COMPUTE`；`References` 仅 groove 合法）本轮未重新逐行核对，具体新行号未重新定位（未证实推测，机制大概率未变——`aa`/`V6` 外壳与契约门控均未受 v0.8.0 delta 触及）。
- **gap-lint（`Hlt`（`67679`））——v0.8.0 整体重写为"限定区间 dream"，不再是整日粒度（confirmed）。** v0.7.1 的 `n_e` 按"整日 count/hours"判定有没有证据、返回 `{gapDate, bands, selected}`；v0.8.0 的 `Wtt(e,t,n,r)` 改成算精确到毫秒的 **span**（`{date, startMs, endMs}`）：先看"今天"存量事件的 `msOfDay` 是否已越过上次水位 `l`（`Ftt(a)`取得）且冷却时间 `n-(s+p)>=r` 已过，够格才收今天；不够格则从更早的日期文件里逆序找最近一个仍有未读事件的日子。命中后仍复用同一个"排序→合并连续小时"函数生成 hour band（该函数已更名/结构不变，`qve`（`67627`）），但**投递对象变了**：`kind` 从 `scan-gap.v1` 升到 `Nn.SCAN_GAP="scan-gap.v2"`（`66629`），partition 从 `'memory-weaver'` 改成 **`"gradient-distiller"`（`67655`）**，pending body 措辞从"Stage 1 scanner evidence pass"式的分阶段提示改成**"dream over this bounded interval"**——逐条评判每个外部事件、按 gradient 优先级判断值不值得写 fragment，写不写都要删文件 ack（`Blt`（`67647`）内的完整措辞）。这与 subconscious 侧 `gradient-distiller`/`intuition-weaver` 取代 `memory-weaver`/`cadence-executor` 是同一次重构的两面。**动态印证（值为时点快照，v0.7.1 时测得）**：机制大改后未重新用活体 daemon 复核，新的 `"gap"` JSON 形状大概率也变了（未证实推测）。

**B4 · 每类每 tick 至多一条（`q6=1`）。** 常量 `q6`（`68732`）取值 1，是每类 lint 的默认 limit：`gve`/`wve`/`kve` 都 `slice(0,n)` 只取**最差 1 条**（help 的 `--limit=N default 1`）。即每 tick 每类最多投一个 worst-first 信号——这是"测量廉价"的核心节流。

**B5 · 契约门控 `iO`：只有声明 `consumes` 的分区才收到对应信号。** `iO`(`67346`)分支：partition-absent / self-id-mismatch / `!enabled` → withheld；contract valid → `consumes.has(kind) ? 放行 : 'kind-not-consumed'`；no-contract / parse-fail → 回退 flagFallback（= check flag）。契约解析本体是 `Jw`(`67196`)：读 `<subconsciousDir>/<partition>/CLAUDE.md` 的 frontmatter，返回 5 态（partition-absent / parse-fail / no-contract / self-id-mismatch / valid），`mve`(`66616`)把 consumes 名规范化补 `.v1`；`nO`(`67287`)把每分区契约缓存进 `e.contracts` Map，同 tick 内 `iO`/`Mve`(`67420`)/`jve`(`67429`) 复用同一份，避免反复解析 frontmatter。

**B6 · 前置短路：没有下游读者就不测量（v0.8.1 复核：候选分区集已扩大）。** `Mve`(`67420`)在跑任何 lint 前遍历所有 `Object.values(Un)`（全部 lint kind）× `P6`（`67437`，现为 `['pattern-tracker','gradient-distiller','intuition-weaver','memory-weaver']`——**已从 v0.7.1 时代的两分区扩到四分区**，与 §B7/`U6` 处"MERGE→intuition-weaver、SCAN_GAP→gradient-distiller"的路由改动一致），任一 kind 过闸即测量（`GP(i,r,e.flagFallback)===null`）；`Lct`（`68597`）内 `if(!a && !r) return o`——"有没有订阅者"是是否测量的前置门。

> 注意 `U6`(`68509`)并非通用"路由"：它**仅两处调用**——orphan-newborn 分区路由（`partition: U6(n)`（`68398`））和 forget 警告门 `jve`(`67429`)。**各 lint 信号的 partition 是每类硬编码的，并不走 `U6`**：v0.8.0 里 REVISE/NODE_CONVERGE 仍→`pattern-tracker`；MERGE 已确认改→`intuition-weaver`（`66851`）；SCAN_GAP 已确认改→`gradient-distiller`（`67655`）；SINK 判据已整条移除（见 B3）；ENTITY_CONVERGE 与 ORPHAN_ISLANDS 在 v0.7.1 投 `memory-weaver`，v0.8.2 都硬编码为 `"intuition-weaver"`（见 B2 表，confirmed）。`U6` 只决定孤儿新生告警投给哪个分区：`topics/` 下 lesson-/groove- 节点→`pattern-tracker`，其余→`intuition-weaver`。

---

### C. 唯一的破坏性动作被三重封住：48h 宽限 + 双 flag + git 软删

**所以呢**：daemon 唯一会删文件的地方是孤儿 GC，而它被设计成"几乎不可能误删"——先把孤儿分成三态给足宽限，再要求两个实验 flag 同开，最后即使删也只是 git 软删（历史可恢复），且"没被警告过就不许删"。对自治 agent 的记忆安全，"遗忘 = 可逆软删除"是关键设计。

**C1 · Orphan 三态状态机（`hwe`(`68372`)）给 STALE 之前留足宽限。** `hwe` 套壳 `$ct`(`68323`)（真正算 orphans/indeg/mtime），状态判定（`a = o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE"`（`68385`））：

```
age = mtimeMs>0 ? (refTimestampMs - mtimeMs)/dye : +∞     (dye = 3600*1e3, 62670)
indeg >= 1                → ISLAND    （被别的档案引用，但 board 不可达）
else age < r              → NEWBORN   （r = newbornHours ?? QP，QP=48h：太新，给宽限）
else                      → STALE     （旧且孤立：可删）
```

`indeg` 来源 `Nct`(`68481`)（调用点 `Nct`（`68336`））。`$ct` 同时对每个 orphan 现算 `indeg=s.get`（`68358`）与 `referencedBy=Dct`(`68492`)（`referencedBy: Dct(l, n)`（`68359`），列出具体引用文件），ISLAND note 正文（`Act`(`68454`)）就靠 `referencedBy` 生成"referenced-by"清单（表头 `referenced-by`（`68456`）、逐行 `s.referencedBy.join(" ")`（`68459`））。**注意优先级**：`mtimeMs<=0 → 直接 STALE` 仅当 `indeg=0` 时成立；`indeg>=1` 时无论 age 都判 ISLAND（`o.indeg >= 1 ? "ISLAND"`（`68385`））。

**C2 · 破坏性遗忘 `ywe`（`68404`）只对 STALE，且双 flag AND。** `resolveMemoryCheckFlags (H6)`（`68546-68553`）：`forget = ALADUO_EXP_MEMORY_FORGET && check`（双 flag AND）；警告由 `Lct`（`68581`）发出，文案逐字："FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE)"。`ywe` 首行即 `filter(a => a.state === "STALE")`（`68405`）。

**C3 · git 软删 + 失败回滚 + 锁保护。** `.git/index.lock`（`68410`）存在则 `return []`；否则：

```
git rm --ignore-unmatch -- <files>                                   (56652)
git diff --cached --name-only --diff-filter=D -- <files>             (56657，含 --name-only)
git -c user.name=aladuo -c user.email=aladuo@local commit -m <msg> -- <files>   (56664)
失败 → git reset --quiet -- <files>  +  git checkout -- <files>       (56668–56674)
```

> 注意 commit 命令语义：`-c` 是 **git 顶层 config 开关（位于子命令 `commit` 之前）**，非 `commit -c`（后者 = 复用某提交的 message）。`jct`(`68521`)生成 commit message，confirmed。

**C4 · "不可警告即不可遗忘"。** forget 前 `jve(s, U6(v))`（`68678`）：STALE 节点若其目标分区**不消费 orphan-newborn 信号**则 `sparedUnwarnable`——连警告都收不到就永远不能被静默删。

**C5 · 活体 help 印证**：`duoduo memory reclaim`——"Never deletes"、`NEWBORN→warn, ISLAND→weaver note, STALE→git rm`、`--tag MANDATORY`、DESTRUCTIVE/manual/git history backup，全部 confirmed。

---

### D. 内容改写整段委派给分区自己的 tick（v0.8.0 起由两个分区分工，取代原 memory-weaver 单分区三段流水线）

> **v0.8.0 更新（confirmed，磁盘实证 `subconscious/{gradient-distiller,intuition-weaver}/CLAUDE.md`）**：原 `memory-weaver` 一个分区内部"spine-scanner（证据）→ entity-crystallizer/intuition-updater（改板）"两阶段、三个 `.claude/agents/*.md` 子 agent 的流水线，v0.8.0 起拆成**两个独立分区**，职责边界与 contract 完全对齐 §6 更新块列出的 consumes 表：
> - **`gradient-distiller`**（只读证据侧）：消费 `scan-gap.v2` 信号，经 `<Spine CLI> cat --interval '<date>[t1,t2]' --kind external` 读取该闭区间的外部事件，逐条判断是否有 gradient（对 `memory/CLAUDE.md` 现有某行构成 STRENGTHENING/WEAKENING/NEW_SIGNAL 证据），有则写一条 fragment 到 `memory/fragments/`（须带 `claude_md_ref` 或 `source_line`），无则跳过；只写 fragment 与自己的 `scan-gap.cursor` 续跑指针，不碰 board。这正是代码侧 `gap-lint`(`Hlt`) pending body 里"dream over this bounded interval...judge each external event per event...write a fragment if it carries gradient"那段措辞的落地方（confirmed，代码-提示词双向印证）。
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

**D1a · v0.7.1：crystallization 信号按实体逐条派发，不再是一次性"整个语料库"任务。** entity-lint `wve`（`daemon.pretty.js:66935`）为 `memory/entities/` 下**每一个**实体各发一条独立的 `ENTITY_CONVERGE` 信号，文件名 `entity-converge-${slug}.md.pending`（`daemon.pretty.js:66966`），信号体只引用这一个实体自己的 dossier 文件（`memory/entities/${slug}.md`）与 `[[${slug}]]`（信号体渲染 `glt`（`66927-66933`））——即"一个信号、一个实体、一份 dossier"，而不是把所有待收敛实体打包成一条任务丢给收敛分区自己去发现范围。收件分区在 v0.8 已改为 `intuition-weaver`（`daemon.pretty.js:66965` 的 `partition:` 字面量）。这条信号同样经过 §B 的契约门 `iO`（`daemon.pretty.js:67346`）才能进 inbox，粒度上与其它 lint 信号一致。收敛分区的 subagent 提示词里对应一段"Claim scope"纪律（`subconscious/intuition-weaver/CLAUDE.md:257-261`）：dossier 正文每句话必须是关于*这个实体*的事实，"语料库级否定"（例如"事件日志从未记录过 X"）除非这一遍真的跑过对应查询并引用查询与结果，否则禁止写——这份提示词纪律与信号本身的实体级粒度是同一个"不许模糊到语料库层面"意图的两半（confirmed：信号派发机制与分区路由逐行核对；提示词纪律为读取当前文件内容确认存在）。

**D1b · v0.7.1：partition inbox 有了显式的"快照对账"语义，防止信号被静默漏处理或重复处理。** 新增的 inbox-sync 子步骤（`Dve`（`67377-67418`），从 `runMemoryCheckTick (Lct)` 内经 `V6("inbox-sync", …)`（`68649`）调用）在每个 memory-check tick 结束时：对受追踪分区列表 `P6`（`67437`，现为 `pattern-tracker`/`gradient-distiller`/`intuition-weaver`/`memory-weaver` 四个）中的每一个，重新跑一遍契约门 `iO` 算出"这一 tick 的 lint 产物里，哪些 pending 文件现在仍然可投递"，与"这一 tick 实际新写入的文件"取并集，跟持久化在 `<inboxDir>/.memory-signals.json` 里的**上一次快照**做差集比对——不在新集合里的旧快照项，其磁盘上的 `.pending` 文件被物理删除（视为"分区契约已不再消费它，不该继续占着 inbox"），然后把新集合写回快照文件。这正是 changelog "partition inboxes now have defined snapshot semantics" 的字面机制：inbox 不再是"只增不减、靠 agent 自己 ack 删除"的松散目录，而是每 tick 都对账一次的显式状态（confirmed，逐行核对）。

**D2 · 每 tick 节流与终止语义。** frontmatter `cooldown_ticks:5, max_duration_ms:2100000`（`4`–`5` 行）；Stage1 每 tick 跑一次 scanner 证据 pass、Stage2 至多处理一条 directed inbox 项（`39`–`43`、`98`–`137` 行）；终止 token `UPDATED / NO-OP / NO_NEW_GRADIENT / BOOTSTRAPPED`（`220`–`223`），**仅终止后才删 inbox ack**，`PARTIAL_UPDATE` 留盘（`225`–`229`）；gradient 优先级 **真人 `channel.message` > 周期后台事件**（`90`–`96`）。

**D3 · consumes 与 §B 路由自洽。** `consumes` 声明 6 kind：entity-converge / sink / merge / orphan-islands / orphan-newborn / scan-gap（`8`–`14` 行）——**memory-weaver 不 consume `revise.v1` / `node-converge.v1`**（那两类归 pattern-tracker，正好对上 B3/B5 的硬编码路由）。

**D4 · 模态标签体系（`meta-prompt.md` `162`–`194`）。** dossier 内每条主张标注 epistemic shape，六标签逐字命中（`164`–`175` 行）：`[observation]` / `[inference]` / `[instruction]` / `[conditional: <event>]` / `[hypothesis (unratified)]` / `[superseded YYYY-MM-DD: <new>]`。覆盖规则（`183`–`185` 行）："Present observation overrides any dossier's `[observation]` or `[inference]`；对 `[instruction]`，当前观察决定其条件是否仍成立。" board 是"已加载的直觉层"，深读 dossier 才应用其模态标签。

---

### 证据表

| 机制主张 | 证据 | 位置 | 置信 |
|---|---|---|---|
| `Di` 定义 5 字段：memoryDir + boardPath + entities/topics/effectiveness | `return {memoryDir, boardPath, entitiesDir, topicsDir, effectivenessDir}` | `resolveMemoryDirs (Di)`（`66482-66490`） | confirmed |
| fragments/ 与 state/meta-memory-state.json 均不在 Di 内 | Di 无此二字段 | `resolveMemoryDirs (Di)`（`66482-66490`） | confirmed |
| board 种子 `Ff(e).filter(k6)`；`Lf` 遇首个 `]` 即止 | 手写 `[[..]]` 扫描器 | `Ff(e).filter(k6)`（`66886`） / `Lf`（`66496-66518`） | confirmed |
| BFS `Pc` 到不动点；`Tc` 仅 topics/entities 存在才读 effectiveness | `i.length>0` 守卫 | `walkReachableMemory (Pc)`（`66884-66900`） / `createMemorySlugReader (Tc)`（`66875`） | confirmed |
| board 层独立哈希 `uJ`，指令指纹 `lJ` 排除 memoryBoard（与 `LS` 全量指纹解耦） | `JSON.stringify([e??""])` / `memoryBoard: void 0` | `computeBoardLayerHash (uJ)`（`82335-82337`） / `computeNonBoardInstructionsFingerprint (lJ)`（`82339-82344`）（`LS`（`82330-82333`）） | confirmed |
| orphan 三态优先级 indeg≥1→ISLAND / age<r→NEWBORN / else STALE | `o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE"`（`68385`），`lO`=48、`mwe`=3600*1e3（`mwe = 3600 * 1e3, lO = 48`（`68530`）） | daemon `hwe`(`68372`)/`$ct`(`68323`) | confirmed |
| indeg 源 `Nct` | 定义 `Nct`(`68481`)、调用点 `Nct(n)`（`68336`） | `Nct`（`68481-68490`） | confirmed |
| mtimeMs≤0→STALE 仅当 indeg=0；indeg≥1 恒 ISLAND | 判定优先级 | `detectOrphanMemory (hwe)`（`68384-68385`） | confirmed |
| 主循环 `Lct`=runMemoryCheckTick，check 门内十个检查逐个经 `aa`→`V6` try/catch 隔离 | 导出 `runMemoryCheckTick: () => Lct`（`68537`） | `runMemoryCheckTick (Lct)`（`68576-68690`）（`V6`（`68692-68698`）） | confirmed |
| 投递执行器是 `rO`；already-pending/--force 在其内 | mkdir+write+分类 | `rO`（`67293-67344`）（`t.force`（`67324`）/`"already-pending"`（`67320`/`67335`）） | confirmed |
| board-lint 只产出 REVISE/MERGE 两类（SINK 已不存在），两者均含 `trajectory!=='NO-EFF'`；REVISE 硬编码 pattern-tracker、MERGE 硬编码 intuition-weaver | `plt` | `runBoardLint (plt)`（`66835-66856`）（`s.trajectory !== "NO-EFF"`（`66839`/`66847`）/`partition: "pattern-tracker"`（`66843`）） | confirmed |
| node-lint References 仅 groove 合法；escalated→WASTED-COMPUTE | `_lt`/`vlt` | `_lt`（`66985-66987`）/`escalated: !h`（`67039`）/`vlt`（`67007`） | confirmed |
| gap-lint 黑名单过滤内部 kind | `eO = new Set([...])`；`zve` 按 source.kind 过滤计数 | `eO = new Set(["cadence", …])`（`67191`）/ `eO.has(s)`（`67610`）/ `zve`（`67586-67619`） | confirmed |
| gap 活体值 = 2026-07-01 bands=[[4,4]]（时点快照，机制 confirmed） | `memory check --dry-run --json` | 活体 RPC | confirmed（值随日期漂移） |
| `q6=1`：每类每 tick 至多一条 worst-first | `slice(0,n)`，help `--limit default 1` | `q6`（`68732`）/ `--limit=N (default 1)`（`cli.pretty.js:66027`） | confirmed |
| 契约门 `iO` 5 态；`WP` 每 tick 缓存契约 | 契约解析 `Tv`；`dge` 规范化补 .v1 | daemon `enforceContractGate (iO)`（`67346`）/`67196`（Jw）/`67287`（nO）/`66616`（mve） | confirmed |
| 前置短路 `Mve`：无订阅者不测量 | `if(!a&&!r) return` | `Mve`（`67420-67427`）/ `a = Fct(() => Mve(s))`（`68596`）/ `runMemoryCheckTick (Lct)`（`68597`） | confirmed |
| `U6` 仅两处调用（orphan-newborn 路由 + jve 警告门），非通用路由 | `partition: U6(n)`（`68398`） / `jve(s, U6(v))`（`68678`） | `U6`（`68509-68511`） | confirmed |
| forget = 双 flag AND，仅 STALE | `H6` | `resolveMemoryCheckFlags (H6)`（`68546-68553`）/`forgetMemoryEntry (ywe)`（`68404-68405`）/警告 `"ALADUO_EXP_MEMORY_FORGET"`（`68581`） | confirmed |
| git 软删：rm→diff(--name-only)→`-c ...` 顶层 config commit→失败回滚 | index.lock 保护 | `forgetMemoryEntry (ywe)`：`"rm"`（`68412`）/`"--name-only"`（`68417`）/`"user.name=aladuo"`（`68424`）/`"reset"`（`68428-68434`）（`"index.lock"`（`68410`）） | confirmed |
| 不可警告即不可遗忘 `sparedUnwarnable` | `jve(s, U6(v))` | `jve(s, U6(v))`（`68678`） | confirmed |
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
2. **dedup 内存 Map 的增长上界（v0.8.2 起换了一个问题）**：v0.8.2 移除了 `maxEntries`/整表 clear（§4 论点二，`async record(t)`（`86868`）），原来的"clear 后去重短时失效"窗口已不存在，但代价是内存 Map 随 `registryDir/dedup.jsonl` 单调增长且**代码中无任何上界或 GC**。该文件在长期运行节点上的实际增长速率、以及 daemon 常驻数周后的内存占用，**均未实测**。
3. **`DISABLE_ADAPTIVE / DISABLE_THINKING / MAX_THINKING_TOKENS` 的消费方（未证实推测）**：这些 env 在 daemon 中仅出现在 Codex/端点错误提示串里（`DISABLE_ADAPTIVE=1 DISABLE_THINKING=1 … MAX_THINKING_TOKENS=0`（`72229`））。v0.6.1 的提示文案已**显式标注它们是 "Claude-only" 的 `~/.config/duoduo/.env` 开关**，据此推断 duoduo 自身不消费、只是透传给底层 Claude Code 二进制/SDK 的建议开关；SDK 侧的实际消费仍未直接验证。
4. **部分 RPC 方法的活体探测**：控制面方法全集从 `/rpc` 分派链提取（附录 B），其中 `spine.tail` / `usage.get` / `system.status` 已活体验证返回，其余 handler 存在性以分派链代码为准。
5. **v0.6.2 起：Skip 的 hook 裁决是否仍会执行工具体？** Skip 改为 PreToolUse hook 返回 `{continue:!1, stopReason}`（`83084`）后，`mcp__aladuo__Skip` 的工具体是否仍被 SDK 执行，完全由 SDK 决定、duoduo 无兜底。而 `pending_skip_rewind` 在全 bundle 里有两个写入者：一是 Skip 工具体 `cC`（`54687`；写入点 `pending_skip_rewind`（`54699`）），claude/grok 经 MCP 注册 `Kg` 调它（调用点 `cC`（`79978`）），codex 经 dynamic tools `wA` 调它（调用点 `cC`（`80131`））；二是 pi 的工具结束观察点 `xke`（`73337`），pi-worker 报告 Skip 结束后由 daemon 写入（`pending_skip_rewind: {`（`73343`）），经 `onToolEnd: ei => xke(t, P, ei)`（`84498`）挂在 pi adapter 上。**对 Claude 而言写入者仍只有工具体一个**。若不执行，Claude 路径丢的**仅是 `<skip-rewind>` 块**（读 `U?.pending_skip_rewind`（`70578`）、渲染 `skip-rewind`（`71578`/`71725`））——seal-on-skip 门（`seal-on-skip`（`84245-84262`））整个在非 claude 分支 `w.runtime === "codex" || w.runtime === "grok" || w.runtime === "pi"`（`84245`）内，本就不适用于 Claude；Claude 侧等价门是 admission 的 `!nn.skipCalled`（`84297`），由 hook 自身置位。非 claude 后端亦不止靠状态探测，codex 另有工具调用观察器（`onToolCallObserved`（`62870`）→ `u.skipObserved = !0`（`61988`）→ `activeTurnSkipObserved`（`84252`））。**需实测。**
6. **v0.8.2 changelog 的"每个 `.env` 都按 0600 写"在本仓可见范围内没有对应 diff（未证实推测）**：`mode: 384` 在 daemon bundle 中新旧两版均为 2 处、`chmod(..., 384)` 均为 3 处，cli bundle 均为 1 + 1 处，其余四个 bundle（`stdio`/`channel-acp`/`feishu-gateway`/`pi-worker`）新旧两版都是 0 处。也就是说 daemon 侧 `.env` 的 0600 写入在 v0.8.1 就已存在，这条 changelog 条目要么描述的是本仓未覆盖的代码路径，要么是对既有行为的重述——**不作为 v0.8.2 的新增机制记录**。
7. **v0.8.2 工具改名对 Codex 会话需 `/reset` 才生效**：该结论来自上游 changelog，bundle 内未找到"按 runtime 区分工具表刷新时机"的对应分支，未实测。
8. **v0.6.2 起：Notify 对 orphan job 的直传是否真会报送达？** 工具端解析器的精确 key 快路径在任何 orphan 检查之前返回（`Qat`（`65193`）的 `n in r` 快路径），而 `duoduo session notify` 走的是另一个未加 orphan 过滤的解析器（`Kf`（`89488`））。两条路径是否都会对已归档 job 报 `Notify delivered.`，**需实测。**

> 复核状态：全文已于 2026-07-29 对齐到 **v0.6.2**，行号锚点与短名经结构指纹迁移后逐条复核（迁移工具见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md) 论点四）。上一轮 v0.6.1 复核（2026-07-24）的 8 节机制主张在本版仍全部 **CONFIRMED**；本轮结论性变化只有三处：§1 论点五（job 的 kind 层从不加载）、§2 Skip 由 interrupt 改为 hook 裁决、§4 论点一记入唯一一条有意绕过 WAL 的跨进程通道。
>
> **2026-09-05 v0.8.0 部分复核（本轮）**：全文短名/行号已用结构指纹（`fingerprint_match.mjs`）+ 逐条人工核验的方式机械迁移到 v0.8.0（`check_doc_anchors.mjs` 61/61 条形式化引用通过），但**不是**逐机制的重新验证——§6/§7 相当一部分行号自 v0.6.1 起就未做过这类全面复核，本轮同样没有补齐。本轮**新增确认**的结论性变化：pi 作为第四运行时与 Claude 共用同一个 `applyJobSdkConfigOverride` job-config 叠加口（§1 论点五）；daemon 重启新增强制 `--reason` + 可选 `--wake <session>` 的跨会话唤醒投递，`duoduo spine cat/show` 成为潜意识分区读取 Spine 事件的新入口，替代旧有的 cadence 队列文件路径（§6 更新块）；`memory-weaver`/`cadence-executor` 两分区被 `gradient-distiller`（只读证据）+`intuition-weaver`（唯一改板写手）取代，`SCAN_GAP` 升级到 `scan-gap.v2` 且 gap-lint 从整日粒度改成精确到毫秒的区间（§7.B/§7.D 更新块）；board-lint 的 `SINK` 判据整条移除；`/undo` 命令与 Grok 的 rewind 扩展方法均已从代码中完全删除（§2）；Spine WAL 的去重键计算简化为只认 `dedup.source_id`，原先的 hash/text 内容摘要回退路径已不存在（`computeDedupKey`，未在正文展开，见 `reconstruction/first-party/01-spine-wal/computeDedupKey.js`）。以上均为 confirmed（代码 + 磁盘证据交叉印证）；本轮未触及的其余机制主张按原有置信标注保持不变。


---
## 附录 A：复核索引（关键 file:line 速查）

**A.0 短名 ↔ 真名速查**（从还原源码的 `__export` 恢复；*inferred* 标注见 [`RENAME_TABLE.md`](../reconstruction/maps/RENAME_TABLE.md)，可读源码在 [`first-party/`](../reconstruction/first-party/)）：

**§1 认知装配**：`Xv`=resolveMetaPromptText、`Ohe`=renderJobMissionBlock、`Ahe`=renderPromptLayers、`Wh`=buildSystemPromptForChannelConfig、`zye`=extractSystemPromptAppend、`QSe`=buildTransientUserBlocks、`HEe`=transcludeBroadcastBoard
**§2 Turn/Drain**：`Qd`=appendDrainRecord、`Cb`=summarizeDrainRecords、`Hh`=isAbortLikeError、`Ef`=createAgentSdkAdapter、`Fye`=computeCodexTurnUsage、`xH`=batchDrainItems、`Xw`=handleDrainError
**§3 Session**：`cse`=rehydrateSessionState、`GSe`=drainSessionMailbox、`LS`=computeInstructionsFingerprint、`OA`=runInstructionsFingerprintGuard、`Tgt`=createSessionManager、`Ugt`=createMetaSession、`qgt`=sweepTombstonedSessionRecords（`spawnSessionActor`/`wakeSessionActor` 是 `Tgt` 内的闭包，无独立导出名：分别为 `N`（`Tgt`@`83931`） 与 `se`@`83825`）
**§4 Spine**：`on`=createSpineEvent、`Z9e`=appendEventToPartition、`sn`=atomicAppendEvent、`Md`=readEventById、`Y9e`=scanPartitionsForEventId、`Nu`=advanceConsumerWatermark、`vse`=computeDedupKey
**§5 Gateway**：`Gle`=appendBeforeExecuteGateway、`cO`=DAEMON_TOKEN_ENV_KEY、`$yt`=isLoopbackBindHost、`Oyt`=resolveRemoteListenerConfig
**§6 Cadence**：`pB`=PARTITION_CORE_TOOLS、`Swe`=resolveCadenceIntervalMs、`Bgt`=runCadenceTick、`gJ`=scanAndSpawnDueJobs、`Wgt`=createJobScheduler、`Zgt`=createOutboxDeliveryManager（旧的 cadence 队列文件读写函数已不存在——v0.8 起潜意识改经 `duoduo spine cat/show` 读 Spine 事件，全仓再无 cadence queue 字面量）
**§7 记忆**：`qw`=partitionInboxDir、`Rc`=partitionInboxDirFromVar、`Di`=resolveMemoryDirs、`Ff`=resolveMemoryLinkTargets、`plt`=runBoardLint、`Tc`=createMemorySlugReader、`Pc`=walkReachableMemory、`iO`=enforceContractGate、`Hlt`=runGapLint、`hwe`=detectOrphanMemory、`ywe`=forgetMemoryEntry、`U6`=routeContractDecision、`H6`=resolveMemoryCheckFlags、`W6`=buildMemoryCheckStatus、`Lct`=runMemoryCheckTick、`uJ`=computeBoardLayerHash
**§8 运行时抽象**：`Nf`=isCodexAvailable、`sg`=resolveCodexSandbox、`Sc`=checkCodexAvailability、`RV`=ensureAgentsMdSymlink、`Uye`=buildBaseInstructions、`qye`=buildDeveloperInstructions、`kV`=buildCodexTurnInput、`yw`=createCodexAppServerAdapter、`$V`=isGrokAvailable、`kc`=checkGrokAvailability、`vw`=createGrokAcpAdapter、`Jut`=resolveRuntimePaths、`Sdt`=initializeRuntime

**A.1 机制 → file:line**

| 机制 | 位置 |
|---|---|
| system prompt 6 层装配 | `daemon.pretty.js:55093-55118` (`Ahe`=renderPromptLayers) |
| prompt_mode 包壳 | `buildSystemPromptForChannelConfig (Wh)`（`55120-55129`）：override 分支 `"override"`（`55122`），append 键 `append: s`（`55127`） |
| meta-prompt 解析 | `55069-55078` (`Xv`=resolveMetaPromptText) |
| 广播板包装 khe/hrt/grt | 在 `Ahe` 内 `grt.test(d)`（`55106-55112`），常量定义 `khe`（`55523`） |
| 广播板 transclusion | `82179-82185` (`HEe`=transcludeBroadcastBoard)，递归解析 `WEe`@`82194`，`agt`(maxDepth=5) 定义 `agt = 5`（`82324`） |
| per-turn 瞬态注入 | `71662-71762` (`QSe`=buildTransientUserBlocks) |
| Codex 装配 | 复用 `Wh` 输出，经 `zye`@`62051` 桥接抽字符串（声明 `extractSystemPromptAppend (zye)`（`61925`））；`Uye`（`61929`）/`qye`（`61947`）在当前路径为不可达死代码（构造 `yw` 未传 instructions），详见 §1 论点三 |
| 潜意识分区注入 | `Fgt`@`85782`（Runtime Context + Key Paths）/ `zgt`@`85789`（Inbox + 删文件 ack） |
| 事件封装/追加写 | `32001` (`on`=createSpineEvent)/`H9e`（`31988`）(串行 mutex)/`32008` (`Z9e`=appendEventToPartition)/`32043` (`sn`=atomicAppendEvent) |
| append-before-execute | `appendBeforeExecuteGateway (Gle)`（`87194`），实际 append `sn`@`87271`，紧随同行 watermark `Nu`（`87271`） |
| 去重 `vse` / checkAndRecordDetailed | key 计算 `vse`（`86887-86890`）；存储类 `mR`@`86827`；`checkAndRecordDetailed`（`86877-86884`）；网关 dup 分支 `f.duplicate`（`87241-87258`）；`dedup.jsonl` 路径 `"dedup.jsonl"`（`87050`） |
| 随机读 `Md` / by_id | `readEventById (Md)`（`32052-32059`）先查 by_id 索引、回落顺序扫描 `Y9e`@`32078`；索引路径 `tb`@`32031`、追加 `G9e`@`32034` |
| watermark `Nu` | `advanceConsumerWatermark (Nu)`（`32858`） |
| rehydrate `cse` | `rehydrateSessionState (cse)`（`32340-32379`） |
| spine.tail | `nve`@`88999`（尾读取），RPC 分派 `"spine.tail"`（`91107`） |
| 记忆根 `Di` | `resolveMemoryDirs (Di)`（`66482`）（memoryDir + boardPath(CLAUDE.md) + entities/topics/effectiveness） |
| 可达性 `Pc`/`Tc`/`Ff` | `walkReachableMemory (Pc)`（`66884`）/`createMemorySlugReader (Tc)`（`66869`）/`resolveMemoryLinkTargets (Ff)`（`66521`） |
| orphan 三态 `hwe` | `detectOrphanMemory (hwe)`（`68372-68393`）（`mwe`=3600e3、`lO`=48，定义 `mwe = 3600 * 1e3, lO = 48`（`68530`）） |
| lint 主循环 `Lct` | `runMemoryCheckTick (Lct)`（`68576-68690`），短路 `a = Fct(…); if (!a && !r)`（`68596-68597`） |
| 投递门控 `iO` | `enforceContractGate (iO)`（`67346-67358`）；投递执行器 `rO`@`67293`，路由 `U6`@`68509` |
| 遗忘 `ywe` | `forgetMemoryEntry (ywe)`（`68404-68438`），index.lock 守卫 `".git", "index.lock"`（`68410`），双 flag 守卫 `H6`（`68546-68548`） |
| cadence 间隔（运行时常量） | `T0e("ALADUO_CADENCE_INTERVAL_MS",222e4,1e3)`（`91575`）；仅为 status 展示串的 `"2220000"`（`87599`） |
| 模态标签 | `meta-prompt.md:175-190` |

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

**控制面 / RPC 方法**（`/rpc` JSON-RPC 分派链，从 handler `if (S.method === "…")`（`90572-91117`）直接读出——即实际注册可调用的方法，区别于上面更宽的事件 type 全集）：
```
system.shutdown system.runtime.info system.status system.config 
channel.describe channel.spawn channel.ingress channel.command 
channel.file.upload channel.file.download channel.pull channel.ack 
session.archive session.list session.set_alias session.notify session.compact session.config 
session.effort session.model session.manage session.wake 
job.create job.get job.list job.manage job.archive job.interrupt job.reschedule 
notify.send wake.set usage.get spine.tail 
```

共 33 个。其中 `job.manage`/`session.manage`/`notify.send`/`wake.set` 共用一个分支入口 `S.method === "job.manage" || S.method === "session.manage"`（`90613`）；`job.archive`/`job.interrupt`/`job.reschedule` 与 v0.8.2 从 `ManageJob` 工具面移出的三个动作一一对应，改由 CLI `duoduo job` 经这些 RPC 调用（见 §8）。

> 无 container 相关控制面方法（v0.6.0 起 container 模式退役，`container` 在 daemon 仅剩 `e.runtime_mode !== "container"`（`31542`）一处向后兼容类型守卫）。会话的推理力度与模型各有专用 RPC：`session.effort` 由 `vyt`（`89713`）处理，带 `effort` 参数时 `setSessionEffort`、不带时 `getSessionEffort`（`await t.setSessionEffort(i.session_key, n.effort ?? null)`（`89739`））；`session.model` 由 `byt`（`89683`）以同样方式读写模型；两者都只接受 channel 会话，其余 kind 返回 `forbidden_kind`。聊天里输入的 `/effort`、`/model` 仍作为斜杠命令经 `channel.command` 入站（`$b`（`87166`）→ `appendBeforeExecuteGateway (Gle)`（`87174`）；`/effort` 识别 `if (e === "/effort") return "/effort"`（`87078`）、intent 归 `"config"`（`87130`）），在 `FXe`（`87465`）内分派（`/effort` 分支 `t.name === "/effort"`（`87680`））；每会话推理力度落到 run-config 字段 `"effort" in t && t.effort && (r.effort = t.effort)`（`55219`）/ `reasoningEffort: F.reasoningEffort`（`63503`）。
>
> 活体已验证返回：`spine.tail`、`usage.get`、`system.status`。其余以分派链代码为准（见 §9 第 4 条）。


---
## 附录 C：本文的逆向方法论（可复现）

作者不发布源码，只发布 minified 包。本文的分析链路如下，供后来者复现：

1. **反混淆**：`dist/release/{daemon,cli,stdio}.js`（esbuild 打包）→ js-beautify 展开为 `*.pretty.js`（daemon 7.9 万行 / cli 12.8 万行 / stdio 4.7 万行）。变量名已被 mangle（`Wh`/`Ef`/`QSe`…，且 esbuild 每次构建都会重新 mangle——短名跨版本不稳定），但**字符串字面量、事件名、RPC 方法、env 名、日志前缀、路径片段全部保留**——它们是逆向的锚点，也是跨版本重锚定的依据。
2. **地标索引**：对反混淆代码 grep 关键概念（spine/drain/lease/cadence/partition…）建立「概念→行号」索引，避免通读（大部分体积是打包进来的 react/ink/zod/fastify/claude-sdk）。
3. **提示词层直读**：`bootstrap/` 下 `meta-prompt.md`（agent 身份/记忆纪律的"宪法"）、`config/*.md`、`subconscious/**` 人类可读，直接构成认知层证据。
4. **活体探测**：运行 daemon，用 `duoduo daemon status|config`、`duoduo session list`、`/rpc`（`spine.tail`/`usage.get`/`system.status`）观测真实行为与数据结构。
5. **多 agent 对抗验证**：8 个子系统各由独立分析 agent 逆向，再由**对抗验证 agent**逐条证伪（逆向 minified 代码极易产生"看似合理实则错误"的主张，默认怀疑）；主循环另行提取事件类型/RPC 全集作地面真值交叉校验（附录 B）。

**一句话结论**：duoduo 的"智能是持久的、非一次性的"这一主张，在代码层由三件事共同兑现——**append-before-execute 的 WAL（状态可信可恢复）+ 双注入面的提示词装配（稳定认知与易变状态分离）+ cadence 驱动的潜意识回写广播板（经验跨会话沉淀）**。运行时刻意做薄，把推理全交给模型；它守住的是模型守不住的持久化、生命周期、调度与并发边界。
