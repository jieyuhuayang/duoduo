// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeBoundedEditDistance  (minified: Qat, daemon.pretty.js:65071)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoundedEditDistance(e, t, n) {
    if (e === t) return 0;
    if (Math.abs(e.length - t.length) > n) return n + 1;
    let r = new Array(t.length + 1),
        i = new Array(t.length + 1);
    for (let o = 0; o <= t.length; o++) r[o] = o;
    for (let o = 1; o <= e.length; o++) {
        i[0] = o;
        let s = i[0];
        for (let a = 1; a <= t.length; a++) {
            let u = e[o - 1] === t[a - 1] ? 0 : 1;
            i[a] = Math.min(r[a] + 1, i[a - 1] + 1, r[a - 1] + u), i[a] < s && (s = i[a])
        }
        if (s > n) return n + 1;
        for (let a = 0; a <= t.length; a++) r[a] = i[a]
    }
    return r[t.length]
}
