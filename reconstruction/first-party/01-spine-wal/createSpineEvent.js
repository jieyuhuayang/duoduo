// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: Qt, daemon.pretty.js:31432)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(e, t = new Date) {
    return {
        ...e,
        id: dJe(),
        ts: t.toISOString()
    }
}
