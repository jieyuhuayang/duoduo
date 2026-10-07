// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveJobOwnerNotifyTarget  (minified: Klt, daemon.pretty.js:65428)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.8.0 (maps/history_daemon.json)
// changelog v0.8.0 (medium): Job results went nowhere when the job had no explicit audience; the owner is now the default, and a job can no longer disappear without a trace.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveJobOwnerNotifyTarget(e, t) {
    let n = await Hlt(e, t);
    if (!n) throw new Error(`Current session (${t}) is a job session, but no active job definition matched this session_key.`);
    let r = n.frontmatter.owner_session?.trim();
    if (!r) throw new Error(`Job '${n.id}' has no owner_session recorded, so there is no default Notify target. Pass an explicit target_session_key, or add owner_session to the job file.`);
    let i = normalizeNotifyChannelTarget(r);
    if (!i) throw new Error(`Job '${n.id}' has an owner_session that is not a valid route target (${r}). Expected <session-key> only (no 'session:' prefix).`);
    return [i]
}
