// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: claimDaemonRestartReason  (minified: $me, daemon.pretty.js:59312)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function claimDaemonRestartReason(e) {
    let t = daemonRestartReasonPath(e),
        n;
    try {
        n = await Ome.readFile(t, "utf8")
    } catch {
        return null
    }
    await Ome.rm(t, {
        force: !0
    }).catch(() => {});
    try {
        let r = JSON.parse(n),
            i = typeof r.reason == "string" ? r.reason.trim() : "",
            o = Array.isArray(r.wake_targets) ? r.wake_targets.filter(s => typeof s == "string").map(s => s.trim()).filter(s => s.length > 0) : [];
        return i.length === 0 && o.length === 0 ? null : {
            reason: i,
            requested_at: typeof r.requested_at == "string" ? r.requested_at : "unknown time",
            requested_by_agent: r.requested_by_agent === !0,
            wake_targets: o.length > 0 ? o : void 0
        }
    } catch {
        return null
    }
}
