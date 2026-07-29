// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: tfe, daemon.pretty.js:59734)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = Gi(t);
    if (!(await yde(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let s = n.lockHeartbeatIntervalMs ?? 3e4,
        o = setInterval(async () => {
            try {
                await _de(e, r)
            } catch {}
        }, s);
    o.unref?.(), Ci("drain_started", t, {
        sessionKey: t
    });
    let a = Date.now(),
        c = 0,
        u = 0,
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
                E = Y1(p, h !== void 0 && x !== void 0 && x !== h);
            await appendDrainRecord(e, {
                id: Xde.randomUUID(),
                session_key: t,
                sdk_session_id: d,
                drain_started_at: new Date(a).toISOString(),
                drain_duration_ms: Date.now() - a,
                sdk_duration_ms: c,
                events_processed: g.processedCount,
                events_skipped: g.skippedCount,
                tool_calls: u,
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
    let w = {
        input_tokens: 0,
        cache_read: 0,
        cache_create: 0,
        output_tokens: 0,
        total_cost_usd: 0
    };

    function v() {
        if (!p) return;
        let g = p.input_tokens ?? 0,
            x = p.cache_read_input_tokens ?? 0,
            k = p.cache_creation_input_tokens ?? 0,
            E = p.output_tokens ?? 0,
            R = p.total_cost_usd ?? 0,
            $ = Cde({
                protocol: p.protocol,
                input_tokens: g - w.input_tokens,
                cache_read_input_tokens: x - w.cache_read,
                cache_creation_input_tokens: k - w.cache_create
            }),
            I = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: p.input_tokens === void 0 ? void 0 : $.totalInput,
                cache_hit_rate: Ade($),
                output_tokens: p.output_tokens === void 0 ? void 0 : E - w.output_tokens,
                total_cost_usd: p.total_cost_usd === void 0 ? void 0 : R - w.total_cost_usd,
                model: p.model,
                context_used_tokens: p.context_used_tokens,
                protocol: p.protocol
            };
        return w = {
            input_tokens: g,
            cache_read: x,
            cache_create: k,
            output_tokens: E,
            total_cost_usd: R
        }, I
    }
    try {
        try {
            await Bi(m, "mailbox_merge_ms", async () => vk(e, t))
        } catch (ye) {
            if (lX(ye)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw ye
        }
        let g = await Bi(m, "mailbox_parse_ms", async () => Wg(e, t));
        if (g.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (g.some(ye => !ye.eventId)) {
            let ye = await fX(e, t);
            if (ye.removed > 0) {
                await Oa(e, t, `orphan_cleanup=${ye.removed}`);
                let fe = await Wg(e, t);
                if (fe.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                g = fe
            }
        }
        await Bi(m, "mailbox_render_ms", async () => wk(e, t, g));
        let k = n.batchSize ?? o8e,
            E = n.mergeWindowMs ?? a8e,
            R = n.sdk ?? createAgentSdkAdapter();
        await gm(e), await _m(e);
        let $ = await batchDrainItems(e, g, {
                fallbackBatchSize: k,
                mergeWindowMs: E,
                perf: m
            }),
            I = $.items,
            P = [],
            C = 0,
            j = !1,
            X = !1,
            W, Y, G, ae = [],
            Ce = await Bi(m, "session_state_ms", async () => At(e, t)),
            ue = tq(e, t, Ce ?? void 0),
            Ne = n.jobContext?.stateless === !0;
        if (ue.forkFrom && (n.runtime !== "codex" || Ne) && (ue.forkFrom = void 0, await co(e, t, "pending_fork_to").catch(() => {})), await U8e(e, t, {
                snapshotModel: Ce?.model,
                snapshotModelRuntime: Ce?.model_runtime,
                activeRuntime: n.runtime ?? "claude",
                sessionInfo: ue
            }), Ce?.pending_model_fork && await q8e(e, t, {
                snapshotModel: Ce.model,
                runtime: n.runtime,
                statelessJob: Ne,
                sessionInfo: ue
            }), ue.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)) {
            let ye = ue.pendingUndo;
            try {
                let {
                    sessionId: fe
                } = await s8e(ye.from, {
                    upToMessageId: ye.upToMessageUuid
                });
                await lt(e, t, {
                    sdk_session_id: fe,
                    pending_undo: null
                }), ue.sessionId = fe, ue.pendingUndo = void 0, K("[runner] pending_undo materialized via forkSession", {
                    sessionKey: t,
                    from: ye.from,
                    upToMessageUuid: ye.upToMessageUuid,
                    forkedSessionId: fe
                }), n.bus?.emit("session.streaming_invalidated", {
                    sessionKey: t,
                    reason: "fork"
                })
            } catch (fe) {
                let H = fe instanceof Error ? fe.message.split(`
`)[0] : String(fe);
                return se("[runner] pending_undo forkSession failed; LEAVING pending_undo set for retry, aborting drain", {
                    sessionKey: t,
                    from: ye.from,
                    upToMessageUuid: ye.upToMessageUuid,
                    error: H
                }), await lt(e, t, {
                    last_error: {
                        message: `pending_undo forkSession failed: ${H}`,
                        at: new Date().toISOString()
                    }
                }).catch(() => {}), await qU(e, t), {
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
        } else ue.pendingUndo && n.runtime !== "claude" && (ue.pendingUndo = void 0, await co(e, t, "pending_undo").catch(() => {}));
        let ot = Ce?.pending_gateway_notice,
            Se = Ce?.pending_interrupted_context,
            Xe = Ce?.pending_skip_rewind,
            Sn = !1,
            U = !1,
            L = !1,
            M = !1,
            F = h8e(Ce),
            xe = !1,
            Oe = Lde({
                currentDaemonStartedAt: VU,
                sessionKey: t,
                lastEventAt: Ce?.last_event_at,
                lastSeenDaemonStartedAt: Ce?.last_seen_daemon_started_at
            });
        Oe.writeLastSeenAtEntry && await lt(e, t, {
            last_seen_daemon_started_at: Oe.writeLastSeenAtEntry
        }).catch(() => {});
        let ze = Oe.inject ? {
                startedAt: VU
            } : void 0,
            et = Oe.writeLastSeenOnInjectSuccess,
            yt = !1,
            Tn = aa(t) === "channel" ? n.boardHash : void 0,
            Ze = Fde({
                currentBoardHash: Tn,
                lastSeenBoardHash: Ce?.last_seen_board_hash
            });
        Ze.writeLastSeenAtEntry && await lt(e, t, {
            last_seen_board_hash: Ze.writeLastSeenAtEntry
        }).catch(() => {});
        let Qn = Ze.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            y = Ze.writeLastSeenOnInjectSuccess,
            T = !1,
            A = Ce?.last_event_at,
            z = !1,
            te = [],
            ke, at;
        for (let ye of I) {
            if (!ye.eventId) {
                C += 1;
                continue
            }
            let fe = ye.eventId;
            if (n.excludeEventIds?.has(fe)) {
                C += 1;
                continue
            }
            let H = await Bi(m, "outbox_lookup_ms", async () => Qf(e, fe));
            if (H) {
                P.push(fe), W = H.payload.text, Y = H.id;
                continue
            }
            let Vt = $.events.get(fe) ?? await Bi(m, "event_read_ms", async () => readEventByIdSeek(e, fe));
            if (!Vt) {
                C += 1;
                continue
            }
            te.push({
                item: ye,
                event: Vt,
                prompt: XU(Vt, t)
            })
        }
        if (n.onBatchContext && te.length > 0) {
            let ye = 0;
            for (let H of te)
                if (H.event.type === "route.deliver") {
                    let Vt = is(H.event.payload) ? H.event.payload : void 0,
                        zt = is(Vt?.payload) ? Vt.payload : void 0,
                        dt = typeof zt?.notify_depth == "number" ? zt.notify_depth : 0;
                    dt > ye && (ye = dt)
                } let fe = te.map(H => H.item.eventId).filter(H => !!H);
            n.onBatchContext({
                maxNotifyDepth: ye,
                eventIds: fe
            })
        }
        let $e = B8e(ue.cwd);
        if (te.length > 0 && $e) {
            let ye = H8e(t, ue.cwd, $e);
            if (aa(t) === "channel") {
                for (let fe of te) {
                    if (fe.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: fe,
                            error: new Error(ye),
                            stage: "workspace_unavailable",
                            userText: ye,
                            payloadExtra: {
                                outcome: "workspace_unavailable",
                                cwd: ue.cwd,
                                reason: $e
                            },
                            bus: n.bus
                        }), fe.item.eventId && P.push(fe.item.eventId);
                        continue
                    }
                    let H = await Ja(e, t, {
                        item: fe.item,
                        event: fe.event,
                        outputText: ye,
                        sdkSessionId: ue.sessionId
                    });
                    ae.push(...H.records), H.primaryRecord && (W = H.primaryRecord.payload.text, Y = H.primaryRecord.id, G = H.primaryRecord), fe.item.eventId && P.push(fe.item.eventId)
                }
                return await yr(e, t, P), await Oa(e, t, `processed=${P.length} skipped=${C} workspace_unavailable=true`), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: W,
                    lastOutboxId: Y,
                    lastOutboxRecord: G,
                    outboxRecords: ae
                }
            }
            throw await handleDrainError(e, t, {
                anchor: te[0],
                error: new Error(ye),
                stage: "workspace_unavailable",
                userText: ye,
                payloadExtra: {
                    outcome: "workspace_unavailable",
                    cwd: ue.cwd,
                    reason: $e
                },
                precedingRecords: ae,
                bus: n.bus
            }), new Error(ye)
        }
        let ct = claudeUnavailableReason();
        if (te.length > 0 && n.runtime === "claude" && ct) {
            let ye = V8e(ct);
            if (aa(t) === "channel") {
                for (let H of te) {
                    if (H.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: H,
                            error: new Error(ye),
                            stage: "runtime_unavailable",
                            userText: ye,
                            payloadExtra: {
                                outcome: "runtime_unavailable",
                                runtime: "claude",
                                runtime_source: n.runtime ? "explicit" : "default"
                            },
                            bus: n.bus
                        }), H.item.eventId && P.push(H.item.eventId);
                        continue
                    }
                    let Vt = await Ja(e, t, {
                        item: H.item,
                        event: H.event,
                        outputText: ye,
                        sdkSessionId: ue.sessionId
                    });
                    ae.push(...Vt.records), Vt.primaryRecord && (W = Vt.primaryRecord.payload.text, Y = Vt.primaryRecord.id, G = Vt.primaryRecord), H.item.eventId && P.push(H.item.eventId)
                }
                return await yr(e, t, P), await Oa(e, t, `processed=${P.length} skipped=${C} runtime_unavailable=claude`), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: W,
                    lastOutboxId: Y,
                    lastOutboxRecord: G,
                    outboxRecords: ae
                }
            }
            throw await handleDrainError(e, t, {
                anchor: te[0],
                error: new Error(ye),
                stage: "runtime_unavailable",
                userText: ye,
                payloadExtra: {
                    outcome: "runtime_unavailable",
                    runtime: "claude",
                    runtime_source: n.runtime ? "explicit" : "default"
                },
                precedingRecords: ae,
                bus: n.bus
            }), new Error(ye)
        }
        let ki = ye => async fe => {
            if (fe.type === "system" && fe.subtype === "init" && fe.data && typeof fe.data.session_id == "string" && (ke = fe.data.session_id, ue.sessionId && ke !== ue.sessionId && se("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: ue.sessionId,
                    actualSessionId: ke
                })), fe.type === "system" && fe.subtype === "compact_boundary" && fe.data && typeof fe.data == "object") {
                let H = fe.data,
                    Vt = H.trigger;
                (Vt === "manual" || Vt === "auto") && (at = {
                    trigger: Vt,
                    pre_tokens: typeof H.pre_tokens == "number" ? H.pre_tokens : void 0,
                    post_tokens: typeof H.post_tokens == "number" ? H.post_tokens : void 0
                })
            }
            return fe.type === "tool_use" ? u += 1 : fe.type === "tool_result" && fe.isError && (l += 1), ye(fe)
        }, Nn = async () => {
            let ye = ke ?? ue.sessionId;
            !ye || n.skipSessionIdUpdate || Ne || await lt(e, t, {
                sdk_session_id: ye
            })
        }, Je = async (ye, fe) => {
            await Nn(), !(await At(e, t))?.pending_skip_rewind && await S8e(e, t, v8e(ye, fe ? Se : void 0))
        }, We = async ye => {
            ye.gatewayNoticeInjected && !Sn && (await w8e(e, t), Sn = !0), ye.interruptedContextInjected && !U && (await k8e(e, t), U = !0), ye.skipRewindInjected && !L && (await x8e(e, t), L = !0)
        };
        if (R8e(te, t)) {
            let ye = await YU(e, t, n, te, ue, {
                    pendingGatewayNotice: ot,
                    pendingInterruptedContext: Se,
                    pendingSkipRewind: Xe,
                    lastEventAtWatermark: A,
                    timeGapConsumed: M,
                    daemonRestartHint: yt ? void 0 : ze,
                    compactNotice: xe ? void 0 : F,
                    boardUpdated: T ? void 0 : Qn
                }, m, ki),
                {
                    anchor: fe,
                    resumeSessionId: H,
                    forkFromSessionId: Vt,
                    handleExecutionEvent: zt,
                    attachments: dt,
                    batchEventIds: kn,
                    coalescedPromptText: Z,
                    injectionResult: he,
                    systemPrompt: Ae,
                    sdkRunConfig: V
                } = ye;
            M = ye.timeGapConsumed, !yt && ye.injectionResult.daemonRestartHintInjected && (yt = !0, et && await lt(e, t, {
                last_seen_daemon_started_at: et
            }).catch(() => {})), !T && ye.injectionResult.boardUpdatedInjected && (T = !0, y && await lt(e, t, {
                last_seen_board_hash: y
            }).catch(() => {})), Ci("sdk_start", fe.event.id, {
                eventIds: kn,
                coalesced: te.length > 1
            });
            let it = Date.now(),
                Tt;
            try {
                let ee = ye.isNotifyOnly || ye.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (ge, Rt) => n.onStream(ge, Rt, fe.event.id);
                Tt = await Qde(e, t, R, {
                    prompt: he.blocks,
                    runtime: n.runtime,
                    abortController: n.abortController,
                    onStream: ee,
                    onExecutionEvent: zt,
                    onTurnAcknowledged: n.onSdkTurnStarted,
                    onTurnRejected: n.onSdkTurnRejected,
                    sessionId: H,
                    forkFrom: Vt,
                    model: n.jobContext?.model ?? ue.model,
                    effort: ue.effort,
                    cwd: ue.cwd,
                    settingSources: ue.settingSources,
                    persistSession: n.persistSession,
                    permissionMode: V.permissionMode,
                    allowedTools: V.allowedTools,
                    disallowedTools: V.disallowedTools,
                    tools: V.tools,
                    mcpServers: n.mcpServers,
                    mcpServersFactory: n.mcpServersFactory,
                    holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
                    additionalDirectories: V.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: Hde(n.runtime, n.memoryBoard, V.additionalDirectories, e.memoryDir),
                    boardHash: n.boardHash,
                    attachments: dt,
                    systemPrompt: Ae
                })
            } catch (Q) {
                if (isAgentSdkTurnInterruptedError(Q)) {
                    await We(he);
                    for (let ee of te) ee.item.eventId && P.push(ee.item.eventId);
                    return await yr(e, t, P), await Oa(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                        cancelled: !0,
                        processedCount: P.length,
                        skippedCount: C,
                        replyText: W
                    }), {
                        processed: P.length,
                        skipped: C,
                        lockAcquired: !0,
                        cancelled: !0,
                        lastReplyText: W,
                        lastOutboxId: Y,
                        lastOutboxRecord: G,
                        outboxRecords: ae
                    }
                }
                if (isAgentSdkPromptNotAcceptedAbortError(Q)) return await yr(e, t, P), await Oa(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                    cancelled: !0,
                    processedCount: P.length,
                    skippedCount: C,
                    replyText: W
                }), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !0,
                    lastReplyText: W,
                    lastOutboxId: Y,
                    lastOutboxRecord: G,
                    outboxRecords: ae
                };
                if (KU(Q)) {
                    for (let ee of te) ee.item.eventId && P.push(ee.item.eventId);
                    return await Je(Z, he.interruptedContextInjected), await yr(e, t, P), await Oa(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                        cancelled: !0,
                        processedCount: P.length,
                        skippedCount: C,
                        replyText: W
                    }), {
                        processed: P.length,
                        skipped: C,
                        lockAcquired: !0,
                        cancelled: !0,
                        lastReplyText: W,
                        lastOutboxId: Y,
                        lastOutboxRecord: G,
                        outboxRecords: ae
                    }
                }
                throw await handleDrainError(e, t, {
                    anchor: fe,
                    error: Q,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : ue.model
                    },
                    precedingRecords: ae,
                    bus: n.bus
                }), Q
            }
            let ut = Tt.sdkResult;
            if (c += Date.now() - it, n.runtime === "codex" && !ut.skipped && await Zde(e, t, ut.turnStartedAt) && (ut.skipped = !0), ut.sessionId && (d = ut.sessionId), _(ut.usage), typeof ut.firstTokenLatencyMs == "number" && (JU(m, "sdk_ttft_ms_total", ut.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), Ci("sdk_end", fe.event.id, {
                    eventIds: kn,
                    sdkDurationMs: Date.now() - it,
                    usedFallback: ut.usedFallback
                }), n.abortController?.signal.aborted) {
                await Je(Z, he.interruptedContextInjected);
                for (let Q of te) Q.item.eventId && P.push(Q.item.eventId);
                return await yr(e, t, P), await Oa(e, t, `processed=${P.length} skipped=${C} cancelled=true`), await b({
                    cancelled: !0,
                    processedCount: P.length,
                    skippedCount: C,
                    replyText: W
                }), {
                    processed: P.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !0,
                    lastReplyText: W,
                    lastOutboxId: Y,
                    lastOutboxRecord: G,
                    outboxRecords: ae
                }
            }
            if (await We(he), ut.skipped) j = !0, K("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: fe.event.id
            });
            else {
                let Q = Gde(fe.event, ut),
                    ee = await Bi(m, "outbox_emit_ms", async () => Ja(e, t, {
                        item: fe.item,
                        event: fe.event,
                        outputText: Q,
                        sdkSessionId: ut.sessionId,
                        batchedEventIds: te.map(ge => ge.event.id),
                        attachments: Tt.outboundAttachments,
                        turnMeta: v()
                    }));
                if (ae.push(...ee.records), ee.primaryRecord) {
                    Ci("outbox_written", fe.event.id, {
                        outboxId: ee.primaryRecord.id,
                        eventIds: kn
                    }), W = ee.primaryRecord.payload.text, Y = ee.primaryRecord.id, G = ee.primaryRecord;
                    for (let ge of te.slice(0, -1)) ge.item.eventId && await H1(e, ge.item.eventId, ee.primaryRecord)
                }
            }
            for (let Q of te) Q.item.eventId && P.push(Q.item.eventId);
            if (ut.skipped) {
                let Q = te.map(ee => ee.item.eventId).filter(ee => !!ee);
                Q.length > 0 && await yr(e, t, Q).catch(ee => {
                    se("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
                        sessionKey: t,
                        error: String(ee)
                    })
                })
            }
            if (ut.usedFallback && ut.resumeError) {
                let Q = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: fe.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: ue.sessionId,
                        error: ut.resumeError
                    }
                });
                await atomicAppendEvent(e, Q)
            }
            await Bi(m, "session_upsert_ms", async () => {
                let Q = {
                    cwd: ue.cwd,
                    plane: ue.plane,
                    permission_profile: ue.permissionProfile,
                    last_event_id: fe.event.id,
                    last_event_at: fe.event.ts
                };
                if (p?.context_used_tokens !== void 0 && (Q.context_used_tokens = p.context_used_tokens), at) {
                    let ee = at;
                    at = void 0, X = !0;
                    let ge = fe.event.ts ?? new Date().toISOString(),
                        Rt = await Kde(e, t, Ce?.compact_stats?.measured_at),
                        $t = Yde({
                            completion: {
                                hadBoundary: !0,
                                history_pre: ee.pre_tokens,
                                history_post: ee.post_tokens,
                                origin: ee.trigger
                            },
                            preTotal: Ce?.context_used_tokens,
                            postTotal: p?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: ge,
                            sessionKey: t,
                            gapCounts: Rt
                        });
                    Q.last_compact_at = ge, Q.compact_stats = $t, f = $t, K("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: fe.event.id,
                        trigger: ee.trigger,
                        pre_tokens: ee.pre_tokens,
                        post_tokens: ee.post_tokens
                    })
                }
                ut.sessionId && !Ne && (Q.sdk_session_id = ut.sessionId), Vt && (Q.pending_fork_to = null), await lt(e, t, Q)
            }), fe.event.ts && (A = fe.event.ts)
        } else {
            let ye = n.resume === !1 || Ne ? void 0 : ue.sessionId,
                fe = n.resume === !1 || n.runtime !== "codex" || Ne ? void 0 : ue.forkFrom;
            for (let H of te) {
                let Vt = !1,
                    zt;
                if (H.event.routing_hint?.intent === "history-control") {
                    let mt = is(H.event.payload) ? H.event.payload : void 0,
                        us = (mt?.text ?? mt?.command ?? "").trim(),
                        tt = /^(\S+)(?:\s+(.*))?$/.exec(us),
                        Sr = tt?.[1]?.toLowerCase() ?? "",
                        Xt = tt?.[2]?.trim() ?? "";
                    if (Sr === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (aa(t) === "channel") {
                            if (H.event.source?.name === "idle-compact" && D8e(H.event.ts, {
                                    actorSpawnedAt: n.actorSpawnedAt,
                                    actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                                })) {
                                K("[runner] dropping stale idle-compact item (no SDK call)", {
                                    sessionKey: t,
                                    eventId: H.event.id,
                                    itemTs: H.event.ts,
                                    actorSpawnedAt: n.actorSpawnedAt,
                                    actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                                }), H.item.eventId && (P.push(H.item.eventId), await yr(e, t, [H.item.eventId]).catch(xi => {
                                    se("[runner] stale idle-compact markDone failed (will retry at drain end)", {
                                        sessionKey: t,
                                        eventId: H.item.eventId,
                                        error: xi instanceof Error ? xi.message : String(xi)
                                    })
                                })), H.event.ts && (A = H.event.ts);
                                continue
                            }
                            Vt = !0
                        } else {
                            let xi = "ℹ️ /compact is only available in interactive sessions.",
                                er = await Ja(e, t, {
                                    item: H.item,
                                    event: H.event,
                                    outputText: xi,
                                    sdkSessionId: ye
                                });
                            ae.push(...er.records), er.primaryRecord && (Y = er.primaryRecord.id, G = er.primaryRecord, W = xi), H.item.eventId && (P.push(H.item.eventId), await yr(e, t, [H.item.eventId]).catch(Hs => {
                                se("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: H.item.eventId,
                                    error: Hs instanceof Error ? Hs.message : String(Hs)
                                })
                            })), H.event.ts && (A = H.event.ts);
                            continue
                        } if (!Vt) {
                        let xi = n.sdk ?? createAgentSdkAdapter(),
                            er = await z8e({
                                paths: e,
                                sessionKey: t,
                                sdk: xi,
                                sessionInfo: {
                                    ...ue,
                                    sessionId: ye
                                },
                                cmdToken: Sr,
                                cmdArgs: Xt
                            }),
                            Hs = await Ja(e, t, {
                                item: H.item,
                                event: H.event,
                                outputText: er,
                                sdkSessionId: ye
                            });
                        ae.push(...Hs.records), Hs.primaryRecord && (Y = Hs.primaryRecord.id, G = Hs.primaryRecord, W = er);
                        let ci = await At(e, t);
                        if (ci && (ue.sessionId = ci.sdk_session_id, ue.pendingUndo = ci.pending_undo, ye = ci.sdk_session_id), H.item.eventId && (P.push(H.item.eventId), await yr(e, t, [H.item.eventId]).catch(Vs => {
                                se("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: H.item.eventId,
                                    error: Vs instanceof Error ? Vs.message : String(Vs)
                                })
                            })), H.event.ts && (A = H.event.ts), ci?.pending_undo && !ci.sdk_session_id) {
                            K("[runner] pending_undo set during drain — bailing batch to let next drain materialize fork", {
                                sessionKey: t,
                                pending_undo: ci.pending_undo
                            });
                            break
                        }
                        continue
                    }
                }
                let dt = fe,
                    kn = n.resume === !1 || dt || Ne ? void 0 : ye,
                    Z = ki(afe(e, t, H.event.session_key ?? t, n.onExecutionEvent)),
                    he = is(H.event.payload) ? H.event.payload : void 0,
                    Ae = he ? QU(he) : void 0,
                    V = applyJobSdkConfigOverride(await Bi(m, "effective_config_ms", async () => Uz(e, H.event)), n.jobContext?.sdkConfig),
                    it = aa(t) === "channel",
                    Tt = H.event.type === "channel.message",
                    Q = (V?.time_gap_minutes ?? rfe) * 60 * 1e3,
                    ee = !M && Q > 0 && it && Tt && A ? {
                        lastEventAt: A,
                        currentEventAt: H.event.ts ?? new Date().toISOString(),
                        thresholdMs: Q
                    } : void 0,
                    ge, Rt = H.prompt;
                if (H.event.type === "job.spawn" && n.jobContext) {
                    let mt = is(he?.tick) ? he.tick : void 0;
                    if (mt) {
                        let Rn = mt.run_number,
                            us = mt.triggered_at,
                            tt = mt.previous_run_at;
                        typeof Rn == "number" && typeof us == "string" && (ge = {
                            run_number: Rn,
                            triggered_at: us,
                            previous_run_at: typeof tt == "string" ? tt : null,
                            cron: n.jobContext.cron
                        })
                    }
                    ge && (Rt = _8e)
                }
                let $t = !yt && ze ? ze : void 0,
                    Ft = (V?.auto_compact_idle_minutes ?? 0) > 0 && !xe && F ? F : void 0,
                    _t = !T && Qn ? Qn : void 0,
                    xn = !Sn || !U || !L || !!ee || !!ge || !!$t || !!Ft || !!_t ? buildTransientUserBlocks(Rt, {
                        gatewayNotice: Sn ? void 0 : ot,
                        interruptedContext: U ? void 0 : Se,
                        skipRewind: L ? void 0 : Xe,
                        isUserMessage: Tt,
                        timeGap: ee,
                        jobTick: ge,
                        daemonRestartHint: $t,
                        compactNotice: Ft,
                        boardUpdated: _t
                    }, ue) : {
                        blocks: [{
                            type: "text",
                            text: Rt,
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
                M = M || xn.timeGapInjected, xn.compactNoticeInjected && (xe = !0), !yt && xn.daemonRestartHintInjected && (yt = !0, et && await lt(e, t, {
                    last_seen_daemon_started_at: et
                }).catch(() => {})), !T && xn.boardUpdatedInjected && (T = !0, y && await lt(e, t, {
                    last_seen_board_hash: y
                }).catch(() => {}));
                let Hi = buildSystemPromptForChannelConfig(V, t, n.jobContext ? {
                        content: n.jobContext.content,
                        jobId: n.jobContext.jobId,
                        cron: n.jobContext.cron,
                        stateless: n.jobContext.stateless
                    } : void 0, n.memoryBoard),
                    gr = efe(n, V),
                    qs, wr = Date.now(),
                    Bm = n.onStream ? (mt, Rn) => n.onStream(mt, Rn, H.event.id) : void 0;
                try {
                    qs = await Qde(e, t, R, {
                        prompt: xn.blocks,
                        runtime: n.runtime,
                        abortController: n.abortController,
                        onStream: Bm,
                        onExecutionEvent: Z,
                        onTurnAcknowledged: n.onSdkTurnStarted,
                        onTurnRejected: n.onSdkTurnRejected,
                        sessionId: kn,
                        forkFrom: dt,
                        model: n.jobContext?.model ?? ue.model,
                        effort: ue.effort,
                        cwd: ue.cwd,
                        settingSources: ue.settingSources,
                        persistSession: n.persistSession,
                        permissionMode: gr.permissionMode,
                        allowedTools: gr.allowedTools,
                        disallowedTools: gr.disallowedTools,
                        tools: gr.tools,
                        mcpServers: n.mcpServers,
                        mcpServersFactory: n.mcpServersFactory,
                        holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
                        additionalDirectories: gr.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: Hde(n.runtime, n.memoryBoard, gr.additionalDirectories, e.memoryDir),
                        boardHash: n.boardHash,
                        attachments: Ae,
                        systemPrompt: Hi
                    })
                } catch (mt) {
                    if (isAgentSdkTurnInterruptedError(mt)) {
                        await We(xn), H.item.eventId && P.push(H.item.eventId), z = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(mt)) {
                        z = !0;
                        break
                    }
                    if (KU(mt)) {
                        H.item.eventId && P.push(H.item.eventId), await Je(H.prompt, xn.interruptedContextInjected), z = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: H,
                        error: mt,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : ue.model
                        },
                        precedingRecords: ae,
                        bus: n.bus
                    }), mt
                }
                let jn = qs.sdkResult;
                if (n.runtime === "codex" && !jn.skipped && await Zde(e, t, jn.turnStartedAt) && (jn.skipped = !0), c += Date.now() - wr, jn.sessionId && (d = jn.sessionId), _(jn.usage), typeof jn.firstTokenLatencyMs == "number" && (JU(m, "sdk_ttft_ms_total", jn.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await Je(H.prompt, xn.interruptedContextInjected), z = !0, H.item.eventId && P.push(H.item.eventId);
                    break
                }
                if (await We(xn), !jn.skipped && !Vt) {
                    let mt = Gde(H.event, jn),
                        Rn = await Bi(m, "outbox_emit_ms", async () => Ja(e, t, {
                            item: H.item,
                            event: H.event,
                            outputText: mt,
                            sdkSessionId: jn.sessionId,
                            attachments: qs.outboundAttachments,
                            turnMeta: v()
                        }));
                    ae.push(...Rn.records), Rn.primaryRecord && (W = Rn.primaryRecord.payload.text, Y = Rn.primaryRecord.id, G = Rn.primaryRecord)
                } else Vt ? K("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: H.event.id
                }) : (j = !0, K("[runner] Skip called — suppressing outbox", {
                    sessionKey: t,
                    eventId: H.event.id
                }), H.item.eventId && await yr(e, t, [H.item.eventId]).catch(mt => {
                    se("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
                        sessionKey: t,
                        eventId: H.item.eventId,
                        error: String(mt)
                    })
                }));
                let Bs = H.event.source?.name === "idle-compact";
                if (at) {
                    let mt = at;
                    if (at = void 0, zt = {
                            hadBoundary: !0,
                            history_pre: mt.pre_tokens,
                            history_post: mt.post_tokens,
                            origin: Bs ? "idle-compact" : mt.trigger
                        }, mt.trigger === "manual" && !Bs) {
                        let Rn = N8e(mt),
                            us = await Ja(e, t, {
                                item: H.item,
                                event: H.event,
                                outputText: Rn,
                                sdkSessionId: jn.sessionId ?? ye
                            });
                        ae.push(...us.records), us.primaryRecord && (W = Rn, Y = us.primaryRecord.id, G = us.primaryRecord)
                    } else K("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: H.event.id,
                        trigger: mt.trigger,
                        idleCompact: Bs,
                        pre_tokens: mt.pre_tokens,
                        post_tokens: mt.post_tokens
                    })
                } else if (Vt)
                    if (zt = {
                            hadBoundary: !1,
                            origin: Bs ? "idle-compact" : "manual"
                        }, Bs) K("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: H.event.id
                    });
                    else {
                        let mt = "ℹ️ Nothing to compact.",
                            Rn = await Ja(e, t, {
                                item: H.item,
                                event: H.event,
                                outputText: mt,
                                sdkSessionId: jn.sessionId ?? ye
                            });
                        ae.push(...Rn.records), Rn.primaryRecord && (W = mt, Y = Rn.primaryRecord.id, G = Rn.primaryRecord)
                    } if (H.item.eventId && P.push(H.item.eventId), jn.usedFallback && jn.resumeError) {
                    let mt = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: H.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: ue.sessionId,
                            error: jn.resumeError
                        }
                    });
                    await atomicAppendEvent(e, mt)
                }
                await Bi(m, "session_upsert_ms", async () => {
                    let mt = {
                        cwd: ue.cwd,
                        plane: ue.plane,
                        permission_profile: ue.permissionProfile,
                        last_event_id: H.event.id,
                        last_event_at: H.event.ts
                    };
                    p?.context_used_tokens !== void 0 && (mt.context_used_tokens = p.context_used_tokens);
                    let Rn = ZU(H.event.payload, "idle_ms"),
                        us = ZU(H.event.payload, "threshold_at_fire");
                    if (zt) {
                        X = !0;
                        let tt = H.event.ts ?? new Date().toISOString(),
                            Sr = await Kde(e, t, Ce?.compact_stats?.measured_at),
                            Xt = Yde({
                                completion: zt,
                                preTotal: Ce?.context_used_tokens,
                                postTotal: p?.context_used_tokens,
                                idleMs: Rn,
                                thresholdAtFire: us,
                                measuredAt: tt,
                                sessionKey: t,
                                gapCounts: Sr
                            });
                        mt.last_compact_at = tt, mt.compact_stats = Xt, f = Xt
                    }
                    jn.sessionId && !Ne && (mt.sdk_session_id = jn.sessionId), dt && (mt.pending_fork_to = null), await lt(e, t, mt)
                }), zt?.origin === "idle-compact" && await M8e(e, {
                    sessionKey: t,
                    preTokens: Ce?.context_used_tokens,
                    postTokens: p?.context_used_tokens,
                    idleMs: ZU(H.event.payload, "idle_ms")
                }), dt && (fe = void 0), jn.sessionId && !Ne && (ye = jn.sessionId), H.event.ts && (A = H.event.ts)
            }
        }
        return await Bi(m, "mailbox_finalize_ms", async () => {
            if (await yr(e, t, P), P.length > 0 || C > 0) {
                let ye = `processed=${P.length} skipped=${C}${Y?` outbox=${Y}`:""}`;
                await Oa(e, t, ye)
            }
        }), await b({
            cancelled: z,
            processedCount: P.length,
            skippedCount: C,
            replyText: W
        }), {
            processed: P.length,
            skipped: C,
            lockAcquired: !0,
            cancelled: z,
            turnSkipped: j,
            compacted: X,
            lastReplyText: W,
            lastOutboxId: Y,
            lastOutboxRecord: G,
            outboxRecords: ae
        }
    } finally {
        clearInterval(o), await qU(e, r)
    }
}
