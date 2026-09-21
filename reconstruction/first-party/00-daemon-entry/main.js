// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: main  (minified: Nyt, daemon.pretty.js:91451)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function main() {
    let {
        resolveRuntimePaths: e
    } = await Promise.resolve().then(() => (gg(), ive)), {
        initializeRuntime: t
    } = await Promise.resolve().then(() => (oSe(), iSe)), {
        createAgentSdkAdapter: n
    } = await Promise.resolve().then(() => (vo(), bC)), {
        createSessionManager: r
    } = await Promise.resolve().then(() => (u0e(), a0e)), {
        createMetaSession: i
    } = await Promise.resolve().then(() => (d0e(), c0e)), {
        runCadenceTick: o
    } = await Promise.resolve().then(() => (yJ(), g0e)), {
        createJobScheduler: s
    } = await Promise.resolve().then(() => (_0e(), y0e)), {
        createOutboxDeliveryManager: a
    } = await Promise.resolve().then(() => (v0e(), b0e)), {
        clearHostModelEnvVars: u,
        loadHostDotEnv: l
    } = await Promise.resolve().then(() => (Y6(), Nwe));
    process.on("unhandledRejection", M => {
        Le("[pid0] unhandled promise rejection (contained, daemon survives)", M)
    }), process.on("uncaughtException", M => {
        Le("[pid0] uncaught exception (likely corrupted state, exiting for clean restart)", M), process.exit(1)
    });
    let c = await l();
    c > 0 && Q(`[pid0] loaded ${c} env var(s) from ~/.config/duoduo/.env`), X6(process.env) === "claude_code_local" && u(process.env);
    let d = e(),
        f = await f6(d);
    if (!f.acquired) throw new Error(`Runtime lock already held by pid=${f.lock?.pid??"unknown"} at ${f.lockPath}`);
    try {
        await t(d);
        let M = await ose(d, {
            retentionDays: ise()
        });
        Q(`[pid0] spine by-id index retention: kept=${M.kept} dropped=${M.dropped} cutoff=${M.cutoff}`)
    } catch (M) {
        throw await B$(d), M
    }
    let p = await cg(d);
    Q(`[pid0] session index populated: ${p.size()} entries`), await Y_e(M$(d));
    let m = await claimDaemonRestartReason(d);
    setPendingRestartReason(m), m && Q("[pid0] restart reason claimed", {
        requested_at: m.requested_at,
        requested_by_agent: m.requested_by_agent,
        wake_targets: m.wake_targets
    });
    let h = Q_e(),
        {
            probeClaudeAvailability: g
        } = await Promise.resolve().then(() => (vo(), bC)),
        {
            primeCodexAvailability: y,
            isCodexAvailable: v
        } = await Promise.resolve().then(() => (Df(), IV)),
        {
            primeGrokAvailability: b,
            isGrokAvailable: _,
            grokUnavailableReason: I
        } = await Promise.resolve().then(() => (ug(), OV)),
        [E] = await Promise.all([g(), y(), b()]),
        R = v(),
        x = _(),
        S = E.ok ? n() : void 0;
    Q("[pid0] available runtimes at boot", {
        claude: E.ok,
        codex: R,
        grok: x,
        pi: !0,
        claudeReason: E.ok ? void 0 : E.reason,
        grokReason: x ? void 0 : I()
    });
    let D = u6(),
        A = r({
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
            sessionManager: A,
            sessionIndex: p,
            runtimeLockAlreadyHeld: !0
        }),
        $ = Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233);
    await C.start($, "127.0.0.1"), wt("info", `[pid0] aladuo daemon started on :${$}, pid=${process.pid}`), await A.start(), m?.wake_targets?.length && await deliverDaemonRestartWakes(d, h, p, m).catch(M => {
        Le("[pid0] restart wake delivery error", M)
    }), D.setAttachmentCallbacks({
        onAttach: (M, ue) => {
            A.attachChannel(M, ue)
        },
        onDetach: (M, ue) => {
            A.detachChannel(M, ue)
        }
    });
    let j = a({
        paths: d,
        bus: h,
        subscriptions: D
    });
    j.start(), j.flushPending().catch(M => {
        Le("[pid0] outbox initial flush error", M)
    });
    let k = s({
        paths: d,
        sessionManager: A,
        bus: h
    });
    k.start();
    let L = Ybe({
        paths: d,
        sessionManager: A,
        sessionIndex: p,
        bus: h
    });
    L.start();
    let B = T0e("ALADUO_CADENCE_INTERVAL_MS", 222e4, 1e3);
    Q("[pid0] cadence rhythm", {
        cadenceIntervalMs: B
    });
    let G = !1,
        ce = setInterval(() => {
            if (h.emit("cadence.tick"), G) {
                Ee("[pid0] cadence tick skipped: still processing previous tick");
                return
            }
            G = !0;
            let M = Date.now();
            o(d).then(() => {
                Ee("[pid0] cadence tick complete", {
                    durationMs: Date.now() - M
                })
            }).catch(ue => {
                Le("[pid0] cadence tick error", ue)
            }).finally(() => {
                G = !1
            })
        }, B);
    wt("info", `[pid0] cadence timer started, interval=${B}ms`);
    let J = i({
        paths: d,
        bus: h,
        sdk: S,
        sessionManager: A,
        cadenceIntervalMs: B
    });
    J.start();
    let ee = !1,
        le = async M => {
            ee || (ee = !0, wt("info", `[pid0] received ${M}, shutting down...`), await k.stop(), await L.stop(), clearInterval(ce), h.emit("shutdown"), await J.stop(), await A.stop(), await j.stop(), await C.stop(), h.removeAllListeners(), wt("info", "[pid0] shutdown complete"), process.exit(0))
        };
    process.on("SIGTERM", () => le("SIGTERM")), process.on("SIGINT", () => le("SIGINT"))
}
