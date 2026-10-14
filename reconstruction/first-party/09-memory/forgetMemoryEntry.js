// duoduo reconstruction — subsystem: 09-memory
// symbol: forgetMemoryEntry  (minified: jSe, daemon.pretty.js:68693)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 16 renamed — 1 from the code at the binding (rule), 15 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (high): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function forgetMemoryEntry(states, kernelDir, options = {}) {
    let staleNodes = states.filter(entry => entry.state === "STALE").sort((a, b) => compareStringsAscending(a.rel, b.rel)),
        relPaths = staleNodes.map(node => node.rel);
    if (relPaths.length === 0 || options.dryRun) return relPaths;
    let memoryDir = wS.join(kernelDir, "memory"),
        gitToplevel = resolveGitToplevelSync(memoryDir);
    if (gitToplevel !== null && ASe.existsSync(wS.join(gitToplevel, ".git", "index.lock"))) return [];
    try {
        let rmResult = Hg("git", ["rm", "--ignore-unmatch", "--", ...relPaths], {
            cwd: memoryDir,
            encoding: "utf8"
        });
        if (rmResult.error || rmResult.status !== 0) return [];
        let diffResult = Hg("git", ["diff", "--cached", "--name-only", "--diff-filter=D", "--", ...relPaths], {
                cwd: memoryDir,
                encoding: "utf8"
            }),
            deletedPaths = diffResult.status === 0 && !diffResult.error ? diffResult.stdout.split(`
`).map(line => line.trim()).filter(filePath => filePath.length > 0) : relPaths;
        if (deletedPaths.length === 0) return [];
        let commitResult = Hg("git", ["-c", "user.name=aladuo", "-c", "user.email=aladuo@local", "commit", "-m", formatForgetCommitMessage(staleNodes), "--", ...deletedPaths], {
            cwd: memoryDir,
            encoding: "utf8"
        });
        return commitResult.error || commitResult.status !== 0 ? (Hg("git", ["reset", "--quiet", "--", ...deletedPaths], {
            cwd: memoryDir,
            encoding: "utf8"
        }), Hg("git", ["checkout", "--", ...deletedPaths], {
            cwd: memoryDir,
            encoding: "utf8"
        }), []) : deletedPaths
    } catch {
        return []
    }
}
