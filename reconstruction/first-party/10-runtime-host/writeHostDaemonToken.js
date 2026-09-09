// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDaemonToken  (minified: Rit, daemon.pretty.js:63030)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDaemonToken(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await ds.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = Eye(r, [DAEMON_TOKEN_ENV_KEY]);
    return i.length > 0 && i[i.length - 1] !== "" && i.push(""), await nC([...i, `${DAEMON_TOKEN_ENV_KEY}=${e}`], t, {
        mode: 384
    }), await ds.chmod(n, 384), n
}
