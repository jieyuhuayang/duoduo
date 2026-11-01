# 12-main-session 实测结论（@openduo/duoduo v0.8.7，重建 daemon，2026-11-01）

脚本：`scenarios/12-main-session.sh`。输出：`.build/scenarios/12-main-session/`（`report.md`、`rpc.jsonl`、`boot.log`、`events/`、`outbox/`、每一步的 `alias-*.json`、`list-after-*.json`、`outbox-after-*.jsonl`、`status-main-session.json`）。

**结论：** INTERNALS 8.6 关于主会话的 daemon 侧主张全部 confirmed。三个渠道会话都是 void 会话，不调用模型；运行时发给它们的每条角色通知都变成一条出站记录，所以谁收到了什么可以直接读出来。§14.2 第 8 项只解决了控制面这一半：owner 收不了时 job 结果改投主会话要跑一次 job（需要模型），飞书 owner 私聊认领主会话在 feishu-gateway 里，这两项仍未实测。

## 步骤

- 用 `channel.spawn` 建三个 void 渠道会话 A、B、C（种类 `voidmain`），再用 `display_name: "main"` 建第四个。
- 从 owner 终端（不带调用方字段）把 A 设为 `main`；不带 `move` 把 B 设为 `main`；带 `caller_in_session: true` 但不带 `caller_session`；带 `caller_session` 为 B；带 `caller_session` 为 A（当前主会话）且 `move: true`。
- `session.notify` 目标写 `main`。
- 停 daemon，手工把 C 的 `meta.md` 的显示名改成 `main`（B 仍是 `main`），重启；读 `system.status`、`session.list`，再发一次目标为 `main` 的通知。

## 证据与判定

| 主张 | 判定 | 证据 |
|---|---|---|
| `channel.spawn` 拒绝显示名 `main`，什么都不写 | confirmed | 返回 `"main" is reserved for the main session and cannot be set by channel.spawn. Nothing was written. …`；`room-d` 的会话目录不存在。 |
| 从 owner 终端设置 `main`：写 `main_since`，新主会话收到通知，`session.list` 标 `main: "held"` | confirmed | 调用顺序 `runSessionSetAliasRpc, buildMainRoleContext, setSessionAliasWithMainRole, isReservedMainAliasChange, resolveMainSessionFromIndex, resolveMainSession, isMainSessionCandidate, checkMainAliasCallerAuthority, setSessionAliasAndReindex, updateSessionDisplayName, announceMainSessionChange, renderNewMainSessionNotice, deliverMainRoleNoticeSafely, deliverExternalSessionNotify, deliverRouteEventToSession, writeVoidSessionOutboxRecord, patchSessionRuntimeState`。A 的 `state.json` 有 `main_since`；A 收到一条以 "You are now the main session." 开头的出站记录；日志 `[main-role] main session set { session_key: 'voidmain:room-a', displaced: [] }`。 |
| 已有主会话时不带 `move` 以 `main_held` 拒绝 | confirmed | `reason: "main_held"`，错误文字给出 `duoduo session alias voidmain:room-b main --move`。 |
| 会话内部：认不出调用方为 `no_caller`，调用方不是主会话为 `not_main` | confirmed | 两次调用分别返回 `no_caller`、`not_main`（"Only the current main session (voidmain:room-a) or the owner from their own terminal …"）。 |
| 当前主会话带 `move` 转移：旧主会话显示名清空，新旧双方各收到通知 | confirmed | A 的显示名变为 `null`，B 为 `main` 且有 `main_since`；A 收到 "Session voidmain:room-b is now the main session; this session no longer is."，B 收到 "You are now the main session." 并多一行 "Previously main: voidmain:room-a."；日志 `displaced: [ 'voidmain:room-a' ]`。 |
| 目标写 `main` 的通知在投递时解析为当前主会话 | confirmed | 返回 `session_key: "voidmain:room-b"`，通知文字出现在 B 的出站记录里。 |
| 两个会话同叫 `main`：都不算主会话；启动核对通知双方；`system.status` 带 `main_session`；目标 `main` 被拒 | confirmed | 调用顺序 `reconcileMainSession, reconcileMainSessionAtBoot, resolveMainSessionFromIndex, renderAmbiguousMainAliasNotice, deliverMainRoleNoticeSafely`；`system.status` 的 `main_session` 为 `{"state":"ambiguous","candidates":["voidmain:room-b","voidmain:room-c"]}`；`session.list` 两者都是 `main: "candidate"`；B、C 各收到 "More than one session is aliased main: …"；日志 `[main-role] ambiguous main session at boot`；通知返回 `reason: "ambiguous"` 并列出两个候选。 |
| 角色通知的来源记为 `main-role` | confirmed | 事件日志里 5 条带角色通知文字的 `route.deliver` 事件，`source.name` 都是 `main-role`（A 两条、B 两条、C 一条）。 |
| §14.2 第 8 项 | 控制面 confirmed；job 结果改投与飞书认领仍未实测 | 见上。 |

## 文档没有写到的行为（均 confirmed）

1. **新主会话的通知会写出前任。** 转移时 B 收到的通知多一行 "Previously main: voidmain:room-a. It was told of the handover and may send you what it carried."，从 owner 终端第一次设置时没有这一行。
2. **出站目录里除了记录文件还有 `.pending_queue.jsonl` 与 `replay/<会话键>.jsonl`。** 记录本身是 `outbox/<种类>/obx_<id>.json`，每个文件一个 JSON 文档。

## 建议写入文档的句子

- **8.6：** 设置、转移、会话内拒绝、启动时的多候选核对和目标名 `main` 的解析，已在 v0.8.7 的还原 daemon 上实测（场景 12-main-session）。
- **14.2 第 8 项：** 缩小为"owner 收不了时 job 结果改投主会话（需要跑一次 job），以及飞书 owner 私聊认领主会话（在 feishu-gateway 里）"。
