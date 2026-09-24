// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: replyToGatewayCommandEvent  (minified: LXe, daemon.pretty.js:87362)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function replyToGatewayCommandEvent(e, t, n, r) {
    let i = FXe(t);
    if (!i) return {
        handled: !1
    };
    let o = t.session_key ?? "gateway:offline",
        s = await executeGatewayCommand(e, i, o, r, {
            sourceKind: t.source.kind,
            sourceChannelId: t.source.channel_id
        });
    s.noticeSummary && await patchSessionRuntimeState(e, o, {
        pending_gateway_notice: {
            source: "gateway_command",
            command: i.raw,
            command_name: i.name,
            result_summary: s.noticeSummary,
            created_at: new Date().toISOString()
        }
    });
    let a = o.includes(":") ? o.split(":")[0] : t.source.kind,
        u = Hl({
            channel_kind: a,
            session_key: o,
            in_reply_to_event_id: t.id,
            payload: {
                text: s.responseText,
                data: {
                    ...s.data ?? {},
                    gateway_command: i.name
                }
            }
        });
    await Wl(e, u);
    let l = createSpineEvent({
        type: "agent.result",
        source: {
            kind: "gateway",
            name: "gateway"
        },
        session_key: o,
        payload: {
            outbox_id: u.id,
            text: s.responseText,
            command: i.raw,
            command_name: i.name
        }
    });
    return await atomicAppendEvent(e, l), n && (n.emit("session.output", {
        sessionKey: o,
        record: u
    }), n.emit("spine.event", l)), {
        handled: !0,
        responseText: s.responseText,
        outboxId: u.id
    }
}
