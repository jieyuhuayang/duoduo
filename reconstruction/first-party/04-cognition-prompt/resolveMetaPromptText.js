// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: Xv, daemon.pretty.js:55069)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let e = normalizeOptionalEnvString(process.env.ALADUO_META_PROMPT_PATH),
        t = normalizeOptionalEnvString(process.env.ALADUO_BOOTSTRAP_DIR),
        n = [e, t ? fB.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
    for (let r of n) try {
        if (!dB(r)) continue;
        let i = Ihe(r, "utf8").trim();
        if (i.length > 0) return i
    } catch {}
}
