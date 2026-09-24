// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveTurnModelWithLayer  (minified: ASe, daemon.pretty.js:70247)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveTurnModelWithLayer(e) {
    let t = e.jobModel ?? e.sessionModel;
    if (t) return {
        model: t,
        configLayer: void 0
    };
    let n = readRuntimeModelSetting(e.config ?? e.kindlessConfig, e.runtime ?? "claude");
    return {
        model: n?.model,
        configLayer: n?.source
    }
}
