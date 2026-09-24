// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexDynamicTools  (minified: wA, daemon.pretty.js:80065)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexDynamicTools(e) {
    let t = [],
        n = e.sessionContextKind === "job",
        r = "codex",
        i = e.sessionContextKind === "meta" || e.sessionContextKind === "system";
    if (!i) {
        let o = n ? m$(r) : p$(r);
        t.push({
            name: ww,
            description: n ? f$() : d$(),
            inputSchema: buildCodexStringInputSchema(o),
            handler: async s => {
                let a = await runManageJobTool(s, {
                    paths: e.paths,
                    sessionKey: e.sessionKey,
                    callerJobCron: e.callerJobCron,
                    callerRuntime: r,
                    bus: e.bus
                });
                return {
                    success: !a.startsWith("Error:"),
                    text: a
                }
            }
        })
    }
    return t.push({
        name: kw,
        description: g$,
        inputSchema: buildCodexStringInputSchema(y$),
        handler: async o => {
            let s = await runViewSessionsTool(o, {
                paths: e.paths,
                sessionKey: e.sessionKey,
                getSessionStatus: e.getSessionStatus
            });
            return {
                success: !s.startsWith("Error:"),
                text: s
            }
        }
    }), t.push({
        name: Ow,
        description: renderNotifyToolDescription({
            sessionKey: e.sessionKey,
            sessionContextKind: e.sessionContextKind
        }),
        inputSchema: buildCodexStringInputSchema(buildNotifyInputSchema({
            sessionKey: e.sessionKey,
            sessionContextKind: e.sessionContextKind
        })),
        handler: async o => {
            let s = await runNotifyTool(o, {
                paths: e.paths,
                bus: e.bus,
                sessionKey: e.sessionKey,
                sessionContextKind: e.sessionContextKind,
                notifyDepth: e.notifyDepth,
                jobScheduleType: e.jobScheduleType
            });
            return s.startsWith("Error:") || e.onNotifyCalled?.(), {
                success: !s.startsWith("Error:"),
                text: s
            }
        }
    }), e.sessionContextKind === "foreground" && (t.push({
        name: qf,
        description: PO,
        inputSchema: buildCodexStringInputSchema(CO),
        handler: async o => {
            let s = await runQueueOutboundAttachmentTool(o, {
                paths: e.paths,
                sessionKey: e.sessionKey
            });
            return {
                success: !s.startsWith("Error:"),
                text: s
            }
        }
    }), t.push({
        name: ws,
        description: whe,
        inputSchema: buildCodexStringInputSchema(lC),
        handler: async o => {
            let s = await runSkipTool(o, {
                paths: e.paths,
                bus: e.bus,
                sessionKey: e.sessionKey
            });
            return {
                success: !s.startsWith("Error:"),
                text: s
            }
        }
    })), i || t.push({
        name: Ew,
        description: n ? v$ : _$,
        inputSchema: buildCodexStringInputSchema(n ? w$ : b$),
        handler: async o => {
            let s = await runRemindDuoduoTool(o, {
                paths: e.paths,
                sessionKey: e.sessionKey,
                sessionContextKind: e.sessionContextKind
            });
            return {
                success: !s.startsWith("Error:"),
                text: s
            }
        }
    }), t
}
