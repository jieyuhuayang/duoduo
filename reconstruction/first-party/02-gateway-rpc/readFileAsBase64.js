// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readFileAsBase64  (minified: vve, daemon.pretty.js:88254)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readFileAsBase64(e) {
    return (await bO.readFile(e)).toString("base64")
}
