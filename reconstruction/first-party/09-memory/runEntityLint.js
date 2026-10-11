// duoduo reconstruction — subsystem: 09-memory
// symbol: runEntityLint  (minified: Uwe, daemon.pretty.js:67204)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 15 renamed — 2 from the code at the binding (rule), 13 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runEntityLint(memoryDir, limit, options) {
    let memoryDirs = resolveMemoryDirs(memoryDir);
    if (!isMemoryPathDirectory(memoryDirs.entitiesDir)) return {
        ranked: [],
        selected: [],
        entitiesDirMissing: !0
    };
    let boardText = readMemoryFileSyncOrNull(memoryDirs.boardPath) ?? "",
        reachable = walkReachableMemory(boardText, createMemorySlugReader(memoryDirs)),
        rows = [];
    for (let slug of listMarkdownSlugsSync(memoryDirs.entitiesDir)) {
        let memoryFile = readMemoryFileSyncOrNull(fdt.join(memoryDirs.entitiesDir, `${slug}.md`));
        if (memoryFile === null || pdt(memoryFile)) continue;
        let kb = bytesToKibCeil(measureUtf8ByteLength(memoryFile)),
            lineCount = countNewlineChars(memoryFile),
            datedCount = countDatedStampLines(memoryFile),
            score = kb * 1e3 + datedCount;
        rows.push({
            slug,
            kb,
            lines: lineCount,
            dated: datedCount,
            reachable: reachable.has(slug),
            score
        })
    }
    rows.sort(Lwe);
    let selected = (Number.isFinite(limit) && limit > 0 ? rows.slice(0, limit) : []).map(row => ({
        row,
        kind: Vn.ENTITY_CONVERGE,
        partition: "intuition-weaver",
        pendingFilename: `entity-converge-${row.slug}.md.pending`,
        pendingBody: renderEntityConvergeSignalBody(row)
    }));
    return {
        ranked: rows,
        selected,
        entitiesDirMissing: !1
    }
}
