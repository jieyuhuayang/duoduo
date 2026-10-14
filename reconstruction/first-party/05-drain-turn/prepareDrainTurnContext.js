// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: prepareDrainTurnContext  (minified: DW, daemon.pretty.js:70576)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.7 — first release whose bundle holds this declaration; body changed in v0.4.5, v0.5.1, v0.5.2, v0.5.4, v0.5.5, v0.5.10, v0.6.2, v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 27 renamed — 6 from the code at the binding (rule), 21 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.7 (medium): **session-manager**: Streaming turn admission control — new ingress enters a live CLI session without interrupting the active drain. When the CLI's result is delayed (e.g. background tasks polling), later messages are admitted into the same streaming session via a drain-scoped callback
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function prepareDrainTurnContext(paths, sessionKey, options, batch, sessionInfo, injectionState, perf, wrapHandler) {
    let anchor = batch[batch.length - 1],
        statelessJob = options.jobContext?.stateless === !0,
        forkFromSessionId = options.resume === !1 || options.runtime !== "codex" || statelessJob ? void 0 : sessionInfo.forkFrom,
        resumeSessionId = options.resume === !1 || forkFromSessionId || statelessJob ? void 0 : sessionInfo.sessionId,
        handleExecutionEvent = wrapHandler(createDrainExecutionEventRecorder(paths, sessionKey, anchor.event.session_key ?? sessionKey, options.onExecutionEvent, anchor.event.id)),
        payloadMediaRefs = extractPayloadMediaRefs(anchor.event.payload),
        batchEventIds = batch.map(entry => entry.event.id),
        anchorChannelConfig = applyJobSdkConfigOverride(await runTimedDrainPhase(perf, "effective_config_ms", async () => resolveEffectiveChannelConfigForEvent(paths, anchor.event)), options.jobContext?.sdkConfig),
        isChannelSession = classifySessionKeyOrUnknown(sessionKey) === "channel",
        isUserMessage = batch.some(entry => isChannelMessageEvent(entry.event)),
        timeGapContext = computeTimeGapContext({
            consumed: injectionState.timeGapConsumed,
            timeGapMinutes: anchorChannelConfig?.time_gap_minutes,
            isChannelSession,
            isUserMessage,
            lastEventAt: injectionState.lastEventAtWatermark,
            currentEventAt: batch[0].event.ts
        }),
        coalescedDrainPrompt = renderCoalescedDrainPrompt(batch),
        compactNotice = (anchorChannelConfig?.auto_compact_idle_minutes ?? 0) > 0 ? injectionState.compactNotice : void 0,
        transientUserBlocks = buildTransientUserBlocks(coalescedDrainPrompt, {
            gatewayNotice: injectionState.pendingGatewayNotice,
            interruptedContext: injectionState.pendingInterruptedContext,
            skipRewind: injectionState.pendingSkipRewind,
            isUserMessage,
            timeGap: timeGapContext,
            jobReceipts: injectionState.jobReceipts,
            daemonRestartHint: injectionState.daemonRestartHint,
            compactNotice,
            boardUpdated: injectionState.boardUpdated
        }, sessionInfo),
        timeGapConsumed = injectionState.timeGapConsumed || transientUserBlocks.timeGapInjected,
        systemPromptForChannelConfig = buildSystemPromptForChannelConfig(anchorChannelConfig, sessionKey, projectJobPromptContext(options.jobContext), options.memoryBoard, options.runtime),
        turnSdkRunConfig = buildTurnSdkRunConfig(options, anchorChannelConfig);
    return {
        anchor,
        resumeSessionId,
        forkFromSessionId,
        handleExecutionEvent,
        attachments: payloadMediaRefs,
        batchEventIds,
        anchorChannelConfig,
        coalescedPromptText: coalescedDrainPrompt,
        injectionResult: transientUserBlocks,
        systemPrompt: systemPromptForChannelConfig,
        sdkRunConfig: turnSdkRunConfig,
        timeGapConsumed,
        isNotifyOnly: isChannelSession && !isUserMessage
    }
}
