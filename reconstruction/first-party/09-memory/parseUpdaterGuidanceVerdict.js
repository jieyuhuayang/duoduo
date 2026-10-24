// duoduo reconstruction — subsystem: 09-memory
// symbol: parseUpdaterGuidanceVerdict  (minified: eht, daemon.pretty.js:69020)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseUpdaterGuidanceVerdict(text) {
    let inGuidance = !1;
    for (let line of splitLinesDropTrailingEmpty(text)) {
        if (/updater guidance:/i.test(line)) {
            inGuidance = !0;
            continue
        }
        if (!inGuidance || !/^- /.test(line)) continue;
        let upperLine = line.toUpperCase(),
            earliestVerdict = null,
            POSITIVEINFINITY = Number.POSITIVE_INFINITY;
        for (let verdict of Ymt) {
            let index = upperLine.indexOf(verdict);
            index >= 0 && index < POSITIVEINFINITY && (POSITIVEINFINITY = index, earliestVerdict = verdict)
        }
        if (earliestVerdict !== null) return earliestVerdict
    }
    return null
}
