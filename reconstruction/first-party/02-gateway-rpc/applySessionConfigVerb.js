// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: applySessionConfigVerb  (minified: Tyt, daemon.pretty.js:89879)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function applySessionConfigVerb(e, t, n) {
    let r = n.verb;
    if (r === "profile_get" || r === "profile_set" || r === "profile_unset" || r === "profile_alias_set" || r === "profile_alias_unset") return Oyt(e, t, n);
    let i = {},
        o = [];
    if (r === "set") {
        if (!n.set || Object.keys(n.set).length === 0) return {
            ok: !1,
            reason: "invalid",
            errors: ["set requires at least one key=value"]
        };
        let v = mbe(n.set);
        if (!v.ok) return {
            ok: !1,
            reason: "invalid",
            errors: v.errors
        };
        i = v.patch, o = Object.keys(i)
    } else if (r === "unset") {
        if (!n.unset || n.unset.length === 0) return {
            ok: !1,
            reason: "invalid",
            errors: ["unset requires at least one key"]
        };
        let v = hbe(n.unset);
        if (!v.ok) return {
            ok: !1,
            reason: "invalid",
            errors: v.errors
        };
        for (let b of v.keys)
            for (let _ of Mm(b)) i[_] = null;
        o = v.keys
    }
    if (n.global) {
        let v = o.filter(E => zw(E) === null);
        if (v.length > 0) return {
            ok: !1,
            reason: "invalid",
            errors: v.map(E => `--global does not support "${E}" (${Jr}.md holds model profiles and the <runtime>.model / <runtime>.effort defaults only)`)
        };
        if (r !== "get") {
            let E = await Sbe(e, i);
            if (!E.ok) return {
                ok: !1,
                reason: "write_failed",
                error: E.error
            }
        }
        let b = await si(e.channelConfigDir),
            _ = vJ(null, null, b),
            I = r === "get" ? void 0 : await appendConfigChangedEvent(e, {
                scope: "global",
                changed: o
            });
        return {
            ok: !0,
            verb: r,
            scope: "global",
            config: _,
            changed: o,
            event_id: I
        }
    }
    if (n.kind) {
        let v = n.kind.trim().toLowerCase();
        if (r !== "get") {
            let E = await wbe(e, v, i);
            if (!E.ok) return {
                ok: !1,
                reason: "write_failed",
                error: E.error
            }
        }
        let b = await loadChannelKindConfig(e.channelConfigDir, v),
            _ = vJ(null, b),
            I = r === "get" ? void 0 : await appendConfigChangedEvent(e, {
                scope: "kind",
                kind: v,
                changed: o
            });
        return {
            ok: !0,
            verb: r,
            scope: "kind",
            kind: v,
            config: _,
            claude_tools: R0e(b?.runtime, b?.claudeTools, void 0),
            changed: o,
            event_id: I
        }
    }
    let s = (n.target ?? "").trim(),
        a = resolveSessionByKeyOrAlias(t, s);
    if (!a.ok) return a.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: s,
        candidates: a.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: s
    };
    let u = a.session_key,
        l = classifySessionKeyKind(u);
    if (l !== "channel") return {
        ok: !1,
        reason: "forbidden_kind",
        target: s,
        session_key: u,
        kind: l
    };
    if (isSessionArchiving(u)) return {
        ok: !1,
        reason: "archiving",
        target: s,
        session_key: u
    };
    let c = await ct(e, u),
        d = c?.source_channel_id;
    if (r !== "get") {
        if (!d) return {
            ok: !1,
            reason: "write_failed",
            error: `session "${u}" has no source_channel_id (no instance descriptor to write)`
        };
        if (r === "set" && typeof i.runtime == "string") {
            let b = await checkChannelRuntimeRebindConflict(e, t, d, i.runtime);
            if (b) return {
                ok: !1,
                reason: "invalid",
                errors: [b]
            }
        }
        let v = await bbe(e, d, i);
        if (!v.ok) return {
            ok: !1,
            reason: "write_failed",
            error: v.error
        }
    }
    let f = d ? await ho(e, d) : null,
        p = f?.channel_kind ? await loadChannelKindConfig(e.channelConfigDir, f.channel_kind) : null,
        m = await si(e.channelConfigDir),
        h = vJ(f, p, m),
        g = Iyt(c?.compact_stats, c?.last_compact_at),
        y = r === "get" ? void 0 : await appendConfigChangedEvent(e, {
            scope: "instance",
            sessionKey: u,
            channelId: d,
            changed: o
        });
    return {
        ok: !0,
        verb: r,
        scope: "instance",
        session_key: u,
        display_name: a.display_name ?? null,
        config: h,
        claude_tools: R0e(f?.runtime ?? p?.runtime, p?.claudeTools, f?.claudeTools),
        stats: g,
        changed: o,
        event_id: y
    }
}
