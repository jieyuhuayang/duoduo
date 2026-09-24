// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: hasUnqueuedPendingOutboxRecords  (minified: vXe, daemon.pretty.js:36505)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function hasUnqueuedPendingOutboxRecords(e, t) {
    let n = await Pb(e);
    for (let r of n)
        if (!(r.status !== "pending" && r.status !== "failed") && !t.has(r.id)) return !0;
    return !1
}
