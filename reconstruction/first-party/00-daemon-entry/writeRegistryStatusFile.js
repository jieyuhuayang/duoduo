// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: writeRegistryStatusFile  (minified: SU, daemon.pretty.js:33011)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeRegistryStatusFile(e, t) {
    await writeJsonFileAtomic(resolveRegistryStatusPath(e), t)
}
