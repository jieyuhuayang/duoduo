// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ensureOutboxRecordInReplay  (minified: yXe, daemon.pretty.js:36247)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureOutboxRecordInReplay(e, t) {
    return wle(t.session_key, async () => {
        await kle(e, t.session_key, !1);
        let n = await lookupOutboxByIdIndexEntry(e, t.id);
        if (n) return await Ib(e, t.session_key, hs(e, t.session_key)), n;
        let r = await gXe(e, t);
        return await Ib(e, t.session_key, hs(e, t.session_key)), r
    })
}
