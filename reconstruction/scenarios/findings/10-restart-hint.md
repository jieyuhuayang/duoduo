# 10-restart-hint 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/10-restart-hint.sh`。输出：`.build/scenarios/10-restart-hint/`（`report.md`、`trace.jsonl`、`boot.log`、`state-after-turn{1,2,3}.json`、`pull-turn*.json`、`events.jsonl`、`sessions/`、`claude-transcripts/`）。本场景调用了真实模型：Claude 引擎经 Agent SDK，认证来源 `claude_code_local`，会话状态记录的 `last_served_model` 为 `claude-opus-5-5`。**共花费 3 个模型 turn**：第一次启动 1 个，第二次启动由唤醒触发 1 个，第二条消息 1 个。

**结论：** §6.4 的 R5 成立。daemon 认领重启原因文件之后，渠道会话跨越重启的第一轮收到 `daemon-restart-hint` 块，这一轮之后不再出现。块的正文与 §6.4、§2.3 的描述一致，位置是这一轮用户消息的第一个文本块。实测补充了两点文档没有写的事实。第一，跨越重启的第一轮可以是唤醒通知触发的 turn，不一定是用户消息；重启提示不要求这一批包含用户消息，所以唤醒 turn 把它消费掉了。第二，同一轮里唤醒通知的正文也带着原因，模型在一条消息里看到两次原因；唤醒通知的包装文字要求模型对"被动提醒"调用 Skip，本次模型就调用了 Skip，所以这一轮没有任何输出送到渠道。

## 被测说法

- **R5（§6.4）**：认领到的原因首先进入渠道会话跨越重启后的第一轮。`decideRestartHintInjection (awe)` 只在判定为 `cross-restart` 时注入 `daemon-restart-hint` 块；新会话判为 `new-session`，同一个 daemon 内判为 `same-daemon`。块的正文说明会话已在新的 daemon 进程下运行，有原因时追加原因和请求时刻。
- **§2.3 表第 1 行**：`daemon-restart-hint` 排在全部瞬时块和用户原文之前；注入条件是"渠道会话，且上次见到的 daemon 启动时间与当前不同"；已见值在调用引擎之前写回，所以只注入一次。

## 步骤

1. 在隔离 HOME 里放一份只含 OAuth access token 的 `.credentials.json`（去掉 refresh token，隔离会话不能轮换真实登录）。写一个渠道种类 `terse`，提示词只要求用最少的词回答、不经要求不调用工具。
2. 第一次启动（`ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local`）。用 `channel.spawn` 建渠道实例 `terse-10`，runtime 为 `claude`，会话键 `terse:room-10`。
3. turn 1：`channel.ingress` 发送 "reply with the single word ok"，等到 `buildTransientUserBlocks (Vxe)` 进入之后出现一次 `drainSessionMailbox (zxe)` 退出。停止 daemon。
4. 手写 `var/daemon-restart-reason.json`：`reason: "scenario 10: kernel prompt changed"`，`wake_targets: ["terse:room-10"]`。
5. 第二次启动。不发新消息，等唤醒触发的 turn 2。
6. turn 3：再发一次 "reply with the single word ok"。停止 daemon，从隔离 HOME 复制会话目录和 Claude Code 写的 transcript。

## 证据

- **turn 1（第一次启动）**：`claimDaemonRestartReason (iwe)` → `setPendingRestartReason (owe)`，参数为 `null`。`decideRestartHintInjection (awe)` 的参数只有 `currentDaemonStartedAt: "2026-10-07T16:55:30.382Z"` 和 `sessionKey`，没有 `lastEventAt`，所以判定为 `new-session`（只记录、不注入）。`buildTransientUserBlocks (Vxe)` 的第二个参数里没有 `daemonRestartHint`。turn 之后 `state.json` 的 `last_seen_daemon_started_at` 等于第一次启动的时刻 `16:55:30.382Z`。模型回复 `ok`，`channel.pull` 取到 1 条 final 记录。
- **认领与唤醒（第二次启动）**：`claimDaemonRestartReason (iwe)` → `setPendingRestartReason (owe)`，参数为 `{reason: "scenario 10: kernel prompt changed", requested_at: "2026-10-07T16:55:39.000Z", requested_by_agent: false}` 加一个元素的 `wake_targets`。随后 `deliverDaemonRestartWakes (avt)` → `deliverExternalSessionNotify (EIe)`，日志为 `restart wake delivered { target: 'terse:room-10', … }`。会话没有收到新的入站消息，唤醒通知本身让它 drain 了一轮。
- **turn 2（唤醒触发）**：`decideRestartHintInjection (awe)` 的参数为 `lastEventAt: "16:55:32.268Z"`、`lastSeenDaemonStartedAt: "16:55:30.382Z"`、`currentDaemonStartedAt: "16:55:39.870Z"`，两个启动时刻不同，即 `cross-restart`。`buildTransientUserBlocks (Vxe)` 的第一个参数是 `<session-notify … source_label="daemon-restart" …>` 文本，第二个参数带 `isUserMessage: false` 和 `daemonRestartHint`。它在内部依次调用 `getPendingRestartReason (swe)` 和 `renderDaemonRestartHint (uwe)`，后者的参数是 `"2026-10-07T16:55:39.870Z"` 和认领到的原因对象。turn 之后 `last_seen_daemon_started_at` 变为 `16:55:39.870Z`。
- **模型在 turn 2 收到的内容**（Claude Code transcript，同一条用户消息里的两个文本块，按顺序）：
  1. `[system] You're running under a new daemon process (started 2026-10-07T16:55:39.870Z). Restart reason, given by the caller: scenario 10: kernel prompt changed (requested 2026-10-07T16:55:39.000Z).`
  2. `<session-notify event="notify" source_session="external:session.notify" source_kind="external" source_label="daemon-restart" …>`，包装文字列出三条路线，其中一条是 "It is a duplicate, a passive heads-up, already delivered elsewhere, or not relevant here: call Skip to suppress output."；`<notify-content>` 里是 `renderRestartWakeMessage (lwe)` 生成的正文 "The daemon was restarted, which may have cut off the turn you were running. … Reason given by the caller: scenario 10: kernel prompt changed Check whether the work you were doing completed before continuing."

  模型没有输出文字，调用了 `mcp__aladuo__Skip`，理由是 "Restart notice is passive: the earlier turn had already finished ("ok" was sent), so nothing was cut off and there's no work to resume."。日志为 `[Skip] skip rewind saved` 和 `[runner] Skip called — suppressing outbox`。turn 2 之后 `channel.pull` 的 final 记录仍是 1 条（turn 1 的），即这一轮没有输出送到渠道。
- **turn 3（第二条消息）**：`decideRestartHintInjection (awe)` 的参数里两个启动时刻相同，即 `same-daemon`。`buildTransientUserBlocks (Vxe)` 的第二个参数里没有 `daemonRestartHint`，有 `skipRewind`；`getPendingRestartReason (swe)` 和 `renderDaemonRestartHint (uwe)` 没有被调用。transcript 里这一轮的用户消息是 `<skip-rewind …>` 块加用户原文，没有重启提示。模型回复 `ok`，final 记录共 2 条。
- turn 2 中 Skip 的工具体确实执行了，`state.json` 出现 `pending_skip_rewind`，turn 3 收到 `<skip-rewind>` 块。这同时回答了 §14.1 第 1 项，详细证据见 `findings/11-skip-rewind.md`。

## 判定

| 编号 | 判定 | 理由 |
|---|---|---|
| R5 判定逻辑 | confirmed | 第一轮判为 `new-session` 并写入已见值；跨越重启的第一轮判为 `cross-restart` 并注入；之后判为 `same-daemon`，不再注入。 |
| R5 正文 | confirmed | 正文与 `renderDaemonRestartHint (uwe)` 的输出逐字一致，带启动时刻、原因和请求时刻。 |
| §2.3 位置 | confirmed | 块是用户消息的第一个文本块，排在唤醒通知（turn 2 的用户输入）之前。 |
| §2.3 只注入一次 | confirmed | turn 2 之后 `last_seen_daemon_started_at` 更新为当前启动时刻，turn 3 没有这个块。 |
| "首先进入跨越重启后的第一轮" | confirmed，需补充 | 第一轮可以是唤醒 turn。重启提示不检查 `isUserMessage`，所以 `--wake` 指定的会话在唤醒 turn 里就消费掉提示；这一轮里原因出现两次（提示块和唤醒正文），而唤醒通知的包装文字引导模型对被动提醒调用 Skip，本次模型调用了 Skip，渠道上没有任何输出。 |

## 建议写入文档的句子

- **§6.4**：在本版本的还原 daemon 上实测（场景 10-restart-hint，Claude 引擎），`decideRestartHintInjection (awe)` 在渠道会话的第一轮判为 `new-session` 并写入 `last_seen_daemon_started_at`；重启之后的第一轮判为 `cross-restart`，`buildTransientUserBlocks (Vxe)` 经 `renderDaemonRestartHint (uwe)` 与 `getPendingRestartReason (swe)` 生成提示块，作为这一轮用户消息的第一个文本块送给模型；再下一轮判为 `same-daemon`，没有提示块（confirmed）。
- **§6.4（补充唤醒目标的情形）**：重启提示的注入不要求这一批包含用户消息。唤醒目标是渠道会话时，`deliverDaemonRestartWakes (avt)` 投递的通知本身让会话 drain 一轮，这一轮就是跨越重启的第一轮：提示块排在 `<session-notify>` 之前，通知正文由 `renderRestartWakeMessage (lwe)` 生成，也含原因，所以模型在同一条消息里看到两次原因；之后的用户消息不再带提示块（confirmed，实测）。
- **§6.4**：通知的包装文字要求模型对"被动提醒"调用 Skip。实测中被唤醒的会话上一轮已经正常结束，模型判断重启通知是被动提醒而调用了 Skip，这一轮没有输出送到渠道，下一轮用户消息带 `<skip-rewind>` 块。因此 `--wake` 不保证用户在渠道里看到重启说明（confirmed，实测一次；模型是否调用 Skip 取决于模型判断）。
- **§2.3 表第 1 行**："注入条件"一列可补一句：与 `skip-rewind` 不同，不要求这一批包含用户消息。
