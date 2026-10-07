// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readPlaylistRound  (minified: Fg, daemon.pretty.js:66527)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPlaylistRound(e) {
    let t;
    try {
        t = await al.readFile(e.subconsciousPlaylistPath, "utf8")
    } catch {
        return {
            items: [],
            allDone: !0
        }
    }
    let n = parsePlaylistCurrentRound(t),
        r = n.length === 0 || n.every(i => i.done);
    return {
        items: n,
        allDone: r
    }
}
