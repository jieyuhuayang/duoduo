// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: writeConsumerOffsetFile  (minified: EYe, daemon.pretty.js:32958)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeConsumerOffsetFile(e, t, n) {
    await Bt(resolveConsumerOffsetPath(e, t), n)
}
