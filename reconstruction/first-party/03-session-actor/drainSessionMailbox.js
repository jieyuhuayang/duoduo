// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: GSe, daemon.pretty.js:70374)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = Oo(t);
    if (!(await hSe(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let o = n.lockHeartbeatIntervalMs ?? 3e4,
        s = setInterval(async () => {
            try {
                await gSe(e, r)
            } catch {}
        }, o);
    s.unref?.(), fo("drain_started", t, {
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
                id: HSe.randomUUID(),
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
            S = SSe({
                protocol: f.protocol,
                input_tokens: _ - v.input_tokens,
                cache_read_input_tokens: I - v.cache_read,
                cache_creation_input_tokens: E - v.cache_create
            }),
            D = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: f.input_tokens === void 0 ? void 0 : S.totalInput,
                cache_hit_rate: kSe(S),
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
            await xo(m, "mailbox_merge_ms", async () => fR(e, t))
        } catch (ve) {
            if (mse(ve)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw ve
        }
        let _ = await xo(m, "mailbox_parse_ms", async () => lb(e, t));
        if (_.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (_.some(ve => !ve.eventId)) {
            let ve = await gse(e, t);
            if (ve.removed > 0) {
                await cb(e, t, `orphan_cleanup=${ve.removed}`);
                let _e = await lb(e, t);
                if (_e.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                _ = _e
            }
        }
        await xo(m, "mailbox_render_ms", async () => pR(e, t, _));
        let E = n.batchSize ?? bH,
            R = n.mergeWindowMs ?? vH,
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
            A = await fft(e, t, _, S.events, m),
            C = !1,
            $ = !1,
            j = !1,
            k = [],
            L = 0,
            B = !1,
            G = [],
            ce = !1,
            J, ee, le, M = [],
            ue = async (ve, _e) => {
                ve.length !== 0 && await Ao(e, t, ve).catch(ae => {
                    Z("[runner] eager markDone failed (will retry at drain end)", {
                        sessionKey: t,
                        stage: _e,
                        eventIds: ve,
                        error: ae instanceof Error ? ae.message : String(ae)
                    })
                })
            }, $e = () => {
                if (!$ || j) return [];
                j = !0;
                let ve = A?.eventIds ?? [];
                return k.push(...ve), ve
            }, se = (ve, _e) => {
                ve && (J = _e ?? ve.payload.text, ee = ve.id, le = ve)
            }, N = async () => (await Ao(e, t, k), await cb(e, t, `processed=${k.length} skipped=${L} cancelled=true`), await y({
                cancelled: !0,
                processedCount: k.length,
                skippedCount: L,
                replyText: J
            }), {
                processed: k.length,
                skipped: L,
                lockAcquired: !0,
                cancelled: !0,
                turnSkipped: B,
                sdkTurns: G,
                lastReplyText: J,
                lastOutboxId: ee,
                lastOutboxRecord: le,
                outboxRecords: M
            }), U = await xo(m, "session_state_ms", async () => ht(e, t)), q = Rg(e, t, U ?? void 0), Y = n.jobContext?.stateless === !0;
        q.forkFrom && (n.runtime !== "codex" || Y) && (q.forkFrom = void 0, await No(e, t, "pending_fork_to").catch(() => {})), await Sft(e, t, {
            snapshotModel: U?.model,
            snapshotModelRuntime: U?.model_runtime,
            activeRuntime: n.runtime ?? "claude",
            sessionInfo: q
        }), U?.pending_model_fork && await kft(e, t, {
            snapshotModel: U.model,
            runtime: n.runtime,
            statelessJob: Y,
            sessionInfo: q
        });
        let Se = U?.pending_gateway_notice,
            ye = U?.pending_interrupted_context,
            Be = U?.pending_skip_rewind,
            w = !1,
            P = !1,
            z = !1,
            F = !1,
            V = Zdt(U),
            K = !1,
            fe = qbe({
                currentDaemonStartedAt: mH,
                sessionKey: t,
                lastEventAt: U?.last_event_at,
                lastSeenDaemonStartedAt: U?.last_seen_daemon_started_at
            });
        fe.writeLastSeenAtEntry && await rt(e, t, {
            last_seen_daemon_started_at: fe.writeLastSeenAtEntry
        }).catch(() => {});
        let oe = fe.inject ? {
                startedAt: mH
            } : void 0,
            xe = fe.writeLastSeenOnInjectSuccess,
            Re = !1,
            gt = Eo(t) === "channel" ? n.boardHash : void 0,
            Xe = ISe({
                currentBoardHash: gt,
                lastSeenBoardHash: U?.last_seen_board_hash
            });
        Xe.writeLastSeenAtEntry && await rt(e, t, {
            last_seen_board_hash: Xe.writeLastSeenAtEntry
        }).catch(() => {});
        let Ve = Xe.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            Pe = Xe.writeLastSeenOnInjectSuccess,
            Qe = !1,
            we = U?.last_event_at,
            Fe = !1,
            yt = [],
            On, Lt;
        for (let ve of D) {
            if (!ve.eventId) {
                L += 1;
                continue
            }
            let _e = ve.eventId;
            if (n.excludeEventIds?.has(_e)) {
                L += 1;
                continue
            }
            let ae = await xo(m, "outbox_lookup_ms", async () => Um(e, _e));
            if (ae) {
                k.push(_e), J = ae.payload.text, ee = ae.id;
                continue
            }
            let Ze = ve.createdAt ? {
                    notAfter: ve.createdAt
                } : void 0,
                Ae = S.events.get(_e) ?? await xo(m, "event_read_ms", async () => Md(e, _e, Ze));
            if (!Ae) {
                Z(`[runner] mailbox event unresolved: session_key=${t} event_id=${_e} not_after=${Ze?.notAfter??"none"} item_file=${ve.file??"none"}`), L += 1;
                continue
            }
            yt.push({
                item: ve,
                event: Ae,
                prompt: RO(Ae, t)
            })
        }
        if (n.onBatchContext && yt.length > 0) {
            let ve = 0;
            for (let ae of yt)
                if (ae.event.type === "route.deliver") {
                    let Ze = Qi(ae.event.payload) ? ae.event.payload : void 0,
                        Ae = Qi(Ze?.payload) ? Ze.payload : void 0,
                        pt = typeof Ae?.notify_depth == "number" ? Ae.notify_depth : 0;
                    pt > ve && (ve = pt)
                } let _e = yt.map(ae => ae.item.eventId).filter(ae => !!ae);
            n.onBatchContext({
                maxNotifyDepth: ve,
                eventIds: _e
            })
        }
        let br = async ve => {
            let {
                guidance: _e,
                stage: ae,
                payloadExtra: Ze,
                noteSuffix: Ae
            } = ve;
            if (Eo(t) === "channel") {
                for (let pt of yt) {
                    if (pt.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: pt,
                            error: new Error(_e),
                            stage: ae,
                            userText: _e,
                            payloadExtra: Ze,
                            bus: n.bus
                        }), pt.item.eventId && k.push(pt.item.eventId);
                        continue
                    }
                    let Or = await $c(e, t, {
                        item: pt.item,
                        event: pt.event,
                        outputText: _e,
                        sdkSessionId: q.sessionId
                    });
                    M.push(...Or.records), se(Or.primaryRecord), pt.item.eventId && k.push(pt.item.eventId)
                }
                return await Ao(e, t, k), await cb(e, t, `processed=${k.length} skipped=${L} ${Ae}`), {
                    processed: k.length,
                    skipped: L,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: J,
                    lastOutboxId: ee,
                    lastOutboxRecord: le,
                    outboxRecords: M
                }
            }
            throw await handleDrainError(e, t, {
                anchor: yt[0],
                error: new Error(_e),
                stage: ae,
                userText: _e,
                payloadExtra: Ze,
                precedingRecords: M,
                bus: n.bus
            }), new Error(_e)
        }, ty = {
            runtime: n.runtime,
            usesStreamingAdapter: n.usesStreamingAdapter,
            abortController: n.abortController,
            onTurnRejected: () => {
                $ = !1, n.onSdkTurnRejected?.()
            },
            effort: q.effort,
            cwd: q.cwd,
            settingSources: q.settingSources,
            persistSession: n.persistSession,
            mcpServers: n.mcpServers,
            mcpServersFactory: n.mcpServersFactory,
            holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
            boardHash: n.boardHash
        }, Ye = xft(q.cwd);
        if (yt.length > 0 && Ye) return br({
            guidance: Eft(t, q.cwd, Ye),
            stage: "workspace_unavailable",
            payloadExtra: {
                outcome: "workspace_unavailable",
                cwd: q.cwd,
                reason: Ye
            },
            noteSuffix: "workspace_unavailable=true"
        });
        let vr = n.runtime ?? "claude",
            Pn = n.runtimeUnavailableReason ?? (n.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (yt.length > 0 && Pn) return br({
            guidance: Rft(Pn, vr),
            stage: "runtime_unavailable",
            payloadExtra: {
                outcome: "runtime_unavailable",
                runtime: vr,
                runtime_source: n.runtime ? "explicit" : "default"
            },
            noteSuffix: `runtime_unavailable=${vr}`
        });
        let He = ve => async _e => {
            if (_e.type === "system" && _e.subtype === "init" && _e.data && typeof _e.data.session_id == "string" && (On = _e.data.session_id, q.sessionId && On !== q.sessionId && Z("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: q.sessionId,
                    actualSessionId: On
                })), _e.type === "system" && _e.subtype === "compact_boundary" && _e.data && typeof _e.data == "object") {
                let ae = _e.data,
                    Ze = ae.trigger;
                (Ze === "manual" || Ze === "auto") && (Lt = {
                    trigger: Ze,
                    pre_tokens: typeof ae.pre_tokens == "number" ? ae.pre_tokens : void 0,
                    post_tokens: typeof ae.post_tokens == "number" ? ae.post_tokens : void 0
                })
            }
            return _e.type === "tool_use" ? l += 1 : _e.type === "tool_result" && _e.isError && (c += 1), ve(_e)
        }, Qr = async () => {
            let ve = On ?? q.sessionId;
            !ve || n.skipSessionIdUpdate || Y || await rt(e, t, {
                sdk_session_id: ve
            })
        }, $r = async (ve, _e) => {
            await Qr(), !(await ht(e, t))?.pending_skip_rewind && await tft(e, t, Qdt(ve, _e ? ye : void 0))
        }, ln = async ve => {
            ve.gatewayNoticeInjected && !w && (await eft(e, t), w = !0), ve.interruptedContextInjected && !P && (await nft(e, t), P = !0), ve.skipRewindInjected && !z && (await rft(e, t), z = !0)
        };
        if (sft(yt, t)) {
            let ve = await wH(e, t, n, yt, q, {
                    pendingGatewayNotice: Se,
                    pendingInterruptedContext: ye,
                    pendingSkipRewind: Be,
                    lastEventAtWatermark: we,
                    timeGapConsumed: F,
                    daemonRestartHint: Re ? void 0 : oe,
                    compactNotice: K ? void 0 : V,
                    boardUpdated: Qe ? void 0 : Ve,
                    jobReceipts: C ? void 0 : A?.text
                }, m, He),
                {
                    anchor: _e,
                    resumeSessionId: ae,
                    forkFromSessionId: Ze,
                    handleExecutionEvent: Ae,
                    attachments: pt,
                    batchEventIds: Or,
                    coalescedPromptText: pn,
                    injectionResult: An,
                    systemPrompt: dt,
                    sdkRunConfig: it
                } = ve,
                bn = await NSe(e, ve.anchorChannelConfig, n.jobContext?.sdkConfig),
                Bn = OSe({
                    jobModel: n.jobContext?.model,
                    sessionModel: q.model,
                    config: ve.anchorChannelConfig,
                    kindlessConfig: bn,
                    runtime: n.runtime
                }),
                cr = ASe({
                    jobEffort: n.jobContext?.effort,
                    sessionEffort: q.effort,
                    config: ve.anchorChannelConfig,
                    kindlessConfig: bn,
                    runtime: n.runtime
                }),
                nr = await MSe(e, t, {
                    runtime: n.runtime,
                    model: Bn.model,
                    modelOrigin: Bn.configLayer,
                    cwd: q.cwd,
                    effective: ve.anchorChannelConfig,
                    kindlessConfig: bn,
                    jobOverlay: n.jobContext?.sdkConfig
                }, {
                    anchor: _e,
                    precedingRecords: M,
                    bus: n.bus
                });
            F = ve.timeGapConsumed;
            let Ar = ve.injectionResult.jobReceiptsInjected;
            Ar && (C = !0), !Re && ve.injectionResult.daemonRestartHintInjected && (Re = !0, xe && await rt(e, t, {
                last_seen_daemon_started_at: xe
            }).catch(() => {})), !Qe && ve.injectionResult.boardUpdatedInjected && (Qe = !0, Pe && await rt(e, t, {
                last_seen_board_hash: Pe
            }).catch(() => {})), fo("sdk_start", _e.event.id, {
                eventIds: Or,
                coalesced: yt.length > 1
            });
            let Cn = Date.now(),
                Ro = {
                    anchorEventId: _e.event.id,
                    consumed: !0,
                    skipped: !1,
                    hadOutput: !1
                };
            G.push(Ro);
            let io;
            try {
                let Nn = ve.isNotifyOnly || ve.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (et, wr) => n.onStream(et, wr, _e.event.id);
                io = await VSe(e, t, x, {
                    ...ty,
                    onTurnAcknowledged: () => {
                        Ar && ($ = !0), n.onSdkTurnStarted?.({
                            notifyOnly: ve.isNotifyOnly
                        })
                    },
                    prompt: An.blocks,
                    onStream: Nn,
                    anchorEventId: _e.event.id,
                    onExecutionEvent: Ae,
                    sessionId: ae,
                    forkFrom: Ze,
                    model: nr.effectiveModel ?? Bn.model,
                    effort: cr.effort,
                    effortOrigin: cr.configLayer,
                    claudeContextRequirement: nr.requirement,
                    claudeModelAliases: nr.aliases,
                    claudeSettingsPath: nr.settingsPath,
                    permissionMode: it.permissionMode,
                    allowedTools: it.allowedTools,
                    disallowedTools: it.disallowedTools,
                    tools: it.tools,
                    additionalDirectories: it.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: $Se(n.runtime, n.memoryBoard, it.additionalDirectories, e.memoryDir),
                    attachments: pt,
                    systemPrompt: dt
                })
            } catch (Wt) {
                if (isAgentSdkTurnInterruptedError(Wt)) {
                    await ln(An);
                    for (let Nn of yt) Nn.item.eventId && k.push(Nn.item.eventId);
                    return $e(), N()
                }
                if (isAgentSdkPromptNotAcceptedAbortError(Wt)) return Ro.consumed = !1, N();
                if (isAbortLikeError(Wt)) {
                    for (let Nn of yt) Nn.item.eventId && k.push(Nn.item.eventId);
                    return $e(), await $r(pn, An.interruptedContextInjected), N()
                }
                throw await handleDrainError(e, t, {
                    anchor: _e,
                    error: Wt,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : q.model
                    },
                    precedingRecords: M,
                    bus: n.bus
                }), Wt
            }
            let nn = io.sdkResult;
            if (u += Date.now() - Cn, await LSe(e, t, n.runtime, nn), nn.skipped && (Ro.skipped = !0, B = !0), nn.sessionId && (d = nn.sessionId), g(nn.usage), typeof nn.firstTokenLatencyMs == "number" && (gH(m, "sdk_ttft_ms_total", nn.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), fo("sdk_end", _e.event.id, {
                    eventIds: Or,
                    sdkDurationMs: Date.now() - Cn,
                    usedFallback: nn.usedFallback
                }), n.abortController?.signal.aborted) {
                await $r(pn, An.interruptedContextInjected);
                for (let Wt of yt) Wt.item.eventId && k.push(Wt.item.eventId);
                return $e(), N()
            }
            if (await ln(An), nn.skipped) Q("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: _e.event.id
            });
            else {
                let Wt = USe(_e.event, nn),
                    Nn = await xo(m, "outbox_emit_ms", async () => $c(e, t, {
                        item: _e.item,
                        event: _e.event,
                        outputText: Wt,
                        sdkSessionId: nn.sessionId,
                        batchedEventIds: yt.map(et => et.event.id),
                        attachments: io.outboundAttachments,
                        turnMeta: b()
                    }));
                if (M.push(...Nn.records), Nn.primaryRecord) {
                    Ro.hadOutput = !0, fo("outbox_written", _e.event.id, {
                        outboxId: Nn.primaryRecord.id,
                        eventIds: Or
                    }), se(Nn.primaryRecord);
                    for (let et of yt.slice(0, -1)) et.item.eventId && await Qz(e, et.item.eventId, Nn.primaryRecord)
                }
            }
            for (let Wt of yt) Wt.item.eventId && k.push(Wt.item.eventId);
            let iu = $e();
            if (nn.skipped) {
                let Wt = [...yt.map(Nn => Nn.item.eventId).filter(Nn => !!Nn), ...iu];
                await ue(Wt, "skip-turn")
            }
            if (nn.usedFallback && nn.resumeError) {
                let Wt = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: _e.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: q.sessionId,
                        error: nn.resumeError
                    }
                });
                await atomicAppendEvent(e, Wt)
            }
            await xo(m, "session_upsert_ms", async () => {
                let Wt = {
                    cwd: q.cwd,
                    plane: q.plane,
                    permission_profile: q.permissionProfile,
                    last_event_id: _e.event.id,
                    last_event_at: _e.event.ts
                };
                f?.context_used_tokens !== void 0 && (Wt.context_used_tokens = f.context_used_tokens);
                let Nn = DSe(f);
                if (Nn && (Wt.last_served_model = Nn), Lt) {
                    let et = Lt;
                    Lt = void 0, ce = !0;
                    let wr = _e.event.ts ?? new Date().toISOString(),
                        Gt = await qSe(e, t, U?.compact_stats?.measured_at),
                        Ot = BSe({
                            completion: {
                                hadBoundary: !0,
                                history_pre: et.pre_tokens,
                                history_post: et.post_tokens,
                                origin: et.trigger
                            },
                            preTotal: U?.context_used_tokens,
                            postTotal: f?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: wr,
                            sessionKey: t,
                            gapCounts: Gt
                        });
                    Wt.last_compact_at = wr, Wt.compact_stats = Ot, p = Ot, Q("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: _e.event.id,
                        trigger: et.trigger,
                        pre_tokens: et.pre_tokens,
                        post_tokens: et.post_tokens
                    })
                }
                nn.sessionId && !Y && (Wt.sdk_session_id = nn.sessionId), Ze && (Wt.pending_fork_to = null), await rt(e, t, Wt)
            }), _e.event.ts && (we = _e.event.ts)
        } else {
            let ve = n.resume === !1 || Y ? void 0 : q.sessionId,
                _e = n.resume === !1 || n.runtime !== "codex" || Y ? void 0 : q.forkFrom;
            for (let ae of yt) {
                let Ze = !1,
                    Ae;
                if (ae.event.routing_hint?.intent === "history-control") {
                    let vt = Qi(ae.event.payload) ? ae.event.payload : void 0,
                        ga = (vt?.text ?? vt?.command ?? "").trim(),
                        ou = /^(\S+)/.exec(ga)?.[1]?.toLowerCase() ?? "";
                    if (ou === "/compact" && ae.event.source?.name === "idle-compact" && gft(ae.event.ts, {
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        })) {
                        Q("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey: t,
                            eventId: ae.event.id,
                            itemTs: ae.event.ts,
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        }), ae.item.eventId && (k.push(ae.item.eventId), await ue([ae.item.eventId], "stale-idle-compact")), ae.event.ts && (we = ae.event.ts);
                        continue
                    }
                    if (ou === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (Eo(t) === "channel") Ze = !0;
                        else {
                            let qc = "ℹ️ /compact is only available in interactive sessions.",
                                Xf = await $c(e, t, {
                                    item: ae.item,
                                    event: ae.event,
                                    outputText: qc,
                                    sdkSessionId: ve
                                });
                            M.push(...Xf.records), se(Xf.primaryRecord, qc), ae.item.eventId && (k.push(ae.item.eventId), await Ao(e, t, [ae.item.eventId]).catch(Qf => {
                                Z("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: ae.item.eventId,
                                    error: Qf instanceof Error ? Qf.message : String(Qf)
                                })
                            })), ae.event.ts && (we = ae.event.ts);
                            continue
                        } if (!Ze) {
                        let qc = await vft({
                            paths: e,
                            sessionKey: t,
                            sdk: x,
                            sessionInfo: {
                                ...q,
                                sessionId: ve
                            },
                            cmdToken: ou
                        });
                        if (!(ou === "/compact" && ae.event.source?.name === "idle-compact")) {
                            let Qf = await $c(e, t, {
                                item: ae.item,
                                event: ae.event,
                                outputText: qc,
                                sdkSessionId: ve
                            });
                            M.push(...Qf.records), se(Qf.primaryRecord, qc)
                        }
                        ae.item.eventId && (k.push(ae.item.eventId), await ue([ae.item.eventId], "history-control")), ae.event.ts && (we = ae.event.ts);
                        continue
                    }
                }
                let pt = He(ske(e, t, ae.event.session_key ?? t, n.onExecutionEvent, ae.event.id)),
                    Or = Qi(ae.event.payload) ? ae.event.payload : void 0,
                    pn = SH(ae.event.payload),
                    An = applyJobSdkConfigOverride(await xo(m, "effective_config_ms", async () => KV(e, ae.event)), n.jobContext?.sdkConfig),
                    dt = await NSe(e, An, n.jobContext?.sdkConfig),
                    it = OSe({
                        jobModel: n.jobContext?.model,
                        sessionModel: q.model,
                        config: An,
                        kindlessConfig: dt,
                        runtime: n.runtime
                    }),
                    bn = ASe({
                        jobEffort: n.jobContext?.effort,
                        sessionEffort: q.effort,
                        config: An,
                        kindlessConfig: dt,
                        runtime: n.runtime
                    }),
                    Bn = await MSe(e, t, {
                        runtime: n.runtime,
                        model: it.model,
                        modelOrigin: it.configLayer,
                        cwd: q.cwd,
                        effective: An,
                        kindlessConfig: dt,
                        jobOverlay: n.jobContext?.sdkConfig
                    }, {
                        anchor: ae,
                        precedingRecords: M,
                        bus: n.bus
                    }),
                    cr = _e,
                    nr = n.resume === !1 || cr || Y ? void 0 : ve,
                    Ar = EO(ae.event),
                    Cn = Eo(t) === "channel",
                    Ro = XSe({
                        consumed: F,
                        timeGapMinutes: An?.time_gap_minutes,
                        isChannelSession: Cn,
                        isUserMessage: Ar,
                        lastEventAt: we,
                        currentEventAt: ae.event.ts
                    }),
                    io = Cn && !Ar,
                    nn, iu = ae.prompt;
                if (ae.event.type === "job.spawn" && n.jobContext) {
                    let vt = Qi(Or?.tick) ? Or.tick : void 0;
                    if (vt) {
                        let Dr = vt.run_number,
                            ga = vt.triggered_at,
                            ou = vt.previous_run_at;
                        typeof Dr == "number" && typeof ga == "string" && (nn = {
                            run_number: Dr,
                            triggered_at: ga,
                            previous_run_at: typeof ou == "string" ? ou : null,
                            cron: n.jobContext.cron
                        })
                    }
                    nn && (iu = Ydt)
                }
                let Wt = !Re && oe ? oe : void 0,
                    et = (An?.auto_compact_idle_minutes ?? 0) > 0 && !K && V ? V : void 0,
                    wr = !Qe && Ve ? Ve : void 0,
                    Gt = C ? void 0 : A?.text,
                    Ot = buildTransientUserBlocks(iu, {
                        gatewayNotice: w ? void 0 : Se,
                        interruptedContext: P ? void 0 : ye,
                        skipRewind: z ? void 0 : Be,
                        isUserMessage: Ar,
                        timeGap: Ro,
                        jobTick: nn,
                        jobReceipts: Gt,
                        daemonRestartHint: Wt,
                        compactNotice: et,
                        boardUpdated: wr
                    }, q),
                    ei = Ot.jobReceiptsInjected;
                ei && (C = !0), F = F || Ot.timeGapInjected, Ot.compactNoticeInjected && (K = !0), !Re && Ot.daemonRestartHintInjected && (Re = !0, xe && await rt(e, t, {
                    last_seen_daemon_started_at: xe
                }).catch(() => {})), !Qe && Ot.boardUpdatedInjected && (Qe = !0, Pe && await rt(e, t, {
                    last_seen_board_hash: Pe
                }).catch(() => {}));
                let js = buildSystemPromptForChannelConfig(An, t, JSe(n.jobContext), n.memoryBoard, n.runtime),
                    Io = ZSe(n, An),
                    ha, gi = Date.now(),
                    A0e = n.onStream ? (vt, Dr) => n.onStream(vt, Dr, ae.event.id) : void 0,
                    Yf = {
                        anchorEventId: ae.event.id,
                        consumed: !0,
                        skipped: !1,
                        hadOutput: !1
                    };
                G.push(Yf);
                try {
                    ha = await VSe(e, t, x, {
                        ...ty,
                        onTurnAcknowledged: () => {
                            ei && ($ = !0), n.onSdkTurnStarted?.({
                                notifyOnly: io
                            })
                        },
                        prompt: Ot.blocks,
                        onStream: A0e,
                        anchorEventId: ae.event.id,
                        onExecutionEvent: pt,
                        sessionId: nr,
                        forkFrom: cr,
                        model: Bn.effectiveModel ?? it.model,
                        effort: bn.effort,
                        effortOrigin: bn.configLayer,
                        claudeContextRequirement: Bn.requirement,
                        claudeModelAliases: Bn.aliases,
                        claudeSettingsPath: Bn.settingsPath,
                        permissionMode: Io.permissionMode,
                        allowedTools: Io.allowedTools,
                        disallowedTools: Io.disallowedTools,
                        tools: Io.tools,
                        additionalDirectories: Io.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: $Se(n.runtime, n.memoryBoard, Io.additionalDirectories, e.memoryDir),
                        attachments: pn,
                        systemPrompt: js
                    })
                } catch (vt) {
                    if (isAgentSdkTurnInterruptedError(vt)) {
                        await ln(Ot), ae.item.eventId && k.push(ae.item.eventId), $e(), Fe = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(vt)) {
                        Yf.consumed = !1, Fe = !0;
                        break
                    }
                    if (isAbortLikeError(vt)) {
                        ae.item.eventId && k.push(ae.item.eventId), $e(), await $r(ae.prompt, Ot.interruptedContextInjected), Fe = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: ae,
                        error: vt,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : q.model
                        },
                        precedingRecords: M,
                        bus: n.bus
                    }), vt
                }
                let Nr = ha.sdkResult;
                if (await LSe(e, t, n.runtime, Nr), Nr.skipped && (Yf.skipped = !0, B = !0), u += Date.now() - gi, Nr.sessionId && (d = Nr.sessionId), g(Nr.usage), typeof Nr.firstTokenLatencyMs == "number" && (gH(m, "sdk_ttft_ms_total", Nr.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await $r(ae.prompt, Ot.interruptedContextInjected), Fe = !0, ae.item.eventId && k.push(ae.item.eventId), $e();
                    break
                }
                if (await ln(Ot), !Nr.skipped && !Ze) {
                    let vt = USe(ae.event, Nr),
                        Dr = await xo(m, "outbox_emit_ms", async () => $c(e, t, {
                            item: ae.item,
                            event: ae.event,
                            outputText: vt,
                            sdkSessionId: Nr.sessionId,
                            attachments: ha.outboundAttachments,
                            turnMeta: b()
                        }));
                    M.push(...Dr.records), Dr.primaryRecord && (Yf.hadOutput = !0), se(Dr.primaryRecord)
                } else if (Ze) Q("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: ae.event.id
                });
                else {
                    Q("[runner] Skip called — suppressing outbox", {
                        sessionKey: t,
                        eventId: ae.event.id
                    });
                    let vt = $e();
                    (ae.item.eventId || vt.length > 0) && await ue([...ae.item.eventId ? [ae.item.eventId] : [], ...vt], "skip-turn")
                }
                let ny = ae.event.source?.name === "idle-compact";
                if (Lt) {
                    let vt = Lt;
                    if (Lt = void 0, Ae = {
                            hadBoundary: !0,
                            history_pre: vt.pre_tokens,
                            history_post: vt.post_tokens,
                            origin: ny ? "idle-compact" : vt.trigger
                        }, vt.trigger === "manual" && !ny) {
                        let Dr = hft(vt),
                            ga = await $c(e, t, {
                                item: ae.item,
                                event: ae.event,
                                outputText: Dr,
                                sdkSessionId: Nr.sessionId ?? ve
                            });
                        M.push(...ga.records), ga.primaryRecord && (Yf.hadOutput = !0), se(ga.primaryRecord, Dr)
                    } else Q("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: ae.event.id,
                        trigger: vt.trigger,
                        idleCompact: ny,
                        pre_tokens: vt.pre_tokens,
                        post_tokens: vt.post_tokens
                    })
                } else if (Ze)
                    if (Ae = {
                            hadBoundary: !1,
                            origin: ny ? "idle-compact" : "manual"
                        }, ny) Q("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: ae.event.id
                    });
                    else {
                        let vt = "ℹ️ Nothing to compact.",
                            Dr = await $c(e, t, {
                                item: ae.item,
                                event: ae.event,
                                outputText: vt,
                                sdkSessionId: Nr.sessionId ?? ve
                            });
                        M.push(...Dr.records), Dr.primaryRecord && (Yf.hadOutput = !0), se(Dr.primaryRecord, vt)
                    } if (ae.item.eventId && k.push(ae.item.eventId), $e(), Nr.usedFallback && Nr.resumeError) {
                    let vt = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: ae.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: q.sessionId,
                            error: Nr.resumeError
                        }
                    });
                    await atomicAppendEvent(e, vt)
                }
                await xo(m, "session_upsert_ms", async () => {
                    let vt = {
                        cwd: q.cwd,
                        plane: q.plane,
                        permission_profile: q.permissionProfile,
                        last_event_id: ae.event.id,
                        last_event_at: ae.event.ts
                    };
                    f?.context_used_tokens !== void 0 && (vt.context_used_tokens = f.context_used_tokens);
                    let Dr = DSe(f);
                    Dr && (vt.last_served_model = Dr);
                    let ga = hH(ae.event.payload, "idle_ms"),
                        ou = hH(ae.event.payload, "threshold_at_fire");
                    if (Ae) {
                        ce = !0;
                        let UA = ae.event.ts ?? new Date().toISOString(),
                            qc = await qSe(e, t, U?.compact_stats?.measured_at),
                            Xf = BSe({
                                completion: Ae,
                                preTotal: U?.context_used_tokens,
                                postTotal: f?.context_used_tokens,
                                idleMs: ga,
                                thresholdAtFire: ou,
                                measuredAt: UA,
                                sessionKey: t,
                                gapCounts: qc
                            });
                        vt.last_compact_at = UA, vt.compact_stats = Xf, p = Xf
                    }
                    Nr.sessionId && !Y && (vt.sdk_session_id = Nr.sessionId), cr && (vt.pending_fork_to = null), await rt(e, t, vt)
                }), Ae?.origin === "idle-compact" && await bft(e, {
                    sessionKey: t,
                    preTokens: U?.context_used_tokens,
                    postTokens: f?.context_used_tokens,
                    idleMs: hH(ae.event.payload, "idle_ms")
                }), cr && (_e = void 0), Nr.sessionId && !Y && (ve = Nr.sessionId), ae.event.ts && (we = ae.event.ts)
            }
        }
        return await xo(m, "mailbox_finalize_ms", async () => {
            if (await Ao(e, t, k), k.length > 0 || L > 0) {
                let ve = `processed=${k.length} skipped=${L}${ee?` outbox=${ee}`:""}`;
                await cb(e, t, ve)
            }
        }), await y({
            cancelled: Fe,
            processedCount: k.length,
            skippedCount: L,
            replyText: J
        }), {
            processed: k.length,
            skipped: L,
            lockAcquired: !0,
            cancelled: Fe,
            turnSkipped: B,
            sdkTurns: G,
            compacted: ce,
            lastReplyText: J,
            lastOutboxId: ee,
            lastOutboxRecord: le,
            outboxRecords: M
        }
    } finally {
        clearInterval(s), await ySe(e, r)
    }
}
