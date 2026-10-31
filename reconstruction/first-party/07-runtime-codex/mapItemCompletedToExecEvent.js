// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: mapItemCompletedToExecEvent  (minified: Mve, daemon.pretty.js:64236)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.8.1 (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapItemCompletedToExecEvent(item) {
    let type = item.type,
        id = item.id;
    switch (type) {
        case "commandExecution":
            return {
                type: "tool_result", toolUseId: id, toolName: "Bash", isError: item.exitCode !== 0, summary: `exit=${item.exitCode}`
            };
        case "fileChange":
            return {
                type: "tool_result", toolUseId: id, toolName: "Write", isError: !1, summary: `files=${JSON.stringify(item.changes?.map(change=>change.path))}`
            };
        case "mcpToolCall":
            return {
                type: "tool_result", toolUseId: id, toolName: `mcp__${item.server}__${item.tool}`, isError: item.status === "failed", summary: `status=${item.status}`
            };
        case "dynamicToolCall":
            return {
                type: "tool_result", toolUseId: id, toolName: item.tool ?? "unknown", isError: item.status === "failed", summary: `status=${item.status}`
            };
        case "webSearch":
            return {
                type: "tool_result", toolUseId: id, toolName: "WebSearch", isError: !1, summary: Wct(item.action, item.query ?? "")
            };
        case "plan":
            return {
                type: "tool_result", toolUseId: id, toolName: "Plan", isError: !1, summary: String(item.text ?? "")
            };
        case "collabAgentToolCall": {
            let toolName = typeof item.tool == "string" ? item.tool : "unknown";
            return {
                type: "tool_result",
                toolUseId: id,
                toolName: `CollabAgent${capitalizeFirstChar(toolName)}`,
                isError: item.status === "failed",
                summary: `status=${item.status} receivers=${JSON.stringify(item.receiverThreadIds??[])}`
            }
        }
        case "imageView":
            return {
                type: "tool_result", toolUseId: id, toolName: "ImageView", isError: !1, summary: `path=${String(item.path??"")}`
            };
        case "sleep":
            return {
                type: "tool_result", toolUseId: id, toolName: "Sleep", isError: !1, summary: `durationMs=${item.durationMs}`
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
            return warnUnmappedCodexItemOnce("completed", type), null
    }
}
