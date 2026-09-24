// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runManageJobTool  (minified: cg, daemon.pretty.js:63802)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runManageJobTool(e, t) {
    let n = new Ur(t.paths);
    await n.init();
    try {
        let r = e.action;
        if (r == null) throw new Error("action is required: create | list | read");
        switch (e.action) {
            case "create": {
                if (t.sessionKey?.startsWith("job:") === !0) {
                    if (t.callerJobCron !== "keepalive") throw new Error(wat);
                    if (e.cron === "keepalive") throw new Error(Sat)
                }
                if (!e.id || !e.cron || !e.instruction) throw new Error("Missing required arguments for 'create' action (id, cron, instruction)");
                if (e.stateless === !0 && e.cron === "keepalive") throw new Error(NV);
                let o = e.runtime ?? t.callerRuntime ?? Co(),
                    s = e.model;
                if (s === void 0 || s.trim().length === 0) throw new Error(bat);
                if (zR(s)) throw new Error(`Invalid model id: ${JSON.stringify(s)}. A model id must not contain whitespace.`);
                if (o === "pi" && !UR(s)) throw new Error(`Invalid pi model id: ${JSON.stringify(s)}. Pi model ids use the canonical "provider/modelId" form. List what this host serves with a pi channel session's \`/model\`, or \`duoduo session model <pi-channel-session>\`.`);
                let a = e.effort;
                if (a !== void 0 && !isEffortLevel(a)) throw new Error(`Invalid effort: ${JSON.stringify(a)}. Accepted values are ${qi.join(", ")}.`);
                let u = e.acceptance;
                if (u === void 0 || u.trim().length === 0) throw new Error(vat);
                let l = e.prompt_mode;
                if (l !== void 0 && o === "codex") throw new Error(eat);
                if (o === "codex") {
                    let p = await checkCodexAvailability();
                    if (!p.ok) throw new Error(p.reason)
                }
                if (o === "grok") {
                    let p = await checkGrokAvailability();
                    if (!p.ok) throw new Error(p.reason)
                }
                let c = await n.createJob(e.id, {
                        cron: e.cron,
                        owner_session: t.sessionKey,
                        cwd_rel: e.cwd_rel,
                        runtime: o,
                        stateless: e.stateless,
                        model: s,
                        effort: a,
                        acceptance: u,
                        prompt_mode: l,
                        allowedTools: e.allowedTools,
                        disallowedTools: e.disallowedTools,
                        additionalDirectories: e.additionalDirectories,
                        claudeTools: e.extra_tools
                    }, e.instruction),
                    d = await n.getJob(e.id),
                    f = `Job '${e.id}' created successfully. Scheduled: ${e.cron}, Runtime: ${o}, Model: ${s}, Reports to: ${t.sessionKey??"(no owner)"}, Session: ${d?.session_key??"unknown"}, CWD: ${d?.execution_cwd??"unknown"}`;
                return c.staleSidecarQuarantined && (f += `
Warning: a stale state sidecar from a previous job with this id was found and quarantined at ${c.staleSidecarQuarantined}. The new job starts from fresh state (the old scheduling fields were not carried over).`), f += `
${Qst}`, t.bus?.emit("job.created", {
                    jobId: e.id
                }), f
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
                    } = Af(u);
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
                } = Af(o.job);
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
                    return a.frontmatter.cron === "keepalive" && (u.note = Xst), u
                });
                return JSON.stringify([...s, ...o], null, 2)
            }
            default: {
                let i = e.action;
                throw i === "archive" ? new Error(kat) : i === "reschedule" ? new Error(xat) : new Error(`Unknown action: ${i??"unknown"}`)
            }
        }
    } catch (r) {
        return Le("[ManageJob] Tool execution failed", r), `Error: ${r instanceof Error?r.message:String(r)}`
    }
}
