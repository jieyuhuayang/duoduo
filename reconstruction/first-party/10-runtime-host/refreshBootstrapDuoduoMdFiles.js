// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: refreshBootstrapDuoduoMdFiles  (minified: xdt, daemon.pretty.js:69490)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshBootstrapDuoduoMdFiles(e) {
    let t = nr.join(e.bootstrapDir, "var");
    if (!await pathExistsAsync(t)) return;
    async function n(r, i) {
        let o = await tr.readdir(r, {
            withFileTypes: !0
        });
        for (let s of o) {
            let a = nr.join(r, s.name),
                u = nr.join(i, s.name);
            s.isDirectory() ? await n(a, u) : s.isFile() && s.name === "DUODUO.md" && (await $e(i), await tr.copyFile(a, u))
        }
    }
    await n(t, e.varDir)
}
