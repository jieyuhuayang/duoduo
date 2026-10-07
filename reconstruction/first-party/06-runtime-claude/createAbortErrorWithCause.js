// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAbortErrorWithCause  (minified: fg, daemon.pretty.js:55027)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAbortErrorWithCause(e, t) {
    let n = new Error(e);
    return n.name = "AbortError", t !== void 0 && (n.cause = t), n
}
