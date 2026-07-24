// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: writeHostClaudeCodeExecutableEnvConfig  (minified: xle, daemon.pretty.js:57180)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostClaudeCodeExecutableEnvConfig(e, t = process.env) {
    let n = e.trim();
    if (!n) return;
    let r = hostDotEnvPath(t),
        i = "";
    try {
        i = await Za.readFile(r, "utf8")
    } catch {
        i = ""
    }
    let s = jKe(i, [CLAUDE_CODE_EXECUTABLE_ENV_KEY]);
    s.length > 0 && s[s.length - 1] !== "" && s.push(""), await EU([...s, `${CLAUDE_CODE_EXECUTABLE_ENV_KEY}=${n}`], t), t.CLAUDE_CODE_EXECUTABLE = n
}
