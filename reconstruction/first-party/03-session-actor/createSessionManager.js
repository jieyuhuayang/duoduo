// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: fot, daemon.pretty.js:74339)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
    let {
        paths: t,
        bus: n,
        sdk: r,
        idleTimeoutMs: i = 36e5,
        heartbeatIntervalMs: o = 3e4
    } = e, s = r ?? createAgentSdkAdapter(), a = e.codexAvailability ?? checkCodexAvailability, l = e.codexAdapterFactory ?? createCodexAppServerAdapter, u = null, c = () => (u || (u = a()), u), d = e.grokAvailability ?? checkGrokAvailability, p = e.grokAdapterFactory ?? createGrokAcpAdapter, f = null, m = () => (f || (f = d()), f), h = g => g.map(E => ({
        value: E.value,
        displayName: E.displayName
    }));
    async function y(g, E) {
        if (E?.runtime === "grok") return "grok";
        if (E?.runtime === "codex") return "codex";
        let N = (await It(t, g).catch(() => null))?.source_channel_id;
        if (!N) return E?.runtime ?? "claude";
        let U = await eo(t, N).catch(() => null),
            D = U?.channel_kind,
            ne = D ? await Ts(t.channelConfigDir, D).catch(() => null) : null,
            Oe = U?.runtime ?? ne?.runtime;
        return Oe === "grok" ? "grok" : Oe === "codex" && (await c()).ok ? "codex" : E?.runtime ?? "claude"
    }

    function _(g) {
        if (!(!g || typeof g != "object" || typeof g.setModel != "function")) return g
    }
    async function k(g, E) {
        let z = E.trim();
        if (!z) return;
        let N = ed({
            channel_kind: DB(g),
            session_key: g,
            payload: {
                text: z
            }
        });
        try {
            await td(t, N), n.emit("session.output", {
                sessionKey: g,
                record: N
            })
        } catch (U) {
            et("[session-manager] grok detached-turn outbox write failed", {
                sessionKey: g,
                error: U instanceof Error ? U.message : String(U)
            })
        }
    }
    async function v(g, E) {
        let z = await Rd(t, g);
        if (z) return z;
        if (TU(E?.sourceKind)) {
            let N = await Ed(t, {
                channel_kind: E?.sourceKind,
                channel_id: E?.sourceChannelId
            });
            if (N) return N
        }
        return Cm(await Rs(t.channelConfigDir))
    }
    async function b(g, E, z, N) {
        let U = E ? F(E) : void 0,
            D = E ? L(E) : void 0,
            ne = await v(g, N),
            Oe = z ? void 0 : Wb(t, g, await It(t, g).catch(() => null) ?? void 0).cwd,
            bt = await Bb({
                model: z,
                cwd: Oe,
                daemonEnv: process.env,
                mergedCatalog: ne.claudeModelProfiles ?? {},
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                issues: ne.claudeModelProfileIssues
            }),
            ye = oh(bt, ne.claudeModelProfileIssues);
        if (ye.length > 0) return {
            outcome: "blocked",
            detail: JI(ye)
        };
        let Ft = Bme(bt);
        return U === void 0 || D === void 0 ? {
            outcome: "unknown",
            requirementKind: bt.kind,
            contextWindow: Ft
        } : {
            outcome: PT({
                capToken: ih({
                    requirement: bt,
                    hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                    liveGenerationToken: U
                }),
                requirement: bt,
                aliases: TT(ne.claudeModelAliases)
            }) === D ? "compatible" : "rebuild",
            requirementKind: bt.kind,
            contextWindow: Ft
        }
    }
    let I = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
        T = e.maxConcurrentJob ?? 6,
        S = {
            name: "channel",
            activeCount: 0,
            maxConcurrent: I,
            wakeQueue: []
        },
        w = {
            name: "job",
            activeCount: 0,
            maxConcurrent: T,
            wakeQueue: []
        };

    function C(g, E) {
        return cot(g, E) === "job" ? w : S
    }

    function O(g) {
        return S.wakeQueue.includes(g) || w.wakeQueue.includes(g)
    }

    function A(g) {
        if (g.wakeQueue.length === 0 || !j) return;
        let E = g.wakeQueue.findIndex(U => !hr(U));
        if (E === -1) {
            ht("[session-manager] dequeue deferred: every queued session is archiving", {
                pool: g.name,
                queuedSessions: g.wakeQueue.length
            });
            return
        }
        let z = g.wakeQueue.splice(E, 1)[0];
        E > 0 && ht("[session-manager] dequeue skipped archiving sessions", {
            skipped: E,
            sessionKey: z,
            pool: g.name
        }), ht("[session-manager] dequeue queued wake", {
            sessionKey: z,
            pool: g.name,
            queuedSessions: g.wakeQueue.length
        });
        let N = x.get(z);
        if (N && N.status === "idle" && !N.holdsPoolSlot && N.drainPromise) {
            N.pendingWake = !0, N.wakeResolver && (N.wakeResolver(), N.wakeResolver = null), ht("[session-manager] resuming idle actor from dequeue", {
                sessionKey: z,
                actorRunId: N.actorRunId,
                pool: g.name
            });
            return
        }
        if (g.activeCount >= g.maxConcurrent) {
            g.wakeQueue.unshift(z), ht("[session-manager] dequeue deferred: pool re-filled", {
                sessionKey: z,
                pool: g.name,
                activeCount: g.activeCount
            });
            return
        }
        if (N?.origin === "job" && N.jobId) {
            let U = N.jobId;
            Be(z, {
                origin: "job",
                jobId: U
            })
        } else {
            let U = jB(z);
            Be(z, U ?? void 0)
        }
    }
    let x = new Map,
        P = new Map,
        M = new Map,
        j = !1,
        H = 0,
        J = ({
            sessionKey: g,
            displayName: E,
            preempt: z,
            preemptBoundary: N
        }) => {
            ht("[session-manager] wake", {
                sessionKey: g,
                preempt: z ?? "allow",
                preemptBoundary: N ?? "default"
            }), E && P.set(g, E), We(g, {
                preempt: z,
                preemptBoundary: N
            })
        },
        ee = () => {
            qi()
        },
        ie = ({
            sessionKey: g,
            reason: E
        }) => {
            let z = x.get(g);
            if (!z) return;
            let N = z.streamingAdapter !== null;
            z.streamingAdapter = null;
            let U = !1;
            z.streamingState && !z.streamingState.closed && (z.streamingState.needsRecreation = !0, U = !0), (N || U) && K("[session-manager] streamingAdapter torn down for session", {
                sessionKey: g,
                reason: E,
                hadAdapter: N,
                stateMarked: U
            }), U && Ct("warn", "[kv-cache] needsRecreation flagged", {
                sessionKey: g,
                reason: E === "fork" ? "undo-fork" : "instructions-drift",
                generation: z.streamingGeneration,
                sdk_session_id: z.sdkSessionId ?? null
            })
        };

    function re(g) {
        g.query?.interrupt().catch(() => {})
    }

    function Ye(g) {
        if (g.query) {
            re(g);
            return
        }
        g.currentAbortController?.abort()
    }

    function je(g, E, z) {
        if (g.query) {
            if (z === "tool_result" && g.activeToolUseIds.size > 0) return g.pendingPreempt = !0, g.pendingPreemptBoundary = "tool_result", "defer_tool_result";
            let N = g.streamingState?.currentTurn;
            return N && !N.accepted ? (g.pendingPreempt = !0, g.pendingPreemptBoundary = "accept", "defer_accept") : (re(g), g.pendingPreempt = !1, g.pendingPreemptBoundary = null, "immediate")
        }
        return !g.currentAbortController || g.currentAbortController.signal.aborted ? "noop" : z === "tool_result" ? g.activeToolUseIds.size > 0 ? (g.pendingPreempt = !0, g.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (g.currentAbortController.abort(), g.currentAbortController = null, g.pendingPreempt = !1, g.pendingPreemptBoundary = null, "immediate") : z === "tool_use" ? g.isStreaming ? (g.pendingPreempt = !0, g.pendingPreemptBoundary = "tool_use", "defer_tool_use") : (g.currentAbortController.abort(), g.currentAbortController = null, g.pendingPreempt = !1, g.pendingPreemptBoundary = null, "immediate") : E === "soft" && g.isStreaming ? (g.pendingPreempt = !0, g.pendingPreemptBoundary = "tool_use", "defer_tool_use") : E === "soft" && g.activeToolUseIds.size > 0 ? (g.pendingPreempt = !0, g.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (g.currentAbortController.abort(), g.currentAbortController = null, g.pendingPreempt = !1, g.pendingPreemptBoundary = null, "immediate")
    }

    function Se(g) {
        let E;
        for (let z of g.inflightEventIds)(E ??= new Set).add(z);
        return E
    }

    function lt(g, E) {
        let z = g.claudeContextRequirement,
            N = z?.kind === "profiled-external" && z.modelOrigin !== void 0 ? z.model : null;
        return JSON.stringify({
            cwd: g.cwd,
            settingSources: g.settingSources ?? [],
            persistSession: g.persistSession,
            permissionMode: g.permissionMode,
            allowedTools: g.allowedTools ?? [],
            disallowedTools: g.disallowedTools ?? [],
            tools: g.tools ?? [],
            additionalDirectories: g.additionalDirectories ?? [],
            autoloadAdditionalDirectoryClaudeMd: g.autoloadAdditionalDirectoryClaudeMd,
            [I_e]: E,
            [sot]: N
        })
    }
    async function Fe(g, E) {
        let z = g.streamingState;
        if (!z) return;
        E && Ct("warn", `[kv-cache] streaming teardown: ${E}`, {
            sessionKey: g.sessionKey,
            generation: g.streamingGeneration,
            sdk_session_id: g.sdkSessionId ?? null
        });
        let N = g.query;
        g.streamingState = null, g.query = null, g.streamAbortController = null, g.spawnBoardHash = void 0, z.abortController.signal.aborted || z.abortController.abort(), typeof N?.close == "function" && N.close();
        try {
            await z.loopPromise
        } catch {}
    }
    async function qe(g, E) {
        let z = E,
            N = String(z.task_id ?? "unknown"),
            U = String(z.status ?? "completed"),
            D = String(z.summary ?? ""),
            ne = String(z.output_file ?? "");
        try {
            let Oe = await Td(t, n, {
                traceId: `task-notify-${N}`,
                routeId: "task_notification",
                sourceName: "sdk_subagent",
                targetSessionKey: g,
                sourceSessionKey: g,
                eventType: "notify",
                walOnly: !0,
                payload: {
                    task_id: N,
                    task_status: U,
                    task_summary: D || void 0,
                    task_output_file: ne || void 0,
                    completion_owner: "claude-cli"
                }
            });
            Ae("[session-manager] task_notification recorded WAL-only", {
                sessionKey: g,
                taskId: N,
                status: U,
                success: Oe.success
            })
        } catch (Oe) {
            et("[session-manager] task_notification WAL record failed", {
                sessionKey: g,
                taskId: N,
                status: U,
                error: Oe instanceof Error ? Oe.message : String(Oe)
            })
        }
    }

    function F(g) {
        let E = g.streamingState;
        if (!(!E || E.closed)) return E.spawnMaxContextToken ?? null
    }

    function L(g) {
        let E = g.streamingState;
        if (!(!E || E.closed)) return E.spawnDeliveryToken
    }

    function B(g, E) {
        if (E === void 0 || E === "native-claude") return !1;
        let z = g.streamingState;
        return !!(z && !z.closed)
    }

    function te(g, E) {
        if (!B(g, E.requirementKind)) return !1;
        let z = g.streamingState;
        return z ? (z.needsRecreation = !0, Ct("warn", "[kv-cache] needsRecreation flagged", {
            sessionKey: g.sessionKey,
            reason: "model-apply-rejected",
            via: E.reason,
            model: E.model,
            generation: g.streamingGeneration,
            sdk_session_id: g.sdkSessionId ?? null
        }), !0) : !1
    }
    async function Le(g, E) {
        if (!s.createStreamingQuery) throw new Error("Streaming query support unavailable");
        let z = F(g),
            N = ih({
                requirement: E.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: z
            }),
            U = PT({
                capToken: N,
                requirement: E.claudeContextRequirement,
                aliases: E.claudeModelAliases
            }),
            D = lt(E, U),
            ne = E.sessionId;
        if (g.streamingState && !g.streamingState.closed && !g.streamingState.needsRecreation && g.streamingState.configSignature === D && (g.streamingState.hasAcceptedTurn || g.streamingState.initialSessionId === ne)) return g.streamingState;
        let Oe = g.streamingState,
            bt;
        if (Oe && !Oe.closed)
            if (Oe.configSignature !== D) {
                let we = N_e(Oe.configSignature, D);
                Ct("warn", "[kv-cache] respawn: signature-mismatch", {
                    sessionKey: g.sessionKey,
                    generation: g.streamingGeneration,
                    sdk_session_id: g.sdkSessionId ?? null,
                    diff: we
                }), we.some(se => se.startsWith(`${I_e}:`)) && (bt = "model-context-profile-change")
            } else Oe.needsRecreation ? Ae("[kv-cache] respawn: recreation-requested (already audited at source)", {
                sessionKey: g.sessionKey,
                generation: g.streamingGeneration,
                sdk_session_id: g.sdkSessionId ?? null
            }) : Ct("warn", "[kv-cache] respawn: resume-sessionid-change", {
                sessionKey: g.sessionKey,
                generation: g.streamingGeneration,
                sdk_session_id: g.sdkSessionId ?? null,
                requested_session_id: ne ?? null
            });
        await Fe(g, bt);
        let ye = ih({
                requirement: E.claudeContextRequirement,
                hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                liveGenerationToken: void 0
            }),
            Ft = ye === N ? U : PT({
                capToken: ye,
                requirement: E.claudeContextRequirement,
                aliases: E.claudeModelAliases
            }),
            Xe = Ft === U ? D : lt(E, Ft),
            mt = new vC,
            _e = new AbortController,
            kt = E.mcpServersFactory ? E.mcpServersFactory() : E.mcpServers,
            Ee = {
                queue: mt,
                abortController: _e,
                configSignature: Xe,
                initialSessionId: ne,
                hasAcceptedTurn: !1,
                needsRecreation: !1,
                closed: !1,
                currentTurn: null,
                loopPromise: Promise.resolve(),
                cliTurnTentative: null,
                spawnMaxContextToken: ye,
                spawnDeliveryToken: Ft,
                liveModel: E.model
            },
            hn = we => {
                for (let se of mt.drain()) se.reject(we())
            };
        async function* Xt() {
            for (; !_e.signal.aborted;) {
                let we;
                try {
                    we = await mt.dequeue(_e.signal)
                } catch ($e) {
                    if ($e instanceof Error && $e.name === "AbortError") return;
                    throw $e
                }
                let se = Ee.currentTurn;
                if (se !== null && se !== we) {
                    Z("[session-manager] drain turn dequeued while the slot is occupied — rejected", {
                        sessionKey: g.sessionKey,
                        occupantAccepted: se.accepted
                    }), we.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming slot occupied — prompt not yielded; retry after the occupant settles"));
                    continue
                } else Ee.currentTurn = we, Ee.cliTurnTentative && (Ee.cliTurnTentative.compromised = !0), we.accepted = !1, we.streamedText = "", we.turnStreamedText = "", we.toolUseMap.clear();
                for await (let $e of we.input.prompt) yield $e
            }
        }
        let Mn = E.sessionId,
            {
                query: Ht
            } = s.createStreamingQuery({
                prompt: Xt(),
                abortController: _e,
                sessionId: Mn,
                cwd: E.cwd,
                settingSources: E.settingSources,
                persistSession: E.persistSession,
                permissionMode: E.permissionMode,
                allowedTools: E.allowedTools,
                disallowedTools: E.disallowedTools,
                tools: E.tools,
                effort: E.effort,
                model: E.model,
                claudeContextRequirement: E.claudeContextRequirement,
                claudeSettingsPath: E.claudeSettingsPath,
                mcpServers: kt,
                additionalDirectories: E.additionalDirectories,
                autoloadAdditionalDirectoryClaudeMd: E.autoloadAdditionalDirectoryClaudeMd,
                systemPrompt: E.systemPrompt,
                hooks: {
                    PreToolUse: [{
                        matcher: "*",
                        hooks: [async we => {
                            let se = we,
                                $e = se.transcript_path;
                            return typeof $e == "string" && $e.length > 0 && se.agent_id === void 0 && g.lastTranscriptPath !== $e && (g.lastTranscriptPath = $e, ut(t, g.sessionKey, {
                                transcript_path: $e
                            }).catch(() => {})), {}
                        }]
                    }, {
                        matcher: wd,
                        hooks: [async we => {
                            let se = we?.agent_id !== void 0,
                                $e = se ? null : Ee.currentTurn;
                            return $e ? $e.skipCalled = !0 : !se && Ee.cliTurnTentative && (Ee.cliTurnTentative.skipObserved = !0), {
                                continue: !1,
                                stopReason: "The agent intentionally ended this turn silently by calling Skip."
                            }
                        }]
                    }],
                    PostToolUse: [{
                        matcher: "*",
                        hooks: [async () => {
                            let we = [];
                            if (Ee.currentTurn?.skipCalled === !0) return {};
                            if (Ee.cliTurnTentative?.skipObserved === !0) return {};
                            let se = g.pendingSteer;
                            if (se && (g.pendingSteer = null, !se.settled)) {
                                se.settled = !0;
                                try {
                                    await Ir(t, g.sessionKey, se.eventIds)
                                } catch ($e) {
                                    K("[session-manager] steer hook markDone error", {
                                        sessionKey: g.sessionKey,
                                        error: String($e)
                                    })
                                }
                                for (let $e of se.claimedEventIds) g.inflightEventIds.delete($e);
                                K("[session-manager] steer hook: injected interjection mid-turn", {
                                    sessionKey: g.sessionKey,
                                    eventIds: se.eventIds
                                }), we.push(se.steerText)
                            }
                            return we.length === 0 ? {} : {
                                hookSpecificOutput: {
                                    hookEventName: "PostToolUse",
                                    additionalContext: we.join(`

`)
                                }
                            }
                        }]
                    }]
                }
            });
        g.query = Ht, g.streamAbortController = _e, g.streamingState = Ee, g.spawnBoardHash = E.boardHash, g.streamingGeneration += 1;
        let Te = g.streamingGeneration,
            He = E.model,
            cn = typeof Ht.setModel == "function",
            nn = typeof Ht.applyFlagSettings == "function";
        if (cn || nn) {
            let we = await It(t, g.sessionKey).catch(() => null);
            if (cn) {
                let se = we ? we.model ?? null : void 0,
                    Y = E.claudeContextRequirement?.kind === "profiled-external" && E.claudeContextRequirement.modelOrigin !== void 0 ? null : E.model ?? null;
                if (se !== void 0 && se !== Y && !_e.signal.aborted) {
                    let Ot = "compatible",
                        yt;
                    try {
                        let gn = await b(g.sessionKey, g, se);
                        Ot = gn.outcome, gn.outcome !== "blocked" && (yt = gn.requirementKind)
                    } catch (gn) {
                        Z("[session-manager] spawn-time model reconcile failed to read config", {
                            sessionKey: g.sessionKey,
                            model: se ?? "(reset to default)",
                            error: gn instanceof Error ? gn.message : String(gn)
                        }), Ot = "config-unreadable"
                    }
                    if (Ot !== "compatible") Z("[session-manager] deferring spawn-time model re-apply — context profile differs from this generation", {
                        sessionKey: g.sessionKey,
                        generation: Te,
                        deferred_model: se ?? "(reset to default)",
                        running_model: E.model ?? "(runtime default)",
                        outcome: Ot
                    });
                    else try {
                        await Ht.setModel(se ?? void 0), He = se ?? void 0, Ee.liveModel = se ?? void 0
                    } catch (gn) {
                        Z("[session-manager] failed to re-apply session model override — keeping it for the next spawn", {
                            sessionKey: g.sessionKey,
                            model: se ?? "(reset to default)",
                            running_model: E.model ?? "(runtime default)",
                            error: gn instanceof Error ? gn.message : String(gn)
                        }), se !== null && te(g, {
                            model: se,
                            requirementKind: yt,
                            reason: "spawn-reconcile"
                        })
                    }
                }
            }
            if (nn && !_e.signal.aborted) {
                let se = we?.effort ?? null,
                    $e = E.effort ?? null;
                if (se !== $e) try {
                    await Ht.applyFlagSettings({
                        effortLevel: se
                    })
                } catch (Y) {
                    Z("[session-manager] failed to re-apply session effort override at spawn", {
                        sessionKey: g.sessionKey,
                        effort: se ?? "(reset to default)",
                        error: Y instanceof Error ? Y.message : String(Y)
                    })
                }
            }
        }
        Ct("info", "[kv-cache] streaming subprocess spawned", {
            sessionKey: g.sessionKey,
            generation: Te,
            model: He ?? "default",
            context_profile_source: HI(E.claudeContextRequirement),
            max_context_token: ye,
            ...VI(E.claudeContextRequirement),
            alias_tiers: WI(E.claudeModelAliases),
            board_hash: E.boardHash ? E.boardHash.slice(0, 12) : null
        });
        let Wn = (we, se, $e, Y = !1) => {
                if (se && !we.skipCalled) {
                    if (Y) {
                        we.input.onStream?.(se, !0);
                        return
                    }
                    if ($e) {
                        we.streamedText += se, we.turnStreamedText += se, we.input.onStream?.(se, !1);
                        return
                    }
                    if (we.turnStreamedText && se.startsWith(we.turnStreamedText)) {
                        let Ot = se.slice(we.turnStreamedText.length);
                        Ot && (we.streamedText += Ot, we.turnStreamedText = se, we.input.onStream?.(Ot, !1));
                        return
                    }
                    if (se.startsWith(we.streamedText)) {
                        let Ot = se.slice(we.streamedText.length);
                        Ot && (we.streamedText = se, we.turnStreamedText += Ot, we.input.onStream?.(Ot, !1));
                        return
                    }
                    we.streamedText += se, we.turnStreamedText += se, we.input.onStream?.(se, !1)
                }
            },
            Jn = async () => {
                let we = g.pendingSteer;
                if (we && (g.pendingSteer = null, !we.settled)) {
                    if (Ee.closed) {
                        we.settled = !0;
                        let se = [];
                        for (let Y = 0; Y < we.requeueLines.length; Y += 1) {
                            let Ot = we.requeueLines[Y],
                                yt = we.requeueEventIds[Y];
                            try {
                                await ua(t, g.sessionKey, Ot), se.push(yt)
                            } catch (gn) {
                                Z("[session-manager] steer fallback closed-stream requeue failed", {
                                    sessionKey: g.sessionKey,
                                    eventId: yt,
                                    error: gn instanceof Error ? gn.message : String(gn)
                                })
                            }
                        }
                        let $e = [...se, ...we.processedEventIds];
                        if ($e.length > 0) try {
                            await Ir(t, g.sessionKey, $e)
                        } catch (Y) {
                            K("[session-manager] steer fallback closed markDone error", {
                                sessionKey: g.sessionKey,
                                error: String(Y)
                            })
                        }
                        for (let Y of we.claimedEventIds) g.inflightEventIds.delete(Y);
                        g.pendingWake = !0, K("[session-manager] steer fallback requeued to inbox (stream closed)", {
                            sessionKey: g.sessionKey,
                            eventIds: we.eventIds,
                            requeued: se.length,
                            requeueFailed: we.requeueLines.length - se.length
                        });
                        return
                    }
                    we.settled = !0;
                    try {
                        await we.enqueueAsNewTurn()
                    } catch (se) {
                        K("[session-manager] steer fallback enqueue error", {
                            sessionKey: g.sessionKey,
                            error: String(se)
                        })
                    }
                }
            }, Ei = we => we.origin?.kind === "task-notification", Hr = async (we, se, $e, Y) => {
                let Ot = we,
                    yt = typeof Ot.duration_ms == "number" && Number.isFinite(Ot.duration_ms) && Ot.duration_ms >= 0 ? Ot.duration_ms : 0,
                    gn = typeof Ot.duration_api_ms == "number" && Number.isFinite(Ot.duration_api_ms) && Ot.duration_api_ms >= 0 ? Ot.duration_api_ms : 0;
                try {
                    await appendDrainRecord(t, {
                        origin: "cli-turn",
                        id: tot(),
                        session_key: g.sessionKey,
                        sdk_session_id: g.sdkSessionId,
                        drain_started_at: new Date(Y - yt).toISOString(),
                        drain_duration_ms: yt,
                        sdk_duration_ms: gn,
                        events_processed: 0,
                        events_skipped: 0,
                        tool_calls: 0,
                        tool_errors: 0,
                        output_chars: $e,
                        cancelled: !1,
                        usage: se
                    })
                } catch (ce) {
                    et("[completion-owner] CLI turn ledger write failed", {
                        sessionKey: g.sessionKey,
                        generation: g.streamingGeneration,
                        error: ce instanceof Error ? ce.message : String(ce)
                    })
                }
            };
        return Ee.loopPromise = (async () => {
            let we = null,
                se;
            try {
                for await (let $e of Ht) {
                    let Y = $e;
                    g.lastActivityAt = Date.now();
                    let Ot, yt, gn = null;
                    if (Y.type === "result") {
                        Ot = Ee.lastModelUsage, yt = Ee.lastTotalCostUsd, gn = we, we = null;
                        let ke = Y.modelUsage;
                        ke !== void 0 && (Ee.lastModelUsage = ke);
                        let De = Y.total_cost_usd;
                        typeof De == "number" && (Ee.lastTotalCostUsd = De)
                    }
                    if (Y.type === "result" && Ei(Y)) {
                        let ke = Date.now(),
                            De = Ee.cliTurnTentative;
                        Ee.cliTurnTentative = null;
                        let at = Ee.currentTurn,
                            yn = De?.skipObserved ?? !1,
                            ai;
                        if (Y.subtype === "success" && (ai = Rm(Y, {
                                prevModelUsage: Ot,
                                prevTotalCostUsd: yt
                            }), ai && !yn && typeof Ht.getContextUsage == "function")) try {
                            let Dr = (await Ht.getContextUsage())?.totalTokens;
                            typeof Dr == "number" && Number.isFinite(Dr) && Dr >= 0 && (ai.context_used_tokens = Dr)
                        } catch {}
                        if (g.lastCliTurnSettledAt = ke, g.lastTurnCompletedAt = ke, se = void 0, at) {
                            let _n = gn === at,
                                Dr = De?.compromised === !0,
                                ir = at.accepted;
                            Ee.currentTurn = null, at.accepted = !1, await Jn(), (ir || at.streamedText.length > 0 || at.turnStreamedText.length > 0) && n.emit("session.stream_end", {
                                sessionKey: g.sessionKey,
                                reason: "interrupted"
                            }), at.reject(new AgentSdkPromptNotAcceptedAbortError("Task-completion turn folded with mailbox drain; retrying the drain")), g.pendingWake = !0, g.wakeResolver?.(), await Hr(Y, ai, 0, ke), Ct("warn", "[completion-owner] voided folded drain", {
                                sessionKey: g.sessionKey,
                                generation: g.streamingGeneration,
                                acceptedByForeignInit: _n,
                                installedDuringTentative: Dr,
                                wasAccepted: ir
                            });
                            continue
                        }
                        let Nr = 0,
                            br = Y.subtype === "success" && !yn && typeof Y.result == "string" && Y.result.length > 0 ? Y.result : void 0;
                        if (br !== void 0) {
                            let _n = await n4(t, g.sessionKey).catch(() => {}),
                                Dr = ed({
                                    channel_kind: DB(g.sessionKey),
                                    session_key: g.sessionKey,
                                    payload: {
                                        text: br,
                                        attachments: _n
                                    }
                                });
                            try {
                                await td(t, Dr), Nr = br.length, n.emit("session.output", {
                                    sessionKey: g.sessionKey,
                                    record: Dr
                                })
                            } catch (ir) {
                                et("[completion-owner] proactive outbox write failed", {
                                    sessionKey: g.sessionKey,
                                    generation: g.streamingGeneration,
                                    error: ir instanceof Error ? ir.message : String(ir)
                                })
                            }
                            Nr > 0 && _n && await tP(t, g.sessionKey).catch(ir => et("[completion-owner] pending attachment clear failed", {
                                sessionKey: g.sessionKey,
                                generation: g.streamingGeneration,
                                error: ir instanceof Error ? ir.message : String(ir)
                            }))
                        }
                        await Hr(Y, ai, Nr, ke), g.pendingWake = !0, g.wakeResolver?.(), K("[completion-owner] settled CLI completion turn", {
                            sessionKey: g.sessionKey,
                            generation: g.streamingGeneration,
                            subtype: Y.subtype,
                            skipped: yn,
                            outputChars: Nr
                        });
                        continue
                    }
                    let ce = Ee.currentTurn;
                    if (!ce) {
                        if (Y.type === "system" && Y.subtype === "task_notification") {
                            let ke = Y;
                            await qe(g.sessionKey, Y), se = {
                                taskId: String(ke.task_id ?? "unknown"),
                                status: String(ke.status ?? "completed"),
                                observedAt: Date.now()
                            };
                            continue
                        }
                        if (Y.type === "system" && Y.subtype === "init") {
                            Ee.cliTurnTentative ??= {
                                skipObserved: !1,
                                compromised: !1
                            }, we = null;
                            continue
                        }
                        if (Y.type === "result") {
                            let ke = Ee.cliTurnTentative !== null;
                            Ee.cliTurnTentative = null, K("[session-manager] orphan result received", {
                                sessionKey: g.sessionKey,
                                subtype: Y.subtype,
                                hadTentative: ke
                            }), g.pendingWake = !0, g.wakeResolver?.();
                            continue
                        }
                        continue
                    }
                    if (Y.type === "system") {
                        if (Y.subtype === "task_notification") {
                            let De = Y;
                            await qe(g.sessionKey, Y), se = {
                                taskId: String(De.task_id ?? "unknown"),
                                status: String(De.status ?? "completed"),
                                observedAt: Date.now()
                            }
                        }
                        if (Y.subtype === "init") {
                            let De = !ce.accepted;
                            Ee.hasAcceptedTurn = !0, ce.accepted = !0, Ee.cliTurnTentative = null, we = De ? ce : null;
                            try {
                                ce.input.onTurnAcknowledged?.()
                            } catch {}
                            ce.sessionId = Y.session_id ?? ce.sessionId, g.sdkSessionId = Y.session_id ?? g.sdkSessionId, g.sdkSessionIdVerified = !0, Mn && Y.session_id && Mn !== Y.session_id && Z("[session-manager] SDK session ID mismatch — context lost", {
                                sessionKey: g.sessionKey,
                                requestedSessionId: Mn,
                                actualSessionId: Y.session_id
                            }), Y.session_id && g.jobStateless !== !0 && await ut(t, g.sessionKey, {
                                sdk_session_id: Y.session_id
                            }), g.pendingPreempt && g.pendingPreemptBoundary === "accept" && (g.pendingPreempt = !1, g.pendingPreemptBoundary = null, re(g))
                        }
                        let ke;
                        Y.subtype === "init" ? ke = {
                            session_id: Y.session_id
                        } : Y.subtype === "compact_boundary" && Y.compact_metadata && (ke = {
                            trigger: Y.compact_metadata.trigger,
                            pre_tokens: Y.compact_metadata.pre_tokens,
                            post_tokens: Y.compact_metadata.post_tokens
                        }), ce.input.onExecutionEvent?.({
                            type: "system",
                            subtype: Y.subtype ?? "unknown",
                            data: ke
                        });
                        continue
                    }
                    if (Y.type === "stream_event") {
                        let ke = xm(Y);
                        for (let yn of bT(Y.event)) Wn(ce, yn.text, yn.isDelta, ke);
                        for (let yn of vT(Y.event)) ce.input.onExecutionEvent?.({
                            type: "thought_chunk",
                            text: yn
                        });
                        let De = wT(Y.event);
                        De && (ce.toolBlockIndexMap.set(De.index, {
                            toolUseId: De.toolUseId,
                            toolName: De.toolName
                        }), ce.toolUseMap.set(De.toolUseId, De.toolName), ce.input.onExecutionEvent?.({
                            type: "tool_use",
                            toolUseId: De.toolUseId,
                            toolName: De.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let at = ST(Y.event);
                        if (at) {
                            let yn = ce.toolBlockIndexMap.get(at.index);
                            yn && ce.input.onExecutionEvent?.({
                                type: "tool_input_delta",
                                toolUseId: yn.toolUseId,
                                toolName: yn.toolName,
                                partialJson: at.partialJson
                            })
                        }
                        continue
                    }
                    if (typeof Y.type == "string" && Y.type.includes("assistant")) {
                        let ke = xm(Y);
                        for (let at of _T(Y)) Wn(ce, at.text, at.isDelta, ke);
                        let De = Y.message?.content;
                        if (Array.isArray(De))
                            for (let at of De) {
                                if (!at || typeof at != "object" || at.type !== "tool_use") continue;
                                let yn = at.id,
                                    ai = at.name;
                                !yn || !ai || (ce.toolUseMap.set(yn, ai), ce.input.onExecutionEvent?.({
                                    type: "tool_use",
                                    toolUseId: yn,
                                    toolName: ai,
                                    input: at.input
                                }))
                            }
                        continue
                    }
                    if (Y.type === "user") {
                        let ke = Y.message?.content;
                        if (Array.isArray(ke))
                            for (let De of ke) {
                                if (!De || typeof De != "object" || De.type !== "tool_result") continue;
                                let at = De.tool_use_id;
                                at && (ce.input.onExecutionEvent?.({
                                    type: "tool_result",
                                    toolUseId: at,
                                    toolName: ce.toolUseMap.get(at),
                                    isError: De.is_error ?? !1,
                                    summary: kT(De.content)
                                }), ce.turnStreamedText = "")
                            }
                        continue
                    }
                    if (Y.type === "result") {
                        if (Y.subtype === "success") {
                            if (typeof Y.result == "string" && (ce.text = Y.result), Y.structured_output !== void 0 && (ce.structured = Y.structured_output), ce.usage = Rm(Y, {
                                    prevModelUsage: Ot,
                                    prevTotalCostUsd: yt
                                }), ce.usage && !ce.skipCalled && typeof Ht.getContextUsage == "function") try {
                                let De = (await Ht.getContextUsage())?.totalTokens;
                                typeof De == "number" && Number.isFinite(De) && De >= 0 && (ce.usage.context_used_tokens = De)
                            } catch {}
                            if (await Jn(), Ee.currentTurn = null, ce.skipCalled) ce.resolve({
                                sessionId: ce.sessionId ?? g.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: ce.usage
                            });
                            else {
                                let ke = ce.text ?? (ce.streamedText ? ce.streamedText : void 0);
                                ce.resolve({
                                    sessionId: ce.sessionId ?? g.sdkSessionId,
                                    text: ke,
                                    structured: ce.structured,
                                    usage: ce.usage
                                })
                            }
                            continue
                        }
                        if (Y.subtype === "error_during_execution" && ce.skipCalled) {
                            await Jn(), Ee.currentTurn = null, ce.resolve({
                                sessionId: ce.sessionId ?? g.sdkSessionId,
                                text: void 0,
                                skipped: !0,
                                usage: ce.usage
                            });
                            continue
                        }
                        ce.accepted && n.emit("session.stream_end", {
                            sessionKey: g.sessionKey,
                            reason: "interrupted"
                        }), await Jn(), Ee.currentTurn = null, Y.subtype === "error_during_execution" ? ce.accepted ? ce.reject(new AgentSdkTurnInterruptedError) : g.pendingClear ? (Ee.needsRecreation = !0, ce.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : (Ee.needsRecreation = !0, Mn && !g.sdkSessionIdVerified && (g.sdkSessionId = void 0, g.pendingWake = !0, await Es(t, g.sessionKey, "sdk_session_id").catch(() => {}), Z("[session-manager] cleared stale sdk_session_id after resume failure", {
                            sessionKey: g.sessionKey,
                            staleSessionId: Mn
                        })), ce.reject(new AgentSdkPromptNotAcceptedAbortError)) : ce.reject(new Error(`Unexpected streaming SDK result subtype: ${Y.subtype??"unknown"}`))
                    }
                }
            } catch ($e) {
                let Y = Ee.currentTurn;
                Ee.currentTurn = null, Y && (Y.accepted && n.emit("session.stream_end", {
                    sessionKey: g.sessionKey,
                    reason: "interrupted"
                }), _e.signal.aborted && !Y.accepted ? (Ee.needsRecreation = !0, g.pendingClear ? Y.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : Y.reject(new AgentSdkPromptNotAcceptedAbortError)) : _e.signal.aborted ? Y.reject(Em("Streaming SDK run aborted", $e)) : (Y.accepted || (Ee.needsRecreation = !0), Y.reject($e))), hn(() => new AgentSdkPromptNotAcceptedAbortError)
            } finally {
                Ee.closed = !0, Ee.needsRecreation = !0, _e.signal.aborted || Ct("warn", "[kv-cache] streaming loop exited unexpectedly (closed)", {
                    sessionKey: g.sessionKey,
                    generation: g.streamingGeneration,
                    sdk_session_id: g.sdkSessionId ?? null
                });
                let $e = Ee.currentTurn;
                Ee.currentTurn = null, $e && (_e.signal.aborted && !$e.accepted ? g.pendingClear ? $e.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : $e.reject(new AgentSdkPromptNotAcceptedAbortError) : _e.signal.aborted ? ($e.accepted && n.emit("session.stream_end", {
                    sessionKey: g.sessionKey,
                    reason: "interrupted"
                }), $e.reject(Em("Streaming SDK run aborted"))) : $e.accepted ? (n.emit("session.stream_end", {
                    sessionKey: g.sessionKey,
                    reason: "interrupted"
                }), $e.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution"))) : $e.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), hn(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), se && (g.lastCliTurnSettledAt === void 0 || se.observedAt > g.lastCliTurnSettledAt) && Ct("warn", "[completion-owner] unspoken-completion", {
                    sessionKey: g.sessionKey,
                    taskId: se.taskId,
                    status: se.status,
                    generation: g.streamingGeneration
                }), Ee.cliTurnTentative = null, g.wakeResolver?.(), g.pendingSteer && (await Jn(), g.wakeResolver?.()), g.streamingState === Ee && (g.streamingState = null), g.query === Ht && (g.query = null), g.streamAbortController === _e && (g.streamAbortController = null)
            }
        })(), Ee
    }

    function Re(g) {
        return g.runtime === "grok" && g.grokAdapter ? g.grokAdapter : g.runtime === "grok" ? {
            run: async () => {
                throw new Error("grok runtime selected but the grok ACP adapter is not wired; refusing to fall through to Claude")
            }
        } : g.runtime === "codex" && g.codexAdapter ? g.codexAdapter : g.origin !== "channel" || !s.createStreamingQuery ? s : (g.streamingAdapter || (g.streamingAdapter = {
            run: async E => {
                let z = await Le(g, E);
                return await new Promise((N, U) => {
                    if (z.closed) {
                        U(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
                        return
                    }
                    z.queue.enqueue({
                        input: E,
                        resolve: N,
                        reject: U,
                        accepted: !1,
                        sessionId: E.sessionId,
                        text: void 0,
                        structured: void 0,
                        usage: void 0,
                        streamedText: "",
                        turnStreamedText: "",
                        toolUseMap: new Map,
                        toolBlockIndexMap: new Map,
                        skipCalled: !1
                    })
                })
            },
            createStreamingQuery: s.createStreamingQuery,
            undo: s.undo ? s.undo.bind(s) : void 0
        }), g.streamingAdapter)
    }

    function We(g, E) {
        if (!j) {
            ht("[session-manager] wake ignored, manager not running", {
                sessionKey: g
            });
            return
        }
        if (hr(g)) {
            ht("[session-manager] wake suppressed, session is being archived", {
                sessionKey: g
            });
            return
        }
        let z = E?.preempt ?? "allow",
            N = E?.preemptBoundary,
            U = x.get(g);
        if (U && U.wakeResolver) {
            ht("[session-manager] wake delivered to idle actor", {
                sessionKey: g,
                actorRunId: U.actorRunId,
                status: U.status,
                preemptBoundary: N ?? "default"
            }), U.wakeResolver(), U.wakeResolver = null;
            return
        }
        if (U && U.drainPromise && (U.status === "active" || U.status === "idle")) {
            let Oe = !!U.query && U.streamingState?.currentTurn?.accepted === !0,
                bt = U.runtime === "codex" && !!U.codexAdapter?.activeTurnId?.();
            if (z === "allow" && (Oe || bt) && U.admissionCallback && !U.admissionInProgress) {
                U.pendingWake = !0, U.admissionInProgress = !0;
                let ye = U.admissionCallback;
                ht("[session-manager] wake: admitting to live streaming session", {
                    sessionKey: g,
                    actorRunId: U.actorRunId
                }), ye().then(() => {
                    U.admissionInProgress = !1, U.wakeResolver?.()
                }, () => {
                    U.admissionInProgress = !1, U.wakeResolver?.()
                });
                return
            }
            if (U.status === "active" && U.currentAbortController)
                if (z === "force") {
                    let ye = je(U, "immediate", N);
                    ye === "immediate" ? ht("[session-manager] wake: forced preempt", {
                        sessionKey: g,
                        actorRunId: U.actorRunId,
                        preemptBoundary: N ?? "default"
                    }) : ye === "defer_accept" ? ht("[session-manager] wake: forced preempt deferred until prompt acceptance", {
                        sessionKey: g,
                        actorRunId: U.actorRunId
                    }) : ye === "defer_tool_result" ? ht("[session-manager] wake: forced preempt deferred until tool_result", {
                        sessionKey: g,
                        actorRunId: U.actorRunId
                    }) : ye === "defer_tool_use" && ht("[session-manager] wake: forced preempt deferred until tool_use", {
                        sessionKey: g,
                        actorRunId: U.actorRunId
                    })
                } else if (z === "allow") {
                let ye = je(U, "soft", N);
                ye === "defer_accept" ? ht("[session-manager] wake: soft preempt deferred until prompt acceptance", {
                    sessionKey: g,
                    actorRunId: U.actorRunId
                }) : ye === "defer_tool_use" ? ht("[session-manager] wake: soft preempt pending (streaming)", {
                    sessionKey: g,
                    actorRunId: U.actorRunId
                }) : ye === "defer_tool_result" ? ht("[session-manager] wake: soft preempt deferred until tool_result", {
                    sessionKey: g,
                    actorRunId: U.actorRunId
                }) : ye === "immediate" && ht("[session-manager] wake: hard preempt (not streaming)", {
                    sessionKey: g,
                    actorRunId: U.actorRunId
                })
            } else ht("[session-manager] wake: preempt disabled, queueing only", {
                sessionKey: g,
                actorRunId: U.actorRunId
            });
            U.pendingWake = !0, ht("[session-manager] wake marked pending", {
                sessionKey: g,
                actorRunId: U.actorRunId,
                status: U.status
            });
            return
        }
        let D = C(g, U?.origin);
        if (D.activeCount >= D.maxConcurrent) {
            let Oe = D.wakeQueue.includes(g);
            Oe || D.wakeQueue.push(g), ht("[session-manager] wake queued", {
                sessionKey: g,
                pool: D.name,
                activeCount: D.activeCount,
                maxConcurrent: D.maxConcurrent,
                alreadyQueued: Oe,
                queuedSessions: D.wakeQueue.length
            });
            return
        }
        let ne = jB(g);
        ne ? (ht("[session-manager] wake starting actor with inferred origin", {
            sessionKey: g,
            ...ne
        }), Be(g, ne)) : (ht("[session-manager] wake starting actor", {
            sessionKey: g
        }), Be(g))
    }

    function Be(g, E) {
        let z = x.get(g),
            N = z?.attachedChannels ?? new Set,
            U = ++H,
            D = {
                sessionKey: g,
                actorRunId: U,
                sdkSessionId: z?.sdkSessionId,
                sdkSessionIdVerified: z?.sdkSessionIdVerified ?? !1,
                status: "active",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: z?.streamingAdapter ?? null,
                streamingGeneration: z?.streamingGeneration ?? 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                isStreaming: !1,
                activeToolUseIds: new Set,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: N,
                origin: E?.origin ?? z?.origin ?? "channel",
                jobId: E?.jobId ?? z?.jobId,
                jobStateless: z?.jobStateless ?? !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                admissionCallback: null,
                idleSince: void 0,
                spawnedAt: Date.now(),
                lastActivityAt: void 0,
                lastTurnCompletedAt: void 0,
                lastCliTurnSettledAt: void 0,
                notifyCalledDuringDrain: !1,
                runtime: E?.runtime ?? z?.runtime ?? "claude",
                codexAdapter: z?.codexAdapter ?? null,
                grokAdapter: z?.grokAdapter ?? null,
                consecutiveConservativeRedrive: z?.consecutiveConservativeRedrive ?? !1
            };
        x.set(g, D);
        let ne = C(g, D.origin);
        ne.activeCount++, D.holdsPoolSlot = !0;
        let Oe = P.get(g);
        if (Oe && P.delete(g), m0(t, {
                session_key: g,
                display_name: Oe,
                kind: D.origin === "job" ? "job" : D.origin === "system" ? "system" : g.startsWith("meta:") ? "meta" : "channel"
            }).catch(() => {}), K("[session-manager] actor start", {
                sessionKey: g,
                actorRunId: U,
                sdkSessionId: D.sdkSessionId,
                origin: D.origin,
                jobId: D.jobId,
                pool: ne.name,
                activeCount: ne.activeCount,
                attachedChannels: D.attachedChannels.size,
                queuedSessions: ne.wakeQueue.length
            }), E?.preStart) {
            let bt = E.preStart;
            D.drainPromise = bt().catch(ye => et("[session-manager] preStart failed", ye)).then(() => X(D))
        } else D.drainPromise = X(D)
    }
    async function X(g) {
        let {
            sessionKey: E
        } = g, z, N, U = 0, D = 0, ne = !1, Oe = [], bt = 0, ye = !1, Ft = !1, Xe = null, mt;
        try {
            mt = await fe(E)
        } catch (_e) {
            Z("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
                sessionKey: E,
                error: _e instanceof Error ? _e.message : String(_e)
            }), mt = new Set
        }
        ht("[session-manager] drain loop begin", {
            sessionKey: E,
            actorRunId: g.actorRunId,
            origin: g.origin,
            jobId: g.jobId
        });
        try {
            if (!g.sdkSessionId && !g.pendingClear) {
                let Te = await It(t, E);
                Te?.sdk_session_id && (g.sdkSessionId = Te.sdk_session_id, K("[session-manager] loaded sdk_session_id from state.json", {
                    sessionKey: E,
                    sdkSessionId: Te.sdk_session_id
                }))
            }
            if ((await It(t, E))?.session_key || await ut(t, E, {
                    session_key: E
                }), g.origin === "job" && !g.jobId) {
                await me.init();
                let He = (await me.listJobs()).find(cn => cn.session_key === E);
                He ? (g.jobId = He.id, Ae("[session-manager] recovered jobId from active jobs", {
                    sessionKey: E,
                    jobId: He.id
                })) : Z("[session-manager] job-origin actor has no matching active job", {
                    sessionKey: E
                })
            }
            let _e = !1,
                kt, Ee = !1,
                hn, Xt, Mn = null,
                Ht = !1;
            if (g.jobStateless = !1, g.origin === "job" && g.jobId) {
                let Te = await me.getJob(g.jobId);
                if (Mn = Te, Xe = Te?.state.last_scheduled_at ?? null, Te?.execution_cwd && (await Afe({
                        cwdRel: Te.execution_context === "workspace" ? Te.frontmatter.cwd_rel ?? null : null,
                        cwd: Te.execution_cwd,
                        runtimeWorkspaceDir: Te.runtime_workspace_dir,
                        context: Te.execution_context
                    }), await xe(Te.execution_cwd), await ut(t, E, {
                        session_key: E,
                        cwd: Te.execution_cwd,
                        plane: "work",
                        permission_profile: "work_default"
                    })), Te) {
                    _e = !!Te.frontmatter.owner_session?.startsWith("job:"), kt = MB(Te.frontmatter.cron);
                    let He = Te.frontmatter.stateless === !0;
                    if (He && Te.frontmatter.cron === "keepalive") throw new Error(bB);
                    Ee = He, g.jobStateless = Ee, hn = Te.frontmatter.model;
                    let cn = Te.frontmatter.runtime ?? void 0,
                        nn = cn ?? Xl(),
                        Wn = cn ? "explicit" : "default";
                    if (Te.frontmatter.prompt_mode !== void 0 && nn === "codex" && Z("[session-manager] job sets prompt_mode but resolves to the codex runtime; the setting is inert", {
                            sessionKey: E,
                            jobId: g.jobId,
                            promptMode: Te.frontmatter.prompt_mode,
                            runtimeSource: Wn
                        }), nn === "codex") {
                        let Jn = await c();
                        Jn.ok ? g.runtime = "codex" : (g.runtime = "claude", Z("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: E,
                            jobId: g.jobId,
                            runtime_source: Wn,
                            reason: Jn.reason
                        }))
                    } else if (nn === "grok") {
                        g.runtime = "grok";
                        let Jn = await m();
                        Jn.ok || (Xt = Jn.reason, Z("[session-manager] job requested grok but grok is unavailable", {
                            sessionKey: E,
                            jobId: g.jobId,
                            runtime_source: Wn,
                            reason: Jn.reason
                        }))
                    } else g.runtime = "claude"
                }
            } else if (g.origin === "channel") {
                let He = (await It(t, E))?.source_channel_id;
                if (He) {
                    let cn = await eo(t, He).catch(() => null),
                        nn = cn?.channel_kind,
                        Wn = nn ? await Ts(t.channelConfigDir, nn).catch(() => null) : null,
                        Ei = cn?.runtime ?? Wn?.runtime ?? void 0 ?? Xl(),
                        Hr = cn?.runtime ? "explicit" : Wn?.runtime ? "inherited" : "default";
                    if (Ei === "codex") {
                        let we = await c();
                        we.ok ? g.runtime = "codex" : (g.runtime = "claude", Z("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
                            sessionKey: E,
                            sourceChannelId: He,
                            runtime_source: Hr,
                            reason: we.reason
                        }))
                    } else if (Ei === "grok") {
                        g.runtime = "grok";
                        let we = await m();
                        we.ok || (Xt = we.reason, Z("[session-manager] channel requested grok but grok is unavailable", {
                            sessionKey: E,
                            sourceChannelId: He,
                            runtime_source: Hr,
                            reason: we.reason
                        }))
                    } else g.runtime = "claude"
                }
            }
            for (; g.status !== "ended" && j;) {
                if (g.runtime !== "codex") {
                    for (;;) {
                        let $e = g.streamingState,
                            Y = !!$e && !$e.closed && ($e.cliTurnTentative !== null || $e.currentTurn !== null);
                        if (!Y && !g.admissionInProgress) break;
                        if (g.pendingWake) {
                            g.pendingWake = !1;
                            continue
                        }
                        ht("[session-manager] drain parked: CLI busy gate", {
                            sessionKey: E,
                            actorRunId: g.actorRunId,
                            cliBusy: Y,
                            admissionInProgress: g.admissionInProgress
                        }), await Q(g, i)
                    }
                    if (!j || g.status === "ended") break
                }
                g.pendingClear && (g.sdkSessionId = void 0, g.pendingClear = !1, await ut(t, E, {
                    sdk_session_id: null,
                    pending_fork_to: null,
                    pending_undo: null
                }).catch(() => {}));
                let Te, He = null;
                g.origin === "job" && g.jobId && (Ht ? He = await me.getJob(g.jobId).catch(() => null) : (Ht = !0, He = Mn, Mn = null));
                let {
                    instructions: cn,
                    missionContent: nn
                } = await uot(t, E, g, He), Wn = await It(t, E), Jn = await runInstructionsFingerprintGuard(t, E, cn, g.runtime, {
                    instructions_fingerprint: Wn?.instructions_fingerprint,
                    mission_fingerprint: Wn?.mission_fingerprint,
                    schema_version: Wn?.schema_version,
                    sdk_session_id: Wn?.sdk_session_id,
                    board_layer_hash: Wn?.board_layer_hash,
                    instructions_nonboard_fingerprint: Wn?.instructions_nonboard_fingerprint
                }, g.origin === "job" && g.jobId ? {
                    jobId: g.jobId
                } : void 0);
                Jn.clearedSdkSessionId && (g.sdkSessionId = void 0), Jn.gate2Fired && g.runtime === "claude" && (Jn.boardOnlyDrift ? g.streamingState && !g.streamingState.closed ? K("[session-manager] board-only drift — pinning streaming prefix (no teardown)", {
                    sessionKey: E,
                    board_layer_hash: Jn.boardLayerHash
                }) : K("[session-manager] board-only drift — no live streaming prefix (nothing to pin)", {
                    sessionKey: E,
                    board_layer_hash: Jn.boardLayerHash
                }) : n.emit("session.streaming_invalidated", {
                    sessionKey: E,
                    reason: "instructions_drift"
                })), g.origin === "job" && g.jobId && (nn !== void 0 ? Te = {
                    content: nn,
                    jobId: g.jobId,
                    cron: He?.frontmatter.cron ?? "",
                    stateless: Ee,
                    model: He?.frontmatter.model ?? hn,
                    sdkConfig: Lfe(He?.frontmatter)
                } : Z("[session-manager] job snapshot unavailable at drain start", {
                    sessionKey: E,
                    jobId: g.jobId
                })), g.status = "active", g.idleSince = void 0;
                let Ei = new Set,
                    Hr = Date.now(),
                    we = new AbortController;
                g.currentAbortController = we;
                let se;
                try {
                    let $e = !_e,
                        Y = [...$e ? [Cye] : [], Mye, Kye];
                    g.origin === "channel" && (Y.push(Lye), Y.push(wd));
                    let Ot = g.origin === "job" ? "job" : g.origin === "system" ? "system" : "foreground",
                        yt = 0,
                        gn = oot();
                    if (g.admissionCallback = async () => {
                            try {
                                await Gx(t, E);
                                let ke = await zy(t, E);
                                if (ke.length === 0) return;
                                await Kx(t, E, ke);
                                let De = {},
                                    at = await batchDrainItems(t, ke, {
                                        fallbackBatchSize: 5,
                                        mergeWindowMs: 180 * 1e3,
                                        perf: De
                                    }),
                                    yn = await It(t, E),
                                    ai = Wb(t, E, yn ?? void 0),
                                    Nr = [],
                                    br = [];
                                for (let $t of at.items) {
                                    if (!$t.eventId) continue;
                                    if (g.inflightEventIds.has($t.eventId)) {
                                        br.push($t.eventId);
                                        continue
                                    }
                                    if (await Lp(t, $t.eventId)) {
                                        br.push($t.eventId);
                                        continue
                                    }
                                    let Ln = at.events.get($t.eventId) ?? await readEventByIdSeek(t, $t.eventId);
                                    Ln && Nr.push({
                                        item: $t,
                                        event: Ln,
                                        prompt: t4(Ln, E)
                                    })
                                }
                                if (Nr.length === 0) {
                                    br.length > 0 && await Ir(t, E, br);
                                    return
                                }
                                let _n = await Q2(t, E, {
                                        allowedTools: Y,
                                        tools: gn,
                                        additionalDirectories: [t.memoryDir],
                                        onExecutionEvent: $t => {
                                            $t.type === "tool_use" && (g.isStreaming = !1, g.activeToolUseIds.add($t.toolUseId), g.pendingPreempt && g.pendingPreemptBoundary === "tool_use" && (g.pendingPreempt = !1, g.pendingPreemptBoundary = null, Ye(g))), $t.type === "tool_result" && (g.activeToolUseIds.delete($t.toolUseId), g.pendingPreempt && g.pendingPreemptBoundary === "tool_result" && g.activeToolUseIds.size === 0 && (g.pendingPreempt = !1, g.pendingPreemptBoundary = null, Ye(g)));
                                            let Ri = T_e($t);
                                            Ri && n.emit("session.execution", {
                                                sessionKey: E,
                                                event: Ri
                                            })
                                        },
                                        onStream: ($t, Ri, Ln) => {
                                            g.isStreaming = !0, n.emit("session.stream", {
                                                sessionKey: E,
                                                chunk: $t,
                                                isSidechain: Ri,
                                                anchorEventId: Ln
                                            })
                                        }
                                    }, Nr, ai, {
                                        pendingGatewayNotice: yn?.pending_gateway_notice,
                                        pendingInterruptedContext: yn?.pending_interrupted_context,
                                        pendingSkipRewind: yn?.pending_skip_rewind,
                                        lastEventAtWatermark: yn?.last_event_at,
                                        timeGapConsumed: !1,
                                        daemonRestartHint: void 0
                                    }, De, $t => $t),
                                    Dr = [...br, ...Nr.map($t => $t.item.eventId).filter($t => !!$t)];
                                if (g.runtime === "codex" || g.runtime === "grok") {
                                    let $t = g.runtime === "codex" ? g.codexAdapter : g.grokAdapter,
                                        Ri = $t?.steerActiveTurn,
                                        Ln = _n.coalescedPromptText.trim(),
                                        Vr = $t?.activeTurnId?.(),
                                        Dh = $t?.activeTurnStartedAt?.(),
                                        fo = !1;
                                    if (Vr && Dh !== void 0)
                                        if ($t?.activeTurnSkipObserved?.() === !0) fo = !0;
                                        else {
                                            let Gu = await It(t, E).catch(() => null);
                                            if (Gu === null) fo = !0, Z("[session-manager] seal-on-skip: session state unreadable at admission, failing closed (steer rejected → fresh turn)", {
                                                sessionKey: E
                                            });
                                            else {
                                                let Bs = Date.parse(Gu.pending_skip_rewind?.skipped_at ?? "");
                                                fo = Number.isFinite(Bs) && Bs >= Dh
                                            }
                                        } if (!!Ri && !!Vr && !_n.isNotifyOnly && Ln.length > 0 && !fo && Ri && Vr) {
                                        let Zu = _n.batchEventIds.filter(Bs => !g.inflightEventIds.has(Bs));
                                        for (let Bs of Zu) g.inflightEventIds.add(Bs);
                                        if (await Ri(Ln, Vr, _n.attachments).catch(() => !1)) {
                                            await Ir(t, E, Dr);
                                            for (let Bs of Zu) g.inflightEventIds.delete(Bs);
                                            K("[session-manager] admission callback: codex turn/steer landed", {
                                                sessionKey: E,
                                                admittedItems: Nr.length,
                                                batchEventIds: _n.batchEventIds
                                            })
                                        } else {
                                            for (let Bs of Zu) g.inflightEventIds.delete(Bs);
                                            g.pendingWake = !0, K("[session-manager] admission callback: codex steer fell back to redrain", {
                                                sessionKey: E,
                                                batchEventIds: _n.batchEventIds
                                            })
                                        }
                                    } else g.pendingWake = !0, K("[session-manager] admission callback: codex no live turn, redraining", {
                                        sessionKey: E,
                                        admittedItems: Nr.length,
                                        batchEventIds: _n.batchEventIds
                                    });
                                    return
                                }
                                let ir = g.streamingState;
                                if (!ir || ir.closed) return;
                                let Bi = ir.currentTurn,
                                    fbe = !!_n.attachments && _n.attachments.length > 0,
                                    TC = _n.coalescedPromptText.trim();
                                if (!!Bi && Bi.accepted && !Bi.skipCalled && !fbe && !_n.isNotifyOnly && TC.length > 0) {
                                    let $t = g.pendingSteer;
                                    if ($t && !$t.settled && $t.spawningTurn === Bi) {
                                        let Ri = _n.batchEventIds.filter(Ln => !g.inflightEventIds.has(Ln));
                                        for (let Ln of Ri) g.inflightEventIds.add(Ln);
                                        $t.steerText = `${$t.steerText}
${TC}`, $t.eventIds.push(...Dr), $t.claimedEventIds.push(...Ri), $t.requeueLines.push(...Nr.map(Ln => Ln.item.line)), $t.requeueEventIds.push(...Nr.map(Ln => Ln.item.eventId)), $t.processedEventIds.push(...br), K("[session-manager] admission callback: appended claude steer", {
                                            sessionKey: E,
                                            admittedItems: Nr.length,
                                            batchEventIds: _n.batchEventIds
                                        });
                                        return
                                    }
                                    if (!$t) {
                                        let Ri = _n.batchEventIds.filter(Vr => !g.inflightEventIds.has(Vr));
                                        for (let Vr of Ri) g.inflightEventIds.add(Vr);
                                        let Ln = {
                                            steerText: TC,
                                            eventIds: [...Dr],
                                            claimedEventIds: [...Ri],
                                            enqueueAsNewTurn: async () => {
                                                let Vr = [];
                                                for (let fo = 0; fo < Ln.requeueLines.length; fo += 1) {
                                                    let GB = Ln.requeueLines[fo],
                                                        Zu = Ln.requeueEventIds[fo];
                                                    try {
                                                        await ua(t, E, GB), Vr.push(Zu)
                                                    } catch (Gu) {
                                                        Z("[session-manager] steer fallback requeue failed", {
                                                            sessionKey: E,
                                                            eventId: Zu,
                                                            error: Gu instanceof Error ? Gu.message : String(Gu)
                                                        })
                                                    }
                                                }
                                                let Dh = [...Vr, ...Ln.processedEventIds];
                                                if (Dh.length > 0) try {
                                                    await Ir(t, E, Dh)
                                                } catch (fo) {
                                                    K("[session-manager] steer fallback markDone error", {
                                                        sessionKey: E,
                                                        error: String(fo)
                                                    })
                                                }
                                                for (let fo of Ln.claimedEventIds) g.inflightEventIds.delete(fo);
                                                g.pendingWake = !0, K("[session-manager] steer fallback requeued to inbox (turn ended undelivered)", {
                                                    sessionKey: E,
                                                    eventIds: Ln.eventIds,
                                                    requeued: Vr.length,
                                                    requeueFailed: Ln.requeueLines.length - Vr.length
                                                })
                                            },
                                            spawningTurn: Bi,
                                            requeueLines: Nr.map(Vr => Vr.item.line),
                                            requeueEventIds: Nr.map(Vr => Vr.item.eventId),
                                            processedEventIds: [...br],
                                            settled: !1
                                        };
                                        g.pendingSteer = Ln, K("[session-manager] admission callback: parked claude steer", {
                                            sessionKey: E,
                                            admittedItems: Nr.length,
                                            batchEventIds: _n.batchEventIds
                                        });
                                        return
                                    }
                                }
                                g.pendingWake = !0, g.wakeResolver?.()
                            } catch (ke) {
                                K("[session-manager] admission callback error", {
                                    sessionKey: E,
                                    error: String(ke)
                                })
                            }
                        }, g.runtime === "codex" && !g.codexAdapter) {
                        let ke = (await It(t, E))?.cwd;
                        ke && await ensureAgentsMdSymlink(ke).catch(() => {}), g.codexAdapter = l({
                            sandbox: resolveCodexSandbox(),
                            ephemeral: !1,
                            model: hn,
                            dynamicTools: fC({
                                paths: t,
                                sessionKey: E,
                                bus: n,
                                sessionContextKind: Ot,
                                notifyDepth: yt,
                                jobScheduleType: kt,
                                canManageJobs: $e,
                                getSessionStatus: De => x.get(De)?.status,
                                onNotifyCalled: () => {
                                    g.notifyCalledDuringDrain = !0
                                }
                            })
                        })
                    }
                    if (g.runtime === "grok" && !g.grokAdapter && !Xt) {
                        let ke = await It(t, E).catch(() => null);
                        g.grokAdapter = p({
                            cwd: ke?.cwd ?? t.workDir,
                            sdkSessionId: ke?.sdk_session_id,
                            mcpServerFactory: () => Ah(t, {
                                sessionKey: E,
                                bus: n,
                                sessionContextKind: Ot,
                                notifyDepth: yt,
                                jobScheduleType: kt,
                                canManageJobs: $e,
                                getSessionStatus: De => x.get(De)?.status,
                                onNotifyCalled: () => {
                                    g.notifyCalledDuringDrain = !0
                                }
                            }),
                            onDetachedTurn: ({
                                text: De
                            }) => k(E, De)
                        })
                    }
                    let ce = Re(g);
                    se = await drainSessionMailbox(t, E, {
                        sdk: ce,
                        usesStreamingAdapter: ce === g.streamingAdapter,
                        bus: n,
                        abortController: we,
                        runtime: g.runtime,
                        runtimeUnavailableReason: Xt,
                        excludeEventIds: Se(g),
                        actorSpawnedAt: g.spawnedAt,
                        actorLastTurnCompletedAt: g.lastTurnCompletedAt,
                        getStreamGeneration: () => g.streamingGeneration,
                        holdInputOpenForBackgroundAgents: g.runtime === "claude" && g.origin !== "channel",
                        jobContext: Te,
                        memoryBoard: cn.memoryBoard ? {
                            path: t.memoryBroadcastPath,
                            content: cn.memoryBoard
                        } : void 0,
                        boardHash: cn.memoryBoard ? Jn.boardLayerHash : void 0,
                        onBatchContext: ke => {
                            if (yt = ke.maxNotifyDepth, ke.eventIds)
                                for (let De of ke.eventIds) g.inflightEventIds.add(De)
                        },
                        mcpServersFactory: () => ({
                            aladuo: Ah(t, {
                                sessionKey: E,
                                bus: n,
                                sessionContextKind: Ot,
                                notifyDepth: yt,
                                jobScheduleType: kt,
                                canManageJobs: $e,
                                getSessionStatus: ke => x.get(ke)?.status,
                                onNotifyCalled: () => {
                                    g.notifyCalledDuringDrain = !0
                                }
                            })
                        }),
                        allowedTools: Y,
                        tools: gn,
                        additionalDirectories: [t.memoryDir],
                        lockHeartbeatIntervalMs: o,
                        onSdkTurnStarted: () => {
                            U += 1;
                            let ke = !ne;
                            if (ne = U > D, ke && ne && g.origin === "job" && g.jobId) {
                                let De = g.jobId;
                                Oe.push(me.updateState(De, {
                                    last_run_started_at: new Date().toISOString()
                                }, {
                                    expectedClaimCursor: Xe
                                }).catch(at => {
                                    Z("[session-manager] last_run_started_at stamp failed (best-effort)", {
                                        sessionKey: E,
                                        jobId: De,
                                        error: at instanceof Error ? at.message : String(at)
                                    })
                                }))
                            }
                        },
                        onSdkTurnRejected: () => {
                            D += 1;
                            let ke = ne && U <= D;
                            if (ne = U > D, ke && g.origin === "job" && g.jobId) {
                                let De = g.jobId;
                                Oe.push(me.updateState(De, {
                                    last_run_started_at: null
                                }, {
                                    expectedClaimCursor: Xe
                                }).catch(at => {
                                    Z("[session-manager] last_run_started_at rollback failed (best-effort)", {
                                        sessionKey: E,
                                        jobId: De,
                                        error: at instanceof Error ? at.message : String(at)
                                    })
                                }))
                            }
                        },
                        onStream: (ke, De, at) => {
                            g.isStreaming = !0, n.emit("session.stream", {
                                sessionKey: E,
                                chunk: ke,
                                isSidechain: De,
                                anchorEventId: at
                            })
                        },
                        onExecutionEvent: ke => {
                            ke.type === "tool_use" && (g.isStreaming = !1, g.activeToolUseIds.add(ke.toolUseId), g.pendingPreempt && g.pendingPreemptBoundary === "tool_use" && (g.pendingPreempt = !1, g.pendingPreemptBoundary = null, Ye(g))), ke.type === "tool_result" && (g.activeToolUseIds.delete(ke.toolUseId), g.pendingPreempt && g.pendingPreemptBoundary === "tool_result" && g.activeToolUseIds.size === 0 && (g.pendingPreempt = !1, g.pendingPreemptBoundary = null, Ye(g)));
                            let De = rot(ke);
                            if (De && Ei.has(De)) return;
                            De && Ei.add(De);
                            let at = T_e(ke);
                            at && n.emit("session.execution", {
                                sessionKey: E,
                                event: at
                            })
                        }
                    })
                } finally {
                    g.admissionCallback = null, g.admissionInProgress || g.inflightEventIds.clear(), g.currentAbortController === we && (g.currentAbortController = null), g.isStreaming = !1, g.activeToolUseIds.clear(), g.pendingPreempt = !1, g.pendingPreemptBoundary = null
                }
                if (ht("[session-manager] drain result", {
                        sessionKey: E,
                        actorRunId: g.actorRunId,
                        processed: se.processed,
                        skipped: se.skipped,
                        lockAcquired: se.lockAcquired,
                        outboxRecords: se.outboxRecords?.length ?? (se.lastOutboxRecord ? 1 : 0),
                        durationMs: Date.now() - Hr
                    }), bt += se.processed, ye = se.mergeTransientFailure === !0, se.cancelled && (Ft = !0), se.processed > 0 && (g.lastTurnCompletedAt = Date.now(), await Es(t, E, "last_error").catch(() => {})), se.compacted && g.runtime === "claude" && g.streamingState && !g.streamingState.closed) {
                    let $e = cn.memoryBoard ? Jn.boardLayerHash : void 0;
                    g.spawnBoardHash !== $e && (g.streamingState.needsRecreation = !0, Ct("warn", "[kv-cache] needsRecreation flagged", {
                        sessionKey: E,
                        reason: "board-refresh(B4)",
                        generation: g.streamingGeneration,
                        spawn_board_hash: g.spawnBoardHash ? g.spawnBoardHash.slice(0, 12) : null,
                        current_board_hash: $e ? $e.slice(0, 12) : null
                    }))
                }
                if (g.pendingClear) g.sdkSessionId = void 0, g.pendingClear = !1, await ut(t, E, {
                    sdk_session_id: null,
                    pending_fork_to: null,
                    pending_undo: null
                }).catch(() => {}), K("[session-manager] applied pending clear after drain", {
                    sessionKey: E,
                    actorRunId: g.actorRunId
                });
                else {
                    let $e = await It(t, E);
                    if ($e?.sdk_session_id) {
                        let Y = !g.sdkSessionId,
                            Ot = g.sdkSessionId !== $e.sdk_session_id;
                        g.sdkSessionId = $e.sdk_session_id, (Y || Ot) && K("[session-manager] sdk session bound", {
                            sessionKey: E,
                            actorRunId: g.actorRunId,
                            sdkSessionId: g.sdkSessionId,
                            isNewSession: Y
                        })
                    }
                }
                if (se.lastReplyText && (N = se.lastReplyText), se.outboxRecords && se.outboxRecords.length > 0) {
                    ht("[session-manager] emitting outbox records", {
                        sessionKey: E,
                        actorRunId: g.actorRunId,
                        count: se.outboxRecords.length
                    });
                    for (let $e of se.outboxRecords) n.emit("session.output", {
                        sessionKey: $e.session_key,
                        record: $e
                    })
                } else se.lastOutboxRecord ? (ht("[session-manager] emitting single outbox record", {
                    sessionKey: E,
                    actorRunId: g.actorRunId,
                    recordId: se.lastOutboxRecord.id
                }), n.emit("session.output", {
                    sessionKey: E,
                    record: se.lastOutboxRecord
                })) : g.origin === "channel" && se.processed > 0 && !se.cancelled && (ht("[session-manager] drain produced no output, emitting stream_end", {
                    sessionKey: E,
                    actorRunId: g.actorRunId,
                    turnSkipped: se.turnSkipped === !0
                }), n.emit("session.stream_end", {
                    sessionKey: g.sessionKey,
                    reason: se.turnSkipped ? "skipped" : "interrupted"
                }));
                if (se.processed === 0) {
                    if (g.origin === "job" || g.origin === "system") {
                        ht("[session-manager] job/system session drain complete, exiting", {
                            sessionKey: E,
                            actorRunId: g.actorRunId,
                            origin: g.origin,
                            jobId: g.jobId
                        });
                        break
                    }
                    if (g.pendingWake) {
                        g.pendingWake = !1, ht("[session-manager] pending wake after empty drain, re-draining", {
                            sessionKey: E,
                            actorRunId: g.actorRunId
                        });
                        continue
                    }
                    if (g.status = "idle", g.idleSince = new Date().toISOString(), g.pendingWake) {
                        g.pendingWake = !1, ht("[session-manager] pending wake during idle transition, re-draining", {
                            sessionKey: E,
                            actorRunId: g.actorRunId
                        });
                        continue
                    }
                    if (ht("[session-manager] idle", {
                            sessionKey: E,
                            actorRunId: g.actorRunId,
                            attachedChannels: g.attachedChannels.size
                        }), g.holdsPoolSlot) {
                        let Y = C(E, g.origin);
                        Y.activeCount--, g.holdsPoolSlot = !1, ht("[session-manager] released pool slot (idle)", {
                            sessionKey: E,
                            pool: Y.name,
                            activeCount: Y.activeCount
                        }), A(Y)
                    }
                    let $e = !1;
                    for (; g.status === "idle";) {
                        if (g.pendingWake) {
                            g.pendingWake = !1, $e = !0;
                            break
                        }
                        if (await Q(g, i) || g.status !== "idle") {
                            $e = !0;
                            break
                        }
                        if (g.attachedChannels.size > 0) {
                            if (ht("[session-manager] idle timeout with attachments, reclaiming runtime processes", {
                                    sessionKey: E,
                                    actorRunId: g.actorRunId,
                                    attachedChannels: g.attachedChannels.size
                                }), g.streamingState && !g.streamingState.closed && Ct("warn", "[kv-cache] streaming teardown: idle-timeout", {
                                    sessionKey: E,
                                    generation: g.streamingGeneration,
                                    sdk_session_id: g.sdkSessionId ?? null
                                }), await Fe(g), g.codexAdapter) {
                                let Ot = g.codexAdapter;
                                g.codexAdapter = null, Promise.resolve(Ot.shutdown()).catch(yt => {
                                    Z("[session-manager] codex adapter shutdown failed", {
                                        sessionKey: E,
                                        error: yt instanceof Error ? yt.message : String(yt)
                                    })
                                })
                            }
                            if (g.grokAdapter) {
                                let Ot = g.grokAdapter;
                                g.grokAdapter = null, Promise.resolve(Ot.shutdown()).catch(yt => {
                                    Z("[session-manager] grok adapter shutdown failed", {
                                        sessionKey: E,
                                        error: yt instanceof Error ? yt.message : String(yt)
                                    })
                                })
                            }
                            continue
                        }
                        break
                    }
                    if (!$e && g.status === "idle") {
                        ht("[session-manager] idle timeout, no attachments, exiting", {
                            sessionKey: E,
                            actorRunId: g.actorRunId
                        }), g.streamingState && !g.streamingState.closed && Ct("warn", "[kv-cache] streaming teardown: idle-timeout", {
                            sessionKey: E,
                            generation: g.streamingGeneration,
                            sdk_session_id: g.sdkSessionId ?? null
                        });
                        break
                    }
                    if ($e && !g.holdsPoolSlot) {
                        let Y = C(E, g.origin);
                        if (Y.activeCount >= Y.maxConcurrent) {
                            Y.wakeQueue.includes(E) || Y.wakeQueue.unshift(E), ht("[session-manager] woken idle actor re-queued (pool full)", {
                                sessionKey: E,
                                pool: Y.name,
                                activeCount: Y.activeCount
                            }), g.pendingWake = !1;
                            continue
                        }
                        Y.activeCount++, g.holdsPoolSlot = !0, ht("[session-manager] re-acquired pool slot (woken)", {
                            sessionKey: E,
                            pool: Y.name,
                            activeCount: Y.activeCount
                        })
                    }
                }
            }
        } catch (_e) {
            et(`[session-manager] error in drain loop for ${E}:`, _e), z = _e, await ut(t, E, {
                last_error: {
                    message: _e instanceof Error ? _e.message : String(_e),
                    at: new Date().toISOString()
                }
            }).catch(() => {})
        } finally {
            if (await Fe(g), g.currentAbortController = null, g.streamingAdapter = null, g.isStreaming = !1, g.activeToolUseIds.clear(), g.pendingPreempt = !1, g.pendingPreemptBoundary = null, g.codexAdapter) {
                let Ee = g.codexAdapter;
                g.codexAdapter = null, await Promise.resolve(Ee.shutdown()).catch(hn => {
                    Z("[session-manager] codex adapter shutdown failed", {
                        sessionKey: E,
                        error: hn instanceof Error ? hn.message : String(hn)
                    })
                })
            }
            if (g.grokAdapter) {
                let Ee = g.grokAdapter;
                g.grokAdapter = null, await Promise.resolve(Ee.shutdown()).catch(hn => {
                    Z("[session-manager] grok adapter shutdown failed", {
                        sessionKey: E,
                        error: hn instanceof Error ? hn.message : String(hn)
                    })
                })
            }
            let _e = C(E, g.origin);
            if (g.holdsPoolSlot && (_e.activeCount--, g.holdsPoolSlot = !1), g.origin === "job" && g.jobId) {
                Oe.length > 0 && await Promise.allSettled(Oe);
                try {
                    await Yt(g, {
                        runStarted: ne,
                        cancelled: Ft,
                        processedCount: bt,
                        claimCursor: Xe,
                        error: z,
                        resultText: N
                    })
                } finally {
                    g.status = "ended"
                }
            } else g.status = "ended";
            if (g.pendingWake = !1, j && P_e(Fr(t, E)) && !hr(E)) {
                let Ee = await ve(E, mt);
                Ee === "fresh" ? (g.consecutiveConservativeRedrive = !1, ht("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
                    sessionKey: E,
                    actorRunId: g.actorRunId
                }), We(E, {
                    preempt: "never"
                })) : Ee === "conservative" || ye ? g.consecutiveConservativeRedrive ? Z("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
                    sessionKey: E,
                    actorRunId: g.actorRunId
                }) : (g.consecutiveConservativeRedrive = !0, ht("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
                    sessionKey: E,
                    actorRunId: g.actorRunId
                }), We(E, {
                    preempt: "never"
                })) : g.consecutiveConservativeRedrive = !1
            }
            K("[session-manager] actor end", {
                sessionKey: E,
                actorRunId: g.actorRunId,
                sdkSessionId: g.sdkSessionId,
                pool: _e.name,
                activeCount: _e.activeCount,
                origin: g.origin,
                jobId: g.jobId,
                attachedChannels: g.attachedChannels.size,
                queuedSessions: _e.wakeQueue.length
            }), A(_e)
        }
    }

    function Q(g, E) {
        return new Promise(z => {
            let N = null,
                U = () => {
                    N && (clearTimeout(N), N = null), g.wakeResolver = null
                };
            g.wakeResolver = () => {
                U(), z(!0)
            }, N = setTimeout(() => {
                U(), z(!1)
            }, E)
        })
    }
    async function fe(g) {
        return new Set(await My(Ny(t, g)))
    }
    async function ve(g, E) {
        let z;
        try {
            z = await fe(g)
        } catch (N) {
            return Z("[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)", {
                sessionKey: g,
                error: N instanceof Error ? N.message : String(N)
            }), "conservative"
        }
        for (let N of z)
            if (!E.has(N)) return "fresh";
        return "none"
    }
    let me = new xo(t);

    function Bt(g) {
        return g.error ? g.runStarted ? "STARTED_FAILURE" : "NEVER_STARTED_FAILURE" : g.cancelled ? g.runStarted ? "CANCELLED_POST_ACK" : "CANCELLED_PRE_ACK" : !g.runStarted && g.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"
    }
    async function tt(g, E, z, N, U, D) {
        try {
            let ne = await me.finalizeJobState(g, z, {
                consumeRunAt: N,
                expectedClaimCursor: U
            });
            return ne === Jq ? (K(`[session-manager] job gone at finalize (${D}) — state frozen`, {
                jobId: g,
                sessionKey: E
            }), {
                kind: "gone"
            }) : ne === Zq ? (Z(`[session-manager] stale finalize (${D}) — a fresh claim owns the sidecar; nothing written`, {
                jobId: g,
                sessionKey: E,
                claimCursor: U
            }), {
                kind: "stale"
            }) : {
                kind: "written",
                runAt: ne.run_at
            }
        } catch (ne) {
            return et(`[session-manager] job state finalize failed (${D})`, ne), {
                kind: "failed"
            }
        }
    }
    async function Yt(g, E) {
        let z = g.jobId,
            {
                sessionKey: N
            } = g,
            {
                runStarted: U,
                cancelled: D,
                processedCount: ne,
                claimCursor: Oe,
                error: bt,
                resultText: ye
            } = E,
            Ft = Bt({
                error: bt,
                cancelled: D,
                runStarted: U,
                processedCount: ne
            });
        try {
            await me.init();
            let Xe = await me.getJob(z),
                mt = Xe?.frontmatter.cron ?? "";
            switch (Ft) {
                case "NEVER_STARTED_FAILURE": {
                    let _e = bt instanceof Error ? bt.message : String(bt);
                    await tt(z, N, {
                        last_result: "failure",
                        last_error: _e
                    }, !1, Oe, "never-started failure"), await St({
                        jobId: z,
                        sessionKey: N,
                        job: Xe,
                        cron: mt,
                        errorMsg: _e
                    }), K("[session-manager] job failed (never started, spawn-class) — job preserved", {
                        jobId: z,
                        sessionKey: N,
                        cron: mt,
                        error: _e
                    });
                    break
                }
                case "STARTED_FAILURE": {
                    let _e = bt instanceof Error ? bt.message : String(bt),
                        kt = await tt(z, N, {
                            last_result: "failure",
                            last_error: _e
                        }, !0, Oe, "started failure");
                    await St({
                        jobId: z,
                        sessionKey: N,
                        job: Xe,
                        cron: mt,
                        errorMsg: _e
                    }), await Qn({
                        jobId: z,
                        sessionKey: N,
                        cron: mt,
                        state: kt
                    }), K("[session-manager] job failed", {
                        jobId: z,
                        sessionKey: N,
                        error: _e
                    });
                    break
                }
                case "CANCELLED_POST_ACK": {
                    let _e = await tt(z, N, {
                        last_result: "failure",
                        last_error: "cancelled"
                    }, !0, Oe, "cancelled post-ack");
                    await Qn({
                        jobId: z,
                        sessionKey: N,
                        cron: mt,
                        state: _e
                    }), Z("[session-manager] job run cancelled after turn ack — consumed + failure marker, no delivery", {
                        jobId: z,
                        sessionKey: N
                    });
                    break
                }
                case "ZERO_FED": {
                    await tt(z, N, {
                        last_result: "failure",
                        last_error: "zero-fed run — no items merged"
                    }, !1, Oe, "zero-fed"), Z("[session-manager] zero-fed job run — failure marker written, job preserved", {
                        jobId: z,
                        sessionKey: N
                    });
                    break
                }
                case "CANCELLED_PRE_ACK": {
                    Z("[session-manager] job run ended without turn ack (cancelled before start) — finalize skipped, job preserved", {
                        jobId: z,
                        sessionKey: N,
                        processedCount: ne
                    });
                    break
                }
                case "STARTED_SUCCESS": {
                    let _e = await tt(z, N, {
                            last_result: "success",
                            last_run_at: new Date().toISOString(),
                            last_error: void 0
                        }, !0, Oe, "success"),
                        kt = createSpineEvent({
                            type: "job.complete",
                            source: {
                                kind: "job",
                                name: z
                            },
                            session_key: N,
                            payload: {
                                job_id: z,
                                result_summary: ye?.slice(0, 200)
                            }
                        });
                    await atomicAppendEvent(t, kt);
                    let Ee = ye?.slice(0, 200);
                    n.emit("job.completed", {
                        jobId: z,
                        sessionKey: N,
                        resultSummary: Ee
                    }), g.notifyCalledDuringDrain ? Ae("[session-manager] skipping system job.complete delivery: agent called Notify", {
                        jobId: z,
                        sessionKey: N
                    }) : await Ze(Xe, N, "job.complete", {
                        job_id: z,
                        result_summary: Ee,
                        result_text: ye?.slice(0, 2e3),
                        agent_notified: !1,
                        schedule_type: MB(mt),
                        owner_session: Xe?.frontmatter.owner_session
                    }), await Qn({
                        jobId: z,
                        sessionKey: N,
                        cron: mt,
                        state: _e
                    }), K("[session-manager] job completed", {
                        jobId: z,
                        sessionKey: N
                    });
                    break
                }
            }
        } catch (Xe) {
            et("[session-manager] error finalizing job session", Xe)
        }
    }
    async function St(g) {
        let {
            jobId: E,
            sessionKey: z,
            job: N,
            cron: U,
            errorMsg: D
        } = g, ne = createSpineEvent({
            type: "job.fail",
            source: {
                kind: "job",
                name: E
            },
            session_key: z,
            payload: {
                job_id: E,
                error: D
            }
        });
        await atomicAppendEvent(t, ne), n.emit("job.failed", {
            jobId: E,
            sessionKey: z,
            error: D
        }), await Ze(N, z, "job.fail", {
            job_id: E,
            error: D,
            agent_notified: !1,
            schedule_type: MB(U),
            owner_session: N?.frontmatter.owner_session
        })
    }
    async function Qn(g) {
        let {
            jobId: E,
            sessionKey: z,
            cron: N,
            state: U
        } = g;
        if (iot(N)) {
            switch (U.kind) {
                case "gone":
                    K("[session-manager] skip auto-archive: job already gone (archived mid-run)", {
                        jobId: E,
                        cron: N
                    });
                    return;
                case "stale":
                    K("[session-manager] skip auto-archive: stale finalize (a fresh claim owns the job)", {
                        jobId: E,
                        cron: N
                    });
                    return;
                case "failed":
                    Z("[session-manager] skip auto-archive: job state unreadable at finalize (failing toward stale-active)", {
                        jobId: E,
                        cron: N
                    });
                    return;
                case "written":
                    if (U.runAt !== null) {
                        K("[session-manager] skip auto-archive: job re-armed via reschedule", {
                            jobId: E,
                            cron: N,
                            runAt: U.runAt
                        });
                        return
                    }
                    break;
                default:
                    return U
            }
            try {
                let D = await me.archiveJobIfNotRearmed(E);
                if (!D.archived) {
                    K("[session-manager] skip auto-archive: job re-armed during finalize", {
                        jobId: E,
                        cron: N,
                        runAt: D.runAt
                    });
                    return
                }
                if ((await Ace(t, z)).reason === "archive_in_flight") {
                    Z("[session-manager] skip finalize session archive: archive already in flight", {
                        jobId: E,
                        sessionKey: z
                    });
                    return
                }
                K("[session-manager] auto-archived one-shot job", {
                    jobId: E,
                    cron: N
                })
            } catch (D) {
                et("[session-manager] failed to auto-archive one-shot job", D)
            }
        }
    }
    async function Ze(g, E, z, N) {
        if (!g) return;
        let U = ll(g.frontmatter.notify);
        if (U.length !== 0)
            for (let D = 0; D < U.length; D++) {
                let ne = qm(U[D]);
                if (!ne) {
                    Z("[session-manager] invalid notify target in job, skipping delivery", {
                        jobId: g.id,
                        notify: U[D]
                    });
                    continue
                }
                try {
                    await Td(t, n, {
                        traceId: `job-finalize_${g.id}_${D}`,
                        routeId: `job-result-${D}`,
                        sourceName: `job:${g.id}`,
                        sourceSessionKey: E,
                        targetSessionKey: ne,
                        eventType: z,
                        payload: N
                    }), Ae("[session-manager] job result delivered to notify target", {
                        jobId: g.id,
                        targetSessionKey: ne,
                        eventType: z
                    })
                } catch (Oe) {
                    Z("[session-manager] failed to deliver job result to notify target", {
                        jobId: g.id,
                        targetSessionKey: ne,
                        eventType: z,
                        error: String(Oe)
                    })
                }
            }
    }

    function it(g, E) {
        if (!j) return;
        if (hr(E)) {
            ht("[session-manager] skip job spawn, session is being archived", {
                jobId: g,
                sessionKey: E
            });
            return
        }
        let z = x.get(E);
        if (z && z.status !== "ended") {
            ht("[session-manager] skip duplicate job spawn", {
                jobId: g,
                sessionKey: E,
                actorStatus: z.status
            });
            return
        }
        if (w.activeCount >= w.maxConcurrent) {
            w.wakeQueue.includes(E) || w.wakeQueue.push(E), z ? (z.origin = "job", z.jobId = g) : x.set(E, {
                sessionKey: E,
                actorRunId: 0,
                sdkSessionId: void 0,
                sdkSessionIdVerified: !1,
                status: "idle",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: null,
                streamingGeneration: 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                isStreaming: !1,
                activeToolUseIds: new Set,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: new Set,
                origin: "job",
                jobId: g,
                jobStateless: !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                idleSince: void 0,
                notifyCalledDuringDrain: !1,
                runtime: "claude",
                codexAdapter: null,
                consecutiveConservativeRedrive: !1
            });
            return
        }
        Be(E, {
            origin: "job",
            jobId: g
        }), (async () => {
            try {
                let N = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: g
                    },
                    session_key: E,
                    payload: {
                        job_id: g
                    }
                });
                await atomicAppendEvent(t, N), n.emit("job.spawned", {
                    jobId: g,
                    sessionKey: E
                })
            } catch (N) {
                et("[session-manager] error recording job spawn", N)
            }
        })()
    }
    async function sn(g, E) {
        let N = (M.get(g) ?? Promise.resolve()).catch(() => {}).then(async () => {
            if (g.startsWith("job:") || g.startsWith("meta:") || g.startsWith("system:") || g.startsWith("cadence:")) return;
            let U = DB(g),
                D = new Date().toISOString(),
                ne = createSpineEvent({
                    type: "channel.attached",
                    source: {
                        kind: U,
                        name: "session-manager"
                    },
                    session_key: g,
                    payload: {
                        session_key: g,
                        channel_kind: U,
                        channel_id: E,
                        attached_at: D
                    }
                });
            await atomicAppendEvent(t, ne)
        }).finally(() => {
            M.get(g) === N && M.delete(g)
        });
        M.set(g, N), await N
    }

    function qi() {
        for (let g of x.values()) {
            if (g.status = "ended", g.codexAdapter) {
                let E = g.codexAdapter;
                g.codexAdapter = null, Promise.resolve(E.shutdown()).catch(z => {
                    Z("[session-manager] codex adapter shutdown failed", {
                        sessionKey: g.sessionKey,
                        error: z instanceof Error ? z.message : String(z)
                    })
                })
            }
            if (g.grokAdapter) {
                let E = g.grokAdapter;
                g.grokAdapter = null, Promise.resolve(E.shutdown()).catch(z => {
                    Z("[session-manager] grok adapter shutdown failed", {
                        sessionKey: g.sessionKey,
                        error: z instanceof Error ? z.message : String(z)
                    })
                })
            }
            g.streamAbortController && !g.streamAbortController.signal.aborted && g.streamAbortController.abort(), typeof g.query?.close == "function" && g.query.close(), g.query = null, g.streamAbortController = null, g.currentAbortController && !g.currentAbortController.signal.aborted && g.currentAbortController.abort(), g.currentAbortController = null, g.wakeResolver && (g.wakeResolver(), g.wakeResolver = null)
        }
    }
    async function xi() {
        if (M.size === 0) return;
        let g = Array.from(M.values()),
            E = new Promise(z => setTimeout(z, 3e4));
        await Promise.race([Promise.allSettled(g).then(() => {}), E])
    }
    return {
        async start() {
            if (!j) {
                j = !0, n.on("session.wake", J), n.on("shutdown", ee), n.on("session.streaming_invalidated", ie);
                try {
                    let g = await rehydrateSessionState(t);
                    for (let E of g) {
                        if (hr(E)) {
                            ht("[session-manager] skip hydrating session being archived", {
                                sessionKey: E
                            });
                            continue
                        }
                        let N = (await It(t, E))?.cwd;
                        if (N && !dot(N)) {
                            Z("[session-manager] skip hydrating session with unavailable workspace", {
                                sessionKey: E,
                                cwd: N
                            });
                            continue
                        }
                        if (hr(E)) {
                            ht("[session-manager] skip hydrating session being archived", {
                                sessionKey: E
                            });
                            continue
                        }
                        let U = jB(E),
                            D = C(E);
                        D.activeCount < D.maxConcurrent ? Be(E, U ?? void 0) : D.wakeQueue.push(E)
                    }
                } catch (g) {
                    et("[session-manager] error hydrating sessions:", g)
                }
                K("[session-manager] started", {
                    channelActive: S.activeCount,
                    channelQueued: S.wakeQueue.length,
                    jobActive: w.activeCount,
                    jobQueued: w.wakeQueue.length
                })
            }
        },
        async stop() {
            if (!j) return;
            j = !1, n.off("session.wake", J), n.off("shutdown", ee), n.off("session.streaming_invalidated", ie), qi();
            let g = Array.from(x.values()).map(E => E.drainPromise).filter(E => E !== null);
            if (g.length > 0) {
                let E = new Promise(z => setTimeout(z, 3e4));
                await Promise.race([Promise.all(g), E])
            }
            await xi(), x.clear(), S.wakeQueue.length = 0, S.activeCount = 0, w.wakeQueue.length = 0, w.activeCount = 0, K("[session-manager] stopped")
        },
        wakeSession: We,
        getActor(g) {
            return x.get(g)
        },
        activeCount() {
            return S.activeCount + w.activeCount
        },
        activeChannelCount() {
            return S.activeCount
        },
        activeJobCount() {
            return w.activeCount
        },
        isRunning() {
            return j
        },
        attachChannel(g, E) {
            let z = x.get(g);
            z || (z = {
                sessionKey: g,
                actorRunId: 0,
                sdkSessionId: void 0,
                sdkSessionIdVerified: !1,
                status: "idle",
                currentAbortController: null,
                query: null,
                streamAbortController: null,
                streamingState: null,
                streamingAdapter: null,
                streamingGeneration: 0,
                drainPromise: null,
                wakeResolver: null,
                pendingWake: !1,
                isStreaming: !1,
                activeToolUseIds: new Set,
                pendingPreempt: !1,
                pendingPreemptBoundary: null,
                pendingClear: !1,
                attachedChannels: new Set,
                origin: "channel",
                jobStateless: !1,
                holdsPoolSlot: !1,
                inflightEventIds: new Set,
                admissionInProgress: !1,
                pendingSteer: null,
                idleSince: void 0,
                notifyCalledDuringDrain: !1,
                runtime: "claude",
                codexAdapter: null,
                consecutiveConservativeRedrive: !1
            }, x.set(g, z)), z.attachedChannels.add(E), ht("[session-manager] channel attached", {
                sessionKey: g,
                channelId: E,
                totalAttachments: z.attachedChannels.size
            }), sn(g, E).catch(N => {
                Z("[session-manager] failed to emit channel.attached event", {
                    sessionKey: g,
                    channelId: E,
                    error: String(N)
                })
            })
        },
        detachChannel(g, E) {
            let z = x.get(g);
            z && (z.attachedChannels.delete(E), ht("[session-manager] channel detached", {
                sessionKey: g,
                channelId: E,
                remainingAttachments: z.attachedChannels.size
            }), z.attachedChannels.size === 0 && z.status === "idle" && z.wakeResolver && (z.wakeResolver(), z.wakeResolver = null))
        },
        hasAttachedChannels(g) {
            let E = x.get(g);
            return E ? E.attachedChannels.size > 0 : !1
        },
        spawnJobSession(g, E) {
            it(g, E)
        },
        async interruptSession(g) {
            if (!j) return {
                interrupted: !1,
                reason: "not_running"
            };
            let E = x.get(g);
            return E ? !E.query && (!E.currentAbortController || E.currentAbortController.signal.aborted) ? {
                interrupted: !1,
                reason: "idle"
            } : E.streamAbortController && !E.streamAbortController.signal.aborted ? (K("[session-manager] interrupt: stopping streaming session", {
                sessionKey: g,
                actorRunId: E.actorRunId
            }), await Fe(E, "cancel-interrupt"), {
                interrupted: !0,
                reason: "interrupted"
            }) : (je(E, "immediate") === "immediate" && K("[session-manager] interrupt requested", {
                sessionKey: g,
                actorRunId: E.actorRunId
            }), {
                interrupted: !0,
                reason: "interrupted"
            }) : {
                interrupted: !1,
                reason: "not_found"
            }
        },
        async clearSdkSession(g) {
            if (!j) return {
                cleared: !1,
                reason: "not_running"
            };
            let E = x.get(g),
                z = E?.sdkSessionId;
            return E && (E.pendingClear = !0, E.sdkSessionId = void 0, E.sdkSessionIdVerified = !1), E?.streamAbortController && !E.streamAbortController.signal.aborted ? await Fe(E, "clear") : E?.currentAbortController && !E.currentAbortController.signal.aborted && je(E, "immediate"), await ut(t, g, {
                sdk_session_id: null,
                pending_fork_to: null,
                pending_undo: null
            }), K("[session-manager] SDK session cleared", {
                sessionKey: g,
                actorRunId: E?.actorRunId,
                previousSessionId: z
            }), {
                cleared: !0,
                previousSessionId: z
            }
        },
        async getSessionModelView(g, E) {
            let z = x.get(g),
                N = await It(t, g).catch(() => null),
                U = await y(g, z),
                D = {
                    runtime: U,
                    storedModel: N?.model,
                    hasLiveQuery: !!z?.query
                },
                ne = z?.query;
            if (ne && typeof ne.supportedModels == "function") try {
                D.available = h(await ne.supportedModels())
            } catch {}
            try {
                let Oe = await v(g, E);
                if (U === "claude") {
                    let bt = Object.entries(Oe.claudeModelProfiles ?? {}).map(([Xe, mt]) => {
                        let _e = Hme(mt.baseUrl);
                        return {
                            model: Xe,
                            contextWindow: mt.cap,
                            source: mt.source,
                            ..._e ? {
                                endpointHost: _e
                            } : {}
                        }
                    });
                    bt.length > 0 && (D.profiles = bt.sort((Xe, mt) => Xe.model.localeCompare(mt.model)));
                    let ye = Object.entries(Oe.claudeModelAliases ?? {}).map(([Xe, mt]) => ({
                        tier: Xe,
                        model: mt.model,
                        source: mt.source
                    })).sort((Xe, mt) => Xe.tier.localeCompare(mt.tier));
                    if (ye.length > 0 && (D.aliases = ye), !D.storedModel) {
                        let Xe = await Bb({
                            model: null,
                            cwd: Wb(t, g, N ?? void 0).cwd,
                            daemonEnv: process.env,
                            mergedCatalog: Oe.claudeModelProfiles ?? {},
                            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
                            issues: Oe.claudeModelProfileIssues
                        });
                        Xe.kind === "profiled-external" && Xe.modelOrigin && (D.cliDefaultModel = {
                            model: Xe.model,
                            origin: Xe.modelOrigin
                        })
                    }
                    let Ft = [...Oe.claudeModelProfileIssues ?? [], ...Oe.claudeModelAliasIssues ?? []];
                    Ft.length > 0 && (D.profileIssues = Ft.map(Xe => ({
                        ...Xe.model !== void 0 ? {
                            model: Xe.model
                        } : {},
                        reason: Xe.reason,
                        ...Xe.layer !== void 0 ? {
                            layer: Xe.layer
                        } : {}
                    })))
                }
            } catch (Oe) {
                Z("[session-manager] /model view: model profile scope unreadable", {
                    sessionKey: g,
                    error: Oe instanceof Error ? Oe.message : String(Oe)
                })
            }
            return D
        },
        async setSessionModel(g, E, z) {
            if (!j) return {
                ok: !1,
                reason: "not_running"
            };
            let N = x.get(g),
                U = await y(g, N);
            if (U === "grok") {
                let _e = _(N?.grokAdapter),
                    kt = !!(_e && (_e.hasSession?.() ?? !0));
                if (E !== null && _e && kt) try {
                    await _e.setModel({
                        modelId: E
                    })
                } catch (Ee) {
                    let hn = Ee instanceof Error ? Ee.message : String(Ee);
                    return Z("[session-manager] grok session/set_model failed", {
                        sessionKey: g,
                        model: E,
                        error: hn
                    }), {
                        ok: !1,
                        reason: "runtime_rejected",
                        detail: hn
                    }
                }
                return await ut(t, g, {
                    model: E ?? null,
                    model_runtime: E !== null ? "grok" : null,
                    pending_model_fork: null
                }), K("[session-manager] grok session model override updated", {
                    sessionKey: g,
                    model: E ?? "(reset to default)",
                    applied: E !== null && kt ? "live" : "stored"
                }), {
                    ok: !0,
                    model: E,
                    applied: E !== null && kt ? "live" : "stored"
                }
            }
            if (U === "codex") return await ut(t, g, {
                model: E ?? null,
                model_runtime: E !== null ? "codex" : null,
                pending_model_fork: !0
            }), K("[session-manager] codex session model override updated", {
                sessionKey: g,
                model: E ?? "(reset to default)",
                pendingModelFork: !0
            }), {
                ok: !0,
                model: E,
                applied: "stored"
            };
            let D = N?.query,
                ne;
            if (E && D && typeof D.supportedModels == "function") try {
                ne = (await D.supportedModels()).some(kt => kt.value === E)
            } catch {}
            let Oe = await b(g, N, E, z).catch(_e => (Z("[session-manager] model context profile classification failed — applying live", {
                sessionKey: g,
                model: E ?? "(reset to default)",
                error: _e instanceof Error ? _e.message : String(_e)
            }), {
                outcome: "unknown",
                requirementKind: void 0,
                contextWindow: void 0
            }));
            if (Oe.outcome === "blocked") return Z("[session-manager] /model refused: unresolved model context profile", {
                sessionKey: g,
                model: E ?? "(reset to default)",
                detail: Oe.detail
            }), {
                ok: !1,
                reason: "profile_error",
                detail: Oe.detail
            };
            let bt = Oe.outcome === "rebuild",
                ye = bt ? "stored_pending_rebuild" : "stored",
                Ft = null,
                Xe = N?.streamingState;
            if (!bt && !!Xe && Xe?.closed === !1 && (E ?? null) === (Xe?.liveModel ?? null)) ye = "live";
            else if (!bt && D && typeof D.setModel == "function") try {
                await D.setModel(E ?? void 0), ye = "live", Xe && !Xe.closed && (Xe.liveModel = E ?? void 0)
            } catch (_e) {
                Z("[session-manager] live setModel failed — storing the override instead", {
                    sessionKey: g,
                    model: E ?? "(reset to default)",
                    error: _e instanceof Error ? _e.message : String(_e)
                }), E && N && B(N, Oe.requirementKind) && (ye = "stored_pending_rebuild", Ft = E)
            }
            return await ut(t, g, {
                model: E ?? null,
                model_runtime: E !== null ? "claude" : null,
                pending_model_fork: null
            }), Ft && N && te(N, {
                model: Ft,
                requirementKind: Oe.requirementKind,
                reason: "live-command"
            }), K("[session-manager] session model override updated", {
                sessionKey: g,
                model: E ?? "(reset to default)",
                applied: ye,
                listed: ne ?? "(no list consulted)",
                contextProfile: Oe.requirementKind ?? "(unresolved)"
            }), {
                ok: !0,
                model: E,
                applied: ye,
                listed: ne,
                contextProfile: Oe.requirementKind,
                ...Oe.contextWindow ? {
                    contextWindow: Oe.contextWindow
                } : {}
            }
        },
        async getSessionEffortView(g) {
            let E = x.get(g),
                z = await It(t, g).catch(() => null);
            return {
                runtime: await y(g, E),
                storedEffort: z?.effort ?? void 0,
                hasLiveQuery: !!E?.query
            }
        },
        async setSessionEffort(g, E) {
            if (!j) return {
                ok: !1,
                reason: "not_running"
            };
            let z = x.get(g),
                N = await y(g, z);
            if (N === "grok") {
                let ne = _(z?.grokAdapter),
                    bt = (await It(t, g).catch(() => null))?.model ?? ne?.currentModelId?.(),
                    ye = !!(ne && (ne.hasSession?.() ?? !0) && bt);
                if (E !== null) {
                    if (!ye || !ne || !bt) return await ut(t, g, {
                        effort: E
                    }), K("[session-manager] grok session effort override updated", {
                        sessionKey: g,
                        effort: E,
                        applied: "stored"
                    }), {
                        ok: !0,
                        effort: E,
                        applied: "stored"
                    };
                    try {
                        await ne.setModel({
                            modelId: bt,
                            reasoningEffort: E
                        })
                    } catch (Ft) {
                        let Xe = Ft instanceof Error ? Ft.message : String(Ft);
                        return Z("[session-manager] grok session/set_model(effort) failed", {
                            sessionKey: g,
                            effort: E,
                            error: Xe
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Xe
                        }
                    }
                    return await ut(t, g, {
                        effort: E
                    }), K("[session-manager] grok session effort override updated", {
                        sessionKey: g,
                        effort: E,
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: E,
                        applied: "live"
                    }
                }
                if (ne && bt && (ne.hasSession?.() ?? !0)) {
                    try {
                        await ne.setModel({
                            modelId: bt
                        })
                    } catch (Ft) {
                        let Xe = Ft instanceof Error ? Ft.message : String(Ft);
                        return Z("[session-manager] grok session/set_model(effort reset) failed", {
                            sessionKey: g,
                            error: Xe
                        }), {
                            ok: !1,
                            reason: "runtime_rejected",
                            detail: Xe
                        }
                    }
                    return await ut(t, g, {
                        effort: null
                    }), K("[session-manager] grok session effort override updated", {
                        sessionKey: g,
                        effort: "(reset to default)",
                        applied: "live"
                    }), {
                        ok: !0,
                        effort: null,
                        applied: "live"
                    }
                }
                return await ut(t, g, {
                    effort: null
                }), K("[session-manager] grok session effort override updated", {
                    sessionKey: g,
                    effort: "(reset to default)",
                    applied: "stored"
                }), {
                    ok: !0,
                    effort: null,
                    applied: "stored"
                }
            }
            if (N === "codex") return await ut(t, g, {
                effort: E ?? null
            }), K("[session-manager] codex session effort override updated", {
                sessionKey: g,
                effort: E ?? "(reset to default)"
            }), {
                ok: !0,
                effort: E,
                applied: "stored"
            };
            let U = z?.query,
                D = "stored";
            if (U && typeof U.applyFlagSettings == "function") try {
                await U.applyFlagSettings({
                    effortLevel: E ?? null
                }), D = "live"
            } catch (ne) {
                Z("[session-manager] live applyFlagSettings(effort) failed — storing the override instead", {
                    sessionKey: g,
                    effort: E ?? "(reset to default)",
                    error: ne instanceof Error ? ne.message : String(ne)
                })
            }
            return await ut(t, g, {
                effort: E ?? null
            }), K("[session-manager] session effort override updated", {
                sessionKey: g,
                effort: E ?? "(reset to default)",
                applied: D
            }), {
                ok: !0,
                effort: E,
                applied: D
            }
        },
        getActorView(g) {
            let E = x.get(g);
            return !E || E.actorRunId <= 0 ? null : {
                sessionKey: E.sessionKey,
                status: E.status,
                health: "ok",
                idleSince: E.status === "idle" ? E.idleSince : void 0,
                attachedChannels: E.attachedChannels.size,
                sdkSessionId: E.sdkSessionId,
                origin: E.origin,
                jobId: E.jobId,
                runtime: E.runtime
            }
        },
        hasQueuedWake: O,
        listActors() {
            let g = new Map;
            for (let [E, z] of x) z.actorRunId <= 0 && !O(z.sessionKey) || g.set(E, {
                sessionKey: z.sessionKey,
                status: z.status,
                health: "ok",
                idleSince: z.status === "idle" ? z.idleSince : void 0,
                attachedChannels: z.attachedChannels.size,
                sdkSessionId: z.sdkSessionId,
                origin: z.origin,
                jobId: z.jobId,
                runtime: z.runtime
            });
            return g
        },
        getSweeperActorState(g) {
            let E = x.get(g);
            return !E || E.actorRunId <= 0 ? null : {
                live: !0,
                midTurn: E.streamingState?.currentTurn?.accepted === !0,
                lastActivityAt: E.lastActivityAt,
                lastTurnCompletedAt: E.lastTurnCompletedAt,
                spawnedAt: E.spawnedAt
            }
        }
    }
}
