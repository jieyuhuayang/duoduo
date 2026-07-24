// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: nn, daemon.pretty.js:30657)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(e, t = new Date) {
    return {
        ...e,
        id: l2e(),
        ts: t.toISOString()
    }
}
