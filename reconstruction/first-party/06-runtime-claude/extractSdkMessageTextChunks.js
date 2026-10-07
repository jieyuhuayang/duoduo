// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: extractSdkMessageTextChunks  (minified: H$, daemon.pretty.js:55032)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractSdkMessageTextChunks(e) {
    let t = [],
        n = e.content ?? e.message?.content ?? void 0;
    if (Array.isArray(n))
        for (let o of n) {
            if (!o || typeof o != "object") continue;
            let s = typeof o.type == "string" ? (o.type ?? "").toLowerCase() : "",
                a = o.delta,
                u = o.text;
            if (typeof a == "string" && a.length > 0) t.push({
                text: a,
                isDelta: !0
            });
            else if (typeof u == "string" && u.length > 0) {
                let l = s.includes("delta") || s.includes("partial");
                t.push({
                    text: u,
                    isDelta: l
                })
            }
        }
    let r = e.delta;
    typeof r == "string" && r.length > 0 && t.push({
        text: r,
        isDelta: !0
    });
    let i = e.text;
    return typeof i == "string" && i.length > 0 && t.push({
        text: i,
        isDelta: !1
    }), t
}
