// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyDirTreeOverwrite  (minified: _W, daemon.pretty.js:69759)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyDirTreeOverwrite(e, t) {
    await Ne(t);
    let n = await or.readdir(e, {
        withFileTypes: !0
    });
    for (let r of n) {
        let i = sr.join(e, r.name),
            o = sr.join(t, r.name);
        r.isDirectory() ? await copyDirTreeOverwrite(i, o) : r.isFile() && await or.copyFile(i, o)
    }
}
