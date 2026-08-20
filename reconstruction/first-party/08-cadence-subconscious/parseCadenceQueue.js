// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseCadenceQueue  (minified: G_e, daemon.pretty.js:78112)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function parseCadenceQueue(e) {
    let t;
    try {
        t = await Wd.readFile(e.cadenceQueuePath, "utf8")
    } catch {
        return []
    }
    return Not(t).filter(r => r.trim().startsWith("- [ ]"))
}
