// duoduo reconstruction — subsystem: 03-session-actor
// symbol: enqueueSessionInboxLine  (minified: ta, daemon.pretty.js:32650)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueSessionInboxLine(e, t, n, r = new Date) {
    return assertSessionNotArchiving(t), runWithSessionMutex(t, async () => {
        let i = resolveSessionInboxDir(e, t);
        await ensureDirectoryExists(i);
        let s = `${r.toISOString().replace(/[:.]/g,"-")}_${Aae()}.pending`,
            a = ea.join(i, s),
            u = `${n.trim()}
`;
        return await writeFileAtomic(a, u), a
    })
}
