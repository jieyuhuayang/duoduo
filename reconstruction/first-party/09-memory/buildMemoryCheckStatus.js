// duoduo reconstruction — subsystem: 09-memory
// symbol: buildMemoryCheckStatus  (minified: SW, daemon.pretty.js:70049)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildMemoryCheckStatus(ctx) {
    let memoryCheckFlags = resolveMemoryCheckFlags(),
        partitions;
    try {
        partitions = mke(ctx.subconsciousDir)
    } catch {
        partitions = void 0
    }
    return {
        check_enabled: memoryCheckFlags.check,
        forget_enabled: memoryCheckFlags.forget,
        partitions
    }
}
