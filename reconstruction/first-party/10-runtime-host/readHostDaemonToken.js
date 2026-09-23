// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDaemonToken  (minified: Hct, daemon.pretty.js:68878)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDaemonToken(e = process.env) {
    let t = hostDotEnvPath(e),
        n;
    try {
        n = await Cs.readFile(t, "utf8")
    } catch (i) {
        if (i.code === "ENOENT") return;
        throw i
    }
    let r = parseDotEnv(n)[DAEMON_TOKEN_ENV_KEY]?.trim();
    return r || void 0
}
