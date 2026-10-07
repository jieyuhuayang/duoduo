// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: applySessionConfigVerb  (minified: fvt, daemon.pretty.js:91407)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function applySessionConfigVerb(e, t, n) {
    let r = n.verb;
    if (r === "profile_get" || r === "profile_set" || r === "profile_unset" || r === "profile_alias_set" || r === "profile_alias_unset") return gvt(e, t, n);
    let i = {},
        o = [];
    if (r === "set") {
        if (!n.set || Object.keys(n.set).length === 0) return {
            ok: !1,
            reason: "invalid",
            errors: ["set requires at least one key=value"]
        };
        let v = Ove(n.set);
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
        let v = Ave(n.unset);
        if (!v.ok) return {
            ok: !1,
            reason: "invalid",
            errors: v.errors
        };
        for (let b of v.keys)
            for (let _ of eh(b)) i[_] = null;
        o = v.keys
    }
    if (n.global) {
        let v = o.filter(R => fS(R) === null);
        if (v.length > 0) return {
            ok: !1,
            reason: "invalid",
            errors: v.map(R => `--global does not support "${R}" (${Yr}.md holds model profiles and the <runtime>.model / <runtime>.effort defaults only)`)
        };
        if (r !== "get") {
            let R = await zve(e, i);
            if (!R.ok) return {
                ok: !1,
                reason: "write_failed",
                error: R.error
            }
        }
        let b = await li(e.channelConfigDir),
            _ = OG(null, null, b),
            E = r === "get" ? void 0 : await appendConfigChangedEvent(e, {
                scope: "global",
                changed: o
            });
        return {
            ok: !0,
            verb: r,
            scope: "global",
            config: _,
            changed: o,
            event_id: E
        }
    }
    if (n.kind) {
        let v = n.kind.trim().toLowerCase();
        if (r !== "get") {
            let R = await Fve(e, v, i);
            if (!R.ok) return {
                ok: !1,
                reason: "write_failed",
                error: R.error
            }
        }
        let b = await loadChannelKindConfig(e.channelConfigDir, v),
            _ = OG(null, b),
            E = r === "get" ? void 0 : await appendConfigChangedEvent(e, {
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
            claude_tools: yIe(resolveLayeredChannelRuntime(null, b), b?.claudeTools, void 0),
            changed: o,
            event_id: E
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
    let c = await rt(e, u),
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
        let v = await jve(e, d, i);
        if (!v.ok) return {
            ok: !1,
            reason: "write_failed",
            error: v.error
        }
    }
    let f = d ? await vs(e, d) : null,
        p = f?.channel_kind ? await loadChannelKindConfig(e.channelConfigDir, f.channel_kind) : null,
        m = await li(e.channelConfigDir),
        h = OG(f, p, m),
        g = dvt(c?.compact_stats, c?.last_compact_at),
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
        claude_tools: yIe(resolveLayeredChannelRuntime(f, p), p?.claudeTools, f?.claudeTools),
        stats: g,
        changed: o,
        event_id: y
    }
}
