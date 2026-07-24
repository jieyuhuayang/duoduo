// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createJobScheduler  (minified: TQe, daemon.pretty.js:75422)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobScheduler(e) {
 let {
  paths: t,
  sessionManager: n
 } = e, r = e.intervalMs ?? EQe, i = null, o = !1, s = null, a = !1;
 async function c() {
  if (o || a) {
   o && Ue("[job-scheduler] scan skipped: previous scan still running");
   return
  }
  o = !0;
  let u = Date.now();
  try {
   let l = await scanAndSpawnDueJobs(t, n);
   Ue("[job-scheduler] scan complete", {
    scanned: l.scanned,
    spawned: l.spawned.length,
    spawnedIds: l.spawned,
    durationMs: Date.now() - u
   })
  } catch (l) {
   Xe("[job-scheduler] scan error", l)
  } finally {
   o = !1
  }
 }
 return {
  start() {
   i || a || (s = c(), i = setInterval(() => {
    s = c()
   }, r), ee("[job-scheduler] started", {
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
   ee("[job-scheduler] stopped")
  },
  isScanning() {
   return o
  }
 }
}
