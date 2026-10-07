// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionArchiveParams  (minified: iR, daemon.pretty.js:31552)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): `session.archive` RPC + `duoduo session archive <session_key>` CLI retired the old ad-hoc deletion paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionArchiveParams(e) {
    return !isRecord(e) || typeof e.session_key != "string" ? !1 : e.session_key.length > 0
}
