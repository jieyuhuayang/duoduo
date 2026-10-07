// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionCompactParams  (minified: dR, daemon.pretty.js:31584)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.8 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.8 (medium): `duoduo session compact` — compact a channel session's context on demand.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionCompactParams(e) {
    return !(!isRecord(e) || typeof e.target != "string" || e.target.trim().length === 0 || e.source !== void 0 && typeof e.source != "string")
}
