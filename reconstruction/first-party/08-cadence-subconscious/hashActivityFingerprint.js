// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: hashActivityFingerprint  (minified: Ebt, daemon.pretty.js:86105)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hashActivityFingerprint(e) {
    return ybt("sha256").update(e).digest("hex").slice(0, 16)
}
