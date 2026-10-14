// duoduo reconstruction — subsystem: 09-memory
// symbol: parseEffectivenessCounts  (minified: rdt, daemon.pretty.js:66919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseEffectivenessCounts(text) {
    for (let line of splitLinesDropTrailingEmpty(text))
        if (/strengthening\s*=/i.test(line)) return {
            s: wH(line, "strengthening"),
            n: wH(line, "neutral"),
            w: wH(line, "weakening")
        };
    return {
        s: 0,
        n: 0,
        w: 0
    }
}
