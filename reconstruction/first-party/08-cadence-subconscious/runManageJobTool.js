// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runManageJobTool  (minified: Ag, daemon.pretty.js:64121)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runManageJobTool(e, t) {
    let n = new Br(t.paths);
    await n.init();
    try {
        let r = e.action;
        if (r == null) throw new Error("action is required: create | list | read");
        switch (e.action) {
            case "create": {
                if (t.sessionKey?.startsWith("job:") === !0) {
                    if (t.callerJobCron !== "keepalive") throw new Error(hlt);
                    if (e.cron === "keepalive") throw new Error(glt)
                }
                if (!e.id || !e.cron || !e.instruction) throw new Error("Missing required arguments for 'create' action (id, cron, instruction)");
                if (e.stateless === !0 && e.cron === "keepalive") throw new Error(M6);
                let i = validateRunnableRuntimeValue(e.runtime, "This job");
                if (!i.ok) throw new Error(i.reason);
                let s = i.runtime ?? t.callerRuntime ?? resolveDefaultRuntime(),
                    a = e.model;
                if (a === void 0 || a.trim().length === 0) throw new Error(plt);
                if (containsWhitespaceChar(a)) throw new Error(`Invalid model id: ${JSON.stringify(a)}. A model id must not contain whitespace.`);
                if (s === "pi" && !isProviderQualifiedModelId(a)) throw new Error(`Invalid pi model id: ${JSON.stringify(a)}. Pi model ids use the canonical "provider/modelId" form. List what this host serves with a pi channel session's \`/model\`, or \`duoduo session model <pi-channel-session>\`.`);
                let u = e.effort;
                if (u !== void 0 && !isEffortLevel(u)) throw new Error(`Invalid effort: ${JSON.stringify(u)}. Accepted values are ${qi.join(", ")}.`);
                let l = e.acceptance;
                if (l === void 0 || l.trim().length === 0) throw new Error(mlt);
                let c = e.prompt_mode;
                if (c !== void 0 && s === "codex") throw new Error(Gut);
                if (s === "codex") {
                    let m = await checkCodexAvailability();
                    if (!m.ok) throw new Error(m.reason)
                }
                if (s === "grok") {
                    let m = await checkGrokAvailability();
                    if (!m.ok) throw new Error(m.reason)
                }
                let d = await n.createJob(e.id, {
                        cron: e.cron,
                        owner_session: t.sessionKey,
                        cwd_rel: e.cwd_rel,
                        runtime: s,
                        stateless: e.stateless,
                        model: a,
                        effort: u,
                        acceptance: l,
                        prompt_mode: c,
                        allowedTools: e.allowedTools,
                        disallowedTools: e.disallowedTools,
                        additionalDirectories: e.additionalDirectories,
                        claudeTools: e.extra_tools
                    }, e.instruction),
                    f = await n.getJob(e.id),
                    p = `Job '${e.id}' created successfully. Scheduled: ${e.cron}, Runtime: ${s}, Model: ${a}, Reports to: ${t.sessionKey??"(no owner)"}, Session: ${f?.session_key??"unknown"}, CWD: ${f?.execution_cwd??"unknown"}`;
                return d.staleSidecarQuarantined && (p += `
Warning: a stale state sidecar from a previous job with this id was found and quarantined at ${d.staleSidecarQuarantined}. The new job starts from fresh state (the old scheduling fields were not carried over).`), p += `
${Jut}`, t.bus?.emit("job.created", {
                    jobId: e.id
                }), p
            }
            case "read": {
                if (!e.id) throw new Error("Missing required argument 'id' for 'read' action");
                let i = await n.getWakeRecord(e.id).catch(() => null);
                if (i) return JSON.stringify({
                    id: i.id,
                    type: "wake",
                    owner_session: i.frontmatter.owner_session,
                    run_at: i.state.run_at ?? null,
                    created_at: i.frontmatter.created_at,
                    context: i.context
                }, null, 2);
                let o = await n.classifyActiveJob(e.id);
                if (o.kind === "invalid") return `Job '${e.id}': active job file exists but is invalid: ${o.reason}`;
                if (o.kind === "missing") {
                    let u = await n.getArchivedJob(e.id);
                    if (!u) return `Job '${e.id}' not found.`;
                    let {
                        content: l,
                        ...c
                    } = redactJobModelProfileTokens(u);
                    return `[ARCHIVED] Job '${e.id}' is archived — it is no longer scheduled. To run it again, create a new job (same or new id) with the instruction below; it starts with fresh state and a fresh session, and the archived session is not restored.
` + JSON.stringify({
                        ...c,
                        archived: !0,
                        usage_ledger_path: drainRecordPath(t.paths, u.session_key),
                        instruction: l
                    }, null, 2)
                }
                let {
                    content: s,
                    ...a
                } = redactJobModelProfileTokens(o.job);
                return JSON.stringify({
                    ...a,
                    usage_ledger_path: drainRecordPath(t.paths, o.job.session_key),
                    instruction: s
                }, null, 2)
            }
            case "list": {
                let i = await n.listJobs(),
                    o = (await n.listWakeRecords()).map(a => ({
                        id: a.id,
                        type: "wake",
                        owner_session: a.frontmatter.owner_session,
                        run_at: a.state.run_at ?? null,
                        created_at: a.frontmatter.created_at
                    }));
                if (i.length === 0 && o.length === 0) return "No active jobs found.";
                let s = i.map(a => {
                    let u = {
                        id: a.id,
                        type: "job",
                        cron: a.frontmatter.cron,
                        runtime: a.frontmatter.runtime ?? "claude",
                        model: a.frontmatter.model,
                        effort: a.frontmatter.effort,
                        owner_session: a.frontmatter.owner_session,
                        job_file_path: a.path,
                        state_file_path: a.path.replace(/\.md$/, ".state.json"),
                        usage_ledger_path: drainRecordPath(t.paths, a.session_key),
                        execution_cwd: a.execution_cwd,
                        runtime_workspace_dir: a.runtime_workspace_dir,
                        last_scheduled_at: a.state.last_scheduled_at ?? null,
                        run_at: a.state.run_at ?? null,
                        last_run: a.state.last_run_at,
                        last_result: a.state.last_result,
                        session_key: a.session_key
                    };
                    return a.frontmatter.cron === "keepalive" && (u.note = Wut), u
                });
                return JSON.stringify([...s, ...o], null, 2)
            }
            default: {
                let i = e.action;
                throw i === "archive" ? new Error(ylt) : i === "reschedule" ? new Error(_lt) : new Error(`Unknown action: ${i??"unknown"}`)
            }
        }
    } catch (r) {
        return logErrorMessage("[ManageJob] Tool execution failed", r), `Error: ${r instanceof Error?r.message:String(r)}`
    }
}
