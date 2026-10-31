// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: normalizeInputTokenTotals  (minified: CEe, daemon.pretty.js:71588)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0 (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): Every finalized turn now appends a one-line footer: `↑ in · cache% · ↓ out · $cost` for Claude turns
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeInputTokenTotals(usage) {
    let inputTokens = usage.input_tokens ?? 0,
        cacheReadTokens = usage.cache_read_input_tokens ?? 0,
        cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
    return usage.protocol === "codex" || usage.protocol === "grok" ? {
        totalInput: inputTokens,
        cachedInput: cacheReadTokens
    } : usage.protocol === "anthropic" || usage.protocol === "pi" ? {
        totalInput: inputTokens + cacheReadTokens + cacheCreationTokens,
        cachedInput: cacheReadTokens
    } : {
        totalInput: inputTokens,
        cachedInput: void 0
    }
}
