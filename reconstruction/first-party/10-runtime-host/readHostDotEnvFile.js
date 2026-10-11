// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDotEnvFile  (minified: KSe, daemon.pretty.js:69189)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDotEnvFile(env = process.env) {
    let envPath = hostDotEnvPath(env);
    try {
        let content = await Ns.readFile(envPath, "utf8");
        return parseDotEnv(content)
    } catch {
        return {}
    }
}
