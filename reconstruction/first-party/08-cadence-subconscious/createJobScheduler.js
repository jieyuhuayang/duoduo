// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: Nkt, daemon.pretty.js:89136)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 14 renamed — 5 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(options) {
    let {
        paths,
        sessionManager,
        bus
    } = options, intervalMs = options.intervalMs ?? Akt, intervalTimer = null, scanning = !1, scanPromise = null, stopped = !1;
    async function runScan() {
        if (scanning || stopped) {
            scanning && logDebugMessage("[job-scheduler] scan skipped: previous scan still running");
            return
        }
        scanning = !0;
        let now = Date.now();
        try {
            let scanResult = await scanAndSpawnDueJobs(paths, sessionManager, {
                bus
            });
            logDebugMessage("[job-scheduler] scan complete", {
                scanned: scanResult.scanned,
                spawned: scanResult.spawned.length,
                spawnedIds: scanResult.spawned,
                wakesFired: scanResult.wakesFired.length,
                durationMs: Date.now() - now
            })
        } catch (err) {
            logErrorMessage("[job-scheduler] scan error", err)
        } finally {
            scanning = !1
        }
    }

    function onJobCreated() {
        scanning || stopped || (scanPromise = runScan())
    }
    return {
        start() {
            intervalTimer || stopped || (bus && bus.on("job.created", onJobCreated), scanPromise = runScan(), intervalTimer = setInterval(() => {
                scanPromise = runScan()
            }, intervalMs), logInfoMessage("[job-scheduler] started", {
                intervalMs
            }))
        },
        async stop() {
            if (stopped = !0, bus && bus.off("job.created", onJobCreated), intervalTimer && (clearInterval(intervalTimer), intervalTimer = null), scanPromise) {
                try {
                    await scanPromise
                } catch {}
                scanPromise = null
            }
            logInfoMessage("[job-scheduler] stopped")
        },
        isScanning() {
            return scanning
        }
    }
}
