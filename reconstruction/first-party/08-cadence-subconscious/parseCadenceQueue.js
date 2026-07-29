// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseCadenceQueue  (minified: ghe, daemon.pretty.js:74931)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function parseCadenceQueue(e) {
    let t;
    try {
        t = await fd.readFile(e.cadenceQueuePath, "utf8")
    } catch {
        return []
    }
    return $et(t).filter(r => r.trim().startsWith("- [ ]"))
}
