// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: detectInProcessBreak  (minified: Hq, daemon.pretty.js:39110)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectInProcessBreak(usage, skip) {
    if (!usage || skip) return !1;
    let cacheReadTokens = usage.cache_read_input_tokens ?? 0,
        cacheCreationTokens = usage.cache_creation_input_tokens ?? 0,
        cacheableTokens = cacheReadTokens + cacheCreationTokens;
    return cacheableTokens <= 0 ? !1 : cacheReadTokens / cacheableTokens < IN_PROCESS_BREAK_HIT_RATIO_FLOOR
}
