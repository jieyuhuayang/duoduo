// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: main  (minified: kxt, daemon.pretty.js:95201)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.7, v0.3.0, v0.3.1, v0.3.3, v0.4.3, v0.5.0, v0.5.3, v0.5.4, v0.5.6, v0.5.10, v0.6.2, v0.7.0, v0.7.1, v0.8.0, v0.8.4 (maps/history_daemon.json)
// locals: 49 renamed — 24 from the code at the binding (rule), 25 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function main() {
    let {
        resolveRuntimePaths
    } = await Promise.resolve().then(() => (rp(), bke)), {
        initializeRuntime
    } = await Promise.resolve().then(() => (initRuntimeInitializationModule(), H0e)), {
        createAgentSdkAdapter
    } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), yC)), {
        createSessionManager
    } = await Promise.resolve().then(() => (ZTe(), GTe)), {
        createMetaSession
    } = await Promise.resolve().then(() => (initMetaSessionModule(), YTe)), {
        runCadenceTick
    } = await Promise.resolve().then(() => (dZ(), rPe)), {
        createJobScheduler
    } = await Promise.resolve().then(() => (initJobSchedulerModule(), iPe)), {
        createOutboxDeliveryManager
    } = await Promise.resolve().then(() => (aPe(), sPe)), {
        clearHostModelEnvVars,
        loadHostDotEnv
    } = await Promise.resolve().then(() => (AW(), Wxe));
    process.on("unhandledRejection", reason => {
        logErrorMessage("[pid0] unhandled promise rejection (contained, daemon survives)", reason)
    }), process.on("uncaughtException", err => {
        logErrorMessage("[pid0] uncaught exception (likely corrupted state, exiting for clean restart)", err), process.exit(1)
    });
    let loadedEnvCount = await loadHostDotEnv();
    loadedEnvCount > 0 && logInfoMessage(`[pid0] loaded ${loadedEnvCount} env var(s) from ~/.config/duoduo/.env`), readClaudeAuthSourceEnv(process.env) === "claude_code_local" && clearHostModelEnvVars(process.env), delete process.env[tl], resolveDefaultRuntime();
    let paths = resolveRuntimePaths(),
        runtimeWriterLock = await acquireRuntimeWriterLock(paths);
    if (!runtimeWriterLock.acquired) throw new Error(`Runtime lock already held by pid=${runtimeWriterLock.lock?.pid??"unknown"} at ${runtimeWriterLock.lockPath}`);
    try {
        await initializeRuntime(paths);
        let pruneResult = await pruneEventIdIndexByRetention(paths, {
            retentionDays: readSpineIndexRetentionDays()
        });
        logInfoMessage(`[pid0] spine by-id index retention: kept=${pruneResult.kept} dropped=${pruneResult.dropped} cutoff=${pruneResult.cutoff}`)
    } catch (err) {
        throw await releaseRuntimeWriterLock(paths), err
    }
    let sessionIndexFromDisk = await buildSessionIndexFromDisk(paths);
    logInfoMessage(`[pid0] session index populated: ${sessionIndexFromDisk.size()} entries`), await dSe(NO(paths));
    let restartReason = await claimDaemonRestartReason(paths);
    setPendingRestartReason(restartReason), restartReason && logInfoMessage("[pid0] restart reason claimed", {
        requested_at: restartReason.requested_at,
        requested_by_agent: restartReason.requested_by_agent,
        wake_targets: restartReason.wake_targets
    });
    let bus = pSe(),
        {
            probeClaudeAvailability
        } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), yC)),
        {
            primeCodexAvailability,
            isCodexAvailable
        } = await Promise.resolve().then(() => (initCodexAppServerModule(), d6)),
        {
            primeGrokAvailability,
            isGrokAvailable,
            grokUnavailableReason
        } = await Promise.resolve().then(() => (initGrokAcpRuntimeModule(), g6)),
        [claudeAvailability] = await Promise.all([probeClaudeAvailability(), primeCodexAvailability(), primeGrokAvailability()]),
        codexAvailable = isCodexAvailable(),
        grokAvailable = isGrokAvailable(),
        sdk = claudeAvailability.ok ? createAgentSdkAdapter() : void 0;
    logInfoMessage("[pid0] available runtimes at boot", {
        claude: claudeAvailability.ok,
        codex: codexAvailable,
        grok: grokAvailable,
        pi: !0,
        claudeReason: claudeAvailability.ok ? void 0 : claudeAvailability.reason,
        grokReason: grokAvailable ? void 0 : grokUnavailableReason()
    });
    let sessionSubscriptionRegistry = createSessionSubscriptionRegistry(),
        sessionManager = createSessionManager({
            paths,
            bus,
            sdk,
            idleTimeoutMs: Number(process.env.ALADUO_SESSION_IDLE_MS ?? 36e5),
            maxConcurrentChannel: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_CHANNEL ?? process.env.ALADUO_SESSION_MAX_CONCURRENT ?? 10),
            maxConcurrentJob: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_JOB ?? 6),
            heartbeatIntervalMs: Number(process.env.ALADUO_SESSION_HEARTBEAT_MS ?? 3e4)
        }),
        daemon = createDaemon({
            paths,
            bus,
            sdk,
            subscriptions: sessionSubscriptionRegistry,
            sessionManager,
            sessionIndex: sessionIndexFromDisk,
            runtimeLockAlreadyHeld: !0
        }),
        port = Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233);
    await daemon.start(port, "127.0.0.1"), logAlwaysAtLevel("info", `[pid0] aladuo daemon started on :${port}, pid=${process.pid}`), await sessionManager.start(), restartReason?.wake_targets?.length && await deliverDaemonRestartWakes(paths, bus, sessionIndexFromDisk, restartReason).catch(err => {
        logErrorMessage("[pid0] restart wake delivery error", err)
    }), sessionSubscriptionRegistry.setAttachmentCallbacks(createVoidAwareAttachmentCallbacks(paths, sessionManager, err => {
        logErrorMessage("[pid0] channel attachment tracking error", err)
    }));
    let outboxDeliveryManager = createOutboxDeliveryManager({
        paths,
        bus,
        subscriptions: sessionSubscriptionRegistry
    });
    outboxDeliveryManager.start(), outboxDeliveryManager.flushPending().catch(err => {
        logErrorMessage("[pid0] outbox initial flush error", err)
    });
    let jobScheduler = createJobScheduler({
        paths,
        sessionManager,
        bus
    });
    jobScheduler.start();
    let idleCompactSweeper = createIdleCompactSweeper({
        paths,
        sessionManager,
        sessionIndex: sessionIndexFromDisk,
        bus
    });
    idleCompactSweeper.start();
    let envIntegerOrFallback = readEnvIntegerOrFallback("ALADUO_CADENCE_INTERVAL_MS", 222e4, 1e3);
    logInfoMessage("[pid0] cadence rhythm", {
        cadenceIntervalMs: envIntegerOrFallback
    });
    let tickInFlight = !1,
        cadenceTimer = setInterval(() => {
            if (bus.emit("cadence.tick"), tickInFlight) {
                logDebugMessage("[pid0] cadence tick skipped: still processing previous tick");
                return
            }
            tickInFlight = !0;
            let now = Date.now();
            runCadenceTick(paths).then(() => {
                logDebugMessage("[pid0] cadence tick complete", {
                    durationMs: Date.now() - now
                })
            }).catch(err => {
                logErrorMessage("[pid0] cadence tick error", err)
            }).finally(() => {
                tickInFlight = !1
            })
        }, envIntegerOrFallback);
    logAlwaysAtLevel("info", `[pid0] cadence timer started, interval=${envIntegerOrFallback}ms`);
    let metaSession = createMetaSession({
        paths,
        bus,
        sdk,
        sessionManager,
        cadenceIntervalMs: envIntegerOrFallback
    });
    metaSession.start();
    let shuttingDown = !1,
        shutdown = async signal => {
            shuttingDown || (shuttingDown = !0, logAlwaysAtLevel("info", `[pid0] received ${signal}, shutting down...`), await jobScheduler.stop(), await idleCompactSweeper.stop(), clearInterval(cadenceTimer), bus.emit("shutdown"), await metaSession.stop(), await sessionManager.stop(), await outboxDeliveryManager.stop(), await daemon.stop(), bus.removeAllListeners(), logAlwaysAtLevel("info", "[pid0] shutdown complete"), process.exit(0))
        };
    process.on("SIGTERM", () => shutdown("SIGTERM")), process.on("SIGINT", () => shutdown("SIGINT"))
}
