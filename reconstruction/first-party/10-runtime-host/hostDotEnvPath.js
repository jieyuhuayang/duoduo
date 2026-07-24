// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: hostDotEnvPath  (minified: Ol, daemon.pretty.js:43812)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hostDotEnvPath(e) {
 let t = e.HOME ?? e.USERPROFILE ?? nGe.homedir();
 return Poe.join(t, ".config", "duoduo", ".env")
}
