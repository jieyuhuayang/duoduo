# 上游变更逆向：v0.6.1 → v0.6.2

> 分析对象：`@openduo/duoduo` v0.6.2（2026-07-28 发布）对 v0.6.1（2026-07-22）的全部运行时变更
> 取证方式：两版出厂 bundle 的结构指纹比对 → 逐声明归一化 diff → 还原源码逐条通读 → 对抗验证器逐条证伪 → 隔离环境实机复现
> 行号锚点均指 **v0.6.2** 的 `daemon.pretty.js` / `cli.pretty.js`（还原源码 `reconstruction/recon/*.recon.js` 行号与之一致）

## 一句话结论

**v0.6.2 是一次"把越权的机制降权"的发布：三处核心改动（Skip 从进程级中断降为 hook 裁决、重启原因从口口相传降为一个一次性文件、升级从假定 npm 全局前缀降为解析实际运行的二进制）都在把"运行时替模型/用户做的强假设"换成"更窄、更诚实的机制"**——代价是新增了一条不走 WAL 的进程间旁路，以及一个 shipped 但从不被加载的配置层。

## 变更总览

| 子系统 | 变更 | 主锚点 | 置信度 |
|---|---|---|---|
| Turn 生命周期 | Skip 由 `query.interrupt()` 改为 PreToolUse hook 返回 `{continue:!1, stopReason}`；新增 `agent_id` 子代理护栏 | `daemon.pretty.js:71990` | confirmed |
| Turn 生命周期 | Skip 后 PostToolUse 不再消费 `pendingSteer`；admission 不再向已 Skip 的 turn park 文本 | `daemon.pretty.js:72004` / `72941` | confirmed |
| Job / SDK 配置 | job frontmatter 接受 5 个 SDK 键，经 `applyJobSdkConfigOverride (Fz)` 叠加到 effective config | `daemon.pretty.js:48847` | confirmed |
| Job / SDK 配置 | `kernel/config/job.md` 随包发布但**运行时从不加载**——job 的 kind 层不存在 | `daemon.pretty.js:48898` | confirmed |
| 守护进程生命周期 | 新增 `<varDir>/daemon-restart-reason.json` 一次性跨进程握手 | `daemon.pretty.js:49061` | confirmed |
| 守护进程生命周期 | 原因经 `daemon-restart-hint` 瞬态 user 块送达，仅 **channel** 类会话 | `daemon.pretty.js:61085` | confirmed |
| Notify | 工具端新增三段式目标解析器（精确 key → display_name 别名 → orphan 标注） | `daemon.pretty.js:69237` | confirmed |
| Job 列表 | `listJobs` 的 try/catch 从"包住整个循环"收窄为"每文件一个" | `daemon.pretty.js:55492` | confirmed |
| CLI 升级 | `duoduo upgrade` 从运行中的二进制反推安装前缀，并用当前 Node 自带的 npm | `cli.pretty.js:116823` / `116834` | confirmed |
| CLI 参数 | 新增权威导出名 `parseRestartArgs` / `parseUpgradeArgs` / `readOption` | `cli.pretty.js:126979` / `127134` | confirmed |
| 依赖 | `@anthropic-ai/claude-agent-sdk` 0.3.217 → 0.3.220（精确锁定，唯一依赖变更） | `package.json` | confirmed |

变更规模：daemon 1969 个顶层声明中 1935 个结构指纹不变，34 个改动 + 41 个新增；其中 10 个归一化后完全相同，属纯 minifier churn。stdio bundle 与 v0.6.1 **逐字节相同**。

---

## §1 Skip：从"打断进程"降为"hook 裁决"

**结论**：v0.6.1 的 Skip 是一次真正的中断——hook 只记标志，真正结束 turn 的是随后在 `tool_result` 边界调用的 SDK `query.interrupt()`。v0.6.2 让 hook 直接**返回** `{continue:!1, stopReason:"..."}`，中断路径整条删除。后台任务之所以能活下来，不是因为新增了保护，而是因为**杀死它们的那个动作没有了**。

### 旧机制（v0.6.1）

- 流式路径：session-manager 持有一个 per-turn 闭包，在首个 `tool_result` 上以调试标签 `"anchor-turn skip"` 调用 `query.interrupt()`，并打日志 `[session-manager] Skip called — interrupting turn at tool_result boundary`（confirmed）。
- 非流式路径：`createAgentSdkAdapter` 用一次性守卫在 `user`/`tool_result` 分支调 `X.interrupt()`，日志 `[claude-sdk] Skip called — interrupting turn (non-streaming)`（confirmed）。
- `"anchor-turn skip"` 从来不是一个独立概念，只是那次 interrupt 调用的**上下文标签**，随调用一起消失（confirmed）。

### 新机制（v0.6.2）

- 流式 hook（matcher `g_` = `"mcp__aladuo__Skip"`，`daemon.pretty.js:71990`）：
  ```js
  async Z => { let he = Z?.agent_id !== void 0, Ae = he ? null : $e.currentTurn;
    return Ae ? Ae.skipCalled = !0 : !he && $e.cliTurnTentative && (…skipObserved = !0),
      { continue: !1, stopReason: "The agent intentionally ended this turn silently by calling Skip." } }
  ```
  （`daemon.pretty.js:71992`–`71996`，confirmed）
- 非流式 hook 同形，`daemon.pretty.js:48437`（confirmed）。
- `interrupt` / `interruptRequested` 在 Skip 路径上全数删除；per-turn 队列项末尾从 `…toolUseMap, toolBlockIndexMap, skipCalled, interruptRequested` 变为 `…toolUseMap, toolBlockIndexMap, skipCalled`（`daemon.pretty.js:72466`–`72480`，confirmed）。`query.interrupt()` 仍存在于会话级中断（真实用户打断 / 会话回收，`daemon.pretty.js:71809`），与 Skip 无关（confirmed）。
- `stopReason` 那句话在 duoduo 内部**从不被读取**：全 bundle 仅两处写入（`daemon.pretty.js:48439` / `71996`），不落 WAL、不进 outbox、不写 transcript——它是交给 Agent SDK 的字段，由 SDK 决定如何呈现（confirmed）。

### 三条子声明的代码归属

1. **后台 worker 存活**：duoduo 自己的 hold-stdin 机制本身没有改动——`R = t.holdInputOpenForBackgroundAgents === !0`（`daemon.pretty.js:48496`）、释放门 `G = () => { P || I && $.size === 0 && (…) }`（`48509`–`48511`）、后台 task 集合 `$` 由 SDK 的 `task_started` / `task_notification` 事件增删（`48553`–`48562`）、生成器 `ue()`（`48523`–`48527`）在 v0.6.1 就都存在（confirmed）。v0.6.2 **没有增加任何保护，只是删掉了那次 interrupt**。
   > 但要诚实：**"interrupt 会连带撕毁在飞的 Task 子代理"这一步，在两版 bundle 里都观测不到**——那发生在未被内联的 peer 依赖 `@anthropic-ai/claude-agent-sdk` 里。变更日志那句 "the underlying runtime reports such a teardown as 'stopped by the user'" 在 v0.6.1 daemon、v0.6.2 daemon、v0.6.2 cli 三份 bundle 中命中数均为 **0**。因果链的这一环是**未证实推测**；bundle 能证实的只有"那次 interrupt 调用被删除了"。
2. **子代理 Skip 不再让父 turn 失声**：`agent_id` 护栏（`daemon.pretty.js:71992` / `48437`）。v0.6.1 的 hook 无此判据，子代理调 Skip 会把父 turn 标记为 skipped，导致父 turn 以 `text: undefined, skipped: true` 收尾并抑制 outbox（confirmed）。
3. **首个 turn 被 skip 不再抹掉后续产出**：非流式适配器从一个粘滞标志改为三个（`d` 当前 turn skip 中、`p` 本次 run 曾 skip、`f` 本次 run 有产出，`daemon.pretty.js:48425`–`48427`），且 `d` 在每个 `result` 消息处复位（`daemon.pretty.js:48632`）。v0.6.1 的 `d` 一旦置位永不清除，会把同一次 run 的**每一个**后续结果连同流式文本一起吞掉（confirmed）。

### 上游未声明的两条配套改动

- **Skip 后 PostToolUse 不再消费 `pendingSteer`**：hook 顶部新增两个提前返回 `if ($e.currentTurn?.skipCalled === !0) return {}` / `if ($e.cliTurnTentative?.skipObserved === !0) return {}`（`daemon.pretty.js:72004`–`72005`）。v0.6.1 会把一条 park 中的插话 `markDone` 并注入一个即将被丢弃的 turn——插话就此消失（confirmed）。
- **admission 拒绝向已 Skip 的 turn park 新文本**：park 判据新增 `!Bs.skipCalled` 项（`daemon.pretty.js:72941`）。落空后走 `y.pendingWake = !0, y.wakeResolver?.()`（`daemon.pretty.js:73007`）当作新 turn 重新 drain（confirmed）。

这两条合起来是一个自洽的第二重修复：**决定沉默的 turn 不应再吸收新入站消息**。

### 一处开放风险（未证实推测）

Skip 工具的名称、描述与输入 schema 与 v0.6.1 **逐字节相同**（`daemon.pretty.js:47878`，confirmed）——包括那句"Calling Skip immediately ends this turn"和对下一 turn `<skip-rewind>` 块的承诺。但 `pending_skip_rewind` 在整个 bundle 里**只有一个写入者**：Skip MCP 工具体本身（`daemon.pretty.js:47860`）。hook 返回 `continue:false` 之后工具体是否仍会执行，完全由 SDK 决定，duoduo 没有兜底。若不执行，Claude 路径丢的**只是 `<skip-rewind>` 块**（读 `daemon.pretty.js:59943`、渲染 `60964`–`60976`）——影响面到此为止：seal-on-skip 门（`72893`–`72910`）整个位于 `runtime === "codex"` 分支内，本来就不适用于 Claude；Claude 侧的等价门是 admission 的 `!Bs.skipCalled`（`72941`），由 hook 自己置位，与工具体是否执行无关。codex 路径也不只靠状态探测——它另有直接的工具调用观察器（`57522`，暴露为 `activeTurnSkipObserved()` `57974`，消费于 `72901`）。**未证实推测**，需实测确认。

---

## §2 Job frontmatter 的 SDK 配置层

**结论**：这不是一套新配置系统，而是把 v0.6.1 已经存在的**通道描述符**配置词汇（`prompt_mode` / `allowedTools` / `disallowedTools` / `additionalDirectories` / `claude: {tools}`）接进了 job 文件，**只新增了两个函数**：`Due`（从解析结果里摘出这 5 个键，`daemon.pretty.js:55184`）与 `applyJobSdkConfigOverride (Fz)`（`48847`）。其中并集助手 `mergeClaudeToolLists (aae)`（`48843`）**并非新增**——它在 v0.6.1 就以 `oJe`（v0.6.1 `daemon.pretty.js:48820`）存在并被通道配置合并器调用，v0.6.2 只是给了它第二个调用点。真正值得记录的是它**没有**兑现的那一半：`kernel/config/job.md` 随包发布、能被 `ManageConfig` 写入，但运行时从不加载它。

### 叠加链（两处，不是一处）

`applyJobSdkConfigOverride (Fz)`（`daemon.pretty.js:48847`）：

```js
!e || !t ? e : { ...e,
  prompt_mode:           t.prompt_mode           ?? e.prompt_mode,
  allowedTools:          t.allowedTools          ?? e.allowedTools,
  disallowedTools:       t.disallowedTools       ?? e.disallowedTools,
  additionalDirectories: t.additionalDirectories ?? e.additionalDirectories,
  claudeTools: mergeClaudeToolLists(e.claudeTools, t.claudeTools) }
```

- **前四个键是整体替换（replace），只有 `claude.tools` 是并集（union）**——`job.md` 的注释只说了后者是 union，没说前四个是 replace（confirmed）。
- 两条 drain 入口都被包了：批量/admission 路径 `daemon.pretty.js:59673`，长驻流式路径 `daemon.pretty.js:60482`（confirmed）。
- job 快照**每 turn 从磁盘重读**（`daemon.pretty.js:72781`），所以编辑一个在跑的 job 文件下一 turn 即生效（confirmed）。

### 已证实缺陷：job 的 kind 层不存在

kind 描述符由 `_We`（`daemon.pretty.js:48898`）按 `event.source.kind` 选取。而 job 的 drain 锚点事件来自 cadence 扫描器（`source.kind = "cadence"`，`daemon.pretty.js:75046`）或 notify 唤醒（`"route"`），**永远不是 `"job"`**。因此 `kernel/config/job.md` 不会被任何路径读到（confirmed）。

一个无需插桩即可观测的症状：每个 job 的 system prompt 里 `## Runtime Context` 渲染出的是 `channel_kind: cadence`（`daemon.pretty.js:48262`）。

对照 v0.6.1：`bootstrap/config/` 只有 `acp.md` / `feishu.md` / `stdio.md`，三者都是真实的 ingress adapter kind，因此 kind 文件确实能解析出来。v0.6.2 新增的 `job.md` 不属于这一类。

> 变更日志称 "with host-wide defaults in kernel/config/job.md" —— **代码不支持**。文件发得出去、`ManageConfig(kind="job")` 也写得进去，但没有任何路径在 job 运行时加载它。

### codex 拒绝：两条路径，检查的东西不同

- **建作业时硬拒**：`ManageJob` handler（`daemon.pretty.js:68511`）`if (a !== void 0 && o === "codex") throw new Error(_Qe)`，`_Qe` 是那段五行说明文本（`daemon.pretty.js:68631`）（confirmed）。
- **运行时软警告**：`[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert`（`daemon.pretty.js:72719`–`72726`）（confirmed）。
- 硬拒对变更日志描述的那个场景实际是**空转的**：序列化时 `runtime` 等于 `"claude"` 就不写进文件（`daemon.pretty.js:55168`），而 zod 又把工具的 runtime 字段默认成 `"claude"`（`daemon.pretty.js:68474`）——所以在 `ALADUO_DEFAULT_RUNTIME=codex` 的主机上创建一个带 `prompt_mode` 的 job 根本不会触发硬拒，只会在跑起来时拿到那条日志（confirmed）。

### 命名错位（变更日志未提）

工具参数叫 `extra_tools`（`daemon.pretty.js:68694`），handler 把它改名成 `claudeTools`（`68530`），落到文件里渲染成 `claude:` / `  tools:`（`55176`–`55179`）。**照着变更日志找 `claude` 参数的人会找不到**。

### 其它未声明的后果

- `allowedTools` 只自动批准权限、**不能**扩面：数据流上 `allowedTools` 与 `tools` 来自互不相交的两个源（`daemon.pretty.js:59720`），且 SDK 选项构造处显式检测并告警（`48382`–`48387`）（confirmed）。
- 四个列表键对 daemon 自带基线是**并集**（`daemon.pretty.js:59720`–`59734`），因此 job 无法移除 `ManageJob`/`ManageSession`/`Notify` 的自动批准，也无法去掉 memory 目录（confirmed）。
- 同一个 MCP 工具同时写进 `allowedTools` 和 `disallowedTools` 时，被静默判为 ALLOWED（`daemon.pretty.js:59724`），无任何提示（confirmed）。
- **给 job 设 `additionalDirectories` 会反向打开 additional-directory 的 CLAUDE.md 自动加载**（`daemon.pretty.js:59659`–`59663` 的 `Hde` + 环境标志 `48400`）：该抑制只在列表恰好等于 `[memoryDir]` 时生效。一旦 job 自己加一个目录，整个列表（含 memory 目录）的 CLAUDE.md 都会被自动注入——而 memory 目录的 CLAUDE.md 正是已经作为 system-prompt 第 4 层注入的广播板（`48264`–`48273`）。**防重复注入的守卫被这个新功能绕开了**（confirmed）。
- 非法 `prompt_mode` 值被静默丢弃而非拒绝（`daemon.pretty.js:33918` 返回 undefined，`55150` 只在有值时回填）——打错字的 job 会安静地带着 preset 运行（confirmed）。
- JSON-RPC 的 `job.create` **没有**扩展（`daemon.pretty.js:78546`–`78554`），SDK 配置只能经 `ManageJob` 工具或手改文件设置（confirmed）。

---

## §3 守护进程重启原因：一条不走 WAL 的一次性旁路

**结论**：重启原因不是新事件类型，而是**两个进程之间的一次性文件握手**。CLI 在停掉旧 daemon **之前**原子写入 `<varDir>/daemon-restart-reason.json`，新 daemon 的 `main()` 读一次、立刻删除、存进模块级全局，之后由既有的 `daemon-restart-hint` 瞬态 user 块带给会话。

### 写侧（CLI）

- 路径 `path.join(paths.varDir, "daemon-restart-reason.json")` = `~/.aladuo/var/daemon-restart-reason.json`（`cli.pretty.js:402`，与 daemon 侧 `daemon.pretty.js:49058` 是同一份代码）（confirmed）。
- 载荷恰好三个字段：`{reason, requested_at, requested_by_agent}`（`cli.pretty.js:127105`–`127109`）（confirmed）。
- **先写后停**（`cli.pretty.js:116665`），且带**比对删除**回滚：只有当文件里的 `requested_at` 仍是本次写入的那个才删（`cli.pretty.js:430`），因此并发重启的原因不会被误删（confirmed）。
- 回滚在 `started === false`（重启没真正发生）时触发；**launchd 超时路径故意不回滚**，好让慢启动的 macOS daemon 仍能拿到原因（confirmed）。

### 读侧（daemon）

`claimDaemonRestartReason (wae)`（`daemon.pretty.js:49061`）：

1. `readFile` — ENOENT 直接返回 null；
2. `fs.rm(path, {force:!0})` — **在 JSON.parse 之前无条件删除**；
3. `JSON.parse` 包在 try 里，任何异常返回 null。

因此**畸形文件被认领并销毁，不重试、无日志**，也无法区分"没给原因"和"原因文件损坏"（confirmed）。

`main (ltt)` 的调用点在运行时初始化之后、RPC server 绑定之前：`let f = await claimDaemonRestartReason(d); setPendingRestartReason(f), f && K("[pid0] restart reason claimed", {...})`（`daemon.pretty.js:78938`–`78942`）（confirmed）。

> **活体复现**（隔离 HOME + :20334，还原版 daemon）：手工投放该文件后启动，日志逐字出现 `[pid0] restart reason claimed { requested_at: '…', requested_by_agent: true }`，文件随即消失。注意该日志是 info 级，默认日志级别是 `warn`（`daemon.pretty.js:30887`），不设 `ALADUO_LOG_LEVEL=info` 会误判为"代码没执行"。

### 送达面

原因经 `renderDaemonRestartHint (Mde)`（`daemon.pretty.js:59574`）拼进既有的 `daemon-restart-hint` 瞬态块：

```js
`[system] You're running under a new daemon process (started ${e}).`
  + (t ? ` Restart reason, given by the caller: ${t.reason} (requested ${t.requested_at}).` : "")
```

由 `buildTransientUserBlocks (sfe)` 作为**第一个块**（在 user-input 之前）压入（`daemon.pretty.js:61085`）。`daemon-restart-hint` 这个 tag、块位置与 `daemonRestartHint` 管道在 v0.6.1 **已经存在**——v0.6.2 只是往里塞了原因（confirmed）。

> 变更日志称 "-r reaches every session that wakes after the restart" —— **过度声称**。注入被 `Lde`（`daemon.pretty.js:59545`–`59572`）门控，对任何非 `channel` 类会话返回 `out-of-scope`：`job:` / `meta:` / `cadence:` / `subconscious:` / `system:` 会话**永远拿不到**（confirmed）。

### `--wake`

- 走的是**未改动**的 `session.notify` RPC（`daemon.pretty.js:78356` 分发、`77849` handler）。daemon 侧这条路径与 v0.6.1（`77645`–`77722`）**结构完全相同、仅差 minifier 重命名**——是 AST 层面的相同，不是字节层面的（confirmed）。`--wake` 给 daemon 增加的表面积为零。
- 文本三段空格拼接，无原因时中间段省略（`cli.pretty.js:116702`）：`The daemon was restarted, which may have cut off the turn you were running.` + `Reason given by the caller: <reason>` + `Check whether the work you were doing completed before continuing.`
- 目标解析：精确 session_key → 唯一 `display_name` 别名；歧义是硬失败（`daemon.pretty.js:77825`–`77848`）（confirmed）。
- 送达后成为一条 WAL `route.deliver` 事件 + mailbox `.pending` 文件 + `preempt:"never"` 的唤醒（`daemon.pretty.js:77870`–`77888`）（confirmed）。
- 呈现给目标会话时用的是**外部对等会话**模板而非系统通知模板：`<session-notify … source_kind="external" source_label="daemon-restart">`，后接"Another session has relayed information to you…"（`daemon.pretty.js:60881`、`60930`–`60941`）（confirmed）。

> 变更日志称 "--wake notifies a specific session that was mid-conversation" —— **代码里没有任何 mid-conversation / 未完成 turn 的判定**，`Get` 对任何可解析的目标一律发送（confirmed）。

### "agent 从会话内重启"的判定

`ps -Ao pid,ppid` 建 `Map<pid,ppid>`，从 `process.pid` 向上走祖先链，看是否命中 daemon pid（`cli.pretty.js:116786`–`116815`）。daemon pid 由 `<runDir>/daemon-supervisor.pid.json` 读出，`process.kill(pid,0)` 的存活确认**只把守快路径**：末尾那条 `return t` 会把 pid 文件里的值无条件返回，因此一个已死的陈旧 pid 仍会被返回（`cli.pretty.js:116295`–`116303`）。实际影响很小——陈旧 pid 匹配不上任何祖先，`requested_by_agent` 只会得到 `false`（confirmed）。

**这个 `ps` 调用既不是前缀解析也不是存活探测**——它只回答"这个 `duoduo` 进程是不是 daemon 的后代"，结果写进 `requested_by_agent`。

未加 `-r` 且判定为 agent 发起时打印警告，且**预告了一个变更日志没提的破坏性变更**：`The next release will reject this call.`（`cli.pretty.js:127103`）（confirmed）。

### 其它未声明的后果

- **`requested_by_agent` 是只写字段**：daemon 解析它（`daemon.pretty.js:49078`）、打日志（`78941`），但没有任何代码分支依赖它（confirmed）。
- **认领到的原因永不清除**（`daemon.pretty.js:49085`–`49091`）：跑了一周的 daemon 仍会给此刻才首次跨越重启边界的 channel 会话追加 `Restart reason … (requested <一周前>)`（confirmed）。
- 原因文件**没有 TTL、没有 daemon 身份、没有 nonce**：任何一次 daemon 启动都会认领当时躺在那里的文件（confirmed）。
- `-r=VALUE` 不被接受（只有 `--reason=` 支持 `=` 形式，`cli.pretty.js:126992`）；重复 `-r` 静默覆盖，而 `--wake` 累加（confirmed）。
- **wake 失败不影响退出码**：`failed to wake <target>` 只进 stderr，`process.exitCode` 仅在参数解析错误时设置（confirmed）。
- `--wake` 扇出是**严格串行**、每目标 10s RPC 超时，N 个不可达目标会让 CLI 挂 N×10s（confirmed）。
- 这两个新 flag **在 `duoduo daemon --help` 里完全没有文档**（用法行仍是 `duoduo daemon <start|stop|restart|status|config|logs> [--daemon-url <url>]`，`cli.pretty.js:127019`）（confirmed）。
- `duoduo daemon restart` 现在会先 `loadHostDotEnv` 并重新应用 onboard 配置（`cli.pretty.js:127098`–`127100`），v0.6.1 的重启分支两样都不做——这直接缓解了本仓库 CLAUDE.md 记载的"daemon 重启后丢 PATH"老坑（confirmed）。
- daemon 的崩溃提示文案也跟着改了：`duoduo daemon restart` → `duoduo daemon restart -r "recovering from a codex runtime crash"`（`daemon.pretty.js:61578` / `61582`）（confirmed）。

> **架构注记**：这是对"一切状态派生自日志"的一次**有意破例**。原因文件是一个由另一个进程（CLI）写、不进 WAL、无事件 ID、无 `by_id` 索引的普通 JSON 文件。理由也说得通——它必须在 daemon 存在**之前**就写好——但它确实是本仓库既有 §4 论述之外的一条旁路。

---

## §4 Notify 别名解析与 job 列表健壮性

**结论**：两条变更日志声明都对应真实代码，但都比文案窄。

### 工具端新解析器

`XQe`（`daemon.pretty.js:69237`）三段式：

1. **精确 key 快路径**：`if (n in r) return n;`（`daemon.pretty.js:69248`）；
2. **别名匹配**：读每个会话的 `var/sessions/<sha256>/meta.md` 建 `Map<key, display_name>`（`daemon.pretty.js:69102`），**精确、区分大小写、两侧 trim**；
3. **歧义**：按 `last_event_at`（回退 `updated_at`）字符串降序排出候选，提示 `Retry with the full session_key of the one you mean (most recent activity first):`（`daemon.pretty.js:69253`–`69264`）。

v0.6.1 的 `LQe` 只有两种结局：命中或抛 `Target session not found`——别名从未被查询（confirmed）。工具 schema 在 v0.6.1 就已经宣传支持别名，描述串**跨版本逐字节相同**（`daemon.pretty.js:69069`）——所以这确实是"描述先行、实现补齐"（confirmed）。

### "排除 archived" 的真实含义

指的是 **orphan job 会话**：`ume`（`daemon.pretty.js:69091`）构造一个新的 JobManager、`listJobs()`、把活跃 job 的 session key 建成集合，不在集合里的 `job:` 会话标注 `orphan — job archived or recreated, will not run`（confirmed）。

普通的 `duoduo session archive` 会话**在 v0.6.1 就已经被排除**了——因为扫描器只枚举 `sessionsDir`，归档会移到 `sessions-archive/`（confirmed）。

> 变更日志称 "a stale identifier used to be accepted and reported as delivered into an inbox nobody drains" —— **在 v0.6.2 仍然成立**，有两条：
> 1. 直接传一个 orphan job 的**原始 session key**：快路径在任何 orphan 检查之前就返回了（`daemon.pretty.js:69248`）；
> 2. `duoduo session notify <已归档 job 的别名>`：CLI/RPC 走的是**另一个未改动的解析器** `H2`（`daemon.pretty.js:77825`），没有 orphan 过滤，且 handler 显式允许 `job` 类（`77863`）。
>
> 也就是说，工具端和 CLI 端现在**分歧更大而不是更小**：同一个用户概念，两套实现，两个答案。

### 状态词汇的替换

v0.6.1 的目标列表投影是 `{session_key, status}`，渲染成 `- <key> (<status ?? "unknown">)`。v0.6.2 换成 `{session_key, display_name, orphan}`（`daemon.pretty.js:69080`），渲染成 `- <key> (alias "<name>"; orphan — …)`（`69116`）。

**这里删掉的是死代码，不是能用的功能**（confirmed）。`status` 从未被持久化到 `var/sessions/<hash>/state.json`——它只活在内存里的 actor 记录上（`daemon.pretty.js:72814`/`73213`/`73311`/`73313`/`73801`）和 RPC 投影里（`78661`）。而 v0.6.1 的投影恰恰是从 `state.json` 对象上读 `n.status`，于是**每一条目恒定渲染成 `(unknown)`**。同理，近似匹配候选排序里那条"按 `active < idle < other` 排"的决胜项恒返回 2、恒为 0 差，v0.6.1 的有效顺序**本来就是**"长度 → 字典序"——与 v0.6.2 显式写出的排序（`daemon.pretty.js:69183`）行为完全一致。**因此这不是排序质量回退**，尽管乍看像。

### 畸形 job 文件

`JobManager.listJobs()` 的 try/catch 从"包住整个 for 循环、任何异常 `return []`"收窄成**每文件一个**，坏文件记进 skip 列表并打 `[JobManager] Skipping unreadable job file …`（`daemon.pretty.js:55492`）（confirmed）。

**真实严重性比变更日志说的高**：`scanAndSpawnDueJobs (F2)` 走的是同一个 `listJobs()`（`daemon.pretty.js:74990`），所以 v0.6.1 里 `var/jobs/active` 下一个 YAML 语法错误会让**整台主机的所有 cron job 停止调度**，而不只是列表看起来空（confirmed）。

新增的缓存交互（未声明）：降级结果现在会连同坏文件的 mtime 一起写进 `jobListCache`（`daemon.pretty.js:55504`–`55509`），因此警告每次文件改动只打一次，而那个畸形 job 会**一直静默缺席**直到它自己的 mtime 变化（confirmed）。

`ume` 的失败模式是"关闭式"的且会说谎：JobManager 初始化或列举抛异常时它返回**空集合**（`daemon.pretty.js:69098`），于是**每一个** `job:` 会话都被标成 orphan、所有 job 别名被剥掉（confirmed）。

---

## §5 `duoduo upgrade`：解析真实安装前缀（纯 CLI）

**结论**：整条升级路径 100% 在 cli bundle 里——daemon bundle 中零 npm 调用、零 `--prefix`、零 `ps` 遍历，只有一句给运维看的提示文案（`daemon.pretty.js:61581`）（confirmed）。

- **前缀解析** `wue`（`cli.pretty.js:116823`）：把 `process.argv[1]` 解析成路径段，取**最后一个** `node_modules` 之前的部分，若结尾是 `lib` 则弹掉——POSIX 全局布局 `<prefix>/lib/node_modules/@openduo/duoduo/…` 由此还原成 `<prefix>`，而 Windows 布局（无 `lib`）原样保留。解析不出来就不传 `--prefix`，并打 `upgrading to <spec> (npm default prefix)...`（confirmed）。
- **npm 解析** `Nue`（`cli.pretty.js:116834`）：优先 `<execDir>/../lib/node_modules/npm/bin/npm-cli.js`，以 `{command: process.execPath, leadingArgs:[npm-cli.js]}` 的形式**用当前 Node 直接跑 npm 脚本**——这就是"即使 node 不在 PATH 上也能工作"的实现（confirmed）。
- **实际发出的命令**（`cli.pretty.js:127177`，无 shell，120s 超时）：
  ```
  <node> <npm-cli.js> install -g --prefix <resolved> @openduo/duoduo@<version>
  ```
  校验命令同样带 `--prefix`（`cli.pretty.js:127190`），回读 `JSON.parse(stdout).dependencies?.["@openduo/duoduo"]?.version`，字段缺失或抛异常时回落到**请求的版本号**（如 `"latest"`）而非实测值（`127194`）（confirmed）。
  需要说清 v0.6.1 的缺陷究竟在哪：那时 install 和 list **都**用 npm 配置的默认前缀，两者是**互相自洽**的——校验读的正是安装写的那棵树。真正的问题是这两者一起指向了**配置的默认前缀**，而不是**当前正在运行的 CLI 所在的前缀**；两者不一致的主机（macOS 菜单栏应用即如此安装）上，升级把新版装进了一棵没人执行的树，再从同一棵错树里读回版本号，于是"已安装 vX"的报告本身就是假的。变更日志只提了安装侧，没提校验侧（confirmed）。
- **launchd 分支既没删也没搬家**，而是把升级路径里那份重复的内联分支折叠进了既有的共享重启例程（v0.6.1 的 `rue` → v0.6.2 的 `Vj`），后者本来就带 5s / 150ms 的 `/healthz` 轮询。三条被删的字面量（`"restarting daemon via launchd..."` / `"daemon restart initiated"` / `"daemon restarted"`）都属于那份重复代码（confirmed）。
- **健康检查**：单次探测 = `GET /healthz`，通过后再发一次 `system.runtime.info` RPC；探测超时 500ms、轮询间隔固定 150ms、总预算 5s，**没有指数退避**（`cli.pretty.js:116317` / `116660`）（confirmed）。

> 变更日志称 "correctly distinguishing 'still starting' from 'failed to start' on slower hosts" —— **只在 macOS/launchd 路径上成立**。那个专用错误类型只在 launchd 轮询超时处抛出一次（`cli.pretty.js:116692`）。Linux/非 launchd 路径会先 SIGTERM 掉自己 spawn 的子进程再抛普通 Error（`cli.pretty.js:116480`），于是**慢启动的 Linux 主机仍被报成硬失败**（confirmed）。

第三种结局（变更日志未提）：`started === false`。准确含义是"**我们尝试停机之后，旧 daemon 仍在应答**"——`Hj` 在自己的健康探测仍然成功时直接返回，不 spawn 任何东西（`cli.pretty.js:116377`），分三种子情形：pid 文件里的 pid 仍存活、darwin 上由 launchd 托管、以及有东西答 `/healthz` 但找不到存活 supervisor pid 的 `ghost` 态（`116379`–`116395`）。CLI 对三者打同一句 `warning: the daemon did not restart (the previous process is still running the old code).`（`cli.pretty.js:127220`）。v0.6.1 的整段重启（含日志）本身是被一次健康探测门控的，问题不在"无条件打印"，而在于它**丢弃了返回值里的 `started` 标志**，无论真假都打 `"daemon restarted"`（v0.6.1 `cli.pretty.js:126756`）——这正是变更日志说的"reported success"（confirmed）。

### 未声明的行为变化

- **版本参数白名单**（实为一处参数注入加固）：`xue`（`cli.pretty.js:116861`）要求匹配 `/^[A-Za-z0-9][A-Za-z0-9.+-]*$/`，否则退出码 2 并提示 `Installing from a path, URL or git remote is not supported here.` v0.6.1 把 `argv[0]` 直接插进 npm spec，所以 `duoduo upgrade ./evil.tgz`、`git+ssh://…`、甚至 `--registry=http://attacker` 都会原样传给 npm。**对原先用 tarball 升级的人这是一次行为回退**（confirmed）。
- 每次成功升级后新增一条提示：agent skills 来自 GitHub 仓库而非 npm 包，需要 `npx -y skills add …` 单独刷新（`cli.pretty.js:127195`–`127196`）（confirmed）。
- `readOption` 的函数体与 v0.6.1 **逐字节相同**——它没有被改写，只是被加进了 `__export` 表。连同 `parseUpgradeArgs` / `parseRestartArgs`，v0.6.2 的**全部导出面变化就是"把 CLI 参数解析变得可测试"**（confirmed）。
- `parseUpgradeArgs` 不接受 `-r`（升级原因是机器生成的 `upgraded @openduo/duoduo to <resolved>`）；`parseRestartArgs` 不接受位置参数（confirmed）。
- **"still starting" 的友好判别没有同步给兄弟命令**：`duoduo daemon restart` 调同一个 `Vj` 却不 try/catch（`cli.pretty.js:127110`），慢启动的 macOS 主机上它仍会抛出原始的超时错误（confirmed）。

---

## §6 依赖与残余差异

- **唯一依赖变更**：`@anthropic-ai/claude-agent-sdk` `0.3.217` → `0.3.220`，精确锁定，无 `^`。两版 `package.json` 的其余 13 个依赖逐字相同（confirmed）。
- 变更日志提到的 `find-my-way` 传递性告警**在发布的 `package.json` 里看不到**（没有 `overrides` / `resolutions` 字段）——那是 lockfile 层面的锁定，不随 npm 包发布（confirmed）。
- daemon 的 HTTP 服务确实**默认只绑 loopback**：`ALADUO_DAEMON_HOST ?? "127.0.0.1"`（`daemon.pretty.js:78981`），端口 `ALADUO_PORT ?? PORT ?? 20233`（`78980`）（confirmed）。
- **stdio bundle 与 v0.6.1 逐字节相同**——本次完全未变更（confirmed）。
- **npm 包里恰好 5 个文件有差异**（`diff -rq`）：`dist/release/daemon.js`、`dist/release/cli.js`、`package.json`、新增的 `bootstrap/config/job.md`、以及 `bootstrap/meta-prompt.md`（14126 → 13711 字节）。`bin/duoduo` 与 `scripts/postinstall.mjs` 逐字节未变；`channel-acp.js` / `feishu-gateway.js` / `yoga.wasm` 同样未变（confirmed）。
- **`meta-prompt.md` 有两处改动，都是"合并压缩"而非语义反转**（confirmed）——这是 agent 身份提示词，值得单独记：
  1. *Working Posture* 段：原来三段（"资源先于求助" / "上下文单薄时先收集" / "断言前先检查"）合成一句 `I look before I claim, and I am resourceful before I ask for help.`；"简洁" 与 "不絮叨每个念头" 两段合一；"不承诺没排上的后台工作" 与结尾的信任段落改写。
  2. *Projects* 段（上游变更日志完全未提）：十一行拆散的定义压缩成一段——"含 `CLAUDE.md` 的目录就是 project：一个面向持续领域的可复用工作上下文，而非单个任务"，并把 `AGENTS.md → CLAUDE.md` 符号链接那句从段首挪到段尾。语气也从 `I should dispatch the work` 改成 `I dispatch the work`（**从建议式改为陈述式**，与 v0.6.1 整体的"去 should 化"改写一致）。
- 31 处 daemon 声明差异里有 10 处在标识符位置归一化后完全相同（cli 44 处里有 20 处），属于 esbuild 重新 mangle 造成的噪声，不含语义变化（confirmed）。

---

## 变更日志声称但代码不支持的条目

| 声称 | 实情 |
|---|---|
| "host-wide defaults in `kernel/config/job.md`" | 文件发布并可写，但运行时从不加载；job 的 kind 层不存在（`daemon.pretty.js:48898`） |
| "`-r` reaches **every** session that wakes after the restart" | 仅 `channel` 类会话；job / meta / cadence / subconscious / system 会话被 `Lde` 判为 out-of-scope（`daemon.pretty.js:59545`） |
| "`--wake` notifies a session that **was mid-conversation**" | 无任何 mid-conversation 判定，对任何可解析目标一律发送（`cli.pretty.js:116701`） |
| "stale identifier used to be accepted…" | 对 orphan job 的**原始 key**（`daemon.pretty.js:69248`）和 CLI 的 `session notify` 别名路径（`77825`）**仍然成立** |
| "distinguishing 'still starting' from 'failed to start'" | 仅 macOS/launchd 路径；Linux 慢启动仍报硬失败（`cli.pretty.js:116480`） |
| "the underlying runtime reports such a teardown as 'stopped by the user'" | 该字符串不在任一版本的 bundle 里；描述的是未内联的 peer 依赖 `@anthropic-ai/claude-agent-sdk` 的行为，本仓库无法据此证实 |
| "a nested `claude: { tools }`" 作为工具参数 | 工具参数实际叫 `extra_tools`（`daemon.pretty.js:68694`），handler 才改名成 `claudeTools` |
| "Agents restarting from inside a session are warned" | 依赖 `ps -Ao pid,ppid` 可用且祖先链完整；`ps` 失败或经 nohup/detach 包装时静默不警告 |

同时记录两条**本轮分析自己被对抗验证推翻**的初判，以免它们作为"发现"流传出去：

| 曾以为 | 实情 |
|---|---|
| Notify 列表"丢掉了可用的 `status` 显示"、近似匹配"丢了活跃度决胜项" | 两条都不成立。`status` 从未持久化进 `state.json`，v0.6.1 的列表恒打印 `(unknown)`、决胜项恒为 0 差——v0.6.2 删的是死代码，不是能用的功能 |
| `duoduo upgrade` 的校验命令不带 `--prefix` 会"读错另一棵树" | v0.6.1 的 install 与 list 用的是同一个默认前缀，二者自洽；真正的缺陷是它们一起指向了**配置的**默认前缀而非**运行中 CLI 所在的**前缀 |
| Skip 的 interrupt "连带撕毁后台 Task" | 该步骤发生在未内联的 SDK 里，两版 bundle 均不可观测——是未证实推测，不是 confirmed |

---

## 对既有分析文档的影响

本轮已随之更新：

- **全部 `daemon.pretty.js:LINE` 锚点**：833 个引用中 790 个由 `tools/remap_doc_anchors.mjs` 自动迁移（导出名 → 结构偏移 → 声明顺序 → 标识符盲行形状四级降级），其余 43 个落在本版真正改动的函数里，已逐条手工复位。
- **全部短名**：458 处、162 个符号由 `tools/retarget_symbols.mjs` 单趟同时替换。注意两个跨版本陷阱：`nX` 从 `rehydrateSessionState` 变成 trace logger，`CI` 从 status→rank 函数变成条目格式化器，`ple` 从投递执行器变成 `detectOrphanMemory`——**任何只写短名不写行号的旧笔记在本版都可能是错的**。
- `AGENT_INTERNALS_ANALYSIS.md`：§1 认知装配（`ZE`→`JE`）、§2 Turn/Drain（Skip 段整体重写）、§3 Session Actor（steering park 判据新增 `!skipCalled`）、§5 Gateway（`session.notify` 分发行号）、§6 Cadence（`scanAndSpawnDueJobs`/`createJobScheduler` 短名）。
- `ARCHITECTURE_ANALYSIS.md`：`var/` 目录树新增 `daemon-restart-reason.json`（瞬态）；`bootstrap/config/` 新增 `job.md`；重启命令一律改写为带 `-r "<原因>"` 的形式。
- `DUODUO_FRAMEWORK_GUIDE.md`：分析对象升到 v0.6.2。

仍待实测的开放项（已登记）：

1. Skip 的 PreToolUse hook 返回 `continue:false` 之后，`mcp__aladuo__Skip` 工具体是否仍执行？若否，Claude 运行时的 `<skip-rewind>` 闭环在 v0.6.2 静默失效。
2. 工具端 Notify 对 orphan job **session key** 直传是否真会报 `Notify delivered.`
3. `duoduo session notify <已归档 job 的别名>` 是否仍会成功"送达"。

---

## 复现本文

```bash
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"
SP=/tmp/duoduo-recon
# 取两版出厂产物并反混淆（见 reconstruction/VERIFICATION.md 复现节）
cd reconstruction/tools
OLD="$SP/beautified/v0.6.1" NEW="$SP/beautified/v0.6.2" bash bump.sh
# 逐声明 diff 在 $SP/.build/bump/diff/{daemon,cli}/ 下：
#   <base>.old.js / <base>.new.js   两版原文
#   <base>.norm.diff                标识符归一化后的 diff（只剩真实变化）
#   <base>.delta.json               字符串/属性/数字字面量增删
```
