// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: scanAndSpawnDueJobs  (minified: uK, daemon.pretty.js:88164)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.12, v0.3.0, v0.4.5, v0.5.0, v0.5.6, v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 19 renamed — 3 from the code at the binding (rule), 16 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Cadence scheduler skips due jobs whose session is being archived
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scanAndSpawnDueJobs(paths, sessionManager, options) {
    let jobManager = new Jr(paths);
    await jobManager.init();
    let jobs = await jobManager.listJobs(),
        now = options?.now ?? new Date,
        spawned = [],
        wakesFired = await fireDueWakeRecords(paths, jobManager, now, options?.bus);
    for (let job of jobs) {
        let lastRunAt = job.state.last_scheduled_at ?? job.state.last_run_at,
            lastScheduledMs = job.state.last_scheduled_at ? new Date(job.state.last_scheduled_at).getTime() : Number.NaN,
            lastRunStartedMs = job.state.last_run_started_at ? new Date(job.state.last_run_started_at).getTime() : Number.NaN,
            claimNotStarted = !Number.isFinite(lastRunStartedMs) || Number.isFinite(lastScheduledMs) && lastRunStartedMs < lastScheduledMs;
        if (isOneShotJobSchedule(job.frontmatter.cron) && job.state.last_scheduled_at && claimNotStarted && (job.state.last_result === "unknown" || job.state.last_result === "failure") && (lastRunAt = null), !isJobScheduleDue(job.frontmatter.cron, lastRunAt, now, job.frontmatter.created_at, job.state.run_at ?? null)) continue;
        if (job.state.last_result === "failure" && job.state.last_scheduled_at) {
            let failureScheduledMs = new Date(job.state.last_scheduled_at).getTime();
            if (now.getTime() - failureScheduledMs < 3e5) {
                logDebugMessage("[cadence] skip due job: failure backoff", {
                    jobId: job.id,
                    lastScheduledAt: job.state.last_scheduled_at,
                    backoffMs: 3e5
                });
                continue
            }
        }
        let jobSessionKey = buildJobSessionKey({
            jobId: job.id,
            cron: job.frontmatter.cron,
            cwdRel: job.frontmatter.cwd_rel
        });
        if (isSessionArchiving(jobSessionKey)) {
            logDebugMessage("[cadence] skip due job: session is being archived", {
                jobId: job.id,
                sessionKey: jobSessionKey
            });
            continue
        }
        let actor = sessionManager.getActor(jobSessionKey);
        if (actor && actor.status !== "ended") {
            logDebugMessage("[cadence] skip due job: already running", {
                jobId: job.id,
                sessionKey: jobSessionKey,
                actorStatus: actor.status
            });
            continue
        }
        try {
            await jobManager.updateState(job.id, {
                last_scheduled_at: now.toISOString()
            })
        } catch (err) {
            logWarnMessage("[cadence] skip due job: claim state write failed, retrying next scan", {
                jobId: job.id,
                error: err instanceof Error ? err.message : String(err)
            });
            continue
        }
        let spineEvent = createSpineEvent({
            type: "job.spawn",
            source: {
                kind: "cadence",
                name: "job-scanner"
            },
            session_key: jobSessionKey,
            payload: {
                job_id: job.id,
                cron: job.frontmatter.cron,
                tick: {
                    run_number: (job.state.run_count ?? 0) + 1,
                    triggered_at: now.toISOString(),
                    previous_run_at: job.state.last_run_at ?? null
                }
            }
        });
        await atomicAppendEvent(paths, spineEvent);
        let inboxLine = `- [ ] @evt(${spineEvent.id}) job:${job.id}`;
        await enqueueSessionInboxLine(paths, jobSessionKey, inboxLine), sessionManager.spawnJobSession(job.id, jobSessionKey), spawned.push(job.id), logInfoMessage("[cadence] spawned due job", {
            jobId: job.id,
            sessionKey: jobSessionKey,
            cron: job.frontmatter.cron
        })
    }
    return logDebugMessage("[cadence] job scan complete", {
        scanned: jobs.length,
        spawned: spawned.length,
        wakesFired: wakesFired.length
    }), {
        scanned: jobs.length,
        spawned,
        wakesFired
    }
}
