// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: su, daemon.pretty.js:35920)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
    let r = drainRecordPath(e, t),
        i = [];
    try {
        let o = TGe(r, {
                encoding: "utf8"
            }),
            s = RGe.createInterface({
                input: o,
                crlfDelay: 1 / 0
            });
        for await (let a of s) if (a.trim()) try {
            let l = JSON.parse(a);
            l?.id && l?.session_key && (!n || new Date(l.drain_started_at) >= n) && i.push(l)
        } catch {}
    } catch (o) {
        if (o.code !== "ENOENT") throw o
    }
    return i
}
