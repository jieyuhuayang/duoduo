// duoduo reconstruction — subsystem: 09-memory
// symbol: scanWikiLinkOccurrences  (minified: Qf, daemon.pretty.js:66765)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function scanWikiLinkOccurrences(text) {
    let occurrences = [],
        length = text.length,
        pos = 0;
    for (; pos < length;) {
        if (text[pos] === "[" && pos + 1 < length && text[pos + 1] === "[") {
            let start = pos,
                end = pos + 2;
            for (; end < length && text[end] !== "]";) end++;
            if (end + 1 < length && text[end] === "]" && text[end + 1] === "]") {
                let slug = text.slice(start + 2, end);
                slug.length > 0 && occurrences.push({
                    slug,
                    index: start
                }), pos = end + 2;
                continue
            }
            pos = start + 1;
            continue
        }
        pos++
    }
    return occurrences
}
