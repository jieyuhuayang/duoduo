// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildPiConfigSignature  (minified: cEe, daemon.pretty.js:73491)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildPiConfigSignature(e) {
    return JSON.stringify(canonicalizeJsonValue({
        model: e.model ?? null,
        thinking_level: e.thinkingLevel ?? null,
        seed: e.settingsSeed,
        trust: e.defaultProjectTrust,
        extensions: e.extensions,
        skills: e.skills,
        instructions: e.instructionsFingerprint
    }))
}
