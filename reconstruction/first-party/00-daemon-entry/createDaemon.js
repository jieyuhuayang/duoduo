// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Ayt, daemon.pretty.js:90421)
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
        o = (S, D, A, C, $) => {
            if (String(S.headers.upgrade ?? "").toLowerCase() === "websocket") {
                D.hijack();
                let k = D.raw.socket ?? S.raw.socket;
                k && !k.destroyed && (k.write(`HTTP/1.1 ${A} ${C}\r
Connection: close\r
Content-Length: 0\r
\r
`), k.destroy());
                return
            }
            return D.code(A).send($)
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
        d = e.sessionIndex ?? f_e();
    nle((S, D) => {
        if (D === "removed") {
            d.remove(S);
            return
        }
        Bi(S, async () => {
            if (!or(S)) try {
                let [A, C] = await Promise.all([ht(u, S), Qs(u, S)]);
                DV(d, S, A, C)
            } catch {}
        }).catch(() => {})
    }), use(S => {
        d.remove(S)
    });
    let m = {
            version: Ggt(import.meta.url)("../../package.json").version,
            runtime_id: lyt(u.runtimeDir),
            runtime_mode: "host",
            runtime_dir: ro.resolve(u.runtimeDir),
            work_dir: ro.resolve(u.workDir),
            kernel_dir: ro.resolve(u.kernelDir)
        },
        h = e.subscriptions ?? u6();
    h.start(l);
    let g = 0,
        y = !1,
        v = null,
        b = new Map,
        _ = new Map,
        I = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function E(S, D) {
        (I.has(S.method) ? ese : Ee)("[daemon] rpc request", {
            id: S.id ?? null,
            method: S.method,
            session_key: typeof S.params == "object" && S.params !== null ? S.params.session_key : void 0,
            ws: !!D?.wsSubscriberId
        });
        let C = {
                jsonrpc: "2.0",
                id: S.id ?? null
            },
            $;
        if (typeof S.params == "object" && S.params !== null && "worker_token" in S.params) {
            let {
                worker_token: k,
                ...L
            } = S.params;
            if ($ = Mhe(k), !$) return Z("[daemon] rejected pi worker RPC: unknown token", {
                method: S.method
            }), C.error = {
                code: -32001,
                message: "invalid pi worker token"
            }, C;
            if (!Dhe.has(S.method)) return Z("[daemon] rejected pi worker RPC: method not whitelisted", {
                method: S.method,
                session_key: $.session_key
            }), C.error = {
                code: -32601,
                message: `Method not available to pi worker callers: ${S.method}`
            }, C;
            S.params = L
        }
        let j = {
            cancelSession: async k => {
                if (!e.sessionManager) return {
                    interrupted: !1,
                    reason: "session_manager_unavailable"
                };
                let L = await e.sessionManager.interruptSession(k);
                return {
                    interrupted: L.interrupted,
                    reason: L.reason
                }
            },
            clearSession: async k => e.sessionManager ? e.sessionManager.clearSdkSession(k) : {
                cleared: !1,
                reason: "session_manager_unavailable"
            },
            listActors: () => {
                if (!e.sessionManager) return new Map;
                let k = e.sessionManager.listActors(),
                    L = new Map;
                for (let [B, G] of k) L.set(B, {
                    sessionKey: G.sessionKey,
                    status: G.status,
                    health: G.health,
                    idleSince: G.idleSince,
                    origin: G.origin
                });
                return L
            },
            listPersistentSessions: () => d.listUserVisible().map(k => ({
                session_key: k.session_key,
                cwd: k.cwd,
                created_at: k.created_at,
                last_event_at: k.last_event_at,
                last_error: k.last_error
            })),
            getSessionModel: async (k, L) => e.sessionManager ? e.sessionManager.getSessionModelView(k, L) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionModel: async (k, L, B) => e.sessionManager ? e.sessionManager.setSessionModel(k, L, B) : {
                ok: !1,
                reason: "not_running"
            },
            getSessionEffort: async (k, L) => e.sessionManager ? e.sessionManager.getSessionEffortView(k, L) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionEffort: async (k, L) => e.sessionManager ? e.sessionManager.setSessionEffort(k, L) : {
                ok: !1,
                reason: "not_running"
            }
        };
        try {
            if (S.method === "system.shutdown") C.result = {
                ok: !0
            }, C.__triggerShutdown = !0;
            else if (S.method === "system.runtime.info") {
                if (!T0(S.params)) throw new qt("Invalid params");
                if (!I0(m)) throw new Error("invalid runtime info");
                let k = S.params ?? {};
                if (k.source_kind) {
                    let B = {
                        new_session_workspace: (await Za(u, {
                            channel_kind: k.source_kind
                        }))?.new_session_workspace
                    };
                    C.result = {
                        ...m,
                        channel_defaults: B
                    }
                } else C.result = m
            } else if (S.method === "channel.describe") {
                if (!H0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await pyt(u, d, k)
            } else if (S.method === "session.archive") {
                if (!P0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await myt(u, e.sessionManager, d, k)
            } else if (S.method === "session.list") {
                if (!C0(S.params)) throw new qt("Invalid params");
                let k = S.params ?? {};
                C.result = await h$(d, c, k)
            } else if (S.method === "session.set_alias") {
                if (!$0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await gyt(u, d, k)
            } else if (S.method === "session.notify") {
                if (!A0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await $0e(u, l, d, k)
            } else if (S.method === "session.wake") {
                if (!O0(S.params)) throw new qt("Invalid params");
                C.result = await yyt(u, d, S.params)
            } else if (S.method === "job.manage" || S.method === "session.manage" || S.method === "notify.send" || S.method === "wake.set") {
                if (!$) return C.error = {
                    code: -32001,
                    message: `${S.method} requires a pi worker token`
                }, C;
                if (typeof S.params != "object" || S.params === null) throw new qt("Invalid params");
                if (S.method === "job.manage") {
                    let k = await lg(S.params, {
                        paths: u,
                        sessionKey: $.session_key,
                        callerJobCron: $.job_cron,
                        callerRuntime: "pi",
                        bus: l
                    });
                    C.result = {
                        output: k
                    }
                } else if (S.method === "notify.send") {
                    let k = await hg(S.params, {
                        paths: u,
                        bus: l,
                        sessionKey: $.session_key,
                        sessionContextKind: $.session_context_kind,
                        jobScheduleType: $.job_schedule_type
                    });
                    k.startsWith("Error:") || e.sessionManager?.markAgentNotified($.session_key), C.result = {
                        output: k
                    }
                } else if (S.method === "wake.set") {
                    let k = await pg(S.params, {
                        paths: u,
                        sessionKey: $.session_key,
                        sessionContextKind: $.session_context_kind
                    });
                    C.result = {
                        output: k
                    }
                } else {
                    let k = await fg(S.params, {
                        paths: u,
                        sessionKey: $.session_key,
                        getSessionStatus: L => e.sessionManager?.listActors().get(L)?.status
                    });
                    C.result = {
                        output: k
                    }
                }
            } else if (S.method === "session.model") {
                if (!N0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await byt(d, j, k)
            } else if (S.method === "session.effort") {
                if (!D0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await vyt(d, j, k)
            } else if (S.method === "session.compact") {
                if (!M0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await wyt(u, l, d, j, k)
            } else if (S.method === "session.config") {
                if (!j0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await kyt(u, d, k)
            } else if (S.method === "channel.spawn") {
                if (!W0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                C.result = await Tyt(u, k)
            } else if (S.method === "channel.ingress") {
                if (!z0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                if (w0e("channel.ingress", k, D), or(k.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${k.session_key}`
                }, C;
                let L = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    B = await S0e({
                        paths: u,
                        sessionKey: k.session_key,
                        cwdAbs: k.cwd_abs,
                        channelKind: L,
                        channelId: k.channel_id
                    });
                if (!B.ok) return C.error = {
                    code: -32010,
                    message: B.guidance
                }, C;
                let G = await Zle(u, {
                    sessionKey: k.session_key,
                    sourceKind: L,
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
                    gatewayCommands: j
                });
                k.channel_id && await rt(u, k.session_key, {
                    source_channel_id: k.channel_id
                }), fo("ingress_received", G.event.id, {
                    sessionKey: k.session_key
                }), G.routing.enqueued && l.emit("session.wake", {
                    sessionKey: k.session_key,
                    displayName: k.display_name,
                    preempt: SJ(k.text)
                });
                let ce = Lw(L) ? B.effectiveConfig?.kind_config : void 0,
                    J = {
                        event_id: G.event.id,
                        gateway_response: G.gatewayResponse,
                        outbox_id: G.gatewayOutboxId,
                        ...ce ? {
                            kind_config: ce
                        } : {}
                    };
                C.result = J
            } else if (S.method === "channel.command") {
                if (!B0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                if (w0e("channel.command", k, D), or(k.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${k.session_key}`
                }, C;
                let L = k.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    B = await S0e({
                        paths: u,
                        sessionKey: k.session_key,
                        cwdAbs: k.cwd_abs,
                        channelKind: L,
                        channelId: k.channel_id
                    });
                if (!B.ok) return C.error = {
                    code: -32010,
                    message: B.guidance
                }, C;
                let G = await $b(u, {
                    sessionKey: k.session_key,
                    sourceKind: L,
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
                    gatewayCommands: j
                });
                G.routing.enqueued && l.emit("session.wake", {
                    sessionKey: k.session_key,
                    preempt: SJ(k.command)
                }), C.result = {
                    event_id: G.event.id,
                    gateway_response: G.gatewayResponse,
                    outbox_id: G.gatewayOutboxId
                }
            } else if (S.method === "channel.file.upload") {
                if (!U0(S.params)) throw new qt("Invalid params");
                let k = S.params,
                    L = await ebe(u, k.session_key, k.name, k.mime, k.content_base64, {
                        receivedVia: D?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: D?.wsSubscriberId
                    });
                C.result = L
            } else if (S.method === "channel.file.download") {
                if (!q0(S.params)) throw new qt("Invalid params");
                let k = S.params,
                    L = await tbe(k.path);
                C.result = {
                    content_base64: L
                }
            } else if (S.method === "channel.pull") {
                if (!_m(S.params)) throw new qt("Invalid params");
                let k = S.params,
                    L = k.consumer_id.trim(),
                    B = _J(k.return_mask),
                    G = B.includes("final");
                if (D?.wsSubscriberId) return await uyt({
                    paths: u,
                    sessionKey: k.session_key,
                    declaredBy: L,
                    capabilities: k.channel_capabilities
                }), C.result = {
                    opened: !0,
                    session_key: k.session_key,
                    consumer_id: L,
                    cursor: k.cursor,
                    return_mask: B
                }, C;
                let ce = G ? await Pw({
                    paths: u,
                    sessionKey: k.session_key,
                    consumerId: L,
                    limit: k.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: k.cursor
                }) : [];
                C.result = {
                    session_key: k.session_key,
                    consumer_id: L,
                    return_mask: B,
                    records: ce,
                    next_cursor: ce.length > 0 ? ce[ce.length - 1].id : void 0,
                    idle: ce.length === 0
                }
            } else if (S.method === "channel.ack") {
                if (!V0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                if (or(k.session_key)) return C.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${k.session_key}`
                }, C;
                let L = k.consumer_id.trim(),
                    B = k.cursor.trim(),
                    G = k.session_key.indexOf(":"),
                    ce = G > 0 ? k.session_key.slice(0, G) : null,
                    J = null;
                if (ce && (J = await La(u, ce, B)), !J || J.session_key !== k.session_key) {
                    let le = await ple(u, k.session_key, B);
                    return le ? (await zV(u, k.session_key, L, le), C.result = {
                        session_key: k.session_key,
                        consumer_id: L,
                        committed_cursor: le.id,
                        committed: !0
                    }, C) : (C.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, C)
                }
                let ee = await ea(u, B);
                if (!ee) try {
                    await jR(u, k.session_key), ee = await ea(u, B)
                } catch {}
                ee ? await k_e(u, k.session_key, L, ee) : await zV(u, k.session_key, L, J), C.result = {
                    session_key: k.session_key,
                    consumer_id: L,
                    committed_cursor: J.id,
                    committed: !0
                }
            } else if (S.method === "job.create") {
                if (!J0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                await c.init(), await c.createJob(k.id, {
                    cron: k.cron,
                    owner_session: k.owner_session,
                    cwd_rel: k.cwd_rel,
                    runtime: Co()
                }, k.instruction);
                let L = createSpineEvent({
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
                await atomicAppendEvent(u, L), C.result = {
                    id: k.id,
                    cron: k.cron
                }
            } else if (S.method === "job.get") {
                if (!Z0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                await c.init();
                let L = await c.getWakeRecord(k.id).catch(() => null);
                if (L) return C.result = {
                    kind: "active",
                    type: "wake",
                    id: L.id,
                    owner_session: L.frontmatter.owner_session,
                    run_at: L.state.run_at ?? null,
                    created_at: L.frontmatter.created_at,
                    content: L.context
                }, C;
                let B = await c.classifyActiveJob(k.id);
                if (B.kind === "active") C.result = {
                    ...Af(B.job),
                    kind: "active"
                };
                else if (B.kind === "invalid") C.error = {
                    code: bm.INVALID_ACTIVE,
                    message: `Job '${k.id}' active job file exists but is invalid: ${B.reason}`
                };
                else {
                    let G = await c.getArchivedJob(k.id);
                    G ? C.result = {
                        ...Af(G),
                        kind: "archived",
                        archived: !0
                    } : C.error = {
                        code: bm.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (S.method === "job.list") {
                if (!G0(S.params)) throw new qt("Invalid params");
                await c.init();
                let k = Mye(await c.listJobs()).map(G => ({
                        type: "job",
                        ...G
                    })),
                    L = (await c.listWakeRecords()).map(G => ({
                        type: "wake",
                        id: G.id,
                        owner_session: G.frontmatter.owner_session,
                        run_at: G.state.run_at ?? null,
                        created_at: G.frontmatter.created_at
                    }));
                S.params?.summary ? C.result = {
                    jobs: [...k.map(({
                        content: G,
                        path: ce,
                        ...J
                    }) => J), ...L]
                } : C.result = {
                    jobs: [...k, ...L]
                }
            } else if (S.method === "job.archive") {
                if (!K0(S.params)) throw new qt("Invalid params");
                let k = S.params;
                await c.init();
                let L = await c.getJob(k.id),
                    B = await c.archiveJob(k.id),
                    G = L?.session_key ?? vc({
                        jobId: k.id,
                        cron: L?.frontmatter.cron,
                        cwdRel: L?.frontmatter.cwd_rel
                    });
                await ab(u, G), C.result = {
                    id: k.id,
                    archived: !0,
                    session_key: G,
                    sidecar_orphan_path: B.sidecarOrphanPath ?? null
                }
            } else if (S.method === "job.reschedule") {
                if (!Y0(S.params)) throw new qt("Invalid params");
                let k = S.params,
                    L = k.when.trim();
                if (!L) throw new qt("job.reschedule requires a non-empty 'when': '@in <duration>' (e.g. '@in 30m') or a future ISO 8601 timestamp with an explicit zone.");
                await c.init();
                let B = await c.getJob(k.id),
                    G = await c.rescheduleJob(k.id, L);
                C.result = {
                    id: k.id,
                    run_at: G,
                    cron: B?.frontmatter.cron ?? null
                }
            } else if (S.method === "job.interrupt") {
                if (!X0(S.params)) throw new qt("Invalid params");
                let k = S.params,
                    L = k.reason.trim();
                if (!L) throw new qt("job.interrupt requires a non-empty 'reason' — it is what the interrupted session is told.");
                await c.init();
                let B = await c.getJob(k.id) ?? await c.getArchivedJob(k.id);
                if (!B) C.error = {
                    code: bm.NOT_FOUND,
                    message: `Job '${k.id}' not found`
                };
                else if (!e.sessionManager) C.error = {
                    code: -32603,
                    message: "Internal error",
                    data: "session manager unavailable"
                };
                else {
                    await rt(u, B.session_key, {
                        pending_gateway_notice: {
                            source: "gateway_command",
                            command: `job interrupt ${k.id}`,
                            command_name: "interrupt",
                            result_summary: L,
                            created_at: new Date().toISOString()
                        }
                    });
                    let G = await e.sessionManager.interruptSession(B.session_key);
                    G.interrupted || await No(u, B.session_key, "pending_gateway_notice").catch(() => {}), C.result = {
                        id: k.id,
                        session_key: B.session_key,
                        interrupted: G.interrupted,
                        outcome: G.reason
                    }
                }
            } else if (S.method === "usage.get") {
                let k = S.params,
                    L = typeof k?.session_key == "string" ? k.session_key : void 0,
                    B = typeof k?.mode == "string" ? k.mode : void 0,
                    G;
                if (k?.since !== void 0 && (G = new Date(k.since), isNaN(G.getTime()) && (G = void 0)), B === "totals") {
                    let ce = await readGlobalUsageTotals(u, G);
                    C.result = {
                        totals: ce
                    }
                } else if (L) {
                    let ce = await readDrainRecords(u, L, G),
                        J = summarizeDrainRecords(ce);
                    C.result = {
                        sessions: {
                            [L]: {
                                summary: J,
                                records: ce
                            }
                        }
                    }
                } else {
                    let ce = await readAllSessionSummaries(u, G),
                        J = {};
                    for (let [ee, le] of Object.entries(ce)) J[ee] = {
                        summary: le
                    };
                    C.result = {
                        sessions: J
                    }
                }
            } else if (S.method === "system.status") {
                if (!Q0(S.params)) throw new qt("Invalid params");
                let [k, L] = await Promise.all([db(u), yg(u)]), B = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, G = e.sessionManager?.listActors(), ce = new Set, J = [], ee = ue => {
                    let $e = ue?.last_served_model ?? null,
                        se = ue?.model ?? null;
                    return {
                        served: $e,
                        pending: se !== null && se !== $e ? se : null
                    }
                }, le = async ue => lr(ue) !== "channel" ? {} : {
                    last_cursor_advance_at: await I$(u, ue),
                    final_subscriber_count: h.finalSubscriberCount(ue)
                };
                if (G)
                    for (let [ue, $e] of G) {
                        if ($e.status === "ended" || !NV(ue)) continue;
                        ce.add(ue);
                        let se = d.get(ue);
                        J.push({
                            session_key: ue,
                            display_name: se?.display_name ?? null,
                            status: $e.status,
                            health: se?.last_error ? "error" : $e.health,
                            last_event_at: se?.last_event_at ?? null,
                            created_at: se?.created_at ?? null,
                            cwd: se?.cwd ?? null,
                            last_error: se?.last_error ?? null,
                            runtime: $e.runtime,
                            model: ee(se),
                            in_flight_tools: $e.activeToolCalls.length > 0 ? $e.activeToolCalls.map(N => ({
                                tool_name: N.toolName,
                                started_at: new Date(N.startedAtMs).toISOString()
                            })) : void 0,
                            ...await le(ue)
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
                    model: ee(ue),
                    ...await le(ue.session_key)
                });
                let M = {
                    health: {
                        gateway: k?.health?.gateway ?? "down",
                        meta_session: k?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: k?.cadence?.mode ?? "unknown",
                        last_tick: k?.cadence?.last_tick ?? null,
                        interval_ms: B
                    },
                    sessions: J,
                    subconscious: {
                        partitions: L.items.map(ue => ({
                            name: ue.name,
                            done: ue.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(u)
                };
                C.result = M
            } else if (S.method === "system.config") {
                if (!eR(S.params)) throw new qt("Invalid params");
                C.result = await iyt(u)
            } else if (S.method === "spine.tail") {
                if (!tR(S.params)) throw new qt("Invalid params");
                let k = S.params ?? {},
                    L = await nve(u, {
                        limit: k.limit,
                        after_id: k.after_id
                    });
                C.result = L
            } else C.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (k) {
            k instanceof qt ? C.error = {
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
        readOnly: A,
        bearerToken: C
    }) => {
        if (C) {
            let $ = qS.createHash("sha256").update(C).digest();
            S.addHook("onRequest", async (j, k) => {
                let L = j.url ?? "";
                if (!(L.startsWith("/rpc") || L.startsWith("/ws"))) return;
                let B = j.headers.authorization,
                    G = typeof B == "string" && B.startsWith("Bearer ") ? B.slice(7).trim() : "";
                if (!G) return Z("[daemon] rejected request: missing/invalid bearer", {
                    url: L
                }), a(j, k);
                let ce = qS.createHash("sha256").update(G).digest();
                if (!qS.timingSafeEqual(ce, $)) return Z("[daemon] rejected request: bearer mismatch", {
                    url: L
                }), a(j, k)
            })
        }
        D && S.addHook("onRequest", async ($, j) => {
            let k = $.url ?? "";
            if (!(k.startsWith("/rpc") || k.startsWith("/ws"))) return;
            let B = $.headers.host,
                G = B ? Pyt(B) : null;
            if (!G || !i.has(G)) return Z("[daemon] rejected request: Host header not allowed", {
                url: k,
                host: B ?? null
            }), s($, j, "Host header not allowed");
            let ce = $.headers.origin;
            if (ce !== void 0) {
                let J = Cyt(ce);
                if (!J || !i.has(J)) return Z("[daemon] rejected request: Origin not allowed", {
                    url: k,
                    origin: ce
                }), s($, j, "Origin not allowed")
            }
        }), A ? S.get("/ws", async ($, j) => (Z("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: $.ip,
            user_agent: $.headers["user-agent"] ?? null
        }), j.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: u.daemonSocketPath
        }))) : S.register(I0e.default), S.get("/healthz", async () => Yle()), S.get("/dashboard", async ($, j) => {
            let k = ro.join(u.bootstrapDir, "dashboard.html");
            try {
                let L = await Ms.readFile(k, "utf8");
                return j.type("text/html").send(L)
            } catch {
                return j.code(404).send("Dashboard not found")
            }
        }), S.get("/readyz", async ($, j) => await Kle(u) ? {
            status: "ok"
        } : j.code(503).send({
            status: "not_ready"
        })), S.post("/rpc", async ($, j) => {
            let k = $.body;
            if (!eb(k)) return Z("[daemon] invalid JSON-RPC request"), j.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if (A && !Xgt.has(k.method)) return Z("[daemon] rejected write method on read-only port", {
                method: k.method,
                id: k.id ?? null
            }), j.code(200).send({
                jsonrpc: "2.0",
                id: k.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let L = await E(k),
                B = L.__triggerShutdown;
            B && delete L.__triggerShutdown, await j.code(200).send(L), B && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), A || S.register(async function($) {
            $.get("/ws", {
                websocket: !0
            }, j => {
                let k = `ws_${++g}`,
                    L = null,
                    B = "",
                    G = null;
                Q("[daemon] ws connected", {
                    subscriberId: k
                });
                let ce = (le, M = !0) => {
                        let ue = le.method === "session.output" ? le.params?.record?.id : void 0;
                        if (!(G && ue && G.has(ue))) {
                            try {
                                j.send(JSON.stringify(le))
                            } catch ($e) {
                                throw $e instanceof Error ? $e : new Error(String($e))
                            }
                            if (G && ue && G.add(ue), M && le.method === "session.output") {
                                let {
                                    session_key: $e,
                                    record: se
                                } = le.params;
                                if (!B) return;
                                let N = B,
                                    q = (b.get(k) ?? Promise.resolve()).then(() => FV(u, $e, N, se).catch(Y => {
                                        Z("[daemon] failed to advance delivery cursor", {
                                            subscriberId: k,
                                            sessionKey: $e,
                                            consumerId: N,
                                            error: String(Y)
                                        })
                                    }));
                                b.set(k, q), q.then(() => {
                                    b.get(k) === q && b.delete(k)
                                })
                            }
                        }
                    },
                    J = async le => {
                        let M;
                        try {
                            M = JSON.parse(le.toString())
                        } catch {
                            j.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32700,
                                    message: "Parse error"
                                }
                            }));
                            return
                        }
                        if (!eb(M)) {
                            j.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: null,
                                error: {
                                    code: -32600,
                                    message: "Invalid Request"
                                }
                            }));
                            return
                        }
                        let ue = await E(M, {
                                wsSubscriberId: k
                            }),
                            $e = null,
                            se = "",
                            N;
                        if (M.method === "channel.pull" && ue.result && !ue.error && _m(M.params)) {
                            let q = M.params,
                                Y = q.session_key,
                                Se = q.consumer_id.trim(),
                                ye = _J(q.return_mask);
                            L && h.unsubscribe(k), L = Y, B = Se, $e = Y, se = Se, N = q.cursor, Q("[daemon] ws pull stream opened", {
                                subscriberId: k,
                                sessionKey: Y,
                                consumerId: Se
                            }), G = new Set, h.subscribe({
                                id: k,
                                sessionKey: Y,
                                returnMask: ye,
                                acceptStreamEndReasons: q.channel_capabilities?.outbound?.accept_stream_end_reasons,
                                send: Be => ce(Be),
                                close: () => {
                                    try {
                                        j.close()
                                    } catch {}
                                }
                            })
                        }
                        if ($e) {
                            let q = _m(M.params) ? M.params : void 0;
                            if (!_J(q?.return_mask).includes("final")) {
                                G = null, j.send(JSON.stringify(ue));
                                return
                            }
                            let ye = $e,
                                Be = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                                w = Number.isFinite(Be) ? Be : 0;
                            try {
                                let P = await E_e({
                                    paths: u,
                                    sessionKey: ye,
                                    consumerId: se,
                                    limit: w,
                                    cursorOverride: N,
                                    send: z => ce(z, !1),
                                    onDelivered: async z => {
                                        await FV(u, ye, se, z);
                                        let F = await La(u, z.channel_kind, z.id);
                                        F && F.status !== "sent" && await Xd(u, F, {
                                            status: "sent"
                                        }), await qm(u, z.id)
                                    }
                                });
                                P > 0 && Ee("[daemon] replayed outbox backlog", {
                                    subscriberId: k,
                                    sessionKey: ye,
                                    consumerId: se,
                                    replayed: P
                                })
                            } catch (P) {
                                Z("[daemon] backlog replay failed", {
                                    subscriberId: k,
                                    sessionKey: ye,
                                    consumerId: se,
                                    error: String(P)
                                })
                            }
                            G = null
                        }
                        let U = ue.__triggerShutdown;
                        U && delete ue.__triggerShutdown, j.send(JSON.stringify(ue)), U && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                    };
                j.on("message", le => {
                    let M = J(le).catch(se => {
                            Z("[daemon] ws message handler failed", {
                                subscriberId: k,
                                error: String(se)
                            })
                        }),
                        ue = _.get(k) ?? Promise.resolve(),
                        $e = Promise.all([ue, M]).then(() => {});
                    _.set(k, $e), $e.then(() => {
                        _.get(k) === $e && _.delete(k)
                    })
                });
                let ee = () => {
                    L && h.unsubscribe(k)
                };
                j.on("close", () => {
                    ee(), Q("[daemon] ws closed", {
                        subscriberId: k,
                        sessionKey: L
                    })
                }), j.on("error", () => {
                    ee(), Z("[daemon] ws error", {
                        subscriberId: k,
                        sessionKey: L
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
                let $ = await f6(u);
                if (!$.acquired) throw new Error(`Runtime lock already held by pid=${$.lock?.pid??"unknown"} at ${$.lockPath}`)
            }
            y = !0;
            let A = !1;
            try {
                let j = Buffer.byteLength(x);
                if (j > 104) throw new Error(`daemon socket path is too long (${j} bytes > 104-byte unix-socket limit): ${x}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let k = ro.dirname(x),
                    L;
                try {
                    L = await Ms.stat(k)
                } catch (J) {
                    throw new Error(`daemon socket directory is not accessible: ${k} (${String(J)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let B = process.getuid?.(),
                    G = L.mode & 511;
                if (G !== 448 || B !== void 0 && L.uid !== B) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${G.toString(8)}, uid ${L.uid}): ${k}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
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
                }), A = !0, await Ms.chmod(x, 384), await t.listen({
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
                }), wt("info", `[daemon] remote full-access listener on ${D.host}:${D.port} (bearer-gated)`))
            } catch ($) {
                throw await t.close().catch(() => {}), await n.close().catch(() => {}), r && (await r.close().catch(() => {}), r = null), A && await Ms.unlink(x).catch(() => {}), y && (await B$(u), y = !1), $
            }
            let C = T0e("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            v = setInterval(() => {
                eve(u).catch(() => {})
            }, C), v.unref?.()
        },
        async stop() {
            h.stop();
            let S = [t.close(), n.close()];
            r && S.push(r.close()), await Promise.all(S), r = null, await Promise.allSettled(_.values()), await Promise.allSettled(b.values()), await Ms.unlink(x).catch(() => {}), v && (clearInterval(v), v = null), y && (await B$(u), y = !1)
        }
    }
}
