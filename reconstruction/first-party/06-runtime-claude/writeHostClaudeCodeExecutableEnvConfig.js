// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: writeHostClaudeCodeExecutableEnvConfig  (minified: Hpe, daemon.pretty.js:58615)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostClaudeCodeExecutableEnvConfig(e, t = process.env) {
    let n = e.trim();
    if (!n) return;
    let r = hostDotEnvPath(t),
        i = "";
    try {
        i = await ns.readFile(r, "utf8")
    } catch {
        i = ""
    }
    let o = Upe(i, [CLAUDE_CODE_EXECUTABLE_ENV_KEY]);
    o.length > 0 && o[o.length - 1] !== "" && o.push(""), await LI([...o, `${CLAUDE_CODE_EXECUTABLE_ENV_KEY}=${n}`], t), t.CLAUDE_CODE_EXECUTABLE = n
}
