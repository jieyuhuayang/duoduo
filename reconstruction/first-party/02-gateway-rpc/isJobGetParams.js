// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJobGetParams  (minified: ER, daemon.pretty.js:31738)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 job.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobGetParams(e) {
    return !(!isRecord(e) || typeof e.id != "string")
}
