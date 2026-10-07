// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDaemonToken  (minified: Vft, daemon.pretty.js:69166)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (medium): The remote listener starts only when a host, a port and a token are all present, and every request must carry the token.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDaemonToken(e = process.env) {
    let t = hostDotEnvPath(e),
        n;
    try {
        n = await Ns.readFile(t, "utf8")
    } catch (i) {
        if (i.code === "ENOENT") return;
        throw i
    }
    let r = parseDotEnv(n)[DAEMON_TOKEN_ENV_KEY]?.trim();
    return r || void 0
}
