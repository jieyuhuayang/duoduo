// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: mergeInterruptedContextTexts  (minified: qmt, daemon.pretty.js:72073)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeInterruptedContextTexts(text, existing) {
    let map = new Map;
    for (let part of Vxe(existing)) map.set(Cxe(part), part);
    let trimmed = text.trim();
    return trimmed && map.set(Cxe(trimmed), trimmed), Array.from(map.values()).join(CW)
}
