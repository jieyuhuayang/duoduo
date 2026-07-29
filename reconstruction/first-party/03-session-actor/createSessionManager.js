// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: oet, daemon.pretty.js:71671)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
    let {
        paths: t,
        bus: n,
        sdk: r,
        idleTimeoutMs: i = 36e5,
        heartbeatIntervalMs: s = 3e4
    } = e, o = r ?? createAgentSdkAdapter(), a = e.codexAvailability ?? checkCodexAvailability, c = e.codexAdapterFactory ?? createCodexAppServerAdapter, u = null, l = () => (u || (u = a()), u), d = y => y.map(T => ({
        value: T.value,
        displayName: T.displayName
    }));
    async function p(y, T) {
        if (T?.runtime === "codex") return "codex";
        let A = (await At(t, y).catch(() => null))?.source_channel_id;
        if (!A) return T?.runtime ?? "claude";
        let z = await Di(t, A).catch(() => null),
            te = z?.channel_kind,
            ke = te ? await ta(t.channelConfigDir, te).catch(() => null) : null;
        return (z?.runtime ?? ke?.runtime) === "codex" && (await l()).ok ? "codex" : T?.runtime ?? "claude"
    }
    let f = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        m = e.maxConcurrentJob ?? 6,
        h = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: f,
            wakeQueue: []
        },
        _ = {
            name: "job",
            activeCount: 0,
            maxConcurrent: m,
            wakeQueue: []
        };

    function b(y, T) {
        return iet(y, T) === "job" ? _ : h
    }

    function w(y) {
        return h.wakeQueue.includes(y) || _.wakeQueue.includes(y)
    }

    function v(y) {
        if (y.wakeQueue.length === 0 || !E) return;
        let T = y.wakeQueue.findIndex(z => !lr(z));
        if (T === -1) {
            nt("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: y.name,
                queuedSessions: y.wakeQueue.length
            });
            return
        }
        let D = y.wakeQueue.splice(T, 1)[0];
        T > 0 && nt("[session-manager] dequeue skipped archiving sessions", {
            skipped: T,
            sessionKey: D,
            pool: y.name
        }), nt("[session-manager] dequeue queued wake", {
            sessionKey: D,
            pool: y.name,
            queuedSessions: y.wakeQueue.length
        });
        let A = g.get(D);
        if (A && A.status === "idle" && !A.holdsPoolSlot && A.drainPromise) {
            A.pendingWake = !0, A.wakeResolver && (A.wakeResolver(), A.wakeResolver = null), nt("[session-manager] resuming idle actor from dequeue", {
                sessionKey: D,
                actorRunId: A.actorRunId,
                pool: y.name
            });
            return
        }
        if (y.activeCount >= y.maxConcurrent) {
            y.wakeQueue.unshift(D), nt("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: D,
                pool: y.name,
                activeCount: y.activeCount
            });
            return
        }
        if (A?.origin === "job" && A.jobId) {
            let z = A.jobId;
            ot(D, {
                origin: "job",
                jobId: z
            })
        } else {
            let z = N2(D);
            ot(D, z ?? void 0)
        }
    }
    let g = new Map,
        x = new Map,
        k = new Map,
        E = !1,
        R = 0,
        $ = ({
            sessionKey: y,
            displayName: T,
            preempt: D,
            preemptBoundary: A
        }) => {
            nt("[session-manager] wake", {
                sessionKey: y,
                preempt: D ?? "allow",
                preemptBoundary: A ?? "default"
            }), T && x.set(y, T), Ne(y, {
                preempt: D,
                preemptBoundary: A
            })
        },
        I = () => {
            Ze()
        },
        P = ({
            sessionKey: y,
            reason: T
        }) => {
            let D = g.get(y);
            if (!D) return;
            let A = D.streamingAdapter !== null;
            D.streamingAdapter = null;
            let z = !1;
            D.streamingState && !D.streamingState.closed && (D.streamingState.needsRecreation = !0, z = !0), (A || z) && K("[session-manager] streamingAdapter torn down for session", {
                sessionKey: y,
                reason: T,
                hadAdapter: A,
                stateMarked: z
            }), z && Kt("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: y,
                reason: T === "fork" ? "undo-fork" : "instructions-drift",
                generation: D.streamingGeneration,
                sdk_session_id: D.sdkSessionId ?? null
            })
        };

    function C(y) {
        y.query?.interrupt().catch(() => {})
    }

    function j(y) {
        if (y.query) {
            C(y);
            return
        }
        y.currentAbortController?.abort()
    }

    function X(y, T, D) {
        if (y.query) {
            if (D === "tool_result" && y.activeToolUseIds.size > 0) return y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result";
            let A = y.streamingState?.currentTurn;
            return A && !A.accepted ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "accept", "defer_accept") : (C(y), y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate")
        }
        return !y.currentAbortController || y.currentAbortController.signal.aborted ? "noop" : D === "tool_result" ? y.activeToolUseIds.size > 0 ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate") : D === "tool_use" ? y.isStreaming ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_use", "defer_tool_use") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate") : T === "soft" && y.isStreaming ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_use", "defer_tool_use") : T === "soft" && y.activeToolUseIds.size > 0 ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate")
    }

    function W(y) {
        let T;
        for (let D of y.inflightEventIds)(T ??= new Set).add(D);
        return T
    }

    function Y(y) {
        return JSON.stringify({
            cwd: y.cwd,
            settingSources: y.settingSources ?? [],
            persistSession: y.persistSession,
            permissionMode: y.permissionMode,
            allowedTools: y.allowedTools ?? [],
            disallowedTools: y.disallowedTools ?? [],
            tools: y.tools ?? [],
            additionalDirectories: y.additionalDirectories ?? [],
            autoloadAdditionalDirectoryClaudeMd: y.autoloadAdditionalDirectoryClaudeMd
        })
    }
    async function G(y, T) {
        let D = y.streamingState;
        if (!D) return;
        T && Kt("warn", `[kv-cache] streaming teardown: ${T}`, {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null
        });
        let A = y.query;
        y.streamingState = null, y.query = null, y.streamAbortController = null, y.spawnBoardHash = void 0, D.abortController.signal.aborted || D.abortController.abort(), typeof A?.close == "function" && A.close();
        try {
            await D.loopPromise
        } catch {}
    }
    async function ae(y, T) {
        let D = T,
            A = String(D.task_id ?? "unknown"),
            z = String(D.status ?? "completed"),
            te = String(D.summary ?? ""),
            ke = String(D.output_file ?? "");
        try {
            let at = await Jl(t, n, {
                traceId: `task-notify-${A}`,
                routeId: "task_notification",
                sourceName: "sdk_subagent",
                targetSessionKey: y,
                sourceSessionKey: y,
                eventType: "notify",
                walOnly: !0,
                payload: {
                    task_id: A,
                    task_status: z,
                    task_summary: te || void 0,
                    task_output_file: ke || void 0,
                    completion_owner: "claude-cli"
                }
            });
            Pe("[session-manager] task_notification recorded WAL-only", {
                sessionKey: y,
                taskId: A,
                status: z,
                success: at.success
            })
        } catch (at) {
            Be("[session-manager] task_notification WAL record failed", {
                sessionKey: y,
                taskId: A,
                status: z,
                error: at instanceof Error ? at.message : String(at)
            })
        }
    }
    async function Ce(y, T) {
        if (!o.createStreamingQuery) throw new Error("Streaming query support unavailable");
        let D = Y(T),
            A = T.sessionId;
        if (y.streamingState && !y.streamingState.closed && !y.streamingState.needsRecreation && y.streamingState.configSignature === D && (y.streamingState.hasAcceptedTurn || y.streamingState.initialSessionId === A)) return y.streamingState;
        let z = y.streamingState;
        z && !z.closed && (z.configSignature !== D ? Kt("warn", "[kv-cache] respawn: signature-mismatch", {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null,
            diff: the(z.configSignature, D)
        }) : z.needsRecreation ? Pe("[kv-cache] respawn: recreation-requested (already audited at source)", {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null
        }) : Kt("warn", "[kv-cache] respawn: resume-sessionid-change", {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null,
            requested_session_id: A ?? null
        })), await G(y);
        let te = new JI,
            ke = new AbortController,
            at = T.mcpServersFactory ? T.mcpServersFactory() : T.mcpServers,
            $e = {
                queue: te,
                abortController: ke,
                configSignature: D,
                initialSessionId: A,
                hasAcceptedTurn: !1,
                needsRecreation: !1,
                closed: !1,
                currentTurn: null,
                loopPromise: Promise.resolve(),
                cliTurnTentative: null
            },
            ct = Z => {
                for (let he of te.drain()) he.reject(Z())
            };
        async function* ki() {
            for (; !ke.signal.aborted;) {
                let Z;
                try {
                    Z = await te.dequeue(ke.signal)
                } catch (Ae) {
                    if (Ae instanceof Error && Ae.name === "AbortError") return;
                    throw Ae
                }
                let he = $e.currentTurn;
                if (he !== null && he !== Z) {
                    se("[session-manager] drain turn dequeued while the slot is occupied — rejected", {
                        sessionKey: y.sessionKey,
                        occupantAccepted: he.accepted
                    }), Z.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming slot occupied — prompt not yielded; retry after the occupant settles"));
                    continue
                } else $e.currentTurn = Z, $e.cliTurnTentative && ($e.cliTurnTentative.compromised = !0), Z.accepted = !1, Z.streamedText = "", Z.turnStreamedText = "", Z.toolUseMap.clear();
                for await (let Ae of Z.input.prompt) yield Ae
            }
        }
        let Nn = T.sessionId,
            {
                query: Je
            } = o.createStreamingQuery({
                prompt: ki(),
                abortController: ke,
                sessionId: Nn,
                cwd: T.cwd,
                settingSources: T.settingSources,
                persistSession: T.persistSession,
                permissionMode: T.permissionMode,
                allowedTools: T.allowedTools,
                disallowedTools: T.disallowedTools,
                tools: T.tools,
                effort: T.effort,
                mcpServers: at,
                additionalDirectories: T.additionalDirectories,
                autoloadAdditionalDirectoryClaudeMd: T.autoloadAdditionalDirectoryClaudeMd,
                systemPrompt: T.systemPrompt,
                hooks: {
                    PreToolUse: [{
                        matcher: "*",
                        hooks: [async Z => {
                            let he = Z,
                                Ae = he.transcript_path;
                            return typeof Ae == "string" && Ae.length > 0 && he.agent_id === void 0 && y.lastTranscriptPath !== Ae && (y.lastTranscriptPath = Ae, lt(t, y.sessionKey, {
                                transcript_path: Ae
                            }).catch(() => {})), {}
                        }]
                    }, {
                        matcher: g_,
                        hooks: [async Z => {
                            let he = Z?.agent_id !== void 0,
                                Ae = he ? null : $e.currentTurn;
                            return Ae ? Ae.skipCalled = !0 : !he && $e.cliTurnTentative && ($e.cliTurnTentative.skipObserved = !0), {
                                continue: !1,
                                stopReason: "The agent intentionally ended this turn silently by calling Skip."
                            }
                        }]
                    }],
                    PostToolUse: [{
                        matcher: "*",
                        hooks: [async () => {
                            let Z = [];
                            if ($e.currentTurn?.skipCalled === !0) return {};
                            if ($e.cliTurnTentative?.skipObserved === !0) return {};
                            let he = y.pendingSteer;
                            if (he && (y.pendingSteer = null, !he.settled)) {
                                he.settled = !0;
                                try {
                                    await yr(t, y.sessionKey, he.eventIds)
                                } catch (Ae) {
                                    K("[session-manager] steer hook markDone error", {
                                        sessionKey: y.sessionKey,
                                        error: String(Ae)
                                    })
                                }
                                for (let Ae of he.claimedEventIds) y.inflightEventIds.delete(Ae);
                                K("[session-manager] steer hook: injected interjection mid-turn", {
                                    sessionKey: y.sessionKey,
                                    eventIds: he.eventIds
                                }), Z.push(he.steerText)
                            }
                            return Z.length === 0 ? {} : {
                                hookSpecificOutput: {
                                    hookEventName: "PostToolUse",
                                    additionalContext: Z.join(`

`)
                                }
                            }
                        }]
                    }]
                }
            });
        y.query = Je, y.streamAbortController = ke, y.streamingState = $e, y.spawnBoardHash = T.boardHash, y.streamingGeneration += 1;
        let We = y.streamingGeneration,
            ye, fe = typeof Je.setModel == "function",
            H = typeof Je.applyFlagSettings == "function";
        if (fe || H) {
            let Z = await At(t, y.sessionKey).catch(() => null);
            if (fe) {
                let he = Z?.model;
                if (ye = he, he && !ke.signal.aborted) try {
                    await Je.setModel(he)
                } catch (Ae) {
                    se("[session-manager] failed to re-apply session model override — clearing it", {
                        sessionKey: y.sessionKey,
                        model: he,
                        error: Ae instanceof Error ? Ae.message : String(Ae)
                    }), await lt(t, y.sessionKey, {
                        model: null,
                        model_runtime: null
                    }).catch(() => {}), ye = void 0
                }
            }
            if (H && !ke.signal.aborted) {
                let he = Z?.effort ?? null,
                    Ae = T.effort ?? null;
                if (he !== Ae) try {
                    await Je.applyFlagSettings({
                        effortLevel: he
                    })
                } catch (V) {
                    se("[session-manager] failed to re-apply session effort override at spawn", {
                        sessionKey: y.sessionKey,
                        effort: he ?? "(reset to default)",
                        error: V instanceof Error ? V.message : String(V)
                    })
                }
            }
        }
        K("[kv-cache] streaming subprocess spawned", {
            sessionKey: y.sessionKey,
            generation: We,
            model: ye ?? "default",
            board_hash: T.boardHash ? T.boardHash.slice(0, 12) : null
        });
        let Vt = (Z, he, Ae, V = !1) => {
                if (he && !Z.skipCalled) {
                    if (V) {
                        Z.input.onStream?.(he, !0);
                        return
                    }
                    if (Ae) {
                        Z.streamedText += he, Z.turnStreamedText += he, Z.input.onStream?.(he, !1);
                        return
                    }
                    if (Z.turnStreamedText && he.startsWith(Z.turnStreamedText)) {
                        let it = he.slice(Z.turnStreamedText.length);
                        it && (Z.streamedText += it, Z.turnStreamedText = he, Z.input.onStream?.(it, !1));
                        return
                    }
                    if (he.startsWith(Z.streamedText)) {
                        let it = he.slice(Z.streamedText.length);
                        it && (Z.streamedText = he, Z.turnStreamedText += it, Z.input.onStream?.(it, !1));
                        return
                    }
                    Z.streamedText += he, Z.turnStreamedText += he, Z.input.onStream?.(he, !1)
                }
            },
            zt = async () => {
                let Z = y.pendingSteer;
                if (Z && (y.pendingSteer = null, !Z.settled)) {
                    if ($e.closed) {
                        Z.settled = !0;
                        let he = [];
                        for (let V = 0; V < Z.requeueLines.length; V += 1) {
                            let it = Z.requeueLines[V],
                                Tt = Z.requeueEventIds[V];
                            try {
                                await Vo(t, y.sessionKey, it), he.push(Tt)
                            } catch (ut) {
                                se("[session-manager] steer fallback closed-stream requeue failed", {
                                    sessionKey: y.sessionKey,
                                    eventId: Tt,
                                    error: ut instanceof Error ? ut.message : String(ut)
                                })
                            }
                        }
                        let Ae = [...he, ...Z.processedEventIds];
                        if (Ae.length > 0) try {
                            await yr(t, y.sessionKey, Ae)
                        } catch (V) {
                            K("[session-manager] steer fallback closed markDone error", {
                                sessionKey: y.sessionKey,
                                error: String(V)
                            })
                        }
                        for (let V of Z.claimedEventIds) y.inflightEventIds.delete(V);
                        y.pendingWake = !0, K("[session-manager] steer fallback requeued to inbox (stream closed)", {
                            sessionKey: y.sessionKey,
                            eventIds: Z.eventIds,
                            requeued: he.length,
                            requeueFailed: Z.requeueLines.length - he.length
                        });
                        return
                    }
                    Z.settled = !0;
                    try {
                        await Z.enqueueAsNewTurn()
                    } catch (he) {
                        K("[session-manager] steer fallback enqueue error", {
                            sessionKey: y.sessionKey,
                            error: String(he)
                        })
                    }
                }
            }, dt = Z => Z.origin?.kind === "task-notification", kn = async (Z, he, Ae, V) => {
                let it = Z,
                    Tt = typeof it.duration_ms == "number" && Number.isFinite(it.duration_ms) && it.duration_ms >= 0 ? it.duration_ms : 0,
                    ut = typeof it.duration_api_ms == "number" && Number.isFinite(it.duration_api_ms) && it.duration_api_ms >= 0 ? it.duration_api_ms : 0;
                try {
                    await appendDrainRecord(t, {
                        origin: "cli-turn",
                        id: KXe(),
                        session_key: y.sessionKey,
                        sdk_session_id: y.sdkSessionId,
                        drain_started_at: new Date(V - Tt).toISOString(),
                        drain_duration_ms: Tt,
                        sdk_duration_ms: ut,
                        events_processed: 0,
                        events_skipped: 0,
                        tool_calls: 0,
                        tool_errors: 0,
                        output_chars: Ae,
                        cancelled: !1,
                        usage: he
                    })
                } catch (Q) {
                    Be("[completion-owner] CLI turn ledger write failed", {
                        sessionKey: y.sessionKey,
                        generation: y.streamingGeneration,
                        error: Q instanceof Error ? Q.message : String(Q)
                    })
                }
            };
        return $e.loopPromise = (async () => {
            let Z = null,
                he;
            try {
                for await (let Ae of Je) {
                    let V = Ae;
                    y.lastActivityAt = Date.now();
                    let it, Tt, ut = null;
                    if (V.type === "result") {
                        it = $e.lastModelUsage, Tt = $e.lastTotalCostUsd, ut = Z, Z = null;
                        let ee = V.modelUsage;
                        ee !== void 0 && ($e.lastModelUsage = ee);
                        let ge = V.total_cost_usd;
                        typeof ge == "number" && ($e.lastTotalCostUsd = ge)
                    }
                    if (V.type === "result" && dt(V)) {
                        let ee = Date.now(),
                            ge = $e.cliTurnTentative;
                        $e.cliTurnTentative = null;
                        let Rt = $e.currentTurn,
                            $t = ge?.skipObserved ?? !1,
                            Xn;
                        if (V.subtype === "success" && (Xn = Up(V, {
                                prevModelUsage: it,
                                prevTotalCostUsd: Tt
                            }), Xn && !$t && typeof Je.getContextUsage == "function")) try {
                            let xn = (await Je.getContextUsage())?.totalTokens;
                            typeof xn == "number" && Number.isFinite(xn) && xn >= 0 && (Xn.context_used_tokens = xn)
                        } catch {}
                        if (y.lastCliTurnSettledAt = ee, y.lastTurnCompletedAt = ee, he = void 0, Rt) {
                            let Dn = ut === Rt,
                                xn = ge?.compromised === !0,
                                Hi = Rt.accepted;
                            $e.currentTurn = null, Rt.accepted = !1, await zt(), (Hi || Rt.streamedText.length > 0 || Rt.turnStreamedText.length > 0) && n.emit("session.stream_end", {
                                sessionKey: y.sessionKey,
                                reason: "interrupted"
                            }), Rt.reject(new AgentSdkPromptNotAcceptedAbortError("Task-completion turn folded with mailbox drain; retrying the drain")), y.pendingWake = !0, y.wakeResolver?.(), await kn(V, Xn, 0, ee), Kt("warn", "[completion-owner] voided folded drain", {
                                sessionKey: y.sessionKey,
                                generation: y.streamingGeneration,
                                acceptedByForeignInit: Dn,
                                installedDuringTentative: xn,
                                wasAccepted: Hi
                            });
                            continue
                        }
                        let Ft = 0,
                            _t = V.subtype === "success" && !$t && typeof V.result == "string" && V.result.length > 0 ? V.result : void 0;
                        if (_t !== void 0) {
                            let Dn = Gf({
                                channel_kind: Gme(y.sessionKey),
                                session_key: y.sessionKey,
                                payload: {
                                    text: _t
                                }
                            });
                            try {
                                await Kf(t, Dn), Ft = _t.length, n.emit("session.output", {
                                    sessionKey: y.sessionKey,
                                    record: Dn
                                })
                            } catch (xn) {
                                Be("[completion-owner] proactive outbox write failed", {
                                    sessionKey: y.sessionKey,
                                    generation: y.streamingGeneration,
                                    error: xn instanceof Error ? xn.message : String(xn)
                                })
                            }
                        }
                        await kn(V, Xn, Ft, ee), y.pendingWake = !0, y.wakeResolver?.(), K("[completion-owner] settled CLI completion turn", {
                            sessionKey: y.sessionKey,
                            generation: y.streamingGeneration,
                            subtype: V.subtype,
                            skipped: $t,
                            outputChars: Ft
                        });
                        continue
                    }
                    let Q = $e.currentTurn;
                    if (!Q) {
                        if (V.type === "system" && V.subtype === "task_notification") {
                            let ee = V;
                            await ae(y.sessionKey, V), he = {
                                taskId: String(ee.task_id ?? "unknown"),
                                status: String(ee.status ?? "completed"),
                                observedAt: Date.now()
                            };
                            continue
                        }
                        if (V.type === "system" && V.subtype === "init") {
                            $e.cliTurnTentative ??= {
                                skipObserved: !1,
                                compromised: !1
                            }, Z = null;
                            continue
                        }
                        if (V.type === "result") {
                            let ee = $e.cliTurnTentative !== null;
                            $e.cliTurnTentative = null, K("[session-manager] orphan result received", {
                                sessionKey: y.sessionKey,
                                subtype: V.subtype,
                                hadTentative: ee
                            }), y.pendingWake = !0, y.wakeResolver?.();
                            continue
                        }
                        continue
                    }
                    if (V.type === "system") {
                        if (V.subtype === "task_notification") {
                            let ge = V;
                            await ae(y.sessionKey, V), he = {
                                taskId: String(ge.task_id ?? "unknown"),
                                status: String(ge.status ?? "completed"),
                                observedAt: Date.now()
                            }
                        }
                        if (V.subtype === "init") {
                            let ge = !Q.accepted;
                            $e.hasAcceptedTurn = !0, Q.accepted = !0, $e.cliTurnTentative = null, Z = ge ? Q : null;
                            try {
                                Q.input.onTurnAcknowledged?.()
                            } catch {}
                            Q.sessionId = V.session_id ?? Q.sessionId, y.sdkSessionId = V.session_id ?? y.sdkSessionId, y.sdkSessionIdVerified = !0, Nn && V.session_id && Nn !== V.session_id && se("[session-manager] SDK session ID mismatch — context lost", {
                                sessionKey: y.sessionKey,
                                requestedSessionId: Nn,
                                actualSessionId: V.session_id
                            }), V.session_id && y.jobStateless !== !0 && await lt(t, y.sessionKey, {
                                sdk_session_id: V.session_id
                            }), y.pendingPreempt && y.pendingPreemptBoundary === "accept" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, C(y))
                        }
                        let ee;
                        V.subtype === "init" ? ee = {
                            session_id: V.session_id
                        } : V.subtype === "compact_boundary" && V.compact_metadata && (ee = {
                            trigger: V.compact_metadata.trigger,
                            pre_tokens: V.compact_metadata.pre_tokens,
                            post_tokens: V.compact_metadata.post_tokens
                        }), Q.input.onExecutionEvent?.({
                            type: "system",
                            subtype: V.subtype ?? "unknown",
                            data: ee
                        });
                        continue
                    }
                    if (V.type === "stream_event") {
                        let ee = zp(V);
                        for (let $t of qE(V.event)) Vt(Q, $t.text, $t.isDelta, ee);
                        for (let $t of BE(V.event)) Q.input.onExecutionEvent?.({
                            type: "thought_chunk",
                            text: $t
                        });
                        let ge = HE(V.event);
                        ge && (Q.toolBlockIndexMap.set(ge.index, {
                            toolUseId: ge.toolUseId,
                            toolName: ge.toolName
                        }), Q.toolUseMap.set(ge.toolUseId, ge.toolName), Q.input.onExecutionEvent?.({
                            type: "tool_use",
                            toolUseId: ge.toolUseId,
                            toolName: ge.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let Rt = VE(V.event);
                        if (Rt) {
                            let $t = Q.toolBlockIndexMap.get(Rt.index);
                            $t && Q.input.onExecutionEvent?.({
                                type: "tool_input_delta",
                                toolUseId: $t.toolUseId,
                                toolName: $t.toolName,
                                partialJson: Rt.partialJson
                            })
                        }
                        continue
                    }
                    if (typeof V.type == "string" && V.type.includes("assistant")) {
                        let ee = zp(V);
                        for (let Rt of UE(V)) Vt(Q, Rt.text, Rt.isDelta, ee);
                        let ge = V.message?.content;
                        if (Array.isArray(ge))
                            for (let Rt of ge) {
                                if (!Rt || typeof Rt != "object" || Rt.type !== "tool_use") continue;
                                let $t = Rt.id,
                                    Xn = Rt.name;
                                !$t || !Xn || (Q.toolUseMap.set($t, Xn), Q.input.onExecutionEvent?.({
                                    type: "tool_use",
                                    toolUseId: $t,
                                    toolName: Xn,
                                    input: Rt.input
                                }))
                            }
                        continue
                    }
                    if (V.type === "user") {
                        let ee = V.message?.content;
                        if (Array.isArray(ee))
                            for (let ge of ee) {
                                if (!ge || typeof ge != "object" || ge.type !== "tool_result") continue;
                                let Rt = ge.tool_use_id;
                                Rt && (Q.input.onExecutionEvent?.({
                                    type: "tool_result",
                                    toolUseId: Rt,
                                    toolName: Q.toolUseMap.get(Rt),
                                    isError: ge.is_error ?? !1,
                                    summary: ZE(ge.content)
                                }), Q.turnStreamedText = "")
                            }
                        continue
                    }
                    if (V.type === "result") {
                        if (V.subtype === "success") {
                            if (typeof V.result == "string" && (Q.text = V.result), V.structured_output !== void 0 && (Q.structured = V.structured_output), Q.usage = Up(V, {
                                    prevModelUsage: it,
                                    prevTotalCostUsd: Tt
                                }), Q.usage && !Q.skipCalled && typeof Je.getContextUsage == "function") try {
                                let ge = (await Je.getContextUsage())?.totalTokens;
                                typeof ge == "number" && Number.isFinite(ge) && ge >= 0 && (Q.usage.context_used_tokens = ge)
                            } catch {}
                            if (await zt(), $e.currentTurn = null, Q.skipCalled) Q.resolve({
                                sessionId: Q.sessionId ?? y.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: Q.usage
                            });
                            else {
                                let ee = Q.text ?? (Q.streamedText ? Q.streamedText : void 0);
                                Q.resolve({
                                    sessionId: Q.sessionId ?? y.sdkSessionId,
                                    text: ee,
                                    structured: Q.structured,
                                    usage: Q.usage
                                })
                            }
                            continue
                        }
                        if (V.subtype === "error_during_execution" && Q.skipCalled) {
                            await zt(), $e.currentTurn = null, Q.resolve({
                                sessionId: Q.sessionId ?? y.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: Q.usage
                            });
                            continue
                        }
                        Q.accepted && n.emit("session.stream_end", {
                            sessionKey: y.sessionKey,
                            reason: "interrupted"
                        }), await zt(), $e.currentTurn = null, V.subtype === "error_during_execution" ? Q.accepted ? Q.reject(new AgentSdkTurnInterruptedError) : y.pendingClear ? ($e.needsRecreation = !0, Q.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : ($e.needsRecreation = !0, Nn && !y.sdkSessionIdVerified && (y.sdkSessionId = void 0, y.pendingWake = !0, await co(t, y.sessionKey, "sdk_session_id").catch(() => {}), se("[session-manager] cleared stale sdk_session_id after resume failure", {
                            sessionKey: y.sessionKey,
                            staleSessionId: Nn
                        })), Q.reject(new AgentSdkPromptNotAcceptedAbortError)) : Q.reject(new Error(`Unexpected streaming SDK result subtype: ${V.subtype??"unknown"}`))
                    }
                }
            } catch (Ae) {
                let V = $e.currentTurn;
                $e.currentTurn = null, V && (V.accepted && n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: "interrupted"
                }), ke.signal.aborted && !V.accepted ? ($e.needsRecreation = !0, y.pendingClear ? V.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : V.reject(new AgentSdkPromptNotAcceptedAbortError)) : ke.signal.aborted ? V.reject(Fp("Streaming SDK run aborted", Ae)) : (V.accepted || ($e.needsRecreation = !0), V.reject(Ae))), ct(() => new AgentSdkPromptNotAcceptedAbortError)
            } finally {
                $e.closed = !0, $e.needsRecreation = !0, ke.signal.aborted || Kt("warn", "[kv-cache] streaming loop exited unexpectedly (closed)", {
                    sessionKey: y.sessionKey,
                    generation: y.streamingGeneration,
                    sdk_session_id: y.sdkSessionId ?? null
                });
                let Ae = $e.currentTurn;
                $e.currentTurn = null, Ae && (ke.signal.aborted && !Ae.accepted ? y.pendingClear ? Ae.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : Ae.reject(new AgentSdkPromptNotAcceptedAbortError) : ke.signal.aborted ? (Ae.accepted && n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: "interrupted"
                }), Ae.reject(Fp("Streaming SDK run aborted"))) : Ae.accepted ? (n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: "interrupted"
                }), Ae.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution"))) : Ae.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), ct(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), he && (y.lastCliTurnSettledAt === void 0 || he.observedAt > y.lastCliTurnSettledAt) && Kt("warn", "[completion-owner] unspoken-completion", {
                    sessionKey: y.sessionKey,
                    taskId: he.taskId,
                    status: he.status,
                    generation: y.streamingGeneration
                }), $e.cliTurnTentative = null, y.wakeResolver?.(), y.pendingSteer && (await zt(), y.wakeResolver?.()), y.streamingState === $e && (y.streamingState = null), y.query === Je && (y.query = null), y.streamAbortController === ke && (y.streamAbortController = null)
            }
        })(), $e
    }

    function ue(y) {
        return y.runtime === "codex" && y.codexAdapter ? y.codexAdapter : y.origin !== "channel" || !o.createStreamingQuery ? o : (y.streamingAdapter || (y.streamingAdapter = {
            run: async T => {
                let D = await Ce(y, T);
                return await new Promise((A, z) => {
                    if (D.closed) {
                        z(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    D.queue.enqueue({
                        input: T,
                        resolve: A,
                        reject: z,
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
            createStreamingQuery: o.createStreamingQuery,
            undo: o.undo ? o.undo.bind(o) : void 0
        }), y.streamingAdapter)
    }

    function Ne(y, T) {
        if (!E) {
            nt("[session-manager] wake ignored, manager not running", {
                sessionKey: y
            });
            return
        }
        if (lr(y)) {
            nt("[session-manager] wake suppressed, session is being archived", {
                sessionKey: y
            });
            return
        }
        let D = T?.preempt ?? "allow",
            A = T?.preemptBoundary,
            z = g.get(y);
        if (z && z.wakeResolver) {
            nt("[session-manager] wake delivered to idle actor", {
                sessionKey: y,
                actorRunId: z.actorRunId,
                status: z.status,
                preemptBoundary: A ?? "default"
            }), z.wakeResolver(), z.wakeResolver = null;
            return
        }
        if (z && z.drainPromise && (z.status === "active" || z.status === "idle")) {
            let at = !!z.query && z.streamingState?.currentTurn?.accepted === !0,
                $e = z.runtime === "codex" && !!z.codexAdapter?.activeTurnId?.();
            if (D === "allow" && (at || $e) && z.admissionCallback && !z.admissionInProgress) {
                z.pendingWake = !0, z.admissionInProgress = !0;
                let ct = z.admissionCallback;
                nt("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: y,
                    actorRunId: z.actorRunId
                }), ct().then(() => {
                    z.admissionInProgress = !1, z.wakeResolver?.()
                }, () => {
                    z.admissionInProgress = !1, z.wakeResolver?.()
                });
                return
            }
            if (z.status === "active" && z.currentAbortController)
                if (D === "force") {
                    let ct = X(z, "immediate", A);
                    ct === "immediate" ? nt("[session-manager] wake: forced preempt", {
                        sessionKey: y,
                        actorRunId: z.actorRunId,
                        preemptBoundary: A ?? "default"
                    }) : ct === "defer_accept" ? nt("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: y,
                        actorRunId: z.actorRunId
                    }) : ct === "defer_tool_result" ? nt("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: y,
                        actorRunId: z.actorRunId
                    }) : ct === "defer_tool_use" && nt("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: y,
                        actorRunId: z.actorRunId
                    })
                } else if (D === "allow") {
                let ct = X(z, "soft", A);
                ct === "defer_accept" ? nt("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: y,
                    actorRunId: z.actorRunId
                }) : ct === "defer_tool_use" ? nt("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: y,
                    actorRunId: z.actorRunId
                }) : ct === "defer_tool_result" ? nt("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: y,
                    actorRunId: z.actorRunId
                }) : ct === "immediate" && nt("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: y,
                    actorRunId: z.actorRunId
                })
            } else nt("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: y,
                actorRunId: z.actorRunId
            });
            z.pendingWake = !0, nt("[session-manager] wake marked pending", {
                sessionKey: y,
                actorRunId: z.actorRunId,
                status: z.status
            });
            return
        }
        let te = b(y, z?.origin);
        if (te.activeCount >= te.maxConcurrent) {
            let at = te.wakeQueue.includes(y);
            at || te.wakeQueue.push(y), nt("[session-manager] wake queued", {
                sessionKey: y,
                pool: te.name,
                activeCount: te.activeCount,
                maxConcurrent: te.maxConcurrent,
                alreadyQueued: at,
                queuedSessions: te.wakeQueue.length
            });
            return
        }
        let ke = N2(y);
        ke ? (nt("[session-manager] wake starting actor with inferred origin", {
            sessionKey: y,
            ...ke
        }), ot(y, ke)) : (nt("[session-manager] wake starting actor", {
            sessionKey: y
        }), ot(y))
    }

    function ot(y, T) {
        let D = g.get(y),
            A = D?.attachedChannels ?? new Set,
            z = ++R,
            te = {
                sessionKey: y,
                actorRunId: z,
                sdkSessionId: D?.sdkSessionId,
                sdkSessionIdVerified: D?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: D?.streamingAdapter ?? null,
                streamingGeneration: D?.streamingGeneration ?? 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                isStreaming: !1,
                activeToolUseIds: new Set,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: A,
                origin: T?.origin ?? D?.origin ?? "channel",
                jobId: T?.jobId ?? D?.jobId,
                jobStateless: D?.jobStateless ?? !1,
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
                notifyCalledDuringDrain: !1,
                runtime: T?.runtime ?? D?.runtime ?? "claude",
                codexAdapter: D?.codexAdapter ?? null,
                consecutiveConservativeRedrive: D?.consecutiveConservativeRedrive ?? !1
            };
        g.set(y, te);
        let ke = b(y, te.origin);
        ke.activeCount++, te.holdsPoolSlot = !0;
        let at = x.get(y);
        if (at && x.delete(y), jk(t, {
                session_key: y,
                display_name: at,
                kind: te.origin === "job" ? "job" : te.origin === "system" ? "system" : y.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), K("[session-manager] actor start", {
                sessionKey: y,
                actorRunId: z,
                sdkSessionId: te.sdkSessionId,
                origin: te.origin,
                jobId: te.jobId,
                pool: ke.name,
                activeCount: ke.activeCount,
                attachedChannels: te.attachedChannels.size,
                queuedSessions: ke.wakeQueue.length
            }), T?.preStart) {
            let $e = T.preStart;
            te.drainPromise = $e().catch(ct => Be("[session-manager] preStart failed", ct)).then(() => Se(te))
        } else te.drainPromise = Se(te)
    }
    async function Se(y) {
        let {
            sessionKey: T
        } = y, D, A, z = 0, te = 0, ke = !1, at = [], $e = 0, ct = !1, ki = !1, Nn = null, Je;
        try {
            Je = await Sn(T)
        } catch (We) {
            se("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: T,
                error: We instanceof Error ? We.message : String(We)
            }), Je = new Set
        }
        nt("[session-manager] drain loop begin", {
            sessionKey: T,
            actorRunId: y.actorRunId,
            origin: y.origin,
            jobId: y.jobId
        });
        try {
            if (!y.sdkSessionId && !y.pendingClear) {
                let dt = await At(t, T);
                dt?.sdk_session_id && (y.sdkSessionId = dt.sdk_session_id, K("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: T,
                    sdkSessionId: dt.sdk_session_id
                }))
            }
            if ((await At(t, T))?.session_key || await lt(t, T, {
                    session_key: T
                }), y.origin === "job" && !y.jobId) {
                await L.init();
                let kn = (await L.listJobs()).find(Z => Z.session_key === T);
                kn ? (y.jobId = kn.id, Pe("[session-manager] recovered jobId from active jobs", {
                    sessionKey: T,
                    jobId: kn.id
                })) : se("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: T
                })
            }
            let We = !1,
                ye, fe = !1,
                H, Vt = null,
                zt = !1;
            if (y.jobStateless = !1, y.origin === "job" && y.jobId) {
                let dt = await L.getJob(y.jobId);
                if (Vt = dt, Nn = dt?.state.last_scheduled_at ?? null, dt?.execution_cwd && (await $ue({
                        cwdRel: dt.execution_context === "workspace" ? dt.frontmatter.cwd_rel ?? null : null,
                        cwd: dt.execution_cwd,
                        runtimeWorkspaceDir: dt.runtime_workspace_dir,
                        context: dt.execution_context
                    }), await _e(dt.execution_cwd), await lt(t, T, {
                        session_key: T,
                        cwd: dt.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), dt) {
                    We = !!dt.frontmatter.owner_session?.startsWith("job:"), ye = A2(dt.frontmatter.cron);
                    let kn = dt.frontmatter.stateless === !0;
                    if (kn && dt.frontmatter.cron === "keepalive") throw new Error(y2);
                    fe = kn, y.jobStateless = fe, H = dt.frontmatter.model;
                    let Z = dt.frontmatter.runtime ?? void 0,
                        he = Z ?? Oc(),
                        Ae = Z ? "explicit" : "default";
                    if (dt.frontmatter.prompt_mode !== void 0 && he === "codex" && se("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                            sessionKey: T,
                            jobId: y.jobId,
                            promptMode: dt.frontmatter.prompt_mode,
                            runtimeSource: Ae
                        }), he === "codex") {
                        let V = await l();
                        V.ok ? y.runtime = "codex" : (y.runtime = "claude", se("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: T,
                            jobId: y.jobId,
                            runtime_source: Ae,
                            reason: V.reason
                        }))
                    } else y.runtime = "claude"
                }
            } else if (y.origin === "channel") {
                let kn = (await At(t, T))?.source_channel_id;
                if (kn) {
                    let Z = await Di(t, kn).catch(() => null),
                        he = Z?.channel_kind,
                        Ae = he ? await ta(t.channelConfigDir, he).catch(() => null) : null,
                        it = Z?.runtime ?? Ae?.runtime ?? void 0 ?? Oc(),
                        Tt = Z?.runtime ? "explicit" : Ae?.runtime ? "inherited" : "default";
                    if (it === "codex") {
                        let ut = await l();
                        ut.ok ? y.runtime = "codex" : (y.runtime = "claude", se("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: T,
                            sourceChannelId: kn,
                            runtime_source: Tt,
                            reason: ut.reason
                        }))
                    } else y.runtime = "claude"
                }
            }
            for (; y.status !== "ended" && E;) {
                if (y.runtime !== "codex") {
                    for (;;) {
                        let ee = y.streamingState,
                            ge = !!ee && !ee.closed && (ee.cliTurnTentative !== null || ee.currentTurn !== null);
                        if (!ge && !y.admissionInProgress) break;
                        if (y.pendingWake) {
                            y.pendingWake = !1;
                            continue
                        }
                        nt("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            cliBusy: ge,
                            admissionInProgress: y.admissionInProgress
                        }), await Xe(y, i)
                    }
                    if (!E || y.status === "ended") break
                }
                y.pendingClear && (y.sdkSessionId = void 0, y.pendingClear = !1, await lt(t, T, {
                    sdk_session_id: null,
                    pending_fork_to: null,
                    pending_undo: null
                }).catch(() => {}));
                let dt, kn = null;
                y.origin === "job" && y.jobId && (zt ? kn = await L.getJob(y.jobId).catch(() => null) : (zt = !0, kn = Vt, Vt = null));
                let {
                    instructions: Z,
                    missionContent: he
                } = await ret(t, T, y, kn), Ae = await At(t, T), V = await runInstructionsFingerprintGuard(t, T, Z, y.runtime, {
                    instructions_fingerprint: Ae?.instructions_fingerprint,
                    mission_fingerprint: Ae?.mission_fingerprint,
                    schema_version: Ae?.schema_version,
                    sdk_session_id: Ae?.sdk_session_id,
                    board_layer_hash: Ae?.board_layer_hash,
                    instructions_nonboard_fingerprint: Ae?.instructions_nonboard_fingerprint
                }, y.origin === "job" && y.jobId ? {
                    jobId: y.jobId
                } : void 0);
                V.clearedSdkSessionId && (y.sdkSessionId = void 0), V.gate2Fired && y.runtime === "claude" && (V.boardOnlyDrift ? y.streamingState && !y.streamingState.closed ? K("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: T,
                    board_layer_hash: V.boardLayerHash
                }) : K("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: T,
                    board_layer_hash: V.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: T,
                    reason: "instructions_drift"
                })), y.origin === "job" && y.jobId && (he !== void 0 ? dt = {
                    content: he,
                    jobId: y.jobId,
                    cron: kn?.frontmatter.cron ?? "",
                    stateless: fe,
                    model: kn?.frontmatter.model ?? H,
                    sdkConfig: Due(kn?.frontmatter)
                } : se("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: T,
                    jobId: y.jobId
                })), y.status = "active", y.idleSince = void 0;
                let it = new Set,
                    Tt = Date.now(),
                    ut = new AbortController;
                y.currentAbortController = ut;
                let Q;
                try {
                    let ee = !We,
                        ge = [...ee ? [Ype] : [], rme, yme];
                    y.origin === "channel" && (ge.push(sme), ge.push(g_));
                    let Rt = y.origin === "job" ? "job" : y.origin === "system" ? "system" : "foreground",
                        $t = 0,
                        Xn = eet();
                    if (y.admissionCallback = async () => {
                            try {
                                await vk(t, T);
                                let Ft = await Wg(t, T);
                                if (Ft.length === 0) return;
                                await wk(t, T, Ft);
                                let _t = {},
                                    Dn = await batchDrainItems(t, Ft, {
                                        fallbackBatchSize: 5,
                                        mergeWindowMs: 180 * 1e3,
                                        perf: _t
                                    }),
                                    xn = await At(t, T),
                                    Hi = tq(t, T, xn ?? void 0),
                                    gr = [],
                                    qs = [];
                                for (let tt of Dn.items) {
                                    if (!tt.eventId) continue;
                                    if (y.inflightEventIds.has(tt.eventId)) {
                                        qs.push(tt.eventId);
                                        continue
                                    }
                                    if (await Qf(t, tt.eventId)) {
                                        qs.push(tt.eventId);
                                        continue
                                    }
                                    let Xt = Dn.events.get(tt.eventId) ?? await readEventByIdSeek(t, tt.eventId);
                                    Xt && gr.push({
                                        item: tt,
                                        event: Xt,
                                        prompt: XU(Xt, T)
                                    })
                                }
                                if (gr.length === 0) {
                                    qs.length > 0 && await yr(t, T, qs);
                                    return
                                }
                                let wr = await YU(t, T, {
                                        allowedTools: ge,
                                        tools: Xn,
                                        additionalDirectories: [t.memoryDir],
                                        onExecutionEvent: tt => {
                                            tt.type === "tool_use" && (y.isStreaming = !1, y.activeToolUseIds.add(tt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_use" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, j(y))), tt.type === "tool_result" && (y.activeToolUseIds.delete(tt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_result" && y.activeToolUseIds.size === 0 && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, j(y)));
                                            let Sr = Wme(tt);
                                            Sr && n.emit("session.execution", {
                                                sessionKey: T,
                                                event: Sr
                                            })
                                        },
                                        onStream: (tt, Sr, Xt) => {
                                            y.isStreaming = !0, n.emit("session.stream", {
                                                sessionKey: T,
                                                chunk: tt,
                                                isSidechain: Sr,
                                                anchorEventId: Xt
                                            })
                                        }
                                    }, gr, Hi, {
                                        pendingGatewayNotice: xn?.pending_gateway_notice,
                                        pendingInterruptedContext: xn?.pending_interrupted_context,
                                        pendingSkipRewind: xn?.pending_skip_rewind,
                                        lastEventAtWatermark: xn?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, _t, tt => tt),
                                    Bm = [...qs, ...gr.map(tt => tt.item.eventId).filter(tt => !!tt)];
                                if (y.runtime === "codex") {
                                    let tt = y.codexAdapter?.steerActiveTurn,
                                        Sr = !!wr.attachments && wr.attachments.length > 0,
                                        Xt = wr.coalescedPromptText.trim(),
                                        kr = y.codexAdapter?.activeTurnId?.(),
                                        xi = y.codexAdapter?.activeTurnStartedAt?.(),
                                        er = !1;
                                    if (kr && xi !== void 0)
                                        if (y.codexAdapter?.activeTurnSkipObserved?.() === !0) er = !0;
                                        else {
                                            let Vs = await At(t, T).catch(() => null);
                                            if (Vs === null) er = !0, se("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: T
                                            });
                                            else {
                                                let Eo = Date.parse(Vs.pending_skip_rewind?.skipped_at ?? "");
                                                er = Number.isFinite(Eo) && Eo >= xi
                                            }
                                        } if (!!tt && !!kr && !Sr && !wr.isNotifyOnly && Xt.length > 0 && !er && tt && kr) {
                                        let ci = wr.batchEventIds.filter(Eo => !y.inflightEventIds.has(Eo));
                                        for (let Eo of ci) y.inflightEventIds.add(Eo);
                                        if (await tt(Xt, kr).catch(() => !1)) {
                                            await yr(t, T, Bm);
                                            for (let Eo of ci) y.inflightEventIds.delete(Eo);
                                            K("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: T,
                                                admittedItems: gr.length,
                                                batchEventIds: wr.batchEventIds
                                            })
                                        } else {
                                            for (let Eo of ci) y.inflightEventIds.delete(Eo);
                                            y.pendingWake = !0, K("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: T,
                                                batchEventIds: wr.batchEventIds
                                            })
                                        }
                                    } else y.pendingWake = !0, K("[session-manager] admission callback: codex no live turn, redraining", {
                                        sessionKey: T,
                                        admittedItems: gr.length,
                                        batchEventIds: wr.batchEventIds
                                    });
                                    return
                                }
                                let jn = y.streamingState;
                                if (!jn || jn.closed) return;
                                let Bs = jn.currentTurn,
                                    mt = !!wr.attachments && wr.attachments.length > 0,
                                    Rn = wr.coalescedPromptText.trim();
                                if (!!Bs && Bs.accepted && !Bs.skipCalled && !mt && !wr.isNotifyOnly && Rn.length > 0) {
                                    let tt = y.pendingSteer;
                                    if (tt && !tt.settled && tt.spawningTurn === Bs) {
                                        let Sr = wr.batchEventIds.filter(Xt => !y.inflightEventIds.has(Xt));
                                        for (let Xt of Sr) y.inflightEventIds.add(Xt);
                                        tt.steerText = `${tt.steerText}
${Rn}`, tt.eventIds.push(...Bm), tt.claimedEventIds.push(...Sr), tt.requeueLines.push(...gr.map(Xt => Xt.item.line)), tt.requeueEventIds.push(...gr.map(Xt => Xt.item.eventId)), tt.processedEventIds.push(...qs), K("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: T,
                                            admittedItems: gr.length,
                                            batchEventIds: wr.batchEventIds
                                        });
                                        return
                                    }
                                    if (!tt) {
                                        let Sr = wr.batchEventIds.filter(kr => !y.inflightEventIds.has(kr));
                                        for (let kr of Sr) y.inflightEventIds.add(kr);
                                        let Xt = {
                                            steerText: Rn,
                                            eventIds: [...Bm],
                                            claimedEventIds: [...Sr],
                                            enqueueAsNewTurn: async () => {
                                                let kr = [];
                                                for (let er = 0; er < Xt.requeueLines.length; er += 1) {
                                                    let Hs = Xt.requeueLines[er],
                                                        ci = Xt.requeueEventIds[er];
                                                    try {
                                                        await Vo(t, T, Hs), kr.push(ci)
                                                    } catch (Vs) {
                                                        se("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: T,
                                                            eventId: ci,
                                                            error: Vs instanceof Error ? Vs.message : String(Vs)
                                                        })
                                                    }
                                                }
                                                let xi = [...kr, ...Xt.processedEventIds];
                                                if (xi.length > 0) try {
                                                    await yr(t, T, xi)
                                                } catch (er) {
                                                    K("[session-manager] steer fallback markDone error", {
                                                        sessionKey: T,
                                                        error: String(er)
                                                    })
                                                }
                                                for (let er of Xt.claimedEventIds) y.inflightEventIds.delete(er);
                                                y.pendingWake = !0, K("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: T,
                                                    eventIds: Xt.eventIds,
                                                    requeued: kr.length,
                                                    requeueFailed: Xt.requeueLines.length - kr.length
                                                })
                                            },
                                            spawningTurn: Bs,
                                            requeueLines: gr.map(kr => kr.item.line),
                                            requeueEventIds: gr.map(kr => kr.item.eventId),
                                            processedEventIds: [...qs],
                                            settled: !1
                                        };
                                        y.pendingSteer = Xt, K("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: T,
                                            admittedItems: gr.length,
                                            batchEventIds: wr.batchEventIds
                                        });
                                        return
                                    }
                                }
                                y.pendingWake = !0, y.wakeResolver?.()
                            } catch (Ft) {
                                K("[session-manager] admission callback error", {
                                    sessionKey: T,
                                    error: String(Ft)
                                })
                            }
                        }, y.runtime === "codex" && !y.codexAdapter) {
                        let Ft = (await At(t, T))?.cwd;
                        Ft && await ensureAgentsMdSymlink(Ft).catch(() => {}), y.codexAdapter = c({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: H,
                            dynamicTools: zI({
                                paths: t,
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: Rt,
                                notifyDepth: $t,
                                jobScheduleType: ye,
                                canManageJobs: ee,
                                getSessionStatus: _t => g.get(_t)?.status,
                                onNotifyCalled: () => {
                                    y.notifyCalledDuringDrain = !0
                                }
                            })
                        })
                    }
                    Q = await drainSessionMailbox(t, T, {
                        sdk: ue(y),
                        bus: n,
                        abortController: ut,
                        runtime: y.runtime,
                        excludeEventIds: W(y),
                        actorSpawnedAt: y.spawnedAt,
                        actorLastTurnCompletedAt: y.lastTurnCompletedAt,
                        getStreamGeneration: () => y.streamingGeneration,
                        holdInputOpenForBackgroundAgents: y.runtime === "claude" && y.origin !== "channel",
                        jobContext: dt,
                        memoryBoard: Z.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: Z.memoryBoard
                        } : void 0,
                        boardHash: Z.memoryBoard ? V.boardLayerHash : void 0,
                        onBatchContext: Ft => {
                            if ($t = Ft.maxNotifyDepth, Ft.eventIds)
                                for (let _t of Ft.eventIds) y.inflightEventIds.add(_t)
                        },
                        mcpServersFactory: () => ({
                            aladuo: MI(t, {
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: Rt,
                                notifyDepth: $t,
                                jobScheduleType: ye,
                                canManageJobs: ee,
                                getSessionStatus: Ft => g.get(Ft)?.status,
                                onNotifyCalled: () => {
                                    y.notifyCalledDuringDrain = !0
                                }
                            })
                        }),
                        allowedTools: ge,
                        tools: Xn,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: s,
                        onSdkTurnStarted: () => {
                            z += 1;
                            let Ft = !ke;
                            if (ke = z > te, Ft && ke && y.origin === "job" && y.jobId) {
                                let _t = y.jobId;
                                at.push(L.updateState(_t, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: Nn
                                }).catch(Dn => {
                                    se("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: T,
                                        jobId: _t,
                                        error: Dn instanceof Error ? Dn.message : String(Dn)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            te += 1;
                            let Ft = ke && z <= te;
                            if (ke = z > te, Ft && y.origin === "job" && y.jobId) {
                                let _t = y.jobId;
                                at.push(L.updateState(_t, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: Nn
                                }).catch(Dn => {
                                    se("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: T,
                                        jobId: _t,
                                        error: Dn instanceof Error ? Dn.message : String(Dn)
                                    })
                                }))
                            }
                        },
                        onStream: (Ft, _t, Dn) => {
                            y.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: T,
                                chunk: Ft,
                                isSidechain: _t,
                                anchorEventId: Dn
                            })
                        },
                        onExecutionEvent: Ft => {
                            Ft.type === "tool_use" && (y.isStreaming = !1, y.activeToolUseIds.add(Ft.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_use" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, j(y))), Ft.type === "tool_result" && (y.activeToolUseIds.delete(Ft.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_result" && y.activeToolUseIds.size === 0 && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, j(y)));
                            let _t = QXe(Ft);
                            if (_t && it.has(_t)) return;
                            _t && it.add(_t);
                            let Dn = Wme(Ft);
                            Dn && n.emit("session.execution", {
                                sessionKey: T,
                                event: Dn
                            })
                        }
                    })
                } finally {
                    y.admissionCallback = null, y.admissionInProgress || y.inflightEventIds.clear(), y.currentAbortController === ut && (y.currentAbortController = null), y.isStreaming = !1, y.activeToolUseIds.clear(), y.pendingPreempt = !1, y.pendingPreemptBoundary = null
                }
                if (nt("[session-manager] drain result", {
                        sessionKey: T,
                        actorRunId: y.actorRunId,
                        processed: Q.processed,
                        skipped: Q.skipped,
                        lockAcquired: Q.lockAcquired,
                        outboxRecords: Q.outboxRecords?.length ?? (Q.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - Tt
                    }), $e += Q.processed, ct = Q.mergeTransientFailure === !0, Q.cancelled && (ki = !0), Q.processed > 0 && (y.lastTurnCompletedAt = Date.now(), await co(t, T, "last_error").catch(() => {})), Q.compacted && y.runtime === "claude" && y.streamingState && !y.streamingState.closed) {
                    let ee = Z.memoryBoard ? V.boardLayerHash : void 0;
                    y.spawnBoardHash !== ee && (y.streamingState.needsRecreation = !0, Kt("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: T,
                        reason: "board-refresh(B4)",
                        generation: y.streamingGeneration,
                        spawn_board_hash: y.spawnBoardHash ? y.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: ee ? ee.slice(0, 12) : null
                    }))
                }
                if (y.pendingClear) y.sdkSessionId = void 0, y.pendingClear = !1, await lt(t, T, {
                    sdk_session_id: null,
                    pending_fork_to: null,
                    pending_undo: null
                }).catch(() => {}), K("[session-manager] applied pending clear after drain", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                });
                else {
                    let ee = await At(t, T);
                    if (ee?.sdk_session_id) {
                        let ge = !y.sdkSessionId,
                            Rt = y.sdkSessionId !== ee.sdk_session_id;
                        y.sdkSessionId = ee.sdk_session_id, (ge || Rt) && K("[session-manager] sdk session bound", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            sdkSessionId: y.sdkSessionId,
                            isNewSession: ge
                        })
                    }
                }
                if (Q.lastReplyText && (A = Q.lastReplyText), Q.outboxRecords && Q.outboxRecords.length > 0) {
                    nt("[session-manager] emitting outbox records", {
                        sessionKey: T,
                        actorRunId: y.actorRunId,
                        count: Q.outboxRecords.length
                    });
                    for (let ee of Q.outboxRecords) n.emit("session.output", {
                        sessionKey: ee.session_key,
                        record: ee
                    })
                } else Q.lastOutboxRecord ? (nt("[session-manager] emitting single outbox record", {
                    sessionKey: T,
                    actorRunId: y.actorRunId,
                    recordId: Q.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: T,
                    record: Q.lastOutboxRecord
                })) : y.origin === "channel" && Q.processed > 0 && !Q.cancelled && (nt("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey: T,
                    actorRunId: y.actorRunId,
                    turnSkipped: Q.turnSkipped === !0
                }), n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: Q.turnSkipped ? "skipped" : "interrupted"
                }));
                if (Q.processed === 0) {
                    if (y.origin === "job" || y.origin === "system") {
                        nt("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            origin: y.origin,
                            jobId: y.jobId
                        });
                        break
                    }
                    if (y.pendingWake) {
                        y.pendingWake = !1, nt("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: T,
                            actorRunId: y.actorRunId
                        });
                        continue
                    }
                    if (y.status = "idle", y.idleSince = new Date().toISOString(), y.pendingWake) {
                        y.pendingWake = !1, nt("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: T,
                            actorRunId: y.actorRunId
                        });
                        continue
                    }
                    if (nt("[session-manager] idle", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            attachedChannels: y.attachedChannels.size
                        }), y.holdsPoolSlot) {
                        let ge = b(T, y.origin);
                        ge.activeCount--, y.holdsPoolSlot = !1, nt("[session-manager] released pool slot (idle)", {
                            sessionKey: T,
                            pool: ge.name,
                            activeCount: ge.activeCount
                        }), v(ge)
                    }
                    let ee = !1;
                    for (; y.status === "idle";) {
                        if (y.pendingWake) {
                            y.pendingWake = !1, ee = !0;
                            break
                        }
                        if (await Xe(y, i) || y.status !== "idle") {
                            ee = !0;
                            break
                        }
                        if (y.attachedChannels.size > 0) {
                            nt("[session-manager] idle timeout but has attachments, continuing wait", {
                                sessionKey: T,
                                actorRunId: y.actorRunId,
                                attachedChannels: y.attachedChannels.size
                            });
                            continue
                        }
                        break
                    }
                    if (!ee && y.status === "idle") {
                        nt("[session-manager] idle timeout, no attachments, exiting", {
                            sessionKey: T,
                            actorRunId: y.actorRunId
                        }), y.streamingGeneration > 0 && Kt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                            sessionKey: T,
                            generation: y.streamingGeneration,
                            sdk_session_id: y.sdkSessionId ?? null
                        });
                        break
                    }
                    if (ee && !y.holdsPoolSlot) {
                        let ge = b(T, y.origin);
                        if (ge.activeCount >= ge.maxConcurrent) {
                            ge.wakeQueue.includes(T) || ge.wakeQueue.unshift(T), nt("[session-manager] woken idle actor re-queued (pool full)", {
                                sessionKey: T,
                                pool: ge.name,
                                activeCount: ge.activeCount
                            }), y.pendingWake = !1;
                            continue
                        }
                        ge.activeCount++, y.holdsPoolSlot = !0, nt("[session-manager] re-acquired pool slot (woken)", {
                            sessionKey: T,
                            pool: ge.name,
                            activeCount: ge.activeCount
                        })
                    }
                }
            }
        } catch (We) {
            Be(`[session-manager] error in drain loop for ${T}:`, We), D = We, await lt(t, T, {
                last_error: {
                    message: We instanceof Error ? We.message : String(We),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            if (await G(y), y.currentAbortController = null, y.streamingAdapter = null, y.isStreaming = !1, y.activeToolUseIds.clear(), y.pendingPreempt = !1, y.pendingPreemptBoundary = null, y.codexAdapter) {
                let fe = y.codexAdapter;
                y.codexAdapter = null, await Promise.resolve(fe.shutdown()).catch(H => {
                    se("[session-manager] codex adapter shutdown failed", {
                        sessionKey: T,
                        error: H instanceof Error ? H.message : String(H)
                    })
                })
            }
            let We = b(T, y.origin);
            if (y.holdsPoolSlot && (We.activeCount--, y.holdsPoolSlot = !1), y.origin === "job" && y.jobId) {
                at.length > 0 && await Promise.allSettled(at);
                try {
                    await xe(y, {
                        runStarted: ke,
                        cancelled: ki,
                        processedCount: $e,
                        claimCursor: Nn,
                        error: D,
                        resultText: A
                    })
                } finally {
                    y.status = "ended"
                }
            } else y.status = "ended";
            if (y.pendingWake = !1, E && Kme(Ir(t, T)) && !lr(T)) {
                let fe = await U(T, Je);
                fe === "fresh" ? (y.consecutiveConservativeRedrive = !1, nt("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                }), Ne(T, {
                    preempt: "never"
                })) : fe === "conservative" || ct ? y.consecutiveConservativeRedrive ? se("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                }) : (y.consecutiveConservativeRedrive = !0, nt("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                }), Ne(T, {
                    preempt: "never"
                })) : y.consecutiveConservativeRedrive = !1
            }
            K("[session-manager] actor end", {
                sessionKey: T,
                actorRunId: y.actorRunId,
                sdkSessionId: y.sdkSessionId,
                pool: We.name,
                activeCount: We.activeCount,
                origin: y.origin,
                jobId: y.jobId,
                attachedChannels: y.attachedChannels.size,
                queuedSessions: We.wakeQueue.length
            }), v(We)
        }
    }

    function Xe(y, T) {
        return new Promise(D => {
            let A = null,
                z = () => {
                    A && (clearTimeout(A), A = null), y.wakeResolver = null
                };
            y.wakeResolver = () => {
                z(), D(!0)
            }, A = setTimeout(() => {
                z(), D(!1)
            }, T)
        })
    }
    async function Sn(y) {
        return new Set(await Hg(qg(t, y)))
    }
    async function U(y, T) {
        let D;
        try {
            D = await Sn(y)
        } catch (A) {
            return se("[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)", {
                sessionKey: y,
                error: A instanceof Error ? A.message : String(A)
            }), "conservative"
        }
        for (let A of D)
            if (!T.has(A)) return "fresh";
        return "none"
    }
    let L = new rs(t);

    function M(y) {
        return y.error ? y.runStarted ? "STARTED_FAILURE" : "NEVER_STARTED_FAILURE" : y.cancelled ? y.runStarted ? "CANCELLED_POST_ACK" : "CANCELLED_PRE_ACK" : !y.runStarted && y.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"
    }
    async function F(y, T, D, A, z, te) {
        try {
            let ke = await L.finalizeJobState(y, D, {
                consumeRunAt: A,
                expectedClaimCursor: z
            });
            return ke === tU ? (K(`[session-manager] job gone at finalize (${te}) — state frozen`, {
                jobId: y,
                sessionKey: T
            }), {
                kind: "gone"
            }) : ke === nU ? (se(`[session-manager] stale finalize (${te}) — a fresh claim owns the sidecar; nothing written`, {
                jobId: y,
                sessionKey: T,
                claimCursor: z
            }), {
                kind: "stale"
            }) : {
                kind: "written",
                runAt: ke.run_at
            }
        } catch (ke) {
            return Be(`[session-manager] job state finalize failed (${te})`, ke), {
                kind: "failed"
            }
        }
    }
    async function xe(y, T) {
        let D = y.jobId,
            {
                sessionKey: A
            } = y,
            {
                runStarted: z,
                cancelled: te,
                processedCount: ke,
                claimCursor: at,
                error: $e,
                resultText: ct
            } = T,
            ki = M({
                error: $e,
                cancelled: te,
                runStarted: z,
                processedCount: ke
            });
        try {
            await L.init();
            let Nn = await L.getJob(D),
                Je = Nn?.frontmatter.cron ?? "";
            switch (ki) {
                case "NEVER_STARTED_FAILURE": {
                    let We = $e instanceof Error ? $e.message : String($e);
                    await F(D, A, {
                        last_result: "failure",
                        last_error: We
                    }, !1, at, "never-started failure"), await Oe({
                        jobId: D,
                        sessionKey: A,
                        job: Nn,
                        cron: Je,
                        errorMsg: We
                    }), K("[session-manager] job failed (never started, spawn-class) — job preserved", {
                        jobId: D,
                        sessionKey: A,
                        cron: Je,
                        error: We
                    });
                    break
                }
                case "STARTED_FAILURE": {
                    let We = $e instanceof Error ? $e.message : String($e),
                        ye = await F(D, A, {
                            last_result: "failure",
                            last_error: We
                        }, !0, at, "started failure");
                    await Oe({
                        jobId: D,
                        sessionKey: A,
                        job: Nn,
                        cron: Je,
                        errorMsg: We
                    }), await ze({
                        jobId: D,
                        sessionKey: A,
                        cron: Je,
                        state: ye
                    }), K("[session-manager] job failed", {
                        jobId: D,
                        sessionKey: A,
                        error: We
                    });
                    break
                }
                case "CANCELLED_POST_ACK": {
                    let We = await F(D, A, {
                        last_result: "failure",
                        last_error: "cancelled"
                    }, !0, at, "cancelled post-ack");
                    await ze({
                        jobId: D,
                        sessionKey: A,
                        cron: Je,
                        state: We
                    }), se("[session-manager] job run cancelled after turn ack — consumed + failure marker, no delivery", {
                        jobId: D,
                        sessionKey: A
                    });
                    break
                }
                case "ZERO_FED": {
                    await F(D, A, {
                        last_result: "failure",
                        last_error: "zero-fed run — no items merged"
                    }, !1, at, "zero-fed"), se("[session-manager] zero-fed job run — failure marker written, job preserved", {
                        jobId: D,
                        sessionKey: A
                    });
                    break
                }
                case "CANCELLED_PRE_ACK": {
                    se("[session-manager] job run ended without turn ack (cancelled before start) — finalize skipped, job preserved", {
                        jobId: D,
                        sessionKey: A,
                        processedCount: ke
                    });
                    break
                }
                case "STARTED_SUCCESS": {
                    let We = await F(D, A, {
                            last_result: "success",
                            last_run_at: new Date().toISOString(),
                            last_error: void 0
                        }, !0, at, "success"),
                        ye = createSpineEvent({
                            type: "job.complete",
                            source: {
                                kind: "job",
                                name: D
                            },
                            session_key: A,
                            payload: {
                                job_id: D,
                                result_summary: ct?.slice(0, 200)
                            }
                        });
                    await atomicAppendEvent(t, ye);
                    let fe = ct?.slice(0, 200);
                    n.emit("job.completed", {
                        jobId: D,
                        sessionKey: A,
                        resultSummary: fe
                    }), y.notifyCalledDuringDrain ? Pe("[session-manager] skipping system job.complete delivery: agent called Notify", {
                        jobId: D,
                        sessionKey: A
                    }) : await et(Nn, A, "job.complete", {
                        job_id: D,
                        result_summary: fe,
                        result_text: ct?.slice(0, 2e3),
                        agent_notified: !1,
                        schedule_type: A2(Je),
                        owner_session: Nn?.frontmatter.owner_session
                    }), await ze({
                        jobId: D,
                        sessionKey: A,
                        cron: Je,
                        state: We
                    }), K("[session-manager] job completed", {
                        jobId: D,
                        sessionKey: A
                    });
                    break
                }
            }
        } catch (Nn) {
            Be("[session-manager] error finalizing job session", Nn)
        }
    }
    async function Oe(y) {
        let {
            jobId: T,
            sessionKey: D,
            job: A,
            cron: z,
            errorMsg: te
        } = y, ke = createSpineEvent({
            type: "job.fail",
            source: {
                kind: "job",
                name: T
            },
            session_key: D,
            payload: {
                job_id: T,
                error: te
            }
        });
        await atomicAppendEvent(t, ke), n.emit("job.failed", {
            jobId: T,
            sessionKey: D,
            error: te
        }), await et(A, D, "job.fail", {
            job_id: T,
            error: te,
            agent_notified: !1,
            schedule_type: A2(z),
            owner_session: A?.frontmatter.owner_session
        })
    }
    async function ze(y) {
        let {
            jobId: T,
            sessionKey: D,
            cron: A,
            state: z
        } = y;
        if (XXe(A)) {
            switch (z.kind) {
                case "gone":
                    K("[session-manager] skip auto-archive: job already gone (archived mid-run)", {
                        jobId: T,
                        cron: A
                    });
                    return;
                case "stale":
                    K("[session-manager] skip auto-archive: stale finalize (a fresh claim owns the job)", {
                        jobId: T,
                        cron: A
                    });
                    return;
                case "failed":
                    se("[session-manager] skip auto-archive: job state unreadable at finalize (failing toward stale-active)", {
                        jobId: T,
                        cron: A
                    });
                    return;
                case "written":
                    if (z.runAt !== null) {
                        K("[session-manager] skip auto-archive: job re-armed via reschedule", {
                            jobId: T,
                            cron: A,
                            runAt: z.runAt
                        });
                        return
                    }
                    break;
                default:
                    return z
            }
            try {
                let te = await L.archiveJobIfNotRearmed(T);
                if (!te.archived) {
                    K("[session-manager] skip auto-archive: job re-armed during finalize", {
                        jobId: T,
                        cron: A,
                        runAt: te.runAt
                    });
                    return
                }
                if ((await Pae(t, D)).reason === "archive_in_flight") {
                    se("[session-manager] skip finalize session archive: archive already in flight", {
                        jobId: T,
                        sessionKey: D
                    });
                    return
                }
                K("[session-manager] auto-archived one-shot job", {
                    jobId: T,
                    cron: A
                })
            } catch (te) {
                Be("[session-manager] failed to auto-archive one-shot job", te)
            }
        }
    }
    async function et(y, T, D, A) {
        if (!y) return;
        let z = Ha(y.frontmatter.notify);
        if (z.length !== 0)
            for (let te = 0; te < z.length; te++) {
                let ke = rm(z[te]);
                if (!ke) {
                    se("[session-manager] invalid notify target in job, skipping delivery", {
                        jobId: y.id,
                        notify: z[te]
                    });
                    continue
                }
                try {
                    await Jl(t, n, {
                        traceId: `job-finalize_${y.id}_${te}`,
                        routeId: `job-result-${te}`,
                        sourceName: `job:${y.id}`,
                        sourceSessionKey: T,
                        targetSessionKey: ke,
                        eventType: D,
                        payload: A
                    }), Pe("[session-manager] job result delivered to notify target", {
                        jobId: y.id,
                        targetSessionKey: ke,
                        eventType: D
                    })
                } catch (at) {
                    se("[session-manager] failed to deliver job result to notify target", {
                        jobId: y.id,
                        targetSessionKey: ke,
                        eventType: D,
                        error: String(at)
                    })
                }
            }
    }

    function yt(y, T) {
        if (!E) return;
        if (lr(T)) {
            nt("[session-manager] skip job spawn, session is being archived", {
                jobId: y,
                sessionKey: T
            });
            return
        }
        let D = g.get(T);
        if (D && D.status !== "ended") {
            nt("[session-manager] skip duplicate job spawn", {
                jobId: y,
                sessionKey: T,
                actorStatus: D.status
            });
            return
        }
        if (_.activeCount >= _.maxConcurrent) {
            _.wakeQueue.includes(T) || _.wakeQueue.push(T), D ? (D.origin = "job", D.jobId = y) : g.set(T, {
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
                isStreaming: !1,
                activeToolUseIds: new Set,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: new Set,
                origin: "job",
                jobId: y,
                jobStateless: !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                idleSince: void 0,
                notifyCalledDuringDrain: !1,
                runtime: "claude",
                codexAdapter: null,
                consecutiveConservativeRedrive: !1
            });
            return
        }
        ot(T, {
            origin: "job",
            jobId: y
        }), (async () => {
            try {
                let A = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: y
                    },
                    session_key: T,
                    payload: {
                        job_id: y
                    }
                });
                await atomicAppendEvent(t, A), n.emit("job.spawned", {
                    jobId: y,
                    sessionKey: T
                })
            } catch (A) {
                Be("[session-manager] error recording job spawn", A)
            }
        })()
    }
    async function Tn(y, T) {
        let A = (k.get(y) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (y.startsWith("job:") || y.startsWith("meta:") || y.startsWith("system:") || y.startsWith("cadence:")) return;
            let z = Gme(y),
                te = new Date().toISOString(),
                ke = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: z,
                        name: "session-manager"
                    },
                    session_key: y,
                    payload: {
                        session_key: y,
                        channel_kind: z,
                        channel_id: T,
                        attached_at: te
                    }
                });
            await atomicAppendEvent(t, ke)
        }).finally(() => {
            k.get(y) === A && k.delete(y)
        });
        k.set(y, A), await A
    }

    function Ze() {
        for (let y of g.values()) {
            if (y.status = "ended", y.codexAdapter) {
                let T = y.codexAdapter;
                y.codexAdapter = null, Promise.resolve(T.shutdown()).catch(D => {
                    se("[session-manager] codex adapter shutdown failed", {
                        sessionKey: y.sessionKey,
                        error: D instanceof Error ? D.message : String(D)
                    })
                })
            }
            y.streamAbortController && !y.streamAbortController.signal.aborted && y.streamAbortController.abort(), typeof y.query?.close == "function" && y.query.close(), y.query = null, y.streamAbortController = null, y.currentAbortController && !y.currentAbortController.signal.aborted && y.currentAbortController.abort(), y.currentAbortController = null, y.wakeResolver && (y.wakeResolver(), y.wakeResolver = null)
        }
    }
    async function Qn() {
        if (k.size === 0) return;
        let y = Array.from(k.values()),
            T = new Promise(D => setTimeout(D, 3e4));
        await Promise.race([Promise.allSettled(y).then(() => {}), T])
    }
    return {
        async start() {
            if (!E) {
                E = !0, n.on("session.wake", $), n.on("shutdown", I), n.on("session.streaming_invalidated", P);
                try {
                    let y = await rehydrateSessionState(t);
                    for (let T of y) {
                        if (lr(T)) {
                            nt("[session-manager] skip hydrating session being archived", {
                                sessionKey: T
                            });
                            continue
                        }
                        let A = (await At(t, T))?.cwd;
                        if (A && !set(A)) {
                            se("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: T,
                                cwd: A
                            });
                            continue
                        }
                        if (lr(T)) {
                            nt("[session-manager] skip hydrating session being archived", {
                                sessionKey: T
                            });
                            continue
                        }
                        let z = N2(T),
                            te = b(T);
                        te.activeCount < te.maxConcurrent ? ot(T, z ?? void 0) : te.wakeQueue.push(T)
                    }
                } catch (y) {
                    Be("[session-manager] error hydrating sessions:", y)
                }
                K("[session-manager] started", {
                    channelActive: h.activeCount,
                    channelQueued: h.wakeQueue.length,
                    jobActive: _.activeCount,
                    jobQueued: _.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!E) return;
            E = !1, n.off("session.wake", $), n.off("shutdown", I), n.off("session.streaming_invalidated", P), Ze();
            let y = Array.from(g.values()).map(T => T.drainPromise).filter(T => T !== null);
            if (y.length > 0) {
                let T = new Promise(D => setTimeout(D, 3e4));
                await Promise.race([Promise.all(y), T])
            }
            await Qn(), g.clear(), h.wakeQueue.length = 0, h.activeCount = 0, _.wakeQueue.length = 0, _.activeCount = 0, K("[session-manager] stopped")
        },
        wakeSession: Ne,
        getActor(y) {
            return g.get(y)
        },
        activeCount() {
            return h.activeCount + _.activeCount
        },
        activeChannelCount() {
            return h.activeCount
        },
        activeJobCount() {
            return _.activeCount
        },
        isRunning() {
            return E
        },
        attachChannel(y, T) {
            let D = g.get(y);
            D || (D = {
                sessionKey: y,
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
                activeToolUseIds: new Set,
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
                notifyCalledDuringDrain: !1,
                runtime: "claude",
                codexAdapter: null,
                consecutiveConservativeRedrive: !1
            }, g.set(y, D)), D.attachedChannels.add(T), nt("[session-manager] channel attached", {
                sessionKey: y,
                channelId: T,
                totalAttachments: D.attachedChannels.size
            }), Tn(y, T).catch(A => {
                se("[session-manager] failed to emit channel.attached event", {
                    sessionKey: y,
                    channelId: T,
                    error: String(A)
                })
            })
        },
        detachChannel(y, T) {
            let D = g.get(y);
            D && (D.attachedChannels.delete(T), nt("[session-manager] channel detached", {
                sessionKey: y,
                channelId: T,
                remainingAttachments: D.attachedChannels.size
            }), D.attachedChannels.size === 0 && D.status === "idle" && D.wakeResolver && (D.wakeResolver(), D.wakeResolver = null))
        },
        hasAttachedChannels(y) {
            let T = g.get(y);
            return T ? T.attachedChannels.size > 0 : !1
        },
        spawnJobSession(y, T) {
            yt(y, T)
        },
        async interruptSession(y) {
            if (!E) return {
                interrupted: !1,
                reason: "not_running"
            };
            let T = g.get(y);
            return T ? !T.query && (!T.currentAbortController || T.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : T.streamAbortController && !T.streamAbortController.signal.aborted ? (K("[session-manager] interrupt: stopping streaming session", {
                sessionKey: y,
                actorRunId: T.actorRunId
            }), await G(T, "cancel-interrupt"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (X(T, "immediate") === "immediate" && K("[session-manager] interrupt requested", {
                sessionKey: y,
                actorRunId: T.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(y) {
            if (!E) return {
                cleared: !1,
                reason: "not_running"
            };
            let T = g.get(y),
                D = T?.sdkSessionId;
            return T && (T.pendingClear = !0, T.sdkSessionId = void 0, T.sdkSessionIdVerified = !1), T?.streamAbortController && !T.streamAbortController.signal.aborted ? await G(T, "clear") : T?.currentAbortController && !T.currentAbortController.signal.aborted && X(T, "immediate"), await lt(t, y, {
                sdk_session_id: null,
                pending_fork_to: null,
                pending_undo: null
            }), K("[session-manager] SDK session cleared", {
                sessionKey: y,
                actorRunId: T?.actorRunId,
                previousSessionId: D
            }), {
                cleared: !0,
                previousSessionId: D
            }
        },
        async getSessionModelView(y) {
            let T = g.get(y),
                D = await At(t, y).catch(() => null),
                A = {
                    runtime: await p(y, T),
                    storedModel: D?.model,
                    hasLiveQuery: !!T?.query
                },
                z = T?.query;
            if (z && typeof z.supportedModels == "function") try {
                A.available = d(await z.supportedModels())
            } catch {}
            return A
        },
        async setSessionModel(y, T) {
            if (!E) return {
                ok: !1,
                reason: "not_running"
            };
            let D = g.get(y);
            if (await p(y, D) === "codex") return await lt(t, y, {
                model: T ?? null,
                model_runtime: T !== null ? "codex" : null,
                pending_model_fork: !0
            }), K("[session-manager] codex session model override updated", {
                sessionKey: y,
                model: T ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: T,
                applied: "stored"
            };
            let A = D?.query,
                z;
            if (T && A && typeof A.supportedModels == "function") try {
                z = (await A.supportedModels()).some(at => at.value === T)
            } catch {}
            let te = "stored";
            if (A && typeof A.setModel == "function") try {
                await A.setModel(T ?? void 0), te = "live"
            } catch (ke) {
                se("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: y,
                    model: T ?? "(reset to default)",
                    error: ke instanceof Error ? ke.message : String(ke)
                })
            }
            return await lt(t, y, {
                model: T ?? null,
                model_runtime: T !== null ? "claude" : null,
                pending_model_fork: null
            }), K("[session-manager] session model override updated", {
                sessionKey: y,
                model: T ?? "(reset to default)",
                applied: te,
                listed: z ?? "(no list consulted)"
            }), {
                ok: !0,
                model: T,
                applied: te,
                listed: z
            }
        },
        async getSessionEffortView(y) {
            let T = g.get(y),
                D = await At(t, y).catch(() => null);
            return {
                runtime: await p(y, T),
                storedEffort: D?.effort ?? void 0,
                hasLiveQuery: !!T?.query
            }
        },
        async setSessionEffort(y, T) {
            if (!E) return {
                ok: !1,
                reason: "not_running"
            };
            let D = g.get(y);
            if (await p(y, D) === "codex") return await lt(t, y, {
                effort: T ?? null
            }), K("[session-manager] codex session effort override updated", {
                sessionKey: y,
                effort: T ?? "(reset to default)"
            }), {
                ok: !0,
                effort: T,
                applied: "stored"
            };
            let A = D?.query,
                z = "stored";
            if (A && typeof A.applyFlagSettings == "function") try {
                await A.applyFlagSettings({
                    effortLevel: T ?? null
                }), z = "live"
            } catch (te) {
                se("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: y,
                    effort: T ?? "(reset to default)",
                    error: te instanceof Error ? te.message : String(te)
                })
            }
            return await lt(t, y, {
                effort: T ?? null
            }), K("[session-manager] session effort override updated", {
                sessionKey: y,
                effort: T ?? "(reset to default)",
                applied: z
            }), {
                ok: !0,
                effort: T,
                applied: z
            }
        },
        getActorView(y) {
            let T = g.get(y);
            return !T || T.actorRunId <= 0 ? null : {
                sessionKey: T.sessionKey,
                status: T.status,
                health: "ok",
                idleSince: T.status === "idle" ? T.idleSince : void 0,
                attachedChannels: T.attachedChannels.size,
                sdkSessionId: T.sdkSessionId,
                origin: T.origin,
                jobId: T.jobId,
                runtime: T.runtime
            }
        },
        hasQueuedWake: w,
        listActors() {
            let y = new Map;
            for (let [T, D] of g) D.actorRunId <= 0 && !w(D.sessionKey) || y.set(T, {
                sessionKey: D.sessionKey,
                status: D.status,
                health: "ok",
                idleSince: D.status === "idle" ? D.idleSince : void 0,
                attachedChannels: D.attachedChannels.size,
                sdkSessionId: D.sdkSessionId,
                origin: D.origin,
                jobId: D.jobId,
                runtime: D.runtime
            });
            return y
        },
        getSweeperActorState(y) {
            let T = g.get(y);
            return !T || T.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: T.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: T.lastActivityAt,
                lastTurnCompletedAt: T.lastTurnCompletedAt,
                spawnedAt: T.spawnedAt
            }
        }
    }
}
