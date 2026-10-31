// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: verifyClaudeCodeRuntimeAvailable  (minified: g_e, daemon.pretty.js:56607)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 3 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): Installs that pass `npm install --omit=optional` or set `NPM_CONFIG_OPTIONAL=false` complete, but the daemon refuses to start at boot with an actionable error naming the missing platform package. Reinstall without those flags, or set `CLAUDE_CODE_EXECUTABLE`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function verifyClaudeCodeRuntimeAvailable() {
    if (normalizeOptionalEnvString(process.env.CLAUDE_CODE_EXECUTABLE)) return;
    let {
        platform,
        arch
    } = process, supportedPlatforms = new Set(["darwin-arm64", "darwin-x64", "linux-x64", "linux-arm64", "win32-x64", "win32-arm64"]), platformKey = `${platform}-${arch}`;
    if (!supportedPlatforms.has(platformKey)) throw new Error(`[agent-sdk] unsupported platform ${platformKey}: @anthropic-ai/claude-agent-sdk only ships native binaries for darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64, win32-arm64. Set CLAUDE_CODE_EXECUTABLE to point at a compatible binary to bypass this check.`);
    let localRequire = a_e(import.meta.url),
        sdkRequire;
    try {
        let sdkEntryPath = localRequire.resolve("@anthropic-ai/claude-agent-sdk");
        sdkRequire = a_e(sdkEntryPath)
    } catch {
        throw new Error("[agent-sdk] @anthropic-ai/claude-agent-sdk is not installed. Reinstall duoduo (and ensure you did not pass --omit=optional or NPM_CONFIG_OPTIONAL=false).")
    }
    let binaryPackages = [`@anthropic-ai/claude-agent-sdk-${platform}-${arch}`];
    platform === "linux" && binaryPackages.push(`@anthropic-ai/claude-agent-sdk-${platform}-${arch}-musl`);
    let binaryPath;
    for (let packageName of binaryPackages) try {
        binaryPath = sdkRequire.resolve(`${packageName}/claude`);
        break
    } catch {}
    if (!binaryPath) throw new Error(`[agent-sdk] native Claude Code binary for ${platformKey} not found in node_modules. This usually means the install ran with --omit=optional or NPM_CONFIG_OPTIONAL=false. Reinstall without those flags, or manually install \`${binaryPackages.join(" / ")}\`. Alternatively, set CLAUDE_CODE_EXECUTABLE to point at a compatible binary.`);
    try {
        if (!$at(binaryPath).isFile()) throw new Error(`[agent-sdk] platform binary at ${binaryPath} exists but is not a regular file`)
    } catch (err) {
        throw err instanceof Error && err.message.startsWith("[agent-sdk]") ? err : new Error(`[agent-sdk] platform binary at ${binaryPath} is not accessible: ${err.message}`)
    }
}
