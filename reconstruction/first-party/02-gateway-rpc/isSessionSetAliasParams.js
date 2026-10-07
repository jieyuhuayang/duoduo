// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionSetAliasParams  (minified: sR, daemon.pretty.js:31564)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.4 (medium): `duoduo session alias <key> "<name>"` — give a session a human label so it is legible in `list` and usable as a wake target.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionSetAliasParams(e) {
    return !isRecord(e) || typeof e.session_key != "string" || e.session_key.trim().length === 0 ? !1 : e.display_name === null || typeof e.display_name == "string"
}
