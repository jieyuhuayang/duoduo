// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: mapItemCompletedToExecEvent  (minified: Qpe, daemon.pretty.js:57384)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapItemCompletedToExecEvent(e) {
    let t = e.type,
        n = e.id;
    switch (t) {
        case "commandExecution":
            return {
                type: "tool_result", toolUseId: n, toolName: "Bash", isError: e.exitCode !== 0, summary: `exit=${e.exitCode}`
            };
        case "fileChange":
            return {
                type: "tool_result", toolUseId: n, toolName: "Write", isError: !1, summary: `files=${JSON.stringify(e.changes?.map(r=>r.path))}`
            };
        case "mcpToolCall":
            return {
                type: "tool_result", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, isError: e.status === "failed", summary: `status=${e.status}`
            };
        case "dynamicToolCall":
            return {
                type: "tool_result", toolUseId: n, toolName: e.tool ?? "unknown", isError: e.status === "failed", summary: `status=${e.status}`
            };
        case "webSearch":
            return {
                type: "tool_result", toolUseId: n, toolName: "WebSearch", isError: !1, summary: xet(e.action, e.query ?? "")
            };
        case "plan":
            return {
                type: "tool_result", toolUseId: n, toolName: "Plan", isError: !1, summary: String(e.text ?? "")
            };
        case "collabAgentToolCall": {
            let r = typeof e.tool == "string" ? e.tool : "unknown";
            return {
                type: "tool_result",
                toolUseId: n,
                toolName: `CollabAgent${Kpe(r)}`,
                isError: e.status === "failed",
                summary: `status=${e.status} receivers=${JSON.stringify(e.receiverThreadIds??[])}`
            }
        }
        case "imageView":
            return {
                type: "tool_result", toolUseId: n, toolName: "ImageView", isError: !1, summary: `path=${String(e.path??"")}`
            };
        case "sleep":
            return {
                type: "tool_result", toolUseId: n, toolName: "Sleep", isError: !1, summary: `durationMs=${e.durationMs}`
            };
        case "subAgentActivity":
            return null;
        case "enteredReviewMode":
        case "exitedReviewMode":
            return null;
        case "agentMessage":
            return null;
        case "reasoning":
            return null;
        case "userMessage":
            return null;
        case "hookPrompt":
            return null;
        case "contextCompaction":
            return {
                type: "system", subtype: "compact_boundary", data: {
                    trigger: "auto"
                }
            };
        case "imageGeneration":
            return null;
        case "functionCallOutput":
            return null;
        default:
            return Ype("completed", t), null
    }
}
