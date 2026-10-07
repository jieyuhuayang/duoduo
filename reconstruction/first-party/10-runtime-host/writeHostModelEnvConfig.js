// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: JSe, daemon.pretty.js:69130)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostModelEnvConfig(e, t = process.env) {
    let n = hostDotEnvPath(t),
        r = "";
    try {
        r = await Ns.readFile(n, "utf8")
    } catch {
        r = ""
    }
    let i = removeHostModelEnvLines(r),
        o = Bft(e);
    i.length > 0 && o.length > 0 && i[i.length - 1] !== "" && i.push(""), await writeHostDotEnvLines([...i, ...o], t)
}
