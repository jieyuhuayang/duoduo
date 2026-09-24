// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: clearModelOverrideOnRuntimeFlip  (minified: Rft, daemon.pretty.js:72293)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearModelOverrideOnRuntimeFlip(e, t, n) {
    let {
        snapshotModel: r,
        snapshotModelRuntime: i,
        activeRuntime: o
    } = n;
    !n.sessionInfo.model || !(i ? i !== o : o === "codex" || o === "pi") || (n.sessionInfo.model = void 0, await mutateSessionRuntimeState(e, t, a => a.model !== r || a.model_runtime !== i ? {} : {
        model: null,
        model_runtime: null,
        pending_model_fork: null
    }).catch(() => {}), te(i ? "[runner] cleared session model override on runtime flip" : "[runner] cleared un-stamped legacy model override on incompatible runtime drain", {
        sessionKey: t,
        overrideRuntime: i,
        activeRuntime: o,
        droppedModel: r
    }))
}
