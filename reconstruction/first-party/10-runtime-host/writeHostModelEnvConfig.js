// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: Ale, daemon.pretty.js:57290)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostModelEnvConfig(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await Za.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = Ole(r),
        s = YKe(e);
    i.length > 0 && s.length > 0 && i[i.length - 1] !== "" && i.push(""), await PU([...i, ...s], t)
}
