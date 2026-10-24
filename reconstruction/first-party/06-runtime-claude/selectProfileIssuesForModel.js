// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: selectProfileIssuesForModel  (minified: ty, daemon.pretty.js:72100)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function selectProfileIssuesForModel(requirement, issues) {
    if (!issues || issues.length === 0) return [];
    let model = f_t(requirement);
    return model === null ? [] : issues.filter(issue => issue.model === void 0 || issue.model === model)
}
