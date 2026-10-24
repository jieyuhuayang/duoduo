// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: findDeadAllowedToolEntries  (minified: q_e, daemon.pretty.js:57343)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (medium): a startup warning flags any descriptor still relying on the old behavior.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findDeadAllowedToolEntries(allowedTools, tools) {
    let toolSet = new Set(tools);
    return allowedTools.filter(tool => tool.startsWith("mcp__") ? !1 : !toolSet.has(tool === "Task" ? "Agent" : tool))
}
