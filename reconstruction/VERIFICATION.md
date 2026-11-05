# 还原正确性验证记录（Verification Log）

目标命题：**还原产物（提交的 `recon/daemon.recon.js`，以及 `rebuild.sh` 生成在 `$OUT` 下的 `cli.recon.js`）与出厂 `dist/release/` 下的同名 bundle 是同一个程序，能同样运行。**

命题的静态部分在已提交报告记录的版本（报告的 `package` 字段）上成立，而且不是一次性结论：每次 `tools/rebuild.sh` 运行都从出厂包重新证明一遍。已提交的 [`maps/pipeline_report.json`](./maps/pipeline_report.json) 由一次带 `PKG` 的 `PROMOTE=1` 运行写入，每个证明类 verdict 都是 `pass`，并记录了出厂与美化 bundle 的 sha256；CI 在每个 PR 上用报告记录的版本重跑全部检查。命题的运行部分（第 4 节）不随每次运行重做：在 v0.8.3 上用提交 `221811b` 的还原产物做过一次启动对照，覆盖启动、控制面读接口、生成的 HOME 文件树与 SIGTERM 退出；覆盖面更大的一次 A/B 对照是在 v0.8.2 上做的；v0.8.4 上另有 11 个运行场景（`scenarios/findings/`）。本文不复述流水线计数，计数以报告为准；各项检查的机制说明见 [README.md](./README.md)，本文只记录它们证明了什么、证据在哪里。

九项证据按节编号，分工如下。第 1–3 节证明变换链不改程序，第 4 节是实机运行，第 5 节覆盖跨版本重定向，第 6、7 节覆盖人读的东西（可读树与文档引用，它们出错时前几节的证据照样全部通过），第 8 节反过来检验检查器本身，第 9 节把"`$OUT` 里的结论"变成"仓库里文件的结论"。

| 节 | 证明什么 | 何时取得 | 记录在 |
|------|----------|----------|--------|
| 1 无损拆包 | 模块边界从真实结构切出，拆分没有信息损失 | 每次运行 | verdict `<bundle>.lossless` |
| 2 名字与归属 | 真名来自 esbuild 导出结构，归属按模块判定，推断名登记在正确的声明上 | 每次运行 | 模块归属检查（失败即停止构建）；verdict `<bundle>.inferredNames` |
| 3 语义全等 | 出厂压缩文件 ≡ 美化文件 ≡ 还原产物（模改名表与局部名字列表） | 每次运行 | verdict `<bundle>.beautifyEquivalent`、`daemon.localNames`、`<bundle>.syntax`、`<bundle>.astEquivalent` |
| 4 实机运行 | 还原 daemon 与 cli 的运行效果与出厂版相同 | 人工 A/B 对照，不随每次运行重做 | 本文 |
| 5 跨版本重定向 | 升级时推断名按结构签名迁移，承接不了的全部显式报出；改动的代码与引用它的文档位置全部列出 | 升级时运行 `bump.sh`；改任何升级工具前后用 `replay_bump.sh` 在四对相邻发行版上回放并打分（5.1 节的基线） | 本文；README.md |
| 6 可读树 | `first-party/` 与 bundle、改名表、推断名表、子系统映射一致 | 每次运行 | verdict `firstPartyTree` |
| 7 文档引用 | 文档里每一处代码引用指向它声称的符号或代码 | 每次运行 | verdict `citations`、`lineAnchors` |
| 8 检查器变异测试 | 各检查器能报出注入的已知错误 | 每次运行，另有一次性故障注入 | verdict `anchorCheckers`；本文 |
| 9 提交产物绑定出厂字节 | 仓库里的产物就是对应出厂字节生成的产物，文档与 `maps/` 描述同一版本 | 每次运行 | verdict `committedInSync`、`anchorTargetMatches`；报告的 `sha256` |

---

## 1 无损拆包：拼接可字节还原

每次运行都成立（verdict `<bundle>.lossless`，已提交报告中 daemon、cli 均为 `pass`）。`split.mjs` 按顶层语句的字节偏移把美化后的 bundle 切成模块文件与 shell 片段，`reassemble.mjs` 按 manifest 拼回，与原文件 `cmp` 逐字节相同。运行日志里对应的行是 `lossless: OK (byte-identical)`。

切片是连续的字节区间，这项证明能失败的途径主要是写文件。压缩标识符常常只差大小写，片段文件按标识符命名；在大小写不敏感的文件系统（macOS、Windows）上，后写的文件会覆盖前一个，模块树内容错乱，字节还原比对随之失败。片段文件名因此做成大小写不敏感唯一，拆分目录在每次运行前清空，避免上一个版本残留的片段混进比对。

## 2 名字与归属：来自 esbuild 的导出结构

**真名取自 bundle 本身。** esbuild 压缩后仍保留 `__export(exports, { 原名: () => 短名 })` 调用。它只为运行时需要导出对象的模块生成这种调用（典型是被动态 `import()` 的模块），所以大多数模块没有导出块，但一个块总是恰好对应一个源模块；bundle 顶层的 `export {}` 另外记录入口导出。恢复出的名字数、按模块分组后的自研名字数、入口导出数、推断名数和改名条目数，分别见报告 `bundles.<bundle>` 下的 `namesInBlocks`、`firstPartyNamesFromBlocks`、`namesFromEntryExports`、`inferredNames`、`renameEntries`。

**归属按模块判定。** `build_rename.mjs` 用 `maps/modules_<bundle>.json` 逐块判定自研还是第三方；匹配不上任何记录的块让构建失败，并列出该块全部导出名。这项检查没有单独的 verdict：它失败时构建直接停止，报告不会生成。按名字判定归属时，一个被误记为第三方的名字此后永远不会再被检查；按模块判定时，新版本带来的是一个需要判定的模块，而模块的身份不依赖名字长什么样（整个 Grok 模块只导出 `GROK_ACP_*` 常量）。

**推断名登记在正确的声明上。** 没有导出的内部符号用人工推断的名字（`maps/inferred_daemon.json`）。改名是作用域安全的，名字登记到错误的声明上时 AST 等价照样成立、daemon 照样启动，所以 `verify_inferred.mjs` 在每次运行里检查每个推断名的种类与拼写、与形态基线（`maps/inferred_daemon.shape.json`）的差异，以及推断名之间是否被互换（规则见 README.md）。已提交报告里 `daemon.inferredNames` 与 `cli.inferredNames` 都为 `pass`：没有被推翻的名字，也没有需要人工复核的告警。cli 的推断名记在 `maps/inferred_cli.json`，用自己的形态基线按同样的规则检查。模块初始化器与常量两种种类的规则由变异测试覆盖（第 8.1 节），不依赖映射里是否已经有这两种名字。

## 3 语义全等：出厂 ≡ 美化 ≡ 还原

每个 bundle 在每次带 `PKG` 的运行里做两次 AST 等价证明，已提交报告中 daemon、cli 的这些 verdict 都是 `pass`：

1. **出厂 ≡ 美化**（`<bundle>.beautifyEquivalent`）：`ast_equiv.mjs` 比对出厂压缩文件与锁定版本 js-beautify 的输出。没有这一步，后面的证明全部从一个不随包发布的文件开始。
2. **美化 ≡ 还原**（`<bundle>.astEquivalent`）：`ast_equiv.mjs` 并行遍历两棵 AST，每个节点类型与字面量必须相同；标识符按它解析到的绑定比较，两边的声明必须一一对应，全局名保持同名全局，只有改名表列出的顶层绑定和 `locals_daemon.applied.json` 列出的局部绑定（`--locals`）可以换名，并且只能换成列出的名字。局部名字列表由 `name_locals.mjs apply` 写出；它的条目有找不到绑定的时，`daemon.localNames` 记为 `warn`，promote 拒绝。另用 `node --input-type=module --check` 按 ESM 解析还原产物（`<bundle>.syntax`）。

这是覆盖 100% 代码的静态证明，比只跑到启动路径的实机运行更强。比较过的节点数打印在运行日志的 `nodes compared` 行，不进入报告。两处不覆盖的行为：读取函数自身名字的代码（`Function.prototype.name`、类的 `constructor.name`、调用栈文本）在还原版里看到的是真名；内联的 gray-matter 有一处 direct `eval()`（运行日志里的 `note: 1 direct eval() call(s)`），被 eval 的代码按名字看得到模块作用域。duoduo 自研代码不读取被改名函数的名字，控制流不受影响。

## 4 实机运行

在 v0.8.3 上，提交 `221811b` 的还原 daemon 与出厂 daemon 在启动、控制面读接口、生成的 HOME 文件树和 SIGTERM 退出上表现一致；覆盖面更大的一次对照（含 cli）在 v0.8.2 上做过；需要真实模型调用的路径没有做过实机对照。

v0.8.3 的对照于 2026-09-24 用 Node v22.23.3 在 macOS 上完成。还原产物是提交 `221811b` 的 `recon/daemon.recon.js`，它的改名条目数见该提交的 `maps/pipeline_report.json`。把它与出厂 `daemon.js` 放进同一个 v0.8.3 包目录，两边各用一个新建的隔离 HOME，依次以同一个备用端口 20353、host 模式、`claude_code_local` 认证与 `info` 日志级别启动，等启动日志的最后一行出现后探测，再用 SIGTERM 停止。实机对照观察的是一个具体的文件，所以这里写明它来自哪个提交；此后对还原产物的改动如果只是新增推断名，改变的只有名字，第 3 节的 AST 等价证明照样覆盖它们（读取函数自身名字的代码除外，见第 3 节）。结果如下：

- 只读 TCP 上的 `system.status`、写方法 `session.send` 与 `session.list`，以及 unix socket 上的 `session.list` 与 `system.status`：五个返回两边逐字节相同，不需要遮盖任何字段。两个写方法在 TCP 上都得到 JSON-RPC `-32601`（"Method not available on read-only endpoint"）。
- socket 文件权限 0600，所在的 run 目录 0700，两边相同。
- 启动与停止日志两边各 27 行，遮掉时间戳、pid 与 HOME 路径后逐行相同，没有 ERROR 行。
- 停止后的 HOME 文件树两边相同：逐项比较路径与权限位；`.git` 以外的文件再比较遮掉 HOME 路径、时间戳与 pid 后的内容；`aladuo/.git/objects` 的对象名随提交时间变化，只比较数量。
- 两边都在 SIGTERM 后约 20 毫秒内以退出码 0 结束。

下面是还原版的探测记录，出厂版的五个返回与它逐字节相同。它在实机上复现了静态分析的结论：TCP 端口只接受只读方法，完整控制面在 unix socket 上。

```
# 只读 TCP：POST http://127.0.0.1:20353/rpc（Content-Type: application/json）
system.status → {"jsonrpc":"2.0","id":1,"result":{"health":{...},"cadence":{...},"sessions":[],"subconscious":{...},"memory_check":{...}}}
session.send  → {"jsonrpc":"2.0","id":2,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}
session.list  → {"jsonrpc":"2.0","id":3,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}

# 完整控制面：POST http://localhost/rpc，经 unix socket <HOME>/.aladuo/run/daemon.sock（0600，run 目录 0700）
session.list  → {"jsonrpc":"2.0","id":4,"result":[]}
system.status → 除 id 外与 TCP 上的返回相同
```

daemon 日志同时记录 `[WARN] [daemon] rejected write method on read-only port { method: 'session.send', id: 2 }`，`session.list` 另有一条同样的记录；收到 SIGTERM 后各组件逐一 `stopped`，以 `[pid0] shutdown complete` 结束。

覆盖面更大的一次 A/B 对照在 v0.8.2 上做，还原产物与出厂产物都是那个版本的，两边放在各自隔离的 HOME 与备用端口下运行：

- **daemon**：4 个实例，约 13 分钟。启动日志、生成的 HOME 文件树、只读 TCP 接口、unix socket 上的 26 个读类 RPC、60 秒周期的 cadence、SIGTERM 与 SIGKILL 之后的恢复行为，两边一致。
- **cli**：133 组调用的 stdout、stderr 与退出码逐字节一致。

没有覆盖的路径：用户会话 actor 与 channel ingress 的 WAL 回放、job 调度、codex/grok/pi 适配器（这些需要真实的模型调用），以及默认 37 分钟 cadence 下的长时间运行。它们目前只有 AST 等价作为证据。

## 5 跨版本重定向

推断名表以短名为键，而 esbuild 每次构建都重新分配短名，同一个短名在下一个版本里可以是完全不同的函数；直接沿用旧表不会报错，只会把名字登记到错误的函数上。`tools/bump.sh` 按结构指纹承接推断名，承接不了的报 `RE-ANCHOR`，交给人用字符串锚点重新定位，再由第 2 节的推断名检查核对。

2026-09 的 `bump.sh` 在 v0.8.2→v0.8.3 上完整回放过（`maps/` 取自 v0.8.2 的提交，两侧都是 npm registry 的出厂包，Node 22，`/bin/bash` 3.2），结果如下：

- 以 exit 0 结束，用时约 40 s，其中美化两侧约占一半；
- 给出 v0.8.3 的美化文件与 `PKG_NEW` 时，`ast_equiv.mjs` 证明前者就是后者的美化结果；
- `bundle_guard.mjs` 确认 OLD 就是这份 `maps/` 描述的版本；
- 推断名除 `drainSessionMailbox` 外全部按结构指纹自动承接；它被列为 `RE-ANCHOR pending`，子系统条目保留，没有被误列为"上游已删除"，`impact.md` 给出的候选声明正是它在 v0.8.3 的位置；
- 可读 diff 在两侧使用同一套名字：新短名不再带着旧版本里同一拼写的含义。结构指纹覆盖不到的顶层名字有 1504 个（daemon）与 351 个（cli）通过引用它们的未变声明对齐。参与比对的约 2530 个 daemon 顶层声明里 14 个有变化，整理成 12 份 diff；显示为变化的行从位置归一化形式的 4210 行降到 314 行、50 处，cli 从 29 行降到 4 行、2 处。`drainSessionMailbox` 的 diff 共 61 行变化、6 处，正好是新增的 `runtime_mismatch` 拒绝分支、被移到拒绝检查之后的 fork 处理和 `sdk_session_runtime` 的写入；
- 明文变化：出厂包里 bundle 以外 3 个文件（`bootstrap/config/runtime.md` 的推理力度多了 `max`、`dashboard.html`、`package.json`），上游仓库两个标签之间 15 个文件（CHANGELOG 与 skills/），各自附文档中提到它们的位置；
- 影响清单：文档（`docs/*.md` 与 `CLAUDE.md`）里 2746 处按名字的代码引用中，664 处指向改动的声明，分为重读 69、核对 70、略读 525。第 1 档的 69 处是 10 个声明里的 50 个不同片段，逐个查看了它们匹配到的 v0.8.3 代码行：49 个就在改动的行上（新增的 `runtime_mismatch` 拒绝分支、ManageJob 的新限制与提示文字、`sdk_session_runtime` 字段、重写的引擎不可用提示等），1 个在一处插入点的相邻行上。这组数字的新版本一侧名字取自已提交的 v0.8.3 改名表：现在的文档引用了本仓库在 v0.8.3 才命名的符号，v0.8.2 的映射里没有它们；下一次升级时，文档引用的名字都在旧映射里，不需要这样替换；
- 模拟升级进行到一半的状态（v0.8.2 的映射，推断表已换成承接后按 v0.8.3 短名作键的表）：`bump.sh` 第 0 步的 `verify_inferred.mjs check` 对照 OLD 报出 19 个名字不成立，拒绝运行并给出恢复命令；用原来的 v0.8.2 映射时这一步通过。同一状态下对 v0.8.3 做一次 check 模式运行后，`name_symbol.mjs` 不加 `--build` 时拒绝 v0.8.3 的 bundle（`maps/symbols_daemon.json` 仍是 v0.8.2），加 `--build <该次运行的 OUT>` 后能登记 `renderRuntimeUnavailableGuidance`；
- 从 `maps/modules_daemon.json` 删掉一条自研模块记录后，其余结果照常产出，最后以 exit 1 结束；
- `PKG_OLD` 与 `PKG_NEW` 取同一个包时，两侧都报 unchanged，美化输出与锁定版本的美化文件逐字节相同。

`doc_sections.mjs` 对 `docs/*.md` 与 `CLAUDE.md` 拆分后立即拼回，与原文逐字节相同；拼回时拒绝拆分后被直接改过的文档。`upgrade-docs` workflow 只用模拟的 agent 跑过控制流（从 `impact.json` 加载分组、把 survey 指定的新节分给负载最轻的组、只在核验报出问题时运行修正、汇总待登记的名字），还没有在一次真实升级上运行过。

这次回放之后 `bump.sh` 又加入了几个步骤：按顺序对齐全部顶层语句承接孪生推断名（`align_releases.mjs`），第 2c 档与第 4 档影响清单，其余四个 bundle 的字面量差异（`bundle_literals.mjs`），模块归属检查失败时的证据（`module_owner_hint.mjs`），以及 RE-ANCHOR 候选的证人核对（`confirm_reanchor.mjs`）。它们各自的回放记录在 README.md「已实现」表里；5.1 节的回放基线把它们放进同一次完整的 `bump.sh` 运行里重新计量，结果与各自的记录一致。

已提交的映射不依赖这些回放：它们的正确性由对齐版本上第 2、6、7 节的证据成立（推断名检查、可读树与引用检查全部 `pass`）。

### 5.1 升级回放基线（`replay_bump.sh`、`replay_score.mjs`）

结论：在 v0.8.3→v0.8.4、v0.8.4→v0.8.5、v0.8.5→v0.8.6、v0.8.6→v0.8.7 四对相邻发行版上，`bump.sh` 自动承接的推断名没有一个落到与人工复核结果不同的声明上（`carried-wrong` 全部为 0）；人工重定位过的 63 个名字里，自动给出的候选有 62 个与人工一致，唯一不一致的是 v0.8.3→v0.8.4 的 `isSupportedRuntime`（三个函数体相同的孪生体，按位置配对选错，与 README.md「已实现」表记录的相同）；没有一个名字落入 `unresolved`。改任何升级工具之前先跑这四对，改完再跑，以下表为基线。

测什么。`tools/replay_bump.sh <vOLD> <vNEW>` 以 OLD 版本提交的 `reconstruction/maps/` 为输入（`MAPS=`），以 OLD 版本提交的 `docs/` 为影响清单的输入（`DOCS=`），对两个出厂包运行 `bump.sh`；再对每个 bundle 运行不带 `--write`、不带 `--accept` 的 `confirm_reanchor.mjs --json`，得到证人核实的集合；最后由 `replay_score.mjs` 把产出与 NEW 版本提交的 `maps/inferred_<bundle>.json`（人工复核后的结果，作为真值）按真名逐个比较，写出 `score.json`（每个名字的判定）与 `score.md`。某个发行版的提交记录不在 fixture 里时，它从 `origin/main` 上最后一个 `docs/.pretty-anchor-target` 与 `maps/pipeline_report.json` 都记录该版本的提交导出（v0.8.3 到 v0.8.7 的导出与 fixture 逐字节相同）；出厂包缺少时用 `npm install --ignore-scripts` 装进 fixture。每个旧推断名得到一个判定：`carried-correct`/`carried-wrong`，按结构指纹或语句对齐承接到的声明与真值相同/不同；`confirmed-correct`/`confirmed-wrong`，没有承接，证人核实的候选与真值相同/不同（`--write` 不加 `--accept` 写入的正是这些）；`proposed-correct`/`proposed-wrong`，没有承接也没有核实，给复核人看的候选（配对建议，没有建议时取打分第一名）与真值相同/不同；`unresolved`，真值里有这个名字，但没有任何候选；`gone`，真值里没有这个名字（上游删了代码，或复核时去掉了名字、改了拼写），其中承接到的声明在真值里有另一个拼写的另计为 respelled。NEW 有而 OLD 没有的名字记为 `truth-only`，只计数。对人工重定位过的名字另外统计 `anchor_candidates.mjs` 的排序里真值声明排第一、进前三的个数，以及第一名领先第二名的平均分差。

2026-11-05 的基线（Node 22，fixture 为 `.build/replay/`，每对 `bump.sh` 用时 53 到 97 s）：

| 版本对 | bundle | 旧名 | carried 对/错 | confirmed 对/错 | proposed 对/错 | unresolved | gone | truth-only | 排序第一 / 前三 | 平均分差 | `bump.sh` |
|---|---|---|---|---|---|---|---|---|---|---|---|
| v0.8.3→v0.8.4 | daemon | 489 | 454 / 0 | 18 / 0 | 11 / 1 | 0 | 5（4 respelled） | 244 | 29 / 30（共 30） | 2.452 | exit 0 |
| v0.8.3→v0.8.4 | cli | – | – | – | – | – | – | 15 | – | – | OLD 没有 `inferred_cli.json` |
| v0.8.4→v0.8.5 | daemon | 728 | 728 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | 5 | –（无重定位） | – | exit 0 |
| v0.8.4→v0.8.5 | cli | 15 | 15 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | 0 | – | – | bundle 逐字节相同，旧表原样保留 |
| v0.8.5→v0.8.6 | daemon | 733 | 733 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | 0 | –（无重定位） | – | exit 1（NEW 的模块归属检查失败，预期） |
| v0.8.5→v0.8.6 | cli | 15 | 15 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | 0 | – | – | bundle 逐字节相同，旧表原样保留 |
| v0.8.6→v0.8.7 | daemon | 733 | 701 / 0 | 18 / 0 | 13 / 0 | 0 | 1（1 respelled） | 41 | 31 / 31（共 31） | 2.417 | exit 0 |
| v0.8.6→v0.8.7 | cli | 15 | 12 / 0 | 2 / 0 | 0 / 0 | 0 | 1 | 4 | 2 / 2（共 2） | 2.357 | exit 0 |

`gone` 的名字逐个核对过，没有一个是工具的错误：v0.8.3→v0.8.4 的 4 个 respelled（`isDaemonRuntimeInfo`、`isRuntimeKind`、`resolveRegistryStatusPath`、`updateRegistryStatus`）承接到的声明在 v0.8.4 的真值里分别叫 `isSystemRuntimeInfo`、`isModelRuntime`、`statusPath`、`updateStatus`，是复核时改用上游拼写；`IDLE_COMPACT_FIRE_CAP_PER_SWEEP` 证人核实了候选，但 v0.8.4 的真值没有保留这个名字；v0.8.6→v0.8.7 的 `classifySessionKeyKind` 在真值里叫 `classifySessionKey`；cli 的 `CLI_DAEMON_TOKEN_ENV_KEY` 报为"常量挪进模块初始化器"，真值正是去掉了它。v0.8.5→v0.8.6 的 `bump.sh` 以 exit 1 结束是 NEW 的模块归属检查对 OLD 的 `modules_daemon.json` 失败，承接、配对与核实的产出照常存在，回放照常打分。

什么算退步：同一对版本上，`carried-wrong` 不为 0；任何 `*-wrong` 或 `unresolved` 比基线多，或任何 `*-correct` 比基线少；排序里真值排第一的个数比基线少；某一对在 `bump.sh` 第 0 步被拒绝（`refused.txt`）。`gone` 与 `truth-only` 的数目不是分数，`gone` 的名字变了才需要解释；候选的平均分差只供参考。每次运行的 `score.json` 留在 `.build/replay/runs/<vOLD>__<vNEW>/` 下，不进仓库，基线只记在本节。

### 5.2 RE-ANCHOR 候选打分的传播、稀有度加权与接受阈值（`anchor_candidates.mjs`）

结论：候选打分改为"调用方、被调用方、字符串三类特征按稀有度加权，已接受的配对沿调用图迭代传播，双阈值接受否则弃权"（`docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md` 第 8 节建议 2 与建议 3 的前半）之后，在 5.1 节的四对发行版上，人工重定位过的 63 个名字真值全部排第一（改前 62 个），默认阈值（`ABS` 0.45、`REL` 0.15）接受 61 个、无一错误、弃权 2 个（两个都把真值排在第一）；`bump.sh` 承接的名字仍然没有一个 `carried-wrong`，v0.8.3→v0.8.4 唯一的 `proposed-wrong`（三个孪生体之一的 `isSupportedRuntime`）改为正确。

改了什么。每个候选对旧声明算三类重合度：调用方（引用它的顶层声明）、被调用方（它引用的顶层声明）、4 个字符以上的字符串字面量；引用取 Babel 的 ReferencedIdentifier 并解析到程序作用域：改前遍历全部 Identifier 节点的做法把模块初始化器里对顶层 `var` 的赋值（`AssignmentExpression.left`）也算作引用，v0.8.4 的 daemon 上这样多算 721 个（声明，名字）对，来自 1187 处赋值；两种遍历的差别只有这一类。esbuild 在 v0.8.3 到 v0.8.7 的 daemon 与 cli 里没有给任何嵌套绑定起与顶层声明相同的名字（嵌套绑定同名 0 个，与顶层声明同名的 ReferencedIdentifier 全部解析到程序作用域：v0.8.3 daemon 12660/12660，v0.8.7 daemon 13307/13307，v0.8.7 cli 4610/4610），所以作用域解析在这几个版本上没有排除任何被遮蔽的引用。每个特征按它在所在 bundle 里的稀有度加权，w = ln(N / df)，N 是顶层声明数，df 是引用该符号的声明数（被调用方）、该调用方引用的声明数（调用方）或持有该字面量的声明数；每类取加权 Jaccard（共有特征权重和除以并集权重和），三类按 2:1:2 合成，只计两侧至少一侧有特征的类，所以分数在 0 到 1 之间。已接受的配对集合从唯一指纹匹配、锚定的语句对齐（`align_releases.mjs`）和改动声明的位置配对（`pair_changes.mjs`）开始；旧侧引用经它映射到新侧，没有映射的引用是"未知特征"，按 Ghidra 的做法以一半权重留在并集里、不能共有；指纹或对齐说两者可能是同一声明的未知引用（AMBIGUOUS 的孪生体、未锚定的对齐）按 Matcher 的 `checkPotentialEquality` 配成对，计共有特征一半的分。字面量常量把自己的规范值也当作一个字面量特征，同一个函数读取的两个常量按值区分：v0.8.4 里 `IDLE_COMPACT_FIRE_CAP_PER_SWEEP` 的两个候选 `Oct`（值 8）与 `$ct`（值 60000）在两种遍历下调用方都只有 `gwe`，调用方一类完全相同，把它们分开的只有 `=8` 这个值特征，1.00 对 0.50。候选池是指纹给出的候选、位置配对与对齐给出的建议、新版本里没有旧对应的声明，再加经已接受配对到达的邻居（旧调用方的像的被调用方、旧被调用方的像的调用方），限同种类、未被已接受配对占用。每轮给所有未定的名字打分，首位分数至少 `ABS` 且次优低于首位乘以（1 减 `REL`）才接受，同一轮里两个名字选中同一声明则都不接受（多对一）；接受的加入已接受集合、它的目标退出其他名字的候选池，再打分，直到没有新接受（上限 8 轮，四对回放最多用到第 2 轮）。弃权原因写进 `impact.json`（`no candidate`、`score below threshold`、`runner-up too close`、`many-to-one`），连同 `status`、`score`、`margin`、`round`；`impact.md` 按弃权在前列出。`confirm_reanchor.mjs` 把接受的候选当作配对建议：证人照常核对，与证人矛盾的报出不写入，与 `remap_inferred.mjs` 的配对建议不一致时两者都列出。

阈值怎么选。对 5.1 节四对回放的 `bump.sh` 产物（指纹、位置配对、语句对齐、`impact.json` 的 RE-ANCHOR 清单）重跑打分，按 NEW 版本提交的推断表判定，有真值的名字共 63 个（v0.8.3→v0.8.4 daemon 30、v0.8.6→v0.8.7 daemon 31、cli 2；真值里没有的 `gone` 名字不计）。下表每格是"接受且正确 / 接受但错误 / 弃权"，`ABS` 为行、`REL` 为列（2026-11-05，Node 22）：

| ABS \ REL | 0 | 0.05 | 0.085 | 0.1 | 0.15 | 0.2 | 0.25 | 0.3 | 0.4 | 0.5 |
|---|---|---|---|---|---|---|---|---|---|---|
| 0.20 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 61/0/2 | 61/0/2 | 56/0/7 |
| 0.25 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 63/0/0 | 61/0/2 | 61/0/2 | 56/0/7 |
| 0.30 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 60/0/3 | 60/0/3 | 55/0/8 |
| 0.40 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 62/0/1 | 60/0/3 | 60/0/3 | 55/0/8 |
| 0.45 | 61/0/2 | 61/0/2 | 61/0/2 | 61/0/2 | 61/0/2 | 61/0/2 | 61/0/2 | 59/0/4 | 59/0/4 | 54/0/9 |
| 0.50 | 56/0/7 | 56/0/7 | 56/0/7 | 56/0/7 | 56/0/7 | 56/0/7 | 56/0/7 | 54/0/9 | 54/0/9 | 48/0/15 |
| 0.60 | 52/0/11 | 52/0/11 | 52/0/11 | 52/0/11 | 52/0/11 | 52/0/11 | 52/0/11 | 47/0/16 | 45/0/18 | 41/0/22 |
| 0.70 | 50/0/13 | 50/0/13 | 50/0/13 | 50/0/13 | 50/0/13 | 50/0/13 | 50/0/13 | 41/0/22 | 41/0/22 | 38/0/25 |
| 0.85 | 37/0/26 | 37/0/26 | 37/0/26 | 37/0/26 | 37/0/26 | 37/0/26 | 37/0/26 | 33/0/30 | 33/0/30 | 30/0/33 |

改前改后的完整回放（`replay_bump.sh`，2026-11-05，同一 fixture，改前用从 git 导出的原版工具运行；改后一栏是 `ABS` 0.45 的默认值下的最终一次运行）。改前与 5.1 节的基线逐项相同。改后：

| 版本对 | bundle | carried 对/错 | confirmed 对/错 | proposed 对/错 | unresolved | gone | 排序第一 / 前三 | 平均分差 | 打分器接受（正确）/ 弃权 | 轮数 | `bump.sh` |
|---|---|---|---|---|---|---|---|---|---|---|---|
| v0.8.3→v0.8.4 | daemon | 454 / 0 | 18 / 0 | 12 / 0（改前 11 / 1） | 0 | 5（4 respelled） | 30 / 30（共 30，改前 29 / 30） | 0.570 | 29（29）/ 1（`initGapSpanModule`，0.43，真值排第一），另接受 gone 的 `IDLE_COMPACT_FIRE_CAP_PER_SWEEP` 到证人核实的同一声明 | 2 | exit 0，94 s |
| v0.8.4→v0.8.5 | daemon | 728 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | –（无重定位） | – | – | – | exit 0，59 s |
| v0.8.5→v0.8.6 | daemon | 733 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | –（无重定位） | – | – | – | exit 1（模块归属检查，预期），65 s |
| v0.8.6→v0.8.7 | daemon | 701 / 0 | 18 / 0 | 13 / 0 | 0 | 1（1 respelled） | 31 / 31（共 31） | 0.518 | 30（30）/ 1（`isSessionSetAliasParams`，0.28，真值排第一） | 2 | exit 0，124 s（改前 107 s） |
| v0.8.6→v0.8.7 | cli | 12 / 0 | 2 / 0 | 0 / 0 | 0 | 1 | 2 / 2（共 2） | 0.504 | 2（2）/ 0；常量 `CLI_DAEMON_TOKEN_ENV_KEY` 弃权（没有同种类候选得分） | 1 | 同上 |

两个 cli 逐字节相同的版本对与改前一样按旧表原样计分。平均分差的尺度变了：改前的分数在 0 到 5 之间，改后在 0 到 1 之间，两列不可比；`ABS` 0.25 的一次早先运行给 0.567 与 0.503，差别来自第 2 轮传播时已接受集合不同。`impact_report.mjs` 在 v0.8.6→v0.8.7 上从 5.7 s 增加到 18.0 s，多出的是两侧各一次 Babel 作用域解析的遍历。接受的 61 个候选在 `confirm_reanchor.mjs` 里没有一个被证人反驳（弃权的两个都没有证人，`confirm_reanchor.mjs` 报 `read bodies`，和改前一样要读函数体后 `--accept`）；v0.8.3→v0.8.4 的 `isSupportedRuntime` 是打分器接受的候选与配对建议不一致的唯一一例，`reanchor_daemon.md` 把两者都列出，打分器的一侧与真值相同。

没有一格接受错误的候选：63 个名字的真值全部排第一，而次优的分数最高 0.71（v0.8.7 的 `createAladuoMcpServer` 与 `buildCodexDynamicTools` 两个结构相近的函数，首位 0.95），所以这张表只能定 `REL`：`REL` 到 0.30 时少接受的两个就是那对 0.95 对 0.71 的函数，0.15 离这个边缘留有余量。`ABS` 在这张表里只换来弃权（低于 0.30 时多接受的一个是 `isSessionSetAliasParams`，0.28：一个调用方、一个被调用方、一个单词字符串，三行的类型谓词），因为 `ABS` 防的情形不在 fixture 里：旧声明被上游删除，没有真值可排第一，打分器必须弃权。这种情形用模拟测：对每个有真值的名字，把真值声明从所有候选池里排除（`rankAnchors` 的 `exclude` 选项，CLI 的 `--exclude`），其余输入与 `impact_report.mjs` 完全相同（指纹、位置配对、语句对齐、同一候选构造），整个打分器连同传播与多对一照常运行，这时任何接受都是错的。按 `ABS` 列出"真值在场时接受且正确 / 弃权"与"真值被删时错误接受"（63 个名字，`REL` 0.15，2026-11-05）：

| ABS | 真值在场：接受且正确 / 弃权 | 真值被删：错误接受 | 错误接受的名字（分数） |
|---|---|---|---|
| 0.25 | 63 / 0 | 14 | v0.8.3→v0.8.4：`resolveDefaultRuntime` 0.27、`parseChannelConfigFields` 0.40、`mapClaudeResultToDrainUsage` 0.31；v0.8.6→v0.8.7：`evaluateNotifyConsumerRefusal` 0.43、`listSessionsWithRecentConsumer` 0.40、`drainSessionMailbox` 0.40、`collectInstructionsInputs` 0.47、`renderJobCompleteReceiptGuidance` 0.41、`renderMailboxEventPrompt` 0.30、`createJobSessionFinalizer` 0.40、`filterDeliverableSessions` 0.25、`initProtocolSystemModule` 0.28；cli：`runUpgradeCommand` 0.45、`runChannelCommand` 0.45 |
| 0.30 | 62 / 1 | 11 | 上面去掉 0.30 以下的三个 |
| 0.35 | 62 / 1 | 10 | 再去掉 `renderMailboxEventPrompt` |
| 0.40 | 62 / 1 | 10 | 同上 |
| 0.45 | 61 / 2 | 2 | `mapClaudeResultToDrainUsage` 0.50（传播到第 2 轮后升到 0.50）、`collectInstructionsInputs` 0.47 |
| 0.50 | 56 / 7 | 1 | `mapClaudeResultToDrainUsage` 0.50 |
| 0.60 | 52 / 11 | 0 | – |

错误接受的邻居得分在 0.25 到 0.50 之间，最薄的几个真值得分在 0.28 到 0.49 之间（默认阈值下的回放里 v0.8.3→v0.8.4 最低的五个：0.43、0.46、0.47、0.49、0.62；v0.8.6→v0.8.7：0.28、0.48、0.50、0.51、0.53），两段重叠，没有一个 `ABS` 能把它们分开。默认取 `ABS` 0.45：两类错误之和最小（弃权 2 加错误接受 2），弃权的 `isSessionSetAliasParams`（v0.8.6→v0.8.7，0.28）与 `initGapSpanModule`（v0.8.3→v0.8.4，0.43）仍把真值排在第一，复核的人在 `impact.md` 里照样先看到它；取 0.50 要多弃权 5 个才少一个错误接受，取 0.25 时被删声明的名字每 4.5 个就有一个接错。cli 的两个名字在 0.45 下真值在场时接受、被删时弃权。Matcher 自己的 0.85 与 0.085 在这里只接受 37 个，因为改写过的函数体与旧版共有的特征比 Java 方法与其混淆孪生体共有的字节码少。接受只是给复核的人排序，不写入任何文件：写入仍要 `confirm_reanchor.mjs` 的证人核实或读过函数体后的 `--accept`；被删声明的名字即使被接错，证人若还在别处就报 `contradicted`，证人全部消失才落到 `read bodies`。
### 5.3 分层配对的全局指派与宽松相似度（`release_pairing.mjs`、`relaxed_signature.mjs`）

结论：`release_pairing.mjs` 从三层贪心配对改为五层逐层下钻、第 4 层每个窗口一次 Hungarian 指派、第 5 层不限窗口再指派一次、特征不足的声明改用宽松相似度之后，四对升级回放的每个判定计数与 5.1 节的基线逐项相同，`carried-wrong` 仍全为 0；与两侧人工推断表直接核对配对本身，v0.8.3→v0.8.4 的 1 个错配变为弃权，v0.8.6→v0.8.7 多配对 2 个，两步都没有一个不一致；发行历史 890 个符号里 `untraceable` 从 140 降到 49，25 个符号的首见版本改变。

测什么。三件事，都在 2026-11-05 的同一份 fixture 上做（Node 22，`.build/replay/` 与 `.build/history/`）。其一，`replay_bump.sh` 的四对回放，改动前后各跑一遍（`.build/replay-before/`、`.build/replay-after2/`），按 5.1 节的判定逐项比较。其二，配对本身的正确率：对 v0.8.3→v0.8.4 与 v0.8.6→v0.8.7 各运行一次 `pair_releases.mjs`（输入是 `history.sh` 产出的 fp 与 pairs），把两侧提交的 `inferred_daemon.json` 按真名连接，旧短名的配对结果与新短名相同记一致、不同记不一致、没有配对记缺配对；这比回放多核对了按结构承接的全部名字。其三，`history_chain.mjs` 在全部 52 个发行版上回溯 `maps/rename_daemon.json` 的 890 个符号，改动前的输出与提交的 `maps/history_daemon.json` 逐字节相同（改动前实现），改动后逐符号比较首见版本、改动版本与链条分叉处。

升级回放，改动前与改动后（每对一行；`bump.sh` 用时改动前 84、52、60、117 s，改动后 111、71、60、100 s）：

| 版本对 | bundle | carried 对/错 | confirmed 对/错 | proposed 对/错 | unresolved | gone | 排序第一 / 前三 | 改动后 |
|---|---|---|---|---|---|---|---|---|
| v0.8.3→v0.8.4 | daemon | 454 / 0 | 18 / 0 | 11 / 1 | 0 | 5 | 29 / 30 | 逐项相同 |
| v0.8.4→v0.8.5 | daemon | 728 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | – | 逐项相同 |
| v0.8.5→v0.8.6 | daemon | 733 / 0 | 0 / 0 | 0 / 0 | 0 | 0 | – | 逐项相同 |
| v0.8.6→v0.8.7 | daemon | 701 / 0 | 18 / 0 | 13 / 0 | 0 | 1 | 31 / 31 | 逐项相同 |
| v0.8.6→v0.8.7 | cli | 12 / 0 | 2 / 0 | 0 / 0 | 0 | 1 | 2 / 2 | 逐项相同 |

计数相同，逐名的来源有三处变化：v0.8.3→v0.8.4 的 `isSupportedRuntime`（三个函数体相同的孪生体）改动前由配对给出错误建议 `NR`，改动后配对弃权，打分退回 `anchor_candidates.mjs` 排序的第一名，仍是 `NR`，所以判定仍是 proposed-wrong；v0.8.6→v0.8.7 的 `initInstructionsFingerprintModule`（模块初始化器，只有两个字符串，特征不足）改动后由宽松相似配对给出建议 `Ck`（wl 0.881，lcs 0.962），`setSessionAliasAndReindex`（上游挪到别的模块，窗口里没有可比候选）由第 5 层给出建议 `qO`（特征 Jaccard 0.667），两者都与真值一致，改动前只有排序候选。

配对与两侧人工推断表核对（daemon，只计两侧都有的真名）：

| 步骤 | 重合的名字 | 改动前 一致 / 不一致 / 缺配对 | 改动后 一致 / 不一致 / 缺配对 | 改动后的配对按层 |
|---|---|---|---|---|
| v0.8.3→v0.8.4 | 484 | 481 / 1 / 2 | 481 / 0 / 3 | 第 1 层 439，第 2 层 14，第 3 层 21，第 4 层 7（特征） |
| v0.8.6→v0.8.7 | 732 | 721 / 0 / 11 | 723 / 0 / 9 | 第 1 层 669，第 2 层 23，第 3 层 25，第 4 层 4（特征）+ 1（宽松），第 5 层 1 |

改动前的唯一不一致是 `isSupportedRuntime`：三个新孪生体中先被问到的那个贪心认领了窗口里唯一的旧候选；改动后同一个旧声明被两个新孪生体同时当作唯一候选，窗口宽度又相同，第 2 层不配，后面的层也不配函数体相同的两个声明，于是弃权。改动后 v0.8.3→v0.8.4 的 3 个缺配对是这个孪生体、`initGapSpanModule`（特征 Jaccard 0.217、重合系数 1，低于重合规则的 0.25 下限，改动前后都不配）和一对相邻的孪生体；v0.8.6→v0.8.7 的 9 个缺配对全是相邻的孪生体（`isAgentRuntime` 与 `isModelRuntime`、`isSystemStatusParams` 与 `isSystemConfigParams` 等），它们在升级时由 `align_releases.mjs` 按语句对齐承接，回放里全部 carried-correct。全部两步没有一个配对与真值不同。

发行历史。改动后 890 个符号里 211 步靠第 4、5 层配对；`untraceable` 从 140 个降到 49 个，其中 21 个是数据声明（未初始化的 `var` 19 个、常量 2 个），28 个是没有一层能按位置分辨的孪生体，改动前这些孪生体记成了回溯停住处的新增。与改动前的实现相比（同一份特征文件，不计宽松画像），25 个符号的首见版本改变、17 个的改动版本改变、8 个从有首见版本变为 `untraceable`（都是孪生体），逐个读过分叉处：12 个是第 4、5 层接上了改动前没有配对的函数（挪过模块、落在窗口之外，或在加宽的窗口里改动前被先问到的别的新声明抢先：`createAgentSdkAdapter` 从 0.5.10 追到 0.2.0，正是 README 原记的已知误差；`resolveRuntimePaths` 从 0.4.3 追到 0.2.0；`deliverRouteEventToSession`、`isJobScheduleDue`、`setSessionAliasAndReindex` 等同类）；3 个是重合规则的配对被指派给了同一窗口里特征 Jaccard 更高的另一个新声明（`readOutboxRecordsPastCursor` 在 0.2.12→0.3.0 的旧声明被 Jaccard 0.759 的声明拿走，它自己只有 0.277）或两个新声明并列而弃权（`isMergeableChannelMessageBatch`、`parseChannelConfigFields`，旧函数被拆成两个）；`buildSystemPromptForChannelConfig` 与 `renderPromptLayers` 在 0.7.0→0.7.1 争同一个旧声明，改动前归前者（Jaccard 0.396），改动后指派给后者（0.66）；8 个变为 `untraceable` 的都是孪生体，其中 `codexUnavailableReason` 改动前靠贪心孪生体配对追到 0.2.0，改动后在 0.4.6→0.5.0 让位给窗口更窄的另一个新孪生体（旧声明在那个窗口的两个相邻锚点之间，Codex 支持也是 0.5.x 才出现的），自己没有一层能配，记为 `untraceable` 而不是 0.2.0。`maps/history_daemon.json` 已用 `history.sh --write` 按改动后的实现重写（特征文件用 `decl_features.mjs` 重新生成，带宽松画像），`first-party/` 文件头的 `// since:` 行随之由 promote 更新。`maps/changelog_daemon.json` 没有重新配对：首见版本改变的符号，其 CHANGELOG 配对可能指向原来的版本。

宽松相似度本身的量级（v0.8.6 与 v0.8.7 的 daemon，`relaxed_signature.mjs` 命令行）：函数体相同的两个声明 wl 1、lcs 1；`isAgentRuntime` 对不相关的单行谓词 `isSystemStatusParams` wl 0.329、lcs 0.645、均值 0.487，低于 0.6 的阈值；`initInstructionsFingerprintModule` 的两个版本 0.921，对同一窗口里另两个模块初始化器 0.292 与 0.148；`setSessionAliasAndReindex` 的两个版本 0.795，对同窗口的无关函数 0.112。`decl_features.mjs` 的输出因宽松画像从 1.09 MB 增至 1.55 MB（v0.8.7），`pair_releases.mjs` 一步用时约 3 s。

### 5.4 复核后的两处修正：creation factor 成为指派的截止线，孪生体层的窗口随已定下的孪生体收窄

结论：5.3 节的实现复核出两处问题，修正后四对升级回放的每个判定计数与每条逐名记录都与 5.3 节的改动后结果相同，两步配对与两侧人工推断表核对仍是 481 / 0 / 3 与 723 / 0 / 9，发行历史里只有 `sanitizeDrainRecordSegment` 一个符号改变（从 `untraceable` 回到 0.2.0），`untraceable` 从 49 降到 48。

第一处是 creation factor 在默认值下不起作用。5.3 节的实现只把过了阈值的配对放进代价矩阵（特征相似至少 `min` 0.5，宽松相似至少 0.6），这样每个可用配对的代价至多 0.5，总低于两个 dummy 合计的 0.6，dummy 永远赢不了配对，"代价超过 factor 的配对视为一删一增"这条规则从未生效；`--creation 10` 与默认值给出完全相同的配对，只有设到 1 − min 以下才有影响。修正后代价矩阵收每一对可比的声明（同为代码或同为数据、参数个数相差不超过一、函数体不相同），代价 1 − 相似度，dummy 仍各收 factor 的一半，于是相似度高于 1 − creation 的配对才会被指派，接受规则（`min`、`relaxedMin`、`lead`）只在指派之后决定报出哪些；被指派但低于阈值的配对记为弃权原因 `below min`。默认 0.6 时截止线 0.4 低于 `min` 0.5，所以在默认值下它决定的是指派里哪些配对占住行与列，不是报出哪些配对，文档与文件头现在照此写明，并写明与 git range-diff 的差别（range-diff 每个 dummy 收整个 factor，这里各收一半，使一删一增合计正好是 factor）。在 v0.8.6→v0.8.7 上核对：修正后默认值的配对与修正前逐对相同；`--creation 10`、`1.0`、`0.8`、`0.4` 与默认值相同（截止线 0.4 以下的配对本来就不过阈值，0.6 以下的配对里没有被指派的），`--creation 0.2`（截止线 0.8）少配 4 对（相似度 0.667–0.788 的第 4、5 层配对），即参数现在按文档所述起作用。

第二处是孪生体层的窗口只以第 1、3 层的配对为界。`sanitizeDrainRecordSegment` 在 0.2.12→0.3.0 一步：旧声明 `AUe`（第 530 位）夹在一个模块初始化器与一个 `var` 之后、`_A` 之前；新版本在同一位置有 `P4e`，前面的模块初始化器与 `var` 分别由第 4 层与孪生体层配到旧的第 528、529 位，后面的 `HN` 配到第 531 位；新版本另在前面新增的事件日志模块里（第 530–546 位，字符串 `replay`、`.jsonl`、`by_id.jsonl`，上游 0.3.0 新增的代码）放了一份函数体相同的 `w4e`。两者的窗口都是第 1、3 层邻居划出的 (525, 531)，宽度相同，于是 5.3 节的实现判为争抢并列、都不配；改动前的贪心实现把 `AUe` 给了 `P4e`，是对的。修正是让孪生体层每一轮用到当时已定下的全部邻居（第 1、3 层的配对加本层前几轮接受的孪生体）重算窗口：`P4e` 的窗口收窄为 (529, 531)，只含 `AUe`，`w4e` 的窗口收窄为 (525, 529)，不含它，两者不再争抢。这个修正只会收窄窗口，不会把本来唯一的候选变成多个，所以已接受的配对不会因此改变。核对：v0.8.3→v0.8.4 多配 6 对孪生体、v0.8.6→v0.8.7 多配 7 对，都不是推断表里的名字，抽读 5 对（`dhe`→`Vpe`、`aa`→`ia`、`kue`→`bke`、`EG`→`IG`、`RG`→`TG`）前后三个邻居的旧位置连续，配对位置正确；发行历史 890 个符号与 5.3 节相比只有 `sanitizeDrainRecordSegment` 一个改变。5.3 节列出的另外 7 个从首见版本变为 `untraceable` 的孪生体（`classifyNotifySessionKind`、`classifySessionKeyOrUnknown`、`codexUnavailableReason`、`isCodexPlainObject`、`isPlainJsonObject`、`isPlainObjectRecord`、`normalizeOptionalEnvString`）不受影响：其中 6 个停在的版本与改动前记的首见版本相同（改动前记成"在此新增"，现在记成"无法分辨"，不是丢了步骤），`codexUnavailableReason` 停在 0.5.0 而改动前追到 0.2.0，原因如 5.3 节所述，旧声明在另一个新孪生体更窄的窗口里。

复核时还做了：`history_chain.mjs` 的文件头与写进 `maps/history_daemon.json` 的 `method` 字符串原来仍描述三层贪心配对，现在按五层写，并写出 creation、relaxedMin、movedMin 的值；`pair_releases.mjs` 文件头的"四层"改为五层；`relaxed_signature.mjs` 命令行与 `pair_releases.mjs` 读不到输入文件时打印 `<路径>: <原因>` 并以 exit 2 结束，不再抛出堆栈。

测什么，和 5.3 节同一份 fixture（2026-11-05，Node 22）。升级回放四对，`replay_bump.sh` 的输出在 `.build/replay-fix/`，与 5.3 节改动后的 `.build/replay-after2/` 逐对比较：每个 bundle 的汇总字符串相同，逐名记录没有一条不同（daemon 489、728、733、733 个名字，cli 15 个）；`bump.sh` 用时 95、62、65、112 s，v0.8.5→v0.8.6 仍以模块归属检查失败的 exit 1 结束（预期）。配对与真值核对同 5.3 节的方法：v0.8.3→v0.8.4 481 一致 / 0 不一致 / 3 缺配对（按层 439、14、21、7），v0.8.6→v0.8.7 723 / 0 / 9（按层 669、23、25、4 + 1 宽松、1 第 5 层），与 5.3 节相同。发行历史：`history_chain.mjs --slim` 在 `.build/history-after` 上重写 `maps/history_daemon.json`，与 5.3 节提交的文件相比除 `method` 字符串外只有 `sanitizeDrainRecordSegment` 一个符号不同；与改动前的实现相比 24 个符号的首见版本改变（17 个换了版本，7 个变为 `untraceable`），99 个从 `untraceable` 得到首见版本，211 步靠第 4、5 层配对，`untraceable` 48 个（21 个数据声明、27 个分不开的孪生体）。`PROMOTE=1 PKG=<v0.8.7 dist/release> bash tools/rebuild.sh` 重写了 `first-party/05-drain-turn/sanitizeDrainRecordSegment.js` 的 `// since:` 行与 `RENAME_TABLE.md` 的首见版本列，17 个 verdict 全部 pass；`check_docs.sh` 通过。仍未做的：`maps/changelog_daemon.json` 没有按改变了首见版本的符号重新配对。

## 6 可读树与 bundle 一致

第 1–3 节只证明还原产物，没有一项看 `first-party/`；而人读的是后者，它出错的每一种方式都是静默的。`verify_first_party.mjs` 做六项相互独立的检查，已提交报告中 `firstPartyTree` 为 `pass`：

| 检查 | 内容 |
|------|------|
| 正文 | 文件正文逐字等于该符号在 `recon/daemon.recon.js` 里的完整顶层声明（截断的正文、单独一个 `}`、别的函数的正文都不能通过） |
| 符号 | 文件头的短名→真名与改名表一致，文件名就是真名 |
| 行号 | 文件头的美化行号就是该符号的声明行 |
| 名字来源 | 文件头 `// name:` 行标为 INFERRED 的，恰好是 `maps/inferred_daemon.json` 里的名字 |
| `index.json` | 与磁盘上的文件一一对应，没有未解析的锚点 |
| 覆盖 | 文件集合恰好等于改名符号集合，不缺、不多、不重复；每个文件位于 `maps/subsys_daemon.json` 指定的子系统目录 |

check 模式检查已提交的树；`PROMOTE=1` 或 `MAPS` 覆盖时检查 `$OUT` 里的候选树，也就是将被写入的那一棵。前五项只看已经存在的文件，所以一个从没得到文件的改名符号（没有子系统条目、树过期、大小写不敏感的文件系统把两个名字折叠成一个文件）要靠第六项发现。

## 7 文档引用与符号身份一致

已提交报告中 `citations` 与 `lineAnchors` 均为 `pass`：文档里没有指向不存在符号的引用，没有写错的短名，没有不在所引位置的代码片段，没有无法检查的裸行号，每份文档的行号数不超过 `maps/bare_anchor_baseline.json` 的上限。各种写法由哪个检查器负责、检查什么，见 README.md 的"文档引用按符号身份核对"。

两点决定这项证据的范围。其一，`verify_citations.mjs` 扫描 `docs/*.md`、`reconstruction/*.md` 与 `CLAUDE.md`，而 `check_doc_anchors.mjs` 与 `check_bare_anchors.mjs` 只扫描 `docs/*.md`，所以本目录与 `CLAUDE.md` 里的片段示例和行号不受检查。其二，写成 `真名 (短名)` 却没有登记的推断名会被报为"符号不存在"：真名的写法像真名、又不在索引里，就是一处缺失的符号，而不是一段普通文字。遗留行号每份文档各有多少，打印在运行日志的 `line numbers per doc` 行。

## 8 检查器自身的变异测试

前七节的证据都假设检查器本身可靠，这一节反过来检验它们，分两部分：每次运行都重跑的变异测试，和记录在案但没有接入流水线的一次性故障注入。

### 8.1 每次运行：`mutate_anchor_checks.mjs`（verdict `anchorCheckers`）

测试文档由符号索引和 bundle 现场生成，不需要维护任何固定样例，随每个版本自动更新。先确认每个检查器对干净文档通过，再每次注入一个错误，确认负责的检查器失败；检查器进程并发运行（`JOBS=1` 时依次运行）。已提交报告中为 `pass`，即全部变异都被报出。注入的错误按类别如下：

| 类别 | 注入的错误 | 负责报出 |
|------|-----------|----------|
| 带行号的名字引用 | F1 短名换错；F2 短名换错、范围倒置、短名只作为更长单词的一部分出现在所引行上、cli 引用的短名换错 | `verify_citations`、`check_doc_anchors` |
| 不带行号的名字引用 | `真名 (短名)` 的短名换错、真名不存在、PascalCase 类名不存在、两个 bundle 共有的真名配了另一个 bundle 的短名（不带前缀配 cli 短名，带 `cli:` 前缀配 daemon 短名）；`真名/短名` 的短名换错、真名不存在、围栏图里的短名换错、短名是没被索引的全小写记号、两半都没被索引 | `verify_citations` |
| 带行号的代码片段 | F3 行号挪动 50 行；片段保留字面量但调用的短名已被重新分配；形如 `foo(x)` 的调用片段行号错误；cli 引用丢掉 `cli.pretty.js:` 前缀 | `check_bare_anchors` |
| 不带行号的代码片段 | 绑定到不包含它的符号、绑定到没被索引的真名、绑定到没被索引的 `UPPER_SNAKE` 常量名；常量片段名字对但数字错（长短名各一例），或写成同一范围里另一个常量的数字；片段保留字面量但引用一个过期的局部变量名，或调用一个过期的全小写短名（这两例由 `snippetVerbatim` 拒绝） | `check_bare_anchors` |
| 裸行号与上限 | 新增裸行号；倒置的范围；正文里的 `daemon:N`、`daemon.pretty.js:N / N`、`cli.pretty.js:N`；一个代码 span 里写多个行号；以行号开头的代码 span；围栏图里的行号；表格里以空格限定 bundle 的行号；片段后不带反引号的括号行号；新增一个写法正确的 F1 行号（超过上限）；用 `--write-baseline` 调高上限 | `check_bare_anchors` |
| 错误的 bundle | 整个 bundle 下移一行 | 三个检查器都以 exit 2 拒绝 |
| 推断名的种类 | 常量的字面量被改；初始化器的名字挪到无关的初始化器、挪到函数上、挪到没有字面量也没有常量的初始化器上、挪到只共享一个常量的初始化器上；只共享默认值且原模块已不存在；没有基线时把函数名放到初始化器上（`check` 失败，`record` 拒绝写入），把常量名放到函数上；两个形状相同的初始化器（期望 `warn`，不能通过）；与另一个常量同值的常量上的名字按读取方通过，挪到那个孪生常量上判失败 | `verify_inferred` |

### 8.2 一次性故障注入（没有接入流水线）

下列注入各做过一次，结论记录在这里；它们不在每次运行里重做。

| 注入的错误 | 结果 | 取得于 |
|-----------|------|--------|
| 往还原产物注入 19 个语义变异（字面量、运算符、参数顺序、删语句、async、正则、模板、默认参数、成员访问等） | `ast_equiv` 19/19 报出 | v0.8.2 |
| 经 `rename.mjs` 产生 5 类错误改名（shorthand、重复 `var` 声明、解构写入、内层捕获、全局捕获） | `rename.mjs` 正确改写或拒绝改名；手工构造的错误输出，包括两个绑定被合并，`ast_equiv` 全部报出 | v0.8.2 |
| 让一个 bundle 的等价证明失败（出厂 `daemon.js` 多一条语句） | `JOBS=1` 与默认并发两种模式都在美化等价处报 NOT EQUIVALENT，构建以 exit 1 结束 | v0.8.3 |
| 在还原产物末尾追加语法错误 | `node --input-type=module --check` 返回 1 | v0.8.2 |
| `first-party/` 文件截断、清空、换成别的函数体、正文插入注释 | 全部报出 | v0.8.2 |
| 删除一个 `first-party/` 文件、放进错误的子系统目录、重复一个文件；改名符号缺子系统条目 | `verify_first_party` 全部报出；`extract_functions` 与 `gen_rename_table` 以 exit 1 结束且不写任何文件 | v0.8.3 |
| 推断名两两互换，共 741 种组合 | 741/741 报出；用 v0.8.1 基线检查正确迁移到 v0.8.2 的推断表不误报，检查没有迁移的旧表报出 26/31 | v0.8.2 |
| `promote.mjs write` 面对 `citations=fail`、`skipped`、从未运行的检查、`inferredNames=warn`、`beautifyEquivalent=skipped`、`package=unrecorded`、缺出厂哈希、大写的 `PASS` | 全部拒绝，目标目录的内容不变 | v0.8.3 |
| `PROMOTE=1` 只给 `BEAUTIFIED`；`PKG` 下没有 `package.json`；`PKG_VERSION` 与包版本矛盾；文档目标版本不符；同时给 `PKG` 与 `BEAUTIFIED` | 全部在创建 `$OUT` 之前拒绝 | v0.8.3 |
| `name_symbol.mjs` 登记第三方导出、第三方模块的初始化器、已有名字的符号、未初始化的 var、孪生初始化器、字面量与其他常量相同的常量、与变量或全局名同名、与已有真名同名、写法与种类不符、短于 8 个字符、未知子系统、同一批次内重名 | 全部拒绝；zod-to-json-schema 的函数不加 `--allow-unproven` 一律拒绝；以 `--allow-unproven` 登记的名字不再成为其他条目的证据 | v0.8.3 |
| 把 `check_doc_anchors` 的核对函数改成恒真 | 变异测试在并发与 `JOBS=1` 两种模式下都报出存活的变异，以 exit 1 结束：并发执行没有让测试失去失败能力 | v0.8.3 |
| 用不含 `eb4a5e5` 改动的检查器运行其中新增的变异用例 | 新增用例全部存活：它们确实区分得出两版检查器 | v0.8.3 |

## 9 已提交产物即生成产物，并绑定到出厂字节

第 1–8 节证明的都是 `$OUT` 里的文件。这一节把它们变成仓库里文件的结论，由三部分组成：

- **已提交产物等于生成产物**（verdict `committedInSync`）。check 模式把 `recon/daemon.recon.js`、`maps/` 下的生成文件、两份改名表和整棵 `first-party/` 与本次生成的逐一比较，并要求已提交的报告本身满足 promote 条件：每个证明类 verdict 为 `pass`、版本号是正式版本、每个 bundle 的出厂与美化哈希都在。
- **记录绑定到字节**。报告的 `sha256.<bundle>.shipped` 与 `sha256.<bundle>.pretty` 记录了生成它的运行读到的出厂文件与美化文件；check 模式比较报告时，这两个哈希必须与本次运行一致（没给 `PKG` 的运行读不到出厂文件，只比较美化哈希）。
- **文档与 `maps/` 描述同一版本**（verdict `anchorTargetMatches`）：`docs/.pretty-anchor-target` 必须等于已提交报告的 `package`。

已提交报告里 `committedInSync` 为 `promoted`，表示它由一次写入成功的 `PROMOTE=1` 运行生成；`anchorTargetMatches` 为 `pass`。2026-11-01 用 v0.8.7 出厂包对已提交产物做了一次 check 模式运行（Node v22.23.4），全部 verdict 为 `pass`，其中 `committedInSync=pass`：每个比较过的产物都与已提交版本一致，包括报告里的两组哈希。

美化输出按版本写到 `$OUT/beautified/<版本>/`，旧的平铺目录里残留的美化文件在每次运行时删除。手工用 `BEAUTIFIED=` 指定的目录仍可能过期，而 `bundle_guard.mjs` 在 `rebuild.sh` 里发现不了它：流水线的符号索引由本次运行从同一份美化文件生成，二者总是一致。流水线内由别的检查暴露它：推断名表以短名为键，放到另一个版本的美化文件上会落到别的声明上，`daemon.inferredNames` 记为 `fail`，构建在第 2b 步停止（2026-09-24 用 v0.8.2 的美化文件对照 v0.8.3 的 `maps/` 实测：236 个推断名被推翻，exit 1）；同时给了 `PKG` 时，美化等价证明也会失败；没给 `PKG` 的运行没有版本号，即使走到第 7 步也只能记 `committedInSync=unverified`。`bundle_guard.mjs` 拒绝的是另一种情形：在流水线之外，拿过期的美化文件对照已提交的 `maps/symbols_*.json` 手工运行检查器时，它以 exit 2 拒绝（第 8.1 节的"错误的 bundle"）。

---

## 汇总

已提交报告的 verdicts（版本见报告的 `package`）：

| 检查 | verdict 键 | daemon | cli |
|------|-----------|--------|-----|
| 无损拆包 | `<bundle>.lossless` | pass | pass |
| 出厂 ≡ 美化 | `<bundle>.beautifyEquivalent` | pass | pass |
| 模块归属检查 | 无（失败即停止构建） | 通过 | 通过 |
| 推断名 | `<bundle>.inferredNames` | pass | pass |
| 局部变量名 | `<bundle>.localNames` | pass | 无局部名字表 |
| 语法（按 ESM 解析） | `<bundle>.syntax` | pass | pass |
| AST 全等 | `<bundle>.astEquivalent` | pass | pass |

| 检查（整次运行） | verdict 键 | 结论 |
|------------------|-----------|------|
| 可读树 | `firstPartyTree` | pass |
| 文档引用身份 | `citations` | pass |
| 行号、片段与上限 | `lineAnchors` | pass |
| 检查器变异测试 | `anchorCheckers` | pass |
| 文档目标版本 = 报告版本 | `anchorTargetMatches` | pass |
| 已提交产物 = 生成产物 | `committedInSync` | promoted（2026-11-01 的 check 运行为 pass） |
| 出厂与美化字节 | `sha256` | daemon、cli 均已记录 |
| 实机 A/B 对照 | 无 | 人工对照；版本、还原产物所在的提交与覆盖路径见第 4 节 |

覆盖面限于有自研导出表的 daemon 与 cli。`stdio`、`pi-worker`、`channel-acp`、`feishu-gateway` 几乎恢复不出自研真名，不进入流水线，没有任何检查；`duoduo` 命令实际执行的 cli、daemon、pi-worker 三个 bundle 里，pi-worker 没有还原。

**结论**：在已提交报告记录的版本上，所覆盖 bundle 的还原产物与出厂产物语义全等（两处不覆盖的行为见第 3 节），仓库里的产物就是由记录了哈希的出厂字节生成的；运行效果在实机对照覆盖的路径上一致（对照所在版本、还原产物所在的提交与覆盖范围见第 4 节）。

---

## 复现

```bash
# Node 主版本以仓库根目录的 .nvmrc 为准；rebuild.sh 遇到别的主版本只打印警告
cd reconstruction/tools && npm ci

# 0) 取出厂包，装到独立前缀，不改动本机全局安装的实例
SP=/tmp/duoduo-recon && mkdir -p "$SP/pkgs"
V=$(node -p 'require("../maps/pipeline_report.json").package.slice(1)')
npm install --prefix "$SP/pkgs/$V" "@openduo/duoduo@$V" --ignore-scripts --no-audit --no-fund
PKG="$SP/pkgs/$V/node_modules/@openduo/duoduo/dist/release"

# 1) 第 1–3 节与第 6–9 节：一次 check 模式运行，只写 $OUT，不改仓库；
#    结论在 $OUT/verdicts.txt 与 $OUT/pipeline_report.json
PKG="$PKG" bash rebuild.sh

# 2) 第 5 节（仅升级时）：OLD 是 maps/ 记录的版本，NEW 是新版本；
#    其后的步骤按 bump.sh 打印的顺序执行（README.md「跟随上游升级」）
PKG_OLD="$PKG" PKG_NEW=<新版本的 dist/release> bash bump.sh

# 3) 第 4 节：隔离 HOME + 备用端口，勿用默认的 :20233
PORT=${PORT:-20353}
ISO=/tmp/iso-recon && mkdir -p "$ISO" && chmod 700 "$ISO"
cp ../recon/daemon.recon.js "$PKG/" && cd "$PKG"
HOME="$ISO" ALADUO_PORT="$PORT" ALADUO_LOG_LEVEL=info \
  ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" \
  ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local node daemon.recon.js &
until curl -s -o /dev/null "127.0.0.1:$PORT/healthz"; do sleep 0.2; done
curl -s -H 'Content-Type: application/json' -XPOST "127.0.0.1:$PORT/rpc" \
  -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
curl -s -H 'Content-Type: application/json' -XPOST "127.0.0.1:$PORT/rpc" \
  -d '{"jsonrpc":"2.0","id":2,"method":"session.send","params":{}}'    # 期望 -32601
curl -s -H 'Content-Type: application/json' \
  --unix-socket "$ISO/.aladuo/run/daemon.sock" http://localhost/rpc \
  -XPOST -d '{"jsonrpc":"2.0","id":3,"method":"session.list","params":{}}'
kill %1
# A/B：还原版退出后，出厂版用同样的命令启动 daemon.js（换一个新建的隔离 HOME），
# 比较两边的 RPC 返回、日志与停止后的 HOME 文件树
```

实机运行的几处注意事项，每一处都会让探测结果看起来像别的问题：

- 隔离 HOME 的路径要短：`<HOME>/.aladuo/run/daemon.sock` 超过 unix socket 的 104 字节上限时，daemon 直接 fatal 退出。
- socket 路径写成隔离 HOME 的绝对路径。写 `"$HOME/..."` 会展开成外层真实的 HOME，探到的是本机正在运行的 daemon。
- `curl` 必须带 `-H 'Content-Type: application/json'`。`curl -d` 默认发 form 编码，fastify 在 JSON-RPC 分发之前就返回 415，看起来像端点坏了。
- 默认日志级别是 `warn`；要观察启动期行为必须设 `ALADUO_LOG_LEVEL=info`，否则会误以为代码没有执行。
- 只直接用 `node` 启动还原 daemon，不要在隔离 HOME 里运行 `duoduo daemon start|stop|restart`：在 macOS 上它们按用户级 launchd label `ai.openduo.daemon` 操作，会停掉并替换本机真实的 daemon。
