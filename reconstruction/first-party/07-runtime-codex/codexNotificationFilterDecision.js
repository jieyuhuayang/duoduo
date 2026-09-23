// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: codexNotificationFilterDecision  (minified: Lye, daemon.pretty.js:61897)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function codexNotificationFilterDecision(e) {
    return e.msgThreadId && e.msgThreadId !== e.ownThreadId ? "drop-wrong-thread" : !(e.method === "error" || e.method === "turn/completed") && e.ownTurnId && e.msgTurnId && e.msgTurnId !== e.ownTurnId ? "drop-stale-turn" : "process"
}
