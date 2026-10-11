// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDaemonToken  (minified: Hft, daemon.pretty.js:69178)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (high): If you genuinely need to reach a daemon from another machine, `duoduo daemon token new` generates a bearer token and stores it with owner-only permissions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDaemonToken(token, env = process.env) {
    let envPath = hostDotEnvPath(env),
        existingContent = "";
    try {
        existingContent = await Ns.readFile(envPath, "utf8")
    } catch {
        existingContent = ""
    }
    let keptLines = removeDotEnvKeyLines(existingContent, [DAEMON_TOKEN_ENV_KEY]);
    return keptLines.length > 0 && keptLines[keptLines.length - 1] !== "" && keptLines.push(""), await writeHostDotEnvLines([...keptLines, `${DAEMON_TOKEN_ENV_KEY}=${token}`], env), envPath
}
