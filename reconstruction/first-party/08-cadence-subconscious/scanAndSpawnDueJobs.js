// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: scanAndSpawnDueJobs  (minified: F2, daemon.pretty.js:74986)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scanAndSpawnDueJobs(e, t, n) {
    let r = new rs(e);
    await r.init();
    let i = await r.listJobs(),
        s = n?.now ?? new Date,
        o = [];
    for (let a of i) {
        let c = a.state.last_scheduled_at ?? a.state.last_run_at,
            u = a.state.last_scheduled_at ? new Date(a.state.last_scheduled_at).getTime() : Number.NaN,
            l = a.state.last_run_started_at ? new Date(a.state.last_run_started_at).getTime() : Number.NaN,
            d = !Number.isFinite(l) || Number.isFinite(u) && l < u;
        if (nR(a.frontmatter.cron) && a.state.last_scheduled_at && d && (a.state.last_result === "unknown" || a.state.last_result === "failure") && (c = null), !Tue(a.frontmatter.cron, c, s, a.frontmatter.created_at, a.state.run_at ?? null)) continue;
        if (a.state.last_result === "failure" && a.state.last_scheduled_at) {
            let b = new Date(a.state.last_scheduled_at).getTime();
            if (s.getTime() - b < 3e5) {
                Pe("[cadence] skip due job: failure backoff", {
                    jobId: a.id,
                    lastScheduledAt: a.state.last_scheduled_at,
                    backoffMs: 3e5
                });
                continue
            }
        }
        let p = im({
            jobId: a.id,
            ownerSession: a.frontmatter.owner_session,
            cron: a.frontmatter.cron,
            cwdRel: a.frontmatter.cwd_rel
        });
        if (lr(p)) {
            Pe("[cadence] skip due job: session is being archived", {
                jobId: a.id,
                sessionKey: p
            });
            continue
        }
        let f = t.getActor(p);
        if (f && f.status !== "ended") {
            Pe("[cadence] skip due job: already running", {
                jobId: a.id,
                sessionKey: p,
                actorStatus: f.status
            });
            continue
        }
        try {
            await r.updateState(a.id, {
                last_scheduled_at: s.toISOString()
            })
        } catch (_) {
            se("[cadence] skip due job: claim state write failed, retrying next scan", {
                jobId: a.id,
                error: _ instanceof Error ? _.message : String(_)
            });
            continue
        }
        let m = createSpineEvent({
            type: "job.spawn",
            source: {
                kind: "cadence",
                name: "job-scanner"
            },
            session_key: p,
            payload: {
                job_id: a.id,
                cron: a.frontmatter.cron,
                tick: {
                    run_number: (a.state.run_count ?? 0) + 1,
                    triggered_at: s.toISOString(),
                    previous_run_at: a.state.last_run_at ?? null
                }
            }
        });
        await atomicAppendEvent(e, m);
        let h = `- [ ] @evt(${m.id}) job:${a.id}`;
        await Vo(e, p, h), t.spawnJobSession(a.id, p), o.push(a.id), K("[cadence] spawned due job", {
            jobId: a.id,
            sessionKey: p,
            cron: a.frontmatter.cron
        })
    }
    return Pe("[cadence] job scan complete", {
        scanned: i.length,
        spawned: o.length
    }), {
        scanned: i.length,
        spawned: o
    }
}
