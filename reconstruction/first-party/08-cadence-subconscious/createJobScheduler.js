// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: het, daemon.pretty.js:74949)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(e) {
    let {
        paths: t,
        sessionManager: n
    } = e, r = e.intervalMs ?? met, i = null, s = !1, o = null, a = !1;
    async function u() {
        if (s || a) {
            s && Pe("[job-scheduler] scan skipped: previous scan still running");
            return
        }
        s = !0;
        let c = Date.now();
        try {
            let l = await scanAndSpawnDueJobs(t, n);
            Pe("[job-scheduler] scan complete", {
                scanned: l.scanned,
                spawned: l.spawned.length,
                spawnedIds: l.spawned,
                durationMs: Date.now() - c
            })
        } catch (l) {
            Ve("[job-scheduler] scan error", l)
        } finally {
            s = !1
        }
    }
    return {
        start() {
            i || a || (o = u(), i = setInterval(() => {
                o = u()
            }, r), J("[job-scheduler] started", {
                intervalMs: r
            }))
        },
        async stop() {
            if (a = !0, i && (clearInterval(i), i = null), o) {
                try {
                    await o
                } catch {}
                o = null
            }
            J("[job-scheduler] stopped")
        },
        isScanning() {
            return s
        }
    }
}
