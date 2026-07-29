// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: du, daemon.pretty.js:55955)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: fR.join(e, "CLAUDE.md"),
        entitiesDir: fR.join(e, "entities"),
        topicsDir: fR.join(e, "topics"),
        effectivenessDir: fR.join(e, "effectiveness")
    }
}
