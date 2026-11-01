// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: renderNewMainSessionNotice  (minified: Bft, daemon.pretty.js:90222)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNewMainSessionNotice(e) {
    return ["You are now the main session. Deliveries with no better target come here: job outcomes whose owner session is gone or unread, Notify calls that name `main`, chats forwarded to `main`, and setup requests from chats.", e.length > 0 ? `Previously main: ${e.join(", ")}. It was told of the handover and may send you what it carried.` : void 0, "Tell the owner here, in your own words, that this conversation is now where such things land — when the conversation allows."].filter(Boolean).join(`
`)
}
