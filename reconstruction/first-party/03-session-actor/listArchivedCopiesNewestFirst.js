// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listArchivedCopiesNewestFirst  (minified: pwe, daemon.pretty.js:66316)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): `discoverChannelId` prefers the newest archive during retry: partial-archive retries now resolve the owning channel from the freshest archived state.json rather than an orphaned bare-ref stub.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listArchivedCopiesNewestFirst(e, t) {
    let n;
    try {
        n = await Ai.readdir(e)
    } catch {
        return []
    }
    let r = [];
    for (let o of n)(o === t || o.startsWith(`${t}.`)) && r.push(o);
    if (r.length === 0) return [];
    let i = await Promise.all(r.map(async o => {
        try {
            let s = await Ai.stat(er.join(e, o));
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
    return i.sort((o, s) => o.exists !== s.exists ? o.exists ? -1 : 1 : o.mtimeMs !== s.mtimeMs ? s.mtimeMs - o.mtimeMs : o.name === t && s.name !== t ? 1 : o.name !== t && s.name === t ? -1 : s.name.localeCompare(o.name)), i.map(o => er.join(e, o.name))
}
