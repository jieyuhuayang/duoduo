// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: ev, daemon.pretty.js:56730)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...wet,
            ...e
        },
        r = null,
        i = !1,
        o = null,
        s = null,
        a = c => (c === rs && s && (s.skipObserved = !0), s?.turnId),
        l = (c, d, p) => {
            c === rs && !d && s && p !== void 0 && p === s.turnId && (s.skipObserved = !1)
        };
    async function u(c, d, p) {
        if ((!r || !r.isAlive) && (r = new uP(n.codexBinary, d, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(l), i = !1, o = null), !i) {
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
                let ne = [];
                for await (let Q of c.prompt) if (typeof Q.message.content == "string") ne.push(Q.message.content);
                else if (Array.isArray(Q.message.content))
                    for (let Ae of Q.message.content) Ae.type === "text" && ne.push(Ae.text);
                d = ne.join(`

`)
            }
            if (!d.trim()) return {
                text: "",
                usage: void 0
            };
            let p = c.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new uP(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(l), i = !1), !i) {
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
                    let ne = new Map;
                    for (let Q of n.dynamicTools) ne.set(Q.name, Q.handler);
                    r.setToolHandlers(ne)
                }
                i = !0
            }
            let f = extractSystemPromptAppend(c.systemPrompt),
                m = buildBaseInstructions(t ?? {}, f),
                h = buildDeveloperInstructions(t ?? {}, n.dynamicTools?.map(ne => ne.name)),
                g = ket(c.permissionMode, n.sandbox);
            c.disallowedTools?.length && ke("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: c.disallowedTools
            });
            let y = c.persistSession !== void 0 ? !c.persistSession : n.ephemeral,
                w = c.model !== void 0 ? c.model : n.model,
                v = c.effort !== void 0 ? c.effort : n.effort,
                b = () => {
                    let ne = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: g,
                        serviceName: n.serviceName,
                        ephemeral: y,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return m && (ne.baseInstructions = m), h && (ne.developerInstructions = h), n.dynamicTools?.length && (ne.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: n.dynamicTools.map(Q => ({
                            type: "function",
                            name: Q.name,
                            description: Q.description,
                            inputSchema: Q.inputSchema
                        }))
                    }], ne.config = W2()), ne
                },
                I = ne => {
                    let Q = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: g,
                        threadId: ne
                    };
                    return n.dynamicTools?.length && (Q.config = W2()), Q
                },
                T = ne => {
                    let Q = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: g,
                        threadId: ne,
                        persistExtendedHistory: !1
                    };
                    return m && (Q.baseInstructions = m), h && (Q.developerInstructions = h), n.dynamicTools?.length && (Q.config = W2()), Q
                },
                P, k;
            c.forkFrom ? (P = "thread/fork", k = T(c.forkFrom)) : c.sessionId ? (P = "thread/resume", k = I(c.sessionId)) : (P = "thread/start", k = b());
            let S = async () => {
                try {
                    return await r.request(P, k, c.abortController?.signal)
                } catch (ne) {
                    let Q = ne instanceof Error && ne.name === "AbortError" || c.abortController?.signal.aborted === !0;
                    if (P === "thread/fork" && !Q) return ee("[codex-adapter] thread/fork failed, falling back to thread/start", {
                        cwd: p,
                        forkFrom: k.threadId,
                        error: ne instanceof Error ? ne.message : String(ne)
                    }), P = "thread/start", k = b(), await r.request(P, k, c.abortController?.signal);
                    throw ne
                }
            }, D = await S();
            if (P === "thread/resume" && w !== void 0 && w !== null) {
                let ne = D.model,
                    Q = D.thread.id;
                ne !== w && (ee("[codex-adapter] resumed thread runs a different model; forking", {
                    cwd: p,
                    resumedThreadId: Q,
                    resumedModel: ne,
                    wantedModel: w
                }), P = "thread/fork", k = T(Q), D = await S())
            }
            let $ = D.model,
                O = D.thread.id;
            o = O;
            let j = [],
                x = new Set,
                F = new Map,
                q = {},
                J, le = Date.now(),
                oe = !1,
                X, te, z = new Promise(ne => {
                    te = ne
                }),
                V = !1,
                pe = ne => {
                    if (!X) return;
                    let Q = extractCodexGeneratedImageAttachment(ne);
                    if (!Q) {
                        !V && hasImageGenerationRecord(ne) && (V = !0, W("[codex] image-generation record present but no attachment extracted", {
                            threadId: O,
                            turnId: X,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let Ae = "path" in Q ? `path:${Q.path}` : `call:${Q.callId}`;
                    F.set(Ae, Q)
                },
                ae = !1,
                L = new Promise((ne, Q) => {
                    let Ae = N => {
                            ae || (ae = !0, E(), N())
                        },
                        _ = N => {
                            if (ae) return;
                            let K = N.params ?? {},
                                B = K.threadId,
                                se = K.turnId;
                            if (codexNotificationFilterDecision({
                                    method: N.method,
                                    msgThreadId: B,
                                    msgTurnId: se,
                                    ownThreadId: O,
                                    ownTurnId: X
                                }) !== "process") return;
                            let me = K.item;
                            switch (pe(K), N.method) {
                                case "item/agentMessage/delta": {
                                    let {
                                        delta: be = "",
                                        itemId: De
                                    } = K;
                                    be && (oe || (J = Date.now() - le, oe = !0), (!De || !x.has(De)) && j.push(be), c.onStream?.(be));
                                    break
                                }
                                case "item/started": {
                                    if (!me) break;
                                    me.type === "agentMessage" && typeof me.id == "string" && me.phase === "commentary" && x.add(me.id);
                                    let be = Xpe(me);
                                    be && c.onExecutionEvent?.(be);
                                    break
                                }
                                case "item/completed": {
                                    if (!me) break;
                                    pe(me);
                                    let be = Qpe(me);
                                    be && c.onExecutionEvent?.(be);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let be = K.delta ?? "";
                                    be && c.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: be
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let be = K.tokenUsage;
                                    q = computeCodexTurnUsage(q, be?.total, be?.last);
                                    break
                                }
                                case "turn/completed": {
                                    B === O && Ae(() => ne());
                                    break
                                }
                                case "error": {
                                    let De = K.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(De)) {
                                        ee("[codex-transport] transient reconnect notice", {
                                            message: De,
                                            threadId: O,
                                            turnId: X
                                        });
                                        break
                                    }
                                    Ae(() => Q(new Error(De || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        E = () => {
                            r?.removeListener("notification", _)
                        };
                    if (r.on("notification", _), c.abortController) {
                        let N = () => {
                            let K = new Promise((se, me) => setTimeout(() => me(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([z, K]).then(se => {
                                r?.request("turn/interrupt", {
                                    threadId: O,
                                    turnId: se
                                }).catch(() => {})
                            }).catch(() => {});
                            let B = new Error("turn aborted");
                            B.name = "AbortError", Ae(() => Q(B))
                        };
                        c.abortController.signal.addEventListener("abort", N, {
                            once: !0
                        })
                    }
                });
            try {
                c.onTurnAcknowledged?.()
            } catch {}
            let M;
            try {
                M = await r.request("turn/start", {
                    threadId: O,
                    input: buildCodexTurnInput(d, c.attachments),
                    model: w,
                    effort: v,
                    outputSchema: c.outputFormat ?? null
                }, c.abortController?.signal)
            } catch (ne) {
                if (typeof ne.code == "number" && ne.name !== "AbortError") try {
                    c.onTurnRejected?.()
                } catch {}
                throw ne
            }
            X = M.turn?.id, X && te?.(X), X && (s = {
                threadId: O,
                turnId: X,
                abortSignal: c.abortController?.signal,
                startedAt: le
            }), c.abortController?.signal.aborted && X && r.request("turn/interrupt", {
                threadId: O,
                turnId: X
            }).catch(() => {});
            try {
                await L
            } finally {
                s && s.turnId === X && (s = null)
            }
            let U = j.join(""),
                G = q.usage ? {
                    ...q.usage,
                    model: $
                } : void 0;
            return {
                sessionId: O,
                text: U || void 0,
                attachments: F.size > 0 ? Array.from(F.values()) : void 0,
                usage: G,
                firstTokenLatencyMs: J
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
                            let I = b.params ?? {};
                            if (b.method === "thread/compacted") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), y();
                                return
                            }
                            if (b.method === "item/completed" && I.item?.type === "contextCompaction") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), y();
                                return
                            }
                            if (b.method === "error") {
                                let T = (I.error?.message ?? "") || "unknown error";
                                if (/^(Reconnecting|Connecting)\b/.test(T)) return;
                                h({
                                    kind: "failed",
                                    runtime: "codex",
                                    error: T,
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
                return ee("[codex] turn/steer failed — falling back to new turn", {
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
