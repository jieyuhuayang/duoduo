// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDotEnvFile  (minified: Awe, daemon.pretty.js:68901)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDotEnvFile(e = process.env) {
    let t = hostDotEnvPath(e);
    try {
        let n = await Cs.readFile(t, "utf8");
        return parseDotEnv(n)
    } catch {
        return {}
    }
}
