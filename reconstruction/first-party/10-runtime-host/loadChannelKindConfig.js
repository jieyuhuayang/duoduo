// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadChannelKindConfig  (minified: Wa, daemon.pretty.js:36800)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadChannelKindConfig(e, t) {
    let n = t.trim().toLowerCase();
    if (!ket(n)) return Z(`[channel-config] invalid channel kind "${t}"`), null;
    let r = Zce.join(e, `${n}.md`),
        i = await Yce(r);
    if (i.status !== "ok") return null;
    let o = parseChannelConfigFields(i.data);
    yI(r, o.claudeModelProfileIssues), yI(r, o.claudeModelAliasIssues, "claude.model_aliases");
    let s = xet(i.body);
    return {
        channel_kind: n,
        ...o,
        channel_prompt: s,
        kind_config: dI(i.data, n, r)
    }
}
