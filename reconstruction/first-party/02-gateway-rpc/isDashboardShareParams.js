// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isDashboardShareParams  (minified: jU, daemon.pretty.js:33089)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isDashboardShareParams(e) {
    return e == null ? !0 : isRecord(e) ? e.ttl_minutes === void 0 ? !0 : typeof e.ttl_minutes == "number" && Number.isInteger(e.ttl_minutes) && e.ttl_minutes > 0 : !1
}
