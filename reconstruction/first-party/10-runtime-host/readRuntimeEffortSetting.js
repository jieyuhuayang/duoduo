// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readRuntimeEffortSetting  (minified: lS, daemon.pretty.js:65780)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.1 (medium): Reasoning effort gets the same global → kind → instance layering as the model
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readRuntimeEffortSetting(e, t) {
    return e?.runtimeEfforts?.[t]
}
