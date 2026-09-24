// duoduo reconstruction — subsystem: 03-session-actor
// symbol: inferActorOriginFromSessionKey  (minified: GW, daemon.pretty.js:80247)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function inferActorOriginFromSessionKey(e) {
    if (e.startsWith("job:")) return {
        origin: "job"
    };
    if (e.startsWith("meta:") || e.startsWith("cadence:")) return {
        origin: "system"
    };
    if (e.startsWith("system:")) return {
        origin: "system"
    }
}
