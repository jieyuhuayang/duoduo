// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: deliverDaemonRestartWakes  (minified: kyt, daemon.pretty.js:89682)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
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
        s.ok ? te("[pid0] restart wake delivered", {
            target: o,
            session_key: s.session_key
        }) : Z("[pid0] restart wake refused", {
            target: o,
            reason: s.reason,
            session_key: "session_key" in s ? s.session_key : void 0,
            candidates: "candidates" in s ? s.candidates.map(a => a.session_key) : void 0
        })
    } catch (s) {
        Z("[pid0] restart wake failed", {
            target: o,
            error: String(s)
        })
    }
}
