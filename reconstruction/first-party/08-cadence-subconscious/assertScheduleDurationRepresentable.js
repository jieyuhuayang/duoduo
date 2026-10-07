// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: assertScheduleDurationRepresentable  (minified: _6, daemon.pretty.js:61319)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function assertScheduleDurationRepresentable(e, t) {
    if (!Number.isFinite(e) || Number.isNaN(new Date(e).getTime())) throw new Error(`Duration in "${t}" is too large to schedule — it exceeds the representable time range`)
}
