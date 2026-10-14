// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: foldConfigLayersByKey  (minified: SO, daemon.pretty.js:65728)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function foldConfigLayersByKey(layers, mapValue) {
    let merged;
    for (let layer of layers)
        if (layer.values) {
            merged ??= {};
            for (let [key, value] of Object.entries(layer.values)) merged[key] = mapValue(value, layer.source)
        } return merged
}
