// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Svt, daemon.pretty.js:92035)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, ON.default)({
            logger: !1
        }),
        n = (0, ON.default)({
            logger: !1
        }),
        r = null,
        i = new Set(["127.0.0.1", "localhost", "::1"]),
        o = (S, D, A, $, C) => {
            if (String(S.headers.upgrade ?? "").toLowerCase() === "websocket") {
                D.hijack();
                let x = D.raw.socket ?? S.raw.socket;
                x && !x.destroyed && (x.write(`HTTP/1.1 ${A} ${$}\r
Connection: close\r
Content-Length: 0\r
\r
`), x.destroy());
                return
            }
            return D.code(A).send(C)
        },
        s = (S, D, A) => o(S, D, 403, "Forbidden", {
            error: "forbidden",
            reason: A
        }),
        a = (S, D) => o(S, D, 401, "Unauthorized", {
            error: "unauthorized"
        }),
        {
            paths: u,
            bus: l
        } = e,
        c = new Br(u),
        d = e.sessionIndex ?? createEmptySessionIndex();
    bce((S, D) => {
        if (D === "removed") {
            d.remove(S);
            return
        }
        runWithSessionMutex(S, async () => {
            if (!isSessionArchiving(S)) try {
                let [A, $] = await Promise.all([readSessionRuntimeState(u, S), readSessionMetaFile(u, S)]);
                lq(d, S, A, $)
            } catch {}
        }).catch(() => {})
    }), Rae(S => {
        d.remove(S)
    });
    let m = {
            version: jbt(import.meta.url)("../../package.json").version,
            runtime_id: Xbt(u.runtimeDir),
            runtime_mode: "host",
            runtime_dir: so.resolve(u.runtimeDir),
            work_dir: so.resolve(u.workDir),
            kernel_dir: so.resolve(u.kernelDir)
        },
        h = e.subscriptions ?? createSessionSubscriptionRegistry();
    h.start(l);
    let g = 0,
        y = !1,
        v = null,
        b = new Map,
        _ = new Map,
        E = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function R(S, D) {
        (E.has(S.method) ? _ae : logDebugMessage)("[daemon] rpc request", {
            id: S.id ?? null,
            method: S.method,
            session_key: typeof S.params == "object" && S.params !== null ? S.params.session_key : void 0,
            ws: !!D?.wsSubscriberId
        });
        let $ = {
                jsonrpc: "2.0",
                id: S.id ?? null
            },
            C;
        if (typeof S.params == "object" && S.params !== null && "worker_token" in S.params) {
            let {
                worker_token: x,
                ...M
            } = S.params;
            if (C = iye(x), !C) return logWarnMessage("[daemon] rejected pi worker RPC: unknown token", {
                method: S.method
            }), $.error = {
                code: -32001,
                message: "invalid pi worker token"
            }, $;
            if (!rye.has(S.method)) return logWarnMessage("[daemon] rejected pi worker RPC: method not whitelisted", {
                method: S.method,
                session_key: C.session_key
            }), $.error = {
                code: -32601,
                message: `Method not available to pi worker callers: ${S.method}`
            }, $;
            S.params = M
        }
        let N = {
            cancelSession: async x => {
                if (!e.sessionManager) return {
                    interrupted: !1,
                    reason: "session_manager_unavailable"
                };
                let M = await e.sessionManager.interruptSession(x);
                return {
                    interrupted: M.interrupted,
                    reason: M.reason
                }
            },
            clearSession: async x => e.sessionManager ? e.sessionManager.clearSdkSession(x) : {
                cleared: !1,
                reason: "session_manager_unavailable"
            },
            listActors: () => {
                if (!e.sessionManager) return new Map;
                let x = e.sessionManager.listActors(),
                    M = new Map;
                for (let [F, J] of x) M.set(F, {
                    sessionKey: J.sessionKey,
                    status: J.status,
                    health: J.health,
                    idleSince: J.idleSince,
                    origin: J.origin
                });
                return M
            },
            listPersistentSessions: () => d.listUserVisible().map(x => ({
                session_key: x.session_key,
                cwd: x.cwd,
                created_at: x.created_at,
                last_event_at: x.last_event_at,
                last_error: x.last_error
            })),
            getSessionModel: async (x, M) => e.sessionManager ? e.sessionManager.getSessionModelView(x, M) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionModel: async (x, M, F) => e.sessionManager ? e.sessionManager.setSessionModel(x, M, F) : {
                ok: !1,
                reason: "not_running"
            },
            getSessionEffort: async (x, M) => e.sessionManager ? e.sessionManager.getSessionEffortView(x, M) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionEffort: async (x, M) => e.sessionManager ? e.sessionManager.setSessionEffort(x, M) : {
                ok: !1,
                reason: "not_running"
            }
        };
        try {
            if (S.method === "system.shutdown") $.result = {
                ok: !0
            }, $.__triggerShutdown = !0;
            else if (S.method === "system.runtime.info") {
                if (!isRuntimeInfoParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                if (!isSystemRuntimeInfo(m)) throw new Error("invalid runtime info");
                let x = S.params ?? {};
                if (x.source_kind) {
                    let F = {
                        new_session_workspace: (await resolveEffectiveChannelConfig(u, {
                            channel_kind: x.source_kind
                        }))?.new_session_workspace
                    };
                    $.result = {
                        ...m,
                        channel_defaults: F
                    }
                } else $.result = m
            } else if (S.method === "channel.describe") {
                if (!isChannelDescribeParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await describeChannelInstance(u, d, x)
            } else if (S.method === "session.archive") {
                if (!isSessionArchiveParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await archiveSessionIfQuiescent(u, e.sessionManager, d, x)
            } else if (S.method === "session.list") {
                if (!isSessionListParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params ?? {};
                $.result = await listSessionIndexSummaries(d, c, x, u)
            } else if (S.method === "session.set_alias") {
                if (!isSessionSetAliasParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await setSessionAliasAndReindex(u, d, x)
            } else if (S.method === "session.notify") {
                if (!isSessionNotifyParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await deliverExternalSessionNotify(u, l, d, x)
            } else if (S.method === "session.wake") {
                if (!isSessionWakeParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                $.result = await scheduleSessionWakeRecord(u, d, S.params)
            } else if (S.method === "job.manage" || S.method === "session.manage" || S.method === "notify.send" || S.method === "wake.set") {
                if (!C) return $.error = {
                    code: -32001,
                    message: `${S.method} requires a pi worker token`
                }, $;
                if (typeof S.params != "object" || S.params === null) throw new JsonRpcInvalidParamsError("Invalid params");
                if (S.method === "job.manage") {
                    let x = await runManageJobTool(S.params, {
                        paths: u,
                        sessionKey: C.session_key,
                        callerJobCron: C.job_cron,
                        callerRuntime: "pi",
                        bus: l
                    });
                    $.result = {
                        output: x
                    }
                } else if (S.method === "notify.send") {
                    let x = await runNotifyTool(S.params, {
                        paths: u,
                        bus: l,
                        sessionKey: C.session_key,
                        sessionContextKind: C.session_context_kind,
                        jobScheduleType: C.job_schedule_type
                    });
                    x.startsWith("Error:") || e.sessionManager?.markAgentNotified(C.session_key), $.result = {
                        output: x
                    }
                } else if (S.method === "wake.set") {
                    let x = await runRemindDuoduoTool(S.params, {
                        paths: u,
                        sessionKey: C.session_key,
                        sessionContextKind: C.session_context_kind
                    });
                    $.result = {
                        output: x
                    }
                } else {
                    let x = await runViewSessionsTool(S.params, {
                        paths: u,
                        sessionKey: C.session_key,
                        getSessionStatus: M => e.sessionManager?.listActors().get(M)?.status
                    });
                    $.result = {
                        output: x
                    }
                }
            } else if (S.method === "session.model") {
                if (!isSessionModelParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await readOrSetSessionModel(d, N, x)
            } else if (S.method === "session.effort") {
                if (!isSessionEffortParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await readOrSetSessionEffort(d, N, x)
            } else if (S.method === "session.compact") {
                if (!isSessionCompactParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await enqueueSessionCompactCommand(u, l, d, N, x)
            } else if (S.method === "session.config") {
                if (!isSessionConfigParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await applySessionConfigVerb(u, d, x)
            } else if (S.method === "channel.spawn") {
                if (!isChannelSpawnParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                $.result = await upsertChannelSpawnDescriptor(u, d, x)
            } else if (S.method === "channel.ingress") {
                if (!isChannelIngressParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                if (assertWsChannelIdentityParams("channel.ingress", x, D), isSessionArchiving(x.session_key)) return $.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, $;
                let M = x.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    F = await resolveIngressWorkspace({
                        paths: u,
                        sessionKey: x.session_key,
                        cwdAbs: x.cwd_abs,
                        channelKind: M,
                        channelId: x.channel_id
                    });
                if (!F.ok) return $.error = {
                    code: -32010,
                    message: F.guidance
                }, $;
                await bindSessionSourceChannel(u, x.session_key, x.channel_id);
                let J = await ingestChannelMessage(u, {
                    sessionKey: x.session_key,
                    sourceKind: M,
                    sourceName: x.channel_id ?? D?.wsSubscriberId,
                    sourceChannelId: x.channel_id,
                    text: x.text ?? "",
                    attachments: x.attachments,
                    dedupSourceId: x.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: l,
                    gatewayCommands: N
                });
                logLatencyStageTelemetry("ingress_received", J.event.id, {
                    sessionKey: x.session_key
                }), J.routing.enqueued && l.emit("session.wake", {
                    sessionKey: x.session_key,
                    displayName: x.display_name,
                    preempt: resolvePreemptFromCommandText(x.text)
                });
                let ce = isBusinessSourceKind(M) ? F.effectiveConfig?.kind_config : void 0,
                    ie = {
                        event_id: J.event.id,
                        gateway_response: J.gatewayResponse,
                        outbox_id: J.gatewayOutboxId,
                        ...ce ? {
                            kind_config: ce
                        } : {}
                    };
                $.result = ie
            } else if (S.method === "channel.command") {
                if (!isChannelCommandParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                if (assertWsChannelIdentityParams("channel.command", x, D), isSessionArchiving(x.session_key)) return $.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, $;
                let M = x.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    F = await resolveIngressWorkspace({
                        paths: u,
                        sessionKey: x.session_key,
                        cwdAbs: x.cwd_abs,
                        channelKind: M,
                        channelId: x.channel_id
                    });
                if (!F.ok) return $.error = {
                    code: -32010,
                    message: F.guidance
                }, $;
                await bindSessionSourceChannel(u, x.session_key, x.channel_id);
                let J = await ingestChannelCommand(u, {
                    sessionKey: x.session_key,
                    sourceKind: M,
                    sourceName: x.channel_id ?? D?.wsSubscriberId,
                    sourceChannelId: x.channel_id,
                    command: x.command,
                    dedupSourceId: x.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: l,
                    gatewayCommands: N
                });
                J.routing.enqueued && l.emit("session.wake", {
                    sessionKey: x.session_key,
                    preempt: resolvePreemptFromCommandText(x.command)
                }), $.result = {
                    event_id: J.event.id,
                    gateway_response: J.gatewayResponse,
                    outbox_id: J.gatewayOutboxId
                }
            } else if (S.method === "channel.file.upload") {
                if (!isChannelFileUploadParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params,
                    M = await bve(u, x.session_key, x.name, x.mime, x.content_base64, {
                        receivedVia: D?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: D?.wsSubscriberId
                    });
                $.result = M
            } else if (S.method === "channel.file.download") {
                if (!isChannelFileDownloadParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params,
                    M = await vve(x.path);
                $.result = {
                    content_base64: M
                }
            } else if (S.method === "channel.pull") {
                if (!isChannelPullParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params,
                    M = x.consumer_id.trim(),
                    F = normalizeReturnMask(x.return_mask),
                    J = F.includes("final");
                if (D?.wsSubscriberId) return await recordChannelCapabilityDeclaration({
                    paths: u,
                    sessionKey: x.session_key,
                    declaredBy: M,
                    capabilities: x.channel_capabilities
                }), $.result = {
                    opened: !0,
                    session_key: x.session_key,
                    consumer_id: M,
                    cursor: x.cursor,
                    return_mask: F
                }, $;
                let ce = J ? await readOutboxRecordsPastCursor({
                    paths: u,
                    sessionKey: x.session_key,
                    consumerId: M,
                    limit: x.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: x.cursor
                }) : [];
                $.result = {
                    session_key: x.session_key,
                    consumer_id: M,
                    return_mask: F,
                    records: ce,
                    next_cursor: ce.length > 0 ? ce[ce.length - 1].id : void 0,
                    idle: ce.length === 0
                }
            } else if (S.method === "channel.ack") {
                if (!isChannelAckParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                if (isSessionArchiving(x.session_key)) return $.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, $;
                let M = x.consumer_id.trim(),
                    F = x.cursor.trim(),
                    J = x.session_key.indexOf(":"),
                    ce = J > 0 ? x.session_key.slice(0, J) : null,
                    ie = null;
                if (ce && (ie = await readOutboxRecord(u, ce, F)), !ie || ie.session_key !== x.session_key) {
                    let se = await $ce(u, x.session_key, F);
                    return se ? (await L6(u, x.session_key, M, se), $.result = {
                        session_key: x.session_key,
                        consumer_id: M,
                        committed_cursor: se.id,
                        committed: !0
                    }, $) : ($.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, $)
                }
                let Ce = await lookupOutboxByIdIndexEntry(u, F);
                if (!Ce) try {
                    await backfillOutboxByIdIndexFromReplay(u, x.session_key), Ce = await lookupOutboxByIdIndexEntry(u, F)
                } catch {}
                Ce ? await Fbe(u, x.session_key, M, Ce) : await L6(u, x.session_key, M, ie), $.result = {
                    session_key: x.session_key,
                    consumer_id: M,
                    committed_cursor: ie.id,
                    committed: !0
                }
            } else if (S.method === "job.create") {
                if (!isJobCreateParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                await c.init(), await c.createJob(x.id, {
                    cron: x.cron,
                    owner_session: x.owner_session,
                    cwd_rel: x.cwd_rel,
                    runtime: resolveDefaultRuntime()
                }, x.instruction);
                let M = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: x.id
                    },
                    payload: {
                        job_id: x.id,
                        cron: x.cron
                    }
                });
                await atomicAppendEvent(u, M), $.result = {
                    id: x.id,
                    cron: x.cron
                }
            } else if (S.method === "job.get") {
                if (!isJobGetParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                await c.init();
                let M = await c.getWakeRecord(x.id).catch(() => null);
                if (M) return $.result = {
                    kind: "active",
                    type: "wake",
                    id: M.id,
                    owner_session: M.frontmatter.owner_session,
                    run_at: M.state.run_at ?? null,
                    created_at: M.frontmatter.created_at,
                    content: M.context
                }, $;
                let F = await c.classifyActiveJob(x.id);
                if (F.kind === "active") $.result = {
                    ...redactJobModelProfileTokens(F.job),
                    kind: "active"
                };
                else if (F.kind === "invalid") $.error = {
                    code: jm.INVALID_ACTIVE,
                    message: `Job '${x.id}' active job file exists but is invalid: ${F.reason}`
                };
                else {
                    let J = await c.getArchivedJob(x.id);
                    J ? $.result = {
                        ...redactJobModelProfileTokens(J),
                        kind: "archived",
                        archived: !0
                    } : $.error = {
                        code: jm.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (S.method === "job.list") {
                if (!isJobListParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                await c.init();
                let x = ibe(await c.listJobs()).map(J => ({
                        type: "job",
                        ...J
                    })),
                    M = (await c.listWakeRecords()).map(J => ({
                        type: "wake",
                        id: J.id,
                        owner_session: J.frontmatter.owner_session,
                        run_at: J.state.run_at ?? null,
                        created_at: J.frontmatter.created_at,
                        content: J.context
                    }));
                S.params?.summary ? $.result = {
                    jobs: [...x.map(({
                        content: J,
                        path: ce,
                        ...ie
                    }) => ie), ...M]
                } : $.result = {
                    jobs: [...x, ...M]
                }
            } else if (S.method === "job.archive") {
                if (!isJobArchiveParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params;
                await c.init();
                let M = await c.getJob(x.id),
                    F = await c.archiveJob(x.id),
                    J = M?.session_key ?? buildJobSessionKey({
                        jobId: x.id,
                        cron: M?.frontmatter.cron,
                        cwdRel: M?.frontmatter.cwd_rel
                    });
                await moveSessionDirToArchive(u, J), $.result = {
                    id: x.id,
                    archived: !0,
                    session_key: J,
                    sidecar_orphan_path: F.sidecarOrphanPath ?? null
                }
            } else if (S.method === "job.reschedule") {
                if (!isJobRescheduleParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params,
                    M = x.when.trim();
                if (!M) throw new JsonRpcInvalidParamsError("job.reschedule requires a non-empty 'when': '@in <duration>' (e.g. '@in 30m') or a future ISO 8601 timestamp with an explicit zone.");
                await c.init();
                let F = await c.getJob(x.id),
                    J = await c.rescheduleJob(x.id, M);
                $.result = {
                    id: x.id,
                    run_at: J,
                    cron: F?.frontmatter.cron ?? null
                }
            } else if (S.method === "job.interrupt") {
                if (!isJobInterruptParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params,
                    M = x.reason.trim();
                if (!M) throw new JsonRpcInvalidParamsError("job.interrupt requires a non-empty 'reason' — it is what the interrupted session is told.");
                await c.init();
                let F = await c.getJob(x.id) ?? await c.getArchivedJob(x.id);
                if (!F) $.error = {
                    code: jm.NOT_FOUND,
                    message: `Job '${x.id}' not found`
                };
                else if (!e.sessionManager) $.error = {
                    code: -32603,
                    message: "Internal error",
                    data: "session manager unavailable"
                };
                else {
                    await patchSessionRuntimeState(u, F.session_key, {
                        pending_gateway_notice: {
                            source: "gateway_command",
                            command: `job interrupt ${x.id}`,
                            command_name: "interrupt",
                            result_summary: M,
                            created_at: new Date().toISOString()
                        }
                    });
                    let J = await e.sessionManager.interruptSession(F.session_key);
                    J.interrupted || await clearSessionRuntimeStateField(u, F.session_key, "pending_gateway_notice").catch(() => {}), $.result = {
                        id: x.id,
                        session_key: F.session_key,
                        interrupted: J.interrupted,
                        outcome: J.reason
                    }
                }
            } else if (S.method === "usage.get") {
                let x = S.params,
                    M = typeof x?.session_key == "string" ? x.session_key : void 0,
                    F = typeof x?.mode == "string" ? x.mode : void 0,
                    J;
                if (x?.since !== void 0 && (J = new Date(x.since), isNaN(J.getTime()) && (J = void 0)), F === "totals") {
                    let ce = await readGlobalUsageTotals(u, J);
                    $.result = {
                        totals: ce
                    }
                } else if (M) {
                    let ce = await readDrainRecords(u, M, J),
                        ie = summarizeDrainRecords(ce);
                    $.result = {
                        sessions: {
                            [M]: {
                                summary: ie,
                                records: ce
                            }
                        }
                    }
                } else {
                    let ce = await readAllSessionSummaries(u, J),
                        ie = {};
                    for (let [Ce, se] of Object.entries(ce)) ie[Ce] = {
                        summary: se
                    };
                    $.result = {
                        sessions: ie
                    }
                }
            } else if (S.method === "system.status") {
                if (!isSystemStatusParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let [x, M] = await Promise.all([readRegistryStatusFile(u), readPlaylistRound(u)]), F = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, J = e.sessionManager?.listActors(), ce = new Set, ie = [], Ce = ne => {
                    let K = ne?.last_served_model ?? null,
                        te = ne?.model ?? null;
                    return {
                        served: K,
                        pending: te !== null && te !== K ? te : null
                    }
                }, se = async ne => classifySessionKeyKind(ne) !== "channel" ? {} : {
                    last_cursor_advance_at: await readLatestDeliveryCursorUpdate(u, ne),
                    final_subscriber_count: h.finalSubscriberCount(ne)
                };
                if (J)
                    for (let [ne, K] of J) {
                        if (K.status === "ended" || !isUserVisibleSessionKey(ne)) continue;
                        ce.add(ne);
                        let te = d.get(ne);
                        ie.push({
                            session_key: ne,
                            display_name: te?.display_name ?? null,
                            status: K.status,
                            health: te?.last_error ? "error" : K.health,
                            last_event_at: te?.last_event_at ?? null,
                            created_at: te?.created_at ?? null,
                            cwd: te?.cwd ?? null,
                            last_error: te?.last_error ?? null,
                            runtime: K.runtime,
                            model: Ce(te),
                            in_flight_tools: K.activeToolCalls.length > 0 ? K.activeToolCalls.map(B => ({
                                tool_name: B.toolName,
                                started_at: new Date(B.startedAtMs).toISOString()
                            })) : void 0,
                            ...await se(ne)
                        })
                    }
                for (let ne of d.listUserVisible()) ce.has(ne.session_key) || ie.push({
                    session_key: ne.session_key,
                    display_name: ne.display_name ?? null,
                    status: "idle",
                    health: ne.last_error ? "error" : "ok",
                    last_event_at: ne.last_event_at ?? null,
                    created_at: ne.created_at ?? null,
                    cwd: ne.cwd ?? null,
                    last_error: ne.last_error ?? null,
                    model: Ce(ne),
                    ...await se(ne.session_key)
                });
                let j = {
                    health: {
                        gateway: x?.health?.gateway ?? "down",
                        meta_session: x?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: x?.cadence?.mode ?? "unknown",
                        last_tick: x?.cadence?.last_tick ?? null,
                        interval_ms: F
                    },
                    sessions: ie,
                    subconscious: {
                        partitions: M.items.map(ne => ({
                            name: ne.name,
                            done: ne.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(u)
                };
                $.result = j
            } else if (S.method === "system.config") {
                if (!isSystemConfigParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                $.result = await buildSystemConfigReport(u)
            } else if (S.method === "spine.tail") {
                if (!isSpineTailParams(S.params)) throw new JsonRpcInvalidParamsError("Invalid params");
                let x = S.params ?? {},
                    M = await readSpineTail(u, {
                        limit: x.limit,
                        after_id: x.after_id
                    });
                $.result = M
            } else S.method === "memory.read" ? $.result = await readMemoryFileForRpc(u, S.params) : S.method === "spine.cat" ? $.result = await runSpineCatRpc(u, S.params) : S.method === "spine.record" ? $.result = await recordExternalSpineEvent(u, S.params) : $.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (x) {
            x instanceof JsonRpcInvalidParamsError ? $.error = {
                code: x.code,
                message: x.message
            } : x instanceof MemoryReadRpcError || x instanceof SpineRpcParamsError ? $.error = {
                code: -32602,
                message: x.message
            } : x instanceof xb ? $.error = {
                code: -32603,
                message: x.message
            } : $.error = {
                code: -32603,
                message: "Internal error",
                data: String(x)
            }
        }
        return $
    }
    let P = (S, {
        hostGuard: D,
        readOnly: A,
        bearerToken: $
    }) => {
        if ($) {
            let C = x => AN.createHash("sha256").update(x).digest(),
                N = C($);
            S.addHook("onRequest", async (x, M) => {
                let F = x.headers.authorization,
                    J = typeof F == "string" && F.startsWith("Bearer ") ? F.slice(7).trim() : "";
                if (!J) return logWarnMessage("[daemon] rejected request: missing/invalid bearer", {
                    url: x.url
                }), a(x, M);
                if (!AN.timingSafeEqual(C(J), N)) return logWarnMessage("[daemon] rejected request: bearer mismatch", {
                    url: x.url
                }), a(x, M)
            })
        }
        D && S.addHook("onRequest", async (C, N) => {
            let x = C.routeOptions.url;
            if (x !== void 0 && Ubt.has(x)) return;
            let M = C.url ?? "",
                F = C.headers.host,
                J = F ? _vt(F) : null;
            if (!J || !i.has(J)) return logWarnMessage("[daemon] rejected request: Host header not allowed", {
                url: M,
                host: F ?? null
            }), s(C, N, "Host header not allowed");
            let ce = C.headers.origin;
            if (ce !== void 0) {
                let ie = bvt(ce);
                if (!ie || !i.has(ie)) return logWarnMessage("[daemon] rejected request: Origin not allowed", {
                    url: M,
                    origin: ce
                }), s(C, N, "Origin not allowed")
            }
        }), A ? S.get("/ws", async (C, N) => (logWarnMessage("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: C.ip,
            user_agent: C.headers["user-agent"] ?? null
        }), N.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: u.daemonSocketPath
        }))) : S.register(vIe.default), S.get("/healthz", async () => bde()), S.get("/dashboard", async (C, N) => {
            let x = so.join(u.bootstrapDir, "dashboard.html");
            try {
                let M = await zs.readFile(x, "utf8");
                return N.type("text/html").send(M)
            } catch {
                return N.code(404).send("Dashboard not found")
            }
        }), S.get("/readyz", async (C, N) => await probeEventsAppendable(u) ? {
            status: "ok"
        } : N.code(503).send({
            status: "not_ready"
        })), S.post("/rpc", async (C, N) => {
            let x = C.body;
            if (!isJsonRpcRequest(x)) return logWarnMessage("[daemon] invalid JSON-RPC request"), N.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if (A && !zbt.has(x.method)) return logWarnMessage("[daemon] rejected write method on read-only port", {
                method: x.method,
                id: x.id ?? null
            }), N.code(200).send({
                jsonrpc: "2.0",
                id: x.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let M = await R(x),
                F = M.__triggerShutdown;
            F && delete M.__triggerShutdown, await N.code(200).send(M), F && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), A || S.register(async function(C) {
            C.get("/ws", {
                websocket: !0
            }, N => {
                let x = `ws_${++g}`,
                    M = null,
                    F = "",
                    J = !1,
                    ce = null;
                logInfoMessage("[daemon] ws connected", {
                    subscriberId: x
                });
                let ie = (j, ne = !0) => {
                        let K = j.method === "session.output" ? j.params?.record?.id : void 0;
                        if (!(ce && K && ce.has(K))) {
                            try {
                                N.send(JSON.stringify(j))
                            } catch (te) {
                                throw te instanceof Error ? te : new Error(String(te))
                            }
                            if (ce && K && ce.add(K), ne && !J && j.method === "session.output") {
                                let {
                                    session_key: te,
                                    record: B
                                } = j.params;
                                if (!F) return;
                                let G = F,
                                    q = (b.get(x) ?? Promise.resolve()).then(() => advanceOptimisticDeliveryCursor(u, te, G, B).catch(pe => {
                                        logWarnMessage("[daemon] failed to advance delivery cursor", {
                                            subscriberId: x,
                                            sessionKey: te,
                                            consumerId: G,
                                            error: String(pe)
                                        })
                                    }));
                                b.set(x, q), q.then(() => {
                                    b.get(x) === q && b.delete(x)
                                })
                            }
                        }
                    },
                    Ce = async j => {
                        let ne;
                        try {
                            ne = JSON.parse(j.toString())
                        } catch {
                            N.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32700,
                                    message: "Parse error"
                                }
                            }));
                            return
                        }
                        if (!isJsonRpcRequest(ne)) {
                            N.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32600,
                                    message: "Invalid Request"
                                }
                            }));
                            return
                        }
                        let K = await R(ne, {
                                wsSubscriberId: x
                            }),
                            te = null,
                            B = "",
                            G;
                        if (ne.method === "channel.pull" && K.result && !K.error && isChannelPullParams(ne.params)) {
                            let q = ne.params,
                                pe = q.session_key,
                                fe = q.consumer_id.trim(),
                                Se = normalizeReturnMask(q.return_mask);
                            M && h.unsubscribe(x), M = pe, F = fe, J = q.advance === "ack", te = pe, B = fe, G = q.cursor, logInfoMessage("[daemon] ws pull stream opened", {
                                subscriberId: x,
                                sessionKey: pe,
                                consumerId: fe
                            }), ce = new Set, h.subscribe({
                                id: x,
                                sessionKey: pe,
                                returnMask: Se,
                                acceptStreamEndReasons: q.channel_capabilities?.outbound?.accept_stream_end_reasons,
                                send: w => ie(w),
                                close: () => {
                                    try {
                                        N.close()
                                    } catch {}
                                }
                            })
                        }
                        if (te) {
                            let q = isChannelPullParams(ne.params) ? ne.params : void 0;
                            if (!normalizeReturnMask(q?.return_mask).includes("final")) {
                                ce = null, N.send(JSON.stringify(K));
                                return
                            }
                            let Se = te,
                                w = q?.advance === "ack",
                                T = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                                L = Number.isFinite(T) ? T : 0;
                            try {
                                let z = await replayOutboxBacklogToSubscriber({
                                    paths: u,
                                    sessionKey: Se,
                                    consumerId: B,
                                    limit: L,
                                    cursorOverride: G,
                                    send: U => ie(U, !1),
                                    onDelivered: async U => {
                                        w || await advanceOptimisticDeliveryCursor(u, Se, B, U);
                                        let Y = await readOutboxRecord(u, U.channel_kind, U.id);
                                        Y && Y.status !== "sent" && await recordOutboxDeliveryAttempt(u, Y, {
                                            status: "sent"
                                        }), await recordOutboxSentId(u, U.id)
                                    }
                                });
                                z > 0 && logDebugMessage("[daemon] replayed outbox backlog", {
                                    subscriberId: x,
                                    sessionKey: Se,
                                    consumerId: B,
                                    replayed: z
                                })
                            } catch (z) {
                                logWarnMessage("[daemon] backlog replay failed", {
                                    subscriberId: x,
                                    sessionKey: Se,
                                    consumerId: B,
                                    error: String(z)
                                })
                            }
                            ce = null
                        }
                        let H = K.__triggerShutdown;
                        H && delete K.__triggerShutdown, N.send(JSON.stringify(K)), H && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                    };
                N.on("message", j => {
                    let ne = Ce(j).catch(B => {
                            logWarnMessage("[daemon] ws message handler failed", {
                                subscriberId: x,
                                error: String(B)
                            })
                        }),
                        K = _.get(x) ?? Promise.resolve(),
                        te = Promise.all([K, ne]).then(() => {});
                    _.set(x, te), te.then(() => {
                        _.get(x) === te && _.delete(x)
                    })
                });
                let se = () => {
                    M && h.unsubscribe(x)
                };
                N.on("close", () => {
                    se(), logInfoMessage("[daemon] ws closed", {
                        subscriberId: x,
                        sessionKey: M
                    })
                }), N.on("error", () => {
                    se(), logWarnMessage("[daemon] ws error", {
                        subscriberId: x,
                        sessionKey: M
                    })
                })
            })
        })
    };
    P(t, {
        hostGuard: !0,
        readOnly: !0
    }), P(n, {
        hostGuard: !1,
        readOnly: !1
    });
    let k = u.daemonSocketPath;
    return {
        app: t,
        socketApp: n,
        get remoteApp() {
            return r
        },
        bus: l,
        subscriptions: h,
        async start(S) {
            let D = resolveRemoteListenerConfig(process.env, S);
            if (!e.runtimeLockAlreadyHeld) {
                let C = await acquireRuntimeWriterLock(u);
                if (!C.acquired) throw new Error(`Runtime lock already held by pid=${C.lock?.pid??"unknown"} at ${C.lockPath}`)
            }
            y = !0;
            let A = !1;
            try {
                let N = Buffer.byteLength(k);
                if (N > 104) throw new Error(`daemon socket path is too long (${N} bytes > 104-byte unix-socket limit): ${k}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let x = so.dirname(k),
                    M;
                try {
                    M = await zs.stat(x)
                } catch (ie) {
                    throw new Error(`daemon socket directory is not accessible: ${x} (${String(ie)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let F = process.getuid?.(),
                    J = M.mode & 511;
                if (J !== 448 || F !== void 0 && M.uid !== F) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${J.toString(8)}, uid ${M.uid}): ${x}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
                let ce = null;
                try {
                    ce = await zs.lstat(k)
                } catch {
                    ce = null
                }
                if (ce)
                    if (ce.isSocket()) await zs.unlink(k);
                    else throw new Error(`daemon socket path is occupied by a non-socket file: ${k}. Refusing to delete it — check ALADUO_DAEMON_SOCKET.`);
                await n.listen({
                    path: k
                }), A = !0, await zs.chmod(k, 384), await t.listen({
                    port: S,
                    host: "127.0.0.1"
                }), D.enabled && (r = (0, ON.default)({
                    logger: !1
                }), P(r, {
                    hostGuard: !1,
                    readOnly: !1,
                    bearerToken: D.token
                }), await r.listen({
                    port: D.port,
                    host: D.host
                }), logAlwaysAtLevel("info", `[daemon] remote full-access listener on ${D.host}:${D.port} (bearer-gated)`))
            } catch (C) {
                throw await t.close().catch(() => {}), await n.close().catch(() => {}), r && (await r.close().catch(() => {}), r = null), A && await zs.unlink(k).catch(() => {}), y && (await releaseRuntimeWriterLock(u), y = !1), C
            }
            let $ = readEnvIntegerOrFallback("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            v = setInterval(() => {
                bwe(u).catch(() => {})
            }, $), v.unref?.()
        },
        async stop() {
            h.stop();
            let S = [t.close(), n.close()];
            r && S.push(r.close()), await Promise.all(S), r = null, await Promise.allSettled(_.values()), await Promise.allSettled(b.values()), await zs.unlink(k).catch(() => {}), v && (clearInterval(v), v = null), y && (await releaseRuntimeWriterLock(u), y = !1)
        }
    }
}
