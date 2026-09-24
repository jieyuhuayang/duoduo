// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: overlayConfigEntriesByKey  (minified: GV, daemon.pretty.js:65559)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function overlayConfigEntriesByKey(e, t, n) {
    if (!t) return e;
    let r = {
        ...e ?? {}
    };
    for (let [i, o] of Object.entries(t)) r[i] = n(o);
    return r
}
