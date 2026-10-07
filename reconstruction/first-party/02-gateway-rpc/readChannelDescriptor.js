// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readChannelDescriptor  (minified: vs, daemon.pretty.js:35849)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readChannelDescriptor(e, t) {
    let n;
    try {
        n = Kb(e, t)
    } catch {
        return null
    }
    let r;
    try {
        r = await oh.readFile(n, "utf8")
    } catch {
        return null
    }
    let {
        fm: i,
        body: o
    } = fI(r);
    if (!ZU(i, t)) return null;
    let s = i,
        a = parseChannelConfigFields(s),
        u = yce(s);
    return {
        schema_version: i.schema_version,
        revision: i.revision,
        channel_id: i.channel_id,
        channel_kind: i.channel_kind,
        display_name: Hb(s.display_name),
        ...a,
        ...u,
        channel_prompt: o.trim(),
        kind_config: dI(s, i.channel_kind, n)
    }
}
