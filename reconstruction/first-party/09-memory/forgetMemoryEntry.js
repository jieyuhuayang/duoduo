// duoduo reconstruction — subsystem: 09-memory
// symbol: forgetMemoryEntry  (minified: hle, daemon.pretty.js:56764)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function forgetMemoryEntry(e, t, n = {}) {
    let r = e.filter(a => a.state === "STALE").sort((a, c) => Or(a.rel, c.rel)),
        i = r.map(a => a.rel);
    if (i.length === 0 || n.dryRun) return i;
    let s = q_.join(t, "memory"),
        o = NKe(s);
    if (o !== null && dle.existsSync(q_.join(o, ".git", "index.lock"))) return [];
    try {
        let a = fm("git", ["rm", "--ignore-unmatch", "--", ...i], {
            cwd: s,
            encoding: "utf8"
        });
        if (a.error || a.status !== 0) return [];
        let c = fm("git", ["diff", "--cached", "--name-only", "--diff-filter=D", "--", ...i], {
                cwd: s,
                encoding: "utf8"
            }),
            u = c.status === 0 && !c.error ? c.stdout.split(`
`).map(d => d.trim()).filter(d => d.length > 0) : i;
        if (u.length === 0) return [];
        let l = fm("git", ["-c", "user.name=aladuo", "-c", "user.email=aladuo@local", "commit", "-m", zKe(r), "--", ...u], {
            cwd: s,
            encoding: "utf8"
        });
        return l.error || l.status !== 0 ? (fm("git", ["reset", "--quiet", "--", ...u], {
            cwd: s,
            encoding: "utf8"
        }), fm("git", ["checkout", "--", ...u], {
            cwd: s,
            encoding: "utf8"
        }), []) : u
    } catch {
        return []
    }
}
