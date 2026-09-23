// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: rn, daemon.pretty.js:32001)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(e, t = new Date) {
    return {
        ...e,
        id: K9e(),
        ts: t.toISOString()
    }
}
