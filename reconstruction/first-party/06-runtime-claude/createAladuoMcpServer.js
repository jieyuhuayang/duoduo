// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAladuoMcpServer  (minified: by, daemon.pretty.js:80220)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAladuoMcpServer(e, t = {}) {
    let n = new fN({
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
    return t.sessionContextKind === "meta" || t.sessionContextKind === "system" || (n.registerTool(Jw, {
        title: Jw,
        description: i ? renderJobSessionToolDescription() : renderManageJobToolDescription(),
        inputSchema: i ? buildJobSessionInputSchema(t.callerRuntime) : buildManageJobInputSchema(t.callerRuntime),
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
    })), n.registerTool(tS, {
        title: tS,
        description: i ? cO : uO,
        inputSchema: i ? dO : lO,
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
    }))), n.registerTool(Qw, {
        title: Qw,
        description: sO,
        inputSchema: aO,
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
    })), t.sessionContextKind === "foreground" && (n.registerTool(ip, {
        title: ip,
        description: wA,
        inputSchema: SA,
        _meta: r
    }, async s => ({
        content: [{
            type: "text",
            text: await runQueueOutboundAttachmentTool(s, {
                paths: e,
                sessionKey: t.sessionKey
            })
        }]
    })), n.registerTool(Es, {
        title: Es,
        description: fV,
        inputSchema: q$,
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
    }))), n.registerTool(iS, {
        title: iS,
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
