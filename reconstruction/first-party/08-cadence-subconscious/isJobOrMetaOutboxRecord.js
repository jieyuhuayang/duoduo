// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isJobOrMetaOutboxRecord  (minified: Xgt, daemon.pretty.js:86722)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobOrMetaOutboxRecord(e) {
    return e.channel_kind === "job" || e.channel_kind === "meta" ? !0 : e.session_key.startsWith("job:") || e.session_key.startsWith("meta:")
}
