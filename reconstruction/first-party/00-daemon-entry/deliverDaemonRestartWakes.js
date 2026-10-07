// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: deliverDaemonRestartWakes  (minified: avt, daemon.pretty.js:91202)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverDaemonRestartWakes(e, t, n, r) {
    let i = renderRestartWakeMessage(r.reason, r.requested_at);
    for (let o of r.wake_targets ?? []) try {
        let s = await deliverExternalSessionNotify(e, t, n, {
            target: o,
            message: i,
            force: !0,
            source: "daemon-restart"
        });
        s.ok ? logInfoMessage("[pid0] restart wake delivered", {
            target: o,
            session_key: s.session_key
        }) : logWarnMessage("[pid0] restart wake refused", {
            target: o,
            reason: s.reason,
            session_key: "session_key" in s ? s.session_key : void 0,
            candidates: "candidates" in s ? s.candidates.map(a => a.session_key) : void 0
        })
    } catch (s) {
        logWarnMessage("[pid0] restart wake failed", {
            target: o,
            error: String(s)
        })
    }
}
