// duoduo reconstruction — subsystem: 03-session-actor
// symbol: ensureSessionDescriptorAndStateFiles  (minified: ch, daemon.pretty.js:36802)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.0, v0.5.0, v0.5.4, v0.8.7 (maps/history_daemon.json)
// locals: 10 renamed — 4 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureSessionDescriptorAndStateFiles(paths, input) {
    assertSessionNotArchiving(input.session_key);
    let displayName = input.display_name;
    isReservedMainAliasChange(input.session_key, displayName) && (logWarnMessage("[session] refused the reserved main alias on session creation", {
        session_key: input.session_key
    }), displayName = void 0);
    let descriptor = {
            session_key: input.session_key,
            display_name: displayName,
            kind: input.kind ?? "custom",
            owner_session: input.owner_session
        },
        metaCreated = !1,
        stateCreated = !1;
    await runWithSessionMutex(input.session_key, async () => {
        let sessionDir = resolveSessionDir(paths, descriptor.session_key);
        await ensureDirectoryExists(sessionDir);
        let sessionMetaPath = resolveSessionMetaPath(paths, descriptor.session_key);
        try {
            await Ja.access(sessionMetaPath)
        } catch {
            let metaContent = lv.default.stringify(["# Session Descriptor", "", "This file describes declarative metadata for this session.", "High-churn runtime state is stored in state.json."].join(`
`), stripUndefinedFieldsDeep(descriptor));
            await writeFileAtomic(sessionMetaPath, metaContent), metaCreated = !0
        }
        let sessionStatePath = resolveSessionStatePath(paths, descriptor.session_key);
        try {
            await Ja.access(sessionStatePath)
        } catch {
            await writeJsonFileAtomic(sessionStatePath, {
                updated_at: new Date().toISOString()
            }), stateCreated = !0
        }
    }), metaCreated && notifySessionFileChanged(descriptor.session_key, "meta"), stateCreated && notifySessionFileChanged(descriptor.session_key, "state")
}
