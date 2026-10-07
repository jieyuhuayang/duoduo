// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isSupportedRuntime  (minified: Eb, daemon.pretty.js:31797)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.4 (medium): `void` is not accepted as the default runtime, a job runtime or a partition runtime, and should not be set on an ordinary chat channel.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSupportedRuntime(e) {
    return isModelRuntime(e)
}
