// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: eventToMessageGenerator  (minified: Fq, daemon.pretty.js:50032)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* eventToMessageGenerator(e, t, n) {
    let r = [];
    if (t && t.length > 0)
        for (let o of t) {
            let s = h7e(o, n);
            s && r.push(s)
        }
    let i = typeof e == "string" ? e ? [{
        type: "text",
        text: e
    }] : [] : e.filter(o => o.text).map(o => ({
        type: "text",
        text: o.text
    }));
    r.length > 0 || i.length > 1 ? yield {
        type: "user",
        message: {
            role: "user",
            content: [...i, ...r]
        }
    } : yield {
        type: "user",
        message: {
            role: "user",
            content: i.length > 0 ? i[0].text : ""
        }
    }
}
