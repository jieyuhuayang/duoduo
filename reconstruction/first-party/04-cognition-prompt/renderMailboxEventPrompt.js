// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderMailboxEventPrompt  (minified: _A, daemon.pretty.js:71793)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderMailboxEventPrompt(e, t) {
    let n = isNonNullObject(e.payload) ? e.payload : void 0;
    if (e.type === "route.deliver" && n) {
        let r = readStringProperty(n, "source_event_type"),
            i = n.payload,
            o = isNonNullObject(i) ? i : void 0;
        if (r === "job.complete" && o) {
            let s = readStringProperty(o, "job_id");
            if (s) {
                let a = readStringProperty(o, "result_text") ?? readStringProperty(o, "result_summary") ?? "",
                    u = readStringProperty(n, "source_session_key") ?? "",
                    l = readStringProperty(o, "schedule_type") ?? "",
                    c = classifySessionKeyOrUnknown(t),
                    d = new Date().toISOString(),
                    f = [`job_id="${escapeXmlText(s)}"`, u ? `source_session="${escapeXmlText(u)}"` : "", l ? `schedule="${escapeXmlText(l)}"` : "", e.ts ? `sent_at="${escapeXmlText(e.ts)}"` : "", `delivered_at="${escapeXmlText(d)}"`].filter(Boolean).join(" "),
                    p = renderJobCompleteReceiptGuidance(c, s);
                return [`<job-status event="job.complete" ${f}>`, p, a ? `
<job-result>
${escapeXmlText(a)}
</job-result>` : "", "</job-status>"].filter(Boolean).join(`
`)
            }
        }
        if (r === "job.fail" && o) {
            let s = readStringProperty(o, "job_id");
            if (s) {
                let a = readStringProperty(o, "error") ?? readStringProperty(o, "error_summary") ?? "Unknown error",
                    u = readStringProperty(n, "source_session_key") ?? "",
                    l = readStringProperty(o, "schedule_type") ?? "",
                    c = classifySessionKeyOrUnknown(t),
                    d = new Date().toISOString(),
                    f = [`job_id="${escapeXmlText(s)}"`, u ? `source_session="${escapeXmlText(u)}"` : "", l ? `schedule="${escapeXmlText(l)}"` : "", e.ts ? `sent_at="${escapeXmlText(e.ts)}"` : "", `delivered_at="${escapeXmlText(d)}"`].filter(Boolean).join(" "),
                    p = Cmt(c, l, s);
                return [`<job-status event="job.fail" ${f}>`, p, `
<job-error>
${escapeXmlText(a)}
</job-error>`, "</job-status>"].join(`
`)
            }
        }
        if (r === "self-wake" && o) {
            let s = readStringProperty(o, "wake_id") ?? "",
                a = readStringProperty(o, "set_at") ?? "",
                u = readStringProperty(o, "due_at") ?? "",
                l = readStringProperty(o, "context") ?? "";
            return [`<self-wake ${[s?`id="${escapeXmlText(s)}"`:"",a?`set_at="${escapeXmlText(a)}"`:"",u?`due_at="${escapeXmlText(u)}"`:"",`delivered_at="${escapeXmlText(new Date().toISOString())}"`].filter(Boolean).join(" ")}>`, "A follow-up you scheduled is due. This is NOT a direct user message, and it does", "not mean the work has finished.", "", "Evaluate the current evidence and decide:", "- If useful follow-up work remains, perform it.", "- If the user needs an actionable update or result, respond here.", "- If no user-visible response is needed, call Skip.", "", "Skip is the only valid way to produce silence.", "Any text you emit will be delivered to the user.", "", "<context>", escapeXmlText(l), "</context>", "</self-wake>"].join(`
`)
        }
        if ((r === "notify" || r === "external.notify") && o) {
            let s = readStringProperty(o, "notify_content") ?? readStringProperty(o, "text") ?? "",
                a = readStringProperty(n, "source_session_key") ?? "",
                u = readStringProperty(o, "notify_source_kind") ?? "",
                l = readStringProperty(o, "notify_source_label"),
                c = readStringProperty(o, "notify_job_schedule_type"),
                d = readStringProperty(o, "notify_correlation_id"),
                f = readStringProperty(o, "notify_reply_to"),
                p = classifySessionKeyOrUnknown(t),
                m = !!readStringProperty(o, "task_id"),
                h = [a ? `source_session="${escapeXmlText(a)}"` : "", u ? `source_kind="${escapeXmlText(u)}"` : "", l ? `source_label="${escapeXmlText(l)}"` : "", d ? `correlation_id="${escapeXmlText(d)}"` : "", f ? `reply_to="${escapeXmlText(f)}"` : ""].filter(Boolean).join(" ");
            return Omt(p, u, c ?? void 0, s, h, {
                sentAt: e.ts,
                deliveredAt: new Date().toISOString()
            }, f ?? void 0, m)
        }
        if (o) {
            let s = readStringProperty(o, "result_text");
            if (s) return s;
            let a = readStringProperty(o, "text");
            if (a) return a
        }
    }
    if (n) {
        let r = readStringProperty(n, "text"),
            i = Tmt(n);
        if (r && r.startsWith("/") || r && i.length === 0) return r;
        if (!r && i.length > 0) return i.join(`
`);
        if (r && i.length > 0) return [r, "", ...i].join(`
`)
    }
    return ""
}
