// duoduo reconstruction — subsystem: 03-session-actor
// symbol: moveFileIntoDirectory  (minified: Gd, daemon.pretty.js:32340)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function moveFileIntoDirectory(e, t, n = "") {
    await ensureDirectoryExists(t);
    let r = xae.join(t, xae.basename(e) + n);
    return await eYe.rename(e, r), r
}
