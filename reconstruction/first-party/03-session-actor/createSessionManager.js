// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: gbt, daemon.pretty.js:83964)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
    let {
        paths: t,
        bus: n,
        sdk: r,
        idleTimeoutMs: i = 36e5,
        heartbeatIntervalMs: o = 3e4
    } = e, s = r ?? createAgentSdkAdapter(), a = new Br(t), {
        listSessionInboxPendingNames: u,
        sessionInboxFreshNameVerdict: l,
        finalizeJobSession: c
    } = createJobSessionFinalizer({
        paths: t,
        bus: n,
        jobManager: a
    }), d = e.codexAvailability ?? checkCodexAvailability, f = e.codexAdapterFactory ?? createCodexAppServerAdapter, p = memoizeAvailabilityProbeUntilOk(d), m = e.grokAvailability ?? checkGrokAvailability, h = e.grokAdapterFactory ?? createGrokAcpAdapter, g = e.piAdapterFactory ?? createPiWorkerAdapter, y = memoizeAvailabilityProbeUntilOk(m), v = w => w === "codex" ? p() : w === "grok" ? y() : void 0, {
        toModelOptions: b,
        resolveRuntimeForModelCommand: _,
        runtimeCommandRefusal: E,
        resolveModelProfileScope: R,
        classifyModelTargetAgainstLiveGeneration: P
    } = createModelCommandResolvers({
        paths: t
    }), {
        ensureStreamingSession: k
    } = createClaudeStreamingSessionFactory({
        paths: t,
        bus: n,
        resolvedSdk: s,
        classifyModelTargetAgainstLiveGeneration: P
    });
    async function S(w, T) {
        let L = T.trim();
        if (!L) return;
        let z = createOutboxRecord({
            channel_kind: uk(w),
            session_key: w,
            payload: {
                text: L
            }
        });
        try {
            await Va(t, z), n.emit("session.output", {
                sessionKey: w,
                record: z
            })
        } catch (U) {
            Ue("[session-manager] grok detached-turn outbox write failed", {
                sessionKey: w,
                error: U instanceof Error ? U.message : String(U)
            })
        }
    }
    let D = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        A = e.maxConcurrentJob ?? 6,
        $ = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: D,
            wakeQueue: []
        },
        C = {
            name: "job",
            activeCount: 0,
            maxConcurrent: A,
            wakeQueue: []
        };

    function N(w, T) {
        return classifySessionPoolKind(w, T) === "job" ? C : $
    }

    function x(w) {
        return $.wakeQueue.includes(w) || C.wakeQueue.includes(w)
    }

    function M(w) {
        if (w.wakeQueue.length === 0 || !ie) return;
        let T = w.wakeQueue.findIndex(U => !isSessionArchiving(U));
        if (T === -1) {
            ut("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: w.name,
                queuedSessions: w.wakeQueue.length
            });
            return
        }
        let L = w.wakeQueue.splice(T, 1)[0];
        T > 0 && ut("[session-manager] dequeue skipped archiving sessions", {
            skipped: T,
            sessionKey: L,
            pool: w.name
        }), ut("[session-manager] dequeue queued wake", {
            sessionKey: L,
            pool: w.name,
            queuedSessions: w.wakeQueue.length
        });
        let z = F.get(L);
        if (z && z.status === "idle" && !z.holdsPoolSlot && z.drainPromise) {
            z.pendingWake = !0, z.wakeResolver && (z.wakeResolver(), z.wakeResolver = null), ut("[session-manager] resuming idle actor from dequeue", {
                sessionKey: L,
                actorRunId: z.actorRunId,
                pool: w.name
            });
            return
        }
        if (w.activeCount >= w.maxConcurrent) {
            w.wakeQueue.unshift(L), ut("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: L,
                pool: w.name,
                activeCount: w.activeCount
            });
            return
        }
        if (z?.origin === "job" && z.jobId) {
            let U = z.jobId;
            B(L, {
                origin: "job",
                jobId: U
            })
        } else {
            let U = inferActorOriginFromSessionKey(L);
            B(L, U ?? void 0)
        }
    }
    let F = new Map,
        J = new Map,
        ce = new Map,
        ie = !1,
        Ce = 0,
        se = ({
            sessionKey: w,
            displayName: T,
            preempt: L,
            preemptBoundary: z
        }) => {
            ut("[session-manager] wake", {
                sessionKey: w,
                preempt: L ?? "allow",
                preemptBoundary: z ?? "default"
            }), T && J.set(w, T), te(w, {
                preempt: L,
                preemptBoundary: z
            })
        },
        j = () => {
            pe()
        },
        ne = ({
            sessionKey: w,
            reason: T
        }) => {
            let L = F.get(w);
            if (!L) return;
            let z = L.streamingAdapter !== null;
            L.streamingAdapter = null;
            let U = !1;
            L.streamingState && !L.streamingState.closed && (L.streamingState.needsRecreation = !0, U = !0), (z || U) && ee("[session-manager] streamingAdapter torn down for session", {
                sessionKey: w,
                reason: T,
                hadAdapter: z,
                stateMarked: U
            }), U && vt("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: w,
                reason: "instructions-drift",
                generation: L.streamingGeneration,
                sdk_session_id: L.sdkSessionId ?? null
            })
        };

    function K(w) {
        return w.runtime !== "claude" ? w.adapter ? w.adapter : {
            run: async () => {
                throw new Error(`${w.runtime} runtime selected but its adapter was not built; refusing to fall through to Claude`)
            }
        } : w.origin !== "channel" || !s.createStreamingQuery ? s : (w.streamingAdapter || (w.streamingAdapter = {
            run: async T => {
                let L = await k(w, T),
                    z = prependPendingInterruptMarker(w, T);
                return await new Promise((U, Y) => {
                    if (L.closed) {
                        Y(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    L.queue.enqueue({
                        input: z,
                        resolve: U,
                        reject: Y,
                        accepted: !1,
                        sessionId: T.sessionId,
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
            createStreamingQuery: s.createStreamingQuery
        }), w.streamingAdapter)
    }

    function te(w, T) {
        if (!ie) {
            ut("[session-manager] wake ignored, manager not running", {
                sessionKey: w
            });
            return
        }
        if (isSessionArchiving(w)) {
            ut("[session-manager] wake suppressed, session is being archived", {
                sessionKey: w
            });
            return
        }
        let L = T?.preempt ?? "allow",
            z = T?.preemptBoundary,
            U = F.get(w);
        if (U && U.wakeResolver) {
            ut("[session-manager] wake delivered to idle actor", {
                sessionKey: w,
                actorRunId: U.actorRunId,
                status: U.status,
                preemptBoundary: z ?? "default"
            }), U.wakeResolver(), U.wakeResolver = null;
            return
        }
        if (U && U.drainPromise && (U.status === "active" || U.status === "idle")) {
            let re = !!U.query && U.streamingState?.currentTurn?.accepted === !0,
                Ee = !!U.adapter?.activeTurnId?.();
            if (L === "allow" && (re || Ee) && U.admissionCallback && !U.admissionInProgress) {
                U.pendingWake = !0, U.admissionInProgress = !0;
                let Oe = U.admissionCallback;
                ut("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: w,
                    actorRunId: U.actorRunId
                }), Oe().then(() => {
                    U.admissionInProgress = !1, U.wakeResolver?.()
                }, () => {
                    U.admissionInProgress = !1, U.wakeResolver?.()
                });
                return
            }
            if (U.status === "active" && U.currentAbortController)
                if (L === "force") {
                    let Oe = requestBoundaryAwarePreempt(U, "immediate", z, "preempt");
                    Oe === "immediate" ? ut("[session-manager] wake: forced preempt", {
                        sessionKey: w,
                        actorRunId: U.actorRunId,
                        preemptBoundary: z ?? "default"
                    }) : Oe === "defer_accept" ? ut("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: w,
                        actorRunId: U.actorRunId
                    }) : Oe === "defer_tool_result" ? ut("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: w,
                        actorRunId: U.actorRunId
                    }) : Oe === "defer_tool_use" && ut("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: w,
                        actorRunId: U.actorRunId
                    })
                } else if (L === "allow") {
                let Oe = requestBoundaryAwarePreempt(U, "soft", z, "preempt");
                Oe === "defer_accept" ? ut("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: w,
                    actorRunId: U.actorRunId
                }) : Oe === "defer_tool_use" ? ut("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: w,
                    actorRunId: U.actorRunId
                }) : Oe === "defer_tool_result" ? ut("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: w,
                    actorRunId: U.actorRunId
                }) : Oe === "immediate" && ut("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: w,
                    actorRunId: U.actorRunId
                })
            } else ut("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: w,
                actorRunId: U.actorRunId
            });
            U.pendingWake = !0, ut("[session-manager] wake marked pending", {
                sessionKey: w,
                actorRunId: U.actorRunId,
                status: U.status
            });
            return
        }
        let Y = N(w, U?.origin);
        if (Y.activeCount >= Y.maxConcurrent) {
            let re = Y.wakeQueue.includes(w);
            re || Y.wakeQueue.push(w), ut("[session-manager] wake queued", {
                sessionKey: w,
                pool: Y.name,
                activeCount: Y.activeCount,
                maxConcurrent: Y.maxConcurrent,
                alreadyQueued: re,
                queuedSessions: Y.wakeQueue.length
            });
            return
        }
        let me = inferActorOriginFromSessionKey(w);
        me ? (ut("[session-manager] wake starting actor with inferred origin", {
            sessionKey: w,
            ...me
        }), B(w, me)) : (ut("[session-manager] wake starting actor", {
            sessionKey: w
        }), B(w))
    }

    function B(w, T) {
        let L = F.get(w),
            z = L?.attachedChannels ?? new Set,
            U = ++Ce,
            Y = {
                sessionKey: w,
                actorRunId: U,
                sdkSessionId: L?.sdkSessionId,
                sdkSessionIdVerified: L?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: L?.streamingAdapter ?? null,
                streamingGeneration: L?.streamingGeneration ?? 0,
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
                attachedChannels: z,
                origin: T?.origin ?? L?.origin ?? "channel",
                jobId: T?.jobId ?? L?.jobId,
                jobStateless: L?.jobStateless ?? !1,
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
                runtime: T?.runtime ?? L?.runtime ?? "claude",
                adapter: L?.adapter ?? null,
                adapterFacts: L?.adapterFacts,
                consecutiveConservativeRedrive: L?.consecutiveConservativeRedrive ?? !1
            };
        F.set(w, Y);
        let me = N(w, Y.origin);
        me.activeCount++, Y.holdsPoolSlot = !0;
        let re = J.get(w);
        if (re && J.delete(w), ensureSessionDescriptorAndStateFiles(t, {
                session_key: w,
                display_name: re,
                kind: Y.origin === "job" ? "job" : Y.origin === "system" ? "system" : w.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), ee("[session-manager] actor start", {
                sessionKey: w,
                actorRunId: U,
                sdkSessionId: Y.sdkSessionId,
                origin: Y.origin,
                jobId: Y.jobId,
                pool: me.name,
                activeCount: me.activeCount,
                attachedChannels: Y.attachedChannels.size,
                queuedSessions: me.wakeQueue.length
            }), T?.preStart) {
            let Ee = T.preStart;
            Y.drainPromise = Ee().catch(Oe => Ue("[session-manager] preStart failed", Oe)).then(() => G(Y))
        } else Y.drainPromise = G(Y)
    }
    async function G(w) {
        let {
            sessionKey: T
        } = w, L, z, U = 0, Y = 0, me = !1, re = [], Ee = 0, Oe = !1, Xe = !1, nt = null, Ze = null, qe;
        try {
            qe = await u(T)
        } catch (Ae) {
            Z("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: T,
                error: Ae instanceof Error ? Ae.message : String(Ae)
            }), qe = new Set
        }
        ut("[session-manager] drain loop begin", {
            sessionKey: T,
            actorRunId: w.actorRunId,
            origin: w.origin,
            jobId: w.jobId
        });
        try {
            if (!w.sdkSessionId && !w.pendingClear) {
                let _t = await rt(t, T);
                _t?.sdk_session_id && (w.sdkSessionId = _t.sdk_session_id, ee("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: T,
                    sdkSessionId: _t.sdk_session_id
                }))
            }
            if ((await rt(t, T))?.session_key || await patchSessionRuntimeState(t, T, {
                    session_key: T
                }), w.origin === "job" && !w.jobId) {
                await a.init();
                let Wn = (await a.listJobs()).find(Re => Re.session_key === T);
                Wn ? (w.jobId = Wn.id, ke("[session-manager] recovered jobId from active jobs", {
                    sessionKey: T,
                    jobId: Wn.id
                })) : Z("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: T
                })
            }
            let Ae, ve, je = !1,
                sn, gt, Gt, Nn, Us, xr = !1;
            if (w.jobStateless = !1, w.origin === "job" && w.jobId) {
                let _t = await a.getJob(w.jobId);
                if (Ze = _t, nt = _t?.state.last_scheduled_at ?? null, _t?.execution_cwd && (await Y_e({
                        cwdRel: _t.execution_context === "workspace" ? _t.frontmatter.cwd_rel ?? null : null,
                        cwd: _t.execution_cwd,
                        runtimeWorkspaceDir: _t.runtime_workspace_dir,
                        context: _t.execution_context
                    }), await Ne(_t.execution_cwd), await patchSessionRuntimeState(t, T, {
                        session_key: T,
                        cwd: _t.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), _t) {
                    Ae = classifyJobScheduleType(_t.frontmatter.cron), ve = _t.frontmatter.cron;
                    let Wn = _t.frontmatter.stateless === !0;
                    if (Wn && _t.frontmatter.cron === "keepalive") throw new Error(M6);
                    je = Wn, w.jobStateless = je, sn = _t.frontmatter.model, gt = _t.frontmatter.effort, Gt = {
                        piExtensions: _t.frontmatter.piExtensions,
                        piSkills: _t.frontmatter.piSkills,
                        piConfigIssues: _t.frontmatter.piConfigIssues
                    };
                    let Re = validateRunnableRuntimeValue(_t.frontmatter.runtime, `Job "${w.jobId}"`);
                    Re.ok || (Us = Re.reason);
                    let ar = Re.ok ? Re.runtime : void 0,
                        Mi = ar ?? resolveDefaultRuntime(),
                        fn = ar ? "explicit" : "default";
                    _t.frontmatter.prompt_mode !== void 0 && Mi === "codex" && Z("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                        sessionKey: T,
                        jobId: w.jobId,
                        promptMode: _t.frontmatter.prompt_mode,
                        runtimeSource: fn
                    }), w.runtime = Mi;
                    let gn = await v(Mi);
                    gn && !gn.ok && (Nn = gn.reason, Z(`[session-manager] job requested ${Mi} but it is unavailable`, {
                        sessionKey: T,
                        jobId: w.jobId,
                        runtime_source: fn,
                        reason: gn.reason
                    }))
                }
            } else if (w.origin === "channel") {
                let Wn = (await rt(t, T))?.source_channel_id;
                if (Wn) {
                    let Re = await resolveSessionChannelRuntime(t, T, Wn);
                    Re.ok || (Us = Re.reason, Z("[session-manager] channel runtime refused", {
                        sessionKey: T,
                        sourceChannelId: Wn,
                        reason: Re.reason
                    })), Re.ok && Re.runtime === "void" && (Us = `${Ju} A message queued before it became void was not run.`);
                    let ar = Re.ok ? Re.runtime ?? resolveDefaultRuntime() : w.runtime,
                        Mi = Re.ok ? Re.source : "explicit";
                    w.runtime = ar;
                    let fn = Re.ok ? await v(ar) : null;
                    fn && !fn.ok && (Nn = fn.reason, Z(`[session-manager] channel requested ${ar} but it is unavailable`, {
                        sessionKey: T,
                        sourceChannelId: Wn,
                        runtime_source: Mi,
                        reason: fn.reason
                    }))
                }
            }
            for (; w.status !== "ended" && ie;) {
                let _t = Nn;
                if (w.runtime !== "codex") {
                    for (;;) {
                        let X = w.streamingState,
                            bt = !!X && !X.closed && (X.cliTurnTentative !== null || X.currentTurn !== null);
                        if (!bt && !w.admissionInProgress) break;
                        if (w.pendingWake) {
                            w.pendingWake = !1;
                            continue
                        }
                        ut("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: T,
                            actorRunId: w.actorRunId,
                            cliBusy: bt,
                            admissionInProgress: w.admissionInProgress
                        }), await waitForWakeOrIdleTimeout(w, i)
                    }
                    if (!ie || w.status === "ended") break
                }
                w.pendingClear && (w.sdkSessionId = void 0, w.pendingClear = !1, await patchSessionRuntimeState(t, T, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }).catch(() => {}));
                let Wn, Re = null;
                w.origin === "job" && w.jobId && (xr ? Re = await a.getJob(w.jobId).catch(() => null) : (xr = !0, Re = Ze));
                let {
                    instructions: ar,
                    missionContent: Mi
                } = await collectInstructionsInputs(t, T, w, Re), fn = await rt(t, T), gn = await runInstructionsFingerprintGuard(t, T, ar, w.runtime, {
                    instructions_fingerprint: fn?.instructions_fingerprint,
                    mission_fingerprint: fn?.mission_fingerprint,
                    schema_version: fn?.schema_version,
                    sdk_session_id: fn?.sdk_session_id,
                    board_layer_hash: fn?.board_layer_hash,
                    instructions_nonboard_fingerprint: fn?.instructions_nonboard_fingerprint
                }, w.origin === "job" && w.jobId ? {
                    jobId: w.jobId
                } : void 0);
                gn.clearedSdkSessionId && (w.sdkSessionId = void 0), gn.gate2Fired && w.runtime === "claude" && (gn.boardOnlyDrift ? w.streamingState && !w.streamingState.closed ? ee("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: T,
                    board_layer_hash: gn.boardLayerHash
                }) : ee("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: T,
                    board_layer_hash: gn.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: T,
                    reason: "instructions_drift"
                })), w.origin === "job" && w.jobId && (Mi !== void 0 ? Wn = {
                    content: Mi,
                    jobId: w.jobId,
                    cron: Re?.frontmatter.cron ?? "",
                    stateless: je,
                    acceptance: Re?.frontmatter.acceptance,
                    model: Re ? Re.frontmatter.model : sn,
                    effort: Re ? Re.frontmatter.effort : gt,
                    sdkConfig: rbe(Re?.frontmatter)
                } : Z("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: T,
                    jobId: w.jobId
                })), w.status !== "ended" && (w.status = "active"), w.idleSince = void 0;
                let Mn = new Set,
                    ji = Date.now(),
                    Ie = new AbortController;
                w.currentAbortController = Ie;
                let de;
                try {
                    let X = [...w.origin === "system" ? [] : [Tbe, Xbe], Ybe, lve];
                    w.origin === "channel" && (X.push(fEe), X.push(wc));
                    let bt = w.origin === "job" ? "job" : w.origin === "system" ? "system" : "foreground",
                        jt = 0,
                        Lt = lRe();
                    if (w.admissionCallback = async () => {
                            try {
                                await mergeInboxIntoMailbox(t, T);
                                let Ve = await listMailboxPendingItems(t, T);
                                if (Ve.length === 0) return;
                                await renderSessionMailboxFile(t, T, Ve);
                                let xt = {},
                                    jn = await batchDrainItems(t, Ve, {
                                        fallbackBatchSize: OW,
                                        mergeWindowMs: AW,
                                        perf: xt
                                    }),
                                    Yt = await rt(t, T),
                                    To = buildSessionInfoFromState(t, T, Yt ?? void 0),
                                    Jn = [],
                                    Er = [];
                                for (let Le of jn.items) {
                                    if (!Le.eventId) continue;
                                    if (w.inflightEventIds.has(Le.eventId)) {
                                        Er.push(Le.eventId);
                                        continue
                                    }
                                    if (await findOutboxRecordByEventId(t, Le.eventId)) {
                                        Er.push(Le.eventId);
                                        continue
                                    }
                                    let dt = Le.createdAt ? {
                                            notAfter: Le.createdAt
                                        } : void 0,
                                        un = jn.events.get(Le.eventId) ?? await readEventById(t, Le.eventId, dt);
                                    if (!un) {
                                        Z(`[session-manager] mailbox event unresolved: session_key=${T} event_id=${Le.eventId} not_after=${dt?.notAfter??"none"} item_file=${Le.file??"none"}`);
                                        continue
                                    }
                                    Jn.push({
                                        item: Le,
                                        event: un,
                                        prompt: renderMailboxEventPrompt(un, T)
                                    })
                                }
                                if (Jn.length === 0) {
                                    Er.length > 0 && await deleteMailboxPendingItemsByEventIds(t, T, Er);
                                    return
                                }
                                let $n = await prepareDrainTurnContext(t, T, {
                                        allowedTools: X,
                                        tools: Lt,
                                        additionalDirectories: [t.memoryDir]
                                    }, Jn, To, {
                                        pendingGatewayNotice: Yt?.pending_gateway_notice,
                                        pendingInterruptedContext: Yt?.pending_interrupted_context,
                                        pendingSkipRewind: Yt?.pending_skip_rewind,
                                        lastEventAtWatermark: Yt?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, xt, Le => Le),
                                    Po = [...Er, ...Jn.map(Le => Le.item.eventId).filter(Le => !!Le)];
                                if (w.runtime === "codex" || w.runtime === "grok" || w.runtime === "pi") {
                                    let Le = w.adapter?.steerActiveTurn,
                                        Ht = $n.coalescedPromptText.trim(),
                                        dt = w.adapter?.activeTurnId?.(),
                                        un = w.adapter?.activeTurnStartedAt?.(),
                                        Hr = !1;
                                    if (dt && un !== void 0)
                                        if (w.adapter?.activeTurnSkipObserved?.() === !0) Hr = !0;
                                        else {
                                            let yl = await rt(t, T).catch(() => null);
                                            if (yl === null) Hr = !0, Z("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: T
                                            });
                                            else {
                                                let hr = Date.parse(yl.pending_skip_rewind?.skipped_at ?? "");
                                                Hr = Number.isFinite(hr) && hr >= un
                                            }
                                        } if (!!Le && !!dt && !$n.isNotifyOnly && !w.liveTurnNotifyOnly && Ht.length > 0 && !Hr && Le && dt) {
                                        let pu = $n.batchEventIds.filter(hr => !w.inflightEventIds.has(hr));
                                        for (let hr of pu) w.inflightEventIds.add(hr);
                                        if (await Le(Ht, dt, $n.attachments).catch(() => !1)) {
                                            await deleteMailboxPendingItemsByEventIds(t, T, Po);
                                            for (let hr of pu) w.inflightEventIds.delete(hr);
                                            ee("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: T,
                                                admittedItems: Jn.length,
                                                batchEventIds: $n.batchEventIds
                                            })
                                        } else {
                                            for (let hr of pu) w.inflightEventIds.delete(hr);
                                            w.pendingWake = !0, ee("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: T,
                                                batchEventIds: $n.batchEventIds
                                            })
                                        }
                                    } else w.pendingWake = !0, ee("[session-manager] admission callback: codex steer not attempted, redraining", {
                                        sessionKey: T,
                                        admittedItems: Jn.length,
                                        batchEventIds: $n.batchEventIds,
                                        liveTurn: !!dt,
                                        notifyOnlyBatch: $n.isNotifyOnly,
                                        sealedBySkip: Hr,
                                        liveTurnNotifyOnly: w.liveTurnNotifyOnly,
                                        emptyText: Ht.length === 0
                                    });
                                    return
                                }
                                let ao = w.streamingState;
                                if (!ao || ao.closed) return;
                                let gi = ao.currentTurn,
                                    va = !!$n.attachments && $n.attachments.length > 0,
                                    an = $n.coalescedPromptText.trim();
                                if (!!gi && gi.accepted && !gi.skipCalled && !va && !$n.isNotifyOnly && !w.liveTurnNotifyOnly && an.length > 0) {
                                    let Le = w.pendingSteer;
                                    if (Le && !Le.settled && Le.spawningTurn === gi) {
                                        let Ht = $n.batchEventIds.filter(dt => !w.inflightEventIds.has(dt));
                                        for (let dt of Ht) w.inflightEventIds.add(dt);
                                        Le.steerText = `${Le.steerText}
${an}`, Le.eventIds.push(...Po), Le.claimedEventIds.push(...Ht), Le.requeueLines.push(...Jn.map(dt => dt.item.line)), Le.requeueEventIds.push(...Jn.map(dt => dt.item.eventId)), Le.processedEventIds.push(...Er), ee("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: T,
                                            admittedItems: Jn.length,
                                            batchEventIds: $n.batchEventIds
                                        });
                                        return
                                    }
                                    if (!Le) {
                                        let Ht = $n.batchEventIds.filter(un => !w.inflightEventIds.has(un));
                                        for (let un of Ht) w.inflightEventIds.add(un);
                                        let dt = {
                                            steerText: an,
                                            eventIds: [...Po],
                                            claimedEventIds: [...Ht],
                                            enqueueAsNewTurn: async () => {
                                                let un = [];
                                                for (let nr = 0; nr < dt.requeueLines.length; nr += 1) {
                                                    let pu = dt.requeueLines[nr],
                                                        yl = dt.requeueEventIds[nr];
                                                    try {
                                                        await enqueueSessionInboxLine(t, T, pu), un.push(yl)
                                                    } catch (hr) {
                                                        Z("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: T,
                                                            eventId: yl,
                                                            error: hr instanceof Error ? hr.message : String(hr)
                                                        })
                                                    }
                                                }
                                                let Hr = [...un, ...dt.processedEventIds];
                                                if (Hr.length > 0) try {
                                                    await deleteMailboxPendingItemsByEventIds(t, T, Hr)
                                                } catch (nr) {
                                                    ee("[session-manager] steer fallback markDone error", {
                                                        sessionKey: T,
                                                        error: String(nr)
                                                    })
                                                }
                                                for (let nr of dt.claimedEventIds) w.inflightEventIds.delete(nr);
                                                w.pendingWake = !0, ee("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: T,
                                                    eventIds: dt.eventIds,
                                                    requeued: un.length,
                                                    requeueFailed: dt.requeueLines.length - un.length
                                                })
                                            },
                                            spawningTurn: gi,
                                            requeueLines: Jn.map(un => un.item.line),
                                            requeueEventIds: Jn.map(un => un.item.eventId),
                                            processedEventIds: [...Er],
                                            settled: !1
                                        };
                                        w.pendingSteer = dt, ee("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: T,
                                            admittedItems: Jn.length,
                                            batchEventIds: $n.batchEventIds
                                        });
                                        return
                                    }
                                }
                                w.pendingWake = !0, w.wakeResolver?.()
                            } catch (Ve) {
                                ee("[session-manager] admission callback error", {
                                    sessionKey: T,
                                    error: String(Ve)
                                })
                            }
                        }, w.runtime === "codex" && !w.adapter && !_t) {
                        let Ve = (await rt(t, T))?.cwd;
                        Ve && await ensureAgentsMdSymlink(Ve).catch(() => {}), w.adapter = f({
                            sandbox: resolveCodexSandbox(),
                            env: {
                                [tl]: T
                            },
                            ephemeral: !1,
                            model: sn,
                            dynamicTools: buildCodexDynamicTools({
                                paths: t,
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: bt,
                                notifyDepth: jt,
                                jobScheduleType: Ae,
                                callerJobCron: ve,
                                getSessionStatus: xt => F.get(xt)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            })
                        })
                    }
                    if (w.runtime === "grok" && !w.adapter && !_t) {
                        let Ve = await rt(t, T).catch(() => null);
                        w.adapter = h({
                            cwd: Ve?.cwd ?? t.workDir,
                            env: {
                                [tl]: T
                            },
                            sdkSessionId: je ? void 0 : Ve?.sdk_session_id,
                            mcpServerFactory: () => createAladuoMcpServer(t, {
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: bt,
                                notifyDepth: jt,
                                jobScheduleType: Ae,
                                callerRuntime: w.runtime,
                                callerJobCron: ve,
                                getSessionStatus: xt => F.get(xt)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text: xt
                            }) => S(T, xt)
                        })
                    }
                    if (w.runtime === "pi" && !_t) {
                        let Ve = await rt(t, T).catch(() => null),
                            xt = CS(),
                            {
                                settingsSeed: jn,
                                defaultProjectTrust: Yt,
                                unknownKeys: To,
                                readFailed: Jn
                            } = OS(xt);
                        To.length > 0 && Z("[session-manager] pi settings keys not classified (SDK bump gate)", {
                            sessionKey: T,
                            keys: To
                        });
                        let Er = !1,
                            $n = Gt ? null : await iu(t, T).catch(() => (Er = !0, null)),
                            Po = Gt ? await ru(t, {
                                channel_kind: "job"
                            }).catch(() => (Er = !0, null)) : null,
                            ao = Gt ?? $n;
                        ao?.piConfigIssues?.length && Z("[session-manager] invalid pi.* config values ignored (defaults apply)", {
                            sessionKey: T,
                            issues: ao.piConfigIssues
                        });
                        let gi = (Ve?.model_runtime === "pi" ? Ve.model : void 0) ?? (Re ? Re.frontmatter.model : sn) ?? readRuntimeModelSetting($n ?? Po, "pi")?.model,
                            va = ao?.piExtensions ?? "all",
                            an = ao?.piSkills ?? "all",
                            gl = Ve?.effort ?? (Re ? Re.frontmatter.effort : gt) ?? readRuntimeEffortSetting($n ?? Po, "pi")?.effort,
                            Le = cEe({
                                model: gi,
                                thinkingLevel: gl,
                                settingsSeed: jn,
                                defaultProjectTrust: Yt,
                                extensions: va,
                                skills: an,
                                instructionsFingerprint: lEe(classifySessionKeyOrUnknown(T) === "channel", gn)
                            }),
                            Ht = !Jn && !Er;
                        if (Ht || Z("[session-manager] pi construction facts unread, keeping the live worker", {
                                sessionKey: T,
                                seedReadFailed: Jn,
                                configReadFailed: Er
                            }), w.adapter && w.adapterFacts !== Le && Ht) {
                            let dt = w.adapter;
                            w.adapter = null, w.adapterFacts = void 0, Promise.resolve(dt.shutdown()).catch(un => {
                                Z("[session-manager] stale pi adapter shutdown failed", {
                                    sessionKey: T,
                                    error: String(un)
                                })
                            })
                        }
                        if (!w.adapter)
                            if (!gi) _t = "pi binds its model when the worker is built, and this session has none. Send `/model <provider>/<modelId>` (channel sessions), or set `model: <provider>/<modelId>` in the job frontmatter, then send the message again.";
                            else {
                                let dt = Qc.join(resolveSessionDir(t, T), "pi"),
                                    un = {
                                        session_context_kind: bt
                                    };
                                w.adapter = g({
                                    cwd: Ve?.cwd ?? t.workDir,
                                    sdkSessionId: (je ? void 0 : Ve?.sdk_session_id) ?? mbt(),
                                    sessionDir: dt,
                                    agentDir: xt,
                                    authPath: Qc.join(xt, "auth.json"),
                                    modelsPath: Qc.join(xt, "models.json"),
                                    modelsStorePath: Qc.join(dt, "models-store.json"),
                                    settingsSeed: jn,
                                    resources: {
                                        extensions: va,
                                        skills: an,
                                        default_project_trust: Yt
                                    },
                                    model: gi,
                                    thinkingLevel: gl,
                                    workerCommand: resolvePiWorkerCommand(),
                                    env: {
                                        [tl]: T,
                                        [nC]: t.daemonSocketPath,
                                        [rC]: oC({
                                            session_key: T,
                                            job_cron: ve,
                                            job_schedule_type: Ae,
                                            ...un
                                        }),
                                        [iC]: JSON.stringify(un)
                                    },
                                    onToolEnd: Hr => handlePiToolEndObservation(t, T, Hr),
                                    logDebug: Hr => ke(Hr, {
                                        sessionKey: T
                                    }),
                                    logWarn: Hr => Z(Hr, {
                                        sessionKey: T
                                    })
                                }), w.adapterFacts = Le
                            }
                    }
                    if (!ie || w.status === "ended") break;
                    let Xo = K(w);
                    de = await drainSessionMailbox(t, T, {
                        sdk: Xo,
                        usesStreamingAdapter: Xo === w.streamingAdapter,
                        bus: n,
                        abortController: Ie,
                        runtime: w.runtime,
                        runtimeUnavailableReason: _t,
                        runtimeRefusal: Us,
                        excludeEventIds: snapshotInflightEventIds(w),
                        actorSpawnedAt: w.spawnedAt,
                        actorLastTurnCompletedAt: w.lastTurnCompletedAt,
                        getStreamGeneration: () => w.streamingGeneration,
                        holdInputOpenForBackgroundAgents: w.runtime === "claude" && w.origin !== "channel",
                        jobContext: Wn,
                        memoryBoard: ar.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: ar.memoryBoard
                        } : void 0,
                        boardHash: ar.memoryBoard ? gn.boardLayerHash : void 0,
                        onBatchContext: Ve => {
                            if (jt = Ve.maxNotifyDepth, Ve.eventIds)
                                for (let xt of Ve.eventIds) w.inflightEventIds.add(xt)
                        },
                        mcpServersFactory: () => ({
                            aladuo: createAladuoMcpServer(t, {
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: bt,
                                notifyDepth: jt,
                                jobScheduleType: Ae,
                                callerRuntime: w.runtime,
                                callerJobCron: ve,
                                getSessionStatus: Ve => F.get(Ve)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            })
                        }),
                        allowedTools: X,
                        tools: Lt,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: o,
                        onSdkTurnStarted: Ve => {
                            w.liveTurnNotifyOnly = Ve.notifyOnly, U += 1;
                            let xt = !me;
                            if (me = U > Y, xt && me && w.origin === "job" && w.jobId) {
                                let jn = w.jobId;
                                re.push(a.updateState(jn, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: nt
                                }).catch(Yt => {
                                    Z("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: T,
                                        jobId: jn,
                                        error: Yt instanceof Error ? Yt.message : String(Yt)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            Y += 1;
                            let Ve = me && U <= Y;
                            if (me = U > Y, Ve && w.origin === "job" && w.jobId) {
                                let xt = w.jobId;
                                re.push(a.updateState(xt, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: nt
                                }).catch(jn => {
                                    Z("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: T,
                                        jobId: xt,
                                        error: jn instanceof Error ? jn.message : String(jn)
                                    })
                                }))
                            }
                        },
                        onStream: (Ve, xt, jn) => {
                            w.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: T,
                                chunk: Ve,
                                isSidechain: xt,
                                anchorEventId: jn
                            })
                        },
                        onExecutionEvent: (Ve, xt) => {
                            Ve.type === "tool_use" && (w.isStreaming = !1, w.activeToolCalls.set(Ve.toolUseId, {
                                toolName: Ve.toolName,
                                startedAtMs: Date.now()
                            }), w.pendingPreempt && w.pendingPreemptBoundary === "tool_use" && (w.pendingPreempt = !1, w.pendingPreemptBoundary = null, triggerDeferredPreempt(w))), Ve.type === "tool_result" && (w.activeToolCalls.delete(Ve.toolUseId), w.pendingPreempt && w.pendingPreemptBoundary === "tool_result" && w.activeToolCalls.size === 0 && (w.pendingPreempt = !1, w.pendingPreemptBoundary = null, triggerDeferredPreempt(w)));
                            let jn = oRe(Ve);
                            if (jn && Mn.has(jn)) return;
                            jn && Mn.add(jn);
                            let Yt = buildSessionExecutionPayload(Ve);
                            if (Yt) {
                                let To = Ve.type === "tool_use" || Ve.type === "tool_result" ? Ve.isSidechain : void 0;
                                n.emit("session.execution", {
                                    sessionKey: T,
                                    event: Yt,
                                    anchorEventId: xt,
                                    isSidechain: To
                                })
                            }
                        }
                    })
                } finally {
                    w.admissionCallback = null, w.admissionInProgress || w.inflightEventIds.clear(), w.currentAbortController === Ie && (w.currentAbortController = null), w.isStreaming = !1, w.activeToolCalls.clear(), w.pendingPreempt = !1, w.pendingPreemptBoundary = null, w.pendingPreemptReason = null
                }
                if (ut("[session-manager] drain result", {
                        sessionKey: T,
                        actorRunId: w.actorRunId,
                        processed: de.processed,
                        skipped: de.skipped,
                        lockAcquired: de.lockAcquired,
                        outboxRecords: de.outboxRecords?.length ?? (de.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - ji
                    }), Ee += de.processed, Oe = de.mergeTransientFailure === !0, de.cancelled && (Xe = !0), de.processed > 0 && (w.lastTurnCompletedAt = Date.now(), await clearSessionRuntimeStateField(t, T, "last_error").catch(() => {})), de.compacted && w.runtime === "claude" && w.streamingState && !w.streamingState.closed) {
                    let X = ar.memoryBoard ? gn.boardLayerHash : void 0;
                    w.spawnBoardHash !== X && (w.streamingState.needsRecreation = !0, vt("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: T,
                        reason: "board-refresh(B4)",
                        generation: w.streamingGeneration,
                        spawn_board_hash: w.spawnBoardHash ? w.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: X ? X.slice(0, 12) : null
                    }))
                }
                if (w.pendingClear) w.sdkSessionId = void 0, w.pendingClear = !1, await patchSessionRuntimeState(t, T, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }).catch(() => {}), ee("[session-manager] applied pending clear after drain", {
                    sessionKey: T,
                    actorRunId: w.actorRunId
                });
                else {
                    let X = await rt(t, T);
                    if (X?.sdk_session_id) {
                        let bt = !w.sdkSessionId,
                            jt = w.sdkSessionId !== X.sdk_session_id;
                        w.sdkSessionId = X.sdk_session_id, (bt || jt) && ee("[session-manager] sdk session bound", {
                            sessionKey: T,
                            actorRunId: w.actorRunId,
                            sdkSessionId: w.sdkSessionId,
                            isNewSession: bt
                        })
                    }
                }
                if (de.lastReplyText && (z = de.lastReplyText), de.outboxRecords && de.outboxRecords.length > 0) {
                    ut("[session-manager] emitting outbox records", {
                        sessionKey: T,
                        actorRunId: w.actorRunId,
                        count: de.outboxRecords.length
                    });
                    for (let X of de.outboxRecords) n.emit("session.output", {
                        sessionKey: X.session_key,
                        record: X
                    })
                } else de.lastOutboxRecord ? (ut("[session-manager] emitting single outbox record", {
                    sessionKey: T,
                    actorRunId: w.actorRunId,
                    recordId: de.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: T,
                    record: de.lastOutboxRecord
                })) : w.origin === "channel" && de.processed > 0 && !de.cancelled && !de.sdkTurns?.length && (ut("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey: T,
                    actorRunId: w.actorRunId,
                    turnSkipped: de.turnSkipped === !0
                }), n.emit("session.stream_end", {
                    sessionKey: w.sessionKey,
                    reason: de.turnSkipped === !0 ? "skipped" : "interrupted"
                }));
                if (w.origin === "channel")
                    for (let X of de.sdkTurns ?? []) !X.consumed || X.hadOutput || (ut("[session-manager] silent turn, emitting stream_end", {
                        sessionKey: T,
                        actorRunId: w.actorRunId,
                        anchorEventId: X.anchorEventId,
                        turnSkipped: X.skipped
                    }), n.emit("session.stream_end", {
                        sessionKey: w.sessionKey,
                        reason: X.skipped ? "skipped" : "interrupted",
                        anchorEventId: X.anchorEventId
                    }));
                if (de.refusedStage === "runtime_unavailable" || de.refusedStage === "runtime_mismatch") {
                    ut("[session-manager] runtime refusal, ending actor", {
                        sessionKey: T,
                        actorRunId: w.actorRunId,
                        stage: de.refusedStage
                    });
                    break
                }
                if (de.processed === 0) {
                    if (w.origin === "job" || w.origin === "system") {
                        ut("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: T,
                            actorRunId: w.actorRunId,
                            origin: w.origin,
                            jobId: w.jobId
                        });
                        break
                    }
                    if (w.pendingWake) {
                        w.pendingWake = !1, ut("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: T,
                            actorRunId: w.actorRunId
                        });
                        continue
                    }
                    if (w.status = "idle", w.idleSince = new Date().toISOString(), w.pendingWake) {
                        w.pendingWake = !1, ut("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: T,
                            actorRunId: w.actorRunId
                        });
                        continue
                    }
                    if (ut("[session-manager] idle", {
                            sessionKey: T,
                            actorRunId: w.actorRunId,
                            attachedChannels: w.attachedChannels.size
                        }), w.holdsPoolSlot) {
                        let bt = N(T, w.origin);
                        bt.activeCount--, w.holdsPoolSlot = !1, ut("[session-manager] released pool slot (idle)", {
                            sessionKey: T,
                            pool: bt.name,
                            activeCount: bt.activeCount
                        }), M(bt)
                    }
                    let X = !1;
                    for (;;) {
                        let bt = !1,
                            jt = !1;
                        for (; w.status === "idle";) {
                            if (w.pendingWake) {
                                w.pendingWake = !1, bt = !0;
                                break
                            }
                            if (!ie) {
                                jt = !0;
                                break
                            }
                            if (await waitForWakeOrIdleTimeout(w, i) || w.status !== "idle") {
                                bt = !0;
                                break
                            }
                            if (w.attachedChannels.size > 0) {
                                ut("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey: T,
                                    actorRunId: w.actorRunId,
                                    attachedChannels: w.attachedChannels.size
                                }), w.streamingState && !w.streamingState.closed && vt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey: T,
                                    generation: w.streamingGeneration,
                                    sdk_session_id: w.sdkSessionId ?? null
                                }), await teardownStreamingSession(w), shutdownActorRuntimeAdapter(w);
                                continue
                            }
                            break
                        }
                        if (jt) {
                            X = !0;
                            break
                        }
                        if (!bt && w.status === "idle") {
                            ut("[session-manager] idle timeout, no attachments, exiting", {
                                sessionKey: T,
                                actorRunId: w.actorRunId
                            }), w.streamingState && !w.streamingState.closed && vt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                sessionKey: T,
                                generation: w.streamingGeneration,
                                sdk_session_id: w.sdkSessionId ?? null
                            }), X = !0;
                            break
                        }
                        if (bt && !w.holdsPoolSlot) {
                            let Lt = N(T, w.origin);
                            if (Lt.activeCount >= Lt.maxConcurrent) {
                                Lt.wakeQueue.includes(T) || Lt.wakeQueue.unshift(T), ut("[session-manager] woken idle actor re-queued (pool full)", {
                                    sessionKey: T,
                                    pool: Lt.name,
                                    activeCount: Lt.activeCount
                                }), w.pendingWake = !1;
                                continue
                            }
                            Lt.activeCount++, w.holdsPoolSlot = !0, ut("[session-manager] re-acquired pool slot (woken)", {
                                sessionKey: T,
                                pool: Lt.name,
                                activeCount: Lt.activeCount
                            })
                        }
                        break
                    }
                    if (X) break
                }
            }
        } catch (Ae) {
            Ue(`[session-manager] error in drain loop for ${T}:`, Ae), L = Ae, await patchSessionRuntimeState(t, T, {
                last_error: {
                    message: Ae instanceof Error ? Ae.message : String(Ae),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            await teardownStreamingSession(w), w.currentAbortController = null, w.streamingAdapter = null, w.isStreaming = !1, w.activeToolCalls.clear(), w.pendingPreempt = !1, w.pendingPreemptBoundary = null, w.pendingPreemptReason = null, await shutdownActorRuntimeAdapter(w);
            let Ae = N(T, w.origin);
            if (w.holdsPoolSlot && (Ae.activeCount--, w.holdsPoolSlot = !1), w.origin === "job" && w.jobId) {
                re.length > 0 && await Promise.allSettled(re);
                try {
                    await c(w, {
                        runStarted: me,
                        cancelled: Xe,
                        processedCount: Ee,
                        claimCursor: nt,
                        error: L,
                        resultText: z,
                        jobSnapshot: Ze
                    })
                } finally {
                    w.status = "ended"
                }
            } else w.status = "ended";
            if (w.pendingWake = !1, ie && dbt(resolveSessionDir(t, T)) && !isSessionArchiving(T)) {
                let je = await l(T, qe);
                je === "fresh" ? (w.consecutiveConservativeRedrive = !1, ut("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: T,
                    actorRunId: w.actorRunId
                }), te(T, {
                    preempt: "never"
                })) : je === "conservative" || Oe ? w.consecutiveConservativeRedrive ? Z("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: T,
                    actorRunId: w.actorRunId
                }) : (w.consecutiveConservativeRedrive = !0, ut("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: T,
                    actorRunId: w.actorRunId
                }), te(T, {
                    preempt: "never"
                })) : w.consecutiveConservativeRedrive = !1
            }
            ee("[session-manager] actor end", {
                sessionKey: T,
                actorRunId: w.actorRunId,
                sdkSessionId: w.sdkSessionId,
                pool: Ae.name,
                activeCount: Ae.activeCount,
                origin: w.origin,
                jobId: w.jobId,
                attachedChannels: w.attachedChannels.size,
                queuedSessions: Ae.wakeQueue.length
            }), M(Ae)
        }
    }

    function H(w, T) {
        if (!ie) return;
        if (isSessionArchiving(T)) {
            ut("[session-manager] skip job spawn, session is being archived", {
                jobId: w,
                sessionKey: T
            });
            return
        }
        let L = F.get(T);
        if (L && L.status !== "ended") {
            ut("[session-manager] skip duplicate job spawn", {
                jobId: w,
                sessionKey: T,
                actorStatus: L.status
            });
            return
        }
        if (C.activeCount >= C.maxConcurrent) {
            C.wakeQueue.includes(T) || C.wakeQueue.push(T), L ? (L.origin = "job", L.jobId = w) : F.set(T, {
                sessionKey: T,
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
                jobId: w,
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
        B(T, {
            origin: "job",
            jobId: w
        }), (async () => {
            try {
                let z = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: w
                    },
                    session_key: T,
                    payload: {
                        job_id: w
                    }
                });
                await atomicAppendEvent(t, z), n.emit("job.spawned", {
                    jobId: w,
                    sessionKey: T
                })
            } catch (z) {
                Ue("[session-manager] error recording job spawn", z)
            }
        })()
    }
    async function q(w, T) {
        let z = (ce.get(w) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (classifySessionKeyKind(w) !== "channel") return;
            let U = uk(w),
                Y = new Date().toISOString(),
                me = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: U,
                        name: "session-manager"
                    },
                    session_key: w,
                    payload: {
                        session_key: w,
                        channel_kind: U,
                        channel_id: T,
                        attached_at: Y
                    }
                });
            await atomicAppendEvent(t, me)
        }).finally(() => {
            ce.get(w) === z && ce.delete(w)
        });
        ce.set(w, z), await z
    }

    function pe() {
        for (let w of F.values()) w.status = "ended", shutdownActorRuntimeAdapter(w), w.streamAbortController && !w.streamAbortController.signal.aborted && w.streamAbortController.abort(), typeof w.query?.close == "function" && w.query.close(), w.query = null, w.streamAbortController = null, w.currentAbortController && !w.currentAbortController.signal.aborted && w.currentAbortController.abort(), w.currentAbortController = null, w.wakeResolver && (w.wakeResolver(), w.wakeResolver = null)
    }
    async function fe() {
        if (ce.size === 0) return;
        let w = Array.from(ce.values()),
            T = !1,
            L = new Promise(z => setTimeout(() => {
                T = !0, z()
            }, 3e4));
        await Promise.race([Promise.allSettled(w).then(() => {}), L]), T && Z("[session-manager] shutdown abandoned pending attach writes after the fallback", {
            pending: w.length
        })
    }
    async function Se(w) {
        let T;
        try {
            T = fbt(Qc.join(hbt(), "aladuo-pi-catalog-"));
            let L = CS(),
                {
                    settingsSeed: z,
                    defaultProjectTrust: U
                } = OS(L),
                Y = await iu(t, w).catch(() => null),
                me = await rt(t, w).catch(() => null),
                re = await oEe({
                    cwd: me?.cwd ?? t.workDir,
                    agentDir: L,
                    authPath: Qc.join(L, "auth.json"),
                    modelsPath: Qc.join(L, "models.json"),
                    modelsStorePath: Qc.join(T, "models-store.json"),
                    settingsSeed: z,
                    resources: {
                        extensions: Y?.piExtensions ?? "all",
                        default_project_trust: U
                    },
                    workerCommand: resolvePiWorkerCommand(),
                    logDebug: Ee => ke("[pi-catalog] " + Ee)
                });
            return re.length > 0 ? re : void 0
        } catch (L) {
            Z("[session-manager] pi model catalog failed", {
                sessionKey: w,
                error: String(L)
            });
            return
        } finally {
            try {
                T && pbt(T, {
                    recursive: !0,
                    force: !0
                })
            } catch {}
        }
    }
    return {
        async start() {
            if (!ie) {
                ie = !0, n.on("session.wake", se), n.on("shutdown", j), n.on("session.streaming_invalidated", ne);
                try {
                    let w = await rehydrateSessionState(t);
                    for (let T of w) {
                        if (isSessionArchiving(T)) {
                            ut("[session-manager] skip hydrating session being archived", {
                                sessionKey: T
                            });
                            continue
                        }
                        let z = (await rt(t, T))?.cwd;
                        if (z && !dRe(z)) {
                            Z("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: T,
                                cwd: z
                            });
                            continue
                        }
                        te(T, {
                            preempt: "never"
                        })
                    }
                } catch (w) {
                    Ue("[session-manager] error hydrating sessions:", w)
                }
                ee("[session-manager] started", {
                    channelActive: $.activeCount,
                    channelQueued: $.wakeQueue.length,
                    jobActive: C.activeCount,
                    jobQueued: C.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!ie) return;
            ie = !1, n.off("session.wake", se), n.off("shutdown", j), n.off("session.streaming_invalidated", ne), pe();
            let w = Array.from(F.values()).map(T => T.drainPromise).filter(T => T !== null);
            if (w.length > 0) {
                let T = Array.from(F.values()).filter(U => U.drainPromise !== null),
                    L = !1,
                    z = new Promise(U => setTimeout(() => {
                        L = !0, U()
                    }, 3e4));
                await Promise.race([Promise.all(w), z]), L && Z("[session-manager] shutdown abandoned running drains after the fallback", {
                    sessions: T.map(U => U.sessionKey),
                    runtimes: T.map(U => U.runtime)
                })
            }
            await fe(), F.clear(), $.wakeQueue.length = 0, $.activeCount = 0, C.wakeQueue.length = 0, C.activeCount = 0, ee("[session-manager] stopped")
        },
        wakeSession: te,
        getActor(w) {
            return F.get(w)
        },
        activeCount() {
            return $.activeCount + C.activeCount
        },
        activeChannelCount() {
            return $.activeCount
        },
        activeJobCount() {
            return C.activeCount
        },
        isRunning() {
            return ie
        },
        attachChannel(w, T) {
            let L = F.get(w);
            L || (L = {
                sessionKey: w,
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
            }, F.set(w, L)), L.attachedChannels.add(T), ut("[session-manager] channel attached", {
                sessionKey: w,
                channelId: T,
                totalAttachments: L.attachedChannels.size
            }), q(w, T).catch(z => {
                Z("[session-manager] failed to emit channel.attached event", {
                    sessionKey: w,
                    channelId: T,
                    error: String(z)
                })
            })
        },
        detachChannel(w, T) {
            let L = F.get(w);
            L && (L.attachedChannels.delete(T), ut("[session-manager] channel detached", {
                sessionKey: w,
                channelId: T,
                remainingAttachments: L.attachedChannels.size
            }), L.attachedChannels.size === 0 && L.status === "idle" && L.wakeResolver && (L.wakeResolver(), L.wakeResolver = null))
        },
        hasAttachedChannels(w) {
            let T = F.get(w);
            return T ? T.attachedChannels.size > 0 : !1
        },
        spawnJobSession(w, T) {
            H(w, T)
        },
        async interruptSession(w) {
            if (!ie) return {
                interrupted: !1,
                reason: "not_running"
            };
            let T = F.get(w);
            return T ? !T.query && (!T.currentAbortController || T.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : T.streamAbortController && !T.streamAbortController.signal.aborted ? (ee("[session-manager] interrupt: stopping streaming session", {
                sessionKey: w,
                actorRunId: T.actorRunId
            }), await teardownStreamingSession(T, "cancel-interrupt", "user-cancel"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (requestBoundaryAwarePreempt(T, "immediate", void 0, "user-cancel") === "immediate" && ee("[session-manager] interrupt requested", {
                sessionKey: w,
                actorRunId: T.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(w) {
            if (!ie) return {
                cleared: !1,
                reason: "not_running"
            };
            let T = F.get(w),
                L = T?.sdkSessionId;
            if (T && (T.pendingClear = !0, T.sdkSessionId = void 0, T.sdkSessionIdVerified = !1, T.pendingInterruptMarker = null), T?.streamAbortController && !T.streamAbortController.signal.aborted ? await teardownStreamingSession(T, "clear") : T?.currentAbortController && !T.currentAbortController.signal.aborted && requestBoundaryAwarePreempt(T, "immediate"), await patchSessionRuntimeState(t, w, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }), (T?.runtime === "pi" || T?.runtime === "grok") && T.adapter) {
                let z = T.adapter;
                T.adapter = null, T.adapterFacts = void 0, await Promise.resolve(z.shutdown()).catch(U => {
                    Z("[session-manager] runtime adapter shutdown on clear failed", {
                        sessionKey: w,
                        runtime: T.runtime,
                        error: String(U)
                    })
                })
            }
            return ee("[session-manager] SDK session cleared", {
                sessionKey: w,
                actorRunId: T?.actorRunId,
                previousSessionId: L
            }), {
                cleared: !0,
                previousSessionId: L
            }
        },
        async getSessionModelView(w, T) {
            let L = F.get(w),
                z = await rt(t, w).catch(() => null),
                U = await _(w, L),
                Y = await E(w);
            if (Y) return {
                runtime: U,
                refusal: Y,
                hasLiveQuery: !1
            };
            let me = {
                    runtime: U,
                    storedModel: z?.model,
                    hasLiveQuery: !!L?.query
                },
                re = await R(w, T).catch(Xe => (Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: w,
                    error: Xe instanceof Error ? Xe.message : String(Xe)
                }), null)),
                Ee = readRuntimeModelSetting(re, U);
            if (Ee && (me.configModel = {
                    ...Ee
                }), z?.last_served_model && (me.lastServedModel = z.last_served_model), U === "pi") return me.piProviders = await Se(w), me;
            let Oe = L?.query;
            if (Oe && typeof Oe.supportedModels == "function") try {
                me.available = b(await Oe.supportedModels())
            } catch {}
            try {
                if (re && U === "claude") {
                    let Xe = Object.entries(re.claudeModelProfiles ?? {}).map(([qe, Ae]) => {
                        let ve = exe(Ae.baseUrl);
                        return {
                            model: qe,
                            contextWindow: Ae.cap,
                            source: Ae.source,
                            ...ve ? {
                                endpointHost: ve
                            } : {}
                        }
                    });
                    Xe.length > 0 && (me.profiles = Xe.sort((qe, Ae) => qe.model.localeCompare(Ae.model)));
                    let nt = Object.entries(re.claudeModelAliases ?? {}).map(([qe, Ae]) => ({
                        tier: qe,
                        model: Ae.model,
                        source: Ae.source
                    })).sort((qe, Ae) => qe.tier.localeCompare(Ae.tier));
                    if (nt.length > 0 && (me.aliases = nt), !me.storedModel && !me.configModel) {
                        let qe = await resolveClaudeContextRequirement({
                                model: null,
                                cwd: buildSessionInfoFromState(t, w, z ?? void 0).cwd,
                                daemonEnv: process.env,
                                mergedCatalog: re.claudeModelProfiles ?? {},
                                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                                issues: re.claudeModelProfileIssues
                            }),
                            Ae = qe.modelOrigin;
                        qe.kind === "profiled-external" && (Ae === "project" || Ae === "user" || Ae === "env") && (me.cliDefaultModel = {
                            model: qe.model,
                            origin: Ae
                        })
                    }
                    let Ze = [...re.claudeModelProfileIssues ?? [], ...re.claudeModelAliasIssues ?? []];
                    Ze.length > 0 && (me.profileIssues = Ze.map(qe => ({
                        ...qe.model !== void 0 ? {
                            model: qe.model
                        } : {},
                        reason: qe.reason,
                        ...qe.layer !== void 0 ? {
                            layer: qe.layer
                        } : {}
                    })))
                }
            } catch (Xe) {
                Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: w,
                    error: Xe instanceof Error ? Xe.message : String(Xe)
                })
            }
            return me
        },
        async setSessionModel(w, T, L) {
            if (!ie) return {
                ok: !1,
                reason: "not_running"
            };
            let z = F.get(w),
                U = await E(w);
            if (U) return {
                ok: !1,
                reason: "runtime_rejected",
                detail: U
            };
            let Y = await _(w, z);
            if (Y === "pi") return T !== null && !bI(T) ? {
                ok: !1,
                reason: "runtime_rejected",
                detail: `pi model ids are canonical "provider/modelId" (got "${T}")`
            } : (await patchSessionRuntimeState(t, w, {
                model: T ?? null,
                model_runtime: T !== null ? "pi" : null,
                pending_model_fork: null
            }), ee("[session-manager] pi session model override updated", {
                sessionKey: w,
                model: T ?? "(reset to default)",
                applied: "stored"
            }), {
                ok: !0,
                model: T,
                applied: "stored"
            });
            if (Y === "grok") {
                let Ae = narrowToModelSettableAdapter(z?.adapter),
                    ve = !!(Ae && (Ae.hasSession?.() ?? !0));
                if (T !== null && Ae && ve) try {
                    await Ae.setModel({
                        modelId: T
                    })
                } catch (je) {
                    let sn = je instanceof Error ? je.message : String(je);
                    return Z("[session-manager] grok session/set_model failed", {
                        sessionKey: w,
                        model: T,
                        error: sn
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: sn
                    }
                }
                return await patchSessionRuntimeState(t, w, {
                    model: T ?? null,
                    model_runtime: T !== null ? "grok" : null,
                    pending_model_fork: null
                }), ee("[session-manager] grok session model override updated", {
                    sessionKey: w,
                    model: T ?? "(reset to default)",
                    applied: T !== null && ve ? "live" : "stored"
                }), {
                    ok: !0,
                    model: T,
                    applied: T !== null && ve ? "live" : "stored"
                }
            }
            if (Y === "codex") return await patchSessionRuntimeState(t, w, {
                model: T ?? null,
                model_runtime: T !== null ? "codex" : null,
                pending_model_fork: !0
            }), ee("[session-manager] codex session model override updated", {
                sessionKey: w,
                model: T ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: T,
                applied: "stored",
                pending_model_fork: !0
            };
            let me = z?.query,
                re;
            if (T && me && typeof me.supportedModels == "function") try {
                re = (await me.supportedModels()).some(ve => ve.value === T)
            } catch {}
            let Ee = await P(w, z, T, L).catch(Ae => (Z("[session-manager] model context profile classification failed — applying live", {
                sessionKey: w,
                model: T ?? "(reset to default)",
                error: Ae instanceof Error ? Ae.message : String(Ae)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (Ee.outcome === "blocked") return Z("[session-manager] /model refused: unresolved model context profile", {
                sessionKey: w,
                model: T ?? "(reset to default)",
                detail: Ee.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: Ee.detail
            };
            let Oe = Ee.outcome === "rebuild",
                Xe = Oe ? "stored_pending_rebuild" : "stored",
                nt = null,
                Ze = z?.streamingState;
            if (!Oe && !!Ze && Ze?.closed === !1 && (T ?? null) === (Ze?.liveModel ?? null)) Xe = "live";
            else if (!Oe && me && typeof me.setModel == "function") try {
                await me.setModel(T ?? void 0), Xe = "live", Ze && !Ze.closed && (Ze.liveModel = T ?? void 0)
            } catch (Ae) {
                Z("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: w,
                    model: T ?? "(reset to default)",
                    error: Ae instanceof Error ? Ae.message : String(Ae)
                }), T && z && isLiveStreamRebuildRequired(z, Ee.requirementKind) && (Xe = "stored_pending_rebuild", nt = T)
            }
            return await patchSessionRuntimeState(t, w, {
                model: T ?? null,
                model_runtime: T !== null ? "claude" : null,
                pending_model_fork: null
            }), nt && z && flagStreamRecreationOnModelReject(z, {
                model: nt,
                requirementKind: Ee.requirementKind,
                reason: "live-command"
            }), ee("[session-manager] session model override updated", {
                sessionKey: w,
                model: T ?? "(reset to default)",
                applied: Xe,
                listed: re ?? "(no list consulted)",
                contextProfile: Ee.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model: T,
                applied: Xe,
                listed: re,
                contextProfile: Ee.requirementKind,
                ...Ee.contextWindow ? {
                    contextWindow: Ee.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(w, T) {
            let L = F.get(w),
                z = await rt(t, w).catch(() => null),
                U = await _(w, L),
                Y = await E(w);
            if (Y) return {
                runtime: U,
                refusal: Y,
                hasLiveQuery: !1
            };
            let me = {
                    runtime: U,
                    storedEffort: z?.effort ?? void 0,
                    hasLiveQuery: !!L?.query
                },
                re = await R(w, T).catch(Oe => (Z("[session-manager] /effort view: config scope unreadable", {
                    sessionKey: w,
                    error: Oe instanceof Error ? Oe.message : String(Oe)
                }), null)),
                Ee = readRuntimeEffortSetting(re, U);
            return Ee && (me.configEffort = {
                ...Ee
            }), me
        },
        async setSessionEffort(w, T) {
            if (!ie) return {
                ok: !1,
                reason: "not_running"
            };
            let L = F.get(w),
                z = await E(w);
            if (z) return {
                ok: !1,
                reason: "runtime_rejected",
                detail: z
            };
            let U = await _(w, L);
            if (U === "pi") return await patchSessionRuntimeState(t, w, {
                effort: T ?? null
            }), ee("[session-manager] pi session effort override updated", {
                sessionKey: w,
                effort: T ?? "(reset to default)"
            }), {
                ok: !0,
                effort: T,
                applied: "stored"
            };
            if (U === "grok") {
                let re = narrowToModelSettableAdapter(L?.adapter),
                    Oe = (await rt(t, w).catch(() => null))?.model ?? re?.currentModelId?.(),
                    Xe = !!(re && (re.hasSession?.() ?? !0) && Oe);
                if (T !== null) {
                    if (!Xe || !re || !Oe) return await patchSessionRuntimeState(t, w, {
                        effort: T
                    }), ee("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: T,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort: T,
                        applied: "stored"
                    };
                    try {
                        await re.setModel({
                            modelId: Oe,
                            reasoningEffort: T
                        })
                    } catch (nt) {
                        let Ze = nt instanceof Error ? nt.message : String(nt);
                        return Z("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey: w,
                            effort: T,
                            error: Ze
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Ze
                        }
                    }
                    return await patchSessionRuntimeState(t, w, {
                        effort: T
                    }), ee("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: T,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: T,
                        applied: "live"
                    }
                }
                if (re && Oe && (re.hasSession?.() ?? !0)) {
                    try {
                        await re.setModel({
                            modelId: Oe
                        })
                    } catch (nt) {
                        let Ze = nt instanceof Error ? nt.message : String(nt);
                        return Z("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey: w,
                            error: Ze
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Ze
                        }
                    }
                    return await patchSessionRuntimeState(t, w, {
                        effort: null
                    }), ee("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await patchSessionRuntimeState(t, w, {
                    effort: null
                }), ee("[session-manager] grok session effort override updated", {
                    sessionKey: w,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (U === "codex") return await patchSessionRuntimeState(t, w, {
                effort: T ?? null
            }), ee("[session-manager] codex session effort override updated", {
                sessionKey: w,
                effort: T ?? "(reset to default)"
            }), {
                ok: !0,
                effort: T,
                applied: "stored"
            };
            let Y = L?.query,
                me = "stored";
            if (Y && typeof Y.applyFlagSettings == "function") try {
                await Y.applyFlagSettings({
                    effortLevel: T ?? null
                }), me = "live", L?.streamingState && (L.streamingState.lastAppliedEffort = T ?? null)
            } catch (re) {
                Z("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: w,
                    effort: T ?? "(reset to default)",
                    error: re instanceof Error ? re.message : String(re)
                })
            }
            return await patchSessionRuntimeState(t, w, {
                effort: T ?? null
            }), ee("[session-manager] session effort override updated", {
                sessionKey: w,
                effort: T ?? "(reset to default)",
                applied: me
            }), {
                ok: !0,
                effort: T,
                applied: me
            }
        },
        getActorView(w) {
            let T = F.get(w);
            return !T || T.actorRunId <= 0 ? null : {
                sessionKey: T.sessionKey,
                status: T.status,
                health: "ok",
                idleSince: T.status === "idle" ? T.idleSince : void 0,
                attachedChannels: T.attachedChannels.size,
                sdkSessionId: T.sdkSessionId,
                origin: T.origin,
                jobId: T.jobId,
                runtime: T.runtime,
                activeToolCalls: [...T.activeToolCalls.values()]
            }
        },
        hasQueuedWake: x,
        listActors() {
            let w = new Map;
            for (let [T, L] of F) L.actorRunId <= 0 && !x(L.sessionKey) || w.set(T, {
                sessionKey: L.sessionKey,
                status: L.status,
                health: "ok",
                idleSince: L.status === "idle" ? L.idleSince : void 0,
                attachedChannels: L.attachedChannels.size,
                sdkSessionId: L.sdkSessionId,
                origin: L.origin,
                jobId: L.jobId,
                runtime: L.runtime,
                activeToolCalls: [...L.activeToolCalls.values()]
            });
            return w
        },
        getSweeperActorState(w) {
            let T = F.get(w);
            return !T || T.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: T.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: T.lastActivityAt,
                lastTurnCompletedAt: T.lastTurnCompletedAt,
                spawnedAt: T.spawnedAt
            }
        },
        markAgentNotified(w) {
            let T = F.get(w);
            T && (T.agentNotifiedThisDrain = !0)
        }
    }
}
