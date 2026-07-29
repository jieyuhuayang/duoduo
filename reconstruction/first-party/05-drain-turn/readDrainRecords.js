// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: Mc, daemon.pretty.js:34965)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
    let r = drainRecordPath(e, t),
        i = [];
    try {
        let s = eVe(r, {
                encoding: "utf8"
            }),
            o = XHe.createInterface({
                input: s,
                crlfDelay: 1 / 0
            });
        for await (let a of o) if (a.trim()) try {
            let c = JSON.parse(a);
            c?.id && c?.session_key && (!n || new Date(c.drain_started_at) >= n) && i.push(c)
        } catch {}
    } catch (s) {
        if (s.code !== "ENOENT") throw s
    }
    return i
}
