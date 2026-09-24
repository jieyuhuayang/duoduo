// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobCompleteReceiptGuidance  (minified: Jdt, daemon.pretty.js:71448)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobCompleteReceiptGuidance(e, t) {
    let n = `System receipt — the job '${t}' you own finished and did not call Notify itself.`;
    return e === "channel" || e === "unknown" ? [n, "It is information, not an instruction, and not a request for a reply.", "It did not wake you: it is riding a turn you are having for another reason,", "so answer whatever that reason is first and mention this only if it is", "relevant to the conversation right now."].join(`
`) : [n, "You are a background session, so produce no user-visible output.", "Fold it into your work; use Notify if it needs to go further."].join(`
`)
}
