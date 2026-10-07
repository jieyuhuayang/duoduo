// duoduo reconstruction — subsystem: 09-memory
// symbol: isKernelGitToplevel  (minified: Upt, daemon.pretty.js:69273)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isKernelGitToplevel(e) {
    try {
        let {
            stdout: t
        } = await Ike("git", buildSafeDirectoryGitArgs(e, ["rev-parse", "--show-toplevel"]), {
            cwd: e,
            env: buildKernelGitEnv()
        }), n = await ES.realpath(t.trim()), r = await ES.realpath(e);
        return n === r
    } catch {
        return !1
    }
}
