// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderMailboxEventPrompt  (minified: RO, daemon.pretty.js:71491)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderMailboxEventPrompt(e, t) {
    let n = eo(e.payload) ? e.payload : void 0;
    if (e.type === "route.deliver" && n) {
        let r = en(n, "source_event_type"),
            i = n.payload,
            o = eo(i) ? i : void 0;
        if (r === "job.complete" && o) {
            let s = en(o, "job_id");
            if (s) {
                let a = en(o, "result_text") ?? en(o, "result_summary") ?? "",
                    u = en(n, "source_session_key") ?? "",
                    l = en(o, "schedule_type") ?? "",
                    c = classifySessionKeyOrUnknown(t),
                    d = new Date().toISOString(),
                    f = [`job_id="${Ft(s)}"`, u ? `source_session="${Ft(u)}"` : "", l ? `schedule="${Ft(l)}"` : "", e.ts ? `sent_at="${Ft(e.ts)}"` : "", `delivered_at="${Ft(d)}"`].filter(Boolean).join(" "),
                    p = renderJobCompleteReceiptGuidance(c, s);
                return [`<job-status event="job.complete" ${f}>`, p, a ? `
<job-result>
${Ft(a)}
</job-result>` : "", "</job-status>"].filter(Boolean).join(`
`)
            }
        }
        if (r === "job.fail" && o) {
            let s = en(o, "job_id");
            if (s) {
                let a = en(o, "error") ?? en(o, "error_summary") ?? "Unknown error",
                    u = en(n, "source_session_key") ?? "",
                    l = en(o, "schedule_type") ?? "",
                    c = classifySessionKeyOrUnknown(t),
                    d = new Date().toISOString(),
                    f = [`job_id="${Ft(s)}"`, u ? `source_session="${Ft(u)}"` : "", l ? `schedule="${Ft(l)}"` : "", e.ts ? `sent_at="${Ft(e.ts)}"` : "", `delivered_at="${Ft(d)}"`].filter(Boolean).join(" "),
                    p = Zdt(c, l, s);
                return [`<job-status event="job.fail" ${f}>`, p, `
<job-error>
${Ft(a)}
</job-error>`, "</job-status>"].join(`
`)
            }
        }
        if (r === "self-wake" && o) {
            let s = en(o, "wake_id") ?? "",
                a = en(o, "set_at") ?? "",
                u = en(o, "due_at") ?? "",
                l = en(o, "context") ?? "";
            return [`<self-wake ${[s?`id="${Ft(s)}"`:"",a?`set_at="${Ft(a)}"`:"",u?`due_at="${Ft(u)}"`:"",`delivered_at="${Ft(new Date().toISOString())}"`].filter(Boolean).join(" ")}>`, "A follow-up you scheduled is due. This is NOT a direct user message, and it does", "not mean the work has finished.", "", "Evaluate the current evidence and decide:", "- If useful follow-up work remains, perform it.", "- If the user needs an actionable update or result, respond here.", "- If no user-visible response is needed, call Skip.", "", "Skip is the only valid way to produce silence.", "Any text you emit will be delivered to the user.", "", "<context>", Ft(l), "</context>", "</self-wake>"].join(`
`)
        }
        if ((r === "notify" || r === "external.notify") && o) {
            let s = en(o, "notify_content") ?? en(o, "text") ?? "",
                a = en(n, "source_session_key") ?? "",
                u = en(o, "notify_source_kind") ?? "",
                l = en(o, "notify_source_label"),
                c = en(o, "notify_job_schedule_type"),
                d = en(o, "notify_correlation_id"),
                f = en(o, "notify_reply_to"),
                p = classifySessionKeyOrUnknown(t),
                m = !!en(o, "task_id"),
                h = [a ? `source_session="${Ft(a)}"` : "", u ? `source_kind="${Ft(u)}"` : "", l ? `source_label="${Ft(l)}"` : "", d ? `correlation_id="${Ft(d)}"` : "", f ? `reply_to="${Ft(f)}"` : ""].filter(Boolean).join(" ");
            return Gdt(p, u, c ?? void 0, s, h, {
                sentAt: e.ts,
                deliveredAt: new Date().toISOString()
            }, f ?? void 0, m)
        }
        if (o) {
            let s = en(o, "result_text");
            if (s) return s;
            let a = en(o, "text");
            if (a) return a
        }
    }
    if (n) {
        let r = en(n, "text"),
            i = Hdt(n);
        if (r && r.startsWith("/") || r && i.length === 0) return r;
        if (!r && i.length > 0) return i.join(`
`);
        if (r && i.length > 0) return [r, "", ...i].join(`
`)
    }
    return ""
}
