// duoduo reconstruction — subsystem: 09-memory
// symbol: renderOrphanIslandsBody  (minified: Nft, daemon.pretty.js:68743)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 10 renamed — 0 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderOrphanIslandsBody(islands, scope, nowMs, newbornHours = WO, touchWindow) {
    let lines = ["[orphan-islands]", `scope: ${scope}  (effectiveness/ excluded by default — not graph nodes)`, `${islands.length} topics nodes are unreachable from the board closure but are NOT indeg=0 leaf junk;`, "each is referenced by something (an orphan island). Decide per node: wire it back into", "the board closure (add a reachable [[ref]]), or confirm it dead and clean the references.", `newborn = produced within ${newbornHours}h, may just not be wired yet — give it a round before triage.`];
    touchWindow && lines.push(`touches = foreground reads of the node in the activation window (${UH(touchWindow)}); a touched island is in use now.`), lines.push("", touchWindow ? "islands: slug | age | indeg | touches | referenced-by" : "islands: slug | age | indeg | referenced-by");
    for (let island of islands) {
        let age = Cft(island.mtimeMs, nowMs, newbornHours),
            referencedBy = island.referencedBy.length > 0 ? island.referencedBy.join(" ") + " " : "",
            touches = touchWindow ? `touches=${touchWindow.touches.get(island.rel)??0} | ` : "";
        lines.push(`- ${island.slug} | ${age} | indeg=${island.indeg} | ${touches}${referencedBy}`)
    }
    return lines.join(`
`) + `
`
}
