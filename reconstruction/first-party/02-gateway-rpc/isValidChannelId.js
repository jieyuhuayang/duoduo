// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isValidChannelId  (minified: sh, daemon.pretty.js:35805)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isValidChannelId(e) {
    return !!e && e.length <= KQe && ZQe.test(e)
}
