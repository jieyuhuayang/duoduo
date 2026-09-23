// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionSummaries  (minified: uU, daemon.pretty.js:36855)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionSummaries(e, t) {
    await $e(e.usageDir);
    let n;
    try {
        n = await BR.readdir(e.usageDir)
    } catch {
        return {}
    }
    let r = {};
    for (let i of n) {
        if (!i.endsWith(".jsonl")) continue;
        let o = i.slice(0, -6),
            s = await Fle(e, o, t).catch(VR);
        s.total_drains > 0 && (r[o] = s)
    }
    return r
}
