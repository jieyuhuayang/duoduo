// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadHostDotEnv  (minified: MKe, daemon.pretty.js:57213)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadHostDotEnv(e = process.env) {
    let t = hostDotEnvPath(e),
        n;
    try {
        n = await Za.readFile(t, "utf8")
    } catch {
        return 0
    }
    let r = parseDotEnv(n),
        i = 0;
    for (let [s, o] of Object.entries(r))(e[s] === void 0 || e[s] === "") && (e[s] = o, i++);
    return i
}
