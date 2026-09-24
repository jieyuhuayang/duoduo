// duoduo reconstruction — subsystem: 03-session-actor
// symbol: releaseSessionDrainLock  (minified: _Se, daemon.pretty.js:69899)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function releaseSessionDrainLock(e, t) {
    let n = fH(e, t);
    try {
        await hSe.unlink(n)
    } catch {}
}
