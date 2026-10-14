// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveIngressWorkspace  (minified: _Ie, daemon.pretty.js:90756)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.0, v0.4.2, v0.5.0, v0.5.10, v0.6.0, v0.8.0 (maps/history_daemon.json)
// locals: 18 renamed — 7 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveIngressWorkspace(options) {
    let {
        paths,
        sessionKey,
        cwdAbs,
        channelKind,
        channelId
    } = options, sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey), plane = sessionRuntimeState?.plane ?? classifySessionPlaneByKey(sessionKey), permissionProfile = sessionRuntimeState?.permission_profile ?? ivt(plane), effectiveConfig = channelKind ? await resolveEffectiveChannelConfig(paths, {
        channel_kind: channelKind,
        channel_id: channelId
    }) : null, bindCwd = async cwd => {
        await patchSessionRuntimeState(paths, sessionKey, {
            session_key: sessionKey,
            cwd,
            plane,
            permission_profile: permissionProfile,
            created_at: sessionRuntimeState?.created_at ?? new Date().toISOString()
        }, {
            create: !0
        })
    };
    if (cwdAbs !== void 0) {
        logWarnMessage("[daemon] channel.ingress/channel.command cwd_abs is deprecated; prefer descriptor-driven new_session_workspace (channel.spawn)", {
            sessionKey,
            cwd_abs: cwdAbs,
            channelKind,
            channelId
        });
        let cwd = await resolveExistingDirRealpath(cwdAbs).catch(() => null);
        return cwd ? (await bindCwd(cwd), {
            ok: !0,
            cwd,
            effectiveConfig
        }) : {
            ok: !1,
            guidance: `Workspace unavailable: '${cwdAbs}'. Use an existing absolute directory path and retry.`
        }
    }
    if (effectiveConfig?.new_session_workspace) {
        let newSessionWorkspace = effectiveConfig.new_session_workspace,
            workspaceDir = await resolveExistingDirRealpath(newSessionWorkspace).catch(() => null) ?? void 0;
        if (workspaceDir || (workspaceDir = await ensureAbsoluteWorkspaceDir(newSessionWorkspace).catch(() => null) ?? void 0, workspaceDir && logInfoMessage(`[daemon] created missing new_session_workspace '${workspaceDir}' for kind '${channelKind}'`)), workspaceDir) return await bindCwd(workspaceDir), {
            ok: !0,
            cwd: workspaceDir,
            effectiveConfig
        };
        logWarnMessage(`[daemon] effective new_session_workspace '${newSessionWorkspace}' for kind '${channelKind}' does not exist, could not be created, or is not accessible; falling back to session state / ALADUO_WORK_DIR`)
    }
    let boundCwd = sessionRuntimeState?.cwd?.trim() || void 0;
    if (boundCwd) {
        let cwd = await resolveExistingDirRealpath(boundCwd).catch(() => null);
        return cwd ? {
            ok: !0,
            cwd,
            effectiveConfig
        } : {
            ok: !1,
            guidance: `Workspace unavailable: '${boundCwd}' (bound session path does not exist).`
        }
    }
    let workDir = await resolveExistingDirRealpath(paths.workDir).catch(() => null) ?? so.resolve(paths.workDir);
    return await bindCwd(workDir), {
        ok: !0,
        cwd: workDir,
        effectiveConfig
    }
}
