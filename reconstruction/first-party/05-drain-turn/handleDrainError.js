// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: handleDrainError  (minified: bm, daemon.pretty.js:61589)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function handleDrainError(e, t, n) {
    let r = n.error instanceof Error ? n.error.message : String(n.error),
        i = r.length > 4e3 ? r.slice(0, 4e3) + "…" : r,
        s = n.userText ?? `[duoduo:drain-error] agent turn failed at ${n.stage}.

${i}

` + F8e(r, n.hintContext);
    for (let c of n.precedingRecords ?? []) n.bus?.emit("session.output", {
        sessionKey: c.session_key,
        record: c
    });
    if (n.anchor.event.source?.name === "idle-compact") K("[runner] idle-compact drain error — spine only, no channel record", {
        sessionKey: t,
        stage: n.stage
    });
    else try {
        let c = await Ja(e, t, {
            item: n.anchor.item,
            event: n.anchor.event,
            outputText: s
        });
        for (let u of c.records) n.bus?.emit("session.output", {
            sessionKey: u.session_key,
            record: u
        })
    } catch (c) {
        K("[runner] failed to emit drain-error outbox record", {
            sessionKey: t,
            stage: n.stage,
            emitError: c instanceof Error ? c.message : String(c)
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
    } catch (c) {
        K("[runner] failed to append agent.error to spine", {
            sessionKey: t,
            stage: n.stage,
            spineError: c instanceof Error ? c.message : String(c)
        })
    }
}
