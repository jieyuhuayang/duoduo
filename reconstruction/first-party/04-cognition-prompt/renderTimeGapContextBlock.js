// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderTimeGapContextBlock  (minified: eft, daemon.pretty.js:71640)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderTimeGapContextBlock(e) {
    if (!e) return;
    let t = new Date(e.lastEventAt).getTime(),
        n = new Date(e.currentEventAt).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(n)) return;
    let r = n - t;
    if (r < e.thresholdMs) return;
    let i = XSe(r),
        o = [`<time-context last_interaction="${Ft(e.lastEventAt)}" current_time="${Ft(e.currentEventAt)}">`, `Approximately ${i} have elapsed since your last interaction in this session.`],
        s = kO(e.currentEventAt);
    return s && o.push(`Daemon wall-clock time: ${s}.`), o.push("</time-context>"), o.join(`
`)
}
