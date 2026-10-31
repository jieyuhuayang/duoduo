// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveCadenceIntervalMs  (minified: rxe, daemon.pretty.js:70042)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCadenceIntervalMs() {
    let ALADUOCADENCEINTERVALMS = process.env.ALADUO_CADENCE_INTERVAL_MS;
    if (!ALADUOCADENCEINTERVALMS || ALADUOCADENCEINTERVALMS.trim() === "") return Yg;
    let intervalMs = Number(ALADUOCADENCEINTERVALMS);
    return !Number.isFinite(intervalMs) || !Number.isInteger(intervalMs) || intervalMs < 1e3 ? Yg : intervalMs
}
