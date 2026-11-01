// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: renderAmbiguousMainAliasNotice  (minified: Hft, daemon.pretty.js:90307)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAmbiguousMainAliasNotice(e) {
    return [`More than one session is aliased main: ${e.join(", ")}.`, "None of them is used as the main session until one remains, so deliveries without a", "better target fall back as if there were no main session.", "Tell the owner and ask them to pick one from their own terminal:", `duoduo session alias <session_key> ${Hn} --move`, "This notice is for you and the owner; do not repeat the candidate list in a chat others can read."].join(`
`)
}
