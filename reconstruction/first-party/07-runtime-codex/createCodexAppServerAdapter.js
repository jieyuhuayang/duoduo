// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: jb, daemon.pretty.js:58876)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...jXe,
            ...e
        },
        r = null,
        i = !1,
        o = null,
        s = null,
        a = c => (c === _a && s && (s.skipObserved = !0), s?.turnId),
        l = (c, d, p) => {
            c === _a && !d && s && p !== void 0 && p === s.turnId && (s.skipObserved = !1)
        };
    async function u(c, d, p) {
        if ((!r || !r.isAlive) && (r = new FI(n.codexBinary, d, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(l), i = !1, o = null), !i) {
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
                let L = [];
                for await (let B of c.prompt) if (typeof B.message.content == "string") L.push(B.message.content);
                else if (Array.isArray(B.message.content))
                    for (let te of B.message.content) te.type === "text" && L.push(te.text);
                d = L.join(`

`)
            }
            if (!d.trim()) return {
                text: "",
                usage: void 0
            };
            let p = c.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new FI(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(l), i = !1), !i) {
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
                    let L = new Map;
                    for (let B of n.dynamicTools) L.set(B.name, B.handler);
                    r.setToolHandlers(L)
                }
                i = !0
            }
            let f = extractSystemPromptAppend(c.systemPrompt),
                m = buildBaseInstructions(t ?? {}, f),
                h = buildDeveloperInstructions(t ?? {}, n.dynamicTools?.map(L => L.name)),
                y = LXe(c.permissionMode, n.sandbox);
            c.disallowedTools?.length && Ae("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: c.disallowedTools
            });
            let _ = c.persistSession !== void 0 ? !c.persistSession : n.ephemeral,
                k = c.model !== void 0 ? c.model : n.model,
                v = c.effort !== void 0 ? c.effort : n.effort,
                b = () => {
                    let L = {
                        cwd: p,
                        model: k,
                        approvalPolicy: "never",
                        sandbox: y,
                        serviceName: n.serviceName,
                        ephemeral: _,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return m && (L.baseInstructions = m), h && (L.developerInstructions = h), n.dynamicTools?.length && (L.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: n.dynamicTools.map(B => ({
                            type: "function",
                            name: B.name,
                            description: B.description,
                            inputSchema: B.inputSchema
                        }))
                    }], L.config = x2()), L
                },
                I = L => {
                    let B = {
                        cwd: p,
                        model: k,
                        approvalPolicy: "never",
                        sandbox: y,
                        threadId: L
                    };
                    return n.dynamicTools?.length && (B.config = x2()), B
                },
                T = L => {
                    let B = {
                        cwd: p,
                        model: k,
                        approvalPolicy: "never",
                        sandbox: y,
                        threadId: L,
                        persistExtendedHistory: !1
                    };
                    return m && (B.baseInstructions = m), h && (B.developerInstructions = h), n.dynamicTools?.length && (B.config = x2()), B
                },
                S, w;
            c.forkFrom ? (S = "thread/fork", w = T(c.forkFrom)) : c.sessionId ? (S = "thread/resume", w = I(c.sessionId)) : (S = "thread/start", w = b());
            let C;
            try {
                C = await r.request(S, w, c.abortController?.signal)
            } catch (L) {
                let B = L instanceof Error && L.name === "AbortError" || c.abortController?.signal.aborted === !0;
                if (S === "thread/fork" && !B) K("[codex-adapter] thread/fork failed, falling back to thread/start", {
                    cwd: p,
                    forkFrom: c.forkFrom,
                    error: L instanceof Error ? L.message : String(L)
                }), S = "thread/start", w = b(), C = await r.request(S, w, c.abortController?.signal);
                else throw L
            }
            let A = C.thread.id;
            o = A;
            let x = [],
                P = new Map,
                M = {},
                j, H = Date.now(),
                J = !1,
                ee, ie, re = new Promise(L => {
                    ie = L
                }),
                Ye = !1,
                je = L => {
                    if (!ee) return;
                    let B = extractCodexGeneratedImageAttachment(L);
                    if (!B) {
                        !Ye && hasImageGenerationRecord(L) && (Ye = !0, Z("[codex] image-generation record present but no attachment extracted", {
                            threadId: A,
                            turnId: ee,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let te = "path" in B ? `path:${B.path}` : `call:${B.callId}`;
                    P.set(te, B)
                },
                Se = !1,
                lt = new Promise((L, B) => {
                    let te = We => {
                            Se || (Se = !0, Re(), We())
                        },
                        Le = We => {
                            if (Se) return;
                            let Be = We.params ?? {},
                                X = Be.threadId,
                                Q = Be.turnId;
                            if (codexNotificationFilterDecision({
                                    method: We.method,
                                    msgThreadId: X,
                                    msgTurnId: Q,
                                    ownThreadId: A,
                                    ownTurnId: ee
                                }) !== "process") return;
                            let fe = Be.item;
                            switch (je(Be), We.method) {
                                case "item/agentMessage/delta": {
                                    let ve = Be.delta ?? "";
                                    ve && (J || (j = Date.now() - H, J = !0), x.push(ve), c.onStream?.(ve));
                                    break
                                }
                                case "item/started": {
                                    if (!fe) break;
                                    let ve = sme(fe);
                                    ve && c.onExecutionEvent?.(ve);
                                    break
                                }
                                case "item/completed": {
                                    if (!fe) break;
                                    je(fe);
                                    let ve = ame(fe);
                                    ve && c.onExecutionEvent?.(ve);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let ve = Be.delta ?? "";
                                    ve && c.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: ve
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let ve = Be.tokenUsage;
                                    M = computeCodexTurnUsage(M, ve?.total, ve?.last);
                                    break
                                }
                                case "turn/completed": {
                                    X === A && te(() => L());
                                    break
                                }
                                case "error": {
                                    let me = Be.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(me)) {
                                        K("[codex-transport] transient reconnect notice", {
                                            message: me,
                                            threadId: A,
                                            turnId: ee
                                        });
                                        break
                                    }
                                    te(() => B(new Error(me || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        Re = () => {
                            r?.removeListener("notification", Le)
                        };
                    if (r.on("notification", Le), c.abortController) {
                        let We = () => {
                            let Be = new Promise((Q, fe) => setTimeout(() => fe(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([re, Be]).then(Q => {
                                r?.request("turn/interrupt", {
                                    threadId: A,
                                    turnId: Q
                                }).catch(() => {})
                            }).catch(() => {});
                            let X = new Error("turn aborted");
                            X.name = "AbortError", te(() => B(X))
                        };
                        c.abortController.signal.addEventListener("abort", We, {
                            once: !0
                        })
                    }
                });
            try {
                c.onTurnAcknowledged?.()
            } catch {}
            let Fe;
            try {
                Fe = await r.request("turn/start", {
                    threadId: A,
                    input: buildCodexTurnInput(d, c.attachments),
                    model: k,
                    effort: v,
                    outputSchema: c.outputFormat ?? null
                }, c.abortController?.signal)
            } catch (L) {
                if (typeof L.code == "number" && L.name !== "AbortError") try {
                    c.onTurnRejected?.()
                } catch {}
                throw L
            }
            ee = Fe.turn?.id, ee && ie?.(ee), ee && (s = {
                threadId: A,
                turnId: ee,
                abortSignal: c.abortController?.signal,
                startedAt: H
            }), c.abortController?.signal.aborted && ee && r.request("turn/interrupt", {
                threadId: A,
                turnId: ee
            }).catch(() => {});
            try {
                await lt
            } finally {
                s && s.turnId === ee && (s = null)
            }
            let qe = x.join(""),
                F = M.usage ? {
                    ...M.usage,
                    model: k ?? "default"
                } : void 0;
            return {
                sessionId: A,
                text: qe || void 0,
                attachments: P.size > 0 ? Array.from(P.values()) : void 0,
                usage: F,
                firstTokenLatencyMs: j
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
            } catch (_) {
                return f && c.abortController?.signal.removeEventListener("abort", f), c.abortController?.signal.aborted === !0 || _ instanceof Error && _.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: `failed to attach to thread: ${_ instanceof Error?_.message.split(`
`)[0]:String(_)}`,
                    triggered_at: d
                }
            }
            let m, h = _ => {
                    m || (m = _)
                },
                y = new Promise(_ => {
                    let k = b => {
                            let I = b.params ?? {};
                            if (b.method === "thread/compacted") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), _();
                                return
                            }
                            if (b.method === "item/completed" && I.item?.type === "contextCompaction") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), _();
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
                                }), v(), _()
                            }
                        },
                        v = () => {
                            r?.removeListener("notification", k)
                        };
                    r.on("notification", k), p.signal.addEventListener("abort", () => {
                        v(), m || h({
                            kind: "failed",
                            runtime: "codex",
                            error: "aborted",
                            triggered_at: d
                        }), _()
                    }, {
                        once: !0
                    })
                });
            try {
                await r.request("thread/compact/start", {
                    threadId: c.sessionId
                }, p.signal)
            } catch (_) {
                return f && c.abortController?.signal.removeEventListener("abort", f), c.abortController?.signal.aborted === !0 || _ instanceof Error && _.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: _ instanceof Error ? _.message.split(`
`)[0] : String(_),
                    triggered_at: d
                }
            }
            return await y, f && c.abortController?.signal.removeEventListener("abort", f), m ?? {
                kind: "noop",
                runtime: "codex",
                reason: "no compaction notification received before stream end",
                triggered_at: d
            }
        },
        async undo(c) {
            let d = new Date().toISOString();
            if (!Number.isInteger(c.numTurns) || c.numTurns < 1) return {
                kind: "noop",
                runtime: "codex",
                reason: `invalid numTurns: ${c.numTurns}`,
                triggered_at: d
            };
            let p = new AbortController,
                f;
            c.abortController && (f = () => p.abort(), c.abortController.signal.addEventListener("abort", f, {
                once: !0
            }));
            try {
                await u(c.sessionId, c.cwd ?? process.cwd(), p.signal)
            } catch (m) {
                return f && c.abortController?.signal.removeEventListener("abort", f), c.abortController?.signal.aborted === !0 || m instanceof Error && m.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: `failed to attach to thread: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
                    triggered_at: d
                }
            }
            try {
                return await r.request("thread/rollback", {
                    threadId: c.sessionId,
                    numTurns: c.numTurns
                }, p.signal), f && c.abortController?.signal.removeEventListener("abort", f), {
                    kind: "succeeded",
                    runtime: "codex",
                    newSessionId: c.sessionId,
                    sessionIdChanged: !1,
                    droppedTurns: c.numTurns,
                    triggered_at: d
                }
            } catch (m) {
                if (f && c.abortController?.signal.removeEventListener("abort", f), c.abortController?.signal.aborted === !0 || m instanceof Error && m.name === "AbortError") return {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                };
                let y = m instanceof Error ? m.message : String(m),
                    _ = y.toLowerCase();
                return ["no turns", "nothing to roll back", "past system prompt", "rollback past", "history shorter", "out of range"].some(v => _.includes(v)) ? {
                    kind: "noop",
                    runtime: "codex",
                    reason: y.split(`
`)[0],
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: y.split(`
`)[0],
                    triggered_at: d
                }
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
                return K("[codex] turn/steer failed — falling back to new turn", {
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
