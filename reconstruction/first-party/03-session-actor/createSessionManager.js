// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: Ilt, daemon.pretty.js:76852)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
    let {
        paths: t,
        bus: n,
        sdk: r,
        idleTimeoutMs: i = 36e5,
        heartbeatIntervalMs: o = 3e4
    } = e, s = r ?? createAgentSdkAdapter(), a = new _o(t), {
        listSessionInboxPendingNames: l,
        sessionInboxFreshNameVerdict: u,
        finalizeJobSession: c
    } = yve({
        paths: t,
        bus: n,
        jobManager: a
    }), d = e.codexAvailability ?? checkCodexAvailability, p = e.codexAdapterFactory ?? createCodexAppServerAdapter, f = null, m = () => (f || (f = d()), f), h = e.grokAvailability ?? checkGrokAvailability, g = e.grokAdapterFactory ?? createGrokAcpAdapter, y = e.piAdapterFactory ?? QP, w = null, v = () => (w || (w = h()), w), {
        toModelOptions: b,
        resolveRuntimeForModelCommand: R,
        resolveModelProfileScope: I,
        classifyModelTargetAgainstLiveGeneration: T
    } = Zve({
        paths: t,
        probeCodexAvailability: m
    }), {
        ensureStreamingSession: x
    } = ewe({
        paths: t,
        bus: n,
        resolvedSdk: s,
        classifyModelTargetAgainstLiveGeneration: T
    });
    async function S(_, k) {
        let M = k.trim();
        if (!M) return;
        let Y = du({
            channel_kind: Zv(_),
            session_key: _,
            payload: {
                text: M
            }
        });
        try {
            await fu(t, Y), n.emit("session.output", {
                sessionKey: _,
                record: Y
            })
        } catch (q) {
            Me("[session-manager] grok detached-turn outbox write failed", {
                sessionKey: _,
                error: q instanceof Error ? q.message : String(q)
            })
        }
    }
    let O = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        $ = e.maxConcurrentJob ?? 6,
        C = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: O,
            wakeQueue: []
        },
        A = {
            name: "job",
            activeCount: 0,
            maxConcurrent: $,
            wakeQueue: []
        };

    function j(_, k) {
        return hve(_, k) === "job" ? A : C
    }

    function P(_) {
        return C.wakeQueue.includes(_) || A.wakeQueue.includes(_)
    }

    function z(_) {
        if (_.wakeQueue.length === 0 || !V) return;
        let k = _.wakeQueue.findIndex(q => !Xn(q));
        if (k === -1) {
            st("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: _.name,
                queuedSessions: _.wakeQueue.length
            });
            return
        }
        let M = _.wakeQueue.splice(k, 1)[0];
        k > 0 && st("[session-manager] dequeue skipped archiving sessions", {
            skipped: k,
            sessionKey: M,
            pool: _.name
        }), st("[session-manager] dequeue queued wake", {
            sessionKey: M,
            pool: _.name,
            queuedSessions: _.wakeQueue.length
        });
        let Y = U.get(M);
        if (Y && Y.status === "idle" && !Y.holdsPoolSlot && Y.drainPromise) {
            Y.pendingWake = !0, Y.wakeResolver && (Y.wakeResolver(), Y.wakeResolver = null), st("[session-manager] resuming idle actor from dequeue", {
                sessionKey: M,
                actorRunId: Y.actorRunId,
                pool: _.name
            });
            return
        }
        if (_.activeCount >= _.maxConcurrent) {
            _.wakeQueue.unshift(M), st("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: M,
                pool: _.name,
                activeCount: _.activeCount
            });
            return
        }
        if (Y?.origin === "job" && Y.jobId) {
            let q = Y.jobId;
            D(M, {
                origin: "job",
                jobId: q
            })
        } else {
            let q = MH(M);
            D(M, q ?? void 0)
        }
    }
    let U = new Map,
        K = new Map,
        te = new Map,
        V = !1,
        re = 0,
        X = ({
            sessionKey: _,
            displayName: k,
            preempt: M,
            preemptBoundary: Y
        }) => {
            st("[session-manager] wake", {
                sessionKey: _,
                preempt: M ?? "allow",
                preemptBoundary: Y ?? "default"
            }), k && K.set(_, k), _e(_, {
                preempt: M,
                preemptBoundary: Y
            })
        },
        L = () => {
            ye()
        },
        ie = ({
            sessionKey: _,
            reason: k
        }) => {
            let M = U.get(_);
            if (!M) return;
            let Y = M.streamingAdapter !== null;
            M.streamingAdapter = null;
            let q = !1;
            M.streamingState && !M.streamingState.closed && (M.streamingState.needsRecreation = !0, q = !0), (Y || q) && Q("[session-manager] streamingAdapter torn down for session", {
                sessionKey: _,
                reason: k,
                hadAdapter: Y,
                stateMarked: q
            }), q && ht("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: _,
                reason: "instructions-drift",
                generation: M.streamingGeneration,
                sdk_session_id: M.sdkSessionId ?? null
            })
        };

    function fe(_) {
        return _.runtime !== "claude" ? _.adapter ? _.adapter : {
            run: async () => {
                throw new Error(`${_.runtime} runtime selected but its adapter was not built; refusing to fall through to Claude`)
            }
        } : _.origin !== "channel" || !s.createStreamingQuery ? s : (_.streamingAdapter || (_.streamingAdapter = {
            run: async k => {
                let M = await x(_, k);
                return await new Promise((Y, q) => {
                    if (M.closed) {
                        q(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    M.queue.enqueue({
                        input: k,
                        resolve: Y,
                        reject: q,
                        accepted: !1,
                        sessionId: k.sessionId,
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

    function _e(_, k) {
        if (!V) {
            st("[session-manager] wake ignored, manager not running", {
                sessionKey: _
            });
            return
        }
        if (Xn(_)) {
            st("[session-manager] wake suppressed, session is being archived", {
                sessionKey: _
            });
            return
        }
        let M = k?.preempt ?? "allow",
            Y = k?.preemptBoundary,
            q = U.get(_);
        if (q && q.wakeResolver) {
            st("[session-manager] wake delivered to idle actor", {
                sessionKey: _,
                actorRunId: q.actorRunId,
                status: q.status,
                preemptBoundary: Y ?? "default"
            }), q.wakeResolver(), q.wakeResolver = null;
            return
        }
        if (q && q.drainPromise && (q.status === "active" || q.status === "idle")) {
            let Se = !!q.query && q.streamingState?.currentTurn?.accepted === !0,
                He = !!q.adapter?.activeTurnId?.();
            if (M === "allow" && (Se || He) && q.admissionCallback && !q.admissionInProgress) {
                q.pendingWake = !0, q.admissionInProgress = !0;
                let it = q.admissionCallback;
                st("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: _,
                    actorRunId: q.actorRunId
                }), it().then(() => {
                    q.admissionInProgress = !1, q.wakeResolver?.()
                }, () => {
                    q.admissionInProgress = !1, q.wakeResolver?.()
                });
                return
            }
            if (q.status === "active" && q.currentAbortController)
                if (M === "force") {
                    let it = rw(q, "immediate", Y);
                    it === "immediate" ? st("[session-manager] wake: forced preempt", {
                        sessionKey: _,
                        actorRunId: q.actorRunId,
                        preemptBoundary: Y ?? "default"
                    }) : it === "defer_accept" ? st("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: _,
                        actorRunId: q.actorRunId
                    }) : it === "defer_tool_result" ? st("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: _,
                        actorRunId: q.actorRunId
                    }) : it === "defer_tool_use" && st("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: _,
                        actorRunId: q.actorRunId
                    })
                } else if (M === "allow") {
                let it = rw(q, "soft", Y);
                it === "defer_accept" ? st("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: _,
                    actorRunId: q.actorRunId
                }) : it === "defer_tool_use" ? st("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: _,
                    actorRunId: q.actorRunId
                }) : it === "defer_tool_result" ? st("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: _,
                    actorRunId: q.actorRunId
                }) : it === "immediate" && st("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: _,
                    actorRunId: q.actorRunId
                })
            } else st("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: _,
                actorRunId: q.actorRunId
            });
            q.pendingWake = !0, st("[session-manager] wake marked pending", {
                sessionKey: _,
                actorRunId: q.actorRunId,
                status: q.status
            });
            return
        }
        let se = j(_, q?.origin);
        if (se.activeCount >= se.maxConcurrent) {
            let Se = se.wakeQueue.includes(_);
            Se || se.wakeQueue.push(_), st("[session-manager] wake queued", {
                sessionKey: _,
                pool: se.name,
                activeCount: se.activeCount,
                maxConcurrent: se.maxConcurrent,
                alreadyQueued: Se,
                queuedSessions: se.wakeQueue.length
            });
            return
        }
        let ve = MH(_);
        ve ? (st("[session-manager] wake starting actor with inferred origin", {
            sessionKey: _,
            ...ve
        }), D(_, ve)) : (st("[session-manager] wake starting actor", {
            sessionKey: _
        }), D(_))
    }

    function D(_, k) {
        let M = U.get(_),
            Y = M?.attachedChannels ?? new Set,
            q = ++re,
            se = {
                sessionKey: _,
                actorRunId: q,
                sdkSessionId: M?.sdkSessionId,
                sdkSessionIdVerified: M?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: M?.streamingAdapter ?? null,
                streamingGeneration: M?.streamingGeneration ?? 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                isStreaming: !1,
                activeToolCalls: new Map,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: Y,
                origin: k?.origin ?? M?.origin ?? "channel",
                jobId: k?.jobId ?? M?.jobId,
                jobStateless: M?.jobStateless ?? !1,
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
                runtime: k?.runtime ?? M?.runtime ?? "claude",
                adapter: M?.adapter ?? null,
                adapterFacts: M?.adapterFacts,
                consecutiveConservativeRedrive: M?.consecutiveConservativeRedrive ?? !1
            };
        U.set(_, se);
        let ve = j(_, se.origin);
        ve.activeCount++, se.holdsPoolSlot = !0;
        let Se = K.get(_);
        if (Se && K.delete(_), VE(t, {
                session_key: _,
                display_name: Se,
                kind: se.origin === "job" ? "job" : se.origin === "system" ? "system" : _.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), Q("[session-manager] actor start", {
                sessionKey: _,
                actorRunId: q,
                sdkSessionId: se.sdkSessionId,
                origin: se.origin,
                jobId: se.jobId,
                pool: ve.name,
                activeCount: ve.activeCount,
                attachedChannels: se.attachedChannels.size,
                queuedSessions: ve.wakeQueue.length
            }), k?.preStart) {
            let He = k.preStart;
            se.drainPromise = He().catch(it => Me("[session-manager] preStart failed", it)).then(() => B(se))
        } else se.drainPromise = B(se)
    }
    async function B(_) {
        let {
            sessionKey: k
        } = _, M, Y, q = 0, se = 0, ve = !1, Se = [], He = 0, it = !1, pt = !1, Ae = null, bt;
        try {
            bt = await l(k)
        } catch (Ne) {
            J("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: k,
                error: Ne instanceof Error ? Ne.message : String(Ne)
            }), bt = new Set
        }
        st("[session-manager] drain loop begin", {
            sessionKey: k,
            actorRunId: _.actorRunId,
            origin: _.origin,
            jobId: _.jobId
        });
        try {
            if (!_.sdkSessionId && !_.pendingClear) {
                let Dt = await ut(t, k);
                Dt?.sdk_session_id && (_.sdkSessionId = Dt.sdk_session_id, Q("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: k,
                    sdkSessionId: Dt.sdk_session_id
                }))
            }
            if ((await ut(t, k))?.session_key || await Ye(t, k, {
                    session_key: k
                }), _.origin === "job" && !_.jobId) {
                await a.init();
                let Bt = (await a.listJobs()).find(qn => qn.session_key === k);
                Bt ? (_.jobId = Bt.id, ke("[session-manager] recovered jobId from active jobs", {
                    sessionKey: k,
                    jobId: Bt.id
                })) : J("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: k
                })
            }
            let Ne, we, Xe = !1,
                Pt, nr, Hs, wr = null,
                ro = !1;
            if (_.jobStateless = !1, _.origin === "job" && _.jobId) {
                let Dt = await a.getJob(_.jobId);
                if (wr = Dt, Ae = Dt?.state.last_scheduled_at ?? null, Dt?.execution_cwd && (await Bfe({
                        cwdRel: Dt.execution_context === "workspace" ? Dt.frontmatter.cwd_rel ?? null : null,
                        cwd: Dt.execution_cwd,
                        runtimeWorkspaceDir: Dt.runtime_workspace_dir,
                        context: Dt.execution_context
                    }), await Te(Dt.execution_cwd), await Ye(t, k, {
                        session_key: k,
                        cwd: Dt.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), Dt) {
                    Ne = Kv(Dt.frontmatter.cron), we = Dt.frontmatter.cron;
                    let Bt = Dt.frontmatter.stateless === !0;
                    if (Bt && Dt.frontmatter.cron === "keepalive") throw new Error(R2);
                    Xe = Bt, _.jobStateless = Xe, Pt = Dt.frontmatter.model, nr = {
                        piExtensions: Dt.frontmatter.piExtensions,
                        piSkills: Dt.frontmatter.piSkills,
                        piConfigIssues: Dt.frontmatter.piConfigIssues
                    };
                    let qn = Dt.frontmatter.runtime ?? void 0,
                        Ie = qn ?? ao(),
                        oe = qn ? "explicit" : "default";
                    if (Dt.frontmatter.prompt_mode !== void 0 && Ie === "codex" && J("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                            sessionKey: k,
                            jobId: _.jobId,
                            promptMode: Dt.frontmatter.prompt_mode,
                            runtimeSource: oe
                        }), Ie === "codex") {
                        let ne = await m();
                        ne.ok ? _.runtime = "codex" : (_.runtime = "claude", J("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: k,
                            jobId: _.jobId,
                            runtime_source: oe,
                            reason: ne.reason
                        }))
                    } else if (Ie === "grok") {
                        _.runtime = "grok";
                        let ne = await v();
                        ne.ok || (Hs = ne.reason, J("[session-manager] job requested grok but grok is unavailable", {
                            sessionKey: k,
                            jobId: _.jobId,
                            runtime_source: oe,
                            reason: ne.reason
                        }))
                    } else Ie === "pi" ? _.runtime = "pi" : _.runtime = "claude"
                }
            } else if (_.origin === "channel") {
                let Bt = (await ut(t, k))?.source_channel_id;
                if (Bt) {
                    let qn = await li(t, Bt).catch(() => null),
                        Ie = qn?.channel_kind,
                        oe = Ie ? await Jo(t.channelConfigDir, Ie).catch(() => null) : null,
                        Ht = qn?.runtime ?? oe?.runtime ?? void 0 ?? ao(),
                        Lt = qn?.runtime ? "explicit" : oe?.runtime ? "inherited" : "default";
                    if (Ht === "codex") {
                        let Ct = await m();
                        Ct.ok ? _.runtime = "codex" : (_.runtime = "claude", J("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: k,
                            sourceChannelId: Bt,
                            runtime_source: Lt,
                            reason: Ct.reason
                        }))
                    } else if (Ht === "grok") {
                        _.runtime = "grok";
                        let Ct = await v();
                        Ct.ok || (Hs = Ct.reason, J("[session-manager] channel requested grok but grok is unavailable", {
                            sessionKey: k,
                            sourceChannelId: Bt,
                            runtime_source: Lt,
                            reason: Ct.reason
                        }))
                    } else Ht === "pi" ? _.runtime = "pi" : _.runtime = "claude"
                }
            }
            for (; _.status !== "ended" && V;) {
                let Dt = Hs;
                if (_.runtime !== "codex") {
                    for (;;) {
                        let ct = _.streamingState,
                            Je = !!ct && !ct.closed && (ct.cliTurnTentative !== null || ct.currentTurn !== null);
                        if (!Je && !_.admissionInProgress) break;
                        if (_.pendingWake) {
                            _.pendingWake = !1;
                            continue
                        }
                        st("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: k,
                            actorRunId: _.actorRunId,
                            cliBusy: Je,
                            admissionInProgress: _.admissionInProgress
                        }), await n6(_, i)
                    }
                    if (!V || _.status === "ended") break
                }
                _.pendingClear && (_.sdkSessionId = void 0, _.pendingClear = !1, await Ye(t, k, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }).catch(() => {}));
                let Bt, qn = null;
                _.origin === "job" && _.jobId && (ro ? qn = await a.getJob(_.jobId).catch(() => null) : (ro = !0, qn = wr, wr = null));
                let {
                    instructions: Ie,
                    missionContent: oe
                } = await Jve(t, k, _, qn), ne = await ut(t, k), Ht = await runInstructionsFingerprintGuard(t, k, Ie, _.runtime, {
                    instructions_fingerprint: ne?.instructions_fingerprint,
                    mission_fingerprint: ne?.mission_fingerprint,
                    schema_version: ne?.schema_version,
                    sdk_session_id: ne?.sdk_session_id,
                    board_layer_hash: ne?.board_layer_hash,
                    instructions_nonboard_fingerprint: ne?.instructions_nonboard_fingerprint
                }, _.origin === "job" && _.jobId ? {
                    jobId: _.jobId
                } : void 0);
                Ht.clearedSdkSessionId && (_.sdkSessionId = void 0), Ht.gate2Fired && _.runtime === "claude" && (Ht.boardOnlyDrift ? _.streamingState && !_.streamingState.closed ? Q("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: k,
                    board_layer_hash: Ht.boardLayerHash
                }) : Q("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: k,
                    board_layer_hash: Ht.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: k,
                    reason: "instructions_drift"
                })), _.origin === "job" && _.jobId && (oe !== void 0 ? Bt = {
                    content: oe,
                    jobId: _.jobId,
                    cron: qn?.frontmatter.cron ?? "",
                    stateless: Xe,
                    acceptance: qn?.frontmatter.acceptance,
                    model: qn?.frontmatter.model ?? Pt,
                    sdkConfig: Gfe(qn?.frontmatter)
                } : J("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: k,
                    jobId: _.jobId
                })), _.status !== "ended" && (_.status = "active"), _.idleSince = void 0;
                let Lt = new Set,
                    Ct = Date.now(),
                    Yt = new AbortController;
                _.currentAbortController = Yt;
                let vt;
                try {
                    let ct = [..._.origin === "system" ? [] : [bpe], Epe, Mpe];
                    _.origin === "channel" && (ct.push(y_e), ct.push(Cu));
                    let Je = _.origin === "job" ? "job" : _.origin === "system" ? "system" : "foreground",
                        on = 0,
                        dr = mve();
                    if (_.admissionCallback = async () => {
                            try {
                                await EE(t, k);
                                let We = await Jy(t, k);
                                if (We.length === 0) return;
                                await RE(t, k, We);
                                let at = {},
                                    De = await batchDrainItems(t, We, {
                                        fallbackBatchSize: sB,
                                        mergeWindowMs: aB,
                                        perf: at
                                    }),
                                    mt = await ut(t, k),
                                    Mr = hh(t, k, mt ?? void 0),
                                    pn = [],
                                    Mi = [];
                                for (let lt of De.items) {
                                    if (!lt.eventId) continue;
                                    if (_.inflightEventIds.has(lt.eventId)) {
                                        Mi.push(lt.eventId);
                                        continue
                                    }
                                    if (await Yp(t, lt.eventId)) {
                                        Mi.push(lt.eventId);
                                        continue
                                    }
                                    let nt = lt.createdAt ? {
                                            notAfter: lt.createdAt
                                        } : void 0,
                                        ln = De.events.get(lt.eventId) ?? await td(t, lt.eventId, nt);
                                    if (!ln) {
                                        J(`[session-manager] mailbox event unresolved: session_key=${k} event_id=${lt.eventId} not_after=${nt?.notAfter??"none"} item_file=${lt.file??"none"}`);
                                        continue
                                    }
                                    pn.push({
                                        item: lt,
                                        event: ln,
                                        prompt: cB(ln, k)
                                    })
                                }
                                if (pn.length === 0) {
                                    Mi.length > 0 && await co(t, k, Mi);
                                    return
                                }
                                let mn = await lB(t, k, {
                                        allowedTools: ct,
                                        tools: dr,
                                        additionalDirectories: [t.memoryDir]
                                    }, pn, Mr, {
                                        pendingGatewayNotice: mt?.pending_gateway_notice,
                                        pendingInterruptedContext: mt?.pending_interrupted_context,
                                        pendingSkipRewind: mt?.pending_skip_rewind,
                                        lastEventAtWatermark: mt?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, at, lt => lt),
                                    $a = [...Mi, ...pn.map(lt => lt.item.eventId).filter(lt => !!lt)];
                                if (_.runtime === "codex" || _.runtime === "grok" || _.runtime === "pi") {
                                    let lt = _.adapter?.steerActiveTurn,
                                        Ge = mn.coalescedPromptText.trim(),
                                        nt = _.adapter?.activeTurnId?.(),
                                        ln = _.adapter?.activeTurnStartedAt?.(),
                                        Tr = !1;
                                    if (nt && ln !== void 0)
                                        if (_.adapter?.activeTurnSkipObserved?.() === !0) Tr = !0;
                                        else {
                                            let Vs = await ut(t, k).catch(() => null);
                                            if (Vs === null) Tr = !0, J("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: k
                                            });
                                            else {
                                                let rr = Date.parse(Vs.pending_skip_rewind?.skipped_at ?? "");
                                                Tr = Number.isFinite(rr) && rr >= ln
                                            }
                                        } if (!!lt && !!nt && !mn.isNotifyOnly && Ge.length > 0 && !Tr && lt && nt) {
                                        let yi = mn.batchEventIds.filter(rr => !_.inflightEventIds.has(rr));
                                        for (let rr of yi) _.inflightEventIds.add(rr);
                                        if (await lt(Ge, nt, mn.attachments).catch(() => !1)) {
                                            await co(t, k, $a);
                                            for (let rr of yi) _.inflightEventIds.delete(rr);
                                            Q("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: k,
                                                admittedItems: pn.length,
                                                batchEventIds: mn.batchEventIds
                                            })
                                        } else {
                                            for (let rr of yi) _.inflightEventIds.delete(rr);
                                            _.pendingWake = !0, Q("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: k,
                                                batchEventIds: mn.batchEventIds
                                            })
                                        }
                                    } else _.pendingWake = !0, Q("[session-manager] admission callback: codex no live turn, redraining", {
                                        sessionKey: k,
                                        admittedItems: pn.length,
                                        batchEventIds: mn.batchEventIds
                                    });
                                    return
                                }
                                let gi = _.streamingState;
                                if (!gi || gi.closed) return;
                                let xo = gi.currentTurn,
                                    lf = !!mn.attachments && mn.attachments.length > 0,
                                    Sl = mn.coalescedPromptText.trim();
                                if (!!xo && xo.accepted && !xo.skipCalled && !lf && !mn.isNotifyOnly && Sl.length > 0) {
                                    let lt = _.pendingSteer;
                                    if (lt && !lt.settled && lt.spawningTurn === xo) {
                                        let Ge = mn.batchEventIds.filter(nt => !_.inflightEventIds.has(nt));
                                        for (let nt of Ge) _.inflightEventIds.add(nt);
                                        lt.steerText = `${lt.steerText}
${Sl}`, lt.eventIds.push(...$a), lt.claimedEventIds.push(...Ge), lt.requeueLines.push(...pn.map(nt => nt.item.line)), lt.requeueEventIds.push(...pn.map(nt => nt.item.eventId)), lt.processedEventIds.push(...Mi), Q("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: k,
                                            admittedItems: pn.length,
                                            batchEventIds: mn.batchEventIds
                                        });
                                        return
                                    }
                                    if (!lt) {
                                        let Ge = mn.batchEventIds.filter(ln => !_.inflightEventIds.has(ln));
                                        for (let ln of Ge) _.inflightEventIds.add(ln);
                                        let nt = {
                                            steerText: Sl,
                                            eventIds: [...$a],
                                            claimedEventIds: [...Ge],
                                            enqueueAsNewTurn: async () => {
                                                let ln = [];
                                                for (let Eo = 0; Eo < nt.requeueLines.length; Eo += 1) {
                                                    let yi = nt.requeueLines[Eo],
                                                        Vs = nt.requeueEventIds[Eo];
                                                    try {
                                                        await ks(t, k, yi), ln.push(Vs)
                                                    } catch (rr) {
                                                        J("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: k,
                                                            eventId: Vs,
                                                            error: rr instanceof Error ? rr.message : String(rr)
                                                        })
                                                    }
                                                }
                                                let Tr = [...ln, ...nt.processedEventIds];
                                                if (Tr.length > 0) try {
                                                    await co(t, k, Tr)
                                                } catch (Eo) {
                                                    Q("[session-manager] steer fallback markDone error", {
                                                        sessionKey: k,
                                                        error: String(Eo)
                                                    })
                                                }
                                                for (let Eo of nt.claimedEventIds) _.inflightEventIds.delete(Eo);
                                                _.pendingWake = !0, Q("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: k,
                                                    eventIds: nt.eventIds,
                                                    requeued: ln.length,
                                                    requeueFailed: nt.requeueLines.length - ln.length
                                                })
                                            },
                                            spawningTurn: xo,
                                            requeueLines: pn.map(ln => ln.item.line),
                                            requeueEventIds: pn.map(ln => ln.item.eventId),
                                            processedEventIds: [...Mi],
                                            settled: !1
                                        };
                                        _.pendingSteer = nt, Q("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: k,
                                            admittedItems: pn.length,
                                            batchEventIds: mn.batchEventIds
                                        });
                                        return
                                    }
                                }
                                _.pendingWake = !0, _.wakeResolver?.()
                            } catch (We) {
                                Q("[session-manager] admission callback error", {
                                    sessionKey: k,
                                    error: String(We)
                                })
                            }
                        }, _.runtime === "codex" && !_.adapter) {
                        let We = (await ut(t, k))?.cwd;
                        We && await ensureAgentsMdSymlink(We).catch(() => {}), _.adapter = p({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: Pt,
                            dynamicTools: WC({
                                paths: t,
                                sessionKey: k,
                                bus: n,
                                sessionContextKind: Je,
                                notifyDepth: on,
                                jobScheduleType: Ne,
                                callerJobCron: we,
                                getSessionStatus: at => U.get(at)?.status,
                                onNotifyCalled: () => {
                                    _.agentNotifiedThisDrain = !0
                                }
                            })
                        })
                    }
                    if (_.runtime === "grok" && !_.adapter && !Dt) {
                        let We = await ut(t, k).catch(() => null);
                        _.adapter = g({
                            cwd: We?.cwd ?? t.workDir,
                            sdkSessionId: We?.sdk_session_id,
                            mcpServerFactory: () => Fh(t, {
                                sessionKey: k,
                                bus: n,
                                sessionContextKind: Je,
                                notifyDepth: on,
                                jobScheduleType: Ne,
                                callerRuntime: _.runtime,
                                callerJobCron: we,
                                getSessionStatus: at => U.get(at)?.status,
                                onNotifyCalled: () => {
                                    _.agentNotifiedThisDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text: at
                            }) => S(k, at)
                        })
                    }
                    if (_.runtime === "pi" && !Dt) {
                        let We = await ut(t, k).catch(() => null),
                            at = (We?.model_runtime === "pi" ? We.model : void 0) ?? Pt,
                            De = We?.effort ?? void 0,
                            mt = yv(),
                            {
                                settingsSeed: Mr,
                                defaultProjectTrust: pn,
                                unknownKeys: Mi,
                                readFailed: mn
                            } = _v(mt);
                        Mi.length > 0 && J("[session-manager] pi settings keys not classified (SDK bump gate)", {
                            sessionKey: k,
                            keys: Mi
                        });
                        let $a = !1,
                            gi = nr ?? await Sa(t, k).catch(() => ($a = !0, null));
                        gi?.piConfigIssues?.length && J("[session-manager] invalid pi.* config values ignored (defaults apply)", {
                            sessionKey: k,
                            issues: gi.piConfigIssues
                        });
                        let xo = gi?.piExtensions ?? "all",
                            lf = gi?.piSkills ?? "all",
                            Sl = h_e({
                                model: at,
                                thinkingLevel: De,
                                settingsSeed: Mr,
                                defaultProjectTrust: pn,
                                extensions: xo,
                                skills: lf,
                                instructionsFingerprint: m_e(no(k) === "channel", Ht)
                            }),
                            Gn = !mn && !$a;
                        if (Gn || J("[session-manager] pi construction facts unread, keeping the live worker", {
                                sessionKey: k,
                                seedReadFailed: mn,
                                configReadFailed: $a
                            }), _.adapter && _.adapterFacts !== Sl && Gn) {
                            let lt = _.adapter;
                            _.adapter = null, _.adapterFacts = void 0, Promise.resolve(lt.shutdown()).catch(Ge => {
                                J("[session-manager] stale pi adapter shutdown failed", {
                                    sessionKey: k,
                                    error: String(Ge)
                                })
                            })
                        }
                        if (!_.adapter)
                            if (!at) Dt = "pi binds its model when the worker is built, and this session has none. Send `/model <provider>/<modelId>` (channel sessions), or set `model: <provider>/<modelId>` in the job frontmatter, then send the message again.";
                            else {
                                let lt = lc.join(Yn(t, k), "pi"),
                                    Ge = {
                                        session_context_kind: Je
                                    };
                                _.adapter = y({
                                    cwd: We?.cwd ?? t.workDir,
                                    sdkSessionId: We?.sdk_session_id ?? Rlt(),
                                    sessionDir: lt,
                                    agentDir: mt,
                                    authPath: lc.join(mt, "auth.json"),
                                    modelsPath: lc.join(mt, "models.json"),
                                    modelsStorePath: lc.join(lt, "models-store.json"),
                                    settingsSeed: Mr,
                                    resources: {
                                        extensions: xo,
                                        skills: lf,
                                        default_project_trust: pn
                                    },
                                    model: at,
                                    thinkingLevel: De,
                                    workerCommand: gv(),
                                    env: {
                                        [oI]: t.daemonSocketPath,
                                        [sI]: lI({
                                            session_key: k,
                                            job_cron: we,
                                            job_schedule_type: Ne,
                                            ...Ge
                                        }),
                                        [aI]: JSON.stringify(Ge)
                                    },
                                    onToolEnd: nt => v_e(t, k, nt),
                                    logDebug: nt => ke(nt, {
                                        sessionKey: k
                                    }),
                                    logWarn: nt => J(nt, {
                                        sessionKey: k
                                    })
                                }), _.adapterFacts = Sl
                            }
                    }
                    if (!V || _.status === "ended") break;
                    let Sr = fe(_);
                    vt = await drainSessionMailbox(t, k, {
                        sdk: Sr,
                        usesStreamingAdapter: Sr === _.streamingAdapter,
                        bus: n,
                        abortController: Yt,
                        runtime: _.runtime,
                        runtimeUnavailableReason: Dt,
                        excludeEventIds: Qve(_),
                        actorSpawnedAt: _.spawnedAt,
                        actorLastTurnCompletedAt: _.lastTurnCompletedAt,
                        getStreamGeneration: () => _.streamingGeneration,
                        holdInputOpenForBackgroundAgents: _.runtime === "claude" && _.origin !== "channel",
                        jobContext: Bt,
                        memoryBoard: Ie.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: Ie.memoryBoard
                        } : void 0,
                        boardHash: Ie.memoryBoard ? Ht.boardLayerHash : void 0,
                        onBatchContext: We => {
                            if (on = We.maxNotifyDepth, We.eventIds)
                                for (let at of We.eventIds) _.inflightEventIds.add(at)
                        },
                        mcpServersFactory: () => ({
                            aladuo: Fh(t, {
                                sessionKey: k,
                                bus: n,
                                sessionContextKind: Je,
                                notifyDepth: on,
                                jobScheduleType: Ne,
                                callerRuntime: _.runtime,
                                callerJobCron: we,
                                getSessionStatus: We => U.get(We)?.status,
                                onNotifyCalled: () => {
                                    _.agentNotifiedThisDrain = !0
                                }
                            })
                        }),
                        allowedTools: ct,
                        tools: dr,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: o,
                        onSdkTurnStarted: () => {
                            q += 1;
                            let We = !ve;
                            if (ve = q > se, We && ve && _.origin === "job" && _.jobId) {
                                let at = _.jobId;
                                Se.push(a.updateState(at, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: Ae
                                }).catch(De => {
                                    J("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: k,
                                        jobId: at,
                                        error: De instanceof Error ? De.message : String(De)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            se += 1;
                            let We = ve && q <= se;
                            if (ve = q > se, We && _.origin === "job" && _.jobId) {
                                let at = _.jobId;
                                Se.push(a.updateState(at, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: Ae
                                }).catch(De => {
                                    J("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: k,
                                        jobId: at,
                                        error: De instanceof Error ? De.message : String(De)
                                    })
                                }))
                            }
                        },
                        onStream: (We, at, De) => {
                            _.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: k,
                                chunk: We,
                                isSidechain: at,
                                anchorEventId: De
                            })
                        },
                        onExecutionEvent: (We, at) => {
                            We.type === "tool_use" && (_.isStreaming = !1, _.activeToolCalls.set(We.toolUseId, {
                                toolName: We.toolName,
                                startedAtMs: Date.now()
                            }), _.pendingPreempt && _.pendingPreemptBoundary === "tool_use" && (_.pendingPreempt = !1, _.pendingPreemptBoundary = null, t6(_))), We.type === "tool_result" && (_.activeToolCalls.delete(We.toolUseId), _.pendingPreempt && _.pendingPreemptBoundary === "tool_result" && _.activeToolCalls.size === 0 && (_.pendingPreempt = !1, _.pendingPreemptBoundary = null, t6(_)));
                            let De = cve(We);
                            if (De && Lt.has(De)) return;
                            De && Lt.add(De);
                            let mt = dve(We);
                            if (mt) {
                                let Mr = We.type === "tool_use" || We.type === "tool_result" ? We.isSidechain : void 0;
                                n.emit("session.execution", {
                                    sessionKey: k,
                                    event: mt,
                                    anchorEventId: at,
                                    isSidechain: Mr
                                })
                            }
                        }
                    })
                } finally {
                    _.admissionCallback = null, _.admissionInProgress || _.inflightEventIds.clear(), _.currentAbortController === Yt && (_.currentAbortController = null), _.isStreaming = !1, _.activeToolCalls.clear(), _.pendingPreempt = !1, _.pendingPreemptBoundary = null
                }
                if (st("[session-manager] drain result", {
                        sessionKey: k,
                        actorRunId: _.actorRunId,
                        processed: vt.processed,
                        skipped: vt.skipped,
                        lockAcquired: vt.lockAcquired,
                        outboxRecords: vt.outboxRecords?.length ?? (vt.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - Ct
                    }), He += vt.processed, it = vt.mergeTransientFailure === !0, vt.cancelled && (pt = !0), vt.processed > 0 && (_.lastTurnCompletedAt = Date.now(), await Es(t, k, "last_error").catch(() => {})), vt.compacted && _.runtime === "claude" && _.streamingState && !_.streamingState.closed) {
                    let ct = Ie.memoryBoard ? Ht.boardLayerHash : void 0;
                    _.spawnBoardHash !== ct && (_.streamingState.needsRecreation = !0, ht("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: k,
                        reason: "board-refresh(B4)",
                        generation: _.streamingGeneration,
                        spawn_board_hash: _.spawnBoardHash ? _.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: ct ? ct.slice(0, 12) : null
                    }))
                }
                if (_.pendingClear) _.sdkSessionId = void 0, _.pendingClear = !1, await Ye(t, k, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }).catch(() => {}), Q("[session-manager] applied pending clear after drain", {
                    sessionKey: k,
                    actorRunId: _.actorRunId
                });
                else {
                    let ct = await ut(t, k);
                    if (ct?.sdk_session_id) {
                        let Je = !_.sdkSessionId,
                            on = _.sdkSessionId !== ct.sdk_session_id;
                        _.sdkSessionId = ct.sdk_session_id, (Je || on) && Q("[session-manager] sdk session bound", {
                            sessionKey: k,
                            actorRunId: _.actorRunId,
                            sdkSessionId: _.sdkSessionId,
                            isNewSession: Je
                        })
                    }
                }
                if (vt.lastReplyText && (Y = vt.lastReplyText), vt.outboxRecords && vt.outboxRecords.length > 0) {
                    st("[session-manager] emitting outbox records", {
                        sessionKey: k,
                        actorRunId: _.actorRunId,
                        count: vt.outboxRecords.length
                    });
                    for (let ct of vt.outboxRecords) n.emit("session.output", {
                        sessionKey: ct.session_key,
                        record: ct
                    })
                } else if (vt.lastOutboxRecord) st("[session-manager] emitting single outbox record", {
                    sessionKey: k,
                    actorRunId: _.actorRunId,
                    recordId: vt.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: k,
                    record: vt.lastOutboxRecord
                });
                else if (_.origin === "channel" && vt.processed > 0 && !vt.cancelled) {
                    st("[session-manager] drain produced no output, emitting stream_end", {
                        sessionKey: k,
                        actorRunId: _.actorRunId,
                        turnSkipped: vt.turnSkipped === !0
                    });
                    let ct = vt.sdkTurns?.length ? vt.sdkTurns : [{
                        anchorEventId: void 0,
                        skipped: vt.turnSkipped === !0
                    }];
                    for (let Je of ct) n.emit("session.stream_end", {
                        sessionKey: _.sessionKey,
                        reason: Je.skipped ? "skipped" : "interrupted",
                        anchorEventId: Je.anchorEventId
                    })
                }
                if (vt.processed === 0) {
                    if (_.origin === "job" || _.origin === "system") {
                        st("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: k,
                            actorRunId: _.actorRunId,
                            origin: _.origin,
                            jobId: _.jobId
                        });
                        break
                    }
                    if (_.pendingWake) {
                        _.pendingWake = !1, st("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: k,
                            actorRunId: _.actorRunId
                        });
                        continue
                    }
                    if (_.status = "idle", _.idleSince = new Date().toISOString(), _.pendingWake) {
                        _.pendingWake = !1, st("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: k,
                            actorRunId: _.actorRunId
                        });
                        continue
                    }
                    if (st("[session-manager] idle", {
                            sessionKey: k,
                            actorRunId: _.actorRunId,
                            attachedChannels: _.attachedChannels.size
                        }), _.holdsPoolSlot) {
                        let Je = j(k, _.origin);
                        Je.activeCount--, _.holdsPoolSlot = !1, st("[session-manager] released pool slot (idle)", {
                            sessionKey: k,
                            pool: Je.name,
                            activeCount: Je.activeCount
                        }), z(Je)
                    }
                    let ct = !1;
                    for (;;) {
                        let Je = !1,
                            on = !1;
                        for (; _.status === "idle";) {
                            if (_.pendingWake) {
                                _.pendingWake = !1, Je = !0;
                                break
                            }
                            if (!V) {
                                on = !0;
                                break
                            }
                            if (await n6(_, i) || _.status !== "idle") {
                                Je = !0;
                                break
                            }
                            if (_.attachedChannels.size > 0) {
                                st("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey: k,
                                    actorRunId: _.actorRunId,
                                    attachedChannels: _.attachedChannels.size
                                }), _.streamingState && !_.streamingState.closed && ht("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey: k,
                                    generation: _.streamingGeneration,
                                    sdk_session_id: _.sdkSessionId ?? null
                                }), await sf(_), uO(_);
                                continue
                            }
                            break
                        }
                        if (on) {
                            ct = !0;
                            break
                        }
                        if (!Je && _.status === "idle") {
                            st("[session-manager] idle timeout, no attachments, exiting", {
                                sessionKey: k,
                                actorRunId: _.actorRunId
                            }), _.streamingState && !_.streamingState.closed && ht("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                sessionKey: k,
                                generation: _.streamingGeneration,
                                sdk_session_id: _.sdkSessionId ?? null
                            }), ct = !0;
                            break
                        }
                        if (Je && !_.holdsPoolSlot) {
                            let dr = j(k, _.origin);
                            if (dr.activeCount >= dr.maxConcurrent) {
                                dr.wakeQueue.includes(k) || dr.wakeQueue.unshift(k), st("[session-manager] woken idle actor re-queued (pool full)", {
                                    sessionKey: k,
                                    pool: dr.name,
                                    activeCount: dr.activeCount
                                }), _.pendingWake = !1;
                                continue
                            }
                            dr.activeCount++, _.holdsPoolSlot = !0, st("[session-manager] re-acquired pool slot (woken)", {
                                sessionKey: k,
                                pool: dr.name,
                                activeCount: dr.activeCount
                            })
                        }
                        break
                    }
                    if (ct) break
                }
            }
        } catch (Ne) {
            Me(`[session-manager] error in drain loop for ${k}:`, Ne), M = Ne, await Ye(t, k, {
                last_error: {
                    message: Ne instanceof Error ? Ne.message : String(Ne),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            await sf(_), _.currentAbortController = null, _.streamingAdapter = null, _.isStreaming = !1, _.activeToolCalls.clear(), _.pendingPreempt = !1, _.pendingPreemptBoundary = null, await uO(_);
            let Ne = j(k, _.origin);
            if (_.holdsPoolSlot && (Ne.activeCount--, _.holdsPoolSlot = !1), _.origin === "job" && _.jobId) {
                Se.length > 0 && await Promise.allSettled(Se);
                try {
                    await c(_, {
                        runStarted: ve,
                        cancelled: pt,
                        processedCount: He,
                        claimCursor: Ae,
                        error: M,
                        resultText: Y
                    })
                } finally {
                    _.status = "ended"
                }
            } else _.status = "ended";
            if (_.pendingWake = !1, V && klt(Yn(t, k)) && !Xn(k)) {
                let Xe = await u(k, bt);
                Xe === "fresh" ? (_.consecutiveConservativeRedrive = !1, st("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: k,
                    actorRunId: _.actorRunId
                }), _e(k, {
                    preempt: "never"
                })) : Xe === "conservative" || it ? _.consecutiveConservativeRedrive ? J("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: k,
                    actorRunId: _.actorRunId
                }) : (_.consecutiveConservativeRedrive = !0, st("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: k,
                    actorRunId: _.actorRunId
                }), _e(k, {
                    preempt: "never"
                })) : _.consecutiveConservativeRedrive = !1
            }
            Q("[session-manager] actor end", {
                sessionKey: k,
                actorRunId: _.actorRunId,
                sdkSessionId: _.sdkSessionId,
                pool: Ne.name,
                activeCount: Ne.activeCount,
                origin: _.origin,
                jobId: _.jobId,
                attachedChannels: _.attachedChannels.size,
                queuedSessions: Ne.wakeQueue.length
            }), z(Ne)
        }
    }

    function F(_, k) {
        if (!V) return;
        if (Xn(k)) {
            st("[session-manager] skip job spawn, session is being archived", {
                jobId: _,
                sessionKey: k
            });
            return
        }
        let M = U.get(k);
        if (M && M.status !== "ended") {
            st("[session-manager] skip duplicate job spawn", {
                jobId: _,
                sessionKey: k,
                actorStatus: M.status
            });
            return
        }
        if (A.activeCount >= A.maxConcurrent) {
            A.wakeQueue.includes(k) || A.wakeQueue.push(k), M ? (M.origin = "job", M.jobId = _) : U.set(k, {
                sessionKey: k,
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
        D(k, {
            origin: "job",
            jobId: _
        }), (async () => {
            try {
                let Y = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: _
                    },
                    session_key: k,
                    payload: {
                        job_id: _
                    }
                });
                await atomicAppendEvent(t, Y), n.emit("job.spawned", {
                    jobId: _,
                    sessionKey: k
                })
            } catch (Y) {
                Me("[session-manager] error recording job spawn", Y)
            }
        })()
    }
    async function W(_, k) {
        let Y = (te.get(_) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (Dr(_) !== "channel") return;
            let q = Zv(_),
                se = new Date().toISOString(),
                ve = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: q,
                        name: "session-manager"
                    },
                    session_key: _,
                    payload: {
                        session_key: _,
                        channel_kind: q,
                        channel_id: k,
                        attached_at: se
                    }
                });
            await atomicAppendEvent(t, ve)
        }).finally(() => {
            te.get(_) === Y && te.delete(_)
        });
        te.set(_, Y), await Y
    }

    function ye() {
        for (let _ of U.values()) _.status = "ended", uO(_), _.streamAbortController && !_.streamAbortController.signal.aborted && _.streamAbortController.abort(), typeof _.query?.close == "function" && _.query.close(), _.query = null, _.streamAbortController = null, _.currentAbortController && !_.currentAbortController.signal.aborted && _.currentAbortController.abort(), _.currentAbortController = null, _.wakeResolver && (_.wakeResolver(), _.wakeResolver = null)
    }
    async function ge() {
        if (te.size === 0) return;
        let _ = Array.from(te.values()),
            k = !1,
            M = new Promise(Y => setTimeout(() => {
                k = !0, Y()
            }, 3e4));
        await Promise.race([Promise.allSettled(_).then(() => {}), M]), k && J("[session-manager] shutdown abandoned pending attach writes after the fallback", {
            pending: _.length
        })
    }
    async function Be(_) {
        let k;
        try {
            k = xlt(lc.join(Tlt(), "aladuo-pi-catalog-"));
            let M = yv(),
                {
                    settingsSeed: Y,
                    defaultProjectTrust: q
                } = _v(M),
                se = await Sa(t, _).catch(() => null),
                ve = await ut(t, _).catch(() => null),
                Se = await c_e({
                    cwd: ve?.cwd ?? t.workDir,
                    agentDir: M,
                    authPath: lc.join(M, "auth.json"),
                    modelsPath: lc.join(M, "models.json"),
                    modelsStorePath: lc.join(k, "models-store.json"),
                    settingsSeed: Y,
                    resources: {
                        extensions: se?.piExtensions ?? "all",
                        default_project_trust: q
                    },
                    workerCommand: gv(),
                    logDebug: He => ke("[pi-catalog] " + He)
                });
            return Se.length > 0 ? Se : void 0
        } catch (M) {
            J("[session-manager] pi model catalog failed", {
                sessionKey: _,
                error: String(M)
            });
            return
        } finally {
            try {
                k && Elt(k, {
                    recursive: !0,
                    force: !0
                })
            } catch {}
        }
    }
    return {
        async start() {
            if (!V) {
                V = !0, n.on("session.wake", X), n.on("shutdown", L), n.on("session.streaming_invalidated", ie);
                try {
                    let _ = await rehydrateSessionState(t);
                    for (let k of _) {
                        if (Xn(k)) {
                            st("[session-manager] skip hydrating session being archived", {
                                sessionKey: k
                            });
                            continue
                        }
                        let Y = (await ut(t, k))?.cwd;
                        if (Y && !gve(Y)) {
                            J("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: k,
                                cwd: Y
                            });
                            continue
                        }
                        _e(k, {
                            preempt: "never"
                        })
                    }
                } catch (_) {
                    Me("[session-manager] error hydrating sessions:", _)
                }
                Q("[session-manager] started", {
                    channelActive: C.activeCount,
                    channelQueued: C.wakeQueue.length,
                    jobActive: A.activeCount,
                    jobQueued: A.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!V) return;
            V = !1, n.off("session.wake", X), n.off("shutdown", L), n.off("session.streaming_invalidated", ie), ye();
            let _ = Array.from(U.values()).map(k => k.drainPromise).filter(k => k !== null);
            if (_.length > 0) {
                let k = Array.from(U.values()).filter(q => q.drainPromise !== null),
                    M = !1,
                    Y = new Promise(q => setTimeout(() => {
                        M = !0, q()
                    }, 3e4));
                await Promise.race([Promise.all(_), Y]), M && J("[session-manager] shutdown abandoned running drains after the fallback", {
                    sessions: k.map(q => q.sessionKey),
                    runtimes: k.map(q => q.runtime)
                })
            }
            await ge(), U.clear(), C.wakeQueue.length = 0, C.activeCount = 0, A.wakeQueue.length = 0, A.activeCount = 0, Q("[session-manager] stopped")
        },
        wakeSession: _e,
        getActor(_) {
            return U.get(_)
        },
        activeCount() {
            return C.activeCount + A.activeCount
        },
        activeChannelCount() {
            return C.activeCount
        },
        activeJobCount() {
            return A.activeCount
        },
        isRunning() {
            return V
        },
        attachChannel(_, k) {
            let M = U.get(_);
            M || (M = {
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
            }, U.set(_, M)), M.attachedChannels.add(k), st("[session-manager] channel attached", {
                sessionKey: _,
                channelId: k,
                totalAttachments: M.attachedChannels.size
            }), W(_, k).catch(Y => {
                J("[session-manager] failed to emit channel.attached event", {
                    sessionKey: _,
                    channelId: k,
                    error: String(Y)
                })
            })
        },
        detachChannel(_, k) {
            let M = U.get(_);
            M && (M.attachedChannels.delete(k), st("[session-manager] channel detached", {
                sessionKey: _,
                channelId: k,
                remainingAttachments: M.attachedChannels.size
            }), M.attachedChannels.size === 0 && M.status === "idle" && M.wakeResolver && (M.wakeResolver(), M.wakeResolver = null))
        },
        hasAttachedChannels(_) {
            let k = U.get(_);
            return k ? k.attachedChannels.size > 0 : !1
        },
        spawnJobSession(_, k) {
            F(_, k)
        },
        async interruptSession(_) {
            if (!V) return {
                interrupted: !1,
                reason: "not_running"
            };
            let k = U.get(_);
            return k ? !k.query && (!k.currentAbortController || k.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : k.streamAbortController && !k.streamAbortController.signal.aborted ? (Q("[session-manager] interrupt: stopping streaming session", {
                sessionKey: _,
                actorRunId: k.actorRunId
            }), await sf(k, "cancel-interrupt"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (rw(k, "immediate") === "immediate" && Q("[session-manager] interrupt requested", {
                sessionKey: _,
                actorRunId: k.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(_) {
            if (!V) return {
                cleared: !1,
                reason: "not_running"
            };
            let k = U.get(_),
                M = k?.sdkSessionId;
            if (k && (k.pendingClear = !0, k.sdkSessionId = void 0, k.sdkSessionIdVerified = !1), k?.streamAbortController && !k.streamAbortController.signal.aborted ? await sf(k, "clear") : k?.currentAbortController && !k.currentAbortController.signal.aborted && rw(k, "immediate"), await Ye(t, _, {
                    sdk_session_id: null,
                    pending_fork_to: null
                }), (k?.runtime === "pi" || k?.runtime === "grok") && k.adapter) {
                let Y = k.adapter;
                k.adapter = null, k.adapterFacts = void 0, await Promise.resolve(Y.shutdown()).catch(q => {
                    J("[session-manager] runtime adapter shutdown on clear failed", {
                        sessionKey: _,
                        runtime: k.runtime,
                        error: String(q)
                    })
                })
            }
            return Q("[session-manager] SDK session cleared", {
                sessionKey: _,
                actorRunId: k?.actorRunId,
                previousSessionId: M
            }), {
                cleared: !0,
                previousSessionId: M
            }
        },
        async getSessionModelView(_, k) {
            let M = U.get(_),
                Y = await ut(t, _).catch(() => null),
                q = await R(_, M),
                se = {
                    runtime: q,
                    storedModel: Y?.model,
                    hasLiveQuery: !!M?.query
                };
            if (q === "pi") return se.piProviders = await Be(_), se;
            let ve = M?.query;
            if (ve && typeof ve.supportedModels == "function") try {
                se.available = b(await ve.supportedModels())
            } catch {}
            try {
                let Se = await I(_, k);
                if (q === "claude") {
                    let He = Object.entries(Se.claudeModelProfiles ?? {}).map(([Ae, bt]) => {
                        let Ne = fye(bt.baseUrl);
                        return {
                            model: Ae,
                            contextWindow: bt.cap,
                            source: bt.source,
                            ...Ne ? {
                                endpointHost: Ne
                            } : {}
                        }
                    });
                    He.length > 0 && (se.profiles = He.sort((Ae, bt) => Ae.model.localeCompare(bt.model)));
                    let it = Object.entries(Se.claudeModelAliases ?? {}).map(([Ae, bt]) => ({
                        tier: Ae,
                        model: bt.model,
                        source: bt.source
                    })).sort((Ae, bt) => Ae.tier.localeCompare(bt.tier));
                    if (it.length > 0 && (se.aliases = it), !se.storedModel) {
                        let Ae = await ph({
                            model: null,
                            cwd: hh(t, _, Y ?? void 0).cwd,
                            daemonEnv: process.env,
                            mergedCatalog: Se.claudeModelProfiles ?? {},
                            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                            issues: Se.claudeModelProfileIssues
                        });
                        Ae.kind === "profiled-external" && Ae.modelOrigin && (se.cliDefaultModel = {
                            model: Ae.model,
                            origin: Ae.modelOrigin
                        })
                    }
                    let pt = [...Se.claudeModelProfileIssues ?? [], ...Se.claudeModelAliasIssues ?? []];
                    pt.length > 0 && (se.profileIssues = pt.map(Ae => ({
                        ...Ae.model !== void 0 ? {
                            model: Ae.model
                        } : {},
                        reason: Ae.reason,
                        ...Ae.layer !== void 0 ? {
                            layer: Ae.layer
                        } : {}
                    })))
                }
            } catch (Se) {
                J("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: _,
                    error: Se instanceof Error ? Se.message : String(Se)
                })
            }
            return se
        },
        async setSessionModel(_, k, M) {
            if (!V) return {
                ok: !1,
                reason: "not_running"
            };
            let Y = U.get(_),
                q = await R(_, Y);
            if (q === "pi") return k !== null && !e0(k) ? {
                ok: !1,
                reason: "runtime_rejected",
                detail: `pi model ids are canonical "provider/modelId" (got "${k}")`
            } : (await Ye(t, _, {
                model: k ?? null,
                model_runtime: k !== null ? "pi" : null,
                pending_model_fork: null
            }), Q("[session-manager] pi session model override updated", {
                sessionKey: _,
                model: k ?? "(reset to default)",
                applied: "stored"
            }), {
                ok: !0,
                model: k,
                applied: "stored"
            });
            if (q === "grok") {
                let Ne = XH(Y?.adapter),
                    we = !!(Ne && (Ne.hasSession?.() ?? !0));
                if (k !== null && Ne && we) try {
                    await Ne.setModel({
                        modelId: k
                    })
                } catch (Xe) {
                    let Pt = Xe instanceof Error ? Xe.message : String(Xe);
                    return J("[session-manager] grok session/set_model failed", {
                        sessionKey: _,
                        model: k,
                        error: Pt
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: Pt
                    }
                }
                return await Ye(t, _, {
                    model: k ?? null,
                    model_runtime: k !== null ? "grok" : null,
                    pending_model_fork: null
                }), Q("[session-manager] grok session model override updated", {
                    sessionKey: _,
                    model: k ?? "(reset to default)",
                    applied: k !== null && we ? "live" : "stored"
                }), {
                    ok: !0,
                    model: k,
                    applied: k !== null && we ? "live" : "stored"
                }
            }
            if (q === "codex") return await Ye(t, _, {
                model: k ?? null,
                model_runtime: k !== null ? "codex" : null,
                pending_model_fork: !0
            }), Q("[session-manager] codex session model override updated", {
                sessionKey: _,
                model: k ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: k,
                applied: "stored",
                pending_model_fork: !0
            };
            let se = Y?.query,
                ve;
            if (k && se && typeof se.supportedModels == "function") try {
                ve = (await se.supportedModels()).some(we => we.value === k)
            } catch {}
            let Se = await T(_, Y, k, M).catch(Ne => (J("[session-manager] model context profile classification failed — applying live", {
                sessionKey: _,
                model: k ?? "(reset to default)",
                error: Ne instanceof Error ? Ne.message : String(Ne)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (Se.outcome === "blocked") return J("[session-manager] /model refused: unresolved model context profile", {
                sessionKey: _,
                model: k ?? "(reset to default)",
                detail: Se.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: Se.detail
            };
            let He = Se.outcome === "rebuild",
                it = He ? "stored_pending_rebuild" : "stored",
                pt = null,
                Ae = Y?.streamingState;
            if (!He && !!Ae && Ae?.closed === !1 && (k ?? null) === (Ae?.liveModel ?? null)) it = "live";
            else if (!He && se && typeof se.setModel == "function") try {
                await se.setModel(k ?? void 0), it = "live", Ae && !Ae.closed && (Ae.liveModel = k ?? void 0)
            } catch (Ne) {
                J("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: _,
                    model: k ?? "(reset to default)",
                    error: Ne instanceof Error ? Ne.message : String(Ne)
                }), k && Y && e6(Y, Se.requirementKind) && (it = "stored_pending_rebuild", pt = k)
            }
            return await Ye(t, _, {
                model: k ?? null,
                model_runtime: k !== null ? "claude" : null,
                pending_model_fork: null
            }), pt && Y && oO(Y, {
                model: pt,
                requirementKind: Se.requirementKind,
                reason: "live-command"
            }), Q("[session-manager] session model override updated", {
                sessionKey: _,
                model: k ?? "(reset to default)",
                applied: it,
                listed: ve ?? "(no list consulted)",
                contextProfile: Se.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model: k,
                applied: it,
                listed: ve,
                contextProfile: Se.requirementKind,
                ...Se.contextWindow ? {
                    contextWindow: Se.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(_) {
            let k = U.get(_),
                M = await ut(t, _).catch(() => null);
            return {
                runtime: await R(_, k),
                storedEffort: M?.effort ?? void 0,
                hasLiveQuery: !!k?.query
            }
        },
        async setSessionEffort(_, k) {
            if (!V) return {
                ok: !1,
                reason: "not_running"
            };
            let M = U.get(_),
                Y = await R(_, M);
            if (Y === "pi") return await Ye(t, _, {
                effort: k ?? null
            }), Q("[session-manager] pi session effort override updated", {
                sessionKey: _,
                effort: k ?? "(reset to default)"
            }), {
                ok: !0,
                effort: k,
                applied: "stored"
            };
            if (Y === "grok") {
                let ve = XH(M?.adapter),
                    He = (await ut(t, _).catch(() => null))?.model ?? ve?.currentModelId?.(),
                    it = !!(ve && (ve.hasSession?.() ?? !0) && He);
                if (k !== null) {
                    if (!it || !ve || !He) return await Ye(t, _, {
                        effort: k
                    }), Q("[session-manager] grok session effort override updated", {
                        sessionKey: _,
                        effort: k,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort: k,
                        applied: "stored"
                    };
                    try {
                        await ve.setModel({
                            modelId: He,
                            reasoningEffort: k
                        })
                    } catch (pt) {
                        let Ae = pt instanceof Error ? pt.message : String(pt);
                        return J("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey: _,
                            effort: k,
                            error: Ae
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Ae
                        }
                    }
                    return await Ye(t, _, {
                        effort: k
                    }), Q("[session-manager] grok session effort override updated", {
                        sessionKey: _,
                        effort: k,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: k,
                        applied: "live"
                    }
                }
                if (ve && He && (ve.hasSession?.() ?? !0)) {
                    try {
                        await ve.setModel({
                            modelId: He
                        })
                    } catch (pt) {
                        let Ae = pt instanceof Error ? pt.message : String(pt);
                        return J("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey: _,
                            error: Ae
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Ae
                        }
                    }
                    return await Ye(t, _, {
                        effort: null
                    }), Q("[session-manager] grok session effort override updated", {
                        sessionKey: _,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await Ye(t, _, {
                    effort: null
                }), Q("[session-manager] grok session effort override updated", {
                    sessionKey: _,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (Y === "codex") return await Ye(t, _, {
                effort: k ?? null
            }), Q("[session-manager] codex session effort override updated", {
                sessionKey: _,
                effort: k ?? "(reset to default)"
            }), {
                ok: !0,
                effort: k,
                applied: "stored"
            };
            let q = M?.query,
                se = "stored";
            if (q && typeof q.applyFlagSettings == "function") try {
                await q.applyFlagSettings({
                    effortLevel: k ?? null
                }), se = "live"
            } catch (ve) {
                J("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: _,
                    effort: k ?? "(reset to default)",
                    error: ve instanceof Error ? ve.message : String(ve)
                })
            }
            return await Ye(t, _, {
                effort: k ?? null
            }), Q("[session-manager] session effort override updated", {
                sessionKey: _,
                effort: k ?? "(reset to default)",
                applied: se
            }), {
                ok: !0,
                effort: k,
                applied: se
            }
        },
        getActorView(_) {
            let k = U.get(_);
            return !k || k.actorRunId <= 0 ? null : {
                sessionKey: k.sessionKey,
                status: k.status,
                health: "ok",
                idleSince: k.status === "idle" ? k.idleSince : void 0,
                attachedChannels: k.attachedChannels.size,
                sdkSessionId: k.sdkSessionId,
                origin: k.origin,
                jobId: k.jobId,
                runtime: k.runtime,
                activeToolCalls: [...k.activeToolCalls.values()]
            }
        },
        hasQueuedWake: P,
        listActors() {
            let _ = new Map;
            for (let [k, M] of U) M.actorRunId <= 0 && !P(M.sessionKey) || _.set(k, {
                sessionKey: M.sessionKey,
                status: M.status,
                health: "ok",
                idleSince: M.status === "idle" ? M.idleSince : void 0,
                attachedChannels: M.attachedChannels.size,
                sdkSessionId: M.sdkSessionId,
                origin: M.origin,
                jobId: M.jobId,
                runtime: M.runtime,
                activeToolCalls: [...M.activeToolCalls.values()]
            });
            return _
        },
        getSweeperActorState(_) {
            let k = U.get(_);
            return !k || k.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: k.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: k.lastActivityAt,
                lastTurnCompletedAt: k.lastTurnCompletedAt,
                spawnedAt: k.spawnedAt
            }
        },
        markAgentNotified(_) {
            let k = U.get(_);
            k && (k.agentNotifiedThisDrain = !0)
        }
    }
}
