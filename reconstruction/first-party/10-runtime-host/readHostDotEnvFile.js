// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDotEnvFile  (minified: Wpe, daemon.pretty.js:58665)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDotEnvFile(e = process.env) {
    let t = hostDotEnvPath(e);
    try {
        let n = await ns.readFile(t, "utf8");
        return parseDotEnv(n)
    } catch {
        return {}
    }
}
