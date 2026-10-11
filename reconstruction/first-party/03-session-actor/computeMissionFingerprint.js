// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeMissionFingerprint  (minified: URe, daemon.pretty.js:82699)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (medium): the legacy `mission_fingerprint` field is cleared, and the new `instructions_fingerprint` is stamped.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeMissionFingerprint(mission) {
    return computeInstructionsFingerprint({
        mission
    })
}
