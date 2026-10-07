// duoduo reconstruction — subsystem: 09-memory
// symbol: readGapLintDayEvents  (minified: rSe, daemon.pretty.js:67874)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readGapLintDayEvents(e) {
    let t = [],
        n;
    try {
        n = au.readFileSync(e, "utf8")
    } catch (r) {
        return {
            events: t,
            readFault: recordUnreadableUnlessMissing(r)
        }
    }
    for (let r of n.split(`
`)) {
        if (!r) continue;
        let i;
        try {
            i = JSON.parse(r)
        } catch {
            continue
        }
        if (typeof i.ts != "string") continue;
        let o = MO(i.ts);
        if (o === null) continue;
        let s = i.source?.kind;
        typeof s != "string" || s === "" || qg.has(s) || t.push({
            msOfDay: o,
            interaction: Ndt.has(i.type ?? "")
        })
    }
    return {
        events: t,
        readFault: !1
    }
}
