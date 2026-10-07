// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveDeliveryCursorPath  (minified: jbe, daemon.pretty.js:64419)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveDeliveryCursorPath(e, t, n) {
    return Nbe.join(resolveSessionDir(e, t), "delivery_cursors", `${wlt(n)}.json`)
}
