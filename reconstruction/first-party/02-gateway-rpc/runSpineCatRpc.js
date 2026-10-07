// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: runSpineCatRpc  (minified: xke, daemon.pretty.js:90393)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (high): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runSpineCatRpc(e, t) {
    let n = describeSpineCatProblem(t);
    if (n !== null) throw new SpineRpcParamsError(renderParamsProblem("spine.cat", n));
    let r = t,
        i = {
            stdout: "",
            stderr: ""
        };
    try {
        let o = pke(hke(r)),
            s = r.redact === "external" ? await listVoidChannelSessions(e) : null;
        await mke(e, o, new Date, i, {
            overRpc: !0,
            ...s !== null ? {
                redact: a => redactSpineEventForExternal(a, s)
            } : {}
        })
    } catch (o) {
        throw o instanceof xS && o.isUsage ? new SpineRpcParamsError(o.message) : o
    }
    return {
        text: i.stdout
    }
}
