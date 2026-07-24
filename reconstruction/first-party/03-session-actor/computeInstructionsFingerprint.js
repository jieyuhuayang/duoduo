// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeInstructionsFingerprint  (minified: u2, daemon.pretty.js:71881)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeInstructionsFingerprint(e) {
 let t = JSON.stringify([e.identity ?? "", e.kindPrompt ?? "", e.instancePrompt ?? "", e.memoryBoard ?? "", e.mission ?? ""]);
 return VXe("sha256")
  .update(t)
  .digest("hex")
}
