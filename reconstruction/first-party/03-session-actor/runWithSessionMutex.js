// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runWithSessionMutex  (minified: Vi, daemon.pretty.js:32410)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runWithSessionMutex(e, t) {
    let n, r = new Promise(o => {
            n = o
        }),
        i = uR.get(e) ?? Promise.resolve();
    uR.set(e, r), await i;
    try {
        return await t()
    } finally {
        n(), uR.get(e) === r && uR.delete(e)
    }
}
