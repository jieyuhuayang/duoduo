// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createDaemon  (minified: tet, daemon.pretty.js:78107)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDaemon(e) {
 let t = (0, Pme.default)({
   logger: !1
  }),
  {
   paths: n,
   bus: r
  } = e,
  i = new vo(n),
  o = e.sessionIndex ?? One();
 Ste((g, v) => {
  if (v === "removed") {
   o.remove(g);
   return
  }
  si(g, async () => {
    if (!Ni(g)) try {
     let [S, _] = await Promise.all([Mt(n, g), _a(n, g)]);
     U1(o, g, S, _)
    } catch {}
   })
   .catch(() => {})
 }), jX(g => {
  o.remove(g)
 });
 let s = Ho(process.env),
  u = {
   version: PQe(import.meta.url)("../../package.json")
    .version,
   runtime_id: qQe(n.runtimeDir),
   runtime_mode: s,
   runtime_dir: ur.resolve(n.runtimeDir),
   work_dir: ur.resolve(n.workDir),
   kernel_dir: ur.resolve(n.kernelDir)
  },
  l = e.subscriptions ?? H1();
 l.start(r);
 let d = 0,
  p = !1,
  f = null;
 t.register($me.default), t.get("/healthz", async () => xne()), t.get("/dashboard", async (g, v) => {
  let S = ur.join(n.bootstrapDir, "dashboard.html");
  try {
   let _ = await km.readFile(S, "utf8");
   return v.type("text/html")
    .send(_)
  } catch {
   return v.code(404)
    .send("Dashboard not found")
  }
 }), t.get("/readyz", async (g, v) => await kne(n) ? {
   status: "ok"
  } : v.code(503)
  .send({
   status: "not_ready"
  }));
 let m = new Set(["spine.tail", "system.status", "usage.get", "job.list"]);
 async function h(g, v) {
  (m.has(g.method) ? NX : Ue)("[daemon] rpc request", {
   id: g.id ?? null,
   method: g.method,
   session_key: typeof g.params == "object" && g.params !== null ? g.params.session_key : void 0,
   ws: !!v?.wsSubscriberId
  });
  let _ = {
    jsonrpc: "2.0",
    id: g.id ?? null
   },
   b = {
    cancelSession: async w => {
     if (!e.sessionManager) return {
      interrupted: !1,
      reason: "session_manager_unavailable"
     };
     let x = await e.sessionManager.interruptSession(w);
     return {
      interrupted: x.interrupted,
      reason: x.reason
     }
    },
    clearSession: async w => e.sessionManager ? e.sessionManager.clearSdkSession(w) : {
     cleared: !1,
     reason: "session_manager_unavailable"
    },
    listActors: () => {
     if (!e.sessionManager) return new Map;
     let w = e.sessionManager.listActors(),
      x = new Map;
     for (let [R, T] of w) x.set(R, {
      sessionKey: T.sessionKey,
      status: T.status,
      health: T.health,
      idleSince: T.idleSince,
      origin: T.origin
     });
     return x
    },
    listPersistentSessions: () => o.listUserVisible()
     .map(w => ({
      session_key: w.session_key,
      cwd: w.cwd,
      created_at: w.created_at,
      last_event_at: w.last_event_at,
      last_error: w.last_error
     })),
    getSessionModel: async w => e.sessionManager ? e.sessionManager.getSessionModelView(w) : {
     runtime: "claude",
     hasLiveQuery: !1
    },
    setSessionModel: async (w, x) => e.sessionManager ? e.sessionManager.setSessionModel(w, x) : {
     ok: !1,
     reason: "not_running"
    }
   };
  try {
   if (g.method === "system.shutdown") _.result = {
    ok: !0
   }, _.__triggerShutdown = !0;
   else if (g.method === "system.runtime.info") {
    if (!Pk(g.params)) throw new bn("Invalid params");
    if (!Ik(u)) throw new Error("invalid runtime info");
    let w = g.params ?? {};
    if (w.source_kind) {
     let R = {
      new_session_workspace: (await Wg(n, {
        channel_kind: w.source_kind
       }))
       ?.new_session_workspace
     };
     _.result = {
      ...u,
      channel_defaults: R
     }
    } else _.result = u
   } else if (g.method === "channel.describe") {
    if (!Fk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    _.result = await ZQe(n, o, w)
   } else if (g.method === "session.archive") {
    if (!$k(g.params)) throw new bn("Invalid params");
    let w = g.params;
    _.result = await WQe(n, e.sessionManager, o, w)
   } else if (g.method === "session.list") {
    if (!Ok(g.params)) throw new bn("Invalid params");
    let w = g.params ?? {};
    _.result = await KQe(o, i, w)
   } else if (g.method === "session.set_alias") {
    if (!Ck(g.params)) throw new bn("Invalid params");
    let w = g.params;
    _.result = await YQe(n, o, w)
   } else if (g.method === "session.notify") {
    if (!Ak(g.params)) throw new bn("Invalid params");
    let w = g.params;
    _.result = await XQe(n, r, o, w)
   } else if (g.method === "session.compact") {
    if (!Nk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    _.result = await QQe(n, r, o, b, w)
   } else if (g.method === "channel.spawn") {
    if (!Uk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    _.result = await eet(n, s, w)
   } else if (g.method === "channel.ingress") {
    if (!Dk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    if (Eme("channel.ingress", w, v), Ni(w.session_key)) return _.error = {
     code: -32011,
     message: `Session is being archived. Retry after session.archive completes. session_key=${w.session_key}`
    }, _;
    let x = w.source_kind ?? (v?.wsSubscriberId ? "ws" : "rpc"),
     R = await Rme({
      paths: n,
      runtimeMode: s,
      sessionKey: w.session_key,
      cwdAbs: w.cwd_abs,
      channelKind: x,
      channelId: w.channel_id
     });
    if (!R.ok) return _.error = {
     code: -32010,
     message: R.guidance
    }, _;
    let T = await wne(n, {
     sessionKey: w.session_key,
     sourceKind: x,
     sourceName: w.channel_id ?? v?.wsSubscriberId,
     sourceChannelId: w.channel_id,
     text: w.text ?? "",
     attachments: w.attachments,
     dedupSourceId: w.idempotency_key,
     rawPayload: {
      jsonrpc: g.jsonrpc,
      method: g.method,
      params: g.params
     }
    }, {
     bus: r,
     gatewayCommands: b
    });
    w.channel_id && await It(n, w.session_key, {
     source_channel_id: w.channel_id
    }), Si("ingress_received", T.event.id, {
     sessionKey: w.session_key
    }), T.routing.enqueued && r.emit("session.wake", {
     sessionKey: w.session_key,
     displayName: w.display_name,
     preempt: _2(w.text)
    }), _.result = {
     event_id: T.event.id,
     gateway_response: T.gatewayResponse,
     outbox_id: T.gatewayOutboxId
    }
   } else if (g.method === "channel.command") {
    if (!Mk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    if (Eme("channel.command", w, v), Ni(w.session_key)) return _.error = {
     code: -32011,
     message: `Session is being archived. Retry after session.archive completes. session_key=${w.session_key}`
    }, _;
    let x = w.source_kind ?? (v?.wsSubscriberId ? "ws" : "rpc"),
     R = await Rme({
      paths: n,
      runtimeMode: s,
      sessionKey: w.session_key,
      cwdAbs: w.cwd_abs,
      channelKind: x,
      channelId: w.channel_id
     });
    if (!R.ok) return _.error = {
     code: -32010,
     message: R.guidance
    }, _;
    let T = await L1(n, {
     sessionKey: w.session_key,
     sourceKind: x,
     sourceName: w.channel_id ?? v?.wsSubscriberId,
     sourceChannelId: w.channel_id,
     command: w.command,
     dedupSourceId: w.idempotency_key,
     rawPayload: {
      jsonrpc: g.jsonrpc,
      method: g.method,
      params: g.params
     }
    }, {
     bus: r,
     gatewayCommands: b
    });
    T.routing.enqueued && r.emit("session.wake", {
     sessionKey: w.session_key,
     preempt: _2(w.command)
    }), _.result = {
     event_id: T.event.id,
     gateway_response: T.gatewayResponse,
     outbox_id: T.gatewayOutboxId
    }
   } else if (g.method === "channel.file.upload") {
    if (!jk(g.params)) throw new bn("Invalid params");
    let w = g.params,
     x = await Tne(n, w.session_key, w.name, w.mime, w.content_base64, {
      receivedVia: v?.wsSubscriberId ? "ws" : "rpc",
      sourceName: v?.wsSubscriberId
     });
    _.result = x
   } else if (g.method === "channel.file.download") {
    if (!Lk(g.params)) throw new bn("Invalid params");
    let w = g.params,
     x = await Rne(w.path);
    _.result = {
     content_base64: x
    }
   } else if (g.method === "channel.pull") {
    if (!zf(g.params)) throw new bn("Invalid params");
    let w = g.params,
     x = w.consumer_id.trim(),
     R = y2(w.return_mask),
     T = R.includes("final");
    if (v?.wsSubscriberId) return await UQe({
     paths: n,
     sessionKey: w.session_key,
     declaredBy: x,
     capabilities: w.channel_capabilities
    }), _.result = {
     opened: !0,
     session_key: w.session_key,
     consumer_id: x,
     cursor: w.cursor,
     return_mask: R
    }, _;
    let P = T ? await G1({
     paths: n,
     sessionKey: w.session_key,
     consumerId: x,
     limit: w.limit ?? Number(process.env.ALADUO_PULL_LIMIT ?? 50),
     cursorOverride: w.cursor
    }) : [];
    _.result = {
     session_key: w.session_key,
     consumer_id: x,
     return_mask: R,
     records: P,
     next_cursor: P.length > 0 ? P[P.length - 1].id : void 0,
     idle: P.length === 0
    }
   } else if (g.method === "channel.ack") {
    if (!zk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    if (Ni(w.session_key)) return _.error = {
     code: -32002,
     message: `Session is being archived. Retry after session.archive completes. session_key=${w.session_key}`
    }, _;
    let x = w.consumer_id.trim(),
     R = w.cursor.trim(),
     T = w.session_key.indexOf(":"),
     P = T > 0 ? w.session_key.slice(0, T) : null,
     E = null;
    if (P && (E = await $s(n, P, R)), !E || E.session_key !== w.session_key) {
     let A = await Vte(n, w.session_key, R);
     return A ? (await J1(n, w.session_key, x, A), _.result = {
      session_key: w.session_key,
      consumer_id: x,
      committed_cursor: A.id,
      committed: !0
     }, _) : (_.error = {
      code: -32602,
      message: "Invalid cursor"
     }, _)
    }
    let O = await uo(n, R);
    if (!O) try {
     await kk(n, w.session_key), O = await uo(n, R)
    } catch {}
    O ? await qne(n, w.session_key, x, O) : await J1(n, w.session_key, x, E), _.result = {
     session_key: w.session_key,
     consumer_id: x,
     committed_cursor: E.id,
     committed: !0
    }
   } else if (g.method === "job.create") {
    if (!qk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    await i.init(), await i.createJob(w.id, {
     cron: w.cron,
     notify: w.notify,
     owner_session: w.owner_session,
     cwd_rel: w.cwd_rel
    }, w.instruction);
    let x = createSpineEvent({
     type: "job.spawn",
     source: {
      kind: "job",
      name: w.id
     },
     payload: {
      job_id: w.id,
      cron: w.cron
     }
    });
    await atomicAppendEvent(n, x), _.result = {
     id: w.id,
     cron: w.cron
    }
   } else if (g.method === "job.get") {
    if (!Bk(g.params)) throw new bn("Invalid params");
    let w = g.params;
    await i.init();
    let x = await i.classifyActiveJob(w.id);
    if (x.kind === "active") _.result = {
     ...x.job,
     kind: "active"
    };
    else if (x.kind === "invalid") _.error = {
     code: Vg.INVALID_ACTIVE,
     message: `Job '${w.id}' active job file exists but is invalid: ${x.reason}`
    };
    else {
     let R = await i.getArchivedJob(w.id);
     R ? _.result = {
      ...R,
      kind: "archived",
      archived: !0
     } : _.error = {
      code: Vg.NOT_FOUND,
      message: "Job not found"
     }
    }
   } else if (g.method === "job.list") {
    if (!Hk(g.params)) throw new bn("Invalid params");
    await i.init();
    let w = await i.listJobs();
    g.params?.summary ? _.result = {
     jobs: w.map(({
      content: R,
      path: T,
      ...P
     }) => P)
    } : _.result = {
     jobs: w
    }
   } else if (g.method === "usage.get") {
    let w = g.params,
     x = typeof w?.session_key == "string" ? w.session_key : void 0,
     R = typeof w?.mode == "string" ? w.mode : void 0,
     T;
    if (w?.since !== void 0 && (T = new Date(w.since), isNaN(T.getTime()) && (T = void 0)), R === "totals") {
     let P = await readGlobalUsageTotals(n, T);
     _.result = {
      totals: P
     }
    } else if (x) {
     let P = await readDrainRecords(n, x, T),
      E = summarizeDrainRecords(P);
     _.result = {
      sessions: {
       [x]: {
        summary: E,
        records: P
       }
      }
     }
    } else {
     let P = await readAllSessionSummaries(n, T),
      E = {};
     for (let [O, A] of Object.entries(P)) E[O] = {
      summary: A
     };
     _.result = {
      sessions: E
     }
    }
   } else if (g.method === "system.status") {
    if (!Vk(g.params)) throw new bn("Invalid params");
    let [w, x] = await Promise.all([Ig(n), np(n)]), R = parseInt(process.env.ALADUO_CADENCE_INTERVAL_MS ?? "2220000", 10) || 222e4, T = e.sessionManager?.listActors(), P = new Set, E = [];
    if (T)
     for (let [A, D] of T) {
      if (D.status === "ended" || !F1(A)) continue;
      P.add(A);
      let H = o.get(A);
      E.push({
       session_key: A,
       display_name: H?.display_name ?? null,
       status: D.status,
       health: H?.last_error ? "error" : D.health,
       last_event_at: H?.last_event_at ?? null,
       created_at: H?.created_at ?? null,
       cwd: H?.cwd ?? null,
       last_error: H?.last_error ?? null,
       runtime: D.runtime
      })
     }
    for (let A of o.listUserVisible()) P.has(A.session_key) || E.push({
     session_key: A.session_key,
     display_name: A.display_name ?? null,
     status: "idle",
     health: A.last_error ? "error" : "ok",
     last_event_at: A.last_event_at ?? null,
     created_at: A.created_at ?? null,
     cwd: A.cwd ?? null,
     last_error: A.last_error ?? null
    });
    let O = {
     health: {
      gateway: w?.health?.gateway ?? "down",
      meta_session: w?.health?.meta_session ?? "down"
     },
     cadence: {
      mode: w?.cadence?.mode ?? "unknown",
      last_tick: w?.cadence?.last_tick ?? null,
      interval_ms: R
     },
     sessions: E,
     subconscious: {
      partitions: x.items.map(A => ({
       name: A.name,
       done: A.done
      }))
     },
     memory_check: buildMemoryCheckStatus(n)
    };
    _.result = O
   } else if (g.method === "system.config") {
    if (!Zk(g.params)) throw new bn("Invalid params");
    _.result = await LQe(n)
   } else if (g.method === "spine.tail") {
    if (!Wk(g.params)) throw new bn("Invalid params");
    let w = g.params ?? {},
     x = await Hie(n, {
      limit: w.limit,
      after_id: w.after_id
     });
    _.result = x
   } else _.error = {
    code: -32601,
    message: "Method not found"
   }
  } catch (w) {
   w instanceof bn ? _.error = {
    code: w.code,
    message: w.message
   } : _.error = {
    code: -32603,
    message: "Internal error",
    data: String(w)
   }
  }
  return _
 }
 return t.post("/rpc", async (g, v) => {
  let S = g.body;
  if (!Hg(S)) return fe("[daemon] invalid JSON-RPC request"), v.code(400)
   .send({
    error: "Invalid JSON-RPC request"
   });
  let _ = await h(S),
   b = _.__triggerShutdown;
  b && delete _.__triggerShutdown, await v.code(200)
   .send(_), b && setImmediate(() => process.kill(process.pid, "SIGTERM"))
 }), t.register(async function(g) {
  g.get("/ws", {
   websocket: !0
  }, v => {
   let S = `ws_${++d}`,
    _ = null,
    b = "",
    w = new Set,
    x = !1;
   ee("[daemon] ws connected", {
    subscriberId: S
   });
   let R = (P, E = !0) => {
    try {
     v.send(JSON.stringify(P))
    } catch (O) {
     throw O instanceof Error ? O : new Error(String(O))
    }
    if (E && P.method === "session.output") {
     let {
      session_key: O,
      record: A
     } = P.params;
     if (!b) return;
     W1(n, O, b, A)
      .catch(D => {
       fe("[daemon] failed to advance delivery cursor", {
        subscriberId: S,
        sessionKey: O,
        consumerId: b,
        error: String(D)
       })
      })
    }
   };
   v.on("message", async P => {
    let E;
    try {
     E = JSON.parse(P.toString())
    } catch {
     v.send(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
       code: -32700,
       message: "Parse error"
      }
     }));
     return
    }
    if (!Hg(E)) {
     v.send(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
       code: -32600,
       message: "Invalid Request"
      }
     }));
     return
    }
    let O = await h(E, {
      wsSubscriberId: S
     }),
     A = null,
     D = "",
     H;
    if (E.method === "channel.pull" && O.result && !O.error && zf(E.params)) {
     let te = E.params,
      z = te.session_key,
      xe = te.consumer_id.trim(),
      Ne = y2(te.return_mask);
     _ && l.unsubscribe(S), _ = z, b = xe, A = z, D = xe, H = te.cursor, ee("[daemon] ws pull stream opened", {
      subscriberId: S,
      sessionKey: z,
      consumerId: xe
     }), w = new Set, x = !0, l.subscribe({
      id: S,
      sessionKey: z,
      returnMask: Ne,
      acceptStreamEndReasons: te.channel_capabilities?.outbound?.accept_stream_end_reasons,
      send: ve => {
       if (x && ve.method === "session.output" && ve.params?.record?.id && w.has(ve.params.record.id)) {
        Ue("[daemon] suppressed duplicate output during replay window", {
         subscriberId: S,
         sessionKey: z,
         recordId: ve.params.record.id
        });
        return
       }
       R(ve)
      },
      close: () => {
       try {
        v.close()
       } catch {}
      }
     })
    }
    if (A) {
     let te = zf(E.params) ? E.params : void 0;
     if (!y2(te?.return_mask)
      .includes("final")) {
      x = !1, w.clear(), v.send(JSON.stringify(O));
      return
     }
     let Ne = A,
      ve = Number(process.env.ALADUO_SUBSCRIBE_REPLAY_LIMIT ?? 0),
      Tt = Number.isFinite(ve) ? ve : 0;
     try {
      let Ht = await Bne({
       paths: n,
       sessionKey: Ne,
       consumerId: D,
       limit: Tt,
       cursorOverride: H,
       send: _e => R(_e, !1),
       onDelivered: async _e => {
        w.add(_e.id), await W1(n, Ne, D, _e);
        let Ze = await $s(n, _e.channel_kind, _e.id);
        Ze && Ze.status !== "sent" && await gl(n, Ze, {
         status: "sent"
        }), await Lf(n, _e.id)
       }
      });
      Ht > 0 && Ue("[daemon] replayed outbox backlog", {
       subscriberId: S,
       sessionKey: Ne,
       consumerId: D,
       replayed: Ht
      })
     } catch (Ht) {
      fe("[daemon] backlog replay failed", {
       subscriberId: S,
       sessionKey: Ne,
       consumerId: D,
       error: String(Ht)
      })
     }
     x = !1, w.clear()
    }
    let K = O.__triggerShutdown;
    K && delete O.__triggerShutdown, v.send(JSON.stringify(O)), K && setImmediate(() => process.kill(process.pid, "SIGTERM"))
   });
   let T = () => {
    _ && l.unsubscribe(S)
   };
   v.on("close", () => {
    T(), ee("[daemon] ws closed", {
     subscriberId: S,
     sessionKey: _
    })
   }), v.on("error", () => {
    T(), fe("[daemon] ws error", {
     subscriberId: S,
     sessionKey: _
    })
   })
  })
 }), {
  app: t,
  bus: r,
  subscriptions: l,
  async start(g, v = "0.0.0.0") {
   let S = await Fie(n);
   if (!S.acquired) throw new Error(`Runtime lock already held by pid=${S.lock?.pid??"unknown"} at ${S.lockPath}`);
   p = !0;
   try {
    await t.listen({
     port: g,
     host: v
    })
   } catch (b) {
    throw p && (await Qj(n), p = !1), b
   }
   let _ = Cme("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4, 1e3);
   f = setInterval(() => {
    Uie(n)
     .catch(() => {})
   }, _), f.unref?.()
  },
  async stop() {
   l.stop(), await t.close(), f && (clearInterval(f), f = null), p && (await Qj(n), p = !1)
  }
 }
}
