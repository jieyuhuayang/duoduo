// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: scanAndSpawnDueJobs  (minified: yJ, daemon.pretty.js:86494)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scanAndSpawnDueJobs(e, t, n) {
    let r = new Ur(e);
    await r.init();
    let i = await r.listJobs(),
        o = n?.now ?? new Date,
        s = [],
        a = await fireDueWakeRecords(e, r, o, n?.bus);
    for (let u of i) {
        let l = u.state.last_scheduled_at ?? u.state.last_run_at,
            c = u.state.last_scheduled_at ? new Date(u.state.last_scheduled_at).getTime() : Number.NaN,
            d = u.state.last_run_started_at ? new Date(u.state.last_run_started_at).getTime() : Number.NaN,
            f = !Number.isFinite(d) || Number.isFinite(c) && d < c;
        if (isOneShotJobSchedule(u.frontmatter.cron) && u.state.last_scheduled_at && f && (u.state.last_result === "unknown" || u.state.last_result === "failure") && (l = null), !isJobScheduleDue(u.frontmatter.cron, l, o, u.frontmatter.created_at, u.state.run_at ?? null)) continue;
        if (u.state.last_result === "failure" && u.state.last_scheduled_at) {
            let v = new Date(u.state.last_scheduled_at).getTime();
            if (o.getTime() - v < 3e5) {
                Re("[cadence] skip due job: failure backoff", {
                    jobId: u.id,
                    lastScheduledAt: u.state.last_scheduled_at,
                    backoffMs: 3e5
                });
                continue
            }
        }
        let p = vc({
            jobId: u.id,
            cron: u.frontmatter.cron,
            cwdRel: u.frontmatter.cwd_rel
        });
        if (isSessionArchiving(p)) {
            Re("[cadence] skip due job: session is being archived", {
                jobId: u.id,
                sessionKey: p
            });
            continue
        }
        let m = t.getActor(p);
        if (m && m.status !== "ended") {
            Re("[cadence] skip due job: already running", {
                jobId: u.id,
                sessionKey: p,
                actorStatus: m.status
            });
            continue
        }
        try {
            await r.updateState(u.id, {
                last_scheduled_at: o.toISOString()
            })
        } catch (y) {
            Z("[cadence] skip due job: claim state write failed, retrying next scan", {
                jobId: u.id,
                error: y instanceof Error ? y.message : String(y)
            });
            continue
        }
        let h = createSpineEvent({
            type: "job.spawn",
            source: {
                kind: "cadence",
                name: "job-scanner"
            },
            session_key: p,
            payload: {
                job_id: u.id,
                cron: u.frontmatter.cron,
                tick: {
                    run_number: (u.state.run_count ?? 0) + 1,
                    triggered_at: o.toISOString(),
                    previous_run_at: u.state.last_run_at ?? null
                }
            }
        });
        await atomicAppendEvent(e, h);
        let g = `- [ ] @evt(${h.id}) job:${u.id}`;
        await enqueueSessionInboxLine(e, p, g), t.spawnJobSession(u.id, p), s.push(u.id), te("[cadence] spawned due job", {
            jobId: u.id,
            sessionKey: p,
            cron: u.frontmatter.cron
        })
    }
    return Re("[cadence] job scan complete", {
        scanned: i.length,
        spawned: s.length,
        wakesFired: a.length
    }), {
        scanned: i.length,
        spawned: s,
        wakesFired: a
    }
}
