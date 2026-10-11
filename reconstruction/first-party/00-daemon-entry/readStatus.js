// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: readStatus  (minified: Mb, daemon.pretty.js:33014)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readStatus(paths) {
    try {
        let content = await RYe.readFile(statusPath(paths), "utf8");
        return JSON.parse(content)
    } catch {
        return null
    }
}
