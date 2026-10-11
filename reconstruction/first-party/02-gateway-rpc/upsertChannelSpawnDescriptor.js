// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: upsertChannelSpawnDescriptor  (minified: yvt, daemon.pretty.js:91873)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.7.0, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 20 renamed — 5 from the code at the binding (rule), 15 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): descriptors carry `runtime` (`claude`|`codex`) and spawn provenance; new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plugins. Enables per-instance runtime selection without restart.
// changelog v0.8.4 (high): `channel.spawn` never moves a session to another channel. Naming a session that another channel owns is refused before anything is written.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function upsertChannelSpawnDescriptor(paths, sessionIndex, params) {
    let channelKind = params.channel_kind.trim().toLowerCase(),
        trimmed = params.channel_id.trim();
    if (!isValidChannelId(trimmed)) return {
        ok: !1,
        reason: `Invalid channel_id "${trimmed}". Must match [A-Za-z0-9_-]{1,128}.`
    };
    if (channelKind.toLowerCase() === Yr) return {
        ok: !1,
        reason: `"${Yr}" is a reserved name for the global config file (kernel/config/${Yr}.md), not a channel kind. Pick a different channel_kind.`
    };
    let sessionKey = params.session_key?.trim();
    if (sessionKey !== void 0 && classifySessionKeyKind(sessionKey) !== "channel") return {
        ok: !1,
        reason: `session_key "${sessionKey}" is a ${classifySessionKeyKind(sessionKey)} session key; channel.spawn creates channel sessions only.`
    };
    if (sessionKey !== void 0) {
        let existingChannelId = (await readSessionRuntimeState(paths, sessionKey))?.source_channel_id;
        if (existingChannelId !== void 0 && existingChannelId !== trimmed) return {
            ok: !1,
            reason: `session_key "${sessionKey}" belongs to channel "${existingChannelId}", not "${trimmed}"; channel.spawn does not move a session to another channel.`
        }
    }
    let channelDescriptor = await readChannelDescriptor(paths, trimmed);
    if (params.runtime === void 0 && channelDescriptor?.runtimeRefusal) return {
        ok: !1,
        reason: `${channelDescriptor.runtimeRefusal} Send a runtime to replace it.`
    };
    let runtime = params.runtime ?? channelDescriptor?.runtime;
    if (!runtime) return {
        ok: !1,
        reason: "runtime is required on first-time channel.spawn (no prior descriptor to inherit from)."
    };
    if (!gIe.includes(runtime)) return {
        ok: !1,
        reason: `Unsupported runtime "${runtime}". Must be one of: ${gIe.join(", ")}.`
    };
    if (channelDescriptor && runtime !== channelDescriptor.runtime) {
        let conflict = await checkChannelRuntimeRebindConflict(paths, sessionIndex, trimmed, runtime);
        if (conflict) return {
            ok: !1,
            reason: conflict
        }
    }
    let cwd = params.cwd_abs ?? channelDescriptor?.new_session_workspace;
    if (!cwd) return {
        ok: !1,
        reason: "cwd_abs is required on first-time channel.spawn (no prior descriptor to inherit from)."
    };
    if (!so.isAbsolute(cwd)) return {
        ok: !1,
        reason: `cwd_abs must be an absolute path (got "${cwd}").`
    };
    let workspaceDir = await resolveExistingDirRealpath(cwd).catch(() => null) ?? void 0;
    if (workspaceDir || (workspaceDir = await ensureAbsoluteWorkspaceDir(cwd).catch(() => null) ?? void 0), !workspaceDir) return {
        ok: !1,
        reason: `cwd_abs "${cwd}" does not exist and could not be created.`
    };
    let requireMention = params.require_mention !== void 0 ? params.require_mention : channelDescriptor?.require_mention,
        displayName = params.display_name ?? channelDescriptor?.display_name,
        boundBy = params.bound_by?.trim() || channelDescriptor?.bound_by,
        boundAt = new Date().toISOString();
    try {
        await xce(paths, {
            channel_id: trimmed,
            channel_kind: channelKind,
            display_name: displayName,
            new_session_workspace: workspaceDir,
            runtime,
            bound_by: boundBy,
            bound_at: boundAt,
            require_mention: requireMention
        })
    } catch (err) {
        return {
            ok: !1,
            reason: `Failed to write descriptor: ${err instanceof Error?err.message:String(err)}`
        }
    }
    if (sessionKey !== void 0) try {
        await ensureSessionDescriptorAndStateFiles(paths, {
            session_key: sessionKey,
            display_name: displayName,
            kind: "channel"
        });
        let sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey);
        await patchSessionRuntimeState(paths, sessionKey, {
            session_key: sessionKey,
            cwd: sessionRuntimeState?.cwd ?? workspaceDir,
            source_channel_id: trimmed,
            created_at: sessionRuntimeState?.created_at ?? new Date().toISOString()
        }, {
            create: !0
        }), await refreshSessionIndexEntry(paths, sessionIndex, sessionKey)
    } catch (err) {
        let message = err instanceof Error ? err.message : String(err);
        return {
            ok: !1,
            reason: `Failed to create session ${sessionKey}: ${message}`
        }
    }
    return {
        ok: !0
    }
}
