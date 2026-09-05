// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Aut, daemon.pretty.js:83506)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, dO.default)({
            logger: !1
        }),
        n = (0, dO.default)({
            logger: !1
        }),
        r = null,
        i = new Set(["127.0.0.1", "localhost", "::1"]),
        o = (S, O, $, C, A) => {
            if (String(S.headers.upgrade ?? "").toLowerCase() === "websocket") {
                O.hijack();
                let P = O.raw.socket ?? S.raw.socket;
                P && !P.destroyed && (P.write(`HTTP/1.1 ${$} ${C}\r
Connection: close\r
Content-Length: 0\r
\r
`), P.destroy());
                return
            }
            return O.code($).send(A)
        },
        s = (S, O, $) => o(S, O, 403, "Forbidden", {
            error: "forbidden",
            reason: $
        }),
        a = (S, O) => o(S, O, 401, "Unauthorized", {
            error: "unauthorized"
        }),
        {
            paths: l,
            bus: u
        } = e,
        c = new _o(l),
        d = e.sessionIndex ?? Ime();
    Aoe((S, O) => {
        if (O === "removed") {
            d.remove(S);
            return
        }
        ki(S, async () => {
            if (!Xn(S)) try {
                let [$, C] = await Promise.all([ut(l, S), xs(l, S)]);
                q2(d, S, $, C)
            } catch {}
        }).catch(() => {})
    }), Fne(S => {
        d.remove(S)
    });
    let m = {
            version: Glt(import.meta.url)("../../package.json").version,
            runtime_id: lut(l.runtimeDir),
            runtime_mode: "host",
            runtime_dir: Di.resolve(l.runtimeDir),
            work_dir: Di.resolve(l.workDir),
            kernel_dir: Di.resolve(l.kernelDir)
        },
        h = e.subscriptions ?? W2();
    h.start(u);
    let g = 0,
        y = !1,
        w = null,
        v = new Map,
        b = new Map,
        R = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function I(S, O) {
        (R.has(S.method) ? One : ke)("[daemon] rpc request", {
            id: S.id ?? null,
            method: S.method,
            session_key: typeof S.params == "object" && S.params !== null ? S.params.session_key : void 0,
            ws: !!O?.wsSubscriberId
        });
        let C = {
                jsonrpc: "2.0",
                id: S.id ?? null
            },
            A;
        if (typeof S.params == "object" && S.params !== null && "worker_token" in S.params) {
            let {
                worker_token: P,
                ...z
            } = S.params;
            if (A = Kce(P), !A) return J("[daemon] rejected pi worker RPC: unknown token", {
                method: S.method
            }), C.error = {
                code: -32001,
                message: "invalid pi worker token"
            }, C;
            if (!Zce.has(S.method)) return J("[daemon] rejected pi worker RPC: method not whitelisted", {
                method: S.method,
                session_key: A.session_key
            }), C.error = {
                code: -32601,
                message: `Method not available to pi worker callers: ${S.method}`
            }, C;
            S.params = z
        }
        let j = {
            cancelSession: async P => {
                if (!e.sessionManager) return {
                    interrupted: !1,
                    reason: "session_manager_unavailable"
                };
                let z = await e.sessionManager.interruptSession(P);
                return {
                    interrupted: z.interrupted,
                    reason: z.reason
                }
            },
            clearSession: async P => e.sessionManager ? e.sessionManager.clearSdkSession(P) : {
                cleared: !1,
                reason: "session_manager_unavailable"
            },
            listActors: () => {
                if (!e.sessionManager) return new Map;
                let P = e.sessionManager.listActors(),
                    z = new Map;
                for (let [U, K] of P) z.set(U, {
                    sessionKey: K.sessionKey,
                    status: K.status,
                    health: K.health,
                    idleSince: K.idleSince,
                    origin: K.origin
                });
                return z
            },
            listPersistentSessions: () => d.listUserVisible().map(P => ({
                session_key: P.session_key,
                cwd: P.cwd,
                created_at: P.created_at,
                last_event_at: P.last_event_at,
                last_error: P.last_error
            })),
            getSessionModel: async (P, z) => e.sessionManager ? e.sessionManager.getSessionModelView(P, z) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionModel: async (P, z, U) => e.sessionManager ? e.sessionManager.setSessionModel(P, z, U) : {
                ok: !1,
                reason: "not_running"
            },
            getSessionEffort: async P => e.sessionManager ? e.sessionManager.getSessionEffortView(P) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionEffort: async (P, z) => e.sessionManager ? e.sessionManager.setSessionEffort(P, z) : {
                ok: !1,
                reason: "not_running"
            }
        };
        try {
            if (S.method === "system.shutdown") C.result = {
                ok: !0
            }, C.__triggerShutdown = !0;
            else if (S.method === "system.runtime.info") {
                if (!Vx(S.params)) throw new rn("Invalid params");
                if (!Hx(m)) throw new Error("invalid runtime info");
                let P = S.params ?? {};
                if (P.source_kind) {
                    let U = {
                        new_session_workspace: (await Vu(l, {
                            channel_kind: P.source_kind
                        }))?.new_session_workspace
                    };
                    C.result = {
                        ...m,
                        channel_defaults: U
                    }
                } else C.result = m
            } else if (S.method === "channel.describe") {
                if (!aE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await fut(l, d, P)
            } else if (S.method === "session.archive") {
                if (!Wx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await put(l, e.sessionManager, d, P)
            } else if (S.method === "session.list") {
                if (!Jx(S.params)) throw new rn("Invalid params");
                let P = S.params ?? {};
                C.result = await gut(d, c, P)
            } else if (S.method === "session.set_alias") {
                if (!Gx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await yut(l, d, P)
            } else if (S.method === "session.notify") {
                if (!Zx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await Rwe(l, u, d, P)
            } else if (S.method === "job.manage" || S.method === "session.manage" || S.method === "notify.send") {
                if (!A) return C.error = {
                    code: -32001,
                    message: `${S.method} requires a pi worker token`
                }, C;
                if (typeof S.params != "object" || S.params === null) throw new rn("Invalid params");
                if (S.method === "job.manage") {
                    let P = await th(S.params, {
                        paths: l,
                        sessionKey: A.session_key,
                        callerJobCron: A.job_cron,
                        callerRuntime: "pi",
                        bus: u
                    });
                    C.result = {
                        output: P
                    }
                } else if (S.method === "notify.send") {
                    let P = await rh(S.params, {
                        paths: l,
                        bus: u,
                        sessionKey: A.session_key,
                        sessionContextKind: A.session_context_kind,
                        jobScheduleType: A.job_schedule_type
                    });
                    P.startsWith("Error:") || e.sessionManager?.markAgentNotified(A.session_key), C.result = {
                        output: P
                    }
                } else {
                    let P = await nh(S.params, {
                        paths: l,
                        sessionKey: A.session_key,
                        getSessionStatus: z => e.sessionManager?.listActors().get(z)?.status
                    });
                    C.result = {
                        output: P
                    }
                }
            } else if (S.method === "session.model") {
                if (!Kx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await but(d, j, P)
            } else if (S.method === "session.effort") {
                if (!Yx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await vut(d, j, P)
            } else if (S.method === "session.compact") {
                if (!Xx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await wut(l, u, d, j, P)
            } else if (S.method === "session.config") {
                if (!Qx(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await kut(l, d, P)
            } else if (S.method === "channel.spawn") {
                if (!lE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                C.result = await Iut(l, P)
            } else if (S.method === "channel.ingress") {
                if (!nE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                if (gwe("channel.ingress", P, O), Xn(P.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${P.session_key}`
                }, C;
                let z = P.source_kind ?? (O?.wsSubscriberId ? "ws" : "rpc"),
                    U = await ywe({
                        paths: l,
                        sessionKey: P.session_key,
                        cwdAbs: P.cwd_abs,
                        channelKind: z,
                        channelId: P.channel_id
                    });
                if (!U.ok) return C.error = {
                    code: -32010,
                    message: U.guidance
                }, C;
                let K = await kse(l, {
                    sessionKey: P.session_key,
                    sourceKind: z,
                    sourceName: P.channel_id ?? O?.wsSubscriberId,
                    sourceChannelId: P.channel_id,
                    text: P.text ?? "",
                    attachments: P.attachments,
                    dedupSourceId: P.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: u,
                    gatewayCommands: j
                });
                P.channel_id && await Ye(l, P.session_key, {
                    source_channel_id: P.channel_id
                }), Bi("ingress_received", K.event.id, {
                    sessionKey: P.session_key
                }), K.routing.enqueued && u.emit("session.wake", {
                    sessionKey: P.session_key,
                    displayName: P.display_name,
                    preempt: l6(P.text)
                });
                let te = ev(z) ? U.effectiveConfig?.kind_config : void 0,
                    V = {
                        event_id: K.event.id,
                        gateway_response: K.gatewayResponse,
                        outbox_id: K.gatewayOutboxId,
                        ...te ? {
                            kind_config: te
                        } : {}
                    };
                C.result = V
            } else if (S.method === "channel.command") {
                if (!oE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                if (gwe("channel.command", P, O), Xn(P.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${P.session_key}`
                }, C;
                let z = P.source_kind ?? (O?.wsSubscriberId ? "ws" : "rpc"),
                    U = await ywe({
                        paths: l,
                        sessionKey: P.session_key,
                        cwdAbs: P.cwd_abs,
                        channelKind: z,
                        channelId: P.channel_id
                    });
                if (!U.ok) return C.error = {
                    code: -32010,
                    message: U.guidance
                }, C;
                let K = await h_(l, {
                    sessionKey: P.session_key,
                    sourceKind: z,
                    sourceName: P.channel_id ?? O?.wsSubscriberId,
                    sourceChannelId: P.channel_id,
                    command: P.command,
                    dedupSourceId: P.idempotency_key,
                    rawPayload: {
                        jsonrpc: S.jsonrpc,
                        method: S.method,
                        params: S.params
                    }
                }, {
                    bus: u,
                    gatewayCommands: j
                });
                K.routing.enqueued && u.emit("session.wake", {
                    sessionKey: P.session_key,
                    preempt: l6(P.command)
                }), C.result = {
                    event_id: K.event.id,
                    gateway_response: K.gatewayResponse,
                    outbox_id: K.gatewayOutboxId
                }
            } else if (S.method === "channel.file.upload") {
                if (!rE(S.params)) throw new rn("Invalid params");
                let P = S.params,
                    z = await Wpe(l, P.session_key, P.name, P.mime, P.content_base64, {
                        receivedVia: O?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: O?.wsSubscriberId
                    });
                C.result = z
            } else if (S.method === "channel.file.download") {
                if (!iE(S.params)) throw new rn("Invalid params");
                let P = S.params,
                    z = await Jpe(P.path);
                C.result = {
                    content_base64: z
                }
            } else if (S.method === "channel.pull") {
                if (!Pp(S.params)) throw new rn("Invalid params");
                let P = S.params,
                    z = P.consumer_id.trim(),
                    U = s6(P.return_mask),
                    K = U.includes("final");
                if (O?.wsSubscriberId) return await aut({
                    paths: l,
                    sessionKey: P.session_key,
                    declaredBy: z,
                    capabilities: P.channel_capabilities
                }), C.result = {
                    opened: !0,
                    session_key: P.session_key,
                    consumer_id: z,
                    cursor: P.cursor,
                    return_mask: U
                }, C;
                let te = K ? await Y2({
                    paths: l,
                    sessionKey: P.session_key,
                    consumerId: z,
                    limit: P.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: P.cursor
                }) : [];
                C.result = {
                    session_key: P.session_key,
                    consumer_id: z,
                    return_mask: U,
                    records: te,
                    next_cursor: te.length > 0 ? te[te.length - 1].id : void 0,
                    idle: te.length === 0
                }
            } else if (S.method === "channel.ack") {
                if (!sE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                if (Xn(P.session_key)) return C.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${P.session_key}`
                }, C;
                let z = P.consumer_id.trim(),
                    U = P.cursor.trim(),
                    K = P.session_key.indexOf(":"),
                    te = K > 0 ? P.session_key.slice(0, K) : null,
                    V = null;
                if (te && (V = await ha(l, te, U)), !V || V.session_key !== P.session_key) {
                    let X = await Voe(l, P.session_key, U);
                    return X ? (await K2(l, P.session_key, z, X), C.result = {
                        session_key: P.session_key,
                        consumer_id: z,
                        committed_cursor: X.id,
                        committed: !0
                    }, C) : (C.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, C)
                }
                let re = await Rs(l, U);
                if (!re) try {
                    await KE(l, P.session_key), re = await Rs(l, U)
                } catch {}
                re ? await Yme(l, P.session_key, z, re) : await K2(l, P.session_key, z, V), C.result = {
                    session_key: P.session_key,
                    consumer_id: z,
                    committed_cursor: V.id,
                    committed: !0
                }
            } else if (S.method === "job.create") {
                if (!uE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                await c.init(), await c.createJob(P.id, {
                    cron: P.cron,
                    owner_session: P.owner_session,
                    cwd_rel: P.cwd_rel,
                    runtime: ao()
                }, P.instruction);
                let z = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: P.id
                    },
                    payload: {
                        job_id: P.id,
                        cron: P.cron
                    }
                });
                await atomicAppendEvent(l, z), C.result = {
                    id: P.id,
                    cron: P.cron
                }
            } else if (S.method === "job.get") {
                if (!cE(S.params)) throw new rn("Invalid params");
                let P = S.params;
                await c.init();
                let z = await c.classifyActiveJob(P.id);
                if (z.kind === "active") C.result = {
                    ...Bd(z.job),
                    kind: "active"
                };
                else if (z.kind === "invalid") C.error = {
                    code: Fy.INVALID_ACTIVE,
                    message: `Job '${P.id}' active job file exists but is invalid: ${z.reason}`
                };
                else {
                    let U = await c.getArchivedJob(P.id);
                    U ? C.result = {
                        ...Bd(U),
                        kind: "archived",
                        archived: !0
                    } : C.error = {
                        code: Fy.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (S.method === "job.list") {
                if (!dE(S.params)) throw new rn("Invalid params");
                await c.init();
                let P = Zfe(await c.listJobs());
                S.params?.summary ? C.result = {
                    jobs: P.map(({
                        content: U,
                        path: K,
                        ...te
                    }) => te)
                } : C.result = {
                    jobs: P
                }
            } else if (S.method === "usage.get") {
                let P = S.params,
                    z = typeof P?.session_key == "string" ? P.session_key : void 0,
                    U = typeof P?.mode == "string" ? P.mode : void 0,
                    K;
                if (P?.since !== void 0 && (K = new Date(P.since), isNaN(K.getTime()) && (K = void 0)), U === "totals") {
                    let te = await readGlobalUsageTotals(l, K);
                    C.result = {
                        totals: te
                    }
                } else if (z) {
                    let te = await readDrainRecords(l, z, K),
                        V = summarizeDrainRecords(te);
                    C.result = {
                        sessions: {
                            [z]: {
                                summary: V,
                                records: te
                            }
                        }
                    }
                } else {
                    let te = await readAllSessionSummaries(l, K),
                        V = {};
                    for (let [re, X] of Object.entries(te)) V[re] = {
                        summary: X
                    };
                    C.result = {
                        sessions: V
                    }
                }
            } else if (S.method === "system.status") {
                if (!fE(S.params)) throw new rn("Invalid params");
                let [P, z] = await Promise.all([Zy(l), sh(l)]), U = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, K = e.sessionManager?.listActors(), te = new Set, V = [];
                if (K)
                    for (let [X, L] of K) {
                        if (L.status === "ended" || !U2(X)) continue;
                        te.add(X);
                        let ie = d.get(X);
                        V.push({
                            session_key: X,
                            display_name: ie?.display_name ?? null,
                            status: L.status,
                            health: ie?.last_error ? "error" : L.health,
                            last_event_at: ie?.last_event_at ?? null,
                            created_at: ie?.created_at ?? null,
                            cwd: ie?.cwd ?? null,
                            last_error: ie?.last_error ?? null,
                            runtime: L.runtime,
                            in_flight_tools: L.activeToolCalls.length > 0 ? L.activeToolCalls.map(fe => ({
                                tool_name: fe.toolName,
                                started_at: new Date(fe.startedAtMs).toISOString()
                            })) : void 0
                        })
                    }
                for (let X of d.listUserVisible()) te.has(X.session_key) || V.push({
                    session_key: X.session_key,
                    display_name: X.display_name ?? null,
                    status: "idle",
                    health: X.last_error ? "error" : "ok",
                    last_event_at: X.last_event_at ?? null,
                    created_at: X.created_at ?? null,
                    cwd: X.cwd ?? null,
                    last_error: X.last_error ?? null
                });
                let re = {
                    health: {
                        gateway: P?.health?.gateway ?? "down",
                        meta_session: P?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: P?.cadence?.mode ?? "unknown",
                        last_tick: P?.cadence?.last_tick ?? null,
                        interval_ms: U
                    },
                    sessions: V,
                    subconscious: {
                        partitions: z.items.map(X => ({
                            name: X.name,
                            done: X.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(l)
                };
                C.result = re
            } else if (S.method === "system.config") {
                if (!pE(S.params)) throw new rn("Invalid params");
                C.result = await rut(l)
            } else if (S.method === "spine.tail") {
                if (!mE(S.params)) throw new rn("Invalid params");
                let P = S.params ?? {},
                    z = await ohe(l, {
                        limit: P.limit,
                        after_id: P.after_id
                    });
                C.result = z
            } else C.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (P) {
            P instanceof rn ? C.error = {
                code: P.code,
                message: P.message
            } : C.error = {
                code: -32603,
                message: "Internal error",
                data: String(P)
            }
        }
        return C
    }
    let T = (S, {
        hostGuard: O,
        readOnly: $,
        bearerToken: C
    }) => {
        if (C) {
            let A = ow.createHash("sha256").update(C).digest();
            S.addHook("onRequest", async (j, P) => {
                let z = j.url ?? "";
                if (!(z.startsWith("/rpc") || z.startsWith("/ws"))) return;
                let U = j.headers.authorization,
                    K = typeof U == "string" && U.startsWith("Bearer ") ? U.slice(7).trim() : "";
                if (!K) return J("[daemon] rejected request: missing/invalid bearer", {
                    url: z
                }), a(j, P);
                let te = ow.createHash("sha256").update(K).digest();
                if (!ow.timingSafeEqual(te, A)) return J("[daemon] rejected request: bearer mismatch", {
                    url: z
                }), a(j, P)
            })
        }
        O && S.addHook("onRequest", async (A, j) => {
            let P = A.url ?? "";
            if (!(P.startsWith("/rpc") || P.startsWith("/ws"))) return;
            let U = A.headers.host,
                K = U ? Put(U) : null;
            if (!K || !i.has(K)) return J("[daemon] rejected request: Host header not allowed", {
                url: P,
                host: U ?? null
            }), s(A, j, "Host header not allowed");
            let te = A.headers.origin;
            if (te !== void 0) {
                let V = Cut(te);
                if (!V || !i.has(V)) return J("[daemon] rejected request: Origin not allowed", {
                    url: P,
                    origin: te
                }), s(A, j, "Origin not allowed")
            }
        }), $ ? S.get("/ws", async (A, j) => (J("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: A.ip,
            user_agent: A.headers["user-agent"] ?? null
        }), j.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: l.daemonSocketPath
        }))) : S.register(kwe.default), S.get("/healthz", async () => Rse()), S.get("/dashboard", async (A, j) => {
            let P = Di.join(l.bootstrapDir, "dashboard.html");
            try {
                let z = await us.readFile(P, "utf8");
                return j.type("text/html").send(z)
            } catch {
                return j.code(404).send("Dashboard not found")
            }
        }), S.get("/readyz", async (A, j) => await Ese(l) ? {
            status: "ok"
        } : j.code(503).send({
            status: "not_ready"
        })), S.post("/rpc", async (A, j) => {
            let P = A.body;
            if (!Ly(P)) return J("[daemon] invalid JSON-RPC request"), j.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if ($ && !Ylt.has(P.method)) return J("[daemon] rejected write method on read-only port", {
                method: P.method,
                id: P.id ?? null
            }), j.code(200).send({
                jsonrpc: "2.0",
                id: P.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let z = await I(P),
                U = z.__triggerShutdown;
            U && delete z.__triggerShutdown, await j.code(200).send(z), U && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), $ || S.register(async function(A) {
            A.get("/ws", {
                websocket: !0
            }, j => {
                let P = `ws_${++g}`,
                    z = null,
                    U = "",
                    K = null;
                Q("[daemon] ws connected", {
                    subscriberId: P
                });
                let te = (X, L = !0) => {
                        let ie = X.method === "session.output" ? X.params?.record?.id : void 0;
                        if (!(K && ie && K.has(ie))) {
                            try {
                                j.send(JSON.stringify(X))
                            } catch (fe) {
                                throw fe instanceof Error ? fe : new Error(String(fe))
                            }
                            if (K && ie && K.add(ie), L && X.method === "session.output") {
                                let {
                                    session_key: fe,
                                    record: _e
                                } = X.params;
                                if (!U) return;
                                let D = U,
                                    F = (v.get(P) ?? Promise.resolve()).then(() => Z2(l, fe, D, _e).catch(W => {
                                        J("[daemon] failed to advance delivery cursor", {
                                            subscriberId: P,
                                            sessionKey: fe,
                                            consumerId: D,
                                            error: String(W)
                                        })
                                    }));
                                v.set(P, F), F.then(() => {
                                    v.get(P) === F && v.delete(P)
                                })
                            }
                        }
                    },
                    V = async X => {
                        let L;
                        try {
                            L = JSON.parse(X.toString())
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
                        if (!Ly(L)) {
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
                        let ie = await I(L, {
                                wsSubscriberId: P
                            }),
                            fe = null,
                            _e = "",
                            D;
                        if (L.method === "channel.pull" && ie.result && !ie.error && Pp(L.params)) {
                            let F = L.params,
                                W = F.session_key,
                                ye = F.consumer_id.trim(),
                                ge = s6(F.return_mask);
                            z && h.unsubscribe(P), z = W, U = ye, fe = W, _e = ye, D = F.cursor, Q("[daemon] ws pull stream opened", {
                                subscriberId: P,
                                sessionKey: W,
                                consumerId: ye
                            }), K = new Set, h.subscribe({
                                id: P,
                                sessionKey: W,
                                returnMask: ge,
                                acceptStreamEndReasons: F.channel_capabilities?.outbound?.accept_stream_end_reasons,
                                send: Be => te(Be),
                                close: () => {
                                    try {
                                        j.close()
                                    } catch {}
                                }
                            })
                        }
                        if (fe) {
                            let F = Pp(L.params) ? L.params : void 0;
                            if (!s6(F?.return_mask).includes("final")) {
                                K = null, j.send(JSON.stringify(ie));
                                return
                            }
                            let ge = fe,
                                Be = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                                _ = Number.isFinite(Be) ? Be : 0;
                            try {
                                let k = await Qme({
                                    paths: l,
                                    sessionKey: ge,
                                    consumerId: _e,
                                    limit: _,
                                    cursorOverride: D,
                                    send: M => te(M, !1),
                                    onDelivered: async M => {
                                        await Z2(l, ge, _e, M);
                                        let Y = await ha(l, M.channel_kind, M.id);
                                        Y && Y.status !== "sent" && await gd(l, Y, {
                                            status: "sent"
                                        }), await Xp(l, M.id)
                                    }
                                });
                                k > 0 && ke("[daemon] replayed outbox backlog", {
                                    subscriberId: P,
                                    sessionKey: ge,
                                    consumerId: _e,
                                    replayed: k
                                })
                            } catch (k) {
                                J("[daemon] backlog replay failed", {
                                    subscriberId: P,
                                    sessionKey: ge,
                                    consumerId: _e,
                                    error: String(k)
                                })
                            }
                            K = null
                        }
                        let B = ie.__triggerShutdown;
                        B && delete ie.__triggerShutdown, j.send(JSON.stringify(ie)), B && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                    };
                j.on("message", X => {
                    let L = V(X).catch(_e => {
                            J("[daemon] ws message handler failed", {
                                subscriberId: P,
                                error: String(_e)
                            })
                        }),
                        ie = b.get(P) ?? Promise.resolve(),
                        fe = Promise.all([ie, L]).then(() => {});
                    b.set(P, fe), fe.then(() => {
                        b.get(P) === fe && b.delete(P)
                    })
                });
                let re = () => {
                    z && h.unsubscribe(P)
                };
                j.on("close", () => {
                    re(), Q("[daemon] ws closed", {
                        subscriberId: P,
                        sessionKey: z
                    })
                }), j.on("error", () => {
                    re(), J("[daemon] ws error", {
                        subscriberId: P,
                        sessionKey: z
                    })
                })
            })
        })
    };
    T(t, {
        hostGuard: !0,
        readOnly: !0
    }), T(n, {
        hostGuard: !1,
        readOnly: !1
    });
    let x = l.daemonSocketPath;
    return {
        app: t,
        socketApp: n,
        get remoteApp() {
            return r
        },
        bus: u,
        subscriptions: h,
        async start(S) {
            let O = resolveRemoteListenerConfig(process.env, S);
            if (!e.runtimeLockAlreadyHeld) {
                let A = await t4(l);
                if (!A.acquired) throw new Error(`Runtime lock already held by pid=${A.lock?.pid??"unknown"} at ${A.lockPath}`)
            }
            y = !0;
            let $ = !1;
            try {
                let j = Buffer.byteLength(x);
                if (j > 104) throw new Error(`daemon socket path is too long (${j} bytes > 104-byte unix-socket limit): ${x}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let P = Di.dirname(x),
                    z;
                try {
                    z = await us.stat(P)
                } catch (V) {
                    throw new Error(`daemon socket directory is not accessible: ${P} (${String(V)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let U = process.getuid?.(),
                    K = z.mode & 511;
                if (K !== 448 || U !== void 0 && z.uid !== U) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${K.toString(8)}, uid ${z.uid}): ${P}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
                let te = null;
                try {
                    te = await us.lstat(x)
                } catch {
                    te = null
                }
                if (te)
                    if (te.isSocket()) await us.unlink(x);
                    else throw new Error(`daemon socket path is occupied by a non-socket file: ${x}. Refusing to delete it — check ALADUO_DAEMON_SOCKET.`);
                await n.listen({
                    path: x
                }), $ = !0, await us.chmod(x, 384), await t.listen({
                    port: S,
                    host: "127.0.0.1"
                }), O.enabled && (r = (0, dO.default)({
                    logger: !1
                }), T(r, {
                    hostGuard: !1,
                    readOnly: !1,
                    bearerToken: O.token
                }), await r.listen({
                    port: O.port,
                    host: O.host
                }), ht("info", `[daemon] remote full-access listener on ${O.host}:${O.port} (bearer-gated)`))
            } catch (A) {
                throw await t.close().catch(() => {}), await n.close().catch(() => {}), r && (await r.close().catch(() => {}), r = null), $ && await us.unlink(x).catch(() => {}), y && (await hP(l), y = !1), A
            }
            let C = xwe("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            w = setInterval(() => {
                nhe(l).catch(() => {})
            }, C), w.unref?.()
        },
        async stop() {
            h.stop();
            let S = [t.close(), n.close()];
            r && S.push(r.close()), await Promise.all(S), r = null, await Promise.allSettled(b.values()), await Promise.allSettled(v.values()), await us.unlink(x).catch(() => {}), w && (clearInterval(w), w = null), y && (await hP(l), y = !1)
        }
    }
}
