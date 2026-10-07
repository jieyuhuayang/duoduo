// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: refreshSessionIndexEntry  (minified: kIe, daemon.pretty.js:90915)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.4 (medium): give a session a human label so it is legible in `list`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshSessionIndexEntry(e, t, n) {
    let [r, i] = await Promise.all([readSessionRuntimeState(e, n), readSessionMetaFile(e, n)]);
    lq(t, n, r, i)
}
