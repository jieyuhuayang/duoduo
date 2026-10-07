// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: bindSessionSourceChannel  (minified: pIe, daemon.pretty.js:90477)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function bindSessionSourceChannel(e, t, n) {
    n && (ah(n), await patchSessionRuntimeState(e, t, {
        source_channel_id: n
    }))
}
