// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDaemonToken  (minified: RXe, daemon.pretty.js:58651)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDaemonToken(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await ns.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = Upe(r, [DAEMON_TOKEN_ENV_KEY]);
    return i.length > 0 && i[i.length - 1] !== "" && i.push(""), await LI([...i, `${DAEMON_TOKEN_ENV_KEY}=${e}`], t, {
        mode: 384
    }), await ns.chmod(n, 384), n
}
