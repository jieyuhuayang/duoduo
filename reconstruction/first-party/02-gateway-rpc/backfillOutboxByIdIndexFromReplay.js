// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: backfillOutboxByIdIndexFromReplay  (minified: OI, daemon.pretty.js:37758)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function backfillOutboxByIdIndexFromReplay(paths, sessionKey) {
    let outboxReplayFilePath = resolveOutboxReplayFilePath(paths, sessionKey),
        content;
    try {
        content = await Tn.readFile(outboxReplayFilePath, "utf8")
    } catch {
        return
    }
    let offset = 0;
    for (let line of content.split(`
`)) {
        if (!line.trim()) {
            offset += Buffer.byteLength(line + `
`, "utf8");
            continue
        }
        try {
            let parsed = JSON.parse(line),
                byteLength = Buffer.byteLength(line + `
`, "utf8");
            await lookupOutboxByIdIndexEntry(paths, parsed.record_id) || await Tq(paths, {
                record_id: parsed.record_id,
                session_key: parsed.session_key,
                channel_kind: parsed.channel_kind,
                created_at: parsed.created_at,
                replay_offset: offset,
                replay_byte_length: byteLength
            }), offset += byteLength
        } catch {
            offset += Buffer.byteLength(line + `
`, "utf8");
            continue
        }
    }
}
