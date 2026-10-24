// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: prepareClaudeContextProfile  (minified: TA, daemon.pretty.js:72313)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (high): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function prepareClaudeContextProfile(paths, params) {
    if (!isClaudeRuntimeOrDefault(params.runtime)) return {};
    let config = params.effective ?? params.kindlessConfig ?? mergeGlobalModelConfigLayers(await loadGlobalRuntimeConfig(paths.channelConfigDir), params.jobOverlay),
        claudeContextRequirement = await resolveClaudeContextRequirement({
            model: params.model,
            cwd: params.cwd,
            daemonEnv: process.env,
            mergedCatalog: config.claudeModelProfiles ?? {},
            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
            issues: config.claudeModelProfileIssues
        }),
        requirement = params.modelOrigin === void 0 ? claudeContextRequirement : {
            ...claudeContextRequirement,
            modelOrigin: params.modelOrigin
        },
        profileIssuesForModel = selectProfileIssuesForModel(requirement, config.claudeModelProfileIssues);
    if (profileIssuesForModel.length > 0) throw new Error(`[claude-context-profile] refusing to run under an unresolved model context profile for model "${requirement.model}": ${RA(profileIssuesForModel)}`);
    let aliases = AO(config.claudeModelAliases),
        settingsPath = await materializeClaudeSettingsFile({
            dir: NO(paths),
            requirement,
            aliases
        }),
        effectiveModel = requirement.kind === "profiled-external" && requirement.modelOrigin !== void 0 ? requirement.model : void 0;
    return {
        requirement,
        aliases,
        settingsPath,
        effectiveModel
    }
}
