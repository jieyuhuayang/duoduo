// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: zxe, daemon.pretty.js:70662)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.3.1, v0.3.4, v0.3.5, v0.3.7, v0.4.0, v0.4.2, v0.4.3, v0.4.5, v0.5.0, v0.5.1, v0.5.2, v0.5.3, v0.5.4, v0.5.5, v0.5.6, v0.5.7, v0.5.8, v0.5.10, v0.6.0, v0.6.2, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.2, v0.8.3, v0.8.4 (maps/history_daemon.json)
// changelog v0.5.4 (medium): surfaces a per-session "runtime unavailable" error instead of failing silently.
// changelog v0.5.5 (medium): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = hashSessionKey(t);
    if (!(await acquireSessionDrainLock(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let o = n.lockHeartbeatIntervalMs ?? 3e4,
        s = setInterval(async () => {
            try {
                await refreshSessionDrainLockHeartbeat(e, r)
            } catch {}
        }, o);
    s.unref?.(), logLatencyStageTelemetry("drain_started", t, {
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
            let E = n.getStreamGeneration?.(),
                P = detectInProcessBreak(f, h !== void 0 && E !== void 0 && E !== h);
            await appendDrainRecord(e, {
                id: Mxe.randomUUID(),
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
                suspected_in_process_break: P ? !0 : void 0
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
            E = f.cache_read_input_tokens ?? 0,
            R = f.cache_creation_input_tokens ?? 0,
            P = f.output_tokens ?? 0,
            k = f.total_cost_usd ?? 0,
            S = normalizeInputTokenTotals({
                protocol: f.protocol,
                input_tokens: _ - v.input_tokens,
                cache_read_input_tokens: E - v.cache_read,
                cache_creation_input_tokens: R - v.cache_create
            }),
            D = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: f.input_tokens === void 0 ? void 0 : S.totalInput,
                cache_hit_rate: mxe(S),
                output_tokens: f.output_tokens === void 0 ? void 0 : P - v.output_tokens,
                total_cost_usd: f.total_cost_usd === void 0 ? void 0 : k - v.total_cost_usd,
                model: f.model,
                context_used_tokens: f.context_used_tokens,
                protocol: f.protocol
            };
        return v = {
            input_tokens: _,
            cache_read: E,
            cache_create: R,
            output_tokens: P,
            total_cost_usd: k
        }, D
    }
    try {
        try {
            await runTimedDrainPhase(m, "mailbox_merge_ms", async () => mergeInboxIntoMailbox(e, t))
        } catch (Ie) {
            if (Oae(Ie)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw Ie
        }
        let _ = await runTimedDrainPhase(m, "mailbox_parse_ms", async () => listMailboxPendingItems(e, t));
        if (_.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (_.some(Ie => !Ie.eventId)) {
            let Ie = await Nae(e, t);
            if (Ie.removed > 0) {
                await appendSessionMailboxNote(e, t, `orphan_cleanup=${Ie.removed}`);
                let de = await listMailboxPendingItems(e, t);
                if (de.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                _ = de
            }
        }
        await runTimedDrainPhase(m, "mailbox_render_ms", async () => renderSessionMailboxFile(e, t, _));
        let R = n.batchSize ?? OW,
            P = n.mergeWindowMs ?? AW,
            k = n.sdk ?? createAgentSdkAdapter(),
            S = await batchDrainItems(e, _, {
                fallbackBatchSize: R,
                mergeWindowMs: P,
                perf: m
            });
        if (S.items.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        let D = S.items,
            A = await collectJobCompletionReceipts(e, t, _, S.events, m),
            $ = !1,
            C = !1,
            N = !1,
            x = [],
            M = 0,
            F = !1,
            J = [],
            ce = !1,
            ie, Ce, se, j = [],
            ne = async (Ie, de) => {
                Ie.length !== 0 && await deleteMailboxPendingItemsByEventIds(e, t, Ie).catch(X => {
                    logWarnMessage("[runner] eager markDone failed (will retry at drain end)", {
                        sessionKey: t,
                        stage: de,
                        eventIds: Ie,
                        error: X instanceof Error ? X.message : String(X)
                    })
                })
            }, K = () => {
                if (!C || N) return [];
                N = !0;
                let Ie = A?.eventIds ?? [];
                return x.push(...Ie), Ie
            }, te = (Ie, de) => {
                Ie && (ie = de ?? Ie.payload.text, Ce = Ie.id, se = Ie)
            }, B = async () => (await deleteMailboxPendingItemsByEventIds(e, t, x), await appendSessionMailboxNote(e, t, `processed=${x.length} skipped=${M} cancelled=true`), await y({
                cancelled: !0,
                processedCount: x.length,
                skippedCount: M,
                replyText: ie
            }), {
                processed: x.length,
                skipped: M,
                lockAcquired: !0,
                cancelled: !0,
                turnSkipped: F,
                sdkTurns: J,
                lastReplyText: ie,
                lastOutboxId: Ce,
                lastOutboxRecord: se,
                outboxRecords: j
            }), G = await runTimedDrainPhase(m, "session_state_ms", async () => readSessionRuntimeState(e, t)), H = buildSessionInfoFromState(e, t, G ?? void 0), q = n.jobContext?.stateless === !0, pe = G?.pending_gateway_notice, fe = G?.pending_interrupted_context, Se = G?.pending_skip_rewind, w = !1, T = !1, L = !1, z = G?.claude_cost_baseline, U = !1, Y = resolvePendingCompactNotice(G), me = !1, re = decideRestartHintInjection({
                currentDaemonStartedAt: IW,
                sessionKey: t,
                lastEventAt: G?.last_event_at,
                lastSeenDaemonStartedAt: G?.last_seen_daemon_started_at
            });
        re.writeLastSeenAtEntry && await patchSessionRuntimeState(e, t, {
            last_seen_daemon_started_at: re.writeLastSeenAtEntry
        }).catch(() => {});
        let Ee = re.inject ? {
                startedAt: IW
            } : void 0,
            Oe = re.writeLastSeenOnInjectSuccess,
            Xe = !1,
            nt = classifySessionKeyOrUnknown(t) === "channel" ? n.boardHash : void 0,
            Ze = decideBoardUpdatedInjection({
                currentBoardHash: nt,
                lastSeenBoardHash: G?.last_seen_board_hash
            });
        Ze.writeLastSeenAtEntry && await patchSessionRuntimeState(e, t, {
            last_seen_board_hash: Ze.writeLastSeenAtEntry
        }).catch(() => {});
        let qe = Ze.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            Ae = Ze.writeLastSeenOnInjectSuccess,
            ve = !1,
            je = G?.last_event_at,
            sn = !1,
            gt = [],
            Gt, Nn;
        for (let Ie of D) {
            if (!Ie.eventId) {
                M += 1;
                continue
            }
            let de = Ie.eventId;
            if (n.excludeEventIds?.has(de)) {
                M += 1;
                continue
            }
            let X = await runTimedDrainPhase(m, "outbox_lookup_ms", async () => findOutboxRecordByEventId(e, de));
            if (X) {
                x.push(de), ie = X.payload.text, Ce = X.id;
                continue
            }
            let bt = Ie.createdAt ? {
                    notAfter: Ie.createdAt
                } : void 0,
                jt = S.events.get(de) ?? await runTimedDrainPhase(m, "event_read_ms", async () => readEventById(e, de, bt));
            if (!jt) {
                logWarnMessage(`[runner] mailbox event unresolved: session_key=${t} event_id=${de} not_after=${bt?.notAfter??"none"} item_file=${Ie.file??"none"}`), M += 1;
                continue
            }
            gt.push({
                item: Ie,
                event: jt,
                prompt: renderMailboxEventPrompt(jt, t)
            })
        }
        if (n.onBatchContext && gt.length > 0) {
            let Ie = 0;
            for (let X of gt)
                if (X.event.type === "route.deliver") {
                    let bt = isNonNullObject(X.event.payload) ? X.event.payload : void 0,
                        jt = isNonNullObject(bt?.payload) ? bt.payload : void 0,
                        Lt = typeof jt?.notify_depth == "number" ? jt.notify_depth : 0;
                    Lt > Ie && (Ie = Lt)
                } let de = gt.map(X => X.item.eventId).filter(X => !!X);
            n.onBatchContext({
                maxNotifyDepth: Ie,
                eventIds: de
            })
        }
        let Us = async Ie => {
            let {
                guidance: de,
                stage: X,
                payloadExtra: bt,
                noteSuffix: jt
            } = Ie;
            if (classifySessionKeyOrUnknown(t) === "channel") {
                for (let Lt of gt) {
                    if (Lt.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: Lt,
                            error: new Error(de),
                            stage: X,
                            userText: de,
                            payloadExtra: bt,
                            bus: n.bus
                        }), Lt.item.eventId && x.push(Lt.item.eventId);
                        continue
                    }
                    let Xo = await emitDrainOutputRecords(e, t, {
                        item: Lt.item,
                        event: Lt.event,
                        outputText: de,
                        sdkSessionId: H.sessionId
                    });
                    j.push(...Xo.records), te(Xo.primaryRecord), Lt.item.eventId && x.push(Lt.item.eventId)
                }
                return await deleteMailboxPendingItemsByEventIds(e, t, x), await appendSessionMailboxNote(e, t, `processed=${x.length} skipped=${M} ${jt}`), {
                    processed: x.length,
                    skipped: M,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: ie,
                    lastOutboxId: Ce,
                    lastOutboxRecord: se,
                    outboxRecords: j,
                    refusedStage: X
                }
            }
            throw await handleDrainError(e, t, {
                anchor: gt[0],
                error: new Error(de),
                stage: X,
                userText: de,
                payloadExtra: bt,
                precedingRecords: j,
                bus: n.bus
            }), new Error(de)
        }, xr = {
            runtime: n.runtime,
            usesStreamingAdapter: n.usesStreamingAdapter,
            abortController: n.abortController,
            onTurnRejected: () => {
                C = !1, n.onSdkTurnRejected?.()
            },
            effort: H.effort,
            callerSession: t,
            cwd: H.cwd,
            settingSources: H.settingSources,
            persistSession: n.persistSession,
            mcpServers: n.mcpServers,
            mcpServersFactory: n.mcpServersFactory,
            holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
            boardHash: n.boardHash
        }, _t = dht(H.cwd);
        if (gt.length > 0 && _t) return Us({
            guidance: fht(t, H.cwd, _t),
            stage: "workspace_unavailable",
            payloadExtra: {
                outcome: "workspace_unavailable",
                cwd: H.cwd,
                reason: _t
            },
            noteSuffix: "workspace_unavailable=true"
        });
        if (gt.length > 0 && n.runtimeRefusal) return Us({
            guidance: `${n.runtimeRefusal} Request was not executed.`,
            stage: "runtime_refused",
            payloadExtra: {
                outcome: "runtime_refused"
            },
            noteSuffix: "runtime_refused"
        });
        let Wn = n.runtime ?? "claude",
            Re = n.runtimeUnavailableReason ?? (n.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (gt.length > 0 && Re) return Us({
            guidance: renderRuntimeUnavailableGuidance(Re, Wn),
            stage: "runtime_unavailable",
            payloadExtra: {
                outcome: "runtime_unavailable",
                runtime: Wn,
                runtime_source: n.runtime ? "explicit" : "default"
            },
            noteSuffix: `runtime_unavailable=${Wn}`
        });
        let ar = G?.sdk_session_id,
            Mi = G?.sdk_session_runtime;
        if (gt.length > 0 && !q && ar && Mi && Mi !== Wn) return Us({
            guidance: renderRuntimeMismatchGuidance({
                boundRuntime: Mi,
                sdkSessionId: ar,
                requestedRuntime: Wn,
                isChannel: classifySessionKeyOrUnknown(t) === "channel"
            }),
            stage: "runtime_mismatch",
            payloadExtra: {
                outcome: "runtime_mismatch",
                runtime: Wn,
                bound_runtime: Mi,
                sdk_session_id: ar
            },
            noteSuffix: `runtime_mismatch=${Mi}->${Wn}`
        });
        H.forkFrom && (n.runtime !== "codex" || q) && (H.forkFrom = void 0, await clearSessionRuntimeStateField(e, t, "pending_fork_to").catch(() => {})), await clearModelOverrideOnRuntimeFlip(e, t, {
            snapshotModel: G?.model,
            snapshotModelRuntime: G?.model_runtime,
            activeRuntime: n.runtime ?? "claude",
            sessionInfo: H
        }), G?.pending_model_fork && await resolvePendingModelFork(e, t, {
            snapshotModel: G.model,
            runtime: n.runtime,
            statelessJob: q,
            sessionInfo: H
        });
        let fn = Ie => async de => {
            if (de.type === "system" && de.subtype === "init" && de.data && typeof de.data.session_id == "string" && (Gt = de.data.session_id, H.sessionId && Gt !== H.sessionId && logWarnMessage("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: H.sessionId,
                    actualSessionId: Gt
                })), de.type === "system" && de.subtype === "compact_boundary" && de.data && typeof de.data == "object") {
                let X = de.data,
                    bt = X.trigger;
                (bt === "manual" || bt === "auto") && (Nn = {
                    trigger: bt,
                    pre_tokens: typeof X.pre_tokens == "number" ? X.pre_tokens : void 0,
                    post_tokens: typeof X.post_tokens == "number" ? X.post_tokens : void 0
                })
            }
            return de.type === "tool_use" ? l += 1 : de.type === "tool_result" && de.isError && (c += 1), Ie(de)
        }, gn = async () => {
            let Ie = Gt ?? H.sessionId;
            !Ie || n.skipSessionIdUpdate || q || await patchSessionRuntimeState(e, t, {
                sdk_session_id: Ie
            })
        }, Mn = async (Ie, de) => {
            await gn(), !(await readSessionRuntimeState(e, t))?.pending_skip_rewind && await qmt(e, t, zmt(Ie, de ? fe : void 0))
        }, ji = async Ie => {
            Ie.gatewayNoticeInjected && !w && (await Umt(e, t), w = !0), Ie.interruptedContextInjected && !T && (await Bmt(e, t), T = !0), Ie.skipRewindInjected && !L && (await Vmt(e, t), L = !0)
        };
        if (isMergeableDrainBatch(gt, t)) {
            let Ie = await prepareDrainTurnContext(e, t, n, gt, H, {
                    pendingGatewayNotice: pe,
                    pendingInterruptedContext: fe,
                    pendingSkipRewind: Se,
                    lastEventAtWatermark: je,
                    timeGapConsumed: U,
                    daemonRestartHint: Xe ? void 0 : Ee,
                    compactNotice: me ? void 0 : Y,
                    boardUpdated: ve ? void 0 : qe,
                    jobReceipts: $ ? void 0 : A?.text
                }, m, fn),
                {
                    anchor: de,
                    resumeSessionId: X,
                    forkFromSessionId: bt,
                    handleExecutionEvent: jt,
                    attachments: Lt,
                    batchEventIds: Xo,
                    coalescedPromptText: Ve,
                    injectionResult: xt,
                    systemPrompt: jn,
                    sdkRunConfig: Yt
                } = Ie,
                To = await Exe(e, Ie.anchorChannelConfig, n.jobContext?.sdkConfig),
                Jn = resolveTurnModelWithLayer({
                    jobModel: n.jobContext?.model,
                    sessionModel: H.model,
                    config: Ie.anchorChannelConfig,
                    kindlessConfig: To,
                    runtime: n.runtime
                }),
                Er = resolveTurnEffortWithLayer({
                    jobEffort: n.jobContext?.effort,
                    sessionEffort: H.effort,
                    config: Ie.anchorChannelConfig,
                    kindlessConfig: To,
                    runtime: n.runtime
                }),
                $n = await resolveDrainContextProfileOrRefuse(e, t, {
                    runtime: n.runtime,
                    model: Jn.model,
                    modelOrigin: Jn.configLayer,
                    cwd: H.cwd,
                    effective: Ie.anchorChannelConfig,
                    kindlessConfig: To,
                    jobOverlay: n.jobContext?.sdkConfig
                }, {
                    anchor: de,
                    precedingRecords: j,
                    bus: n.bus
                });
            U = Ie.timeGapConsumed;
            let Po = Ie.injectionResult.jobReceiptsInjected;
            Po && ($ = !0), !Xe && Ie.injectionResult.daemonRestartHintInjected && (Xe = !0, Oe && await patchSessionRuntimeState(e, t, {
                last_seen_daemon_started_at: Oe
            }).catch(() => {})), !ve && Ie.injectionResult.boardUpdatedInjected && (ve = !0, Ae && await patchSessionRuntimeState(e, t, {
                last_seen_board_hash: Ae
            }).catch(() => {})), logLatencyStageTelemetry("sdk_start", de.event.id, {
                eventIds: Xo,
                coalesced: gt.length > 1
            });
            let ao = Date.now(),
                gi = {
                    anchorEventId: de.event.id,
                    consumed: !0,
                    skipped: !1,
                    hadOutput: !1
                };
            J.push(gi);
            let va;
            try {
                let Ht = Ie.isNotifyOnly || Ie.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (dt, un) => n.onStream(dt, un, de.event.id);
                va = await runDrainQueryAndCollectOutboundAttachments(e, t, k, {
                    ...xr,
                    onTurnAcknowledged: () => {
                        Po && (C = !0), n.onSdkTurnStarted?.({
                            notifyOnly: Ie.isNotifyOnly
                        })
                    },
                    prompt: xt.blocks,
                    onStream: Ht,
                    anchorEventId: de.event.id,
                    onExecutionEvent: jt,
                    sessionId: X,
                    forkFrom: bt,
                    model: $n.effectiveModel ?? Jn.model,
                    effort: Er.effort,
                    effortOrigin: Er.configLayer,
                    claudeContextRequirement: $n.requirement,
                    claudeModelAliases: $n.aliases,
                    claudeSettingsPath: $n.settingsPath,
                    costBaseline: z,
                    permissionMode: Yt.permissionMode,
                    allowedTools: Yt.allowedTools,
                    disallowedTools: Yt.disallowedTools,
                    tools: Yt.tools,
                    additionalDirectories: Yt.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: resolveAdditionalDirClaudeMdAutoload(n.runtime, n.memoryBoard, Yt.additionalDirectories, e.memoryDir),
                    attachments: Lt,
                    systemPrompt: jn
                })
            } catch (Le) {
                if (isAgentSdkTurnInterruptedError(Le)) {
                    await ji(xt);
                    for (let Ht of gt) Ht.item.eventId && x.push(Ht.item.eventId);
                    return K(), B()
                }
                if (isAgentSdkPromptNotAcceptedAbortError(Le)) return gi.consumed = !1, B();
                if (isAbortLikeError(Le)) {
                    for (let Ht of gt) Ht.item.eventId && x.push(Ht.item.eventId);
                    return K(), await Mn(Ve, xt.interruptedContextInjected), B()
                }
                throw await handleDrainError(e, t, {
                    anchor: de,
                    error: Le,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : H.model
                    },
                    precedingRecords: j,
                    bus: n.bus
                }), Le
            }
            let an = va.sdkResult;
            if (u += Date.now() - ao, await markTurnSkippedFromSkipRecord(e, t, n.runtime, an), an.skipped && (gi.skipped = !0, F = !0), an.sessionId && (d = an.sessionId), g(an.usage), typeof an.firstTokenLatencyMs == "number" && (addToNumericField(m, "sdk_ttft_ms_total", an.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), logLatencyStageTelemetry("sdk_end", de.event.id, {
                    eventIds: Xo,
                    sdkDurationMs: Date.now() - ao,
                    usedFallback: an.usedFallback
                }), n.abortController?.signal.aborted) {
                await Mn(Ve, xt.interruptedContextInjected);
                for (let Le of gt) Le.item.eventId && x.push(Le.item.eventId);
                return K(), B()
            }
            if (await ji(xt), an.skipped) logInfoMessage("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: de.event.id
            });
            else {
                let Le = Oxe(de.event, an),
                    Ht = await runTimedDrainPhase(m, "outbox_emit_ms", async () => emitDrainOutputRecords(e, t, {
                        item: de.item,
                        event: de.event,
                        outputText: Le,
                        sdkSessionId: an.sessionId,
                        batchedEventIds: gt.map(dt => dt.event.id),
                        attachments: va.outboundAttachments,
                        turnMeta: b()
                    }));
                if (j.push(...Ht.records), Ht.primaryRecord) {
                    gi.hadOutput = !0, logLatencyStageTelemetry("outbox_written", de.event.id, {
                        outboxId: Ht.primaryRecord.id,
                        eventIds: Xo
                    }), te(Ht.primaryRecord);
                    for (let dt of gt.slice(0, -1)) dt.item.eventId && await tq(e, dt.item.eventId, Ht.primaryRecord)
                }
            }
            for (let Le of gt) Le.item.eventId && x.push(Le.item.eventId);
            let gl = K();
            if (an.skipped) {
                let Le = [...gt.map(Ht => Ht.item.eventId).filter(Ht => !!Ht), ...gl];
                await ne(Le, "skip-turn")
            }
            if (an.usedFallback && an.resumeError) {
                let Le = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: de.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: H.sessionId,
                        error: an.resumeError
                    }
                });
                await atomicAppendEvent(e, Le)
            }
            await runTimedDrainPhase(m, "session_upsert_ms", async () => {
                let Le = {
                    cwd: H.cwd,
                    plane: H.plane,
                    permission_profile: H.permissionProfile,
                    last_event_id: de.event.id,
                    last_event_at: de.event.ts
                };
                f?.context_used_tokens !== void 0 && (Le.context_used_tokens = f.context_used_tokens);
                let Ht = extractServedModelFromUsage(f);
                if (Ht && (Le.last_served_model = Ht), Nn) {
                    let dt = Nn;
                    Nn = void 0, ce = !0;
                    let un = de.event.ts ?? new Date().toISOString(),
                        Hr = await Axe(e, t, G?.compact_stats?.measured_at),
                        nr = Nxe({
                            completion: {
                                hadBoundary: !0,
                                history_pre: dt.pre_tokens,
                                history_post: dt.post_tokens,
                                origin: dt.trigger
                            },
                            preTotal: G?.context_used_tokens,
                            postTotal: f?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: un,
                            sessionKey: t,
                            gapCounts: Hr
                        });
                    Le.last_compact_at = un, Le.compact_stats = nr, p = nr, logInfoMessage("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: de.event.id,
                        trigger: dt.trigger,
                        pre_tokens: dt.pre_tokens,
                        post_tokens: dt.post_tokens
                    })
                }
                an.sessionId && !q && (Le.sdk_session_id = an.sessionId, Le.sdk_session_runtime = Wn, an.costBaseline && (Le.claude_cost_baseline = an.costBaseline, z = an.costBaseline)), bt && (Le.pending_fork_to = null), await patchSessionRuntimeState(e, t, Le)
            }), de.event.ts && (je = de.event.ts)
        } else {
            let Ie = n.resume === !1 || q ? void 0 : H.sessionId,
                de = n.resume === !1 || n.runtime !== "codex" || q ? void 0 : H.forkFrom;
            for (let X of gt) {
                let bt = !1,
                    jt;
                if (X.event.routing_hint?.intent === "history-control") {
                    let ht = isNonNullObject(X.event.payload) ? X.event.payload : void 0,
                        wa = (ht?.text ?? ht?.command ?? "").trim(),
                        mu = /^(\S+)/.exec(wa)?.[1]?.toLowerCase() ?? "";
                    if (mu === "/compact" && X.event.source?.name === "idle-compact" && rht(X.event.ts, {
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        })) {
                        logInfoMessage("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey: t,
                            eventId: X.event.id,
                            itemTs: X.event.ts,
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        }), X.item.eventId && (x.push(X.item.eventId), await ne([X.item.eventId], "stale-idle-compact")), X.event.ts && (je = X.event.ts);
                        continue
                    }
                    if (mu === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (classifySessionKeyOrUnknown(t) === "channel") bt = !0;
                        else {
                            let ed = "ℹ️ /compact is only available in interactive sessions.",
                                mp = await emitDrainOutputRecords(e, t, {
                                    item: X.item,
                                    event: X.event,
                                    outputText: ed,
                                    sdkSessionId: Ie
                                });
                            j.push(...mp.records), te(mp.primaryRecord, ed), X.item.eventId && (x.push(X.item.eventId), await deleteMailboxPendingItemsByEventIds(e, t, [X.item.eventId]).catch(hp => {
                                logWarnMessage("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: X.item.eventId,
                                    error: hp instanceof Error ? hp.message : String(hp)
                                })
                            })), X.event.ts && (je = X.event.ts);
                            continue
                        } if (!bt) {
                        let ed = await runHistoryControlCommand({
                            paths: e,
                            sessionKey: t,
                            sdk: k,
                            sessionInfo: {
                                ...H,
                                sessionId: Ie
                            },
                            cmdToken: mu
                        });
                        if (!(mu === "/compact" && X.event.source?.name === "idle-compact")) {
                            let hp = await emitDrainOutputRecords(e, t, {
                                item: X.item,
                                event: X.event,
                                outputText: ed,
                                sdkSessionId: Ie
                            });
                            j.push(...hp.records), te(hp.primaryRecord, ed)
                        }
                        X.item.eventId && (x.push(X.item.eventId), await ne([X.item.eventId], "history-control")), X.event.ts && (je = X.event.ts);
                        continue
                    }
                }
                let Lt = fn(createDrainExecutionEventRecorder(e, t, X.event.session_key ?? t, n.onExecutionEvent, X.event.id)),
                    Xo = isNonNullObject(X.event.payload) ? X.event.payload : void 0,
                    Ve = extractPayloadMediaRefs(X.event.payload),
                    xt = applyJobSdkConfigOverride(await runTimedDrainPhase(m, "effective_config_ms", async () => resolveEffectiveChannelConfigForEvent(e, X.event)), n.jobContext?.sdkConfig),
                    jn = await Exe(e, xt, n.jobContext?.sdkConfig),
                    Yt = resolveTurnModelWithLayer({
                        jobModel: n.jobContext?.model,
                        sessionModel: H.model,
                        config: xt,
                        kindlessConfig: jn,
                        runtime: n.runtime
                    }),
                    To = resolveTurnEffortWithLayer({
                        jobEffort: n.jobContext?.effort,
                        sessionEffort: H.effort,
                        config: xt,
                        kindlessConfig: jn,
                        runtime: n.runtime
                    }),
                    Jn = await resolveDrainContextProfileOrRefuse(e, t, {
                        runtime: n.runtime,
                        model: Yt.model,
                        modelOrigin: Yt.configLayer,
                        cwd: H.cwd,
                        effective: xt,
                        kindlessConfig: jn,
                        jobOverlay: n.jobContext?.sdkConfig
                    }, {
                        anchor: X,
                        precedingRecords: j,
                        bus: n.bus
                    }),
                    Er = de,
                    $n = n.resume === !1 || Er || q ? void 0 : Ie,
                    Po = isChannelMessageEvent(X.event),
                    ao = classifySessionKeyOrUnknown(t) === "channel",
                    gi = computeTimeGapContext({
                        consumed: U,
                        timeGapMinutes: xt?.time_gap_minutes,
                        isChannelSession: ao,
                        isUserMessage: Po,
                        lastEventAt: je,
                        currentEventAt: X.event.ts
                    }),
                    va = ao && !Po,
                    an, gl = X.prompt;
                if (X.event.type === "job.spawn" && n.jobContext) {
                    let ht = isNonNullObject(Xo?.tick) ? Xo.tick : void 0;
                    if (ht) {
                        let Dr = ht.run_number,
                            wa = ht.triggered_at,
                            mu = ht.previous_run_at;
                        typeof Dr == "number" && typeof wa == "string" && (an = {
                            run_number: Dr,
                            triggered_at: wa,
                            previous_run_at: typeof mu == "string" ? mu : null,
                            cron: n.jobContext.cron
                        })
                    }
                    an && (gl = Lmt)
                }
                let Le = !Xe && Ee ? Ee : void 0,
                    dt = (xt?.auto_compact_idle_minutes ?? 0) > 0 && !me && Y ? Y : void 0,
                    un = !ve && qe ? qe : void 0,
                    Hr = $ ? void 0 : A?.text,
                    nr = buildTransientUserBlocks(gl, {
                        gatewayNotice: w ? void 0 : pe,
                        interruptedContext: T ? void 0 : fe,
                        skipRewind: L ? void 0 : Se,
                        isUserMessage: Po,
                        timeGap: gi,
                        jobTick: an,
                        jobReceipts: Hr,
                        daemonRestartHint: Le,
                        compactNotice: dt,
                        boardUpdated: un
                    }, H),
                    pu = nr.jobReceiptsInjected;
                pu && ($ = !0), U = U || nr.timeGapInjected, nr.compactNoticeInjected && (me = !0), !Xe && nr.daemonRestartHintInjected && (Xe = !0, Oe && await patchSessionRuntimeState(e, t, {
                    last_seen_daemon_started_at: Oe
                }).catch(() => {})), !ve && nr.boardUpdatedInjected && (ve = !0, Ae && await patchSessionRuntimeState(e, t, {
                    last_seen_board_hash: Ae
                }).catch(() => {}));
                let yl = buildSystemPromptForChannelConfig(xt, t, projectJobPromptContext(n.jobContext), n.memoryBoard, n.runtime),
                    hr = buildTurnSdkRunConfig(n, xt),
                    NN, TIe = Date.now(),
                    PIe = n.onStream ? (ht, Dr) => n.onStream(ht, Dr, X.event.id) : void 0,
                    pp = {
                        anchorEventId: X.event.id,
                        consumed: !0,
                        skipped: !1,
                        hadOutput: !1
                    };
                J.push(pp);
                try {
                    NN = await runDrainQueryAndCollectOutboundAttachments(e, t, k, {
                        ...xr,
                        onTurnAcknowledged: () => {
                            pu && (C = !0), n.onSdkTurnStarted?.({
                                notifyOnly: va
                            })
                        },
                        prompt: nr.blocks,
                        onStream: PIe,
                        anchorEventId: X.event.id,
                        onExecutionEvent: Lt,
                        sessionId: $n,
                        forkFrom: Er,
                        model: Jn.effectiveModel ?? Yt.model,
                        effort: To.effort,
                        effortOrigin: To.configLayer,
                        claudeContextRequirement: Jn.requirement,
                        claudeModelAliases: Jn.aliases,
                        claudeSettingsPath: Jn.settingsPath,
                        costBaseline: z,
                        permissionMode: hr.permissionMode,
                        allowedTools: hr.allowedTools,
                        disallowedTools: hr.disallowedTools,
                        tools: hr.tools,
                        additionalDirectories: hr.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: resolveAdditionalDirClaudeMdAutoload(n.runtime, n.memoryBoard, hr.additionalDirectories, e.memoryDir),
                        attachments: Ve,
                        systemPrompt: yl
                    })
                } catch (ht) {
                    if (isAgentSdkTurnInterruptedError(ht)) {
                        await ji(nr), X.item.eventId && x.push(X.item.eventId), K(), sn = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(ht)) {
                        pp.consumed = !1, sn = !0;
                        break
                    }
                    if (isAbortLikeError(ht)) {
                        X.item.eventId && x.push(X.item.eventId), K(), await Mn(X.prompt, nr.interruptedContextInjected), sn = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: X,
                        error: ht,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : H.model
                        },
                        precedingRecords: j,
                        bus: n.bus
                    }), ht
                }
                let ur = NN.sdkResult;
                if (await markTurnSkippedFromSkipRecord(e, t, n.runtime, ur), ur.skipped && (pp.skipped = !0, F = !0), u += Date.now() - TIe, ur.sessionId && (d = ur.sessionId), g(ur.usage), typeof ur.firstTokenLatencyMs == "number" && (addToNumericField(m, "sdk_ttft_ms_total", ur.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await Mn(X.prompt, nr.interruptedContextInjected), sn = !0, X.item.eventId && x.push(X.item.eventId), K();
                    break
                }
                if (await ji(nr), !ur.skipped && !bt) {
                    let ht = Oxe(X.event, ur),
                        Dr = await runTimedDrainPhase(m, "outbox_emit_ms", async () => emitDrainOutputRecords(e, t, {
                            item: X.item,
                            event: X.event,
                            outputText: ht,
                            sdkSessionId: ur.sessionId,
                            attachments: NN.outboundAttachments,
                            turnMeta: b()
                        }));
                    j.push(...Dr.records), Dr.primaryRecord && (pp.hadOutput = !0), te(Dr.primaryRecord)
                } else if (bt) logInfoMessage("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: X.event.id
                });
                else {
                    logInfoMessage("[runner] Skip called — suppressing outbox", {
                        sessionKey: t,
                        eventId: X.event.id
                    });
                    let ht = K();
                    (X.item.eventId || ht.length > 0) && await ne([...X.item.eventId ? [X.item.eventId] : [], ...ht], "skip-turn")
                }
                let xy = X.event.source?.name === "idle-compact";
                if (Nn) {
                    let ht = Nn;
                    if (Nn = void 0, jt = {
                            hadBoundary: !0,
                            history_pre: ht.pre_tokens,
                            history_post: ht.post_tokens,
                            origin: xy ? "idle-compact" : ht.trigger
                        }, ht.trigger === "manual" && !xy) {
                        let Dr = nht(ht),
                            wa = await emitDrainOutputRecords(e, t, {
                                item: X.item,
                                event: X.event,
                                outputText: Dr,
                                sdkSessionId: ur.sessionId ?? Ie
                            });
                        j.push(...wa.records), wa.primaryRecord && (pp.hadOutput = !0), te(wa.primaryRecord, Dr)
                    } else logInfoMessage("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: X.event.id,
                        trigger: ht.trigger,
                        idleCompact: xy,
                        pre_tokens: ht.pre_tokens,
                        post_tokens: ht.post_tokens
                    })
                } else if (bt)
                    if (jt = {
                            hadBoundary: !1,
                            origin: xy ? "idle-compact" : "manual"
                        }, xy) logInfoMessage("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: X.event.id
                    });
                    else {
                        let ht = "ℹ️ Nothing to compact.",
                            Dr = await emitDrainOutputRecords(e, t, {
                                item: X.item,
                                event: X.event,
                                outputText: ht,
                                sdkSessionId: ur.sessionId ?? Ie
                            });
                        j.push(...Dr.records), Dr.primaryRecord && (pp.hadOutput = !0), te(Dr.primaryRecord, ht)
                    } if (X.item.eventId && x.push(X.item.eventId), K(), ur.usedFallback && ur.resumeError) {
                    let ht = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: X.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: H.sessionId,
                            error: ur.resumeError
                        }
                    });
                    await atomicAppendEvent(e, ht)
                }
                await runTimedDrainPhase(m, "session_upsert_ms", async () => {
                    let ht = {
                        cwd: H.cwd,
                        plane: H.plane,
                        permission_profile: H.permissionProfile,
                        last_event_id: X.event.id,
                        last_event_at: X.event.ts
                    };
                    f?.context_used_tokens !== void 0 && (ht.context_used_tokens = f.context_used_tokens);
                    let Dr = extractServedModelFromUsage(f);
                    Dr && (ht.last_served_model = Dr);
                    let wa = TW(X.event.payload, "idle_ms"),
                        mu = TW(X.event.payload, "threshold_at_fire");
                    if (jt) {
                        ce = !0;
                        let DN = X.event.ts ?? new Date().toISOString(),
                            ed = await Axe(e, t, G?.compact_stats?.measured_at),
                            mp = Nxe({
                                completion: jt,
                                preTotal: G?.context_used_tokens,
                                postTotal: f?.context_used_tokens,
                                idleMs: wa,
                                thresholdAtFire: mu,
                                measuredAt: DN,
                                sessionKey: t,
                                gapCounts: ed
                            });
                        ht.last_compact_at = DN, ht.compact_stats = mp, p = mp
                    }
                    ur.sessionId && !q && (ht.sdk_session_id = ur.sessionId, ht.sdk_session_runtime = Wn, ur.costBaseline && (ht.claude_cost_baseline = ur.costBaseline, z = ur.costBaseline)), Er && (ht.pending_fork_to = null), await patchSessionRuntimeState(e, t, ht)
                }), jt?.origin === "idle-compact" && await sht(e, {
                    sessionKey: t,
                    preTokens: G?.context_used_tokens,
                    postTokens: f?.context_used_tokens,
                    idleMs: TW(X.event.payload, "idle_ms")
                }), Er && (de = void 0), ur.sessionId && !q && (Ie = ur.sessionId), X.event.ts && (je = X.event.ts)
            }
        }
        return await runTimedDrainPhase(m, "mailbox_finalize_ms", async () => {
            if (await deleteMailboxPendingItemsByEventIds(e, t, x), x.length > 0 || M > 0) {
                let Ie = `processed=${x.length} skipped=${M}${Ce?` outbox=${Ce}`:""}`;
                await appendSessionMailboxNote(e, t, Ie)
            }
        }), await y({
            cancelled: sn,
            processedCount: x.length,
            skippedCount: M,
            replyText: ie
        }), {
            processed: x.length,
            skipped: M,
            lockAcquired: !0,
            cancelled: sn,
            turnSkipped: F,
            sdkTurns: J,
            compacted: ce,
            lastReplyText: ie,
            lastOutboxId: Ce,
            lastOutboxRecord: se,
            outboxRecords: j
        }
    } finally {
        clearInterval(s), await releaseSessionDrainLock(e, r)
    }
}
