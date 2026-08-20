// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: parseGrokRewindPoints  (minified: wme, daemon.pretty.js:59965)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseGrokRewindPoints(e) {
    let t = $r(e),
        n = $r(t.result),
        r = Object.keys(n).length > 0 ? n : t,
        i = r.rewindPoints ?? r.rewind_points;
    if (!Array.isArray(i)) return [];
    let o = [];
    for (let s of i) {
        let a = $r(s),
            l = a.promptIndex ?? a.prompt_index;
        typeof l == "number" && Number.isInteger(l) && l >= 0 && o.push({
            promptIndex: l
        })
    }
    return o
}
