// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildPiConfigSignature  (minified: cEe, daemon.pretty.js:73491)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildPiConfigSignature(config) {
    return JSON.stringify(canonicalizeJsonValue({
        model: config.model ?? null,
        thinking_level: config.thinkingLevel ?? null,
        seed: config.settingsSeed,
        trust: config.defaultProjectTrust,
        extensions: config.extensions,
        skills: config.skills,
        instructions: config.instructionsFingerprint
    }))
}
