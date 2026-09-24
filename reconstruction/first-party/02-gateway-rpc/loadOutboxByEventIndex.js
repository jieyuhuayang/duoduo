// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: loadOutboxByEventIndex  (minified: cXe, daemon.pretty.js:36070)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadOutboxByEventIndex(e) {
    let t = lXe(e);
    return await $u(t, async () => {
        let n = resolveOutboxByEventIndexPath(e);
        try {
            let r = Qz(n);
            for await (let i of ds(r)) if (i) try {
                let o = JSON.parse(i);
                o?.event_id && t.map.set(o.event_id, o)
            } catch {
                continue
            }
        } catch {}
    }, () => {
        t.map.clear()
    }), t.map
}
