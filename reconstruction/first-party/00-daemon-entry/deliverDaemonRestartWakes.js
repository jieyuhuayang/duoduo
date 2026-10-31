// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: deliverDaemonRestartWakes  (minified: CSt, daemon.pretty.js:92710)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2, v0.8.7 (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverDaemonRestartWakes(paths, bus, sessionIndex, restartReason, finalSubscriberCount) {
    let restartWakeMessage = renderRestartWakeMessage(restartReason.reason, restartReason.requested_at);
    for (let wakeTarget of restartReason.wake_targets ?? []) try {
        let result = await deliverExternalSessionNotify(paths, bus, sessionIndex, {
            target: wakeTarget,
            message: restartWakeMessage,
            force: !0,
            source: "daemon-restart"
        }, finalSubscriberCount);
        result.ok ? logInfoMessage("[pid0] restart wake delivered", {
            target: wakeTarget,
            session_key: result.session_key
        }) : logWarnMessage("[pid0] restart wake refused", {
            target: wakeTarget,
            reason: result.reason,
            session_key: "session_key" in result ? result.session_key : void 0,
            candidates: "candidates" in result ? result.candidates.map(candidate => candidate.session_key) : void 0
        })
    } catch (err) {
        logWarnMessage("[pid0] restart wake failed", {
            target: wakeTarget,
            error: String(err)
        })
    }
}
