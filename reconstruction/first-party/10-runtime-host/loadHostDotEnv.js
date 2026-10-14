// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadHostDotEnv  (minified: Gft, daemon.pretty.js:69199)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadHostDotEnv(env = process.env) {
    let envPath = hostDotEnvPath(env),
        content;
    try {
        content = await Ns.readFile(envPath, "utf8")
    } catch {
        return 0
    }
    let dotEnv = parseDotEnv(content),
        appliedCount = 0;
    for (let [key, value] of Object.entries(dotEnv))(env[key] === void 0 || env[key] === "") && (env[key] = value, appliedCount++);
    return appliedCount
}
