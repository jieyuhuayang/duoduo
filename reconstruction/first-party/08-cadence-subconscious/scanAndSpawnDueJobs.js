// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: scanAndSpawnDueJobs  (minified: M6, daemon.pretty.js:80474)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scanAndSpawnDueJobs(e, t, n) {
    let r = new Io(e);
    await r.init();
    let i = await r.listJobs(),
        o = n?.now ?? new Date,
        s = [];
    for (let a of i) {
        let l = a.state.last_scheduled_at ?? a.state.last_run_at,
            u = a.state.last_scheduled_at ? new Date(a.state.last_scheduled_at).getTime() : Number.NaN,
            c = a.state.last_run_started_at ? new Date(a.state.last_run_started_at).getTime() : Number.NaN,
            d = !Number.isFinite(c) || Number.isFinite(u) && c < u;
        if (oP(a.frontmatter.cron) && a.state.last_scheduled_at && d && (a.state.last_result === "unknown" || a.state.last_result === "failure") && (l = null), !Ope(a.frontmatter.cron, l, o, a.frontmatter.created_at, a.state.run_at ?? null)) continue;
        if (a.state.last_result === "failure" && a.state.last_scheduled_at) {
            let y = new Date(a.state.last_scheduled_at).getTime();
            if (o.getTime() - y < 3e5) {
                ke("[cadence] skip due job: failure backoff", {
                    jobId: a.id,
                    lastScheduledAt: a.state.last_scheduled_at,
                    backoffMs: 3e5
                });
                continue
            }
        }
        let p = Yu({
            jobId: a.id,
            cron: a.frontmatter.cron,
            cwdRel: a.frontmatter.cwd_rel
        });
        if (Qn(p)) {
            ke("[cadence] skip due job: session is being archived", {
                jobId: a.id,
                sessionKey: p
            });
            continue
        }
        let f = t.getActor(p);
        if (f && f.status !== "ended") {
            ke("[cadence] skip due job: already running", {
                jobId: a.id,
                sessionKey: p,
                actorStatus: f.status
            });
            continue
        }
        try {
            await r.updateState(a.id, {
                last_scheduled_at: o.toISOString()
            })
        } catch (g) {
            W("[cadence] skip due job: claim state write failed, retrying next scan", {
                jobId: a.id,
                error: g instanceof Error ? g.message : String(g)
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
                    triggered_at: o.toISOString(),
                    previous_run_at: a.state.last_run_at ?? null
                }
            }
        });
        await atomicAppendEvent(e, m);
        let h = `- [ ] @evt(${m.id}) job:${a.id}`;
        await $s(e, p, h), t.spawnJobSession(a.id, p), s.push(a.id), ee("[cadence] spawned due job", {
            jobId: a.id,
            sessionKey: p,
            cron: a.frontmatter.cron
        })
    }
    return ke("[cadence] job scan complete", {
        scanned: i.length,
        spawned: s.length
    }), {
        scanned: i.length,
        spawned: s
    }
}
