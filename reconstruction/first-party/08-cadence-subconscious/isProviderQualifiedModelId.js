// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isProviderQualifiedModelId  (minified: bI, daemon.pretty.js:36828)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): a job naming a model pi cannot run is refused when you create it, not when it next fires.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isProviderQualifiedModelId(e) {
    let t = e.indexOf("/");
    return t > 0 && t !== e.length - 1
}
