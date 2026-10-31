// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runManageJobTool  (minified: Hg, daemon.pretty.js:65392)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.12, v0.4.0, v0.4.4, v0.4.5, v0.5.0, v0.5.4, v0.5.6, v0.6.2, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.2, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 30 renamed — 9 from the code at the binding (rule), 21 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (medium): Add `runtime` parameter to job definitions (`"claude"` | `"codex"`)
// changelog v0.4.5 (high): **`ManageJob(list)` improvements**: every entry now includes `session_key` (for notify routing) and `runtime` (claude/codex). Keepalive entries carry a `note` explaining the dormant-but-wakeable lifecycle.
// changelog v0.5.4 (high): `stateless` is rejected on keepalive jobs, whose whole point is a persistent lifecycle.
// changelog v0.8.3 (high): **`ManageJob` requires `action`.** A call without it used to be answered with the job list and no error
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runManageJobTool(input, ctx) {
    let jobManager = new Jr(ctx.paths);
    await jobManager.init();
    try {
        let action = input.action;
        if (action == null) throw new Error("action is required: create | list | read");
        switch (input.action) {
            case "create": {
                if (ctx.sessionKey?.startsWith("job:") === !0) {
                    if (ctx.callerJobCron !== "keepalive") throw new Error(Odt);
                    if (input.cron === "keepalive") throw new Error(Adt)
                }
                if (!input.id || !input.cron || !input.instruction) throw new Error("Missing required arguments for 'create' action (id, cron, instruction)");
                if (input.stateless === !0 && input.cron === "keepalive") throw new Error(a6);
                let runtimeCheck = validateRunnableRuntimeValue(input.runtime, "This job");
                if (!runtimeCheck.ok) throw new Error(runtimeCheck.reason);
                let runtime = runtimeCheck.runtime ?? ctx.callerRuntime ?? resolveDefaultRuntime(),
                    model = input.model;
                if (model === void 0 || model.trim().length === 0) throw new Error($dt);
                if (containsWhitespaceChar(model)) throw new Error(`Invalid model id: ${JSON.stringify(model)}. A model id must not contain whitespace.`);
                if (runtime === "pi" && !isProviderQualifiedModelId(model)) throw new Error(`Invalid pi model id: ${JSON.stringify(model)}. Pi model ids use the canonical "provider/modelId" form. List what this host serves with a pi channel session's \`/model\`, or \`duoduo session model <pi-channel-session>\`.`);
                let effort = input.effort;
                if (effort !== void 0 && !isEffortLevel(effort)) throw new Error(`Invalid effort: ${JSON.stringify(effort)}. Accepted values are ${Gi.join(", ")}.`);
                let acceptance = input.acceptance;
                if (acceptance === void 0 || acceptance.trim().length === 0) throw new Error(Cdt);
                let promptMode = input.prompt_mode;
                if (promptMode !== void 0 && runtime === "codex") throw new Error(ddt);
                if (runtime === "codex") {
                    let codexAvailability = await checkCodexAvailability();
                    if (!codexAvailability.ok) throw new Error(codexAvailability.reason)
                }
                if (runtime === "grok") {
                    let grokAvailability = await checkGrokAvailability();
                    if (!grokAvailability.ok) throw new Error(grokAvailability.reason)
                }
                let createResult = await jobManager.createJob(input.id, {
                        cron: input.cron,
                        owner_session: ctx.sessionKey,
                        cwd_rel: input.cwd_rel,
                        runtime,
                        stateless: input.stateless,
                        model,
                        effort,
                        acceptance,
                        prompt_mode: promptMode,
                        allowedTools: input.allowedTools,
                        disallowedTools: input.disallowedTools,
                        additionalDirectories: input.additionalDirectories,
                        claudeTools: input.extra_tools
                    }, input.instruction),
                    createdJob = await jobManager.getJob(input.id),
                    message = `Job '${input.id}' created successfully. Scheduled: ${input.cron}, Runtime: ${runtime}, Model: ${model}, Reports to: ${ctx.sessionKey??"(no owner)"}, Session: ${createdJob?.session_key??"unknown"}, CWD: ${createdJob?.execution_cwd??"unknown"}`;
                return createResult.staleSidecarQuarantined && (message += `
Warning: a stale state sidecar from a previous job with this id was found and quarantined at ${createResult.staleSidecarQuarantined}. The new job starts from fresh state (the old scheduling fields were not carried over).`), message += `
${cdt}`, ctx.bus?.emit("job.created", {
                    jobId: input.id
                }), message
            }
            case "read": {
                if (!input.id) throw new Error("Missing required argument 'id' for 'read' action");
                let wakeRecord = await jobManager.getWakeRecord(input.id).catch(() => null);
                if (wakeRecord) return JSON.stringify({
                    id: wakeRecord.id,
                    type: "wake",
                    owner_session: wakeRecord.frontmatter.owner_session,
                    run_at: wakeRecord.state.run_at ?? null,
                    created_at: wakeRecord.frontmatter.created_at,
                    context: wakeRecord.context
                }, null, 2);
                let activeJob = await jobManager.classifyActiveJob(input.id);
                if (activeJob.kind === "invalid") return `Job '${input.id}': active job file exists but is invalid: ${activeJob.reason}`;
                if (activeJob.kind === "missing") {
                    let archivedJob = await jobManager.getArchivedJob(input.id);
                    if (!archivedJob) return `Job '${input.id}' not found.`;
                    let {
                        content,
                        ...archivedFields
                    } = redactJobModelProfileTokens(archivedJob);
                    return `[ARCHIVED] Job '${input.id}' is archived — it is no longer scheduled. To run it again, create a new job (same or new id) with the instruction below; it starts with fresh state and a fresh session, and the archived session is not restored.
` + JSON.stringify({
                        ...archivedFields,
                        archived: !0,
                        usage_ledger_path: drainRecordPath(ctx.paths, archivedJob.session_key),
                        instruction: content
                    }, null, 2)
                }
                let {
                    content,
                    ...jobFields
                } = redactJobModelProfileTokens(activeJob.job);
                return JSON.stringify({
                    ...jobFields,
                    usage_ledger_path: drainRecordPath(ctx.paths, activeJob.job.session_key),
                    instruction: content
                }, null, 2)
            }
            case "list": {
                let jobs = await jobManager.listJobs(),
                    wakeEntries = (await jobManager.listWakeRecords()).map(wakeRecord => ({
                        id: wakeRecord.id,
                        type: "wake",
                        owner_session: wakeRecord.frontmatter.owner_session,
                        run_at: wakeRecord.state.run_at ?? null,
                        created_at: wakeRecord.frontmatter.created_at
                    }));
                if (jobs.length === 0 && wakeEntries.length === 0) return "No active jobs found.";
                let jobEntries = jobs.map(job => {
                    let entry = {
                        id: job.id,
                        type: "job",
                        cron: job.frontmatter.cron,
                        runtime: job.frontmatter.runtime ?? "claude",
                        model: job.frontmatter.model,
                        effort: job.frontmatter.effort,
                        owner_session: job.frontmatter.owner_session,
                        job_file_path: job.path,
                        state_file_path: job.path.replace(/\.md$/, ".state.json"),
                        usage_ledger_path: drainRecordPath(ctx.paths, job.session_key),
                        execution_cwd: job.execution_cwd,
                        runtime_workspace_dir: job.runtime_workspace_dir,
                        last_scheduled_at: job.state.last_scheduled_at ?? null,
                        run_at: job.state.run_at ?? null,
                        last_run: job.state.last_run_at,
                        last_result: job.state.last_result,
                        session_key: job.session_key
                    };
                    return job.frontmatter.cron === "keepalive" && (entry.note = ldt), entry
                });
                return JSON.stringify([...jobEntries, ...wakeEntries], null, 2)
            }
            default: {
                let action = input.action;
                throw action === "archive" ? new Error(Ndt) : action === "reschedule" ? new Error(Ddt) : new Error(`Unknown action: ${action??"unknown"}`)
            }
        }
    } catch (err) {
        return logErrorMessage("[ManageJob] Tool execution failed", err), `Error: ${err instanceof Error?err.message:String(err)}`
    }
}
