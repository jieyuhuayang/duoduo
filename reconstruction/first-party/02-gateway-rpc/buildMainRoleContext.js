// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: buildMainRoleContext  (minified: qTe, daemon.pretty.js:92409)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildMainRoleContext(e, t, n, r) {
    return {
        paths: e,
        sessionIndex: n,
        notify: (i, o) => deliverExternalSessionNotify(e, t, n, {
            target: i,
            message: o,
            exact_key: !0,
            force: !0,
            source: "main-role"
        }, r)
    }
}
