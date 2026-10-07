// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: computeDedupKey  (minified: GR, daemon.pretty.js:87260)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.0 (maps/history_daemon.json)
// changelog v0.8.0 (high): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always gets an answer.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeDedupKey(e) {
    let t = e.dedup?.source_id;
    return t ? `${e.source?.kind??"unknown"}:${t}` : null
}
