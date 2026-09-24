// duoduo reconstruction — subsystem: 03-session-actor
// symbol: prependPendingInterruptMarker  (minified: i0e, daemon.pretty.js:82815)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function prependPendingInterruptMarker(e, t) {
    let n = e.pendingInterruptMarker;
    if (!n || typeof t.prompt == "string") return t;
    let r = n,
        i = t.prompt;
    async function* o() {
        let s = !1;
        for await (let a of i) {
            if (!s && e.pendingInterruptMarker === r) {
                s = !0, e.pendingInterruptMarker = null, yield Rgt(a, r);
                continue
            }
            yield a
        }
    }
    return {
        ...t,
        prompt: o()
    }
}
