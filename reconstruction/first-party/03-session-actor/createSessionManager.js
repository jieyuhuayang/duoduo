// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: Agt, daemon.pretty.js:83651)
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
    } = e, s = r ?? createAgentSdkAdapter(), a = new Ur(t), {
        listSessionInboxPendingNames: u,
        sessionInboxFreshNameVerdict: l,
        finalizeJobSession: c
    } = SEe({
        paths: t,
        bus: n,
        jobManager: a
    }), d = e.codexAvailability ?? checkCodexAvailability, f = e.codexAdapterFactory ?? createCodexAppServerAdapter, p = u0e(d), m = e.grokAvailability ?? checkGrokAvailability, h = e.grokAdapterFactory ?? createGrokAcpAdapter, g = e.piAdapterFactory ?? TO, y = u0e(m), v = w => w === "codex" ? p() : w === "grok" ? y() : void 0, {
        toModelOptions: b,
        resolveRuntimeForModelCommand: _,
        resolveModelProfileScope: I,
        classifyModelTargetAgainstLiveGeneration: E
    } = e0e({
        paths: t
    }), {
        ensureStreamingSession: R
    } = s0e({
        paths: t,
        bus: n,
        resolvedSdk: s,
        classifyModelTargetAgainstLiveGeneration: E
    });
    async function x(w, P) {
        let K = P.trim();
        if (!K) return;
        let H = Hl({
            channel_kind: OS(w),
            session_key: w,
            payload: {
                text: K
            }
        });
        try {
            await Wl(t, H), n.emit("session.output", {
                sessionKey: w,
                record: H
            })
        } catch (L) {
            Le("[session-manager] grok detached-turn outbox write failed", {
                sessionKey: w,
                error: L instanceof Error ? L.message : String(L)
            })
        }
    }
    let S = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        D = e.maxConcurrentJob ?? 6,
        $ = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: S,
            wakeQueue: []
        },
        C = {
            name: "job",
            activeCount: 0,
            maxConcurrent: D,
            wakeQueue: []
        };

    function A(w, P) {
        return vEe(w, P) === "job" ? C : $
    }

    function F(w) {
        return $.wakeQueue.includes(w) || C.wakeQueue.includes(w)
    }

    function k(w) {
        if (w.wakeQueue.length === 0 || !ce) return;
        let P = w.wakeQueue.findIndex(L => !or(L));
        if (P === -1) {
            ot("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: w.name,
                queuedSessions: w.wakeQueue.length
            });
            return
        }
        let K = w.wakeQueue.splice(P, 1)[0];
        P > 0 && ot("[session-manager] dequeue skipped archiving sessions", {
            skipped: P,
            sessionKey: K,
            pool: w.name
        }), ot("[session-manager] dequeue queued wake", {
            sessionKey: K,
            pool: w.name,
            queuedSessions: w.wakeQueue.length
        });
        let H = N.get(K);
        if (H && H.status === "idle" && !H.holdsPoolSlot && H.drainPromise) {
            H.pendingWake = !0, H.wakeResolver && (H.wakeResolver(), H.wakeResolver = null), ot("[session-manager] resuming idle actor from dequeue", {
                sessionKey: K,
                actorRunId: H.actorRunId,
                pool: w.name
            });
            return
        }
        if (w.activeCount >= w.maxConcurrent) {
            w.wakeQueue.unshift(K), ot("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: K,
                pool: w.name,
                activeCount: w.activeCount
            });
            return
        }
        if (H?.origin === "job" && H.jobId) {
            let L = H.jobId;
            ae(K, {
                origin: "job",
                jobId: L
            })
        } else {
            let L = GW(K);
            ae(K, L ?? void 0)
        }
    }
    let N = new Map,
        V = new Map,
        W = new Map,
        ce = !1,
        J = 0,
        ne = ({
            sessionKey: w,
            displayName: P,
            preempt: K,
            preemptBoundary: H
        }) => {
            ot("[session-manager] wake", {
                sessionKey: w,
                preempt: K ?? "allow",
                preemptBoundary: H ?? "default"
            }), P && V.set(w, P), Ie(w, {
                preempt: K,
                preemptBoundary: H
            })
        },
        fe = () => {
            X()
        },
        j = ({
            sessionKey: w,
            reason: P
        }) => {
            let K = N.get(w);
            if (!K) return;
            let H = K.streamingAdapter !== null;
            K.streamingAdapter = null;
            let L = !1;
            K.streamingState && !K.streamingState.closed && (K.streamingState.needsRecreation = !0, L = !0), (H || L) && te("[session-manager] streamingAdapter torn down for session", {
                sessionKey: w,
                reason: P,
                hadAdapter: H,
                stateMarked: L
            }), L && _t("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: w,
                reason: "instructions-drift",
                generation: K.streamingGeneration,
                sdk_session_id: K.sdkSessionId ?? null
            })
        };

    function ue(w) {
        return w.runtime !== "claude" ? w.adapter ? w.adapter : {
            run: async () => {
                throw new Error(`${w.runtime} runtime selected but its adapter was not built; refusing to fall through to Claude`)
            }
        } : w.origin !== "channel" || !s.createStreamingQuery ? s : (w.streamingAdapter || (w.streamingAdapter = {
            run: async P => {
                let K = await R(w, P),
                    H = i0e(w, P);
                return await new Promise((L, G) => {
                    if (K.closed) {
                        G(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    K.queue.enqueue({
                        input: H,
                        resolve: L,
                        reject: G,
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

    function Ie(w, P) {
        if (!ce) {
            ot("[session-manager] wake ignored, manager not running", {
                sessionKey: w
            });
            return
        }
        if (or(w)) {
            ot("[session-manager] wake suppressed, session is being archived", {
                sessionKey: w
            });
            return
        }
        let K = P?.preempt ?? "allow",
            H = P?.preemptBoundary,
            L = N.get(w);
        if (L && L.wakeResolver) {
            ot("[session-manager] wake delivered to idle actor", {
                sessionKey: w,
                actorRunId: L.actorRunId,
                status: L.status,
                preemptBoundary: H ?? "default"
            }), L.wakeResolver(), L.wakeResolver = null;
            return
        }
        if (L && L.drainPromise && (L.status === "active" || L.status === "idle")) {
            let we = !!L.query && L.streamingState?.currentTurn?.accepted === !0,
                le = !!L.adapter?.activeTurnId?.();
            if (K === "allow" && (we || le) && L.admissionCallback && !L.admissionInProgress) {
                L.pendingWake = !0, L.admissionInProgress = !0;
                let ve = L.admissionCallback;
                ot("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: w,
                    actorRunId: L.actorRunId
                }), ve().then(() => {
                    L.admissionInProgress = !1, L.wakeResolver?.()
                }, () => {
                    L.admissionInProgress = !1, L.wakeResolver?.()
                });
                return
            }
            if (L.status === "active" && L.currentAbortController)
                if (K === "force") {
                    let ve = zS(L, "immediate", H, "preempt");
                    ve === "immediate" ? ot("[session-manager] wake: forced preempt", {
                        sessionKey: w,
                        actorRunId: L.actorRunId,
                        preemptBoundary: H ?? "default"
                    }) : ve === "defer_accept" ? ot("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: w,
                        actorRunId: L.actorRunId
                    }) : ve === "defer_tool_result" ? ot("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: w,
                        actorRunId: L.actorRunId
                    }) : ve === "defer_tool_use" && ot("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: w,
                        actorRunId: L.actorRunId
                    })
                } else if (K === "allow") {
                let ve = zS(L, "soft", H, "preempt");
                ve === "defer_accept" ? ot("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: w,
                    actorRunId: L.actorRunId
                }) : ve === "defer_tool_use" ? ot("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: w,
                    actorRunId: L.actorRunId
                }) : ve === "defer_tool_result" ? ot("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: w,
                    actorRunId: L.actorRunId
                }) : ve === "immediate" && ot("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: w,
                    actorRunId: L.actorRunId
                })
            } else ot("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: w,
                actorRunId: L.actorRunId
            });
            L.pendingWake = !0, ot("[session-manager] wake marked pending", {
                sessionKey: w,
                actorRunId: L.actorRunId,
                status: L.status
            });
            return
        }
        let G = A(w, L?.origin);
        if (G.activeCount >= G.maxConcurrent) {
            let we = G.wakeQueue.includes(w);
            we || G.wakeQueue.push(w), ot("[session-manager] wake queued", {
                sessionKey: w,
                pool: G.name,
                activeCount: G.activeCount,
                maxConcurrent: G.maxConcurrent,
                alreadyQueued: we,
                queuedSessions: G.wakeQueue.length
            });
            return
        }
        let ee = GW(w);
        ee ? (ot("[session-manager] wake starting actor with inferred origin", {
            sessionKey: w,
            ...ee
        }), ae(w, ee)) : (ot("[session-manager] wake starting actor", {
            sessionKey: w
        }), ae(w))
    }

    function ae(w, P) {
        let K = N.get(w),
            H = K?.attachedChannels ?? new Set,
            L = ++J,
            G = {
                sessionKey: w,
                actorRunId: L,
                sdkSessionId: K?.sdkSessionId,
                sdkSessionIdVerified: K?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: K?.streamingAdapter ?? null,
                streamingGeneration: K?.streamingGeneration ?? 0,
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
                attachedChannels: H,
                origin: P?.origin ?? K?.origin ?? "channel",
                jobId: P?.jobId ?? K?.jobId,
                jobStateless: K?.jobStateless ?? !1,
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
                runtime: P?.runtime ?? K?.runtime ?? "claude",
                adapter: K?.adapter ?? null,
                adapterFacts: K?.adapterFacts,
                consecutiveConservativeRedrive: K?.consecutiveConservativeRedrive ?? !1
            };
        N.set(w, G);
        let ee = A(w, G.origin);
        ee.activeCount++, G.holdsPoolSlot = !0;
        let we = V.get(w);
        if (we && V.delete(w), OR(t, {
                session_key: w,
                display_name: we,
                kind: G.origin === "job" ? "job" : G.origin === "system" ? "system" : w.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), te("[session-manager] actor start", {
                sessionKey: w,
                actorRunId: L,
                sdkSessionId: G.sdkSessionId,
                origin: G.origin,
                jobId: G.jobId,
                pool: ee.name,
                activeCount: ee.activeCount,
                attachedChannels: G.attachedChannels.size,
                queuedSessions: ee.wakeQueue.length
            }), P?.preStart) {
            let le = P.preStart;
            G.drainPromise = le().catch(ve => Le("[session-manager] preStart failed", ve)).then(() => M(G))
        } else G.drainPromise = M(G)
    }
    async function M(w) {
        let {
            sessionKey: P
        } = w, K, H, L = 0, G = 0, ee = !1, we = [], le = 0, ve = !1, Be = !1, at = null, Je = null, De;
        try {
            De = await u(P)
        } catch (Oe) {
            Z("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: P,
                error: Oe instanceof Error ? Oe.message : String(Oe)
            }), De = new Set
        }
        ot("[session-manager] drain loop begin", {
            sessionKey: P,
            actorRunId: w.actorRunId,
            origin: w.origin,
            jobId: w.jobId
        });
        try {
            if (!w.sdkSessionId && !w.pendingClear) {
                let It = await ct(t, P);
                It?.sdk_session_id && (w.sdkSessionId = It.sdk_session_id, te("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: P,
                    sdkSessionId: It.sdk_session_id
                }))
            }
            if ((await ct(t, P))?.session_key || await et(t, P, {
                    session_key: P
                }), w.origin === "job" && !w.jobId) {
                await a.init();
                let tn = (await a.listJobs()).find(Ht => Ht.session_key === P);
                tn ? (w.jobId = tn.id, Re("[session-manager] recovered jobId from active jobs", {
                    sessionKey: P,
                    jobId: tn.id
                })) : Z("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: P
                })
            }
            let Oe, Gt, ke = !1,
                qe, pt, Cn, Ut, vr = !1;
            if (w.jobStateless = !1, w.origin === "job" && w.jobId) {
                let It = await a.getJob(w.jobId);
                if (Je = It, at = It?.state.last_scheduled_at ?? null, It?.execution_cwd && (await Cye({
                        cwdRel: It.execution_context === "workspace" ? It.frontmatter.cwd_rel ?? null : null,
                        cwd: It.execution_cwd,
                        runtimeWorkspaceDir: It.runtime_workspace_dir,
                        context: It.execution_context
                    }), await $e(It.execution_cwd), await et(t, P, {
                        session_key: P,
                        cwd: It.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), It) {
                    Oe = AS(It.frontmatter.cron), Gt = It.frontmatter.cron;
                    let tn = It.frontmatter.stateless === !0;
                    if (tn && It.frontmatter.cron === "keepalive") throw new Error(NV);
                    ke = tn, w.jobStateless = ke, qe = It.frontmatter.model, pt = It.frontmatter.effort, Cn = {
                        piExtensions: It.frontmatter.piExtensions,
                        piSkills: It.frontmatter.piSkills,
                        piConfigIssues: It.frontmatter.piConfigIssues
                    };
                    let Ht = It.frontmatter.runtime ?? void 0,
                        pi = Ht ?? Co(),
                        Ke = Ht ? "explicit" : "default";
                    It.frontmatter.prompt_mode !== void 0 && pi === "codex" && Z("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                        sessionKey: P,
                        jobId: w.jobId,
                        promptMode: It.frontmatter.prompt_mode,
                        runtimeSource: Ke
                    }), w.runtime = pi;
                    let Bn = await v(pi);
                    Bn && !Bn.ok && (Ut = Bn.reason, Z(`[session-manager] job requested ${pi} but it is unavailable`, {
                        sessionKey: P,
                        jobId: w.jobId,
                        runtime_source: Ke,
                        reason: Bn.reason
                    }))
                }
            } else if (w.origin === "channel") {
                let tn = (await ct(t, P))?.source_channel_id;
                if (tn) {
                    let Ht = await ho(t, tn).catch(() => null),
                        pi = Ht?.channel_kind,
                        Ke = pi ? await ys(t.channelConfigDir, pi).catch(() => null) : null,
                        Di = Ht?.runtime ?? Ke?.runtime ?? void 0 ?? Co(),
                        Cr = Ht?.runtime ? "explicit" : Ke?.runtime ? "inherited" : "default";
                    w.runtime = Di;
                    let An = await v(Di);
                    An && !An.ok && (Ut = An.reason, Z(`[session-manager] channel requested ${Di} but it is unavailable`, {
                        sessionKey: P,
                        sourceChannelId: tn,
                        runtime_source: Cr,
                        reason: An.reason
                    }))
                }
            }
            for (; w.status !== "ended" && ce;) {
                let It = Ut;
                if (w.runtime !== "codex") {
                    for (;;) {
                        let me = w.streamingState,
                            Y = !!me && !me.closed && (me.cliTurnTentative !== null || me.currentTurn !== null);
                        if (!Y && !w.admissionInProgress) break;
                        if (w.pendingWake) {
                            w.pendingWake = !1;
                            continue
                        }
                        ot("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            cliBusy: Y,
                            admissionInProgress: w.admissionInProgress
                        }), await hJ(w, i)
                    }
                    if (!ce || w.status === "ended") break
                }
                w.pendingClear && (w.sdkSessionId = void 0, w.pendingClear = !1, await et(t, P, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }).catch(() => {}));
                let tn, Ht = null;
                w.origin === "job" && w.jobId && (vr ? Ht = await a.getJob(w.jobId).catch(() => null) : (vr = !0, Ht = Je));
                let {
                    instructions: pi,
                    missionContent: Ke
                } = await XEe(t, P, w, Ht), Bn = await ct(t, P), Di = await runInstructionsFingerprintGuard(t, P, pi, w.runtime, {
                    instructions_fingerprint: Bn?.instructions_fingerprint,
                    mission_fingerprint: Bn?.mission_fingerprint,
                    schema_version: Bn?.schema_version,
                    sdk_session_id: Bn?.sdk_session_id,
                    board_layer_hash: Bn?.board_layer_hash,
                    instructions_nonboard_fingerprint: Bn?.instructions_nonboard_fingerprint
                }, w.origin === "job" && w.jobId ? {
                    jobId: w.jobId
                } : void 0);
                Di.clearedSdkSessionId && (w.sdkSessionId = void 0), Di.gate2Fired && w.runtime === "claude" && (Di.boardOnlyDrift ? w.streamingState && !w.streamingState.closed ? te("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: P,
                    board_layer_hash: Di.boardLayerHash
                }) : te("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: P,
                    board_layer_hash: Di.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: P,
                    reason: "instructions_drift"
                })), w.origin === "job" && w.jobId && (Ke !== void 0 ? tn = {
                    content: Ke,
                    jobId: w.jobId,
                    cron: Ht?.frontmatter.cron ?? "",
                    stateless: ke,
                    acceptance: Ht?.frontmatter.acceptance,
                    model: Ht ? Ht.frontmatter.model : qe,
                    effort: Ht ? Ht.frontmatter.effort : pt,
                    sdkConfig: Mye(Ht?.frontmatter)
                } : Z("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: P,
                    jobId: w.jobId
                })), w.status !== "ended" && (w.status = "active"), w.idleSince = void 0;
                let Cr = new Set,
                    An = Date.now(),
                    $n = new AbortController;
                w.currentAbortController = $n;
                let de;
                try {
                    let me = [...w.origin === "system" ? [] : [a_e, __e], y_e, H_e];
                    w.origin === "channel" && (me.push(Ske), me.push(cc));
                    let Y = w.origin === "job" ? "job" : w.origin === "system" ? "system" : "foreground",
                        Et = 0,
                        un = bEe();
                    if (w.admissionCallback = async () => {
                            try {
                                await fR(t, P);
                                let Ve = await lb(t, P);
                                if (Ve.length === 0) return;
                                await pR(t, P, Ve);
                                let pn = {},
                                    tt = await batchDrainItems(t, Ve, {
                                        fallbackBatchSize: vH,
                                        mergeWindowMs: wH,
                                        perf: pn
                                    }),
                                    Xn = await ct(t, P),
                                    Yr = Ig(t, P, Xn ?? void 0),
                                    mn = [],
                                    cr = [];
                                for (let yt of tt.items) {
                                    if (!yt.eventId) continue;
                                    if (w.inflightEventIds.has(yt.eventId)) {
                                        cr.push(yt.eventId);
                                        continue
                                    }
                                    if (await qm(t, yt.eventId)) {
                                        cr.push(yt.eventId);
                                        continue
                                    }
                                    let Xe = yt.createdAt ? {
                                            notAfter: yt.createdAt
                                        } : void 0,
                                        Rt = tt.events.get(yt.eventId) ?? await readEventById(t, yt.eventId, Xe);
                                    if (!Rt) {
                                        Z(`[session-manager] mailbox event unresolved: session_key=${P} event_id=${yt.eventId} not_after=${Xe?.notAfter??"none"} item_file=${yt.file??"none"}`);
                                        continue
                                    }
                                    mn.push({
                                        item: yt,
                                        event: Rt,
                                        prompt: RO(Rt, P)
                                    })
                                }
                                if (mn.length === 0) {
                                    cr.length > 0 && await Ao(t, P, cr);
                                    return
                                }
                                let vn = await SH(t, P, {
                                        allowedTools: me,
                                        tools: un,
                                        additionalDirectories: [t.memoryDir]
                                    }, mn, Yr, {
                                        pendingGatewayNotice: Xn?.pending_gateway_notice,
                                        pendingInterruptedContext: Xn?.pending_interrupted_context,
                                        pendingSkipRewind: Xn?.pending_skip_rewind,
                                        lastEventAtWatermark: Xn?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, pn, yt => yt),
                                    Ro = [...cr, ...mn.map(yt => yt.item.eventId).filter(yt => !!yt)];
                                if (w.runtime === "codex" || w.runtime === "grok" || w.runtime === "pi") {
                                    let yt = w.adapter?.steerActiveTurn,
                                        mt = vn.coalescedPromptText.trim(),
                                        Xe = w.adapter?.activeTurnId?.(),
                                        Rt = w.adapter?.activeTurnStartedAt?.(),
                                        dr = !1;
                                    if (Xe && Rt !== void 0)
                                        if (w.adapter?.activeTurnSkipObserved?.() === !0) dr = !0;
                                        else {
                                            let iu = await ct(t, P).catch(() => null);
                                            if (iu === null) dr = !0, Z("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: P
                                            });
                                            else {
                                                let mi = Date.parse(iu.pending_skip_rewind?.skipped_at ?? "");
                                                dr = Number.isFinite(mi) && mi >= Rt
                                            }
                                        } if (!!yt && !!Xe && !vn.isNotifyOnly && !w.liveTurnNotifyOnly && mt.length > 0 && !dr && yt && Xe) {
                                        let wr = vn.batchEventIds.filter(mi => !w.inflightEventIds.has(mi));
                                        for (let mi of wr) w.inflightEventIds.add(mi);
                                        if (await yt(mt, Xe, vn.attachments).catch(() => !1)) {
                                            await Ao(t, P, Ro);
                                            for (let mi of wr) w.inflightEventIds.delete(mi);
                                            te("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: P,
                                                admittedItems: mn.length,
                                                batchEventIds: vn.batchEventIds
                                            })
                                        } else {
                                            for (let mi of wr) w.inflightEventIds.delete(mi);
                                            w.pendingWake = !0, te("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: P,
                                                batchEventIds: vn.batchEventIds
                                            })
                                        }
                                    } else w.pendingWake = !0, te("[session-manager] admission callback: codex steer not attempted, redraining", {
                                        sessionKey: P,
                                        admittedItems: mn.length,
                                        batchEventIds: vn.batchEventIds,
                                        liveTurn: !!Xe,
                                        notifyOnlyBatch: vn.isNotifyOnly,
                                        sealedBySkip: dr,
                                        liveTurnNotifyOnly: w.liveTurnNotifyOnly,
                                        emptyText: mt.length === 0
                                    });
                                    return
                                }
                                let Mi = w.streamingState;
                                if (!Mi || Mi.closed) return;
                                let ji = Mi.currentTurn,
                                    js = !!vn.attachments && vn.attachments.length > 0,
                                    Zo = vn.coalescedPromptText.trim();
                                if (!!ji && ji.accepted && !ji.skipCalled && !js && !vn.isNotifyOnly && !w.liveTurnNotifyOnly && Zo.length > 0) {
                                    let yt = w.pendingSteer;
                                    if (yt && !yt.settled && yt.spawningTurn === ji) {
                                        let mt = vn.batchEventIds.filter(Xe => !w.inflightEventIds.has(Xe));
                                        for (let Xe of mt) w.inflightEventIds.add(Xe);
                                        yt.steerText = `${yt.steerText}
${Zo}`, yt.eventIds.push(...Ro), yt.claimedEventIds.push(...mt), yt.requeueLines.push(...mn.map(Xe => Xe.item.line)), yt.requeueEventIds.push(...mn.map(Xe => Xe.item.eventId)), yt.processedEventIds.push(...cr), te("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: P,
                                            admittedItems: mn.length,
                                            batchEventIds: vn.batchEventIds
                                        });
                                        return
                                    }
                                    if (!yt) {
                                        let mt = vn.batchEventIds.filter(Rt => !w.inflightEventIds.has(Rt));
                                        for (let Rt of mt) w.inflightEventIds.add(Rt);
                                        let Xe = {
                                            steerText: Zo,
                                            eventIds: [...Ro],
                                            claimedEventIds: [...mt],
                                            enqueueAsNewTurn: async () => {
                                                let Rt = [];
                                                for (let Io = 0; Io < Xe.requeueLines.length; Io += 1) {
                                                    let wr = Xe.requeueLines[Io],
                                                        iu = Xe.requeueEventIds[Io];
                                                    try {
                                                        await Xs(t, P, wr), Rt.push(iu)
                                                    } catch (mi) {
                                                        Z("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: P,
                                                            eventId: iu,
                                                            error: mi instanceof Error ? mi.message : String(mi)
                                                        })
                                                    }
                                                }
                                                let dr = [...Rt, ...Xe.processedEventIds];
                                                if (dr.length > 0) try {
                                                    await Ao(t, P, dr)
                                                } catch (Io) {
                                                    te("[session-manager] steer fallback markDone error", {
                                                        sessionKey: P,
                                                        error: String(Io)
                                                    })
                                                }
                                                for (let Io of Xe.claimedEventIds) w.inflightEventIds.delete(Io);
                                                w.pendingWake = !0, te("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: P,
                                                    eventIds: Xe.eventIds,
                                                    requeued: Rt.length,
                                                    requeueFailed: Xe.requeueLines.length - Rt.length
                                                })
                                            },
                                            spawningTurn: ji,
                                            requeueLines: mn.map(Rt => Rt.item.line),
                                            requeueEventIds: mn.map(Rt => Rt.item.eventId),
                                            processedEventIds: [...cr],
                                            settled: !1
                                        };
                                        w.pendingSteer = Xe, te("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: P,
                                            admittedItems: mn.length,
                                            batchEventIds: vn.batchEventIds
                                        });
                                        return
                                    }
                                }
                                w.pendingWake = !0, w.wakeResolver?.()
                            } catch (Ve) {
                                te("[session-manager] admission callback error", {
                                    sessionKey: P,
                                    error: String(Ve)
                                })
                            }
                        }, w.runtime === "codex" && !w.adapter && !It) {
                        let Ve = (await ct(t, P))?.cwd;
                        Ve && await ensureAgentsMdSymlink(Ve).catch(() => {}), w.adapter = f({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: qe,
                            dynamicTools: wA({
                                paths: t,
                                sessionKey: P,
                                bus: n,
                                sessionContextKind: Y,
                                notifyDepth: Et,
                                jobScheduleType: Oe,
                                callerJobCron: Gt,
                                getSessionStatus: pn => N.get(pn)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            })
                        })
                    }
                    if (w.runtime === "grok" && !w.adapter && !It) {
                        let Ve = await ct(t, P).catch(() => null);
                        w.adapter = h({
                            cwd: Ve?.cwd ?? t.workDir,
                            sdkSessionId: ke ? void 0 : Ve?.sdk_session_id,
                            mcpServerFactory: () => Yg(t, {
                                sessionKey: P,
                                bus: n,
                                sessionContextKind: Y,
                                notifyDepth: Et,
                                jobScheduleType: Oe,
                                callerRuntime: w.runtime,
                                callerJobCron: Gt,
                                getSessionStatus: pn => N.get(pn)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text: pn
                            }) => x(P, pn)
                        })
                    }
                    if (w.runtime === "pi" && !It) {
                        let Ve = await ct(t, P).catch(() => null),
                            pn = tS(),
                            {
                                settingsSeed: tt,
                                defaultProjectTrust: Xn,
                                unknownKeys: Yr,
                                readFailed: mn
                            } = nS(pn);
                        Yr.length > 0 && Z("[session-manager] pi settings keys not classified (SDK bump gate)", {
                            sessionKey: P,
                            keys: Yr
                        });
                        let cr = !1,
                            vn = Cn ? null : await Ga(t, P).catch(() => (cr = !0, null)),
                            Ro = Cn ? await Za(t, {
                                channel_kind: "job"
                            }).catch(() => (cr = !0, null)) : null,
                            Mi = Cn ?? vn;
                        Mi?.piConfigIssues?.length && Z("[session-manager] invalid pi.* config values ignored (defaults apply)", {
                            sessionKey: P,
                            issues: Mi.piConfigIssues
                        });
                        let ji = (Ve?.model_runtime === "pi" ? Ve.model : void 0) ?? (Ht ? Ht.frontmatter.model : qe) ?? Mw(vn ?? Ro, "pi")?.model,
                            js = Mi?.piExtensions ?? "all",
                            Zo = Mi?.piSkills ?? "all",
                            Nn = Ve?.effort ?? (Ht ? Ht.frontmatter.effort : pt) ?? jw(vn ?? Ro, "pi")?.effort,
                            yt = vke({
                                model: ji,
                                thinkingLevel: Nn,
                                settingsSeed: tt,
                                defaultProjectTrust: Xn,
                                extensions: js,
                                skills: Zo,
                                instructionsFingerprint: bke(to(P) === "channel", Di)
                            }),
                            mt = !mn && !cr;
                        if (mt || Z("[session-manager] pi construction facts unread, keeping the live worker", {
                                sessionKey: P,
                                seedReadFailed: mn,
                                configReadFailed: cr
                            }), w.adapter && w.adapterFacts !== yt && mt) {
                            let Xe = w.adapter;
                            w.adapter = null, w.adapterFacts = void 0, Promise.resolve(Xe.shutdown()).catch(Rt => {
                                Z("[session-manager] stale pi adapter shutdown failed", {
                                    sessionKey: P,
                                    error: String(Rt)
                                })
                            })
                        }
                        if (!w.adapter)
                            if (!ji) It = "pi binds its model when the worker is built, and this session has none. Send `/model <provider>/<modelId>` (channel sessions), or set `model: <provider>/<modelId>` in the job frontmatter, then send the message again.";
                            else {
                                let Xe = Uc.join(Jn(t, P), "pi"),
                                    Rt = {
                                        session_context_kind: Y
                                    };
                                w.adapter = g({
                                    cwd: Ve?.cwd ?? t.workDir,
                                    sdkSessionId: (ke ? void 0 : Ve?.sdk_session_id) ?? $gt(),
                                    sessionDir: Xe,
                                    agentDir: pn,
                                    authPath: Uc.join(pn, "auth.json"),
                                    modelsPath: Uc.join(pn, "models.json"),
                                    modelsStorePath: Uc.join(Xe, "models-store.json"),
                                    settingsSeed: tt,
                                    resources: {
                                        extensions: js,
                                        skills: Zo,
                                        default_project_trust: Xn
                                    },
                                    model: ji,
                                    thinkingLevel: Nn,
                                    workerCommand: eS(),
                                    env: {
                                        [vC]: t.daemonSocketPath,
                                        [wC]: kC({
                                            session_key: P,
                                            job_cron: Gt,
                                            job_schedule_type: Oe,
                                            ...Rt
                                        }),
                                        [SC]: JSON.stringify(Rt)
                                    },
                                    onToolEnd: dr => Eke(t, P, dr),
                                    logDebug: dr => Re(dr, {
                                        sessionKey: P
                                    }),
                                    logWarn: dr => Z(dr, {
                                        sessionKey: P
                                    })
                                }), w.adapterFacts = yt
                            }
                    }
                    if (!ce || w.status === "ended") break;
                    let fn = ue(w);
                    de = await drainSessionMailbox(t, P, {
                        sdk: fn,
                        usesStreamingAdapter: fn === w.streamingAdapter,
                        bus: n,
                        abortController: $n,
                        runtime: w.runtime,
                        runtimeUnavailableReason: It,
                        excludeEventIds: o0e(w),
                        actorSpawnedAt: w.spawnedAt,
                        actorLastTurnCompletedAt: w.lastTurnCompletedAt,
                        getStreamGeneration: () => w.streamingGeneration,
                        holdInputOpenForBackgroundAgents: w.runtime === "claude" && w.origin !== "channel",
                        jobContext: tn,
                        memoryBoard: pi.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: pi.memoryBoard
                        } : void 0,
                        boardHash: pi.memoryBoard ? Di.boardLayerHash : void 0,
                        onBatchContext: Ve => {
                            if (Et = Ve.maxNotifyDepth, Ve.eventIds)
                                for (let pn of Ve.eventIds) w.inflightEventIds.add(pn)
                        },
                        mcpServersFactory: () => ({
                            aladuo: Yg(t, {
                                sessionKey: P,
                                bus: n,
                                sessionContextKind: Y,
                                notifyDepth: Et,
                                jobScheduleType: Oe,
                                callerRuntime: w.runtime,
                                callerJobCron: Gt,
                                getSessionStatus: Ve => N.get(Ve)?.status,
                                onNotifyCalled: () => {
                                    w.agentNotifiedThisDrain = !0
                                }
                            })
                        }),
                        allowedTools: me,
                        tools: un,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: o,
                        onSdkTurnStarted: Ve => {
                            w.liveTurnNotifyOnly = Ve.notifyOnly, L += 1;
                            let pn = !ee;
                            if (ee = L > G, pn && ee && w.origin === "job" && w.jobId) {
                                let tt = w.jobId;
                                we.push(a.updateState(tt, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: at
                                }).catch(Xn => {
                                    Z("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: P,
                                        jobId: tt,
                                        error: Xn instanceof Error ? Xn.message : String(Xn)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            G += 1;
                            let Ve = ee && L <= G;
                            if (ee = L > G, Ve && w.origin === "job" && w.jobId) {
                                let pn = w.jobId;
                                we.push(a.updateState(pn, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: at
                                }).catch(tt => {
                                    Z("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: P,
                                        jobId: pn,
                                        error: tt instanceof Error ? tt.message : String(tt)
                                    })
                                }))
                            }
                        },
                        onStream: (Ve, pn, tt) => {
                            w.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: P,
                                chunk: Ve,
                                isSidechain: pn,
                                anchorEventId: tt
                            })
                        },
                        onExecutionEvent: (Ve, pn) => {
                            Ve.type === "tool_use" && (w.isStreaming = !1, w.activeToolCalls.set(Ve.toolUseId, {
                                toolName: Ve.toolName,
                                startedAtMs: Date.now()
                            }), w.pendingPreempt && w.pendingPreemptBoundary === "tool_use" && (w.pendingPreempt = !1, w.pendingPreemptBoundary = null, mJ(w))), Ve.type === "tool_result" && (w.activeToolCalls.delete(Ve.toolUseId), w.pendingPreempt && w.pendingPreemptBoundary === "tool_result" && w.activeToolCalls.size === 0 && (w.pendingPreempt = !1, w.pendingPreemptBoundary = null, mJ(w)));
                            let tt = hEe(Ve);
                            if (tt && Cr.has(tt)) return;
                            tt && Cr.add(tt);
                            let Xn = gEe(Ve);
                            if (Xn) {
                                let Yr = Ve.type === "tool_use" || Ve.type === "tool_result" ? Ve.isSidechain : void 0;
                                n.emit("session.execution", {
                                    sessionKey: P,
                                    event: Xn,
                                    anchorEventId: pn,
                                    isSidechain: Yr
                                })
                            }
                        }
                    })
                } finally {
                    w.admissionCallback = null, w.admissionInProgress || w.inflightEventIds.clear(), w.currentAbortController === $n && (w.currentAbortController = null), w.isStreaming = !1, w.activeToolCalls.clear(), w.pendingPreempt = !1, w.pendingPreemptBoundary = null, w.pendingPreemptReason = null
                }
                if (ot("[session-manager] drain result", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        processed: de.processed,
                        skipped: de.skipped,
                        lockAcquired: de.lockAcquired,
                        outboxRecords: de.outboxRecords?.length ?? (de.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - An
                    }), le += de.processed, ve = de.mergeTransientFailure === !0, de.cancelled && (Be = !0), de.processed > 0 && (w.lastTurnCompletedAt = Date.now(), await ea(t, P, "last_error").catch(() => {})), de.compacted && w.runtime === "claude" && w.streamingState && !w.streamingState.closed) {
                    let me = pi.memoryBoard ? Di.boardLayerHash : void 0;
                    w.spawnBoardHash !== me && (w.streamingState.needsRecreation = !0, _t("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: P,
                        reason: "board-refresh(B4)",
                        generation: w.streamingGeneration,
                        spawn_board_hash: w.spawnBoardHash ? w.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: me ? me.slice(0, 12) : null
                    }))
                }
                if (w.pendingClear) w.sdkSessionId = void 0, w.pendingClear = !1, await et(t, P, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }).catch(() => {}), te("[session-manager] applied pending clear after drain", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                });
                else {
                    let me = await ct(t, P);
                    if (me?.sdk_session_id) {
                        let Y = !w.sdkSessionId,
                            Et = w.sdkSessionId !== me.sdk_session_id;
                        w.sdkSessionId = me.sdk_session_id, (Y || Et) && te("[session-manager] sdk session bound", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            sdkSessionId: w.sdkSessionId,
                            isNewSession: Y
                        })
                    }
                }
                if (de.lastReplyText && (H = de.lastReplyText), de.outboxRecords && de.outboxRecords.length > 0) {
                    ot("[session-manager] emitting outbox records", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        count: de.outboxRecords.length
                    });
                    for (let me of de.outboxRecords) n.emit("session.output", {
                        sessionKey: me.session_key,
                        record: me
                    })
                } else de.lastOutboxRecord ? (ot("[session-manager] emitting single outbox record", {
                    sessionKey: P,
                    actorRunId: w.actorRunId,
                    recordId: de.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: P,
                    record: de.lastOutboxRecord
                })) : w.origin === "channel" && de.processed > 0 && !de.cancelled && !de.sdkTurns?.length && (ot("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey: P,
                    actorRunId: w.actorRunId,
                    turnSkipped: de.turnSkipped === !0
                }), n.emit("session.stream_end", {
                    sessionKey: w.sessionKey,
                    reason: de.turnSkipped === !0 ? "skipped" : "interrupted"
                }));
                if (w.origin === "channel")
                    for (let me of de.sdkTurns ?? []) !me.consumed || me.hadOutput || (ot("[session-manager] silent turn, emitting stream_end", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        anchorEventId: me.anchorEventId,
                        turnSkipped: me.skipped
                    }), n.emit("session.stream_end", {
                        sessionKey: w.sessionKey,
                        reason: me.skipped ? "skipped" : "interrupted",
                        anchorEventId: me.anchorEventId
                    }));
                if (de.refusedStage === "runtime_unavailable" || de.refusedStage === "runtime_mismatch") {
                    ot("[session-manager] runtime refusal, ending actor", {
                        sessionKey: P,
                        actorRunId: w.actorRunId,
                        stage: de.refusedStage
                    });
                    break
                }
                if (de.processed === 0) {
                    if (w.origin === "job" || w.origin === "system") {
                        ot("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            origin: w.origin,
                            jobId: w.jobId
                        });
                        break
                    }
                    if (w.pendingWake) {
                        w.pendingWake = !1, ot("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: P,
                            actorRunId: w.actorRunId
                        });
                        continue
                    }
                    if (w.status = "idle", w.idleSince = new Date().toISOString(), w.pendingWake) {
                        w.pendingWake = !1, ot("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: P,
                            actorRunId: w.actorRunId
                        });
                        continue
                    }
                    if (ot("[session-manager] idle", {
                            sessionKey: P,
                            actorRunId: w.actorRunId,
                            attachedChannels: w.attachedChannels.size
                        }), w.holdsPoolSlot) {
                        let Y = A(P, w.origin);
                        Y.activeCount--, w.holdsPoolSlot = !1, ot("[session-manager] released pool slot (idle)", {
                            sessionKey: P,
                            pool: Y.name,
                            activeCount: Y.activeCount
                        }), k(Y)
                    }
                    let me = !1;
                    for (;;) {
                        let Y = !1,
                            Et = !1;
                        for (; w.status === "idle";) {
                            if (w.pendingWake) {
                                w.pendingWake = !1, Y = !0;
                                break
                            }
                            if (!ce) {
                                Et = !0;
                                break
                            }
                            if (await hJ(w, i) || w.status !== "idle") {
                                Y = !0;
                                break
                            }
                            if (w.attachedChannels.size > 0) {
                                ot("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey: P,
                                    actorRunId: w.actorRunId,
                                    attachedChannels: w.attachedChannels.size
                                }), w.streamingState && !w.streamingState.closed && _t("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey: P,
                                    generation: w.streamingGeneration,
                                    sdk_session_id: w.sdkSessionId ?? null
                                }), await Zf(w), LA(w);
                                continue
                            }
                            break
                        }
                        if (Et) {
                            me = !0;
                            break
                        }
                        if (!Y && w.status === "idle") {
                            ot("[session-manager] idle timeout, no attachments, exiting", {
                                sessionKey: P,
                                actorRunId: w.actorRunId
                            }), w.streamingState && !w.streamingState.closed && _t("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                sessionKey: P,
                                generation: w.streamingGeneration,
                                sdk_session_id: w.sdkSessionId ?? null
                            }), me = !0;
                            break
                        }
                        if (Y && !w.holdsPoolSlot) {
                            let un = A(P, w.origin);
                            if (un.activeCount >= un.maxConcurrent) {
                                un.wakeQueue.includes(P) || un.wakeQueue.unshift(P), ot("[session-manager] woken idle actor re-queued (pool full)", {
                                    sessionKey: P,
                                    pool: un.name,
                                    activeCount: un.activeCount
                                }), w.pendingWake = !1;
                                continue
                            }
                            un.activeCount++, w.holdsPoolSlot = !0, ot("[session-manager] re-acquired pool slot (woken)", {
                                sessionKey: P,
                                pool: un.name,
                                activeCount: un.activeCount
                            })
                        }
                        break
                    }
                    if (me) break
                }
            }
        } catch (Oe) {
            Le(`[session-manager] error in drain loop for ${P}:`, Oe), K = Oe, await et(t, P, {
                last_error: {
                    message: Oe instanceof Error ? Oe.message : String(Oe),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            await Zf(w), w.currentAbortController = null, w.streamingAdapter = null, w.isStreaming = !1, w.activeToolCalls.clear(), w.pendingPreempt = !1, w.pendingPreemptBoundary = null, w.pendingPreemptReason = null, await LA(w);
            let Oe = A(P, w.origin);
            if (w.holdsPoolSlot && (Oe.activeCount--, w.holdsPoolSlot = !1), w.origin === "job" && w.jobId) {
                we.length > 0 && await Promise.allSettled(we);
                try {
                    await c(w, {
                        runStarted: ee,
                        cancelled: Be,
                        processedCount: le,
                        claimCursor: at,
                        error: K,
                        resultText: H,
                        jobSnapshot: Je
                    })
                } finally {
                    w.status = "ended"
                }
            } else w.status = "ended";
            if (w.pendingWake = !1, ce && Tgt(Jn(t, P)) && !or(P)) {
                let ke = await l(P, De);
                ke === "fresh" ? (w.consecutiveConservativeRedrive = !1, ot("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                }), Ie(P, {
                    preempt: "never"
                })) : ke === "conservative" || ve ? w.consecutiveConservativeRedrive ? Z("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                }) : (w.consecutiveConservativeRedrive = !0, ot("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: P,
                    actorRunId: w.actorRunId
                }), Ie(P, {
                    preempt: "never"
                })) : w.consecutiveConservativeRedrive = !1
            }
            te("[session-manager] actor end", {
                sessionKey: P,
                actorRunId: w.actorRunId,
                sdkSessionId: w.sdkSessionId,
                pool: Oe.name,
                activeCount: Oe.activeCount,
                origin: w.origin,
                jobId: w.jobId,
                attachedChannels: w.attachedChannels.size,
                queuedSessions: Oe.wakeQueue.length
            }), k(Oe)
        }
    }

    function z(w, P) {
        if (!ce) return;
        if (or(P)) {
            ot("[session-manager] skip job spawn, session is being archived", {
                jobId: w,
                sessionKey: P
            });
            return
        }
        let K = N.get(P);
        if (K && K.status !== "ended") {
            ot("[session-manager] skip duplicate job spawn", {
                jobId: w,
                sessionKey: P,
                actorStatus: K.status
            });
            return
        }
        if (C.activeCount >= C.maxConcurrent) {
            C.wakeQueue.includes(P) || C.wakeQueue.push(P), K ? (K.origin = "job", K.jobId = w) : N.set(P, {
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
        ae(P, {
            origin: "job",
            jobId: w
        }), (async () => {
            try {
                let H = createSpineEvent({
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
                await atomicAppendEvent(t, H), n.emit("job.spawned", {
                    jobId: w,
                    sessionKey: P
                })
            } catch (H) {
                Le("[session-manager] error recording job spawn", H)
            }
        })()
    }
    async function U(w, P) {
        let H = (W.get(w) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (lr(w) !== "channel") return;
            let L = OS(w),
                G = new Date().toISOString(),
                ee = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: L,
                        name: "session-manager"
                    },
                    session_key: w,
                    payload: {
                        session_key: w,
                        channel_kind: L,
                        channel_id: P,
                        attached_at: G
                    }
                });
            await atomicAppendEvent(t, ee)
        }).finally(() => {
            W.get(w) === H && W.delete(w)
        });
        W.set(w, H), await H
    }

    function X() {
        for (let w of N.values()) w.status = "ended", LA(w), w.streamAbortController && !w.streamAbortController.signal.aborted && w.streamAbortController.abort(), typeof w.query?.close == "function" && w.query.close(), w.query = null, w.streamAbortController = null, w.currentAbortController && !w.currentAbortController.signal.aborted && w.currentAbortController.abort(), w.currentAbortController = null, w.wakeResolver && (w.wakeResolver(), w.wakeResolver = null)
    }
    async function Ee() {
        if (W.size === 0) return;
        let w = Array.from(W.values()),
            P = !1,
            K = new Promise(H => setTimeout(() => {
                P = !0, H()
            }, 3e4));
        await Promise.race([Promise.allSettled(w).then(() => {}), K]), P && Z("[session-manager] shutdown abandoned pending attach writes after the fallback", {
            pending: w.length
        })
    }
    async function be(w) {
        let P;
        try {
            P = Pgt(Uc.join(Ogt(), "aladuo-pi-catalog-"));
            let K = tS(),
                {
                    settingsSeed: H,
                    defaultProjectTrust: L
                } = nS(K),
                G = await Ga(t, w).catch(() => null),
                ee = await ct(t, w).catch(() => null),
                we = await hke({
                    cwd: ee?.cwd ?? t.workDir,
                    agentDir: K,
                    authPath: Uc.join(K, "auth.json"),
                    modelsPath: Uc.join(K, "models.json"),
                    modelsStorePath: Uc.join(P, "models-store.json"),
                    settingsSeed: H,
                    resources: {
                        extensions: G?.piExtensions ?? "all",
                        default_project_trust: L
                    },
                    workerCommand: eS(),
                    logDebug: le => Re("[pi-catalog] " + le)
                });
            return we.length > 0 ? we : void 0
        } catch (K) {
            Z("[session-manager] pi model catalog failed", {
                sessionKey: w,
                error: String(K)
            });
            return
        } finally {
            try {
                P && Cgt(P, {
                    recursive: !0,
                    force: !0
                })
            } catch {}
        }
    }
    return {
        async start() {
            if (!ce) {
                ce = !0, n.on("session.wake", ne), n.on("shutdown", fe), n.on("session.streaming_invalidated", j);
                try {
                    let w = await rehydrateSessionState(t);
                    for (let P of w) {
                        if (or(P)) {
                            ot("[session-manager] skip hydrating session being archived", {
                                sessionKey: P
                            });
                            continue
                        }
                        let H = (await ct(t, P))?.cwd;
                        if (H && !wEe(H)) {
                            Z("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: P,
                                cwd: H
                            });
                            continue
                        }
                        Ie(P, {
                            preempt: "never"
                        })
                    }
                } catch (w) {
                    Le("[session-manager] error hydrating sessions:", w)
                }
                te("[session-manager] started", {
                    channelActive: $.activeCount,
                    channelQueued: $.wakeQueue.length,
                    jobActive: C.activeCount,
                    jobQueued: C.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!ce) return;
            ce = !1, n.off("session.wake", ne), n.off("shutdown", fe), n.off("session.streaming_invalidated", j), X();
            let w = Array.from(N.values()).map(P => P.drainPromise).filter(P => P !== null);
            if (w.length > 0) {
                let P = Array.from(N.values()).filter(L => L.drainPromise !== null),
                    K = !1,
                    H = new Promise(L => setTimeout(() => {
                        K = !0, L()
                    }, 3e4));
                await Promise.race([Promise.all(w), H]), K && Z("[session-manager] shutdown abandoned running drains after the fallback", {
                    sessions: P.map(L => L.sessionKey),
                    runtimes: P.map(L => L.runtime)
                })
            }
            await Ee(), N.clear(), $.wakeQueue.length = 0, $.activeCount = 0, C.wakeQueue.length = 0, C.activeCount = 0, te("[session-manager] stopped")
        },
        wakeSession: Ie,
        getActor(w) {
            return N.get(w)
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
            return ce
        },
        attachChannel(w, P) {
            let K = N.get(w);
            K || (K = {
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
            }, N.set(w, K)), K.attachedChannels.add(P), ot("[session-manager] channel attached", {
                sessionKey: w,
                channelId: P,
                totalAttachments: K.attachedChannels.size
            }), U(w, P).catch(H => {
                Z("[session-manager] failed to emit channel.attached event", {
                    sessionKey: w,
                    channelId: P,
                    error: String(H)
                })
            })
        },
        detachChannel(w, P) {
            let K = N.get(w);
            K && (K.attachedChannels.delete(P), ot("[session-manager] channel detached", {
                sessionKey: w,
                channelId: P,
                remainingAttachments: K.attachedChannels.size
            }), K.attachedChannels.size === 0 && K.status === "idle" && K.wakeResolver && (K.wakeResolver(), K.wakeResolver = null))
        },
        hasAttachedChannels(w) {
            let P = N.get(w);
            return P ? P.attachedChannels.size > 0 : !1
        },
        spawnJobSession(w, P) {
            z(w, P)
        },
        async interruptSession(w) {
            if (!ce) return {
                interrupted: !1,
                reason: "not_running"
            };
            let P = N.get(w);
            return P ? !P.query && (!P.currentAbortController || P.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : P.streamAbortController && !P.streamAbortController.signal.aborted ? (te("[session-manager] interrupt: stopping streaming session", {
                sessionKey: w,
                actorRunId: P.actorRunId
            }), await Zf(P, "cancel-interrupt", "user-cancel"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (zS(P, "immediate", void 0, "user-cancel") === "immediate" && te("[session-manager] interrupt requested", {
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
            if (!ce) return {
                cleared: !1,
                reason: "not_running"
            };
            let P = N.get(w),
                K = P?.sdkSessionId;
            if (P && (P.pendingClear = !0, P.sdkSessionId = void 0, P.sdkSessionIdVerified = !1, P.pendingInterruptMarker = null), P?.streamAbortController && !P.streamAbortController.signal.aborted ? await Zf(P, "clear") : P?.currentAbortController && !P.currentAbortController.signal.aborted && zS(P, "immediate"), await et(t, w, {
                    sdk_session_id: null,
                    sdk_session_runtime: null,
                    pending_fork_to: null
                }), (P?.runtime === "pi" || P?.runtime === "grok") && P.adapter) {
                let H = P.adapter;
                P.adapter = null, P.adapterFacts = void 0, await Promise.resolve(H.shutdown()).catch(L => {
                    Z("[session-manager] runtime adapter shutdown on clear failed", {
                        sessionKey: w,
                        runtime: P.runtime,
                        error: String(L)
                    })
                })
            }
            return te("[session-manager] SDK session cleared", {
                sessionKey: w,
                actorRunId: P?.actorRunId,
                previousSessionId: K
            }), {
                cleared: !0,
                previousSessionId: K
            }
        },
        async getSessionModelView(w, P) {
            let K = N.get(w),
                H = await ct(t, w).catch(() => null),
                L = await _(w, K),
                G = {
                    runtime: L,
                    storedModel: H?.model,
                    hasLiveQuery: !!K?.query
                },
                ee = await I(w, P).catch(ve => (Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: w,
                    error: ve instanceof Error ? ve.message : String(ve)
                }), null)),
                we = Mw(ee, L);
            if (we && (G.configModel = {
                    ...we
                }), H?.last_served_model && (G.lastServedModel = H.last_served_model), L === "pi") return G.piProviders = await be(w), G;
            let le = K?.query;
            if (le && typeof le.supportedModels == "function") try {
                G.available = b(await le.supportedModels())
            } catch {}
            try {
                if (ee && L === "claude") {
                    let ve = Object.entries(ee.claudeModelProfiles ?? {}).map(([Je, De]) => {
                        let Oe = cSe(De.baseUrl);
                        return {
                            model: Je,
                            contextWindow: De.cap,
                            source: De.source,
                            ...Oe ? {
                                endpointHost: Oe
                            } : {}
                        }
                    });
                    ve.length > 0 && (G.profiles = ve.sort((Je, De) => Je.model.localeCompare(De.model)));
                    let Be = Object.entries(ee.claudeModelAliases ?? {}).map(([Je, De]) => ({
                        tier: Je,
                        model: De.model,
                        source: De.source
                    })).sort((Je, De) => Je.tier.localeCompare(De.tier));
                    if (Be.length > 0 && (G.aliases = Be), !G.storedModel && !G.configModel) {
                        let Je = await Eg({
                                model: null,
                                cwd: Ig(t, w, H ?? void 0).cwd,
                                daemonEnv: process.env,
                                mergedCatalog: ee.claudeModelProfiles ?? {},
                                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                                issues: ee.claudeModelProfileIssues
                            }),
                            De = Je.modelOrigin;
                        Je.kind === "profiled-external" && (De === "project" || De === "user" || De === "env") && (G.cliDefaultModel = {
                            model: Je.model,
                            origin: De
                        })
                    }
                    let at = [...ee.claudeModelProfileIssues ?? [], ...ee.claudeModelAliasIssues ?? []];
                    at.length > 0 && (G.profileIssues = at.map(Je => ({
                        ...Je.model !== void 0 ? {
                            model: Je.model
                        } : {},
                        reason: Je.reason,
                        ...Je.layer !== void 0 ? {
                            layer: Je.layer
                        } : {}
                    })))
                }
            } catch (ve) {
                Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: w,
                    error: ve instanceof Error ? ve.message : String(ve)
                })
            }
            return G
        },
        async setSessionModel(w, P, K) {
            if (!ce) return {
                ok: !1,
                reason: "not_running"
            };
            let H = N.get(w),
                L = await _(w, H);
            if (L === "pi") return P !== null && !UR(P) ? {
                ok: !1,
                reason: "runtime_rejected",
                detail: `pi model ids are canonical "provider/modelId" (got "${P}")`
            } : (await et(t, w, {
                model: P ?? null,
                model_runtime: P !== null ? "pi" : null,
                pending_model_fork: null
            }), te("[session-manager] pi session model override updated", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                applied: "stored"
            }), {
                ok: !0,
                model: P,
                applied: "stored"
            });
            if (L === "grok") {
                let De = dJ(H?.adapter),
                    Oe = !!(De && (De.hasSession?.() ?? !0));
                if (P !== null && De && Oe) try {
                    await De.setModel({
                        modelId: P
                    })
                } catch (Gt) {
                    let ke = Gt instanceof Error ? Gt.message : String(Gt);
                    return Z("[session-manager] grok session/set_model failed", {
                        sessionKey: w,
                        model: P,
                        error: ke
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: ke
                    }
                }
                return await et(t, w, {
                    model: P ?? null,
                    model_runtime: P !== null ? "grok" : null,
                    pending_model_fork: null
                }), te("[session-manager] grok session model override updated", {
                    sessionKey: w,
                    model: P ?? "(reset to default)",
                    applied: P !== null && Oe ? "live" : "stored"
                }), {
                    ok: !0,
                    model: P,
                    applied: P !== null && Oe ? "live" : "stored"
                }
            }
            if (L === "codex") return await et(t, w, {
                model: P ?? null,
                model_runtime: P !== null ? "codex" : null,
                pending_model_fork: !0
            }), te("[session-manager] codex session model override updated", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: P,
                applied: "stored",
                pending_model_fork: !0
            };
            let G = H?.query,
                ee;
            if (P && G && typeof G.supportedModels == "function") try {
                ee = (await G.supportedModels()).some(Oe => Oe.value === P)
            } catch {}
            let we = await E(w, H, P, K).catch(De => (Z("[session-manager] model context profile classification failed — applying live", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                error: De instanceof Error ? De.message : String(De)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (we.outcome === "blocked") return Z("[session-manager] /model refused: unresolved model context profile", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                detail: we.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: we.detail
            };
            let le = we.outcome === "rebuild",
                ve = le ? "stored_pending_rebuild" : "stored",
                Be = null,
                at = H?.streamingState;
            if (!le && !!at && at?.closed === !1 && (P ?? null) === (at?.liveModel ?? null)) ve = "live";
            else if (!le && G && typeof G.setModel == "function") try {
                await G.setModel(P ?? void 0), ve = "live", at && !at.closed && (at.liveModel = P ?? void 0)
            } catch (De) {
                Z("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: w,
                    model: P ?? "(reset to default)",
                    error: De instanceof Error ? De.message : String(De)
                }), P && H && pJ(H, we.requirementKind) && (ve = "stored_pending_rebuild", Be = P)
            }
            return await et(t, w, {
                model: P ?? null,
                model_runtime: P !== null ? "claude" : null,
                pending_model_fork: null
            }), Be && H && NA(H, {
                model: Be,
                requirementKind: we.requirementKind,
                reason: "live-command"
            }), te("[session-manager] session model override updated", {
                sessionKey: w,
                model: P ?? "(reset to default)",
                applied: ve,
                listed: ee ?? "(no list consulted)",
                contextProfile: we.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model: P,
                applied: ve,
                listed: ee,
                contextProfile: we.requirementKind,
                ...we.contextWindow ? {
                    contextWindow: we.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(w, P) {
            let K = N.get(w),
                H = await ct(t, w).catch(() => null),
                L = await _(w, K),
                G = {
                    runtime: L,
                    storedEffort: H?.effort ?? void 0,
                    hasLiveQuery: !!K?.query
                },
                ee = await I(w, P).catch(le => (Z("[session-manager] /effort view: config scope unreadable", {
                    sessionKey: w,
                    error: le instanceof Error ? le.message : String(le)
                }), null)),
                we = jw(ee, L);
            return we && (G.configEffort = {
                ...we
            }), G
        },
        async setSessionEffort(w, P) {
            if (!ce) return {
                ok: !1,
                reason: "not_running"
            };
            let K = N.get(w),
                H = await _(w, K);
            if (H === "pi") return await et(t, w, {
                effort: P ?? null
            }), te("[session-manager] pi session effort override updated", {
                sessionKey: w,
                effort: P ?? "(reset to default)"
            }), {
                ok: !0,
                effort: P,
                applied: "stored"
            };
            if (H === "grok") {
                let ee = dJ(K?.adapter),
                    le = (await ct(t, w).catch(() => null))?.model ?? ee?.currentModelId?.(),
                    ve = !!(ee && (ee.hasSession?.() ?? !0) && le);
                if (P !== null) {
                    if (!ve || !ee || !le) return await et(t, w, {
                        effort: P
                    }), te("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: P,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort: P,
                        applied: "stored"
                    };
                    try {
                        await ee.setModel({
                            modelId: le,
                            reasoningEffort: P
                        })
                    } catch (Be) {
                        let at = Be instanceof Error ? Be.message : String(Be);
                        return Z("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey: w,
                            effort: P,
                            error: at
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: at
                        }
                    }
                    return await et(t, w, {
                        effort: P
                    }), te("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: P,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: P,
                        applied: "live"
                    }
                }
                if (ee && le && (ee.hasSession?.() ?? !0)) {
                    try {
                        await ee.setModel({
                            modelId: le
                        })
                    } catch (Be) {
                        let at = Be instanceof Error ? Be.message : String(Be);
                        return Z("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey: w,
                            error: at
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: at
                        }
                    }
                    return await et(t, w, {
                        effort: null
                    }), te("[session-manager] grok session effort override updated", {
                        sessionKey: w,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await et(t, w, {
                    effort: null
                }), te("[session-manager] grok session effort override updated", {
                    sessionKey: w,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (H === "codex") return await et(t, w, {
                effort: P ?? null
            }), te("[session-manager] codex session effort override updated", {
                sessionKey: w,
                effort: P ?? "(reset to default)"
            }), {
                ok: !0,
                effort: P,
                applied: "stored"
            };
            let L = K?.query,
                G = "stored";
            if (L && typeof L.applyFlagSettings == "function") try {
                await L.applyFlagSettings({
                    effortLevel: P ?? null
                }), G = "live", K?.streamingState && (K.streamingState.lastAppliedEffort = P ?? null)
            } catch (ee) {
                Z("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: w,
                    effort: P ?? "(reset to default)",
                    error: ee instanceof Error ? ee.message : String(ee)
                })
            }
            return await et(t, w, {
                effort: P ?? null
            }), te("[session-manager] session effort override updated", {
                sessionKey: w,
                effort: P ?? "(reset to default)",
                applied: G
            }), {
                ok: !0,
                effort: P,
                applied: G
            }
        },
        getActorView(w) {
            let P = N.get(w);
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
        hasQueuedWake: F,
        listActors() {
            let w = new Map;
            for (let [P, K] of N) K.actorRunId <= 0 && !F(K.sessionKey) || w.set(P, {
                sessionKey: K.sessionKey,
                status: K.status,
                health: "ok",
                idleSince: K.status === "idle" ? K.idleSince : void 0,
                attachedChannels: K.attachedChannels.size,
                sdkSessionId: K.sdkSessionId,
                origin: K.origin,
                jobId: K.jobId,
                runtime: K.runtime,
                activeToolCalls: [...K.activeToolCalls.values()]
            });
            return w
        },
        getSweeperActorState(w) {
            let P = N.get(w);
            return !P || P.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: P.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: P.lastActivityAt,
                lastTurnCompletedAt: P.lastTurnCompletedAt,
                spawnedAt: P.spawnedAt
            }
        },
        markAgentNotified(w) {
            let P = N.get(w);
            P && (P.agentNotifiedThisDrain = !0)
        }
    }
}
