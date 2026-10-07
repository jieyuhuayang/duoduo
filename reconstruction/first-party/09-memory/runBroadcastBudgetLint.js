// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastBudgetLint  (minified: hSe, daemon.pretty.js:68121)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastBudgetLint(e) {
    let t = resolveMemoryDirs(e).boardPath,
        n = readMemoryMaxLinesLimit(),
        r = mSe("ALADUO_MEMORY_MAX_LINE_CHARS", Wdt),
        i = readMemoryFileSyncOrNull(t);
    if (i === null) return {
        selected: [],
        overLimit: !1,
        lines: 0,
        maxLineChars: 0
    };
    let o = eft(i),
        s = Xdt(i, r),
        a = s.maxLineChars;
    return o > n || a > r ? {
        overLimit: !0,
        lines: o,
        maxLineChars: a,
        selected: [{
            kind: Vn.CLAUDE_COMPRESS,
            partition: Gdt,
            pendingFilename: "claude-compress.md.pending",
            pendingBody: tft({
                boardPath: t,
                maxLinesThreshold: n,
                maxLineCharsThreshold: r,
                currentLines: o,
                currentMaxLineChars: a,
                overLongLines: s.overLong,
                overLongLinesTruncated: s.truncated
            })
        }]
    } : {
        selected: [],
        overLimit: !1,
        lines: o,
        maxLineChars: a
    }
}
