// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionListKind  (minified: eU, daemon.pretty.js:31556)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.4 (high): `duoduo session list [--kind …] [--named] [--all] [--json]`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionListKind(e) {
    return e === "channel" || e === "job" || e === "meta" || e === "subconscious" || e === "system"
}
