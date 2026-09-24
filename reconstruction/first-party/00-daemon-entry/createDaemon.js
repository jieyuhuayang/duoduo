// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Lyt, daemon.pretty.js:90469)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, zA.default)({
            logger: !1
        }),
        n = (0, zA.default)({
            logger: !1
        }),
        r = null,
        i = new Set(["127.0.0.1", "localhost", "::1"]),
        o = (S, D, $, C, A) => {
            if (String(S.headers.upgrade ?? "").toLowerCase() === "websocket") {
                D.hijack();
                let k = D.raw.socket ?? S.raw.socket;
                k && !k.destroyed && (k.write(`HTTP/1.1 ${$} ${C}\r
Connection: close\r
Content-Length: 0\r
\r
`), k.destroy());
                return
            }
            return D.code($).send(A)
        },
        s = (S, D, $) => o(S, D, 403, "Forbidden", {
            error: "forbidden",
            reason: $
        }),
        a = (S, D) => o(S, D, 401, "Unauthorized", {
            error: "unauthorized"
        }),
        {
            paths: u,
            bus: l
        } = e,
        c = new Ur(u),
        d = e.sessionIndex ?? createEmptySessionIndex();
    rle((S, D) => {
        if (D === "removed") {
            d.remove(S);
            return
        }
        runWithSessionMutex(S, async () => {
            if (!isSessionArchiving(S)) try {
                let [$, C] = await Promise.all([ct(u, S), Qs(u, S)]);
                MV(d, S, $, C)
            } catch {}
        }).catch(() => {})
    }), lse(S => {
        d.remove(S)
    });
    let m = {
            version: eyt(import.meta.url)("../../package.json").version,
            runtime_id: myt(u.runtimeDir),
            runtime_mode: "host",
            runtime_dir: oo.resolve(u.runtimeDir),
            work_dir: oo.resolve(u.workDir),
            kernel_dir: oo.resolve(u.kernelDir)
        },
        h = e.subscriptions ?? createSessionSubscriptionRegistry();
    h.start(l);
    let g = 0,
        y = !1,
        v = null,
        b = new Map,
        _ = new Map,
        I = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function E(S, D) {
        (I.has(S.method) ? tse : Re)("[daemon] rpc request", {
            id: S.id ?? null,
            method: S.method,
            session_key: typeof S.params == "object" && S.params !== null ? S.params.session_key : void 0,
            ws: !!D?.wsSubscriberId
        });
        let C = {
                jsonrpc: "2.0",
                id: S.id ?? null
            },
            A;
        if (typeof S.params == "object" && S.params !== null && "worker_token" in S.params) {
            let {
                worker_token: k,
                ...N
            } = S.params;
            if (A = jhe(k), !A) return Z("[daemon] rejected pi worker RPC: unknown token", {
                method: S.method
            }), C.error = {
                code: -32001,
                message: "invalid pi worker token"
            }, C;
            if (!Mhe.has(S.method)) return Z("[daemon] rejected pi worker RPC: method not whitelisted", {
                method: S.method,
                session_key: A.session_key
            }), C.error = {
                code: -32601,
                message: `Method not available to pi worker callers: ${S.method}`
            }, C;
            S.params = N
        }
        let F = {
            cancelSession: async k => {
                if (!e.sessionManager) return {
                    interrupted: !1,
                    reason: "session_manager_unavailable"
                };
                let N = await e.sessionManager.interruptSession(k);
                return {
                    interrupted: N.interrupted,
                    reason: N.reason
                }
            },
            clearSession: async k => e.sessionManager ? e.sessionManager.clearSdkSession(k) : {
                cleared: !1,
                reason: "session_manager_unavailable"
            },
            listActors: () => {
                if (!e.sessionManager) return new Map;
                let k = e.sessionManager.listActors(),
                    N = new Map;
                for (let [V, W] of k) N.set(V, {
                    sessionKey: W.sessionKey,
                    status: W.status,
                    health: W.health,
                    idleSince: W.idleSince,
                    origin: W.origin
                });
                return N
            },
            listPersistentSessions: () => d.listUserVisible().map(k => ({
                session_key: k.session_key,
                cwd: k.cwd,
                created_at: k.created_at,
                last_event_at: k.last_event_at,
                last_error: k.last_error
            })),
            getSessionModel: async (k, N) => e.sessionManager ? e.sessionManager.getSessionModelView(k, N) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionModel: async (k, N, V) => e.sessionManager ? e.sessionManager.setSessionModel(k, N, V) : {
                ok: !1,
                reason: "not_running"
            },
            getSessionEffort: async (k, N) => e.sessionManager ? e.sessionManager.getSessionEffortView(k, N) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionEffort: async (k, N) => e.sessionManager ? e.sessionManager.setSessionEffort(k, N) : {
                ok: !1,
                reason: "not_running"
            }
        };
        try {
            if (S.method === "system.shutdown") C.result = {
                ok: !0
            }, C.__triggerShutdown = !0;
            else if (S.method === "system.runtime.info") {
                if (!T0(S.params)) throw new zt("Invalid params");
                if (!isDaemonRuntimeInfo(m)) throw new Error("invalid runtime info");
                let k = S.params ?? {};
                if (k.source_kind) {
                    let V = {
                        new_session_workspace: (await Za(u, {
                            channel_kind: k.source_kind
                        }))?.new_session_workspace
                    };
                    C.result = {
                        ...m,
                        channel_defaults: V
                    }
                } else C.result = m
            } else if (S.method === "channel.describe") {
                if (!H0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await describeChannelInstance(u, d, k)
            } else if (S.method === "session.archive") {
                if (!P0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await byt(u, e.sessionManager, d, k)
            } else if (S.method === "session.list") {
                if (!C0(S.params)) throw new zt("Invalid params");
                let k = S.params ?? {};
                C.result = await h$(d, c, k)
            } else if (S.method === "session.set_alias") {
                if (!$0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await wyt(u, d, k)
            } else if (S.method === "session.notify") {
                if (!A0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await deliverExternalSessionNotify(u, l, d, k)
            } else if (S.method === "session.wake") {
                if (!O0(S.params)) throw new zt("Invalid params");
                C.result = await scheduleSessionWakeRecord(u, d, S.params)
            } else if (S.method === "job.manage" || S.method === "session.manage" || S.method === "notify.send" || S.method === "wake.set") {
                if (!A) return C.error = {
                    code: -32001,
                    message: `${S.method} requires a pi worker token`
                }, C;
                if (typeof S.params != "object" || S.params === null) throw new zt("Invalid params");
                if (S.method === "job.manage") {
                    let k = await runManageJobTool(S.params, {
                        paths: u,
                        sessionKey: A.session_key,
                        callerJobCron: A.job_cron,
                        callerRuntime: "pi",
                        bus: l
                    });
                    C.result = {
                        output: k
                    }
                } else if (S.method === "notify.send") {
                    let k = await gg(S.params, {
                        paths: u,
                        bus: l,
                        sessionKey: A.session_key,
                        sessionContextKind: A.session_context_kind,
                        jobScheduleType: A.job_schedule_type
                    });
                    k.startsWith("Error:") || e.sessionManager?.markAgentNotified(A.session_key), C.result = {
                        output: k
                    }
                } else if (S.method === "wake.set") {
                    let k = await mg(S.params, {
                        paths: u,
                        sessionKey: A.session_key,
                        sessionContextKind: A.session_context_kind
                    });
                    C.result = {
                        output: k
                    }
                } else {
                    let k = await pg(S.params, {
                        paths: u,
                        sessionKey: A.session_key,
                        getSessionStatus: N => e.sessionManager?.listActors().get(N)?.status
                    });
                    C.result = {
                        output: k
                    }
                }
            } else if (S.method === "session.model") {
                if (!N0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await readOrSetSessionModel(d, F, k)
            } else if (S.method === "session.effort") {
                if (!D0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await readOrSetSessionEffort(d, F, k)
            } else if (S.method === "session.compact") {
                if (!M0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await enqueueSessionCompactCommand(u, l, d, F, k)
            } else if (S.method === "session.config") {
                if (!j0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await Tyt(u, d, k)
            } else if (S.method === "channel.spawn") {
                if (!W0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                C.result = await upsertChannelSpawnDescriptor(u, d, k)
            } else if (S.method === "channel.ingress") {
                if (!z0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                if (k0e("channel.ingress", k, D), isSessionArchiving(k.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${k.session_key}`
                }, C;
                let N = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    V = await x0e({
                        paths: u,
                        sessionKey: k.session_key,
                        cwdAbs: k.cwd_abs,
                        channelKind: N,
                        channelId: k.channel_id
                    });
                if (!V.ok) return C.error = {
                    code: -32010,
                    message: V.guidance
                }, C;
                let W = await ingestChannelMessage(u, {
                    sessionKey: k.session_key,
                    sourceKind: N,
                    sourceName: k.channel_id ?? D?.wsSubscriberId,
                    sourceChannelId: k.channel_id,
                    text: k.text ?? "",
                    attachments: k.attachments,
                    dedupSourceId: k.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: l,
                    gatewayCommands: F
                });
                k.channel_id && await patchSessionRuntimeState(u, k.session_key, {
                    source_channel_id: k.channel_id
                }), po("ingress_received", W.event.id, {
                    sessionKey: k.session_key
                }), W.routing.enqueued && l.emit("session.wake", {
                    sessionKey: k.session_key,
                    displayName: k.display_name,
                    preempt: resolvePreemptFromCommandText(k.text)
                });
                let ce = Lw(N) ? V.effectiveConfig?.kind_config : void 0,
                    J = {
                        event_id: W.event.id,
                        gateway_response: W.gatewayResponse,
                        outbox_id: W.gatewayOutboxId,
                        ...ce ? {
                            kind_config: ce
                        } : {}
                    };
                C.result = J
            } else if (S.method === "channel.command") {
                if (!B0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                if (k0e("channel.command", k, D), isSessionArchiving(k.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${k.session_key}`
                }, C;
                let N = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    V = await x0e({
                        paths: u,
                        sessionKey: k.session_key,
                        cwdAbs: k.cwd_abs,
                        channelKind: N,
                        channelId: k.channel_id
                    });
                if (!V.ok) return C.error = {
                    code: -32010,
                    message: V.guidance
                }, C;
                let W = await ingestChannelCommand(u, {
                    sessionKey: k.session_key,
                    sourceKind: N,
                    sourceName: k.channel_id ?? D?.wsSubscriberId,
                    sourceChannelId: k.channel_id,
                    command: k.command,
                    dedupSourceId: k.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: l,
                    gatewayCommands: F
                });
                W.routing.enqueued && l.emit("session.wake", {
                    sessionKey: k.session_key,
                    preempt: resolvePreemptFromCommandText(k.command)
                }), C.result = {
                    event_id: W.event.id,
                    gateway_response: W.gatewayResponse,
                    outbox_id: W.gatewayOutboxId
                }
            } else if (S.method === "channel.file.upload") {
                if (!U0(S.params)) throw new zt("Invalid params");
                let k = S.params,
                    N = await tbe(u, k.session_key, k.name, k.mime, k.content_base64, {
                        receivedVia: D?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: D?.wsSubscriberId
                    });
                C.result = N
            } else if (S.method === "channel.file.download") {
                if (!q0(S.params)) throw new zt("Invalid params");
                let k = S.params,
                    N = await nbe(k.path);
                C.result = {
                    content_base64: N
                }
            } else if (S.method === "channel.pull") {
                if (!bm(S.params)) throw new zt("Invalid params");
                let k = S.params,
                    N = k.consumer_id.trim(),
                    V = normalizeReturnMask(k.return_mask),
                    W = V.includes("final");
                if (D?.wsSubscriberId) return await recordChannelCapabilityDeclaration({
                    paths: u,
                    sessionKey: k.session_key,
                    declaredBy: N,
                    capabilities: k.channel_capabilities
                }), C.result = {
                    opened: !0,
                    session_key: k.session_key,
                    consumer_id: N,
                    cursor: k.cursor,
                    return_mask: V
                }, C;
                let ce = W ? await readOutboxRecordsPastCursor({
                    paths: u,
                    sessionKey: k.session_key,
                    consumerId: N,
                    limit: k.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: k.cursor
                }) : [];
                C.result = {
                    session_key: k.session_key,
                    consumer_id: N,
                    return_mask: V,
                    records: ce,
                    next_cursor: ce.length > 0 ? ce[ce.length - 1].id : void 0,
                    idle: ce.length === 0
                }
            } else if (S.method === "channel.ack") {
                if (!V0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                if (isSessionArchiving(k.session_key)) return C.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${k.session_key}`
                }, C;
                let N = k.consumer_id.trim(),
                    V = k.cursor.trim(),
                    W = k.session_key.indexOf(":"),
                    ce = W > 0 ? k.session_key.slice(0, W) : null,
                    J = null;
                if (ce && (J = await readOutboxRecord(u, ce, V)), !J || J.session_key !== k.session_key) {
                    let fe = await mle(u, k.session_key, V);
                    return fe ? (await UV(u, k.session_key, N, fe), C.result = {
                        session_key: k.session_key,
                        consumer_id: N,
                        committed_cursor: fe.id,
                        committed: !0
                    }, C) : (C.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, C)
                }
                let ne = await lookupOutboxByIdIndexEntry(u, V);
                if (!ne) try {
                    await backfillOutboxByIdIndexFromReplay(u, k.session_key), ne = await lookupOutboxByIdIndexEntry(u, V)
                } catch {}
                ne ? await x_e(u, k.session_key, N, ne) : await UV(u, k.session_key, N, J), C.result = {
                    session_key: k.session_key,
                    consumer_id: N,
                    committed_cursor: J.id,
                    committed: !0
                }
            } else if (S.method === "job.create") {
                if (!isJobCreateParams(S.params)) throw new zt("Invalid params");
                let k = S.params;
                await c.init(), await c.createJob(k.id, {
                    cron: k.cron,
                    owner_session: k.owner_session,
                    cwd_rel: k.cwd_rel,
                    runtime: resolveDefaultRuntime()
                }, k.instruction);
                let N = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: k.id
                    },
                    payload: {
                        job_id: k.id,
                        cron: k.cron
                    }
                });
                await atomicAppendEvent(u, N), C.result = {
                    id: k.id,
                    cron: k.cron
                }
            } else if (S.method === "job.get") {
                if (!Z0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                await c.init();
                let N = await c.getWakeRecord(k.id).catch(() => null);
                if (N) return C.result = {
                    kind: "active",
                    type: "wake",
                    id: N.id,
                    owner_session: N.frontmatter.owner_session,
                    run_at: N.state.run_at ?? null,
                    created_at: N.frontmatter.created_at,
                    content: N.context
                }, C;
                let V = await c.classifyActiveJob(k.id);
                if (V.kind === "active") C.result = {
                    ...Af(V.job),
                    kind: "active"
                };
                else if (V.kind === "invalid") C.error = {
                    code: vm.INVALID_ACTIVE,
                    message: `Job '${k.id}' active job file exists but is invalid: ${V.reason}`
                };
                else {
                    let W = await c.getArchivedJob(k.id);
                    W ? C.result = {
                        ...Af(W),
                        kind: "archived",
                        archived: !0
                    } : C.error = {
                        code: vm.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (S.method === "job.list") {
                if (!G0(S.params)) throw new zt("Invalid params");
                await c.init();
                let k = jye(await c.listJobs()).map(W => ({
                        type: "job",
                        ...W
                    })),
                    N = (await c.listWakeRecords()).map(W => ({
                        type: "wake",
                        id: W.id,
                        owner_session: W.frontmatter.owner_session,
                        run_at: W.state.run_at ?? null,
                        created_at: W.frontmatter.created_at,
                        content: W.context
                    }));
                S.params?.summary ? C.result = {
                    jobs: [...k.map(({
                        content: W,
                        path: ce,
                        ...J
                    }) => J), ...N]
                } : C.result = {
                    jobs: [...k, ...N]
                }
            } else if (S.method === "job.archive") {
                if (!K0(S.params)) throw new zt("Invalid params");
                let k = S.params;
                await c.init();
                let N = await c.getJob(k.id),
                    V = await c.archiveJob(k.id),
                    W = N?.session_key ?? vc({
                        jobId: k.id,
                        cron: N?.frontmatter.cron,
                        cwdRel: N?.frontmatter.cwd_rel
                    });
                await ab(u, W), C.result = {
                    id: k.id,
                    archived: !0,
                    session_key: W,
                    sidecar_orphan_path: V.sidecarOrphanPath ?? null
                }
            } else if (S.method === "job.reschedule") {
                if (!Y0(S.params)) throw new zt("Invalid params");
                let k = S.params,
                    N = k.when.trim();
                if (!N) throw new zt("job.reschedule requires a non-empty 'when': '@in <duration>' (e.g. '@in 30m') or a future ISO 8601 timestamp with an explicit zone.");
                await c.init();
                let V = await c.getJob(k.id),
                    W = await c.rescheduleJob(k.id, N);
                C.result = {
                    id: k.id,
                    run_at: W,
                    cron: V?.frontmatter.cron ?? null
                }
            } else if (S.method === "job.interrupt") {
                if (!X0(S.params)) throw new zt("Invalid params");
                let k = S.params,
                    N = k.reason.trim();
                if (!N) throw new zt("job.interrupt requires a non-empty 'reason' — it is what the interrupted session is told.");
                await c.init();
                let V = await c.getJob(k.id) ?? await c.getArchivedJob(k.id);
                if (!V) C.error = {
                    code: vm.NOT_FOUND,
                    message: `Job '${k.id}' not found`
                };
                else if (!e.sessionManager) C.error = {
                    code: -32603,
                    message: "Internal error",
                    data: "session manager unavailable"
                };
                else {
                    await patchSessionRuntimeState(u, V.session_key, {
                        pending_gateway_notice: {
                            source: "gateway_command",
                            command: `job interrupt ${k.id}`,
                            command_name: "interrupt",
                            result_summary: N,
                            created_at: new Date().toISOString()
                        }
                    });
                    let W = await e.sessionManager.interruptSession(V.session_key);
                    W.interrupted || await clearSessionRuntimeStateField(u, V.session_key, "pending_gateway_notice").catch(() => {}), C.result = {
                        id: k.id,
                        session_key: V.session_key,
                        interrupted: W.interrupted,
                        outcome: W.reason
                    }
                }
            } else if (S.method === "usage.get") {
                let k = S.params,
                    N = typeof k?.session_key == "string" ? k.session_key : void 0,
                    V = typeof k?.mode == "string" ? k.mode : void 0,
                    W;
                if (k?.since !== void 0 && (W = new Date(k.since), isNaN(W.getTime()) && (W = void 0)), V === "totals") {
                    let ce = await readGlobalUsageTotals(u, W);
                    C.result = {
                        totals: ce
                    }
                } else if (N) {
                    let ce = await readDrainRecords(u, N, W),
                        J = summarizeDrainRecords(ce);
                    C.result = {
                        sessions: {
                            [N]: {
                                summary: J,
                                records: ce
                            }
                        }
                    }
                } else {
                    let ce = await readAllSessionSummaries(u, W),
                        J = {};
                    for (let [ne, fe] of Object.entries(ce)) J[ne] = {
                        summary: fe
                    };
                    C.result = {
                        sessions: J
                    }
                }
            } else if (S.method === "system.status") {
                if (!Q0(S.params)) throw new zt("Invalid params");
                let [k, N] = await Promise.all([db(u), readPlaylistRound(u)]), V = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, W = e.sessionManager?.listActors(), ce = new Set, J = [], ne = ue => {
                    let Ie = ue?.last_served_model ?? null,
                        ae = ue?.model ?? null;
                    return {
                        served: Ie,
                        pending: ae !== null && ae !== Ie ? ae : null
                    }
                }, fe = async ue => classifySessionKeyKind(ue) !== "channel" ? {} : {
                    last_cursor_advance_at: await I$(u, ue),
                    final_subscriber_count: h.finalSubscriberCount(ue)
                };
                if (W)
                    for (let [ue, Ie] of W) {
                        if (Ie.status === "ended" || !isUserVisibleSessionKey(ue)) continue;
                        ce.add(ue);
                        let ae = d.get(ue);
                        J.push({
                            session_key: ue,
                            display_name: ae?.display_name ?? null,
                            status: Ie.status,
                            health: ae?.last_error ? "error" : Ie.health,
                            last_event_at: ae?.last_event_at ?? null,
                            created_at: ae?.created_at ?? null,
                            cwd: ae?.cwd ?? null,
                            last_error: ae?.last_error ?? null,
                            runtime: Ie.runtime,
                            model: ne(ae),
                            in_flight_tools: Ie.activeToolCalls.length > 0 ? Ie.activeToolCalls.map(M => ({
                                tool_name: M.toolName,
                                started_at: new Date(M.startedAtMs).toISOString()
                            })) : void 0,
                            ...await fe(ue)
                        })
                    }
                for (let ue of d.listUserVisible()) ce.has(ue.session_key) || J.push({
                    session_key: ue.session_key,
                    display_name: ue.display_name ?? null,
                    status: "idle",
                    health: ue.last_error ? "error" : "ok",
                    last_event_at: ue.last_event_at ?? null,
                    created_at: ue.created_at ?? null,
                    cwd: ue.cwd ?? null,
                    last_error: ue.last_error ?? null,
                    model: ne(ue),
                    ...await fe(ue.session_key)
                });
                let j = {
                    health: {
                        gateway: k?.health?.gateway ?? "down",
                        meta_session: k?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: k?.cadence?.mode ?? "unknown",
                        last_tick: k?.cadence?.last_tick ?? null,
                        interval_ms: V
                    },
                    sessions: J,
                    subconscious: {
                        partitions: N.items.map(ue => ({
                            name: ue.name,
                            done: ue.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(u)
                };
                C.result = j
            } else if (S.method === "system.config") {
                if (!eR(S.params)) throw new zt("Invalid params");
                C.result = await buildSystemConfigReport(u)
            } else if (S.method === "spine.tail") {
                if (!tR(S.params)) throw new zt("Invalid params");
                let k = S.params ?? {},
                    N = await readSpineTail(u, {
                        limit: k.limit,
                        after_id: k.after_id
                    });
                C.result = N
            } else C.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (k) {
            k instanceof zt ? C.error = {
                code: k.code,
                message: k.message
            } : C.error = {
                code: -32603,
                message: "Internal error",
                data: String(k)
            }
        }
        return C
    }
    let R = (S, {
        hostGuard: D,
        readOnly: $,
        bearerToken: C
    }) => {
        if (C) {
            let A = qS.createHash("sha256").update(C).digest();
            S.addHook("onRequest", async (F, k) => {
                let N = F.url ?? "";
                if (!(N.startsWith("/rpc") || N.startsWith("/ws"))) return;
                let V = F.headers.authorization,
                    W = typeof V == "string" && V.startsWith("Bearer ") ? V.slice(7).trim() : "";
                if (!W) return Z("[daemon] rejected request: missing/invalid bearer", {
                    url: N
                }), a(F, k);
                let ce = qS.createHash("sha256").update(W).digest();
                if (!qS.timingSafeEqual(ce, A)) return Z("[daemon] rejected request: bearer mismatch", {
                    url: N
                }), a(F, k)
            })
        }
        D && S.addHook("onRequest", async (A, F) => {
            let k = A.url ?? "";
            if (!(k.startsWith("/rpc") || k.startsWith("/ws"))) return;
            let V = A.headers.host,
                W = V ? Nyt(V) : null;
            if (!W || !i.has(W)) return Z("[daemon] rejected request: Host header not allowed", {
                url: k,
                host: V ?? null
            }), s(A, F, "Host header not allowed");
            let ce = A.headers.origin;
            if (ce !== void 0) {
                let J = Dyt(ce);
                if (!J || !i.has(J)) return Z("[daemon] rejected request: Origin not allowed", {
                    url: k,
                    origin: ce
                }), s(A, F, "Origin not allowed")
            }
        }), $ ? S.get("/ws", async (A, F) => (Z("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: A.ip,
            user_agent: A.headers["user-agent"] ?? null
        }), F.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: u.daemonSocketPath
        }))) : S.register(P0e.default), S.get("/healthz", async () => Xle()), S.get("/dashboard", async (A, F) => {
            let k = oo.join(u.bootstrapDir, "dashboard.html");
            try {
                let N = await Ms.readFile(k, "utf8");
                return F.type("text/html").send(N)
            } catch {
                return F.code(404).send("Dashboard not found")
            }
        }), S.get("/readyz", async (A, F) => await probeEventsAppendable(u) ? {
            status: "ok"
        } : F.code(503).send({
            status: "not_ready"
        })), S.post("/rpc", async (A, F) => {
            let k = A.body;
            if (!isJsonRpcRequest(k)) return Z("[daemon] invalid JSON-RPC request"), F.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if ($ && !ryt.has(k.method)) return Z("[daemon] rejected write method on read-only port", {
                method: k.method,
                id: k.id ?? null
            }), F.code(200).send({
                jsonrpc: "2.0",
                id: k.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let N = await E(k),
                V = N.__triggerShutdown;
            V && delete N.__triggerShutdown, await F.code(200).send(N), V && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), $ || S.register(async function(A) {
            A.get("/ws", {
                websocket: !0
            }, F => {
                let k = `ws_${++g}`,
                    N = null,
                    V = "",
                    W = null;
                te("[daemon] ws connected", {
                    subscriberId: k
                });
                let ce = (fe, j = !0) => {
                        let ue = fe.method === "session.output" ? fe.params?.record?.id : void 0;
                        if (!(W && ue && W.has(ue))) {
                            try {
                                F.send(JSON.stringify(fe))
                            } catch (Ie) {
                                throw Ie instanceof Error ? Ie : new Error(String(Ie))
                            }
                            if (W && ue && W.add(ue), j && fe.method === "session.output") {
                                let {
                                    session_key: Ie,
                                    record: ae
                                } = fe.params;
                                if (!V) return;
                                let M = V,
                                    U = (b.get(k) ?? Promise.resolve()).then(() => advanceOptimisticDeliveryCursor(u, Ie, M, ae).catch(X => {
                                        Z("[daemon] failed to advance delivery cursor", {
                                            subscriberId: k,
                                            sessionKey: Ie,
                                            consumerId: M,
                                            error: String(X)
                                        })
                                    }));
                                b.set(k, U), U.then(() => {
                                    b.get(k) === U && b.delete(k)
                                })
                            }
                        }
                    },
                    J = async fe => {
                        let j;
                        try {
                            j = JSON.parse(fe.toString())
                        } catch {
                            F.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32700,
                                    message: "Parse error"
                                }
                            }));
                            return
                        }
                        if (!isJsonRpcRequest(j)) {
                            F.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32600,
                                    message: "Invalid Request"
                                }
                            }));
                            return
                        }
                        let ue = await E(j, {
                                wsSubscriberId: k
                            }),
                            Ie = null,
                            ae = "",
                            M;
                        if (j.method === "channel.pull" && ue.result && !ue.error && bm(j.params)) {
                            let U = j.params,
                                X = U.session_key,
                                Ee = U.consumer_id.trim(),
                                be = normalizeReturnMask(U.return_mask);
                            N && h.unsubscribe(k), N = X, V = Ee, Ie = X, ae = Ee, M = U.cursor, te("[daemon] ws pull stream opened", {
                                subscriberId: k,
                                sessionKey: X,
                                consumerId: Ee
                            }), W = new Set, h.subscribe({
                                id: k,
                                sessionKey: X,
                                returnMask: be,
                                acceptStreamEndReasons: U.channel_capabilities?.outbound?.accept_stream_end_reasons,
                                send: w => ce(w),
                                close: () => {
                                    try {
                                        F.close()
                                    } catch {}
                                }
                            })
                        }
                        if (Ie) {
                            let U = bm(j.params) ? j.params : void 0;
                            if (!normalizeReturnMask(U?.return_mask).includes("final")) {
                                W = null, F.send(JSON.stringify(ue));
                                return
                            }
                            let be = Ie,
                                w = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                                P = Number.isFinite(w) ? w : 0;
                            try {
                                let K = await replayOutboxBacklogToSubscriber({
                                    paths: u,
                                    sessionKey: be,
                                    consumerId: ae,
                                    limit: P,
                                    cursorOverride: M,
                                    send: H => ce(H, !1),
                                    onDelivered: async H => {
                                        await advanceOptimisticDeliveryCursor(u, be, ae, H);
                                        let L = await readOutboxRecord(u, H.channel_kind, H.id);
                                        L && L.status !== "sent" && await recordOutboxDeliveryAttempt(u, L, {
                                            status: "sent"
                                        }), await recordOutboxSentId(u, H.id)
                                    }
                                });
                                K > 0 && Re("[daemon] replayed outbox backlog", {
                                    subscriberId: k,
                                    sessionKey: be,
                                    consumerId: ae,
                                    replayed: K
                                })
                            } catch (K) {
                                Z("[daemon] backlog replay failed", {
                                    subscriberId: k,
                                    sessionKey: be,
                                    consumerId: ae,
                                    error: String(K)
                                })
                            }
                            W = null
                        }
                        let z = ue.__triggerShutdown;
                        z && delete ue.__triggerShutdown, F.send(JSON.stringify(ue)), z && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                    };
                F.on("message", fe => {
                    let j = J(fe).catch(ae => {
                            Z("[daemon] ws message handler failed", {
                                subscriberId: k,
                                error: String(ae)
                            })
                        }),
                        ue = _.get(k) ?? Promise.resolve(),
                        Ie = Promise.all([ue, j]).then(() => {});
                    _.set(k, Ie), Ie.then(() => {
                        _.get(k) === Ie && _.delete(k)
                    })
                });
                let ne = () => {
                    N && h.unsubscribe(k)
                };
                F.on("close", () => {
                    ne(), te("[daemon] ws closed", {
                        subscriberId: k,
                        sessionKey: N
                    })
                }), F.on("error", () => {
                    ne(), Z("[daemon] ws error", {
                        subscriberId: k,
                        sessionKey: N
                    })
                })
            })
        })
    };
    R(t, {
        hostGuard: !0,
        readOnly: !0
    }), R(n, {
        hostGuard: !1,
        readOnly: !1
    });
    let x = u.daemonSocketPath;
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
                let A = await acquireRuntimeWriterLock(u);
                if (!A.acquired) throw new Error(`Runtime lock already held by pid=${A.lock?.pid??"unknown"} at ${A.lockPath}`)
            }
            y = !0;
            let $ = !1;
            try {
                let F = Buffer.byteLength(x);
                if (F > 104) throw new Error(`daemon socket path is too long (${F} bytes > 104-byte unix-socket limit): ${x}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let k = oo.dirname(x),
                    N;
                try {
                    N = await Ms.stat(k)
                } catch (J) {
                    throw new Error(`daemon socket directory is not accessible: ${k} (${String(J)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let V = process.getuid?.(),
                    W = N.mode & 511;
                if (W !== 448 || V !== void 0 && N.uid !== V) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${W.toString(8)}, uid ${N.uid}): ${k}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
                let ce = null;
                try {
                    ce = await Ms.lstat(x)
                } catch {
                    ce = null
                }
                if (ce)
                    if (ce.isSocket()) await Ms.unlink(x);
                    else throw new Error(`daemon socket path is occupied by a non-socket file: ${x}. Refusing to delete it — check ALADUO_DAEMON_SOCKET.`);
                await n.listen({
                    path: x
                }), $ = !0, await Ms.chmod(x, 384), await t.listen({
                    port: S,
                    host: "127.0.0.1"
                }), D.enabled && (r = (0, zA.default)({
                    logger: !1
                }), R(r, {
                    hostGuard: !1,
                    readOnly: !1,
                    bearerToken: D.token
                }), await r.listen({
                    port: D.port,
                    host: D.host
                }), _t("info", `[daemon] remote full-access listener on ${D.host}:${D.port} (bearer-gated)`))
            } catch (A) {
                throw await t.close().catch(() => {}), await n.close().catch(() => {}), r && (await r.close().catch(() => {}), r = null), $ && await Ms.unlink(x).catch(() => {}), y && (await B$(u), y = !1), A
            }
            let C = readEnvIntegerOrFallback("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            v = setInterval(() => {
                tve(u).catch(() => {})
            }, C), v.unref?.()
        },
        async stop() {
            h.stop();
            let S = [t.close(), n.close()];
            r && S.push(r.close()), await Promise.all(S), r = null, await Promise.allSettled(_.values()), await Promise.allSettled(b.values()), await Ms.unlink(x).catch(() => {}), v && (clearInterval(v), v = null), y && (await B$(u), y = !1)
        }
    }
}
