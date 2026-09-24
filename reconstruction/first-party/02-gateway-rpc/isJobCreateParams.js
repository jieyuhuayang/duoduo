// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJobCreateParams  (minified: J0, daemon.pretty.js:31671)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobCreateParams(e) {
    return !(!Nt(e) || typeof e.id != "string" || typeof e.cron != "string" || typeof e.instruction != "string" || e.owner_session !== void 0 && typeof e.owner_session != "string" || e.cwd_rel !== void 0 && typeof e.cwd_rel != "string")
}
