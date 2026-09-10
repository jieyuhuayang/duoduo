// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: mapItemStartedToExecEvent  (minified: Xpe, daemon.pretty.js:57273)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapItemStartedToExecEvent(e) {
    let t = e.type,
        n = e.id;
    switch (t) {
        case "commandExecution":
            return {
                type: "tool_use", toolUseId: n, toolName: "Bash", input: {
                    command: e.command
                }
            };
        case "fileChange":
            return {
                type: "tool_use", toolUseId: n, toolName: "Write", input: {
                    files: e.changes?.map(r => r.path)
                }
            };
        case "mcpToolCall":
            return {
                type: "tool_use", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, input: {}
            };
        case "dynamicToolCall":
            return {
                type: "tool_use", toolUseId: n, toolName: e.tool ?? "unknown", input: {}
            };
        case "webSearch":
            return {
                type: "tool_use", toolUseId: n, toolName: "WebSearch", input: {
                    query: e.query,
                    action: e.action ?? null
                }
            };
        case "plan":
            return {
                type: "tool_use", toolUseId: n, toolName: "Plan", input: {
                    text: e.text
                }
            };
        case "collabAgentToolCall": {
            let r = typeof e.tool == "string" ? e.tool : "unknown";
            return {
                type: "tool_use",
                toolUseId: n,
                toolName: `CollabAgent${Kpe(r)}`,
                input: {
                    tool: r,
                    receiverThreadIds: e.receiverThreadIds,
                    prompt: e.prompt,
                    model: e.model,
                    reasoningEffort: e.reasoningEffort
                }
            }
        }
        case "imageView":
            return {
                type: "tool_use", toolUseId: n, toolName: "ImageView", input: {
                    path: e.path
                }
            };
        case "sleep":
            return {
                type: "tool_use", toolUseId: n, toolName: "Sleep", input: {
                    durationMs: e.durationMs
                }
            };
        case "subAgentActivity":
            return {
                type: "system", subtype: "codex_subagent_activity", data: {
                    kind: e.kind,
                    agentThreadId: e.agentThreadId,
                    agentPath: e.agentPath
                }
            };
        case "enteredReviewMode":
            return {
                type: "system", subtype: "codex_review_mode", data: {
                    phase: "entered",
                    review: e.review
                }
            };
        case "exitedReviewMode":
            return {
                type: "system", subtype: "codex_review_mode", data: {
                    phase: "exited",
                    review: e.review
                }
            };
        case "agentMessage":
            return e.phase === "commentary" ? {
                type: "system",
                subtype: "codex_commentary",
                data: {
                    text: e.text
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
            return Ype("started", t), null
    }
}
