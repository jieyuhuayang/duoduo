// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastBudgetLint  (minified: Qve, daemon.pretty.js:67830)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastBudgetLint(e) {
    let t = resolveMemoryDirs(e).boardPath,
        n = N6(),
        r = Xve("ALADUO_MEMORY_MAX_LINE_CHARS", Ylt),
        i = Rn(t);
    if (i === null) return {
        selected: [],
        overLimit: !1,
        lines: 0,
        maxLineChars: 0
    };
    let o = oct(i),
        s = rct(i, r),
        a = s.maxLineChars;
    return o > n || a > r ? {
        overLimit: !0,
        lines: o,
        maxLineChars: a,
        selected: [{
            kind: Un.CLAUDE_COMPRESS,
            partition: Qlt,
            pendingFilename: "claude-compress.md.pending",
            pendingBody: sct({
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
