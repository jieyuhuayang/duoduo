// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: act, daemon.pretty.js:77628)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
    let {
        paths: t,
        bus: n,
        sdk: r,
        idleTimeoutMs: i = 36e5,
        heartbeatIntervalMs: o = 3e4
    } = e, s = r ?? createAgentSdkAdapter(), a = new Io(t), {
        listSessionInboxPendingNames: l,
        sessionInboxFreshNameVerdict: u,
        finalizeJobSession: c
    } = ywe({
        paths: t,
        bus: n,
        jobManager: a
    }), d = e.codexAvailability ?? checkCodexAvailability, p = e.codexAdapterFactory ?? createCodexAppServerAdapter, f = null, m = () => (f || (f = d()), f), h = e.grokAvailability ?? checkGrokAvailability, g = e.grokAdapterFactory ?? createGrokAcpAdapter, y = e.piAdapterFactory ?? _C, w = null, v = () => (w || (w = h()), w), {
        toModelOptions: b,
        resolveRuntimeForModelCommand: I,
        resolveModelProfileScope: T,
        classifyModelTargetAgainstLiveGeneration: P
    } = Zwe({
        paths: t,
        probeCodexAvailability: m
    }), {
        ensureStreamingSession: k
    } = eSe({
        paths: t,
        bus: n,
        resolvedSdk: s,
        classifyModelTargetAgainstLiveGeneration: P
    });
    async function S(_, E) {
        let N = E.trim();
        if (!N) return;
        let K = ku({
            channel_kind: pw(_),
            session_key: _,
            payload: {
                text: N
            }
        });
        try {
            await xu(t, K), n.emit("session.output", {
                sessionKey: _,
                record: K
            })
        } catch (B) {
            Me("[session-manager] grok detached-turn outbox write failed", {
                sessionKey: _,
                error: B instanceof Error ? B.message : String(B)
            })
        }
    }
    let D = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        $ = e.maxConcurrentJob ?? 6,
        C = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: D,
            wakeQueue: []
        },
        O = {
            name: "job",
            activeCount: 0,
            maxConcurrent: $,
            wakeQueue: []
        };

    function j(_, E) {
        return hwe(_, E) === "job" ? O : C
    }

    function x(_) {
        return C.wakeQueue.includes(_) || O.wakeQueue.includes(_)
    }

    function F(_) {
        if (_.wakeQueue.length === 0 || !oe) return;
        let E = _.wakeQueue.findIndex(B => !Qn(B));
        if (E === -1) {
            ut("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: _.name,
                queuedSessions: _.wakeQueue.length
            });
            return
        }
        let N = _.wakeQueue.splice(E, 1)[0];
        E > 0 && ut("[session-manager] dequeue skipped archiving sessions", {
            skipped: E,
            sessionKey: N,
            pool: _.name
        }), ut("[session-manager] dequeue queued wake", {
            sessionKey: N,
            pool: _.name,
            queuedSessions: _.wakeQueue.length
        });
        let K = q.get(N);
        if (K && K.status === "idle" && !K.holdsPoolSlot && K.drainPromise) {
            K.pendingWake = !0, K.wakeResolver && (K.wakeResolver(), K.wakeResolver = null), ut("[session-manager] resuming idle actor from dequeue", {
                sessionKey: N,
                actorRunId: K.actorRunId,
                pool: _.name
            });
            return
        }
        if (_.activeCount >= _.maxConcurrent) {
            _.wakeQueue.unshift(N), ut("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: N,
                pool: _.name,
                activeCount: _.activeCount
            });
            return
        }
        if (K?.origin === "job" && K.jobId) {
            let B = K.jobId;
            L(N, {
                origin: "job",
                jobId: B
            })
        } else {
            let B = m6(N);
            L(N, B ?? void 0)
        }
    }
    let q = new Map,
        J = new Map,
        le = new Map,
        oe = !1,
        X = 0,
        te = ({
            sessionKey: _,
            displayName: E,
            preempt: N,
            preemptBoundary: K
        }) => {
            ut("[session-manager] wake", {
                sessionKey: _,
                preempt: N ?? "allow",
                preemptBoundary: K ?? "default"
            }), E && J.set(_, E), ae(_, {
                preempt: N,
                preemptBoundary: K
            })
        },
        z = () => {
            ne()
        },
        V = ({
            sessionKey: _,
            reason: E
        }) => {
            let N = q.get(_);
            if (!N) return;
            let K = N.streamingAdapter !== null;
            N.streamingAdapter = null;
            let B = !1;
            N.streamingState && !N.streamingState.closed && (N.streamingState.needsRecreation = !0, B = !0), (K || B) && ee("[session-manager] streamingAdapter torn down for session", {
                sessionKey: _,
                reason: E,
                hadAdapter: K,
                stateMarked: B
            }), B && gt("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: _,
                reason: "instructions-drift",
                generation: N.streamingGeneration,
                sdk_session_id: N.sdkSessionId ?? null
            })
        };

    function pe(_) {
        return _.runtime !== "claude" ? _.adapter ? _.adapter : {
            run: async () => {
                throw new Error(`${_.runtime} runtime selected but its adapter was not built; refusing to fall through to Claude`)
            }
        } : _.origin !== "channel" || !s.createStreamingQuery ? s : (_.streamingAdapter || (_.streamingAdapter = {
            run: async E => {
                let N = await k(_, E);
                return await new Promise((K, B) => {
                    if (N.closed) {
                        B(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    N.queue.enqueue({
                        input: E,
                        resolve: K,
                        reject: B,
                        accepted: !1,
                        sessionId: E.sessionId,
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
        }), _.streamingAdapter)
    }

    function ae(_, E) {
        if (!oe) {
            ut("[session-manager] wake ignored, manager not running", {
                sessionKey: _
            });
            return
        }
        if (Qn(_)) {
            ut("[session-manager] wake suppressed, session is being archived", {
                sessionKey: _
            });
            return
        }
        let N = E?.preempt ?? "allow",
            K = E?.preemptBoundary,
            B = q.get(_);
        if (B && B.wakeResolver) {
            ut("[session-manager] wake delivered to idle actor", {
                sessionKey: _,
                actorRunId: B.actorRunId,
                status: B.status,
                preemptBoundary: K ?? "default"
            }), B.wakeResolver(), B.wakeResolver = null;
            return
        }
        if (B && B.drainPromise && (B.status === "active" || B.status === "idle")) {
            let be = !!B.query && B.streamingState?.currentTurn?.accepted === !0,
                De = !!B.adapter?.activeTurnId?.();
            if (N === "allow" && (be || De) && B.admissionCallback && !B.admissionInProgress) {
                B.pendingWake = !0, B.admissionInProgress = !0;
                let Be = B.admissionCallback;
                ut("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: _,
                    actorRunId: B.actorRunId
                }), Be().then(() => {
                    B.admissionInProgress = !1, B.wakeResolver?.()
                }, () => {
                    B.admissionInProgress = !1, B.wakeResolver?.()
                });
                return
            }
            if (B.status === "active" && B.currentAbortController)
                if (N === "force") {
                    let Be = ww(B, "immediate", K);
                    Be === "immediate" ? ut("[session-manager] wake: forced preempt", {
                        sessionKey: _,
                        actorRunId: B.actorRunId,
                        preemptBoundary: K ?? "default"
                    }) : Be === "defer_accept" ? ut("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: _,
                        actorRunId: B.actorRunId
                    }) : Be === "defer_tool_result" ? ut("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: _,
                        actorRunId: B.actorRunId
                    }) : Be === "defer_tool_use" && ut("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: _,
                        actorRunId: B.actorRunId
                    })
                } else if (N === "allow") {
                let Be = ww(B, "soft", K);
                Be === "defer_accept" ? ut("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: _,
                    actorRunId: B.actorRunId
                }) : Be === "defer_tool_use" ? ut("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: _,
                    actorRunId: B.actorRunId
                }) : Be === "defer_tool_result" ? ut("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: _,
                    actorRunId: B.actorRunId
                }) : Be === "immediate" && ut("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: _,
                    actorRunId: B.actorRunId
                })
            } else ut("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: _,
                actorRunId: B.actorRunId
            });
            B.pendingWake = !0, ut("[session-manager] wake marked pending", {
                sessionKey: _,
                actorRunId: B.actorRunId,
                status: B.status
            });
            return
        }
        let se = j(_, B?.origin);
        if (se.activeCount >= se.maxConcurrent) {
            let be = se.wakeQueue.includes(_);
            be || se.wakeQueue.push(_), ut("[session-manager] wake queued", {
                sessionKey: _,
                pool: se.name,
                activeCount: se.activeCount,
                maxConcurrent: se.maxConcurrent,
                alreadyQueued: be,
                queuedSessions: se.wakeQueue.length
            });
            return
        }
        let me = m6(_);
        me ? (ut("[session-manager] wake starting actor with inferred origin", {
            sessionKey: _,
            ...me
        }), L(_, me)) : (ut("[session-manager] wake starting actor", {
            sessionKey: _
        }), L(_))
    }

    function L(_, E) {
        let N = q.get(_),
            K = N?.attachedChannels ?? new Set,
            B = ++X,
            se = {
                sessionKey: _,
                actorRunId: B,
                sdkSessionId: N?.sdkSessionId,
                sdkSessionIdVerified: N?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: N?.streamingAdapter ?? null,
                streamingGeneration: N?.streamingGeneration ?? 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                liveTurnNotifyOnly: !1,
                isStreaming: !1,
                activeToolCalls: new Map,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: K,
                origin: E?.origin ?? N?.origin ?? "channel",
                jobId: E?.jobId ?? N?.jobId,
                jobStateless: N?.jobStateless ?? !1,
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
                runtime: E?.runtime ?? N?.runtime ?? "claude",
                adapter: N?.adapter ?? null,
                adapterFacts: N?.adapterFacts,
                consecutiveConservativeRedrive: N?.consecutiveConservativeRedrive ?? !1
            };
        q.set(_, se);
        let me = j(_, se.origin);
        me.activeCount++, se.holdsPoolSlot = !0;
        let be = J.get(_);
        if (be && J.delete(_), l0(t, {
                session_key: _,
                display_name: be,
                kind: se.origin === "job" ? "job" : se.origin === "system" ? "system" : _.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), ee("[session-manager] actor start", {
                sessionKey: _,
                actorRunId: B,
                sdkSessionId: se.sdkSessionId,
                origin: se.origin,
                jobId: se.jobId,
                pool: me.name,
                activeCount: me.activeCount,
                attachedChannels: se.attachedChannels.size,
                queuedSessions: me.wakeQueue.length
            }), E?.preStart) {
            let De = E.preStart;
            se.drainPromise = De().catch(Be => Me("[session-manager] preStart failed", Be)).then(() => M(se))
        } else se.drainPromise = M(se)
    }
    async function M(_) {
        let {
            sessionKey: E
        } = _, N, K, B = 0, se = 0, me = !1, be = [], De = 0, Be = !1, $t = !1, ot = null, Gt = null, Fe;
        try {
            Fe = await l(E)
        } catch (et) {
            W("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: E,
                error: et instanceof Error ? et.message : String(et)
            }), Fe = new Set
        }
        ut("[session-manager] drain loop begin", {
            sessionKey: E,
            actorRunId: _.actorRunId,
            origin: _.origin,
            jobId: _.jobId
        });
        try {
            if (!_.sdkSessionId && !_.pendingClear) {
                let Ze = await ct(t, E);
                Ze?.sdk_session_id && (_.sdkSessionId = Ze.sdk_session_id, ee("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: E,
                    sdkSessionId: Ze.sdk_session_id
                }))
            }
            if ((await ct(t, E))?.session_key || await Qe(t, E, {
                    session_key: E
                }), _.origin === "job" && !_.jobId) {
                await a.init();
                let mr = (await a.listJobs()).find(Rn => Rn.session_key === E);
                mr ? (_.jobId = mr.id, ke("[session-manager] recovered jobId from active jobs", {
                    sessionKey: E,
                    jobId: mr.id
                })) : W("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: E
                })
            }
            let et, Ie, ze = !1,
                ft, fr, Ut, pr, ng = !1;
            if (_.jobStateless = !1, _.origin === "job" && _.jobId) {
                let Ze = await a.getJob(_.jobId);
                if (Gt = Ze, ot = Ze?.state.last_scheduled_at ?? null, Ze?.execution_cwd && (await Npe({
                        cwdRel: Ze.execution_context === "workspace" ? Ze.frontmatter.cwd_rel ?? null : null,
                        cwd: Ze.execution_cwd,
                        runtimeWorkspaceDir: Ze.runtime_workspace_dir,
                        context: Ze.execution_context
                    }), await Te(Ze.execution_cwd), await Qe(t, E, {
                        session_key: E,
                        cwd: Ze.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), Ze) {
                    et = mw(Ze.frontmatter.cron), Ie = Ze.frontmatter.cron;
                    let mr = Ze.frontmatter.stateless === !0;
                    if (mr && Ze.frontmatter.cron === "keepalive") throw new Error(r4);
                    ze = mr, _.jobStateless = ze, ft = Ze.frontmatter.model, fr = Ze.frontmatter.effort, Ut = {
                        piExtensions: Ze.frontmatter.piExtensions,
                        piSkills: Ze.frontmatter.piSkills,
                        piConfigIssues: Ze.frontmatter.piConfigIssues
                    };
                    let Rn = Ze.frontmatter.runtime ?? void 0,
                        He = Rn ?? _o(),
                        Br = Rn ? "explicit" : "default";
                    if (Ze.frontmatter.prompt_mode !== void 0 && He === "codex" && W("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                            sessionKey: E,
                            jobId: _.jobId,
                            promptMode: Ze.frontmatter.prompt_mode,
                            runtimeSource: Br
                        }), He === "codex") {
                        let Er = await m();
                        Er.ok ? _.runtime = "codex" : (_.runtime = "claude", W("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: E,
                            jobId: _.jobId,
                            runtime_source: Br,
                            reason: Er.reason
                        }))
                    } else if (He === "grok") {
                        _.runtime = "grok";
                        let Er = await v();
                        Er.ok || (pr = Er.reason, W("[session-manager] job requested grok but grok is unavailable", {
                            sessionKey: E,
                            jobId: _.jobId,
                            runtime_source: Br,
                            reason: Er.reason
                        }))
                    } else He === "pi" ? _.runtime = "pi" : _.runtime = "claude"
                }
            } else if (_.origin === "channel") {
                let mr = (await ct(t, E))?.source_channel_id;
                if (mr) {
                    let Rn = await ro(t, mr).catch(() => null),
                        He = Rn?.channel_kind,
                        Br = He ? await ts(t.channelConfigDir, He).catch(() => null) : null,
                        nn = Rn?.runtime ?? Br?.runtime ?? void 0 ?? _o(),
                        Se = Rn?.runtime ? "explicit" : Br?.runtime ? "inherited" : "default";
                    if (nn === "codex") {
                        let ve = await m();
                        ve.ok ? _.runtime = "codex" : (_.runtime = "claude", W("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: E,
                            sourceChannelId: mr,
                            runtime_source: Se,
                            reason: ve.reason
                        }))
                    } else if (nn === "grok") {
                        _.runtime = "grok";
                        let ve = await v();
                        ve.ok || (pr = ve.reason, W("[session-manager] channel requested grok but grok is unavailable", {
                            sessionKey: E,
                            sourceChannelId: mr,
                            runtime_source: Se,
                            reason: ve.reason
                        }))
                    } else nn === "pi" ? _.runtime = "pi" : _.runtime = "claude"
                }
            }
            for (; _.status !== "ended" && oe;) {
                let Ze = pr;
                if (_.runtime !== "codex") {
                    for (;;) {
                        let Ne = _.streamingState,
                            rt = !!Ne && !Ne.closed && (Ne.cliTurnTentative !== null || Ne.currentTurn !== null);
                        if (!rt && !_.admissionInProgress) break;
                        if (_.pendingWake) {
                            _.pendingWake = !1;
                            continue
                        }
                        ut("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: E,
                            actorRunId: _.actorRunId,
                            cliBusy: rt,
                            admissionInProgress: _.admissionInProgress
                        }), await N6(_, i)
                    }
                    if (!oe || _.status === "ended") break
                }
                _.pendingClear && (_.sdkSessionId = void 0, _.pendingClear = !1, await Qe(t, E, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }).catch(() => {}));
                let mr, Rn = null;
                _.origin === "job" && _.jobId && (ng ? Rn = await a.getJob(_.jobId).catch(() => null) : (ng = !0, Rn = Gt));
                let {
                    instructions: He,
                    missionContent: Br
                } = await Jwe(t, E, _, Rn), Er = await ct(t, E), nn = await runInstructionsFingerprintGuard(t, E, He, _.runtime, {
                    instructions_fingerprint: Er?.instructions_fingerprint,
                    mission_fingerprint: Er?.mission_fingerprint,
                    schema_version: Er?.schema_version,
                    sdk_session_id: Er?.sdk_session_id,
                    board_layer_hash: Er?.board_layer_hash,
                    instructions_nonboard_fingerprint: Er?.instructions_nonboard_fingerprint
                }, _.origin === "job" && _.jobId ? {
                    jobId: _.jobId
                } : void 0);
                nn.clearedSdkSessionId && (_.sdkSessionId = void 0), nn.gate2Fired && _.runtime === "claude" && (nn.boardOnlyDrift ? _.streamingState && !_.streamingState.closed ? ee("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: E,
                    board_layer_hash: nn.boardLayerHash
                }) : ee("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: E,
                    board_layer_hash: nn.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: E,
                    reason: "instructions_drift"
                })), _.origin === "job" && _.jobId && (Br !== void 0 ? mr = {
                    content: Br,
                    jobId: _.jobId,
                    cron: Rn?.frontmatter.cron ?? "",
                    stateless: ze,
                    acceptance: Rn?.frontmatter.acceptance,
                    model: Rn ? Rn.frontmatter.model : ft,
                    effort: Rn ? Rn.frontmatter.effort : fr,
                    sdkConfig: Fpe(Rn?.frontmatter)
                } : W("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: E,
                    jobId: _.jobId
                })), _.status !== "ended" && (_.status = "active"), _.idleSince = void 0;
                let Se = new Set,
                    ve = Date.now(),
                    ie = new AbortController;
                _.currentAbortController = ie;
                let Je;
                try {
                    let Ne = [..._.origin === "system" ? [] : [cme], gme, Tme];
                    _.origin === "channel" && (Ne.push(ybe), Ne.push(Uu));
                    let rt = _.origin === "job" ? "job" : _.origin === "system" ? "system" : "foreground",
                        Rr = 0,
                        sn = mwe();
                    if (_.admissionCallback = async () => {
                            try {
                                await qE(t, E);
                                let at = await l_(t, E);
                                if (at.length === 0) return;
                                await BE(t, E, at);
                                let Xe = {},
                                    fn = await batchDrainItems(t, at, {
                                        fallbackBatchSize: FB,
                                        mergeWindowMs: zB,
                                        perf: Xe
                                    }),
                                    jn = await ct(t, E),
                                    rr = Th(t, E, jn ?? void 0),
                                    Zn = [],
                                    Tr = [];
                                for (let dt of fn.items) {
                                    if (!dt.eventId) continue;
                                    if (_.inflightEventIds.has(dt.eventId)) {
                                        Tr.push(dt.eventId);
                                        continue
                                    }
                                    if (await cm(t, dt.eventId)) {
                                        Tr.push(dt.eventId);
                                        continue
                                    }
                                    let Dt = dt.createdAt ? {
                                            notAfter: dt.createdAt
                                        } : void 0,
                                        Mt = fn.events.get(dt.eventId) ?? await md(t, dt.eventId, Dt);
                                    if (!Mt) {
                                        W(`[session-manager] mailbox event unresolved: session_key=${E} event_id=${dt.eventId} not_after=${Dt?.notAfter??"none"} item_file=${dt.file??"none"}`);
                                        continue
                                    }
                                    Zn.push({
                                        item: dt,
                                        event: Mt,
                                        prompt: gC(Mt, E)
                                    })
                                }
                                if (Zn.length === 0) {
                                    Tr.length > 0 && await wo(t, E, Tr);
                                    return
                                }
                                let Tn = await UB(t, E, {
                                        allowedTools: Ne,
                                        tools: sn,
                                        additionalDirectories: [t.memoryDir]
                                    }, Zn, rr, {
                                        pendingGatewayNotice: jn?.pending_gateway_notice,
                                        pendingInterruptedContext: jn?.pending_interrupted_context,
                                        pendingSkipRewind: jn?.pending_skip_rewind,
                                        lastEventAtWatermark: jn?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, Xe, dt => dt),
                                    No = [...Tr, ...Zn.map(dt => dt.item.eventId).filter(dt => !!dt)];
                                if (_.runtime === "codex" || _.runtime === "grok" || _.runtime === "pi") {
                                    let dt = _.adapter?.steerActiveTurn,
                                        Hr = Tn.coalescedPromptText.trim(),
                                        Dt = _.adapter?.activeTurnId?.(),
                                        Mt = _.adapter?.activeTurnStartedAt?.(),
                                        Vr = !1;
                                    if (Dt && Mt !== void 0)
                                        if (_.adapter?.activeTurnSkipObserved?.() === !0) Vr = !0;
                                        else {
                                            let Xs = await ct(t, E).catch(() => null);
                                            if (Xs === null) Vr = !0, W("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: E
                                            });
                                            else {
                                                let li = Date.parse(Xs.pending_skip_rewind?.skipped_at ?? "");
                                                Vr = Number.isFinite(li) && li >= Mt
                                            }
                                        } if (!!dt && !!Dt && !Tn.isNotifyOnly && !_.liveTurnNotifyOnly && Hr.length > 0 && !Vr && dt && Dt) {
                                        let ho = Tn.batchEventIds.filter(li => !_.inflightEventIds.has(li));
                                        for (let li of ho) _.inflightEventIds.add(li);
                                        if (await dt(Hr, Dt, Tn.attachments).catch(() => !1)) {
                                            await wo(t, E, No);
                                            for (let li of ho) _.inflightEventIds.delete(li);
                                            ee("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: E,
                                                admittedItems: Zn.length,
                                                batchEventIds: Tn.batchEventIds
                                            })
                                        } else {
                                            for (let li of ho) _.inflightEventIds.delete(li);
                                            _.pendingWake = !0, ee("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: E,
                                                batchEventIds: Tn.batchEventIds
                                            })
                                        }
                                    } else _.pendingWake = !0, ee("[session-manager] admission callback: codex steer not attempted, redraining", {
                                        sessionKey: E,
                                        admittedItems: Zn.length,
                                        batchEventIds: Tn.batchEventIds,
                                        liveTurn: !!Dt,
                                        notifyOnlyBatch: Tn.isNotifyOnly,
                                        sealedBySkip: Vr,
                                        liveTurnNotifyOnly: _.liveTurnNotifyOnly,
                                        emptyText: Hr.length === 0
                                    });
                                    return
                                }
                                let Sn = _.streamingState;
                                if (!Sn || Sn.closed) return;
                                let Pi = Sn.currentTurn,
                                    qt = !!Tn.attachments && Tn.attachments.length > 0,
                                    an = Tn.coalescedPromptText.trim();
                                if (!!Pi && Pi.accepted && !Pi.skipCalled && !qt && !Tn.isNotifyOnly && !_.liveTurnNotifyOnly && an.length > 0) {
                                    let dt = _.pendingSteer;
                                    if (dt && !dt.settled && dt.spawningTurn === Pi) {
                                        let Hr = Tn.batchEventIds.filter(Dt => !_.inflightEventIds.has(Dt));
                                        for (let Dt of Hr) _.inflightEventIds.add(Dt);
                                        dt.steerText = `${dt.steerText}
${an}`, dt.eventIds.push(...No), dt.claimedEventIds.push(...Hr), dt.requeueLines.push(...Zn.map(Dt => Dt.item.line)), dt.requeueEventIds.push(...Zn.map(Dt => Dt.item.eventId)), dt.processedEventIds.push(...Tr), ee("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: E,
                                            admittedItems: Zn.length,
                                            batchEventIds: Tn.batchEventIds
                                        });
                                        return
                                    }
                                    if (!dt) {
                                        let Hr = Tn.batchEventIds.filter(Mt => !_.inflightEventIds.has(Mt));
                                        for (let Mt of Hr) _.inflightEventIds.add(Mt);
                                        let Dt = {
                                            steerText: an,
                                            eventIds: [...No],
                                            claimedEventIds: [...Hr],
                                            enqueueAsNewTurn: async () => {
                                                let Mt = [];
                                                for (let _s = 0; _s < Dt.requeueLines.length; _s += 1) {
                                                    let ho = Dt.requeueLines[_s],
                                                        Xs = Dt.requeueEventIds[_s];
                                                    try {
                                                        await $s(t, E, ho), Mt.push(Xs)
                                                    } catch (li) {
                                                        W("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: E,
                                                            eventId: Xs,
                                                            error: li instanceof Error ? li.message : String(li)
                                                        })
                                                    }
                                                }
                                                let Vr = [...Mt, ...Dt.processedEventIds];
                                                if (Vr.length > 0) try {
                                                    await wo(t, E, Vr)
                                                } catch (_s) {
                                                    ee("[session-manager] steer fallback markDone error", {
                                                        sessionKey: E,
                                                        error: String(_s)
                                                    })
                                                }
                                                for (let _s of Dt.claimedEventIds) _.inflightEventIds.delete(_s);
                                                _.pendingWake = !0, ee("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: E,
                                                    eventIds: Dt.eventIds,
                                                    requeued: Mt.length,
                                                    requeueFailed: Dt.requeueLines.length - Mt.length
                                                })
                                            },
                                            spawningTurn: Pi,
                                            requeueLines: Zn.map(Mt => Mt.item.line),
                                            requeueEventIds: Zn.map(Mt => Mt.item.eventId),
                                            processedEventIds: [...Tr],
                                            settled: !1
                                        };
                                        _.pendingSteer = Dt, ee("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: E,
                                            admittedItems: Zn.length,
                                            batchEventIds: Tn.batchEventIds
                                        });
                                        return
                                    }
                                }
                                _.pendingWake = !0, _.wakeResolver?.()
                            } catch (at) {
                                ee("[session-manager] admission callback error", {
                                    sessionKey: E,
                                    error: String(at)
                                })
                            }
                        }, _.runtime === "codex" && !_.adapter) {
                        let at = (await ct(t, E))?.cwd;
                        at && await ensureAgentsMdSymlink(at).catch(() => {}), _.adapter = p({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: ft,
                            dynamicTools: dO({
                                paths: t,
                                sessionKey: E,
                                bus: n,
                                sessionContextKind: rt,
                                notifyDepth: Rr,
                                jobScheduleType: et,
                                callerJobCron: Ie,
                                getSessionStatus: Xe => q.get(Xe)?.status,
                                onNotifyCalled: () => {
                                    _.agentNotifiedThisDrain = !0
                                }
                            })
                        })
                    }
                    if (_.runtime === "grok" && !_.adapter && !Ze) {
                        let at = await ct(t, E).catch(() => null);
                        _.adapter = g({
                            cwd: at?.cwd ?? t.workDir,
                            sdkSessionId: at?.sdk_session_id,
                            mcpServerFactory: () => Yh(t, {
                                sessionKey: E,
                                bus: n,
                                sessionContextKind: rt,
                                notifyDepth: Rr,
                                jobScheduleType: et,
                                callerRuntime: _.runtime,
                                callerJobCron: Ie,
                                getSessionStatus: Xe => q.get(Xe)?.status,
                                onNotifyCalled: () => {
                                    _.agentNotifiedThisDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text: Xe
                            }) => S(E, Xe)
                        })
                    }
                    if (_.runtime === "pi" && !Ze) {
                        let at = await ct(t, E).catch(() => null),
                            Xe = Dv(),
                            {
                                settingsSeed: fn,
                                defaultProjectTrust: jn,
                                unknownKeys: rr,
                                readFailed: Zn
                            } = Mv(Xe);
                        rr.length > 0 && W("[session-manager] pi settings keys not classified (SDK bump gate)", {
                            sessionKey: E,
                            keys: rr
                        });
                        let Tr = !1,
                            Tn = Ut ? null : await $a(t, E).catch(() => (Tr = !0, null)),
                            No = Ut ? await Oa(t, {
                                channel_kind: "job"
                            }).catch(() => (Tr = !0, null)) : null,
                            Sn = Ut ?? Tn;
                        Sn?.piConfigIssues?.length && W("[session-manager] invalid pi.* config values ignored (defaults apply)", {
                            sessionKey: E,
                            issues: Sn.piConfigIssues
                        });
                        let Pi = (at?.model_runtime === "pi" ? at.model : void 0) ?? (Rn ? Rn.frontmatter.model : ft) ?? hv(Tn ?? No, "pi")?.model,
                            qt = Sn?.piExtensions ?? "all",
                            an = Sn?.piSkills ?? "all",
                            Ar = at?.effort ?? (Rn ? Rn.frontmatter.effort : fr) ?? gv(Tn ?? No, "pi")?.effort,
                            dt = hbe({
                                model: Pi,
                                thinkingLevel: Ar,
                                settingsSeed: fn,
                                defaultProjectTrust: jn,
                                extensions: qt,
                                skills: an,
                                instructionsFingerprint: mbe(mo(E) === "channel", nn)
                            }),
                            Hr = !Zn && !Tr;
                        if (Hr || W("[session-manager] pi construction facts unread, keeping the live worker", {
                                sessionKey: E,
                                seedReadFailed: Zn,
                                configReadFailed: Tr
                            }), _.adapter && _.adapterFacts !== dt && Hr) {
                            let Dt = _.adapter;
                            _.adapter = null, _.adapterFacts = void 0, Promise.resolve(Dt.shutdown()).catch(Mt => {
                                W("[session-manager] stale pi adapter shutdown failed", {
                                    sessionKey: E,
                                    error: String(Mt)
                                })
                            })
                        }
                        if (!_.adapter)
                            if (!Pi) Ze = "pi binds its model when the worker is built, and this session has none. Send `/model <provider>/<modelId>` (channel sessions), or set `model: <provider>/<modelId>` in the job frontmatter, then send the message again.";
                            else {
                                let Dt = yc.join(Xn(t, E), "pi"),
                                    Mt = {
                                        session_context_kind: rt
                                    };
                                _.adapter = y({
                                    cwd: at?.cwd ?? t.workDir,
                                    sdkSessionId: at?.sdk_session_id ?? oct(),
                                    sessionDir: Dt,
                                    agentDir: Xe,
                                    authPath: yc.join(Xe, "auth.json"),
                                    modelsPath: yc.join(Xe, "models.json"),
                                    modelsStorePath: yc.join(Dt, "models-store.json"),
                                    settingsSeed: fn,
                                    resources: {
                                        extensions: qt,
                                        skills: an,
                                        default_project_trust: jn
                                    },
                                    model: Pi,
                                    thinkingLevel: Ar,
                                    workerCommand: Nv(),
                                    env: {
                                        [SI]: t.daemonSocketPath,
                                        [kI]: EI({
                                            session_key: E,
                                            job_cron: Ie,
                                            job_schedule_type: et,
                                            ...Mt
                                        }),
                                        [xI]: JSON.stringify(Mt)
                                    },
                                    onToolEnd: Vr => vbe(t, E, Vr),
                                    logDebug: Vr => ke(Vr, {
                                        sessionKey: E
                                    }),
                                    logWarn: Vr => W(Vr, {
                                        sessionKey: E
                                    })
                                }), _.adapterFacts = dt
                            }
                    }
                    if (!oe || _.status === "ended") break;
                    let Pn = pe(_);
                    Je = await drainSessionMailbox(t, E, {
                        sdk: Pn,
                        usesStreamingAdapter: Pn === _.streamingAdapter,
                        bus: n,
                        abortController: ie,
                        runtime: _.runtime,
                        runtimeUnavailableReason: Ze,
                        excludeEventIds: Qwe(_),
                        actorSpawnedAt: _.spawnedAt,
                        actorLastTurnCompletedAt: _.lastTurnCompletedAt,
                        getStreamGeneration: () => _.streamingGeneration,
                        holdInputOpenForBackgroundAgents: _.runtime === "claude" && _.origin !== "channel",
                        jobContext: mr,
                        memoryBoard: He.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: He.memoryBoard
                        } : void 0,
                        boardHash: He.memoryBoard ? nn.boardLayerHash : void 0,
                        onBatchContext: at => {
                            if (Rr = at.maxNotifyDepth, at.eventIds)
                                for (let Xe of at.eventIds) _.inflightEventIds.add(Xe)
                        },
                        mcpServersFactory: () => ({
                            aladuo: Yh(t, {
                                sessionKey: E,
                                bus: n,
                                sessionContextKind: rt,
                                notifyDepth: Rr,
                                jobScheduleType: et,
                                callerRuntime: _.runtime,
                                callerJobCron: Ie,
                                getSessionStatus: at => q.get(at)?.status,
                                onNotifyCalled: () => {
                                    _.agentNotifiedThisDrain = !0
                                }
                            })
                        }),
                        allowedTools: Ne,
                        tools: sn,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: o,
                        onSdkTurnStarted: at => {
                            _.liveTurnNotifyOnly = at.notifyOnly, B += 1;
                            let Xe = !me;
                            if (me = B > se, Xe && me && _.origin === "job" && _.jobId) {
                                let fn = _.jobId;
                                be.push(a.updateState(fn, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: ot
                                }).catch(jn => {
                                    W("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: E,
                                        jobId: fn,
                                        error: jn instanceof Error ? jn.message : String(jn)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            se += 1;
                            let at = me && B <= se;
                            if (me = B > se, at && _.origin === "job" && _.jobId) {
                                let Xe = _.jobId;
                                be.push(a.updateState(Xe, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: ot
                                }).catch(fn => {
                                    W("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: E,
                                        jobId: Xe,
                                        error: fn instanceof Error ? fn.message : String(fn)
                                    })
                                }))
                            }
                        },
                        onStream: (at, Xe, fn) => {
                            _.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: E,
                                chunk: at,
                                isSidechain: Xe,
                                anchorEventId: fn
                            })
                        },
                        onExecutionEvent: (at, Xe) => {
                            at.type === "tool_use" && (_.isStreaming = !1, _.activeToolCalls.set(at.toolUseId, {
                                toolName: at.toolName,
                                startedAtMs: Date.now()
                            }), _.pendingPreempt && _.pendingPreemptBoundary === "tool_use" && (_.pendingPreempt = !1, _.pendingPreemptBoundary = null, A6(_))), at.type === "tool_result" && (_.activeToolCalls.delete(at.toolUseId), _.pendingPreempt && _.pendingPreemptBoundary === "tool_result" && _.activeToolCalls.size === 0 && (_.pendingPreempt = !1, _.pendingPreemptBoundary = null, A6(_)));
                            let fn = cwe(at);
                            if (fn && Se.has(fn)) return;
                            fn && Se.add(fn);
                            let jn = dwe(at);
                            if (jn) {
                                let rr = at.type === "tool_use" || at.type === "tool_result" ? at.isSidechain : void 0;
                                n.emit("session.execution", {
                                    sessionKey: E,
                                    event: jn,
                                    anchorEventId: Xe,
                                    isSidechain: rr
                                })
                            }
                        }
                    })
                } finally {
                    _.admissionCallback = null, _.admissionInProgress || _.inflightEventIds.clear(), _.currentAbortController === ie && (_.currentAbortController = null), _.isStreaming = !1, _.activeToolCalls.clear(), _.pendingPreempt = !1, _.pendingPreemptBoundary = null
                }
                if (ut("[session-manager] drain result", {
                        sessionKey: E,
                        actorRunId: _.actorRunId,
                        processed: Je.processed,
                        skipped: Je.skipped,
                        lockAcquired: Je.lockAcquired,
                        outboxRecords: Je.outboxRecords?.length ?? (Je.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - ve
                    }), De += Je.processed, Be = Je.mergeTransientFailure === !0, Je.cancelled && ($t = !0), Je.processed > 0 && (_.lastTurnCompletedAt = Date.now(), await Ns(t, E, "last_error").catch(() => {})), Je.compacted && _.runtime === "claude" && _.streamingState && !_.streamingState.closed) {
                    let Ne = He.memoryBoard ? nn.boardLayerHash : void 0;
                    _.spawnBoardHash !== Ne && (_.streamingState.needsRecreation = !0, gt("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: E,
                        reason: "board-refresh(B4)",
                        generation: _.streamingGeneration,
                        spawn_board_hash: _.spawnBoardHash ? _.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: Ne ? Ne.slice(0, 12) : null
                    }))
                }
                if (_.pendingClear) _.sdkSessionId = void 0, _.pendingClear = !1, await Qe(t, E, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }).catch(() => {}), ee("[session-manager] applied pending clear after drain", {
                    sessionKey: E,
                    actorRunId: _.actorRunId
                });
                else {
                    let Ne = await ct(t, E);
                    if (Ne?.sdk_session_id) {
                        let rt = !_.sdkSessionId,
                            Rr = _.sdkSessionId !== Ne.sdk_session_id;
                        _.sdkSessionId = Ne.sdk_session_id, (rt || Rr) && ee("[session-manager] sdk session bound", {
                            sessionKey: E,
                            actorRunId: _.actorRunId,
                            sdkSessionId: _.sdkSessionId,
                            isNewSession: rt
                        })
                    }
                }
                if (Je.lastReplyText && (K = Je.lastReplyText), Je.outboxRecords && Je.outboxRecords.length > 0) {
                    ut("[session-manager] emitting outbox records", {
                        sessionKey: E,
                        actorRunId: _.actorRunId,
                        count: Je.outboxRecords.length
                    });
                    for (let Ne of Je.outboxRecords) n.emit("session.output", {
                        sessionKey: Ne.session_key,
                        record: Ne
                    })
                } else if (Je.lastOutboxRecord) ut("[session-manager] emitting single outbox record", {
                    sessionKey: E,
                    actorRunId: _.actorRunId,
                    recordId: Je.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: E,
                    record: Je.lastOutboxRecord
                });
                else if (_.origin === "channel" && Je.processed > 0 && !Je.cancelled) {
                    ut("[session-manager] drain produced no output, emitting stream_end", {
                        sessionKey: E,
                        actorRunId: _.actorRunId,
                        turnSkipped: Je.turnSkipped === !0
                    });
                    let Ne = Je.sdkTurns?.length ? Je.sdkTurns : [{
                        anchorEventId: void 0,
                        skipped: Je.turnSkipped === !0
                    }];
                    for (let rt of Ne) n.emit("session.stream_end", {
                        sessionKey: _.sessionKey,
                        reason: rt.skipped ? "skipped" : "interrupted",
                        anchorEventId: rt.anchorEventId
                    })
                }
                if (Je.processed === 0) {
                    if (_.origin === "job" || _.origin === "system") {
                        ut("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: E,
                            actorRunId: _.actorRunId,
                            origin: _.origin,
                            jobId: _.jobId
                        });
                        break
                    }
                    if (_.pendingWake) {
                        _.pendingWake = !1, ut("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: E,
                            actorRunId: _.actorRunId
                        });
                        continue
                    }
                    if (_.status = "idle", _.idleSince = new Date().toISOString(), _.pendingWake) {
                        _.pendingWake = !1, ut("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: E,
                            actorRunId: _.actorRunId
                        });
                        continue
                    }
                    if (ut("[session-manager] idle", {
                            sessionKey: E,
                            actorRunId: _.actorRunId,
                            attachedChannels: _.attachedChannels.size
                        }), _.holdsPoolSlot) {
                        let rt = j(E, _.origin);
                        rt.activeCount--, _.holdsPoolSlot = !1, ut("[session-manager] released pool slot (idle)", {
                            sessionKey: E,
                            pool: rt.name,
                            activeCount: rt.activeCount
                        }), F(rt)
                    }
                    let Ne = !1;
                    for (;;) {
                        let rt = !1,
                            Rr = !1;
                        for (; _.status === "idle";) {
                            if (_.pendingWake) {
                                _.pendingWake = !1, rt = !0;
                                break
                            }
                            if (!oe) {
                                Rr = !0;
                                break
                            }
                            if (await N6(_, i) || _.status !== "idle") {
                                rt = !0;
                                break
                            }
                            if (_.attachedChannels.size > 0) {
                                ut("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey: E,
                                    actorRunId: _.actorRunId,
                                    attachedChannels: _.attachedChannels.size
                                }), _.streamingState && !_.streamingState.closed && gt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey: E,
                                    generation: _.streamingGeneration,
                                    sdk_session_id: _.sdkSessionId ?? null
                                }), await bf(_), IO(_);
                                continue
                            }
                            break
                        }
                        if (Rr) {
                            Ne = !0;
                            break
                        }
                        if (!rt && _.status === "idle") {
                            ut("[session-manager] idle timeout, no attachments, exiting", {
                                sessionKey: E,
                                actorRunId: _.actorRunId
                            }), _.streamingState && !_.streamingState.closed && gt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                sessionKey: E,
                                generation: _.streamingGeneration,
                                sdk_session_id: _.sdkSessionId ?? null
                            }), Ne = !0;
                            break
                        }
                        if (rt && !_.holdsPoolSlot) {
                            let sn = j(E, _.origin);
                            if (sn.activeCount >= sn.maxConcurrent) {
                                sn.wakeQueue.includes(E) || sn.wakeQueue.unshift(E), ut("[session-manager] woken idle actor re-queued (pool full)", {
                                    sessionKey: E,
                                    pool: sn.name,
                                    activeCount: sn.activeCount
                                }), _.pendingWake = !1;
                                continue
                            }
                            sn.activeCount++, _.holdsPoolSlot = !0, ut("[session-manager] re-acquired pool slot (woken)", {
                                sessionKey: E,
                                pool: sn.name,
                                activeCount: sn.activeCount
                            })
                        }
                        break
                    }
                    if (Ne) break
                }
            }
        } catch (et) {
            Me(`[session-manager] error in drain loop for ${E}:`, et), N = et, await Qe(t, E, {
                last_error: {
                    message: et instanceof Error ? et.message : String(et),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            await bf(_), _.currentAbortController = null, _.streamingAdapter = null, _.isStreaming = !1, _.activeToolCalls.clear(), _.pendingPreempt = !1, _.pendingPreemptBoundary = null, await IO(_);
            let et = j(E, _.origin);
            if (_.holdsPoolSlot && (et.activeCount--, _.holdsPoolSlot = !1), _.origin === "job" && _.jobId) {
                be.length > 0 && await Promise.allSettled(be);
                try {
                    await c(_, {
                        runStarted: me,
                        cancelled: $t,
                        processedCount: De,
                        claimCursor: ot,
                        error: N,
                        resultText: K,
                        jobSnapshot: Gt
                    })
                } finally {
                    _.status = "ended"
                }
            } else _.status = "ended";
            if (_.pendingWake = !1, oe && nct(Xn(t, E)) && !Qn(E)) {
                let ze = await u(E, Fe);
                ze === "fresh" ? (_.consecutiveConservativeRedrive = !1, ut("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: E,
                    actorRunId: _.actorRunId
                }), ae(E, {
                    preempt: "never"
                })) : ze === "conservative" || Be ? _.consecutiveConservativeRedrive ? W("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: E,
                    actorRunId: _.actorRunId
                }) : (_.consecutiveConservativeRedrive = !0, ut("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: E,
                    actorRunId: _.actorRunId
                }), ae(E, {
                    preempt: "never"
                })) : _.consecutiveConservativeRedrive = !1
            }
            ee("[session-manager] actor end", {
                sessionKey: E,
                actorRunId: _.actorRunId,
                sdkSessionId: _.sdkSessionId,
                pool: et.name,
                activeCount: et.activeCount,
                origin: _.origin,
                jobId: _.jobId,
                attachedChannels: _.attachedChannels.size,
                queuedSessions: et.wakeQueue.length
            }), F(et)
        }
    }

    function U(_, E) {
        if (!oe) return;
        if (Qn(E)) {
            ut("[session-manager] skip job spawn, session is being archived", {
                jobId: _,
                sessionKey: E
            });
            return
        }
        let N = q.get(E);
        if (N && N.status !== "ended") {
            ut("[session-manager] skip duplicate job spawn", {
                jobId: _,
                sessionKey: E,
                actorStatus: N.status
            });
            return
        }
        if (O.activeCount >= O.maxConcurrent) {
            O.wakeQueue.includes(E) || O.wakeQueue.push(E), N ? (N.origin = "job", N.jobId = _) : q.set(E, {
                sessionKey: E,
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
                pendingClear: !1,
                attachedChannels: new Set,
                origin: "job",
                jobId: _,
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
        L(E, {
            origin: "job",
            jobId: _
        }), (async () => {
            try {
                let K = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: _
                    },
                    session_key: E,
                    payload: {
                        job_id: _
                    }
                });
                await atomicAppendEvent(t, K), n.emit("job.spawned", {
                    jobId: _,
                    sessionKey: E
                })
            } catch (K) {
                Me("[session-manager] error recording job spawn", K)
            }
        })()
    }
    async function G(_, E) {
        let K = (le.get(_) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (qr(_) !== "channel") return;
            let B = pw(_),
                se = new Date().toISOString(),
                me = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: B,
                        name: "session-manager"
                    },
                    session_key: _,
                    payload: {
                        session_key: _,
                        channel_kind: B,
                        channel_id: E,
                        attached_at: se
                    }
                });
            await atomicAppendEvent(t, me)
        }).finally(() => {
            le.get(_) === K && le.delete(_)
        });
        le.set(_, K), await K
    }

    function ne() {
        for (let _ of q.values()) _.status = "ended", IO(_), _.streamAbortController && !_.streamAbortController.signal.aborted && _.streamAbortController.abort(), typeof _.query?.close == "function" && _.query.close(), _.query = null, _.streamAbortController = null, _.currentAbortController && !_.currentAbortController.signal.aborted && _.currentAbortController.abort(), _.currentAbortController = null, _.wakeResolver && (_.wakeResolver(), _.wakeResolver = null)
    }
    async function Q() {
        if (le.size === 0) return;
        let _ = Array.from(le.values()),
            E = !1,
            N = new Promise(K => setTimeout(() => {
                E = !0, K()
            }, 3e4));
        await Promise.race([Promise.allSettled(_).then(() => {}), N]), E && W("[session-manager] shutdown abandoned pending attach writes after the fallback", {
            pending: _.length
        })
    }
    async function Ae(_) {
        let E;
        try {
            E = rct(yc.join(sct(), "aladuo-pi-catalog-"));
            let N = Dv(),
                {
                    settingsSeed: K,
                    defaultProjectTrust: B
                } = Mv(N),
                se = await $a(t, _).catch(() => null),
                me = await ct(t, _).catch(() => null),
                be = await cbe({
                    cwd: me?.cwd ?? t.workDir,
                    agentDir: N,
                    authPath: yc.join(N, "auth.json"),
                    modelsPath: yc.join(N, "models.json"),
                    modelsStorePath: yc.join(E, "models-store.json"),
                    settingsSeed: K,
                    resources: {
                        extensions: se?.piExtensions ?? "all",
                        default_project_trust: B
                    },
                    workerCommand: Nv(),
                    logDebug: De => ke("[pi-catalog] " + De)
                });
            return be.length > 0 ? be : void 0
        } catch (N) {
            W("[session-manager] pi model catalog failed", {
                sessionKey: _,
                error: String(N)
            });
            return
        } finally {
            try {
                E && ict(E, {
                    recursive: !0,
                    force: !0
                })
            } catch {}
        }
    }
    return {
        async start() {
            if (!oe) {
                oe = !0, n.on("session.wake", te), n.on("shutdown", z), n.on("session.streaming_invalidated", V);
                try {
                    let _ = await rehydrateSessionState(t);
                    for (let E of _) {
                        if (Qn(E)) {
                            ut("[session-manager] skip hydrating session being archived", {
                                sessionKey: E
                            });
                            continue
                        }
                        let K = (await ct(t, E))?.cwd;
                        if (K && !gwe(K)) {
                            W("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: E,
                                cwd: K
                            });
                            continue
                        }
                        ae(E, {
                            preempt: "never"
                        })
                    }
                } catch (_) {
                    Me("[session-manager] error hydrating sessions:", _)
                }
                ee("[session-manager] started", {
                    channelActive: C.activeCount,
                    channelQueued: C.wakeQueue.length,
                    jobActive: O.activeCount,
                    jobQueued: O.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!oe) return;
            oe = !1, n.off("session.wake", te), n.off("shutdown", z), n.off("session.streaming_invalidated", V), ne();
            let _ = Array.from(q.values()).map(E => E.drainPromise).filter(E => E !== null);
            if (_.length > 0) {
                let E = Array.from(q.values()).filter(B => B.drainPromise !== null),
                    N = !1,
                    K = new Promise(B => setTimeout(() => {
                        N = !0, B()
                    }, 3e4));
                await Promise.race([Promise.all(_), K]), N && W("[session-manager] shutdown abandoned running drains after the fallback", {
                    sessions: E.map(B => B.sessionKey),
                    runtimes: E.map(B => B.runtime)
                })
            }
            await Q(), q.clear(), C.wakeQueue.length = 0, C.activeCount = 0, O.wakeQueue.length = 0, O.activeCount = 0, ee("[session-manager] stopped")
        },
        wakeSession: ae,
        getActor(_) {
            return q.get(_)
        },
        activeCount() {
            return C.activeCount + O.activeCount
        },
        activeChannelCount() {
            return C.activeCount
        },
        activeJobCount() {
            return O.activeCount
        },
        isRunning() {
            return oe
        },
        attachChannel(_, E) {
            let N = q.get(_);
            N || (N = {
                sessionKey: _,
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
            }, q.set(_, N)), N.attachedChannels.add(E), ut("[session-manager] channel attached", {
                sessionKey: _,
                channelId: E,
                totalAttachments: N.attachedChannels.size
            }), G(_, E).catch(K => {
                W("[session-manager] failed to emit channel.attached event", {
                    sessionKey: _,
                    channelId: E,
                    error: String(K)
                })
            })
        },
        detachChannel(_, E) {
            let N = q.get(_);
            N && (N.attachedChannels.delete(E), ut("[session-manager] channel detached", {
                sessionKey: _,
                channelId: E,
                remainingAttachments: N.attachedChannels.size
            }), N.attachedChannels.size === 0 && N.status === "idle" && N.wakeResolver && (N.wakeResolver(), N.wakeResolver = null))
        },
        hasAttachedChannels(_) {
            let E = q.get(_);
            return E ? E.attachedChannels.size > 0 : !1
        },
        spawnJobSession(_, E) {
            U(_, E)
        },
        async interruptSession(_) {
            if (!oe) return {
                interrupted: !1,
                reason: "not_running"
            };
            let E = q.get(_);
            return E ? !E.query && (!E.currentAbortController || E.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : E.streamAbortController && !E.streamAbortController.signal.aborted ? (ee("[session-manager] interrupt: stopping streaming session", {
                sessionKey: _,
                actorRunId: E.actorRunId
            }), await bf(E, "cancel-interrupt"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (ww(E, "immediate") === "immediate" && ee("[session-manager] interrupt requested", {
                sessionKey: _,
                actorRunId: E.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(_) {
            if (!oe) return {
                cleared: !1,
                reason: "not_running"
            };
            let E = q.get(_),
                N = E?.sdkSessionId;
            if (E && (E.pendingClear = !0, E.sdkSessionId = void 0, E.sdkSessionIdVerified = !1), E?.streamAbortController && !E.streamAbortController.signal.aborted ? await bf(E, "clear") : E?.currentAbortController && !E.currentAbortController.signal.aborted && ww(E, "immediate"), await Qe(t, _, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }), (E?.runtime === "pi" || E?.runtime === "grok") && E.adapter) {
                let K = E.adapter;
                E.adapter = null, E.adapterFacts = void 0, await Promise.resolve(K.shutdown()).catch(B => {
                    W("[session-manager] runtime adapter shutdown on clear failed", {
                        sessionKey: _,
                        runtime: E.runtime,
                        error: String(B)
                    })
                })
            }
            return ee("[session-manager] SDK session cleared", {
                sessionKey: _,
                actorRunId: E?.actorRunId,
                previousSessionId: N
            }), {
                cleared: !0,
                previousSessionId: N
            }
        },
        async getSessionModelView(_, E) {
            let N = q.get(_),
                K = await ct(t, _).catch(() => null),
                B = await I(_, N),
                se = {
                    runtime: B,
                    storedModel: K?.model,
                    hasLiveQuery: !!N?.query
                },
                me = await T(_, E).catch(Be => (W("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: _,
                    error: Be instanceof Error ? Be.message : String(Be)
                }), null)),
                be = hv(me, B);
            if (be && (se.configModel = {
                    ...be
                }), K?.last_served_model && (se.lastServedModel = K.last_served_model), B === "pi") return se.piProviders = await Ae(_), se;
            let De = N?.query;
            if (De && typeof De.supportedModels == "function") try {
                se.available = b(await De.supportedModels())
            } catch {}
            try {
                if (me && B === "claude") {
                    let Be = Object.entries(me.claudeModelProfiles ?? {}).map(([Gt, Fe]) => {
                        let et = s_e(Fe.baseUrl);
                        return {
                            model: Gt,
                            contextWindow: Fe.cap,
                            source: Fe.source,
                            ...et ? {
                                endpointHost: et
                            } : {}
                        }
                    });
                    Be.length > 0 && (se.profiles = Be.sort((Gt, Fe) => Gt.model.localeCompare(Fe.model)));
                    let $t = Object.entries(me.claudeModelAliases ?? {}).map(([Gt, Fe]) => ({
                        tier: Gt,
                        model: Fe.model,
                        source: Fe.source
                    })).sort((Gt, Fe) => Gt.tier.localeCompare(Fe.tier));
                    if ($t.length > 0 && (se.aliases = $t), !se.storedModel && !se.configModel) {
                        let Gt = await Eh({
                                model: null,
                                cwd: Th(t, _, K ?? void 0).cwd,
                                daemonEnv: process.env,
                                mergedCatalog: me.claudeModelProfiles ?? {},
                                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                                issues: me.claudeModelProfileIssues
                            }),
                            Fe = Gt.modelOrigin;
                        Gt.kind === "profiled-external" && (Fe === "project" || Fe === "user" || Fe === "env") && (se.cliDefaultModel = {
                            model: Gt.model,
                            origin: Fe
                        })
                    }
                    let ot = [...me.claudeModelProfileIssues ?? [], ...me.claudeModelAliasIssues ?? []];
                    ot.length > 0 && (se.profileIssues = ot.map(Gt => ({
                        ...Gt.model !== void 0 ? {
                            model: Gt.model
                        } : {},
                        reason: Gt.reason,
                        ...Gt.layer !== void 0 ? {
                            layer: Gt.layer
                        } : {}
                    })))
                }
            } catch (Be) {
                W("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: _,
                    error: Be instanceof Error ? Be.message : String(Be)
                })
            }
            return se
        },
        async setSessionModel(_, E, N) {
            if (!oe) return {
                ok: !1,
                reason: "not_running"
            };
            let K = q.get(_),
                B = await I(_, K);
            if (B === "pi") return E !== null && !y0(E) ? {
                ok: !1,
                reason: "runtime_rejected",
                detail: `pi model ids are canonical "provider/modelId" (got "${E}")`
            } : (await Qe(t, _, {
                model: E ?? null,
                model_runtime: E !== null ? "pi" : null,
                pending_model_fork: null
            }), ee("[session-manager] pi session model override updated", {
                sessionKey: _,
                model: E ?? "(reset to default)",
                applied: "stored"
            }), {
                ok: !0,
                model: E,
                applied: "stored"
            });
            if (B === "grok") {
                let Fe = C6(K?.adapter),
                    et = !!(Fe && (Fe.hasSession?.() ?? !0));
                if (E !== null && Fe && et) try {
                    await Fe.setModel({
                        modelId: E
                    })
                } catch (Ie) {
                    let ze = Ie instanceof Error ? Ie.message : String(Ie);
                    return W("[session-manager] grok session/set_model failed", {
                        sessionKey: _,
                        model: E,
                        error: ze
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: ze
                    }
                }
                return await Qe(t, _, {
                    model: E ?? null,
                    model_runtime: E !== null ? "grok" : null,
                    pending_model_fork: null
                }), ee("[session-manager] grok session model override updated", {
                    sessionKey: _,
                    model: E ?? "(reset to default)",
                    applied: E !== null && et ? "live" : "stored"
                }), {
                    ok: !0,
                    model: E,
                    applied: E !== null && et ? "live" : "stored"
                }
            }
            if (B === "codex") return await Qe(t, _, {
                model: E ?? null,
                model_runtime: E !== null ? "codex" : null,
                pending_model_fork: !0
            }), ee("[session-manager] codex session model override updated", {
                sessionKey: _,
                model: E ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: E,
                applied: "stored",
                pending_model_fork: !0
            };
            let se = K?.query,
                me;
            if (E && se && typeof se.supportedModels == "function") try {
                me = (await se.supportedModels()).some(et => et.value === E)
            } catch {}
            let be = await P(_, K, E, N).catch(Fe => (W("[session-manager] model context profile classification failed — applying live", {
                sessionKey: _,
                model: E ?? "(reset to default)",
                error: Fe instanceof Error ? Fe.message : String(Fe)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (be.outcome === "blocked") return W("[session-manager] /model refused: unresolved model context profile", {
                sessionKey: _,
                model: E ?? "(reset to default)",
                detail: be.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: be.detail
            };
            let De = be.outcome === "rebuild",
                Be = De ? "stored_pending_rebuild" : "stored",
                $t = null,
                ot = K?.streamingState;
            if (!De && !!ot && ot?.closed === !1 && (E ?? null) === (ot?.liveModel ?? null)) Be = "live";
            else if (!De && se && typeof se.setModel == "function") try {
                await se.setModel(E ?? void 0), Be = "live", ot && !ot.closed && (ot.liveModel = E ?? void 0)
            } catch (Fe) {
                W("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: _,
                    model: E ?? "(reset to default)",
                    error: Fe instanceof Error ? Fe.message : String(Fe)
                }), E && K && $6(K, be.requirementKind) && (Be = "stored_pending_rebuild", $t = E)
            }
            return await Qe(t, _, {
                model: E ?? null,
                model_runtime: E !== null ? "claude" : null,
                pending_model_fork: null
            }), $t && K && xO(K, {
                model: $t,
                requirementKind: be.requirementKind,
                reason: "live-command"
            }), ee("[session-manager] session model override updated", {
                sessionKey: _,
                model: E ?? "(reset to default)",
                applied: Be,
                listed: me ?? "(no list consulted)",
                contextProfile: be.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model: E,
                applied: Be,
                listed: me,
                contextProfile: be.requirementKind,
                ...be.contextWindow ? {
                    contextWindow: be.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(_, E) {
            let N = q.get(_),
                K = await ct(t, _).catch(() => null),
                B = await I(_, N),
                se = {
                    runtime: B,
                    storedEffort: K?.effort ?? void 0,
                    hasLiveQuery: !!N?.query
                },
                me = await T(_, E).catch(De => (W("[session-manager] /effort view: config scope unreadable", {
                    sessionKey: _,
                    error: De instanceof Error ? De.message : String(De)
                }), null)),
                be = gv(me, B);
            return be && (se.configEffort = {
                ...be
            }), se
        },
        async setSessionEffort(_, E) {
            if (!oe) return {
                ok: !1,
                reason: "not_running"
            };
            let N = q.get(_),
                K = await I(_, N);
            if (K === "pi") return await Qe(t, _, {
                effort: E ?? null
            }), ee("[session-manager] pi session effort override updated", {
                sessionKey: _,
                effort: E ?? "(reset to default)"
            }), {
                ok: !0,
                effort: E,
                applied: "stored"
            };
            if (K === "grok") {
                let me = C6(N?.adapter),
                    De = (await ct(t, _).catch(() => null))?.model ?? me?.currentModelId?.(),
                    Be = !!(me && (me.hasSession?.() ?? !0) && De);
                if (E !== null) {
                    if (!Be || !me || !De) return await Qe(t, _, {
                        effort: E
                    }), ee("[session-manager] grok session effort override updated", {
                        sessionKey: _,
                        effort: E,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort: E,
                        applied: "stored"
                    };
                    try {
                        await me.setModel({
                            modelId: De,
                            reasoningEffort: E
                        })
                    } catch ($t) {
                        let ot = $t instanceof Error ? $t.message : String($t);
                        return W("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey: _,
                            effort: E,
                            error: ot
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: ot
                        }
                    }
                    return await Qe(t, _, {
                        effort: E
                    }), ee("[session-manager] grok session effort override updated", {
                        sessionKey: _,
                        effort: E,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: E,
                        applied: "live"
                    }
                }
                if (me && De && (me.hasSession?.() ?? !0)) {
                    try {
                        await me.setModel({
                            modelId: De
                        })
                    } catch ($t) {
                        let ot = $t instanceof Error ? $t.message : String($t);
                        return W("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey: _,
                            error: ot
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: ot
                        }
                    }
                    return await Qe(t, _, {
                        effort: null
                    }), ee("[session-manager] grok session effort override updated", {
                        sessionKey: _,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await Qe(t, _, {
                    effort: null
                }), ee("[session-manager] grok session effort override updated", {
                    sessionKey: _,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (K === "codex") return await Qe(t, _, {
                effort: E ?? null
            }), ee("[session-manager] codex session effort override updated", {
                sessionKey: _,
                effort: E ?? "(reset to default)"
            }), {
                ok: !0,
                effort: E,
                applied: "stored"
            };
            let B = N?.query,
                se = "stored";
            if (B && typeof B.applyFlagSettings == "function") try {
                await B.applyFlagSettings({
                    effortLevel: E ?? null
                }), se = "live", N?.streamingState && (N.streamingState.lastAppliedEffort = E ?? null)
            } catch (me) {
                W("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: _,
                    effort: E ?? "(reset to default)",
                    error: me instanceof Error ? me.message : String(me)
                })
            }
            return await Qe(t, _, {
                effort: E ?? null
            }), ee("[session-manager] session effort override updated", {
                sessionKey: _,
                effort: E ?? "(reset to default)",
                applied: se
            }), {
                ok: !0,
                effort: E,
                applied: se
            }
        },
        getActorView(_) {
            let E = q.get(_);
            return !E || E.actorRunId <= 0 ? null : {
                sessionKey: E.sessionKey,
                status: E.status,
                health: "ok",
                idleSince: E.status === "idle" ? E.idleSince : void 0,
                attachedChannels: E.attachedChannels.size,
                sdkSessionId: E.sdkSessionId,
                origin: E.origin,
                jobId: E.jobId,
                runtime: E.runtime,
                activeToolCalls: [...E.activeToolCalls.values()]
            }
        },
        hasQueuedWake: x,
        listActors() {
            let _ = new Map;
            for (let [E, N] of q) N.actorRunId <= 0 && !x(N.sessionKey) || _.set(E, {
                sessionKey: N.sessionKey,
                status: N.status,
                health: "ok",
                idleSince: N.status === "idle" ? N.idleSince : void 0,
                attachedChannels: N.attachedChannels.size,
                sdkSessionId: N.sdkSessionId,
                origin: N.origin,
                jobId: N.jobId,
                runtime: N.runtime,
                activeToolCalls: [...N.activeToolCalls.values()]
            });
            return _
        },
        getSweeperActorState(_) {
            let E = q.get(_);
            return !E || E.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: E.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: E.lastActivityAt,
                lastTurnCompletedAt: E.lastTurnCompletedAt,
                spawnedAt: E.spawnedAt
            }
        },
        markAgentNotified(_) {
            let E = q.get(_);
            E && (E.agentNotifiedThisDrain = !0)
        }
    }
}
