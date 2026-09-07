// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: Fb, daemon.pretty.js:56206)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...VXe,
            ...e
        },
        r = null,
        i = !1,
        o = null,
        s = null,
        a = c => (c === Zo && s && (s.skipObserved = !0), s?.turnId),
        l = (c, d, p) => {
            c === Zo && !d && s && p !== void 0 && p === s.turnId && (s.skipObserved = !1)
        };
    async function u(c, d, p) {
        if ((!r || !r.isAlive) && (r = new WI(n.codexBinary, d, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(l), i = !1, o = null), !i) {
            if (await r.request("initialize", {
                    clientInfo: {
                        title: "duoduo-runtime",
                        name: "duoduo",
                        version: "0.1.0"
                    },
                    capabilities: {
                        experimentalApi: !!n.dynamicTools?.length,
                        optOutNotificationMethods: ["item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded", "item/reasoning/textDelta"]
                    }
                }, p), r.notify("initialized", {}), n.dynamicTools?.length) {
                let f = new Map;
                for (let m of n.dynamicTools) f.set(m.name, m.handler);
                r.setToolHandlers(f)
            }
            i = !0
        }
        o !== c && (await r.request("thread/resume", {
            threadId: c
        }, p), o = c)
    }
    return {
        async run(c) {
            let d;
            if (typeof c.prompt == "string") d = c.prompt;
            else {
                let F = [];
                for await (let W of c.prompt) if (typeof W.message.content == "string") F.push(W.message.content);
                else if (Array.isArray(W.message.content))
                    for (let ye of W.message.content) ye.type === "text" && F.push(ye.text);
                d = F.join(`

`)
            }
            if (!d.trim()) return {
                text: "",
                usage: void 0
            };
            let p = c.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new WI(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(l), i = !1), !i) {
                if (await r.request("initialize", {
                        clientInfo: {
                            title: "duoduo-runtime",
                            name: "duoduo",
                            version: "0.1.0"
                        },
                        capabilities: {
                            experimentalApi: !!n.dynamicTools?.length,
                            optOutNotificationMethods: ["item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded", "item/reasoning/textDelta"]
                        }
                    }, c.abortController?.signal), r.notify("initialized", {}), n.dynamicTools?.length) {
                    let F = new Map;
                    for (let W of n.dynamicTools) F.set(W.name, W.handler);
                    r.setToolHandlers(F)
                }
                i = !0
            }
            let f = extractSystemPromptAppend(c.systemPrompt),
                m = buildBaseInstructions(t ?? {}, f),
                h = buildDeveloperInstructions(t ?? {}, n.dynamicTools?.map(F => F.name)),
                g = WXe(c.permissionMode, n.sandbox);
            c.disallowedTools?.length && ke("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: c.disallowedTools
            });
            let y = c.persistSession !== void 0 ? !c.persistSession : n.ephemeral,
                w = c.model !== void 0 ? c.model : n.model,
                v = c.effort !== void 0 ? c.effort : n.effort,
                b = () => {
                    let F = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: g,
                        serviceName: n.serviceName,
                        ephemeral: y,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return m && (F.baseInstructions = m), h && (F.developerInstructions = h), n.dynamicTools?.length && (F.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: n.dynamicTools.map(W => ({
                            type: "function",
                            name: W.name,
                            description: W.description,
                            inputSchema: W.inputSchema
                        }))
                    }], F.config = h2()), F
                },
                R = F => {
                    let W = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: g,
                        threadId: F
                    };
                    return n.dynamicTools?.length && (W.config = h2()), W
                },
                I = F => {
                    let W = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: g,
                        threadId: F,
                        persistExtendedHistory: !1
                    };
                    return m && (W.baseInstructions = m), h && (W.developerInstructions = h), n.dynamicTools?.length && (W.config = h2()), W
                },
                T, x;
            c.forkFrom ? (T = "thread/fork", x = I(c.forkFrom)) : c.sessionId ? (T = "thread/resume", x = R(c.sessionId)) : (T = "thread/start", x = b());
            let S;
            try {
                S = await r.request(T, x, c.abortController?.signal)
            } catch (F) {
                let W = F instanceof Error && F.name === "AbortError" || c.abortController?.signal.aborted === !0;
                if (T === "thread/fork" && !W) Q("[codex-adapter] thread/fork failed, falling back to thread/start", {
                    cwd: p,
                    forkFrom: c.forkFrom,
                    error: F instanceof Error ? F.message : String(F)
                }), T = "thread/start", x = b(), S = await r.request(T, x, c.abortController?.signal);
                else throw F
            }
            let $ = S.thread.id;
            o = $;
            let C = [],
                A = new Set,
                j = new Map,
                P = {},
                z, U = Date.now(),
                K = !1,
                te, V, re = new Promise(F => {
                    V = F
                }),
                X = !1,
                L = F => {
                    if (!te) return;
                    let W = extractCodexGeneratedImageAttachment(F);
                    if (!W) {
                        !X && hasImageGenerationRecord(F) && (X = !0, J("[codex] image-generation record present but no attachment extracted", {
                            threadId: $,
                            turnId: te,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let ye = "path" in W ? `path:${W.path}` : `call:${W.callId}`;
                    j.set(ye, W)
                },
                ie = !1,
                fe = new Promise((F, W) => {
                    let ye = _ => {
                            ie || (ie = !0, Be(), _())
                        },
                        ge = _ => {
                            if (ie) return;
                            let k = _.params ?? {},
                                M = k.threadId,
                                Y = k.turnId;
                            if (codexNotificationFilterDecision({
                                    method: _.method,
                                    msgThreadId: M,
                                    msgTurnId: Y,
                                    ownThreadId: $,
                                    ownTurnId: te
                                }) !== "process") return;
                            let q = k.item;
                            switch (L(k), _.method) {
                                case "item/agentMessage/delta": {
                                    let {
                                        delta: se = "",
                                        itemId: ve
                                    } = k;
                                    se && (K || (z = Date.now() - U, K = !0), (!ve || !A.has(ve)) && C.push(se), c.onStream?.(se));
                                    break
                                }
                                case "item/started": {
                                    if (!q) break;
                                    q.type === "agentMessage" && typeof q.id == "string" && q.phase === "commentary" && A.add(q.id);
                                    let se = ape(q);
                                    se && c.onExecutionEvent?.(se);
                                    break
                                }
                                case "item/completed": {
                                    if (!q) break;
                                    L(q);
                                    let se = lpe(q);
                                    se && c.onExecutionEvent?.(se);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let se = k.delta ?? "";
                                    se && c.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: se
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let se = k.tokenUsage;
                                    P = computeCodexTurnUsage(P, se?.total, se?.last);
                                    break
                                }
                                case "turn/completed": {
                                    M === $ && ye(() => F());
                                    break
                                }
                                case "error": {
                                    let ve = k.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(ve)) {
                                        Q("[codex-transport] transient reconnect notice", {
                                            message: ve,
                                            threadId: $,
                                            turnId: te
                                        });
                                        break
                                    }
                                    ye(() => W(new Error(ve || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        Be = () => {
                            r?.removeListener("notification", ge)
                        };
                    if (r.on("notification", ge), c.abortController) {
                        let _ = () => {
                            let k = new Promise((Y, q) => setTimeout(() => q(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([re, k]).then(Y => {
                                r?.request("turn/interrupt", {
                                    threadId: $,
                                    turnId: Y
                                }).catch(() => {})
                            }).catch(() => {});
                            let M = new Error("turn aborted");
                            M.name = "AbortError", ye(() => W(M))
                        };
                        c.abortController.signal.addEventListener("abort", _, {
                            once: !0
                        })
                    }
                });
            try {
                c.onTurnAcknowledged?.()
            } catch {}
            let _e;
            try {
                _e = await r.request("turn/start", {
                    threadId: $,
                    input: buildCodexTurnInput(d, c.attachments),
                    model: w,
                    effort: v,
                    outputSchema: c.outputFormat ?? null
                }, c.abortController?.signal)
            } catch (F) {
                if (typeof F.code == "number" && F.name !== "AbortError") try {
                    c.onTurnRejected?.()
                } catch {}
                throw F
            }
            te = _e.turn?.id, te && V?.(te), te && (s = {
                threadId: $,
                turnId: te,
                abortSignal: c.abortController?.signal,
                startedAt: U
            }), c.abortController?.signal.aborted && te && r.request("turn/interrupt", {
                threadId: $,
                turnId: te
            }).catch(() => {});
            try {
                await fe
            } finally {
                s && s.turnId === te && (s = null)
            }
            let D = C.join(""),
                B = P.usage ? {
                    ...P.usage,
                    model: w ?? "default"
                } : void 0;
            return {
                sessionId: $,
                text: D || void 0,
                attachments: j.size > 0 ? Array.from(j.values()) : void 0,
                usage: B,
                firstTokenLatencyMs: z
            }
        },
        async compact(c) {
            let d = new Date().toISOString(),
                p = new AbortController,
                f;
            c.abortController && (f = () => p.abort(), c.abortController.signal.addEventListener("abort", f, {
                once: !0
            }));
            try {
                await u(c.sessionId, c.cwd ?? process.cwd(), p.signal)
            } catch (y) {
                return f && c.abortController?.signal.removeEventListener("abort", f), c.abortController?.signal.aborted === !0 || y instanceof Error && y.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: `failed to attach to thread: ${y instanceof Error?y.message.split(`
`)[0]:String(y)}`,
                    triggered_at: d
                }
            }
            let m, h = y => {
                    m || (m = y)
                },
                g = new Promise(y => {
                    let w = b => {
                            let R = b.params ?? {};
                            if (b.method === "thread/compacted") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), y();
                                return
                            }
                            if (b.method === "item/completed" && R.item?.type === "contextCompaction") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), y();
                                return
                            }
                            if (b.method === "error") {
                                let I = (R.error?.message ?? "") || "unknown error";
                                if (/^(Reconnecting|Connecting)\b/.test(I)) return;
                                h({
                                    kind: "failed",
                                    runtime: "codex",
                                    error: I,
                                    triggered_at: d
                                }), v(), y()
                            }
                        },
                        v = () => {
                            r?.removeListener("notification", w)
                        };
                    r.on("notification", w), p.signal.addEventListener("abort", () => {
                        v(), m || h({
                            kind: "failed",
                            runtime: "codex",
                            error: "aborted",
                            triggered_at: d
                        }), y()
                    }, {
                        once: !0
                    })
                });
            try {
                await r.request("thread/compact/start", {
                    threadId: c.sessionId
                }, p.signal)
            } catch (y) {
                return f && c.abortController?.signal.removeEventListener("abort", f), c.abortController?.signal.aborted === !0 || y instanceof Error && y.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: y instanceof Error ? y.message.split(`
`)[0] : String(y),
                    triggered_at: d
                }
            }
            return await g, f && c.abortController?.signal.removeEventListener("abort", f), m ?? {
                kind: "noop",
                runtime: "codex",
                reason: "no compaction notification received before stream end",
                triggered_at: d
            }
        },
        activeTurnId() {
            return s?.turnId
        },
        activeTurnStartedAt() {
            return s?.startedAt
        },
        activeTurnSkipObserved() {
            return s?.skipObserved === !0
        },
        async steerActiveTurn(c, d, p) {
            let f = s;
            if (!r || !r.isAlive || !f || f.turnId !== d) return !1;
            try {
                return await r.request("turn/steer", {
                    threadId: f.threadId,
                    expectedTurnId: d,
                    input: buildCodexTurnInput(c, p)
                }, f.abortSignal), !0
            } catch (m) {
                return Q("[codex] turn/steer failed — falling back to new turn", {
                    threadId: f.threadId,
                    expectedTurnId: d,
                    error: m instanceof Error ? m.message : String(m)
                }), !1
            }
        },
        async shutdown() {
            await r?.shutdown(), r = null, i = !1
        }
    }
}
