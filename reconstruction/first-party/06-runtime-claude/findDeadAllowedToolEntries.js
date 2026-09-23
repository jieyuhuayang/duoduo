// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: findDeadAllowedToolEntries  (minified: The, daemon.pretty.js:54945)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findDeadAllowedToolEntries(e, t) {
    let n = new Set(t);
    return e.filter(r => r.startsWith("mcp__") ? !1 : !n.has(r === "Task" ? "Agent" : r))
}
