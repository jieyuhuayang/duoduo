// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: Mu, daemon.pretty.js:34945)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
    let r = drainRecordPath(e, t),
        i = [];
    try {
        let s = qHe(r, {
                encoding: "utf8"
            }),
            o = UHe.createInterface({
                input: s,
                crlfDelay: 1 / 0
            });
        for await (let a of o) if (a.trim()) try {
            let u = JSON.parse(a);
            u?.id && u?.session_key && (!n || new Date(u.drain_started_at) >= n) && i.push(u)
        } catch {}
    } catch (s) {
        if (s.code !== "ENOENT") throw s
    }
    return i
}
