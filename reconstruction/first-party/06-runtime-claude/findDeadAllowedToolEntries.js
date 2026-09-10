// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: findDeadAllowedToolEntries  (minified: $de, daemon.pretty.js:49819)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findDeadAllowedToolEntries(e, t) {
    let n = new Set(t);
    return e.filter(r => r.startsWith("mcp__") ? !1 : !n.has(r === "Task" ? "Agent" : r))
}
