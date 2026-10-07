// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: memoizeIndexLoad  (minified: zu, daemon.pretty.js:31939)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function memoizeIndexLoad(e, t, n) {
    return e.load || (e.load = t(), e.load.catch(() => {
        e.load = void 0, n?.()
    })), e.load
}
