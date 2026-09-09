// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeInstructionsFingerprint  (minified: bw, daemon.pretty.js:76374)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeInstructionsFingerprint(e) {
    let t = [e.identity ?? "", e.kindPrompt ?? "", e.instancePrompt ?? "", e.memoryBoard ?? "", e.mission ?? ""];
    return e.missionAcceptance && t.push(e.missionAcceptance), Hwe("sha256").update(JSON.stringify(t)).digest("hex")
}
