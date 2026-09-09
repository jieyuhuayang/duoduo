// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: fdt, daemon.pretty.js:84498)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, CO.default)({
            logger: !1
        }),
        n = (0, CO.default)({
            logger: !1
        }),
        r = null,
        i = new Set(["127.0.0.1", "localhost", "::1"]),
        o = (S, D, $, C, O) => {
            if (String(S.headers.upgrade ?? "").toLowerCase() === "websocket") {
                D.hijack();
                let x = D.raw.socket ?? S.raw.socket;
                x && !x.destroyed && (x.write(`HTTP/1.1 ${$} ${C}\r
Connection: close\r
Content-Length: 0\r
\r
`), x.destroy());
                return
            }
            return D.code($).send(O)
        },
        s = (S, D, $) => o(S, D, 403, "Forbidden", {
            error: "forbidden",
            reason: $
        }),
        a = (S, D) => o(S, D, 401, "Unauthorized", {
            error: "unauthorized"
        }),
        {
            paths: l,
            bus: u
        } = e,
        c = new Io(l),
        d = e.sessionIndex ?? She();
    xse((S, D) => {
        if (D === "removed") {
            d.remove(S);
            return
        }
        Mi(S, async () => {
            if (!Qn(S)) try {
                let [$, C] = await Promise.all([ct(l, S), As(l, S)]);
                v4(d, S, $, C)
            } catch {}
        }).catch(() => {})
    }), Pre(S => {
        d.remove(S)
    });
    let m = {
            version: Tct(import.meta.url)("../../package.json").version,
            runtime_id: Uct(l.runtimeDir),
            runtime_mode: "host",
            runtime_dir: Ji.resolve(l.runtimeDir),
            work_dir: Ji.resolve(l.workDir),
            kernel_dir: Ji.resolve(l.kernelDir)
        },
        h = e.subscriptions ?? x4();
    h.start(u);
    let g = 0,
        y = !1,
        w = null,
        v = new Map,
        b = new Map,
        I = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function T(S, D) {
        (I.has(S.method) ? wre : ke)("[daemon] rpc request", {
            id: S.id ?? null,
            method: S.method,
            session_key: typeof S.params == "object" && S.params !== null ? S.params.session_key : void 0,
            ws: !!D?.wsSubscriberId
        });
        let C = {
                jsonrpc: "2.0",
                id: S.id ?? null
            },
            O;
        if (typeof S.params == "object" && S.params !== null && "worker_token" in S.params) {
            let {
                worker_token: x,
                ...F
            } = S.params;
            if (O = Ude(x), !O) return W("[daemon] rejected pi worker RPC: unknown token", {
                method: S.method
            }), C.error = {
                code: -32001,
                message: "invalid pi worker token"
            }, C;
            if (!zde.has(S.method)) return W("[daemon] rejected pi worker RPC: method not whitelisted", {
                method: S.method,
                session_key: O.session_key
            }), C.error = {
                code: -32601,
                message: `Method not available to pi worker callers: ${S.method}`
            }, C;
            S.params = F
        }
        let j = {
            cancelSession: async x => {
                if (!e.sessionManager) return {
                    interrupted: !1,
                    reason: "session_manager_unavailable"
                };
                let F = await e.sessionManager.interruptSession(x);
                return {
                    interrupted: F.interrupted,
                    reason: F.reason
                }
            },
            clearSession: async x => e.sessionManager ? e.sessionManager.clearSdkSession(x) : {
                cleared: !1,
                reason: "session_manager_unavailable"
            },
            listActors: () => {
                if (!e.sessionManager) return new Map;
                let x = e.sessionManager.listActors(),
                    F = new Map;
                for (let [q, J] of x) F.set(q, {
                    sessionKey: J.sessionKey,
                    status: J.status,
                    health: J.health,
                    idleSince: J.idleSince,
                    origin: J.origin
                });
                return F
            },
            listPersistentSessions: () => d.listUserVisible().map(x => ({
                session_key: x.session_key,
                cwd: x.cwd,
                created_at: x.created_at,
                last_event_at: x.last_event_at,
                last_error: x.last_error
            })),
            getSessionModel: async (x, F) => e.sessionManager ? e.sessionManager.getSessionModelView(x, F) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionModel: async (x, F, q) => e.sessionManager ? e.sessionManager.setSessionModel(x, F, q) : {
                ok: !1,
                reason: "not_running"
            },
            getSessionEffort: async (x, F) => e.sessionManager ? e.sessionManager.getSessionEffortView(x, F) : {
                runtime: "claude",
                hasLiveQuery: !1
            },
            setSessionEffort: async (x, F) => e.sessionManager ? e.sessionManager.setSessionEffort(x, F) : {
                ok: !1,
                reason: "not_running"
            }
        };
        try {
            if (S.method === "system.shutdown") C.result = {
                ok: !0
            }, C.__triggerShutdown = !0;
            else if (S.method === "system.runtime.info") {
                if (!uE(S.params)) throw new tn("Invalid params");
                if (!lE(m)) throw new Error("invalid runtime info");
                let x = S.params ?? {};
                if (x.source_kind) {
                    let q = {
                        new_session_workspace: (await Oa(l, {
                            channel_kind: x.source_kind
                        }))?.new_session_workspace
                    };
                    C.result = {
                        ...m,
                        channel_defaults: q
                    }
                } else C.result = m
            } else if (S.method === "channel.describe") {
                if (!EE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await Vct(l, d, x)
            } else if (S.method === "session.archive") {
                if (!cE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await Wct(l, e.sessionManager, d, x)
            } else if (S.method === "session.list") {
                if (!dE(S.params)) throw new tn("Invalid params");
                let x = S.params ?? {};
                C.result = await Zct(d, c, x)
            } else if (S.method === "session.set_alias") {
                if (!fE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await Kct(l, d, x)
            } else if (S.method === "session.notify") {
                if (!pE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await ESe(l, u, d, x)
            } else if (S.method === "job.manage" || S.method === "session.manage" || S.method === "notify.send") {
                if (!O) return C.error = {
                    code: -32001,
                    message: `${S.method} requires a pi worker token`
                }, C;
                if (typeof S.params != "object" || S.params === null) throw new tn("Invalid params");
                if (S.method === "job.manage") {
                    let x = await mh(S.params, {
                        paths: l,
                        sessionKey: O.session_key,
                        callerJobCron: O.job_cron,
                        callerRuntime: "pi",
                        bus: u
                    });
                    C.result = {
                        output: x
                    }
                } else if (S.method === "notify.send") {
                    let x = await gh(S.params, {
                        paths: l,
                        bus: u,
                        sessionKey: O.session_key,
                        sessionContextKind: O.session_context_kind,
                        jobScheduleType: O.job_schedule_type
                    });
                    x.startsWith("Error:") || e.sessionManager?.markAgentNotified(O.session_key), C.result = {
                        output: x
                    }
                } else {
                    let x = await hh(S.params, {
                        paths: l,
                        sessionKey: O.session_key,
                        getSessionStatus: F => e.sessionManager?.listActors().get(F)?.status
                    });
                    C.result = {
                        output: x
                    }
                }
            } else if (S.method === "session.model") {
                if (!mE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await Xct(d, j, x)
            } else if (S.method === "session.effort") {
                if (!hE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await Qct(d, j, x)
            } else if (S.method === "session.compact") {
                if (!gE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await edt(l, u, d, j, x)
            } else if (S.method === "session.config") {
                if (!yE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await ndt(l, d, x)
            } else if (S.method === "channel.spawn") {
                if (!RE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                C.result = await adt(l, x)
            } else if (S.method === "channel.ingress") {
                if (!vE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                if (gSe("channel.ingress", x, D), Qn(x.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, C;
                let F = x.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    q = await ySe({
                        paths: l,
                        sessionKey: x.session_key,
                        cwdAbs: x.cwd_abs,
                        channelKind: F,
                        channelId: x.channel_id
                    });
                if (!q.ok) return C.error = {
                    code: -32010,
                    message: q.guidance
                }, C;
                let J = await mae(l, {
                    sessionKey: x.session_key,
                    sourceKind: F,
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
                    bus: u,
                    gatewayCommands: j
                });
                x.channel_id && await Qe(l, x.session_key, {
                    source_channel_id: x.channel_id
                }), eo("ingress_received", J.event.id, {
                    sessionKey: x.session_key
                }), J.routing.enqueued && u.emit("session.wake", {
                    sessionKey: x.session_key,
                    displayName: x.display_name,
                    preempt: q6(x.text)
                });
                let le = yv(F) ? q.effectiveConfig?.kind_config : void 0,
                    oe = {
                        event_id: J.event.id,
                        gateway_response: J.gatewayResponse,
                        outbox_id: J.gatewayOutboxId,
                        ...le ? {
                            kind_config: le
                        } : {}
                    };
                C.result = oe
            } else if (S.method === "channel.command") {
                if (!kE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                if (gSe("channel.command", x, D), Qn(x.session_key)) return C.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, C;
                let F = x.source_kind ?? (D?.wsSubscriberId ? "ws" : "rpc"),
                    q = await ySe({
                        paths: l,
                        sessionKey: x.session_key,
                        cwdAbs: x.cwd_abs,
                        channelKind: F,
                        channelId: x.channel_id
                    });
                if (!q.ok) return C.error = {
                    code: -32010,
                    message: q.guidance
                }, C;
                let J = await C_(l, {
                    sessionKey: x.session_key,
                    sourceKind: F,
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
                    bus: u,
                    gatewayCommands: j
                });
                J.routing.enqueued && u.emit("session.wake", {
                    sessionKey: x.session_key,
                    preempt: q6(x.command)
                }), C.result = {
                    event_id: J.event.id,
                    gateway_response: J.gatewayResponse,
                    outbox_id: J.gatewayOutboxId
                }
            } else if (S.method === "channel.file.upload") {
                if (!wE(S.params)) throw new tn("Invalid params");
                let x = S.params,
                    F = await jme(l, x.session_key, x.name, x.mime, x.content_base64, {
                        receivedVia: D?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: D?.wsSubscriberId
                    });
                C.result = F
            } else if (S.method === "channel.file.download") {
                if (!SE(S.params)) throw new tn("Invalid params");
                let x = S.params,
                    F = await Lme(x.path);
                C.result = {
                    content_base64: F
                }
            } else if (S.method === "channel.pull") {
                if (!qp(S.params)) throw new tn("Invalid params");
                let x = S.params,
                    F = x.consumer_id.trim(),
                    q = L6(x.return_mask),
                    J = q.includes("final");
                if (D?.wsSubscriberId) return await zct({
                    paths: l,
                    sessionKey: x.session_key,
                    declaredBy: F,
                    capabilities: x.channel_capabilities
                }), C.result = {
                    opened: !0,
                    session_key: x.session_key,
                    consumer_id: F,
                    cursor: x.cursor,
                    return_mask: q
                }, C;
                let le = J ? await P4({
                    paths: l,
                    sessionKey: x.session_key,
                    consumerId: F,
                    limit: x.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: x.cursor
                }) : [];
                C.result = {
                    session_key: x.session_key,
                    consumer_id: F,
                    return_mask: q,
                    records: le,
                    next_cursor: le.length > 0 ? le[le.length - 1].id : void 0,
                    idle: le.length === 0
                }
            } else if (S.method === "channel.ack") {
                if (!xE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                if (Qn(x.session_key)) return C.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${x.session_key}`
                }, C;
                let F = x.consumer_id.trim(),
                    q = x.cursor.trim(),
                    J = x.session_key.indexOf(":"),
                    le = J > 0 ? x.session_key.slice(0, J) : null,
                    oe = null;
                if (le && (oe = await Sa(l, le, q)), !oe || oe.session_key !== x.session_key) {
                    let te = await Dse(l, x.session_key, q);
                    return te ? (await I4(l, x.session_key, F, te), C.result = {
                        session_key: x.session_key,
                        consumer_id: F,
                        committed_cursor: te.id,
                        committed: !0
                    }, C) : (C.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, C)
                }
                let X = await Ds(l, q);
                if (!X) try {
                    await p0(l, x.session_key), X = await Ds(l, q)
                } catch {}
                X ? await Vhe(l, x.session_key, F, X) : await I4(l, x.session_key, F, oe), C.result = {
                    session_key: x.session_key,
                    consumer_id: F,
                    committed_cursor: oe.id,
                    committed: !0
                }
            } else if (S.method === "job.create") {
                if (!TE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                await c.init(), await c.createJob(x.id, {
                    cron: x.cron,
                    owner_session: x.owner_session,
                    cwd_rel: x.cwd_rel,
                    runtime: _o()
                }, x.instruction);
                let F = createSpineEvent({
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
                await atomicAppendEvent(l, F), C.result = {
                    id: x.id,
                    cron: x.cron
                }
            } else if (S.method === "job.get") {
                if (!IE(S.params)) throw new tn("Invalid params");
                let x = S.params;
                await c.init();
                let F = await c.classifyActiveJob(x.id);
                if (F.kind === "active") C.result = {
                    ...rf(F.job),
                    kind: "active"
                };
                else if (F.kind === "invalid") C.error = {
                    code: t_.INVALID_ACTIVE,
                    message: `Job '${x.id}' active job file exists but is invalid: ${F.reason}`
                };
                else {
                    let q = await c.getArchivedJob(x.id);
                    q ? C.result = {
                        ...rf(q),
                        kind: "archived",
                        archived: !0
                    } : C.error = {
                        code: t_.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (S.method === "job.list") {
                if (!PE(S.params)) throw new tn("Invalid params");
                await c.init();
                let x = zpe(await c.listJobs());
                S.params?.summary ? C.result = {
                    jobs: x.map(({
                        content: q,
                        path: J,
                        ...le
                    }) => le)
                } : C.result = {
                    jobs: x
                }
            } else if (S.method === "usage.get") {
                let x = S.params,
                    F = typeof x?.session_key == "string" ? x.session_key : void 0,
                    q = typeof x?.mode == "string" ? x.mode : void 0,
                    J;
                if (x?.since !== void 0 && (J = new Date(x.since), isNaN(J.getTime()) && (J = void 0)), q === "totals") {
                    let le = await readGlobalUsageTotals(l, J);
                    C.result = {
                        totals: le
                    }
                } else if (F) {
                    let le = await readDrainRecords(l, F, J),
                        oe = summarizeDrainRecords(le);
                    C.result = {
                        sessions: {
                            [F]: {
                                summary: oe,
                                records: le
                            }
                        }
                    }
                } else {
                    let le = await readAllSessionSummaries(l, J),
                        oe = {};
                    for (let [X, te] of Object.entries(le)) oe[X] = {
                        summary: te
                    };
                    C.result = {
                        sessions: oe
                    }
                }
            } else if (S.method === "system.status") {
                if (!CE(S.params)) throw new tn("Invalid params");
                let [x, F] = await Promise.all([c_(l), _h(l)]), q = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, J = e.sessionManager?.listActors(), le = new Set, oe = [], X = z => {
                    let V = z?.last_served_model ?? null,
                        pe = z?.model ?? null;
                    return {
                        served: V,
                        pending: pe !== null && pe !== V ? pe : null
                    }
                };
                if (J)
                    for (let [z, V] of J) {
                        if (V.status === "ended" || !b4(z)) continue;
                        le.add(z);
                        let pe = d.get(z);
                        oe.push({
                            session_key: z,
                            display_name: pe?.display_name ?? null,
                            status: V.status,
                            health: pe?.last_error ? "error" : V.health,
                            last_event_at: pe?.last_event_at ?? null,
                            created_at: pe?.created_at ?? null,
                            cwd: pe?.cwd ?? null,
                            last_error: pe?.last_error ?? null,
                            runtime: V.runtime,
                            model: X(pe),
                            in_flight_tools: V.activeToolCalls.length > 0 ? V.activeToolCalls.map(ae => ({
                                tool_name: ae.toolName,
                                started_at: new Date(ae.startedAtMs).toISOString()
                            })) : void 0
                        })
                    }
                for (let z of d.listUserVisible()) le.has(z.session_key) || oe.push({
                    session_key: z.session_key,
                    display_name: z.display_name ?? null,
                    status: "idle",
                    health: z.last_error ? "error" : "ok",
                    last_event_at: z.last_event_at ?? null,
                    created_at: z.created_at ?? null,
                    cwd: z.cwd ?? null,
                    last_error: z.last_error ?? null,
                    model: X(z)
                });
                let te = {
                    health: {
                        gateway: x?.health?.gateway ?? "down",
                        meta_session: x?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: x?.cadence?.mode ?? "unknown",
                        last_tick: x?.cadence?.last_tick ?? null,
                        interval_ms: q
                    },
                    sessions: oe,
                    subconscious: {
                        partitions: F.items.map(z => ({
                            name: z.name,
                            done: z.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(l)
                };
                C.result = te
            } else if (S.method === "system.config") {
                if (!OE(S.params)) throw new tn("Invalid params");
                C.result = await Mct(l)
            } else if (S.method === "spine.tail") {
                if (!$E(S.params)) throw new tn("Invalid params");
                let x = S.params ?? {},
                    F = await Qhe(l, {
                        limit: x.limit,
                        after_id: x.after_id
                    });
                C.result = F
            } else C.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (x) {
            x instanceof tn ? C.error = {
                code: x.code,
                message: x.message
            } : C.error = {
                code: -32603,
                message: "Internal error",
                data: String(x)
            }
        }
        return C
    }
    let P = (S, {
        hostGuard: D,
        readOnly: $,
        bearerToken: C
    }) => {
        if (C) {
            let O = kw.createHash("sha256").update(C).digest();
            S.addHook("onRequest", async (j, x) => {
                let F = j.url ?? "";
                if (!(F.startsWith("/rpc") || F.startsWith("/ws"))) return;
                let q = j.headers.authorization,
                    J = typeof q == "string" && q.startsWith("Bearer ") ? q.slice(7).trim() : "";
                if (!J) return W("[daemon] rejected request: missing/invalid bearer", {
                    url: F
                }), a(j, x);
                let le = kw.createHash("sha256").update(J).digest();
                if (!kw.timingSafeEqual(le, O)) return W("[daemon] rejected request: bearer mismatch", {
                    url: F
                }), a(j, x)
            })
        }
        D && S.addHook("onRequest", async (O, j) => {
            let x = O.url ?? "";
            if (!(x.startsWith("/rpc") || x.startsWith("/ws"))) return;
            let q = O.headers.host,
                J = q ? ldt(q) : null;
            if (!J || !i.has(J)) return W("[daemon] rejected request: Host header not allowed", {
                url: x,
                host: q ?? null
            }), s(O, j, "Host header not allowed");
            let le = O.headers.origin;
            if (le !== void 0) {
                let oe = udt(le);
                if (!oe || !i.has(oe)) return W("[daemon] rejected request: Origin not allowed", {
                    url: x,
                    origin: le
                }), s(O, j, "Origin not allowed")
            }
        }), $ ? S.get("/ws", async (O, j) => (W("[daemon] pre-hardening client dialed /ws on the read-only port", {
            remote_address: O.ip,
            user_agent: O.headers["user-agent"] ?? null
        }), j.code(426).header("connection", "close").send({
            error: "upgrade_required",
            message: "This TCP port serves the daemon's read-only HTTP surface; it has no WebSocket endpoint and rejects all write methods. Full-access clients (the duoduo CLI and channel gateways) connect over the daemon's unix socket instead. If a channel gateway is stuck retrying this port, reinstall/upgrade the channel and restart it (`duoduo channel <kind> stop`, then `start`) so it picks up the socket transport.",
            socket_path: l.daemonSocketPath
        }))) : S.register(SSe.default), S.get("/healthz", async () => yae()), S.get("/dashboard", async (O, j) => {
            let x = Ji.join(l.bootstrapDir, "dashboard.html");
            try {
                let F = await ys.readFile(x, "utf8");
                return j.type("text/html").send(F)
            } catch {
                return j.code(404).send("Dashboard not found")
            }
        }), S.get("/readyz", async (O, j) => await gae(l) ? {
            status: "ok"
        } : j.code(503).send({
            status: "not_ready"
        })), S.post("/rpc", async (O, j) => {
            let x = O.body;
            if (!e_(x)) return W("[daemon] invalid JSON-RPC request"), j.code(400).send({
                error: "Invalid JSON-RPC request"
            });
            if ($ && !Cct.has(x.method)) return W("[daemon] rejected write method on read-only port", {
                method: x.method,
                id: x.id ?? null
            }), j.code(200).send({
                jsonrpc: "2.0",
                id: x.id ?? null,
                error: {
                    code: -32601,
                    message: "Method not available on read-only endpoint"
                }
            });
            let F = await T(x),
                q = F.__triggerShutdown;
            q && delete F.__triggerShutdown, await j.code(200).send(F), q && setImmediate(() => process.kill(process.pid, "SIGTERM"))
        }), $ || S.register(async function(O) {
            O.get("/ws", {
                websocket: !0
            }, j => {
                let x = `ws_${++g}`,
                    F = null,
                    q = "",
                    J = null;
                ee("[daemon] ws connected", {
                    subscriberId: x
                });
                let le = (te, z = !0) => {
                        let V = te.method === "session.output" ? te.params?.record?.id : void 0;
                        if (!(J && V && J.has(V))) {
                            try {
                                j.send(JSON.stringify(te))
                            } catch (pe) {
                                throw pe instanceof Error ? pe : new Error(String(pe))
                            }
                            if (J && V && J.add(V), z && te.method === "session.output") {
                                let {
                                    session_key: pe,
                                    record: ae
                                } = te.params;
                                if (!q) return;
                                let L = q,
                                    U = (v.get(x) ?? Promise.resolve()).then(() => T4(l, pe, L, ae).catch(G => {
                                        W("[daemon] failed to advance delivery cursor", {
                                            subscriberId: x,
                                            sessionKey: pe,
                                            consumerId: L,
                                            error: String(G)
                                        })
                                    }));
                                v.set(x, U), U.then(() => {
                                    v.get(x) === U && v.delete(x)
                                })
                            }
                        }
                    },
                    oe = async te => {
                        let z;
                        try {
                            z = JSON.parse(te.toString())
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
                        if (!e_(z)) {
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
                        let V = await T(z, {
                                wsSubscriberId: x
                            }),
                            pe = null,
                            ae = "",
                            L;
                        if (z.method === "channel.pull" && V.result && !V.error && qp(z.params)) {
                            let U = z.params,
                                G = U.session_key,
                                ne = U.consumer_id.trim(),
                                Q = L6(U.return_mask);
                            F && h.unsubscribe(x), F = G, q = ne, pe = G, ae = ne, L = U.cursor, ee("[daemon] ws pull stream opened", {
                                subscriberId: x,
                                sessionKey: G,
                                consumerId: ne
                            }), J = new Set, h.subscribe({
                                id: x,
                                sessionKey: G,
                                returnMask: Q,
                                acceptStreamEndReasons: U.channel_capabilities?.outbound?.accept_stream_end_reasons,
                                send: Ae => le(Ae),
                                close: () => {
                                    try {
                                        j.close()
                                    } catch {}
                                }
                            })
                        }
                        if (pe) {
                            let U = qp(z.params) ? z.params : void 0;
                            if (!L6(U?.return_mask).includes("final")) {
                                J = null, j.send(JSON.stringify(V));
                                return
                            }
                            let Q = pe,
                                Ae = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                                _ = Number.isFinite(Ae) ? Ae : 0;
                            try {
                                let E = await Jhe({
                                    paths: l,
                                    sessionKey: Q,
                                    consumerId: ae,
                                    limit: _,
                                    cursorOverride: L,
                                    send: N => le(N, !1),
                                    onDelivered: async N => {
                                        await T4(l, Q, ae, N);
                                        let K = await Sa(l, N.channel_kind, N.id);
                                        K && K.status !== "sent" && await Pd(l, K, {
                                            status: "sent"
                                        }), await dm(l, N.id)
                                    }
                                });
                                E > 0 && ke("[daemon] replayed outbox backlog", {
                                    subscriberId: x,
                                    sessionKey: Q,
                                    consumerId: ae,
                                    replayed: E
                                })
                            } catch (E) {
                                W("[daemon] backlog replay failed", {
                                    subscriberId: x,
                                    sessionKey: Q,
                                    consumerId: ae,
                                    error: String(E)
                                })
                            }
                            J = null
                        }
                        let M = V.__triggerShutdown;
                        M && delete V.__triggerShutdown, j.send(JSON.stringify(V)), M && setImmediate(() => process.kill(process.pid, "SIGTERM"))
                    };
                j.on("message", te => {
                    let z = oe(te).catch(ae => {
                            W("[daemon] ws message handler failed", {
                                subscriberId: x,
                                error: String(ae)
                            })
                        }),
                        V = b.get(x) ?? Promise.resolve(),
                        pe = Promise.all([V, z]).then(() => {});
                    b.set(x, pe), pe.then(() => {
                        b.get(x) === pe && b.delete(x)
                    })
                });
                let X = () => {
                    F && h.unsubscribe(x)
                };
                j.on("close", () => {
                    X(), ee("[daemon] ws closed", {
                        subscriberId: x,
                        sessionKey: F
                    })
                }), j.on("error", () => {
                    X(), W("[daemon] ws error", {
                        subscriberId: x,
                        sessionKey: F
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
    let k = l.daemonSocketPath;
    return {
        app: t,
        socketApp: n,
        get remoteApp() {
            return r
        },
        bus: u,
        subscriptions: h,
        async start(S) {
            let D = resolveRemoteListenerConfig(process.env, S);
            if (!e.runtimeLockAlreadyHeld) {
                let O = await A4(l);
                if (!O.acquired) throw new Error(`Runtime lock already held by pid=${O.lock?.pid??"unknown"} at ${O.lockPath}`)
            }
            y = !0;
            let $ = !1;
            try {
                let j = Buffer.byteLength(k);
                if (j > 104) throw new Error(`daemon socket path is too long (${j} bytes > 104-byte unix-socket limit): ${k}. Shorten it via a shorter ALADUO_RUNTIME_DIR or set ALADUO_DAEMON_SOCKET to a shorter absolute path.`);
                let x = Ji.dirname(k),
                    F;
                try {
                    F = await ys.stat(x)
                } catch (oe) {
                    throw new Error(`daemon socket directory is not accessible: ${x} (${String(oe)}). Point ALADUO_DAEMON_SOCKET at an absolute path inside a directory you own with mode 0700.`)
                }
                let q = process.getuid?.(),
                    J = F.mode & 511;
                if (J !== 448 || q !== void 0 && F.uid !== q) throw new Error(`daemon socket directory must be owned by this user and mode 0700 (found mode 0${J.toString(8)}, uid ${F.uid}): ${x}. Use the default ALADUO_RUNTIME_DIR/run or point ALADUO_DAEMON_SOCKET at a 0700 directory you own.`);
                let le = null;
                try {
                    le = await ys.lstat(k)
                } catch {
                    le = null
                }
                if (le)
                    if (le.isSocket()) await ys.unlink(k);
                    else throw new Error(`daemon socket path is occupied by a non-socket file: ${k}. Refusing to delete it — check ALADUO_DAEMON_SOCKET.`);
                await n.listen({
                    path: k
                }), $ = !0, await ys.chmod(k, 384), await t.listen({
                    port: S,
                    host: "127.0.0.1"
                }), D.enabled && (r = (0, CO.default)({
                    logger: !1
                }), P(r, {
                    hostGuard: !1,
                    readOnly: !1,
                    bearerToken: D.token
                }), await r.listen({
                    port: D.port,
                    host: D.host
                }), gt("info", `[daemon] remote full-access listener on ${D.host}:${D.port} (bearer-gated)`))
            } catch (O) {
                throw await t.close().catch(() => {}), await n.close().catch(() => {}), r && (await r.close().catch(() => {}), r = null), $ && await ys.unlink(k).catch(() => {}), y && (await AP(l), y = !1), O
            }
            let C = kSe("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            w = setInterval(() => {
                Khe(l).catch(() => {})
            }, C), w.unref?.()
        },
        async stop() {
            h.stop();
            let S = [t.close(), n.close()];
            r && S.push(r.close()), await Promise.all(S), r = null, await Promise.allSettled(b.values()), await Promise.allSettled(v.values()), await ys.unlink(k).catch(() => {}), w && (clearInterval(w), w = null), y && (await AP(l), y = !1)
        }
    }
}
