// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDaemonToken  (minified: Hft, daemon.pretty.js:69178)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// changelog v0.7.0 (high): If you genuinely need to reach a daemon from another machine, `duoduo daemon token new` generates a bearer token and stores it with owner-only permissions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDaemonToken(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await Ns.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = removeDotEnvKeyLines(r, [DAEMON_TOKEN_ENV_KEY]);
    return i.length > 0 && i[i.length - 1] !== "" && i.push(""), await writeHostDotEnvLines([...i, `${DAEMON_TOKEN_ENV_KEY}=${e}`], t), n
}
