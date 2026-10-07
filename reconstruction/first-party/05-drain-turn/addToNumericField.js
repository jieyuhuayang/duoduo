// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: addToNumericField  (minified: PW, daemon.pretty.js:70485)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function addToNumericField(e, t, n) {
    let r = e[t];
    if (typeof r == "number") {
        e[t] = r + n;
        return
    }
    e[t] = n
}
