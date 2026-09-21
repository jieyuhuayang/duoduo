// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: Ugt, daemon.pretty.js:85799)
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
        dynamicTools: wA({
            paths: t,
            sessionKey: o,
            bus: n,
            sessionContextKind: "meta"
        })
    })), u = e.grokAvailability ?? checkGrokAvailability, l = e.grokAdapterFactory, c = e.piAdapterFactory ?? (({
        cwd: S,
        model: D,
        thinkingLevel: A
    }) => {
        let C = tS(),
            {
                settingsSeed: $,
                defaultProjectTrust: j
            } = nS(C),
            k = Cgt(Qg.join(Ogt(), "aladuo-pi-partition-")),
            L = {
                session_context_kind: "system"
            },
            B = TO({
                cwd: S,
                sdkSessionId: crypto.randomUUID(),
                sessionDir: k,
                agentDir: C,
                authPath: Qg.join(C, "auth.json"),
                modelsPath: Qg.join(C, "models.json"),
                modelsStorePath: Qg.join(k, "models-store.json"),
                settingsSeed: $,
                resources: {
                    extensions: "all",
                    skills: "all",
                    default_project_trust: j
                },
                model: D,
                thinkingLevel: A,
                inMemorySession: !0,
                workerCommand: eS(),
                env: {
                    [vC]: t.daemonSocketPath,
                    [wC]: kC({
                        session_key: o,
                        ...L
                    }),
                    [SC]: JSON.stringify(L)
                },
                logDebug: G => Ee(G, {
                    sessionKey: o
                })
            });
        return {
            ...B,
            shutdown: async () => {
                try {
                    await B.shutdown()
                } finally {
                    $gt(k, {
                        recursive: !0,
                        force: !0
                    })
                }
            }
        }
    }), d = e.maxPartitionsPerIdleTick ?? 2, f = e.cadenceIntervalMs ?? _g, p = !1, m = !1, h = null, g = !1, y = null, v = 0, b = new Map;
    async function _(S, D, A) {
        let C = await Promise.all(S.map(async j => [j.name, await jf(t, j.name)])),
            $ = new Map(C);
        for (;;) {
            let j = await yg(t);
            if (j.allDone) {
                if (await sve(t) === 0) return null;
                j = await yg(t)
            }
            let k = E(j.items, S, A, $, new Date);
            if (!k) return null;
            let L = S.find(J => J.name === k.name);
            if (!L || !L.schedule.enabled) {
                let J = j.items.filter(M => !M.done).length;
                await H$(t, k.name);
                let le = (await yg(t)).items.filter(M => !M.done).length;
                if (le >= J) return Z("[meta-session] stale playlist item did not advance", {
                    name: k.name,
                    reason: L ? "disabled" : "removed",
                    beforeUnchecked: J,
                    afterUnchecked: le
                }), null;
                Ee("[meta-session] skipping unavailable partition, will retry next", {
                    name: k.name,
                    reason: L ? "disabled" : "removed"
                });
                continue
            }
            let B = await I(L, D, A),
                ce = (await Promise.all(S.map(async J => [J.name, await jf(t, J.name)]))).filter(([, J]) => y6(J, new Date)).map(([J]) => J);
            return {
                ...B,
                backedOff: ce
            }
        }
    }
    async function I(S, D, A) {
        let C = Date.now(),
            $, j, k = 0,
            L = 0,
            B = S.runtime,
            G = B ?? Co();
        Q("[v12-observe] partition runtime selected", {
            partition: S.name,
            runtime: G,
            requestedRuntime: B ?? null,
            sdkInjected: !!i
        });
        let ce, J, ee, le, M = async we => {
            let Fe = Date.now() - C,
                yt = createSpineEvent({
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
                        runtime: G,
                        runtime_source: B ? "explicit" : "default",
                        error: `runtime '${G}' is unavailable: ${we}`
                    }
                });
            await atomicAppendEvent(t, yt), await advanceConsumerWatermark(t, "meta_session", yt.id, new Date(yt.ts)), Z("[meta-session] partition skipped: requested runtime unavailable", {
                partition: S.name,
                runtime: G,
                requestedFrom: B ? "frontmatter" : "default",
                reason: we
            }), await H$(t, S.name), b.set(S.name, A);
            let On = await jf(t, S.name),
                Lt = new Date,
                br = {
                    last_started_at: new Date(C).toISOString(),
                    last_finished_at: Lt.toISOString(),
                    last_result: "error",
                    consecutive_failures: On.consecutive_failures + 1,
                    backoff_until: _6("error", On.consecutive_failures + 1, Lt, f)
                };
            return await g6(t, S.name, br), {
                name: S.name,
                outcome: "error",
                durationMs: Fe,
                backedOff: []
            }
        }, ue = claudeUnavailableReason();
        if (G === "claude" && !i && ue) return await M(ue);
        let $e = Ja(await li(t.channelConfigDir)),
            se = S.model ?? $e.runtimeModels?.[G]?.model,
            N = S.effort ?? $e.runtimeEfforts?.[G]?.effort;
        if (i && G === "claude") ce = i;
        else if (G === "codex") {
            let we = await s();
            if (Q("[v12-observe] codex probe result", {
                    partition: S.name,
                    probeOk: we.ok,
                    probeReason: we.ok ? null : we.reason
                }), !we.ok) return await M(we.reason);
            Q("[v12-observe] codex adapter spawn", {
                partition: S.name,
                sandbox: resolveCodexSandbox()
            });
            let Fe = a();
            ce = Fe, J = () => Fe.shutdown()
        } else if (G === "grok") {
            let we = await u();
            if (Q("[v12-observe] grok probe result", {
                    partition: S.name,
                    probeOk: we.ok,
                    probeReason: we.ok ? null : we.reason
                }), !we.ok) return await M(we.reason);
            Q("[v12-observe] grok adapter spawn", {
                partition: S.name
            });
            let Fe = l ? l() : createGrokAcpAdapter({
                cwd: S.dir,
                mcpServerFactory: () => Kg(t, {
                    sessionKey: o,
                    bus: n,
                    sessionContextKind: "meta",
                    callerRuntime: G
                })
            });
            ce = Fe, ee = () => Fe.shutdown()
        } else if (G === "pi") {
            if (!se) return await M("pi partition has no model: set `model: provider/modelId` in the partition CLAUDE.md frontmatter, or `pi.model` in the global runtime config");
            Q("[v12-observe] pi adapter spawn", {
                partition: S.name
            });
            let we = c({
                cwd: S.dir,
                model: se,
                thinkingLevel: N
            });
            ce = we, le = () => we.shutdown()
        } else ce = createAgentSdkAdapter();
        let U = [],
            q = !1,
            Y = partitionInboxDir(t, S.name),
            Se = await ave(t, S.name),
            ye = zgt(Y, Se),
            Be = `### Partition
- Name: ${S.name}
- cwd: ${S.dir}/
- Inbox: ${Y}/
- runtime: ${G}
`,
            w = ye ? `${S.promptContent}

${Be}
${D}

${ye}` : `${S.promptContent}

${Be}
${D}`,
            P = Kg(t, {
                sessionKey: o,
                bus: n,
                sessionContextKind: "meta",
                callerRuntime: G
            }),
            z = [...new Set([...PARTITION_CORE_TOOLS, ...S.claudeTools ?? []])],
            F = new AbortController;
        Q("[meta-session] executing partition", {
            partition: S.name
        });
        let V = G === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: S.prompt_mode ?? "append"
            }, o, void 0, void 0, G) : void 0,
            K = Math.max(1, S.schedule.max_duration_ms),
            fe, oe = new Error(`partition timeout: ${S.name} exceeded ${K}ms`),
            xe;
        try {
            let we = await vO(t, {
                    runtime: G,
                    model: se,
                    cwd: S.dir,
                    effective: null
                }),
                Fe = ce.run({
                    prompt: G === "pi" ? w : stringToMessageGenerator(w),
                    cwd: S.dir,
                    model: G === "claude" ? we.effectiveModel ?? se : G === "pi" ? void 0 : se,
                    effort: G === "pi" ? void 0 : N,
                    claudeContextRequirement: we.requirement,
                    claudeModelAliases: we.aliases,
                    claudeSettingsPath: we.settingsPath,
                    settingSources: ["user", "project"],
                    persistSession: !1,
                    mcpServers: {
                        aladuo: P
                    },
                    holdInputOpenForBackgroundAgents: !0,
                    additionalDirectories: [t.memoryDir],
                    autoloadAdditionalDirectoryClaudeMd: !1,
                    tools: z,
                    systemPrompt: V,
                    abortController: F,
                    onStream: (On, Lt) => {
                        q || n.emit("session.stream", {
                            sessionKey: o,
                            chunk: On,
                            isSidechain: Lt
                        })
                    },
                    onExecutionEvent: On => {
                        q || (On.type === "tool_use" ? k += 1 : On.type === "tool_result" && On.isError && (L += 1), U.push(Mgt(t, o, S.name, On).catch(Lt => {
                            Z("[meta-session] failed to persist execution event", {
                                partition: S.name,
                                eventType: On.type,
                                error: Lt instanceof Error ? Lt.message : String(Lt)
                            })
                        })))
                    }
                }),
                yt = new Promise((On, Lt) => {
                    xe = setTimeout(() => {
                        Fe.catch(br => {
                            Z("[meta-session] late sdk completion after timeout", {
                                partition: S.name,
                                error: br instanceof Error ? br.message : String(br)
                            })
                        }), Lt(oe)
                    }, K)
                });
            j = await Promise.race([Fe, yt])
        } catch (we) {
            q = !0, we === oe ? ($ = "timeout", F.abort()) : ($ = "error", fe = we instanceof Error ? we.message : String(we))
        } finally {
            xe && clearTimeout(xe)
        }
        if (!$) {
            let we = l0e(j?.text);
            $ = Dgt(S.name, we) ? "invalid_output" : "success"
        }
        let Re = Date.now() - C;
        if (J) {
            Q("[v12-observe] codex adapter shutdown", {
                partition: S.name,
                outcome: $,
                durationMs: Re
            });
            try {
                await J()
            } catch (we) {
                Z("[meta-session] codex adapter shutdown threw", {
                    partition: S.name,
                    error: we instanceof Error ? we.message : String(we)
                })
            }
        }
        if (ee) {
            Q("[v12-observe] grok adapter shutdown", {
                partition: S.name,
                outcome: $,
                durationMs: Re
            });
            try {
                await ee()
            } catch (we) {
                Z("[meta-session] grok adapter shutdown threw", {
                    partition: S.name,
                    error: we instanceof Error ? we.message : String(we)
                })
            }
        }
        if (le) {
            Q("[v12-observe] pi adapter shutdown", {
                partition: S.name,
                outcome: $,
                durationMs: Re
            });
            try {
                await le()
            } catch (we) {
                Z("[meta-session] pi adapter shutdown threw", {
                    partition: S.name,
                    error: we instanceof Error ? we.message : String(we)
                })
            }
        }
        let gt = j?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${o}:${S.name}`,
                sdk_session_id: j?.sessionId,
                drain_started_at: new Date(C).toISOString(),
                drain_duration_ms: Re,
                sdk_duration_ms: Re,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: k,
                tool_errors: L,
                output_chars: j?.text?.length ?? 0,
                cancelled: $ === "timeout",
                usage: gt
            }).catch(() => {}), U.length > 0 && await Promise.all(U), $ === "success") {
            let we = l0e(j?.text),
                Fe = createSpineEvent({
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
                        runtime: G,
                        runtime_source: B ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, Fe), await advanceConsumerWatermark(t, "meta_session", Fe.id, new Date(Fe.ts)), Q("[meta-session] partition completed", {
                partition: S.name,
                runtime: G,
                eventId: Fe.id
            })
        } else {
            let we = $ === "timeout" ? `partition timeout: ${S.name} exceeded ${K}ms` : $ === "invalid_output" ? `invalid output from ${S.name}` : `partition error: ${S.name}${fe?`: ${fe}`:""}`,
                Fe = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: $,
                        error: we,
                        output_preview: j?.text?.slice(0, 400),
                        runtime: G,
                        runtime_source: B ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, Fe), await advanceConsumerWatermark(t, "meta_session", Fe.id, new Date(Fe.ts)), Z("[meta-session] partition settled with non-success outcome", {
                partition: S.name,
                runtime: G,
                outcome: $,
                error: we
            })
        }
        await H$(t, S.name), b.set(S.name, A);
        let Xe = await jf(t, S.name),
            Ve = $ === "success" ? 0 : Xe.consecutive_failures + 1,
            Pe = new Date,
            Qe = {
                last_started_at: new Date(C).toISOString(),
                last_finished_at: Pe.toISOString(),
                last_result: $,
                consecutive_failures: Ve,
                backoff_until: _6($, Ve, Pe, f)
            };
        return await g6(t, S.name, Qe), {
            name: S.name,
            outcome: $,
            durationMs: Re,
            backedOff: []
        }
    }

    function E(S, D, A, C, $) {
        for (let j of S) {
            if (j.done) continue;
            let k = D.find(ce => ce.name === j.name);
            if (!k || !k.schedule.enabled) return j;
            let L = C.get(j.name);
            if (L && y6(L, $)) continue;
            let B = Math.max(0, k.schedule.cooldown_ticks),
                G = b.get(j.name);
            if (G === void 0 || A - G >= B) return j
        }
        return null
    }
    let R = async () => {
        if (p || m) {
            Ee("[meta-session] skipping tick", {
                processing: p,
                stopRequested: m
            });
            return
        }
        p = !0, Q("[meta-session] starting tick");
        try {
            v += 1;
            let [S, D, A, C] = await Promise.all([FA(t.memoryFragmentsDir), FA(t.memoryEntitiesDir), FA(t.memoryTopicsDir), Lgt(t)]), $ = [S, D, A, C].join(":"), j = jgt($);
            if (y !== null && j === y) {
                Ee("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), p = !1;
                return
            }
            y = j, await Du(t, G => ({
                ...G,
                health: {
                    ...G.health,
                    meta_session: "starting"
                }
            }));
            let k = await Bw(t),
                L = await Fgt(t, r),
                B = await _(k, L, v);
            if (B?.name && d > 1 && (!r || r.activeCount() <= 1))
                for (let ce = 1; ce < d && await _(k, L, v); ce++);
            await Du(t, G => ({
                ...G,
                health: {
                    ...G.health,
                    meta_session: "ok"
                }
            })), Q("[meta-session] tick completed", {
                executed: B?.name ?? null,
                outcome: B?.outcome ?? null,
                durationMs: B?.durationMs ?? null,
                backedOff: B?.backedOff ?? []
            })
        } catch (S) {
            Le("[meta-session] tick error:", S), y = null, await Du(t, A => ({
                ...A,
                health: {
                    ...A.health,
                    meta_session: "down"
                }
            }));
            let D = createSpineEvent({
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
            await atomicAppendEvent(t, D), await advanceConsumerWatermark(t, "meta_session", D.id, new Date(D.ts))
        } finally {
            p = !1
        }
    }, x = () => {
        if (p || m) {
            R();
            return
        }
        let S = R();
        h = S;
        let D = () => {
            h === S && (h = null)
        };
        S.then(D, D)
    };
    return {
        start() {
            m || g || (n.on("cadence.tick", x), g = !0, Du(t, S => ({
                ...S,
                health: {
                    ...S.health,
                    meta_session: "starting"
                }
            })), wt("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (m = !0, g && (n.off("cadence.tick", x), g = !1), h) try {
                await h
            } catch {}
            wt("info", "[meta-session] stopped")
        },
        isProcessing() {
            return p
        }
    }
}
