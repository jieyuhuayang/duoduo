// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: on, daemon.pretty.js:32001)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(e, t = new Date) {
    return {
        ...e,
        id: W9e(),
        ts: t.toISOString()
    }
}
