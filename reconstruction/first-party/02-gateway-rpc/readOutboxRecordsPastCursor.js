// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOutboxRecordsPastCursor  (minified: Yw, daemon.pretty.js:64574)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
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
        let f = await Zw(n, r, i),
            p = Kw(f);
        c = p.replay_offset !== void 0, await Lce(n, r);
        let m;
        if (s) {
            let y = await lookupOutboxByIdIndexEntry(n, s);
            if (y || (await backfillOutboxByIdIndexFromReplay(n, r), y = await lookupOutboxByIdIndexEntry(n, s)), !y || y.session_key !== r) {
                let v = await QC(e);
                return u = v.strategy, v.records
            }
            m = y.replay_offset + y.replay_byte_length
        }
        if (m === void 0 && p.replay_offset !== void 0 && (m = p.replay_offset), m === void 0 && p.last_outbox_id) {
            let y = await lookupOutboxByIdIndexEntry(n, p.last_outbox_id);
            if (y && y.session_key === r) m = y.replay_offset + y.replay_byte_length, u = "bootstrapped";
            else {
                let v = await QC(e);
                return u = v.strategy, v.records
            }
        }
        m === void 0 && (m = 0);
        let h = await zce(n, r, m, a);
        if (l = h.entries.length, d = h.resynced, h.resynced && (u = "repair"), h.damaged) {
            let y = await QC(e);
            return u = y.strategy, l = y.records.length, y.records
        }
        return await xlt(n, h.entries)
    } catch {
        let f = await QC(e);
        return u = f.strategy, f.records
    } finally {
        await recordTelemetryMetric(n, "replay_scan_ms", Date.now() - t, {
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
