// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadHostDotEnv  (minified: TXe, daemon.pretty.js:58673)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadHostDotEnv(e = process.env) {
    let t = hostDotEnvPath(e),
        n;
    try {
        n = await ns.readFile(t, "utf8")
    } catch {
        return 0
    }
    let r = parseDotEnv(n),
        i = 0;
    for (let [o, s] of Object.entries(r))(e[o] === void 0 || e[o] === "") && (e[o] = s, i++);
    return i
}
