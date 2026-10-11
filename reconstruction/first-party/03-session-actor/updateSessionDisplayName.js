// duoduo reconstruction — subsystem: 03-session-actor
// symbol: updateSessionDisplayName  (minified: wce, daemon.pretty.js:35640)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.4, v0.7.0 (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): `duoduo session alias <key> "<name>"` — give a session a human label
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateSessionDisplayName(paths, sessionKey, displayName) {
    assertSessionNotArchiving(sessionKey);
    let updatedMeta = null;
    return await runWithSessionMutex(sessionKey, async () => {
        let sessionMetaPath = resolveSessionMetaPath(paths, sessionKey),
            raw;
        try {
            raw = await qa.readFile(sessionMetaPath, "utf8")
        } catch {
            return
        }
        let parsedMatter = (0, Gb.default)(raw, Sr),
            data = parsedMatter.data;
        if (data.session_key !== sessionKey || typeof data.kind != "string" || data.display_name !== void 0 && typeof data.display_name != "string") return;
        let trimmedName = displayName === null ? "" : displayName.trim(),
            nextMeta = {
                ...data,
                session_key: sessionKey,
                kind: data.kind,
                display_name: trimmedName.length > 0 ? trimmedName : void 0
            };
        await writeFileAtomic(sessionMetaPath, Gb.default.stringify(parsedMatter.content, stripUndefinedFieldsDeep(nextMeta))), updatedMeta = stripUndefinedFieldsDeep(nextMeta)
    }), updatedMeta && notifySessionFileChanged(sessionKey, "meta"), updatedMeta
}
