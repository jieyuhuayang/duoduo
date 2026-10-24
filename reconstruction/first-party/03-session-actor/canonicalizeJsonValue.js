// duoduo reconstruction — subsystem: 03-session-actor
// symbol: canonicalizeJsonValue  (minified: kJ, daemon.pretty.js:75565)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function canonicalizeJsonValue(value) {
    if (Array.isArray(value)) return value.map(canonicalizeJsonValue);
    if (value && typeof value == "object") {
        let record = value;
        return Object.fromEntries(Object.keys(record).sort().map(key => [key, canonicalizeJsonValue(record[key])]))
    }
    return value
}
