// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: claimDaemonRestartReason  (minified: Ece, daemon.pretty.js:50236)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function claimDaemonRestartReason(e) {
    let t = daemonRestartReasonPath(e),
        n;
    try {
        n = await xce.readFile(t, "utf8")
    } catch {
        return null
    }
    await xce.rm(t, {
        force: !0
    }).catch(() => {});
    try {
        let r = JSON.parse(n),
            i = typeof r.reason == "string" ? r.reason.trim() : "";
        return i.length === 0 ? null : {
            reason: i,
            requested_at: typeof r.requested_at == "string" ? r.requested_at : "unknown time",
            requested_by_agent: r.requested_by_agent === !0
        }
    } catch {
        return null
    }
}
