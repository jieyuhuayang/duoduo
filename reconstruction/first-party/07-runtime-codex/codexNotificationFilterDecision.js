// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: codexNotificationFilterDecision  (minified: lbe, daemon.pretty.js:62217)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): A recurring Codex job no longer mishandles a turn-terminal notification, which previously could let a job thread grow until it repeatedly hit compaction.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function codexNotificationFilterDecision(input) {
    return input.msgThreadId && input.msgThreadId !== input.ownThreadId ? "drop-wrong-thread" : !(input.method === "error" || input.method === "turn/completed") && input.ownTurnId && input.msgTurnId && input.msgTurnId !== input.ownTurnId ? "drop-stale-turn" : "process"
}
