// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: b_, daemon.pretty.js:57166)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
 let e = h_(process.env.ALADUO_META_PROMPT_PATH),
  t = h_(process.env.ALADUO_BOOTSTRAP_DIR),
  n = [e, t ? Wp.join(t, "meta-prompt.md") : void 0].filter(r => !!r);
 for (let r of n) try {
  if (!nU(r)) continue;
  let i = Yue(r, "utf8")
   .trim();
  if (i.length > 0) return i
 } catch {}
}
