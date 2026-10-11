// duoduo reconstruction — subsystem: 03-session-actor
// symbol: patchSessionRuntimeState  (minified: et, daemon.pretty.js:35690)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.5, v0.5.0, v0.5.10 (maps/history_daemon.json)
// locals: 16 renamed — 2 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function patchSessionRuntimeState(paths, sessionKey, patch, options = {}) {
    let create = options.create === !0,
        written = !1;
    await runWithSessionMutex(sessionKey, async () => {
        if (assertSessionNotArchiving(sessionKey), !create && isSessionArchived(paths, sessionKey)) {
            logDebugMessage("[session] skipping runtime-state patch for tombstoned session", {
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
        let setFields = {},
            removedKeys = new Set;
        for (let [key, value] of Object.entries(patch))
            if (value !== void 0) {
                if (value === null) {
                    removedKeys.add(key);
                    continue
                }
                setFields[key] = value
            } let cleaned = stripUndefinedFieldsDeep(setFields),
            next = {
                ...current,
                ...cleaned,
                updated_at: new Date().toISOString()
            };
        for (let removedKey of removedKeys) delete next[removedKey];
        await writeJsonFileAtomic(sessionStatePath, next), written = !0
    }), written && notifySessionFileChanged(sessionKey, "state")
}
