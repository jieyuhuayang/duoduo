// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeInstructionsFingerprint  (minified: mk, daemon.pretty.js:82650)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in v0.5.1, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.1 (medium): the legacy `mission_fingerprint` field is cleared, and the new `instructions_fingerprint` is stamped.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeInstructionsFingerprint(e) {
    let t = [e.identity ?? "", e.kindPrompt ?? "", e.instancePrompt ?? "", e.memoryBoard ?? "", e.mission ?? ""];
    return e.missionAcceptance && t.push(e.missionAcceptance), FRe("sha256").update(JSON.stringify(t)).digest("hex")
}
