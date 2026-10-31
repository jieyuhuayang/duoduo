// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: lookupOutboxByIdIndexEntry  (minified: la, daemon.pretty.js:37533)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function lookupOutboxByIdIndexEntry(paths, recordId) {
    return (await Ent(paths)).get(recordId)
}
