// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readChannelDescriptor  (minified: Is, daemon.pretty.js:37180)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readChannelDescriptor(paths, channelId) {
    let descriptorPath;
    try {
        descriptorPath = yv(paths, channelId)
    } catch {
        return null
    }
    let content;
    try {
        content = await gh.readFile(descriptorPath, "utf8")
    } catch {
        return null
    }
    let {
        fm,
        body
    } = NI(content);
    if (!Rq(fm, channelId)) return null;
    let frontMatter = fm,
        channelConfigFields = parseChannelConfigFields(frontMatter),
        extraFields = Wde(frontMatter);
    return {
        schema_version: fm.schema_version,
        revision: fm.revision,
        channel_id: fm.channel_id,
        channel_kind: fm.channel_kind,
        display_name: dv(frontMatter.display_name),
        ...channelConfigFields,
        ...extraFields,
        channel_prompt: body.trim(),
        kind_config: OI(frontMatter, fm.channel_kind, descriptorPath)
    }
}
