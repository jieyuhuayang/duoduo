// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAladuoMcpServer  (minified: Yg, daemon.pretty.js:79918)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAladuoMcpServer(e, t = {}) {
    let n = new vA({
            name: "aladuo",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {}
            }
        }),
        r = Object.freeze({
            "anthropic/alwaysLoad": !0
        }),
        i = t.sessionContextKind === "job";
    return t.sessionContextKind === "meta" || t.sessionContextKind === "system" || (n.registerTool(ww, {
        title: ww,
        description: i ? f$() : d$(),
        inputSchema: i ? m$(t.callerRuntime) : p$(t.callerRuntime),
        _meta: r
    }, async s => ({
        content: [{
            type: "text",
            text: await runManageJobTool(s, {
                paths: e,
                sessionKey: t.sessionKey,
                callerJobCron: t.callerJobCron,
                callerRuntime: t.callerRuntime,
                bus: t.bus
            })
        }]
    })), n.registerTool(Ew, {
        title: Ew,
        description: i ? v$ : _$,
        inputSchema: i ? w$ : b$,
        _meta: r
    }, async s => ({
        content: [{
            type: "text",
            text: await runRemindDuoduoTool(s, {
                paths: e,
                sessionKey: t.sessionKey,
                sessionContextKind: t.sessionContextKind
            })
        }]
    }))), n.registerTool(kw, {
        title: kw,
        description: g$,
        inputSchema: y$,
        _meta: r
    }, async s => ({
        content: [{
            type: "text",
            text: await runViewSessionsTool(s, {
                paths: e,
                sessionKey: t.sessionKey,
                getSessionStatus: t.getSessionStatus
            })
        }]
    })), t.sessionContextKind === "foreground" && (n.registerTool(qf, {
        title: qf,
        description: PO,
        inputSchema: CO,
        _meta: r
    }, async s => ({
        content: [{
            type: "text",
            text: await runQueueOutboundAttachmentTool(s, {
                paths: e,
                sessionKey: t.sessionKey
            })
        }]
    })), n.registerTool(ws, {
        title: ws,
        description: cB,
        inputSchema: lC,
        _meta: r
    }, async s => ({
        content: [{
            type: "text",
            text: await runSkipTool(s, {
                paths: e,
                bus: t.bus,
                sessionKey: t.sessionKey
            })
        }]
    }))), n.registerTool(Ow, {
        title: Ow,
        description: renderNotifyToolDescription({
            sessionKey: t.sessionKey,
            sessionContextKind: t.sessionContextKind
        }),
        inputSchema: buildNotifyInputSchema({
            sessionKey: t.sessionKey,
            sessionContextKind: t.sessionContextKind
        }),
        _meta: r
    }, async s => {
        let a = await runNotifyTool(s, {
            paths: e,
            bus: t.bus,
            sessionKey: t.sessionKey,
            sessionContextKind: t.sessionContextKind,
            notifyDepth: t.notifyDepth,
            jobScheduleType: t.jobScheduleType
        });
        return a.startsWith("Error:") || t.onNotifyCalled?.(), {
            content: [{
                type: "text",
                text: a
            }]
        }
    }), {
        type: "sdk",
        name: "aladuo",
        instance: n
    }
}
