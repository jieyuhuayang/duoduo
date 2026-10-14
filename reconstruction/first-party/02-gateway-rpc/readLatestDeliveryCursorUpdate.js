// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readLatestDeliveryCursorUpdate  (minified: tO, daemon.pretty.js:64719)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): `duoduo daemon status` grew a block listing each channel session's last consumer take
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readLatestDeliveryCursorUpdate(paths, sessionKey) {
    return Zbe(await Gbe(paths, sessionKey))
}
