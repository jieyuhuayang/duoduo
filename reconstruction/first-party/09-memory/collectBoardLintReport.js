// duoduo reconstruction — subsystem: 09-memory
// symbol: collectBoardLintReport  (minified: Mwe, daemon.pretty.js:67040)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectBoardLintReport(memoryDir, limit = 1, options) {
    let memoryDirs = resolveMemoryDirs(memoryDir),
        memoryFile = readMemoryFileSyncOrNull(memoryDirs.boardPath);
    if (memoryFile === null) return {
        boardMissing: !0,
        targets: [],
        ranked: [],
        selections: [],
        census: {
            pattern: 0,
            lesson: 0,
            groove: 0,
            otherDistinct: 0
        },
        sinkCandidates: []
    };
    let targets = [];
    for (let slug of resolveMemoryLinkTargets(memoryFile)) {
        let topicPath = wH.join(memoryDirs.topicsDir, `${slug}.md`);
        isMemoryPathFile(topicPath) && targets.push(buildBoardLintTarget(slug, memoryFile, memoryDirs, topicPath))
    }
    let ranked = [...targets].sort(compareBoardLintTargets),
        selections = runBoardLint(ranked, limit);
    return {
        boardMissing: !1,
        targets,
        ranked,
        selections,
        census: udt(memoryFile),
        sinkCandidates: ldt(memoryFile)
    }
}
