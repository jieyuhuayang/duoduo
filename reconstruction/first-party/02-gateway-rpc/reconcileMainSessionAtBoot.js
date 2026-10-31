// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: reconcileMainSessionAtBoot  (minified: kSe, daemon.pretty.js:90311)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 2 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function reconcileMainSessionAtBoot(e) {
    await bSe(async () => {
        let mainSessionFromIndex = resolveMainSessionFromIndex(e.sessionIndex);
        if (mainSessionFromIndex.state === "ambiguous") {
            logWarnMessage("[main-role] ambiguous main session at boot", {
                candidates: mainSessionFromIndex.candidates
            });
            for (let r of mainSessionFromIndex.candidates) await A6(e, r, Hft(mainSessionFromIndex.candidates));
            return
        }
        if (mainSessionFromIndex.state !== "held") return;
        let sessionKey = mainSessionFromIndex.session_key;
        e.sessionIndex.get(sessionKey)?.main_since || (logInfoMessage("[main-role] stamping an existing main session", {
            session_key: sessionKey
        }), await announceMainSessionChange(e, sessionKey, []))
    })
}
