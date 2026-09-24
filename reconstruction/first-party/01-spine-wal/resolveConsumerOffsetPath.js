// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: resolveConsumerOffsetPath  (minified: C5e, daemon.pretty.js:32852)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveConsumerOffsetPath(e, t) {
    return P5e.join(e.runQueueOffsetsDir, `${t}.json`)
}
