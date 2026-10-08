// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: parseHostHeaderHostname  (minified: _vt, daemon.pretty.js:91983)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseHostHeaderHostname(e) {
    if (e.includes("@")) return null;
    try {
        let t = new URL(`http://${e}`).hostname;
        return t ? MG(t) : null
    } catch {
        return null
    }
}
