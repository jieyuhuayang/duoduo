// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: foldConfigLayersByKey  (minified: SO, daemon.pretty.js:65727)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function foldConfigLayersByKey(e, t) {
    let n;
    for (let r of e)
        if (r.values) {
            n ??= {};
            for (let [i, o] of Object.entries(r.values)) n[i] = t(o, r.source)
        } return n
}
