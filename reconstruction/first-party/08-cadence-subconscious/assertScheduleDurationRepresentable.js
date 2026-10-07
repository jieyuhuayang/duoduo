// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: assertScheduleDurationRepresentable  (minified: _6, daemon.pretty.js:61319)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.6.1 (high): `@in` and `@every` now accept composite durations such as `2h30m` and `1d6h4m`. Invalid cron strings, malformed durations, and delays outside the representable time range are rejected when the job is created.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function assertScheduleDurationRepresentable(e, t) {
    if (!Number.isFinite(e) || Number.isNaN(new Date(e).getTime())) throw new Error(`Duration in "${t}" is too large to schedule — it exceeds the representable time range`)
}
