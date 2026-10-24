// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: checkReservedRecordSource  (minified: Ayt, daemon.pretty.js:92546)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function checkReservedRecordSource(source) {
    return qm.includes(source) ? {
        ok: !1,
        reason: "reserved_source",
        message: `"${source}" is one of duoduo's internal sources (${qm.join(", ")}), which duoduo never learns from. Nothing was recorded. Record under your own name.`
    } : PR.includes(source) ? {
        ok: !1,
        reason: "reserved_source",
        message: `"${source}" is reserved on duoduo (${PR.join(", ")}): it begins duoduo's session keys. Nothing was recorded. Record under your own name.`
    } : null
}
