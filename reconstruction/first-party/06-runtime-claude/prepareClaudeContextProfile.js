// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: prepareClaudeContextProfile  (minified: fA, daemon.pretty.js:70230)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0, v0.8.1 (maps/history_daemon.json)
// changelog v0.7.0 (high): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function prepareClaudeContextProfile(e, t) {
    if (!isClaudeRuntimeOrDefault(t.runtime)) return {};
    let n = t.effective ?? t.kindlessConfig ?? mergeGlobalModelConfigLayers(await loadGlobalRuntimeConfig(e.channelConfigDir), t.jobOverlay),
        r = await resolveClaudeContextRequirement({
            model: t.model,
            cwd: t.cwd,
            daemonEnv: process.env,
            mergedCatalog: n.claudeModelProfiles ?? {},
            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
            issues: n.claudeModelProfileIssues
        }),
        i = t.modelOrigin === void 0 ? r : {
            ...r,
            modelOrigin: t.modelOrigin
        },
        o = selectProfileIssuesForModel(i, n.claudeModelProfileIssues);
    if (o.length > 0) throw new Error(`[claude-context-profile] refusing to run under an unresolved model context profile for model "${i.model}": ${cA(o)}`);
    let s = yO(n.claudeModelAliases),
        a = await materializeClaudeSettingsFile({
            dir: _O(e),
            requirement: i,
            aliases: s
        }),
        u = i.kind === "profiled-external" && i.modelOrigin !== void 0 ? i.model : void 0;
    return {
        requirement: i,
        aliases: s,
        settingsPath: a,
        effectiveModel: u
    }
}
