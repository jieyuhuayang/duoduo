// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveTurnModelWithLayer  (minified: kxe, daemon.pretty.js:70538)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): Set a default model for Claude, Codex, pi or Grok, globally or per channel kind or per channel instance, with the most specific layer winning.
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
