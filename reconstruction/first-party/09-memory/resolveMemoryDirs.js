// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: dc, daemon.pretty.js:55833)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: dR.join(e, "CLAUDE.md"),
        entitiesDir: dR.join(e, "entities"),
        topicsDir: dR.join(e, "topics"),
        effectivenessDir: dR.join(e, "effectiveness")
    }
}
