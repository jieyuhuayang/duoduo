// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: normalizeInputTokenTotals  (minified: pxe, daemon.pretty.js:70389)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.6 (medium): Every finalized turn now appends a one-line footer: `↑ in · cache% · ↓ out · $cost` for Claude turns
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
