// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: Vlt, daemon.pretty.js:79753)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(e) {
    let {
        paths: t,
        sessionManager: n,
        bus: r
    } = e, i = e.intervalMs ?? Hlt, o = null, s = !1, a = null, l = !1;
    async function u() {
        if (s || l) {
            s && ke("[job-scheduler] scan skipped: previous scan still running");
            return
        }
        s = !0;
        let d = Date.now();
        try {
            let p = await scanAndSpawnDueJobs(t, n);
            ke("[job-scheduler] scan complete", {
                scanned: p.scanned,
                spawned: p.spawned.length,
                spawnedIds: p.spawned,
                durationMs: Date.now() - d
            })
        } catch (p) {
            Me("[job-scheduler] scan error", p)
        } finally {
            s = !1
        }
    }

    function c() {
        s || l || (a = u())
    }
    return {
        start() {
            o || l || (r && r.on("job.created", c), a = u(), o = setInterval(() => {
                a = u()
            }, i), Q("[job-scheduler] started", {
                intervalMs: i
            }))
        },
        async stop() {
            if (l = !0, r && r.off("job.created", c), o && (clearInterval(o), o = null), a) {
                try {
                    await a
                } catch {}
                a = null
            }
            Q("[job-scheduler] stopped")
        },
        isScanning() {
            return s
        }
    }
}
