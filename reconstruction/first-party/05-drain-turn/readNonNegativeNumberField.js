// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readNonNegativeNumberField  (minified: TW, daemon.pretty.js:71670)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readNonNegativeNumberField(obj, key) {
    if (!isNonNullObject(obj)) return;
    let value = obj[key];
    return typeof value == "number" && Number.isFinite(value) && value >= 0 ? value : void 0
}
