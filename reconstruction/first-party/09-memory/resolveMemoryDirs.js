// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: Ni, daemon.pretty.js:66751)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
    return {
        memoryDir: e,
        boardPath: $O.join(e, "CLAUDE.md"),
        entitiesDir: $O.join(e, "entities"),
        topicsDir: $O.join(e, "topics"),
        effectivenessDir: $O.join(e, "effectiveness")
    }
}
