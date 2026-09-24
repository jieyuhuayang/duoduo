// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: prepareDrainTurnContext  (minified: SH, daemon.pretty.js:70284)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function prepareDrainTurnContext(e, t, n, r, i, o, s, a) {
    let u = r[r.length - 1],
        l = n.jobContext?.stateless === !0,
        c = n.resume === !1 || n.runtime !== "codex" || l ? void 0 : i.forkFrom,
        d = n.resume === !1 || c || l ? void 0 : i.sessionId,
        f = a(createDrainExecutionEventRecorder(e, t, u.event.session_key ?? t, n.onExecutionEvent, u.event.id)),
        p = kH(u.event.payload),
        m = r.map(D => D.event.id),
        h = applyJobSdkConfigOverride(await runTimedDrainPhase(s, "effective_config_ms", async () => resolveEffectiveChannelConfigForEvent(e, u.event)), n.jobContext?.sdkConfig),
        g = classifySessionKeyOrUnknown(t) === "channel",
        y = r.some(D => EO(D.event)),
        v = computeTimeGapContext({
            consumed: o.timeGapConsumed,
            timeGapMinutes: h?.time_gap_minutes,
            isChannelSession: g,
            isUserMessage: y,
            lastEventAt: o.lastEventAtWatermark,
            currentEventAt: r[0].event.ts
        }),
        b = renderCoalescedDrainPrompt(r),
        _ = (h?.auto_compact_idle_minutes ?? 0) > 0 ? o.compactNotice : void 0,
        I = buildTransientUserBlocks(b, {
            gatewayNotice: o.pendingGatewayNotice,
            interruptedContext: o.pendingInterruptedContext,
            skipRewind: o.pendingSkipRewind,
            isUserMessage: y,
            timeGap: v,
            jobReceipts: o.jobReceipts,
            daemonRestartHint: o.daemonRestartHint,
            compactNotice: _,
            boardUpdated: o.boardUpdated
        }, i),
        E = o.timeGapConsumed || I.timeGapInjected,
        R = buildSystemPromptForChannelConfig(h, t, projectJobPromptContext(n.jobContext), n.memoryBoard, n.runtime),
        x = buildTurnSdkRunConfig(n, h);
    return {
        anchor: u,
        resumeSessionId: d,
        forkFromSessionId: c,
        handleExecutionEvent: f,
        attachments: p,
        batchEventIds: m,
        anchorChannelConfig: h,
        coalescedPromptText: b,
        injectionResult: I,
        systemPrompt: R,
        sdkRunConfig: x,
        timeGapConsumed: E,
        isNotifyOnly: g && !y
    }
}
