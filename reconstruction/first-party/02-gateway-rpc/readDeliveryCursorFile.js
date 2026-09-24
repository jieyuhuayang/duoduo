// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readDeliveryCursorFile  (minified: k_e, daemon.pretty.js:64528)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDeliveryCursorFile(e, t, n) {
    let r = S_e(e, t, n);
    try {
        let i = await Mat.readFile(r, "utf8"),
            o = JSON.parse(i);
        if (o.session_key !== t) return null;
        let s = typeof o.optimistic_last_outbox_id == "string" ? o.optimistic_last_outbox_id : typeof o.last_outbox_id == "string" ? o.last_outbox_id : void 0,
            a = typeof o.optimistic_last_outbox_created_at == "string" ? o.optimistic_last_outbox_created_at : typeof o.last_outbox_created_at == "string" ? o.last_outbox_created_at : void 0,
            u = typeof o.ack_last_outbox_id == "string" ? o.ack_last_outbox_id : void 0,
            l = typeof o.ack_last_outbox_created_at == "string" ? o.ack_last_outbox_created_at : void 0,
            c = typeof o.optimistic_replay_offset == "number" ? o.optimistic_replay_offset : void 0,
            d = typeof o.ack_replay_offset == "number" ? o.ack_replay_offset : void 0;
        return {
            session_key: o.session_key,
            consumer_id: typeof o.consumer_id == "string" ? o.consumer_id : n,
            optimistic_last_outbox_id: s,
            optimistic_last_outbox_created_at: a,
            optimistic_replay_offset: c,
            ack_last_outbox_id: u,
            ack_last_outbox_created_at: l,
            ack_replay_offset: d,
            updated_at: typeof o.updated_at == "string" ? o.updated_at : new Date().toISOString()
        }
    } catch {
        return null
    }
}
