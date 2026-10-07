// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createClaudeStreamingSessionFactory  (minified: KRe, daemon.pretty.js:83211)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createClaudeStreamingSessionFactory(e) {
    let {
        paths: t,
        bus: n,
        resolvedSdk: r,
        classifyModelTargetAgainstLiveGeneration: i
    } = e;
    async function o(u, l) {
        let c = l,
            d = String(c.task_id ?? "unknown"),
            f = String(c.status ?? "completed"),
            p = String(c.summary ?? ""),
            m = String(c.output_file ?? "");
        try {
            let h = await deliverRouteEventToSession(t, n, {
                traceId: `task-notify-${d}`,
                routeId: "task_notification",
                sourceName: "sdk_subagent",
                targetSessionKey: u,
                sourceSessionKey: u,
                eventType: "notify",
                walOnly: !0,
                payload: {
                    task_id: d,
                    task_status: f,
                    task_summary: p || void 0,
                    task_output_file: m || void 0,
                    completion_owner: "claude-cli"
                }
            });
            logDebugMessage("[session-manager] task_notification recorded WAL-only", {
                sessionKey: u,
                taskId: d,
                status: f,
                success: h.success
            })
        } catch (h) {
            logErrorMessage("[session-manager] task_notification WAL record failed", {
                sessionKey: u,
                taskId: d,
                status: f,
                error: h instanceof Error ? h.message : String(h)
            })
        }
    }
    async function s(u, l, c) {
        let d = c.effort ?? null;
        if (l.lastAppliedEffort === d) return;
        let f = u.query;
        if (!(!f || typeof f.applyFlagSettings != "function")) try {
            await f.applyFlagSettings({
                effortLevel: d
            }), l.lastAppliedEffort = d
        } catch (p) {
            logWarnMessage("[session-manager] failed to apply drain effort to the live session", {
                sessionKey: u.sessionKey,
                effort: d ?? "(runtime default)",
                error: p instanceof Error ? p.message : String(p)
            })
        }
    }
    async function a(u, l) {
        if (!r.createStreamingQuery) throw new Error("Streaming query support unavailable");
        let c = readLiveStreamContextToken(u),
            d = resolveContextCapToken({
                requirement: l.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: c
            }),
            f = computeContextProfileSignature({
                capToken: d,
                requirement: l.claudeContextRequirement,
                aliases: l.claudeModelAliases
            }),
            p = computeStreamingConfigSignature(l, f),
            m = l.sessionId;
        if (u.streamingState && !u.streamingState.closed && !u.streamingState.needsRecreation && u.streamingState.configSignature === p && (u.streamingState.hasAcceptedTurn || u.streamingState.initialSessionId === m)) return await s(u, u.streamingState, l), u.streamingState;
        let h = u.streamingState,
            g;
        if (h && !h.closed)
            if (h.configSignature !== p) {
                let se = diffStreamingConfigSignature(h.configSignature, p);
                logAlwaysAtLevel("warn", "[kv-cache] respawn: signature-mismatch", {
                    sessionKey: u.sessionKey,
                    generation: u.streamingGeneration,
                    sdk_session_id: u.sdkSessionId ?? null,
                    diff: se
                }), se.some(j => j.startsWith(`${SN}:`)) && (g = "model-context-profile-change")
            } else h.needsRecreation ? logDebugMessage("[kv-cache] respawn: recreation-requested (already audited at source)", {
                sessionKey: u.sessionKey,
                generation: u.streamingGeneration,
                sdk_session_id: u.sdkSessionId ?? null
            }) : logAlwaysAtLevel("warn", "[kv-cache] respawn: resume-sessionid-change", {
                sessionKey: u.sessionKey,
                generation: u.streamingGeneration,
                sdk_session_id: u.sdkSessionId ?? null,
                requested_session_id: m ?? null
            });
        await teardownStreamingSession(u, g);
        let y = resolveContextCapToken({
                requirement: l.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: void 0
            }),
            v = y === d ? f : computeContextProfileSignature({
                capToken: y,
                requirement: l.claudeContextRequirement,
                aliases: l.claudeModelAliases
            }),
            b = v === f ? p : computeStreamingConfigSignature(l, v),
            _ = new TN,
            E = new AbortController,
            R = l.mcpServersFactory ? l.mcpServersFactory() : l.mcpServers,
            P = resolveClaudeCostBaseline(m, l.costBaseline),
            k = {
                queue: _,
                abortController: E,
                configSignature: b,
                initialSessionId: m,
                hasAcceptedTurn: !1,
                needsRecreation: !1,
                closed: !1,
                currentTurn: null,
                loopPromise: Promise.resolve(),
                cliTurnTentative: null,
                spawnMaxContextToken: y,
                spawnDeliveryToken: v,
                liveModel: l.model,
                lastAppliedEffort: l.effort ?? null,
                ...P && "prevTotalCostUsd" in P ? {
                    lastTotalCostUsd: P.prevTotalCostUsd,
                    lastModelUsage: P.prevModelUsage
                } : {}
            },
            S = se => {
                for (let j of _.drain()) j.reject(se())
            };
        async function* D() {
            for (; !E.signal.aborted;) {
                let se;
                try {
                    se = await _.dequeue(E.signal)
                } catch (ne) {
                    if (ne instanceof Error && ne.name === "AbortError") return;
                    throw ne
                }
                let j = k.currentTurn;
                if (j !== null && j !== se) {
                    logWarnMessage("[session-manager] drain turn dequeued while the slot is occupied — rejected", {
                        sessionKey: u.sessionKey,
                        occupantAccepted: j.accepted
                    }), se.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming slot occupied — prompt not yielded; retry after the occupant settles"));
                    continue
                } else k.currentTurn = se, k.cliTurnTentative && (k.cliTurnTentative.compromised = !0), se.accepted = !1, se.streamedText = "", se.turnStreamedText = "", se.toolUseMap.clear();
                for await (let ne of se.input.prompt) yield ne
            }
        }
        let A = l.sessionId,
            {
                query: $
            } = r.createStreamingQuery({
                prompt: D(),
                abortController: E,
                sessionId: A,
                cwd: l.cwd,
                settingSources: l.settingSources,
                persistSession: l.persistSession,
                permissionMode: l.permissionMode,
                allowedTools: l.allowedTools,
                disallowedTools: l.disallowedTools,
                tools: l.tools,
                effort: l.effort,
                effortOrigin: l.effortOrigin,
                model: l.model,
                claudeContextRequirement: l.claudeContextRequirement,
                claudeSettingsPath: l.claudeSettingsPath,
                mcpServers: R,
                additionalDirectories: l.additionalDirectories,
                autoloadAdditionalDirectoryClaudeMd: l.autoloadAdditionalDirectoryClaudeMd,
                callerSession: l.callerSession,
                systemPrompt: l.systemPrompt,
                hooks: {
                    PreToolUse: [{
                        matcher: "*",
                        hooks: [async se => {
                            let j = se,
                                ne = j.transcript_path;
                            return typeof ne == "string" && ne.length > 0 && j.agent_id === void 0 && u.lastTranscriptPath !== ne && (u.lastTranscriptPath = ne, patchSessionRuntimeState(t, u.sessionKey, {
                                transcript_path: ne
                            }).catch(() => {})), {}
                        }]
                    }, {
                        matcher: wc,
                        hooks: [async se => {
                            let j = se?.agent_id !== void 0,
                                ne = j ? null : k.currentTurn;
                            return ne ? ne.skipCalled = !0 : !j && k.cliTurnTentative && (k.cliTurnTentative.skipObserved = !0), {
                                continue: !1,
                                stopReason: "The agent intentionally ended this turn silently by calling Skip."
                            }
                        }]
                    }],
                    PostToolUse: [{
                        matcher: "*",
                        hooks: [async se => {
                            let j = [];
                            if (se?.agent_id !== void 0) return {};
                            if (k.currentTurn?.skipCalled === !0) return {};
                            if (k.cliTurnTentative?.skipObserved === !0) return {};
                            let ne = u.pendingSteer;
                            if (ne && (u.pendingSteer = null, !ne.settled)) {
                                ne.settled = !0;
                                try {
                                    await deleteMailboxPendingItemsByEventIds(t, u.sessionKey, ne.eventIds)
                                } catch (K) {
                                    logInfoMessage("[session-manager] steer hook markDone error", {
                                        sessionKey: u.sessionKey,
                                        error: String(K)
                                    })
                                }
                                for (let K of ne.claimedEventIds) u.inflightEventIds.delete(K);
                                logInfoMessage("[session-manager] steer hook: injected interjection mid-turn", {
                                    sessionKey: u.sessionKey,
                                    eventIds: ne.eventIds
                                }), j.push(ne.steerText)
                            }
                            return j.length === 0 ? {} : {
                                hookSpecificOutput: {
                                    hookEventName: "PostToolUse",
                                    additionalContext: j.join(`

`)
                                }
                            }
                        }]
                    }]
                }
            });
        u.query = $, u.streamAbortController = E, u.streamingState = k, u.spawnBoardHash = l.boardHash, u.streamingGeneration += 1;
        let C = u.streamingGeneration,
            N = l.model,
            x = typeof $.setModel == "function",
            M = typeof $.applyFlagSettings == "function";
        if (x || M) {
            let se = await readSessionRuntimeState(t, u.sessionKey).catch(() => null);
            if (x) {
                let j = se ? se.model ?? null : void 0,
                    K = l.claudeContextRequirement?.modelOrigin !== void 0 ? null : l.model ?? null;
                if (j !== void 0 && j !== K && !E.signal.aborted) {
                    let te = "compatible",
                        B;
                    try {
                        let G = await i(u.sessionKey, u, j);
                        te = G.outcome, G.outcome !== "blocked" && (B = G.requirementKind)
                    } catch (G) {
                        logWarnMessage("[session-manager] spawn-time model reconcile failed to read config", {
                            sessionKey: u.sessionKey,
                            model: j ?? "(reset to default)",
                            error: G instanceof Error ? G.message : String(G)
                        }), te = "config-unreadable"
                    }
                    if (te !== "compatible") logWarnMessage("[session-manager] deferring spawn-time model re-apply — context profile differs from this generation", {
                        sessionKey: u.sessionKey,
                        generation: C,
                        deferred_model: j ?? "(reset to default)",
                        running_model: l.model ?? "(runtime default)",
                        outcome: te
                    });
                    else try {
                        await $.setModel(j ?? void 0), N = j ?? void 0, k.liveModel = j ?? void 0
                    } catch (G) {
                        logWarnMessage("[session-manager] failed to re-apply session model override — keeping it for the next spawn", {
                            sessionKey: u.sessionKey,
                            model: j ?? "(reset to default)",
                            running_model: l.model ?? "(runtime default)",
                            error: G instanceof Error ? G.message : String(G)
                        }), j !== null && flagStreamRecreationOnModelReject(u, {
                            model: j,
                            requirementKind: B,
                            reason: "spawn-reconcile"
                        })
                    }
                }
            }
            if (M && !E.signal.aborted) {
                let j = se?.effort ?? null,
                    ne = l.effortOrigin !== void 0 ? null : l.effort ?? null;
                if (j !== ne) try {
                    await $.applyFlagSettings({
                        effortLevel: j
                    }), u.streamingState && (u.streamingState.lastAppliedEffort = j)
                } catch (K) {
                    logWarnMessage("[session-manager] failed to re-apply session effort override at spawn", {
                        sessionKey: u.sessionKey,
                        effort: j ?? "(reset to default)",
                        error: K instanceof Error ? K.message : String(K)
                    })
                }
            }
        }
        logAlwaysAtLevel("info", "[kv-cache] streaming subprocess spawned", {
            sessionKey: u.sessionKey,
            generation: C,
            model: N ?? "default",
            context_profile_source: describeContextProfileSource(l.claudeContextRequirement),
            max_context_token: y,
            ...extractProfiledEndpointFields(l.claudeContextRequirement),
            alias_tiers: listSortedAliasKeys(l.claudeModelAliases),
            board_hash: l.boardHash ? l.boardHash.slice(0, 12) : null
        });
        let F = (se, j, ne, K = !1) => {
                if (j && !se.skipCalled) {
                    if (K) {
                        se.input.onStream?.(j, !0);
                        return
                    }
                    if (ne) {
                        se.streamedText += j, se.turnStreamedText += j, se.input.onStream?.(j, !1);
                        return
                    }
                    if (se.turnStreamedText && j.startsWith(se.turnStreamedText)) {
                        let te = j.slice(se.turnStreamedText.length);
                        te && (se.streamedText += te, se.turnStreamedText = j, se.input.onStream?.(te, !1));
                        return
                    }
                    if (j.startsWith(se.streamedText)) {
                        let te = j.slice(se.streamedText.length);
                        te && (se.streamedText = j, se.turnStreamedText += te, se.input.onStream?.(te, !1));
                        return
                    }
                    se.streamedText += j, se.turnStreamedText += j, se.input.onStream?.(j, !1)
                }
            },
            J = async () => {
                let se = u.pendingSteer;
                if (se && (u.pendingSteer = null, !se.settled)) {
                    if (k.closed) {
                        se.settled = !0;
                        let j = [];
                        for (let K = 0; K < se.requeueLines.length; K += 1) {
                            let te = se.requeueLines[K],
                                B = se.requeueEventIds[K];
                            try {
                                await enqueueSessionInboxLine(t, u.sessionKey, te), j.push(B)
                            } catch (G) {
                                logWarnMessage("[session-manager] steer fallback closed-stream requeue failed", {
                                    sessionKey: u.sessionKey,
                                    eventId: B,
                                    error: G instanceof Error ? G.message : String(G)
                                })
                            }
                        }
                        let ne = [...j, ...se.processedEventIds];
                        if (ne.length > 0) try {
                            await deleteMailboxPendingItemsByEventIds(t, u.sessionKey, ne)
                        } catch (K) {
                            logInfoMessage("[session-manager] steer fallback closed markDone error", {
                                sessionKey: u.sessionKey,
                                error: String(K)
                            })
                        }
                        for (let K of se.claimedEventIds) u.inflightEventIds.delete(K);
                        u.pendingWake = !0, logInfoMessage("[session-manager] steer fallback requeued to inbox (stream closed)", {
                            sessionKey: u.sessionKey,
                            eventIds: se.eventIds,
                            requeued: j.length,
                            requeueFailed: se.requeueLines.length - j.length
                        });
                        return
                    }
                    se.settled = !0;
                    try {
                        await se.enqueueAsNewTurn()
                    } catch (j) {
                        logInfoMessage("[session-manager] steer fallback enqueue error", {
                            sessionKey: u.sessionKey,
                            error: String(j)
                        })
                    }
                }
            }, ce = se => buildClaudeCostBaseline(se, k.lastTotalCostUsd, k.lastModelUsage), ie = se => se.origin?.kind === "task-notification", Ce = async (se, j, ne, K) => {
                let te = se,
                    B = typeof te.duration_ms == "number" && Number.isFinite(te.duration_ms) && te.duration_ms >= 0 ? te.duration_ms : 0,
                    G = typeof te.duration_api_ms == "number" && Number.isFinite(te.duration_api_ms) && te.duration_api_ms >= 0 ? te.duration_api_ms : 0;
                try {
                    await appendDrainRecord(t, {
                        origin: "cli-turn",
                        id: cbt(),
                        session_key: u.sessionKey,
                        sdk_session_id: u.sdkSessionId,
                        drain_started_at: new Date(K - B).toISOString(),
                        drain_duration_ms: B,
                        sdk_duration_ms: G,
                        events_processed: 0,
                        events_skipped: 0,
                        tool_calls: 0,
                        tool_errors: 0,
                        output_chars: ne,
                        cancelled: !1,
                        usage: j
                    })
                } catch (H) {
                    logErrorMessage("[completion-owner] CLI turn ledger write failed", {
                        sessionKey: u.sessionKey,
                        generation: u.streamingGeneration,
                        error: H instanceof Error ? H.message : String(H)
                    })
                }
            };
        return k.loopPromise = (async () => {
            let se = null,
                j;
            try {
                for await (let ne of $) {
                    let K = ne;
                    u.lastActivityAt = Date.now();
                    let te, B, G = !1,
                        H = null;
                    if (K.type === "result") {
                        te = k.lastModelUsage, B = k.lastTotalCostUsd, G = P !== void 0 && "baselineUnknown" in P && (B === void 0 || te === void 0), H = se, se = null;
                        let pe = K.modelUsage;
                        pe !== void 0 && (k.lastModelUsage = pe);
                        let fe = K.total_cost_usd;
                        typeof fe == "number" && (k.lastTotalCostUsd = fe)
                    }
                    if (K.type === "result" && ie(K)) {
                        let pe = Date.now(),
                            fe = k.cliTurnTentative;
                        k.cliTurnTentative = null;
                        let Se = k.currentTurn,
                            w = fe?.skipObserved ?? !1,
                            T;
                        if (K.subtype === "success" && (T = mapClaudeResultToDrainUsage(K, {
                                prevModelUsage: te,
                                prevTotalCostUsd: B,
                                baselineUnknown: G
                            }), T && !w && typeof $.getContextUsage == "function")) try {
                            let Y = (await $.getContextUsage())?.totalTokens;
                            typeof Y == "number" && Number.isFinite(Y) && Y >= 0 && (T.context_used_tokens = Y)
                        } catch {}
                        if (u.lastCliTurnSettledAt = pe, u.lastTurnCompletedAt = pe, j = void 0, Se) {
                            let U = H === Se,
                                Y = fe?.compromised === !0,
                                me = Se.accepted;
                            k.currentTurn = null, Se.accepted = !1, await J(), Se.reject(new AgentSdkPromptNotAcceptedAbortError("Task-completion turn folded with mailbox drain; retrying the drain")), u.pendingWake = !0, u.wakeResolver?.(), await Ce(K, T, 0, pe), logAlwaysAtLevel("warn", "[completion-owner] voided folded drain", {
                                sessionKey: u.sessionKey,
                                generation: u.streamingGeneration,
                                acceptedByForeignInit: U,
                                installedDuringTentative: Y,
                                wasAccepted: me
                            });
                            continue
                        }
                        let L = 0,
                            z = K.subtype === "success" && !w && typeof K.result == "string" && K.result.length > 0 ? K.result : void 0;
                        if (z !== void 0) {
                            let U = await readPendingOutboundAttachments(t, u.sessionKey).catch(() => {}),
                                Y = createOutboxRecord({
                                    channel_kind: channelKindFromSessionKey(u.sessionKey),
                                    session_key: u.sessionKey,
                                    payload: {
                                        text: z,
                                        attachments: U
                                    }
                                });
                            try {
                                await persistOutboxRecord(t, Y), L = z.length, n.emit("session.output", {
                                    sessionKey: u.sessionKey,
                                    record: Y
                                })
                            } catch (me) {
                                logErrorMessage("[completion-owner] proactive outbox write failed", {
                                    sessionKey: u.sessionKey,
                                    generation: u.streamingGeneration,
                                    error: me instanceof Error ? me.message : String(me)
                                })
                            }
                            L > 0 && U && await clearPendingOutboundAttachments(t, u.sessionKey).catch(me => logErrorMessage("[completion-owner] pending attachment clear failed", {
                                sessionKey: u.sessionKey,
                                generation: u.streamingGeneration,
                                error: me instanceof Error ? me.message : String(me)
                            }))
                        }
                        await Ce(K, T, L, pe), u.pendingWake = !0, u.wakeResolver?.(), logInfoMessage("[completion-owner] settled CLI completion turn", {
                            sessionKey: u.sessionKey,
                            generation: u.streamingGeneration,
                            subtype: K.subtype,
                            skipped: w,
                            outputChars: L
                        });
                        continue
                    }
                    let q = k.currentTurn;
                    if (!q) {
                        if (K.type === "system" && K.subtype === "task_notification") {
                            let pe = K;
                            await o(u.sessionKey, K), j = {
                                taskId: String(pe.task_id ?? "unknown"),
                                status: String(pe.status ?? "completed"),
                                observedAt: Date.now()
                            };
                            continue
                        }
                        if (K.type === "system" && K.subtype === "init") {
                            k.cliTurnTentative ??= {
                                skipObserved: !1,
                                compromised: !1
                            }, se = null;
                            continue
                        }
                        if (K.type === "result") {
                            let pe = k.cliTurnTentative !== null;
                            k.cliTurnTentative = null, logInfoMessage("[session-manager] orphan result received", {
                                sessionKey: u.sessionKey,
                                subtype: K.subtype,
                                hadTentative: pe
                            }), u.pendingWake = !0, u.wakeResolver?.();
                            continue
                        }
                        continue
                    }
                    if (K.type === "system") {
                        if (K.subtype === "task_notification") {
                            let fe = K;
                            await o(u.sessionKey, K), j = {
                                taskId: String(fe.task_id ?? "unknown"),
                                status: String(fe.status ?? "completed"),
                                observedAt: Date.now()
                            }
                        }
                        if (K.subtype === "init") {
                            let fe = !q.accepted;
                            k.hasAcceptedTurn = !0, q.accepted = !0, k.cliTurnTentative = null, se = fe ? q : null;
                            try {
                                q.input.onTurnAcknowledged?.()
                            } catch {}
                            q.sessionId = K.session_id ?? q.sessionId, u.sdkSessionId = K.session_id ?? u.sdkSessionId, u.sdkSessionIdVerified = !0, A && K.session_id && A !== K.session_id && logWarnMessage("[session-manager] SDK session ID mismatch — context lost", {
                                sessionKey: u.sessionKey,
                                requestedSessionId: A,
                                actualSessionId: K.session_id
                            }), K.session_id && u.jobStateless !== !0 && await patchSessionRuntimeState(t, u.sessionKey, {
                                sdk_session_id: K.session_id,
                                sdk_session_runtime: "claude"
                            }), u.pendingPreempt && u.pendingPreemptBoundary === "accept" && (u.pendingPreempt = !1, u.pendingPreemptBoundary = null, u.pendingPreemptReason = null, interruptActorQuery(u))
                        }
                        let pe;
                        K.subtype === "init" ? pe = {
                            session_id: K.session_id
                        } : K.subtype === "compact_boundary" && K.compact_metadata && (pe = {
                            trigger: K.compact_metadata.trigger,
                            pre_tokens: K.compact_metadata.pre_tokens,
                            post_tokens: K.compact_metadata.post_tokens
                        }), q.input.onExecutionEvent?.({
                            type: "system",
                            subtype: K.subtype ?? "unknown",
                            data: pe
                        });
                        continue
                    }
                    if (K.type === "stream_event") {
                        let pe = hasParentToolUseId(K);
                        for (let w of extractStreamTextDeltas(K.event)) F(q, w.text, w.isDelta, pe);
                        for (let w of extractStreamThinkingText(K.event)) q.input.onExecutionEvent?.({
                            type: "thought_chunk",
                            text: w
                        });
                        let fe = parseToolUseBlockStart(K.event);
                        fe && (q.toolBlockIndexMap.set(fe.index, {
                            toolUseId: fe.toolUseId,
                            toolName: fe.toolName
                        }), q.toolUseMap.set(fe.toolUseId, fe.toolName), q.input.onExecutionEvent?.({
                            type: "tool_use",
                            toolUseId: fe.toolUseId,
                            toolName: fe.toolName,
                            input: void 0,
                            ephemeral: !0,
                            isSidechain: pe
                        }));
                        let Se = parseInputJsonDelta(K.event);
                        if (Se) {
                            let w = q.toolBlockIndexMap.get(Se.index);
                            w && q.input.onExecutionEvent?.({
                                type: "tool_input_delta",
                                toolUseId: w.toolUseId,
                                toolName: w.toolName,
                                partialJson: Se.partialJson
                            })
                        }
                        continue
                    }
                    if (typeof K.type == "string" && K.type.includes("assistant")) {
                        let pe = hasParentToolUseId(K);
                        for (let Se of extractSdkMessageTextChunks(K)) F(q, Se.text, Se.isDelta, pe);
                        let fe = K.message?.content;
                        if (Array.isArray(fe))
                            for (let Se of fe) {
                                if (!Se || typeof Se != "object" || Se.type !== "tool_use") continue;
                                let w = Se.id,
                                    T = Se.name;
                                !w || !T || (q.toolUseMap.set(w, T), q.input.onExecutionEvent?.({
                                    type: "tool_use",
                                    toolUseId: w,
                                    toolName: T,
                                    input: Se.input,
                                    isSidechain: pe
                                }))
                            }
                        continue
                    }
                    if (K.type === "user") {
                        let pe = hasParentToolUseId(K),
                            fe = K.message?.content;
                        if (Array.isArray(fe))
                            for (let Se of fe) {
                                if (!Se || typeof Se != "object" || Se.type !== "tool_result") continue;
                                let w = Se.tool_use_id;
                                w && (q.input.onExecutionEvent?.({
                                    type: "tool_result",
                                    toolUseId: w,
                                    toolName: q.toolUseMap.get(w),
                                    isError: Se.is_error ?? !1,
                                    summary: stringifyToolResultContent(Se.content),
                                    isSidechain: pe
                                }), q.turnStreamedText = "")
                            }
                        continue
                    }
                    if (K.type === "result") {
                        if (K.subtype === "success") {
                            if (typeof K.result == "string" && (q.text = K.result), K.structured_output !== void 0 && (q.structured = K.structured_output), q.usage = mapClaudeResultToDrainUsage(K, {
                                    prevModelUsage: te,
                                    prevTotalCostUsd: B,
                                    baselineUnknown: G
                                }), q.usage && !q.skipCalled && typeof $.getContextUsage == "function") try {
                                let fe = (await $.getContextUsage())?.totalTokens;
                                typeof fe == "number" && Number.isFinite(fe) && fe >= 0 && (q.usage.context_used_tokens = fe)
                            } catch {}
                            if (await J(), k.currentTurn = null, q.skipCalled) q.resolve({
                                sessionId: q.sessionId ?? u.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: q.usage,
                                costBaseline: ce(q.sessionId ?? u.sdkSessionId)
                            });
                            else {
                                let pe = q.text ?? (q.streamedText ? q.streamedText : void 0);
                                q.resolve({
                                    sessionId: q.sessionId ?? u.sdkSessionId,
                                    text: pe,
                                    structured: q.structured,
                                    usage: q.usage,
                                    costBaseline: ce(q.sessionId ?? u.sdkSessionId)
                                })
                            }
                            continue
                        }
                        if (K.subtype === "error_during_execution" && q.skipCalled) {
                            await J(), k.currentTurn = null, q.resolve({
                                sessionId: q.sessionId ?? u.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: q.usage,
                                costBaseline: ce(q.sessionId ?? u.sdkSessionId)
                            });
                            continue
                        }
                        await J(), k.currentTurn = null, K.subtype === "error_during_execution" ? q.accepted ? q.reject(new AgentSdkTurnInterruptedError) : u.pendingClear ? (k.needsRecreation = !0, q.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : (k.needsRecreation = !0, A && !u.sdkSessionIdVerified && (u.sdkSessionId = void 0, u.pendingWake = !0, await patchSessionRuntimeState(t, u.sessionKey, {
                            sdk_session_id: null,
                            sdk_session_runtime: null,
                            pending_fork_to: null
                        }).catch(() => {}), logWarnMessage("[session-manager] cleared stale sdk_session_id after resume failure", {
                            sessionKey: u.sessionKey,
                            staleSessionId: A
                        })), q.reject(new AgentSdkPromptNotAcceptedAbortError)) : q.reject(new Error(`Unexpected streaming SDK result subtype: ${K.subtype??"unknown"}`))
                    }
                }
            } catch (ne) {
                let K = k.currentTurn;
                k.currentTurn = null, K && (E.signal.aborted && !K.accepted ? (k.needsRecreation = !0, u.pendingClear ? K.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : K.reject(new AgentSdkPromptNotAcceptedAbortError)) : E.signal.aborted ? K.reject(createAbortErrorWithCause("Streaming SDK run aborted", ne)) : (K.accepted || (k.needsRecreation = !0), K.reject(ne))), S(() => new AgentSdkPromptNotAcceptedAbortError)
            } finally {
                k.closed = !0, k.needsRecreation = !0, E.signal.aborted || logAlwaysAtLevel("warn", "[kv-cache] streaming loop exited unexpectedly (closed)", {
                    sessionKey: u.sessionKey,
                    generation: u.streamingGeneration,
                    sdk_session_id: u.sdkSessionId ?? null
                });
                let ne = k.currentTurn;
                k.currentTurn = null, ne && (E.signal.aborted && !ne.accepted ? u.pendingClear ? ne.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : ne.reject(new AgentSdkPromptNotAcceptedAbortError) : E.signal.aborted ? ne.reject(createAbortErrorWithCause("Streaming SDK run aborted")) : ne.accepted ? ne.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution")) : ne.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), S(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), j && (u.lastCliTurnSettledAt === void 0 || j.observedAt > u.lastCliTurnSettledAt) && logAlwaysAtLevel("warn", "[completion-owner] unspoken-completion", {
                    sessionKey: u.sessionKey,
                    taskId: j.taskId,
                    status: j.status,
                    generation: u.streamingGeneration
                }), k.cliTurnTentative = null, u.wakeResolver?.(), u.pendingSteer && (await J(), u.wakeResolver?.()), u.streamingState === k && (u.streamingState = null), u.query === $ && (u.query = null), u.streamAbortController === E && (u.streamAbortController = null)
            }
        })(), k
    }
    return {
        ensureStreamingSession: a
    }
}
