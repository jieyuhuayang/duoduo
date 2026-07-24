// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: HXe, daemon.pretty.js:71489)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
    let {
        paths: t,
        bus: n,
        sdk: r,
        idleTimeoutMs: i = 36e5,
        heartbeatIntervalMs: s = 3e4
    } = e, o = r ?? createAgentSdkAdapter(), a = e.codexAvailability ?? checkCodexAvailability, u = e.codexAdapterFactory ?? createCodexAppServerAdapter, c = null, l = () => (c || (c = a()), c), d = y => y.map(T => ({
        value: T.value,
        displayName: T.displayName
    }));
    async function p(y, T) {
        if (T?.runtime === "codex") return "codex";
        let N = (await At(t, y).catch(() => null))?.source_channel_id;
        if (!N) return T?.runtime ?? "claude";
        let M = await ji(t, N).catch(() => null),
            ee = M?.channel_kind,
            ke = ee ? await ea(t.channelConfigDir, ee).catch(() => null) : null;
        return (M?.runtime ?? ke?.runtime) === "codex" && (await l()).ok ? "codex" : T?.runtime ?? "claude"
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
        return qXe(y, T) === "job" ? _ : h
    }

    function v(y) {
        return h.wakeQueue.includes(y) || _.wakeQueue.includes(y)
    }

    function w(y) {
        if (y.wakeQueue.length === 0 || !E) return;
        let T = y.wakeQueue.findIndex(M => !fr(M));
        if (T === -1) {
            rt("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: y.name,
                queuedSessions: y.wakeQueue.length
            });
            return
        }
        let j = y.wakeQueue.splice(T, 1)[0];
        T > 0 && rt("[session-manager] dequeue skipped archiving sessions", {
            skipped: T,
            sessionKey: j,
            pool: y.name
        }), rt("[session-manager] dequeue queued wake", {
            sessionKey: j,
            pool: y.name,
            queuedSessions: y.wakeQueue.length
        });
        let N = g.get(j);
        if (N && N.status === "idle" && !N.holdsPoolSlot && N.drainPromise) {
            N.pendingWake = !0, N.wakeResolver && (N.wakeResolver(), N.wakeResolver = null), rt("[session-manager] resuming idle actor from dequeue", {
                sessionKey: j,
                actorRunId: N.actorRunId,
                pool: y.name
            });
            return
        }
        if (y.activeCount >= y.maxConcurrent) {
            y.wakeQueue.unshift(j), rt("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: j,
                pool: y.name,
                activeCount: y.activeCount
            });
            return
        }
        if (N?.origin === "job" && N.jobId) {
            let M = N.jobId;
            Nt(j, {
                origin: "job",
                jobId: M
            })
        } else {
            let M = $2(j);
            Nt(j, M ?? void 0)
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
            preempt: j,
            preemptBoundary: N
        }) => {
            rt("[session-manager] wake", {
                sessionKey: y,
                preempt: j ?? "allow",
                preemptBoundary: N ?? "default"
            }), T && x.set(y, T), Ue(y, {
                preempt: j,
                preemptBoundary: N
            })
        },
        I = () => {
            Je()
        },
        P = ({
            sessionKey: y,
            reason: T
        }) => {
            let j = g.get(y);
            if (!j) return;
            let N = j.streamingAdapter !== null;
            j.streamingAdapter = null;
            let M = !1;
            j.streamingState && !j.streamingState.closed && (j.streamingState.needsRecreation = !0, M = !0), (N || M) && J("[session-manager] streamingAdapter torn down for session", {
                sessionKey: y,
                reason: T,
                hadAdapter: N,
                stateMarked: M
            }), M && Yt("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: y,
                reason: T === "fork" ? "undo-fork" : "instructions-drift",
                generation: j.streamingGeneration,
                sdk_session_id: j.sdkSessionId ?? null
            })
        };

    function C(y) {
        y.query?.interrupt().catch(() => {})
    }

    function L(y) {
        if (y.query) {
            C(y);
            return
        }
        y.currentAbortController?.abort()
    }

    function G(y, T, j) {
        if (y.query) {
            if (j === "tool_result" && y.activeToolUseIds.size > 0) return y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result";
            let N = y.streamingState?.currentTurn;
            return N && !N.accepted ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "accept", "defer_accept") : (C(y), y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate")
        }
        return !y.currentAbortController || y.currentAbortController.signal.aborted ? "noop" : j === "tool_result" ? y.activeToolUseIds.size > 0 ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate") : j === "tool_use" ? y.isStreaming ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_use", "defer_tool_use") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate") : T === "soft" && y.isStreaming ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_use", "defer_tool_use") : T === "soft" && y.activeToolUseIds.size > 0 ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate")
    }

    function K(y) {
        let T;
        for (let j of y.inflightEventIds)(T ??= new Set).add(j);
        return T
    }

    function Q(y) {
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
    async function W(y, T) {
        let j = y.streamingState;
        if (!j) return;
        T && Yt("warn", `[kv-cache] streaming teardown: ${T}`, {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null
        });
        let N = y.query;
        y.streamingState = null, y.query = null, y.streamAbortController = null, y.spawnBoardHash = void 0, j.abortController.signal.aborted || j.abortController.abort(), typeof N?.close == "function" && N.close();
        try {
            await j.loopPromise
        } catch {}
    }
    async function ae(y, T) {
        let j = T,
            N = String(j.task_id ?? "unknown"),
            M = String(j.status ?? "completed"),
            ee = String(j.summary ?? ""),
            ke = String(j.output_file ?? "");
        try {
            let ct = await Wl(t, n, {
                traceId: `task-notify-${N}`,
                routeId: "task_notification",
                sourceName: "sdk_subagent",
                targetSessionKey: y,
                sourceSessionKey: y,
                eventType: "notify",
                walOnly: !0,
                payload: {
                    task_id: N,
                    task_status: M,
                    task_summary: ee || void 0,
                    task_output_file: ke || void 0,
                    completion_owner: "claude-cli"
                }
            });
            Pe("[session-manager] task_notification recorded WAL-only", {
                sessionKey: y,
                taskId: N,
                status: M,
                success: ct.success
            })
        } catch (ct) {
            Ve("[session-manager] task_notification WAL record failed", {
                sessionKey: y,
                taskId: N,
                status: M,
                error: ct instanceof Error ? ct.message : String(ct)
            })
        }
    }
    async function Oe(y, T) {
        if (!o.createStreamingQuery) throw new Error("Streaming query support unavailable");
        let j = Q(T),
            N = T.sessionId;
        if (y.streamingState && !y.streamingState.closed && !y.streamingState.needsRecreation && y.streamingState.configSignature === j && (y.streamingState.hasAcceptedTurn || y.streamingState.initialSessionId === N)) return y.streamingState;
        let M = y.streamingState;
        M && !M.closed && (M.configSignature !== j ? Yt("warn", "[kv-cache] respawn: signature-mismatch", {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null,
            diff: Ume(M.configSignature, j)
        }) : M.needsRecreation ? Pe("[kv-cache] respawn: recreation-requested (already audited at source)", {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null
        }) : Yt("warn", "[kv-cache] respawn: resume-sessionid-change", {
            sessionKey: y.sessionKey,
            generation: y.streamingGeneration,
            sdk_session_id: y.sdkSessionId ?? null,
            requested_session_id: N ?? null
        })), await W(y);
        let ee = new WI,
            ke = new AbortController,
            ct = T.mcpServersFactory ? T.mcpServersFactory() : T.mcpServers,
            Ne = {
                queue: ee,
                abortController: ke,
                configSignature: j,
                initialSessionId: N,
                hasAcceptedTurn: !1,
                needsRecreation: !1,
                closed: !1,
                currentTurn: null,
                loopPromise: Promise.resolve(),
                cliTurnTentative: null
            },
            lt = ue => {
                for (let ye of ee.drain()) ye.reject(ue())
            };
        async function* xi() {
            for (; !ke.signal.aborted;) {
                let ue;
                try {
                    ue = await ee.dequeue(ke.signal)
                } catch (me) {
                    if (me instanceof Error && me.name === "AbortError") return;
                    throw me
                }
                let ye = Ne.currentTurn;
                if (ye !== null && ye !== ue) {
                    ie("[session-manager] drain turn dequeued while the slot is occupied — rejected", {
                        sessionKey: y.sessionKey,
                        occupantAccepted: ye.accepted
                    }), ue.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming slot occupied — prompt not yielded; retry after the occupant settles"));
                    continue
                } else Ne.currentTurn = ue, Ne.cliTurnTentative && (Ne.cliTurnTentative.compromised = !0), ue.accepted = !1, ue.streamedText = "", ue.turnStreamedText = "", ue.toolUseMap.clear();
                for await (let me of ue.input.prompt) yield me
            }
        }
        let An = T.sessionId,
            {
                query: He
            } = o.createStreamingQuery({
                prompt: xi(),
                abortController: ke,
                sessionId: An,
                cwd: T.cwd,
                settingSources: T.settingSources,
                persistSession: T.persistSession,
                permissionMode: T.permissionMode,
                allowedTools: T.allowedTools,
                disallowedTools: T.disallowedTools,
                tools: T.tools,
                effort: T.effort,
                mcpServers: ct,
                additionalDirectories: T.additionalDirectories,
                autoloadAdditionalDirectoryClaudeMd: T.autoloadAdditionalDirectoryClaudeMd,
                systemPrompt: T.systemPrompt,
                hooks: {
                    PreToolUse: [{
                        matcher: "*",
                        hooks: [async ue => {
                            let ye = ue,
                                me = ye.transcript_path;
                            return typeof me == "string" && me.length > 0 && ye.agent_id === void 0 && y.lastTranscriptPath !== me && (y.lastTranscriptPath = me, dt(t, y.sessionKey, {
                                transcript_path: me
                            }).catch(() => {})), {}
                        }]
                    }, {
                        matcher: h_,
                        hooks: [async () => {
                            let ue = Ne.currentTurn;
                            return ue ? ue.skipCalled = !0 : Ne.cliTurnTentative && (Ne.cliTurnTentative.skipObserved = !0), {}
                        }]
                    }],
                    PostToolUse: [{
                        matcher: "*",
                        hooks: [async () => {
                            let ue = [],
                                ye = y.pendingSteer;
                            if (ye && (y.pendingSteer = null, !ye.settled)) {
                                ye.settled = !0;
                                try {
                                    await _r(t, y.sessionKey, ye.eventIds)
                                } catch (me) {
                                    J("[session-manager] steer hook markDone error", {
                                        sessionKey: y.sessionKey,
                                        error: String(me)
                                    })
                                }
                                for (let me of ye.claimedEventIds) y.inflightEventIds.delete(me);
                                J("[session-manager] steer hook: injected interjection mid-turn", {
                                    sessionKey: y.sessionKey,
                                    eventIds: ye.eventIds
                                }), ue.push(ye.steerText)
                            }
                            return ue.length === 0 ? {} : {
                                hookSpecificOutput: {
                                    hookEventName: "PostToolUse",
                                    additionalContext: ue.join(`

`)
                                }
                            }
                        }]
                    }]
                }
            });
        y.query = He, y.streamAbortController = ke, y.streamingState = Ne, y.spawnBoardHash = T.boardHash, y.streamingGeneration += 1;
        let Ye = y.streamingGeneration,
            he, de = typeof He.setModel == "function",
            V = typeof He.applyFlagSettings == "function";
        if (de || V) {
            let ue = await At(t, y.sessionKey).catch(() => null);
            if (de) {
                let ye = ue?.model;
                if (he = ye, ye && !ke.signal.aborted) try {
                    await He.setModel(ye)
                } catch (me) {
                    ie("[session-manager] failed to re-apply session model override — clearing it", {
                        sessionKey: y.sessionKey,
                        model: ye,
                        error: me instanceof Error ? me.message : String(me)
                    }), await dt(t, y.sessionKey, {
                        model: null,
                        model_runtime: null
                    }).catch(() => {}), he = void 0
                }
            }
            if (V && !ke.signal.aborted) {
                let ye = ue?.effort ?? null,
                    me = T.effort ?? null;
                if (ye !== me) try {
                    await He.applyFlagSettings({
                        effortLevel: ye
                    })
                } catch (Y) {
                    ie("[session-manager] failed to re-apply session effort override at spawn", {
                        sessionKey: y.sessionKey,
                        effort: ye ?? "(reset to default)",
                        error: Y instanceof Error ? Y.message : String(Y)
                    })
                }
            }
        }
        J("[kv-cache] streaming subprocess spawned", {
            sessionKey: y.sessionKey,
            generation: Ye,
            model: he ?? "default",
            board_hash: T.boardHash ? T.boardHash.slice(0, 12) : null
        });
        let Wt = ue => {
                typeof He.interrupt == "function" && (J("[session-manager] Skip called — interrupting turn at tool_result boundary", {
                    sessionKey: y.sessionKey,
                    context: ue
                }), Promise.resolve(He.interrupt()).catch(ye => {
                    ie("[session-manager] skip interrupt failed", {
                        sessionKey: y.sessionKey,
                        context: ue,
                        error: ye instanceof Error ? ye.message : String(ye)
                    })
                }))
            },
            Jt = (ue, ye, me, Y = !1) => {
                if (ye && !ue.skipCalled) {
                    if (Y) {
                        ue.input.onStream?.(ye, !0);
                        return
                    }
                    if (me) {
                        ue.streamedText += ye, ue.turnStreamedText += ye, ue.input.onStream?.(ye, !1);
                        return
                    }
                    if (ue.turnStreamedText && ye.startsWith(ue.turnStreamedText)) {
                        let Ge = ye.slice(ue.turnStreamedText.length);
                        Ge && (ue.streamedText += Ge, ue.turnStreamedText = ye, ue.input.onStream?.(Ge, !1));
                        return
                    }
                    if (ye.startsWith(ue.streamedText)) {
                        let Ge = ye.slice(ue.streamedText.length);
                        Ge && (ue.streamedText = ye, ue.turnStreamedText += Ge, ue.input.onStream?.(Ge, !1));
                        return
                    }
                    ue.streamedText += ye, ue.turnStreamedText += ye, ue.input.onStream?.(ye, !1)
                }
            },
            at = async () => {
                let ue = y.pendingSteer;
                if (ue && (y.pendingSteer = null, !ue.settled)) {
                    if (Ne.closed) {
                        ue.settled = !0;
                        let ye = [];
                        for (let Y = 0; Y < ue.requeueLines.length; Y += 1) {
                            let Ge = ue.requeueLines[Y],
                                ut = ue.requeueEventIds[Y];
                            try {
                                await Ho(t, y.sessionKey, Ge), ye.push(ut)
                            } catch (Ee) {
                                ie("[session-manager] steer fallback closed-stream requeue failed", {
                                    sessionKey: y.sessionKey,
                                    eventId: ut,
                                    error: Ee instanceof Error ? Ee.message : String(Ee)
                                })
                            }
                        }
                        let me = [...ye, ...ue.processedEventIds];
                        if (me.length > 0) try {
                            await _r(t, y.sessionKey, me)
                        } catch (Y) {
                            J("[session-manager] steer fallback closed markDone error", {
                                sessionKey: y.sessionKey,
                                error: String(Y)
                            })
                        }
                        for (let Y of ue.claimedEventIds) y.inflightEventIds.delete(Y);
                        y.pendingWake = !0, J("[session-manager] steer fallback requeued to inbox (stream closed)", {
                            sessionKey: y.sessionKey,
                            eventIds: ue.eventIds,
                            requeued: ye.length,
                            requeueFailed: ue.requeueLines.length - ye.length
                        });
                        return
                    }
                    ue.settled = !0;
                    try {
                        await ue.enqueueAsNewTurn()
                    } catch (ye) {
                        J("[session-manager] steer fallback enqueue error", {
                            sessionKey: y.sessionKey,
                            error: String(ye)
                        })
                    }
                }
            }, Nn = ue => ue.origin?.kind === "task-notification", $e = async (ue, ye, me, Y) => {
                let Ge = ue,
                    ut = typeof Ge.duration_ms == "number" && Number.isFinite(Ge.duration_ms) && Ge.duration_ms >= 0 ? Ge.duration_ms : 0,
                    Ee = typeof Ge.duration_api_ms == "number" && Number.isFinite(Ge.duration_api_ms) && Ge.duration_api_ms >= 0 ? Ge.duration_api_ms : 0;
                try {
                    await appendDrainRecord(t, {
                        origin: "cli-turn",
                        id: NXe(),
                        session_key: y.sessionKey,
                        sdk_session_id: y.sdkSessionId,
                        drain_started_at: new Date(Y - ut).toISOString(),
                        drain_duration_ms: ut,
                        sdk_duration_ms: Ee,
                        events_processed: 0,
                        events_skipped: 0,
                        tool_calls: 0,
                        tool_errors: 0,
                        output_chars: me,
                        cancelled: !1,
                        usage: ye
                    })
                } catch (B) {
                    Ve("[completion-owner] CLI turn ledger write failed", {
                        sessionKey: y.sessionKey,
                        generation: y.streamingGeneration,
                        error: B instanceof Error ? B.message : String(B)
                    })
                }
            };
        return Ne.loopPromise = (async () => {
            let ue = null,
                ye;
            try {
                for await (let me of He) {
                    let Y = me;
                    y.lastActivityAt = Date.now();
                    let Ge, ut, Ee = null;
                    if (Y.type === "result") {
                        Ge = Ne.lastModelUsage, ut = Ne.lastTotalCostUsd, Ee = ue, ue = null;
                        let _e = Y.modelUsage;
                        _e !== void 0 && (Ne.lastModelUsage = _e);
                        let ft = Y.total_cost_usd;
                        typeof ft == "number" && (Ne.lastTotalCostUsd = ft)
                    }
                    if (Y.type === "result" && Nn(Y)) {
                        let _e = Date.now(),
                            ft = Ne.cliTurnTentative;
                        Ne.cliTurnTentative = null;
                        let Qe = Ne.currentTurn,
                            Ht = ft?.skipObserved ?? !1,
                            kt;
                        if (Y.subtype === "success" && (kt = g_(Y, {
                                prevModelUsage: Ge,
                                prevTotalCostUsd: ut
                            }), kt && !Ht && typeof He.getContextUsage == "function")) try {
                            let tr = (await He.getContextUsage())?.totalTokens;
                            typeof tr == "number" && Number.isFinite(tr) && tr >= 0 && (kt.context_used_tokens = tr)
                        } catch {}
                        if (y.lastCliTurnSettledAt = _e, y.lastTurnCompletedAt = _e, ye = void 0, Qe) {
                            let er = Ee === Qe,
                                tr = ft?.compromised === !0,
                                Vn = Qe.accepted;
                            Ne.currentTurn = null, Qe.accepted = !1, await at(), (Vn || Qe.streamedText.length > 0 || Qe.turnStreamedText.length > 0) && n.emit("session.stream_end", {
                                sessionKey: y.sessionKey,
                                reason: "interrupted"
                            }), Qe.reject(new AgentSdkPromptNotAcceptedAbortError("Task-completion turn folded with mailbox drain; retrying the drain")), y.pendingWake = !0, y.wakeResolver?.(), await $e(Y, kt, 0, _e), Yt("warn", "[completion-owner] voided folded drain", {
                                sessionKey: y.sessionKey,
                                generation: y.streamingGeneration,
                                acceptedByForeignInit: er,
                                installedDuringTentative: tr,
                                wasAccepted: Vn
                            });
                            continue
                        }
                        let bt = 0,
                            Hn = Y.subtype === "success" && !Ht && typeof Y.result == "string" && Y.result.length > 0 ? Y.result : void 0;
                        if (Hn !== void 0) {
                            let er = Wf({
                                channel_kind: Dme(y.sessionKey),
                                session_key: y.sessionKey,
                                payload: {
                                    text: Hn
                                }
                            });
                            try {
                                await Jf(t, er), bt = Hn.length, n.emit("session.output", {
                                    sessionKey: y.sessionKey,
                                    record: er
                                })
                            } catch (tr) {
                                Ve("[completion-owner] proactive outbox write failed", {
                                    sessionKey: y.sessionKey,
                                    generation: y.streamingGeneration,
                                    error: tr instanceof Error ? tr.message : String(tr)
                                })
                            }
                        }
                        await $e(Y, kt, bt, _e), y.pendingWake = !0, y.wakeResolver?.(), J("[completion-owner] settled CLI completion turn", {
                            sessionKey: y.sessionKey,
                            generation: y.streamingGeneration,
                            subtype: Y.subtype,
                            skipped: Ht,
                            outputChars: bt
                        });
                        continue
                    }
                    let B = Ne.currentTurn;
                    if (!B) {
                        if (Y.type === "system" && Y.subtype === "task_notification") {
                            let _e = Y;
                            await ae(y.sessionKey, Y), ye = {
                                taskId: String(_e.task_id ?? "unknown"),
                                status: String(_e.status ?? "completed"),
                                observedAt: Date.now()
                            };
                            continue
                        }
                        if (Y.type === "system" && Y.subtype === "init") {
                            Ne.cliTurnTentative ??= {
                                skipObserved: !1,
                                compromised: !1
                            }, ue = null;
                            continue
                        }
                        if (Y.type === "result") {
                            let _e = Ne.cliTurnTentative !== null;
                            Ne.cliTurnTentative = null, J("[session-manager] orphan result received", {
                                sessionKey: y.sessionKey,
                                subtype: Y.subtype,
                                hadTentative: _e
                            }), y.pendingWake = !0, y.wakeResolver?.();
                            continue
                        }
                        continue
                    }
                    if (Y.type === "system") {
                        if (Y.subtype === "task_notification") {
                            let ft = Y;
                            await ae(y.sessionKey, Y), ye = {
                                taskId: String(ft.task_id ?? "unknown"),
                                status: String(ft.status ?? "completed"),
                                observedAt: Date.now()
                            }
                        }
                        if (Y.subtype === "init") {
                            let ft = !B.accepted;
                            Ne.hasAcceptedTurn = !0, B.accepted = !0, Ne.cliTurnTentative = null, ue = ft ? B : null;
                            try {
                                B.input.onTurnAcknowledged?.()
                            } catch {}
                            B.sessionId = Y.session_id ?? B.sessionId, y.sdkSessionId = Y.session_id ?? y.sdkSessionId, y.sdkSessionIdVerified = !0, An && Y.session_id && An !== Y.session_id && ie("[session-manager] SDK session ID mismatch — context lost", {
                                sessionKey: y.sessionKey,
                                requestedSessionId: An,
                                actualSessionId: Y.session_id
                            }), Y.session_id && y.jobStateless !== !0 && await dt(t, y.sessionKey, {
                                sdk_session_id: Y.session_id
                            }), y.pendingPreempt && y.pendingPreemptBoundary === "accept" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, C(y))
                        }
                        let _e;
                        Y.subtype === "init" ? _e = {
                            session_id: Y.session_id
                        } : Y.subtype === "compact_boundary" && Y.compact_metadata && (_e = {
                            trigger: Y.compact_metadata.trigger,
                            pre_tokens: Y.compact_metadata.pre_tokens,
                            post_tokens: Y.compact_metadata.post_tokens
                        }), B.input.onExecutionEvent?.({
                            type: "system",
                            subtype: Y.subtype ?? "unknown",
                            data: _e
                        });
                        continue
                    }
                    if (Y.type === "stream_event") {
                        let _e = Lp(Y);
                        for (let Ht of UE(Y.event)) Jt(B, Ht.text, Ht.isDelta, _e);
                        for (let Ht of qE(Y.event)) B.input.onExecutionEvent?.({
                            type: "thought_chunk",
                            text: Ht
                        });
                        let ft = BE(Y.event);
                        ft && (B.toolBlockIndexMap.set(ft.index, {
                            toolUseId: ft.toolUseId,
                            toolName: ft.toolName
                        }), B.toolUseMap.set(ft.toolUseId, ft.toolName), B.input.onExecutionEvent?.({
                            type: "tool_use",
                            toolUseId: ft.toolUseId,
                            toolName: ft.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let Qe = HE(Y.event);
                        if (Qe) {
                            let Ht = B.toolBlockIndexMap.get(Qe.index);
                            Ht && B.input.onExecutionEvent?.({
                                type: "tool_input_delta",
                                toolUseId: Ht.toolUseId,
                                toolName: Ht.toolName,
                                partialJson: Qe.partialJson
                            })
                        }
                        continue
                    }
                    if (typeof Y.type == "string" && Y.type.includes("assistant")) {
                        let _e = Lp(Y);
                        for (let Qe of FE(Y)) Jt(B, Qe.text, Qe.isDelta, _e);
                        let ft = Y.message?.content;
                        if (Array.isArray(ft))
                            for (let Qe of ft) {
                                if (!Qe || typeof Qe != "object" || Qe.type !== "tool_use") continue;
                                let Ht = Qe.id,
                                    kt = Qe.name;
                                !Ht || !kt || (B.toolUseMap.set(Ht, kt), B.input.onExecutionEvent?.({
                                    type: "tool_use",
                                    toolUseId: Ht,
                                    toolName: kt,
                                    input: Qe.input
                                }))
                            }
                        continue
                    }
                    if (Y.type === "user") {
                        let _e = Y.message?.content,
                            ft = !1;
                        if (Array.isArray(_e))
                            for (let Qe of _e) {
                                if (!Qe || typeof Qe != "object" || Qe.type !== "tool_result") continue;
                                ft = !0;
                                let Ht = Qe.tool_use_id;
                                Ht && (B.input.onExecutionEvent?.({
                                    type: "tool_result",
                                    toolUseId: Ht,
                                    toolName: B.toolUseMap.get(Ht),
                                    isError: Qe.is_error ?? !1,
                                    summary: VE(Qe.content)
                                }), B.turnStreamedText = "")
                            }
                        ft && B.skipCalled && !B.interruptRequested && (B.interruptRequested = !0, Wt("anchor-turn skip"));
                        continue
                    }
                    if (Y.type === "result") {
                        if (Y.subtype === "success") {
                            if (typeof Y.result == "string" && (B.text = Y.result), Y.structured_output !== void 0 && (B.structured = Y.structured_output), B.usage = g_(Y, {
                                    prevModelUsage: Ge,
                                    prevTotalCostUsd: ut
                                }), B.usage && !B.skipCalled && typeof He.getContextUsage == "function") try {
                                let ft = (await He.getContextUsage())?.totalTokens;
                                typeof ft == "number" && Number.isFinite(ft) && ft >= 0 && (B.usage.context_used_tokens = ft)
                            } catch {}
                            if (await at(), Ne.currentTurn = null, B.skipCalled) B.resolve({
                                sessionId: B.sessionId ?? y.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: B.usage
                            });
                            else {
                                let _e = B.text ?? (B.streamedText ? B.streamedText : void 0);
                                B.resolve({
                                    sessionId: B.sessionId ?? y.sdkSessionId,
                                    text: _e,
                                    structured: B.structured,
                                    usage: B.usage
                                })
                            }
                            continue
                        }
                        if (Y.subtype === "error_during_execution" && B.skipCalled) {
                            await at(), Ne.currentTurn = null, B.resolve({
                                sessionId: B.sessionId ?? y.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: B.usage
                            });
                            continue
                        }
                        B.accepted && n.emit("session.stream_end", {
                            sessionKey: y.sessionKey,
                            reason: "interrupted"
                        }), await at(), Ne.currentTurn = null, Y.subtype === "error_during_execution" ? B.accepted ? B.reject(new AgentSdkTurnInterruptedError) : y.pendingClear ? (Ne.needsRecreation = !0, B.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : (Ne.needsRecreation = !0, An && !y.sdkSessionIdVerified && (y.sdkSessionId = void 0, y.pendingWake = !0, await oo(t, y.sessionKey, "sdk_session_id").catch(() => {}), ie("[session-manager] cleared stale sdk_session_id after resume failure", {
                            sessionKey: y.sessionKey,
                            staleSessionId: An
                        })), B.reject(new AgentSdkPromptNotAcceptedAbortError)) : B.reject(new Error(`Unexpected streaming SDK result subtype: ${Y.subtype??"unknown"}`))
                    }
                }
            } catch (me) {
                let Y = Ne.currentTurn;
                Ne.currentTurn = null, Y && (Y.accepted && n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: "interrupted"
                }), ke.signal.aborted && !Y.accepted ? (Ne.needsRecreation = !0, y.pendingClear ? Y.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : Y.reject(new AgentSdkPromptNotAcceptedAbortError)) : ke.signal.aborted ? Y.reject(Mp("Streaming SDK run aborted", me)) : (Y.accepted || (Ne.needsRecreation = !0), Y.reject(me))), lt(() => new AgentSdkPromptNotAcceptedAbortError)
            } finally {
                Ne.closed = !0, Ne.needsRecreation = !0, ke.signal.aborted || Yt("warn", "[kv-cache] streaming loop exited unexpectedly (closed)", {
                    sessionKey: y.sessionKey,
                    generation: y.streamingGeneration,
                    sdk_session_id: y.sdkSessionId ?? null
                });
                let me = Ne.currentTurn;
                Ne.currentTurn = null, me && (ke.signal.aborted && !me.accepted ? y.pendingClear ? me.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : me.reject(new AgentSdkPromptNotAcceptedAbortError) : ke.signal.aborted ? (me.accepted && n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: "interrupted"
                }), me.reject(Mp("Streaming SDK run aborted"))) : me.accepted ? (n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: "interrupted"
                }), me.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution"))) : me.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), lt(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), ye && (y.lastCliTurnSettledAt === void 0 || ye.observedAt > y.lastCliTurnSettledAt) && Yt("warn", "[completion-owner] unspoken-completion", {
                    sessionKey: y.sessionKey,
                    taskId: ye.taskId,
                    status: ye.status,
                    generation: y.streamingGeneration
                }), Ne.cliTurnTentative = null, y.wakeResolver?.(), y.pendingSteer && (await at(), y.wakeResolver?.()), y.streamingState === Ne && (y.streamingState = null), y.query === He && (y.query = null), y.streamAbortController === ke && (y.streamAbortController = null)
            }
        })(), Ne
    }

    function X(y) {
        return y.runtime === "codex" && y.codexAdapter ? y.codexAdapter : y.origin !== "channel" || !o.createStreamingQuery ? o : (y.streamingAdapter || (y.streamingAdapter = {
            run: async T => {
                let j = await Oe(y, T);
                return await new Promise((N, M) => {
                    if (j.closed) {
                        M(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    j.queue.enqueue({
                        input: T,
                        resolve: N,
                        reject: M,
                        accepted: !1,
                        sessionId: T.sessionId,
                        text: void 0,
                        structured: void 0,
                        usage: void 0,
                        streamedText: "",
                        turnStreamedText: "",
                        toolUseMap: new Map,
                        toolBlockIndexMap: new Map,
                        skipCalled: !1,
                        interruptRequested: !1
                    })
                })
            },
            createStreamingQuery: o.createStreamingQuery,
            undo: o.undo ? o.undo.bind(o) : void 0
        }), y.streamingAdapter)
    }

    function Ue(y, T) {
        if (!E) {
            rt("[session-manager] wake ignored, manager not running", {
                sessionKey: y
            });
            return
        }
        if (fr(y)) {
            rt("[session-manager] wake suppressed, session is being archived", {
                sessionKey: y
            });
            return
        }
        let j = T?.preempt ?? "allow",
            N = T?.preemptBoundary,
            M = g.get(y);
        if (M && M.wakeResolver) {
            rt("[session-manager] wake delivered to idle actor", {
                sessionKey: y,
                actorRunId: M.actorRunId,
                status: M.status,
                preemptBoundary: N ?? "default"
            }), M.wakeResolver(), M.wakeResolver = null;
            return
        }
        if (M && M.drainPromise && (M.status === "active" || M.status === "idle")) {
            let ct = !!M.query && M.streamingState?.currentTurn?.accepted === !0,
                Ne = M.runtime === "codex" && !!M.codexAdapter?.activeTurnId?.();
            if (j === "allow" && (ct || Ne) && M.admissionCallback && !M.admissionInProgress) {
                M.pendingWake = !0, M.admissionInProgress = !0;
                let lt = M.admissionCallback;
                rt("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: y,
                    actorRunId: M.actorRunId
                }), lt().then(() => {
                    M.admissionInProgress = !1, M.wakeResolver?.()
                }, () => {
                    M.admissionInProgress = !1, M.wakeResolver?.()
                });
                return
            }
            if (M.status === "active" && M.currentAbortController)
                if (j === "force") {
                    let lt = G(M, "immediate", N);
                    lt === "immediate" ? rt("[session-manager] wake: forced preempt", {
                        sessionKey: y,
                        actorRunId: M.actorRunId,
                        preemptBoundary: N ?? "default"
                    }) : lt === "defer_accept" ? rt("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: y,
                        actorRunId: M.actorRunId
                    }) : lt === "defer_tool_result" ? rt("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: y,
                        actorRunId: M.actorRunId
                    }) : lt === "defer_tool_use" && rt("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: y,
                        actorRunId: M.actorRunId
                    })
                } else if (j === "allow") {
                let lt = G(M, "soft", N);
                lt === "defer_accept" ? rt("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: y,
                    actorRunId: M.actorRunId
                }) : lt === "defer_tool_use" ? rt("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: y,
                    actorRunId: M.actorRunId
                }) : lt === "defer_tool_result" ? rt("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: y,
                    actorRunId: M.actorRunId
                }) : lt === "immediate" && rt("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: y,
                    actorRunId: M.actorRunId
                })
            } else rt("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: y,
                actorRunId: M.actorRunId
            });
            M.pendingWake = !0, rt("[session-manager] wake marked pending", {
                sessionKey: y,
                actorRunId: M.actorRunId,
                status: M.status
            });
            return
        }
        let ee = b(y, M?.origin);
        if (ee.activeCount >= ee.maxConcurrent) {
            let ct = ee.wakeQueue.includes(y);
            ct || ee.wakeQueue.push(y), rt("[session-manager] wake queued", {
                sessionKey: y,
                pool: ee.name,
                activeCount: ee.activeCount,
                maxConcurrent: ee.maxConcurrent,
                alreadyQueued: ct,
                queuedSessions: ee.wakeQueue.length
            });
            return
        }
        let ke = $2(y);
        ke ? (rt("[session-manager] wake starting actor with inferred origin", {
            sessionKey: y,
            ...ke
        }), Nt(y, ke)) : (rt("[session-manager] wake starting actor", {
            sessionKey: y
        }), Nt(y))
    }

    function Nt(y, T) {
        let j = g.get(y),
            N = j?.attachedChannels ?? new Set,
            M = ++R,
            ee = {
                sessionKey: y,
                actorRunId: M,
                sdkSessionId: j?.sdkSessionId,
                sdkSessionIdVerified: j?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: j?.streamingAdapter ?? null,
                streamingGeneration: j?.streamingGeneration ?? 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                isStreaming: !1,
                activeToolUseIds: new Set,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: N,
                origin: T?.origin ?? j?.origin ?? "channel",
                jobId: T?.jobId ?? j?.jobId,
                jobStateless: j?.jobStateless ?? !1,
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
                runtime: T?.runtime ?? j?.runtime ?? "claude",
                codexAdapter: j?.codexAdapter ?? null,
                consecutiveConservativeRedrive: j?.consecutiveConservativeRedrive ?? !1
            };
        g.set(y, ee);
        let ke = b(y, ee.origin);
        ke.activeCount++, ee.holdsPoolSlot = !0;
        let ct = x.get(y);
        if (ct && x.delete(y), jk(t, {
                session_key: y,
                display_name: ct,
                kind: ee.origin === "job" ? "job" : ee.origin === "system" ? "system" : y.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), J("[session-manager] actor start", {
                sessionKey: y,
                actorRunId: M,
                sdkSessionId: ee.sdkSessionId,
                origin: ee.origin,
                jobId: ee.jobId,
                pool: ke.name,
                activeCount: ke.activeCount,
                attachedChannels: ee.attachedChannels.size,
                queuedSessions: ke.wakeQueue.length
            }), T?.preStart) {
            let Ne = T.preStart;
            ee.drainPromise = Ne().catch(lt => Ve("[session-manager] preStart failed", lt)).then(() => Se(ee))
        } else ee.drainPromise = Se(ee)
    }
    async function Se(y) {
        let {
            sessionKey: T
        } = y, j, N, M = 0, ee = 0, ke = !1, ct = [], Ne = 0, lt = !1, xi = !1, An = null, He;
        try {
            He = await ze(T)
        } catch (Ye) {
            ie("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: T,
                error: Ye instanceof Error ? Ye.message : String(Ye)
            }), He = new Set
        }
        rt("[session-manager] drain loop begin", {
            sessionKey: T,
            actorRunId: y.actorRunId,
            origin: y.origin,
            jobId: y.jobId
        });
        try {
            if (!y.sdkSessionId && !y.pendingClear) {
                let at = await At(t, T);
                at?.sdk_session_id && (y.sdkSessionId = at.sdk_session_id, J("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: T,
                    sdkSessionId: at.sdk_session_id
                }))
            }
            if ((await At(t, T))?.session_key || await dt(t, T, {
                    session_key: T
                }), y.origin === "job" && !y.jobId) {
                await z.init();
                let Nn = (await z.listJobs()).find($e => $e.session_key === T);
                Nn ? (y.jobId = Nn.id, Pe("[session-manager] recovered jobId from active jobs", {
                    sessionKey: T,
                    jobId: Nn.id
                })) : ie("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: T
                })
            }
            let Ye = !1,
                he, de = !1,
                V, Wt = null,
                Jt = !1;
            if (y.jobStateless = !1, y.origin === "job" && y.jobId) {
                let at = await z.getJob(y.jobId);
                if (Wt = at, An = at?.state.last_scheduled_at ?? null, at?.execution_cwd && (await wce({
                        cwdRel: at.execution_context === "workspace" ? at.frontmatter.cwd_rel ?? null : null,
                        cwd: at.execution_cwd,
                        runtimeWorkspaceDir: at.runtime_workspace_dir,
                        context: at.execution_context
                    }), await ge(at.execution_cwd), await dt(t, T, {
                        session_key: T,
                        cwd: at.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), at) {
                    Ye = !!at.frontmatter.owner_session?.startsWith("job:"), he = P2(at.frontmatter.cron);
                    let Nn = at.frontmatter.stateless === !0;
                    if (Nn && at.frontmatter.cron === "keepalive") throw new Error(p2);
                    de = Nn, y.jobStateless = de, V = at.frontmatter.model;
                    let $e = at.frontmatter.runtime ?? void 0,
                        ue = $e ?? Ou(),
                        ye = $e ? "explicit" : "default";
                    if (ue === "codex") {
                        let me = await l();
                        me.ok ? y.runtime = "codex" : (y.runtime = "claude", ie("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: T,
                            jobId: y.jobId,
                            runtime_source: ye,
                            reason: me.reason
                        }))
                    } else y.runtime = "claude"
                }
            } else if (y.origin === "channel") {
                let Nn = (await At(t, T))?.source_channel_id;
                if (Nn) {
                    let $e = await ji(t, Nn).catch(() => null),
                        ue = $e?.channel_kind,
                        ye = ue ? await ea(t.channelConfigDir, ue).catch(() => null) : null,
                        Y = $e?.runtime ?? ye?.runtime ?? void 0 ?? Ou(),
                        Ge = $e?.runtime ? "explicit" : ye?.runtime ? "inherited" : "default";
                    if (Y === "codex") {
                        let ut = await l();
                        ut.ok ? y.runtime = "codex" : (y.runtime = "claude", ie("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: T,
                            sourceChannelId: Nn,
                            runtime_source: Ge,
                            reason: ut.reason
                        }))
                    } else y.runtime = "claude"
                }
            }
            for (; y.status !== "ended" && E;) {
                if (y.runtime !== "codex") {
                    for (;;) {
                        let B = y.streamingState,
                            _e = !!B && !B.closed && (B.cliTurnTentative !== null || B.currentTurn !== null);
                        if (!_e && !y.admissionInProgress) break;
                        if (y.pendingWake) {
                            y.pendingWake = !1;
                            continue
                        }
                        rt("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            cliBusy: _e,
                            admissionInProgress: y.admissionInProgress
                        }), await st(y, i)
                    }
                    if (!E || y.status === "ended") break
                }
                y.pendingClear && (y.sdkSessionId = void 0, y.pendingClear = !1, await dt(t, T, {
                    sdk_session_id: null,
                    pending_fork_to: null,
                    pending_undo: null
                }).catch(() => {}));
                let at, Nn = null;
                y.origin === "job" && y.jobId && (Jt ? Nn = await z.getJob(y.jobId).catch(() => null) : (Jt = !0, Nn = Wt, Wt = null));
                let {
                    instructions: $e,
                    missionContent: ue
                } = await UXe(t, T, y, Nn), ye = await At(t, T), me = await runInstructionsFingerprintGuard(t, T, $e, y.runtime, {
                    instructions_fingerprint: ye?.instructions_fingerprint,
                    mission_fingerprint: ye?.mission_fingerprint,
                    schema_version: ye?.schema_version,
                    sdk_session_id: ye?.sdk_session_id,
                    board_layer_hash: ye?.board_layer_hash,
                    instructions_nonboard_fingerprint: ye?.instructions_nonboard_fingerprint
                }, y.origin === "job" && y.jobId ? {
                    jobId: y.jobId
                } : void 0);
                me.clearedSdkSessionId && (y.sdkSessionId = void 0), me.gate2Fired && y.runtime === "claude" && (me.boardOnlyDrift ? y.streamingState && !y.streamingState.closed ? J("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: T,
                    board_layer_hash: me.boardLayerHash
                }) : J("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: T,
                    board_layer_hash: me.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: T,
                    reason: "instructions_drift"
                })), y.origin === "job" && y.jobId && (ue !== void 0 ? at = {
                    content: ue,
                    jobId: y.jobId,
                    cron: Nn?.frontmatter.cron ?? "",
                    stateless: de,
                    model: Nn?.frontmatter.model ?? V
                } : ie("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: T,
                    jobId: y.jobId
                })), y.status = "active", y.idleSince = void 0;
                let Y = new Set,
                    Ge = Date.now(),
                    ut = new AbortController;
                y.currentAbortController = ut;
                let Ee;
                try {
                    let B = !Ye,
                        _e = [...B ? [Upe] : [], Zpe, ime];
                    y.origin === "channel" && (_e.push(Jpe), _e.push(h_));
                    let ft = y.origin === "job" ? "job" : y.origin === "system" ? "system" : "foreground",
                        Qe = 0,
                        Ht = MXe();
                    if (y.admissionCallback = async () => {
                            try {
                                await vk(t, T);
                                let kt = await Vg(t, T);
                                if (kt.length === 0) return;
                                await wk(t, T, kt);
                                let bt = {},
                                    Hn = await batchDrainItems(t, kt, {
                                        fallbackBatchSize: 5,
                                        mergeWindowMs: 180 * 1e3,
                                        perf: bt
                                    }),
                                    er = await At(t, T),
                                    tr = YU(t, T, er ?? void 0),
                                    Vn = [],
                                    qs = [];
                                for (let nt of Hn.items) {
                                    if (!nt.eventId) continue;
                                    if (y.inflightEventIds.has(nt.eventId)) {
                                        qs.push(nt.eventId);
                                        continue
                                    }
                                    if (await Kf(t, nt.eventId)) {
                                        qs.push(nt.eventId);
                                        continue
                                    }
                                    let tn = Hn.events.get(nt.eventId) ?? await readEventByIdSeek(t, nt.eventId);
                                    tn && Vn.push({
                                        item: nt,
                                        event: tn,
                                        prompt: GU(tn, T)
                                    })
                                }
                                if (Vn.length === 0) {
                                    qs.length > 0 && await _r(t, T, qs);
                                    return
                                }
                                let Sr = await WU(t, T, {
                                        allowedTools: _e,
                                        tools: Ht,
                                        additionalDirectories: [t.memoryDir],
                                        onExecutionEvent: nt => {
                                            nt.type === "tool_use" && (y.isStreaming = !1, y.activeToolUseIds.add(nt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_use" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, L(y))), nt.type === "tool_result" && (y.activeToolUseIds.delete(nt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_result" && y.activeToolUseIds.size === 0 && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, L(y)));
                                            let kr = Nme(nt);
                                            kr && n.emit("session.execution", {
                                                sessionKey: T,
                                                event: kr
                                            })
                                        },
                                        onStream: (nt, kr, tn) => {
                                            y.isStreaming = !0, n.emit("session.stream", {
                                                sessionKey: T,
                                                chunk: nt,
                                                isSidechain: kr,
                                                anchorEventId: tn
                                            })
                                        }
                                    }, Vn, tr, {
                                        pendingGatewayNotice: er?.pending_gateway_notice,
                                        pendingInterruptedContext: er?.pending_interrupted_context,
                                        pendingSkipRewind: er?.pending_skip_rewind,
                                        lastEventAtWatermark: er?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, bt, nt => nt),
                                    Fm = [...qs, ...Vn.map(nt => nt.item.eventId).filter(nt => !!nt)];
                                if (y.runtime === "codex") {
                                    let nt = y.codexAdapter?.steerActiveTurn,
                                        kr = !!Sr.attachments && Sr.attachments.length > 0,
                                        tn = Sr.coalescedPromptText.trim(),
                                        xr = y.codexAdapter?.activeTurnId?.(),
                                        Ei = y.codexAdapter?.activeTurnStartedAt?.(),
                                        nr = !1;
                                    if (xr && Ei !== void 0)
                                        if (y.codexAdapter?.activeTurnSkipObserved?.() === !0) nr = !0;
                                        else {
                                            let Hs = await At(t, T).catch(() => null);
                                            if (Hs === null) nr = !0, ie("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: T
                                            });
                                            else {
                                                let xo = Date.parse(Hs.pending_skip_rewind?.skipped_at ?? "");
                                                nr = Number.isFinite(xo) && xo >= Ei
                                            }
                                        } if (!!nt && !!xr && !kr && !Sr.isNotifyOnly && tn.length > 0 && !nr && nt && xr) {
                                        let ci = Sr.batchEventIds.filter(xo => !y.inflightEventIds.has(xo));
                                        for (let xo of ci) y.inflightEventIds.add(xo);
                                        if (await nt(tn, xr).catch(() => !1)) {
                                            await _r(t, T, Fm);
                                            for (let xo of ci) y.inflightEventIds.delete(xo);
                                            J("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: T,
                                                admittedItems: Vn.length,
                                                batchEventIds: Sr.batchEventIds
                                            })
                                        } else {
                                            for (let xo of ci) y.inflightEventIds.delete(xo);
                                            y.pendingWake = !0, J("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: T,
                                                batchEventIds: Sr.batchEventIds
                                            })
                                        }
                                    } else y.pendingWake = !0, J("[session-manager] admission callback: codex no live turn, redraining", {
                                        sessionKey: T,
                                        admittedItems: Vn.length,
                                        batchEventIds: Sr.batchEventIds
                                    });
                                    return
                                }
                                let Dn = y.streamingState;
                                if (!Dn || Dn.closed) return;
                                let ko = Dn.currentTurn,
                                    ht = !!Sr.attachments && Sr.attachments.length > 0,
                                    Tn = Sr.coalescedPromptText.trim();
                                if (!!ko && ko.accepted && !ht && !Sr.isNotifyOnly && Tn.length > 0) {
                                    let nt = y.pendingSteer;
                                    if (nt && !nt.settled && nt.spawningTurn === ko) {
                                        let kr = Sr.batchEventIds.filter(tn => !y.inflightEventIds.has(tn));
                                        for (let tn of kr) y.inflightEventIds.add(tn);
                                        nt.steerText = `${nt.steerText}
${Tn}`, nt.eventIds.push(...Fm), nt.claimedEventIds.push(...kr), nt.requeueLines.push(...Vn.map(tn => tn.item.line)), nt.requeueEventIds.push(...Vn.map(tn => tn.item.eventId)), nt.processedEventIds.push(...qs), J("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: T,
                                            admittedItems: Vn.length,
                                            batchEventIds: Sr.batchEventIds
                                        });
                                        return
                                    }
                                    if (!nt) {
                                        let kr = Sr.batchEventIds.filter(xr => !y.inflightEventIds.has(xr));
                                        for (let xr of kr) y.inflightEventIds.add(xr);
                                        let tn = {
                                            steerText: Tn,
                                            eventIds: [...Fm],
                                            claimedEventIds: [...kr],
                                            enqueueAsNewTurn: async () => {
                                                let xr = [];
                                                for (let nr = 0; nr < tn.requeueLines.length; nr += 1) {
                                                    let Bs = tn.requeueLines[nr],
                                                        ci = tn.requeueEventIds[nr];
                                                    try {
                                                        await Ho(t, T, Bs), xr.push(ci)
                                                    } catch (Hs) {
                                                        ie("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: T,
                                                            eventId: ci,
                                                            error: Hs instanceof Error ? Hs.message : String(Hs)
                                                        })
                                                    }
                                                }
                                                let Ei = [...xr, ...tn.processedEventIds];
                                                if (Ei.length > 0) try {
                                                    await _r(t, T, Ei)
                                                } catch (nr) {
                                                    J("[session-manager] steer fallback markDone error", {
                                                        sessionKey: T,
                                                        error: String(nr)
                                                    })
                                                }
                                                for (let nr of tn.claimedEventIds) y.inflightEventIds.delete(nr);
                                                y.pendingWake = !0, J("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: T,
                                                    eventIds: tn.eventIds,
                                                    requeued: xr.length,
                                                    requeueFailed: tn.requeueLines.length - xr.length
                                                })
                                            },
                                            spawningTurn: ko,
                                            requeueLines: Vn.map(xr => xr.item.line),
                                            requeueEventIds: Vn.map(xr => xr.item.eventId),
                                            processedEventIds: [...qs],
                                            settled: !1
                                        };
                                        y.pendingSteer = tn, J("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: T,
                                            admittedItems: Vn.length,
                                            batchEventIds: Sr.batchEventIds
                                        });
                                        return
                                    }
                                }
                                y.pendingWake = !0, y.wakeResolver?.()
                            } catch (kt) {
                                J("[session-manager] admission callback error", {
                                    sessionKey: T,
                                    error: String(kt)
                                })
                            }
                        }, y.runtime === "codex" && !y.codexAdapter) {
                        let kt = (await At(t, T))?.cwd;
                        kt && await ensureAgentsMdSymlink(kt).catch(() => {}), y.codexAdapter = u({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: V,
                            dynamicTools: zI({
                                paths: t,
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: ft,
                                notifyDepth: Qe,
                                jobScheduleType: he,
                                canManageJobs: B,
                                getSessionStatus: bt => g.get(bt)?.status,
                                onNotifyCalled: () => {
                                    y.notifyCalledDuringDrain = !0
                                }
                            })
                        })
                    }
                    Ee = await drainSessionMailbox(t, T, {
                        sdk: X(y),
                        bus: n,
                        abortController: ut,
                        runtime: y.runtime,
                        excludeEventIds: K(y),
                        actorSpawnedAt: y.spawnedAt,
                        actorLastTurnCompletedAt: y.lastTurnCompletedAt,
                        getStreamGeneration: () => y.streamingGeneration,
                        holdInputOpenForBackgroundAgents: y.runtime === "claude" && y.origin !== "channel",
                        jobContext: at,
                        memoryBoard: $e.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: $e.memoryBoard
                        } : void 0,
                        boardHash: $e.memoryBoard ? me.boardLayerHash : void 0,
                        onBatchContext: kt => {
                            if (Qe = kt.maxNotifyDepth, kt.eventIds)
                                for (let bt of kt.eventIds) y.inflightEventIds.add(bt)
                        },
                        mcpServersFactory: () => ({
                            aladuo: MI(t, {
                                sessionKey: T,
                                bus: n,
                                sessionContextKind: ft,
                                notifyDepth: Qe,
                                jobScheduleType: he,
                                canManageJobs: B,
                                getSessionStatus: kt => g.get(kt)?.status,
                                onNotifyCalled: () => {
                                    y.notifyCalledDuringDrain = !0
                                }
                            })
                        }),
                        allowedTools: _e,
                        tools: Ht,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: s,
                        onSdkTurnStarted: () => {
                            M += 1;
                            let kt = !ke;
                            if (ke = M > ee, kt && ke && y.origin === "job" && y.jobId) {
                                let bt = y.jobId;
                                ct.push(z.updateState(bt, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: An
                                }).catch(Hn => {
                                    ie("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: T,
                                        jobId: bt,
                                        error: Hn instanceof Error ? Hn.message : String(Hn)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            ee += 1;
                            let kt = ke && M <= ee;
                            if (ke = M > ee, kt && y.origin === "job" && y.jobId) {
                                let bt = y.jobId;
                                ct.push(z.updateState(bt, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: An
                                }).catch(Hn => {
                                    ie("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: T,
                                        jobId: bt,
                                        error: Hn instanceof Error ? Hn.message : String(Hn)
                                    })
                                }))
                            }
                        },
                        onStream: (kt, bt, Hn) => {
                            y.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: T,
                                chunk: kt,
                                isSidechain: bt,
                                anchorEventId: Hn
                            })
                        },
                        onExecutionEvent: kt => {
                            kt.type === "tool_use" && (y.isStreaming = !1, y.activeToolUseIds.add(kt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_use" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, L(y))), kt.type === "tool_result" && (y.activeToolUseIds.delete(kt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_result" && y.activeToolUseIds.size === 0 && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, L(y)));
                            let bt = jXe(kt);
                            if (bt && Y.has(bt)) return;
                            bt && Y.add(bt);
                            let Hn = Nme(kt);
                            Hn && n.emit("session.execution", {
                                sessionKey: T,
                                event: Hn
                            })
                        }
                    })
                } finally {
                    y.admissionCallback = null, y.admissionInProgress || y.inflightEventIds.clear(), y.currentAbortController === ut && (y.currentAbortController = null), y.isStreaming = !1, y.activeToolUseIds.clear(), y.pendingPreempt = !1, y.pendingPreemptBoundary = null
                }
                if (rt("[session-manager] drain result", {
                        sessionKey: T,
                        actorRunId: y.actorRunId,
                        processed: Ee.processed,
                        skipped: Ee.skipped,
                        lockAcquired: Ee.lockAcquired,
                        outboxRecords: Ee.outboxRecords?.length ?? (Ee.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - Ge
                    }), Ne += Ee.processed, lt = Ee.mergeTransientFailure === !0, Ee.cancelled && (xi = !0), Ee.processed > 0 && (y.lastTurnCompletedAt = Date.now(), await oo(t, T, "last_error").catch(() => {})), Ee.compacted && y.runtime === "claude" && y.streamingState && !y.streamingState.closed) {
                    let B = $e.memoryBoard ? me.boardLayerHash : void 0;
                    y.spawnBoardHash !== B && (y.streamingState.needsRecreation = !0, Yt("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: T,
                        reason: "board-refresh(B4)",
                        generation: y.streamingGeneration,
                        spawn_board_hash: y.spawnBoardHash ? y.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: B ? B.slice(0, 12) : null
                    }))
                }
                if (y.pendingClear) y.sdkSessionId = void 0, y.pendingClear = !1, await dt(t, T, {
                    sdk_session_id: null,
                    pending_fork_to: null,
                    pending_undo: null
                }).catch(() => {}), J("[session-manager] applied pending clear after drain", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                });
                else {
                    let B = await At(t, T);
                    if (B?.sdk_session_id) {
                        let _e = !y.sdkSessionId,
                            ft = y.sdkSessionId !== B.sdk_session_id;
                        y.sdkSessionId = B.sdk_session_id, (_e || ft) && J("[session-manager] sdk session bound", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            sdkSessionId: y.sdkSessionId,
                            isNewSession: _e
                        })
                    }
                }
                if (Ee.lastReplyText && (N = Ee.lastReplyText), Ee.outboxRecords && Ee.outboxRecords.length > 0) {
                    rt("[session-manager] emitting outbox records", {
                        sessionKey: T,
                        actorRunId: y.actorRunId,
                        count: Ee.outboxRecords.length
                    });
                    for (let B of Ee.outboxRecords) n.emit("session.output", {
                        sessionKey: B.session_key,
                        record: B
                    })
                } else Ee.lastOutboxRecord ? (rt("[session-manager] emitting single outbox record", {
                    sessionKey: T,
                    actorRunId: y.actorRunId,
                    recordId: Ee.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: T,
                    record: Ee.lastOutboxRecord
                })) : y.origin === "channel" && Ee.processed > 0 && !Ee.cancelled && (rt("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey: T,
                    actorRunId: y.actorRunId,
                    turnSkipped: Ee.turnSkipped === !0
                }), n.emit("session.stream_end", {
                    sessionKey: y.sessionKey,
                    reason: Ee.turnSkipped ? "skipped" : "interrupted"
                }));
                if (Ee.processed === 0) {
                    if (y.origin === "job" || y.origin === "system") {
                        rt("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            origin: y.origin,
                            jobId: y.jobId
                        });
                        break
                    }
                    if (y.pendingWake) {
                        y.pendingWake = !1, rt("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: T,
                            actorRunId: y.actorRunId
                        });
                        continue
                    }
                    if (y.status = "idle", y.idleSince = new Date().toISOString(), y.pendingWake) {
                        y.pendingWake = !1, rt("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: T,
                            actorRunId: y.actorRunId
                        });
                        continue
                    }
                    if (rt("[session-manager] idle", {
                            sessionKey: T,
                            actorRunId: y.actorRunId,
                            attachedChannels: y.attachedChannels.size
                        }), y.holdsPoolSlot) {
                        let _e = b(T, y.origin);
                        _e.activeCount--, y.holdsPoolSlot = !1, rt("[session-manager] released pool slot (idle)", {
                            sessionKey: T,
                            pool: _e.name,
                            activeCount: _e.activeCount
                        }), w(_e)
                    }
                    let B = !1;
                    for (; y.status === "idle";) {
                        if (y.pendingWake) {
                            y.pendingWake = !1, B = !0;
                            break
                        }
                        if (await st(y, i) || y.status !== "idle") {
                            B = !0;
                            break
                        }
                        if (y.attachedChannels.size > 0) {
                            rt("[session-manager] idle timeout but has attachments, continuing wait", {
                                sessionKey: T,
                                actorRunId: y.actorRunId,
                                attachedChannels: y.attachedChannels.size
                            });
                            continue
                        }
                        break
                    }
                    if (!B && y.status === "idle") {
                        rt("[session-manager] idle timeout, no attachments, exiting", {
                            sessionKey: T,
                            actorRunId: y.actorRunId
                        }), y.streamingGeneration > 0 && Yt("warn", "[kv-cache] streaming teardown: idle-timeout", {
                            sessionKey: T,
                            generation: y.streamingGeneration,
                            sdk_session_id: y.sdkSessionId ?? null
                        });
                        break
                    }
                    if (B && !y.holdsPoolSlot) {
                        let _e = b(T, y.origin);
                        if (_e.activeCount >= _e.maxConcurrent) {
                            _e.wakeQueue.includes(T) || _e.wakeQueue.unshift(T), rt("[session-manager] woken idle actor re-queued (pool full)", {
                                sessionKey: T,
                                pool: _e.name,
                                activeCount: _e.activeCount
                            }), y.pendingWake = !1;
                            continue
                        }
                        _e.activeCount++, y.holdsPoolSlot = !0, rt("[session-manager] re-acquired pool slot (woken)", {
                            sessionKey: T,
                            pool: _e.name,
                            activeCount: _e.activeCount
                        })
                    }
                }
            }
        } catch (Ye) {
            Ve(`[session-manager] error in drain loop for ${T}:`, Ye), j = Ye, await dt(t, T, {
                last_error: {
                    message: Ye instanceof Error ? Ye.message : String(Ye),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            if (await W(y), y.currentAbortController = null, y.streamingAdapter = null, y.isStreaming = !1, y.activeToolUseIds.clear(), y.pendingPreempt = !1, y.pendingPreemptBoundary = null, y.codexAdapter) {
                let de = y.codexAdapter;
                y.codexAdapter = null, await Promise.resolve(de.shutdown()).catch(V => {
                    ie("[session-manager] codex adapter shutdown failed", {
                        sessionKey: T,
                        error: V instanceof Error ? V.message : String(V)
                    })
                })
            }
            let Ye = b(T, y.origin);
            if (y.holdsPoolSlot && (Ye.activeCount--, y.holdsPoolSlot = !1), y.origin === "job" && y.jobId) {
                ct.length > 0 && await Promise.allSettled(ct);
                try {
                    await Ce(y, {
                        runStarted: ke,
                        cancelled: xi,
                        processedCount: Ne,
                        claimCursor: An,
                        error: j,
                        resultText: N
                    })
                } finally {
                    y.status = "ended"
                }
            } else y.status = "ended";
            if (y.pendingWake = !1, E && jme(Pr(t, T)) && !fr(T)) {
                let de = await A(T, He);
                de === "fresh" ? (y.consecutiveConservativeRedrive = !1, rt("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                }), Ue(T, {
                    preempt: "never"
                })) : de === "conservative" || lt ? y.consecutiveConservativeRedrive ? ie("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                }) : (y.consecutiveConservativeRedrive = !0, rt("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: T,
                    actorRunId: y.actorRunId
                }), Ue(T, {
                    preempt: "never"
                })) : y.consecutiveConservativeRedrive = !1
            }
            J("[session-manager] actor end", {
                sessionKey: T,
                actorRunId: y.actorRunId,
                sdkSessionId: y.sdkSessionId,
                pool: Ye.name,
                activeCount: Ye.activeCount,
                origin: y.origin,
                jobId: y.jobId,
                attachedChannels: y.attachedChannels.size,
                queuedSessions: Ye.wakeQueue.length
            }), w(Ye)
        }
    }

    function st(y, T) {
        return new Promise(j => {
            let N = null,
                M = () => {
                    N && (clearTimeout(N), N = null), y.wakeResolver = null
                };
            y.wakeResolver = () => {
                M(), j(!0)
            }, N = setTimeout(() => {
                M(), j(!1)
            }, T)
        })
    }
    async function ze(y) {
        return new Set(await Ug(zg(t, y)))
    }
    async function A(y, T) {
        let j;
        try {
            j = await ze(y)
        } catch (N) {
            return ie("[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)", {
                sessionKey: y,
                error: N instanceof Error ? N.message : String(N)
            }), "conservative"
        }
        for (let N of j)
            if (!T.has(N)) return "fresh";
        return "none"
    }
    let z = new js(t);

    function H(y) {
        return y.error ? y.runStarted ? "STARTED_FAILURE" : "NEVER_STARTED_FAILURE" : y.cancelled ? y.runStarted ? "CANCELLED_POST_ACK" : "CANCELLED_PRE_ACK" : !y.runStarted && y.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"
    }
    async function U(y, T, j, N, M, ee) {
        try {
            let ke = await z.finalizeJobState(y, j, {
                consumeRunAt: N,
                expectedClaimCursor: M
            });
            return ke === YF ? (J(`[session-manager] job gone at finalize (${ee}) — state frozen`, {
                jobId: y,
                sessionKey: T
            }), {
                kind: "gone"
            }) : ke === QF ? (ie(`[session-manager] stale finalize (${ee}) — a fresh claim owns the sidecar; nothing written`, {
                jobId: y,
                sessionKey: T,
                claimCursor: M
            }), {
                kind: "stale"
            }) : {
                kind: "written",
                runAt: ke.run_at
            }
        } catch (ke) {
            return Ve(`[session-manager] job state finalize failed (${ee})`, ke), {
                kind: "failed"
            }
        }
    }
    async function Ce(y, T) {
        let j = y.jobId,
            {
                sessionKey: N
            } = y,
            {
                runStarted: M,
                cancelled: ee,
                processedCount: ke,
                claimCursor: ct,
                error: Ne,
                resultText: lt
            } = T,
            xi = H({
                error: Ne,
                cancelled: ee,
                runStarted: M,
                processedCount: ke
            });
        try {
            await z.init();
            let An = await z.getJob(j),
                He = An?.frontmatter.cron ?? "";
            switch (xi) {
                case "NEVER_STARTED_FAILURE": {
                    let Ye = Ne instanceof Error ? Ne.message : String(Ne);
                    await U(j, N, {
                        last_result: "failure",
                        last_error: Ye
                    }, !1, ct, "never-started failure"), await Ae({
                        jobId: j,
                        sessionKey: N,
                        job: An,
                        cron: He,
                        errorMsg: Ye
                    }), J("[session-manager] job failed (never started, spawn-class) — job preserved", {
                        jobId: j,
                        sessionKey: N,
                        cron: He,
                        error: Ye
                    });
                    break
                }
                case "STARTED_FAILURE": {
                    let Ye = Ne instanceof Error ? Ne.message : String(Ne),
                        he = await U(j, N, {
                            last_result: "failure",
                            last_error: Ye
                        }, !0, ct, "started failure");
                    await Ae({
                        jobId: j,
                        sessionKey: N,
                        job: An,
                        cron: He,
                        errorMsg: Ye
                    }), await Ke({
                        jobId: j,
                        sessionKey: N,
                        cron: He,
                        state: he
                    }), J("[session-manager] job failed", {
                        jobId: j,
                        sessionKey: N,
                        error: Ye
                    });
                    break
                }
                case "CANCELLED_POST_ACK": {
                    let Ye = await U(j, N, {
                        last_result: "failure",
                        last_error: "cancelled"
                    }, !0, ct, "cancelled post-ack");
                    await Ke({
                        jobId: j,
                        sessionKey: N,
                        cron: He,
                        state: Ye
                    }), ie("[session-manager] job run cancelled after turn ack — consumed + failure marker, no delivery", {
                        jobId: j,
                        sessionKey: N
                    });
                    break
                }
                case "ZERO_FED": {
                    await U(j, N, {
                        last_result: "failure",
                        last_error: "zero-fed run — no items merged"
                    }, !1, ct, "zero-fed"), ie("[session-manager] zero-fed job run — failure marker written, job preserved", {
                        jobId: j,
                        sessionKey: N
                    });
                    break
                }
                case "CANCELLED_PRE_ACK": {
                    ie("[session-manager] job run ended without turn ack (cancelled before start) — finalize skipped, job preserved", {
                        jobId: j,
                        sessionKey: N,
                        processedCount: ke
                    });
                    break
                }
                case "STARTED_SUCCESS": {
                    let Ye = await U(j, N, {
                            last_result: "success",
                            last_run_at: new Date().toISOString(),
                            last_error: void 0
                        }, !0, ct, "success"),
                        he = createSpineEvent({
                            type: "job.complete",
                            source: {
                                kind: "job",
                                name: j
                            },
                            session_key: N,
                            payload: {
                                job_id: j,
                                result_summary: lt?.slice(0, 200)
                            }
                        });
                    await atomicAppendEvent(t, he);
                    let de = lt?.slice(0, 200);
                    n.emit("job.completed", {
                        jobId: j,
                        sessionKey: N,
                        resultSummary: de
                    }), y.notifyCalledDuringDrain ? Pe("[session-manager] skipping system job.complete delivery: agent called Notify", {
                        jobId: j,
                        sessionKey: N
                    }) : await _t(An, N, "job.complete", {
                        job_id: j,
                        result_summary: de,
                        result_text: lt?.slice(0, 2e3),
                        agent_notified: !1,
                        schedule_type: P2(He),
                        owner_session: An?.frontmatter.owner_session
                    }), await Ke({
                        jobId: j,
                        sessionKey: N,
                        cron: He,
                        state: Ye
                    }), J("[session-manager] job completed", {
                        jobId: j,
                        sessionKey: N
                    });
                    break
                }
            }
        } catch (An) {
            Ve("[session-manager] error finalizing job session", An)
        }
    }
    async function Ae(y) {
        let {
            jobId: T,
            sessionKey: j,
            job: N,
            cron: M,
            errorMsg: ee
        } = y, ke = createSpineEvent({
            type: "job.fail",
            source: {
                kind: "job",
                name: T
            },
            session_key: j,
            payload: {
                job_id: T,
                error: ee
            }
        });
        await atomicAppendEvent(t, ke), n.emit("job.failed", {
            jobId: T,
            sessionKey: j,
            error: ee
        }), await _t(N, j, "job.fail", {
            job_id: T,
            error: ee,
            agent_notified: !1,
            schedule_type: P2(M),
            owner_session: N?.frontmatter.owner_session
        })
    }
    async function Ke(y) {
        let {
            jobId: T,
            sessionKey: j,
            cron: N,
            state: M
        } = y;
        if (LXe(N)) {
            switch (M.kind) {
                case "gone":
                    J("[session-manager] skip auto-archive: job already gone (archived mid-run)", {
                        jobId: T,
                        cron: N
                    });
                    return;
                case "stale":
                    J("[session-manager] skip auto-archive: stale finalize (a fresh claim owns the job)", {
                        jobId: T,
                        cron: N
                    });
                    return;
                case "failed":
                    ie("[session-manager] skip auto-archive: job state unreadable at finalize (failing toward stale-active)", {
                        jobId: T,
                        cron: N
                    });
                    return;
                case "written":
                    if (M.runAt !== null) {
                        J("[session-manager] skip auto-archive: job re-armed via reschedule", {
                            jobId: T,
                            cron: N,
                            runAt: M.runAt
                        });
                        return
                    }
                    break;
                default:
                    return M
            }
            try {
                let ee = await z.archiveJobIfNotRearmed(T);
                if (!ee.archived) {
                    J("[session-manager] skip auto-archive: job re-armed during finalize", {
                        jobId: T,
                        cron: N,
                        runAt: ee.runAt
                    });
                    return
                }
                if ((await vae(t, j)).reason === "archive_in_flight") {
                    ie("[session-manager] skip finalize session archive: archive already in flight", {
                        jobId: T,
                        sessionKey: j
                    });
                    return
                }
                J("[session-manager] auto-archived one-shot job", {
                    jobId: T,
                    cron: N
                })
            } catch (ee) {
                Ve("[session-manager] failed to auto-archive one-shot job", ee)
            }
        }
    }
    async function _t(y, T, j, N) {
        if (!y) return;
        let M = Ha(y.frontmatter.notify);
        if (M.length !== 0)
            for (let ee = 0; ee < M.length; ee++) {
                let ke = em(M[ee]);
                if (!ke) {
                    ie("[session-manager] invalid notify target in job, skipping delivery", {
                        jobId: y.id,
                        notify: M[ee]
                    });
                    continue
                }
                try {
                    await Wl(t, n, {
                        traceId: `job-finalize_${y.id}_${ee}`,
                        routeId: `job-result-${ee}`,
                        sourceName: `job:${y.id}`,
                        sourceSessionKey: T,
                        targetSessionKey: ke,
                        eventType: j,
                        payload: N
                    }), Pe("[session-manager] job result delivered to notify target", {
                        jobId: y.id,
                        targetSessionKey: ke,
                        eventType: j
                    })
                } catch (ct) {
                    ie("[session-manager] failed to deliver job result to notify target", {
                        jobId: y.id,
                        targetSessionKey: ke,
                        eventType: j,
                        error: String(ct)
                    })
                }
            }
    }

    function en(y, T) {
        if (!E) return;
        if (fr(T)) {
            rt("[session-manager] skip job spawn, session is being archived", {
                jobId: y,
                sessionKey: T
            });
            return
        }
        let j = g.get(T);
        if (j && j.status !== "ended") {
            rt("[session-manager] skip duplicate job spawn", {
                jobId: y,
                sessionKey: T,
                actorStatus: j.status
            });
            return
        }
        if (_.activeCount >= _.maxConcurrent) {
            _.wakeQueue.includes(T) || _.wakeQueue.push(T), j ? (j.origin = "job", j.jobId = y) : g.set(T, {
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
        Nt(T, {
            origin: "job",
            jobId: y
        }), (async () => {
            try {
                let N = createSpineEvent({
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
                await atomicAppendEvent(t, N), n.emit("job.spawned", {
                    jobId: y,
                    sessionKey: T
                })
            } catch (N) {
                Ve("[session-manager] error recording job spawn", N)
            }
        })()
    }
    async function En(y, T) {
        let N = (k.get(y) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (y.startsWith("job:") || y.startsWith("meta:") || y.startsWith("system:") || y.startsWith("cadence:")) return;
            let M = Dme(y),
                ee = new Date().toISOString(),
                ke = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: M,
                        name: "session-manager"
                    },
                    session_key: y,
                    payload: {
                        session_key: y,
                        channel_kind: M,
                        channel_id: T,
                        attached_at: ee
                    }
                });
            await atomicAppendEvent(t, ke)
        }).finally(() => {
            k.get(y) === N && k.delete(y)
        });
        k.set(y, N), await N
    }

    function Je() {
        for (let y of g.values()) {
            if (y.status = "ended", y.codexAdapter) {
                let T = y.codexAdapter;
                y.codexAdapter = null, Promise.resolve(T.shutdown()).catch(j => {
                    ie("[session-manager] codex adapter shutdown failed", {
                        sessionKey: y.sessionKey,
                        error: j instanceof Error ? j.message : String(j)
                    })
                })
            }
            y.streamAbortController && !y.streamAbortController.signal.aborted && y.streamAbortController.abort(), typeof y.query?.close == "function" && y.query.close(), y.query = null, y.streamAbortController = null, y.currentAbortController && !y.currentAbortController.signal.aborted && y.currentAbortController.abort(), y.currentAbortController = null, y.wakeResolver && (y.wakeResolver(), y.wakeResolver = null)
        }
    }
    async function Xn() {
        if (k.size === 0) return;
        let y = Array.from(k.values()),
            T = new Promise(j => setTimeout(j, 3e4));
        await Promise.race([Promise.allSettled(y).then(() => {}), T])
    }
    return {
        async start() {
            if (!E) {
                E = !0, n.on("session.wake", $), n.on("shutdown", I), n.on("session.streaming_invalidated", P);
                try {
                    let y = await rehydrateSessionState(t);
                    for (let T of y) {
                        if (fr(T)) {
                            rt("[session-manager] skip hydrating session being archived", {
                                sessionKey: T
                            });
                            continue
                        }
                        let N = (await At(t, T))?.cwd;
                        if (N && !BXe(N)) {
                            ie("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: T,
                                cwd: N
                            });
                            continue
                        }
                        if (fr(T)) {
                            rt("[session-manager] skip hydrating session being archived", {
                                sessionKey: T
                            });
                            continue
                        }
                        let M = $2(T),
                            ee = b(T);
                        ee.activeCount < ee.maxConcurrent ? Nt(T, M ?? void 0) : ee.wakeQueue.push(T)
                    }
                } catch (y) {
                    Ve("[session-manager] error hydrating sessions:", y)
                }
                J("[session-manager] started", {
                    channelActive: h.activeCount,
                    channelQueued: h.wakeQueue.length,
                    jobActive: _.activeCount,
                    jobQueued: _.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!E) return;
            E = !1, n.off("session.wake", $), n.off("shutdown", I), n.off("session.streaming_invalidated", P), Je();
            let y = Array.from(g.values()).map(T => T.drainPromise).filter(T => T !== null);
            if (y.length > 0) {
                let T = new Promise(j => setTimeout(j, 3e4));
                await Promise.race([Promise.all(y), T])
            }
            await Xn(), g.clear(), h.wakeQueue.length = 0, h.activeCount = 0, _.wakeQueue.length = 0, _.activeCount = 0, J("[session-manager] stopped")
        },
        wakeSession: Ue,
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
            let j = g.get(y);
            j || (j = {
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
            }, g.set(y, j)), j.attachedChannels.add(T), rt("[session-manager] channel attached", {
                sessionKey: y,
                channelId: T,
                totalAttachments: j.attachedChannels.size
            }), En(y, T).catch(N => {
                ie("[session-manager] failed to emit channel.attached event", {
                    sessionKey: y,
                    channelId: T,
                    error: String(N)
                })
            })
        },
        detachChannel(y, T) {
            let j = g.get(y);
            j && (j.attachedChannels.delete(T), rt("[session-manager] channel detached", {
                sessionKey: y,
                channelId: T,
                remainingAttachments: j.attachedChannels.size
            }), j.attachedChannels.size === 0 && j.status === "idle" && j.wakeResolver && (j.wakeResolver(), j.wakeResolver = null))
        },
        hasAttachedChannels(y) {
            let T = g.get(y);
            return T ? T.attachedChannels.size > 0 : !1
        },
        spawnJobSession(y, T) {
            en(y, T)
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
            } : T.streamAbortController && !T.streamAbortController.signal.aborted ? (J("[session-manager] interrupt: stopping streaming session", {
                sessionKey: y,
                actorRunId: T.actorRunId
            }), await W(T, "cancel-interrupt"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (G(T, "immediate") === "immediate" && J("[session-manager] interrupt requested", {
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
                j = T?.sdkSessionId;
            return T && (T.pendingClear = !0, T.sdkSessionId = void 0, T.sdkSessionIdVerified = !1), T?.streamAbortController && !T.streamAbortController.signal.aborted ? await W(T, "clear") : T?.currentAbortController && !T.currentAbortController.signal.aborted && G(T, "immediate"), await dt(t, y, {
                sdk_session_id: null,
                pending_fork_to: null,
                pending_undo: null
            }), J("[session-manager] SDK session cleared", {
                sessionKey: y,
                actorRunId: T?.actorRunId,
                previousSessionId: j
            }), {
                cleared: !0,
                previousSessionId: j
            }
        },
        async getSessionModelView(y) {
            let T = g.get(y),
                j = await At(t, y).catch(() => null),
                N = {
                    runtime: await p(y, T),
                    storedModel: j?.model,
                    hasLiveQuery: !!T?.query
                },
                M = T?.query;
            if (M && typeof M.supportedModels == "function") try {
                N.available = d(await M.supportedModels())
            } catch {}
            return N
        },
        async setSessionModel(y, T) {
            if (!E) return {
                ok: !1,
                reason: "not_running"
            };
            let j = g.get(y);
            if (await p(y, j) === "codex") return await dt(t, y, {
                model: T ?? null,
                model_runtime: T !== null ? "codex" : null,
                pending_model_fork: !0
            }), J("[session-manager] codex session model override updated", {
                sessionKey: y,
                model: T ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: T,
                applied: "stored"
            };
            let N = j?.query,
                M;
            if (T && N && typeof N.supportedModels == "function") try {
                M = (await N.supportedModels()).some(ct => ct.value === T)
            } catch {}
            let ee = "stored";
            if (N && typeof N.setModel == "function") try {
                await N.setModel(T ?? void 0), ee = "live"
            } catch (ke) {
                ie("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: y,
                    model: T ?? "(reset to default)",
                    error: ke instanceof Error ? ke.message : String(ke)
                })
            }
            return await dt(t, y, {
                model: T ?? null,
                model_runtime: T !== null ? "claude" : null,
                pending_model_fork: null
            }), J("[session-manager] session model override updated", {
                sessionKey: y,
                model: T ?? "(reset to default)",
                applied: ee,
                listed: M ?? "(no list consulted)"
            }), {
                ok: !0,
                model: T,
                applied: ee,
                listed: M
            }
        },
        async getSessionEffortView(y) {
            let T = g.get(y),
                j = await At(t, y).catch(() => null);
            return {
                runtime: await p(y, T),
                storedEffort: j?.effort ?? void 0,
                hasLiveQuery: !!T?.query
            }
        },
        async setSessionEffort(y, T) {
            if (!E) return {
                ok: !1,
                reason: "not_running"
            };
            let j = g.get(y);
            if (await p(y, j) === "codex") return await dt(t, y, {
                effort: T ?? null
            }), J("[session-manager] codex session effort override updated", {
                sessionKey: y,
                effort: T ?? "(reset to default)"
            }), {
                ok: !0,
                effort: T,
                applied: "stored"
            };
            let N = j?.query,
                M = "stored";
            if (N && typeof N.applyFlagSettings == "function") try {
                await N.applyFlagSettings({
                    effortLevel: T ?? null
                }), M = "live"
            } catch (ee) {
                ie("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: y,
                    effort: T ?? "(reset to default)",
                    error: ee instanceof Error ? ee.message : String(ee)
                })
            }
            return await dt(t, y, {
                effort: T ?? null
            }), J("[session-manager] session effort override updated", {
                sessionKey: y,
                effort: T ?? "(reset to default)",
                applied: M
            }), {
                ok: !0,
                effort: T,
                applied: M
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
        hasQueuedWake: v,
        listActors() {
            let y = new Map;
            for (let [T, j] of g) j.actorRunId <= 0 && !v(j.sessionKey) || y.set(T, {
                sessionKey: j.sessionKey,
                status: j.status,
                health: "ok",
                idleSince: j.status === "idle" ? j.idleSince : void 0,
                attachedChannels: j.attachedChannels.size,
                sdkSessionId: j.sdkSessionId,
                origin: j.origin,
                jobId: j.jobId,
                runtime: j.runtime
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
