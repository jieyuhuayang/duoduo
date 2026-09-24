// duoduo reconstruction — subsystem: 09-memory
// symbol: renderBoardTemperatureSection  (minified: mct, daemon.pretty.js:67991)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderBoardTemperatureSection(e, t) {
    let n = ["", "board temperature (direct edges only -- each row is one [[slug]] occurrence and the", "touch count of the file behind it; no transitive attribution):", "line | slug | touches | resolves to"];
    e.length === 0 && n.push("(the board carries no [[slug]] pointers)");
    for (let r of e) {
        let i = r.twins.length === 0 ? "DANGLING -- no entities/ or topics/ file" : r.twins.map(o => `${o.rel}=${o.touches}`).join(" ");
        n.push(`L${r.line} | ${r.slug} | ${r.touches??"-"} | ${i}`)
    }
    return t > 0 && n.push(`(+${t} more rows, truncated at the board line budget)`), n.push("direction: a hot line is holding its weight -- keep it, or sharpen it. A 0-touch line", "is half the evidence for retirement: check the line's fragments, and when they are", "also silent for this whole window, the default is retire, not preserve. Recent", "fragments overrule cold pointers -- this metric cannot see a line's direct in-context", "effect. A dangling pointer is claude-lint's business, not this report's."), n
}
