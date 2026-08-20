// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: hostDotEnvPath  (minified: dl, daemon.pretty.js:58534)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hostDotEnvPath(e) {
    let t = e.HOME ?? e.USERPROFILE ?? SXe.homedir();
    return jpe.join(t, ".config", "duoduo", ".env")
}
