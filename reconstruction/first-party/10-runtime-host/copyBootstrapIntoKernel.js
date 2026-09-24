// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyBootstrapIntoKernel  (minified: Edt, daemon.pretty.js:69505)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyBootstrapIntoKernel(e, t = process.env) {
    let n = e.bootstrapDir;
    if (!n || !await pathExistsAsync(n)) return;
    let r = nr.resolve(e.kernelDir),
        i = nr.resolve(n);
    if (r === i) return;
    if (t.NODE_ENV === "development") {
        let s = await tr.readdir(n, {
            withFileTypes: !0
        });
        for (let a of s) {
            if (iH.has(a.name) || a.isFile() && oH.has(a.name)) continue;
            let u = nr.join(n, a.name),
                l = nr.join(e.kernelDir, a.name);
            a.isDirectory() ? kdt.has(a.name) ? await copyDirTreeMissingOnly(u, l) : await copyDirTreeOverwrite(u, l) : a.isFile() && await tr.copyFile(u, l)
        }
    } else if (await isDirEmptyOrMissing(e.kernelDir)) {
        let s = await tr.readdir(n, {
            withFileTypes: !0
        });
        for (let a of s) {
            if (iH.has(a.name) || a.isFile() && oH.has(a.name)) continue;
            let u = nr.join(n, a.name),
                l = nr.join(e.kernelDir, a.name);
            a.isDirectory() ? await copyDirTreeOverwrite(u, l) : a.isFile() && await tr.copyFile(u, l)
        }
    } else {
        let s = await tr.readdir(n, {
            withFileTypes: !0
        });
        for (let a of s) {
            if (iH.has(a.name) || a.isFile() && oH.has(a.name)) continue;
            let u = nr.join(n, a.name),
                l = nr.join(e.kernelDir, a.name);
            a.isDirectory() ? await copyDirTreeMissingOnly(u, l) : a.isFile() && (await pathExistsAsync(l) || await tr.copyFile(u, l))
        }
    }
}
