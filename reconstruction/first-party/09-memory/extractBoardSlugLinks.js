// duoduo reconstruction — subsystem: 09-memory
// symbol: extractBoardSlugLinks  (minified: hgt, daemon.pretty.js:70565)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractBoardSlugLinks(text) {
    let links = [],
        parts = text.split(`
`);
    for (let i2 = 0; i2 < parts.length; i2 += 1)
        for (let match of parts[i2].matchAll(mgt)) {
            let slug = match[1]?.trim() ?? "";
            links.push({
                slug,
                line: i2 + 1
            })
        }
    return links
}
