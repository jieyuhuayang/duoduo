# duoduo 源代码还原（Source Reconstruction）

`@openduo/duoduo` 只以 esbuild 压缩后的 JavaScript 发布（作者的说法是：代码写给 agent 读，压缩是为了压缩，不是为了混淆）。本目录把其中的 daemon 与 cli 两个 bundle 还原成可读的源代码，并让两件事可以被机器反复核对：还原产物与出厂产物是同一个程序；分析文档里每一处对代码的引用都指向它声称的代码。支撑这两件事的是四个事实：变换链的每一步都被证明不改程序；名字和归属来自 bundle 自身的结构，人工判断只存在于几份受检查的映射里；文档引用按符号身份核对；结果绑定到具体的出厂字节，只有全部闸门通过才写进仓库。

对齐的版本、全部计数和每道闸门的结论（`verdicts`）以 [`maps/pipeline_report.json`](./maps/pipeline_report.json) 为准，本文不复述数字。逐条证据见 [VERIFICATION.md](./VERIFICATION.md)。

## 目录结构

### 生成的产物

下列文件全部由 `tools/rebuild.sh` 生成，不手工编辑；`PROMOTE=1` 是它们进入仓库的唯一途径。

| 路径 | 内容 |
|------|------|
| `recon/daemon.recon.js` | 可运行的还原 daemon。与出厂 `daemon.js` 的 AST 在改名表之外全等，只把一等公民符号改回真名；排版与美化后的 bundle 相同，所以两者行号一致。只能在复制进出厂包的 `dist/release/` 后运行，因为它按 `import.meta.url` 解析 `../../package.json`、`../../bootstrap` 和同目录的 `pi-worker.js`。 |
| `first-party/<NN-子系统>/<真名>.js` | daemon 自研符号的可读单文件，每个改名符号恰好一个文件，按 `maps/subsys_daemon.json` 分目录，`first-party/index.json` 是索引。文件头给出短名、声明所在的美化行号，以及 `// name:` 行：名字是上游的导出名，还是本仓库推断的名字。只供阅读，不能单独运行。 |
| `maps/blocks_<bundle>.json` | 按源模块分组的 `__export` 导出名，外加 bundle 顶层 `export {}` 的入口导出。身份判定的输入。 |
| `maps/rename_<bundle>.json` | 实际应用的改名表（短名 → 真名）。 |
| `maps/symbols_<bundle>.json` | 符号索引：真名 → 短名、声明行、结束行、种类、结构签名。"某个符号在哪"以它为准，行号由它派生，不手写。 |
| `maps/<bundle>.exports.json` | 全部导出名的压平视图。跨模块重名在这里会被后写者覆盖，按模块分组的准确版本是 `blocks_*.json`。 |
| `maps/RENAME_TABLE.md`、`maps/RENAME_TABLE_cli.md` | 改名表的可读版本，按子系统分组，注明名字来源与声明行。 |
| `maps/pipeline_report.json` | 一次运行测得的全部计数、每道闸门的结论（`verdicts`）、出厂与美化 bundle 的 sha256（`sha256.<bundle>.{shipped,pretty}`）和工具链版本（`environment`）。只随 `PROMOTE=1` 与它描述的产物一起写入。 |
| `.build/`（`$OUT`，不提交） | 一次运行的全部中间结果：`beautified/<版本>/*.pretty.js`、拆包目录、`cli.recon.js`、`verdicts.txt`，以及 `bump.sh` 的输出目录 `bump/`。`cli.recon.js` 不提交：它的改名很少（数量见报告），而且每次版本迁移都会整体重写。 |

### 人工维护的映射

流水线里的人工判断全部集中在下面几份映射里，其余产物都由它们和出厂 bundle 派生。每一份都有对应的检查；和推断名有关的三份最容易出错，检查也最多。

| 文件 | 记录什么 | 如何写入 | 由谁检查 |
|------|----------|----------|----------|
| `maps/modules_<bundle>.json` | 每个 `__export` 块（即每个源模块）是 duoduo 自研还是内联的第三方库。每条记录列出该模块的若干导出名作 marker，块里出现其中 min(2, marker 数) 个即算匹配，所以版本间导出名有增减也能匹配；一个块匹配多条记录时取 marker 命中比例最高的一条，比例相同再取导出名数量最接近记录值的一条。 | 人工 | `build_rename.mjs` 的模块闸门：匹配不上任何记录、或以相同比例同时匹配自研与第三方记录的块，让构建失败并列出该块的全部导出名 |
| `maps/inferred_daemon.json` | 没有被导出的 daemon 符号的推断名（短名 → 真名）。可以落在三种代码上：函数、esbuild 模块初始化器（命名为 `init<Name>Module`）、字面量常量（命名为 `UPPER_SNAKE`）。 | `name_symbol.mjs` 登记；升级时由 `remap_inferred.mjs` 承接，再人工复核 | `verify_inferred.mjs check`，每次运行（verdict `daemon.inferredNames`） |
| `maps/inferred_daemon.shape.json` | 推断名在最近一次人工复核时的形态基线：种类、参数个数、字面量集合、成员属性名集合；模块初始化器另记它所赋字面量常量的哈希，常量记规范化字面量的哈希。 | 复核后运行 `verify_inferred.mjs record`（设置了 `PKG_VERSION` 时写入版本）；`name_symbol.mjs` 只追加新名字的条目 | `verify_inferred.mjs check` 与它比较 |
| `maps/inferred_daemon.asserted.json` | 以 `--allow-unproven` 登记的推断名，及登记时的归属判定。 | `name_symbol.mjs`（第一次有这样的登记时创建） | `name_symbol.mjs` 的归属判定不把这些名字当作"是自研代码"的证据 |
| `maps/subsys_daemon.json` | 每个 daemon 改名符号所属的子系统目录（`NN-name`）。 | `name_symbol.mjs` 或人工 | `extract_functions.mjs`、`gen_rename_table.mjs` 要求它与改名表一一对应，否则在写任何文件前失败；`verify_first_party.mjs` 核对每个文件所在的目录 |
| `maps/bare_anchor_baseline.json` | `docs/` 下每份文档的行号总数上限（`lineNumbers`）与裸行号数上限（`unbound`，为 0），按文件名作键。 | `check_bare_anchors.mjs --write-baseline`，只能调低（`--allow-raise` 只用于新文档） | `check_bare_anchors.mjs`：任一文档超过上限即失败 |

## 为什么还原可信

### 变换链的每一步都被证明不改程序

还原是一条语义保持的变换链：美化 → 无损拆包 → 作用域安全改名。每一步都有独立的证明，每次带 `PKG` 的运行都重做一遍。

**美化只改排版。** `js-beautify` 在 `tools/package.json` 里锁定精确版本，因为 `docs/` 与 `first-party/` 里的行号都来自它的排版，格式化器的一次小版本更新就会让所有行号一起偏移。`ast_equiv.mjs` 比对出厂压缩文件与 `*.pretty.js` 的 AST（verdict `<bundle>.beautifyEquivalent`）。没有这一步，后面所有证明的起点都是一个不随包发布的文件。

**拆包无损。** `split.mjs` 按顶层语句的字节偏移把 bundle 切成模块文件与 shell 片段，`reassemble.mjs` 按 manifest 拼回，与美化文件 `cmp` 逐字节相同（verdict `<bundle>.lossless`）。切片是连续的字节区间，所以这项证明主要防的是写文件出错：压缩标识符常常只差大小写（`Rw` 与 `rW`），片段文件名因此做成大小写不敏感唯一，否则在 macOS 与 Windows 上后写的文件会覆盖前一个。后续步骤不读拆出的模块，`rename.mjs` 直接处理美化后的 bundle。

**改名作用域安全。** `rename.mjs` 对每个标识符做作用域解析，只改写解析到目标顶层绑定的位置，包括重复的 `var` 声明、解构赋值和 for-in/of 的写入位置；对象 shorthand、`export { X }`、`import { X }` 展开成保留外部名字的写法。新名字若与已有顶层名或代码用到的全局名冲突，或在某个引用处会被内层同名绑定遮蔽，改名被拒绝，构建失败。改名只替换标识符文本，不动排版。

**改名前后语义全等。** `ast_equiv.mjs` 并行遍历美化 bundle 与还原产物的两棵 AST，要求每个节点类型与字面量相同；标识符按它解析到的绑定比较：两边的声明必须一一对应，全局名必须保持同名全局，只有改名表列出的顶层绑定可以换名（verdict `<bundle>.astEquivalent`）。按拼写比较会放过一处没改名的引用（运行时 `ReferenceError`），或把 `process.on` 这种成员属性当成变量改掉，所以比较按绑定进行。语法另用 `node --input-type=module --check` 检查（verdict `<bundle>.syntax`）：对上层没有 `"type":"module"` 的 ESM `.js` 文件，`node --check` 会放过语法错误。

等价证明有两处不覆盖的行为：读取函数自身名字的代码（`Function.prototype.name`、类的 `constructor.name`、调用栈文本）在还原版里看到的是真名；内联的 gray-matter 有一处 direct `eval()`，被 eval 的代码按名字看得到模块作用域。duoduo 自研代码不读取被改名函数的名字，控制流不受影响。

### 名字与归属来自 bundle 的结构

**上游的名字从 bundle 里逐字读出。** esbuild 只给运行时需要导出对象的模块生成 `__export(exports, { 真名: () => 短名 })` 调用，典型是被动态 `import()` 的模块；原始导出名逐字保存在调用里。一个块对应一个源模块，但大多数模块没有块，它们的函数只能推断命名。bundle 顶层的 `export {}` 另外记录入口模块的导出。`export_blocks.mjs` 按调用把导出名分组。上游名字与推断名各有多少，见报告 `bundles.<bundle>` 下的 `firstPartyNamesFromBlocks`、`namesFromEntryExports` 与 `inferredNames`。

**归属按模块判定，不按名字判定。** `build_rename.mjs` 用 `maps/modules_<bundle>.json` 判定每个块是自研还是第三方，只把自研块的名字、入口导出和推断名放进改名表；匹配不上任何记录的块让构建失败。按名字的关键词判定会系统性漏判：整个 Grok 模块只导出 `GROK_ACP_*` 形式的常量，任何关键词都命中不了；`pi` 写成子串规则会命中 `pipeline` 与 `api`。按模块判定时，新版本带来的是"一个待判定的模块"，而不是一批无法归类的名字。

**推断名每次运行都被检查。** 没有被导出的内部符号只能人工推断名字。推断名贴错了声明时，其余检查全部照常通过，因为改名是作用域安全的，而 `verify_first_party.mjs` 只证明可读树、改名表和还原产物三者互相一致。所以 `verify_inferred.mjs` 对每个推断名做下表三项检查：

| 检查 | 让构建失败 | 只告警（`warn`） |
|------|-----------|------------------|
| 种类与拼写（不需要基线） | 名字解析到的不是函数、esbuild 模块初始化器或字面量常量；初始化器里既没有字符串字面量也没有常量（没有任何东西能推翻放在它上面的名字）；名字写法与种类不符：函数须为 camelCase 且不是 `init…Module`，初始化器须为 `init<Name>Module`，常量须为 `UPPER_SNAKE`。拼写规则单独就能拒绝把函数名放到 lazy-init 包装器上。 | — |
| 与形态基线比较 | 种类变化；初始化器与基线不共享任何非默认的字面量或常量，或另有一个初始化器比它更吻合基线；常量的规范化字面量与基线不同 | 函数参数个数变化，或与基线不共享任何字符串字面量；初始化器所赋常量有变化，或另有初始化器与它同样吻合基线；另有常量的字面量与它相同 |
| 互换检测 | 某个声明与另一个推断名的基线明显更吻合（名字被互换，或挪到了同种类的相邻声明上） | — |

退出码 0 记为 `pass`，3 记为 `warn`（没有名字被推翻，但有告警需要人工复读），1 让构建失败。`warn` 不能被 promote：复读之后运行 `verify_inferred.mjs record`，下一次运行得到 `pass`，复核因此留有记录。

**新推断名用 `name_symbol.mjs` 登记。** 它在写入前做完上面的种类、拼写与孪生检查，另外核对：bundle 就是 `maps/` 描述的版本；目标还没有名字；真名至少 8 个字符，在 bundle 里不作为任何变量名或全局名出现，也不与任何 bundle 的真名或导出名重复；子系统是已有目录之一；目标属于自研代码。归属的证据来自一条不对称关系：第三方库不会按名字引用 duoduo 的代码。所以被第三方块导出或被第三方代码引用，是第三方的证据；引用上游真名，是自研的证据；证据按 esbuild 模块整体判定。没有任何引用证据的条目必须显式加 `--allow-unproven`，并记入 `inferred_daemon.asserted.json`；只经由这类名字才连到自研代码的条目同样算没有证据。第三方证据在任何情况下都不能被覆盖。批量登记（`--batch`）要么全部写入，要么什么都不写。

### 文档引用按符号身份核对

分析文档用两种不带行号的写法指向代码；行号只作为遗留写法存在，数量只能减少。写法定义在 `tools/anchor_forms.mjs`，检查分工如下：

| 写法 | 检查器与 verdict | 检查什么 | 扫描范围 |
|------|------------------|----------|----------|
| `` `真名 (短名)` `` 与 `真名/短名`，可带 `cli:` 或 `daemon:` 前缀 | `verify_citations.mjs`，verdict `citations` | 真名必须在符号索引里，短名必须是它当前的短名。每一对只按一个 bundle 判定：有前缀按前缀，否则 daemon 有这个真名时按 daemon。真名不在索引里时，只要写法像真名（camelCase、`UPPER_SNAKE` 或至少两段的 PascalCase，至少 8 个字符）并且配对的是短名形状的记号，就报"符号不存在"（斜杠写法还要求短名已被索引，或具有压缩名的形状）。同一写法带遗留行号时另核对行号：漂移只报告，`--fix` 机械重写。 | `docs/*.md`、`reconstruction/*.md`、`CLAUDE.md`；正文、表格与围栏图都扫描 |
| `` `代码片段`（`真名`） ``，cli 符号写 `cli:真名` | `check_bare_anchors.mjs`，verdict `lineAnchors` | 片段里至少一个特征记号（长度不少于 2 的字符串字面量，或至少 3 个字符的非关键字标识符）和片段调用的每个短名，都必须落在该符号当前的声明范围内，标识符按整词匹配；片段写出的每个数字都必须在范围内；`名字 = 数字表达式` 形式的子句必须作为完整的记号序列出现。没有特征记号的片段（只由短标识符、数字和运算符组成）至少要有 3 个记号并含一个数字，整段必须作为完整的记号序列出现在范围内；达不到这个条件的片段无法检查，判为不成立。 | `docs/*.md` |
| 遗留：`` `短名`（`行号`） `` | `check_doc_anchors.mjs`，verdict `lineAnchors` | 短名作为完整标识符出现在所引行上，或者所引行位于以该短名命名的顶层声明之内（`rebuild.sh` 以 `--resolve` 运行它；不加 `--resolve` 时只认前一条）；带 `cli.pretty.js:` 前缀的引用按 cli bundle 核对。 | `docs/*.md` |
| 遗留：`` `代码片段`（`行号`） ``，以及三种写法之外的任何行号 | `check_bare_anchors.mjs`，verdict `lineAnchors` | 片段须在所引行上；写法之外的行号是"裸行号"；每份文档的行号总数与裸行号数不得超过 `maps/bare_anchor_baseline.json`。围栏里的行号只计一次。 | `docs/*.md` |

三个检查器读 bundle 前都经过 `bundle_guard.mjs`：索引里每个符号的短名必须出现在记录的声明行上，否则以 exit 2 拒绝。没有这道检查，拿另一个版本的美化文件对照已提交的 `maps/symbols_*.json` 手工运行检查器，会把正确的引用报成"行号越界"，`--fix` 还会据此把它们改坏。`rebuild.sh` 里的索引由本次运行从同一份美化文件生成，二者总是一致，所以这道检查在流水线内不会触发。流水线内一份过期的 `BEAUTIFIED` 目录由推断名检查暴露：推断名表以短名为键，放到另一个版本上会落到别的声明上，`daemon.inferredNames` 记为 `fail`，构建在第 2b 步停止（实测见 VERIFICATION.md 证据九）。

检查器本身由 `mutate_anchor_checks.mjs` 检验（verdict `anchorCheckers`）：每次运行都用符号索引和 bundle 现场生成一份测试文档，确认每个检查器对它通过，再逐一注入已知错误，确认负责的检查器失败；`verify_inferred.mjs` 的初始化器与常量规则也在这里测试。一个从没被看到失败过的检查器证明不了任何事。用例类别见 VERIFICATION.md 证据八。

遗留行号可以用 `convert_line_citations.mjs` 退役：F1 `` `真名 (短名)`（`行号`） `` 去掉行号；F2 的短名在索引里有真名时改成 `` `真名 (短名)` ``；F3 片段在唯一一个已索引符号包含全部被引行、并通过严格检查时改成 `` `代码片段`（`真名`） ``。每处改写都要求原引用今天成立；改写后的文档先写进临时目录，用三个真实检查器运行，凡是新出现的失败都回滚对应的改写。改写不增删换行，第二次运行不改任何字节。默认只做 dry run；`--write` 之后在同一次提交里用 `check_bare_anchors.mjs --write-baseline` 调低上限。转换不了的引用按原因列出（`--report` 写出逐条明细）；其中落在未命名函数、初始化器或常量里的，按"命名后能转换多少处"排序。排序里的 daemon 符号可以用 `name_symbol.mjs` 命名后重跑转换；cli 符号不能，因为 cli 还没有推断名映射（见"未实现"表）。

### 结果绑定到出厂字节，全部闸门通过才写入仓库

不带 `PROMOTE` 的运行只写 `$OUT`，并用 `promote.mjs check` 把生成的产物与已提交的 `recon/`、`maps/`、`first-party/` 逐一比较（verdict `committedInSync`）：

| 取值 | 含义 |
|------|------|
| `pass` | 全部一致，且已提交的报告本身可以被 promote（条件见下） |
| `fail` | 已提交报告声称的版本与本次相同，并且产物不一致（过期或被手改），或已提交报告本身不满足 promote 条件；版本不同的运行记为 `retarget-pending`，没有版本记录或用了 `MAPS` 覆盖的运行记为 `unverified` |
| `retarget-pending` | 已提交产物属于另一个版本，升级进行中 |
| `unverified` | 运行没有版本号（没给 `PKG`），或用了 `MAPS` 覆盖：差异说明不了已提交产物是否同步 |
| `promoted` / `promote-refused` | `PROMOTE=1` 运行写入成功 / 被拒绝 |

`docs/.pretty-anchor-target`（文档对齐的版本）与已提交报告的 `package` 另做比较（verdict `anchorTargetMatches`）：相同为 `pass`；文档已改指到本次运行的新版本、而 `maps/` 还没有 promote 时为 `retarget-pending`；其余为 `fail`。报告还记录本次读到的每个出厂 bundle 与美化 bundle 的 sha256，所以一份记录对应的是具体的字节，而不只是一个可以手填的版本字符串。

`PROMOTE=1` 在创建 `$OUT` 之前先做预检，下列任一条件不满足就拒绝，什么都不写：

- `PKG` 指向一个已安装的 `@openduo/duoduo` 的 `dist/release`，版本号从它的 `package.json` 读取，并且形如 `vX.Y.Z`；
- 没有设置 `BEAUTIFIED`：promote 写入的行号来自格式化器的排版，而美化等价证明只证明 AST 相同，不证明排版来自锁定版本的 js-beautify；
- 没有设置 `MAPS` 覆盖；
- `docs/.pretty-anchor-target` 已经是这个版本，即文档已经改指到要 promote 的版本。

预检通过后，第 8 到 11 步检查的是 `$OUT` 里的候选产物，不是已提交产物。`promote.mjs write` 只在下列条件全部成立时写入：报告里每个证明类 verdict 都恰好是 `pass`（各 bundle 的 `lossless`、`beautifyEquivalent`、`syntax`、`astEquivalent`，有推断名表的 bundle 的 `inferredNames`，以及 `firstPartyTree`、`citations`、`lineAnchors`、`anchorCheckers`、`anchorTargetMatches`）；版本号是正式版本；每个 bundle 的出厂与美化哈希都在。`skipped`、`warn`、`fail` 和从没运行过的闸门一律拒绝。check 模式的逐字比较不看 verdicts（报告的 `verdicts` 字段不参与比较），所以 `promote.mjs check` 另外对已提交的报告套用同一条规则：已提交报告不满足它时，即使每个产物都一致，`committedInSync` 也记为 `fail`（见上表）。

## 如何复现

```bash
# Node 主版本以仓库根目录的 .nvmrc 为准。CI 的 setup-node 读同一个文件；
# rebuild.sh 遇到别的主版本只打印警告，但结果不保证与 CI 一致。
cd reconstruction/tools && npm ci
V=$(node -p 'require("../maps/pipeline_report.json").package.slice(1)')   # 报告记录的版本
npm install --prefix /tmp/duoduo-pkg "@openduo/duoduo@$V" --ignore-scripts --no-audit --no-fund
PKG=/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release bash rebuild.sh
```

出厂包装到独立前缀，而不是升级全局安装，以免扰动本机正在运行的实例。一次运行按下表进行；第 1 到 6 步对 daemon 与 cli 并发执行。任何一道闸门记为 `fail` 都让构建以 exit 1 结束；`warn` 与 `skipped` 不让构建失败，但 promote 会拒绝。

| 步骤 | 做什么 | verdict |
|------|--------|---------|
| 0 | 用锁定的 js-beautify 美化出厂 bundle，输出到 `$OUT/beautified/<版本>/`（该目录整体重写，旧的平铺目录里残留的 `*.pretty.js` 被删除） | — |
| 1 | 拆包、拼回、`cmp` | `<bundle>.lossless` |
| 1b | 出厂压缩文件与 `*.pretty.js` 的 AST 等价（需要 `PKG`） | `<bundle>.beautifyEquivalent` |
| 2 | 按模块分组的导出名 → 模块闸门 → 改名表 | 失败即停止构建 |
| 2b | 推断名检查（有推断名表的 bundle，即 daemon） | `<bundle>.inferredNames` |
| 3、4 | 作用域安全改名；ESM 语法检查；AST 按绑定全等 | `<bundle>.syntax`、`<bundle>.astEquivalent` |
| 5、6 | 符号索引、改名表、导出视图；daemon 的 `first-party/` 树（有改名符号缺子系统时在此失败） | — |
| 7 | 与已提交产物比较（PROMOTE 模式跳过，由第 12 步写入） | `committedInSync` |
| 7b | `docs/.pretty-anchor-target` 与已提交报告的版本比较 | `anchorTargetMatches` |
| 8 | 可读树六项检查：check 模式查已提交的树，PROMOTE 或 `MAPS` 覆盖时查候选树 | `firstPartyTree` |
| 9 | 引用身份 | `citations` |
| 10 | 短名行号、片段、裸行号与上限 | `lineAnchors` |
| 11 | 检查器变异测试 | `anchorCheckers` |
| 12 | 写 `pipeline_report.json`；PROMOTE 模式下写入仓库 | — |

环境变量：

| 变量 | 作用 |
|------|------|
| `PKG` | 出厂 `dist/release` 目录。完整证明需要它：版本号从包的 `package.json` 读取，美化等价证明要读出厂文件，报告要记录出厂哈希。 |
| `PKG_VERSION` | 通常不设。与包内版本不符时直接失败。 |
| `OUT` | 输出目录，默认 `reconstruction/.build`。 |
| `JOBS=1` | 两个 bundle 依次运行，变异测试的检查器也依次运行，用于定位失败；失败照样让构建失败。 |
| `BEAUTIFIED=<目录>` | 跳过美化，直接用该目录里的 `*.pretty.js`。同时没给 `PKG` 时，美化等价证明记为 `skipped`，运行没有版本号，`committedInSync` 记为 `unverified`。`PROMOTE=1` 拒绝它。 |
| `MAPS=<目录>` | 从映射副本读取人工维护的映射（modules、inferred、shape、subsys、行号上限），用来在不改仓库的前提下端到端试一次命名（配合 `name_symbol.mjs --maps <目录>`）。`committedInSync` 记为 `unverified`，第 8 步检查候选树。`PROMOTE=1` 拒绝它。 |
| `PROMOTE=1` | 预检通过、全部闸门对候选产物通过后，把结果写进 `recon/`、`maps/`、`first-party/`。 |

## 跟随上游升级

升级不能只重跑 `rebuild.sh`。`maps/inferred_daemon.json` 以短名为键，而 esbuild 每次构建都重新分配短名，旧表在新版本里不会报错，只会把名字贴到别的函数上。`tools/bump.sh` 按结构指纹（而不是名字）承接推断名，并把两个版本之间的变更整理成可复核的 diff；它之后的步骤顺序由闸门决定：promote 要求形态基线已经记录、文档已经改指到新版本、每个 verdict 都是 `pass`，缺一个就会被拒绝。完整流程如下：

1. 取新旧两个出厂包，运行 `bump.sh`：

   ```bash
   npm install --prefix /tmp/duoduo-old "@openduo/duoduo@<旧版本>" --ignore-scripts
   npm install --prefix /tmp/duoduo-new "@openduo/duoduo@<新版本>" --ignore-scripts
   PKG_OLD=/tmp/duoduo-old/node_modules/@openduo/duoduo/dist/release \
   PKG_NEW=/tmp/duoduo-new/node_modules/@openduo/duoduo/dist/release \
     bash tools/bump.sh
   ```

   `bump.sh` 用锁定的 js-beautify 美化两侧（也可以直接给美化目录 `OLD=`、`NEW=`；同时给了 `NEW` 与 `PKG_NEW` 时，先证明两者 AST 相同），然后依次：用 `bundle_guard.mjs` 核对 OLD 就是 `maps/` 描述的版本，不是则拒绝；逐声明做结构指纹匹配（`fingerprint_match.mjs`）；按结构身份承接推断名，承接不了的报 `RE-ANCHOR`（`remap_inferred.mjs`）；在 NEW 上跑模块闸门并生成 NEW 自己的改名表，列出需要补子系统的名字、`RE-ANCHOR` 待定的名字和上游已删除的名字；按顶层顺序配对变更与新增的声明（`pair_changes.mjs`）；逐声明输出标识符位置归一化后的 diff 与字面量增删，两侧各用自己版本的真名标注（`diff_decls.mjs`）；列出权威导出名的增删。它只处理 daemon 与 cli，只写 `.build/bump/`；模块闸门在 NEW 上失败时照常产出其余结果，最后以 exit 1 结束。
2. 人工复核。读 `.build/bump/diff/`。每个 `RE-ANCHOR` 用 `locate_by_anchor.mjs` 取该函数体内独有的字符串字面量，到新包里重新定位；它打印每个命中的种类，名字只能记到同种类的声明上。上游把字面量提升为模块级常量后，命中的是 esbuild 模块初始化器而不是函数，这时改用 `pairs_*.json` 的配对或 block 提示。把复核后的推断表复制进 `maps/`，在 `maps/modules_<bundle>.json` 里判定新模块，把新的自研名字归入子系统。
3. 记录形态基线：`PKG_VERSION=v<新版本> node tools/verify_inferred.mjs record <NEW>/daemon.pretty.js maps/inferred_daemon.json maps/inferred_daemon.shape.json`。没有这一步，下一步的 `inferredNames` 是 `warn`。
4. check 模式运行一次：`PKG=<新包 dist/release> bash tools/rebuild.sh`（输出在默认的 `reconstruction/.build`）。此时 `committedInSync` 为 `retarget-pending`，`citations` 与 `lineAnchors` 失败，`firstPartyTree` 也失败（check 模式用新 bundle 检查已提交的旧树），都在预期之内。这次运行产出下一步所需的符号索引、改名表和美化文件。
5. 对这次运行的 `$OUT` 改指文档：对每个有变化的 bundle 运行 `retarget_docs.mjs collect` 与 `remap_doc_anchors.mjs`；再运行 `retarget_docs.mjs apply --stamp v<新版本>`，它只能运行一次，会写 `docs/.pretty-anchor-target`，必须在 `verify_citations.mjs --fix` 写入新行号之前；然后运行 `retarget_symbols.mjs <旧 rename_daemon.json> <新 rename_daemon.json>` 和 `verify_citations.mjs --fix --bundle …`。`bump.sh` 最后会打印这一步的完整命令。
6. 文档通过引用检查后运行 `PROMOTE=1 PKG=<新包 dist/release> bash tools/rebuild.sh`。

按名字写的引用在升级时基本不需要迁移。`真名 (短名)` 与 `真名/短名` 只有短名会变，由 `retarget_symbols.mjs` 按一个 bundle 两个版本的改名表改写。它改写三种位置：恰好是一个标识符的代码 span、恰好是 `真名 (短名)`（不带 bundle 前缀）的代码 span、任何位置的斜杠对（包括围栏里的）；后两种配对只在旧改名表恰好把这个真名与这个短名配成一对时才改写。所以用 daemon 的改名表运行时，cli 的配对原样保留，即使它的短名碰巧同时也是某个 daemon 符号的短名（两个 bundle 各自独立压缩，这种重合很常见）；过期的 cli 配对由 `verify_citations.mjs` 报出，按第 4 步运行产出的 `symbols_cli.json` 手工修正。单个标识符的代码 span 没有真名可以核对，按给定的改名表改写，不论它原本指哪个 bundle。引号里的代码表达式不动。`代码片段`（`真名`）在该真名当前的声明范围内核对，片段在函数体内挪了位置照样成立。需要人看的只剩"符号消失""短名对不上""片段不在函数里了"，这些正是上游真实的机制变更。只写裸短名不可取：同一个短名可以既是过期名，又是新版本里另一个函数的正确名，任何"旧名换新名"的整体替换都会把本来正确的引用改错。没有真名的 daemon 代码先用 `name_symbol.mjs` 命名，再引用；cli 没有推断名映射，未命名的 cli 代码还不能按名字引用。

## 工具一览

| 工具 | 作用 |
|------|------|
| `rebuild.sh` | 整条流水线，见"如何复现"。 |
| `bump.sh` | 升级流程的第 1 步，见"跟随上游升级"。 |
| `split.mjs`、`reassemble.mjs` | 按字节偏移拆包；按 manifest 拼回。 |
| `export_blocks.mjs` | 按源模块分组恢复 `__export` 导出名与入口导出。 |
| `exports_map.mjs` | 压平的导出名视图（`*.exports.json`）；`bump.sh` 用它列导出名的增删。 |
| `build_rename.mjs` | 模块闸门，生成改名表。 |
| `rename.mjs` | 作用域安全、保留排版的顶层改名。 |
| `ast_equiv.mjs` | 证明两个文件的 AST 在改名表之外全等；不给改名表时证明完全相同。 |
| `symbol_index.mjs`、`structural_signature.mjs` | 符号索引；结构签名（内部绑定和对顶层符号的引用归一为位置占位，字面量、属性名与全局名保留）。 |
| `gen_rename_table.mjs`、`extract_functions.mjs` | 生成 `RENAME_TABLE*.md`；生成 `first-party/` 树。 |
| `verify_first_party.mjs` | 可读树的六项检查。 |
| `verify_inferred.mjs` | 推断名检查（`check`）与记录形态基线（`record`）。 |
| `name_symbol.mjs` | 登记新推断名：`<bundle.js> <短名> <真名> <子系统>`，或 `--batch <list.tsv\|list.json>`；可加 `--dry-run`、`--maps <目录>`、`--allow-unproven`。 |
| `locate_by_anchor.mjs` | 找出包含某个字符串字面量的顶层声明，并打印它的种类。 |
| `fingerprint_match.mjs`、`remap_inferred.mjs`、`pair_changes.mjs`、`diff_decls.mjs` | 升级时的结构指纹匹配、推断名承接、变更声明配对、逐声明 diff。 |
| `bundle_guard.mjs` | 拒绝与符号索引不符的 bundle。 |
| `pipeline_report.mjs`、`promote.mjs` | 写运行报告（含 sha256）；比较或写入已提交产物。 |
| `anchor_forms.mjs` | 引用写法的唯一定义，各检查器共用。 |
| `verify_citations.mjs`、`check_doc_anchors.mjs`、`check_bare_anchors.mjs` | 文档引用检查，分工见上文。 |
| `mutate_anchor_checks.mjs` | 检查器的变异测试。 |
| `convert_line_citations.mjs` | 把遗留行号引用改写成不带行号的写法：`--index <symbols_daemon.json>[,<symbols_cli.json>] --bundle daemon=<pretty> [--bundle cli=<pretty>] [--write] [--report <o.json>] <doc.md…>`。 |
| `remap_doc_anchors.mjs`、`retarget_docs.mjs`、`retarget_symbols.mjs` | 升级时迁移遗留行号与短名。 |

## 覆盖范围与边界

**只还原 daemon 与 cli。** 出厂包里另外四个 bundle 几乎恢复不出自研真名：`stdio` 只有顶层入口导出；`pi-worker` 与 `channel-acp` 是入口 bundle，自身模块被内联，导出表里只有内联的 zod；`feishu-gateway` 只恢复出一个名字。对一张空改名表做 AST 全等证明不构成证据，所以这四个 bundle 不进入流水线，也就没有任何检查，包括美化等价与无损拆包。`duoduo` 命令实际执行的 cli、daemon、pi-worker 三个 bundle 里，pi-worker（嵌入式 pi 运行时）没有还原，文档里关于 pi 运行时的论断没有可以自动核对的代码证据。

**第三方依赖只识别，不还原。** daemon 的大多数模块是内联的 npm 包（zod、fastify、ws 等），它们有公开源码；本目录只在 `maps/modules_daemon.json` 里逐模块标注，不改写。

**没有名字的内部符号保持短名。** 只有被 `__export` 记录的符号能拿到上游的名字；其余的内部函数、模块初始化器和常量，除了 `maps/inferred_daemon.json` 已经命名的以外，保留压缩短名。它们不影响运行，但文档不能按名字引用它们：daemon 的先用 `name_symbol.mjs` 命名。`convert_line_citations.mjs --report` 列出文档引用到的未命名符号，按命名后能转换的引用数排序。cli 没有推断名，也没有子系统映射和可读树，所以未命名的 cli 代码目前无法命名。

**顶层之外的函数不改名。** 改名器只处理顶层绑定。像 `createSessionManager` 内部的 `spawnSessionActor`、`wakeSessionActor` 这样的局部函数保留短名，也不在符号索引里；它们的短名每次构建都会变，文档不应固定引用。

**`first-party/` 的单文件不可独立运行。** 它们引用其他顶层符号，只供阅读；可运行的是 `recon/daemon.recon.js` 整体。声明在共享初始化语句里的常量，其文件装的是整条语句：每个 `GROK_ACP_*` 文件都包含整个 Grok 模块的初始化器。

**实机运行只覆盖部分路径。** AST 全等覆盖全部代码；实机 A/B 对照只跑到不需要真实模型调用的路径。最近一次对照在哪个版本上做、覆盖与未覆盖哪些路径，见 VERIFICATION.md 证据四。

配套分析文档见 [`../docs/AGENT_INTERNALS_ANALYSIS.md`](../docs/AGENT_INTERNALS_ANALYSIS.md)（子系统逻辑）与 [`../docs/SOURCE_RECONSTRUCTION.md`](../docs/SOURCE_RECONSTRUCTION.md)（还原方法论）。

## 已知局限与后续优化

流水线当前的状态分三方面。闸门方面，没有一道闸门能在什么都没检查的情况下通过：promote 只写每个证明类 verdict 都是 `pass` 的运行，版本号从出厂包读取，缺子系统的改名符号让构建失败，推断名的告警单独记为 `warn`，每种引用写法都有检查器负责。速度方面，带 `PKG` 的完整证明运行在 16 核机器上约 1 分钟。留下的工作主要是结构性的：流水线在一次运行里对两个 bundle 反复做全量解析；升级流程仍有几步靠人工；pi-worker 等四个 bundle 和局部函数不在覆盖范围内；片段与行号检查还没有扩展到 `docs/` 之外。

### 已实现

下表每一行写明一项改进现在保证什么；实测效果除另注明外取自 2026-09-24 在 v0.8.3 上的运行，箭头左边是没有这项改进时的测量值。

| 改进 | 现在保证什么 | 实测效果 |
|------|-------------|----------|
| PROMOTE 预检，候选产物先过闸门（`rebuild.sh`、`promote.mjs`） | 没给 `PKG`、给了 `BEAUTIFIED` 或 `MAPS`、版本号不是 `vX.Y.Z`、文档目标版本不符时，在创建 `$OUT` 之前拒绝；第 8 到 11 步检查候选产物，全部通过才写入，任一闸门失败时仓库不变；带 `skipped`、`warn` 或未运行 verdict 的报告不能写入 | 逐项注入 `fail`、`skipped`、`warn`、未运行、非正式版本（`unrecorded`、`v0.9.0-rc.1`、`v1.2.3.4`）、缺哈希，均被拒绝 |
| 报告记录出厂与美化 bundle 的 sha256；`anchorTargetMatches` | 一份记录对应具体的出厂字节；`docs/.pretty-anchor-target` 与 `maps/` 描述不同版本时构建失败 | 已提交报告带两组哈希 |
| 美化输出按版本分目录；`.nvmrc` 固定 Node 主版本，CI 读同一文件 | 不同版本的美化文件不在同一个目录里；本地运行的 Node 主版本与 CI 不同时打印警告 | `$OUT/beautified/<版本>/` |
| 子系统完整性（`extract_functions`、`gen_rename_table`、`verify_first_party`） | 没有子系统条目的改名符号在写任何文件前让构建失败；可读树的文件集合必须等于改名符号集合 | 故障注入见 VERIFICATION.md 证据八 8b |
| `verify_inferred`：告警记为 verdict，按种类检查拼写，函数、模块初始化器、常量三种种类 | 需要复读的形态变化记为 `warn`，promote 拒绝；名字放到种类不符的代码上（例如函数名放到初始化器上）不需要基线就失败 | 变异测试覆盖这些情形（证据八 8a） |
| 引用检查（`verify_citations`、`check_doc_anchors`、`check_bare_anchors`） | 不带行号的配对、`真名/短名` 写法、cli 的短名行号引用都有检查器负责；短名按整词匹配；常量片段写出的数字必须在范围内；围栏里的行号只计一次 | 在 `AGENT_INTERNALS_ANALYSIS.md` 上报出 4 处过期引用（均已修正）；对应的变异用例对没有这些规则的检查器全部存活 |
| 结构签名保留属性名与全局名（`structural_signature`） | 只差属性名或全局名的声明（`e => e.sessionId` 与 `e => e.channelId`）签名不同 | daemon 落在碰撞组里的声明 388 → 348；v0.8.2→v0.8.3 指纹唯一配对 2126 → 2170，与旧结果无矛盾 |
| `bump.sh` | 只处理 daemon 与 cli；`PKG_OLD`/`PKG_NEW` 由它自己用锁定版本美化；OLD 必须是 `maps/` 描述的版本；diff 两侧各用自己版本的真名标注；按闸门接受的顺序打印交接命令 | v0.8.2→v0.8.3 回放 exit 0，38 s（VERIFICATION.md 证据五） |
| `name_symbol.mjs` | 登记推断名前做完种类、拼写、孪生、撞名、子系统和归属检查，批量登记全部写入或全不写入；`--allow-unproven` 的名字记入 `inferred_daemon.asserted.json`，不作为其他条目的证据 | 故障注入见 VERIFICATION.md 证据八 8b |
| `convert_line_citations.mjs` | 遗留行号可以机械退役：每处改写要求旧引用今天成立、新引用按今后的规则成立，改写后由三个检查器复核，新出现的失败逐行回滚 | 对当天 `docs/` 的 dry run：`AGENT_INTERNALS_ANALYSIS.md` 的遗留行号 1525 → 107，用时约 10 s |
| `retarget_symbols` 按旧改名表核实配对的身份 | `真名 (短名)` 与 `真名/短名`（包括围栏里的斜杠对）只在旧改名表把这个真名与这个短名配成一对时改写，另一个 bundle 的配对不被改动 | 用一份让两个 daemon 符号换短名的合成新改名表处理 `ARCHITECTURE_ANALYSIS.md`（这两个短名在 v0.8.3 上恰好也是 cli 配对里的短名）：被改写的 cli 配对 3 → 0 处 |
| `check_bare_anchors` 只在需要时解析与遍历 | 输出与完整解析时逐字节相同 | 在 `docs/` 上 5 s → 约 1 s |
| 变异测试并发执行 | 检查器进程并发运行，并发不改变结论（`JOBS=1` 串行） | 108 s → 约 10 s（16 核；`JOBS=1` 串行约 27 s） |
| 合计 | — | 带 `PKG` 的完整证明运行约 2.5 分钟 → 约 1 分钟 |

### 未实现

| 改进 | 收益 | 成本 | 风险 |
|------|------|------|------|
| 单次解析 + 共享声明表：一次带 `PKG` 的完整运行对 bundle 做 73 次 Babel 全量解析（用解析计数钩子实测：`check_bare_anchors` 26 次，大部分在变异测试里；`verify_inferred` 14 次；`ast_equiv` 与 `check_doc_anchors` 各 8 次）；十余个工具各自实现一遍顶层声明遍历（`grep -n 'program.body' tools/*.mjs`）。改由 `symbol_index` 一次输出声明表（名字、种类、行、结束行、参数个数、签名、所在初始化器），其他工具读它。 | 变异测试里每个 `check_bare_anchors` 进程不再为第三方判定解析 daemon（每次约 0.5 s、峰值约 290 MB，16 核并发时总峰值约 4 GB）；各工具对"顶层声明""声明行"只有一种约定 | 中 | 低：promote 要求产物逐字节一致，改错会被发现 |
| 抽出共享逻辑：块到模块的分类在 `build_rename`（取最吻合的记录，歧义即失败）与 `check_bare_anchors`（任一第三方记录匹配即算）规则不同；代码 span 正则在 `retarget_docs`、`retarget_symbols` 各有一份；导出调用判定在 `export_blocks`、`exports_map` 各有一份，`bump.sh` 仍用 `exports_map` 计算导出名增删；行号二分查找有多份 | 同一规则只有一处定义 | 小 | 低 |
| 升级全自动化：按报告的 `package` 自行获取并美化 OLD，核对它复现已提交的 `sha256.pretty`；`RE-ANCHOR` 半自动化（用 `verify_inferred` 的相似度给 `pair_changes` 窗口里未匹配的新声明打分，输出建议）；由 `fingerprint_match` 的结果生成 `retarget_symbols --migration` 映射，让文档里的裸短名也能迁移（它的输出是 `{matched:{old:{new,hash}}}`，不是 `{old:new}`） | 升级的人工步骤减少；裸短名不再在升级后静默指向别的函数 | 中 | 低：建议仍要人工复核，`verify_inferred` 仍然把关 |
| pi-worker、stdio、channel-acp、feishu-gateway 的"只证明"模式（美化等价、无损拆包、语法检查、不改名的声明索引），并在引用前缀里加入 `pi-worker`（`anchor_forms.mjs` 目前只接受 daemon、cli、stdio） | 出厂的每个 bundle 都有美化等价证明；关于 pi 运行时的论断可以写成可检查的引用 | 中 | 低 |
| 索引并改名局部函数：以"外层›内层"为键记录有名字的局部函数及其范围 | `spawnSessionActor` 这类函数可以按名字引用和改名 | 大 | 中：`ast_equiv` 要接受映射后的嵌套绑定，改名器要处理非顶层作用域 |
| cli 的推断名，以及 cli 的子系统映射与可读树 | cli 的内部函数可以按名字引用 | 中 | 低 |
| 推断名改以"结构签名 + 锚点字面量"为键，不再以短名为键 | 多数推断名在升级时自动承接，不需要短名重映射 | 大 | 中：签名碰撞组里的声明要靠锚点区分 |
| `first-party/` 按常量抽取：共享初始化语句里的常量只抽出自己的声明符 | 读者看到的是常量本身，而不是整个模块初始化器 | 小到中 | 低：`verify_first_party` 的"正文等于完整声明"规则要改为按声明符比较 |
| 行号与片段检查扩展到 `CLAUDE.md` 与 `reconstruction/*.md`，行号上限改按路径作键（按文件名作键时 `docs/README.md` 与 `reconstruction/README.md` 会冲突） | 这些文件里的片段与行号示例也被检查（`verify_citations` 已经扫描它们） | 小 | 低 |
| 报告记录 npm 的 `dist.integrity` | 结果绑定到 registry 发布的 tarball，而不只是解包后的文件 | 小 | 低 |
| `retarget_symbols` 一次接受 daemon 与 cli 两对改名表，按真名所属的 bundle 改写配对（现在一次只接受一对，cli 配对要手工修正；分两次运行不安全，因为单个标识符的 span 会被第二次运行按另一个 bundle 再改一次） | cli 配对在升级时也能自动更新 | 小 | 低：配对的身份检查已经在按旧改名表进行 |
| `retarget_symbols` 改写不在反引号里的 `真名 (短名)` | 正文、表格、图里的配对在升级时也能自动更新（`verify_citations` 已检查它们） | 小 | 低到中：要和普通的括号文字区分开 |
| `retarget_docs --stamp` 固定写到 `docs/.pretty-anchor-target`（现在写到第一个文档参数所在的目录） | 第一个参数不在 `docs/` 下时不会写错位置 | 小 | 低 |
| 只给 `BEAUTIFIED` 的运行，在美化哈希等于已提交的 `sha256.pretty` 时采用已提交的版本号 | 快速的本地运行也能得到真正的 `committedInSync` 结论（现在是 `unverified`） | 小 | 低 |
| 只改文档时的快速模式：美化哈希与映射都没变时复用 `$OUT` | 文档修改的检查从约 1 分钟降到几秒 | 小到中 | 低：缓存失效条件要完整 |
| CI 把 `inferredNames=warn` 当作失败 | 告警在 PR 上就能看到，而不是到 promote 时才出现（现在 `warn` 不让构建失败） | 小 | 中：上游的真实改写也会让 CI 变红，直到复读并 `record` |
| 常量写入检查覆盖经由调用的写入（`X.push(…)`、`Object.assign(X, …)`），并在每次运行复查常量是否被重新赋值 | 被当作常量命名的可变状态能被发现（现在只在登记时查直接赋值） | 中 | 低 |
| 报告记录"未命名的自研顶层符号"数量，并设只减不增的上限 | 命名进度可见，新增的未命名符号有信号 | 小到中 | 低：归属判定沿用 `name_symbol` 的证据规则 |
| CI：用 `npm pack` 取包代替完整安装；证明与文档检查拆成并行 job；actions 升到最新大版本（现在是 v5，已有 v7） | CI 更快；消除弃用警告 | 小 | 低 |

### 其余未决事项

- 2026-09-24 对 `docs/` 运行 `convert_line_citations.mjs --report`，按"命名后能转换多少处"排序的未命名符号全部是 cli 符号，要等 cli 有推断名映射（见"未实现"表）。daemon 一侧还转换不了的遗留引用分两类。一类落在 `name_symbol.mjs` 按规则不能命名的代码上（在模块初始化器里赋值的变量与类、模块顶层语句），要改写成经由可命名符号的引用，例如引用赋值它的初始化器；另一类是写法本身不能机械转换：括号里在行号之外还带正文、片段里没有可严格检查的记号、片段跨了多个声明。两类都由报告按原因逐条列出，只能人工改写。
- `name_symbol.mjs` 的归属判定依赖 esbuild lazy-init 包装器划出的模块边界；第一个包装器之前的运行时辅助代码和最后一个包装器之后的入口模块没有边界，只能逐语句判定。没有引用证据的名字只能以 `--allow-unproven` 登记，它们的归属只有登记时的人工判断，没有机器证据；这些名字记在 `maps/inferred_daemon.asserted.json`。
- 推断名越多，互换检测误报的可能性越大。初始化器的 RIVAL 规则只在 v0.8.2→v0.8.3 回放中的 23 对初始化器上验证过，其间它们的常量都没有变化；映射里现有的初始化器名字还没有经历过一次升级。上游大幅改写某个已命名的模块时，这条规则可能判为失败，需要复读后重新 `record`。
- 形状完全相同的两个初始化器只会触发告警：`name_symbol.mjs` 登记时拒绝它们，但手改映射或某次发布碰巧产生同形初始化器时，CI 仍是绿的，只有 promote 会拒绝。
- `convert_line_citations.mjs` 回滚改写所依赖的是三个检查器当前的输出格式；格式一旦变化，它会以 exit 2 拒绝写入，而不是写入未经验证的结果。
