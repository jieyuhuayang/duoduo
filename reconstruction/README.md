# duoduo 源代码还原（Source Reconstruction）

`@openduo/duoduo` v0.6.2 以 **esbuild `--minify` 压缩后的 JavaScript** 发布（作者立场：“代码是给 agent 读的，压缩只为省带宽”）。本目录把这套压缩产物**还原成可读、且经证明能同样运行**的源代码。

## 一句话结论

**还原不是猜测，而是一条“语义保持”的可证明变换链**：压缩产物 → 反混淆（js-beautify，仅改排版）→ 无损拆包（按字节切分，拼接可字节还原）→ 作用域安全改名（Babel 绑定级重命名 + esbuild `__export` 助手里保留的**真实导出名**）。每一步都不改变语义，因此还原后的 `recon/*.recon.js` **与出厂产物是同一个程序**——这一点用 155 万节点的 AST 全等比对 + 隔离环境实机启动**双重证明**（见 [VERIFICATION.md](./VERIFICATION.md)）。

## 目录结构

| 路径 | 内容 |
|------|------|
| `recon/daemon.recon.js` | **可运行的还原产物**（核心运行时）。与出厂 `daemon.js` 语义全等，仅把 112 个一等公民符号改回真实名。已在隔离 HOME + 备用端口实机启动，RPC/WAL/cadence 全部正常。 |
| `recon/cli.recon.js` | 可运行还原产物（命令行）。`--help` 输出与出厂**逐字节一致**。 |
| `recon/stdio.recon.js` | 可运行还原产物（stdio 通道）。`--help` 与出厂逐字节一致。 |
| `first-party/` | **可读的一等公民源码树**：把 daemon 的 112 个首方（duoduo 自研）函数按 11 个子系统拆成单文件，带真实函数名与原行号注释。用于**阅读**（运行请用 `recon/`）。 |
| `maps/RENAME_TABLE.md` | minified 短名 → 真实原名 映射表（按子系统分组，标注来源与原行号）。 |
| `maps/*.exports.json` | esbuild `__export` 助手中恢复出的**全部**导出名映射（daemon 712 / cli 739 / stdio 9）。 |
| `maps/rename_*.json` | 实际应用的“首方”改名表（mangled→真实名）。 |
| `maps/inferred_daemon.json` | 逆向推断的内部函数名（30 个，未被 `__export` 记录者）。 |
| `maps/daemon.classification.json` | 615 个模块的首方/第三方分类结果。 |
| `maps/daemon.split-manifest.json` | 无损拆包清单（模块边界 + 字节偏移，可字节级重组）。 |
| `tools/` | 可复现的还原流水线（Babel 脚本 + `rebuild.sh`），以及跨版本重定向流水线（`bump.sh`）。 |

## 关键事实：为什么“还原”是可信的而非编造

1. **反混淆只改排版**：`js-beautify` 不改语义。压缩产物 → `*.pretty.js` 是等价变换。
2. **拆包无损可证**：`split.mjs` 按 AST 顶层语句的**字节偏移**切分；`reassemble.mjs` 拼回后与原文件 `cmp` **零差异**。因此“模块边界”是从真实结构切出来的，不是臆测。
3. **名字大多不是猜的**：esbuild 压缩时保留了 `__export(exports, { 真实名: () => 短名 })` 助手调用——这里**逐字保存了原始导出符号名**。daemon 由此恢复 712 个、cli 739 个真实名。少量未导出的内部函数名（daemon 中 30 个，标 *inferred*）才是逆向推断，且**即使名字推断有偏差也不影响正确性**（改名是作用域安全的纯替换）。
4. **改名作用域安全**：`rename.mjs` 用 Babel 的绑定分析，只替换某个顶层绑定的**精确引用点**，绝不误伤同名的内层变量；有冲突就跳过。因此 AST 结构不变。
5. **等价性被证明**：`ast_equiv.mjs` 把 `*.pretty.js` 与 `*.recon.js` 两棵 AST 逐节点并行比对，daemon 484,152 / cli 780,743 / stdio 290,382 个节点结构全等，标识符差异恰好等于改名表——**这是覆盖 100% 代码的静态全等证明**，比只跑到启动路径的“能跑起来”更强。

## 如何复现

```bash
# 前置：Node>=18、npm；在 tools/ 目录 npm install
export BEAUTIFIED=/path/to/beautified   # 存放 {daemon,cli,stdio}.pretty.js
bash tools/rebuild.sh                    # 拆包→恢复名→改名→node --check→AST 全等，每步自检
```

`*.pretty.js` 由出厂 `dist/release/*.js` 经 `js-beautify` 得到（一次性预处理）。取产物建议用 `npm pack @openduo/duoduo@<版本>` 而非升级全局安装，以免扰动本机在跑的实例。完整命令见 [VERIFICATION.md](./VERIFICATION.md) 末尾。

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

迁移完文档后**务必跑一次** `check_doc_anchors.mjs --resolve <new.pretty.js> ../docs/*.md`：docs 把每条主张写成 `符号`(`行号`)，这份冗余是可机器校验的——短名若不出现在所引行上，两者必有一个是陈的。它抓得住其它检查全都漏掉的一类错误：**同一个短名可以既是过期名、又是新版里另一个函数的正确名**（v0.6.2 的 `eKe`/`rle`/`sle` 即是），此时任何“旧名换新名”的整体替换都会把本来对的改错。

第 2 步报 `RE-ANCHOR` 的条目，用 `locate_by_anchor.mjs` 拿该函数独有的字符串字面量在新包里重新定位即可。第 4 步的“归一化后完全相同”是个好用的过滤器：v0.6.2 的 daemon 31 处声明差异里有 10 处属于纯 minifier churn。

## 边界与诚实声明

- **第三方依赖未“还原”**：daemon 615 个模块里 596 个是内联的 npm 包（zod、fastify、ws 等），它们本就有公开源码，本目录只做**识别与分离**（`classification.json`），不改写。“还原”聚焦 duoduo **自研**代码。
- **未导出内部函数**仍多为短名：只有被 `__export` 记录的符号能拿到权威原名；纯内部辅助函数（除 30 个已逆向命名者外）保持 minified 名——它们不影响运行，也不影响首方逻辑的可读性主干。
- **`first-party/` 下的单文件不可独立运行**：它们引用其它顶层符号，仅供阅读；可运行工件是 `recon/*.recon.js` 整体。
- `spawnSessionActor` / `wakeSessionActor` 位于 `createSessionManager` 的函数作用域内（非顶层绑定），改名器按设计不动它们，保留 minified 名。这类内层短名**每次构建都会漂移**，本文不再固定引用具体短名。

配套分析文档见 [`../docs/AGENT_INTERNALS_ANALYSIS.md`](../docs/AGENT_INTERNALS_ANALYSIS.md)（子系统逻辑）与 [`../docs/SOURCE_RECONSTRUCTION.md`](../docs/SOURCE_RECONSTRUCTION.md)（还原方法论全文）。
