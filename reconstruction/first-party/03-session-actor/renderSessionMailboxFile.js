// duoduo reconstruction — subsystem: 03-session-actor
// symbol: renderSessionMailboxFile  (minified: WR, daemon.pretty.js:32808)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 3 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderSessionMailboxFile(paths, sessionKey, items) {
    let lines = ["# Session Mailbox", "", "## Inbox", ""];
    for (let item of items) lines.push(item.line);
    lines.push("", "## Notes", "");
    let sessionMailboxNotesPath = resolveSessionMailboxNotesPath(paths, sessionKey);
    try {
        let noteLines = (await wr.readFile(sessionMailboxNotesPath, "utf8")).trim().split(`
`).filter(Boolean).slice(-uYe);
        for (let noteLine of noteLines) try {
            let parsed = JSON.parse(noteLine);
            lines.push(`- ${parsed.ts} ${parsed.note}`)
        } catch {}
    } catch {}
    lines.push("");
    let sessionMailboxMarkdownPath = resolveSessionMailboxMarkdownPath(paths, sessionKey);
    await writeFileAtomic(sessionMailboxMarkdownPath, lines.join(`
`))
}
