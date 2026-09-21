// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: yw, daemon.pretty.js:61974)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...Pst,
            ...e
        },
        r = null,
        i = !1,
        o = null,
        s = null,
        a = () => {
            let f = s;
            return s = null, f ? ig(f.reason, f.toolInFlight) : null
        },
        u = null,
        l = f => (f === ws && u && (u.skipObserved = !0), u?.turnId),
        c = (f, p, m) => {
            f === ws && !p && u && m !== void 0 && m === u.turnId && (u.skipObserved = !1)
        };
    async function d(f, p, m) {
        if ((!r || !r.isAlive) && (r = new a$(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(l), r.setToolCallSettled(c), i = !1, o = null), !i) {
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
                }, m), r.notify("initialized", {}), n.dynamicTools?.length) {
                let h = new Map;
                for (let g of n.dynamicTools) h.set(g.name, g.handler);
                r.setToolHandlers(h)
            }
            i = !0
        }
        o !== f && (await r.request("thread/resume", {
            threadId: f
        }, m), o = f)
    }
    return {
        async run(f) {
            let p;
            if (typeof f.prompt == "string") p = f.prompt;
            else {
                let z = [];
                for await (let F of f.prompt) if (typeof F.message.content == "string") z.push(F.message.content);
                else if (Array.isArray(F.message.content))
                    for (let V of F.message.content) V.type === "text" && z.push(V.text);
                p = z.join(`

`)
            }
            if (!p.trim()) return {
                text: "",
                usage: void 0
            };
            let m = f.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new a$(n.codexBinary, m, n.env), r.start(), r.setToolCallObserved(l), r.setToolCallSettled(c), i = !1), !i) {
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
                    }, f.abortController?.signal), r.notify("initialized", {}), n.dynamicTools?.length) {
                    let z = new Map;
                    for (let F of n.dynamicTools) z.set(F.name, F.handler);
                    r.setToolHandlers(z)
                }
                i = !0
            }
            let h = extractSystemPromptAppend(f.systemPrompt),
                g = buildBaseInstructions(t ?? {}, h),
                y = buildDeveloperInstructions(t ?? {}, n.dynamicTools?.map(z => z.name)),
                v = Cst(f.permissionMode, n.sandbox);
            f.disallowedTools?.length && Ee("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: f.disallowedTools
            });
            let b = f.persistSession !== void 0 ? !f.persistSession : n.ephemeral,
                _ = f.model !== void 0 ? f.model : n.model,
                I = f.effort !== void 0 ? f.effort : n.effort,
                E = () => {
                    let z = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        serviceName: n.serviceName,
                        ephemeral: b,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return g && (z.baseInstructions = g), y && (z.developerInstructions = y), n.dynamicTools?.length && (z.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: n.dynamicTools.map(F => ({
                            type: "function",
                            name: F.name,
                            description: F.description,
                            inputSchema: F.inputSchema
                        }))
                    }], z.config = SV()), z
                },
                R = z => {
                    let F = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        threadId: z
                    };
                    return n.dynamicTools?.length && (F.config = SV()), F
                },
                x = z => {
                    let F = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        threadId: z,
                        persistExtendedHistory: !1
                    };
                    return g && (F.baseInstructions = g), y && (F.developerInstructions = y), n.dynamicTools?.length && (F.config = SV()), F
                },
                S, D;
            f.forkFrom ? (S = "thread/fork", D = x(f.forkFrom)) : f.sessionId ? (S = "thread/resume", D = R(f.sessionId)) : (S = "thread/start", D = E(), s = null);
            let A = async () => {
                try {
                    return await r.request(S, D, f.abortController?.signal)
                } catch (z) {
                    let F = z instanceof Error && z.name === "AbortError" || f.abortController?.signal.aborted === !0;
                    if (S === "thread/fork" && !F) return Q("[codex-adapter] thread/fork failed, falling back to thread/start", {
                        cwd: m,
                        forkFrom: D.threadId,
                        error: z instanceof Error ? z.message : String(z)
                    }), S = "thread/start", D = E(), await r.request(S, D, f.abortController?.signal);
                    throw z
                }
            }, C = await A();
            if (S === "thread/resume" && _ !== void 0 && _ !== null) {
                let z = C.model,
                    F = C.thread.id;
                z !== _ && (Q("[codex-adapter] resumed thread runs a different model; forking", {
                    cwd: m,
                    resumedThreadId: F,
                    resumedModel: z,
                    wantedModel: _
                }), S = "thread/fork", D = x(F), C = await A())
            }
            let $ = C.model,
                k = C.thread.id;
            o = k;
            let L = [],
                B = new Set,
                G = new Map,
                ce = new Set,
                J = {},
                ee, le = Date.now(),
                M = !1,
                ue, $e, se = new Promise(z => {
                    $e = z
                }),
                N = !1,
                U = z => {
                    if (!ue) return;
                    let F = extractCodexGeneratedImageAttachment(z);
                    if (!F) {
                        !N && hasImageGenerationRecord(z) && (N = !0, Z("[codex] image-generation record present but no attachment extracted", {
                            threadId: k,
                            turnId: ue,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let V = "path" in F ? `path:${F.path}` : `call:${F.callId}`;
                    G.set(V, F)
                },
                q = !1,
                Y = new Promise((z, F) => {
                    let V = oe => {
                            q || (q = !0, fe(), oe())
                        },
                        K = oe => {
                            if (q) return;
                            let xe = oe.params ?? {},
                                Re = xe.threadId,
                                gt = xe.turnId;
                            if (codexNotificationFilterDecision({
                                    method: oe.method,
                                    msgThreadId: Re,
                                    msgTurnId: gt,
                                    ownThreadId: k,
                                    ownTurnId: ue
                                }) !== "process") return;
                            let Xe = xe.item;
                            switch (U(xe), oe.method) {
                                case "item/agentMessage/delta": {
                                    let {
                                        delta: Ve = "",
                                        itemId: Pe
                                    } = xe;
                                    Ve && (M || (ee = Date.now() - le, M = !0), (!Pe || !B.has(Pe)) && L.push(Ve), f.onStream?.(Ve));
                                    break
                                }
                                case "item/started": {
                                    if (!Xe) break;
                                    Xe.type === "agentMessage" && typeof Xe.id == "string" && Xe.phase === "commentary" && B.add(Xe.id);
                                    let Ve = mapItemStartedToExecEvent(Xe);
                                    Ve?.type === "tool_use" && ce.add(Ve.toolUseId), Ve && f.onExecutionEvent?.(Ve);
                                    break
                                }
                                case "item/completed": {
                                    if (!Xe) break;
                                    U(Xe);
                                    let Ve = mapItemCompletedToExecEvent(Xe);
                                    Ve?.type === "tool_result" && ce.delete(Ve.toolUseId), Ve && f.onExecutionEvent?.(Ve);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let Ve = xe.delta ?? "";
                                    Ve && f.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: Ve
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let Ve = xe.tokenUsage;
                                    J = computeCodexTurnUsage(J, Ve?.total, Ve?.last);
                                    break
                                }
                                case "turn/completed": {
                                    Re === k && V(() => z());
                                    break
                                }
                                case "error": {
                                    let Pe = xe.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(Pe)) {
                                        Q("[codex-transport] transient reconnect notice", {
                                            message: Pe,
                                            threadId: k,
                                            turnId: ue
                                        });
                                        break
                                    }
                                    V(() => F(new Error(Pe || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        fe = () => {
                            r?.removeListener("notification", K)
                        };
                    if (r.on("notification", K), f.abortController) {
                        let oe = () => {
                            let xe = og(f.abortController?.signal.reason);
                            xe && (s = {
                                reason: xe,
                                toolInFlight: ce.size > 0
                            });
                            let Re = new Promise((Xe, Ve) => setTimeout(() => Ve(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([se, Re]).then(Xe => {
                                r?.request("turn/interrupt", {
                                    threadId: k,
                                    turnId: Xe
                                }).catch(() => {})
                            }).catch(() => {});
                            let gt = new Error("turn aborted");
                            gt.name = "AbortError", V(() => F(gt))
                        };
                        f.abortController.signal.addEventListener("abort", oe, {
                            once: !0
                        })
                    }
                });
            try {
                f.onTurnAcknowledged?.()
            } catch {}
            let Se = buildCodexTurnInput(p, f.attachments),
                ye = a();
            ye && Se.unshift({
                type: "text",
                text: ye,
                text_elements: []
            });
            let Be;
            try {
                Be = await r.request("turn/start", {
                    threadId: k,
                    input: Se,
                    model: _,
                    effort: I,
                    outputSchema: f.outputFormat ?? null
                }, f.abortController?.signal)
            } catch (z) {
                if (typeof z.code == "number" && z.name !== "AbortError") try {
                    f.onTurnRejected?.()
                } catch {}
                throw z
            }
            ue = Be.turn?.id, ue && $e?.(ue), ue && (u = {
                threadId: k,
                turnId: ue,
                abortSignal: f.abortController?.signal,
                startedAt: le
            }), f.abortController?.signal.aborted && ue && r.request("turn/interrupt", {
                threadId: k,
                turnId: ue
            }).catch(() => {});
            try {
                await Y
            } finally {
                u && u.turnId === ue && (u = null)
            }
            let w = L.join(""),
                P = J.usage ? {
                    ...J.usage,
                    model: $
                } : void 0;
            return {
                sessionId: k,
                text: w || void 0,
                attachments: G.size > 0 ? Array.from(G.values()) : void 0,
                usage: P,
                firstTokenLatencyMs: ee
            }
        },
        async compact(f) {
            let p = new Date().toISOString(),
                m = new AbortController,
                h;
            f.abortController && (h = () => m.abort(), f.abortController.signal.addEventListener("abort", h, {
                once: !0
            }));
            try {
                await d(f.sessionId, f.cwd ?? process.cwd(), m.signal)
            } catch (b) {
                return h && f.abortController?.signal.removeEventListener("abort", h), f.abortController?.signal.aborted === !0 || b instanceof Error && b.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: p
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: `failed to attach to thread: ${b instanceof Error?b.message.split(`
`)[0]:String(b)}`,
                    triggered_at: p
                }
            }
            let g, y = b => {
                    g || (g = b)
                },
                v = new Promise(b => {
                    let _ = E => {
                            let R = E.params ?? {};
                            if (E.method === "thread/compacted") {
                                y({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: p
                                }), I(), b();
                                return
                            }
                            if (E.method === "item/completed" && R.item?.type === "contextCompaction") {
                                y({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: p
                                }), I(), b();
                                return
                            }
                            if (E.method === "error") {
                                let x = (R.error?.message ?? "") || "unknown error";
                                if (/^(Reconnecting|Connecting)\b/.test(x)) return;
                                y({
                                    kind: "failed",
                                    runtime: "codex",
                                    error: x,
                                    triggered_at: p
                                }), I(), b()
                            }
                        },
                        I = () => {
                            r?.removeListener("notification", _)
                        };
                    r.on("notification", _), m.signal.addEventListener("abort", () => {
                        I(), g || y({
                            kind: "failed",
                            runtime: "codex",
                            error: "aborted",
                            triggered_at: p
                        }), b()
                    }, {
                        once: !0
                    })
                });
            try {
                await r.request("thread/compact/start", {
                    threadId: f.sessionId
                }, m.signal)
            } catch (b) {
                return h && f.abortController?.signal.removeEventListener("abort", h), f.abortController?.signal.aborted === !0 || b instanceof Error && b.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: p
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: b instanceof Error ? b.message.split(`
`)[0] : String(b),
                    triggered_at: p
                }
            }
            return await v, h && f.abortController?.signal.removeEventListener("abort", h), g ?? {
                kind: "noop",
                runtime: "codex",
                reason: "no compaction notification received before stream end",
                triggered_at: p
            }
        },
        activeTurnId() {
            return u?.turnId
        },
        activeTurnStartedAt() {
            return u?.startedAt
        },
        activeTurnSkipObserved() {
            return u?.skipObserved === !0
        },
        async steerActiveTurn(f, p, m) {
            let h = u;
            if (!r || !r.isAlive || !h || h.turnId !== p) return !1;
            try {
                return await r.request("turn/steer", {
                    threadId: h.threadId,
                    expectedTurnId: p,
                    input: buildCodexTurnInput(f, m)
                }, h.abortSignal), !0
            } catch (g) {
                return Q("[codex] turn/steer failed — falling back to new turn", {
                    threadId: h.threadId,
                    expectedTurnId: p,
                    error: g instanceof Error ? g.message : String(g)
                }), !1
            }
        },
        async shutdown() {
            await r?.shutdown(), r = null, i = !1
        }
    }
}
