// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: oS, daemon.pretty.js:63564)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.1, v0.5.2, v0.5.3, v0.5.4, v0.5.5, v0.5.6, v0.5.7, v0.5.8, v0.6.0, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.2 (maps/history_daemon.json)
// locals: 128 renamed — 32 from the code at the binding (rule), 96 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (high): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
// changelog v0.5.1 (high): The new behavior calls `thread/fork` from the parent rollout when one is available … Falls back to `thread/start` if the parent rollout has been GC'd.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(options, instructionContext) {
    let config = {
            ...Vct,
            ...options
        },
        transport = null,
        initialized = !1,
        attachedThreadId = null,
        pendingInterrupt = null,
        takeInterruptMarkerText = () => {
            let interrupt = pendingInterrupt;
            return pendingInterrupt = null, interrupt ? selectInterruptMarkerText(interrupt.reason, interrupt.toolInFlight) : null
        },
        activeTurn = null,
        onToolCallObserved = toolName => (toolName === $s && activeTurn && (activeTurn.skipObserved = !0), activeTurn?.turnId),
        onToolCallSettled = (toolName, success, observedTurnId) => {
            toolName === $s && !success && activeTurn && observedTurnId !== void 0 && observedTurnId === activeTurn.turnId && (activeTurn.skipObserved = !1)
        };
    async function attachToThread(targetThreadId, cwd, signal) {
        if ((!transport || !transport.isAlive) && (transport = new aO(config.codexBinary, cwd, config.env), transport.start(), transport.setToolCallObserved(onToolCallObserved), transport.setToolCallSettled(onToolCallSettled), initialized = !1, attachedThreadId = null), !initialized) {
            if (await transport.request("initialize", {
                    clientInfo: {
                        title: "duoduo-runtime",
                        name: "duoduo",
                        version: "0.1.0"
                    },
                    capabilities: {
                        experimentalApi: !!config.dynamicTools?.length,
                        optOutNotificationMethods: ["item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded", "item/reasoning/textDelta"]
                    }
                }, signal), transport.notify("initialized", {}), config.dynamicTools?.length) {
                let map = new Map;
                for (let tool of config.dynamicTools) map.set(tool.name, tool.handler);
                transport.setToolHandlers(map)
            }
            initialized = !0
        }
        attachedThreadId !== targetThreadId && (await transport.request("thread/resume", {
            threadId: targetThreadId
        }, signal), attachedThreadId = targetThreadId)
    }
    return {
        async run(runOptions) {
            let promptText;
            if (typeof runOptions.prompt == "string") promptText = runOptions.prompt;
            else {
                let textParts = [];
                for await (let message of runOptions.prompt) if (typeof message.message.content == "string") textParts.push(message.message.content);
                else if (Array.isArray(message.message.content))
                    for (let block of message.message.content) block.type === "text" && textParts.push(block.text);
                promptText = textParts.join(`

`)
            }
            if (!promptText.trim()) return {
                text: "",
                usage: void 0
            };
            let cwd = runOptions.cwd || process.cwd();
            if ((!transport || !transport.isAlive) && (transport = new aO(config.codexBinary, cwd, config.env), transport.start(), transport.setToolCallObserved(onToolCallObserved), transport.setToolCallSettled(onToolCallSettled), initialized = !1), !initialized) {
                if (await transport.request("initialize", {
                        clientInfo: {
                            title: "duoduo-runtime",
                            name: "duoduo",
                            version: "0.1.0"
                        },
                        capabilities: {
                            experimentalApi: !!config.dynamicTools?.length,
                            optOutNotificationMethods: ["item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded", "item/reasoning/textDelta"]
                        }
                    }, runOptions.abortController?.signal), transport.notify("initialized", {}), config.dynamicTools?.length) {
                    let map = new Map;
                    for (let tool of config.dynamicTools) map.set(tool.name, tool.handler);
                    transport.setToolHandlers(map)
                }
                initialized = !0
            }
            let systemPromptAppend = extractSystemPromptAppend(runOptions.systemPrompt),
                baseInstructions = buildBaseInstructions(instructionContext ?? {}, systemPromptAppend),
                developerInstructions = buildDeveloperInstructions(instructionContext ?? {}, config.dynamicTools?.map(tool => tool.name)),
                codexSandboxForPermissionMode = resolveCodexSandboxForPermissionMode(runOptions.permissionMode, config.sandbox);
            runOptions.disallowedTools?.length && logDebugMessage("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
                disallowedTools: runOptions.disallowedTools
            });
            let ephemeral = runOptions.persistSession !== void 0 ? !runOptions.persistSession : config.ephemeral,
                requestedModel = runOptions.model !== void 0 ? runOptions.model : config.model,
                effort = runOptions.effort !== void 0 ? runOptions.effort : config.effort,
                buildThreadStartParams = () => {
                    let startParams = {
                        cwd,
                        model: requestedModel,
                        approvalPolicy: "never",
                        sandbox: codexSandboxForPermissionMode,
                        serviceName: config.serviceName,
                        ephemeral,
                        experimentalRawEvents: !1,
                        persistExtendedHistory: !1
                    };
                    return baseInstructions && (startParams.baseInstructions = baseInstructions), developerInstructions && (startParams.developerInstructions = developerInstructions), config.dynamicTools?.length && (startParams.dynamicTools = [{
                        type: "namespace",
                        name: ALADUO_TOOL_NAMESPACE,
                        description: "Runtime control tools provided by the duoduo daemon.",
                        tools: config.dynamicTools.map(tool => ({
                            type: "function",
                            name: tool.name,
                            description: tool.description,
                            inputSchema: tool.inputSchema
                        }))
                    }], startParams.config = buildCodexDirectOnlyToolConfig()), startParams
                },
                buildThreadResumeParams = resumeThreadId => {
                    let resumeParams = {
                        cwd,
                        model: requestedModel,
                        approvalPolicy: "never",
                        sandbox: codexSandboxForPermissionMode,
                        threadId: resumeThreadId
                    };
                    return config.dynamicTools?.length && (resumeParams.config = buildCodexDirectOnlyToolConfig()), resumeParams
                },
                buildThreadForkParams = forkThreadId => {
                    let forkParams = {
                        cwd,
                        model: requestedModel,
                        approvalPolicy: "never",
                        sandbox: codexSandboxForPermissionMode,
                        threadId: forkThreadId,
                        persistExtendedHistory: !1
                    };
                    return baseInstructions && (forkParams.baseInstructions = baseInstructions), developerInstructions && (forkParams.developerInstructions = developerInstructions), config.dynamicTools?.length && (forkParams.config = buildCodexDirectOnlyToolConfig()), forkParams
                },
                threadMethod, threadParams;
            runOptions.forkFrom ? (threadMethod = "thread/fork", threadParams = buildThreadForkParams(runOptions.forkFrom)) : runOptions.sessionId ? (threadMethod = "thread/resume", threadParams = buildThreadResumeParams(runOptions.sessionId)) : (threadMethod = "thread/start", threadParams = buildThreadStartParams(), pendingInterrupt = null);
            let requestThread = async () => {
                try {
                    return await transport.request(threadMethod, threadParams, runOptions.abortController?.signal)
                } catch (err) {
                    let aborted = err instanceof Error && err.name === "AbortError" || runOptions.abortController?.signal.aborted === !0;
                    if (threadMethod === "thread/fork" && !aborted) return logInfoMessage("[codex-adapter] thread/fork failed, falling back to thread/start", {
                        cwd,
                        forkFrom: threadParams.threadId,
                        error: err instanceof Error ? err.message : String(err)
                    }), threadMethod = "thread/start", threadParams = buildThreadStartParams(), await transport.request(threadMethod, threadParams, runOptions.abortController?.signal);
                    throw err
                }
            }, threadResponse = await requestThread();
            if (threadMethod === "thread/resume" && requestedModel !== void 0 && requestedModel !== null) {
                let model = threadResponse.model,
                    id = threadResponse.thread.id;
                model !== requestedModel && (logInfoMessage("[codex-adapter] resumed thread runs a different model; forking", {
                    cwd,
                    resumedThreadId: id,
                    resumedModel: model,
                    wantedModel: requestedModel
                }), threadMethod = "thread/fork", threadParams = buildThreadForkParams(id), threadResponse = await requestThread())
            }
            let model = threadResponse.model,
                id = threadResponse.thread.id;
            attachedThreadId = id;
            let textChunks = [],
                commentaryItemIds = new Set,
                map = new Map,
                inFlightToolUseIds = new Set,
                usageState = {},
                firstTokenLatencyMs, now = Date.now(),
                firstTokenSeen = !1,
                currentTurnId, resolveTurnId, promise = new Promise(resolve => {
                    resolveTurnId = resolve
                }),
                imageWarningLogged = !1,
                collectGeneratedImage = payload => {
                    if (!currentTurnId) return;
                    let codexGeneratedImageAttachment = extractCodexGeneratedImageAttachment(payload);
                    if (!codexGeneratedImageAttachment) {
                        !imageWarningLogged && hasImageGenerationRecord(payload) && (imageWarningLogged = !0, logWarnMessage("[codex] image-generation record present but no attachment extracted", {
                            threadId: id,
                            turnId: currentTurnId,
                            hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
                        }));
                        return
                    }
                    let attachmentKey = "path" in codexGeneratedImageAttachment ? `path:${codexGeneratedImageAttachment.path}` : `call:${codexGeneratedImageAttachment.callId}`;
                    map.set(attachmentKey, codexGeneratedImageAttachment)
                },
                settled = !1,
                promise2 = new Promise((resolve, reject) => {
                    let settleOnce = settle => {
                            settled || (settled = !0, detachListener(), settle())
                        },
                        onNotification = notification => {
                            if (settled) return;
                            let notificationParams = notification.params ?? {},
                                threadId = notificationParams.threadId,
                                turnId = notificationParams.turnId;
                            if (codexNotificationFilterDecision({
                                    method: notification.method,
                                    msgThreadId: threadId,
                                    msgTurnId: turnId,
                                    ownThreadId: id,
                                    ownTurnId: currentTurnId
                                }) !== "process") return;
                            let item = notificationParams.item;
                            switch (collectGeneratedImage(notificationParams), notification.method) {
                                case "item/agentMessage/delta": {
                                    let {
                                        delta = "",
                                        itemId
                                    } = notificationParams;
                                    delta && (firstTokenSeen || (firstTokenLatencyMs = Date.now() - now, firstTokenSeen = !0), (!itemId || !commentaryItemIds.has(itemId)) && textChunks.push(delta), runOptions.onStream?.(delta));
                                    break
                                }
                                case "item/started": {
                                    if (!item) break;
                                    item.type === "agentMessage" && typeof item.id == "string" && item.phase === "commentary" && commentaryItemIds.add(item.id);
                                    let startedEvent = mapItemStartedToExecEvent(item);
                                    startedEvent?.type === "tool_use" && inFlightToolUseIds.add(startedEvent.toolUseId), startedEvent && runOptions.onExecutionEvent?.(startedEvent);
                                    break
                                }
                                case "item/completed": {
                                    if (!item) break;
                                    collectGeneratedImage(item);
                                    let completedEvent = mapItemCompletedToExecEvent(item);
                                    completedEvent?.type === "tool_result" && inFlightToolUseIds.delete(completedEvent.toolUseId), completedEvent && runOptions.onExecutionEvent?.(completedEvent);
                                    break
                                }
                                case "item/reasoning/summaryTextDelta":
                                case "item/reasoning/textDelta": {
                                    let reasoningDelta = notificationParams.delta ?? "";
                                    reasoningDelta && runOptions.onExecutionEvent?.({
                                        type: "thought_chunk",
                                        text: reasoningDelta
                                    });
                                    break
                                }
                                case "thread/tokenUsage/updated": {
                                    let tokenUsage = notificationParams.tokenUsage;
                                    usageState = computeCodexTurnUsage(usageState, tokenUsage?.total, tokenUsage?.last);
                                    break
                                }
                                case "turn/completed": {
                                    threadId === id && settleOnce(() => resolve());
                                    break
                                }
                                case "error": {
                                    let errorMessage = notificationParams.error?.message ?? "";
                                    if (/^(Reconnecting|Connecting)\b/.test(errorMessage)) {
                                        logInfoMessage("[codex-transport] transient reconnect notice", {
                                            message: errorMessage,
                                            threadId: id,
                                            turnId: currentTurnId
                                        });
                                        break
                                    }
                                    settleOnce(() => reject(new Error(errorMessage || "codex app-server error notification")));
                                    break
                                }
                            }
                        },
                        detachListener = () => {
                            transport?.removeListener("notification", onNotification)
                        };
                    if (transport.on("notification", onNotification), runOptions.abortController) {
                        let onAbort = () => {
                            let turnAbortReason = normalizeTurnAbortReason(runOptions.abortController?.signal.reason);
                            turnAbortReason && (pendingInterrupt = {
                                reason: turnAbortReason,
                                toolInFlight: inFlightToolUseIds.size > 0
                            });
                            let promise2 = new Promise((resolveTimeout, rejectTimeout) => setTimeout(() => rejectTimeout(new Error("turnId timeout on abort")), 2e3));
                            Promise.race([promise, promise2]).then(resolvedTurnId => {
                                transport?.request("turn/interrupt", {
                                    threadId: id,
                                    turnId: resolvedTurnId
                                }).catch(() => {})
                            }).catch(() => {});
                            let error = new Error("turn aborted");
                            error.name = "AbortError", settleOnce(() => reject(error))
                        };
                        runOptions.abortController.signal.addEventListener("abort", onAbort, {
                            once: !0
                        })
                    }
                });
            try {
                runOptions.onTurnAcknowledged?.()
            } catch {}
            let codexTurnInput = buildCodexTurnInput(promptText, runOptions.attachments),
                interruptMarkerText = takeInterruptMarkerText();
            interruptMarkerText && codexTurnInput.unshift({
                type: "text",
                text: interruptMarkerText,
                text_elements: []
            });
            let turnStartResponse;
            try {
                turnStartResponse = await transport.request("turn/start", {
                    threadId: id,
                    input: codexTurnInput,
                    model: requestedModel,
                    effort,
                    outputSchema: runOptions.outputFormat ?? null
                }, runOptions.abortController?.signal)
            } catch (err) {
                if (typeof err.code == "number" && err.name !== "AbortError") try {
                    runOptions.onTurnRejected?.()
                } catch {}
                throw err
            }
            currentTurnId = turnStartResponse.turn?.id, currentTurnId && resolveTurnId?.(currentTurnId), currentTurnId && (activeTurn = {
                threadId: id,
                turnId: currentTurnId,
                abortSignal: runOptions.abortController?.signal,
                startedAt: now
            }), runOptions.abortController?.signal.aborted && currentTurnId && transport.request("turn/interrupt", {
                threadId: id,
                turnId: currentTurnId
            }).catch(() => {});
            try {
                await promise2
            } finally {
                activeTurn && activeTurn.turnId === currentTurnId && (activeTurn = null)
            }
            let text = textChunks.join(""),
                usage = usageState.usage ? {
                    ...usageState.usage,
                    model
                } : void 0;
            return {
                sessionId: id,
                text: text || void 0,
                attachments: map.size > 0 ? Array.from(map.values()) : void 0,
                usage,
                firstTokenLatencyMs
            }
        },
        async compact(compactOptions) {
            let triggeredAt = new Date().toISOString(),
                abortController = new AbortController,
                forwardAbort;
            compactOptions.abortController && (forwardAbort = () => abortController.abort(), compactOptions.abortController.signal.addEventListener("abort", forwardAbort, {
                once: !0
            }));
            try {
                await attachToThread(compactOptions.sessionId, compactOptions.cwd ?? process.cwd(), abortController.signal)
            } catch (err) {
                return forwardAbort && compactOptions.abortController?.signal.removeEventListener("abort", forwardAbort), compactOptions.abortController?.signal.aborted === !0 || err instanceof Error && err.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: triggeredAt
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: `failed to attach to thread: ${err instanceof Error?err.message.split(`
`)[0]:String(err)}`,
                    triggered_at: triggeredAt
                }
            }
            let compactResult, setResultOnce = result => {
                    compactResult || (compactResult = result)
                },
                promise = new Promise(resolve => {
                    let onNotification = notification => {
                            let notificationParams = notification.params ?? {};
                            if (notification.method === "thread/compacted") {
                                setResultOnce({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: triggeredAt
                                }), detachListener(), resolve();
                                return
                            }
                            if (notification.method === "item/completed" && notificationParams.item?.type === "contextCompaction") {
                                setResultOnce({
                                    kind: "succeeded",
                                    runtime: "codex",
                                    triggered_at: triggeredAt
                                }), detachListener(), resolve();
                                return
                            }
                            if (notification.method === "error") {
                                let errorMessage = (notificationParams.error?.message ?? "") || "unknown error";
                                if (/^(Reconnecting|Connecting)\b/.test(errorMessage)) return;
                                setResultOnce({
                                    kind: "failed",
                                    runtime: "codex",
                                    error: errorMessage,
                                    triggered_at: triggeredAt
                                }), detachListener(), resolve()
                            }
                        },
                        detachListener = () => {
                            transport?.removeListener("notification", onNotification)
                        };
                    transport.on("notification", onNotification), abortController.signal.addEventListener("abort", () => {
                        detachListener(), compactResult || setResultOnce({
                            kind: "failed",
                            runtime: "codex",
                            error: "aborted",
                            triggered_at: triggeredAt
                        }), resolve()
                    }, {
                        once: !0
                    })
                });
            try {
                await transport.request("thread/compact/start", {
                    threadId: compactOptions.sessionId
                }, abortController.signal)
            } catch (err) {
                return forwardAbort && compactOptions.abortController?.signal.removeEventListener("abort", forwardAbort), compactOptions.abortController?.signal.aborted === !0 || err instanceof Error && err.name === "AbortError" ? {
                    kind: "failed",
                    runtime: "codex",
                    error: "aborted",
                    triggered_at: triggeredAt
                } : {
                    kind: "failed",
                    runtime: "codex",
                    error: err instanceof Error ? err.message.split(`
`)[0] : String(err),
                    triggered_at: triggeredAt
                }
            }
            return await promise, forwardAbort && compactOptions.abortController?.signal.removeEventListener("abort", forwardAbort), compactResult ?? {
                kind: "noop",
                runtime: "codex",
                reason: "no compaction notification received before stream end",
                triggered_at: triggeredAt
            }
        },
        activeTurnId() {
            return activeTurn?.turnId
        },
        activeTurnStartedAt() {
            return activeTurn?.startedAt
        },
        activeTurnSkipObserved() {
            return activeTurn?.skipObserved === !0
        },
        async steerActiveTurn(text, expectedTurnId, attachments) {
            let turn = activeTurn;
            if (!transport || !transport.isAlive || !turn || turn.turnId !== expectedTurnId) return !1;
            try {
                return await transport.request("turn/steer", {
                    threadId: turn.threadId,
                    expectedTurnId,
                    input: buildCodexTurnInput(text, attachments)
                }, turn.abortSignal), !0
            } catch (err) {
                return logInfoMessage("[codex] turn/steer failed — falling back to new turn", {
                    threadId: turn.threadId,
                    expectedTurnId,
                    error: err instanceof Error ? err.message : String(err)
                }), !1
            }
        },
        async shutdown() {
            await transport?.shutdown(), transport = null, initialized = !1
        }
    }
}
