// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: utt, daemon.pretty.js:78204)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
    let t = (0, Ihe.default)({
            logger: !1
        }),
        {
            paths: n,
            bus: r
        } = e,
        i = new rs(n),
        s = e.sessionIndex ?? yae();
    Fte((h, _) => {
        if (_ === "removed") {
            s.remove(h);
            return
        }
        mi(h, async () => {
            if (!lr(h)) try {
                let [b, w] = await Promise.all([At(n, h), ao(n, h)]);
                Zz(s, h, b, w)
            } catch {}
        }).catch(() => {})
    }), iX(h => {
        s.remove(h)
    });
    let c = {
            version: Det(import.meta.url)("../../package.json").version,
            runtime_id: Wet(n.runtimeDir),
            runtime_mode: "host",
            runtime_dir: cs.resolve(n.runtimeDir),
            work_dir: cs.resolve(n.workDir),
            kernel_dir: cs.resolve(n.kernelDir)
        },
        u = e.subscriptions ?? Gz();
    u.start(r);
    let l = 0,
        d = !1,
        p = null;
    t.register(Phe.default), t.get("/healthz", async () => Lne()), t.get("/dashboard", async (h, _) => {
        let b = cs.join(n.bootstrapDir, "dashboard.html");
        try {
            let w = await Nb.readFile(b, "utf8");
            return _.type("text/html").send(w)
        } catch {
            return _.code(404).send("Dashboard not found")
        }
    }), t.get("/readyz", async (h, _) => await jne(n) ? {
        status: "ok"
    } : _.code(503).send({
        status: "not_ready"
    }));
    let f = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
    async function m(h, _) {
        (f.has(h.method) ? nX : Pe)("[daemon] rpc request", {
            id: h.id ?? null,
            method: h.method,
            session_key: typeof h.params == "object" && h.params !== null ? h.params.session_key : void 0,
            ws: !!_?.wsSubscriberId
        });
        let w = {
                jsonrpc: "2.0",
                id: h.id ?? null
            },
            v = {
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
            if (h.method === "system.shutdown") w.result = {
                ok: !0
            }, w.__triggerShutdown = !0;
            else if (h.method === "system.runtime.info") {
                if (!QE(h.params)) throw new _n("Invalid params");
                if (!YE(c)) throw new Error("invalid runtime info");
                let g = h.params ?? {};
                if (g.source_kind) {
                    let k = {
                        new_session_workspace: (await Vp(n, {
                            channel_kind: g.source_kind
                        }))?.new_session_workspace
                    };
                    w.result = {
                        ...c,
                        channel_defaults: k
                    }
                } else w.result = c
            } else if (h.method === "channel.describe") {
                if (!lT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await Qet(n, s, g)
            } else if (h.method === "session.archive") {
                if (!XE(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await Xet(n, e.sessionManager, s, g)
            } else if (h.method === "session.list") {
                if (!eT(h.params)) throw new _n("Invalid params");
                let g = h.params ?? {};
                w.result = await ntt(s, i, g)
            } else if (h.method === "session.set_alias") {
                if (!tT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await rtt(n, s, g)
            } else if (h.method === "session.notify") {
                if (!nT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await itt(n, r, s, g)
            } else if (h.method === "session.compact") {
                if (!rT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await stt(n, r, s, v, g)
            } else if (h.method === "session.config") {
                if (!iT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await att(n, s, g)
            } else if (h.method === "channel.spawn") {
                if (!dT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                w.result = await ctt(n, g)
            } else if (h.method === "channel.ingress") {
                if (!sT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                if (She("channel.ingress", g, _), lr(g.session_key)) return w.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${g.session_key}`
                }, w;
                let x = g.source_kind ?? (_?.wsSubscriberId ? "ws" : "rpc"),
                    k = await khe({
                        paths: n,
                        sessionKey: g.session_key,
                        cwdAbs: g.cwd_abs,
                        channelKind: x,
                        channelId: g.channel_id
                    });
                if (!k.ok) return w.error = {
                    code: -32010,
                    message: k.guidance
                }, w;
                let E = await Nne(n, {
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
                    gatewayCommands: v
                });
                g.channel_id && await lt(n, g.session_key, {
                    source_channel_id: g.channel_id
                }), Ci("ingress_received", E.event.id, {
                    sessionKey: g.session_key
                }), E.routing.enqueued && r.emit("session.wake", {
                    sessionKey: g.session_key,
                    displayName: g.display_name,
                    preempt: B2(g.text)
                }), w.result = {
                    event_id: E.event.id,
                    gateway_response: E.gatewayResponse,
                    outbox_id: E.gatewayOutboxId
                }
            } else if (h.method === "channel.command") {
                if (!cT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                if (She("channel.command", g, _), lr(g.session_key)) return w.error = {
                    code: -32011,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${g.session_key}`
                }, w;
                let x = g.source_kind ?? (_?.wsSubscriberId ? "ws" : "rpc"),
                    k = await khe({
                        paths: n,
                        sessionKey: g.session_key,
                        cwdAbs: g.cwd_abs,
                        channelKind: x,
                        channelId: g.channel_id
                    });
                if (!k.ok) return w.error = {
                    code: -32010,
                    message: k.guidance
                }, w;
                let E = await py(n, {
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
                    gatewayCommands: v
                });
                E.routing.enqueued && r.emit("session.wake", {
                    sessionKey: g.session_key,
                    preempt: B2(g.command)
                }), w.result = {
                    event_id: E.event.id,
                    gateway_response: E.gatewayResponse,
                    outbox_id: E.gatewayOutboxId
                }
            } else if (h.method === "channel.file.upload") {
                if (!oT(h.params)) throw new _n("Invalid params");
                let g = h.params,
                    x = await iae(n, g.session_key, g.name, g.mime, g.content_base64, {
                        receivedVia: _?.wsSubscriberId ? "ws" : "rpc",
                        sourceName: _?.wsSubscriberId
                    });
                w.result = x
            } else if (h.method === "channel.file.download") {
                if (!aT(h.params)) throw new _n("Invalid params");
                let g = h.params,
                    x = await sae(g.path);
                w.result = {
                    content_base64: x
                }
            } else if (h.method === "channel.pull") {
                if (!Hp(h.params)) throw new _n("Invalid params");
                let g = h.params,
                    x = g.consumer_id.trim(),
                    k = q2(g.return_mask),
                    E = k.includes("final");
                if (_?.wsSubscriberId) return await Jet({
                    paths: n,
                    sessionKey: g.session_key,
                    declaredBy: x,
                    capabilities: g.channel_capabilities
                }), w.result = {
                    opened: !0,
                    session_key: g.session_key,
                    consumer_id: x,
                    cursor: g.cursor,
                    return_mask: k
                }, w;
                let R = E ? await eF({
                    paths: n,
                    sessionKey: g.session_key,
                    consumerId: x,
                    limit: g.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
                    cursorOverride: g.cursor
                }) : [];
                w.result = {
                    session_key: g.session_key,
                    consumer_id: x,
                    return_mask: k,
                    records: R,
                    next_cursor: R.length > 0 ? R[R.length - 1].id : void 0,
                    idle: R.length === 0
                }
            } else if (h.method === "channel.ack") {
                if (!uT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                if (lr(g.session_key)) return w.error = {
                    code: -32002,
                    message: `Session is being archived. Retry after session.archive completes. session_key=${g.session_key}`
                }, w;
                let x = g.consumer_id.trim(),
                    k = g.cursor.trim(),
                    E = g.session_key.indexOf(":"),
                    R = E > 0 ? g.session_key.slice(0, E) : null,
                    $ = null;
                if (R && ($ = await Go(n, R, k)), !$ || $.session_key !== g.session_key) {
                    let P = await rne(n, g.session_key, k);
                    return P ? (await Xz(n, g.session_key, x, P), w.result = {
                        session_key: g.session_key,
                        consumer_id: x,
                        committed_cursor: P.id,
                        committed: !0
                    }, w) : (w.error = {
                        code: -32602,
                        message: "Invalid cursor"
                    }, w)
                }
                let I = await Rs(n, k);
                if (!I) try {
                    await Bk(n, g.session_key), I = await Rs(n, k)
                } catch {}
                I ? await Nae(n, g.session_key, x, I) : await Xz(n, g.session_key, x, $), w.result = {
                    session_key: g.session_key,
                    consumer_id: x,
                    committed_cursor: $.id,
                    committed: !0
                }
            } else if (h.method === "job.create") {
                if (!fT(h.params)) throw new _n("Invalid params");
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
                await atomicAppendEvent(n, x), w.result = {
                    id: g.id,
                    cron: g.cron
                }
            } else if (h.method === "job.get") {
                if (!pT(h.params)) throw new _n("Invalid params");
                let g = h.params;
                await i.init();
                let x = await i.classifyActiveJob(g.id);
                if (x.kind === "active") w.result = {
                    ...x.job,
                    kind: "active"
                };
                else if (x.kind === "invalid") w.error = {
                    code: k_.INVALID_ACTIVE,
                    message: `Job '${g.id}' active job file exists but is invalid: ${x.reason}`
                };
                else {
                    let k = await i.getArchivedJob(g.id);
                    k ? w.result = {
                        ...k,
                        kind: "archived",
                        archived: !0
                    } : w.error = {
                        code: k_.NOT_FOUND,
                        message: "Job not found"
                    }
                }
            } else if (h.method === "job.list") {
                if (!mT(h.params)) throw new _n("Invalid params");
                await i.init();
                let g = await i.listJobs();
                h.params?.summary ? w.result = {
                    jobs: g.map(({
                        content: k,
                        path: E,
                        ...R
                    }) => R)
                } : w.result = {
                    jobs: g
                }
            } else if (h.method === "usage.get") {
                let g = h.params,
                    x = typeof g?.session_key == "string" ? g.session_key : void 0,
                    k = typeof g?.mode == "string" ? g.mode : void 0,
                    E;
                if (g?.since !== void 0 && (E = new Date(g.since), isNaN(E.getTime()) && (E = void 0)), k === "totals") {
                    let R = await readGlobalUsageTotals(n, E);
                    w.result = {
                        totals: R
                    }
                } else if (x) {
                    let R = await readDrainRecords(n, x, E),
                        $ = summarizeDrainRecords(R);
                    w.result = {
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
                    w.result = {
                        sessions: $
                    }
                }
            } else if (h.method === "system.status") {
                if (!hT(h.params)) throw new _n("Invalid params");
                let [g, x] = await Promise.all([Gg(n), cm(n)]), k = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, E = e.sessionManager?.listActors(), R = new Set, $ = [];
                if (E)
                    for (let [P, C] of E) {
                        if (C.status === "ended" || !Vz(P)) continue;
                        R.add(P);
                        let j = s.get(P);
                        $.push({
                            session_key: P,
                            display_name: j?.display_name ?? null,
                            status: C.status,
                            health: j?.last_error ? "error" : C.health,
                            last_event_at: j?.last_event_at ?? null,
                            created_at: j?.created_at ?? null,
                            cwd: j?.cwd ?? null,
                            last_error: j?.last_error ?? null,
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
                w.result = I
            } else if (h.method === "system.config") {
                if (!gT(h.params)) throw new _n("Invalid params");
                w.result = await Bet(n)
            } else if (h.method === "spine.tail") {
                if (!yT(h.params)) throw new _n("Invalid params");
                let g = h.params ?? {},
                    x = await Bue(n, {
                        limit: g.limit,
                        after_id: g.after_id
                    });
                w.result = x
            } else w.error = {
                code: -32601,
                message: "Method not found"
            }
        } catch (g) {
            g instanceof _n ? w.error = {
                code: g.code,
                message: g.message
            } : w.error = {
                code: -32603,
                message: "Internal error",
                data: String(g)
            }
        }
        return w
    }
    return t.post("/rpc", async (h, _) => {
        let b = h.body;
        if (!S_(b)) return se("[daemon] invalid JSON-RPC request"), _.code(400).send({
            error: "Invalid JSON-RPC request"
        });
        let w = await m(b),
            v = w.__triggerShutdown;
        v && delete w.__triggerShutdown, await _.code(200).send(w), v && setImmediate(() => process.kill(process.pid, "SIGTERM"))
    }), t.register(async function(h) {
        h.get("/ws", {
            websocket: !0
        }, _ => {
            let b = `ws_${++l}`,
                w = null,
                v = "",
                g = new Set,
                x = !1;
            K("[daemon] ws connected", {
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
                    if (!v) return;
                    Qz(n, I, v, P).catch(C => {
                        se("[daemon] failed to advance delivery cursor", {
                            subscriberId: b,
                            sessionKey: I,
                            consumerId: v,
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
                    j;
                if ($.method === "channel.pull" && I.result && !I.error && Hp($.params)) {
                    let W = $.params,
                        Y = W.session_key,
                        G = W.consumer_id.trim(),
                        ae = q2(W.return_mask);
                    w && u.unsubscribe(b), w = Y, v = G, P = Y, C = G, j = W.cursor, K("[daemon] ws pull stream opened", {
                        subscriberId: b,
                        sessionKey: Y,
                        consumerId: G
                    }), g = new Set, x = !0, u.subscribe({
                        id: b,
                        sessionKey: Y,
                        returnMask: ae,
                        acceptStreamEndReasons: W.channel_capabilities?.outbound?.accept_stream_end_reasons,
                        send: Ce => {
                            if (x && Ce.method === "session.output" && Ce.params?.record?.id && g.has(Ce.params.record.id)) {
                                Pe("[daemon] suppressed duplicate output during replay window", {
                                    subscriberId: b,
                                    sessionKey: Y,
                                    recordId: Ce.params.record.id
                                });
                                return
                            }
                            k(Ce)
                        },
                        close: () => {
                            try {
                                _.close()
                            } catch {}
                        }
                    })
                }
                if (P) {
                    let W = Hp($.params) ? $.params : void 0;
                    if (!q2(W?.return_mask).includes("final")) {
                        x = !1, g.clear(), _.send(JSON.stringify(I));
                        return
                    }
                    let ae = P,
                        Ce = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
                        ue = Number.isFinite(Ce) ? Ce : 0;
                    try {
                        let Ne = await Dae({
                            paths: n,
                            sessionKey: ae,
                            consumerId: C,
                            limit: ue,
                            cursorOverride: j,
                            send: ot => k(ot, !1),
                            onDelivered: async ot => {
                                g.add(ot.id), await Qz(n, ae, C, ot);
                                let Se = await Go(n, ot.channel_kind, ot.id);
                                Se && Se.status !== "sent" && await Rl(n, Se, {
                                    status: "sent"
                                }), await Xf(n, ot.id)
                            }
                        });
                        Ne > 0 && Pe("[daemon] replayed outbox backlog", {
                            subscriberId: b,
                            sessionKey: ae,
                            consumerId: C,
                            replayed: Ne
                        })
                    } catch (Ne) {
                        se("[daemon] backlog replay failed", {
                            subscriberId: b,
                            sessionKey: ae,
                            consumerId: C,
                            error: String(Ne)
                        })
                    }
                    x = !1, g.clear()
                }
                let X = I.__triggerShutdown;
                X && delete I.__triggerShutdown, _.send(JSON.stringify(I)), X && setImmediate(() => process.kill(process.pid, "SIGTERM"))
            });
            let E = () => {
                w && u.unsubscribe(b)
            };
            _.on("close", () => {
                E(), K("[daemon] ws closed", {
                    subscriberId: b,
                    sessionKey: w
                })
            }), _.on("error", () => {
                E(), se("[daemon] ws error", {
                    subscriberId: b,
                    sessionKey: w
                })
            })
        })
    }), {
        app: t,
        bus: r,
        subscriptions: u,
        async start(h, _ = "0.0.0.0") {
            let b = await zue(n);
            if (!b.acquired) throw new Error(`Runtime lock already held by pid=${b.lock?.pid??"unknown"} at ${b.lockPath}`);
            d = !0;
            try {
                await t.listen({
                    port: h,
                    host: _
                })
            } catch (v) {
                throw d && (await oU(n), d = !1), v
            }
            let w = Ohe("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
            p = setInterval(() => {
                Fue(n).catch(() => {})
            }, w), p.unref?.()
        },
        async stop() {
            u.stop(), await t.close(), p && (clearInterval(p), p = null), d && (await oU(n), d = !1)
        }
    }
}
