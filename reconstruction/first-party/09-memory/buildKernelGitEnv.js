// duoduo reconstruction — subsystem: 09-memory
// symbol: buildKernelGitEnv  (minified: Fwe, daemon.pretty.js:68967)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildKernelGitEnv() {
    return {
        ...process.env,
        GIT_CONFIG_GLOBAL: tdt.devNull,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_AUTHOR_NAME: "aladuo",
        GIT_AUTHOR_EMAIL: "aladuo@local",
        GIT_COMMITTER_NAME: "aladuo",
        GIT_COMMITTER_EMAIL: "aladuo@local"
    }
}
