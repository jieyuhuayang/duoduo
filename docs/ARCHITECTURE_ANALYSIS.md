# duoduo 部署与运维架构分析

> 对齐版本：`@openduo/duoduo` **v0.8.3**（npm 运行时）与 `openduo/duoduo` GitHub 仓库。
> 证据来源：仓库文档；v0.8.3 包内提示词（`bootstrap/`）与还原源码（[`../reconstruction/`](../reconstruction/)）；本机部署实测。实测记录都注明了测量时的版本：§2、§4、§5、§12 的部署与端到端记录测于 v0.6.1，§10.2 的控制面探测测于 v0.7.1。这些记录描述的机制在 v0.8.3 是否仍然成立，以代码为准，差异写在对应位置。
> 引用写法与 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md) 相同：`真名 (短名)` 或 `代码片段`（`真名`），不写行号；片段引用 cli bundle 里的符号时写作（`cli:真名`）。机制主张标 `confirmed`（对照 v0.8.3 代码或包内文件确认过）或 `未证实推测`。
>
> **姊妹篇**：本文是部署与运维层面的分析。入门与设计思路请先读 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)（下称 GUIDE）；逐机制的代码证据见 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)（下称 INTERNALS）；还原方法与可运行产物见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md) 与 [`../reconstruction/`](../reconstruction/)。

---

## 0. 结论

duoduo 是一个让大语言模型无人值守持续运行的程序；模型自身做不到的事（保存状态、调度、并发、边界检查）由运行时代码完成，需要判断的事交给模型。本文讲它的部署与运维：怎样安装和启动，状态存放在哪些目录和文件，控制面怎样访问，日常用哪些命令，以及在真实部署上测到的行为。

运维需要掌握的事实可以归成五类，分别对应下文各节。第一，duoduo 以 npm 包里的压缩 JavaScript 分发，部署就是全局安装并启动一个常驻 daemon（§1、§12）。第二，状态分放在两个目录：`~/aladuo` 是内核，放提示词、配置和记忆，并由 git 管理；`~/.aladuo` 是运行时数据，放事件日志、会话、job 与锁（§3）。第三，环境变量有两个存放位置：`ALADUO_*` 等 daemon 读取的键放 `~/.config/duoduo/.env`，`DUODUO_NODE_BIN` 放启动 `duoduo` 的 shell 或进程管理器环境（§3.3、§10.4）。第四，控制面有三个入口：只读的 TCP 端口、拥有全部权限的 unix socket、三项配置齐全才打开的带口令远程监听（§10）。第五，重启与升级应使用 `duoduo daemon restart -r` 与 `duoduo upgrade`：重启原因会在下一轮告诉 channel 会话，`--wake` 指定的会话会收到通知，升级还会一并升级已安装的渠道包（§10.4）。

---

## 1. 部署前需要知道的事实

部署前需要先知道运行时以什么形式分发：

- **GitHub 仓库本身不包含运行时源码。** 仓库里只有：`README.md`、`CHANGELOG.md`、`skills/`（运维技能）、`subconscious/`（后台分区提示词）、`contrib/`（社区扩展）、`assets/`（截图）。
- **真正的运行时以"压缩后的 JavaScript"形式发布在 npm**（`@openduo/duoduo`）。作者明确说明：这套代码"不是写给人读的"——Agent 能直接读懂、修改 minified 代码，压缩只是为了节省带宽、保持上下文窗口精简。
- 因此 **"部署"= `npm install -g @openduo/duoduo` 并运行 daemon**，而非"克隆源码 + 构建"。
- License 标注为 `Private. All rights reserved.`。README 对名称的说明原文是："we are called openduo and we don't publish source either. Respect to OpenAI."

> 实践意义：本文的系统级主张来自**官方文档 + 运行时可观测行为（文件系统、事件日志、RPC、CLI）**，内部机制另有源码级证据：本仓库把压缩后的运行时还原成了可读、并经证明与出厂版语义相同的源码（见 [`../reconstruction/`](../reconstruction/)）。恢复了多少真名、比较了多少 AST 节点等计数以 [`../reconstruction/maps/pipeline_report.json`](../reconstruction/maps/pipeline_report.json) 为准，本文不抄录。

---

## 2. 上游 README 的六项主张与实测结果

README 提出六项核心主张。它们的机制说明在 GUIDE 与 INTERNALS 里，本表只保留本机部署时观测到的证据。除注明外，实测都在 v0.6.1 上完成。

| # | README 主张（上游标题） | 本次部署的实测证据 | 机制说明见 |
|---|------|---------------------|----------|
| 1 | 文件系统优先、事件溯源运行时 | `~/.aladuo/var/` 下存在 `events/`、`sessions/`、`ingress/`、`outbox/`、`usage/`、`telemetry/` 等目录；一次对话即在 `var/events/2026-06-30.jsonl` 落了 3 条事件 | GUIDE 2.1、2.5；INTERNALS §5 |
| 2 | 网关边界 WAL-before-execute | 实测事件序列严格为：`channel.attached` → `channel.message` → `agent.result`，消息事件先于结果落盘 | GUIDE 2.1；INTERNALS §5、§6 |
| 3 | 一个外部身份、多个内部会话 | `duoduo session list` 显示按 `kind`（channel/job/subconscious）+`plane`（work/...）分类的路由表；config 中 `max_concurrent_channel=10`、`max_concurrent_job=6`。README 说的 "lease locks" 在 v0.8.3 代码里对应三种不同的锁机制，见 §3.1 末段 | GUIDE 2.2、2.3；INTERNALS §8 |
| 4 | 双环认知：前台会话（Cortex）+ 后台分区（Subconscious） | `daemon status` 显示心跳 `every 37min` 与 `subconscious: 0/0 partitions done`；4 个分区已加载并各有 cooldown/timeout。README 说后台"不论前台是否活跃都运行"；v0.8.3 代码里心跳确实定时触发，但只有活动指纹变化时才运行分区，见 §13 | GUIDE 第三部分 3.2、3.3，第四部分；INTERNALS §11、§12 |
| 5 | 自编程认知拓扑 | v0.8.3 的 `subconscious/CLAUDE.md` 列出分区可以改：自己的 `CLAUDE.md`、新建分区目录、`playlist.md`、`memory/CLAUDE.md`；禁止碰：事件日志数据、锁文件、收件箱目录（只能删自己收件箱里的条目表示已处理）、job 调度、其他分区的 `CLAUDE.md`（跨分区的需求写进最终报告）、任何分区的 `contract:` frontmatter | GUIDE 4.7；INTERNALS §11.4、§12 |
| 6 | 最小运行时层、最大模型委派 | v0.8.3 包内 `claude-runtime.md` 写明运行时内嵌 Anthropic Claude Code SDK；内核里有 `claude-runtime.md`、`codex-runtime.md`、`grok-runtime.md`、`pi-runtime.md` 四份引擎说明 | GUIDE 第一部分；INTERNALS §2、§3 |

---

## 3. 进程与文件系统模型

### 3.1 两个根目录（注意区分）

| 目录 | 角色 | 内容 |
|------|------|------|
| `~/aladuo`（**kernel_dir**） | 内核：提示词、配置、记忆 | 出厂文件来自包内 `bootstrap/`：`CLAUDE.md`（内核引导）；`claude-runtime.md`、`codex-runtime.md`、`grok-runtime.md`、`pi-runtime.md`（四个引擎的说明）；`config/runtime.md`（全局配置层）与 `config/<kind>.md`（按渠道种类的配置层，出厂有 `acp`、`feishu`、`stdio`、`job` 四份）；`memory/`（记忆板 `memory/CLAUDE.md` 与 entities、topics、fragments）；`subconscious/`（后台分区提示词与 `playlist.md`）。内核是一个 git 仓库：首次启动时运行时执行 `git init` 并提交一次 `memory: genesis`；之后由 `memory-committer` 分区在改动发生之后按心跳提交。按 `duoduo-runtime-admin` 技能刷新分区提示词时，刷新前的那次提交是可以 `git revert` 回去的点 |
| `~/.aladuo`（**runtime_dir**） | 运行时可变状态 | `run/`：`locks/`（进程写锁 `daemon-writer.json` 与各会话的 drain 租约文件）、`queue_offsets/`、`daemon.sock`、daemon 的 stdout/stderr 日志；`var/`：全部事件溯源数据，见 §3.2 |

> 易混点：**带点的 `~/.aladuo` 是运行时数据**，**不带点的 `~/aladuo` 是内核**。两者都可以用环境变量改位置（`ALADUO_RUNTIME_DIR`、`ALADUO_KERNEL_DIR`，由 `resolveRuntimePaths (Yut)` 解析，confirmed），所以可用 `duoduo daemon config` 查询实际路径，切勿假设。

内核的出厂文件只在内核目录为空时整份复制；内核已存在时只补缺失的文件，已有文件不覆盖（`initializeRuntime (Rdt)` 在启动时调用复制步骤，confirmed；代码证据见 INTERNALS §11.5）。这就是升级 npm 包不会更新已有分区提示词的原因，见 §7。

`run/locks/` 里有两类锁文件，加上内存里的一把互斥锁，共三种机制，各管一件事（confirmed）。进程写锁 `run/locks/daemon-writer.json` 由 `acquireRuntimeWriterLock (p6)` 在 daemon 启动时取得，保证一个数据目录只有一个 daemon 在写，取不到时启动失败并报 `Runtime lock already held by pid=`（`createDaemon`）。drain 租约文件 `run/locks/<会话键哈希>.json` 在 `drainSessionMailbox (KSe)` 处理邮箱前取得，处理期间每 30 秒续期一次（`lockHeartbeatIntervalMs ?? 3e4`（`drainSessionMailbox`）），取不到就不处理这次 drain。按会话键的内存互斥 `runWithSessionMutex (Vi)` 不落文件，让同一会话的状态改动串行执行。INTERNALS §8.2 给出这些锁的代码证据。

### 3.2 `runtime_dir/var/` 的事件溯源结构（实测，v0.8.3 代码复核）

```
~/.aladuo/var/
├── events/                 # 事件日志（上游 Spine，WAL）
│   ├── 2026-06-30.jsonl    #   按天分片；单文件可达 10-30MB
│   └── index/              #   仅 by_id.jsonl 一个索引（无 by_session）
├── sessions/<hash>/        # 每会话状态 + mailbox/（pending/ 与 notes.jsonl）
├── ingress/<hash>/         # 入站快照
├── outbox/                 # 出站投递（stdio/、replay/、index/、.pending_queue.jsonl）
├── usage/<session>.jsonl   # 成本/token 账本（append-only，无自动保留）
├── telemetry/<day>.jsonl   # 遥测
├── jobs/{active,archive}/  # 一次性/周期任务
├── subconscious/<分区>/inbox/  # 各后台分区的收件箱（运行时投递任务单）
├── cadence/                # 启动时创建，当前代码不向其中写入任何文件
├── channels/<id>/          # 每个渠道实例的运行数据
├── registry/dedup.jsonl    # 去重记录
├── meta/partitions/        # 分区状态（含分区退休标记）
└── daemon-restart-reason.json  # 瞬态：CLI 重启前写入，
                            #   新 daemon 启动时读一次即删
```

各目录的路径都由 `resolveRuntimePaths (Yut)` 派生（confirmed）。分区收件箱的路径是 `join(e, "subconscious", t, "inbox")`（`partitionInboxDirFromVar`），在 `var/` 下而不在内核里；内核的 `subconscious/inbox/` 只是出厂脚手架里的空目录，运行时不向它投递。`var/cadence/` 在代码里只出现在路径表和 `initializeRuntime (Rdt)` 的建目录列表中，没有其他读写（confirmed）。

> `daemon-restart-reason.json` 只在 CLI 发出重启（`duoduo daemon restart -r "…"`、`duoduo upgrade`，或只带 `--wake` 的重启）到新 daemon 完成启动之间存在。它由 CLI 进程写入，由新 daemon 启动时读取并立即删除（`claimDaemonRestartReason (zbe)`，confirmed）。它不经过事件日志，没有事件 id，也不记录是哪一个 daemon 该读它，所以任何一次 daemon 启动都会读走当时留在那里的文件；这是因为它必须在新 daemon 存在之前写好。载荷为 `{reason, requested_at, requested_by_agent, wake_targets?}`；`reason` 与 `wake_targets` 都为空时视为没有文件。`wake_targets` 里的每个目标在启动后收到一条强制投递的通知（`source: "daemon-restart"`（`deliverDaemonRestartWakes`）），失败只记日志。`reason` 只注入 channel 会话下一轮的 `daemon-restart-hint` 块，job、分区等其他会话不注入（`stage: "out-of-scope"`（`decideRestartHintInjection`））。代码证据见 INTERNALS §6.4，使用方法见 §10.4。

### 3.3 持久化的配置面

| 文件 | 作用 | 变更后何时生效 |
|------|------|------------------------|
| `~/.config/duoduo/.env` | host 模式持久化的环境变量（`ALADUO_*`、`ANTHROPIC_*`、渠道凭据等），由 daemon 在 `main()` 启动时自己读入 `process.env`（只补未设置的键）。**不含 `DUODUO_NODE_BIN`**：它唯一的读者是 `bin/duoduo` bash wrapper，而 wrapper 不读此文件——放启动 `duoduo` 的 shell 启动文件，见 §10.4 | **需要** `duoduo daemon restart`（daemon 是分离的后台进程，不热加载） |
| `~/.config/duoduo/config.json` | onboard 向导写入的选择（认证来源等） | — |
| `kernel/config/runtime.md` | 全局配置层：对所有会话生效的默认值（例如 `claude.model_profiles`） | 下一次 drain 重新读取 |
| `kernel/config/<kind>.md` | 种类配置层：按渠道种类的默认值与种类级提示词，`<kind>` 取自事件的 `source.kind` | 下一次 drain 重新读取 |
| `var/channels/<id>/descriptor.md` | 实例配置层：单个渠道实例的覆盖与实例级提示词；job 的实例层是 job 文件本身 | 下一次 drain 重新读取；仅当凭证或进程 env 变化才需重启渠道 |

配置按"全局 `runtime.md` → 种类 `<kind>.md` → 实例"三层合并，后一层覆盖前一层（`global = kernel/config/runtime.md, kind = kernel/config/<kind>.md`（`executeGatewayCommand`），confirmed）。job 的种类层按出厂文件的说明是 `config/job.md`，实例层是 job 文件的 frontmatter（包内 `config/runtime.md` 与 `config/job.md` 的注释都这样写）。但 drain 按触发这次运行的事件的来源种类选种类文件：60 秒 job 扫描器发出的 `job.spawn` 事件来源种类是 `cadence`（`name: "job-scanner"`（`scanAndSpawnDueJobs`），confirmed），而 RPC `job.create` 创建时立即发出的那条 `job.spawn` 来源种类是 `job`（`method === "job.create"`（`createDaemon`），confirmed）。由此推断，由扫描器触发的周期运行读不到 `job.md`，只有"全局 `runtime.md` + job 文件 frontmatter"两层（未证实推测：需要实测一次周期运行的系统提示里 `channel_kind` 的取值；代码证据见 INTERNALS §3.5）。

---

## 4. 数据流：一条消息的完整生命周期（实测于 v0.6.1）

```
                          ┌─────────────────────────── duoduo daemon (host 进程) ───────────────────────────┐
  外部渠道                │                                                                                  │
 (stdio / Feishu / ACP)   │   ① 写事件日志      ② 入队           ③ 执行(drain)          ④ 出站              │
        │                 │  spine.append  →  session mailbox  →  引擎调用     →  outbox  →  replay/index   │
        │  channel.message │  (事件先落盘)     (每会话一个       (claude/codex/  (落盘)                      │
        └────────────────▶│                    actor)            grok/pi 之一)                              │
                          │        │                                   │                                     │
                          │   var/events/*.jsonl                 var/usage/*.jsonl  ← 成本/token 账本        │
                          └──────────────────────────────────────────────────────────────────────────────┘
```

**本次实测的事件序列**（向 stdio 发送一条 "6×7" 测试消息）：

1. `channel.attached` —— stdio 渠道绑定到会话 `stdio:default:28d3ca682f86`
2. `channel.message` —— 入站消息**先写入事件日志**（WAL-before-execute）
3. `agent.result` —— 模型经 Claude Code 本地认证产出回复 `DUODUO_OK_42`（正确：6×7=42）

`usage.get` RPC 同时记录了这次 drain 的账本：`total_drains=1`、`cost_usd≈0.239`、`input_tokens=2806`、`output_tokens=12`、`cache_creation_tokens=22445`。

> 这条链路完整跑通，说明 **stdio → 事件日志 → mailbox → drain → outbox** 在这次部署上全部可用。一条消息在 v0.8.3 里经过的各步骤及其代码位置见 INTERNALS §1。

---

## 5. 崩溃恢复与"进程无状态"（实测于 v0.6.1）

README 主张："进程中途死亡，系统从文件 rehydrate，恰好从中断处续上。"

**本次实测**：执行 `duoduo daemon restart` 后——

- 进程 PID 从 `3128489` 变为 `3129393`（确实是全新进程），
- 但 **`runtime_id` 保持 `rt_b3b7599e9317` 不变**（运行时身份跨进程持久化），
- 会话从文件重建：`session list` 仍显示同一 `stdio:default:28d3ca682f86`、同一 `LAST_EVENT` 时间戳，
- 事件日志里的 3 条事件完好无损，
- 认证来源从 `.env` 重新加载（`claude_auth_source: claude_code_local`）。

> 结论：**进程可以随时替换，状态在文件里**。这是"文件系统即数据库"主张的直接证据。恢复所依赖的机制（事件日志、邮箱指针、消费进度）见 INTERNALS §5。

---

## 6. 前台会话与后台分区（上游 Cortex 与 Subconscious）

这部分的机制说明在 GUIDE 第三部分（3.2 心跳与后台分区会话、3.3 四个跳过条件）、第四部分（从事件日志到记忆板的流水线）与附录 B（出厂四个后台分区），代码证据在 INTERNALS §11（心跳与后台分区，含 11.5 出厂初始化与分区退休）与 §12（记忆系统）。运维上需要知道三点：心跳间隔由 `ALADUO_CADENCE_INTERVAL_MS` 设置，默认 2220000 毫秒即 37 分钟（`"ALADUO_CADENCE_INTERVAL_MS", 222e4`（`main`），confirmed）；`duoduo daemon status` 显示已加载的分区与当前一轮 playlist 的完成情况；出厂列入退休名单的旧分区（`memory-weaver`、`cadence-executor`）只是被 `retirePartitionOnce (fdt)` 把 frontmatter 的 `schedule.enabled` 改为 `false` 并在 `var/meta/partitions/` 写下 `.retired` 标记，目录和内容都保留；它只处理仍按出厂方式声明自己、且处于启用状态的同名目录，手工改回 `enabled: true` 后运行时不会再次关闭它（`the retirement runs once`（`retirePartitionOnce`），confirmed）。

---

## 7. agent 对提示词与记忆的修改（上游"自编程认知拓扑"）

这部分的机制说明在 GUIDE 4.1（设定与记忆存放在一个 git 仓库里）、4.7（谁能改什么）与 4.8（上游升级与 agent 修改互不覆盖），代码证据在 INTERNALS §11.4（契约过滤与分区工具白名单）、§11.5 与 §12。运维上需要知道的是升级的版本耦合：`npm install` 或 `duoduo upgrade` 升级后，内核里已有的分区提示词不会被新版本覆盖（§3.1），要用新版提示词必须按 `duoduo-runtime-admin` 技能的 subconscious refresh 流程显式刷新。该流程要求内核 git 工作区干净，先展示差异再覆盖，保留用户调过的 `schedule:` 与 `runtime:`/`model:`/`effort:` 键，正文与 `contract:` 段取上游版本，最后提交一次，这次提交就是出问题时 `git revert` 的回退点；刷新后不需要重启 daemon（技能原文 `references/subconscious-refresh.md`）。不刷新时，旧版分区提示词可能按旧格式理解新版运行时发出的检查信号。

---

## 8. 引擎（配置字段 `runtime`）

这部分的机制说明在 GUIDE 第一部分（1.2 四个引擎的接入方式、1.4 引擎与模型的选择与会话绑定、1.7 无人值守下的权限与认证），代码证据在 INTERNALS §3。运维上需要知道五点，均 confirmed。第一，`runtime` 有四个取值 `L0 = ["claude", "codex", "grok", "pi"]`（`initChannelProtocolModule`），未指定时取 `ALADUO_DEFAULT_RUNTIME`，再没有就是 `claude`（`resolveDefaultRuntime (Co)`）；daemon 启动时把四者的可用性写进日志（`available runtimes at boot`（`main`）），其中 pi 恒为可用，因为它随包分发（`dist/release/pi-worker.js`），不需要另装外部 CLI（`e.push("pi")`（`listSelectableJobRuntimes`））。第二，引擎之间不互相替代：请求的引擎不可用时这次 drain 被拒绝（`stage: "runtime_unavailable"`（`drainSessionMailbox`）），会话历史属于另一个引擎时也被拒绝（`stage: "runtime_mismatch"`（`drainSessionMailbox`）），后者需要先 `/clear`。第三，onboard 时三选一的认证来源都只作用于 Claude 引擎：`claude_code_local`（本机已 `claude login`，本次部署采用）、`anthropic_api_key`（设置 `ANTHROPIC_API_KEY`）、`compatible_endpoint`（设置 `ANTHROPIC_BASE_URL` 与 `ANTHROPIC_AUTH_TOKEN`，`isClaudeAuthSource (Xct)` 只接受这三个值）。第四，`compatible_endpoint` 需要的是 **Anthropic 兼容**端点：onboard 把这组 `ANTHROPIC_*` 变量写进 `.env`（`writeHostModelEnvConfig ($we)`），它们作为 Claude Code 的环境变量生效，Claude Code 按 Anthropic Messages 协议请求 `ANTHROPIC_BASE_URL`；包内 `claude-runtime.md` 把它写成 "OpenAI-compatible endpoint (sglang, vLLM, etc)"，与代码行为不符。第五，可选原生二进制没装上时，可以用 `CLAUDE_CODE_EXECUTABLE` 指向本机的 `claude` 可执行文件（`CLAUDE_CODE_EXECUTABLE_ENV_KEY (G6)`）。

---

## 9. 渠道适配器

渠道适配器把 duoduo 连接到外部消息平台。包内自带 stdio 与 ACP 两个渠道入口（`dist/release/stdio.js`、`dist/release/channel-acp.js`），飞书适配器以独立 npm 包安装：

```bash
duoduo channel install @openduo/channel-feishu
duoduo channel feishu start
```

- 当前官方可用的外部渠道包：`@openduo/channel-feishu`（飞书 / Lark）。飞书适配器的会话键派生、@ 过滤、进度卡与表情回应在适配器包内实现，证据见 INTERNALS §9。
- 配置按三层合并：`kernel/config/runtime.md`（全局）→ `kernel/config/<kind>.md`（种类）→ `var/channels/<id>/descriptor.md`（实例），见 §3.3。
- 渠道安装器只接受 **npm 包名**，或带 `--from-path` 的**本地 `.tgz` 包**；不带 `--from-path` 的本地路径会被拒绝（`isInstallTargetFilePath (hXe)` 按 `.`、`/`、`~` 开头或 `.tgz` 结尾识别路径，confirmed），裸 git 仓库不能当渠道装。
- 包结构（README）：`@openduo/duoduo`（核心运行时+CLI）、`@openduo/channel-feishu`（飞书适配器）、`@openduo/protocol`（零依赖共享 RPC 类型）。
- `duoduo upgrade` 会一并升级已安装的渠道包：已是最新的跳过，需要升级的先停掉正在运行的渠道，daemon 重启后再把原先在运行的渠道启动起来（`stopped for upgrade`（`cli:runUpgradeChannelPhase`），confirmed）。

---

## 10. 可观测性与控制面

### 10.1 Dashboard
- 地址 `http://localhost:20233/dashboard`（本次实测 **HTTP 200**）。
- **单文件、零依赖** HTML（包内 `bootstrap/dashboard.html`），由 daemon 直接服务，无构建步骤、无额外端口、无框架。
- 三大区：**Header**（累计成本/token/工具调用数/健康灯）、**Signal Bar**（每个活跃实体的形状+颜色状态：● 前台会话 / ■ 周期任务 / ◆ 一次性任务 / ✓· 后台分区）、**Event Stream**（实时事件日志，富渲染 + 可展开 JSON）。

### 10.2 控制面：TCP 只读，unix socket 拥有全部权限

daemon 对外有三个监听器，共用一套路由，权限不同（confirmed；代码证据见 INTERNALS §6.1）：

1. **TCP `:20233`（`ALADUO_PORT`，默认 20233，`process.env.ALADUO_PORT ?? process.env.PORT ?? 20233`（`main`））——只读**。它只监听 loopback（`host: "127.0.0.1"`（`createDaemon`））。`/rpc` 只放行一份只读方法白名单：`system.status, usage.get, job.list, spine.tail, system.runtime.info, system.config`；其余方法返回 JSON-RPC `-32601`（`Method not available on read-only endpoint`（`createDaemon`）），HTTP 状态仍是 200，不是连接层拒绝。`/ws` 在这个端口上返回 HTTP 426（`upgrade_required`（`createDaemon`）），响应体说明全权限客户端（duoduo CLI 与渠道适配器）应改连 unix socket，并附 `socket_path`。这个监听器还检查 Host 与 Origin 头，只接受 `127.0.0.1`、`localhost`、`::1`，用来防 DNS rebinding（`Host header not allowed`（`createDaemon`））。`/healthz`、`/dashboard`、`/readyz` 三个端点不受只读限制。
2. **unix socket（默认 `<runDir>/daemon.sock`，可用 `ALADUO_DAEMON_SOCKET` 覆盖）——全部权限**。daemon 启动时要求 socket 所在目录属于当前用户且权限为 0700，否则拒绝启动（`mode 0700`（`createDaemon`））；`listen` 之后再把 socket 文件权限设为 0600（`chmod(x, 384)`（`createDaemon`））。所以访问控制就是文件系统权限：只有本机同一个 OS 用户能打开它，没有应用层口令。socket 路径超过 104 字节时 daemon 拒绝启动。CLI 与渠道适配器默认走这条路径。
3. **可选的远程监听器——需要 `ALADUO_DAEMON_HOST`、`ALADUO_DAEMON_TOKEN`、`ALADUO_REMOTE_PORT` 三项齐全才打开**（`resolveRemoteListenerConfig (jyt)`）。三项齐全时，即使 HOST 是 loopback 地址也会打开；缺任何一项时不打开。两种缺项会直接让 daemon 启动失败：HOST 是非 loopback 地址却没有 TOKEN（`remote exposure requires ALADUO_DAEMON_TOKEN`（`resolveRemoteListenerConfig`）），或 HOST 非 loopback、有 TOKEN、却没有 REMOTE_PORT（`remote exposure requires an explicit ALADUO_REMOTE_PORT`（`resolveRemoteListenerConfig`））。REMOTE_PORT 必须与只读端口不同。TOKEN 用 `duoduo daemon token new [--force]` 生成：CLI 把它写进 `~/.config/duoduo/.env` 并把文件权限设为 0600，已有 TOKEN 时必须加 `--force` 才会轮换，因为轮换会让所有已连接的远程渠道适配器失效。这个监听器上的 `/rpc` 与 `/ws` 都要求 `Authorization: Bearer <token>`，比较的是两者 SHA-256 摘要，用常数时间比较（`timingSafeEqual`（`createDaemon`））。

**活体验证**（v0.7.1，隔离环境，`ALADUO_PORT=20334`；上述行为在 v0.8.3 代码中逐条复核仍成立）：
```
$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
{"jsonrpc":"2.0","id":1,"result":{...}}                                          # 只读方法：通过
$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":2,"method":"session.send","params":{}}'
{"jsonrpc":"2.0","id":2,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}   # 写方法：按预期拒绝
$ ls -la <runDir>/daemon.sock
srw------- 1 <uid> <uid> 0 ... daemon.sock                                       # mode 0600
$ curl -s -H 'Content-Type: application/json' \
    --unix-socket <runDir>/daemon.sock http://localhost/rpc -XPOST -d '...system.status...'
{"jsonrpc":"2.0","id":3,"result":{...}}                                          # socket 上同一方法照常工作
```
> 探测时 `-H 'Content-Type: application/json'` 不可省：`curl -d` 默认发 `application/x-www-form-urlencoded`，fastify 在 JSON-RPC 分发之前就返回 `415 FST_ERR_CTP_INVALID_MEDIA_TYPE`，会把"方法被只读端点拒绝"误读成"端点不可用"。
daemon 日志同步落一条 `[WARN] [daemon] rejected write method on read-only port { method: 'session.send', id: 2 }`（`rejected write method on read-only port`（`createDaemon`）），完整记录见 [`reconstruction/VERIFICATION.md`](../reconstruction/VERIFICATION.md)。

### 10.3 RPC 接口
Dashboard 通过 **`POST /rpc`（JSON-RPC 2.0）** 与 daemon 通信，走只读 TCP 端口即可。包内 `bootstrap/dashboard.html` 调用的正好是只读白名单里的六个方法（confirmed）：

| 方法 | 用途 | 实测结果（v0.6.1） |
|------|------|----------|
| `system.status` | 健康状态、会话与分区概况 | （dashboard 使用） |
| `usage.get` | 成本/token 账本（dashboard 传 `{mode:"totals"}`） | 返回 drain/cost/token 明细 |
| `job.list` | 任务列表（dashboard 传 `{summary:true}`） | （dashboard 使用） |
| `spine.tail` | 拉取最近的事件日志条目 | 返回本会话 3 条事件 |
| `system.runtime.info` | 运行时信息 | （dashboard 使用） |
| `system.config` | 生效的配置及其来源（env 或默认值） | （dashboard 使用） |

> 注意：没有 REST 风格的 `/api/events`（实测 404），也没有独立的 dashboard 保存接口端口。控制面方法的全集见 INTERNALS 附录 B.2，只读端口放行的方法见附录 B.3。

### 10.4 CLI 运维命令

**命令一览**（v0.8.3 `duoduo --help` 与各子命令帮助，confirmed）：

| 命令 | 用途 |
|------|------|
| `duoduo daemon start\|stop\|restart\|status\|config\|logs`、`duoduo daemon token new [--force]` | daemon 生命周期、诊断与远程访问口令 |
| `duoduo session list\|alias\|notify\|wake\|compact\|model\|effort\|config\|archive` | 列出会话、起别名、发通知、预约一次唤醒、排队 `/compact`、改模型与推理力度、读写渠道可改的配置、归档（`runSessionSubcommand (y$e)`） |
| `duoduo job list\|read\|archive\|interrupt\|reschedule` | job 生命周期，见下文（`runJobSubcommand (nJe)`） |
| `duoduo spine cat\|show` | 读事件日志：`cat` 输出按条件筛选的对话记录，`show` 输出一条事件的完整 JSON（`runSpineCommand (Zje)`） |
| `duoduo memory check\|reclaim\|board-lint\|entity-lint\|node-lint` | 记忆树的只读测量与孤立节点回收（`runMemoryCommand (Uje)`） |
| `duoduo channel install\|list`、`duoduo channel <type> start\|stop\|status\|logs\|doctor` | 渠道适配器的安装与运维 |
| `duoduo prompts [name]` | 列出或打印命名提示词（`runPromptsSubcommand (iJe)`） |
| `duoduo upgrade [version] [--wake …]`、`duoduo --version` | 升级；`--version` 直接读包自身的 `package.json`，不需要 daemon（`"unknown"`（`cli:readCliPackageVersion`）） |

**job 生命周期由 CLI 处置（confirmed）。** 派发入口 `runJobSubcommand (nJe)`，参数解析 `parseJobCli (Kge)`，帮助文本 `jobHelp (nU)`。`archive`、`interrupt`、`reschedule` 三个动作只在 CLI 上提供，agent 的 `ManageJob` 工具只能 create/list/read（见 INTERNALS §4.2）；job 调度与结算的代码证据见 INTERNALS §10。使用时注意两点：

- **`interrupt` 必须写理由，理由会告诉被打断的会话。** 缺 `-r`/`--reason` 时报 `error: duoduo job interrupt requires -r "<reason>"`（`cli:parseJobCli`），`-r` 用在其他动作上也会被拒绝（`takes no -r/--reason`（`cli:parseJobCli`））。帮助文本写明这个字符串"是被打断的会话下一次运行时被告知的内容"（`jobHelp (nU)`），所以打断不是静默结束进程，该 job 下一次运行时知道上次为什么被中断。回执由 `renderInterruptReceipt (jge)` 渲染，其中说明了打断的范围：运行时只请求停止，不理会中止信号的工具不会被杀掉。
- **`archive` 不删除任何东西**，帮助文本最后一句是 `Nothing is deleted: an archived job's files move to var/jobs/archive/.`（`cli:jobHelp`）。`reschedule` 只额外触发**一次**，帮助文本写明 `The job's schedule class is never changed.`。

**重启与升级（confirmed，cli bundle）：**

- `duoduo daemon restart -r "<改了什么>" [--wake <session-or-alias>]`。参数由 `parseRestartArgs (bXe)` 解析，`--wake` 可重复。`-r` 的字符串与 `--wake` 的目标一起写进 `<varDir>/daemon-restart-reason.json`，新 daemon 启动时读取：`-r` 进入 channel 会话下一轮的 `daemon-restart-hint` 块，`--wake` 的每个目标收到一条"daemon 重启过、你那一轮可能被打断"的通知（§3.2）。CLI 按重启结果打印三种回执之一（`restartWakeReport (NXe)`）：已重启时 `wake queued for <target> — delivered by the daemon once it is up`；实际没有重启时警告 `--wake was dropped`，并给出用 `duoduo session notify` 手工补发的命令；健康检查超时时提示 `--wake is durable — the daemon delivers it when it finishes booting`。这两个参数没有写进 `duoduo daemon --help` 的用法行，那一行只列 `[--daemon-url <url>]`。
- **从会话内让 agent 重启 daemon 时必须带 `-r`**，否则 CLI 拒绝执行并返回 `error: refusing to restart the daemon without --reason`（`reasonlessRestartRefusal (DXe)`）。CLI 判断自己是不是从会话里调用的方法是用 `ps -Ao pid,ppid` 沿父进程链查找 daemon；`ps` 不可用或进程被 nohup/detach 包过时判断不出来，就按人工调用放行。人工在 shell 里执行不带 `-r` 的重启不受这条限制。
- `duoduo upgrade [version] [--wake …]` 优于手工两步。它先 `npm install -g`，打印提醒刷新技能的命令（`npx -y skills add https://github.com/openduo/duoduo --global --all`），然后升级已安装的渠道包、以 `upgraded @openduo/duoduo to <版本>` 为理由重启 daemon，最后把原先在运行的渠道启动起来（§9）。在会话内执行时，CLI 把升级交给一个脱离会话的子进程完成（`isDetachedUpgradeWorker (vXe)` 检查环境变量 `ALADUO_UPGRADE_DETACHED_WORKER`），进度写在 `<runDir>/upgrade.log`；原因是升级触发的 daemon 重启会杀掉会话里的 CLI 进程，它就来不及重新启动渠道。版本参数只接受版本号或 dist-tag，不接受路径、URL 或 git 地址（`Installing from a path, URL or git remote is not supported here.`（`cli:parseUpgradeArgs`））。升级结束时有三种结局：重启成功时打印新 pid；重启已发出但健康检查还没通过时提示 `On a slow-booting host this is expected — confirm with: duoduo daemon status`；停机后旧 daemon 仍在应答时警告 `the previous process is still running the old code`，要求手工重启。
- macOS 上 daemon 由 launchd 的用户级服务托管（标签 `"ai.openduo.daemon"`（`cli:PLIST_LABEL`）），plist 设了 `<key>KeepAlive</key>`（`cli:generatePlist`）并限定图形登录会话；CLI 发现自己在 SSH 会话里（`isAquaSession (tk)` 检查 `SSH_CLIENT`、`SSH_TTY`）就拒绝启动 daemon。macOS 上的重启走 `launchctl kickstart`（`kickstart (ik)`），健康检查超时时抛出一个专用错误：`duoduo upgrade` 把它当作慢启动主机上的正常情况，只打印上面那条提示；`duoduo daemon restart` 仍按失败退出，带了 `--wake` 时先打印"wake 会在启动完成后送达"。Linux 等其他平台先停旧进程再直接拉起子进程，超时就向子进程发 SIGTERM 并报一般错误。由于服务标签对每个用户是固定的，在 macOS 上用改过的 `HOME` 运行 `duoduo daemon start|stop|restart` 仍会操作本机真实的 daemon。

**环境变量放在哪里（confirmed）：**

| 变量 | 放在哪里 | 谁读取 |
|------|---------|--------|
| `ALADUO_*`、`ANTHROPIC_*`、`CLAUDE_CODE_EXECUTABLE`、渠道凭据 | `~/.config/duoduo/.env` | daemon 启动时由 `loadHostDotEnv (Yct)` 读入 `process.env`，只补未设置或为空的键，已有值不覆盖；`main (Fyt)` 在启动时调用它 |
| `DUODUO_NODE_BIN` | 启动 `duoduo` 的 shell 启动文件，或进程管理器的环境 | 只有 `bin/duoduo` bash wrapper 读取：`NODE_BIN="${DUODUO_NODE_BIN:-node}"` |

`DUODUO_NODE_BIN` 不能放 `.env`，原因是读取它的只有 `bin/duoduo` 这个 bash wrapper：v0.8.3 包 `dist/release/` 下的六个 JS 文件都不含这个字面量，wrapper 在任何 JavaScript 运行之前执行，也不读 `.env`。CLI 拉起 daemon 与渠道进程时用的是 `process.execPath`，不再经过 wrapper。所以"PATH 被重置后 `duoduo` 找不到 node"的解决办法是把 `DUODUO_NODE_BIN` export 在启动 `duoduo` 的 shell 启动文件（或进程管理器的环境）里；写进 `.env` 只会让它随 daemon 的 `process.env` 传给 daemon 派生的会话，对 wrapper 没有作用。

macOS 上还有一处差别：CLI 通过 launchd 启动 daemon 时，写进 plist 的环境变量只有一份白名单，即 `ALADUO_*`、`ANTHROPIC_*`、`CLAUDE_CODE_EXECUTABLE`、`PATH`、`HOME`、`LANG`、`LC_ALL`，由 `installAndLoad (rk)` 写入 plist。shell 里 export 的其他变量到不了 daemon，所以在 macOS 上 `.env` 是白名单之外的键进入 daemon 的唯一途径。Linux 等其他平台上，daemon 继承启动它的 CLI 进程的全部环境变量。

---

## 11. 技能（Skills）体系

仓库以 [skills.sh](https://skills.sh/) 安装器形式发布 host 模式运维技能（供任意 Agent 使用，**不依赖** `$skill-name` 之类的 agent 专有语法，用自然语言触发；安装命令 `npx -y skills add https://github.com/openduo/duoduo --global --all`）。仓库 `skills/` 下共六个技能：

| 技能 | 范围 |
|------|------|
| `duoduo-admin` | host 模式总入口：解释工作方式、查看配置与各路径、升级 duoduo、归档与恢复会话 |
| `duoduo-runtime-admin` | daemon 设置、诊断与日志；引擎选择（Claude/Codex/Grok/Pi、`ALADUO_DEFAULT_RUNTIME`）；`.env` 里的 `ALADUO_*` 键；刷新后台分区提示词；`duoduo memory`、`duoduo session`、`duoduo job`、`duoduo spine` 命令；usage 账本清理；第三方模型的 model profile |
| `duoduo-channel-admin` | 渠道安装与生命周期、飞书设置（setup 卡片、owner、主会话）、ACP 编辑器集成、渠道描述文件（kind 与 instance） |
| `duoduo-pipeline` | 用不调用模型的采集层加 `session notify` 唤醒 job，搭建事件驱动的流水线 |
| `duoduo-loop` | `/loop` 命令及其创建的周期后台任务：设置、查看、暂停、改节奏、打断 |
| `smart-compaction` | channel 会话空闲自动压缩：开关、统计数据与阈值调整 |

---

## 12. 本次部署记录（v0.6.1，可复现）

以下是 2026-06-30 在 v0.6.1 上的部署记录。其中的命令在 v0.8.3 的 CLI 帮助里都还在，v0.8.3 与记录不同的地方写在代码块后面。

**环境**：Linux x86_64，无 node/npm（自行安装），Docker 可用，无 passwordless sudo。

```bash
# 1) 安装 Node 22 LTS 到用户目录（无 sudo）
curl -fsSL -o node.tar.xz https://nodejs.org/dist/v22.17.0/node-v22.17.0-linux-x64.tar.xz
tar -xf node.tar.xz -C ~/.local
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"   # 已写入 ~/.bashrc

# 2) 安装 duoduo 运行时（250 包，~34s）
npm install -g @openduo/duoduo            # → v0.6.1

# 3) 非交互式 onboard（host 模式 + 本机 Claude Code 认证）
export DUODUO_NODE_BIN="$(command -v node)"   # 取实际装好的 node，不写死安装路径
export ALADUO_RUNTIME_MODE=host
export ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local   # 依赖本机已 claude login
export DUODUO_ONBOARD_YES=1
duoduo onboard

# 4) 持久化关键 env（保证重启后仍生效）——两个变量归两个地方
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

v0.8.3 与这份记录有两处不同（cli bundle，confirmed）。一是非交互 onboard 的最低要求只有 `ALADUO_CLAUDE_AUTH_SOURCE`：没有 TTY 又没设这个变量时，onboard 打印完整的变量说明并以退出码 2 结束；`DUODUO_ONBOARD_YES=1` 用于跳过所有确认提示；`ALADUO_RUNTIME_MODE` 已不需要设置，daemon 不读取它，CLI 只在它等于 `container` 时提示"container 模式不再支持，按 host 模式继续"。二是升级应改用 `duoduo upgrade`（§10.4），它会同时处理渠道包和重启原因。

**两个部署注意事项**：
1. **无交互 TTY** → 必须用 `duoduo onboard` + 环境变量（至少 `ALADUO_CLAUDE_AUTH_SOURCE`；`compatible_endpoint` 还需 `ANTHROPIC_BASE_URL` 与 `ANTHROPIC_AUTH_TOKEN`，`anthropic_api_key` 还需 `ANTHROPIC_API_KEY`），缺失时 onboard 以 code 2 退出并打印完整 env 配方。
2. **daemon 是分离后台进程，且 PATH 可能被重置** → 把 `DUODUO_NODE_BIN`（node 绝对路径）export 在启动 `duoduo` 的 shell 启动文件或进程管理器环境里——它只被 `bin/duoduo` wrapper 读取，wrapper 不读 `.env`；认证来源 `ALADUO_CLAUDE_AUTH_SOURCE` 则写进 `~/.config/duoduo/.env`（daemon 启动时自己读入），否则重启后丢配置。机制见 §10.4。

**验证清单（v0.6.1 实测，全部通过）**：

| 验证项 | 结果 |
|--------|------|
| daemon 健康 | 通过：`healthy: yes`，v0.6.1，host 模式 |
| 端到端对话 | 通过：stdio 发消息→模型正确回复 `DUODUO_OK_42` |
| 事件日志 | 通过：`channel.attached→channel.message→agent.result` 落盘 |
| Dashboard | 通过：`http://localhost:20233/dashboard` HTTP 200 |
| RPC API | 通过：`spine.tail`/`usage.get` 正常返回 |
| 成本账本 | 通过：usage.get 记录 cost/token |
| 崩溃恢复/重启 | 通过：重启后 runtime_id 不变、会话与事件日志从文件重建 |
| 后台分区 | 通过：4 个分区加载，心跳 every 37min |

---

## 13. 运维上的取舍与注意事项

设计上值得借鉴的做法（持久化边界、先写日志再执行、后台分区、零依赖 Dashboard 等）见 GUIDE 6.1，代码证据分别在 INTERNALS 各节。本节只保留影响运维的四点：

- **闭源 + 压缩发布**：代码对人类不可读，调试与审计依赖运行时的可观测面（文件、事件日志、RPC、CLI）、官方 issue 流程，以及本仓库的还原源码（[`../reconstruction/`](../reconstruction/)）。
- **后台模型费用只在有新活动时产生**：心跳按 `ALADUO_CADENCE_INTERVAL_MS`（默认 37 分钟）定时触发，心跳里的确定性维护不调用模型；要运行后台分区时，先计算活动指纹，即 `memory/fragments`、`memory/entities`、`memory/topics` 三个目录的最新修改时间加上最新一条外部事件的 id，指纹与上一次心跳相同就跳过，不运行任何分区（`activity gate: skipping tick (fingerprint unchanged)`（`createMetaSession`）；外部事件 id 由 `readLatestExternalEventId (Bgt)` 读取，confirmed）。daemon 启动后的第一次心跳没有上一次指纹可比，总会运行。所以没有新的外部消息、记忆文件也不再变化时，后台分区不调用模型；有新活动时，费用随分区运行次数增加，可以调大心跳间隔来降低。job 的费用另算，由用户布置的调度规则决定。
- **升级有版本耦合**：分区提示词不随 npm 升级自动更新，需要按 §7 的流程显式刷新，否则旧分区可能误解析新版运行时发出的检查信号。
- **usage 账本无自动保留**：`var/usage/<session_key>.jsonl` 只追加、不清理，长驻主机上会累积到几百 MB，需要按 `duoduo-runtime-admin` 技能的 usage 账本维护流程手动归档（技能原文）。

---

## 附录 A：关键路径与命令速查

| 项 | 值 |
|----|----|
| 内核目录 kernel_dir | `~/aladuo`（git 管理；`ALADUO_KERNEL_DIR` 可改） |
| 运行时目录 runtime_dir | `~/.aladuo`（`var/` 事件溯源数据，`run/` 锁与 socket；`ALADUO_RUNTIME_DIR` 可改） |
| 持久化 env | `~/.config/duoduo/.env`（`ALADUO_*` 等，daemon 启动时读入）；`DUODUO_NODE_BIN` 例外——只被 `bin/duoduo` wrapper 读，放启动 `duoduo` 的 shell 启动文件/进程管理器环境（§10.4） |
| onboard 选择 | `~/.config/duoduo/config.json` |
| 配置层 | `kernel/config/runtime.md`（全局）→ `kernel/config/<kind>.md`（种类）→ 实例描述文件或 job 文件（§3.3） |
| Dashboard | `http://localhost:20233/dashboard` |
| RPC | 全权：`<runDir>/daemon.sock`（unix socket，mode 0600）；只读：`POST http://localhost:20233/rpc`（6 个白名单方法，其余 `-32601`）；可选远程监听需 HOST、TOKEN、REMOTE_PORT 三项齐全（§10.2） |
| 默认端口 | 20233（只读 TCP，只监听 127.0.0.1） |
| 默认心跳间隔 | 37 min（`ALADUO_CADENCE_INTERVAL_MS`，默认 2220000 ms） |
| 读事件日志 | `duoduo spine cat …`（对话记录）/ `duoduo spine show <event-id>`（单条事件） |
| 升级 | `duoduo upgrade [version] [--wake <session-or-alias>]`；手工等价步骤是 `npm i -g @openduo/duoduo@latest` 后 `duoduo daemon restart -r "<改了什么>"`，但不会升级渠道包 |

## 附录 B：事件日志的事件结构（实测）

每条事件含字段：`type, source, session_key, payload, routing_hint?, id, ts`；`id` 与 `ts` 由 `createSpineEvent (rn)` 在追加时生成。事件按天分片存于 `~/.aladuo/var/events/YYYY-MM-DD.jsonl`，单文件 10-30MB。落库的事件类型全集见 INTERNALS 附录 B.1。

读这些文件要遵守后台分区守则（`subconscious/CLAUDE.md` 的 Large File Guard）：shell 的 `grep -l` 只用来定位哪个分片提到了某个内容；读事件内容用事件日志的 CLI，`duoduo spine cat …` 读一段对话记录，`duoduo spine show <event-id>` 读一条完整事件；不要对 `.jsonl` 使用 `Read` 或 `Grep` 工具，也不要在 shell 里翻页读原始分片。`duoduo spine help`（由 `runSpineCommand (Zje)` 打印）给出的理由是一行 tool_result 可能超过 1MB（confirmed）。
