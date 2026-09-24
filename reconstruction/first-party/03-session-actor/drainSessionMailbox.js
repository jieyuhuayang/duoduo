// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: KSe, daemon.pretty.js:70371)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = Oo(t);
    if (!(await gSe(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let o = n.lockHeartbeatIntervalMs ?? 3e4,
        s = setInterval(async () => {
            try {
                await ySe(e, r)
            } catch {}
        }, o);
    s.unref?.(), po("drain_started", t, {
        sessionKey: t
    });
    let a = Date.now(),
        u = 0,
        l = 0,
        c = 0,
        d, f, p, m = {},
        h = n.getStreamGeneration?.();

    function g(_) {
        if (_) {
            if (!f) {
                f = {
                    ..._
                };
                return
            }
            f.input_tokens = (f.input_tokens ?? 0) + (_.input_tokens ?? 0), f.output_tokens = (f.output_tokens ?? 0) + (_.output_tokens ?? 0), f.cache_creation_input_tokens = (f.cache_creation_input_tokens ?? 0) + (_.cache_creation_input_tokens ?? 0), f.cache_read_input_tokens = (f.cache_read_input_tokens ?? 0) + (_.cache_read_input_tokens ?? 0), f.total_cost_usd = (f.total_cost_usd ?? 0) + (_.total_cost_usd ?? 0), !f.protocol && _.protocol && (f.protocol = _.protocol), !f.model && _.model && (f.model = _.model), _.context_used_tokens !== void 0 && (f.context_used_tokens = _.context_used_tokens)
        }
    }
    async function y(_) {
        try {
            let I = n.getStreamGeneration?.(),
                R = detectInProcessBreak(f, h !== void 0 && I !== void 0 && I !== h);
            await appendDrainRecord(e, {
                id: WSe.randomUUID(),
                session_key: t,
                sdk_session_id: d,
                drain_started_at: new Date(a).toISOString(),
                drain_duration_ms: Date.now() - a,
                sdk_duration_ms: u,
                events_processed: _.processedCount,
                events_skipped: _.skippedCount,
                tool_calls: l,
                tool_errors: c,
                output_chars: _.replyText?.length ?? 0,
                cancelled: _.cancelled,
                usage: f,
                perf: Object.keys(m).length > 0 ? m : void 0,
                compact: p,
                suspected_in_process_break: R ? !0 : void 0
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

    function b() {
        if (!f) return;
        let _ = f.input_tokens ?? 0,
            I = f.cache_read_input_tokens ?? 0,
            E = f.cache_creation_input_tokens ?? 0,
            R = f.output_tokens ?? 0,
            x = f.total_cost_usd ?? 0,
            S = kSe({
                protocol: f.protocol,
                input_tokens: _ - v.input_tokens,
                cache_read_input_tokens: I - v.cache_read,
                cache_creation_input_tokens: E - v.cache_create
            }),
            D = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: f.input_tokens === void 0 ? void 0 : S.totalInput,
                cache_hit_rate: xSe(S),
                output_tokens: f.output_tokens === void 0 ? void 0 : R - v.output_tokens,
                total_cost_usd: f.total_cost_usd === void 0 ? void 0 : x - v.total_cost_usd,
                model: f.model,
                context_used_tokens: f.context_used_tokens,
                protocol: f.protocol
            };
        return v = {
            input_tokens: _,
            cache_read: I,
            cache_create: E,
            output_tokens: R,
            total_cost_usd: x
        }, D
    }
    try {
        try {
            await Eo(m, "mailbox_merge_ms", async () => fR(e, t))
        } catch (de) {
            if (hse(de)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw de
        }
        let _ = await Eo(m, "mailbox_parse_ms", async () => lb(e, t));
        if (_.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (_.some(de => !de.eventId)) {
            let de = await yse(e, t);
            if (de.removed > 0) {
                await cb(e, t, `orphan_cleanup=${de.removed}`);
                let me = await lb(e, t);
                if (me.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                _ = me
            }
        }
        await Eo(m, "mailbox_render_ms", async () => pR(e, t, _));
        let E = n.batchSize ?? vH,
            R = n.mergeWindowMs ?? wH,
            x = n.sdk ?? createAgentSdkAdapter(),
            S = await batchDrainItems(e, _, {
                fallbackBatchSize: E,
                mergeWindowMs: R,
                perf: m
            });
        if (S.items.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        let D = S.items,
            $ = await gft(e, t, _, S.events, m),
            C = !1,
            A = !1,
            F = !1,
            k = [],
            N = 0,
            V = !1,
            W = [],
            ce = !1,
            J, ne, fe, j = [],
            ue = async (de, me) => {
                de.length !== 0 && await Ao(e, t, de).catch(Y => {
                    Z("[runner] eager markDone failed (will retry at drain end)", {
                        sessionKey: t,
                        stage: me,
                        eventIds: de,
                        error: Y instanceof Error ? Y.message : String(Y)
                    })
                })
            }, Ie = () => {
                if (!A || F) return [];
                F = !0;
                let de = $?.eventIds ?? [];
                return k.push(...de), de
            }, ae = (de, me) => {
                de && (J = me ?? de.payload.text, ne = de.id, fe = de)
            }, M = async () => (await Ao(e, t, k), await cb(e, t, `processed=${k.length} skipped=${N} cancelled=true`), await y({
                cancelled: !0,
                processedCount: k.length,
                skippedCount: N,
                replyText: J
            }), {
                processed: k.length,
                skipped: N,
                lockAcquired: !0,
                cancelled: !0,
                turnSkipped: V,
                sdkTurns: W,
                lastReplyText: J,
                lastOutboxId: ne,
                lastOutboxRecord: fe,
                outboxRecords: j
            }), z = await Eo(m, "session_state_ms", async () => ct(e, t)), U = Ig(e, t, z ?? void 0), X = n.jobContext?.stateless === !0, Ee = z?.pending_gateway_notice, be = z?.pending_interrupted_context, w = z?.pending_skip_rewind, P = !1, K = !1, H = !1, L = !1, G = Xdt(z), ee = !1, we = Bbe({
                currentDaemonStartedAt: hH,
                sessionKey: t,
                lastEventAt: z?.last_event_at,
                lastSeenDaemonStartedAt: z?.last_seen_daemon_started_at
            });
        we.writeLastSeenAtEntry && await et(e, t, {
            last_seen_daemon_started_at: we.writeLastSeenAtEntry
        }).catch(() => {});
        let le = we.inject ? {
                startedAt: hH
            } : void 0,
            ve = we.writeLastSeenOnInjectSuccess,
            Be = !1,
            at = to(t) === "channel" ? n.boardHash : void 0,
            Je = TSe({
                currentBoardHash: at,
                lastSeenBoardHash: z?.last_seen_board_hash
            });
        Je.writeLastSeenAtEntry && await et(e, t, {
            last_seen_board_hash: Je.writeLastSeenAtEntry
        }).catch(() => {});
        let De = Je.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            Oe = Je.writeLastSeenOnInjectSuccess,
            Gt = !1,
            ke = z?.last_event_at,
            qe = !1,
            pt = [],
            Cn, Ut;
        for (let de of D) {
            if (!de.eventId) {
                N += 1;
                continue
            }
            let me = de.eventId;
            if (n.excludeEventIds?.has(me)) {
                N += 1;
                continue
            }
            let Y = await Eo(m, "outbox_lookup_ms", async () => qm(e, me));
            if (Y) {
                k.push(me), J = Y.payload.text, ne = Y.id;
                continue
            }
            let Et = de.createdAt ? {
                    notAfter: de.createdAt
                } : void 0,
                un = S.events.get(me) ?? await Eo(m, "event_read_ms", async () => readEventById(e, me, Et));
            if (!un) {
                Z(`[runner] mailbox event unresolved: session_key=${t} event_id=${me} not_after=${Et?.notAfter??"none"} item_file=${de.file??"none"}`), N += 1;
                continue
            }
            pt.push({
                item: de,
                event: un,
                prompt: RO(un, t)
            })
        }
        if (n.onBatchContext && pt.length > 0) {
            let de = 0;
            for (let Y of pt)
                if (Y.event.type === "route.deliver") {
                    let Et = eo(Y.event.payload) ? Y.event.payload : void 0,
                        un = eo(Et?.payload) ? Et.payload : void 0,
                        fn = typeof un?.notify_depth == "number" ? un.notify_depth : 0;
                    fn > de && (de = fn)
                } let me = pt.map(Y => Y.item.eventId).filter(Y => !!Y);
            n.onBatchContext({
                maxNotifyDepth: de,
                eventIds: me
            })
        }
        let vr = async de => {
            let {
                guidance: me,
                stage: Y,
                payloadExtra: Et,
                noteSuffix: un
            } = de;
            if (to(t) === "channel") {
                for (let fn of pt) {
                    if (fn.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: fn,
                            error: new Error(me),
                            stage: Y,
                            userText: me,
                            payloadExtra: Et,
                            bus: n.bus
                        }), fn.item.eventId && k.push(fn.item.eventId);
                        continue
                    }
                    let Ve = await $c(e, t, {
                        item: fn.item,
                        event: fn.event,
                        outputText: me,
                        sdkSessionId: U.sessionId
                    });
                    j.push(...Ve.records), ae(Ve.primaryRecord), fn.item.eventId && k.push(fn.item.eventId)
                }
                return await Ao(e, t, k), await cb(e, t, `processed=${k.length} skipped=${N} ${un}`), {
                    processed: k.length,
                    skipped: N,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: J,
                    lastOutboxId: ne,
                    lastOutboxRecord: fe,
                    outboxRecords: j,
                    refusedStage: Y
                }
            }
            throw await handleDrainError(e, t, {
                anchor: pt[0],
                error: new Error(me),
                stage: Y,
                userText: me,
                payloadExtra: Et,
                precedingRecords: j,
                bus: n.bus
            }), new Error(me)
        }, It = {
            runtime: n.runtime,
            usesStreamingAdapter: n.usesStreamingAdapter,
            abortController: n.abortController,
            onTurnRejected: () => {
                A = !1, n.onSdkTurnRejected?.()
            },
            effort: U.effort,
            cwd: U.cwd,
            settingSources: U.settingSources,
            persistSession: n.persistSession,
            mcpServers: n.mcpServers,
            mcpServersFactory: n.mcpServersFactory,
            holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
            boardHash: n.boardHash
        }, tn = Tft(U.cwd);
        if (pt.length > 0 && tn) return vr({
            guidance: Pft(t, U.cwd, tn),
            stage: "workspace_unavailable",
            payloadExtra: {
                outcome: "workspace_unavailable",
                cwd: U.cwd,
                reason: tn
            },
            noteSuffix: "workspace_unavailable=true"
        });
        let Ht = n.runtime ?? "claude",
            pi = n.runtimeUnavailableReason ?? (n.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (pt.length > 0 && pi) return vr({
            guidance: renderRuntimeUnavailableGuidance(pi, Ht),
            stage: "runtime_unavailable",
            payloadExtra: {
                outcome: "runtime_unavailable",
                runtime: Ht,
                runtime_source: n.runtime ? "explicit" : "default"
            },
            noteSuffix: `runtime_unavailable=${Ht}`
        });
        let Ke = z?.sdk_session_id,
            Bn = z?.sdk_session_runtime;
        if (pt.length > 0 && !X && Ke && Bn && Bn !== Ht) return vr({
            guidance: renderRuntimeMismatchGuidance({
                boundRuntime: Bn,
                sdkSessionId: Ke,
                requestedRuntime: Ht,
                isChannel: to(t) === "channel"
            }),
            stage: "runtime_mismatch",
            payloadExtra: {
                outcome: "runtime_mismatch",
                runtime: Ht,
                bound_runtime: Bn,
                sdk_session_id: Ke
            },
            noteSuffix: `runtime_mismatch=${Bn}->${Ht}`
        });
        U.forkFrom && (n.runtime !== "codex" || X) && (U.forkFrom = void 0, await ea(e, t, "pending_fork_to").catch(() => {})), await Rft(e, t, {
            snapshotModel: z?.model,
            snapshotModelRuntime: z?.model_runtime,
            activeRuntime: n.runtime ?? "claude",
            sessionInfo: U
        }), z?.pending_model_fork && await Ift(e, t, {
            snapshotModel: z.model,
            runtime: n.runtime,
            statelessJob: X,
            sessionInfo: U
        });
        let Di = de => async me => {
            if (me.type === "system" && me.subtype === "init" && me.data && typeof me.data.session_id == "string" && (Cn = me.data.session_id, U.sessionId && Cn !== U.sessionId && Z("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: U.sessionId,
                    actualSessionId: Cn
                })), me.type === "system" && me.subtype === "compact_boundary" && me.data && typeof me.data == "object") {
                let Y = me.data,
                    Et = Y.trigger;
                (Et === "manual" || Et === "auto") && (Ut = {
                    trigger: Et,
                    pre_tokens: typeof Y.pre_tokens == "number" ? Y.pre_tokens : void 0,
                    post_tokens: typeof Y.post_tokens == "number" ? Y.post_tokens : void 0
                })
            }
            return me.type === "tool_use" ? l += 1 : me.type === "tool_result" && me.isError && (c += 1), de(me)
        }, Cr = async () => {
            let de = Cn ?? U.sessionId;
            !de || n.skipSessionIdUpdate || X || await et(e, t, {
                sdk_session_id: de
            })
        }, An = async (de, me) => {
            await Cr(), !(await ct(e, t))?.pending_skip_rewind && await oft(e, t, rft(de, me ? be : void 0))
        }, $n = async de => {
            de.gatewayNoticeInjected && !P && (await ift(e, t), P = !0), de.interruptedContextInjected && !K && (await sft(e, t), K = !0), de.skipRewindInjected && !H && (await aft(e, t), H = !0)
        };
        if (cft(pt, t)) {
            let de = await SH(e, t, n, pt, U, {
                    pendingGatewayNotice: Ee,
                    pendingInterruptedContext: be,
                    pendingSkipRewind: w,
                    lastEventAtWatermark: ke,
                    timeGapConsumed: L,
                    daemonRestartHint: Be ? void 0 : le,
                    compactNotice: ee ? void 0 : G,
                    boardUpdated: Gt ? void 0 : De,
                    jobReceipts: C ? void 0 : $?.text
                }, m, Di),
                {
                    anchor: me,
                    resumeSessionId: Y,
                    forkFromSessionId: Et,
                    handleExecutionEvent: un,
                    attachments: fn,
                    batchEventIds: Ve,
                    coalescedPromptText: pn,
                    injectionResult: tt,
                    systemPrompt: Xn,
                    sdkRunConfig: Yr
                } = de,
                mn = await DSe(e, de.anchorChannelConfig, n.jobContext?.sdkConfig),
                cr = ASe({
                    jobModel: n.jobContext?.model,
                    sessionModel: U.model,
                    config: de.anchorChannelConfig,
                    kindlessConfig: mn,
                    runtime: n.runtime
                }),
                vn = NSe({
                    jobEffort: n.jobContext?.effort,
                    sessionEffort: U.effort,
                    config: de.anchorChannelConfig,
                    kindlessConfig: mn,
                    runtime: n.runtime
                }),
                Ro = await jSe(e, t, {
                    runtime: n.runtime,
                    model: cr.model,
                    modelOrigin: cr.configLayer,
                    cwd: U.cwd,
                    effective: de.anchorChannelConfig,
                    kindlessConfig: mn,
                    jobOverlay: n.jobContext?.sdkConfig
                }, {
                    anchor: me,
                    precedingRecords: j,
                    bus: n.bus
                });
            L = de.timeGapConsumed;
            let Mi = de.injectionResult.jobReceiptsInjected;
            Mi && (C = !0), !Be && de.injectionResult.daemonRestartHintInjected && (Be = !0, ve && await et(e, t, {
                last_seen_daemon_started_at: ve
            }).catch(() => {})), !Gt && de.injectionResult.boardUpdatedInjected && (Gt = !0, Oe && await et(e, t, {
                last_seen_board_hash: Oe
            }).catch(() => {})), po("sdk_start", me.event.id, {
                eventIds: Ve,
                coalesced: pt.length > 1
            });
            let ji = Date.now(),
                js = {
                    anchorEventId: me.event.id,
                    consumed: !0,
                    skipped: !1,
                    hadOutput: !1
                };
            W.push(js);
            let Zo;
            try {
                let Xe = de.isNotifyOnly || de.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (Rt, dr) => n.onStream(Rt, dr, me.event.id);
                Zo = await HSe(e, t, x, {
                    ...It,
                    onTurnAcknowledged: () => {
                        Mi && (A = !0), n.onSdkTurnStarted?.({
                            notifyOnly: de.isNotifyOnly
                        })
                    },
                    prompt: tt.blocks,
                    onStream: Xe,
                    anchorEventId: me.event.id,
                    onExecutionEvent: un,
                    sessionId: Y,
                    forkFrom: Et,
                    model: Ro.effectiveModel ?? cr.model,
                    effort: vn.effort,
                    effortOrigin: vn.configLayer,
                    claudeContextRequirement: Ro.requirement,
                    claudeModelAliases: Ro.aliases,
                    claudeSettingsPath: Ro.settingsPath,
                    permissionMode: Yr.permissionMode,
                    allowedTools: Yr.allowedTools,
                    disallowedTools: Yr.disallowedTools,
                    tools: Yr.tools,
                    additionalDirectories: Yr.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: OSe(n.runtime, n.memoryBoard, Yr.additionalDirectories, e.memoryDir),
                    attachments: fn,
                    systemPrompt: Xn
                })
            } catch (mt) {
                if (isAgentSdkTurnInterruptedError(mt)) {
                    await $n(tt);
                    for (let Xe of pt) Xe.item.eventId && k.push(Xe.item.eventId);
                    return Ie(), M()
                }
                if (isAgentSdkPromptNotAcceptedAbortError(mt)) return js.consumed = !1, M();
                if (isAbortLikeError(mt)) {
                    for (let Xe of pt) Xe.item.eventId && k.push(Xe.item.eventId);
                    return Ie(), await An(pn, tt.interruptedContextInjected), M()
                }
                throw await handleDrainError(e, t, {
                    anchor: me,
                    error: mt,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : U.model
                    },
                    precedingRecords: j,
                    bus: n.bus
                }), mt
            }
            let Nn = Zo.sdkResult;
            if (u += Date.now() - ji, await FSe(e, t, n.runtime, Nn), Nn.skipped && (js.skipped = !0, V = !0), Nn.sessionId && (d = Nn.sessionId), g(Nn.usage), typeof Nn.firstTokenLatencyMs == "number" && (yH(m, "sdk_ttft_ms_total", Nn.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), po("sdk_end", me.event.id, {
                    eventIds: Ve,
                    sdkDurationMs: Date.now() - ji,
                    usedFallback: Nn.usedFallback
                }), n.abortController?.signal.aborted) {
                await An(pn, tt.interruptedContextInjected);
                for (let mt of pt) mt.item.eventId && k.push(mt.item.eventId);
                return Ie(), M()
            }
            if (await $n(tt), Nn.skipped) te("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: me.event.id
            });
            else {
                let mt = qSe(me.event, Nn),
                    Xe = await Eo(m, "outbox_emit_ms", async () => $c(e, t, {
                        item: me.item,
                        event: me.event,
                        outputText: mt,
                        sdkSessionId: Nn.sessionId,
                        batchedEventIds: pt.map(Rt => Rt.event.id),
                        attachments: Zo.outboundAttachments,
                        turnMeta: b()
                    }));
                if (j.push(...Xe.records), Xe.primaryRecord) {
                    js.hadOutput = !0, po("outbox_written", me.event.id, {
                        outboxId: Xe.primaryRecord.id,
                        eventIds: Ve
                    }), ae(Xe.primaryRecord);
                    for (let Rt of pt.slice(0, -1)) Rt.item.eventId && await eU(e, Rt.item.eventId, Xe.primaryRecord)
                }
            }
            for (let mt of pt) mt.item.eventId && k.push(mt.item.eventId);
            let yt = Ie();
            if (Nn.skipped) {
                let mt = [...pt.map(Xe => Xe.item.eventId).filter(Xe => !!Xe), ...yt];
                await ue(mt, "skip-turn")
            }
            if (Nn.usedFallback && Nn.resumeError) {
                let mt = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: me.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: U.sessionId,
                        error: Nn.resumeError
                    }
                });
                await atomicAppendEvent(e, mt)
            }
            await Eo(m, "session_upsert_ms", async () => {
                let mt = {
                    cwd: U.cwd,
                    plane: U.plane,
                    permission_profile: U.permissionProfile,
                    last_event_id: me.event.id,
                    last_event_at: me.event.ts
                };
                f?.context_used_tokens !== void 0 && (mt.context_used_tokens = f.context_used_tokens);
                let Xe = MSe(f);
                if (Xe && (mt.last_served_model = Xe), Ut) {
                    let Rt = Ut;
                    Ut = void 0, ce = !0;
                    let dr = me.event.ts ?? new Date().toISOString(),
                        Io = await BSe(e, t, z?.compact_stats?.measured_at),
                        wr = VSe({
                            completion: {
                                hadBoundary: !0,
                                history_pre: Rt.pre_tokens,
                                history_post: Rt.post_tokens,
                                origin: Rt.trigger
                            },
                            preTotal: z?.context_used_tokens,
                            postTotal: f?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: dr,
                            sessionKey: t,
                            gapCounts: Io
                        });
                    mt.last_compact_at = dr, mt.compact_stats = wr, p = wr, te("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: me.event.id,
                        trigger: Rt.trigger,
                        pre_tokens: Rt.pre_tokens,
                        post_tokens: Rt.post_tokens
                    })
                }
                Nn.sessionId && !X && (mt.sdk_session_id = Nn.sessionId, mt.sdk_session_runtime = Ht), Et && (mt.pending_fork_to = null), await et(e, t, mt)
            }), me.event.ts && (ke = me.event.ts)
        } else {
            let de = n.resume === !1 || X ? void 0 : U.sessionId,
                me = n.resume === !1 || n.runtime !== "codex" || X ? void 0 : U.forkFrom;
            for (let Y of pt) {
                let Et = !1,
                    un;
                if (Y.event.routing_hint?.intent === "history-control") {
                    let ht = eo(Y.event.payload) ? Y.event.payload : void 0,
                        ga = (ht?.text ?? ht?.command ?? "").trim(),
                        ou = /^(\S+)/.exec(ga)?.[1]?.toLowerCase() ?? "";
                    if (ou === "/compact" && Y.event.source?.name === "idle-compact" && vft(Y.event.ts, {
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        })) {
                        te("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey: t,
                            eventId: Y.event.id,
                            itemTs: Y.event.ts,
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        }), Y.item.eventId && (k.push(Y.item.eventId), await ue([Y.item.eventId], "stale-idle-compact")), Y.event.ts && (ke = Y.event.ts);
                        continue
                    }
                    if (ou === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (to(t) === "channel") Et = !0;
                        else {
                            let qc = "ℹ️ /compact is only available in interactive sessions.",
                                Qf = await $c(e, t, {
                                    item: Y.item,
                                    event: Y.event,
                                    outputText: qc,
                                    sdkSessionId: de
                                });
                            j.push(...Qf.records), ae(Qf.primaryRecord, qc), Y.item.eventId && (k.push(Y.item.eventId), await Ao(e, t, [Y.item.eventId]).catch(ep => {
                                Z("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: Y.item.eventId,
                                    error: ep instanceof Error ? ep.message : String(ep)
                                })
                            })), Y.event.ts && (ke = Y.event.ts);
                            continue
                        } if (!Et) {
                        let qc = await xft({
                            paths: e,
                            sessionKey: t,
                            sdk: x,
                            sessionInfo: {
                                ...U,
                                sessionId: de
                            },
                            cmdToken: ou
                        });
                        if (!(ou === "/compact" && Y.event.source?.name === "idle-compact")) {
                            let ep = await $c(e, t, {
                                item: Y.item,
                                event: Y.event,
                                outputText: qc,
                                sdkSessionId: de
                            });
                            j.push(...ep.records), ae(ep.primaryRecord, qc)
                        }
                        Y.item.eventId && (k.push(Y.item.eventId), await ue([Y.item.eventId], "history-control")), Y.event.ts && (ke = Y.event.ts);
                        continue
                    }
                }
                let fn = Di(ake(e, t, Y.event.session_key ?? t, n.onExecutionEvent, Y.event.id)),
                    Ve = eo(Y.event.payload) ? Y.event.payload : void 0,
                    pn = kH(Y.event.payload),
                    tt = applyJobSdkConfigOverride(await Eo(m, "effective_config_ms", async () => YV(e, Y.event)), n.jobContext?.sdkConfig),
                    Xn = await DSe(e, tt, n.jobContext?.sdkConfig),
                    Yr = ASe({
                        jobModel: n.jobContext?.model,
                        sessionModel: U.model,
                        config: tt,
                        kindlessConfig: Xn,
                        runtime: n.runtime
                    }),
                    mn = NSe({
                        jobEffort: n.jobContext?.effort,
                        sessionEffort: U.effort,
                        config: tt,
                        kindlessConfig: Xn,
                        runtime: n.runtime
                    }),
                    cr = await jSe(e, t, {
                        runtime: n.runtime,
                        model: Yr.model,
                        modelOrigin: Yr.configLayer,
                        cwd: U.cwd,
                        effective: tt,
                        kindlessConfig: Xn,
                        jobOverlay: n.jobContext?.sdkConfig
                    }, {
                        anchor: Y,
                        precedingRecords: j,
                        bus: n.bus
                    }),
                    vn = me,
                    Ro = n.resume === !1 || vn || X ? void 0 : de,
                    Mi = EO(Y.event),
                    ji = to(t) === "channel",
                    js = QSe({
                        consumed: L,
                        timeGapMinutes: tt?.time_gap_minutes,
                        isChannelSession: ji,
                        isUserMessage: Mi,
                        lastEventAt: ke,
                        currentEventAt: Y.event.ts
                    }),
                    Zo = ji && !Mi,
                    Nn, yt = Y.prompt;
                if (Y.event.type === "job.spawn" && n.jobContext) {
                    let ht = eo(Ve?.tick) ? Ve.tick : void 0;
                    if (ht) {
                        let Or = ht.run_number,
                            ga = ht.triggered_at,
                            ou = ht.previous_run_at;
                        typeof Or == "number" && typeof ga == "string" && (Nn = {
                            run_number: Or,
                            triggered_at: ga,
                            previous_run_at: typeof ou == "string" ? ou : null,
                            cron: n.jobContext.cron
                        })
                    }
                    Nn && (yt = tft)
                }
                let mt = !Be && le ? le : void 0,
                    Rt = (tt?.auto_compact_idle_minutes ?? 0) > 0 && !ee && G ? G : void 0,
                    dr = !Gt && De ? De : void 0,
                    Io = C ? void 0 : $?.text,
                    wr = buildTransientUserBlocks(yt, {
                        gatewayNotice: P ? void 0 : Ee,
                        interruptedContext: K ? void 0 : be,
                        skipRewind: H ? void 0 : w,
                        isUserMessage: Mi,
                        timeGap: js,
                        jobTick: Nn,
                        jobReceipts: Io,
                        daemonRestartHint: mt,
                        compactNotice: Rt,
                        boardUpdated: dr
                    }, U),
                    iu = wr.jobReceiptsInjected;
                iu && (C = !0), L = L || wr.timeGapInjected, wr.compactNoticeInjected && (ee = !0), !Be && wr.daemonRestartHintInjected && (Be = !0, ve && await et(e, t, {
                    last_seen_daemon_started_at: ve
                }).catch(() => {})), !Gt && wr.boardUpdatedInjected && (Gt = !0, Oe && await et(e, t, {
                    last_seen_board_hash: Oe
                }).catch(() => {}));
                let mi = buildSystemPromptForChannelConfig(tt, t, ZSe(n.jobContext), n.memoryBoard, n.runtime),
                    Yf = GSe(n, tt),
                    UA, M0e = Date.now(),
                    j0e = n.onStream ? (ht, Or) => n.onStream(ht, Or, Y.event.id) : void 0,
                    Xf = {
                        anchorEventId: Y.event.id,
                        consumed: !0,
                        skipped: !1,
                        hadOutput: !1
                    };
                W.push(Xf);
                try {
                    UA = await HSe(e, t, x, {
                        ...It,
                        onTurnAcknowledged: () => {
                            iu && (A = !0), n.onSdkTurnStarted?.({
                                notifyOnly: Zo
                            })
                        },
                        prompt: wr.blocks,
                        onStream: j0e,
                        anchorEventId: Y.event.id,
                        onExecutionEvent: fn,
                        sessionId: Ro,
                        forkFrom: vn,
                        model: cr.effectiveModel ?? Yr.model,
                        effort: mn.effort,
                        effortOrigin: mn.configLayer,
                        claudeContextRequirement: cr.requirement,
                        claudeModelAliases: cr.aliases,
                        claudeSettingsPath: cr.settingsPath,
                        permissionMode: Yf.permissionMode,
                        allowedTools: Yf.allowedTools,
                        disallowedTools: Yf.disallowedTools,
                        tools: Yf.tools,
                        additionalDirectories: Yf.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: OSe(n.runtime, n.memoryBoard, Yf.additionalDirectories, e.memoryDir),
                        attachments: pn,
                        systemPrompt: mi
                    })
                } catch (ht) {
                    if (isAgentSdkTurnInterruptedError(ht)) {
                        await $n(wr), Y.item.eventId && k.push(Y.item.eventId), Ie(), qe = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(ht)) {
                        Xf.consumed = !1, qe = !0;
                        break
                    }
                    if (isAbortLikeError(ht)) {
                        Y.item.eventId && k.push(Y.item.eventId), Ie(), await An(Y.prompt, wr.interruptedContextInjected), qe = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: Y,
                        error: ht,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : U.model
                        },
                        precedingRecords: j,
                        bus: n.bus
                    }), ht
                }
                let $r = UA.sdkResult;
                if (await FSe(e, t, n.runtime, $r), $r.skipped && (Xf.skipped = !0, V = !0), u += Date.now() - M0e, $r.sessionId && (d = $r.sessionId), g($r.usage), typeof $r.firstTokenLatencyMs == "number" && (yH(m, "sdk_ttft_ms_total", $r.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await An(Y.prompt, wr.interruptedContextInjected), qe = !0, Y.item.eventId && k.push(Y.item.eventId), Ie();
                    break
                }
                if (await $n(wr), !$r.skipped && !Et) {
                    let ht = qSe(Y.event, $r),
                        Or = await Eo(m, "outbox_emit_ms", async () => $c(e, t, {
                            item: Y.item,
                            event: Y.event,
                            outputText: ht,
                            sdkSessionId: $r.sessionId,
                            attachments: UA.outboundAttachments,
                            turnMeta: b()
                        }));
                    j.push(...Or.records), Or.primaryRecord && (Xf.hadOutput = !0), ae(Or.primaryRecord)
                } else if (Et) te("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: Y.event.id
                });
                else {
                    te("[runner] Skip called — suppressing outbox", {
                        sessionKey: t,
                        eventId: Y.event.id
                    });
                    let ht = Ie();
                    (Y.item.eventId || ht.length > 0) && await ue([...Y.item.eventId ? [Y.item.eventId] : [], ...ht], "skip-turn")
                }
                let ny = Y.event.source?.name === "idle-compact";
                if (Ut) {
                    let ht = Ut;
                    if (Ut = void 0, un = {
                            hadBoundary: !0,
                            history_pre: ht.pre_tokens,
                            history_post: ht.post_tokens,
                            origin: ny ? "idle-compact" : ht.trigger
                        }, ht.trigger === "manual" && !ny) {
                        let Or = bft(ht),
                            ga = await $c(e, t, {
                                item: Y.item,
                                event: Y.event,
                                outputText: Or,
                                sdkSessionId: $r.sessionId ?? de
                            });
                        j.push(...ga.records), ga.primaryRecord && (Xf.hadOutput = !0), ae(ga.primaryRecord, Or)
                    } else te("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: Y.event.id,
                        trigger: ht.trigger,
                        idleCompact: ny,
                        pre_tokens: ht.pre_tokens,
                        post_tokens: ht.post_tokens
                    })
                } else if (Et)
                    if (un = {
                            hadBoundary: !1,
                            origin: ny ? "idle-compact" : "manual"
                        }, ny) te("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: Y.event.id
                    });
                    else {
                        let ht = "ℹ️ Nothing to compact.",
                            Or = await $c(e, t, {
                                item: Y.item,
                                event: Y.event,
                                outputText: ht,
                                sdkSessionId: $r.sessionId ?? de
                            });
                        j.push(...Or.records), Or.primaryRecord && (Xf.hadOutput = !0), ae(Or.primaryRecord, ht)
                    } if (Y.item.eventId && k.push(Y.item.eventId), Ie(), $r.usedFallback && $r.resumeError) {
                    let ht = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: Y.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: U.sessionId,
                            error: $r.resumeError
                        }
                    });
                    await atomicAppendEvent(e, ht)
                }
                await Eo(m, "session_upsert_ms", async () => {
                    let ht = {
                        cwd: U.cwd,
                        plane: U.plane,
                        permission_profile: U.permissionProfile,
                        last_event_id: Y.event.id,
                        last_event_at: Y.event.ts
                    };
                    f?.context_used_tokens !== void 0 && (ht.context_used_tokens = f.context_used_tokens);
                    let Or = MSe(f);
                    Or && (ht.last_served_model = Or);
                    let ga = gH(Y.event.payload, "idle_ms"),
                        ou = gH(Y.event.payload, "threshold_at_fire");
                    if (un) {
                        ce = !0;
                        let qA = Y.event.ts ?? new Date().toISOString(),
                            qc = await BSe(e, t, z?.compact_stats?.measured_at),
                            Qf = VSe({
                                completion: un,
                                preTotal: z?.context_used_tokens,
                                postTotal: f?.context_used_tokens,
                                idleMs: ga,
                                thresholdAtFire: ou,
                                measuredAt: qA,
                                sessionKey: t,
                                gapCounts: qc
                            });
                        ht.last_compact_at = qA, ht.compact_stats = Qf, p = Qf
                    }
                    $r.sessionId && !X && (ht.sdk_session_id = $r.sessionId, ht.sdk_session_runtime = Ht), vn && (ht.pending_fork_to = null), await et(e, t, ht)
                }), un?.origin === "idle-compact" && await kft(e, {
                    sessionKey: t,
                    preTokens: z?.context_used_tokens,
                    postTokens: f?.context_used_tokens,
                    idleMs: gH(Y.event.payload, "idle_ms")
                }), vn && (me = void 0), $r.sessionId && !X && (de = $r.sessionId), Y.event.ts && (ke = Y.event.ts)
            }
        }
        return await Eo(m, "mailbox_finalize_ms", async () => {
            if (await Ao(e, t, k), k.length > 0 || N > 0) {
                let de = `processed=${k.length} skipped=${N}${ne?` outbox=${ne}`:""}`;
                await cb(e, t, de)
            }
        }), await y({
            cancelled: qe,
            processedCount: k.length,
            skippedCount: N,
            replyText: J
        }), {
            processed: k.length,
            skipped: N,
            lockAcquired: !0,
            cancelled: qe,
            turnSkipped: V,
            sdkTurns: W,
            compacted: ce,
            lastReplyText: J,
            lastOutboxId: ne,
            lastOutboxRecord: fe,
            outboxRecords: j
        }
    } finally {
        clearInterval(s), await _Se(e, r)
    }
}
