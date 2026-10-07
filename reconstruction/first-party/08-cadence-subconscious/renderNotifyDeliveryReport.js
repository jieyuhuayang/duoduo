// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyDeliveryReport  (minified: uve, daemon.pretty.js:65470)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyDeliveryReport(e, t, n, r) {
    let i = r.filter(a => a.success).length,
        s = [i === 0 ? "Notify not delivered." : i === r.length ? "Notify delivered." : "Notify partially delivered.", `- source_session_key: ${e}`, `- source_kind: ${t}`, `- mode: ${n}`, `- delivered_count: ${i}`, `- attempted_count: ${r.length}`];
    if (r.length > 0) {
        s.push("", "Targets");
        for (let a of r)
            if (a.success) {
                let u = a.consumer ? Zbe(a.consumer) : void 0;
                s.push(`- ${a.targetSessionKey} ok event_id=${a.eventId??"unknown"} mailbox=${a.mailboxPath??"unknown"}${u?` ${u}`:""}`)
            } else a.refused ? s.push(`- ${a.targetSessionKey} refused: ${a.error??"unknown"}`) : s.push(`- ${a.targetSessionKey} error: ${a.error??"unknown"}`)
    }
    return s.join(`
`)
}
