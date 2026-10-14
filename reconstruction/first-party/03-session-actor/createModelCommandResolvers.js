// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createModelCommandResolvers  (minified: JRe, daemon.pretty.js:83001)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 29 renamed — 7 from the code at the binding (rule), 22 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): Model commands (`/model`, `/effort`, `/compact`) refuse it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createModelCommandResolvers(deps) {
    let {
        paths
    } = deps, toModelOptions = models => models.map(model => ({
        value: model.value,
        displayName: model.displayName
    }));
    async function resolveRuntimeForModelCommand(sessionKey, options) {
        if (options?.runtime === "grok") return "grok";
        if (options?.runtime === "codex") return "codex";
        if (options?.runtime === "pi") return "pi";
        let sessionChannelRuntime = await resolveSessionChannelRuntime(paths, sessionKey);
        return (sessionChannelRuntime.ok ? sessionChannelRuntime.runtime : void 0) ?? resolveDefaultRuntime()
    }
    async function runtimeCommandRefusal(sessionKey) {
        let sessionChannelRuntime = await resolveSessionChannelRuntime(paths, sessionKey);
        return sessionChannelRuntime.ok ? sessionChannelRuntime.runtime === "void" ? `${Ju} It has no model or effort to show or set.` : void 0 : sessionChannelRuntime.reason
    }
    async function resolveModelProfileScope(sessionKey, source) {
        let channelConfigBySession = await resolveChannelConfigBySession(paths, sessionKey);
        if (channelConfigBySession) return channelConfigBySession;
        if (isBusinessSourceKind(source?.sourceKind)) {
            let effectiveChannelConfig = await resolveEffectiveChannelConfig(paths, {
                channel_kind: source?.sourceKind,
                channel_id: source?.sourceChannelId
            });
            if (effectiveChannelConfig) return effectiveChannelConfig
        }
        return mergeGlobalModelConfigLayers(await loadGlobalRuntimeConfig(paths.channelConfigDir))
    }
    async function classifyModelTargetAgainstLiveGeneration(sessionKey, actor, model, source) {
        let liveContextToken = actor ? readLiveStreamContextToken(actor) : void 0,
            liveProfileSignature = actor ? WRe(actor) : void 0,
            profileScope = await resolveModelProfileScope(sessionKey, source),
            cwd = model ? void 0 : buildSessionInfoFromState(paths, sessionKey, await readSessionRuntimeState(paths, sessionKey).catch(() => null) ?? void 0).cwd,
            claudeContextRequirement = await resolveClaudeContextRequirement({
                model,
                cwd,
                daemonEnv: process.env,
                mergedCatalog: profileScope.claudeModelProfiles ?? {},
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                issues: profileScope.claudeModelProfileIssues
            }),
            profileIssuesForModel = selectProfileIssuesForModel(claudeContextRequirement, profileScope.claudeModelProfileIssues);
        if (profileIssuesForModel.length > 0) return {
            outcome: "blocked",
            detail: cA(profileIssuesForModel)
        };
        let contextWindow = nxe(claudeContextRequirement);
        return liveContextToken === void 0 || liveProfileSignature === void 0 ? {
            outcome: "unknown",
            requirementKind: claudeContextRequirement.kind,
            contextWindow
        } : {
            outcome: computeContextProfileSignature({
                capToken: resolveContextCapToken({
                    requirement: claudeContextRequirement,
                    hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                    liveGenerationToken: liveContextToken
                }),
                requirement: claudeContextRequirement,
                aliases: yO(profileScope.claudeModelAliases)
            }) === liveProfileSignature ? "compatible" : "rebuild",
            requirementKind: claudeContextRequirement.kind,
            contextWindow
        }
    }
    return {
        toModelOptions,
        resolveRuntimeForModelCommand,
        runtimeCommandRefusal,
        resolveModelProfileScope,
        classifyModelTargetAgainstLiveGeneration
    }
}
