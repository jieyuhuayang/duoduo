// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: Pbt, daemon.pretty.js:86170)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.3.1, v0.3.3, v0.5.0, v0.5.2, v0.5.3, v0.5.4, v0.5.7, v0.5.8, v0.5.10, v0.7.1, v0.8.0, v0.8.1, v0.8.4 (maps/history_daemon.json)
// locals: 154 renamed — 44 from the code at the binding (rule), 110 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMetaSession(options) {
    let {
        paths,
        bus,
        sessionManager
    } = options, sdk = options.sdk, sessionKey = options.sessionKey ?? "meta:subconscious", codexAvailability = options.codexAvailability ?? checkCodexAvailability, codexAdapterFactory = options.codexAdapterFactory ?? (() => createCodexAppServerAdapter({
        sandbox: resolveCodexSandbox(),
        ephemeral: !0,
        dynamicTools: buildCodexDynamicTools({
            paths,
            sessionKey,
            bus,
            sessionContextKind: "meta"
        })
    })), grokAvailability = options.grokAvailability ?? checkGrokAvailability, grokAdapterFactory = options.grokAdapterFactory, piAdapterFactory = options.piAdapterFactory ?? (({
        cwd,
        model,
        thinkingLevel
    }) => {
        let piAgentDir = resolvePiAgentDir(),
            {
                settingsSeed,
                defaultProjectTrust
            } = readPiAgentSettings(piAgentDir),
            piSessionDir = _bt(Sy.join(vbt(), "aladuo-pi-partition-")),
            workerToolContext = {
                session_context_kind: "system"
            },
            piWorkerAdapter = createPiWorkerAdapter({
                cwd,
                sdkSessionId: crypto.randomUUID(),
                sessionDir: piSessionDir,
                agentDir: piAgentDir,
                authPath: Sy.join(piAgentDir, "auth.json"),
                modelsPath: Sy.join(piAgentDir, "models.json"),
                modelsStorePath: Sy.join(piSessionDir, "models-store.json"),
                settingsSeed,
                resources: {
                    extensions: "all",
                    skills: "all",
                    default_project_trust: defaultProjectTrust
                },
                model,
                thinkingLevel,
                inMemorySession: !0,
                workerCommand: resolvePiWorkerCommand(),
                env: {
                    [nC]: paths.daemonSocketPath,
                    [rC]: issueWorkerToolContextToken({
                        session_key: sessionKey,
                        ...workerToolContext
                    }),
                    [iC]: JSON.stringify(workerToolContext)
                },
                logDebug: message => logDebugMessage(message, {
                    sessionKey
                })
            });
        return {
            ...piWorkerAdapter,
            shutdown: async () => {
                try {
                    await piWorkerAdapter.shutdown()
                } finally {
                    bbt(piSessionDir, {
                        recursive: !0,
                        force: !0
                    })
                }
            }
        }
    }), maxPartitionsPerIdleTick = options.maxPartitionsPerIdleTick ?? 2, cadenceIntervalMs = options.cadenceIntervalMs ?? zg, processing = !1, stopRequested = !1, inFlightTick = null, listening = !1, lastActivityFingerprint = null, tickCount = 0, map = new Map;
    async function runNextPartition(partitions, runtimeContext, currentTick) {
        let runStateEntries = await Promise.all(partitions.map(async partition => [partition.name, await readPartitionRunState(paths, partition.name)])),
            map = new Map(runStateEntries);
        for (;;) {
            let playlistRound = await readPlaylistRound(paths);
            if (playlistRound.allDone) {
                if (await rebuildPlaylistRound(paths) === 0) return null;
                playlistRound = await readPlaylistRound(paths)
            }
            let nextItem = pickNextPlaylistItem(playlistRound.items, partitions, currentTick, map, new Date);
            if (!nextItem) return null;
            let nextPartition = partitions.find(candidate => candidate.name === nextItem.name);
            if (!nextPartition || !nextPartition.schedule.enabled) {
                let length = playlistRound.items.filter(item => !item.done).length;
                await markPlaylistItemExecuted(paths, nextItem.name);
                let length2 = (await readPlaylistRound(paths)).items.filter(item => !item.done).length;
                if (length2 >= length) return logWarnMessage("[meta-session] stale playlist item did not advance", {
                    name: nextItem.name,
                    reason: nextPartition ? "disabled" : "removed",
                    beforeUnchecked: length,
                    afterUnchecked: length2
                }), null;
                logDebugMessage("[meta-session] skipping unavailable partition, will retry next", {
                    name: nextItem.name,
                    reason: nextPartition ? "disabled" : "removed"
                });
                continue
            }
            let executionResult = await executePartition(nextPartition, runtimeContext, currentTick),
                backedOffNames = (await Promise.all(partitions.map(async partition => [partition.name, await readPartitionRunState(paths, partition.name)]))).filter(([, runState]) => isPartitionBackedOff(runState, new Date)).map(([name]) => name);
            return {
                ...executionResult,
                backedOff: backedOffNames
            }
        }
    }
    async function executePartition(partition, runtimeContext, currentTick) {
        let now = Date.now(),
            outcome, runResult, toolCalls = 0,
            toolErrors = 0,
            runtime = partition.runtime,
            effectiveRuntime = runtime ?? resolveDefaultRuntime();
        logInfoMessage("[v12-observe] partition runtime selected", {
            partition: partition.name,
            runtime: effectiveRuntime,
            requestedRuntime: runtime ?? null,
            sdkInjected: !!sdk
        });
        let adapter, shutdownCodex, shutdownGrok, shutdownPi, skipUnavailable = async (reason, skipOutcome = "runtime_unavailable") => {
            let durationMs = Date.now() - now,
                spineEvent = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${partition.name}`
                    },
                    session_key: sessionKey,
                    payload: {
                        stage: "partition_execution",
                        partition: partition.name,
                        outcome: skipOutcome,
                        runtime: effectiveRuntime,
                        runtime_source: runtime ? "explicit" : "default",
                        error: skipOutcome === "runtime_refused" ? reason : `runtime '${effectiveRuntime}' is unavailable: ${reason}`
                    }
                });
            await atomicAppendEvent(paths, spineEvent), await advanceConsumerWatermark(paths, "meta_session", spineEvent.id, new Date(spineEvent.ts)), logWarnMessage("[meta-session] partition skipped: requested runtime unavailable", {
                partition: partition.name,
                runtime: effectiveRuntime,
                requestedFrom: runtime ? "frontmatter" : "default",
                reason
            }), await markPlaylistItemExecuted(paths, partition.name), map.set(partition.name, currentTick);
            let partitionRunState = await readPartitionRunState(paths, partition.name),
                date = new Date,
                nextRunState = {
                    last_started_at: new Date(now).toISOString(),
                    last_finished_at: date.toISOString(),
                    last_result: "error",
                    consecutive_failures: partitionRunState.consecutive_failures + 1,
                    backoff_until: computePartitionBackoffUntil("error", partitionRunState.consecutive_failures + 1, date, cadenceIntervalMs)
                };
            return await writePartitionRunState(paths, partition.name, nextRunState), {
                name: partition.name,
                outcome: "error",
                durationMs,
                backedOff: []
            }
        };
        if (partition.runtimeRefusal) return await skipUnavailable(partition.runtimeRefusal, "runtime_refused");
        let claudeUnavailable = claudeUnavailableReason();
        if (effectiveRuntime === "claude" && !sdk && claudeUnavailable) return await skipUnavailable(claudeUnavailable);
        let globalModelConfigLayers = mergeGlobalModelConfigLayers(await loadGlobalRuntimeConfig(paths.channelConfigDir)),
            model = partition.model ?? globalModelConfigLayers.runtimeModels?.[effectiveRuntime]?.model,
            effort = partition.effort ?? globalModelConfigLayers.runtimeEfforts?.[effectiveRuntime]?.effort;
        if (sdk && effectiveRuntime === "claude") adapter = sdk;
        else if (effectiveRuntime === "codex") {
            let codexProbe = await codexAvailability();
            if (logInfoMessage("[v12-observe] codex probe result", {
                    partition: partition.name,
                    probeOk: codexProbe.ok,
                    probeReason: codexProbe.ok ? null : codexProbe.reason
                }), !codexProbe.ok) return await skipUnavailable(codexProbe.reason);
            logInfoMessage("[v12-observe] codex adapter spawn", {
                partition: partition.name,
                sandbox: resolveCodexSandbox()
            });
            let codexAdapter = codexAdapterFactory();
            adapter = codexAdapter, shutdownCodex = () => codexAdapter.shutdown()
        } else if (effectiveRuntime === "grok") {
            let grokProbe = await grokAvailability();
            if (logInfoMessage("[v12-observe] grok probe result", {
                    partition: partition.name,
                    probeOk: grokProbe.ok,
                    probeReason: grokProbe.ok ? null : grokProbe.reason
                }), !grokProbe.ok) return await skipUnavailable(grokProbe.reason);
            logInfoMessage("[v12-observe] grok adapter spawn", {
                partition: partition.name
            });
            let grokAdapter = grokAdapterFactory ? grokAdapterFactory() : createGrokAcpAdapter({
                cwd: partition.dir,
                mcpServerFactory: () => createAladuoMcpServer(paths, {
                    sessionKey,
                    bus,
                    sessionContextKind: "meta",
                    callerRuntime: effectiveRuntime
                })
            });
            adapter = grokAdapter, shutdownGrok = () => grokAdapter.shutdown()
        } else if (effectiveRuntime === "pi") {
            if (!model) return await skipUnavailable("pi partition has no model: set `model: provider/modelId` in the partition CLAUDE.md frontmatter, or `pi.model` in the global runtime config");
            logInfoMessage("[v12-observe] pi adapter spawn", {
                partition: partition.name
            });
            let piAdapter = piAdapterFactory({
                cwd: partition.dir,
                model,
                thinkingLevel: effort
            });
            adapter = piAdapter, shutdownPi = () => piAdapter.shutdown()
        } else adapter = createAgentSdkAdapter();
        let pendingToolEventWrites = [],
            settled = !1,
            inboxDir = partitionInboxDir(paths, partition.name),
            partitionInboxEntries = await readPartitionInboxEntries(paths, partition.name),
            partitionInboxSection = renderPartitionInboxSection(inboxDir, partitionInboxEntries),
            partitionSection = `### Partition
- Name: ${partition.name}
- cwd: ${partition.dir}/
- Inbox: ${inboxDir}/
- runtime: ${effectiveRuntime}
`,
            prompt = partitionInboxSection ? `${partition.promptContent}

${partitionSection}
${runtimeContext}

${partitionInboxSection}` : `${partition.promptContent}

${partitionSection}
${runtimeContext}`,
            aladuoMcpServer = createAladuoMcpServer(paths, {
                sessionKey,
                bus,
                sessionContextKind: "meta",
                callerRuntime: effectiveRuntime
            }),
            tools = [...new Set([...PARTITION_CORE_TOOLS, ...partition.claudeTools ?? []])],
            abortController = new AbortController;
        logInfoMessage("[meta-session] executing partition", {
            partition: partition.name
        });
        let systemPrompt = effectiveRuntime === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: partition.prompt_mode ?? "append"
            }, sessionKey, void 0, void 0, effectiveRuntime) : void 0,
            maxDurationMs = Math.max(1, partition.schedule.max_duration_ms),
            errorMessage, error = new Error(`partition timeout: ${partition.name} exceeded ${maxDurationMs}ms`),
            timeoutHandle;
        try {
            let claudeContextProfile = await prepareClaudeContextProfile(paths, {
                    runtime: effectiveRuntime,
                    model,
                    cwd: partition.dir,
                    effective: null
                }),
                runPromise = adapter.run({
                    prompt: effectiveRuntime === "pi" ? prompt : stringToMessageGenerator(prompt),
                    cwd: partition.dir,
                    model: effectiveRuntime === "claude" ? claudeContextProfile.effectiveModel ?? model : effectiveRuntime === "pi" ? void 0 : model,
                    effort: effectiveRuntime === "pi" ? void 0 : effort,
                    claudeContextRequirement: claudeContextProfile.requirement,
                    claudeModelAliases: claudeContextProfile.aliases,
                    claudeSettingsPath: claudeContextProfile.settingsPath,
                    settingSources: ["user", "project"],
                    persistSession: !1,
                    mcpServers: {
                        aladuo: aladuoMcpServer
                    },
                    holdInputOpenForBackgroundAgents: !0,
                    additionalDirectories: [paths.memoryDir],
                    autoloadAdditionalDirectoryClaudeMd: !1,
                    tools,
                    systemPrompt,
                    abortController,
                    onStream: (chunk, isSidechain) => {
                        settled || bus.emit("session.stream", {
                            sessionKey,
                            chunk,
                            isSidechain
                        })
                    },
                    onExecutionEvent: executionEvent => {
                        settled || (executionEvent.type === "tool_use" ? toolCalls += 1 : executionEvent.type === "tool_result" && executionEvent.isError && (toolErrors += 1), pendingToolEventWrites.push(appendPartitionToolEvent(paths, sessionKey, partition.name, executionEvent).catch(err => {
                            logWarnMessage("[meta-session] failed to persist execution event", {
                                partition: partition.name,
                                eventType: executionEvent.type,
                                error: err instanceof Error ? err.message : String(err)
                            })
                        })))
                    }
                }),
                promise = new Promise((resolve, reject) => {
                    timeoutHandle = setTimeout(() => {
                        runPromise.catch(err => {
                            logWarnMessage("[meta-session] late sdk completion after timeout", {
                                partition: partition.name,
                                error: err instanceof Error ? err.message : String(err)
                            })
                        }), reject(error)
                    }, maxDurationMs)
                });
            runResult = await Promise.race([runPromise, promise])
        } catch (err) {
            settled = !0, err === error ? (outcome = "timeout", abortController.abort()) : (outcome = "error", errorMessage = err instanceof Error ? err.message : String(err))
        } finally {
            timeoutHandle && clearTimeout(timeoutHandle)
        }
        if (!outcome) {
            let partitionOutputText = normalizePartitionOutputText(runResult?.text);
            outcome = detectEmptyRequiredPartitionOutput(partition.name, partitionOutputText) ? "invalid_output" : "success"
        }
        let durationMs = Date.now() - now;
        if (shutdownCodex) {
            logInfoMessage("[v12-observe] codex adapter shutdown", {
                partition: partition.name,
                outcome,
                durationMs
            });
            try {
                await shutdownCodex()
            } catch (err) {
                logWarnMessage("[meta-session] codex adapter shutdown threw", {
                    partition: partition.name,
                    error: err instanceof Error ? err.message : String(err)
                })
            }
        }
        if (shutdownGrok) {
            logInfoMessage("[v12-observe] grok adapter shutdown", {
                partition: partition.name,
                outcome,
                durationMs
            });
            try {
                await shutdownGrok()
            } catch (err) {
                logWarnMessage("[meta-session] grok adapter shutdown threw", {
                    partition: partition.name,
                    error: err instanceof Error ? err.message : String(err)
                })
            }
        }
        if (shutdownPi) {
            logInfoMessage("[v12-observe] pi adapter shutdown", {
                partition: partition.name,
                outcome,
                durationMs
            });
            try {
                await shutdownPi()
            } catch (err) {
                logWarnMessage("[meta-session] pi adapter shutdown threw", {
                    partition: partition.name,
                    error: err instanceof Error ? err.message : String(err)
                })
            }
        }
        let usage = runResult?.usage;
        if (appendDrainRecord(paths, {
                id: crypto.randomUUID(),
                session_key: `${sessionKey}:${partition.name}`,
                sdk_session_id: runResult?.sessionId,
                drain_started_at: new Date(now).toISOString(),
                drain_duration_ms: durationMs,
                sdk_duration_ms: durationMs,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: toolCalls,
                tool_errors: toolErrors,
                output_chars: runResult?.text?.length ?? 0,
                cancelled: outcome === "timeout",
                usage
            }).catch(() => {}), pendingToolEventWrites.length > 0 && await Promise.all(pendingToolEventWrites), outcome === "success") {
            let partitionOutputText = normalizePartitionOutputText(runResult?.text),
                spineEvent = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${partition.name}`
                    },
                    session_key: sessionKey,
                    payload: {
                        text: partitionOutputText,
                        tick_type: "subconscious",
                        partition: partition.name,
                        runtime: effectiveRuntime,
                        runtime_source: runtime ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(paths, spineEvent), await advanceConsumerWatermark(paths, "meta_session", spineEvent.id, new Date(spineEvent.ts)), logInfoMessage("[meta-session] partition completed", {
                partition: partition.name,
                runtime: effectiveRuntime,
                eventId: spineEvent.id
            })
        } else {
            let errorText = outcome === "timeout" ? `partition timeout: ${partition.name} exceeded ${maxDurationMs}ms` : outcome === "invalid_output" ? `invalid output from ${partition.name}` : `partition error: ${partition.name}${errorMessage?`: ${errorMessage}`:""}`,
                spineEvent = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${partition.name}`
                    },
                    session_key: sessionKey,
                    payload: {
                        stage: "partition_execution",
                        partition: partition.name,
                        outcome,
                        error: errorText,
                        output_preview: runResult?.text?.slice(0, 400),
                        runtime: effectiveRuntime,
                        runtime_source: runtime ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(paths, spineEvent), await advanceConsumerWatermark(paths, "meta_session", spineEvent.id, new Date(spineEvent.ts)), logWarnMessage("[meta-session] partition settled with non-success outcome", {
                partition: partition.name,
                runtime: effectiveRuntime,
                outcome,
                error: errorText
            })
        }
        await markPlaylistItemExecuted(paths, partition.name), map.set(partition.name, currentTick);
        let partitionRunState = await readPartitionRunState(paths, partition.name),
            consecutiveFailures = outcome === "success" ? 0 : partitionRunState.consecutive_failures + 1,
            date = new Date,
            nextRunState = {
                last_started_at: new Date(now).toISOString(),
                last_finished_at: date.toISOString(),
                last_result: outcome,
                consecutive_failures: consecutiveFailures,
                backoff_until: computePartitionBackoffUntil(outcome, consecutiveFailures, date, cadenceIntervalMs)
            };
        return await writePartitionRunState(paths, partition.name, nextRunState), {
            name: partition.name,
            outcome,
            durationMs,
            backedOff: []
        }
    }

    function pickNextPlaylistItem(items, partitions, currentTick, runStates, now) {
        for (let item of items) {
            if (item.done) continue;
            let partition = partitions.find(candidate => candidate.name === item.name);
            if (!partition || !partition.schedule.enabled) return item;
            let runState = runStates.get(item.name);
            if (runState && isPartitionBackedOff(runState, now)) continue;
            let cooldownTicks = Math.max(0, partition.schedule.cooldown_ticks),
                lastRunTick = map.get(item.name);
            if (lastRunTick === void 0 || currentTick - lastRunTick >= cooldownTicks) return item
        }
        return null
    }
    let runTick = async () => {
        if (processing || stopRequested) {
            logDebugMessage("[meta-session] skipping tick", {
                processing,
                stopRequested
            });
            return
        }
        processing = !0, logInfoMessage("[meta-session] starting tick");
        try {
            tickCount += 1;
            let [fragmentsMtime, entitiesMtime, topicsMtime, latestExternalEventId] = await Promise.all([readNewestMtimeRecursive(paths.memoryFragmentsDir), readNewestMtimeRecursive(paths.memoryEntitiesDir), readNewestMtimeRecursive(paths.memoryTopicsDir), readLatestExternalEventId(paths)]), fingerprintSource = [fragmentsMtime, entitiesMtime, topicsMtime, latestExternalEventId].join(":"), fingerprint = hashActivityFingerprint(fingerprintSource);
            if (lastActivityFingerprint !== null && fingerprint === lastActivityFingerprint) {
                logDebugMessage("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), processing = !1;
                return
            }
            lastActivityFingerprint = fingerprint, await updateStatus(paths, status => ({
                ...status,
                health: {
                    ...status.health,
                    meta_session: "starting"
                }
            }));
            let subconsciousPartitions = await loadSubconsciousPartitions(paths),
                partitionRuntimeContext = await renderPartitionRuntimeContext(paths, sessionManager),
                firstResult = await runNextPartition(subconsciousPartitions, partitionRuntimeContext, tickCount);
            if (firstResult?.name && maxPartitionsPerIdleTick > 1 && (!sessionManager || sessionManager.activeCount() <= 1))
                for (let i = 1; i < maxPartitionsPerIdleTick && await runNextPartition(subconsciousPartitions, partitionRuntimeContext, tickCount); i++);
            await updateStatus(paths, status => ({
                ...status,
                health: {
                    ...status.health,
                    meta_session: "ok"
                }
            })), logInfoMessage("[meta-session] tick completed", {
                executed: firstResult?.name ?? null,
                outcome: firstResult?.outcome ?? null,
                durationMs: firstResult?.durationMs ?? null,
                backedOff: firstResult?.backedOff ?? []
            })
        } catch (err) {
            logErrorMessage("[meta-session] tick error:", err), lastActivityFingerprint = null, await updateStatus(paths, status => ({
                ...status,
                health: {
                    ...status.health,
                    meta_session: "down"
                }
            }));
            let spineEvent = createSpineEvent({
                type: "agent.error",
                source: {
                    kind: "meta",
                    name: "meta-session"
                },
                session_key: sessionKey,
                payload: {
                    stage: "tick",
                    error: err instanceof Error ? err.message : String(err)
                }
            });
            await atomicAppendEvent(paths, spineEvent), await advanceConsumerWatermark(paths, "meta_session", spineEvent.id, new Date(spineEvent.ts))
        } finally {
            processing = !1
        }
    }, onCadenceTick = () => {
        if (processing || stopRequested) {
            runTick();
            return
        }
        let tickPromise = runTick();
        inFlightTick = tickPromise;
        let clearInFlight = () => {
            inFlightTick === tickPromise && (inFlightTick = null)
        };
        tickPromise.then(clearInFlight, clearInFlight)
    };
    return {
        start() {
            stopRequested || listening || (bus.on("cadence.tick", onCadenceTick), listening = !0, updateStatus(paths, status => ({
                ...status,
                health: {
                    ...status.health,
                    meta_session: "starting"
                }
            })), logAlwaysAtLevel("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (stopRequested = !0, listening && (bus.off("cadence.tick", onCadenceTick), listening = !1), inFlightTick) try {
                await inFlightTick
            } catch {}
            logAlwaysAtLevel("info", "[meta-session] stopped")
        },
        isProcessing() {
            return processing
        }
    }
}
