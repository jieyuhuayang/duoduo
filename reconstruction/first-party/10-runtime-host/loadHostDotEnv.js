// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadHostDotEnv  (minified: Wft, daemon.pretty.js:69198)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// changelog v0.4.3 (medium): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadHostDotEnv(e = process.env) {
    let t = hostDotEnvPath(e),
        n;
    try {
        n = await Ns.readFile(t, "utf8")
    } catch {
        return 0
    }
    let r = parseDotEnv(n),
        i = 0;
    for (let [o, s] of Object.entries(r))(e[o] === void 0 || e[o] === "") && (e[o] = s, i++);
    return i
}
