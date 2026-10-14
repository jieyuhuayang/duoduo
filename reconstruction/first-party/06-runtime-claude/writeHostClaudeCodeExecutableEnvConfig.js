// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: writeHostClaudeCodeExecutableEnvConfig  (minified: YSe, daemon.pretty.js:69143)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (high): When `duoduo onboard` runs with `CLAUDE_CODE_EXECUTABLE` set in the environment … the override is now persisted into the host `.env` so the daemon picks it up on subsequent restarts.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostClaudeCodeExecutableEnvConfig(executablePath, env = process.env) {
    let trimmed = executablePath.trim();
    if (!trimmed) return;
    let dotEnvPath = hostDotEnvPath(env),
        content = "";
    try {
        content = await Ns.readFile(dotEnvPath, "utf8")
    } catch {
        content = ""
    }
    let lines = removeDotEnvKeyLines(content, [CLAUDE_CODE_EXECUTABLE_ENV_KEY]);
    lines.length > 0 && lines[lines.length - 1] !== "" && lines.push(""), await writeHostDotEnvLines([...lines, `${CLAUDE_CODE_EXECUTABLE_ENV_KEY}=${trimmed}`], env), env.CLAUDE_CODE_EXECUTABLE = trimmed
}
