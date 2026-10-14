// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexDynamicTools  (minified: pN, daemon.pretty.js:80413)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.1, v0.5.4, v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 18 renamed — 0 from the code at the binding (rule), 18 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (high): Dynamic tools bridge: aladuo MCP tools available to Codex sessions
// changelog v0.5.1 (high): Codex foreground: register missing tools (`Skip`, `QueueOutboundAttachment`)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexDynamicTools(ctx) {
    let tools = [],
        isJob = ctx.sessionContextKind === "job",
        runtime = "codex",
        isMetaOrSystem = ctx.sessionContextKind === "meta" || ctx.sessionContextKind === "system";
    if (!isMetaOrSystem) {
        let jobInputSchema = isJob ? buildJobSessionInputSchema(runtime) : buildManageJobInputSchema(runtime);
        tools.push({
            name: Jw,
            description: isJob ? renderJobSessionToolDescription() : renderManageJobToolDescription(),
            inputSchema: buildCodexStringInputSchema(jobInputSchema),
            handler: async input => {
                let output = await runManageJobTool(input, {
                    paths: ctx.paths,
                    sessionKey: ctx.sessionKey,
                    callerJobCron: ctx.callerJobCron,
                    callerRuntime: runtime,
                    bus: ctx.bus
                });
                return {
                    success: !output.startsWith("Error:"),
                    text: output
                }
            }
        })
    }
    return tools.push({
        name: Qw,
        description: sO,
        inputSchema: buildCodexStringInputSchema(aO),
        handler: async input => {
            let output = await runViewSessionsTool(input, {
                paths: ctx.paths,
                sessionKey: ctx.sessionKey,
                getSessionStatus: ctx.getSessionStatus
            });
            return {
                success: !output.startsWith("Error:"),
                text: output
            }
        }
    }), tools.push({
        name: iS,
        description: renderNotifyToolDescription({
            sessionKey: ctx.sessionKey,
            sessionContextKind: ctx.sessionContextKind
        }),
        inputSchema: buildCodexStringInputSchema(buildNotifyInputSchema({
            sessionKey: ctx.sessionKey,
            sessionContextKind: ctx.sessionContextKind
        })),
        handler: async input => {
            let output = await runNotifyTool(input, {
                paths: ctx.paths,
                bus: ctx.bus,
                sessionKey: ctx.sessionKey,
                sessionContextKind: ctx.sessionContextKind,
                notifyDepth: ctx.notifyDepth,
                jobScheduleType: ctx.jobScheduleType
            });
            return output.startsWith("Error:") || ctx.onNotifyCalled?.(), {
                success: !output.startsWith("Error:"),
                text: output
            }
        }
    }), ctx.sessionContextKind === "foreground" && (tools.push({
        name: rp,
        description: wA,
        inputSchema: buildCodexStringInputSchema(SA),
        handler: async input => {
            let output = await runQueueOutboundAttachmentTool(input, {
                paths: ctx.paths,
                sessionKey: ctx.sessionKey
            });
            return {
                success: !output.startsWith("Error:"),
                text: output
            }
        }
    }), tools.push({
        name: Es,
        description: Bge,
        inputSchema: buildCodexStringInputSchema(q$),
        handler: async input => {
            let output = await runSkipTool(input, {
                paths: ctx.paths,
                bus: ctx.bus,
                sessionKey: ctx.sessionKey
            });
            return {
                success: !output.startsWith("Error:"),
                text: output
            }
        }
    })), isMetaOrSystem || tools.push({
        name: tS,
        description: isJob ? cO : uO,
        inputSchema: buildCodexStringInputSchema(isJob ? dO : lO),
        handler: async input => {
            let output = await runRemindDuoduoTool(input, {
                paths: ctx.paths,
                sessionKey: ctx.sessionKey,
                sessionContextKind: ctx.sessionContextKind
            });
            return {
                success: !output.startsWith("Error:"),
                text: output
            }
        }
    }), tools
}
