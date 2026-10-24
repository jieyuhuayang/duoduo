// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: qht, daemon.pretty.js:70050)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 18 renamed — 2 from the code at the binding (rule), 16 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(eventsDir, coverage, nowMs, minQuietMs) {
    let eventDates = Aht(eventsDir);
    if (eventDates.readFault) return buildGapReadFaultResult(null);
    let today = new Date(nowMs).toISOString().slice(0, 10),
        dayStartMs = Date.parse(`${today}T00:00:00.000Z`),
        todayCoverage = Kke(coverage, today),
        coveredUntilMs = Dht(todayCoverage);
    if (coveredUntilMs < fa && eventDates.dates.includes(today)) {
        let gapLintDayEvents = readGapLintDayEvents(qc.join(eventsDir, `${today}.jsonl`));
        if (gapLintDayEvents.readFault) return buildGapReadFaultResult(null);
        let lastInteractionMs = -1;
        for (let event of gapLintDayEvents.events) event.interaction && event.msOfDay > coveredUntilMs && event.msOfDay > lastInteractionMs && (lastInteractionMs = event.msOfDay);
        if (lastInteractionMs >= 0 && nowMs - (dayStartMs + lastInteractionMs) >= minQuietMs) {
            let span = {
                date: today,
                startMs: coveredUntilMs,
                endMs: lastInteractionMs
            };
            return mW(span, mergeContiguousHourRanges(Qke(gapLintDayEvents.events, span)))
        }
    }
    let previousSpan = null;
    for (let i = eventDates.dates.length - 1; i >= 0; i -= 1) {
        let date = eventDates.dates[i];
        if (date >= today) continue;
        let spans = Mht(date, Kke(coverage, date));
        if (spans.length > 0) {
            previousSpan = spans[spans.length - 1];
            break
        }
    }
    if (previousSpan === null) return mW(null, []);
    let gapLintDayEvents = readGapLintDayEvents(qc.join(eventsDir, `${previousSpan.date}.jsonl`));
    return gapLintDayEvents.readFault ? buildGapReadFaultResult(previousSpan) : mW(previousSpan, mergeContiguousHourRanges(Qke(gapLintDayEvents.events, previousSpan)))
}
