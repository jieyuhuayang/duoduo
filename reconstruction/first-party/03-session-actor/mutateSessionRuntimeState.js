// duoduo reconstruction — subsystem: 03-session-actor
// symbol: mutateSessionRuntimeState  (minified: uf, daemon.pretty.js:35727)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.5.10 (maps/history_daemon.json)
// changelog v0.5.0 (medium): `updateSessionRuntimeState`, and `enqueueMailboxItem` now take the same lock that `archiveSessionDir` takes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mutateSessionRuntimeState(e, t, n) {
    let r = !1;
    await runWithSessionMutex(t, async () => {
        if (assertSessionNotArchiving(t), isSessionArchived(e, t)) {
            logDebugMessage("[session] skipping runtime-state mutate for tombstoned session", {
                sessionKey: t
            });
            return
        }
        let i = resolveSessionStatePath(e, t),
            o = {
                updated_at: new Date().toISOString()
            };
        try {
            let c = await qa.readFile(i, "utf8");
            o = JSON.parse(c)
        } catch {}
        let s = n(o),
            a = {},
            u = new Set;
        for (let [c, d] of Object.entries(s))
            if (d !== void 0) {
                if (d === null) {
                    u.add(c);
                    continue
                }
                a[c] = d
            } let l = {
            ...o,
            ...stripUndefinedFieldsDeep(a),
            updated_at: new Date().toISOString()
        };
        for (let c of u) delete l[c];
        await writeJsonFileAtomic(i, l), r = !0
    }), r && notifySessionFileChanged(t, "state")
}
