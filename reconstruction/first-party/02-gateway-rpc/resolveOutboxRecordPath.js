// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxRecordPath  (minified: Xb, daemon.pretty.js:36040)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxRecordPath(e, t, n) {
    return Lr.join(e.outboxDir, t, `${n}.json`)
}
