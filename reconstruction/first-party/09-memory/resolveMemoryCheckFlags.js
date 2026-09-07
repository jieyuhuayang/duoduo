// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: A4, daemon.pretty.js:62099)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
    let e = O4("ALADUO_EXP_MEMORY_CHECK"),
        t = O4("ALADUO_EXP_MEMORY_FORGET") && e;
    return {
        check: e,
        forget: t
    }
}
