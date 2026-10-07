// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isChannelMessageEvent  (minified: yA, daemon.pretty.js:70572)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelMessageEvent(e) {
    return e?.type === "channel.message"
}
