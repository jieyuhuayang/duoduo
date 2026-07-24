// duoduo reconstruction — subsystem: 09-memory
// symbol: forgetMemoryEntry  (minified: sle, daemon.pretty.js:56642)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function forgetMemoryEntry(e, t, n = {}) {
    let r = e.filter(a => a.state === "STALE").sort((a, u) => Cr(a.rel, u.rel)),
        i = r.map(a => a.rel);
    if (i.length === 0 || n.dryRun) return i;
    let s = q_.join(t, "memory"),
        o = vKe(s);
    if (o !== null && tle.existsSync(q_.join(o, ".git", "index.lock"))) return [];
    try {
        let a = cm("git", ["rm", "--ignore-unmatch", "--", ...i], {
            cwd: s,
            encoding: "utf8"
        });
        if (a.error || a.status !== 0) return [];
        let u = cm("git", ["diff", "--cached", "--name-only", "--diff-filter=D", "--", ...i], {
                cwd: s,
                encoding: "utf8"
            }),
            c = u.status === 0 && !u.error ? u.stdout.split(`
`).map(d => d.trim()).filter(d => d.length > 0) : i;
        if (c.length === 0) return [];
        let l = cm("git", ["-c", "user.name=aladuo", "-c", "user.email=aladuo@local", "commit", "-m", EKe(r), "--", ...c], {
            cwd: s,
            encoding: "utf8"
        });
        return l.error || l.status !== 0 ? (cm("git", ["reset", "--quiet", "--", ...c], {
            cwd: s,
            encoding: "utf8"
        }), cm("git", ["checkout", "--", ...c], {
            cwd: s,
            encoding: "utf8"
        }), []) : c
    } catch {
        return []
    }
}
