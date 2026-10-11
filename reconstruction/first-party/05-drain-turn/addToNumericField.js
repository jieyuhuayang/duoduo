// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: addToNumericField  (minified: PW, daemon.pretty.js:70485)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function addToNumericField(target, field, delta) {
    let current = target[field];
    if (typeof current == "number") {
        target[field] = current + delta;
        return
    }
    target[field] = delta
}
