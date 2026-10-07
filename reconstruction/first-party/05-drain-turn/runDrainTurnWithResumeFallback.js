// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runDrainTurnWithResumeFallback  (minified: vht, daemon.pretty.js:72785)
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
    isClaudeRuntimeOrDefault(c) && !d && vt("info", "[claude-context-profile] non-streaming subprocess spawned", {
        sessionKey: t,
        model: f.model ?? "default",
        context_profile_source: aA(f.claudeContextRequirement),
        max_context_token: np({
            requirement: f.claudeContextRequirement,
            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
            liveGenerationToken: void 0
        }),
        ...uA(f.claudeContextRequirement),
        alias_tiers: lA(f.claudeModelAliases)
    });
    let p = f.onStream,
        m = f.onExecutionEvent,
        h = {
            ...f
        },
        g = () => new mA(A => p?.(A), A => m?.({
            type: "thought_chunk",
            text: A
        })),
        y;
    p && (y = g(), h.onStream = (A, $) => {
        if ($) {
            p(A, !0);
            return
        }
        y.push(A)
    }, h.onExecutionEvent = A => {
        A.type === "tool_result" && y.reset(), m?.(A)
    });
    let v = (A, $) => {
            y?.flush();
            let C = A.text;
            if (C) {
                let N = dxe(C);
                if (C = N.text, !p && N.thoughts.length > 0 && m)
                    for (let x of N.thoughts) m({
                        type: "thought_chunk",
                        text: x
                    })
            }
            return {
                ...A,
                text: C,
                ...$
            }
        },
        b = {
            runtimeDir: e.runtimeDir
        },
        _ = !isClaudeRuntimeOrDefault(c),
        E = _ ? void 0 : l,
        R = _ ? l : void 0,
        P = () => c === "pi" ? yht(s) : eventToMessageGenerator(s, E, b),
        k = P(),
        S = (A, $, C) => {
            let N = u ? u() : a,
                x = {
                    prompt: A,
                    sessionId: $,
                    forkFrom: C,
                    ...R ? {
                        attachments: R
                    } : {},
                    ...h
                };
            return N === void 0 ? x : {
                ...x,
                mcpServers: N
            }
        };
    if (o) {
        let A = Date.now(),
            $ = await n.run(S(k, void 0, o));
        return v($, {
            usedFallback: !1,
            turnStartedAt: A
        })
    }
    if (!i) {
        let A = Date.now(),
            $ = await n.run(S(k, i));
        return v($, {
            usedFallback: !1,
            turnStartedAt: A
        })
    }
    let D = Date.now();
    try {
        let A = await n.run(S(k, i));
        return v(A, {
            usedFallback: !1,
            turnStartedAt: D
        })
    } catch (A) {
        if (isAbortLikeError(A) || isAgentSdkTurnInterruptedError(A) || isAgentSdkPromptNotAcceptedAbortError(A)) throw A;
        if (y && (y.flush(), y = g(), h.onStream = (x, M) => {
                if (M) {
                    p(x, !0);
                    return
                }
                y.push(x)
            }), c === "codex") {
            let M = (await rt(e, t).catch(() => null))?.pending_skip_rewind?.skipped_at;
            if (M) {
                let F = Date.parse(M);
                Number.isFinite(F) && F >= D && await clearSessionRuntimeStateField(e, t, "pending_skip_rewind").catch(() => {})
            }
        }
        let $ = P(),
            C = Date.now(),
            N = await n.run(S($));
        return v(N, {
            usedFallback: !0,
            resumeError: A instanceof Error ? A.message : String(A),
            turnStartedAt: C
        })
    }
}
