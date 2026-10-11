// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildClaudeSettingsEnvOverrides  (minified: rct, daemon.pretty.js:65615)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildClaudeSettingsEnvOverrides(params) {
    let env = {},
        requirement = params.requirement;
    requirement?.kind === "profiled-external" && (env[ect] = String(requirement.requiredMaxContextTokens), requirement.baseUrl && (env[tct] = requirement.baseUrl), requirement.auth && (env[Qlt[requirement.auth.field]] = requirement.auth.token));
    for (let tier of sf) {
        let aliasModel = params.aliases?.[tier];
        aliasModel && (env[Xlt[tier]] = aliasModel)
    }
    return Object.keys(env).length === 0 ? void 0 : env
}
