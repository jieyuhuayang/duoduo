// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isProviderQualifiedModelId  (minified: DI, daemon.pretty.js:38910)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): a job naming a model pi cannot run is refused when you create it, not when it next fires.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isProviderQualifiedModelId(modelId) {
    let slashIndex = modelId.indexOf("/");
    return slashIndex > 0 && slashIndex !== modelId.length - 1
}
