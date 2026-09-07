// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: mi, daemon.pretty.js:60035)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: bP.join(e, "CLAUDE.md"),
        entitiesDir: bP.join(e, "entities"),
        topicsDir: bP.join(e, "topics"),
        effectivenessDir: bP.join(e, "effectiveness")
    }
}
