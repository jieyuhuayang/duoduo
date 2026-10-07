// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readRuntimeModelSetting  (minified: uS, daemon.pretty.js:65776)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.1 (medium): Set a default model for Claude, Codex, pi or Grok, globally or per channel kind or per channel instance
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readRuntimeModelSetting(e, t) {
    return e?.runtimeModels?.[t]
}
