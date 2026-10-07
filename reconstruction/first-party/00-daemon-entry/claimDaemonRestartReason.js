// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: claimDaemonRestartReason  (minified: iwe, daemon.pretty.js:66055)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.6.2 (high): `duoduo daemon restart` takes a reason, and can wake what it interrupted. `-r "<what changed>"` reaches every session that wakes after the restart; `--wake <session-or-alias>` (repeatable) notifies a specific session
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function claimDaemonRestartReason(e) {
    let t = daemonRestartReasonPath(e),
        n;
    try {
        n = await rwe.readFile(t, "utf8")
    } catch {
        return null
    }
    await rwe.rm(t, {
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
