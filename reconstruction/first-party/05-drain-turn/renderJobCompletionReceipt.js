// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderJobCompletionReceipt  (minified: _yt, daemon.pretty.js:73451)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.7 (maps/history_daemon.json)
// locals: 4 renamed — 4 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.7 (high): A job outcome whose owner cannot take it goes to main, marked as a stand-in delivery.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobCompletionReceipt(e, t, n, r) {
    let i = classifySessionKeyOrUnknown(t),
        event = r[0].event,
        event2 = r[r.length - 1].event,
        jobCompletePayload = extractJobCompletePayload(event),
        u = jobCompletePayload ? readStringProperty(jobCompletePayload, "schedule_type") ?? "" : "",
        jobCompletePayload2 = extractJobCompletePayload(event2),
        c = jobCompletePayload2 ? extractStandInOwnerInfo(jobCompletePayload2) : void 0,
        d = [`job_id="${escapeXmlText(n)}"`, renderForOwnerAttribute(c), u ? `schedule="${escapeXmlText(u)}"` : "", `runs="${r.length}"`, event.ts ? `first_at="${escapeXmlText(event.ts)}"` : "", event2.ts ? `last_at="${escapeXmlText(event2.ts)}"` : "", `delivered_at="${escapeXmlText(new Date().toISOString())}"`].filter(Boolean).join(" "),
        f = c ? describeStandInJobOwner(c) : "you own",
        p = `System receipt — the job '${n}' ${f} succeeded ${r.length} times, and none of those runs delivered a Notify (a run that notifies successfully sends no receipt at all; one whose Notify FAILED still does).`,
        m = ["Each run's full result text is in the spine. Read them only if this conversation", "needs them:", `  grep -F ${m0e(`"job_id":"${n}"`)} "${e.eventsDir}"/*.jsonl`].join(`
`),
        h = i === "channel" || i === "unknown" ? [p, "It is information, not an instruction, and not a request for a reply.", m] : [p, "You are a background session, so produce no user-visible output.", m];
    return [`<job-status event="job.complete" ${d}>`, ...h, "</job-status>"].join(`
`)
}
