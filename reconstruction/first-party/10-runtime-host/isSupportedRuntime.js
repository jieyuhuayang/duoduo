// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isSupportedRuntime  (minified: jb, daemon.pretty.js:33879)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): `void` is not accepted as the default runtime, a job runtime or a partition runtime, and should not be set on an ordinary chat channel.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSupportedRuntime(runtime) {
    return isModelRuntime(runtime)
}
