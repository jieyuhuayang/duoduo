// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: main  (minified: kvt, daemon.pretty.js:93073)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.7, v0.3.0, v0.3.1, v0.3.3, v0.4.3, v0.5.0, v0.5.3, v0.5.4, v0.5.6, v0.5.10, v0.6.2, v0.7.0, v0.7.1, v0.8.0, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.0 (medium): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function main() {
    let {
        resolveRuntimePaths: e
    } = await Promise.resolve().then(() => (Yf(), xwe)), {
        initializeRuntime: t
    } = await Promise.resolve().then(() => (initRuntimeInitializationModule(), Zke)), {
        createAgentSdkAdapter: n
    } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), tC)), {
        createSessionManager: r
    } = await Promise.resolve().then(() => (eIe(), QRe)), {
        createMetaSession: i
    } = await Promise.resolve().then(() => (initMetaSessionModule(), nIe)), {
        runCadenceTick: o
    } = await Promise.resolve().then(() => ($G(), uIe)), {
        createJobScheduler: s
    } = await Promise.resolve().then(() => (initJobSchedulerModule(), lIe)), {
        createOutboxDeliveryManager: a
    } = await Promise.resolve().then(() => (fIe(), dIe)), {
        clearHostModelEnvVars: u,
        loadHostDotEnv: l
    } = await Promise.resolve().then(() => (XH(), YSe));
    process.on("unhandledRejection", j => {
        logErrorMessage("[pid0] unhandled promise rejection (contained, daemon survives)", j)
    }), process.on("uncaughtException", j => {
        logErrorMessage("[pid0] uncaught exception (likely corrupted state, exiting for clean restart)", j), process.exit(1)
    });
    let c = await l();
    c > 0 && logInfoMessage(`[pid0] loaded ${c} env var(s) from ~/.config/duoduo/.env`), readClaudeAuthSourceEnv(process.env) === "claude_code_local" && u(process.env), delete process.env[tl], resolveDefaultRuntime();
    let d = e(),
        f = await acquireRuntimeWriterLock(d);
    if (!f.acquired) throw new Error(`Runtime lock already held by pid=${f.lock?.pid??"unknown"} at ${f.lockPath}`);
    try {
        await t(d);
        let j = await pruneEventIdIndexByRetention(d, {
            retentionDays: readSpineIndexRetentionDays()
        });
        logInfoMessage(`[pid0] spine by-id index retention: kept=${j.kept} dropped=${j.dropped} cutoff=${j.cutoff}`)
    } catch (j) {
        throw await releaseRuntimeWriterLock(d), j
    }
    let p = await buildSessionIndexFromDisk(d);
    logInfoMessage(`[pid0] session index populated: ${p.size()} entries`), await gve(_O(d));
    let m = await claimDaemonRestartReason(d);
    setPendingRestartReason(m), m && logInfoMessage("[pid0] restart reason claimed", {
        requested_at: m.requested_at,
        requested_by_agent: m.requested_by_agent,
        wake_targets: m.wake_targets
    });
    let h = _ve(),
        {
            probeClaudeAvailability: g
        } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), tC)),
        {
            primeCodexAvailability: y,
            isCodexAvailable: v
        } = await Promise.resolve().then(() => (initCodexAppServerModule(), $6)),
        {
            primeGrokAvailability: b,
            isGrokAvailable: _,
            grokUnavailableReason: E
        } = await Promise.resolve().then(() => (initGrokAcpRuntimeModule(), D6)),
        [R] = await Promise.all([g(), y(), b()]),
        P = v(),
        k = _(),
        S = R.ok ? n() : void 0;
    logInfoMessage("[pid0] available runtimes at boot", {
        claude: R.ok,
        codex: P,
        grok: k,
        pi: !0,
        claudeReason: R.ok ? void 0 : R.reason,
        grokReason: k ? void 0 : E()
    });
    let D = createSessionSubscriptionRegistry(),
        A = r({
            paths: d,
            bus: h,
            sdk: S,
            idleTimeoutMs: Number(process.env.ALADUO_SESSION_IDLE_MS ?? 36e5),
            maxConcurrentChannel: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_CHANNEL ?? process.env.ALADUO_SESSION_MAX_CONCURRENT ?? 10),
            maxConcurrentJob: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_JOB ?? 6),
            heartbeatIntervalMs: Number(process.env.ALADUO_SESSION_HEARTBEAT_MS ?? 3e4)
        }),
        $ = createDaemon({
            paths: d,
            bus: h,
            sdk: S,
            subscriptions: D,
            sessionManager: A,
            sessionIndex: p,
            runtimeLockAlreadyHeld: !0
        }),
        C = Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233);
    await $.start(C, "127.0.0.1"), logAlwaysAtLevel("info", `[pid0] aladuo daemon started on :${C}, pid=${process.pid}`), await A.start(), m?.wake_targets?.length && await deliverDaemonRestartWakes(d, h, p, m).catch(j => {
        logErrorMessage("[pid0] restart wake delivery error", j)
    }), D.setAttachmentCallbacks(createVoidAwareAttachmentCallbacks(d, A, j => {
        logErrorMessage("[pid0] channel attachment tracking error", j)
    }));
    let N = a({
        paths: d,
        bus: h,
        subscriptions: D
    });
    N.start(), N.flushPending().catch(j => {
        logErrorMessage("[pid0] outbox initial flush error", j)
    });
    let x = s({
        paths: d,
        sessionManager: A,
        bus: h
    });
    x.start();
    let M = createIdleCompactSweeper({
        paths: d,
        sessionManager: A,
        sessionIndex: p,
        bus: h
    });
    M.start();
    let F = readEnvIntegerOrFallback("ALADUO_CADENCE_INTERVAL_MS", 222e4, 1e3);
    logInfoMessage("[pid0] cadence rhythm", {
        cadenceIntervalMs: F
    });
    let J = !1,
        ce = setInterval(() => {
            if (h.emit("cadence.tick"), J) {
                logDebugMessage("[pid0] cadence tick skipped: still processing previous tick");
                return
            }
            J = !0;
            let j = Date.now();
            o(d).then(() => {
                logDebugMessage("[pid0] cadence tick complete", {
                    durationMs: Date.now() - j
                })
            }).catch(ne => {
                logErrorMessage("[pid0] cadence tick error", ne)
            }).finally(() => {
                J = !1
            })
        }, F);
    logAlwaysAtLevel("info", `[pid0] cadence timer started, interval=${F}ms`);
    let ie = i({
        paths: d,
        bus: h,
        sdk: S,
        sessionManager: A,
        cadenceIntervalMs: F
    });
    ie.start();
    let Ce = !1,
        se = async j => {
            Ce || (Ce = !0, logAlwaysAtLevel("info", `[pid0] received ${j}, shutting down...`), await x.stop(), await M.stop(), clearInterval(ce), h.emit("shutdown"), await ie.stop(), await A.stop(), await N.stop(), await $.stop(), h.removeAllListeners(), logAlwaysAtLevel("info", "[pid0] shutdown complete"), process.exit(0))
        };
    process.on("SIGTERM", () => se("SIGTERM")), process.on("SIGINT", () => se("SIGINT"))
}
