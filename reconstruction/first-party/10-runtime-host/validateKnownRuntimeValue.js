// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: validateKnownRuntimeValue  (minified: uU, daemon.pretty.js:31801)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateKnownRuntimeValue(e, t) {
    return e == null ? {
        ok: !0,
        runtime: void 0
    } : isKnownRuntimeValue(e) ? {
        ok: !0,
        runtime: e
    } : {
        ok: !1,
        reason: `${t} sets runtime ${JSON.stringify(e)}, which is not a runtime this duoduo knows. Valid runtimes: ${hae(Lm)}.`
    }
}
