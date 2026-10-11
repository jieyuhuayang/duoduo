// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJobRescheduleParams  (minified: TR, daemon.pretty.js:31750)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 job.ts (maps/published_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (high): `duoduo job list | read | archive | interrupt | reschedule`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobRescheduleParams(params) {
    return !(!isRecord(params) || typeof params.id != "string" || typeof params.when != "string")
}
