// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJobInterruptParams  (minified: PR, daemon.pretty.js:31754)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 job.ts (maps/published_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (high): `duoduo job list | read | archive | interrupt | reschedule`. Interrupting carries a reason
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobInterruptParams(e) {
    return !(!isRecord(e) || typeof e.id != "string" || typeof e.reason != "string")
}
