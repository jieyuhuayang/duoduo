// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: Nhe, daemon.pretty.js:62309)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = yo(t);
    if (!(await Kme(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let o = n.lockHeartbeatIntervalMs ?? 3e4,
        s = setInterval(async () => {
            try {
                await Yme(e, r)
            } catch {}
        }, o);
    s.unref?.(), Yi("drain_started", t, {
        sessionKey: t
    });
    let a = Date.now(),
        l = 0,
        u = 0,
        c = 0,
        d, p, f, m = {},
        h = n.getStreamGeneration?.();

    function y(b) {
        if (b) {
            if (!p) {
                p = {
                    ...b
                };
                return
            }
            p.input_tokens = (p.input_tokens ?? 0) + (b.input_tokens ?? 0), p.output_tokens = (p.output_tokens ?? 0) + (b.output_tokens ?? 0), p.cache_creation_input_tokens = (p.cache_creation_input_tokens ?? 0) + (b.cache_creation_input_tokens ?? 0), p.cache_read_input_tokens = (p.cache_read_input_tokens ?? 0) + (b.cache_read_input_tokens ?? 0), p.total_cost_usd = (p.total_cost_usd ?? 0) + (b.total_cost_usd ?? 0), !p.protocol && b.protocol && (p.protocol = b.protocol), !p.model && b.model && (p.model = b.model), b.context_used_tokens !== void 0 && (p.context_used_tokens = b.context_used_tokens)
        }
    }
    async function _(b) {
        try {
            let I = n.getStreamGeneration?.(),
                S = D1(p, h !== void 0 && I !== void 0 && I !== h);
            await appendDrainRecord(e, {
                id: $he.randomUUID(),
                session_key: t,
                sdk_session_id: d,
                drain_started_at: new Date(a).toISOString(),
                drain_duration_ms: Date.now() - a,
                sdk_duration_ms: l,
                events_processed: b.processedCount,
                events_skipped: b.skippedCount,
                tool_calls: u,
                tool_errors: c,
                output_chars: b.replyText?.length ?? 0,
                cancelled: b.cancelled,
                usage: p,
                perf: Object.keys(m).length > 0 ? m : void 0,
                compact: f,
                suspected_in_process_break: S ? !0 : void 0
            })
        } catch {}
    }
    let k = {
        input_tokens: 0,
        cache_read: 0,
        cache_create: 0,
        output_tokens: 0,
        total_cost_usd: 0
    };

    function v() {
        if (!p) return;
        let b = p.input_tokens ?? 0,
            I = p.cache_read_input_tokens ?? 0,
            T = p.cache_creation_input_tokens ?? 0,
            S = p.output_tokens ?? 0,
            w = p.total_cost_usd ?? 0,
            C = dhe({
                protocol: p.protocol,
                input_tokens: b - k.input_tokens,
                cache_read_input_tokens: I - k.cache_read,
                cache_creation_input_tokens: T - k.cache_create
            }),
            O = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: p.input_tokens === void 0 ? void 0 : C.totalInput,
                cache_hit_rate: fhe(C),
                output_tokens: p.output_tokens === void 0 ? void 0 : S - k.output_tokens,
                total_cost_usd: p.total_cost_usd === void 0 ? void 0 : w - k.total_cost_usd,
                model: p.model,
                context_used_tokens: p.context_used_tokens,
                protocol: p.protocol
            };
        return k = {
            input_tokens: b,
            cache_read: I,
            cache_create: T,
            output_tokens: S,
            total_cost_usd: w
        }, O
    }
    try {
        try {
            await co(m, "mailbox_merge_ms", async () => Gx(e, t))
        } catch (N) {
            if (Pte(N)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw N
        }
        let b = await co(m, "mailbox_parse_ms", async () => zy(e, t));
        if (b.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (b.some(N => !N.eventId)) {
            let N = await Ote(e, t);
            if (N.removed > 0) {
                await Ka(e, t, `orphan_cleanup=${N.removed}`);
                let U = await zy(e, t);
                if (U.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                b = U
            }
        }
        await co(m, "mailbox_render_ms", async () => Kx(e, t, b));
        let T = n.batchSize ?? aet,
            S = n.mergeWindowMs ?? uet,
            w = n.sdk ?? createAgentSdkAdapter();
        await ah(e), await uh(e);
        let C = await batchDrainItems(e, b, {
                fallbackBatchSize: T,
                mergeWindowMs: S,
                perf: m
            }),
            O = C.items,
            A = [],
            x = 0,
            P = !1,
            M = !1,
            j, H, J, ee = [],
            ie = await co(m, "session_state_ms", async () => It(e, t)),
            re = Wb(e, t, ie ?? void 0),
            Ye = n.jobContext?.stateless === !0;
        if (re.forkFrom && (n.runtime !== "codex" || Ye) && (re.forkFrom = void 0, await Es(e, t, "pending_fork_to").catch(() => {})), await Het(e, t, {
                snapshotModel: ie?.model,
                snapshotModelRuntime: ie?.model_runtime,
                activeRuntime: n.runtime ?? "claude",
                sessionInfo: re
            }), ie?.pending_model_fork && await Vet(e, t, {
                snapshotModel: ie.model,
                runtime: n.runtime,
                statelessJob: Ye,
                sessionInfo: re
            }), re.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)) {
            let N = re.pendingUndo;
            try {
                let {
                    sessionId: U
                } = await set(N.from, {
                    upToMessageId: N.upToMessageUuid
                });
                await ut(e, t, {
                    sdk_session_id: U,
                    pending_undo: null
                }), re.sessionId = U, re.pendingUndo = void 0, K("[runner] pending_undo materialized via forkSession", {
                    sessionKey: t,
                    from: N.from,
                    upToMessageUuid: N.upToMessageUuid,
                    forkedSessionId: U
                }), n.bus?.emit("session.streaming_invalidated", {
                    sessionKey: t,
                    reason: "fork"
                })
            } catch (U) {
                let D = U instanceof Error ? U.message.split(`
`)[0] : String(U);
                return Z("[runner] pending_undo forkSession failed; LEAVING pending_undo set for retry, aborting drain", {
                    sessionKey: t,
                    from: N.from,
                    upToMessageUuid: N.upToMessageUuid,
                    error: D
                }), await ut(e, t, {
                    last_error: {
                        message: `pending_undo forkSession failed: ${D}`,
                        at: new Date().toISOString()
                    }
                }).catch(() => {}), await H2(e, t), {
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
        } else re.pendingUndo && n.runtime !== "claude" && (re.pendingUndo = void 0, await Es(e, t, "pending_undo").catch(() => {}));
        let je = ie?.pending_gateway_notice,
            Se = ie?.pending_interrupted_context,
            lt = ie?.pending_skip_rewind,
            Fe = !1,
            qe = !1,
            F = !1,
            L = !1,
            B = _et(ie),
            te = !1,
            Le = ghe({
                currentDaemonStartedAt: J2,
                sessionKey: t,
                lastEventAt: ie?.last_event_at,
                lastSeenDaemonStartedAt: ie?.last_seen_daemon_started_at
            });
        Le.writeLastSeenAtEntry && await ut(e, t, {
            last_seen_daemon_started_at: Le.writeLastSeenAtEntry
        }).catch(() => {});
        let Re = Le.inject ? {
                startedAt: J2
            } : void 0,
            We = Le.writeLastSeenOnInjectSuccess,
            Be = !1,
            X = rs(t) === "channel" ? n.boardHash : void 0,
            Q = bhe({
                currentBoardHash: X,
                lastSeenBoardHash: ie?.last_seen_board_hash
            });
        Q.writeLastSeenAtEntry && await ut(e, t, {
            last_seen_board_hash: Q.writeLastSeenAtEntry
        }).catch(() => {});
        let fe = Q.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            ve = Q.writeLastSeenOnInjectSuccess,
            me = !1,
            tt = ie?.last_event_at,
            Yt = !1,
            St = [],
            Qn, Ze;
        for (let N of O) {
            if (!N.eventId) {
                x += 1;
                continue
            }
            let U = N.eventId;
            if (n.excludeEventIds?.has(U)) {
                x += 1;
                continue
            }
            let D = await co(m, "outbox_lookup_ms", async () => Lp(e, U));
            if (D) {
                A.push(U), j = D.payload.text, H = D.id;
                continue
            }
            let ne = C.events.get(U) ?? await co(m, "event_read_ms", async () => readEventByIdSeek(e, U));
            if (!ne) {
                x += 1;
                continue
            }
            St.push({
                item: N,
                event: ne,
                prompt: t4(ne, t)
            })
        }
        if (n.onBatchContext && St.length > 0) {
            let N = 0;
            for (let D of St)
                if (D.event.type === "route.deliver") {
                    let ne = Eo(D.event.payload) ? D.event.payload : void 0,
                        Oe = Eo(ne?.payload) ? ne.payload : void 0,
                        bt = typeof Oe?.notify_depth == "number" ? Oe.notify_depth : 0;
                    bt > N && (N = bt)
                } let U = St.map(D => D.item.eventId).filter(D => !!D);
            n.onBatchContext({
                maxNotifyDepth: N,
                eventIds: U
            })
        }
        let it = Wet(re.cwd);
        if (St.length > 0 && it) {
            let N = Jet(t, re.cwd, it);
            if (rs(t) === "channel") {
                for (let U of St) {
                    if (U.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: U,
                            error: new Error(N),
                            stage: "workspace_unavailable",
                            userText: N,
                            payloadExtra: {
                                outcome: "workspace_unavailable",
                                cwd: re.cwd,
                                reason: it
                            },
                            bus: n.bus
                        }), U.item.eventId && A.push(U.item.eventId);
                        continue
                    }
                    let D = await fl(e, t, {
                        item: U.item,
                        event: U.event,
                        outputText: N,
                        sdkSessionId: re.sessionId
                    });
                    ee.push(...D.records), D.primaryRecord && (j = D.primaryRecord.payload.text, H = D.primaryRecord.id, J = D.primaryRecord), U.item.eventId && A.push(U.item.eventId)
                }
                return await Ir(e, t, A), await Ka(e, t, `processed=${A.length} skipped=${x} workspace_unavailable=true`), {
                    processed: A.length,
                    skipped: x,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: j,
                    lastOutboxId: H,
                    lastOutboxRecord: J,
                    outboxRecords: ee
                }
            }
            throw await handleDrainError(e, t, {
                anchor: St[0],
                error: new Error(N),
                stage: "workspace_unavailable",
                userText: N,
                payloadExtra: {
                    outcome: "workspace_unavailable",
                    cwd: re.cwd,
                    reason: it
                },
                precedingRecords: ee,
                bus: n.bus
            }), new Error(N)
        }
        let sn = n.runtime ?? "claude",
            qi = n.runtimeUnavailableReason ?? (n.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (St.length > 0 && qi) {
            let N = Zet(qi, sn);
            if (rs(t) === "channel") {
                for (let D of St) {
                    if (D.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: D,
                            error: new Error(N),
                            stage: "runtime_unavailable",
                            userText: N,
                            payloadExtra: {
                                outcome: "runtime_unavailable",
                                runtime: sn,
                                runtime_source: n.runtime ? "explicit" : "default"
                            },
                            bus: n.bus
                        }), D.item.eventId && A.push(D.item.eventId);
                        continue
                    }
                    let ne = await fl(e, t, {
                        item: D.item,
                        event: D.event,
                        outputText: N,
                        sdkSessionId: re.sessionId
                    });
                    ee.push(...ne.records), ne.primaryRecord && (j = ne.primaryRecord.payload.text, H = ne.primaryRecord.id, J = ne.primaryRecord), D.item.eventId && A.push(D.item.eventId)
                }
                return await Ir(e, t, A), await Ka(e, t, `processed=${A.length} skipped=${x} runtime_unavailable=${sn}`), {
                    processed: A.length,
                    skipped: x,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: j,
                    lastOutboxId: H,
                    lastOutboxRecord: J,
                    outboxRecords: ee
                }
            }
            throw await handleDrainError(e, t, {
                anchor: St[0],
                error: new Error(N),
                stage: "runtime_unavailable",
                userText: N,
                payloadExtra: {
                    outcome: "runtime_unavailable",
                    runtime: sn,
                    runtime_source: n.runtime ? "explicit" : "default"
                },
                precedingRecords: ee,
                bus: n.bus
            }), new Error(N)
        }
        let xi = N => async U => {
            if (U.type === "system" && U.subtype === "init" && U.data && typeof U.data.session_id == "string" && (Qn = U.data.session_id, re.sessionId && Qn !== re.sessionId && Z("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: re.sessionId,
                    actualSessionId: Qn
                })), U.type === "system" && U.subtype === "compact_boundary" && U.data && typeof U.data == "object") {
                let D = U.data,
                    ne = D.trigger;
                (ne === "manual" || ne === "auto") && (Ze = {
                    trigger: ne,
                    pre_tokens: typeof D.pre_tokens == "number" ? D.pre_tokens : void 0,
                    post_tokens: typeof D.post_tokens == "number" ? D.post_tokens : void 0
                })
            }
            return U.type === "tool_use" ? u += 1 : U.type === "tool_result" && U.isError && (c += 1), N(U)
        }, g = async () => {
            let N = Qn ?? re.sessionId;
            !N || n.skipSessionIdUpdate || Ye || await ut(e, t, {
                sdk_session_id: N
            })
        }, E = async (N, U) => {
            await g(), !(await It(e, t))?.pending_skip_rewind && await Ret(e, t, xet(N, U ? Se : void 0))
        }, z = async N => {
            N.gatewayNoticeInjected && !Fe && (await Eet(e, t), Fe = !0), N.interruptedContextInjected && !qe && (await Tet(e, t), qe = !0), N.skipRewindInjected && !F && (await Iet(e, t), F = !0)
        };
        if (Cet(St, t)) {
            let N = await Q2(e, t, n, St, re, {
                    pendingGatewayNotice: je,
                    pendingInterruptedContext: Se,
                    pendingSkipRewind: lt,
                    lastEventAtWatermark: tt,
                    timeGapConsumed: L,
                    daemonRestartHint: Be ? void 0 : Re,
                    compactNotice: te ? void 0 : B,
                    boardUpdated: me ? void 0 : fe
                }, m, xi),
                {
                    anchor: U,
                    resumeSessionId: D,
                    forkFromSessionId: ne,
                    handleExecutionEvent: Oe,
                    attachments: bt,
                    batchEventIds: ye,
                    coalescedPromptText: Ft,
                    injectionResult: Xe,
                    systemPrompt: mt,
                    sdkRunConfig: _e
                } = N,
                kt = await xhe(e, t, {
                    runtime: n.runtime,
                    model: n.jobContext?.model ?? re.model,
                    cwd: re.cwd,
                    effective: N.anchorChannelConfig,
                    jobOverlay: n.jobContext?.sdkConfig
                }, {
                    anchor: U,
                    precedingRecords: ee,
                    bus: n.bus
                }),
                Ee = ne,
                hn = Ee ? void 0 : D;
            L = N.timeGapConsumed, !Be && N.injectionResult.daemonRestartHintInjected && (Be = !0, We && await ut(e, t, {
                last_seen_daemon_started_at: We
            }).catch(() => {})), !me && N.injectionResult.boardUpdatedInjected && (me = !0, ve && await ut(e, t, {
                last_seen_board_hash: ve
            }).catch(() => {})), Yi("sdk_start", U.event.id, {
                eventIds: ye,
                coalesced: St.length > 1
            });
            let Xt = Date.now(),
                Mn;
            try {
                let He = N.isNotifyOnly || N.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (cn, nn) => n.onStream(cn, nn, U.event.id);
                Mn = await Ohe(e, t, w, {
                    prompt: Xe.blocks,
                    runtime: n.runtime,
                    usesStreamingAdapter: n.usesStreamingAdapter,
                    abortController: n.abortController,
                    onStream: He,
                    onExecutionEvent: Oe,
                    onTurnAcknowledged: n.onSdkTurnStarted,
                    onTurnRejected: n.onSdkTurnRejected,
                    sessionId: hn,
                    forkFrom: Ee,
                    model: kt.effectiveModel ?? n.jobContext?.model ?? re.model,
                    claudeContextRequirement: kt.requirement,
                    claudeModelAliases: kt.aliases,
                    claudeSettingsPath: kt.settingsPath,
                    effort: re.effort,
                    cwd: re.cwd,
                    settingSources: re.settingSources,
                    persistSession: n.persistSession,
                    permissionMode: _e.permissionMode,
                    allowedTools: _e.allowedTools,
                    disallowedTools: _e.disallowedTools,
                    tools: _e.tools,
                    mcpServers: n.mcpServers,
                    mcpServersFactory: n.mcpServersFactory,
                    holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
                    additionalDirectories: _e.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: khe(n.runtime, n.memoryBoard, _e.additionalDirectories, e.memoryDir),
                    boardHash: n.boardHash,
                    attachments: bt,
                    systemPrompt: mt
                })
            } catch (Te) {
                if (isAgentSdkTurnInterruptedError(Te)) {
                    await z(Xe);
                    for (let He of St) He.item.eventId && A.push(He.item.eventId);
                    return await Ir(e, t, A), await Ka(e, t, `processed=${A.length} skipped=${x} cancelled=true`), await _({
                        cancelled: !0,
                        processedCount: A.length,
                        skippedCount: x,
                        replyText: j
                    }), {
                        processed: A.length,
                        skipped: x,
                        lockAcquired: !0,
                        cancelled: !0,
                        lastReplyText: j,
                        lastOutboxId: H,
                        lastOutboxRecord: J,
                        outboxRecords: ee
                    }
                }
                if (isAgentSdkPromptNotAcceptedAbortError(Te)) return await Ir(e, t, A), await Ka(e, t, `processed=${A.length} skipped=${x} cancelled=true`), await _({
                    cancelled: !0,
                    processedCount: A.length,
                    skippedCount: x,
                    replyText: j
                }), {
                    processed: A.length,
                    skipped: x,
                    lockAcquired: !0,
                    cancelled: !0,
                    lastReplyText: j,
                    lastOutboxId: H,
                    lastOutboxRecord: J,
                    outboxRecords: ee
                };
                if (X2(Te)) {
                    for (let He of St) He.item.eventId && A.push(He.item.eventId);
                    return await E(Ft, Xe.interruptedContextInjected), await Ir(e, t, A), await Ka(e, t, `processed=${A.length} skipped=${x} cancelled=true`), await _({
                        cancelled: !0,
                        processedCount: A.length,
                        skippedCount: x,
                        replyText: j
                    }), {
                        processed: A.length,
                        skipped: x,
                        lockAcquired: !0,
                        cancelled: !0,
                        lastReplyText: j,
                        lastOutboxId: H,
                        lastOutboxRecord: J,
                        outboxRecords: ee
                    }
                }
                throw await handleDrainError(e, t, {
                    anchor: U,
                    error: Te,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : re.model
                    },
                    precedingRecords: ee,
                    bus: n.bus
                }), Te
            }
            let Ht = Mn.sdkResult;
            if (l += Date.now() - Xt, (n.runtime === "codex" || n.runtime === "grok") && !Ht.skipped && await Rhe(e, t, Ht.turnStartedAt) && (Ht.skipped = !0), Ht.sessionId && (d = Ht.sessionId), y(Ht.usage), typeof Ht.firstTokenLatencyMs == "number" && (G2(m, "sdk_ttft_ms_total", Ht.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), Yi("sdk_end", U.event.id, {
                    eventIds: ye,
                    sdkDurationMs: Date.now() - Xt,
                    usedFallback: Ht.usedFallback
                }), n.abortController?.signal.aborted) {
                await E(Ft, Xe.interruptedContextInjected);
                for (let Te of St) Te.item.eventId && A.push(Te.item.eventId);
                return await Ir(e, t, A), await Ka(e, t, `processed=${A.length} skipped=${x} cancelled=true`), await _({
                    cancelled: !0,
                    processedCount: A.length,
                    skippedCount: x,
                    replyText: j
                }), {
                    processed: A.length,
                    skipped: x,
                    lockAcquired: !0,
                    cancelled: !0,
                    lastReplyText: j,
                    lastOutboxId: H,
                    lastOutboxRecord: J,
                    outboxRecords: ee
                }
            }
            if (await z(Xe), Ht.skipped) P = !0, K("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: U.event.id
            });
            else {
                let Te = Ihe(U.event, Ht),
                    He = await co(m, "outbox_emit_ms", async () => fl(e, t, {
                        item: U.item,
                        event: U.event,
                        outputText: Te,
                        sdkSessionId: Ht.sessionId,
                        batchedEventIds: St.map(cn => cn.event.id),
                        attachments: Mn.outboundAttachments,
                        turnMeta: v()
                    }));
                if (ee.push(...He.records), He.primaryRecord) {
                    Yi("outbox_written", U.event.id, {
                        outboxId: He.primaryRecord.id,
                        eventIds: ye
                    }), j = He.primaryRecord.payload.text, H = He.primaryRecord.id, J = He.primaryRecord;
                    for (let cn of St.slice(0, -1)) cn.item.eventId && await I1(e, cn.item.eventId, He.primaryRecord)
                }
            }
            for (let Te of St) Te.item.eventId && A.push(Te.item.eventId);
            if (Ht.skipped) {
                let Te = St.map(He => He.item.eventId).filter(He => !!He);
                Te.length > 0 && await Ir(e, t, Te).catch(He => {
                    Z("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
                        sessionKey: t,
                        error: String(He)
                    })
                })
            }
            if (Ht.usedFallback && Ht.resumeError) {
                let Te = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: U.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: re.sessionId,
                        error: Ht.resumeError
                    }
                });
                await atomicAppendEvent(e, Te)
            }
            await co(m, "session_upsert_ms", async () => {
                let Te = {
                    cwd: re.cwd,
                    plane: re.plane,
                    permission_profile: re.permissionProfile,
                    last_event_id: U.event.id,
                    last_event_at: U.event.ts
                };
                if (p?.context_used_tokens !== void 0 && (Te.context_used_tokens = p.context_used_tokens), Ze) {
                    let He = Ze;
                    Ze = void 0, M = !0;
                    let cn = U.event.ts ?? new Date().toISOString(),
                        nn = await Phe(e, t, ie?.compact_stats?.measured_at),
                        Wn = Che({
                            completion: {
                                hadBoundary: !0,
                                history_pre: He.pre_tokens,
                                history_post: He.post_tokens,
                                origin: He.trigger
                            },
                            preTotal: ie?.context_used_tokens,
                            postTotal: p?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: cn,
                            sessionKey: t,
                            gapCounts: nn
                        });
                    Te.last_compact_at = cn, Te.compact_stats = Wn, f = Wn, K("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: U.event.id,
                        trigger: He.trigger,
                        pre_tokens: He.pre_tokens,
                        post_tokens: He.post_tokens
                    })
                }
                Ht.sessionId && !Ye && (Te.sdk_session_id = Ht.sessionId), Ee && (Te.pending_fork_to = null), await ut(e, t, Te)
            }), U.event.ts && (tt = U.event.ts)
        } else {
            let N = n.resume === !1 || Ye ? void 0 : re.sessionId,
                U = n.resume === !1 || n.runtime !== "codex" || Ye ? void 0 : re.forkFrom;
            for (let D of St) {
                let ne = !1,
                    Oe;
                if (D.event.routing_hint?.intent === "history-control") {
                    let ce = Eo(D.event.payload) ? D.event.payload : void 0,
                        De = (ce?.text ?? ce?.command ?? "").trim(),
                        at = /^(\S+)(?:\s+(.*))?$/.exec(De),
                        yn = at?.[1]?.toLowerCase() ?? "",
                        ai = at?.[2]?.trim() ?? "";
                    if (yn === "/compact" && D.event.source?.name === "idle-compact" && Let(D.event.ts, {
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        })) {
                        K("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey: t,
                            eventId: D.event.id,
                            itemTs: D.event.ts,
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        }), D.item.eventId && (A.push(D.item.eventId), await Ir(e, t, [D.item.eventId]).catch(br => {
                            Z("[runner] stale idle-compact markDone failed (will retry at drain end)", {
                                sessionKey: t,
                                eventId: D.item.eventId,
                                error: br instanceof Error ? br.message : String(br)
                            })
                        })), D.event.ts && (tt = D.event.ts);
                        continue
                    }
                    if (yn === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (rs(t) === "channel") ne = !0;
                        else {
                            let br = "ℹ️ /compact is only available in interactive sessions.",
                                _n = await fl(e, t, {
                                    item: D.item,
                                    event: D.event,
                                    outputText: br,
                                    sdkSessionId: N
                                });
                            ee.push(..._n.records), _n.primaryRecord && (H = _n.primaryRecord.id, J = _n.primaryRecord, j = br), D.item.eventId && (A.push(D.item.eventId), await Ir(e, t, [D.item.eventId]).catch(Dr => {
                                Z("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: D.item.eventId,
                                    error: Dr instanceof Error ? Dr.message : String(Dr)
                                })
                            })), D.event.ts && (tt = D.event.ts);
                            continue
                        } if (!ne) {
                        let br = n.sdk ?? createAgentSdkAdapter(),
                            _n = await qet({
                                paths: e,
                                sessionKey: t,
                                sdk: br,
                                sessionInfo: {
                                    ...re,
                                    sessionId: N
                                },
                                cmdToken: yn,
                                cmdArgs: ai
                            });
                        if (!(yn === "/compact" && D.event.source?.name === "idle-compact")) {
                            let Bi = await fl(e, t, {
                                item: D.item,
                                event: D.event,
                                outputText: _n,
                                sdkSessionId: N
                            });
                            ee.push(...Bi.records), Bi.primaryRecord && (H = Bi.primaryRecord.id, J = Bi.primaryRecord, j = _n)
                        }
                        let ir = await It(e, t);
                        if (ir && (re.sessionId = ir.sdk_session_id, re.pendingUndo = ir.pending_undo, N = ir.sdk_session_id), D.item.eventId && (A.push(D.item.eventId), await Ir(e, t, [D.item.eventId]).catch(Bi => {
                                Z("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: D.item.eventId,
                                    error: Bi instanceof Error ? Bi.message : String(Bi)
                                })
                            })), D.event.ts && (tt = D.event.ts), ir?.pending_undo && !ir.sdk_session_id) {
                            K("[runner] pending_undo set during drain — bailing batch to let next drain materialize fork", {
                                sessionKey: t,
                                pending_undo: ir.pending_undo
                            });
                            break
                        }
                        continue
                    }
                }
                let bt = xi(zhe(e, t, D.event.session_key ?? t, n.onExecutionEvent)),
                    ye = Eo(D.event.payload) ? D.event.payload : void 0,
                    Ft = ye ? e4(ye) : void 0,
                    Xe = applyJobSdkConfigOverride(await co(m, "effective_config_ms", async () => IU(e, D.event)), n.jobContext?.sdkConfig),
                    mt = await xhe(e, t, {
                        runtime: n.runtime,
                        model: n.jobContext?.model ?? re.model,
                        cwd: re.cwd,
                        effective: Xe,
                        jobOverlay: n.jobContext?.sdkConfig
                    }, {
                        anchor: D,
                        precedingRecords: ee,
                        bus: n.bus
                    }),
                    _e = U,
                    kt = n.resume === !1 || _e || Ye ? void 0 : N,
                    Ee = rs(t) === "channel",
                    hn = D.event.type === "channel.message",
                    Mn = (Xe?.time_gap_minutes ?? Mhe) * 60 * 1e3,
                    Ht = !L && Mn > 0 && Ee && hn && tt ? {
                        lastEventAt: tt,
                        currentEventAt: D.event.ts ?? new Date().toISOString(),
                        thresholdMs: Mn
                    } : void 0,
                    Te, He = D.prompt;
                if (D.event.type === "job.spawn" && n.jobContext) {
                    let ce = Eo(ye?.tick) ? ye.tick : void 0;
                    if (ce) {
                        let ke = ce.run_number,
                            De = ce.triggered_at,
                            at = ce.previous_run_at;
                        typeof ke == "number" && typeof De == "string" && (Te = {
                            run_number: ke,
                            triggered_at: De,
                            previous_run_at: typeof at == "string" ? at : null,
                            cron: n.jobContext.cron
                        })
                    }
                    Te && (He = wet)
                }
                let cn = !Be && Re ? Re : void 0,
                    Wn = (Xe?.auto_compact_idle_minutes ?? 0) > 0 && !te && B ? B : void 0,
                    Jn = !me && fe ? fe : void 0,
                    Hr = !Fe || !qe || !F || !!Ht || !!Te || !!cn || !!Wn || !!Jn ? buildTransientUserBlocks(He, {
                        gatewayNotice: Fe ? void 0 : je,
                        interruptedContext: qe ? void 0 : Se,
                        skipRewind: F ? void 0 : lt,
                        isUserMessage: hn,
                        timeGap: Ht,
                        jobTick: Te,
                        daemonRestartHint: cn,
                        compactNotice: Wn,
                        boardUpdated: Jn
                    }, re) : {
                        blocks: [{
                            type: "text",
                            text: He,
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
                L = L || Hr.timeGapInjected, Hr.compactNoticeInjected && (te = !0), !Be && Hr.daemonRestartHintInjected && (Be = !0, We && await ut(e, t, {
                    last_seen_daemon_started_at: We
                }).catch(() => {})), !me && Hr.boardUpdatedInjected && (me = !0, ve && await ut(e, t, {
                    last_seen_board_hash: ve
                }).catch(() => {}));
                let we = buildSystemPromptForChannelConfig(Xe, t, n.jobContext ? {
                        content: n.jobContext.content,
                        jobId: n.jobContext.jobId,
                        cron: n.jobContext.cron,
                        stateless: n.jobContext.stateless
                    } : void 0, n.memoryBoard),
                    se = Ahe(n, Xe),
                    $e, Y = Date.now(),
                    Ot = n.onStream ? (ce, ke) => n.onStream(ce, ke, D.event.id) : void 0;
                try {
                    $e = await Ohe(e, t, w, {
                        prompt: Hr.blocks,
                        runtime: n.runtime,
                        usesStreamingAdapter: n.usesStreamingAdapter,
                        abortController: n.abortController,
                        onStream: Ot,
                        onExecutionEvent: bt,
                        onTurnAcknowledged: n.onSdkTurnStarted,
                        onTurnRejected: n.onSdkTurnRejected,
                        sessionId: kt,
                        forkFrom: _e,
                        model: mt.effectiveModel ?? n.jobContext?.model ?? re.model,
                        claudeContextRequirement: mt.requirement,
                        claudeModelAliases: mt.aliases,
                        claudeSettingsPath: mt.settingsPath,
                        effort: re.effort,
                        cwd: re.cwd,
                        settingSources: re.settingSources,
                        persistSession: n.persistSession,
                        permissionMode: se.permissionMode,
                        allowedTools: se.allowedTools,
                        disallowedTools: se.disallowedTools,
                        tools: se.tools,
                        mcpServers: n.mcpServers,
                        mcpServersFactory: n.mcpServersFactory,
                        holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
                        additionalDirectories: se.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: khe(n.runtime, n.memoryBoard, se.additionalDirectories, e.memoryDir),
                        boardHash: n.boardHash,
                        attachments: Ft,
                        systemPrompt: we
                    })
                } catch (ce) {
                    if (isAgentSdkTurnInterruptedError(ce)) {
                        await z(Hr), D.item.eventId && A.push(D.item.eventId), Yt = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(ce)) {
                        Yt = !0;
                        break
                    }
                    if (X2(ce)) {
                        D.item.eventId && A.push(D.item.eventId), await E(D.prompt, Hr.interruptedContextInjected), Yt = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: D,
                        error: ce,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : re.model
                        },
                        precedingRecords: ee,
                        bus: n.bus
                    }), ce
                }
                let yt = $e.sdkResult;
                if ((n.runtime === "codex" || n.runtime === "grok") && !yt.skipped && await Rhe(e, t, yt.turnStartedAt) && (yt.skipped = !0), l += Date.now() - Y, yt.sessionId && (d = yt.sessionId), y(yt.usage), typeof yt.firstTokenLatencyMs == "number" && (G2(m, "sdk_ttft_ms_total", yt.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await E(D.prompt, Hr.interruptedContextInjected), Yt = !0, D.item.eventId && A.push(D.item.eventId);
                    break
                }
                if (await z(Hr), !yt.skipped && !ne) {
                    let ce = Ihe(D.event, yt),
                        ke = await co(m, "outbox_emit_ms", async () => fl(e, t, {
                            item: D.item,
                            event: D.event,
                            outputText: ce,
                            sdkSessionId: yt.sessionId,
                            attachments: $e.outboundAttachments,
                            turnMeta: v()
                        }));
                    ee.push(...ke.records), ke.primaryRecord && (j = ke.primaryRecord.payload.text, H = ke.primaryRecord.id, J = ke.primaryRecord)
                } else ne ? K("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: D.event.id
                }) : (P = !0, K("[runner] Skip called — suppressing outbox", {
                    sessionKey: t,
                    eventId: D.event.id
                }), D.item.eventId && await Ir(e, t, [D.item.eventId]).catch(ce => {
                    Z("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
                        sessionKey: t,
                        eventId: D.item.eventId,
                        error: String(ce)
                    })
                }));
                let gn = D.event.source?.name === "idle-compact";
                if (Ze) {
                    let ce = Ze;
                    if (Ze = void 0, Oe = {
                            hadBoundary: !0,
                            history_pre: ce.pre_tokens,
                            history_post: ce.post_tokens,
                            origin: gn ? "idle-compact" : ce.trigger
                        }, ce.trigger === "manual" && !gn) {
                        let ke = jet(ce),
                            De = await fl(e, t, {
                                item: D.item,
                                event: D.event,
                                outputText: ke,
                                sdkSessionId: yt.sessionId ?? N
                            });
                        ee.push(...De.records), De.primaryRecord && (j = ke, H = De.primaryRecord.id, J = De.primaryRecord)
                    } else K("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: D.event.id,
                        trigger: ce.trigger,
                        idleCompact: gn,
                        pre_tokens: ce.pre_tokens,
                        post_tokens: ce.post_tokens
                    })
                } else if (ne)
                    if (Oe = {
                            hadBoundary: !1,
                            origin: gn ? "idle-compact" : "manual"
                        }, gn) K("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: D.event.id
                    });
                    else {
                        let ce = "ℹ️ Nothing to compact.",
                            ke = await fl(e, t, {
                                item: D.item,
                                event: D.event,
                                outputText: ce,
                                sdkSessionId: yt.sessionId ?? N
                            });
                        ee.push(...ke.records), ke.primaryRecord && (j = ce, H = ke.primaryRecord.id, J = ke.primaryRecord)
                    } if (D.item.eventId && A.push(D.item.eventId), yt.usedFallback && yt.resumeError) {
                    let ce = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: D.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: re.sessionId,
                            error: yt.resumeError
                        }
                    });
                    await atomicAppendEvent(e, ce)
                }
                await co(m, "session_upsert_ms", async () => {
                    let ce = {
                        cwd: re.cwd,
                        plane: re.plane,
                        permission_profile: re.permissionProfile,
                        last_event_id: D.event.id,
                        last_event_at: D.event.ts
                    };
                    p?.context_used_tokens !== void 0 && (ce.context_used_tokens = p.context_used_tokens);
                    let ke = Z2(D.event.payload, "idle_ms"),
                        De = Z2(D.event.payload, "threshold_at_fire");
                    if (Oe) {
                        M = !0;
                        let at = D.event.ts ?? new Date().toISOString(),
                            yn = await Phe(e, t, ie?.compact_stats?.measured_at),
                            ai = Che({
                                completion: Oe,
                                preTotal: ie?.context_used_tokens,
                                postTotal: p?.context_used_tokens,
                                idleMs: ke,
                                thresholdAtFire: De,
                                measuredAt: at,
                                sessionKey: t,
                                gapCounts: yn
                            });
                        ce.last_compact_at = at, ce.compact_stats = ai, f = ai
                    }
                    yt.sessionId && !Ye && (ce.sdk_session_id = yt.sessionId), _e && (ce.pending_fork_to = null), await ut(e, t, ce)
                }), Oe?.origin === "idle-compact" && await Uet(e, {
                    sessionKey: t,
                    preTokens: ie?.context_used_tokens,
                    postTokens: p?.context_used_tokens,
                    idleMs: Z2(D.event.payload, "idle_ms")
                }), _e && (U = void 0), yt.sessionId && !Ye && (N = yt.sessionId), D.event.ts && (tt = D.event.ts)
            }
        }
        return await co(m, "mailbox_finalize_ms", async () => {
            if (await Ir(e, t, A), A.length > 0 || x > 0) {
                let N = `processed=${A.length} skipped=${x}${H?` outbox=${H}`:""}`;
                await Ka(e, t, N)
            }
        }), await _({
            cancelled: Yt,
            processedCount: A.length,
            skippedCount: x,
            replyText: j
        }), {
            processed: A.length,
            skipped: x,
            lockAcquired: !0,
            cancelled: Yt,
            turnSkipped: P,
            compacted: M,
            lastReplyText: j,
            lastOutboxId: H,
            lastOutboxRecord: J,
            outboxRecords: ee
        }
    } finally {
        clearInterval(s), await H2(e, r)
    }
}
