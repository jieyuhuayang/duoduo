// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: $u, daemon.pretty.js:57172)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: RI.join(e, "CLAUDE.md"),
        entitiesDir: RI.join(e, "entities"),
        topicsDir: RI.join(e, "topics"),
        effectivenessDir: RI.join(e, "effectiveness")
    }
}
