// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: handleDrainError  (minified: zd, daemon.pretty.js:64202)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function handleDrainError(e, t, n) {
    let r = n.error instanceof Error ? n.error.message : String(n.error),
        i = r.length > 4e3 ? r.slice(0, 4e3) + "…" : r,
        o = n.userText ?? `[duoduo:drain-error] agent turn failed at ${n.stage}.

${i}

` + Bet(r, n.hintContext);
    for (let l of n.precedingRecords ?? []) n.bus?.emit("session.output", {
        sessionKey: l.session_key,
        record: l
    });
    if (n.anchor.event.source?.name === "idle-compact") K("[runner] idle-compact drain error — spine only, no channel record", {
        sessionKey: t,
        stage: n.stage
    });
    else try {
        let l = await fl(e, t, {
            item: n.anchor.item,
            event: n.anchor.event,
            outputText: o
        });
        for (let u of l.records) n.bus?.emit("session.output", {
            sessionKey: u.session_key,
            record: u
        })
    } catch (l) {
        K("[runner] failed to emit drain-error outbox record", {
            sessionKey: t,
            stage: n.stage,
            emitError: l instanceof Error ? l.message : String(l)
        })
    }
    let a = createSpineEvent({
        type: "agent.error",
        source: {
            kind: "runner",
            name: "runner"
        },
        session_key: n.anchor.event.session_key ?? t,
        payload: {
            stage: n.stage,
            error: r,
            ...n.payloadExtra ?? {}
        }
    });
    try {
        await atomicAppendEvent(e, a)
    } catch (l) {
        K("[runner] failed to append agent.error to spine", {
            sessionKey: t,
            stage: n.stage,
            spineError: l instanceof Error ? l.message : String(l)
        })
    }
}
