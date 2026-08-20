// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: Mot, daemon.pretty.js:78308)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(e) {
    let {
        paths: t,
        sessionManager: n
    } = e, r = e.intervalMs ?? Dot, i = null, o = !1, s = null, a = !1;
    async function l() {
        if (o || a) {
            o && Ae("[job-scheduler] scan skipped: previous scan still running");
            return
        }
        o = !0;
        let u = Date.now();
        try {
            let c = await scanAndSpawnDueJobs(t, n);
            Ae("[job-scheduler] scan complete", {
                scanned: c.scanned,
                spawned: c.spawned.length,
                spawnedIds: c.spawned,
                durationMs: Date.now() - u
            })
        } catch (c) {
            et("[job-scheduler] scan error", c)
        } finally {
            o = !1
        }
    }
    return {
        start() {
            i || a || (s = l(), i = setInterval(() => {
                s = l()
            }, r), K("[job-scheduler] started", {
                intervalMs: r
            }))
        },
        async stop() {
            if (a = !0, i && (clearInterval(i), i = null), s) {
                try {
                    await s
                } catch {}
                s = null
            }
            K("[job-scheduler] stopped")
        },
        isScanning() {
            return o
        }
    }
}
