// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createModelCommandResolvers  (minified: e0e, daemon.pretty.js:82653)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createModelCommandResolvers(e) {
    let {
        paths: t
    } = e, n = s => s.map(a => ({
        value: a.value,
        displayName: a.displayName
    }));
    async function r(s, a) {
        if (a?.runtime === "grok") return "grok";
        if (a?.runtime === "codex") return "codex";
        if (a?.runtime === "pi") return "pi";
        let l = (await ct(t, s).catch(() => null))?.source_channel_id,
            c;
        if (l) {
            let d = await ho(t, l).catch(() => null),
                f = d?.channel_kind,
                p = f ? await ys(t.channelConfigDir, f).catch(() => null) : null;
            c = d?.runtime ?? p?.runtime
        }
        return c ??= resolveDefaultRuntime(), c
    }
    async function i(s, a) {
        let u = await Ga(t, s);
        if (u) return u;
        if (Lw(a?.sourceKind)) {
            let l = await Za(t, {
                channel_kind: a?.sourceKind,
                channel_id: a?.sourceChannelId
            });
            if (l) return l
        }
        return Ja(await si(t.channelConfigDir))
    }
    async function o(s, a, u, l) {
        let c = a ? AA(a) : void 0,
            d = a ? QEe(a) : void 0,
            f = await i(s, l),
            p = u ? void 0 : buildSessionInfoFromState(t, s, await ct(t, s).catch(() => null) ?? void 0).cwd,
            m = await Eg({
                model: u,
                cwd: p,
                daemonEnv: process.env,
                mergedCatalog: f.claudeModelProfiles ?? {},
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                issues: f.claudeModelProfileIssues
            }),
            h = xg(m, f.claudeModelProfileIssues);
        if (h.length > 0) return {
            outcome: "blocked",
            detail: _O(h)
        };
        let g = lSe(m);
        return c === void 0 || d === void 0 ? {
            outcome: "unknown",
            requirementKind: m.kind,
            contextWindow: g
        } : {
            outcome: Nw({
                capToken: zf({
                    requirement: m,
                    hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                    liveGenerationToken: c
                }),
                requirement: m,
                aliases: D$(f.claudeModelAliases)
            }) === d ? "compatible" : "rebuild",
            requirementKind: m.kind,
            contextWindow: g
        }
    }
    return {
        toModelOptions: n,
        resolveRuntimeForModelCommand: r,
        resolveModelProfileScope: i,
        classifyModelTargetAgainstLiveGeneration: o
    }
}
