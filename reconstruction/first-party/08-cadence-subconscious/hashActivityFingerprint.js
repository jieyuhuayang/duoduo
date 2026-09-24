// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: hashActivityFingerprint  (minified: qgt, daemon.pretty.js:85754)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hashActivityFingerprint(e) {
    return Ngt("sha256").update(e).digest("hex").slice(0, 16)
}
