// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: jft, daemon.pretty.js:68864)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.5.8, v0.7.1, v0.8.0 (maps/history_daemon.json)
// locals: 33 renamed — 6 from the code at the binding (rule), 27 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (high): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(ctx, nowMs) {
    let {
        check,
        forget
    } = resolveMemoryCheckFlags();
    isTruthyEnvFlag("ALADUO_EXP_MEMORY_FORGET") && !check && logErrorMessage("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
    let result = {
            checkEnabled: check,
            forgetEnabled: forget,
            posted: [],
            swept: [],
            withheld: [],
            forgotten: [],
            sparedUnwarnable: []
        },
        signalCtx = {
            subconsciousDir: ctx.subconsciousDir,
            varDir: ctx.varDir,
            flagFallback: check
        },
        hasConsumer = evaluatePredicateOrFalse(() => hasAnyMemorySignalConsumer(signalCtx));
    if (!hasConsumer && !forget) return result;
    let memoryDir = ctx.memoryDir,
        selectedSignals = [],
        postedPaths = [],
        deliver = signals => {
            selectedSignals.push(...signals);
            let delivery = postMemorySignalsToInboxes(signals, signalCtx);
            postedPaths.push(...delivery.posted), result.posted.push(...delivery.posted), result.withheld.push(...delivery.withheld);
            for (let message of delivery.errors) logErrorMessage(`[memory] pending delivery failed: ${message}`)
        },
        orphanStates = null,
        orphanStatesOk = runReadAuditedMemoryCheckStep("orphan-states", () => {
            let orphanMemory = detectOrphanMemory(memoryDir, {
                refTimestampMs: nowMs
            });
            orphanMemory.missing || (orphanStates = orphanMemory.states)
        }),
        allReadsClean = orphanStates !== null && orphanStatesOk,
        activationMetrics = null;
    if (hasConsumer) {
        let intuitionWeaverLastFinishedMs = await readIntuitionWeaverLastFinishedMs(ctx);
        allReadsClean = runReadAuditedMemoryCheckStep("board-lint", () => {
            deliver(collectBoardLintReport(memoryDir, BH).selections)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("entity-lint", () => {
            deliver(runEntityLint(memoryDir, BH).selected)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("node-lint", () => {
            deliver(runNodeLint(memoryDir, BH).selected)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("gap-lint", () => {
            let gapResult = deliverScanGapSignal(ctx.eventsDir, memoryDir, nowMs, signalCtx, {
                cadenceIntervalMs: resolveCadenceIntervalMs()
            });
            result.posted.push(...gapResult.delivery.posted), result.withheld.push(...gapResult.delivery.withheld);
            for (let message of gapResult.delivery.errors) logErrorMessage(`[memory] pending delivery failed: ${message}`)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("fold-lint", () => {
            deliver(runFoldGapLint(memoryDir, intuitionWeaverLastFinishedMs).selected)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("broadcast-budget", () => {
            deliver(runBroadcastBudgetLint(memoryDir).selected)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("broadcast-lint", () => {
            deliver(runBroadcastLinkLint(memoryDir).selected)
        }) && allReadsClean, allReadsClean = runReadAuditedMemoryCheckStep("broadcast-flatten", () => {
            deliver(runBroadcastFlattenLint(memoryDir).selected)
        }) && allReadsClean;
        let activation, activationOk = runReadAuditedMemoryCheckStep("activation-lint", () => {
            activation = runActivationLint(ctx.eventsDir, memoryDir, nowMs)
        });
        allReadsClean = activationOk && allReadsClean;
        let touchWindow;
        activationOk && activation && (deliver(activation.selected), activationMetrics = activation.metrics, touchWindow = activation.touchWindow), allReadsClean = runReadAuditedMemoryCheckStep("orphan-newborn-island", () => {
            if (orphanStates === null) return;
            deliver(buildOrphanNewbornSignals(orphanStates, touchWindow));
            let orphanIslandsSignal = buildOrphanIslandsSignal(filterOrphanIslands(orphanStates), nowMs, void 0, void 0, touchWindow);
            orphanIslandsSignal && deliver([orphanIslandsSignal])
        }) && allReadsClean, allReadsClean && runMemoryCheckSubStep("inbox-sync", () => {
            let sweep = reconcileMemorySignalInboxes(selectedSignals, postedPaths, signalCtx);
            result.swept.push(...sweep.removed);
            for (let message of sweep.errors) logErrorMessage(`[memory] inbox sync failed: ${message}`)
        })
    }
    let metrics = activationMetrics;
    return metrics !== null && metrics.expansionRate !== null && await recordTelemetryMetric(ctx, "memory_activation_loss", metrics.expansionRate, {
        window_days: metrics.windowDays,
        interaction_days: metrics.interactionDays,
        window_start: metrics.windowStart,
        window_end: metrics.windowEnd,
        foreground_tool_events: metrics.foregroundToolEvents,
        memory_touches: metrics.memoryTouches,
        files_touched: metrics.filesTouched,
        inventory: metrics.inventory,
        foreground_writes: metrics.foregroundWrites,
        expansion_rate: metrics.expansionRate,
        live_ratio: metrics.liveRatio,
        dead_weight: metrics.coldCount,
        wiring_incompleteness: metrics.wiringIncompleteness
    }), forget && runMemoryCheckSubStep("orphan-forget", () => {
        if (orphanStates === null) return;
        let forgettable = [];
        for (let state of orphanStates) {
            if (state.state !== "STALE") {
                forgettable.push(state);
                continue
            }
            isOrphanWarningDeliverable(signalCtx, routeContractDecision(state)) ? forgettable.push(state) : result.sparedUnwarnable.push(state.rel)
        }
        result.forgotten.push(...forgetMemoryEntry(forgettable, ctx.kernelDir, {
            dryRun: !1
        }))
    }), (result.posted.length > 0 || result.swept.length > 0 || result.forgotten.length > 0 || result.withheld.length > 0 || result.sparedUnwarnable.length > 0) && logInfoMessage("[memory] check tick", {
        posted: result.posted.map(postedPath => LSe.basename(postedPath)),
        swept: result.swept.map(sweptPath => LSe.basename(sweptPath)),
        withheld: result.withheld,
        forgotten: result.forgotten,
        spared_unwarnable: result.sparedUnwarnable
    }), result
}
