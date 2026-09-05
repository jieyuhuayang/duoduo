// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: writeHostClaudeCodeExecutableEnvConfig  (minified: Nge, daemon.pretty.js:62407)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostClaudeCodeExecutableEnvConfig(e, t = process.env) {
    let n = e.trim();
    if (!n) return;
    let r = hostDotEnvPath(t),
        i = "";
    try {
        i = await rs.readFile(r, "utf8")
    } catch {
        i = ""
    }
    let o = Oge(i, [CLAUDE_CODE_EXECUTABLE_ENV_KEY]);
    o.length > 0 && o[o.length - 1] !== "" && o.push(""), await jP([...o, `${CLAUDE_CODE_EXECUTABLE_ENV_KEY}=${n}`], t), t.CLAUDE_CODE_EXECUTABLE = n
}
