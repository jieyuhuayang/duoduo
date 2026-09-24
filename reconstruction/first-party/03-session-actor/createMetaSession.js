// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: Wgt, daemon.pretty.js:85819)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
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
        dynamicTools: buildCodexDynamicTools({
            paths: t,
            sessionKey: o,
            bus: n,
            sessionContextKind: "meta"
        })
    })), u = e.grokAvailability ?? checkGrokAvailability, l = e.grokAdapterFactory, c = e.piAdapterFactory ?? (({
        cwd: S,
        model: D,
        thinkingLevel: $
    }) => {
        let C = tS(),
            {
                settingsSeed: A,
                defaultProjectTrust: F
            } = nS(C),
            k = Dgt(ey.join(jgt(), "aladuo-pi-partition-")),
            N = {
                session_context_kind: "system"
            },
            V = TO({
                cwd: S,
                sdkSessionId: crypto.randomUUID(),
                sessionDir: k,
                agentDir: C,
                authPath: ey.join(C, "auth.json"),
                modelsPath: ey.join(C, "models.json"),
                modelsStorePath: ey.join(k, "models-store.json"),
                settingsSeed: A,
                resources: {
                    extensions: "all",
                    skills: "all",
                    default_project_trust: F
                },
                model: D,
                thinkingLevel: $,
                inMemorySession: !0,
                workerCommand: resolvePiWorkerCommand(),
                env: {
                    [vC]: t.daemonSocketPath,
                    [wC]: kC({
                        session_key: o,
                        ...N
                    }),
                    [SC]: JSON.stringify(N)
                },
                logDebug: W => Re(W, {
                    sessionKey: o
                })
            });
        return {
            ...V,
            shutdown: async () => {
                try {
                    await V.shutdown()
                } finally {
                    Mgt(k, {
                        recursive: !0,
                        force: !0
                    })
                }
            }
        }
    }), d = e.maxPartitionsPerIdleTick ?? 2, f = e.cadenceIntervalMs ?? bg, p = !1, m = !1, h = null, g = !1, y = null, v = 0, b = new Map;
    async function _(S, D, $) {
        let C = await Promise.all(S.map(async F => [F.name, await readPartitionRunState(t, F.name)])),
            A = new Map(C);
        for (;;) {
            let F = await readPlaylistRound(t);
            if (F.allDone) {
                if (await rebuildPlaylistRound(t) === 0) return null;
                F = await readPlaylistRound(t)
            }
            let k = E(F.items, S, $, A, new Date);
            if (!k) return null;
            let N = S.find(J => J.name === k.name);
            if (!N || !N.schedule.enabled) {
                let J = F.items.filter(j => !j.done).length;
                await markPlaylistItemExecuted(t, k.name);
                let fe = (await readPlaylistRound(t)).items.filter(j => !j.done).length;
                if (fe >= J) return Z("[meta-session] stale playlist item did not advance", {
                    name: k.name,
                    reason: N ? "disabled" : "removed",
                    beforeUnchecked: J,
                    afterUnchecked: fe
                }), null;
                Re("[meta-session] skipping unavailable partition, will retry next", {
                    name: k.name,
                    reason: N ? "disabled" : "removed"
                });
                continue
            }
            let V = await I(N, D, $),
                ce = (await Promise.all(S.map(async J => [J.name, await readPartitionRunState(t, J.name)]))).filter(([, J]) => isPartitionBackedOff(J, new Date)).map(([J]) => J);
            return {
                ...V,
                backedOff: ce
            }
        }
    }
    async function I(S, D, $) {
        let C = Date.now(),
            A, F, k = 0,
            N = 0,
            V = S.runtime,
            W = V ?? resolveDefaultRuntime();
        te("[v12-observe] partition runtime selected", {
            partition: S.name,
            runtime: W,
            requestedRuntime: V ?? null,
            sdkInjected: !!i
        });
        let ce, J, ne, fe, j = async ke => {
            let qe = Date.now() - C,
                pt = createSpineEvent({
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
                        runtime: W,
                        runtime_source: V ? "explicit" : "default",
                        error: `runtime '${W}' is unavailable: ${ke}`
                    }
                });
            await atomicAppendEvent(t, pt), await advanceConsumerWatermark(t, "meta_session", pt.id, new Date(pt.ts)), Z("[meta-session] partition skipped: requested runtime unavailable", {
                partition: S.name,
                runtime: W,
                requestedFrom: V ? "frontmatter" : "default",
                reason: ke
            }), await markPlaylistItemExecuted(t, S.name), b.set(S.name, $);
            let Cn = await readPartitionRunState(t, S.name),
                Ut = new Date,
                vr = {
                    last_started_at: new Date(C).toISOString(),
                    last_finished_at: Ut.toISOString(),
                    last_result: "error",
                    consecutive_failures: Cn.consecutive_failures + 1,
                    backoff_until: computePartitionBackoffUntil("error", Cn.consecutive_failures + 1, Ut, f)
                };
            return await writePartitionRunState(t, S.name, vr), {
                name: S.name,
                outcome: "error",
                durationMs: qe,
                backedOff: []
            }
        }, ue = claudeUnavailableReason();
        if (W === "claude" && !i && ue) return await j(ue);
        let Ie = Ja(await si(t.channelConfigDir)),
            ae = S.model ?? Ie.runtimeModels?.[W]?.model,
            M = S.effort ?? Ie.runtimeEfforts?.[W]?.effort;
        if (i && W === "claude") ce = i;
        else if (W === "codex") {
            let ke = await s();
            if (te("[v12-observe] codex probe result", {
                    partition: S.name,
                    probeOk: ke.ok,
                    probeReason: ke.ok ? null : ke.reason
                }), !ke.ok) return await j(ke.reason);
            te("[v12-observe] codex adapter spawn", {
                partition: S.name,
                sandbox: resolveCodexSandbox()
            });
            let qe = a();
            ce = qe, J = () => qe.shutdown()
        } else if (W === "grok") {
            let ke = await u();
            if (te("[v12-observe] grok probe result", {
                    partition: S.name,
                    probeOk: ke.ok,
                    probeReason: ke.ok ? null : ke.reason
                }), !ke.ok) return await j(ke.reason);
            te("[v12-observe] grok adapter spawn", {
                partition: S.name
            });
            let qe = l ? l() : createGrokAcpAdapter({
                cwd: S.dir,
                mcpServerFactory: () => createAladuoMcpServer(t, {
                    sessionKey: o,
                    bus: n,
                    sessionContextKind: "meta",
                    callerRuntime: W
                })
            });
            ce = qe, ne = () => qe.shutdown()
        } else if (W === "pi") {
            if (!ae) return await j("pi partition has no model: set `model: provider/modelId` in the partition CLAUDE.md frontmatter, or `pi.model` in the global runtime config");
            te("[v12-observe] pi adapter spawn", {
                partition: S.name
            });
            let ke = c({
                cwd: S.dir,
                model: ae,
                thinkingLevel: M
            });
            ce = ke, fe = () => ke.shutdown()
        } else ce = createAgentSdkAdapter();
        let z = [],
            U = !1,
            X = partitionInboxDir(t, S.name),
            Ee = await uve(t, S.name),
            be = renderPartitionInboxSection(X, Ee),
            w = `### Partition
- Name: ${S.name}
- cwd: ${S.dir}/
- Inbox: ${X}/
- runtime: ${W}
`,
            P = be ? `${S.promptContent}

${w}
${D}

${be}` : `${S.promptContent}

${w}
${D}`,
            K = createAladuoMcpServer(t, {
                sessionKey: o,
                bus: n,
                sessionContextKind: "meta",
                callerRuntime: W
            }),
            H = [...new Set([...PARTITION_CORE_TOOLS, ...S.claudeTools ?? []])],
            L = new AbortController;
        te("[meta-session] executing partition", {
            partition: S.name
        });
        let G = W === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: S.prompt_mode ?? "append"
            }, o, void 0, void 0, W) : void 0,
            ee = Math.max(1, S.schedule.max_duration_ms),
            we, le = new Error(`partition timeout: ${S.name} exceeded ${ee}ms`),
            ve;
        try {
            let ke = await vO(t, {
                    runtime: W,
                    model: ae,
                    cwd: S.dir,
                    effective: null
                }),
                qe = ce.run({
                    prompt: W === "pi" ? P : stringToMessageGenerator(P),
                    cwd: S.dir,
                    model: W === "claude" ? ke.effectiveModel ?? ae : W === "pi" ? void 0 : ae,
                    effort: W === "pi" ? void 0 : M,
                    claudeContextRequirement: ke.requirement,
                    claudeModelAliases: ke.aliases,
                    claudeSettingsPath: ke.settingsPath,
                    settingSources: ["user", "project"],
                    persistSession: !1,
                    mcpServers: {
                        aladuo: K
                    },
                    holdInputOpenForBackgroundAgents: !0,
                    additionalDirectories: [t.memoryDir],
                    autoloadAdditionalDirectoryClaudeMd: !1,
                    tools: H,
                    systemPrompt: G,
                    abortController: L,
                    onStream: (Cn, Ut) => {
                        U || n.emit("session.stream", {
                            sessionKey: o,
                            chunk: Cn,
                            isSidechain: Ut
                        })
                    },
                    onExecutionEvent: Cn => {
                        U || (Cn.type === "tool_use" ? k += 1 : Cn.type === "tool_result" && Cn.isError && (N += 1), z.push(Ugt(t, o, S.name, Cn).catch(Ut => {
                            Z("[meta-session] failed to persist execution event", {
                                partition: S.name,
                                eventType: Cn.type,
                                error: Ut instanceof Error ? Ut.message : String(Ut)
                            })
                        })))
                    }
                }),
                pt = new Promise((Cn, Ut) => {
                    ve = setTimeout(() => {
                        qe.catch(vr => {
                            Z("[meta-session] late sdk completion after timeout", {
                                partition: S.name,
                                error: vr instanceof Error ? vr.message : String(vr)
                            })
                        }), Ut(le)
                    }, ee)
                });
            F = await Promise.race([qe, pt])
        } catch (ke) {
            U = !0, ke === le ? (A = "timeout", L.abort()) : (A = "error", we = ke instanceof Error ? ke.message : String(ke))
        } finally {
            ve && clearTimeout(ve)
        }
        if (!A) {
            let ke = d0e(F?.text);
            A = detectEmptyRequiredPartitionOutput(S.name, ke) ? "invalid_output" : "success"
        }
        let Be = Date.now() - C;
        if (J) {
            te("[v12-observe] codex adapter shutdown", {
                partition: S.name,
                outcome: A,
                durationMs: Be
            });
            try {
                await J()
            } catch (ke) {
                Z("[meta-session] codex adapter shutdown threw", {
                    partition: S.name,
                    error: ke instanceof Error ? ke.message : String(ke)
                })
            }
        }
        if (ne) {
            te("[v12-observe] grok adapter shutdown", {
                partition: S.name,
                outcome: A,
                durationMs: Be
            });
            try {
                await ne()
            } catch (ke) {
                Z("[meta-session] grok adapter shutdown threw", {
                    partition: S.name,
                    error: ke instanceof Error ? ke.message : String(ke)
                })
            }
        }
        if (fe) {
            te("[v12-observe] pi adapter shutdown", {
                partition: S.name,
                outcome: A,
                durationMs: Be
            });
            try {
                await fe()
            } catch (ke) {
                Z("[meta-session] pi adapter shutdown threw", {
                    partition: S.name,
                    error: ke instanceof Error ? ke.message : String(ke)
                })
            }
        }
        let at = F?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${o}:${S.name}`,
                sdk_session_id: F?.sessionId,
                drain_started_at: new Date(C).toISOString(),
                drain_duration_ms: Be,
                sdk_duration_ms: Be,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: k,
                tool_errors: N,
                output_chars: F?.text?.length ?? 0,
                cancelled: A === "timeout",
                usage: at
            }).catch(() => {}), z.length > 0 && await Promise.all(z), A === "success") {
            let ke = d0e(F?.text),
                qe = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        text: ke,
                        tick_type: "subconscious",
                        partition: S.name,
                        runtime: W,
                        runtime_source: V ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, qe), await advanceConsumerWatermark(t, "meta_session", qe.id, new Date(qe.ts)), te("[meta-session] partition completed", {
                partition: S.name,
                runtime: W,
                eventId: qe.id
            })
        } else {
            let ke = A === "timeout" ? `partition timeout: ${S.name} exceeded ${ee}ms` : A === "invalid_output" ? `invalid output from ${S.name}` : `partition error: ${S.name}${we?`: ${we}`:""}`,
                qe = createSpineEvent({
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
                        error: ke,
                        output_preview: F?.text?.slice(0, 400),
                        runtime: W,
                        runtime_source: V ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, qe), await advanceConsumerWatermark(t, "meta_session", qe.id, new Date(qe.ts)), Z("[meta-session] partition settled with non-success outcome", {
                partition: S.name,
                runtime: W,
                outcome: A,
                error: ke
            })
        }
        await markPlaylistItemExecuted(t, S.name), b.set(S.name, $);
        let Je = await readPartitionRunState(t, S.name),
            De = A === "success" ? 0 : Je.consecutive_failures + 1,
            Oe = new Date,
            Gt = {
                last_started_at: new Date(C).toISOString(),
                last_finished_at: Oe.toISOString(),
                last_result: A,
                consecutive_failures: De,
                backoff_until: computePartitionBackoffUntil(A, De, Oe, f)
            };
        return await writePartitionRunState(t, S.name, Gt), {
            name: S.name,
            outcome: A,
            durationMs: Be,
            backedOff: []
        }
    }

    function E(S, D, $, C, A) {
        for (let F of S) {
            if (F.done) continue;
            let k = D.find(ce => ce.name === F.name);
            if (!k || !k.schedule.enabled) return F;
            let N = C.get(F.name);
            if (N && isPartitionBackedOff(N, A)) continue;
            let V = Math.max(0, k.schedule.cooldown_ticks),
                W = b.get(F.name);
            if (W === void 0 || $ - W >= V) return F
        }
        return null
    }
    let R = async () => {
        if (p || m) {
            Re("[meta-session] skipping tick", {
                processing: p,
                stopRequested: m
            });
            return
        }
        p = !0, te("[meta-session] starting tick");
        try {
            v += 1;
            let [S, D, $, C] = await Promise.all([FA(t.memoryFragmentsDir), FA(t.memoryEntitiesDir), FA(t.memoryTopicsDir), readLatestExternalEventId(t)]), A = [S, D, $, C].join(":"), F = hashActivityFingerprint(A);
            if (y !== null && F === y) {
                Re("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), p = !1;
                return
            }
            y = F, await updateRegistryStatus(t, W => ({
                ...W,
                health: {
                    ...W.health,
                    meta_session: "starting"
                }
            }));
            let k = await loadSubconsciousPartitions(t),
                N = await renderPartitionRuntimeContext(t, r),
                V = await _(k, N, v);
            if (V?.name && d > 1 && (!r || r.activeCount() <= 1))
                for (let ce = 1; ce < d && await _(k, N, v); ce++);
            await updateRegistryStatus(t, W => ({
                ...W,
                health: {
                    ...W.health,
                    meta_session: "ok"
                }
            })), te("[meta-session] tick completed", {
                executed: V?.name ?? null,
                outcome: V?.outcome ?? null,
                durationMs: V?.durationMs ?? null,
                backedOff: V?.backedOff ?? []
            })
        } catch (S) {
            Le("[meta-session] tick error:", S), y = null, await updateRegistryStatus(t, $ => ({
                ...$,
                health: {
                    ...$.health,
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
            m || g || (n.on("cadence.tick", x), g = !0, updateRegistryStatus(t, S => ({
                ...S,
                health: {
                    ...S.health,
                    meta_session: "starting"
                }
            })), _t("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (m = !0, g && (n.off("cadence.tick", x), g = !1), h) try {
                await h
            } catch {}
            _t("info", "[meta-session] stopped")
        },
        isProcessing() {
            return p
        }
    }
}
