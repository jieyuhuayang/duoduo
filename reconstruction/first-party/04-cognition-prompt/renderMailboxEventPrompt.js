// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderMailboxEventPrompt  (minified: _A, daemon.pretty.js:71794)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.0, v0.5.1, v0.5.3, v0.5.4, v0.6.0, v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 40 renamed — 12 from the code at the binding (rule), 28 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// changelog v0.4.0 (medium): fix(job): wire system-level notify delivery and fix child job routing (9e7b13b)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderMailboxEventPrompt(event, sessionKey) {
    let eventPayload = isNonNullObject(event.payload) ? event.payload : void 0;
    if (event.type === "route.deliver" && eventPayload) {
        let stringProperty = readStringProperty(eventPayload, "source_event_type"),
            payload = eventPayload.payload,
            innerPayload = isNonNullObject(payload) ? payload : void 0;
        if (stringProperty === "job.complete" && innerPayload) {
            let stringProperty = readStringProperty(innerPayload, "job_id");
            if (stringProperty) {
                let resultText = readStringProperty(innerPayload, "result_text") ?? readStringProperty(innerPayload, "result_summary") ?? "",
                    sourceSessionKey = readStringProperty(eventPayload, "source_session_key") ?? "",
                    scheduleType = readStringProperty(innerPayload, "schedule_type") ?? "",
                    sessionKind = classifySessionKeyOrUnknown(sessionKey),
                    deliveredAt = new Date().toISOString(),
                    attributes = [`job_id="${escapeXmlText(stringProperty)}"`, sourceSessionKey ? `source_session="${escapeXmlText(sourceSessionKey)}"` : "", scheduleType ? `schedule="${escapeXmlText(scheduleType)}"` : "", event.ts ? `sent_at="${escapeXmlText(event.ts)}"` : "", `delivered_at="${escapeXmlText(deliveredAt)}"`].filter(Boolean).join(" "),
                    jobCompleteReceiptGuidance = renderJobCompleteReceiptGuidance(sessionKind, stringProperty);
                return [`<job-status event="job.complete" ${attributes}>`, jobCompleteReceiptGuidance, resultText ? `
<job-result>
${escapeXmlText(resultText)}
</job-result>` : "", "</job-status>"].filter(Boolean).join(`
`)
            }
        }
        if (stringProperty === "job.fail" && innerPayload) {
            let stringProperty = readStringProperty(innerPayload, "job_id");
            if (stringProperty) {
                let errorText = readStringProperty(innerPayload, "error") ?? readStringProperty(innerPayload, "error_summary") ?? "Unknown error",
                    sourceSessionKey = readStringProperty(eventPayload, "source_session_key") ?? "",
                    scheduleType = readStringProperty(innerPayload, "schedule_type") ?? "",
                    sessionKind = classifySessionKeyOrUnknown(sessionKey),
                    deliveredAt = new Date().toISOString(),
                    attributes = [`job_id="${escapeXmlText(stringProperty)}"`, sourceSessionKey ? `source_session="${escapeXmlText(sourceSessionKey)}"` : "", scheduleType ? `schedule="${escapeXmlText(scheduleType)}"` : "", event.ts ? `sent_at="${escapeXmlText(event.ts)}"` : "", `delivered_at="${escapeXmlText(deliveredAt)}"`].filter(Boolean).join(" "),
                    guidance = Amt(sessionKind, scheduleType, stringProperty);
                return [`<job-status event="job.fail" ${attributes}>`, guidance, `
<job-error>
${escapeXmlText(errorText)}
</job-error>`, "</job-status>"].join(`
`)
            }
        }
        if (stringProperty === "self-wake" && innerPayload) {
            let wakeId = readStringProperty(innerPayload, "wake_id") ?? "",
                setAt = readStringProperty(innerPayload, "set_at") ?? "",
                dueAt = readStringProperty(innerPayload, "due_at") ?? "",
                context = readStringProperty(innerPayload, "context") ?? "";
            return [`<self-wake ${[wakeId?`id="${escapeXmlText(wakeId)}"`:"",setAt?`set_at="${escapeXmlText(setAt)}"`:"",dueAt?`due_at="${escapeXmlText(dueAt)}"`:"",`delivered_at="${escapeXmlText(new Date().toISOString())}"`].filter(Boolean).join(" ")}>`, "A follow-up you scheduled is due. This is NOT a direct user message, and it does", "not mean the work has finished.", "", "Evaluate the current evidence and decide:", "- If useful follow-up work remains, perform it.", "- If the user needs an actionable update or result, respond here.", "- If no user-visible response is needed, call Skip.", "", "Skip is the only valid way to produce silence.", "Any text you emit will be delivered to the user.", "", "<context>", escapeXmlText(context), "</context>", "</self-wake>"].join(`
`)
        }
        if ((stringProperty === "notify" || stringProperty === "external.notify") && innerPayload) {
            let notifyContent = readStringProperty(innerPayload, "notify_content") ?? readStringProperty(innerPayload, "text") ?? "",
                sourceSessionKey = readStringProperty(eventPayload, "source_session_key") ?? "",
                sourceKind = readStringProperty(innerPayload, "notify_source_kind") ?? "",
                stringProperty = readStringProperty(innerPayload, "notify_source_label"),
                stringProperty2 = readStringProperty(innerPayload, "notify_job_schedule_type"),
                stringProperty3 = readStringProperty(innerPayload, "notify_correlation_id"),
                stringProperty4 = readStringProperty(innerPayload, "notify_reply_to"),
                sessionKind = classifySessionKeyOrUnknown(sessionKey),
                hasTaskId = !!readStringProperty(innerPayload, "task_id"),
                attributes = [sourceSessionKey ? `source_session="${escapeXmlText(sourceSessionKey)}"` : "", sourceKind ? `source_kind="${escapeXmlText(sourceKind)}"` : "", stringProperty ? `source_label="${escapeXmlText(stringProperty)}"` : "", stringProperty3 ? `correlation_id="${escapeXmlText(stringProperty3)}"` : "", stringProperty4 ? `reply_to="${escapeXmlText(stringProperty4)}"` : ""].filter(Boolean).join(" ");
            return Nmt(sessionKind, sourceKind, stringProperty2 ?? void 0, notifyContent, attributes, {
                sentAt: event.ts,
                deliveredAt: new Date().toISOString()
            }, stringProperty4 ?? void 0, hasTaskId)
        }
        if (innerPayload) {
            let stringProperty = readStringProperty(innerPayload, "result_text");
            if (stringProperty) return stringProperty;
            let stringProperty2 = readStringProperty(innerPayload, "text");
            if (stringProperty2) return stringProperty2
        }
    }
    if (eventPayload) {
        let stringProperty = readStringProperty(eventPayload, "text"),
            extraLines = $mt(eventPayload);
        if (stringProperty && stringProperty.startsWith("/") || stringProperty && extraLines.length === 0) return stringProperty;
        if (!stringProperty && extraLines.length > 0) return extraLines.join(`
`);
        if (stringProperty && extraLines.length > 0) return [stringProperty, "", ...extraLines].join(`
`)
    }
    return ""
}
