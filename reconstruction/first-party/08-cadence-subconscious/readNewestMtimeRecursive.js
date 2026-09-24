// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readNewestMtimeRecursive  (minified: FA, daemon.pretty.js:85776)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readNewestMtimeRecursive(e) {
    let t;
    try {
        t = await US.readdir(e, {
            withFileTypes: !0
        })
    } catch {
        return 0
    }
    let n = 0;
    try {
        let r = await US.stat(e);
        r.mtimeMs > n && (n = r.mtimeMs)
    } catch {}
    for (let r of t) {
        let i = ey.join(e, r.name);
        if (r.isDirectory()) {
            let o = await readNewestMtimeRecursive(i);
            o > n && (n = o)
        } else if (r.isFile() || r.isSymbolicLink()) try {
            let o = await US.stat(i);
            o.mtimeMs > n && (n = o.mtimeMs)
        } catch {}
    }
    return n
}
