// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: createGrokAcpAdapter  (minified: Ww, daemon.pretty.js:63437)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 156 renamed — 15 from the code at the binding (rule), 141 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (high): It sits behind the same seam as Claude and Codex rather than beside it: one long-lived agent process per session, duoduo's own tools reachable from it, mid-turn steering, and the same kind/instance/job/partition prompt fields
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createGrokAcpAdapter(options) {
    let grokBinary = options.grokBinary ?? "grok",
        cwd = options.cwd,
        sdkSessionId = options.sdkSessionId,
        extraEnv = options.env ?? {},
        promptTimeoutMs = options.promptTimeoutMs ?? 36e5,
        child = null,
        activeSessionId = null,
        nextRequestId = 1,
        map = new Map,
        shuttingDown = !1,
        connectPromise = null,
        mcpServerId = $ut(),
        mcpTransport = null,
        mcpServer = null,
        runInFlight = !1,
        activeTurn = null,
        detachedStreamSink, loadingSession = !1,
        loadSession = async params => {
            loadingSession = !0;
            try {
                return await request("session/load", params)
            } finally {
                loadingSession = !1
            }
        }, detachedTextParts = [], activeTurnId, activeTurnStartedAt, skipObserved = !1, toolCallsInFlight = new Set, pendingInterrupt = null, turnCounter = 0, currentModelId, reportedReasoningEffort, appliedReasoningEffort, systemPromptSpec, loadedOverrideLayers, resetTurnState = () => {
            activeTurnId = void 0, activeTurnStartedAt = void 0, skipObserved = !1, toolCallsInFlight.clear()
        }, takeInterruptMarker = () => {
            let interrupt = pendingInterrupt;
            return pendingInterrupt = null, interrupt ? selectInterruptMarkerText(interrupt.reason, interrupt.toolInFlight) : null
        }, flushDetachedTurn = () => {
            let text = detachedTextParts.join("");
            detachedTextParts.length = 0, text && Promise.resolve(options.onDetachedTurn?.({
                text
            })).catch(err => {
                logWarnMessage("grok detached-turn sink failed", {
                    error: err instanceof Error ? err.message : String(err)
                })
            })
        }, handleSessionUpdate = notification => {
            if (!child || loadingSession) return;
            let params = coerceToPlainObject(notification.params),
                update = coerceToPlainObject(params.update),
                updateKind = String(update.sessionUpdate ?? "");
            if (updateKind === "agent_message_chunk") {
                let text = WC(update.content);
                if (!text) return;
                if (activeTurn) {
                    activeTurn.markFirstToken(), activeTurn.textParts.push(text), activeTurn.onStream?.(text);
                    return
                }
                if (detachedStreamSink) {
                    detachedStreamSink(text);
                    return
                }
                detachedTextParts.push(text);
                return
            }
            if (updateKind === "turn_completed") {
                activeTurn || flushDetachedTurn();
                return
            }
            if (activeTurn) {
                if (updateKind === "agent_thought_chunk") {
                    let thought = WC(update.content);
                    thought && activeTurn.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: thought
                    });
                    return
                }
                if (updateKind === "tool_call") {
                    let toolCallId = String(update.toolCallId ?? update.tool_call_id ?? ""),
                        toolName = zut(update);
                    if (!toolCallId) return;
                    isGrokSkipToolCall(update) && (skipObserved = !0), toolCallsInFlight.add(toolCallId), activeTurn.onExecutionEvent?.({
                        type: "tool_use",
                        toolUseId: toolCallId,
                        toolName,
                        input: update.rawInput ?? update.raw_input ?? {}
                    });
                    return
                }
                if (updateKind === "tool_call_update") {
                    let status = String(update.status ?? "");
                    if (status !== "completed" && status !== "failed") return;
                    let toolCallId = String(update.toolCallId ?? update.tool_call_id ?? "");
                    if (!toolCallId) return;
                    toolCallsInFlight.delete(toolCallId), activeTurn.onExecutionEvent?.({
                        type: "tool_result",
                        toolUseId: toolCallId,
                        isError: status === "failed",
                        summary: WC(update.content) || status
                    })
                }
            }
        }, setSystemPromptSpec = systemPrompt => {
            if (typeof systemPrompt == "string") {
                systemPromptSpec = {
                    mode: "override",
                    layers: systemPrompt
                };
                return
            }
            systemPromptSpec = {
                mode: "append",
                layers: systemPrompt?.append ?? ""
            }
        }, buildSessionMeta = mode => {
            let meta = {
                agentProfile: GROK_AGENT_PROFILE
            };
            return options.mcpServerFactory && (meta[GROK_MCP_SERVERS_META] = [{
                name: GROK_MCP_SERVER_NAME,
                serverId: mcpServerId
            }]), systemPromptSpec ? systemPromptSpec.mode === "override" ? (meta.systemPromptOverride = systemPromptSpec.layers, meta) : (mode === "new" && systemPromptSpec.layers.length > 0 && (meta.rules = systemPromptSpec.layers), meta) : meta
        }, markOverrideLoaded = () => {
            systemPromptSpec?.mode === "override" && (loadedOverrideLayers = systemPromptSpec.layers)
        }, extractSessionId = response => {
            let result = response.result ?? response,
                meta = result._meta ?? {};
            return typeof result.sessionId == "string" && result.sessionId || typeof meta.sessionId == "string" && meta.sessionId || void 0
        }, reloadIfOverrideChanged = async () => {
            if (!activeSessionId || systemPromptSpec?.mode !== "override" || loadedOverrideLayers === systemPromptSpec.layers) return;
            let loadResponse = await loadSession({
                    sessionId: activeSessionId,
                    cwd,
                    mcpServers: [],
                    _meta: buildSessionMeta("load")
                }),
                loadedSessionId = extractSessionId(loadResponse);
            if (loadedSessionId !== void 0 && loadedSessionId !== activeSessionId) throw new Error(`session/load did not resume ${activeSessionId} (got ${String(loadedSessionId)}); refusing to fork`);
            currentModelId = HC(loadResponse) ?? currentModelId, markOverrideLoaded()
        }, attachMcpServer = async () => {
            !options.mcpServerFactory || mcpTransport || (mcpServer = options.mcpServerFactory(), mcpTransport = new C6, await mcpServer.instance.connect(mcpTransport))
        }, detachMcpServer = async () => {
            let transport = mcpTransport,
                server = mcpServer;
            mcpTransport = null, mcpServer = null;
            try {
                await transport?.close()
            } catch {}
            try {
                await server?.instance.close()
            } catch {}
        }, writeMessage = payload => {
            if (!child?.stdin.writable) throw new Error("grok ACP stdin is closed");
            child.stdin.write(`${JSON.stringify(payload)}
`)
        }, request = (method, params, timeoutMs = 3e4, signal) => {
            if (!child) return Promise.reject(new Error("grok ACP process is not running"));
            if (signal?.aborted) return Promise.reject(new AgentSdkTurnInterruptedError);
            let requestId = nextRequestId++;
            return writeMessage({
                jsonrpc: "2.0",
                id: requestId,
                method,
                params
            }), new Promise((resolve, reject) => {
                let settled = !1,
                    timer = timeoutMs > 0 ? setTimeout(() => {
                        settle(() => reject(new Error(`${method} timed out after ${timeoutMs}ms`)))
                    }, timeoutMs) : void 0,
                    onAbort = () => {
                        settle(() => reject(new AgentSdkTurnInterruptedError))
                    },
                    settle = finish => {
                        settled || (settled = !0, map.delete(requestId), timer && clearTimeout(timer), signal?.removeEventListener("abort", onAbort), finish())
                    };
                signal?.addEventListener("abort", onAbort, {
                    once: !0
                }), map.set(requestId, {
                    resolve: response => settle(() => resolve(response)),
                    reject: error => settle(() => reject(error))
                })
            })
        }, handleSdkCall = async (callId, params) => {
            let reply = body => {
                try {
                    writeMessage({
                        jsonrpc: "2.0",
                        id: callId,
                        ...body
                    })
                } catch {}
            };
            if (!mcpTransport) {
                reply({
                    error: {
                        code: -32603,
                        message: "aladuo MCP server is not attached"
                    }
                });
                return
            }
            let callParams = params ?? {};
            if (callParams.serverId !== mcpServerId) {
                reply({
                    error: {
                        code: -32602,
                        message: "unknown MCP serverId"
                    }
                });
                return
            }
            let message = callParams.message;
            if (typeof message == "string") try {
                message = JSON.parse(message)
            } catch {
                reply({
                    error: {
                        code: -32602,
                        message: "sdk_call message is not valid JSON"
                    }
                });
                return
            }
            if (!message || typeof message != "object") {
                reply({
                    error: {
                        code: -32602,
                        message: "sdk_call missing message"
                    }
                });
                return
            }
            try {
                let result = await mcpTransport.dispatch(message);
                reply({
                    result
                })
            } catch (err) {
                reply({
                    error: {
                        code: -32603,
                        message: err instanceof Error ? err.message : String(err)
                    }
                })
            }
        }, handleStdoutLine = line => {
            try {
                let trimmed = line.trim();
                if (!trimmed) return;
                let parsed;
                try {
                    parsed = JSON.parse(trimmed)
                } catch {
                    return
                }
                if (typeof parsed.method == "string" && parsed.id !== void 0) {
                    if (jut(parsed.method)) {
                        logDebugMessage(`grok ACP ${parsed.method}`), handleSdkCall(parsed.id, parsed.params);
                        return
                    }
                    writeMessage({
                        jsonrpc: "2.0",
                        id: parsed.id,
                        error: {
                            code: -32601,
                            message: `grok adapter does not implement ${parsed.method}`
                        }
                    });
                    return
                }
                if (typeof parsed.method == "string") {
                    let params = coerceToPlainObject(parsed.params),
                        modelState = Hut(params.update);
                    modelState && (modelState.modelId && (currentModelId = modelState.modelId), reportedReasoningEffort = modelState.reasoningEffort), But(parsed.method) && handleSessionUpdate(parsed), options.onNotification?.(parsed.method), logDebugMessage(`grok ACP notification ${parsed.method}`);
                    return
                }
                if (typeof parsed.id == "number") {
                    let pending = map.get(parsed.id);
                    if (!pending) return;
                    map.delete(parsed.id), parsed.error ? pending.reject(new Error(JSON.stringify(parsed.error))) : pending.resolve(parsed)
                }
            } catch {}
        }, spawnChild = () => {
            if (child) return;
            let env = {
                ...process.env,
                ...extraEnv
            };
            delete env.GROK_HOME;
            let proc = Cut(grokBinary, ["agent", "--always-approve", "--no-leader", "stdio"], {
                cwd,
                env,
                stdio: ["pipe", "pipe", "pipe"]
            });
            child = proc, proc.stderr.resume(), proc.on("error", err => {
                handleChildGone(err)
            }), logDebugMessage(`grok ACP spawn pid=${proc.pid??"unknown"}`), attachStreamLineReader(proc.stdout, handleStdoutLine, {
                onEof: () => {
                    !shuttingDown && child === proc && proc.kill("SIGKILL")
                }
            }), proc.on("exit", () => {
                handleChildGone(new Error("grok ACP process exited"))
            })
        }, handleChildGone = error => {
            shuttingDown || (activeSessionId && (sdkSessionId = activeSessionId), activeSessionId = null, connectPromise = null), currentModelId = void 0, appliedReasoningEffort = void 0, reportedReasoningEffort = void 0, loadedOverrideLayers = void 0, child = null;
            for (let pending of map.values()) pending.reject(error);
            map.clear()
        }, connect = async () => {
            if (activeSessionId) return activeSessionId;
            if (connectPromise) return connectPromise;
            connectPromise = (async () => {
                spawnChild();
                let initResult = (await request("initialize", {
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
                            ...options.mcpServerFactory ? {
                                [GROK_MCP_SDK_META]: !0
                            } : {}
                        }
                    })).result ?? {},
                    authMethods = initResult.authMethods ?? initResult.auth_methods,
                    authMethod = authMethods?.find(method => method.id === "cached_token") ?? authMethods?.[0];
                if (authMethod?.id && await request("authenticate", {
                        methodId: authMethod.id,
                        _meta: {
                            headless: !0
                        }
                    }), await attachMcpServer(), sdkSessionId) {
                    let loadResponse = await loadSession({
                            sessionId: sdkSessionId,
                            cwd,
                            mcpServers: [],
                            _meta: buildSessionMeta("load")
                        }),
                        loadedSessionId = extractSessionId(loadResponse);
                    if (loadedSessionId !== sdkSessionId) throw new Error(`session/load did not resume ${sdkSessionId} (got ${String(loadedSessionId)}); refusing to session/new`);
                    return activeSessionId = loadedSessionId, currentModelId = HC(loadResponse) ?? currentModelId, markOverrideLoaded(), activeSessionId
                }
                let newResponse = await request("session/new", {
                        cwd,
                        mcpServers: [],
                        _meta: buildSessionMeta("new")
                    }),
                    sessionId = (newResponse.result ?? newResponse).sessionId;
                if (typeof sessionId != "string" || sessionId.length === 0) throw new Error("session/new did not return sessionId");
                return activeSessionId = sessionId, sdkSessionId = sessionId, currentModelId = HC(newResponse) ?? currentModelId, markOverrideLoaded(), activeSessionId
            })();
            try {
                return await connectPromise
            } catch (err) {
                throw connectPromise = null, await shutdown(), err
            }
        }, shutdown = async () => {
            if (shuttingDown) return;
            shuttingDown = !0, connectPromise = null, activeSessionId = null, resetTurnState(), activeTurn = null, detachedStreamSink = void 0, flushDetachedTurn(), await detachMcpServer();
            let proc = child;
            if (child = null, !proc) {
                shuttingDown = !1;
                return
            }
            proc.kill("SIGTERM"), await new Promise(resolve => {
                let killTimer = setTimeout(() => {
                    proc.kill("SIGKILL"), resolve()
                }, 2e3);
                proc.once("exit", () => {
                    clearTimeout(killTimer), resolve()
                })
            }), shuttingDown = !1
        }, setModel = async modelParams => {
            let connectedSessionId = await connect();
            reportedReasoningEffort = void 0;
            let setModelParams = {
                sessionId: connectedSessionId,
                modelId: modelParams.modelId
            };
            typeof modelParams.reasoningEffort == "string" && (setModelParams._meta = {
                reasoningEffort: modelParams.reasoningEffort
            });
            let setModelResponse = await request("session/set_model", setModelParams);
            if (currentModelId = Vw(HC(setModelResponse), modelParams.modelId) ?? currentModelId, typeof modelParams.reasoningEffort != "string") {
                appliedReasoningEffort = void 0;
                return
            }
            let confirmedEffort = Vut(setModelResponse) ?? reportedReasoningEffort;
            if (confirmedEffort !== modelParams.reasoningEffort) throw new Error(`grok did not apply reasoningEffort=${modelParams.reasoningEffort}` + (confirmedEffort === void 0 ? " (RPC succeeded with no confirmation; grok warns-and-ignores unsupported effort)" : ` (got ${confirmedEffort})`));
            appliedReasoningEffort = modelParams.reasoningEffort
        }, errorMessage = err => err instanceof Error ? err.message : String(err);
    return {
        connect,
        shutdown,
        currentModelId: () => currentModelId,
        hasSession: () => activeSessionId !== null,
        setModel,
        compact: async () => {
            let triggeredAt = new Date().toISOString();
            if (!activeSessionId && !systemPromptSpec) return {
                kind: "noop",
                runtime: "grok",
                reason: "session is not started yet — send a message first, then /compact",
                triggered_at: triggeredAt
            };
            try {
                let connectedSessionId = await connect();
                return await request(GROK_ACP_COMPACT, {
                    sessionId: connectedSessionId
                }, 0), {
                    kind: "succeeded",
                    runtime: "grok",
                    triggered_at: triggeredAt
                }
            } catch (err) {
                return {
                    kind: "failed",
                    runtime: "grok",
                    error: errorMessage(err),
                    triggered_at: triggeredAt
                }
            }
        },
        activeTurnId: () => activeTurnId,
        activeTurnStartedAt: () => activeTurnStartedAt,
        activeTurnSkipObserved: () => skipObserved,
        steerActiveTurn: async (text, turnId, attachments) => {
            if (!activeSessionId || activeTurnId !== turnId) return !1;
            let attachmentBlocks = await _be(attachments);
            if (!activeSessionId || activeTurnId !== turnId) return !1;
            let interjectParams = {
                sessionId: activeSessionId,
                text
            };
            attachmentBlocks.length > 0 && (interjectParams.content = [{
                type: "text",
                text
            }, ...attachmentBlocks]);
            try {
                return await request(grokAcpExtMethod("interject"), interjectParams), !0
            } catch {
                return !1
            }
        },
        run: async input => {
            let promptText = await Lut(input.prompt),
                attachmentBlocks = await _be(input.attachments),
                promptBlocks = [...promptText.trim() ? [{
                    type: "text",
                    text: promptText
                }] : [], ...attachmentBlocks];
            if (promptBlocks.length === 0) return {
                text: "",
                usage: void 0
            };
            if (runInFlight) throw new Error("grok adapter run() is already in flight for this session");
            runInFlight = !0;
            try {
                detachedStreamSink = void 0, flushDetachedTurn(), setSystemPromptSpec(input.systemPrompt);
                let connectedSessionId = await connect();
                if (await reloadIfOverrideChanged(), input.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                let model = input.model,
                    effort = input.effort;
                if (model || effort) {
                    let targetModelId = model ?? currentModelId;
                    if (effort && !targetModelId) logWarnMessage("grok effort re-apply skipped — no current model id", {
                        effort
                    });
                    else if (targetModelId && (!!(model && model !== currentModelId) || !!(effort && effort !== appliedReasoningEffort))) try {
                        await setModel({
                            modelId: targetModelId,
                            reasoningEffort: effort
                        })
                    } catch (err) {
                        let errMessage = err instanceof Error ? err.message : String(err);
                        if (typeof effort == "string" && errMessage.includes("reasoningEffort")) logWarnMessage("grok effort re-apply was not confirmed — continuing the turn", {
                            modelId: targetModelId,
                            effort,
                            error: errMessage
                        });
                        else throw err
                    }
                }
                let now = Date.now(),
                    firstTokenLatencyMs, textParts = [];
                activeTurnId = `grok-turn-${++turnCounter}`, activeTurnStartedAt = now, skipObserved = !1, activeTurn = {
                    onStream: input.onStream,
                    onExecutionEvent: input.onExecutionEvent,
                    textParts,
                    markFirstToken: () => {
                        firstTokenLatencyMs === void 0 && (firstTokenLatencyMs = Date.now() - now)
                    }
                };
                let onAbort = () => {
                    let turnAbortReason = normalizeTurnAbortReason(input.abortController?.signal.reason);
                    turnAbortReason && (pendingInterrupt = {
                        reason: turnAbortReason,
                        toolInFlight: toolCallsInFlight.size > 0
                    }), resetTurnState();
                    try {
                        writeMessage({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: connectedSessionId
                            }
                        })
                    } catch {}
                };
                input.abortController?.signal.addEventListener("abort", onAbort, {
                    once: !0
                });
                let interruptMarker = takeInterruptMarker();
                interruptMarker && promptBlocks.unshift({
                    type: "text",
                    text: interruptMarker
                });
                try {
                    input.onTurnAcknowledged?.();
                    let promptResponse = await request("session/prompt", {
                        sessionId: connectedSessionId,
                        prompt: promptBlocks
                    }, promptTimeoutMs, input.abortController?.signal);
                    if (input.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    let promptResult = promptResponse.result ?? promptResponse;
                    return {
                        sessionId: connectedSessionId,
                        text: textParts.join(""),
                        usage: mapGrokUsageToDrainUsage(promptResult),
                        firstTokenLatencyMs
                    }
                } catch (err) {
                    if (err instanceof AgentSdkTurnInterruptedError) throw err;
                    if (input.abortController?.signal.aborted) throw new AgentSdkTurnInterruptedError;
                    try {
                        writeMessage({
                            jsonrpc: "2.0",
                            method: "session/cancel",
                            params: {
                                sessionId: connectedSessionId
                            }
                        })
                    } catch {}
                    throw err
                } finally {
                    input.abortController?.signal.removeEventListener("abort", onAbort), detachedStreamSink = child && input.abortController?.signal.aborted ? input.onStream : void 0, activeTurn = null, resetTurnState()
                }
            } finally {
                runInFlight = !1
            }
        }
    }
}
