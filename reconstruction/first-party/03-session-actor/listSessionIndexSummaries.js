// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listSessionIndexSummaries  (minified: oO, daemon.pretty.js:64866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 14 renamed — 0 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `session.list` accepts `deliverable: true` to list only the sessions a `Notify` would deliver to.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionIndexSummaries(sessionIndex, jobStore, filter, deliverableDeps) {
    let liveJobSessionKeys = null;
    if (sessionIndex.list().some(entry => entry.session_key.startsWith("job:"))) try {
        await jobStore.init();
        let jobs = await jobStore.listJobs();
        liveJobSessionKeys = new Set(jobs.map(job => jobStore.buildSessionKey(job.id, job.frontmatter)))
    } catch {
        liveJobSessionKeys = null
    }
    let isOrphan = sessionKey => liveJobSessionKeys === null || !sessionKey.startsWith("job:") ? !1 : !liveJobSessionKeys.has(sessionKey),
        matched = sessionIndex.list().filter(entry => !(filter.kind && classifySessionKeyKind(entry.session_key) !== filter.kind || filter.named_only && !hasNonEmptyDisplayName(entry) || !filter.include_orphans && isOrphan(entry.session_key)));
    return (filter.deliverable ? await filterDeliverableSessions(deliverableDeps, matched) : matched).map(entry => {
        let summary = Clt(entry);
        return filter.include_orphans && isOrphan(entry.session_key) ? {
            ...summary,
            orphan: !0
        } : summary
    })
}
