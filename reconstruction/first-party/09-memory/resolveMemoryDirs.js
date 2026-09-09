// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: Ti, daemon.pretty.js:60622)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: LP.join(e, "CLAUDE.md"),
        entitiesDir: LP.join(e, "entities"),
        topicsDir: LP.join(e, "topics"),
        effectivenessDir: LP.join(e, "effectiveness")
    }
}
