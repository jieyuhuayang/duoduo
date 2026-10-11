// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: isUsableEventIndexEntry  (minified: Y8e, daemon.pretty.js:32222)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): guards the by-id index against out-of-range lookups.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isUsableEventIndexEntry(entry) {
    return entry?.event_id ? Number.isSafeInteger(entry.byte_offset) && entry.byte_offset >= 0 && Number.isSafeInteger(entry.byte_len) && entry.byte_len > 0 : !1
}
