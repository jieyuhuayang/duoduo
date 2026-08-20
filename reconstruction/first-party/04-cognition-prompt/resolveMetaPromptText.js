// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: mb, daemon.pretty.js:49196)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let e = cb(process.env.ALADUO_META_PROMPT_PATH),
        t = cb(process.env.ALADUO_BOOTSTRAP_DIR),
        n = [e, t ? Tm.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
    for (let r of n) try {
        if (!_U(r)) continue;
        let i = Rue(r, "utf8").trim();
        if (i.length > 0) return i
    } catch {}
}
