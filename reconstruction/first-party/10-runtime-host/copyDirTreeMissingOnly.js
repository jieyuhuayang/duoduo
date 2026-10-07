// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyDirTreeMissingOnly  (minified: bW, daemon.pretty.js:69770)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyDirTreeMissingOnly(e, t) {
    await ensureDirectoryExists(t);
    let n = await or.readdir(e, {
        withFileTypes: !0
    });
    for (let r of n) {
        let i = sr.join(e, r.name),
            o = sr.join(t, r.name);
        r.isDirectory() ? await copyDirTreeMissingOnly(i, o) : r.isFile() && (await pathExistsAsync(o) || await or.copyFile(i, o))
    }
}
