// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: verifyClaudeCodeRuntimeAvailable  (minified: Qoe, daemon.pretty.js:48185)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function verifyClaudeCodeRuntimeAvailable() {
    if (y_(process.env.CLAUDE_CODE_EXECUTABLE)) return;
    let {
        platform: t,
        arch: n
    } = process, r = new Set(["darwin-arm64", "darwin-x64", "linux-x64", "linux-arm64", "win32-x64", "win32-arm64"]), i = `${t}-${n}`;
    if (!r.has(i)) throw new Error(`[agent-sdk] unsupported platform ${i}: @anthropic-ai/claude-agent-sdk only ships native binaries for darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64, win32-arm64. Set CLAUDE_CODE_EXECUTABLE to point at a compatible binary to bypass this check.`);
    let s = qoe(import.meta.url),
        o;
    try {
        let c = s.resolve("@anthropic-ai/claude-agent-sdk");
        o = qoe(c)
    } catch {
        throw new Error("[agent-sdk] @anthropic-ai/claude-agent-sdk is not installed. Reinstall duoduo (and ensure you did not pass --omit=optional or NPM_CONFIG_OPTIONAL=false).")
    }
    let a = [`@anthropic-ai/claude-agent-sdk-${t}-${n}`];
    t === "linux" && a.push(`@anthropic-ai/claude-agent-sdk-${t}-${n}-musl`);
    let u;
    for (let c of a) try {
        u = o.resolve(`${c}/claude`);
        break
    } catch {}
    if (!u) throw new Error(`[agent-sdk] native Claude Code binary for ${i} not found in node_modules. This usually means the install ran with --omit=optional or NPM_CONFIG_OPTIONAL=false. Reinstall without those flags, or manually install \`${a.join(" / ")}\`. Alternatively, set CLAUDE_CODE_EXECUTABLE to point at a compatible binary.`);
    try {
        if (!$We(u).isFile()) throw new Error(`[agent-sdk] platform binary at ${u} exists but is not a regular file`)
    } catch (c) {
        throw c instanceof Error && c.message.startsWith("[agent-sdk]") ? c : new Error(`[agent-sdk] platform binary at ${u} is not accessible: ${c.message}`)
    }
}
