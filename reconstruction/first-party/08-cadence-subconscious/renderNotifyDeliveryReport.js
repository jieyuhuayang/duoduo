// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyDeliveryReport  (minified: rSe, daemon.pretty.js:67553)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 9 renamed — 1 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyDeliveryReport(sourceSessionKey, sourceKind, mode, results) {
    let length = results.filter(result => result.success).length,
        lines = [length === 0 ? "Notify not delivered." : length === results.length ? "Notify delivered." : "Notify partially delivered.", `- source_session_key: ${sourceSessionKey}`, `- source_kind: ${sourceKind}`, `- mode: ${mode}`, `- delivered_count: ${length}`, `- attempted_count: ${results.length}`];
    if (results.length > 0) {
        lines.push("", "Targets");
        for (let result of results)
            if (result.success) {
                let consumerText = result.consumer ? Hwe(result.consumer) : void 0;
                lines.push(`- ${result.targetSessionKey} ok event_id=${result.eventId??"unknown"} mailbox=${result.mailboxPath??"unknown"}${consumerText?` ${consumerText}`:""}`)
            } else result.refused ? lines.push(`- ${result.targetSessionKey} refused: ${result.error??"unknown"}`) : lines.push(`- ${result.targetSessionKey} error: ${result.error??"unknown"}`)
    }
    return lines.join(`
`)
}
