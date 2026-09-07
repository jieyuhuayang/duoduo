// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: deliverDaemonRestartWakes  (minified: _ut, daemon.pretty.js:82782)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverDaemonRestartWakes(e, t, n, r) {
    let i = jme(r.reason, r.requested_at);
    for (let o of r.wake_targets ?? []) try {
        let s = await Rwe(e, t, n, {
            target: o,
            message: i,
            source: "daemon-restart"
        });
        s.ok ? Q("[pid0] restart wake delivered", {
            target: o,
            session_key: s.session_key
        }) : J("[pid0] restart wake refused", {
            target: o,
            reason: s.reason,
            session_key: "session_key" in s ? s.session_key : void 0,
            candidates: "candidates" in s ? s.candidates.map(a => a.session_key) : void 0
        })
    } catch (s) {
        J("[pid0] restart wake failed", {
            target: o,
            error: String(s)
        })
    }
}
