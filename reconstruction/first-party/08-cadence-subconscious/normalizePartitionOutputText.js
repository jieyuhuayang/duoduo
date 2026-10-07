// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: normalizePartitionOutputText  (minified: tIe, daemon.pretty.js:86048)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizePartitionOutputText(e) {
    let t = e?.trim();
    return t && t.length > 0 ? t : "(no output)"
}
