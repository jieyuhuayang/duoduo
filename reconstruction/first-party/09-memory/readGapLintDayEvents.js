// duoduo reconstruction — subsystem: 09-memory
// symbol: readGapLintDayEvents  (minified: Xke, daemon.pretty.js:69957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readGapLintDayEvents(filePath) {
    let events = [],
        content;
    try {
        content = lu.readFileSync(filePath, "utf8")
    } catch (err) {
        return {
            events,
            readFault: recordUnreadableUnlessMissing(err)
        }
    }
    for (let line of content.split(`
`)) {
        if (!line) continue;
        let event;
        try {
            event = JSON.parse(line)
        } catch {
            continue
        }
        if (typeof event.ts != "string") continue;
        let msOfDay = XO(event.ts);
        if (msOfDay === null) continue;
        let sourceKind = event.source?.kind;
        typeof sourceKind != "string" || sourceKind === "" || Yg.has(sourceKind) || events.push({
            msOfDay,
            interaction: Oht.has(event.type ?? "")
        })
    }
    return {
        events,
        readFault: !1
    }
}
