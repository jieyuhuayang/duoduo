// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: hostDotEnvPath  (minified: gl, daemon.pretty.js:62325)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hostDotEnvPath(e) {
    let t = e.HOME ?? e.USERPROFILE ?? Bnt.homedir();
    return Tge.join(t, ".config", "duoduo", ".env")
}
