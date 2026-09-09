// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: W_e, daemon.pretty.js:64516)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
    let r = vo(t);
    if (!(await f_e(e, r)).acquired) return {
        processed: 0,
        skipped: 0,
        lockAcquired: !1,
        cancelled: !1
    };
    let o = n.lockHeartbeatIntervalMs ?? 3e4,
        s = setInterval(async () => {
            try {
                await p_e(e, r)
            } catch {}
        }, o);
    s.unref?.(), eo("drain_started", t, {
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
            let I = n.getStreamGeneration?.(),
                P = XL(p, h !== void 0 && I !== void 0 && I !== h);
            await appendDrainRecord(e, {
                id: q_e.randomUUID(),
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
                suspected_in_process_break: P ? !0 : void 0
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
            I = p.cache_read_input_tokens ?? 0,
            T = p.cache_creation_input_tokens ?? 0,
            P = p.output_tokens ?? 0,
            k = p.total_cost_usd ?? 0,
            S = b_e({
                protocol: p.protocol,
                input_tokens: b - w.input_tokens,
                cache_read_input_tokens: I - w.cache_read,
                cache_creation_input_tokens: T - w.cache_create
            }),
            D = {
                elapsed_ms: Date.now() - a,
                total_input_tokens: p.input_tokens === void 0 ? void 0 : S.totalInput,
                cache_hit_rate: v_e(S),
                output_tokens: p.output_tokens === void 0 ? void 0 : P - w.output_tokens,
                total_cost_usd: p.total_cost_usd === void 0 ? void 0 : k - w.total_cost_usd,
                model: p.model,
                context_used_tokens: p.context_used_tokens,
                protocol: p.protocol
            };
        return w = {
            input_tokens: b,
            cache_read: I,
            cache_create: T,
            output_tokens: P,
            total_cost_usd: k
        }, D
    }
    try {
        try {
            await po(m, "mailbox_merge_ms", async () => qE(e, t))
        } catch (Se) {
            if (Dre(Se)) return {
                processed: 0,
                skipped: 0,
                lockAcquired: !0,
                cancelled: !1,
                mergeTransientFailure: !0
            };
            throw Se
        }
        let b = await po(m, "mailbox_parse_ms", async () => l_(e, t));
        if (b.length === 0) return {
            processed: 0,
            skipped: 0,
            lockAcquired: !0,
            cancelled: !1
        };
        if (b.some(Se => !Se.eventId)) {
            let Se = await jre(e, t);
            if (Se.removed > 0) {
                await u_(e, t, `orphan_cleanup=${Se.removed}`);
                let ve = await l_(e, t);
                if (ve.length === 0) return {
                    processed: 0,
                    skipped: 0,
                    lockAcquired: !0,
                    cancelled: !1
                };
                b = ve
            }
        }
        await po(m, "mailbox_render_ms", async () => BE(e, t, b));
        let T = n.batchSize ?? FB,
            P = n.mergeWindowMs ?? zB,
            k = n.sdk ?? createAgentSdkAdapter(),
            S = await batchDrainItems(e, b, {
                fallbackBatchSize: T,
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
            $ = await Jot(e, t, b, S.events, m),
            C = !1,
            O = !1,
            j = !1,
            x = [],
            F = 0,
            q = !1,
            J = [],
            le = !1,
            oe, X, te, z = [],
            V = async (Se, ve) => {
                Se.length !== 0 && await wo(e, t, Se).catch(ie => {
                    W("[runner] eager markDone failed (will retry at drain end)", {
                        sessionKey: t,
                        stage: ve,
                        eventIds: Se,
                        error: ie instanceof Error ? ie.message : String(ie)
                    })
                })
            }, pe = () => {
                if (!O || j) return [];
                j = !0;
                let Se = $?.eventIds ?? [];
                return x.push(...Se), Se
            }, ae = (Se, ve) => {
                Se && (oe = ve ?? Se.payload.text, X = Se.id, te = Se)
            }, L = async () => (await wo(e, t, x), await u_(e, t, `processed=${x.length} skipped=${F} cancelled=true`), await y({
                cancelled: !0,
                processedCount: x.length,
                skippedCount: F,
                replyText: oe
            }), {
                processed: x.length,
                skipped: F,
                lockAcquired: !0,
                cancelled: !0,
                lastReplyText: oe,
                lastOutboxId: X,
                lastOutboxRecord: te,
                outboxRecords: z
            }), M = await po(m, "session_state_ms", async () => ct(e, t)), U = Th(e, t, M ?? void 0), G = n.jobContext?.stateless === !0;
        U.forkFrom && (n.runtime !== "codex" || G) && (U.forkFrom = void 0, await Ns(e, t, "pending_fork_to").catch(() => {})), await rst(e, t, {
            snapshotModel: M?.model,
            snapshotModelRuntime: M?.model_runtime,
            activeRuntime: n.runtime ?? "claude",
            sessionInfo: U
        }), M?.pending_model_fork && await ist(e, t, {
            snapshotModel: M.model,
            runtime: n.runtime,
            statelessJob: G,
            sessionInfo: U
        });
        let ne = M?.pending_gateway_notice,
            Q = M?.pending_interrupted_context,
            Ae = M?.pending_skip_rewind,
            _ = !1,
            E = !1,
            N = !1,
            K = !1,
            B = Iot(M),
            se = !1,
            me = Phe({
                currentDaemonStartedAt: NB,
                sessionKey: t,
                lastEventAt: M?.last_event_at,
                lastSeenDaemonStartedAt: M?.last_seen_daemon_started_at
            });
        me.writeLastSeenAtEntry && await Qe(e, t, {
            last_seen_daemon_started_at: me.writeLastSeenAtEntry
        }).catch(() => {});
        let be = me.inject ? {
                startedAt: NB
            } : void 0,
            De = me.writeLastSeenOnInjectSuccess,
            Be = !1,
            $t = mo(t) === "channel" ? n.boardHash : void 0,
            ot = x_e({
                currentBoardHash: $t,
                lastSeenBoardHash: M?.last_seen_board_hash
            });
        ot.writeLastSeenAtEntry && await Qe(e, t, {
            last_seen_board_hash: ot.writeLastSeenAtEntry
        }).catch(() => {});
        let Gt = ot.inject && n.memoryBoard ? {
                boardPath: n.memoryBoard.path
            } : void 0,
            Fe = ot.writeLastSeenOnInjectSuccess,
            et = !1,
            Ie = M?.last_event_at,
            ze = !1,
            ft = [],
            fr, Ut;
        for (let Se of D) {
            if (!Se.eventId) {
                F += 1;
                continue
            }
            let ve = Se.eventId;
            if (n.excludeEventIds?.has(ve)) {
                F += 1;
                continue
            }
            let ie = await po(m, "outbox_lookup_ms", async () => cm(e, ve));
            if (ie) {
                x.push(ve), oe = ie.payload.text, X = ie.id;
                continue
            }
            let Je = Se.createdAt ? {
                    notAfter: Se.createdAt
                } : void 0,
                Ne = S.events.get(ve) ?? await po(m, "event_read_ms", async () => md(e, ve, Je));
            if (!Ne) {
                W(`[runner] mailbox event unresolved: session_key=${t} event_id=${ve} not_after=${Je?.notAfter??"none"} item_file=${Se.file??"none"}`), F += 1;
                continue
            }
            ft.push({
                item: Se,
                event: Ne,
                prompt: gC(Ne, t)
            })
        }
        if (n.onBatchContext && ft.length > 0) {
            let Se = 0;
            for (let ie of ft)
                if (ie.event.type === "route.deliver") {
                    let Je = Bi(ie.event.payload) ? ie.event.payload : void 0,
                        Ne = Bi(Je?.payload) ? Je.payload : void 0,
                        rt = typeof Ne?.notify_depth == "number" ? Ne.notify_depth : 0;
                    rt > Se && (Se = rt)
                } let ve = ft.map(ie => ie.item.eventId).filter(ie => !!ie);
            n.onBatchContext({
                maxNotifyDepth: Se,
                eventIds: ve
            })
        }
        let pr = async Se => {
            let {
                guidance: ve,
                stage: ie,
                payloadExtra: Je,
                noteSuffix: Ne
            } = Se;
            if (mo(t) === "channel") {
                for (let rt of ft) {
                    if (rt.event.source?.name === "idle-compact") {
                        await handleDrainError(e, t, {
                            anchor: rt,
                            error: new Error(ve),
                            stage: ie,
                            userText: ve,
                            payloadExtra: Je,
                            bus: n.bus
                        }), rt.item.eventId && x.push(rt.item.eventId);
                        continue
                    }
                    let Rr = await ac(e, t, {
                        item: rt.item,
                        event: rt.event,
                        outputText: ve,
                        sdkSessionId: U.sessionId
                    });
                    z.push(...Rr.records), ae(Rr.primaryRecord), rt.item.eventId && x.push(rt.item.eventId)
                }
                return await wo(e, t, x), await u_(e, t, `processed=${x.length} skipped=${F} ${Ne}`), {
                    processed: x.length,
                    skipped: F,
                    lockAcquired: !0,
                    cancelled: !1,
                    lastReplyText: oe,
                    lastOutboxId: X,
                    lastOutboxRecord: te,
                    outboxRecords: z
                }
            }
            throw await handleDrainError(e, t, {
                anchor: ft[0],
                error: new Error(ve),
                stage: ie,
                userText: ve,
                payloadExtra: Je,
                precedingRecords: z,
                bus: n.bus
            }), new Error(ve)
        }, ng = {
            runtime: n.runtime,
            usesStreamingAdapter: n.usesStreamingAdapter,
            abortController: n.abortController,
            onTurnRejected: () => {
                O = !1, n.onSdkTurnRejected?.()
            },
            effort: U.effort,
            cwd: U.cwd,
            settingSources: U.settingSources,
            persistSession: n.persistSession,
            mcpServers: n.mcpServers,
            mcpServersFactory: n.mcpServersFactory,
            holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
            boardHash: n.boardHash
        }, Ze = ost(U.cwd);
        if (ft.length > 0 && Ze) return pr({
            guidance: sst(t, U.cwd, Ze),
            stage: "workspace_unavailable",
            payloadExtra: {
                outcome: "workspace_unavailable",
                cwd: U.cwd,
                reason: Ze
            },
            noteSuffix: "workspace_unavailable=true"
        });
        let mr = n.runtime ?? "claude",
            Rn = n.runtimeUnavailableReason ?? (n.runtime === "claude" ? claudeUnavailableReason() : void 0);
        if (ft.length > 0 && Rn) return pr({
            guidance: ast(Rn, mr),
            stage: "runtime_unavailable",
            payloadExtra: {
                outcome: "runtime_unavailable",
                runtime: mr,
                runtime_source: n.runtime ? "explicit" : "default"
            },
            noteSuffix: `runtime_unavailable=${mr}`
        });
        let He = Se => async ve => {
            if (ve.type === "system" && ve.subtype === "init" && ve.data && typeof ve.data.session_id == "string" && (fr = ve.data.session_id, U.sessionId && fr !== U.sessionId && W("[runner] SDK session ID mismatch — context lost", {
                    sessionKey: t,
                    requestedSessionId: U.sessionId,
                    actualSessionId: fr
                })), ve.type === "system" && ve.subtype === "compact_boundary" && ve.data && typeof ve.data == "object") {
                let ie = ve.data,
                    Je = ie.trigger;
                (Je === "manual" || Je === "auto") && (Ut = {
                    trigger: Je,
                    pre_tokens: typeof ie.pre_tokens == "number" ? ie.pre_tokens : void 0,
                    post_tokens: typeof ie.post_tokens == "number" ? ie.post_tokens : void 0
                })
            }
            return ve.type === "tool_use" ? u += 1 : ve.type === "tool_result" && ve.isError && (c += 1), Se(ve)
        }, Br = async () => {
            let Se = fr ?? U.sessionId;
            !Se || n.skipSessionIdUpdate || G || await Qe(e, t, {
                sdk_session_id: Se
            })
        }, Er = async (Se, ve) => {
            await Br(), !(await ct(e, t))?.pending_skip_rewind && await Dot(e, t, Aot(Se, ve ? Q : void 0))
        }, nn = async Se => {
            Se.gatewayNoticeInjected && !_ && (await Not(e, t), _ = !0), Se.interruptedContextInjected && !E && (await Mot(e, t), E = !0), Se.skipRewindInjected && !N && (await jot(e, t), N = !0)
        };
        if (zot(ft, t)) {
            let Se = await UB(e, t, n, ft, U, {
                    pendingGatewayNotice: ne,
                    pendingInterruptedContext: Q,
                    pendingSkipRewind: Ae,
                    lastEventAtWatermark: Ie,
                    timeGapConsumed: K,
                    daemonRestartHint: Be ? void 0 : be,
                    compactNotice: se ? void 0 : B,
                    boardUpdated: et ? void 0 : Gt,
                    jobReceipts: C ? void 0 : $?.text
                }, m, He),
                {
                    anchor: ve,
                    resumeSessionId: ie,
                    forkFromSessionId: Je,
                    handleExecutionEvent: Ne,
                    attachments: rt,
                    batchEventIds: Rr,
                    coalescedPromptText: sn,
                    injectionResult: Pn,
                    systemPrompt: at,
                    sdkRunConfig: Xe
                } = Se,
                fn = await O_e(e, Se.anchorChannelConfig, n.jobContext?.sdkConfig),
                jn = P_e({
                    jobModel: n.jobContext?.model,
                    sessionModel: U.model,
                    config: Se.anchorChannelConfig,
                    kindlessConfig: fn,
                    runtime: n.runtime
                }),
                rr = C_e({
                    jobEffort: n.jobContext?.effort,
                    sessionEffort: U.effort,
                    config: Se.anchorChannelConfig,
                    kindlessConfig: fn,
                    runtime: n.runtime
                }),
                Zn = await A_e(e, t, {
                    runtime: n.runtime,
                    model: jn.model,
                    modelOrigin: jn.configLayer,
                    cwd: U.cwd,
                    effective: Se.anchorChannelConfig,
                    kindlessConfig: fn,
                    jobOverlay: n.jobContext?.sdkConfig
                }, {
                    anchor: ve,
                    precedingRecords: z,
                    bus: n.bus
                });
            K = Se.timeGapConsumed;
            let Tr = Se.injectionResult.jobReceiptsInjected;
            Tr && (C = !0), !Be && Se.injectionResult.daemonRestartHintInjected && (Be = !0, De && await Qe(e, t, {
                last_seen_daemon_started_at: De
            }).catch(() => {})), !et && Se.injectionResult.boardUpdatedInjected && (et = !0, Fe && await Qe(e, t, {
                last_seen_board_hash: Fe
            }).catch(() => {})), eo("sdk_start", ve.event.id, {
                eventIds: Rr,
                coalesced: ft.length > 1
            });
            let Tn = Date.now(),
                No;
            try {
                let an = Se.isNotifyOnly || Se.anchorChannelConfig?.stream === !1 || !n.onStream ? void 0 : (Ar, dt) => n.onStream(Ar, dt, ve.event.id);
                J.push({
                    anchorEventId: ve.event.id,
                    skipped: !1
                }), No = await U_e(e, t, k, {
                    ...ng,
                    onTurnAcknowledged: () => {
                        Tr && (O = !0), n.onSdkTurnStarted?.({
                            notifyOnly: Se.isNotifyOnly
                        })
                    },
                    prompt: Pn.blocks,
                    onStream: an,
                    anchorEventId: ve.event.id,
                    onExecutionEvent: Ne,
                    sessionId: ie,
                    forkFrom: Je,
                    model: Zn.effectiveModel ?? jn.model,
                    effort: rr.effort,
                    effortOrigin: rr.configLayer,
                    claudeContextRequirement: Zn.requirement,
                    claudeModelAliases: Zn.aliases,
                    claudeSettingsPath: Zn.settingsPath,
                    permissionMode: Xe.permissionMode,
                    allowedTools: Xe.allowedTools,
                    disallowedTools: Xe.disallowedTools,
                    tools: Xe.tools,
                    additionalDirectories: Xe.additionalDirectories,
                    autoloadAdditionalDirectoryClaudeMd: I_e(n.runtime, n.memoryBoard, Xe.additionalDirectories, e.memoryDir),
                    attachments: rt,
                    systemPrompt: at
                })
            } catch (qt) {
                if (isAgentSdkTurnInterruptedError(qt)) {
                    await nn(Pn);
                    for (let an of ft) an.item.eventId && x.push(an.item.eventId);
                    return pe(), L()
                }
                if (isAgentSdkPromptNotAcceptedAbortError(qt)) return L();
                if (isAbortLikeError(qt)) {
                    for (let an of ft) an.item.eventId && x.push(an.item.eventId);
                    return pe(), await Er(sn, Pn.interruptedContextInjected), L()
                }
                throw await handleDrainError(e, t, {
                    anchor: ve,
                    error: qt,
                    stage: "sdk_turn",
                    hintContext: {
                        runtime: n.runtime,
                        modelOverride: n.jobContext?.model ? void 0 : U.model
                    },
                    precedingRecords: z,
                    bus: n.bus
                }), qt
            }
            let Sn = No.sdkResult;
            if (l += Date.now() - Tn, await D_e(e, t, n.runtime, Sn), Sn.sessionId && (d = Sn.sessionId), g(Sn.usage), typeof Sn.firstTokenLatencyMs == "number" && (MB(m, "sdk_ttft_ms_total", Sn.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), eo("sdk_end", ve.event.id, {
                    eventIds: Rr,
                    sdkDurationMs: Date.now() - Tn,
                    usedFallback: Sn.usedFallback
                }), n.abortController?.signal.aborted) {
                await Er(sn, Pn.interruptedContextInjected);
                for (let qt of ft) qt.item.eventId && x.push(qt.item.eventId);
                return pe(), L()
            }
            if (await nn(Pn), Sn.skipped) q = !0, J[J.length - 1].skipped = !0, ee("[runner] Skip called — suppressing outbox", {
                sessionKey: t,
                eventId: ve.event.id
            });
            else {
                let qt = L_e(ve.event, Sn),
                    an = await po(m, "outbox_emit_ms", async () => ac(e, t, {
                        item: ve.item,
                        event: ve.event,
                        outputText: qt,
                        sdkSessionId: Sn.sessionId,
                        batchedEventIds: ft.map(Ar => Ar.event.id),
                        attachments: No.outboundAttachments,
                        turnMeta: v()
                    }));
                if (z.push(...an.records), an.primaryRecord) {
                    eo("outbox_written", ve.event.id, {
                        outboxId: an.primaryRecord.id,
                        eventIds: Rr
                    }), ae(an.primaryRecord);
                    for (let Ar of ft.slice(0, -1)) Ar.item.eventId && await VL(e, Ar.item.eventId, an.primaryRecord)
                }
            }
            for (let qt of ft) qt.item.eventId && x.push(qt.item.eventId);
            let Pi = pe();
            if (Sn.skipped) {
                let qt = [...ft.map(an => an.item.eventId).filter(an => !!an), ...Pi];
                await V(qt, "skip-turn")
            }
            if (Sn.usedFallback && Sn.resumeError) {
                let qt = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: ve.event.session_key ?? t,
                    payload: {
                        stage: "resume",
                        session_id: U.sessionId,
                        error: Sn.resumeError
                    }
                });
                await atomicAppendEvent(e, qt)
            }
            await po(m, "session_upsert_ms", async () => {
                let qt = {
                    cwd: U.cwd,
                    plane: U.plane,
                    permission_profile: U.permissionProfile,
                    last_event_id: ve.event.id,
                    last_event_at: ve.event.ts
                };
                p?.context_used_tokens !== void 0 && (qt.context_used_tokens = p.context_used_tokens);
                let an = $_e(p);
                if (an && (qt.last_served_model = an), Ut) {
                    let Ar = Ut;
                    Ut = void 0, le = !0;
                    let dt = ve.event.ts ?? new Date().toISOString(),
                        Hr = await F_e(e, t, M?.compact_stats?.measured_at),
                        Dt = z_e({
                            completion: {
                                hadBoundary: !0,
                                history_pre: Ar.pre_tokens,
                                history_post: Ar.post_tokens,
                                origin: Ar.trigger
                            },
                            preTotal: M?.context_used_tokens,
                            postTotal: p?.context_used_tokens,
                            idleMs: void 0,
                            measuredAt: dt,
                            sessionKey: t,
                            gapCounts: Hr
                        });
                    qt.last_compact_at = dt, qt.compact_stats = Dt, f = Dt, ee("[runner] reactive compact_boundary on coalesced turn — stamped, no channel ack", {
                        sessionKey: t,
                        eventId: ve.event.id,
                        trigger: Ar.trigger,
                        pre_tokens: Ar.pre_tokens,
                        post_tokens: Ar.post_tokens
                    })
                }
                Sn.sessionId && !G && (qt.sdk_session_id = Sn.sessionId), Je && (qt.pending_fork_to = null), await Qe(e, t, qt)
            }), ve.event.ts && (Ie = ve.event.ts)
        } else {
            let Se = n.resume === !1 || G ? void 0 : U.sessionId,
                ve = n.resume === !1 || n.runtime !== "codex" || G ? void 0 : U.forkFrom;
            for (let ie of ft) {
                let Je = !1,
                    Ne;
                if (ie.event.routing_hint?.intent === "history-control") {
                    let ht = Bi(ie.event.payload) ? ie.event.payload : void 0,
                        Ua = (ht?.text ?? ht?.command ?? "").trim(),
                        qa = /^(\S+)/.exec(Ua)?.[1]?.toLowerCase() ?? "";
                    if (qa === "/compact" && ie.event.source?.name === "idle-compact" && Yot(ie.event.ts, {
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        })) {
                        ee("[runner] dropping stale idle-compact item (no SDK call)", {
                            sessionKey: t,
                            eventId: ie.event.id,
                            itemTs: ie.event.ts,
                            actorSpawnedAt: n.actorSpawnedAt,
                            actorLastTurnCompletedAt: n.actorLastTurnCompletedAt
                        }), ie.item.eventId && (x.push(ie.item.eventId), await V([ie.item.eventId], "stale-idle-compact")), ie.event.ts && (Ie = ie.event.ts);
                        continue
                    }
                    if (qa === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
                        if (mo(t) === "channel") Je = !0;
                        else {
                            let _c = "ℹ️ /compact is only available in interactive sessions.",
                                wf = await ac(e, t, {
                                    item: ie.item,
                                    event: ie.event,
                                    outputText: _c,
                                    sdkSessionId: Se
                                });
                            z.push(...wf.records), ae(wf.primaryRecord, _c), ie.item.eventId && (x.push(ie.item.eventId), await wo(e, t, [ie.item.eventId]).catch(Sf => {
                                W("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
                                    sessionKey: t,
                                    eventId: ie.item.eventId,
                                    error: Sf instanceof Error ? Sf.message : String(Sf)
                                })
                            })), ie.event.ts && (Ie = ie.event.ts);
                            continue
                        } if (!Je) {
                        let _c = await tst({
                            paths: e,
                            sessionKey: t,
                            sdk: k,
                            sessionInfo: {
                                ...U,
                                sessionId: Se
                            },
                            cmdToken: qa
                        });
                        if (!(qa === "/compact" && ie.event.source?.name === "idle-compact")) {
                            let Sf = await ac(e, t, {
                                item: ie.item,
                                event: ie.event,
                                outputText: _c,
                                sdkSessionId: Se
                            });
                            z.push(...Sf.records), ae(Sf.primaryRecord, _c)
                        }
                        ie.item.eventId && (x.push(ie.item.eventId), await V([ie.item.eventId], "history-control")), ie.event.ts && (Ie = ie.event.ts);
                        continue
                    }
                }
                let rt = He(nbe(e, t, ie.event.session_key ?? t, n.onExecutionEvent, ie.event.id)),
                    Rr = Bi(ie.event.payload) ? ie.event.payload : void 0,
                    sn = qB(ie.event.payload),
                    Pn = applyJobSdkConfigOverride(await po(m, "effective_config_ms", async () => c4(e, ie.event)), n.jobContext?.sdkConfig),
                    at = await O_e(e, Pn, n.jobContext?.sdkConfig),
                    Xe = P_e({
                        jobModel: n.jobContext?.model,
                        sessionModel: U.model,
                        config: Pn,
                        kindlessConfig: at,
                        runtime: n.runtime
                    }),
                    fn = C_e({
                        jobEffort: n.jobContext?.effort,
                        sessionEffort: U.effort,
                        config: Pn,
                        kindlessConfig: at,
                        runtime: n.runtime
                    }),
                    jn = await A_e(e, t, {
                        runtime: n.runtime,
                        model: Xe.model,
                        modelOrigin: Xe.configLayer,
                        cwd: U.cwd,
                        effective: Pn,
                        kindlessConfig: at,
                        jobOverlay: n.jobContext?.sdkConfig
                    }, {
                        anchor: ie,
                        precedingRecords: z,
                        bus: n.bus
                    }),
                    rr = ve,
                    Zn = n.resume === !1 || rr || G ? void 0 : Se,
                    Tr = hC(ie.event),
                    Tn = mo(t) === "channel",
                    No = Z_e({
                        consumed: K,
                        timeGapMinutes: Pn?.time_gap_minutes,
                        isChannelSession: Tn,
                        isUserMessage: Tr,
                        lastEventAt: Ie,
                        currentEventAt: ie.event.ts
                    }),
                    Sn = Tn && !Tr,
                    Pi, qt = ie.prompt;
                if (ie.event.type === "job.spawn" && n.jobContext) {
                    let ht = Bi(Rr?.tick) ? Rr.tick : void 0;
                    if (ht) {
                        let Wr = ht.run_number,
                            Ua = ht.triggered_at,
                            qa = ht.previous_run_at;
                        typeof Wr == "number" && typeof Ua == "string" && (Pi = {
                            run_number: Wr,
                            triggered_at: Ua,
                            previous_run_at: typeof qa == "string" ? qa : null,
                            cron: n.jobContext.cron
                        })
                    }
                    Pi && (qt = Oot)
                }
                let an = !Be && be ? be : void 0,
                    dt = (Pn?.auto_compact_idle_minutes ?? 0) > 0 && !se && B ? B : void 0,
                    Hr = !et && Gt ? Gt : void 0,
                    Dt = C ? void 0 : $?.text,
                    Mt = buildTransientUserBlocks(qt, {
                        gatewayNotice: _ ? void 0 : ne,
                        interruptedContext: E ? void 0 : Q,
                        skipRewind: N ? void 0 : Ae,
                        isUserMessage: Tr,
                        timeGap: No,
                        jobTick: Pi,
                        jobReceipts: Dt,
                        daemonRestartHint: an,
                        compactNotice: dt,
                        boardUpdated: Hr
                    }, U),
                    Vr = Mt.jobReceiptsInjected;
                Vr && (C = !0), K = K || Mt.timeGapInjected, Mt.compactNoticeInjected && (se = !0), !Be && Mt.daemonRestartHintInjected && (Be = !0, De && await Qe(e, t, {
                    last_seen_daemon_started_at: De
                }).catch(() => {})), !et && Mt.boardUpdatedInjected && (et = !0, Fe && await Qe(e, t, {
                    last_seen_board_hash: Fe
                }).catch(() => {}));
                let _s = buildSystemPromptForChannelConfig(Pn, t, H_e(n.jobContext), n.memoryBoard, n.runtime),
                    ho = V_e(n, Pn),
                    Xs, li = Date.now(),
                    TSe = n.onStream ? (ht, Wr) => n.onStream(ht, Wr, ie.event.id) : void 0;
                J.push({
                    anchorEventId: ie.event.id,
                    skipped: !1
                });
                try {
                    Xs = await U_e(e, t, k, {
                        ...ng,
                        onTurnAcknowledged: () => {
                            Vr && (O = !0), n.onSdkTurnStarted?.({
                                notifyOnly: Sn
                            })
                        },
                        prompt: Mt.blocks,
                        onStream: TSe,
                        anchorEventId: ie.event.id,
                        onExecutionEvent: rt,
                        sessionId: Zn,
                        forkFrom: rr,
                        model: jn.effectiveModel ?? Xe.model,
                        effort: fn.effort,
                        effortOrigin: fn.configLayer,
                        claudeContextRequirement: jn.requirement,
                        claudeModelAliases: jn.aliases,
                        claudeSettingsPath: jn.settingsPath,
                        permissionMode: ho.permissionMode,
                        allowedTools: ho.allowedTools,
                        disallowedTools: ho.disallowedTools,
                        tools: ho.tools,
                        additionalDirectories: ho.additionalDirectories,
                        autoloadAdditionalDirectoryClaudeMd: I_e(n.runtime, n.memoryBoard, ho.additionalDirectories, e.memoryDir),
                        attachments: sn,
                        systemPrompt: _s
                    })
                } catch (ht) {
                    if (isAgentSdkTurnInterruptedError(ht)) {
                        await nn(Mt), ie.item.eventId && x.push(ie.item.eventId), pe(), ze = !0;
                        break
                    }
                    if (isAgentSdkPromptNotAcceptedAbortError(ht)) {
                        ze = !0;
                        break
                    }
                    if (isAbortLikeError(ht)) {
                        ie.item.eventId && x.push(ie.item.eventId), pe(), await Er(ie.prompt, Mt.interruptedContextInjected), ze = !0;
                        break
                    }
                    throw await handleDrainError(e, t, {
                        anchor: ie,
                        error: ht,
                        stage: "sdk_turn",
                        hintContext: {
                            runtime: n.runtime,
                            modelOverride: n.jobContext?.model ? void 0 : U.model
                        },
                        precedingRecords: z,
                        bus: n.bus
                    }), ht
                }
                let Nr = Xs.sdkResult;
                if (await D_e(e, t, n.runtime, Nr), l += Date.now() - li, Nr.sessionId && (d = Nr.sessionId), g(Nr.usage), typeof Nr.firstTokenLatencyMs == "number" && (MB(m, "sdk_ttft_ms_total", Nr.firstTokenLatencyMs), m.sdk_ttft_samples = (m.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
                    await Er(ie.prompt, Mt.interruptedContextInjected), ze = !0, ie.item.eventId && x.push(ie.item.eventId), pe();
                    break
                }
                if (await nn(Mt), !Nr.skipped && !Je) {
                    let ht = L_e(ie.event, Nr),
                        Wr = await po(m, "outbox_emit_ms", async () => ac(e, t, {
                            item: ie.item,
                            event: ie.event,
                            outputText: ht,
                            sdkSessionId: Nr.sessionId,
                            attachments: Xs.outboundAttachments,
                            turnMeta: v()
                        }));
                    z.push(...Wr.records), ae(Wr.primaryRecord)
                } else if (Je) ee("[runner] in-band /compact turn — suppressing empty outbox", {
                    sessionKey: t,
                    eventId: ie.event.id
                });
                else {
                    q = !0, J[J.length - 1].skipped = !0, ee("[runner] Skip called — suppressing outbox", {
                        sessionKey: t,
                        eventId: ie.event.id
                    });
                    let ht = pe();
                    (ie.item.eventId || ht.length > 0) && await V([...ie.item.eventId ? [ie.item.eventId] : [], ...ht], "skip-turn")
                }
                let rg = ie.event.source?.name === "idle-compact";
                if (Ut) {
                    let ht = Ut;
                    if (Ut = void 0, Ne = {
                            hadBoundary: !0,
                            history_pre: ht.pre_tokens,
                            history_post: ht.post_tokens,
                            origin: rg ? "idle-compact" : ht.trigger
                        }, ht.trigger === "manual" && !rg) {
                        let Wr = Kot(ht),
                            Ua = await ac(e, t, {
                                item: ie.item,
                                event: ie.event,
                                outputText: Wr,
                                sdkSessionId: Nr.sessionId ?? Se
                            });
                        z.push(...Ua.records), ae(Ua.primaryRecord, Wr)
                    } else ee("[runner] compact_boundary — telemetry only, no channel ack", {
                        sessionKey: t,
                        eventId: ie.event.id,
                        trigger: ht.trigger,
                        idleCompact: rg,
                        pre_tokens: ht.pre_tokens,
                        post_tokens: ht.post_tokens
                    })
                } else if (Je)
                    if (Ne = {
                            hadBoundary: !1,
                            origin: rg ? "idle-compact" : "manual"
                        }, rg) ee("[runner] idle-compact no-op (nothing to compact) — no channel ack", {
                        sessionKey: t,
                        eventId: ie.event.id
                    });
                    else {
                        let ht = "ℹ️ Nothing to compact.",
                            Wr = await ac(e, t, {
                                item: ie.item,
                                event: ie.event,
                                outputText: ht,
                                sdkSessionId: Nr.sessionId ?? Se
                            });
                        z.push(...Wr.records), ae(Wr.primaryRecord, ht)
                    } if (ie.item.eventId && x.push(ie.item.eventId), pe(), Nr.usedFallback && Nr.resumeError) {
                    let ht = createSpineEvent({
                        type: "agent.error",
                        source: {
                            kind: "runner",
                            name: "runner"
                        },
                        session_key: ie.event.session_key ?? t,
                        payload: {
                            stage: "resume",
                            session_id: U.sessionId,
                            error: Nr.resumeError
                        }
                    });
                    await atomicAppendEvent(e, ht)
                }
                await po(m, "session_upsert_ms", async () => {
                    let ht = {
                        cwd: U.cwd,
                        plane: U.plane,
                        permission_profile: U.permissionProfile,
                        last_event_id: ie.event.id,
                        last_event_at: ie.event.ts
                    };
                    p?.context_used_tokens !== void 0 && (ht.context_used_tokens = p.context_used_tokens);
                    let Wr = $_e(p);
                    Wr && (ht.last_served_model = Wr);
                    let Ua = DB(ie.event.payload, "idle_ms"),
                        qa = DB(ie.event.payload, "threshold_at_fire");
                    if (Ne) {
                        le = !0;
                        let OO = ie.event.ts ?? new Date().toISOString(),
                            _c = await F_e(e, t, M?.compact_stats?.measured_at),
                            wf = z_e({
                                completion: Ne,
                                preTotal: M?.context_used_tokens,
                                postTotal: p?.context_used_tokens,
                                idleMs: Ua,
                                thresholdAtFire: qa,
                                measuredAt: OO,
                                sessionKey: t,
                                gapCounts: _c
                            });
                        ht.last_compact_at = OO, ht.compact_stats = wf, f = wf
                    }
                    Nr.sessionId && !G && (ht.sdk_session_id = Nr.sessionId), rr && (ht.pending_fork_to = null), await Qe(e, t, ht)
                }), Ne?.origin === "idle-compact" && await est(e, {
                    sessionKey: t,
                    preTokens: M?.context_used_tokens,
                    postTokens: p?.context_used_tokens,
                    idleMs: DB(ie.event.payload, "idle_ms")
                }), rr && (ve = void 0), Nr.sessionId && !G && (Se = Nr.sessionId), ie.event.ts && (Ie = ie.event.ts)
            }
        }
        return await po(m, "mailbox_finalize_ms", async () => {
            if (await wo(e, t, x), x.length > 0 || F > 0) {
                let Se = `processed=${x.length} skipped=${F}${X?` outbox=${X}`:""}`;
                await u_(e, t, Se)
            }
        }), await y({
            cancelled: ze,
            processedCount: x.length,
            skippedCount: F,
            replyText: oe
        }), {
            processed: x.length,
            skipped: F,
            lockAcquired: !0,
            cancelled: ze,
            turnSkipped: q,
            sdkTurns: J,
            compacted: le,
            lastReplyText: oe,
            lastOutboxId: X,
            lastOutboxRecord: te,
            outboxRecords: z
        }
    } finally {
        clearInterval(s), await m_e(e, r)
    }
}
