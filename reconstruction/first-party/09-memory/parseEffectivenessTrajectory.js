// duoduo reconstruction — subsystem: 09-memory
// symbol: parseEffectivenessTrajectory  (minified: slt, daemon.pretty.js:66636)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseEffectivenessTrajectory(e) {
    for (let t of Bo(e)) {
        let n = /^trajectory:\s*(.+?)\s*$/i.exec(t);
        if (!n) continue;
        let r = n[1].toUpperCase();
        return r.startsWith("STRENGTHEN") ? "STRENGTHENING" : r.startsWith("WEAKEN") ? "WEAKENING" : (r.startsWith("NEUTRAL"), "NEUTRAL")
    }
    return "NO-EFF"
}
