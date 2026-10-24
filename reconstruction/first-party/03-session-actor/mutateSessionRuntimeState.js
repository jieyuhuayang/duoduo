// duoduo reconstruction — subsystem: 03-session-actor
// symbol: mutateSessionRuntimeState  (minified: mf, daemon.pretty.js:37809)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.5.10 (maps/history_daemon.json)
// locals: 14 renamed — 2 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): `updateSessionRuntimeState`, and `enqueueMailboxItem` now take the same lock that `archiveSessionDir` takes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mutateSessionRuntimeState(paths, sessionKey, mutator) {
    let written = !1;
    await runWithSessionMutex(sessionKey, async () => {
        if (assertSessionNotArchiving(sessionKey), isSessionArchived(paths, sessionKey)) {
            logDebugMessage("[session] skipping runtime-state mutate for tombstoned session", {
                sessionKey
            });
            return
        }
        let sessionStatePath = resolveSessionStatePath(paths, sessionKey),
            current = {
                updated_at: new Date().toISOString()
            };
        try {
            let content = await Ha.readFile(sessionStatePath, "utf8");
            current = JSON.parse(content)
        } catch {}
        let patch = mutator(current),
            setFields = {},
            removedKeys = new Set;
        for (let [key, value] of Object.entries(patch))
            if (value !== void 0) {
                if (value === null) {
                    removedKeys.add(key);
                    continue
                }
                setFields[key] = value
            } let next = {
            ...current,
            ...stripUndefinedFieldsDeep(setFields),
            updated_at: new Date().toISOString()
        };
        for (let removedKey of removedKeys) delete next[removedKey];
        await writeJsonFileAtomic(sessionStatePath, next), written = !0
    }), written && notifySessionFileChanged(sessionKey, "state")
}
