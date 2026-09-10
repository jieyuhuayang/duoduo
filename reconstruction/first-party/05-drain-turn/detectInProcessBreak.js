// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: detectInProcessBreak  (minified: XL, daemon.pretty.js:36649)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectInProcessBreak(e, t) {
    if (!e || t) return !1;
    let n = e.cache_read_input_tokens ?? 0,
        r = e.cache_creation_input_tokens ?? 0,
        i = n + r;
    return i <= 0 ? !1 : n / i < IN_PROCESS_BREAK_HIT_RATIO_FLOOR
}
