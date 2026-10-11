// duoduo reconstruction — subsystem: 03-session-actor
// symbol: clearSessionRuntimeStateField  (minified: ra, daemon.pretty.js:35763)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.10 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): `updateSessionRuntimeState`, and `enqueueMailboxItem` now take the same lock that `archiveSessionDir` takes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearSessionRuntimeStateField(paths, sessionKey, field) {
    let written = !1;
    await runWithSessionMutex(sessionKey, async () => {
        if (assertSessionNotArchiving(sessionKey), isSessionArchived(paths, sessionKey)) {
            logDebugMessage("[session] skipping runtime-state field clear for tombstoned session", {
                sessionKey
            });
            return
        }
        let sessionStatePath = resolveSessionStatePath(paths, sessionKey),
            current = {
                updated_at: new Date().toISOString()
            };
        try {
            let content = await qa.readFile(sessionStatePath, "utf8");
            current = JSON.parse(content)
        } catch {}
        let {
            [field]: removedValue, ...rest
        } = current;
        await writeJsonFileAtomic(sessionStatePath, {
            ...rest,
            updated_at: new Date().toISOString()
        }), written = !0
    }), written && notifySessionFileChanged(sessionKey, "state")
}
