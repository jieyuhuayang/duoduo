// duoduo reconstruction — subsystem: 09-memory
// symbol: buildBoardLintTarget  (minified: $pt, daemon.pretty.js:68272)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 14 renamed — 2 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildBoardLintTarget(slug, boardText, memoryDirs, topicPath) {
    let boardLine = KSe(boardText, slug),
        topicText = readMemoryFileSyncOrNull(topicPath) ?? "",
        effectivenessPath = Z6.join(memoryDirs.effectivenessDir, `${slug}.md`),
        memoryFile = readMemoryFileSyncOrNull(effectivenessPath),
        trajectory = "NO-EFF",
        strengthening = 0,
        neutral = 0,
        weakening = 0,
        verdict = null;
    if (memoryFile !== null) {
        trajectory = parseEffectivenessTrajectory(memoryFile);
        let effectivenessCounts = parseEffectivenessCounts(memoryFile);
        strengthening = effectivenessCounts.s, neutral = effectivenessCounts.n, weakening = effectivenessCounts.w, verdict = parseUpdaterGuidanceVerdict(memoryFile)
    }
    return {
        slug,
        boardLine,
        node: `topics/${slug}.md`,
        hasEffectiveness: memoryFile !== null,
        trajectory,
        s: strengthening,
        n: neutral,
        w: weakening,
        verdict,
        fmt: classifyTopicNodeFormat(topicText),
        cls: classifyTopicNodeType(topicText),
        dual: isMemoryPathFile(Z6.join(memoryDirs.entitiesDir, `${slug}.md`))
    }
}
