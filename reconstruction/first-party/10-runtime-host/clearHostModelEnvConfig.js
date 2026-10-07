// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvConfig  (minified: ZSe, daemon.pretty.js:69155)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearHostModelEnvConfig(e = process.env) {
    let t = hostDotEnvPath(e),
        n = "";
    try {
        n = await Ns.readFile(t, "utf8")
    } catch {
        n = ""
    }
    let r = removeHostModelEnvLines(n);
    await writeHostDotEnvLines(r, e)
}
