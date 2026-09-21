// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: Xv, daemon.pretty.js:55069)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let e = Zv(process.env.ALADUO_META_PROMPT_PATH),
        t = Zv(process.env.ALADUO_BOOTSTRAP_DIR),
        n = [e, t ? dB.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
    for (let r of n) try {
        if (!cB(r)) continue;
        let i = Rhe(r, "utf8").trim();
        if (i.length > 0) return i
    } catch {}
}
