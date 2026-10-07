// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listVoidChannelSessions  (minified: nde, daemon.pretty.js:36969)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listVoidChannelSessions(e) {
    let t = await rh(e),
        n = new Map,
        r = new Set;
    for (let [i, o] of Object.entries(t)) {
        let s = o.source_channel_id;
        if (!s || classifySessionKeyKind(i) !== "channel") continue;
        let a = n.get(s);
        a === void 0 && (a = isVoidRuntimeSession(e, i, s), n.set(s, a)), await a && r.add(i)
    }
    return r
}
