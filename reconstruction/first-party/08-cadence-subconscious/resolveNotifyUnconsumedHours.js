// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveNotifyUnconsumedHours  (minified: q6, daemon.pretty.js:64757)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (high): `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default off until set)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveNotifyUnconsumedHours(env = process.env) {
    let rawValue = env[U6];
    if (rawValue === void 0 || rawValue === "") return eO;
    let hours = Number(rawValue);
    return Number.isFinite(hours) ? hours : eO
}
