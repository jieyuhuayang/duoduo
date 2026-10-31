// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: Hc, daemon.pretty.js:68352)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 0 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(boardText, readSlug) {
    let reachable = new Set,
        frontier = resolveMemoryLinkTargets(boardText).filter(isSafeMemorySlug);
    for (let slug of frontier) reachable.add(slug);
    for (; frontier.length > 0;) {
        let nextFrontier = new Set,
            sortedFrontier = [...frontier].sort(compareStringsAscending);
        for (let currentSlug of sortedFrontier) {
            let content = readSlug(currentSlug);
            if (content !== null)
                for (let linkedSlug of resolveMemoryLinkTargets(content)) isSafeMemorySlug(linkedSlug) && !reachable.has(linkedSlug) && nextFrontier.add(linkedSlug)
        }
        frontier = [...nextFrontier];
        for (let newSlug of frontier) reachable.add(newSlug)
    }
    return reachable
}
