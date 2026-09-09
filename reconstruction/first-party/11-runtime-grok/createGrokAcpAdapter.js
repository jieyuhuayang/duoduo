// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: createGrokAcpAdapter  (minified: iv, daemon.pretty.js:57852)
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
        l = 1,
        u = new Map,
        c = !1,
        d = null,
        p = Eet(),
        f = null,
        m = null,
        h = !1,
        g = null,
        y, w = !1,
        v = async _ => {
            w = !0;
            try {
                return await pe("session/load", _)
            } finally {
                w = !1
            }
        }, b = [], I, T, P = !1, k = 0, S, D, $, C, O, j = () => {
            I = void 0, T = void 0, P = !1
        }, x = () => {
            let _ = b.join("");
            b.length = 0, _ && Promise.resolve(e.onDetachedTurn?.({
                text: _
            })).catch(E => {
                W("grok detached-turn sink failed", {
                    error: E instanceof Error ? E.message : String(E)
                })
            })
        }, F = _ => {
            if (!s || w) return;
            let E = Ei(_.params),
                N = Ei(E.update),
                K = String(N.sessionUpdate ?? "");
            if (K === "agent_message_chunk") {
                let B = fP(N.content);
                if (!B) return;
                if (g) {
                    g.markFirstToken(), g.textParts.push(B), g.onStream?.(B);
                    return
                }
                if (y) {
                    y(B);
                    return
                }
                b.push(B);
                return
            }
            if (K === "turn_completed") {
                g || x();
                return
            }
            if (g) {
                if (K === "agent_thought_chunk") {
                    let B = fP(N.content);
                    B && g.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: B
                    });
                    return
                }
                if (K === "tool_call") {
                    let B = String(N.toolCallId ?? N.tool_call_id ?? ""),
                        se = Det(N);
                    if (!B) return;
                    Met(N) && (P = !0), g.onExecutionEvent?.({
                        type: "tool_use",
                        toolUseId: B,
                        toolName: se,
                        input: N.rawInput ?? N.raw_input ?? {}
                    });
                    return
                }
                if (K === "tool_call_update") {
                    let B = String(N.status ?? "");
                    if (B !== "completed" && B !== "failed") return;
                    let se = String(N.toolCallId ?? N.tool_call_id ?? "");
                    if (!se) return;
                    g.onExecutionEvent?.({
                        type: "tool_result",
                        toolUseId: se,
                        isError: B === "failed",
                        summary: fP(N.content) || B
                    })
                }
            }
        }, q = _ => {
            if (typeof _ == "string") {
                C = {
                    mode: "override",
                    layers: _
                };
                return
            }
            C = {
                mode: "append",
                layers: _?.append ?? ""
            }
        }, J = _ => {
            let E = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return e.mcpServerFactory && (E[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: p
            }]), C ? C.mode === "override" ? (E.systemPromptOverride = C.layers, E) : (_ === "new" && C.layers.length > 0 && (E.rules = C.layers), E) : E
        }, le = () => {
            C?.mode === "override" && (O = C.layers)
        }, oe = _ => {
            let E = _.result ?? _,
                N = E._meta ?? {};
            return typeof E.sessionId == "string" && E.sessionId || typeof N.sessionId == "string" && N.sessionId || void 0
        }, X = async () => {
            if (!a || C?.mode !== "override" || O === C.layers) return;
            let _ = await v({
                    sessionId: a,
                    cwd: n,
                    mcpServers: [],
                    _meta: J("load")
                }),
                E = oe(_);
            if (E !== void 0 && E !== a) throw new Error(`session/load did not resume ${a} (got ${String(E)}); refusing to fork`);
            S = dP(_) ?? S, le()
        }, te = async () => {
            !e.mcpServerFactory || f || (m = e.mcpServerFactory(), f = new X2, await m.instance.connect(f))
        }, z = async () => {
            let _ = f,
                E = m;
            f = null, m = null;
            try {
                await _?.close()
            } catch {}
            try {
                await E?.instance.close()
            } catch {}
        }, V = _ => {
            if (!s?.stdin.writable) throw new Error("grok ACP stdin is closed");
            s.stdin.write(`${JSON.stringify(_)}
`)
        }, pe = (_, E, N = 3e4, K) => {
            if (!s) return Promise.reject(new Error("grok ACP process is not running"));
            if (K?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let B = l++;
            return V({
                jsonrpc: "2.0",
                id: B,
                method: _,
                params: E
            }), new Promise((se, me) => {
                let be = !1,
                    De = N > 0 ? setTimeout(() => {
                        $t(() => me(new Error(`${_} timed out after ${N}ms`)))
                    }, N) : void 0,
                    Be = () => {
                        $t(() => me(new AgentSdkTurnInterruptedError))
                    },
                    $t = ot => {
                        be || (be = !0, u.delete(B), De && clearTimeout(De), K?.removeEventListener("abort", Be), ot())
                    };
                K?.addEventListener("abort", Be, {
                    once: !0
                }), u.set(B, {
                    resolve: ot => $t(() => se(ot)),
                    reject: ot => $t(() => me(ot))
                })
            })
        }, ae = async (_, E) => {
            let N = se => {
                try {
                    V({
                        jsonrpc: "2.0",
                        id: _,
                        ...se
                    })
                } catch {}
            };
            if (!f) {
                N({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let K = E ?? {};
            if (K.serverId !== p) {
                N({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let B = K.message;
            if (typeof B == "string") try {
                B = JSON.parse(B)
            } catch {
                N({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!B || typeof B != "object") {
                N({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let se = await f.dispatch(B);
                N({
                    result: se
                })
            } catch (se) {
                N({
                    error: {
                        code: -32603,
                        message: se instanceof Error ? se.message : String(se)
                    }
                })
            }
        }, L = _ => {
            try {
                let E = _.trim();
                if (!E) return;
                let N;
                try {
                    N = JSON.parse(E)
                } catch {
                    return
                }
                if (typeof N.method == "string" && N.id !== void 0) {
                    if ($et(N.method)) {
                        ke(`grok ACP ${N.method}`), ae(N.id, N.params);
                        return
                    }
                    V({
                        jsonrpc: "2.0",
                        id: N.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${N.method}`
                        }
                    });
                    return
                }
                if (typeof N.method == "string") {
                    let K = Ei(N.params),
                        B = zet(K.update);
                    B && (B.modelId && (S = B.modelId), D = B.reasoningEffort), Let(N.method) && F(N), e.onNotification?.(N.method), ke(`grok ACP notification ${N.method}`);
                    return
                }
                if (typeof N.id == "number") {
                    let K = u.get(N.id);
                    if (!K) return;
                    u.delete(N.id), N.error ? K.reject(new Error(JSON.stringify(N.error))) : K.resolve(N)
                }
            } catch {}
        }, M = () => {
            if (s) return;
            let _ = {
                ...process.env,
                ...i
            };
            delete _.GROK_HOME;
            let E = Ret(t, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd: n,
                env: _,
                stdio: ["pipe", "pipe", "pipe"]
            });
            s = E, E.stderr.resume(), E.on("error", N => {
                U(N)
            }), ke(`grok ACP spawn pid=${E.pid??"unknown"}`), gu(E.stdout, L, {
                onEof: () => {
                    !c && s === E && E.kill("SIGKILL")
                }
            }), E.on("exit", () => {
                U(new Error("grok ACP process exited"))
            })
        }, U = _ => {
            c || (a && (r = a), a = null, d = null), S = void 0, $ = void 0, D = void 0, O = void 0, s = null;
            for (let E of u.values()) E.reject(_);
            u.clear()
        }, G = async () => {
            if (a) return a;
            if (d) return d;
            d = (async () => {
                M();
                let E = (await pe("initialize", {
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
                    N = E.authMethods ?? E.auth_methods,
                    K = N?.find(be => be.id === "cached_token") ?? N?.[0];
                if (K?.id && await pe("authenticate", {
                        methodId: K.id,
                        _meta: {
                            headless: !0
                        }
                    }), await te(), r) {
                    let be = await v({
                            sessionId: r,
                            cwd: n,
                            mcpServers: [],
                            _meta: J("load")
                        }),
                        De = oe(be);
                    if (De !== r) throw new Error(`session/load did not resume ${r} (got ${String(De)}); refusing to session/new`);
                    return a = De, S = dP(be) ?? S, le(), a
                }
                let B = await pe("session/new", {
                        cwd: n,
                        mcpServers: [],
                        _meta: J("new")
                    }),
                    me = (B.result ?? B).sessionId;
                if (typeof me != "string" || me.length === 0) throw new Error("session/new did not return sessionId");
                return a = me, r = me, S = dP(B) ?? S, le(), a
            })();
            try {
                return await d
            } catch (_) {
                throw d = null, await ne(), _
            }
        }, ne = async () => {
            if (c) return;
            c = !0, d = null, a = null, j(), g = null, y = void 0, x(), await z();
            let _ = s;
            if (s = null, !_) {
                c = !1;
                return
            }
            _.kill("SIGTERM"), await new Promise(E => {
                let N = setTimeout(() => {
                    _.kill("SIGKILL"), E()
                }, 2e3);
                _.once("exit", () => {
                    clearTimeout(N), E()
                })
            }), c = !1
        }, Q = async _ => {
            let E = await G();
            D = void 0;
            let N = {
                sessionId: E,
                modelId: _.modelId
            };
            typeof _.reasoningEffort == "string" && (N._meta = {
                reasoningEffort: _.reasoningEffort
            });
            let K = await pe("session/set_model", N);
            if (S = nv(dP(K), _.modelId) ?? S, typeof _.reasoningEffort != "string") {
                $ = void 0;
                return
            }
            let B = Fet(K) ?? D;
            if (B !== _.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${_.reasoningEffort}` + (B === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${B})`));
            $ = _.reasoningEffort
        }, Ae = _ => _ instanceof Error ? _.message : String(_);
    return {
        connect: G,
        shutdown: ne,
        currentModelId: () => S,
        hasSession: () => a !== null,
        setModel: Q,
        compact: async () => {
            let _ = new Date().toISOString();
            if (!a && !C) return {
                kind: "noop",
                runtime: "grok",
                reason: "session is not started yet — send a message first, then /compact",
                triggered_at: _
            };
            try {
                let E = await G();
                return await pe(GROK_ACP_COMPACT, {
                    sessionId: E
                }, 0), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: _
                }
            } catch (E) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: Ae(E),
                    triggered_at: _
                }
            }
        },
        activeTurnId: () => I,
        activeTurnStartedAt: () => T,
        activeTurnSkipObserved: () => P,
        steerActiveTurn: async (_, E, N) => {
            if (!a || I !== E) return !1;
            let K = await eme(N);
            if (!a || I !== E) return !1;
            let B = {
                sessionId: a,
                text: _
            };
            K.length > 0 && (B.content = [{
                type: "text",
                text: _
            }, ...K]);
            try {
                return await pe(grokAcpExtMethod("interject"), B), !0
            } catch {
                return !1
            }
        },
        run: async _ => {
            let E = await Aet(_.prompt),
                N = await eme(_.attachments),
                K = [...E.trim() ? [{
                    type: "text",
                    text: E
                }] : [], ...N];
            if (K.length === 0) return {
                text: "",
                usage: void 0
            };
            if (h) throw new Error("grok adapter run() is already in flight for this session");
            h = !0;
            try {
                y = void 0, x(), q(_.systemPrompt);
                let B = await G();
                if (await X(), _.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let se = _.model,
                    me = _.effort;
                if (se || me) {
                    let ot = se ?? S;
                    if (me && !ot) W("grok effort re-apply skipped — no current model id", {
                        effort: me
                    });
                    else if (ot && (!!(se && se !== S) || !!(me && me !== $))) try {
                        await Q({
                            modelId: ot,
                            reasoningEffort: me
                        })
                    } catch (et) {
                        let Ie = et instanceof Error ? et.message : String(et);
                        if (typeof me == "string" && Ie.includes("reasoningEffort")) W("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: ot,
                            effort: me,
                            error: Ie
                        });
                        else throw et
                    }
                }
                let be = Date.now(),
                    De, Be = [];
                I = `grok-turn-${++k}`, T = be, P = !1, g = {
                    onStream: _.onStream,
                    onExecutionEvent: _.onExecutionEvent,
                    textParts: Be,
                    markFirstToken: () => {
                        De === void 0 && (De = Date.now() - be)
                    }
                };
                let $t = () => {
                    j();
                    try {
                        V({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: B
                            }
                        })
                    } catch {}
                };
                _.abortController?.signal.addEventListener("abort", $t, {
                    once: !0
                });
                try {
                    _.onTurnAcknowledged?.();
                    let ot = await pe("session/prompt", {
                        sessionId: B,
                        prompt: K
                    }, o, _.abortController?.signal);
                    if (_.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let Gt = ot.result ?? ot;
                    return {
                        sessionId: B,
                        text: Be.join(""),
                        usage: jet(Gt),
                        firstTokenLatencyMs: De
                    }
                } catch (ot) {
                    if (ot instanceof AgentSdkTurnInterruptedError) throw ot;
                    if (_.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        V({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: B
                            }
                        })
                    } catch {}
                    throw ot
                } finally {
                    _.abortController?.signal.removeEventListener("abort", $t), y = s && _.abortController?.signal.aborted ? _.onStream : void 0, g = null, j()
                }
            } finally {
                h = !1
            }
        }
    }
}
