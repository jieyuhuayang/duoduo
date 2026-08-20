# 还原正确性验证记录（Verification Log）

目标命题：**还原后的 `recon/*.recon.js` 与出厂 `dist/release/*.js` 是同一个程序，能同样运行。**

采用五条相互独立的证据，从“结构无损”到“语义全等”到“实机运行”层层加固，最后一条覆盖**跨版本重定向**这一新增风险面。以下为实测输出（2026-08-20，Node v22.22.2，`@openduo/duoduo` **v0.7.1**）。

---

## 证据一 · 无损拆包：拼接可字节还原

按 AST 顶层语句字节偏移拆分，再拼回，与原文件逐字节比较：

```
==================== daemon ====================
parsed 2383 top-level statements
modules: 628, shell segments: 205
reassembled 833 segments -> daemon.reassembled.js (3186510 bytes)
LOSSLESS OK   (cmp: byte-identical)
==================== cli ====================
parsed 1246 top-level statements
modules: 485, shell segments: 31
reassembled 516 segments -> cli.reassembled.js (3601009 bytes)
LOSSLESS OK
==================== stdio ====================
parsed 756 top-level statements
modules: 399, shell segments: 3
reassembled 402 segments -> stdio.reassembled.js (3308669 bytes)
LOSSLESS OK
```

**结论**：模块边界是从真实结构切出的，拆分零信息损失。

---

## 证据二 · 真实原名恢复：来自 esbuild `__export` 助手

esbuild 压缩仍保留 `__export(exports,{ 原名: () => 短名 })`，逐字保存导出符号原名：

```
daemon: recovered 739 export-name mappings (helper Zn)
cli   : recovered 32 export-name mappings (helper zI)
stdio : 9 top-level export names (无 __export 助手，直接顶层导出)
```

v0.7.1 新增的**权威导出名**（v0.6.2 不存在，来自 daemon 的 `__export` 助手，非推断——完整列表见下方“证据五”）：

```
daemon: + renderPromptLayers  + DAEMON_TOKEN_ENV_KEY  + readHostDaemonToken
        + writeHostDaemonToken  + ALADUO_TOOL_NAMESPACE  + buildCodexTurnInput
        + isLoopbackBindHost  + resolveRemoteListenerConfig
        + 18 个 GROK_*/*Grok* 符号（新运行时）           共 26 个新增
cli   : + isDetachedUpgradeWorker  + reasonlessRestartRefusal  + runUpgradeChannelPhase
```

> cli 的 `recovered` 计数从（历史记录中）数百降到 32：v0.7.1 起 cli 打包器把 zod 从 v3 换成 v4（新增大量 `$Zod*`/`_*` 内部符号），旧版这些符号也被误计入"导出名"统计——本轮起 `build_rename.mjs` 的 first-party 关键词白名单过滤后二者结果一致（第一方符号数不受影响），差异纯粹是 vendor 噪声口径变化，不代表 cli 第一方导出面收缩。

**结论**：daemon 改名中 109/139 来自权威导出名；其余 30 个为逆向推断的内部函数名（见 `maps/RENAME_TABLE.md`，标 *inferred*）——这 30 个与 v0.6.2 完全相同（无新增/丢失），因为本轮新函数全部落在有权威导出名的第一方符号里。

> 注：短名每次构建全数漂移（esbuild 重新 mangle），真名不变。跨版本函数身份靠结构指纹匹配确认（`tools/fingerprint_match.mjs`），见证据五。

---

## 证据三 · 语义全等：110 万节点 AST 并行比对（覆盖 100% 代码）

`ast_equiv.mjs` 并行遍历 `*.pretty.js` 与 `*.recon.js` 两棵 AST，要求每个节点类型与字面量全等，标识符差异必须恰好等于改名表：

```
daemon: nodes compared: 504667 | identifier checks: 201420 | rename-map matches: 543
        applied 139 renames, skipped 0 missing, 0 collisions
        RESULT: SEMANTICALLY EQUIVALENT (identical AST modulo intended renames)
cli   : nodes compared: 458304 | identifier checks: 171654 | rename-map matches: 41
        applied 14 renames, skipped 0 missing, 0 collisions
        RESULT: SEMANTICALLY EQUIVALENT
stdio : nodes compared: 408291 | identifier checks: 152528 | rename-map matches: 18
        applied 7 renames, skipped 0 missing, 0 collisions
        RESULT: SEMANTICALLY EQUIVALENT
```

**结论**：还原产物与出厂产物是同一 AST（仅差刻意的改名）。这比"能启动"更强——它覆盖每一行代码，而非仅启动路径。

---

## 证据四 · 实机运行：隔离环境实启 + RPC 探测 + 逐字节输出比对

### 4a. daemon 在隔离 HOME + 备用端口 20334 实机启动

```
[pid0] session index populated: 0 entries
[pid0] available runtimes at boot {
  claude: true, codex: false, grok: false,
  claudeReason: undefined,
  grokReason: "Grok CLI ('grok') is not installed or not in PATH. Install it and run 'grok login'."
}
[pid0] aladuo daemon started on :20334, pid=27439
[session-manager] started { channelActive: 0, channelQueued: 0, jobActive: 0, jobQueued: 0 }
[job-scheduler] started { intervalMs: 60000 }
[idle-compact] started { intervalMs: 60000, fireCapPerSweep: 8 }
[pid0] cadence rhythm { cadenceIntervalMs: 2220000 }          # 文档所述 ~37min cadence
[meta-session] started, listening for cadence ticks
```

三运行时探测在 boot 期**活体确认**：本次沙箱只装了 Claude CLI，`codex`/`grok` 均如实报告不可用及原因，与静态分析给出的 fail-closed 结论一致（未静默降级、未误报）。

### 4b. v0.7.1 新机制的活体验证：unix socket 全权限 + TCP 只读

> `-H 'Content-Type: application/json'` **不可省**：`curl -d` 默认发 `application/x-www-form-urlencoded`，fastify 会先返回 `415 FST_ERR_CTP_INVALID_MEDIA_TYPE`，请求根本到不了 JSON-RPC 分发层——省掉它会把"方法是否被允许"误判成"端点坏了"。

```
$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
{"jsonrpc":"2.0","id":1,"result":{"health":{...},"cadence":{...},"memory_check":{...}}}   # 只读方法：通过

$ curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
    -d '{"jsonrpc":"2.0","id":2,"method":"session.send","params":{}}'
{"jsonrpc":"2.0","id":2,"error":{"code":-32601,"message":"Method not available on read-only endpoint"}}   # 写方法：按预期拒绝

$ ls -la /tmp/iso071/.aladuo/run/daemon.sock
srw------- 1 root root 0 ... daemon.sock                       # mode 0600，父目录 0700

$ curl -s -H 'Content-Type: application/json' \
    --unix-socket /tmp/iso071/.aladuo/run/daemon.sock http://localhost/rpc \
    -XPOST -d '{"jsonrpc":"2.0","id":3,"method":"system.status","params":{}}'
{"jsonrpc":"2.0","id":3,"result":{...}}                         # socket 上同一方法照常工作
```

daemon 日志同步落一条 `[WARN] [daemon] rejected write method on read-only port { method: 'session.send', id: 2 }`——静态分析给出的"TCP 只读、写操作走 socket"结论在实机上逐条复现，而非仅代码推断。

收到 SIGTERM 后 `[pid0] shutdown complete` 干净退出（`job-scheduler`/`idle-compact`/`meta-session`/`session-manager` 均逐一 `stopped`）。本次隔离实启在 :20334 进行，未使用默认端口 :20233。

> 日志可见性注意：默认日志级别是 `warn`（`ALADUO_LOG_LEVEL` 未设且 `NODE_ENV !== "development"` 时）。验证 boot 期行为必须显式 `ALADUO_LOG_LEVEL=info`，否则会误判为"代码没执行"。

### 4c. cli / stdio 输出逐字节一致

```
diff <(node cli.js   --help) <(node cli.recon.js   --help)  =>  IDENTICAL
diff <(node stdio.js --help) <(node stdio.recon.js --help)  =>  IDENTICAL
```

---

## 证据五 · 跨版本重定向的正确性（v0.6.2 → v0.7.1）

版本升级引入一个 `rebuild.sh` 覆盖不到的风险：**推断名表以短名为键，而短名每次构建都会漂移**。直接沿用旧表不会报错，只会**静默把名字贴到错的函数上**。`tools/bump.sh` 用结构指纹（而非名字）承接推断名，消除该风险。本轮结果：

```
daemon: old=1978 new=2138 matched=1814  changedOld=164  unmatchedNew=313
cli   : old=2890 new=1286 matched=1110  changedOld=1780 unmatchedNew=228   # 主因：zod v3->v4 换代，vendor 噪声
stdio : old=745  new=868  matched=730   changedOld=15   unmatchedNew=137  (pureNew=110)
推断名承接：daemon 30/30 全部迁移成功——26 个由结构指纹自动重映射，
            4 个（getPendingRestartReason、computeDedupKey、applyJobSdkConfigOverride、
            drainSessionMailbox）因函数体本身变更/歧义而无法自动确认，
            改用字符串锚点（`tools/locate_by_anchor.mjs`）逐一复位：
            "drain_started" 事件名   -> Nhe @ 62309  （drainSessionMailbox）
            ":hash:${" 字面量        -> Lte @ 78532  （computeDedupKey）
            "prompt_mode: t.prompt_mode" -> RU @ 49967（applyJobSdkConfigOverride，
                                              新增 claudeModelProfiles 合并分支）
            renderDaemonRestartHint 的调用点第二实参 -> Ice @ 50264（getPendingRestartReason）
最终 rename：applied 139 renames, skipped 0 missing, 0 collisions
```

本轮额外命中一处**结构性发现**，而非单纯的换名：v0.6.2 文档记载的"运行时枚举三处独立词法作用域常量"（`s2e`/`aHe`/`lhe`，刻意强调"非笔误"）在 v0.7.1 已被**合并成唯一权威定义** `Ex = ["claude","codex","grok"]`（`daemon.pretty.js:31090`），旧的三个副本站点现在都只是调用共享的 `Rx()`/`Fc()`/`Xl()`。全文件 grep 三值字面量数组只剩这一处命中——这是指纹匹配无法从"名字"层面发现的那类真实重构，必须读代码确认。

另有一处**工具口径缺口**，本轮修复：`tools/build_rename.mjs` 的 first-party 关键词白名单没有 `grok`/`namespace` 类关键词，导致首次跑 `rebuild.sh` 时 19 个 Grok 符号与 `ALADUO_TOOL_NAMESPACE` 被判定为"非第一方"而不改名（`first-party rename entries: 120`）。补上 `grok`/`toolnamespace`/`aladuo_tool` 关键词后复跑，第一方符号数升到 `139`，`first-party/11-runtime-grok/` 才补全为可读源码——这提醒**版本升级引入新子系统时，关键词白名单本身也是需要复核的假设**，而非静态配置。

**结论**：跨版本重定向不是"把旧表拿来再跑一遍"，而是一次可证明的身份迁移；未能自动迁移的条目全部被显式报出并逐个复位，没有静默失败。

---

## 汇总

| 证据 | daemon | cli | stdio |
|------|--------|-----|-------|
| 无损拆包（cmp 零差异） | ✓ 628 模块 | ✓ 485 | ✓ 399 |
| 真实原名恢复（`__export`） | 739 | 32 | 9 |
| AST 全等（节点数 / 改名命中） | ✓ 504667 / 543 | ✓ 458304 / 41 | ✓ 408291 / 18 |
| `node --check` 语法 | ✓ | ✓ | ✓ |
| 实机运行 | ✓ 实启 RPC(TCP只读+socket全权) + 三运行时探测 | ✓ --help 逐字节一致 | ✓ --help 逐字节一致 |
| 跨版本身份迁移 | ✓ 1814 指纹匹配 + 4 处锚点复位，全部 30/30 推断名成功迁移 | ✓ 1110 指纹匹配 | ✓ 730 指纹匹配 |

**命题成立**：三个入口的还原产物均与出厂 v0.7.1 语义全等，且可正确、同样效果地运行（含新增的 unix socket 控制面与三运行时探测的实机复现）。

---

## 复现

```bash
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"
cd reconstruction/tools && npm install

# 0) 取出厂产物并反混淆（用 npm install 到隔离前缀，不改动本机全局安装的实例）
SP=/tmp/duoduo-recon && mkdir -p "$SP/pkgs"
npm install --prefix "$SP/pkgs/v0.7.1" @openduo/duoduo@0.7.1
mkdir -p "$SP/beautified/v0.7.1"
PKG="$SP/pkgs/v0.7.1/node_modules/@openduo/duoduo/dist/release"
for b in daemon cli stdio; do npx js-beautify "$PKG/$b.js" > "$SP/beautified/v0.7.1/$b.pretty.js"; done

# 1) 证据一~三（split→cmp→exports→rename→ast_equiv）
BEAUTIFIED="$SP/beautified/v0.7.1" bash rebuild.sh

# 2) 证据五（仅版本升级时需要；先跑它，复核并更新 maps/inferred_*.json，
#    再确认 build_rename.mjs 的关键词白名单覆盖了本轮新子系统，最后重跑 rebuild.sh）
npm install --prefix "$SP/pkgs/v0.6.2" @openduo/duoduo@0.6.2
mkdir -p "$SP/beautified/v0.6.2"
OLDPKG="$SP/pkgs/v0.6.2/node_modules/@openduo/duoduo/dist/release"
for b in daemon cli stdio; do npx js-beautify "$OLDPKG/$b.js" > "$SP/beautified/v0.6.2/$b.pretty.js"; done
OLD="$SP/beautified/v0.6.2" NEW="$SP/beautified/v0.7.1" bash bump.sh

# 3) 证据四（隔离 HOME + 备用端口，勿用默认 :20233）
# 隔离 HOME 必须短：socket 路径 >104 字节时 daemon 直接 fatal 退出（unix socket 硬限制），
# 放在 /tmp 下的短目录，别用深层临时目录。socket 路径写死成隔离 HOME 的绝对路径——
# 写 "$HOME/..." 会展开成外层真实 HOME，探到线上 daemon 而不是这个隔离实例。
ISO=/tmp/iso071 && mkdir -p "$ISO" && chmod 700 "$ISO"
cp ../recon/*.recon.js "$PKG/" && cd "$PKG"
HOME="$ISO" ALADUO_PORT=20334 ALADUO_LOG_LEVEL=info \
  ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" ALADUO_RUNTIME_MODE=host \
  ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local node daemon.recon.js &
curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20334/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
curl -s -H 'Content-Type: application/json' \
  --unix-socket "$ISO/.aladuo/run/daemon.sock" http://localhost/rpc \
  -XPOST -d '{"jsonrpc":"2.0","id":2,"method":"system.status","params":{}}'
kill %1
```
