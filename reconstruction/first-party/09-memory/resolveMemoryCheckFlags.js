// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: W6, daemon.pretty.js:68543)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
    let e = isTruthyEnvFlag("ALADUO_EXP_MEMORY_CHECK"),
        t = isTruthyEnvFlag("ALADUO_EXP_MEMORY_FORGET") && e;
    return {
        check: e,
        forget: t
    }
}
