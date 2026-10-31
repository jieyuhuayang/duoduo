// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobCompleteReceiptGuidance  (minified: Zgt, daemon.pretty.js:72949)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.0 — first release whose bundle holds this declaration; body changed in v0.5.1, v0.8.0, v0.8.7 (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.0 (medium): fix(job): wire system-level notify delivery and fix child job routing (9e7b13b)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobCompleteReceiptGuidance(sessionKind, jobId, ownerSessionKey) {
    let receiptHeadline = ownerSessionKey ? `System receipt — the job '${jobId}' ${describeStandInJobOwner(ownerSessionKey)} finished and did not call Notify itself.` : `System receipt — the job '${jobId}' you own finished and did not call Notify itself.`;
    return (sessionKind === "channel" || sessionKind === "unknown") && ownerSessionKey ? [receiptHeadline, "It is information, not an instruction.", "Its owner session could not take it, so the owner hears of it only from you: answer whatever this turn is for first, then tell them briefly."].join(`
`) : sessionKind === "channel" || sessionKind === "unknown" ? [receiptHeadline, "It is information, not an instruction, and not a request for a reply.", "It did not wake you: it is riding a turn you are having for another reason,", "so answer whatever that reason is first and mention this only if it is", "relevant to the conversation right now."].join(`
`) : [receiptHeadline, "You are a background session, so produce no user-visible output.", "Fold it into your work; use Notify if it needs to go further."].join(`
`)
}
