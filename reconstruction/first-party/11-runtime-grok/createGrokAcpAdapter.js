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
        f = Mst(),
        p = null,
        m = null,
        h = !1,
        g = null,
        y, v = !1,
        b = async L => {
            v = !0;
            try {
                return await z("session/load", L)
            } finally {
                v = !1
            }
        }, _ = [], I, E, R = !1, x = new Set, S = null, D = 0, $, C, A, F, k, N = () => {
            I = void 0, E = void 0, R = !1, x.clear()
        }, V = () => {
            let L = S;
            return S = null, L ? og(L.reason, L.toolInFlight) : null
        }, W = () => {
            let L = _.join("");
            _.length = 0, L && Promise.resolve(e.onDetachedTurn?.({
                text: L
            })).catch(G => {
                Z("grok detached-turn sink failed", {
                    error: G instanceof Error ? G.message : String(G)
                })
            })
        }, ce = L => {
            if (!s || v) return;
            let G = $i(L.params),
                ee = $i(G.update),
                we = String(ee.sessionUpdate ?? "");
            if (we === "agent_message_chunk") {
                let le = c$(ee.content);
                if (!le) return;
                if (g) {
                    g.markFirstToken(), g.textParts.push(le), g.onStream?.(le);
                    return
                }
                if (y) {
                    y(le);
                    return
                }
                _.push(le);
                return
            }
            if (we === "turn_completed") {
                g || W();
                return
            }
            if (g) {
                if (we === "agent_thought_chunk") {
                    let le = c$(ee.content);
                    le && g.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: le
                    });
                    return
                }
                if (we === "tool_call") {
                    let le = String(ee.toolCallId ?? ee.tool_call_id ?? ""),
                        ve = Wst(ee);
                    if (!le) return;
                    Jst(ee) && (R = !0), x.add(le), g.onExecutionEvent?.({
                        type: "tool_use",
                        toolUseId: le,
                        toolName: ve,
                        input: ee.rawInput ?? ee.raw_input ?? {}
                    });
                    return
                }
                if (we === "tool_call_update") {
                    let le = String(ee.status ?? "");
                    if (le !== "completed" && le !== "failed") return;
                    let ve = String(ee.toolCallId ?? ee.tool_call_id ?? "");
                    if (!ve) return;
                    x.delete(ve), g.onExecutionEvent?.({
                        type: "tool_result",
                        toolUseId: ve,
                        isError: le === "failed",
                        summary: c$(ee.content) || le
                    })
                }
            }
        }, J = L => {
            if (typeof L == "string") {
                F = {
                    mode: "override",
                    layers: L
                };
                return
            }
            F = {
                mode: "append",
                layers: L?.append ?? ""
            }
        }, ne = L => {
            let G = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return e.mcpServerFactory && (G[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: f
            }]), F ? F.mode === "override" ? (G.systemPromptOverride = F.layers, G) : (L === "new" && F.layers.length > 0 && (G.rules = F.layers), G) : G
        }, fe = () => {
            F?.mode === "override" && (k = F.layers)
        }, j = L => {
            let G = L.result ?? L,
                ee = G._meta ?? {};
            return typeof G.sessionId == "string" && G.sessionId || typeof ee.sessionId == "string" && ee.sessionId || void 0
        }, ue = async () => {
            if (!a || F?.mode !== "override" || k === F.layers) return;
            let L = await b({
                    sessionId: a,
                    cwd: n,
                    mcpServers: [],
                    _meta: ne("load")
                }),
                G = j(L);
            if (G !== void 0 && G !== a) throw new Error(`session/load did not resume ${a} (got ${String(G)}); refusing to fork`);
            $ = l$(L) ?? $, fe()
        }, Ie = async () => {
            !e.mcpServerFactory || p || (m = e.mcpServerFactory(), p = new PV, await m.instance.connect(p))
        }, ae = async () => {
            let L = p,
                G = m;
            p = null, m = null;
            try {
                await L?.close()
            } catch {}
            try {
                await G?.instance.close()
            } catch {}
        }, M = L => {
            if (!s?.stdin.writable) throw new Error("grok ACP stdin is closed");
            s.stdin.write(`${JSON.stringify(L)}
`)
        }, z = (L, G, ee = 3e4, we) => {
            if (!s) return Promise.reject(new Error("grok ACP process is not running"));
            if (we?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let le = u++;
            return M({
                jsonrpc: "2.0",
                id: le,
                method: L,
                params: G
            }), new Promise((ve, Be) => {
                let at = !1,
                    Je = ee > 0 ? setTimeout(() => {
                        Oe(() => Be(new Error(`${L} timed out after ${ee}ms`)))
                    }, ee) : void 0,
                    De = () => {
                        Oe(() => Be(new AgentSdkTurnInterruptedError))
                    },
                    Oe = Gt => {
                        at || (at = !0, l.delete(le), Je && clearTimeout(Je), we?.removeEventListener("abort", De), Gt())
                    };
                we?.addEventListener("abort", De, {
                    once: !0
                }), l.set(le, {
                    resolve: Gt => Oe(() => ve(Gt)),
                    reject: Gt => Oe(() => Be(Gt))
                })
            })
        }, U = async (L, G) => {
            let ee = ve => {
                try {
                    M({
                        jsonrpc: "2.0",
                        id: L,
                        ...ve
                    })
                } catch {}
            };
            if (!p) {
                ee({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let we = G ?? {};
            if (we.serverId !== f) {
                ee({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let le = we.message;
            if (typeof le == "string") try {
                le = JSON.parse(le)
            } catch {
                ee({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!le || typeof le != "object") {
                ee({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let ve = await p.dispatch(le);
                ee({
                    result: ve
                })
            } catch (ve) {
                ee({
                    error: {
                        code: -32603,
                        message: ve instanceof Error ? ve.message : String(ve)
                    }
                })
            }
        }, X = L => {
            try {
                let G = L.trim();
                if (!G) return;
                let ee;
                try {
                    ee = JSON.parse(G)
                } catch {
                    return
                }
                if (typeof ee.method == "string" && ee.id !== void 0) {
                    if (Bst(ee.method)) {
                        Re(`grok ACP ${ee.method}`), U(ee.id, ee.params);
                        return
                    }
                    M({
                        jsonrpc: "2.0",
                        id: ee.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${ee.method}`
                        }
                    });
                    return
                }
                if (typeof ee.method == "string") {
                    let we = $i(ee.params),
                        le = Yst(we.update);
                    le && (le.modelId && ($ = le.modelId), C = le.reasoningEffort), Gst(ee.method) && ce(ee), e.onNotification?.(ee.method), Re(`grok ACP notification ${ee.method}`);
                    return
                }
                if (typeof ee.id == "number") {
                    let we = l.get(ee.id);
                    if (!we) return;
                    l.delete(ee.id), ee.error ? we.reject(new Error(JSON.stringify(ee.error))) : we.resolve(ee)
                }
            } catch {}
        }, Ee = () => {
            if (s) return;
            let L = {
                ...process.env,
                ...i
            };
            delete L.GROK_HOME;
            let G = jst(t, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd: n,
                env: L,
                stdio: ["pipe", "pipe", "pipe"]
            });
            s = G, G.stderr.resume(), G.on("error", ee => {
                be(ee)
            }), Re(`grok ACP spawn pid=${G.pid??"unknown"}`), Ll(G.stdout, X, {
                onEof: () => {
                    !c && s === G && G.kill("SIGKILL")
                }
            }), G.on("exit", () => {
                be(new Error("grok ACP process exited"))
            })
        }, be = L => {
            c || (a && (r = a), a = null, d = null), $ = void 0, A = void 0, C = void 0, k = void 0, s = null;
            for (let G of l.values()) G.reject(L);
            l.clear()
        }, w = async () => {
            if (a) return a;
            if (d) return d;
            d = (async () => {
                Ee();
                let G = (await z("initialize", {
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
                    ee = G.authMethods ?? G.auth_methods,
                    we = ee?.find(at => at.id === "cached_token") ?? ee?.[0];
                if (we?.id && await z("authenticate", {
                        methodId: we.id,
                        _meta: {
                            headless: !0
                        }
                    }), await Ie(), r) {
                    let at = await b({
                            sessionId: r,
                            cwd: n,
                            mcpServers: [],
                            _meta: ne("load")
                        }),
                        Je = j(at);
                    if (Je !== r) throw new Error(`session/load did not resume ${r} (got ${String(Je)}); refusing to session/new`);
                    return a = Je, $ = l$(at) ?? $, fe(), a
                }
                let le = await z("session/new", {
                        cwd: n,
                        mcpServers: [],
                        _meta: ne("new")
                    }),
                    Be = (le.result ?? le).sessionId;
                if (typeof Be != "string" || Be.length === 0) throw new Error("session/new did not return sessionId");
                return a = Be, r = Be, $ = l$(le) ?? $, fe(), a
            })();
            try {
                return await d
            } catch (L) {
                throw d = null, await P(), L
            }
        }, P = async () => {
            if (c) return;
            c = !0, d = null, a = null, N(), g = null, y = void 0, W(), await ae();
            let L = s;
            if (s = null, !L) {
                c = !1;
                return
            }
            L.kill("SIGTERM"), await new Promise(G => {
                let ee = setTimeout(() => {
                    L.kill("SIGKILL"), G()
                }, 2e3);
                L.once("exit", () => {
                    clearTimeout(ee), G()
                })
            }), c = !1
        }, K = async L => {
            let G = await w();
            C = void 0;
            let ee = {
                sessionId: G,
                modelId: L.modelId
            };
            typeof L.reasoningEffort == "string" && (ee._meta = {
                reasoningEffort: L.reasoningEffort
            });
            let we = await z("session/set_model", ee);
            if ($ = _w(l$(we), L.modelId) ?? $, typeof L.reasoningEffort != "string") {
                A = void 0;
                return
            }
            let le = Kst(we) ?? C;
            if (le !== L.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${L.reasoningEffort}` + (le === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${le})`));
            A = L.reasoningEffort
        }, H = L => L instanceof Error ? L.message : String(L);
    return {
        connect: w,
        shutdown: P,
        currentModelId: () => $,
        hasSession: () => a !== null,
        setModel: K,
        compact: async () => {
            let L = new Date().toISOString();
            if (!a && !F) return {
                kind: "noop",
                runtime: "grok",
                reason: "session is not started yet — send a message first, then /compact",
                triggered_at: L
            };
            try {
                let G = await w();
                return await z(GROK_ACP_COMPACT, {
                    sessionId: G
                }, 0), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: L
                }
            } catch (G) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: H(G),
                    triggered_at: L
                }
            }
        },
        activeTurnId: () => I,
        activeTurnStartedAt: () => E,
        activeTurnSkipObserved: () => R,
        steerActiveTurn: async (L, G, ee) => {
            if (!a || I !== G) return !1;
            let we = await Yye(ee);
            if (!a || I !== G) return !1;
            let le = {
                sessionId: a,
                text: L
            };
            we.length > 0 && (le.content = [{
                type: "text",
                text: L
            }, ...we]);
            try {
                return await z(grokAcpExtMethod("interject"), le), !0
            } catch {
                return !1
            }
        },
        run: async L => {
            let G = await Vst(L.prompt),
                ee = await Yye(L.attachments),
                we = [...G.trim() ? [{
                    type: "text",
                    text: G
                }] : [], ...ee];
            if (we.length === 0) return {
                text: "",
                usage: void 0
            };
            if (h) throw new Error("grok adapter run() is already in flight for this session");
            h = !0;
            try {
                y = void 0, W(), J(L.systemPrompt);
                let le = await w();
                if (await ue(), L.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let ve = L.model,
                    Be = L.effort;
                if (ve || Be) {
                    let ke = ve ?? $;
                    if (Be && !ke) Z("grok effort re-apply skipped — no current model id", {
                        effort: Be
                    });
                    else if (ke && (!!(ve && ve !== $) || !!(Be && Be !== A))) try {
                        await K({
                            modelId: ke,
                            reasoningEffort: Be
                        })
                    } catch (Cn) {
                        let Ut = Cn instanceof Error ? Cn.message : String(Cn);
                        if (typeof Be == "string" && Ut.includes("reasoningEffort")) Z("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: ke,
                            effort: Be,
                            error: Ut
                        });
                        else throw Cn
                    }
                }
                let at = Date.now(),
                    Je, De = [];
                I = `grok-turn-${++D}`, E = at, R = !1, g = {
                    onStream: L.onStream,
                    onExecutionEvent: L.onExecutionEvent,
                    textParts: De,
                    markFirstToken: () => {
                        Je === void 0 && (Je = Date.now() - at)
                    }
                };
                let Oe = () => {
                    let ke = sg(L.abortController?.signal.reason);
                    ke && (S = {
                        reason: ke,
                        toolInFlight: x.size > 0
                    }), N();
                    try {
                        M({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: le
                            }
                        })
                    } catch {}
                };
                L.abortController?.signal.addEventListener("abort", Oe, {
                    once: !0
                });
                let Gt = V();
                Gt && we.unshift({
                    type: "text",
                    text: Gt
                });
                try {
                    L.onTurnAcknowledged?.();
                    let ke = await z("session/prompt", {
                        sessionId: le,
                        prompt: we
                    }, o, L.abortController?.signal);
                    if (L.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let qe = ke.result ?? ke;
                    return {
                        sessionId: le,
                        text: De.join(""),
                        usage: mapGrokUsageToDrainUsage(qe),
                        firstTokenLatencyMs: Je
                    }
                } catch (ke) {
                    if (ke instanceof AgentSdkTurnInterruptedError) throw ke;
                    if (L.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        M({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: le
                            }
                        })
                    } catch {}
                    throw ke
                } finally {
                    L.abortController?.signal.removeEventListener("abort", Oe), y = s && L.abortController?.signal.aborted ? L.onStream : void 0, g = null, N()
                }
            } finally {
                h = !1
            }
        }
    }
}
