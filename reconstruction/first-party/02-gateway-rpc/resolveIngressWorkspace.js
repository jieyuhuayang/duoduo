// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveIngressWorkspace  (minified: hIe, daemon.pretty.js:90710)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveIngressWorkspace(e) {
    let {
        paths: t,
        sessionKey: n,
        cwdAbs: r,
        channelKind: i,
        channelId: o
    } = e, s = await rt(t, n), a = s?.plane ?? classifySessionPlaneByKey(n), u = s?.permission_profile ?? evt(a), l = i ? await ru(t, {
        channel_kind: i,
        channel_id: o
    }) : null, c = async p => {
        await patchSessionRuntimeState(t, n, {
            session_key: n,
            cwd: p,
            plane: a,
            permission_profile: u,
            created_at: s?.created_at ?? new Date().toISOString()
        }, {
            create: !0
        })
    };
    if (r !== void 0) {
        Z("[daemon] channel.ingress/channel.command cwd_abs is deprecated; prefer descriptor-driven new_session_workspace (channel.spawn)", {
            sessionKey: n,
            cwd_abs: r,
            channelKind: i,
            channelId: o
        });
        let p = await dp(r).catch(() => null);
        return p ? (await c(p), {
            ok: !0,
            cwd: p,
            effectiveConfig: l
        }) : {
            ok: !1,
            guidance: `Workspace unavailable: '${r}'. Use an existing absolute directory path and retry.`
        }
    }
    if (l?.new_session_workspace) {
        let p = l.new_session_workspace,
            m = await dp(p).catch(() => null) ?? void 0;
        if (m || (m = await SIe(p).catch(() => null) ?? void 0, m && ee(`[daemon] created missing new_session_workspace '${m}' for kind '${i}'`)), m) return await c(m), {
            ok: !0,
            cwd: m,
            effectiveConfig: l
        };
        Z(`[daemon] effective new_session_workspace '${p}' for kind '${i}' does not exist, could not be created, or is not accessible; falling back to session state / ALADUO_WORK_DIR`)
    }
    let d = s?.cwd?.trim() || void 0;
    if (d) {
        let p = await dp(d).catch(() => null);
        return p ? {
            ok: !0,
            cwd: p,
            effectiveConfig: l
        } : {
            ok: !1,
            guidance: `Workspace unavailable: '${d}' (bound session path does not exist).`
        }
    }
    let f = await dp(t.workDir).catch(() => null) ?? so.resolve(t.workDir);
    return await c(f), {
        ok: !0,
        cwd: f,
        effectiveConfig: l
    }
}
