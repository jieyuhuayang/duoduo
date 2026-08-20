// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: createGrokAcpAdapter  (minified: zb, daemon.pretty.js:60104)
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
        p = zXe(),
        f = null,
        m = null,
        h = null,
        y = !1,
        _ = null,
        k, v = !1,
        b = async X => {
            v = !0;
            try {
                return await qe("session/load", X)
            } finally {
                v = !1
            }
        }, I = [], T, S, w = !1, C = 0, O, A, x, P, M, j = () => {
            T = void 0, S = void 0, w = !1
        }, H = () => {
            let X = I.join("");
            I.length = 0, X && Promise.resolve(e.onDetachedTurn?.({
                text: X
            })).catch(Q => {
                Z("grok detached-turn sink failed", {
                    error: Q instanceof Error ? Q.message : String(Q)
                })
            })
        };
    h = X => {
        if (v) return;
        let Q = $r(X.params),
            fe = $r(Q.update),
            ve = String(fe.sessionUpdate ?? "");
        if (ve === "agent_message_chunk") {
            let me = qI(fe.content);
            if (!me) return;
            if (_) {
                _.markFirstToken(), _.textParts.push(me), _.onStream?.(me);
                return
            }
            if (k) {
                k(me);
                return
            }
            I.push(me);
            return
        }
        if (ve === "turn_completed") {
            _ || H();
            return
        }
        if (_) {
            if (ve === "agent_thought_chunk") {
                let me = qI(fe.content);
                me && _.onExecutionEvent?.({
                    type: "thought_chunk",
                    text: me
                });
                return
            }
            if (ve === "tool_call") {
                let me = String(fe.toolCallId ?? fe.tool_call_id ?? ""),
                    Bt = KXe(fe);
                if (!me) return;
                YXe(fe) && (w = !0), _.onExecutionEvent?.({
                    type: "tool_use",
                    toolUseId: me,
                    toolName: Bt,
                    input: fe.rawInput ?? fe.raw_input ?? {}
                });
                return
            }
            if (ve === "tool_call_update") {
                let me = String(fe.status ?? "");
                if (me !== "completed" && me !== "failed") return;
                let Bt = String(fe.toolCallId ?? fe.tool_call_id ?? "");
                if (!Bt) return;
                _.onExecutionEvent?.({
                    type: "tool_result",
                    toolUseId: Bt,
                    isError: me === "failed",
                    summary: qI(fe.content) || me
                })
            }
        }
    };
    let ee = X => {
            if (typeof X == "string") {
                P = {
                    mode: "override",
                    layers: X
                };
                return
            }
            P = {
                mode: "append",
                layers: X?.append ?? ""
            }
        },
        ie = X => {
            let Q = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return e.mcpServerFactory && (Q[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: p
            }]), P ? P.mode === "override" ? (Q.systemPromptOverride = P.layers, Q) : (X === "new" && P.layers.length > 0 && (Q.rules = P.layers), Q) : Q
        },
        re = () => {
            P?.mode === "override" && (M = P.layers)
        },
        Ye = X => {
            let Q = X.result ?? X,
                fe = Q._meta ?? {};
            return typeof Q.sessionId == "string" && Q.sessionId || typeof fe.sessionId == "string" && fe.sessionId || void 0
        },
        je = async () => {
            if (!a || P?.mode !== "override" || M === P.layers) return;
            let X = await b({
                    sessionId: a,
                    cwd: n,
                    mcpServers: [],
                    _meta: ie("load")
                }),
                Q = Ye(X);
            if (Q !== void 0 && Q !== a) throw new Error(`session/load did not resume ${a} (got ${String(Q)}); refusing to fork`);
            O = UI(X) ?? O, re()
        }, Se = async () => {
            !e.mcpServerFactory || f || (m = e.mcpServerFactory(), f = new C2, await m.instance.connect(f))
        }, lt = async () => {
            let X = f,
                Q = m;
            f = null, m = null;
            try {
                await X?.close()
            } catch {}
            try {
                await Q?.instance.close()
            } catch {}
        }, Fe = X => {
            if (!s?.stdin.writable) throw new Error("grok ACP stdin is closed");
            s.stdin.write(`${JSON.stringify(X)}
`)
        }, qe = (X, Q, fe = 3e4, ve) => {
            if (!s) return Promise.reject(new Error("grok ACP process is not running"));
            if (ve?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let me = l++;
            return Fe({
                jsonrpc: "2.0",
                id: me,
                method: X,
                params: Q
            }), new Promise((Bt, tt) => {
                let Yt = !1,
                    St = fe > 0 ? setTimeout(() => {
                        Ze(() => tt(new Error(`${X} timed out after ${fe}ms`)))
                    }, fe) : void 0,
                    Qn = () => {
                        Ze(() => tt(new AgentSdkTurnInterruptedError))
                    },
                    Ze = it => {
                        Yt || (Yt = !0, u.delete(me), St && clearTimeout(St), ve?.removeEventListener("abort", Qn), it())
                    };
                ve?.addEventListener("abort", Qn, {
                    once: !0
                }), u.set(me, {
                    resolve: it => Ze(() => Bt(it)),
                    reject: it => Ze(() => tt(it))
                })
            })
        }, F = async (X, Q) => {
            let fe = Bt => {
                try {
                    Fe({
                        jsonrpc: "2.0",
                        id: X,
                        ...Bt
                    })
                } catch {}
            };
            if (!f) {
                fe({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let ve = Q ?? {};
            if (ve.serverId !== p) {
                fe({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let me = ve.message;
            if (typeof me == "string") try {
                me = JSON.parse(me)
            } catch {
                fe({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!me || typeof me != "object") {
                fe({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let Bt = await f.dispatch(me);
                fe({
                    result: Bt
                })
            } catch (Bt) {
                fe({
                    error: {
                        code: -32603,
                        message: Bt instanceof Error ? Bt.message : String(Bt)
                    }
                })
            }
        }, L = X => {
            try {
                let Q = X.trim();
                if (!Q) return;
                let fe;
                try {
                    fe = JSON.parse(Q)
                } catch {
                    return
                }
                if (typeof fe.method == "string" && fe.id !== void 0) {
                    if (JXe(fe.method)) {
                        Ae(`grok ACP ${fe.method}`), F(fe.id, fe.params);
                        return
                    }
                    Fe({
                        jsonrpc: "2.0",
                        id: fe.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${fe.method}`
                        }
                    });
                    return
                }
                if (typeof fe.method == "string") {
                    let ve = $r(fe.params),
                        me = ume(ve.update) ?? (eQe(fe.method) ? ume(ve.update) : null);
                    me && (me.modelId && (O = me.modelId), A = me.reasoningEffort), QXe(fe.method) && h?.(fe), e.onNotification?.(fe.method), Ae(`grok ACP notification ${fe.method}`);
                    return
                }
                if (typeof fe.id == "number") {
                    let ve = u.get(fe.id);
                    if (!ve) return;
                    u.delete(fe.id), fe.error ? ve.reject(new Error(JSON.stringify(fe.error))) : ve.resolve(fe)
                }
            } catch {}
        }, B = () => {
            if (s) return;
            let X = {
                ...process.env,
                ...i
            };
            delete X.GROK_HOME;
            let Q = UXe(t, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd: n,
                env: X,
                stdio: ["pipe", "pipe", "pipe"]
            });
            s = Q, Q.stderr.resume(), Q.on("error", ve => {
                te(ve)
            }), Ae(`grok ACP spawn pid=${Q.pid??"unknown"}`), BXe({
                input: Q.stdout
            }).on("line", L), Q.on("exit", () => {
                te(new Error("grok ACP process exited"))
            })
        }, te = X => {
            c || (a && (r = a), a = null, d = null), O = void 0, x = void 0, A = void 0, M = void 0, s = null;
            for (let Q of u.values()) Q.reject(X);
            u.clear()
        }, Le = async () => {
            if (a) return a;
            if (d) return d;
            d = (async () => {
                B();
                let Q = (await qe("initialize", {
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
                    fe = Q.authMethods ?? Q.auth_methods,
                    ve = fe?.find(Yt => Yt.id === "cached_token") ?? fe?.[0];
                if (ve?.id && await qe("authenticate", {
                        methodId: ve.id,
                        _meta: {
                            headless: !0
                        }
                    }), await Se(), r) {
                    let Yt = await b({
                            sessionId: r,
                            cwd: n,
                            mcpServers: [],
                            _meta: ie("load")
                        }),
                        St = Ye(Yt);
                    if (St !== r) throw new Error(`session/load did not resume ${r} (got ${String(St)}); refusing to session/new`);
                    return a = St, O = UI(Yt) ?? O, re(), a
                }
                let me = await qe("session/new", {
                        cwd: n,
                        mcpServers: [],
                        _meta: ie("new")
                    }),
                    tt = (me.result ?? me).sessionId;
                if (typeof tt != "string" || tt.length === 0) throw new Error("session/new did not return sessionId");
                return a = tt, r = tt, O = UI(me) ?? O, re(), a
            })();
            try {
                return await d
            } catch (X) {
                throw d = null, await Re(), X
            }
        }, Re = async () => {
            if (c) return;
            c = !0, d = null, a = null, j(), _ = null, k = void 0, H(), h = null, await lt();
            let X = s;
            if (s = null, !X) {
                c = !1;
                return
            }
            X.kill("SIGTERM"), await new Promise(Q => {
                let fe = setTimeout(() => {
                    X.kill("SIGKILL"), Q()
                }, 2e3);
                X.once("exit", () => {
                    clearTimeout(fe), Q()
                })
            }), c = !1
        }, We = async X => {
            let Q = await Le();
            A = void 0;
            let fe = {
                sessionId: Q,
                modelId: X.modelId
            };
            typeof X.reasoningEffort == "string" && (fe._meta = {
                reasoningEffort: X.reasoningEffort
            });
            let ve = await qe("session/set_model", fe);
            if (O = Fb(UI(ve), X.modelId) ?? O, typeof X.reasoningEffort != "string") {
                x = void 0;
                return
            }
            let me = tQe(ve) ?? A;
            if (me !== X.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${X.reasoningEffort}` + (me === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${me})`));
            x = X.reasoningEffort
        }, Be = X => X instanceof Error ? X.message : String(X);
    return {
        connect: Le,
        shutdown: Re,
        currentModelId: () => O,
        hasSession: () => a !== null,
        setModel: We,
        compact: async () => {
            let X = new Date().toISOString();
            if (!a) return {
                kind: "noop",
                runtime: "grok",
                reason: "no history yet",
                triggered_at: X
            };
            try {
                let Q = await Le();
                return await qe(GROK_ACP_COMPACT, {
                    sessionId: Q
                }), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: X
                }
            } catch (Q) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: Be(Q),
                    triggered_at: X
                }
            }
        },
        undo: async X => {
            let Q = new Date().toISOString();
            if (!Number.isInteger(X.numTurns) || X.numTurns < 1) return {
                kind: "noop",
                runtime: "grok",
                reason: `invalid numTurns: ${X.numTurns}`,
                triggered_at: Q
            };
            if (!a) return {
                kind: "noop",
                runtime: "grok",
                reason: "no history yet",
                triggered_at: Q
            };
            try {
                let fe = await Le(),
                    ve = await qe(GROK_ACP_REWIND_POINTS, {
                        sessionId: fe
                    }),
                    me = pickGrokRewindPromptIndex(parseGrokRewindPoints(ve), X.numTurns);
                return me === null ? {
                    kind: "noop",
                    runtime: "grok",
                    reason: `not enough rewind points to drop ${X.numTurns} turn(s)`,
                    triggered_at: Q
                } : (await qe(GROK_ACP_REWIND_EXECUTE, {
                    sessionId: fe,
                    targetPromptIndex: me
                }), {
                    kind: "succeeded",
                    runtime: "grok",
                    newSessionId: fe,
                    sessionIdChanged: !1,
                    droppedTurns: X.numTurns,
                    triggered_at: Q
                })
            } catch (fe) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: Be(fe),
                    triggered_at: Q
                }
            }
        },
        activeTurnId: () => T,
        activeTurnStartedAt: () => S,
        activeTurnSkipObserved: () => w,
        steerActiveTurn: async (X, Q, fe) => {
            if (!a || T !== Q) return !1;
            let ve = await lme(fe);
            if (!a || T !== Q) return !1;
            let me = {
                sessionId: a,
                text: X
            };
            ve.length > 0 && (me.content = [{
                type: "text",
                text: X
            }, ...ve]);
            try {
                return await qe(grokAcpExtMethod("interject"), me), !0
            } catch {
                return !1
            }
        },
        run: async X => {
            let Q = await ZXe(X.prompt),
                fe = await lme(X.attachments),
                ve = [...Q.trim() ? [{
                    type: "text",
                    text: Q
                }] : [], ...fe];
            if (ve.length === 0) return {
                text: "",
                usage: void 0
            };
            if (y) throw new Error("grok adapter run() is already in flight for this session");
            y = !0;
            try {
                k = void 0, H(), ee(X.systemPrompt);
                let me = await Le();
                if (await je(), X.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let Bt = X.model,
                    tt = X.effort;
                if (Bt || tt) {
                    let it = Bt ?? O;
                    if (tt && !it) Z("grok effort re-apply skipped — no current model id", {
                        effort: tt
                    });
                    else if (it && (!!(Bt && Bt !== O) || !!(tt && tt !== x))) try {
                        await We({
                            modelId: it,
                            reasoningEffort: tt
                        })
                    } catch (xi) {
                        let g = xi instanceof Error ? xi.message : String(xi);
                        if (typeof tt == "string" && g.includes("reasoningEffort")) Z("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: it,
                            effort: tt,
                            error: g
                        });
                        else throw xi
                    }
                }
                let Yt = Date.now(),
                    St, Qn = [];
                T = `grok-turn-${++C}`, S = Yt, w = !1, _ = {
                    onStream: X.onStream,
                    onExecutionEvent: X.onExecutionEvent,
                    textParts: Qn,
                    markFirstToken: () => {
                        St === void 0 && (St = Date.now() - Yt)
                    }
                };
                let Ze = () => {
                    j();
                    try {
                        Fe({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: me
                            }
                        })
                    } catch {}
                };
                X.abortController?.signal.addEventListener("abort", Ze, {
                    once: !0
                });
                try {
                    X.onTurnAcknowledged?.();
                    let it = await qe("session/prompt", {
                        sessionId: me,
                        prompt: ve
                    }, o, X.abortController?.signal);
                    if (X.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let sn = it.result ?? it;
                    return {
                        sessionId: me,
                        text: Qn.join(""),
                        usage: XXe(sn),
                        firstTokenLatencyMs: St
                    }
                } catch (it) {
                    if (it instanceof AgentSdkTurnInterruptedError) throw it;
                    if (X.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        Fe({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: me
                            }
                        })
                    } catch {}
                    throw it
                } finally {
                    X.abortController?.signal.removeEventListener("abort", Ze), k = X.abortController?.signal.aborted ? X.onStream : void 0, _ = null, j()
                }
            } finally {
                y = !1
            }
        }
    }
}
