// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computePartitionBackoffUntil  (minified: _H, daemon.pretty.js:66723)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computePartitionBackoffUntil(e, t, n, r) {
    if (e === "success" || e === "invalid_output") return null;
    let i = r ?? zg;
    if (e === "timeout") {
        if (t <= 2) return null;
        let s = Math.min(t * i, Yct);
        return new Date(n.getTime() + s).toISOString()
    }
    if (t <= 1) return null;
    let o = Math.min(t * 2 * i, Xct);
    return new Date(n.getTime() + o).toISOString()
}
