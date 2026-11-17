// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyDirTreeOverwrite  (minified: oJ, daemon.pretty.js:71143)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyDirTreeOverwrite(srcDir, destDir) {
    await ensureDirectoryExists(destDir);
    let dirEntries = await cr.readdir(srcDir, {
        withFileTypes: !0
    });
    for (let entry of dirEntries) {
        let srcPath = dr.join(srcDir, entry.name),
            destPath = dr.join(destDir, entry.name);
        entry.isDirectory() ? await copyDirTreeOverwrite(srcPath, destPath) : entry.isFile() && await cr.copyFile(srcPath, destPath)
    }
}
