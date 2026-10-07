// duoduo reconstruction — subsystem: 03-session-actor
// symbol: ensureSessionDescriptorAndStateFiles  (minified: nh, daemon.pretty.js:35600)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureSessionDescriptorAndStateFiles(e, t) {
    assertSessionNotArchiving(t.session_key);
    let n = {
            session_key: t.session_key,
            display_name: t.display_name,
            kind: t.kind ?? "custom",
            owner_session: t.owner_session
        },
        r = !1,
        i = !1;
    await runWithSessionMutex(t.session_key, async () => {
        let o = resolveSessionDir(e, n.session_key);
        await ensureDirectoryExists(o);
        let s = resolveSessionMetaPath(e, n.session_key);
        try {
            await qa.access(s)
        } catch {
            let u = Gb.default.stringify(["# Session Descriptor", "", "This file describes declarative metadata for this session.", "High-churn runtime state is stored in state.json."].join(`
`), stripUndefinedFieldsDeep(n));
            await writeFileAtomic(s, u), r = !0
        }
        let a = resolveSessionStatePath(e, n.session_key);
        try {
            await qa.access(a)
        } catch {
            await writeJsonFileAtomic(a, {
                updated_at: new Date().toISOString()
            }), i = !0
        }
    }), r && notifySessionFileChanged(n.session_key, "meta"), i && notifySessionFileChanged(n.session_key, "state")
}
