// duoduo reconstruction — subsystem: 03-session-actor
// symbol: renderSessionMailboxFile  (minified: pR, daemon.pretty.js:32705)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderSessionMailboxFile(e, t, n) {
    let r = ["# Session Mailbox", "", "## Inbox", ""];
    for (let s of n) r.push(s.line);
    r.push("", "## Notes", "");
    let i = resolveSessionMailboxNotesPath(e, t);
    try {
        let u = (await yr.readFile(i, "utf8")).trim().split(`
`).filter(Boolean).slice(-m5e);
        for (let l of u) try {
            let c = JSON.parse(l);
            r.push(`- ${c.ts} ${c.note}`)
        } catch {}
    } catch {}
    r.push("");
    let o = resolveSessionMailboxMarkdownPath(e, t);
    await Dt(o, r.join(`
`))
}
