// duoduo reconstruction — subsystem: 09-memory
// symbol: buildMemoryCheckStatus  (minified: JH, daemon.pretty.js:68850)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildMemoryCheckStatus(e) {
    let t = resolveMemoryCheckFlags(),
        n;
    try {
        n = Kwe(e.subconsciousDir)
    } catch {
        n = void 0
    }
    return {
        check_enabled: t.check,
        forget_enabled: t.forget,
        partitions: n
    }
}
