// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: parseHostHeaderHostname  (minified: _xt, daemon.pretty.js:94111)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseHostHeaderHostname(hostHeader) {
    if (hostHeader.includes("@")) return null;
    try {
        let hostname = new URL(`http://${hostHeader}`).hostname;
        return hostname ? yZ(hostname) : null
    } catch {
        return null
    }
}
