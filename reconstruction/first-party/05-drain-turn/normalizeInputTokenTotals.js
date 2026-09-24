// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: normalizeInputTokenTotals  (minified: kSe, daemon.pretty.js:70098)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeInputTokenTotals(e) {
    let t = e.input_tokens ?? 0,
        n = e.cache_read_input_tokens ?? 0,
        r = e.cache_creation_input_tokens ?? 0;
    return e.protocol === "codex" || e.protocol === "grok" ? {
        totalInput: t,
        cachedInput: n
    } : e.protocol === "anthropic" || e.protocol === "pi" ? {
        totalInput: t + n + r,
        cachedInput: n
    } : {
        totalInput: t,
        cachedInput: void 0
    }
}
