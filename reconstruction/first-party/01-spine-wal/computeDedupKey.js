// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: computeDedupKey  (minified: GR, daemon.pretty.js:87306)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.0 (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always gets an answer.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeDedupKey(event) {
    let sourceId = event.dedup?.source_id;
    return sourceId ? `${event.source?.kind??"unknown"}:${sourceId}` : null
}
