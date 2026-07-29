// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: V_, daemon.pretty.js:57511)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...s5e,
            ...e
        },
        r = null,
        i = !1,
        s = null,
        o = null,
        a = l => (l === Xc && o && (o.skipObserved = !0), o?.turnId),
        c = (l, d, p) => {
            l === Xc && !d && o && p !== void 0 && p === o.turnId && (o.skipObserved = !1)
        };
    async function u(l, d, p) {
        if ((!r || !r.isAlive) && (r = new vR(n.codexBinary, d, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(c), i = !1, s = null), !i) {
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
                let M = [];
                for await (let F of l.prompt) if (typeof F.message.content == "string") M.push(F.message.content);
                else if (Array.isArray(F.message.content))
                    for (let xe of F.message.content) xe.type === "text" && M.push(xe.text);
                d = M.join(`

`)
            }
            if (!d.trim()) return {
                text: "",
                usage: void 0
            };
            let p = l.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new vR(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(a), r.setToolCallSettled(c), i = !1), !i) {
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
                    let M = new Map;
                    for (let F of n.dynamicTools) M.set(F.name, F.handler);
                    r.setToolHandlers(M)
                }
                i = !0
            }
            let f = extractSystemPromptAppend(l.systemPrompt),
                m = buildBaseInstructions(t ?? {}, f),
                h = buildDeveloperInstructions(t ?? {}),
                _ = o5e(l.permissionMode, n.sandbox);
            l.disallowedTools?.length && Pe("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: l.disallowedTools
            });
            let b = l.persistSession !== void 0 ? !l.persistSession : n.ephemeral,
                w = l.model !== void 0 ? l.model : n.model,
                v = l.effort !== void 0 ? l.effort : n.effort,
                g = () => {
                    let M = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: _,
                        serviceName: n.serviceName,
                        ephemeral: b,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return m && (M.baseInstructions = m), h && (M.developerInstructions = h), n.dynamicTools?.length && (M.dynamicTools = n.dynamicTools.map(F => ({
                        name: F.name,
                        description: F.description,
                        inputSchema: F.inputSchema
                    }))), M
                },
                x = M => ({
                    cwd: p,
                    model: w,
                    approvalPolicy: "never",
                    sandbox: _,
                    threadId: M
                }),
                k = M => {
                    let F = {
                        cwd: p,
                        model: w,
                        approvalPolicy: "never",
                        sandbox: _,
                        threadId: M,
                        persistExtendedHistory: !1
                    };
                    return m && (F.baseInstructions = m), h && (F.developerInstructions = h), F
                },
                E, R;
            l.forkFrom ? (E = "thread/fork", R = k(l.forkFrom)) : l.sessionId ? (E = "thread/resume", R = x(l.sessionId)) : (E = "thread/start", R = g());
            let $;
            try {
                $ = await r.request(E, R, l.abortController?.signal)
            } catch (M) {
                let F = M instanceof Error && M.name === "AbortError" || l.abortController?.signal.aborted === !0;
                if (E === "thread/fork" && !F) K("[codex-adapter] thread/fork failed, falling back to thread/start", {
                    cwd: p,
                    forkFrom: l.forkFrom,
                    error: M instanceof Error ? M.message : String(M)
                }), E = "thread/start", R = g(), $ = await r.request(E, R, l.abortController?.signal);
                else throw M
            }
            let P = $.thread.id;
            s = P;
            let C = [],
                j = new Map,
                X = {},
                W, Y = Date.now(),
                G = !1,
                ae, Ce, ue = new Promise(M => {
                    Ce = M
                }),
                Ne = !1,
                ot = M => {
                    if (!ae) return;
                    let F = extractCodexGeneratedImageAttachment(M);
                    if (!F) {
                        !Ne && hasImageGenerationRecord(M) && (Ne = !0, se("[codex] image-generation record present but no attachment extracted", {
                            threadId: P,
                            turnId: ae,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let xe = "path" in F ? `path:${F.path}` : `call:${F.callId}`;
                    j.set(xe, F)
                },
                Se = !1,
                Xe = new Promise((M, F) => {
                    let xe = et => {
                            Se || (Se = !0, ze(), et())
                        },
                        Oe = et => {
                            if (Se) return;
                            let yt = et.params ?? {},
                                Tn = yt.threadId,
                                Ze = yt.turnId;
                            if (codexNotificationFilterDecision({
                                    method: et.method,
                                    msgThreadId: Tn,
                                    msgTurnId: Ze,
                                    ownThreadId: P,
                                    ownTurnId: ae
                                }) !== "process") return;
                            let Qn = yt.item;
                            switch (ot(yt), et.method) {
                                case "item/agentMessage/delta": {
                                    let y = yt.delta ?? "";
                                    y && (G || (W = Date.now() - Y, G = !0), C.push(y), l.onStream?.(y));
                                    break
                                }
                                case "item/started": {
                                    if (!Qn) break;
                                    let y = Kle(Qn);
                                    y && l.onExecutionEvent?.(y);
                                    break
                                }
                                case "item/completed": {
                                    if (!Qn) break;
                                    ot(Qn);
                                    let y = Yle(Qn);
                                    y && l.onExecutionEvent?.(y);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let y = yt.delta ?? "";
                                    y && l.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: y
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let y = yt.tokenUsage;
                                    X = computeCodexTurnUsage(X, y?.total, y?.last);
                                    break
                                }
                                case "turn/completed": {
                                    Tn === P && xe(() => M());
                                    break
                                }
                                case "error": {
                                    let T = yt.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(T)) {
                                        K("[codex-transport] transient reconnect notice", {
                                            message: T,
                                            threadId: P,
                                            turnId: ae
                                        });
                                        break
                                    }
                                    xe(() => F(new Error(T || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        ze = () => {
                            r?.removeListener("notification", Oe)
                        };
                    if (r.on("notification", Oe), l.abortController) {
                        let et = () => {
                            let yt = new Promise((Ze, Qn) => setTimeout(() => Qn(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([ue, yt]).then(Ze => {
                                r?.request("turn/interrupt", {
                                    threadId: P,
                                    turnId: Ze
                                }).catch(() => {})
                            }).catch(() => {});
                            let Tn = new Error("turn aborted");
                            Tn.name = "AbortError", xe(() => F(Tn))
                        };
                        l.abortController.signal.addEventListener("abort", et, {
                            once: !0
                        })
                    }
                });
            try {
                l.onTurnAcknowledged?.()
            } catch {}
            let Sn;
            try {
                Sn = await r.request("turn/start", {
                    threadId: P,
                    input: [{
                        type: "text",
                        text: d,
                        text_elements: []
                    }],
                    model: w,
                    effort: v,
                    outputSchema: l.outputFormat ?? null
                }, l.abortController?.signal)
            } catch (M) {
                if (typeof M.code == "number" && M.name !== "AbortError") try {
                    l.onTurnRejected?.()
                } catch {}
                throw M
            }
            ae = Sn.turn?.id, ae && Ce?.(ae), ae && (o = {
                threadId: P,
                turnId: ae,
                abortSignal: l.abortController?.signal,
                startedAt: Y
            }), l.abortController?.signal.aborted && ae && r.request("turn/interrupt", {
                threadId: P,
                turnId: ae
            }).catch(() => {});
            try {
                await Xe
            } finally {
                o && o.turnId === ae && (o = null)
            }
            let U = C.join(""),
                L = X.usage ? {
                    ...X.usage,
                    model: w ?? "default"
                } : void 0;
            return {
                sessionId: P,
                text: U || void 0,
                attachments: j.size > 0 ? Array.from(j.values()) : void 0,
                usage: L,
                firstTokenLatencyMs: W
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
                await u(l.sessionId, l.cwd ?? process.cwd(), p.signal)
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
                    let w = g => {
                            let x = g.params ?? {};
                            if (g.method === "thread/compacted") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), b();
                                return
                            }
                            if (g.method === "item/completed" && x.item?.type === "contextCompaction") {
                                h({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: d
                                }), v(), b();
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
                                }), v(), b()
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
                await u(l.sessionId, l.cwd ?? process.cwd(), p.signal)
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
                return ["no turns", "nothing to roll back", "past system prompt", "rollback past", "history shorter", "out of range"].some(v => b.includes(v)) ? {
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
                return K("[codex] turn/steer failed — falling back to new turn", {
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
