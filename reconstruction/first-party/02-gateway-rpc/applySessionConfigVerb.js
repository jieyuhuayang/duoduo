// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: applySessionConfigVerb  (minified: fxt, daemon.pretty.js:93535)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.1, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 36 renamed — 8 from the code at the binding (rule), 28 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (high): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function applySessionConfigVerb(paths, sessionIndex, params) {
    let verb = params.verb;
    if (verb === "profile_get" || verb === "profile_set" || verb === "profile_unset" || verb === "profile_alias_set" || verb === "profile_alias_unset") return gxt(paths, sessionIndex, params);
    let patch = {},
        changedKeys = [];
    if (verb === "set") {
        if (!params.set || Object.keys(params.set).length === 0) return {
            ok: !1,
            reason: "invalid",
            errors: ["set requires at least one key=value"]
        };
        let setResult = ISe(params.set);
        if (!setResult.ok) return {
            ok: !1,
            reason: "invalid",
            errors: setResult.errors
        };
        patch = setResult.patch, changedKeys = Object.keys(patch)
    } else if (verb === "unset") {
        if (!params.unset || params.unset.length === 0) return {
            ok: !1,
            reason: "invalid",
            errors: ["unset requires at least one key"]
        };
        let unsetResult = TSe(params.unset);
        if (!unsetResult.ok) return {
            ok: !1,
            reason: "invalid",
            errors: unsetResult.errors
        };
        for (let key of unsetResult.keys)
            for (let alias of listFrontmatterKeyAliases(key)) patch[alias] = null;
        changedKeys = unsetResult.keys
    }
    if (params.global) {
        let unsupportedKeys = changedKeys.filter(key => xS(key) === null);
        if (unsupportedKeys.length > 0) return {
            ok: !1,
            reason: "invalid",
            errors: unsupportedKeys.map(key => `--global does not support "${key}" (${Xr}.md holds model profiles and the <runtime>.model / <runtime>.effort defaults only)`)
        };
        if (verb !== "get") {
            let writeResult = await DSe(paths, patch);
            if (!writeResult.ok) return {
                ok: !1,
                reason: "write_failed",
                error: writeResult.error
            }
        }
        let globalRuntimeConfig = await loadGlobalRuntimeConfig(paths.channelConfigDir),
            globalConfig = pZ(null, null, globalRuntimeConfig),
            globalEventId = verb === "get" ? void 0 : await appendConfigChangedEvent(paths, {
                scope: "global",
                changed: changedKeys
            });
        return {
            ok: !0,
            verb,
            scope: "global",
            config: globalConfig,
            changed: changedKeys,
            event_id: globalEventId
        }
    }
    if (params.kind) {
        let channelKind = params.kind.trim().toLowerCase();
        if (verb !== "get") {
            let writeResult = await NSe(paths, channelKind, patch);
            if (!writeResult.ok) return {
                ok: !1,
                reason: "write_failed",
                error: writeResult.error
            }
        }
        let channelKindConfig = await loadChannelKindConfig(paths.channelConfigDir, channelKind),
            kindConfig = pZ(null, channelKindConfig),
            kindEventId = verb === "get" ? void 0 : await appendConfigChangedEvent(paths, {
                scope: "kind",
                kind: channelKind,
                changed: changedKeys
            });
        return {
            ok: !0,
            verb,
            scope: "kind",
            kind: channelKind,
            config: kindConfig,
            claude_tools: fPe(resolveLayeredChannelRuntime(null, channelKindConfig), channelKindConfig?.claudeTools, void 0),
            changed: changedKeys,
            event_id: kindEventId
        }
    }
    let trimmed = (params.target ?? "").trim(),
        sessionByKeyOrAlias = resolveSessionByKeyOrAlias(sessionIndex, trimmed);
    if (!sessionByKeyOrAlias.ok) return sessionByKeyOrAlias.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: trimmed,
        candidates: sessionByKeyOrAlias.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: trimmed
    };
    let sessionKey = sessionByKeyOrAlias.session_key,
        sessionKind = classifySessionKeyKind(sessionKey);
    if (sessionKind !== "channel") return {
        ok: !1,
        reason: "forbidden_kind",
        target: trimmed,
        session_key: sessionKey,
        kind: sessionKind
    };
    if (isSessionArchiving(sessionKey)) return {
        ok: !1,
        reason: "archiving",
        target: trimmed,
        session_key: sessionKey
    };
    let sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey),
        channelId = sessionRuntimeState?.source_channel_id;
    if (verb !== "get") {
        if (!channelId) return {
            ok: !1,
            reason: "write_failed",
            error: `session "${sessionKey}" has no source_channel_id (no instance descriptor to write)`
        };
        if (verb === "set" && typeof patch.runtime == "string") {
            let conflict = await checkChannelRuntimeRebindConflict(paths, sessionIndex, channelId, patch.runtime);
            if (conflict) return {
                ok: !1,
                reason: "invalid",
                errors: [conflict]
            }
        }
        let writeResult = await OSe(paths, channelId, patch);
        if (!writeResult.ok) return {
            ok: !1,
            reason: "write_failed",
            error: writeResult.error
        }
    }
    let channelDescriptor = channelId ? await readChannelDescriptor(paths, channelId) : null,
        instanceKindConfig = channelDescriptor?.channel_kind ? await loadChannelKindConfig(paths.channelConfigDir, channelDescriptor.channel_kind) : null,
        globalRuntimeConfig = await loadGlobalRuntimeConfig(paths.channelConfigDir),
        effectiveConfig = pZ(channelDescriptor, instanceKindConfig, globalRuntimeConfig),
        compactStats = dxt(sessionRuntimeState?.compact_stats, sessionRuntimeState?.last_compact_at),
        eventId = verb === "get" ? void 0 : await appendConfigChangedEvent(paths, {
            scope: "instance",
            sessionKey,
            channelId,
            changed: changedKeys
        });
    return {
        ok: !0,
        verb,
        scope: "instance",
        session_key: sessionKey,
        display_name: sessionByKeyOrAlias.display_name ?? null,
        config: effectiveConfig,
        claude_tools: fPe(resolveLayeredChannelRuntime(channelDescriptor, instanceKindConfig), instanceKindConfig?.claudeTools, channelDescriptor?.claudeTools),
        stats: compactStats,
        changed: changedKeys,
        event_id: eventId
    }
}
