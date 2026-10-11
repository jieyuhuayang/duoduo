// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastBudgetLint  (minified: hSe, daemon.pretty.js:68121)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 4 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastBudgetLint(memoryDir) {
    let boardPath = resolveMemoryDirs(memoryDir).boardPath,
        memoryMaxLinesLimit = readMemoryMaxLinesLimit(),
        maxLineCharsLimit = mSe("ALADUO_MEMORY_MAX_LINE_CHARS", Wdt),
        memoryFile = readMemoryFileSyncOrNull(boardPath);
    if (memoryFile === null) return {
        selected: [],
        overLimit: !1,
        lines: 0,
        maxLineChars: 0
    };
    let lineCount = eft(memoryFile),
        lineStats = Xdt(memoryFile, maxLineCharsLimit),
        maxLineChars = lineStats.maxLineChars;
    return lineCount > memoryMaxLinesLimit || maxLineChars > maxLineCharsLimit ? {
        overLimit: !0,
        lines: lineCount,
        maxLineChars,
        selected: [{
            kind: Vn.CLAUDE_COMPRESS,
            partition: Gdt,
            pendingFilename: "claude-compress.md.pending",
            pendingBody: tft({
                boardPath,
                maxLinesThreshold: memoryMaxLinesLimit,
                maxLineCharsThreshold: maxLineCharsLimit,
                currentLines: lineCount,
                currentMaxLineChars: maxLineChars,
                overLongLines: lineStats.overLong,
                overLongLinesTruncated: lineStats.truncated
            })
        }]
    } : {
        selected: [],
        overLimit: !1,
        lines: lineCount,
        maxLineChars
    }
}
