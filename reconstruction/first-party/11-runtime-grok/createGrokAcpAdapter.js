// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: createGrokAcpAdapter  (minified: Ww, daemon.pretty.js:63437)
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
        f = $ut(),
        p = null,
        m = null,
        h = !1,
        g = null,
        y, v = !1,
        b = async z => {
            v = !0;
            try {
                return await G("session/load", z)
            } finally {
                v = !1
            }
        }, _ = [], E, R, P = !1, k = new Set, S = null, D = 0, A, $, C, N, x, M = () => {
            E = void 0, R = void 0, P = !1, k.clear()
        }, F = () => {
            let z = S;
            return S = null, z ? selectInterruptMarkerText(z.reason, z.toolInFlight) : null
        }, J = () => {
            let z = _.join("");
            _.length = 0, z && Promise.resolve(e.onDetachedTurn?.({
                text: z
            })).catch(U => {
                logWarnMessage("grok detached-turn sink failed", {
                    error: U instanceof Error ? U.message : String(U)
                })
            })
        }, ce = z => {
            if (!s || v) return;
            let U = coerceToPlainObject(z.params),
                Y = coerceToPlainObject(U.update),
                me = String(Y.sessionUpdate ?? "");
            if (me === "agent_message_chunk") {
                let re = WC(Y.content);
                if (!re) return;
                if (g) {
                    g.markFirstToken(), g.textParts.push(re), g.onStream?.(re);
                    return
                }
                if (y) {
                    y(re);
                    return
                }
                _.push(re);
                return
            }
            if (me === "turn_completed") {
                g || J();
                return
            }
            if (g) {
                if (me === "agent_thought_chunk") {
                    let re = WC(Y.content);
                    re && g.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: re
                    });
                    return
                }
                if (me === "tool_call") {
                    let re = String(Y.toolCallId ?? Y.tool_call_id ?? ""),
                        Ee = zut(Y);
                    if (!re) return;
                    isGrokSkipToolCall(Y) && (P = !0), k.add(re), g.onExecutionEvent?.({
                        type: "tool_use",
                        toolUseId: re,
                        toolName: Ee,
                        input: Y.rawInput ?? Y.raw_input ?? {}
                    });
                    return
                }
                if (me === "tool_call_update") {
                    let re = String(Y.status ?? "");
                    if (re !== "completed" && re !== "failed") return;
                    let Ee = String(Y.toolCallId ?? Y.tool_call_id ?? "");
                    if (!Ee) return;
                    k.delete(Ee), g.onExecutionEvent?.({
                        type: "tool_result",
                        toolUseId: Ee,
                        isError: re === "failed",
                        summary: WC(Y.content) || re
                    })
                }
            }
        }, ie = z => {
            if (typeof z == "string") {
                N = {
                    mode: "override",
                    layers: z
                };
                return
            }
            N = {
                mode: "append",
                layers: z?.append ?? ""
            }
        }, Ce = z => {
            let U = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return e.mcpServerFactory && (U[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: f
            }]), N ? N.mode === "override" ? (U.systemPromptOverride = N.layers, U) : (z === "new" && N.layers.length > 0 && (U.rules = N.layers), U) : U
        }, se = () => {
            N?.mode === "override" && (x = N.layers)
        }, j = z => {
            let U = z.result ?? z,
                Y = U._meta ?? {};
            return typeof U.sessionId == "string" && U.sessionId || typeof Y.sessionId == "string" && Y.sessionId || void 0
        }, ne = async () => {
            if (!a || N?.mode !== "override" || x === N.layers) return;
            let z = await b({
                    sessionId: a,
                    cwd: n,
                    mcpServers: [],
                    _meta: Ce("load")
                }),
                U = j(z);
            if (U !== void 0 && U !== a) throw new Error(`session/load did not resume ${a} (got ${String(U)}); refusing to fork`);
            A = HC(z) ?? A, se()
        }, K = async () => {
            !e.mcpServerFactory || p || (m = e.mcpServerFactory(), p = new C6, await m.instance.connect(p))
        }, te = async () => {
            let z = p,
                U = m;
            p = null, m = null;
            try {
                await z?.close()
            } catch {}
            try {
                await U?.instance.close()
            } catch {}
        }, B = z => {
            if (!s?.stdin.writable) throw new Error("grok ACP stdin is closed");
            s.stdin.write(`${JSON.stringify(z)}
`)
        }, G = (z, U, Y = 3e4, me) => {
            if (!s) return Promise.reject(new Error("grok ACP process is not running"));
            if (me?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let re = u++;
            return B({
                jsonrpc: "2.0",
                id: re,
                method: z,
                params: U
            }), new Promise((Ee, Oe) => {
                let Xe = !1,
                    nt = Y > 0 ? setTimeout(() => {
                        qe(() => Oe(new Error(`${z} timed out after ${Y}ms`)))
                    }, Y) : void 0,
                    Ze = () => {
                        qe(() => Oe(new AgentSdkTurnInterruptedError))
                    },
                    qe = Ae => {
                        Xe || (Xe = !0, l.delete(re), nt && clearTimeout(nt), me?.removeEventListener("abort", Ze), Ae())
                    };
                me?.addEventListener("abort", Ze, {
                    once: !0
                }), l.set(re, {
                    resolve: Ae => qe(() => Ee(Ae)),
                    reject: Ae => qe(() => Oe(Ae))
                })
            })
        }, H = async (z, U) => {
            let Y = Ee => {
                try {
                    B({
                        jsonrpc: "2.0",
                        id: z,
                        ...Ee
                    })
                } catch {}
            };
            if (!p) {
                Y({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let me = U ?? {};
            if (me.serverId !== f) {
                Y({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let re = me.message;
            if (typeof re == "string") try {
                re = JSON.parse(re)
            } catch {
                Y({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!re || typeof re != "object") {
                Y({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let Ee = await p.dispatch(re);
                Y({
                    result: Ee
                })
            } catch (Ee) {
                Y({
                    error: {
                        code: -32603,
                        message: Ee instanceof Error ? Ee.message : String(Ee)
                    }
                })
            }
        }, q = z => {
            try {
                let U = z.trim();
                if (!U) return;
                let Y;
                try {
                    Y = JSON.parse(U)
                } catch {
                    return
                }
                if (typeof Y.method == "string" && Y.id !== void 0) {
                    if (jut(Y.method)) {
                        logDebugMessage(`grok ACP ${Y.method}`), H(Y.id, Y.params);
                        return
                    }
                    B({
                        jsonrpc: "2.0",
                        id: Y.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${Y.method}`
                        }
                    });
                    return
                }
                if (typeof Y.method == "string") {
                    let me = coerceToPlainObject(Y.params),
                        re = Hut(me.update);
                    re && (re.modelId && (A = re.modelId), $ = re.reasoningEffort), But(Y.method) && ce(Y), e.onNotification?.(Y.method), logDebugMessage(`grok ACP notification ${Y.method}`);
                    return
                }
                if (typeof Y.id == "number") {
                    let me = l.get(Y.id);
                    if (!me) return;
                    l.delete(Y.id), Y.error ? me.reject(new Error(JSON.stringify(Y.error))) : me.resolve(Y)
                }
            } catch {}
        }, pe = () => {
            if (s) return;
            let z = {
                ...process.env,
                ...i
            };
            delete z.GROK_HOME;
            let U = Cut(t, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd: n,
                env: z,
                stdio: ["pipe", "pipe", "pipe"]
            });
            s = U, U.stderr.resume(), U.on("error", Y => {
                fe(Y)
            }), logDebugMessage(`grok ACP spawn pid=${U.pid??"unknown"}`), attachStreamLineReader(U.stdout, q, {
                onEof: () => {
                    !c && s === U && U.kill("SIGKILL")
                }
            }), U.on("exit", () => {
                fe(new Error("grok ACP process exited"))
            })
        }, fe = z => {
            c || (a && (r = a), a = null, d = null), A = void 0, C = void 0, $ = void 0, x = void 0, s = null;
            for (let U of l.values()) U.reject(z);
            l.clear()
        }, Se = async () => {
            if (a) return a;
            if (d) return d;
            d = (async () => {
                pe();
                let U = (await G("initialize", {
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
                    Y = U.authMethods ?? U.auth_methods,
                    me = Y?.find(Xe => Xe.id === "cached_token") ?? Y?.[0];
                if (me?.id && await G("authenticate", {
                        methodId: me.id,
                        _meta: {
                            headless: !0
                        }
                    }), await K(), r) {
                    let Xe = await b({
                            sessionId: r,
                            cwd: n,
                            mcpServers: [],
                            _meta: Ce("load")
                        }),
                        nt = j(Xe);
                    if (nt !== r) throw new Error(`session/load did not resume ${r} (got ${String(nt)}); refusing to session/new`);
                    return a = nt, A = HC(Xe) ?? A, se(), a
                }
                let re = await G("session/new", {
                        cwd: n,
                        mcpServers: [],
                        _meta: Ce("new")
                    }),
                    Oe = (re.result ?? re).sessionId;
                if (typeof Oe != "string" || Oe.length === 0) throw new Error("session/new did not return sessionId");
                return a = Oe, r = Oe, A = HC(re) ?? A, se(), a
            })();
            try {
                return await d
            } catch (z) {
                throw d = null, await w(), z
            }
        }, w = async () => {
            if (c) return;
            c = !0, d = null, a = null, M(), g = null, y = void 0, J(), await te();
            let z = s;
            if (s = null, !z) {
                c = !1;
                return
            }
            z.kill("SIGTERM"), await new Promise(U => {
                let Y = setTimeout(() => {
                    z.kill("SIGKILL"), U()
                }, 2e3);
                z.once("exit", () => {
                    clearTimeout(Y), U()
                })
            }), c = !1
        }, T = async z => {
            let U = await Se();
            $ = void 0;
            let Y = {
                sessionId: U,
                modelId: z.modelId
            };
            typeof z.reasoningEffort == "string" && (Y._meta = {
                reasoningEffort: z.reasoningEffort
            });
            let me = await G("session/set_model", Y);
            if (A = Vw(HC(me), z.modelId) ?? A, typeof z.reasoningEffort != "string") {
                C = void 0;
                return
            }
            let re = Vut(me) ?? $;
            if (re !== z.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${z.reasoningEffort}` + (re === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${re})`));
            C = z.reasoningEffort
        }, L = z => z instanceof Error ? z.message : String(z);
    return {
        connect: Se,
        shutdown: w,
        currentModelId: () => A,
        hasSession: () => a !== null,
        setModel: T,
        compact: async () => {
            let z = new Date().toISOString();
            if (!a && !N) return {
                kind: "noop",
                runtime: "grok",
                reason: "session is not started yet — send a message first, then /compact",
                triggered_at: z
            };
            try {
                let U = await Se();
                return await G(GROK_ACP_COMPACT, {
                    sessionId: U
                }, 0), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: z
                }
            } catch (U) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: L(U),
                    triggered_at: z
                }
            }
        },
        activeTurnId: () => E,
        activeTurnStartedAt: () => R,
        activeTurnSkipObserved: () => P,
        steerActiveTurn: async (z, U, Y) => {
            if (!a || E !== U) return !1;
            let me = await _be(Y);
            if (!a || E !== U) return !1;
            let re = {
                sessionId: a,
                text: z
            };
            me.length > 0 && (re.content = [{
                type: "text",
                text: z
            }, ...me]);
            try {
                return await G(grokAcpExtMethod("interject"), re), !0
            } catch {
                return !1
            }
        },
        run: async z => {
            let U = await Lut(z.prompt),
                Y = await _be(z.attachments),
                me = [...U.trim() ? [{
                    type: "text",
                    text: U
                }] : [], ...Y];
            if (me.length === 0) return {
                text: "",
                usage: void 0
            };
            if (h) throw new Error("grok adapter run() is already in flight for this session");
            h = !0;
            try {
                y = void 0, J(), ie(z.systemPrompt);
                let re = await Se();
                if (await ne(), z.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let Ee = z.model,
                    Oe = z.effort;
                if (Ee || Oe) {
                    let ve = Ee ?? A;
                    if (Oe && !ve) logWarnMessage("grok effort re-apply skipped — no current model id", {
                        effort: Oe
                    });
                    else if (ve && (!!(Ee && Ee !== A) || !!(Oe && Oe !== C))) try {
                        await T({
                            modelId: ve,
                            reasoningEffort: Oe
                        })
                    } catch (gt) {
                        let Gt = gt instanceof Error ? gt.message : String(gt);
                        if (typeof Oe == "string" && Gt.includes("reasoningEffort")) logWarnMessage("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: ve,
                            effort: Oe,
                            error: Gt
                        });
                        else throw gt
                    }
                }
                let Xe = Date.now(),
                    nt, Ze = [];
                E = `grok-turn-${++D}`, R = Xe, P = !1, g = {
                    onStream: z.onStream,
                    onExecutionEvent: z.onExecutionEvent,
                    textParts: Ze,
                    markFirstToken: () => {
                        nt === void 0 && (nt = Date.now() - Xe)
                    }
                };
                let qe = () => {
                    let ve = normalizeTurnAbortReason(z.abortController?.signal.reason);
                    ve && (S = {
                        reason: ve,
                        toolInFlight: k.size > 0
                    }), M();
                    try {
                        B({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: re
                            }
                        })
                    } catch {}
                };
                z.abortController?.signal.addEventListener("abort", qe, {
                    once: !0
                });
                let Ae = F();
                Ae && me.unshift({
                    type: "text",
                    text: Ae
                });
                try {
                    z.onTurnAcknowledged?.();
                    let ve = await G("session/prompt", {
                        sessionId: re,
                        prompt: me
                    }, o, z.abortController?.signal);
                    if (z.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let je = ve.result ?? ve;
                    return {
                        sessionId: re,
                        text: Ze.join(""),
                        usage: mapGrokUsageToDrainUsage(je),
                        firstTokenLatencyMs: nt
                    }
                } catch (ve) {
                    if (ve instanceof AgentSdkTurnInterruptedError) throw ve;
                    if (z.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        B({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: re
                            }
                        })
                    } catch {}
                    throw ve
                } finally {
                    z.abortController?.signal.removeEventListener("abort", qe), y = s && z.abortController?.signal.aborted ? z.onStream : void 0, g = null, M()
                }
            } finally {
                h = !1
            }
        }
    }
}
