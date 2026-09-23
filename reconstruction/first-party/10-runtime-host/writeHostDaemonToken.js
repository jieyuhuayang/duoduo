// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDaemonToken  (minified: Kct, daemon.pretty.js:68887)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDaemonToken(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await Cs.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = Pwe(r, [DAEMON_TOKEN_ENV_KEY]);
    return i.length > 0 && i[i.length - 1] !== "" && i.push(""), await fO([...i, `${DAEMON_TOKEN_ENV_KEY}=${e}`], t), n
}
