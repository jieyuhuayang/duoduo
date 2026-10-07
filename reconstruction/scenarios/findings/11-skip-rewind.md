# 11-skip-rewind 实测结论（@openduo/duoduo v0.8.4，重建 daemon，2026-10-08）

脚本：`scenarios/11-skip-rewind.sh`。输出：`.build/scenarios/11-skip-rewind/`（`report.md`、`trace.jsonl`、`boot.log`、`state-after-turn{1,2}.json`、`pull-turn*.json`、`events.jsonl`、`sessions/`、`outbox/`、`claude-transcripts/`）。本场景调用了真实模型：Claude 引擎经 Agent SDK，认证来源 `claude_code_local`，模型 `claude-opus-5-5`。**共花费 2 个模型 turn**。

**结论：** §14.1 第 1 项有了答案：PreToolUse hook 返回 `continue: false` 之后，Agent SDK 仍然执行 Skip 的工具体。`runSkipTool (B$)` 把 `pending_skip_rewind` 写进会话 `state.json`，SDK 把工具结果写进 transcript，然后结束这一轮，模型没有再产出文字。下一个用户消息 turn 收到 `<skip-rewind>` 块，块发出之后 `pending_skip_rewind` 被清除。§4.5 里"如果不执行，Claude 会话就不会写入 Skip 记录"这一假设分支不成立，Claude 上 Skip 记录与 skip-rewind 块的行为和其他引擎相同。场景 10-restart-hint 的 turn 2 里模型自己选择调用 Skip，得到同样的结果，所以这个结论有两次独立的观测。

## 被测说法

- **§14.1 第 1 项 / §4.5**："SDK 在 hook 返回 `continue: false` 之后是否还执行 Skip 的工具体，由 SDK 决定；如果不执行，Claude 会话就不会写入 Skip 记录，下一轮也就没有 `<skip-rewind>` 块（未证实推测）。"
- **§4.5（相关陈述，顺带检查）**：Claude 常驻流式会话由 hook 在当前 turn 上记 `skipCalled`；drain 判定这一轮被跳过之后不写出站记录，`session.stream_end` 带 `reason: "skipped"`；下一轮是用户消息时注入 `<skip-rewind>` 块。

## 步骤

1. 与场景 10 相同的准备：隔离 HOME 里只含 access token 的 Claude 登录，渠道种类 `terse`（提示词只要求简短回答、不经要求不调用工具）。启动 daemon，`channel.spawn` 建实例 `terse-11`，runtime `claude`，会话键 `terse:room-11`。
2. turn 1：`channel.ingress` 发送 "This is a test of the Skip tool. Call the tool mcp__aladuo__Skip exactly once, as your first and only action, with reason "scenario 11 skip test". Do not write any text."（工具全名取自 `initSkipToolModule (el)`，参数只有 `reason`）。等这一轮 drain 结束，保存 `state.json` 并调 `channel.pull`。
3. turn 2：发送 "reply with the single word ok"，等 drain 结束，再保存 `state.json` 并调 `channel.pull`。停止 daemon，复制会话目录、出站目录和 Claude Code transcript。

## 证据

- **turn 1 的调用顺序**（trace，时间为启动后毫秒）：
  1. `createClaudeStreamingSessionFactory (KRe)` 内 matcher 为 `*` 的 PreToolUse 闭包，hook 输入 `hook_event_name: "PreToolUse"`、`tool_name: "mcp__aladuo__Skip"`（5973 ms）。
  2. 同一函数内 matcher 为 `mcp__aladuo__Skip` 的 PreToolUse 闭包，即返回 `continue: false` 与 `stopReason` 的那个 hook（5973 ms）。
  3. `createAladuoMcpServer (by)` 内注册的 Skip 处理函数 → `runSkipTool (B$)`，参数 `{reason: "scenario 11 skip test"}`；它调用 `patchSessionRuntimeState (et)` 写会话状态（5981 ms）。
  4. `createClaudeStreamingSessionFactory (KRe)` 内的 PostToolUse 闭包，`tool_name: "mcp__aladuo__Skip"`（5989 ms）。
  5. `markTurnSkippedFromSkipRecord (Pxe)`，第三个参数 `"claude"`，耗时 0 ms，即按 claude 直接沿用 hook 给出的结果（5997 ms）。
  6. `createSessionSubscriptionRegistry (uH)` 内的 stream_end 发送闭包，参数 `reason: "skipped"`（6002 ms）。
- **日志**：`[Skip] skip rewind saved { sessionKey: 'terse:room-11', reason: 'scenario 11 skip test' }`，随后 `[runner] Skip called — suppressing outbox`。
- **会话状态**：turn 1 之后 `state.json` 有 `pending_skip_rewind: {reason: "scenario 11 skip test", skipped_at: "2026-10-07T16:57:12.326Z"}`；turn 2 之后该字段为 `null`。
- **transcript**：assistant 的 `tool_use`（`{"reason":"scenario 11 skip test"}`）之后紧跟 user 的 `tool_result`，内容是工具体的返回值 "Skipped. End your turn now — no further text, no further tool calls."；这一轮之后没有 assistant 文字。
- **出站与事件日志**：turn 1 之后 `channel.pull` 取到 0 条 final 记录。事件日志共 5 条：2 条 `channel.message`、turn 1 的 `agent.tool_use` 和 `agent.tool_result` 各 1 条、只有 turn 2 的 1 条 `agent.result`。
- **turn 2**：`buildTransientUserBlocks (Vxe)` 的第二个参数带 `skipRewind` 和 `isUserMessage: true`，内部调用 `renderSkipRewindBlock (Amt)`，参数是 turn 1 写的记录。模型收到的用户消息有两个文本块：`<skip-rewind skipped_at="2026-10-07T16:57:12.326Z">`（"You chose to skip your previous turn without replying to the user." / `Reason: "scenario 11 skip test"` / "Anything your skipped turn produced was not delivered; the user did not see it." / 当前时间与 "(elapsed: <1m since skip)"），然后是用户原文。模型回复 `ok`，`channel.pull` 取到 1 条 final 记录。
- **场景 10 的旁证**：场景 10 的 turn 2 是重启唤醒通知，模型自行调用 Skip。trace 顺序相同（两个 PreToolUse 闭包 → `runSkipTool (B$)` → PostToolUse 闭包），`pending_skip_rewind` 被写入，下一轮用户消息带 `<skip-rewind>` 块。

## 判定

| 说法 | 判定 | 理由 |
|---|---|---|
| §14.1 第 1 项：SDK 在 `continue: false` 之后是否执行工具体 | confirmed：执行 | Skip hook 返回之后 8 ms，`runSkipTool (B$)` 运行并写入 `pending_skip_rewind`；transcript 里有工具结果；随后 PostToolUse hook 运行。`continue: false` 结束的是工具调用之后的这一轮，不阻止这次工具调用本身。 |
| §4.5 "如果不执行……没有 `<skip-rewind>` 块" | 不成立（假设分支被实测排除） | Claude 会话写入 Skip 记录，下一个用户消息 turn 收到 `<skip-rewind>` 块，块发出之后记录被清除。 |
| §4.5 Claude 上的跳过判定与处理 | confirmed | `markTurnSkippedFromSkipRecord (Pxe)` 对 claude 立即返回；日志 `Skip called — suppressing outbox`；没有出站记录和 `agent.result`；stream_end 带 `reason: "skipped"`。 |

## 建议写入文档的句子

- **§4.5（替换"SDK 在 hook 返回 `continue: false` 之后是否还执行……"一句）**：在本版本的还原 daemon 上实测（场景 11-skip-rewind，另有场景 10-restart-hint 中模型自行调用 Skip 的一次），`createClaudeStreamingSessionFactory (KRe)` 的 Skip hook 返回 `continue: false` 之后，Agent SDK 仍然执行这次工具调用：`createAladuoMcpServer (by)` 注册的处理函数调用 `runSkipTool (B$)`，后者把 `pending_skip_rewind` 写进 `state.json`，工具结果进入 transcript，PostToolUse hook 照常运行，之后这一轮结束，模型不再产出文字。所以 Claude 会话同样留下 Skip 记录，下一个用户消息 turn 由 `renderSkipRewindBlock (Amt)` 生成 `<skip-rewind>` 块，块发出之后记录被清除（confirmed）。
- **§4.5**：同一次实测中，`markTurnSkippedFromSkipRecord (Pxe)` 对 claude 引擎直接沿用 hook 设的标记；drain 记日志 `[runner] Skip called — suppressing outbox`，不写出站记录，事件日志里这一轮只有 `agent.tool_use` 与 `agent.tool_result`，没有 `agent.result`；`createSessionSubscriptionRegistry (uH)` 发出的 stream_end 带 `reason: "skipped"`（confirmed）。
- **§14.1**：删除第 1 项，或改为"已在本版本的还原 daemon 上实测：执行，见 4.5"。

## 附带观察

turn 2 的回复正文在 `ok` 之后多了一句 "Gmail, Google Calendar and Google Drive need to be authorized in claude.ai connector settings before they can be used."，这句进入了 transcript 的 assistant 文本，也进入了出站记录，送到了渠道。隔离 HOME 只隔离了本地文件，登录账号在 claude.ai 上配置的 connector 仍然对 Claude Code 可见。这句话由模型写出还是由 Claude Code 附加，本场景没有区分（未证实推测）。场景 10 的三轮回复里没有出现这句话。
