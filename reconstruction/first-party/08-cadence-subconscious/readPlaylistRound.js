// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readPlaylistRound  (minified: Fg, daemon.pretty.js:66528)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPlaylistRound(paths) {
    let source;
    try {
        source = await al.readFile(paths.subconsciousPlaylistPath, "utf8")
    } catch {
        return {
            items: [],
            allDone: !0
        }
    }
    let playlistCurrentRound = parsePlaylistCurrentRound(source),
        allDone = playlistCurrentRound.length === 0 || playlistCurrentRound.every(item => item.done);
    return {
        items: playlistCurrentRound,
        allDone
    }
}
