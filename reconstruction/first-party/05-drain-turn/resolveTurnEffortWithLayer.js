// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveTurnEffortWithLayer  (minified: NSe, daemon.pretty.js:70260)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveTurnEffortWithLayer(e) {
    let t = e.sessionEffort ?? e.jobEffort;
    if (t) return {
        effort: t,
        configLayer: void 0
    };
    let n = readRuntimeEffortSetting(e.config ?? e.kindlessConfig, e.runtime ?? "claude");
    return {
        effort: n?.effort,
        configLayer: n?.source
    }
}
