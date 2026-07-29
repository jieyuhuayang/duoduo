// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: w_, daemon.pretty.js:48235)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let e = y_(process.env.ALADUO_META_PROMPT_PATH),
        t = y_(process.env.ALADUO_BOOTSTRAP_DIR),
        n = [e, t ? qp.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
    for (let r of n) try {
        if (!Nz(r)) continue;
        let i = Koe(r, "utf8").trim();
        if (i.length > 0) return i
    } catch {}
}
