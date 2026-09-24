// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runDrainTurnWithResumeFallback  (minified: jft, daemon.pretty.js:72483)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runDrainTurnWithResumeFallback(e, t, n, r) {
    let {
        sessionId: i,
        forkFrom: o,
        prompt: s,
        mcpServers: a,
        mcpServersFactory: u,
        attachments: l,
        runtime: c,
        usesStreamingAdapter: d,
        ...f
    } = r;
    isClaudeRuntimeOrDefault(c) && !d && _t("info", "[claude-context-profile] non-streaming subprocess spawned", {
        sessionKey: t,
        model: f.model ?? "default",
        context_profile_source: hO(f.claudeContextRequirement),
        max_context_token: zf({
            requirement: f.claudeContextRequirement,
            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
            liveGenerationToken: void 0
        }),
        ...gO(f.claudeContextRequirement),
        alias_tiers: yO(f.claudeModelAliases)
    });
    let p = f.onStream,
        m = f.onExecutionEvent,
        h = {
            ...f
        },
        g = () => new SO($ => p?.($), $ => m?.({
            type: "thought_chunk",
            text: $
        })),
        y;
    p && (y = g(), h.onStream = ($, C) => {
        if (C) {
            p($, !0);
            return
        }
        y.push($)
    }, h.onExecutionEvent = $ => {
        $.type === "tool_result" && y.reset(), m?.($)
    });
    let v = ($, C) => {
            y?.flush();
            let A = $.text;
            if (A) {
                let F = wSe(A);
                if (A = F.text, !p && F.thoughts.length > 0 && m)
                    for (let k of F.thoughts) m({
                        type: "thought_chunk",
                        text: k
                    })
            }
            return {
                ...$,
                text: A,
                ...C
            }
        },
        b = {
            runtimeDir: e.runtimeDir
        },
        _ = !isClaudeRuntimeOrDefault(c),
        I = _ ? void 0 : l,
        E = _ ? l : void 0,
        R = () => c === "pi" ? Nft(s) : eventToMessageGenerator(s, I, b),
        x = R(),
        S = ($, C, A) => {
            let F = u ? u() : a,
                k = {
                    prompt: $,
                    sessionId: C,
                    forkFrom: A,
                    ...E ? {
                        attachments: E
                    } : {},
                    ...h
                };
            return F === void 0 ? k : {
                ...k,
                mcpServers: F
            }
        };
    if (o) {
        let $ = Date.now(),
            C = await n.run(S(x, void 0, o));
        return v(C, {
            usedFallback: !1,
            turnStartedAt: $
        })
    }
    if (!i) {
        let $ = Date.now(),
            C = await n.run(S(x, i));
        return v(C, {
            usedFallback: !1,
            turnStartedAt: $
        })
    }
    let D = Date.now();
    try {
        let $ = await n.run(S(x, i));
        return v($, {
            usedFallback: !1,
            turnStartedAt: D
        })
    } catch ($) {
        if (isAbortLikeError($) || isAgentSdkTurnInterruptedError($) || isAgentSdkPromptNotAcceptedAbortError($)) throw $;
        if (y && (y.flush(), y = g(), h.onStream = (k, N) => {
                if (N) {
                    p(k, !0);
                    return
                }
                y.push(k)
            }), c === "codex") {
            let N = (await ct(e, t).catch(() => null))?.pending_skip_rewind?.skipped_at;
            if (N) {
                let V = Date.parse(N);
                Number.isFinite(V) && V >= D && await clearSessionRuntimeStateField(e, t, "pending_skip_rewind").catch(() => {})
            }
        }
        let C = R(),
            A = Date.now(),
            F = await n.run(S(C));
        return v(F, {
            usedFallback: !0,
            resumeError: $ instanceof Error ? $.message : String($),
            turnStartedAt: A
        })
    }
}
