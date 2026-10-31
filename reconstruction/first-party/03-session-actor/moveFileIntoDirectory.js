// duoduo reconstruction — subsystem: 03-session-actor
// symbol: moveFileIntoDirectory  (minified: rf, daemon.pretty.js:33538)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function moveFileIntoDirectory(filePath, targetDir, suffix = "") {
    await ensureDirectoryExists(targetDir);
    let destinationPath = Bue.join(targetDir, Bue.basename(filePath) + suffix);
    return await hXe.rename(filePath, destinationPath), destinationPath
}
