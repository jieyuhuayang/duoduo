// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseEnvBooleanFlag  (minified: wm, daemon.pretty.js:31909)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseEnvBooleanFlag(e) {
    if (!e) return !1;
    switch (e.trim().toLowerCase()) {
        case "1":
        case "true":
        case "yes":
        case "on":
            return !0;
        default:
            return !1
    }
}
