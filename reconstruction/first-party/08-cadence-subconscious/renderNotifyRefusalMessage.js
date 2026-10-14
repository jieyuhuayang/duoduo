// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyRefusalMessage  (minified: rO, daemon.pretty.js:64820)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 1 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (high): now fails with a message naming the sessions that *do* have a reader, instead of writing into a void.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyRefusalMessage(inputs, verdict, candidates, targetSessionKey, unconsumedHours) {
    let windowText = Xw(unconsumedHours * nO),
        recordsPastCursor = inputs.records_past_cursor,
        unreadText = recordsPastCursor === 1 ? "1 of its replies is waiting unread" : `${recordsPastCursor} of its replies are waiting unread`,
        lines = [inputs.last_cursor_advance_at === void 0 ? `This session has never had a consumer, its oldest unread output is ${Xw(verdict.age_ms)} old, and ${unreadText}.` : `No consumer has taken this session's output for ${Xw(verdict.age_ms)}, and ${unreadText}.`, "Nothing was delivered. This call will not be retried."];
    if (candidates.length === 0) lines.push(`No session has had a consumer within the last ${windowText}, so there is nowhere a person would see this. Do not re-send it.`);
    else {
        lines.push("If a person must see this, send it to a session that has a consumer; otherwise do not re-send it.", `When you re-send it, open with what it is and that it was meant for ${targetSessionKey}, so the reader knows why it arrived there.`, "", `Sessions a consumer has taken output from within the last ${windowText}:`);
        for (let candidate of candidates) {
            let aliasSuffix = candidate.display_name ? ` (alias ${candidate.display_name})` : "";
            lines.push(`- ${candidate.session_key}${aliasSuffix} — consumer took output ${Xw(candidate.age_ms)} ago`)
        }
    }
    return lines.join(`
`)
}
