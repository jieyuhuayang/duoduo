// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: createPiWorkerAdapter  (minified: MA, daemon.pretty.js:75153)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.1, v0.8.2 (maps/history_daemon.json)
// locals: 101 renamed — 9 from the code at the binding (rule), 92 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createPiWorkerAdapter(options) {
    let logDebug = options.logDebug ?? (() => {}),
        logWarn = options.logWarn ?? logDebug,
        worker = null,
        connectPromise = null,
        shutdownPromise = null,
        sessionId, excludeTools, appliedExcludeTools, systemPromptSpec, turnCounter = 0,
        frameWaiters = new Set,
        activeTurn = null,
        waitForFrame = match => {
            let waiter;
            return {
                promise: new Promise((resolve, reject) => {
                    waiter = {
                        match,
                        resolve,
                        reject
                    }, frameWaiters.add(waiter)
                }),
                cancel: () => waiter && frameWaiters.delete(waiter)
            }
        },
        sendFrame = frame => {
            let currentWorker = worker;
            if (currentWorker) {
                if (currentWorker.stdin.writableEnded || currentWorker.stdin.destroyed) {
                    logDebug(`pi adapter: frame dropped, worker stdin closed: ${frame.type}`);
                    return
                }
                currentWorker.stdin.write(encodePiWorkerFrame(frame))
            }
        },
        resolveFrameWaiter = incomingFrame => {
            for (let candidate of frameWaiters)
                if (candidate.match(incomingFrame)) {
                    frameWaiters.delete(candidate), candidate.resolve(incomingFrame);
                    return
                }
        },
        clearActiveTurn = () => {
            activeTurn = null
        },
        handleExecFrame = execFrame => {
            let turn = activeTurn;
            if (!turn || turn.turnId !== execFrame.turn_id) return;
            let event = execFrame.event,
                executionEvent = null;
            if (event.kind === "tool_start") {
                let toolInput = event.args_json === "" ? void 0 : event.args_json;
                try {
                    event.args_json !== "" && (toolInput = JSON.parse(event.args_json))
                } catch {}
                executionEvent = {
                    type: "tool_use",
                    toolUseId: event.tool_call_id,
                    toolName: event.tool_name,
                    input: toolInput
                }
            } else event.kind === "tool_delta" ? executionEvent = {
                type: "tool_input_delta",
                toolUseId: event.tool_call_id,
                toolName: event.tool_name,
                partialJson: event.delta
            } : (event.tool_name === "Skip" && (turn.skipObserved = !0), options.onToolEnd && turn.pendingToolEndEffects.push(Promise.resolve(options.onToolEnd({
                tool_name: event.tool_name,
                result_json: event.result_json,
                is_error: event.is_error
            })).catch(err => {
                logDebug(`pi adapter: tool-end effect failed: ${String(err)}`)
            })), executionEvent = {
                type: "tool_result",
                toolUseId: event.tool_call_id,
                toolName: event.tool_name,
                isError: event.is_error,
                summary: event.result_json
            });
            turn.onExecutionEvent?.(executionEvent)
        },
        handleFrame = frame => {
            switch (frame.type) {
                case "stream":
                    activeTurn && activeTurn.turnId === frame.turn_id && activeTurn.onStream?.(frame.delta);
                    return;
                case "thought":
                    activeTurn && activeTurn.turnId === frame.turn_id && activeTurn.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: frame.delta
                    });
                    return;
                case "exec":
                    handleExecFrame(frame);
                    return;
                case "notify":
                    options.onNotify?.(frame.text);
                    return;
                case "run_ack":
                    frame.accepted && activeTurn && activeTurn.turnId === frame.turn_id && (activeTurn.acceptedAt = Date.now()), resolveFrameWaiter(frame);
                    return;
                case "orphan_run":
                    logDebug(`pi adapter: orphan_run ${frame.phase}`);
                    return;
                default: {
                    if (!Rbt.has(frame.type)) {
                        logDebug(`pi adapter: unknown frame type ignored: ${String(frame.type)}`);
                        return
                    }
                    resolveFrameWaiter(frame)
                }
            }
        },
        handleWorkerGone = error => {
            worker = null, shutdownPromise || (connectPromise = null);
            for (let waiter of [...frameWaiters]) frameWaiters.delete(waiter), waiter.reject(error);
            clearActiveTurn()
        },
        connectWorker = async isCurrent => {
            let pendingShutdown = shutdownPromise;
            if (pendingShutdown && (await pendingShutdown, !isCurrent())) throw new Error("pi adapter: connect cancelled by shutdown");
            let child = QEe(options.workerCommand.command, options.workerCommand.args, {
                cwd: options.cwd,
                env: {
                    ...process.env,
                    ...options.env
                },
                stdio: ["pipe", "pipe", "pipe"]
            });
            worker = child, child.on("error", err => {
                worker === child && handleWorkerGone(err)
            }), child.on("exit", exitCode => {
                worker === child && handleWorkerGone(new Error(`pi worker exited (code ${String(exitCode)})`))
            }), attachStreamLineReader(child.stdout, line => {
                if (worker !== child) return;
                let parsedFrame = bJ(line);
                if (!parsedFrame) {
                    line.trim() && logDebug("pi adapter: non-frame stdout line skipped");
                    return
                }
                handleFrame(parsedFrame)
            }), child.stderr.on("data", chunk => {
                for (let stderrLine of chunk.toString().split(`
`)) stderrLine.trim() && logDebug(`pi worker: ${stderrLine}`)
            }), child.stdin.on("error", err => {
                logDebug(`pi adapter: worker stdin error: ${String(err)}`)
            });
            let readyWaiter = waitForFrame(frame => frame.type === "ready" || frame.type === "init_error");
            sendFrame({
                type: "init",
                cwd: options.cwd,
                agent_dir: options.agentDir,
                session: {
                    id: options.sdkSessionId,
                    in_memory: options.inMemorySession
                },
                session_dir: options.sessionDir,
                auth_path: options.authPath,
                models_path: options.modelsPath,
                models_store_path: options.modelsStorePath,
                settings_seed: options.settingsSeed,
                resources: options.resources,
                model: options.model,
                exclude_tools: excludeTools,
                thinking_level: options.thinkingLevel,
                system_prompt: systemPromptSpec
            });
            try {
                let promise = await readyWaiter.promise;
                if (promise.type === "init_error") throw new Error(`pi worker init failed: ${promise.reason}`);
                if (promise.type !== "ready") throw new Error("pi worker: unexpected frame before ready");
                return sessionId = promise.session_id, appliedExcludeTools = excludeTools, logDebug(`pi adapter: ready session=${sessionId}`), sessionId
            } finally {
                readyWaiter.cancel()
            }
        }, connect = () => {
            if (!connectPromise) {
                let attempt = connectWorker(() => connectPromise === attempt).catch(err => {
                    throw connectPromise === attempt && (connectPromise = null), err
                });
                connectPromise = attempt
            }
            return connectPromise
        }, run = async input => {
            if (typeof input.prompt != "string") throw new Error("pi adapter: prompt must be a string (streaming generators are claude-only)");
            if (activeTurn) throw new Error("pi adapter: a run is already in flight (single-inflight violation)");
            if (input.abortController?.signal.aborted) throw new AgentSdkPromptNotAcceptedAbortError;
            input.tools && logWarn("pi adapter: RunInput.tools carries the claude builtin surface — ignored on pi (§3 no-op table)");
            let turnId = `pi-turn-${++turnCounter}-${Date.now()}`;
            activeTurn = {
                turnId,
                acceptedAt: void 0,
                skipObserved: !1,
                pendingToolEndEffects: [],
                onStream: input.onStream,
                onExecutionEvent: input.onExecutionEvent
            };
            let turn = activeTurn,
                sendAbort = () => sendFrame({
                    type: "abort",
                    turn_id: turnId,
                    reason: normalizeTurnAbortReason(input.abortController?.signal.reason)
                });
            input.abortController?.signal.addEventListener("abort", sendAbort, {
                once: !0
            });
            try {
                let excludedTools = xbt(input.disallowedTools);
                !worker && !connectPromise ? (excludeTools = excludedTools, systemPromptSpec = buildPiSystemPromptSpec(input.systemPrompt)) : Ebt(appliedExcludeTools ?? excludeTools, excludedTools) || logDebug("pi adapter: disallowedTools changed after worker init — exclusions apply after the worker recycles");
                let abortSignal = input.abortController?.signal;
                if (abortSignal) {
                    let detachAbortListener, promise = new Promise((resolve, reject) => {
                        let onAbort = () => reject(new AgentSdkPromptNotAcceptedAbortError);
                        abortSignal.addEventListener("abort", onAbort, {
                            once: !0
                        }), detachAbortListener = () => abortSignal.removeEventListener("abort", onAbort)
                    });
                    promise.catch(() => {});
                    try {
                        await Promise.race([connect(), promise])
                    } catch (err) {
                        throw err instanceof AgentSdkPromptNotAcceptedAbortError && shutdown(), err
                    } finally {
                        detachAbortListener?.()
                    }
                } else await connect();
                if (input.abortController?.signal.aborted) throw new AgentSdkPromptNotAcceptedAbortError;
                let images = XEe(input.attachments),
                    ackWaiter = waitForFrame(frame => frame.type === "run_ack" && frame.turn_id === turnId),
                    settledWaiter = waitForFrame(frame => frame.type === "settled" && frame.turn_id === turnId);
                settledWaiter.promise.catch(() => {}), sendFrame({
                    type: "run",
                    turn_id: turnId,
                    prompt: input.prompt,
                    images: images.length > 0 ? images : void 0
                });
                let promise = await ackWaiter.promise;
                if (!promise.accepted) throw settledWaiter.cancel(), input.onTurnRejected?.(), new Error(`pi worker rejected run: ${promise.reason??"unknown"}`);
                input.onTurnAcknowledged?.();
                let promise2 = await settledWaiter.promise;
                if (promise2.aborted) {
                    if (turn.skipObserved) return {
                        sessionId,
                        text: promise2.text,
                        structured: void 0,
                        usage: YEe(promise2.usage, options.model),
                        firstTokenLatencyMs: promise2.first_token_latency_ms,
                        skipped: !0
                    };
                    throw new AgentSdkTurnInterruptedError
                }
                if (promise2.error) throw new Error(`pi run failed: ${promise2.error}`);
                return {
                    sessionId,
                    text: promise2.text,
                    structured: void 0,
                    usage: YEe(promise2.usage, options.model),
                    firstTokenLatencyMs: promise2.first_token_latency_ms,
                    skipped: turn.skipObserved
                }
            } finally {
                input.abortController?.signal.removeEventListener("abort", sendAbort), turn.pendingToolEndEffects.length > 0 && await Promise.all(turn.pendingToolEndEffects), activeTurn === turn && clearActiveTurn()
            }
        }, steerActiveTurn = async (text, turnId, attachments) => {
            if (!worker || !activeTurn?.acceptedAt || activeTurn.turnId !== turnId) return !1;
            let images = XEe(attachments),
                steerWaiter = waitForFrame(frame => frame.type === "steer_result" && frame.turn_id === turnId);
            return sendFrame({
                type: "steer",
                turn_id: turnId,
                text,
                images: images.length > 0 ? images : void 0
            }), (await steerWaiter.promise).landed
        }, compact = async compactInput => {
            let triggeredAt = new Date().toISOString(),
                abortCompact = () => sendFrame({
                    type: "abort",
                    turn_id: "compact"
                }),
                wasCold = !worker && !connectPromise;
            try {
                await connect(), compactInput.abortController?.signal.addEventListener("abort", abortCompact, {
                    once: !0
                });
                let compactWaiter = waitForFrame(frame => frame.type === "compact_result");
                sendFrame({
                    type: "compact"
                });
                let outcome = (await compactWaiter.promise).outcome;
                return outcome.kind === "succeeded" ? {
                    kind: "succeeded",
                    runtime: DA,
                    pre_input_tokens: outcome.pre_input_tokens,
                    summary_excerpt: outcome.summary_excerpt,
                    triggered_at: triggeredAt
                } : outcome.kind === "noop" ? {
                    kind: "noop",
                    runtime: DA,
                    reason: outcome.reason,
                    triggered_at: triggeredAt
                } : {
                    kind: "failed",
                    runtime: DA,
                    error: outcome.error,
                    triggered_at: triggeredAt
                }
            } catch (err) {
                return {
                    kind: "failed",
                    runtime: DA,
                    error: String(err.message ?? err),
                    triggered_at: triggeredAt
                }
            } finally {
                compactInput.abortController?.signal.removeEventListener("abort", abortCompact), wasCold && await shutdown()
            }
        }, stopWorkerProcess = async child => {
            if (child.exitCode !== null || child.signalCode !== null) return;
            let promise = new Promise(resolve => {
                    child.once("exit", () => resolve())
                }),
                waitForExit = timeoutMs => new Promise(resolveWait => {
                    let timer = setTimeout(() => resolveWait(!1), timeoutMs);
                    promise.then(() => {
                        clearTimeout(timer), resolveWait(!0)
                    })
                });
            child.stdin.end(), !await waitForExit(KEe) && (child.kill("SIGTERM"), !await waitForExit(KEe) && (child.kill("SIGKILL"), await promise))
        }, shutdown = () => {
            if (connectPromise = null, shutdownPromise) return shutdownPromise;
            let child = worker;
            if (!child) return Promise.resolve();
            let stopPromise = stopWorkerProcess(child).finally(() => {
                worker === child && (worker = null), shutdownPromise = null
            });
            return shutdownPromise = stopPromise, stopPromise
        };
    return {
        run,
        compact,
        steerActiveTurn,
        activeTurnId: () => activeTurn?.acceptedAt !== void 0 ? activeTurn.turnId : void 0,
        activeTurnStartedAt: () => activeTurn?.acceptedAt,
        activeTurnSkipObserved: () => activeTurn?.skipObserved === !0,
        shutdown,
        connect
    }
}
