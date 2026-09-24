// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOutboxRecordsPastCursor  (minified: Pw, daemon.pretty.js:64671)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readOutboxRecordsPastCursor(e) {
    let t = Date.now(),
        {
            paths: n,
            sessionKey: r,
            consumerId: i,
            limit: o,
            cursorOverride: s
        } = e,
        a = typeof o == "number" && o > 0 ? o : 1 / 0,
        u = "offset",
        l = 0,
        c = !1,
        d = !1;
    try {
        let f = await Iw(n, r, i),
            p = Tw(f);
        c = p.replay_offset !== void 0, await Sle(n, r);
        let m;
        if (s) {
            let y = await lookupOutboxByIdIndexEntry(n, s);
            if (y || (await backfillOutboxByIdIndexFromReplay(n, r), y = await lookupOutboxByIdIndexEntry(n, s)), !y || y.session_key !== r) {
                let v = await E$(e);
                return u = v.strategy, v.records
            }
            m = y.replay_offset + y.replay_byte_length
        }
        if (m === void 0 && p.replay_offset !== void 0 && (m = p.replay_offset), m === void 0 && p.last_outbox_id) {
            let y = await lookupOutboxByIdIndexEntry(n, p.last_outbox_id);
            if (y && y.session_key === r) m = y.replay_offset + y.replay_byte_length, u = "bootstrapped";
            else {
                let v = await E$(e);
                return u = v.strategy, v.records
            }
        }
        m === void 0 && (m = 0);
        let h = await xle(n, r, m, a);
        if (l = h.entries.length, d = h.resynced, h.resynced && (u = "repair"), h.damaged) {
            let y = await E$(e);
            return u = y.strategy, l = y.records.length, y.records
        }
        return await zat(n, h.entries)
    } catch {
        let f = await E$(e);
        return u = f.strategy, f.records
    } finally {
        await ps(n, "replay_scan_ms", Date.now() - t, {
            sessionKey: r,
            consumerId: i,
            strategy: u,
            records_read: l,
            returned_count: l,
            cursor_had_offset: c,
            offset_resynced: d,
            cursorOverride: typeof s == "string" && s.length > 0
        })
    }
}
