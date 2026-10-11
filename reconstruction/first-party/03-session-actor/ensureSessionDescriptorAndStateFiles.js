// duoduo reconstruction — subsystem: 03-session-actor
// symbol: ensureSessionDescriptorAndStateFiles  (minified: nh, daemon.pretty.js:35600)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.0, v0.5.0, v0.5.4 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureSessionDescriptorAndStateFiles(paths, descriptor) {
    assertSessionNotArchiving(descriptor.session_key);
    let meta = {
            session_key: descriptor.session_key,
            display_name: descriptor.display_name,
            kind: descriptor.kind ?? "custom",
            owner_session: descriptor.owner_session
        },
        metaCreated = !1,
        stateCreated = !1;
    await runWithSessionMutex(descriptor.session_key, async () => {
        let sessionDir = resolveSessionDir(paths, meta.session_key);
        await ensureDirectoryExists(sessionDir);
        let sessionMetaPath = resolveSessionMetaPath(paths, meta.session_key);
        try {
            await qa.access(sessionMetaPath)
        } catch {
            let metaContent = Gb.default.stringify(["# Session Descriptor", "", "This file describes declarative metadata for this session.", "High-churn runtime state is stored in state.json."].join(`
`), stripUndefinedFieldsDeep(meta));
            await writeFileAtomic(sessionMetaPath, metaContent), metaCreated = !0
        }
        let sessionStatePath = resolveSessionStatePath(paths, meta.session_key);
        try {
            await qa.access(sessionStatePath)
        } catch {
            await writeJsonFileAtomic(sessionStatePath, {
                updated_at: new Date().toISOString()
            }), stateCreated = !0
        }
    }), metaCreated && notifySessionFileChanged(meta.session_key, "meta"), stateCreated && notifySessionFileChanged(meta.session_key, "state")
}
