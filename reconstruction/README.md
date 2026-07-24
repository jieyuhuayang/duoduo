# duoduo 源代码还原（Source Reconstruction）

`@openduo/duoduo` v0.5.8 以 **esbuild `--minify` 压缩后的 JavaScript** 发布（作者立场：“代码是给 agent 读的，压缩只为省带宽”）。本目录把这套压缩产物**还原成可读、且经证明能同样运行**的源代码。

## 一句话结论

**还原不是猜测，而是一条“语义保持”的可证明变换链**：压缩产物 → 反混淆（js-beautify，仅改排版）→ 无损拆包（按字节切分，拼接可字节还原）→ 作用域安全改名（Babel 绑定级重命名 + esbuild `__export` 助手里保留的**真实导出名**）。每一步都不改变语义，因此还原后的 `recon/*.recon.js` **与出厂产物是同一个程序**——这一点用 47 万节点的 AST 全等比对 + 隔离环境实机启动**双重证明**（见 [VERIFICATION.md](./VERIFICATION.md)）。

## 目录结构

| 路径 | 内容 |
|------|------|
| `recon/daemon.recon.js` | **可运行的还原产物**（核心运行时）。与出厂 `daemon.js` 语义全等，仅把 101 个一等公民符号改回真实名。已在隔离 HOME + 备用端口实机启动，RPC/WAL/cadence 全部正常。 |
| `recon/cli.recon.js` | 可运行还原产物（命令行）。`--help` 输出与出厂**逐字节一致**。 |
| `recon/stdio.recon.js` | 可运行还原产物（stdio 通道）。`--help` 与出厂逐字节一致。 |
| `first-party/` | **可读的一等公民源码树**：把 daemon 的 101 个首方（duoduo 自研）函数按 11 个子系统拆成单文件，带真实函数名与原行号注释。用于**阅读**（运行请用 `recon/`）。 |
| `maps/RENAME_TABLE.md` | minified 短名 → 真实原名 映射表（按子系统分组，标注来源与原行号）。 |
| `maps/*.exports.json` | esbuild `__export` 助手中恢复出的**全部**导出名映射（daemon 702 / cli 726 / stdio 8）。 |
| `maps/rename_*.json` | 实际应用的“首方”改名表（mangled→真实名）。 |
| `maps/daemon.classification.json` | 613 个模块的首方/第三方分类结果。 |
| `maps/daemon.split-manifest.json` | 无损拆包清单（模块边界 + 字节偏移，可字节级重组）。 |
| `tools/` | 可复现的还原流水线（8 个 Babel 脚本 + `rebuild.sh`）。 |

## 关键事实：为什么“还原”是可信的而非编造

1. **反混淆只改排版**：`js-beautify` 不改语义。压缩产物 → `*.pretty.js` 是等价变换。
2. **拆包无损可证**：`split.mjs` 按 AST 顶层语句的**字节偏移**切分；`reassemble.mjs` 拼回后与原文件 `cmp` **零差异**。因此“模块边界”是从真实结构切出来的，不是臆测。
3. **名字大多不是猜的**：esbuild 压缩时保留了 `__export(exports, { 真实名: () => 短名 })` 助手调用——这里**逐字保存了原始导出符号名**。daemon 由此恢复 702 个、cli 726 个真实名。少量未导出的内部函数名（daemon 中 25 个，标 *inferred*）才是逆向推断，且**即使名字推断有偏差也不影响正确性**（改名是作用域安全的纯替换）。
4. **改名作用域安全**：`rename.mjs` 用 Babel 的绑定分析，只替换某个顶层绑定的**精确引用点**，绝不误伤同名的内层变量；有冲突就跳过。因此 AST 结构不变。
5. **等价性被证明**：`ast_equiv.mjs` 把 `*.pretty.js` 与 `*.recon.js` 两棵 AST 逐节点并行比对，474,559 个节点结构全等，标识符差异恰好等于改名表——**这是覆盖 100% 代码的静态全等证明**，比只跑到启动路径的“能跑起来”更强。

## 如何复现

```bash
# 前置：Node>=18、npm；在 tools/ 目录 npm i @babel/parser @babel/traverse @babel/generator @babel/types
export BEAUTIFIED=/path/to/beautified   # 存放 {daemon,cli,stdio}.pretty.js
bash tools/rebuild.sh                    # 拆包→恢复名→改名→node --check→AST 全等，每步自检
```

`*.pretty.js` 由出厂 `dist/release/*.js` 经 `js-beautify` 得到（一次性预处理，见 `tools/rebuild.sh` 顶部说明）。

## 边界与诚实声明

- **第三方依赖未“还原”**：daemon 613 个模块里 594 个是内联的 npm 包（zod、fastify、ws 等），它们本就有公开源码，本目录只做**识别与分离**（`classification.json`），不改写。“还原”聚焦 duoduo **自研**代码。
- **未导出内部函数**仍多为短名：只有被 `__export` 记录的符号能拿到权威原名；纯内部辅助函数（除 25 个已逆向命名者外）保持 minified 名——它们不影响运行，也不影响首方逻辑的可读性主干。
- **`first-party/` 下的单文件不可独立运行**：它们引用其它顶层符号，仅供阅读；可运行工件是 `recon/*.recon.js` 整体。
- `spawnSessionActor` / `wakeSessionActor` 两个函数在模块函数作用域内（非顶层绑定），本轮未改名，保留 minified 名 `ve` / `Ne`。

配套分析文档见 [`../docs/AGENT_INTERNALS_ANALYSIS.md`](../docs/AGENT_INTERNALS_ANALYSIS.md)（子系统逻辑）与 [`../docs/SOURCE_RECONSTRUCTION.md`](../docs/SOURCE_RECONSTRUCTION.md)（还原方法论全文）。
