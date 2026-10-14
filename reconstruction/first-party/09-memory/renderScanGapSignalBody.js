// duoduo reconstruction — subsystem: 09-memory
// symbol: renderScanGapSignalBody  (minified: Vdt, daemon.pretty.js:67935)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.8 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderScanGapSignalBody(span, context) {
    return [`[scan-gap] ${Bdt(span.date,context)}`, `interval: ${IH(span)} (UTC, end-inclusive)`, `partition: var/events/${span.date}.jsonl`, "action: dream over this bounded interval — judge each external event per event (read one, source-gate, gradient-pass, compare against the resident broadcast, write a fragment if it carries gradient, move on). Interaction gradient ranks first; periodic no-gradient background work is passed over. This closed interval is handed out once — delete this file as the ack when the dream is finished; a dream that writes no fragments still acks."].join(`
`) + `
`
}
