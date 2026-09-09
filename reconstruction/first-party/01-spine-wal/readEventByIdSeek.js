// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventByIdSeek  (minified: qGe, daemon.pretty.js:32001)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventByIdSeek(e, t, n) {
    let r = Date.parse(n.notAfter);
    if (!Number.isFinite(r)) return null;
    let i = Hp(new Date(r)),
        o;
    try {
        o = await NE.readdir(e.eventsDir)
    } catch {
        return null
    }
    let s = o.filter(a => LGe.test(a) && a <= i).sort().reverse();
    for (let a of s) {
        let l = await xre(DE.join(e.eventsDir, a), t);
        if (l) return l
    }
    return null
}
