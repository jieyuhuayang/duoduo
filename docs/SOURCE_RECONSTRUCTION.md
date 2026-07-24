# duoduo 源代码还原方法论

> 配套产物见 [`../reconstruction/`](../reconstruction/)。本文回答"还原出的源码凭什么可信"；基于该源码的分析见 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)（入门+设计思路）与 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)（逐机制证据）。

## 一句话结论

**duoduo 的“压缩”是可逆的：从 minified 产物到可读源码，存在一条每步都不改变语义的变换链，因此还原结果可被证明为“与出厂同一个程序”。** 作者说“压缩只为省带宽、不是写给人读的”——但 esbuild `--minify` 恰恰把三样东西完整留在了产物里：① 字符串字面量（事件名/RPC/日志，是逆向的证据锚），② 模块边界（`__commonJS`/`__esm` 包装器），③ **`__export` 助手里逐字保存的原始导出名**。前两者让“无损拆包”成立，第三者让“改回真名”成立。于是还原不靠猜，靠证明。

这条结论拆成三条 MECE 支撑论点：

| 论点 | 手段 | 保证 |
|------|------|------|
| **一 · 排版与拆包不损语义** | js-beautify（只改空白）+ AST 字节切分拆包 | 拼接可 `cmp` 字节还原 → 拆分零损失 |
| **二 · 名字大多是恢复而非编造** | 抽取 esbuild `__export(exports,{原名:()=>短名})` | daemon 恢复 712 个真实导出名，与既有逆向交叉印证 |
| **三 · 改名与运行被独立证明** | Babel 作用域安全改名 + 47 万节点 AST 全等 + 隔离实启 | 还原产物 = 出厂产物（同一 AST），且实机 RPC/WAL/cadence 正常 |

---

## 论点一 · 排版与拆包不改变语义

**所以呢**：拿到的 `*.pretty.js` 与还原的模块切片，都是出厂程序的等价重写，不是近似重写。

- **反混淆**：`dist/release/{daemon,cli,stdio}.js` 经 `js-beautify` 展开为 `*.pretty.js`（daemon 7.9 万行）。仅改空白，语义不变。
- **无损拆包**（`tools/split.mjs`）：Babel 解析顶层语句，结构化识别 esbuild 的模块包装器——不写死短名，而是**按调用频次 + 参数形状**认出包装助手（daemon 里是 `k`=`__commonJS`、`$`=`__esm`；cli 是 `x`/`ie`；stdio 是 `L`）。每个 `var 名 = 助手(工厂函数)` 即一个原始模块，按**字节偏移**切成单文件；非模块语句归入有序 shell 段。
- **可证性**：`tools/reassemble.mjs` 按清单顺序拼接所有切片，与原文件 `cmp` **零差异**（daemon 613 模块 / stdio 289 / cli 898，均通过）。这把“模块边界”从臆测变成了从真实结构切出的事实。

> 关键观察：esbuild 把**入口模块图内联到顶层**。所以 daemon 的核心自研逻辑（Spine/Session/Gateway/Drain 等）大多在 shell 段（顶层），而 613 个包装模块里 **594 个是内联的 npm 依赖**——这条边界让“还原聚焦自研代码”成为可能。

---

## 论点二 · 名字大多是恢复，而非编造

**所以呢**：还原后能看到 `buildSystemPromptForChannelConfig`、`createSessionManager`、`runCadenceTick` 这些真名，绝大多数是从产物里**读出来**的，不是我起的。

- **来源**：esbuild 为每个 ESM 模块生成 `__export(exports, { 导出名: () => 本地短名 })`。`tools/exports_map.mjs` 自动识别该助手（daemon=`jn`、cli=`go`）并抽取映射。
- **产出**：daemon **712**、cli **736**、stdio **9** 个真实符号名。其中首方（duoduo 自研）子集经关键词过滤得到 daemon 82 个权威名，例如：

  ```
  WT  → buildSystemPromptForChannelConfig      Xc  → createAgentSdkAdapter
  b_  → resolveMetaPromptText                   ole → extractSystemPromptAppend
  nQe → createSessionManager                    SQe → runCadenceTick
  TQe → createJobScheduler                      tet → createDaemon   net → main
  ```
- **交叉印证**：这些恢复名与上一阶段纯靠字符串/调用链逆向得到的结论**逐一吻合**（如 `WT=buildSystemPromptForChannelConfig` 印证了 §1 认知装配的判断），互为独立验证。
- **诚实边界**：只有被 `__export` 记录的**导出符号**能拿到权威名。未导出的内部辅助函数仍是短名；其中 25 个关键内部函数（`createSpineEvent`/`atomicAppendEvent`/`drainSessionMailbox`…）由逆向命名并**显式标注 *inferred***（见 `maps/RENAME_TABLE.md`）。名字推断即便有偏差也不影响正确性，因为改名是作用域安全的纯替换。

---

## 论点三 · 改名安全、运行等价，且都被独立证明

**所以呢**：把短名改成真名之后，还原产物与出厂产物仍是**同一个程序**——这不是断言，是两类独立证据。

- **作用域安全改名**（`tools/rename.mjs`）：用 Babel 绑定分析定位某顶层绑定的**精确引用点**（声明 + 全部 referencePaths + 重赋值），只在这些字节区间做文本替换，**保留 beautify 排版**；对内层同名变量零误伤；目标名有冲突则跳过。daemon 应用 105 个改名 / 409 处引用，**0 冲突**。
- **静态全等证明**（`tools/ast_equiv.mjs`）：并行遍历 `*.pretty.js` 与 `*.recon.js` 两棵 AST，逐节点要求类型/字面量全等、标识符差异恰好等于改名表。daemon **482,818 节点全等、409 处改名命中**；cli/stdio 同样 `SEMANTICALLY EQUIVALENT`。**这覆盖 100% 代码，强于“能启动”。**
- **实机运行**：还原 daemon 在隔离 HOME + 备用端口 20333 实启——RPC `system.status` 正确返回（cadence layered/2220000ms、memory-weaver/pattern-tracker 分区及其 contract 与 consumes）、生成 WAL/锁/status 文件、SIGTERM 干净退出；cli/stdio 的 `--help` 与出厂**逐字节一致**。完整记录见 [`../reconstruction/VERIFICATION.md`](../reconstruction/VERIFICATION.md)。

---

## 产物地图

| 你想要 | 去哪 |
|--------|------|
| **能跑的还原源码** | `reconstruction/recon/{daemon,cli,stdio}.recon.js` |
| **好读的自研逻辑** | `reconstruction/first-party/`（105 个函数，按 11 子系统分文件，带真名与原行号） |
| **短名↔真名对照** | `reconstruction/maps/RENAME_TABLE.md` |
| **全部恢复的导出名** | `reconstruction/maps/*.exports.json` |
| **自研/第三方分类** | `reconstruction/maps/daemon.classification.json` |
| **一键复现流水线** | `reconstruction/tools/rebuild.sh` |

## 方法可迁移性

本流水线不依赖 duoduo 的任何特有约定，适用于任何 **esbuild 打包** 的 minified Node 产物：结构化识别包装助手 → 字节无损拆包 → `__export` 恢复导出名 → Babel 作用域安全改名 → AST 全等自证。全部工具在 `reconstruction/tools/`（12 个脚本，纯 Babel，无外部服务；含跨版本升级用的结构指纹匹配 `fingerprint_match.mjs`、字符串锚点定位 `locate_by_anchor.mjs`、行号/短名重映射 `anchor_remap.mjs` 与改名表生成 `gen_rename_table.mjs`）。
