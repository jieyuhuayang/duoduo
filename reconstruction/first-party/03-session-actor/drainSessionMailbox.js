// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: Vde, daemon.pretty.js:59611)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = Gi(t);
    if (!(await ade(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let s = n.lockHeartbeatIntervalMs ?? 3e4,
        o = setInterval(async () => {
            try {
                await ude(e, r)
            } catch {}
        }, s);
    o.unref?.(), Ai("drain_started", t, {
        sessionKey: t
    });
    let a = Date.now(),
        u = 0,
        c = 0,
        l = 0,
        d, p, f, m = {},
        h = n.getStreamGeneration?.();

    function _(g) {
        if (g) {
            if (!p) {
                p = {
                    ...g
                };
                return
            }
            p.input_tokens = (p.input_tokens ?? 0) + (g.input_tokens ?? 0), p.output_tokens = (p.output_tokens ?? 0) + (g.output_tokens ?? 0), p.cache_creation_input_tokens = (p.cache_creation_input_tokens ?? 0) + (g.cache_creation_input_tokens ?? 0), p.cache_read_input_tokens = (p.cache_read_input_tokens ?? 0) + (g.cache_read_input_tokens ?? 0), p.total_cost_usd = (p.total_cost_usd ?? 0) + (g.total_cost_usd ?? 0), !p.protocol && g.protocol && (p.protocol = g.protocol), !p.model && g.model && (p.model = g.model), g.context_used_tokens !== void 0 && (p.context_used_tokens = g.context_used_tokens)
        }
    }
    async function b(g) {
        try {
            let x = n.getStreamGeneration?.(),
                E = G1(p, h !== void 0 && x !== void 0 && x !== h);
            await appendDrainRecord(e, {
                id: Bde.randomUUID(),
                session_key: t,
                sdk_session_id: d,
                drain_started_at: new Date(a).toISOString(),
                drain_duration_ms: Date.now() - a,
                sdk_duration_ms: u,
                events_processed: g.processedCount,
                events_skipped: g.skippedCount,
                tool_calls: c,
                tool_errors: l,
                output_chars: g.replyText?.length ?? 0,
                cancelled: g.cancelled,
                usage: p,
                perf: Object.keys(m).length > 0 ? m : void 0,
                compact: f,
                suspected_in_process_break: E ? !0 : void 0
            })
        } catch {}
    }
    let v = {
        input_tokens: 0,
        cache_read: 0,
        cache_create: 0,
        output_tokens: 0,
        total_cost_usd: 0
    };

    function w() {
        if (!p) return;
        let g = p.input_tokens ?? 0,
            x = p.cache_read_input_tokens ?? 0,
            k = p.cache_creation_input_tokens ?? 0,
            E = p.output_tokens ?? 0,
            R = p.total_cost_usd ?? 0,
            $ = Sde({
                protocol: p.protocol,
                input_tokens: g - v.input_tokens,
                cache_read_input_tokens: x - v.cache_read,
                cache_creation_input_tokens: k - v.cache_create
            }),
            I = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: p.input_tokens === void 0 ? void 0 : $.totalInput,
                cache_hit_rate: kde($),
                output_tokens: p.output_tokens === void 0 ? void 0 : E - v.output_tokens,
                total_cost_usd: p.total_cost_usd === void 0 ? void 0 : R - v.total_cost_usd,
                model: p.model,
                context_used_tokens: p.context_used_tokens,
                protocol: p.protocol
            };
        return v = {
            input_tokens: g,
            cache_read: x,
            cache_create: k,
            output_tokens: E,
            total_cost_usd: R
        }, I
    }
    try {
        try {
            await Hi(m, "mailbox_merge_ms", async () => vk(e, t))
        } catch (he) {
            if (oX(he)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw he
        }
        let g = await Hi(m, "mailbox_parse_ms", async () => Vg(e, t));
        if (g.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (g.some(he => !he.eventId)) {
            let he = await uX(e, t);
            if (he.removed > 0) {
                await $a(e, t, `orphan_cleanup=${he.removed}`);
                let de = await Vg(e, t);
                if (de.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                g = de
            }
        }
        await Hi(m, "mailbox_render_ms", async () => wk(e, t, g));
        let k = n.batchSize ?? Z5e,
            E = n.mergeWindowMs ?? W5e,
            R = n.sdk ?? createAgentSdkAdapter();
        await pm(e), await hm(e);
        let $ = await batchDrainItems(e, g, {
                fallbackBatchSize: k,
                mergeWindowMs: E,
                perf: m
            }),
            I = $.items,
            P = [],
            C = 0,
            L = !1,
            G = !1,
            K, Q, W, ae = [],
            Oe = await Hi(m, "session_state_ms", async () => At(e, t)),
            X = YU(e, t, Oe ?? void 0),
            Ue = n.jobContext?.stateless === !0;
        if (X.forkFrom && (n.runtime !== "codex" || Ue) && (X.forkFrom = void 0, await oo(e, t, "pending_fork_to").catch(() => {})), await R8e(e, t, {
                snapshotModel: Oe?.model,
                snapshotModelRuntime: Oe?.model_runtime,
                activeRuntime: n.runtime ?? "claude",
                sessionInfo: X
            }), Oe?.pending_model_fork && await I8e(e, t, {
                snapshotModel: Oe.model,
                runtime: n.runtime,
                statelessJob: Ue,
                sessionInfo: X
            }), X.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)) {
            let he = X.pendingUndo;
            try {
                let {
                    sessionId: de
                } = await V5e(he.from, {
                    upToMessageId: he.upToMessageUuid
                });
                await dt(e, t, {
                    sdk_session_id: de,
                    pending_undo: null
                }), X.sessionId = de, X.pendingUndo = void 0, J("[runner] pending_undo materialized via forkSession", {
                    sessionKey: t,
                    from: he.from,
                    upToMessageUuid: he.upToMessageUuid,
                    forkedSessionId: de
                }), n.bus?.emit("session.streaming_invalidated", {
                    sessionKey: t,
                    reason: "fork"
                })
            } catch (de) {
                let V = de instanceof Error ? de.message.split(`
`)[0] : String(de);
                return ie("[runner] pending_undo forkSession failed; LEAVING pending_undo set for retry, aborting drain", {
                    sessionKey: t,
                    from: he.from,
                    upToMessageUuid: he.upToMessageUuid,
                    error: V
                }), await dt(e, t, {
                    last_error: {
                        message: `pending_undo forkSession failed: ${V}`,
                        at: new Date().toISOString()
                    }
                }).catch(() => {}), await MU(e, t), {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: void 0,
                    lastOutboxId: void 0,
                    lastOutboxRecord: void 0,
                    outboxRecords: []
                }
            }
        } else X.pendingUndo && n.runtime !== "claude" && (X.pendingUndo = void 0, await oo(e, t, "pending_undo").catch(() => {}));
        let Nt = Oe?.pending_gateway_notice,
            Se = Oe?.pending_interrupted_context,
            st = Oe?.pending_skip_rewind,
            ze = !1,
            A = !1,
            z = !1,
            H = !1,
            U = t8e(Oe),
            Ce = !1,
            Ae = Rde({
                currentDaemonStartedAt: UU,
                sessionKey: t,
                lastEventAt: Oe?.last_event_at,
                lastSeenDaemonStartedAt: Oe?.last_seen_daemon_started_at
            });
        Ae.writeLastSeenAtEntry && await dt(e, t, {
            last_seen_daemon_started_at: Ae.writeLastSeenAtEntry
        }).catch(() => {});
        let Ke = Ae.inject ? {
                startedAt: UU
            } : void 0,
            _t = Ae.writeLastSeenOnInjectSuccess,
            en = !1,
            En = oa(t) === "channel" ? n.boardHash : void 0,
            Je = $de({
                currentBoardHash: En,
                lastSeenBoardHash: Oe?.last_seen_board_hash
            });
        Je.writeLastSeenAtEntry && await dt(e, t, {
            last_seen_board_hash: Je.writeLastSeenAtEntry
        }).catch(() => {});
        let Xn = Je.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            y = Je.writeLastSeenOnInjectSuccess,
            T = !1,
            N = Oe?.last_event_at,
            M = !1,
            ee = [],
            ke, ct;
        for (let he of I) {
            if (!he.eventId) {
                C += 1;
                continue
            }
            let de = he.eventId;
            if (n.excludeEventIds?.has(de)) {
                C += 1;
                continue
            }
            let V = await Hi(m, "outbox_lookup_ms", async () => Kf(e, de));
            if (V) {
                P.push(de), K = V.payload.text, Q = V.id;
                continue
            }
            let Wt = $.events.get(de) ?? await Hi(m, "event_read_ms", async () => readEventByIdSeek(e, de));
            if (!Wt) {
                C += 1;
                continue
            }
            ee.push({
                item: he,
                event: Wt,
                prompt: GU(Wt, t)
            })
        }
        if (n.onBatchContext && ee.length > 0) {
            let he = 0;
            for (let V of ee)
                if (V.event.type === "route.deliver") {
                    let Wt = rs(V.event.payload) ? V.event.payload : void 0,
                        Jt = rs(Wt?.payload) ? Wt.payload : void 0,
                        at = typeof Jt?.notify_depth == "number" ? Jt.notify_depth : 0;
                    at > he && (he = at)
                } let de = ee.map(V => V.item.eventId).filter(V => !!V);
            n.onBatchContext({
                maxNotifyDepth: he,
                eventIds: de
            })
        }
        let Ne = P8e(X.cwd);
        if (ee.length > 0 && Ne) {
            let he = $8e(t, X.cwd, Ne);
            if (oa(t) === "channel") {
                for (let de of ee) {
                    if (de.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: de,
                            error: new Error(he),
                            stage: "workspace_unavailable",
                            userText: he,
                            payloadExtra: {
                                outcome: "workspace_unavailable",
                                cwd: X.cwd,
                                reason: Ne
                            },
                            bus: n.bus
                        }), de.item.eventId && P.push(de.item.eventId);
                        continue
                    }
                    let V = await Wa(e, t, {
                        item: de.item,
                        event: de.event,
                        outputText: he,
                        sdkSessionId: X.sessionId
                    });
                    ae.push(...V.records), V.primaryRecord && (K = V.primaryRecord.payload.text, Q = V.primaryRecord.id, W = V.primaryRecord), de.item.eventId && P.push(de.item.eventId)
                }
                return await _r(e, t, P), await $a(e, t, `processed=${P.length} skipped=${C} workspace_unavailable=true`), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: K,
                    lastOutboxId: Q,
                    lastOutboxRecord: W,
                    outboxRecords: ae
                }
            }
            throw await handleDrainError(e, t, {
                anchor: ee[0],
                error: new Error(he),
                stage: "workspace_unavailable",
                userText: he,
                payloadExtra: {
                    outcome: "workspace_unavailable",
                    cwd: X.cwd,
                    reason: Ne
                },
                precedingRecords: ae,
                bus: n.bus
            }), new Error(he)
        }
        let lt = claudeUnavailableReason();
        if (ee.length > 0 && n.runtime === "claude" && lt) {
            let he = O8e(lt);
            if (oa(t) === "channel") {
                for (let V of ee) {
                    if (V.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: V,
                            error: new Error(he),
                            stage: "runtime_unavailable",
                            userText: he,
                            payloadExtra: {
                                outcome: "runtime_unavailable",
                                runtime: "claude",
                                runtime_source: n.runtime ? "explicit" : "default"
                            },
                            bus: n.bus
                        }), V.item.eventId && P.push(V.item.eventId);
                        continue
                    }
                    let Wt = await Wa(e, t, {
                        item: V.item,
                        event: V.event,
                        outputText: he,
                        sdkSessionId: X.sessionId
                    });
                    ae.push(...Wt.records), Wt.primaryRecord && (K = Wt.primaryRecord.payload.text, Q = Wt.primaryRecord.id, W = Wt.primaryRecord), V.item.eventId && P.push(V.item.eventId)
                }
                return await _r(e, t, P), await $a(e, t, `processed=${P.length} skipped=${C} runtime_unavailable=claude`), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: K,
                    lastOutboxId: Q,
                    lastOutboxRecord: W,
                    outboxRecords: ae
                }
            }
            throw await handleDrainError(e, t, {
                anchor: ee[0],
                error: new Error(he),
                stage: "runtime_unavailable",
                userText: he,
                payloadExtra: {
                    outcome: "runtime_unavailable",
                    runtime: "claude",
                    runtime_source: n.runtime ? "explicit" : "default"
                },
                precedingRecords: ae,
                bus: n.bus
            }), new Error(he)
        }
        let xi = he => async de => {
            if (de.type === "system" && de.subtype === "init" && de.data && typeof de.data.session_id == "string" && (ke = de.data.session_id, X.sessionId && ke !== X.sessionId && ie("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: X.sessionId,
                    actualSessionId: ke
                })), de.type === "system" && de.subtype === "compact_boundary" && de.data && typeof de.data == "object") {
                let V = de.data,
                    Wt = V.trigger;
                (Wt === "manual" || Wt === "auto") && (ct = {
                    trigger: Wt,
                    pre_tokens: typeof V.pre_tokens == "number" ? V.pre_tokens : void 0,
                    post_tokens: typeof V.post_tokens == "number" ? V.post_tokens : void 0
                })
            }
            return de.type === "tool_use" ? c += 1 : de.type === "tool_result" && de.isError && (l += 1), he(de)
        }, An = async () => {
            let he = ke ?? X.sessionId;
            !he || n.skipSessionIdUpdate || Ue || await dt(e, t, {
                sdk_session_id: he
            })
        }, He = async (he, de) => {
            await An(), !(await At(e, t))?.pending_skip_rewind && await u8e(e, t, o8e(he, de ? Se : void 0))
        }, Ye = async he => {
            he.gatewayNoticeInjected && !ze && (await a8e(e, t), ze = !0), he.interruptedContextInjected && !A && (await c8e(e, t), A = !0), he.skipRewindInjected && !z && (await l8e(e, t), z = !0)
        };
        if (p8e(ee, t)) {
            let he = await WU(e, t, n, ee, X, {
                    pendingGatewayNotice: Nt,
                    pendingInterruptedContext: Se,
                    pendingSkipRewind: st,
                    lastEventAtWatermark: N,
                    timeGapConsumed: H,
                    daemonRestartHint: en ? void 0 : Ke,
                    compactNotice: Ce ? void 0 : U,
                    boardUpdated: T ? void 0 : Xn
                }, m, xi),
                {
                    anchor: de,
                    resumeSessionId: V,
                    forkFromSessionId: Wt,
                    handleExecutionEvent: Jt,
                    attachments: at,
                    batchEventIds: Nn,
                    coalescedPromptText: $e,
                    injectionResult: ue,
                    systemPrompt: ye,
                    sdkRunConfig: me
                } = he;
            H = he.timeGapConsumed, !en && he.injectionResult.daemonRestartHintInjected && (en = !0, _t && await dt(e, t, {
                last_seen_daemon_started_at: _t
            }).catch(() => {})), !T && he.injectionResult.boardUpdatedInjected && (T = !0, y && await dt(e, t, {
                last_seen_board_hash: y
            }).catch(() => {})), Ai("sdk_start", de.event.id, {
                eventIds: Nn,
                coalesced: ee.length > 1
            });
            let Y = Date.now(),
                Ge;
            try {
                let B = he.isNotifyOnly || he.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (_e, ft) => n.onStream(_e, ft, de.event.id);
                Ge = await qde(e, t, R, {
                    prompt: ue.blocks,
                    runtime: n.runtime,
                    abortController: n.abortController,
                    onStream: B,
                    onExecutionEvent: Jt,
                    onTurnAcknowledged: n.onSdkTurnStarted,
                    onTurnRejected: n.onSdkTurnRejected,
                    sessionId: V,
                    forkFrom: Wt,
                    model: n.jobContext?.model ?? X.model,
                    effort: X.effort,
                    cwd: X.cwd,
                    settingSources: X.settingSources,
                    persistSession: n.persistSession,
                    permissionMode: me.permissionMode,
                    allowedTools: me.allowedTools,
                    disallowedTools: me.disallowedTools,
                    tools: me.tools,
                    mcpServers: n.mcpServers,
                    mcpServersFactory: n.mcpServersFactory,
                    holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
                    additionalDirectories: me.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: Nde(n.runtime, n.memoryBoard, me.additionalDirectories, e.memoryDir),
                    boardHash: n.boardHash,
                    attachments: at,
                    systemPrompt: ye
                })
            } catch (Ee) {
                if (isAgentSdkTurnInterruptedError(Ee)) {
                    await Ye(ue);
                    for (let B of ee) B.item.eventId && P.push(B.item.eventId);
                    return await _r(e, t, P), await $a(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                        cancelled: !0,
                        processedCount: P.length,
                        skippedCount: C,
                        replyText: K
                    }), {
                        processed: P.length,
                        skipped: C,
                        lockAcquired: !0,
                        cancelled: !0,
                        lastReplyText: K,
                        lastOutboxId: Q,
                        lastOutboxRecord: W,
                        outboxRecords: ae
                    }
                }
                if (isAgentSdkPromptNotAcceptedAbortError(Ee)) return await _r(e, t, P), await $a(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                    cancelled: !0,
                    processedCount: P.length,
                    skippedCount: C,
                    replyText: K
                }), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !0,
                    lastReplyText: K,
                    lastOutboxId: Q,
                    lastOutboxRecord: W,
                    outboxRecords: ae
                };
                if (ZU(Ee)) {
                    for (let B of ee) B.item.eventId && P.push(B.item.eventId);
                    return await He($e, ue.interruptedContextInjected), await _r(e, t, P), await $a(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                        cancelled: !0,
                        processedCount: P.length,
                        skippedCount: C,
                        replyText: K
                    }), {
                        processed: P.length,
                        skipped: C,
                        lockAcquired: !0,
                        cancelled: !0,
                        lastReplyText: K,
                        lastOutboxId: Q,
                        lastOutboxRecord: W,
                        outboxRecords: ae
                    }
                }
                throw await handleDrainError(e, t, {
                    anchor: de,
                    error: Ee,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : X.model
                    },
                    precedingRecords: ae,
                    bus: n.bus
                }), Ee
            }
            let ut = Ge.sdkResult;
            if (u += Date.now() - Y, n.runtime === "codex" && !ut.skipped && await jde(e, t, ut.turnStartedAt) && (ut.skipped = !0), ut.sessionId && (d = ut.sessionId), _(ut.usage), typeof ut.firstTokenLatencyMs == "number" && (BU(m, "sdk_ttft_ms_total", ut.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), Ai("sdk_end", de.event.id, {
                    eventIds: Nn,
                    sdkDurationMs: Date.now() - Y,
                    usedFallback: ut.usedFallback
                }), n.abortController?.signal.aborted) {
                await He($e, ue.interruptedContextInjected);
                for (let Ee of ee) Ee.item.eventId && P.push(Ee.item.eventId);
                return await _r(e, t, P), await $a(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                    cancelled: !0,
                    processedCount: P.length,
                    skippedCount: C,
                    replyText: K
                }), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !0,
                    lastReplyText: K,
                    lastOutboxId: Q,
                    lastOutboxRecord: W,
                    outboxRecords: ae
                }
            }
            if (await Ye(ue), ut.skipped) L = !0, J("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: de.event.id
            });
            else {
                let Ee = zde(de.event, ut),
                    B = await Hi(m, "outbox_emit_ms", async () => Wa(e, t, {
                        item: de.item,
                        event: de.event,
                        outputText: Ee,
                        sdkSessionId: ut.sessionId,
                        batchedEventIds: ee.map(_e => _e.event.id),
                        attachments: Ge.outboundAttachments,
                        turnMeta: w()
                    }));
                if (ae.push(...B.records), B.primaryRecord) {
                    Ai("outbox_written", de.event.id, {
                        outboxId: B.primaryRecord.id,
                        eventIds: Nn
                    }), K = B.primaryRecord.payload.text, Q = B.primaryRecord.id, W = B.primaryRecord;
                    for (let _e of ee.slice(0, -1)) _e.item.eventId && await q1(e, _e.item.eventId, B.primaryRecord)
                }
            }
            for (let Ee of ee) Ee.item.eventId && P.push(Ee.item.eventId);
            if (ut.skipped) {
                let Ee = ee.map(B => B.item.eventId).filter(B => !!B);
                Ee.length > 0 && await _r(e, t, Ee).catch(B => {
                    ie("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
                        sessionKey: t,
                        error: String(B)
                    })
                })
            }
            if (ut.usedFallback && ut.resumeError) {
                let Ee = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: de.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: X.sessionId,
                        error: ut.resumeError
                    }
                });
                await atomicAppendEvent(e, Ee)
            }
            await Hi(m, "session_upsert_ms", async () => {
                let Ee = {
                    cwd: X.cwd,
                    plane: X.plane,
                    permission_profile: X.permissionProfile,
                    last_event_id: de.event.id,
                    last_event_at: de.event.ts
                };
                if (p?.context_used_tokens !== void 0 && (Ee.context_used_tokens = p.context_used_tokens), ct) {
                    let B = ct;
                    ct = void 0, G = !0;
                    let _e = de.event.ts ?? new Date().toISOString(),
                        ft = await Fde(e, t, Oe?.compact_stats?.measured_at),
                        Qe = Ude({
                            completion: {
                                hadBoundary: !0,
                                history_pre: B.pre_tokens,
                                history_post: B.post_tokens,
                                origin: B.trigger
                            },
                            preTotal: Oe?.context_used_tokens,
                            postTotal: p?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: _e,
                            sessionKey: t,
                            gapCounts: ft
                        });
                    Ee.last_compact_at = _e, Ee.compact_stats = Qe, f = Qe, J("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: de.event.id,
                        trigger: B.trigger,
                        pre_tokens: B.pre_tokens,
                        post_tokens: B.post_tokens
                    })
                }
                ut.sessionId && !Ue && (Ee.sdk_session_id = ut.sessionId), Wt && (Ee.pending_fork_to = null), await dt(e, t, Ee)
            }), de.event.ts && (N = de.event.ts)
        } else {
            let he = n.resume === !1 || Ue ? void 0 : X.sessionId,
                de = n.resume === !1 || n.runtime !== "codex" || Ue ? void 0 : X.forkFrom;
            for (let V of ee) {
                let Wt = !1,
                    Jt;
                if (V.event.routing_hint?.intent === "history-control") {
                    let ht = rs(V.event.payload) ? V.event.payload : void 0,
                        us = (ht?.text ?? ht?.command ?? "").trim(),
                        nt = /^(\S+)(?:\s+(.*))?$/.exec(us),
                        kr = nt?.[1]?.toLowerCase() ?? "",
                        tn = nt?.[2]?.trim() ?? "";
                    if (kr === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (oa(t) === "channel") {
                            if (V.event.source?.name === "idle-compact" && w8e(V.event.ts, {
                                    actorSpawnedAt: n.actorSpawnedAt,
                                    actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                                })) {
                                J("[runner] dropping stale idle-compact item (no SDK call)", {
                                    sessionKey: t,
                                    eventId: V.event.id,
                                    itemTs: V.event.ts,
                                    actorSpawnedAt: n.actorSpawnedAt,
                                    actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                                }), V.item.eventId && (P.push(V.item.eventId), await _r(e, t, [V.item.eventId]).catch(Ei => {
                                    ie("[runner] stale idle-compact markDone failed (will retry at drain end)", {
                                        sessionKey: t,
                                        eventId: V.item.eventId,
                                        error: Ei instanceof Error ? Ei.message : String(Ei)
                                    })
                                })), V.event.ts && (N = V.event.ts);
                                continue
                            }
                            Wt = !0
                        } else {
                            let Ei = "ℹ️ /compact is only available in interactive sessions.",
                                nr = await Wa(e, t, {
                                    item: V.item,
                                    event: V.event,
                                    outputText: Ei,
                                    sdkSessionId: he
                                });
                            ae.push(...nr.records), nr.primaryRecord && (Q = nr.primaryRecord.id, W = nr.primaryRecord, K = Ei), V.item.eventId && (P.push(V.item.eventId), await _r(e, t, [V.item.eventId]).catch(Bs => {
                                ie("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: V.item.eventId,
                                    error: Bs instanceof Error ? Bs.message : String(Bs)
                                })
                            })), V.event.ts && (N = V.event.ts);
                            continue
                        } if (!Wt) {
                        let Ei = n.sdk ?? createAgentSdkAdapter(),
                            nr = await E8e({
                                paths: e,
                                sessionKey: t,
                                sdk: Ei,
                                sessionInfo: {
                                    ...X,
                                    sessionId: he
                                },
                                cmdToken: kr,
                                cmdArgs: tn
                            }),
                            Bs = await Wa(e, t, {
                                item: V.item,
                                event: V.event,
                                outputText: nr,
                                sdkSessionId: he
                            });
                        ae.push(...Bs.records), Bs.primaryRecord && (Q = Bs.primaryRecord.id, W = Bs.primaryRecord, K = nr);
                        let ci = await At(e, t);
                        if (ci && (X.sessionId = ci.sdk_session_id, X.pendingUndo = ci.pending_undo, he = ci.sdk_session_id), V.item.eventId && (P.push(V.item.eventId), await _r(e, t, [V.item.eventId]).catch(Hs => {
                                ie("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: V.item.eventId,
                                    error: Hs instanceof Error ? Hs.message : String(Hs)
                                })
                            })), V.event.ts && (N = V.event.ts), ci?.pending_undo && !ci.sdk_session_id) {
                            J("[runner] pending_undo set during drain — bailing batch to let next drain materialize fork", {
                                sessionKey: t,
                                pending_undo: ci.pending_undo
                            });
                            break
                        }
                        continue
                    }
                }
                let at = de,
                    Nn = n.resume === !1 || at || Ue ? void 0 : he,
                    $e = xi(Yde(e, t, V.event.session_key ?? t, n.onExecutionEvent)),
                    ue = rs(V.event.payload) ? V.event.payload : void 0,
                    ye = ue ? JU(ue) : void 0,
                    me = await Hi(m, "effective_config_ms", async () => Mz(e, V.event)),
                    Y = oa(t) === "channel",
                    Ge = V.event.type === "channel.message",
                    Ee = (me?.time_gap_minutes ?? Wde) * 60 * 1e3,
                    B = !H && Ee > 0 && Y && Ge && N ? {
                        lastEventAt: N,
                        currentEventAt: V.event.ts ?? new Date().toISOString(),
                        thresholdMs: Ee
                    } : void 0,
                    _e, ft = V.prompt;
                if (V.event.type === "job.spawn" && n.jobContext) {
                    let ht = rs(ue?.tick) ? ue.tick : void 0;
                    if (ht) {
                        let Tn = ht.run_number,
                            us = ht.triggered_at,
                            nt = ht.previous_run_at;
                        typeof Tn == "number" && typeof us == "string" && (_e = {
                            run_number: Tn,
                            triggered_at: us,
                            previous_run_at: typeof nt == "string" ? nt : null,
                            cron: n.jobContext.cron
                        })
                    }
                    _e && (ft = i8e)
                }
                let Qe = !en && Ke ? Ke : void 0,
                    kt = (me?.auto_compact_idle_minutes ?? 0) > 0 && !Ce && U ? U : void 0,
                    bt = !T && Xn ? Xn : void 0,
                    er = !ze || !A || !z || !!B || !!_e || !!Qe || !!kt || !!bt ? buildTransientUserBlocks(ft, {
                        gatewayNotice: ze ? void 0 : Nt,
                        interruptedContext: A ? void 0 : Se,
                        skipRewind: z ? void 0 : st,
                        isUserMessage: Ge,
                        timeGap: B,
                        jobTick: _e,
                        daemonRestartHint: Qe,
                        compactNotice: kt,
                        boardUpdated: bt
                    }, X) : {
                        blocks: [{
                            type: "text",
                            text: ft,
                            tag: "user-input"
                        }],
                        gatewayNoticeInjected: !1,
                        interruptedContextInjected: !1,
                        skipRewindInjected: !1,
                        timeGapInjected: !1,
                        jobTickInjected: !1,
                        daemonRestartHintInjected: !1,
                        compactNoticeInjected: !1,
                        boardUpdatedInjected: !1,
                        captured: {}
                    };
                H = H || er.timeGapInjected, er.compactNoticeInjected && (Ce = !0), !en && er.daemonRestartHintInjected && (en = !0, _t && await dt(e, t, {
                    last_seen_daemon_started_at: _t
                }).catch(() => {})), !T && er.boardUpdatedInjected && (T = !0, y && await dt(e, t, {
                    last_seen_board_hash: y
                }).catch(() => {}));
                let tr = buildSystemPromptForChannelConfig(me, t, n.jobContext ? {
                        content: n.jobContext.content,
                        jobId: n.jobContext.jobId,
                        cron: n.jobContext.cron,
                        stateless: n.jobContext.stateless
                    } : void 0, n.memoryBoard),
                    Vn = Hde(n, me),
                    qs, Sr = Date.now(),
                    Fm = n.onStream ? (ht, Tn) => n.onStream(ht, Tn, V.event.id) : void 0;
                try {
                    qs = await qde(e, t, R, {
                        prompt: er.blocks,
                        runtime: n.runtime,
                        abortController: n.abortController,
                        onStream: Fm,
                        onExecutionEvent: $e,
                        onTurnAcknowledged: n.onSdkTurnStarted,
                        onTurnRejected: n.onSdkTurnRejected,
                        sessionId: Nn,
                        forkFrom: at,
                        model: n.jobContext?.model ?? X.model,
                        effort: X.effort,
                        cwd: X.cwd,
                        settingSources: X.settingSources,
                        persistSession: n.persistSession,
                        permissionMode: Vn.permissionMode,
                        allowedTools: Vn.allowedTools,
                        disallowedTools: Vn.disallowedTools,
                        tools: Vn.tools,
                        mcpServers: n.mcpServers,
                        mcpServersFactory: n.mcpServersFactory,
                        holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
                        additionalDirectories: Vn.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: Nde(n.runtime, n.memoryBoard, Vn.additionalDirectories, e.memoryDir),
                        boardHash: n.boardHash,
                        attachments: ye,
                        systemPrompt: tr
                    })
                } catch (ht) {
                    if (isAgentSdkTurnInterruptedError(ht)) {
                        await Ye(er), V.item.eventId && P.push(V.item.eventId), M = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(ht)) {
                        M = !0;
                        break
                    }
                    if (ZU(ht)) {
                        V.item.eventId && P.push(V.item.eventId), await He(V.prompt, er.interruptedContextInjected), M = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: V,
                        error: ht,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : X.model
                        },
                        precedingRecords: ae,
                        bus: n.bus
                    }), ht
                }
                let Dn = qs.sdkResult;
                if (n.runtime === "codex" && !Dn.skipped && await jde(e, t, Dn.turnStartedAt) && (Dn.skipped = !0), u += Date.now() - Sr, Dn.sessionId && (d = Dn.sessionId), _(Dn.usage), typeof Dn.firstTokenLatencyMs == "number" && (BU(m, "sdk_ttft_ms_total", Dn.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await He(V.prompt, er.interruptedContextInjected), M = !0, V.item.eventId && P.push(V.item.eventId);
                    break
                }
                if (await Ye(er), !Dn.skipped && !Wt) {
                    let ht = zde(V.event, Dn),
                        Tn = await Hi(m, "outbox_emit_ms", async () => Wa(e, t, {
                            item: V.item,
                            event: V.event,
                            outputText: ht,
                            sdkSessionId: Dn.sessionId,
                            attachments: qs.outboundAttachments,
                            turnMeta: w()
                        }));
                    ae.push(...Tn.records), Tn.primaryRecord && (K = Tn.primaryRecord.payload.text, Q = Tn.primaryRecord.id, W = Tn.primaryRecord)
                } else Wt ? J("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: V.event.id
                }) : (L = !0, J("[runner] Skip called — suppressing outbox", {
                    sessionKey: t,
                    eventId: V.event.id
                }), V.item.eventId && await _r(e, t, [V.item.eventId]).catch(ht => {
                    ie("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
                        sessionKey: t,
                        eventId: V.item.eventId,
                        error: String(ht)
                    })
                }));
                let ko = V.event.source?.name === "idle-compact";
                if (ct) {
                    let ht = ct;
                    if (ct = void 0, Jt = {
                            hadBoundary: !0,
                            history_pre: ht.pre_tokens,
                            history_post: ht.post_tokens,
                            origin: ko ? "idle-compact" : ht.trigger
                        }, ht.trigger === "manual" && !ko) {
                        let Tn = v8e(ht),
                            us = await Wa(e, t, {
                                item: V.item,
                                event: V.event,
                                outputText: Tn,
                                sdkSessionId: Dn.sessionId ?? he
                            });
                        ae.push(...us.records), us.primaryRecord && (K = Tn, Q = us.primaryRecord.id, W = us.primaryRecord)
                    } else J("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: V.event.id,
                        trigger: ht.trigger,
                        idleCompact: ko,
                        pre_tokens: ht.pre_tokens,
                        post_tokens: ht.post_tokens
                    })
                } else if (Wt)
                    if (Jt = {
                            hadBoundary: !1,
                            origin: ko ? "idle-compact" : "manual"
                        }, ko) J("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: V.event.id
                    });
                    else {
                        let ht = "ℹ️ Nothing to compact.",
                            Tn = await Wa(e, t, {
                                item: V.item,
                                event: V.event,
                                outputText: ht,
                                sdkSessionId: Dn.sessionId ?? he
                            });
                        ae.push(...Tn.records), Tn.primaryRecord && (K = ht, Q = Tn.primaryRecord.id, W = Tn.primaryRecord)
                    } if (V.item.eventId && P.push(V.item.eventId), Dn.usedFallback && Dn.resumeError) {
                    let ht = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: V.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: X.sessionId,
                            error: Dn.resumeError
                        }
                    });
                    await atomicAppendEvent(e, ht)
                }
                await Hi(m, "session_upsert_ms", async () => {
                    let ht = {
                        cwd: X.cwd,
                        plane: X.plane,
                        permission_profile: X.permissionProfile,
                        last_event_id: V.event.id,
                        last_event_at: V.event.ts
                    };
                    p?.context_used_tokens !== void 0 && (ht.context_used_tokens = p.context_used_tokens);
                    let Tn = qU(V.event.payload, "idle_ms"),
                        us = qU(V.event.payload, "threshold_at_fire");
                    if (Jt) {
                        G = !0;
                        let nt = V.event.ts ?? new Date().toISOString(),
                            kr = await Fde(e, t, Oe?.compact_stats?.measured_at),
                            tn = Ude({
                                completion: Jt,
                                preTotal: Oe?.context_used_tokens,
                                postTotal: p?.context_used_tokens,
                                idleMs: Tn,
                                thresholdAtFire: us,
                                measuredAt: nt,
                                sessionKey: t,
                                gapCounts: kr
                            });
                        ht.last_compact_at = nt, ht.compact_stats = tn, f = tn
                    }
                    Dn.sessionId && !Ue && (ht.sdk_session_id = Dn.sessionId), at && (ht.pending_fork_to = null), await dt(e, t, ht)
                }), Jt?.origin === "idle-compact" && await x8e(e, {
                    sessionKey: t,
                    preTokens: Oe?.context_used_tokens,
                    postTokens: p?.context_used_tokens,
                    idleMs: qU(V.event.payload, "idle_ms")
                }), at && (de = void 0), Dn.sessionId && !Ue && (he = Dn.sessionId), V.event.ts && (N = V.event.ts)
            }
        }
        return await Hi(m, "mailbox_finalize_ms", async () => {
            if (await _r(e, t, P), P.length > 0 || C > 0) {
                let he = `processed=${P.length} skipped=${C}${Q?` outbox=${Q}`:""}`;
                await $a(e, t, he)
            }
        }), await b({
            cancelled: M,
            processedCount: P.length,
            skippedCount: C,
            replyText: K
        }), {
            processed: P.length,
            skipped: C,
            lockAcquired: !0,
            cancelled: M,
            turnSkipped: L,
            compacted: G,
            lastReplyText: K,
            lastOutboxId: Q,
            lastOutboxRecord: W,
            outboxRecords: ae
        }
    } finally {
        clearInterval(o), await MU(e, r)
    }
}
