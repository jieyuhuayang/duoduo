// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: refreshBootstrapDuoduoMdFiles  (minified: Igt, daemon.pretty.js:70980)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 1 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshBootstrapDuoduoMdFiles(paths) {
    let bootstrapVarDir = cr.join(paths.bootstrapDir, "var");
    if (!await pathExistsAsync(bootstrapVarDir)) return;
    async function copyDuoduoMdFiles(srcDir, destDir) {
        let dirEntries = await lr.readdir(srcDir, {
            withFileTypes: !0
        });
        for (let entry of dirEntries) {
            let srcPath = cr.join(srcDir, entry.name),
                destPath = cr.join(destDir, entry.name);
            entry.isDirectory() ? await copyDuoduoMdFiles(srcPath, destPath) : entry.isFile() && entry.name === "DUODUO.md" && (await ensureDirectoryExists(destDir), await lr.copyFile(srcPath, destPath))
        }
    }
    await copyDuoduoMdFiles(bootstrapVarDir, paths.varDir)
}
