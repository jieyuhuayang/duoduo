// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parsePlaylistCurrentRound  (minified: ppt, daemon.pretty.js:67744)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 2 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePlaylistCurrentRound(source) {
    let parts = source.split(`
`),
        headerIndex = parts.findIndex(line => line.trim() === "## Current Round");
    if (headerIndex === -1) return [];
    let items = [];
    for (let index = headerIndex + 1; index < parts.length; index++) {
        let trimmed = parts[index].trim();
        if (trimmed.startsWith("## ")) break;
        trimmed.startsWith("- [x] ") ? items.push({
            name: trimmed.slice(6).trim(),
            done: !0
        }) : trimmed.startsWith("- [ ] ") && items.push({
            name: trimmed.slice(6).trim(),
            done: !1
        })
    }
    return items
}
