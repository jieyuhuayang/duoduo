// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeBoundedEditDistance  (minified: Jlt, daemon.pretty.js:65329)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 2 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Notify "target not found" error now matches candidates scope-aware (session_key prefix + channel kind), yielding actionable suggestions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoundedEditDistance(a2, b, maxDistance) {
    if (a2 === b) return 0;
    if (Math.abs(a2.length - b.length) > maxDistance) return maxDistance + 1;
    let array = new Array(b.length + 1),
        array2 = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) array[j] = j;
    for (let i2 = 1; i2 <= a2.length; i2++) {
        array2[0] = i2;
        let rowMin = array2[0];
        for (let j = 1; j <= b.length; j++) {
            let cost = a2[i2 - 1] === b[j - 1] ? 0 : 1;
            array2[j] = Math.min(array[j] + 1, array2[j - 1] + 1, array[j - 1] + cost), array2[j] < rowMin && (rowMin = array2[j])
        }
        if (rowMin > maxDistance) return maxDistance + 1;
        for (let j = 0; j <= b.length; j++) array[j] = array2[j]
    }
    return array[b.length]
}
