// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isModelRuntime  (minified: sU, daemon.pretty.js:31673)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// changelog v0.8.4 (medium): `void` is not accepted as the default runtime, a job runtime or a partition runtime, and should not be set on an ordinary chat channel.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isModelRuntime(e) {
    return typeof e == "string" && hR.includes(e)
}
