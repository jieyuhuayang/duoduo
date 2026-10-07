// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readPartitionTail  (minified: vwe, daemon.pretty.js:89365)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): The dashboard streams usage summaries and bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionTail(e, t, n, r, i = !1) {
    let o;
    try {
        o = await zct.open(Uct.join(e.eventsDir, t), "r");
        let {
            size: s,
            blksize: a
        } = await o.stat(), u = r ? await resolveTailCursorEndOffset(e, t, o, s, r) : void 0, l = u !== void 0, c = [], d = Number.isNaN(n) ? 1 / 0 : Math.ceil(n), f = !0;
        for await (let p of iteratePartitionLinesBackward(o, u ?? 0, s, a)) {
            let m = f ? p.trimEnd() : p;
            if (!m) continue;
            f = !1;
            let h;
            try {
                h = JSON.parse(m)
            } catch {
                continue
            }
            if (r && h?.id === r) {
                l = !0;
                break
            }
            if (c.length <= d && c.push(h), c.length > n && (l || !i)) break
        }
        return {
            events: c.slice(0, d).reverse(),
            has_more: c.length > n || l && Number.isNaN(n),
            foundCursor: l
        }
    } catch {
        return {
            events: [],
            has_more: !1,
            foundCursor: !1
        }
    } finally {
        await o?.close()
    }
}
