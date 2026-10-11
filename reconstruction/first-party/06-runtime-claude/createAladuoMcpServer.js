// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAladuoMcpServer  (minified: by, daemon.pretty.js:80220)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.0, v0.4.4, v0.5.2, v0.5.4, v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 12 renamed — 0 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAladuoMcpServer(paths, options = {}) {
    let server = new fN({
            name: "aladuo",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {}
            }
        }),
        toolMeta = Object.freeze({
            "anthropic/alwaysLoad": !0
        }),
        isJobSession = options.sessionContextKind === "job";
    return options.sessionContextKind === "meta" || options.sessionContextKind === "system" || (server.registerTool(Jw, {
        title: Jw,
        description: isJobSession ? renderJobSessionToolDescription() : renderManageJobToolDescription(),
        inputSchema: isJobSession ? buildJobSessionInputSchema(options.callerRuntime) : buildManageJobInputSchema(options.callerRuntime),
        _meta: toolMeta
    }, async args => ({
        content: [{
            type: "text",
            text: await runManageJobTool(args, {
                paths,
                sessionKey: options.sessionKey,
                callerJobCron: options.callerJobCron,
                callerRuntime: options.callerRuntime,
                bus: options.bus
            })
        }]
    })), server.registerTool(tS, {
        title: tS,
        description: isJobSession ? cO : uO,
        inputSchema: isJobSession ? dO : lO,
        _meta: toolMeta
    }, async args => ({
        content: [{
            type: "text",
            text: await runRemindDuoduoTool(args, {
                paths,
                sessionKey: options.sessionKey,
                sessionContextKind: options.sessionContextKind
            })
        }]
    }))), server.registerTool(Qw, {
        title: Qw,
        description: sO,
        inputSchema: aO,
        _meta: toolMeta
    }, async args => ({
        content: [{
            type: "text",
            text: await runViewSessionsTool(args, {
                paths,
                sessionKey: options.sessionKey,
                getSessionStatus: options.getSessionStatus
            })
        }]
    })), options.sessionContextKind === "foreground" && (server.registerTool(ip, {
        title: ip,
        description: wA,
        inputSchema: SA,
        _meta: toolMeta
    }, async args => ({
        content: [{
            type: "text",
            text: await runQueueOutboundAttachmentTool(args, {
                paths,
                sessionKey: options.sessionKey
            })
        }]
    })), server.registerTool(Es, {
        title: Es,
        description: fV,
        inputSchema: q$,
        _meta: toolMeta
    }, async args => ({
        content: [{
            type: "text",
            text: await runSkipTool(args, {
                paths,
                bus: options.bus,
                sessionKey: options.sessionKey
            })
        }]
    }))), server.registerTool(iS, {
        title: iS,
        description: renderNotifyToolDescription({
            sessionKey: options.sessionKey,
            sessionContextKind: options.sessionContextKind
        }),
        inputSchema: buildNotifyInputSchema({
            sessionKey: options.sessionKey,
            sessionContextKind: options.sessionContextKind
        }),
        _meta: toolMeta
    }, async args => {
        let resultText = await runNotifyTool(args, {
            paths,
            bus: options.bus,
            sessionKey: options.sessionKey,
            sessionContextKind: options.sessionContextKind,
            notifyDepth: options.notifyDepth,
            jobScheduleType: options.jobScheduleType
        });
        return resultText.startsWith("Error:") || options.onNotifyCalled?.(), {
            content: [{
                type: "text",
                text: resultText
            }]
        }
    }), {
        type: "sdk",
        name: "aladuo",
        instance: server
    }
}
