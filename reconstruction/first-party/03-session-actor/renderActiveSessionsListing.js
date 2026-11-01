// duoduo reconstruction — subsystem: 03-session-actor
// symbol: renderActiveSessionsListing  (minified: Xdt, daemon.pretty.js:66203)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in v0.8.4, v0.8.7 (maps/history_daemon.json)
// locals: 1 renamed — 1 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderActiveSessionsListing(e, t, n) {
    let sessionIndexFromDisk = await buildSessionIndexFromDisk(e),
        o = (await listSessionIndexSummaries(sessionIndexFromDisk, new Jr(e), {
            include_orphans: !0
        }, e, t)).map(l => ({
            ...l,
            isCaller: l.session_key === n
        }));
    o.sort((l, c) => l.session_key.localeCompare(c.session_key));
    let s = o.filter(l => l.kind === "channel"),
        a = o.filter(l => l.kind !== "channel"),
        u = [`Active sessions: ${o.length}`];
    return u.push("", `Foreground (${s.length})`), u.push(...s.length > 0 ? s.map(formatViewSessionsListLine) : ["(none)"], "", `Background (${a.length})`, ...a.length > 0 ? a.map(formatViewSessionsListLine) : ["(none)"]), n && !o.some(l => l.isCaller) && u.push("", `Your session (${n}) is not persisted yet.`), u.push("", "Archived sessions are not listed. Pass session_key to inspect one session."), u.join(`
`)
}
