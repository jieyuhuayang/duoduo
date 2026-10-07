// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeChannelInstance  (minified: tvt, daemon.pretty.js:90778)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function describeChannelInstance(e, t, n) {
    let r = n.channel_kind.trim(),
        i = n.channel_id.trim(),
        o = n.session_key?.trim(),
        {
            isClaudeAvailable: s
        } = await Promise.resolve().then(() => (initAgentSdkAdapterModule(), tC)),
        {
            isCodexAvailable: a
        } = await Promise.resolve().then(() => (initCodexAppServerModule(), $6)),
        {
            isGrokAvailable: u
        } = await Promise.resolve().then(() => (initGrokAcpRuntimeModule(), D6)),
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
        let b = await readSessionRuntimeState(e, o);
        p = !!(b?.cwd?.trim() || b?.session_key || t.get(o) !== void 0)
    }
    let m = resolveLayeredChannelRuntime(null, d);
    if (!isValidChannelId(i)) {
        if (!m.ok) throw new JsonRpcInvalidParamsError(m.reason);
        return {
            configured: !1,
            session_exists: p,
            available_runtimes: c,
            kind_defaults: f
        }
    }
    let h = await readChannelDescriptor(e, i);
    if (!h) {
        if (!m.ok) throw new JsonRpcInvalidParamsError(m.reason);
        return {
            configured: !1,
            session_exists: p,
            available_runtimes: c,
            kind_defaults: f
        }
    }
    let g = resolveLayeredChannelRuntime(h, d);
    if (!g.ok) throw new JsonRpcInvalidParamsError(g.reason);
    let y = h.new_session_workspace ?? d?.new_session_workspace,
        v;
    return y && (v = await resolveExistingDirRealpath(y).catch(() => null) ?? so.resolve(y)), {
        configured: !0,
        session_exists: p,
        descriptor: {
            cwd: v ?? so.resolve(e.workDir),
            runtime: g.runtime ?? resolveDefaultRuntime(),
            display_name: h.display_name,
            bound_by: h.bound_by,
            require_mention: h.require_mention
        },
        available_runtimes: c,
        kind_defaults: f
    }
}
