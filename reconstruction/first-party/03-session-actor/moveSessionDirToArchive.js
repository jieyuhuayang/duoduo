// duoduo reconstruction — subsystem: 03-session-actor
// symbol: moveSessionDirToArchive  (minified: Ob, daemon.pretty.js:32483)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function moveSessionDirToArchive(e, t) {
    let n = resolveSessionDir(e, t),
        r = resolveArchivedSessionDir(e, t);
    try {
        if (!(await No.stat(n)).isDirectory()) return !1
    } catch {
        return !1
    }
    await ensureDirectoryExists(Gr.dirname(r));
    let i = r,
        o = !1;
    try {
        await No.access(r), o = !0
    } catch {
        o = !1
    }
    if (o) {
        let s = new Date().toISOString().replace(/[:.]/g, "-");
        i = `${r}.${s}`
    }
    if (await No.rename(n, i), _U) try {
        _U(t)
    } catch {}
    return !0
}
