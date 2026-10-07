// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderMailboxEventPrompt  (minified: _A, daemon.pretty.js:71793)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderMailboxEventPrompt(e, t) {
    let n = to(e.payload) ? e.payload : void 0;
    if (e.type === "route.deliver" && n) {
        let r = on(n, "source_event_type"),
            i = n.payload,
            o = to(i) ? i : void 0;
        if (r === "job.complete" && o) {
            let s = on(o, "job_id");
            if (s) {
                let a = on(o, "result_text") ?? on(o, "result_summary") ?? "",
                    u = on(n, "source_session_key") ?? "",
                    l = on(o, "schedule_type") ?? "",
                    c = classifySessionKeyOrUnknown(t),
                    d = new Date().toISOString(),
                    f = [`job_id="${Ut(s)}"`, u ? `source_session="${Ut(u)}"` : "", l ? `schedule="${Ut(l)}"` : "", e.ts ? `sent_at="${Ut(e.ts)}"` : "", `delivered_at="${Ut(d)}"`].filter(Boolean).join(" "),
                    p = renderJobCompleteReceiptGuidance(c, s);
                return [`<job-status event="job.complete" ${f}>`, p, a ? `
<job-result>
${Ut(a)}
</job-result>` : "", "</job-status>"].filter(Boolean).join(`
`)
            }
        }
        if (r === "job.fail" && o) {
            let s = on(o, "job_id");
            if (s) {
                let a = on(o, "error") ?? on(o, "error_summary") ?? "Unknown error",
                    u = on(n, "source_session_key") ?? "",
                    l = on(o, "schedule_type") ?? "",
                    c = classifySessionKeyOrUnknown(t),
                    d = new Date().toISOString(),
                    f = [`job_id="${Ut(s)}"`, u ? `source_session="${Ut(u)}"` : "", l ? `schedule="${Ut(l)}"` : "", e.ts ? `sent_at="${Ut(e.ts)}"` : "", `delivered_at="${Ut(d)}"`].filter(Boolean).join(" "),
                    p = Cmt(c, l, s);
                return [`<job-status event="job.fail" ${f}>`, p, `
<job-error>
${Ut(a)}
</job-error>`, "</job-status>"].join(`
`)
            }
        }
        if (r === "self-wake" && o) {
            let s = on(o, "wake_id") ?? "",
                a = on(o, "set_at") ?? "",
                u = on(o, "due_at") ?? "",
                l = on(o, "context") ?? "";
            return [`<self-wake ${[s?`id="${Ut(s)}"`:"",a?`set_at="${Ut(a)}"`:"",u?`due_at="${Ut(u)}"`:"",`delivered_at="${Ut(new Date().toISOString())}"`].filter(Boolean).join(" ")}>`, "A follow-up you scheduled is due. This is NOT a direct user message, and it does", "not mean the work has finished.", "", "Evaluate the current evidence and decide:", "- If useful follow-up work remains, perform it.", "- If the user needs an actionable update or result, respond here.", "- If no user-visible response is needed, call Skip.", "", "Skip is the only valid way to produce silence.", "Any text you emit will be delivered to the user.", "", "<context>", Ut(l), "</context>", "</self-wake>"].join(`
`)
        }
        if ((r === "notify" || r === "external.notify") && o) {
            let s = on(o, "notify_content") ?? on(o, "text") ?? "",
                a = on(n, "source_session_key") ?? "",
                u = on(o, "notify_source_kind") ?? "",
                l = on(o, "notify_source_label"),
                c = on(o, "notify_job_schedule_type"),
                d = on(o, "notify_correlation_id"),
                f = on(o, "notify_reply_to"),
                p = classifySessionKeyOrUnknown(t),
                m = !!on(o, "task_id"),
                h = [a ? `source_session="${Ut(a)}"` : "", u ? `source_kind="${Ut(u)}"` : "", l ? `source_label="${Ut(l)}"` : "", d ? `correlation_id="${Ut(d)}"` : "", f ? `reply_to="${Ut(f)}"` : ""].filter(Boolean).join(" ");
            return Omt(p, u, c ?? void 0, s, h, {
                sentAt: e.ts,
                deliveredAt: new Date().toISOString()
            }, f ?? void 0, m)
        }
        if (o) {
            let s = on(o, "result_text");
            if (s) return s;
            let a = on(o, "text");
            if (a) return a
        }
    }
    if (n) {
        let r = on(n, "text"),
            i = Tmt(n);
        if (r && r.startsWith("/") || r && i.length === 0) return r;
        if (!r && i.length > 0) return i.join(`
`);
        if (r && i.length > 0) return [r, "", ...i].join(`
`)
    }
    return ""
}
