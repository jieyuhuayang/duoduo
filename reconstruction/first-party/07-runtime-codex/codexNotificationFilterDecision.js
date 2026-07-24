// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: codexNotificationFilterDecision  (minified: rle, daemon.pretty.js:57816)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function codexNotificationFilterDecision(e) {
 return e.msgThreadId && e.msgThreadId !== e.ownThreadId ? "drop-wrong-thread" : !(e.method === "error" || e.method === "turn/completed") && e.ownTurnId && e.msgTurnId && e.msgTurnId !== e.ownTurnId ? "drop-stale-turn" : "process"
}
