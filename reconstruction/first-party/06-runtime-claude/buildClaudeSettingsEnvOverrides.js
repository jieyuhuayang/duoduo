// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildClaudeSettingsEnvOverrides  (minified: tmt, daemon.pretty.js:67698)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildClaudeSettingsEnvOverrides(params) {
    let env = {},
        requirement = params.requirement;
    requirement?.kind === "profiled-external" && (env[Xpt] = String(requirement.requiredMaxContextTokens), requirement.baseUrl && (env[Qpt] = requirement.baseUrl), requirement.auth && (env[Ypt[requirement.auth.field]] = requirement.auth.token));
    for (let tier of ff) {
        let aliasModel = params.aliases?.[tier];
        aliasModel && (env[Kpt[tier]] = aliasModel)
    }
    return Object.keys(env).length === 0 ? void 0 : env
}
