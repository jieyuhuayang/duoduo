// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Sst, daemon.pretty.js:81955)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, EC.default)({
            logger: !1
        }),
        n = (0, EC.default)({
            logger: !1
        }),
        r = null,
        i = new Set(["127.0.0.1", "localhost", "::1"]),
        o = (S, w, C, O, A) => {
            if (String(S.headers.upgrade ?? "").toLowerCase() === "websocket") {
                w.hijack();
                let P = w.raw.socket ?? S.raw.socket;
                P && !P.destroyed && (P.write(`HTTP/1.1 ${C} ${O}\r
Connection: close\r
Content-Length: 0\r
\r
`), P.destroy());
                return
            }
            return w.code(C).send(A)
        },
        s = (S, w, C) => o(S, w, 403, "Forbidden", {
            error: "forbidden",
            reason: C
        }),
        a = (S, w) => o(S, w, 401, "Unauthorized", {
            error: "unauthorized"
        }),
        {
            paths: l,
            bus: u
        } = e,
        c = new xo(l),
        d = e.sessionIndex ?? wce();
    yie((S, w) => {
        if (w === "removed") {
            d.remove(S);
            return
        }
        Oi(S, async () => {
            if (!hr(S)) try {
                let [C, O] = await Promise.all([It(l, S), xs(l, S)]);
                jU(d, S, C, O)
            } catch {}
        }).catch(() => {})
    }), kte(S => {
        d.remove(S)
    });
    let m = {
            version: Fot(import.meta.url)("../../package.json").version,
            runtime_id: Qot(l.runtimeDir),
            runtime_mode: "host",
            runtime_dir: Ui.resolve(l.runtimeDir),
            work_dir: Ui.resolve(l.workDir),
            kernel_dir: Ui.resolve(l.kernelDir)
        },
        h = e.subscriptions ?? zU();
    h.start(u);
    let y = 0,
        _ = !1,
        k = null,
        v = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function b(S, w) {
        (v.has(S.method) ? wte : Ae)("[daemon] rpc request", {
            id: S.id ?? null,
            method: S.method,
            session_key: typeof S.params == "object" && S.params !== null ? S.params.session_key : void 0,
            ws: !!w?.wsSubscriberId
        });
        let O = {
                jsonrpc: "2.0",
                id: S.id ?? null
            },
            A = {
                cancelSession: async x => {
                    if (!e.sessionManager) return {
                        interrupted: !1,
                        reason: "session_manager_unavailable"
                    };
                    let P = await e.sessionManager.interruptSession(x);
                    return {
                        interrupted: P.interrupted,
                        reason: P.reason
                    }
                },
                clearSession: async x => e.sessionManager ? e.sessionManager.clearSdkSession(x) : {
                    cleared: !1,
                    reason: "session_manager_unavailable"
                },
                listActors: () => {
                    if (!e.sessionManager) return new Map;
                    let x = e.sessionManager.listActors(),
                        P = new Map;
                    for (let [M, j] of x) P.set(M, {
                        sessionKey: j.sessionKey,
                        status: j.status,
                        health: j.health,
                        idleSince: j.idleSince,
                        origin: j.origin
                    });
                    return P
                },
                listPersistentSessions: () => d.listUserVisible().map(x => ({
                    session_key: x.session_key,
                    cwd: x.cwd,
                    created_at: x.created_at,
                    last_event_at: x.last_event_at,
                    last_error: x.last_error
                })),
                getSessionModel: async (x, P) => e.sessionManager ? e.sessionManager.getSessionModelView(x, P) : {
                    runtime: "claude",
                    hasLiveQuery: !1
                },
                setSessionModel: async (x, P, M) => e.sessionManager ? e.sessionManager.setSessionModel(x, P, M) : {
                    ok: !1,
                    reason: "not_running"
                },
                getSessionEffort: async x => e.sessionManager ? e.sessionManager.getSessionEffortView(x) : {
                    runtime: "claude",
                    hasLiveQuery: !1
                },
                setSessionEffort: async (x, P) => e.sessionManager ? e.sessionManager.setSessionEffort(x, P) : {
                    ok: !1,
                    reason: "not_running"
                }
            };
        try {
            if (S.method === "system.shutdown") O.result = {
                ok: !0
            }, O.__triggerShutdown = !0;
            else if (S.method === "system.runtime.info") {
                if (!_x(S.params)) throw new $n("Invalid params");
                if (!yx(m)) throw new Error("invalid runtime info");
                let x = S.params ?? {};
                if (x.source_kind) {
                    let M = {
                        new_session_workspace: (await Ed(l, {
                            channel_kind: x.source_kind
                        }))?.new_session_workspace
                    };
                    O.result = {
                        ...m,
                        channel_defaults: M
                    }
                } else O.result = m
            } else if (S.method === "channel.describe") {
                if (!$x(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await rst(l, d, x)
            } else if (S.method === "session.archive") {
                if (!bx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await ist(l, e.sessionManager, d, x)
            } else if (S.method === "session.list") {
                if (!vx(S.params)) throw new $n("Invalid params");
                let x = S.params ?? {};
                O.result = await ast(d, c, x)
            } else if (S.method === "session.set_alias") {
                if (!wx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await lst(l, d, x)
            } else if (S.method === "session.notify") {
                if (!Sx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await ust(l, u, d, x)
            } else if (S.method === "session.compact") {
                if (!kx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await cst(l, u, d, A, x)
            } else if (S.method === "session.config") {
                if (!xx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await fst(l, d, x)
            } else if (S.method === "channel.spawn") {
                if (!Ax(S.params)) throw new $n("Invalid params");
                let x = S.params;
                O.result = await yst(l, x)
            } else if (S.method === "channel.ingress") {
                if (!Tx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                if (tbe("channel.ingress", x, w), hr(x.session_key)) return O.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, O;
                let P = x.source_kind ?? (w?.wsSubscriberId ? "ws" : "rpc"),
                    M = await nbe({
                        paths: l,
                        sessionKey: x.session_key,
                        cwdAbs: x.cwd_abs,
                        channelKind: P,
                        channelId: x.channel_id
                    });
                if (!M.ok) return O.error = {
                    code: -32010,
                    message: M.guidance
                }, O;
                let j = await uoe(l, {
                    sessionKey: x.session_key,
                    sourceKind: P,
                    sourceName: x.channel_id ?? w?.wsSubscriberId,
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
                    bus: u,
                    gatewayCommands: A
                });
                x.channel_id && await ut(l, x.session_key, {
                    source_channel_id: x.channel_id
                }), Yi("ingress_received", j.event.id, {
                    sessionKey: x.session_key
                }), j.routing.enqueued && u.emit("session.wake", {
                    sessionKey: x.session_key,
                    displayName: x.display_name,
                    preempt: JB(x.text)
                }), O.result = {
                    event_id: j.event.id,
                    gateway_response: j.gatewayResponse,
                    outbox_id: j.gatewayOutboxId
                }
            } else if (S.method === "channel.command") {
                if (!Cx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                if (tbe("channel.command", x, w), hr(x.session_key)) return O.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, O;
                let P = x.source_kind ?? (w?.wsSubscriberId ? "ws" : "rpc"),
                    M = await nbe({
                        paths: l,
                        sessionKey: x.session_key,
                        cwdAbs: x.cwd_abs,
                        channelKind: P,
                        channelId: x.channel_id
                    });
                if (!M.ok) return O.error = {
                    code: -32010,
                    message: M.guidance
                }, O;
                let j = await a_(l, {
                    sessionKey: x.session_key,
                    sourceKind: P,
                    sourceName: x.channel_id ?? w?.wsSubscriberId,
                    sourceChannelId: x.channel_id,
                    command: x.command,
                    dedupSourceId: x.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: u,
                    gatewayCommands: A
                });
                j.routing.enqueued && u.emit("session.wake", {
                    sessionKey: x.session_key,
                    preempt: JB(x.command)
                }), O.result = {
                    event_id: j.event.id,
                    gateway_response: j.gatewayResponse,
                    outbox_id: j.gatewayOutboxId
                }
            } else if (S.method === "channel.file.upload") {
                if (!Ix(S.params)) throw new $n("Invalid params");
                let x = S.params,
                    P = await zue(l, x.session_key, x.name, x.mime, x.content_base64, {
                        receivedVia: w?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: w?.wsSubscriberId
                    });
                O.result = P
            } else if (S.method === "channel.file.download") {
                if (!Px(S.params)) throw new $n("Invalid params");
                let x = S.params,
                    P = await Uue(x.path);
                O.result = {
                    content_base64: P
                }
            } else if (S.method === "channel.pull") {
                if (!mp(S.params)) throw new $n("Invalid params");
                let x = S.params,
                    P = x.consumer_id.trim(),
                    M = VB(x.return_mask),
                    j = M.includes("final");
                if (w?.wsSubscriberId) return await Xot({
                    paths: l,
                    sessionKey: x.session_key,
                    declaredBy: P,
                    capabilities: x.channel_capabilities
                }), O.result = {
                    opened: !0,
                    session_key: x.session_key,
                    consumer_id: P,
                    cursor: x.cursor,
                    return_mask: M
                }, O;
                let H = j ? await VU({
                    paths: l,
                    sessionKey: x.session_key,
                    consumerId: P,
                    limit: x.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: x.cursor
                }) : [];
                O.result = {
                    session_key: x.session_key,
                    consumer_id: P,
                    return_mask: M,
                    records: H,
                    next_cursor: H.length > 0 ? H[H.length - 1].id : void 0,
                    idle: H.length === 0
                }
            } else if (S.method === "channel.ack") {
                if (!Ox(S.params)) throw new $n("Invalid params");
                let x = S.params;
                if (hr(x.session_key)) return O.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, O;
                let P = x.consumer_id.trim(),
                    M = x.cursor.trim(),
                    j = x.session_key.indexOf(":"),
                    H = j > 0 ? x.session_key.slice(0, j) : null,
                    J = null;
                if (H && (J = await pa(l, H, M)), !J || J.session_key !== x.session_key) {
                    let ie = await Pie(l, x.session_key, M);
                    return ie ? (await HU(l, x.session_key, P, ie), O.result = {
                        session_key: x.session_key,
                        consumer_id: P,
                        committed_cursor: ie.id,
                        committed: !0
                    }, O) : (O.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, O)
                }
                let ee = await Jo(l, M);
                if (!ee) try {
                    await b0(l, x.session_key), ee = await Jo(l, M)
                } catch {}
                ee ? await Lce(l, x.session_key, P, ee) : await HU(l, x.session_key, P, J), O.result = {
                    session_key: x.session_key,
                    consumer_id: P,
                    committed_cursor: J.id,
                    committed: !0
                }
            } else if (S.method === "job.create") {
                if (!Nx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                await c.init(), await c.createJob(x.id, {
                    cron: x.cron,
                    notify: x.notify,
                    owner_session: x.owner_session,
                    cwd_rel: x.cwd_rel
                }, x.instruction);
                let P = createSpineEvent({
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
                await atomicAppendEvent(l, P), O.result = {
                    id: x.id,
                    cron: x.cron
                }
            } else if (S.method === "job.get") {
                if (!Dx(S.params)) throw new $n("Invalid params");
                let x = S.params;
                await c.init();
                let P = await c.classifyActiveJob(x.id);
                if (P.kind === "active") O.result = {
                    ...Nd(P.job),
                    kind: "active"
                };
                else if (P.kind === "invalid") O.error = {
                    code: $y.INVALID_ACTIVE,
                    message: `Job '${x.id}' active job file exists but is invalid: ${P.reason}`
                };
                else {
                    let M = await c.getArchivedJob(x.id);
                    M ? O.result = {
                        ...Nd(M),
                        kind: "archived",
                        archived: !0
                    } : O.error = {
                        code: $y.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (S.method === "job.list") {
                if (!Mx(S.params)) throw new $n("Invalid params");
                await c.init();
                let x = Ffe(await c.listJobs());
                S.params?.summary ? O.result = {
                    jobs: x.map(({
                        content: M,
                        path: j,
                        ...H
                    }) => H)
                } : O.result = {
                    jobs: x
                }
            } else if (S.method === "usage.get") {
                let x = S.params,
                    P = typeof x?.session_key == "string" ? x.session_key : void 0,
                    M = typeof x?.mode == "string" ? x.mode : void 0,
                    j;
                if (x?.since !== void 0 && (j = new Date(x.since), isNaN(j.getTime()) && (j = void 0)), M === "totals") {
                    let H = await readGlobalUsageTotals(l, j);
                    O.result = {
                        totals: H
                    }
                } else if (P) {
                    let H = await readDrainRecords(l, P, j),
                        J = summarizeDrainRecords(H);
                    O.result = {
                        sessions: {
                            [P]: {
                                summary: J,
                                records: H
                            }
                        }
                    }
                } else {
                    let H = await readAllSessionSummaries(l, j),
                        J = {};
                    for (let [ee, ie] of Object.entries(H)) J[ee] = {
                        summary: ie
                    };
                    O.result = {
                        sessions: J
                    }
                }
            } else if (S.method === "system.status") {
                if (!jx(S.params)) throw new $n("Invalid params");
                let [x, P] = await Promise.all([Uy(l), Zm(l)]), M = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, j = e.sessionManager?.listActors(), H = new Set, J = [];
                if (j)
                    for (let [ie, re] of j) {
                        if (re.status === "ended" || !MU(ie)) continue;
                        H.add(ie);
                        let Ye = d.get(ie);
                        J.push({
                            session_key: ie,
                            display_name: Ye?.display_name ?? null,
                            status: re.status,
                            health: Ye?.last_error ? "error" : re.health,
                            last_event_at: Ye?.last_event_at ?? null,
                            created_at: Ye?.created_at ?? null,
                            cwd: Ye?.cwd ?? null,
                            last_error: Ye?.last_error ?? null,
                            runtime: re.runtime
                        })
                    }
                for (let ie of d.listUserVisible()) H.has(ie.session_key) || J.push({
                    session_key: ie.session_key,
                    display_name: ie.display_name ?? null,
                    status: "idle",
                    health: ie.last_error ? "error" : "ok",
                    last_event_at: ie.last_event_at ?? null,
                    created_at: ie.created_at ?? null,
                    cwd: ie.cwd ?? null,
                    last_error: ie.last_error ?? null
                });
                let ee = {
                    health: {
                        gateway: x?.health?.gateway ?? "down",
                        meta_session: x?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: x?.cadence?.mode ?? "unknown",
                        last_tick: x?.cadence?.last_tick ?? null,
                        interval_ms: M
                    },
                    sessions: J,
                    subconscious: {
                        partitions: P.items.map(ie => ({
                            name: ie.name,
                            done: ie.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(l)
                };
                O.result = ee
            } else if (S.method === "system.config") {
                if (!Lx(S.params)) throw new $n("Invalid params");
                O.result = await Zot(l)
            } else if (S.method === "spine.tail") {
                if (!Fx(S.params)) throw new $n("Invalid params");
                let x = S.params ?? {},
                    P = await Jfe(l, {
                        limit: x.limit,
                        after_id: x.after_id
                    });
                O.result = P
            } else O.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (x) {
            x instanceof $n ? O.error = {
                code: x.code,
                message: x.message
            } : O.error = {
                code: -32603,
                message: "Internal error",
                data: String(x)
            }
        }
        return O
    }
    let I = (S, {
        hostGuard: w,
        readOnly: C,
        bearerToken: O
    }) => {
        if (O) {
            let A = $v.createHash("sha256").update(O).digest();
            S.addHook("onRequest", async (x, P) => {
                let M = x.url ?? "";
                if (!(M.startsWith("/rpc") || M.startsWith("/ws"))) return;
                let j = x.headers.authorization,
                    H = typeof j == "string" && j.startsWith("Bearer ") ? j.slice(7).trim() : "";
                if (!H) return Z("[daemon] rejected request: missing/invalid bearer", {
                    url: M
                }), a(x, P);
                let J = $v.createHash("sha256").update(H).digest();
                if (!$v.timingSafeEqual(J, A)) return Z("[daemon] rejected request: bearer mismatch", {
                    url: M
                }), a(x, P)
            })
        }
        w && S.addHook("onRequest", async (A, x) => {
            let P = A.url ?? "";
            if (!(P.startsWith("/rpc") || P.startsWith("/ws"))) return;
            let j = A.headers.host,
                H = j ? _st(j) : null;
            if (!H || !i.has(H)) return Z("[daemon] rejected request: Host header not allowed", {
                url: P,
                host: j ?? null
            }), s(A, x, "Host header not allowed");
            let J = A.headers.origin;
            if (J !== void 0) {
                let ee = bst(J);
                if (!ee || !i.has(ee)) return Z("[daemon] rejected request: Origin not allowed", {
                    url: P,
                    origin: J
                }), s(A, x, "Origin not allowed")
            }
        }), C ? S.get("/ws", async (A, x) => (Z("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: A.ip,
            user_agent: A.headers["user-agent"] ?? null
        }), x.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: l.daemonSocketPath
        }))) : S.register(lbe.default), S.get("/healthz", async () => foe()), S.get("/dashboard", async (A, x) => {
            let P = Ui.join(l.bootstrapDir, "dashboard.html");
            try {
                let M = await ls.readFile(P, "utf8");
                return x.type("text/html").send(M)
            } catch {
                return x.code(404).send("Dashboard not found")
            }
        }), S.get("/readyz", async (A, x) => await doe(l) ? {
            status: "ok"
        } : x.code(503).send({
            status: "not_ready"
        })), S.post("/rpc", async (A, x) => {
            let P = A.body;
            if (!Oy(P)) return Z("[daemon] invalid JSON-RPC request"), x.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if (C && !qot.has(P.method)) return Z("[daemon] rejected write method on read-only port", {
                method: P.method,
                id: P.id ?? null
            }), x.code(200).send({
                jsonrpc: "2.0",
                id: P.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let M = await b(P),
                j = M.__triggerShutdown;
            j && delete M.__triggerShutdown, await x.code(200).send(M), j && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), C || S.register(async function(A) {
            A.get("/ws", {
                websocket: !0
            }, x => {
                let P = `ws_${++y}`,
                    M = null,
                    j = "",
                    H = new Set,
                    J = !1;
                K("[daemon] ws connected", {
                    subscriberId: P
                });
                let ee = (re, Ye = !0) => {
                    try {
                        x.send(JSON.stringify(re))
                    } catch (je) {
                        throw je instanceof Error ? je : new Error(String(je))
                    }
                    if (Ye && re.method === "session.output") {
                        let {
                            session_key: je,
                            record: Se
                        } = re.params;
                        if (!j) return;
                        BU(l, je, j, Se).catch(lt => {
                            Z("[daemon] failed to advance delivery cursor", {
                                subscriberId: P,
                                sessionKey: je,
                                consumerId: j,
                                error: String(lt)
                            })
                        })
                    }
                };
                x.on("message", async re => {
                    let Ye;
                    try {
                        Ye = JSON.parse(re.toString())
                    } catch {
                        x.send(JSON.stringify({
                            jsonrpc: "2.0",
                            id: null,
                            error: {
                                code: -32700,
                                message: "Parse error"
                            }
                        }));
                        return
                    }
                    if (!Oy(Ye)) {
                        x.send(JSON.stringify({
                            jsonrpc: "2.0",
                            id: null,
                            error: {
                                code: -32600,
                                message: "Invalid Request"
                            }
                        }));
                        return
                    }
                    let je = await b(Ye, {
                            wsSubscriberId: P
                        }),
                        Se = null,
                        lt = "",
                        Fe;
                    if (Ye.method === "channel.pull" && je.result && !je.error && mp(Ye.params)) {
                        let F = Ye.params,
                            L = F.session_key,
                            B = F.consumer_id.trim(),
                            te = VB(F.return_mask);
                        M && h.unsubscribe(P), M = L, j = B, Se = L, lt = B, Fe = F.cursor, K("[daemon] ws pull stream opened", {
                            subscriberId: P,
                            sessionKey: L,
                            consumerId: B
                        }), H = new Set, J = !0, h.subscribe({
                            id: P,
                            sessionKey: L,
                            returnMask: te,
                            acceptStreamEndReasons: F.channel_capabilities?.outbound?.accept_stream_end_reasons,
                            send: Le => {
                                if (J && Le.method === "session.output" && Le.params?.record?.id && H.has(Le.params.record.id)) {
                                    Ae("[daemon] suppressed duplicate output during replay window", {
                                        subscriberId: P,
                                        sessionKey: L,
                                        recordId: Le.params.record.id
                                    });
                                    return
                                }
                                ee(Le)
                            },
                            close: () => {
                                try {
                                    x.close()
                                } catch {}
                            }
                        })
                    }
                    if (Se) {
                        let F = mp(Ye.params) ? Ye.params : void 0;
                        if (!VB(F?.return_mask).includes("final")) {
                            J = !1, H.clear(), x.send(JSON.stringify(je));
                            return
                        }
                        let te = Se,
                            Le = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                            Re = Number.isFinite(Le) ? Le : 0;
                        try {
                            let We = await Fce({
                                paths: l,
                                sessionKey: te,
                                consumerId: lt,
                                limit: Re,
                                cursorOverride: Fe,
                                send: Be => ee(Be, !1),
                                onDelivered: async Be => {
                                    H.add(Be.id), await BU(l, te, lt, Be);
                                    let X = await pa(l, Be.channel_kind, Be.id);
                                    X && X.status !== "sent" && await nd(l, X, {
                                        status: "sent"
                                    }), await Fp(l, Be.id)
                                }
                            });
                            We > 0 && Ae("[daemon] replayed outbox backlog", {
                                subscriberId: P,
                                sessionKey: te,
                                consumerId: lt,
                                replayed: We
                            })
                        } catch (We) {
                            Z("[daemon] backlog replay failed", {
                                subscriberId: P,
                                sessionKey: te,
                                consumerId: lt,
                                error: String(We)
                            })
                        }
                        J = !1, H.clear()
                    }
                    let qe = je.__triggerShutdown;
                    qe && delete je.__triggerShutdown, x.send(JSON.stringify(je)), qe && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                });
                let ie = () => {
                    M && h.unsubscribe(P)
                };
                x.on("close", () => {
                    ie(), K("[daemon] ws closed", {
                        subscriberId: P,
                        sessionKey: M
                    })
                }), x.on("error", () => {
                    ie(), Z("[daemon] ws error", {
                        subscriberId: P,
                        sessionKey: M
                    })
                })
            })
        })
    };
    I(t, {
        hostGuard: !0,
        readOnly: !0
    }), I(n, {
        hostGuard: !1,
        readOnly: !1
    });
    let T = l.daemonSocketPath;
    return {
        app: t,
        socketApp: n,
        get remoteApp() {
            return r
        },
        bus: u,
        subscriptions: h,
        async start(S) {
            let w = resolveRemoteListenerConfig(process.env, S),
                C = await Bfe(l);
            if (!C.acquired) throw new Error(`Runtime lock already held by pid=${C.lock?.pid??"unknown"} at ${C.lockPath}`);
            _ = !0;
            let O = !1;
            try {
                let P = Buffer.byteLength(T);
                if (P > 104) throw new Error(`daemon socket path is too long (${P} bytes > 104-byte unix-socket limit): ${T}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let M = Ui.dirname(T),
                    j;
                try {
                    j = await ls.stat(M)
                } catch (ie) {
                    throw new Error(`daemon socket directory is not accessible: ${M} (${String(ie)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let H = process.getuid?.(),
                    J = j.mode & 511;
                if (J !== 448 || H !== void 0 && j.uid !== H) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${J.toString(8)}, uid ${j.uid}): ${M}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
                let ee = null;
                try {
                    ee = await ls.lstat(T)
                } catch {
                    ee = null
                }
                if (ee)
                    if (ee.isSocket()) await ls.unlink(T);
                    else throw new Error(`daemon socket path is occupied by a non-socket file: ${T}. Refusing to delete it — check ALADUO_DAEMON_SOCKET.`);
                await n.listen({
                    path: T
                }), O = !0, await ls.chmod(T, 384), await t.listen({
                    port: S,
                    host: "127.0.0.1"
                }), w.enabled && (r = (0, EC.default)({
                    logger: !1
                }), I(r, {
                    hostGuard: !1,
                    readOnly: !1,
                    bearerToken: w.token
                }), await r.listen({
                    port: w.port,
                    host: w.host
                }), Ct("info", `[daemon] remote full-access listener on ${w.host}:${w.port} (bearer-gated)`))
            } catch (x) {
                throw await t.close().catch(() => {}), await n.close().catch(() => {}), r && (await r.close().catch(() => {}), r = null), O && await ls.unlink(T).catch(() => {}), _ && (await Qq(l), _ = !1), x
            }
            let A = ube("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            k = setInterval(() => {
                Hfe(l).catch(() => {})
            }, A), k.unref?.()
        },
        async stop() {
            h.stop();
            let S = [t.close(), n.close()];
            r && S.push(r.close()), await Promise.all(S), r = null, await ls.unlink(T).catch(() => {}), k && (clearInterval(k), k = null), _ && (await Qq(l), _ = !1)
        }
    }
}
