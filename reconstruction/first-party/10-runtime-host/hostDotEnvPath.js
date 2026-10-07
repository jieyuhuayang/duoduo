// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: hostDotEnvPath  (minified: ll, daemon.pretty.js:69060)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hostDotEnvPath(e) {
    let t = e.HOME ?? e.USERPROFILE ?? Uft.homedir();
    return USe.join(t, ".config", "duoduo", ".env")
}
