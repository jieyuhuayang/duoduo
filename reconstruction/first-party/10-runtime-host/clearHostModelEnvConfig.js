// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvConfig  (minified: pxe, daemon.pretty.js:70354)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearHostModelEnvConfig(env = process.env) {
    let envPath = hostDotEnvPath(env),
        existingContent = "";
    try {
        existingContent = await Fs.readFile(envPath, "utf8")
    } catch {
        existingContent = ""
    }
    let keptLines = removeHostModelEnvLines(existingContent);
    await writeHostDotEnvLines(keptLines, env)
}
