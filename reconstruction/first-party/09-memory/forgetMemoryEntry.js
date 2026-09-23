// duoduo reconstruction — subsystem: 09-memory
// symbol: forgetMemoryEntry  (minified: _we, daemon.pretty.js:68401)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function forgetMemoryEntry(e, t, n = {}) {
    let r = e.filter(a => a.state === "STALE").sort((a, u) => Tr(a.rel, u.rel)),
        i = r.map(a => a.rel);
    if (i.length === 0 || n.dryRun) return i;
    let o = Zw.join(t, "memory"),
        s = Mct(o);
    if (s !== null && mwe.existsSync(Zw.join(s, ".git", "index.lock"))) return [];
    try {
        let a = kg("git", ["rm", "--ignore-unmatch", "--", ...i], {
            cwd: o,
            encoding: "utf8"
        });
        if (a.error || a.status !== 0) return [];
        let u = kg("git", ["diff", "--cached", "--name-only", "--diff-filter=D", "--", ...i], {
                cwd: o,
                encoding: "utf8"
            }),
            l = u.status === 0 && !u.error ? u.stdout.split(`
`).map(d => d.trim()).filter(d => d.length > 0) : i;
        if (l.length === 0) return [];
        let c = kg("git", ["-c", "user.name=aladuo", "-c", "user.email=aladuo@local", "commit", "-m", Uct(r), "--", ...l], {
            cwd: o,
            encoding: "utf8"
        });
        return c.error || c.status !== 0 ? (kg("git", ["reset", "--quiet", "--", ...l], {
            cwd: o,
            encoding: "utf8"
        }), kg("git", ["checkout", "--", ...l], {
            cwd: o,
            encoding: "utf8"
        }), []) : l
    } catch {
        return []
    }
}
