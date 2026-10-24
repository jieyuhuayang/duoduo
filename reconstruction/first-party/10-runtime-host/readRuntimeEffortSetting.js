// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readRuntimeEffortSetting  (minified: wS, daemon.pretty.js:67863)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): Reasoning effort gets the same global → kind → instance layering as the model
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readRuntimeEffortSetting(config, runtime) {
    return config?.runtimeEfforts?.[runtime]
}
