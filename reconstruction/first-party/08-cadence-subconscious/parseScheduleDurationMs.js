// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseScheduleDurationMs  (minified: jw, daemon.pretty.js:61308)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.1 (high): `@in` and `@every` now accept composite durations such as `2h30m` and `1d6h4m`. Invalid cron strings, malformed durations, and delays outside the representable time range are rejected when the job is created.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseScheduleDurationMs(durationText) {
    let unitPattern = /(\d+)([smhdw])/g,
        totalMs = 0,
        matchedLength = 0,
        match;
    for (;
        (match = unitPattern.exec(durationText)) !== null;) matchedLength += match[0].length, totalMs += parseInt(match[1], 10) * out(match[2]);
    if (matchedLength === 0 || matchedLength !== durationText.length) throw new Error(`Invalid duration format: ${durationText}`);
    return totalMs
}
