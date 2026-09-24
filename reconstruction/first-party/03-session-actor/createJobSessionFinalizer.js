// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createJobSessionFinalizer  (minified: SEe, daemon.pretty.js:80276)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobSessionFinalizer(e) {
    let {
        paths: t,
        bus: n,
        jobManager: r
    } = e;
    async function i(f) {
        return new Set(await ob(rb(t, f)))
    }
    async function o(f, p) {
        let m;
        try {
            m = await i(f)
        } catch (h) {
            return Z("[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)", {
                sessionKey: f,
                error: h instanceof Error ? h.message : String(h)
            }), "conservative"
        }
        for (let h of m)
            if (!p.has(h)) return "fresh";
        return "none"
    }

    function s(f) {
        return f.error ? f.runStarted ? "STARTED_FAILURE" : "NEVER_STARTED_FAILURE" : f.cancelled ? f.runStarted ? "CANCELLED_POST_ACK" : "CANCELLED_PRE_ACK" : !f.runStarted && f.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"
    }
    async function a(f, p, m, h, g, y) {
        try {
            let v = await r.finalizeJobState(f, m, {
                consumeRunAt: h,
                expectedClaimCursor: g
            });
            return v === vV ? (te(`[session-manager] job gone at finalize (${y}) — state frozen`, {
                jobId: f,
                sessionKey: p
            }), {
                kind: "gone"
            }) : v === wV ? (Z(`[session-manager] stale finalize (${y}) — a fresh claim owns the sidecar; nothing written`, {
                jobId: f,
                sessionKey: p,
                claimCursor: g
            }), {
                kind: "stale"
            }) : {
                kind: "written",
                runAt: v.run_at
            }
        } catch (v) {
            return Le(`[session-manager] job state finalize failed (${y})`, v), {
                kind: "failed"
            }
        }
    }
    async function u(f, p) {
        let m = f.jobId,
            {
                sessionKey: h
            } = f,
            {
                runStarted: g,
                cancelled: y,
                processedCount: v,
                claimCursor: b,
                error: _,
                resultText: I
            } = p,
            E = s({
                error: _,
                cancelled: y,
                runStarted: g,
                processedCount: v
            });
        try {
            await r.init();
            let R = p.jobSnapshot,
                x = R?.frontmatter.cron ?? "";
            switch (E) {
                case "NEVER_STARTED_FAILURE": {
                    let S = _ instanceof Error ? _.message : String(_);
                    await a(m, h, {
                        last_result: "failure",
                        last_error: S
                    }, !1, b, "never-started failure"), await l({
                        jobId: m,
                        sessionKey: h,
                        job: R,
                        cron: x,
                        errorMsg: S
                    }), te("[session-manager] job failed (never started, spawn-class) — job preserved", {
                        jobId: m,
                        sessionKey: h,
                        cron: x,
                        error: S
                    });
                    break
                }
                case "STARTED_FAILURE": {
                    let S = _ instanceof Error ? _.message : String(_),
                        D = await a(m, h, {
                            last_result: "failure",
                            last_error: S
                        }, !0, b, "started failure");
                    await l({
                        jobId: m,
                        sessionKey: h,
                        job: R,
                        cron: x,
                        errorMsg: S
                    }), await c({
                        jobId: m,
                        sessionKey: h,
                        cron: x,
                        state: D
                    }), te("[session-manager] job failed", {
                        jobId: m,
                        sessionKey: h,
                        error: S
                    });
                    break
                }
                case "CANCELLED_POST_ACK": {
                    let S = await a(m, h, {
                            last_result: "failure",
                            last_error: "cancelled"
                        }, !0, b, "cancelled post-ack"),
                        D = await c({
                            jobId: m,
                            sessionKey: h,
                            cron: x,
                            state: S
                        });
                    D && await l({
                        jobId: m,
                        sessionKey: h,
                        job: R,
                        cron: x,
                        errorMsg: "cancelled — the run was interrupted after it started and this one-shot job has been archived, so it will not run again"
                    }), Z(D ? "[session-manager] job run cancelled after turn ack — archived, owner notified" : "[session-manager] job run cancelled after turn ack — consumed + failure marker, job preserved, no delivery", {
                        jobId: m,
                        sessionKey: h
                    });
                    break
                }
                case "ZERO_FED": {
                    await a(m, h, {
                        last_result: "failure",
                        last_error: "zero-fed run — no items merged"
                    }, !1, b, "zero-fed"), Z("[session-manager] zero-fed job run — failure marker written, job preserved", {
                        jobId: m,
                        sessionKey: h
                    });
                    break
                }
                case "CANCELLED_PRE_ACK": {
                    Z("[session-manager] job run ended without turn ack (cancelled before start) — finalize skipped, job preserved", {
                        jobId: m,
                        sessionKey: h,
                        processedCount: v
                    });
                    break
                }
                case "STARTED_SUCCESS": {
                    let S = await a(m, h, {
                            last_result: "success",
                            last_run_at: new Date().toISOString(),
                            last_error: void 0
                        }, !0, b, "success"),
                        D = createSpineEvent({
                            type: "job.complete",
                            source: {
                                kind: "job",
                                name: m
                            },
                            session_key: h,
                            payload: {
                                job_id: m,
                                result_summary: I?.slice(0, 200)
                            }
                        });
                    await atomicAppendEvent(t, D);
                    let $ = I?.slice(0, 200);
                    n.emit("job.completed", {
                        jobId: m,
                        sessionKey: h,
                        resultSummary: $
                    }), f.agentNotifiedThisDrain ? Re("[session-manager] skipping system job.complete delivery: agent called Notify", {
                        jobId: m,
                        sessionKey: h
                    }) : await d(R, h, "job.complete", {
                        job_id: m,
                        result_summary: $,
                        result_text: I?.slice(0, 2e3),
                        schedule_type: AS(x)
                    }), await c({
                        jobId: m,
                        sessionKey: h,
                        cron: x,
                        state: S
                    }), te("[session-manager] job completed", {
                        jobId: m,
                        sessionKey: h
                    });
                    break
                }
            }
        } catch (R) {
            Le("[session-manager] error finalizing job session", R)
        }
    }
    async function l(f) {
        let {
            jobId: p,
            sessionKey: m,
            job: h,
            cron: g,
            errorMsg: y
        } = f, v = createSpineEvent({
            type: "job.fail",
            source: {
                kind: "job",
                name: p
            },
            session_key: m,
            payload: {
                job_id: p,
                error: y
            }
        });
        await atomicAppendEvent(t, v), n.emit("job.failed", {
            jobId: p,
            sessionKey: m,
            error: y
        }), await d(h, m, "job.fail", {
            job_id: p,
            error: y,
            schedule_type: AS(g)
        })
    }
    async function c(f) {
        let {
            jobId: p,
            sessionKey: m,
            cron: h,
            state: g
        } = f;
        if (!_Ee(h)) return !1;
        switch (g.kind) {
            case "gone":
                return te("[session-manager] skip auto-archive: job already gone (archived mid-run)", {
                    jobId: p,
                    cron: h
                }), !1;
            case "stale":
                return te("[session-manager] skip auto-archive: stale finalize (a fresh claim owns the job)", {
                    jobId: p,
                    cron: h
                }), !1;
            case "failed":
                return Z("[session-manager] skip auto-archive: job state unreadable at finalize (failing toward stale-active)", {
                    jobId: p,
                    cron: h
                }), !1;
            case "written":
                if (g.runAt !== null) return te("[session-manager] skip auto-archive: job re-armed via reschedule", {
                    jobId: p,
                    cron: h,
                    runAt: g.runAt
                }), !1;
                break;
            default:
                return g
        }
        let y = !1;
        try {
            let v = await r.archiveJobIfNotRearmed(p);
            return v.archived ? (y = !0, (await archiveSessionDirUnlessAlreadyArchiving(t, m)).reason === "archive_in_flight" ? (Z("[session-manager] skip finalize session archive: archive already in flight", {
                jobId: p,
                sessionKey: m
            }), !0) : (te("[session-manager] auto-archived one-shot job", {
                jobId: p,
                cron: h
            }), !0)) : (te("[session-manager] skip auto-archive: job re-armed during finalize", {
                jobId: p,
                cron: h,
                runAt: v.runAt
            }), !1)
        } catch (v) {
            return Le("[session-manager] failed to auto-archive one-shot job", v), y
        }
    }
    async function d(f, p, m, h) {
        if (!f) return;
        let g = f.frontmatter.owner_session?.trim();
        if (!g) {
            Z("[session-manager] job outcome undeliverable: no owner_session", {
                jobId: f.id,
                eventType: m
            });
            return
        }
        let y = S$(g);
        if (!y) {
            Z("[session-manager] job outcome undeliverable: owner_session is not a route target", {
                jobId: f.id,
                owner: g,
                eventType: m
            });
            return
        }
        try {
            await deliverRouteEventToSession(t, n, {
                traceId: `job-finalize_${f.id}`,
                routeId: "job-result",
                sourceName: `job:${f.id}`,
                sourceSessionKey: p,
                targetSessionKey: y,
                eventType: m,
                payload: h,
                enqueueWithoutWake: m === "job.complete"
            }), Re("[session-manager] job outcome delivered to owner", {
                jobId: f.id,
                targetSessionKey: y,
                eventType: m,
                woke: m === "job.fail"
            })
        } catch (v) {
            Z("[session-manager] failed to deliver job outcome to owner", {
                jobId: f.id,
                targetSessionKey: y,
                eventType: m,
                error: String(v)
            })
        }
    }
    return {
        listSessionInboxPendingNames: i,
        sessionInboxFreshNameVerdict: o,
        finalizeJobSession: u
    }
}
