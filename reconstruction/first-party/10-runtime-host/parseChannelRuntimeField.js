// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseChannelRuntimeField  (minified: Jrt, daemon.pretty.js:37550)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): In a channel kind or instance descriptor it refuses the turns of the sessions that layer selects; a valid instance value still overrides an unknown kind value.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseChannelRuntimeField(runtime) {
    let validation = validateKnownRuntimeValue(runtime, "This channel's config");
    return validation.ok ? validation.runtime === void 0 ? {} : {
        runtime: validation.runtime
    } : {
        runtimeRefusal: validation.reason
    }
}
