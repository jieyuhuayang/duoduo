// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: codexNotificationFilterDecision  (minified: sbe, daemon.pretty.js:62216)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.4 (medium): A recurring Codex job no longer mishandles a turn-terminal notification, which previously could let a job thread grow until it repeatedly hit compaction.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function codexNotificationFilterDecision(e) {
    return e.msgThreadId && e.msgThreadId !== e.ownThreadId ? "drop-wrong-thread" : !(e.method === "error" || e.method === "turn/completed") && e.ownTurnId && e.msgTurnId && e.msgTurnId !== e.ownTurnId ? "drop-stale-turn" : "process"
}
