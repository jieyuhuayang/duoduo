// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isPathWithinDir  (minified: fve, daemon.pretty.js:62682)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isPathWithinDir(baseDir, targetPath) {
    let relativePath = BH.relative(baseDir, targetPath);
    return relativePath !== ".." && !relativePath.startsWith(`..${BH.sep}`) && !BH.isAbsolute(relativePath)
}
