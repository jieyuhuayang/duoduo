// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: Wet, daemon.pretty.js:78025)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, mhe.default)({
            logger: !1
        }),
        {
            paths: n,
            bus: r
        } = e,
        i = new js(n),
        s = e.sessionIndex ?? pae();
    jte((h, _) => {
        if (_ === "removed") {
            s.remove(h);
            return
        }
        hi(h, async () => {
            if (!fr(h)) try {
                let [b, v] = await Promise.all([At(n, h), Da(n, h)]);
                Bz(s, h, b, v)
            } catch {}
        }).catch(() => {})
    }), eX(h => {
        s.remove(h)
    });
    let u = {
            version: _et(import.meta.url)("../../package.json").version,
            runtime_id: Cet(n.runtimeDir),
            runtime_mode: "host",
            runtime_dir: as.resolve(n.runtimeDir),
            work_dir: as.resolve(n.workDir),
            kernel_dir: as.resolve(n.kernelDir)
        },
        c = e.subscriptions ?? Vz();
    c.start(r);
    let l = 0,
        d = !1,
        p = null;
    t.register(hhe.default), t.get("/healthz", async () => Nne()), t.get("/dashboard", async (h, _) => {
        let b = as.join(n.bootstrapDir, "dashboard.html");
        try {
            let v = await Nb.readFile(b, "utf8");
            return _.type("text/html").send(v)
        } catch {
            return _.code(404).send("Dashboard not found")
        }
    }), t.get("/readyz", async (h, _) => await Ane(n) ? {
        status: "ok"
    } : _.code(503).send({
        status: "not_ready"
    }));
    let f = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function m(h, _) {
        (f.has(h.method) ? QQ : Pe)("[daemon] rpc request", {
            id: h.id ?? null,
            method: h.method,
            session_key: typeof h.params == "object" && h.params !== null ? h.params.session_key : void 0,
            ws: !!_?.wsSubscriberId
        });
        let v = {
                jsonrpc: "2.0",
                id: h.id ?? null
            },
            w = {
                cancelSession: async g => {
                    if (!e.sessionManager) return {
                        interrupted: !1,
                        reason: "session_manager_unavailable"
                    };
                    let x = await e.sessionManager.interruptSession(g);
                    return {
                        interrupted: x.interrupted,
                        reason: x.reason
                    }
                },
                clearSession: async g => e.sessionManager ? e.sessionManager.clearSdkSession(g) : {
                    cleared: !1,
                    reason: "session_manager_unavailable"
                },
                listActors: () => {
                    if (!e.sessionManager) return new Map;
                    let g = e.sessionManager.listActors(),
                        x = new Map;
                    for (let [k, E] of g) x.set(k, {
                        sessionKey: E.sessionKey,
                        status: E.status,
                        health: E.health,
                        idleSince: E.idleSince,
                        origin: E.origin
                    });
                    return x
                },
                listPersistentSessions: () => s.listUserVisible().map(g => ({
                    session_key: g.session_key,
                    cwd: g.cwd,
                    created_at: g.created_at,
                    last_event_at: g.last_event_at,
                    last_error: g.last_error
                })),
                getSessionModel: async g => e.sessionManager ? e.sessionManager.getSessionModelView(g) : {
                    runtime: "claude",
                    hasLiveQuery: !1
                },
                setSessionModel: async (g, x) => e.sessionManager ? e.sessionManager.setSessionModel(g, x) : {
                    ok: !1,
                    reason: "not_running"
                },
                getSessionEffort: async g => e.sessionManager ? e.sessionManager.getSessionEffortView(g) : {
                    runtime: "claude",
                    hasLiveQuery: !1
                },
                setSessionEffort: async (g, x) => e.sessionManager ? e.sessionManager.setSessionEffort(g, x) : {
                    ok: !1,
                    reason: "not_running"
                }
            };
        try {
            if (h.method === "system.shutdown") v.result = {
                ok: !0
            }, v.__triggerShutdown = !0;
            else if (h.method === "system.runtime.info") {
                if (!YE(h.params)) throw new vn("Invalid params");
                if (!KE(u)) throw new Error("invalid runtime info");
                let g = h.params ?? {};
                if (g.source_kind) {
                    let k = {
                        new_session_workspace: (await qp(n, {
                            channel_kind: g.source_kind
                        }))?.new_session_workspace
                    };
                    v.result = {
                        ...u,
                        channel_defaults: k
                    }
                } else v.result = u
            } else if (h.method === "channel.describe") {
                if (!cT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await jet(n, s, g)
            } else if (h.method === "session.archive") {
                if (!QE(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await Let(n, e.sessionManager, s, g)
            } else if (h.method === "session.list") {
                if (!XE(h.params)) throw new vn("Invalid params");
                let g = h.params ?? {};
                v.result = await Fet(s, i, g)
            } else if (h.method === "session.set_alias") {
                if (!eT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await Uet(n, s, g)
            } else if (h.method === "session.notify") {
                if (!tT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await qet(n, r, s, g)
            } else if (h.method === "session.compact") {
                if (!nT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await Bet(n, r, s, w, g)
            } else if (h.method === "session.config") {
                if (!rT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await Vet(n, s, g)
            } else if (h.method === "channel.spawn") {
                if (!lT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                v.result = await Zet(n, g)
            } else if (h.method === "channel.ingress") {
                if (!iT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                if (uhe("channel.ingress", g, _), fr(g.session_key)) return v.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${g.session_key}`
                }, v;
                let x = g.source_kind ?? (_?.wsSubscriberId ? "ws" : "rpc"),
                    k = await che({
                        paths: n,
                        sessionKey: g.session_key,
                        cwdAbs: g.cwd_abs,
                        channelKind: x,
                        channelId: g.channel_id
                    });
                if (!k.ok) return v.error = {
                    code: -32010,
                    message: k.guidance
                }, v;
                let E = await One(n, {
                    sessionKey: g.session_key,
                    sourceKind: x,
                    sourceName: g.channel_id ?? _?.wsSubscriberId,
                    sourceChannelId: g.channel_id,
                    text: g.text ?? "",
                    attachments: g.attachments,
                    dedupSourceId: g.idempotency_key,
                    rawPayload: {
                        jsonrpc: h.jsonrpc,
                        method: h.method,
                        params: h.params
                    }
                }, {
                    bus: r,
                    gatewayCommands: w
                });
                g.channel_id && await dt(n, g.session_key, {
                    source_channel_id: g.channel_id
                }), Ai("ingress_received", E.event.id, {
                    sessionKey: g.session_key
                }), E.routing.enqueued && r.emit("session.wake", {
                    sessionKey: g.session_key,
                    displayName: g.display_name,
                    preempt: z2(g.text)
                }), v.result = {
                    event_id: E.event.id,
                    gateway_response: E.gatewayResponse,
                    outbox_id: E.gatewayOutboxId
                }
            } else if (h.method === "channel.command") {
                if (!aT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                if (uhe("channel.command", g, _), fr(g.session_key)) return v.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${g.session_key}`
                }, v;
                let x = g.source_kind ?? (_?.wsSubscriberId ? "ws" : "rpc"),
                    k = await che({
                        paths: n,
                        sessionKey: g.session_key,
                        cwdAbs: g.cwd_abs,
                        channelKind: x,
                        channelId: g.channel_id
                    });
                if (!k.ok) return v.error = {
                    code: -32010,
                    message: k.guidance
                }, v;
                let E = await fy(n, {
                    sessionKey: g.session_key,
                    sourceKind: x,
                    sourceName: g.channel_id ?? _?.wsSubscriberId,
                    sourceChannelId: g.channel_id,
                    command: g.command,
                    dedupSourceId: g.idempotency_key,
                    rawPayload: {
                        jsonrpc: h.jsonrpc,
                        method: h.method,
                        params: h.params
                    }
                }, {
                    bus: r,
                    gatewayCommands: w
                });
                E.routing.enqueued && r.emit("session.wake", {
                    sessionKey: g.session_key,
                    preempt: z2(g.command)
                }), v.result = {
                    event_id: E.event.id,
                    gateway_response: E.gatewayResponse,
                    outbox_id: E.gatewayOutboxId
                }
            } else if (h.method === "channel.file.upload") {
                if (!sT(h.params)) throw new vn("Invalid params");
                let g = h.params,
                    x = await tae(n, g.session_key, g.name, g.mime, g.content_base64, {
                        receivedVia: _?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: _?.wsSubscriberId
                    });
                v.result = x
            } else if (h.method === "channel.file.download") {
                if (!oT(h.params)) throw new vn("Invalid params");
                let g = h.params,
                    x = await nae(g.path);
                v.result = {
                    content_base64: x
                }
            } else if (h.method === "channel.pull") {
                if (!Up(h.params)) throw new vn("Invalid params");
                let g = h.params,
                    x = g.consumer_id.trim(),
                    k = M2(g.return_mask),
                    E = k.includes("final");
                if (_?.wsSubscriberId) return await Oet({
                    paths: n,
                    sessionKey: g.session_key,
                    declaredBy: x,
                    capabilities: g.channel_capabilities
                }), v.result = {
                    opened: !0,
                    session_key: g.session_key,
                    consumer_id: x,
                    cursor: g.cursor,
                    return_mask: k
                }, v;
                let R = E ? await Kz({
                    paths: n,
                    sessionKey: g.session_key,
                    consumerId: x,
                    limit: g.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: g.cursor
                }) : [];
                v.result = {
                    session_key: g.session_key,
                    consumer_id: x,
                    return_mask: k,
                    records: R,
                    next_cursor: R.length > 0 ? R[R.length - 1].id : void 0,
                    idle: R.length === 0
                }
            } else if (h.method === "channel.ack") {
                if (!uT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                if (fr(g.session_key)) return v.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${g.session_key}`
                }, v;
                let x = g.consumer_id.trim(),
                    k = g.cursor.trim(),
                    E = g.session_key.indexOf(":"),
                    R = E > 0 ? g.session_key.slice(0, E) : null,
                    $ = null;
                if (R && ($ = await Jo(n, R, k)), !$ || $.session_key !== g.session_key) {
                    let P = await ene(n, g.session_key, k);
                    return P ? (await Gz(n, g.session_key, x, P), v.result = {
                        session_key: g.session_key,
                        consumer_id: x,
                        committed_cursor: P.id,
                        committed: !0
                    }, v) : (v.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, v)
                }
                let I = await Ts(n, k);
                if (!I) try {
                    await qk(n, g.session_key), I = await Ts(n, k)
                } catch {}
                I ? await Eae(n, g.session_key, x, I) : await Gz(n, g.session_key, x, $), v.result = {
                    session_key: g.session_key,
                    consumer_id: x,
                    committed_cursor: $.id,
                    committed: !0
                }
            } else if (h.method === "job.create") {
                if (!dT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                await i.init(), await i.createJob(g.id, {
                    cron: g.cron,
                    notify: g.notify,
                    owner_session: g.owner_session,
                    cwd_rel: g.cwd_rel
                }, g.instruction);
                let x = createSpineEvent({
                    type: "job.spawn",
                    source: {
                        kind: "job",
                        name: g.id
                    },
                    payload: {
                        job_id: g.id,
                        cron: g.cron
                    }
                });
                await atomicAppendEvent(n, x), v.result = {
                    id: g.id,
                    cron: g.cron
                }
            } else if (h.method === "job.get") {
                if (!fT(h.params)) throw new vn("Invalid params");
                let g = h.params;
                await i.init();
                let x = await i.classifyActiveJob(g.id);
                if (x.kind === "active") v.result = {
                    ...x.job,
                    kind: "active"
                };
                else if (x.kind === "invalid") v.error = {
                    code: k_.INVALID_ACTIVE,
                    message: `Job '${g.id}' active job file exists but is invalid: ${x.reason}`
                };
                else {
                    let k = await i.getArchivedJob(g.id);
                    k ? v.result = {
                        ...k,
                        kind: "archived",
                        archived: !0
                    } : v.error = {
                        code: k_.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (h.method === "job.list") {
                if (!pT(h.params)) throw new vn("Invalid params");
                await i.init();
                let g = await i.listJobs();
                h.params?.summary ? v.result = {
                    jobs: g.map(({
                        content: k,
                        path: E,
                        ...R
                    }) => R)
                } : v.result = {
                    jobs: g
                }
            } else if (h.method === "usage.get") {
                let g = h.params,
                    x = typeof g?.session_key == "string" ? g.session_key : void 0,
                    k = typeof g?.mode == "string" ? g.mode : void 0,
                    E;
                if (g?.since !== void 0 && (E = new Date(g.since), isNaN(E.getTime()) && (E = void 0)), k === "totals") {
                    let R = await readGlobalUsageTotals(n, E);
                    v.result = {
                        totals: R
                    }
                } else if (x) {
                    let R = await readDrainRecords(n, x, E),
                        $ = summarizeDrainRecords(R);
                    v.result = {
                        sessions: {
                            [x]: {
                                summary: $,
                                records: R
                            }
                        }
                    }
                } else {
                    let R = await readAllSessionSummaries(n, E),
                        $ = {};
                    for (let [I, P] of Object.entries(R)) $[I] = {
                        summary: P
                    };
                    v.result = {
                        sessions: $
                    }
                }
            } else if (h.method === "system.status") {
                if (!mT(h.params)) throw new vn("Invalid params");
                let [g, x] = await Promise.all([Zg(n), sm(n)]), k = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, E = e.sessionManager?.listActors(), R = new Set, $ = [];
                if (E)
                    for (let [P, C] of E) {
                        if (C.status === "ended" || !qz(P)) continue;
                        R.add(P);
                        let L = s.get(P);
                        $.push({
                            session_key: P,
                            display_name: L?.display_name ?? null,
                            status: C.status,
                            health: L?.last_error ? "error" : C.health,
                            last_event_at: L?.last_event_at ?? null,
                            created_at: L?.created_at ?? null,
                            cwd: L?.cwd ?? null,
                            last_error: L?.last_error ?? null,
                            runtime: C.runtime
                        })
                    }
                for (let P of s.listUserVisible()) R.has(P.session_key) || $.push({
                    session_key: P.session_key,
                    display_name: P.display_name ?? null,
                    status: "idle",
                    health: P.last_error ? "error" : "ok",
                    last_event_at: P.last_event_at ?? null,
                    created_at: P.created_at ?? null,
                    cwd: P.cwd ?? null,
                    last_error: P.last_error ?? null
                });
                let I = {
                    health: {
                        gateway: g?.health?.gateway ?? "down",
                        meta_session: g?.health?.meta_session ?? "down"
                    },
                    cadence: {
                        mode: g?.cadence?.mode ?? "unknown",
                        last_tick: g?.cadence?.last_tick ?? null,
                        interval_ms: k
                    },
                    sessions: $,
                    subconscious: {
                        partitions: x.items.map(P => ({
                            name: P.name,
                            done: P.done
                        }))
                    },
                    memory_check: buildMemoryCheckStatus(n)
                };
                v.result = I
            } else if (h.method === "system.config") {
                if (!hT(h.params)) throw new vn("Invalid params");
                v.result = await Ret(n)
            } else if (h.method === "spine.tail") {
                if (!gT(h.params)) throw new vn("Invalid params");
                let g = h.params ?? {},
                    x = await Ace(n, {
                        limit: g.limit,
                        after_id: g.after_id
                    });
                v.result = x
            } else v.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (g) {
            g instanceof vn ? v.error = {
                code: g.code,
                message: g.message
            } : v.error = {
                code: -32603,
                message: "Internal error",
                data: String(g)
            }
        }
        return v
    }
    return t.post("/rpc", async (h, _) => {
        let b = h.body;
        if (!S_(b)) return ie("[daemon] invalid JSON-RPC request"), _.code(400).send({
            error: "Invalid JSON-RPC request"
        });
        let v = await m(b),
            w = v.__triggerShutdown;
        w && delete v.__triggerShutdown, await _.code(200).send(v), w && setImmediate(() => process.kill(process.pid, "SIGTERM"))
    }), t.register(async function(h) {
        h.get("/ws", {
            websocket: !0
        }, _ => {
            let b = `ws_${++l}`,
                v = null,
                w = "",
                g = new Set,
                x = !1;
            J("[daemon] ws connected", {
                subscriberId: b
            });
            let k = (R, $ = !0) => {
                try {
                    _.send(JSON.stringify(R))
                } catch (I) {
                    throw I instanceof Error ? I : new Error(String(I))
                }
                if ($ && R.method === "session.output") {
                    let {
                        session_key: I,
                        record: P
                    } = R.params;
                    if (!w) return;
                    Jz(n, I, w, P).catch(C => {
                        ie("[daemon] failed to advance delivery cursor", {
                            subscriberId: b,
                            sessionKey: I,
                            consumerId: w,
                            error: String(C)
                        })
                    })
                }
            };
            _.on("message", async R => {
                let $;
                try {
                    $ = JSON.parse(R.toString())
                } catch {
                    _.send(JSON.stringify({
                        jsonrpc: "2.0",
                        id: null,
                        error: {
                            code: -32700,
                            message: "Parse error"
                        }
                    }));
                    return
                }
                if (!S_($)) {
                    _.send(JSON.stringify({
                        jsonrpc: "2.0",
                        id: null,
                        error: {
                            code: -32600,
                            message: "Invalid Request"
                        }
                    }));
                    return
                }
                let I = await m($, {
                        wsSubscriberId: b
                    }),
                    P = null,
                    C = "",
                    L;
                if ($.method === "channel.pull" && I.result && !I.error && Up($.params)) {
                    let K = $.params,
                        Q = K.session_key,
                        W = K.consumer_id.trim(),
                        ae = M2(K.return_mask);
                    v && c.unsubscribe(b), v = Q, w = W, P = Q, C = W, L = K.cursor, J("[daemon] ws pull stream opened", {
                        subscriberId: b,
                        sessionKey: Q,
                        consumerId: W
                    }), g = new Set, x = !0, c.subscribe({
                        id: b,
                        sessionKey: Q,
                        returnMask: ae,
                        acceptStreamEndReasons: K.channel_capabilities?.outbound?.accept_stream_end_reasons,
                        send: Oe => {
                            if (x && Oe.method === "session.output" && Oe.params?.record?.id && g.has(Oe.params.record.id)) {
                                Pe("[daemon] suppressed duplicate output during replay window", {
                                    subscriberId: b,
                                    sessionKey: Q,
                                    recordId: Oe.params.record.id
                                });
                                return
                            }
                            k(Oe)
                        },
                        close: () => {
                            try {
                                _.close()
                            } catch {}
                        }
                    })
                }
                if (P) {
                    let K = Up($.params) ? $.params : void 0;
                    if (!M2(K?.return_mask).includes("final")) {
                        x = !1, g.clear(), _.send(JSON.stringify(I));
                        return
                    }
                    let ae = P,
                        Oe = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                        X = Number.isFinite(Oe) ? Oe : 0;
                    try {
                        let Ue = await Tae({
                            paths: n,
                            sessionKey: ae,
                            consumerId: C,
                            limit: X,
                            cursorOverride: L,
                            send: Nt => k(Nt, !1),
                            onDelivered: async Nt => {
                                g.add(Nt.id), await Jz(n, ae, C, Nt);
                                let Se = await Jo(n, Nt.channel_kind, Nt.id);
                                Se && Se.status !== "sent" && await Rl(n, Se, {
                                    status: "sent"
                                }), await Yf(n, Nt.id)
                            }
                        });
                        Ue > 0 && Pe("[daemon] replayed outbox backlog", {
                            subscriberId: b,
                            sessionKey: ae,
                            consumerId: C,
                            replayed: Ue
                        })
                    } catch (Ue) {
                        ie("[daemon] backlog replay failed", {
                            subscriberId: b,
                            sessionKey: ae,
                            consumerId: C,
                            error: String(Ue)
                        })
                    }
                    x = !1, g.clear()
                }
                let G = I.__triggerShutdown;
                G && delete I.__triggerShutdown, _.send(JSON.stringify(I)), G && setImmediate(() => process.kill(process.pid, "SIGTERM"))
            });
            let E = () => {
                v && c.unsubscribe(b)
            };
            _.on("close", () => {
                E(), J("[daemon] ws closed", {
                    subscriberId: b,
                    sessionKey: v
                })
            }), _.on("error", () => {
                E(), ie("[daemon] ws error", {
                    subscriberId: b,
                    sessionKey: v
                })
            })
        })
    }), {
        app: t,
        bus: r,
        subscriptions: c,
        async start(h, _ = "0.0.0.0") {
            let b = await Pce(n);
            if (!b.acquired) throw new Error(`Runtime lock already held by pid=${b.lock?.pid??"unknown"} at ${b.lockPath}`);
            d = !0;
            try {
                await t.listen({
                    port: h,
                    host: _
                })
            } catch (w) {
                throw d && (await nU(n), d = !1), w
            }
            let v = yhe("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            p = setInterval(() => {
                $ce(n).catch(() => {})
            }, v), p.unref?.()
        },
        async stop() {
            c.stop(), await t.close(), p && (clearInterval(p), p = null), d && (await nU(n), d = !1)
        }
    }
}
