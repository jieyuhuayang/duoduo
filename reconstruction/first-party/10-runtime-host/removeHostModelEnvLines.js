// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: removeHostModelEnvLines  (minified: VSe, daemon.pretty.js:69080)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function removeHostModelEnvLines(e) {
    return qSe(e).filter(t => {
        let n = BSe(t);
        return !n || !qft(n)
    })
}
