// duoduo reconstruction — subsystem: 09-memory
// symbol: renderScanGapSignalBody  (minified: Jlt, daemon.pretty.js:67643)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderScanGapSignalBody(e, t) {
    return [`[scan-gap] ${Wlt(e.date,t)}`, `interval: ${T6(e)} (UTC, end-inclusive)`, `partition: var/events/${e.date}.jsonl`, "action: dream over this bounded interval — judge each external event per event (read one, source-gate, gradient-pass, compare against the resident broadcast, write a fragment if it carries gradient, move on). Interaction gradient ranks first; periodic no-gradient background work is passed over. This closed interval is handed out once — delete this file as the ack when the dream is finished; a dream that writes no fragments still acks."].join(`
`) + `
`
}
