// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyDirTreeMissingOnly  (minified: eJ, daemon.pretty.js:71853)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyDirTreeMissingOnly(srcDir, destDir) {
    await ensureDirectoryExists(destDir);
    let dirEntries = await or.readdir(srcDir, {
        withFileTypes: !0
    });
    for (let entry of dirEntries) {
        let srcPath = sr.join(srcDir, entry.name),
            destPath = sr.join(destDir, entry.name);
        entry.isDirectory() ? await copyDirTreeMissingOnly(srcPath, destPath) : entry.isFile() && (await pathExistsAsync(destPath) || await or.copyFile(srcPath, destPath))
    }
}
