// duoduo reconstruction — subsystem: 09-memory
// symbol: forgetMemoryEntry  (minified: vge, daemon.pretty.js:61957)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function forgetMemoryEntry(e, t, n = {}) {
    let r = e.filter(a => a.state === "STALE").sort((a, l) => br(a.rel, l.rel)),
        i = r.map(a => a.rel);
    if (i.length === 0 || n.dryRun) return i;
    let o = dv.join(t, "memory"),
        s = Ant(o);
    if (s !== null && gge.existsSync(dv.join(s, ".git", "index.lock"))) return [];
    try {
        let a = dh("git", ["rm", "--ignore-unmatch", "--", ...i], {
            cwd: o,
            encoding: "utf8"
        });
        if (a.error || a.status !== 0) return [];
        let l = dh("git", ["diff", "--cached", "--name-only", "--diff-filter=D", "--", ...i], {
                cwd: o,
                encoding: "utf8"
            }),
            u = l.status === 0 && !l.error ? l.stdout.split(`
`).map(d => d.trim()).filter(d => d.length > 0) : i;
        if (u.length === 0) return [];
        let c = dh("git", ["-c", "user.name=aladuo", "-c", "user.email=aladuo@local", "commit", "-m", Lnt(r), "--", ...u], {
            cwd: o,
            encoding: "utf8"
        });
        return c.error || c.status !== 0 ? (dh("git", ["reset", "--quiet", "--", ...u], {
            cwd: o,
            encoding: "utf8"
        }), dh("git", ["checkout", "--", ...u], {
            cwd: o,
            encoding: "utf8"
        }), []) : u
    } catch {
        return []
    }
}
