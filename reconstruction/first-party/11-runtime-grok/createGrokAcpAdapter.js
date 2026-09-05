// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: createGrokAcpAdapter  (minified: Bb, daemon.pretty.js:57312)
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
        p = GXe(),
        f = null,
        m = null,
        h = !1,
        g = null,
        y, w = !1,
        v = async _ => {
            w = !0;
            try {
                return await fe("session/load", _)
            } finally {
                w = !1
            }
        }, b = [], R, I, T = !1, x = 0, S, O, $, C, A, j = () => {
            R = void 0, I = void 0, T = !1
        }, P = () => {
            let _ = b.join("");
            b.length = 0, _ && Promise.resolve(e.onDetachedTurn?.({
                text: _
            })).catch(k => {
                J("grok detached-turn sink failed", {
                    error: k instanceof Error ? k.message : String(k)
                })
            })
        }, z = _ => {
            if (!s || w) return;
            let k = fi(_.params),
                M = fi(k.update),
                Y = String(M.sessionUpdate ?? "");
            if (Y === "agent_message_chunk") {
                let q = ZI(M.content);
                if (!q) return;
                if (g) {
                    g.markFirstToken(), g.textParts.push(q), g.onStream?.(q);
                    return
                }
                if (y) {
                    y(q);
                    return
                }
                b.push(q);
                return
            }
            if (Y === "turn_completed") {
                g || P();
                return
            }
            if (g) {
                if (Y === "agent_thought_chunk") {
                    let q = ZI(M.content);
                    q && g.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: q
                    });
                    return
                }
                if (Y === "tool_call") {
                    let q = String(M.toolCallId ?? M.tool_call_id ?? ""),
                        se = iQe(M);
                    if (!q) return;
                    oQe(M) && (T = !0), g.onExecutionEvent?.({
                        type: "tool_use",
                        toolUseId: q,
                        toolName: se,
                        input: M.rawInput ?? M.raw_input ?? {}
                    });
                    return
                }
                if (Y === "tool_call_update") {
                    let q = String(M.status ?? "");
                    if (q !== "completed" && q !== "failed") return;
                    let se = String(M.toolCallId ?? M.tool_call_id ?? "");
                    if (!se) return;
                    g.onExecutionEvent?.({
                        type: "tool_result",
                        toolUseId: se,
                        isError: q === "failed",
                        summary: ZI(M.content) || q
                    })
                }
            }
        }, U = _ => {
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
        }, K = _ => {
            let k = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return e.mcpServerFactory && (k[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: p
            }]), C ? C.mode === "override" ? (k.systemPromptOverride = C.layers, k) : (_ === "new" && C.layers.length > 0 && (k.rules = C.layers), k) : k
        }, te = () => {
            C?.mode === "override" && (A = C.layers)
        }, V = _ => {
            let k = _.result ?? _,
                M = k._meta ?? {};
            return typeof k.sessionId == "string" && k.sessionId || typeof M.sessionId == "string" && M.sessionId || void 0
        }, re = async () => {
            if (!a || C?.mode !== "override" || A === C.layers) return;
            let _ = await v({
                    sessionId: a,
                    cwd: n,
                    mcpServers: [],
                    _meta: K("load")
                }),
                k = V(_);
            if (k !== void 0 && k !== a) throw new Error(`session/load did not resume ${a} (got ${String(k)}); refusing to fork`);
            S = GI(_) ?? S, te()
        }, X = async () => {
            !e.mcpServerFactory || f || (m = e.mcpServerFactory(), f = new w2, await m.instance.connect(f))
        }, L = async () => {
            let _ = f,
                k = m;
            f = null, m = null;
            try {
                await _?.close()
            } catch {}
            try {
                await k?.instance.close()
            } catch {}
        }, ie = _ => {
            if (!s?.stdin.writable) throw new Error("grok ACP stdin is closed");
            s.stdin.write(`${JSON.stringify(_)}
`)
        }, fe = (_, k, M = 3e4, Y) => {
            if (!s) return Promise.reject(new Error("grok ACP process is not running"));
            if (Y?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let q = l++;
            return ie({
                jsonrpc: "2.0",
                id: q,
                method: _,
                params: k
            }), new Promise((se, ve) => {
                let Se = !1,
                    He = M > 0 ? setTimeout(() => {
                        pt(() => ve(new Error(`${_} timed out after ${M}ms`)))
                    }, M) : void 0,
                    it = () => {
                        pt(() => ve(new AgentSdkTurnInterruptedError))
                    },
                    pt = Ae => {
                        Se || (Se = !0, u.delete(q), He && clearTimeout(He), Y?.removeEventListener("abort", it), Ae())
                    };
                Y?.addEventListener("abort", it, {
                    once: !0
                }), u.set(q, {
                    resolve: Ae => pt(() => se(Ae)),
                    reject: Ae => pt(() => ve(Ae))
                })
            })
        }, _e = async (_, k) => {
            let M = se => {
                try {
                    ie({
                        jsonrpc: "2.0",
                        id: _,
                        ...se
                    })
                } catch {}
            };
            if (!f) {
                M({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let Y = k ?? {};
            if (Y.serverId !== p) {
                M({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let q = Y.message;
            if (typeof q == "string") try {
                q = JSON.parse(q)
            } catch {
                M({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!q || typeof q != "object") {
                M({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let se = await f.dispatch(q);
                M({
                    result: se
                })
            } catch (se) {
                M({
                    error: {
                        code: -32603,
                        message: se instanceof Error ? se.message : String(se)
                    }
                })
            }
        }, D = _ => {
            try {
                let k = _.trim();
                if (!k) return;
                let M;
                try {
                    M = JSON.parse(k)
                } catch {
                    return
                }
                if (typeof M.method == "string" && M.id !== void 0) {
                    if (tQe(M.method)) {
                        ke(`grok ACP ${M.method}`), _e(M.id, M.params);
                        return
                    }
                    ie({
                        jsonrpc: "2.0",
                        id: M.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${M.method}`
                        }
                    });
                    return
                }
                if (typeof M.method == "string") {
                    let Y = fi(M.params),
                        q = uQe(Y.update);
                    q && (q.modelId && (S = q.modelId), O = q.reasoningEffort), aQe(M.method) && z(M), e.onNotification?.(M.method), ke(`grok ACP notification ${M.method}`);
                    return
                }
                if (typeof M.id == "number") {
                    let Y = u.get(M.id);
                    if (!Y) return;
                    u.delete(M.id), M.error ? Y.reject(new Error(JSON.stringify(M.error))) : Y.resolve(M)
                }
            } catch {}
        }, B = () => {
            if (s) return;
            let _ = {
                ...process.env,
                ...i
            };
            delete _.GROK_HOME;
            let k = ZXe(t, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd: n,
                env: _,
                stdio: ["pipe", "pipe", "pipe"]
            });
            s = k, k.stderr.resume(), k.on("error", M => {
                F(M)
            }), ke(`grok ACP spawn pid=${k.pid??"unknown"}`), iu(k.stdout, D, {
                onEof: () => {
                    !c && s === k && k.kill("SIGKILL")
                }
            }), k.on("exit", () => {
                F(new Error("grok ACP process exited"))
            })
        }, F = _ => {
            c || (a && (r = a), a = null, d = null), S = void 0, $ = void 0, O = void 0, A = void 0, s = null;
            for (let k of u.values()) k.reject(_);
            u.clear()
        }, W = async () => {
            if (a) return a;
            if (d) return d;
            d = (async () => {
                B();
                let k = (await fe("initialize", {
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
                    M = k.authMethods ?? k.auth_methods,
                    Y = M?.find(Se => Se.id === "cached_token") ?? M?.[0];
                if (Y?.id && await fe("authenticate", {
                        methodId: Y.id,
                        _meta: {
                            headless: !0
                        }
                    }), await X(), r) {
                    let Se = await v({
                            sessionId: r,
                            cwd: n,
                            mcpServers: [],
                            _meta: K("load")
                        }),
                        He = V(Se);
                    if (He !== r) throw new Error(`session/load did not resume ${r} (got ${String(He)}); refusing to session/new`);
                    return a = He, S = GI(Se) ?? S, te(), a
                }
                let q = await fe("session/new", {
                        cwd: n,
                        mcpServers: [],
                        _meta: K("new")
                    }),
                    ve = (q.result ?? q).sessionId;
                if (typeof ve != "string" || ve.length === 0) throw new Error("session/new did not return sessionId");
                return a = ve, r = ve, S = GI(q) ?? S, te(), a
            })();
            try {
                return await d
            } catch (_) {
                throw d = null, await ye(), _
            }
        }, ye = async () => {
            if (c) return;
            c = !0, d = null, a = null, j(), g = null, y = void 0, P(), await L();
            let _ = s;
            if (s = null, !_) {
                c = !1;
                return
            }
            _.kill("SIGTERM"), await new Promise(k => {
                let M = setTimeout(() => {
                    _.kill("SIGKILL"), k()
                }, 2e3);
                _.once("exit", () => {
                    clearTimeout(M), k()
                })
            }), c = !1
        }, ge = async _ => {
            let k = await W();
            O = void 0;
            let M = {
                sessionId: k,
                modelId: _.modelId
            };
            typeof _.reasoningEffort == "string" && (M._meta = {
                reasoningEffort: _.reasoningEffort
            });
            let Y = await fe("session/set_model", M);
            if (S = Ub(GI(Y), _.modelId) ?? S, typeof _.reasoningEffort != "string") {
                $ = void 0;
                return
            }
            let q = lQe(Y) ?? O;
            if (q !== _.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${_.reasoningEffort}` + (q === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${q})`));
            $ = _.reasoningEffort
        }, Be = _ => _ instanceof Error ? _.message : String(_);
    return {
        connect: W,
        shutdown: ye,
        currentModelId: () => S,
        hasSession: () => a !== null,
        setModel: ge,
        compact: async () => {
            let _ = new Date().toISOString();
            if (!a && !C) return {
                kind: "noop",
                runtime: "grok",
                reason: "session is not started yet — send a message first, then /compact",
                triggered_at: _
            };
            try {
                let k = await W();
                return await fe(GROK_ACP_COMPACT, {
                    sessionId: k
                }, 0), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: _
                }
            } catch (k) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: Be(k),
                    triggered_at: _
                }
            }
        },
        activeTurnId: () => R,
        activeTurnStartedAt: () => I,
        activeTurnSkipObserved: () => T,
        steerActiveTurn: async (_, k, M) => {
            if (!a || R !== k) return !1;
            let Y = await upe(M);
            if (!a || R !== k) return !1;
            let q = {
                sessionId: a,
                text: _
            };
            Y.length > 0 && (q.content = [{
                type: "text",
                text: _
            }, ...Y]);
            try {
                return await fe(grokAcpExtMethod("interject"), q), !0
            } catch {
                return !1
            }
        },
        run: async _ => {
            let k = await nQe(_.prompt),
                M = await upe(_.attachments),
                Y = [...k.trim() ? [{
                    type: "text",
                    text: k
                }] : [], ...M];
            if (Y.length === 0) return {
                text: "",
                usage: void 0
            };
            if (h) throw new Error("grok adapter run() is already in flight for this session");
            h = !0;
            try {
                y = void 0, P(), U(_.systemPrompt);
                let q = await W();
                if (await re(), _.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let se = _.model,
                    ve = _.effort;
                if (se || ve) {
                    let Ae = se ?? S;
                    if (ve && !Ae) J("grok effort re-apply skipped — no current model id", {
                        effort: ve
                    });
                    else if (Ae && (!!(se && se !== S) || !!(ve && ve !== $))) try {
                        await ge({
                            modelId: Ae,
                            reasoningEffort: ve
                        })
                    } catch (we) {
                        let Xe = we instanceof Error ? we.message : String(we);
                        if (typeof ve == "string" && Xe.includes("reasoningEffort")) J("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: Ae,
                            effort: ve,
                            error: Xe
                        });
                        else throw we
                    }
                }
                let Se = Date.now(),
                    He, it = [];
                R = `grok-turn-${++x}`, I = Se, T = !1, g = {
                    onStream: _.onStream,
                    onExecutionEvent: _.onExecutionEvent,
                    textParts: it,
                    markFirstToken: () => {
                        He === void 0 && (He = Date.now() - Se)
                    }
                };
                let pt = () => {
                    j();
                    try {
                        ie({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: q
                            }
                        })
                    } catch {}
                };
                _.abortController?.signal.addEventListener("abort", pt, {
                    once: !0
                });
                try {
                    _.onTurnAcknowledged?.();
                    let Ae = await fe("session/prompt", {
                        sessionId: q,
                        prompt: Y
                    }, o, _.abortController?.signal);
                    if (_.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let bt = Ae.result ?? Ae;
                    return {
                        sessionId: q,
                        text: it.join(""),
                        usage: sQe(bt),
                        firstTokenLatencyMs: He
                    }
                } catch (Ae) {
                    if (Ae instanceof AgentSdkTurnInterruptedError) throw Ae;
                    if (_.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        ie({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: q
                            }
                        })
                    } catch {}
                    throw Ae
                } finally {
                    _.abortController?.signal.removeEventListener("abort", pt), y = s && _.abortController?.signal.aborted ? _.onStream : void 0, g = null, j()
                }
            } finally {
                h = !1
            }
        }
    }
}
