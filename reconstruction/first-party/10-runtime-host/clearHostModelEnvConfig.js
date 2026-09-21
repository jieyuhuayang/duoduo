// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvConfig  (minified: Owe, daemon.pretty.js:68867)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearHostModelEnvConfig(e = process.env) {
    let t = hostDotEnvPath(e),
        n = "";
    try {
        n = await Cs.readFile(t, "utf8")
    } catch {
        n = ""
    }
    let r = Iwe(n);
    await fO(r, e)
}
