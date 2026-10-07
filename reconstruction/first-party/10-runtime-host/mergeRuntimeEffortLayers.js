// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: mergeRuntimeEffortLayers  (minified: Eve, daemon.pretty.js:65766)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): Reasoning effort gets the same global → kind → instance layering as the model
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeRuntimeEffortLayers(e) {
    return foldConfigLayersByKey(e.map(t => ({
        source: t.source,
        values: t.efforts
    })), (t, n) => ({
        effort: t,
        source: n
    }))
}
