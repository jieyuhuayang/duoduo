// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: mergeRuntimeModelLayers  (minified: xve, daemon.pretty.js:65756)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): globally or per channel kind or per channel instance, with the most specific layer winning.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeRuntimeModelLayers(e) {
    return foldConfigLayersByKey(e.map(t => ({
        source: t.source,
        values: t.models
    })), (t, n) => ({
        model: t,
        source: n
    }))
}
