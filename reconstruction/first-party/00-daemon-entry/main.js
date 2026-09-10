// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: main  (minified: pdt, daemon.pretty.js:85427)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function main() {
    let {
        resolveRuntimePaths: e
    } = await Promise.resolve().then(() => (yh(), tge)), {
        initializeRuntime: t
    } = await Promise.resolve().then(() => (n_e(), t_e)), {
        createAgentSdkAdapter: n
    } = await Promise.resolve().then(() => (lo(), wI)), {
        createSessionManager: r
    } = await Promise.resolve().then(() => (rSe(), nSe)), {
        createMetaSession: i
    } = await Promise.resolve().then(() => (sSe(), oSe)), {
        runCadenceTick: o
    } = await Promise.resolve().then(() => (j6(), dSe)), {
        createJobScheduler: s
    } = await Promise.resolve().then(() => (pSe(), fSe)), {
        createOutboxDeliveryManager: a
    } = await Promise.resolve().then(() => (hSe(), mSe)), {
        clearHostModelEnvVars: l,
        loadHostDotEnv: u
    } = await Promise.resolve().then(() => (yB(), Oye));
    process.on("unhandledRejection", z => {
        Me("[pid0] unhandled promise rejection (contained, daemon survives)", z)
    }), process.on("uncaughtException", z => {
        Me("[pid0] uncaught exception (likely corrupted state, exiting for clean restart)", z), process.exit(1)
    });
    let c = await u();
    c > 0 && ee(`[pid0] loaded ${c} env var(s) from ~/.config/duoduo/.env`), _B(process.env) === "claude_code_local" && l(process.env);
    let d = e(),
        p = await A4(d);
    if (!p.acquired) throw new Error(`Runtime lock already held by pid=${p.lock?.pid??"unknown"} at ${p.lockPath}`);
    try {
        await t(d);
        let z = await Rre(d, {
            retentionDays: Ere()
        });
        ee(`[pid0] spine by-id index retention: kept=${z.kept} dropped=${z.dropped} cutoff=${z.cutoff}`)
    } catch (z) {
        throw await AP(d), z
    }
    let f = await whe(d);
    ee(`[pid0] session index populated: ${f.size()} entries`), await Nme(EP(d));
    let m = await claimDaemonRestartReason(d);
    setPendingRestartReason(m), m && ee("[pid0] restart reason claimed", {
        requested_at: m.requested_at,
        requested_by_agent: m.requested_by_agent,
        wake_targets: m.wake_targets
    });
    let h = Mme(),
        {
            probeClaudeAvailability: g
        } = await Promise.resolve().then(() => (lo(), wI)),
        {
            primeCodexAvailability: y,
            isCodexAvailable: w
        } = await Promise.resolve().then(() => (sf(), Y2)),
        {
            primeGrokAvailability: v,
            isGrokAvailable: b,
            grokUnavailableReason: I
        } = await Promise.resolve().then(() => (ph(), n4)),
        [T] = await Promise.all([g(), y(), v()]),
        P = w(),
        k = b(),
        S = T.ok ? n() : void 0;
    ee("[pid0] available runtimes at boot", {
        claude: T.ok,
        codex: P,
        grok: k,
        pi: !0,
        claudeReason: T.ok ? void 0 : T.reason,
        grokReason: k ? void 0 : I()
    });
    let D = x4(),
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
            sessionIndex: f,
            runtimeLockAlreadyHeld: !0
        }),
        O = Number(process.env.ALADUO_PORT ?? process.env.PORT ?? 20233);
    await C.start(O, "127.0.0.1"), gt("info", `[pid0] aladuo daemon started on :${O}, pid=${process.pid}`), await $.start(), m?.wake_targets?.length && await deliverDaemonRestartWakes(d, h, f, m).catch(z => {
        Me("[pid0] restart wake delivery error", z)
    }), D.setAttachmentCallbacks({
        onAttach: (z, V) => {
            $.attachChannel(z, V)
        },
        onDetach: (z, V) => {
            $.detachChannel(z, V)
        }
    });
    let j = a({
        paths: d,
        bus: h,
        subscriptions: D
    });
    j.start(), j.flushPending().catch(z => {
        Me("[pid0] outbox initial flush error", z)
    });
    let x = s({
        paths: d,
        sessionManager: $,
        bus: h
    });
    x.start();
    let F = Lhe({
        paths: d,
        sessionManager: $,
        sessionIndex: f,
        bus: h
    });
    F.start();
    let q = kSe("ALADUO_CADENCE_INTERVAL_MS", 222e4, 1e3);
    ee("[pid0] cadence rhythm", {
        cadenceIntervalMs: q
    });
    let J = !1,
        le = setInterval(() => {
            if (h.emit("cadence.tick"), J) {
                ke("[pid0] cadence tick skipped: still processing previous tick");
                return
            }
            J = !0;
            let z = Date.now();
            o(d).then(() => {
                ke("[pid0] cadence tick complete", {
                    durationMs: Date.now() - z
                })
            }).catch(V => {
                Me("[pid0] cadence tick error", V)
            }).finally(() => {
                J = !1
            })
        }, q);
    gt("info", `[pid0] cadence timer started, interval=${q}ms`);
    let oe = i({
        paths: d,
        bus: h,
        sdk: S,
        sessionManager: $,
        cadenceIntervalMs: q
    });
    oe.start();
    let X = !1,
        te = async z => {
            X || (X = !0, gt("info", `[pid0] received ${z}, shutting down...`), await x.stop(), await F.stop(), clearInterval(le), h.emit("shutdown"), await oe.stop(), await $.stop(), await j.stop(), await C.stop(), h.removeAllListeners(), gt("info", "[pid0] shutdown complete"), process.exit(0))
        };
    process.on("SIGTERM", () => te("SIGTERM")), process.on("SIGINT", () => te("SIGINT"))
}
