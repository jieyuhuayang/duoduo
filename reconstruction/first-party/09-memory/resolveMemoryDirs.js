// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: Ai, daemon.pretty.js:66479)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: Z$.join(e, "CLAUDE.md"),
        entitiesDir: Z$.join(e, "entities"),
        topicsDir: Z$.join(e, "topics"),
        effectivenessDir: Z$.join(e, "effectiveness")
    }
}
