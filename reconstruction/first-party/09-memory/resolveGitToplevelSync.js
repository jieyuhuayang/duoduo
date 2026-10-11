// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveGitToplevelSync  (minified: Cft, daemon.pretty.js:68728)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveGitToplevelSync(cwd) {
    try {
        let result = Hg("git", ["rev-parse", "--show-toplevel"], {
            cwd,
            encoding: "utf8"
        });
        if (result.error || result.status !== 0) return null;
        let trimmed = result.stdout.trim();
        return trimmed.length > 0 ? trimmed : null
    } catch {
        return null
    }
}
