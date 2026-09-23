// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: Cwe, daemon.pretty.js:68842)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostModelEnvConfig(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await Cs.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = Iwe(r),
        o = Vct(e);
    i.length > 0 && o.length > 0 && i[i.length - 1] !== "" && i.push(""), await fO([...i, ...o], t)
}
