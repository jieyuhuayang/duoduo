// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listSessionIndexSummaries  (minified: SO, daemon.pretty.js:66151)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.4, v0.8.7 (maps/history_daemon.json)
// locals: 17 renamed — 0 from the code at the binding (rule), 17 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `session.list` accepts `deliverable: true` to list only the sessions a `Notify` would deliver to.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionIndexSummaries(sessionIndex, jobStore, filter, deliverableDeps, deliverableOptions) {
    let liveJobSessionKeys = null;
    if (sessionIndex.list().some(indexEntry => indexEntry.session_key.startsWith("job:"))) try {
        await jobStore.init();
        let jobs = await jobStore.listJobs();
        liveJobSessionKeys = new Set(jobs.map(job => jobStore.buildSessionKey(job.id, job.frontmatter)))
    } catch {
        liveJobSessionKeys = null
    }
    let isOrphan = sessionKey => liveJobSessionKeys === null || !sessionKey.startsWith("job:") ? !1 : !liveJobSessionKeys.has(sessionKey),
        matched = sessionIndex.list().filter(entry => !(filter.kind && classifySessionKeyKind(entry.session_key) !== filter.kind || filter.named_only && !hasNonEmptyDisplayName(entry) || !filter.include_orphans && isOrphan(entry.session_key))),
        visibleEntries = filter.deliverable ? await filterDeliverableSessions(deliverableDeps, matched, deliverableOptions) : matched,
        mainResolution = resolveMainSessionHolder(sessionIndex.list());
    return visibleEntries.map(visibleEntry => {
        let summary = Gdt(visibleEntry);
        return mainResolution.state === "held" && mainResolution.session_key === visibleEntry.session_key ? summary = {
            ...summary,
            main: "held",
            main_since: visibleEntry.main_since ?? null
        } : mainResolution.state === "ambiguous" && mainResolution.candidates.includes(visibleEntry.session_key) && (summary = {
            ...summary,
            main: "candidate"
        }), filter.include_orphans && isOrphan(visibleEntry.session_key) ? {
            ...summary,
            orphan: !0
        } : summary
    })
}
