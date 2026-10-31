// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildNotifyInputSchema  (minified: NO, daemon.pretty.js:66561)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.1, v0.5.4, v0.8.0, v0.8.2, v0.8.4, v0.8.7 (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (high): adds `correlation_id` / `reply_to` fields to the Notify MCP tool
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildNotifyInputSchema(ctx) {
    let {
        sessionKey,
        sessionContextKind
    } = ctx, contextKind = sessionContextKind ?? (isJobSessionKeyKind(sessionKey) ? "job" : "foreground"), schema = {
        notify_content: ht.string().describe(ift())
    };
    return contextKind === "job" ? schema.target_session_key = ht.string().optional().describe(["Optional: override this job's default Notify target.", "If omitted, the target is the job's owner — the session that created it.", "If provided, delivers to this specific session instead.", "Call ViewSessions with no argument to see the sessions you can target, by either its session key or its display-name alias (resolved server-side). This tool wakes the target session after delivery, unless that session runs no model.", "`main` is the main session, resolved when the notification is delivered."].join(`
`)) : schema.target_session_key = ht.string().describe(["Target to receive this internal notification: either a session key or a session's display-name alias (resolved server-side).", "Call ViewSessions with no argument to see the sessions you can target (prefer active sessions).", "This tool wakes the target session after delivery, unless that session runs no model.", "`main` is the main session, resolved when the notification is delivered."].join(`
`)), (contextKind === "job" || contextKind === "foreground") && (schema.correlation_id = ht.string().optional().describe(["Optional unique label (e.g. 'ask-r3-bigshu') when you expect a reply.", "The label is rendered into the target's inbox as an XML attribute on", "the <session-notify> element; the responder should echo it via reply_to.", "Use this so your future turns can recognize the matched reply by", "attention-aligning on the same label in conversation history."].join(`
`)), schema.reply_to = ht.string().optional().describe(["Set to the correlation_id of the request you are responding to.", "The original requester sees this label and matches it against their", "earlier outgoing request. Do not invent a value — only echo a label", "that arrived on a request you are answering."].join(`
`))), contextKind === "foreground" && (schema.in_reply_to = ht.string().optional().describe("The id of the mail you are answering, when the message you received gave one.")), schema
}
