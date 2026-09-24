// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxRecordPath  (minified: Tb, daemon.pretty.js:35914)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxRecordPath(e, t, n) {
    return Mr.join(e.outboxDir, t, `${n}.json`)
}
