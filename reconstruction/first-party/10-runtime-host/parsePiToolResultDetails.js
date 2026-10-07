// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parsePiToolResultDetails  (minified: mEe, daemon.pretty.js:73651)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): Fourth peer behind the same seam as the other three: duoduo's own tools reachable from it
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePiToolResultDetails(e) {
    try {
        let t = JSON.parse(e);
        if (typeof t?.details == "object" && t.details !== null) return t.details
    } catch {}
}
