// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: upsertChannelSpawnDescriptor  (minified: yvt, daemon.pretty.js:91873)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.7.0, v0.8.3, v0.8.4 (maps/history_daemon.json)
// changelog v0.5.0 (high): descriptors carry `runtime` (`claude`|`codex`) and spawn provenance; new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plugins. Enables per-instance runtime selection without restart.
// changelog v0.8.4 (high): `channel.spawn` never moves a session to another channel. Naming a session that another channel owns is refused before anything is written.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function upsertChannelSpawnDescriptor(e, t, n) {
    let r = n.channel_kind.trim().toLowerCase(),
        i = n.channel_id.trim();
    if (!isValidChannelId(i)) return {
        ok: !1,
        reason: `Invalid channel_id "${i}". Must match [A-Za-z0-9_-]{1,128}.`
    };
    if (r.toLowerCase() === Yr) return {
        ok: !1,
        reason: `"${Yr}" is a reserved name for the global config file (kernel/config/${Yr}.md), not a channel kind. Pick a different channel_kind.`
    };
    let o = n.session_key?.trim();
    if (o !== void 0 && classifySessionKeyKind(o) !== "channel") return {
        ok: !1,
        reason: `session_key "${o}" is a ${classifySessionKeyKind(o)} session key; channel.spawn creates channel sessions only.`
    };
    if (o !== void 0) {
        let m = (await readSessionRuntimeState(e, o))?.source_channel_id;
        if (m !== void 0 && m !== i) return {
            ok: !1,
            reason: `session_key "${o}" belongs to channel "${m}", not "${i}"; channel.spawn does not move a session to another channel.`
        }
    }
    let s = await readChannelDescriptor(e, i);
    if (n.runtime === void 0 && s?.runtimeRefusal) return {
        ok: !1,
        reason: `${s.runtimeRefusal} Send a runtime to replace it.`
    };
    let a = n.runtime ?? s?.runtime;
    if (!a) return {
        ok: !1,
        reason: "runtime is required on first-time channel.spawn (no prior descriptor to inherit from)."
    };
    if (!gIe.includes(a)) return {
        ok: !1,
        reason: `Unsupported runtime "${a}". Must be one of: ${gIe.join(", ")}.`
    };
    if (s && a !== s.runtime) {
        let m = await checkChannelRuntimeRebindConflict(e, t, i, a);
        if (m) return {
            ok: !1,
            reason: m
        }
    }
    let u = n.cwd_abs ?? s?.new_session_workspace;
    if (!u) return {
        ok: !1,
        reason: "cwd_abs is required on first-time channel.spawn (no prior descriptor to inherit from)."
    };
    if (!so.isAbsolute(u)) return {
        ok: !1,
        reason: `cwd_abs must be an absolute path (got "${u}").`
    };
    let l = await resolveExistingDirRealpath(u).catch(() => null) ?? void 0;
    if (l || (l = await ensureAbsoluteWorkspaceDir(u).catch(() => null) ?? void 0), !l) return {
        ok: !1,
        reason: `cwd_abs "${u}" does not exist and could not be created.`
    };
    let c = n.require_mention !== void 0 ? n.require_mention : s?.require_mention,
        d = n.display_name ?? s?.display_name,
        f = n.bound_by?.trim() || s?.bound_by,
        p = new Date().toISOString();
    try {
        await xce(e, {
            channel_id: i,
            channel_kind: r,
            display_name: d,
            new_session_workspace: l,
            runtime: a,
            bound_by: f,
            bound_at: p,
            require_mention: c
        })
    } catch (m) {
        return {
            ok: !1,
            reason: `Failed to write descriptor: ${m instanceof Error?m.message:String(m)}`
        }
    }
    if (o !== void 0) try {
        await ensureSessionDescriptorAndStateFiles(e, {
            session_key: o,
            display_name: d,
            kind: "channel"
        });
        let m = await readSessionRuntimeState(e, o);
        await patchSessionRuntimeState(e, o, {
            session_key: o,
            cwd: m?.cwd ?? l,
            source_channel_id: i,
            created_at: m?.created_at ?? new Date().toISOString()
        }, {
            create: !0
        }), await refreshSessionIndexEntry(e, t, o)
    } catch (m) {
        let h = m instanceof Error ? m.message : String(m);
        return {
            ok: !1,
            reason: `Failed to create session ${o}: ${h}`
        }
    }
    return {
        ok: !0
    }
}
