// duoduo reconstruction — subsystem: 03-session-actor
// symbol: appendSessionMailboxNote  (minified: Db, daemon.pretty.js:32798)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendSessionMailboxNote(e, t, n, r = new Date) {
    await bU(e, t);
    let i = resolveSessionMailboxNotesPath(e, t),
        o = {
            ts: r.toISOString(),
            note: n.trim()
        };
    await wr.appendFile(i, JSON.stringify(o) + `
`)
}
