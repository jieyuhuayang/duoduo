// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: runSpineCatRpc  (minified: Ike, daemon.pretty.js:90439)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 1 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runSpineCatRpc(paths, params) {
    let problem = describeSpineCatProblem(params);
    if (problem !== null) throw new SpineRpcParamsError(renderParamsProblem("spine.cat", problem));
    let catParams = params,
        output = {
            stdout: "",
            stderr: ""
        };
    try {
        let catArgs = gke(_ke(catParams)),
            voidSessionKeys = catParams.redact === "external" ? await listVoidChannelSessions(paths) : null;
        await yke(paths, catArgs, new Date, output, {
            overRpc: !0,
            ...voidSessionKeys !== null ? {
                redact: event => redactSpineEventForExternal(event, voidSessionKeys)
            } : {}
        })
    } catch (err) {
        throw err instanceof xS && err.isUsage ? new SpineRpcParamsError(err.message) : err
    }
    return {
        text: output.stdout
    }
}
