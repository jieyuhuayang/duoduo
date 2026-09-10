# duoduo 源代码还原（Source Reconstruction）

`@openduo/duoduo` 以 **esbuild `--minify` 压缩后的 JavaScript** 发布（作者立场：“代码是给 agent 读的，压缩只为省带宽”）。本目录把这套压缩产物**还原成可读、且经证明能同样运行**的源代码，当前对齐 **v0.8.1**。

> 本文不复述计数。每次 `rebuild.sh` 运行都会生成 [`maps/pipeline_report.json`](./maps/pipeline_report.json)，那里是块数、一等公民名数、改名条目、AST 节点数的唯一权威来源。此前这些数字散落在四份文档里手工维护，已漂移成三个互相矛盾的值。

## 一句话结论

**还原不是猜测，而是一条“语义保持”的可证明变换链**：压缩产物 → 反混淆（js-beautify，仅改排版）→ 无损拆包（按字节切分，拼接可字节还原）→ 作用域安全改名（Babel 绑定级重命名 + esbuild `__export` 助手里保留的**真实导出名**）。每一步都不改变语义，因此还原后的 `recon/*.recon.js` **与出厂产物是同一个程序**——这一点用近百万节点的 AST 全等比对 + 隔离环境实机启动**双重证明**（见 [VERIFICATION.md](./VERIFICATION.md)）。

身份判定同样不是猜测。esbuild 为每个源模块生成一个 `__export` 块，**块边界即模块边界**，所以"哪些代码是 duoduo 自己的"是一个可判定的结构性问题，答案记在 [`maps/modules_<bundle>.json`](./maps/) 里，是整条流水线唯一的人工判断。

## 目录结构

| 路径 | 内容 |
|------|------|
| `recon/daemon.recon.js` | **可运行的还原产物**（核心运行时）。与出厂 `daemon.js` 语义全等，仅把一等公民符号改回真实名（数量见 `maps/pipeline_report.json`）。v0.7.1 轮已在隔离 HOME + 备用端口实机启动，RPC（TCP 只读 + unix socket 全权）/WAL/cadence/运行时探测全部正常。 |
| `recon/cli.recon.js` | 可运行还原产物（命令行）。**不提交**：3.7 MB 只承载 34 个改名，且每次版本迁移整体重写；用 `rebuild.sh` 随时再生。 |
| `first-party/` | **可读的一等公民源码树**：把 daemon 的首方（duoduo 自研）函数按 12 个子系统（含 `11-runtime-grok`）拆成单文件，带真实函数名与原行号注释。用于**阅读**（运行请用 `recon/`）。pi 运行时不在此：它在 daemon 层没有独立 `__export` 面，其 worker 在 `dist/release/pi-worker.js`，而那个 bundle 恢复不出任何真名。 |
| `maps/RENAME_TABLE.md` | minified 短名 → 真实原名 映射表（按子系统分组，标注来源与原行号）。 |
| `maps/blocks_*.json` | **生成**：按源模块分组的 `__export` 导出名，外加 bundle 顶层 `export {}` 入口导出。这是身份判定的输入。 |
| `maps/modules_*.json` | **整条流水线唯一的人工判断**：逐模块标注是 duoduo 自研还是内联的第三方库。每条记录用 3 个导出名作 marker，命中 2 个即认定，可容忍版本间的导出增减。 |
| `maps/*.exports.json` | esbuild `__export` 助手中恢复出的全部导出名（压平视图，保留供既有工具消费；跨模块重名在此会被覆盖，按模块分组的准确版本见 `blocks_*.json`）。 |
| `maps/rename_*.json` | 实际应用的"首方"改名表（mangled→真实名）。 |
| `maps/symbols_*.json` | **生成**：符号索引，真名 → 短名、声明行、结束行、种类、结构签名。这是"某符号在哪"的权威答案，行号由它派生而非手写。 |
| `maps/inferred_daemon.json` | 逆向推断的内部函数名（未被 `__export` 记录者）。 |
| `maps/inferred_daemon.shape.json` | 上述推断名在**上一次被人工复核过的版本**里的声明形态基线（种类、参数个数、字面量集合），供 `verify_inferred.mjs` 在每次 rebuild 时核对"名字是否还贴在同一类代码上"。 |
| `maps/pipeline_report.json` | **生成**：一次运行测到的全部计数。文档引用它，不再复述数字。 |
| `tools/` | 可复现的还原流水线（Babel 脚本 + `rebuild.sh`），跨版本重定向流水线（`bump.sh`），以及四道防静默失败的闸门：`build_rename.mjs` 的**模块闸门**、`verify_inferred.mjs` 的推断名形态闸门、`verify_first_party.mjs` 的可读树一致性检查、`verify_citations.mjs` 的引用身份检查。 |

## 关键事实：为什么“还原”是可信的而非编造

1. **反混淆只改排版**：`js-beautify` 不改语义。压缩产物 → `*.pretty.js` 是等价变换。
2. **拆包无损可证**：`split.mjs` 按 AST 顶层语句的**字节偏移**切分；`reassemble.mjs` 拼回后与原文件 `cmp` **零差异**。因此“模块边界”是从真实结构切出来的，不是臆测。
3. **名字大多不是猜的**：esbuild 压缩时保留了 `__export(exports, { 真实名: () => 短名 })` 助手调用——这里**逐字保存了原始导出符号名**，另有 bundle 顶层 `export {}` 语句记录入口导出。少量未导出的内部函数名（标 *inferred*）才是逆向推断，且**即使名字推断有偏差也不影响正确性**（改名是作用域安全的纯替换）。
3b. **归属不是猜的**：一个名字属不属于 duoduo，取决于它所在的 `__export` 块——即它所在的源模块——而不取决于名字本身长什么样。此前用关键词子串猜归属，在 v0.8.1 上双向都出错：漏掉 8 个身处自研模块的符号，而且漏掉的原因是结构性的（整个 Grok 模块只导出 `GROK_ACP_*` 形式的常量，v0.7.1 因此静默丢了 19 个符号）。
4. **改名作用域安全**：`rename.mjs` 用 Babel 的绑定分析，只替换某个顶层绑定的**精确引用点**，绝不误伤同名的内层变量；有冲突就跳过。因此 AST 结构不变。
5. **等价性被证明**：`ast_equiv.mjs` 把 `*.pretty.js` 与 `*.recon.js` 两棵 AST 逐节点并行比对，结构全等，标识符差异恰好等于改名表——**这是覆盖 100% 代码的静态全等证明**，比只跑到启动路径的"能跑起来"更强。节点数见 `maps/pipeline_report.json`。
6. **引用可自我维护**：文档里 `真名 (短名)`(行号) 形式的引用由 `verify_citations.mjs` 按**符号身份**核对——符号消失或短名对不上会让构建失败，行号漂移则用 `--fix` 机械重生成。行号是派生量，不该由人手写进散文。

## 如何复现

```bash
# 前置：Node>=18、npm；在 tools/ 目录 npm install
npm install --prefix /tmp/duoduo-pkg @openduo/duoduo@0.8.1
PKG=/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release \
PKG_VERSION=v0.8.1 bash tools/rebuild.sh
#  美化→拆包→导出块→模块闸门→改名→node --check→AST 全等→符号索引
#  →可读树一致性→引用身份→行号锚点（仅提示）→生成 pipeline_report.json
#  两个 bundle 并发（JOBS=1 转串行）；BEAUTIFIED=<dir> 可跳过美化步骤
```

**美化已经收进流水线内部**，`js-beautify` 在 `tools/package.json` 里锁定精确版本。它此前是手工前置步骤，靠 `npx` 取当天解析到的版本——而 `docs/` 里每一个行号锚点都建立在格式化器的输出之上，格式化器发一个小版本就会让它们一起偏移，唯一的信号只是锚点检查转红，看起来会像是上游改了代码。

取产物建议用独立前缀安装而非升级全局安装，以免扰动本机在跑的实例。

**只有带一等公民导出表的 bundle 值得跑**，目前是 `daemon` 与 `cli`。`stdio`、`pi-worker`、`channel-acp`、`feishu-gateway` 分别只能恢复 9、0、0、1 个真名——后三个是入口 bundle，自身模块被内联，所以它们恢复出的 621 个名字 100% 是内联的 zod。对空改名做一次 AST 全等证明不构成证据。要给这几个 bundle 取名，只能走手工路线（`locate_by_anchor.mjs` → `maps/inferred_*.json`）。

## 跟随上游升级（跨版本重定向）

**`rebuild.sh` 单独跑一遍不足以升级版本。** esbuild 每次构建都重新 mangle，`maps/inferred_*.json` 以短名为键——旧表在新版本里不会报错，只会**静默把名字贴到错的函数上**。v0.6.1→v0.6.2 实测到的真实陷阱：`nX` 在 v0.6.1 是 `rehydrateSessionState`，在 v0.6.2 是 trace 级 logger。

`tools/bump.sh` 用**结构指纹**（而非名字）承接推断名，并顺带把版本间的真实变更面裁出来：

```bash
OLD=/path/to/beautified/v0.6.1 NEW=/path/to/beautified/v0.6.2 bash tools/bump.sh
# 1. fingerprint_match.mjs  两版逐声明结构指纹匹配 → matched / changed / new
# 2. remap_inferred.mjs     按结构身份承接推断名；无法自动承接者显式报出待复位
# 3. pair_changes.mjs       按顶层顺序把 changed 与 new 声明配对（数量不等则整窗输出）
# 4. diff_decls.mjs         逐声明输出「标识符位置归一化」后的 diff + 字面量增删
# 5. exports_map 增删对比   权威导出名的新增/消失（最硬的变更信号）
# 复核并更新 maps/inferred_*.json 后，再跑 rebuild.sh 取得等价性证明
```

升级后文档引用怎么办：**写成 `真名 (短名)`(行号) 形式的那些不需要人工迁移**——`verify_citations.mjs` 按符号身份核对，符号还在就只是行号漂移，`--fix` 机械重生成即可；只有"符号消失"和"短名对不上"才需要人来看，而那正是真的机制变更。遗留的裸行号锚点仍需 `check_doc_anchors.mjs --resolve` 与 `check_bare_anchors.mjs` 那套老办法，它们抓得住一类特殊错误：**同一个短名可以既是过期名、又是新版里另一个函数的正确名**（v0.6.2 的 `eKe`/`rle`/`sle` 即是），此时任何"旧名换新名"的整体替换都会把本来对的改错。

第 2 步报 `RE-ANCHOR` 的条目，用 `locate_by_anchor.mjs` 拿该函数独有的字符串字面量在新包里重新定位——**但要看它打印的 `[kind]`**：字面量在旧版里"独属于某函数"不代表新版里还在那个函数体内，上游把它提升成模块级常量后，命中的就是 esbuild 的 lazy-init 包装器（`var X = N(() => {...})`），工具会以 `!! NOT a function` 标出，此时改用第 3 步 `pairs_*.json` 的配对或 `bump.sh` 的 block 提示。第 4 步的“归一化后完全相同”是个好用的过滤器：v0.6.2 的 daemon 31 处声明差异里有 10 处属于纯 minifier churn。推断表复核完毕后跑 `verify_inferred.mjs record` 刷新 `maps/inferred_*.shape.json`，下一次 bump 才有可比的基线。

**v0.6.2→v0.7.1（新子系统落在关键词白名单外）**：`build_rename.mjs` 用一份关键词白名单把 esbuild 恢复出的全部权威导出名过滤成"第一方"子集，才拿去改名。v0.7.1 新增的 Grok 运行时符号与 `ALADUO_TOOL_NAMESPACE` 不含任何已有关键词（`daemon`/`session`/`claude`/`codex`/… 均未命中 `grok`/`namespace`），首次跑 `rebuild.sh` 时被静默判定为"非第一方"而不改名（`first-party rename entries: 120`，比预期少 19 个），`first-party/11-runtime-grok/` 整个子系统不存在——**而三条等价性证据全部照常通过**，因为不改名不会制造任何不一致。

这类"漏掉"不能靠记得去人工核对来防，也不能靠给白名单补词来防——**关键词法的失败是结构性的**。Grok 模块整块只导出 `GROK_ACP_*` 形式的常量，没有任何一个词能命中它；`pi` 更无法写成子串规则，写进去会命中 `pipeline` 和 `api`。

所以 `build_rename.mjs` 不再按名字判定，而是按**模块**判定：esbuild 为每个源模块生成一个 `__export` 块，`maps/modules_<bundle>.json` 逐块记录它是自研还是第三方，匹配不上任何一条记录的块会让构建**直接失败**并列出该块全部导出名。新版本冒出来的是"多了 1 个块要判断"，而不是"多了 19 个陌生名字"。

关键词法留下的账在 v0.8.1 上被清了出来：它把 8 个身处自研模块的符号判成了第三方（`diffStreamingConfigSignature`、`detectInProcessBreak`、`mapItemCompletedToExecEvent` 等），而这些名字一旦被记进当时那份 vendor 基线，闸门就再也不会对它们报警——文档在描述的机制，其实现函数在还原产物里仍是乱码短名。

**v0.7.1→v0.8.0（推断名贴到了错的声明上，而每一道既有检查都放行）**：`bump.sh` 对 daemon 报出 13 个 `RE-ANCHOR`。其中 `runGapLint` 按当时的操作指引处理——取旧函数体里独有的字面量 `"scan-gap.md.pending"` 去新包里定位，命中 `b4`，写进推断表。这是错的：v0.8.0 把 gap-lint 重写成毫秒级区间扫描（真正的新函数是 `Wtt`，四个参数，原来两个），并把那个字面量提升成了模块级常量，于是命中的 `b4` 其实是 esbuild 的 lazy-init 包装器 `var b4 = N(() => { …, Att = "scan-gap.md.pending" })`——是一个顶层声明，但不是函数，更不是 runGapLint。**随后所有证据照常全绿**：改名是作用域安全的，AST 全等不受影响；`verify_first_party.mjs` 三项校验证明的是 `first-party/`、改名表、`recon/` 三者**互相一致**，不证明名字贴对了代码——于是 `first-party/09-memory/runGapLint.js` 里装着一个常量初始化包装器，头注释、行号、正文全部"一致"。它是被两个独立会话对同一版本各跑一遍、diff 出唯一一处分歧后才发现的，不是被任何检查抓到的。

三个可以复盘的原因：①`locate_by_anchor.mjs` 只回答"哪个顶层声明包含这个子串"，不区分函数与常量；②操作指引把"字面量独属于旧函数"当成了跨版本不变量，而上游重构恰恰会移动字面量；③`bump.sh` 其实给过正确提示——`pair_changes.mjs` 报了 `hpe -> NOT IN PAIRS`，block 列表里 `[oXe,hpe,gpe] -> [Htt,Vtt,OP,v4,Wtt,…]` 明确含 `Wtt`——但这两个信号都是"需要人再看一眼"的软提示，没有任何一步会因为忽略它们而失败。

现在的处理与 v0.7.1 那次同一思路——把"记得去核对"换成"不核对就失败"：`verify_inferred.mjs` 接进 `rebuild.sh`，对每个推断名做两件事——**种类闸门**（必须解析到函数/类声明或函数/类表达式；命中 `var = call` 的 lazy-init 包装器或常量直接构建失败）和**形态基线**（对照 `maps/inferred_<bundle>.shape.json` 里上一次人工复核时记录的种类、参数个数、字面量集合；种类变化为失败，参数个数变化或字面量零交集为需人工复读的告警）。回放验证：用 v0.7.1 记录基线、对错误的那份推断表跑 check，精确报出 `runGapLint: b4 @60985 is "var = call (lazy-init wrapper)", not a function` 并非零退出；对正确的表则通过，且把本轮真实重写的三处（`readEventByIdSeek` 2→3 参、`runGapLint` 2→4 参、`computeDedupKey` 2→1 参）如实列为告警。`locate_by_anchor.mjs` 同时改为打印命中声明的 `[kind]` 与文件内出现次数，非函数命中以 `!! NOT a function` 标出。

## 边界与诚实声明

- **第三方依赖未"还原"**：daemon 的绝大多数模块是内联的 npm 包（zod、fastify、ws 等），它们本就有公开源码，本目录只做**识别与分离**（`maps/modules_daemon.json` 逐模块标注），不改写。"还原"聚焦 duoduo **自研**代码。
- **未导出内部函数**仍多为短名：只有被 `__export` 记录的符号能拿到权威原名；纯内部辅助函数（除 30 个已逆向命名者外）保持 minified 名——它们不影响运行，也不影响首方逻辑的可读性主干。
- **`first-party/` 下的单文件不可独立运行**：它们引用其它顶层符号，仅供阅读；可运行工件是 `recon/*.recon.js` 整体。
- `spawnSessionActor` / `wakeSessionActor` 位于 `createSessionManager` 的函数作用域内（非顶层绑定），改名器按设计不动它们，保留 minified 名。这类内层短名**每次构建都会漂移**，本文不再固定引用具体短名。

配套分析文档见 [`../docs/AGENT_INTERNALS_ANALYSIS.md`](../docs/AGENT_INTERNALS_ANALYSIS.md)（子系统逻辑）与 [`../docs/SOURCE_RECONSTRUCTION.md`](../docs/SOURCE_RECONSTRUCTION.md)（还原方法论全文）。
