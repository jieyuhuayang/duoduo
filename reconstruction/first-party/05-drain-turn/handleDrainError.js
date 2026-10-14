// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: handleDrainError  (minified: TS, daemon.pretty.js:72540)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.4, v0.5.6, v0.5.10, v0.6.0 (maps/history_daemon.json)
// locals: 12 renamed — 3 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): the runner now writes a `[duoduo:drain-error]` outbox reply to the anchor event's channel and a matching `agent.error` spine event, instead of silently dropping the turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function handleDrainError(paths, sessionKey, params) {
    let message = params.error instanceof Error ? params.error.message : String(params.error),
        truncated = message.length > 4e3 ? message.slice(0, 4e3) + "…" : message,
        userText = params.userText ?? `[duoduo:drain-error] agent turn failed at ${params.stage}.

${truncated}

` + renderDrainErrorRuntimeHint(message, params.hintContext);
    for (let record of params.precedingRecords ?? []) params.bus?.emit("session.output", {
        sessionKey: record.session_key,
        record
    });
    if (params.anchor.event.source?.name === "idle-compact") logInfoMessage("[runner] idle-compact drain error — spine only, no channel record", {
        sessionKey,
        stage: params.stage
    });
    else try {
        let emitted = await emitDrainOutputRecords(paths, sessionKey, {
            item: params.anchor.item,
            event: params.anchor.event,
            outputText: userText
        });
        for (let record of emitted.records) params.bus?.emit("session.output", {
            sessionKey: record.session_key,
            record
        })
    } catch (err) {
        logInfoMessage("[runner] failed to emit drain-error outbox record", {
            sessionKey,
            stage: params.stage,
            emitError: err instanceof Error ? err.message : String(err)
        })
    }
    let spineEvent = createSpineEvent({
        type: "agent.error",
        source: {
            kind: "runner",
            name: "runner"
        },
        session_key: params.anchor.event.session_key ?? sessionKey,
        payload: {
            stage: params.stage,
            error: message,
            ...params.payloadExtra ?? {}
        }
    });
    try {
        await atomicAppendEvent(paths, spineEvent)
    } catch (err) {
        logInfoMessage("[runner] failed to append agent.error to spine", {
            sessionKey,
            stage: params.stage,
            spineError: err instanceof Error ? err.message : String(err)
        })
    }
}
