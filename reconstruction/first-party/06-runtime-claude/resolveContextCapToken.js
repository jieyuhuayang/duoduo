// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveContextCapToken  (minified: np, daemon.pretty.js:69897)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveContextCapToken(params) {
    let hostCapToken = fmt(params.hostMaxContextTokens),
        requirement = params.requirement;
    return requirement?.kind === "profiled-external" ? String(requirement.requiredMaxContextTokens) : requirement?.kind === "native-claude" || requirement?.kind === "explicit-1m" ? params.liveGenerationToken === void 0 ? hostCapToken : params.liveGenerationToken : hostCapToken
}
