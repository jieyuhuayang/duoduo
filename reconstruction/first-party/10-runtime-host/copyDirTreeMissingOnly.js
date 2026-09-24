// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: copyDirTreeMissingOnly  (minified: aH, daemon.pretty.js:69479)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function copyDirTreeMissingOnly(e, t) {
    await $e(t);
    let n = await tr.readdir(e, {
        withFileTypes: !0
    });
    for (let r of n) {
        let i = nr.join(e, r.name),
            o = nr.join(t, r.name);
        r.isDirectory() ? await copyDirTreeMissingOnly(i, o) : r.isFile() && (await pathExistsAsync(o) || await tr.copyFile(i, o))
    }
}
