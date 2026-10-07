// duoduo reconstruction — subsystem: 03-session-actor
// symbol: renderSessionMailboxFile  (minified: WR, daemon.pretty.js:32808)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderSessionMailboxFile(e, t, n) {
    let r = ["# Session Mailbox", "", "## Inbox", ""];
    for (let s of n) r.push(s.line);
    r.push("", "## Notes", "");
    let i = resolveSessionMailboxNotesPath(e, t);
    try {
        let u = (await wr.readFile(i, "utf8")).trim().split(`
`).filter(Boolean).slice(-uYe);
        for (let l of u) try {
            let c = JSON.parse(l);
            r.push(`- ${c.ts} ${c.note}`)
        } catch {}
    } catch {}
    r.push("");
    let o = resolveSessionMailboxMarkdownPath(e, t);
    await writeFileAtomic(o, r.join(`
`))
}
