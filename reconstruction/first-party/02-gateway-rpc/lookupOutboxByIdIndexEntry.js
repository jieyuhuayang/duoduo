// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: lookupOutboxByIdIndexEntry  (minified: ia, daemon.pretty.js:36320)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function lookupOutboxByIdIndexEntry(e, t) {
    return (await uet(e)).get(t)
}
