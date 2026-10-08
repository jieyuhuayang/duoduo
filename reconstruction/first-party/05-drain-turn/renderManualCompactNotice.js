// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderManualCompactNotice  (minified: nht, daemon.pretty.js:72345)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderManualCompactNotice(e) {
    let t = typeof e.pre_tokens == "number",
        n = typeof e.post_tokens == "number";
    return t && n ? `📦 History compacted (${e.pre_tokens} → ${e.post_tokens} tokens).` : t ? `📦 History compacted (pre: ${e.pre_tokens} tokens).` : "📦 History compacted."
}
