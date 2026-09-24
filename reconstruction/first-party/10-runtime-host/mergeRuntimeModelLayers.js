// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: mergeRuntimeModelLayers  (minified: sbe, daemon.pretty.js:65485)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
