// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: Bxe, daemon.pretty.js:70663)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.3.1, v0.3.4, v0.3.5, v0.3.7, v0.4.0, v0.4.2, v0.4.3, v0.4.5, v0.5.0, v0.5.1, v0.5.2, v0.5.3, v0.5.4, v0.5.5, v0.5.6, v0.5.7, v0.5.8, v0.5.10, v0.6.0, v0.6.2, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.2, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 239 renamed — 64 from the code at the binding (rule), 175 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): surfaces a per-session "runtime unavailable" error instead of failing silently.
// changelog v0.5.5 (medium): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(paths, sessionKey, options = {}) {
    let sessionRef = hashSessionKey(sessionKey);
    if (!(await acquireSessionDrainLock(paths, sessionRef)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let heartbeatIntervalMs = options.lockHeartbeatIntervalMs ?? 3e4,
        heartbeatTimer = setInterval(async () => {
            try {
                await refreshSessionDrainLockHeartbeat(paths, sessionRef)
            } catch {}
        }, heartbeatIntervalMs);
    heartbeatTimer.unref?.(), logLatencyStageTelemetry("drain_started", sessionKey, {
        sessionKey
    });
    let now = Date.now(),
        sdkDurationMs = 0,
        toolCalls = 0,
        toolErrors = 0,
        sdkSessionId, usageTotals, compactStats, perf = {},
        initialStreamGeneration = options.getStreamGeneration?.();

    function accumulateUsage(usage) {
        if (usage) {
            if (!usageTotals) {
                usageTotals = {
                    ...usage
                };
                return
            }
            usageTotals.input_tokens = (usageTotals.input_tokens ?? 0) + (usage.input_tokens ?? 0), usageTotals.output_tokens = (usageTotals.output_tokens ?? 0) + (usage.output_tokens ?? 0), usageTotals.cache_creation_input_tokens = (usageTotals.cache_creation_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0), usageTotals.cache_read_input_tokens = (usageTotals.cache_read_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0), usageTotals.total_cost_usd = (usageTotals.total_cost_usd ?? 0) + (usage.total_cost_usd ?? 0), !usageTotals.protocol && usage.protocol && (usageTotals.protocol = usage.protocol), !usageTotals.model && usage.model && (usageTotals.model = usage.model), usage.context_used_tokens !== void 0 && (usageTotals.context_used_tokens = usage.context_used_tokens)
        }
    }
    async function recordDrainSummary(summary) {
        try {
            let currentStreamGeneration = options.getStreamGeneration?.(),
                inProcessBreak = detectInProcessBreak(usageTotals, initialStreamGeneration !== void 0 && currentStreamGeneration !== void 0 && currentStreamGeneration !== initialStreamGeneration);
            await appendDrainRecord(paths, {
                id: Fxe.randomUUID(),
                session_key: sessionKey,
                sdk_session_id: sdkSessionId,
                drain_started_at: new Date(now).toISOString(),
                drain_duration_ms: Date.now() - now,
                sdk_duration_ms: sdkDurationMs,
                events_processed: summary.processedCount,
                events_skipped: summary.skippedCount,
                tool_calls: toolCalls,
                tool_errors: toolErrors,
                output_chars: summary.replyText?.length ?? 0,
                cancelled: summary.cancelled,
                usage: usageTotals,
                perf: Object.keys(perf).length > 0 ? perf : void 0,
                compact: compactStats,
                suspected_in_process_break: inProcessBreak ? !0 : void 0
            })
        } catch {}
    }
    let turnMetaBaseline = {
        input_tokens: 0,
        cache_read: 0,
        cache_create: 0,
        output_tokens: 0,
        total_cost_usd: 0
    };

    function computeTurnMeta() {
        if (!usageTotals) return;
        let inputTokens = usageTotals.input_tokens ?? 0,
            cacheReadTokens = usageTotals.cache_read_input_tokens ?? 0,
            cacheCreateTokens = usageTotals.cache_creation_input_tokens ?? 0,
            outputTokens = usageTotals.output_tokens ?? 0,
            totalCostUsd = usageTotals.total_cost_usd ?? 0,
            inputTokenTotals = normalizeInputTokenTotals({
                protocol: usageTotals.protocol,
                input_tokens: inputTokens - turnMetaBaseline.input_tokens,
                cache_read_input_tokens: cacheReadTokens - turnMetaBaseline.cache_read,
                cache_creation_input_tokens: cacheCreateTokens - turnMetaBaseline.cache_create
            }),
            turnMeta = {
                elapsed_ms: Date.now() - now,
                total_input_tokens: usageTotals.input_tokens === void 0 ? void 0 : inputTokenTotals.totalInput,
                cache_hit_rate: computeCacheHitRate(inputTokenTotals),
                output_tokens: usageTotals.output_tokens === void 0 ? void 0 : outputTokens - turnMetaBaseline.output_tokens,
                total_cost_usd: usageTotals.total_cost_usd === void 0 ? void 0 : totalCostUsd - turnMetaBaseline.total_cost_usd,
                model: usageTotals.model,
                context_used_tokens: usageTotals.context_used_tokens,
                protocol: usageTotals.protocol
            };
        return turnMetaBaseline = {
            input_tokens: inputTokens,
            cache_read: cacheReadTokens,
            cache_create: cacheCreateTokens,
            output_tokens: outputTokens,
            total_cost_usd: totalCostUsd
        }, turnMeta
    }
    try {
        try {
            await runTimedDrainPhase(perf, "mailbox_merge_ms", async () => mergeInboxIntoMailbox(paths, sessionKey))
        } catch (err) {
            if (Aae(err)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw err
        }
        let pendingItems = await runTimedDrainPhase(perf, "mailbox_parse_ms", async () => listMailboxPendingItems(paths, sessionKey));
        if (pendingItems.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (pendingItems.some(item => !item.eventId)) {
            let orphanCleanup = await removeOrphanMailboxItemFiles(paths, sessionKey);
            if (orphanCleanup.removed > 0) {
                await appendSessionMailboxNote(paths, sessionKey, `orphan_cleanup=${orphanCleanup.removed}`);
                let mailboxPendingItems = await listMailboxPendingItems(paths, sessionKey);
                if (mailboxPendingItems.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                pendingItems = mailboxPendingItems
            }
        }
        await runTimedDrainPhase(perf, "mailbox_render_ms", async () => renderSessionMailboxFile(paths, sessionKey, pendingItems));
        let batchSize = options.batchSize ?? AW,
            mergeWindowMs = options.mergeWindowMs ?? NW,
            sdk = options.sdk ?? createAgentSdkAdapter(),
            batch = await batchDrainItems(paths, pendingItems, {
                fallbackBatchSize: batchSize,
                mergeWindowMs,
                perf
            });
        if (batch.items.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        let items = batch.items,
            jobCompletionReceipts = await collectJobCompletionReceipts(paths, sessionKey, pendingItems, batch.events, perf),
            jobReceiptsConsumed = !1,
            receiptsTurnAcknowledged = !1,
            receiptEventIdsCollected = !1,
            processedEventIds = [],
            skippedCount = 0,
            turnSkipped = !1,
            sdkTurns = [],
            compacted = !1,
            lastReplyText, lastOutboxId, lastOutboxRecord, outboxRecords = [],
            eagerMarkDone = async (eventIds, markStage) => {
                eventIds.length !== 0 && await deleteMailboxPendingItemsByEventIds(paths, sessionKey, eventIds).catch(markErr => {
                    logWarnMessage("[runner] eager markDone failed (will retry at drain end)", {
                        sessionKey,
                        stage: markStage,
                        eventIds,
                        error: markErr instanceof Error ? markErr.message : String(markErr)
                    })
                })
            }, collectReceiptEventIds = () => {
                if (!receiptsTurnAcknowledged || receiptEventIdsCollected) return [];
                receiptEventIdsCollected = !0;
                let receiptEventIds = jobCompletionReceipts?.eventIds ?? [];
                return processedEventIds.push(...receiptEventIds), receiptEventIds
            }, recordPrimaryOutbox = (primaryRecord, replyTextOverride) => {
                primaryRecord && (lastReplyText = replyTextOverride ?? primaryRecord.payload.text, lastOutboxId = primaryRecord.id, lastOutboxRecord = primaryRecord)
            }, finishCancelled = async () => (await deleteMailboxPendingItemsByEventIds(paths, sessionKey, processedEventIds), await appendSessionMailboxNote(paths, sessionKey, `processed=${processedEventIds.length} skipped=${skippedCount} cancelled=true`), await recordDrainSummary({
                cancelled: !0,
                processedCount: processedEventIds.length,
                skippedCount,
                replyText: lastReplyText
            }), {
                processed: processedEventIds.length,
                skipped: skippedCount,
                lockAcquired: !0,
                cancelled: !0,
                turnSkipped,
                sdkTurns,
                lastReplyText,
                lastOutboxId,
                lastOutboxRecord,
                outboxRecords
            }), sessionState = await runTimedDrainPhase(perf, "session_state_ms", async () => readSessionRuntimeState(paths, sessionKey)), sessionInfoFromState = buildSessionInfoFromState(paths, sessionKey, sessionState ?? void 0), statelessJob = options.jobContext?.stateless === !0, pendingGatewayNotice = sessionState?.pending_gateway_notice, pendingInterruptedContext = sessionState?.pending_interrupted_context, pendingSkipRewind = sessionState?.pending_skip_rewind, gatewayNoticeCleared = !1, interruptedContextCleared = !1, skipRewindCleared = !1, costBaseline = sessionState?.claude_cost_baseline, timeGapConsumed = !1, pendingCompactNotice = resolvePendingCompactNotice(sessionState), compactNoticeInjected = !1, restartHintDecision = decideRestartHintInjection({
                currentDaemonStartedAt: TW,
                sessionKey,
                lastEventAt: sessionState?.last_event_at,
                lastSeenDaemonStartedAt: sessionState?.last_seen_daemon_started_at
            });
        restartHintDecision.writeLastSeenAtEntry && await patchSessionRuntimeState(paths, sessionKey, {
            last_seen_daemon_started_at: restartHintDecision.writeLastSeenAtEntry
        }).catch(() => {});
        let daemonRestartHint = restartHintDecision.inject ? {
                startedAt: TW
            } : void 0,
            writeLastSeenOnInjectSuccess = restartHintDecision.writeLastSeenOnInjectSuccess,
            daemonRestartHintInjected = !1,
            currentBoardHash = classifySessionKeyOrUnknown(sessionKey) === "channel" ? options.boardHash : void 0,
            boardUpdatedDecision = decideBoardUpdatedInjection({
                currentBoardHash,
                lastSeenBoardHash: sessionState?.last_seen_board_hash
            });
        boardUpdatedDecision.writeLastSeenAtEntry && await patchSessionRuntimeState(paths, sessionKey, {
            last_seen_board_hash: boardUpdatedDecision.writeLastSeenAtEntry
        }).catch(() => {});
        let boardUpdated = boardUpdatedDecision.inject && options.memoryBoard ? {
                boardPath: options.memoryBoard.path
            } : void 0,
            writeLastSeenOnInjectSuccess2 = boardUpdatedDecision.writeLastSeenOnInjectSuccess,
            boardUpdatedInjected = !1,
            lastEventAtWatermark = sessionState?.last_event_at,
            cancelled = !1,
            resolvedItems = [],
            actualSdkSessionId, pendingCompactBoundary;
        for (let mailboxItem of items) {
            if (!mailboxItem.eventId) {
                skippedCount += 1;
                continue
            }
            let eventId = mailboxItem.eventId;
            if (options.excludeEventIds?.has(eventId)) {
                skippedCount += 1;
                continue
            }
            let existingOutboxRecord = await runTimedDrainPhase(perf, "outbox_lookup_ms", async () => findOutboxRecordByEventId(paths, eventId));
            if (existingOutboxRecord) {
                processedEventIds.push(eventId), lastReplyText = existingOutboxRecord.payload.text, lastOutboxId = existingOutboxRecord.id;
                continue
            }
            let readOptions = mailboxItem.createdAt ? {
                    notAfter: mailboxItem.createdAt
                } : void 0,
                event = batch.events.get(eventId) ?? await runTimedDrainPhase(perf, "event_read_ms", async () => readEventById(paths, eventId, readOptions));
            if (!event) {
                logWarnMessage(`[runner] mailbox event unresolved: session_key=${sessionKey} event_id=${eventId} not_after=${readOptions?.notAfter??"none"} item_file=${mailboxItem.file??"none"}`), skippedCount += 1;
                continue
            }
            resolvedItems.push({
                item: mailboxItem,
                event,
                prompt: renderMailboxEventPrompt(event, sessionKey)
            })
        }
        if (options.onBatchContext && resolvedItems.length > 0) {
            let maxNotifyDepth = 0;
            for (let resolvedItem of resolvedItems)
                if (resolvedItem.event.type === "route.deliver") {
                    let deliverPayload = isNonNullObject(resolvedItem.event.payload) ? resolvedItem.event.payload : void 0,
                        innerPayload = isNonNullObject(deliverPayload?.payload) ? deliverPayload.payload : void 0,
                        notifyDepth = typeof innerPayload?.notify_depth == "number" ? innerPayload.notify_depth : 0;
                    notifyDepth > maxNotifyDepth && (maxNotifyDepth = notifyDepth)
                } let contextEventIds = resolvedItems.map(resolvedItem => resolvedItem.item.eventId).filter(id => !!id);
            options.onBatchContext({
                maxNotifyDepth,
                eventIds: contextEventIds
            })
        }
        let refuseBatch = async refusal => {
            let {
                guidance,
                stage,
                payloadExtra,
                noteSuffix
            } = refusal;
            if (classifySessionKeyOrUnknown(sessionKey) === "channel") {
                for (let refusedItem of resolvedItems) {
                    if (refusedItem.event.source?.name === "idle-compact") {
                        await handleDrainError(paths, sessionKey, {
                            anchor: refusedItem,
                            error: new Error(guidance),
                            stage,
                            userText: guidance,
                            payloadExtra,
                            bus: options.bus
                        }), refusedItem.item.eventId && processedEventIds.push(refusedItem.item.eventId);
                        continue
                    }
                    let emitResult = await emitDrainOutputRecords(paths, sessionKey, {
                        item: refusedItem.item,
                        event: refusedItem.event,
                        outputText: guidance,
                        sdkSessionId: sessionInfoFromState.sessionId
                    });
                    outboxRecords.push(...emitResult.records), recordPrimaryOutbox(emitResult.primaryRecord), refusedItem.item.eventId && processedEventIds.push(refusedItem.item.eventId)
                }
                return await deleteMailboxPendingItemsByEventIds(paths, sessionKey, processedEventIds), await appendSessionMailboxNote(paths, sessionKey, `processed=${processedEventIds.length} skipped=${skippedCount} ${noteSuffix}`), {
                    processed: processedEventIds.length,
                    skipped: skippedCount,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText,
                    lastOutboxId,
                    lastOutboxRecord,
                    outboxRecords,
                    refusedStage: stage
                }
            }
            throw await handleDrainError(paths, sessionKey, {
                anchor: resolvedItems[0],
                error: new Error(guidance),
                stage,
                userText: guidance,
                payloadExtra,
                precedingRecords: outboxRecords,
                bus: options.bus
            }), new Error(guidance)
        }, baseQueryOptions = {
            runtime: options.runtime,
            usesStreamingAdapter: options.usesStreamingAdapter,
            abortController: options.abortController,
            onTurnRejected: () => {
                receiptsTurnAcknowledged = !1, options.onSdkTurnRejected?.()
            },
            effort: sessionInfoFromState.effort,
            callerSession: sessionKey,
            cwd: sessionInfoFromState.cwd,
            settingSources: sessionInfoFromState.settingSources,
            persistSession: options.persistSession,
            mcpServers: options.mcpServers,
            mcpServersFactory: options.mcpServersFactory,
            holdInputOpenForBackgroundAgents: options.holdInputOpenForBackgroundAgents,
            boardHash: options.boardHash
        }, workspaceProblem = describeWorkspaceProblem(sessionInfoFromState.cwd);
        if (resolvedItems.length > 0 && workspaceProblem) return refuseBatch({
            guidance: renderWorkspaceUnavailableNotice(sessionKey, sessionInfoFromState.cwd, workspaceProblem),
            stage: "workspace_unavailable",
            payloadExtra: {
                outcome: "workspace_unavailable",
                cwd: sessionInfoFromState.cwd,
                reason: workspaceProblem
            },
            noteSuffix: "workspace_unavailable=true"
        });
        if (resolvedItems.length > 0 && options.runtimeRefusal) return refuseBatch({
            guidance: `${options.runtimeRefusal} Request was not executed.`,
            stage: "runtime_refused",
            payloadExtra: {
                outcome: "runtime_refused"
            },
            noteSuffix: "runtime_refused"
        });
        let activeRuntime = options.runtime ?? "claude",
            runtimeUnavailableReason = options.runtimeUnavailableReason ?? (options.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (resolvedItems.length > 0 && runtimeUnavailableReason) return refuseBatch({
            guidance: renderRuntimeUnavailableGuidance(runtimeUnavailableReason, activeRuntime),
            stage: "runtime_unavailable",
            payloadExtra: {
                outcome: "runtime_unavailable",
                runtime: activeRuntime,
                runtime_source: options.runtime ? "explicit" : "default"
            },
            noteSuffix: `runtime_unavailable=${activeRuntime}`
        });
        let boundSdkSessionId = sessionState?.sdk_session_id,
            boundRuntime = sessionState?.sdk_session_runtime;
        if (resolvedItems.length > 0 && !statelessJob && boundSdkSessionId && boundRuntime && boundRuntime !== activeRuntime) return refuseBatch({
            guidance: renderRuntimeMismatchGuidance({
                boundRuntime,
                sdkSessionId: boundSdkSessionId,
                requestedRuntime: activeRuntime,
                isChannel: classifySessionKeyOrUnknown(sessionKey) === "channel"
            }),
            stage: "runtime_mismatch",
            payloadExtra: {
                outcome: "runtime_mismatch",
                runtime: activeRuntime,
                bound_runtime: boundRuntime,
                sdk_session_id: boundSdkSessionId
            },
            noteSuffix: `runtime_mismatch=${boundRuntime}->${activeRuntime}`
        });
        sessionInfoFromState.forkFrom && (options.runtime !== "codex" || statelessJob) && (sessionInfoFromState.forkFrom = void 0, await clearSessionRuntimeStateField(paths, sessionKey, "pending_fork_to").catch(() => {})), await clearModelOverrideOnRuntimeFlip(paths, sessionKey, {
            snapshotModel: sessionState?.model,
            snapshotModelRuntime: sessionState?.model_runtime,
            activeRuntime: options.runtime ?? "claude",
            sessionInfo: sessionInfoFromState
        }), sessionState?.pending_model_fork && await resolvePendingModelFork(paths, sessionKey, {
            snapshotModel: sessionState.model,
            runtime: options.runtime,
            statelessJob,
            sessionInfo: sessionInfoFromState
        });
        let wrapExecutionEventHandler = handler => async executionEvent => {
            if (executionEvent.type === "system" && executionEvent.subtype === "init" && executionEvent.data && typeof executionEvent.data.session_id == "string" && (actualSdkSessionId = executionEvent.data.session_id, sessionInfoFromState.sessionId && actualSdkSessionId !== sessionInfoFromState.sessionId && logWarnMessage("[runner] SDK session ID mismatch — context lost", {
                    sessionKey,
                    requestedSessionId: sessionInfoFromState.sessionId,
                    actualSessionId: actualSdkSessionId
                })), executionEvent.type === "system" && executionEvent.subtype === "compact_boundary" && executionEvent.data && typeof executionEvent.data == "object") {
                let data = executionEvent.data,
                    trigger = data.trigger;
                (trigger === "manual" || trigger === "auto") && (pendingCompactBoundary = {
                    trigger,
                    pre_tokens: typeof data.pre_tokens == "number" ? data.pre_tokens : void 0,
                    post_tokens: typeof data.post_tokens == "number" ? data.post_tokens : void 0
                })
            }
            return executionEvent.type === "tool_use" ? toolCalls += 1 : executionEvent.type === "tool_result" && executionEvent.isError && (toolErrors += 1), handler(executionEvent)
        }, persistSdkSessionId = async () => {
            let sdkSessionIdToSave = actualSdkSessionId ?? sessionInfoFromState.sessionId;
            !sdkSessionIdToSave || options.skipSessionIdUpdate || statelessJob || await patchSessionRuntimeState(paths, sessionKey, {
                sdk_session_id: sdkSessionIdToSave
            })
        }, saveInterruptedContext = async (promptText, includePrevious) => {
            await persistSdkSessionId(), !(await readSessionRuntimeState(paths, sessionKey))?.pending_skip_rewind && await setPendingInterruptedContext(paths, sessionKey, mergeInterruptedContextTexts(promptText, includePrevious ? pendingInterruptedContext : void 0))
        }, clearInjectedPending = async injection => {
            injection.gatewayNoticeInjected && !gatewayNoticeCleared && (await clearPendingGatewayNotice(paths, sessionKey), gatewayNoticeCleared = !0), injection.interruptedContextInjected && !interruptedContextCleared && (await clearPendingInterruptedContext(paths, sessionKey), interruptedContextCleared = !0), injection.skipRewindInjected && !skipRewindCleared && (await clearPendingSkipRewind(paths, sessionKey), skipRewindCleared = !0)
        };
        if (isMergeableDrainBatch(resolvedItems, sessionKey)) {
            let drainTurnContext = await prepareDrainTurnContext(paths, sessionKey, options, resolvedItems, sessionInfoFromState, {
                    pendingGatewayNotice,
                    pendingInterruptedContext,
                    pendingSkipRewind,
                    lastEventAtWatermark,
                    timeGapConsumed,
                    daemonRestartHint: daemonRestartHintInjected ? void 0 : daemonRestartHint,
                    compactNotice: compactNoticeInjected ? void 0 : pendingCompactNotice,
                    boardUpdated: boardUpdatedInjected ? void 0 : boardUpdated,
                    jobReceipts: jobReceiptsConsumed ? void 0 : jobCompletionReceipts?.text
                }, perf, wrapExecutionEventHandler),
                {
                    anchor,
                    resumeSessionId,
                    forkFromSessionId,
                    handleExecutionEvent,
                    attachments,
                    batchEventIds,
                    coalescedPromptText,
                    injectionResult,
                    systemPrompt,
                    sdkRunConfig
                } = drainTurnContext,
                kindlessConfig = await Txe(paths, drainTurnContext.anchorChannelConfig, options.jobContext?.sdkConfig),
                turnModelWithLayer = resolveTurnModelWithLayer({
                    jobModel: options.jobContext?.model,
                    sessionModel: sessionInfoFromState.model,
                    config: drainTurnContext.anchorChannelConfig,
                    kindlessConfig,
                    runtime: options.runtime
                }),
                turnEffortWithLayer = resolveTurnEffortWithLayer({
                    jobEffort: options.jobContext?.effort,
                    sessionEffort: sessionInfoFromState.effort,
                    config: drainTurnContext.anchorChannelConfig,
                    kindlessConfig,
                    runtime: options.runtime
                }),
                drainContextProfileOrRefuse = await resolveDrainContextProfileOrRefuse(paths, sessionKey, {
                    runtime: options.runtime,
                    model: turnModelWithLayer.model,
                    modelOrigin: turnModelWithLayer.configLayer,
                    cwd: sessionInfoFromState.cwd,
                    effective: drainTurnContext.anchorChannelConfig,
                    kindlessConfig,
                    jobOverlay: options.jobContext?.sdkConfig
                }, {
                    anchor,
                    precedingRecords: outboxRecords,
                    bus: options.bus
                });
            timeGapConsumed = drainTurnContext.timeGapConsumed;
            let jobReceiptsInjected = drainTurnContext.injectionResult.jobReceiptsInjected;
            jobReceiptsInjected && (jobReceiptsConsumed = !0), !daemonRestartHintInjected && drainTurnContext.injectionResult.daemonRestartHintInjected && (daemonRestartHintInjected = !0, writeLastSeenOnInjectSuccess && await patchSessionRuntimeState(paths, sessionKey, {
                last_seen_daemon_started_at: writeLastSeenOnInjectSuccess
            }).catch(() => {})), !boardUpdatedInjected && drainTurnContext.injectionResult.boardUpdatedInjected && (boardUpdatedInjected = !0, writeLastSeenOnInjectSuccess2 && await patchSessionRuntimeState(paths, sessionKey, {
                last_seen_board_hash: writeLastSeenOnInjectSuccess2
            }).catch(() => {})), logLatencyStageTelemetry("sdk_start", anchor.event.id, {
                eventIds: batchEventIds,
                coalesced: resolvedItems.length > 1
            });
            let now = Date.now(),
                sdkTurn = {
                    anchorEventId: anchor.event.id,
                    consumed: !0,
                    skipped: !1,
                    hadOutput: !1
                };
            sdkTurns.push(sdkTurn);
            let queryResult;
            try {
                let streamHandler = drainTurnContext.isNotifyOnly || drainTurnContext.anchorChannelConfig?.stream === !1 || !options.onStream ? void 0 : (chunk, streamMeta) => options.onStream(chunk, streamMeta, anchor.event.id);
                queryResult = await runDrainQueryAndCollectOutboundAttachments(paths, sessionKey, sdk, {
                    ...baseQueryOptions,
                    onTurnAcknowledged: () => {
                        jobReceiptsInjected && (receiptsTurnAcknowledged = !0), options.onSdkTurnStarted?.({
                            notifyOnly: drainTurnContext.isNotifyOnly
                        })
                    },
                    prompt: injectionResult.blocks,
                    onStream: streamHandler,
                    anchorEventId: anchor.event.id,
                    onExecutionEvent: handleExecutionEvent,
                    sessionId: resumeSessionId,
                    forkFrom: forkFromSessionId,
                    model: drainContextProfileOrRefuse.effectiveModel ?? turnModelWithLayer.model,
                    effort: turnEffortWithLayer.effort,
                    effortOrigin: turnEffortWithLayer.configLayer,
                    claudeContextRequirement: drainContextProfileOrRefuse.requirement,
                    claudeModelAliases: drainContextProfileOrRefuse.aliases,
                    claudeSettingsPath: drainContextProfileOrRefuse.settingsPath,
                    costBaseline,
                    permissionMode: sdkRunConfig.permissionMode,
                    allowedTools: sdkRunConfig.allowedTools,
                    disallowedTools: sdkRunConfig.disallowedTools,
                    tools: sdkRunConfig.tools,
                    additionalDirectories: sdkRunConfig.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: resolveAdditionalDirClaudeMdAutoload(options.runtime, options.memoryBoard, sdkRunConfig.additionalDirectories, paths.memoryDir),
                    attachments,
                    systemPrompt
                })
            } catch (err) {
                if (isAgentSdkTurnInterruptedError(err)) {
                    await clearInjectedPending(injectionResult);
                    for (let batchItem of resolvedItems) batchItem.item.eventId && processedEventIds.push(batchItem.item.eventId);
                    return collectReceiptEventIds(), finishCancelled()
                }
                if (isAgentSdkPromptNotAcceptedAbortError(err)) return sdkTurn.consumed = !1, finishCancelled();
                if (isAbortLikeError(err)) {
                    for (let batchItem of resolvedItems) batchItem.item.eventId && processedEventIds.push(batchItem.item.eventId);
                    return collectReceiptEventIds(), await saveInterruptedContext(coalescedPromptText, injectionResult.interruptedContextInjected), finishCancelled()
                }
                throw await handleDrainError(paths, sessionKey, {
                    anchor,
                    error: err,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: options.runtime,
                        modelOverride: options.jobContext?.model ? void 0 : sessionInfoFromState.model
                    },
                    precedingRecords: outboxRecords,
                    bus: options.bus
                }), err
            }
            let sdkResult = queryResult.sdkResult;
            if (sdkDurationMs += Date.now() - now, await markTurnSkippedFromSkipRecord(paths, sessionKey, options.runtime, sdkResult), sdkResult.skipped && (sdkTurn.skipped = !0, turnSkipped = !0), sdkResult.sessionId && (sdkSessionId = sdkResult.sessionId), accumulateUsage(sdkResult.usage), typeof sdkResult.firstTokenLatencyMs == "number" && (addToNumericField(perf, "sdk_ttft_ms_total", sdkResult.firstTokenLatencyMs), perf.sdk_ttft_samples = (perf.sdk_ttft_samples ?? 0) + 1), logLatencyStageTelemetry("sdk_end", anchor.event.id, {
                    eventIds: batchEventIds,
                    sdkDurationMs: Date.now() - now,
                    usedFallback: sdkResult.usedFallback
                }), options.abortController?.signal.aborted) {
                await saveInterruptedContext(coalescedPromptText, injectionResult.interruptedContextInjected);
                for (let batchItem of resolvedItems) batchItem.item.eventId && processedEventIds.push(batchItem.item.eventId);
                return collectReceiptEventIds(), finishCancelled()
            }
            if (await clearInjectedPending(injectionResult), sdkResult.skipped) logInfoMessage("[runner] Skip called — suppressing outbox", {
                sessionKey,
                eventId: anchor.event.id
            });
            else {
                let turnOutputText = renderTurnOutputText(anchor.event, sdkResult),
                    emitResult = await runTimedDrainPhase(perf, "outbox_emit_ms", async () => emitDrainOutputRecords(paths, sessionKey, {
                        item: anchor.item,
                        event: anchor.event,
                        outputText: turnOutputText,
                        sdkSessionId: sdkResult.sessionId,
                        batchedEventIds: resolvedItems.map(batchItem => batchItem.event.id),
                        attachments: queryResult.outboundAttachments,
                        turnMeta: computeTurnMeta()
                    }));
                if (outboxRecords.push(...emitResult.records), emitResult.primaryRecord) {
                    sdkTurn.hadOutput = !0, logLatencyStageTelemetry("outbox_written", anchor.event.id, {
                        outboxId: emitResult.primaryRecord.id,
                        eventIds: batchEventIds
                    }), recordPrimaryOutbox(emitResult.primaryRecord);
                    for (let batchItem of resolvedItems.slice(0, -1)) batchItem.item.eventId && await indexOutboxRecordByEventId(paths, batchItem.item.eventId, emitResult.primaryRecord)
                }
            }
            for (let batchItem of resolvedItems) batchItem.item.eventId && processedEventIds.push(batchItem.item.eventId);
            let collectedReceiptIds = collectReceiptEventIds();
            if (sdkResult.skipped) {
                let skipEventIds = [...resolvedItems.map(batchItem => batchItem.item.eventId).filter(id => !!id), ...collectedReceiptIds];
                await eagerMarkDone(skipEventIds, "skip-turn")
            }
            if (sdkResult.usedFallback && sdkResult.resumeError) {
                let spineEvent = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: anchor.event.session_key ?? sessionKey,
                    payload: {
                        stage: "resume",
                        session_id: sessionInfoFromState.sessionId,
                        error: sdkResult.resumeError
                    }
                });
                await atomicAppendEvent(paths, spineEvent)
            }
            await runTimedDrainPhase(perf, "session_upsert_ms", async () => {
                let statePatch = {
                    cwd: sessionInfoFromState.cwd,
                    plane: sessionInfoFromState.plane,
                    permission_profile: sessionInfoFromState.permissionProfile,
                    last_event_id: anchor.event.id,
                    last_event_at: anchor.event.ts
                };
                usageTotals?.context_used_tokens !== void 0 && (statePatch.context_used_tokens = usageTotals.context_used_tokens);
                let servedModelFromUsage = extractServedModelFromUsage(usageTotals);
                if (servedModelFromUsage && (statePatch.last_served_model = servedModelFromUsage), pendingCompactBoundary) {
                    let compactBoundary = pendingCompactBoundary;
                    pendingCompactBoundary = void 0, compacted = !0;
                    let measuredAt = anchor.event.ts ?? new Date().toISOString(),
                        gapCounts = await countCompactGapIntervals(paths, sessionKey, sessionState?.compact_stats?.measured_at),
                        compactStatsRecord = buildCompactStatsRecord({
                            completion: {
                                hadBoundary: !0,
                                history_pre: compactBoundary.pre_tokens,
                                history_post: compactBoundary.post_tokens,
                                origin: compactBoundary.trigger
                            },
                            preTotal: sessionState?.context_used_tokens,
                            postTotal: usageTotals?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt,
                            sessionKey,
                            gapCounts
                        });
                    statePatch.last_compact_at = measuredAt, statePatch.compact_stats = compactStatsRecord, compactStats = compactStatsRecord, logInfoMessage("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey,
                        eventId: anchor.event.id,
                        trigger: compactBoundary.trigger,
                        pre_tokens: compactBoundary.pre_tokens,
                        post_tokens: compactBoundary.post_tokens
                    })
                }
                sdkResult.sessionId && !statelessJob && (statePatch.sdk_session_id = sdkResult.sessionId, statePatch.sdk_session_runtime = activeRuntime, sdkResult.costBaseline && (statePatch.claude_cost_baseline = sdkResult.costBaseline, costBaseline = sdkResult.costBaseline)), forkFromSessionId && (statePatch.pending_fork_to = null), await patchSessionRuntimeState(paths, sessionKey, statePatch)
            }), anchor.event.ts && (lastEventAtWatermark = anchor.event.ts)
        } else {
            let sessionIdForResume = options.resume === !1 || statelessJob ? void 0 : sessionInfoFromState.sessionId,
                pendingForkFrom = options.resume === !1 || options.runtime !== "codex" || statelessJob ? void 0 : sessionInfoFromState.forkFrom;
            for (let resolvedItem of resolvedItems) {
                let inBandCompact = !1,
                    compactCompletion;
                if (resolvedItem.event.routing_hint?.intent === "history-control") {
                    let historyPayload = isNonNullObject(resolvedItem.event.payload) ? resolvedItem.event.payload : void 0,
                        trimmed = (historyPayload?.text ?? historyPayload?.command ?? "").trim(),
                        cmdToken = /^(\S+)/.exec(trimmed)?.[1]?.toLowerCase() ?? "";
                    if (cmdToken === "/compact" && resolvedItem.event.source?.name === "idle-compact" && isStaleIdleCompactEvent(resolvedItem.event.ts, {
                            actorSpawnedAt: options.actorSpawnedAt,
                            actorLastTurnCompletedAt: options.actorLastTurnCompletedAt
                        })) {
                        logInfoMessage("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey,
                            eventId: resolvedItem.event.id,
                            itemTs: resolvedItem.event.ts,
                            actorSpawnedAt: options.actorSpawnedAt,
                            actorLastTurnCompletedAt: options.actorLastTurnCompletedAt
                        }), resolvedItem.item.eventId && (processedEventIds.push(resolvedItem.item.eventId), await eagerMarkDone([resolvedItem.item.eventId], "stale-idle-compact")), resolvedItem.event.ts && (lastEventAtWatermark = resolvedItem.event.ts);
                        continue
                    }
                    if (cmdToken === "/compact" && (options.runtime === "claude" || options.runtime === void 0))
                        if (classifySessionKeyOrUnknown(sessionKey) === "channel") inBandCompact = !0;
                        else {
                            let notice = "ℹ️ /compact is only available in interactive sessions.",
                                emitResult = await emitDrainOutputRecords(paths, sessionKey, {
                                    item: resolvedItem.item,
                                    event: resolvedItem.event,
                                    outputText: notice,
                                    sdkSessionId: sessionIdForResume
                                });
                            outboxRecords.push(...emitResult.records), recordPrimaryOutbox(emitResult.primaryRecord, notice), resolvedItem.item.eventId && (processedEventIds.push(resolvedItem.item.eventId), await deleteMailboxPendingItemsByEventIds(paths, sessionKey, [resolvedItem.item.eventId]).catch(finalizeErr => {
                                logWarnMessage("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey,
                                    eventId: resolvedItem.item.eventId,
                                    error: finalizeErr instanceof Error ? finalizeErr.message : String(finalizeErr)
                                })
                            })), resolvedItem.event.ts && (lastEventAtWatermark = resolvedItem.event.ts);
                            continue
                        } if (!inBandCompact) {
                        let commandOutput = await runHistoryControlCommand({
                            paths,
                            sessionKey,
                            sdk,
                            sessionInfo: {
                                ...sessionInfoFromState,
                                sessionId: sessionIdForResume
                            },
                            cmdToken
                        });
                        if (!(cmdToken === "/compact" && resolvedItem.event.source?.name === "idle-compact")) {
                            let emitResult = await emitDrainOutputRecords(paths, sessionKey, {
                                item: resolvedItem.item,
                                event: resolvedItem.event,
                                outputText: commandOutput,
                                sdkSessionId: sessionIdForResume
                            });
                            outboxRecords.push(...emitResult.records), recordPrimaryOutbox(emitResult.primaryRecord, commandOutput)
                        }
                        resolvedItem.item.eventId && (processedEventIds.push(resolvedItem.item.eventId), await eagerMarkDone([resolvedItem.item.eventId], "history-control")), resolvedItem.event.ts && (lastEventAtWatermark = resolvedItem.event.ts);
                        continue
                    }
                }
                let executionEventHandler = wrapExecutionEventHandler(createDrainExecutionEventRecorder(paths, sessionKey, resolvedItem.event.session_key ?? sessionKey, options.onExecutionEvent, resolvedItem.event.id)),
                    eventPayload = isNonNullObject(resolvedItem.event.payload) ? resolvedItem.event.payload : void 0,
                    payloadMediaRefs = extractPayloadMediaRefs(resolvedItem.event.payload),
                    effectiveConfig = applyJobSdkConfigOverride(await runTimedDrainPhase(perf, "effective_config_ms", async () => resolveEffectiveChannelConfigForEvent(paths, resolvedItem.event)), options.jobContext?.sdkConfig),
                    kindlessConfig = await Txe(paths, effectiveConfig, options.jobContext?.sdkConfig),
                    turnModelWithLayer = resolveTurnModelWithLayer({
                        jobModel: options.jobContext?.model,
                        sessionModel: sessionInfoFromState.model,
                        config: effectiveConfig,
                        kindlessConfig,
                        runtime: options.runtime
                    }),
                    turnEffortWithLayer = resolveTurnEffortWithLayer({
                        jobEffort: options.jobContext?.effort,
                        sessionEffort: sessionInfoFromState.effort,
                        config: effectiveConfig,
                        kindlessConfig,
                        runtime: options.runtime
                    }),
                    drainContextProfileOrRefuse = await resolveDrainContextProfileOrRefuse(paths, sessionKey, {
                        runtime: options.runtime,
                        model: turnModelWithLayer.model,
                        modelOrigin: turnModelWithLayer.configLayer,
                        cwd: sessionInfoFromState.cwd,
                        effective: effectiveConfig,
                        kindlessConfig,
                        jobOverlay: options.jobContext?.sdkConfig
                    }, {
                        anchor: resolvedItem,
                        precedingRecords: outboxRecords,
                        bus: options.bus
                    }),
                    forkFrom = pendingForkFrom,
                    resumeId = options.resume === !1 || forkFrom || statelessJob ? void 0 : sessionIdForResume,
                    isUserMessage = isChannelMessageEvent(resolvedItem.event),
                    isChannelSession = classifySessionKeyOrUnknown(sessionKey) === "channel",
                    timeGapContext = computeTimeGapContext({
                        consumed: timeGapConsumed,
                        timeGapMinutes: effectiveConfig?.time_gap_minutes,
                        isChannelSession,
                        isUserMessage,
                        lastEventAt: lastEventAtWatermark,
                        currentEventAt: resolvedItem.event.ts
                    }),
                    notifyOnly = isChannelSession && !isUserMessage,
                    jobTick, prompt = resolvedItem.prompt;
                if (resolvedItem.event.type === "job.spawn" && options.jobContext) {
                    let tick = isNonNullObject(eventPayload?.tick) ? eventPayload.tick : void 0;
                    if (tick) {
                        let runNumber = tick.run_number,
                            triggeredAt = tick.triggered_at,
                            previousRunAt = tick.previous_run_at;
                        typeof runNumber == "number" && typeof triggeredAt == "string" && (jobTick = {
                            run_number: runNumber,
                            triggered_at: triggeredAt,
                            previous_run_at: typeof previousRunAt == "string" ? previousRunAt : null,
                            cron: options.jobContext.cron
                        })
                    }
                    jobTick && (prompt = zmt)
                }
                let daemonRestartHintForTurn = !daemonRestartHintInjected && daemonRestartHint ? daemonRestartHint : void 0,
                    compactNoticeForTurn = (effectiveConfig?.auto_compact_idle_minutes ?? 0) > 0 && !compactNoticeInjected && pendingCompactNotice ? pendingCompactNotice : void 0,
                    boardUpdatedForTurn = !boardUpdatedInjected && boardUpdated ? boardUpdated : void 0,
                    jobReceiptsText = jobReceiptsConsumed ? void 0 : jobCompletionReceipts?.text,
                    transientUserBlocks = buildTransientUserBlocks(prompt, {
                        gatewayNotice: gatewayNoticeCleared ? void 0 : pendingGatewayNotice,
                        interruptedContext: interruptedContextCleared ? void 0 : pendingInterruptedContext,
                        skipRewind: skipRewindCleared ? void 0 : pendingSkipRewind,
                        isUserMessage,
                        timeGap: timeGapContext,
                        jobTick,
                        jobReceipts: jobReceiptsText,
                        daemonRestartHint: daemonRestartHintForTurn,
                        compactNotice: compactNoticeForTurn,
                        boardUpdated: boardUpdatedForTurn
                    }, sessionInfoFromState),
                    jobReceiptsInjected = transientUserBlocks.jobReceiptsInjected;
                jobReceiptsInjected && (jobReceiptsConsumed = !0), timeGapConsumed = timeGapConsumed || transientUserBlocks.timeGapInjected, transientUserBlocks.compactNoticeInjected && (compactNoticeInjected = !0), !daemonRestartHintInjected && transientUserBlocks.daemonRestartHintInjected && (daemonRestartHintInjected = !0, writeLastSeenOnInjectSuccess && await patchSessionRuntimeState(paths, sessionKey, {
                    last_seen_daemon_started_at: writeLastSeenOnInjectSuccess
                }).catch(() => {})), !boardUpdatedInjected && transientUserBlocks.boardUpdatedInjected && (boardUpdatedInjected = !0, writeLastSeenOnInjectSuccess2 && await patchSessionRuntimeState(paths, sessionKey, {
                    last_seen_board_hash: writeLastSeenOnInjectSuccess2
                }).catch(() => {}));
                let systemPromptForChannelConfig = buildSystemPromptForChannelConfig(effectiveConfig, sessionKey, projectJobPromptContext(options.jobContext), options.memoryBoard, options.runtime),
                    turnSdkRunConfig = buildTurnSdkRunConfig(options, effectiveConfig),
                    queryResult, now = Date.now(),
                    streamHandler = options.onStream ? (chunk, streamMeta) => options.onStream(chunk, streamMeta, resolvedItem.event.id) : void 0,
                    sdkTurn = {
                        anchorEventId: resolvedItem.event.id,
                        consumed: !0,
                        skipped: !1,
                        hadOutput: !1
                    };
                sdkTurns.push(sdkTurn);
                try {
                    queryResult = await runDrainQueryAndCollectOutboundAttachments(paths, sessionKey, sdk, {
                        ...baseQueryOptions,
                        onTurnAcknowledged: () => {
                            jobReceiptsInjected && (receiptsTurnAcknowledged = !0), options.onSdkTurnStarted?.({
                                notifyOnly
                            })
                        },
                        prompt: transientUserBlocks.blocks,
                        onStream: streamHandler,
                        anchorEventId: resolvedItem.event.id,
                        onExecutionEvent: executionEventHandler,
                        sessionId: resumeId,
                        forkFrom,
                        model: drainContextProfileOrRefuse.effectiveModel ?? turnModelWithLayer.model,
                        effort: turnEffortWithLayer.effort,
                        effortOrigin: turnEffortWithLayer.configLayer,
                        claudeContextRequirement: drainContextProfileOrRefuse.requirement,
                        claudeModelAliases: drainContextProfileOrRefuse.aliases,
                        claudeSettingsPath: drainContextProfileOrRefuse.settingsPath,
                        costBaseline,
                        permissionMode: turnSdkRunConfig.permissionMode,
                        allowedTools: turnSdkRunConfig.allowedTools,
                        disallowedTools: turnSdkRunConfig.disallowedTools,
                        tools: turnSdkRunConfig.tools,
                        additionalDirectories: turnSdkRunConfig.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: resolveAdditionalDirClaudeMdAutoload(options.runtime, options.memoryBoard, turnSdkRunConfig.additionalDirectories, paths.memoryDir),
                        attachments: payloadMediaRefs,
                        systemPrompt: systemPromptForChannelConfig
                    })
                } catch (err) {
                    if (isAgentSdkTurnInterruptedError(err)) {
                        await clearInjectedPending(transientUserBlocks), resolvedItem.item.eventId && processedEventIds.push(resolvedItem.item.eventId), collectReceiptEventIds(), cancelled = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(err)) {
                        sdkTurn.consumed = !1, cancelled = !0;
                        break
                    }
                    if (isAbortLikeError(err)) {
                        resolvedItem.item.eventId && processedEventIds.push(resolvedItem.item.eventId), collectReceiptEventIds(), await saveInterruptedContext(resolvedItem.prompt, transientUserBlocks.interruptedContextInjected), cancelled = !0;
                        break
                    }
                    throw await handleDrainError(paths, sessionKey, {
                        anchor: resolvedItem,
                        error: err,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: options.runtime,
                            modelOverride: options.jobContext?.model ? void 0 : sessionInfoFromState.model
                        },
                        precedingRecords: outboxRecords,
                        bus: options.bus
                    }), err
                }
                let sdkResult = queryResult.sdkResult;
                if (await markTurnSkippedFromSkipRecord(paths, sessionKey, options.runtime, sdkResult), sdkResult.skipped && (sdkTurn.skipped = !0, turnSkipped = !0), sdkDurationMs += Date.now() - now, sdkResult.sessionId && (sdkSessionId = sdkResult.sessionId), accumulateUsage(sdkResult.usage), typeof sdkResult.firstTokenLatencyMs == "number" && (addToNumericField(perf, "sdk_ttft_ms_total", sdkResult.firstTokenLatencyMs), perf.sdk_ttft_samples = (perf.sdk_ttft_samples ?? 0) + 1), options.abortController?.signal.aborted) {
                    await saveInterruptedContext(resolvedItem.prompt, transientUserBlocks.interruptedContextInjected), cancelled = !0, resolvedItem.item.eventId && processedEventIds.push(resolvedItem.item.eventId), collectReceiptEventIds();
                    break
                }
                if (await clearInjectedPending(transientUserBlocks), !sdkResult.skipped && !inBandCompact) {
                    let turnOutputText = renderTurnOutputText(resolvedItem.event, sdkResult),
                        emitResult = await runTimedDrainPhase(perf, "outbox_emit_ms", async () => emitDrainOutputRecords(paths, sessionKey, {
                            item: resolvedItem.item,
                            event: resolvedItem.event,
                            outputText: turnOutputText,
                            sdkSessionId: sdkResult.sessionId,
                            attachments: queryResult.outboundAttachments,
                            turnMeta: computeTurnMeta()
                        }));
                    outboxRecords.push(...emitResult.records), emitResult.primaryRecord && (sdkTurn.hadOutput = !0), recordPrimaryOutbox(emitResult.primaryRecord)
                } else if (inBandCompact) logInfoMessage("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey,
                    eventId: resolvedItem.event.id
                });
                else {
                    logInfoMessage("[runner] Skip called — suppressing outbox", {
                        sessionKey,
                        eventId: resolvedItem.event.id
                    });
                    let receiptEventIds = collectReceiptEventIds();
                    (resolvedItem.item.eventId || receiptEventIds.length > 0) && await eagerMarkDone([...resolvedItem.item.eventId ? [resolvedItem.item.eventId] : [], ...receiptEventIds], "skip-turn")
                }
                let isIdleCompact = resolvedItem.event.source?.name === "idle-compact";
                if (pendingCompactBoundary) {
                    let compactBoundary = pendingCompactBoundary;
                    if (pendingCompactBoundary = void 0, compactCompletion = {
                            hadBoundary: !0,
                            history_pre: compactBoundary.pre_tokens,
                            history_post: compactBoundary.post_tokens,
                            origin: isIdleCompact ? "idle-compact" : compactBoundary.trigger
                        }, compactBoundary.trigger === "manual" && !isIdleCompact) {
                        let manualCompactNotice = renderManualCompactNotice(compactBoundary),
                            emitResult = await emitDrainOutputRecords(paths, sessionKey, {
                                item: resolvedItem.item,
                                event: resolvedItem.event,
                                outputText: manualCompactNotice,
                                sdkSessionId: sdkResult.sessionId ?? sessionIdForResume
                            });
                        outboxRecords.push(...emitResult.records), emitResult.primaryRecord && (sdkTurn.hadOutput = !0), recordPrimaryOutbox(emitResult.primaryRecord, manualCompactNotice)
                    } else logInfoMessage("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey,
                        eventId: resolvedItem.event.id,
                        trigger: compactBoundary.trigger,
                        idleCompact: isIdleCompact,
                        pre_tokens: compactBoundary.pre_tokens,
                        post_tokens: compactBoundary.post_tokens
                    })
                } else if (inBandCompact)
                    if (compactCompletion = {
                            hadBoundary: !1,
                            origin: isIdleCompact ? "idle-compact" : "manual"
                        }, isIdleCompact) logInfoMessage("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey,
                        eventId: resolvedItem.event.id
                    });
                    else {
                        let notice = "ℹ️ Nothing to compact.",
                            emitResult = await emitDrainOutputRecords(paths, sessionKey, {
                                item: resolvedItem.item,
                                event: resolvedItem.event,
                                outputText: notice,
                                sdkSessionId: sdkResult.sessionId ?? sessionIdForResume
                            });
                        outboxRecords.push(...emitResult.records), emitResult.primaryRecord && (sdkTurn.hadOutput = !0), recordPrimaryOutbox(emitResult.primaryRecord, notice)
                    } if (resolvedItem.item.eventId && processedEventIds.push(resolvedItem.item.eventId), collectReceiptEventIds(), sdkResult.usedFallback && sdkResult.resumeError) {
                    let spineEvent = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: resolvedItem.event.session_key ?? sessionKey,
                        payload: {
                            stage: "resume",
                            session_id: sessionInfoFromState.sessionId,
                            error: sdkResult.resumeError
                        }
                    });
                    await atomicAppendEvent(paths, spineEvent)
                }
                await runTimedDrainPhase(perf, "session_upsert_ms", async () => {
                    let statePatch = {
                        cwd: sessionInfoFromState.cwd,
                        plane: sessionInfoFromState.plane,
                        permission_profile: sessionInfoFromState.permissionProfile,
                        last_event_id: resolvedItem.event.id,
                        last_event_at: resolvedItem.event.ts
                    };
                    usageTotals?.context_used_tokens !== void 0 && (statePatch.context_used_tokens = usageTotals.context_used_tokens);
                    let servedModelFromUsage = extractServedModelFromUsage(usageTotals);
                    servedModelFromUsage && (statePatch.last_served_model = servedModelFromUsage);
                    let nonNegativeNumberField = readNonNegativeNumberField(resolvedItem.event.payload, "idle_ms"),
                        nonNegativeNumberField2 = readNonNegativeNumberField(resolvedItem.event.payload, "threshold_at_fire");
                    if (compactCompletion) {
                        compacted = !0;
                        let measuredAt = resolvedItem.event.ts ?? new Date().toISOString(),
                            gapCounts = await countCompactGapIntervals(paths, sessionKey, sessionState?.compact_stats?.measured_at),
                            compactStatsRecord = buildCompactStatsRecord({
                                completion: compactCompletion,
                                preTotal: sessionState?.context_used_tokens,
                                postTotal: usageTotals?.context_used_tokens,
                                idleMs: nonNegativeNumberField,
                                thresholdAtFire: nonNegativeNumberField2,
                                measuredAt,
                                sessionKey,
                                gapCounts
                            });
                        statePatch.last_compact_at = measuredAt, statePatch.compact_stats = compactStatsRecord, compactStats = compactStatsRecord
                    }
                    sdkResult.sessionId && !statelessJob && (statePatch.sdk_session_id = sdkResult.sessionId, statePatch.sdk_session_runtime = activeRuntime, sdkResult.costBaseline && (statePatch.claude_cost_baseline = sdkResult.costBaseline, costBaseline = sdkResult.costBaseline)), forkFrom && (statePatch.pending_fork_to = null), await patchSessionRuntimeState(paths, sessionKey, statePatch)
                }), compactCompletion?.origin === "idle-compact" && await recordIdleCompactFireMetric(paths, {
                    sessionKey,
                    preTokens: sessionState?.context_used_tokens,
                    postTokens: usageTotals?.context_used_tokens,
                    idleMs: readNonNegativeNumberField(resolvedItem.event.payload, "idle_ms")
                }), forkFrom && (pendingForkFrom = void 0), sdkResult.sessionId && !statelessJob && (sessionIdForResume = sdkResult.sessionId), resolvedItem.event.ts && (lastEventAtWatermark = resolvedItem.event.ts)
            }
        }
        return await runTimedDrainPhase(perf, "mailbox_finalize_ms", async () => {
            if (await deleteMailboxPendingItemsByEventIds(paths, sessionKey, processedEventIds), processedEventIds.length > 0 || skippedCount > 0) {
                let note = `processed=${processedEventIds.length} skipped=${skippedCount}${lastOutboxId?` outbox=${lastOutboxId}`:""}`;
                await appendSessionMailboxNote(paths, sessionKey, note)
            }
        }), await recordDrainSummary({
            cancelled,
            processedCount: processedEventIds.length,
            skippedCount,
            replyText: lastReplyText
        }), {
            processed: processedEventIds.length,
            skipped: skippedCount,
            lockAcquired: !0,
            cancelled,
            turnSkipped,
            sdkTurns,
            compacted,
            lastReplyText,
            lastOutboxId,
            lastOutboxRecord,
            outboxRecords
        }
    } finally {
        clearInterval(heartbeatTimer), await releaseSessionDrainLock(paths, sessionRef)
    }
}
