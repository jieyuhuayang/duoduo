// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: describeWorkspaceProblem  (minified: dht, daemon.pretty.js:72651)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeWorkspaceProblem(e) {
    return Gg.isAbsolute(e) ? Emt(e) ? null : "workspace path does not exist" : "workspace path is not absolute"
}
