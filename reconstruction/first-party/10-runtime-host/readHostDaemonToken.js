// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDaemonToken  (minified: EXe, daemon.pretty.js:58640)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDaemonToken(e = process.env) {
    let t = hostDotEnvPath(e),
        n;
    try {
        n = await ns.readFile(t, "utf8")
    } catch (i) {
        if (i.code === "ENOENT") return;
        throw i
    }
    let r = parseDotEnv(n)[DAEMON_TOKEN_ENV_KEY]?.trim();
    return r || void 0
}
