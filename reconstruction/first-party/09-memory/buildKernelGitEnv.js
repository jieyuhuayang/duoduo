// duoduo reconstruction — subsystem: 09-memory
// symbol: buildKernelGitEnv  (minified: Pke, daemon.pretty.js:69258)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildKernelGitEnv() {
    return {
        ...process.env,
        GIT_CONFIG_GLOBAL: Lpt.devNull,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_AUTHOR_NAME: "aladuo",
        GIT_AUTHOR_EMAIL: "aladuo@local",
        GIT_COMMITTER_NAME: "aladuo",
        GIT_COMMITTER_EMAIL: "aladuo@local"
    }
}
