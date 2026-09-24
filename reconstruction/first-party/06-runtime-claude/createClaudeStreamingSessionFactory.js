// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createClaudeStreamingSessionFactory  (minified: s0e, daemon.pretty.js:82911)
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
            Re("[session-manager] task_notification recorded WAL-only", {
                sessionKey: u,
                taskId: d,
                status: f,
                success: h.success
            })
        } catch (h) {
            Le("[session-manager] task_notification WAL record failed", {
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
            Z("[session-manager] failed to apply drain effort to the live session", {
                sessionKey: u.sessionKey,
                effort: d ?? "(runtime default)",
                error: p instanceof Error ? p.message : String(p)
            })
        }
    }
    async function a(u, l) {
        if (!r.createStreamingQuery) throw new Error("Streaming query support unavailable");
        let c = AA(u),
            d = zf({
                requirement: l.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: c
            }),
            f = Nw({
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
                let J = diffStreamingConfigSignature(h.configSignature, p);
                _t("warn", "[kv-cache] respawn: signature-mismatch", {
                    sessionKey: u.sessionKey,
                    generation: u.streamingGeneration,
                    sdk_session_id: u.sdkSessionId ?? null,
                    diff: J
                }), J.some(ne => ne.startsWith(`${CA}:`)) && (g = "model-context-profile-change")
            } else h.needsRecreation ? Re("[kv-cache] respawn: recreation-requested (already audited at source)", {
                sessionKey: u.sessionKey,
                generation: u.streamingGeneration,
                sdk_session_id: u.sdkSessionId ?? null
            }) : _t("warn", "[kv-cache] respawn: resume-sessionid-change", {
                sessionKey: u.sessionKey,
                generation: u.streamingGeneration,
                sdk_session_id: u.sdkSessionId ?? null,
                requested_session_id: m ?? null
            });
        await teardownStreamingSession(u, g);
        let y = zf({
                requirement: l.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: void 0
            }),
            v = y === d ? f : Nw({
                capToken: y,
                requirement: l.claudeContextRequirement,
                aliases: l.claudeModelAliases
            }),
            b = v === f ? p : computeStreamingConfigSignature(l, v),
            _ = new MA,
            I = new AbortController,
            E = l.mcpServersFactory ? l.mcpServersFactory() : l.mcpServers,
            R = {
                queue: _,
                abortController: I,
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
                lastAppliedEffort: l.effort ?? null
            },
            x = J => {
                for (let ne of _.drain()) ne.reject(J())
            };
        async function* S() {
            for (; !I.signal.aborted;) {
                let J;
                try {
                    J = await _.dequeue(I.signal)
                } catch (fe) {
                    if (fe instanceof Error && fe.name === "AbortError") return;
                    throw fe
                }
                let ne = R.currentTurn;
                if (ne !== null && ne !== J) {
                    Z("[session-manager] drain turn dequeued while the slot is occupied — rejected", {
                        sessionKey: u.sessionKey,
                        occupantAccepted: ne.accepted
                    }), J.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming slot occupied — prompt not yielded; retry after the occupant settles"));
                    continue
                } else R.currentTurn = J, R.cliTurnTentative && (R.cliTurnTentative.compromised = !0), J.accepted = !1, J.streamedText = "", J.turnStreamedText = "", J.toolUseMap.clear();
                for await (let fe of J.input.prompt) yield fe
            }
        }
        let D = l.sessionId,
            {
                query: $
            } = r.createStreamingQuery({
                prompt: S(),
                abortController: I,
                sessionId: D,
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
                mcpServers: E,
                additionalDirectories: l.additionalDirectories,
                autoloadAdditionalDirectoryClaudeMd: l.autoloadAdditionalDirectoryClaudeMd,
                systemPrompt: l.systemPrompt,
                hooks: {
                    PreToolUse: [{
                        matcher: "*",
                        hooks: [async J => {
                            let ne = J,
                                fe = ne.transcript_path;
                            return typeof fe == "string" && fe.length > 0 && ne.agent_id === void 0 && u.lastTranscriptPath !== fe && (u.lastTranscriptPath = fe, patchSessionRuntimeState(t, u.sessionKey, {
                                transcript_path: fe
                            }).catch(() => {})), {}
                        }]
                    }, {
                        matcher: cc,
                        hooks: [async J => {
                            let ne = J?.agent_id !== void 0,
                                fe = ne ? null : R.currentTurn;
                            return fe ? fe.skipCalled = !0 : !ne && R.cliTurnTentative && (R.cliTurnTentative.skipObserved = !0), {
                                continue: !1,
                                stopReason: "The agent intentionally ended this turn silently by calling Skip."
                            }
                        }]
                    }],
                    PostToolUse: [{
                        matcher: "*",
                        hooks: [async () => {
                            let J = [];
                            if (R.currentTurn?.skipCalled === !0) return {};
                            if (R.cliTurnTentative?.skipObserved === !0) return {};
                            let ne = u.pendingSteer;
                            if (ne && (u.pendingSteer = null, !ne.settled)) {
                                ne.settled = !0;
                                try {
                                    await Ao(t, u.sessionKey, ne.eventIds)
                                } catch (fe) {
                                    te("[session-manager] steer hook markDone error", {
                                        sessionKey: u.sessionKey,
                                        error: String(fe)
                                    })
                                }
                                for (let fe of ne.claimedEventIds) u.inflightEventIds.delete(fe);
                                te("[session-manager] steer hook: injected interjection mid-turn", {
                                    sessionKey: u.sessionKey,
                                    eventIds: ne.eventIds
                                }), J.push(ne.steerText)
                            }
                            return J.length === 0 ? {} : {
                                hookSpecificOutput: {
                                    hookEventName: "PostToolUse",
                                    additionalContext: J.join(`

`)
                                }
                            }
                        }]
                    }]
                }
            });
        u.query = $, u.streamAbortController = I, u.streamingState = R, u.spawnBoardHash = l.boardHash, u.streamingGeneration += 1;
        let C = u.streamingGeneration,
            A = l.model,
            F = typeof $.setModel == "function",
            k = typeof $.applyFlagSettings == "function";
        if (F || k) {
            let J = await ct(t, u.sessionKey).catch(() => null);
            if (F) {
                let ne = J ? J.model ?? null : void 0,
                    j = l.claudeContextRequirement?.modelOrigin !== void 0 ? null : l.model ?? null;
                if (ne !== void 0 && ne !== j && !I.signal.aborted) {
                    let ue = "compatible",
                        Ie;
                    try {
                        let ae = await i(u.sessionKey, u, ne);
                        ue = ae.outcome, ae.outcome !== "blocked" && (Ie = ae.requirementKind)
                    } catch (ae) {
                        Z("[session-manager] spawn-time model reconcile failed to read config", {
                            sessionKey: u.sessionKey,
                            model: ne ?? "(reset to default)",
                            error: ae instanceof Error ? ae.message : String(ae)
                        }), ue = "config-unreadable"
                    }
                    if (ue !== "compatible") Z("[session-manager] deferring spawn-time model re-apply — context profile differs from this generation", {
                        sessionKey: u.sessionKey,
                        generation: C,
                        deferred_model: ne ?? "(reset to default)",
                        running_model: l.model ?? "(runtime default)",
                        outcome: ue
                    });
                    else try {
                        await $.setModel(ne ?? void 0), A = ne ?? void 0, R.liveModel = ne ?? void 0
                    } catch (ae) {
                        Z("[session-manager] failed to re-apply session model override — keeping it for the next spawn", {
                            sessionKey: u.sessionKey,
                            model: ne ?? "(reset to default)",
                            running_model: l.model ?? "(runtime default)",
                            error: ae instanceof Error ? ae.message : String(ae)
                        }), ne !== null && NA(u, {
                            model: ne,
                            requirementKind: Ie,
                            reason: "spawn-reconcile"
                        })
                    }
                }
            }
            if (k && !I.signal.aborted) {
                let ne = J?.effort ?? null,
                    fe = l.effortOrigin !== void 0 ? null : l.effort ?? null;
                if (ne !== fe) try {
                    await $.applyFlagSettings({
                        effortLevel: ne
                    }), u.streamingState && (u.streamingState.lastAppliedEffort = ne)
                } catch (j) {
                    Z("[session-manager] failed to re-apply session effort override at spawn", {
                        sessionKey: u.sessionKey,
                        effort: ne ?? "(reset to default)",
                        error: j instanceof Error ? j.message : String(j)
                    })
                }
            }
        }
        _t("info", "[kv-cache] streaming subprocess spawned", {
            sessionKey: u.sessionKey,
            generation: C,
            model: A ?? "default",
            context_profile_source: hO(l.claudeContextRequirement),
            max_context_token: y,
            ...gO(l.claudeContextRequirement),
            alias_tiers: yO(l.claudeModelAliases),
            board_hash: l.boardHash ? l.boardHash.slice(0, 12) : null
        });
        let N = (J, ne, fe, j = !1) => {
                if (ne && !J.skipCalled) {
                    if (j) {
                        J.input.onStream?.(ne, !0);
                        return
                    }
                    if (fe) {
                        J.streamedText += ne, J.turnStreamedText += ne, J.input.onStream?.(ne, !1);
                        return
                    }
                    if (J.turnStreamedText && ne.startsWith(J.turnStreamedText)) {
                        let ue = ne.slice(J.turnStreamedText.length);
                        ue && (J.streamedText += ue, J.turnStreamedText = ne, J.input.onStream?.(ue, !1));
                        return
                    }
                    if (ne.startsWith(J.streamedText)) {
                        let ue = ne.slice(J.streamedText.length);
                        ue && (J.streamedText = ne, J.turnStreamedText += ue, J.input.onStream?.(ue, !1));
                        return
                    }
                    J.streamedText += ne, J.turnStreamedText += ne, J.input.onStream?.(ne, !1)
                }
            },
            V = async () => {
                let J = u.pendingSteer;
                if (J && (u.pendingSteer = null, !J.settled)) {
                    if (R.closed) {
                        J.settled = !0;
                        let ne = [];
                        for (let j = 0; j < J.requeueLines.length; j += 1) {
                            let ue = J.requeueLines[j],
                                Ie = J.requeueEventIds[j];
                            try {
                                await enqueueSessionInboxLine(t, u.sessionKey, ue), ne.push(Ie)
                            } catch (ae) {
                                Z("[session-manager] steer fallback closed-stream requeue failed", {
                                    sessionKey: u.sessionKey,
                                    eventId: Ie,
                                    error: ae instanceof Error ? ae.message : String(ae)
                                })
                            }
                        }
                        let fe = [...ne, ...J.processedEventIds];
                        if (fe.length > 0) try {
                            await Ao(t, u.sessionKey, fe)
                        } catch (j) {
                            te("[session-manager] steer fallback closed markDone error", {
                                sessionKey: u.sessionKey,
                                error: String(j)
                            })
                        }
                        for (let j of J.claimedEventIds) u.inflightEventIds.delete(j);
                        u.pendingWake = !0, te("[session-manager] steer fallback requeued to inbox (stream closed)", {
                            sessionKey: u.sessionKey,
                            eventIds: J.eventIds,
                            requeued: ne.length,
                            requeueFailed: J.requeueLines.length - ne.length
                        });
                        return
                    }
                    J.settled = !0;
                    try {
                        await J.enqueueAsNewTurn()
                    } catch (ne) {
                        te("[session-manager] steer fallback enqueue error", {
                            sessionKey: u.sessionKey,
                            error: String(ne)
                        })
                    }
                }
            }, W = J => J.origin?.kind === "task-notification", ce = async (J, ne, fe, j) => {
                let ue = J,
                    Ie = typeof ue.duration_ms == "number" && Number.isFinite(ue.duration_ms) && ue.duration_ms >= 0 ? ue.duration_ms : 0,
                    ae = typeof ue.duration_api_ms == "number" && Number.isFinite(ue.duration_api_ms) && ue.duration_api_ms >= 0 ? ue.duration_api_ms : 0;
                try {
                    await appendDrainRecord(t, {
                        origin: "cli-turn",
                        id: Igt(),
                        session_key: u.sessionKey,
                        sdk_session_id: u.sdkSessionId,
                        drain_started_at: new Date(j - Ie).toISOString(),
                        drain_duration_ms: Ie,
                        sdk_duration_ms: ae,
                        events_processed: 0,
                        events_skipped: 0,
                        tool_calls: 0,
                        tool_errors: 0,
                        output_chars: fe,
                        cancelled: !1,
                        usage: ne
                    })
                } catch (M) {
                    Le("[completion-owner] CLI turn ledger write failed", {
                        sessionKey: u.sessionKey,
                        generation: u.streamingGeneration,
                        error: M instanceof Error ? M.message : String(M)
                    })
                }
            };
        return R.loopPromise = (async () => {
            let J = null,
                ne;
            try {
                for await (let fe of $) {
                    let j = fe;
                    u.lastActivityAt = Date.now();
                    let ue, Ie, ae = null;
                    if (j.type === "result") {
                        ue = R.lastModelUsage, Ie = R.lastTotalCostUsd, ae = J, J = null;
                        let z = j.modelUsage;
                        z !== void 0 && (R.lastModelUsage = z);
                        let U = j.total_cost_usd;
                        typeof U == "number" && (R.lastTotalCostUsd = U)
                    }
                    if (j.type === "result" && W(j)) {
                        let z = Date.now(),
                            U = R.cliTurnTentative;
                        R.cliTurnTentative = null;
                        let X = R.currentTurn,
                            Ee = U?.skipObserved ?? !1,
                            be;
                        if (j.subtype === "success" && (be = mapClaudeResultToDrainUsage(j, {
                                prevModelUsage: ue,
                                prevTotalCostUsd: Ie
                            }), be && !Ee && typeof $.getContextUsage == "function")) try {
                            let H = (await $.getContextUsage())?.totalTokens;
                            typeof H == "number" && Number.isFinite(H) && H >= 0 && (be.context_used_tokens = H)
                        } catch {}
                        if (u.lastCliTurnSettledAt = z, u.lastTurnCompletedAt = z, ne = void 0, X) {
                            let K = ae === X,
                                H = U?.compromised === !0,
                                L = X.accepted;
                            R.currentTurn = null, X.accepted = !1, await V(), X.reject(new AgentSdkPromptNotAcceptedAbortError("Task-completion turn folded with mailbox drain; retrying the drain")), u.pendingWake = !0, u.wakeResolver?.(), await ce(j, be, 0, z), _t("warn", "[completion-owner] voided folded drain", {
                                sessionKey: u.sessionKey,
                                generation: u.streamingGeneration,
                                acceptedByForeignInit: K,
                                installedDuringTentative: H,
                                wasAccepted: L
                            });
                            continue
                        }
                        let w = 0,
                            P = j.subtype === "success" && !Ee && typeof j.result == "string" && j.result.length > 0 ? j.result : void 0;
                        if (P !== void 0) {
                            let K = await readPendingOutboundAttachments(t, u.sessionKey).catch(() => {}),
                                H = Hl({
                                    channel_kind: OS(u.sessionKey),
                                    session_key: u.sessionKey,
                                    payload: {
                                        text: P,
                                        attachments: K
                                    }
                                });
                            try {
                                await Wl(t, H), w = P.length, n.emit("session.output", {
                                    sessionKey: u.sessionKey,
                                    record: H
                                })
                            } catch (L) {
                                Le("[completion-owner] proactive outbox write failed", {
                                    sessionKey: u.sessionKey,
                                    generation: u.streamingGeneration,
                                    error: L instanceof Error ? L.message : String(L)
                                })
                            }
                            w > 0 && K && await xO(t, u.sessionKey).catch(L => Le("[completion-owner] pending attachment clear failed", {
                                sessionKey: u.sessionKey,
                                generation: u.streamingGeneration,
                                error: L instanceof Error ? L.message : String(L)
                            }))
                        }
                        await ce(j, be, w, z), u.pendingWake = !0, u.wakeResolver?.(), te("[completion-owner] settled CLI completion turn", {
                            sessionKey: u.sessionKey,
                            generation: u.streamingGeneration,
                            subtype: j.subtype,
                            skipped: Ee,
                            outputChars: w
                        });
                        continue
                    }
                    let M = R.currentTurn;
                    if (!M) {
                        if (j.type === "system" && j.subtype === "task_notification") {
                            let z = j;
                            await o(u.sessionKey, j), ne = {
                                taskId: String(z.task_id ?? "unknown"),
                                status: String(z.status ?? "completed"),
                                observedAt: Date.now()
                            };
                            continue
                        }
                        if (j.type === "system" && j.subtype === "init") {
                            R.cliTurnTentative ??= {
                                skipObserved: !1,
                                compromised: !1
                            }, J = null;
                            continue
                        }
                        if (j.type === "result") {
                            let z = R.cliTurnTentative !== null;
                            R.cliTurnTentative = null, te("[session-manager] orphan result received", {
                                sessionKey: u.sessionKey,
                                subtype: j.subtype,
                                hadTentative: z
                            }), u.pendingWake = !0, u.wakeResolver?.();
                            continue
                        }
                        continue
                    }
                    if (j.type === "system") {
                        if (j.subtype === "task_notification") {
                            let U = j;
                            await o(u.sessionKey, j), ne = {
                                taskId: String(U.task_id ?? "unknown"),
                                status: String(U.status ?? "completed"),
                                observedAt: Date.now()
                            }
                        }
                        if (j.subtype === "init") {
                            let U = !M.accepted;
                            R.hasAcceptedTurn = !0, M.accepted = !0, R.cliTurnTentative = null, J = U ? M : null;
                            try {
                                M.input.onTurnAcknowledged?.()
                            } catch {}
                            M.sessionId = j.session_id ?? M.sessionId, u.sdkSessionId = j.session_id ?? u.sdkSessionId, u.sdkSessionIdVerified = !0, D && j.session_id && D !== j.session_id && Z("[session-manager] SDK session ID mismatch — context lost", {
                                sessionKey: u.sessionKey,
                                requestedSessionId: D,
                                actualSessionId: j.session_id
                            }), j.session_id && u.jobStateless !== !0 && await patchSessionRuntimeState(t, u.sessionKey, {
                                sdk_session_id: j.session_id,
                                sdk_session_runtime: "claude"
                            }), u.pendingPreempt && u.pendingPreemptBoundary === "accept" && (u.pendingPreempt = !1, u.pendingPreemptBoundary = null, u.pendingPreemptReason = null, interruptActorQuery(u))
                        }
                        let z;
                        j.subtype === "init" ? z = {
                            session_id: j.session_id
                        } : j.subtype === "compact_boundary" && j.compact_metadata && (z = {
                            trigger: j.compact_metadata.trigger,
                            pre_tokens: j.compact_metadata.pre_tokens,
                            post_tokens: j.compact_metadata.post_tokens
                        }), M.input.onExecutionEvent?.({
                            type: "system",
                            subtype: j.subtype ?? "unknown",
                            data: z
                        });
                        continue
                    }
                    if (j.type === "stream_event") {
                        let z = kf(j);
                        for (let Ee of fC(j.event)) N(M, Ee.text, Ee.isDelta, z);
                        for (let Ee of pC(j.event)) M.input.onExecutionEvent?.({
                            type: "thought_chunk",
                            text: Ee
                        });
                        let U = mC(j.event);
                        U && (M.toolBlockIndexMap.set(U.index, {
                            toolUseId: U.toolUseId,
                            toolName: U.toolName
                        }), M.toolUseMap.set(U.toolUseId, U.toolName), M.input.onExecutionEvent?.({
                            type: "tool_use",
                            toolUseId: U.toolUseId,
                            toolName: U.toolName,
                            input: void 0,
                            ephemeral: !0,
                            isSidechain: z
                        }));
                        let X = hC(j.event);
                        if (X) {
                            let Ee = M.toolBlockIndexMap.get(X.index);
                            Ee && M.input.onExecutionEvent?.({
                                type: "tool_input_delta",
                                toolUseId: Ee.toolUseId,
                                toolName: Ee.toolName,
                                partialJson: X.partialJson
                            })
                        }
                        continue
                    }
                    if (typeof j.type == "string" && j.type.includes("assistant")) {
                        let z = kf(j);
                        for (let X of dC(j)) N(M, X.text, X.isDelta, z);
                        let U = j.message?.content;
                        if (Array.isArray(U))
                            for (let X of U) {
                                if (!X || typeof X != "object" || X.type !== "tool_use") continue;
                                let Ee = X.id,
                                    be = X.name;
                                !Ee || !be || (M.toolUseMap.set(Ee, be), M.input.onExecutionEvent?.({
                                    type: "tool_use",
                                    toolUseId: Ee,
                                    toolName: be,
                                    input: X.input,
                                    isSidechain: z
                                }))
                            }
                        continue
                    }
                    if (j.type === "user") {
                        let z = kf(j),
                            U = j.message?.content;
                        if (Array.isArray(U))
                            for (let X of U) {
                                if (!X || typeof X != "object" || X.type !== "tool_result") continue;
                                let Ee = X.tool_use_id;
                                Ee && (M.input.onExecutionEvent?.({
                                    type: "tool_result",
                                    toolUseId: Ee,
                                    toolName: M.toolUseMap.get(Ee),
                                    isError: X.is_error ?? !1,
                                    summary: gC(X.content),
                                    isSidechain: z
                                }), M.turnStreamedText = "")
                            }
                        continue
                    }
                    if (j.type === "result") {
                        if (j.subtype === "success") {
                            if (typeof j.result == "string" && (M.text = j.result), j.structured_output !== void 0 && (M.structured = j.structured_output), M.usage = mapClaudeResultToDrainUsage(j, {
                                    prevModelUsage: ue,
                                    prevTotalCostUsd: Ie
                                }), M.usage && !M.skipCalled && typeof $.getContextUsage == "function") try {
                                let U = (await $.getContextUsage())?.totalTokens;
                                typeof U == "number" && Number.isFinite(U) && U >= 0 && (M.usage.context_used_tokens = U)
                            } catch {}
                            if (await V(), R.currentTurn = null, M.skipCalled) M.resolve({
                                sessionId: M.sessionId ?? u.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: M.usage
                            });
                            else {
                                let z = M.text ?? (M.streamedText ? M.streamedText : void 0);
                                M.resolve({
                                    sessionId: M.sessionId ?? u.sdkSessionId,
                                    text: z,
                                    structured: M.structured,
                                    usage: M.usage
                                })
                            }
                            continue
                        }
                        if (j.subtype === "error_during_execution" && M.skipCalled) {
                            await V(), R.currentTurn = null, M.resolve({
                                sessionId: M.sessionId ?? u.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: M.usage
                            });
                            continue
                        }
                        await V(), R.currentTurn = null, j.subtype === "error_during_execution" ? M.accepted ? M.reject(new AgentSdkTurnInterruptedError) : u.pendingClear ? (R.needsRecreation = !0, M.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : (R.needsRecreation = !0, D && !u.sdkSessionIdVerified && (u.sdkSessionId = void 0, u.pendingWake = !0, await patchSessionRuntimeState(t, u.sessionKey, {
                            sdk_session_id: null,
                            sdk_session_runtime: null,
                            pending_fork_to: null
                        }).catch(() => {}), Z("[session-manager] cleared stale sdk_session_id after resume failure", {
                            sessionKey: u.sessionKey,
                            staleSessionId: D
                        })), M.reject(new AgentSdkPromptNotAcceptedAbortError)) : M.reject(new Error(`Unexpected streaming SDK result subtype: ${j.subtype??"unknown"}`))
                    }
                }
            } catch (fe) {
                let j = R.currentTurn;
                R.currentTurn = null, j && (I.signal.aborted && !j.accepted ? (R.needsRecreation = !0, u.pendingClear ? j.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : j.reject(new AgentSdkPromptNotAcceptedAbortError)) : I.signal.aborted ? j.reject(Bh("Streaming SDK run aborted", fe)) : (j.accepted || (R.needsRecreation = !0), j.reject(fe))), x(() => new AgentSdkPromptNotAcceptedAbortError)
            } finally {
                R.closed = !0, R.needsRecreation = !0, I.signal.aborted || _t("warn", "[kv-cache] streaming loop exited unexpectedly (closed)", {
                    sessionKey: u.sessionKey,
                    generation: u.streamingGeneration,
                    sdk_session_id: u.sdkSessionId ?? null
                });
                let fe = R.currentTurn;
                R.currentTurn = null, fe && (I.signal.aborted && !fe.accepted ? u.pendingClear ? fe.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : fe.reject(new AgentSdkPromptNotAcceptedAbortError) : I.signal.aborted ? fe.reject(Bh("Streaming SDK run aborted")) : fe.accepted ? fe.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution")) : fe.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), x(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), ne && (u.lastCliTurnSettledAt === void 0 || ne.observedAt > u.lastCliTurnSettledAt) && _t("warn", "[completion-owner] unspoken-completion", {
                    sessionKey: u.sessionKey,
                    taskId: ne.taskId,
                    status: ne.status,
                    generation: u.streamingGeneration
                }), R.cliTurnTentative = null, u.wakeResolver?.(), u.pendingSteer && (await V(), u.wakeResolver?.()), u.streamingState === R && (u.streamingState = null), u.query === $ && (u.query = null), u.streamAbortController === I && (u.streamAbortController = null)
            }
        })(), R
    }
    return {
        ensureStreamingSession: a
    }
}
