// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadChannelKindConfig  (minified: Wa, daemon.pretty.js:36800)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadChannelKindConfig(e, t) {
    let n = t.trim().toLowerCase();
    if (!ket(n)) return logWarnMessage(`[channel-config] invalid channel kind "${t}"`), null;
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
