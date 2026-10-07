// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isVoidRuntimeSession  (minified: Gu, daemon.pretty.js:36952)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isVoidRuntimeSession(e, t, n) {
    let r = await resolveSessionChannelRuntime(e, t, n);
    return r.ok && r.runtime === "void"
}
