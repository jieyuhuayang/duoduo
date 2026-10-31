// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDaemonToken  (minified: cht, daemon.pretty.js:70365)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): The remote listener starts only when a host, a port and a token are all present, and every request must carry the token.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDaemonToken(env = process.env) {
    let envPath = hostDotEnvPath(env),
        content;
    try {
        content = await Fs.readFile(envPath, "utf8")
    } catch (err) {
        if (err.code === "ENOENT") return;
        throw err
    }
    let token = parseDotEnv(content)[DAEMON_TOKEN_ENV_KEY]?.trim();
    return token || void 0
}
