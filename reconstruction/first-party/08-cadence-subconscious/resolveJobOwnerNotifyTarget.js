// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveJobOwnerNotifyTarget  (minified: Klt, daemon.pretty.js:65428)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Job results went nowhere when the job had no explicit audience; the owner is now the default, and a job can no longer disappear without a trace.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveJobOwnerNotifyTarget(paths, sessionKey) {
    let job = await Hlt(paths, sessionKey);
    if (!job) throw new Error(`Current session (${sessionKey}) is a job session, but no active job definition matched this session_key.`);
    let ownerSession = job.frontmatter.owner_session?.trim();
    if (!ownerSession) throw new Error(`Job '${job.id}' has no owner_session recorded, so there is no default Notify target. Pass an explicit target_session_key, or add owner_session to the job file.`);
    let notifyChannelTarget = normalizeNotifyChannelTarget(ownerSession);
    if (!notifyChannelTarget) throw new Error(`Job '${job.id}' has an owner_session that is not a valid route target (${ownerSession}). Expected <session-key> only (no 'session:' prefix).`);
    return [notifyChannelTarget]
}
