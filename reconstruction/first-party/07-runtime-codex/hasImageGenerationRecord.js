// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: hasImageGenerationRecord  (minified: jle, daemon.pretty.js:57904)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasImageGenerationRecord(e) {
    let t = [e],
        n = new Set;
    for (; t.length > 0;) {
        let r = t.pop();
        if (!(!B_(r) || n.has(r))) {
            if (n.add(r), Dle(r)) return !0;
            for (let i of ["payload", "event", "msg", "item"]) {
                let s = r[i];
                B_(s) && t.push(s)
            }
        }
    }
    return !1
}
