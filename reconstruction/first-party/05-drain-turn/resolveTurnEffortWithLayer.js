// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveTurnEffortWithLayer  (minified: bEe, daemon.pretty.js:72634)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): Reasoning effort gets the same global → kind → instance layering as the model, so a session's effort no longer depends on the underlying CLI's own configuration file.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveTurnEffortWithLayer(params) {
    let explicitEffort = params.sessionEffort ?? params.jobEffort;
    if (explicitEffort) return {
        effort: explicitEffort,
        configLayer: void 0
    };
    let runtimeEffortSetting = readRuntimeEffortSetting(params.config ?? params.kindlessConfig, params.runtime ?? "claude");
    return {
        effort: runtimeEffortSetting?.effort,
        configLayer: runtimeEffortSetting?.source
    }
}
