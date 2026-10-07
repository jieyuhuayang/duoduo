// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: readRegistryStatusFile  (minified: Mb, daemon.pretty.js:33014)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readRegistryStatusFile(e) {
    try {
        let t = await RYe.readFile(resolveRegistryStatusPath(e), "utf8");
        return JSON.parse(t)
    } catch {
        return null
    }
}
