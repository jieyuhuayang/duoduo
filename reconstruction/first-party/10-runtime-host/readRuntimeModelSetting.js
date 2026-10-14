// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readRuntimeModelSetting  (minified: uS, daemon.pretty.js:65777)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): Set a default model for Claude, Codex, pi or Grok, globally or per channel kind or per channel instance
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readRuntimeModelSetting(config, runtime) {
    return config?.runtimeModels?.[runtime]
}
