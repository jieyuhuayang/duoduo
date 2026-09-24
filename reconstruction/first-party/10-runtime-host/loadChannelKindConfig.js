// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadChannelKindConfig  (minified: ys, daemon.pretty.js:36674)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadChannelKindConfig(e, t) {
    let n = t.trim().toLowerCase();
    if (!TXe(n)) return Z(`[channel-config] invalid channel kind "${t}"`), null;
    let r = Ale.join(e, `${n}.md`),
        i = await Dle(r);
    if (i.status !== "ok") return null;
    let o = parseChannelConfigFields(i.data);
    FR(r, o.claudeModelProfileIssues), FR(r, o.claudeModelAliasIssues, "claude.model_aliases");
    let s = PXe(i.body);
    return {
        channel_kind: n,
        ...o,
        channel_prompt: s,
        kind_config: $R(i.data, n, r)
    }
}
