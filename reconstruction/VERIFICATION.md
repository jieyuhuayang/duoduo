# 还原正确性验证记录（Verification Log）

目标命题：**还原产物（提交的 `recon/daemon.recon.js`，以及 `rebuild.sh` 生成在 `$OUT` 下的 `cli.recon.js`）与出厂 `dist/release/` 下的同名 bundle 是同一个程序，能同样运行。**

命题的静态部分在 v0.8.3 上成立，而且不是一次性结论：每次 `tools/rebuild.sh` 运行都从出厂包重新证明一遍。已提交的 [`maps/pipeline_report.json`](./maps/pipeline_report.json) 由一次带 `PKG` 的 `PROMOTE=1` 运行写入，每个证明类 verdict 都是 `pass`，并记录了出厂与美化 bundle 的 sha256；CI 在每个 PR 上用报告记录的版本重跑全部闸门。命题的运行部分（证据四）在 v0.8.3 上做过一次启动对照（覆盖启动与控制面读接口），更完整的一次 A/B 对照是在 v0.8.2 上做的。本文不复述计数，计数以报告为准；各道闸门的机制说明见 [README.md](./README.md)，本文只记录它们证明了什么、证据在哪里。

九条证据的分工如下。前三条证明变换链不改程序，第四条是实机运行，第五条覆盖跨版本重定向，第六、七条覆盖人读的东西（可读树与文档引用，它们出错时前几条证据照样全部通过），第八条反过来检验检查器本身，第九条把"`$OUT` 里的结论"变成"仓库里文件的结论"。

| 证据 | 证明什么 | 何时取得 | 记录在 |
|------|----------|----------|--------|
| 一 · 无损拆包 | 模块边界从真实结构切出，拆分没有信息损失 | 每次运行 | verdict `<bundle>.lossless` |
| 二 · 名字与归属 | 真名来自 esbuild 导出结构，归属按模块判定，推断名贴在对的声明上 | 每次运行 | 模块闸门（失败即停止构建）；verdict `daemon.inferredNames` |
| 三 · 语义全等 | 出厂压缩文件 ≡ 美化文件 ≡ 还原产物（模改名表） | 每次运行 | verdict `<bundle>.beautifyEquivalent`、`<bundle>.syntax`、`<bundle>.astEquivalent` |
| 四 · 实机运行 | 还原 daemon 与 cli 的运行效果与出厂版相同 | 人工 A/B 对照，不随每次运行重做 | 本文 |
| 五 · 跨版本重定向 | 升级时推断名按结构身份承接，承接不了的全部显式报出 | 升级时运行 `bump.sh`；当前版本在 v0.8.2→v0.8.3 上回放 | 本文 |
| 六 · 可读树 | `first-party/` 与 bundle、改名表、推断名表、子系统映射一致 | 每次运行 | verdict `firstPartyTree` |
| 七 · 文档引用 | 文档里每一处代码引用指向它声称的符号或代码 | 每次运行 | verdict `citations`、`lineAnchors` |
| 八 · 检查器变异测试 | 各检查器能报出注入的已知错误 | 每次运行，另有一次性故障注入 | verdict `anchorCheckers`；本文 |
| 九 · 提交产物绑定出厂字节 | 仓库里的产物就是对应出厂字节生成的产物，文档与 `maps/` 描述同一版本 | 每次运行 | verdict `committedInSync`、`anchorTargetMatches`；报告的 `sha256` |

---

## 证据一 · 无损拆包：拼接可字节还原

每次运行都成立（verdict `<bundle>.lossless`，已提交报告中 daemon、cli 均为 `pass`）。`split.mjs` 按顶层语句的字节偏移把美化后的 bundle 切成模块文件与 shell 片段，`reassemble.mjs` 按 manifest 拼回，与原文件 `cmp` 逐字节相同。运行日志里对应的行是 `lossless: OK (byte-identical)`。

切片是连续的字节区间，这项证明能失败的途径主要是写文件。压缩标识符常常只差大小写，片段文件按标识符命名；在大小写不敏感的文件系统（macOS、Windows）上，后写的文件会覆盖前一个，模块树内容错乱，字节还原比对随之失败。片段文件名因此做成大小写不敏感唯一，拆分目录在每次运行前清空，避免上一个版本残留的片段混进比对。

## 证据二 · 名字与归属：来自 esbuild 的导出结构

**真名取自 bundle 本身。** esbuild 压缩后仍保留 `__export(exports, { 原名: () => 短名 })` 调用。它只为运行时需要导出对象的模块生成这种调用（典型是被动态 `import()` 的模块），所以大多数模块没有导出块，但一个块总是恰好对应一个源模块；bundle 顶层的 `export {}` 另外记录入口导出。恢复出的名字数、按模块分组后的自研名字数、入口导出数、推断名数和改名条目数，分别见报告 `bundles.<bundle>` 下的 `namesInBlocks`、`firstPartyNamesFromBlocks`、`namesFromEntryExports`、`inferredNames`、`renameEntries`。

**归属按模块判定。** `build_rename.mjs` 用 `maps/modules_<bundle>.json` 逐块判定自研还是第三方；匹配不上任何记录的块让构建失败，并列出该块全部导出名。这道闸门没有单独的 verdict：它失败时构建直接停止，报告不会生成。按名字判定归属时，一个被误记为第三方的名字此后永远不会再被检查；按模块判定时，新版本带来的是一个需要判定的模块，而模块的身份不依赖名字长什么样（整个 Grok 模块只导出 `GROK_ACP_*` 常量）。

**推断名贴在对的声明上。** 没有导出的内部符号用人工推断的名字（`maps/inferred_daemon.json`）。改名是作用域安全的，名字贴错了声明时 AST 等价照样成立、daemon 照样启动，所以 `verify_inferred.mjs` 在每次运行里检查每个推断名的种类与拼写、与形态基线（`maps/inferred_daemon.shape.json`）的差异，以及推断名之间是否被互换（规则见 README.md）。v0.8.3 的已提交报告里 `daemon.inferredNames` 为 `pass`：没有被推翻的名字，也没有需要复读的告警。模块初始化器与常量两种种类的规则由变异测试覆盖（证据八），不依赖映射里是否已经有这两种名字。cli 没有推断名。

## 证据三 · 语义全等：出厂 ≡ 美化 ≡ 还原

每个 bundle 在每次带 `PKG` 的运行里做两次 AST 等价证明，已提交报告中 daemon、cli 的三个 verdict 都是 `pass`：

1. **出厂 ≡ 美化**（`<bundle>.beautifyEquivalent`）：`ast_equiv.mjs` 比对出厂压缩文件与锁定版本 js-beautify 的输出。没有这一步，后面的证明全部从一个不随包发布的文件开始。
2. **美化 ≡ 还原**（`<bundle>.astEquivalent`）：`ast_equiv.mjs` 并行遍历两棵 AST，每个节点类型与字面量必须相同；标识符按它解析到的绑定比较，两边的声明必须一一对应，全局名保持同名全局，只有改名表列出的顶层绑定可以换名。另用 `node --input-type=module --check` 按 ESM 解析还原产物（`<bundle>.syntax`）。

这是覆盖 100% 代码的静态证明，比只跑到启动路径的实机运行更强。比较过的节点数打印在运行日志的 `nodes compared` 行，不进入报告。两处不覆盖的行为：读取函数自身名字的代码（`Function.prototype.name`、类的 `constructor.name`、调用栈文本）在还原版里看到的是真名；内联的 gray-matter 有一处 direct `eval()`（运行日志里的 `note: 1 direct eval() call(s)`），被 eval 的代码按名字看得到模块作用域。duoduo 自研代码不读取被改名函数的名字，控制流不受影响。

## 证据四 · 实机运行

v0.8.3 的实机对照覆盖启动与控制面读接口，结论是两边一致。2026-09-24 用 Node v22.23.3 在 macOS 上，把还原的 `daemon.recon.js`（472 个改名符号）与出厂 `daemon.js` 放进同一个 v0.8.3 包目录，各用一个隔离 HOME、端口 20333、host 模式、`claude_code_local` 认证与 `info` 日志级别依次启动，探测后用 SIGTERM 停止：

- 只读 TCP 上的 `system.status`：遮掉 id、时间戳、pid 与路径之后逐字相同。
- 只读 TCP 上的写类方法 `session.list`：两边都返回同一个 JSON-RPC `-32601`（"Method not available on read-only endpoint"）。
- unix socket 上的 `session.list`：两边相同。
- 启动日志：两边各 26 行，遮掉时间戳、pid 与路径后相同，没有错误行；两边都在 SIGTERM 后 3 秒内退出。

更完整的一次 A/B 对照在 v0.8.2 上做，把还原版与出厂版放在各自隔离的 HOME 与备用端口下运行：

- **daemon**：4 个实例，约 13 分钟。启动日志、生成的 HOME 文件树、只读 TCP 接口、unix socket 上的 26 个读类 RPC、60 秒周期的 cadence、SIGTERM 与 SIGKILL 之后的恢复行为，两边一致。
- **cli**：133 组调用的 stdout、stderr 与退出码逐字节一致。

没有覆盖的路径：用户会话 actor 与 channel ingress 的 WAL 回放、job 调度、codex/grok/pi 适配器（这些需要真实的模型调用），以及默认 37 分钟 cadence 下的长时间运行。它们目前只有 AST 等价作为证据。

下面是 v0.7.1 隔离实启时对控制面的一次探测记录（端口 20334），它在实机上复现了静态分析的结论：TCP 端口只接受只读方法，完整控制面在 unix socket 上。

```
$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
{"jsonrpc":"2.0","id":1,"result":{"health":{...},"cadence":{...},"memory_check":{...}}}   # 只读方法：通过

$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":2,"method":"session.send","params":{}}'
{"jsonrpc":"2.0","id":2,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}   # 写方法：拒绝

$ ls -la /tmp/iso071/.aladuo/run/daemon.sock
srw------- 1 root root 0 ... daemon.sock                       # mode 0600，父目录 0700

$ curl -s -H 'Content-Type: application/json' \
    --unix-socket /tmp/iso071/.aladuo/run/daemon.sock http://localhost/rpc \
    -XPOST -d '{"jsonrpc":"2.0","id":3,"method":"system.status","params":{}}'
{"jsonrpc":"2.0","id":3,"result":{...}}                         # socket 上同一方法照常工作
```

daemon 日志同时记录 `[WARN] [daemon] rejected write method on read-only port { method: 'session.send', id: 2 }`；收到 SIGTERM 后各组件逐一 `stopped`，以 `[pid0] shutdown complete` 退出。

## 证据五 · 跨版本重定向

推断名表以短名为键，而 esbuild 每次构建都重新分配短名，同一个短名在下一个版本里可以是完全不同的函数；直接沿用旧表不会报错，只会把名字贴到错的函数上。`tools/bump.sh` 按结构指纹承接推断名，承接不了的报 `RE-ANCHOR`，交给人用字符串锚点重新定位，再由证据二的推断名检查把关。

当前版本的 `bump.sh` 在 v0.8.2→v0.8.3 上完整回放过（`maps/` 取自 v0.8.2 的提交，Node 22，`/bin/bash` 3.2），结果如下：

- 以 exit 0 结束，用时 38 s；
- 给出 v0.8.3 的美化文件与 `PKG_NEW` 时，`ast_equiv.mjs` 证明前者就是后者的美化结果；
- `bundle_guard.mjs` 确认 OLD 就是这份 `maps/` 描述的版本；
- 推断名除 `drainSessionMailbox` 外全部按结构指纹自动承接；它被列为 `RE-ANCHOR pending`，子系统条目保留，没有被误列为"上游已删除"；
- diff 两侧各用自己版本的真名标注：新短名不再带着旧版本里同一拼写的含义；
- 从 `maps/modules_daemon.json` 删掉一条自研模块记录后，其余结果照常产出，最后以 exit 1 结束；
- `PKG_OLD` 与 `PKG_NEW` 取同一个包时，两侧都报 unchanged，美化输出与锁定版本的美化文件逐字节相同。

已提交的 v0.8.3 映射不依赖这次回放：它们的正确性由 v0.8.3 上的证据二、六、七成立（推断名检查、可读树与引用检查全部 `pass`）。

## 证据六 · 可读树与 bundle 一致

证据一至三只证明还原产物，没有一条看 `first-party/`；而人读的是后者，它出错的每一种方式都是静默的。`verify_first_party.mjs` 做六项相互独立的检查，已提交报告中 `firstPartyTree` 为 `pass`：

| 检查 | 内容 |
|------|------|
| 正文 | 文件正文逐字等于该符号在 `recon/daemon.recon.js` 里的完整顶层声明（截断的正文、单独一个 `}`、别的函数的正文都不能通过） |
| 符号 | 文件头的短名→真名与改名表一致，文件名就是真名 |
| 行号 | 文件头的美化行号就是该符号的声明行 |
| 名字来源 | 文件头 `// name:` 行标为 INFERRED 的，恰好是 `maps/inferred_daemon.json` 里的名字 |
| `index.json` | 与磁盘上的文件一一对应，没有未解析的锚点 |
| 覆盖 | 文件集合恰好等于改名符号集合，不缺、不多、不重复；每个文件位于 `maps/subsys_daemon.json` 指定的子系统目录 |

check 模式检查已提交的树；`PROMOTE=1` 或 `MAPS` 覆盖时检查 `$OUT` 里的候选树，也就是将被写入的那一棵。前五项只看已经存在的文件，所以一个从没得到文件的改名符号（没有子系统条目、树过期、大小写不敏感的文件系统把两个名字折叠成一个文件）要靠第六项发现。

## 证据七 · 文档引用与符号身份一致

已提交报告中 `citations` 与 `lineAnchors` 均为 `pass`：文档里没有指向不存在符号的引用，没有写错的短名，没有不在所引位置的代码片段，没有无法检查的裸行号，每份文档的行号数不超过 `maps/bare_anchor_baseline.json` 的上限。各种写法由哪个检查器负责、检查什么，见 README.md 的"文档引用按符号身份核对"。

两点决定这项证据的范围。其一，`verify_citations.mjs` 扫描 `docs/*.md`、`reconstruction/*.md` 与 `CLAUDE.md`，而 `check_doc_anchors.mjs` 与 `check_bare_anchors.mjs` 只扫描 `docs/*.md`，所以本目录与 `CLAUDE.md` 里的片段示例和行号不受检查。其二，写成 `真名 (短名)` 却没有登记的推断名会被报为"符号不存在"：真名的写法像真名、又不在索引里，就是一处缺失的符号，而不是一段普通文字。遗留行号每份文档各有多少，打印在运行日志的 `line numbers per doc` 行。

## 证据八 · 检查器自身的变异测试

前七条证据都假设检查器本身可靠，这一条反过来检验它们，分两部分：每次运行都重跑的变异测试，和记录在案但没有接入流水线的一次性故障注入。

### 8a. 每次运行：`mutate_anchor_checks.mjs`（verdict `anchorCheckers`）

测试文档由符号索引和 bundle 现场生成，不需要维护任何固定样例，随每个版本自动更新。先确认每个检查器对干净文档通过，再每次注入一个错误，确认负责的检查器失败；检查器进程并发运行（`JOBS=1` 时依次运行）。已提交报告中为 `pass`，即全部变异都被报出。注入的错误按类别如下：

| 类别 | 注入的错误 | 负责报出 |
|------|-----------|----------|
| 带行号的名字引用 | F1 短名换错；F2 短名换错、范围倒置、短名只作为更长单词的一部分出现在所引行上、cli 引用的短名换错 | `verify_citations`、`check_doc_anchors` |
| 不带行号的名字引用 | `真名 (短名)` 的短名换错、真名不存在、PascalCase 类名不存在、两个 bundle 共有的真名配了另一个 bundle 的短名（不带前缀配 cli 短名，带 `cli:` 前缀配 daemon 短名）；`真名/短名` 的短名换错、真名不存在、围栏图里的短名换错、短名是没被索引的全小写记号、两半都没被索引 | `verify_citations` |
| 带行号的代码片段 | F3 行号挪动 50 行；片段保留字面量但调用的短名已被重新分配；形如 `foo(x)` 的调用片段行号错误；cli 引用丢掉 `cli.pretty.js:` 前缀 | `check_bare_anchors` |
| 不带行号的代码片段 | 绑定到不包含它的符号、绑定到没被索引的真名、绑定到没被索引的 `UPPER_SNAKE` 常量名；常量片段名字对但数字错（长短名各一例），或写成同一范围里另一个常量的数字 | `check_bare_anchors` |
| 裸行号与上限 | 新增裸行号；倒置的范围；正文里的 `daemon:N`、`daemon.pretty.js:N / N`、`cli.pretty.js:N`；一个代码 span 里写多个行号；以行号开头的代码 span；围栏图里的行号；表格里以空格限定 bundle 的行号；片段后不带反引号的括号行号；新增一个写法正确的 F1 行号（超过上限）；用 `--write-baseline` 调高上限 | `check_bare_anchors` |
| 错误的 bundle | 整个 bundle 下移一行 | 三个检查器都以 exit 2 拒绝 |
| 推断名的种类 | 常量的字面量被改；初始化器的名字挪到无关的初始化器、挪到函数上、挪到没有字面量也没有常量的初始化器上、挪到只共享一个常量的初始化器上；只共享默认值且原模块已不存在；没有基线时把函数名放到初始化器上（`check` 失败，`record` 拒绝写入），把常量名放到函数上；两个形状相同的初始化器（期望 `warn`，不能通过） | `verify_inferred` |

### 8b. 一次性故障注入（没有接入流水线）

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
| `promote.mjs write` 面对 `citations=fail`、`skipped`、从未运行的闸门、`inferredNames=warn`、`beautifyEquivalent=skipped`、`package=unrecorded`、缺出厂哈希、大写的 `PASS` | 全部拒绝，目标目录的内容不变 | v0.8.3 |
| `PROMOTE=1` 只给 `BEAUTIFIED`；`PKG` 下没有 `package.json`；`PKG_VERSION` 与包版本矛盾；文档目标版本不符；同时给 `PKG` 与 `BEAUTIFIED` | 全部在创建 `$OUT` 之前拒绝 | v0.8.3 |
| `name_symbol.mjs` 登记第三方导出、第三方模块的初始化器、已有名字的符号、未初始化的 var、孪生初始化器、字面量与其他常量相同的常量、与变量或全局名同名、与已有真名同名、写法与种类不符、短于 8 个字符、未知子系统、同一批次内重名 | 全部拒绝；zod-to-json-schema 的函数不加 `--allow-unproven` 一律拒绝；以 `--allow-unproven` 登记的名字不再成为其他条目的证据 | v0.8.3 |
| 把 `check_doc_anchors` 的核对函数改成恒真 | 变异测试在并发与 `JOBS=1` 两种模式下都报出存活的变异，以 exit 1 结束：并发执行没有让测试失去失败能力 | v0.8.3 |
| 用不含 `eb4a5e5` 改动的检查器运行其中新增的变异用例 | 新增用例全部存活：它们确实区分得出两版检查器 | v0.8.3 |

## 证据九 · 已提交产物即生成产物，并绑定到出厂字节

证据一至八证明的都是 `$OUT` 里的文件。这一条把它们变成仓库里文件的结论，由三部分组成：

- **已提交产物等于生成产物**（verdict `committedInSync`）。check 模式把 `recon/daemon.recon.js`、`maps/` 下的生成文件、两份改名表和整棵 `first-party/` 与本次生成的逐一比较，并要求已提交的报告本身满足 promote 条件：每个证明类 verdict 为 `pass`、版本号是正式版本、每个 bundle 的出厂与美化哈希都在。
- **记录绑定到字节**。报告的 `sha256.<bundle>.shipped` 与 `sha256.<bundle>.pretty` 记录了生成它的运行读到的出厂文件与美化文件；check 模式比较报告时，这两个哈希必须与本次运行一致（没给 `PKG` 的运行读不到出厂文件，只比较美化哈希）。
- **文档与 `maps/` 描述同一版本**（verdict `anchorTargetMatches`）：`docs/.pretty-anchor-target` 必须等于已提交报告的 `package`。

v0.8.3 的已提交报告里 `committedInSync` 为 `promoted`，表示它由一次写入成功的 `PROMOTE=1` 运行生成；`anchorTargetMatches` 为 `pass`。2026-09-24 用 v0.8.3 出厂包做的一次 check 模式运行（Node v22.23.3，`/bin/bash` 3.2）中，全部 verdict 为 `pass`，其中 `committedInSync=pass`：每个比较过的产物都与已提交版本一致，包括报告里的两组哈希。

美化输出按版本写到 `$OUT/beautified/<版本>/`，旧的平铺目录里残留的美化文件在每次运行时删除。手工用 `BEAUTIFIED=` 指定的目录仍可能过期，而 `bundle_guard.mjs` 在 `rebuild.sh` 里拦不住它：流水线的符号索引由本次运行从同一份美化文件生成，二者总是一致。流水线内由别的闸门暴露它：推断名表以短名为键，放到另一个版本的美化文件上会落到别的声明上，`daemon.inferredNames` 记为 `fail`，构建在第 2b 步停止（2026-09-24 用 v0.8.2 的美化文件对照 v0.8.3 的 `maps/` 实测：236 个推断名被推翻，exit 1）；同时给了 `PKG` 时，美化等价证明也会失败；没给 `PKG` 的运行没有版本号，即使走到第 7 步也只能记 `committedInSync=unverified`。`bundle_guard.mjs` 拦下的是另一种情形：在流水线之外，拿过期的美化文件对照已提交的 `maps/symbols_*.json` 手工运行检查器时，它以 exit 2 拒绝（证据八 8a 的"错误的 bundle"）。

---

## 汇总（v0.8.3）

已提交报告的 verdicts：

| 闸门 | verdict 键 | daemon | cli |
|------|-----------|--------|-----|
| 无损拆包 | `<bundle>.lossless` | pass | pass |
| 出厂 ≡ 美化 | `<bundle>.beautifyEquivalent` | pass | pass |
| 模块闸门 | 无（失败即停止构建） | 通过 | 通过 |
| 推断名 | `<bundle>.inferredNames` | pass | 无推断名 |
| 语法（按 ESM 解析） | `<bundle>.syntax` | pass | pass |
| AST 全等 | `<bundle>.astEquivalent` | pass | pass |

| 闸门（整次运行） | verdict 键 | 结论 |
|------------------|-----------|------|
| 可读树 | `firstPartyTree` | pass |
| 文档引用身份 | `citations` | pass |
| 行号、片段与上限 | `lineAnchors` | pass |
| 检查器变异测试 | `anchorCheckers` | pass |
| 文档目标版本 = 报告版本 | `anchorTargetMatches` | pass |
| 已提交产物 = 生成产物 | `committedInSync` | promoted（2026-09-24 的 check 运行为 pass） |
| 出厂与美化字节 | `sha256` | daemon、cli 均已记录 |
| 实机 A/B 对照 | 无 | 人工对照，版本与覆盖路径见证据四 |

覆盖面限于有自研导出表的 daemon 与 cli。`stdio`、`pi-worker`、`channel-acp`、`feishu-gateway` 几乎恢复不出自研真名，不进入流水线，没有任何检查；`duoduo` 命令实际执行的 cli、daemon、pi-worker 三个 bundle 里，pi-worker 没有还原。

**结论**：在 v0.8.3 上，所覆盖 bundle 的还原产物与出厂产物语义全等（两处不覆盖的行为见证据三），仓库里的产物就是由记录了哈希的出厂字节生成的；运行效果在实机对照覆盖的路径上一致（对照所在版本与覆盖范围见证据四）。

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

# 1) 证据一至三、六至九：一次 check 模式运行，只写 $OUT，不改仓库；
#    结论在 $OUT/verdicts.txt 与 $OUT/pipeline_report.json
PKG="$PKG" bash rebuild.sh

# 2) 证据五（仅升级时）：OLD 是 maps/ 记录的版本，NEW 是新版本；
#    其后的步骤按 bump.sh 打印的顺序执行（README.md「跟随上游升级」）
PKG_OLD="$PKG" PKG_NEW=<新版本的 dist/release> bash bump.sh

# 3) 证据四：隔离 HOME + 备用端口，勿用默认 :20233
ISO=/tmp/iso083 && mkdir -p "$ISO" && chmod 700 "$ISO"
cp ../recon/daemon.recon.js "$PKG/" && cd "$PKG"
HOME="$ISO" ALADUO_PORT=20334 ALADUO_LOG_LEVEL=info \
  ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" ALADUO_RUNTIME_MODE=host \
  ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local node daemon.recon.js &
curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
curl -s -H 'Content-Type: application/json' \
  --unix-socket "$ISO/.aladuo/run/daemon.sock" http://localhost/rpc \
  -XPOST -d '{"jsonrpc":"2.0","id":2,"method":"system.status","params":{}}'
kill %1
# A/B：出厂版用同样的命令启动 daemon.js，换一个隔离 HOME 与端口，
# 比较两边的启动日志、HOME 文件树与 RPC 返回
```

实机运行的几处注意事项，每一处都会让探测结果看起来像别的问题：

- 隔离 HOME 的路径要短：`<HOME>/.aladuo/run/daemon.sock` 超过 unix socket 的 104 字节上限时，daemon 直接 fatal 退出。
- socket 路径写成隔离 HOME 的绝对路径。写 `"$HOME/..."` 会展开成外层真实的 HOME，探到的是本机正在运行的 daemon。
- `curl` 必须带 `-H 'Content-Type: application/json'`。`curl -d` 默认发 form 编码，fastify 在 JSON-RPC 分发之前就返回 415，看起来像端点坏了。
- 默认日志级别是 `warn`；要观察启动期行为必须设 `ALADUO_LOG_LEVEL=info`，否则会误以为代码没有执行。
- 只直接用 `node` 启动还原 daemon，不要在隔离 HOME 里运行 `duoduo daemon start|stop|restart`：在 macOS 上它们按用户级 launchd label `ai.openduo.daemon` 操作，会停掉并替换本机真实的 daemon。
