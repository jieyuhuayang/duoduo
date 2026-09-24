// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: backfillOutboxByIdIndexFromReplay  (minified: jR, daemon.pretty.js:36419)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function backfillOutboxByIdIndexFromReplay(e, t) {
    let n = hs(e, t),
        r;
    try {
        r = await xn.readFile(n, "utf8")
    } catch {
        return
    }
    let i = 0;
    for (let o of r.split(`
`)) {
        if (!o.trim()) {
            i += Buffer.byteLength(o + `
`, "utf8");
            continue
        }
        try {
            let s = JSON.parse(o),
                a = Buffer.byteLength(o + `
`, "utf8");
            await lookupOutboxByIdIndexEntry(e, s.record_id) || await oU(e, {
                record_id: s.record_id,
                session_key: s.session_key,
                channel_kind: s.channel_kind,
                created_at: s.created_at,
                replay_offset: i,
                replay_byte_length: a
            }), i += a
        } catch {
            i += Buffer.byteLength(o + `
`, "utf8");
            continue
        }
    }
}
