// duoduo reconstruction — subsystem: 03-session-actor
// symbol: moveSessionDirToArchive  (minified: Ob, daemon.pretty.js:32483)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// locals: 7 renamed — 2 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): **Archive session tombstone** (#44): `ManageJob(archive)` now moves the session directory to `var/sessions-archive/`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function moveSessionDirToArchive(paths, sessionKey) {
    let sessionDir = resolveSessionDir(paths, sessionKey),
        archivedSessionDir = resolveArchivedSessionDir(paths, sessionKey);
    try {
        if (!(await No.stat(sessionDir)).isDirectory()) return !1
    } catch {
        return !1
    }
    await ensureDirectoryExists(Gr.dirname(archivedSessionDir));
    let destination = archivedSessionDir,
        archiveExists = !1;
    try {
        await No.access(archivedSessionDir), archiveExists = !0
    } catch {
        archiveExists = !1
    }
    if (archiveExists) {
        let timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        destination = `${archivedSessionDir}.${timestamp}`
    }
    if (await No.rename(sessionDir, destination), _U) try {
        _U(sessionKey)
    } catch {}
    return !0
}
