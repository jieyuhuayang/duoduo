// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: Ult, daemon.pretty.js:78994)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMetaSession(e) {
    let {
        paths: t,
        bus: n,
        sessionManager: r
    } = e, i = e.sdk, o = e.sessionKey ?? "meta:subconscious", s = e.codexAvailability ?? checkCodexAvailability, a = e.codexAdapterFactory ?? (() => createCodexAppServerAdapter({
        sandbox: resolveCodexSandbox(),
        ephemeral: !0,
        dynamicTools: WC({
            paths: t,
            sessionKey: o,
            bus: n,
            sessionContextKind: "meta"
        })
    })), l = e.grokAvailability ?? checkGrokAvailability, u = e.grokAdapterFactory, c = e.piAdapterFactory ?? (({
        cwd: S,
        model: O
    }) => {
        let $ = yv(),
            {
                settingsSeed: C,
                defaultProjectTrust: A
            } = _v($),
            j = Clt(Uh.join($lt(), "aladuo-pi-partition-")),
            P = {
                session_context_kind: "system"
            },
            z = QP({
                cwd: S,
                sdkSessionId: crypto.randomUUID(),
                sessionDir: j,
                agentDir: $,
                authPath: Uh.join($, "auth.json"),
                modelsPath: Uh.join($, "models.json"),
                modelsStorePath: Uh.join(j, "models-store.json"),
                settingsSeed: C,
                resources: {
                    extensions: "all",
                    skills: "all",
                    default_project_trust: A
                },
                model: O,
                inMemorySession: !0,
                workerCommand: gv(),
                env: {
                    [oI]: t.daemonSocketPath,
                    [sI]: lI({
                        session_key: o,
                        ...P
                    }),
                    [aI]: JSON.stringify(P)
                },
                logDebug: U => ke(U, {
                    sessionKey: o
                })
            });
        return {
            ...z,
            shutdown: async () => {
                try {
                    await z.shutdown()
                } finally {
                    Olt(j, {
                        recursive: !0,
                        force: !0
                    })
                }
            }
        }
    }), d = e.maxPartitionsPerIdleTick ?? 2, p = e.cadenceIntervalMs ?? ah, f = !1, m = !1, h = null, g = !1, y = null, w = 0, v = new Map;
    async function b(S, O, $) {
        let C = await Promise.all(S.map(async j => [j.name, await Gd(t, j.name)])),
            A = new Map(C);
        for (;;) {
            let j = await sh(t);
            if (j.allDone) {
                if (await uhe(t) === 0) return null;
                j = await sh(t)
            }
            let P = I(j.items, S, $, A, new Date);
            if (!P) return null;
            let z = S.find(V => V.name === P.name);
            if (!z || !z.schedule.enabled) {
                let V = j.items.filter(L => !L.done).length;
                await gP(t, P.name);
                let X = (await sh(t)).items.filter(L => !L.done).length;
                if (X >= V) return J("[meta-session] stale playlist item did not advance", {
                    name: P.name,
                    reason: z ? "disabled" : "removed",
                    beforeUnchecked: V,
                    afterUnchecked: X
                }), null;
                ke("[meta-session] skipping unavailable partition, will retry next", {
                    name: P.name,
                    reason: z ? "disabled" : "removed"
                });
                continue
            }
            let U = await R(z, O, $),
                te = (await Promise.all(S.map(async V => [V.name, await Gd(t, V.name)]))).filter(([, V]) => o4(V, new Date)).map(([V]) => V);
            return {
                ...U,
                backedOff: te
            }
        }
    }
    async function R(S, O, $) {
        let C = Date.now(),
            A, j, P = 0,
            z = 0,
            U = S.runtime,
            K = U ?? ao();
        Q("[v12-observe] partition runtime selected", {
            partition: S.name,
            runtime: K,
            requestedRuntime: U ?? null,
            sdkInjected: !!i
        });
        let te, V, re, X, L = async we => {
            let Xe = Date.now() - C,
                Pt = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: "runtime_unavailable",
                        runtime: K,
                        runtime_source: U ? "explicit" : "default",
                        error: `runtime '${K}' is unavailable: ${we}`
                    }
                });
            await atomicAppendEvent(t, Pt), await advanceConsumerWatermark(t, "meta_session", Pt.id, new Date(Pt.ts)), J("[meta-session] partition skipped: requested runtime unavailable", {
                partition: S.name,
                runtime: K,
                requestedFrom: U ? "frontmatter" : "default",
                reason: we
            }), await gP(t, S.name), v.set(S.name, $);
            let nr = await Gd(t, S.name),
                Hs = new Date,
                wr = {
                    last_started_at: new Date(C).toISOString(),
                    last_finished_at: Hs.toISOString(),
                    last_result: "error",
                    consecutive_failures: nr.consecutive_failures + 1,
                    backoff_until: s4("error", nr.consecutive_failures + 1, Hs, p)
                };
            return await i4(t, S.name, wr), {
                name: S.name,
                outcome: "error",
                durationMs: Xe,
                backedOff: []
            }
        }, ie = claudeUnavailableReason();
        if (K === "claude" && !i && ie) return await L(ie);
        if (i && K === "claude") te = i;
        else if (K === "codex") {
            let we = await s();
            if (Q("[v12-observe] codex probe result", {
                    partition: S.name,
                    probeOk: we.ok,
                    probeReason: we.ok ? null : we.reason
                }), !we.ok) return await L(we.reason);
            Q("[v12-observe] codex adapter spawn", {
                partition: S.name,
                sandbox: resolveCodexSandbox()
            });
            let Xe = a();
            te = Xe, V = () => Xe.shutdown()
        } else if (K === "grok") {
            let we = await l();
            if (Q("[v12-observe] grok probe result", {
                    partition: S.name,
                    probeOk: we.ok,
                    probeReason: we.ok ? null : we.reason
                }), !we.ok) return await L(we.reason);
            Q("[v12-observe] grok adapter spawn", {
                partition: S.name
            });
            let Xe = u ? u() : createGrokAcpAdapter({
                cwd: S.dir,
                mcpServerFactory: () => Fh(t, {
                    sessionKey: o,
                    bus: n,
                    sessionContextKind: "meta",
                    callerRuntime: K
                })
            });
            te = Xe, re = () => Xe.shutdown()
        } else if (K === "pi") {
            if (!S.model) return await L("pi partition has no model: set `model: provider/modelId` in the partition CLAUDE.md frontmatter");
            Q("[v12-observe] pi adapter spawn", {
                partition: S.name
            });
            let we = c({
                cwd: S.dir,
                model: S.model
            });
            te = we, X = () => we.shutdown()
        } else te = createAgentSdkAdapter();
        let fe = [],
            _e = !1,
            D = partitionInboxDir(t, S.name),
            B = await che(t, S.name),
            F = zlt(D, B),
            W = `### Partition
- Name: ${S.name}
- cwd: ${S.dir}/
- Inbox: ${D}/
- runtime: ${K}
`,
            ye = F ? `${S.promptContent}

${W}
${O}

${F}` : `${S.promptContent}

${W}
${O}`,
            ge = Fh(t, {
                sessionKey: o,
                bus: n,
                sessionContextKind: "meta",
                callerRuntime: K
            }),
            Be = [...new Set([...PARTITION_CORE_TOOLS, ...S.claudeTools ?? []])],
            _ = new AbortController;
        Q("[meta-session] executing partition", {
            partition: S.name
        });
        let k = K === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: S.prompt_mode ?? "append"
            }, o, void 0, void 0, K) : void 0,
            M = te.run({
                prompt: K === "pi" ? ye : rI(ye),
                cwd: S.dir,
                model: K === "claude" ? S.model : void 0,
                effort: K === "claude" ? S.effort : void 0,
                settingSources: ["user", "project"],
                persistSession: !1,
                mcpServers: {
                    aladuo: ge
                },
                holdInputOpenForBackgroundAgents: !0,
                additionalDirectories: [t.memoryDir],
                autoloadAdditionalDirectoryClaudeMd: !1,
                tools: Be,
                systemPrompt: k,
                abortController: _,
                onStream: (we, Xe) => {
                    _e || n.emit("session.stream", {
                        sessionKey: o,
                        chunk: we,
                        isSidechain: Xe
                    })
                },
                onExecutionEvent: we => {
                    _e || (we.type === "tool_use" ? P += 1 : we.type === "tool_result" && we.isError && (z += 1), fe.push(Mlt(t, o, S.name, we).catch(Xe => {
                        J("[meta-session] failed to persist execution event", {
                            partition: S.name,
                            eventType: we.type,
                            error: Xe instanceof Error ? Xe.message : String(Xe)
                        })
                    })))
                }
            }),
            Y = Math.max(1, S.schedule.max_duration_ms),
            q, se = new Error(`partition timeout: ${S.name} exceeded ${Y}ms`),
            ve, Se = new Promise((we, Xe) => {
                ve = setTimeout(() => Xe(se), Y)
            });
        try {
            j = await Promise.race([M, Se])
        } catch (we) {
            _e = !0, we === se ? (A = "timeout", _.abort(), M.catch(Xe => {
                J("[meta-session] late sdk completion after timeout", {
                    partition: S.name,
                    error: Xe instanceof Error ? Xe.message : String(Xe)
                })
            })) : (A = "error", q = we instanceof Error ? we.message : String(we))
        } finally {
            ve && clearTimeout(ve)
        }
        if (!A) {
            let we = iwe(j?.text);
            A = Dlt(S.name, we) ? "invalid_output" : "success"
        }
        let He = Date.now() - C;
        if (V) {
            Q("[v12-observe] codex adapter shutdown", {
                partition: S.name,
                outcome: A,
                durationMs: He
            });
            try {
                await V()
            } catch (we) {
                J("[meta-session] codex adapter shutdown threw", {
                    partition: S.name,
                    error: we instanceof Error ? we.message : String(we)
                })
            }
        }
        if (re) {
            Q("[v12-observe] grok adapter shutdown", {
                partition: S.name,
                outcome: A,
                durationMs: He
            });
            try {
                await re()
            } catch (we) {
                J("[meta-session] grok adapter shutdown threw", {
                    partition: S.name,
                    error: we instanceof Error ? we.message : String(we)
                })
            }
        }
        if (X) {
            Q("[v12-observe] pi adapter shutdown", {
                partition: S.name,
                outcome: A,
                durationMs: He
            });
            try {
                await X()
            } catch (we) {
                J("[meta-session] pi adapter shutdown threw", {
                    partition: S.name,
                    error: we instanceof Error ? we.message : String(we)
                })
            }
        }
        let it = j?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${o}:${S.name}`,
                sdk_session_id: j?.sessionId,
                drain_started_at: new Date(C).toISOString(),
                drain_duration_ms: He,
                sdk_duration_ms: He,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: P,
                tool_errors: z,
                output_chars: j?.text?.length ?? 0,
                cancelled: A === "timeout",
                usage: it
            }).catch(() => {}), fe.length > 0 && await Promise.all(fe), A === "success") {
            let we = iwe(j?.text),
                Xe = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        text: we,
                        tick_type: "subconscious",
                        partition: S.name,
                        runtime: K,
                        runtime_source: U ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, Xe), await advanceConsumerWatermark(t, "meta_session", Xe.id, new Date(Xe.ts)), Q("[meta-session] partition completed", {
                partition: S.name,
                runtime: K,
                eventId: Xe.id
            })
        } else {
            let we = A === "timeout" ? `partition timeout: ${S.name} exceeded ${Y}ms` : A === "invalid_output" ? `invalid output from ${S.name}` : `partition error: ${S.name}${q?`: ${q}`:""}`,
                Xe = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: A,
                        error: we,
                        output_preview: j?.text?.slice(0, 400),
                        runtime: K,
                        runtime_source: U ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, Xe), await advanceConsumerWatermark(t, "meta_session", Xe.id, new Date(Xe.ts)), J("[meta-session] partition settled with non-success outcome", {
                partition: S.name,
                runtime: K,
                outcome: A,
                error: we
            })
        }
        await gP(t, S.name), v.set(S.name, $);
        let pt = await Gd(t, S.name),
            Ae = A === "success" ? 0 : pt.consecutive_failures + 1,
            bt = new Date,
            Ne = {
                last_started_at: new Date(C).toISOString(),
                last_finished_at: bt.toISOString(),
                last_result: A,
                consecutive_failures: Ae,
                backoff_until: s4(A, Ae, bt, p)
            };
        return await i4(t, S.name, Ne), {
            name: S.name,
            outcome: A,
            durationMs: He,
            backedOff: []
        }
    }

    function I(S, O, $, C, A) {
        for (let j of S) {
            if (j.done) continue;
            let P = O.find(te => te.name === j.name);
            if (!P || !P.schedule.enabled) return j;
            let z = C.get(j.name);
            if (z && o4(z, A)) continue;
            let U = Math.max(0, P.schedule.cooldown_ticks),
                K = v.get(j.name);
            if (K === void 0 || $ - K >= U) return j
        }
        return null
    }
    let T = async () => {
        if (f || m) {
            ke("[meta-session] skipping tick", {
                processing: f,
                stopRequested: m
            });
            return
        }
        f = !0, Q("[meta-session] starting tick");
        try {
            w += 1;
            let [S, O, $, C] = await Promise.all([cO(t.memoryFragmentsDir), cO(t.memoryEntitiesDir), cO(t.memoryTopicsDir), Llt(t)]), A = [S, O, $, C].join(":"), j = jlt(A);
            if (y !== null && j === y) {
                ke("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), f = !1;
                return
            }
            y = j, await ol(t, K => ({
                ...K,
                health: {
                    ...K.health,
                    meta_session: "starting"
                }
            }));
            let P = await sv(t),
                z = await Flt(t, r),
                U = await b(P, z, w);
            if (U?.name && d > 1 && (!r || r.activeCount() <= 1))
                for (let te = 1; te < d && await b(P, z, w); te++);
            await ol(t, K => ({
                ...K,
                health: {
                    ...K.health,
                    meta_session: "ok"
                }
            })), Q("[meta-session] tick completed", {
                executed: U?.name ?? null,
                outcome: U?.outcome ?? null,
                durationMs: U?.durationMs ?? null,
                backedOff: U?.backedOff ?? []
            })
        } catch (S) {
            Me("[meta-session] tick error:", S), y = null, await ol(t, $ => ({
                ...$,
                health: {
                    ...$.health,
                    meta_session: "down"
                }
            }));
            let O = createSpineEvent({
                type: "agent.error",
                source: {
                    kind: "meta",
                    name: "meta-session"
                },
                session_key: o,
                payload: {
                    stage: "tick",
                    error: S instanceof Error ? S.message : String(S)
                }
            });
            await atomicAppendEvent(t, O), await advanceConsumerWatermark(t, "meta_session", O.id, new Date(O.ts))
        } finally {
            f = !1
        }
    }, x = () => {
        if (f || m) {
            T();
            return
        }
        let S = T();
        h = S;
        let O = () => {
            h === S && (h = null)
        };
        S.then(O, O)
    };
    return {
        start() {
            m || g || (n.on("cadence.tick", x), g = !0, ol(t, S => ({
                ...S,
                health: {
                    ...S.health,
                    meta_session: "starting"
                }
            })), ht("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (m = !0, g && (n.off("cadence.tick", x), g = !1), h) try {
                await h
            } catch {}
            ht("info", "[meta-session] stopped")
        },
        isProcessing() {
            return f
        }
    }
}
