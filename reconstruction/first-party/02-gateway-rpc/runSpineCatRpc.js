// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: runSpineCatRpc  (minified: xke, daemon.pretty.js:90393)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runSpineCatRpc(e, t) {
    let n = rU(t);
    if (n !== null) throw new tp(Dm("spine.cat", n));
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
                redact: a => Npt(a, s)
            } : {}
        })
    } catch (o) {
        throw o instanceof xS && o.isUsage ? new tp(o.message) : o
    }
    return {
        text: i.stdout
    }
}
