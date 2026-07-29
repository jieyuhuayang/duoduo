// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: kU, daemon.pretty.js:57070)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
    let e = SU("ALADUO_EXP_MEMORY_CHECK"),
        t = SU("ALADUO_EXP_MEMORY_FORGET") && e;
    return {
        check: e,
        forget: t
    }
}
