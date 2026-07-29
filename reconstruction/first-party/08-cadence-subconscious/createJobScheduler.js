// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: Cet, daemon.pretty.js:75127)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(e) {
    let {
        paths: t,
        sessionManager: n
    } = e, r = e.intervalMs ?? Oet, i = null, s = !1, o = null, a = !1;
    async function c() {
        if (s || a) {
            s && Pe("[job-scheduler] scan skipped: previous scan still running");
            return
        }
        s = !0;
        let u = Date.now();
        try {
            let l = await scanAndSpawnDueJobs(t, n);
            Pe("[job-scheduler] scan complete", {
                scanned: l.scanned,
                spawned: l.spawned.length,
                spawnedIds: l.spawned,
                durationMs: Date.now() - u
            })
        } catch (l) {
            Be("[job-scheduler] scan error", l)
        } finally {
            s = !1
        }
    }
    return {
        start() {
            i || a || (o = c(), i = setInterval(() => {
                o = c()
            }, r), K("[job-scheduler] started", {
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
            K("[job-scheduler] stopped")
        },
        isScanning() {
            return s
        }
    }
}
