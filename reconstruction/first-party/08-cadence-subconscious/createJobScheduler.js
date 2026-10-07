// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: Nbt, daemon.pretty.js:87008)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(e) {
    let {
        paths: t,
        sessionManager: n,
        bus: r
    } = e, i = e.intervalMs ?? Abt, o = null, s = !1, a = null, u = !1;
    async function l() {
        if (s || u) {
            s && logDebugMessage("[job-scheduler] scan skipped: previous scan still running");
            return
        }
        s = !0;
        let d = Date.now();
        try {
            let f = await scanAndSpawnDueJobs(t, n, {
                bus: r
            });
            logDebugMessage("[job-scheduler] scan complete", {
                scanned: f.scanned,
                spawned: f.spawned.length,
                spawnedIds: f.spawned,
                wakesFired: f.wakesFired.length,
                durationMs: Date.now() - d
            })
        } catch (f) {
            logErrorMessage("[job-scheduler] scan error", f)
        } finally {
            s = !1
        }
    }

    function c() {
        s || u || (a = l())
    }
    return {
        start() {
            o || u || (r && r.on("job.created", c), a = l(), o = setInterval(() => {
                a = l()
            }, i), logInfoMessage("[job-scheduler] started", {
                intervalMs: i
            }))
        },
        async stop() {
            if (u = !0, r && r.off("job.created", c), o && (clearInterval(o), o = null), a) {
                try {
                    await a
                } catch {}
                a = null
            }
            logInfoMessage("[job-scheduler] stopped")
        },
        isScanning() {
            return s
        }
    }
}
