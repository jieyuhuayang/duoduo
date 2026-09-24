// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readPartitionInboxEntries  (minified: uve, daemon.pretty.js:66354)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionInboxEntries(e, t) {
    let n = partitionInboxDir(e, t),
        r;
    try {
        r = await Gu.readdir(n, {
            withFileTypes: !0
        })
    } catch {
        return {
            entries: []
        }
    }
    let i = r.filter(u => u.isFile() && !u.name.startsWith(".") && (u.name.endsWith(".pending") || u.name.endsWith(".json"))).map(u => u.name),
        s = (await Promise.all(i.map(async u => {
            try {
                let l = await Gu.stat(V$.join(n, u));
                return {
                    name: u,
                    mtimeMs: l.mtimeMs
                }
            } catch {
                return null
            }
        }))).filter(u => u !== null).sort((u, l) => u.mtimeMs - l.mtimeMs || (u.name < l.name ? -1 : u.name > l.name ? 1 : 0)).map(u => u.name);
    if (s.length === 0) return {
        entries: []
    };
    let a = [];
    for (let u of s) try {
        let l = await Gu.readFile(V$.join(n, u), "utf8");
        a.push({
            file: u,
            message: l.trim()
        })
    } catch {}
    return Re("[playlist] read partition inbox", {
        partition: t,
        files: s.length,
        entriesEmitted: a.length
    }), {
        entries: a
    }
}
