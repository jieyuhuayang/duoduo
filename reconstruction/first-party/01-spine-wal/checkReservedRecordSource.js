// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: checkReservedRecordSource  (minified: Dpt, daemon.pretty.js:90418)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function checkReservedRecordSource(e) {
    return Nm.includes(e) ? {
        ok: !1,
        reason: "reserved_source",
        message: `"${e}" is one of duoduo's internal sources (${Nm.join(", ")}), which duoduo never learns from. Nothing was recorded. Record under your own name.`
    } : pR.includes(e) ? {
        ok: !1,
        reason: "reserved_source",
        message: `"${e}" is reserved on duoduo (${pR.join(", ")}): it begins duoduo's session keys. Nothing was recorded. Record under your own name.`
    } : null
}
