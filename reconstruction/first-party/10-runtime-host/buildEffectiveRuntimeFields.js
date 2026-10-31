// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildEffectiveRuntimeFields  (minified: Pft, daemon.pretty.js:67015)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): In a channel kind or instance descriptor it refuses the turns of the sessions that layer selects; a valid instance value still overrides an unknown kind value.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildEffectiveRuntimeFields(instanceDescriptor, kindDescriptor) {
    let layeredChannelRuntime = resolveLayeredChannelRuntime(instanceDescriptor, kindDescriptor);
    return layeredChannelRuntime.ok ? layeredChannelRuntime.runtime === void 0 ? {} : {
        runtime: layeredChannelRuntime.runtime
    } : {
        runtimeRefusal: layeredChannelRuntime.reason
    }
}
