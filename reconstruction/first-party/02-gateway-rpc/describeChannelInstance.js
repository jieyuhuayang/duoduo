// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeChannelInstance  (minified: _yt, daemon.pretty.js:89363)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function describeChannelInstance(e, t, n) {
    let r = n.channel_kind.trim(),
        i = n.channel_id.trim(),
        o = n.session_key?.trim(),
        {
            isClaudeAvailable: s
        } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), bC)),
        {
            isCodexAvailable: a
        } = await Promise.resolve().then(() => (initCodexAppServerModule(), TV)),
        {
            isGrokAvailable: u
        } = await Promise.resolve().then(() => (initGrokAcpRuntimeModule(), AV)),
        l = [];
    s() && l.push("claude"), a() && l.push("codex"), u() && l.push("grok"), l.push("pi");
    let c = l,
        d = await loadChannelKindConfig(e.channelConfigDir, r),
        f = {
            cwd: d?.new_session_workspace,
            runtime: d?.runtime
        },
        p = !1;
    if (o && o.length > 0) {
        let y = await ct(e, o);
        p = !!(y?.cwd?.trim() || y?.session_key || t.get(o) !== void 0)
    }
    if (!zm(i)) return {
        configured: !1,
        session_exists: p,
        available_runtimes: c,
        kind_defaults: f
    };
    let m = await ho(e, i);
    if (!m) return {
        configured: !1,
        session_exists: p,
        available_runtimes: c,
        kind_defaults: f
    };
    let h = m.new_session_workspace ?? d?.new_session_workspace,
        g;
    return h && (g = await Gf(h).catch(() => null) ?? oo.resolve(h)), {
        configured: !0,
        session_exists: p,
        descriptor: {
            cwd: g ?? oo.resolve(e.workDir),
            runtime: yyt(m.runtime ?? d?.runtime),
            display_name: m.display_name,
            bound_by: m.bound_by,
            require_mention: m.require_mention
        },
        available_runtimes: c,
        kind_defaults: f
    }
}
