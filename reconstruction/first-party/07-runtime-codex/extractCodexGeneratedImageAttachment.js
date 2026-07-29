// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: extractCodexGeneratedImageAttachment  (minified: Jle, daemon.pretty.js:58042)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractCodexGeneratedImageAttachment(e) {
    let t = [e],
        n = new Set;
    for (; t.length > 0;) {
        let r = t.pop();
        if (!(!B_(r) || n.has(r))) {
            if (n.add(r), Vle(r)) {
                let i = r.saved_path ?? r.savedPath;
                if (typeof i == "string" && i.trim().length > 0) return {
                    path: i,
                    mime: "image/png"
                };
                let s = r.result,
                    o = r.call_id ?? r.callId ?? r.id;
                if (typeof s == "string" && s.trim().length > 0 && typeof o == "string" && o.trim().length > 0) return {
                    inlineBase64: s.trim(),
                    callId: o.trim()
                }
            }
            for (let i of ["payload", "event", "msg", "item"]) {
                let s = r[i];
                B_(s) && t.push(s)
            }
        }
    }
    return null
}
