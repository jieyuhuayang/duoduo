// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parsePositiveMsEnv  (minified: hV, daemon.pretty.js:55512)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.8 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.8 (medium): Holding the input stream open across background-subagent continuations stops job and subconscious turns from hitting a "Stream closed" error.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePositiveMsEnv(rawValue, fallback) {
    if (rawValue === void 0) return fallback;
    let parsed = Number(rawValue);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= Eot ? parsed : fallback
}
