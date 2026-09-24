// duoduo reconstruction — subsystem: 03-session-actor
// symbol: enqueueSessionInboxLine  (minified: Xs, daemon.pretty.js:32547)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueSessionInboxLine(e, t, n, r = new Date) {
    return assertSessionNotArchiving(t), runWithSessionMutex(t, async () => {
        let i = rb(e, t);
        await $e(i);
        let s = `${r.toISOString().replace(/[:.]/g,"-")}_${gse()}.pending`,
            a = Ys.join(i, s),
            u = `${n.trim()}
`;
        return await Dt(a, u), a
    })
}
