// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isChannelMessageEvent  (minified: yA, daemon.pretty.js:70572)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): A message you send while the agent is mid-turn on something it started by itself now gets its own turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelMessageEvent(e) {
    return e?.type === "channel.message"
}
