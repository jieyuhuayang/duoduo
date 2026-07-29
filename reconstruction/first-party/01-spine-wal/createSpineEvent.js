// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: en, daemon.pretty.js:30677)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(e, t = new Date) {
    return {
        ...e,
        id: x2e(),
        ts: t.toISOString()
    }
}
