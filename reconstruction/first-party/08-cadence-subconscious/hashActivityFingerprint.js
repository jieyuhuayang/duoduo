// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: hashActivityFingerprint  (minified: Ebt, daemon.pretty.js:86105)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hashActivityFingerprint(fingerprint) {
    return ybt("sha256").update(fingerprint).digest("hex").slice(0, 16)
}
