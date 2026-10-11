// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: removeDotEnvKeyLines  (minified: HSe, daemon.pretty.js:69087)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (medium): the override is now persisted into the host `.env` so the daemon picks it up on subsequent restarts.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function removeDotEnvKeyLines(content, keys) {
    let keySet = new Set(keys);
    return qSe(content).filter(line => {
        let key = BSe(line);
        return !key || !keySet.has(key)
    })
}
