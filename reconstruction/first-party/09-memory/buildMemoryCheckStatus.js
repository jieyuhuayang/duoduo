// duoduo reconstruction — subsystem: 09-memory
// symbol: buildMemoryCheckStatus  (minified: J6, daemon.pretty.js:68559)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildMemoryCheckStatus(e) {
    let t = resolveMemoryCheckFlags(),
        n;
    try {
        n = Nve(e.subconsciousDir)
    } catch {
        n = void 0
    }
    return {
        check_enabled: t.check,
        forget_enabled: t.forget,
        partitions: n
    }
}
