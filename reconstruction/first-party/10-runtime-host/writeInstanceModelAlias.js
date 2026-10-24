// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeInstanceModelAlias  (minified: YSe, daemon.pretty.js:90963)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeInstanceModelAlias(paths, sessionKey, tier, model, maxAttempts = 5) {
    return VSe(paths, sessionKey, "claude", claudeBlock => L6(claudeBlock, tier, model), maxAttempts)
}
