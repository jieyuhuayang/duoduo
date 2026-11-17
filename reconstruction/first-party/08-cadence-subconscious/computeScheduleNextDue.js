// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeScheduleNextDue  (minified: Yct, daemon.pretty.js:62792)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.12, v0.4.5, v0.5.6, v0.8.9 (maps/history_daemon.json)
// locals: 4 renamed — 4 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeScheduleNextDue(e, t, n, r) {
    let i = typeof r == "string" && r.length > 0 ? new Date(r).getTime() : Number.NaN,
        o = Number.isFinite(i),
        s = o ? {
            kind: "at",
            ms: i
        } : lO;
    if (e === "once" || e === "keepalive") return t !== null ? tp : s;
    if (e.startsWith("@in ")) {
        let trimmed = e.substring(4).trim();
        try {
            let scheduleDurationMs = parseScheduleDurationMs(trimmed);
            return t !== null ? tp : o ? {
                kind: "at",
                ms: i + scheduleDurationMs
            } : lO
        } catch {
            return tp
        }
    }
    if (e.startsWith("@every ")) {
        let trimmed = e.substring(7).trim();
        try {
            let scheduleDurationMs = parseScheduleDurationMs(trimmed);
            if (!t) return s;
            let l = new Date(t).getTime();
            return Number.isNaN(l) ? tp : {
                kind: "at",
                ms: l + scheduleDurationMs
            }
        } catch {
            return tp
        }
    }
    try {
        if (!t) return o ? {
            kind: "at",
            ms: nS.CronExpressionParser.parse(e, {
                currentDate: new Date(i),
                tz: "UTC"
            }).next().toDate().getTime()
        } : (nS.CronExpressionParser.parse(e, {
            currentDate: n,
            tz: "UTC"
        }), lO);
        let u = nS.CronExpressionParser.parse(e, {
                currentDate: new Date(t),
                tz: "UTC"
            }).next().toDate(),
            l = new Date(t).getTime();
        return Number.isNaN(l) ? lO : {
            kind: "at",
            ms: u.getTime()
        }
    } catch {
        return tp
    }
}
