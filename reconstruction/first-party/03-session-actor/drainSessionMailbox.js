// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: Gye, daemon.pretty.js:63874)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = uo(t);
    if (!(await _ye(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let o = n.lockHeartbeatIntervalMs ?? 3e4,
        s = setInterval(async () => {
            try {
                await bye(e, r)
            } catch {}
        }, o);
    s.unref?.(), Bi("drain_started", t, {
        sessionKey: t
    });
    let a = Date.now(),
        l = 0,
        u = 0,
        c = 0,
        d, p, f, m = {},
        h = n.getStreamGeneration?.();

    function g(b) {
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
    async function y(b) {
        try {
            let R = n.getStreamGeneration?.(),
                T = wL(p, h !== void 0 && R !== void 0 && R !== h);
            await appendDrainRecord(e, {
                id: Hye.randomUUID(),
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
                suspected_in_process_break: T ? !0 : void 0
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
        let b = p.input_tokens ?? 0,
            R = p.cache_read_input_tokens ?? 0,
            I = p.cache_creation_input_tokens ?? 0,
            T = p.output_tokens ?? 0,
            x = p.total_cost_usd ?? 0,
            S = Eye({
                protocol: p.protocol,
                input_tokens: b - w.input_tokens,
                cache_read_input_tokens: R - w.cache_read,
                cache_creation_input_tokens: I - w.cache_create
            }),
            O = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: p.input_tokens === void 0 ? void 0 : S.totalInput,
                cache_hit_rate: Rye(S),
                output_tokens: p.output_tokens === void 0 ? void 0 : T - w.output_tokens,
                total_cost_usd: p.total_cost_usd === void 0 ? void 0 : x - w.total_cost_usd,
                model: p.model,
                context_used_tokens: p.context_used_tokens,
                protocol: p.protocol
            };
        return w = {
            input_tokens: b,
            cache_read: R,
            cache_create: I,
            output_tokens: T,
            total_cost_usd: x
        }, O
    }
    try {
        try {
            await to(m, "mailbox_merge_ms", async () => EE(e, t))
        } catch (Ie) {
            if (Vne(Ie)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw Ie
        }
        let b = await to(m, "mailbox_parse_ms", async () => Jy(e, t));
        if (b.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (b.some(Ie => !Ie.eventId)) {
            let Ie = await Jne(e, t);
            if (Ie.removed > 0) {
                await Gy(e, t, `orphan_cleanup=${Ie.removed}`);
                let oe = await Jy(e, t);
                if (oe.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                b = oe
            }
        }
        await to(m, "mailbox_render_ms", async () => RE(e, t, b));
        let I = n.batchSize ?? sB,
            T = n.mergeWindowMs ?? aB,
            x = n.sdk ?? createAgentSdkAdapter(),
            S = await batchDrainItems(e, b, {
                fallbackBatchSize: I,
                mergeWindowMs: T,
                perf: m
            }),
            O = S.items,
            $ = [],
            C = 0,
            A = !1,
            j = [],
            P = !1,
            z, U, K, te = [],
            V = async (Ie, oe) => {
                Ie.length !== 0 && await co(e, t, Ie).catch(ne => {
                    J("[runner] eager markDone failed (will retry at drain end)", {
                        sessionKey: t,
                        stage: oe,
                        eventIds: Ie,
                        error: ne instanceof Error ? ne.message : String(ne)
                    })
                })
            }, re = (Ie, oe) => {
                Ie && (z = oe ?? Ie.payload.text, U = Ie.id, K = Ie)
            }, X = async () => (await co(e, t, $), await Gy(e, t, `processed=${$.length} skipped=${C} cancelled=true`), await y({
                cancelled: !0,
                processedCount: $.length,
                skippedCount: C,
                replyText: z
            }), {
                processed: $.length,
                skipped: C,
                lockAcquired: !0,
                cancelled: !0,
                lastReplyText: z,
                lastOutboxId: U,
                lastOutboxRecord: K,
                outboxRecords: te
            }), L = await to(m, "session_state_ms", async () => ut(e, t)), ie = hh(e, t, L ?? void 0), fe = n.jobContext?.stateless === !0;
        ie.forkFrom && (n.runtime !== "codex" || fe) && (ie.forkFrom = void 0, await Es(e, t, "pending_fork_to").catch(() => {})), await xit(e, t, {
            snapshotModel: L?.model,
            snapshotModelRuntime: L?.model_runtime,
            activeRuntime: n.runtime ?? "claude",
            sessionInfo: ie
        }), L?.pending_model_fork && await Eit(e, t, {
            snapshotModel: L.model,
            runtime: n.runtime,
            statelessJob: fe,
            sessionInfo: ie
        });
        let _e = L?.pending_gateway_notice,
            D = L?.pending_interrupted_context,
            B = L?.pending_skip_rewind,
            F = !1,
            W = !1,
            ye = !1,
            ge = !1,
            Be = Zrt(L),
            _ = !1,
            k = Dme({
                currentDaemonStartedAt: tB,
                sessionKey: t,
                lastEventAt: L?.last_event_at,
                lastSeenDaemonStartedAt: L?.last_seen_daemon_started_at
            });
        k.writeLastSeenAtEntry && await Ye(e, t, {
            last_seen_daemon_started_at: k.writeLastSeenAtEntry
        }).catch(() => {});
        let M = k.inject ? {
                startedAt: tB
            } : void 0,
            Y = k.writeLastSeenOnInjectSuccess,
            q = !1,
            se = no(t) === "channel" ? n.boardHash : void 0,
            ve = Cye({
                currentBoardHash: se,
                lastSeenBoardHash: L?.last_seen_board_hash
            });
        ve.writeLastSeenAtEntry && await Ye(e, t, {
            last_seen_board_hash: ve.writeLastSeenAtEntry
        }).catch(() => {});
        let Se = ve.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            He = ve.writeLastSeenOnInjectSuccess,
            it = !1,
            pt = L?.last_event_at,
            Ae = !1,
            bt = [],
            Ne, we;
        for (let Ie of O) {
            if (!Ie.eventId) {
                C += 1;
                continue
            }
            let oe = Ie.eventId;
            if (n.excludeEventIds?.has(oe)) {
                C += 1;
                continue
            }
            let ne = await to(m, "outbox_lookup_ms", async () => Yp(e, oe));
            if (ne) {
                $.push(oe), z = ne.payload.text, U = ne.id;
                continue
            }
            let Ht = Ie.createdAt ? {
                    notAfter: Ie.createdAt
                } : void 0,
                Lt = S.events.get(oe) ?? await to(m, "event_read_ms", async () => td(e, oe, Ht));
            if (!Lt) {
                J(`[runner] mailbox event unresolved: session_key=${t} event_id=${oe} not_after=${Ht?.notAfter??"none"} item_file=${Ie.file??"none"}`), C += 1;
                continue
            }
            bt.push({
                item: Ie,
                event: Lt,
                prompt: cB(Lt, t)
            })
        }
        if (n.onBatchContext && bt.length > 0) {
            let Ie = 0;
            for (let ne of bt)
                if (ne.event.type === "route.deliver") {
                    let Ht = Oi(ne.event.payload) ? ne.event.payload : void 0,
                        Lt = Oi(Ht?.payload) ? Ht.payload : void 0,
                        Ct = typeof Lt?.notify_depth == "number" ? Lt.notify_depth : 0;
                    Ct > Ie && (Ie = Ct)
                } let oe = bt.map(ne => ne.item.eventId).filter(ne => !!ne);
            n.onBatchContext({
                maxNotifyDepth: Ie,
                eventIds: oe
            })
        }
        let Xe = async Ie => {
            let {
                guidance: oe,
                stage: ne,
                payloadExtra: Ht,
                noteSuffix: Lt
            } = Ie;
            if (no(t) === "channel") {
                for (let Ct of bt) {
                    if (Ct.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: Ct,
                            error: new Error(oe),
                            stage: ne,
                            userText: oe,
                            payloadExtra: Ht,
                            bus: n.bus
                        }), Ct.item.eventId && $.push(Ct.item.eventId);
                        continue
                    }
                    let Yt = await Xu(e, t, {
                        item: Ct.item,
                        event: Ct.event,
                        outputText: oe,
                        sdkSessionId: ie.sessionId
                    });
                    te.push(...Yt.records), re(Yt.primaryRecord), Ct.item.eventId && $.push(Ct.item.eventId)
                }
                return await co(e, t, $), await Gy(e, t, `processed=${$.length} skipped=${C} ${Lt}`), {
                    processed: $.length,
                    skipped: C,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: z,
                    lastOutboxId: U,
                    lastOutboxRecord: K,
                    outboxRecords: te
                }
            }
            throw await handleDrainError(e, t, {
                anchor: bt[0],
                error: new Error(oe),
                stage: ne,
                userText: oe,
                payloadExtra: Ht,
                precedingRecords: te,
                bus: n.bus
            }), new Error(oe)
        }, Pt = {
            runtime: n.runtime,
            usesStreamingAdapter: n.usesStreamingAdapter,
            abortController: n.abortController,
            onTurnAcknowledged: n.onSdkTurnStarted,
            onTurnRejected: n.onSdkTurnRejected,
            effort: ie.effort,
            cwd: ie.cwd,
            settingSources: ie.settingSources,
            persistSession: n.persistSession,
            mcpServers: n.mcpServers,
            mcpServersFactory: n.mcpServersFactory,
            holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
            boardHash: n.boardHash
        }, nr = Rit(ie.cwd);
        if (bt.length > 0 && nr) return Xe({
            guidance: Tit(t, ie.cwd, nr),
            stage: "workspace_unavailable",
            payloadExtra: {
                outcome: "workspace_unavailable",
                cwd: ie.cwd,
                reason: nr
            },
            noteSuffix: "workspace_unavailable=true"
        });
        let Hs = n.runtime ?? "claude",
            wr = n.runtimeUnavailableReason ?? (n.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (bt.length > 0 && wr) return Xe({
            guidance: Iit(wr, Hs),
            stage: "runtime_unavailable",
            payloadExtra: {
                outcome: "runtime_unavailable",
                runtime: Hs,
                runtime_source: n.runtime ? "explicit" : "default"
            },
            noteSuffix: `runtime_unavailable=${Hs}`
        });
        let ro = Ie => async oe => {
            if (oe.type === "system" && oe.subtype === "init" && oe.data && typeof oe.data.session_id == "string" && (Ne = oe.data.session_id, ie.sessionId && Ne !== ie.sessionId && J("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: ie.sessionId,
                    actualSessionId: Ne
                })), oe.type === "system" && oe.subtype === "compact_boundary" && oe.data && typeof oe.data == "object") {
                let ne = oe.data,
                    Ht = ne.trigger;
                (Ht === "manual" || Ht === "auto") && (we = {
                    trigger: Ht,
                    pre_tokens: typeof ne.pre_tokens == "number" ? ne.pre_tokens : void 0,
                    post_tokens: typeof ne.post_tokens == "number" ? ne.post_tokens : void 0
                })
            }
            return oe.type === "tool_use" ? u += 1 : oe.type === "tool_result" && oe.isError && (c += 1), Ie(oe)
        }, Dt = async () => {
            let Ie = Ne ?? ie.sessionId;
            !Ie || n.skipSessionIdUpdate || fe || await Ye(e, t, {
                sdk_session_id: Ie
            })
        }, Bt = async (Ie, oe) => {
            await Dt(), !(await ut(e, t))?.pending_skip_rewind && await nit(e, t, eit(Ie, oe ? D : void 0))
        }, qn = async Ie => {
            Ie.gatewayNoticeInjected && !F && (await tit(e, t), F = !0), Ie.interruptedContextInjected && !W && (await rit(e, t), W = !0), Ie.skipRewindInjected && !ye && (await iit(e, t), ye = !0)
        };
        if (ait(bt, t)) {
            let Ie = await lB(e, t, n, bt, ie, {
                    pendingGatewayNotice: _e,
                    pendingInterruptedContext: D,
                    pendingSkipRewind: B,
                    lastEventAtWatermark: pt,
                    timeGapConsumed: ge,
                    daemonRestartHint: q ? void 0 : M,
                    compactNotice: _ ? void 0 : Be,
                    boardUpdated: it ? void 0 : Se
                }, m, ro),
                {
                    anchor: oe,
                    resumeSessionId: ne,
                    forkFromSessionId: Ht,
                    handleExecutionEvent: Lt,
                    attachments: Ct,
                    batchEventIds: Yt,
                    coalescedPromptText: vt,
                    injectionResult: ct,
                    systemPrompt: Je,
                    sdkRunConfig: on
                } = Ie,
                dr = await Dye(e, t, {
                    runtime: n.runtime,
                    model: n.jobContext?.model ?? ie.model,
                    cwd: ie.cwd,
                    effective: Ie.anchorChannelConfig,
                    jobOverlay: n.jobContext?.sdkConfig
                }, {
                    anchor: oe,
                    precedingRecords: te,
                    bus: n.bus
                });
            ge = Ie.timeGapConsumed, !q && Ie.injectionResult.daemonRestartHintInjected && (q = !0, Y && await Ye(e, t, {
                last_seen_daemon_started_at: Y
            }).catch(() => {})), !it && Ie.injectionResult.boardUpdatedInjected && (it = !0, He && await Ye(e, t, {
                last_seen_board_hash: He
            }).catch(() => {})), Bi("sdk_start", oe.event.id, {
                eventIds: Yt,
                coalesced: bt.length > 1
            });
            let Sr = Date.now(),
                We;
            try {
                let mt = Ie.isNotifyOnly || Ie.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (Mr, pn) => n.onStream(Mr, pn, oe.event.id);
                j.push({
                    anchorEventId: oe.event.id,
                    skipped: !1
                }), We = await Bye(e, t, x, {
                    ...Pt,
                    prompt: ct.blocks,
                    onStream: mt,
                    anchorEventId: oe.event.id,
                    onExecutionEvent: Lt,
                    sessionId: ne,
                    forkFrom: Ht,
                    model: dr.effectiveModel ?? n.jobContext?.model ?? ie.model,
                    claudeContextRequirement: dr.requirement,
                    claudeModelAliases: dr.aliases,
                    claudeSettingsPath: dr.settingsPath,
                    permissionMode: on.permissionMode,
                    allowedTools: on.allowedTools,
                    disallowedTools: on.disallowedTools,
                    tools: on.tools,
                    additionalDirectories: on.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: Nye(n.runtime, n.memoryBoard, on.additionalDirectories, e.memoryDir),
                    attachments: Ct,
                    systemPrompt: Je
                })
            } catch (De) {
                if (isAgentSdkTurnInterruptedError(De)) {
                    await qn(ct);
                    for (let mt of bt) mt.item.eventId && $.push(mt.item.eventId);
                    return X()
                }
                if (isAgentSdkPromptNotAcceptedAbortError(De)) return X();
                if (isAbortLikeError(De)) {
                    for (let mt of bt) mt.item.eventId && $.push(mt.item.eventId);
                    return await Bt(vt, ct.interruptedContextInjected), X()
                }
                throw await handleDrainError(e, t, {
                    anchor: oe,
                    error: De,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : ie.model
                    },
                    precedingRecords: te,
                    bus: n.bus
                }), De
            }
            let at = We.sdkResult;
            if (l += Date.now() - Sr, await jye(e, t, n.runtime, at), at.sessionId && (d = at.sessionId), g(at.usage), typeof at.firstTokenLatencyMs == "number" && (rB(m, "sdk_ttft_ms_total", at.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), Bi("sdk_end", oe.event.id, {
                    eventIds: Yt,
                    sdkDurationMs: Date.now() - Sr,
                    usedFallback: at.usedFallback
                }), n.abortController?.signal.aborted) {
                await Bt(vt, ct.interruptedContextInjected);
                for (let De of bt) De.item.eventId && $.push(De.item.eventId);
                return X()
            }
            if (await qn(ct), at.skipped) A = !0, j[j.length - 1].skipped = !0, Q("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: oe.event.id
            });
            else {
                let De = zye(oe.event, at),
                    mt = await to(m, "outbox_emit_ms", async () => Xu(e, t, {
                        item: oe.item,
                        event: oe.event,
                        outputText: De,
                        sdkSessionId: at.sessionId,
                        batchedEventIds: bt.map(Mr => Mr.event.id),
                        attachments: We.outboundAttachments,
                        turnMeta: v()
                    }));
                if (te.push(...mt.records), mt.primaryRecord) {
                    Bi("outbox_written", oe.event.id, {
                        outboxId: mt.primaryRecord.id,
                        eventIds: Yt
                    }), re(mt.primaryRecord);
                    for (let Mr of bt.slice(0, -1)) Mr.item.eventId && await mL(e, Mr.item.eventId, mt.primaryRecord)
                }
            }
            for (let De of bt) De.item.eventId && $.push(De.item.eventId);
            if (at.skipped) {
                let De = bt.map(mt => mt.item.eventId).filter(mt => !!mt);
                await V(De, "skip-turn")
            }
            if (at.usedFallback && at.resumeError) {
                let De = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: oe.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: ie.sessionId,
                        error: at.resumeError
                    }
                });
                await atomicAppendEvent(e, De)
            }
            await to(m, "session_upsert_ms", async () => {
                let De = {
                    cwd: ie.cwd,
                    plane: ie.plane,
                    permission_profile: ie.permissionProfile,
                    last_event_id: oe.event.id,
                    last_event_at: oe.event.ts
                };
                if (p?.context_used_tokens !== void 0 && (De.context_used_tokens = p.context_used_tokens), we) {
                    let mt = we;
                    we = void 0, P = !0;
                    let Mr = oe.event.ts ?? new Date().toISOString(),
                        pn = await Uye(e, t, L?.compact_stats?.measured_at),
                        Mi = qye({
                            completion: {
                                hadBoundary: !0,
                                history_pre: mt.pre_tokens,
                                history_post: mt.post_tokens,
                                origin: mt.trigger
                            },
                            preTotal: L?.context_used_tokens,
                            postTotal: p?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: Mr,
                            sessionKey: t,
                            gapCounts: pn
                        });
                    De.last_compact_at = Mr, De.compact_stats = Mi, f = Mi, Q("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: oe.event.id,
                        trigger: mt.trigger,
                        pre_tokens: mt.pre_tokens,
                        post_tokens: mt.post_tokens
                    })
                }
                at.sessionId && !fe && (De.sdk_session_id = at.sessionId), Ht && (De.pending_fork_to = null), await Ye(e, t, De)
            }), oe.event.ts && (pt = oe.event.ts)
        } else {
            let Ie = n.resume === !1 || fe ? void 0 : ie.sessionId,
                oe = n.resume === !1 || n.runtime !== "codex" || fe ? void 0 : ie.forkFrom;
            for (let ne of bt) {
                let Ht = !1,
                    Lt;
                if (ne.event.routing_hint?.intent === "history-control") {
                    let Ge = Oi(ne.event.payload) ? ne.event.payload : void 0,
                        ln = (Ge?.text ?? Ge?.command ?? "").trim(),
                        Tr = /^(\S+)/.exec(ln)?.[1]?.toLowerCase() ?? "";
                    if (Tr === "/compact" && ne.event.source?.name === "idle-compact" && _it(ne.event.ts, {
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        })) {
                        Q("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey: t,
                            eventId: ne.event.id,
                            itemTs: ne.event.ts,
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        }), ne.item.eventId && ($.push(ne.item.eventId), await V([ne.item.eventId], "stale-idle-compact")), ne.event.ts && (pt = ne.event.ts);
                        continue
                    }
                    if (Tr === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (no(t) === "channel") Ht = !0;
                        else {
                            let yi = "ℹ️ /compact is only available in interactive sessions.",
                                Vs = await Xu(e, t, {
                                    item: ne.item,
                                    event: ne.event,
                                    outputText: yi,
                                    sdkSessionId: Ie
                                });
                            te.push(...Vs.records), re(Vs.primaryRecord, yi), ne.item.eventId && ($.push(ne.item.eventId), await co(e, t, [ne.item.eventId]).catch(rr => {
                                J("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: ne.item.eventId,
                                    error: rr instanceof Error ? rr.message : String(rr)
                                })
                            })), ne.event.ts && (pt = ne.event.ts);
                            continue
                        } if (!Ht) {
                        let yi = await Sit({
                            paths: e,
                            sessionKey: t,
                            sdk: x,
                            sessionInfo: {
                                ...ie,
                                sessionId: Ie
                            },
                            cmdToken: Tr
                        });
                        if (!(Tr === "/compact" && ne.event.source?.name === "idle-compact")) {
                            let rr = await Xu(e, t, {
                                item: ne.item,
                                event: ne.event,
                                outputText: yi,
                                sdkSessionId: Ie
                            });
                            te.push(...rr.records), re(rr.primaryRecord, yi)
                        }
                        ne.item.eventId && ($.push(ne.item.eventId), await V([ne.item.eventId], "history-control")), ne.event.ts && (pt = ne.event.ts);
                        continue
                    }
                }
                let Ct = ro(n_e(e, t, ne.event.session_key ?? t, n.onExecutionEvent, ne.event.id)),
                    Yt = Oi(ne.event.payload) ? ne.event.payload : void 0,
                    vt = uB(ne.event.payload),
                    ct = applyJobSdkConfigOverride(await to(m, "effective_config_ms", async () => A2(e, ne.event)), n.jobContext?.sdkConfig),
                    Je = await Dye(e, t, {
                        runtime: n.runtime,
                        model: n.jobContext?.model ?? ie.model,
                        cwd: ie.cwd,
                        effective: ct,
                        jobOverlay: n.jobContext?.sdkConfig
                    }, {
                        anchor: ne,
                        precedingRecords: te,
                        bus: n.bus
                    }),
                    on = oe,
                    dr = n.resume === !1 || on || fe ? void 0 : Ie,
                    Sr = ne.event.type === "channel.message",
                    We = Yye({
                        consumed: ge,
                        timeGapMinutes: ct?.time_gap_minutes,
                        isChannelSession: no(t) === "channel",
                        isUserMessage: Sr,
                        lastEventAt: pt,
                        currentEventAt: ne.event.ts
                    }),
                    at, De = ne.prompt;
                if (ne.event.type === "job.spawn" && n.jobContext) {
                    let Ge = Oi(Yt?.tick) ? Yt.tick : void 0;
                    if (Ge) {
                        let nt = Ge.run_number,
                            ln = Ge.triggered_at,
                            Tr = Ge.previous_run_at;
                        typeof nt == "number" && typeof ln == "string" && (at = {
                            run_number: nt,
                            triggered_at: ln,
                            previous_run_at: typeof Tr == "string" ? Tr : null,
                            cron: n.jobContext.cron
                        })
                    }
                    at && (De = Xrt)
                }
                let mt = !q && M ? M : void 0,
                    pn = (ct?.auto_compact_idle_minutes ?? 0) > 0 && !_ && Be ? Be : void 0,
                    mn = buildTransientUserBlocks(De, {
                        gatewayNotice: F ? void 0 : _e,
                        interruptedContext: W ? void 0 : D,
                        skipRewind: ye ? void 0 : B,
                        isUserMessage: Sr,
                        timeGap: We,
                        jobTick: at,
                        daemonRestartHint: mt,
                        compactNotice: pn,
                        boardUpdated: !it && Se ? Se : void 0
                    }, ie);
                ge = ge || mn.timeGapInjected, mn.compactNoticeInjected && (_ = !0), !q && mn.daemonRestartHintInjected && (q = !0, Y && await Ye(e, t, {
                    last_seen_daemon_started_at: Y
                }).catch(() => {})), !it && mn.boardUpdatedInjected && (it = !0, He && await Ye(e, t, {
                    last_seen_board_hash: He
                }).catch(() => {}));
                let $a = buildSystemPromptForChannelConfig(ct, t, Wye(n.jobContext), n.memoryBoard, n.runtime),
                    gi = Jye(n, ct),
                    xo, lf = Date.now(),
                    Sl = n.onStream ? (Ge, nt) => n.onStream(Ge, nt, ne.event.id) : void 0;
                j.push({
                    anchorEventId: ne.event.id,
                    skipped: !1
                });
                try {
                    xo = await Bye(e, t, x, {
                        ...Pt,
                        prompt: mn.blocks,
                        onStream: Sl,
                        anchorEventId: ne.event.id,
                        onExecutionEvent: Ct,
                        sessionId: dr,
                        forkFrom: on,
                        model: Je.effectiveModel ?? n.jobContext?.model ?? ie.model,
                        claudeContextRequirement: Je.requirement,
                        claudeModelAliases: Je.aliases,
                        claudeSettingsPath: Je.settingsPath,
                        permissionMode: gi.permissionMode,
                        allowedTools: gi.allowedTools,
                        disallowedTools: gi.disallowedTools,
                        tools: gi.tools,
                        additionalDirectories: gi.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: Nye(n.runtime, n.memoryBoard, gi.additionalDirectories, e.memoryDir),
                        attachments: vt,
                        systemPrompt: $a
                    })
                } catch (Ge) {
                    if (isAgentSdkTurnInterruptedError(Ge)) {
                        await qn(mn), ne.item.eventId && $.push(ne.item.eventId), Ae = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(Ge)) {
                        Ae = !0;
                        break
                    }
                    if (isAbortLikeError(Ge)) {
                        ne.item.eventId && $.push(ne.item.eventId), await Bt(ne.prompt, mn.interruptedContextInjected), Ae = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: ne,
                        error: Ge,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : ie.model
                        },
                        precedingRecords: te,
                        bus: n.bus
                    }), Ge
                }
                let Gn = xo.sdkResult;
                if (await jye(e, t, n.runtime, Gn), l += Date.now() - lf, Gn.sessionId && (d = Gn.sessionId), g(Gn.usage), typeof Gn.firstTokenLatencyMs == "number" && (rB(m, "sdk_ttft_ms_total", Gn.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await Bt(ne.prompt, mn.interruptedContextInjected), Ae = !0, ne.item.eventId && $.push(ne.item.eventId);
                    break
                }
                if (await qn(mn), !Gn.skipped && !Ht) {
                    let Ge = zye(ne.event, Gn),
                        nt = await to(m, "outbox_emit_ms", async () => Xu(e, t, {
                            item: ne.item,
                            event: ne.event,
                            outputText: Ge,
                            sdkSessionId: Gn.sessionId,
                            attachments: xo.outboundAttachments,
                            turnMeta: v()
                        }));
                    te.push(...nt.records), re(nt.primaryRecord)
                } else Ht ? Q("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: ne.event.id
                }) : (A = !0, j[j.length - 1].skipped = !0, Q("[runner] Skip called — suppressing outbox", {
                    sessionKey: t,
                    eventId: ne.event.id
                }), ne.item.eventId && await V([ne.item.eventId], "skip-turn"));
                let lt = ne.event.source?.name === "idle-compact";
                if (we) {
                    let Ge = we;
                    if (we = void 0, Lt = {
                            hadBoundary: !0,
                            history_pre: Ge.pre_tokens,
                            history_post: Ge.post_tokens,
                            origin: lt ? "idle-compact" : Ge.trigger
                        }, Ge.trigger === "manual" && !lt) {
                        let nt = yit(Ge),
                            ln = await Xu(e, t, {
                                item: ne.item,
                                event: ne.event,
                                outputText: nt,
                                sdkSessionId: Gn.sessionId ?? Ie
                            });
                        te.push(...ln.records), re(ln.primaryRecord, nt)
                    } else Q("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: ne.event.id,
                        trigger: Ge.trigger,
                        idleCompact: lt,
                        pre_tokens: Ge.pre_tokens,
                        post_tokens: Ge.post_tokens
                    })
                } else if (Ht)
                    if (Lt = {
                            hadBoundary: !1,
                            origin: lt ? "idle-compact" : "manual"
                        }, lt) Q("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: ne.event.id
                    });
                    else {
                        let Ge = "ℹ️ Nothing to compact.",
                            nt = await Xu(e, t, {
                                item: ne.item,
                                event: ne.event,
                                outputText: Ge,
                                sdkSessionId: Gn.sessionId ?? Ie
                            });
                        te.push(...nt.records), re(nt.primaryRecord, Ge)
                    } if (ne.item.eventId && $.push(ne.item.eventId), Gn.usedFallback && Gn.resumeError) {
                    let Ge = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: ne.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: ie.sessionId,
                            error: Gn.resumeError
                        }
                    });
                    await atomicAppendEvent(e, Ge)
                }
                await to(m, "session_upsert_ms", async () => {
                    let Ge = {
                        cwd: ie.cwd,
                        plane: ie.plane,
                        permission_profile: ie.permissionProfile,
                        last_event_id: ne.event.id,
                        last_event_at: ne.event.ts
                    };
                    p?.context_used_tokens !== void 0 && (Ge.context_used_tokens = p.context_used_tokens);
                    let nt = nB(ne.event.payload, "idle_ms"),
                        ln = nB(ne.event.payload, "threshold_at_fire");
                    if (Lt) {
                        P = !0;
                        let Tr = ne.event.ts ?? new Date().toISOString(),
                            Eo = await Uye(e, t, L?.compact_stats?.measured_at),
                            yi = qye({
                                completion: Lt,
                                preTotal: L?.context_used_tokens,
                                postTotal: p?.context_used_tokens,
                                idleMs: nt,
                                thresholdAtFire: ln,
                                measuredAt: Tr,
                                sessionKey: t,
                                gapCounts: Eo
                            });
                        Ge.last_compact_at = Tr, Ge.compact_stats = yi, f = yi
                    }
                    Gn.sessionId && !fe && (Ge.sdk_session_id = Gn.sessionId), on && (Ge.pending_fork_to = null), await Ye(e, t, Ge)
                }), Lt?.origin === "idle-compact" && await wit(e, {
                    sessionKey: t,
                    preTokens: L?.context_used_tokens,
                    postTokens: p?.context_used_tokens,
                    idleMs: nB(ne.event.payload, "idle_ms")
                }), on && (oe = void 0), Gn.sessionId && !fe && (Ie = Gn.sessionId), ne.event.ts && (pt = ne.event.ts)
            }
        }
        return await to(m, "mailbox_finalize_ms", async () => {
            if (await co(e, t, $), $.length > 0 || C > 0) {
                let Ie = `processed=${$.length} skipped=${C}${U?` outbox=${U}`:""}`;
                await Gy(e, t, Ie)
            }
        }), await y({
            cancelled: Ae,
            processedCount: $.length,
            skippedCount: C,
            replyText: z
        }), {
            processed: $.length,
            skipped: C,
            lockAcquired: !0,
            cancelled: Ae,
            turnSkipped: A,
            sdkTurns: j,
            compacted: P,
            lastReplyText: z,
            lastOutboxId: U,
            lastOutboxRecord: K,
            outboxRecords: te
        }
    } finally {
        clearInterval(s), await vye(e, r)
    }
}
