// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobAcceptanceBlock  (minified: xrt, daemon.pretty.js:55080)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobAcceptanceBlock(e) {
    let t = e?.trim();
    if (t) return ["This job is done when all of the following hold. Verify them before you", "finish, and say which ones you could not satisfy rather than finishing", "silently. Work these do not ask for is out of scope.", "", "<acceptance>", t, "</acceptance>"].join(`
`)
}
