// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: validateRunnableRuntimeValue  (minified: Wd, daemon.pretty.js:31814)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateRunnableRuntimeValue(e, t) {
    let n = validateKnownRuntimeValue(e, t);
    return n.ok ? n.runtime === void 0 ? {
        ok: !0,
        runtime: void 0
    } : isSupportedRuntime(n.runtime) ? {
        ok: !0,
        runtime: n.runtime
    } : {
        ok: !1,
        reason: `${t} sets runtime "void", which never runs a model, so it cannot run there. Use one of ${hae(AR)}.`
    } : n
}
