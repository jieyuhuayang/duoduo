// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildEffectiveRuntimeFields  (minified: fct, daemon.pretty.js:65708)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (medium): In a channel kind or instance descriptor it refuses the turns of the sessions that layer selects; a valid instance value still overrides an unknown kind value.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildEffectiveRuntimeFields(e, t) {
    let n = resolveLayeredChannelRuntime(e, t);
    return n.ok ? n.runtime === void 0 ? {} : {
        runtime: n.runtime
    } : {
        runtimeRefusal: n.reason
    }
}
