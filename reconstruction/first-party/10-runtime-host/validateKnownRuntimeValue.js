// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: validateKnownRuntimeValue  (minified: uU, daemon.pretty.js:31801)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (high): From v0.8.4 the value is refused with a sentence that names it and lists the valid ones.
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
