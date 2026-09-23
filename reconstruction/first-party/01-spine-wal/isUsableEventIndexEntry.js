// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: isUsableEventIndexEntry  (minified: r5e, daemon.pretty.js:32119)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isUsableEventIndexEntry(e) {
    return e?.event_id ? Number.isSafeInteger(e.byte_offset) && e.byte_offset >= 0 && Number.isSafeInteger(e.byte_len) && e.byte_len > 0 : !1
}
