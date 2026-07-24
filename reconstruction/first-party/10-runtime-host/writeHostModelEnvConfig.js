// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: kle, daemon.pretty.js:57168)
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
    let i = wle(r),
        s = LKe(e);
    i.length > 0 && s.length > 0 && i[i.length - 1] !== "" && i.push(""), await EU([...i, ...s], t)
}
