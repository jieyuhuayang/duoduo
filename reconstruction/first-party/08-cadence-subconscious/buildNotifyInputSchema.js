// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildNotifyInputSchema  (minified: N$, daemon.pretty.js:65008)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildNotifyInputSchema(e) {
    let {
        sessionKey: t,
        sessionContextKind: n
    } = e, r = n ?? (J_e(t) ? "job" : "foreground"), i = {
        notify_content: ft.string().describe(Jat())
    };
    return r === "job" ? i.target_session_key = ft.string().optional().describe(["Optional: override this job's default Notify target.", "If omitted, the target is the job's owner — the session that created it.", "If provided, delivers to this specific session instead.", "Call ViewSessions with no argument to see the sessions you can target, by either its session key or its display-name alias (resolved server-side). This tool wakes the target session after delivery."].join(`
`)) : i.target_session_key = ft.string().describe(["Target to receive this internal notification: either a session key or a session's display-name alias (resolved server-side).", "Call ViewSessions with no argument to see the sessions you can target (prefer active sessions).", "This tool wakes the target session after delivery."].join(`
`)), (r === "job" || r === "foreground") && (i.correlation_id = ft.string().optional().describe(["Optional unique label (e.g. 'ask-r3-bigshu') when you expect a reply.", "The label is rendered into the target's inbox as an XML attribute on", "the <session-notify> element; the responder should echo it via reply_to.", "Use this so your future turns can recognize the matched reply by", "attention-aligning on the same label in conversation history."].join(`
`)), i.reply_to = ft.string().optional().describe(["Set to the correlation_id of the request you are responding to.", "The original requester sees this label and matches it against their", "earlier outgoing request. Do not invent a value — only echo a label", "that arrived on a request you are answering."].join(`
`))), i
}
