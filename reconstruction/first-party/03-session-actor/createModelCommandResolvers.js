// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createModelCommandResolvers  (minified: VRe, daemon.pretty.js:82955)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.3, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.4 (high): Model commands (`/model`, `/effort`, `/compact`) refuse it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createModelCommandResolvers(e) {
    let {
        paths: t
    } = e, n = a => a.map(u => ({
        value: u.value,
        displayName: u.displayName
    }));
    async function r(a, u) {
        if (u?.runtime === "grok") return "grok";
        if (u?.runtime === "codex") return "codex";
        if (u?.runtime === "pi") return "pi";
        let l = await resolveSessionChannelRuntime(t, a);
        return (l.ok ? l.runtime : void 0) ?? resolveDefaultRuntime()
    }
    async function i(a) {
        let u = await resolveSessionChannelRuntime(t, a);
        return u.ok ? u.runtime === "void" ? `${Ju} It has no model or effort to show or set.` : void 0 : u.reason
    }
    async function o(a, u) {
        let l = await resolveChannelConfigBySession(t, a);
        if (l) return l;
        if (isBusinessSourceKind(u?.sourceKind)) {
            let c = await resolveEffectiveChannelConfig(t, {
                channel_kind: u?.sourceKind,
                channel_id: u?.sourceChannelId
            });
            if (c) return c
        }
        return mergeGlobalModelConfigLayers(await loadGlobalRuntimeConfig(t.channelConfigDir))
    }
    async function s(a, u, l, c) {
        let d = u ? readLiveStreamContextToken(u) : void 0,
            f = u ? BRe(u) : void 0,
            p = await o(a, c),
            m = l ? void 0 : buildSessionInfoFromState(t, a, await readSessionRuntimeState(t, a).catch(() => null) ?? void 0).cwd,
            h = await resolveClaudeContextRequirement({
                model: l,
                cwd: m,
                daemonEnv: process.env,
                mergedCatalog: p.claudeModelProfiles ?? {},
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                issues: p.claudeModelProfileIssues
            }),
            g = selectProfileIssuesForModel(h, p.claudeModelProfileIssues);
        if (g.length > 0) return {
            outcome: "blocked",
            detail: cA(g)
        };
        let y = Qke(h);
        return d === void 0 || f === void 0 ? {
            outcome: "unknown",
            requirementKind: h.kind,
            contextWindow: y
        } : {
            outcome: computeContextProfileSignature({
                capToken: resolveContextCapToken({
                    requirement: h,
                    hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                    liveGenerationToken: d
                }),
                requirement: h,
                aliases: yO(p.claudeModelAliases)
            }) === f ? "compatible" : "rebuild",
            requirementKind: h.kind,
            contextWindow: y
        }
    }
    return {
        toModelOptions: n,
        resolveRuntimeForModelCommand: r,
        runtimeCommandRefusal: i,
        resolveModelProfileScope: o,
        classifyModelTargetAgainstLiveGeneration: s
    }
}
