// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: validateRunnableRuntimeValue  (minified: Hd, daemon.pretty.js:31814)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `void` is not accepted as the default runtime, a job runtime or a partition runtime, and should not be set on an ordinary chat channel.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateRunnableRuntimeValue(runtime, sourceLabel) {
    let knownResult = validateKnownRuntimeValue(runtime, sourceLabel);
    return knownResult.ok ? knownResult.runtime === void 0 ? {
        ok: !0,
        runtime: void 0
    } : isSupportedRuntime(knownResult.runtime) ? {
        ok: !0,
        runtime: knownResult.runtime
    } : {
        ok: !1,
        reason: `${sourceLabel} sets runtime "void", which never runs a model, so it cannot run there. Use one of ${gae(AR)}.`
    } : knownResult
}
