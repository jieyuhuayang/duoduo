// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: Tye, daemon.pretty.js:62982)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostModelEnvConfig(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await ds.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = xye(r),
        o = xit(e);
    i.length > 0 && o.length > 0 && i[i.length - 1] !== "" && i.push(""), await nC([...i, ...o], t)
}
