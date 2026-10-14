// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listArchivedCopiesNewestFirst  (minified: gwe, daemon.pretty.js:66317)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 1 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): `discoverChannelId` prefers the newest archive during retry: partial-archive retries now resolve the owning channel from the freshest archived state.json rather than an orphaned bare-ref stub.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listArchivedCopiesNewestFirst(dir, baseName) {
    let entries;
    try {
        entries = await Ai.readdir(dir)
    } catch {
        return []
    }
    let matches = [];
    for (let entry of entries)(entry === baseName || entry.startsWith(`${baseName}.`)) && matches.push(entry);
    if (matches.length === 0) return [];
    let candidates = await Promise.all(matches.map(async entryName => {
        try {
            let stats = await Ai.stat(er.join(dir, entryName));
            return {
                name: entryName,
                mtimeMs: stats.mtimeMs,
                exists: !0
            }
        } catch {
            return {
                name: entryName,
                mtimeMs: 0,
                exists: !1
            }
        }
    }));
    return candidates.sort((a, b) => a.exists !== b.exists ? a.exists ? -1 : 1 : a.mtimeMs !== b.mtimeMs ? b.mtimeMs - a.mtimeMs : a.name === baseName && b.name !== baseName ? 1 : a.name !== baseName && b.name === baseName ? -1 : b.name.localeCompare(a.name)), candidates.map(candidate => er.join(dir, candidate.name))
}
