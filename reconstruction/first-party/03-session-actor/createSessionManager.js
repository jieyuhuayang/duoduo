// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: Tgt, daemon.pretty.js:83621)
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
    } = wEe({
        paths: t,
        bus: n,
        jobManager: a
    }), d = e.codexAvailability ?? checkCodexAvailability, f = e.codexAdapterFactory ?? createCodexAppServerAdapter, p = null, m = () => (p || (p = d()), p), h = e.grokAvailability ?? checkGrokAvailability, g = e.grokAdapterFactory ?? createGrokAcpAdapter, y = e.piAdapterFactory ?? TO, v = null, b = () => (v || (v = h()), v), {
        toModelOptions: _,
        resolveRuntimeForModelCommand: I,
        resolveModelProfileScope: E,
        classifyModelTargetAgainstLiveGeneration: R
    } = QEe({
        paths: t,
        probeCodexAvailability: m
    }), {
        ensureStreamingSession: x
    } = o0e({
        paths: t,
        bus: n,
        resolvedSdk: s,
        classifyModelTargetAgainstLiveGeneration: R
    });
    async function S(w, P) {
        let z = P.trim();
        if (!z) return;
        let F = Hl({
            channel_kind: OS(w),
            session_key: w,
            payload: {
                text: z
            }
        });
        try {
            await Wl(t, F), n.emit("session.output", {
                sessionKey: w,
                record: F
            })
        } catch (V) {
            Le("[session-manager] grok detached-turn outbox write failed", {
                sessionKey: w,
                error: V instanceof Error ? V.message : String(V)
            })
        }
    }
    let D = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        A = e.maxConcurrentJob ?? 6,
        C = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: D,
            wakeQueue: []
        },
        $ = {
            name: "job",
            activeCount: 0,
            maxConcurrent: A,
            wakeQueue: []
        };

    function j(w, P) {
        return bEe(w, P) === "job" ? $ : C
    }

    function k(w) {
        return C.wakeQueue.includes(w) || $.wakeQueue.includes(w)
    }

    function L(w) {
        if (w.wakeQueue.length === 0 || !J) return;
        let P = w.wakeQueue.findIndex(V => !or(V));
        if (P === -1) {
            lt("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: w.name,
                queuedSessions: w.wakeQueue.length
            });
            return
        }
        let z = w.wakeQueue.splice(P, 1)[0];
        P > 0 && lt("[session-manager] dequeue skipped archiving sessions", {
            skipped: P,
            sessionKey: z,
            pool: w.name
        }), lt("[session-manager] dequeue queued wake", {
            sessionKey: z,
            pool: w.name,
            queuedSessions: w.wakeQueue.length
        });
        let F = B.get(z);
        if (F && F.status === "idle" && !F.holdsPoolSlot && F.drainPromise) {
            F.pendingWake = !0, F.wakeResolver && (F.wakeResolver(), F.wakeResolver = null), lt("[session-manager] resuming idle actor from dequeue", {
                sessionKey: z,
                actorRunId: F.actorRunId,
                pool: w.name
            });
            return
        }
        if (w.activeCount >= w.maxConcurrent) {
            w.wakeQueue.unshift(z), lt("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: z,
                pool: w.name,
                activeCount: w.activeCount
            });
            return
        }
        if (F?.origin === "job" && F.jobId) {
            let V = F.jobId;
            N(z, {
                origin: "job",
                jobId: V
            })
        } else {
            let V = ZW(z);
            N(z, V ?? void 0)
        }
    }
    let B = new Map,
        G = new Map,
        ce = new Map,
        J = !1,
        ee = 0,
        le = ({
            sessionKey: w,
            displayName: P,
            preempt: z,
            preemptBoundary: F
        }) => {
            lt("[session-manager] wake", {
                sessionKey: w,
                preempt: z ?? "allow",
                preemptBoundary: F ?? "default"
            }), P && G.set(w, P), se(w, {
                preempt: z,
                preemptBoundary: F
            })
        },
        M = () => {
            Se()
        },
        ue = ({
            sessionKey: w,
            reason: P
        }) => {
            let z = B.get(w);
            if (!z) return;
            let F = z.streamingAdapter !== null;
            z.streamingAdapter = null;
            let V = !1;
            z.streamingState && !z.streamingState.closed && (z.streamingState.needsRecreation = !0, V = !0), (F || V) && Q("[session-manager] streamingAdapter torn down for session", {
                sessionKey: w,
                reason: P,
                hadAdapter: F,
                stateMarked: V
            }), V && wt("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: w,
                reason: "instructions-drift",
                generation: z.streamingGeneration,
                sdk_session_id: z.sdkSessionId ?? null
            })
        };

    function $e(w) {
        return w.runtime !== "claude" ? w.adapter ? w.adapter : {
            run: async () => {
                throw new Error(`${w.runtime} runtime selected but its adapter was not built; refusing to fall through to Claude`)
            }
        } : w.origin !== "channel" || !s.createStreamingQuery ? s : (w.streamingAdapter || (w.streamingAdapter = {
            run: async P => {
                let z = await x(w, P),
                    F = r0e(w, P);
                return await new Promise((V, K) => {
                    if (z.closed) {
                        K(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    z.queue.enqueue({
                        input: F,
                        resolve: V,
                        reject: K,
                        accepted: !1,
                        sessionId: P.sessionId,
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

    function se(w, P) {
        if (!J) {
            lt("[session-manager] wake ignored, manager not running", {
                sessionKey: w
            });
            return
        }
        if (or(w)) {
            lt("[session-manager] wake suppressed, session is being archived", {
                sessionKey: w
            });
            return
        }
        let z = P?.preempt ?? "allow",
            F = P?.preemptBoundary,
            V = B.get(w);
        if (V && V.wakeResolver) {
            lt("[session-manager] wake delivered to idle actor", {
                sessionKey: w,
                actorRunId: V.actorRunId,
                status: V.status,
                preemptBoundary: F ?? "default"
            }), V.wakeResolver(), V.wakeResolver = null;
            return
        }
        if (V && V.drainPromise && (V.status === "active" || V.status === "idle")) {
            let oe = !!V.query && V.streamingState?.currentTurn?.accepted === !0,
                xe = !!V.adapter?.activeTurnId?.();
            if (z === "allow" && (oe || xe) && V.admissionCallback && !V.admissionInProgress) {
                V.pendingWake = !0, V.admissionInProgress = !0;
                let Re = V.admissionCallback;
                lt("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: w,
                    actorRunId: V.actorRunId
                }), Re().then(() => {
                    V.admissionInProgress = !1, V.wakeResolver?.()
                }, () => {
                    V.admissionInProgress = !1, V.wakeResolver?.()
                });
                return
            }
            if (V.status === "active" && V.currentAbortController)
                if (z === "force") {
                    let Re = zS(V, "immediate", F, "preempt");
                    Re === "immediate" ? lt("[session-manager] wake: forced preempt", {
                        sessionKey: w,
                        actorRunId: V.actorRunId,
                        preemptBoundary: F ?? "default"
                    }) : Re === "defer_accept" ? lt("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: w,
                        actorRunId: V.actorRunId
                    }) : Re === "defer_tool_result" ? lt("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: w,
                        actorRunId: V.actorRunId
                    }) : Re === "defer_tool_use" && lt("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: w,
                        actorRunId: V.actorRunId
                    })
                } else if (z === "allow") {
                let Re = zS(V, "soft", F, "preempt");
                Re === "defer_accept" ? lt("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: w,
                    actorRunId: V.actorRunId
                }) : Re === "defer_tool_use" ? lt("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: w,
                    actorRunId: V.actorRunId
                }) : Re === "defer_tool_result" ? lt("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: w,
                    actorRunId: V.actorRunId
                }) : Re === "immediate" && lt("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: w,
                    actorRunId: V.actorRunId
                })
            } else lt("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: w,
                actorRunId: V.actorRunId
            });
            V.pendingWake = !0, lt("[session-manager] wake marked pending", {
                sessionKey: w,
                actorRunId: V.actorRunId,
                status: V.status
            });
            return
        }
        let K = j(w, V?.origin);
        if (K.activeCount >= K.maxConcurrent) {
            let oe = K.wakeQueue.includes(w);
            oe || K.wakeQueue.push(w), lt("[session-manager] wake queued", {
                sessionKey: w,
                pool: K.name,
                activeCount: K.activeCount,
                maxConcurrent: K.maxConcurrent,
                alreadyQueued: oe,
                queuedSessions: K.wakeQueue.length
            });
            return
        }
        let fe = ZW(w);
        fe ? (lt("[session-manager] wake starting actor with inferred origin", {
            sessionKey: w,
            ...fe
        }), N(w, fe)) : (lt("[session-manager] wake starting actor", {
            sessionKey: w
        }), N(w))
    }

    function N(w, P) {
        let z = B.get(w),
            F = z?.attachedChannels ?? new Set,
            V = ++ee,
            K = {
                sessionKey: w,
                actorRunId: V,
                sdkSessionId: z?.sdkSessionId,
                sdkSessionIdVerified: z?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: z?.streamingAdapter ?? null,
                streamingGeneration: z?.streamingGeneration ?? 0,
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
                attachedChannels: F,
                origin: P?.origin ?? z?.origin ?? "channel",
                jobId: P?.jobId ?? z?.jobId,
                jobStateless: z?.jobStateless ?? !1,
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
                runtime: P?.runtime ?? z?.runtime ?? "claude",
                adapter: z?.adapter ?? null,
                adapterFacts: z?.adapterFacts,
                consecutiveConservativeRedrive: z?.consecutiveConservativeRedrive ?? !1
            };
        B.set(w, K);
        let fe = j(w, K.origin);
        fe.activeCount++, K.holdsPoolSlot = !0;
        let oe = G.get(w);
        if (oe && G.delete(w), OR(t, {
                session_key: w,
                display_name: oe,
                kind: K.origin === "job" ? "job" : K.origin === "system" ? "system" : w.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), Q("[session-manager] actor start", {
                sessionKey: w,
                actorRunId: V,
                sdkSessionId: K.sdkSessionId,
                origin: K.origin,
                jobId: K.jobId,
                pool: fe.name,
                activeCount: fe.activeCount,
                attachedChannels: K.attachedChannels.size,
                queuedSessions: fe.wakeQueue.length
            }), P?.preStart) {
            let xe = P.preStart;
            K.drainPromise = xe().catch(Re => Le("[session-manager] preStart failed", Re)).then(() => U(K))
        } else K.drainPromise = U(K)
    }
    async function U(w) {
        let {
            sessionKey: P
        } = w, z, F, V = 0, K = 0, fe = !1, oe = [], xe = 0, Re = !1, gt = !1, Xe = null, Ve = null, Pe;
        try {
            Pe = await u(P)
        } catch (Qe) {
            Z("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: P,
                error: Qe instanceof Error ? Qe.message : String(Qe)
            }), Pe = new Set
        }
        lt("[session-manager] drain loop begin", {
            sessionKey: P,
            actorRunId: w.actorRunId,
            origin: w.origin,
            jobId: w.jobId
        });
        try {
            if (!w.sdkSessionId && !w.pendingClear) {
                let Ye = await ht(t, P);
                Ye?.sdk_session_id && (w.sdkSessionId = Ye.sdk_session_id, Q("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: P,
                    sdkSessionId: Ye.sdk_session_id
                }))
            }
            if ((await ht(t, P))?.session_key || await rt(t, P, {
                    session_key: P
                }), w.origin === "job" && !w.jobId) {
                await a.init();
                let vr = (await a.listJobs()).find(Pn => Pn.session_key === P);
                vr ? (w.jobId = vr.id, Ee("[session-manager] recovered jobId from active jobs", {
                    sessionKey: P,
                    jobId: vr.id
                })) : Z("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: P
                })
            }
            let Qe, we, Fe = !1,
                yt, On, Lt, br, ty = !1;
            if (w.jobStateless = !1, w.origin === "job" && w.jobId) {
                let Ye = await a.getJob(w.jobId);
                if (Ve = Ye, Xe = Ye?.state.last_scheduled_at ?? null, Ye?.execution_cwd && (await Pye({
                        cwdRel: Ye.execution_context === "workspace" ? Ye.frontmatter.cwd_rel ?? null : null,
                        cwd: Ye.execution_cwd,
                        runtimeWorkspaceDir: Ye.runtime_workspace_dir,
                        context: Ye.execution_context
                    }), await Oe(Ye.execution_cwd), await rt(t, P, {
                        session_key: P,
                        cwd: Ye.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), Ye) {
                    Qe = AS(Ye.frontmatter.cron), we = Ye.frontmatter.cron;
                    let vr = Ye.frontmatter.stateless === !0;
                    if (vr && Ye.frontmatter.cron === "keepalive") throw new Error(AV);
                    Fe = vr, w.jobStateless = Fe, yt = Ye.frontmatter.model, On = Ye.frontmatter.effort, Lt = {
                        piExtensions: Ye.frontmatter.piExtensions,
                        piSkills: Ye.frontmatter.piSkills,
                        piConfigIssues: Ye.frontmatter.piConfigIssues
                    };
                    let Pn = Ye.frontmatter.runtime ?? void 0,
                        He = Pn ?? Co(),
                        Qr = Pn ? "explicit" : "default";
                    if (Ye.frontmatter.prompt_mode !== void 0 && He === "codex" && Z("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                            sessionKey: P,
                            jobId: w.jobId,
                            promptMode: Ye.frontmatter.prompt_mode,
                            runtimeSource: Qr
                        }), He === "codex") {
                        let $r = await m();
                        $r.ok ? w.runtime = "codex" : (w.runtime = "claude", Z("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: P,
                            jobId: w.jobId,
                            runtime_source: Qr,
                            reason: $r.reason
                        }))
                    } else if (He === "grok") {
                        w.runtime = "grok";
                        let $r = await b();
                        $r.ok || (br = $r.reason, Z("[session-manager] job requested grok but grok is unavailable", {
                            sessionKey: P,
                            jobId: w.jobId,
                            runtime_source: Qr,
                            reason: $r.reason
                        }))
                    } else He === "pi" ? w.runtime = "pi" : w.runtime = "claude"
                }
            } else if (w.origin === "channel") {
                let vr = (await ht(t, P))?.source_channel_id;
                if (vr) {
                    let Pn = await mo(t, vr).catch(() => null),
                        He = Pn?.channel_kind,
                        Qr = He ? await ys(t.channelConfigDir, He).catch(() => null) : null,
                        ln = Pn?.runtime ?? Qr?.runtime ?? void 0 ?? Co(),
                        ve = Pn?.runtime ? "explicit" : Qr?.runtime ? "inherited" : "default";
                    if (ln === "codex") {
                        let _e = await m();
                        _e.ok ? w.runtime = "codex" : (w.runtime = "claude", Z("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: P,
                            sourceChannelId: vr,
                            runtime_source: ve,
                            reason: _e.reason
                        }))
                    } else if (ln === "grok") {
                        w.runtime = "grok";
                        let _e = await b();
                        _e.ok || (br = _e.reason, Z("[session-manager] channel requested grok but grok is unavailable", {
                            sessionKey: P,
                            sourceChannelId: vr,
                            runtime_source: ve,
                            reason: _e.reason
                        }))
                    } else ln === "pi" ? w.runtime = "pi" : w.runtime = "claude"
                }
            }
            for (; w.status !== "ended" && J;) {
                let Ye = br;
                if (w.runtime !== "codex") {
                    for (;;) {
                        let Ae = w.streamingState,
                            pt = !!Ae && !Ae.closed && (Ae.cliTurnTentative !== null || Ae.currentTurn !== null);
                        if (!pt && !w.admissionInProgress) break;
                        if (w.pendingWake) {
                            w.pendingWake = !1;
                            continue
                        }
                        lt("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            cliBusy: pt,
                            admissionInProgress: w.admissionInProgress
                        }), await mJ(w, i)
                    }
                    if (!J || w.status === "ended") break
                }
                w.pendingClear && (w.sdkSessionId = void 0, w.pendingClear = !1, await rt(t, P, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }).catch(() => {}));
                let vr, Pn = null;
                w.origin === "job" && w.jobId && (ty ? Pn = await a.getJob(w.jobId).catch(() => null) : (ty = !0, Pn = Ve));
                let {
                    instructions: He,
                    missionContent: Qr
                } = await YEe(t, P, w, Pn), $r = await ht(t, P), ln = await runInstructionsFingerprintGuard(t, P, He, w.runtime, {
                    instructions_fingerprint: $r?.instructions_fingerprint,
                    mission_fingerprint: $r?.mission_fingerprint,
                    schema_version: $r?.schema_version,
                    sdk_session_id: $r?.sdk_session_id,
                    board_layer_hash: $r?.board_layer_hash,
                    instructions_nonboard_fingerprint: $r?.instructions_nonboard_fingerprint
                }, w.origin === "job" && w.jobId ? {
                    jobId: w.jobId
                } : void 0);
                ln.clearedSdkSessionId && (w.sdkSessionId = void 0), ln.gate2Fired && w.runtime === "claude" && (ln.boardOnlyDrift ? w.streamingState && !w.streamingState.closed ? Q("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: P,
                    board_layer_hash: ln.boardLayerHash
                }) : Q("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: P,
                    board_layer_hash: ln.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: P,
                    reason: "instructions_drift"
                })), w.origin === "job" && w.jobId && (Qr !== void 0 ? vr = {
                    content: Qr,
                    jobId: w.jobId,
                    cron: Pn?.frontmatter.cron ?? "",
                    stateless: Fe,
                    acceptance: Pn?.frontmatter.acceptance,
                    model: Pn ? Pn.frontmatter.model : yt,
                    effort: Pn ? Pn.frontmatter.effort : On,
                    sdkConfig: Dye(Pn?.frontmatter)
                } : Z("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: P,
                    jobId: w.jobId
                })), w.status !== "ended" && (w.status = "active"), w.idleSince = void 0;
                let ve = new Set,
                    _e = Date.now(),
                    ae = new AbortController;
                w.currentAbortController = ae;
                let Ze;
                try {
                    let Ae = [...w.origin === "system" ? [] : [s_e, y_e], g_e, V_e];
                    w.origin === "channel" && (Ae.push(wke), Ae.push(cc));
                    let pt = w.origin === "job" ? "job" : w.origin === "system" ? "system" : "foreground",
                        Or = 0,
                        pn = _Ee();
                    if (w.admissionCallback = async () => {
                            try {
                                await fR(t, P);
                                let dt = await lb(t, P);
                                if (dt.length === 0) return;
                                await pR(t, P, dt);
                                let it = {},
                                    bn = await batchDrainItems(t, dt, {
                                        fallbackBatchSize: bH,
                                        mergeWindowMs: vH,
                                        perf: it
                                    }),
                                    Bn = await ht(t, P),
                                    cr = Rg(t, P, Bn ?? void 0),
                                    nr = [],
                                    Ar = [];
                                for (let et of bn.items) {
                                    if (!et.eventId) continue;
                                    if (w.inflightEventIds.has(et.eventId)) {
                                        Ar.push(et.eventId);
                                        continue
                                    }
                                    if (await Um(t, et.eventId)) {
                                        Ar.push(et.eventId);
                                        continue
                                    }
                                    let Gt = et.createdAt ? {
                                            notAfter: et.createdAt
                                        } : void 0,
                                        Ot = bn.events.get(et.eventId) ?? await Md(t, et.eventId, Gt);
                                    if (!Ot) {
                                        Z(`[session-manager] mailbox event unresolved: session_key=${P} event_id=${et.eventId} not_after=${Gt?.notAfter??"none"} item_file=${et.file??"none"}`);
                                        continue
                                    }
                                    nr.push({
                                        item: et,
                                        event: Ot,
                                        prompt: RO(Ot, P)
                                    })
                                }
                                if (nr.length === 0) {
                                    Ar.length > 0 && await Ao(t, P, Ar);
                                    return
                                }
                                let Cn = await wH(t, P, {
                                        allowedTools: Ae,
                                        tools: pn,
                                        additionalDirectories: [t.memoryDir]
                                    }, nr, cr, {
                                        pendingGatewayNotice: Bn?.pending_gateway_notice,
                                        pendingInterruptedContext: Bn?.pending_interrupted_context,
                                        pendingSkipRewind: Bn?.pending_skip_rewind,
                                        lastEventAtWatermark: Bn?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, it, et => et),
                                    Ro = [...Ar, ...nr.map(et => et.item.eventId).filter(et => !!et)];
                                if (w.runtime === "codex" || w.runtime === "grok" || w.runtime === "pi") {
                                    let et = w.adapter?.steerActiveTurn,
                                        wr = Cn.coalescedPromptText.trim(),
                                        Gt = w.adapter?.activeTurnId?.(),
                                        Ot = w.adapter?.activeTurnStartedAt?.(),
                                        ei = !1;
                                    if (Gt && Ot !== void 0)
                                        if (w.adapter?.activeTurnSkipObserved?.() === !0) ei = !0;
                                        else {
                                            let ha = await ht(t, P).catch(() => null);
                                            if (ha === null) ei = !0, Z("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: P
                                            });
                                            else {
                                                let gi = Date.parse(ha.pending_skip_rewind?.skipped_at ?? "");
                                                ei = Number.isFinite(gi) && gi >= Ot
                                            }
                                        } if (!!et && !!Gt && !Cn.isNotifyOnly && !w.liveTurnNotifyOnly && wr.length > 0 && !ei && et && Gt) {
                                        let Io = Cn.batchEventIds.filter(gi => !w.inflightEventIds.has(gi));
                                        for (let gi of Io) w.inflightEventIds.add(gi);
                                        if (await et(wr, Gt, Cn.attachments).catch(() => !1)) {
                                            await Ao(t, P, Ro);
                                            for (let gi of Io) w.inflightEventIds.delete(gi);
                                            Q("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: P,
                                                admittedItems: nr.length,
                                                batchEventIds: Cn.batchEventIds
                                            })
                                        } else {
                                            for (let gi of Io) w.inflightEventIds.delete(gi);
                                            w.pendingWake = !0, Q("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: P,
                                                batchEventIds: Cn.batchEventIds
                                            })
                                        }
                                    } else w.pendingWake = !0, Q("[session-manager] admission callback: codex steer not attempted, redraining", {
                                        sessionKey: P,
                                        admittedItems: nr.length,
                                        batchEventIds: Cn.batchEventIds,
                                        liveTurn: !!Gt,
                                        notifyOnlyBatch: Cn.isNotifyOnly,
                                        sealedBySkip: ei,
                                        liveTurnNotifyOnly: w.liveTurnNotifyOnly,
                                        emptyText: wr.length === 0
                                    });
                                    return
                                }
                                let io = w.streamingState;
                                if (!io || io.closed) return;
                                let nn = io.currentTurn,
                                    iu = !!Cn.attachments && Cn.attachments.length > 0,
                                    Wt = Cn.coalescedPromptText.trim();
                                if (!!nn && nn.accepted && !nn.skipCalled && !iu && !Cn.isNotifyOnly && !w.liveTurnNotifyOnly && Wt.length > 0) {
                                    let et = w.pendingSteer;
                                    if (et && !et.settled && et.spawningTurn === nn) {
                                        let wr = Cn.batchEventIds.filter(Gt => !w.inflightEventIds.has(Gt));
                                        for (let Gt of wr) w.inflightEventIds.add(Gt);
                                        et.steerText = `${et.steerText}
${Wt}`, et.eventIds.push(...Ro), et.claimedEventIds.push(...wr), et.requeueLines.push(...nr.map(Gt => Gt.item.line)), et.requeueEventIds.push(...nr.map(Gt => Gt.item.eventId)), et.processedEventIds.push(...Ar), Q("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: P,
                                            admittedItems: nr.length,
                                            batchEventIds: Cn.batchEventIds
                                        });
                                        return
                                    }
                                    if (!et) {
                                        let wr = Cn.batchEventIds.filter(Ot => !w.inflightEventIds.has(Ot));
                                        for (let Ot of wr) w.inflightEventIds.add(Ot);
                                        let Gt = {
                                            steerText: Wt,
                                            eventIds: [...Ro],
                                            claimedEventIds: [...wr],
                                            enqueueAsNewTurn: async () => {
                                                let Ot = [];
                                                for (let js = 0; js < Gt.requeueLines.length; js += 1) {
                                                    let Io = Gt.requeueLines[js],
                                                        ha = Gt.requeueEventIds[js];
                                                    try {
                                                        await Xs(t, P, Io), Ot.push(ha)
                                                    } catch (gi) {
                                                        Z("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: P,
                                                            eventId: ha,
                                                            error: gi instanceof Error ? gi.message : String(gi)
                                                        })
                                                    }
                                                }
                                                let ei = [...Ot, ...Gt.processedEventIds];
                                                if (ei.length > 0) try {
                                                    await Ao(t, P, ei)
                                                } catch (js) {
                                                    Q("[session-manager] steer fallback markDone error", {
                                                        sessionKey: P,
                                                        error: String(js)
                                                    })
                                                }
                                                for (let js of Gt.claimedEventIds) w.inflightEventIds.delete(js);
                                                w.pendingWake = !0, Q("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: P,
                                                    eventIds: Gt.eventIds,
                                                    requeued: Ot.length,
                                                    requeueFailed: Gt.requeueLines.length - Ot.length
                                                })
                                            },
                                            spawningTurn: nn,
                                            requeueLines: nr.map(Ot => Ot.item.line),
                                            requeueEventIds: nr.map(Ot => Ot.item.eventId),
                                            processedEventIds: [...Ar],
                                            settled: !1
                                        };
                                        w.pendingSteer = Gt, Q("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: P,
                                            admittedItems: nr.length,
                                            batchEventIds: Cn.batchEventIds
                                        });
                                        return
                                    }
                                }
                                w.pendingWake = !0, w.wakeResolver?.()
                            } catch (dt) {
                                Q("[session-manager] admission callback error", {
                                    sessionKey: P,
                                    error: String(dt)
                                })
                            }
                        }, w.runtime === "codex" && !w.adapter) {
                        let dt = (await ht(t, P))?.cwd;
                        dt && await ensureAgentsMdSymlink(dt).catch(() => {}), w.adapter = f({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: yt,
                            dynamicTools: wA({
                                paths: t,
                                sessionKey: P,
                                bus: n,
                                sessionContextKind: pt,
                                notifyDepth: Or,
                                jobScheduleType: Qe,
                                callerJobCron: we,
                                getSessionStatus: it => B.get(it)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            })
                        })
                    }
                    if (w.runtime === "grok" && !w.adapter && !Ye) {
                        let dt = await ht(t, P).catch(() => null);
                        w.adapter = g({
                            cwd: dt?.cwd ?? t.workDir,
                            sdkSessionId: dt?.sdk_session_id,
                            mcpServerFactory: () => Kg(t, {
                                sessionKey: P,
                                bus: n,
                                sessionContextKind: pt,
                                notifyDepth: Or,
                                jobScheduleType: Qe,
                                callerRuntime: w.runtime,
                                callerJobCron: we,
                                getSessionStatus: it => B.get(it)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text: it
                            }) => S(P, it)
                        })
                    }
                    if (w.runtime === "pi" && !Ye) {
                        let dt = await ht(t, P).catch(() => null),
                            it = tS(),
                            {
                                settingsSeed: bn,
                                defaultProjectTrust: Bn,
                                unknownKeys: cr,
                                readFailed: nr
                            } = nS(it);
                        cr.length > 0 && Z("[session-manager] pi settings keys not classified (SDK bump gate)", {
                            sessionKey: P,
                            keys: cr
                        });
                        let Ar = !1,
                            Cn = Lt ? null : await Ga(t, P).catch(() => (Ar = !0, null)),
                            Ro = Lt ? await Za(t, {
                                channel_kind: "job"
                            }).catch(() => (Ar = !0, null)) : null,
                            io = Lt ?? Cn;
                        io?.piConfigIssues?.length && Z("[session-manager] invalid pi.* config values ignored (defaults apply)", {
                            sessionKey: P,
                            issues: io.piConfigIssues
                        });
                        let nn = (dt?.model_runtime === "pi" ? dt.model : void 0) ?? (Pn ? Pn.frontmatter.model : yt) ?? Mw(Cn ?? Ro, "pi")?.model,
                            iu = io?.piExtensions ?? "all",
                            Wt = io?.piSkills ?? "all",
                            Nn = dt?.effort ?? (Pn ? Pn.frontmatter.effort : On) ?? jw(Cn ?? Ro, "pi")?.effort,
                            et = bke({
                                model: nn,
                                thinkingLevel: Nn,
                                settingsSeed: bn,
                                defaultProjectTrust: Bn,
                                extensions: iu,
                                skills: Wt,
                                instructionsFingerprint: _ke(Eo(P) === "channel", ln)
                            }),
                            wr = !nr && !Ar;
                        if (wr || Z("[session-manager] pi construction facts unread, keeping the live worker", {
                                sessionKey: P,
                                seedReadFailed: nr,
                                configReadFailed: Ar
                            }), w.adapter && w.adapterFacts !== et && wr) {
                            let Gt = w.adapter;
                            w.adapter = null, w.adapterFacts = void 0, Promise.resolve(Gt.shutdown()).catch(Ot => {
                                Z("[session-manager] stale pi adapter shutdown failed", {
                                    sessionKey: P,
                                    error: String(Ot)
                                })
                            })
                        }
                        if (!w.adapter)
                            if (!nn) Ye = "pi binds its model when the worker is built, and this session has none. Send `/model <provider>/<modelId>` (channel sessions), or set `model: <provider>/<modelId>` in the job frontmatter, then send the message again.";
                            else {
                                let Gt = Uc.join(Jn(t, P), "pi"),
                                    Ot = {
                                        session_context_kind: pt
                                    };
                                w.adapter = y({
                                    cwd: dt?.cwd ?? t.workDir,
                                    sdkSessionId: dt?.sdk_session_id ?? Rgt(),
                                    sessionDir: Gt,
                                    agentDir: it,
                                    authPath: Uc.join(it, "auth.json"),
                                    modelsPath: Uc.join(it, "models.json"),
                                    modelsStorePath: Uc.join(Gt, "models-store.json"),
                                    settingsSeed: bn,
                                    resources: {
                                        extensions: iu,
                                        skills: Wt,
                                        default_project_trust: Bn
                                    },
                                    model: nn,
                                    thinkingLevel: Nn,
                                    workerCommand: eS(),
                                    env: {
                                        [vC]: t.daemonSocketPath,
                                        [wC]: kC({
                                            session_key: P,
                                            job_cron: we,
                                            job_schedule_type: Qe,
                                            ...Ot
                                        }),
                                        [SC]: JSON.stringify(Ot)
                                    },
                                    onToolEnd: ei => xke(t, P, ei),
                                    logDebug: ei => Ee(ei, {
                                        sessionKey: P
                                    }),
                                    logWarn: ei => Z(ei, {
                                        sessionKey: P
                                    })
                                }), w.adapterFacts = et
                            }
                    }
                    if (!J || w.status === "ended") break;
                    let An = $e(w);
                    Ze = await drainSessionMailbox(t, P, {
                        sdk: An,
                        usesStreamingAdapter: An === w.streamingAdapter,
                        bus: n,
                        abortController: ae,
                        runtime: w.runtime,
                        runtimeUnavailableReason: Ye,
                        excludeEventIds: i0e(w),
                        actorSpawnedAt: w.spawnedAt,
                        actorLastTurnCompletedAt: w.lastTurnCompletedAt,
                        getStreamGeneration: () => w.streamingGeneration,
                        holdInputOpenForBackgroundAgents: w.runtime === "claude" && w.origin !== "channel",
                        jobContext: vr,
                        memoryBoard: He.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: He.memoryBoard
                        } : void 0,
                        boardHash: He.memoryBoard ? ln.boardLayerHash : void 0,
                        onBatchContext: dt => {
                            if (Or = dt.maxNotifyDepth, dt.eventIds)
                                for (let it of dt.eventIds) w.inflightEventIds.add(it)
                        },
                        mcpServersFactory: () => ({
                            aladuo: Kg(t, {
                                sessionKey: P,
                                bus: n,
                                sessionContextKind: pt,
                                notifyDepth: Or,
                                jobScheduleType: Qe,
                                callerRuntime: w.runtime,
                                callerJobCron: we,
                                getSessionStatus: dt => B.get(dt)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            })
                        }),
                        allowedTools: Ae,
                        tools: pn,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: o,
                        onSdkTurnStarted: dt => {
                            w.liveTurnNotifyOnly = dt.notifyOnly, V += 1;
                            let it = !fe;
                            if (fe = V > K, it && fe && w.origin === "job" && w.jobId) {
                                let bn = w.jobId;
                                oe.push(a.updateState(bn, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: Xe
                                }).catch(Bn => {
                                    Z("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: P,
                                        jobId: bn,
                                        error: Bn instanceof Error ? Bn.message : String(Bn)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            K += 1;
                            let dt = fe && V <= K;
                            if (fe = V > K, dt && w.origin === "job" && w.jobId) {
                                let it = w.jobId;
                                oe.push(a.updateState(it, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: Xe
                                }).catch(bn => {
                                    Z("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: P,
                                        jobId: it,
                                        error: bn instanceof Error ? bn.message : String(bn)
                                    })
                                }))
                            }
                        },
                        onStream: (dt, it, bn) => {
                            w.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: P,
                                chunk: dt,
                                isSidechain: it,
                                anchorEventId: bn
                            })
                        },
                        onExecutionEvent: (dt, it) => {
                            dt.type === "tool_use" && (w.isStreaming = !1, w.activeToolCalls.set(dt.toolUseId, {
                                toolName: dt.toolName,
                                startedAtMs: Date.now()
                            }), w.pendingPreempt && w.pendingPreemptBoundary === "tool_use" && (w.pendingPreempt = !1, w.pendingPreemptBoundary = null, pJ(w))), dt.type === "tool_result" && (w.activeToolCalls.delete(dt.toolUseId), w.pendingPreempt && w.pendingPreemptBoundary === "tool_result" && w.activeToolCalls.size === 0 && (w.pendingPreempt = !1, w.pendingPreemptBoundary = null, pJ(w)));
                            let bn = mEe(dt);
                            if (bn && ve.has(bn)) return;
                            bn && ve.add(bn);
                            let Bn = hEe(dt);
                            if (Bn) {
                                let cr = dt.type === "tool_use" || dt.type === "tool_result" ? dt.isSidechain : void 0;
                                n.emit("session.execution", {
                                    sessionKey: P,
                                    event: Bn,
                                    anchorEventId: it,
                                    isSidechain: cr
                                })
                            }
                        }
                    })
                } finally {
                    w.admissionCallback = null, w.admissionInProgress || w.inflightEventIds.clear(), w.currentAbortController === ae && (w.currentAbortController = null), w.isStreaming = !1, w.activeToolCalls.clear(), w.pendingPreempt = !1, w.pendingPreemptBoundary = null, w.pendingPreemptReason = null
                }
                if (lt("[session-manager] drain result", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        processed: Ze.processed,
                        skipped: Ze.skipped,
                        lockAcquired: Ze.lockAcquired,
                        outboxRecords: Ze.outboxRecords?.length ?? (Ze.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - _e
                    }), xe += Ze.processed, Re = Ze.mergeTransientFailure === !0, Ze.cancelled && (gt = !0), Ze.processed > 0 && (w.lastTurnCompletedAt = Date.now(), await No(t, P, "last_error").catch(() => {})), Ze.compacted && w.runtime === "claude" && w.streamingState && !w.streamingState.closed) {
                    let Ae = He.memoryBoard ? ln.boardLayerHash : void 0;
                    w.spawnBoardHash !== Ae && (w.streamingState.needsRecreation = !0, wt("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: P,
                        reason: "board-refresh(B4)",
                        generation: w.streamingGeneration,
                        spawn_board_hash: w.spawnBoardHash ? w.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: Ae ? Ae.slice(0, 12) : null
                    }))
                }
                if (w.pendingClear) w.sdkSessionId = void 0, w.pendingClear = !1, await rt(t, P, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }).catch(() => {}), Q("[session-manager] applied pending clear after drain", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                });
                else {
                    let Ae = await ht(t, P);
                    if (Ae?.sdk_session_id) {
                        let pt = !w.sdkSessionId,
                            Or = w.sdkSessionId !== Ae.sdk_session_id;
                        w.sdkSessionId = Ae.sdk_session_id, (pt || Or) && Q("[session-manager] sdk session bound", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            sdkSessionId: w.sdkSessionId,
                            isNewSession: pt
                        })
                    }
                }
                if (Ze.lastReplyText && (F = Ze.lastReplyText), Ze.outboxRecords && Ze.outboxRecords.length > 0) {
                    lt("[session-manager] emitting outbox records", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        count: Ze.outboxRecords.length
                    });
                    for (let Ae of Ze.outboxRecords) n.emit("session.output", {
                        sessionKey: Ae.session_key,
                        record: Ae
                    })
                } else Ze.lastOutboxRecord ? (lt("[session-manager] emitting single outbox record", {
                    sessionKey: P,
                    actorRunId: w.actorRunId,
                    recordId: Ze.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: P,
                    record: Ze.lastOutboxRecord
                })) : w.origin === "channel" && Ze.processed > 0 && !Ze.cancelled && !Ze.sdkTurns?.length && (lt("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey: P,
                    actorRunId: w.actorRunId,
                    turnSkipped: Ze.turnSkipped === !0
                }), n.emit("session.stream_end", {
                    sessionKey: w.sessionKey,
                    reason: Ze.turnSkipped === !0 ? "skipped" : "interrupted"
                }));
                if (w.origin === "channel")
                    for (let Ae of Ze.sdkTurns ?? []) !Ae.consumed || Ae.hadOutput || (lt("[session-manager] silent turn, emitting stream_end", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        anchorEventId: Ae.anchorEventId,
                        turnSkipped: Ae.skipped
                    }), n.emit("session.stream_end", {
                        sessionKey: w.sessionKey,
                        reason: Ae.skipped ? "skipped" : "interrupted",
                        anchorEventId: Ae.anchorEventId
                    }));
                if (Ze.processed === 0) {
                    if (w.origin === "job" || w.origin === "system") {
                        lt("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            origin: w.origin,
                            jobId: w.jobId
                        });
                        break
                    }
                    if (w.pendingWake) {
                        w.pendingWake = !1, lt("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: P,
                            actorRunId: w.actorRunId
                        });
                        continue
                    }
                    if (w.status = "idle", w.idleSince = new Date().toISOString(), w.pendingWake) {
                        w.pendingWake = !1, lt("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: P,
                            actorRunId: w.actorRunId
                        });
                        continue
                    }
                    if (lt("[session-manager] idle", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            attachedChannels: w.attachedChannels.size
                        }), w.holdsPoolSlot) {
                        let pt = j(P, w.origin);
                        pt.activeCount--, w.holdsPoolSlot = !1, lt("[session-manager] released pool slot (idle)", {
                            sessionKey: P,
                            pool: pt.name,
                            activeCount: pt.activeCount
                        }), L(pt)
                    }
                    let Ae = !1;
                    for (;;) {
                        let pt = !1,
                            Or = !1;
                        for (; w.status === "idle";) {
                            if (w.pendingWake) {
                                w.pendingWake = !1, pt = !0;
                                break
                            }
                            if (!J) {
                                Or = !0;
                                break
                            }
                            if (await mJ(w, i) || w.status !== "idle") {
                                pt = !0;
                                break
                            }
                            if (w.attachedChannels.size > 0) {
                                lt("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey: P,
                                    actorRunId: w.actorRunId,
                                    attachedChannels: w.attachedChannels.size
                                }), w.streamingState && !w.streamingState.closed && wt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey: P,
                                    generation: w.streamingGeneration,
                                    sdk_session_id: w.sdkSessionId ?? null
                                }), await Zf(w), LA(w);
                                continue
                            }
                            break
                        }
                        if (Or) {
                            Ae = !0;
                            break
                        }
                        if (!pt && w.status === "idle") {
                            lt("[session-manager] idle timeout, no attachments, exiting", {
                                sessionKey: P,
                                actorRunId: w.actorRunId
                            }), w.streamingState && !w.streamingState.closed && wt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                sessionKey: P,
                                generation: w.streamingGeneration,
                                sdk_session_id: w.sdkSessionId ?? null
                            }), Ae = !0;
                            break
                        }
                        if (pt && !w.holdsPoolSlot) {
                            let pn = j(P, w.origin);
                            if (pn.activeCount >= pn.maxConcurrent) {
                                pn.wakeQueue.includes(P) || pn.wakeQueue.unshift(P), lt("[session-manager] woken idle actor re-queued (pool full)", {
                                    sessionKey: P,
                                    pool: pn.name,
                                    activeCount: pn.activeCount
                                }), w.pendingWake = !1;
                                continue
                            }
                            pn.activeCount++, w.holdsPoolSlot = !0, lt("[session-manager] re-acquired pool slot (woken)", {
                                sessionKey: P,
                                pool: pn.name,
                                activeCount: pn.activeCount
                            })
                        }
                        break
                    }
                    if (Ae) break
                }
            }
        } catch (Qe) {
            Le(`[session-manager] error in drain loop for ${P}:`, Qe), z = Qe, await rt(t, P, {
                last_error: {
                    message: Qe instanceof Error ? Qe.message : String(Qe),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            await Zf(w), w.currentAbortController = null, w.streamingAdapter = null, w.isStreaming = !1, w.activeToolCalls.clear(), w.pendingPreempt = !1, w.pendingPreemptBoundary = null, w.pendingPreemptReason = null, await LA(w);
            let Qe = j(P, w.origin);
            if (w.holdsPoolSlot && (Qe.activeCount--, w.holdsPoolSlot = !1), w.origin === "job" && w.jobId) {
                oe.length > 0 && await Promise.allSettled(oe);
                try {
                    await c(w, {
                        runStarted: fe,
                        cancelled: gt,
                        processedCount: xe,
                        claimCursor: Xe,
                        error: z,
                        resultText: F,
                        jobSnapshot: Ve
                    })
                } finally {
                    w.status = "ended"
                }
            } else w.status = "ended";
            if (w.pendingWake = !1, J && kgt(Jn(t, P)) && !or(P)) {
                let Fe = await l(P, Pe);
                Fe === "fresh" ? (w.consecutiveConservativeRedrive = !1, lt("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                }), se(P, {
                    preempt: "never"
                })) : Fe === "conservative" || Re ? w.consecutiveConservativeRedrive ? Z("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                }) : (w.consecutiveConservativeRedrive = !0, lt("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                }), se(P, {
                    preempt: "never"
                })) : w.consecutiveConservativeRedrive = !1
            }
            Q("[session-manager] actor end", {
                sessionKey: P,
                actorRunId: w.actorRunId,
                sdkSessionId: w.sdkSessionId,
                pool: Qe.name,
                activeCount: Qe.activeCount,
                origin: w.origin,
                jobId: w.jobId,
                attachedChannels: w.attachedChannels.size,
                queuedSessions: Qe.wakeQueue.length
            }), L(Qe)
        }
    }

    function q(w, P) {
        if (!J) return;
        if (or(P)) {
            lt("[session-manager] skip job spawn, session is being archived", {
                jobId: w,
                sessionKey: P
            });
            return
        }
        let z = B.get(P);
        if (z && z.status !== "ended") {
            lt("[session-manager] skip duplicate job spawn", {
                jobId: w,
                sessionKey: P,
                actorStatus: z.status
            });
            return
        }
        if ($.activeCount >= $.maxConcurrent) {
            $.wakeQueue.includes(P) || $.wakeQueue.push(P), z ? (z.origin = "job", z.jobId = w) : B.set(P, {
                sessionKey: P,
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
        N(P, {
            origin: "job",
            jobId: w
        }), (async () => {
            try {
                let F = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: w
                    },
                    session_key: P,
                    payload: {
                        job_id: w
                    }
                });
                await atomicAppendEvent(t, F), n.emit("job.spawned", {
                    jobId: w,
                    sessionKey: P
                })
            } catch (F) {
                Le("[session-manager] error recording job spawn", F)
            }
        })()
    }
    async function Y(w, P) {
        let F = (ce.get(w) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (lr(w) !== "channel") return;
            let V = OS(w),
                K = new Date().toISOString(),
                fe = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: V,
                        name: "session-manager"
                    },
                    session_key: w,
                    payload: {
                        session_key: w,
                        channel_kind: V,
                        channel_id: P,
                        attached_at: K
                    }
                });
            await atomicAppendEvent(t, fe)
        }).finally(() => {
            ce.get(w) === F && ce.delete(w)
        });
        ce.set(w, F), await F
    }

    function Se() {
        for (let w of B.values()) w.status = "ended", LA(w), w.streamAbortController && !w.streamAbortController.signal.aborted && w.streamAbortController.abort(), typeof w.query?.close == "function" && w.query.close(), w.query = null, w.streamAbortController = null, w.currentAbortController && !w.currentAbortController.signal.aborted && w.currentAbortController.abort(), w.currentAbortController = null, w.wakeResolver && (w.wakeResolver(), w.wakeResolver = null)
    }
    async function ye() {
        if (ce.size === 0) return;
        let w = Array.from(ce.values()),
            P = !1,
            z = new Promise(F => setTimeout(() => {
                P = !0, F()
            }, 3e4));
        await Promise.race([Promise.allSettled(w).then(() => {}), z]), P && Z("[session-manager] shutdown abandoned pending attach writes after the fallback", {
            pending: w.length
        })
    }
    async function Be(w) {
        let P;
        try {
            P = xgt(Uc.join(Igt(), "aladuo-pi-catalog-"));
            let z = tS(),
                {
                    settingsSeed: F,
                    defaultProjectTrust: V
                } = nS(z),
                K = await Ga(t, w).catch(() => null),
                fe = await ht(t, w).catch(() => null),
                oe = await mke({
                    cwd: fe?.cwd ?? t.workDir,
                    agentDir: z,
                    authPath: Uc.join(z, "auth.json"),
                    modelsPath: Uc.join(z, "models.json"),
                    modelsStorePath: Uc.join(P, "models-store.json"),
                    settingsSeed: F,
                    resources: {
                        extensions: K?.piExtensions ?? "all",
                        default_project_trust: V
                    },
                    workerCommand: eS(),
                    logDebug: xe => Ee("[pi-catalog] " + xe)
                });
            return oe.length > 0 ? oe : void 0
        } catch (z) {
            Z("[session-manager] pi model catalog failed", {
                sessionKey: w,
                error: String(z)
            });
            return
        } finally {
            try {
                P && Egt(P, {
                    recursive: !0,
                    force: !0
                })
            } catch {}
        }
    }
    return {
        async start() {
            if (!J) {
                J = !0, n.on("session.wake", le), n.on("shutdown", M), n.on("session.streaming_invalidated", ue);
                try {
                    let w = await rehydrateSessionState(t);
                    for (let P of w) {
                        if (or(P)) {
                            lt("[session-manager] skip hydrating session being archived", {
                                sessionKey: P
                            });
                            continue
                        }
                        let F = (await ht(t, P))?.cwd;
                        if (F && !vEe(F)) {
                            Z("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: P,
                                cwd: F
                            });
                            continue
                        }
                        se(P, {
                            preempt: "never"
                        })
                    }
                } catch (w) {
                    Le("[session-manager] error hydrating sessions:", w)
                }
                Q("[session-manager] started", {
                    channelActive: C.activeCount,
                    channelQueued: C.wakeQueue.length,
                    jobActive: $.activeCount,
                    jobQueued: $.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!J) return;
            J = !1, n.off("session.wake", le), n.off("shutdown", M), n.off("session.streaming_invalidated", ue), Se();
            let w = Array.from(B.values()).map(P => P.drainPromise).filter(P => P !== null);
            if (w.length > 0) {
                let P = Array.from(B.values()).filter(V => V.drainPromise !== null),
                    z = !1,
                    F = new Promise(V => setTimeout(() => {
                        z = !0, V()
                    }, 3e4));
                await Promise.race([Promise.all(w), F]), z && Z("[session-manager] shutdown abandoned running drains after the fallback", {
                    sessions: P.map(V => V.sessionKey),
                    runtimes: P.map(V => V.runtime)
                })
            }
            await ye(), B.clear(), C.wakeQueue.length = 0, C.activeCount = 0, $.wakeQueue.length = 0, $.activeCount = 0, Q("[session-manager] stopped")
        },
        wakeSession: se,
        getActor(w) {
            return B.get(w)
        },
        activeCount() {
            return C.activeCount + $.activeCount
        },
        activeChannelCount() {
            return C.activeCount
        },
        activeJobCount() {
            return $.activeCount
        },
        isRunning() {
            return J
        },
        attachChannel(w, P) {
            let z = B.get(w);
            z || (z = {
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
            }, B.set(w, z)), z.attachedChannels.add(P), lt("[session-manager] channel attached", {
                sessionKey: w,
                channelId: P,
                totalAttachments: z.attachedChannels.size
            }), Y(w, P).catch(F => {
                Z("[session-manager] failed to emit channel.attached event", {
                    sessionKey: w,
                    channelId: P,
                    error: String(F)
                })
            })
        },
        detachChannel(w, P) {
            let z = B.get(w);
            z && (z.attachedChannels.delete(P), lt("[session-manager] channel detached", {
                sessionKey: w,
                channelId: P,
                remainingAttachments: z.attachedChannels.size
            }), z.attachedChannels.size === 0 && z.status === "idle" && z.wakeResolver && (z.wakeResolver(), z.wakeResolver = null))
        },
        hasAttachedChannels(w) {
            let P = B.get(w);
            return P ? P.attachedChannels.size > 0 : !1
        },
        spawnJobSession(w, P) {
            q(w, P)
        },
        async interruptSession(w) {
            if (!J) return {
                interrupted: !1,
                reason: "not_running"
            };
            let P = B.get(w);
            return P ? !P.query && (!P.currentAbortController || P.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : P.streamAbortController && !P.streamAbortController.signal.aborted ? (Q("[session-manager] interrupt: stopping streaming session", {
                sessionKey: w,
                actorRunId: P.actorRunId
            }), await Zf(P, "cancel-interrupt", "user-cancel"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (zS(P, "immediate", void 0, "user-cancel") === "immediate" && Q("[session-manager] interrupt requested", {
                sessionKey: w,
                actorRunId: P.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(w) {
            if (!J) return {
                cleared: !1,
                reason: "not_running"
            };
            let P = B.get(w),
                z = P?.sdkSessionId;
            if (P && (P.pendingClear = !0, P.sdkSessionId = void 0, P.sdkSessionIdVerified = !1, P.pendingInterruptMarker = null), P?.streamAbortController && !P.streamAbortController.signal.aborted ? await Zf(P, "clear") : P?.currentAbortController && !P.currentAbortController.signal.aborted && zS(P, "immediate"), await rt(t, w, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }), (P?.runtime === "pi" || P?.runtime === "grok") && P.adapter) {
                let F = P.adapter;
                P.adapter = null, P.adapterFacts = void 0, await Promise.resolve(F.shutdown()).catch(V => {
                    Z("[session-manager] runtime adapter shutdown on clear failed", {
                        sessionKey: w,
                        runtime: P.runtime,
                        error: String(V)
                    })
                })
            }
            return Q("[session-manager] SDK session cleared", {
                sessionKey: w,
                actorRunId: P?.actorRunId,
                previousSessionId: z
            }), {
                cleared: !0,
                previousSessionId: z
            }
        },
        async getSessionModelView(w, P) {
            let z = B.get(w),
                F = await ht(t, w).catch(() => null),
                V = await I(w, z),
                K = {
                    runtime: V,
                    storedModel: F?.model,
                    hasLiveQuery: !!z?.query
                },
                fe = await E(w, P).catch(Re => (Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: w,
                    error: Re instanceof Error ? Re.message : String(Re)
                }), null)),
                oe = Mw(fe, V);
            if (oe && (K.configModel = {
                    ...oe
                }), F?.last_served_model && (K.lastServedModel = F.last_served_model), V === "pi") return K.piProviders = await Be(w), K;
            let xe = z?.query;
            if (xe && typeof xe.supportedModels == "function") try {
                K.available = _(await xe.supportedModels())
            } catch {}
            try {
                if (fe && V === "claude") {
                    let Re = Object.entries(fe.claudeModelProfiles ?? {}).map(([Ve, Pe]) => {
                        let Qe = lSe(Pe.baseUrl);
                        return {
                            model: Ve,
                            contextWindow: Pe.cap,
                            source: Pe.source,
                            ...Qe ? {
                                endpointHost: Qe
                            } : {}
                        }
                    });
                    Re.length > 0 && (K.profiles = Re.sort((Ve, Pe) => Ve.model.localeCompare(Pe.model)));
                    let gt = Object.entries(fe.claudeModelAliases ?? {}).map(([Ve, Pe]) => ({
                        tier: Ve,
                        model: Pe.model,
                        source: Pe.source
                    })).sort((Ve, Pe) => Ve.tier.localeCompare(Pe.tier));
                    if (gt.length > 0 && (K.aliases = gt), !K.storedModel && !K.configModel) {
                        let Ve = await xg({
                                model: null,
                                cwd: Rg(t, w, F ?? void 0).cwd,
                                daemonEnv: process.env,
                                mergedCatalog: fe.claudeModelProfiles ?? {},
                                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                                issues: fe.claudeModelProfileIssues
                            }),
                            Pe = Ve.modelOrigin;
                        Ve.kind === "profiled-external" && (Pe === "project" || Pe === "user" || Pe === "env") && (K.cliDefaultModel = {
                            model: Ve.model,
                            origin: Pe
                        })
                    }
                    let Xe = [...fe.claudeModelProfileIssues ?? [], ...fe.claudeModelAliasIssues ?? []];
                    Xe.length > 0 && (K.profileIssues = Xe.map(Ve => ({
                        ...Ve.model !== void 0 ? {
                            model: Ve.model
                        } : {},
                        reason: Ve.reason,
                        ...Ve.layer !== void 0 ? {
                            layer: Ve.layer
                        } : {}
                    })))
                }
            } catch (Re) {
                Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: w,
                    error: Re instanceof Error ? Re.message : String(Re)
                })
            }
            return K
        },
        async setSessionModel(w, P, z) {
            if (!J) return {
                ok: !1,
                reason: "not_running"
            };
            let F = B.get(w),
                V = await I(w, F);
            if (V === "pi") return P !== null && !UR(P) ? {
                ok: !1,
                reason: "runtime_rejected",
                detail: `pi model ids are canonical "provider/modelId" (got "${P}")`
            } : (await rt(t, w, {
                model: P ?? null,
                model_runtime: P !== null ? "pi" : null,
                pending_model_fork: null
            }), Q("[session-manager] pi session model override updated", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                applied: "stored"
            }), {
                ok: !0,
                model: P,
                applied: "stored"
            });
            if (V === "grok") {
                let Pe = cJ(F?.adapter),
                    Qe = !!(Pe && (Pe.hasSession?.() ?? !0));
                if (P !== null && Pe && Qe) try {
                    await Pe.setModel({
                        modelId: P
                    })
                } catch (we) {
                    let Fe = we instanceof Error ? we.message : String(we);
                    return Z("[session-manager] grok session/set_model failed", {
                        sessionKey: w,
                        model: P,
                        error: Fe
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: Fe
                    }
                }
                return await rt(t, w, {
                    model: P ?? null,
                    model_runtime: P !== null ? "grok" : null,
                    pending_model_fork: null
                }), Q("[session-manager] grok session model override updated", {
                    sessionKey: w,
                    model: P ?? "(reset to default)",
                    applied: P !== null && Qe ? "live" : "stored"
                }), {
                    ok: !0,
                    model: P,
                    applied: P !== null && Qe ? "live" : "stored"
                }
            }
            if (V === "codex") return await rt(t, w, {
                model: P ?? null,
                model_runtime: P !== null ? "codex" : null,
                pending_model_fork: !0
            }), Q("[session-manager] codex session model override updated", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: P,
                applied: "stored",
                pending_model_fork: !0
            };
            let K = F?.query,
                fe;
            if (P && K && typeof K.supportedModels == "function") try {
                fe = (await K.supportedModels()).some(Qe => Qe.value === P)
            } catch {}
            let oe = await R(w, F, P, z).catch(Pe => (Z("[session-manager] model context profile classification failed — applying live", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                error: Pe instanceof Error ? Pe.message : String(Pe)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (oe.outcome === "blocked") return Z("[session-manager] /model refused: unresolved model context profile", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                detail: oe.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: oe.detail
            };
            let xe = oe.outcome === "rebuild",
                Re = xe ? "stored_pending_rebuild" : "stored",
                gt = null,
                Xe = F?.streamingState;
            if (!xe && !!Xe && Xe?.closed === !1 && (P ?? null) === (Xe?.liveModel ?? null)) Re = "live";
            else if (!xe && K && typeof K.setModel == "function") try {
                await K.setModel(P ?? void 0), Re = "live", Xe && !Xe.closed && (Xe.liveModel = P ?? void 0)
            } catch (Pe) {
                Z("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: w,
                    model: P ?? "(reset to default)",
                    error: Pe instanceof Error ? Pe.message : String(Pe)
                }), P && F && fJ(F, oe.requirementKind) && (Re = "stored_pending_rebuild", gt = P)
            }
            return await rt(t, w, {
                model: P ?? null,
                model_runtime: P !== null ? "claude" : null,
                pending_model_fork: null
            }), gt && F && NA(F, {
                model: gt,
                requirementKind: oe.requirementKind,
                reason: "live-command"
            }), Q("[session-manager] session model override updated", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                applied: Re,
                listed: fe ?? "(no list consulted)",
                contextProfile: oe.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model: P,
                applied: Re,
                listed: fe,
                contextProfile: oe.requirementKind,
                ...oe.contextWindow ? {
                    contextWindow: oe.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(w, P) {
            let z = B.get(w),
                F = await ht(t, w).catch(() => null),
                V = await I(w, z),
                K = {
                    runtime: V,
                    storedEffort: F?.effort ?? void 0,
                    hasLiveQuery: !!z?.query
                },
                fe = await E(w, P).catch(xe => (Z("[session-manager] /effort view: config scope unreadable", {
                    sessionKey: w,
                    error: xe instanceof Error ? xe.message : String(xe)
                }), null)),
                oe = jw(fe, V);
            return oe && (K.configEffort = {
                ...oe
            }), K
        },
        async setSessionEffort(w, P) {
            if (!J) return {
                ok: !1,
                reason: "not_running"
            };
            let z = B.get(w),
                F = await I(w, z);
            if (F === "pi") return await rt(t, w, {
                effort: P ?? null
            }), Q("[session-manager] pi session effort override updated", {
                sessionKey: w,
                effort: P ?? "(reset to default)"
            }), {
                ok: !0,
                effort: P,
                applied: "stored"
            };
            if (F === "grok") {
                let fe = cJ(z?.adapter),
                    xe = (await ht(t, w).catch(() => null))?.model ?? fe?.currentModelId?.(),
                    Re = !!(fe && (fe.hasSession?.() ?? !0) && xe);
                if (P !== null) {
                    if (!Re || !fe || !xe) return await rt(t, w, {
                        effort: P
                    }), Q("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: P,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort: P,
                        applied: "stored"
                    };
                    try {
                        await fe.setModel({
                            modelId: xe,
                            reasoningEffort: P
                        })
                    } catch (gt) {
                        let Xe = gt instanceof Error ? gt.message : String(gt);
                        return Z("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey: w,
                            effort: P,
                            error: Xe
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Xe
                        }
                    }
                    return await rt(t, w, {
                        effort: P
                    }), Q("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: P,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: P,
                        applied: "live"
                    }
                }
                if (fe && xe && (fe.hasSession?.() ?? !0)) {
                    try {
                        await fe.setModel({
                            modelId: xe
                        })
                    } catch (gt) {
                        let Xe = gt instanceof Error ? gt.message : String(gt);
                        return Z("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey: w,
                            error: Xe
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Xe
                        }
                    }
                    return await rt(t, w, {
                        effort: null
                    }), Q("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await rt(t, w, {
                    effort: null
                }), Q("[session-manager] grok session effort override updated", {
                    sessionKey: w,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (F === "codex") return await rt(t, w, {
                effort: P ?? null
            }), Q("[session-manager] codex session effort override updated", {
                sessionKey: w,
                effort: P ?? "(reset to default)"
            }), {
                ok: !0,
                effort: P,
                applied: "stored"
            };
            let V = z?.query,
                K = "stored";
            if (V && typeof V.applyFlagSettings == "function") try {
                await V.applyFlagSettings({
                    effortLevel: P ?? null
                }), K = "live", z?.streamingState && (z.streamingState.lastAppliedEffort = P ?? null)
            } catch (fe) {
                Z("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: w,
                    effort: P ?? "(reset to default)",
                    error: fe instanceof Error ? fe.message : String(fe)
                })
            }
            return await rt(t, w, {
                effort: P ?? null
            }), Q("[session-manager] session effort override updated", {
                sessionKey: w,
                effort: P ?? "(reset to default)",
                applied: K
            }), {
                ok: !0,
                effort: P,
                applied: K
            }
        },
        getActorView(w) {
            let P = B.get(w);
            return !P || P.actorRunId <= 0 ? null : {
                sessionKey: P.sessionKey,
                status: P.status,
                health: "ok",
                idleSince: P.status === "idle" ? P.idleSince : void 0,
                attachedChannels: P.attachedChannels.size,
                sdkSessionId: P.sdkSessionId,
                origin: P.origin,
                jobId: P.jobId,
                runtime: P.runtime,
                activeToolCalls: [...P.activeToolCalls.values()]
            }
        },
        hasQueuedWake: k,
        listActors() {
            let w = new Map;
            for (let [P, z] of B) z.actorRunId <= 0 && !k(z.sessionKey) || w.set(P, {
                sessionKey: z.sessionKey,
                status: z.status,
                health: "ok",
                idleSince: z.status === "idle" ? z.idleSince : void 0,
                attachedChannels: z.attachedChannels.size,
                sdkSessionId: z.sdkSessionId,
                origin: z.origin,
                jobId: z.jobId,
                runtime: z.runtime,
                activeToolCalls: [...z.activeToolCalls.values()]
            });
            return w
        },
        getSweeperActorState(w) {
            let P = B.get(w);
            return !P || P.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: P.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: P.lastActivityAt,
                lastTurnCompletedAt: P.lastTurnCompletedAt,
                spawnedAt: P.spawnedAt
            }
        },
        markAgentNotified(w) {
            let P = B.get(w);
            P && (P.agentNotifiedThisDrain = !0)
        }
    }
}
