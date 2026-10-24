// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveClaudeContextRequirement  (minified: ny, daemon.pretty.js:72216)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveClaudeContextRequirement(params) {
    let requirement = classifyModelContextRequirement({
        model: params.model,
        mergedCatalog: params.mergedCatalog,
        hostMaxContextTokens: params.hostMaxContextTokens
    });
    if (params.model) return requirement;
    let settingsModel = await g_t(params.cwd, params.daemonEnv);
    if (!settingsModel) return requirement;
    let settingsRequirement = classifyModelContextRequirement({
        model: settingsModel.model,
        mergedCatalog: params.mergedCatalog,
        hostMaxContextTokens: params.hostMaxContextTokens
    });
    return settingsRequirement.kind === "profiled-external" ? {
        ...settingsRequirement,
        modelOrigin: settingsModel.origin
    } : selectProfileIssuesForModel(settingsRequirement, params.issues).some(issue => issue.model !== void 0) ? settingsRequirement : requirement
}
