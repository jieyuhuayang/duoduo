// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: Sb, daemon.pretty.js:49396)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let e = _b(process.env.ALADUO_META_PROMPT_PATH),
        t = _b(process.env.ALADUO_BOOTSTRAP_DIR),
        n = [e, t ? rq.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
    for (let r of n) try {
        if (!nq(r)) continue;
        let i = zce(r, "utf8").trim();
        if (i.length > 0) return i
    } catch {}
}
