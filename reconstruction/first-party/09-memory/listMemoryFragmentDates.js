// duoduo reconstruction — subsystem: 09-memory
// symbol: listMemoryFragmentDates  (minified: Ult, daemon.pretty.js:67476)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMemoryFragmentDates(e) {
    let t;
    try {
        t = Xa.readdirSync(Cc.join(e, "fragments"), {
            withFileTypes: !0
        })
    } catch (r) {
        return {
            dates: [],
            readFault: aO(r)
        }
    }
    let n = [];
    for (let r of t) r.isDirectory() && I6(r.name) && n.push(r.name);
    return {
        dates: n.sort(),
        readFault: !1
    }
}
