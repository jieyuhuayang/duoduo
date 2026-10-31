// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createJobSessionFinalizer  (minified: $Ie, daemon.pretty.js:81852)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.1, v0.8.7 (maps/history_daemon.json)
// locals: 82 renamed — 30 from the code at the binding (rule), 52 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Job results went nowhere when the job had no explicit audience; the owner is now the default, and a job can no longer disappear without a trace.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createJobSessionFinalizer(deps) {
    let {
        paths,
        bus,
        jobManager,
        resolveMain,
        finalSubscriberCount
    } = deps;
    async function listSessionInboxPendingNames(inboxSessionKey) {
        return new Set(await listPendingInboxFiles(resolveSessionInboxDir(paths, inboxSessionKey)))
    }
    async function sessionInboxFreshNameVerdict(sessionKey, knownNames) {
        let pendingNames;
        try {
            pendingNames = await listSessionInboxPendingNames(sessionKey)
        } catch (err) {
            return logWarnMessage("[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)", {
                sessionKey,
                error: err instanceof Error ? err.message : String(err)
            }), "conservative"
        }
        for (let name of pendingNames)
            if (!knownNames.has(name)) return "fresh";
        return "none"
    }

    function classifyJobRunOutcome(runFacts) {
        return runFacts.error ? runFacts.runStarted ? "STARTED_FAILURE" : "NEVER_STARTED_FAILURE" : runFacts.cancelled ? runFacts.runStarted ? "CANCELLED_POST_ACK" : "CANCELLED_PRE_ACK" : !runFacts.runStarted && runFacts.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"
    }
    async function finalizeJobStateSafely(jobId, sessionKey, statePatch, consumeRunAt, expectedClaimCursor, label) {
        try {
            let result = await jobManager.finalizeJobState(jobId, statePatch, {
                consumeRunAt,
                expectedClaimCursor
            });
            return result === JH ? (logInfoMessage(`[session-manager] job gone at finalize (${label}) — state frozen`, {
                jobId,
                sessionKey
            }), {
                kind: "gone"
            }) : result === GH ? (logWarnMessage(`[session-manager] stale finalize (${label}) — a fresh claim owns the sidecar; nothing written`, {
                jobId,
                sessionKey,
                claimCursor: expectedClaimCursor
            }), {
                kind: "stale"
            }) : {
                kind: "written",
                runAt: result.run_at
            }
        } catch (err) {
            return logErrorMessage(`[session-manager] job state finalize failed (${label})`, err), {
                kind: "failed"
            }
        }
    }
    async function finalizeJobSession(drainCtx, runOutcome) {
        let jobId = drainCtx.jobId,
            {
                sessionKey
            } = drainCtx,
            {
                runStarted,
                cancelled,
                processedCount,
                claimCursor,
                error,
                resultText
            } = runOutcome,
            outcomeClass = classifyJobRunOutcome({
                error,
                cancelled,
                runStarted,
                processedCount
            });
        try {
            await jobManager.init();
            let jobSnapshot = runOutcome.jobSnapshot,
                jobCron = jobSnapshot?.frontmatter.cron ?? "";
            switch (outcomeClass) {
                case "NEVER_STARTED_FAILURE": {
                    let errorMessage = error instanceof Error ? error.message : String(error);
                    await finalizeJobStateSafely(jobId, sessionKey, {
                        last_result: "failure",
                        last_error: errorMessage
                    }, !1, claimCursor, "never-started failure"), await emitJobFailure({
                        jobId,
                        sessionKey,
                        job: jobSnapshot,
                        cron: jobCron,
                        errorMsg: errorMessage
                    }), logInfoMessage("[session-manager] job failed (never started, spawn-class) — job preserved", {
                        jobId,
                        sessionKey,
                        cron: jobCron,
                        error: errorMessage
                    });
                    break
                }
                case "STARTED_FAILURE": {
                    let errorMessage = error instanceof Error ? error.message : String(error),
                        finalizeState = await finalizeJobStateSafely(jobId, sessionKey, {
                            last_result: "failure",
                            last_error: errorMessage
                        }, !0, claimCursor, "started failure");
                    await emitJobFailure({
                        jobId,
                        sessionKey,
                        job: jobSnapshot,
                        cron: jobCron,
                        errorMsg: errorMessage
                    }), await autoArchiveOneShotJob({
                        jobId,
                        sessionKey,
                        cron: jobCron,
                        state: finalizeState
                    }), logInfoMessage("[session-manager] job failed", {
                        jobId,
                        sessionKey,
                        error: errorMessage
                    });
                    break
                }
                case "CANCELLED_POST_ACK": {
                    let finalizeState = await finalizeJobStateSafely(jobId, sessionKey, {
                            last_result: "failure",
                            last_error: "cancelled"
                        }, !0, claimCursor, "cancelled post-ack"),
                        archived = await autoArchiveOneShotJob({
                            jobId,
                            sessionKey,
                            cron: jobCron,
                            state: finalizeState
                        });
                    archived && await emitJobFailure({
                        jobId,
                        sessionKey,
                        job: jobSnapshot,
                        cron: jobCron,
                        errorMsg: "cancelled — the run was interrupted after it started and this one-shot job has been archived, so it will not run again"
                    }), logWarnMessage(archived ? "[session-manager] job run cancelled after turn ack — archived, owner notified" : "[session-manager] job run cancelled after turn ack — consumed + failure marker, job preserved, no delivery", {
                        jobId,
                        sessionKey
                    });
                    break
                }
                case "ZERO_FED": {
                    await finalizeJobStateSafely(jobId, sessionKey, {
                        last_result: "failure",
                        last_error: "zero-fed run — no items merged"
                    }, !1, claimCursor, "zero-fed"), logWarnMessage("[session-manager] zero-fed job run — failure marker written, job preserved", {
                        jobId,
                        sessionKey
                    });
                    break
                }
                case "CANCELLED_PRE_ACK": {
                    logWarnMessage("[session-manager] job run ended without turn ack (cancelled before start) — finalize skipped, job preserved", {
                        jobId,
                        sessionKey,
                        processedCount
                    });
                    break
                }
                case "STARTED_SUCCESS": {
                    let finalizeState = await finalizeJobStateSafely(jobId, sessionKey, {
                            last_result: "success",
                            last_run_at: new Date().toISOString(),
                            last_error: void 0
                        }, !0, claimCursor, "success"),
                        spineEvent = createSpineEvent({
                            type: "job.complete",
                            source: {
                                kind: "job",
                                name: jobId
                            },
                            session_key: sessionKey,
                            payload: {
                                job_id: jobId,
                                result_summary: resultText?.slice(0, 200)
                            }
                        });
                    await atomicAppendEvent(paths, spineEvent);
                    let resultSummary = resultText?.slice(0, 200);
                    bus.emit("job.completed", {
                        jobId,
                        sessionKey,
                        resultSummary
                    }), drainCtx.agentNotifiedThisDrain ? logDebugMessage("[session-manager] skipping system job.complete delivery: agent called Notify", {
                        jobId,
                        sessionKey
                    }) : await deliverJobOutcomeToOwner(jobSnapshot, sessionKey, "job.complete", {
                        job_id: jobId,
                        result_summary: resultSummary,
                        result_text: resultText?.slice(0, 2e3),
                        schedule_type: classifyJobScheduleType(jobCron)
                    }), await autoArchiveOneShotJob({
                        jobId,
                        sessionKey,
                        cron: jobCron,
                        state: finalizeState
                    }), logInfoMessage("[session-manager] job completed", {
                        jobId,
                        sessionKey
                    });
                    break
                }
            }
        } catch (err) {
            logErrorMessage("[session-manager] error finalizing job session", err)
        }
    }
    async function emitJobFailure(params) {
        let {
            jobId,
            sessionKey,
            job,
            cron,
            errorMsg
        } = params, spineEvent = createSpineEvent({
            type: "job.fail",
            source: {
                kind: "job",
                name: jobId
            },
            session_key: sessionKey,
            payload: {
                job_id: jobId,
                error: errorMsg
            }
        });
        await atomicAppendEvent(paths, spineEvent), bus.emit("job.failed", {
            jobId,
            sessionKey,
            error: errorMsg
        }), await deliverJobOutcomeToOwner(job, sessionKey, "job.fail", {
            job_id: jobId,
            error: errorMsg,
            schedule_type: classifyJobScheduleType(cron)
        })
    }
    async function autoArchiveOneShotJob(params) {
        let {
            jobId,
            sessionKey,
            cron,
            state
        } = params;
        if (!isAutoArchivedJobSchedule(cron)) return !1;
        switch (state.kind) {
            case "gone":
                return logInfoMessage("[session-manager] skip auto-archive: job already gone (archived mid-run)", {
                    jobId,
                    cron
                }), !1;
            case "stale":
                return logInfoMessage("[session-manager] skip auto-archive: stale finalize (a fresh claim owns the job)", {
                    jobId,
                    cron
                }), !1;
            case "failed":
                return logWarnMessage("[session-manager] skip auto-archive: job state unreadable at finalize (failing toward stale-active)", {
                    jobId,
                    cron
                }), !1;
            case "written":
                if (state.runAt !== null) return logInfoMessage("[session-manager] skip auto-archive: job re-armed via reschedule", {
                    jobId,
                    cron,
                    runAt: state.runAt
                }), !1;
                break;
            default:
                return state
        }
        let archived = !1;
        try {
            let archiveResult = await jobManager.archiveJobIfNotRearmed(jobId);
            return archiveResult.archived ? (archived = !0, (await archiveSessionDirUnlessAlreadyArchiving(paths, sessionKey)).reason === "archive_in_flight" ? (logWarnMessage("[session-manager] skip finalize session archive: archive already in flight", {
                jobId,
                sessionKey
            }), !0) : (logInfoMessage("[session-manager] auto-archived one-shot job", {
                jobId,
                cron
            }), !0)) : (logInfoMessage("[session-manager] skip auto-archive: job re-armed during finalize", {
                jobId,
                cron,
                runAt: archiveResult.runAt
            }), !1)
        } catch (err) {
            return logErrorMessage("[session-manager] failed to auto-archive one-shot job", err), archived
        }
    }
    async function deliverJobOutcomeToOwner(job, sourceSessionKey, eventType, payload) {
        if (!job) return;
        let ownerSession = job.frontmatter.owner_session?.trim(),
            ownerTarget = ownerSession ? normalizeNotifyChannelTarget(ownerSession) : null,
            ownerReachable = ownerTarget !== null && !isSessionArchived(paths, ownerTarget) && !isSessionArchiving(ownerTarget);
        if (ownerReachable && !(await evaluateNotifyConsumerRefusal(paths, ownerTarget, finalSubscriberCount).catch(() => null))?.refused) {
            await deliverJobEvent(job, sourceSessionKey, eventType, payload, ownerTarget);
            return
        }
        let mainResolution = resolveMain();
        if (mainResolution.state === "held") {
            let mainRefusal = await evaluateNotifyConsumerRefusal(paths, mainResolution.session_key, finalSubscriberCount).catch(() => null);
            if (mainRefusal && !mainRefusal.refused) {
                await deliverJobEvent(job, sourceSessionKey, eventType, {
                    ...payload,
                    stand_in_for_owner: ownerSession ?? null
                }, mainResolution.session_key);
                return
            }
        }
        if (ownerReachable) {
            await deliverJobEvent(job, sourceSessionKey, eventType, payload, ownerTarget);
            return
        }
        logWarnMessage("[session-manager] job outcome undeliverable: no live owner and no usable main", {
            jobId: job.id,
            owner: ownerSession,
            main: mainResolution.state,
            eventType
        })
    }
    async function deliverJobEvent(deliveredJob, deliverSourceSessionKey, deliverEventType, deliverPayload, targetSessionKey) {
        try {
            await deliverRouteEventToSession(paths, bus, {
                traceId: `job-finalize_${deliveredJob.id}`,
                routeId: "job-result",
                sourceName: `job:${deliveredJob.id}`,
                sourceSessionKey: deliverSourceSessionKey,
                targetSessionKey,
                eventType: deliverEventType,
                payload: deliverPayload,
                enqueueWithoutWake: deliverEventType === "job.complete"
            }), logDebugMessage("[session-manager] job outcome delivered", {
                jobId: deliveredJob.id,
                targetSessionKey,
                eventType: deliverEventType,
                woke: deliverEventType === "job.fail"
            })
        } catch (err) {
            logWarnMessage("[session-manager] failed to deliver job outcome", {
                jobId: deliveredJob.id,
                targetSessionKey,
                eventType: deliverEventType,
                error: String(err)
            })
        }
    }
    return {
        listSessionInboxPendingNames,
        sessionInboxFreshNameVerdict,
        finalizeJobSession
    }
}
