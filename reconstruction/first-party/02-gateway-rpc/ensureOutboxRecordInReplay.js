// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ensureOutboxRecordInReplay  (minified: det, daemon.pretty.js:36373)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.3.1 (maps/history_daemon.json)
// changelog v0.3.0 (medium): **runtime**: Split outbox replay bootstrap read/write paths so live appends no longer rebuild replay artifacts on every write.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureOutboxRecordInReplay(e, t) {
    return jce(t.session_key, async () => {
        await Fce(e, t.session_key, !1);
        let n = await lookupOutboxByIdIndexEntry(e, t.id);
        if (n) return await Yb(e, t.session_key, resolveOutboxReplayFilePath(e, t.session_key)), n;
        let r = await cet(e, t);
        return await Yb(e, t.session_key, resolveOutboxReplayFilePath(e, t.session_key)), r
    })
}
