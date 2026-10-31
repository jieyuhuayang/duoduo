// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: claimDaemonRestartReason  (minified: ESe, daemon.pretty.js:67362)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 1 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.2 (high): `duoduo daemon restart` takes a reason, and can wake what it interrupted. `-r "<what changed>"` reaches every session that wakes after the restart; `--wake <session-or-alias>` (repeatable) notifies a specific session
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function claimDaemonRestartReason(paths) {
    let reasonPath = daemonRestartReasonPath(paths),
        content;
    try {
        content = await xSe.readFile(reasonPath, "utf8")
    } catch {
        return null
    }
    await xSe.rm(reasonPath, {
        force: !0
    }).catch(() => {});
    try {
        let parsed = JSON.parse(content),
            reason = typeof parsed.reason == "string" ? parsed.reason.trim() : "",
            wakeTargets = Array.isArray(parsed.wake_targets) ? parsed.wake_targets.filter(target => typeof target == "string").map(target => target.trim()).filter(target => target.length > 0) : [];
        return reason.length === 0 && wakeTargets.length === 0 ? null : {
            reason,
            requested_at: typeof parsed.requested_at == "string" ? parsed.requested_at : "unknown time",
            requested_by_agent: parsed.requested_by_agent === !0,
            wake_targets: wakeTargets.length > 0 ? wakeTargets : void 0
        }
    } catch {
        return null
    }
}
