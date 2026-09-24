// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: yw, daemon.pretty.js:61974)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...Ast,
            ...e
        },
        r = null,
        i = !1,
        o = null,
        s = null,
        a = () => {
            let f = s;
            return s = null, f ? selectInterruptMarkerText(f.reason, f.toolInFlight) : null
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
                let H = [];
                for await (let L of f.prompt) if (typeof L.message.content == "string") H.push(L.message.content);
                else if (Array.isArray(L.message.content))
                    for (let G of L.message.content) G.type === "text" && H.push(G.text);
                p = H.join(`

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
                    let H = new Map;
                    for (let L of n.dynamicTools) H.set(L.name, L.handler);
                    r.setToolHandlers(H)
                }
                i = !0
            }
            let h = extractSystemPromptAppend(f.systemPrompt),
                g = buildBaseInstructions(t ?? {}, h),
                y = buildDeveloperInstructions(t ?? {}, n.dynamicTools?.map(H => H.name)),
                v = resolveCodexSandboxForPermissionMode(f.permissionMode, n.sandbox);
            f.disallowedTools?.length && Re("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: f.disallowedTools
            });
            let b = f.persistSession !== void 0 ? !f.persistSession : n.ephemeral,
                _ = f.model !== void 0 ? f.model : n.model,
                I = f.effort !== void 0 ? f.effort : n.effort,
                E = () => {
                    let H = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        serviceName: n.serviceName,
                        ephemeral: b,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return g && (H.baseInstructions = g), y && (H.developerInstructions = y), n.dynamicTools?.length && (H.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: n.dynamicTools.map(L => ({
                            type: "function",
                            name: L.name,
                            description: L.description,
                            inputSchema: L.inputSchema
                        }))
                    }], H.config = buildCodexDirectOnlyToolConfig()), H
                },
                R = H => {
                    let L = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        threadId: H
                    };
                    return n.dynamicTools?.length && (L.config = buildCodexDirectOnlyToolConfig()), L
                },
                x = H => {
                    let L = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        threadId: H,
                        persistExtendedHistory: !1
                    };
                    return g && (L.baseInstructions = g), y && (L.developerInstructions = y), n.dynamicTools?.length && (L.config = buildCodexDirectOnlyToolConfig()), L
                },
                S, D;
            f.forkFrom ? (S = "thread/fork", D = x(f.forkFrom)) : f.sessionId ? (S = "thread/resume", D = R(f.sessionId)) : (S = "thread/start", D = E(), s = null);
            let $ = async () => {
                try {
                    return await r.request(S, D, f.abortController?.signal)
                } catch (H) {
                    let L = H instanceof Error && H.name === "AbortError" || f.abortController?.signal.aborted === !0;
                    if (S === "thread/fork" && !L) return te("[codex-adapter] thread/fork failed, falling back to thread/start", {
                        cwd: m,
                        forkFrom: D.threadId,
                        error: H instanceof Error ? H.message : String(H)
                    }), S = "thread/start", D = E(), await r.request(S, D, f.abortController?.signal);
                    throw H
                }
            }, C = await $();
            if (S === "thread/resume" && _ !== void 0 && _ !== null) {
                let H = C.model,
                    L = C.thread.id;
                H !== _ && (te("[codex-adapter] resumed thread runs a different model; forking", {
                    cwd: m,
                    resumedThreadId: L,
                    resumedModel: H,
                    wantedModel: _
                }), S = "thread/fork", D = x(L), C = await $())
            }
            let A = C.model,
                k = C.thread.id;
            o = k;
            let N = [],
                V = new Set,
                W = new Map,
                ce = new Set,
                J = {},
                ne, fe = Date.now(),
                j = !1,
                ue, Ie, ae = new Promise(H => {
                    Ie = H
                }),
                M = !1,
                z = H => {
                    if (!ue) return;
                    let L = extractCodexGeneratedImageAttachment(H);
                    if (!L) {
                        !M && hasImageGenerationRecord(H) && (M = !0, Z("[codex] image-generation record present but no attachment extracted", {
                            threadId: k,
                            turnId: ue,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let G = "path" in L ? `path:${L.path}` : `call:${L.callId}`;
                    W.set(G, L)
                },
                U = !1,
                X = new Promise((H, L) => {
                    let G = le => {
                            U || (U = !0, we(), le())
                        },
                        ee = le => {
                            if (U) return;
                            let ve = le.params ?? {},
                                Be = ve.threadId,
                                at = ve.turnId;
                            if (codexNotificationFilterDecision({
                                    method: le.method,
                                    msgThreadId: Be,
                                    msgTurnId: at,
                                    ownThreadId: k,
                                    ownTurnId: ue
                                }) !== "process") return;
                            let Je = ve.item;
                            switch (z(ve), le.method) {
                                case "item/agentMessage/delta": {
                                    let {
                                        delta: De = "",
                                        itemId: Oe
                                    } = ve;
                                    De && (j || (ne = Date.now() - fe, j = !0), (!Oe || !V.has(Oe)) && N.push(De), f.onStream?.(De));
                                    break
                                }
                                case "item/started": {
                                    if (!Je) break;
                                    Je.type === "agentMessage" && typeof Je.id == "string" && Je.phase === "commentary" && V.add(Je.id);
                                    let De = mapItemStartedToExecEvent(Je);
                                    De?.type === "tool_use" && ce.add(De.toolUseId), De && f.onExecutionEvent?.(De);
                                    break
                                }
                                case "item/completed": {
                                    if (!Je) break;
                                    z(Je);
                                    let De = mapItemCompletedToExecEvent(Je);
                                    De?.type === "tool_result" && ce.delete(De.toolUseId), De && f.onExecutionEvent?.(De);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let De = ve.delta ?? "";
                                    De && f.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: De
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let De = ve.tokenUsage;
                                    J = computeCodexTurnUsage(J, De?.total, De?.last);
                                    break
                                }
                                case "turn/completed": {
                                    Be === k && G(() => H());
                                    break
                                }
                                case "error": {
                                    let Oe = ve.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(Oe)) {
                                        te("[codex-transport] transient reconnect notice", {
                                            message: Oe,
                                            threadId: k,
                                            turnId: ue
                                        });
                                        break
                                    }
                                    G(() => L(new Error(Oe || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        we = () => {
                            r?.removeListener("notification", ee)
                        };
                    if (r.on("notification", ee), f.abortController) {
                        let le = () => {
                            let ve = normalizeTurnAbortReason(f.abortController?.signal.reason);
                            ve && (s = {
                                reason: ve,
                                toolInFlight: ce.size > 0
                            });
                            let Be = new Promise((Je, De) => setTimeout(() => De(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([ae, Be]).then(Je => {
                                r?.request("turn/interrupt", {
                                    threadId: k,
                                    turnId: Je
                                }).catch(() => {})
                            }).catch(() => {});
                            let at = new Error("turn aborted");
                            at.name = "AbortError", G(() => L(at))
                        };
                        f.abortController.signal.addEventListener("abort", le, {
                            once: !0
                        })
                    }
                });
            try {
                f.onTurnAcknowledged?.()
            } catch {}
            let Ee = buildCodexTurnInput(p, f.attachments),
                be = a();
            be && Ee.unshift({
                type: "text",
                text: be,
                text_elements: []
            });
            let w;
            try {
                w = await r.request("turn/start", {
                    threadId: k,
                    input: Ee,
                    model: _,
                    effort: I,
                    outputSchema: f.outputFormat ?? null
                }, f.abortController?.signal)
            } catch (H) {
                if (typeof H.code == "number" && H.name !== "AbortError") try {
                    f.onTurnRejected?.()
                } catch {}
                throw H
            }
            ue = w.turn?.id, ue && Ie?.(ue), ue && (u = {
                threadId: k,
                turnId: ue,
                abortSignal: f.abortController?.signal,
                startedAt: fe
            }), f.abortController?.signal.aborted && ue && r.request("turn/interrupt", {
                threadId: k,
                turnId: ue
            }).catch(() => {});
            try {
                await X
            } finally {
                u && u.turnId === ue && (u = null)
            }
            let P = N.join(""),
                K = J.usage ? {
                    ...J.usage,
                    model: A
                } : void 0;
            return {
                sessionId: k,
                text: P || void 0,
                attachments: W.size > 0 ? Array.from(W.values()) : void 0,
                usage: K,
                firstTokenLatencyMs: ne
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
                return te("[codex] turn/steer failed — falling back to new turn", {
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
