// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: writeHostClaudeCodeExecutableEnvConfig  (minified: Owe, daemon.pretty.js:68851)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostClaudeCodeExecutableEnvConfig(e, t = process.env) {
    let n = e.trim();
    if (!n) return;
    let r = hostDotEnvPath(t),
        i = "";
    try {
        i = await Cs.readFile(r, "utf8")
    } catch {
        i = ""
    }
    let o = Pwe(i, [CLAUDE_CODE_EXECUTABLE_ENV_KEY]);
    o.length > 0 && o[o.length - 1] !== "" && o.push(""), await fO([...o, `${CLAUDE_CODE_EXECUTABLE_ENV_KEY}=${n}`], t), t.CLAUDE_CODE_EXECUTABLE = n
}
