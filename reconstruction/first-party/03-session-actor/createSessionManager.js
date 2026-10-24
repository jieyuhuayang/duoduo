// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: gkt, daemon.pretty.js:86092)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.3, v0.2.12, v0.3.0, v0.3.2, v0.3.4, v0.3.5, v0.3.6, v0.3.7, v0.4.0, v0.4.1, v0.4.2, v0.4.3, v0.4.4, v0.4.5, v0.5.0, v0.5.1, v0.5.2, v0.5.3, v0.5.4, v0.5.5, v0.5.6, v0.5.7, v0.5.8, v0.5.10, v0.6.0, v0.6.1, v0.6.2, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.2, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 413 renamed — 89 from the code at the binding (rule), 324 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(options) {
    let {
        paths,
        bus,
        sdk,
        idleTimeoutMs = 36e5,
        heartbeatIntervalMs = 3e4
    } = options, resolvedSdk = sdk ?? createAgentSdkAdapter(), jobManager = new Hr(paths), {
        listSessionInboxPendingNames,
        sessionInboxFreshNameVerdict,
        finalizeJobSession
    } = createJobSessionFinalizer({
        paths,
        bus,
        jobManager
    }), codexAvailability = options.codexAvailability ?? checkCodexAvailability, codexAdapterFactory = options.codexAdapterFactory ?? createCodexAppServerAdapter, probeCodexAvailability = memoizeAvailabilityProbeUntilOk(codexAvailability), grokAvailability = options.grokAvailability ?? checkGrokAvailability, grokAdapterFactory = options.grokAdapterFactory ?? createGrokAcpAdapter, piAdapterFactory = options.piAdapterFactory ?? createPiWorkerAdapter, probeGrokAvailability = memoizeAvailabilityProbeUntilOk(grokAvailability), probeRuntimeAvailability = runtime => runtime === "codex" ? probeCodexAvailability() : runtime === "grok" ? probeGrokAvailability() : void 0, {
        toModelOptions,
        resolveRuntimeForModelCommand,
        runtimeCommandRefusal,
        resolveModelProfileScope,
        classifyModelTargetAgainstLiveGeneration
    } = createModelCommandResolvers({
        paths
    }), {
        ensureStreamingSession
    } = createClaudeStreamingSessionFactory({
        paths,
        bus,
        resolvedSdk,
        classifyModelTargetAgainstLiveGeneration
    });
    async function emitDetachedTurnOutput(sessionKey, text) {
        let trimmed = text.trim();
        if (!trimmed) return;
        let outboxRecord = createOutboxRecord({
            channel_kind: channelKindFromSessionKey(sessionKey),
            session_key: sessionKey,
            payload: {
                text: trimmed
            }
        });
        try {
            await persistOutboxRecord(paths, outboxRecord), bus.emit("session.output", {
                sessionKey,
                record: outboxRecord
            })
        } catch (err) {
            logErrorMessage("[session-manager] grok detached-turn outbox write failed", {
                sessionKey,
                error: err instanceof Error ? err.message : String(err)
            })
        }
    }
    let maxConcurrentChannel = options.maxConcurrentChannel ?? options.maxConcurrent ?? 10,
        maxConcurrentJob = options.maxConcurrentJob ?? 6,
        channelPool = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: maxConcurrentChannel,
            wakeQueue: []
        },
        jobPool = {
            name: "job",
            activeCount: 0,
            maxConcurrent: maxConcurrentJob,
            wakeQueue: []
        };

    function poolForSession(sessionKey, origin) {
        return classifySessionPoolKind(sessionKey, origin) === "job" ? jobPool : channelPool
    }

    function hasQueuedWake(sessionKey) {
        return channelPool.wakeQueue.includes(sessionKey) || jobPool.wakeQueue.includes(sessionKey)
    }

    function dequeueQueuedWake(pool) {
        if (pool.wakeQueue.length === 0 || !running) return;
        let readyIndex = pool.wakeQueue.findIndex(queuedKey => !isSessionArchiving(queuedKey));
        if (readyIndex === -1) {
            logSessionLifecycleMessage("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: pool.name,
                queuedSessions: pool.wakeQueue.length
            });
            return
        }
        let sessionKey = pool.wakeQueue.splice(readyIndex, 1)[0];
        readyIndex > 0 && logSessionLifecycleMessage("[session-manager] dequeue skipped archiving sessions", {
            skipped: readyIndex,
            sessionKey,
            pool: pool.name
        }), logSessionLifecycleMessage("[session-manager] dequeue queued wake", {
            sessionKey,
            pool: pool.name,
            queuedSessions: pool.wakeQueue.length
        });
        let actor = map.get(sessionKey);
        if (actor && actor.status === "idle" && !actor.holdsPoolSlot && actor.drainPromise) {
            actor.pendingWake = !0, actor.wakeResolver && (actor.wakeResolver(), actor.wakeResolver = null), logSessionLifecycleMessage("[session-manager] resuming idle actor from dequeue", {
                sessionKey,
                actorRunId: actor.actorRunId,
                pool: pool.name
            });
            return
        }
        if (pool.activeCount >= pool.maxConcurrent) {
            pool.wakeQueue.unshift(sessionKey), logSessionLifecycleMessage("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey,
                pool: pool.name,
                activeCount: pool.activeCount
            });
            return
        }
        if (actor?.origin === "job" && actor.jobId) {
            let jobId = actor.jobId;
            startActor(sessionKey, {
                origin: "job",
                jobId
            })
        } else {
            let inferredOrigin = inferActorOriginFromSessionKey(sessionKey);
            startActor(sessionKey, inferredOrigin ?? void 0)
        }
    }
    let map = new Map,
        map2 = new Map,
        map3 = new Map,
        running = !1,
        actorRunCounter = 0,
        onSessionWake = ({
            sessionKey,
            displayName,
            preempt,
            preemptBoundary
        }) => {
            logSessionLifecycleMessage("[session-manager] wake", {
                sessionKey,
                preempt: preempt ?? "allow",
                preemptBoundary: preemptBoundary ?? "default"
            }), displayName && map2.set(sessionKey, displayName), wakeSession(sessionKey, {
                preempt,
                preemptBoundary
            })
        },
        onShutdown = () => {
            stopAllActors()
        },
        onStreamingInvalidated = ({
            sessionKey,
            reason
        }) => {
            let actor = map.get(sessionKey);
            if (!actor) return;
            let hadAdapter = actor.streamingAdapter !== null;
            actor.streamingAdapter = null;
            let stateMarked = !1;
            actor.streamingState && !actor.streamingState.closed && (actor.streamingState.needsRecreation = !0, stateMarked = !0), (hadAdapter || stateMarked) && logInfoMessage("[session-manager] streamingAdapter torn down for session", {
                sessionKey,
                reason,
                hadAdapter,
                stateMarked
            }), stateMarked && logAlwaysAtLevel("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey,
                reason: "instructions-drift",
                generation: actor.streamingGeneration,
                sdk_session_id: actor.sdkSessionId ?? null
            })
        };

    function resolveActorSdk(actor) {
        return actor.runtime !== "claude" ? actor.adapter ? actor.adapter : {
            run: async () => {
                throw new Error(`${actor.runtime} runtime selected but its adapter was not built; refusing to fall through to Claude`)
            }
        } : actor.origin !== "channel" || !resolvedSdk.createStreamingQuery ? resolvedSdk : (actor.streamingAdapter || (actor.streamingAdapter = {
            run: async request => {
                let streamingState = await ensureStreamingSession(actor, request),
                    input = prependPendingInterruptMarker(actor, request);
                return await new Promise((resolve, reject) => {
                    if (streamingState.closed) {
                        reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    streamingState.queue.enqueue({
                        input,
                        resolve,
                        reject,
                        accepted: !1,
                        sessionId: request.sessionId,
                        text: void 0,
                        structured: void 0,
                        usage: void 0,
                        streamedText: "",
                        turnStreamedText: "",
                        toolUseMap: new Map,
                        toolBlockIndexMap: new Map,
                        skipCalled: !1
                    })
                })
            },
            createStreamingQuery: resolvedSdk.createStreamingQuery
        }), actor.streamingAdapter)
    }

    function wakeSession(sessionKey, wakeOptions) {
        if (!running) {
            logSessionLifecycleMessage("[session-manager] wake ignored, manager not running", {
                sessionKey
            });
            return
        }
        if (isSessionArchiving(sessionKey)) {
            logSessionLifecycleMessage("[session-manager] wake suppressed, session is being archived", {
                sessionKey
            });
            return
        }
        let preempt = wakeOptions?.preempt ?? "allow",
            preemptBoundary = wakeOptions?.preemptBoundary,
            actor = map.get(sessionKey);
        if (actor && actor.wakeResolver) {
            logSessionLifecycleMessage("[session-manager] wake delivered to idle actor", {
                sessionKey,
                actorRunId: actor.actorRunId,
                status: actor.status,
                preemptBoundary: preemptBoundary ?? "default"
            }), actor.wakeResolver(), actor.wakeResolver = null;
            return
        }
        if (actor && actor.drainPromise && (actor.status === "active" || actor.status === "idle")) {
            let claudeTurnAccepted = !!actor.query && actor.streamingState?.currentTurn?.accepted === !0,
                adapterTurnActive = !!actor.adapter?.activeTurnId?.();
            if (preempt === "allow" && (claudeTurnAccepted || adapterTurnActive) && actor.admissionCallback && !actor.admissionInProgress) {
                actor.pendingWake = !0, actor.admissionInProgress = !0;
                let admissionCallback = actor.admissionCallback;
                logSessionLifecycleMessage("[session-manager] wake: admitting to live streaming session", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }), admissionCallback().then(() => {
                    actor.admissionInProgress = !1, actor.wakeResolver?.()
                }, () => {
                    actor.admissionInProgress = !1, actor.wakeResolver?.()
                });
                return
            }
            if (actor.status === "active" && actor.currentAbortController)
                if (preempt === "force") {
                    let forcedPreemptResult = requestBoundaryAwarePreempt(actor, "immediate", preemptBoundary, "preempt");
                    forcedPreemptResult === "immediate" ? logSessionLifecycleMessage("[session-manager] wake: forced preempt", {
                        sessionKey,
                        actorRunId: actor.actorRunId,
                        preemptBoundary: preemptBoundary ?? "default"
                    }) : forcedPreemptResult === "defer_accept" ? logSessionLifecycleMessage("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey,
                        actorRunId: actor.actorRunId
                    }) : forcedPreemptResult === "defer_tool_result" ? logSessionLifecycleMessage("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey,
                        actorRunId: actor.actorRunId
                    }) : forcedPreemptResult === "defer_tool_use" && logSessionLifecycleMessage("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey,
                        actorRunId: actor.actorRunId
                    })
                } else if (preempt === "allow") {
                let softPreemptResult = requestBoundaryAwarePreempt(actor, "soft", preemptBoundary, "preempt");
                softPreemptResult === "defer_accept" ? logSessionLifecycleMessage("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }) : softPreemptResult === "defer_tool_use" ? logSessionLifecycleMessage("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }) : softPreemptResult === "defer_tool_result" ? logSessionLifecycleMessage("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }) : softPreemptResult === "immediate" && logSessionLifecycleMessage("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                })
            } else logSessionLifecycleMessage("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey,
                actorRunId: actor.actorRunId
            });
            actor.pendingWake = !0, logSessionLifecycleMessage("[session-manager] wake marked pending", {
                sessionKey,
                actorRunId: actor.actorRunId,
                status: actor.status
            });
            return
        }
        let pool = poolForSession(sessionKey, actor?.origin);
        if (pool.activeCount >= pool.maxConcurrent) {
            let alreadyQueued = pool.wakeQueue.includes(sessionKey);
            alreadyQueued || pool.wakeQueue.push(sessionKey), logSessionLifecycleMessage("[session-manager] wake queued", {
                sessionKey,
                pool: pool.name,
                activeCount: pool.activeCount,
                maxConcurrent: pool.maxConcurrent,
                alreadyQueued,
                queuedSessions: pool.wakeQueue.length
            });
            return
        }
        let inferredOrigin = inferActorOriginFromSessionKey(sessionKey);
        inferredOrigin ? (logSessionLifecycleMessage("[session-manager] wake starting actor with inferred origin", {
            sessionKey,
            ...inferredOrigin
        }), startActor(sessionKey, inferredOrigin)) : (logSessionLifecycleMessage("[session-manager] wake starting actor", {
            sessionKey
        }), startActor(sessionKey))
    }

    function startActor(sessionKey, startOptions) {
        let previousActor = map.get(sessionKey),
            attachedChannels = previousActor?.attachedChannels ?? new Set,
            actorRunId = ++actorRunCounter,
            actor = {
                sessionKey,
                actorRunId,
                sdkSessionId: previousActor?.sdkSessionId,
                sdkSessionIdVerified: previousActor?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: previousActor?.streamingAdapter ?? null,
                streamingGeneration: previousActor?.streamingGeneration ?? 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                liveTurnNotifyOnly: !1,
                isStreaming: !1,
                activeToolCalls: new Map,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingPreemptReason: null,
                pendingClear: !1,
                attachedChannels,
                origin: startOptions?.origin ?? previousActor?.origin ?? "channel",
                jobId: startOptions?.jobId ?? previousActor?.jobId,
                jobStateless: previousActor?.jobStateless ?? !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                admissionCallback: null,
                idleSince: void 0,
                spawnedAt: Date.now(),
                lastActivityAt: void 0,
                lastTurnCompletedAt: void 0,
                lastCliTurnSettledAt: void 0,
                agentNotifiedThisDrain: !1,
                runtime: startOptions?.runtime ?? previousActor?.runtime ?? "claude",
                adapter: previousActor?.adapter ?? null,
                adapterFacts: previousActor?.adapterFacts,
                consecutiveConservativeRedrive: previousActor?.consecutiveConservativeRedrive ?? !1
            };
        map.set(sessionKey, actor);
        let pool = poolForSession(sessionKey, actor.origin);
        pool.activeCount++, actor.holdsPoolSlot = !0;
        let displayName = map2.get(sessionKey);
        if (displayName && map2.delete(sessionKey), ensureSessionDescriptorAndStateFiles(paths, {
                session_key: sessionKey,
                display_name: displayName,
                kind: actor.origin === "job" ? "job" : actor.origin === "system" ? "system" : sessionKey.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), logInfoMessage("[session-manager] actor start", {
                sessionKey,
                actorRunId,
                sdkSessionId: actor.sdkSessionId,
                origin: actor.origin,
                jobId: actor.jobId,
                pool: pool.name,
                activeCount: pool.activeCount,
                attachedChannels: actor.attachedChannels.size,
                queuedSessions: pool.wakeQueue.length
            }), startOptions?.preStart) {
            let preStart = startOptions.preStart;
            actor.drainPromise = preStart().catch(err => logErrorMessage("[session-manager] preStart failed", err)).then(() => runActorDrainLoop(actor))
        } else actor.drainPromise = runActorDrainLoop(actor)
    }
    async function runActorDrainLoop(actor) {
        let {
            sessionKey
        } = actor, drainError, lastReplyText, sdkTurnsStarted = 0, sdkTurnsRejected = 0, runStarted = !1, pendingJobStateWrites = [], processedCount = 0, mergeTransientFailure = !1, cancelled = !1, claimCursor = null, jobSnapshot = null, inboxSnapshotNames;
        try {
            inboxSnapshotNames = await listSessionInboxPendingNames(sessionKey)
        } catch (err) {
            logWarnMessage("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey,
                error: err instanceof Error ? err.message : String(err)
            }), inboxSnapshotNames = new Set
        }
        logSessionLifecycleMessage("[session-manager] drain loop begin", {
            sessionKey,
            actorRunId: actor.actorRunId,
            origin: actor.origin,
            jobId: actor.jobId
        });
        try {
            if (!actor.sdkSessionId && !actor.pendingClear) {
                let sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey);
                sessionRuntimeState?.sdk_session_id && (actor.sdkSessionId = sessionRuntimeState.sdk_session_id, logInfoMessage("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey,
                    sdkSessionId: sessionRuntimeState.sdk_session_id
                }))
            }
            if ((await readSessionRuntimeState(paths, sessionKey))?.session_key || await patchSessionRuntimeState(paths, sessionKey, {
                    session_key: sessionKey
                }), actor.origin === "job" && !actor.jobId) {
                await jobManager.init();
                let activeJob = (await jobManager.listJobs()).find(job => job.session_key === sessionKey);
                activeJob ? (actor.jobId = activeJob.id, logDebugMessage("[session-manager] recovered jobId from active jobs", {
                    sessionKey,
                    jobId: activeJob.id
                })) : logWarnMessage("[session-manager] job-origin actor has no matching active job", {
                    sessionKey
                })
            }
            let jobScheduleType, jobCron, jobStateless = !1,
                jobModel, jobEffort, jobPiConfig, probeUnavailableReason, runtimeRefusal, jobSnapshotConsumed = !1;
            if (actor.jobStateless = !1, actor.origin === "job" && actor.jobId) {
                let job = await jobManager.getJob(actor.jobId);
                if (jobSnapshot = job, claimCursor = job?.state.last_scheduled_at ?? null, job?.execution_cwd && (await assertJobWorkspaceUsable({
                        cwdRel: job.execution_context === "workspace" ? job.frontmatter.cwd_rel ?? null : null,
                        cwd: job.execution_cwd,
                        runtimeWorkspaceDir: job.runtime_workspace_dir,
                        context: job.execution_context
                    }), await ensureDirectoryExists(job.execution_cwd), await patchSessionRuntimeState(paths, sessionKey, {
                        session_key: sessionKey,
                        cwd: job.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), job) {
                    jobScheduleType = classifyJobScheduleType(job.frontmatter.cron), jobCron = job.frontmatter.cron;
                    let stateless = job.frontmatter.stateless === !0;
                    if (stateless && job.frontmatter.cron === "keepalive") throw new Error(y6);
                    jobStateless = stateless, actor.jobStateless = jobStateless, jobModel = job.frontmatter.model, jobEffort = job.frontmatter.effort, jobPiConfig = {
                        piExtensions: job.frontmatter.piExtensions,
                        piSkills: job.frontmatter.piSkills,
                        piConfigIssues: job.frontmatter.piConfigIssues
                    };
                    let runtimeValidation = validateRunnableRuntimeValue(job.frontmatter.runtime, `Job "${actor.jobId}"`);
                    runtimeValidation.ok || (runtimeRefusal = runtimeValidation.reason);
                    let explicitRuntime = runtimeValidation.ok ? runtimeValidation.runtime : void 0,
                        runtime = explicitRuntime ?? resolveDefaultRuntime(),
                        runtimeSource = explicitRuntime ? "explicit" : "default";
                    job.frontmatter.prompt_mode !== void 0 && runtime === "codex" && logWarnMessage("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                        sessionKey,
                        jobId: actor.jobId,
                        promptMode: job.frontmatter.prompt_mode,
                        runtimeSource
                    }), actor.runtime = runtime;
                    let availability = await probeRuntimeAvailability(runtime);
                    availability && !availability.ok && (probeUnavailableReason = availability.reason, logWarnMessage(`[session-manager] job requested ${runtime} but it is unavailable`, {
                        sessionKey,
                        jobId: actor.jobId,
                        runtime_source: runtimeSource,
                        reason: availability.reason
                    }))
                }
            } else if (actor.origin === "channel") {
                let sourceChannelId = (await readSessionRuntimeState(paths, sessionKey))?.source_channel_id;
                if (sourceChannelId) {
                    let sessionChannelRuntime = await resolveSessionChannelRuntime(paths, sessionKey, sourceChannelId);
                    sessionChannelRuntime.ok || (runtimeRefusal = sessionChannelRuntime.reason, logWarnMessage("[session-manager] channel runtime refused", {
                        sessionKey,
                        sourceChannelId,
                        reason: sessionChannelRuntime.reason
                    })), sessionChannelRuntime.ok && sessionChannelRuntime.runtime === "void" && (runtimeRefusal = `${Ju} A message queued before it became void was not run.`);
                    let runtime = sessionChannelRuntime.ok ? sessionChannelRuntime.runtime ?? resolveDefaultRuntime() : actor.runtime,
                        runtimeSource = sessionChannelRuntime.ok ? sessionChannelRuntime.source : "explicit";
                    actor.runtime = runtime;
                    let availability = sessionChannelRuntime.ok ? await probeRuntimeAvailability(runtime) : null;
                    availability && !availability.ok && (probeUnavailableReason = availability.reason, logWarnMessage(`[session-manager] channel requested ${runtime} but it is unavailable`, {
                        sessionKey,
                        sourceChannelId,
                        runtime_source: runtimeSource,
                        reason: availability.reason
                    }))
                }
            }
            for (; actor.status !== "ended" && running;) {
                let runtimeUnavailableReason = probeUnavailableReason;
                if (actor.runtime !== "codex") {
                    for (;;) {
                        let streamingState = actor.streamingState,
                            cliBusy = !!streamingState && !streamingState.closed && (streamingState.cliTurnTentative !== null || streamingState.currentTurn !== null);
                        if (!cliBusy && !actor.admissionInProgress) break;
                        if (actor.pendingWake) {
                            actor.pendingWake = !1;
                            continue
                        }
                        logSessionLifecycleMessage("[session-manager] drain parked: CLI busy gate", {
                            sessionKey,
                            actorRunId: actor.actorRunId,
                            cliBusy,
                            admissionInProgress: actor.admissionInProgress
                        }), await waitForWakeOrIdleTimeout(actor, idleTimeoutMs)
                    }
                    if (!running || actor.status === "ended") break
                }
                actor.pendingClear && (actor.sdkSessionId = void 0, actor.pendingClear = !1, await patchSessionRuntimeState(paths, sessionKey, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }).catch(() => {}));
                let jobContext, loopJobSnapshot = null;
                actor.origin === "job" && actor.jobId && (jobSnapshotConsumed ? loopJobSnapshot = await jobManager.getJob(actor.jobId).catch(() => null) : (jobSnapshotConsumed = !0, loopJobSnapshot = jobSnapshot));
                let {
                    instructions,
                    missionContent
                } = await collectInstructionsInputs(paths, sessionKey, actor, loopJobSnapshot), sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey), fingerprintGuard = await runInstructionsFingerprintGuard(paths, sessionKey, instructions, actor.runtime, {
                    instructions_fingerprint: sessionRuntimeState?.instructions_fingerprint,
                    mission_fingerprint: sessionRuntimeState?.mission_fingerprint,
                    schema_version: sessionRuntimeState?.schema_version,
                    sdk_session_id: sessionRuntimeState?.sdk_session_id,
                    board_layer_hash: sessionRuntimeState?.board_layer_hash,
                    instructions_nonboard_fingerprint: sessionRuntimeState?.instructions_nonboard_fingerprint
                }, actor.origin === "job" && actor.jobId ? {
                    jobId: actor.jobId
                } : void 0);
                fingerprintGuard.clearedSdkSessionId && (actor.sdkSessionId = void 0), fingerprintGuard.gate2Fired && actor.runtime === "claude" && (fingerprintGuard.boardOnlyDrift ? actor.streamingState && !actor.streamingState.closed ? logInfoMessage("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey,
                    board_layer_hash: fingerprintGuard.boardLayerHash
                }) : logInfoMessage("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey,
                    board_layer_hash: fingerprintGuard.boardLayerHash
                }) : bus.emit("session.streaming_invalidated", {
                    sessionKey,
                    reason: "instructions_drift"
                })), actor.origin === "job" && actor.jobId && (missionContent !== void 0 ? jobContext = {
                    content: missionContent,
                    jobId: actor.jobId,
                    cron: loopJobSnapshot?.frontmatter.cron ?? "",
                    stateless: jobStateless,
                    acceptance: loopJobSnapshot?.frontmatter.acceptance,
                    model: loopJobSnapshot ? loopJobSnapshot.frontmatter.model : jobModel,
                    effort: loopJobSnapshot ? loopJobSnapshot.frontmatter.effort : jobEffort,
                    sdkConfig: extractJobSdkConfig(loopJobSnapshot?.frontmatter)
                } : logWarnMessage("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey,
                    jobId: actor.jobId
                })), actor.status !== "ended" && (actor.status = "active"), actor.idleSince = void 0;
                let seenStreamEventKeys = new Set,
                    now = Date.now(),
                    abortController = new AbortController;
                actor.currentAbortController = abortController;
                let drainResult;
                try {
                    let allowedTools = [...actor.origin === "system" ? [] : [kwe, Jwe], Wwe, iSe];
                    actor.origin === "channel" && (allowedTools.push(aRe), allowedTools.push(xc));
                    let sessionContextKind = actor.origin === "job" ? "job" : actor.origin === "system" ? "system" : "foreground",
                        notifyDepth = 0,
                        defaultClaudeToolNames = listDefaultClaudeToolNames();
                    if (actor.admissionCallback = async () => {
                            try {
                                await mergeInboxIntoMailbox(paths, sessionKey);
                                let mailboxPendingItems = await listMailboxPendingItems(paths, sessionKey);
                                if (mailboxPendingItems.length === 0) return;
                                await renderSessionMailboxFile(paths, sessionKey, mailboxPendingItems);
                                let perf = {},
                                    drainBatch = await batchDrainItems(paths, mailboxPendingItems, {
                                        fallbackBatchSize: pJ,
                                        mergeWindowMs: mJ,
                                        perf
                                    }),
                                    sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey),
                                    sessionInfoFromState = buildSessionInfoFromState(paths, sessionKey, sessionRuntimeState ?? void 0),
                                    admittedEntries = [],
                                    processedEventIds = [];
                                for (let item of drainBatch.items) {
                                    if (!item.eventId) continue;
                                    if (actor.inflightEventIds.has(item.eventId)) {
                                        processedEventIds.push(item.eventId);
                                        continue
                                    }
                                    if (await findOutboxRecordByEventId(paths, item.eventId)) {
                                        processedEventIds.push(item.eventId);
                                        continue
                                    }
                                    let readOptions = item.createdAt ? {
                                            notAfter: item.createdAt
                                        } : void 0,
                                        event = drainBatch.events.get(item.eventId) ?? await readEventById(paths, item.eventId, readOptions);
                                    if (!event) {
                                        logWarnMessage(`[session-manager] mailbox event unresolved: session_key=${sessionKey} event_id=${item.eventId} not_after=${readOptions?.notAfter??"none"} item_file=${item.file??"none"}`);
                                        continue
                                    }
                                    admittedEntries.push({
                                        item,
                                        event,
                                        prompt: renderMailboxEventPrompt(event, sessionKey)
                                    })
                                }
                                if (admittedEntries.length === 0) {
                                    processedEventIds.length > 0 && await deleteMailboxPendingItemsByEventIds(paths, sessionKey, processedEventIds);
                                    return
                                }
                                let drainTurnContext = await prepareDrainTurnContext(paths, sessionKey, {
                                        allowedTools,
                                        tools: defaultClaudeToolNames,
                                        additionalDirectories: [paths.memoryDir]
                                    }, admittedEntries, sessionInfoFromState, {
                                        pendingGatewayNotice: sessionRuntimeState?.pending_gateway_notice,
                                        pendingInterruptedContext: sessionRuntimeState?.pending_interrupted_context,
                                        pendingSkipRewind: sessionRuntimeState?.pending_skip_rewind,
                                        lastEventAtWatermark: sessionRuntimeState?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, perf, value => value),
                                    consumedEventIds = [...processedEventIds, ...admittedEntries.map(entry => entry.item.eventId).filter(eventId => !!eventId)];
                                if (actor.runtime === "codex" || actor.runtime === "grok" || actor.runtime === "pi") {
                                    let steerActiveTurn = actor.adapter?.steerActiveTurn,
                                        trimmed = drainTurnContext.coalescedPromptText.trim(),
                                        activeTurnId = actor.adapter?.activeTurnId?.(),
                                        activeTurnStartedAt = actor.adapter?.activeTurnStartedAt?.(),
                                        sealedBySkip = !1;
                                    if (activeTurnId && activeTurnStartedAt !== void 0)
                                        if (actor.adapter?.activeTurnSkipObserved?.() === !0) sealedBySkip = !0;
                                        else {
                                            let latestState = await readSessionRuntimeState(paths, sessionKey).catch(() => null);
                                            if (latestState === null) sealedBySkip = !0, logWarnMessage("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey
                                            });
                                            else {
                                                let skippedAtMs = Date.parse(latestState.pending_skip_rewind?.skipped_at ?? "");
                                                sealedBySkip = Number.isFinite(skippedAtMs) && skippedAtMs >= activeTurnStartedAt
                                            }
                                        } if (!!steerActiveTurn && !!activeTurnId && !drainTurnContext.isNotifyOnly && !actor.liveTurnNotifyOnly && trimmed.length > 0 && !sealedBySkip && steerActiveTurn && activeTurnId) {
                                        let claimedEventIds = drainTurnContext.batchEventIds.filter(eventId => !actor.inflightEventIds.has(eventId));
                                        for (let eventId of claimedEventIds) actor.inflightEventIds.add(eventId);
                                        if (await steerActiveTurn(trimmed, activeTurnId, drainTurnContext.attachments).catch(() => !1)) {
                                            await deleteMailboxPendingItemsByEventIds(paths, sessionKey, consumedEventIds);
                                            for (let eventId of claimedEventIds) actor.inflightEventIds.delete(eventId);
                                            logInfoMessage("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey,
                                                admittedItems: admittedEntries.length,
                                                batchEventIds: drainTurnContext.batchEventIds
                                            })
                                        } else {
                                            for (let eventId of claimedEventIds) actor.inflightEventIds.delete(eventId);
                                            actor.pendingWake = !0, logInfoMessage("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey,
                                                batchEventIds: drainTurnContext.batchEventIds
                                            })
                                        }
                                    } else actor.pendingWake = !0, logInfoMessage("[session-manager] admission callback: codex steer not attempted, redraining", {
                                        sessionKey,
                                        admittedItems: admittedEntries.length,
                                        batchEventIds: drainTurnContext.batchEventIds,
                                        liveTurn: !!activeTurnId,
                                        notifyOnlyBatch: drainTurnContext.isNotifyOnly,
                                        sealedBySkip,
                                        liveTurnNotifyOnly: actor.liveTurnNotifyOnly,
                                        emptyText: trimmed.length === 0
                                    });
                                    return
                                }
                                let streamingState = actor.streamingState;
                                if (!streamingState || streamingState.closed) return;
                                let currentTurn = streamingState.currentTurn,
                                    hasAttachments = !!drainTurnContext.attachments && drainTurnContext.attachments.length > 0,
                                    trimmed = drainTurnContext.coalescedPromptText.trim();
                                if (!!currentTurn && currentTurn.accepted && !currentTurn.skipCalled && !hasAttachments && !drainTurnContext.isNotifyOnly && !actor.liveTurnNotifyOnly && trimmed.length > 0) {
                                    let pendingSteer = actor.pendingSteer;
                                    if (pendingSteer && !pendingSteer.settled && pendingSteer.spawningTurn === currentTurn) {
                                        let claimedEventIds = drainTurnContext.batchEventIds.filter(eventId => !actor.inflightEventIds.has(eventId));
                                        for (let eventId of claimedEventIds) actor.inflightEventIds.add(eventId);
                                        pendingSteer.steerText = `${pendingSteer.steerText}
${trimmed}`, pendingSteer.eventIds.push(...consumedEventIds), pendingSteer.claimedEventIds.push(...claimedEventIds), pendingSteer.requeueLines.push(...admittedEntries.map(entry => entry.item.line)), pendingSteer.requeueEventIds.push(...admittedEntries.map(entry => entry.item.eventId)), pendingSteer.processedEventIds.push(...processedEventIds), logInfoMessage("[session-manager] admission callback: appended claude steer", {
                                            sessionKey,
                                            admittedItems: admittedEntries.length,
                                            batchEventIds: drainTurnContext.batchEventIds
                                        });
                                        return
                                    }
                                    if (!pendingSteer) {
                                        let claimedEventIds = drainTurnContext.batchEventIds.filter(eventId => !actor.inflightEventIds.has(eventId));
                                        for (let eventId of claimedEventIds) actor.inflightEventIds.add(eventId);
                                        let steer = {
                                            steerText: trimmed,
                                            eventIds: [...consumedEventIds],
                                            claimedEventIds: [...claimedEventIds],
                                            enqueueAsNewTurn: async () => {
                                                let requeuedEventIds = [];
                                                for (let i = 0; i < steer.requeueLines.length; i += 1) {
                                                    let line = steer.requeueLines[i],
                                                        eventId = steer.requeueEventIds[i];
                                                    try {
                                                        await enqueueSessionInboxLine(paths, sessionKey, line), requeuedEventIds.push(eventId)
                                                    } catch (err) {
                                                        logWarnMessage("[session-manager] steer fallback requeue failed", {
                                                            sessionKey,
                                                            eventId,
                                                            error: err instanceof Error ? err.message : String(err)
                                                        })
                                                    }
                                                }
                                                let doneEventIds = [...requeuedEventIds, ...steer.processedEventIds];
                                                if (doneEventIds.length > 0) try {
                                                    await deleteMailboxPendingItemsByEventIds(paths, sessionKey, doneEventIds)
                                                } catch (err) {
                                                    logInfoMessage("[session-manager] steer fallback markDone error", {
                                                        sessionKey,
                                                        error: String(err)
                                                    })
                                                }
                                                for (let eventId of steer.claimedEventIds) actor.inflightEventIds.delete(eventId);
                                                actor.pendingWake = !0, logInfoMessage("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey,
                                                    eventIds: steer.eventIds,
                                                    requeued: requeuedEventIds.length,
                                                    requeueFailed: steer.requeueLines.length - requeuedEventIds.length
                                                })
                                            },
                                            spawningTurn: currentTurn,
                                            requeueLines: admittedEntries.map(entry => entry.item.line),
                                            requeueEventIds: admittedEntries.map(entry => entry.item.eventId),
                                            processedEventIds: [...processedEventIds],
                                            settled: !1
                                        };
                                        actor.pendingSteer = steer, logInfoMessage("[session-manager] admission callback: parked claude steer", {
                                            sessionKey,
                                            admittedItems: admittedEntries.length,
                                            batchEventIds: drainTurnContext.batchEventIds
                                        });
                                        return
                                    }
                                }
                                actor.pendingWake = !0, actor.wakeResolver?.()
                            } catch (err) {
                                logInfoMessage("[session-manager] admission callback error", {
                                    sessionKey,
                                    error: String(err)
                                })
                            }
                        }, actor.runtime === "codex" && !actor.adapter && !runtimeUnavailableReason) {
                        let sessionCwd = (await readSessionRuntimeState(paths, sessionKey))?.cwd;
                        sessionCwd && await ensureAgentsMdSymlink(sessionCwd).catch(() => {}), actor.adapter = codexAdapterFactory({
                            sandbox: resolveCodexSandbox(),
                            env: {
                                [tl]: sessionKey
                            },
                            ephemeral: !1,
                            model: jobModel,
                            dynamicTools: buildCodexDynamicTools({
                                paths,
                                sessionKey,
                                bus,
                                sessionContextKind,
                                notifyDepth,
                                jobScheduleType,
                                callerJobCron: jobCron,
                                getSessionStatus: targetSessionKey => map.get(targetSessionKey)?.status,
                                onNotifyCalled: () => {
                                    actor.agentNotifiedThisDrain = !0
                                }
                            })
                        })
                    }
                    if (actor.runtime === "grok" && !actor.adapter && !runtimeUnavailableReason) {
                        let sessionState = await readSessionRuntimeState(paths, sessionKey).catch(() => null);
                        actor.adapter = grokAdapterFactory({
                            cwd: sessionState?.cwd ?? paths.workDir,
                            env: {
                                [tl]: sessionKey
                            },
                            sdkSessionId: jobStateless ? void 0 : sessionState?.sdk_session_id,
                            mcpServerFactory: () => createAladuoMcpServer(paths, {
                                sessionKey,
                                bus,
                                sessionContextKind,
                                notifyDepth,
                                jobScheduleType,
                                callerRuntime: actor.runtime,
                                callerJobCron: jobCron,
                                getSessionStatus: targetSessionKey => map.get(targetSessionKey)?.status,
                                onNotifyCalled: () => {
                                    actor.agentNotifiedThisDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text
                            }) => emitDetachedTurnOutput(sessionKey, text)
                        })
                    }
                    if (actor.runtime === "pi" && !runtimeUnavailableReason) {
                        let sessionState = await readSessionRuntimeState(paths, sessionKey).catch(() => null),
                            piAgentDir = resolvePiAgentDir(),
                            {
                                settingsSeed,
                                defaultProjectTrust,
                                unknownKeys,
                                readFailed
                            } = readPiAgentSettings(piAgentDir);
                        unknownKeys.length > 0 && logWarnMessage("[session-manager] pi settings keys not classified (SDK bump gate)", {
                            sessionKey,
                            keys: unknownKeys
                        });
                        let configReadFailed = !1,
                            channelConfig = jobPiConfig ? null : await resolveChannelConfigBySession(paths, sessionKey).catch(() => (configReadFailed = !0, null)),
                            jobChannelConfig = jobPiConfig ? await resolveEffectiveChannelConfig(paths, {
                                channel_kind: "job"
                            }).catch(() => (configReadFailed = !0, null)) : null,
                            piConfig = jobPiConfig ?? channelConfig;
                        piConfig?.piConfigIssues?.length && logWarnMessage("[session-manager] invalid pi.* config values ignored (defaults apply)", {
                            sessionKey,
                            issues: piConfig.piConfigIssues
                        });
                        let piModel = (sessionState?.model_runtime === "pi" ? sessionState.model : void 0) ?? (loopJobSnapshot ? loopJobSnapshot.frontmatter.model : jobModel) ?? readRuntimeModelSetting(channelConfig ?? jobChannelConfig, "pi")?.model,
                            piExtensions = piConfig?.piExtensions ?? "all",
                            piSkills = piConfig?.piSkills ?? "all",
                            thinkingLevel = sessionState?.effort ?? (loopJobSnapshot ? loopJobSnapshot.frontmatter.effort : jobEffort) ?? readRuntimeEffortSetting(channelConfig ?? jobChannelConfig, "pi")?.effort,
                            piConfigSignature = buildPiConfigSignature({
                                model: piModel,
                                thinkingLevel,
                                settingsSeed,
                                defaultProjectTrust,
                                extensions: piExtensions,
                                skills: piSkills,
                                instructionsFingerprint: selectInstructionsFingerprint(classifySessionKeyOrUnknown(sessionKey) === "channel", fingerprintGuard)
                            }),
                            constructionFactsRead = !readFailed && !configReadFailed;
                        if (constructionFactsRead || logWarnMessage("[session-manager] pi construction facts unread, keeping the live worker", {
                                sessionKey,
                                seedReadFailed: readFailed,
                                configReadFailed
                            }), actor.adapter && actor.adapterFacts !== piConfigSignature && constructionFactsRead) {
                            let adapter = actor.adapter;
                            actor.adapter = null, actor.adapterFacts = void 0, Promise.resolve(adapter.shutdown()).catch(err => {
                                logWarnMessage("[session-manager] stale pi adapter shutdown failed", {
                                    sessionKey,
                                    error: String(err)
                                })
                            })
                        }
                        if (!actor.adapter)
                            if (!piModel) runtimeUnavailableReason = "pi binds its model when the worker is built, and this session has none. Send `/model <provider>/<modelId>` (channel sessions), or set `model: <provider>/<modelId>` in the job frontmatter, then send the message again.";
                            else {
                                let piSessionDir = td.join(resolveSessionDir(paths, sessionKey), "pi"),
                                    toolContext = {
                                        session_context_kind: sessionContextKind
                                    };
                                actor.adapter = piAdapterFactory({
                                    cwd: sessionState?.cwd ?? paths.workDir,
                                    sdkSessionId: (jobStateless ? void 0 : sessionState?.sdk_session_id) ?? mkt(),
                                    sessionDir: piSessionDir,
                                    agentDir: piAgentDir,
                                    authPath: td.join(piAgentDir, "auth.json"),
                                    modelsPath: td.join(piAgentDir, "models.json"),
                                    modelsStorePath: td.join(piSessionDir, "models-store.json"),
                                    settingsSeed,
                                    resources: {
                                        extensions: piExtensions,
                                        skills: piSkills,
                                        default_project_trust: defaultProjectTrust
                                    },
                                    model: piModel,
                                    thinkingLevel,
                                    workerCommand: resolvePiWorkerCommand(),
                                    env: {
                                        [tl]: sessionKey,
                                        [_C]: paths.daemonSocketPath,
                                        [bC]: issueWorkerToolContextToken({
                                            session_key: sessionKey,
                                            job_cron: jobCron,
                                            job_schedule_type: jobScheduleType,
                                            ...toolContext
                                        }),
                                        [vC]: JSON.stringify(toolContext)
                                    },
                                    onToolEnd: observation => handlePiToolEndObservation(paths, sessionKey, observation),
                                    logDebug: message => logDebugMessage(message, {
                                        sessionKey
                                    }),
                                    logWarn: message => logWarnMessage(message, {
                                        sessionKey
                                    })
                                }), actor.adapterFacts = piConfigSignature
                            }
                    }
                    if (!running || actor.status === "ended") break;
                    let drainSdk = resolveActorSdk(actor);
                    drainResult = await drainSessionMailbox(paths, sessionKey, {
                        sdk: drainSdk,
                        usesStreamingAdapter: drainSdk === actor.streamingAdapter,
                        bus,
                        abortController,
                        runtime: actor.runtime,
                        runtimeUnavailableReason,
                        runtimeRefusal,
                        excludeEventIds: snapshotInflightEventIds(actor),
                        actorSpawnedAt: actor.spawnedAt,
                        actorLastTurnCompletedAt: actor.lastTurnCompletedAt,
                        getStreamGeneration: () => actor.streamingGeneration,
                        holdInputOpenForBackgroundAgents: actor.runtime === "claude" && actor.origin !== "channel",
                        jobContext,
                        memoryBoard: instructions.memoryBoard ? {
                            path: paths.memoryBroadcastPath,
                            content: instructions.memoryBoard
                        } : void 0,
                        boardHash: instructions.memoryBoard ? fingerprintGuard.boardLayerHash : void 0,
                        onBatchContext: batchContext => {
                            if (notifyDepth = batchContext.maxNotifyDepth, batchContext.eventIds)
                                for (let eventId of batchContext.eventIds) actor.inflightEventIds.add(eventId)
                        },
                        mcpServersFactory: () => ({
                            aladuo: createAladuoMcpServer(paths, {
                                sessionKey,
                                bus,
                                sessionContextKind,
                                notifyDepth,
                                jobScheduleType,
                                callerRuntime: actor.runtime,
                                callerJobCron: jobCron,
                                getSessionStatus: targetSessionKey => map.get(targetSessionKey)?.status,
                                onNotifyCalled: () => {
                                    actor.agentNotifiedThisDrain = !0
                                }
                            })
                        }),
                        allowedTools,
                        tools: defaultClaudeToolNames,
                        additionalDirectories: [paths.memoryDir],
                        lockHeartbeatIntervalMs: heartbeatIntervalMs,
                        onSdkTurnStarted: turnInfo => {
                            actor.liveTurnNotifyOnly = turnInfo.notifyOnly, sdkTurnsStarted += 1;
                            let wasNotStarted = !runStarted;
                            if (runStarted = sdkTurnsStarted > sdkTurnsRejected, wasNotStarted && runStarted && actor.origin === "job" && actor.jobId) {
                                let jobId = actor.jobId;
                                pendingJobStateWrites.push(jobManager.updateState(jobId, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: claimCursor
                                }).catch(err => {
                                    logWarnMessage("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey,
                                        jobId,
                                        error: err instanceof Error ? err.message : String(err)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            sdkTurnsRejected += 1;
                            let runUnstarted = runStarted && sdkTurnsStarted <= sdkTurnsRejected;
                            if (runStarted = sdkTurnsStarted > sdkTurnsRejected, runUnstarted && actor.origin === "job" && actor.jobId) {
                                let jobId = actor.jobId;
                                pendingJobStateWrites.push(jobManager.updateState(jobId, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: claimCursor
                                }).catch(err => {
                                    logWarnMessage("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey,
                                        jobId,
                                        error: err instanceof Error ? err.message : String(err)
                                    })
                                }))
                            }
                        },
                        onStream: (chunk, isSidechain, anchorEventId) => {
                            actor.isStreaming = !0, bus.emit("session.stream", {
                                sessionKey,
                                chunk,
                                isSidechain,
                                anchorEventId
                            })
                        },
                        onExecutionEvent: (executionEvent, anchorEventId) => {
                            executionEvent.type === "tool_use" && (actor.isStreaming = !1, actor.activeToolCalls.set(executionEvent.toolUseId, {
                                toolName: executionEvent.toolName,
                                startedAtMs: Date.now()
                            }), actor.pendingPreempt && actor.pendingPreemptBoundary === "tool_use" && (actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, triggerDeferredPreempt(actor))), executionEvent.type === "tool_result" && (actor.activeToolCalls.delete(executionEvent.toolUseId), actor.pendingPreempt && actor.pendingPreemptBoundary === "tool_result" && actor.activeToolCalls.size === 0 && (actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, triggerDeferredPreempt(actor)));
                            let streamEventDedupKey = computeStreamEventDedupKey(executionEvent);
                            if (streamEventDedupKey && seenStreamEventKeys.has(streamEventDedupKey)) return;
                            streamEventDedupKey && seenStreamEventKeys.add(streamEventDedupKey);
                            let sessionExecutionPayload = buildSessionExecutionPayload(executionEvent);
                            if (sessionExecutionPayload) {
                                let isSidechain = executionEvent.type === "tool_use" || executionEvent.type === "tool_result" ? executionEvent.isSidechain : void 0;
                                bus.emit("session.execution", {
                                    sessionKey,
                                    event: sessionExecutionPayload,
                                    anchorEventId,
                                    isSidechain
                                })
                            }
                        }
                    })
                } finally {
                    actor.admissionCallback = null, actor.admissionInProgress || actor.inflightEventIds.clear(), actor.currentAbortController === abortController && (actor.currentAbortController = null), actor.isStreaming = !1, actor.activeToolCalls.clear(), actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null
                }
                if (logSessionLifecycleMessage("[session-manager] drain result", {
                        sessionKey,
                        actorRunId: actor.actorRunId,
                        processed: drainResult.processed,
                        skipped: drainResult.skipped,
                        lockAcquired: drainResult.lockAcquired,
                        outboxRecords: drainResult.outboxRecords?.length ?? (drainResult.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - now
                    }), processedCount += drainResult.processed, mergeTransientFailure = drainResult.mergeTransientFailure === !0, drainResult.cancelled && (cancelled = !0), drainResult.processed > 0 && (actor.lastTurnCompletedAt = Date.now(), await clearSessionRuntimeStateField(paths, sessionKey, "last_error").catch(() => {})), drainResult.compacted && actor.runtime === "claude" && actor.streamingState && !actor.streamingState.closed) {
                    let currentBoardHash = instructions.memoryBoard ? fingerprintGuard.boardLayerHash : void 0;
                    actor.spawnBoardHash !== currentBoardHash && (actor.streamingState.needsRecreation = !0, logAlwaysAtLevel("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey,
                        reason: "board-refresh(B4)",
                        generation: actor.streamingGeneration,
                        spawn_board_hash: actor.spawnBoardHash ? actor.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: currentBoardHash ? currentBoardHash.slice(0, 12) : null
                    }))
                }
                if (actor.pendingClear) actor.sdkSessionId = void 0, actor.pendingClear = !1, await patchSessionRuntimeState(paths, sessionKey, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }).catch(() => {}), logInfoMessage("[session-manager] applied pending clear after drain", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                });
                else {
                    let sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey);
                    if (sessionRuntimeState?.sdk_session_id) {
                        let isNewSession = !actor.sdkSessionId,
                            sessionIdChanged = actor.sdkSessionId !== sessionRuntimeState.sdk_session_id;
                        actor.sdkSessionId = sessionRuntimeState.sdk_session_id, (isNewSession || sessionIdChanged) && logInfoMessage("[session-manager] sdk session bound", {
                            sessionKey,
                            actorRunId: actor.actorRunId,
                            sdkSessionId: actor.sdkSessionId,
                            isNewSession
                        })
                    }
                }
                if (drainResult.lastReplyText && (lastReplyText = drainResult.lastReplyText), drainResult.outboxRecords && drainResult.outboxRecords.length > 0) {
                    logSessionLifecycleMessage("[session-manager] emitting outbox records", {
                        sessionKey,
                        actorRunId: actor.actorRunId,
                        count: drainResult.outboxRecords.length
                    });
                    for (let record of drainResult.outboxRecords) bus.emit("session.output", {
                        sessionKey: record.session_key,
                        record
                    })
                } else drainResult.lastOutboxRecord ? (logSessionLifecycleMessage("[session-manager] emitting single outbox record", {
                    sessionKey,
                    actorRunId: actor.actorRunId,
                    recordId: drainResult.lastOutboxRecord.id
                }), bus.emit("session.output", {
                    sessionKey,
                    record: drainResult.lastOutboxRecord
                })) : actor.origin === "channel" && drainResult.processed > 0 && !drainResult.cancelled && !drainResult.sdkTurns?.length && (logSessionLifecycleMessage("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey,
                    actorRunId: actor.actorRunId,
                    turnSkipped: drainResult.turnSkipped === !0
                }), bus.emit("session.stream_end", {
                    sessionKey: actor.sessionKey,
                    reason: drainResult.turnSkipped === !0 ? "skipped" : "interrupted"
                }));
                if (actor.origin === "channel")
                    for (let sdkTurn of drainResult.sdkTurns ?? []) !sdkTurn.consumed || sdkTurn.hadOutput || (logSessionLifecycleMessage("[session-manager] silent turn, emitting stream_end", {
                        sessionKey,
                        actorRunId: actor.actorRunId,
                        anchorEventId: sdkTurn.anchorEventId,
                        turnSkipped: sdkTurn.skipped
                    }), bus.emit("session.stream_end", {
                        sessionKey: actor.sessionKey,
                        reason: sdkTurn.skipped ? "skipped" : "interrupted",
                        anchorEventId: sdkTurn.anchorEventId
                    }));
                if (drainResult.refusedStage === "runtime_unavailable" || drainResult.refusedStage === "runtime_mismatch") {
                    logSessionLifecycleMessage("[session-manager] runtime refusal, ending actor", {
                        sessionKey,
                        actorRunId: actor.actorRunId,
                        stage: drainResult.refusedStage
                    });
                    break
                }
                if (drainResult.processed === 0) {
                    if (actor.origin === "job" || actor.origin === "system") {
                        logSessionLifecycleMessage("[session-manager] job/system session drain complete, exiting", {
                            sessionKey,
                            actorRunId: actor.actorRunId,
                            origin: actor.origin,
                            jobId: actor.jobId
                        });
                        break
                    }
                    if (actor.pendingWake) {
                        actor.pendingWake = !1, logSessionLifecycleMessage("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey,
                            actorRunId: actor.actorRunId
                        });
                        continue
                    }
                    if (actor.status = "idle", actor.idleSince = new Date().toISOString(), actor.pendingWake) {
                        actor.pendingWake = !1, logSessionLifecycleMessage("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey,
                            actorRunId: actor.actorRunId
                        });
                        continue
                    }
                    if (logSessionLifecycleMessage("[session-manager] idle", {
                            sessionKey,
                            actorRunId: actor.actorRunId,
                            attachedChannels: actor.attachedChannels.size
                        }), actor.holdsPoolSlot) {
                        let pool = poolForSession(sessionKey, actor.origin);
                        pool.activeCount--, actor.holdsPoolSlot = !1, logSessionLifecycleMessage("[session-manager] released pool slot (idle)", {
                            sessionKey,
                            pool: pool.name,
                            activeCount: pool.activeCount
                        }), dequeueQueuedWake(pool)
                    }
                    let exitActor = !1;
                    for (;;) {
                        let woken = !1,
                            managerStopped = !1;
                        for (; actor.status === "idle";) {
                            if (actor.pendingWake) {
                                actor.pendingWake = !1, woken = !0;
                                break
                            }
                            if (!running) {
                                managerStopped = !0;
                                break
                            }
                            if (await waitForWakeOrIdleTimeout(actor, idleTimeoutMs) || actor.status !== "idle") {
                                woken = !0;
                                break
                            }
                            if (actor.attachedChannels.size > 0) {
                                logSessionLifecycleMessage("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey,
                                    actorRunId: actor.actorRunId,
                                    attachedChannels: actor.attachedChannels.size
                                }), actor.streamingState && !actor.streamingState.closed && logAlwaysAtLevel("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey,
                                    generation: actor.streamingGeneration,
                                    sdk_session_id: actor.sdkSessionId ?? null
                                }), await teardownStreamingSession(actor), shutdownActorRuntimeAdapter(actor);
                                continue
                            }
                            break
                        }
                        if (managerStopped) {
                            exitActor = !0;
                            break
                        }
                        if (!woken && actor.status === "idle") {
                            logSessionLifecycleMessage("[session-manager] idle timeout, no attachments, exiting", {
                                sessionKey,
                                actorRunId: actor.actorRunId
                            }), actor.streamingState && !actor.streamingState.closed && logAlwaysAtLevel("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                sessionKey,
                                generation: actor.streamingGeneration,
                                sdk_session_id: actor.sdkSessionId ?? null
                            }), exitActor = !0;
                            break
                        }
                        if (woken && !actor.holdsPoolSlot) {
                            let pool = poolForSession(sessionKey, actor.origin);
                            if (pool.activeCount >= pool.maxConcurrent) {
                                pool.wakeQueue.includes(sessionKey) || pool.wakeQueue.unshift(sessionKey), logSessionLifecycleMessage("[session-manager] woken idle actor re-queued (pool full)", {
                                    sessionKey,
                                    pool: pool.name,
                                    activeCount: pool.activeCount
                                }), actor.pendingWake = !1;
                                continue
                            }
                            pool.activeCount++, actor.holdsPoolSlot = !0, logSessionLifecycleMessage("[session-manager] re-acquired pool slot (woken)", {
                                sessionKey,
                                pool: pool.name,
                                activeCount: pool.activeCount
                            })
                        }
                        break
                    }
                    if (exitActor) break
                }
            }
        } catch (err) {
            logErrorMessage(`[session-manager] error in drain loop for ${sessionKey}:`, err), drainError = err, await patchSessionRuntimeState(paths, sessionKey, {
                last_error: {
                    message: err instanceof Error ? err.message : String(err),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            await teardownStreamingSession(actor), actor.currentAbortController = null, actor.streamingAdapter = null, actor.isStreaming = !1, actor.activeToolCalls.clear(), actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null, await shutdownActorRuntimeAdapter(actor);
            let pool = poolForSession(sessionKey, actor.origin);
            if (actor.holdsPoolSlot && (pool.activeCount--, actor.holdsPoolSlot = !1), actor.origin === "job" && actor.jobId) {
                pendingJobStateWrites.length > 0 && await Promise.allSettled(pendingJobStateWrites);
                try {
                    await finalizeJobSession(actor, {
                        runStarted,
                        cancelled,
                        processedCount,
                        claimCursor,
                        error: drainError,
                        resultText: lastReplyText,
                        jobSnapshot
                    })
                } finally {
                    actor.status = "ended"
                }
            } else actor.status = "ended";
            if (actor.pendingWake = !1, running && dkt(resolveSessionDir(paths, sessionKey)) && !isSessionArchiving(sessionKey)) {
                let inboxVerdict = await sessionInboxFreshNameVerdict(sessionKey, inboxSnapshotNames);
                inboxVerdict === "fresh" ? (actor.consecutiveConservativeRedrive = !1, logSessionLifecycleMessage("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }), wakeSession(sessionKey, {
                    preempt: "never"
                })) : inboxVerdict === "conservative" || mergeTransientFailure ? actor.consecutiveConservativeRedrive ? logWarnMessage("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }) : (actor.consecutiveConservativeRedrive = !0, logSessionLifecycleMessage("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey,
                    actorRunId: actor.actorRunId
                }), wakeSession(sessionKey, {
                    preempt: "never"
                })) : actor.consecutiveConservativeRedrive = !1
            }
            logInfoMessage("[session-manager] actor end", {
                sessionKey,
                actorRunId: actor.actorRunId,
                sdkSessionId: actor.sdkSessionId,
                pool: pool.name,
                activeCount: pool.activeCount,
                origin: actor.origin,
                jobId: actor.jobId,
                attachedChannels: actor.attachedChannels.size,
                queuedSessions: pool.wakeQueue.length
            }), dequeueQueuedWake(pool)
        }
    }

    function spawnJobSession(jobId, sessionKey) {
        if (!running) return;
        if (isSessionArchiving(sessionKey)) {
            logSessionLifecycleMessage("[session-manager] skip job spawn, session is being archived", {
                jobId,
                sessionKey
            });
            return
        }
        let existingActor = map.get(sessionKey);
        if (existingActor && existingActor.status !== "ended") {
            logSessionLifecycleMessage("[session-manager] skip duplicate job spawn", {
                jobId,
                sessionKey,
                actorStatus: existingActor.status
            });
            return
        }
        if (jobPool.activeCount >= jobPool.maxConcurrent) {
            jobPool.wakeQueue.includes(sessionKey) || jobPool.wakeQueue.push(sessionKey), existingActor ? (existingActor.origin = "job", existingActor.jobId = jobId) : map.set(sessionKey, {
                sessionKey,
                actorRunId: 0,
                sdkSessionId: void 0,
                sdkSessionIdVerified: !1,
                status: "idle",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: null,
                streamingGeneration: 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                liveTurnNotifyOnly: !1,
                isStreaming: !1,
                activeToolCalls: new Map,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingPreemptReason: null,
                pendingClear: !1,
                attachedChannels: new Set,
                origin: "job",
                jobId,
                jobStateless: !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                idleSince: void 0,
                agentNotifiedThisDrain: !1,
                runtime: "claude",
                adapter: null,
                consecutiveConservativeRedrive: !1
            });
            return
        }
        startActor(sessionKey, {
            origin: "job",
            jobId
        }), (async () => {
            try {
                let spineEvent = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: jobId
                    },
                    session_key: sessionKey,
                    payload: {
                        job_id: jobId
                    }
                });
                await atomicAppendEvent(paths, spineEvent), bus.emit("job.spawned", {
                    jobId,
                    sessionKey
                })
            } catch (err) {
                logErrorMessage("[session-manager] error recording job spawn", err)
            }
        })()
    }
    async function appendChannelAttachedEvent(sessionKey, channelId) {
        let attachWrite = (map3.get(sessionKey) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (classifySessionKeyKind(sessionKey) !== "channel") return;
            let channelKind = channelKindFromSessionKey(sessionKey),
                attachedAt = new Date().toISOString(),
                spineEvent = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: channelKind,
                        name: "session-manager"
                    },
                    session_key: sessionKey,
                    payload: {
                        session_key: sessionKey,
                        channel_kind: channelKind,
                        channel_id: channelId,
                        attached_at: attachedAt
                    }
                });
            await atomicAppendEvent(paths, spineEvent)
        }).finally(() => {
            map3.get(sessionKey) === attachWrite && map3.delete(sessionKey)
        });
        map3.set(sessionKey, attachWrite), await attachWrite
    }

    function stopAllActors() {
        for (let actor of map.values()) actor.status = "ended", shutdownActorRuntimeAdapter(actor), actor.streamAbortController && !actor.streamAbortController.signal.aborted && actor.streamAbortController.abort(), typeof actor.query?.close == "function" && actor.query.close(), actor.query = null, actor.streamAbortController = null, actor.currentAbortController && !actor.currentAbortController.signal.aborted && actor.currentAbortController.abort(), actor.currentAbortController = null, actor.wakeResolver && (actor.wakeResolver(), actor.wakeResolver = null)
    }
    async function awaitPendingAttachWrites() {
        if (map3.size === 0) return;
        let pendingWrites = Array.from(map3.values()),
            timedOut = !1,
            promise = new Promise(resolve => setTimeout(() => {
                timedOut = !0, resolve()
            }, 3e4));
        await Promise.race([Promise.allSettled(pendingWrites).then(() => {}), promise]), timedOut && logWarnMessage("[session-manager] shutdown abandoned pending attach writes after the fallback", {
            pending: pendingWrites.length
        })
    }
    async function fetchPiModelCatalog(sessionKey) {
        let tempDir;
        try {
            tempDir = fkt(td.join(hkt(), "aladuo-pi-catalog-"));
            let piAgentDir = resolvePiAgentDir(),
                {
                    settingsSeed,
                    defaultProjectTrust
                } = readPiAgentSettings(piAgentDir),
                channelConfig = await resolveChannelConfigBySession(paths, sessionKey).catch(() => null),
                sessionState = await readSessionRuntimeState(paths, sessionKey).catch(() => null),
                catalog = await requestPiWorkerCatalog({
                    cwd: sessionState?.cwd ?? paths.workDir,
                    agentDir: piAgentDir,
                    authPath: td.join(piAgentDir, "auth.json"),
                    modelsPath: td.join(piAgentDir, "models.json"),
                    modelsStorePath: td.join(tempDir, "models-store.json"),
                    settingsSeed,
                    resources: {
                        extensions: channelConfig?.piExtensions ?? "all",
                        default_project_trust: defaultProjectTrust
                    },
                    workerCommand: resolvePiWorkerCommand(),
                    logDebug: message => logDebugMessage("[pi-catalog] " + message)
                });
            return catalog.length > 0 ? catalog : void 0
        } catch (err) {
            logWarnMessage("[session-manager] pi model catalog failed", {
                sessionKey,
                error: String(err)
            });
            return
        } finally {
            try {
                tempDir && pkt(tempDir, {
                    recursive: !0,
                    force: !0
                })
            } catch {}
        }
    }
    return {
        async start() {
            if (!running) {
                running = !0, bus.on("session.wake", onSessionWake), bus.on("shutdown", onShutdown), bus.on("session.streaming_invalidated", onStreamingInvalidated);
                try {
                    let sessionKeys = await rehydrateSessionState(paths);
                    for (let sessionKey of sessionKeys) {
                        if (isSessionArchiving(sessionKey)) {
                            logSessionLifecycleMessage("[session-manager] skip hydrating session being archived", {
                                sessionKey
                            });
                            continue
                        }
                        let cwd = (await readSessionRuntimeState(paths, sessionKey))?.cwd;
                        if (cwd && !isAvailableWorkspacePath(cwd)) {
                            logWarnMessage("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey,
                                cwd
                            });
                            continue
                        }
                        wakeSession(sessionKey, {
                            preempt: "never"
                        })
                    }
                } catch (err) {
                    logErrorMessage("[session-manager] error hydrating sessions:", err)
                }
                logInfoMessage("[session-manager] started", {
                    channelActive: channelPool.activeCount,
                    channelQueued: channelPool.wakeQueue.length,
                    jobActive: jobPool.activeCount,
                    jobQueued: jobPool.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!running) return;
            running = !1, bus.off("session.wake", onSessionWake), bus.off("shutdown", onShutdown), bus.off("session.streaming_invalidated", onStreamingInvalidated), stopAllActors();
            let drainPromises = Array.from(map.values()).map(actor => actor.drainPromise).filter(drainPromise => drainPromise !== null);
            if (drainPromises.length > 0) {
                let drainingActors = Array.from(map.values()).filter(actor => actor.drainPromise !== null),
                    timedOut = !1,
                    promise = new Promise(resolve => setTimeout(() => {
                        timedOut = !0, resolve()
                    }, 3e4));
                await Promise.race([Promise.all(drainPromises), promise]), timedOut && logWarnMessage("[session-manager] shutdown abandoned running drains after the fallback", {
                    sessions: drainingActors.map(actor => actor.sessionKey),
                    runtimes: drainingActors.map(actor => actor.runtime)
                })
            }
            await awaitPendingAttachWrites(), map.clear(), channelPool.wakeQueue.length = 0, channelPool.activeCount = 0, jobPool.wakeQueue.length = 0, jobPool.activeCount = 0, logInfoMessage("[session-manager] stopped")
        },
        wakeSession,
        getActor(sessionKey) {
            return map.get(sessionKey)
        },
        activeCount() {
            return channelPool.activeCount + jobPool.activeCount
        },
        activeChannelCount() {
            return channelPool.activeCount
        },
        activeJobCount() {
            return jobPool.activeCount
        },
        isRunning() {
            return running
        },
        attachChannel(sessionKey, channelId) {
            let actor = map.get(sessionKey);
            actor || (actor = {
                sessionKey,
                actorRunId: 0,
                sdkSessionId: void 0,
                sdkSessionIdVerified: !1,
                status: "idle",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: null,
                streamingGeneration: 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                liveTurnNotifyOnly: !1,
                isStreaming: !1,
                activeToolCalls: new Map,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingPreemptReason: null,
                pendingClear: !1,
                attachedChannels: new Set,
                origin: "channel",
                jobStateless: !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                idleSince: void 0,
                agentNotifiedThisDrain: !1,
                runtime: "claude",
                adapter: null,
                consecutiveConservativeRedrive: !1
            }, map.set(sessionKey, actor)), actor.attachedChannels.add(channelId), logSessionLifecycleMessage("[session-manager] channel attached", {
                sessionKey,
                channelId,
                totalAttachments: actor.attachedChannels.size
            }), appendChannelAttachedEvent(sessionKey, channelId).catch(err => {
                logWarnMessage("[session-manager] failed to emit channel.attached event", {
                    sessionKey,
                    channelId,
                    error: String(err)
                })
            })
        },
        detachChannel(sessionKey, channelId) {
            let actor = map.get(sessionKey);
            actor && (actor.attachedChannels.delete(channelId), logSessionLifecycleMessage("[session-manager] channel detached", {
                sessionKey,
                channelId,
                remainingAttachments: actor.attachedChannels.size
            }), actor.attachedChannels.size === 0 && actor.status === "idle" && actor.wakeResolver && (actor.wakeResolver(), actor.wakeResolver = null))
        },
        hasAttachedChannels(sessionKey) {
            let actor = map.get(sessionKey);
            return actor ? actor.attachedChannels.size > 0 : !1
        },
        spawnJobSession(jobId, sessionKey) {
            spawnJobSession(jobId, sessionKey)
        },
        async interruptSession(sessionKey) {
            if (!running) return {
                interrupted: !1,
                reason: "not_running"
            };
            let actor = map.get(sessionKey);
            return actor ? !actor.query && (!actor.currentAbortController || actor.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : actor.streamAbortController && !actor.streamAbortController.signal.aborted ? (logInfoMessage("[session-manager] interrupt: stopping streaming session", {
                sessionKey,
                actorRunId: actor.actorRunId
            }), await teardownStreamingSession(actor, "cancel-interrupt", "user-cancel"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (requestBoundaryAwarePreempt(actor, "immediate", void 0, "user-cancel") === "immediate" && logInfoMessage("[session-manager] interrupt requested", {
                sessionKey,
                actorRunId: actor.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(sessionKey) {
            if (!running) return {
                cleared: !1,
                reason: "not_running"
            };
            let actor = map.get(sessionKey),
                previousSessionId = actor?.sdkSessionId;
            if (actor && (actor.pendingClear = !0, actor.sdkSessionId = void 0, actor.sdkSessionIdVerified = !1, actor.pendingInterruptMarker = null), actor?.streamAbortController && !actor.streamAbortController.signal.aborted ? await teardownStreamingSession(actor, "clear") : actor?.currentAbortController && !actor.currentAbortController.signal.aborted && requestBoundaryAwarePreempt(actor, "immediate"), await patchSessionRuntimeState(paths, sessionKey, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }), (actor?.runtime === "pi" || actor?.runtime === "grok") && actor.adapter) {
                let adapter = actor.adapter;
                actor.adapter = null, actor.adapterFacts = void 0, await Promise.resolve(adapter.shutdown()).catch(err => {
                    logWarnMessage("[session-manager] runtime adapter shutdown on clear failed", {
                        sessionKey,
                        runtime: actor.runtime,
                        error: String(err)
                    })
                })
            }
            return logInfoMessage("[session-manager] SDK session cleared", {
                sessionKey,
                actorRunId: actor?.actorRunId,
                previousSessionId
            }), {
                cleared: !0,
                previousSessionId
            }
        },
        async getSessionModelView(sessionKey, context) {
            let actor = map.get(sessionKey),
                sessionState = await readSessionRuntimeState(paths, sessionKey).catch(() => null),
                runtime = await resolveRuntimeForModelCommand(sessionKey, actor),
                refusal = await runtimeCommandRefusal(sessionKey);
            if (refusal) return {
                runtime,
                refusal,
                hasLiveQuery: !1
            };
            let view = {
                    runtime,
                    storedModel: sessionState?.model,
                    hasLiveQuery: !!actor?.query
                },
                profileScope = await resolveModelProfileScope(sessionKey, context).catch(err => (logWarnMessage("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey,
                    error: err instanceof Error ? err.message : String(err)
                }), null)),
                runtimeModelSetting = readRuntimeModelSetting(profileScope, runtime);
            if (runtimeModelSetting && (view.configModel = {
                    ...runtimeModelSetting
                }), sessionState?.last_served_model && (view.lastServedModel = sessionState.last_served_model), runtime === "pi") return view.piProviders = await fetchPiModelCatalog(sessionKey), view;
            let liveQuery = actor?.query;
            if (liveQuery && typeof liveQuery.supportedModels == "function") try {
                view.available = toModelOptions(await liveQuery.supportedModels())
            } catch {}
            try {
                if (profileScope && runtime === "claude") {
                    let profiles = Object.entries(profileScope.claudeModelProfiles ?? {}).map(([model, profile]) => {
                        let urlHost = extractUrlHost(profile.baseUrl);
                        return {
                            model,
                            contextWindow: profile.cap,
                            source: profile.source,
                            ...urlHost ? {
                                endpointHost: urlHost
                            } : {}
                        }
                    });
                    profiles.length > 0 && (view.profiles = profiles.sort((a, b) => a.model.localeCompare(b.model)));
                    let aliases = Object.entries(profileScope.claudeModelAliases ?? {}).map(([tier, alias]) => ({
                        tier,
                        model: alias.model,
                        source: alias.source
                    })).sort((a, b) => a.tier.localeCompare(b.tier));
                    if (aliases.length > 0 && (view.aliases = aliases), !view.storedModel && !view.configModel) {
                        let claudeContextRequirement = await resolveClaudeContextRequirement({
                                model: null,
                                cwd: buildSessionInfoFromState(paths, sessionKey, sessionState ?? void 0).cwd,
                                daemonEnv: process.env,
                                mergedCatalog: profileScope.claudeModelProfiles ?? {},
                                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                                issues: profileScope.claudeModelProfileIssues
                            }),
                            modelOrigin = claudeContextRequirement.modelOrigin;
                        claudeContextRequirement.kind === "profiled-external" && (modelOrigin === "project" || modelOrigin === "user" || modelOrigin === "env") && (view.cliDefaultModel = {
                            model: claudeContextRequirement.model,
                            origin: modelOrigin
                        })
                    }
                    let profileIssues = [...profileScope.claudeModelProfileIssues ?? [], ...profileScope.claudeModelAliasIssues ?? []];
                    profileIssues.length > 0 && (view.profileIssues = profileIssues.map(issue => ({
                        ...issue.model !== void 0 ? {
                            model: issue.model
                        } : {},
                        reason: issue.reason,
                        ...issue.layer !== void 0 ? {
                            layer: issue.layer
                        } : {}
                    })))
                }
            } catch (err) {
                logWarnMessage("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey,
                    error: err instanceof Error ? err.message : String(err)
                })
            }
            return view
        },
        async setSessionModel(sessionKey, model, context) {
            if (!running) return {
                ok: !1,
                reason: "not_running"
            };
            let actor = map.get(sessionKey),
                refusal = await runtimeCommandRefusal(sessionKey);
            if (refusal) return {
                ok: !1,
                reason: "runtime_rejected",
                detail: refusal
            };
            let runtime = await resolveRuntimeForModelCommand(sessionKey, actor);
            if (runtime === "pi") return model !== null && !isProviderQualifiedModelId(model) ? {
                ok: !1,
                reason: "runtime_rejected",
                detail: `pi model ids are canonical "provider/modelId" (got "${model}")`
            } : (await patchSessionRuntimeState(paths, sessionKey, {
                model: model ?? null,
                model_runtime: model !== null ? "pi" : null,
                pending_model_fork: null
            }), logInfoMessage("[session-manager] pi session model override updated", {
                sessionKey,
                model: model ?? "(reset to default)",
                applied: "stored"
            }), {
                ok: !0,
                model,
                applied: "stored"
            });
            if (runtime === "grok") {
                let settableAdapter = narrowToModelSettableAdapter(actor?.adapter),
                    hasLiveSession = !!(settableAdapter && (settableAdapter.hasSession?.() ?? !0));
                if (model !== null && settableAdapter && hasLiveSession) try {
                    await settableAdapter.setModel({
                        modelId: model
                    })
                } catch (err) {
                    let errorMessage = err instanceof Error ? err.message : String(err);
                    return logWarnMessage("[session-manager] grok session/set_model failed", {
                        sessionKey,
                        model,
                        error: errorMessage
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: errorMessage
                    }
                }
                return await patchSessionRuntimeState(paths, sessionKey, {
                    model: model ?? null,
                    model_runtime: model !== null ? "grok" : null,
                    pending_model_fork: null
                }), logInfoMessage("[session-manager] grok session model override updated", {
                    sessionKey,
                    model: model ?? "(reset to default)",
                    applied: model !== null && hasLiveSession ? "live" : "stored"
                }), {
                    ok: !0,
                    model,
                    applied: model !== null && hasLiveSession ? "live" : "stored"
                }
            }
            if (runtime === "codex") return await patchSessionRuntimeState(paths, sessionKey, {
                model: model ?? null,
                model_runtime: model !== null ? "codex" : null,
                pending_model_fork: !0
            }), logInfoMessage("[session-manager] codex session model override updated", {
                sessionKey,
                model: model ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model,
                applied: "stored",
                pending_model_fork: !0
            };
            let liveQuery = actor?.query,
                listed;
            if (model && liveQuery && typeof liveQuery.supportedModels == "function") try {
                listed = (await liveQuery.supportedModels()).some(option => option.value === model)
            } catch {}
            let classification = await classifyModelTargetAgainstLiveGeneration(sessionKey, actor, model, context).catch(err => (logWarnMessage("[session-manager] model context profile classification failed — applying live", {
                sessionKey,
                model: model ?? "(reset to default)",
                error: err instanceof Error ? err.message : String(err)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (classification.outcome === "blocked") return logWarnMessage("[session-manager] /model refused: unresolved model context profile", {
                sessionKey,
                model: model ?? "(reset to default)",
                detail: classification.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: classification.detail
            };
            let needsRebuild = classification.outcome === "rebuild",
                applied = needsRebuild ? "stored_pending_rebuild" : "stored",
                rebuildModel = null,
                streamingState = actor?.streamingState;
            if (!needsRebuild && !!streamingState && streamingState?.closed === !1 && (model ?? null) === (streamingState?.liveModel ?? null)) applied = "live";
            else if (!needsRebuild && liveQuery && typeof liveQuery.setModel == "function") try {
                await liveQuery.setModel(model ?? void 0), applied = "live", streamingState && !streamingState.closed && (streamingState.liveModel = model ?? void 0)
            } catch (err) {
                logWarnMessage("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey,
                    model: model ?? "(reset to default)",
                    error: err instanceof Error ? err.message : String(err)
                }), model && actor && isLiveStreamRebuildRequired(actor, classification.requirementKind) && (applied = "stored_pending_rebuild", rebuildModel = model)
            }
            return await patchSessionRuntimeState(paths, sessionKey, {
                model: model ?? null,
                model_runtime: model !== null ? "claude" : null,
                pending_model_fork: null
            }), rebuildModel && actor && flagStreamRecreationOnModelReject(actor, {
                model: rebuildModel,
                requirementKind: classification.requirementKind,
                reason: "live-command"
            }), logInfoMessage("[session-manager] session model override updated", {
                sessionKey,
                model: model ?? "(reset to default)",
                applied,
                listed: listed ?? "(no list consulted)",
                contextProfile: classification.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model,
                applied,
                listed,
                contextProfile: classification.requirementKind,
                ...classification.contextWindow ? {
                    contextWindow: classification.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(sessionKey, context) {
            let actor = map.get(sessionKey),
                sessionState = await readSessionRuntimeState(paths, sessionKey).catch(() => null),
                runtime = await resolveRuntimeForModelCommand(sessionKey, actor),
                refusal = await runtimeCommandRefusal(sessionKey);
            if (refusal) return {
                runtime,
                refusal,
                hasLiveQuery: !1
            };
            let view = {
                    runtime,
                    storedEffort: sessionState?.effort ?? void 0,
                    hasLiveQuery: !!actor?.query
                },
                profileScope = await resolveModelProfileScope(sessionKey, context).catch(err => (logWarnMessage("[session-manager] /effort view: config scope unreadable", {
                    sessionKey,
                    error: err instanceof Error ? err.message : String(err)
                }), null)),
                runtimeEffortSetting = readRuntimeEffortSetting(profileScope, runtime);
            return runtimeEffortSetting && (view.configEffort = {
                ...runtimeEffortSetting
            }), view
        },
        async setSessionEffort(sessionKey, effort) {
            if (!running) return {
                ok: !1,
                reason: "not_running"
            };
            let actor = map.get(sessionKey),
                refusal = await runtimeCommandRefusal(sessionKey);
            if (refusal) return {
                ok: !1,
                reason: "runtime_rejected",
                detail: refusal
            };
            let runtime = await resolveRuntimeForModelCommand(sessionKey, actor);
            if (runtime === "pi") return await patchSessionRuntimeState(paths, sessionKey, {
                effort: effort ?? null
            }), logInfoMessage("[session-manager] pi session effort override updated", {
                sessionKey,
                effort: effort ?? "(reset to default)"
            }), {
                ok: !0,
                effort,
                applied: "stored"
            };
            if (runtime === "grok") {
                let settableAdapter = narrowToModelSettableAdapter(actor?.adapter),
                    modelId = (await readSessionRuntimeState(paths, sessionKey).catch(() => null))?.model ?? settableAdapter?.currentModelId?.(),
                    hasLiveSession = !!(settableAdapter && (settableAdapter.hasSession?.() ?? !0) && modelId);
                if (effort !== null) {
                    if (!hasLiveSession || !settableAdapter || !modelId) return await patchSessionRuntimeState(paths, sessionKey, {
                        effort
                    }), logInfoMessage("[session-manager] grok session effort override updated", {
                        sessionKey,
                        effort,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort,
                        applied: "stored"
                    };
                    try {
                        await settableAdapter.setModel({
                            modelId,
                            reasoningEffort: effort
                        })
                    } catch (err) {
                        let errorMessage = err instanceof Error ? err.message : String(err);
                        return logWarnMessage("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey,
                            effort,
                            error: errorMessage
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: errorMessage
                        }
                    }
                    return await patchSessionRuntimeState(paths, sessionKey, {
                        effort
                    }), logInfoMessage("[session-manager] grok session effort override updated", {
                        sessionKey,
                        effort,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort,
                        applied: "live"
                    }
                }
                if (settableAdapter && modelId && (settableAdapter.hasSession?.() ?? !0)) {
                    try {
                        await settableAdapter.setModel({
                            modelId
                        })
                    } catch (err) {
                        let errorMessage = err instanceof Error ? err.message : String(err);
                        return logWarnMessage("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey,
                            error: errorMessage
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: errorMessage
                        }
                    }
                    return await patchSessionRuntimeState(paths, sessionKey, {
                        effort: null
                    }), logInfoMessage("[session-manager] grok session effort override updated", {
                        sessionKey,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await patchSessionRuntimeState(paths, sessionKey, {
                    effort: null
                }), logInfoMessage("[session-manager] grok session effort override updated", {
                    sessionKey,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (runtime === "codex") return await patchSessionRuntimeState(paths, sessionKey, {
                effort: effort ?? null
            }), logInfoMessage("[session-manager] codex session effort override updated", {
                sessionKey,
                effort: effort ?? "(reset to default)"
            }), {
                ok: !0,
                effort,
                applied: "stored"
            };
            let liveQuery = actor?.query,
                applied = "stored";
            if (liveQuery && typeof liveQuery.applyFlagSettings == "function") try {
                await liveQuery.applyFlagSettings({
                    effortLevel: effort ?? null
                }), applied = "live", actor?.streamingState && (actor.streamingState.lastAppliedEffort = effort ?? null)
            } catch (err) {
                logWarnMessage("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey,
                    effort: effort ?? "(reset to default)",
                    error: err instanceof Error ? err.message : String(err)
                })
            }
            return await patchSessionRuntimeState(paths, sessionKey, {
                effort: effort ?? null
            }), logInfoMessage("[session-manager] session effort override updated", {
                sessionKey,
                effort: effort ?? "(reset to default)",
                applied
            }), {
                ok: !0,
                effort,
                applied
            }
        },
        getActorView(sessionKey) {
            let actor = map.get(sessionKey);
            return !actor || actor.actorRunId <= 0 ? null : {
                sessionKey: actor.sessionKey,
                status: actor.status,
                health: "ok",
                idleSince: actor.status === "idle" ? actor.idleSince : void 0,
                attachedChannels: actor.attachedChannels.size,
                sdkSessionId: actor.sdkSessionId,
                origin: actor.origin,
                jobId: actor.jobId,
                runtime: actor.runtime,
                activeToolCalls: [...actor.activeToolCalls.values()]
            }
        },
        hasQueuedWake,
        listActors() {
            let map2 = new Map;
            for (let [sessionKey, actor] of map) actor.actorRunId <= 0 && !hasQueuedWake(actor.sessionKey) || map2.set(sessionKey, {
                sessionKey: actor.sessionKey,
                status: actor.status,
                health: "ok",
                idleSince: actor.status === "idle" ? actor.idleSince : void 0,
                attachedChannels: actor.attachedChannels.size,
                sdkSessionId: actor.sdkSessionId,
                origin: actor.origin,
                jobId: actor.jobId,
                runtime: actor.runtime,
                activeToolCalls: [...actor.activeToolCalls.values()]
            });
            return map2
        },
        getSweeperActorState(sessionKey) {
            let actor = map.get(sessionKey);
            return !actor || actor.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: actor.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: actor.lastActivityAt,
                lastTurnCompletedAt: actor.lastTurnCompletedAt,
                spawnedAt: actor.spawnedAt
            }
        },
        markAgentNotified(sessionKey) {
            let actor = map.get(sessionKey);
            actor && (actor.agentNotifiedThisDrain = !0)
        }
    }
}
