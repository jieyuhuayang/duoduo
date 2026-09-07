// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: Age, daemon.pretty.js:62395)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostModelEnvConfig(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await rs.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = Cge(r),
        o = Vnt(e);
    i.length > 0 && o.length > 0 && i[i.length - 1] !== "" && i.push(""), await jP([...i, ...o], t)
}
