// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: mergeRuntimeEffortLayers  (minified: zwe, daemon.pretty.js:67073)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): Reasoning effort gets the same global → kind → instance layering as the model
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeRuntimeEffortLayers(layers) {
    return foldConfigLayersByKey(layers.map(layer => ({
        source: layer.source,
        values: layer.efforts
    })), (effort, source) => ({
        effort,
        source
    }))
}
