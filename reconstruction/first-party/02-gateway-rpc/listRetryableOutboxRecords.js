// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listRetryableOutboxRecords  (minified: Ile, daemon.pretty.js:36574)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listRetryableOutboxRecords(e, t = 5) {
    let n = await Rle(e),
        r = [];
    for (let i of n.values()) {
        if (i.status === "failed" && i.attempts >= t || i.status !== "pending" && i.status !== "failed") continue;
        let o = await readOutboxRecord(e, i.channel_kind, i.record_id);
        if (o) {
            if (o.status !== "pending" && o.status !== "failed") {
                let s = resolveOutboxPendingQueuePath(e),
                    a = Um.get(s);
                a?.load && a.map.delete(i.record_id);
                continue
            }
            o.status === "failed" && o.attempts >= t || r.push(o)
        }
    }
    return r
}
