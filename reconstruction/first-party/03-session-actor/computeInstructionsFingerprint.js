// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeInstructionsFingerprint  (minified: $k, daemon.pretty.js:83941)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in v0.5.1, v0.8.0 (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (medium): the legacy `mission_fingerprint` field is cleared, and the new `instructions_fingerprint` is stamped.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeInstructionsFingerprint(instructions) {
    let parts = [instructions.identity ?? "", instructions.kindPrompt ?? "", instructions.instancePrompt ?? "", instructions.memoryBoard ?? "", instructions.mission ?? ""];
    return instructions.missionAcceptance && parts.push(instructions.missionAcceptance), rTe("sha256").update(JSON.stringify(parts)).digest("hex")
}
