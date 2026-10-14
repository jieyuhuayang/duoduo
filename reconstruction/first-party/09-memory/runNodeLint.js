// duoduo reconstruction — subsystem: 09-memory
// symbol: runNodeLint  (minified: Wwe, daemon.pretty.js:67282)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6 (maps/history_daemon.json)
// locals: 16 renamed — 2 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runNodeLint(memoryDir, limit = 1, options) {
    let memoryDirs = resolveMemoryDirs(memoryDir);
    if (!isMemoryPathDirectory(memoryDirs.topicsDir)) return {
        ranked: [],
        selected: [],
        topicsDirMissing: !0
    };
    let boardText = readMemoryFileSyncOrNull(memoryDirs.boardPath) ?? "",
        reachable = walkReachableMemory(boardText, createMemorySlugReader(memoryDirs)),
        rows = [];
    for (let fileSlug of listMarkdownSlugsSync(memoryDirs.topicsDir)) {
        let nodeType = wdt(fileSlug);
        if (nodeType === null) continue;
        let slug = fileSlug.slice(`${nodeType}-`.length),
            memoryFile = readMemoryFileSyncOrNull(ydt.join(memoryDirs.topicsDir, `${fileSlug}.md`));
        if (memoryFile === null) continue;
        let unexpectedSections = bdt(memoryFile, nodeType),
            lineCount = countNewlineChars(memoryFile);
        if (unexpectedSections.length === 0 && lineCount <= EH) continue;
        let isReachable = reachable.has(fileSlug);
        rows.push({
            slug,
            type: nodeType,
            lines: lineCount,
            unexpectedSections,
            unexpectedSectionCount: unexpectedSections.length,
            reachable: isReachable,
            escalated: !isReachable
        })
    }
    rows.sort(Sdt);
    let selected = (Number.isFinite(limit) && limit > 0 ? rows.slice(0, limit) : []).map(row => ({
        row,
        kind: Vn.NODE_CONVERGE,
        partition: "pattern-tracker",
        pendingFilename: `${buildNodeSignalKey(row)}.md.pending`,
        pendingBody: renderNodeConvergeSignalBody(row)
    }));
    return {
        ranked: rows,
        selected,
        topicsDirMissing: !1
    }
}
