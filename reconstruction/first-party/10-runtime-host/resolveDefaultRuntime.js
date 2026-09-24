// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveDefaultRuntime  (minified: Co, daemon.pretty.js:31733)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveDefaultRuntime(e = process.env) {
    let t = e.ALADUO_DEFAULT_RUNTIME;
    if (typeof t != "string") return "claude";
    let n = t.trim().toLowerCase();
    return n.length === 0 ? "claude" : isSupportedRuntime(n) ? n : "claude"
}
