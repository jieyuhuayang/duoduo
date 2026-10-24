# duoduo 与 botmux 驱动 Claude Code / Codex 的方式对比

> 调研日期：2026-10-16。
> 调研问题：duoduo 怎样把 Claude Code 和 Codex 当作推理引擎来使用，[botmux](https://github.com/deepcoldy/botmux) 怎样使用同样两个工具，两种做法各自的长处与代价是什么。
> 版本对齐：duoduo 的陈述对齐 `@openduo/duoduo` **v0.8.6**，证据是本仓库的还原源码，按名字引用（`真名 (短名)`）；机制细节见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md) 第 2、3、7 节，本文只引用结论所需的部分。botmux 的陈述对齐调研当天的 master 快照（commit `f77f32e`，2026-10-16），证据是该快照的源码路径；botmux 是 MIT 许可的 TypeScript 开源项目，不需要还原。
> 置信标记：每条机制主张标 `confirmed`（读过对应代码）或 `未证实推测`（写明缺什么证据）。本文没有运行任何一方的 daemon，所有结论来自静态阅读。

---

## 0 结论

**duoduo 和 botmux 驱动 Claude Code / Codex 的路线相反：duoduo 把引擎当作可编程接口来调用（Claude 走 Agent SDK，Codex 走 `codex app-server` 的 JSON-RPC），turn 边界、系统提示、工具集、权限和记忆都由 runtime 决定；botmux 把引擎当作完整的交互式终端程序来托管（在 tmux 里运行真正的 `claude` 与 `codex` 命令），靠向终端输入、识别屏幕和读取 CLI 自己写的转写文件来交互，CLI 的原生配置与能力全部保留。** 两者服务于不同的目标：duoduo 要让模型在无人值守时长期自主运行，botmux 要让人在飞书里遥控自己本机已经在用的编程 CLI，并能随时接管终端。

由这个差异推出三个判断，第 1 至第 3 节分别展开：

1. **集成方式**（第 1 节）：duoduo 的输入、turn 结束和回复都有接口层面的明确信号；botmux 的 Claude 路径靠逐字输入加转写文件核对来确认提交，靠屏幕正则、hooks 和程序状态序列来判断忙闲，Codex 路径默认同样走终端，另有两种基于 app-server 的方式可选。
2. **duoduo 路线的长处与代价**（第 2 节）：长处是确定性，即单 turn 准入、逐轮不变的系统提示、工具白名单和统一的记忆；代价是 SDK 与 app-server 没有暴露的 CLI 能力拿不到，用户本机 CLI 的配置不会延续，每加一个引擎都要写一整套适配器。
3. **botmux 路线的长处与代价**（第 3 节）：长处是保真度、覆盖面（20 多个 CLI 适配器）和人工接管；代价是把屏幕界面当作接口带来的脆弱性和工程量，以及对系统提示与 turn 的控制更粗。

第 4 节给出对 duoduo 的借鉴：botmux 的“app-server 负责输入、真实 TUI 负责观察和接管”的组合值得参考；反过来，duoduo 的后台分区、job 与插话机制依赖接口给出的 turn 信号，不应改用终端驱动。

### 速览

| 维度 | duoduo | botmux |
|---|---|---|
| 定位 | 无人值守的自治 agent runtime | 飞书与本机编程 CLI 之间的桥接器 |
| Claude Code | daemon 进程内调用 Agent SDK 的 `query()` | tmux 里运行交互式 `claude` 命令 |
| Codex | 常驻 `codex app-server` 子进程，stdin/stdout 上的 JSON-RPC | 默认 tmux 里运行交互式 `codex`；可选 app-server 输入加 `--remote` TUI 的混合模式，或不带 TUI 的 `codex-app` |
| 支持的引擎 | 四个（claude、codex、grok、pi），不可用时拒绝，不回退 | 20 多个适配器，用 `bots.json` 的 `cliId` 选择 |
| 系统提示 | runtime 拼接六层，逐轮不变 | 在 CLI 原生系统提示后追加一段说明，可设为零注入 |
| CLI 原生记忆 | 关闭（Claude） | 保留 |
| 权限 | Claude 默认 `bypassPermissions`，Codex `approvalPolicy: "never"` 加沙箱级别 | 绕过 CLI 审批，安全靠外层文件沙箱 |
| 人工接管 | 无终端；经控制面 RPC 与渠道交互 | `tmux attach`、Web 终端、`/adopt` |

## 1 集成方式的差异

两者的根本差异在于和引擎之间的边界放在哪里：duoduo 的边界是函数调用与 RPC，每一步都有明确的返回；botmux 的边界是终端，大部分状态要从屏幕和磁盘文件里推断。下面按引擎分两节说明，最后一节对照两者在输入、结束判断与回复上的做法。

### 1.1 Claude Code

duoduo 不启动 `claude` 命令，而是在 daemon 进程内调用 Agent SDK（confirmed）。`createAgentSdkAdapter (Hf)` 把会话的运行配置转换成 SDK `query()` 的参数，提供一次性的 `run()` 和常驻的流式调用两种方式；渠道会话使用后者，由 `createClaudeStreamingSessionFactory (VTe)` 在多个 turn 之间复用同一个 query，`includePartialMessages: !0`（`createAgentSdkAdapter`）让常驻连接总是收到增量输出。常驻连接的复用条件是配置签名不变，签名由 `computeStreamingConfigSignature (oZ)` 计算，签名一变就关闭旧连接、建立新连接（`teardownStreamingSession (gp)`）。适配器构造引擎子进程的环境时删掉 `CLAUDECODE` 并设置 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`（`delete s.CLAUDECODE`（`createAgentSdkAdapter`）），所以 Claude Code 自带的 auto memory 在 duoduo 里不工作，记忆只走 duoduo 自己的记忆目录；v0.8.6 起还设置 `CLAUDE_CODE_FORK_SUBAGENT=0`（`s.CLAUDE_CODE_FORK_SUBAGENT = "0"`（`createAgentSdkAdapter`）），按上游 CHANGELOG 是为了关掉 SDK 默认提供的 fork 子代理。SDK 内部怎样运行 Claude Code 二进制不在 duoduo 的 bundle 里（未证实推测，缺 SDK 源码）。

botmux 在 tmux 窗格里启动交互式 `claude` 命令（confirmed，`src/adapters/cli/claude-code.ts` 的 `buildArgs`）。启动参数包括：新会话用 `--session-id`，续接用 `--resume`；默认加 `--dangerously-skip-permissions`，并在内联 settings 里写 `permissions.defaultMode: 'bypassPermissions'`；用 `--disallowed-tools` 禁用 `EnterPlanMode` 与 `ExitPlanMode`；用 `--plugin-dir` 挂载只对本会话生效的 botmux skill 插件；用 `--append-system-prompt` 追加 botmux 的说明文字。会话后端默认是 tmux 这类持久后端，裸 PTY 只在显式配置时使用（confirmed，`src/adapters/backend/session-backend-selector.ts` 的注释“PTY 退役”）。Claude Code 自己的 memory、hooks、MCP、项目 `CLAUDE.md` 与 `/` 命令都保留。

### 1.2 Codex

duoduo 对 Codex 只用一种方式：一个常驻的 `codex app-server` 子进程，以 detached 方式启动，在 stdin/stdout 上走 JSON-RPC（confirmed，`this.proc = yft(this.binary, ["app-server"]`（`initCodexAppServerModule`），适配器为 `createCodexAppServerAdapter (tS)`）。可用性探测运行 `codex --version` 与 `codex login status`，后者输出须含 `"logged in"`（`checkCodexAvailability`）。duoduo 的自操作工具以 `dynamicTools` 挂在 `ALADUO_TOOL_NAMESPACE (sO)` 命名空间下，`buildCodexDirectOnlyToolConfig (s6)` 让它们保持为模型可直接调用的工具；审批策略固定为 `"never"`，沙箱级别由 `resolveCodexSandbox (Fg)` 从 `ALADUO_CODEX_SANDBOX` 读出。`/model` 切换不立即生效，而是由 `resolvePendingModelFork (ubt)` 记下当前线程，下一次 drain 用 `thread/fork` 从它派生新线程（confirmed）。

botmux 对 Codex 有三种方式（confirmed）：

1. **默认：tmux 里的交互式 `codex`。** `src/adapters/cli/codex.ts` 用 `--dangerously-bypass-approvals-and-sandbox` 启动 TUI，用 `-c projects={"<cwd>"={trust_level="trusted"}}` 预先写入目录信任，跳过 Codex 启动时的信任对话框（源码注释说明该对话框的措辞在上游改过一次，靠匹配文字来点选并不可靠）；输入以括号粘贴（bracketed paste）的方式写入终端，输出从 Codex 写在磁盘上的 rollout 文件读取（`drainCodexRollout`）。
2. **实验开关：app-server 输入加 `--remote` TUI。** `src/codex-rpc-engine.ts` 为每个会话启动一个 `codex app-server --listen ws://127.0.0.1:<port>`，用户输入经 `turn/start` RPC 发出；tmux 窗格里运行 `codex --remote ws://… resume <threadId>`，依靠 app-server 把一个线程的事件广播给所有打开它的连接，让 TUI 实时显示由 RPC 发起的 turn。源码注释给出的动机是 Codex 在启动和设置变化时重新初始化终端，会丢掉粘贴进来的文本。这个模式默认关闭，由全局开关 `dashboard.codexRpcInput` 或单个 bot 的 `codexRpcInput: true` 打开（`src/config.ts` 的 `codexRpcInputDefault`）。
3. **`cliId: "codex-app"`：不带 TUI 的 runner。** `src/adapters/cli/codex-app.ts` 启动 botmux 自己的 `codex-app-runner`，由它运行 app-server 并发出 turn，形态上与 duoduo 的做法最接近。

### 1.3 输入、turn 结束与回复

| 环节 | duoduo | botmux |
|---|---|---|
| 输入怎样送达 | Claude：放进常驻 query 的输入队列，由一个 async generator 每次只放行一个 turn；Codex：JSON-RPC 请求 | Claude：`tmux send-keys -l` 逐字输入，每个换行写成 `\` 加 Enter，最后一个 Enter 提交；Codex 默认括号粘贴，实验模式下走 `turn/start` |
| 怎样确认输入被接纳 | SDK 发出 `system/init` 时把 turn 标记为已接纳；另一个 turn 进行中时新 turn 以 `AgentSdkPromptNotAcceptedAbortError (Or)` 被拒 | 读 Claude 的转写 JSONL，确认出现了新的用户消息行，没出现就重按 Enter；Claude 在 resume 时轮换会话 id，botmux 读 `~/.claude/sessions/<pid>.json` 跟踪当前 id |
| 怎样判断 turn 结束 | SDK 的结果消息、app-server 的 turn 完成通知 | 屏幕正则（Claude 的输入提示符 `❯`、忙碌页脚 `esc to interrupt`）、OSC 7501 程序状态序列、Claude hooks（SessionStart、UserPromptSubmit、statusline），再加上转写文件（`src/utils/idle-detector.ts`） |
| turn 进行中来了新消息 | Claude：暂存为 `pendingSteer`，下一次工具调用完成后由 PostToolUse hook 插入当前 turn，没有机会就留到下一个 turn | 进入 botmux 的输入队列，等 CLI 空闲后再输入 |
| 回复怎样回到渠道 | runtime 收集模型输出，经出站队列发给渠道 | 两种模式：模型自己执行 `botmux send` 发送卡片（`replyDelivery: 'send'`），或 botmux 从转写文件取出最终回答自动转发（`'transcript'`） |
| resume 失败 | `runDrainTurnWithResumeFallback (_bt)` 去掉 resume 重试一次，并在结果上标记 | 由各适配器自己处理会话 id 与转写文件的对应关系 |

以上 duoduo 一列 confirmed（证据见 INTERNALS 7.3、7.4）；botmux 一列 confirmed，证据为表中所列源码路径与 `src/adapters/cli/types.ts` 中 `PtyHandle` 的字段说明。

## 2 duoduo 路线的长处与代价

duoduo 路线的长处是 runtime 对执行过程有完整的控制，这正是无人值守运行所需要的。turn 的准入、插话和抢占都是 runtime 里的确定性逻辑，不依赖识别屏幕；没有人盯着终端时，卡住或误判都无法由人发现，所以这一点在后台分区和定时 job 上是必要条件。系统提示由 `renderPromptLayers (G_e)` 按固定顺序拼接六层，每轮变化的信息由 `buildTransientUserBlocks (FEe)` 放进用户消息前的瞬时块，因此同一会话的连续 turn 发送完全相同的系统提示，引擎的 prompt cache 可以稳定命中；常驻连接因配置变化而重建时，`diffStreamingConfigSignature (FN)` 会把差异写进审计日志（confirmed）。工具集也由 runtime 决定：Claude 的内置工具是 `CLAUDE_CORE_TOOLS (Sg)` 列出的 15 个，渠道与 job 配置只能追加；四个引擎读同一段系统提示，拿到同一组自操作工具（confirmed，INTERNALS 2.4、3.7）。

duoduo 路线的代价是只能使用 SDK 和 app-server 暴露出来的能力。Claude 的 `/compact` 只在渠道会话里交给 SDK 处理；Codex 的内置工具无法关闭，duoduo 收到的 `disallowedTools` 只记一条 debug 级日志；同名命令 `/model`、`/effort` 在四个引擎上生效时机不同，需要 runtime 维护 `pending_model_fork` 这类状态（confirmed，INTERNALS 3.6、3.7）。duoduo 主动关闭了 Claude Code 的 auto memory 和交互式审批，用户在本机 CLI 里积累的记忆和习惯不会进入 duoduo。每加一个引擎都要写进程模型、可用性探测、命令实现和权限映射一整套代码，所以 duoduo 只支持四个引擎；对 Codex 也只有 app-server 一种形态，没有可供人观察或接管的终端。

## 3 botmux 路线的长处与代价

botmux 路线的长处是保真度、覆盖面和人工接管。用户本机 CLI 的配置、hooks、MCP、skills、plan mode 与 `/` 命令都直接生效，CLI 升级时多数情况下直接受益，只有参数、输出格式或 resume 语义变化时适配器才需要跟进（confirmed，README“设计理念”一节）。因为桥接的是终端程序而不是某个 SDK，接入一个新 CLI 的成本较低，`src/adapters/cli/registry.ts` 注册了 20 多个适配器，同一个群里可以放多个背后是不同 CLI 的 bot 互相评审。人可以随时 `tmux attach` 进入真实进程，或在浏览器与手机上打开可写的 Web 终端，也可以用 `/adopt` 接管本地 tmux 里已经在运行的会话（confirmed）。

botmux 路线的第一个代价是把屏幕界面当作接口带来的脆弱性，源码里能直接看到这部分工作量（confirmed）。Claude 适配器不信任粘贴，改为逐字输入后再读转写文件确认提交，源码注释说明 Claude Code 会在执行斜杠命令等操作后关闭括号粘贴模式；Codex 的信任对话框改过措辞，botmux 改为预先写入信任来跳过它；Codex 重新初始化终端时丢失粘贴，botmux 为此增加了 app-server 输入的实验模式；Claude 在 resume 时轮换会话 id，botmux 要读进程状态文件来跟踪。负责管理 CLI 进程的 `src/worker.ts` 有两万五千多行，主要是这类边界情况的处理。

第二个代价是对系统提示和 turn 的控制更粗。botmux 只能在 CLI 原生系统提示之后追加一段文字，追加内容逐轮是否保持不变、能否让 prompt cache 稳定命中，取决于各 CLI 自己的实现（未证实推测，未测量 botmux 会话的缓存命中）。turn 的开始与结束靠屏幕正则、hooks 与状态序列推断，而不是来自接口的确定信号。权限方面默认绕过 CLI 的全部审批，安全依赖 bubblewrap 或 sandbox-exec 文件沙箱（README“支持的 CLI / Agent”一节与 `src/adapters/backend/sandbox.ts`）。运维上，botmux 每个 bot 一个 daemon，会话存储依赖 SQLite，它自己的 `CLAUDE.md` 记录过一次因 PATH 解析到旧版 Node 导致 55 个 bot daemon 启动即崩、而 supervisor 仍报告重启成功的事故（confirmed，读其 `CLAUDE.md`）。

## 4 对 duoduo 的借鉴

botmux 的 Codex 实验模式值得 duoduo 参考：输入和控制走 app-server 的 RPC，同时让一个真实的 TUI 以 `--remote` 方式连到同一个线程，用来观察和人工接管。这个组合保留了 RPC 给出的确定信号，又增加了人能看到、能插手的终端。duoduo 已经运行常驻的 `codex app-server`，在它旁边加一个只读或可接管的 TUI，改动范围比 botmux 小；但 duoduo 的 app-server 走 stdio 而不是 WebSocket，要让第二个客户端连上，需要改为监听端口（未证实推测，没有在 duoduo 上试过）。

botmux 的两条记账原则与 duoduo 的设计思路一致，可以对照检查 duoduo 的实现：token 用量只采用 CLI 原生报告的数字，不从消息文本估算；上下文占用只取 CLI 报告的最新一次测量，缺数据时不显示，而不是按模型名推算（botmux `CONTEXT.md` 的 Token Usage 与 Context Usage 定义）。

反过来，duoduo 不应把 Claude 改为终端驱动。duoduo 的后台分区、定时 job 与插话机制都依赖 SDK 给出的 turn 已接纳、turn 已结束这两个信号（INTERNALS 7.4），换成屏幕识别会失去可靠性，而这些场景恰好没有人能发现和纠正误判。如果需要“在本机终端里继续一个 duoduo 会话”这类能力，较稳妥的做法是像 botmux 的 Codex 实验模式那样，让终端只做观察和接管，输入与 turn 控制仍走接口。
