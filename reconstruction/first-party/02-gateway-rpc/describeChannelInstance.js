// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeChannelInstance  (minified: txt, daemon.pretty.js:92906)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.3, v0.5.4, v0.7.1, v0.8.0, v0.8.4 (maps/history_daemon.json)
// locals: 20 renamed — 10 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): descriptors carry `runtime` (`claude`|`codex`) and spawn provenance; new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plugins.
// changelog v0.5.3 (medium): Setup cards only show runtime choices the daemon can actually run.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function describeChannelInstance(paths, actors, params) {
    let trimmed = params.channel_kind.trim(),
        trimmed2 = params.channel_id.trim(),
        sessionKey = params.session_key?.trim(),
        {
            isClaudeAvailable
        } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), yC)),
        {
            isCodexAvailable
        } = await Promise.resolve().then(() => (initCodexAppServerModule(), d6)),
        {
            isGrokAvailable
        } = await Promise.resolve().then(() => (initGrokAcpRuntimeModule(), g6)),
        runtimes = [];
    isClaudeAvailable() && runtimes.push("claude"), isCodexAvailable() && runtimes.push("codex"), isGrokAvailable() && runtimes.push("grok"), runtimes.push("pi");
    let availableRuntimes = runtimes,
        channelKindConfig = await loadChannelKindConfig(paths.channelConfigDir, trimmed),
        kindDefaults = {
            cwd: channelKindConfig?.new_session_workspace,
            runtime: channelKindConfig?.runtime
        },
        sessionExists = !1;
    if (sessionKey && sessionKey.length > 0) {
        let sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey);
        sessionExists = !!(sessionRuntimeState?.cwd?.trim() || sessionRuntimeState?.session_key || actors.get(sessionKey) !== void 0)
    }
    let layeredChannelRuntime = resolveLayeredChannelRuntime(null, channelKindConfig);
    if (!isValidChannelId(trimmed2)) {
        if (!layeredChannelRuntime.ok) throw new JsonRpcInvalidParamsError(layeredChannelRuntime.reason);
        return {
            configured: !1,
            session_exists: sessionExists,
            available_runtimes: availableRuntimes,
            kind_defaults: kindDefaults
        }
    }
    let channelDescriptor = await readChannelDescriptor(paths, trimmed2);
    if (!channelDescriptor) {
        if (!layeredChannelRuntime.ok) throw new JsonRpcInvalidParamsError(layeredChannelRuntime.reason);
        return {
            configured: !1,
            session_exists: sessionExists,
            available_runtimes: availableRuntimes,
            kind_defaults: kindDefaults
        }
    }
    let layeredChannelRuntime2 = resolveLayeredChannelRuntime(channelDescriptor, channelKindConfig);
    if (!layeredChannelRuntime2.ok) throw new JsonRpcInvalidParamsError(layeredChannelRuntime2.reason);
    let workspace = channelDescriptor.new_session_workspace ?? channelKindConfig?.new_session_workspace,
        cwd;
    return workspace && (cwd = await resolveExistingDirRealpath(workspace).catch(() => null) ?? uo.resolve(workspace)), {
        configured: !0,
        session_exists: sessionExists,
        descriptor: {
            cwd: cwd ?? uo.resolve(paths.workDir),
            runtime: layeredChannelRuntime2.runtime ?? resolveDefaultRuntime(),
            display_name: channelDescriptor.display_name,
            bound_by: channelDescriptor.bound_by,
            require_mention: channelDescriptor.require_mention
        },
        available_runtimes: availableRuntimes,
        kind_defaults: kindDefaults
    }
}
