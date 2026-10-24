// duoduo reconstruction — subsystem: 03-session-actor
// symbol: waitForWakeOrIdleTimeout  (minified: uZ, daemon.pretty.js:85306)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function waitForWakeOrIdleTimeout(actor, timeoutMs) {
    return new Promise(resolve => {
        let timer = null,
            cleanup = () => {
                timer && (clearTimeout(timer), timer = null), actor.wakeResolver = null
            };
        actor.wakeResolver = () => {
            cleanup(), resolve(!0)
        }, timer = setTimeout(() => {
            cleanup(), resolve(!1)
        }, timeoutMs)
    })
}
