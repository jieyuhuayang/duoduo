// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Svt, daemon.pretty.js:92035)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.10, v0.3.0, v0.3.2, v0.3.3, v0.3.4, v0.3.6, v0.3.7, v0.4.0, v0.4.2, v0.4.3, v0.4.4, v0.5.0, v0.5.4, v0.5.5, v0.5.6, v0.5.8, v0.5.10, v0.6.0, v0.7.0, v0.8.0, v0.8.1, v0.8.2, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 257 renamed — 72 from the code at the binding (rule), 185 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (high): That interface now lives on a socket file that carries owner-only permissions, so the operating system enforces what nothing was enforcing before.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(options) {
    let readOnlyApp = (0, ON.default)({
            logger: !1
        }),
        socketApp = (0, ON.default)({
            logger: !1
        }),
        remoteApp = null,
        allowedHostnames = new Set(["127.0.0.1", "localhost", "::1"]),
        sendRejection = (request, reply, statusCode, statusText, payload) => {
            if (String(request.headers.upgrade ?? "").toLowerCase() === "websocket") {
                reply.hijack();
                let socket = reply.raw.socket ?? request.raw.socket;
                socket && !socket.destroyed && (socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r
Connection: close\r
Content-Length: 0\r
\r
`), socket.destroy());
                return
            }
            return reply.code(statusCode).send(payload)
        },
        sendForbidden = (request, reply, reason) => sendRejection(request, reply, 403, "Forbidden", {
            error: "forbidden",
            reason
        }),
        sendUnauthorized = (request, reply) => sendRejection(request, reply, 401, "Unauthorized", {
            error: "unauthorized"
        }),
        {
            paths,
            bus
        } = options,
        jobStore = new Br(paths),
        sessionIndex = options.sessionIndex ?? createEmptySessionIndex();
    bce((sessionKey, changeKind) => {
        if (changeKind === "removed") {
            sessionIndex.remove(sessionKey);
            return
        }
        runWithSessionMutex(sessionKey, async () => {
            if (!isSessionArchiving(sessionKey)) try {
                let [runtimeState, meta] = await Promise.all([readSessionRuntimeState(paths, sessionKey), readSessionMetaFile(paths, sessionKey)]);
                replaceSessionIndexEntry(sessionIndex, sessionKey, runtimeState, meta)
            } catch {}
        }).catch(() => {})
    }), Rae(sessionKey => {
        sessionIndex.remove(sessionKey)
    });
    let runtimeInfo = {
            version: jbt(import.meta.url)("../../package.json").version,
            runtime_id: computeRuntimeId(paths.runtimeDir),
            runtime_mode: "host",
            runtime_dir: so.resolve(paths.runtimeDir),
            work_dir: so.resolve(paths.workDir),
            kernel_dir: so.resolve(paths.kernelDir)
        },
        subscriptions = options.subscriptions ?? createSessionSubscriptionRegistry();
    subscriptions.start(bus);
    let wsSubscriberCounter = 0,
        runtimeLockHeld = !1,
        lockHeartbeatTimer = null,
        map = new Map,
        map2 = new Map,
        traceLevelMethods = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function handleRpcRequest(request, rpcContext) {
        (traceLevelMethods.has(request.method) ? logTraceMessage : logDebugMessage)("[daemon] rpc request", {
            id: request.id ?? null,
            method: request.method,
            session_key: typeof request.params == "object" && request.params !== null ? request.params.session_key : void 0,
            ws: !!rpcContext?.wsSubscriberId
        });
        let response = {
                jsonrpc: "2.0",
                id: request.id ?? null
            },
            piWorkerContext;
        if (typeof request.params == "object" && request.params !== null && "worker_token" in request.params) {
            let {
                worker_token: workerToken,
                ...restParams
            } = request.params;
            if (piWorkerContext = iye(workerToken), !piWorkerContext) return logWarnMessage("[daemon] rejected pi worker RPC: unknown token", {
                method: request.method
            }), response.error = {
                code: -32001,
                message: "invalid pi worker token"
            }, response;
            if (!rye.has(request.method)) return logWarnMessage("[daemon] rejected pi worker RPC: method not whitelisted", {
                method: request.method,
                session_key: piWorkerContext.session_key
            }), response.error = {
                code: -32601,
                message: `Method not available to pi worker callers: ${request.method}`
            }, response;
            request.params = restParams
        }
        let gatewayCommands = {
            cancelSession: async sessionKey => {
                if (!options.sessionManager) return {
                    interrupted: !1,
                    reason: "session_manager_unavailable"
                };
                let interruptResult = await options.sessionManager.interruptSession(sessionKey);
                return {
                    interrupted: interruptResult.interrupted,
                    reason: interruptResult.reason
                }
            },
            clearSession: async sessionKey => options.sessionManager ? options.sessionManager.clearSdkSession(sessionKey) : {
                cleared: !1,
                reason: "session_manager_unavailable"
            },
            listActors: () => {
                if (!options.sessionManager) return new Map;
                let actors = options.sessionManager.listActors(),
                    map = new Map;
                for (let [actorKey, actor] of actors) map.set(actorKey, {
                    sessionKey: actor.sessionKey,
                    status: actor.status,
                    health: actor.health,
                    idleSince: actor.idleSince,
                    origin: actor.origin
                });
                return map
            },
            listPersistentSessions: () => sessionIndex.listUserVisible().map(entry => ({
                session_key: entry.session_key,
                cwd: entry.cwd,
                created_at: entry.created_at,
                last_event_at: entry.last_event_at,
                last_error: entry.last_error
            })),
            getSessionModel: async (sessionKey, viewOptions) => options.sessionManager ? options.sessionManager.getSessionModelView(sessionKey, viewOptions) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionModel: async (sessionKey, model, modelOptions) => options.sessionManager ? options.sessionManager.setSessionModel(sessionKey, model, modelOptions) : {
                ok: !1,
                reason: "not_running"
            },
            getSessionEffort: async (sessionKey, viewOptions) => options.sessionManager ? options.sessionManager.getSessionEffortView(sessionKey, viewOptions) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionEffort: async (sessionKey, effort) => options.sessionManager ? options.sessionManager.setSessionEffort(sessionKey, effort) : {
                ok: !1,
                reason: "not_running"
            }
        };
        try {
            if (request.method === "system.shutdown") response.result = {
                ok: !0
            }, response.__triggerShutdown = !0;
            else if (request.method === "system.runtime.info") {
                if (!isRuntimeInfoParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                if (!isSystemRuntimeInfo(runtimeInfo)) throw new Error("invalid runtime info");
                let runtimeInfoParams = request.params ?? {};
                if (runtimeInfoParams.source_kind) {
                    let channelDefaults = {
                        new_session_workspace: (await resolveEffectiveChannelConfig(paths, {
                            channel_kind: runtimeInfoParams.source_kind
                        }))?.new_session_workspace
                    };
                    response.result = {
                        ...runtimeInfo,
                        channel_defaults: channelDefaults
                    }
                } else response.result = runtimeInfo
            } else if (request.method === "channel.describe") {
                if (!isChannelDescribeParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await describeChannelInstance(paths, sessionIndex, params)
            } else if (request.method === "session.archive") {
                if (!isSessionArchiveParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await archiveSessionIfQuiescent(paths, options.sessionManager, sessionIndex, params)
            } else if (request.method === "session.list") {
                if (!isSessionListParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let listParams = request.params ?? {};
                response.result = await listSessionIndexSummaries(sessionIndex, jobStore, listParams, paths)
            } else if (request.method === "session.set_alias") {
                if (!isSessionSetAliasParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await setSessionAliasAndReindex(paths, sessionIndex, params)
            } else if (request.method === "session.notify") {
                if (!isSessionNotifyParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await deliverExternalSessionNotify(paths, bus, sessionIndex, params)
            } else if (request.method === "session.wake") {
                if (!isSessionWakeParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                response.result = await scheduleSessionWakeRecord(paths, sessionIndex, request.params)
            } else if (request.method === "job.manage" || request.method === "session.manage" || request.method === "notify.send" || request.method === "wake.set") {
                if (!piWorkerContext) return response.error = {
                    code: -32001,
                    message: `${request.method} requires a pi worker token`
                }, response;
                if (typeof request.params != "object" || request.params === null) throw new JsonRpcInvalidParamsError("Invalid params");
                if (request.method === "job.manage") {
                    let jobManageOutput = await runManageJobTool(request.params, {
                        paths,
                        sessionKey: piWorkerContext.session_key,
                        callerJobCron: piWorkerContext.job_cron,
                        callerRuntime: "pi",
                        bus
                    });
                    response.result = {
                        output: jobManageOutput
                    }
                } else if (request.method === "notify.send") {
                    let notifyOutput = await runNotifyTool(request.params, {
                        paths,
                        bus,
                        sessionKey: piWorkerContext.session_key,
                        sessionContextKind: piWorkerContext.session_context_kind,
                        jobScheduleType: piWorkerContext.job_schedule_type
                    });
                    notifyOutput.startsWith("Error:") || options.sessionManager?.markAgentNotified(piWorkerContext.session_key), response.result = {
                        output: notifyOutput
                    }
                } else if (request.method === "wake.set") {
                    let wakeOutput = await runRemindDuoduoTool(request.params, {
                        paths,
                        sessionKey: piWorkerContext.session_key,
                        sessionContextKind: piWorkerContext.session_context_kind
                    });
                    response.result = {
                        output: wakeOutput
                    }
                } else {
                    let viewSessionsOutput = await runViewSessionsTool(request.params, {
                        paths,
                        sessionKey: piWorkerContext.session_key,
                        getSessionStatus: sessionKey => options.sessionManager?.listActors().get(sessionKey)?.status
                    });
                    response.result = {
                        output: viewSessionsOutput
                    }
                }
            } else if (request.method === "session.model") {
                if (!isSessionModelParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await readOrSetSessionModel(sessionIndex, gatewayCommands, params)
            } else if (request.method === "session.effort") {
                if (!isSessionEffortParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await readOrSetSessionEffort(sessionIndex, gatewayCommands, params)
            } else if (request.method === "session.compact") {
                if (!isSessionCompactParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await enqueueSessionCompactCommand(paths, bus, sessionIndex, gatewayCommands, params)
            } else if (request.method === "session.config") {
                if (!isSessionConfigParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await applySessionConfigVerb(paths, sessionIndex, params)
            } else if (request.method === "channel.spawn") {
                if (!isChannelSpawnParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                response.result = await upsertChannelSpawnDescriptor(paths, sessionIndex, params)
            } else if (request.method === "channel.ingress") {
                if (!isChannelIngressParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                if (assertWsChannelIdentityParams("channel.ingress", params, rpcContext), isSessionArchiving(params.session_key)) return response.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${params.session_key}`
                }, response;
                let sourceKind = params.source_kind ?? (rpcContext?.wsSubscriberId ? "ws" : "rpc"),
                    ingressWorkspace = await resolveIngressWorkspace({
                        paths,
                        sessionKey: params.session_key,
                        cwdAbs: params.cwd_abs,
                        channelKind: sourceKind,
                        channelId: params.channel_id
                    });
                if (!ingressWorkspace.ok) return response.error = {
                    code: -32010,
                    message: ingressWorkspace.guidance
                }, response;
                await bindSessionSourceChannel(paths, params.session_key, params.channel_id);
                let ingestResult = await ingestChannelMessage(paths, {
                    sessionKey: params.session_key,
                    sourceKind,
                    sourceName: params.channel_id ?? rpcContext?.wsSubscriberId,
                    sourceChannelId: params.channel_id,
                    text: params.text ?? "",
                    attachments: params.attachments,
                    dedupSourceId: params.idempotency_key,
                    rawPayload: {
                        jsonrpc: request.jsonrpc,
                        method: request.method,
                        params: request.params
                    }
                }, {
                    bus,
                    gatewayCommands
                });
                logLatencyStageTelemetry("ingress_received", ingestResult.event.id, {
                    sessionKey: params.session_key
                }), ingestResult.routing.enqueued && bus.emit("session.wake", {
                    sessionKey: params.session_key,
                    displayName: params.display_name,
                    preempt: resolvePreemptFromCommandText(params.text)
                });
                let kindConfig = isBusinessSourceKind(sourceKind) ? ingressWorkspace.effectiveConfig?.kind_config : void 0,
                    ingressResult = {
                        event_id: ingestResult.event.id,
                        gateway_response: ingestResult.gatewayResponse,
                        outbox_id: ingestResult.gatewayOutboxId,
                        ...kindConfig ? {
                            kind_config: kindConfig
                        } : {}
                    };
                response.result = ingressResult
            } else if (request.method === "channel.command") {
                if (!isChannelCommandParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                if (assertWsChannelIdentityParams("channel.command", params, rpcContext), isSessionArchiving(params.session_key)) return response.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${params.session_key}`
                }, response;
                let sourceKind = params.source_kind ?? (rpcContext?.wsSubscriberId ? "ws" : "rpc"),
                    ingressWorkspace = await resolveIngressWorkspace({
                        paths,
                        sessionKey: params.session_key,
                        cwdAbs: params.cwd_abs,
                        channelKind: sourceKind,
                        channelId: params.channel_id
                    });
                if (!ingressWorkspace.ok) return response.error = {
                    code: -32010,
                    message: ingressWorkspace.guidance
                }, response;
                await bindSessionSourceChannel(paths, params.session_key, params.channel_id);
                let commandResult = await ingestChannelCommand(paths, {
                    sessionKey: params.session_key,
                    sourceKind,
                    sourceName: params.channel_id ?? rpcContext?.wsSubscriberId,
                    sourceChannelId: params.channel_id,
                    command: params.command,
                    dedupSourceId: params.idempotency_key,
                    rawPayload: {
                        jsonrpc: request.jsonrpc,
                        method: request.method,
                        params: request.params
                    }
                }, {
                    bus,
                    gatewayCommands
                });
                commandResult.routing.enqueued && bus.emit("session.wake", {
                    sessionKey: params.session_key,
                    preempt: resolvePreemptFromCommandText(params.command)
                }), response.result = {
                    event_id: commandResult.event.id,
                    gateway_response: commandResult.gatewayResponse,
                    outbox_id: commandResult.gatewayOutboxId
                }
            } else if (request.method === "channel.file.upload") {
                if (!isChannelFileUploadParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params,
                    uploadResult = await saveChannelUploadToInbox(paths, params.session_key, params.name, params.mime, params.content_base64, {
                        receivedVia: rpcContext?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: rpcContext?.wsSubscriberId
                    });
                response.result = uploadResult
            } else if (request.method === "channel.file.download") {
                if (!isChannelFileDownloadParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params,
                    fileAsBase64 = await readFileAsBase64(params.path);
                response.result = {
                    content_base64: fileAsBase64
                }
            } else if (request.method === "channel.pull") {
                if (!isChannelPullParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params,
                    trimmed = params.consumer_id.trim(),
                    returnMask = normalizeReturnMask(params.return_mask),
                    wantsFinal = returnMask.includes("final");
                if (rpcContext?.wsSubscriberId) return await recordChannelCapabilityDeclaration({
                    paths,
                    sessionKey: params.session_key,
                    declaredBy: trimmed,
                    capabilities: params.channel_capabilities
                }), response.result = {
                    opened: !0,
                    session_key: params.session_key,
                    consumer_id: trimmed,
                    cursor: params.cursor,
                    return_mask: returnMask
                }, response;
                let outboxRecords = wantsFinal ? await readOutboxRecordsPastCursor({
                    paths,
                    sessionKey: params.session_key,
                    consumerId: trimmed,
                    limit: params.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: params.cursor
                }) : [];
                response.result = {
                    session_key: params.session_key,
                    consumer_id: trimmed,
                    return_mask: returnMask,
                    records: outboxRecords,
                    next_cursor: outboxRecords.length > 0 ? outboxRecords[outboxRecords.length - 1].id : void 0,
                    idle: outboxRecords.length === 0
                }
            } else if (request.method === "channel.ack") {
                if (!isChannelAckParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                if (isSessionArchiving(params.session_key)) return response.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${params.session_key}`
                }, response;
                let trimmed = params.consumer_id.trim(),
                    trimmed2 = params.cursor.trim(),
                    colonIndex = params.session_key.indexOf(":"),
                    channelKind = colonIndex > 0 ? params.session_key.slice(0, colonIndex) : null,
                    outboxRecord = null;
                if (channelKind && (outboxRecord = await readOutboxRecord(paths, channelKind, trimmed2)), !outboxRecord || outboxRecord.session_key !== params.session_key) {
                    let fallbackCursorRecord = await $ce(paths, params.session_key, trimmed2);
                    return fallbackCursorRecord ? (await L6(paths, params.session_key, trimmed, fallbackCursorRecord), response.result = {
                        session_key: params.session_key,
                        consumer_id: trimmed,
                        committed_cursor: fallbackCursorRecord.id,
                        committed: !0
                    }, response) : (response.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, response)
                }
                let outboxByIdIndexEntry = await lookupOutboxByIdIndexEntry(paths, trimmed2);
                if (!outboxByIdIndexEntry) try {
                    await backfillOutboxByIdIndexFromReplay(paths, params.session_key), outboxByIdIndexEntry = await lookupOutboxByIdIndexEntry(paths, trimmed2)
                } catch {}
                outboxByIdIndexEntry ? await Fbe(paths, params.session_key, trimmed, outboxByIdIndexEntry) : await L6(paths, params.session_key, trimmed, outboxRecord), response.result = {
                    session_key: params.session_key,
                    consumer_id: trimmed,
                    committed_cursor: outboxRecord.id,
                    committed: !0
                }
            } else if (request.method === "job.create") {
                if (!isJobCreateParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                await jobStore.init(), await jobStore.createJob(params.id, {
                    cron: params.cron,
                    owner_session: params.owner_session,
                    cwd_rel: params.cwd_rel,
                    runtime: resolveDefaultRuntime()
                }, params.instruction);
                let spineEvent = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: params.id
                    },
                    payload: {
                        job_id: params.id,
                        cron: params.cron
                    }
                });
                await atomicAppendEvent(paths, spineEvent), response.result = {
                    id: params.id,
                    cron: params.cron
                }
            } else if (request.method === "job.get") {
                if (!isJobGetParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                await jobStore.init();
                let wakeRecord = await jobStore.getWakeRecord(params.id).catch(() => null);
                if (wakeRecord) return response.result = {
                    kind: "active",
                    type: "wake",
                    id: wakeRecord.id,
                    owner_session: wakeRecord.frontmatter.owner_session,
                    run_at: wakeRecord.state.run_at ?? null,
                    created_at: wakeRecord.frontmatter.created_at,
                    content: wakeRecord.context
                }, response;
                let jobClassification = await jobStore.classifyActiveJob(params.id);
                if (jobClassification.kind === "active") response.result = {
                    ...redactJobModelProfileTokens(jobClassification.job),
                    kind: "active"
                };
                else if (jobClassification.kind === "invalid") response.error = {
                    code: jm.INVALID_ACTIVE,
                    message: `Job '${params.id}' active job file exists but is invalid: ${jobClassification.reason}`
                };
                else {
                    let archivedJob = await jobStore.getArchivedJob(params.id);
                    archivedJob ? response.result = {
                        ...redactJobModelProfileTokens(archivedJob),
                        kind: "archived",
                        archived: !0
                    } : response.error = {
                        code: jm.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (request.method === "job.list") {
                if (!isJobListParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                await jobStore.init();
                let jobs = ibe(await jobStore.listJobs()).map(job => ({
                        type: "job",
                        ...job
                    })),
                    wakes = (await jobStore.listWakeRecords()).map(wakeRecord => ({
                        type: "wake",
                        id: wakeRecord.id,
                        owner_session: wakeRecord.frontmatter.owner_session,
                        run_at: wakeRecord.state.run_at ?? null,
                        created_at: wakeRecord.frontmatter.created_at,
                        content: wakeRecord.context
                    }));
                request.params?.summary ? response.result = {
                    jobs: [...jobs.map(({
                        content,
                        path,
                        ...jobSummary
                    }) => jobSummary), ...wakes]
                } : response.result = {
                    jobs: [...jobs, ...wakes]
                }
            } else if (request.method === "job.archive") {
                if (!isJobArchiveParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params;
                await jobStore.init();
                let job = await jobStore.getJob(params.id),
                    archiveResult = await jobStore.archiveJob(params.id),
                    jobSessionKey = job?.session_key ?? buildJobSessionKey({
                        jobId: params.id,
                        cron: job?.frontmatter.cron,
                        cwdRel: job?.frontmatter.cwd_rel
                    });
                await moveSessionDirToArchive(paths, jobSessionKey), response.result = {
                    id: params.id,
                    archived: !0,
                    session_key: jobSessionKey,
                    sidecar_orphan_path: archiveResult.sidecarOrphanPath ?? null
                }
            } else if (request.method === "job.reschedule") {
                if (!isJobRescheduleParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params,
                    trimmed = params.when.trim();
                if (!trimmed) throw new JsonRpcInvalidParamsError("job.reschedule requires a non-empty 'when': '@in <duration>' (e.g. '@in 30m') or a future ISO 8601 timestamp with an explicit zone.");
                await jobStore.init();
                let job = await jobStore.getJob(params.id),
                    runAt = await jobStore.rescheduleJob(params.id, trimmed);
                response.result = {
                    id: params.id,
                    run_at: runAt,
                    cron: job?.frontmatter.cron ?? null
                }
            } else if (request.method === "job.interrupt") {
                if (!isJobInterruptParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let params = request.params,
                    trimmed = params.reason.trim();
                if (!trimmed) throw new JsonRpcInvalidParamsError("job.interrupt requires a non-empty 'reason' — it is what the interrupted session is told.");
                await jobStore.init();
                let job = await jobStore.getJob(params.id) ?? await jobStore.getArchivedJob(params.id);
                if (!job) response.error = {
                    code: jm.NOT_FOUND,
                    message: `Job '${params.id}' not found`
                };
                else if (!options.sessionManager) response.error = {
                    code: -32603,
                    message: "Internal error",
                    data: "session manager unavailable"
                };
                else {
                    await patchSessionRuntimeState(paths, job.session_key, {
                        pending_gateway_notice: {
                            source: "gateway_command",
                            command: `job interrupt ${params.id}`,
                            command_name: "interrupt",
                            result_summary: trimmed,
                            created_at: new Date().toISOString()
                        }
                    });
                    let interruptResult = await options.sessionManager.interruptSession(job.session_key);
                    interruptResult.interrupted || await clearSessionRuntimeStateField(paths, job.session_key, "pending_gateway_notice").catch(() => {}), response.result = {
                        id: params.id,
                        session_key: job.session_key,
                        interrupted: interruptResult.interrupted,
                        outcome: interruptResult.reason
                    }
                }
            } else if (request.method === "usage.get") {
                let params = request.params,
                    usageSessionKey = typeof params?.session_key == "string" ? params.session_key : void 0,
                    mode = typeof params?.mode == "string" ? params.mode : void 0,
                    since;
                if (params?.since !== void 0 && (since = new Date(params.since), isNaN(since.getTime()) && (since = void 0)), mode === "totals") {
                    let globalUsageTotals = await readGlobalUsageTotals(paths, since);
                    response.result = {
                        totals: globalUsageTotals
                    }
                } else if (usageSessionKey) {
                    let drainRecords = await readDrainRecords(paths, usageSessionKey, since),
                        summary = summarizeDrainRecords(drainRecords);
                    response.result = {
                        sessions: {
                            [usageSessionKey]: {
                                summary,
                                records: drainRecords
                            }
                        }
                    }
                } else {
                    let allSessionSummaries = await readAllSessionSummaries(paths, since),
                        sessions = {};
                    for (let [sessionKey, sessionSummary] of Object.entries(allSessionSummaries)) sessions[sessionKey] = {
                        summary: sessionSummary
                    };
                    response.result = {
                        sessions
                    }
                }
            } else if (request.method === "system.status") {
                if (!isSystemStatusParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let [status, playlistRound] = await Promise.all([readStatus(paths), readPlaylistRound(paths)]), cadenceIntervalMs = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, actors = options.sessionManager?.listActors(), seenSessionKeys = new Set, sessions = [], describeModel = entry => {
                    let servedModel = entry?.last_served_model ?? null,
                        pendingModel = entry?.model ?? null;
                    return {
                        served: servedModel,
                        pending: pendingModel !== null && pendingModel !== servedModel ? pendingModel : null
                    }
                }, readDeliveryInfo = async sessionKey => classifySessionKeyKind(sessionKey) !== "channel" ? {} : {
                    last_cursor_advance_at: await readLatestDeliveryCursorUpdate(paths, sessionKey),
                    final_subscriber_count: subscriptions.finalSubscriberCount(sessionKey)
                };
                if (actors)
                    for (let [sessionKey, actor] of actors) {
                        if (actor.status === "ended" || !isUserVisibleSessionKey(sessionKey)) continue;
                        seenSessionKeys.add(sessionKey);
                        let indexEntry = sessionIndex.get(sessionKey);
                        sessions.push({
                            session_key: sessionKey,
                            display_name: indexEntry?.display_name ?? null,
                            status: actor.status,
                            health: indexEntry?.last_error ? "error" : actor.health,
                            last_event_at: indexEntry?.last_event_at ?? null,
                            created_at: indexEntry?.created_at ?? null,
                            cwd: indexEntry?.cwd ?? null,
                            last_error: indexEntry?.last_error ?? null,
                            runtime: actor.runtime,
                            model: describeModel(indexEntry),
                            in_flight_tools: actor.activeToolCalls.length > 0 ? actor.activeToolCalls.map(toolCall => ({
                                tool_name: toolCall.toolName,
                                started_at: new Date(toolCall.startedAtMs).toISOString()
                            })) : void 0,
                            ...await readDeliveryInfo(sessionKey)
                        })
                    }
                for (let indexEntry of sessionIndex.listUserVisible()) seenSessionKeys.has(indexEntry.session_key) || sessions.push({
                    session_key: indexEntry.session_key,
                    display_name: indexEntry.display_name ?? null,
                    status: "idle",
                    health: indexEntry.last_error ? "error" : "ok",
                    last_event_at: indexEntry.last_event_at ?? null,
                    created_at: indexEntry.created_at ?? null,
                    cwd: indexEntry.cwd ?? null,
                    last_error: indexEntry.last_error ?? null,
                    model: describeModel(indexEntry),
                    ...await readDeliveryInfo(indexEntry.session_key)
                });
                let statusResult = {
                    health: {
                        gateway: status?.health?.gateway ?? "down",
                        meta_session: status?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: status?.cadence?.mode ?? "unknown",
                        last_tick: status?.cadence?.last_tick ?? null,
                        interval_ms: cadenceIntervalMs
                    },
                    sessions,
                    subconscious: {
                        partitions: playlistRound.items.map(partition => ({
                            name: partition.name,
                            done: partition.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(paths)
                };
                response.result = statusResult
            } else if (request.method === "system.config") {
                if (!isSystemConfigParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                response.result = await buildSystemConfigReport(paths)
            } else if (request.method === "spine.tail") {
                if (!isSpineTailParams(request.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let tailParams = request.params ?? {},
                    spineTail = await readSpineTail(paths, {
                        limit: tailParams.limit,
                        after_id: tailParams.after_id
                    });
                response.result = spineTail
            } else request.method === "memory.read" ? response.result = await readMemoryFileForRpc(paths, request.params) : request.method === "spine.cat" ? response.result = await runSpineCatRpc(paths, request.params) : request.method === "spine.record" ? response.result = await recordExternalSpineEvent(paths, request.params) : response.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (err) {
            err instanceof JsonRpcInvalidParamsError ? response.error = {
                code: err.code,
                message: err.message
            } : err instanceof MemoryReadRpcError || err instanceof SpineRpcParamsError ? response.error = {
                code: -32602,
                message: err.message
            } : err instanceof xb ? response.error = {
                code: -32603,
                message: err.message
            } : response.error = {
                code: -32603,
                message: "Internal error",
                data: String(err)
            }
        }
        return response
    }
    let registerRoutes = (app, {
        hostGuard,
        readOnly,
        bearerToken
    }) => {
        if (bearerToken) {
            let sha256 = value => AN.createHash("sha256").update(value).digest(),
                expectedTokenHash = sha256(bearerToken);
            app.addHook("onRequest", async (request, reply) => {
                let authorization = request.headers.authorization,
                    presentedToken = typeof authorization == "string" && authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
                if (!presentedToken) return logWarnMessage("[daemon] rejected request: missing/invalid bearer", {
                    url: request.url
                }), sendUnauthorized(request, reply);
                if (!AN.timingSafeEqual(sha256(presentedToken), expectedTokenHash)) return logWarnMessage("[daemon] rejected request: bearer mismatch", {
                    url: request.url
                }), sendUnauthorized(request, reply)
            })
        }
        hostGuard && app.addHook("onRequest", async (request, reply) => {
            let url = request.routeOptions.url;
            if (url !== void 0 && Ubt.has(url)) return;
            let requestUrl = request.url ?? "",
                host = request.headers.host,
                hostname = host ? parseHostHeaderHostname(host) : null;
            if (!hostname || !allowedHostnames.has(hostname)) return logWarnMessage("[daemon] rejected request: Host header not allowed", {
                url: requestUrl,
                host: host ?? null
            }), sendForbidden(request, reply, "Host header not allowed");
            let origin = request.headers.origin;
            if (origin !== void 0) {
                let originHostname = parseOriginHostname(origin);
                if (!originHostname || !allowedHostnames.has(originHostname)) return logWarnMessage("[daemon] rejected request: Origin not allowed", {
                    url: requestUrl,
                    origin
                }), sendForbidden(request, reply, "Origin not allowed")
            }
        }), readOnly ? app.get("/ws", async (request, reply) => (logWarnMessage("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: request.ip,
            user_agent: request.headers["user-agent"] ?? null
        }), reply.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: paths.daemonSocketPath
        }))) : app.register(vIe.default), app.get("/healthz", async () => bde()), app.get("/dashboard", async (request, reply) => {
            let dashboardPath = so.join(paths.bootstrapDir, "dashboard.html");
            try {
                let content = await zs.readFile(dashboardPath, "utf8");
                return reply.type("text/html").send(content)
            } catch {
                return reply.code(404).send("Dashboard not found")
            }
        }), app.get("/readyz", async (request, reply) => await probeEventsAppendable(paths) ? {
            status: "ok"
        } : reply.code(503).send({
            status: "not_ready"
        })), app.post("/rpc", async (request, reply) => {
            let body = request.body;
            if (!isJsonRpcRequest(body)) return logWarnMessage("[daemon] invalid JSON-RPC request"), reply.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if (readOnly && !zbt.has(body.method)) return logWarnMessage("[daemon] rejected write method on read-only port", {
                method: body.method,
                id: body.id ?? null
            }), reply.code(200).send({
                jsonrpc: "2.0",
                id: body.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let response = await handleRpcRequest(body),
                TriggerShutdown = response.__triggerShutdown;
            TriggerShutdown && delete response.__triggerShutdown, await reply.code(200).send(response), TriggerShutdown && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), readOnly || app.register(async function(wsScope) {
            wsScope.get("/ws", {
                websocket: !0
            }, ws => {
                let subscriberId = `ws_${++wsSubscriberCounter}`,
                    subscribedSessionKey = null,
                    consumerId = "",
                    ackAdvance = !1,
                    sentRecordIds = null;
                logInfoMessage("[daemon] ws connected", {
                    subscriberId
                });
                let sendMessage = (message, advanceCursor = !0) => {
                        let recordId = message.method === "session.output" ? message.params?.record?.id : void 0;
                        if (!(sentRecordIds && recordId && sentRecordIds.has(recordId))) {
                            try {
                                ws.send(JSON.stringify(message))
                            } catch (err) {
                                throw err instanceof Error ? err : new Error(String(err))
                            }
                            if (sentRecordIds && recordId && sentRecordIds.add(recordId), advanceCursor && !ackAdvance && message.method === "session.output") {
                                let {
                                    session_key: sessionKey,
                                    record
                                } = message.params;
                                if (!consumerId) return;
                                let cursorConsumerId = consumerId,
                                    cursorUpdate = (map.get(subscriberId) ?? Promise.resolve()).then(() => advanceOptimisticDeliveryCursor(paths, sessionKey, cursorConsumerId, record).catch(err => {
                                        logWarnMessage("[daemon] failed to advance delivery cursor", {
                                            subscriberId,
                                            sessionKey,
                                            consumerId: cursorConsumerId,
                                            error: String(err)
                                        })
                                    }));
                                map.set(subscriberId, cursorUpdate), cursorUpdate.then(() => {
                                    map.get(subscriberId) === cursorUpdate && map.delete(subscriberId)
                                })
                            }
                        }
                    },
                    handleWsMessage = async data => {
                        let request;
                        try {
                            request = JSON.parse(data.toString())
                        } catch {
                            ws.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32700,
                                    message: "Parse error"
                                }
                            }));
                            return
                        }
                        if (!isJsonRpcRequest(request)) {
                            ws.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32600,
                                    message: "Invalid Request"
                                }
                            }));
                            return
                        }
                        let response = await handleRpcRequest(request, {
                                wsSubscriberId: subscriberId
                            }),
                            pullSessionKey = null,
                            pullConsumerId = "",
                            pullCursor;
                        if (request.method === "channel.pull" && response.result && !response.error && isChannelPullParams(request.params)) {
                            let params = request.params,
                                sessionKey = params.session_key,
                                trimmed = params.consumer_id.trim(),
                                returnMask = normalizeReturnMask(params.return_mask);
                            subscribedSessionKey && subscriptions.unsubscribe(subscriberId), subscribedSessionKey = sessionKey, consumerId = trimmed, ackAdvance = params.advance === "ack", pullSessionKey = sessionKey, pullConsumerId = trimmed, pullCursor = params.cursor, logInfoMessage("[daemon] ws pull stream opened", {
                                subscriberId,
                                sessionKey,
                                consumerId: trimmed
                            }), sentRecordIds = new Set, subscriptions.subscribe({
                                id: subscriberId,
                                sessionKey,
                                returnMask,
                                acceptStreamEndReasons: params.channel_capabilities?.outbound?.accept_stream_end_reasons,
                                send: message => sendMessage(message),
                                close: () => {
                                    try {
                                        ws.close()
                                    } catch {}
                                }
                            })
                        }
                        if (pullSessionKey) {
                            let pullParams = isChannelPullParams(request.params) ? request.params : void 0;
                            if (!normalizeReturnMask(pullParams?.return_mask).includes("final")) {
                                sentRecordIds = null, ws.send(JSON.stringify(response));
                                return
                            }
                            let replaySessionKey = pullSessionKey,
                                ackMode = pullParams?.advance === "ack",
                                replayLimitRaw = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                                replayLimit = Number.isFinite(replayLimitRaw) ? replayLimitRaw : 0;
                            try {
                                let replayedCount = await replayOutboxBacklogToSubscriber({
                                    paths,
                                    sessionKey: replaySessionKey,
                                    consumerId: pullConsumerId,
                                    limit: replayLimit,
                                    cursorOverride: pullCursor,
                                    send: message => sendMessage(message, !1),
                                    onDelivered: async deliveredRecord => {
                                        ackMode || await advanceOptimisticDeliveryCursor(paths, replaySessionKey, pullConsumerId, deliveredRecord);
                                        let outboxRecord = await readOutboxRecord(paths, deliveredRecord.channel_kind, deliveredRecord.id);
                                        outboxRecord && outboxRecord.status !== "sent" && await recordOutboxDeliveryAttempt(paths, outboxRecord, {
                                            status: "sent"
                                        }), await recordOutboxSentId(paths, deliveredRecord.id)
                                    }
                                });
                                replayedCount > 0 && logDebugMessage("[daemon] replayed outbox backlog", {
                                    subscriberId,
                                    sessionKey: replaySessionKey,
                                    consumerId: pullConsumerId,
                                    replayed: replayedCount
                                })
                            } catch (err) {
                                logWarnMessage("[daemon] backlog replay failed", {
                                    subscriberId,
                                    sessionKey: replaySessionKey,
                                    consumerId: pullConsumerId,
                                    error: String(err)
                                })
                            }
                            sentRecordIds = null
                        }
                        let TriggerShutdown = response.__triggerShutdown;
                        TriggerShutdown && delete response.__triggerShutdown, ws.send(JSON.stringify(response)), TriggerShutdown && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                    };
                ws.on("message", data => {
                    let handled = handleWsMessage(data).catch(err => {
                            logWarnMessage("[daemon] ws message handler failed", {
                                subscriberId,
                                error: String(err)
                            })
                        }),
                        previous = map2.get(subscriberId) ?? Promise.resolve(),
                        queued = Promise.all([previous, handled]).then(() => {});
                    map2.set(subscriberId, queued), queued.then(() => {
                        map2.get(subscriberId) === queued && map2.delete(subscriberId)
                    })
                });
                let unsubscribe = () => {
                    subscribedSessionKey && subscriptions.unsubscribe(subscriberId)
                };
                ws.on("close", () => {
                    unsubscribe(), logInfoMessage("[daemon] ws closed", {
                        subscriberId,
                        sessionKey: subscribedSessionKey
                    })
                }), ws.on("error", () => {
                    unsubscribe(), logWarnMessage("[daemon] ws error", {
                        subscriberId,
                        sessionKey: subscribedSessionKey
                    })
                })
            })
        })
    };
    registerRoutes(readOnlyApp, {
        hostGuard: !0,
        readOnly: !0
    }), registerRoutes(socketApp, {
        hostGuard: !1,
        readOnly: !1
    });
    let daemonSocketPath = paths.daemonSocketPath;
    return {
        app: readOnlyApp,
        socketApp,
        get remoteApp() {
            return remoteApp
        },
        bus,
        subscriptions,
        async start(port) {
            let remoteListenerConfig = resolveRemoteListenerConfig(process.env, port);
            if (!options.runtimeLockAlreadyHeld) {
                let runtimeWriterLock = await acquireRuntimeWriterLock(paths);
                if (!runtimeWriterLock.acquired) throw new Error(`Runtime lock already held by pid=${runtimeWriterLock.lock?.pid??"unknown"} at ${runtimeWriterLock.lockPath}`)
            }
            runtimeLockHeld = !0;
            let socketListening = !1;
            try {
                let socketPathBytes = Buffer.byteLength(daemonSocketPath);
                if (socketPathBytes > 104) throw new Error(`daemon socket path is too long (${socketPathBytes} bytes > 104-byte unix-socket limit): ${daemonSocketPath}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let socketDir = so.dirname(daemonSocketPath),
                    socketDirStat;
                try {
                    socketDirStat = await zs.stat(socketDir)
                } catch (err) {
                    throw new Error(`daemon socket directory is not accessible: ${socketDir} (${String(err)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let uid = process.getuid?.(),
                    dirMode = socketDirStat.mode & 511;
                if (dirMode !== 448 || uid !== void 0 && socketDirStat.uid !== uid) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${dirMode.toString(8)}, uid ${socketDirStat.uid}): ${socketDir}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
                let existingStat = null;
                try {
                    existingStat = await zs.lstat(daemonSocketPath)
                } catch {
                    existingStat = null
                }
                if (existingStat)
                    if (existingStat.isSocket()) await zs.unlink(daemonSocketPath);
                    else throw new Error(`daemon socket path is occupied by a non-socket file: ${daemonSocketPath}. Refusing to delete it — check ALADUO_DAEMON_SOCKET.`);
                await socketApp.listen({
                    path: daemonSocketPath
                }), socketListening = !0, await zs.chmod(daemonSocketPath, 384), await readOnlyApp.listen({
                    port,
                    host: "127.0.0.1"
                }), remoteListenerConfig.enabled && (remoteApp = (0, ON.default)({
                    logger: !1
                }), registerRoutes(remoteApp, {
                    hostGuard: !1,
                    readOnly: !1,
                    bearerToken: remoteListenerConfig.token
                }), await remoteApp.listen({
                    port: remoteListenerConfig.port,
                    host: remoteListenerConfig.host
                }), logAlwaysAtLevel("info", `[daemon] remote full-access listener on ${remoteListenerConfig.host}:${remoteListenerConfig.port} (bearer-gated)`))
            } catch (err) {
                throw await readOnlyApp.close().catch(() => {}), await socketApp.close().catch(() => {}), remoteApp && (await remoteApp.close().catch(() => {}), remoteApp = null), socketListening && await zs.unlink(daemonSocketPath).catch(() => {}), runtimeLockHeld && (await releaseRuntimeWriterLock(paths), runtimeLockHeld = !1), err
            }
            let envIntegerOrFallback = readEnvIntegerOrFallback("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            lockHeartbeatTimer = setInterval(() => {
                refreshRuntimeWriterLockHeartbeat(paths).catch(() => {})
            }, envIntegerOrFallback), lockHeartbeatTimer.unref?.()
        },
        async stop() {
            subscriptions.stop();
            let closePromises = [readOnlyApp.close(), socketApp.close()];
            remoteApp && closePromises.push(remoteApp.close()), await Promise.all(closePromises), remoteApp = null, await Promise.allSettled(map2.values()), await Promise.allSettled(map.values()), await zs.unlink(daemonSocketPath).catch(() => {}), lockHeartbeatTimer && (clearInterval(lockHeartbeatTimer), lockHeartbeatTimer = null), runtimeLockHeld && (await releaseRuntimeWriterLock(paths), runtimeLockHeld = !1)
        }
    }
}
