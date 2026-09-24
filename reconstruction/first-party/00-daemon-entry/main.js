// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: main  (minified: Fyt, daemon.pretty.js:91500)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function main() {
    let {
        resolveRuntimePaths: e
    } = await Promise.resolve().then(() => (yg(), ove)), {
        initializeRuntime: t
    } = await Promise.resolve().then(() => (sSe(), oSe)), {
        createAgentSdkAdapter: n
    } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), bC)), {
        createSessionManager: r
    } = await Promise.resolve().then(() => (c0e(), l0e)), {
        createMetaSession: i
    } = await Promise.resolve().then(() => (p0e(), f0e)), {
        runCadenceTick: o
    } = await Promise.resolve().then(() => (_J(), _0e)), {
        createJobScheduler: s
    } = await Promise.resolve().then(() => (initJobSchedulerModule(), b0e)), {
        createOutboxDeliveryManager: a
    } = await Promise.resolve().then(() => (S0e(), w0e)), {
        clearHostModelEnvVars: u,
        loadHostDotEnv: l
    } = await Promise.resolve().then(() => (X6(), Dwe));
    process.on("unhandledRejection", j => {
        Le("[pid0] unhandled promise rejection (contained, daemon survives)", j)
    }), process.on("uncaughtException", j => {
        Le("[pid0] uncaught exception (likely corrupted state, exiting for clean restart)", j), process.exit(1)
    });
    let c = await l();
    c > 0 && te(`[pid0] loaded ${c} env var(s) from ~/.config/duoduo/.env`), readClaudeAuthSourceEnv(process.env) === "claude_code_local" && u(process.env);
    let d = e(),
        f = await acquireRuntimeWriterLock(d);
    if (!f.acquired) throw new Error(`Runtime lock already held by pid=${f.lock?.pid??"unknown"} at ${f.lockPath}`);
    try {
        await t(d);
        let j = await sse(d, {
            retentionDays: ose()
        });
        te(`[pid0] spine by-id index retention: kept=${j.kept} dropped=${j.dropped} cutoff=${j.cutoff}`)
    } catch (j) {
        throw await B$(d), j
    }
    let p = await dg(d);
    te(`[pid0] session index populated: ${p.size()} entries`), await X_e(M$(d));
    let m = await claimDaemonRestartReason(d);
    setPendingRestartReason(m), m && te("[pid0] restart reason claimed", {
        requested_at: m.requested_at,
        requested_by_agent: m.requested_by_agent,
        wake_targets: m.wake_targets
    });
    let h = ebe(),
        {
            probeClaudeAvailability: g
        } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), bC)),
        {
            primeCodexAvailability: y,
            isCodexAvailable: v
        } = await Promise.resolve().then(() => (initCodexAppServerModule(), TV)),
        {
            primeGrokAvailability: b,
            isGrokAvailable: _,
            grokUnavailableReason: I
        } = await Promise.resolve().then(() => (initGrokAcpRuntimeModule(), AV)),
        [E] = await Promise.all([g(), y(), b()]),
        R = v(),
        x = _(),
        S = E.ok ? n() : void 0;
    te("[pid0] available runtimes at boot", {
        claude: E.ok,
        codex: R,
        grok: x,
        pi: !0,
        claudeReason: E.ok ? void 0 : E.reason,
        grokReason: x ? void 0 : I()
    });
    let D = createSessionSubscriptionRegistry(),
        $ = r({
            paths: d,
            bus: h,
            sdk: S,
            idleTimeoutMs: Number(process.env.ALADUO_SESSION_IDLE_MS ?? 36e5),
            maxConcurrentChannel: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_CHANNEL ?? process.env.ALADUO_SESSION_MAX_CONCURRENT ?? 10),
            maxConcurrentJob: Number(process.env.ALADUO_SESSION_MAX_CONCURRENT_JOB ?? 6),
            heartbeatIntervalMs: Number(process.env.ALADUO_SESSION_HEARTBEAT_MS ?? 3e4)
        }),
        C = createDaemon({
            paths: d,
            bus: h,
            sdk: S,
            subscriptions: D,
            sessionManager: $,
            sessionIndex: p,
            runtimeLockAlreadyHeld: !0
        }),
        A = Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233);
    await C.start(A, "127.0.0.1"), _t("info", `[pid0] aladuo daemon started on :${A}, pid=${process.pid}`), await $.start(), m?.wake_targets?.length && await deliverDaemonRestartWakes(d, h, p, m).catch(j => {
        Le("[pid0] restart wake delivery error", j)
    }), D.setAttachmentCallbacks({
        onAttach: (j, ue) => {
            $.attachChannel(j, ue)
        },
        onDetach: (j, ue) => {
            $.detachChannel(j, ue)
        }
    });
    let F = a({
        paths: d,
        bus: h,
        subscriptions: D
    });
    F.start(), F.flushPending().catch(j => {
        Le("[pid0] outbox initial flush error", j)
    });
    let k = s({
        paths: d,
        sessionManager: $,
        bus: h
    });
    k.start();
    let N = createIdleCompactSweeper({
        paths: d,
        sessionManager: $,
        sessionIndex: p,
        bus: h
    });
    N.start();
    let V = readEnvIntegerOrFallback("ALADUO_CADENCE_INTERVAL_MS", 222e4, 1e3);
    te("[pid0] cadence rhythm", {
        cadenceIntervalMs: V
    });
    let W = !1,
        ce = setInterval(() => {
            if (h.emit("cadence.tick"), W) {
                Re("[pid0] cadence tick skipped: still processing previous tick");
                return
            }
            W = !0;
            let j = Date.now();
            o(d).then(() => {
                Re("[pid0] cadence tick complete", {
                    durationMs: Date.now() - j
                })
            }).catch(ue => {
                Le("[pid0] cadence tick error", ue)
            }).finally(() => {
                W = !1
            })
        }, V);
    _t("info", `[pid0] cadence timer started, interval=${V}ms`);
    let J = i({
        paths: d,
        bus: h,
        sdk: S,
        sessionManager: $,
        cadenceIntervalMs: V
    });
    J.start();
    let ne = !1,
        fe = async j => {
            ne || (ne = !0, _t("info", `[pid0] received ${j}, shutting down...`), await k.stop(), await N.stop(), clearInterval(ce), h.emit("shutdown"), await J.stop(), await $.stop(), await F.stop(), await C.stop(), h.removeAllListeners(), _t("info", "[pid0] shutdown complete"), process.exit(0))
        };
    process.on("SIGTERM", () => fe("SIGTERM")), process.on("SIGINT", () => fe("SIGINT"))
}
