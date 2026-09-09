// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: jb, daemon.pretty.js:49943)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let e = Ab(process.env.ALADUO_META_PROMPT_PATH),
        t = Ab(process.env.ALADUO_BOOTSTRAP_DIR),
        n = [e, t ? Nq.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
    for (let r of n) try {
        if (!Aq(r)) continue;
        let i = Ode(r, "utf8").trim();
        if (i.length > 0) return i
    } catch {}
}
