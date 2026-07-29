# duoduo 源代码还原方法论

> 配套产物见 [`../reconstruction/`](../reconstruction/)。本文回答"还原出的源码凭什么可信"；基于该源码的分析见 [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md)（入门+设计思路）与 [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md)（逐机制证据）。

## 一句话结论

**duoduo 的“压缩”是可逆的：从 minified 产物到可读源码，存在一条每步都不改变语义的变换链，因此还原结果可被证明为“与出厂同一个程序”。** 作者说“压缩只为省带宽、不是写给人读的”——但 esbuild `--minify` 恰恰把三样东西完整留在了产物里：① 字符串字面量（事件名/RPC/日志，是逆向的证据锚），② 模块边界（`__commonJS`/`__esm` 包装器），③ **`__export` 助手里逐字保存的原始导出名**。前两者让“无损拆包”成立，第三者让“改回真名”成立。于是还原不靠猜，靠证明。

这条结论拆成三条 MECE 支撑论点：

| 论点 | 手段 | 保证 |
|------|------|------|
| **一 · 排版与拆包不损语义** | js-beautify（只改空白）+ AST 字节切分拆包 | 拼接可 `cmp` 字节还原 → 拆分零损失 |
| **二 · 名字大多是恢复而非编造** | 抽取 esbuild `__export(exports,{原名:()=>短名})` | daemon 恢复 712 个真实导出名，与既有逆向交叉印证 |
| **三 · 改名与运行被独立证明** | Babel 作用域安全改名 + 48 万节点 AST 全等 + 隔离实启 | 还原产物 = 出厂产物（同一 AST），且实机 RPC/WAL/cadence 正常 |
| **四 · 跟随上游升级不靠沿用旧表** | 结构指纹跨版本承接身份 + 逐声明归一化 diff | 短名全量漂移下仍能证明“同一个函数”，且真实变更面被裁出来 |

---

## 论点一 · 排版与拆包不改变语义

**所以呢**：拿到的 `*.pretty.js` 与还原的模块切片，都是出厂程序的等价重写，不是近似重写。

- **反混淆**：`dist/release/{daemon,cli,stdio}.js` 经 `js-beautify` 展开为 `*.pretty.js`（daemon 7.9 万行）。仅改空白，语义不变。
- **无损拆包**（`tools/split.mjs`）：Babel 解析顶层语句，结构化识别 esbuild 的模块包装器——不写死短名，而是**按调用频次 + 参数形状**认出包装助手（v0.6.2 的 daemon 里是 `S`=`__commonJS`、`O`=`__esm`；cli 是 `ne`/`I`；stdio 是 `L`——这些短名每次构建都会变，所以识别必须靠形状而非名字）。每个 `var 名 = 助手(工厂函数)` 即一个原始模块，按**字节偏移**切成单文件；非模块语句归入有序 shell 段。
- **可证性**：`tools/reassemble.mjs` 按清单顺序拼接所有切片，与原文件 `cmp` **零差异**（daemon 615 模块 / cli 901 / stdio 289，均通过）。这把“模块边界”从臆测变成了从真实结构切出的事实。

> 关键观察：esbuild 把**入口模块图内联到顶层**。所以 daemon 的核心自研逻辑（Spine/Session/Gateway/Drain 等）大多在 shell 段（顶层），而 615 个包装模块里 **596 个是内联的 npm 依赖**——这条边界让“还原聚焦自研代码”成为可能。

---

## 论点二 · 名字大多是恢复，而非编造

**所以呢**：还原后能看到 `buildSystemPromptForChannelConfig`、`createSessionManager`、`runCadenceTick` 这些真名，绝大多数是从产物里**读出来**的，不是我起的。

- **来源**：esbuild 为每个 ESM 模块生成 `__export(exports, { 导出名: () => 本地短名 })`。`tools/exports_map.mjs` 自动识别该助手（v0.6.2 的 daemon=`Un`、cli=`vo`）并抽取映射。
- **产出**：daemon **712**、cli **739**、stdio **9** 个真实符号名。其中首方（duoduo 自研）子集经关键词过滤得到 daemon 82 个权威名，例如（短名为 v0.6.2 构建）：

  ```
  JE  → buildSystemPromptForChannelConfig      tu  → createAgentSdkAdapter
  w_  → resolveMetaPromptText                   qle → extractSystemPromptAppend
  oet → createSessionManager                    Iet → runCadenceTick
  Cet → createJobScheduler                      utt → createDaemon   ltt → main
  ```
- **交叉印证**：这些恢复名与上一阶段纯靠字符串/调用链逆向得到的结论**逐一吻合**（如 `JE=buildSystemPromptForChannelConfig` 印证了 §1 认知装配的判断），互为独立验证。
- **导出名集合本身也是变更信号**：跨版本比对 `*.exports.json` 的键集，得到的是**权威**的“新增/消失了哪些具名函数”。v0.6.1→v0.6.2 daemon 零增删，cli 新增 `parseRestartArgs`/`parseUpgradeArgs`/`readOption`——这三个名字直接指认了该版本的 CLI 侧改动，无需任何推断。
- **诚实边界**：只有被 `__export` 记录的**导出符号**能拿到权威名。未导出的内部辅助函数仍是短名；其中 30 个关键内部函数（`createSpineEvent`/`atomicAppendEvent`/`drainSessionMailbox`…）由逆向命名并**显式标注 *inferred***（见 `maps/RENAME_TABLE.md`）。名字推断即便有偏差也不影响正确性，因为改名是作用域安全的纯替换。

---

## 论点三 · 改名安全、运行等价，且都被独立证明

**所以呢**：把短名改成真名之后，还原产物与出厂产物仍是**同一个程序**——这不是断言，是两类独立证据。

- **作用域安全改名**（`tools/rename.mjs`）：用 Babel 绑定分析定位某顶层绑定的**精确引用点**（声明 + 全部 referencePaths + 重赋值），只在这些字节区间做文本替换，**保留 beautify 排版**；对内层同名变量零误伤；目标名有冲突则跳过。daemon 应用 112 个改名 / 425 处引用，**0 冲突、0 跳过**。
- **静态全等证明**（`tools/ast_equiv.mjs`）：并行遍历 `*.pretty.js` 与 `*.recon.js` 两棵 AST，逐节点要求类型/字面量全等、标识符差异恰好等于改名表。daemon **484,152 节点全等、425 处改名命中**；cli（780,743）/stdio（290,382）同样 `SEMANTICALLY EQUIVALENT`。**这覆盖 100% 代码，强于“能启动”。**
- **实机运行**：还原 daemon 在隔离 HOME + 备用端口 20334 实启——RPC `system.status` 正确返回（cadence layered/2220000ms、四个 memory_check 分区及其 contract 与 consumes）、生成 WAL/锁/status 文件、SIGTERM 干净退出；cli/stdio 的 `--help` 与出厂**逐字节一致**。完整记录见 [`../reconstruction/VERIFICATION.md`](../reconstruction/VERIFICATION.md)。

---

## 论点四 · 跟随上游升级：身份靠结构承接，不靠沿用旧表

**所以呢**：还原不是一次性成果，而是要跟着上游版本走的。而“跟着走”有一个不显眼的正确性陷阱——**逆向推断的名字表以短名为键，短名每次构建全量漂移**。旧表拿到新版本上不会报错，只会静默把名字贴到错的函数上。

- **真实事故样本**（v0.6.1→v0.6.2）：`nX` 在 v0.6.1 是 `rehydrateSessionState`，在 v0.6.2 是 trace 级 logger。沿用旧表就会把一个日志函数标成会话重建函数，而所有等价性检查**照样全绿**——因为改名是作用域安全的，贴错名字不影响语义。
- **正确做法**（`tools/fingerprint_match.mjs` + `remap_inferred.mjs`）：对每个顶层声明计算**结构指纹**——把全部标识符按首次出现顺序 α-重命名为位置槽，保留字面量，再哈希。指纹相同即“同一个函数，只是被重新 mangle 了”。推断名沿指纹迁移，而非沿名字。v0.6.1→v0.6.2 daemon 1935/1969 个声明指纹命中，推断名 21/23 自动承接。
- **无法自动承接的，显式报出**：函数体本身改了就没有指纹匹配。此时用 `locate_by_anchor.mjs` 拿该函数独有的字符串字面量在新包里复位（本轮 2 个：`"daemon-restart-hint"` 定位 `buildTransientUserBlocks`、`"lockHeartbeatIntervalMs"` 定位 `drainSessionMailbox`）。**报出而不猜**是关键：贴错的名字比缺失的名字更有害。
- **顺带把变更面裁出来**（`pair_changes.mjs` + `diff_decls.mjs`）：按顶层顺序把“改了的旧声明”与“新出现的声明”配对，再对每对做**标识符归一化 diff**——这样 esbuild 的重命名噪声全部消失，只剩真实结构与字面量变化。v0.6.2 的 daemon 31 处声明差异里，10 处归一化后完全相同（纯 minifier churn）；真正要读的代码因此从“整个 bundle”收敛到二十来个函数。
- **分析文档的行号锚点同样要迁移**（`remap_doc_anchors.mjs` + `retarget_docs.mjs`）：docs 里 800+ 个 `daemon.pretty.js:LINE` 锚点是全部主张的可复核性所在，而一次上游发版让它们同时失效。迁移按“导出名 → 结构偏移 → 声明顺序 → 标识符盲的行形状”四级降级，本轮 833 个锚点自动迁移 790 个，其余 43 个**留在原处并报出**——它们恰好落在本版真正改动的函数里，本来就该重读。

---

## 产物地图

| 你想要 | 去哪 |
|--------|------|
| **能跑的还原源码** | `reconstruction/recon/{daemon,cli,stdio}.recon.js` |
| **好读的自研逻辑** | `reconstruction/first-party/`（112 个函数，按 11 子系统分文件，带真名与原行号） |
| **短名↔真名对照** | `reconstruction/maps/RENAME_TABLE.md` |
| **全部恢复的导出名** | `reconstruction/maps/*.exports.json` |
| **自研/第三方分类** | `reconstruction/maps/daemon.classification.json` |
| **一键复现流水线** | `reconstruction/tools/rebuild.sh` |
| **跟随上游升级** | `reconstruction/tools/bump.sh`（先跑它，再跑 `rebuild.sh`） |

## 方法可迁移性

本流水线不依赖 duoduo 的任何特有约定，适用于任何 **esbuild 打包** 的 minified Node 产物：结构化识别包装助手 → 字节无损拆包 → `__export` 恢复导出名 → Babel 作用域安全改名 → AST 全等自证；版本升级时再叠一层结构指纹身份承接。全部工具在 `reconstruction/tools/`（19 个脚本 + 2 个流水线，纯 Babel，无外部服务）：

| 阶段 | 工具 |
|------|------|
| 单版本还原 | `split.mjs` → `reassemble.mjs` → `exports_map.mjs` → `build_rename.mjs` → `rename.mjs` → `ast_equiv.mjs`（`rebuild.sh` 串起来） |
| 可读化产出 | `classify.mjs`、`extract_functions.mjs`、`gen_rename_table.mjs` |
| 跨版本升级 | `fingerprint_match.mjs`、`remap_inferred.mjs`、`pair_changes.mjs`、`diff_decls.mjs`、`locate_by_anchor.mjs`（`bump.sh` 串起来） |
| 文档随版本迁移 | `remap_doc_anchors.mjs`（算锚点新位置）、`retarget_docs.mjs`（改行号）、`retarget_symbols.mjs`（改短名） |
