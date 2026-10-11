// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createClaudeStreamingSessionFactory  (minified: KRe, daemon.pretty.js:83211)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.1, v0.8.2, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 161 renamed — 50 from the code at the binding (rule), 111 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createClaudeStreamingSessionFactory(deps) {
    let {
        paths,
        bus,
        resolvedSdk,
        classifyModelTargetAgainstLiveGeneration
    } = deps;
    async function recordTaskNotification(sessionKey, message) {
        let notification = message,
            taskId = String(notification.task_id ?? "unknown"),
            status = String(notification.status ?? "completed"),
            summary = String(notification.summary ?? ""),
            outputFile = String(notification.output_file ?? "");
        try {
            let deliveryResult = await deliverRouteEventToSession(paths, bus, {
                traceId: `task-notify-${taskId}`,
                routeId: "task_notification",
                sourceName: "sdk_subagent",
                targetSessionKey: sessionKey,
                sourceSessionKey: sessionKey,
                eventType: "notify",
                walOnly: !0,
                payload: {
                    task_id: taskId,
                    task_status: status,
                    task_summary: summary || void 0,
                    task_output_file: outputFile || void 0,
                    completion_owner: "claude-cli"
                }
            });
            logDebugMessage("[session-manager] task_notification recorded WAL-only", {
                sessionKey,
                taskId,
                status,
                success: deliveryResult.success
            })
        } catch (err) {
            logErrorMessage("[session-manager] task_notification WAL record failed", {
                sessionKey,
                taskId,
                status,
                error: err instanceof Error ? err.message : String(err)
            })
        }
    }
    async function applyDrainEffort(actor, state, config) {
        let effort = config.effort ?? null;
        if (state.lastAppliedEffort === effort) return;
        let query = actor.query;
        if (!(!query || typeof query.applyFlagSettings != "function")) try {
            await query.applyFlagSettings({
                effortLevel: effort
            }), state.lastAppliedEffort = effort
        } catch (err) {
            logWarnMessage("[session-manager] failed to apply drain effort to the live session", {
                sessionKey: actor.sessionKey,
                effort: effort ?? "(runtime default)",
                error: err instanceof Error ? err.message : String(err)
            })
        }
    }
    async function ensureStreamingSession(actor, config) {
        if (!resolvedSdk.createStreamingQuery) throw new Error("Streaming query support unavailable");
        let liveStreamContextToken = readLiveStreamContextToken(actor),
            contextCapToken = resolveContextCapToken({
                requirement: config.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: liveStreamContextToken
            }),
            contextProfileSignature = computeContextProfileSignature({
                capToken: contextCapToken,
                requirement: config.claudeContextRequirement,
                aliases: config.claudeModelAliases
            }),
            streamingConfigSignature = computeStreamingConfigSignature(config, contextProfileSignature),
            sessionId = config.sessionId;
        if (actor.streamingState && !actor.streamingState.closed && !actor.streamingState.needsRecreation && actor.streamingState.configSignature === streamingConfigSignature && (actor.streamingState.hasAcceptedTurn || actor.streamingState.initialSessionId === sessionId)) return await applyDrainEffort(actor, actor.streamingState, config), actor.streamingState;
        let streamingState = actor.streamingState,
            teardownReason;
        if (streamingState && !streamingState.closed)
            if (streamingState.configSignature !== streamingConfigSignature) {
                let signatureDiff = diffStreamingConfigSignature(streamingState.configSignature, streamingConfigSignature);
                logAlwaysAtLevel("warn", "[kv-cache] respawn: signature-mismatch", {
                    sessionKey: actor.sessionKey,
                    generation: actor.streamingGeneration,
                    sdk_session_id: actor.sdkSessionId ?? null,
                    diff: signatureDiff
                }), signatureDiff.some(entry => entry.startsWith(`${SN}:`)) && (teardownReason = "model-context-profile-change")
            } else streamingState.needsRecreation ? logDebugMessage("[kv-cache] respawn: recreation-requested (already audited at source)", {
                sessionKey: actor.sessionKey,
                generation: actor.streamingGeneration,
                sdk_session_id: actor.sdkSessionId ?? null
            }) : logAlwaysAtLevel("warn", "[kv-cache] respawn: resume-sessionid-change", {
                sessionKey: actor.sessionKey,
                generation: actor.streamingGeneration,
                sdk_session_id: actor.sdkSessionId ?? null,
                requested_session_id: sessionId ?? null
            });
        await teardownStreamingSession(actor, teardownReason);
        let contextCapToken2 = resolveContextCapToken({
                requirement: config.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: void 0
            }),
            spawnDeliveryToken = contextCapToken2 === contextCapToken ? contextProfileSignature : computeContextProfileSignature({
                capToken: contextCapToken2,
                requirement: config.claudeContextRequirement,
                aliases: config.claudeModelAliases
            }),
            configSignature = spawnDeliveryToken === contextProfileSignature ? streamingConfigSignature : computeStreamingConfigSignature(config, spawnDeliveryToken),
            turnQueue = new TN,
            abortController = new AbortController,
            mcpServers = config.mcpServersFactory ? config.mcpServersFactory() : config.mcpServers,
            claudeCostBaseline = resolveClaudeCostBaseline(sessionId, config.costBaseline),
            newState = {
                queue: turnQueue,
                abortController,
                configSignature,
                initialSessionId: sessionId,
                hasAcceptedTurn: !1,
                needsRecreation: !1,
                closed: !1,
                currentTurn: null,
                loopPromise: Promise.resolve(),
                cliTurnTentative: null,
                spawnMaxContextToken: contextCapToken2,
                spawnDeliveryToken,
                liveModel: config.model,
                lastAppliedEffort: config.effort ?? null,
                ...claudeCostBaseline && "prevTotalCostUsd" in claudeCostBaseline ? {
                    lastTotalCostUsd: claudeCostBaseline.prevTotalCostUsd,
                    lastModelUsage: claudeCostBaseline.prevModelUsage
                } : {}
            },
            rejectQueuedTurns = makeError => {
                for (let queuedTurn of turnQueue.drain()) queuedTurn.reject(makeError())
            };
        async function* promptGenerator() {
            for (; !abortController.signal.aborted;) {
                let turn;
                try {
                    turn = await turnQueue.dequeue(abortController.signal)
                } catch (err) {
                    if (err instanceof Error && err.name === "AbortError") return;
                    throw err
                }
                let currentTurn = newState.currentTurn;
                if (currentTurn !== null && currentTurn !== turn) {
                    logWarnMessage("[session-manager] drain turn dequeued while the slot is occupied — rejected", {
                        sessionKey: actor.sessionKey,
                        occupantAccepted: currentTurn.accepted
                    }), turn.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming slot occupied — prompt not yielded; retry after the occupant settles"));
                    continue
                } else newState.currentTurn = turn, newState.cliTurnTentative && (newState.cliTurnTentative.compromised = !0), turn.accepted = !1, turn.streamedText = "", turn.turnStreamedText = "", turn.toolUseMap.clear();
                for await (let promptMessage of turn.input.prompt) yield promptMessage
            }
        }
        let sessionId2 = config.sessionId,
            {
                query
            } = resolvedSdk.createStreamingQuery({
                prompt: promptGenerator(),
                abortController,
                sessionId: sessionId2,
                cwd: config.cwd,
                settingSources: config.settingSources,
                persistSession: config.persistSession,
                permissionMode: config.permissionMode,
                allowedTools: config.allowedTools,
                disallowedTools: config.disallowedTools,
                tools: config.tools,
                effort: config.effort,
                effortOrigin: config.effortOrigin,
                model: config.model,
                claudeContextRequirement: config.claudeContextRequirement,
                claudeSettingsPath: config.claudeSettingsPath,
                mcpServers,
                additionalDirectories: config.additionalDirectories,
                autoloadAdditionalDirectoryClaudeMd: config.autoloadAdditionalDirectoryClaudeMd,
                callerSession: config.callerSession,
                systemPrompt: config.systemPrompt,
                hooks: {
                    PreToolUse: [{
                        matcher: "*",
                        hooks: [async hookInput => {
                            let preToolInput = hookInput,
                                transcriptPath = preToolInput.transcript_path;
                            return typeof transcriptPath == "string" && transcriptPath.length > 0 && preToolInput.agent_id === void 0 && actor.lastTranscriptPath !== transcriptPath && (actor.lastTranscriptPath = transcriptPath, patchSessionRuntimeState(paths, actor.sessionKey, {
                                transcript_path: transcriptPath
                            }).catch(() => {})), {}
                        }]
                    }, {
                        matcher: wc,
                        hooks: [async hookInput => {
                            let isSubagent = hookInput?.agent_id !== void 0,
                                turn = isSubagent ? null : newState.currentTurn;
                            return turn ? turn.skipCalled = !0 : !isSubagent && newState.cliTurnTentative && (newState.cliTurnTentative.skipObserved = !0), {
                                continue: !1,
                                stopReason: "The agent intentionally ended this turn silently by calling Skip."
                            }
                        }]
                    }],
                    PostToolUse: [{
                        matcher: "*",
                        hooks: [async hookInput => {
                            let additionalContexts = [];
                            if (hookInput?.agent_id !== void 0) return {};
                            if (newState.currentTurn?.skipCalled === !0) return {};
                            if (newState.cliTurnTentative?.skipObserved === !0) return {};
                            let pendingSteer = actor.pendingSteer;
                            if (pendingSteer && (actor.pendingSteer = null, !pendingSteer.settled)) {
                                pendingSteer.settled = !0;
                                try {
                                    await deleteMailboxPendingItemsByEventIds(paths, actor.sessionKey, pendingSteer.eventIds)
                                } catch (err) {
                                    logInfoMessage("[session-manager] steer hook markDone error", {
                                        sessionKey: actor.sessionKey,
                                        error: String(err)
                                    })
                                }
                                for (let eventId of pendingSteer.claimedEventIds) actor.inflightEventIds.delete(eventId);
                                logInfoMessage("[session-manager] steer hook: injected interjection mid-turn", {
                                    sessionKey: actor.sessionKey,
                                    eventIds: pendingSteer.eventIds
                                }), additionalContexts.push(pendingSteer.steerText)
                            }
                            return additionalContexts.length === 0 ? {} : {
                                hookSpecificOutput: {
                                    hookEventName: "PostToolUse",
                                    additionalContext: additionalContexts.join(`

`)
                                }
                            }
                        }]
                    }]
                }
            });
        actor.query = query, actor.streamAbortController = abortController, actor.streamingState = newState, actor.spawnBoardHash = config.boardHash, actor.streamingGeneration += 1;
        let streamingGeneration = actor.streamingGeneration,
            model = config.model,
            canSetModel = typeof query.setModel == "function",
            canApplyFlagSettings = typeof query.applyFlagSettings == "function";
        if (canSetModel || canApplyFlagSettings) {
            let runtimeState = await readSessionRuntimeState(paths, actor.sessionKey).catch(() => null);
            if (canSetModel) {
                let persistedModel = runtimeState ? runtimeState.model ?? null : void 0,
                    spawnModel = config.claudeContextRequirement?.modelOrigin !== void 0 ? null : config.model ?? null;
                if (persistedModel !== void 0 && persistedModel !== spawnModel && !abortController.signal.aborted) {
                    let reconcileOutcome = "compatible",
                        requirementKind;
                    try {
                        let classification = await classifyModelTargetAgainstLiveGeneration(actor.sessionKey, actor, persistedModel);
                        reconcileOutcome = classification.outcome, classification.outcome !== "blocked" && (requirementKind = classification.requirementKind)
                    } catch (err) {
                        logWarnMessage("[session-manager] spawn-time model reconcile failed to read config", {
                            sessionKey: actor.sessionKey,
                            model: persistedModel ?? "(reset to default)",
                            error: err instanceof Error ? err.message : String(err)
                        }), reconcileOutcome = "config-unreadable"
                    }
                    if (reconcileOutcome !== "compatible") logWarnMessage("[session-manager] deferring spawn-time model re-apply — context profile differs from this generation", {
                        sessionKey: actor.sessionKey,
                        generation: streamingGeneration,
                        deferred_model: persistedModel ?? "(reset to default)",
                        running_model: config.model ?? "(runtime default)",
                        outcome: reconcileOutcome
                    });
                    else try {
                        await query.setModel(persistedModel ?? void 0), model = persistedModel ?? void 0, newState.liveModel = persistedModel ?? void 0
                    } catch (err) {
                        logWarnMessage("[session-manager] failed to re-apply session model override — keeping it for the next spawn", {
                            sessionKey: actor.sessionKey,
                            model: persistedModel ?? "(reset to default)",
                            running_model: config.model ?? "(runtime default)",
                            error: err instanceof Error ? err.message : String(err)
                        }), persistedModel !== null && flagStreamRecreationOnModelReject(actor, {
                            model: persistedModel,
                            requirementKind,
                            reason: "spawn-reconcile"
                        })
                    }
                }
            }
            if (canApplyFlagSettings && !abortController.signal.aborted) {
                let persistedEffort = runtimeState?.effort ?? null,
                    spawnEffort = config.effortOrigin !== void 0 ? null : config.effort ?? null;
                if (persistedEffort !== spawnEffort) try {
                    await query.applyFlagSettings({
                        effortLevel: persistedEffort
                    }), actor.streamingState && (actor.streamingState.lastAppliedEffort = persistedEffort)
                } catch (err) {
                    logWarnMessage("[session-manager] failed to re-apply session effort override at spawn", {
                        sessionKey: actor.sessionKey,
                        effort: persistedEffort ?? "(reset to default)",
                        error: err instanceof Error ? err.message : String(err)
                    })
                }
            }
        }
        logAlwaysAtLevel("info", "[kv-cache] streaming subprocess spawned", {
            sessionKey: actor.sessionKey,
            generation: streamingGeneration,
            model: model ?? "default",
            context_profile_source: describeContextProfileSource(config.claudeContextRequirement),
            max_context_token: contextCapToken2,
            ...extractProfiledEndpointFields(config.claudeContextRequirement),
            alias_tiers: listSortedAliasKeys(config.claudeModelAliases),
            board_hash: config.boardHash ? config.boardHash.slice(0, 12) : null
        });
        let emitStream = (turn, text, isDelta, isSidechain = !1) => {
                if (text && !turn.skipCalled) {
                    if (isSidechain) {
                        turn.input.onStream?.(text, !0);
                        return
                    }
                    if (isDelta) {
                        turn.streamedText += text, turn.turnStreamedText += text, turn.input.onStream?.(text, !1);
                        return
                    }
                    if (turn.turnStreamedText && text.startsWith(turn.turnStreamedText)) {
                        let suffix = text.slice(turn.turnStreamedText.length);
                        suffix && (turn.streamedText += suffix, turn.turnStreamedText = text, turn.input.onStream?.(suffix, !1));
                        return
                    }
                    if (text.startsWith(turn.streamedText)) {
                        let suffix = text.slice(turn.streamedText.length);
                        suffix && (turn.streamedText = text, turn.turnStreamedText += suffix, turn.input.onStream?.(suffix, !1));
                        return
                    }
                    turn.streamedText += text, turn.turnStreamedText += text, turn.input.onStream?.(text, !1)
                }
            },
            settlePendingSteer = async () => {
                let pendingSteer = actor.pendingSteer;
                if (pendingSteer && (actor.pendingSteer = null, !pendingSteer.settled)) {
                    if (newState.closed) {
                        pendingSteer.settled = !0;
                        let requeuedEventIds = [];
                        for (let i = 0; i < pendingSteer.requeueLines.length; i += 1) {
                            let line = pendingSteer.requeueLines[i],
                                eventId = pendingSteer.requeueEventIds[i];
                            try {
                                await enqueueSessionInboxLine(paths, actor.sessionKey, line), requeuedEventIds.push(eventId)
                            } catch (err) {
                                logWarnMessage("[session-manager] steer fallback closed-stream requeue failed", {
                                    sessionKey: actor.sessionKey,
                                    eventId,
                                    error: err instanceof Error ? err.message : String(err)
                                })
                            }
                        }
                        let doneEventIds = [...requeuedEventIds, ...pendingSteer.processedEventIds];
                        if (doneEventIds.length > 0) try {
                            await deleteMailboxPendingItemsByEventIds(paths, actor.sessionKey, doneEventIds)
                        } catch (err) {
                            logInfoMessage("[session-manager] steer fallback closed markDone error", {
                                sessionKey: actor.sessionKey,
                                error: String(err)
                            })
                        }
                        for (let eventId of pendingSteer.claimedEventIds) actor.inflightEventIds.delete(eventId);
                        actor.pendingWake = !0, logInfoMessage("[session-manager] steer fallback requeued to inbox (stream closed)", {
                            sessionKey: actor.sessionKey,
                            eventIds: pendingSteer.eventIds,
                            requeued: requeuedEventIds.length,
                            requeueFailed: pendingSteer.requeueLines.length - requeuedEventIds.length
                        });
                        return
                    }
                    pendingSteer.settled = !0;
                    try {
                        await pendingSteer.enqueueAsNewTurn()
                    } catch (err) {
                        logInfoMessage("[session-manager] steer fallback enqueue error", {
                            sessionKey: actor.sessionKey,
                            error: String(err)
                        })
                    }
                }
            }, buildCostBaseline = sdkSessionId => buildClaudeCostBaseline(sdkSessionId, newState.lastTotalCostUsd, newState.lastModelUsage), isTaskNotificationResult = result => result.origin?.kind === "task-notification", appendCliTurnRecord = async (resultMessage, usage, outputChars, settledAt) => {
                let result = resultMessage,
                    durationMs = typeof result.duration_ms == "number" && Number.isFinite(result.duration_ms) && result.duration_ms >= 0 ? result.duration_ms : 0,
                    sdkDurationMs = typeof result.duration_api_ms == "number" && Number.isFinite(result.duration_api_ms) && result.duration_api_ms >= 0 ? result.duration_api_ms : 0;
                try {
                    await appendDrainRecord(paths, {
                        origin: "cli-turn",
                        id: cbt(),
                        session_key: actor.sessionKey,
                        sdk_session_id: actor.sdkSessionId,
                        drain_started_at: new Date(settledAt - durationMs).toISOString(),
                        drain_duration_ms: durationMs,
                        sdk_duration_ms: sdkDurationMs,
                        events_processed: 0,
                        events_skipped: 0,
                        tool_calls: 0,
                        tool_errors: 0,
                        output_chars: outputChars,
                        cancelled: !1,
                        usage
                    })
                } catch (err) {
                    logErrorMessage("[completion-owner] CLI turn ledger write failed", {
                        sessionKey: actor.sessionKey,
                        generation: actor.streamingGeneration,
                        error: err instanceof Error ? err.message : String(err)
                    })
                }
            };
        return newState.loopPromise = (async () => {
            let initAcceptedTurn = null,
                unspokenCompletion;
            try {
                for await (let sdkMessage of query) {
                    let msg = sdkMessage;
                    actor.lastActivityAt = Date.now();
                    let prevModelUsage, prevTotalCostUsd, baselineUnknown = !1,
                        resultInitTurn = null;
                    if (msg.type === "result") {
                        prevModelUsage = newState.lastModelUsage, prevTotalCostUsd = newState.lastTotalCostUsd, baselineUnknown = claudeCostBaseline !== void 0 && "baselineUnknown" in claudeCostBaseline && (prevTotalCostUsd === void 0 || prevModelUsage === void 0), resultInitTurn = initAcceptedTurn, initAcceptedTurn = null;
                        let modelUsage = msg.modelUsage;
                        modelUsage !== void 0 && (newState.lastModelUsage = modelUsage);
                        let totalCostUsd = msg.total_cost_usd;
                        typeof totalCostUsd == "number" && (newState.lastTotalCostUsd = totalCostUsd)
                    }
                    if (msg.type === "result" && isTaskNotificationResult(msg)) {
                        let now = Date.now(),
                            cliTurnTentative = newState.cliTurnTentative;
                        newState.cliTurnTentative = null;
                        let currentTurn = newState.currentTurn,
                            skipObserved = cliTurnTentative?.skipObserved ?? !1,
                            usage;
                        if (msg.subtype === "success" && (usage = mapClaudeResultToDrainUsage(msg, {
                                prevModelUsage,
                                prevTotalCostUsd,
                                baselineUnknown
                            }), usage && !skipObserved && typeof query.getContextUsage == "function")) try {
                            let contextUsedTokens = (await query.getContextUsage())?.totalTokens;
                            typeof contextUsedTokens == "number" && Number.isFinite(contextUsedTokens) && contextUsedTokens >= 0 && (usage.context_used_tokens = contextUsedTokens)
                        } catch {}
                        if (actor.lastCliTurnSettledAt = now, actor.lastTurnCompletedAt = now, unspokenCompletion = void 0, currentTurn) {
                            let acceptedByForeignInit = resultInitTurn === currentTurn,
                                installedDuringTentative = cliTurnTentative?.compromised === !0,
                                accepted = currentTurn.accepted;
                            newState.currentTurn = null, currentTurn.accepted = !1, await settlePendingSteer(), currentTurn.reject(new AgentSdkPromptNotAcceptedAbortError("Task-completion turn folded with mailbox drain; retrying the drain")), actor.pendingWake = !0, actor.wakeResolver?.(), await appendCliTurnRecord(msg, usage, 0, now), logAlwaysAtLevel("warn", "[completion-owner] voided folded drain", {
                                sessionKey: actor.sessionKey,
                                generation: actor.streamingGeneration,
                                acceptedByForeignInit,
                                installedDuringTentative,
                                wasAccepted: accepted
                            });
                            continue
                        }
                        let outputChars = 0,
                            resultText = msg.subtype === "success" && !skipObserved && typeof msg.result == "string" && msg.result.length > 0 ? msg.result : void 0;
                        if (resultText !== void 0) {
                            let attachments = await readPendingOutboundAttachments(paths, actor.sessionKey).catch(() => {}),
                                outboxRecord = createOutboxRecord({
                                    channel_kind: channelKindFromSessionKey(actor.sessionKey),
                                    session_key: actor.sessionKey,
                                    payload: {
                                        text: resultText,
                                        attachments
                                    }
                                });
                            try {
                                await persistOutboxRecord(paths, outboxRecord), outputChars = resultText.length, bus.emit("session.output", {
                                    sessionKey: actor.sessionKey,
                                    record: outboxRecord
                                })
                            } catch (err) {
                                logErrorMessage("[completion-owner] proactive outbox write failed", {
                                    sessionKey: actor.sessionKey,
                                    generation: actor.streamingGeneration,
                                    error: err instanceof Error ? err.message : String(err)
                                })
                            }
                            outputChars > 0 && attachments && await clearPendingOutboundAttachments(paths, actor.sessionKey).catch(clearErr => logErrorMessage("[completion-owner] pending attachment clear failed", {
                                sessionKey: actor.sessionKey,
                                generation: actor.streamingGeneration,
                                error: clearErr instanceof Error ? clearErr.message : String(clearErr)
                            }))
                        }
                        await appendCliTurnRecord(msg, usage, outputChars, now), actor.pendingWake = !0, actor.wakeResolver?.(), logInfoMessage("[completion-owner] settled CLI completion turn", {
                            sessionKey: actor.sessionKey,
                            generation: actor.streamingGeneration,
                            subtype: msg.subtype,
                            skipped: skipObserved,
                            outputChars
                        });
                        continue
                    }
                    let currentTurn = newState.currentTurn;
                    if (!currentTurn) {
                        if (msg.type === "system" && msg.subtype === "task_notification") {
                            let taskNotification = msg;
                            await recordTaskNotification(actor.sessionKey, msg), unspokenCompletion = {
                                taskId: String(taskNotification.task_id ?? "unknown"),
                                status: String(taskNotification.status ?? "completed"),
                                observedAt: Date.now()
                            };
                            continue
                        }
                        if (msg.type === "system" && msg.subtype === "init") {
                            newState.cliTurnTentative ??= {
                                skipObserved: !1,
                                compromised: !1
                            }, initAcceptedTurn = null;
                            continue
                        }
                        if (msg.type === "result") {
                            let hadTentative = newState.cliTurnTentative !== null;
                            newState.cliTurnTentative = null, logInfoMessage("[session-manager] orphan result received", {
                                sessionKey: actor.sessionKey,
                                subtype: msg.subtype,
                                hadTentative
                            }), actor.pendingWake = !0, actor.wakeResolver?.();
                            continue
                        }
                        continue
                    }
                    if (msg.type === "system") {
                        if (msg.subtype === "task_notification") {
                            let taskNotification = msg;
                            await recordTaskNotification(actor.sessionKey, msg), unspokenCompletion = {
                                taskId: String(taskNotification.task_id ?? "unknown"),
                                status: String(taskNotification.status ?? "completed"),
                                observedAt: Date.now()
                            }
                        }
                        if (msg.subtype === "init") {
                            let firstAccept = !currentTurn.accepted;
                            newState.hasAcceptedTurn = !0, currentTurn.accepted = !0, newState.cliTurnTentative = null, initAcceptedTurn = firstAccept ? currentTurn : null;
                            try {
                                currentTurn.input.onTurnAcknowledged?.()
                            } catch {}
                            currentTurn.sessionId = msg.session_id ?? currentTurn.sessionId, actor.sdkSessionId = msg.session_id ?? actor.sdkSessionId, actor.sdkSessionIdVerified = !0, sessionId2 && msg.session_id && sessionId2 !== msg.session_id && logWarnMessage("[session-manager] SDK session ID mismatch — context lost", {
                                sessionKey: actor.sessionKey,
                                requestedSessionId: sessionId2,
                                actualSessionId: msg.session_id
                            }), msg.session_id && actor.jobStateless !== !0 && await patchSessionRuntimeState(paths, actor.sessionKey, {
                                sdk_session_id: msg.session_id,
                                sdk_session_runtime: "claude"
                            }), actor.pendingPreempt && actor.pendingPreemptBoundary === "accept" && (actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null, interruptActorQuery(actor))
                        }
                        let eventData;
                        msg.subtype === "init" ? eventData = {
                            session_id: msg.session_id
                        } : msg.subtype === "compact_boundary" && msg.compact_metadata && (eventData = {
                            trigger: msg.compact_metadata.trigger,
                            pre_tokens: msg.compact_metadata.pre_tokens,
                            post_tokens: msg.compact_metadata.post_tokens
                        }), currentTurn.input.onExecutionEvent?.({
                            type: "system",
                            subtype: msg.subtype ?? "unknown",
                            data: eventData
                        });
                        continue
                    }
                    if (msg.type === "stream_event") {
                        let isSidechain = hasParentToolUseId(msg);
                        for (let chunk of extractStreamTextDeltas(msg.event)) emitStream(currentTurn, chunk.text, chunk.isDelta, isSidechain);
                        for (let thought of extractStreamThinkingText(msg.event)) currentTurn.input.onExecutionEvent?.({
                            type: "thought_chunk",
                            text: thought
                        });
                        let toolUseBlockStart = parseToolUseBlockStart(msg.event);
                        toolUseBlockStart && (currentTurn.toolBlockIndexMap.set(toolUseBlockStart.index, {
                            toolUseId: toolUseBlockStart.toolUseId,
                            toolName: toolUseBlockStart.toolName
                        }), currentTurn.toolUseMap.set(toolUseBlockStart.toolUseId, toolUseBlockStart.toolName), currentTurn.input.onExecutionEvent?.({
                            type: "tool_use",
                            toolUseId: toolUseBlockStart.toolUseId,
                            toolName: toolUseBlockStart.toolName,
                            input: void 0,
                            ephemeral: !0,
                            isSidechain
                        }));
                        let inputJsonDelta = parseInputJsonDelta(msg.event);
                        if (inputJsonDelta) {
                            let toolBlock = currentTurn.toolBlockIndexMap.get(inputJsonDelta.index);
                            toolBlock && currentTurn.input.onExecutionEvent?.({
                                type: "tool_input_delta",
                                toolUseId: toolBlock.toolUseId,
                                toolName: toolBlock.toolName,
                                partialJson: inputJsonDelta.partialJson
                            })
                        }
                        continue
                    }
                    if (typeof msg.type == "string" && msg.type.includes("assistant")) {
                        let isSidechain = hasParentToolUseId(msg);
                        for (let chunk of extractSdkMessageTextChunks(msg)) emitStream(currentTurn, chunk.text, chunk.isDelta, isSidechain);
                        let messageContent = msg.message?.content;
                        if (Array.isArray(messageContent))
                            for (let block of messageContent) {
                                if (!block || typeof block != "object" || block.type !== "tool_use") continue;
                                let id = block.id,
                                    name = block.name;
                                !id || !name || (currentTurn.toolUseMap.set(id, name), currentTurn.input.onExecutionEvent?.({
                                    type: "tool_use",
                                    toolUseId: id,
                                    toolName: name,
                                    input: block.input,
                                    isSidechain
                                }))
                            }
                        continue
                    }
                    if (msg.type === "user") {
                        let isSidechain = hasParentToolUseId(msg),
                            messageContent = msg.message?.content;
                        if (Array.isArray(messageContent))
                            for (let block of messageContent) {
                                if (!block || typeof block != "object" || block.type !== "tool_result") continue;
                                let toolUseId = block.tool_use_id;
                                toolUseId && (currentTurn.input.onExecutionEvent?.({
                                    type: "tool_result",
                                    toolUseId,
                                    toolName: currentTurn.toolUseMap.get(toolUseId),
                                    isError: block.is_error ?? !1,
                                    summary: stringifyToolResultContent(block.content),
                                    isSidechain
                                }), currentTurn.turnStreamedText = "")
                            }
                        continue
                    }
                    if (msg.type === "result") {
                        if (msg.subtype === "success") {
                            if (typeof msg.result == "string" && (currentTurn.text = msg.result), msg.structured_output !== void 0 && (currentTurn.structured = msg.structured_output), currentTurn.usage = mapClaudeResultToDrainUsage(msg, {
                                    prevModelUsage,
                                    prevTotalCostUsd,
                                    baselineUnknown
                                }), currentTurn.usage && !currentTurn.skipCalled && typeof query.getContextUsage == "function") try {
                                let contextUsedTokens = (await query.getContextUsage())?.totalTokens;
                                typeof contextUsedTokens == "number" && Number.isFinite(contextUsedTokens) && contextUsedTokens >= 0 && (currentTurn.usage.context_used_tokens = contextUsedTokens)
                            } catch {}
                            if (await settlePendingSteer(), newState.currentTurn = null, currentTurn.skipCalled) currentTurn.resolve({
                                sessionId: currentTurn.sessionId ?? actor.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: currentTurn.usage,
                                costBaseline: buildCostBaseline(currentTurn.sessionId ?? actor.sdkSessionId)
                            });
                            else {
                                let text = currentTurn.text ?? (currentTurn.streamedText ? currentTurn.streamedText : void 0);
                                currentTurn.resolve({
                                    sessionId: currentTurn.sessionId ?? actor.sdkSessionId,
                                    text,
                                    structured: currentTurn.structured,
                                    usage: currentTurn.usage,
                                    costBaseline: buildCostBaseline(currentTurn.sessionId ?? actor.sdkSessionId)
                                })
                            }
                            continue
                        }
                        if (msg.subtype === "error_during_execution" && currentTurn.skipCalled) {
                            await settlePendingSteer(), newState.currentTurn = null, currentTurn.resolve({
                                sessionId: currentTurn.sessionId ?? actor.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: currentTurn.usage,
                                costBaseline: buildCostBaseline(currentTurn.sessionId ?? actor.sdkSessionId)
                            });
                            continue
                        }
                        await settlePendingSteer(), newState.currentTurn = null, msg.subtype === "error_during_execution" ? currentTurn.accepted ? currentTurn.reject(new AgentSdkTurnInterruptedError) : actor.pendingClear ? (newState.needsRecreation = !0, currentTurn.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : (newState.needsRecreation = !0, sessionId2 && !actor.sdkSessionIdVerified && (actor.sdkSessionId = void 0, actor.pendingWake = !0, await patchSessionRuntimeState(paths, actor.sessionKey, {
                            sdk_session_id: null,
                            sdk_session_runtime: null,
                            pending_fork_to: null
                        }).catch(() => {}), logWarnMessage("[session-manager] cleared stale sdk_session_id after resume failure", {
                            sessionKey: actor.sessionKey,
                            staleSessionId: sessionId2
                        })), currentTurn.reject(new AgentSdkPromptNotAcceptedAbortError)) : currentTurn.reject(new Error(`Unexpected streaming SDK result subtype: ${msg.subtype??"unknown"}`))
                    }
                }
            } catch (err) {
                let currentTurn = newState.currentTurn;
                newState.currentTurn = null, currentTurn && (abortController.signal.aborted && !currentTurn.accepted ? (newState.needsRecreation = !0, actor.pendingClear ? currentTurn.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : currentTurn.reject(new AgentSdkPromptNotAcceptedAbortError)) : abortController.signal.aborted ? currentTurn.reject(createAbortErrorWithCause("Streaming SDK run aborted", err)) : (currentTurn.accepted || (newState.needsRecreation = !0), currentTurn.reject(err))), rejectQueuedTurns(() => new AgentSdkPromptNotAcceptedAbortError)
            } finally {
                newState.closed = !0, newState.needsRecreation = !0, abortController.signal.aborted || logAlwaysAtLevel("warn", "[kv-cache] streaming loop exited unexpectedly (closed)", {
                    sessionKey: actor.sessionKey,
                    generation: actor.streamingGeneration,
                    sdk_session_id: actor.sdkSessionId ?? null
                });
                let currentTurn = newState.currentTurn;
                newState.currentTurn = null, currentTurn && (abortController.signal.aborted && !currentTurn.accepted ? actor.pendingClear ? currentTurn.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : currentTurn.reject(new AgentSdkPromptNotAcceptedAbortError) : abortController.signal.aborted ? currentTurn.reject(createAbortErrorWithCause("Streaming SDK run aborted")) : currentTurn.accepted ? currentTurn.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution")) : currentTurn.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), rejectQueuedTurns(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), unspokenCompletion && (actor.lastCliTurnSettledAt === void 0 || unspokenCompletion.observedAt > actor.lastCliTurnSettledAt) && logAlwaysAtLevel("warn", "[completion-owner] unspoken-completion", {
                    sessionKey: actor.sessionKey,
                    taskId: unspokenCompletion.taskId,
                    status: unspokenCompletion.status,
                    generation: actor.streamingGeneration
                }), newState.cliTurnTentative = null, actor.wakeResolver?.(), actor.pendingSteer && (await settlePendingSteer(), actor.wakeResolver?.()), actor.streamingState === newState && (actor.streamingState = null), actor.query === query && (actor.query = null), actor.streamAbortController === abortController && (actor.streamAbortController = null)
            }
        })(), newState
    }
    return {
        ensureStreamingSession
    }
}
