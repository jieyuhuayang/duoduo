// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: extractCodexGeneratedImageAttachment  (minified: rme, daemon.pretty.js:59410)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractCodexGeneratedImageAttachment(e) {
    let t = [e],
        n = new Set;
    for (; t.length > 0;) {
        let r = t.pop();
        if (!(!Db(r) || n.has(r))) {
            if (n.add(r), tme(r)) {
                let i = r.saved_path ?? r.savedPath;
                if (typeof i == "string" && i.trim().length > 0) return {
                    path: i,
                    mime: "image/png"
                };
                let o = r.result,
                    s = r.call_id ?? r.callId ?? r.id;
                if (typeof o == "string" && o.trim().length > 0 && typeof s == "string" && s.trim().length > 0) return {
                    inlineBase64: o.trim(),
                    callId: s.trim()
                }
            }
            for (let i of ["payload", "event", "msg", "item"]) {
                let o = r[i];
                Db(o) && t.push(o)
            }
        }
    }
    return null
}
