// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: en, daemon.pretty.js:32104)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(e, t = new Date) {
    return {
        ...e,
        id: generateSpineEventId(),
        ts: t.toISOString()
    }
}
