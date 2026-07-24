// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: V_, daemon.pretty.js:57389)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...VKe,
            ...e
        },
        r = null,
        i = !1,
        s = null,
        o = null,
        a = l => (l === Xu && o && (o.skipObserved = !0), o?.turnId),
        u = (l, d, p) => {
            l === Xu && !d && o && p !== void 0 && p === o.turnId && (o.skipObserved = !1)
        };
    async function c(l, d, p) {
        if ((!r || !r.isAlive) && (r = new bR(n.codexBinary, d, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(u), i = !1, s = null), !i) {
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
        s !== l && (await r.request("thread/resume", {
            threadId: l
        }, p), s = l)
    }
    return {
        async run(l) {
            let d;
            if (typeof l.prompt == "string") d = l.prompt;
            else {
                let H = [];
                for await (let U of l.prompt) if (typeof U.message.content == "string") H.push(U.message.content);
                else if (Array.isArray(U.message.content))
                    for (let Ce of U.message.content) Ce.type === "text" && H.push(Ce.text);
                d = H.join(`

`)
            }
            if (!d.trim()) return {
                text: "",
                usage: void 0
            };
            let p = l.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new bR(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(u), i = !1), !i) {
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
                    }, l.abortController?.signal), r.notify("initialized", {}), n.dynamicTools?.length) {
                    let H = new Map;
                    for (let U of n.dynamicTools) H.set(U.name, U.handler);
                    r.setToolHandlers(H)
                }
                i = !0
            }
            let f = extractSystemPromptAppend(l.systemPrompt),
                m = buildBaseInstructions(t ?? {}, f),
                h = buildDeveloperInstructions(t ?? {}),
                _ = ZKe(l.permissionMode, n.sandbox);
            l.disallowedTools?.length && Pe("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: l.disallowedTools
            });
            let b = l.persistSession !== void 0 ? !l.persistSession : n.ephemeral,
                v = l.model !== void 0 ? l.model : n.model,
                w = l.effort !== void 0 ? l.effort : n.effort,
                g = () => {
                    let H = {
                        cwd: p,
                        model: v,
                        approvalPolicy: "never",
                        sandbox: _,
                        serviceName: n.serviceName,
                        ephemeral: b,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return m && (H.baseInstructions = m), h && (H.developerInstructions = h), n.dynamicTools?.length && (H.dynamicTools = n.dynamicTools.map(U => ({
                        name: U.name,
                        description: U.description,
                        inputSchema: U.inputSchema
                    }))), H
                },
                x = H => ({
                    cwd: p,
                    model: v,
                    approvalPolicy: "never",
                    sandbox: _,
                    threadId: H
                }),
                k = H => {
                    let U = {
                        cwd: p,
                        model: v,
                        approvalPolicy: "never",
                        sandbox: _,
                        threadId: H,
                        persistExtendedHistory: !1
                    };
                    return m && (U.baseInstructions = m), h && (U.developerInstructions = h), U
                },
                E, R;
            l.forkFrom ? (E = "thread/fork", R = k(l.forkFrom)) : l.sessionId ? (E = "thread/resume", R = x(l.sessionId)) : (E = "thread/start", R = g());
            let $;
            try {
                $ = await r.request(E, R, l.abortController?.signal)
            } catch (H) {
                let U = H instanceof Error && H.name === "AbortError" || l.abortController?.signal.aborted === !0;
                if (E === "thread/fork" && !U) J("[codex-adapter] thread/fork failed, falling back to thread/start", {
                    cwd: p,
                    forkFrom: l.forkFrom,
                    error: H instanceof Error ? H.message : String(H)
                }), E = "thread/start", R = g(), $ = await r.request(E, R, l.abortController?.signal);
                else throw H
            }
            let P = $.thread.id;
            s = P;
            let C = [],
                L = new Map,
                G = {},
                K, Q = Date.now(),
                W = !1,
                ae, Oe, X = new Promise(H => {
                    Oe = H
                }),
                Ue = !1,
                Nt = H => {
                    if (!ae) return;
                    let U = extractCodexGeneratedImageAttachment(H);
                    if (!U) {
                        !Ue && hasImageGenerationRecord(H) && (Ue = !0, ie("[codex] image-generation record present but no attachment extracted", {
                            threadId: P,
                            turnId: ae,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let Ce = "path" in U ? `path:${U.path}` : `call:${U.callId}`;
                    L.set(Ce, U)
                },
                Se = !1,
                st = new Promise((H, U) => {
                    let Ce = _t => {
                            Se || (Se = !0, Ke(), _t())
                        },
                        Ae = _t => {
                            if (Se) return;
                            let en = _t.params ?? {},
                                En = en.threadId,
                                Je = en.turnId;
                            if (codexNotificationFilterDecision({
                                    method: _t.method,
                                    msgThreadId: En,
                                    msgTurnId: Je,
                                    ownThreadId: P,
                                    ownTurnId: ae
                                }) !== "process") return;
                            let Xn = en.item;
                            switch (Nt(en), _t.method) {
                                case "item/agentMessage/delta": {
                                    let y = en.delta ?? "";
                                    y && (W || (K = Date.now() - Q, W = !0), C.push(y), l.onStream?.(y));
                                    break
                                }
                                case "item/started": {
                                    if (!Xn) break;
                                    let y = Fle(Xn);
                                    y && l.onExecutionEvent?.(y);
                                    break
                                }
                                case "item/completed": {
                                    if (!Xn) break;
                                    Nt(Xn);
                                    let y = Ule(Xn);
                                    y && l.onExecutionEvent?.(y);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let y = en.delta ?? "";
                                    y && l.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: y
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let y = en.tokenUsage;
                                    G = computeCodexTurnUsage(G, y?.total, y?.last);
                                    break
                                }
                                case "turn/completed": {
                                    En === P && Ce(() => H());
                                    break
                                }
                                case "error": {
                                    let T = en.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(T)) {
                                        J("[codex-transport] transient reconnect notice", {
                                            message: T,
                                            threadId: P,
                                            turnId: ae
                                        });
                                        break
                                    }
                                    Ce(() => U(new Error(T || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        Ke = () => {
                            r?.removeListener("notification", Ae)
                        };
                    if (r.on("notification", Ae), l.abortController) {
                        let _t = () => {
                            let en = new Promise((Je, Xn) => setTimeout(() => Xn(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([X, en]).then(Je => {
                                r?.request("turn/interrupt", {
                                    threadId: P,
                                    turnId: Je
                                }).catch(() => {})
                            }).catch(() => {});
                            let En = new Error("turn aborted");
                            En.name = "AbortError", Ce(() => U(En))
                        };
                        l.abortController.signal.addEventListener("abort", _t, {
                            once: !0
                        })
                    }
                });
            try {
                l.onTurnAcknowledged?.()
            } catch {}
            let ze;
            try {
                ze = await r.request("turn/start", {
                    threadId: P,
                    input: [{
                        type: "text",
                        text: d,
                        text_elements: []
                    }],
                    model: v,
                    effort: w,
                    outputSchema: l.outputFormat ?? null
                }, l.abortController?.signal)
            } catch (H) {
                if (typeof H.code == "number" && H.name !== "AbortError") try {
                    l.onTurnRejected?.()
                } catch {}
                throw H
            }
            ae = ze.turn?.id, ae && Oe?.(ae), ae && (o = {
                threadId: P,
                turnId: ae,
                abortSignal: l.abortController?.signal,
                startedAt: Q
            }), l.abortController?.signal.aborted && ae && r.request("turn/interrupt", {
                threadId: P,
                turnId: ae
            }).catch(() => {});
            try {
                await st
            } finally {
                o && o.turnId === ae && (o = null)
            }
            let A = C.join(""),
                z = G.usage ? {
                    ...G.usage,
                    model: v ?? "default"
                } : void 0;
            return {
                sessionId: P,
                text: A || void 0,
                attachments: L.size > 0 ? Array.from(L.values()) : void 0,
                usage: z,
                firstTokenLatencyMs: K
            }
        },
        async compact(l) {
            let d = new Date().toISOString(),
                p = new AbortController,
                f;
            l.abortController && (f = () => p.abort(), l.abortController.signal.addEventListener("abort", f, {
                once: !0
            }));
            try {
                await c(l.sessionId, l.cwd ?? process.cwd(), p.signal)
            } catch (b) {
                return f && l.abortController?.signal.removeEventListener("abort", f), l.abortController?.signal.aborted === !0 || b instanceof Error && b.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: `failed to attach to thread: ${b instanceof Error?b.message.split(`
`)[0]:String(b)}`,
                    triggered_at: d
                }
            }
            let m, h = b => {
                    m || (m = b)
                },
                _ = new Promise(b => {
                    let v = g => {
                            let x = g.params ?? {};
                            if (g.method === "thread/compacted") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), w(), b();
                                return
                            }
                            if (g.method === "item/completed" && x.item?.type === "contextCompaction") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), w(), b();
                                return
                            }
                            if (g.method === "error") {
                                let k = (x.error?.message ?? "") || "unknown error";
                                if (/^(Reconnecting|Connecting)\b/.test(k)) return;
                                h({
                                    kind: "failed",
                                    runtime: "codex",
                                    error: k,
                                    triggered_at: d
                                }), w(), b()
                            }
                        },
                        w = () => {
                            r?.removeListener("notification", v)
                        };
                    r.on("notification", v), p.signal.addEventListener("abort", () => {
                        w(), m || h({
                            kind: "failed",
                            runtime: "codex",
                            error: "aborted",
                            triggered_at: d
                        }), b()
                    }, {
                        once: !0
                    })
                });
            try {
                await r.request("thread/compact/start", {
                    threadId: l.sessionId
                }, p.signal)
            } catch (b) {
                return f && l.abortController?.signal.removeEventListener("abort", f), l.abortController?.signal.aborted === !0 || b instanceof Error && b.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: b instanceof Error ? b.message.split(`
`)[0] : String(b),
                    triggered_at: d
                }
            }
            return await _, f && l.abortController?.signal.removeEventListener("abort", f), m ?? {
                kind: "noop",
                runtime: "codex",
                reason: "no compaction notification received before stream end",
                triggered_at: d
            }
        },
        async undo(l) {
            let d = new Date().toISOString();
            if (!Number.isInteger(l.numTurns) || l.numTurns < 1) return {
                kind: "noop",
                runtime: "codex",
                reason: `invalid numTurns: ${l.numTurns}`,
                triggered_at: d
            };
            let p = new AbortController,
                f;
            l.abortController && (f = () => p.abort(), l.abortController.signal.addEventListener("abort", f, {
                once: !0
            }));
            try {
                await c(l.sessionId, l.cwd ?? process.cwd(), p.signal)
            } catch (m) {
                return f && l.abortController?.signal.removeEventListener("abort", f), l.abortController?.signal.aborted === !0 || m instanceof Error && m.name === "AbortError" ? {
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
                    threadId: l.sessionId,
                    numTurns: l.numTurns
                }, p.signal), f && l.abortController?.signal.removeEventListener("abort", f), {
                    kind: "succeeded",
                    runtime: "codex",
                    newSessionId: l.sessionId,
                    sessionIdChanged: !1,
                    droppedTurns: l.numTurns,
                    triggered_at: d
                }
            } catch (m) {
                if (f && l.abortController?.signal.removeEventListener("abort", f), l.abortController?.signal.aborted === !0 || m instanceof Error && m.name === "AbortError") return {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: d
                };
                let _ = m instanceof Error ? m.message : String(m),
                    b = _.toLowerCase();
                return ["no turns", "nothing to roll back", "past system prompt", "rollback past", "history shorter", "out of range"].some(w => b.includes(w)) ? {
                    kind: "noop",
                    runtime: "codex",
                    reason: _.split(`
`)[0],
                    triggered_at: d
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: _.split(`
`)[0],
                    triggered_at: d
                }
            }
        },
        activeTurnId() {
            return o?.turnId
        },
        activeTurnStartedAt() {
            return o?.startedAt
        },
        activeTurnSkipObserved() {
            return o?.skipObserved === !0
        },
        async steerActiveTurn(l, d) {
            let p = o;
            if (!r || !r.isAlive || !p || p.turnId !== d) return !1;
            try {
                return await r.request("turn/steer", {
                    threadId: p.threadId,
                    expectedTurnId: d,
                    input: [{
                        type: "text",
                        text: l,
                        text_elements: []
                    }]
                }, p.abortSignal), !0
            } catch (f) {
                return J("[codex] turn/steer failed — falling back to new turn", {
                    threadId: p.threadId,
                    expectedTurnId: d,
                    error: f instanceof Error ? f.message : String(f)
                }), !1
            }
        },
        async shutdown() {
            await r?.shutdown(), r = null, i = !1
        }
    }
}
