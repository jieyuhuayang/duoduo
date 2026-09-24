// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listArchivedCopiesNewestFirst  (minified: Gbe, daemon.pretty.js:66044)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listArchivedCopiesNewestFirst(e, t) {
    let n;
    try {
        n = await Oi.readdir(e)
    } catch {
        return []
    }
    let r = [];
    for (let o of n)(o === t || o.startsWith(`${t}.`)) && r.push(o);
    if (r.length === 0) return [];
    let i = await Promise.all(r.map(async o => {
        try {
            let s = await Oi.stat(Kn.join(e, o));
            return {
                name: o,
                mtimeMs: s.mtimeMs,
                exists: !0
            }
        } catch {
            return {
                name: o,
                mtimeMs: 0,
                exists: !1
            }
        }
    }));
    return i.sort((o, s) => o.exists !== s.exists ? o.exists ? -1 : 1 : o.mtimeMs !== s.mtimeMs ? s.mtimeMs - o.mtimeMs : o.name === t && s.name !== t ? 1 : o.name !== t && s.name === t ? -1 : s.name.localeCompare(o.name)), i.map(o => Kn.join(e, o.name))
}
