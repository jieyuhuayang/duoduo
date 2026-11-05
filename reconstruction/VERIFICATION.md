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
| 5 跨版本重定向 | 升级时推断名按结构签名迁移，承接不了的全部显式报出；改动的代码与引用它的文档位置全部列出 | 升级时运行 `bump.sh`；2026-09 的 `bump.sh` 在 v0.8.2→v0.8.3 上完整回放过，此后加入的步骤各自的回放见 README.md「已实现」表 | 本文；README.md |
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

这次回放之后 `bump.sh` 又加入了几个步骤：按顺序对齐全部顶层语句承接孪生推断名（`align_releases.mjs`），第 2c 档与第 4 档影响清单，其余四个 bundle 的字面量差异（`bundle_literals.mjs`），模块归属检查失败时的证据（`module_owner_hint.mjs`），以及 RE-ANCHOR 候选的证人核对（`confirm_reanchor.mjs`）。它们各自的回放记录在 README.md「已实现」表里，没有在一次完整的 `bump.sh` 运行里重新汇总。

已提交的映射不依赖这些回放：它们的正确性由对齐版本上第 2、6、7 节的证据成立（推断名检查、可读树与引用检查全部 `pass`）。

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

## 11 类型播种：protocol 签名经 TypeScript checker 传播

`tools/type_seed.mjs` 不是证明链的一环，它产出命名上下文：把 `@openduo/protocol` 发布的 TypeScript 签名挂到还原 bundle 里对应的符号上，让 TypeScript checker（`allowJs` 加 `checkJs`）推断每个自研声明的参数类型、返回类型和每个局部绑定的类型，写成 `types_daemon.json`，由 `name_locals.mjs tasks --types`、`name_toplevel.mjs tasks --types` 与 `match_published_source.mjs --types` 读取。结论先行：只播种签名几乎没有收益（局部绑定有类型的比例从 30.2% 到 30.6%），因为 checker 对根是 `any` 的属性访问从不收窄，RPC 路由里 `request.params` 经守卫后仍是 `any`；把调用点实参类型沿调用图注入被调函数的参数（包括嵌套函数，`handleRpcRequest` 的 `request` 由此得到 `JsonRpcRequest`）之后，局部绑定有类型的比例到 43.1%，参数从 3.9% 到 42.2%，拿到 protocol 类型别名的局部绑定从 0 到 65。

挂接方式。先试了 `.d.ts` 覆盖：同级 `.d.ts` 里的 `declare function` 不会与 JS 模块自己的声明合并，bundle 里的声明仍是 `(e: any): any`，此路不通。可行的是在 `.build` 下的临时副本里给被播种的声明前插入 JSDoc `/** @type {typeof import("<protocol 文件>").<名字>} */`：checker 以该标签为声明的类型，参数、返回类型与类型谓词（`value is SessionNotifyParams`）都保留，protocol 的 `.ts` 文件在同一个 program 里，别名可解析；副本开头为 protocol 导出的每个类型别名写一条 `@typedef {import(...).T} T`，使注入的类型字符串在副本内可解析。注释插在声明范围之外，局部绑定的序号与 ctx（`local_bindings.mjs`）与 `.build/daemon.recon.top.js` 相同，工具把原文件上算出的偏移按插入文本平移，不重新解析；`name_locals.mjs tasks --types` 按序号取类型并核对 ctx 相等，v0.8.7 上 71 条全部核对通过。传播每轮取 checker 能解析到声明的标识符调用（顶层或嵌套的函数声明，单声明符的 `const f = function/arrow`），对仍为 `any` 的参数，把各调用点实参类型（排除 `any`、`unknown`、`never` 与带展开实参的调用点）的并集写成 `@param`，再跑一轮，直到一轮没有新增或到 `--rounds`。这样得到的参数类型只是有类型的调用者传入的东西，输出里标为 `propagated`，与 `typed` 分开计数；参数被传播过的函数，其返回类型是在这个并集之下推出来的，也标为 `propagated`（v0.8.7 上 890 个自研声明里 319 个返回如此），经被调函数的 `propagated` 返回间接依赖的情形不追踪。一个实测到的窄化例子：`isReservedMainAliasChange` 序号 1 的参数只有传 `null` 的有类型调用者，得到的类型就是 `null`。副本必须能解析：checker 打印的类型可能含 `*/`（引用正则源码的字符串字面量类型，v0.8.7 上是 vendored marked 的属性模式，注入到 3 处），它会提前结束 JSDoc 注释，工具写成 `*\/`，并在每一轮断言副本的语法诊断数与原文件相同（都是 0），不同则停止并打印第一条诊断的行号；此前这一检查缺失，副本在 vendored 的 `hn` 处解析失败，checker 在错误恢复后的文件上作答，自研声明的数字恰好没受影响。

v0.8.7 的测量（还原 bundle 取本仓库 check 模式运行的 `.build/daemon.recon.js`，protocol 源码取 `@openduo/protocol` 0.8.6 的 `src/`，11 个 `.ts`、99 个导出类型别名；TypeScript 5.9.3，Node 22；自研声明 890 个，参数 1396 个，返回 814 个，局部绑定 6406 个；每种配置 10–38 s）：

| 配置 | 参数有类型 | 返回有类型 | 局部绑定有类型 | 带 protocol 别名的局部绑定 / 参数 |
|------|-----------|-----------|---------------|-------------------------------|
| 不播种、不传播（基线） | 3.9%（55） | 80.3%（654） | 30.2%（1936） | 0 / 0 |
| 只播种（43 个符号） | 4.5%（63） | 81.3%（662） | 30.6%（1959） | 13 / 0 |
| 只传播（4 轮） | 37.5%（524） | 83.3%（678） | 40.9%（2617） | 0 / 0 |
| 播种 `published_daemon.json` 的 40 个并传播 | 38.3%（535） | 83.9%（683） | 41.2%（2637） | 23 / 3 |
| 播种 43 个并传播（`--same-name`，默认建议） | 42.2%（589） | 84.0%（684） | 43.1%（2764） | 65 / 16 |

播种的 43 个符号是 `maps/published_daemon.json` 配对的 40 个（3 个模块初始化器没有可播种的声明，6 个名字不是 protocol 当前版本的导出；签名取自映射记的那个 protocol 文件，该文件不导出该名字时取按文件名排序的第一个并在输出里注明，v0.8.7 上 0 处）加 `--same-name` 补上的 3 个与 protocol 导出同名同参数个数的推断名（`isJsonRpcRequest`、`isEffortLevel`、`isJobCreateParams`，输出里标为 `same-name`，与 `published` 分开）。`isJsonRpcRequest` 是关键的一个：没有它，`request` 得不到 `JsonRpcRequest`，`request.params` 不可收窄，路由处理函数的参数拿不到 `Session*Params`。调用了被播种符号的 78 个声明里，参数有类型 41.3%（50/121），返回 97.4%（76/78），局部绑定 45.2%（527/1166）。最后一种配置与基线相比，534 个参数与 828 个局部绑定从无类型变为有类型，其中 60 个局部绑定在还原 bundle 里仍是一两个字母的名字，也就是命名任务要问的那些；传播共给 1211 个函数（747 个顶层）的 1724 个参数写了类型。代价是错误类型（checker 的 error type，注入的类型字符串里有副本内解析不到的名字）从 541 个局部绑定升到 602 个，这些在输出里标为 `error`，不计入有类型。

五个会改变命名决定的例子，类型都是基线上没有的（基线为 `any`），绑定在还原 bundle 里仍是 esbuild 留下的名字：`checkMainAliasCallerAuthority` 序号 0 的 `e` 得到 `SessionSetAliasParams`、序号 2 的 `n` 得到 `MainSessionResolution`（先前只能从 `e.alias`、`n.state` 猜）；`listMainAliasHolderKeys` 序号 0 的 `e` 得到 `MainSessionResolution`；`setSessionAliasWithMainRole` 序号 1 的 `t` 与 `runSessionSetAliasRpc` 序号 3 的 `r` 都得到 `SessionSetAliasParams`，两处可以统一命名为 `params`；`renderActiveSessionsListing` 序号 4 到 13 的 `o`、`l`、`c`、`s`、`a` 得到带 `kind: SessionKeyKind` 的会话索引条目对象类型，说明它们是 `session.list` 行而不是任意记录；`createDaemon` 序号 40 的 `request` 得到 `JsonRpcRequest`，其后序号 66 到 129 的各个 `params` 分别得到 `ChannelDescribeParams`、`SessionArchiveParams`、`SessionListParams`、`SessionNotifyParams` 直到 `JobInterruptParams`。一个反例也值得记：`normalizeReturnMask` 序号 2 的局部已被命名为 `kind`，checker 给它 `ChannelReturnMaskItem`，按类型应叫 `maskItem`。

对三个读取方的实测：`name_locals.mjs tasks --types` 在 v0.8.7 上，35 个仍有未命名局部的声明里 26 个得到类型行，共 104 个待命名局部里 71 个各有一行（34 行标为来自调用点），类型行以注释写在该声明代码块的开头，去掉这些行后 9 个 `.md` 与不带 `--types` 的输出逐字节相同，`.json` 相同；`name_toplevel.mjs tasks --types` 为 60 个候选中的 31 个打印 `signature:` 行（19 行含来自调用点的类型），去掉这些行后 `toplevel.md` 与 `toplevel.tsv` 相同；`match_published_source.mjs --types` 按返回类型类别（boolean、string、number、void，类型谓词算 boolean）排除候选，只用 checker 标为 `typed` 的返回，`propagated` 的不用。v0.8.7 上盲配（不给改名表）排除 898 个候选（涉及 47 个发布声明），给改名表排除 1519 个（48 个），77 个发布声明的 verdict 与最佳候选一个没变，盲配 40 个 `unique` 里 38 个有次优候选的平均领先 0.560 不变、没有一个变大。被排除的候选不曾是最佳候选，但有过次优候选：给改名表时 3 个发布声明的次优候选被排除（`isNonEmptyText` 的次优是与它 token 得分同为 1.0 的 `sv`，checker 推出 `sv` 返回 `string | undefined`，排除是对的；`isSessionArchiveParams` 的 0.75、`describeSpineCatProblem` 的 0.111 各换成下一名），三者 verdict 都是 `confirmed`；盲配时 `isNonEmptyText` 与 `sv` 的 1.0 并列不带 `--types` 由引用语句一步裁定、带 `--types` 由返回类别裁定，结果同为 `unique`。这项特征在这个版本上是对错配的保险，不是增益。

边界：只对流经 protocol 类型的值有效，与 `docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md` 第 5.2 节调研的预期一致；checker 对 `any` 根的属性访问不收窄，所以凡是 `JSON.parse` 之后没有经过守卫的对象仍是 `any`；传播只看标识符调用，经回调、方法、`.call`、展开实参传入的参数不处理；`types_daemon.json` 与临时副本都是 `.build` 下的产物，不提交，也不进入任何 gate。

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
