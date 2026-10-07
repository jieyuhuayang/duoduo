// duoduo reconstruction — subsystem: 09-memory
// symbol: forgetMemoryEntry  (minified: NSe, daemon.pretty.js:68692)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (high): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function forgetMemoryEntry(e, t, n = {}) {
    let r = e.filter(a => a.state === "STALE").sort((a, u) => compareStringsAscending(a.rel, u.rel)),
        i = r.map(a => a.rel);
    if (i.length === 0 || n.dryRun) return i;
    let o = wS.join(t, "memory"),
        s = resolveGitToplevelSync(o);
    if (s !== null && $Se.existsSync(wS.join(s, ".git", "index.lock"))) return [];
    try {
        let a = Hg("git", ["rm", "--ignore-unmatch", "--", ...i], {
            cwd: o,
            encoding: "utf8"
        });
        if (a.error || a.status !== 0) return [];
        let u = Hg("git", ["diff", "--cached", "--name-only", "--diff-filter=D", "--", ...i], {
                cwd: o,
                encoding: "utf8"
            }),
            l = u.status === 0 && !u.error ? u.stdout.split(`
`).map(d => d.trim()).filter(d => d.length > 0) : i;
        if (l.length === 0) return [];
        let c = Hg("git", ["-c", "user.name=aladuo", "-c", "user.email=aladuo@local", "commit", "-m", formatForgetCommitMessage(r), "--", ...l], {
            cwd: o,
            encoding: "utf8"
        });
        return c.error || c.status !== 0 ? (Hg("git", ["reset", "--quiet", "--", ...l], {
            cwd: o,
            encoding: "utf8"
        }), Hg("git", ["checkout", "--", ...l], {
            cwd: o,
            encoding: "utf8"
        }), []) : l
    } catch {
        return []
    }
}
