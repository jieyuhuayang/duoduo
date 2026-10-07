// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listSessionIndexSummaries  (minified: oO, daemon.pretty.js:64866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionIndexSummaries(e, t, n, r) {
    let i = null;
    if (e.list().some(l => l.session_key.startsWith("job:"))) try {
        await t.init();
        let l = await t.listJobs();
        i = new Set(l.map(c => t.buildSessionKey(c.id, c.frontmatter)))
    } catch {
        i = null
    }
    let s = l => i === null || !l.startsWith("job:") ? !1 : !i.has(l),
        a = e.list().filter(l => !(n.kind && classifySessionKeyKind(l.session_key) !== n.kind || n.named_only && !Zf(l) || !n.include_orphans && s(l.session_key)));
    return (n.deliverable ? await filterDeliverableSessions(r, a) : a).map(l => {
        let c = Clt(l);
        return n.include_orphans && s(l.session_key) ? {
            ...c,
            orphan: !0
        } : c
    })
}
