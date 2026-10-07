// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: refreshBootstrapDuoduoMdFiles  (minified: amt, daemon.pretty.js:69781)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshBootstrapDuoduoMdFiles(e) {
    let t = sr.join(e.bootstrapDir, "var");
    if (!await pathExistsAsync(t)) return;
    async function n(r, i) {
        let o = await or.readdir(r, {
            withFileTypes: !0
        });
        for (let s of o) {
            let a = sr.join(r, s.name),
                u = sr.join(i, s.name);
            s.isDirectory() ? await n(a, u) : s.isFile() && s.name === "DUODUO.md" && (await Ne(i), await or.copyFile(a, u))
        }
    }
    await n(t, e.varDir)
}
