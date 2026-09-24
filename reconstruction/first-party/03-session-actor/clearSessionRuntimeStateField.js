// duoduo reconstruction — subsystem: 03-session-actor
// symbol: clearSessionRuntimeStateField  (minified: ea, daemon.pretty.js:35637)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearSessionRuntimeStateField(e, t, n) {
    let r = !1;
    await runWithSessionMutex(t, async () => {
        if (assertSessionNotArchiving(t), isSessionArchived(e, t)) {
            Re("[session] skipping runtime-state field clear for tombstoned session", {
                sessionKey: t
            });
            return
        }
        let i = resolveSessionStatePath(e, t),
            o = {
                updated_at: new Date().toISOString()
            };
        try {
            let u = await ja.readFile(i, "utf8");
            o = JSON.parse(u)
        } catch {}
        let {
            [n]: s, ...a
        } = o;
        await Bt(i, {
            ...a,
            updated_at: new Date().toISOString()
        }), r = !0
    }), r && jm(t, "state")
}
