// duoduo reconstruction — subsystem: 03-session-actor
// symbol: waitForWakeOrIdleTimeout  (minified: hJ, daemon.pretty.js:82878)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function waitForWakeOrIdleTimeout(e, t) {
    return new Promise(n => {
        let r = null,
            i = () => {
                r && (clearTimeout(r), r = null), e.wakeResolver = null
            };
        e.wakeResolver = () => {
            i(), n(!0)
        }, r = setTimeout(() => {
            i(), n(!1)
        }, t)
    })
}
