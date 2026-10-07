// duoduo reconstruction — subsystem: 03-session-actor
// symbol: clearSessionRuntimeStateField  (minified: ra, daemon.pretty.js:35763)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.10 (maps/history_daemon.json)
// changelog v0.5.0 (medium): `updateSessionRuntimeState`, and `enqueueMailboxItem` now take the same lock that `archiveSessionDir` takes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearSessionRuntimeStateField(e, t, n) {
    let r = !1;
    await runWithSessionMutex(t, async () => {
        if (assertSessionNotArchiving(t), isSessionArchived(e, t)) {
            logDebugMessage("[session] skipping runtime-state field clear for tombstoned session", {
                sessionKey: t
            });
            return
        }
        let i = resolveSessionStatePath(e, t),
            o = {
                updated_at: new Date().toISOString()
            };
        try {
            let u = await qa.readFile(i, "utf8");
            o = JSON.parse(u)
        } catch {}
        let {
            [n]: s, ...a
        } = o;
        await writeJsonFileAtomic(i, {
            ...a,
            updated_at: new Date().toISOString()
        }), r = !0
    }), r && notifySessionFileChanged(t, "state")
}
