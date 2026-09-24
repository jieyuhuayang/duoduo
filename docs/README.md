# duoduo 分析文档

**duoduo 是一个让大语言模型无人值守持续运行的程序；模型自身做不到的事（保存状态、调度、并发、边界检查）由运行时代码完成，需要判断的事交给模型。本目录是这个运行时（npm 包 `@openduo/duoduo`）的分析文档：五篇文档里，四篇分别写给产品经理、核对代码的工程师、部署运维的人和做框架选型的人，第五篇说明代码证据本身为什么可信。**

证据来自三处：把 npm 包里的压缩运行时还原成的可读源码（在改名映射下与出厂 bundle 的 AST 全等，产物在 [`../reconstruction/`](../reconstruction/)，方法见 [`SOURCE_RECONSTRUCTION.md`](./SOURCE_RECONSTRUCTION.md)）；同一版本 npm 包内的提示词原文，以及本仓库的 [`../subconscious/`](../subconscious/) 与 [`../skills/`](../skills/)；运行中 daemon 的观测，只在注明之处使用。下文用 GUIDE、INTERNALS、ARCHITECTURE、COMPARISON、SOURCE_RECONSTRUCTION 分别指 `DUODUO_FRAMEWORK_GUIDE.md`、`AGENT_INTERNALS_ANALYSIS.md`、`ARCHITECTURE_ANALYSIS.md`、`AGENT_FRAMEWORKS_COMPARISON.md`、`SOURCE_RECONSTRUCTION.md`，依次给出阅读地图、文档之间的关系、文档清单与对齐版本，最后是写给文档维护者的约定。

## 阅读地图

按要做的事选起点：入门读 GUIDE，核对代码证据读 INTERNALS，部署运维读 ARCHITECTURE，框架选型读 COMPARISON，确认证据本身是否可信读 SOURCE_RECONSTRUCTION。下表给出每种需求从哪一节开始。

| 你是谁 / 你想知道什么 | 从这里开始 |
|---|---|
| 第一次接触 duoduo，想在 15 分钟内建立全貌 | [GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 第 0 节：0.1 模型的五个限制与运行时的对策、0.2 系统总览、0.4 术语表；然后按 0.5 节的 15 分钟读法，读第一至第五部分各自的第一段和第六部分 |
| 产品经理或架构师，想理解设计思路 | [GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 全文。自我改进在第四部分（全文核心）；代码强制的检查、成本控制、失败处置与可观测性在第五部分；十二个可借鉴的设计与三个局限在第六部分 |
| 想知道从 v0.7.1 到 v0.8.3 改了什么 | [GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 附录 D |
| 工程师，要核对某个机制的代码证据 | [INTERNALS](./AGENT_INTERNALS_ANALYSIS.md) 的"结论"表，它列出每个子系统在 INTERNALS 的节和在 GUIDE 的节；从 GUIDE 的某一节出发时，查 GUIDE 附录 C。一条消息从进入到回复的完整路径在 INTERNALS 第 1 节，仍未证实、需要实测的项汇总在第 14 节 |
| 要查落库的事件类型或控制面 RPC 方法 | [INTERNALS](./AGENT_INTERNALS_ANALYSIS.md) 附录 B |
| 要部署或运维 | [ARCHITECTURE](./ARCHITECTURE_ANALYSIS.md) §2（安装、认证来源、引擎选择、环境变量与配置文件的位置）、§5（日常运维命令）、§8（运维风险）；命令速查在附录 A |
| 做技术选型，比较 duoduo、hermes-agent、pi | [COMPARISON](./AGENT_FRAMEWORKS_COMPARISON.md) §0 的结论与三项目速览、§4 的十维度对比、§6 的融合架构建议 |
| 想知道还原源码为什么可信、文档里的代码引用怎样被核对 | [SOURCE_RECONSTRUCTION](./SOURCE_RECONSTRUCTION.md) 的"结论"与"文档引用按身份而非坐标"一节；各产物的位置见它的"产物地图" |
| 要修改这些文档 | 本文末尾的"维护约定" |

## 文档之间的关系

各篇关于 duoduo 代码的结论都以同一份还原源码为依据，SOURCE_RECONSTRUCTION 说明它为什么可信。INTERNALS 是证据文档，按名字引用代码；GUIDE 不含代码引用，它的附录 C 把每一节对应到 INTERNALS 的证据节；ARCHITECTURE 讲部署与运维，机制的解释指向 GUIDE，代码证据指向 INTERNALS；COMPARISON 的 duoduo 部分以这三篇为依据，另外两个框架的事实来自单独的调研。

```
reconstruction/  还原源码、符号索引、引用检查工具（为什么可信：SOURCE_RECONSTRUCTION）
     │
     │ 按名引用，构建核对
     ├──────────▶ INTERNALS     证据文档：每条机制主张指出实现它的代码，并标置信
     │                ▲
     │                │ 附录 C：GUIDE 每一节对应的证据节
     │            GUIDE         写给产品经理的入门，不含代码引用
     │
     ├──────────▶ ARCHITECTURE  部署与运维；机制解释见 GUIDE，代码证据见 INTERNALS
     │
     └──────────▶ COMPARISON    三个框架的对比；duoduo 部分以上面三篇为依据
```

## 文档清单与对齐版本

GUIDE 与 INTERNALS 整篇对齐 v0.8.3；ARCHITECTURE 与 COMPARISON 各有一部分对齐 v0.8.3，范围写在各自的头部，下表照录；SOURCE_RECONSTRUCTION 讲方法，不绑定某个版本。INTERNALS 与 ARCHITECTURE 按名字引用代码，并给每条机制主张标 `confirmed` 或 `未证实推测`；COMPARISON 的 duoduo 部分同样按名字引用；GUIDE 不含代码引用。

| 文档 | 读者与内容 | 对齐版本 |
|---|---|---|
| [DUODUO_FRAMEWORK_GUIDE.md](./DUODUO_FRAMEWORK_GUIDE.md) | 写给产品经理的入门，只假设读者知道大语言模型是输入文本、输出文本的程序。从模型的五个限制出发（不能执行工具、两次调用之间没有记忆、感觉不到时间、没人提问就不运行、不会自己变好），第一至第四部分说明运行时的对策：四个可替换的引擎、一条消息的处理、两套独立的定时器、自我改进；第五部分讲无人值守下的代码强制检查、成本控制、失败处置与可观测性，第六部分总评。附录 C 是证据对照，附录 D 汇总版本变化 | v0.8.3 |
| [AGENT_INTERNALS_ANALYSIS.md](./AGENT_INTERNALS_ANALYSIS.md) | 写给工程师的证据文档。第 1 至 13 节各讲一个子系统：端到端路径、系统提示装配、引擎、自操作工具、事件日志、网关与控制面、Drain 与 turn 控制、会话 actor 与并发池、渠道适配器、job 调度、心跳与后台分区、记忆系统、指令指纹与改动生效；第 14 节汇总未证实与待实测的项；附录 B 列出落库事件类型、控制面 RPC 方法与只读 TCP 端口放行的方法 | v0.8.3 |
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | 部署与运维：分发形态；安装与首次配置（认证来源、引擎选择、环境变量与配置文件的位置）；内核目录 `~/aladuo` 与运行时目录 `~/.aladuo` 的内容、三种锁与配置生效时机；控制面的只读 TCP 端口、全权 unix socket 与可选的远程监听；日常运维命令；渠道适配器的安装与运维；本机部署的实测记录；运维风险 | §1–§6 与 §8 对齐 v0.8.3；§7 的实测记录逐条注明测量时的版本（v0.6.1 或 v0.7.1），未在 v0.8.3 上重测 |
| [AGENT_FRAMEWORKS_COMPARISON.md](./AGENT_FRAMEWORKS_COMPARISON.md) | duoduo、hermes-agent、pi 三个框架的设计哲学、十个维度的横向对比与优劣总评，以及面向"充分运用贝叶斯第一性原理、可持续自我迭代、擅长 long-horizon 金融预测任务的 agent"的融合架构建议与落地路线 | 关于 duoduo 机制的陈述（速览表的 duoduo 列、§1、§4 与 §5 的 duoduo 部分、§6 对 duoduo 机制的引用）对齐 v0.8.3，已对照还原源码与出厂分区提示词核实；标"实测"的 duoduo 运行行为来自早期版本的部署，未在 v0.8.3 上重测；hermes-agent 与 pi 的事实来自调研时的源码快照（见其附录），未随两者的上游更新 |
| [SOURCE_RECONSTRUCTION.md](./SOURCE_RECONSTRUCTION.md) | 还原方法：排版与拆包不改变语义；导出名从 esbuild 的 `__export` 块读出，推断名逐个登记并在每次构建时核对；改名按作用域进行并由 AST 全等证明；上游升级时按结构签名迁移推断名；文档引用按符号身份核对。末尾有产物地图 | 不绑定版本；产物对应的版本、各项计数与每道检查的结论以 [`reconstruction/maps/pipeline_report.json`](../reconstruction/maps/pipeline_report.json) 为准 |

## 维护约定

维护本目录的文档时遵守五条约定：内容只写对齐版本的现状，每条机制主张标置信；代码引用只用两种不带行号、由构建核对的写法；引用没有真名的代码之前，先用 `name_symbol.mjs` 给它登记名字；行号只减不增，每份文档的行号数有只能下调的上限；每次改动后运行引用检查，上游发版时按固定顺序更新引用。下面逐条说明。

### 内容只写对齐版本的现状

每条机制主张标 `confirmed`（对照对齐版本的代码或包内提示词原文确认过）或 `未证实推测`（同时写明缺什么证据），不把推断写成事实。结论被更正时，直接把原文改成最新的已核实结论，不写勘误说明、删除线或修订记录，旧措辞留在 git 历史里；描述版本之间变化的文字只写在 GUIDE 附录 D。文档结论先行：每篇、每节、每小节的第一句是该层的结论，同一层的各项互不重叠、合起来不遗漏。

流水线的计数（导出块数、真名数、改名条目数、AST 节点数）不抄进正文，一律引用 [`reconstruction/maps/pipeline_report.json`](../reconstruction/maps/pipeline_report.json)，因为它每次构建都重新生成，而手抄的数字不会跟着更新；运行时自身的参数（默认值、上限、超时）则写出数值并给出代码证据。GUIDE 不含任何代码引用（行号、短名、函数名、代码片段），它的可信度来自附录 C 的证据对照；上游改了某个机制时，改 GUIDE 的正文和附录 D，不给它加代码引用。

### 两种引用写法

代码引用只有两种写法，都不带行号，都由构建检查；写法的唯一定义在 `reconstruction/tools/anchor_forms.mjs`。

| 写法 | 表示什么 | 检查工具 | 构建失败的条件 |
|---|---|---|---|
| `` `真名 (短名)` ``，例如 `atomicAppendEvent (on)` | 指向一个符号。真名来自 esbuild 的 `__export` 表，或是登记在 `reconstruction/maps/inferred_daemon.json` 里的推断名，跨版本不变；短名是美化后 bundle（`daemon.pretty.js`、`cli.pretty.js`）里的 mangled 名，保留它是为了方便在 bundle 里搜索 | `verify_citations.mjs` | 真名不在任何符号索引里（被上游删除或改名，或者只在正文里起了名、没有登记）；短名不是该符号当前的短名 |
| `` `代码片段`（`真名`） ``，例如 `stage: "runtime_mismatch"`（`drainSessionMailbox`） | 这句代码就是证据。片段里的标识符按美化后 bundle 的拼写写，即写短名 | `check_bare_anchors.mjs` | 真名不在符号索引里；片段中没有任何有辨识度的 token（至少 2 个字符的字符串字面量，或至少 3 个字符的非关键字标识符）落在该符号当前的声明范围内；片段调用的某个短名、写出的某个数字不在这个范围内 |

`verify_citations.mjs` 对第一种写法的检查不依赖它出现在哪里：正文、表格和围栏里的图都会被读到，带不带行号都一样。真名在所有符号索引里都找不到时，只要它的拼写像真名（至少 8 个字符，lowerCamelCase、UPPER_SNAKE 或多段 PascalCase），括号里又是短名形状的标识符，构建就失败；这两个条件是为了让正文里普通的"词 (词)"不被误报。

斜杠简写 `真名/短名` 与第一种写法表达同一个主张，`verify_citations.mjs` 也检查它，但不建议写。正文里的 `a/b` 也表示"a 或 b"，所以检查器只在斜杠右边的部分形如短名时才把它读成引用；真名已经消失、而右边恰好是一个全小写的短词时，这处斜杠引用会被当作普通文字跳过，同样的内容写成 `真名 (短名)` 则会让构建失败。括号形式没有这层歧义：真名的拼写像真名、括号里是短名形状的标识符时，它总会被当作引用检查。

另外四条写法规则：

- **cli bundle 的符号写 `cli:` 前缀**：`cli:真名 (短名)`，`代码片段`（`cli:真名`）。片段写法不写前缀时一律按 daemon 查找；括号写法对 cli 独有的真名不要求前缀，但两个 bundle 都有的真名不写前缀即指 daemon，统一写前缀最不容易出错。
- **片段优先引用字符串字面量。** 字符串字面量跨版本基本不变；片段里写的 mangled 标识符在发版后通常会变，变了之后 `check_bare_anchors.mjs` 判这条片段不成立，需要手工修改。
- **`pi-worker.js` 与 `feishu-gateway.js` 不在还原流水线的范围内，没有真名。** 从中引用的字符串字面量写成普通引号文字，并注明"（pi-worker.js 字面量）"或"（feishu-gateway.js 字面量）"，不写成片段写法，也不带行号。
- **不写裸短名。** 只写一个 `短名` 的引用不能被任何检查核对，下一版里它可能属于另一段代码。

### 引用没有真名的代码之前先命名

esbuild 只为模块导出的符号留下原名，很多函数、模块初始化器和常量没有真名。要引用其中一个时，先用 `reconstruction/tools/name_symbol.mjs` 给它登记一个推断名，再按 `真名 (短名)` 或片段写法引用。只在正文里起一个名字而不登记同样不行：没有检查能发现这个名字在还原源码里并不存在。

`name_symbol.mjs` 在写入任何文件之前做完全部检查，一批名字要么全部写入、要么全部拒绝。它确认：给它的 bundle 正是 `reconstruction/maps/` 描述的版本；短名是可以命名的顶层声明（函数、esbuild 的 `__esm` 模块初始化器，或只由字面量组成的常量）；这个短名还没有名字；它属于 duoduo 自己的代码，而不是随包的第三方库；名字的拼写与种类相符（函数用 lowerCamelCase，模块初始化器用 `init<名字>Module`，常量用带下划线的 UPPER_SNAKE，都至少 8 个字符，并且不与 bundle 里的任何变量名、也不与任何 bundle 的已有真名重复）；所属子系统是 `first-party/` 已有的目录之一。通过后它写入 `inferred_daemon.json`、`subsys_daemon.json`，并只为新名字在 `inferred_daemon.shape.json` 里加基线条目；归属没有代码证据、由人读过函数体后用 `--allow-unproven` 断言的名字，另记入 `inferred_daemon.asserted.json`。名字在下一次运行 `rebuild.sh` 时进入还原源码、`first-party/` 和符号索引，复核后用 `PROMOTE=1` 写入仓库；引用检查按符号索引核对，所以新名字要在这之后才能被引用。

运行时的默认值常量通常在 esbuild 的模块初始化器里赋值。这时给初始化器命名，再用片段写法引用赋值语句，例如 Notify 拒投阈值的环境变量名与默认值：`BV = "ALADUO_NOTIFY_UNCONSUMED_HOURS", R$ = 1`（`initNotifyConsumerStalenessModule`）。

两种情况给不了代码引用。cli bundle 没有推断名映射，`name_symbol.mjs` 只处理 daemon，所以 cli 里没有真名的函数只引用它打印的字符串，不给代码引用。一个无法命名的短名，如果包含它的已命名函数里有一句代码能证明主张，就用那句代码作片段引用；连这样的函数也没有时，不给代码引用，把主张降为 `未证实推测` 或删去。

### 行号只减不增

行号不是能跨版本成立的证据：esbuild 每次构建都重新分配短名，格式化器重新断行，大部分行号每个版本都会移动，有些无法迁移，只能删除；真名跨版本不变，符号在哪一行由 `reconstruction/maps/symbols_*.json` 给出，正文不需要重复。因此不写任何新的行号。

`reconstruction/maps/bare_anchor_baseline.json` 给每份文档记两个上限：`lineNumbers` 是任何形状的行号总数，`unbound` 是三种带行号的旧写法之外、没有检查能核对的行号数，保持为 0。`check_bare_anchors.mjs` 在任一数量超过上限时让构建失败，所以新增一个行号，即使写法正确，也会失败；新加入 `docs/` 的文档上限从 0 开始。删掉行号之后，在同一次提交里用 `check_bare_anchors.mjs` 的 `--baseline reconstruction/maps/bare_anchor_baseline.json --write-baseline` 下调上限；这个选项拒绝上调上限，`--allow-raise` 能越过这项拒绝，但不用来给新写的行号腾出位置。三种带行号的旧写法（`真名 (短名)` 后接行号、`短名` 后接行号、`代码片段` 后接行号）在删除之前仍被逐条检查。一条引用的证据找不到时直接删除它；主张没有其他证据支撑时，降为 `未证实推测`。

### 检查与发版后的更新

每次改动文档后运行引用检查。完整的检查是 `reconstruction/tools/rebuild.sh`：它检查 `docs/` 下的全部文档，CI 的 `.github/workflows/verify.yml` 在每个 PR 和每次推送到 `main` 时运行它，不带 `PROMOTE=1` 时不写入仓库；运行方法见 [`../CLAUDE.md`](../CLAUDE.md)。只改了文档时，可以单独运行两个检查器，美化后的 bundle 由一次 `rebuild.sh` 生成在 `reconstruction/.build/beautified/<版本>/`：

```bash
B=reconstruction/.build/beautified/<版本>
M=reconstruction/maps
node reconstruction/tools/verify_citations.mjs $M/symbols_daemon.json,$M/symbols_cli.json \
  --bundle daemon=$B/daemon.pretty.js --bundle cli=$B/cli.pretty.js docs/*.md
node reconstruction/tools/check_bare_anchors.mjs --index $M/symbols_daemon.json,$M/symbols_cli.json \
  --bundle cli=$B/cli.pretty.js --baseline $M/bare_anchor_baseline.json \
  $B/daemon.pretty.js $M/blocks_daemon.json $M/modules_daemon.json docs/*.md
```

上游发布新版本时，先按 [`../CLAUDE.md`](../CLAUDE.md) 与 SOURCE_RECONSTRUCTION 中"跟随上游升级"一节规定的顺序运行 `bump.sh` 迁移推断名，再运行 `rebuild.sh`。文档引用不带行号，发版后机械性的更新只有两项：`retarget_symbols.mjs` 按新旧两版的改名表一次性替换 `真名 (短名)` 里的短名；片段里写的 mangled 标识符不会被自动替换，由 `check_bare_anchors.mjs` 报为不成立，要手工改成新的短名，或改为引用字符串字面量。除此之外，真名消失或片段不再成立的引用会被检查报出，要对照新版代码重新核对它支撑的主张。文档对准的版本记在 `docs/.pretty-anchor-target`，构建检查它与 `pipeline_report.json` 的 `package` 字段一致，只在升级进行中、文档已对准新版本而 `maps/` 尚未提升时例外；`PROMOTE=1` 要求它已经写成新版本，由 `retarget_docs.mjs apply --stamp <版本>` 写入。
