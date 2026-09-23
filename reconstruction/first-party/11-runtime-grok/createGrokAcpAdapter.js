// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: createGrokAcpAdapter  (minified: vw, daemon.pretty.js:63118)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createGrokAcpAdapter(e) {
    let t = e.grokBinary ?? "grok",
        n = e.cwd,
        r = e.sdkSessionId,
        i = e.env ?? {},
        o = e.promptTimeoutMs ?? 36e5,
        s = null,
        a = null,
        u = 1,
        l = new Map,
        c = !1,
        d = null,
        f = Ost(),
        p = null,
        m = null,
        h = !1,
        g = null,
        y, v = !1,
        b = async F => {
            v = !0;
            try {
                return await U("session/load", F)
            } finally {
                v = !1
            }
        }, _ = [], I, E, R = !1, x = new Set, S = null, D = 0, A, C, $, j, k, L = () => {
            I = void 0, E = void 0, R = !1, x.clear()
        }, B = () => {
            let F = S;
            return S = null, F ? ig(F.reason, F.toolInFlight) : null
        }, G = () => {
            let F = _.join("");
            _.length = 0, F && Promise.resolve(e.onDetachedTurn?.({
                text: F
            })).catch(V => {
                Z("grok detached-turn sink failed", {
                    error: V instanceof Error ? V.message : String(V)
                })
            })
        }, ce = F => {
            if (!s || v) return;
            let V = Ai(F.params),
                K = Ai(V.update),
                fe = String(K.sessionUpdate ?? "");
            if (fe === "agent_message_chunk") {
                let oe = c$(K.content);
                if (!oe) return;
                if (g) {
                    g.markFirstToken(), g.textParts.push(oe), g.onStream?.(oe);
                    return
                }
                if (y) {
                    y(oe);
                    return
                }
                _.push(oe);
                return
            }
            if (fe === "turn_completed") {
                g || G();
                return
            }
            if (g) {
                if (fe === "agent_thought_chunk") {
                    let oe = c$(K.content);
                    oe && g.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: oe
                    });
                    return
                }
                if (fe === "tool_call") {
                    let oe = String(K.toolCallId ?? K.tool_call_id ?? ""),
                        xe = qst(K);
                    if (!oe) return;
                    Bst(K) && (R = !0), x.add(oe), g.onExecutionEvent?.({
                        type: "tool_use",
                        toolUseId: oe,
                        toolName: xe,
                        input: K.rawInput ?? K.raw_input ?? {}
                    });
                    return
                }
                if (fe === "tool_call_update") {
                    let oe = String(K.status ?? "");
                    if (oe !== "completed" && oe !== "failed") return;
                    let xe = String(K.toolCallId ?? K.tool_call_id ?? "");
                    if (!xe) return;
                    x.delete(xe), g.onExecutionEvent?.({
                        type: "tool_result",
                        toolUseId: xe,
                        isError: oe === "failed",
                        summary: c$(K.content) || oe
                    })
                }
            }
        }, J = F => {
            if (typeof F == "string") {
                j = {
                    mode: "override",
                    layers: F
                };
                return
            }
            j = {
                mode: "append",
                layers: F?.append ?? ""
            }
        }, ee = F => {
            let V = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return e.mcpServerFactory && (V[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: f
            }]), j ? j.mode === "override" ? (V.systemPromptOverride = j.layers, V) : (F === "new" && j.layers.length > 0 && (V.rules = j.layers), V) : V
        }, le = () => {
            j?.mode === "override" && (k = j.layers)
        }, M = F => {
            let V = F.result ?? F,
                K = V._meta ?? {};
            return typeof V.sessionId == "string" && V.sessionId || typeof K.sessionId == "string" && K.sessionId || void 0
        }, ue = async () => {
            if (!a || j?.mode !== "override" || k === j.layers) return;
            let F = await b({
                    sessionId: a,
                    cwd: n,
                    mcpServers: [],
                    _meta: ee("load")
                }),
                V = M(F);
            if (V !== void 0 && V !== a) throw new Error(`session/load did not resume ${a} (got ${String(V)}); refusing to fork`);
            A = l$(F) ?? A, le()
        }, $e = async () => {
            !e.mcpServerFactory || p || (m = e.mcpServerFactory(), p = new TV, await m.instance.connect(p))
        }, se = async () => {
            let F = p,
                V = m;
            p = null, m = null;
            try {
                await F?.close()
            } catch {}
            try {
                await V?.instance.close()
            } catch {}
        }, N = F => {
            if (!s?.stdin.writable) throw new Error("grok ACP stdin is closed");
            s.stdin.write(`${JSON.stringify(F)}
`)
        }, U = (F, V, K = 3e4, fe) => {
            if (!s) return Promise.reject(new Error("grok ACP process is not running"));
            if (fe?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let oe = u++;
            return N({
                jsonrpc: "2.0",
                id: oe,
                method: F,
                params: V
            }), new Promise((xe, Re) => {
                let gt = !1,
                    Xe = K > 0 ? setTimeout(() => {
                        Pe(() => Re(new Error(`${F} timed out after ${K}ms`)))
                    }, K) : void 0,
                    Ve = () => {
                        Pe(() => Re(new AgentSdkTurnInterruptedError))
                    },
                    Pe = Qe => {
                        gt || (gt = !0, l.delete(oe), Xe && clearTimeout(Xe), fe?.removeEventListener("abort", Ve), Qe())
                    };
                fe?.addEventListener("abort", Ve, {
                    once: !0
                }), l.set(oe, {
                    resolve: Qe => Pe(() => xe(Qe)),
                    reject: Qe => Pe(() => Re(Qe))
                })
            })
        }, q = async (F, V) => {
            let K = xe => {
                try {
                    N({
                        jsonrpc: "2.0",
                        id: F,
                        ...xe
                    })
                } catch {}
            };
            if (!p) {
                K({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let fe = V ?? {};
            if (fe.serverId !== f) {
                K({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let oe = fe.message;
            if (typeof oe == "string") try {
                oe = JSON.parse(oe)
            } catch {
                K({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!oe || typeof oe != "object") {
                K({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let xe = await p.dispatch(oe);
                K({
                    result: xe
                })
            } catch (xe) {
                K({
                    error: {
                        code: -32603,
                        message: xe instanceof Error ? xe.message : String(xe)
                    }
                })
            }
        }, Y = F => {
            try {
                let V = F.trim();
                if (!V) return;
                let K;
                try {
                    K = JSON.parse(V)
                } catch {
                    return
                }
                if (typeof K.method == "string" && K.id !== void 0) {
                    if (Fst(K.method)) {
                        Ee(`grok ACP ${K.method}`), q(K.id, K.params);
                        return
                    }
                    N({
                        jsonrpc: "2.0",
                        id: K.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${K.method}`
                        }
                    });
                    return
                }
                if (typeof K.method == "string") {
                    let fe = Ai(K.params),
                        oe = Jst(fe.update);
                    oe && (oe.modelId && (A = oe.modelId), C = oe.reasoningEffort), Hst(K.method) && ce(K), e.onNotification?.(K.method), Ee(`grok ACP notification ${K.method}`);
                    return
                }
                if (typeof K.id == "number") {
                    let fe = l.get(K.id);
                    if (!fe) return;
                    l.delete(K.id), K.error ? fe.reject(new Error(JSON.stringify(K.error))) : fe.resolve(K)
                }
            } catch {}
        }, Se = () => {
            if (s) return;
            let F = {
                ...process.env,
                ...i
            };
            delete F.GROK_HOME;
            let V = Ast(t, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd: n,
                env: F,
                stdio: ["pipe", "pipe", "pipe"]
            });
            s = V, V.stderr.resume(), V.on("error", K => {
                ye(K)
            }), Ee(`grok ACP spawn pid=${V.pid??"unknown"}`), Ll(V.stdout, Y, {
                onEof: () => {
                    !c && s === V && V.kill("SIGKILL")
                }
            }), V.on("exit", () => {
                ye(new Error("grok ACP process exited"))
            })
        }, ye = F => {
            c || (a && (r = a), a = null, d = null), A = void 0, $ = void 0, C = void 0, k = void 0, s = null;
            for (let V of l.values()) V.reject(F);
            l.clear()
        }, Be = async () => {
            if (a) return a;
            if (d) return d;
            d = (async () => {
                Se();
                let V = (await U("initialize", {
                        protocolVersion: 1,
                        clientInfo: {
                            name: "duoduo",
                            version: "0.0.0"
                        },
                        clientCapabilities: {
                            fs: {},
                            terminal: !1
                        },
                        _meta: {
                            startupHints: {
                                nonInteractive: !0,
                                skipGitStatus: !0,
                                skipProjectLayout: !0
                            },
                            clientType: "duoduo",
                            clientVersion: "0.0.0",
                            ...e.mcpServerFactory ? {
                                [GROK_MCP_SDK_META]: !0
                            } : {}
                        }
                    })).result ?? {},
                    K = V.authMethods ?? V.auth_methods,
                    fe = K?.find(gt => gt.id === "cached_token") ?? K?.[0];
                if (fe?.id && await U("authenticate", {
                        methodId: fe.id,
                        _meta: {
                            headless: !0
                        }
                    }), await $e(), r) {
                    let gt = await b({
                            sessionId: r,
                            cwd: n,
                            mcpServers: [],
                            _meta: ee("load")
                        }),
                        Xe = M(gt);
                    if (Xe !== r) throw new Error(`session/load did not resume ${r} (got ${String(Xe)}); refusing to session/new`);
                    return a = Xe, A = l$(gt) ?? A, le(), a
                }
                let oe = await U("session/new", {
                        cwd: n,
                        mcpServers: [],
                        _meta: ee("new")
                    }),
                    Re = (oe.result ?? oe).sessionId;
                if (typeof Re != "string" || Re.length === 0) throw new Error("session/new did not return sessionId");
                return a = Re, r = Re, A = l$(oe) ?? A, le(), a
            })();
            try {
                return await d
            } catch (F) {
                throw d = null, await w(), F
            }
        }, w = async () => {
            if (c) return;
            c = !0, d = null, a = null, L(), g = null, y = void 0, G(), await se();
            let F = s;
            if (s = null, !F) {
                c = !1;
                return
            }
            F.kill("SIGTERM"), await new Promise(V => {
                let K = setTimeout(() => {
                    F.kill("SIGKILL"), V()
                }, 2e3);
                F.once("exit", () => {
                    clearTimeout(K), V()
                })
            }), c = !1
        }, P = async F => {
            let V = await Be();
            C = void 0;
            let K = {
                sessionId: V,
                modelId: F.modelId
            };
            typeof F.reasoningEffort == "string" && (K._meta = {
                reasoningEffort: F.reasoningEffort
            });
            let fe = await U("session/set_model", K);
            if (A = _w(l$(fe), F.modelId) ?? A, typeof F.reasoningEffort != "string") {
                $ = void 0;
                return
            }
            let oe = Wst(fe) ?? C;
            if (oe !== F.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${F.reasoningEffort}` + (oe === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${oe})`));
            $ = F.reasoningEffort
        }, z = F => F instanceof Error ? F.message : String(F);
    return {
        connect: Be,
        shutdown: w,
        currentModelId: () => A,
        hasSession: () => a !== null,
        setModel: P,
        compact: async () => {
            let F = new Date().toISOString();
            if (!a && !j) return {
                kind: "noop",
                runtime: "grok",
                reason: "session is not started yet — send a message first, then /compact",
                triggered_at: F
            };
            try {
                let V = await Be();
                return await U(GROK_ACP_COMPACT, {
                    sessionId: V
                }, 0), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: F
                }
            } catch (V) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: z(V),
                    triggered_at: F
                }
            }
        },
        activeTurnId: () => I,
        activeTurnStartedAt: () => E,
        activeTurnSkipObserved: () => R,
        steerActiveTurn: async (F, V, K) => {
            if (!a || I !== V) return !1;
            let fe = await Kye(K);
            if (!a || I !== V) return !1;
            let oe = {
                sessionId: a,
                text: F
            };
            fe.length > 0 && (oe.content = [{
                type: "text",
                text: F
            }, ...fe]);
            try {
                return await U(grokAcpExtMethod("interject"), oe), !0
            } catch {
                return !1
            }
        },
        run: async F => {
            let V = await zst(F.prompt),
                K = await Kye(F.attachments),
                fe = [...V.trim() ? [{
                    type: "text",
                    text: V
                }] : [], ...K];
            if (fe.length === 0) return {
                text: "",
                usage: void 0
            };
            if (h) throw new Error("grok adapter run() is already in flight for this session");
            h = !0;
            try {
                y = void 0, G(), J(F.systemPrompt);
                let oe = await Be();
                if (await ue(), F.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let xe = F.model,
                    Re = F.effort;
                if (xe || Re) {
                    let we = xe ?? A;
                    if (Re && !we) Z("grok effort re-apply skipped — no current model id", {
                        effort: Re
                    });
                    else if (we && (!!(xe && xe !== A) || !!(Re && Re !== $))) try {
                        await P({
                            modelId: we,
                            reasoningEffort: Re
                        })
                    } catch (On) {
                        let Lt = On instanceof Error ? On.message : String(On);
                        if (typeof Re == "string" && Lt.includes("reasoningEffort")) Z("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: we,
                            effort: Re,
                            error: Lt
                        });
                        else throw On
                    }
                }
                let gt = Date.now(),
                    Xe, Ve = [];
                I = `grok-turn-${++D}`, E = gt, R = !1, g = {
                    onStream: F.onStream,
                    onExecutionEvent: F.onExecutionEvent,
                    textParts: Ve,
                    markFirstToken: () => {
                        Xe === void 0 && (Xe = Date.now() - gt)
                    }
                };
                let Pe = () => {
                    let we = og(F.abortController?.signal.reason);
                    we && (S = {
                        reason: we,
                        toolInFlight: x.size > 0
                    }), L();
                    try {
                        N({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: oe
                            }
                        })
                    } catch {}
                };
                F.abortController?.signal.addEventListener("abort", Pe, {
                    once: !0
                });
                let Qe = B();
                Qe && fe.unshift({
                    type: "text",
                    text: Qe
                });
                try {
                    F.onTurnAcknowledged?.();
                    let we = await U("session/prompt", {
                        sessionId: oe,
                        prompt: fe
                    }, o, F.abortController?.signal);
                    if (F.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let Fe = we.result ?? we;
                    return {
                        sessionId: oe,
                        text: Ve.join(""),
                        usage: mapGrokUsageToDrainUsage(Fe),
                        firstTokenLatencyMs: Xe
                    }
                } catch (we) {
                    if (we instanceof AgentSdkTurnInterruptedError) throw we;
                    if (F.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        N({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: oe
                            }
                        })
                    } catch {}
                    throw we
                } finally {
                    F.abortController?.signal.removeEventListener("abort", Pe), y = s && F.abortController?.signal.aborted ? F.onStream : void 0, g = null, L()
                }
            } finally {
                h = !1
            }
        }
    }
}
