// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: upsertChannelSpawnDescriptor  (minified: Ayt, daemon.pretty.js:90345)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function upsertChannelSpawnDescriptor(e, t, n) {
    let r = n.channel_kind.trim().toLowerCase(),
        i = n.channel_id.trim();
    if (!zm(i)) return {
        ok: !1,
        reason: `Invalid channel_id "${i}". Must match [A-Za-z0-9_-]{1,128}.`
    };
    if (r.toLowerCase() === Jr) return {
        ok: !1,
        reason: `"${Jr}" is a reserved name for the global config file (kernel/config/${Jr}.md), not a channel kind. Pick a different channel_kind.`
    };
    let o = await ho(e, i),
        s = n.runtime ?? o?.runtime;
    if (!s) return {
        ok: !1,
        reason: "runtime is required on first-time channel.spawn (no prior descriptor to inherit from)."
    };
    if (!E0e.includes(s)) return {
        ok: !1,
        reason: `Unsupported runtime "${s}". Must be one of: ${E0e.join(", ")}.`
    };
    if (o && s !== o.runtime) {
        let p = await N0e(e, t, i, s);
        if (p) return {
            ok: !1,
            reason: p
        }
    }
    let a = n.cwd_abs ?? o?.new_session_workspace;
    if (!a) return {
        ok: !1,
        reason: "cwd_abs is required on first-time channel.spawn (no prior descriptor to inherit from)."
    };
    if (!oo.isAbsolute(a)) return {
        ok: !1,
        reason: `cwd_abs must be an absolute path (got "${a}").`
    };
    let u = await Gf(a).catch(() => null) ?? void 0;
    if (u || (u = await $0e(a).catch(() => null) ?? void 0), !u) return {
        ok: !1,
        reason: `cwd_abs "${a}" does not exist and could not be created.`
    };
    let l = n.require_mention !== void 0 ? n.require_mention : o?.require_mention,
        c = n.display_name ?? o?.display_name,
        d = n.bound_by?.trim() || o?.bound_by,
        f = new Date().toISOString();
    try {
        await ule(e, {
            channel_id: i,
            channel_kind: r,
            display_name: c,
            new_session_workspace: u,
            runtime: s,
            bound_by: d,
            bound_at: f,
            require_mention: l
        })
    } catch (p) {
        return {
            ok: !1,
            reason: `Failed to write descriptor: ${p instanceof Error?p.message:String(p)}`
        }
    }
    return {
        ok: !0
    }
}
