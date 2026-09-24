# duoduo 部署与运维架构分析

> 对齐版本：`@openduo/duoduo` **v0.8.3**（npm 运行时）与 `openduo/duoduo` GitHub 仓库。
> 证据来源：上游仓库的 README 与运维技能（`skills/`）；v0.8.3 包内文件（`bin/duoduo`、`bootstrap/`）；还原源码（[`../reconstruction/`](../reconstruction/)）；本机部署实测。§1–§6 与 §8 描述 v0.8.3 的行为，以代码为准；§7 汇总实测记录，每条注明测量时的版本（v0.6.1 或 v0.7.1），这些记录没有在 v0.8.3 上重测。
> 引用写法与 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md) 相同：`真名 (短名)` 或 `代码片段`（`真名`），不写行号；cli bundle 里的符号写作 `cli:真名`。cli bundle 里还没有真名的函数，只引用它打印的字符串，不给代码引用。机制主张标 `confirmed`（对照 v0.8.3 代码或包内文件确认过）或 `未证实推测`。
>
> **姊妹篇**：本文是部署与运维层面的分析。入门与设计思路见 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)（下称 GUIDE）；逐机制的代码证据见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)（下称 INTERNALS）；还原方法与可运行产物见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md) 与 [`../reconstruction/`](../reconstruction/)。

---

## 结论

duoduo 是一个让大语言模型无人值守持续运行的程序；模型自身做不到的事（保存状态、调度、并发、边界检查）由运行时代码完成，需要判断的事交给模型。本文讲它的部署与运维：运行时以 npm 包里的压缩 JavaScript 分发，部署就是全局安装 `@openduo/duoduo` 并启动一个常驻 daemon；之后的运维工作集中在五件事上：弄清每个环境变量和配置文件由谁、在什么时候读取；知道两个数据目录里各存什么；通过控制面的三个入口访问 daemon；用带理由的重启与升级命令变更运行中的系统；照看没有自动重启的渠道适配器进程。

下文按部署的先后顺序展开。§1 说明分发形态。§2 说明安装、认证来源、引擎选择和环境变量的存放位置。§3 说明内核目录 `~/aladuo` 与运行时目录 `~/.aladuo` 的内容、三种锁和配置分层。§4 说明控制面的只读 TCP 端口、全权 unix socket 与可选的远程监听。§5 说明日常运维命令，重点是重启、升级、分区提示词刷新与 job 处置。§6 说明渠道适配器的安装与生命周期。§7 汇总本机部署的实测记录。§8 列出运维风险。机制本身的解释在 GUIDE，逐条代码证据在 INTERNALS，本文只保留运维需要的结论和关键引用。

---

## 1 分发形态

duoduo 的运行时只以 npm 包 `@openduo/duoduo` 里的压缩 JavaScript 分发，GitHub 仓库 `openduo/duoduo` 不含运行时源码，所以部署就是 `npm install -g @openduo/duoduo` 后启动 daemon，不需要克隆源码再构建。仓库里有 `README.md`、`CHANGELOG.md`、`skills/`（运维技能）、`subconscious/`（后台分区提示词的参考版本）、`contrib/`（社区扩展）、`assets/`（截图）和 `.github/`（issue 模板）。README 给出的不发布源码的理由是这套代码不是写给人读的：agent 能直接阅读和修改压缩后的代码，压缩只是为了节省带宽、让上下文窗口保持精简；README 原文还有一句 "we are called openduo and we don't publish source either"。许可标注为 `Private. All rights reserved.`。

npm 包的 `dist/release/` 下有六个 JavaScript bundle，其中被引用的是三个：`bin/duoduo` 启动 `cli.js`，CLI 用 `daemon.js` 拉起 daemon，daemon 为 pi 引擎的会话派生 `pi-worker.js`。同目录的 `stdio.js`、`channel-acp.js`、`feishu-gateway.js` 不被 cli 与 daemon 两个 bundle 引用：在两个 bundle 里检索 `.js` 文件名，只找到 `daemon.js`（cli）与 `pi-worker.js`（daemon）（confirmed）。渠道适配器的实际安装方式见 §6。

本仓库把压缩后的运行时还原成了可读、并经证明与出厂版语义相同的源码，本文的代码引用都指向它。恢复了多少真名、比较了多少 AST 节点等计数以 [`../reconstruction/maps/pipeline_report.json`](../reconstruction/maps/pipeline_report.json) 为准，本文不抄录。

---

## 2 安装与首次配置

安装本身只有一条 npm 命令；安装后要决定三件事：Claude 引擎的认证来源、会话默认使用哪个引擎、每个设置放在哪里才能在重启后仍然生效。放错位置的设置不会报错，只是不生效，或者在下一次重启后丢失，所以 2.4 的存放位置表是本节的重点。

### 2.1 安装与 onboard

`npm install -g @openduo/duoduo` 会一并安装 Claude Agent SDK 和它的平台原生二进制（作为 npm 可选依赖，包内 `claude-runtime.md` 原文）。用 `--omit=optional` 安装会缺这个二进制，这时可以设置 `CLAUDE_CODE_EXECUTABLE` 指向本机的 `claude` 可执行文件（`CLAUDE_CODE_EXECUTABLE_ENV_KEY (G6)`，confirmed）。安装后运行 `duoduo onboard` 做首次配置，它只写配置，不启动 daemon，也不进入对话（`Run onboarding wizard and exit (no chat, no daemon)`（`cli:printHelp`））。

没有交互终端时，onboard 从环境变量读取答案，规则如下（confirmed；onboard 的函数在 cli bundle 里尚无真名）：

- 必须设置 `ALADUO_CLAUDE_AUTH_SOURCE`。没有 TTY 又没设它时，onboard 在 stderr 打印完整的变量说明，以退出码 2 结束。
- `anthropic_api_key` 还需要 `ANTHROPIC_API_KEY`。`compatible_endpoint` 还需要 `ANTHROPIC_BASE_URL`，`ANTHROPIC_AUTH_TOKEN` 可以不设，onboard 只在 `ANTHROPIC_BASE_URL` 为空时报错。`claude_code_local` 要求本机已执行 `claude login`，onboard 用 `claude auth status` 检查。
- `DUODUO_ONBOARD_YES=1` 跳过所有确认提示；`ALADUO_WORK_DIR`、`ALADUO_KERNEL_DIR` 可选。
- `ALADUO_RUNTIME_MODE` 不需要设置：daemon bundle 里没有这个字面量，CLI 只在它等于 `container` 时提示 container 模式不受支持、按 host 模式继续。

交互式 onboard 在两处警告后台会消耗 token：检测到本机 Claude Code 登录时打印 "!! IMPORTANT !!"，说明后台分区在没人聊天时也定期运行、消耗 Claude 账户的 API token；选择 `claude_code_local` 后的配置摘要里再打印一次 "!! NOTE: duoduo's background process (Subconscious)"（cli bundle 字符串，confirmed）。后台实际是否调用模型由活动指纹决定，见 §8。

### 2.2 认证来源

onboard 提供的三种认证来源都只作用于 Claude 引擎，`isClaudeAuthSource (Xct)` 只接受这三个值（confirmed）：`claude_code_local`（使用本机 `claude login` 的登录，§7 的部署采用这种）、`anthropic_api_key`（使用 `ANTHROPIC_API_KEY`）、`compatible_endpoint`（使用 `ANTHROPIC_BASE_URL` 与可选的 `ANTHROPIC_AUTH_TOKEN`）。认证来源本身写进 `~/.config/duoduo/config.json` 的 `authSource`，后两种的凭据写进 `~/.config/duoduo/.env`。

写入 `.env` 的内容比用户填的多：给了模型名时，`ANTHROPIC_DEFAULT_OPUS_MODEL`、`ANTHROPIC_DEFAULT_SONNET_MODEL`、`ANTHROPIC_DEFAULT_HAIKU_MODEL` 三个都设为同一个模型；只要写了任何一项，就同时写入 `API_TIMEOUT_MS=3000000` 与 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true`（confirmed）。cli bundle 里生成这些行的代码尚无真名，daemon bundle 里的同一段代码由 `writeHostModelEnvConfig ($we)` 调用。

`compatible_endpoint` 需要的是 **Anthropic 兼容**端点：这组 `ANTHROPIC_*` 变量作为 Claude Code 的环境变量生效，Claude Code 按 Anthropic Messages 协议请求 `ANTHROPIC_BASE_URL`（confirmed 的部分是 duoduo 只设置 `ANTHROPIC_*` 变量、不做协议转换；未实测 OpenAI 协议端点）。包内 `claude-runtime.md` 把它写成 "OpenAI-compatible endpoint (sglang, vLLM, etc)"，与代码行为不符。

认证来源为 `claude_code_local` 时，daemon 在读入 `.env` 之后立即清除宿主模型变量，即 `HOST_MODEL_ENV_KEYS (K6)` 列出的 `ANTHROPIC_API_KEY`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_BASE_URL`、三个 `ANTHROPIC_DEFAULT_*_MODEL`、`API_TIMEOUT_MS` 与 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`（`"claude_code_local" && u(process.env)`（`main`），confirmed）。所以这种模式下，写在 `.env` 或 shell 里的这些值都不生效。

### 2.3 引擎选择

会话用哪个引擎由配置字段 `runtime` 决定，取值只有四个：`L0 = ["claude", "codex", "grok", "pi"]`（`initChannelProtocolModule`）。会话、渠道配置或 job 都没有指定时取 `ALADUO_DEFAULT_RUNTIME`，再没有就是 `claude`（`resolveDefaultRuntime (Co)`）；CLI 启动或重启 daemon 前，会用 `config.json` 的 `defaultRuntime` 补上未设置的 `ALADUO_DEFAULT_RUNTIME`（confirmed，见 2.4）。机制说明见 GUIDE 1.2 与 1.4（引擎、模型、推理力度的选择与会话绑定），代码证据见 INTERNALS 3.1 与 3.3。

运维上要知道，引擎之间不互相替代，拒绝后怎样恢复取决于原因（confirmed）：

- **引擎不可用**：这次 drain 被拒绝（`stage: "runtime_unavailable"`（`drainSessionMailbox`）），不改用其他引擎，下一条消息重新探测。Codex 与 Grok 装好 CLI 并登录后，下一条消息即可运行；Claude 的可用性只在 daemon 启动时探测一次，修复后要重启 daemon。daemon 启动日志列出四个引擎的可用性（`available runtimes at boot`（`main`）），pi 恒报可用，因为它随包分发、不需要外部 CLI（`e.push("pi")`（`listSelectableJobRuntimes`））；但会话没有配置 pi 的模型 id 时，仍以 `runtime_unavailable` 拒绝（`pi binds its model when the worker is built`（`createSessionManager`））。
- **会话历史属于另一个引擎**：drain 也被拒绝（`stage: "runtime_mismatch"`（`drainSessionMailbox`））。拒绝说明给出两个选项：把引擎改回会话绑定的那个，或在新引擎上开新会话；渠道会话开新会话的做法是发送 `/clear` 后重发消息，job 由 owner 决定（`Keep this session: set the runtime back to`（`renderRuntimeMismatchGuidance`））。

包内 `claude-runtime.md` 有两处与代码不符：它写着 Codex 不可用时仍回退到 Claude，并且只把 `claude`、`codex`、`grok` 列为 `ALADUO_DEFAULT_RUNTIME` 的取值（confirmed，对照上面的代码）。这份文件随出厂文件复制进内核（§3.1），按它的说法排查引擎问题会得出错误结论。

### 2.4 环境变量与配置文件放在哪里

持久化的设置分放在三处，读取者各不相同：`~/.config/duoduo/.env` 由 daemon 和 CLI 读取，`~/.config/duoduo/config.json` 只由 CLI 读取，`DUODUO_NODE_BIN` 只由 `bin/duoduo` 这个 bash wrapper 读取（confirmed）。

| 位置 | 放什么 | 谁在什么时候读取 |
|------|--------|------------------|
| `~/.config/duoduo/.env` | `ALADUO_*`、`ANTHROPIC_*`、`CLAUDE_CODE_EXECUTABLE`、渠道凭据（如 `FEISHU_APP_ID`） | daemon 启动时由 `loadHostDotEnv (Yct)` 读入 `process.env`，只补未设置或为空的键（`(e[o] === void 0 || e[o] === "")`（`loadHostDotEnv`）），`main (Fyt)` 在启动最早期调用它。CLI 在执行 `daemon restart`、`upgrade`、`channel <kind> start` 与 `doctor`、`memory`、`spine` 之前也按同一规则读一遍（`daemon start` 之前不读），渠道凭据经这条路径进入渠道进程（只传插件清单列出的键，见 §6） |
| `~/.config/duoduo/config.json` | onboard 写入的 `mode`、`workDir`、`authSource`；可手工加入 `defaultRuntime` | CLI 每次启动或重启 daemon 前读取：用 `authSource` 覆盖进程环境里的认证来源，`workDir`、`defaultRuntime` 只在 `ALADUO_WORK_DIR`、`ALADUO_DEFAULT_RUNTIME` 未设置时补上。daemon bundle 不读这个文件 |
| 启动 `duoduo` 的 shell 启动文件，或进程管理器的环境 | `DUODUO_NODE_BIN` | 只有 `bin/duoduo` wrapper 读取：`NODE_BIN="${DUODUO_NODE_BIN:-node}"` |

另有一个可选文件 `~/.config/aladuo/config.json`，CLI 从中读取 `daemonUrl`、`pluginRoot`、`logLevel` 与各渠道的 `daemonUrl`；它与上表的 `~/.config/duoduo/config.json` 是两个不同的文件（confirmed）。config.json 的读取与覆盖规则在 cli bundle 里尚无真名的函数中，是静态阅读的结论。

`DUODUO_NODE_BIN` 不能放 `.env`，因为读取它的只有 `bin/duoduo` 这个 bash wrapper：包内 `dist/release/` 下的六个 JS 文件都不含这个字面量，wrapper 在任何 JavaScript 运行之前执行，也不读 `.env`；CLI 拉起 daemon 与渠道进程时用的是 `process.execPath`，不经过 wrapper。所以"PATH 被重置后 `duoduo` 找不到 node"的解决办法是把 `DUODUO_NODE_BIN` export 在启动 `duoduo` 的 shell 启动文件或进程管理器的环境里；写进 `.env` 只会让它随 daemon 的 `process.env` 传给 daemon 派生的会话，对 wrapper 没有作用（confirmed）。

daemon 最终看到哪些变量，还取决于平台（confirmed，cli bundle；环境白名单的构造函数尚无真名）。macOS 上 daemon 由 launchd 托管，CLI 每次经 launchd 启动 daemon（`daemon start`，或服务未加载时的 `daemon restart`）都重写 plist，把一份环境变量白名单写进去：`ALADUO_*`（`ALADUO_DISABLE_DAEMON_AUTO_MAIN` 除外）、`ANTHROPIC_*`、`CLAUDE_CODE_EXECUTABLE`、`PATH`、`HOME`、`LANG`、`LC_ALL`，由 `installAndLoad (rk)` 写入 plist 并加载服务。shell 里 export 的其他变量到不了 daemon，所以在 macOS 上 `.env` 是白名单之外的键进入 daemon 的唯一途径；反过来，plist 里已有的键优先于 `.env`，因为 `.env` 只补未设置的键。服务已加载时，`duoduo daemon restart` 只执行 `launchctl kickstart -k`，不重写 plist，所以改过的 shell 变量要 `duoduo daemon stop` 再 `start` 才进入 daemon，改过的 `.env` 重启即可生效。Linux 等其他平台上，CLI 直接派生 daemon 子进程，传入除 `ALADUO_DISABLE_DAEMON_AUTO_MAIN` 外的全部环境变量；`daemon restart` 在派生之前已经读过 `.env` 与 config.json。

---

## 3 目录与文件

运行时把状态分放在两个目录：`~/aladuo`（内核，kernel_dir）放提示词、配置和记忆，是一个 git 仓库；`~/.aladuo`（运行时目录，runtime_dir）放事件日志、会话、job、锁与 socket。带点的是运行时数据，不带点的是内核。两者都可以用环境变量改位置（`ALADUO_KERNEL_DIR`、`ALADUO_RUNTIME_DIR`，由 `resolveRuntimePaths (Yut)` 解析，confirmed），所以实际路径应该用 `duoduo daemon config` 查询，不要假设。

### 3.1 内核目录 `~/aladuo`

内核的出厂文件来自包内 `bootstrap/`，只在缺失时复制：内核目录为空时整份复制，内核已有内容时只补缺失的文件，已有文件不覆盖（`initializeRuntime (Rdt)` 在每次启动时执行复制，confirmed；代码证据见 INTERNALS 11.5）。所以升级 npm 包不会更新内核里已有的分区提示词、记忆板和配置，要用新版分区提示词须按 §5.3 显式刷新。

| 路径 | 内容 |
|------|------|
| `CLAUDE.md` | 内核引导 |
| `claude-runtime.md`、`codex-runtime.md`、`grok-runtime.md`、`pi-runtime.md` | 四个引擎的说明 |
| `config/runtime.md` | 全局配置层，只读取模型选择类键（§3.4） |
| `config/<kind>.md` | 按渠道种类的配置层；出厂有 `acp`、`feishu`、`stdio`、`job` 四份 |
| `memory/` | 记忆板 `memory/CLAUDE.md`（上游 broadcast board）与 `entities/`、`topics/`、`fragments/` 等子目录 |
| `subconscious/` | 后台分区提示词（每个分区一个目录）、`playlist.md`（轮转表）与分区总纲 `subconscious/CLAUDE.md` |

内核目录不是 git 仓库时，daemon 启动时的初始化执行 `git init`、写入 `.gitignore`、`git add .`，并以 "memory: genesis" 为说明提交第一个 commit；已经是仓库时，只把 `.gitignore` 模板里缺少的行追加进去（`await Uwe(e.kernelDir)`（`initializeRuntime`），confirmed）。`.gitignore` 排除 `memory/fragments/`、`memory/state/`、`memory/effectiveness/`、`subconscious/inbox/`、`.claude/`、`*.tmp`、`CLAUDE.local.md` 与 `config/runtime.md`；模板注释说明，`config/runtime.md` 被排除是因为模型配置可能含有凭据形态的值。这些文件不在 git 历史里，不能靠 `git revert` 恢复。

初始化之后的提交由 `memory-committer` 分区在心跳里完成：它只暂存白名单内的路径（记忆板、`memory/entities/`、`memory/topics/`、除根目录 `subconscious/CLAUDE.md` 外的分区 `CLAUDE.md`、`playlist.md`、`config/**/*.md`），每次运行提交一次，不改任何文件内容（分区提示词原文 `subconscious/memory-committer/CLAUDE.md`）。按 `duoduo-runtime-admin` 技能刷新分区提示词时，流程最后提交的那一次 commit 就是回退点，出问题时 `git revert` 这次提交（§5.3）。

daemon 启动时还会退休上游不再发布的出厂分区。退休名单是 `memory-weaver` 与 `cadence-executor`；`retirePartitionOnce (fdt)` 只处理仍按出厂方式声明自己、且处于启用状态的同名目录，把 frontmatter 的 `schedule.enabled` 改为 `false`，并在 `var/meta/partitions/` 写下 `.retired` 标记，目录和内容都保留；手工改回 `enabled: true` 后，运行时不会再次关闭它（`the retirement runs once`（`retirePartitionOnce`），confirmed）。

### 3.2 运行时目录 `~/.aladuo`

运行时目录分三部分：`var/` 是全部事件溯源数据，`run/` 是锁、socket 与进程输出，`plugins/channels/` 是渠道插件的安装目录。各路径都由 `resolveRuntimePaths (Yut)` 派生（confirmed），渠道插件目录由 CLI 决定（§6）。

```
~/.aladuo/
├── var/
│   ├── events/                    # 事件日志（上游 Spine，WAL），按天分片 YYYY-MM-DD.jsonl
│   │   └── index/by_id.jsonl      #   唯一的索引，没有 by_session
│   ├── sessions/<hash>/           # 每会话状态文件与 mailbox/（pending/、notes.jsonl）
│   ├── ingress/<hash>/            # 入站快照
│   ├── outbox/                    # 出站记录：按来源分目录（如 stdio/）、replay/、index/、.pending_queue.jsonl
│   ├── usage/<session>.jsonl      # 成本与 token 账本，只追加，无自动保留
│   ├── telemetry/<day>.jsonl      # 遥测
│   ├── jobs/{active,archive}/     # job 文件
│   ├── subconscious/<分区>/inbox/ # 分区收件箱，运行时向这里投递任务单
│   ├── meta/partitions/           # 分区运行状态与退休标记
│   ├── channels/<id>/             # 渠道实例数据（实例描述文件 descriptor.md）
│   ├── registry/dedup.jsonl       # 去重记录，只增不减
│   ├── cadence/                   # 启动时创建，当前代码不向其中写文件
│   └── daemon-restart-reason.json # 只在 CLI 发出重启到新 daemon 启动之间存在（§5.2）
├── run/
│   ├── locks/                     # 进程写锁 daemon-writer.json 与各会话的 drain 租约文件
│   ├── queue_offsets/
│   ├── daemon.sock                # 全权控制面，权限 0600（§4）
│   ├── daemon.stdout.log、daemon.stderr.log              # macOS 上 launchd 托管时的输出
│   ├── daemon-supervisor.log、daemon-supervisor.pid.json # 其他平台上 CLI 拉起 daemon 时的输出与 pid
│   └── upgrade.log                # 在会话内执行 duoduo upgrade 时，脱离会话的升级进程的输出
└── plugins/channels/<kind>/       # 渠道插件安装目录，含 run/pid.json 与 run/plugin.log
```

分区收件箱的路径是 `join(e, "subconscious", t, "inbox")`（`partitionInboxDirFromVar`），在运行时目录的 `var/` 下，不在内核里；内核的 `subconscious/inbox/` 只是出厂脚手架里的空目录，运行时不向它投递。`var/cadence/` 在代码里只出现在路径表和 `initializeRuntime (Rdt)` 的建目录列表中，没有其他读写（confirmed）。

事件日志每行是一条 JSON 事件，字段为 `type, source, session_key, payload, routing_hint?, id, ts`；`id` 与 `ts` 由 `createSpineEvent (rn)` 在构造事件时生成，随后由 `atomicAppendEvent (on)` 追加进当天的分片（confirmed）。落库的事件类型全集见 INTERNALS 附录 B.1。读这些文件的方法见 §5.6。

### 3.3 三种锁

`run/locks/` 里有两类锁文件，加上进程内存里的一把互斥锁，共三种机制，各管一件事（confirmed；代码证据见 INTERNALS 8.2）。README 说会话 actor 的并发由 "lease locks" 控制，在代码里对应的就是这三种机制。

- **进程写锁** `run/locks/daemon-writer.json`：`main (Fyt)` 在启动早期由 `acquireRuntimeWriterLock (p6)` 取得，保证一个数据目录只有一个 daemon 在写；取不到时启动失败，报 `Runtime lock already held by pid=`（`main`）。锁文件里的 pid 已不存在、机器重启过或心跳超时，都视为过期锁，可以被新 daemon 覆盖。
- **drain 租约文件** `run/locks/<会话键哈希>.json`：`drainSessionMailbox (KSe)` 在处理邮箱前取得，处理期间每 30 秒续期一次（`lockHeartbeatIntervalMs ?? 3e4`（`drainSessionMailbox`）），取不到就不处理这次 drain。
- **按会话键的进程内互斥** `runWithSessionMutex (Vi)`：不落文件，让同一会话的状态文件改动串行执行。

### 3.4 配置文件与生效时机

daemon 从三层 Markdown 配置读取会话的运行方式，但三层并不对每个键都生效：行为键（`prompt_mode`、`runtime`、工具列表、工作目录、`stream` 等）与提示词只在种类层与实例层之间取值，实例层优先；只有模型选择类键（`claude.model_profiles`、`claude.model_aliases`、`<runtime>.model`、`<runtime>.effort`）在全局 `runtime.md`、种类、实例三层逐键折叠（`prompt_mode: o?.prompt_mode ?? i?.prompt_mode ?? "append"`（`buildEffectiveChannelConfig`）；`source: "global"`（`buildEffectiveChannelConfig`），confirmed）。配置分层的完整规则见 INTERNALS 9.3，面向产品的说明见 GUIDE 2.6。

| 文件 | 作用 | 修改后何时生效 |
|------|------|----------------|
| `~/.config/duoduo/.env` | 见 §2.4 | daemon 重启后（daemon 是分离的后台进程，不热加载）；渠道凭据要重启对应渠道进程 |
| `~/.config/duoduo/config.json` | 见 §2.4 | 经 CLI 下一次启动或重启 daemon 时 |
| `kernel/config/runtime.md` | 全局配置层，只读取模型选择类键 | 下一次 drain 重新读取 |
| `kernel/config/<kind>.md` | 种类配置层：按渠道种类的行为键、模型选择类键与种类提示词，`<kind>` 取自触发这次运行的事件的 `source.kind` | 下一次 drain 重新读取 |
| `var/channels/<id>/descriptor.md` | 实例配置层：单个渠道实例的覆盖与实例提示词 | 下一次 drain 重新读取；只有凭据或进程环境变化才需要重启渠道 |

job 没有自己的种类层，这一点与出厂文件的说明不同（confirmed；代码证据见 INTERNALS 3.5）。drain 按锚点事件的来源种类选种类文件：按调度规则触发的运行，锚点是 60 秒扫描器写入的 `job.spawn` 事件，来源种类是 cadence（`kind: "cadence"`（`scanAndSpawnDueJobs`）），读的是包内不存在的 `config/cadence.md`；由 Notify 等投递唤醒的运行，来源是 route。`config/job.md` 只在 pi 引擎的 job 会话里被读取，而且只取 `pi.model` 与 `pi.effort`（`channel_kind: "job"`（`createSessionManager`））；对 Claude、Codex、Grok 的 job，`job.md` 的其余键和正文都不生效。job 自己的设置写在 job 文件的 frontmatter 里。

---

## 4 控制面与访问控制

daemon 对外有三个监听器，共用一套路由，只在权限上不同：本机 TCP 端口只读，unix socket 拥有全部权限，远程监听需要三项配置齐全并使用 bearer token（confirmed；代码证据见 INTERNALS 6.1）。

1. **TCP `:20233`（只读）**。端口取 `ALADUO_PORT`，默认 20233（`process.env.ALADUO_PORT ?? process.env.PORT ?? 20233`（`main`）），只监听 loopback（`host: "127.0.0.1"`（`createDaemon`））。`/rpc` 只放行六个只读方法：`system.status, usage.get, job.list, spine.tail, system.runtime.info, system.config`；其余方法返回 JSON-RPC `-32601`（`Method not available on read-only endpoint`（`createDaemon`）），HTTP 状态仍是 200，不是连接层拒绝。`/ws` 在这个端口上返回 HTTP 426（`upgrade_required`（`createDaemon`）），响应体附上 `socket_path`，告诉全权限客户端改连 unix socket。这个监听器还检查 Host 与 Origin 头，只接受 `127.0.0.1`、`localhost`、`::1`，用来防 DNS rebinding（`Host header not allowed`（`createDaemon`））。`/healthz`、`/dashboard`、`/readyz` 三个端点不受只读限制。
2. **unix socket（全部权限）**。默认路径 `<runDir>/daemon.sock`，可用 `ALADUO_DAEMON_SOCKET` 覆盖。daemon 启动时要求 socket 所在目录属于当前用户且权限为 0700，否则拒绝启动（`mode 0700`（`createDaemon`））；`listen` 之后把 socket 文件权限设为 0600（`chmod(x, 384)`（`createDaemon`））。所以访问控制就是文件系统权限：只有本机同一个操作系统用户能打开它，没有应用层口令。socket 路径超过 104 字节时 daemon 拒绝启动。CLI 与渠道适配器默认走这条路径。
3. **可选的远程监听器**。`ALADUO_DAEMON_HOST`、`ALADUO_DAEMON_TOKEN`、`ALADUO_REMOTE_PORT` 三项齐全才打开（`resolveRemoteListenerConfig (jyt)`），即使 HOST 是 loopback 地址也会打开；缺任何一项时不打开。两种缺项会让 daemon 启动失败：HOST 是非 loopback 地址却没有 TOKEN（`remote exposure requires ALADUO_DAEMON_TOKEN`（`resolveRemoteListenerConfig`）），或 HOST 非 loopback、有 TOKEN、却没有 REMOTE_PORT（`remote exposure requires an explicit ALADUO_REMOTE_PORT`（`resolveRemoteListenerConfig`））。REMOTE_PORT 必须与只读端口不同。TOKEN 用 `duoduo daemon token new [--force]` 生成：CLI 把它写进 `~/.config/duoduo/.env` 并把文件权限设为 0600；已有 TOKEN 时必须加 `--force` 才会轮换，因为轮换会让所有已连接的远程渠道适配器失效。这个监听器上的 `/rpc` 与 `/ws` 都要求 `Authorization: Bearer <token>`，比较的是两者的 SHA-256 摘要，用常数时间比较（`timingSafeEqual`（`createDaemon`））。

Dashboard 在 `http://localhost:20233/dashboard`，是包内的单文件 HTML（`bootstrap/dashboard.html`），由 daemon 直接读取并返回，没有构建步骤、额外端口或前端框架。页面分三块：Header（累计成本、token、工具调用数、健康灯），Signal Bar（每个活跃实体一个图形：● 前台会话、■ 周期任务、◆ 一次性任务、✓· 后台分区），Event Stream（实时事件日志，可展开 JSON）。它经 `POST /rpc`（JSON-RPC 2.0）与 daemon 通信，调用的正好是只读端口放行的六个方法，所以走只读 TCP 端口即可（confirmed，对照 `dashboard.html` 的调用）：

| 方法 | 用途 |
|------|------|
| `system.status` | 健康状态、会话、心跳与分区概况 |
| `usage.get` | 成本与 token 账本（dashboard 传 `{mode:"totals"}`） |
| `job.list` | 任务列表（dashboard 传 `{summary:true}`） |
| `spine.tail` | 最近的事件日志条目 |
| `system.runtime.info` | 运行时信息 |
| `system.config` | 生效的配置及其来源（环境变量或默认值） |

控制面方法的全集见 INTERNALS 附录 B.2，只读端口放行的方法见附录 B.3。探测只读端口与 socket 的实测记录见 §7.5。

---

## 5 日常运维命令

日常运维全部经 `duoduo` CLI 完成。会改变运行中系统的两个操作是重启 daemon 与升级，两者都应该带理由：理由会告诉受影响的会话，没有理由的会话只能猜测自己为什么被打断。

### 5.1 命令一览

下表来自 v0.8.3 的 `duoduo --help` 与各子命令的帮助（confirmed）。`duoduo memory` 不在顶层帮助里，但 CLI 会分派它。

| 命令 | 用途 |
|------|------|
| `duoduo onboard` | 首次配置，只写配置文件后退出（§2.1） |
| `duoduo [chat]` | 在终端里对话，这就是 stdio 渠道，CLI 自带，不需要单独安装（§6） |
| `duoduo daemon start\|stop\|restart\|status\|config\|logs`、`duoduo daemon token new [--force]` | daemon 生命周期、诊断与远程访问口令 |
| `duoduo daemon uninstall` | 只在 macOS 上提供：卸载 launchd 服务并删除 plist |
| `duoduo upgrade [version] [--wake …]`、`duoduo --version` | 升级（§5.3）；`--version` 直接读包自身的 `package.json`，不需要 daemon（`"unknown"`（`cli:readCliPackageVersion`）） |
| `duoduo session list\|alias\|notify\|wake\|compact\|model\|effort\|config\|archive` | 列出会话、起别名、发通知、预约一次唤醒、排队 `/compact`、改模型与推理力度、读写渠道可改的配置、归档（`runSessionSubcommand (y$e)`） |
| `duoduo job list\|read\|archive\|interrupt\|reschedule` | job 处置（§5.4，`runJobSubcommand (nJe)`） |
| `duoduo memory check\|reclaim\|board-lint\|entity-lint\|node-lint` | 测量记忆树并向分区收件箱投递任务单；`reclaim` 删除陈旧的孤立节点（§5.5，`runMemoryCommand (Uje)`） |
| `duoduo spine cat\|show` | 读事件日志：`cat` 输出按条件筛选的对话记录，`show` 输出一条事件的完整 JSON（`runSpineCommand (Zje)`） |
| `duoduo channel install\|list`、`duoduo channel <kind> start\|stop\|status\|logs\|doctor` | 渠道适配器的安装与生命周期（§6） |
| `duoduo prompts [name]` | 列出或打印命名提示词（`runPromptsSubcommand (iJe)`） |

### 5.2 重启 daemon

daemon 是分离的后台进程，不热加载启动时读取的设置，改了 `.env` 或全局环境后要重启；重启应该用 `duoduo daemon restart -r "<改了什么>" [--wake <会话或别名>]`，因为 `-r` 的理由会告诉跨越重启的渠道会话，`--wake` 指定的会话会收到一条"daemon 重启过、你那一轮可能被打断"的通知（confirmed；CLI 的重启函数尚无真名，下文引用它调用的已命名函数）。

参数由 `parseRestartArgs (bXe)` 解析，`--wake` 可以重复（`t.wake.push(o.trim())`（`cli:parseRestartArgs`））。这两个参数不在 `duoduo daemon --help` 的用法行里，那一行只列 `[--daemon-url <url>]`。从 daemon 派生的会话里执行重启时必须带 `-r`，否则 CLI 拒绝执行（`refusing to restart the daemon without --reason`（`cli:reasonlessRestartRefusal`））。CLI 用 `ps -Ao pid,ppid` 沿父进程链查找 daemon，以此判断自己是否在会话里；`ps` 不可用、或进程被 nohup 与 detach 包过时判断不出来，就按人工调用放行。人工在 shell 里执行不带 `-r` 的重启不受这条限制。

理由与唤醒目标经重启原因文件交给新 daemon（`"daemon-restart-reason.json"`（`daemonRestartReasonPath`））。CLI 在停止旧 daemon 之前写入它，内容是 `{reason, requested_at, requested_by_agent}`，带 `--wake` 时再加 `wake_targets`，此时即使没给 `-r` 也会写文件；新 daemon 启动时由 `claimDaemonRestartReason (zbe)` 读取并立即删除，`reason` 与 `wake_targets` 都为空时视为没有文件（confirmed）。这个文件不经过事件日志，因为它必须在新 daemon 存在之前写好；代价是它没有事件 id，也不记录应由哪个 daemon 读取，下一次启动的 daemon 会读走当时留在那里的任何这个文件。读到的内容有两个去处：`reason` 只注入渠道会话跨越重启后第一轮的 `daemon-restart-hint` 块，job、后台分区等其他会话不注入（`stage: "out-of-scope"`（`decideRestartHintInjection`））；`wake_targets` 的每个目标在 daemon 启动后收到一条跳过"无读者拒投"检查的通知（`source: "daemon-restart"`（`deliverDaemonRestartWakes`）），投递失败只记日志。代码证据见 INTERNALS 6.4。

重启的执行方式分两条路径，它们决定了重启不顺利时理由和 `--wake` 是否保留（confirmed）：

- **macOS，launchd 服务已加载**：CLI 只执行 `launchctl kickstart -k`（`kickstart (ik)`），不重写 plist，然后轮询健康检查。超时时 CLI 抛出一个专用错误并按失败退出，但不删除原因文件，新 daemon 启动完成后照常读取它。这是 `--wake` 在健康检查超时后仍能送达的唯一路径。
- **其他情况**（macOS 上服务未加载，或 Linux 等其他平台）：CLI 先停止旧进程，再重新启动；其他平台上直接派生子进程，超时就向子进程发 SIGTERM 并报一般错误。重启没有发生（旧 daemon 仍在应答）或启动失败时，CLI 在原因文件的 `requested_at` 仍是自己写入的值时删除它，理由和唤醒目标随之丢弃。

带了 `--wake` 时，CLI 按结果打印三种回执之一（`restartWakeReport (NXe)`）：重启成功时是 `wake queued for <target> — delivered by the daemon once it is up`；没有重启时警告 `--wake was dropped`，并给出用 `duoduo session notify` 手工补发的命令；launchd 路径上健康检查超时时提示 `--wake is durable — the daemon delivers it when it finishes booting`。

macOS 上的 launchd 服务是用户级的（标签 `"ai.openduo.daemon"`（`cli:PLIST_LABEL`）），plist 设了 `<key>KeepAlive</key>`（`cli:generatePlist`）并限定图形登录会话；CLI 发现自己在 SSH 会话里（`isAquaSession (tk)` 检查 `SSH_CLIENT`、`SSH_TTY`）就拒绝启动 daemon。由于服务标签对每个用户固定，在 macOS 上用改过的 `HOME` 运行 `duoduo daemon start|stop|restart` 仍会操作本机真实的 daemon。

`duoduo daemon logs [--lines N | --all]` 默认显示 `run/daemon-supervisor.log` 的最后 200 行。这个文件只在 CLI 直接派生 daemon 的平台上写入；macOS 上 launchd 把 daemon 的输出写进 `run/daemon.stdout.log` 与 `run/daemon.stderr.log`（plist 的 `<key>StandardErrorPath</key>`（`cli:generatePlist`）；路径见 `vt.join(l, "daemon.stderr.log")`（`resolveRuntimePaths`）），daemon 的日志都写在 stderr，所以在 macOS 上应直接读 `run/daemon.stderr.log`（confirmed，静态阅读，未实测；读取日志的函数在 cli bundle 里尚无真名）。

### 5.3 升级与刷新分区提示词

`duoduo upgrade [version] [--wake <会话或别名>]` 优于手工 `npm install -g` 加重启，因为它同时处理渠道包、重启理由和会话唤醒（confirmed；升级命令的函数在 cli bundle 里尚无真名）。它按以下顺序执行：

1. 在会话内执行时（判断方法同 §5.2），CLI 把升级交给一个脱离会话的子进程完成，进度写在 `<runDir>/upgrade.log`；子进程由环境变量 `ALADUO_UPGRADE_DETACHED_WORKER` 标记（`isDetachedUpgradeWorker (vXe)`）。这样做的原因是升级触发的 daemon 重启会杀掉会话里的 CLI 进程，它就来不及重新启动渠道。
2. 执行 `npm install -g @openduo/duoduo@<版本>`，然后提醒刷新技能：`npx -y skills add https://github.com/openduo/duoduo --global --all`。版本参数只接受版本号或 dist-tag（`Installing from a path, URL or git remote is not supported here.`（`cli:parseUpgradeArgs`））。
3. 渠道阶段由 `runUpgradeChannelPhase (xXe)` 执行：对每个已安装的渠道包查询最新版本，已是最新的跳过；需要升级的先安装新版本，再停掉其中原先在运行的（`stopped for upgrade`（`cli:runUpgradeChannelPhase`））。
4. 以 `upgraded @openduo/duoduo to <版本>` 为理由重启 daemon。daemon 原本没有运行时（健康检查不通过，且在 macOS 上 launchd 服务也未加载）不重启。
5. 把第 3 步停掉的渠道重新启动，原先没在运行的保持停止（`left stopped (was not running before the upgrade)`（`cli:runUpgradeChannelPhase`））。不需要升级的渠道在整个过程中不被停止或重启。
6. `--wake` 的目标由 CLI 在以上步骤完成后经 `session.notify` RPC 逐个投递（强制投递，来源 `daemon-restart`），不写入重启原因文件。

重启这一步有四种结局：成功时打印新 pid；重启已发出、但 launchd 托管的 daemon 还没通过健康检查时，提示 `On a slow-booting host this is expected — confirm with: duoduo daemon status`；停机后旧 daemon 仍在应答时，警告 `the previous process is still running the old code`，要求手工重启；其他错误打印重启失败并给出手工重启命令。手工等价步骤是 `npm i -g @openduo/duoduo@latest` 后 `duoduo daemon restart -r "<改了什么>"`，但它不会升级渠道包。

升级不会更新内核里已有的分区提示词（§3.1）。要用新版提示词，必须按 `duoduo-runtime-admin` 技能的 subconscious refresh 流程显式刷新（技能原文 `references/subconscious-refresh.md`）：该流程要求内核 git 工作区干净，先展示差异再覆盖；只覆盖上游存在的文件，保留用户自建的分区；对分区 `CLAUDE.md` 保留用户调过的 `schedule:` 与 `runtime:`、`model:`、`effort:` 键，正文与 `contract:` 段取上游版本；最后以 `subconscious: refresh to <target-tag>` 提交一次，这次提交就是出问题时 `git revert` 的回退点。刷新后不需要重启 daemon，分区在下一次心跳重新读取提示词。机制说明见 GUIDE 4.8。

不刷新的后果由契约过滤决定（confirmed；代码证据见 INTERNALS 11.4 与 12.2）。分区 `CLAUDE.md` 的 `contract:` 段声明它消费哪些记忆检查信号：有有效声明时，daemon 只投递 `consumes` 列出的种类，`ALADUO_EXP_MEMORY_CHECK` 被忽略；没有声明的分区（未刷新的旧出厂分区或用户自建分区）只在 `ALADUO_EXP_MEMORY_CHECK` 打开时收到信号；声明的分区名与目录名不符、或分区已停用时一律不投递（`enforceContractGate (iO)`；开关由 `resolveMemoryCheckFlags (W6)` 读取）。所以不刷新时，带旧契约声明的分区只收到它声明消费的信号种类，新版运行时新增的检查对它不生效；没有声明的分区在开关打开时才会收到它可能不认识的信号。`duoduo daemon status` 列出每个分区的契约状态和声明的信号种类。

### 5.4 job 处置

job 的归档、打断和改期只经 CLI 及其调用的 `job.archive`、`job.interrupt`、`job.reschedule` RPC 提供，agent 的 ManageJob 工具只能 create、list、read（confirmed；见 INTERNALS 4.2，job 调度与结算的代码证据见 INTERNALS 第 10 节）。派发入口是 `runJobSubcommand (nJe)`，参数解析是 `parseJobCli (Kge)`，帮助文本是 `jobHelp (nU)`。三个动作各有一条需要注意的规则：

- **`interrupt` 必须写理由，理由会告诉被打断的会话。** 缺 `-r`/`--reason` 时报 `error: duoduo job interrupt requires -r "<reason>"`（`cli:parseJobCli`），`-r` 用在其他动作上会被拒绝（`takes no -r/--reason`（`cli:parseJobCli`））。帮助文本写明这个字符串是被打断的会话下一次运行时被告知的内容，所以该 job 下一次运行时知道上次为什么被中断。回执由 `renderInterruptReceipt (jge)` 渲染，其中说明了打断的范围：运行时只请求停止，不理会中止信号的工具不会被杀掉。
- **`archive` 不删除任何东西**：它停止之后的调度，正在进行的运行照常结束，帮助文本最后一句是 `Nothing is deleted: an archived job's files move to var/jobs/archive/.`（`cli:jobHelp`）。
- **`reschedule` 只额外触发一次**，帮助文本写明 "The job's schedule class is never changed."。

### 5.5 心跳、后台分区与记忆检查

心跳间隔由 `ALADUO_CADENCE_INTERVAL_MS` 设置，默认 2220000 毫秒即 37 分钟（`"ALADUO_CADENCE_INTERVAL_MS", 222e4`（`main`），confirmed）；设置的值不是整数或小于 1000 时，daemon 记一条告警并使用默认值，但 `system.status` 仍报告设置的值（INTERNALS 11.1）。`duoduo daemon status` 打印最近一次心跳的时间与间隔、当前一轮轮转表的完成情况（`subconscious: <完成数>/<分区数> partitions done`），以及记忆检查的开关和每个分区的契约状态。心跳与后台分区的机制见 GUIDE 3.2、3.3，代码证据见 INTERNALS 第 11 节。

`duoduo memory` 的五个子命令只有一部分是只读的（confirmed，帮助文本；`runMemoryCommand (Uje)`）。`check` 测量记忆板、实体、节点三类问题和孤立节点，默认按每类问题向目标分区的收件箱投递最严重的一张任务单（`--limit=N` 可调），`--dry-run` 只测量不投递；三个 `*-lint` 子命令默认只读，加 `--notify` 才投递。投递受分区契约过滤约束，`--force` 绕过它。`reclaim --tag=<id>` 处理孤立节点的生命周期，对陈旧的孤立节点执行 `git rm`；帮助文本写明它是破坏性操作、只能手动运行（"DESTRUCTIVE, manual only"），`--tag` 必填，`--dry-run` 只报告不删除。记忆检查与遗忘 GC 的代码证据见 INTERNALS 12.2、12.3。

### 5.6 读事件日志

读事件日志要用事件日志的 CLI，不要直接打开分片文件：`duoduo spine cat …` 读一段按条件筛选的对话记录，`duoduo spine show <event-id>` 读一条完整事件；shell 的 `grep -l` 只用来定位哪个分片提到了某个内容。`duoduo spine help`（由 `runSpineCommand (Zje)` 打印）给出的理由是一行 tool_result 可能超过 1MB（confirmed）。后台分区总纲 `subconscious/CLAUDE.md` 的 Large File Guard 对分区会话规定了同样的做法，并写明每天的分片有 10–30MB：不对 `.jsonl` 使用 `Read` 或 `Grep` 工具，也不在 shell 里翻页读原始分片。

### 5.7 运维技能

上游仓库以 [skills.sh](https://skills.sh/) 安装器的形式发布 host 模式运维技能，供任意 agent 使用：技能用自然语言触发，不依赖某个 agent 专有的调用语法；安装命令是 `npx -y skills add https://github.com/openduo/duoduo --global --all`。`skills/` 下共六个技能：

| 技能 | 范围 |
|------|------|
| `duoduo-admin` | host 模式总入口：解释工作方式、查看配置与各路径、升级 duoduo、归档与恢复会话 |
| `duoduo-runtime-admin` | daemon 设置、诊断与日志；引擎选择（Claude、Codex、Grok、Pi，`ALADUO_DEFAULT_RUNTIME`）；`.env` 里的 `ALADUO_*` 键；刷新后台分区提示词；`duoduo memory`、`session`、`job`、`spine` 命令；usage 账本清理；第三方模型的 model profile |
| `duoduo-channel-admin` | 渠道安装与生命周期、飞书设置（setup 卡片、owner、主会话）、ACP 编辑器集成、渠道描述文件（种类与实例） |
| `duoduo-pipeline` | 用不调用模型的采集层加 `session notify` 唤醒 job，搭建事件驱动的流水线 |
| `duoduo-loop` | `/loop` 命令及其创建的周期后台任务：设置、查看、暂停、改节奏、打断 |
| `smart-compaction` | 渠道会话空闲自动压缩：开关、统计数据与阈值调整 |

---

## 6 渠道适配器的安装与运维

渠道适配器是 daemon 之外的独立进程，由 CLI 安装和启停；daemon 与 launchd 都不负责在它退出后重启它。stdio 渠道就是 CLI 自带的 `duoduo chat`；飞书与 ACP 各以独立 npm 包安装（`@openduo/channel-feishu`、`@openduo/channel-acp`），再用 `duoduo channel <kind> start` 启动。适配器的协议与飞书的实现细节见 INTERNALS 第 9 节，面向产品的说明见 GUIDE 2.6。

```bash
duoduo channel install @openduo/channel-feishu   # 或 @openduo/channel-acp
duoduo channel feishu start                       # 或 duoduo channel acp start
```

**安装。**`duoduo channel install` 接受 npm 包名，或带 `--from-path` 的本地 `.tgz` 包；看起来是本地路径的参数不带 `--from-path` 时被拒绝，因为本地包会作为 daemon 插件运行任意代码（`isInstallTargetFilePath (hXe)` 按 `.`、`/`、`~` 开头或 `.tgz` 结尾识别路径，confirmed）。其余参数一律交给 `npm pack` 解析；技能文档不建议用 GitHub 地址安装，本文未实测 git 规格能否装成。插件装在 `~/.aladuo/plugins/channels/<kind>/`（可用 `ALADUO_PLUGIN_ROOT` 或 `~/.config/aladuo/config.json` 的 `pluginRoot` 改）；安装时还把插件包自带的 `config/` 文件复制进内核的 `config/`，只补缺失、不覆盖（INTERNALS 9.3）。README 列出的官方包是 `@openduo/duoduo`（核心运行时与 CLI）、`@openduo/channel-feishu`（飞书与 Lark 适配器）和 `@openduo/protocol`（零依赖的共享 RPC 类型）；`@openduo/channel-acp` 由 `duoduo-channel-admin` 技能的 `references/acp.md` 说明，用于 Zed、Cursor 等支持 ACP 的编辑器。

**生命周期。**`install` 只写磁盘：它把新包写入并原子替换，不停止、不重启正在运行的插件进程，运行中的进程继续使用旧代码，直到执行 `duoduo channel <kind> stop` 再 `start`（技能原文 `references/channel-lifecycle.md`）。CLI 没有 `restart` 子命令；`doctor` 要求插件先停止（`Cannot run doctor while … is running`，cli bundle 字符串）。CLI 用 `process.execPath` 以 detached 方式启动插件进程，pid 写在插件目录的 `run/pid.json`，输出追加到 `run/plugin.log`（confirmed；这组插件管理函数在 cli bundle 里尚无真名）。`duoduo upgrade` 只重启它升级过的渠道（§5.3）；daemon 重启后，适配器要自己重新连接，升级命令的告警文字也写明 daemon 重启可能断开渠道连接（`The daemon restart may still drop its connection`（`cli:runUpgradeChannelPhase`））。

**环境与凭据。**渠道凭据放在 `~/.config/duoduo/.env`，CLI 在 `channel <kind> start` 之前读入它（§2.4）；但传给插件子进程的环境只有一组基础变量（`PATH`、`HOME`、`LANG` 等）、daemon 连接变量，以及插件清单 envAllowlist 列出的键（confirmed，cli bundle）。改了渠道凭据只需重启该渠道；改了 `ALADUO_*` 要重启 daemon（技能原文）。凭据不应写进 Markdown 配置：种类文件的 `<kind>:` 块会随每次入站消息原样返回给适配器（INTERNALS 9.3）。

---

## 7 实测记录

本节是本机部署时的测量记录，每条注明测量版本。记录描述的机制在 v0.8.3 是否仍然成立，以前文的代码结论为准；已知与 v0.8.3 不同的地方写在对应小节里。

### 7.1 部署步骤（v0.6.1，2026-06-30）

**环境**：Linux x86_64，没有 node 与 npm（自行安装），Docker 可用，没有免密 sudo。

```bash
# 1) 安装 Node 22 LTS 到用户目录（无 sudo）
curl -fsSL -o node.tar.xz https://nodejs.org/dist/v22.17.0/node-v22.17.0-linux-x64.tar.xz
tar -xf node.tar.xz -C ~/.local
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"   # 已写入 ~/.bashrc

# 2) 安装 duoduo 运行时（250 个包，约 34 秒）
npm install -g @openduo/duoduo            # → v0.6.1

# 3) 非交互式 onboard（host 模式 + 本机 Claude Code 认证）
export DUODUO_NODE_BIN="$(command -v node)"   # 取实际装好的 node，不写死安装路径
export ALADUO_RUNTIME_MODE=host
export ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local   # 依赖本机已 claude login
export DUODUO_ONBOARD_YES=1
duoduo onboard

# 4) 持久化关键环境变量——两个变量归两个地方
#    ~/.config/duoduo/.env（daemon 启动时自己读入，ALADUO_* 归这里）:
#      ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local
#    ~/.bashrc（启动 duoduo 的 shell；bin/duoduo wrapper 只认进程环境、不读 .env）:
#      export DUODUO_NODE_BIN="<command -v node 的输出>"

# 5) 启动并验证
duoduo daemon start          # → healthy, pid, runtime_mode=host, v0.6.1
duoduo daemon status         # → 4 个后台分区已加载
curl -s http://localhost:20233/dashboard   # → HTTP 200
printf 'Reply ...\n' | duoduo chat         # → 模型正确回复（端到端通路）
```

这次部署得出两个注意事项。一是没有交互 TTY 时必须用环境变量驱动 `duoduo onboard`，缺少必需变量时 onboard 以退出码 2 结束并打印完整的变量说明。二是 daemon 是分离的后台进程，PATH 可能被重置，所以 `DUODUO_NODE_BIN`（node 的绝对路径）要 export 在启动 `duoduo` 的 shell 启动文件或进程管理器环境里，认证来源当时写进 `.env` 以便重启后仍然生效。

v0.8.3 与这份记录有三处不同（confirmed，见 §2）。非交互 onboard 的最低要求只有 `ALADUO_CLAUDE_AUTH_SOURCE`，`compatible_endpoint` 另需 `ANTHROPIC_BASE_URL`，`anthropic_api_key` 另需 `ANTHROPIC_API_KEY`。v0.8.3 的 daemon 不读取 `ALADUO_RUNTIME_MODE`，第 3 步那一行可以省去。v0.8.3 的 CLI 每次启动或重启 daemon 前都会从 `config.json` 重新应用认证来源，所以第 4 步把 `ALADUO_CLAUDE_AUTH_SOURCE` 写进 `.env` 只在绕过 CLI 启动 daemon 时才必要。这份记录没有涉及升级；v0.8.3 上升级应使用 `duoduo upgrade`（§5.3）。

### 7.2 部署后观察到的运行时状态（v0.6.1）

| 观察项 | 结果 | 机制见 |
|--------|------|--------|
| 运行时目录 | `~/.aladuo/var/` 下有 `events/`、`sessions/`、`ingress/`、`outbox/`、`usage/`、`telemetry/` 等目录；一次对话在 `var/events/2026-06-30.jsonl` 写下 3 条事件 | §3.2；INTERNALS 第 5 节 |
| 事件顺序 | `channel.attached` → `channel.message` → `agent.result`，消息事件先于结果写入 | GUIDE 2.1；INTERNALS 第 5、6 节 |
| `duoduo session list` | 按 `kind`（channel、job、subconscious）与 `plane` 分类的路由表；配置中 `max_concurrent_channel=10`、`max_concurrent_job=6` | GUIDE 2.2、2.3；INTERNALS 第 8 节 |
| `duoduo daemon status` | 心跳 `every 37min`，`subconscious: 0/0 partitions done`；4 个分区已加载，各有 cooldown 与 timeout | §5.5；INTERNALS 第 11 节 |
| Dashboard | `http://localhost:20233/dashboard` 返回 HTTP 200 | §4 |
| REST 风格接口 | 没有 `/api/events`（返回 404），也没有独立的 dashboard 保存接口端口 | §4 |

### 7.3 一条消息的端到端记录（v0.6.1）

向 stdio 渠道发送一条 "6×7" 测试消息，经过的路径如下图。

```
                          ┌─────────────────────────── duoduo daemon (host 进程) ───────────────────────────┐
  外部渠道                │                                                                                  │
 (本次为 stdio)           │   ① 写事件日志      ② 入队           ③ 执行(drain)          ④ 出站              │
        │                 │  spine.append  →  session mailbox  →  引擎调用     →  outbox  →  replay/index   │
        │  channel.message │  (事件先落盘)     (每会话一个       (本次为 Claude)  (落盘)                      │
        └────────────────▶│                    actor)                                                        │
                          │        │                                   │                                     │
                          │   var/events/*.jsonl                 var/usage/*.jsonl  ← 成本/token 账本        │
                          └──────────────────────────────────────────────────────────────────────────────┘
```

事件日志里依次出现三条事件：`channel.attached`（stdio 渠道绑定到会话 `stdio:default:28d3ca682f86`）；`channel.message`（入站消息先写入事件日志，再执行）；`agent.result`（模型经 Claude Code 本地认证给出回复 `DUODUO_OK_42`，6×7=42 正确）。`usage.get` RPC 同时记下这次 drain 的账本：`total_drains=1`、`cost_usd≈0.239`、`input_tokens=2806`、`output_tokens=12`、`cache_creation_tokens=22445`。这条记录说明 stdio → 事件日志 → mailbox → drain → outbox 在这次部署上全部可用；v0.8.3 里一条消息经过的各步骤及其代码位置见 INTERNALS 第 1 节。

### 7.4 重启后的状态恢复（v0.6.1）

进程可以随时替换，状态保存在文件里：执行 `duoduo daemon restart` 后，进程 PID 从 `3128489` 变为 `3129393`，是一个新进程，但运行时身份 `runtime_id` 保持 `rt_b3b7599e9317` 不变；`session list` 仍显示同一个 `stdio:default:28d3ca682f86` 和同一个 `LAST_EVENT` 时间戳；事件日志里的 3 条事件完好；认证来源重新加载为 `claude_auth_source: claude_code_local`。README 的对应主张是"进程中途死亡，系统从文件恢复，恰好从中断处继续"。恢复所依赖的机制（事件日志、邮箱指针、消费进度）见 INTERNALS 第 5 节。

### 7.5 控制面探测（v0.7.1）

在隔离环境（`ALADUO_PORT=20334`）上探测只读端口与 socket，结果与 §4 描述的 v0.8.3 代码行为一致：

```
$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
{"jsonrpc":"2.0","id":1,"result":{...}}                                          # 只读方法：通过
$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":2,"method":"session.send","params":{}}'
{"jsonrpc":"2.0","id":2,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}   # 写方法：按预期拒绝
$ ls -la <runDir>/daemon.sock
srw------- 1 <uid> <uid> 0 ... daemon.sock                                       # 权限 0600
$ curl -s -H 'Content-Type: application/json' \
    --unix-socket <runDir>/daemon.sock http://localhost/rpc -XPOST -d '...system.status...'
{"jsonrpc":"2.0","id":3,"result":{...}}                                          # socket 上同一方法照常工作
```

探测时不能省略 `-H 'Content-Type: application/json'`：`curl -d` 默认发送 `application/x-www-form-urlencoded`，fastify 在 JSON-RPC 分发之前就返回 `415 FST_ERR_CTP_INVALID_MEDIA_TYPE`，容易把"方法被只读端点拒绝"误读成"端点不可用"。daemon 日志同时记下一条 `[WARN] [daemon] rejected write method on read-only port { method: 'session.send', id: 2 }`（`rejected write method on read-only port`（`createDaemon`））。完整记录见 [`reconstruction/VERIFICATION.md`](../reconstruction/VERIFICATION.md)。

### 7.6 验证清单（v0.6.1，全部通过）

| 验证项 | 结果 |
|--------|------|
| daemon 健康 | `healthy: yes`，v0.6.1，host 模式 |
| 端到端对话 | stdio 发消息，模型正确回复 `DUODUO_OK_42` |
| 事件日志 | `channel.attached → channel.message → agent.result` 写入 |
| Dashboard | `http://localhost:20233/dashboard` HTTP 200 |
| RPC | `spine.tail`、`usage.get` 正常返回 |
| 成本账本 | `usage.get` 记录成本与 token |
| 重启恢复 | 重启后 `runtime_id` 不变，会话与事件日志从文件重建 |
| 后台分区 | 4 个分区加载，心跳 every 37min |

---

## 8 运维风险

以下六项风险影响日常运维，后五项都对照 v0.8.3 的代码或包内文件确认过；设计上可借鉴的做法见 GUIDE 6.1，这里不重复。

- **闭源与压缩发布。**运行时代码对人不可读，调试与审计只能依靠运行时的可观测面（文件、事件日志、RPC、CLI）、官方 issue 流程，以及本仓库的还原源码（[`../reconstruction/`](../reconstruction/)）。
- **后台模型费用取决于外部事件，job 也算在内。**心跳按 `ALADUO_CADENCE_INTERVAL_MS`（默认 37 分钟）定时触发，不论前台是否活跃，README 说后台 "runs on a cadence regardless of foreground activity"，成立的是心跳本身；但心跳里的确定性维护不调用模型，要运行后台分区时，先计算活动指纹，即 `memory/fragments`、`memory/entities`、`memory/topics` 三个目录的最新修改时间，加上最新一条外部事件的 id，与上一次心跳相同就不运行任何分区（`activity gate: skipping tick (fingerprint unchanged)`（`createMetaSession`），confirmed）。外部事件指来源不属于 `cadence`、`meta`、`system`、`runner`、`route`、`gateway` 的事件（`o && !eO.has(o) && typeof i.id == "string"`（`readLatestExternalEventId`）），包括渠道消息、job 的 `job.spawn`、`job.complete`、`job.fail` 记录（来源都是 `job`，如 `type: "job.complete"`（`createJobSessionFinalizer`））和 rpc 来源的事件。所以一个周期运行的 job 除了自己的模型费用，还会让下一次心跳重新运行分区；只改记忆板 `memory/CLAUDE.md` 不改变指纹。daemon 启动后的第一次心跳没有上一次指纹可比，总会运行。代码证据见 INTERNALS 11.2，成本控制措施的汇总见 GUIDE 5.2。要降低后台费用，可以调大心跳间隔、减少周期 job，或停用分区。
- **分区提示词不随升级更新。**npm 升级不覆盖内核里已有的分区提示词，需要按 §5.3 的流程显式刷新；不刷新时，新版运行时新增的记忆检查对带旧契约声明的分区不生效。
- **渠道适配器没有自动重启。**适配器进程由 CLI 以 detached 方式启动，之后没有任何进程在它崩溃或主机重启后把它拉起来：daemon bundle 里没有启动渠道插件的代码，macOS 的 launchd 服务只托管 daemon 本身（confirmed，否定性证据：daemon bundle 中不含插件的 `pid.json`、`plugin.log` 路径；主机重启后的行为未实测）。`duoduo upgrade` 只重启它升级过的渠道，`duoduo channel install` 不重启任何进程（§6）。所以要在主机重启、适配器崩溃或 daemon 重启之后用 `duoduo channel <kind> status` 检查。
- **usage 账本没有自动保留。**`var/usage/<session_key>.jsonl` 只追加、不清理，长驻主机上会累积到几百 MB，需要按 `duoduo-runtime-admin` 技能的 usage 账本维护流程（`references/usage-archive.md`）手动归档。
- **去重文件只增不减。**`var/registry/dedup.jsonl` 为每个带幂等键的入站消息追加一行，没有淘汰或清空的代码，首次使用时整个文件被装进内存（`spineEventDedupStore (mR)`、`loadRegistryDedupStore (MXe)`，confirmed；代码证据见 INTERNALS 5.3）。它的增长速度取决于渠道是否为每条消息提供幂等键，本文未实测。

---

## 附录 A：关键路径与命令速查

| 项 | 值 |
|----|----|
| 内核目录 kernel_dir | `~/aladuo`（git 管理；`ALADUO_KERNEL_DIR` 可改） |
| 运行时目录 runtime_dir | `~/.aladuo`（`var/` 事件溯源数据，`run/` 锁、socket 与进程输出，`plugins/channels/` 渠道插件；`ALADUO_RUNTIME_DIR` 可改） |
| 持久化环境变量 | `~/.config/duoduo/.env`（`ALADUO_*`、`ANTHROPIC_*`、渠道凭据，daemon 启动时读入）；`DUODUO_NODE_BIN` 例外，放启动 `duoduo` 的 shell 启动文件或进程管理器环境（§2.4） |
| onboard 选择 | `~/.config/duoduo/config.json`（`authSource`、`workDir`，可加 `defaultRuntime`；CLI 启动或重启 daemon 前应用） |
| 配置层 | 行为键：`kernel/config/<kind>.md` → 实例描述文件；模型选择类键：`kernel/config/runtime.md` → 种类 → 实例（§3.4） |
| Dashboard | `http://localhost:20233/dashboard` |
| RPC | 全权：`<runDir>/daemon.sock`（unix socket，权限 0600）；只读：`POST http://localhost:20233/rpc`（6 个白名单方法，其余 `-32601`）；可选远程监听需 HOST、TOKEN、REMOTE_PORT 三项齐全（§4） |
| 默认端口 | 20233（只读 TCP，只监听 127.0.0.1） |
| 默认心跳间隔 | 37 分钟（`ALADUO_CADENCE_INTERVAL_MS`，默认 2220000 毫秒） |
| daemon 日志 | macOS：`run/daemon.stderr.log`；其他平台：`duoduo daemon logs`（`run/daemon-supervisor.log`） |
| 读事件日志 | `duoduo spine cat …`（对话记录）、`duoduo spine show <event-id>`（单条事件） |
| 重启 | `duoduo daemon restart -r "<改了什么>" [--wake <会话或别名>]` |
| 升级 | `duoduo upgrade [version] [--wake <会话或别名>]`；手工等价步骤不升级渠道包（§5.3） |
