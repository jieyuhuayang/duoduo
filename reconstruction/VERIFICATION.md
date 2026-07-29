# 还原正确性验证记录（Verification Log）

目标命题：**还原后的 `recon/*.recon.js` 与出厂 `dist/release/*.js` 是同一个程序，能同样运行。**

采用五条相互独立的证据，从“结构无损”到“语义全等”到“实机运行”层层加固，最后一条覆盖**跨版本重定向**这一新增风险面。以下为实测输出（2026-07-29，Node v22.17.0，`@openduo/duoduo` **v0.6.2**）。

---

## 证据一 · 无损拆包：拼接可字节还原

按 AST 顶层语句字节偏移拆分，再拼回，与原文件逐字节比较：

```
==================== daemon ====================
parsed 2204 top-level statements
modules: 615, shell segments: 195
LOSSLESS OK   (cmp: byte-identical)
==================== cli ====================
parsed 3053 top-level statements
modules: 901, shell segments: 201
LOSSLESS OK
==================== stdio ====================
parsed 628 top-level statements
modules: 289, shell segments: 3
LOSSLESS OK
```

**结论**：模块边界是从真实结构切出的，拆分零信息损失。

---

## 证据二 · 真实原名恢复：来自 esbuild `__export` 助手

esbuild 压缩仍保留 `__export(exports,{ 原名: () => 短名 })`，逐字保存导出符号原名：

```
daemon: recovered 712 export-name mappings (helper Un)
cli   : recovered 739 export-name mappings (helper vo)
stdio : 9 top-level export names (无 __export 助手，直接顶层导出)
```

抽样（与既有逆向分析交叉印证，✓ 表示与 AGENT_INTERNALS_ANALYSIS.md 结论一致）：

```
buildSystemPromptForChannelConfig ✓   createAgentSdkAdapter = tu   ✓
resolveMetaPromptText             ✓   extractSystemPromptAppend    ✓
buildBaseInstructions / buildDeveloperInstructions            ✓
createSessionManager = oet   createMetaSession = xet
createOutboxDeliveryManager = Net   createDaemon = utt   main = ltt
```

v0.6.2 新增的**权威导出名**（v0.6.1 不存在，来自 cli 的 `__export` 助手，非推断）：

```
cli: + parseRestartArgs   + parseUpgradeArgs   + readOption
daemon / stdio: 导出名集合与 v0.6.1 完全一致（0 增 0 删）
```

**结论**：daemon 改名中 82/112 来自权威导出名；其余 30 个为逆向推断的内部函数名（见 `maps/RENAME_TABLE.md`，标 *inferred*），本轮新增 7 个（restart-reason 与 job SDK config 两组新函数）。

> 注：短名每次构建全数漂移（esbuild 重新 mangle），真名不变。跨版本函数身份靠结构指纹匹配确认（`tools/fingerprint_match.mjs`），见证据五。

---

## 证据三 · 语义全等：155 万节点 AST 并行比对（覆盖 100% 代码）

`ast_equiv.mjs` 并行遍历 `*.pretty.js` 与 `*.recon.js` 两棵 AST，要求每个节点类型与字面量全等，标识符差异必须恰好等于改名表：

```
daemon: nodes compared: 484152 | identifier checks: 193024 | rename-map matches: 425
        applied 112 renames, skipped 0 missing, 0 collisions
        RESULT: SEMANTICALLY EQUIVALENT (identical AST modulo intended renames)
cli   : nodes compared: 780743 | identifier checks: 301969 | rename-map matches: 364
        RESULT: SEMANTICALLY EQUIVALENT
stdio : nodes compared: 290382 | identifier checks: 106493 | rename-map matches: 18
        RESULT: SEMANTICALLY EQUIVALENT
```

**结论**：还原产物与出厂产物是同一 AST（仅差刻意的改名）。这比“能启动”更强——它覆盖每一行代码，而非仅启动路径。

---

## 证据四 · 实机运行：隔离环境实启 + 逐字节输出比对

### 4a. daemon 在隔离 HOME + 备用端口 20334 实机启动

```
[pid0] session index populated: 0 entries
[pid0] aladuo daemon started on :20334, pid=623282
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

收到 SIGTERM 后 `[pid0] shutdown complete` 干净退出。本次隔离实启在 :20334 进行，未扰动默认端口 :20233 上的线上实例（探测其 `system.status` 全程 `gateway:ok, meta_session:ok`）——单写者互斥 + 端口隔离均按预期工作。

> 日志可见性注意：`main()` 里的 `[pid0] session index populated` / `[pid0] restart reason claimed` 走 info 级 logger，而默认日志级别是 `warn`（`ALADUO_LOG_LEVEL` 未设且 `NODE_ENV !== "development"` 时，`daemon.pretty.js:30887`）。`[pid0] aladuo daemon started on` 一类则走 force 级 `Kt()`，不受级别限制。验证 boot 期行为必须 `ALADUO_LOG_LEVEL=info`，否则会误判为“代码没执行”。

### 4b. v0.6.2 新机制的活体验证：restart reason 一次性认领

在隔离实例的 `varDir` 手工投放 `daemon-restart-reason.json` 后重启，还原版 daemon 表现与源码推断完全一致：

```
$ echo '{"reason":"upgraded @openduo/duoduo to 0.6.2",
         "requested_at":"2026-07-29T03:20:00.000Z","requested_by_agent":true}' \
    > /tmp/iso062/.aladuo/var/daemon-restart-reason.json
$ ALADUO_LOG_LEVEL=info node daemon.recon.js
[pid0] restart reason claimed { requested_at: '2026-07-29T03:20:00.000Z', requested_by_agent: true }
$ ls /tmp/iso062/.aladuo/var/daemon-restart-reason.json
ls: 无法访问 ...: 没有那个文件或目录          # 读后即删，"claim" 语义坐实
```

**结论**：还原产物不只是能启动，本轮新增的跨重启控制面在还原版上可端到端复现。

### 4c. cli / stdio 输出逐字节一致

```
diff <(node cli.js   --help) <(node cli.recon.js   --help)  =>  IDENTICAL
diff <(node stdio.js --help) <(node stdio.recon.js --help)  =>  IDENTICAL
新 help 行同样逐字复现：  duoduo upgrade [version] [--wake <session-or-alias>]
```

---

## 证据五 · 跨版本重定向的正确性（v0.6.1 → v0.6.2）

版本升级引入一个 `rebuild.sh` 覆盖不到的风险：**推断名表以短名为键，而短名每次构建都会漂移**。直接沿用旧表不会报错，只会**静默把名字贴到错的函数上**。本轮实测到的真实陷阱：

```
nX：v0.6.1 = rehydrateSessionState   →   v0.6.2 = trace 级 logger（daemon.pretty.js:30917）
```

`tools/bump.sh` 用结构指纹（而非名字）承接推断名，消除该风险。本轮结果：

```
daemon: old=1969 new=1978 matched=1935  changedOld=34  unmatchedNew=41
cli   : old=2867 new=2890 matched=2819  changedOld=48  unmatchedNew=66
stdio : 与 v0.6.1 逐字节相同 — 本次未变更，无需重定向
推断名承接：21/23 由指纹自动迁移；2 个（buildTransientUserBlocks、drainSessionMailbox）
            因函数体本身变更而无指纹匹配，改用字符串锚点复位：
            "daemon-restart-hint"     -> sfe @ 61049   （v0.6.1: Gde @ 60926）
            "lockHeartbeatIntervalMs" -> tfe @ 59735   （v0.6.1: Vde @ 59612）
最终 rename：applied 112 renames, skipped 0 missing, 0 collisions
```

另有一条独立交叉校验：`tools/diff_decls.mjs` 把每个声明的新旧两版做**标识符位置归一化**后比对，daemon 31 个声明差异里有 10 个归一化后完全相同——即纯 minifier churn，非真实变更；cli 44 个里有 20 个。真实变更面因此收敛到可人工复核的规模。

**结论**：跨版本重定向不是“把旧表拿来再跑一遍”，而是一次可证明的身份迁移；未能自动迁移的条目全部被显式报出并逐个复位，没有静默失败。

---

## 汇总

| 证据 | daemon | cli | stdio |
|------|--------|-----|-------|
| 无损拆包（cmp 零差异） | ✓ 615 模块 | ✓ 901 | ✓ 289 |
| 真实原名恢复（`__export`） | 712 | 739 | 9 |
| AST 全等（节点数 / 改名命中） | ✓ 484152 / 425 | ✓ 780743 / 364 | ✓ 290382 / 18 |
| `node --check` 语法 | ✓ | ✓ | ✓ |
| 实机运行 | ✓ 实启 RPC/WAL/cadence + restart-reason 端到端 | ✓ --help 逐字节一致 | ✓ --help 逐字节一致 |
| 跨版本身份迁移 | ✓ 1935 指纹匹配 + 2 处锚点复位 | ✓ 2819 指纹匹配 | ✓ 无变更 |

**命题成立**：三个入口的还原产物均与出厂 v0.6.2 语义全等，且可正确、同样效果地运行。

---

## 复现

```bash
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"
cd reconstruction/tools && npm install

# 0) 取出厂产物并反混淆（用 npm pack，不改动本机全局安装的实例）
SP=/tmp/duoduo-recon && mkdir -p "$SP/pkgs" && cd "$SP/pkgs"
npm pack @openduo/duoduo@0.6.2
mkdir -p v0.6.2 && tar xzf openduo-duoduo-0.6.2.tgz -C v0.6.2 --strip-components=1
mkdir -p "$SP/beautified/v0.6.2"
for b in daemon cli stdio; do npx js-beautify "v0.6.2/dist/release/$b.js" > "$SP/beautified/v0.6.2/$b.pretty.js"; done

# 1) 证据一~三（split→cmp→exports→rename→ast_equiv）
BEAUTIFIED="$SP/beautified/v0.6.2" bash rebuild.sh

# 2) 证据五（仅版本升级时需要；先跑它，复核并更新 maps/inferred_*.json，再跑 rebuild.sh）
OLD="$SP/beautified/v0.6.1" NEW="$SP/beautified/v0.6.2" bash bump.sh

# 3) 证据四（隔离 HOME + 备用端口，勿用默认 :20233）
npm install --prefix "$SP/rt" --ignore-scripts @openduo/duoduo@0.6.2
PKG="$SP/rt/node_modules/@openduo/duoduo/dist/release"
cp ../recon/*.recon.js "$PKG/" && cd "$PKG"
HOME=/tmp/iso062 ALADUO_PORT=20334 ALADUO_LOG_LEVEL=info \
  ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" ALADUO_RUNTIME_MODE=host \
  ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local node daemon.recon.js
```
