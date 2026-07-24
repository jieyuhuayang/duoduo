# 还原正确性验证记录（Verification Log）

目标命题：**还原后的 `recon/*.recon.js` 与出厂 `dist/release/*.js` 是同一个程序，能同样运行。**

采用四条相互独立的证据，从“结构无损”到“语义全等”到“实机运行”层层加固。以下为实测输出（2026-07-24，Node v22.17.0，`@openduo/duoduo` v0.6.1）。

---

## 证据一 · 无损拆包：拼接可字节还原

按 AST 顶层语句字节偏移拆分，再拼回，与原文件逐字节比较：

```
==================== daemon ====================
parsed 2192 top-level statements
modules: 614, shell segments: 194
LOSSLESS OK   (cmp: byte-identical)
==================== stdio ====================
parsed 628 top-level statements
modules: 289, shell segments: 3
LOSSLESS OK
==================== cli ====================
parsed 3020 top-level statements
modules: 899, shell segments: 199
LOSSLESS OK
```

**结论**：模块边界是从真实结构切出的，拆分零信息损失。

---

## 证据二 · 真实原名恢复：来自 esbuild `__export` 助手

esbuild 压缩仍保留 `__export(exports,{ 原名: () => 短名 })`，逐字保存导出符号原名：

```
daemon: recovered 712 export-name mappings (helper Fn)
cli   : recovered 736 export-name mappings (helper vo)
stdio : 9 top-level export names (无 __export 助手，直接顶层导出)
```

抽样（与既有逆向分析交叉印证，✓ 表示与 AGENT_INTERNALS_ANALYSIS.md 结论一致）：

```
buildSystemPromptForChannelConfig = ZE   ✓
createAgentSdkAdapter             = tc   ✓
resolveMetaPromptText             = w_   ✓
extractSystemPromptAppend         = Cle  ✓
buildBaseInstructions/DeveloperInstructions = Ale/Nle ✓
createSessionManager = HXe   runCadenceTick = det
createJobScheduler   = het   createDaemon   = Wet   main = Jet
```

**结论**：daemon 改名中 82/105 来自权威导出名，非猜测；其余 23 个为逆向推断的内部函数名（见 `maps/RENAME_TABLE.md`，标 *inferred*）。

> 注：短名相对 v0.5.8 全数漂移（esbuild 每次构建重新 mangle），真名不变。跨版本函数身份靠结构指纹匹配确认（`tools/fingerprint_match.mjs`）。

---

## 证据三 · 语义全等：48 万节点 AST 并行比对（覆盖 100% 代码）

`ast_equiv.mjs` 并行遍历 `*.pretty.js` 与 `*.recon.js` 两棵 AST，要求每个节点类型与字面量全等，标识符差异必须恰好等于改名表：

```
daemon: nodes compared: 482818 | identifier checks: 192485 | rename-map matches: 409
        RESULT: SEMANTICALLY EQUIVALENT (identical AST modulo intended renames)
cli   : identifier checks: 300798 | rename-map matches: 360
        RESULT: SEMANTICALLY EQUIVALENT
stdio : identifier checks: 106493 | rename-map matches: 18（stdio 仅 7 处改名，全在顶层，见 report）
        RESULT: SEMANTICALLY EQUIVALENT
```

**结论**：还原产物与出厂产物是同一 AST（仅差刻意的改名）。这比“能启动”更强——它覆盖每一行代码，而非仅启动路径。

---

## 证据四 · 实机运行：隔离环境实启 + 逐字节输出比对

### 4a. daemon 在隔离 HOME + 备用端口 20333 实机启动

```
[pid0] aladuo daemon started on :20333, pid=3823385
[pid0] cadence timer started, interval=2220000ms          # 文档所述 ~37min cadence
[meta-session] started, listening for cadence ticks
```

活体 RPC `system.status` 返回正确 JSON（节选）：

```json
{"cadence":{"mode":"layered","interval_ms":2220000},
 "memory_check":{"partitions":[
   {"name":"cadence-executor","contract":"no-contract","enabled":true,"consumes":[]},
   {"name":"memory-committer","contract":"no-contract","enabled":true,"consumes":[]},
   {"name":"memory-weaver","contract":"valid","consumes":["entity-converge.v1","merge.v1","orphan-islands.v1","orphan-newborn.v1","scan-gap.v1","sink.v1"]},
   {"name":"pattern-tracker","contract":"valid","consumes":["node-converge.v1","orphan-newborn.v1","revise.v1"]}]}}
```

收到 SIGTERM 后 `[pid0] shutdown complete` 干净退出。本次隔离实启在 :20333 进行，未扰动默认端口 :20233 上的线上实例（探测其 `system.status` 仍 `gateway:ok, meta_session:ok`）——单写者互斥 + 端口隔离均按预期工作。

> v0.6.1 观测：`memory_check.partitions` 现为四个（新增 `cadence-executor`、`memory-committer`，均 `no-contract`；`memory-weaver`、`pattern-tracker` 仍 `valid`），较 v0.5.8 的两个有扩展。

### 4b. cli / stdio 输出逐字节一致

```
diff <(node cli.js  --help) <(node cli.recon.js  --help)  =>  IDENTICAL
diff <(node stdio.js --help) <(node stdio.recon.js --help) =>  IDENTICAL
cli --version：shipped 与 recon 行为一致（同样的 "Daemon WebSocket not connected"）
```

---

## 汇总

| 证据 | daemon | cli | stdio |
|------|--------|-----|-------|
| 无损拆包（cmp 零差异） | ✓ 614 模块 | ✓ 899 | ✓ 289 |
| 真实原名恢复（`__export`） | 712 | 736 | 9 |
| AST 全等（节点数 / 改名命中） | ✓ 482818 / 409 | ✓ / 360 | ✓ / 18 |
| `node --check` 语法 | ✓ | ✓ | ✓ |
| 实机运行 | ✓ 实启 RPC/WAL/cadence | ✓ --help 逐字节一致 | ✓ --help 逐字节一致 |

**命题成立**：三个入口的还原产物均与出厂产物语义全等，且可正确、同样效果地运行。

---

## 复现

```bash
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"
cd reconstruction/tools && npm install
PKG="$HOME/.local/node-v22.17.0-linux-x64/lib/node_modules/@openduo/duoduo/dist/release"
mkdir -p /tmp/beautified
for b in daemon cli stdio; do npx js-beautify "$PKG/$b.js" > /tmp/beautified/$b.pretty.js; done
BEAUTIFIED=/tmp/beautified bash rebuild.sh     # 证据一~三（split→cmp→exports→rename→ast_equiv）
```
