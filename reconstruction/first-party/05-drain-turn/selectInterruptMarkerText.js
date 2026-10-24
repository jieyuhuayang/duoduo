// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: selectInterruptMarkerText  (minified: jg, daemon.pretty.js:64182)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): The model is told when a human ended its turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function selectInterruptMarkerText(abortReason, interrupted) {
    return abortReason === "user-cancel" ? hft : interrupted ? gft : null
}
