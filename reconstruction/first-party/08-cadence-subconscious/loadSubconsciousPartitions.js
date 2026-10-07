// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: loadSubconsciousPartitions  (minified: hS, daemon.pretty.js:66462)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadSubconsciousPartitions(e) {
    let t;
    try {
        t = await al.readdir(e.subconsciousDir, {
            withFileTypes: !0
        })
    } catch {
        return []
    }
    let n = t.filter(i => i.isDirectory() && !hH.has(i.name)).map(i => i.name),
        r = [];
    for (let i of n) {
        let o = RO.join(e.subconsciousDir, i),
            s = RO.join(o, "CLAUDE.md");
        try {
            await al.access(s)
        } catch {
            continue
        }
        let a = await parsePartitionDefinition(i, o, s);
        a && r.push(a)
    }
    return r.sort((i, o) => i.name.localeCompare(o.name))
}
