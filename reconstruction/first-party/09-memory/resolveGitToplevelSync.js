// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveGitToplevelSync  (minified: Mct, daemon.pretty.js:68437)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveGitToplevelSync(e) {
    try {
        let t = kg("git", ["rev-parse", "--show-toplevel"], {
            cwd: e,
            encoding: "utf8"
        });
        if (t.error || t.status !== 0) return null;
        let n = t.stdout.trim();
        return n.length > 0 ? n : null
    } catch {
        return null
    }
}
