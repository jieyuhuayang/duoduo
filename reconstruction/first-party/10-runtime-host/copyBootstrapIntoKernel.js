// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyBootstrapIntoKernel  (minified: Tgt, daemon.pretty.js:70995)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.3 (maps/history_daemon.json)
// locals: 17 renamed — 4 from the code at the binding (rule), 13 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyBootstrapIntoKernel(paths, env = process.env) {
    let bootstrapDir = paths.bootstrapDir;
    if (!bootstrapDir || !await pathExistsAsync(bootstrapDir)) return;
    let resolvedKernelDir = cr.resolve(paths.kernelDir),
        resolvedBootstrapDir = cr.resolve(bootstrapDir);
    if (resolvedKernelDir === resolvedBootstrapDir) return;
    if (env.NODE_ENV === "development") {
        let dirEntries = await lr.readdir(bootstrapDir, {
            withFileTypes: !0
        });
        for (let entry of dirEntries) {
            if (HW.has(entry.name) || entry.isFile() && WW.has(entry.name)) continue;
            let srcPath = cr.join(bootstrapDir, entry.name),
                destPath = cr.join(paths.kernelDir, entry.name);
            entry.isDirectory() ? Rgt.has(entry.name) ? await copyDirTreeMissingOnly(srcPath, destPath) : await copyDirTreeOverwrite(srcPath, destPath) : entry.isFile() && await lr.copyFile(srcPath, destPath)
        }
    } else if (await isDirEmptyOrMissing(paths.kernelDir)) {
        let dirEntries = await lr.readdir(bootstrapDir, {
            withFileTypes: !0
        });
        for (let entry of dirEntries) {
            if (HW.has(entry.name) || entry.isFile() && WW.has(entry.name)) continue;
            let srcPath = cr.join(bootstrapDir, entry.name),
                destPath = cr.join(paths.kernelDir, entry.name);
            entry.isDirectory() ? await copyDirTreeOverwrite(srcPath, destPath) : entry.isFile() && await lr.copyFile(srcPath, destPath)
        }
    } else {
        let dirEntries = await lr.readdir(bootstrapDir, {
            withFileTypes: !0
        });
        for (let entry of dirEntries) {
            if (HW.has(entry.name) || entry.isFile() && WW.has(entry.name)) continue;
            let srcPath = cr.join(bootstrapDir, entry.name),
                destPath = cr.join(paths.kernelDir, entry.name);
            entry.isDirectory() ? await copyDirTreeMissingOnly(srcPath, destPath) : entry.isFile() && (await pathExistsAsync(destPath) || await lr.copyFile(srcPath, destPath))
        }
    }
}
