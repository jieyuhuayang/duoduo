// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: extractStreamTextDeltas  (minified: W$, daemon.pretty.js:55065)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractStreamTextDeltas(e) {
    let t = [];
    if (!e || typeof e != "object") return t;
    let n = e.type;
    if (n === "content_block_delta") {
        let r = e.delta;
        if (r && typeof r == "object") {
            let i = r.type,
                o = r.text;
            i === "text_delta" && typeof o == "string" && o.length > 0 && t.push({
                text: o,
                isDelta: !0
            })
        }
    } else if (n === "content_block_start") {
        let r = e.content_block;
        if (r && typeof r == "object") {
            let i = r.type,
                o = r.text;
            i === "text" && typeof o == "string" && o.length > 0 && t.push({
                text: o,
                isDelta: !1
            })
        }
    }
    return t
}
