// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostModelEnvConfig  (minified: qxe, daemon.pretty.js:71213)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostModelEnvConfig(config, env = process.env) {
    let envPath = hostDotEnvPath(env),
        existingContent = "";
    try {
        existingContent = await Ds.readFile(envPath, "utf8")
    } catch {
        existingContent = ""
    }
    let keptLines = removeHostModelEnvLines(existingContent),
        newLines = Ugt(config);
    keptLines.length > 0 && newLines.length > 0 && keptLines[keptLines.length - 1] !== "" && keptLines.push(""), await writeHostDotEnvLines([...keptLines, ...newLines], env)
}
