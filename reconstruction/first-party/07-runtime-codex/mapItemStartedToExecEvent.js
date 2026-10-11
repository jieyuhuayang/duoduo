// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: mapItemStartedToExecEvent  (minified: gbe, daemon.pretty.js:62854)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.8.1 (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapItemStartedToExecEvent(item) {
    let type = item.type,
        id = item.id;
    switch (type) {
        case "commandExecution":
            return {
                type: "tool_use", toolUseId: id, toolName: "Bash", input: {
                    command: item.command
                }
            };
        case "fileChange":
            return {
                type: "tool_use", toolUseId: id, toolName: "Write", input: {
                    files: item.changes?.map(change => change.path)
                }
            };
        case "mcpToolCall":
            return {
                type: "tool_use", toolUseId: id, toolName: `mcp__${item.server}__${item.tool}`, input: {}
            };
        case "dynamicToolCall":
            return {
                type: "tool_use", toolUseId: id, toolName: item.tool ?? "unknown", input: {}
            };
        case "webSearch":
            return {
                type: "tool_use", toolUseId: id, toolName: "WebSearch", input: {
                    query: item.query,
                    action: item.action ?? null
                }
            };
        case "plan":
            return {
                type: "tool_use", toolUseId: id, toolName: "Plan", input: {
                    text: item.text
                }
            };
        case "collabAgentToolCall": {
            let toolName = typeof item.tool == "string" ? item.tool : "unknown";
            return {
                type: "tool_use",
                toolUseId: id,
                toolName: `CollabAgent${capitalizeFirstChar(toolName)}`,
                input: {
                    tool: toolName,
                    receiverThreadIds: item.receiverThreadIds,
                    prompt: item.prompt,
                    model: item.model,
                    reasoningEffort: item.reasoningEffort
                }
            }
        }
        case "imageView":
            return {
                type: "tool_use", toolUseId: id, toolName: "ImageView", input: {
                    path: item.path
                }
            };
        case "sleep":
            return {
                type: "tool_use", toolUseId: id, toolName: "Sleep", input: {
                    durationMs: item.durationMs
                }
            };
        case "subAgentActivity":
            return {
                type: "system", subtype: "codex_subagent_activity", data: {
                    kind: item.kind,
                    agentThreadId: item.agentThreadId,
                    agentPath: item.agentPath
                }
            };
        case "enteredReviewMode":
            return {
                type: "system", subtype: "codex_review_mode", data: {
                    phase: "entered",
                    review: item.review
                }
            };
        case "exitedReviewMode":
            return {
                type: "system", subtype: "codex_review_mode", data: {
                    phase: "exited",
                    review: item.review
                }
            };
        case "agentMessage":
            return item.phase === "commentary" ? {
                type: "system",
                subtype: "codex_commentary",
                data: {
                    text: item.text
                }
            } : null;
        case "reasoning":
            return null;
        case "userMessage":
            return null;
        case "hookPrompt":
            return null;
        case "contextCompaction":
            return null;
        case "imageGeneration":
            return null;
        case "functionCallOutput":
            return null;
        default:
            return warnUnmappedCodexItemOnce("started", type), null
    }
}
