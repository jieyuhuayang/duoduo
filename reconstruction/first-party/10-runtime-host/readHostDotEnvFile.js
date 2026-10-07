// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDotEnvFile  (minified: KSe, daemon.pretty.js:69189)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.3 (medium): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDotEnvFile(e = process.env) {
    let t = hostDotEnvPath(e);
    try {
        let n = await Ns.readFile(t, "utf8");
        return parseDotEnv(n)
    } catch {
        return {}
    }
}
