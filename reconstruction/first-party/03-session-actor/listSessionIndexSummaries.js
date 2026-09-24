// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listSessionIndexSummaries  (minified: h$, daemon.pretty.js:64194)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionIndexSummaries(e, t, n) {
    let r = null;
    if (e.list().some(a => a.session_key.startsWith("job:"))) try {
        await t.init();
        let a = await t.listJobs();
        r = new Set(a.map(u => t.buildSessionKey(u.id, u.frontmatter)))
    } catch {
        r = null
    }
    let o = a => r === null || !a.startsWith("job:") ? !1 : !r.has(a);
    return e.list().filter(a => !(n.kind && classifySessionKeyKind(a.session_key) !== n.kind || n.named_only && !fg(a) || !n.include_orphans && o(a.session_key))).map(a => {
        let u = Iat(a);
        return n.include_orphans && o(a.session_key) ? {
            ...u,
            orphan: !0
        } : u
    })
}
