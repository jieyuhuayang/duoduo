// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: appendOutboxByEventIndexEntry  (minified: iet, daemon.pretty.js:36213)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendOutboxByEventIndexEntry(e, t) {
    let n = resolveOutboxByEventIndexPath(e);
    await ensureDirectoryExists(Lr.dirname(n)), await Rn.appendFile(n, `${stringifyJsonlRecord(t)}
`);
    let r = XU.get(n);
    r && await isIndexLoadStillCurrent(r) && r.map.set(t.event_id, t)
}
