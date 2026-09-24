// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: selectDominantModelByInputTokens  (minified: grt, daemon.pretty.js:54855)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function selectDominantModelByInputTokens(e) {
    if (!e || typeof e != "object") return;
    let t, n = 0,
        r = !1;
    for (let [i, o] of Object.entries(e)) {
        let s = o && typeof o == "object" && typeof o.inputTokens == "number" ? o.inputTokens : 0;
        s > n ? (n = s, t = i, r = !1) : s === n && n > 0 && (r = !0)
    }
    if (!r) return t
}
