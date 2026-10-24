// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isChannelMessageEvent  (minified: AA, daemon.pretty.js:72655)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): A message you send while the agent is mid-turn on something it started by itself now gets its own turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelMessageEvent(event) {
    return event?.type === "channel.message"
}
