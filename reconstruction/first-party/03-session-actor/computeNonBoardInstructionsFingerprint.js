// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeNonBoardInstructionsFingerprint  (minified: tK, daemon.pretty.js:83950)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeNonBoardInstructionsFingerprint(instructions) {
    return computeInstructionsFingerprint({
        ...instructions,
        memoryBoard: void 0
    })
}
