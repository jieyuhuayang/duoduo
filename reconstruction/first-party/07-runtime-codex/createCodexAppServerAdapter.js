// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: Bw, daemon.pretty.js:62293)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.1, v0.5.2, v0.5.3, v0.5.4, v0.5.5, v0.5.6, v0.5.7, v0.5.8, v0.6.0, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.2 (maps/history_daemon.json)
// changelog v0.4.4 (high): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
// changelog v0.5.1 (high): The new behavior calls `thread/fork` from the parent rollout when one is available … Falls back to `thread/start` if the parent rollout has been GC'd.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
    let n = {
            ...Iut,
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
        l = f => (f === Es && u && (u.skipObserved = !0), u?.turnId),
        c = (f, p, m) => {
            f === Es && !p && u && m !== void 0 && m === u.turnId && (u.skipObserved = !1)
        };
    async function d(f, p, m) {
        if ((!r || !r.isAlive) && (r = new BC(n.codexBinary, p, n.env), r.start(), r.setToolCallObserved(l), r.setToolCallSettled(c), i = !1, o = null), !i) {
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
                let L = [];
                for await (let z of f.prompt) if (typeof z.message.content == "string") L.push(z.message.content);
                else if (Array.isArray(z.message.content))
                    for (let U of z.message.content) U.type === "text" && L.push(U.text);
                p = L.join(`

`)
            }
            if (!p.trim()) return {
                text: "",
                usage: void 0
            };
            let m = f.cwd || process.cwd();
            if ((!r || !r.isAlive) && (r = new BC(n.codexBinary, m, n.env), r.start(), r.setToolCallObserved(l), r.setToolCallSettled(c), i = !1), !i) {
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
                    let L = new Map;
                    for (let z of n.dynamicTools) L.set(z.name, z.handler);
                    r.setToolHandlers(L)
                }
                i = !0
            }
            let h = extractSystemPromptAppend(f.systemPrompt),
                g = buildBaseInstructions(t ?? {}, h),
                y = buildDeveloperInstructions(t ?? {}, n.dynamicTools?.map(L => L.name)),
                v = resolveCodexSandboxForPermissionMode(f.permissionMode, n.sandbox);
            f.disallowedTools?.length && logDebugMessage("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: f.disallowedTools
            });
            let b = f.persistSession !== void 0 ? !f.persistSession : n.ephemeral,
                _ = f.model !== void 0 ? f.model : n.model,
                E = f.effort !== void 0 ? f.effort : n.effort,
                R = () => {
                    let L = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        serviceName: n.serviceName,
                        ephemeral: b,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return g && (L.baseInstructions = g), y && (L.developerInstructions = y), n.dynamicTools?.length && (L.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: n.dynamicTools.map(z => ({
                            type: "function",
                            name: z.name,
                            description: z.description,
                            inputSchema: z.inputSchema
                        }))
                    }], L.config = buildCodexDirectOnlyToolConfig()), L
                },
                P = L => {
                    let z = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        threadId: L
                    };
                    return n.dynamicTools?.length && (z.config = buildCodexDirectOnlyToolConfig()), z
                },
                k = L => {
                    let z = {
                        cwd: m,
                        model: _,
                        approvalPolicy: "never",
                        sandbox: v,
                        threadId: L,
                        persistExtendedHistory: !1
                    };
                    return g && (z.baseInstructions = g), y && (z.developerInstructions = y), n.dynamicTools?.length && (z.config = buildCodexDirectOnlyToolConfig()), z
                },
                S, D;
            f.forkFrom ? (S = "thread/fork", D = k(f.forkFrom)) : f.sessionId ? (S = "thread/resume", D = P(f.sessionId)) : (S = "thread/start", D = R(), s = null);
            let A = async () => {
                try {
                    return await r.request(S, D, f.abortController?.signal)
                } catch (L) {
                    let z = L instanceof Error && L.name === "AbortError" || f.abortController?.signal.aborted === !0;
                    if (S === "thread/fork" && !z) return logInfoMessage("[codex-adapter] thread/fork failed, falling back to thread/start", {
                        cwd: m,
                        forkFrom: D.threadId,
                        error: L instanceof Error ? L.message : String(L)
                    }), S = "thread/start", D = R(), await r.request(S, D, f.abortController?.signal);
                    throw L
                }
            }, $ = await A();
            if (S === "thread/resume" && _ !== void 0 && _ !== null) {
                let L = $.model,
                    z = $.thread.id;
                L !== _ && (logInfoMessage("[codex-adapter] resumed thread runs a different model; forking", {
                    cwd: m,
                    resumedThreadId: z,
                    resumedModel: L,
                    wantedModel: _
                }), S = "thread/fork", D = k(z), $ = await A())
            }
            let C = $.model,
                x = $.thread.id;
            o = x;
            let M = [],
                F = new Set,
                J = new Map,
                ce = new Set,
                ie = {},
                Ce, se = Date.now(),
                j = !1,
                ne, K, te = new Promise(L => {
                    K = L
                }),
                B = !1,
                G = L => {
                    if (!ne) return;
                    let z = extractCodexGeneratedImageAttachment(L);
                    if (!z) {
                        !B && hasImageGenerationRecord(L) && (B = !0, logWarnMessage("[codex] image-generation record present but no attachment extracted", {
                            threadId: x,
                            turnId: ne,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let U = "path" in z ? `path:${z.path}` : `call:${z.callId}`;
                    J.set(U, z)
                },
                H = !1,
                q = new Promise((L, z) => {
                    let U = re => {
                            H || (H = !0, me(), re())
                        },
                        Y = re => {
                            if (H) return;
                            let Ee = re.params ?? {},
                                Oe = Ee.threadId,
                                Xe = Ee.turnId;
                            if (codexNotificationFilterDecision({
                                    method: re.method,
                                    msgThreadId: Oe,
                                    msgTurnId: Xe,
                                    ownThreadId: x,
                                    ownTurnId: ne
                                }) !== "process") return;
                            let nt = Ee.item;
                            switch (G(Ee), re.method) {
                                case "item/agentMessage/delta": {
                                    let {
                                        delta: Ze = "",
                                        itemId: qe
                                    } = Ee;
                                    Ze && (j || (Ce = Date.now() - se, j = !0), (!qe || !F.has(qe)) && M.push(Ze), f.onStream?.(Ze));
                                    break
                                }
                                case "item/started": {
                                    if (!nt) break;
                                    nt.type === "agentMessage" && typeof nt.id == "string" && nt.phase === "commentary" && F.add(nt.id);
                                    let Ze = mapItemStartedToExecEvent(nt);
                                    Ze?.type === "tool_use" && ce.add(Ze.toolUseId), Ze && f.onExecutionEvent?.(Ze);
                                    break
                                }
                                case "item/completed": {
                                    if (!nt) break;
                                    G(nt);
                                    let Ze = mapItemCompletedToExecEvent(nt);
                                    Ze?.type === "tool_result" && ce.delete(Ze.toolUseId), Ze && f.onExecutionEvent?.(Ze);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let Ze = Ee.delta ?? "";
                                    Ze && f.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: Ze
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let Ze = Ee.tokenUsage;
                                    ie = computeCodexTurnUsage(ie, Ze?.total, Ze?.last);
                                    break
                                }
                                case "turn/completed": {
                                    Oe === x && U(() => L());
                                    break
                                }
                                case "error": {
                                    let qe = Ee.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(qe)) {
                                        logInfoMessage("[codex-transport] transient reconnect notice", {
                                            message: qe,
                                            threadId: x,
                                            turnId: ne
                                        });
                                        break
                                    }
                                    U(() => z(new Error(qe || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        me = () => {
                            r?.removeListener("notification", Y)
                        };
                    if (r.on("notification", Y), f.abortController) {
                        let re = () => {
                            let Ee = normalizeTurnAbortReason(f.abortController?.signal.reason);
                            Ee && (s = {
                                reason: Ee,
                                toolInFlight: ce.size > 0
                            });
                            let Oe = new Promise((nt, Ze) => setTimeout(() => Ze(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([te, Oe]).then(nt => {
                                r?.request("turn/interrupt", {
                                    threadId: x,
                                    turnId: nt
                                }).catch(() => {})
                            }).catch(() => {});
                            let Xe = new Error("turn aborted");
                            Xe.name = "AbortError", U(() => z(Xe))
                        };
                        f.abortController.signal.addEventListener("abort", re, {
                            once: !0
                        })
                    }
                });
            try {
                f.onTurnAcknowledged?.()
            } catch {}
            let pe = buildCodexTurnInput(p, f.attachments),
                fe = a();
            fe && pe.unshift({
                type: "text",
                text: fe,
                text_elements: []
            });
            let Se;
            try {
                Se = await r.request("turn/start", {
                    threadId: x,
                    input: pe,
                    model: _,
                    effort: E,
                    outputSchema: f.outputFormat ?? null
                }, f.abortController?.signal)
            } catch (L) {
                if (typeof L.code == "number" && L.name !== "AbortError") try {
                    f.onTurnRejected?.()
                } catch {}
                throw L
            }
            ne = Se.turn?.id, ne && K?.(ne), ne && (u = {
                threadId: x,
                turnId: ne,
                abortSignal: f.abortController?.signal,
                startedAt: se
            }), f.abortController?.signal.aborted && ne && r.request("turn/interrupt", {
                threadId: x,
                turnId: ne
            }).catch(() => {});
            try {
                await q
            } finally {
                u && u.turnId === ne && (u = null)
            }
            let w = M.join(""),
                T = ie.usage ? {
                    ...ie.usage,
                    model: C
                } : void 0;
            return {
                sessionId: x,
                text: w || void 0,
                attachments: J.size > 0 ? Array.from(J.values()) : void 0,
                usage: T,
                firstTokenLatencyMs: Ce
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
                    let _ = R => {
                            let P = R.params ?? {};
                            if (R.method === "thread/compacted") {
                                y({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: p
                                }), E(), b();
                                return
                            }
                            if (R.method === "item/completed" && P.item?.type === "contextCompaction") {
                                y({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: p
                                }), E(), b();
                                return
                            }
                            if (R.method === "error") {
                                let k = (P.error?.message ?? "") || "unknown error";
                                if (/^(Reconnecting|Connecting)\b/.test(k)) return;
                                y({
                                    kind: "failed",
                                    runtime: "codex",
                                    error: k,
                                    triggered_at: p
                                }), E(), b()
                            }
                        },
                        E = () => {
                            r?.removeListener("notification", _)
                        };
                    r.on("notification", _), m.signal.addEventListener("abort", () => {
                        E(), g || y({
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
                return logInfoMessage("[codex] turn/steer failed — falling back to new turn", {
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
