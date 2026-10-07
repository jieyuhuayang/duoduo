// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: hasNonEmptyDisplayName  (minified: Zf, daemon.pretty.js:64850)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasNonEmptyDisplayName(e) {
    return typeof e.display_name == "string" && e.display_name.trim().length > 0
}
