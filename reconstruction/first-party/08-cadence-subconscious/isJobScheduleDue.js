// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isJobScheduleDue  (minified: Iye, daemon.pretty.js:61037)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobScheduleDue(e, t, n = new Date, r, i) {
    if (typeof i == "string" && i.length > 0) {
        let a = new Date(i).getTime();
        if (Number.isFinite(a)) {
            if (n.getTime() >= a) return !0;
            if ((e === "once" || e.startsWith("@in ")) && t === null) return !1
        }
    }
    let o = typeof r == "string" && r.length > 0 ? new Date(r).getTime() : Number.NaN,
        s = Number.isFinite(o);
    if (e === "once" || e === "keepalive") return t !== null ? !1 : s ? n.getTime() >= o : !0;
    if (e.startsWith("@in ")) {
        let a = e.substring(4).trim();
        try {
            let u = parseScheduleDurationMs(a);
            return t !== null ? !1 : s ? n.getTime() - o >= u : !0
        } catch {
            return !1
        }
    }
    if (e.startsWith("@every ")) {
        let a = e.substring(7).trim();
        try {
            let u = parseScheduleDurationMs(a);
            if (!t) return s ? n.getTime() >= o : !0;
            let l = new Date(t).getTime();
            return n.getTime() - l >= u
        } catch {
            return !1
        }
    }
    try {
        if (!t) return s ? cw.CronExpressionParser.parse(e, {
            currentDate: new Date(o),
            tz: "UTC"
        }).next().toDate().getTime() <= n.getTime() : (cw.CronExpressionParser.parse(e, {
            currentDate: n,
            tz: "UTC"
        }), !0);
        let u = cw.CronExpressionParser.parse(e, {
                currentDate: new Date(t),
                tz: "UTC"
            }).next().toDate(),
            l = new Date(t).getTime();
        return Number.isNaN(l) ? !0 : u.getTime() <= n.getTime()
    } catch {
        return !1
    }
}
