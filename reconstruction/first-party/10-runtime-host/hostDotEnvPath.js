// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: hostDotEnvPath  (minified: rd, daemon.pretty.js:57222)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hostDotEnvPath(e) {
    let t = e.HOME ?? e.USERPROFILE ?? WKe.homedir();
    return Ile.join(t, ".config", "duoduo", ".env")
}
