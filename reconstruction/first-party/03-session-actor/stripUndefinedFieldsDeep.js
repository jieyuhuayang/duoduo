// duoduo reconstruction — subsystem: 03-session-actor
// symbol: stripUndefinedFieldsDeep  (minified: sf, daemon.pretty.js:35592)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripUndefinedFieldsDeep(value) {
    if (Array.isArray(value)) return value.map(element => stripUndefinedFieldsDeep(element));
    if (value && typeof value == "object") {
        let entries = Object.entries(value).filter(([, fieldValue]) => fieldValue !== void 0).map(([key, fieldValue]) => [key, stripUndefinedFieldsDeep(fieldValue)]);
        return Object.fromEntries(entries)
    }
    return value
}
