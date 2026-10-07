// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: findDeadAllowedToolEntries  (minified: Zge, daemon.pretty.js:55261)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.10 (medium): a startup warning flags any descriptor still relying on the old behavior.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findDeadAllowedToolEntries(e, t) {
    let n = new Set(t);
    return e.filter(r => r.startsWith("mcp__") ? !1 : !n.has(r === "Task" ? "Agent" : r))
}
