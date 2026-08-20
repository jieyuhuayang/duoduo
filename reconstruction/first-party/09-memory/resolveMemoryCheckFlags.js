// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: g2, daemon.pretty.js:58358)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
    let e = m2("ALADUO_EXP_MEMORY_CHECK"),
        t = m2("ALADUO_EXP_MEMORY_FORGET") && e;
    return {
        check: e,
        forget: t
    }
}
