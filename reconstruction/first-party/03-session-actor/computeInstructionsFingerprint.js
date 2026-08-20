// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeInstructionsFingerprint  (minified: SC, daemon.pretty.js:74084)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeInstructionsFingerprint(e) {
    let t = JSON.stringify([e.identity ?? "", e.kindPrompt ?? "", e.instancePrompt ?? "", e.memoryBoard ?? "", e.mission ?? ""]);
    return C_e("sha256").update(t).digest("hex")
}
