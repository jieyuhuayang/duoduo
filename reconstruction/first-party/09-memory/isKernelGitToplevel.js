// duoduo reconstruction — subsystem: 09-memory
// symbol: isKernelGitToplevel  (minified: Upt, daemon.pretty.js:69273)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isKernelGitToplevel(dir) {
    try {
        let {
            stdout
        } = await Ike("git", buildSafeDirectoryGitArgs(dir, ["rev-parse", "--show-toplevel"]), {
            cwd: dir,
            env: buildKernelGitEnv()
        }), toplevel = await ES.realpath(stdout.trim()), resolvedDir = await ES.realpath(dir);
        return toplevel === resolvedDir
    } catch {
        return !1
    }
}
