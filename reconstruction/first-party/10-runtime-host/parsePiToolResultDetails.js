// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parsePiToolResultDetails  (minified: xke, daemon.pretty.js:73349)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePiToolResultDetails(e) {
    try {
        let t = JSON.parse(e);
        if (typeof t?.details == "object" && t.details !== null) return t.details
    } catch {}
}
