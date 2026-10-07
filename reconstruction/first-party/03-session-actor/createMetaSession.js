// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: Pbt, daemon.pretty.js:86170)
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
        thinkingLevel: A
    }) => {
        let $ = CS(),
            {
                settingsSeed: C,
                defaultProjectTrust: N
            } = OS($),
            x = _bt(Sy.join(vbt(), "aladuo-pi-partition-")),
            M = {
                session_context_kind: "system"
            },
            F = createPiWorkerAdapter({
                cwd: S,
                sdkSessionId: crypto.randomUUID(),
                sessionDir: x,
                agentDir: $,
                authPath: Sy.join($, "auth.json"),
                modelsPath: Sy.join($, "models.json"),
                modelsStorePath: Sy.join(x, "models-store.json"),
                settingsSeed: C,
                resources: {
                    extensions: "all",
                    skills: "all",
                    default_project_trust: N
                },
                model: D,
                thinkingLevel: A,
                inMemorySession: !0,
                workerCommand: resolvePiWorkerCommand(),
                env: {
                    [nC]: t.daemonSocketPath,
                    [rC]: oC({
                        session_key: o,
                        ...M
                    }),
                    [iC]: JSON.stringify(M)
                },
                logDebug: J => ke(J, {
                    sessionKey: o
                })
            });
        return {
            ...F,
            shutdown: async () => {
                try {
                    await F.shutdown()
                } finally {
                    bbt(x, {
                        recursive: !0,
                        force: !0
                    })
                }
            }
        }
    }), d = e.maxPartitionsPerIdleTick ?? 2, f = e.cadenceIntervalMs ?? zg, p = !1, m = !1, h = null, g = !1, y = null, v = 0, b = new Map;
    async function _(S, D, A) {
        let $ = await Promise.all(S.map(async N => [N.name, await readPartitionRunState(t, N.name)])),
            C = new Map($);
        for (;;) {
            let N = await readPlaylistRound(t);
            if (N.allDone) {
                if (await rebuildPlaylistRound(t) === 0) return null;
                N = await readPlaylistRound(t)
            }
            let x = R(N.items, S, A, C, new Date);
            if (!x) return null;
            let M = S.find(ie => ie.name === x.name);
            if (!M || !M.schedule.enabled) {
                let ie = N.items.filter(j => !j.done).length;
                await markPlaylistItemExecuted(t, x.name);
                let se = (await readPlaylistRound(t)).items.filter(j => !j.done).length;
                if (se >= ie) return Z("[meta-session] stale playlist item did not advance", {
                    name: x.name,
                    reason: M ? "disabled" : "removed",
                    beforeUnchecked: ie,
                    afterUnchecked: se
                }), null;
                ke("[meta-session] skipping unavailable partition, will retry next", {
                    name: x.name,
                    reason: M ? "disabled" : "removed"
                });
                continue
            }
            let F = await E(M, D, A),
                ce = (await Promise.all(S.map(async ie => [ie.name, await readPartitionRunState(t, ie.name)]))).filter(([, ie]) => isPartitionBackedOff(ie, new Date)).map(([ie]) => ie);
            return {
                ...F,
                backedOff: ce
            }
        }
    }
    async function E(S, D, A) {
        let $ = Date.now(),
            C, N, x = 0,
            M = 0,
            F = S.runtime,
            J = F ?? resolveDefaultRuntime();
        ee("[v12-observe] partition runtime selected", {
            partition: S.name,
            runtime: J,
            requestedRuntime: F ?? null,
            sdkInjected: !!i
        });
        let ce, ie, Ce, se, j = async (ve, je = "runtime_unavailable") => {
            let sn = Date.now() - $,
                gt = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: je,
                        runtime: J,
                        runtime_source: F ? "explicit" : "default",
                        error: je === "runtime_refused" ? ve : `runtime '${J}' is unavailable: ${ve}`
                    }
                });
            await atomicAppendEvent(t, gt), await advanceConsumerWatermark(t, "meta_session", gt.id, new Date(gt.ts)), Z("[meta-session] partition skipped: requested runtime unavailable", {
                partition: S.name,
                runtime: J,
                requestedFrom: F ? "frontmatter" : "default",
                reason: ve
            }), await markPlaylistItemExecuted(t, S.name), b.set(S.name, A);
            let Gt = await readPartitionRunState(t, S.name),
                Nn = new Date,
                Us = {
                    last_started_at: new Date($).toISOString(),
                    last_finished_at: Nn.toISOString(),
                    last_result: "error",
                    consecutive_failures: Gt.consecutive_failures + 1,
                    backoff_until: computePartitionBackoffUntil("error", Gt.consecutive_failures + 1, Nn, f)
                };
            return await writePartitionRunState(t, S.name, Us), {
                name: S.name,
                outcome: "error",
                durationMs: sn,
                backedOff: []
            }
        };
        if (S.runtimeRefusal) return await j(S.runtimeRefusal, "runtime_refused");
        let ne = claudeUnavailableReason();
        if (J === "claude" && !i && ne) return await j(ne);
        let K = nu(await li(t.channelConfigDir)),
            te = S.model ?? K.runtimeModels?.[J]?.model,
            B = S.effort ?? K.runtimeEfforts?.[J]?.effort;
        if (i && J === "claude") ce = i;
        else if (J === "codex") {
            let ve = await s();
            if (ee("[v12-observe] codex probe result", {
                    partition: S.name,
                    probeOk: ve.ok,
                    probeReason: ve.ok ? null : ve.reason
                }), !ve.ok) return await j(ve.reason);
            ee("[v12-observe] codex adapter spawn", {
                partition: S.name,
                sandbox: resolveCodexSandbox()
            });
            let je = a();
            ce = je, ie = () => je.shutdown()
        } else if (J === "grok") {
            let ve = await u();
            if (ee("[v12-observe] grok probe result", {
                    partition: S.name,
                    probeOk: ve.ok,
                    probeReason: ve.ok ? null : ve.reason
                }), !ve.ok) return await j(ve.reason);
            ee("[v12-observe] grok adapter spawn", {
                partition: S.name
            });
            let je = l ? l() : createGrokAcpAdapter({
                cwd: S.dir,
                mcpServerFactory: () => createAladuoMcpServer(t, {
                    sessionKey: o,
                    bus: n,
                    sessionContextKind: "meta",
                    callerRuntime: J
                })
            });
            ce = je, Ce = () => je.shutdown()
        } else if (J === "pi") {
            if (!te) return await j("pi partition has no model: set `model: provider/modelId` in the partition CLAUDE.md frontmatter, or `pi.model` in the global runtime config");
            ee("[v12-observe] pi adapter spawn", {
                partition: S.name
            });
            let ve = c({
                cwd: S.dir,
                model: te,
                thinkingLevel: B
            });
            ce = ve, se = () => ve.shutdown()
        } else ce = createAgentSdkAdapter();
        let G = [],
            H = !1,
            q = partitionInboxDir(t, S.name),
            pe = await readPartitionInboxEntries(t, S.name),
            fe = renderPartitionInboxSection(q, pe),
            Se = `### Partition
- Name: ${S.name}
- cwd: ${S.dir}/
- Inbox: ${q}/
- runtime: ${J}
`,
            w = fe ? `${S.promptContent}

${Se}
${D}

${fe}` : `${S.promptContent}

${Se}
${D}`,
            T = createAladuoMcpServer(t, {
                sessionKey: o,
                bus: n,
                sessionContextKind: "meta",
                callerRuntime: J
            }),
            L = [...new Set([...PARTITION_CORE_TOOLS, ...S.claudeTools ?? []])],
            z = new AbortController;
        ee("[meta-session] executing partition", {
            partition: S.name
        });
        let U = J === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: S.prompt_mode ?? "append"
            }, o, void 0, void 0, J) : void 0,
            Y = Math.max(1, S.schedule.max_duration_ms),
            me, re = new Error(`partition timeout: ${S.name} exceeded ${Y}ms`),
            Ee;
        try {
            let ve = await fA(t, {
                    runtime: J,
                    model: te,
                    cwd: S.dir,
                    effective: null
                }),
                je = ce.run({
                    prompt: J === "pi" ? w : stringToMessageGenerator(w),
                    cwd: S.dir,
                    model: J === "claude" ? ve.effectiveModel ?? te : J === "pi" ? void 0 : te,
                    effort: J === "pi" ? void 0 : B,
                    claudeContextRequirement: ve.requirement,
                    claudeModelAliases: ve.aliases,
                    claudeSettingsPath: ve.settingsPath,
                    settingSources: ["user", "project"],
                    persistSession: !1,
                    mcpServers: {
                        aladuo: T
                    },
                    holdInputOpenForBackgroundAgents: !0,
                    additionalDirectories: [t.memoryDir],
                    autoloadAdditionalDirectoryClaudeMd: !1,
                    tools: L,
                    systemPrompt: U,
                    abortController: z,
                    onStream: (gt, Gt) => {
                        H || n.emit("session.stream", {
                            sessionKey: o,
                            chunk: gt,
                            isSidechain: Gt
                        })
                    },
                    onExecutionEvent: gt => {
                        H || (gt.type === "tool_use" ? x += 1 : gt.type === "tool_result" && gt.isError && (M += 1), G.push(appendPartitionToolEvent(t, o, S.name, gt).catch(Gt => {
                            Z("[meta-session] failed to persist execution event", {
                                partition: S.name,
                                eventType: gt.type,
                                error: Gt instanceof Error ? Gt.message : String(Gt)
                            })
                        })))
                    }
                }),
                sn = new Promise((gt, Gt) => {
                    Ee = setTimeout(() => {
                        je.catch(Nn => {
                            Z("[meta-session] late sdk completion after timeout", {
                                partition: S.name,
                                error: Nn instanceof Error ? Nn.message : String(Nn)
                            })
                        }), Gt(re)
                    }, Y)
                });
            N = await Promise.race([je, sn])
        } catch (ve) {
            H = !0, ve === re ? (C = "timeout", z.abort()) : (C = "error", me = ve instanceof Error ? ve.message : String(ve))
        } finally {
            Ee && clearTimeout(Ee)
        }
        if (!C) {
            let ve = normalizePartitionOutputText(N?.text);
            C = detectEmptyRequiredPartitionOutput(S.name, ve) ? "invalid_output" : "success"
        }
        let Oe = Date.now() - $;
        if (ie) {
            ee("[v12-observe] codex adapter shutdown", {
                partition: S.name,
                outcome: C,
                durationMs: Oe
            });
            try {
                await ie()
            } catch (ve) {
                Z("[meta-session] codex adapter shutdown threw", {
                    partition: S.name,
                    error: ve instanceof Error ? ve.message : String(ve)
                })
            }
        }
        if (Ce) {
            ee("[v12-observe] grok adapter shutdown", {
                partition: S.name,
                outcome: C,
                durationMs: Oe
            });
            try {
                await Ce()
            } catch (ve) {
                Z("[meta-session] grok adapter shutdown threw", {
                    partition: S.name,
                    error: ve instanceof Error ? ve.message : String(ve)
                })
            }
        }
        if (se) {
            ee("[v12-observe] pi adapter shutdown", {
                partition: S.name,
                outcome: C,
                durationMs: Oe
            });
            try {
                await se()
            } catch (ve) {
                Z("[meta-session] pi adapter shutdown threw", {
                    partition: S.name,
                    error: ve instanceof Error ? ve.message : String(ve)
                })
            }
        }
        let Xe = N?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${o}:${S.name}`,
                sdk_session_id: N?.sessionId,
                drain_started_at: new Date($).toISOString(),
                drain_duration_ms: Oe,
                sdk_duration_ms: Oe,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: x,
                tool_errors: M,
                output_chars: N?.text?.length ?? 0,
                cancelled: C === "timeout",
                usage: Xe
            }).catch(() => {}), G.length > 0 && await Promise.all(G), C === "success") {
            let ve = normalizePartitionOutputText(N?.text),
                je = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        text: ve,
                        tick_type: "subconscious",
                        partition: S.name,
                        runtime: J,
                        runtime_source: F ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, je), await advanceConsumerWatermark(t, "meta_session", je.id, new Date(je.ts)), ee("[meta-session] partition completed", {
                partition: S.name,
                runtime: J,
                eventId: je.id
            })
        } else {
            let ve = C === "timeout" ? `partition timeout: ${S.name} exceeded ${Y}ms` : C === "invalid_output" ? `invalid output from ${S.name}` : `partition error: ${S.name}${me?`: ${me}`:""}`,
                je = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: C,
                        error: ve,
                        output_preview: N?.text?.slice(0, 400),
                        runtime: J,
                        runtime_source: F ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, je), await advanceConsumerWatermark(t, "meta_session", je.id, new Date(je.ts)), Z("[meta-session] partition settled with non-success outcome", {
                partition: S.name,
                runtime: J,
                outcome: C,
                error: ve
            })
        }
        await markPlaylistItemExecuted(t, S.name), b.set(S.name, A);
        let nt = await readPartitionRunState(t, S.name),
            Ze = C === "success" ? 0 : nt.consecutive_failures + 1,
            qe = new Date,
            Ae = {
                last_started_at: new Date($).toISOString(),
                last_finished_at: qe.toISOString(),
                last_result: C,
                consecutive_failures: Ze,
                backoff_until: computePartitionBackoffUntil(C, Ze, qe, f)
            };
        return await writePartitionRunState(t, S.name, Ae), {
            name: S.name,
            outcome: C,
            durationMs: Oe,
            backedOff: []
        }
    }

    function R(S, D, A, $, C) {
        for (let N of S) {
            if (N.done) continue;
            let x = D.find(ce => ce.name === N.name);
            if (!x || !x.schedule.enabled) return N;
            let M = $.get(N.name);
            if (M && isPartitionBackedOff(M, C)) continue;
            let F = Math.max(0, x.schedule.cooldown_ticks),
                J = b.get(N.name);
            if (J === void 0 || A - J >= F) return N
        }
        return null
    }
    let P = async () => {
        if (p || m) {
            ke("[meta-session] skipping tick", {
                processing: p,
                stopRequested: m
            });
            return
        }
        p = !0, ee("[meta-session] starting tick");
        try {
            v += 1;
            let [S, D, A, $] = await Promise.all([readNewestMtimeRecursive(t.memoryFragmentsDir), readNewestMtimeRecursive(t.memoryEntitiesDir), readNewestMtimeRecursive(t.memoryTopicsDir), readLatestExternalEventId(t)]), C = [S, D, A, $].join(":"), N = hashActivityFingerprint(C);
            if (y !== null && N === y) {
                ke("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), p = !1;
                return
            }
            y = N, await updateRegistryStatus(t, J => ({
                ...J,
                health: {
                    ...J.health,
                    meta_session: "starting"
                }
            }));
            let x = await loadSubconsciousPartitions(t),
                M = await renderPartitionRuntimeContext(t, r),
                F = await _(x, M, v);
            if (F?.name && d > 1 && (!r || r.activeCount() <= 1))
                for (let ce = 1; ce < d && await _(x, M, v); ce++);
            await updateRegistryStatus(t, J => ({
                ...J,
                health: {
                    ...J.health,
                    meta_session: "ok"
                }
            })), ee("[meta-session] tick completed", {
                executed: F?.name ?? null,
                outcome: F?.outcome ?? null,
                durationMs: F?.durationMs ?? null,
                backedOff: F?.backedOff ?? []
            })
        } catch (S) {
            Ue("[meta-session] tick error:", S), y = null, await updateRegistryStatus(t, A => ({
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
    }, k = () => {
        if (p || m) {
            P();
            return
        }
        let S = P();
        h = S;
        let D = () => {
            h === S && (h = null)
        };
        S.then(D, D)
    };
    return {
        start() {
            m || g || (n.on("cadence.tick", k), g = !0, updateRegistryStatus(t, S => ({
                ...S,
                health: {
                    ...S.health,
                    meta_session: "starting"
                }
            })), vt("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (m = !0, g && (n.off("cadence.tick", k), g = !1), h) try {
                await h
            } catch {}
            vt("info", "[meta-session] stopped")
        },
        isProcessing() {
            return p
        }
    }
}
