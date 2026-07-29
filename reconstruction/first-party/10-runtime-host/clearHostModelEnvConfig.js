// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvConfig  (minified: Dle, daemon.pretty.js:57315)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearHostModelEnvConfig(e = process.env) {
    let t = hostDotEnvPath(e),
        n = "";
    try {
        n = await Za.readFile(t, "utf8")
    } catch {
        n = ""
    }
    let r = Ole(n);
    await PU(r, e)
}
