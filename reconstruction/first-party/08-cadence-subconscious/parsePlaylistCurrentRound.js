// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parsePlaylistCurrentRound  (minified: Qut, daemon.pretty.js:66273)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePlaylistCurrentRound(e) {
    let t = e.split(`
`),
        n = t.findIndex(i => i.trim() === "## Current Round");
    if (n === -1) return [];
    let r = [];
    for (let i = n + 1; i < t.length; i++) {
        let o = t[i].trim();
        if (o.startsWith("## ")) break;
        o.startsWith("- [x] ") ? r.push({
            name: o.slice(6).trim(),
            done: !0
        }) : o.startsWith("- [ ] ") && r.push({
            name: o.slice(6).trim(),
            done: !1
        })
    }
    return r
}
