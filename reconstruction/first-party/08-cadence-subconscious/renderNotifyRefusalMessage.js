// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyRefusalMessage  (minified: C$, daemon.pretty.js:64919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyRefusalMessage(e, t, n, r, i) {
    let o = Cw(i * T$),
        s = e.records_past_cursor,
        a = s === 1 ? "1 of its replies is waiting unread" : `${s} of its replies are waiting unread`,
        l = [e.last_cursor_advance_at === void 0 ? `This session has never had a consumer, its oldest unread output is ${Cw(t.age_ms)} old, and ${a}.` : `No consumer has taken this session's output for ${Cw(t.age_ms)}, and ${a}.`, "Nothing was delivered. This call will not be retried."];
    if (n.length === 0) l.push(`No session has had a consumer within the last ${o}, so there is nowhere a person would see this. Do not re-send it.`);
    else {
        l.push("If a person must see this, send it to a session that has a consumer; otherwise do not re-send it.", `When you re-send it, open with what it is and that it was meant for ${r}, so the reader knows why it arrived there.`, "", `Sessions a consumer has taken output from within the last ${o}:`);
        for (let c of n) {
            let d = c.display_name ? ` (alias ${c.display_name})` : "";
            l.push(`- ${c.session_key}${d} — consumer took output ${Cw(c.age_ms)} ago`)
        }
    }
    return l.join(`
`)
}
